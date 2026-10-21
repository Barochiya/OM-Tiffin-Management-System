<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';
final class RouterMemoryStore extends OMT\Store {
    public array $records=[];
    public function __construct(){}
    public function all(string $collection):array{return array_values($this->records[$collection]??[]);}
    public function get(string $collection,string $id):?array{return $this->records[$collection][$id]??null;}
    public function transaction(callable $fn):mixed{return $fn($this);}
    public function put(string $collection,array $doc,bool $insert=false):array{$doc['_id']??=bin2hex(random_bytes(12));$this->records[$collection][$doc['_id']]=$doc;return $doc;}
}
function check(bool $v):void{if(!$v)throw new RuntimeException('Assertion failed');}
function rejected(callable $fn,int $status):void{try{$fn();}catch(OMT\HttpError $e){check($e->status===$status);return;}throw new RuntimeException('Expected HTTP '.$status);}
$s=new RouterMemoryStore();$id='507f1f77bcf86cd799439011';$cid='507f1f77bcf86cd799439012';$other='507f1f77bcf86cd799439013';$bill='507f1f77bcf86cd799439014';
$settings=['JWT_SECRET'=>'synthetic-admin-secret-key','CUSTOMER_JWT_SECRET'=>'synthetic-customer-secret-key','migration'=>['writesEnabled'=>false]];
$s->put('admins',['_id'=>$id,'name'=>'Synthetic','email'=>'test@example.invalid','password'=>password_hash('test',PASSWORD_BCRYPT)],true);
$s->put('customeraccounts',['_id'=>$cid,'customer'=>$cid,'userId'=>'OMT-TEST','loginEnabled'=>true,'isFirstLogin'=>false,'passwordHash'=>'must-not-leak'],true);
$s->put('tiffins',['_id'=>$cid,'customerName'=>'Synthetic','status'=>'Active'],true);
$s->put('bills',['_id'=>$bill,'customer'=>$other,'totalAmount'=>100],true);
$r=new OMT\Router($s,$settings);$admin=OMT\signToken(['id'=>$id],$settings['JWT_SECRET'],3600);$customer=OMT\signToken(['id'=>$cid,'type'=>'customer'],$settings['CUSTOMER_JWT_SECRET'],3600);
rejected(fn()=>$r->dispatch('GET','/api/payments'),401);
rejected(fn()=>$r->dispatch('GET','/api/payments',[],[],$customer),401);
rejected(fn()=>$r->dispatch('GET','/api/customer-portal/bills/'.$bill,[],[],$customer),404);
check($r->dispatch('GET','/api/customer-portal/profile',[],[],$customer)[0]===200);
rejected(fn()=>$r->dispatch('GET','/api/wallets/'.$other,[],[],$customer),401);
rejected(fn()=>$r->dispatch('POST','/api/wallets/'.$cid.'/adjustments',[],[],$customer),401);
rejected(fn()=>$r->dispatch('GET','/api/customer-portal/wallet'),401);
check($r->dispatch('GET','/api/customer-portal/wallet',['customer'=>$other],[],$customer)[1]['data']['active']===false);
$a=$s->get('customeraccounts',$cid);$a['isFirstLogin']=true;$s->put('customeraccounts',$a);rejected(fn()=>$r->dispatch('GET','/api/customer-portal/profile',[],[],$customer),403);
rejected(fn()=>$r->dispatch('POST','/api/customer-auth/change-password',[],['newPassword'=>'test-password','confirmPassword'=>'test-password'],$customer),503);
$writeSettings=$settings;$writeSettings['migration']['writesEnabled']=true;$writeRouter=new OMT\Router($s,$writeSettings);
check($writeRouter->dispatch('POST','/api/customer-auth/change-password',[],['newPassword'=>'test-password','confirmPassword'=>'test-password'],$customer)[1]['customer']['isFirstLogin']===false);
check($r->dispatch('GET','/api/customer-portal/profile',[],[],$customer)[0]===200);
check($r->dispatch('GET','/api/website-settings')[0]===200);
rejected(fn()=>$r->dispatch('POST','/api/website-orders/public',[],[]),503);
rejected(fn()=>$r->dispatch('PUT','/api/website-settings',[],['websiteEnabled'=>false],$admin),503);
rejected(fn()=>$r->dispatch('POST','/api/payment-gateway/create-order',[],['amount'=>1],$admin),404);
rejected(fn()=>$r->dispatch('POST','/api/admin/register',[],[]),404);
check($r->dispatch('POST','/api/admin/login',[],['email'=>'test@example.invalid','password'=>'test'])[0]===200);
file_put_contents(dirname(__DIR__,2).'/implemented-routes.json',json_encode($r->inventory(),JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));
echo 'PASS API routing: admin/customer separation, customer ownership, first-login restriction, read-only staging, public settings, disabled Razorpay and closed registration. '.count($r->inventory()).' candidate routes registered.'.PHP_EOL;

rejected(fn()=>$r->dispatch('GET','/api/payments/delivery-status'),401);
rejected(fn()=>$r->dispatch('GET','/api/payments/delivery-status',[],[],$customer),401);
$s->put('payments',['_id'=>'507f1f77bcf86cd799439099','customer'=>$cid,'paymentDate'=>'2026-10-15','receiptNo'=>'TEST-RECEIPT'],true);
$receiptStatus=$r->dispatch('GET','/api/payments/delivery-status',[],[],$admin);check($receiptStatus[0]===200&&$receiptStatus[1]['data'][0]['status']==='unknown');
echo "PASS receipt delivery report is admin-only and never invents historical delivery confirmation.\n";

rejected(fn()=>$r->dispatch('GET','/api/wallets',[],[],$customer),401);
check($r->dispatch('GET','/api/wallets',[],[],$admin)[0]===200);
echo "PASS wallet list is admin-only.\n";

rejected(fn()=>$r->dispatch('GET','/api/employees'),401);rejected(fn()=>$r->dispatch('GET','/api/employees',[],[],$customer),401);rejected(fn()=>$r->dispatch('POST','/api/employees',[],[],$admin),503);echo "PASS employee records are admin-only and staging writes remain blocked.\n";

rejected(fn()=>$r->dispatch('GET','/api/employee-notification-settings'),401);rejected(fn()=>$r->dispatch('GET','/api/employee-notification-settings',[],[],$customer),401);check($r->dispatch('GET','/api/employee-notification-settings',[],[],$admin)[1]['data']['enabled']===true);rejected(fn()=>$r->dispatch('PUT','/api/employee-notification-settings',[],[],$admin),503);echo "PASS employee message settings admin-only, read defaults, staging writes blocked.\n";
