const definitions = [
  ['orders','WebsiteOrder',{orderStatus:'Pending'},'Website orders awaiting confirmation','/website-orders'],
  ['reviews','WebsiteReview',{status:'Pending'},'Reviews awaiting approval','/website-reviews'],
  ['modifications','CustomerModificationRequest',{status:'PENDING'},'Tiffin requests awaiting approval','/customer-modification-requests'],
  ['payments','WhatsAppMessage',{direction:'incoming',paymentStatus:'pending_review'},'Payment screenshots awaiting review','/whatsapp-payment-approval'],
  ['messages','WhatsAppMessage',{direction:'incoming',inboxStatus:'unread',paymentStatus:{$ne:'pending_review'}},'Unread WhatsApp messages','/whatsapp-inbox'],
  ['bills','Bill',{'whatsappDelivery.status':{$in:['pending','failed']}},'Bills awaiting delivery / failed','/bill-delivery-status'],
  ['announcements','AnnouncementDelivery',{status:{$in:['pending','failed']}},'Announcements awaiting delivery / failed','/announcement-delivery-status']
];
const models = Object.fromEntries(definitions.map(([,name])=>[name,require('../models/'+name)]));
exports.getAdminNotifications = async (req,res) => {
  const results = await Promise.allSettled(definitions.map(async ([id,name,filter,title,path]) => {
    const count = await models[name].countDocuments(filter);
    return {id,title,path,count};
  }));
  const categories = results.flatMap(result=>result.status==='fulfilled' ? [result.value] : []);
  const unavailable = definitions.filter((_,index)=>results[index].status==='rejected').map(([id])=>id);
  res.json({success:true,total:categories.reduce((sum,item)=>sum+item.count,0),categories,unavailable,updatedAt:new Date()});
};
