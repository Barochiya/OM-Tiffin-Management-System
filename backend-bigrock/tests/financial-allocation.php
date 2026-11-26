<?php
declare(strict_types=1);
require __DIR__.'/billing.php';
foreach([100,500,700] as $credit){
    $s=new BillingMemoryStore();$billing=new OMT\Billing($s);
    $customer=$s->put('tiffins',['customerName'=>'Synthetic Allocation','advanceBalance'=>0],true);$id=$customer['_id'];
    $s->put('prices',['breakfast'=>0,'lunch'=>500,'dinner'=>0],true);
    $accountId=substr(hash('sha256','wallet-v1:'.$id),0,24);
    $s->put('walletaccounts',['_id'=>$accountId,'customer'=>$id,'balancePaise'=>$credit*100,'sequence'=>0,'opening'=>[]],true);
    $billing->saveDaily(['customer'=>$id,'date'=>'2026-11-14','lunchQty'=>1,'confirmUndelivered'=>true]);
    $bill=$billing->generate(['customer'=>$id,'month'=>11,'year'=>2026,'cycle'=>'1'])[1]['data'];
    check($bill['pendingAmount']===max(0,500-$credit));
    check($bill['walletAppliedPaise']===min(500,$credit)*100);
    check((new OMT\Wallet($s))->account($id)['balancePaise']===($credit-500)*100);
    $before=$s->records;
    (new OMT\Wallet($s))->settleBills($id,'synthetic');
    check($s->records===$before);
    if($credit===100){
        $body=['customer'=>$id,'bill'=>$bill['_id'],'amount'=>600,'paymentMethod'=>'UPI','requestId'=>'12345678-1234-1234-1234-123456789abc'];
        $payment=$billing->addPayment($body,'synthetic')[1];
        check($payment['amountAppliedPaise']===40000&&$payment['excessWalletCreditPaise']===20000);
        check((new OMT\Wallet($s))->account($id)['balancePaise']===20000);
        check($s->get('bills',$bill['_id'])['pendingAmount']===0);
        $before=$s->records;$billing->addPayment($body,'synthetic');check($s->records===$before);
        check(count($s->find('wallettransactions',fn($r)=>$r['type']==='excess_credit'))===1);
        $billing->reversePayment($payment['_id'],['reason'=>'Synthetic erroneous receipt'],'admin-test');
        check((new OMT\Wallet($s))->account($id)['balancePaise']===-40000);
        check($s->get('bills',$bill['_id'])['pendingAmount']===400);
        $before=$s->records;$billing->reversePayment($payment['_id'],['reason'=>'Synthetic erroneous receipt'],'admin-test');check($s->records===$before);
        check(count($s->find('wallettransactions',fn($r)=>$r['type']==='payment_reversal'))===1);
    }
}
echo "PASS wallet 100/500/700 against bill 500, precharged meals never debited twice, excess 200 separately credited and approval replay idempotent. Synthetic only.\n";

foreach([200,400]as $received){
    $store=new BillingMemoryStore();$service=new OMT\Billing($store);
    $person=$store->put('tiffins',['customerName'=>'Synthetic partial/exact','advanceBalance'=>0],true);$cid=$person['_id'];
    $store->put('prices',['breakfast'=>0,'lunch'=>500,'dinner'=>0],true);
    $store->put('walletaccounts',['_id'=>substr(hash('sha256','wallet-v1:'.$cid),0,24),'customer'=>$cid,'balancePaise'=>10000,'sequence'=>0,'opening'=>[]],true);
    $service->saveDaily(['customer'=>$cid,'date'=>'2026-11-14','lunchQty'=>1]);$invoice=$service->generate(['customer'=>$cid,'month'=>11,'year'=>2026,'cycle'=>'1'])[1]['data'];
    $result=$service->addPayment(['customer'=>$cid,'bill'=>$invoice['_id'],'amount'=>$received,'requestId'=>'synthetic-exact-partial-'.$received],'admin-test')[1];
    check(OMT\Wallet::paise($store->get('bills',$invoice['_id'])['pendingAmount'])===(400-$received)*100);
    check($result['excessWalletCreditPaise']===0);
}
echo "PASS partial 200 and exact 400 against outstanding 400 preserve the correct remaining balance and create no excess credit.\n";
