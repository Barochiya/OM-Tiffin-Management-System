<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';
final class StaffMemory extends OMT\Store {
 public array $records=[];
 public function __construct(){}
 public function all(string $c):array{return array_values($this->records[$c]??[]);}
 public function get(string $c,string $id):?array{return $this->records[$c][$id]??null;}
 public function put(string $c,array $d,bool $insert=false):array{$d['_id']??=bin2hex(random_bytes(12));$d['createdAt']??=gmdate('c');$this->records[$c][$d['_id']]=$d;return $d;}
 public function prepareEmployeeCollections():void{}
 public function transaction(callable $fn):mixed{$before=$this->records;try{return $fn($this);}catch(Throwable $e){$this->records=$before;throw $e;}}
}
function check(bool $ok):void{if(!$ok)throw new RuntimeException('Employee test assertion failed');}
function denied(callable $fn,int $status):void{try{$fn();}catch(OMT\HttpError $e){check($e->status===$status);return;}throw new RuntimeException('Expected rejection');}
$s=new StaffMemory();$e=new OMT\Employees($s,'2026-10-21');$body=['name'=>'Synthetic Employee','phone'=>'0000000000','joiningDate'=>'2026-10-16','salary'=>'31000','shifts'=>['Morning','Night'],'deductAbsence'=>true,'revision'=>0];
$employee=$e->save($body,'admin')[1]['data'];$id=$employee['_id'];$detail=$e->detail($id,'2026-10')[1]['data'];check(count($detail['attendance'])===6);check($detail['payroll']['netPaise']===600000);check($detail['payroll']['presentShifts']===12);check(count($s->all('employeeattendance'))===0);
$mark=['date'=>'2026-10-20','states'=>['Morning'=>'Absent','Night'=>'Present'],'revision'=>0];$e->mark($id,$mark,'admin');$detail=$e->detail($id,'2026-10')[1]['data'];check($detail['payroll']['netPaise']===550000);check($detail['payroll']['absentShifts']===1);
denied(fn()=>$e->mark($id,$mark,'admin'),409);denied(fn()=>$e->mark($id,[...$mark,'date'=>'2026-10-22'],'admin'),400);denied(fn()=>$e->mark($id,[...$mark,'date'=>'2026-10-15'],'admin'),400);
$full=['date'=>'2026-10-19','states'=>['Morning'=>'Absent','Night'=>'Absent'],'revision'=>0];$e->mark($id,$full,'admin');check($e->detail($id,'2026-10')[1]['data']['payroll']['netPaise']===450000);$e->mark($id,[...$full,'states'=>['Morning'=>'Present','Night'=>'Present'],'revision'=>1],'admin');
$e->adjustments($id,['month'=>'2026-10','allowance'=>'100','deduction'=>'50','note'=>'Synthetic allowance','revision'=>0],'admin');check($e->detail($id,'2026-10')[1]['data']['payroll']['netPaise']===555000);
$pay=['month'=>'2026-10','amount'=>'1000','method'=>'Cash','date'=>'2026-10-21','note'=>'Synthetic','requestId'=>'12345678-1234-1234-1234-123456789abc'];$first=$e->payment($id,$pay,'admin')[1]['data'];$again=$e->payment($id,$pay,'admin')[1]['data'];check($first['_id']===$again['_id']&&count($s->all('salarypayments'))===1);check($first['snapshot']['balanceAfterPaise']===455000);
denied(fn()=>$e->payment($id,[...$pay,'amount'=>'1001'],'admin'),409);denied(fn()=>$e->payment($id,[...$pay,'amount'=>'99999','requestId'=>'aaaaaaaa-1234-1234-1234-123456789abc'],'admin'),400);denied(fn()=>$e->mark($id,[...$mark,'revision'=>1],'admin'),409);
$updated=$e->save([...$body,'salary'=>'62000','shifts'=>['Afternoon','Night'],'revision'=>1],'admin',$id)[1]['data'];check($updated['terms'][1]['from']==='2026-10-22');check($e->detail($id,'2026-10')[1]['data']['payroll']['grossPaise']===600000);check($s->get('salarypayments',$first['_id'])['snapshot']===$first['snapshot']);
$tomorrow=new OMT\Employees($s,'2026-10-22');$detail=$tomorrow->detail($id,'2026-10')[1]['data'];check(count($detail['attendance'])===7&&$detail['attendance'][6]['states']===['Afternoon'=>'Present','Night'=>'Present']);check($detail['payroll']['grossPaise']===800000);
$tomorrow->mark($id,['date'=>'2026-10-22','states'=>['Afternoon'=>'Absent','Night'=>'Present'],'revision'=>0],'admin');check($tomorrow->detail($id,'2026-10')[1]['data']['payroll']['absenceDeductionPaise']===150000);
$inactive=$tomorrow->save([...$body,'salary'=>'62000','shifts'=>['Afternoon','Night'],'revision'=>2,'endDate'=>'2026-10-22'],'admin',$id);$later=new OMT\Employees($s,'2026-10-25');check(count($later->detail($id,'2026-10')[1]['data']['attendance'])===7);
denied(fn()=>$e->save([...$body,'shifts'=>['Morning']],'admin'),400);denied(fn()=>$e->detail($id,'2026-99'),400);
echo "PASS employees: automatic two-shift attendance, joining/end date bounds, future exclusion, half-day deduction, monthly proration, salary changes prospective, stale edits rejected, payment idempotency/overpayment protection, immutable slips and audit. Synthetic only.\n";
