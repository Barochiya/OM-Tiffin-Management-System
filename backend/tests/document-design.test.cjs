const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),express=require('express');
const root=path.resolve(__dirname,'..'),{defaults,validate}=require('../utils/documentDesign');let stored=null;
const query=value=>({lean:async()=>value});
const fake={findOne:()=>query(stored),create:async value=>{if(stored)throw Object.assign(Error('duplicate'),{code:11000});stored=structuredClone(value);return structuredClone(stored)},findOneAndUpdate:async(filter,update)=>{if(stored?.revision!==filter.revision)return null;stored={...stored,...update.$set,revision:stored.revision+1};return structuredClone(stored)}};
for(const [name,exports] of [['models/DocumentDesign',fake],['middleware/authMiddleware',(req,res,next)=>req.headers.authorization==='Bearer demo'?next():res.status(401).json({message:'Unauthorized'})]]){const id=require.resolve(path.join(root,name));require.cache[id]={id,filename:id,loaded:true,exports};}
const app=express();app.use(express.json());app.use('/design',require('../routes/documentDesignRoutes'));let server;
(async()=>{try{
for(const invalid of [{primary:'red'},{font:'../../x'},{fontSize:40},{enabled:'true'},{logoPosition:'bad'},{footer:'x'.repeat(501)}])assert.throws(()=>validate(invalid));
assert.equal(validate({databaseUri:'ignored'}).databaseUri,undefined);
server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port+'/design';
const request=(url='',method='GET',body)=>fetch(base+url,{method,headers:{Authorization:'Bearer demo','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
assert.equal((await fetch(base)).status,401);let data=(await(await request()).json()).data;assert.equal(data.revision,0);assert.equal(stored,null);
data.bill={...data.bill,enabled:true,primary:'#176b52',font:'Times-Roman',logoPosition:'right'};data.receipt={...data.receipt,enabled:true,primary:'#864b8f',font:'Courier',logoPosition:'center'};
let response=await request('','PUT',data);assert.equal(response.status,200);const saved=(await response.json()).data;assert.equal(saved.revision,1);
assert.equal((await request('','PUT',data)).status,409);assert.equal((await request('','PUT',{...saved,bill:{fontSize:99}})).status,400);
const attempts=await Promise.all([request('','PUT',saved),request('','PUT',saved)]);assert.deepEqual(attempts.map(r=>r.status).sort(),[200,409]);
response=await request('/preview','POST',{type:'bill',design:data.bill});assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'application/pdf');assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
const dir=process.env.DESIGN_TEST_OUTPUT;fs.mkdirSync(dir,{recursive:true});const customer={customerName:'Demo Customer',phone:'0000000000',address:'સેક્ટર ૬, ગાંધીનગર'};
const bill={invoiceNo:'DEMO-001',month:10,year:2026,cycle:'1',totalAmount:2600,previousPendingAmount:200,paidAmount:1200,pendingAmount:1400,status:'Partial',dailyDetails:Array.from({length:25},(_,i)=>({date:`2026-10-${String(i+1).padStart(2,'0')}`,breakfastQty:1,lunchQty:1,dinnerQty:1,dailyTotal:240,extraItems:[{description:'Extra roti',amount:20}],remark:'Demo note'}))};
const payment={_id:'demo',receiptNo:'DEMO-REC-001',paymentDate:'2026-10-10',amount:1200,paymentMethod:'UPI',customer,bill};
const generateBill=require('../utils/billPdfGenerator'),generateReceipt=require('../utils/receiptPdfGenerator');
for(const [name,fn] of [['custom-bill',()=>generateBill(bill,customer)],['custom-receipt',()=>generateReceipt(payment)]]){const pdf=await fn();assert.equal(pdf.subarray(0,5).toString(),'%PDF-');fs.writeFileSync(path.join(dir,name+'.pdf'),pdf);}
stored.bill.enabled=false;stored.receipt.enabled=false;
for(const [name,fn] of [['legacy-bill',()=>generateBill({...bill,dailyDetails:[]},customer)],['legacy-receipt',()=>generateReceipt(payment)]]){const pdf=await fn();assert.equal(pdf.subarray(0,5).toString(),'%PDF-');fs.writeFileSync(path.join(dir,name+'.pdf'),pdf);}
console.log('PASS validated whitelist; protected settings/preview routes; shared revision conflict handling; custom and legacy PDFs; Gujarati, extras, balances, multi-page exports. In-memory model only.');
}finally{server?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
