const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = process.argv[2] || path.resolve(__dirname, '..');
const backendRequire = createRequire(path.join(root, 'backend/package.json'));
const frontendRequire = createRequire(path.join(root, 'frontend/package.json'));
process.env.RAZORPAY_KEY_ID = 'audit-dummy-key';
process.env.RAZORPAY_KEY_SECRET = 'audit-dummy-secret';
process.env.JWT_SECRET = 'audit-dummy-jwt';
process.env.CUSTOMER_JWT_SECRET = 'audit-dummy-customer-jwt';
const mongoose = backendRequire('mongoose');
mongoose.set('bufferCommands', false);
const forbidden = () => { throw new Error('AUDIT: real database/network operation forbidden'); };
mongoose.connect = forbidden;
mongoose.Query.prototype.exec = forbidden;
mongoose.Model.prototype.save = forbidden;
for (const method of ['create', 'insertMany', 'bulkWrite', 'updateOne', 'updateMany', 'findOneAndUpdate', 'findByIdAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'findByIdAndDelete']) mongoose.Model[method] = forbidden;
global.fetch = forbidden;
require('node:http').request = forbidden;
require('node:https').request = forbidden;
const app = backendRequire('./app.js');
const Bill = backendRequire('./models/Bill');
const Admin = backendRequire('./models/Admin');
const WebsiteMenu = backendRequire('./models/WebsiteMenu');
const WebsiteOrder = backendRequire('./models/WebsiteOrder');
const WebsiteSettings = backendRequire('./models/WebsiteSettings');
const billController = backendRequire('./controllers/billController');
const Payment = backendRequire('./models/Payment');
const paymentController = backendRequire('./controllers/paymentController');
const orderController = backendRequire('./controllers/websiteOrderController');
const auth = backendRequire('./middleware/authMiddleware');
let checks = 0;
function check(name, fn) { return Promise.resolve().then(fn).then(() => { checks++; console.log('PASS ' + name); }); }
function response() { return { statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, send(body) { this.body = body; return this; }, setHeader(key, value) { this.headers[key] = value; } }; }
function hasRoute(stack, method, url) {
  for (const layer of stack) {
    if (!layer.match(url)) continue;
    if (layer.route && layer.route.methods[method]) return true;
    if (layer.handle?.stack && hasRoute(layer.handle.stack, method, url.slice(layer.path.length) || '/')) return true;
  }
  return false;
}
async function services(apiUrl) {
  const requests = [];
  const storage = new Map([['token','audit-admin-token'],['customerToken','audit-customer-token']]);
  const axios = frontendRequire('axios').default;
  const originalAdapter = axios.defaults.adapter;
  axios.defaults.adapter = async config => {
    requests.push({ method: config.method, url: new URL(axios.getUri(config), 'http://audit.local').pathname, authorization: config.headers.get('Authorization') });
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  };
  const context = vm.createContext({ console, sessionStorage: { getItem: key => storage.get(key), removeItem: key => storage.delete(key) }, window: { location: { href: '' } } });
  const modules = new Map();
  async function load(file) {
    if (modules.has(file)) return modules.get(file);
    const mod = new vm.SourceTextModule(fs.readFileSync(file,'utf8'), { context, identifier: file, initializeImportMeta(meta) { meta.env = { VITE_API_URL: apiUrl }; } });
    modules.set(file,mod);
    await mod.link(async (specifier, referring) => {
      if (specifier === 'axios') { const synthetic = new vm.SyntheticModule(['default'],function(){this.setExport('default',axios);},{context}); return synthetic; }
      let target = path.resolve(path.dirname(referring.identifier),specifier);
      if (!path.extname(target)) target += '.js';
      return load(target);
    });
    return mod;
  }
  try {
    const ids = '507f1f77bcf86cd799439011';
    const args = {
      loginAdmin: ['audit@example.invalid','dummy'], loginCustomer: ['AUDIT','dummy'],
      createCustomer: [{}], updateCustomer: [ids,{}], getCustomerById:[ids], deleteCustomer:[ids], markPaymentPaid:[ids], updatePrices:[{}],
      provisionCustomerAccount:[ids], setCustomerLoginEnabled:[ids,true], regenerateTemporaryPassword:[ids],
      getCustomerEntries:[ids,10,2026,'1'], getEntriesByDate:['2026-10-08'], saveDailyEntry:[{}],
      generateBill:[{}], generateBillAndSendWhatsApp:[{}], sendBillWhatsApp:[{}], sendAllBillsWhatsApp:[{}], retryBill:[ids], getBillById:[ids], downloadBillPdf:[ids],
      addPayment:[{}], getBillsByCustomer:[ids], getPendingBills:[ids], getPaymentById:[ids], downloadPaymentReceiptPdf:[ids], sendPaymentReceiptWhatsApp:[ids,Buffer.from('dummy')], approveWhatsAppPayment:[{}],
      getCustomerBillById:[ids], downloadCustomerBillPdf:[ids], getCustomerMealHistory:[10,2026,'1'], updateCustomerProfile:[{}],
      changeCustomerPassword:['dummy','dummy','dummy'], sendCustomerPasswordResetOtp:['AUDIT'], verifyCustomerPasswordResetOtp:['AUDIT','dummy'], resetCustomerPassword:['AUDIT','dummy','dummy','dummy'], sendCustomerUserIdRecoveryOtp:['0000000000'], verifyCustomerUserIdRecoveryOtp:['0000000000','dummy'], sendCustomerAccountSetupOtp:['AUDIT'], verifyCustomerAccountSetupOtp:['AUDIT','dummy'], setCustomerAccountSetupPassword:['AUDIT','dummy','dummy','dummy'],
      createModificationRequest:[{}], getModificationRequestById:[ids], updateModificationRequestStatus:[ids,'PENDING'], updateModificationSettings:[{}],
      sendLoginIdsWhatsApp:[[ids]], createWebsiteOrder:[{}], getPublicOrderStatus:['0000000000'], createMenuItem:[{}], updateMenuItem:[ids,{}], deleteMenuItem:[ids], createPublicReview:[{}], updateReview:[ids,{}], deleteReview:[ids], updateWebsiteSettings:[{}],
      markWhatsAppMessageRead:[ids], deleteWhatsAppMessage:[ids], getWhatsAppMedia:[ids], replyToWhatsAppMessage:[ids,'dummy'], rejectWhatsAppPayment:[ids,'dummy'],
    };
    const directory = path.join(root,'frontend/src/services');
    for (const file of fs.readdirSync(directory).filter(name=>name.endsWith('Service.js') && name !== 'whatsappService.js')) {
      const mod = await load(path.join(directory,file)); await mod.evaluate();
      for (const name of Object.keys(mod.namespace)) {
        if (name === 'default' || name === 'logoutCustomer' || typeof mod.namespace[name] !== 'function') continue;
        const before = requests.length;
        await mod.namespace[name](...(args[name] || []));
        assert.equal(requests.length,before+1, name+' should make one request');
        const req = requests.at(-1);
        assert(hasRoute(app._router.stack,req.method,req.url), name+' has no backend route: '+req.method+' '+req.url);
        assert(!req.url.includes('/api/api/'),name+' duplicated API prefix');
        const customer = file === 'customerAuthService.js' || file === 'customerModificationService.js';
        assert.equal(req.authorization,customer?'Bearer audit-customer-token':'Bearer audit-admin-token',name+' token');
      }
    }
    return requests.length;
  } finally { axios.defaults.adapter = originalAdapter; }
}
(async () => {
  for (const url of ['http://audit.local','http://audit.local/','http://audit.local/api','http://audit.local/api/']) {
    await check('frontend service routes and token selection for '+url,async()=>console.log('  '+await services(url)+' service operations matched'));
  }
  await check('IST date boundaries',async()=>{
    const mod = new vm.SourceTextModule(fs.readFileSync(path.join(root,'frontend/src/utils/businessDate.js'),'utf8'));
    await mod.link(()=>{}); await mod.evaluate();
    assert.equal(mod.namespace.getBusinessDate(new Date('2026-10-07T18:29:59Z')),'2026-10-07');
    assert.equal(mod.namespace.getBusinessDate(new Date('2026-10-07T18:30:00Z')),'2026-10-08');
    assert.equal(mod.namespace.getBusinessDate(new Date('2026-10-08T00:01:00Z')),'2026-10-08');
  });
  await check('Lunch and Dinner for the same Both-menu item are accepted and repriced on server',async()=>{
    const id='507f1f77bcf86cd799439011';
    WebsiteSettings.findOne=async()=>({onlineOrdersEnabled:true});
    WebsiteMenu.find=async query=>{assert.deepEqual(query._id.$in,[id]);return [{_id:id,name:'Audit Both Meal',mealType:'Both',price:80}];};
    let saved;
    WebsiteOrder.create=async data=>{saved=data;return {_id:'audit-order',...data};};
    const res=response();
    await orderController.createWebsiteOrder({body:{customerName:'Audit',mobileNumber:'0000000000',deliveryAddress:'Fixture',orderDate:'2026-10-08',totalAmount:1,items:[{menuItemId:id,mealType:'Lunch',quantity:1,price:1},{menuItemId:id,mealType:'Dinner',quantity:2,price:1}]}},res);
    assert.equal(res.statusCode,201);assert.equal(saved.totalAmount,240);assert.equal(saved.items.length,2);
    WebsiteOrder.create=forbidden;
  });
  await check('unavailable menu item still rejected without writing',async()=>{
    WebsiteMenu.find=async()=>[];
    const res=response();
    await orderController.createWebsiteOrder({body:{customerName:'Audit',mobileNumber:'0000000000',deliveryAddress:'Fixture',items:[{menuItemId:'missing',quantity:1,mealType:'Lunch'}]}},res);
    assert.equal(res.statusCode,400);
  });
  await check('disabled online orders still rejected without writing',async()=>{
    WebsiteSettings.findOne=async()=>({onlineOrdersEnabled:false});
    const res=response();await orderController.createWebsiteOrder({body:{}},res);assert.equal(res.statusCode,403);
  });
  await check('existing bill downloads a genuine PDF without saving/recalculating',async()=>{
    const customer={_id:'507f1f77bcf86cd799439011',customerName:'Audit Fixture',phone:'0000000000',address:'Fixture',pricing:{breakfast:30,lunch:80,dinner:80}};
    const bill={_id:'507f1f77bcf86cd799439012',customer,invoiceNo:'AUDIT/1',month:10,year:2026,cycle:'1',breakfastQty:0,lunchQty:1,dinnerQty:1,totalAmount:160,paidAmount:50,pendingAmount:110,status:'Partial',dailyDetails:[{date:'2026-10-08',breakfastQty:0,lunchQty:1,dinnerQty:1,lunchAmount:80,dinnerAmount:80,extraItems:[],extraAmount:0,dailyTotal:160}]};
    const snapshot=JSON.stringify(bill);
    Bill.findById=()=>({populate:async()=>bill});
    const res=response();await billController.downloadBillPdf({params:{id:bill._id}},res);
    assert.equal(res.statusCode,200);assert.equal(res.headers['Content-Type'],'application/pdf');assert(res.body.subarray(0,5).equals(Buffer.from('%PDF-')));assert(res.body.length>1000);assert.equal(JSON.stringify(bill),snapshot);
    console.log('  PDF fixture: '+res.body.length+' bytes');
    if (process.env.AUDIT_ARTIFACT_DIR) fs.writeFileSync(path.join(process.env.AUDIT_ARTIFACT_DIR,'audit-fixture-invoice.pdf'),res.body);
  });
  await check('missing bill gives 404',async()=>{Bill.findById=()=>({populate:async()=>null});const res=response();await billController.downloadBillPdf({params:{id:'missing'}},res);assert.equal(res.statusCode,404);});
  await check('deleted admin account cannot pass authentication',async()=>{
    Admin.findById=()=>({select:async()=>null});
    const token=backendRequire('jsonwebtoken').sign({id:'507f1f77bcf86cd799439011'},process.env.JWT_SECRET);
    let advanced=false;const res=response();await auth({headers:{authorization:'Bearer '+token}},res,()=>{advanced=true;});assert.equal(res.statusCode,401);assert.equal(advanced,false);
  });
  await check('existing admin account retains access',async()=>{
    Admin.findById=()=>({select:async()=>({_id:'507f1f77bcf86cd799439011'})});
    const token=backendRequire('jsonwebtoken').sign({id:'507f1f77bcf86cd799439011'},process.env.JWT_SECRET);
    let advanced=false;await auth({headers:{authorization:'Bearer '+token}},response(),()=>{advanced=true;});assert.equal(advanced,true);
  });
  await check('new PDF route remains protected',async()=>{
    const route=app._router.stack.find(layer=>layer.match('/api/bills')&&layer.handle?.stack)?.handle.stack.find(layer=>layer.route?.path==='/:id/pdf');
    assert(route);assert.equal(route.route.stack[0].handle,auth);
    const res=response();let advanced=false;await route.route.stack[0].handle({headers:{}},res,()=>{advanced=true;});assert.equal(res.statusCode,401);assert.equal(advanced,false);
  });
  await check('payment receipt export keeps stored values and uses an A4 PDF for all devices',async()=>{
    const payment={_id:'507f1f77bcf86cd799439013',receiptNo:'AUDIT-RECEIPT',customer:{customerName:'Audit Fixture',phone:'0000000000',address:'Fixture Address, Gandhinagar'},bill:{invoiceNo:'AUDIT-BILL',status:'Partial'},amount:125,paymentMethod:'Bank',paymentDate:'2026-10-08T02:00:00Z'};
    const before=JSON.stringify(payment);
    Payment.findById=()=>({populate(){return this;},then(resolve){return Promise.resolve(payment).then(resolve);}});
    for(const agent of ['mobile','desktop']){
      const res=response();await paymentController.downloadPaymentReceiptPdf({params:{id:payment._id},headers:{'user-agent':agent}},res);
      assert.equal(res.statusCode,200);assert.equal(res.headers['Content-Type'],'application/pdf');assert.equal(res.body.subarray(0,5).toString(),'%PDF-');
      assert.match(res.body.toString('latin1'),/\/MediaBox \[0 0 595\.28 841\.89\]/);assert.equal(JSON.stringify(payment),before);
      if(process.env.AUDIT_ARTIFACT_DIR)fs.writeFileSync(path.join(process.env.AUDIT_ARTIFACT_DIR,'audit-fixture-receipt-'+agent+'.pdf'),res.body);
    }
    const route=app._router.stack.find(layer=>layer.match('/api/payments')&&layer.handle?.stack)?.handle.stack.find(layer=>layer.route?.path==='/:id/pdf');
    assert.equal(route.route.stack[0].handle,auth);
  });
  await check('missing payment receipt returns 404',async()=>{
    Payment.findById=()=>({populate(){return this;},then(resolve){return Promise.resolve(null).then(resolve);}});
    const res=response();await paymentController.downloadPaymentReceiptPdf({params:{id:'missing'}},res);assert.equal(res.statusCode,404);
  });
  await check('Gujarati receipt embeds its licensed font; long bill retains every stored daily row',async()=>{
    const customer={customerName:'મલય બારોચિયા',phone:'0000000000',address:'સેક્ટર ૨૧, ગાંધીનગર, ગુજરાત'};
    const payment={_id:'audit-gujarati',customer,bill:{invoiceNo:'AUDIT-GUJ',status:'Partial'},amount:125,paymentMethod:'Bank',paymentDate:'2026-10-08T02:00:00Z'};
    const receipt=await backendRequire('./utils/receiptPdfGenerator.js')(payment);assert.match(receipt.toString('latin1'),/NotoSansGujarati/);
    const bill={invoiceNo:'AUDIT-MULTIPAGE',month:10,year:2026,cycle:'1',status:'Partial',totalAmount:2480,paidAmount:500,pendingAmount:1980,dailyDetails:Array.from({length:31},(_,i)=>({date:'2026-10-'+String(i+1).padStart(2,'0'),lunchQty:1,lunchAmount:80,dailyTotal:80,extraItems:[],extraAmount:0}))};
    const before=JSON.stringify(bill);const invoice=await backendRequire('./utils/billPdfGenerator.js')(bill,{customerName:'Audit Customer',phone:'0000000000',address:'Fixture Address'});assert.equal(JSON.stringify(bill),before);
    if(process.env.AUDIT_ARTIFACT_DIR){fs.writeFileSync(path.join(process.env.AUDIT_ARTIFACT_DIR,'audit-gujarati-receipt.pdf'),receipt);fs.writeFileSync(path.join(process.env.AUDIT_ARTIFACT_DIR,'audit-long-invoice.pdf'),invoice);}
  });
  assert.equal(mongoose.connection.readyState,0);
  console.log('PASS '+checks+' regression groups; no database connection, real writes, payment calls or WhatsApp sends.');
})().catch(error=>{console.error(error);process.exitCode=1;});
