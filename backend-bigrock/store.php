<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/outbox-crypto.php';
class Store {
    private array $instantDocumentEvents=[];
    public function instantDocumentEvents():array{return $this->instantDocumentEvents;}
    public function __construct(private readonly \PDO $pdo,private readonly ?string $outboxSecret=null) {}
    private function outboxKey():string {return $this->outboxSecret??(function_exists(__NAMESPACE__.'\\config')?(config()['JWT_SECRET']??''):'');}
    public function all(string $collection): array {
        $q=$this->pdo->prepare('SELECT document FROM omt_documents WHERE collection_name=? ORDER BY id');$q->execute([$collection]);
        return array_map(fn($row)=>json_decode($row,true,512,JSON_THROW_ON_ERROR),$q->fetchAll(\PDO::FETCH_COLUMN));
    }
    public function get(string $collection,string $id): ?array {
        $q=$this->pdo->prepare('SELECT document FROM omt_documents WHERE collection_name=? AND id=?');$q->execute([$collection,$id]);
        $row=$q->fetchColumn();return $row===false?null:json_decode($row,true,512,JSON_THROW_ON_ERROR);
    }
    public function find(string $collection, callable $predicate): array { return array_values(array_filter($this->all($collection),$predicate)); }
    public function first(string $collection, callable $predicate): ?array { foreach($this->all($collection) as $doc)if($predicate($doc))return $doc;return null; }
    public function transaction(callable $callback): mixed {
        if($this->pdo->inTransaction())return $callback($this);
        // All business writes serialize across the app and workers, never across Hemadri.
        $q=$this->pdo->prepare('SELECT GET_LOCK(?,15)');$q->execute(['omtiffin-business-writes']);
        if((int)$q->fetchColumn()!==1)throw new HttpError(503,'Busy; please retry');
        $this->pdo->beginTransaction();
        try{$result=$callback($this);$this->pdo->commit();return $result;}
        catch(\Throwable $e){if($this->pdo->inTransaction())$this->pdo->rollBack();throw $e;}
        finally{$q=$this->pdo->prepare('SELECT RELEASE_LOCK(?)');$q->execute(['omtiffin-business-writes']);}
    }
    public function put(string $collection,array $document,bool $insert=false): array {
        if(!$this->pdo->inTransaction())throw new \LogicException('Write requires a business transaction');
        $id=$document['_id']??bin2hex(random_bytes(12));
        if(!is_string($id)||!preg_match('/^[a-f0-9]{24}$/iD',$id))throw new HttpError(400,'Invalid identity');
        $now=gmdate('Y-m-d\TH:i:s').'.'.sprintf('%03d',(int)((microtime(true)*1000)%1000)).'Z';
        $document['_id']=$id;$document['updatedAt']=$now;
        if($insert){$document['createdAt']??=$now;$document['__v']??=0;}
        $this->assertUnique($collection,$document);
        $json=json_encode($document,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_PRESERVE_ZERO_FRACTION);
        if($insert){$q=$this->pdo->prepare('INSERT INTO omt_documents(collection_name,id,document,updated_at) VALUES(?,?,?,UTC_TIMESTAMP(3))');$q->execute([$collection,$id,$json]);}
        else{$q=$this->pdo->prepare('UPDATE omt_documents SET document=?,revision=revision+1,updated_at=UTC_TIMESTAMP(3) WHERE collection_name=? AND id=?');$q->execute([$json,$collection,$id]);if($q->rowCount()!==1)throw new HttpError(404,'Record not found');}
        return $document;
    }
    private function assertUnique(string $collection,array $doc): void {
        $q=$this->pdo->prepare('SELECT source_metadata FROM omt_collections WHERE name=?');$q->execute([$collection]);
        $metadata=json_decode($q->fetchColumn()?:'{}',true,512,JSON_THROW_ON_ERROR);
        foreach($metadata['indexes']??[] as $index){
            if(empty($index['unique'])||($index['name']??'')==='_id_')continue;
            $key=[];$missing=false;
            foreach(array_keys($index['key']) as $field){$value=$doc;foreach(explode('.',$field)as $part){if(!is_array($value)||!array_key_exists($part,$value)){$missing=true;$value=null;break;}$value=$value[$part];}$key[]=$value;}
            if(!empty($index['sparse'])&&$missing)continue;
            // Imported collections are small; compare existing records until typed index projections are verified.
            foreach($this->all($collection)as $existing){
                if($existing['_id']===$doc['_id'])continue;
                $other=[];
                foreach(array_keys($index['key'])as $field){$value=$existing;foreach(explode('.',$field)as $part)$value=is_array($value)?($value[$part]??null):null;$other[]=$value;}
                if($key===$other)throw new HttpError(409,'Duplicate '.$index['name']);
            }
        }
    }
    public function delete(string $collection,string $id): bool {
        if(!$this->pdo->inTransaction())throw new \LogicException('Write requires a business transaction');
        $q=$this->pdo->prepare('DELETE FROM omt_documents WHERE collection_name=? AND id=?');$q->execute([$collection,$id]);return $q->rowCount()===1;
    }
    public function prepareEmployeeCollections():void {
        if(!$this->pdo->inTransaction())throw new \LogicException('Employee setup requires a business transaction');
        $q=$this->pdo->prepare("INSERT IGNORE INTO omt_collections(name,source_metadata,source_count,imported_at) VALUES(?,'{}',0,UTC_TIMESTAMP(3))");
        foreach(['employees','employeeattendance','employeepayroll','salarypayments','employeeaudit','employeecash','employeesettings','employeenotifications','employeeaccounts','employeeotps','employeefirstloginlogs']as $name)$q->execute([$name]);
    }
    public function prepareWalletCollections():void {
        if(!$this->pdo->inTransaction())throw new \LogicException('Wallet setup requires a business transaction');
        $q=$this->pdo->prepare("INSERT IGNORE INTO omt_collections(name,source_metadata,source_count,imported_at) VALUES(?,'{}',0,UTC_TIMESTAMP(3))");
        foreach(['walletaccounts','wallettransactions']as $name)$q->execute([$name]);
    }
    public function operation(string $key,string $hash,callable $callback):array {
        return $this->transaction(function()use($key,$hash,$callback){
            $q=$this->pdo->prepare('SELECT request_sha256,response FROM omt_operations WHERE operation_key=? FOR UPDATE');$q->execute([$key]);$existing=$q->fetch(\PDO::FETCH_ASSOC);
            if($existing){if(!hash_equals($existing['request_sha256'],$hash))throw new HttpError(409,'Idempotency key was already used with another request.');if($existing['response']===null)throw new HttpError(409,'Request is still processing.');return json_decode($existing['response'],true,64,JSON_THROW_ON_ERROR);}
            $result=$callback();$encoded=json_encode($result,JSON_THROW_ON_ERROR|JSON_INVALID_UTF8_SUBSTITUTE);$q=$this->pdo->prepare('INSERT INTO omt_operations(operation_key,request_sha256,response,created_at) VALUES(?,?,?,UTC_TIMESTAMP(3))');$q->execute([$key,$hash,$encoded]);return $result;
        });
    }
    public function queue(string $eventKey,array $payload):void {
        if(!$this->pdo->inTransaction())throw new \LogicException('Outbox enqueue requires a business transaction');
        if(strlen($eventKey)>191||!preg_match('/^[A-Za-z0-9:._-]+$/D',$eventKey))throw new \LogicException('Invalid internal event key');
        $q=$this->pdo->prepare('SELECT payload FROM omt_outbox WHERE event_key=?');$q->execute([$eventKey]);$existing=$q->fetchColumn();
        if($existing!==false){if(OutboxCrypto::decode($eventKey,$existing,$this->outboxKey())!=$payload)throw new HttpError(409,'Notification event already exists with different data');return;}
        $q=$this->pdo->prepare('INSERT INTO omt_outbox(event_key,payload,available_at) VALUES(?,?,UTC_TIMESTAMP(3))');$q->execute([$eventKey,OutboxCrypto::encode($eventKey,$payload,$this->outboxKey())]);
        if(in_array($payload['kind']??null,['document-template','receipt-auto','employee-notification','employee-otp'],true))$this->instantDocumentEvents[]=$eventKey;
    }
    public function claimOutbox(string $eventKey):?array {
        if(!$this->pdo->inTransaction())throw new \LogicException('Outbox claim requires a business transaction');
        $q=$this->pdo->prepare("SELECT id,event_key,payload FROM omt_outbox WHERE event_key=? AND status='pending' AND available_at<=UTC_TIMESTAMP(3) FOR UPDATE");$q->execute([$eventKey]);$event=$q->fetch(\PDO::FETCH_ASSOC);
        if(!$event)return null;
        $q=$this->pdo->prepare("UPDATE omt_outbox SET status='processing',attempts=attempts+1,claimed_at=UTC_TIMESTAMP(3) WHERE id=? AND status='pending'");$q->execute([$event['id']]);
        if($q->rowCount()!==1)return null;
        $event['payload']=OutboxCrypto::decode($event['event_key'],$event['payload'],$this->outboxKey());return $event;
    }
    public function deferEmployeeOutbox(array $event,string $reason):void {
        if(!$this->pdo->inTransaction()||($event['payload']['kind']??null)!=='employee-notification')throw new \LogicException('Only unsent employee events may await template approval');
        $q=$this->pdo->prepare("UPDATE omt_outbox SET status='pending',available_at=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 120 SECOND),claimed_at=NULL WHERE id=? AND status='processing'");$q->execute([$event['id']]);if($q->rowCount()!==1)throw new \RuntimeException('Outbox claim no longer active');
        $record=$this->get('employeenotifications',$event['payload']['notificationId']);if($record){$record['whatsappStatus']='waiting_template';$record['failureReason']=$reason;$this->put('employeenotifications',$record);}
    }
    public function finishOutbox(array $event,array $notification):void {
        if(!$this->pdo->inTransaction())throw new \LogicException('Outbox completion requires a business transaction');
        $status=$notification['status']??'unknown';
        if(!in_array($status,['accepted','failed','unknown'],true))throw new \LogicException('Invalid notification outcome');
        $q=$this->pdo->prepare("UPDATE omt_outbox SET status=?,provider_id=?,completed_at=UTC_TIMESTAMP(3) WHERE id=? AND status='processing'");$q->execute([$status,$notification['messageId']??null,$event['id']]);
        if($q->rowCount()!==1)throw new \RuntimeException('Outbox claim is no longer active');
        $p=$event['payload'];
        if(($p['kind']??null)==='employee-notification'){
            $record=$this->get('employeenotifications',$p['notificationId']);if(!$record)throw new \RuntimeException('Employee notification target missing');
            $record['whatsappStatus']=$notification['employeeStatus']??($status==='accepted'?'sent':$status);$record['failureReason']=$status==='accepted'?'Message sent to Meta':($notification['error']??'Delivery could not be confirmed');
            if($status==='accepted'){$record['whatsappMessageId']=$notification['messageId'];$record['sentAt']=gmdate('Y-m-d\TH:i:s.000\Z');}else $record['failedAt']=gmdate('Y-m-d\TH:i:s.000\Z');$this->put('employeenotifications',$record);
        }

          if(in_array($p['kind']??null,['document-template','receipt-auto'],true)&&in_array($p['documentType']??null,['bill','receipt'],true)){
              $collection=$p['documentType']==='bill'?'bills':'payments';$bill=$this->get($collection,$p['documentId']);if(!$bill)throw new \RuntimeException('Bill notification target missing');
              if(($bill['whatsappDelivery']['eventKey']??null)===$event['event_key']){$bill['whatsappDelivery']=array_replace($bill['whatsappDelivery'],['messageId'=>$notification['messageId']??null,'status'=>$status==='accepted'?'sent':($status==='failed'?'failed':'pending'),'reason'=>$status==='accepted'?'Message sent to Meta':($notification['error']??'Provider acknowledgement uncertain')]);$bill['whatsappDelivery'][$status==='accepted'?'sentAt':'failedAt']=gmdate('Y-m-d\TH:i:s.000\Z');$this->put($collection,$bill);}
          }
          if(($p['kind']??null)==='inbox-reply'){
              $reply=$this->get('whatsappmessages',$p['documentId']);if(!$reply)throw new \RuntimeException('Reply record missing');
              if($status==='accepted')$reply['whatsappMessageId']=$notification['messageId'];$reply['deliveryStatus']=$status;$this->put('whatsappmessages',$reply);
          }
          if(($p['kind']??null)==='announcement'){
              $record=$this->get('announcementdeliveries',$p['documentId']);if(!$record)throw new \RuntimeException('Announcement delivery missing');
              $record['status']=$status==='accepted'?'sent':($status==='failed'?'failed':'pending');
              if($status==='accepted'){$record['whatsappMessageId']=$notification['messageId'];$record['sentAt']=gmdate('Y-m-d\TH:i:s.000\Z');}
              if($status!=='accepted')$record['failureReason']=$notification['error']??'Provider acknowledgement uncertain; check before resending.';
              $this->put('announcementdeliveries',$record);
          }
        if(($p['kind']??null)==='meal-delivery'){
            if(($p['collection']??null)!=='mealdeliveries'||!in_array($p['notificationField']??null,['dispatchNotification','notification'],true))throw new \LogicException('Invalid delivery notification target');
            $record=$this->get('mealdeliveries',$p['documentId']);
            if(!$record)throw new \RuntimeException('Notification delivery record missing');
            $record[$p['notificationField']]=$notification;$this->put('mealdeliveries',$record);
        }
        if(($p['kind']??null)==='modification-admin'&&$status==='accepted'){
            $providerId=$notification['messageId']??null;if(!is_string($providerId)||$providerId==='')throw new \LogicException('Missing provider acknowledgement');
            if(!$this->get('customermodificationrequests',$p['requestId']))throw new \RuntimeException('Modification request missing');
            $existing=$this->first('customermodificationwhatsappactions',fn($d)=>($d['whatsappMessageId']??null)===$providerId);
            if($existing){if(($existing['request']??null)!==$p['requestId']||($existing['adminPhone']??null)!==$p['to'])throw new \RuntimeException('Provider acknowledgement belongs to another action');}
            else $this->put('customermodificationwhatsappactions',['request'=>$p['requestId'],'whatsappMessageId'=>$providerId,'adminPhone'=>$p['to'],'action'=>'APPROVE','status'=>'PENDING','usedAt'=>null],true);
        }
        if(($p['kind']??null)==='login-id'&&$status==='accepted'){
            $providerId=$notification['messageId']??null;if(!is_string($providerId)||$providerId==='')throw new \LogicException('Missing provider acknowledgement');
            $existing=$this->first('customerloginiddeliveries',fn($d)=>($d['whatsappMessageId']??null)===$providerId);
            if(!$existing)$this->put('customerloginiddeliveries',['customer'=>$p['customerId'],'customerAccount'=>$p['accountId'],'customerName'=>$p['customerName'],'userId'=>$p['userId'],'phone'=>$p['to'],'templateName'=>$p['templateName'],'whatsappMessageId'=>$providerId,'whatsappStatus'=>'accepted','sentAt'=>null,'deliveredAt'=>null,'readAt'=>null,'failedAt'=>null,'failureReason'=>''],true);
        }
        if(in_array($p['kind']??null,['customer-otp','employee-otp'],true)){$otpCollection=$p['kind']==='employee-otp'?'employeeotps':'customerotps';
            $otp=$this->get($otpCollection,$p['otpId']);if(!$otp)throw new \RuntimeException('OTP record missing');$otp['whatsappStatus']=$status;
            $now=(new \DateTimeImmutable('now',new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');
            if($status==='accepted'){$otp['whatsappMessageId']=$notification['messageId']??null;$otp['whatsappSentAt']=$now;}
            elseif($status==='failed'){$otp['whatsappFailedAt']=$now;$otp['whatsappFailureReason']=$notification['error']??'Notification failed';}
            $this->put($otpCollection,$otp);
        }
    }
}
