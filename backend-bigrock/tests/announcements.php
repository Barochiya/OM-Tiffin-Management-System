<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';
final class AnnouncementStore extends OMT\Store {
    public array $data=[],$events=[];public function __construct(){}
    public function all(string $c):array{return array_values($this->data[$c]??[]);}
    public function get(string $c,string $id):?array{return $this->data[$c][$id]??null;}
    public function put(string $c,array $d,bool $insert=false):array{$d['_id']??=bin2hex(random_bytes(12));$this->data[$c][$d['_id']]=$d;return $d;}
    public function transaction(callable $f):mixed{$old=[$this->data,$this->events];try{return $f($this);}catch(Throwable $e){[$this->data,$this->events]=$old;throw $e;}}
    public function queue(string $key,array $payload):void{$this->events[$key]=$payload;}
}
function check(bool $v):void{if(!$v)throw new RuntimeException('Announcement assertion failed');}
$s=new AnnouncementStore();$a=new OMT\Announcements($s);
$c=$s->put('tiffins',['customerName'=>'Synthetic','phone'=>'9999999999','pendingAmount'=>999],true);$missing=$s->put('tiffins',['customerName'=>'No phone'],true);
$response=$a->send(['customerIds'=>[$c['_id'],$c['_id'],$missing['_id']],'templateType'=>'holiday','holidayDate'=>'2026-10-20','resumeDate'=>'2026-10-21'])[1];
check($response['data']['queued']===1&&$response['data']['failed']===1&&$response['data']['sent']===0);check(count($s->events)===1&&count($s->all('announcementdeliveries'))===1);
$payload=array_values($s->events)[0];check($payload['templateName']==='om_tiffin_holiday_notice');check(array_column($payload['components'][0]['parameters'],'text')===['Synthetic','2026-10-20','a scheduled holiday','2026-10-21']);
check($a->send(['customerIds'=>[$c['_id']],'templateType'=>'service','title'=>'Title','message'=>"A\nB"])[1]['data']['queued']===1);$payload=array_values($s->events)[1];check($payload['components'][0]['parameters'][1]['text']==='Title A B');
$s->put('bills',['customer'=>$c['_id'],'pendingAmount'=>50,'createdAt'=>'2026-10-01'],true);$s->put('bills',['customer'=>$c['_id'],'pendingAmount'=>0,'createdAt'=>'2026-10-02'],true);
check($a->reminders()[1]['data']['queued']===0);$s->put('bills',['customer'=>$c['_id'],'pendingAmount'=>80,'createdAt'=>'2026-10-03'],true);$reminder=$a->reminders()[1];check($reminder['data']['queued']===1&&$reminder['data']['results'][0]['pendingAmount']===80.0);
check(count($s->all('payments'))===0);echo "PASS announcement selection/dedup/template parameters, missing phone, service whitespace, latest-bill reminder totals, queued tracking, zero financial/provider actions.\n";
