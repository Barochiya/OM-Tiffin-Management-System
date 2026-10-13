<?php
declare(strict_types=1);
namespace OMT;
final class OutboxCrypto {
    private static function key(string $secret):string {if(strlen($secret)<16)throw new \RuntimeException('Private outbox key unavailable');return hash_hkdf('sha256',$secret,32,'omtiffin-outbox-v1');}
    public static function encode(string $eventKey,array $payload,string $secret):string {
        $iv=random_bytes(12);$tag='';$cipher=openssl_encrypt(json_encode($payload,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),'aes-256-gcm',self::key($secret),OPENSSL_RAW_DATA,$iv,$tag,$eventKey,16);
        if($cipher===false)throw new \RuntimeException('Private outbox encryption failed');
        return json_encode(['format'=>'omtiffin-encrypted-v1','iv'=>base64_encode($iv),'tag'=>base64_encode($tag),'ciphertext'=>base64_encode($cipher)],JSON_THROW_ON_ERROR);
    }
    public static function decode(string $eventKey,string $encoded,string $secret):array {
        $data=json_decode($encoded,true,512,JSON_THROW_ON_ERROR);
        if(($data['format']??null)!=='omtiffin-encrypted-v1')throw new \RuntimeException('Unsupported private outbox format');
        $iv=base64_decode($data['iv']??'',true);$tag=base64_decode($data['tag']??'',true);$cipher=base64_decode($data['ciphertext']??'',true);
        if($iv===false||strlen($iv)!==12||$tag===false||strlen($tag)!==16||$cipher===false)throw new \RuntimeException('Invalid private outbox envelope');
        $plain=openssl_decrypt($cipher,'aes-256-gcm',self::key($secret),OPENSSL_RAW_DATA,$iv,$tag,$eventKey);
        if($plain===false)throw new \RuntimeException('Private outbox authentication failed');
        $payload=json_decode($plain,true,512,JSON_THROW_ON_ERROR);if(!is_array($payload))throw new \RuntimeException('Invalid private outbox payload');return $payload;
    }
}
