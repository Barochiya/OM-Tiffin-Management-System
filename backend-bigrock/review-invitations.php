<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/catalog.php';
final class ReviewInvitations {
    public const TEMPLATE='om_tiffin_review_invitation_utility';
    public const THANK_YOU_TEMPLATE='om_tiffin_review_thank_you_utility';
    public const THANK_YOU_ID='1646576013849373';
    public const TEMPLATE_ID='1751199879905547'; // Set only after Meta has created the dedicated template.
    public function __construct(private readonly Store $store,private readonly array $settings){}
    private function token(array $i):string { $secret=$this->settings['JWT_SECRET']??'';if(strlen($secret)<16)throw new HttpError(503,'Review links unavailable');return $i['_id'].'.'.hash_hmac('sha256','review-invitation-v1:'.$i['_id'],$secret); }
    private function url(array $i):string{return 'https://www.omtiffinservices.com/?review='.$this->token($i);}
    private function invitation(string $customer):?array{return $this->store->first('reviewinvitations',fn($i)=>$i['customer']===$customer);}
    private function nameKey(string $s):string{return mb_strtolower(trim(preg_replace('/\s+/u',' ',$s)));}
    private function received(array $c,?array $i):bool {
        if(!empty($i['submittedAt'])||!empty($i['manualReceivedAt']))return true;
        $name=$this->nameKey($c['customerName']??'');
        return (bool)$this->store->first('websitereviews',fn($r)=>($r['customer']??null)===$c['_id']||($name!==''&&$this->nameKey($r['customerName']??'')===$name));
    }
    private function ensure(array $c):array { $i=$this->invitation($c['_id']);if($i)return $i;$this->store->prepareReviewCollections();return $this->store->put('reviewinvitations',['customer'=>$c['_id'],'submittedAt'=>null,'manualReceivedAt'=>null,'lastQueuedAt'=>null],true); }
    private function resolve(string $token):array {
        if(!preg_match('/^([a-f0-9]{24})\.[a-f0-9]{64}$/D',$token,$m))throw new HttpError(404,'This review link is unavailable.');
        $i=$this->store->get('reviewinvitations',$m[1]);if(!$i||!hash_equals($this->token($i),$token))throw new HttpError(404,'This review link is unavailable.');
        $c=$this->store->get('tiffins',$i['customer']);if(!$c)throw new HttpError(404,'This review link is unavailable.');return [$i,$c];
    }
    public function listing():array {
        $rows=[];foreach(sorted($this->store->all('tiffins'),['customerName'=>1])as $c){$i=$this->invitation($c['_id']);$history=$this->store->find('reviewinvitationdeliveries',fn($d)=>$d['customer']===$c['_id']);$latest=sorted($history,['createdAt'=>-1])[0]??null;
            $done=$this->received($c,$i);$rows[]=['customerId'=>$c['_id'],'customerName'=>$c['customerName']??'Customer','phone'=>$c['phone']??'','customerStatus'=>$c['status']??'Active','reviewReceived'=>$done,'manualReceived'=>!empty($i['manualReceivedAt']),'submittedAt'=>$i['submittedAt']??$i['manualReceivedAt']??null,'link'=>$i&&!$done?$this->url($i):null,'deliveryStatus'=>$latest['whatsappStatus']??'not_sent','failureReason'=>$latest['failureReason']??'','lastSentAt'=>$latest['sentAt']??null,'lastQueuedAt'=>$i['lastQueuedAt']??null];
        }return success(['customers'=>$rows,'templateName'=>self::TEMPLATE,'templateConfigured'=>self::TEMPLATE_ID!=='']);
    }
    public function link(string $id):array{return $this->store->transaction(function()use($id){$c=$this->store->get('tiffins',$id)??throw new HttpError(404,'Customer not found');$i=$this->invitation($id);if($this->received($c,$i))throw new HttpError(409,'Review already received. No further invitation is allowed.');return success(['link'=>$this->url($this->ensure($c))]);});}
    public function mark(string $id,array $b):array{return $this->store->transaction(function()use($id,$b){$c=$this->store->get('tiffins',$id)??throw new HttpError(404,'Customer not found');$note=trim((string)($b['note']??''));if(mb_strlen($note)<3||mb_strlen($note)>300)throw new HttpError(400,'Enter a note between 3 and 300 characters.');$i=$this->ensure($c);if(empty($i['manualReceivedAt'])&&empty($i['submittedAt'])){$i['manualReceivedAt']=gmdate('c');$i['manualNote']=$note;$this->store->put('reviewinvitations',$i);}return success(['reviewReceived'=>true]);});}
    public function publicView(string $token):array {[$i,$c]=$this->resolve($token);$done=$this->received($c,$i);return success($done?['submitted'=>true]:['submitted'=>false,'customerName'=>$c['customerName']??'']);}
    public function submit(array $b):array{return $this->store->transaction(function()use($b){[$i,$c]=$this->resolve((string)($b['token']??''));if($this->received($c,$i))return success(['submitted'=>true],'Your review has already been received.');
        $r=(new Catalog($this->store))->saveReview($b)[1]['data'];$r['customer']=$c['_id'];$r['invitation']=$i['_id'];$this->store->put('websitereviews',$r);$i['submittedAt']=gmdate('c');$i['reviewId']=$r['_id'];$this->store->put('reviewinvitations',$i);$r['status']='Approved';$this->store->put('websitereviews',$r);$this->thankYou($r);return success(['submitted'=>true],'Thank you! Your review has been published.',201);
    });}
    public function templateStatus():array {
        if(self::TEMPLATE_ID==='')return success(['status'=>'NOT_CONFIGURED','name'=>self::TEMPLATE,'thankYouStatus'=>$this->status(true)]);
        return success(['status'=>$this->status(),'name'=>self::TEMPLATE,'thankYouStatus'=>$this->status(true)]);
    }
    public function status(bool $thankYou=false):string {
        $templateId=$thankYou?self::THANK_YOU_ID:self::TEMPLATE_ID;$templateName=$thankYou?self::THANK_YOU_TEMPLATE:self::TEMPLATE;
        if($templateId===''||!function_exists('curl_init'))return 'NOT_CONFIGURED';$token=$this->settings['WHATSAPP_ACCESS_TOKEN']??'';$v=$this->settings['WHATSAPP_API_VERSION']??'v26.0';if(!$token||!preg_match('/^v\d+\.\d+$/D',$v))return 'UNKNOWN';
        $h=curl_init('https://graph.facebook.com/'.$v.'/'.$templateId.'?fields=name,language,status,category');curl_setopt_array($h,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>2,CURLOPT_TIMEOUT=>4,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token]]);$raw=curl_exec($h);$http=(int)curl_getinfo($h,CURLINFO_RESPONSE_CODE);curl_close($h);$d=is_string($raw)?json_decode($raw,true):null;return $http===200&&($d['name']??'')===$templateName&&($d['language']??'')==='en_GB'?(($d['category']??'')==='UTILITY'?($d['status']??'UNKNOWN'):'CATEGORY_CHANGED'):'UNKNOWN';
    }
    public function send(array $b,?string $verifiedStatus=null):array {
        if(($verifiedStatus??$this->status())!=='APPROVED')throw new HttpError(409,'The dedicated WhatsApp review template is not approved yet. You can copy personal links meanwhile.');
        $ids=$b['customerIds']??[];$request=$b['requestId']??'';if(!is_array($ids)||!$ids||count($ids)>50||!preg_match('/^[a-f0-9-]{36}$/Di',(string)$request))throw new HttpError(400,'Select 1 to 50 customers and provide a request ID.');
        return $this->store->transaction(function()use($ids,$request){$results=[];$this->store->prepareReviewCollections();foreach(array_unique($ids)as $id){$c=$this->store->get('tiffins',(string)$id);if(!$c)throw new HttpError(404,'Customer not found');$i=$this->invitation($c['_id']);if($this->received($c,$i)){$results[]=['customerId'=>$id,'status'=>'review_received'];continue;}
            $i=$this->ensure($c);$deliveryId=substr(hash('sha256','review:'.$i['_id'].':'.$request),0,24);$old=$this->store->get('reviewinvitationdeliveries',$deliveryId);if($old){$results[]=['customerId'=>$id,'status'=>'already_queued'];continue;}
            if(!empty($i['lastQueuedAt'])&&strtotime($i['lastQueuedAt'])>time()-86400){$results[]=['customerId'=>$id,'status'=>'cooldown'];continue;}
            $phone=preg_replace('/\D/','',$c['phone']??'');if(!preg_match('/^[6-9]\d{9}$/D',$phone)){$results[]=['customerId'=>$id,'status'=>'invalid_phone'];continue;}
            $d=$this->store->put('reviewinvitationdeliveries',['_id'=>$deliveryId,'customer'=>$id,'invitation'=>$i['_id'],'whatsappStatus'=>'pending','whatsappMessageId'=>null,'failureReason'=>'Queued'],true);
            $this->store->queue('review:'.$deliveryId,['kind'=>'review-invitation','customerId'=>$id,'invitationId'=>$i['_id'],'documentId'=>$deliveryId,'to'=>$phone,'templateName'=>self::TEMPLATE,'languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>[['type'=>'text','text'=>preg_replace('/\s+/u',' ',trim($c['customerName']))],['type'=>'text','text'=>$this->url($i)]]]]]);$i['lastQueuedAt']=gmdate('c');$this->store->put('reviewinvitations',$i);$results[]=['customerId'=>$id,'status'=>'queued'];
        }return success(['results'=>$results]);});
    }
    public function thankYou(array $review):void {
        $id=$review['customer']??'';$c=$this->store->get('tiffins',$id);$i=$this->store->get('reviewinvitations',$review['invitation']??'');
        if(!$c||!$i||$i['customer']!==$id||($i['reviewId']??'')!==$review['_id']||empty($i['submittedAt']))return;
        $key=substr(hash('sha256','review-thanks:'.$review['_id']),0,24);if($this->store->get('reviewthankyoudeliveries',$key))return;
        $phone=preg_replace('/\D/','',$c['phone']??'');if(!preg_match('/^[6-9]\d{9}$/D',$phone))return;
        $this->store->prepareReviewCollections();$this->store->put('reviewthankyoudeliveries',['_id'=>$key,'customer'=>$id,'review'=>$review['_id'],'invitation'=>$i['_id'],'whatsappStatus'=>'pending','whatsappMessageId'=>null,'failureReason'=>'Waiting for approved thank-you template'],true);
        $this->store->queue('review-thanks:'.$key,['kind'=>'review-thank-you','customerId'=>$id,'invitationId'=>$i['_id'],'reviewId'=>$review['_id'],'documentId'=>$key,'to'=>$phone,'templateName'=>self::THANK_YOU_TEMPLATE,'languageCode'=>'en_GB','components'=>[['type'=>'header','parameters'=>[['type'=>'image','image'=>['link'=>'https://www.omtiffinservices.com/review-thank-you.png']]]],['type'=>'body','parameters'=>[['type'=>'text','text'=>preg_replace('/\s+/u',' ',trim($review['customerName']))]]]]]);
    }
    public function eligibleThanks(array $p):bool {$c=$this->store->get('tiffins',$p['customerId']??'');$r=$this->store->get('websitereviews',$p['reviewId']??'');return ($p['templateName']??'')===self::THANK_YOU_TEMPLATE&&$c&&$r&&($r['customer']??'')===$c['_id']&&($r['status']??'')==='Approved'&&preg_replace('/\D/','',$c['phone']??'')===($p['to']??'');}

    public function eligible(array $p):bool {$i=$this->store->get('reviewinvitations',$p['invitationId']??'');$c=$this->store->get('tiffins',$p['customerId']??'');return ($p['templateName']??'')===self::TEMPLATE&&$c&&$i&&$i['customer']===$c['_id']&&!$this->received($c,$i)&&preg_replace('/\D/','',$c['phone']??'')===($p['to']??'');}
}
