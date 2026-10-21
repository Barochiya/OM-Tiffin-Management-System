const mongoose=require('mongoose');
const schema=new mongoose.Schema({key:{type:String,required:true,unique:true},bill:{type:mongoose.Schema.Types.Mixed,default:{}},receipt:{type:mongoose.Schema.Types.Mixed,default:{}},salary:{type:mongoose.Schema.Types.Mixed,default:{}},revision:{type:Number,default:0}},{timestamps:true});
module.exports=mongoose.model('DocumentDesign',schema);
