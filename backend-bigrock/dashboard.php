<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
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
        $year=$parse($query['year']??null);$month=$parse($query['month']??null);
        if(($year!==null&&($year<2000||$year>$currentYear+1))||($month!==null&&($year===null||$month<1||$month>12)))throw new HttpError(400,'Choose a valid year and month.');
        $start=$year!==null?self::boundary($year,$month??1):null;
        $end=$year!==null?self::boundary($year+($month===null?1:0),$month!==null?$month+1:1):null;
        $previousStart=$year!==null?($month!==null?self::boundary($year,$month-1):self::boundary($year-1)):null;
        $todayStart=$now->setTime(0,0);$tomorrow=$todayStart->modify('+1 day');$yesterday=$todayStart->modify('-1 day');
        return compact('currentYear','currentMonth','year','month','start','end','previousStart','todayStart','tomorrow','yesterday')+['chartYear'=>$year??$currentYear,'label'=>$year!==null?($month!==null?self::MONTHS[$month-1].' '.$year:(string)$year):'All time','comparisonLabel'=>$month!==null?'vs previous month':'vs previous year'];
    }
    private static function inPeriod(?string $value,?\DateTimeImmutable $start,?\DateTimeImmutable $end):bool {
        if($start===null)return true;if(!$value)return false;
        try{$date=new \DateTimeImmutable($value);return $date>=$start&&$date<$end;}catch(\Throwable){return false;}
    }
    public function get(array $query,?\DateTimeImmutable $now=null):array {
        $p=self::periods($query,$now);$r=new ReadModels($this->store);
        $customers=$this->store->all('tiffins');$payments=$this->store->all('payments');$entries=$this->store->all('dailyentries');
        $successful=array_values(array_filter($payments,fn($d)=>($d['status']??null)==='Success'));
        $sum=function($start,$end)use($successful){$total=0.0;foreach($successful as $d)if(self::inPeriod($d['paymentDate']??$d['createdAt']??null,$start,$end))$total+=(float)($d['amount']??0);return $total;};
        $mealSum=function($start,$end)use($entries){$total=0.0;foreach($entries as $d)if(self::inPeriod($d['date']??null,$start,$end))$total+=(float)($d['breakfastQty']??0)+(float)($d['lunchQty']??0)+(float)($d['dinnerQty']??0);return $total;};
        $revenue=$sum($p['start'],$p['end']);$previous=$p['start']?$sum($p['previousStart'],$p['start']):0.0;
        $today=$sum($p['todayStart'],$p['tomorrow']);$yesterday=$sum($p['yesterday'],$p['todayStart']);$meals=$mealSum($p['todayStart'],$p['tomorrow']);$previousMeals=$mealSum($p['yesterday'],$p['todayStart']);
        $active=count(array_filter($customers,fn($d)=>($d['status']??null)==='Active'));$count=count($customers);
        $pending=array_map(fn($d)=>$r->populate($r->hydrate('bills',$d),'customer','tiffins'),$this->store->find('bills',fn($d)=>(float)($d['pendingAmount']??0)>0&&($d['carriedForward']??false)!==true));
        $recent=array_map(fn($d)=>$r->populate($r->hydrate('payments',$d),'customer','tiffins'),array_slice(sorted($payments,['createdAt'=>-1]),0,5));
        $monthly=[];$previousDecember=0.0;$years=[$p['currentYear'],$p['chartYear']];$top=[];
        foreach($successful as $d){
            $value=$d['paymentDate']??$d['createdAt']??null;
            if($value){$date=(new \DateTimeImmutable($value))->setTimezone(new \DateTimeZone('Asia/Kolkata'));$y=(int)$date->format('Y');$m=(int)$date->format('n');$years[]=$y;
                if($y===$p['chartYear'])$monthly[$m]=($monthly[$m]??0)+(float)($d['amount']??0);
                if($y===$p['chartYear']-1&&$m===12)$previousDecember+=(float)($d['amount']??0);
            }
            if(self::inPeriod($value,$p['start'],$p['end'])){$id=$d['customer']??'';$top[$id]=($top[$id]??0)+(float)($d['amount']??0);}
        }
        $chart=[];
        foreach(self::MONTHS as $index=>$month){$current=(float)($monthly[$index+1]??0);$last=$index?(float)($monthly[$index]??0):$previousDecember;
            $growth=$p['chartYear']>$p['currentYear']||($p['chartYear']===$p['currentYear']&&$index+1>$p['currentMonth'])?['percent'=>null,'label'=>'Future month']:self::change($current,$last,$p['chartYear']===$p['currentYear']&&$index+1===$p['currentMonth']?'month so far vs previous month':'vs previous month');
            $chart[]=['month'=>$month,'revenue'=>$current,'growth'=>$growth];
        }
        arsort($top,SORT_NUMERIC);$topCustomers=[];foreach(array_slice($top,0,5,true)as $id=>$total){$item=['_id'=>$id?:null,'totalPaid'=>$total];$customer=$id?$this->store->get('tiffins',$id):null;if($customer)$item['customer']=$customer;$topCustomers[]=$item;}
        $years=array_values(array_unique($years));rsort($years,SORT_NUMERIC);
        $revenueGrowth=$p['start']&&$p['start']>$p['todayStart']?['percent'=>null,'label'=>'Future period']:($p['start']?self::change($revenue,$previous,($p['end']>$p['tomorrow']?'period so far ':'').$p['comparisonLabel']):['percent'=>null,'label'=>'All-time successful collections']);
        return [200,['success'=>true,'stats'=>['totalCustomers'=>$count,'activeCustomers'=>$active,'totalRevenue'=>$revenue,'totalPending'=>array_sum(array_column($pending,'pendingAmount'))],'period'=>array_intersect_key($p,array_flip(['year','month','label','chartYear'])),'availableYears'=>$years,'growth'=>['revenue'=>$revenueGrowth,'active'=>['percent'=>$count?floor($active/$count*1000+0.5)/10:0,'label'=>'of registered customers','share'=>true],'pending'=>['percent'=>null,'label'=>'Current balance; historical balances unavailable'],'customers'=>['percent'=>null,'label'=>'Registered customers (current total)'],'collection'=>self::change($today,$yesterday,'today so far vs yesterday'),'meals'=>self::change($meals,$previousMeals,'today so far vs yesterday')],'todayCollection'=>$today,'todayMeals'=>$meals,'revenueChart'=>$chart,'recentPayments'=>$recent,'pendingBills'=>$pending,'topCustomers'=>$topCustomers]];
    }
}
