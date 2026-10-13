<?php
declare(strict_types=1);
namespace OMT;
ini_set('display_errors','0');
require_once __DIR__.'/config.php';require_once __DIR__.'/http.php';
try {
    $settings=config();
    if(empty($settings['migration']['apiEnabled'])){http_response_code(503);header('Content-Type: application/json');header('Cache-Control: no-store');echo '{"success":false,"message":"OM Tiffin migration is being verified. Please use the current service."}';exit;}
    $store=new Store(db());$headers=function_exists('getallheaders')?getallheaders():[];
    if(!isset($headers['Authorization'])&&!isset($headers['authorization'])&&isset($_SERVER['HTTP_AUTHORIZATION']))$headers['Authorization']=$_SERVER['HTTP_AUTHORIZATION'];
    // PHP rewrites dots in query parameter names; Meta requires the original dotted names.
    $query=[];foreach(explode('&',$_SERVER['QUERY_STRING']??'')as $pair){if($pair==='')continue;[$key,$value]=array_pad(explode('=',$pair,2),2,'');$query[urldecode($key)]=urldecode($value);}
    $files=[];
    if(isset($_FILES['pdf'])){$upload=$_FILES['pdf'];if(($upload['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK||!is_uploaded_file($upload['tmp_name']??'')||(int)($upload['size']??0)>10*1024*1024)throw new HttpError(400,'Valid PDF upload is required.');$files['pdf']=file_get_contents($upload['tmp_name']);}
    $input=fopen('php://input','rb');$raw=stream_get_contents($input,10*1024*1024+1);fclose($input);
    $application=new HttpApplication(new Router($store,$settings),new Webhook($store,$settings),new WhatsApp($store,$settings),!empty($settings['migration']['stagingOriginEnabled']));
    [$status,$responseHeaders,$bytes]=$application->handle($_SERVER['REQUEST_METHOD']??'GET',$_SERVER['REQUEST_URI']??'/',$headers,$raw,$query,$_POST,$files);
    http_response_code($status);foreach($responseHeaders as $key=>$value)header($key.': '.$value);echo $bytes;
}catch(HttpError $e){http_response_code($e->status);header('Content-Type: application/json');header('Cache-Control: no-store');echo json_encode(['success'=>false,'message'=>$e->getMessage()]);}
catch(\Throwable){http_response_code(503);header('Content-Type: application/json');header('Cache-Control: no-store');echo '{"success":false,"message":"OM Tiffin API is unavailable."}';}
