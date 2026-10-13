<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';
final class DeliveryTestStore extends OMT\Store {
    public array $data=[],$events=[];public function __construct(){}
    public function all(string $c):array{return array_values($this->data[$c]??[]);}
    public function get(string $c,string $id):?array{return $this->data[$c][$id]??null;}
    public function transaction(callable $f):mixed{$before=[$this->data,$this->events];try{return $f($this);}catch(Throwable $e){[$this->data,$this->events]=$before;throw $e;}}
    public function put(string $c,array $d,bool $insert=false):array{$d['_id']??=bin2hex(random_bytes(12));$this->data[$c][$d['_id']]=$d;return $d;}
    public function queue(string $key,array $payload):void{if(isset($this->events[$key]))throw new RuntimeException('Repeated enqueue');$this->events[$key]=$payload;}
}
function check(bool $v):void{if(!$v)throw new RuntimeException('Delivery assertion failed');}
function denied(callable $f,int $status):void{try{$f();}catch(OMT\HttpError $e){check($e->status===$status);return;}throw new RuntimeException('Expected rejection');}
$s=new DeliveryTestStore();$id='507f1f77bcf86cd799439011';$admin='507f1f77bcf86cd799439012';$now=new DateTimeImmutable('2026-10-12T18:30:00Z');
$s->put('tiffins',['_id'=>$id,'customerName'=>'Synthetic','phone'=>'9999999999','status'=>'Active','mealType'=>'Lunch'],true);
$d=new OMT\Deliveries($s,['WHATSAPP_ACCESS_TOKEN'=>'synthetic','WHATSAPP_PHONE_NUMBER_ID'=>'synthetic']);
$body=['customer'=>$id,'date'=>'2026-10-13','meal'=>'Lunch','status'=>'Delivered'];
denied(fn()=>$d->mark($body,$admin,$now),409);check(count($s->events)===0);
denied(fn()=>$d->mark([...$body,'date'=>'2026-10-12'],$admin,$now),400);
denied(fn()=>$d->mark([...$body,'meal'=>'Dinner'],$admin,$now),400);
$dispatch=$d->mark([...$body,'status'=>'Out for delivery'],$admin,$now)[1]['data'];check($dispatch['dispatchNotification']['status']==='pending');check(count($s->events)===1);
check($d->mark([...$body,'status'=>'Out for delivery'],$admin,$now)[1]['unchanged']===true);check(count($s->events)===1);
$delivered=$d->mark($body,$admin,$now)[1]['data'];check($delivered['_id']===$dispatch['_id']);check($delivered['notification']['status']==='pending');check(count($s->events)===2);
check($d->mark($body,$admin,$now)[1]['unchanged']===true);check($d->mark([...$body,'status'=>'Out for delivery'],$admin,$now)[1]['unchanged']===true);check(count($s->events)===2);
check($d->get(['date'=>'2026-10-13','customer'=>$id])[1]['data'][0]['status']==='Delivered');
$event=array_values($s->events)[0];check($event['components'][0]['parameters'][2]['text']==='13/10/2026');check($event['notificationField']==='dispatchNotification');
echo "PASS deliveries: IST today boundary, active meal eligibility, ordered transitions, stable identity, repeated/backwards marks do not requeue, separate dispatch/delivered outbox events. No customer sends.\n";
