<?php
declare(strict_types=1);
require __DIR__.'/employees.php';
require_once dirname(__DIR__).'/outbox.php';
final class MessageMemory extends OMT\Store {
 public array $records=[],$events=[];public bool $failQueue=false;
 public function __construct(){}
 public function all(string $c):array{return array_values($this->records[$c]??[]);}
 public function get(string $c,string $id):?array{return $this->records[$c][$id]??null;}
 public function put(string $c,array $d,bool $insert=false):array{$d['_id']??=bin2hex(random_bytes(12));$d['createdAt']??=gmdate('c');return $this->records[$c][$d['_id']]=$d;}
 public function prepareEmployeeCollections():void{}
 public function transaction(callable $f):mixed{$r=$this->records;$e=$this->events;try{return $f($this);}catch(Throwable $x){$this->records=$r;$this->events=$e;throw $x;}}
 public function queue(string $k,array $p):void{if($this->failQueue)throw new RuntimeException('Synthetic queue failure');$this->events[$k]=['status'=>'pending','payload'=>$p];}
 public function claimOutbox(string $k):?array{if(($this->events[$k]['status']??'')!=='pending')return null;$this->events[$k]['status']='processing';return ['id'=>$k,'event_key'=>$k,'payload'=>$this->events[$k]['payload']];}
 public function finishOutbox(array $e,array $r):void{$this->events[$e['id']]['status']=$r['status'];}
 public function deferEmployeeOutbox(array $e,string $r):void{$this->events[$e['id']]['status']='pending';}
}
$m=new MessageMemory();$svc=new OMT\Employees($m,'2026-10-21');$notify=new OMT\EmployeeNotifications($m);$emp=$svc->save([...$body,'phone'=>'+12025550123'],'admin')[1]['data'];$id=$emp['_id'];
$cfg=$notify->settings();check($cfg['enabled']&&$cfg['salary']&&$cfg['absence']&&$cfg['advance']&&$cfg['deposit']);
$svc->mark($id,['date'=>'2026-10-20','states'=>['Morning'=>'Present','Night'=>'Present'],'revision'=>0],'admin');check(count($m->events)===0);
$a=['date'=>'2026-10-20','states'=>['Morning'=>'Absent','Night'=>'Present'],'revision'=>1];$svc->mark($id,$a,'admin');check(count($m->events)===1);$event=array_values($m->events)[0]['payload'];check($event['to']==='12025550123'&&$event['notificationType']==='absence');check($event['components'][0]['parameters'][3]['text']==='500.00');denied(fn()=>$svc->mark($id,$a,'admin'),409);check(count($m->events)===1);
$cfg=$notify->update([...$cfg,'advance'=>false],'admin')[1]['data'];$c=['type'=>'advance','amount'=>'100','date'=>'2026-10-21','method'=>'Cash','note'=>'Synthetic advance','requestId'=>'aaaaaaaa-1234-1234-1234-123456789abc'];$svc->cash($id,$c,'admin');check(count($m->events)===1&&$m->all('employeenotifications')[1]['whatsappStatus']==='disabled');
$cfg=$notify->update([...$cfg,'advance'=>true],'admin')[1]['data'];check(count($m->events)===1);$c['requestId']='bbbbbbbb-1234-1234-1234-123456789abc';$svc->cash($id,$c,'admin');$svc->cash($id,$c,'admin');check(count($m->events)===2&&count($m->all('employeecash'))===2);
$svc->cash($id,[...$c,'type'=>'repayment','amount'=>'50','requestId'=>'cccccccc-1234-1234-1234-123456789abc'],'admin');check(count($m->events)===3);$p=array_values($m->events)[2]['payload'];check($p['notificationType']==='deposit'&&$p['components'][0]['parameters'][4]['text']==='150.00');
$salary=[...$pay,'amount'=>'100','requestId'=>'dddddddd-1234-1234-1234-123456789abc'];$svc->payment($id,$salary,'admin');$svc->payment($id,$salary,'admin');check(count($m->events)===4&&array_values($m->events)[3]['payload']['notificationType']==='salary');
$keys=array_keys($m->events);$calls=0;$settings=['migration'=>['workersEnabled'=>true,'externalMessagesEnabled'=>true]];$send=function($p)use(&$calls){$calls++;return ['status'=>'accepted','messageId'=>'synthetic'];};
$pending=new OMT\OutboxWorker($m,$settings,$send,fn()=>'PENDING');check($pending->runApproved([$keys[3]])[$keys[3]]==='waiting_template'&&$calls===0);
$worker=new OMT\OutboxWorker($m,$settings,$send,fn()=>'APPROVED');check($worker->runApproved([$keys[1]])[$keys[1]]==='accepted'&&$calls===1);check($worker->runApproved([$keys[1]])[$keys[1]]==='not-claimed'&&$calls===1);
$cfg=$notify->update([...$cfg,'enabled'=>false],'admin')[1]['data'];check($worker->runApproved([$keys[0]])[$keys[0]]==='cancelled'&&$calls===1);denied(fn()=>$notify->update([...$cfg,'revision'=>0],'admin'),409);denied(fn()=>$notify->update([...$cfg,'salary'=>'false'],'admin'),400);
$cfg=$notify->update([...$cfg,'enabled'=>true],'admin')[1]['data'];$uncertain=new OMT\OutboxWorker($m,$settings,function()use(&$calls){$calls++;throw new RuntimeException('Lost acknowledgement');},fn()=>'APPROVED');check($uncertain->runApproved([$keys[2]])[$keys[2]]==='unknown');check($uncertain->runApproved([$keys[2]])[$keys[2]]==='not-claimed'&&$calls===2);
$before=$m->records;$events=$m->events;$m->failQueue=true;try{$svc->cash($id,[...$c,'requestId'=>'eeeeeeee-1234-1234-1234-123456789abc'],'admin');throw new LogicException('Expected failure');}catch(RuntimeException $x){check($x->getMessage()==='Synthetic queue failure');}check($before===$m->records&&$events===$m->events);
echo "PASS employee auto notifications: all four types, Present silent, duplicate protection, per-type/master OFF, no backfill, stale settings, approval gating, cancellation, uncertain delivery no retry and atomic rollback. Synthetic only; no network.\n";
