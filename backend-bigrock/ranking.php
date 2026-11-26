<?php
declare(strict_types=1);
namespace OMT;

/** Read-only ranking using the exact successful-payment, bill-period basis used by Dashboard. */
final class CustomerRanking {
    public function __construct(private readonly Store $store){}
    public function forCustomer(string $customer,array $query=[]):array {
        $year=$this->integer($query['year']??null,2000,2200);$month=$this->integer($query['month']??null,1,12);$cycle=$this->integer($query['cycle']??null,1,2);
        if($month!==null&&$year===null)throw new HttpError(400,'Ranking year is required with month.');
        $bills=[];foreach($this->store->all('bills')as $bill)$bills[$bill['_id']]=$bill;
        $scores=[];
        foreach($this->store->all('payments')as $payment){
            if(($payment['status']??null)!=='Success')continue;
            $bill=$bills[$payment['bill']??'']??null;
            if(!$bill||!is_numeric($bill['year']??null)||!in_array((int)($bill['month']??0),range(1,12),true)||!in_array((int)($bill['cycle']??0),[1,2],true))continue;
            if(($year!==null&&(int)$bill['year']!==$year)||($month!==null&&(int)$bill['month']!==$month)||($cycle!==null&&(int)$bill['cycle']!==$cycle))continue;
            $id=(string)($payment['customer']??'');if($id==='')continue;
            $scores[$id]=($scores[$id]??0)+(float)($payment['amount']??0);
        }
        arsort($scores,SORT_NUMERIC);$ids=array_keys($scores);$offset=array_search($customer,$ids,true);$rank=$offset===false?null:$offset+1;
        $fifth=count($scores)>=5?(float)array_values($scores)[4]:null;$score=(float)($scores[$customer]??0);
        $period=$year===null?'All time · Both cycles':(($month?date('F',mktime(0,0,0,$month,1)) . ' ':'').$year.($cycle?' · Cycle '.$cycle:' · Both cycles'));
        return [200,['success'=>true,'data'=>[
            'rank'=>$rank,'totalEligible'=>count($scores),'period'=>$period,'score'=>$score,'scoreLabel'=>'Total successful payments linked to valid bills',
            'topFive'=>$rank!==null&&$rank<=5,'reward'=>['supported'=>false,'eligible'=>false],'previousRank'=>null,'movement'=>null,
            'progress'=>['targetRank'=>5,'thresholdScore'=>$fifth,'amountToTopFive'=>$fifth===null||$rank===null||$rank<=5?0:max(0,$fifth-$score)]
        ]]];
    }
    private function integer(mixed $value,int $min,int $max):?int {
        if($value===null||$value===''||$value==='all')return null;
        if(!is_numeric($value)||(float)$value!==(float)(int)$value||(int)$value<$min||(int)$value>$max)throw new HttpError(400,'Invalid ranking period.');
        return (int)$value;
    }
}
