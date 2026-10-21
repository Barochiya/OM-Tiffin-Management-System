<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/security.php';require_once __DIR__.'/store.php';
final class OutboxWorker {
    public function __construct(private readonly Store $store,private readonly array $settings,private readonly \Closure $send,private readonly ?\Closure $employeeReady=null){}
    // Only exact event keys approved for sending may be passed. No catch-all queue drain.
    public function runApproved(array $eventKeys):array {
        if(empty($this->settings['migration']['workersEnabled'])||empty($this->settings['migration']['externalMessagesEnabled']))throw new HttpError(503,'External messages and workers are disabled.');
        if(!$eventKeys||count($eventKeys)>100)throw new \InvalidArgumentException('Provide the exact approved notification event keys');
        $outcomes=[];$employeeTemplateStatuses=[];
        foreach(array_unique($eventKeys)as $key){
            if(!is_string($key)||strlen($key)>191||!preg_match('/^[A-Za-z0-9:._-]+$/D',$key))throw new \InvalidArgumentException('Invalid event key');
            $event=$this->store->transaction(fn()=>$this->store->claimOutbox($key));
            if(!$event){$outcomes[$key]='not-claimed';continue;}
            $payload=$event['payload'];
            if(($payload['kind']??null)==='employee-notification'){
                require_once __DIR__.'/employee-notifications.php';$notifier=new EmployeeNotifications($this->store);
                if(!$notifier->enabled($payload['notificationType'])){$this->store->transaction(fn()=>$this->store->finishOutbox($event,['status'=>'failed','employeeStatus'=>'cancelled','error'=>'Cancelled: employee messages were turned OFF before sending.']));$outcomes[$key]='cancelled';continue;}
                try{$template=$payload['templateId'];$ready=$employeeTemplateStatuses[$template]??=($this->employeeReady?($this->employeeReady)($payload):(new WhatsAppTransport($this->settings))->employeeTemplateStatus($payload));}
                catch(\Throwable){$ready='UNKNOWN';}
                if($ready!=='APPROVED'){$this->store->transaction(fn()=>$this->store->deferEmployeeOutbox($event,'Waiting for Meta template approval / availability: '.(in_array($ready,['PENDING','REJECTED','PAUSED','DISABLED'],true)?$ready:'UNKNOWN')));$outcomes[$key]='waiting_template';continue;}
                try{$payload=$notifier->prepare($payload);}
                catch(\Throwable){$this->store->transaction(fn()=>$this->store->finishOutbox($event,['status'=>'failed','error'=>'Employee message or salary PDF could not be prepared; no message was sent.']));$outcomes[$key]='failed';continue;}
                if(!$notifier->enabled($payload['notificationType'])){$this->store->transaction(fn()=>$this->store->finishOutbox($event,['status'=>'failed','employeeStatus'=>'cancelled','error'=>'Cancelled: employee messages were turned OFF before sending.']));$outcomes[$key]='cancelled';continue;}
            }

            if(($payload['kind']??null)==='receipt-auto'){
                try{require_once __DIR__.'/catalog.php';require_once __DIR__.'/document-notifications.php';$payload=(new DocumentNotifications($this->store,new Documents($this->store)))->prepareAutomaticReceipt($payload['documentId']);}
                catch(\Throwable){$this->store->transaction(fn()=>$this->store->finishOutbox($event,['status'=>'failed','error'=>'Receipt PDF could not be prepared; no message was sent.']));$outcomes[$key]='failed';continue;}
            }
            // Claim commits BEFORE HTTP. A crash or ambiguous provider response must never auto-resend.
            try{
                $eligible=true;
                if(in_array($payload['kind']??null,['customer-otp','employee-otp'],true)){$otp=$this->store->get($payload['kind']==='employee-otp'?'employeeotps':'customerotps',$payload['otpId']);$eligible=$otp&&empty($otp['usedAt'])&&!empty($otp['expiresAt'])&&(float)(new \DateTimeImmutable($otp['expiresAt']))->format('U.u')>microtime(true);}
                if(($payload['kind']??null)==='login-id'){
                    $customer=$this->store->get('tiffins',$payload['customerId']);$account=$this->store->get('customeraccounts',$payload['accountId']);
                    $eligible=$customer&&$account&&!empty($account['loginEnabled'])&&($account['customer']??null)===$customer['_id']&&($account['userId']??null)===$payload['userId']&&preg_replace('/\D/','',$customer['phone']??'')===preg_replace('/\D/','',$payload['to']??'');
                }
                $notification=$eligible?($this->send)($payload):['status'=>'failed','error'=>'Notification target expired, was removed, or changed before delivery.'];
            }
            catch(\Throwable){$notification=['status'=>'unknown','error'=>'Provider acknowledgement could not be confirmed. Check provider logs before any resend.'];}
            if(!in_array($notification['status']??null,['accepted','failed','unknown'],true))$notification=['status'=>'unknown','error'=>'Provider acknowledgement missing. Check provider logs before resending.'];
            $this->store->transaction(fn()=>$this->store->finishOutbox($event,$notification));
            $outcomes[$key]=$notification['status'];
        }
        return $outcomes;
    }
}
final class WhatsAppTransport {
    public function __construct(private readonly array $settings){}
    public function employeeTemplateStatus(array $payload):string {
        require_once __DIR__.'/employee-notifications.php';$expected=EmployeeNotifications::TEMPLATES[$payload['notificationType']??'']??null;
        if(!$expected||($payload['templateId']??'')!==$expected['id']||($payload['templateName']??'')!==$expected['name'])return 'UNKNOWN';
        $token=$this->settings['WHATSAPP_ACCESS_TOKEN']??'';$version=$this->settings['WHATSAPP_API_VERSION']??'v26.0';if(!$token||!preg_match('/^v\d+\.\d+$/D',$version)||!function_exists('curl_init'))return 'UNKNOWN';
        $h=curl_init('https://graph.facebook.com/'.$version.'/'.$expected['id'].'?fields=name,language,status');curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>2,CURLOPT_TIMEOUT=>4,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token]]);$raw=curl_exec($h);$status=(int)curl_getinfo($h,CURLINFO_RESPONSE_CODE);curl_close($h);$data=is_string($raw)?json_decode($raw,true):null;
        if($status!==200||($data['name']??'')!==$expected['name']||($data['language']??'')!=='en_GB')return 'UNKNOWN';return in_array($data['status']??'',['APPROVED','PENDING','REJECTED','PAUSED','DISABLED'],true)?$data['status']:'UNKNOWN';
    }
    public function template(array $payload):array {
        $token=$this->settings['WHATSAPP_ACCESS_TOKEN']??'';$phoneId=$this->settings['WHATSAPP_PHONE_NUMBER_ID']??'';$version=$this->settings['WHATSAPP_API_VERSION']??'v26.0';
        if(!$token||!preg_match('/^\d+$/D',$phoneId)||!preg_match('/^v\d+\.\d+$/D',$version))throw new \RuntimeException('WhatsApp configuration unavailable');
        $phone=preg_replace('/\D/','',(string)($payload['to']??''));if(strlen($phone)===10)$phone='91'.$phone;
        if(strlen($phone)<11||strlen($phone)>15)throw new \InvalidArgumentException('Invalid notification recipient');
        if(($payload['kind']??null)==='document-template'){
            $base=realpath(getenv('OMTIFFIN_UPLOADS')?:'/home1/maapn1f6/omtiffin-private/private/uploads');$file=realpath($payload['attachment']['path']??'');
            if(!$base||!$file||dirname($file)!==$base||filesize($file)>10*1024*1024||!hash_equals($payload['attachment']['sha256']??'',hash_file('sha256',$file)))throw new \RuntimeException('Private document integrity check failed');
            $upload=curl_init('https://graph.facebook.com/'.$version.'/'.$phoneId.'/media');
            curl_setopt_array($upload,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>60,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token],CURLOPT_POSTFIELDS=>['messaging_product'=>'whatsapp','type'=>'application/pdf','file'=>new \CURLFile($file,'application/pdf',$payload['filename'])]]);
            $raw=curl_exec($upload);$http=(int)curl_getinfo($upload,CURLINFO_RESPONSE_CODE);$failed=curl_errno($upload)!==0;curl_close($upload);$uploaded=is_string($raw)?json_decode($raw,true):null;
            if($failed)return ['status'=>'unknown','error'=>'PDF upload acknowledgement uncertain; check provider logs before resending.'];
            if($http<200||$http>=300||empty($uploaded['id']))return ['status'=>'failed','error'=>'WhatsApp PDF upload failed.'];
            array_unshift($payload['components'],['type'=>'header','parameters'=>[['type'=>'document','document'=>['id'=>$uploaded['id'],'filename'=>$payload['filename']]]]]);
        }
        $body=in_array($payload['kind']??null,['text','inbox-reply'],true)
            ?['messaging_product'=>'whatsapp','to'=>$phone,'type'=>'text','text'=>['preview_url'=>false,'body'=>$payload['message']]]
            :['messaging_product'=>'whatsapp','to'=>$phone,'type'=>'template','template'=>['name'=>$payload['templateName'],'language'=>['code'=>$payload['languageCode']],'components'=>$payload['components']]];
        $handle=curl_init('https://graph.facebook.com/'.$version.'/'.$phoneId.'/messages');
        curl_setopt_array($handle,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>30,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token,'Content-Type: application/json'],CURLOPT_POSTFIELDS=>json_encode($body,JSON_THROW_ON_ERROR)]);
        $raw=curl_exec($handle);$http=(int)curl_getinfo($handle,CURLINFO_RESPONSE_CODE);$failed=curl_errno($handle)!==0;curl_close($handle);
        if($failed||$raw===false)return ['status'=>'unknown','error'=>'WhatsApp response could not be confirmed. Check provider logs.'];
        $response=json_decode($raw,true);$id=$response['messages'][0]['id']??null;
        if($http>=200&&$http<300&&is_string($id)&&$id!=='')return ['status'=>'accepted','messageId'=>$id];
        return ['status'=>isset($response['error'])?'failed':'unknown','error'=>'WhatsApp notification could not be confirmed. Check provider logs.'];
    }
}
