<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/barcodes.php';
final class Customers {
    public function __construct(private readonly Store $store){}
    private function pricing(mixed $incoming):array {
        $incoming=is_array($incoming)?$incoming:[];
        if(empty($incoming['pricingType'])||$incoming['pricingType']==='default'){
            $price=sorted($this->store->all('prices'),['createdAt'=>-1])[0]??[];
            return ['pricingType'=>'default','breakfastPrice'=>(float)($price['breakfast']??40),'lunchPrice'=>(float)($price['lunch']??90),'dinnerPrice'=>(float)($price['dinner']??90),'extraCharge'=>0,'extraReason'=>'','discountType'=>'fixed','discount'=>0];
        }
        $result=['pricingType'=>'custom'];foreach(['breakfastPrice','lunchPrice','dinnerPrice','extraCharge','discount']as $key){$value=$incoming[$key]??0;if(!is_numeric($value)||!is_finite((float)$value))throw new HttpError(400,'Invalid customer pricing.');$result[$key]=(float)$value;}
        $result['extraReason']=(string)($incoming['extraReason']??'');$result['discountType']=$incoming['discountType']??'fixed';if(!in_array($result['discountType'],['fixed','percentage'],true))throw new HttpError(400,'Invalid discount type.');return $result;
    }
    public function ensureAccount(string $customerId):array {
        return $this->store->transaction(function()use($customerId){
            $customer=$this->store->get('tiffins',$customerId);if(!$customer)throw new HttpError(404,'Customer not found');
            if(empty($customer['barcode']))throw new HttpError(400,'Customer barcode is not available. Generate/verify the permanent barcode first.');
            $existing=$this->store->first('customeraccounts',fn($d)=>($d['customer']??null)===$customerId);if($existing)return ['created'=>false,'account'=>$existing,'temporaryPassword'=>null];
            if($this->store->first('customeraccounts',fn($d)=>($d['userId']??null)===$customer['barcode']))throw new HttpError(409,'This barcode is already linked to another customer account');
            $temporary=b64url(random_bytes(9));$hash=password_hash($temporary,PASSWORD_BCRYPT,['cost'=>12]);
            $account=$this->store->put('customeraccounts',['customer'=>$customerId,'userId'=>$customer['barcode'],'passwordHash'=>$hash,'loginEnabled'=>true,'isFirstLogin'=>true,'passwordChangedAt'=>null,'failedLoginAttempts'=>0,'lockedUntil'=>null,'lastLoginAt'=>null],true);
            return ['created'=>true,'account'=>$account,'temporaryPassword'=>$temporary];
        });
    }
    public function save(array $body,?string $id=null):array {
        $create=$id===null;
        if($create&&(empty($body['customerName'])||empty($body['phone'])||empty($body['address'])))throw new HttpError(400,'All fields are required');
        $updates=[];
        foreach(['customerName','address']as $key)if(array_key_exists($key,$body)){if(!is_scalar($body[$key])||(string)$body[$key]==='')throw new HttpError(400,'All fields are required');$updates[$key]=(string)$body[$key];}
        if(array_key_exists('phone',$body)){$raw=(string)$body['phone'];if($create&&!preg_match('/^\d{10}$/D',$raw))throw new HttpError(400,'Phone number must be exactly 10 digits');$phone=preg_replace('/\D/','',$raw);if(!preg_match('/^[6-9]\d{9}$/D',$phone))throw new HttpError(400,'Invalid mobile number');$updates['phone']=$phone;}
        foreach(['mealType'=>['Lunch','Dinner','Both'],'status'=>['Active','Inactive']]as $key=>$allowed)if(array_key_exists($key,$body)){if(!in_array($body[$key],$allowed,true))throw new HttpError(400,'Invalid '.$key);$updates[$key]=$body[$key];}
        $updates['pricing']=$this->pricing($body['pricing']??null);
        if(!$create&&array_key_exists('price',$body)){if(!is_numeric($body['price'])||!is_finite((float)$body['price']))throw new HttpError(400,'Invalid monthly price');$updates['price']=(float)$body['price'];}
        return $this->store->transaction(function()use($create,$id,$updates){
            $doc=$create?['mealType'=>'Lunch','status'=>'Active','price'=>0,'paymentStatus'=>'Pending','pendingAmount'=>0,'advanceBalance'=>0,'paymentDate'=>null,'paymentMonth'=>gmdate('F')]:$this->store->get('tiffins',$id);
            if(!$doc)throw new HttpError(404,'Customer not found');$doc=$this->store->put('tiffins',array_replace($doc,$updates),$create);
            if($create){(new Barcodes($this->store,true))->customer($doc['_id']);$doc=$this->store->get('tiffins',$doc['_id']);$wallet=new Wallet($this->store);$proposal=$wallet->preview($doc['_id']);$wallet->activate($doc['_id'],$proposal['fingerprint'],'customer-created');}
            $provision=['success'=>false,'created'=>false,'whatsappSent'=>false];
            try{
                $result=$this->ensureAccount($doc['_id']);$provision['created']=$result['created'];$provision['success']=true;
                if($create&&$result['created']){$account=$result['account'];$text='Your OM Tiffin Customer User ID: '.$account['userId'].'. Tap the button below to set up your account and create your password.';
                    $this->store->queue('login-id:'.$account['_id'].':initial',['kind'=>'login-id','customerId'=>$doc['_id'],'accountId'=>$account['_id'],'userId'=>$account['userId'],'customerName'=>$doc['customerName'],'to'=>$doc['phone'],'templateName'=>'om_tiffin_custom_announcement','languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>[['type'=>'text','text'=>$doc['customerName']],['type'=>'text','text'=>$text]]]]]);$provision['whatsappQueued']=true;
                }
            }catch(HttpError){/* Match legacy update: preserve customer when account reconciliation is unavailable. */}
            $response=['success'=>true,'data'=>(new ReadModels($this->store))->hydrate('tiffins',$doc)];if($create)$response['accountProvisioning']=$provision;return [$create?201:200,$response];
        });
    }
    public function remove(string $id):array{return $this->store->transaction(function()use($id){if(!$this->store->delete('tiffins',$id))throw new HttpError(404,'Customer not found');return [200,['success'=>true,'message'=>'Customer deleted successfully']];});}
    public function markPaid(string $billId):array {
        return $this->store->transaction(function()use($billId){$bill=$this->store->get('bills',$billId);if(!$bill)throw new HttpError(404,'Bill not found');
            if((new Wallet($this->store))->account($bill['customer'])){if(numeric($bill['pendingAmount']??0)>0)(new Billing($this->store))->addPayment(['customer'=>$bill['customer'],'bill'=>$billId,'amount'=>$bill['pendingAmount'],'paymentMethod'=>'Cash','remark'=>'Admin marked invoice paid']);return success((new ReadModels($this->store))->hydrate('bills',$this->store->get('bills',$billId)),'Payment marked as Paid');}
            $bill['paidAmount']=$bill['totalAmount'];$bill['pendingAmount']=0;$bill['status']='Paid';$bill=$this->store->put('bills',$bill);return success((new ReadModels($this->store))->hydrate('bills',$bill),'Payment marked as Paid');});
    }
}
