<?php
declare(strict_types=1);
namespace OMT;
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/config.php';
try{
    foreach(['pdo_mysql','openssl','curl','mbstring']as $extension)if(!extension_loaded($extension))throw new \RuntimeException('Required extension unavailable');
    if(!function_exists('proc_open'))throw new \RuntimeException('Private document renderer unavailable');
    $pdo=db();foreach(['omt_documents','omt_collections','omt_operations','omt_outbox']as $table)$pdo->query('SELECT COUNT(*) FROM '.$table)->fetchColumn();
    echo "OM_TIFFIN_RELEASE_HEALTH_OK\n";
}catch(\Throwable){fwrite(STDERR,"OM_TIFFIN_RELEASE_HEALTH_FAILED\n");exit(1);}
