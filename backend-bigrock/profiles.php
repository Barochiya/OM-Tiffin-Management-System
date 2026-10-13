<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
final class Profiles {
    public function __construct(private readonly Store $store){}
    private static function length(string $v):int {preg_match_all('/./us',$v,$chars);$length=0;foreach($chars[0]as $c)$length+=strlen($c)===4?2:1;return $length;}
    public function update(string $customer,array $body):array {
        $updates=[];
        foreach(['customerName'=>[100,'Customer name'],'address'=>[500,'Address']] as $key=>[$max,$label]){
            if(!array_key_exists($key,$body))continue;
            if(!is_scalar($body[$key])&&$body[$key]!==null)throw new HttpError(400,$label.' is required.');
            $value=trim((string)$body[$key]);
            if($value==='')throw new HttpError(400,$label.' is required.');
            if(self::length($value)>$max)throw new HttpError(400,$label.' cannot exceed '.$max.' characters.');
            $updates[$key]=$value;
        }
        if(array_key_exists('phone',$body)){
            $phone=is_scalar($body['phone'])?preg_replace('/\D/','',(string)$body['phone']):'';
            if(!preg_match('/^[6-9]\d{9}$/D',$phone))throw new HttpError(400,'Please enter a valid 10-digit mobile number.');
            $updates['phone']=$phone;
        }
        if(array_key_exists('deliveryLocation',$body)){
            $pin=$body['deliveryLocation'];
            if($pin===null)$updates['deliveryLocation']=null;
            else{
                $valid=fn($value)=>is_int($value)||is_float($value)&&is_finite($value);
                if(!is_array($pin)||!$valid($pin['latitude']??null)||abs($pin['latitude'])>90||!$valid($pin['longitude']??null)||abs($pin['longitude'])>180||(array_key_exists('accuracy',$pin)&&(!$valid($pin['accuracy'])||$pin['accuracy']<0)))throw new HttpError(400,'Please provide valid map coordinates.');
                $updates['deliveryLocation']=['latitude'=>$pin['latitude'],'longitude'=>$pin['longitude'],'updatedAt'=>(new \DateTimeImmutable('now',new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z')];
                if(array_key_exists('accuracy',$pin))$updates['deliveryLocation']['accuracy']=$pin['accuracy'];
            }
        }
        if(!$updates)throw new HttpError(400,'No profile changes were provided.');
        return $this->store->transaction(function()use($customer,$updates){
            $doc=$this->store->get('tiffins',$customer);if(!$doc)throw new HttpError(404,'Customer profile not found.');
            $this->store->put('tiffins',array_replace($doc,$updates));
            $result=(new ReadModels($this->store))->profile($customer);
            $result[1]['message']='Customer profile updated successfully.';return $result;
        });
    }
}
