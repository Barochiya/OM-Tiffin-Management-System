const {sendWhatsAppTemplate}=require('./whatsappSender');
const defaults=require('../config/mealDeliveryWhatsApp.json');
// Enable only after both templates are approved. Credentials stay server-side.
const settings=()=>({
 enabled:process.env.WHATSAPP_DELIVERY_ENABLED === undefined ? defaults.enabled : process.env.WHATSAPP_DELIVERY_ENABLED==='true',
 language:process.env.WHATSAPP_DELIVERY_LANGUAGE || defaults.language,
 dispatchTemplate:process.env.WHATSAPP_DISPATCH_TEMPLATE || defaults.dispatchTemplate,
 deliveredTemplate:process.env.WHATSAPP_DELIVERY_TEMPLATE || defaults.deliveredTemplate,
});
const configured=()=>{const s=settings();return Boolean(s.enabled&&s.language&&s.dispatchTemplate&&s.deliveredTemplate&&process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID);};
const setup=()=>{const s=settings();return {enabled:s.enabled,ready:configured(),language:s.language,dispatchTemplate:s.dispatchTemplate,deliveredTemplate:s.deliveredTemplate};};
const sendDeliveryNotice=async(customer,delivery)=>{
 if(!['Out for delivery','Delivered'].includes(delivery.status))return {status:'not_configured'};
 if(!configured())return {status:'not_configured'};
 const s=settings();const date=String(delivery.date).replace(/^(\d{4})-(\d{2})-(\d{2})$/,'$3/$2/$1');
 try{
  const result=await sendWhatsAppTemplate({to:customer.phone,templateName:delivery.status==='Out for delivery'?s.dispatchTemplate:s.deliveredTemplate,languageCode:s.language,components:[{type:'body',parameters:[customer.customerName,delivery.meal,date].map(text=>({type:'text',text:String(text)}))}]});
  const messageId=result?.messages?.[0]?.id;
  return messageId?{status:'accepted',messageId}:{status:'unknown',error:'Provider acknowledgement missing. Check WhatsApp logs before resending.'};
 }catch(error){return {status:error.meta?'failed':'unknown',error:'WhatsApp notification could not be confirmed. Check provider logs.'};}
};
module.exports={configured,sendDeliveryNotice,setup};
