const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 customer:{type:mongoose.Schema.Types.ObjectId,ref:'Tiffin',required:true},
 date:{type:String,required:true}, meal:{type:String,enum:['Lunch','Dinner'],required:true},
 status:{type:String,enum:['Pending','Out for delivery','Delivered'],default:'Pending'},
 dispatchedAt:Date,deliveredAt:Date,updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'Admin'},
 dispatchNotification:{status:{type:String,enum:['not_configured','pending','accepted','failed','unknown'],default:'not_configured'},messageId:String,error:String},
 notification:{status:{type:String,enum:['not_configured','pending','accepted','failed','unknown'],default:'not_configured'},messageId:String,error:String}
},{timestamps:true});
schema.index({customer:1,date:1,meal:1},{unique:true});
module.exports=mongoose.model('MealDelivery',schema);
