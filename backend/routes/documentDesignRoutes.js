const router=require('express').Router();
const protect=require('../middleware/authMiddleware');
const Model=require('../models/DocumentDesign');
const {defaults,validate}=require('../utils/documentDesign');
const render=require('../utils/customDocumentPdf');
router.use(protect);
router.get('/',async(req,res,next)=>{try{const saved=await Model.findOne({key:'documents'}).lean();res.json({success:true,data:{bill:{...defaults(),...saved?.bill},receipt:{...defaults(),...saved?.receipt},revision:saved?.revision||0}});}catch(e){next(e);}});
router.put('/',async(req,res,next)=>{try{
 const bill=validate(req.body.bill),receipt=validate(req.body.receipt),revision=req.body.revision;
 if(!Number.isInteger(revision)||revision<0)return res.status(400).json({message:'Invalid revision'});
 let saved;
 if(revision===0){try{saved=await Model.create({key:'documents',bill,receipt,revision:1});}catch(e){if(e.code!==11000)throw e;}}
 else saved=await Model.findOneAndUpdate({key:'documents',revision},{$set:{bill,receipt},$inc:{revision:1}},{new:true,runValidators:true});
 if(!saved)return res.status(409).json({message:'Settings changed on another device. Reload before saving.'});
 res.json({success:true,data:{bill:saved.bill,receipt:saved.receipt,revision:saved.revision}});
 }catch(e){if(/Invalid|Font size/.test(e.message))return res.status(400).json({message:e.message});next(e);}});
router.post('/preview',async(req,res,next)=>{try{
 if(!['bill','receipt'].includes(req.body.type))return res.status(400).json({message:'Invalid document type'});
 const design=validate(req.body.design),customer={customerName:'Demo Customer',phone:'0000000000',address:'Demo address, Gandhinagar'};
 const bill={invoiceNo:'PREVIEW-001',month:10,year:2026,cycle:'1',totalAmount:2400,paidAmount:1200,pendingAmount:1200,status:'Partial',dailyDetails:[{date:'2026-10-10',breakfastQty:0,lunchQty:1,dinnerQty:1,dailyTotal:240}]};
 const data=req.body.type==='bill'?bill:{receiptNo:'PREVIEW-001',paymentDate:'2026-10-10',amount:1200,paymentMethod:'UPI',bill,customer};
 const pdf=await render(req.body.type,data,customer,design);
 res.type('application/pdf').set('Cache-Control','no-store').send(pdf);
 }catch(e){if(/Invalid|Font size/.test(e.message))return res.status(400).json({message:e.message});next(e);}});
module.exports=router;
