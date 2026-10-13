<?php
declare(strict_types=1);
namespace OMT;
function sorted(array $items,array $fields):array {
    usort($items,function($a,$b)use($fields){foreach($fields as $key=>$direction){$order=($a[$key]??null)<=>($b[$key]??null);if($order)return $direction*$order;}return 0;});return $items;
}
function success(mixed $data,?string $message=null,int $status=200):array{$body=['success'=>true,'data'=>$data];if($message!==null)$body['message']=$message;return [$status,$body];}
function only(array $record,array $fields):array{return array_intersect_key($record,array_flip(['_id',...$fields]));}
function money(mixed $value,string $field='amount'):float {
    if(!is_numeric($value)||!is_finite((float)$value)||(float)$value<0)throw new HttpError(400,'Invalid '.$field);
    return (float)$value;
}
function isoDate(mixed $date):string {
    try{$d=new \DateTimeImmutable((string)$date,new \DateTimeZone('UTC'));return $d->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');}
    catch(\Throwable){throw new HttpError(400,'Invalid date');}
}
final class Catalog {
    public function __construct(private readonly Store $store){}
    public function settings():array {
        $default=array_fill_keys(['websiteEnabled','plansEnabled','menuEnabled','inquiriesEnabled','customerLoginEnabled','testimonialsEnabled','faqEnabled','contactEnabled','lunchEnabled','dinnerEnabled','notificationEnabled'],true);
        return success($this->store->all('websitesettings')[0]??[...$default,'onlineOrdersEnabled'=>false,'adminMobile1'=>'','adminMobile2'=>'']);
    }
    public function updateSettings(array $body):array {
        return $this->store->transaction(function()use($body){
            $existing=$this->store->all('websitesettings')[0]??null;$doc=$existing??$this->settings()[1]['data'];
            $fields=['websiteEnabled','plansEnabled','menuEnabled','onlineOrdersEnabled','inquiriesEnabled','customerLoginEnabled','testimonialsEnabled','faqEnabled','contactEnabled','lunchEnabled','dinnerEnabled','notificationEnabled'];
            foreach($fields as $field)if(array_key_exists($field,$body))$doc[$field]=(bool)$body[$field];
            foreach(['adminMobile1','adminMobile2']as $field)if(array_key_exists($field,$body))$doc[$field]=trim((string)$body[$field]);
            return success($this->store->put('websitesettings',$doc,$existing===null),'Website settings updated successfully');
        });
    }
    public function prices():array{return success($this->store->all('prices')[0]??['breakfast'=>40,'lunch'=>70,'dinner'=>90]);}
    public function updatePrices(array $body):array {
        return $this->store->transaction(function()use($body){$doc=$this->store->all('prices')[0]??null;$insert=$doc===null;$doc??=[];
            foreach(['breakfast','lunch','dinner']as $key){if(!array_key_exists($key,$body))throw new HttpError(400,'Meal prices are required');$doc[$key]=money($body[$key],$key);}
            return success($this->store->put('prices',$doc,$insert),'Prices updated successfully');
        });
    }
    public function menu(bool $public,array $query):array {
        $items=$this->store->all('websitemenus');$meal=$query['mealType']??'';
        if($public)$items=array_filter($items,fn($i)=>!empty($i['isAvailable'])&&(!in_array($meal,['Lunch','Dinner'],true)||in_array($i['mealType'],[$meal,'Both'],true)));
        return success(sorted(array_values($items),['sortOrder'=>1,'createdAt'=>1]));
    }
    public function saveMenu(array $body,?string $id=null):array {
        if(empty(trim((string)($body['name']??'')))||!isset($body['price']))throw new HttpError(400,'Name and price are required.');
        $meal=$body['mealType']??'Lunch';if(!in_array($meal,['Lunch','Dinner','Both'],true))throw new HttpError(400,'Invalid meal type');
        $doc=['name'=>trim((string)$body['name']),'description'=>trim((string)($body['description']??'')),'price'=>money($body['price'],'price'),'mealType'=>$meal,'isAvailable'=>array_key_exists('isAvailable',$body)?(bool)$body['isAvailable']:true,'sortOrder'=>(float)($body['sortOrder']??0)];
        return $this->store->transaction(function()use($doc,$id){
            if($id){$old=$this->store->get('websitemenus',$id);if(!$old)throw new HttpError(404,'Menu item not found.');$doc=[...$old,...$doc];}
            return success($this->store->put('websitemenus',$doc,$id===null),$id?'Menu item updated successfully.':'Menu item created successfully.',$id?200:201);
        });
    }
    public function reviews(bool $public):array{return success(sorted($this->store->find('websitereviews',fn($r)=>!$public||$r['status']==='Approved'),['createdAt'=>-1]));}
    public function saveReview(array $body,?string $id=null):array {
        return $this->store->transaction(function()use($body,$id){
            $doc=$id?$this->store->get('websitereviews',$id):['status'=>'Pending'];if(!$doc)throw new HttpError(404,'Review not found.');
            foreach(['customerName'=>100,'reviewText'=>1000]as $key=>$limit){if(!$id||array_key_exists($key,$body)){$value=trim((string)($body[$key]??''));if($value===''||mb_strlen($value)>$limit)throw new HttpError(400,$key==='customerName'?'Customer name must be between 1 and 100 characters.':'Review must be between 1 and 1000 characters.');$doc[$key]=$value;}}
            if(!$id||array_key_exists('rating',$body)){$rating=filter_var($body['rating']??null,FILTER_VALIDATE_INT);if($rating===false||$rating<1||$rating>5)throw new HttpError(400,'Rating must be a whole number between 1 and 5.');$doc['rating']=$rating;}
            if($id&&isset($body['status'])){if(!in_array($body['status'],['Pending','Approved','Rejected'],true))throw new HttpError(400,'Invalid review status.');$doc['status']=$body['status'];}
            return success($this->store->put('websitereviews',$doc,$id===null),$id?'Review updated successfully.':'Thank you for your review. It has been submitted for approval.',$id?200:201);
        });
    }
    public function orders(?string $phone=null):array {
        $orders=sorted($this->store->find('websiteorders',fn($o)=>$phone===null||$o['mobileNumber']===trim($phone)),['createdAt'=>-1]);
        return success($phone===null?$orders:array_slice($orders,0,20));
    }
    public function order(string $id):array {$doc=$this->store->get('websiteorders',$id);if(!$doc)throw new HttpError(404,'Order not found.');return success($doc);}
    public function createOrder(array $body):array {
        return $this->store->transaction(function()use($body){
            if(($this->settings()[1]['data']['onlineOrdersEnabled']??true)===false)throw new HttpError(403,'Online orders are currently disabled.');
            foreach(['customerName','mobileNumber','deliveryAddress']as $key)if(empty(trim((string)($body[$key]??''))))throw new HttpError(400,'Customer name, mobile number and delivery address are required.');
            if(empty($body['items'])||!is_array($body['items']))throw new HttpError(400,'At least one menu item is required.');
            $items=[];$total=0;
            foreach($body['items']as $item){
                $menu=$this->store->get('websitemenus',(string)($item['menuItemId']??''));
                if(!$menu||empty($menu['isAvailable']))throw new HttpError(400,'One or more selected menu items are unavailable.');
                $quantity=filter_var($item['quantity']??null,FILTER_VALIDATE_INT);if($quantity===false||$quantity<1)throw new HttpError(400,'Invalid item quantity.');
                $meal=$menu['mealType']==='Both'?($item['mealType']??''):$menu['mealType'];
                if(!in_array($meal,['Lunch','Dinner'],true))throw new HttpError(400,'Please select Lunch or Dinner for '.$menu['name'].'.');
                $items[]=['menuItemId'=>$menu['_id'],'name'=>$menu['name'],'price'=>(float)$menu['price'],'quantity'=>$quantity,'mealType'=>$meal];$total+=(float)$menu['price']*$quantity;
            }
            $doc=['customerName'=>trim($body['customerName']),'mobileNumber'=>trim($body['mobileNumber']),'email'=>trim((string)($body['email']??'')),'deliveryAddress'=>trim($body['deliveryAddress']),'items'=>$items,'orderDate'=>isoDate($body['orderDate']??'now'),'specialInstructions'=>trim((string)($body['specialInstructions']??'')),'totalAmount'=>$total,'paymentStatus'=>'Pending','orderStatus'=>'Pending'];
            return success($this->store->put('websiteorders',$doc,true),'Online order placed successfully.',201);
        });
    }
    public function updateOrder(string $id,array $body):array {
        return $this->store->transaction(function()use($id,$body){$doc=$this->store->get('websiteorders',$id);if(!$doc)throw new HttpError(404,'Order not found.');
            foreach(['orderStatus'=>['Pending','Confirmed','Preparing','Out for Delivery','Delivered','Cancelled'],'paymentStatus'=>['Pending','Paid','Failed','Not Required']]as $field=>$values)if(isset($body[$field])){if(!in_array($body[$field],$values,true))throw new HttpError(400,'Invalid '.$field);$doc[$field]=$body[$field];}
            foreach(['specialInstructions','deliveryAddress']as $field)if(array_key_exists($field,$body))$doc[$field]=trim((string)$body[$field]);
            return success($this->store->put('websiteorders',$doc),'Order updated successfully.');
        });
    }
    public function remove(string $collection,string $id,string $label):array {
        return $this->store->transaction(function()use($collection,$id,$label){if(!$this->store->delete($collection,$id))throw new HttpError(404,$label.' not found.');return [200,['success'=>true,'message'=>$label.' deleted successfully.']];});
    }
}
