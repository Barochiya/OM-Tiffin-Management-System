<?php
declare(strict_types=1);
require dirname(__DIR__).'/outbox.php';
final class OutboxTestStore extends OMT\Store {
    public array $events=[],$records=[];public bool $failCompletion=false;public function __construct(){}
    public function get(string $collection,string $id):?array{return $this->records[$collection][$id]??null;}
    public function transaction(callable $f):mixed{return $f($this);}
    public function claimOutbox(string $key):?array{if(($this->events[$key]['status']??null)!=='pending')return null;$this->events[$key]['status']='processing';return ['id'=>$key,'event_key'=>$key,'payload'=>$this->events[$key]['payload']];}
    public function finishOutbox(array $event,array $result):void{if($this->failCompletion)throw new RuntimeException('Synthetic database interruption');$this->events[$event['id']]['status']=$result['status'];}
}
function check(bool $v):void{if(!$v)throw new RuntimeException('Outbox assertion failed');}
$s=new OutboxTestStore();foreach(['approved','unapproved','timeout','crash']as $key)$s->events[$key]=['status'=>'pending','payload'=>['synthetic'=>$key]];
$calls=0;$sender=function($payload)use(&$calls){$calls++;if($payload['synthetic']==='timeout')throw new RuntimeException('Synthetic lost response');return ['status'=>'accepted','messageId'=>'synthetic-provider-id'];};
$blocked=new OMT\OutboxWorker($s,['migration'=>['workersEnabled'=>false,'externalMessagesEnabled'=>false]],$sender);
try{$blocked->runApproved(['approved']);throw new RuntimeException('Expected gate');}catch(OMT\HttpError $e){check($e->status===503);}check($calls===0);
$settings=['migration'=>['workersEnabled'=>true,'externalMessagesEnabled'=>true]];$worker=new OMT\OutboxWorker($s,$settings,$sender);
check($worker->runApproved(['approved','approved'])['approved']==='accepted');check($calls===1);check($s->events['unapproved']['status']==='pending');
check($worker->runApproved(['approved'])['approved']==='not-claimed');check($calls===1);
check($worker->runApproved(['timeout'])['timeout']==='unknown');check($calls===2);check($worker->runApproved(['timeout'])['timeout']==='not-claimed');check($calls===2);
$s->failCompletion=true;try{$worker->runApproved(['crash']);}catch(RuntimeException){}check($s->events['crash']['status']==='processing');check($calls===3);
$s->failCompletion=false;check($worker->runApproved(['crash'])['crash']==='not-claimed');check($calls===3);
$s->records['customerotps']['expired']=['expiresAt'=>gmdate('c',time()-1),'usedAt'=>null];$s->events['expired']=['status'=>'pending','payload'=>['kind'=>'customer-otp','otpId'=>'expired']];check($worker->runApproved(['expired'])['expired']==='failed');check($calls===3);
$s->records['customerotps']['superseded']=['expiresAt'=>gmdate('c',time()+600),'usedAt'=>gmdate('c')];$s->events['superseded']=['status'=>'pending','payload'=>['kind'=>'customer-otp','otpId'=>'superseded']];check($worker->runApproved(['superseded'])['superseded']==='failed');check($calls===3);
echo "PASS outbox: disabled gates, exact approved keys only, repeated keys, lost acknowledgement and bookkeeping crash never automatically resend. Injected synthetic sender; no network calls.\n";

$s->events['receipt-render-failure']=['status'=>'pending','payload'=>['kind'=>'receipt-auto','documentType'=>'receipt','documentId'=>'missing']];
check($worker->runApproved(['receipt-render-failure'])['receipt-render-failure']==='failed');check($calls===3);
check($worker->runApproved(['receipt-render-failure'])['receipt-render-failure']==='not-claimed');check($calls===3);
echo "PASS receipt rendering failure records failure without calling the provider or resending.\n";
