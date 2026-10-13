<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
require_once __DIR__.'/billing.php';
final class Modifications {
    private const DEFAULTS=['adminWhatsAppNumber1'=>'','adminWhatsAppNumber2'=>'','lunchCutoffTime'=>'10:30','dinnerCutoffTime'=>'17:00','skipTiffinEnabled'=>true,'extraTiffinEnabled'=>true,'mealModificationEnabled'=>true,'otherRequestEnabled'=>true];
    public function __construct(private readonly Store $store){}
    public function settings():array{return success($this->store->all('tiffinmodificationsettings')[0]??self::DEFAULTS);}
    private static function truthy(mixed $v):bool{return !($v===null||$v===false||$v===0||$v===0.0||$v==='');}
    public function updateSettings(array $body):array {
        $updates=[];
        foreach(self::DEFAULTS as $key=>$default){
            $value=$body[$key]??$default;
            if(str_starts_with($key,'adminWhatsAppNumber')){
                if(!is_scalar($value))throw new HttpError(400,'Invalid admin WhatsApp number.');
                $value=preg_replace('/\s+/u','',trim((string)$value));
                if($value!==''&&!preg_match('/^(?:\+91)?[6-9]\d{9}$/D',$value))throw new HttpError(400,'Admin WhatsApp Number '.substr($key,-1).' must be a valid Indian mobile number.');
            }elseif(str_ends_with($key,'CutoffTime')){
                if(!is_string($value)||!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$value))throw new HttpError(400,'Invalid '.(str_starts_with($key,'lunch')?'lunch':'dinner').' cutoff time.');
            }else $value=self::truthy($value);
            $updates[$key]=$value;
        }
        return $this->store->transaction(function()use($updates){$existing=$this->store->all('tiffinmodificationsettings')[0]??null;$doc=$this->store->put('tiffinmodificationsettings',array_replace($existing??[],$updates),$existing===null);return success($doc,'Modification settings updated successfully.');});
    }
    public function requests(?string $id=null):array {
        $r=new ReadModels($this->store);
        if($id!==null){$doc=$this->store->get('customermodificationrequests',$id);if(!$doc)throw new HttpError(404,'Modification request not found.');return success($r->populate($doc,'customer','tiffins',['customerName','phone','barcode','mealType','status','address']));}
        $items=sorted($this->store->all('customermodificationrequests'),['requestDate'=>-1,'createdAt'=>-1]);
        return success(array_map(fn($doc)=>$r->populate($doc,'customer','tiffins',['customerName','phone','barcode','mealType','status']),$items));
    }
    private static function phone(string $value):?string{$value=preg_replace('/\D/','',$value);if(strlen($value)===10)return '91'.$value;return strlen($value)>=11?$value:null;}
    private function notice(array $request,array $customer,array $settings,bool $approved):bool {
        $types=['SKIP_TIFFIN'=>'Skip Tiffin','EXTRA_TIFFIN'=>'Extra Tiffin','MEAL_MODIFICATION'=>'Meal Modification','OTHER'=>'Other'];$meals=['BREAKFAST'=>'Breakfast','LUNCH'=>'Lunch','DINNER'=>'Dinner','BOTH'=>'Lunch + Dinner','ALL'=>'All Meals'];
        $date=(new \DateTimeImmutable($request['requestDate']))->setTimezone(new \DateTimeZone('Asia/Kolkata'))->format('d/m/Y');$type=$types[$request['requestType']]??$request['requestType'];$meal=$meals[$request['meal']]??$request['meal'];
        if($approved){$recipients=array_filter([self::phone($customer['phone']??'')]);$values=[$date,$type,$meal];}
        else{$recipients=array_unique(array_filter([self::phone($settings['adminWhatsAppNumber1']??''),self::phone($settings['adminWhatsAppNumber2']??'')]));$items=implode(', ',array_map(fn($item)=>($item['name']??'Item').' x '.($item['quantity']??1),$request['items']));$values=[$customer['customerName']??'Customer',$customer['phone']??'N/A',$customer['address']??'N/A',$date,$type,$meal,'Products: '.($items?:'N/A').' | Description: '.($request['description']?:'No description')];}
        foreach($recipients as $recipient){$this->store->queue('modification:'.$request['_id'].':'.($approved?'approved':'admin').':'.$recipient,['kind'=>$approved?'modification-approved':'modification-admin','requestId'=>$request['_id'],'to'=>$recipient,'templateName'=>$approved?'om_tiffin_modification_approved':'om_tiffin_modification_approval','languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>array_map(fn($v)=>['type'=>'text','text'=>(string)$v],$values)]]]);}
        return count($recipients)>0;
    }
    public function create(string $customerId,array $body,?\DateTimeImmutable $now=null):array {
        $type=$body['requestType']??null;$meal=$body['meal']??'ALL';$description=(string)($body['description']??'');
        if(!in_array($type,['SKIP_TIFFIN','EXTRA_TIFFIN','MEAL_MODIFICATION','OTHER'],true))throw new HttpError(400,'Invalid modification request type.');
        if(!in_array($meal,['BREAKFAST','LUNCH','DINNER','BOTH','ALL'],true))throw new HttpError(400,'Invalid meal selection.');
        if(empty($body['requestDate']))throw new HttpError(400,'Request date is required.');
        $day=dayKey((string)$body['requestDate']);$now=($now??new \DateTimeImmutable())->setTimezone(new \DateTimeZone('Asia/Kolkata'));
        if($day<$now->format('Y-m-d'))throw new HttpError(400,'Past date modification requests are not allowed.');
        preg_match_all('/./us',$description,$chars);$length=0;foreach($chars[0]as $char)$length+=strlen($char)===4?2:1;
        if($length>1000)throw new HttpError(400,'Description cannot exceed 1000 characters.');
        return $this->store->transaction(function()use($customerId,$body,$type,$meal,$description,$day,$now){
            $customer=$this->store->get('tiffins',$customerId);if(!$customer)throw new HttpError(404,'Customer profile not found.');
            $settings=$this->settings()[1]['data'];$flags=['SKIP_TIFFIN'=>'skipTiffinEnabled','EXTRA_TIFFIN'=>'extraTiffinEnabled','MEAL_MODIFICATION'=>'mealModificationEnabled','OTHER'=>'otherRequestEnabled'];
            if(empty($settings[$flags[$type]]))throw new HttpError(403,'This modification request type is currently disabled.');
            foreach(['LUNCH'=>['lunchCutoffTime','Lunch'],'DINNER'=>['dinnerCutoffTime','Dinner']]as $choice=>[$key,$label])if(in_array($meal,[$choice,'BOTH','ALL'],true)){
                $cutoff=$settings[$key]??self::DEFAULTS[$key];if($day===$now->format('Y-m-d')&&$now->format('H:i')>=$cutoff)throw new HttpError(400,$label." modification window is closed. Today's cutoff time was ".$cutoff.' IST.',['code'=>'MODIFICATION_CUTOFF_PASSED']);
            }
            $items=[];
            if(in_array($type,['EXTRA_TIFFIN','MEAL_MODIFICATION'],true)){
                if(!is_array($body['items']??null)||!$body['items'])throw new HttpError(400,'Please select at least one menu item.');
                foreach($body['items'] as $item){
                    if(!is_array($item)||empty($item['menuItem'])||!is_numeric($item['quantity']??null)||(float)$item['quantity']!=(int)$item['quantity']||(int)$item['quantity']<1)continue;
                    $menu=$this->store->get('websitemenus',(string)$item['menuItem']);if(!$menu||empty($menu['isAvailable']))throw new HttpError(400,'One or more selected menu items are unavailable.');
                    $allowed=match($meal){'LUNCH'=>$type==='EXTRA_TIFFIN'?['Lunch']:['Lunch','Both'],'DINNER'=>$type==='EXTRA_TIFFIN'?['Dinner']:['Dinner','Both'],'BOTH'=>$type==='MEAL_MODIFICATION'?['Lunch','Dinner','Both']:[],default=>[]};
                    if(!in_array($menu['mealType']??null,$allowed,true))throw new HttpError(400,'Menu item "'.$menu['name'].'" is not available for the selected meal.');
                    $items[]=['_id'=>bin2hex(random_bytes(12)),'menuItem'=>$menu['_id'],'name'=>$menu['name'],'price'=>money($menu['price']??0),'quantity'=>(int)$item['quantity']];
                }
                if(!$items)throw new HttpError(400,'Please select valid menu items and quantities.');
            }
            $date=(new \DateTimeImmutable($day.'T00:00:00+05:30'))->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.000\Z');
            if($this->store->first('customermodificationrequests',fn($d)=>($d['customer']??null)===$customerId&&($d['requestDate']??null)===$date&&($d['status']??null)==='PENDING'))throw new HttpError(409,'A pending modification request already exists for this date.');
            $request=$this->store->put('customermodificationrequests',['customer'=>$customerId,'requestType'=>$type,'requestDate'=>$date,'meal'=>$meal,'description'=>trim($description),'items'=>$items,'status'=>'PENDING','adminRemark'=>'','completedAt'=>null,'reviewedAt'=>null,'reviewedBy'=>null],true);
            $this->notice($request,$customer,$settings,false);
            return success($request,'Modification request submitted successfully.',201);
        });
    }
    public function status(string $id,array $body,?string $admin):array {
        $status=$body['status']??null;if(!in_array($status,['APPROVED','REJECTED','COMPLETED'],true))throw new HttpError(400,'Invalid status.');
        return $this->store->transaction(function()use($id,$body,$status,$admin){
            $request=$this->store->get('customermodificationrequests',$id);if(!$request)throw new HttpError(404,'Modification request not found.');
            if($request['status']==='COMPLETED')throw new HttpError(400,'Completed requests cannot be modified.');
            $already=$status==='APPROVED'&&$request['status']==='APPROVED';
            if(!$already){
                if($status==='COMPLETED'&&$request['status']!=='APPROVED')throw new HttpError(400,'Only approved requests can be marked as completed.');
                if($request['status']!=='PENDING'&&$status!=='COMPLETED')throw new HttpError(400,'Only pending requests can be approved or rejected.');
                $request['status']=$status;$now=(new \DateTimeImmutable('now',new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');
                if($status==='COMPLETED')$request['completedAt']=$now;else{$request['reviewedAt']=$now;$request['reviewedBy']=$admin;}
                if($status!=='APPROVED')$request['adminRemark']=trim((string)($body['adminRemark']??''));
                $request=$this->store->put('customermodificationrequests',$request);
            }
            $queued=false;if($status==='APPROVED'&&!$already){$customer=$this->store->get('tiffins',$request['customer']);if($customer)$queued=$this->notice($request,$customer,$this->settings()[1]['data'],true);}
            $r=new ReadModels($this->store);$result=success($r->populate($request,'customer','tiffins',['customerName','phone','barcode','mealType','status']),$status==='APPROVED'?($already?'Modification request was already approved.':'Modification request approved successfully.'):'Modification request marked as '.strtolower($status).'.');
            if($status==='APPROVED')$result[1]['whatsapp']=['sent'=>false,'reason'=>$already?'ALREADY_APPROVED':($queued?'QUEUED':'CUSTOMER_PHONE_NOT_AVAILABLE')];return $result;
        });
    }
}
