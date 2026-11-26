<?php
declare(strict_types=1);
require __DIR__.'/wallet.php';

$person=$s->get('tiffins',$id);
$person['phone']='9999999999';
$s->put('tiffins',$person);
$topups=new OMT\WalletTopUps($s,$w,[
    'WALLET_QR_TEMPLATE'=>'om_tiffin_wallet_topup_qr_image',
    'migration'=>['workersEnabled'=>true,'externalMessagesEnabled'=>true],
]);
$design=$s->put('documentdesigns',['key'=>'documents','bill'=>['upiId'=>'demo@example']],true);
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
$design['bill']['upiId']='updated@example';
$s->put('documentdesigns',$design);
$second=$topups->create($id,array_replace($input,['requestId'=>'22222222-2222-4222-8222-222222222222']))[1]['data'];
parse_str(parse_url($second['upiUri'],PHP_URL_QUERY),$updatedQr);
check($updatedQr['pa']==='updated@example','New QR follows saved Payment UPI ID');
check($topups->create($id,$input)[1]['data']['upiUri']===$row['upiUri'],'Existing request keeps original payment details');
denied(fn()=>$topups->decide($second['_id'],$approval,'admin'),409);
denied(fn()=>$topups->decide($second['_id'],['action'=>'rejected','detail'=>'  '],'admin'),400);
$topups->decide($second['_id'],['action'=>'rejected','detail'=>'Synthetic rejection'],'admin');
check($w->account($id)['balancePaise']===$before+50025,'Rejected request does not credit wallet');
check(!isset($s->events['wallet-credit:'.$second['_id']]),'Rejection does not send a credit confirmation');
$third=$topups->create($id,array_replace($input,['requestId'=>'33333333-3333-4333-8333-333333333333']))[1]['data'];
$topups->decide($third['_id'],['action'=>'approved'],'admin');
check($w->account($id)['balancePaise']===$before+100050,'Approval without reference credits the wallet');
check(isset($s->events['wallet-credit:'.$third['_id']]),'Approval queues a WhatsApp credit confirmation');
echo "PASS wallet top-ups with synthetic data and mock queue.\n";

$guarded=$topups->create($id,array_replace($input,['requestId'=>'44444444-4444-4444-8444-444444444444']))[1]['data'];
$adminId=str_repeat('a',24);
$settings=['JWT_SECRET'=>'synthetic-wallet-review-key','migration'=>['writesEnabled'=>true]];
$s->put('admins',['_id'=>$adminId]);
$router=new OMT\Router($s,$settings);
$token=OMT\signToken(['id'=>$adminId,'type'=>'admin'],$settings['JWT_SECRET'],3600);
$decision='/wallet-top-ups/'.$guarded['_id'].'/decision';
$listing=fn()=>array_column($router->dispatch('GET','/wallet-top-ups',[],[],$token)[1]['data'],'_id');
check(!in_array($guarded['_id'],$listing(),true),'Pending request remains hidden until incoming evidence');
$foreign=$s->put('whatsappmessages',['customer'=>str_repeat('b',24),'direction'=>'incoming','type'=>'image','mediaId'=>'fixture-foreign','whatsappTimestamp'=>gmdate('c')],true);
$proof=$s->put('whatsappmessages',['customer'=>$id,'direction'=>'incoming','type'=>'image','mediaId'=>'fixture-owned','whatsappTimestamp'=>gmdate('c')],true);
$snapshot=[$s->data,$s->events];
check(in_array($guarded['_id'],$listing(),true),'Incoming evidence makes pending request visible');
denied(fn()=>$router->dispatch('POST',$decision,[],['action'=>'approved','proofMessageId'=>$proof['_id']]),401);
denied(fn()=>$router->dispatch('POST',$decision,[],['action'=>'approved','proofSha256'=>str_repeat('a',64)],$token),404);
denied(fn()=>$router->dispatch('POST',$decision,[],['action'=>'approved','proofMessageId'=>$foreign['_id']],$token),400);
check([$s->data,$s->events]===$snapshot,'Evidence alone and rejected approval requests must never write or credit');
echo "PASS wallet review authorization, server-owned evidence, and zero writes from evidence or failed approvals. Synthetic only.\n";
