<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/customers.php';
final class Accounts {
    public function __construct(private readonly Store $store){}
    public function recipients():array {
        $customers=sorted($this->store->find('tiffins',fn($d)=>array_key_exists('barcode',$d)&&$d['barcode']!==''),['barcode'=>1]);$data=[];
        foreach($customers as $customer){$account=$this->store->first('customeraccounts',fn($a)=>($a['customer']??null)===$customer['_id']);$data[]=['customerId'=>$customer['_id'],'customerName'=>$customer['customerName']??'','phone'=>$customer['phone']??'','barcode'=>$customer['barcode']??'','userId'=>$account['userId']??$customer['barcode']??'','status'=>$customer['status']??'Active','accountExists'=>$account!==null,'loginEnabled'=>($account['loginEnabled']??false)===true,'isFirstLogin'=>($account['isFirstLogin']??false)===true,'ready'=>$account!==null&&!empty($account['userId'])&&!empty($customer['phone'])];}
        return [200,['success'=>true,'count'=>count($data),'readyCount'=>count(array_filter($data,fn($d)=>$d['ready'])),'data'=>$data]];
    }
    public function deliveryStatus():array {
        $seen=[];$data=[];foreach(sorted($this->store->all('customerloginiddeliveries'),['createdAt'=>-1])as $delivery){$id=$delivery['customer'];if(isset($seen[$id]))continue;$seen[$id]=true;$data[]=$delivery;}return success($data);
    }
    public function provision(array $body):array {
        if(empty($body['customerId']))throw new HttpError(400,'Customer ID is required');
        $result=(new Customers($this->store))->ensureAccount((string)$body['customerId']);
        return [$result['created']?201:200,['success'=>true,'created'=>$result['created'],'message'=>$result['created']?'Customer account created successfully':'Customer account already exists','account'=>safeAccount($result['account']),'temporaryPassword'=>$result['temporaryPassword']]];
    }
    public function enabled(string $customer,array $body):array {
        if(!is_bool($body['enabled']??null))throw new HttpError(400,'enabled must be true or false');
        return $this->store->transaction(function()use($customer,$body){$account=$this->store->first('customeraccounts',fn($a)=>($a['customer']??null)===$customer);if(!$account)throw new HttpError(404,'Customer account not found');$account['loginEnabled']=$body['enabled'];$account=$this->store->put('customeraccounts',$account);return [200,['success'=>true,'message'=>$body['enabled']?'Customer login enabled':'Customer login disabled','account'=>['id'=>$account['_id'],'customer'=>$account['customer'],'userId'=>$account['userId'],'loginEnabled'=>$account['loginEnabled'],'isFirstLogin'=>$account['isFirstLogin']]]];});
    }
    private function queueLogin(array $customer,array $account,string $key):void {
        $text='Your OM Tiffin Customer User ID: '.$account['userId'].'. This is your login detail. Please set up your customer account. Please click here to set up your account. Click on button to set up your account.';
        $this->store->queue($key,['kind'=>'login-id','customerId'=>$customer['_id'],'accountId'=>$account['_id'],'userId'=>$account['userId'],'customerName'=>$customer['customerName']??'Customer','to'=>$customer['phone'],'templateName'=>'om_tiffin_custom_announcement','languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>[['type'=>'text','text'=>$customer['customerName']??'Customer'],['type'=>'text','text'=>$text]]]]]);
    }
    public function regenerate(string $customerId):array {
        return $this->store->transaction(function()use($customerId){
            $account=$this->store->first('customeraccounts',fn($a)=>($a['customer']??null)===$customerId);if(!$account)throw new HttpError(404,'Customer account not found');
            $customer=$this->store->get('tiffins',$customerId);if(!$customer)throw new HttpError(404,'Customer not found');if(empty($customer['phone']))throw new HttpError(400,'Customer phone number is not available');
            $alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';$password='';for($i=0;$i<10;$i++)$password.=$alphabet[random_int(0,strlen($alphabet)-1)];
            $account=array_replace($account,['passwordHash'=>password_hash($password,PASSWORD_BCRYPT,['cost'=>12]),'isFirstLogin'=>true,'passwordChangedAt'=>null,'failedLoginAttempts'=>0,'lockedUntil'=>null]);$account=$this->store->put('customeraccounts',$account);
            $key='login-id:'.$account['_id'].':'.bin2hex(random_bytes(12));$this->queueLogin($customer,$account,$key);
            return [200,['success'=>true,'message'=>'Temporary password regenerated; customer setup notification queued.','account'=>['id'=>$account['_id'],'customer'=>$account['customer'],'userId'=>$account['userId'],'loginEnabled'=>$account['loginEnabled'],'isFirstLogin'=>true],'whatsapp'=>['sent'=>false,'queued'=>true,'eventKey'=>$key],'temporaryPassword'=>$password]];
        });
    }
    public function sendLoginIds(array $body):array {
        $ids=$body['customerIds']??[];$users=$body['userIds']??[];
        if((!is_array($ids)||!$ids)&&(!is_array($users)||!$users))throw new HttpError(400,'customerIds or userIds must contain at least one customer');
        if(!is_array($ids)||!is_array($users)||count($ids)+count($users)>1000)throw new HttpError(400,'Invalid customer selection');
        if(!$ids){$users=array_map(fn($v)=>strtoupper(trim((string)$v)),$users);$ids=array_column($this->store->find('customeraccounts',fn($a)=>in_array($a['userId']??null,$users,true)),'customer');}
        return $this->store->transaction(function()use($ids){$results=[];$batch=bin2hex(random_bytes(12));
            foreach($this->store->find('tiffins',fn($c)=>in_array($c['_id'],$ids,true))as $customer){
                $account=$this->store->first('customeraccounts',fn($a)=>($a['customer']??null)===$customer['_id']);$error=!$account?'Customer account not found':(empty($customer['phone'])?'Customer phone number is not available':null);
                $item=['customerId'=>$customer['_id'],'customerName'=>$customer['customerName'],'userId'=>$account['userId']??$customer['barcode']??'','success'=>$error===null,'status'=>$error?'failed':'queued'];
                if($error)$item['error']=$error;else{$item['eventKey']='login-id:'.$account['_id'].':'.$batch;$this->queueLogin($customer,$account,$item['eventKey']);}$results[]=$item;
            }
            $failed=count(array_filter($results,fn($r)=>$r['status']==='failed'));return [200,['success'=>true,'message'=>'Customer login ID notifications queued.','summary'=>['total'=>count($results),'sent'=>0,'queued'=>count($results)-$failed,'failed'=>$failed],'data'=>$results]];
        });
    }
}
