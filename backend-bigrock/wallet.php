<?php
declare(strict_types=1);
namespace OMT;

/** All mutations run under Store's shared business lock and database transaction. */
final class Wallet {
    public function __construct(private readonly Store $store){}
    private function identity(string $key):string{return substr(hash('sha256','wallet-v1:'.$key),0,24);}
    public function account(string $customer):?array{return $this->store->get('walletaccounts',$this->identity($customer));}
    public static function paise(mixed $amount):int {
        if(!is_numeric($amount)||!is_finite((float)$amount)||abs((float)$amount)>100000000)throw new HttpError(400,'Invalid wallet amount');
        return (int)round((float)$amount*100,0,PHP_ROUND_HALF_UP);
    }
    public function rates(array $person):array {
        $price=sorted($this->store->all('prices'),['createdAt'=>-1])[0]??[];$custom=($person['pricing']['pricingType']??'default')==='custom';$rates=[];
        foreach(['breakfast','lunch','dinner']as $meal)$rates[$meal]=self::paise($custom?($person['pricing'][$meal.'Price']??0):($price[$meal]??0));
        $rates['extra']=self::paise($person['pricing']['extraCharge']??0);$rates['extraReason']=$person['pricing']['extraReason']??'Extra Charge';
        foreach(['breakfast','lunch','dinner','extra']as $key)if($rates[$key]<0)throw new HttpError(409,'Negative meal pricing needs review');
        return $rates;
    }
    public function charge(array $entry,array $rates):int {
        $amount=0;$active=false;
        foreach(['breakfast','lunch','dinner']as $meal){$qty=numeric($entry[$meal.'Qty']??0);if($qty<0)throw new HttpError(400,'Meal quantity cannot be negative');$active=$active||$qty>0;$amount+=(int)round($qty*$rates[$meal]);}
        foreach($entry['extraItems']??[]as $item){$value=self::paise($item['amount']??0);if($value<0)throw new HttpError(400,'Extra amount cannot be negative');$amount+=$value;$active=$active||$value>0;}
        return $amount+($active?$rates['extra']:0);
    }
    /** Read-only proposal. Historic discrepancies block activation rather than inventing money. */
    public function preview(string $customer):array {
        $person=$this->store->get('tiffins',$customer);if(!$person)throw new HttpError(404,'Customer not found');
        $rates=$this->rates($person);$issues=[];$basis=[];$days=[];$covered=[];$periods=[];$outstanding=0;$unbilled=0;
        $bills=$this->store->find('bills',fn($b)=>$b['customer']===$customer);
        $entries=$this->store->find('dailyentries',fn($e)=>$e['customer']===$customer);
        foreach($bills as $bill){
            $period=($bill['year']??'').'-'.($bill['month']??'').'-'.($bill['cycle']??'');
            if(isset($periods[$period]))$issues[]='Duplicate invoice period '.$period;$periods[$period]=true;
            if(self::paise($bill['pendingAmount']??0)!==max(0,self::paise($bill['totalAmount']??0)-self::paise($bill['paidAmount']??0)))$issues[]='Invoice payment totals need review '.$bill['_id'];
            if(($bill['carriedForward']??false)===true){$target=$this->store->get('bills',(string)($bill['carriedForwardTo']??''));if(!$target||$target['customer']!==$customer||($target['previousPendingBill']??'')!==$bill['_id'])$issues[]='Missing carry-forward link '.$bill['_id'];}
            else $outstanding+=self::paise($bill['pendingAmount']??0);
            $sum=0;
            foreach($bill['dailyDetails']??[]as $detail){$day=substr((string)($detail['date']??''),0,10);if(isset($covered[$day]))$issues[]='Duplicate billed day '.$day;$covered[$day]=$detail;$sum+=self::paise($detail['dailyTotal']??0);}
            if($sum!==self::paise($bill['totalAmount']??0)-self::paise($bill['previousPendingAmount']??0))$issues[]='Invoice details do not match total '.$bill['_id'];
        }
        foreach($entries as $entry){
            $day=substr($entry['date'],0,10);if(isset($days[$day]))$issues[]='Duplicate daily entry '.$day;$days[$day]=true;$snapshot=$rates;
            if(isset($covered[$day])){
                $detail=$covered[$day];$mealTotal=0;
                foreach(['breakfast','lunch','dinner']as $meal){$qty=numeric($entry[$meal.'Qty']??0);if($qty!==numeric($detail[$meal.'Qty']??0))$issues[]='Billed quantity differs on '.$day;$amount=self::paise($detail[$meal.'Amount']??0);$mealTotal+=$amount;if($qty>0)$snapshot[$meal]=(int)round($amount/$qty);}
                $extras=0;$sourceItems=array_values($entry['extraItems']??[]);$billedItems=array_values($detail['extraItems']??[]);
                foreach($sourceItems as $index=>$item){$extras+=self::paise($item['amount']??0);$billed=$billedItems[$index]??null;if(!$billed||($billed['description']??'')!==($item['description']??'')||self::paise($billed['amount']??0)!==self::paise($item['amount']??0))$issues[]='Billed extra items differ on '.$day;}
                if(count($billedItems)>count($sourceItems)+1)$issues[]='Ambiguous billed extra items on '.$day;
                $snapshot['extra']=self::paise($detail['dailyTotal']??0)-$mealTotal-$extras;
                if($snapshot['extra']<0)$issues[]='Billed extras differ on '.$day;
                $storedExtra=array_sum(array_map(fn($i)=>self::paise($i['amount']??0),$billedItems));
                if($storedExtra!==self::paise($detail['dailyTotal']??0)-$mealTotal)$issues[]='Billed extra total differs on '.$day;
                if(count($billedItems)>count($sourceItems)){$snapshot['extraReason']=$billedItems[count($sourceItems)]['description']??'Extra Charge';if(!in_array($snapshot['extraReason'],[$rates['extraReason'],'Extra Charge'],true))$issues[]='Historic extra charge reason needs review on '.$day;}
                $charge=$this->charge($entry,array_replace($snapshot,['extra'=>max(0,$snapshot['extra'])]));
                if($charge!==self::paise($detail['dailyTotal']??0))$issues[]='Billed charge differs on '.$day;
            }else{$charge=$this->charge($entry,$snapshot);$unbilled+=$charge;}
            $basis[$entry['_id']]=['rates'=>$snapshot,'chargePaise'=>$charge,'date'=>$day];
        }
        foreach($covered as $day=>$detail)if(!isset($days[$day]))$issues[]='Billed day has no daily entry '.$day;
        $advance=self::paise($person['advanceBalance']??0);if($advance<0||$outstanding<0)$issues[]='Negative legacy advance or outstanding';
        $proposal=['advancePaise'=>$advance,'outstandingPaise'=>$outstanding,'unbilledPaise'=>$unbilled,'balancePaise'=>$advance-$outstanding-$unbilled,'issues'=>array_values(array_unique($issues)),'basis'=>$basis];
        $proposal['fingerprint']=hash('sha256',json_encode([$person,$bills,$entries,$rates],JSON_THROW_ON_ERROR));return $proposal;
    }
    public function activate(string $customer,string $fingerprint,string $actor):array {
        return $this->store->transaction(function()use($customer,$fingerprint,$actor){
            if($this->account($customer))return $this->view($customer);
            $p=$this->preview($customer);if(!hash_equals($p['fingerprint'],$fingerprint))throw new HttpError(409,'Billing changed. Refresh the reconciliation first.');
            if($p['issues'])throw new HttpError(409,'Resolve reconciliation issues before activating wallet.',['issues'=>$p['issues']]);
            $this->store->prepareWalletCollections();
            $account=$this->store->put('walletaccounts',['_id'=>$this->identity($customer),'customer'=>$customer,'balancePaise'=>0,'sequence'=>0,'opening'=>$p,'activatedBy'=>$actor],true);
            foreach($p['basis']as $id=>$basis){$entry=$this->store->get('dailyentries',$id);$entry['walletBasis']=$basis;$this->store->put('dailyentries',$entry);}
            $this->post($customer,'opening','opening',$p['balancePaise'],'Opening: advance less outstanding and unbilled meals',$actor);
            return $this->view($customer);
        });
    }
    private function post(string $customer,string $event,string $type,int $delta,string $reason,string $actor='',array $source=[]):void {
        $id=$this->identity($customer.':'.$event);$existing=$this->store->get('wallettransactions',$id);
        if($existing){if($existing['amountPaise']!==$delta||$existing['reason']!==$reason)throw new HttpError(409,'Wallet event already recorded with different data');return;}
        $account=$this->account($customer);if(!$account)throw new HttpError(409,'Wallet is not active');
        $account['balancePaise']+=$delta;$account['sequence']++;
        $this->store->put('wallettransactions',['_id'=>$id,'customer'=>$customer,'event'=>$event,'type'=>$type,'amountPaise'=>$delta,'balancePaise'=>$account['balancePaise'],'sequence'=>$account['sequence'],'reason'=>$reason,'actor'=>$actor,'source'=>$source],true);
        $this->store->put('walletaccounts',$account);
    }
    private function entryState(array $entry):string {
        return json_encode([numeric($entry['breakfastQty']??0),numeric($entry['lunchQty']??0),numeric($entry['dinnerQty']??0),array_map(fn($i)=>[(string)($i['description']??''),self::paise($i['amount']??0)],$entry['extraItems']??[]),(string)($entry['remark']??'')],JSON_THROW_ON_ERROR);
    }
    public function entry(array $entry,array $person,?array $previous=null):array {
        if(!$this->account($person['_id']))return $entry;
        $old=$entry['walletBasis']??null;$rates=$old['rates']??$this->rates($person);$amount=$this->charge($entry,$rates);$priorAmount=$old['chargePaise']??0;
        $changed=$this->entryState($entry)!==$this->entryState($previous??[]);$version=($old['version']??0)+(($changed||$amount!==$priorAmount)?1:0);
        if($changed||$amount!==$priorAmount)$this->post($person['_id'],'entry:'.$entry['_id'].':'.$version,'meal',$priorAmount-$amount,'Meal charge adjustment for '.substr($entry['date'],0,10),'',['entry'=>$entry['_id'],'date'=>$entry['date'],'chargePaise'=>$amount]);
        $entry['walletBasis']=['rates'=>$rates,'chargePaise'=>$amount,'version'=>$version,'modified'=>($old['modified']??false)||($changed&&$previous!==null),'date'=>substr($entry['date'],0,10)];return $entry;
    }
    public function payment(array $payment):void {
        if($this->account($payment['customer'])&&($payment['status']??'')==='Success')$this->post($payment['customer'],'payment:'.$payment['_id'],'payment',self::paise($payment['amount']),'Payment received','',['payment'=>$payment['_id']]);
    }
    public function adjust(string $customer,array $body,string $actor):array {
        $reason=trim((string)($body['reason']??''));$key=(string)($body['requestId']??'');$amount=self::paise($body['amount']??null);
        if(strlen($reason)<5||strlen($reason)>500||!preg_match('/^[A-Za-z0-9-]{16,80}$/D',$key)||$amount===0)throw new HttpError(400,'Provide a nonzero amount, reason (5–500 characters), and unique request ID');
        return $this->store->transaction(function()use($customer,$key,$amount,$reason,$actor){$this->post($customer,'adjust:'.$key,'adjustment',$amount,$reason,$actor);return $this->view($customer);});
    }
    public function view(string $customer,int $before=PHP_INT_MAX):array {
        if(!$this->store->get('tiffins',$customer))throw new HttpError(404,'Customer not found');
        $account=$this->account($customer);if(!$account)return [200,['success'=>true,'data'=>['active'=>false]]];
        $history=sorted($this->store->find('wallettransactions',fn($d)=>$d['customer']===$customer&&$d['sequence']<$before),['sequence'=>-1]);$page=array_slice($history,0,30);
        foreach($page as &$row)unset($row['actor']);unset($row);
        return [200,['success'=>true,'data'=>['active'=>true,'balancePaise'=>$account['balancePaise'],'sequence'=>$account['sequence'],'history'=>$page,'nextBefore'=>count($history)>30?end($page)['sequence']:null]]];
    }
    public function statement(string $customer,array $query=[]):array {
        if(!$this->store->get('tiffins',$customer))throw new HttpError(404,'Customer not found');
        $account=$this->account($customer);if(!$account)return [200,['success'=>true,'data'=>['active'=>false]]];
        $mode=(string)($query['mode']??'unbilled');if(!in_array($mode,['unbilled','cycle','all','audit'],true))throw new HttpError(400,'Invalid wallet history filter');
        $period=$mode==='cycle'?(new ReadModels($this->store))->period($query):null;
        $entries=[];foreach($this->store->find('dailyentries',fn($e)=>$e['customer']===$customer)as $e)$entries[$e['_id']]=$e;
        $events=sorted($this->store->find('wallettransactions',fn($t)=>$t['customer']===$customer),['sequence'=>1]);$rows=[];
        foreach($events as $event){
            unset($event['actor']);$entryId=$event['source']['entry']??null;
            $event['serviceDate']=$event['type']==='meal'?substr($event['source']['date']??$event['createdAt'],0,10):(new \DateTimeImmutable($event['createdAt']))->setTimezone(new \DateTimeZone('Asia/Kolkata'))->format('Y-m-d');
            if($mode==='audit'||$event['type']!=='meal'||!$entryId){$rows['event:'.$event['_id']]=$event;continue;}
            $key='meal:'.$event['serviceDate'];$count=($rows[$key]['updateCount']??0)+1;$entry=$entries[$entryId]??null;
            $event['amountPaise']=-($entry['walletBasis']['chargePaise']??$event['source']['chargePaise']??0);
            $event['modified']=$count>1||($entry['walletBasis']['modified']??false);$event['updateCount']=$count;
            $event['reason']=$event['modified']?'Entry modified':'Meal entry';
            $event['quantities']=$entry?['breakfast'=>$entry['breakfastQty']??0,'lunch'=>$entry['lunchQty']??0,'dinner'=>$entry['dinnerQty']??0]:null;
            $rows[$key]=$event;
        }
        // Opening reconciliation already accounts for historic charges. Display its frozen
        // entries without posting another financial transaction or inventing a running balance.
        if($mode!=='audit')foreach($account['opening']['basis']??[]as $entryId=>$basis){
            $day=$basis['date'];$key='meal:'.$day;if(isset($rows[$key]))continue;$entry=$entries[$entryId]??null;
            $rows[$key]=['_id'=>'opening-entry:'.$entryId,'type'=>'meal','serviceDate'=>$day,'sequence'=>1,'amountPaise'=>-($basis['chargePaise']??0),'balancePaise'=>null,'createdAt'=>$account['createdAt'],'modified'=>$entry['walletBasis']['modified']??false,'reason'=>'Included in opening balance','openingEntry'=>true,'quantities'=>$entry?['breakfast'=>$entry['breakfastQty']??0,'lunch'=>$entry['lunchQty']??0,'dinner'=>$entry['dinnerQty']??0]:null];
        }
        $closed=$this->store->find('bills',fn($b)=>$b['customer']===$customer);

        foreach($rows as $key=>$row){
            $day=$row['serviceDate'];$archived=false;
            foreach($closed as $bill){
                $snapshot=$bill['walletStatement']??null;
                if($snapshot&&$row['type']==='meal'&&$row['sequence']<=$snapshot['sequence']&&$day>=$snapshot['startDay']&&$day<$snapshot['endDay']){$archived=true;break;}
                // Legacy bills predate checkpoints. Only opening snapshot rows are known covered;
                // later edits stay visible until the invoice is explicitly regenerated.
                if(!$snapshot&&($row['openingEntry']??false))foreach($bill['dailyDetails']??[]as $detail)if(substr($detail['date'],0,10)===$day){$archived=true;break 2;}
            }
            $rows[$key]['archived']=$archived;
            if(($mode==='unbilled'&&$archived)||($period&&($day<substr($period['startDate'],0,10)||$day>=substr($period['endDate'],0,10))))unset($rows[$key]);
        }
        // Group first, paginate second: older pages must never resurrect superseded meal versions.
        $cursor=(string)($query['before']??PHP_INT_MAX);$parts=explode(':',$cursor,2);$before=(int)$parts[0];$beforeId=isset($parts[1])?rawurldecode($parts[1]):null;
        $history=array_values(array_filter($rows,fn($row)=>$row['sequence']<$before||($beforeId!==null&&$row['sequence']===$before&&strcmp($row['_id'],$beforeId)<0)));
        usort($history,fn($a,$b)=>($b['sequence']<=>$a['sequence'])?:strcmp($b['_id'],$a['_id']));$page=array_slice($history,0,30);
        return [200,['success'=>true,'data'=>['active'=>true,'balancePaise'=>$account['balancePaise'],'sequence'=>$account['sequence'],'mode'=>$mode,'history'=>$page,'nextBefore'=>count($history)>30?end($page)['sequence'].':'.rawurlencode(end($page)['_id']):null]]];
    }
    public function customers(array $query=[]):array {
        $search=strtolower(trim((string)($query['search']??'')));$filter=$query['filter']??'all';if(!in_array($filter,['all','credit','due','zero','inactive'],true))throw new HttpError(400,'Invalid balance filter');
        $accounts=[];foreach($this->store->all('walletaccounts')as $a)$accounts[$a['customer']]=$a;
        $rows=[];$credit=0;$due=0;
        foreach($this->store->all('tiffins')as $c){$a=$accounts[$c['_id']]??null;$balance=$a['balancePaise']??0;$credit+=max(0,$balance);$due+=max(0,-$balance);
            if($search!==''&&!str_contains(strtolower(($c['customerName']??'').' '.($c['barcode']??'').' '.($c['phone']??'')),$search))continue;
            if(($filter==='credit'&&(!$a||$balance<=0))||($filter==='due'&&(!$a||$balance>=0))||($filter==='zero'&&(!$a||$balance!==0))||($filter==='inactive'&&$a))continue;
            $rows[]=['customer'=>$c['_id'],'name'=>$c['customerName']??'Customer','barcode'=>$c['barcode']??'','active'=>$a!==null,'balancePaise'=>$balance,'advancePaise'=>self::paise($c['advanceBalance']??0)];
        }
        usort($rows,fn($a,$b)=>strnatcasecmp($a['name'],$b['name']));return [200,['success'=>true,'data'=>$rows,'summary'=>['creditPaise'=>$credit,'duePaise'=>$due,'customers'=>count($this->store->all('tiffins'))]]];
    }
}
