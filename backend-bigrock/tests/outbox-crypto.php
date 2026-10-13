<?php
declare(strict_types=1);
require dirname(__DIR__).'/outbox-crypto.php';
function check(bool $v):void{if(!$v)throw new RuntimeException('Outbox encryption assertion failed');}
function denied(callable $f):void{try{$f();}catch(Throwable){return;}throw new RuntimeException('Expected authentication failure');}
$key='synthetic-private-key-for-tests';$event='otp:synthetic:1';$payload=['to'=>'919999999999','otp'=>'123456','description'=>'Synthetic Gujarati પરીક્ષણ'];
$first=OMT\OutboxCrypto::encode($event,$payload,$key);$second=OMT\OutboxCrypto::encode($event,$payload,$key);check($first!==$second);check(!str_contains($first,'123456'));check(!str_contains($first,'919999999999'));check(OMT\OutboxCrypto::decode($event,$first,$key)===$payload);
denied(fn()=>OMT\OutboxCrypto::decode('otp:other',$first,$key));denied(fn()=>OMT\OutboxCrypto::decode($event,$first,'different-synthetic-private-key'));
$tampered=json_decode($first,true);$bytes=base64_decode($tampered['ciphertext']);$bytes[0]=chr(ord($bytes[0])^1);$tampered['ciphertext']=base64_encode($bytes);denied(fn()=>OMT\OutboxCrypto::decode($event,json_encode($tampered),$key));
denied(fn()=>OMT\OutboxCrypto::decode($event,json_encode($payload),$key));
echo "PASS private outbox encryption: random IVs, no plaintext OTP/recipient, UTF-8 roundtrip, event binding, wrong-key and tamper rejection. Synthetic data only.\n";
