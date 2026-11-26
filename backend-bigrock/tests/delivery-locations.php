<?php
declare(strict_types=1);
require dirname(__DIR__).'/http.php';
final class LocationTestStore extends OMT\Store {
 public array $records=[];public int $prepares=0;
 public function __construct(){}
 public function all(string $c):array{return array_values($this->records[$c]??[]);}
 public function get(string $c,string $id):?array{return $this->records[$c][$id]??null;}
 public function transaction(callable $fn):mixed{$before=$this->records;try{return $fn($this);}catch(Throwable $e){$this->records=$before;throw $e;}}
 public function put(string $c,array $row,bool $insert=false):array{$row['_id']??=bin2hex(random_bytes(12));return $this->records[$c][$row['_id']]=$row;}
 public function prepareDeliveryLocationCollection():void{$this->prepares++;}
 public function queue(string $key,array $payload):void{throw new RuntimeException('Location changes must not send messages');}
}
function check(bool $v):void{if(!$v)throw new RuntimeException('Location assertion failed');}
function denied(callable $fn,int $status):void{try{$fn();}catch(OMT\HttpError $e){check($e->status===$status);return;}throw new RuntimeException('Expected denial '.$status);}
$s=new LocationTestStore();$id='111111111111111111111111';$s->put('tiffins',['_id'=>$id,'customerName'=>'Synthetic location','address'=>'Original address','phone'=>'0000000000','status'=>'Active','mealType'=>'Both','pricing'=>['lunchPrice'=>90],'advanceBalance'=>100,'pendingAmount'=>200,'deliveryLocation'=>['latitude'=>23.01,'longitude'=>72.51,'updatedAt'=>'2026-11-01T01:00:00Z']],true);
foreach(['bills','payments','walletaccounts','dailyentries','mealdeliveries']as $c)$s->put($c,['_id'=>'222222222222222222222222','synthetic'=>'preserve'],true);
$before=$s->records;$service=new OMT\DeliveryLocations($s);$view=$service->get($id)[1]['data'];$service->listing();check($s->records===$before&&$s->prepares===0&&!isset($view['pricing']));
$body=['deliveryLocation'=>['latitude'=>23.0225,'longitude'=>72.5714,'accuracy'=>15.2],'deliveryInstructions'=>'Synthetic floor 2','expectedVersion'=>$view['locationVersion'],'requestId'=>'11111111-2222-4333-8444-555555555555','pricing'=>['lunchPrice'=>0],'advanceBalance'=>0];
$saved=$service->save($id,$body,'synthetic-admin')[1]['data'];check($saved['deliveryLocation']['latitude']===23.0225&&$saved['deliveryLocation']['source']==='admin'&&$saved['locationVersion']!==$view['locationVersion']);
check(count($s->all('deliverylocationevents'))===1);$event=$s->all('deliverylocationevents')[0];check($event['before']['deliveryLocation']===$before['tiffins'][$id]['deliveryLocation']);
$after=$s->records;$service->save($id,$body,'synthetic-admin');check($s->records===$after);
denied(fn()=>$service->save($id,[...$body,'deliveryInstructions'=>'Different'],'synthetic-admin'),409);
denied(fn()=>$service->save($id,[...$body,'requestId'=>'22222222-2222-4222-8222-222222222222'],'synthetic-admin'),409);
foreach([['latitude'=>91,'longitude'=>72],['latitude'=>23,'longitude'=>181],['latitude'=>'23','longitude'=>72],['latitude'=>NAN,'longitude'=>72],['latitude'=>23,'longitude'=>INF],null]as $pin)denied(fn()=>$service->save($id,[...$body,'deliveryLocation'=>$pin],'synthetic-admin'),400);
denied(fn()=>$service->save($id,[...$body,'deliveryInstructions'=>str_repeat('x',301)],'synthetic-admin'),400);
denied(fn()=>$service->get('bad'),400);denied(fn()=>$service->get('999999999999999999999999'),404);
foreach($before['tiffins'][$id]as $key=>$value)if($key!=='deliveryLocation')check($s->get('tiffins',$id)[$key]===$value);
foreach(['bills','payments','walletaccounts','dailyentries','mealdeliveries']as $c)check($s->records[$c]===$before[$c]);
// A customer self-service update must invalidate a previously loaded admin editor.
$current=$s->get('tiffins',$id);$v=OMT\DeliveryLocations::version($current);$current['deliveryLocation']=['latitude'=>23.1,'longitude'=>72.6,'updatedAt'=>'2026-11-20T12:00:00Z'];$s->put('tiffins',$current);
denied(fn()=>$service->save($id,[...$body,'expectedVersion'=>$v,'requestId'=>'33333333-3333-4333-8333-333333333333'],'synthetic-admin'),409);
$app=new OMT\HttpApplication(new OMT\Router($s,['JWT_SECRET'=>'synthetic-admin-secret','CUSTOMER_JWT_SECRET'=>'synthetic-customer-secret','migration'=>['writesEnabled'=>false]]));
foreach([['GET','/api/delivery-locations'],['GET','/api/delivery-locations/'.$id],['PUT','/api/delivery-locations/'.$id]]as [$method,$path])check($app->handle($method,$path,['Content-Type'=>'application/json'],'{}')[0]===401);
echo "PASS admin location reads are side-effect free; updates change only pin/instructions, retain audit, reject stale/replayed/invalid inputs, protect all financial data and never queue messages. Synthetic only.\n";
$admin='444444444444444444444444';$s->put('admins',['_id'=>$admin,'name'=>'Synthetic location admin'],true);
$adminToken=OMT\signToken(['id'=>$admin,'type'=>'admin'],'synthetic-admin-secret',600);
$customerToken=OMT\signToken(['id'=>$id,'type'=>'customer'],'synthetic-customer-secret',600);
$settings=['JWT_SECRET'=>'synthetic-admin-secret','CUSTOMER_JWT_SECRET'=>'synthetic-customer-secret','migration'=>['writesEnabled'=>true]];
$http=new OMT\HttpApplication(new OMT\Router($s,$settings));
$httpBefore=$s->records;check($http->handle('GET','/api/delivery-locations',['Authorization'=>'Bearer '.$adminToken],'')[0]===200);check($s->records===$httpBefore);
foreach([['GET','/api/delivery-locations'],['GET','/api/delivery-locations/'.$id],['PUT','/api/delivery-locations/'.$id]]as [$method,$path])check($http->handle($method,$path,['Authorization'=>'Bearer '.$customerToken,'Content-Type'=>'application/json'],'{}')[0]===401);
$payload=[...$body,'expectedVersion'=>OMT\DeliveryLocations::version($s->get('tiffins',$id)),'requestId'=>'55555555-5555-4555-8555-555555555555'];
$result=$http->handle('PUT','/api/delivery-locations/'.$id,['Authorization'=>'Bearer '.$adminToken,'Content-Type'=>'application/json'],json_encode($payload));check($result[0]===200);$response=json_decode($result[2],true);check($response['data']['deliveryLocation']['source']==='admin');
check($s->get('tiffins',$id)['pricing']===$before['tiffins'][$id]['pricing']);
echo "PASS authenticated HTTP admin read/save and customer-token exclusion; synthetic storage only.\n";
