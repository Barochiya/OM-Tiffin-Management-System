<?php
declare(strict_types=1);
namespace OMT;
require_once __DIR__.'/router.php';
final class HttpApplication {
    public function __construct(private readonly Router $router,private readonly ?Webhook $webhook=null,private readonly ?WhatsApp $whatsapp=null){}
    public function handle(string $method,string $uri,array $headers,string $raw,array $query=[],array $form=[],array $files=[]):array {
        $headers=array_change_key_case($headers,CASE_LOWER);$method=strtoupper($method);
        $response=['Cache-Control'=>'no-store','X-Content-Type-Options'=>'nosniff','Referrer-Policy'=>'same-origin'];
        try {
            $origin=$headers['origin']??null;
            if($origin!==null){
                if(!in_array($origin,['https://omtiffinservices.com','https://www.omtiffinservices.com'],true))throw new HttpError(403,'Origin is not allowed.');
                $response['Access-Control-Allow-Origin']=$origin;$response['Vary']='Origin';$response['Access-Control-Allow-Credentials']='true';
            }
            if($method==='OPTIONS')return [204,[...$response,'Access-Control-Allow-Methods'=>'GET, POST, PUT, PATCH, DELETE, OPTIONS','Access-Control-Allow-Headers'=>'Content-Type, Authorization, X-Bill-ID, X-Payment-ID, Idempotency-Key','Access-Control-Max-Age'=>'600'],''];
            $path=parse_url($uri,PHP_URL_PATH);if(!is_string($path)||str_contains($path,"\0"))throw new HttpError(400,'Invalid request path.');
            if($method==='POST'&&$path==='/api/whatsapp/webhook'){if(!$this->webhook)throw new HttpError(503,'Webhook verification is unavailable.');$this->webhook->authenticate($raw,$headers['x-hub-signature-256']??null);}
            if($method==='POST'&&$path==='/api/whatsapp/send'){if(!$this->whatsapp)throw new HttpError(503,'WhatsApp service is unavailable.');$this->whatsapp->authenticate($headers['x-whatsapp-send-secret']??null);}
            if($method==='GET'&&in_array($path,['/','/api','/api/'],true))return $this->json(200,$response,['message'=>'OM Tiffin API']);
            $body=[];
            $contentType=strtolower(trim(explode(';',$headers['content-type']??'')[0]));
            if($method==='POST'&&$path==='/api/bills/send-whatsapp'&&$contentType==='multipart/form-data'){
                $body=$form;$body['_pdfBytes']=$files['pdf']??'';if(!is_string($body['_pdfBytes'])||strlen($body['_pdfBytes'])>10*1024*1024)throw new HttpError(413,'PDF file is too large.');$raw='';
            }
            if($method==='POST'&&$path==='/api/payments/send-whatsapp'&&$contentType==='application/pdf'){
                if(strlen($raw)>10*1024*1024)throw new HttpError(413,'PDF file is too large.');$body=['paymentId'=>$headers['x-payment-id']??'','_pdfBytes'=>$raw];$raw='';
            }
            if($raw!==''){
                $type=strtolower(trim(explode(';',$headers['content-type']??'')[0]));
                $limit=str_starts_with($path,'/api/document-design')?800*1024:100*1024;
                if(strlen($raw)>$limit)throw new HttpError(413,'Request body is too large.');
                if($type==='application/json'){
                    try{$value=json_decode($raw,false,64,JSON_THROW_ON_ERROR);}catch(\JsonException){throw new HttpError(400,'Invalid JSON request.');}
                    if(!is_object($value))throw new HttpError(400,'JSON request must be an object.');
                    $body=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
                }elseif($type==='application/x-www-form-urlencoded'){parse_str($raw,$body);}
                else throw new HttpError(415,'Unsupported request content type.');
            }
            $token=null;$authorization=$headers['authorization']??'';
            if($authorization!==''){if(!preg_match('/^Bearer ([A-Za-z0-9._-]+)$/D',$authorization,$match))throw new HttpError(401,'Token Failed');$token=$match[1];}
            [$status,$data]=$this->router->dispatch($method,$path,$query,$body,$token,$headers['idempotency-key']??null);
            if($data instanceof TextResponse)return [$status,[...$response,'Content-Type'=>'text/plain; charset=utf-8'],$data->text];
            if($data instanceof BinaryResponse)return [$status,[...$response,'Content-Type'=>$data->mime,'Content-Disposition'=>'attachment','Content-Length'=>(string)strlen($data->bytes)],$data->bytes];
            if($data instanceof PdfResponse)return [$status,[...$response,'Content-Type'=>'application/pdf','Content-Disposition'=>'inline; filename="'.$data->filename.'"','Content-Length'=>(string)strlen($data->bytes)],$data->bytes];
            return $this->json($status,$response,$data);
        }catch(HttpError $e){return $this->json($e->status,$response,['success'=>false,'message'=>$e->getMessage(),...$e->details]);}
        catch(\Throwable){return $this->json(500,$response,['success'=>false,'message'=>'Unable to complete request.']);}
    }
    private function json(int $status,array $headers,mixed $data):array{return [$status,[...$headers,'Content-Type'=>'application/json; charset=utf-8'],json_encode($data,JSON_THROW_ON_ERROR|JSON_INVALID_UTF8_SUBSTITUTE)];}
}
