<?php
declare(strict_types=1);
require dirname(__DIR__).'/http.php';
final class HttpStore extends OMT\Store {
    public function __construct(){}
    public function all(string $c):array{return [];}
    public function get(string $c,string $id):?array{return null;}
}
$app=new OMT\HttpApplication(new OMT\Router(new HttpStore(),['JWT_SECRET'=>'synthetic-admin-secret','CUSTOMER_JWT_SECRET'=>'synthetic-customer-secret','migration'=>['writesEnabled'=>false]]));
function check(bool $test):void{if(!$test)throw new RuntimeException('HTTP boundary assertion failed');}
check($app->handle('GET','/api',[],'')[0]===200);
$cors=$app->handle('OPTIONS','/api/payments',['Origin'=>'https://www.omtiffinservices.com'],'');check($cors[0]===204&&$cors[1]['Access-Control-Allow-Origin']==='https://www.omtiffinservices.com');
check($app->handle('GET','/api',['Origin'=>'https://attacker.invalid'],'')[0]===403);
foreach(['{broken','[]','null','"scalar"']as $raw)check($app->handle('POST','/api/admin/login',['Content-Type'=>'application/json'],$raw)[0]===400);
check($app->handle('POST','/api/admin/login',['Content-Type'=>'application/json'],str_repeat(' ',102401))[0]===413);
check($app->handle('POST','/api/admin/login',['Content-Type'=>'text/plain'],'hello')[0]===415);
check($app->handle('GET','/api/payments',['Authorization'=>'Basic password'],'')[0]===401);
check($app->handle('GET','/api/payments',[],'')[0]===401);
check($app->handle('GET','/api/missing',[],'')[0]===404);
check(!str_contains($app->handle('GET','/api/payments',[],'')[2],'password'));
echo "PASS HTTP boundary: strict OM origins, preflight, JSON object/size/type limits, authorization, missing routes, no secret disclosure.\n";
