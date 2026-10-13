<?php
declare(strict_types=1);
require __DIR__.'/accounts.php';
$s=new AccountStore();$settings=['WHATSAPP_SEND_SECRET'=>'synthetic-service-secret','WHATSAPP_API_VERSION'=>'v26.0'];$calls=[];
$w=new OMT\WhatsApp($s,$settings,function($url,$limit)use(&$calls){$calls[]=$url;return count($calls)===1?json_encode(['url'=>'https://lookaside.fbsbx.com/media/synthetic','mime_type'=>'image/jpeg']):'synthetic-binary';});
denied(fn()=>$w->authenticate('wrong'),401);$w->authenticate('synthetic-service-secret');denied(fn()=>$w->send(['to'=>'invalid','message'=>'hello','type'=>'text']),400);
check($w->send(['to'=>'9999999999','type'=>'text','message'=>'Synthetic only'])[1]['data']['queued']===true);check(count($s->events)===1&&count($calls)===0);
$message=$s->put('whatsappmessages',['mediaId'=>'12345'],true);$binary=$w->media($message['_id'])[1];check($binary->bytes==='synthetic-binary'&&$binary->mime==='image/jpeg');check(count($calls)===2);
$bad=new OMT\WhatsApp($s,$settings,fn()=>json_encode(['url'=>'https://attacker.invalid/steal-token']));denied(fn()=>$bad->media($message['_id']),502);
echo "PASS service-secret authentication, queued-only sends, recipient validation, media ownership lookup/host restriction, binary output; fake transport only.\n";
