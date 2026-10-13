<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
final class PdfResponse {
    public function __construct(public readonly string $bytes,public readonly string $filename){}
}
final class PdfRenderer {
    public function __construct(private readonly ?string $node=null,private readonly ?string $script=null){}
    public function run(array $payload,bool $pdf=true):string {
        if(!function_exists('proc_open'))throw new HttpError(503,'Document renderer is unavailable.');
        $node=$this->node??(getenv('OMTIFFIN_NODE')?:'/home1/maapn1f6/omtiffin-private/tools/bin/node');$script=$this->script??(getenv('OMTIFFIN_RENDERER')?:dirname(__DIR__).'/render/renderer.cjs');
        if(!is_file($node)||!is_file($script))throw new HttpError(503,'Document renderer is not installed.');
        $input=json_encode($payload,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);if(strlen($input)>5*1024*1024)throw new HttpError(413,'Document data is too large.');
        $output=tmpfile();$errors=tmpfile();$process=null;$pipes=[];
        try{
            $environment=['TZ'=>'Asia/Kolkata','LANG'=>'en_US.UTF-8'];if(PHP_OS_FAMILY==='Windows')$environment['SystemRoot']=getenv('SystemRoot')?:'C:\\Windows';
            $process=proc_open([$node,$script],[0=>['pipe','r'],1=>$output,2=>$errors],$pipes,null,$environment,['bypass_shell'=>true]);
            if(!is_resource($process))throw new HttpError(503,'Document renderer could not start.');
            $offset=0;while($offset<strlen($input)){$written=fwrite($pipes[0],substr($input,$offset));if($written===false||$written===0)throw new HttpError(503,'Document renderer input failed.');$offset+=$written;}
            fclose($pipes[0]);unset($pipes[0]);$deadline=microtime(true)+40;
            do{$status=proc_get_status($process);if(!$status['running'])break;if(microtime(true)>$deadline){proc_terminate($process);throw new HttpError(503,'Document rendering timed out.');}usleep(50000);}while(true);
            $closed=proc_close($process);$process=null;$exit=$status['exitcode']>=0?$status['exitcode']:$closed;
            if($exit!==0)throw new HttpError($pdf?503:400,$pdf?'Unable to render document.':'Invalid design settings or signature image.');
            $size=fstat($output)['size'];if($size>20*1024*1024)throw new HttpError(413,'Rendered document is too large.');rewind($output);$bytes=stream_get_contents($output);
            if($pdf&&!str_starts_with($bytes,'%PDF-'))throw new HttpError(503,'Invalid document response.');return $bytes;
        }finally{foreach($pipes as $pipe)if(is_resource($pipe))fclose($pipe);if(is_resource($process)){proc_terminate($process);proc_close($process);}if(is_resource($output))fclose($output);if(is_resource($errors))fclose($errors);}
    }
    public function validate(array $design):array{if($design!==[]&&array_is_list($design))throw new HttpError(400,'Invalid design settings');return json_decode($this->run(['operation'=>'validate-design','design'=>(object)$design],false),true,512,JSON_THROW_ON_ERROR);}
}
final class Documents {
    private const DEFAULTS=['enabled'=>false,'primary'=>'#1d4ed8','text'=>'#0f172a','font'=>'Helvetica','fontSize'=>10,'logoPosition'=>'left','showLogo'=>true,'layout'=>'modern','businessName'=>'OM TIFFIN SERVICE','tagline'=>'Healthy • Fresh • Homemade','contact'=>'+91 70162 97983','footer'=>'Thank you for choosing OM Tiffin Service.','terms'=>'Payment due within 7 days. Meals once delivered cannot be refunded.','showQr'=>true,'signatureImage'=>'','upiId'=>'malaybarochiya-5@oksbi'];
    public function __construct(private readonly Store $store,private readonly PdfRenderer $renderer=new PdfRenderer()){}
    public function settings():array {$saved=$this->store->first('documentdesigns',fn($d)=>($d['key']??null)==='documents');return success(['bill'=>array_replace(self::DEFAULTS,$saved['bill']??[]),'receipt'=>array_replace(self::DEFAULTS,$saved['receipt']??[]),'revision'=>$saved['revision']??0]);}
    public function update(array $body):array {
        if(!is_array($body['bill']??null)||!is_array($body['receipt']??null))throw new HttpError(400,'Invalid design settings');
        $bill=$this->renderer->validate($body['bill']);$receipt=$this->renderer->validate($body['receipt']);$revision=$body['revision']??null;
        if(!is_int($revision)||$revision<0)throw new HttpError(400,'Invalid revision');
        return $this->store->transaction(function()use($bill,$receipt,$revision){
            $saved=$this->store->first('documentdesigns',fn($d)=>($d['key']??null)==='documents');
            if(($saved===null&&$revision!==0)||($saved!==null&&($revision===0||($saved['revision']??0)!==$revision)))throw new HttpError(409,'Settings changed on another device. Reload before saving.');
            $this->store->put('documentdesigns',array_replace($saved??[],['key'=>'documents','bill'=>$bill,'receipt'=>$receipt,'revision'=>$revision+1]),$saved===null);return success(['bill'=>$bill,'receipt'=>$receipt,'revision'=>$revision+1]);
        });
    }
    public function bill(string $id,?string $customerId=null):array {
        $r=new ReadModels($this->store);$bill=$this->store->get('bills',$id);if(!$bill||($customerId!==null&&($bill['customer']??null)!==$customerId))throw new HttpError(404,'Bill not found.');
        $customer=$this->store->get('tiffins',$bill['customer'])??[];$design=$this->settings()[1]['data']['bill'];$bytes=$this->renderer->run(['type'=>'bill','data'=>$r->hydrate('bills',$bill),'customer'=>$customer,'design'=>$design]);
        return [200,new PdfResponse($bytes,'OM-Tiffin-Bill-'.preg_replace('/[^A-Za-z0-9_-]/','_',($bill['invoiceNo']??$id)).'.pdf')];
    }
    public function receipt(string $id):array {
        $r=new ReadModels($this->store);$payment=$this->store->get('payments',$id);if(!$payment)throw new HttpError(404,'Payment not found.');$payment=$r->hydrate('payments',$payment);$customer=$this->store->get('tiffins',$payment['customer'])??[];$bill=$this->store->get('bills',$payment['bill'])??[];$payment['customer']=$customer;$payment['bill']=$bill?$r->hydrate('bills',$bill):[];
        return [200,new PdfResponse($this->renderer->run(['type'=>'receipt','data'=>$payment,'customer'=>$customer,'design'=>$this->settings()[1]['data']['receipt']]),'OM-Tiffin-Receipt-'.$id.'.pdf')];
    }
    public function preview(array $body):array {
        $type=$body['type']??null;if(!in_array($type,['bill','receipt'],true))throw new HttpError(400,'Invalid document type');if(!is_array($body['design']??null))throw new HttpError(400,'Invalid design settings');$design=$this->renderer->validate($body['design']);
        $customer=['customerName'=>'Demo Customer','phone'=>'0000000000','address'=>'Demo address, Gandhinagar'];$bill=['invoiceNo'=>'PREVIEW-001','month'=>10,'year'=>2026,'cycle'=>'1','totalAmount'=>2400,'paidAmount'=>1200,'pendingAmount'=>1200,'status'=>'Partial','dailyDetails'=>[['date'=>'2026-10-10','breakfastQty'=>0,'lunchQty'=>1,'dinnerQty'=>1,'dailyTotal'=>240]]];$data=$type==='bill'?$bill:['receiptNo'=>'PREVIEW-001','paymentDate'=>'2026-10-10','amount'=>1200,'paymentMethod'=>'UPI','bill'=>$bill,'customer'=>$customer];
        return [200,new PdfResponse($this->renderer->run(['type'=>$type,'data'=>$data,'customer'=>$customer,'design'=>$design]),'OM-Tiffin-Preview.pdf')];
    }
}
