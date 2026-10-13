<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
final class BinaryResponse {public function __construct(public readonly string $bytes,public readonly string $mime){}}
final class WhatsApp {
    public function __construct(private readonly Store $store,private readonly array $settings,private readonly ?\Closure $fetch=null){}
    public function authenticate(?string $supplied):void{$secret=$this->settings['WHATSAPP_SEND_SECRET']??'';if(!$secret)throw new HttpError(503,'WhatsApp service is unavailable.');if(!$supplied||!hash_equals($secret,$supplied))throw new HttpError(401,'Unauthorized');}
    public function send(array $body):array {
        $phone=preg_replace('/\D/','',(string)($body['to']??''));if(strlen($phone)===10)$phone='91'.$phone;if(!preg_match('/^\d{11,15}$/D',$phone))throw new HttpError(400,'Valid recipient phone number is required.');
        $type=$body['type']??'template';$payload=['kind'=>$type==='text'?'text':'service-template','to'=>$phone];
        if($type==='text'){if(!is_string($body['message']??null)||trim($body['message'])===''||strlen($body['message'])>16000)throw new HttpError(400,'Message is required for text messages');$payload['message']=$body['message'];}
        elseif($type==='template'){$name=$body['templateName']??'3p_direct_integration_test_template';$language=$body['languageCode']??'en_US';if(!is_string($name)||!preg_match('/^[a-z0-9_]{1,100}$/D',$name)||!is_string($language)||!preg_match('/^[a-z]{2,3}(?:_[A-Z]{2})?$/D',$language)||!is_array($body['components']??[]))throw new HttpError(400,'Invalid template request');$payload+=['templateName'=>$name,'languageCode'=>$language,'components'=>$body['components']??[]];}
        else throw new HttpError(400,"Unsupported WhatsApp message type. Use 'text' or 'template'.");
        return $this->store->transaction(function()use($payload){$key='service-message:'.bin2hex(random_bytes(16));$this->store->queue($key,$payload);return [200,['success'=>true,'message'=>'WhatsApp notification queued.','data'=>['queued'=>true,'eventKey'=>$key]]];});
    }
    private function get(string $url,int $limit):string {
        if($this->fetch)return ($this->fetch)($url,$limit);
        $token=$this->settings['WHATSAPP_ACCESS_TOKEN']??'';if(!$token)throw new HttpError(503,'WhatsApp media access is unavailable.');
        $output='';$c=curl_init($url);curl_setopt_array($c,[CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>30,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token],CURLOPT_WRITEFUNCTION=>function($c,$chunk)use(&$output,$limit){if(strlen($output)+strlen($chunk)>$limit)return 0;$output.=$chunk;return strlen($chunk);}]);
        $ok=curl_exec($c);$status=(int)curl_getinfo($c,CURLINFO_RESPONSE_CODE);curl_close($c);if($ok===false||$status<200||$status>=300)throw new HttpError(502,'WhatsApp media could not be retrieved.');return $output;
    }
    public function media(string $id):array {
        $message=$this->store->get('whatsappmessages',$id);if(!$message)throw new HttpError(404,'WhatsApp message not found.');$media=$message['mediaId']??'';if(!is_string($media)||!preg_match('/^\d+$/D',$media))throw new HttpError(404,'No media found for this message.');
        $version=$this->settings['WHATSAPP_API_VERSION']??'v26.0';if(!preg_match('/^v\d+\.\d+$/D',$version))throw new HttpError(503,'WhatsApp media access is unavailable.');
        try{$info=json_decode($this->get('https://graph.facebook.com/'.$version.'/'.$media,1024*1024),true,32,JSON_THROW_ON_ERROR);}catch(\JsonException){throw new HttpError(502,'Invalid WhatsApp media response.');}
        $url=$info['url']??'';$parts=is_string($url)?parse_url($url):false;$host=strtolower($parts['host']??'');
        if(!$parts||($parts['scheme']??'')!=='https'||isset($parts['user'])||isset($parts['pass'])||isset($parts['port'])||!($host==='fbsbx.com'||str_ends_with($host,'.fbsbx.com')||$host==='fbcdn.net'||str_ends_with($host,'.fbcdn.net')||$host==='lookaside.facebook.com'))throw new HttpError(502,'Invalid WhatsApp media location.');
        $mime=$info['mime_type']??$message['mediaMimeType']??'application/octet-stream';if(!is_string($mime)||!preg_match('~^[a-z0-9.+-]+/[a-z0-9.+-]+$~iD',$mime))$mime='application/octet-stream';
        return [200,new BinaryResponse($this->get($url,20*1024*1024),$mime)];
    }
}
