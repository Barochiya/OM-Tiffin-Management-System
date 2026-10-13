<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/security.php';require_once __DIR__.'/store.php';
final class OutboxWorker {
    public function __construct(private readonly Store $store,private readonly array $settings,private readonly \Closure $send){}
    // Only exact event keys approved for sending may be passed. No catch-all queue drain.
    public function runApproved(array $eventKeys):array {
        if(empty($this->settings['migration']['workersEnabled'])||empty($this->settings['migration']['externalMessagesEnabled']))throw new HttpError(503,'External messages and workers are disabled.');
        if(!$eventKeys||count($eventKeys)>100)throw new \InvalidArgumentException('Provide the exact approved notification event keys');
        $outcomes=[];
        foreach(array_unique($eventKeys)as $key){
            if(!is_string($key)||strlen($key)>191||!preg_match('/^[A-Za-z0-9:._-]+$/D',$key))throw new \InvalidArgumentException('Invalid event key');
            $event=$this->store->transaction(fn()=>$this->store->claimOutbox($key));
            if(!$event){$outcomes[$key]='not-claimed';continue;}
            // Claim commits BEFORE HTTP. A crash or ambiguous provider response must never auto-resend.
            try{
                $payload=$event['payload'];$eligible=true;
                if(($payload['kind']??null)==='customer-otp'){$otp=$this->store->get('customerotps',$payload['otpId']);$eligible=$otp&&empty($otp['usedAt'])&&!empty($otp['expiresAt'])&&(float)(new \DateTimeImmutable($otp['expiresAt']))->format('U.u')>microtime(true);}
                $notification=$eligible?($this->send)($payload):['status'=>'failed','error'=>'OTP expired or superseded before delivery.'];
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
