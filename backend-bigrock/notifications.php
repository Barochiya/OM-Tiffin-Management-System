<?php
declare(strict_types=1);
namespace OMT;
final class Notifications {
    private const DEFINITIONS=[
        'orders'=>['websiteorders','Website orders awaiting confirmation','/website-orders'],
        'reviews'=>['websitereviews','Reviews awaiting approval','/website-reviews'],
        'modifications'=>['customermodificationrequests','Tiffin requests awaiting approval','/customer-modification-requests'],
        'payments'=>['whatsappmessages','Payment screenshots awaiting review','/whatsapp-payment-approval'],
        'messages'=>['whatsappmessages','Unread WhatsApp messages','/whatsapp-inbox'],
        'bills'=>['bills','Bills awaiting delivery / failed','/bill-delivery-status'],
        'announcements'=>['announcementdeliveries','Announcements awaiting delivery / failed','/announcement-delivery-status'],
    ];
    public function __construct(private readonly Store $store){}
    private static function timestamp(string $value):float {try{return (float)(new \DateTimeImmutable($value))->format('U.u');}catch(\Throwable){return -INF;}}
    private function matches(string $category,array $d):bool {
        return match($category){
            'orders'=>($d['orderStatus']??null)==='Pending',
            'reviews'=>($d['status']??null)==='Pending',
            'modifications'=>($d['status']??null)==='PENDING',
            'payments'=>($d['direction']??null)==='incoming'&&($d['paymentStatus']??null)==='pending_review',
            'messages'=>($d['direction']??null)==='incoming'&&($d['inboxStatus']??null)==='unread'&&($d['paymentStatus']??null)!=='pending_review',
            'bills'=>in_array($d['whatsappDelivery']['status']??null,['pending','failed'],true),
            'announcements'=>in_array($d['status']??null,['pending','failed'],true)&&($d['notificationArchived']??false)!==true,
        };
    }
    public function get(string $admin):array {
        $updatedAt=(new \DateTimeImmutable('now',new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');
        $states=$this->store->find('adminnotificationstates',fn($d)=>($d['admin']??null)===$admin);
        $categories=[];
        foreach(self::DEFINITIONS as $id=>[$collection,$title,$path]){
            $readThrough=null;foreach($states as $state)if(($state['category']??null)===$id)$readThrough=$state['readThrough']??null;
            $count=count($this->store->find($collection,fn($d)=>$this->matches($id,$d)&&($readThrough===null||(!empty($d['updatedAt'])&&self::timestamp($d['updatedAt'])>self::timestamp($readThrough)))));
            $categories[]=compact('id','title','path','count');
        }
        return [200,['success'=>true,'total'=>array_sum(array_column($categories,'count')),'categories'=>$categories,'unavailable'=>[],'updatedAt'=>$updatedAt]];
    }
    public function markRead(string $admin,array $body):array {
        $category=$body['category']??null;
        if($category!=='all'&&!isset(self::DEFINITIONS[$category??'']))throw new HttpError(400,'Invalid notification category.');
        $date=$body['readThrough']??null;$time=is_string($date)&&$date!==''?self::timestamp($date):-INF;
        if(!is_finite($time)||$time>microtime(true))throw new HttpError(400,'Invalid notification snapshot.');
        return $this->store->transaction(function()use($admin,$category,$date,$time){
            foreach($category==='all'?array_keys(self::DEFINITIONS):[$category] as $id){
                $state=$this->store->first('adminnotificationstates',fn($d)=>($d['admin']??null)===$admin&&($d['category']??null)===$id);
                if($state&&self::timestamp($state['readThrough']??'1970-01-01')>=$time)continue;
                $insert=$state===null;$state??=['admin'=>$admin,'category'=>$id];$state['readThrough']=$date;
                $this->store->put('adminnotificationstates',$state,$insert);
            }
            return [200,['success'=>true]];
        });
    }
}
