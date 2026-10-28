<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';
final class PgMemory extends OMT\Store {
 public array $records=[],$events=[];public function __construct(){}public function preparePgCollections():void{}
 public function all(string $c):array{return array_values($this->records[$c]??[]);}public function get(string $c,string $id):?array{return $this->records[$c][$id]??null;}
 public function put(string $c,array $d,bool $insert=false):array{$d['_id']??=bin2hex(random_bytes(12));$this->records[$c][$d['_id']]=$d;return $d;}
 public function queue(string $k,array $p):void{$this->events[$k]=$p;}
 public function transaction(callable $f):mixed{$r=$this->records;$e=$this->events;try{return $f($this);}catch(Throwable $x){$this->records=$r;$this->events=$e;throw $x;}}
}
function check(bool $ok):void{if(!$ok)throw new RuntimeException('PG assertion failed');}
function denied(callable $f,int $status):void{try{$f();}catch(OMT\HttpError $e){check($e->status===$status);return;}throw new RuntimeException('Expected rejection');}
$s=new PgMemory();$pg=new OMT\Pg($s);$actor=str_repeat('a',24);$base=['name'=>'Synthetic Student','phone'=>'9409380470','monthlyFee'=>8100,'reminderDay'=>29,'startMonth'=>'2026-10','active'=>true,'messagesEnabled'=>true];
$a=$pg->save($base,$actor)[1]['data'];$b=$pg->save(array_replace($base,['name'=>'Second','reminderDay'=>1]),$actor)[1]['data'];
$pg->sync('2026-10-28');$pg->sync('2026-10-28');check(count($s->all('pgcharges'))===2);$pg->reminders('2026-10-28');check(count($s->events)===1);$pg->reminders('2026-10-29');check(count($s->events)===2);$pg->reminders('2026-10-30');check(count($s->events)===2);
check(OMT\Pg::due('2027-02',29)==='2027-02-28'&&OMT\Pg::due('2028-02',31)==='2028-02-29');
$c=$s->first('pgcharges',fn($c)=>$c['student']===$a['_id']);$body=['requestId'=>'11111111-1111-4111-8111-111111111111','amount'=>3100,'date'=>'2026-10-28','method'=>'UPI','reference'=>'synthetic'];
$p=$pg->payment($c['_id'],$body,$actor)[1]['data'];$again=$pg->payment($c['_id'],$body,$actor)[1]['data'];check($p['_id']===$again['_id']&&count($s->all('pgpayments'))===1&&$p['snapshot']['pendingAfterPaise']===500000);
denied(fn()=>$pg->payment($c['_id'],array_replace($body,['amount'=>3000]),$actor),409);
denied(fn()=>$pg->payment($c['_id'],array_replace($body,['requestId'=>'22222222-2222-4222-8222-222222222222','amount'=>5001]),$actor),400);
$pg->payment($c['_id'],array_replace($body,['requestId'=>'22222222-2222-4222-8222-222222222222','amount'=>5000]),$actor);check($s->get('pgcharges',$c['_id'])['paidPaise']===810000);
$reminder=array_values(array_filter($s->events,fn($e)=>$e['notificationType']==='reminder'&&$e['to']===$a['phone']));check($pg->prepare($reminder[1])===null);
$edited=$pg->save(array_replace($base,['_id'=>$a['_id'],'revision'=>1,'monthlyFee'=>9000]),$actor,$a['_id'])[1]['data'];check($s->get('pgcharges',$c['_id'])['feePaise']===810000);$pg->sync('2026-11-01');$nov=$s->first('pgcharges',fn($c)=>$c['student']===$a['_id']&&$c['month']==='2026-11');check($nov['feePaise']===900000);
$pg->save(array_replace($base,['revision'=>$edited['revision'],'messagesEnabled'=>false]),$actor,$a['_id']);$before=count($s->events);$pg->reminders('2026-11-29');check(count($s->events)===$before+1);
$r=new OMT\Router($s,['JWT_SECRET'=>'synthetic-secret','CUSTOMER_JWT_SECRET'=>'synthetic-customer-secret']);denied(fn()=>$r->dispatch('GET','/api/pg'),401);denied(fn()=>$r->dispatch('POST','/api/pg/sync'),401);
check(!$s->all('tiffins')&&!$s->all('payments')&&!$s->all('employees'));echo "PASS PG: individual reminder days, month-end/leap-year, no duplicate fees/messages/payments, partial/full/overpayment, immutable fee history, future fee edits, OFF cancellation, admin authorization and isolated records. Synthetic only.\n";
