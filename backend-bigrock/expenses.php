<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/billing.php';
require_once __DIR__.'/walk-ins.php';
require_once __DIR__.'/dashboard.php';
final class Expenses {
    public const CATEGORIES=['groceries'=>'Food & groceries','staff'=>'Staff & wages','rent'=>'Rent','delivery'=>'Delivery & transport','utilities'=>'Utilities','supplies'=>'Supplies & packaging','maintenance'=>'Maintenance','other'=>'Other'];
    public function __construct(private readonly Store $store){}
    private function period(array $query):array {
        $today=new \DateTimeImmutable('now',new \DateTimeZone('Asia/Kolkata'));
        $period=Dashboard::periods(['year'=>$query['year']??$today->format('Y'),'month'=>$query['month']??$today->format('n'),'cycle'=>$query['cycle']??null]);
        if($period['year']===null||$period['month']===null)throw new HttpError(400,'Select a year and month');
        return $period;
    }
    public function financialData(array $query):array {
        $period=$this->period($query);$year=$period['year'];$month=$period['month'];$cycle=$period['cycle'];
        $data=(new Dashboard($this->store))->financialReport($query)[1]['data'];
        $data['revenue']=[];$data['collections']=[];$data['basis']='bill-period';$data['period']=$period['label'];$data['basisWarnings']=[];
        $bills=[];
        $matches=fn($y,$m,$c)=>(int)$y===$year&&(int)$m===$month&&($cycle===null||(int)$c===$cycle);
        foreach($this->store->all('bills')as $bill){
            if(($bill['status']??'')==='Cancelled')continue;
            $date=$bill['generatedAt']??$bill['createdAt']??null;
            $instant=$date?new \DateTimeImmutable($date):null;
            if($instant)$instant=$instant->setTimezone(new \DateTimeZone('Asia/Kolkata'));
            $y=$bill['year']??($instant?(int)$instant->format('Y'):null);$m=$bill['month']??($instant?(int)$instant->format('n'):null);$c=$bill['cycle']??($instant?((int)$instant->format('j')<=15?1:2):null);
            if(!$matches($y,$m,$c))continue;
            $id=$bill['_id'];$bills[$id]=$bill+['_reportCycle'=>(int)$c];
            if(!isset($bill['year'],$bill['month'],$bill['cycle']))$data['basisWarnings'][]='Invoice '.($bill['invoiceNo']??$id).' has no stored billing period; generation date used.';
            $data['revenue'][]=['invoice'=>$bill['invoiceNo']??$id,'billId'=>$id,'customer'=>$bill['customer'],'generatedAt'=>$date,'grossAmount'=>max(0,Wallet::paise($bill['totalAmount'])-Wallet::paise($bill['previousPendingAmount']??0))/100,'year'=>$year,'month'=>$month,'cycle'=>(int)$c,'receivedPaise'=>0,'carryPaise'=>Wallet::paise($bill['previousPendingAmount']??0)];
        }
        foreach($this->store->all('payments')as $payment){
            $bill=$bills[$payment['bill']??'']??null;if(!$bill||($payment['status']??'')!=='Success')continue;
            $applied=(int)($payment['amountAppliedPaise']??max(0,Wallet::paise($payment['amount'])-(int)($payment['excessWalletCreditPaise']??0)));
            $data['collections'][]=['id'=>$payment['_id'],'customer'=>$payment['customer'],'invoice'=>$bill['invoiceNo']??$bill['_id'],'billId'=>$bill['_id'],'receivedAt'=>$payment['paymentDate']??$payment['createdAt']??null,'amount'=>$applied/100,'kind'=>'invoice-payment','reference'=>$payment['transactionId']??'','cycle'=>$bill['_reportCycle']];
        }
        foreach($this->store->all('walkincustomers')as $person){
            $orders=[];foreach(WalkIns::orders($person)as $order){$date=(new \DateTimeImmutable($order['generatedAt']))->setTimezone(new \DateTimeZone('Asia/Kolkata'));$c=(int)$date->format('j')<=15?1:2;if(!$matches($date->format('Y'),$date->format('n'),$c))continue;$orders[$order['id']]=$order;
                $data['revenue'][]=['invoice'=>$order['id'],'billId'=>$order['id'],'customer'=>$person['_id'],'generatedAt'=>$order['generatedAt'],'grossAmount'=>$order['totalPaise']/100,'year'=>$year,'month'=>$month,'cycle'=>$c,'receivedPaise'=>0,'carryPaise'=>0];}
            $currentOrder=null;foreach(WalkIns::payments($person)as $index=>$payment){if(empty($payment['approvedBy']))continue;$first=isset($payment['paidAfterPaise'])?$payment['paidAfterPaise']===Wallet::paise($payment['amount']):$index===0;if($first)$currentOrder=$payment['unpaidOrderId']??$payment['receiptNo']??null;$orderId=$payment['unpaidOrderId']??$currentOrder;if(!isset($orders[$orderId]))continue;$date=new \DateTimeImmutable($orders[$orderId]['generatedAt']);$c=(int)$date->setTimezone(new \DateTimeZone('Asia/Kolkata'))->format('j')<=15?1:2;
                $data['collections'][]=['id'=>$payment['receiptNo']??'','customer'=>$person['_id'],'invoice'=>$orderId,'billId'=>$orderId,'receivedAt'=>$payment['paymentDate'],'amount'=>$payment['amount'],'kind'=>'walk-in-payment','reference'=>$payment['reference']??'','cycle'=>$c];}
        }
        $received=[];foreach($data['collections']as $row)$received[$row['billId']]=($received[$row['billId']]??0)+Wallet::paise($row['amount']);
        foreach($data['revenue']as &$row)$row['receivedPaise']=$received[$row['billId']]??0;unset($row);
        $income=array_sum(array_map(fn($row)=>Wallet::paise($row['grossAmount']),$data['revenue']));$collection=array_sum(array_values($received));$expense=array_sum(array_column($data['expenses'],'amountPaise'));
        $data['expenseSummary']=['incomePaise'=>$income,'collectionPaise'=>$collection,'expensePaise'=>$expense,'netEarningsPaise'=>$income-$expense,'cashAfterExpensesPaise'=>$collection-$expense];
        return $data;
    }
    public function report(array $query):array {
        $period=$this->period($query);$year=$period['year'];$month=$period['month'];$cycle=$period['cycle'];$report=$this->financialData($query);
        $prefix=sprintf('%04d-%02d-',$year,$month);$days=[];$start=new \DateTimeImmutable($prefix.'01',new \DateTimeZone('Asia/Kolkata'));
        for($day=1;$day<=(int)$start->format('t');$day++){if($cycle!==null&&($day<=15?1:2)!==$cycle)continue;$date=$prefix.str_pad((string)$day,2,'0',STR_PAD_LEFT);$days[$date]=['date'=>$date,'incomePaise'=>0,'collectionPaise'=>0,'expensePaise'=>0,'netPaise'=>0];}
        $cycles=[1=>['cycle'=>1,'incomePaise'=>0,'collectionPaise'=>0,'expensePaise'=>0,'netPaise'=>0],2=>['cycle'=>2,'incomePaise'=>0,'collectionPaise'=>0,'expensePaise'=>0,'netPaise'=>0]];
        $categories=[];foreach($report['expenses']as $row){$date=$row['date'];if(isset($days[$date]))$days[$date]['expensePaise']+=(int)$row['amountPaise'];$c=(int)substr($date,8,2)<=15?1:2;$cycles[$c]['expensePaise']+=(int)$row['amountPaise'];$categories[$row['category']]=($categories[$row['category']]??0)+(int)$row['amountPaise'];}
        foreach($report['revenue']as $row)$cycles[$row['cycle']]['incomePaise']+=Wallet::paise($row['grossAmount']);
        foreach($report['collections']as $row)$cycles[$row['cycle']]['collectionPaise']+=Wallet::paise($row['amount']);
        foreach($cycles as &$row)$row['netPaise']=$row['incomePaise']-$row['expensePaise'];unset($row);
        $entries=sorted($this->store->find('businessexpenses',fn($row)=>str_starts_with($row['date']??'',$prefix)&&($cycle===null||((int)substr($row['date'],8,2)<=15?1:2)===$cycle)),['date'=>-1,'createdAt'=>-1]);
        return success(['year'=>$year,'month'=>$month,'cycle'=>$cycle,'label'=>$period['label'],'categories'=>self::CATEGORIES,'summary'=>$report['expenseSummary'],'daily'=>array_values($days),'cycles'=>array_values(array_filter($cycles,fn($row)=>$cycle===null||$row['cycle']===$cycle)),'invoices'=>$report['revenue'],'receipts'=>$report['collections'],'customers'=>$report['customers'],'basisWarnings'=>$report['basisWarnings'],'categoryTotalsPaise'=>$categories,'entries'=>$entries,'incomeBasis'=>'Original invoice billing month and cycle. Receipt dates are retained unchanged.','expenseBasis'=>'Saved expenses by actual expense date; cancelled costs excluded.']);
    }
    private function input(array $body):array {
        $date=dayKey((string)($body['date']??''));$today=(new \DateTimeImmutable('now',new \DateTimeZone('Asia/Kolkata')))->format('Y-m-d');
        if($date>$today||$date<'2000-01-01')throw new HttpError(400,'Use an actual expense date on or before today');
        $amount=$body['amount']??null;
        if(!is_scalar($amount)||!preg_match('/^\d{1,7}(?:\.\d{1,2})?$/D',(string)$amount)||Wallet::paise($amount)<=0)throw new HttpError(400,'Enter a positive expense amount with at most two decimal places');
        $category=(string)($body['category']??'');if(!isset(self::CATEGORIES[$category]))throw new HttpError(400,'Choose an expense category');
        $title=trim((string)($body['title']??''));$note=trim((string)($body['note']??''));
        if($title===''||strlen($title)>300||strlen($note)>1500)throw new HttpError(400,'Enter an expense description (maximum 300 bytes) and a shorter note');
        $method=$body['paymentMethod']??'Cash';if(!in_array($method,['Cash','UPI','Bank'],true))throw new HttpError(400,'Choose Cash, UPI or Bank');
        return ['date'=>$date,'amountPaise'=>Wallet::paise($amount),'category'=>$category,'title'=>$title,'note'=>$note,'paymentMethod'=>$method];
    }
    private function requestKey(array $body):string {
        $key=$body['requestId']??'';if(!is_string($key)||!preg_match('/^[a-z0-9-]{16,100}$/iD',$key))throw new HttpError(400,'A unique request ID is required');return $key;
    }
    public function save(array $body,string $actor,?string $id=null):array {
        $input=$this->input($body);$key=$this->requestKey($body);$fingerprint=hash('sha256',serialize($input));
        return $this->store->transaction(function()use($body,$actor,$id,$input,$key,$fingerprint){
            $this->store->prepareExpenseCollection();
            if($id===null){
                $existing=$this->store->first('businessexpenses',fn($row)=>($row['requestId']??null)===$key);
                if($existing){if(($existing['requestFingerprint']??'')!==$fingerprint)throw new HttpError(409,'This request was already used for a different expense');return success($existing);}
                $row=[...$input,'status'=>'active','revision'=>1,'requestId'=>$key,'requestFingerprint'=>$fingerprint,'createdBy'=>$actor,'history'=>[['action'=>'created','actor'=>$actor,'at'=>gmdate(DATE_ATOM)]]];
                return success($this->store->put('businessexpenses',$row,true),'Expense recorded',201);
            }
            $row=$this->store->get('businessexpenses',$id)??throw new HttpError(404,'Expense not found');
            $reason=trim((string)($body['reason']??''));if(strlen($reason)<5||strlen($reason)>500)throw new HttpError(400,'Explain this correction in 5–500 characters');
            $mutation=hash('sha256',serialize([$input,$reason]));
            if(isset($row['mutationRequests'][$key])){if($row['mutationRequests'][$key]!==$mutation)throw new HttpError(409,'Correction request already used');return success($row);}
            if(($row['status']??'')!=='active')throw new HttpError(409,'A cancelled expense cannot be edited');
            if(!is_int($body['revision']??null)||$body['revision']!==$row['revision'])throw new HttpError(409,'This expense changed. Refresh before editing');
            $before=only($row,['date','amountPaise','category','title','note','paymentMethod']);
            $row=array_replace($row,$input);$row['revision']++;$row['updatedBy']=$actor;$row['mutationRequests'][$key]=$mutation;
            $row['history'][]=['action'=>'corrected','actor'=>$actor,'at'=>gmdate(DATE_ATOM),'reason'=>$reason,'before'=>$before];
            return success($this->store->put('businessexpenses',$row),'Expense corrected');
        });
    }
    public function cancel(string $id,array $body,string $actor):array {
        $this->requestKey($body);$reason=trim((string)($body['reason']??''));if(strlen($reason)<5||strlen($reason)>500)throw new HttpError(400,'Enter a cancellation reason in 5–500 characters');
        return $this->store->transaction(function()use($id,$body,$reason,$actor){
            $row=$this->store->get('businessexpenses',$id)??throw new HttpError(404,'Expense not found');
            if(($row['status']??'')==='cancelled')return success($row);
            if(!is_int($body['revision']??null)||$body['revision']!==$row['revision'])throw new HttpError(409,'This expense changed. Refresh before cancelling');
            $row['status']='cancelled';$row['revision']++;$row['cancelledBy']=$actor;$row['cancelledAt']=gmdate(DATE_ATOM);$row['cancellationReason']=$reason;
            $row['history'][]=['action'=>'cancelled','actor'=>$actor,'at'=>$row['cancelledAt'],'reason'=>$reason];
            return success($this->store->put('businessexpenses',$row),'Expense cancelled; history retained');
        });
    }
}
