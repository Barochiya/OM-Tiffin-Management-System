<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';
final class CustomerAccessStore extends OMT\Store {
 public array $records=[];public function __construct(){}
 public function all(string $c):array{return array_values($this->records[$c]??[]);}
 public function get(string $c,string $id):?array{return $this->records[$c][$id]??null;}
 public function put(string $c,array $row,bool $insert=false):array{$row['_id']??=bin2hex(random_bytes(12));return $this->records[$c][$row['_id']]=$row;}
 public function transaction(callable $f):mixed{$old=$this->records;try{return $f($this);}catch(Throwable $e){$this->records=$old;throw $e;}}
}
function accessCheck(bool $ok,string $why):void{if(!$ok)throw new RuntimeException($why);}
function accessDenied(callable $f,int $code):void{try{$f();}catch(OMT\HttpError $e){accessCheck($e->status===$code,'Wrong rejection '.$e->status);return;}throw new RuntimeException('Expected rejection '.$code);}
$s=new CustomerAccessStore();$own='111111111111111111111111';$other='222222222222222222222222';$account='333333333333333333333333';$payment='444444444444444444444444';$bill='555555555555555555555555';
$settings=['JWT_SECRET'=>'synthetic-access-admin-secret','CUSTOMER_JWT_SECRET'=>'synthetic-access-customer-secret','migration'=>['writesEnabled'=>true]];
$s->put('tiffins',['_id'=>$own,'customerName'=>'Synthetic own','phone'=>'9999999999','address'=>'Synthetic address','advanceBalance'=>0,'pricing'=>['lunchPrice'=>90]]);
$s->put('tiffins',['_id'=>$other,'customerName'=>'Synthetic other']);
$s->put('customeraccounts',['_id'=>$account,'customer'=>$own,'loginEnabled'=>true,'isFirstLogin'=>false]);
$s->put('bills',['_id'=>$bill,'customer'=>$own,'invoiceNo'=>'SYNTHETIC-ONLY','totalAmount'=>100,'paidAmount'=>100,'pendingAmount'=>0]);
$s->put('payments',['_id'=>$payment,'customer'=>$own,'bill'=>$bill,'status'=>'Success','amount'=>100,'paymentMethod'=>'Cash','paymentDate'=>'2026-11-20T00:00:00Z']);
$router=new OMT\Router($s,$settings);$token=OMT\signToken(['id'=>$account,'type'=>'customer'],$settings['CUSTOMER_JWT_SECRET'],3600);$before=$s->records;$count=0;
foreach($router->inventory()as $route){if($route['access']!=='admin')continue;$path=preg_replace('/:[A-Za-z]+/',$other,$route['path']);accessDenied(fn()=>$router->dispatch($route['method'],$path,[],['amount'=>99999,'customer'=>$other],$token),401);$count++;}
accessCheck($s->records===$before,'Rejected admin calls must not mutate data');
accessDenied(fn()=>$router->dispatch('GET','/customer-portal/payments/'.$payment.'/pdf'),401);
$s->records['payments'][$payment]['customer']=$other;accessDenied(fn()=>$router->dispatch('GET','/customer-portal/payments/'.$payment.'/pdf',[],[],$token),404);
$s->records['payments'][$payment]['customer']=$own;$s->records['payments'][$payment]['status']='Reversed';accessDenied(fn()=>$router->dispatch('GET','/customer-portal/payments/'.$payment.'/pdf',[],[],$token),409);
$s->records['payments'][$payment]['status']='Success';$s->records['bills'][$bill]['customer']=$other;accessDenied(fn()=>$router->dispatch('GET','/customer-portal/payments/'.$payment.'/pdf',[],[],$token),409);$s->records['bills'][$bill]['customer']=$own;
$before=$s->records;
if(getenv('OMTIFFIN_NODE')&&getenv('OMTIFFIN_RENDERER')){[$status,$pdf]=$router->dispatch('GET','/customer-portal/payments/'.$payment.'/pdf',[],[],$token);accessCheck($status===200&&$pdf instanceof OMT\PdfResponse&&str_starts_with($pdf->bytes,'%PDF-'),'Own receipt is genuine PDF');accessCheck($s->records===$before,'Receipt must be read-only');echo "PASS own customer receipt PDF rendered without writes.\n";}
$router->dispatch('PUT','/customer-portal/profile',[],['customerName'=>'Updated own name','phone'=>'9888888888','address'=>'Updated own address','deliveryLocation'=>['latitude'=>23.1,'longitude'=>72.1],'paidAmount'=>999,'advanceBalance'=>999,'pricing'=>['lunchPrice'=>0],'customer'=>$other],$token);
accessCheck($s->records['tiffins'][$own]['phone']==='9888888888'&&$s->records['tiffins'][$own]['deliveryLocation']['latitude']===23.1,'Own self-service details allowed');
accessCheck($s->records['tiffins'][$own]['advanceBalance']===0&&$s->records['tiffins'][$own]['pricing']===$before['tiffins'][$own]['pricing']&&$s->records['tiffins'][$other]===$before['tiffins'][$other]&&$s->records['bills']===$before['bills']&&$s->records['payments']===$before['payments'],'Profile cannot mutate financial fields or other customer');
echo "PASS $count admin routes deny customer; receipt ownership/approval/invoice consistency; profile edits preserve billing and payment records. Synthetic only.\n";
