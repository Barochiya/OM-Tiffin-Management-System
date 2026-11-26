<?php
declare(strict_types=1);
require __DIR__.'/billing.php';
$s=new BillingMemoryStore();$b=new OMT\Billing($s);
$person=$s->put('tiffins',['customerName'=>'Synthetic cancellation','advanceBalance'=>0],true);$id=$person['_id'];
$s->put('prices',['breakfast'=>0,'lunch'=>500,'dinner'=>0],true);
$s->put('walletaccounts',['_id'=>substr(hash('sha256','wallet-v1:'.$id),0,24),'customer'=>$id,'balancePaise'=>70000,'sequence'=>0,'opening'=>[]],true);
$b->saveDaily(['customer'=>$id,'date'=>'2026-11-14','lunchQty'=>1]);
$bill=$b->generate(['customer'=>$id,'month'=>11,'year'=>2026,'cycle'=>'1'])[1]['data'];
check((new OMT\Wallet($s))->account($id)['balancePaise']===20000);
$b->cancel($bill['_id'],['reason'=>'Synthetic cancellation'],'admin-test');
check((new OMT\Wallet($s))->account($id)['balancePaise']===70000);
$before=$s->records;$b->cancel($bill['_id'],['reason'=>'Synthetic cancellation'],'admin-test');check($s->records===$before);
denied(fn()=>$b->saveDaily(['customer'=>$id,'date'=>'2026-11-14','lunchQty'=>2]),409);
denied(fn()=>$b->generate(['customer'=>$id,'month'=>11,'year'=>2026,'cycle'=>'1']),409);
denied(fn()=>$b->addPayment(['customer'=>$id,'bill'=>$bill['_id'],'amount'=>1]),409);
check(count($s->all('bills'))===1);
$s->put('payments',['customer'=>'other','transactionId'=>'UTR123','proofSha256'=>str_repeat('a',64),'status'=>'Success'],true);
denied(fn()=>OMT\PaymentEvidence::assertUnused($s,OMT\PaymentEvidence::reference(' utr 123 ')),409);
denied(fn()=>OMT\PaymentEvidence::assertUnused($s,'',str_repeat('a',64)),409);
OMT\PaymentEvidence::assertUnused($s,'NEWREF',str_repeat('b',64));
echo "PASS cancellation restores precharged funds once, blocks period edits and new payments, retains invoice history; cross-customer UTR and SHA256 duplicate rejection. Synthetic only.\n";

// A fractional paise must never appear in invoice figures while the wallet rounds it.
$precisionStore=new BillingMemoryStore();$precisionBilling=new OMT\Billing($precisionStore);
$precisionCustomer=$precisionStore->put('tiffins',['customerName'=>'Synthetic precision','advanceBalance'=>0],true);
$precisionBill=$precisionStore->put('bills',['customer'=>$precisionCustomer['_id'],'totalAmount'=>0.30,'paidAmount'=>0.0,'pendingAmount'=>0.30,'status'=>'Pending'],true);
$precisionInput=['customer'=>$precisionCustomer['_id'],'bill'=>$precisionBill['_id'],'paymentMethod'=>'Cash'];$precisionBefore=$precisionStore->records;
foreach([0.001,0.005,1.001,100000001]as $badAmount)denied(fn()=>$precisionBilling->addPayment([...$precisionInput,'amount'=>$badAmount]),400);
check($precisionStore->records===$precisionBefore);
$precisionBilling->addPayment([...$precisionInput,'amount'=>'0.10']);$precisionBilling->addPayment([...$precisionInput,'amount'=>'0.20']);
$precisionSaved=$precisionStore->get('bills',$precisionBill['_id']);check($precisionSaved['paidAmount']===0.30&&OMT\Wallet::paise($precisionSaved['pendingAmount'])===0&&$precisionSaved['status']==='Paid');
echo "PASS payment precision: fractional paise rejected without writes; 0.10 + 0.20 settles exactly 0.30. Synthetic only.\n";
