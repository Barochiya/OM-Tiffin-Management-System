<?php
declare(strict_types=1);
namespace OMT;

final class PaymentEvidence {
    public static function reference(mixed $value):string {
        if(!is_string($value))throw new HttpError(400,'Enter a valid payment reference');
        $reference=strtoupper(trim($value));
        if(strlen($reference)>160||($reference!==''&&!preg_match('/^[A-Z0-9][A-Z0-9 .\/-]*$/D',$reference)))throw new HttpError(400,'Enter a valid UTR or payment reference');
        return preg_replace('/\s+/','',$reference);
    }
    public static function assertUnused(Store $store,string $reference,string $hash=''):void {
        $records=$store->all('payments');
        foreach($store->all('wallettopups') as $row)if(($row['status']??'')==='approved')$records[]=$row;
        foreach($store->all('walkincustomers') as $row)foreach($row['payments']??[] as $payment)$records[]=$payment;
        foreach($records as $record){
            if(($record['status']??'Success')==='Failed')continue;
            $other=preg_replace('/\s+/','',strtoupper(trim((string)($record['transactionId']??$record['reference']??''))));
            if($reference!==''&&$reference===$other)throw new HttpError(409,'This payment reference was already approved. Check the original transaction.');
            if($hash!==''&&hash_equals($hash,(string)($record['proofSha256']??'')))throw new HttpError(409,'This screenshot was already used for an approved payment.');
        }
    }
    public static function proof(Store $store,array $settings,string $messageId,string $customer):string {
        $message=$store->get('whatsappmessages',$messageId)??throw new HttpError(404,'Payment screenshot not found');
        if(($message['customer']??null)!==$customer||($message['type']??null)!=='image'||($message['direction']??null)!=='incoming')throw new HttpError(400,'Select this customer’s incoming payment screenshot');
        $media=(new WhatsApp($store,$settings))->media($messageId)[1];
        $hash=hash('sha256',$media->bytes);
        $store->transaction(function()use($store,$message,$hash){$message['proofSha256']=$hash;$store->put('whatsappmessages',$message);});
        return $hash;
    }
}
