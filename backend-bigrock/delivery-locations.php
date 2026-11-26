<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
final class DeliveryLocations {
    public function __construct(private readonly Store $store){}
    public static function valid(mixed $pin):bool {
        $number=fn($v)=>(is_int($v)||is_float($v))&&is_finite((float)$v);
        return is_array($pin)&&$number($pin['latitude']??null)&&abs($pin['latitude'])<=90&&$number($pin['longitude']??null)&&abs($pin['longitude'])<=180;
    }
    public static function version(array $row):string {
        return hash('sha256',json_encode([$row['deliveryLocation']??null,$row['deliveryInstructions']??''],JSON_THROW_ON_ERROR|JSON_PRESERVE_ZERO_FRACTION));
    }
    public static function view(array $row):array {
        return only($row,['_id','customerName','barcode','phone','address','mealType','status'])+['deliveryLocation'=>self::valid($row['deliveryLocation']??null)?$row['deliveryLocation']:null,'deliveryInstructions'=>$row['deliveryInstructions']??'','locationVersion'=>self::version($row)];
    }
    public function listing():array {return success(array_map(self::view(...),sorted($this->store->all('tiffins'),['customerName'=>1])));}
    public function get(string $id):array {
        if(!preg_match('/^[a-f0-9]{24}$/iD',$id))throw new HttpError(400,'Invalid customer');
        return success(self::view($this->store->get('tiffins',$id)??throw new HttpError(404,'Customer not found')));
    }
    public function save(string $id,array $body,string $actor):array {
        if(!preg_match('/^[a-f0-9]{24}$/iD',$id))throw new HttpError(400,'Invalid customer');
        $pin=$body['deliveryLocation']??null;if(!self::valid($pin))throw new HttpError(400,'Enter valid latitude and longitude');
        if(isset($pin['accuracy'])&&(!is_numeric($pin['accuracy'])||!is_finite((float)$pin['accuracy'])||$pin['accuracy']<0||$pin['accuracy']>100000))throw new HttpError(400,'Invalid GPS accuracy');
        $note=$body['deliveryInstructions']??'';if(!is_string($note)||mb_strlen($note)>300)throw new HttpError(400,'Delivery instructions must be at most 300 characters');$note=trim($note);
        $version=$body['expectedVersion']??'';$key=$body['requestId']??'';
        if(!is_string($version)||!preg_match('/^[a-f0-9]{64}$/D',$version)||!is_string($key)||!preg_match('/^[a-f0-9-]{36}$/iD',$key))throw new HttpError(400,'Refresh the customer before saving');
        $clean=['latitude'=>round((float)$pin['latitude'],7),'longitude'=>round((float)$pin['longitude'],7)];if(isset($pin['accuracy']))$clean['accuracy']=round((float)$pin['accuracy'],1);
        $fingerprint=hash('sha256',json_encode([$clean,$note],JSON_THROW_ON_ERROR|JSON_PRESERVE_ZERO_FRACTION));
        return $this->store->transaction(function()use($id,$actor,$clean,$note,$version,$key,$fingerprint){
            $row=$this->store->get('tiffins',$id)??throw new HttpError(404,'Customer not found');
            $old=$this->store->first('deliverylocationevents',fn($e)=>($e['customer']??'')===$id&&($e['requestId']??'')===$key&&($e['actor']??'')===$actor);
            if($old){if($old['fingerprint']!==$fingerprint)throw new HttpError(409,'This request was used for another location');return success(self::view($row),'Location was already saved');}
            if(!hash_equals(self::version($row),$version))throw new HttpError(409,'This location changed. Refresh and check the latest pin before saving');
            $before=['deliveryLocation'=>$row['deliveryLocation']??null,'deliveryInstructions'=>$row['deliveryInstructions']??''];
            $row['deliveryLocation']=$clean+['source'=>'admin','updatedAt'=>gmdate(DATE_ATOM)];$row['deliveryInstructions']=$note;
            $this->store->prepareDeliveryLocationCollection();
            $this->store->put('deliverylocationevents',['customer'=>$id,'actor'=>$actor,'requestId'=>$key,'fingerprint'=>$fingerprint,'before'=>$before,'after'=>['deliveryLocation'=>$row['deliveryLocation'],'deliveryInstructions'=>$note]],true);
            return success(self::view($this->store->put('tiffins',$row)),'Delivery location saved. Address and billing are unchanged');
        });
    }
}
