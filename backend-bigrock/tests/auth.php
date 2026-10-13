<?php
declare(strict_types=1);
require dirname(__DIR__).'/security.php';
require dirname(__DIR__).'/store.php';
require dirname(__DIR__).'/auth.php';
class MemoryStore extends OMT\Store {
    public array $records=[];
    public function __construct(){}
    public function all(string $collection):array{return array_values($this->records[$collection]??[]);}
    public function get(string $collection,string $id):?array{return $this->records[$collection][$id]??null;}
    public function transaction(callable $fn):mixed{return $fn($this);}
    public function put(string $collection,array $doc,bool $insert=false):array{$doc['_id']??=bin2hex(random_bytes(12));$this->records[$collection][$doc['_id']]=$doc;return $doc;}
}
function check(bool $condition):void{if(!$condition)throw new RuntimeException('Assertion failed');}
function denied(callable $fn,int $status):void{try{$fn();}catch(OMT\HttpError $e){check($e->status===$status);return;}throw new RuntimeException('Expected denial');}
$s=new MemoryStore();$id='507f1f77bcf86cd799439011';$aid='507f1f77bcf86cd799439012';
$s->put('admins',['_id'=>$aid,'name'=>'Synthetic Admin','email'=>'test@example.invalid','password'=>password_hash('test-admin',PASSWORD_BCRYPT)],true);
$s->put('tiffins',['_id'=>$id],true);
$s->put('customeraccounts',['_id'=>$aid,'customer'=>$id,'userId'=>'OMT-000001','passwordHash'=>password_hash('test-customer',PASSWORD_BCRYPT),'loginEnabled'=>true,'isFirstLogin'=>true,'failedLoginAttempts'=>0,'lockedUntil'=>null],true);
$auth=new OMT\Auth($s,'synthetic-admin-secret-key','synthetic-customer-secret-key');
denied(fn()=>$auth->adminLogin(['email'=>'test@example.invalid','password'=>'wrong']),401);
$result=$auth->adminLogin(['email'=>'test@example.invalid','password'=>'test-admin']);check($result[0]===200);check(!isset($result[1]['admin']['password']));
check(OMT\verifyToken($result[1]['token'],'synthetic-admin-secret-key')['id']===$aid);
$login=['userId'=>' omt-000001 ','password'=>'test-customer'];
check($auth->customerLogin($login)[1]['customer']['isFirstLogin']===true);
$auth->customerLogin($login);check(count($s->all('customerfirstloginlogs'))===1);
for($n=1;$n<=5;$n++)check($auth->customerLogin([...$login,'password'=>'wrong'])[0]===($n<5?401:423));
denied(fn()=>$auth->customerLogin($login),423);
$a=$s->get('customeraccounts',$aid);$a['lockedUntil']=gmdate('c',time()-1);$s->put('customeraccounts',$a);check($auth->customerLogin($login)[0]===200);
$a=$s->get('customeraccounts',$aid);$a['loginEnabled']=false;$s->put('customeraccounts',$a);denied(fn()=>$auth->customerLogin($login),403);
denied(fn()=>$auth->changePassword($aid,['newPassword'=>'short','confirmPassword'=>'short']),400);
denied(fn()=>$auth->changePassword($aid,['newPassword'=>'new-password','confirmPassword'=>'different']),400);
$result=$auth->changePassword($aid,['newPassword'=>'new-password','confirmPassword'=>'new-password']);
check($result[1]['message']==='Password set successfully');check($result[1]['customer']['isFirstLogin']===false);check(!isset($result[1]['customer']['passwordHash']));
check(password_verify('new-password',$s->get('customeraccounts',$aid)['passwordHash']));check(password_get_info($s->get('customeraccounts',$aid)['passwordHash'])['options']['cost']===12);
denied(fn()=>$auth->changePassword($aid,['newPassword'=>'next-password','confirmPassword'=>'next-password']),400);
denied(fn()=>$auth->changePassword($aid,['currentPassword'=>'wrong','newPassword'=>'next-password','confirmPassword'=>'next-password']),401);
denied(fn()=>$auth->changePassword($aid,['currentPassword'=>'new-password','newPassword'=>'new-password','confirmPassword'=>'new-password']),400);
check($auth->changePassword($aid,['currentPassword'=>'new-password','newPassword'=>'next-password','confirmPassword'=>'next-password'])[1]['message']==='Password changed successfully');
echo "PASS PHP login parity: admin credentials, private responses, customer ID normalization, first-login token, single first-login record, five-attempt lockout, expiry recovery, disabled login. Synthetic records only.\n";
