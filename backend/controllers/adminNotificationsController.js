const State = require('../models/AdminNotificationState');
const definitions = [
  ['orders','WebsiteOrder',{orderStatus:'Pending'},'Website orders awaiting confirmation','/website-orders'],
  ['reviews','WebsiteReview',{status:'Pending'},'Reviews awaiting approval','/website-reviews'],
  ['modifications','CustomerModificationRequest',{status:'PENDING'},'Tiffin requests awaiting approval','/customer-modification-requests'],
  ['payments','WhatsAppMessage',{direction:'incoming',paymentStatus:'pending_review'},'Payment screenshots awaiting review','/whatsapp-payment-approval'],
  ['messages','WhatsAppMessage',{direction:'incoming',inboxStatus:'unread',paymentStatus:{$ne:'pending_review'}},'Unread WhatsApp messages','/whatsapp-inbox'],
  ['bills','Bill',{'whatsappDelivery.status':{$in:['pending','failed']}},'Bills awaiting delivery / failed','/bill-delivery-status'],
  ['announcements','AnnouncementDelivery',{status:{$in:['pending','failed']},notificationArchived:{$ne:true}},'Announcements awaiting delivery / failed','/announcement-delivery-status']
];
const models = Object.fromEntries(definitions.map(([,name])=>[name,require('../models/'+name)]));
exports.getAdminNotifications = async (req,res) => {
  const updatedAt = new Date();
  let states;
  try { states = await State.find({admin:req.admin._id}).lean(); }
  catch { return res.status(503).json({success:false,message:'Notification read state is unavailable.'}); }
  const results = await Promise.allSettled(definitions.map(async ([id,name,filter,title,path]) => {
    const count = await models[name].countDocuments(states.find(item=>item.category===id) ? {$and:[filter,{updatedAt:{$gt:states.find(item=>item.category===id).readThrough}}]} : filter);
    return {id,title,path,count};
  }));
  const categories = results.flatMap(result=>result.status==='fulfilled' ? [result.value] : []);
  const unavailable = definitions.filter((_,index)=>results[index].status==='rejected').map(([id])=>id);
  res.json({success:true,total:categories.reduce((sum,item)=>sum+item.count,0),categories,unavailable,updatedAt});
};

exports.markNotificationsRead = async(req,res)=>{
  const category=req.body.category;
  if(category!=='all' && !definitions.some(([id])=>id===category))return res.status(400).json({success:false,message:'Invalid notification category.'});
  const readThrough=new Date(req.body.readThrough);
  if(!Number.isFinite(+readThrough) || readThrough>new Date())return res.status(400).json({success:false,message:'Invalid notification snapshot.'});
  try {
    const ids=category==='all'?definitions.map(([id])=>id):[category];
    await Promise.all(ids.map(id=>State.updateOne({admin:req.admin._id,category:id},{$max:{readThrough}},{upsert:true})));
    res.json({success:true});
  }catch {res.status(500).json({success:false,message:'Unable to mark notifications as read.'});}
};
