<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/modifications.php';
final class TextResponse {public function __construct(public readonly string $text){}}
final class Webhook {
    public function __construct(private readonly Store $store,private readonly array $settings){}
    public function verify(array $query):array {
        $token=$this->settings['WHATSAPP_VERIFY_TOKEN']??'';
        if(!$token||($query['hub.mode']??null)!=='subscribe'||!is_string($query['hub.verify_token']??null)||!hash_equals($token,$query['hub.verify_token']))throw new HttpError(403,'Webhook verification failed.');
        $challenge=$query['hub.challenge']??'';if(!is_string($challenge)||strlen($challenge)>1000)throw new HttpError(400,'Invalid challenge.');return [200,new TextResponse($challenge)];
    }
    public function authenticate(string $raw,?string $signature):void {
        $secret=$this->settings['META_APP_SECRET']??'';if(!$secret||str_starts_with($secret,'ENTER_'))throw new HttpError(503,'Webhook signature verification is not configured.');
        if(!is_string($signature)||!preg_match('/^sha256=[a-f0-9]{64}$/D',$signature)||!hash_equals('sha256='.hash_hmac('sha256',$raw,$secret),$signature))throw new HttpError(401,'Invalid webhook signature.');
    }
    private function date(mixed $timestamp):string {return is_numeric($timestamp)?gmdate('Y-m-d\TH:i:s.000\Z',(int)$timestamp):gmdate('Y-m-d\TH:i:s.000\Z');}
    public function receive(array $body):array {
        if(($body['object']??null)!=='whatsapp_business_account')throw new HttpError(400,'Invalid webhook object.');
        return $this->store->transaction(function()use($body){foreach($body['entry']??[]as $entry)foreach($entry['changes']??[]as $change){$value=$change['value']??[];
            if(($value['metadata']['phone_number_id']??null)!==($this->settings['WHATSAPP_PHONE_NUMBER_ID']??null))continue;
            foreach($value['messages']??[]as $incoming)$this->incoming($incoming);
            foreach($value['statuses']??[]as $status)$this->delivery($status);
        }return [200,new TextResponse('OK')];});
    }
    private function incoming(array $incoming):void {
        $provider=$incoming['id']??null;$phone=$incoming['from']??null;if(!is_string($provider)||!is_string($phone)||!$provider||!$phone)return;
        if($this->store->first('whatsappmessages',fn($d)=>($d['whatsappMessageId']??null)===$provider))return;
        $digits=preg_replace('/\D/','',$phone);$normalized=substr($digits,-10);$customer=$this->store->first('tiffins',fn($d)=>($d['phone']??null)===$normalized);
        $type=$incoming['type']??'unknown';$known=in_array($type,['text','image','document','audio','video','sticker','button','interactive'],true);$media=$incoming[$type]??[];$caption=(string)($media['caption']??'');$text=$type==='text'?(string)($media['body']??''):$caption;
        $button=$type==='button'?($media['payload']??$media['text']??''):($type==='interactive'?($media['button_reply']['id']??$media['button_reply']['title']??''):'');
        if(in_array($type,['button','interactive'],true))$text=(string)$button;
        $related=$type==='image';foreach(['payment','paid','pay','screenshot','upi','પેમેન્ટ','ભર્યું']as $word)if(str_contains(strtolower($text.' '.$caption),$word))$related=true;
        $this->store->put('whatsappmessages',['customer'=>$customer['_id']??null,'phoneNumber'=>$normalized,'whatsappMessageId'=>$provider,'type'=>$known?$type:'unknown','message'=>$text,'mediaId'=>$media['id']??null,'mediaMimeType'=>$media['mime_type']??null,'mediaFilename'=>$media['filename']??null,'mediaCaption'=>$caption,'whatsappTimestamp'=>$this->date($incoming['timestamp']??null),'direction'=>'incoming','inboxStatus'=>'unread','paymentStatus'=>$related?'pending_review':'not_payment_related'],true);
        if(strtoupper(trim((string)$button))==='APPROVE'&&!empty($incoming['context']['id'])){
            $adminPhone=strlen($digits)===10?'91'.$digits:$digits;
            $action=$this->store->first('customermodificationwhatsappactions',fn($d)=>($d['whatsappMessageId']??null)===$incoming['context']['id']&&($d['adminPhone']??null)===$adminPhone&&($d['action']??null)==='APPROVE'&&($d['status']??null)==='PENDING');
            if($action){(new Modifications($this->store))->status($action['request'],['status'=>'APPROVED'],null);$action['status']='USED';$action['usedAt']=gmdate('Y-m-d\TH:i:s.000\Z');$this->store->put('customermodificationwhatsappactions',$action);}
        }
    }
    private function delivery(array $event):void {
        $id=$event['id']??null;$status=$event['status']??null;$ranks=['pending'=>0,'accepted'=>0,'sent'=>1,'delivered'=>2,'read'=>3,'failed'=>0];
        if(!is_string($id)||!in_array($status,['sent','delivered','read','failed'],true))return;$date=$this->date($event['timestamp']??null);$reason=(string)($event['errors'][0]['title']??$event['errors'][0]['message']??'Message failed');
        foreach(['bills','payments','announcementdeliveries','customerotps','employeeotps','customerloginiddeliveries','employeenotifications','pgnotifications','reviewinvitationdeliveries','reviewthankyoudeliveries']as $collection){
            $record=$this->store->first($collection,fn($d)=>(in_array($collection,['bills','payments'],true)?($d['whatsappDelivery']['messageId']??null):($d['whatsappMessageId']??null))===$id);if(!$record)continue;
            $field=match($collection){'bills'=>'status','announcementdeliveries'=>'status',default=>'whatsappStatus'};$current=in_array($collection,['bills','payments'],true)?($record['whatsappDelivery']['status']??'pending'):($record[$field]??'pending');
            if($status!=='failed'&&($ranks[$status]??0)<($ranks[$current]??0))continue;
            if(in_array($collection,['bills','payments'],true)){$delivery=$record['whatsappDelivery']??[];$delivery['status']=$status;$delivery[$status.'At']=$date;$delivery['meta']=$event;$delivery['reason']=$status==='failed'?$reason:'Message '.$status;if(in_array($status,['delivered','read'],true))$delivery['delivered']=true;$record['whatsappDelivery']=$delivery;}
            else{$record[$field]=$status;$prefix=in_array($collection,['customerotps','employeeotps'],true)?'whatsapp':'';$dateField=$prefix?($prefix.ucfirst($status).'At'):($status.'At');$record[$dateField]=$date;if($status==='failed')$record[$prefix?'whatsappFailureReason':'failureReason']=$reason;}
            $this->store->put($collection,$record);
        }
    }
}
