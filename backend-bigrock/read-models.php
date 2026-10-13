<?php
declare(strict_types=1);
namespace OMT;
final class ReadModels {
    public function __construct(private readonly Store $store){}
    public function hydrate(string $collection,array $doc):array {
        static $defaults;$defaults??=json_decode(file_get_contents(__DIR__.'/model-defaults.json'),true,512,JSON_THROW_ON_ERROR);
        foreach($defaults[$collection]??[]as $path=>$value){$parts=explode('.',$path);$last=array_pop($parts);$target=&$doc;
            foreach($parts as $part){if(array_key_exists($part,$target)&&!is_array($target[$part])){unset($target);continue 2;}$target[$part]??=[];$target=&$target[$part];}
            if(!array_key_exists($last,$target))$target[$last]=$value;unset($target);
        }return $doc;
    }
    public function populate(array $doc,string $field,string $collection,?array $fields=null):array {
        $value=$doc[$field]??null;
        if($value!==null){$linked=$this->store->get($collection,(string)$value);if($linked)$linked=$this->hydrate($collection,$linked);$doc[$field]=$linked&&$fields?only($linked,$fields):$linked;}
        return $doc;
    }
    public function latestBill(string $customer):?array{$bill=sorted($this->store->find('bills',fn($b)=>$b['customer']===$customer),['createdAt'=>-1])[0]??null;return $bill?$this->hydrate('bills',$bill):null;}
    public function customers(array $query):array {
        $page=max(1,(int)($query['page']??1));$limit=max(1,(int)($query['limit']??5));
        $search=(string)($query['search']??'');$status=$query['status']??null;
        $items=$this->store->find('tiffins',function($d)use($search,$status){
            if($status!==null&&$status!==''&&$d['status']!==$status)return false;
            if($search!==''){$match=@preg_match('~'.str_replace('~','\\~',$search).'~iu',$d['customerName']);if($match===false)throw new HttpError(400,'Invalid search expression');if(!$match)return false;}
            return true;
        });
        $total=count($items);$sort=(string)($query['sort']??'createdAt');$direction=str_starts_with($sort,'-')?-1:1;$sort=ltrim($sort,'-');
        $items=array_slice(sorted($items,[$sort=>$direction]),($page-1)*$limit,$limit);
        $items=array_map(function($d){$d=$this->hydrate('tiffins',$d);$bill=$this->latestBill($d['_id']);return [...$d,'latestBill'=>$bill,'price'=>$bill['totalAmount']??0,'paymentStatus'=>$bill['status']??'Pending','pendingAmount'=>$bill['pendingAmount']??0];},$items);
        return [200,['success'=>true,'page'=>$page,'totalPages'=>(int)ceil($total/$limit),'totalCustomers'=>$total,'count'=>count($items),'data'=>$items]];
    }
    public function customer(string $id):array {
        $doc=$this->store->get('tiffins',$id);if(!$doc)throw new HttpError(404,'Customer not found');$doc=$this->hydrate('tiffins',$doc);
        if(empty($doc['pricing'])||($doc['pricing']['pricingType']??'')==='default'){
            $p=sorted($this->store->all('prices'),['createdAt'=>-1])[0]??[];
            $doc['pricing']=['pricingType'=>'default','breakfastPrice'=>$p['breakfast']??40,'lunchPrice'=>$p['lunch']??90,'dinnerPrice'=>$p['dinner']??90,'extraCharge'=>0,'extraReason'=>'','discountType'=>'fixed','discount'=>0];
        }
        $bill=$this->latestBill($id);$doc['latestBill']=$bill;
        $doc['price']=$bill['totalAmount']??($doc['price']??0);$doc['paymentStatus']=$bill['status']??'Pending';$doc['pendingAmount']=$bill['pendingAmount']??0;
        return success($doc);
    }
    public function customerStats():array {
        $all=$this->store->all('tiffins');return success(['totalCustomers'=>count($all),'activeCustomers'=>count(array_filter($all,fn($d)=>$d['status']==='Active')),'inactiveCustomers'=>count(array_filter($all,fn($d)=>$d['status']==='Inactive')),'monthlyIncome'=>array_sum(array_column($this->store->all('bills'),'totalAmount'))]);
    }
    public function bills(?string $customer=null):array {
        $items=sorted($this->store->find('bills',fn($d)=>$customer===null||$d['customer']===$customer),$customer===null?['createdAt'=>-1]:['year'=>-1,'month'=>-1,'cycle'=>-1,'createdAt'=>-1]);
        if($customer===null)$items=array_map(fn($d)=>$this->populate($this->hydrate('bills',$d),'customer','tiffins',['customerName','phone']),$items);
        else $items=array_map(fn($d)=>only($d,explode(' ','invoiceNo month year cycle breakfastQty lunchQty dinnerQty breakfastAmount lunchAmount dinnerAmount extraAmount totalAmount paidAmount pendingAmount previousPendingAmount status createdAt updatedAt')),$items);
        return success($items);
    }
    public function bill(string $id,?string $customer=null):array {
        $doc=$this->store->get('bills',$id);if(!$doc||($customer!==null&&$doc['customer']!==$customer))throw new HttpError(404,'Bill not found.');
        return success($this->populate($customer===null?$this->hydrate('bills',$doc):$doc,'customer','tiffins',$customer===null?['customerName','phone','address']:['customerName','phone','address','barcode','mealType']));
    }
    public function payments(?string $customer=null,?string $bill=null):array {
        $items=sorted($this->store->find('payments',fn($p)=>($customer===null||$p['customer']===$customer)&&($bill===null||$p['bill']===$bill)),$customer!==null?['paymentDate'=>-1,'createdAt'=>-1]:($bill!==null?['paymentDate'=>-1]:['createdAt'=>-1]));
        $items=array_map(function($d)use($customer){
            if($customer!==null){$d=only($d,explode(' ','bill amount paymentMethod transactionId gateway paymentDate status note createdAt updatedAt'));return $this->populate($d,'bill','bills',['invoiceNo','month','year','cycle','totalAmount']);}
            return $this->populate($this->populate($this->hydrate('payments',$d),'customer','tiffins'),'bill','bills');
        },$items);
        return $customer!==null||$bill!==null?success($items):[200,$items];
    }
    public function payment(string $id):array {
        $doc=$this->store->get('payments',$id);if(!$doc)throw new HttpError(404,'Payment not found');
        return [200,$this->populate($this->populate($this->hydrate('payments',$doc),'customer','tiffins'),'bill','bills')];
    }
    public function billsForPayment(string $customer,bool $pending=false):array {
        return [200,sorted($this->store->find('bills',fn($d)=>$d['customer']===$customer&&(!$pending||($d['pendingAmount']??0)>0)),['createdAt'=>-1])];
    }
    public function billDelivery():array {
        $items=[];foreach(sorted($this->store->all('bills'),['createdAt'=>-1])as $bill){
            $c=$this->store->get('tiffins',$bill['customer']);$w=$bill['whatsappDelivery']??[];
            $items[]=['billId'=>$bill['_id'],'customer'=>$c['customerName']??'Unknown','invoice'=>$bill['invoiceNo']??'-','month'=>$bill['month'],'year'=>$bill['year'],'cycle'=>$bill['cycle'],'status'=>$w['status']??'pending','sentAt'=>$w['sentAt']??null,'deliveredAt'=>$w['deliveredAt']??null,'readAt'=>$w['readAt']??null,'failedAt'=>$w['failedAt']??null,'reason'=>$w['reason']??'Not sent yet'];
        }return success($items);
    }
    public function profile(string $customer):array {
        $doc=$this->store->get('tiffins',$customer);if(!$doc)throw new HttpError(404,'Customer profile not found');
        return [200,['success'=>true,'customer'=>only($this->hydrate('tiffins',$doc),explode(' ','customerName phone address deliveryLocation mealType status barcode pricing createdAt updatedAt'))]];
    }
    public function period(array $query):array {
        if(empty($query['month'])||empty($query['year'])||empty($query['cycle']))throw new HttpError(400,'Month, year and billing cycle are required.');
        $cycle=(string)$query['cycle'];if(!in_array($cycle,['1','2'],true))throw new HttpError(400,'Invalid billing cycle. Use 1 or 2.');
        $month=filter_var($query['month'],FILTER_VALIDATE_INT);$year=filter_var($query['year'],FILTER_VALIDATE_INT);
        if(!$month||$month<1||$month>12||!$year||$year<2000)throw new HttpError(400,'Invalid month or year.');
        $start=new \DateTimeImmutable(sprintf('%04d-%02d-%02dT00:00:00Z',$year,$month,$cycle==='1'?1:16));
        $end=$cycle==='1'?$start->modify('+15 days'):$start->modify('first day of next month');
        return ['month'=>$month,'year'=>$year,'cycle'=>$cycle,'startDate'=>$start->format('Y-m-d\TH:i:s.000\Z'),'endDate'=>$end->format('Y-m-d\TH:i:s.000\Z')];
    }
    public function meals(string $customer,array $query,bool $portal):array {
        $period=$this->period($query);$items=sorted($this->store->find('dailyentries',fn($d)=>$d['customer']===$customer&&$d['date']>=$period['startDate']&&$d['date']<$period['endDate']),['date'=>1]);
        if($portal)$items=array_map(fn($d)=>only($d,explode(' ','date breakfastQty lunchQty dinnerQty extraItems remark createdAt updatedAt')),$items);
        $result=success($items);if($portal)$result[1]['period']=$period;return $result;
    }
    public function entriesByDate(string $date):array {
        $start=isoDate($date);$day=substr($start,0,10);$items=$this->store->find('dailyentries',fn($d)=>substr($d['date'],0,10)===$day);
        return success(array_map(fn($d)=>$this->populate($d,'customer','tiffins'),$items));
    }
    public function announcements(string $customer):array {
        $items=sorted($this->store->find('announcementdeliveries',fn($d)=>$d['customer']===$customer&&in_array($d['status'],['delivered','read'],true)),['createdAt'=>-1]);
        return success(array_map(fn($d)=>only($d,explode(' ','title message templateName status whatsappMessageId sentAt deliveredAt readAt createdAt updatedAt')),$items));
    }
    public function modifications(string $customer):array {
        return success(array_map(fn($d)=>only($d,explode(' ','requestType requestDate meal description items status adminRemark reviewedAt createdAt updatedAt')),sorted($this->store->find('customermodificationrequests',fn($d)=>$d['customer']===$customer),['requestDate'=>-1,'createdAt'=>-1])));
    }
    public function accountStatuses():array {
        return [200,['success'=>true,'accounts'=>array_map(fn($d)=>only($d,['customer','userId','loginEnabled','isFirstLogin']),$this->store->all('customeraccounts'))]];
    }
    public function customerUsers():array {
        $items=[];foreach($this->store->all('customerfirstloginlogs')as $log){
            $a=$this->store->get('customeraccounts',$log['customerAccount']);if(!$a)continue;$c=$this->store->get('tiffins',$log['customer']);
            $items[]=['customerId'=>$c['_id']??null,'customerName'=>$c['customerName']??'','phone'=>$c['phone']??'','barcode'=>$c['barcode']??$log['userId']??'','userId'=>$log['userId']??$a['userId']??'','firstLoginAt'=>$log['firstLoginAt']??null,'lastLoginAt'=>$a['lastLoginAt']??null,'loginEnabled'=>($a['loginEnabled']??false)===true];
        }return [200,['success'=>true,'count'=>count($items),'data'=>sorted($items,['firstLoginAt'=>-1])]];
    }
}
