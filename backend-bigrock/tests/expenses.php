<?php
declare(strict_types=1);
require __DIR__.'/billing.php';
final class ExpenseMemoryStore extends OMT\Store {
 public array $records=[],$events=[];public int $prepares=0;public function __construct(){}
 public function all(string $name):array{return array_values($this->records[$name]??[]);}
 public function get(string $name,string $id):?array{return $this->records[$name][$id]??null;}
 public function put(string $name,array $row,bool $insert=false):array{$row['_id']??=bin2hex(random_bytes(12));if($insert)$row['createdAt']??=gmdate(DATE_ATOM);return $this->records[$name][$row['_id']]=$row;}
 public function transaction(callable $fn):mixed{$before=$this->records;try{return $fn($this);}catch(Throwable $e){$this->records=$before;throw $e;}}
 public function prepareExpenseCollection():void{$this->prepares++;}
 public function queue(string $key,array $payload):void{throw new RuntimeException('Expenses must never queue messages');}
}
$s=new ExpenseMemoryStore();$service=new OMT\Expenses($s);$customer=$s->put('tiffins',['customerName'=>'Synthetic expense income'],true);$cid=$customer['_id'];
$bill=$s->put('bills',['year'=>2026,'month'=>11,'cycle'=>'1','customer'=>$cid,'generatedAt'=>'2026-11-14T10:00:00Z','totalAmount'=>500,'previousPendingAmount'=>0,'paidAmount'=>200,'pendingAmount'=>300,'status'=>'Partial'],true);
$s->put('payments',['bill'=>$bill['_id'],'customer'=>$cid,'amount'=>200,'paymentDate'=>'2026-11-14T10:00:00Z','status'=>'Success'],true);
$s->put('wallettopups',['customer'=>$cid,'amountPaise'=>10000,'reviewedAt'=>'2026-11-14T10:00:00Z','status'=>'approved'],true);
$before=$s->records;$initial=$service->report(['year'=>2026,'month'=>11])[1]['data'];check($s->records===$before&&$s->prepares===0);
check($initial['summary']['incomePaise']===50000&&$initial['summary']['collectionPaise']===20000&&$initial['summary']['expensePaise']===0);
$body=['date'=>'2026-11-14','amount'=>'150.00','category'=>'groceries','title'=>'Synthetic vegetables','paymentMethod'=>'Cash','requestId'=>'expense-test-111111111'];
$expense=$service->save($body,'synthetic-admin')[1]['data'];$after=$s->records;$service->save($body,'synthetic-admin');check($s->records===$after);
denied(fn()=>$service->save([...$body,'amount'=>'151'],'synthetic-admin'),409);
denied(fn()=>$service->save([...$body,'amount'=>'0.001'],'synthetic-admin'),400);
denied(fn()=>$service->save([...$body,'date'=>'2099-01-01'],'synthetic-admin'),400);
$report=$service->report(['year'=>2026,'month'=>11])[1]['data'];check($report['summary']['expensePaise']===15000&&$report['summary']['netEarningsPaise']===35000&&$report['summary']['cashAfterExpensesPaise']===5000);
$cycle=$report['cycles'][0];check($cycle['incomePaise']===50000&&$cycle['collectionPaise']===20000&&$cycle['netPaise']===35000);
$edit=[...$body,'amount'=>'200','revision'=>1,'reason'=>'Synthetic correction','requestId'=>'expense-edit-222222222'];
$updated=$service->save($edit,'synthetic-admin',$expense['_id'])[1]['data'];check($updated['revision']===2&&count($updated['history'])===2);
$after=$s->records;$service->save($edit,'synthetic-admin',$expense['_id']);check($s->records===$after);
denied(fn()=>$service->save([...$edit,'requestId'=>'expense-stale-333333333'],'synthetic-admin',$expense['_id']),409);
$cancel=['revision'=>2,'reason'=>'Synthetic cancellation','requestId'=>'expense-cancel-444444444'];$service->cancel($expense['_id'],$cancel,'synthetic-admin');$after=$s->records;$service->cancel($expense['_id'],$cancel,'synthetic-admin');check($s->records===$after);
$report=$service->report(['year'=>2026,'month'=>11])[1]['data'];check($report['summary']['expensePaise']===0&&$report['summary']['netEarningsPaise']===50000&&count($report['entries'])===1&&$report['entries'][0]['status']==='cancelled');
foreach($before as $collection=>$records)check($s->records[$collection]===$records);
check(count($s->events)===0);
echo "PASS expense entry/correction/cancellation, precise paise totals, monthly/daily invoice-income vs collection, duplicate/stale protection, read-only reports, complete history and preserved existing financial data; synthetic only.\n";

$t=new ExpenseMemoryStore();$c=$t->put('tiffins',['customerName'=>'Synthetic old-cycle receipt'],true);$bill=$t->put('bills',['customer'=>$c['_id'],'year'=>2026,'month'=>10,'cycle'=>'2','generatedAt'=>'2026-11-15T10:00:00Z','totalAmount'=>1000,'previousPendingAmount'=>0,'pendingAmount'=>300,'status'=>'Partial'],true);
$payment=$t->put('payments',['bill'=>$bill['_id'],'customer'=>$c['_id'],'amount'=>700,'amountAppliedPaise'=>70000,'paymentDate'=>'2026-12-10T10:00:00Z','status'=>'Success'],true);$before=$t->records;$e=new OMT\Expenses($t);
$oct=$e->report(['year'=>2026,'month'=>10,'cycle'=>2])[1]['data'];check($oct['summary']['incomePaise']===100000&&$oct['summary']['collectionPaise']===70000);check($oct['receipts'][0]['receivedAt']==='2026-12-10T10:00:00Z');check($e->report(['year'=>2026,'month'=>11])[1]['data']['summary']['collectionPaise']===0);check($e->report(['year'=>2026,'month'=>12])[1]['data']['summary']['incomePaise']===0);check($e->report(['year'=>2026,'month'=>10,'cycle'=>1])[1]['data']['summary']['incomePaise']===0);check($t->records===$before);
echo "PASS original October cycle-2 bill, November generation, December payment: income/receipts belong to October cycle-2 and actual received timestamp is unchanged. No live data access.\n";
