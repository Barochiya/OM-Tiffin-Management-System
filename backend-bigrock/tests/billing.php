<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';require_once dirname(__DIR__).'/billing.php';
final class BillingMemoryStore extends OMT\Store {
    public array $records=[],$events=[];
    public function queue(string $key,array $payload):void{$this->events[$key]=$payload;}
    public function __construct(){}
    public function all(string $collection):array{return array_values($this->records[$collection]??[]);}
    public function get(string $collection,string $id):?array{return $this->records[$collection][$id]??null;}
    public function transaction(callable $fn):mixed{$before=$this->records;try{return $fn($this);}catch(Throwable $e){$this->records=$before;throw $e;}}
    public function put(string $collection,array $doc,bool $insert=false):array{$doc['_id']??=bin2hex(random_bytes(12));if($insert)$doc['createdAt']??=gmdate('Y-m-d\TH:i:s.000\Z');$this->records[$collection][$doc['_id']]=$doc;return $doc;}
    public function delete(string $collection,string $id):bool{$found=isset($this->records[$collection][$id]);unset($this->records[$collection][$id]);return $found;}
}
function check(bool $value):void{if(!$value)throw new RuntimeException('Assertion failed');}
function denied(callable $fn,int $status):void{try{$fn();}catch(OMT\HttpError $e){check($e->status===$status);return;}throw new RuntimeException('Expected rejection');}
$s=new BillingMemoryStore();$b=new OMT\Billing($s);$id='507f1f77bcf86cd799439011';$old='507f1f77bcf86cd799439012';
$s->put('tiffins',['_id'=>$id,'customerName'=>'Synthetic','advanceBalance'=>50,'pricing'=>['pricingType'=>'custom','breakfastPrice'=>40,'lunchPrice'=>100,'dinnerPrice'=>80,'extraCharge'=>10,'extraReason'=>'Packing']],true);
$s->put('prices',['breakfast'=>40,'lunch'=>90,'dinner'=>90],true);
$s->put('bills',['_id'=>$old,'customer'=>$id,'month'=>9,'year'=>2026,'cycle'=>'2','invoiceNo'=>'OMTS-202609-0001','pendingAmount'=>30,'totalAmount'=>30,'paidAmount'=>0,'status'=>'Pending'],true);
denied(fn()=>$b->saveDaily(['customer'=>$id,'date'=>'2026-02-30','lunchQty'=>1]),400);
denied(fn()=>$b->saveDaily(['customer'=>$id,'date'=>'2026-10-01','lunchQty'=>2,'deliveryCheck'=>true]),409);
$entry=$b->saveDaily(['customer'=>$id,'date'=>'2026-10-01','lunchQty'=>2,'extraItems'=>[['description'=>'Extra','amount'=>5]],'deliveryCheck'=>true,'confirmUndelivered'=>true])[1]['data'];
$firstId=$entry['_id'];$saved=$b->saveDaily(['customer'=>$id,'date'=>'2026-10-01','lunchQty'=>2,'extraItems'=>[['description'=>'Extra','amount'=>5]]])[1]['data'];check($saved['_id']===$firstId);check(count($s->all('dailyentries'))===1);
$body=['customer'=>$id,'month'=>10,'year'=>2026,'cycle'=>'1'];$bill=$b->generate($body)[1]['data'];
check($bill['totalAmount']===245.0);check($bill['paidAmount']===50.0);check($bill['pendingAmount']===195.0);check($bill['previousPendingAmount']===30.0);check($bill['dailyDetails'][0]['dailyTotal']===215.0);
check($s->get('bills',$old)['carriedForward']===true);check($s->get('tiffins',$id)['advanceBalance']===0.0);
$again=$b->generate($body)[1]['data'];check($again['_id']===$bill['_id']);check($again['invoiceNo']===$bill['invoiceNo']);check($again['totalAmount']===245.0);check($again['paidAmount']===50.0);check(count($s->all('bills'))===2);
denied(fn()=>$b->addPayment(['customer'=>$id,'bill'=>$bill['_id'],'amount'=>-1]),400);
denied(fn()=>$b->addPayment(['customer'=>$id,'bill'=>$bill['_id'],'amount'=>1,'paymentMethod'=>'Razorpay']),400);
$payment=$b->addPayment(['customer'=>$id,'bill'=>$bill['_id'],'amount'=>250,'paymentMethod'=>'UPI']);check($payment[0]===201);check($payment[1]['amount']===250.0);
check($s->get('bills',$bill['_id'])['status']==='Paid');check($s->get('tiffins',$id)['advanceBalance']===55.0);
$b->saveDaily(['customer'=>$id,'date'=>'2026-10-16','dinnerQty'=>1]);$next=$b->generate([...$body,'cycle'=>'2'])[1]['data'];check($next['totalAmount']===90.0);check($next['paidAmount']===55.0);check($next['pendingAmount']===35.0);check((float)$next['previousPendingAmount']===0.0);check($next['invoiceNo']==='OMTS-202610-0002');
check(count($s->all('payments'))===1);
echo "PASS billing conversion: calendar validation, delivery warning, stable daily identity, custom prices/extras, previous pending once, advance once, regeneration, invoice sequence, overpayment balance, next-cycle advance, disabled Razorpay. Synthetic data; no customer messages.\n";

