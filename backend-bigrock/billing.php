<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/wallet.php';
require_once __DIR__.'/payment-evidence.php';
function dayKey(mixed $value):string {
    $text=(string)$value;
    if(!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D',$text,$m)||!checkdate((int)$m[2],(int)$m[3],(int)$m[1]))throw new HttpError(400,'Use a valid YYYY-MM-DD date.');
    return $text;
}
function numeric(mixed $value):float {if($value===null||$value==='')return 0;if(!is_numeric($value)||!is_finite((float)$value))throw new HttpError(400,'Invalid numeric value');return (float)$value;}
final class Billing {
    private ReadModels $read;
    public function __construct(private readonly Store $store){$this->read=new ReadModels($store);}
    public function saveDaily(array $body):array {
        if(empty($body['customer'])||empty($body['date']))throw new HttpError(400,'Customer and date are required.');
        $customer=(string)$body['customer'];$day=dayKey(substr((string)$body['date'],0,10));
        return $this->store->transaction(function()use($body,$customer,$day){
            $person=$this->store->get('tiffins',$customer);if(!$person)throw new HttpError(404,'Customer not found');
            if(($body['deliveryCheck']??false)===true){
                $records=$this->store->find('mealdeliveries',fn($d)=>$d['customer']===$customer&&$d['date']===$day);$missing=[];
                foreach(['Lunch','Dinner']as $meal)if(numeric($body[strtolower($meal).'Qty']??0)>0&&!array_filter($records,fn($d)=>$d['meal']===$meal&&$d['status']==='Delivered'))$missing[]=$meal;
                if($missing&&($body['confirmUndelivered']??false)!==true)throw new HttpError(409,implode(' / ',$missing).' tiffin has not been marked Delivered. Verify before saving.',['code'=>'DELIVERY_NOT_CONFIRMED','missingMeals'=>$missing]);
            }
            foreach($this->store->find('bills',fn($b)=>$b['customer']===$customer&&($b['status']??'')==='Cancelled')as $closed){
                $snapshot=$closed['walletStatement']??null;
                if($snapshot&&$day>=$snapshot['startDay']&&$day<$snapshot['endDay'])throw new HttpError(409,'This service period belongs to a cancelled invoice. Retain its financial audit history.');
            }
            $entries=sorted($this->store->find('dailyentries',fn($d)=>$d['customer']===$customer&&substr($d['date'],0,10)===$day),['createdAt'=>1]);
            if(count($entries)>1&&(new Wallet($this->store))->account($customer))throw new HttpError(409,'Duplicate daily entries need reconciliation before editing');
            $doc=$entries[0]??['customer'=>$customer];$insert=!$entries;$doc['date']=$day.'T00:00:00.000Z';
            foreach(['breakfastQty','lunchQty','dinnerQty']as $key)$doc[$key]=numeric($body[$key]??0);
            $doc['extraItems']=[];
            foreach(is_array($body['extraItems']??null)?$body['extraItems']:[]as $item){$description=trim((string)($item['description']??''));if($description==='')throw new HttpError(400,'Extra item description is required');$doc['extraItems'][]=['_id'=>$item['_id']??bin2hex(random_bytes(12)),'description'=>$description,'amount'=>money($item['amount']??null)];}
            $doc['remark']=(string)($body['remark']??'');$doc=$this->store->put('dailyentries',$doc,$insert);
            $updated=(new Wallet($this->store))->entry($doc,$person,$entries[0]??null);if(isset($updated['walletBasis']))$doc=$this->store->put('dailyentries',$updated);
            // Preserve the established save workflow: the oldest daily entry remains the identity.
            foreach(array_slice($entries,1)as $duplicate)$this->store->delete('dailyentries',$duplicate['_id']);
            return success($doc,'Daily Entry Saved Successfully');
        });
    }
    public function generate(array $body):array {
        if(empty($body['customer']))throw new HttpError(400,'Customer, month, year and billing cycle are required.');
        $period=$this->read->period($body);$customer=(string)$body['customer'];
        return $this->store->transaction(function()use($body,$period,$customer){
            $person=$this->store->get('tiffins',$customer);if(!$person)throw new HttpError(404,'Customer not found.');
            $price=sorted($this->store->all('prices'),['createdAt'=>-1])[0]??null;if(!$price)throw new HttpError(404,'Price settings not found');
            $custom=($person['pricing']['pricingType']??'default')==='custom';$rates=[];
            foreach(['breakfast','lunch','dinner']as $meal)$rates[$meal]=numeric($custom?($person['pricing'][$meal.'Price']??0):($price[$meal]??0));
            $extra=numeric($person['pricing']['extraCharge']??0);$reason=$person['pricing']['extraReason']??'';
            $entries=sorted($this->store->find('dailyentries',fn($d)=>$d['customer']===$customer&&$d['date']>=$period['startDate']&&$d['date']<$period['endDate']),['date'=>1]);
            $details=[];$quantities=['breakfast'=>0,'lunch'=>0,'dinner'=>0];$extraTotal=0;
            foreach($entries as $entry){
                $items=is_array($entry['extraItems']??null)?$entry['extraItems']:[];$hasExtras=(bool)array_filter($items,fn($i)=>numeric($i['amount']??0)>0);
                if(numeric($entry['breakfastQty']??0)<=0&&numeric($entry['lunchQty']??0)<=0&&numeric($entry['dinnerQty']??0)<=0&&!$hasExtras)continue;
                $d=['date'=>$entry['date']];$dayTotal=0;
                foreach($rates as $meal=>$rate){$qty=numeric($entry[$meal.'Qty']??0);$quantities[$meal]+=$qty;$d[$meal.'Qty']=$qty;$d[$meal.'Amount']=$qty*$rate;$dayTotal+=$qty*$rate;}
                $d['extraItems']=array_map(fn($i)=>['description'=>$i['description']??'','amount'=>numeric($i['amount']??0)],$items);
                $dayExtra=array_sum(array_column($d['extraItems'],'amount'));
                if($extra>0)$d['extraItems'][]=['description'=>$reason?:'Extra Charge','amount'=>$extra];
                $d['extraAmount']=$dayExtra+$extra;$d['dailyTotal']=$dayTotal+$dayExtra+$extra;$d['remark']=$entry['remark']??'';
                if(isset($entry['walletBasis'])){
                    $snapshot=$entry['walletBasis']['rates'];$mealSum=0;
                    foreach(['breakfast','lunch','dinner']as $meal){$d[$meal.'Amount']=round(numeric($entry[$meal.'Qty']??0)*$snapshot[$meal])/100;$mealSum+=$d[$meal.'Amount'];}
                    $d['extraItems']=array_map(fn($i)=>['description'=>$i['description']??'','amount'=>numeric($i['amount']??0)],$items);
                    if($snapshot['extra']>0)$d['extraItems'][]=['description'=>$snapshot['extraReason']?:'Extra Charge','amount'=>$snapshot['extra']/100];
                    $d['dailyTotal']=$entry['walletBasis']['chargePaise']/100;$d['extraAmount']=$d['dailyTotal']-$mealSum;$dayExtra=$d['extraAmount']-$extra;
                }
                $details[]=$d;$extraTotal+=$dayExtra+$extra;
            }
            $amounts=[];foreach($quantities as $meal=>$quantity)$amounts[$meal]=array_sum(array_column($details,$meal.'Amount'));$current=array_sum($amounts)+$extraTotal;
            if($current==0)throw new HttpError(400,'No meals found for selected billing cycle.');
            $bill=$this->store->first('bills',fn($b)=>$b['customer']===$customer&&(int)$b['month']===$period['month']&&(int)$b['year']===$period['year']&&(string)$b['cycle']===$period['cycle']);$insert=$bill===null;
            if(($bill['status']??'')==='Cancelled')throw new HttpError(409,'This invoice was cancelled. Its audit history must be retained.');
            $prevMonth=$period['month'];$prevYear=$period['year'];$prevCycle='1';
            if($period['cycle']==='1'){$prevCycle='2';$prevMonth--;if($prevMonth===0){$prevMonth=12;$prevYear--;}}
            $previous=$this->store->first('bills',fn($b)=>$b['customer']===$customer&&(int)$b['month']===$prevMonth&&(int)$b['year']===$prevYear&&(string)$b['cycle']===$prevCycle&&($b['carriedForward']??false)!==true);
            $carry=$insert&&$previous?max(0,numeric($previous['pendingAmount']??0)):numeric($bill['previousPendingAmount']??0);
            $previousId=$insert&&$carry>0?($previous['_id']??null):($bill['previousPendingBill']??null);
            if($insert){
                $prefix=sprintf('OMTS-%04d%02d-',$period['year'],$period['month']);$last=0;
                foreach($this->store->all('bills')as $b)if(str_starts_with($b['invoiceNo']??'',$prefix))$last=max($last,(int)substr($b['invoiceNo'],strlen($prefix)));
                $bill=['_id'=>bin2hex(random_bytes(12)),'__v'=>0,'invoiceNo'=>$prefix.str_pad((string)($last+1),4,'0',STR_PAD_LEFT),'customer'=>$customer,'month'=>$period['month'],'year'=>$period['year'],'cycle'=>$period['cycle'],'previousPendingAmount'=>$carry,'previousPendingBill'=>$previousId,'paidAmount'=>0];
                $bill['generatedAt']=gmdate(DATE_ATOM);
            }
            // The first finalization time is immutable across regeneration and later payments.
            $bill['generatedAt']??=$bill['createdAt']??gmdate(DATE_ATOM);
            foreach($quantities as $meal=>$qty){$bill[$meal.'Qty']=$qty;$bill[$meal.'Amount']=$amounts[$meal];}
            $bill['extraAmount']=$extraTotal;$bill['dailyDetails']=$details;$bill['totalAmount']=$current+numeric($bill['previousPendingAmount']??0);
            if(numeric($bill['paidAmount']??0)>$bill['totalAmount']){
                $released=Wallet::paise($bill['paidAmount'])-Wallet::paise($bill['totalAmount']);
                $bill['allocationReversals'][]=['amountPaise'=>$released,'reason'=>'Invoice amount reduced','createdAt'=>gmdate(DATE_ATOM)];
                $walletRelease=min($released,(int)($bill['walletAppliedPaise']??0));
                $bill['walletAppliedPaise']=(int)($bill['walletAppliedPaise']??0)-$walletRelease;
                $bill['directPaymentsAppliedPaise']=max(0,(int)($bill['directPaymentsAppliedPaise']??0)-($released-$walletRelease));
                $bill['paidAmount']=$bill['totalAmount'];
                if(!(new Wallet($this->store))->account($customer)){
                    $person['advanceBalance']=numeric($person['advanceBalance']??0)+$released/100;
                    $this->store->put('tiffins',$person);
                }
            }
            $advance=numeric($person['advanceBalance']??0);$remaining=$bill['totalAmount']-numeric($bill['paidAmount']??0);
            if(!(new Wallet($this->store))->account($customer)&&$advance>0&&$remaining>0){$used=min($advance,$remaining);$person['advanceBalance']=$advance-$used;$bill['paidAmount']=numeric($bill['paidAmount']??0)+$used;$bill['walletAppliedPaise']=(int)($bill['walletAppliedPaise']??0)+Wallet::paise($used);$this->store->put('tiffins',$person);}
            $bill['pendingAmount']=max(0,$bill['totalAmount']-numeric($bill['paidAmount']??0));$bill['status']=$bill['pendingAmount']<=0?'Paid':(numeric($bill['paidAmount']??0)>0?'Partial':'Pending');
            $account=(new Wallet($this->store))->account($customer);
            if($account)$bill['walletStatement']=['sequence'=>$account['sequence'],'startDay'=>substr($period['startDate'],0,10),'endDay'=>substr($period['endDate'],0,10),'generatedAt'=>gmdate('c')];
            $bill=$this->read->hydrate('bills',$bill);$bill=$this->store->put('bills',$bill,$insert);
            if($insert&&$previous&&$carry>0&&$previous['_id']!==$bill['_id']){$previous['carriedForward']=true;$previous['carriedForwardTo']=$bill['_id'];$this->store->put('bills',$previous);}
            (new Wallet($this->store))->settleBills($customer);
            $bill=$this->store->get('bills',$bill['_id']);
            return success($this->read->populate($bill,'customer','tiffins'));
        });
    }
    public function addPayment(array $body,string $actor=''):array {
        return $this->store->transaction(function()use($body,$actor){
            $customer=(string)($body['customer']??'');$billId=(string)($body['bill']??'');
            $person=$this->store->get('tiffins',$customer);$bill=$this->store->get('bills',$billId);
            if(!$person)throw new HttpError(404,'Customer not found');if(!$bill)throw new HttpError(404,'Bill not found');
            if($bill['customer']!==$customer)throw new HttpError(400,'Bill does not belong to this customer');
            if(($bill['status']??'')==='Cancelled')throw new HttpError(409,'Cannot collect payment for a cancelled invoice');
            if(($bill['carriedForward']??false)===true)throw new HttpError(409,'This invoice was carried forward. Record payment against the current invoice.');
            $amount=money($body['amount']??null);$amountPaise=Wallet::paise($amount);if($amountPaise<=0||abs($amount*100-$amountPaise)>0.000001)throw new HttpError(400,'Enter a payment amount with at most two decimal places.');$amount=$amountPaise/100.0;
            $method=$body['paymentMethod']??'Cash';if(!in_array($method,['Cash','UPI','Bank'],true))throw new HttpError(400,'Invalid payment method');
            $key=(string)($body['requestId']??'');
            if($key!==''&&!preg_match('/^[a-z0-9-]{16,100}$/iD',$key))throw new HttpError(400,'Invalid payment request ID');
            if($key!==''&&($old=$this->store->first('payments',fn($p)=>($p['requestId']??null)===$key))){
                if($old['customer']!==$customer||$old['bill']!==$billId||Wallet::paise($old['amount'])!==Wallet::paise($amount)||$old['paymentMethod']!==$method)throw new HttpError(409,'Payment request already used with different details');
                return [201,$old];
            }
            $reference=PaymentEvidence::reference($body['reference']??'');$proof=(string)($body['proofSha256']??'');
            PaymentEvidence::assertUnused($this->store,$reference,$proof);
            $applied=min(Wallet::paise($amount),Wallet::paise($bill['pendingAmount']??0));
            $excess=Wallet::paise($amount)-$applied;
            $payment=$this->store->put('payments',['__v'=>0,'customer'=>$customer,'bill'=>$billId,'amount'=>$amount,'amountAppliedPaise'=>$applied,'excessWalletCreditPaise'=>$excess,'requestId'=>$key?:null,'approvedBy'=>$actor,'approvedAt'=>gmdate(DATE_ATOM),'paymentMethod'=>$method,'note'=>(string)($body['remark']??''),'transactionId'=>$reference,'proofSha256'=>$proof,'gateway'=>'','paymentDate'=>gmdate('Y-m-d\TH:i:s.000\Z'),'status'=>'Success'],true);
            $paid=Wallet::paise($bill['paidAmount']??0)+$applied;if(!(new Wallet($this->store))->account($customer))$person['advanceBalance']=(Wallet::paise($person['advanceBalance']??0)+$excess)/100.0;
            $bill['directPaymentsAppliedPaise']=(int)($bill['directPaymentsAppliedPaise']??0)+$applied;
            $bill['paidAmount']=min($paid,Wallet::paise($bill['totalAmount']))/100.0;$bill['pendingAmount']=max(0,(Wallet::paise($bill['totalAmount'])-$paid)/100.0);$bill['status']=$bill['pendingAmount']<=0?'Paid':($bill['paidAmount']>0?'Partial':'Pending');
            $this->store->put('tiffins',$person);$this->store->put('bills',$bill);
            (new Wallet($this->store))->payment($payment);
            (new Wallet($this->store))->settleBills($customer,$actor);
            $key='receipt-auto:'.$payment['_id'];
            if(!empty($person['phone'])){
                $this->store->queue($key,['kind'=>'receipt-auto','documentType'=>'receipt','documentId'=>$payment['_id']]);
                $payment['whatsappDelivery']=['messageId'=>null,'status'=>'pending','eventKey'=>$key,'reason'=>'Receipt queued automatically after payment approval'];
            }else $payment['whatsappDelivery']=['status'=>'failed','reason'=>'Customer phone number not found.'];
            $payment=$this->store->put('payments',$payment);
            return [201,$payment];
        });
    }
    public function reversePayment(string $id,array $body,string $actor):array {
        $reason=trim((string)($body['reason']??''));if(strlen($reason)<5||strlen($reason)>500)throw new HttpError(400,'Enter a reversal reason of 5–500 characters');
        return $this->store->transaction(function()use($id,$reason,$actor){
            $payment=$this->store->get('payments',$id)??throw new HttpError(404,'Payment not found');
            if(($payment['status']??'')==='Reversed')return [200,$payment];
            if(($payment['status']??'')!=='Success'||!isset($payment['amountAppliedPaise']))throw new HttpError(409,'This historical payment needs reconciliation before reversal');
            $bill=$this->store->get('bills',$payment['bill'])??throw new HttpError(409,'Invoice reconciliation required');
            if(($bill['status']??'')==='Cancelled'||($bill['carriedForward']??false)||!empty($bill['allocationReversals']))throw new HttpError(409,'Invoice was changed, cancelled or carried. Reconcile its allocations before reversal');
            $wallet=new Wallet($this->store);$wallet->reversePayment($payment,$reason,$actor);
            if(!$wallet->account($payment['customer'])){
                $person=$this->store->get('tiffins',$payment['customer']);$excess=(int)($payment['excessWalletCreditPaise']??0);
                if(Wallet::paise($person['advanceBalance']??0)<$excess)throw new HttpError(409,'Excess advance has already been used; reconcile before reversal');
                $person['advanceBalance']=(Wallet::paise($person['advanceBalance']??0)-$excess)/100;$this->store->put('tiffins',$person);
            }
            $applied=(int)$payment['amountAppliedPaise'];
            $bill['directPaymentsAppliedPaise']=max(0,(int)($bill['directPaymentsAppliedPaise']??0)-$applied);
            $bill['paidAmount']=max(0,Wallet::paise($bill['paidAmount'])-$applied)/100;
            $bill['pendingAmount']=max(0,Wallet::paise($bill['totalAmount'])-Wallet::paise($bill['paidAmount']))/100;
            $bill['status']=$bill['paidAmount']>0?'Partial':'Pending';$this->store->put('bills',$bill);
            $payment['status']='Reversed';$payment['reversal']=['reason'=>$reason,'approvedBy'=>$actor,'reversedAt'=>gmdate(DATE_ATOM)];
            return [200,$this->store->put('payments',$payment)];
        });
    }
    public function cancel(string $id,array $body,string $actor):array {
        $reason=trim((string)($body['reason']??''));if(strlen($reason)<5||strlen($reason)>500)throw new HttpError(400,'Enter a cancellation reason of 5–500 characters');
        return $this->store->transaction(function()use($id,$reason,$actor){
            $bill=$this->store->get('bills',$id)??throw new HttpError(404,'Invoice not found');
            if(($bill['status']??'')==='Cancelled')return success($bill);
            if(!isset($bill['generatedAt'])||($bill['previousPendingAmount']??0)>0||($bill['carriedForward']??false))throw new HttpError(409,'This historical or carried invoice needs reconciliation before cancellation');
            (new Wallet($this->store))->reverseInvoice($bill,$reason,$actor);
            $bill['cancellation']=['reason'=>$reason,'approvedBy'=>$actor,'cancelledAt'=>gmdate(DATE_ATOM),'previousOutstanding'=>$bill['pendingAmount']];
            $bill['status']='Cancelled';$bill['pendingAmount']=0;
            $bill=$this->store->put('bills',$bill);return success($bill);
        });
    }
    public function approveWhatsApp(array $body,string $actor=''):array {
        if(empty($body['whatsappMessageId']))throw new HttpError(400,'WhatsApp message ID is required.');
        return $this->store->transaction(function()use($body,$actor){
            $message=$this->store->get('whatsappmessages',(string)$body['whatsappMessageId']);if(!$message)throw new HttpError(404,'WhatsApp payment message not found.');
            if(($message['paymentStatus']??null)==='payment_received')throw new HttpError(400,'This WhatsApp payment has already been approved.');
            $customer=(string)($body['customerId']??'');$billId=(string)($body['billId']??'');$bill=$this->store->get('bills',$billId);if(!$bill)throw new HttpError(404,'Bill not found.');
            $amount=money($body['amount']??null);if($amount<=0)throw new HttpError(400,'Valid payment amount is required.');
            if(!empty($message['customer'])&&$message['customer']!==$customer)throw new HttpError(400,'WhatsApp payment belongs to another customer.');
            $payment=$this->addPayment(['customer'=>$customer,'bill'=>$billId,'amount'=>$amount,'requestId'=>'whatsapp-'.$message['_id'],'reference'=>$body['reference']??'','proofSha256'=>$body['proofSha256']??'','paymentMethod'=>$body['paymentMethod']??'UPI','remark'=>$body['remark']??'WhatsApp payment screenshot approved'],$actor)[1];
            $message=array_replace($message,['paymentStatus'=>'payment_received','linkedPayment'=>$payment['_id'],'linkedBill'=>$billId,'inboxStatus'=>'read','note'=>'Payment approved by admin.']);$message=$this->store->put('whatsappmessages',$message);$person=$this->store->get('tiffins',$customer);
            return [200,['success'=>true,'message'=>'WhatsApp payment approved successfully.','data'=>['payment'=>$payment,'bill'=>$this->store->get('bills',$billId),'whatsappMessage'=>$this->read->hydrate('whatsappmessages',$message)]]];
        });
    }
}
