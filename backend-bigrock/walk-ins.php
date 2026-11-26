<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/payment-evidence.php';

final class WalkIns {
    public function __construct(private readonly Store $store){}
    public static function payments(array $row):array {
        return $row['payments']??(isset($row['payment'])?[$row['payment']]:[]);
    }
    public static function orders(array $row):array {
        $orders=$row['unpaidOrders']??[];
        foreach(self::payments($row)as $index=>$payment){
            if(!empty($payment['unpaidOrderId'])||empty($payment['approvedBy'])||empty($payment['paymentDate']))continue;
            $first=isset($payment['paidAfterPaise'])?$payment['paidAfterPaise']===Wallet::paise($payment['amount']):$index===0;
            if($first)$orders[]=['id'=>$payment['receiptNo']??'','generatedAt'=>$payment['invoiceGeneratedAt']??$payment['paymentDate'],'totalPaise'=>$payment['orderTotalPaise']??Wallet::paise($payment['amount'])];
        }
        return $orders;
    }
    public function listing():array {
        $rows=$this->store->all('walkincustomers');
        $deliveries=sorted($this->store->all('reviewinvitationdeliveries'),['createdAt'=>-1]);
        foreach($rows as &$row){
            $row['reviewStatus']='Not sent';
            foreach($deliveries as $delivery){
                if(($delivery['customer']??null)!==$row['_id'])continue;
                $row['reviewStatus']=$delivery['whatsappStatus']??'pending';
                break;
            }
            $invite=$this->store->first('reviewinvitations',fn($item)=>($item['customer']??null)===$row['_id']);
            $row['reviewSubmitted']=!empty($invite['submittedAt']);
        }
        unset($row);
        return success(sorted($rows,['createdAt'=>-1]));
    }
    public function add(array $body,string $actor):array {
        $name=trim(preg_replace('/\s+/u',' ',(string)($body['name']??''))??'');
        $phone=preg_replace('/\D/','',(string)($body['phone']??''));
        if(strlen($phone)===12&&str_starts_with($phone,'91'))$phone=substr($phone,2);
        if($name===''||strlen($name)>240||!preg_match('/^[6-9]\d{9}$/D',$phone))throw new HttpError(400,'Enter a name and valid Indian mobile number');
        return $this->store->transaction(function()use($name,$phone,$actor){
            $this->store->prepareWalkInCollection();
            $existing=$this->store->first('walkincustomers',fn($row)=>($row['phone']??null)===$phone);
            if($existing)return success($existing);
            return success($this->store->put('walkincustomers',['customerName'=>$name,'phone'=>$phone,'createdBy'=>$actor],true),null,201);
        });
    }
    public function approve(string $id,array $body,string $actor):array {
        $amount=$body['amount']??'';
        $method=$body['method']??'';
        $reference=PaymentEvidence::reference($body['reference']??'');
        $pending=($body['type']??'')==='Pending';
        if(!is_scalar($amount)||!preg_match('/^\d{1,6}(?:\.\d{1,2})?$/D',(string)$amount)||($pending?(float)$amount!==0.0:(float)$amount<=0)
            ||!in_array($method,['Cash','UPI','Bank Transfer'],true)||strlen($reference)>160)throw new HttpError(400,'Enter a valid amount and payment method. Reference is optional and must be at most 160 characters.');
        $rawTotal=$body['total']??$amount;
        if(!is_scalar($rawTotal)||!preg_match('/^\d{1,6}(?:\.\d{1,2})?$/D',(string)$rawTotal)||Wallet::paise($rawTotal)<=0)throw new HttpError(400,'Enter a positive order total with at most two decimal places');
        $total=Wallet::paise($rawTotal);
        $received=Wallet::paise($amount);
        $type=$body['type']??'Full';
        $key=$body['requestId']??'';
        if(!in_array($type,['Advance','Partial','Full','Pending'],true)||!is_string($key)||!preg_match('/^[a-f0-9-]{36}$/iD',$key))throw new HttpError(400,'Invalid payment type or request ID');
        $newOrder=($body['newOrder']??false)===true;
        return $this->store->transaction(function()use($id,$received,$total,$type,$key,$method,$reference,$actor,$newOrder){
            $row=$this->store->get('walkincustomers',$id)??throw new HttpError(404,'Walk-in entry not found');
            $payments=self::payments($row);
            foreach($row['unpaidOrders']??[]as $order)if(($order['id']??'')===$key){
                if($received!==0||$type!=='Pending'||$order['totalPaise']!==$total)throw new HttpError(409,'This request was already used for a different order');
                return success($row);
            }
            foreach($payments as $payment)if(($payment['requestId']??null)===$key){
                if(Wallet::paise($payment['amount'])!==$received||($payment['paymentMethod']??'')!==$method||($payment['orderTotalPaise']??$total)!==$total||($payment['reference']??'')!==$reference)throw new HttpError(409,'This request ID was already used with different payment details');
                return success($row);
            }
            PaymentEvidence::assertUnused($this->store,$reference);
            $startingAt=(int)($row['orderPaymentStart']??0);
            $paid=array_sum(array_map(fn($payment)=>Wallet::paise($payment['amount']),array_slice($payments,$startingAt)));
            if($newOrder){
                if($paid!==($row['totalPaise']??$paid))throw new HttpError(409,'Settle the current order before starting another.');
                $row['orderPaymentStart']=count($payments);
                unset($row['totalPaise']);
                unset($row['currentUnpaidOrderId'],$row['currentOrderGeneratedAt']);
                $paid=0;
            }
            if($type==='Pending'){
                if(isset($row['totalPaise'])||$paid>0||$reference!=='')throw new HttpError(400,'Use Pending only for a new unpaid order, without a payment reference');
                $at=gmdate(DATE_ATOM);$row['totalPaise']=$total;$row['currentUnpaidOrderId']=$key;$row['currentOrderGeneratedAt']=$at;
                $row['unpaidOrders'][]=['id'=>$key,'generatedAt'=>$at,'totalPaise'=>$total,'createdBy'=>$actor];
                return success($this->store->put('walkincustomers',$row),'Order saved as pending. No payment or receipt was created.');
            }
            $due=$total-$paid;
            if($received>$due)throw new HttpError(409,'Payment exceeds this walk-in order balance. No wallet is linked to this order. Record only the amount due and refund excess funds separately.');
            if((isset($row['totalPaise'])&&$row['totalPaise']!==$total)||(!isset($row['totalPaise'])&&$paid>0)||$received>$due||($type==='Full')!==($received===$due))throw new HttpError(400,'Check the total, outstanding amount and payment type');
            $row['totalPaise']=$total;
            $payments[]=['requestId'=>$key,'type'=>$type,'receiptNo'=>'WI-'.strtoupper($id).'-'.(count($payments)+1),'amount'=>$received/100,'paymentMethod'=>$method,
                'paymentDate'=>gmdate(DATE_ATOM),'reference'=>$reference,'approvedBy'=>$actor,'remainingPaise'=>$due-$received,'orderTotalPaise'=>$total,'paidAfterPaise'=>$paid+$received];
            if(!empty($row['currentUnpaidOrderId'])){$last=array_key_last($payments);$payments[$last]['unpaidOrderId']=$row['currentUnpaidOrderId'];$payments[$last]['invoiceGeneratedAt']=$row['currentOrderGeneratedAt'];}
            $row['payments']=$payments;
            $row=$this->store->put('walkincustomers',$row);
            return success($row);
        });
    }

    public function sendPayment(string $id, array $body): array {
        $format=$body['format']??null;
        $receipt=$body['receiptNo']??null;
        if (!in_array($format,['message','receipt'],true) || !is_string($receipt) || $receipt==='') {
            throw new HttpError(400,'Choose a payment and delivery format.');
        }
        return $this->store->transaction(function() use ($id,$format,$receipt) {
            $row=$this->store->get('walkincustomers',$id)??throw new HttpError(404,'Walk-in entry not found');
            foreach (self::payments($row) as $payment) {
                if (($payment['receiptNo']??null)!==$receipt) continue;
                $this->store->queue('walk-in-payment:'.$id.':'.$receipt.':'.$format,[
                    'kind'=>'walk-in-receipt','customerId'=>$id,'receiptNo'=>$receipt,'to'=>$row['phone'],
                    'textOnly'=>$format==='message','remainingPaise'=>$payment['remainingPaise']??null
                ]);
                return success(['format'=>$format]);
            }
            throw new HttpError(404,'Payment not found.');
        });
    }
}
