<?php
declare(strict_types=1);
namespace OMT;
final class Auth {
    public function __construct(private readonly Store $store,private readonly string $adminSecret,private readonly string $customerSecret,private readonly int $adminLifetime=7*86400){}
    public function adminLogin(array $body): array {
        $email=(string)($body['email']??'');$password=(string)($body['password']??'');
        if($email===''||$password==='')throw new HttpError(400,'Email and Password are required');
        $admin=$this->store->first('admins',fn($a)=>($a['email']??'')===$email);
        if(!$admin||!password_verify($password,$admin['password']))throw new HttpError(401,'Invalid Email or Password');
        return [200,['success'=>true,'message'=>'Login Successful','token'=>signToken(['id'=>$admin['_id']],$this->adminSecret,$this->adminLifetime),'admin'=>['id'=>$admin['_id'],'name'=>$admin['name'],'email'=>$admin['email']]]];
    }
    public function changePassword(string $accountId,array $body):array {
        $current=(string)($body['currentPassword']??'');$new=(string)($body['newPassword']??'');$confirm=(string)($body['confirmPassword']??'');
        if($new===''||$confirm==='')throw new HttpError(400,'New password and confirm password are required');
        if($new!==$confirm)throw new HttpError(400,'New password and confirm password do not match');
        preg_match_all('/./us',$new,$characters);$length=0;foreach($characters[0]as $character)$length+=strlen($character)===4?2:1;
        if($length<8)throw new HttpError(400,'New password must be at least 8 characters long');
        if(str_contains($new,"\0"))throw new HttpError(400,'Invalid password');
        return $this->store->transaction(function()use($accountId,$current,$new){
            $a=$this->store->get('customeraccounts',$accountId);if(!$a)throw new HttpError(404,'Customer account not found');
            $first=!empty($a['isFirstLogin']);
            if(!$first){
                if($current==='')throw new HttpError(400,'Current password is required');
                if($current===$new)throw new HttpError(400,'New password must be different from current password');
                if(!password_verify($current,$a['passwordHash']))throw new HttpError(401,'Current password is incorrect');
            }
            // Source bcrypt uses 12 rounds and the first 72 UTF-8 bytes.
            $a['passwordHash']=password_hash(substr($new,0,72),PASSWORD_BCRYPT,['cost'=>12]);
            $a['isFirstLogin']=false;$a['passwordChangedAt']=(new \DateTimeImmutable('now',new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');$a['failedLoginAttempts']=0;$a['lockedUntil']=null;
            $this->store->put('customeraccounts',$a);
            return [200,['success'=>true,'message'=>$first?'Password set successfully':'Password changed successfully','customer'=>['id'=>$a['customer'],'userId'=>$a['userId'],'isFirstLogin'=>false]]];
        });
    }
    public function customerLogin(array $body): array {
        $userId=strtoupper(trim((string)($body['userId']??'')));$password=(string)($body['password']??'');
        if($userId===''||$password==='')throw new HttpError(400,'User ID and password are required');
        return $this->store->transaction(function()use($userId,$password){
            $a=$this->store->first('customeraccounts',fn($a)=>($a['userId']??'')===$userId);
            if(!$a)throw new HttpError(401,'Invalid User ID or password');
            if(empty($a['loginEnabled']))throw new HttpError(403,'Customer login is disabled');
            if(!$this->store->get('tiffins',(string)$a['customer']))throw new HttpError(403,'You are no longer an active OM Tiffin Service customer. Please contact OM Tiffin Service.');
            if(!empty($a['lockedUntil'])&&strtotime($a['lockedUntil'])>time())throw new HttpError(423,'Account temporarily locked. Please try again later.');
            if(!empty($a['lockedUntil'])){$a['failedLoginAttempts']=0;$a['lockedUntil']=null;}
            if(!password_verify($password,$a['passwordHash'])){
                $a['failedLoginAttempts']=($a['failedLoginAttempts']??0)+1;
                if($a['failedLoginAttempts']>=5)$a['lockedUntil']=gmdate('Y-m-d\TH:i:s.000\Z',time()+900);
                $this->store->put('customeraccounts',$a);
                return [empty($a['lockedUntil'])?401:423,['success'=>false,'message'=>empty($a['lockedUntil'])?'Invalid User ID or password':'Too many failed attempts. Account temporarily locked.']];
            }
            $a['failedLoginAttempts']=0;$a['lockedUntil']=null;$now=gmdate('Y-m-d\TH:i:s.000\Z');
            $first=$this->store->first('customerfirstloginlogs',fn($l)=>($l['customerAccount']??'')===$a['_id']);
            if(!$first)$this->store->put('customerfirstloginlogs',['customerAccount'=>$a['_id'],'customer'=>$a['customer'],'userId'=>$a['userId'],'firstLoginAt'=>$now],true);
            $a['lastLoginAt']=$now;$this->store->put('customeraccounts',$a);
            return [200,['success'=>true,'message'=>'Customer login successful','token'=>signToken(['id'=>$a['_id'],'type'=>'customer','isFirstLogin'=>(bool)$a['isFirstLogin']],$this->customerSecret,7*86400),'customer'=>['id'=>$a['customer'],'userId'=>$a['userId'],'isFirstLogin'=>(bool)$a['isFirstLogin']]]];
        });
    }
}
