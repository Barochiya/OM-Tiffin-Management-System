<?php
declare(strict_types=1);
require dirname(__DIR__).'/security.php';
use function OMT\{signToken,verifyToken,b64url};
function check(bool $value): void { if(!$value)throw new RuntimeException('Test failed'); }
function rejects(callable $fn): void {try{$fn();}catch(OMT\HttpError){return;}throw new RuntimeException('Expected rejection');}
$secret='synthetic-auth-secret-only-for-tests';
$id='507f1f77bcf86cd799439011';
$token=signToken(['id'=>$id,'type'=>'customer'],$secret,3600);
check(verifyToken($token,$secret)['id']===$id);
rejects(fn()=>verifyToken($token,$secret.'changed'));
rejects(fn()=>verifyToken($token,$secret,time()+3601));
rejects(fn()=>verifyToken('eyJhbGciOiJub25lIn0.'.b64url('{"id":"'.$id.'"}').'.x',$secret));
$parts=explode('.',$token);$parts[1]=b64url('{"id":"000000000000000000000000"}');
rejects(fn()=>verifyToken(implode('.',$parts),$secret));
check(password_verify('synthetic-password',password_hash('synthetic-password',PASSWORD_BCRYPT)));
echo "PASS PHP auth: signed token, wrong key, expiry, algorithm confusion, changed identity, bcrypt compatibility\n";
