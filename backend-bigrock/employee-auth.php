<?php
declare(strict_types=1);
namespace OMT;
final class EmployeeAuth {
    public function __construct(private readonly Store $store,private readonly string $employeeSecret){}
    public function changePassword(string $accountId,array $body):array {
        $current=(string)($body['currentPassword']??'');$new=(string)($body['newPassword']??'');$confirm=(string)($body['confirmPassword']??'');
        if($new===''||$confirm==='')throw new HttpError(400,'New password and confirm password are required');
        if($new!==$confirm)throw new HttpError(400,'New password and confirm password do not match');
        preg_match_all('/./us',$new,$characters);$length=0;foreach($characters[0]as $character)$length+=strlen($character)===4?2:1;
        if($length<8)throw new HttpError(400,'New password must be at least 8 characters long');
        if(strlen($new)>72)throw new HttpError(400,'Password must be at most 72 UTF-8 bytes');
        if(str_contains($new,"\0"))throw new HttpError(400,'Invalid password');
        return $this->store->transaction(function()use($accountId,$current,$new){
            $a=$this->store->get('employeeaccounts',$accountId);if(!$a)throw new HttpError(404,'Employee account not found');
            $first=!empty($a['isFirstLogin']);
            if(!$first){
                if($current==='')throw new HttpError(400,'Current password is required');
                if($current===$new)throw new HttpError(400,'New password must be different from current password');
                if(!password_verify($current,$a['passwordHash']))throw new HttpError(401,'Current password is incorrect');
            }
            // Source bcrypt uses 12 rounds and the first 72 UTF-8 bytes.
            $a['passwordHash']=password_hash(substr($new,0,72),PASSWORD_BCRYPT,['cost'=>12]);
            $a['sessionVersion']=($a['sessionVersion']??0)+1;$a['isFirstLogin']=false;$a['passwordChangedAt']=(new \DateTimeImmutable('now',new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');$a['failedLoginAttempts']=0;$a['lockedUntil']=null;
            $this->store->put('employeeaccounts',$a);
            return [200,['success'=>true,'message'=>$first?'Password set successfully':'Password changed successfully','employee'=>['id'=>$a['employee'],'userId'=>$a['userId'],'isFirstLogin'=>false]]];
        });
    }
    public function employeeLogin(array $body): array {
        $userId=strtoupper(trim((string)($body['userId']??'')));$password=(string)($body['password']??'');
        if($userId===''||$password==='')throw new HttpError(400,'User ID and password are required');
        return $this->store->transaction(function()use($userId,$password){
            $a=$this->store->first('employeeaccounts',fn($a)=>($a['userId']??'')===$userId);
            if(!$a)throw new HttpError(401,'Invalid User ID or password');
            if(empty($a['loginEnabled']))throw new HttpError(403,'Employee login is disabled');
            if(!$this->store->get('employees',(string)$a['employee']))throw new HttpError(403,'You are no longer an OM Tiffin Service employee. Please contact OM Tiffin Service.');
            if(!empty($a['lockedUntil'])&&strtotime($a['lockedUntil'])>time())throw new HttpError(423,'Account temporarily locked. Please try again later.');
            if(!empty($a['lockedUntil'])){$a['failedLoginAttempts']=0;$a['lockedUntil']=null;}
            if(!password_verify($password,$a['passwordHash'])){
                $a['failedLoginAttempts']=($a['failedLoginAttempts']??0)+1;
                if($a['failedLoginAttempts']>=5)$a['lockedUntil']=gmdate('Y-m-d\TH:i:s.000\Z',time()+900);
                $this->store->put('employeeaccounts',$a);
                return [empty($a['lockedUntil'])?401:423,['success'=>false,'message'=>empty($a['lockedUntil'])?'Invalid User ID or password':'Too many failed attempts. Account temporarily locked.']];
            }
            $a['failedLoginAttempts']=0;$a['lockedUntil']=null;$now=gmdate('Y-m-d\TH:i:s.000\Z');
            $first=$this->store->first('employeefirstloginlogs',fn($l)=>($l['employeeAccount']??'')===$a['_id']);
            if(!$first)$this->store->put('employeefirstloginlogs',['employeeAccount'=>$a['_id'],'employee'=>$a['employee'],'userId'=>$a['userId'],'firstLoginAt'=>$now],true);
            $a['lastLoginAt']=$now;$this->store->put('employeeaccounts',$a);
            return [200,['success'=>true,'message'=>'Employee login successful','token'=>signToken(['id'=>$a['_id'],'type'=>'employee','isFirstLogin'=>(bool)$a['isFirstLogin'],'version'=>(int)($a['sessionVersion']??0)],$this->employeeSecret,7*86400),'employee'=>['id'=>$a['employee'],'userId'=>$a['userId'],'isFirstLogin'=>(bool)$a['isFirstLogin']]]];
        });
    }
}
