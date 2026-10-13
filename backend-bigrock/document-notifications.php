<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/documents.php';
require_once __DIR__.'/billing.php';
final class DocumentNotifications {
    public function __construct(private readonly Store $store,private readonly Documents $documents,private readonly ?string $uploads=null){}
    private function file(string $bytes):array {
        if(!str_starts_with($bytes,'%PDF-')||strlen($bytes)>10*1024*1024)throw new HttpError(400,'A valid PDF file up to 10 MB is required.');
        $directory=$this->uploads??(getenv('OMTIFFIN_UPLOADS')?:'/home1/maapn1f6/omtiffin-private/private/uploads');if(!is_dir($directory)&&!mkdir($directory,0700,true))throw new HttpError(503,'Private uploads are unavailable.');
        $hash=hash('sha256',$bytes);$path=$directory.'/'.$hash.'.pdf';
        if(!file_exists($path)){if(file_put_contents($path,$bytes,LOCK_EX)!==strlen($bytes))throw new HttpError(503,'Unable to save document.');chmod($path,0600);}
        if(!hash_equals($hash,hash_file('sha256',$path)))throw new HttpError(503,'Document integrity check failed.');return ['path'=>$path,'sha256'=>$hash];
    }
    public function send(string $type,string $id,string $bytes):array {
        $collection=$type==='bill'?'bills':'payments';$record=$this->store->get($collection,$id);if(!$record)throw new HttpError(404,ucfirst($type).' not found.');$customer=$this->store->get('tiffins',$record['customer']);if(!$customer)throw new HttpError(404,'Customer not found.');if(empty($customer['phone']))throw new HttpError(400,'Customer phone number not found.');
        $file=$this->file($bytes);$today=(new \DateTimeImmutable('now',new \DateTimeZone('Asia/Kolkata')))->format('d/m/Y');
        $number=$type==='bill'?($record['invoiceNo']??$id):($record['receiptNo']??strtoupper(substr($id,-6)));$filename='OM-Tiffin-'.($type==='bill'?'Bill-':'Payment-Receipt-').preg_replace('/[^A-Za-z0-9_-]/','_',$number).'.pdf';
        $variables=$type==='bill'?[$customer['customerName']??'Customer',$number,(string)($record['totalAmount']??0),$today]:[$customer['customerName']??'Customer',$number,(string)($record['amount']??0),$record['paymentMethod']??'Cash',(new \DateTimeImmutable($record['paymentDate']??'now'))->setTimezone(new \DateTimeZone('Asia/Kolkata'))->format('d/m/Y')];
        return $this->store->transaction(function()use($type,$id,$record,$customer,$file,$filename,$variables){$key=$type.'-pdf:'.$id.':'.bin2hex(random_bytes(12));$this->store->queue($key,['kind'=>'document-template','documentType'=>$type,'documentId'=>$id,'to'=>$customer['phone'],'attachment'=>$file,'filename'=>$filename,'templateName'=>$type==='bill'?'om_tiffin_bill':'om_tiffin_payment_receipt','languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>array_map(fn($v)=>['type'=>'text','text'=>$v],$variables)]]]);
            if($type==='bill'){$record['whatsappDelivery']=['messageId'=>null,'status'=>'pending','delivered'=>false,'sentAt'=>null,'deliveredAt'=>null,'readAt'=>null,'failedAt'=>null,'reason'=>'Notification queued','eventKey'=>$key];$this->store->put('bills',$record);}
            return [200,['success'=>true,'message'=>ucfirst($type).' PDF notification queued.','data'=>['queued'=>true,'eventKey'=>$key]]];
        });
    }
    public function retry(string $id):array{return $this->send('bill',$id,$this->documents->bill($id)[1]->bytes);}
    public function all(array $body):array {
        (new ReadModels($this->store))->period($body);$completed=[];$failed=[];
        foreach($this->store->find('tiffins',fn($c)=>($c['status']??'Active')==='Active')as $customer){
            try{$bill=(new Billing($this->store))->generate([...$body,'customer'=>$customer['_id']])[1]['data'];$result=$this->retry($bill['_id']);$completed[]=['customer'=>$customer['customerName'],'billId'=>$bill['_id'],'invoiceNo'=>$bill['invoiceNo'],'status'=>'queued','eventKey'=>$result[1]['data']['eventKey']];}
            catch(HttpError $e){$failed[]=['customer'=>$customer['customerName'],'reason'=>$e->getMessage()];}
        }
        return [200,['success'=>true,'message'=>'Bulk bill generation completed; notifications queued.','completedCustomers'=>$completed,'failedCustomers'=>$failed,'total'=>count($completed)+count($failed),'completed'=>count($completed),'failed'=>count($failed),'sent'=>0,'queued'=>count($completed)]];
    }
}
