<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
umask(0077);
$base='/home1/maapn1f6/omtiffin-private';
if(!is_file($base.'/current-release.txt'))exit;
$revision=trim(file_get_contents($base.'/current-release.txt'));
if(!preg_match('/^[a-f0-9]{40}$/D',$revision))throw new RuntimeException('Invalid active OM release');
putenv('OMTIFFIN_CONFIG='.$base.'/private/config.local.json');
$argv=[__FILE__,'--scheduled'];
require $base.'/releases/'.$revision.'/php/worker.php';
