<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/billing.php';
require_once __DIR__.'/documents.php';
final class Employees {
    public function __construct(private readonly Store $store,private readonly ?string $clock=null){}
    private function today():string{return $this->clock??(new \DateTimeImmutable('now',new \DateTimeZone('Asia/Kolkata')))->format('Y-m-d');}
    private function person(string $id):array{return $this->store->get('employees',$id)??throw new HttpError(404,'Employee not found');}
    private function audit(string $type,string $id,array $before,array $after,string $actor):void{$this->store->put('employeeaudit',['type'=>$type,'target'=>$id,'before'=>$before,'after'=>$after,'actor'=>$actor],true);}
    private function paise(mixed $v):int{if(!is_numeric($v)||!is_finite((float)$v)||(float)$v<0||(float)$v>10000000||abs((float)$v*100-round((float)$v*100))>.0001)throw new HttpError(400,'Use a non-negative amount with at most two decimals');return (int)round((float)$v*100);}
    private function month(string $v):string{if(!preg_match('/^(20\d{2})-(0[1-9]|1[0-2])$/D',$v))throw new HttpError(400,'Use YYYY-MM');return $v;}
    private function terms(array $e,string $day):array{$current=null;foreach($e['terms']as $t)if($t['from']<=$day)$current=$t;return $current??$e['terms'][0];}
    private function working(array $e,string $d):bool{return $d>=$e['joiningDate']&&$d<=$this->today()&&(!$e['endDate']||$d<=$e['endDate']);}
    public function listing():array{return success(['today'=>$this->today(),'employees'=>sorted($this->store->all('employees'),['name'=>1])]);}
    public function save(array $b,string $actor,?string $id=null):array{
        return $this->store->transaction(function()use($b,$actor,$id){
            $this->store->prepareEmployeeCollections();$old=$id?$this->person($id):null;$revision=$b['revision']??0;if(!is_int($revision)||$revision!==($old['revision']??0))throw new HttpError(409,'Employee changed. Refresh and retry.');
            $name=trim((string)($b['name']??''));$phone=trim((string)($b['phone']??''));if(preg_match_all('/./us',$name)<2||preg_match_all('/./us',$name)>100||!preg_match('/^[0-9+ ()-]{10,20}$/D',$phone))throw new HttpError(400,'Enter a name and valid mobile number');
            $joining=dayKey($b['joiningDate']??'');$end=empty($b['endDate'])?null:dayKey($b['endDate']);if($end&&$end<$joining)throw new HttpError(400,'Last working day cannot precede joining');
            if($old&&$joining!==$old['joiningDate'])throw new HttpError(400,'Joining date cannot change after employee creation');
            if($old&&$end&&$end<$this->today()&&$end!==$old['endDate'])throw new HttpError(400,'Use today or a future last working day');
            $shifts=$b['shifts']??[];if(!is_array($shifts)||count($shifts)!==2||count(array_unique($shifts))!==2||array_diff($shifts,['Morning','Afternoon','Night']))throw new HttpError(400,'Select exactly two different shifts');
            sort($shifts);$deduct=true;
            $term=['from'=>$old?max($joining,(new \DateTimeImmutable($this->today()))->modify('+1 day')->format('Y-m-d')):$joining,'salaryPaise'=>$this->paise($b['salary']??null),'shifts'=>$shifts,'deductAbsence'=>$deduct];
            $terms=$old['terms']??[];$last=$terms?end($terms):null;
            if(!$last||$last['salaryPaise']!==$term['salaryPaise']||$last['shifts']!==$shifts||$last['deductAbsence']!==$deduct){if($last&&$last['from']===$term['from'])array_pop($terms);$terms[]=$term;}
            $e=array_replace($old??[],['name'=>$name,'phone'=>$phone,'joiningDate'=>$joining,'endDate'=>$end,'terms'=>$terms,'revision'=>$revision+1]);
            $e=$this->store->put('employees',$e,$old===null);$this->audit('employee',$e['_id'],$old??[],$e,$actor);return success($e);
        });
    }
    private function attendance(array $e,string $month):array{
        $this->month($month);$start=new \DateTimeImmutable($month.'-01');$end=$start->modify('last day of this month')->format('Y-m-d');$overrides=[];
        foreach($this->store->find('employeeattendance',fn($a)=>$a['employee']===$e['_id']&&str_starts_with($a['date'],$month))as $a)$overrides[$a['date']]=$a;
        $rows=[];for($d=$start->format('Y-m-d');$d<=$end&&$d<=$this->today();$d=(new \DateTimeImmutable($d))->modify('+1 day')->format('Y-m-d')){
            if(!$this->working($e,$d))continue;$t=$this->terms($e,$d);$a=$overrides[$d]??null;$states=array_fill_keys($t['shifts'],'Present');foreach($states as $shift=>$_)if(isset($a['states'][$shift]))$states[$shift]=$a['states'][$shift];
            $rows[]=['date'=>$d,'states'=>$states,'automatic'=>$a===null,'revision'=>$a['revision']??0,'salaryPaise'=>$t['salaryPaise'],'deductAbsence'=>$t['deductAbsence']];
        }return $rows;
    }
    public function mark(string $id,array $b,string $actor):array{
        return $this->store->transaction(function()use($id,$b,$actor){$e=$this->person($id);$day=dayKey($b['date']??'');if(!$this->working($e,$day))throw new HttpError(400,'Attendance is available only from joining through today / last working day');
            if($this->store->first('salarypayments',fn($p)=>$p['employee']===$id&&$p['month']===substr($day,0,7)&&in_array($day,array_column($p['snapshot']['attendance'],'date'),true)))throw new HttpError(409,'This day is included in a salary payment slip. Its attendance is locked; later days can still be edited.');
            $key=substr(hash('sha256','attendance:'.$id.':'.$day),0,24);$old=$this->store->get('employeeattendance',$key);if(($b['revision']??null)!==($old['revision']??0))throw new HttpError(409,'Attendance changed. Refresh and retry.');
            $states=$b['states']??[];$shifts=$this->terms($e,$day)['shifts'];if(!is_array($states)||count($states)!==2||array_diff(array_keys($states),$shifts)||array_diff($states,['Present','Absent']))throw new HttpError(400,'Set Present or Absent for both assigned shifts');
            $a=['_id'=>$key,'employee'=>$id,'date'=>$day,'states'=>$states,'revision'=>($old['revision']??0)+1];if(($old['states']??null)===$states)return success($old);
            $a=$this->store->put('employeeattendance',$a,$old===null);$this->audit('attendance',$key,$old??[],$a,$actor);return success($a);
        });
    }
    private function payroll(array $e,string $month,array $rows):array{
        $days=(int)(new \DateTimeImmutable($month.'-01'))->format('t');$gross=0;$absence=0;$absent=0;$present=0;
        foreach($rows as $row){$gross+=$row['salaryPaise']/$days;foreach($row['states']as $status){if($status==='Absent'){$absent++;if($row['deductAbsence'])$absence+=$row['salaryPaise']/$days/2;}else $present++;}}
        $settings=$this->store->first('employeepayroll',fn($p)=>$p['employee']===$e['_id']&&$p['month']===$month)??['revision'=>0,'allowancePaise'=>0,'deductionPaise'=>0,'note'=>''];
        $payments=sorted($this->store->find('salarypayments',fn($p)=>$p['employee']===$e['_id']&&$p['month']===$month),['createdAt'=>-1]);$paid=array_sum(array_column($payments,'amountPaise'));$gross=(int)round($gross);$absence=(int)round($absence);$net=max(0,$gross-$absence+$settings['allowancePaise']-$settings['deductionPaise']);
        return ['month'=>$month,'calendarDays'=>$days,'accruedDays'=>count($rows),'presentShifts'=>$present,'absentShifts'=>$absent,'grossPaise'=>$gross,'absenceDeductionPaise'=>$absence,'netPaise'=>$net,'paidPaise'=>$paid,'balancePaise'=>$net-$paid,'settings'=>$settings,'payments'=>$payments];
    }
    public function detail(string $id,string $month):array{$e=$this->person($id);$rows=$this->attendance($e,$month);return success(['employee'=>$e,'today'=>$this->today(),'attendance'=>$rows,'payroll'=>$this->payroll($e,$month,$rows),'audit'=>array_slice(sorted($this->store->find('employeeaudit',fn($a)=>($a['target']??'')===$id||($a['after']['employee']??'')===$id),['createdAt'=>-1]),0,100)]);}
    public function adjustments(string $id,array $b,string $actor):array{
        return $this->store->transaction(function()use($id,$b,$actor){$this->person($id);$m=$this->month((string)($b['month']??''));if($m>substr($this->today(),0,7))throw new HttpError(400,'Future payroll is not available');$key=substr(hash('sha256','payroll:'.$id.':'.$m),0,24);$old=$this->store->get('employeepayroll',$key);if(($b['revision']??null)!==($old['revision']??0))throw new HttpError(409,'Payroll changed. Refresh and retry.');$note=trim((string)($b['note']??''));if(strlen($note)<3||strlen($note)>500)throw new HttpError(400,'Add a reason (3–500 characters)');$p=['_id'=>$key,'employee'=>$id,'month'=>$m,'allowancePaise'=>$this->paise($b['allowance']??0),'deductionPaise'=>$this->paise($b['deduction']??0),'note'=>$note,'revision'=>($old['revision']??0)+1];$e=$this->person($id);$preview=$this->payroll($e,$m,$this->attendance($e,$m));if(max(0,$preview['grossPaise']-$preview['absenceDeductionPaise']+$p['allowancePaise']-$p['deductionPaise'])<$preview['paidPaise'])throw new HttpError(409,'Adjustment would reduce earned salary below the amount already paid.');$p=$this->store->put('employeepayroll',$p,$old===null);$this->audit('payroll',$key,$old??[],$p,$actor);return success($p);});
    }
    public function payment(string $id,array $b,string $actor):array{
        return $this->store->transaction(function()use($id,$b,$actor){$e=$this->person($id);$m=$this->month((string)($b['month']??''));$request=(string)($b['requestId']??'');if(!preg_match('/^[a-f0-9-]{36}$/Di',$request))throw new HttpError(400,'Payment request identity is required');
            $key=substr(hash('sha256','salary:'.$id.':'.$request),0,24);$amount=$this->paise($b['amount']??null);$method=$b['method']??'';$date=dayKey($b['date']??'');$note=trim((string)($b['note']??''));if(!$amount||!in_array($method,['Cash','UPI','Bank transfer'],true)||strlen($note)>500||$date>$this->today()||$date<$e['joiningDate']||$m>substr($this->today(),0,7))throw new HttpError(400,'Enter a valid payment amount, date and method');
            $fingerprint=hash('sha256',serialize([$id,$m,$amount,$method,$date,$note]));$existing=$this->store->get('salarypayments',$key);if($existing){if($existing['fingerprint']!==$fingerprint)throw new HttpError(409,'Payment request was already used with different details');return success($existing);}
            $rows=$this->attendance($e,$m);$p=$this->payroll($e,$m,$rows);if($amount>$p['balancePaise'])throw new HttpError(400,'Payment exceeds earned salary remaining for this month');
            $data=['_id'=>$key,'employee'=>$id,'month'=>$m,'amountPaise'=>$amount,'method'=>$method,'date'=>$date,'note'=>$note,'fingerprint'=>$fingerprint,'slipNo'=>'SAL-'.str_replace('-','',$m).'-'.strtoupper(substr($key,-8)),'snapshot'=>['employee'=>['name'=>$e['name'],'phone'=>$e['phone'],'joiningDate'=>$e['joiningDate']],'payroll'=>array_diff_key($p,['payments'=>true]),'attendance'=>$rows,'paidAfterPaise'=>$p['paidPaise']+$amount,'balanceAfterPaise'=>$p['balancePaise']-$amount],'actor'=>$actor];
            $data=$this->store->put('salarypayments',$data,true);$this->audit('salarypayment',$key,[],$data,$actor);return success($data);
        });
    }
    public function slip(string $id):array{$p=$this->store->get('salarypayments',$id)??throw new HttpError(404,'Salary payment not found');return [200,new PdfResponse((new PdfRenderer())->run(['type'=>'salary','data'=>$p]),$p['slipNo'].'.pdf')];}
}
