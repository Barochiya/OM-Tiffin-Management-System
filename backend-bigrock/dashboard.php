<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
require_once __DIR__.'/wallet.php';
final class Dashboard {
    private const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    public function __construct(private readonly Store $store){}
    private static function boundary(int $year,int $month=1):\DateTimeImmutable {
        return (new \DateTimeImmutable(sprintf('%04d-01-01 00:00:00',$year),new \DateTimeZone('Asia/Kolkata')))->modify(($month-1).' months');
    }
    private static function change(float $current,float $previous,string $label):array {
        return ['percent'=>$previous>0?floor(($current-$previous)/$previous*1000+0.5)/10:null,'label'=>$label,'note'=>$previous==0?($current>0?'No previous baseline':'No activity in either period'):'','previous'=>$previous];
    }
    public static function periods(array $query,?\DateTimeImmutable $now=null):array {
        $now=($now??new \DateTimeImmutable())->setTimezone(new \DateTimeZone('Asia/Kolkata'));
        $currentYear=(int)$now->format('Y');$currentMonth=(int)$now->format('n');
        $parse=fn($v)=>$v===null||$v===''||$v==='all'?null:(is_numeric($v)&&(float)$v==(int)$v?(int)$v:-1);
        $year=$parse($query['year']??null);$month=$parse($query['month']??null);$cycle=$parse($query['cycle']??null);
        if($cycle!==null&&!in_array($cycle,[1,2],true))throw new HttpError(400,'Choose a valid billing cycle.');
        if(($year!==null&&($year<2000||$year>$currentYear+1))||($month!==null&&($year===null||$month<1||$month>12)))throw new HttpError(400,'Choose a valid year and month.');
        $start=$year!==null?self::boundary($year,$month??1):null;
        $end=$year!==null?self::boundary($year+($month===null?1:0),$month!==null?$month+1:1):null;
        $previousStart=$year!==null?($month!==null?self::boundary($year,$month-1):self::boundary($year-1)):null;
        $todayStart=$now->setTime(0,0);$tomorrow=$todayStart->modify('+1 day');$yesterday=$todayStart->modify('-1 day');
        return compact('currentYear','currentMonth','year','month','cycle','start','end','previousStart','todayStart','tomorrow','yesterday')+['chartYear'=>$year??$currentYear,'label'=>($year!==null?($month!==null?self::MONTHS[$month-1].' '.$year:(string)$year):'All time').($cycle!==null?' · Cycle '.$cycle:' · Both cycles'),'comparisonLabel'=>$month!==null?'vs previous month':'vs previous year'];
    }
    private static function inPeriod(?string $value,?\DateTimeImmutable $start,?\DateTimeImmutable $end):bool {
        if($start===null)return true;if(!$value)return false;
        try{$date=new \DateTimeImmutable($value);return $date>=$start&&$date<$end;}catch(\Throwable){return false;}
    }
    public function get(array $query,?\DateTimeImmutable $now=null):array {
        $p=self::periods($query,$now);$r=new ReadModels($this->store);
        $customers=$this->store->all('tiffins');$payments=$this->store->all('payments');$entries=$this->store->all('dailyentries');
        $successful=array_values(array_filter($payments,fn($d)=>($d['status']??null)==='Success'));
        $walkInPayments=[];
        foreach($this->store->all('walkincustomers') as $customer){
            foreach(WalkIns::payments($customer) as $payment){
                if(empty($payment['approvedBy'])||empty($payment['paymentDate']))continue;
                $date=(new \DateTimeImmutable($payment['paymentDate']))->setTimezone(new \DateTimeZone('Asia/Kolkata'));
                $walkInPayments[]=['payment'=>$payment,'year'=>(int)$date->format('Y'),'month'=>(int)$date->format('n'),'cycle'=>(int)$date->format('j')<=15?1:2];
            }
        }
        $topUps=[];
        foreach($this->store->all('wallettopups') as $row){
            if(($row['status']??null)!=='approved'||empty($row['reviewedAt']))continue;
            $date=(new \DateTimeImmutable($row['reviewedAt']))->setTimezone(new \DateTimeZone('Asia/Kolkata'));
            $topUps[]=[
                'payment'=>['amount'=>$row['amountPaise']/100,'paymentDate'=>$row['reviewedAt']],
                'year'=>(int)$date->format('Y'),'month'=>(int)$date->format('n'),
                'cycle'=>(int)$date->format('j')<=15?1:2,
            ];
        }
        $collections=array_merge($successful,array_column($walkInPayments,'payment'),array_column($topUps,'payment'));

        $sum=function($start,$end)use($collections){$total=0.0;foreach($collections as $d)if(self::inPeriod($d['paymentDate']??$d['createdAt']??null,$start,$end))$total+=(float)($d['amount']??0);return $total;};
        $mealSum=function($start,$end)use($entries){$total=0.0;foreach($entries as $d)if(self::inPeriod($d['date']??null,$start,$end))$total+=(float)($d['breakfastQty']??0)+(float)($d['lunchQty']??0)+(float)($d['dinnerQty']??0);return $total;};
        $bills=[];foreach($this->store->all('bills') as $bill)$bills[$bill['_id']]=$bill;
        $linked=[];$unassigned=0.0;$unassignedCount=0;
        foreach($successful as $payment){$bill=$bills[$payment['bill']??'']??null;
            if(!$bill||!is_numeric($bill['year']??null)||!in_array((int)($bill['month']??0),range(1,12),true)||!in_array((string)($bill['cycle']??''),['1','2'],true)){$unassigned+=(float)($payment['amount']??0);$unassignedCount++;continue;}
            $linked[]=['payment'=>$payment,'year'=>(int)$bill['year'],'month'=>(int)$bill['month'],'cycle'=>(int)$bill['cycle']];
        }
        // Revenue is earned once per invoice/order. Collections and wallet funding are separate.
        $linked=[];$undatedInvoices=0;
        foreach($bills as $bill){
            if(($bill['status']??'')==='Cancelled')continue;
            $generated=$bill['generatedAt']??$bill['createdAt']??null;
            if(!$generated){$undatedInvoices++;continue;}
            try{$date=(new \DateTimeImmutable($generated))->setTimezone(new \DateTimeZone('Asia/Kolkata'));}
            catch(\Throwable){$undatedInvoices++;continue;}
            $gross=max(0,Wallet::paise($bill['totalAmount']??0)-Wallet::paise($bill['previousPendingAmount']??0));
            $linked[]=['payment'=>['amount'=>$gross/100,'customer'=>$bill['customer']??null], 'year'=>(int)$date->format('Y'),'month'=>(int)$date->format('n'),'cycle'=>(int)$date->format('j')<=15?1:2];
        }
        foreach($this->store->all('walkincustomers')as $customer)foreach(WalkIns::orders($customer)as $order){
            $date=(new \DateTimeImmutable($order['generatedAt']))->setTimezone(new \DateTimeZone('Asia/Kolkata'));
            $linked[]=['payment'=>['amount'=>$order['totalPaise']/100,'customer'=>$customer['_id']],'year'=>(int)$date->format('Y'),'month'=>(int)$date->format('n'),'cycle'=>(int)$date->format('j')<=15?1:2];
        }
        $billSum=function(?int $year,?int $month,?int $cycle)use($linked){$total=0.0;foreach($linked as $item)if(($year===null||$item['year']===$year)&&($month===null||$item['month']===$month)&&($cycle===null||$item['cycle']===$cycle))$total+=(float)($item['payment']['amount']??0);return $total;};
        $revenue=$billSum($p['year'],$p['month'],$p['cycle']);
        $previous=$p['previousStart']?$billSum((int)$p['previousStart']->format('Y'),$p['month']!==null?(int)$p['previousStart']->format('n'):null,$p['cycle']):0.0;
        $inReport=function(?string $date)use($p):bool {
            if(!$date)return false;
            try{$day=(new \DateTimeImmutable($date))->setTimezone(new \DateTimeZone('Asia/Kolkata'));}
            catch(\Throwable){return false;}
            return self::inPeriod($date,$p['start'],$p['end'])&&($p['cycle']===null||((int)$day->format('j')<=15?1:2)===$p['cycle']);
        };
        $collectionTotal=0;$fundingTotal=0;$excessTotal=0;$walletApplied=0;
        foreach($successful as $payment)if($inReport($payment['paymentDate']??$payment['createdAt']??null)){
            $collectionTotal+=Wallet::paise($payment['amount']??0);
            $excessTotal+=(int)($payment['excessWalletCreditPaise']??0);
        }
        foreach($walkInPayments as $item)if($inReport($item['payment']['paymentDate']??null))$collectionTotal+=Wallet::paise($item['payment']['amount']);
        foreach($this->store->all('wallettopups') as $row)if(($row['status']??'')==='approved'&&$inReport($row['reviewedAt']??$row['updatedAt']??null))$fundingTotal+=(int)$row['amountPaise'];
        foreach($bills as $bill)if($inReport($bill['generatedAt']??$bill['createdAt']??null))$walletApplied+=(int)($bill['walletAppliedPaise']??0);
        $walletNet=array_sum(array_column($this->store->all('walletaccounts'),'balancePaise'));
        $financialSummary=['grossInvoiceRevenue'=>$revenue,'directCollections'=>$collectionTotal/100,'approvedWalletFunding'=>$fundingTotal/100,'walletApplied'=>$walletApplied/100,'excessWalletCredits'=>$excessTotal/100,'currentWalletNet'=>$walletNet/100];
        $today=$sum($p['todayStart'],$p['tomorrow']);$yesterday=$sum($p['yesterday'],$p['todayStart']);$meals=$mealSum($p['todayStart'],$p['tomorrow']);$previousMeals=$mealSum($p['yesterday'],$p['todayStart']);
        $wallet=new Wallet($this->store);$people=[];foreach($customers as $person)$people[$person['_id']]=$person;$rates=[];$todayMealPaise=0;
        foreach($entries as $entry){
            if(!self::inPeriod($entry['date']??null,$p['todayStart'],$p['tomorrow']))continue;
            if(isset($entry['walletBasis']['chargePaise'])){$todayMealPaise+=(int)$entry['walletBasis']['chargePaise'];continue;}
            $customer=$entry['customer']??'';$rates[$customer]??=$wallet->rates($people[$customer]??[]);
            $todayMealPaise+=$wallet->charge($entry,$rates[$customer]);
        }
        $todayMealAmount=$todayMealPaise/100;
        $active=count(array_filter($customers,fn($d)=>($d['status']??null)==='Active'));$count=count($customers);
        $pending=array_map(fn($d)=>$r->populate($r->hydrate('bills',$d),'customer','tiffins'),$this->store->find('bills',fn($d)=>(float)($d['pendingAmount']??0)>0&&($d['carriedForward']??false)!==true));
        $recent=array_map(fn($d)=>$r->populate($r->hydrate('payments',$d),'customer','tiffins'),array_slice(sorted($payments,['createdAt'=>-1]),0,5));
        $monthly=[];$previousDecember=0.0;$years=[$p['currentYear'],$p['chartYear']];$top=[];
        foreach($linked as $item){
            $d=$item['payment'];$y=$item['year'];$m=$item['month'];$years[]=$y;
            if($p['cycle']!==null&&$item['cycle']!==$p['cycle'])continue;
            if($y===$p['chartYear'])$monthly[$m]=($monthly[$m]??0)+(float)($d['amount']??0);
            if($y===$p['chartYear']-1&&$m===12)$previousDecember+=(float)($d['amount']??0);
            if(($p['year']===null||$y===$p['year'])&&($p['month']===null||$m===$p['month'])){$id=$d['customer']??'';$top[$id]=($top[$id]??0)+(float)($d['amount']??0);}
        }
        $chart=[];
        foreach(self::MONTHS as $index=>$month){$current=(float)($monthly[$index+1]??0);$last=$index?(float)($monthly[$index]??0):$previousDecember;
            $growth=$p['chartYear']>$p['currentYear']||($p['chartYear']===$p['currentYear']&&$index+1>$p['currentMonth'])?['percent'=>null,'label'=>'Future month']:self::change($current,$last,$p['chartYear']===$p['currentYear']&&$index+1===$p['currentMonth']?'bill month so far vs previous bill month':'vs previous bill month');
            $chart[]=['month'=>$month,'revenue'=>$current,'growth'=>$growth];
        }
        arsort($top,SORT_NUMERIC);$topCustomers=[];foreach(array_slice($top,0,5,true)as $id=>$total){$item=['_id'=>$id?:null,'totalPaid'=>$total];$customer=$id?$this->store->get('tiffins',$id):null;if($customer)$item['customer']=$customer;$topCustomers[]=$item;}
        $years=array_values(array_unique($years));rsort($years,SORT_NUMERIC);
        $revenueGrowth=$p['start']&&$p['start']>$p['todayStart']?['percent'=>null,'label'=>'Future period']:($p['start']?self::change($revenue,$previous,($p['end']>$p['tomorrow']?'invoice period so far ':'invoice period ').$p['comparisonLabel'].($p['cycle']!==null?' · same cycle':' · both cycles')):['percent'=>null,'label'=>'All-time gross invoices and walk-in orders']);
        return [200,['success'=>true,'stats'=>['totalCustomers'=>$count,'activeCustomers'=>$active,'totalRevenue'=>$revenue,'totalPending'=>array_sum(array_column($pending,'pendingAmount'))],'period'=>array_intersect_key($p,array_flip(['year','month','cycle','label','chartYear'])),'availableYears'=>$years,'financialSummary'=>$financialSummary,'reportingBasis'=>'invoice_generated_at','undatedInvoices'=>$undatedInvoices,'unassignedPayments'=>['count'=>$unassignedCount,'amount'=>$unassigned],'growth'=>['revenue'=>$revenueGrowth,'active'=>['percent'=>$count?floor($active/$count*1000+0.5)/10:0,'label'=>'of registered customers','share'=>true],'pending'=>['percent'=>null,'label'=>'Current balance; historical balances unavailable'],'customers'=>['percent'=>null,'label'=>'Registered customers (current total)'],'collection'=>self::change($today,$yesterday,'today so far vs yesterday'),'meals'=>self::change($meals,$previousMeals,'today so far vs yesterday')],'todayCollection'=>$today,'todayMeals'=>$meals,'todayMealAmount'=>$todayMealAmount,'revenueChart'=>$chart,'recentPayments'=>$recent,'pendingBills'=>$pending,'topCustomers'=>$topCustomers]];
    }
    public function financialReport(array $query):array {
        $period=self::periods($query);
        if($period['cycle']!==null&&$period['month']===null)throw new HttpError(400,'Select a year and month for a half-month reconciliation report');
        $start=$period['start'];$end=$period['end'];
        if($period['cycle']===1)$end=$start->modify('+15 days');
        if($period['cycle']===2)$start=$start->modify('+15 days');
        $included=fn($date)=>self::inPeriod($date,$start,$end);
        $revenue=[];$collections=[];$outstanding=[];$wallets=[];
        foreach($this->store->all('bills')as $bill){
            $date=$bill['generatedAt']??$bill['createdAt']??null;
            if($date&&$included($date)&&($bill['status']??'')!=='Cancelled')$revenue[]=['invoice'=>$bill['invoiceNo']??$bill['_id'],'customer'=>$bill['customer'],'generatedAt'=>$date,'grossAmount'=>max(0,Wallet::paise($bill['totalAmount'])-Wallet::paise($bill['previousPendingAmount']??0))/100];
            if(($bill['carriedForward']??false)!==true&&($bill['status']??'')!=='Cancelled'&&($bill['pendingAmount']??0)>0)$outstanding[]=['invoice'=>$bill['invoiceNo']??$bill['_id'],'customer'=>$bill['customer'],'outstanding'=>$bill['pendingAmount']];
        }
        foreach($this->store->all('payments')as $payment)if(($payment['status']??'')==='Success'&&$included($payment['paymentDate']??$payment['createdAt']??null))$collections[]=['id'=>$payment['_id'],'customer'=>$payment['customer'],'receivedAt'=>$payment['paymentDate']??$payment['createdAt'],'amount'=>$payment['amount'],'kind'=>'invoice-payment','reference'=>$payment['transactionId']??''];
        foreach($this->store->all('wallettopups')as $payment)if(($payment['status']??'')==='approved'&&$included($payment['reviewedAt']??null))$collections[]=['id'=>$payment['_id'],'customer'=>$payment['customer'],'receivedAt'=>$payment['reviewedAt'],'amount'=>$payment['amountPaise']/100,'kind'=>'wallet-funding','reference'=>$payment['reference']??''];
        foreach($this->store->all('walkincustomers')as $customer)foreach(WalkIns::payments($customer)as $index=>$payment){
            if(empty($payment['approvedBy'])||empty($payment['paymentDate']))continue;
            if($included($payment['paymentDate']))$collections[]=['id'=>$payment['receiptNo']??'','customer'=>$customer['_id'],'receivedAt'=>$payment['paymentDate'],'amount'=>$payment['amount'],'kind'=>'walk-in-payment','reference'=>$payment['reference']??''];
        }
        foreach($this->store->all('walkincustomers')as $customer){
            foreach(WalkIns::orders($customer)as $order)if($included($order['generatedAt']))$revenue[]=['invoice'=>$order['id'],'customer'=>$customer['_id'],'generatedAt'=>$order['generatedAt'],'grossAmount'=>$order['totalPaise']/100];
            $paid=array_sum(array_map(fn($item)=>Wallet::paise($item['amount']),array_slice(WalkIns::payments($customer),(int)($customer['orderPaymentStart']??0))));
            $due=($customer['totalPaise']??$paid)-$paid;
            if($due>0)$outstanding[]=['invoice'=>'Walk-in order','customer'=>$customer['_id'],'outstanding'=>$due/100];
        }
        $events=$this->store->all('wallettransactions');
        foreach($this->store->all('walletaccounts')as $account){
            $rows=sorted(array_values(array_filter($events,fn($e)=>$e['customer']===$account['customer'])),['sequence'=>1]);
            $opening=0;$credits=0;$debits=0;$closing=0;$history=[];
            foreach($rows as $event){
                $date=$event['createdAt']??null;if(!$date)continue;
                $instant=new \DateTimeImmutable($date);
                if($start&&$instant<$start){$opening=(int)$event['balancePaise'];$closing=$opening;continue;}
                if($end&&$instant>=$end)continue;
                $amount=(int)$event['amountPaise'];$credits+=max(0,$amount);$debits+=max(0,-$amount);$closing=(int)$event['balancePaise'];
                $history[]=['id'=>$event['_id'],'date'=>$date,'type'=>$event['type'],'amountPaise'=>$amount,'balancePaise'=>$closing,'reason'=>$event['reason']??'','actor'=>$event['actor']??'','source'=>$event['source']??[]];
            }
            $wallets[]=['customer'=>$account['customer'],'openingPaise'=>$opening,'creditsPaise'=>$credits,'debitsPaise'=>$debits,'closingPaise'=>$closing,'transactions'=>$history,'reconciled'=>$closing===$opening+$credits-$debits];
        }
        $people=[];foreach($this->store->all('tiffins')as $person)$people[$person['_id']]=['name'=>$person['customerName']??'Customer','code'=>$person['barcode']??''];
        foreach($this->store->all('walkincustomers')as $person)$people[$person['_id']]=['name'=>$person['customerName']??'Walk-in customer','code'=>'Walk-in'];
        $expenses=$this->store->find('businessexpenses',fn($row)=>($row['status']??'active')==='active'&&!empty($row['date'])&&$included($row['date'].'T00:00:00+05:30'));
        $incomePaise=array_sum(array_map(fn($row)=>Wallet::paise($row['grossAmount']),$revenue));
        $collectionPaise=array_sum(array_map(fn($row)=>Wallet::paise($row['amount']),$collections));
        $expensePaise=array_sum(array_column($expenses,'amountPaise'));
        $expenseSummary=['incomePaise'=>$incomePaise,'collectionPaise'=>$collectionPaise,'expensePaise'=>$expensePaise,'netEarningsPaise'=>$incomePaise-$expensePaise,'cashAfterExpensesPaise'=>$collectionPaise-$expensePaise];
        return success(['expenses'=>$expenses,'expenseSummary'=>$expenseSummary,'generatedAt'=>gmdate(DATE_ATOM),'customers'=>$people,'period'=>$period['label'],'revenue'=>$revenue,'collections'=>$collections,'wallets'=>$wallets,'outstanding'=>$outstanding,'outstandingBasis'=>'Current unpaid balances; other reports use the selected receipt or generation period']);
    }

}
