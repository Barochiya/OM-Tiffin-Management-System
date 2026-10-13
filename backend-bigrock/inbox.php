<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
final class Inbox {
    public function __construct(private readonly Store $store){}
    public function messages(bool $outgoing=false,bool $unread=false,bool $reviews=false):array {
        $r=new ReadModels($this->store);
        $messages=sorted($this->store->find('whatsappmessages',fn($d)=>($outgoing||($d['direction']??null)==='incoming')&&(!$unread||($d['inboxStatus']??null)==='unread')&&(!$reviews||($d['paymentStatus']??null)==='pending_review')),['createdAt'=>-1]);
        $data=[];foreach($messages as $message){
            $message=$r->hydrate('whatsappmessages',$message);
            $message=$r->populate($message,'customer','tiffins',$reviews?['customerName','phone','address','advanceBalance']:['customerName','phone','address']);
            if(!$unread){
                $message=$r->populate($message,'linkedBill','bills',$reviews?['invoiceNo','month','year','cycle','totalAmount','paidAmount','pendingAmount','status']:['invoiceNo','totalAmount','paidAmount','pendingAmount','status']);
                if(!$reviews)$message=$r->populate($message,'linkedPayment','payments',['amount','paymentMethod','paymentDate','status']);
            }
            if($reviews){$customer=$message['customer']['_id']??null;$bills=$customer?$this->store->find('bills',fn($b)=>($b['customer']??null)===$customer&&(float)($b['pendingAmount']??0)>0):[];
                $message['pendingBills']=array_map(fn($b)=>only($r->hydrate('bills',$b),['invoiceNo','month','year','cycle','totalAmount','paidAmount','pendingAmount','status']),sorted($bills,['year'=>-1,'month'=>-1,'cycle'=>-1]));
            }
            $data[]=$message;
        }
        return [200,['success'=>true,'count'=>count($data),'data'=>$data]];
    }
    public function announcements():array {
        $r=new ReadModels($this->store);return [200,['success'=>true,'data'=>array_map(fn($d)=>$r->hydrate('announcementdeliveries',$d),sorted($this->store->all('announcementdeliveries'),['createdAt'=>-1]))]];
    }
    public function read(string $id):array {
        return $this->store->transaction(function()use($id){$doc=$this->store->get('whatsappmessages',$id);if(!$doc)throw new HttpError(404,'WhatsApp message not found.');$doc['inboxStatus']='read';$doc=$this->store->put('whatsappmessages',$doc);return [200,['success'=>true,'message'=>'WhatsApp message marked as read.','data'=>(new ReadModels($this->store))->hydrate('whatsappmessages',$doc)]];});
    }
    public function remove(string $id):array {
        return $this->store->transaction(function()use($id){if(!$this->store->delete('whatsappmessages',$id))throw new HttpError(404,'WhatsApp message not found.');return [200,['success'=>true,'message'=>'WhatsApp message deleted successfully.']];});
    }
    public function reject(string $id,array $body):array {
        $reason=$body['reason']??'Payment screenshot rejected by admin.';if(!is_string($reason))throw new HttpError(400,'Invalid rejection reason.');$reason=trim($reason)?:'Payment screenshot rejected by admin.';
        return $this->store->transaction(function()use($id,$reason){$doc=$this->store->get('whatsappmessages',$id);if(!$doc)throw new HttpError(404,'WhatsApp payment message not found.');
            if(in_array($doc['paymentStatus']??null,['payment_received','rejected'],true))throw new HttpError(400,'This payment has already been approved or rejected.');
            $doc=array_replace($doc,['paymentStatus'=>'rejected','inboxStatus'=>'closed','note'=>$reason]);$doc=$this->store->put('whatsappmessages',$doc);
            if(!empty($doc['phoneNumber']))$this->store->queue('payment-rejection:'.$id,['kind'=>'text','to'=>$doc['phoneNumber'],'message'=>"🧾 *OM TIFFIN SERVICE*\n\n❌ *Payment Screenshot Rejected*\n\nYour payment screenshot could not be approved.\n\n📝 Reason : ".$reason."\n\nPlease send a valid payment screenshot or contact OM TIFFIN SERVICE.\n\n🙏 Thank you."]);
            return [200,['success'=>true,'message'=>'WhatsApp payment rejected successfully.','data'=>(new ReadModels($this->store))->hydrate('whatsappmessages',$doc)]];
        });
    }
    public function reply(string $id,array $body):array {
        if(!is_string($body['message']??null)||trim($body['message'])==='')throw new HttpError(400,'Reply message is required.');$text=trim($body['message']);if(strlen($text)>16000)throw new HttpError(400,'Reply message is too long.');
        return $this->store->transaction(function()use($id,$text){$original=$this->store->get('whatsappmessages',$id);if(!$original)throw new HttpError(404,'WhatsApp message not found.');if(empty($original['phoneNumber']))throw new HttpError(400,'Customer phone number not found.');
            $reply=$this->store->put('whatsappmessages',['customer'=>$original['customer']??null,'phoneNumber'=>$original['phoneNumber'],'whatsappMessageId'=>'queued_'.bin2hex(random_bytes(12)),'type'=>'text','message'=>$text,'mediaId'=>null,'mediaMimeType'=>null,'mediaFilename'=>null,'mediaCaption'=>'','whatsappTimestamp'=>gmdate('Y-m-d\TH:i:s.000\Z'),'direction'=>'outgoing','inboxStatus'=>'read','paymentStatus'=>'not_payment_related','linkedBill'=>$original['linkedBill']??null,'linkedPayment'=>$original['linkedPayment']??null],true);
            $key='reply:'.$reply['_id'];$this->store->queue($key,['kind'=>'inbox-reply','documentId'=>$reply['_id'],'to'=>$original['phoneNumber'],'message'=>$text]);$original['inboxStatus']='read';$this->store->put('whatsappmessages',$original);
            return [200,['success'=>true,'message'=>'WhatsApp reply queued.','data'=>['whatsappResponse'=>['queued'=>true,'eventKey'=>$key],'reply'=>(new ReadModels($this->store))->hydrate('whatsappmessages',$reply)]]];
        });
    }
}
