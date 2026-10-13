<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/read-models.php';
final class Announcements {
    public function __construct(private readonly Store $store){}
    public function template(string $type,array $customer,array $data):array {
        $name=$customer['customerName']??$customer['name']??'Customer';
        [$template,$variables]=match($type){
            'holiday'=>['om_tiffin_holiday_notice',[$name,$data['holidayDate']?:'Tomorrow',$data['reason']?:'a scheduled holiday',$data['resumeDate']?:'the next working day']],
            'festival'=>['om_tiffin_festival_wishes',[$name,$data['festivalName']?:'Festival']],
            'delay'=>['om_tiffin_delivery_delay',[$name,$data['delayReason']?:'an unexpected reason',$data['expectedTime']?:'later today']],
            'menu'=>['om_tiffin_todays_menu',[$name,$data['breakfast']?:'Not available',$data['lunch']?:'Not available',$data['dinner']?:'Not available']],
            'service'=>['om_tiffin_service_update',[$name,trim(preg_replace('/ {5,}/',' ',preg_replace('/[\r\n\t]+/',' ',$data['message']))) ]],
            'custom'=>['om_tiffin_general_announcement',[$name,$data['message']]],
            default=>throw new HttpError(400,'Invalid announcement template type.')
        };
        return ['templateName'=>$template,'languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>array_map(fn($v)=>['type'=>'text','text'=>(string)$v],$variables)]]];
    }
    private function enqueue(array $customer,array $template,string $title,string $message):array {
        $delivery=$this->store->put('announcementdeliveries',['customer'=>$customer['_id'],'customerName'=>$customer['customerName']??'Customer','phoneNumber'=>$customer['phone'],'templateName'=>$template['templateName'],'title'=>$title,'message'=>$message,'status'=>'pending','notificationArchived'=>false,'whatsappMessageId'=>'','failureReason'=>''],true);
        $key='announcement:'.$delivery['_id'];$this->store->queue($key,[...$template,'kind'=>'announcement','documentId'=>$delivery['_id'],'to'=>$customer['phone']]);return ['customerId'=>$customer['_id'],'customerName'=>$customer['customerName'],'phone'=>$customer['phone'],'success'=>true,'status'=>'queued','eventKey'=>$key];
    }
    public function send(array $body):array {
        $type=$body['templateType']??'custom';$ids=$body['customerIds']??[];
        if(!is_array($ids)||!$ids)throw new HttpError(400,'No customers selected.');if(count($ids)>1000)throw new HttpError(400,'Too many customers selected.');
        $data=[];foreach(['title','message','holidayDate','reason','resumeDate','festivalName','delayReason','expectedTime','breakfast','lunch','dinner']as $key){if(isset($body[$key])&&!is_string($body[$key]))throw new HttpError(400,'Invalid announcement text.');$data[$key]=trim($body[$key]??'');}
        if($type==='custom'&&$data['message']==='')throw new HttpError(400,'Announcement message is required.');$this->template($type,[],$data);
        $customers=$this->store->find('tiffins',fn($c)=>in_array($c['_id'],$ids,true));if(!$customers)throw new HttpError(404,'No selected customers found.');
        return $this->store->transaction(function()use($type,$data,$customers,$body){$results=[];
            $customerMessage=$data['message']?:match($type){
                'holiday'=>'Holiday Notice: '.($data['holidayDate']?:'Tomorrow').'. '.($data['reason']?:'Scheduled holiday').'. Service will resume on '.($data['resumeDate']?:'the next working day').'.',
                'festival'=>($data['festivalName']?:'Festival').' wishes from OM Tiffin Service.',
                'delay'=>'Delivery Update: '.($data['delayReason']?:'There is a delay').($data['expectedTime']?' Expected delivery time: '.$data['expectedTime'].'.':'.'),
                'menu'=>"Today's Menu - Breakfast: ".($data['breakfast']?:'Not available').' | Lunch: '.($data['lunch']?:'Not available').' | Dinner: '.($data['dinner']?:'Not available'),
                default=>'Service update from OM Tiffin Service.'};
            $templateData=$data;$templateData['message']=$data['title']&&$data['message']?$data['title']."\n\n".$data['message']:($data['message']?:$data['title']);
            foreach($customers as $customer){if(empty($customer['phone'])){$results[]=['customerId'=>$customer['_id'],'customerName'=>$customer['customerName'],'success'=>false,'status'=>'failed','error'=>'Customer phone number not found.'];continue;}
                $results[]=$this->enqueue($customer,$this->template($type,$customer,$templateData),$data['title']?:'OM Tiffin Announcement',$customerMessage);
            }
            $queued=count(array_filter($results,fn($r)=>$r['status']==='queued'));return [200,['success'=>true,'message'=>'Announcement notifications queued.','data'=>['templateType'=>$type,'title'=>$data['title'],'message'=>$data['message'],'audience'=>$body['audience']??'all','totalCustomers'=>count($results),'sent'=>0,'queued'=>$queued,'failed'=>count($results)-$queued,'results'=>$results,'createdAt'=>gmdate('Y-m-d\TH:i:s.000\Z')],'whatsappSent'=>false]];
        });
    }
    public function reminders():array {
        return $this->store->transaction(function(){$customers=$this->store->find('tiffins',fn($c)=>!empty($c['phone']));$latest=[];
            foreach(sorted($this->store->all('bills'),['createdAt'=>-1])as $bill)$latest[$bill['customer']]??=$bill;
            $results=[];foreach($customers as $customer){$pending=(float)($latest[$customer['_id']]['pendingAmount']??$customer['pendingAmount']??0);if($pending<=0)continue;
                $template=['templateName'=>'om_tiffin_payment_reminder','languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>[['type'=>'text','text'=>$customer['customerName']??'Customer'],['type'=>'text','text'=>(string)$pending]]]]];
                $results[]=[...$this->enqueue($customer,$template,'Payment Reminder','Payment reminder for pending amount ₹'.$pending),'pendingAmount'=>$pending];
            }
            return [200,['success'=>true,'message'=>$results?'Payment reminders queued.':'No customers have pending payments.','data'=>['totalCustomers'=>count($customers),'pendingCustomers'=>count($results),'sent'=>0,'queued'=>count($results),'failed'=>0,'skipped'=>$results?0:count($customers),'results'=>$results]]];
        });
    }
}
