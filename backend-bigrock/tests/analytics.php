<?php
declare(strict_types=1);
require dirname(__DIR__).'/config.php';require dirname(__DIR__).'/analytics.php';
function check(bool $value,string $message):void{if(!$value)throw new RuntimeException($message);}
check(OMT\analyticsDb(['analytics'=>['enabled'=>false]])===null,'Disabled analytics must not open storage');
$business=['name'=>'maapn1f6_omtiffin','user'=>'maapn1f6_omtiffin'];
foreach([
    ['host'=>'localhost','name'=>'maapn1f6_omtiffin','user'=>'analytics_only','password'=>'synthetic'],
    ['host'=>'localhost','name'=>'analytics_only','user'=>'maapn1f6_omtiffin','password'=>'synthetic'],
] as $database){$blocked=false;try{OMT\analyticsDb(['database'=>$business,'analytics'=>['enabled'=>true,'database'=>$database]]);}catch(RuntimeException $e){$blocked=str_contains($e->getMessage(),'isolated');}check($blocked,'Analytics must reject a shared business database or user before connecting');}
$schema=file_get_contents(dirname(__DIR__).'/analytics-schema.sql');check(!preg_match('/^\s*USE\s+/mi',$schema),'Analytics schema must not select any database');check(!preg_match('/^\s*(?:ALTER|DROP|TRUNCATE)\s+/mi',$schema),'Analytics schema must not mutate existing tables');
check(OMT\VisitorAnalytics::clientIp('203.0.113.7','198.51.100.4',['10.0.0.0/8'])==='203.0.113.7','Untrusted proxy header must be ignored');
check(OMT\VisitorAnalytics::clientIp('10.0.0.9','198.51.100.4, 10.0.0.8',['10.0.0.0/8'])==='198.51.100.4','Trusted proxy chain resolution failed');
check(OMT\VisitorAnalytics::maskIp('192.0.2.45')==='192.0.***.***','IPv4 masking failed');
$mobile=OMT\VisitorAnalytics::parseUserAgent('Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Chrome/130.0.0.0');check($mobile['device']==='Mobile'&&$mobile['os']==='Android'&&$mobile['browser']==='Chrome','User agent classification failed');
echo "PASS visitor analytics isolation/privacy: disabled-by-default storage, separate database/user enforcement, trusted proxy resolution, masked IP and conservative device detection.\n";
