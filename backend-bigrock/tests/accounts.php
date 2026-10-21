<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';
final class AccountStore extends OMT\Store {
    public array $data=[],$events=[];public function __construct(){}
    public function all(string $c):array{return array_values($this->data[$c]??[]);}
    public function get(string $c,string $id):?array{return $this->data[$c][$id]??null;}
    public function put(string $c,array $d,bool $insert=false):array{$d['_id']??=bin2hex(random_bytes(12));$this->data[$c][$d['_id']]=$d;return $d;}
    public function transaction(callable $f):mixed{$old=[$this->data,$this->events];try{return $f($this);}catch(Throwable $e){[$this->data,$this->events]=$old;throw $e;}}
    public function queue(string $key,array $payload):void{$this->events[$key]=$payload;}
}
function check(bool $v):void{if(!$v)throw new RuntimeException('Account assertion failed');}
function denied(callable $f,int $code):void{try{$f();}catch(OMT\HttpError $e){check($e->status===$code);return;}throw new RuntimeException('Expected rejection');}
$s=new AccountStore();$a=new OMT\Accounts($s);$customer=$s->put('tiffins',['customerName'=>'Synthetic','phone'=>'9999999999','barcode'=>'OMT-TEST','status'=>'Active'],true);$id=$customer['_id'];
$provision=$a->provision(['customerId'=>$id]);check($provision[0]===201);$account=$s->all('customeraccounts')[0];$hash=$account['passwordHash'];check(!isset($provision[1]['account']['passwordHash']));
check($a->provision(['customerId'=>$id])[1]['temporaryPassword']===null);check($s->all('customeraccounts')[0]['passwordHash']===$hash);
denied(fn()=>$a->enabled($id,['enabled'=>'false']),400);check($a->enabled($id,['enabled'=>false])[1]['account']['loginEnabled']===false);
denied(fn()=>$a->sendLoginIds([]),400);$send=$a->sendLoginIds(['customerIds'=>[$id,$id]])[1];check($send['summary']['queued']===1&&$send['summary']['sent']===0&&count($s->events)===1);
$regenerate=$a->regenerate($id)[1];$updated=$s->all('customeraccounts')[0];check($updated['loginEnabled']===false);check($updated['userId']===$account['userId']);check($updated['isFirstLogin']===true);check(password_verify($regenerate['temporaryPassword'],$updated['passwordHash']));check($updated['passwordHash']!==$hash);check($regenerate['whatsapp']['sent']===false&&count($s->events)===2);
foreach($s->events as $event){check(!str_contains(json_encode($event),$regenerate['temporaryPassword']));check(!isset($event['passwordHash']));}
check($a->recipients()[1]['data'][0]['loginEnabled']===false);check($a->recipients()[1]['readyCount']===1);
echo "PASS account provisioning, safe fields, strict enable flags, deduplicated selected recipients, password reset preserves identity/login flag, no credentials in notifications, honest queued state. Synthetic records only.\n";

foreach($s->events as $event){check($event['templateName']==='om_tiffin_service_update');check(str_contains($event['components'][0]['parameters'][1]['text'],'https://www.omtiffinservices.com/customer-login'));check(str_contains($event['components'][0]['parameters'][1]['text'],$account['userId']));}
