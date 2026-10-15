<?php
declare(strict_types=1);
require dirname(__DIR__).'/store.php';
require dirname(__DIR__).'/document-notifications.php';
require dirname(__DIR__).'/catalog.php';
final class ReceiptStatement extends PDOStatement {
    public function __construct(){}
    public function execute(?array $params=null):bool{return true;}
    public function rowCount():int{return 1;}
}
final class ReceiptPDO extends PDO {
    public function __construct(){}
    public function inTransaction():bool{return true;}
    public function prepare(string $query,array $options=[]):PDOStatement|false{return new ReceiptStatement();}
}
final class ReceiptStore extends OMT\Store {
    public array $records=[],$events=[];
    public function __construct(){parent::__construct(new ReceiptPDO());}
    public function get(string $collection,string $id):?array{return $this->records[$collection][$id]??null;}
    public function put(string $collection,array $record,bool $insert=false):array{$this->records[$collection][$record['_id']]=$record;return $record;}
    public function transaction(callable $callback):mixed{return $callback($this);}
    public function queue(string $key,array $payload):void{$this->events[$key]=$payload;}
}
function receiptCheck(bool $value):void{if(!$value)throw new RuntimeException('Receipt tracking assertion failed');}
$s=new ReceiptStore();$s->records=['tiffins'=>['c'=>['_id'=>'c','phone'=>'0000000000','customerName'=>'Synthetic']], 'payments'=>['p'=>['_id'=>'p','customer'=>'c','amount'=>100,'paymentDate'=>'2026-10-15']]];
$directory=sys_get_temp_dir().'/omt-receipt-test-'.bin2hex(random_bytes(6));
try{
    $notifications=new OMT\DocumentNotifications($s,new OMT\Documents($s),$directory);
    $result=$notifications->receipt(['paymentId'=>'p','_pdfBytes'=>'%PDF-synthetic-fixture']);
    $key=$result[1]['data']['eventKey'];$payload=$s->events[$key];
    receiptCheck($s->records['payments']['p']['whatsappDelivery']['status']==='pending');
    receiptCheck($payload['documentType']==='receipt'&&$payload['documentId']==='p');
    $s->finishOutbox(['id'=>1,'event_key'=>$key,'payload'=>$payload],['status'=>'accepted','messageId'=>'synthetic-receipt-provider']);
    $delivery=$s->records['payments']['p']['whatsappDelivery'];
    receiptCheck($delivery['status']==='sent'&&$delivery['messageId']==='synthetic-receipt-provider'&&isset($delivery['sentAt']));
    receiptCheck(!isset($s->records['bills']));
    // A stale completion cannot overwrite a newer send's tracking record.
    $s->records['payments']['p']['whatsappDelivery']['eventKey']='newer-event';
    $s->finishOutbox(['id'=>1,'event_key'=>$key,'payload'=>$payload],['status'=>'failed']);
    receiptCheck($s->records['payments']['p']['whatsappDelivery']['status']==='sent');
    echo "PASS receipt queue, provider acknowledgement, timestamps and stale completion isolation. Synthetic data; zero network calls.\n";
}finally{if(is_dir($directory)){foreach(glob($directory.'/*.pdf')as $file)unlink($file);rmdir($directory);}}
