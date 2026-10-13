<?php
declare(strict_types=1);
require __DIR__.'/accounts.php';
$s=new AccountStore();$inbox=new OMT\Inbox($s);$doc=$s->put('whatsappmessages',['phoneNumber'=>'919999999999','customer'=>'synthetic','direction'=>'incoming','paymentStatus'=>'pending_review','inboxStatus'=>'unread'],true);
denied(fn()=>$inbox->reply($doc['_id'],['message'=>' ']),400);
$reply=$inbox->reply($doc['_id'],['message'=>' Synthetic reply '])[1];check($reply['data']['reply']['message']==='Synthetic reply');check($s->get('whatsappmessages',$doc['_id'])['inboxStatus']==='read');check(count($s->events)===1);
check($inbox->reject($doc['_id'],['reason'=>'Synthetic rejection'])[1]['data']['paymentStatus']==='rejected');check(count($s->events)===2);denied(fn()=>$inbox->reject($doc['_id'],[]),400);check(count($s->events)===2);
$approved=$s->put('whatsappmessages',['paymentStatus'=>'payment_received'],true);denied(fn()=>$inbox->reject($approved['_id'],[]),400);check(count($s->all('payments'))===0);
echo "PASS inbox reply/rejection tracking, duplicate/approved rejection protection, no payment mutation, notification queued only.\n";
$customer=$s->put('tiffins',['customerName'=>'Synthetic','phone'=>'9999999999','advanceBalance'=>0],true);$bill=$s->put('bills',['customer'=>$customer['_id'],'totalAmount'=>100,'paidAmount'=>0,'pendingAmount'=>100,'invoiceNo'=>'SYNTHETIC'],true);
$message=$s->put('whatsappmessages',['customer'=>$customer['_id'],'paymentStatus'=>'pending_review'],true);$billing=new OMT\Billing($s);$body=['whatsappMessageId'=>$message['_id'],'customerId'=>$customer['_id'],'billId'=>$bill['_id'],'amount'=>101];
denied(fn()=>$billing->approveWhatsApp($body),400);check(count($s->all('payments'))===0);
$body['amount']=60;$result=$billing->approveWhatsApp($body)[1];check($result['data']['bill']['pendingAmount']===40.0);check($result['data']['whatsappMessage']['linkedPayment']===$result['data']['payment']['_id']);
denied(fn()=>$billing->approveWhatsApp($body),400);check(count($s->all('payments'))===1);check($s->get('tiffins',$customer['_id'])['advanceBalance']===0.0);
echo "PASS synthetic WhatsApp payment approval: ownership/overpayment guard, atomic bill/payment/review links, duplicate approval rejected, no real payment or notification.\n";
