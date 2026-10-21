<?php
declare(strict_types=1);
namespace OMT;
final class CustomerLoginMessage {
    public static function payload(array $customer,array $account):array {
        $text='Your OM Tiffin Service customer account is ready. Customer Login ID: '.$account['userId'].'. New Customer - Set up your account: https://www.omtiffinservices.com/customer-account-setup . Enter your User ID, verify WhatsApp OTP, then create your own password. Already registered? Login: https://www.omtiffinservices.com/customer-login . Never share your password or OTP.';
        return ['kind'=>'login-id','customerId'=>$customer['_id'],'accountId'=>$account['_id'],'userId'=>$account['userId'],'customerName'=>$customer['customerName']??'Customer','to'=>$customer['phone'],'templateName'=>'om_tiffin_service_update','languageCode'=>'en_GB','components'=>[['type'=>'body','parameters'=>[['type'=>'text','text'=>preg_replace('/\s+/u',' ',trim($customer['customerName']??'Customer'))],['type'=>'text','text'=>$text]]]]];
    }
}
