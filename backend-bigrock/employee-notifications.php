<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/documents.php';
final class EmployeeNotifications {
    public const TEMPLATES=[
        // Existing approved service-update template; account ID/link only, never an OTP or password.
        'login'=>['name'=>'om_tiffin_service_update','id'=>'4577724432500720'],
        'salary'=>['name'=>'om_tiffin_employee_salary_slip','id'=>'1109939291774314'],
        'absence'=>['name'=>'om_tiffin_employee_absence','id'=>'1618010050077057'],
        'advance'=>['name'=>'om_tiffin_employee_advance','id'=>'28966451326284345'],
        'deposit'=>['name'=>'om_tiffin_employee_deposit','id'=>'28863113349964660'],
    ];
    public function __construct(private readonly Store $store){}
    public function settings():array{$s=$this->store->first('employeesettings',fn($d)=>($d['key']??null)==='whatsapp');return array_replace(['enabled'=>true,'salary'=>true,'absence'=>true,'advance'=>true,'deposit'=>true,'login'=>true,'revision'=>0],$s?array_intersect_key($s,array_flip(['enabled','salary','absence','advance','deposit','login','revision'])):[]);}
    public function update(array $b,string $actor):array{return $this->store->transaction(function()use($b,$actor){$this->store->prepareEmployeeCollections();$old=$this->settings();if(($b['revision']??null)!==$old['revision'])throw new HttpError(409,'Message settings changed. Refresh and retry.');$next=[];if(!array_key_exists('login',$b))$b['login']=$old['login'];foreach(['enabled','salary','absence','advance','deposit','login']as $k){if(!is_bool($b[$k]??null))throw new HttpError(400,'Use ON or OFF for each message setting');$next[$k]=$b[$k];}$saved=$this->store->first('employeesettings',fn($d)=>($d['key']??null)==='whatsapp');$next=$this->store->put('employeesettings',array_replace($saved??[], $next,['key'=>'whatsapp','revision'=>$old['revision']+1]),$saved===null);$this->store->put('employeeaudit',['type'=>'message-settings','target'=>$next['_id'],'before'=>$old,'after'=>$next,'actor'=>$actor],true);return success($this->settings());});}
    public function enabled(string $type):bool{$s=$this->settings();return isset(self::TEMPLATES[$type])&&$s['enabled']&&$s[$type];}
    public static function date(string $d):string{return (new \DateTimeImmutable($d))->format('d/m/Y');}
    public static function amount(int $paise):string{return number_format($paise/100,2,'.','');}
    public function enqueue(string $type,array $employee,string $source,int $revision,array $values,string $date):void{
        if(!isset(self::TEMPLATES[$type]))throw new \LogicException('Unsupported employee message type');
        $this->store->prepareEmployeeCollections();$eventKey='employee:'.$type.':'.$source.':'.$revision;$id=substr(hash('sha256',$eventKey),0,24);if($this->store->get('employeenotifications',$id))return;
        $phone=preg_replace('/\D/','',(string)$employee['phone']);if(strlen($phone)===10)$phone='91'.$phone;$valid=preg_match('/^[1-9][0-9]{10,14}$/D',$phone)===1;
        $on=$this->enabled($type);$reason=!$on?'Disabled in employee message settings':(!$valid?'Employee mobile number is invalid':'Queued; waiting for template verification and delivery');
        $record=['_id'=>$id,'employee'=>$employee['_id'],'type'=>$type,'sourceId'=>$source,'sourceRevision'=>$revision,'sourceDate'=>$date,'eventKey'=>$eventKey,'phone'=>$phone,'templateName'=>self::TEMPLATES[$type]['name'],'whatsappStatus'=>!$on?'disabled':(!$valid?'failed':'pending'),'failureReason'=>$reason,'whatsappMessageId'=>null];$this->store->put('employeenotifications',$record,true);
        if(!$on||!$valid)return;
        $this->store->queue($eventKey,['kind'=>'employee-notification','notificationId'=>$id,'employeeId'=>$employee['_id'],'notificationType'=>$type,'documentId'=>$source,'to'=>$phone,'templateName'=>self::TEMPLATES[$type]['name'],'templateId'=>self::TEMPLATES[$type]['id'],'languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>array_map(fn($v)=>['type'=>'text','text'=>(string)$v],$values)]]]);
    }
    public static function loginText(string $userId):string{return "Your OM Tiffin Service employee portal account is ready.\n\nEmployee Login ID: ".$userId."\nPortal: https://www.omtiffinservices.com/employee/login\n\nFirst time: choose Set up your password on the portal. If already registered, sign in with your own password. View your attendance, salary slips, advances and deposits. Never share your password or OTP.";}
    public function prepare(array $payload):array{
        $type=$payload['notificationType']??'';$expected=self::TEMPLATES[$type]??null;if(!$expected||($payload['templateName']??'')!==$expected['name']||($payload['templateId']??'')!==$expected['id'])throw new \LogicException('Employee template mismatch');
        if($type==='login'){$employee=$this->store->get('employees',$payload['employeeId']);$account=$this->store->first('employeeaccounts',fn($a)=>$a['employee']===$payload['employeeId']);$phone=preg_replace('/\D/','',(string)($employee['phone']??''));if(strlen($phone)===10)$phone='91'.$phone;if(!$account||empty($account['loginEnabled'])||$phone!==$payload['to'])throw new \RuntimeException('Employee login target changed before delivery');foreach($payload['components']as &$component)foreach($component['parameters']as &$parameter)if(($parameter['type']??'')==='text')$parameter['text']=preg_replace('/\s+/u',' ',trim($parameter['text']));unset($component,$parameter);}
        if($type==='salary'){
            require_once __DIR__.'/employees.php';require_once __DIR__.'/document-notifications.php';$payment=$this->store->get('salarypayments',$payload['documentId']);if(!$payment||$payment['employee']!==$payload['employeeId'])throw new \RuntimeException('Salary payment target mismatch');
            $pdf=(new Employees($this->store))->slip($payment['_id'])[1];$payload['kind']='document-template';$payload['documentType']='employee-salary';$payload['attachment']=(new DocumentNotifications($this->store,new Documents($this->store)))->storePdf($pdf->bytes);$payload['filename']=$pdf->filename;
        }
        return $payload;
    }
}
