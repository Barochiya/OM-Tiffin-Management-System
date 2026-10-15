<?php
declare(strict_types=1);
require __DIR__.'/accounts.php';
$s=new AccountStore();$settings=['META_APP_SECRET'=>'synthetic-meta-secret','WHATSAPP_VERIFY_TOKEN'=>'synthetic-verify','WHATSAPP_PHONE_NUMBER_ID'=>'123'];$w=new OMT\Webhook($s,$settings);
denied(fn()=>$w->verify(['hub.mode'=>'subscribe','hub.verify_token'=>'wrong']),403);check($w->verify(['hub.mode'=>'subscribe','hub.verify_token'=>'synthetic-verify','hub.challenge'=>'12345'])[1]->text==='12345');
$customer=$s->put('tiffins',['customerName'=>'Synthetic','phone'=>'9999999999'],true);
$body=['object'=>'whatsapp_business_account','entry'=>[['changes'=>[['value'=>['metadata'=>['phone_number_id'=>'123'],'messages'=>[['id'=>'synthetic-wamid','from'=>'919999999999','type'=>'image','timestamp'=>'1791878400','image'=>['id'=>'12345','mime_type'=>'image/jpeg','caption'=>'Payment done']]]]]]]]];
$raw=json_encode($body);$signature='sha256='.hash_hmac('sha256',$raw,$settings['META_APP_SECRET']);$w->authenticate($raw,$signature);denied(fn()=>$w->authenticate($raw.' ',$signature),401);denied(fn()=>(new OMT\Webhook($s,[]))->authenticate($raw,$signature),503);
$w->receive($body);$w->receive($body);check(count($s->all('whatsappmessages'))===1);$message=$s->all('whatsappmessages')[0];check($message['customer']===$customer['_id']&&$message['paymentStatus']==='pending_review'&&$message['mediaId']==='12345');
$bill=$s->put('bills',['customer'=>$customer['_id'],'whatsappDelivery'=>['messageId'=>'synthetic-outbound','status'=>'sent']],true);
$announcement=$s->put('announcementdeliveries',['whatsappMessageId'=>'synthetic-outbound','status'=>'sent'],true);
$statusBody=['object'=>'whatsapp_business_account','entry'=>[['changes'=>[['value'=>['metadata'=>['phone_number_id'=>'123'],'statuses'=>[['id'=>'synthetic-outbound','status'=>'read','timestamp'=>'1791878400'],['id'=>'synthetic-outbound','status'=>'delivered','timestamp'=>'1791878401']]]]]]]];
$w->receive($statusBody);check($s->get('bills',$bill['_id'])['whatsappDelivery']['status']==='read');check($s->get('announcementdeliveries',$announcement['_id'])['status']==='read');
$body['entry'][0]['changes'][0]['value']['metadata']['phone_number_id']='another';$body['entry'][0]['changes'][0]['value']['messages'][0]['id']='another';$w->receive($body);check(count($s->all('whatsappmessages'))===1);check(count($s->events)===0);
echo "PASS signed raw webhooks, challenge, required app secret, duplicate incoming suppression, customer/media mapping, payment review, monotonic status, foreign phone-ID isolation; zero provider calls.\n";

$receipt=$s->put('payments',['customer'=>$customer['_id'],'whatsappDelivery'=>['messageId'=>'synthetic-receipt','status'=>'sent']],true);
$receiptBody=$statusBody;$receiptBody['entry'][0]['changes'][0]['value']['statuses']=[['id'=>'synthetic-receipt','status'=>'delivered','timestamp'=>'1791878400'],['id'=>'synthetic-receipt','status'=>'read','timestamp'=>'1791878401'],['id'=>'synthetic-receipt','status'=>'sent','timestamp'=>'1791878402']];
$w->receive($receiptBody);$delivery=$s->get('payments',$receipt['_id'])['whatsappDelivery'];check($delivery['status']==='read'&&$delivery['delivered']===true&&isset($delivery['deliveredAt'],$delivery['readAt']));
$w->receive($receiptBody);check($s->get('payments',$receipt['_id'])['whatsappDelivery']['status']==='read');
echo "PASS receipt delivery/read timestamps, monotonic status and duplicate callbacks; no customer sends.\n";
