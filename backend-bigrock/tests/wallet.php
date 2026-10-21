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

// Statement regressions: synthetic store only, no production writes or messages.
$s=new WalletStore();$w=new OMT\Wallet($s);$billing=new OMT\Billing($s);
$person=$s->put('tiffins',['_id'=>$id,'customerName'=>'Statement Synthetic','barcode'=>'OMT-SYNTH','advanceBalance'=>0,'pricing'=>['pricingType'=>'custom','breakfastPrice'=>90,'lunchPrice'=>90,'dinnerPrice'=>90]]);
$s->put('prices',['breakfast'=>90,'lunch'=>90,'dinner'=>90]);
$p=$w->preview($id);$w->activate($id,$p['fingerprint'],'synthetic');
$body=['customer'=>$id,'date'=>'2026-10-01','dinnerQty'=>2];$billing->saveDaily($body);
for($i=0;$i<12;$i++)$billing->saveDaily($body);
check(count($s->all('dailyentries'))===1&&count($s->all('wallettransactions'))===2,'Repeated save has one record and debit');
$billing->saveDaily([...$body,'dinnerQty'=>1]);$st=$w->statement($id,['mode'=>'all'])[1]['data'];$meals=array_values(array_filter($st['history'],fn($t)=>$t['type']==='meal'));
check(count($meals)===1&&$meals[0]['modified']&&$meals[0]['amountPaise']===-9000&&$meals[0]['quantities']['dinner']===1.0,'2 to 1 replaces one displayed meal row');
$balance=$w->account($id)['balancePaise'];$count=count($s->all('wallettransactions'));
$billing->saveDaily([...$body,'dinnerQty'=>0,'lunchQty'=>1]);check($w->account($id)['balancePaise']===$balance&&count($s->all('wallettransactions'))===$count+1,'Same-price logical modification is audited');
$billing->saveDaily([...$body,'dinnerQty'=>0,'lunchQty'=>1]);check(count($s->all('wallettransactions'))===$count+1,'Repeated zero-delta edit is no-op');
$billing->saveDaily(['customer'=>$id,'date'=>'2026-10-01']);check($w->account($id)['balancePaise']===0,'Clear refunds charge');
$billing->saveDaily([...$body,'dinnerQty'=>1]);check($w->account($id)['balancePaise']===-9000,'Restore charges only restored amount');
$bill=$billing->generate(['customer'=>$id,'month'=>10,'year'=>2026,'cycle'=>'1'])[1]['data'];
check(!array_filter($w->statement($id)[1]['data']['history'],fn($t)=>$t['type']==='meal'),'Bill archives meal from default view');
$historic=$w->statement($id,['mode'=>'cycle','month'=>10,'year'=>2026,'cycle'=>'1'])[1]['data'];check(count(array_filter($historic['history'],fn($t)=>$t['type']==='meal'&&$t['archived']))===1,'Cycle retains billed row');
$billing->saveDaily([...$body,'dinnerQty'=>2]);check(count(array_filter($w->statement($id)[1]['data']['history'],fn($t)=>$t['type']==='meal'))===1,'Post-bill edit returns to current view');
for($i=2;$i<=31;$i++)$billing->saveDaily(['customer'=>$id,'date'=>'2026-10-'.str_pad((string)$i,2,'0',STR_PAD_LEFT),'lunchQty'=>1]);
$all=[];$query=['mode'=>'all'];do{$page=$w->statement($id,$query)[1]['data'];$all=array_merge($all,$page['history']);$query['before']=$page['nextBefore'];}while($query['before']);
check(count($all)===32&&count(array_unique(array_column($all,'_id')))===32,'Grouped pagination has every unique day exactly once');
$audit=$w->statement($id,['mode'=>'audit'])[1]['data'];check(count($audit['history'])===30,'Audit paginates immutable changes');
$sum=0;foreach(OMT\sorted($s->all('wallettransactions'),['sequence'=>1])as $event){$sum+=$event['amountPaise'];check($sum===$event['balancePaise'],'Immutable running balance');}check($sum===$w->account($id)['balancePaise'],'Filtered statements never change real balance');
$s->put('tiffins',['_id'=>$other,'customerName'=>'Other Synthetic','advanceBalance'=>0]);check(count($w->customers()[1]['data'])===2,'All customers listed');check(count($w->customers(['filter'=>'due'])[1]['data'])===1,'Outstanding filter');check(count($w->customers(['search'=>'OMT-SYNTH'])[1]['data'])===1,'Search barcode');
// Legacy opening basis entries remain readable without another debit; tied sequences paginate.
$legacy='507f1f77bcf86cd799439033';$s->put('tiffins',['_id'=>$legacy,'customerName'=>'Opening Synthetic','advanceBalance'=>0]);
for($i=1;$i<=31;$i++)$billing->saveDaily(['customer'=>$legacy,'date'=>'2026-08-'.str_pad((string)$i,2,'0',STR_PAD_LEFT),'lunchQty'=>1]);
$billing->generate(['customer'=>$legacy,'month'=>8,'year'=>2026,'cycle'=>'1']);$p=$w->preview($legacy);$w->activate($legacy,$p['fingerprint'],'synthetic');
$current=$w->statement($legacy)[1]['data'];check(count(array_filter($current['history'],fn($t)=>$t['type']==='meal'))===16,'Only legacy billed opening days archived');
$all=[];$query=['mode'=>'all'];do{$page=$w->statement($legacy,$query)[1]['data'];$all=array_merge($all,$page['history']);$query['before']=$page['nextBefore'];}while($query['before']);check(count($all)===32&&count(array_unique(array_column($all,'_id')))===32,'Opening history pagination loses no rows');
echo "PASS wallet statement: grouped edits, no-op saves, same-price audit, clear/restore, billing archive, post-bill edits, historical filters, grouped/tied pagination, legacy opening rows, list filters and ledger balance invariants. Synthetic only.\n";

$demoStore=new WalletStore();$customers=new OMT\Customers($demoStore);
$created=$customers->save(['customerName'=>'Synthetic dinner','phone'=>'9999999999','address'=>'Synthetic test only','mealType'=>'Dinner']);
$demo=$created[1]['data'];check($created[1]['accountProvisioning']['whatsappQueued']===true,'New customer automatically queues login');
check(count($demoStore->events)===1,'Only one initial message');$event=array_values($demoStore->events)[0];
check($event['to']==='9999999999'&&$event['customerId']===$demo['_id'],'Message targets created customer only');
check($event['templateName']==='om_tiffin_service_update','Approved service update template');
$customers->save(['customerName'=>'Synthetic edited'],$demo['_id']);check(count($demoStore->events)===1,'Editing never resends initial message');
check(!str_contains(json_encode($event),'passwordHash'),'No credential hash in notification');
