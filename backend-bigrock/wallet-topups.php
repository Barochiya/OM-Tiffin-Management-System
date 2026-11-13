<?php
declare(strict_types=1);
namespace OMT;

final class WalletTopUps {
    public function __construct(private readonly Store $store,private readonly Wallet $wallet,private readonly array $settings){}

    public function listing(?string $customer=null):array {
        $rows=$this->store->find('wallettopups',fn($row)=>$customer===null||$row['customer']===$customer);
        if($customer===null){
            $messages=sorted($this->store->find('whatsappmessages',fn($message)=>
                ($message['direction']??null)==='incoming'&&($message['type']??null)==='image'
                &&!empty($message['mediaId'])),['whatsappTimestamp'=>-1]);
            foreach($rows as &$row){
                if($row['status']!=='pending')continue;
                $row['screenshots']=array_slice(array_values(array_filter($messages,fn($message)=>
                    ($message['customer']??null)===$row['customer']
                    &&strtotime($message['whatsappTimestamp']??'')>=strtotime($row['createdAt']))),0,10);
                $row['screenshots']=array_map(fn($message)=>array_intersect_key($message,array_flip(['_id','whatsappTimestamp','mediaCaption'])),$row['screenshots']);
            }
            unset($row);
        }
        return success(sorted($rows,['createdAt'=>-1]));
    }

    public function create(string $customer,array $body):array {
        $raw=$body['amount']??null;
        if(!is_scalar($raw)||!preg_match('/^\d{1,5}(?:\.\d{1,2})?$/D',(string)$raw))throw new HttpError(400,'Enter a valid top-up amount');
        $amount=Wallet::paise($raw);
        if($amount<100||$amount>5000000)throw new HttpError(400,'Enter an amount from ₹1 to ₹50,000');
        $key=$body['requestId']??'';
        if(!is_string($key)||!preg_match('/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/iD',$key))throw new HttpError(400,'Invalid request identity');
        return $this->store->transaction(function()use($customer,$amount,$key){
            $id=substr(hash('sha256','wallet-topup:'.$customer.':'.strtolower($key)),0,24);
            if($existing=$this->store->get('wallettopups',$id)){
                if($existing['amountPaise']!==$amount)throw new HttpError(409,'Request already exists with another amount');
                return success($existing);
            }
            $person=$this->store->get('tiffins',$customer);
            if(!$person||!$this->wallet->account($customer))throw new HttpError(409,'Wallet is awaiting activation');
            $upi=trim((string)((new Documents($this->store))->settings()[1]['data']['bill']['upiId']??''));
            if(!preg_match('/^[a-z0-9._-]+@[a-z0-9.-]+$/iD',$upi))throw new HttpError(503,'Set a valid Payment UPI ID in Bill Design');
            $qr='upi://pay?'.http_build_query(['pa'=>$upi,'pn'=>'OM Tiffin Service','am'=>number_format($amount/100,2,'.',''),'cu'=>'INR','tr'=>$id], '', '&', PHP_QUERY_RFC3986);
            $this->store->prepareWalletCollections();
            return success($this->store->put('wallettopups',['_id'=>$id,'customer'=>$customer,'name'=>$person['customerName']??'','userId'=>$person['barcode']??'','phone'=>$person['phone']??'','amountPaise'=>$amount,'upiUri'=>$qr,'status'=>'pending'],true));
        });
    }

    public function sendQr(string $customer,string $id):array {
        $template=$this->settings['WALLET_QR_TEMPLATE']??'';
        if($template!=='om_tiffin_wallet_topup_qr_image')throw new HttpError(503,'WhatsApp QR template is not enabled');
        if(empty($this->settings['migration']['workersEnabled'])||empty($this->settings['migration']['externalMessagesEnabled']))throw new HttpError(503,'WhatsApp delivery is unavailable');
        return $this->store->transaction(function()use($customer,$id,$template){
            $row=$this->store->get('wallettopups',$id);
            if(!$row||$row['customer']!==$customer)throw new HttpError(404,'Top-up request not found');
            if($row['status']!=='pending')throw new HttpError(409,'Top-up request is closed');
            if(!in_array($row['whatsappStatus']??null,[null,'failed'],true))return success($row);
            $phone=self::phone($this->store->get('tiffins',$customer)['phone']??'');
            if(!preg_match('/^91[6-9]\d{9}$/D',$phone))throw new HttpError(400,'Registered WhatsApp number is invalid');
            $attempt=($row['whatsappAttempts']??0)+1;
            if($attempt>3)throw new HttpError(429,'WhatsApp retry limit reached');
            $row['whatsappAttempts']=$attempt;
            $row['whatsappStatus']='queued';
            $row['whatsappMessageId']=null;
            $row['whatsappFailureReason']='';
            $this->store->queue('wallet-qr:'.$id.':'.$attempt,['kind'=>'wallet-qr','requestId'=>$id,'to'=>$phone,'templateName'=>$template,'languageCode'=>'en_GB']);
            return success($this->store->put('wallettopups',$row));
        });
    }

    public static function phone(string $phone):string {
        $digits=preg_replace('/\D/','',$phone);
        return strlen($digits)===10?'91'.$digits:$digits;
    }

    public function decide(string $id,array $body,string $actor):array {
        $action=$body['action']??'';
        $detail=trim((string)($body['detail']??''));
        if(!in_array($action,['approved','rejected'],true)||strlen($detail)<3||strlen($detail)>200)throw new HttpError(400,'Enter a payment reference or rejection reason');
        return $this->store->transaction(function()use($id,$action,$detail,$actor){
            $row=$this->store->get('wallettopups',$id)??throw new HttpError(404,'Top-up request not found');
            if($row['status']!=='pending')throw new HttpError(409,'This request has already been reviewed');
            $row['status']=$action;
            $row['reviewedBy']=$actor;
            $row['reviewedAt']=gmdate(DATE_ATOM);
            if($action==='approved'){
                $reference=strtoupper($detail);
                if($this->store->first('wallettopups',fn($other)=>($other['reference']??null)===$reference))throw new HttpError(409,'Payment reference already used');
                $row['reference']=$reference;
                $this->wallet->creditTopUp($row,$actor);
            }else $row['rejectionReason']=$detail;
            return success($this->store->put('wallettopups',$row));
        });
    }
}
