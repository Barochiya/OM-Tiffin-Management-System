<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/billing.php';
final class Deliveries {
    public function __construct(private readonly Store $store,private readonly array $settings){}
    public function setup():array {
        $enabled=isset($this->settings['WHATSAPP_DELIVERY_ENABLED'])?$this->settings['WHATSAPP_DELIVERY_ENABLED']==='true':true;
        $language=$this->settings['WHATSAPP_DELIVERY_LANGUAGE']??'en_GB';$dispatchTemplate=$this->settings['WHATSAPP_DISPATCH_TEMPLATE']??'om_tiffin_out_for_delivery';$deliveredTemplate=$this->settings['WHATSAPP_DELIVERY_TEMPLATE']??'om_tiffin_delivered';
        $ready=(bool)($enabled&&$language&&$dispatchTemplate&&$deliveredTemplate&&!empty($this->settings['WHATSAPP_ACCESS_TOKEN'])&&!empty($this->settings['WHATSAPP_PHONE_NUMBER_ID']));
        return compact('enabled','ready','language','dispatchTemplate','deliveredTemplate');
    }
    private function identity(mixed $id):bool{return is_string($id)&&preg_match('/^[a-f0-9]{24}$/iD',$id)===1;}
    public function get(array $query):array {
        $date=dayKey((string)($query['date']??''));$customer=$query['customer']??null;
        if($customer!==null&&$customer!==''&&!$this->identity($customer))throw new HttpError(400,'Invalid customer.');
        $setup=$this->setup();
        return [200,['success'=>true,'data'=>$this->store->find('mealdeliveries',fn($d)=>($d['date']??null)===$date&&(!$customer||($d['customer']??null)===$customer)),'whatsappConfigured'=>$setup['ready'],'whatsappSetup'=>$setup]];
    }
    public function mark(array $body,string $admin,?\DateTimeImmutable $now=null):array {
        $date=dayKey((string)($body['date']??''));$customer=$body['customer']??null;$meal=$body['meal']??null;$status=$body['status']??null;
        if(!$this->identity($customer)||!in_array($meal,['Lunch','Dinner'],true)||!in_array($status,['Out for delivery','Delivered'],true))throw new HttpError(400,'Customer, meal and delivery status are required.');
        $now=($now??new \DateTimeImmutable())->setTimezone(new \DateTimeZone('Asia/Kolkata'));
        if($date!==$now->format('Y-m-d'))throw new HttpError(400,'Delivery can only be marked for today.');
        return $this->store->transaction(function()use($customer,$meal,$status,$date,$admin,$now){
            $person=$this->store->get('tiffins',$customer);
            if(!$person||($person['status']??null)!=='Active'||!in_array($person['mealType']??null,[$meal,'Both'],true))throw new HttpError(400,'Customer is not active for this meal.');
            $record=$this->store->first('mealdeliveries',fn($d)=>($d['customer']??null)===$customer&&($d['date']??null)===$date&&($d['meal']??null)===$meal);
            if(!$record)$record=$this->store->put('mealdeliveries',['customer'=>$customer,'date'=>$date,'meal'=>$meal,'status'=>'Pending','dispatchNotification'=>['status'=>'not_configured'],'notification'=>['status'=>'not_configured']],true);
            if($record['status']===$status||$record['status']==='Delivered')return [200,['success'=>true,'data'=>$record,'unchanged'=>true]];
            if($status==='Delivered'&&$record['status']!=='Out for delivery')throw new HttpError(409,'Mark Out for delivery before Delivered.');
            $record['status']=$status;$record['updatedBy']=$admin;$dispatch=$status==='Out for delivery';$field=$dispatch?'dispatchNotification':'notification';
            $record[$dispatch?'dispatchedAt':'deliveredAt']=$now->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');$setup=$this->setup();$record[$field]=['status'=>$setup['ready']?'pending':'not_configured'];
            $record=$this->store->put('mealdeliveries',$record);
            if($setup['ready']){
                $payload=['kind'=>'meal-delivery','collection'=>'mealdeliveries','documentId'=>$record['_id'],'notificationField'=>$field,'to'=>$person['phone'],'templateName'=>$setup[$dispatch?'dispatchTemplate':'deliveredTemplate'],'languageCode'=>$setup['language'],'components'=>[['type'=>'body','parameters'=>array_map(fn($text)=>['type'=>'text','text'=>(string)$text],[$person['customerName'],$meal,$now->format('d/m/Y')])]]];
                $this->store->queue('meal:'.$record['_id'].':'.($dispatch?'dispatch':'delivered'),$payload);
            }
            return [200,['success'=>true,'data'=>$record]];
        });
    }
}
