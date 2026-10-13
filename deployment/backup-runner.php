<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
umask(0077);
$base='/home1/maapn1f6/omtiffin-private';
$revision=is_file($base.'/current-release.txt')?trim(file_get_contents($base.'/current-release.txt')):'';
if($revision!==''&&!preg_match('/^[a-f0-9]{40}$/D',$revision))throw new RuntimeException('Invalid active OM release');
$runtime=$revision!==''?$base.'/releases/'.$revision.'/php':$base.'/php';
$config=$base.'/private/'.($revision!==''?'config.local.json':'config.staging.json');
putenv('OMTIFFIN_CONFIG='.$config);
require $runtime.'/backup.php';
