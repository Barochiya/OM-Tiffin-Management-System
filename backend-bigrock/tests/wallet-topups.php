<?php
declare(strict_types=1);
require __DIR__.'/wallet.php';

$person=$s->get('tiffins',$id);
$person['phone']='9999999999';
$s->put('tiffins',$person);
$topups=new OMT\WalletTopUps($s,$w,[
    'WALLET_UPI_ID'=>'demo@example','WALLET_QR_TEMPLATE'=>'om_tiffin_wallet_topup_qr',
    'migration'=>['workersEnabled'=>true,'externalMessagesEnabled'=>true],
]);
$before=$w->account($id)['balancePaise'];
$input=['amount'=>'500.25','requestId'=>'11111111-1111-4111-8111-111111111111'];
$row=$topups->create($id,$input)[1]['data'];
parse_str(parse_url($row['upiUri'],PHP_URL_QUERY),$qr);
check($qr['am']==='500.25'&&$qr['pa']==='demo@example','QR matches stored request');
check($w->account($id)['balancePaise']===$before,'Pending does not credit wallet');
check($topups->create($id,$input)[1]['data']['_id']===$row['_id'],'Idempotent generation');
denied(fn()=>$topups->create($id,array_replace($input,['amount'=>'500.251'])),400);
denied(fn()=>$topups->sendQr('unrelated',$row['_id']),404);
$topups->sendQr($id,$row['_id']);
$topups->sendQr($id,$row['_id']);
check(isset($s->events['wallet-qr:'.$row['_id'].':1'])&&!isset($s->events['wallet-qr:'.$row['_id'].':2']),'QR is queued once');
$approval=['action'=>'approved','detail'=>'SYNTHETIC-UTR'];
$topups->decide($row['_id'],$approval,'admin');
denied(fn()=>$topups->decide($row['_id'],$approval,'admin'),409);
check($w->account($id)['balancePaise']===$before+50025,'Exactly one wallet credit');
$second=$topups->create($id,array_replace($input,['requestId'=>'22222222-2222-4222-8222-222222222222']))[1]['data'];
denied(fn()=>$topups->decide($second['_id'],$approval,'admin'),409);
$topups->decide($second['_id'],['action'=>'rejected','detail'=>'Synthetic rejection'],'admin');
check($w->account($id)['balancePaise']===$before+50025,'Rejected request does not credit wallet');
echo "PASS wallet top-ups with synthetic data and mock queue.\n";
