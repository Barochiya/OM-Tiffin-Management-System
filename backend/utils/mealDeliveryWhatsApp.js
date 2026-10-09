const {sendWhatsAppTemplate}=require('./whatsappSender');
// Approved utility template body parameters: customer name, meal, date.
// Disabled until the approved template and explicit activation are configured.
const configured=()=>process.env.WHATSAPP_DELIVERY_ENABLED==='true'&&Boolean(process.env.WHATSAPP_DELIVERY_TEMPLATE&&process.env.WHATSAPP_DELIVERY_LANGUAGE);
const sendDeliveryNotice=async(customer,delivery)=>{
 if(!configured())return {status:'not_configured'};
 try{
  const result=await sendWhatsAppTemplate({to:customer.phone,templateName:process.env.WHATSAPP_DELIVERY_TEMPLATE,languageCode:process.env.WHATSAPP_DELIVERY_LANGUAGE,components:[{type:'body',parameters:[customer.customerName,delivery.meal,delivery.date].map(text=>({type:'text',text:String(text)}))}]});
  const messageId=result?.messages?.[0]?.id;
  return messageId?{status:'accepted',messageId}:{status:'unknown',error:'Provider acknowledgement missing. Check WhatsApp logs before resending.'};
 }catch(error){return {status:error.meta?'failed':'unknown',error:'WhatsApp notification could not be confirmed. Check provider logs.'};}
};
module.exports={configured,sendDeliveryNotice};