$paidRecord=$s->get('payments',$payment[1]['_id']);check($paidRecord['whatsappDelivery']['status']==='failed');
$s->records['tiffins'][$id]['phone']='0000000000';
$autoPayment=$b->addPayment(['customer'=>$id,'bill'=>$next['_id'],'amount'=>1,'paymentMethod'=>'Cash'])[1];
check($autoPayment['whatsappDelivery']['status']==='pending'&&count($s->events)===1);
check($s->events['receipt-auto:'.$autoPayment['_id']]['kind']==='receipt-auto');
echo "PASS payment save atomically queues one automatic PDF receipt intent; missing phone never rolls back payment.\n";

// Pending must roll through successive cycles once, including partial payment.
$chainStore=new BillingMemoryStore();$chain=new OMT\Billing($chainStore);
$chainStore->put('tiffins',['_id'=>$id,'customerName'=>'Synthetic carry chain','advanceBalance'=>0],true);
$chainStore->put('prices',['breakfast'=>40,'lunch'=>100,'dinner'=>80],true);
$chain->saveDaily(['customer'=>$id,'date'=>'2026-10-01','lunchQty'=>1]);
$c1=$chain->generate(['customer'=>$id,'month'=>10,'year'=>2026,'cycle'=>'1'])[1]['data'];
$chain->saveDaily(['customer'=>$id,'date'=>'2026-10-16','lunchQty'=>1]);
$c2=$chain->generate(['customer'=>$id,'month'=>10,'year'=>2026,'cycle'=>'2'])[1]['data'];
check($c2['previousPendingAmount']===100.0&&$c2['pendingAmount']===200.0);
$chain->addPayment(['customer'=>$id,'bill'=>$c2['_id'],'amount'=>50,'paymentMethod'=>'Cash']);
$chain->saveDaily(['customer'=>$id,'date'=>'2026-11-01','lunchQty'=>1]);
$c3=$chain->generate(['customer'=>$id,'month'=>11,'year'=>2026,'cycle'=>'1'])[1]['data'];
check($c3['previousPendingAmount']===150.0&&$c3['pendingAmount']===250.0);
$repeat=$chain->generate(['customer'=>$id,'month'=>11,'year'=>2026,'cycle'=>'1'])[1]['data'];
check($repeat['_id']===$c3['_id']&&$repeat['pendingAmount']===250.0);
check($chainStore->get('bills',$c1['_id'])['carriedForward']&&$chainStore->get('bills',$c2['_id'])['carriedForward']);
echo "PASS consecutive cycle carry-forward, partial payment, month rollover and repeat generation without duplicate dues. Synthetic only.\n";
// Payment picker must expose only the invoice owning the carried balance.
$pickerStore=new BillingMemoryStore();$pickerBilling=new OMT\Billing($pickerStore);
$pickerStore->put('tiffins',['_id'=>$id,'customerName'=>'Synthetic payment picker','advanceBalance'=>0],true);
$pickerStore->put('prices',['breakfast'=>40,'lunch'=>900,'dinner'=>80],true);
$pickerStore->put('bills',['_id'=>$old,'customer'=>$id,'month'=>9,'year'=>2026,'cycle'=>'2','invoiceNo'=>'OLD','pendingAmount'=>50,'totalAmount'=>50,'paidAmount'=>0,'status'=>'Pending'],true);
$pickerBilling->saveDaily(['customer'=>$id,'date'=>'2026-10-01','lunchQty'=>1]);
$current=$pickerBilling->generate(['customer'=>$id,'month'=>10,'year'=>2026,'cycle'=>'1'])[1]['data'];
$picker=new OMT\ReadModels($pickerStore);
foreach([false,true]as $pendingOnly){$options=$picker->billsForPayment($id,$pendingOnly)[1];check(count($options)===1&&$options[0]['_id']===$current['_id']&&$options[0]['pendingAmount']===950.0);}
denied(fn()=>$pickerBilling->addPayment(['customer'=>$id,'bill'=>$old,'amount'=>50,'paymentMethod'=>'Cash']),409);
check(count($pickerStore->all('bills'))===2&&count($pickerStore->all('payments'))===0);
echo "PASS payment selection: 50 carried plus 900 current exposes only 950 current invoice; superseded invoice payment rejected and history retained.\n";