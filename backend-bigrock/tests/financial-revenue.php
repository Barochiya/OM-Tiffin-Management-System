<?php
declare(strict_types=1);
require __DIR__.'/billing.php';
$s=new BillingMemoryStore();
$customer=$s->put('tiffins',['customerName'=>'Synthetic Revenue','status'=>'Active'],true);
$id=$customer['_id'];
foreach([['2026-11-14T10:00:00Z',500,0],['2026-11-18T10:00:00Z',900,400],['2026-12-01T10:00:00Z',100,0]] as [$date,$gross,$carry]){
    $s->put('bills',['customer'=>$id,'generatedAt'=>$date,'createdAt'=>$date,'totalAmount'=>$gross,'previousPendingAmount'=>$carry,'paidAmount'=>0,'pendingAmount'=>$gross,'status'=>'Pending'],true);
}
$s->put('payments',['customer'=>$id,'amount'=>700,'status'=>'Success','paymentDate'=>'2026-12-03T10:00:00Z'],true);
$s->put('wallettopups',['customer'=>$id,'amountPaise'=>20000,'status'=>'approved','reviewedAt'=>'2026-11-14T10:00:00Z'],true);
$d=new OMT\Dashboard($s);
$now=new DateTimeImmutable('2026-12-03T18:00:00+05:30');
check($d->get(['year'=>2026,'month'=>11,'cycle'=>1],$now)[1]['stats']['totalRevenue']===500.0);
check($d->get(['year'=>2026,'month'=>11,'cycle'=>2],$now)[1]['stats']['totalRevenue']===500.0);
check($d->get(['year'=>2026,'month'=>11],$now)[1]['stats']['totalRevenue']===1000.0);
check($d->get(['year'=>2026,'month'=>12],$now)[1]['stats']['totalRevenue']===100.0);
check($d->get(['year'=>2026,'month'=>12],$now)[1]['todayCollection']===700.0);
$s->put('walkincustomers',['customerName'=>'Synthetic Walk-in','payments'=>[
    ['approvedBy'=>'synthetic','amount'=>150,'orderTotalPaise'=>150000,'paidAfterPaise'=>15000,'paymentDate'=>'2026-11-14T10:00:00Z'],
    ['approvedBy'=>'synthetic','amount'=>1350,'orderTotalPaise'=>150000,'paidAfterPaise'=>150000,'paymentDate'=>'2026-11-18T10:00:00Z'],
]],true);
check($d->get(['year'=>2026,'month'=>11,'cycle'=>1],$now)[1]['stats']['totalRevenue']===2000.0);
check($d->get(['year'=>2026,'month'=>11,'cycle'=>2],$now)[1]['stats']['totalRevenue']===500.0);
echo "PASS invoice generation date revenue, service-period independence, carry exclusion, wallet funding exclusion, later collections and installment order deduplication. Synthetic only.\n";

$report=$d->financialReport(['year'=>2026,'month'=>11,'cycle'=>1])[1]['data'];
check((float)array_sum(array_column($report['revenue'],'grossAmount'))===2000.0);
check((float)array_sum(array_column($report['collections'],'amount'))===350.0);
$dec=$d->financialReport(['year'=>2026,'month'=>12])[1]['data'];
check(array_sum(array_column($dec['collections'],'amount'))===700);
denied(fn()=>$d->financialReport(['year'=>2026,'cycle'=>1]),400);
echo "PASS separate revenue, receipt-date collection and current outstanding report export.\n";
