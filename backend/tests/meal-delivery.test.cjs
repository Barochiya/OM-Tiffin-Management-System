const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const {dateKey,missingMeals}=require(root+'/utils/deliveryPolicy');
assert.throws(()=>dateKey('2026-02-30'));assert.throws(()=>dateKey('junk'));assert.equal(dateKey('2026-10-09'),'2026-10-09');
assert.deepEqual(missingMeals({lunchQty:1,dinnerQty:1},[{meal:'Lunch',status:'Out for delivery'},{meal:'Dinner',status:'Delivered'}]),['Lunch']);
const customer='507f1f77bcf86cd799439011',rows=[];let sends=0,enabled=false,providerFails=false;
const clone=x=>x?structuredClone(x):null;
const match=(r,q)=>Object.keys(q).every(k=>String(r[k])===String(q[k]));
const model={init:async()=>{},find:q=>({lean:async()=>clone(rows.filter(r=>match(r,q)))}),findOne:async q=>clone(rows.find(r=>match(r,q))),findOneAndUpdate:async(q,u,o)=>{
 let r=rows.find(r=>match(r,q));if(!r&&o.upsert){r={_id:'record1',...u.$setOnInsert};rows.push(r);}if(!r)return null;Object.assign(r,u.$set||{});return clone(r);
},updateOne:async(q,u)=>Object.assign(rows.find(r=>match(r,q)),u.$set)};
function mock(file,exports){require.cache[require.resolve(root+file)]={id:root+file,filename:root+file,loaded:true,exports};}
mock('/models/MealDelivery.js',model);mock('/models/Tiffin.js',{findById:()=>({lean:async()=>({_id:customer,customerName:'Demo',phone:'0000000000',mealType:'Both',status:'Active'})})});
mock('/middleware/authMiddleware.js',(req,res,next)=>{if(req.headers.authorization!=='Bearer test')return res.status(401).end();req.admin={_id:customer};next();});
mock('/utils/mealDeliveryWhatsApp.js',{configured:()=>enabled,setup:()=>({enabled,ready:enabled,language:'en_GB'}),sendDeliveryNotice:async()=>{sends++;return providerFails?{status:'failed'}:{status:'accepted',messageId:'demo-'+sends};}});
let entriesCreated=0;
mock('/models/DailyEntry.js',{find:()=>({sort:async()=>[]}),create:async data=>{entriesCreated++;return data;}});
const express=require(root+'/node_modules/express');const app=express();app.use(express.json());app.use('/deliveries',require(root+'/routes/mealDeliveryRoutes'));
app.post('/daily-entry',require(root+'/middleware/authMiddleware'),require(root+'/controllers/dailyEntryController').saveDailyEntry);
const server=app.listen(0,'127.0.0.1',async()=>{
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const post=async status=>{const r=await fetch(base+'/deliveries',{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json'},body:JSON.stringify({customer,date,meal:'Lunch',status})});return [r.status,await r.json()];};
  assert.equal((await fetch(base+'/deliveries?date='+date)).status,401);
  assert.equal((await post('Delivered'))[0],409);
  assert.equal((await post('Out for delivery'))[1].data.status,'Out for delivery');
  const delivered=await post('Delivered');assert.equal(delivered[0],200);assert.equal(delivered[1].data.notification.status,'not_configured');
  assert.equal((await post('Delivered'))[1].unchanged,true);assert.equal(sends,0);assert.equal(rows.length,1);
  assert.equal((await post('Out for delivery'))[1].data.status,'Delivered');
  const r=await fetch(base+'/deliveries?date='+date,{headers:{authorization:'Bearer test'}});assert.equal((await r.json()).data.length,1);
  const save=async body=>fetch(base+'/daily-entry',{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json'},body:JSON.stringify({customer,date,deliveryCheck:true,...body})});
  const warning=await save({dinnerQty:1});assert.equal(warning.status,409);assert.deepEqual((await warning.json()).missingMeals,['Dinner']);assert.equal(entriesCreated,0);
  assert.equal((await save({lunchQty:1})).status,200);assert.equal(entriesCreated,1);
  assert.equal((await save({dinnerQty:1,confirmUndelivered:true})).status,200);assert.equal(entriesCreated,2);
  rows.length=0;enabled=true;
  assert.equal((await post('Out for delivery'))[1].data.dispatchNotification.status,'accepted');
  assert.equal((await post('Out for delivery'))[1].unchanged,true);assert.equal(sends,1);
  providerFails=true;const failed=await post('Delivered');assert.equal(failed[0],200);assert.equal(failed[1].data.status,'Delivered');assert.equal(failed[1].data.notification.status,'failed');assert.equal(failed[1].data.dispatchNotification.status,'accepted');
  assert.equal((await post('Delivered'))[1].unchanged,true);assert.equal(sends,2);
  rows.length=0;sends=0;providerFails=false;
  await Promise.all([post('Out for delivery'),post('Out for delivery')]);assert.equal(sends,1);assert.equal(rows.length,1);
  await post('Delivered');assert.equal(sends,2);assert.equal(rows[0].status,'Delivered');
  console.log('PASS: strict dates; per-meal warning; auth; required dispatch; delivered; repeat idempotency; no downgrade; disabled mode sends nothing; two stage notifications; repeats/concurrent dispatch do not resend; provider failure preserves delivered status. In-memory DB; no real messages.');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();}
});
