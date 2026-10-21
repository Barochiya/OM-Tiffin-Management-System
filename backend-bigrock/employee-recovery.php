<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/catalog.php';
final class EmployeeRecovery {
    public function __construct(private readonly Store $store){}
    private function account(string $userId):?array{return $this->store->first('employeeaccounts',fn($d)=>($d['userId']??null)===$userId&&!empty($d['loginEnabled']));}
    private function latest(string $account,string $purpose,callable $extra):?array {
        return sorted($this->store->find('employeeotps',fn($d)=>($d['employeeAccount']??null)===$account&&($d['purpose']??'PASSWORD_RESET')===$purpose&&empty($d['usedAt'])&&$extra($d)),['createdAt'=>-1])[0]??null;
    }
    private function expired(?string $date):bool {if(!$date)return true;try{return (float)(new \DateTimeImmutable($date))->format('U.u')<=microtime(true);}catch(\Throwable){return true;}}
    private function now():string{return (new \DateTimeImmutable('now',new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');}
    public function send(array $body,string $purpose):array {
        if(!in_array($purpose,['PASSWORD_RESET','ACCOUNT_SETUP','USER_ID_RECOVERY'],true))throw new \LogicException('Invalid recovery purpose');
        $setup=$purpose==='ACCOUNT_SETUP';$userRecovery=$purpose==='USER_ID_RECOVERY';$userId=strtoupper(trim((string)($body['userId']??'')));$phone=preg_replace('/\D/','',(string)($body['phone']??''));
        if($userRecovery&&!preg_match('/^[6-9]\d{9}$/D',$phone))throw new HttpError(400,'Please enter a valid registered WhatsApp number');
        if(!$userRecovery&&$userId==='')throw new HttpError(400,'User ID is required'.($setup?'':'.'));
        return $this->store->transaction(function()use($purpose,$setup,$userRecovery,$userId,$phone){$this->store->prepareEmployeeCollections();
            if($userRecovery){$matches=$this->store->find('employeeaccounts',function($a)use($phone){$c=$this->store->get('employees',(string)($a['employee']??''));return !empty($a['loginEnabled'])&&$c&&substr(preg_replace('/\D/','',(string)($c['phone']??'')),-10)===$phone;});$account=count($matches)===1?$matches[0]:null;}
            else $account=$this->account($userId);
            if($setup&&$account&&($account['isFirstLogin']??true)===false)throw new HttpError(409,'You are already registered. Please log in.',['alreadyRegistered'=>true]);
            $employee=$account?$this->store->get('employees',$account['employee']):null;
            $generic=$userRecovery?'If this number is registered, an OTP will be sent to your WhatsApp.':($setup?'If the account is eligible, a verification code will be sent to the registered WhatsApp number.':'If the account is eligible, an OTP has been sent to the registered WhatsApp number.');
            if(!$account||!$employee||empty($employee['phone']))return [200,['success'=>true,'message'=>$generic]];
            $latest=sorted($this->store->find('employeeotps',fn($d)=>($d['employeeAccount']??null)===$account['_id']&&($purpose==='PASSWORD_RESET'||($d['purpose']??'PASSWORD_RESET')===$purpose)),['createdAt'=>-1])[0]??null;
            if($latest){$created=(float)(new \DateTimeImmutable($latest['createdAt']))->format('U.u');$remaining=(int)ceil($created+60-microtime(true));if($remaining>0){
                $response=['success'=>false,'message'=>$setup?'Please wait before requesting another verification code.':($userRecovery?'Please wait before requesting another OTP.':'Please wait '.$remaining.' seconds before requesting another OTP.')];
                if(!$userRecovery)$response['retryAfterSeconds']=$remaining;if(!$setup&&!$userRecovery)$response['code']='OTP_RESEND_COOLDOWN';return [429,$response];
            }}
            // Supersede prior credentials without deleting imported OTP/history rows.
            foreach($this->store->find('employeeotps',fn($d)=>($d['employeeAccount']??null)===$account['_id']&&($purpose==='PASSWORD_RESET'||($d['purpose']??'PASSWORD_RESET')===$purpose))as $old){if(empty($old['usedAt'])){$old['usedAt']=$this->now();$old['resetTokenHash']=null;$old['resetTokenExpiresAt']=null;$this->store->put('employeeotps',$old);}}
            $code=(string)random_int(100000,999999);$to=preg_replace('/\D/','',(string)$employee['phone']);if($setup&&strlen($to)===10)$to='91'.$to;
            $expires=(new \DateTimeImmutable('now',new \DateTimeZone('UTC')))->modify('+600 seconds')->format('Y-m-d\TH:i:s.v\Z');
            $otp=$this->store->put('employeeotps',['employee'=>$employee['_id'],'employeeAccount'=>$account['_id'],'phone'=>$to,'purpose'=>$purpose,'otpHash'=>hash('sha256',$code),'expiresAt'=>$expires,'attempts'=>0,'verifiedAt'=>null,'resetTokenHash'=>null,'resetTokenExpiresAt'=>null,'usedAt'=>null,'whatsappMessageId'=>null,'whatsappStatus'=>'pending','whatsappSentAt'=>null,'whatsappDeliveredAt'=>null,'whatsappReadAt'=>null,'whatsappFailedAt'=>null,'whatsappFailureReason'=>''],true);
            $this->store->queue('otp:'.$otp['_id'],['kind'=>'employee-otp','otpId'=>$otp['_id'],'expiresAt'=>$expires,'to'=>$to,'templateName'=>'om_tiffin_customer_otp','languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>[['type'=>'text','text'=>$code]]],['type'=>'button','sub_type'=>'url','index'=>'0','parameters'=>[['type'=>'text','text'=>$code]]]]]);unset($code);
            if($userRecovery)return [200,['success'=>true,'message'=>$generic]];
            return [200,['success'=>true,'message'=>$setup?'Verification code queued for WhatsApp delivery.':'OTP queued for delivery to your registered WhatsApp number.','expiresInSeconds'=>600,'resendAfterSeconds'=>60]];
        });
    }
    public function verify(array $body,string $purpose):array {
        if(!in_array($purpose,['PASSWORD_RESET','ACCOUNT_SETUP','USER_ID_RECOVERY'],true))throw new \LogicException('Invalid recovery purpose');
        $userId=strtoupper(trim((string)($body['userId']??'')));$code=trim((string)($body['otp']??''));$setup=$purpose==='ACCOUNT_SETUP';$userRecovery=$purpose==='USER_ID_RECOVERY';
        $phone=preg_replace('/\D/','',(string)($body['phone']??''));
        if($userRecovery&&!preg_match('/^[6-9]\d{9}$/D',$phone))throw new HttpError(400,'Please enter a valid registered WhatsApp number');
        if(!$userRecovery&&$userId==='')throw new HttpError(400,$setup?'User ID and a valid 6-digit verification code are required.':'User ID and OTP are required.');
        if(!preg_match('/^\d{6}$/D',$code))throw new HttpError(400,$setup?'User ID and a valid 6-digit verification code are required.':($userRecovery?'Please enter a valid 6-digit OTP':'OTP must be a 6-digit code.'));
        return $this->store->transaction(function()use($purpose,$userId,$code,$phone,$setup,$userRecovery){$this->store->prepareEmployeeCollections();
            if($userRecovery){
                $matches=$this->store->find('employeeaccounts',function($a)use($phone){$employee=$this->store->get('employees',(string)($a['employee']??''));return !empty($a['loginEnabled'])&&$employee&&substr(preg_replace('/\D/','',(string)($employee['phone']??'')),-10)===$phone;});
                $account=count($matches)===1?$matches[0]:null;
            }else $account=$this->account($userId);
            if($setup&&$account&&($account['isFirstLogin']??true)===false)throw new HttpError(409,'You are already registered. Please log in.',['alreadyRegistered'=>true]);
            if(!$account)throw new HttpError($setup?401:400,$setup?'Invalid verification request.':'Invalid or expired OTP'.($userRecovery?'':'.'));
            $record=$this->latest($account['_id'],$purpose,fn($d)=>!$setup||empty($d['verifiedAt']));
            if(!$record)throw new HttpError(400,$setup?'Verification code is invalid or expired.':'Invalid or expired OTP'.($userRecovery?'':'.'));
            if($this->expired($record['expiresAt']??null))throw new HttpError(400,$setup?'Verification code has expired. Please request a new code.':'OTP has expired. Please request a new OTP.');
            if(($record['attempts']??0)>=5)throw new HttpError(429,$setup?'Too many verification attempts. Please request a new code.':($userRecovery?'Too many invalid OTP attempts. Please request a new OTP.':'Maximum OTP attempts exceeded. Please request a new OTP.'));
            if($setup)$record['attempts']=($record['attempts']??0)+1;
            if(!hash_equals((string)$record['otpHash'],hash('sha256',$code))){
                if(!$setup)$record['attempts']=($record['attempts']??0)+1;
                $this->store->put('employeeotps',$record);
                $response=['success'=>false,'message'=>$setup?'Verification code is invalid.':'Invalid or expired OTP'.($userRecovery?'':'.')];
                if(!$setup&&!$userRecovery)$response['attemptsRemaining']=max(0,5-$record['attempts']);
                return [400,$response]; // Return, rather than throw, so the failed-attempt increment commits.
            }
            $record['verifiedAt']=$this->now();
            if($userRecovery){$record['usedAt']=$this->now();$this->store->put('employeeotps',$record);return [200,['success'=>true,'message'=>'OTP verified successfully','userId'=>$account['userId']]];}
            $token=bin2hex(random_bytes(32));$record['resetTokenHash']=hash('sha256',$token);$record['resetTokenExpiresAt']=gmdate('Y-m-d\TH:i:s.000\Z',time()+600);$this->store->put('employeeotps',$record);
            $response=['success'=>true,'message'=>$setup?'Verification successful.':'OTP verified successfully.',$setup?'setupToken':'resetToken'=>$token,'expiresInSeconds'=>600];
            if($setup)$response['employee']=['id'=>$account['employee'],'userId'=>$account['userId'],'isFirstLogin'=>true];
            return [200,$response];
        });
    }
    public function password(array $body,bool $setup=false):array {
        $userId=strtoupper(trim((string)($body['userId']??'')));$token=trim((string)($body[$setup?'setupToken':'resetToken']??''));$new=(string)($body['newPassword']??'');$confirm=(string)($body['confirmPassword']??'');
        if($userId===''||$token===''||(!$setup&&($new===''||$confirm==='')))throw new HttpError(400,$setup?'User ID and setup token are required.':'User ID, reset token, new password and confirm password are required.');
        preg_match_all('/./us',$new,$characters);$length=0;foreach($characters[0]as $c)$length+=strlen($c)===4?2:1;
        if($length<8)throw new HttpError(400,$setup?'New password must be at least 8 characters.':'New password must be at least 8 characters long.');
        if($new!==$confirm)throw new HttpError(400,'New password and confirm password do not match.');
        if(strlen($new)>72)throw new HttpError(400,'Password must be at most 72 UTF-8 bytes');
        if(str_contains($new,"\0"))throw new HttpError(400,'Invalid password');
        return $this->store->transaction(function()use($userId,$token,$new,$setup){$this->store->prepareEmployeeCollections();
            $account=$this->account($userId);
            if($setup&&$account&&($account['isFirstLogin']??true)===false)throw new HttpError(409,'You are already registered. Please log in.',['alreadyRegistered'=>true]);
            if(!$account)throw new HttpError($setup?401:400,$setup?'Invalid account setup request.':'Invalid or expired reset request.');
            $record=$this->latest($account['_id'],$setup?'ACCOUNT_SETUP':'PASSWORD_RESET',fn($d)=>!empty($d['verifiedAt'])&&hash_equals((string)($d['resetTokenHash']??''),hash('sha256',$token)));
            if(!$record)throw new HttpError(400,$setup?'Invalid or expired account setup request.':'Invalid or expired reset request.');
            if($this->expired($record['resetTokenExpiresAt']??null))throw new HttpError(400,$setup?'Account setup session has expired. Please verify again.':'Reset request has expired. Please request a new OTP.');
            if(!$setup&&password_verify($new,$account['passwordHash']))throw new HttpError(400,'New password must be different from the current password.');
            $account['sessionVersion']=($account['sessionVersion']??0)+1;$account['passwordHash']=password_hash(substr($new,0,72),PASSWORD_BCRYPT,['cost'=>12]);$account['isFirstLogin']=false;$account['passwordChangedAt']=$this->now();$account['failedLoginAttempts']=0;$account['lockedUntil']=null;$this->store->put('employeeaccounts',$account);
            $record['usedAt']=$this->now();$record['resetTokenHash']=null;$record['resetTokenExpiresAt']=null;$this->store->put('employeeotps',$record);
            $response=['success'=>true,'message'=>$setup?'Password created successfully. Your employee portal account is ready.':'Password reset successfully. You can now log in.'];
            if($setup)$response['employee']=['id'=>$account['employee'],'userId'=>$account['userId'],'isFirstLogin'=>false];
            return [200,$response];
        });
    }
}
