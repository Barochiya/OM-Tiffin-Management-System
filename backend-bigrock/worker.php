<?php
declare(strict_types=1);
namespace OMT;
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require_once __DIR__.'/config.php';require_once __DIR__.'/outbox.php';
try{
    $settings=config();$flags=$settings['migration']??[];
    if(empty($flags['workersEnabled'])||empty($flags['externalMessagesEnabled']))exit;
    $store=new Store(db());$keys=[];$mode=$argv[1]??'';
    if($mode==='--scheduled'){
        if(($flags['scheduledMessagesApproved']??false)!==true)throw new \RuntimeException('Scheduled customer messages need explicit activation approval');
        $minimum=$flags['minimumOutboxId']??null;if(!is_int($minimum)||$minimum<1)throw new \RuntimeException('Notification cutover boundary is required');
        require_once __DIR__.'/pg.php';(new Pg($store,$settings))->reminders();
        $query=db()->prepare("SELECT event_key FROM omt_outbox WHERE id>=? AND status='pending' AND available_at<=UTC_TIMESTAMP(3) ORDER BY id LIMIT 25");$query->execute([$minimum]);$keys=$query->fetchAll(\PDO::FETCH_COLUMN);
    }elseif($mode==='--approved-events'){
        $file=realpath($argv[2]??'');$private=realpath('/home1/maapn1f6/omtiffin-private/private');
        if(!$file||!$private||dirname($file)!==$private)throw new \RuntimeException('Approved events must be in the private configuration directory');
        $keys=json_decode(file_get_contents($file),true,64,JSON_THROW_ON_ERROR);if(!is_array($keys)||!array_is_list($keys))throw new \RuntimeException('Invalid approved event list');
    }else throw new \RuntimeException('Explicit worker mode required');
    if(!$keys)exit;
    $transport=new WhatsAppTransport($settings);$worker=new OutboxWorker($store,$settings,fn($payload)=>$transport->template($payload));
    $outcomes=$worker->runApproved($keys);$counts=array_count_values(array_values($outcomes));
    echo json_encode(['processed'=>count($outcomes),'outcomes'=>$counts],JSON_THROW_ON_ERROR).PHP_EOL;
}catch(\Throwable){fwrite(STDERR,"OM_TIFFIN_WORKER_STOPPED: review private configuration and approved event scope.\n");exit(1);}
