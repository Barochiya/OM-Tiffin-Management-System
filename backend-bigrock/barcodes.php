<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
final class Barcodes {
    public function __construct(private readonly Store $store,private readonly bool $writesEnabled=false){}
    private function ensure(array $customer):array {
        if(!empty($customer['barcode']))return $customer;
        if(!$this->writesEnabled)throw new HttpError(503,'Barcode allocation is disabled in read-only staging.');
        return $this->store->transaction(function()use($customer){
            $current=$this->store->get('tiffins',$customer['_id']);
            if(!$current)throw new HttpError(404,'Customer not found');
            if(!empty($current['barcode']))return $current;
            $counter=$this->store->first('barcodecounters',fn($d)=>($d['key']??null)==='customer');
            $insert=$counter===null;$counter??=['key'=>'customer','value'=>0];
            for($i=0;$i<5;$i++){
                $counter['value']=(int)$counter['value']+1;
                $code='OMT-'.str_pad((string)$counter['value'],6,'0',STR_PAD_LEFT);
                if($this->store->first('tiffins',fn($d)=>($d['barcode']??null)===$code))continue;
                $this->store->put('barcodecounters',$counter,$insert);
                $current['barcode']=$code;
                return $this->store->put('tiffins',$current);
            }
            throw new HttpError(409,'Could not allocate a unique barcode');
        });
    }
    public function customer(string $id):array {
        $customer=$this->store->get('tiffins',$id);
        if(!$customer)throw new HttpError(404,'Customer not found');
        $customer=$this->ensure($customer);
        return [200,['success'=>true,'customer'=>(new ReadModels($this->store))->hydrate('tiffins',$customer),'barcode'=>$customer['barcode']]];
    }
    public function active():array {
        $customers=sorted($this->store->find('tiffins',fn($d)=>($d['status']??'Active')==='Active'),['customerName'=>1]);
        $items=[];
        foreach($customers as $customer){$customer=$this->ensure($customer);$items[]=['customer'=>(new ReadModels($this->store))->hydrate('tiffins',$customer),'barcode'=>$customer['barcode']];}
        return [200,['success'=>true,'count'=>count($items),'items'=>$items]];
    }
    public function lookup(string $code):array {
        $code=strtoupper(trim($code));
        $customer=$this->store->first('tiffins',fn($d)=>($d['barcode']??null)===$code);
        if(!$customer)throw new HttpError(404,'Barcode not found');
        return [200,['success'=>true,'barcode'=>$customer['barcode'],'status'=>'assigned','customer'=>(new ReadModels($this->store))->hydrate('tiffins',$customer)]];
    }
}

