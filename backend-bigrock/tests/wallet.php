<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';
final class WalletStore extends OMT\Store {
    public array $data=[],$events=[];public function __construct(){}
    public function all(string $c):array{return array_values($this->data[$c]??[]);}
    public function get(string $c,string $id):?array{return $this->data[$c][$id]??null;}
    public function put(string $c,array $d,bool $insert=false):array{$d['_id']??=bin2hex(random_bytes(12));$d['createdAt']??=gmdate('c');$this->data[$c][$d['_id']]=$d;return $d;}
    public function delete(string $c,string $id):bool{$exists=isset($this->data[$c][$id]);unset($this->data[$c][$id]);return $exists;}
    public function prepareWalletCollections():void{}
    public function queue(string $k,array $p):void{$this->events[$k]=$p;}
    public function transaction(callable $f):mixed{$old=[$this->data,$this->events];try{return $f($this);}catch(Throwable $e){[$this->data,$this->events]=$old;throw $e;}}
}
function check(bool $v,string $message):void{if(!$v)throw new RuntimeException($message);}
function denied(callable $f,int $status):void{try{$f();}catch(OMT\HttpError $e){check($e->status===$status,'Wrong rejection '.$e->status);return;}throw new RuntimeException('Expected rejection');}
$s=new WalletStore();$w=new OMT\Wallet($s);$billing=new OMT\Billing($s);$id='507f1f77bcf86cd799439011';
$s->put('tiffins',['_id'=>$id,'customerName'=>'Synthetic','advanceBalance'=>500,'pricing'=>['pricingType'=>'custom','lunchPrice'=>100,'dinnerPrice'=>80,'breakfastPrice'=>40,'extraCharge'=>10]],true);
$s->put('prices',['breakfast'=>40,'lunch'=>90,'dinner'=>90],true);
$daily=['customer'=>$id,'date'=>'2026-10-01','lunchQty'=>2,'extraItems'=>[['description'=>'Extra','amount'=>5]]];
$billing->saveDaily($daily);$bill=$billing->generate(['customer'=>$id,'month'=>10,'year'=>2026,'cycle'=>'1'])[1]['data'];
check($bill['totalAmount']===215.0,'Existing bill');
$billing->saveDaily(['customer'=>$id,'date'=>'2026-10-16','dinnerQty'=>1]);
$p=$w->preview($id);check(!$p['issues'],json_encode($p['issues']));check($p['balancePaise']===19500,'Opening includes unused advance and only unbilled meals');
denied(fn()=>$w->activate($id,'stale','admin'),409);
$w->activate($id,$p['fingerprint'],'admin');check($w->account($id)['balancePaise']===19500,'Opening');
$w->activate($id,$p['fingerprint'],'admin');check(count($s->all('wallettransactions'))===1,'Repeated activation');
$billing->saveDaily($daily);check(count($s->all('wallettransactions'))===1,'Identical entry no debit');
$s->data['tiffins'][$id]['pricing']['lunchPrice']=200;
$billing->saveDaily([...$daily,'lunchQty'=>3]);check($w->account($id)['balancePaise']===9500,'Edit uses frozen rate');
$bill=$billing->generate(['customer'=>$id,'month'=>10,'year'=>2026,'cycle'=>'1'])[1]['data'];check($bill['totalAmount']===315.0,'Invoice matches ledger snapshot');
check($w->account($id)['balancePaise']===9500,'Bill regeneration no debit');
$billing->saveDaily(['customer'=>$id,'date'=>'2026-10-01']);check($w->account($id)['balancePaise']===41000,'Clear reverses entire charge');
$billing->saveDaily($daily);check($w->account($id)['balancePaise']===19500,'Restore uses frozen rate');
$payment=$billing->addPayment(['customer'=>$id,'bill'=>$bill['_id'],'amount'=>100])[1];check($w->account($id)['balancePaise']===29500,'Approved payment credit');
$w->payment($payment);check($w->account($id)['balancePaise']===29500,'Same payment identity no duplicate');
$w->payment([...$payment,'_id'=>'507f1f77bcf86cd799439099','status'=>'Pending']);check($w->account($id)['balancePaise']===29500,'Pending no credit');
$adjust=['amount'=>-400,'reason'=>'Synthetic reconciliation correction','requestId'=>'synthetic-request-1234'];$w->adjust($id,$adjust,'admin');$w->adjust($id,$adjust,'admin');check($w->account($id)['balancePaise']===-10500,'Reasoned adjustment and negative balance');
denied(fn()=>$w->adjust($id,[...$adjust,'amount'=>1],'admin'),409);denied(fn()=>$w->adjust($id,[...$adjust,'reason'=>''],'admin'),400);
$before=$s->data;denied(fn()=>$billing->saveDaily([...$daily,'lunchQty'=>-1]),400);check($s->data===$before,'Invalid mutation rolled back');
$other='507f1f77bcf86cd799439022';$s->put('tiffins',['_id'=>$other,'advanceBalance'=>0],true);check($w->view($other)[1]['data']===['active'=>false],'Separate customer');
$s->put('dailyentries',['customer'=>$other,'date'=>'2026-10-01','lunchQty'=>1],true);$s->put('dailyentries',['customer'=>$other,'date'=>'2026-10-01','lunchQty'=>1],true);$p=$w->preview($other);check(count($p['issues'])>0,'Ambiguous history flagged');denied(fn()=>$w->activate($other,$p['fingerprint'],'admin'),409);
$history=$w->view($id)[1]['data']['history'];check(!isset($history[0]['actor']),'Customer does not see admin identity');
$fresh=(new OMT\Customers($s))->save(['customerName'=>'New synthetic','phone'=>'9999999999','address'=>'Synthetic only'])[1]['data'];check($w->account($fresh['_id'])['balancePaise']===0,'New customer automatically starts at zero');
$billing->saveDaily(['customer'=>$fresh['_id'],'date'=>'2026-10-15','lunchQty'=>1]);check($w->account($fresh['_id'])['balancePaise']===-9000,'First meal debits new wallet');
$freshBill=$billing->generate(['customer'=>$fresh['_id'],'month'=>10,'year'=>2026,'cycle'=>'1'])[1]['data'];
(new OMT\Customers($s))->markPaid($freshBill['_id']);check($w->account($fresh['_id'])['balancePaise']===0,'Mark paid uses real payment path');
$count=count($s->all('payments'));(new OMT\Customers($s))->markPaid($freshBill['_id']);check(count($s->all('payments'))===$count,'Repeated mark paid does not credit again');
$p=$w->preview($id);$entry=$s->first('dailyentries',fn($e)=>$e['customer']===$id&&substr($e['date'],0,10)==='2026-10-01');$entry['extraItems']=[];$s->put('dailyentries',$entry);check(count($w->preview($id)['issues'])>0,'Historic extras discrepancy cannot be relabeled as a fee');
echo "PASS wallet: opening reconciliation, frozen pricing, edit/clear/restore, invoice consistency, approved/pending/duplicate payment, reasoned idempotent adjustment, negative balance, rollback, historic discrepancy gate. Synthetic only.\n";
