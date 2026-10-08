const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  admin: { type:mongoose.Schema.Types.ObjectId,ref:'Admin',required:true },
  category: { type:String,enum:['orders','reviews','modifications','payments','messages','bills','announcements'],required:true },
  readThrough: { type:Date,required:true }
}, { timestamps:true });
schema.index({admin:1,category:1},{unique:true});
module.exports=mongoose.model('AdminNotificationState',schema);
