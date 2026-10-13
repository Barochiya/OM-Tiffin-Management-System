<?php
declare(strict_types=1);
namespace OMT;
final class HttpError extends \RuntimeException {
    public function __construct(public readonly int $status, string $message, public readonly array $details=[]) { parent::__construct($message); }
}
function b64url(string $data): string { return rtrim(strtr(base64_encode($data),'+/','-_'),'='); }
function decode64(string $data): string {
    if (!preg_match('/^[A-Za-z0-9_-]+$/D',$data)) throw new HttpError(401,'Token Failed');
    $result=base64_decode(strtr($data,'-_','+/'),true);
    if($result===false)throw new HttpError(401,'Token Failed');
    return $result;
}
function signToken(array $claims,string $secret,int $lifetime): string {
    if(strlen($secret)<16)throw new \RuntimeException('Authentication secret unavailable');
    $header=b64url('{"alg":"HS256","typ":"JWT"}');
    $body=b64url(json_encode([...$claims,'iat'=>time(),'exp'=>time()+$lifetime],JSON_THROW_ON_ERROR));
    return $header.'.'.$body.'.'.b64url(hash_hmac('sha256',$header.'.'.$body,$secret,true));
}
function verifyToken(string $token,string $secret,?int $now=null): array {
    $now??=time();
    if(strlen($secret)<16)throw new HttpError(503,'Authentication is not configured');
    $parts=explode('.',$token);
    if(count($parts)!==3)throw new HttpError(401,'Token Failed');
    try {
        $header=json_decode(decode64($parts[0]),true,16,JSON_THROW_ON_ERROR);
        $claims=json_decode(decode64($parts[1]),true,64,JSON_THROW_ON_ERROR);
    }catch(\Throwable){throw new HttpError(401,'Token Failed');}
    if(($header['alg']??'')!=='HS256'||!is_array($claims)||!hash_equals(b64url(hash_hmac('sha256',$parts[0].'.'.$parts[1],$secret,true)),$parts[2]))throw new HttpError(401,'Token Failed');
    if(isset($claims['exp'])&&(!is_numeric($claims['exp'])||$claims['exp']<=$now))throw new HttpError(401,'Token Failed');
    if(isset($claims['nbf'])&&(!is_numeric($claims['nbf'])||$claims['nbf']>$now))throw new HttpError(401,'Token Failed');
    if(!isset($claims['id'])||!is_string($claims['id'])||!preg_match('/^[a-f0-9]{24}$/iD',$claims['id']))throw new HttpError(401,'Token Failed');
    return $claims;
}
function bearer(): string {
    $header=$_SERVER['HTTP_AUTHORIZATION']??'';
    if(!preg_match('/^Bearer\s+(\S+)$/D',$header,$matches))throw new HttpError(401,'Not Authorized. No Token');
    return $matches[1];
}
function safeAccount(array $account): array {
    unset($account['password'],$account['passwordHash'],$account['otpHash'],$account['setupTokenHash'],$account['resetTokenHash']);
    return $account;
}
function requireAdmin(Store $store,?array $settings=null,?string $token=null): array {
    $settings??=config();$claims=verifyToken($token??bearer(),$settings['JWT_SECRET']??'');
    if(isset($claims['type'])&&$claims['type']!=='admin')throw new HttpError(401,'Token Failed');
    $admin=$store->get('admins',$claims['id']);
    if(!$admin)throw new HttpError(401,'Admin account not found');
    return safeAccount($admin);
}
function requireCustomer(Store $store,bool $passwordChanged=true,?array $settings=null,?string $token=null): array {
    $settings??=config();$claims=verifyToken($token??bearer(),$settings['CUSTOMER_JWT_SECRET']??'');
    if(($claims['type']??'')!=='customer')throw new HttpError(401,'Invalid customer token');
    $account=$store->get('customeraccounts',$claims['id']);
    if(!$account)throw new HttpError(401,'Customer account not found');
    if(empty($account['loginEnabled']))throw new HttpError(403,'Customer login is disabled');
    if($passwordChanged&&!empty($account['isFirstLogin']))throw new HttpError(403,'Please change your temporary password before accessing the customer portal',['code'=>'FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED']);
    return safeAccount($account);
}
