<?php
declare(strict_types=1);
require dirname(__DIR__).'/router.php';
final class ReviewMemory extends OMT\Store {
 public array $data=[],$events=[];public function __construct(){}
 public function all(string $c):array{return array_values($this->data[$c]??[]);}
 public function get(string $c,string $id):?array{return $this->data[$c][$id]??null;}
 public function put(string $c,array $d,bool $insert=false):array{$d['_id']??=bin2hex(random_bytes(12));$d['createdAt']??=gmdate('c');$this->data[$c][$d['_id']]=$d;return $d;}
 public function prepareReviewCollections():void{}
 public function queue(string $key,array $p):void{$this->events[$key]=$p;}
 public function transaction(callable $f):mixed{$before=[$this->data,$this->events];try{return $f($this);}catch(Throwable $e){[$this->data,$this->events]=$before;throw $e;}}
}
function check(bool $v,string $why):void{if(!$v)throw new RuntimeException($why);}
function denied(callable $f,int $status):void{try{$f();}catch(OMT\HttpError $e){check($e->status===$status,'Wrong error '.$e->status);return;}throw new RuntimeException('Expected rejection');}
$s=new ReviewMemory();$settings=['JWT_SECRET'=>'synthetic-review-test-secret-key'];$r=new OMT\ReviewInvitations($s,$settings);
$c=$s->put('tiffins',['customerName'=>'Synthetic Customer','phone'=>'9999999999','status'=>'Active'],true);$id=$c['_id'];
$url=$r->link($id)[1]['data']['link'];parse_str(parse_url($url,PHP_URL_QUERY),$query);$token=$query['review'];check(!str_contains($url,$c['phone'])&&!str_contains($url,'Synthetic'),'No name/mobile in token link');
check($r->link($id)[1]['data']['link']===$url,'Stable personal link');check($r->publicView($token)[1]['data']===['submitted'=>false,'customerName'=>'Synthetic Customer'],'Public exposes only editable name');
denied(fn()=>$r->publicView(substr($token,0,-1).(str_ends_with($token,'0')?'1':'0')),404);
$request='12345678-1234-1234-1234-123456789abc';$send=['customerIds'=>[$id,$id],'requestId'=>$request];$r->send($send,'APPROVED');check(count($s->events)===1,'One selected customer send');$r->send($send,'APPROVED');check(count($s->events)===1,'Repeat save/request no duplicate send');
$pending=array_values($s->events)[0];check($r->eligible($pending),'Eligible unsent invitation');
$oldInvite=$pending;$oldInvite['templateName']='om_tiffin_review_invitation';check(!$r->eligible($oldInvite),'Old Marketing invitation cannot dispatch after Utility switch');
$body=['token'=>$token,'customerName'=>'Edited Customer Name','rating'=>2,'reviewText'=>'Synthetic honest feedback.','status'=>'Rejected','customer'=>'forged'];
$submit=$r->submit($body);check($submit[0]===201,'First review created');$review=$s->all('websitereviews')[0];check($review['status']==='Approved'&&$review['customerName']==='Edited Customer Name'&&$review['customer']===$id,'Auto approve and editable name; server ownership');
check(count($s->events)===2,'One thank-you queued');$thanks=array_values($s->events)[1];check($thanks['kind']==='review-thank-you'&&$thanks['components'][0]['parameters'][0]['image']['link']==='https://www.omtiffinservices.com/review-thank-you.png','Branded card payload');check($r->eligibleThanks($thanks),'Approved review eligible for thank-you');
$oldThanks=$thanks;$oldThanks['templateName']='om_tiffin_review_thank_you';check(!$r->eligibleThanks($oldThanks),'Old Marketing thank-you cannot dispatch after Utility switch');
$r->submit($body);check(count($s->all('websitereviews'))===1&&count($s->events)===2,'Duplicate submission never creates review or thank-you');check($r->publicView($token)[1]['data']===['submitted'=>true],'Used link hides form and name');check(!$r->eligible($pending),'Queued invite cancelled after review');
denied(fn()=>$r->link($id),409);$res=$r->send(['customerIds'=>[$id],'requestId'=>'12345678-1234-1234-1234-123456789def'],'APPROVED');check($res[1]['data']['results'][0]['status']==='review_received','No further invitations after edited-name review');
(new OMT\Catalog($s))->saveReview(['status'=>'Approved'],$review['_id']);check(count($s->events)===2,'Repeated approval never sends another thank-you');
$public=(new OMT\Catalog($s))->reviews(true)[1]['data'][0];check(!isset($public['customer'])&&!isset($public['invitation']),'No private ownership fields in public reviews');
$c2=$s->put('tiffins',['customerName'=>'Synthetic Prior Review','phone'=>'9999999998'],true);$r->mark($c2['_id'],['note'=>'Already reviewed previously.']);check(count($s->all('websitereviews'))===1,'Manual received marker never invents review');denied(fn()=>$r->link($c2['_id']),409);
$c3=$s->put('tiffins',['customerName'=>'Legacy Reviewer','phone'=>'9999999997'],true);$s->put('websitereviews',['customerName'=>'Legacy Reviewer','rating'=>3,'reviewText'=>'Historical','status'=>'Approved'],true);denied(fn()=>$r->link($c3['_id']),409);
$router=new OMT\Router($s,[...$settings,'migration'=>['writesEnabled'=>true]]);denied(fn()=>$router->dispatch('POST','/website-reviews/public',[],['customerName'=>'Fake','rating'=>5,'reviewText'=>'No link']),403);
echo "PASS personal review link privacy/tamper guard, editable name, auto approve, one-use replay/concurrency transaction, no repeat invitations, manual/legacy blocking, public API closed, one approval thank-you/card and public data minimization. Synthetic data; no real messages.\n";
