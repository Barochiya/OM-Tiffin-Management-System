<?php
declare(strict_types=1);
require __DIR__.'/accounts.php';
$s=new AccountStore();$c=$s->put('tiffins',['customerName'=>'Synthetic','phone'=>'9999999999','barcode'=>'OMT-TEST'],true);
(new OMT\Customers($s))->ensureAccount($c['_id']);$a=$s->all('customeraccounts')[0];$r=new OMT\Recovery($s);
function otpCode(AccountStore $s):string{return array_values($s->events)[count($s->events)-1]['components'][0]['parameters'][0]['text'];}
function ageOtps(AccountStore $s):void{foreach($s->all('customerotps')as $o){$o['createdAt']=gmdate('c',time()-61);$s->put('customerotps',$o);}}
// Timestamped synthetic records; fake outbox never calls WhatsApp.
function stamp(AccountStore $s):void{foreach($s->all('customerotps')as $o)if(empty($o['createdAt'])){$o['createdAt']=gmdate('c');$s->put('customerotps',$o);}}
check($r->send(['userId'=>'OMT-TEST'],'ACCOUNT_SETUP')[0]===200);stamp($s);$code=otpCode($s);
check($r->send(['userId'=>'OMT-TEST'],'ACCOUNT_SETUP')[0]===429);
denied(fn()=>$r->verify(['userId'=>'OMT-TEST','otp'=>$code],'PASSWORD_RESET'),400);
$bad=$code==='111111'?'222222':'111111';check($r->verify(['userId'=>'OMT-TEST','otp'=>$bad],'ACCOUNT_SETUP')[0]===400);
$v=$r->verify(['userId'=>'OMT-TEST','otp'=>$code],'ACCOUNT_SETUP')[1];check(isset($v['setupToken']));
$body=['userId'=>'OMT-TEST','setupToken'=>$v['setupToken'],'newPassword'=>'synthetic-password','confirmPassword'=>'synthetic-password'];
check($r->password($body,true)[0]===200);denied(fn()=>$r->password($body,true),409);
$auth=new OMT\Auth($s,'synthetic-admin-secret','synthetic-customer-secret');check($auth->customerLogin(['userId'=>'OMT-TEST','password'=>'synthetic-password'])[0]===200);
denied(fn()=>$r->send(['userId'=>'OMT-TEST'],'ACCOUNT_SETUP'),409);
ageOtps($s);check($r->send(['userId'=>'OMT-TEST'],'PASSWORD_RESET')[0]===200);stamp($s);$code=otpCode($s);
$v=$r->verify(['userId'=>'OMT-TEST','otp'=>$code],'PASSWORD_RESET')[1];
$body=['userId'=>'OMT-TEST','resetToken'=>$v['resetToken'],'newPassword'=>'synthetic-new-password','confirmPassword'=>'synthetic-new-password'];check($r->password($body)[0]===200);denied(fn()=>$r->password($body),400);
check($auth->customerLogin(['userId'=>'OMT-TEST','password'=>'synthetic-new-password'])[0]===200);
ageOtps($s);check($r->send(['phone'=>'9999999999'],'USER_ID_RECOVERY')[0]===200);stamp($s);$code=otpCode($s);
check($r->verify(['phone'=>'9999999999','otp'=>$code],'USER_ID_RECOVERY')[1]['userId']==='OMT-TEST');denied(fn()=>$r->verify(['phone'=>'9999999999','otp'=>$code],'USER_ID_RECOVERY'),400);
ageOtps($s);$r->send(['userId'=>'OMT-TEST'],'PASSWORD_RESET');stamp($s);$code=otpCode($s);$o=array_values($s->all('customerotps'));$last=$o[count($o)-1];$last['expiresAt']=gmdate('c',time()-1);$s->put('customerotps',$last);denied(fn()=>$r->verify(['userId'=>'OMT-TEST','otp'=>$code],'PASSWORD_RESET'),400);
foreach($s->events as $event)check($event['templateName']==='om_tiffin_customer_otp');
echo "PASS customer setup OTP/password/login, recovery OTP/reset/login, User ID recovery, cooldown, wrong purpose/code, expiry and one-use proofs. Synthetic only; no network.\n";
