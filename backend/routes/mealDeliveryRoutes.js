const router=require('express').Router();
const mongoose=require('mongoose');
const protect=require('../middleware/authMiddleware');
const MealDelivery=require('../models/MealDelivery');
const Tiffin=require('../models/Tiffin');
const {dateKey}=require('../utils/deliveryPolicy');
const {configured,sendDeliveryNotice}=require('../utils/mealDeliveryWhatsApp');
router.use(protect);
const validCustomer=value=>mongoose.isValidObjectId(value);
router.get('/',async(req,res)=>{
 try{
  const date=dateKey(req.query.date);const filter={date};
  if(req.query.customer){if(!validCustomer(req.query.customer))return res.status(400).json({message:'Invalid customer.'});filter.customer=req.query.customer;}
  res.json({success:true,data:await MealDelivery.find(filter).lean(),whatsappConfigured:configured()});
 }catch(error){res.status(error.status||500).json({message:error.status?error.message:'Unable to load delivery status.'});}
});
router.post('/',async(req,res)=>{
 try{
  const {customer,meal,status}=req.body;const date=dateKey(req.body.date);
  if(!validCustomer(customer)||!['Lunch','Dinner'].includes(meal)||!['Out for delivery','Delivered'].includes(status))return res.status(400).json({message:'Customer, meal and delivery status are required.'});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(date!==today)return res.status(400).json({message:'Delivery can only be marked for today.'});
  const person=await Tiffin.findById(customer).lean();
  if(!person||person.status!=='Active'||![meal,'Both'].includes(person.mealType))return res.status(400).json({message:'Customer is not active for this meal.'});
  await MealDelivery.init(); // Unique customer/date/meal index must exist before accepting marks.
  const key={customer,date,meal};let record;
  try{record=await MealDelivery.findOneAndUpdate(key,{$setOnInsert:{...key,status:'Pending'}},{upsert:true,new:true});}
  catch(error){if(error.code!==11000)throw error;record=await MealDelivery.findOne(key);}
  if(record.status===status||record.status==='Delivered')return res.json({success:true,data:record,unchanged:true});
  if(status==='Delivered'&&record.status!=='Out for delivery')return res.status(409).json({message:'Mark Out for delivery before Delivered.'});
  const update={status,updatedBy:req.admin._id};
  if(status==='Out for delivery')update.dispatchedAt=new Date();
  else{update.deliveredAt=new Date();update.notification={status:configured()?'pending':'not_configured'};}
  const changed=await MealDelivery.findOneAndUpdate({...key,status:record.status},{$set:update},{new:true});
  if(!changed)return res.status(409).json({message:'Delivery status changed. Refresh before trying again.'});
  if(status==='Delivered'){
   const notification=await sendDeliveryNotice(person,changed);
   await MealDelivery.updateOne({_id:changed._id},{$set:{notification}});changed.notification=notification;
  }
  res.json({success:true,data:changed});
 }catch(error){console.error('Meal delivery update failed:',error.code||error.name);res.status(error.status||500).json({message:error.status?error.message:'Unable to update delivery. Refresh to check the saved status before trying again.'});}
});
module.exports=router;
