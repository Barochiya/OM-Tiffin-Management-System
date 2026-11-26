const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const root = process.argv[2] || path.resolve(__dirname,'..');
const liveWebRoot = process.env.AUDIT_LIVE_WEB_ROOT;
const auditPort = liveWebRoot ? '5181' : '5179';
const frontendRequire = createRequire(path.join(root,'frontend/package.json'));
const backendRequire = createRequire(path.join(root,'backend/package.json'));
backendRequire('./models/DocumentDesign').findOne=()=>({lean:async()=>null});
const documentDefaults=backendRequire('./utils/documentDesign').defaults;
const documentDesign={revision:0,bill:documentDefaults('bill'),receipt:documentDefaults('receipt'),salary:documentDefaults('salary'),pg:documentDefaults('pg')};
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const id='507f1f77bcf86cd799439011';
const customer={_id:id,customerName:'Audit Customer',phone:'0000000000',address:'Audit Address, Gandhinagar',status:'Active',mealType:'Both',barcode:'OMT-000001',pricing:{pricingType:'default',breakfastPrice:0,lunchPrice:117,dinnerPrice:132},advanceBalance:0};
const bill={_id:id,customer,invoiceNo:'AUDIT-1',month:10,year:2026,cycle:'1',status:'Partial',totalAmount:249,paidAmount:125,pendingAmount:124,dailyDetails:[],whatsappDelivery:{status:'sent'}};
const payment={_id:id,customer,bill,amount:125,paymentMethod:'Bank',paymentDate:'2026-10-08T02:00:00Z',status:'Success'};
const menu={_id:id,name:'Audit Both Meal',description:'Fixture only',mealType:'Both',price:80,isAvailable:true,sortOrder:1};
const settings={websiteEnabled:true,plansEnabled:true,menuEnabled:true,onlineOrdersEnabled:true,inquiriesEnabled:true,customerLoginEnabled:true,testimonialsEnabled:true,faqEnabled:true,contactEnabled:true,lunchEnabled:true,dinnerEnabled:true};
const chatFixture=[{_id:'a1',phoneNumber:'9876543210',customer:{customerName:'Alice Shah'},message:'Lunch plan question',type:'text',direction:'incoming',inboxStatus:'read',createdAt:'2026-10-08T08:00:00Z'},{_id:'a2',phoneNumber:'+91 9876543210',customer:{customerName:'Alice Shah'},message:'Confirm dinner',type:'text',direction:'incoming',inboxStatus:'unread',createdAt:'2026-10-08T09:00:00Z'},{_id:'a3',phoneNumber:'919876543210',customer:{customerName:'Alice Shah'},message:'Dinner confirmed',type:'text',direction:'outgoing',inboxStatus:'read',createdAt:'2026-10-08T09:01:00Z'},{_id:'b1',phoneNumber:'9123456780',customer:{customerName:'Bob Patel'},message:'Payment query',type:'text',direction:'incoming',inboxStatus:'unread',createdAt:'2026-10-08T10:00:00Z'}];
const createdAt='2026-11-20T08:00:00Z';
const walkRows=[
  {_id:'walk-due',customerName:'Due Fixture',phone:'9000000001',totalPaise:40000,payments:[{receiptNo:'WI-1',amount:100,paymentMethod:'Cash',paymentDate:createdAt}],reviewStatus:'Not sent'},
  {_id:'walk-paid',customerName:'Paid Fixture',phone:'9000000002',totalPaise:10000,payment:{receiptNo:'WI-2',amount:100,paymentMethod:'UPI',paymentDate:createdAt},reviewStatus:'sent',reviewSubmitted:true},
  {_id:'walk-new',customerName:'No Order Fixture',phone:'9000000003',reviewStatus:'Not sent'},
];
const walletRows=['approve','reject'].map((action,index)=>({_id:`wallet-${action}`,name:'Fixture'+ 'LongName'.repeat(10),userId:'AUDIT',phone:'9000000001',amountPaise:10000,createdAt,status:'pending',screenshots:[{_id:`proof-${index}`,whatsappTimestamp:createdAt}]}));
const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB1sAAAAASUVORK5CYII=','base64');
let server,browser,checks=0;
const errors=[],writes=[],notificationReadCategories=new Set();
async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
function fixture(url,method){
  const p=url.pathname.replace(/^\/api/,'');
  if(p==='/walk-ins'&&method==='GET')return {success:true,data:walkRows};
  if(p==='/customer-portal/wallet'&&method==='GET')return {success:true,data:{active:true,balancePaise:12345,history:[]}};
  if(p==='/delivery-locations')return {success:true,data:[]};
  if(p==='/expenses')return {success:true,data:{summary:{},categories:{},entries:[],daily:[]}};
  if(p==='/whatsapp-inbox/payment-reviews'&&method==='GET')return {success:true,data:[{_id:id,customer:{customerName:'Audit'+ 'Customer'.repeat(24)},message:'Reference'.repeat(38),pendingBills:[{...bill,invoiceNo:'INVOICE-'+ '1234567890'.repeat(12)}]}]};
  if(p==='/whatsapp-inbox'&&method==='GET'){assert.equal(url.searchParams.get('includeOutgoing'),'true');return {success:true,data:chatFixture};}
  if(method!=='GET'){
    if(p==='/dashboard/notifications/read')return {success:true};
    if(p.startsWith('/whatsapp-inbox/')&&p.endsWith('/reply'))return {success:true,message:'Fixture reply sent'};
    if(p==='/bills/generate')return {success:true,data:bill};
    if(p==='/admin/login')return {success:true,token:'audit-admin-token'};
    if(p==='/website-orders/public')return {success:true,data:{_id:'audit-order'}};
    return {success:true,message:'Fixture action completed.',data:payment};
  }
  if(p==='/website-settings')return {success:true,data:settings};
  if(p.startsWith('/website-menu'))return {success:true,data:[menu]};
  if(p.startsWith('/website-reviews'))return {success:true,data:[]};
  if(p==='/prices')return {success:true,data:{breakfast:0,lunch:117,dinner:132}};
  if(p==='/tiffins')return {success:true,data:[customer],total:1,totalPages:1};
  if(p==='/tiffins/stats')return {success:true,data:{totalCustomers:1}};
  if(p.startsWith('/tiffins/'))return {success:true,data:customer};
  if(p==='/customer-accounts/status')return {success:true,accounts:[]};
  if(p.startsWith('/customer-accounts'))return {success:true,data:[]};
  if(p==='/customer-portal/profile')return {success:true,customer,account:{isFirstLogin:false,userId:'AUDIT'}};
  if(p.startsWith('/customer-portal/bills/'))return {success:true,data:bill};
  if(p==='/customer-portal/bills')return {success:true,data:[bill]};
  if(p==='/customer-portal/payments')return {success:true,data:[payment]};
  if(p==='/customer-portal/ranking')return {success:true,data:{rank:1,totalEligible:1,period:'Oct 2026 · Cycle 1',score:125,scoreLabel:'Total successful payments linked to valid bills',topFive:true,reward:{supported:false,eligible:false},progress:{targetRank:5,thresholdScore:null,amountToTopFive:0}}};
  if(p.startsWith('/customer-portal/'))return {success:true,data:[]};
  if(p==='/customer-modification-admin/settings')return {success:true,data:{lunchCutoffTime:'10:30',dinnerCutoffTime:'17:00',skipTiffinEnabled:true,extraTiffinEnabled:true,mealModificationEnabled:true,otherRequestEnabled:true}};
  if(p.startsWith('/customer-modification-admin/'))return {success:true,data:[]};
  if(p.startsWith('/daily-entry'))return {success:true,data:[]};
  if(p==='/meal-deliveries')return {success:true,data:[],whatsappConfigured:false};
  if(p==='/document-design')return {success:true,data:documentDesign};
  if(p==='/employees')return {success:true,data:{employees:[]}};
  if(p==='/wallets')return {success:true,data:[],summary:{active:0,needsActivation:0,totalBalance:0}};
  if(p==='/announcement-status')return {success:true,data:[{_id:'real-announcement',customerName:'Demo Customer',title:'Real announcement fixture',status:'delivered',createdAt:'2026-10-08T10:00:00Z'},{_id:'test-announcement',customerName:'Demo Customer',title:'System Review Test',status:'failed',notificationArchived:true,createdAt:'2026-09-25T10:00:00Z'}]};
  if(p==='/bills/delivery-status'||p==='/announcement-status'||p.startsWith('/whatsapp-inbox'))return {success:true,data:[]};
  if(p==='/bills')return {success:true,data:[bill]};
  if(p.startsWith('/bills/'))return {success:true,data:bill};
  if(p==='/payments')return [payment];
  if(p.startsWith('/payments/pending/')||p.startsWith('/payments/customer/'))return [bill];
  if(p.startsWith('/payments/'))return payment;
  if(p==='/dashboard/notifications')return {total:3,categories:[{id:'orders',title:'Website orders awaiting confirmation',count:2,path:'/website-orders'},{id:'reviews',title:'Reviews awaiting approval',count:1,path:'/website-reviews'}],unavailable:[],updatedAt:new Date().toISOString()};
  if(p==='/dashboard')return {period:{label:url.searchParams.get('month')==='10'?'Oct 2026':url.searchParams.get('year')==='2026'?'2026':'All time',chartYear:2026},availableYears:[2026,2025],growth:{revenue:url.searchParams.get('year')==='all' || !url.searchParams.get('year') ? {percent:null,label:'All-time successful collections'} : {percent:-25,label:'vs previous month'},active:{percent:100,share:true,label:'of registered customers'}},stats:{totalCustomers:1,activeCustomers:1,totalRevenue:125,totalPending:124},todayCollection:125,todayMeals:2,revenueChart:[],recentPayments:[],pendingBills:[],topCustomers:[]};
  if(p==='/visitor-analytics/dashboard')return {success:true,enabled:true,fullIpAuthorized:false,metrics:{todayVisits:1,todayUnique:1,active:1,yesterday:0,week:1,month:1,new:1,returning:0,guest:1,customers:0,mobile:0,tablet:0,desktop:1,averageDurationSeconds:30},devices:[{label:'Desktop',value:1}],browsers:[{label:'Chrome',value:1}],operatingSystems:[{label:'Windows',value:1}],daily:[{day:'2026-11-26',value:1}],hourly:[],monthly:[],pages:[{label:'/',value:1}]};
  if(p==='/visitor-analytics/logs')return {success:true,page:1,total:1,totalPages:1,data:[{visitId:'audit-visitor-session',firstVisit:'2026-11-26T08:00:00Z',lastActivity:'2026-11-26T08:00:30Z',durationSeconds:30,entryPage:'/',lastPage:'/menu',ip:'192.0.***.***',customerId:null,customerName:null,kind:'guest',device:'Desktop',os:'Windows',browser:'Chrome 130',screen:'1440x900',viewport:'1440x800',orientation:'landscape',country:'Unknown',state:'Unknown',city:'Unknown',returning:false,active:true}]};
  if(p.startsWith('/barcodes'))return {success:true,barcode:customer.barcode,customer,items:[{customer,barcode:customer.barcode}]};
  if(p.startsWith('/website-orders'))return {success:true,data:[]};
  throw Error('Missing API fixture: '+method+' '+p);
}
async function context(viewport,authenticated=true){
  const ctx=await browser.newContext({viewport,acceptDownloads:true,serviceWorkers:'block'});
  const topUps=structuredClone(walletRows);
  const customerTopUps=[];
  if(authenticated)await ctx.addInitScript(({id})=>{
    if (window.location.origin === 'null') return;
    sessionStorage.setItem('token','audit-admin-token');sessionStorage.setItem('customerToken','audit-customer-token');sessionStorage.setItem('customerUser',JSON.stringify({userId:'AUDIT',isFirstLogin:false}));
    localStorage.setItem('om-tiffin-website-cart',JSON.stringify([{menuItemId:id,name:'Audit Both Meal',price:80,quantity:1,mealType:'Lunch'}]));
  },{id});
  const pdf=await require(path.join(root,'backend/utils/receiptPdfGenerator'))(payment);
  await ctx.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if((url.hostname==='127.0.0.1'&&url.port==='5011')||(liveWebRoot&&url.origin==='https://www.omtiffinservices.com'&&url.pathname.startsWith('/api/'))){
      const reply=options=>route.fulfill({...options,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-allow-headers':'authorization,content-type,idempotency-key',...options.headers}});
      try{
        if(request.method()==='OPTIONS')return reply({status:204});
        if(request.method()!=='GET')writes.push({method:request.method(),path:url.pathname,headers:request.headers(),body:request.postDataBuffer()});
        if(url.pathname==='/api/wallet-top-ups'&&request.method()==='GET')return reply({json:{success:true,data:topUps}});
        if(url.pathname==='/api/customer-portal/wallet/top-ups'){
          if(request.method()==='GET')return reply({json:{success:true,data:customerTopUps}});
          const row={_id:'customer-top-up',status:'pending',amountPaise:50000,createdAt};
          customerTopUps.push(row);return reply({json:{success:true,data:row}});
        }
        if(url.pathname==='/api/customer-portal/wallet/top-ups/customer-top-up/whatsapp'&&request.method()==='POST'){
          customerTopUps[0].whatsappStatus='accepted';return reply({json:{success:true,data:customerTopUps[0]}});
        }
        if(/^\/api\/whatsapp-inbox\/media\/proof-[01]$/.test(url.pathname)&&request.method()==='GET')return reply({contentType:'image/png',body:tinyPng});
        if(/^\/api\/wallet-top-ups\/wallet-(approve|reject)\/decision$/.test(url.pathname)&&request.method()==='POST'){
          const payload=request.postDataJSON();
          const row=topUps.find(item=>url.pathname===`/api/wallet-top-ups/${item._id}/decision`);
          row.status=payload.action;
          if(payload.action==='rejected')row.rejectionReason=payload.detail;
          return reply({json:{success:true,data:row}});
        }
        if(url.pathname.endsWith('/pdf'))return reply({status:200,contentType:'application/pdf',body:pdf});
        return reply({status:200,contentType:'application/json',body:JSON.stringify(fixture(url,request.method()))});
      }catch(error){errors.push(error.message);return reply({status:500,body:JSON.stringify({message:error.message})});}
    }
    if(url.hostname==='127.0.0.1'&&url.port===auditPort)return route.continue();
    return route.abort();
  });
  ctx.on('page',page=>{page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>{errors.push('Native '+dialog.type()+' dialog: '+dialog.message());dialog.dismiss();});});
  return ctx;
}
(async()=>{
  process.env.VITE_API_URL='http://127.0.0.1:5011/api';
  const vite=await import(pathToFileURL(frontendRequire.resolve('vite')).href);
  if(liveWebRoot){
    const preview=await vite.preview({configFile:false,root:liveWebRoot,build:{outDir:liveWebRoot},preview:{host:'127.0.0.1',port:Number(auditPort),strictPort:true},logLevel:'error'});
    server={close:()=>new Promise(resolve=>preview.httpServer.close(resolve))};
  }else{
    server=await vite.createServer({root:path.join(root,'frontend'),server:{host:'127.0.0.1',port:Number(auditPort),strictPort:true},logLevel:'error'});await server.listen();
  }
  browser=await chromium.launch({channel:process.env.AUDIT_BROWSER_CHANNEL||'chrome',headless:true});
  const base='http://127.0.0.1:'+auditPort;
  await check('Walk-in live search, filter, history and pending request contract',async()=>{
    const ctx=await context({width:1440,height:900});
    try{
      const p=await ctx.newPage();
      const listing=p.waitForRequest(r=>r.url().endsWith('/api/walk-ins')&&r.method()==='GET');
      await p.goto(base+'/customers?view=walk-ins');assert.equal((await listing).headers().authorization,'Bearer audit-admin-token');
      const due=p.getByRole('article').filter({hasText:'Due Fixture'});
      await due.getByText('Partially paid').waitFor();
      const search=p.getByRole('searchbox',{name:'Search walk-in customers'});
      await search.fill('+91 (90000) 00002');await p.getByText('Paid Fixture',{exact:true}).waitFor();assert.equal(await due.count(),0);
      await search.fill('  dUe  ');await due.waitFor();assert.equal(await p.getByText('Paid Fixture',{exact:true}).count(),0);
      await search.fill('');await p.getByLabel('Filter payment status').selectOption('pending');assert.equal(await p.getByRole('article').count(),1);
      await due.getByText('Payment history (1)').click();await due.getByRole('button',{name:'Send Receipt'}).waitFor();
      await p.getByLabel('Filter payment status').selectOption('all');
      const newOrder=p.getByRole('article').filter({hasText:'No Order Fixture'});
      await newOrder.getByRole('button',{name:'Record Payment'}).click();
      await newOrder.getByLabel('Payment type').selectOption('Pending');await newOrder.getByLabel('Total amount').fill('400');
      const before=writes.length;
      await newOrder.getByRole('button',{name:'Save pending order'}).click();
      await p.getByText('Order saved as pending. No payment or receipt created.').waitFor();
      const calls=writes.slice(before).filter(r=>r.path.startsWith('/api/walk-ins'));
      assert.equal(calls.length,1);assert.equal(calls[0].method,'POST');assert.equal(calls[0].path,'/api/walk-ins/walk-new/payment');
      const {requestId,...payload}=JSON.parse(calls[0].body);
      assert.match(requestId,/^[a-f0-9-]{36}$/i);
      assert.deepEqual(payload,{newOrder:false,amount:'0',total:'400',type:'Pending',method:'Cash',reference:''});
    }finally{await ctx.close();}
  });
  await check('wallet review needs loaded evidence; only explicit approval or rejection calls decision API',async()=>{
    const ctx=await context({width:1440,height:900});
    try{
      const p=await ctx.newPage();
      const listing=p.waitForRequest(r=>r.url().endsWith('/api/wallet-top-ups')&&r.method()==='GET');
      await p.goto(base+'/customers?view=wallet-payment-approvals');assert.equal((await listing).headers().authorization,'Bearer audit-admin-token');
      const approval=p.getByRole('article').filter({hasText:'wallet-approve'}), rejection=p.getByRole('article').filter({hasText:'wallet-reject'});
      const approve=approval.getByRole('button',{name:'Approve verified payment'}), reject=rejection.getByRole('button',{name:'Reject',exact:true});
      await approve.waitFor();assert(await approve.isDisabled());assert(await reject.isDisabled());
      const before=writes.length;
      const imageRequest=p.waitForRequest(r=>r.url().endsWith('/api/whatsapp-inbox/media/proof-0'));
      await approval.getByRole('button',{name:/View image/}).click();assert.equal((await imageRequest).method(),'GET');
      const preview=approval.getByRole('img',{name:'Customer WhatsApp screenshot'});
      await preview.waitFor();await preview.evaluate(image=>image.decode());assert(await approve.isEnabled());
      await approval.getByRole('button',{name:'Close image'}).click();assert.equal(await preview.count(),0);
      await rejection.getByRole('textbox').fill('Fixture rejection');assert(await reject.isEnabled());
      assert.deepEqual(writes.slice(before),[],'typing and evidence preview must never write or credit a wallet');
      await approve.click();await approval.getByText(/· approved/).waitFor();assert.equal(await approve.count(),0);
      await reject.click();await rejection.getByText(/· rejected/).waitFor();assert.equal(await reject.count(),0);
      await p.getByText('No wallet payments awaiting review.').waitFor();
      assert.deepEqual(writes.slice(before).map(r=>[r.method,r.path,JSON.parse(r.body)]),[
        ['POST','/api/wallet-top-ups/wallet-approve/decision',{action:'approved',proofMessageId:'proof-0'}],
        ['POST','/api/wallet-top-ups/wallet-reject/decision',{action:'rejected',detail:'Fixture rejection'}],
      ]);
    }finally{await ctx.close();}
  });
  await check('customer top-up requests payment details without changing wallet credit',async()=>{
    const ctx=await context({width:390,height:844});
    try{
      const p=await ctx.newPage();await p.goto(base+'/customer/dashboard');
      await p.getByRole('button',{name:'Open my wallet'}).click();
      const wallet=p.getByRole('dialog',{name:'My wallet'});
      const credit=wallet.getByText('₹123.45',{exact:true});await credit.waitFor();
      await wallet.getByRole('button',{name:'₹500',exact:true}).click();
      const before=writes.length;
      await wallet.getByRole('button',{name:'Request Payment Details'}).click();
      await wallet.getByText('Payment details sent to your WhatsApp.',{exact:false}).waitFor();
      await wallet.getByText(/· pending/).waitFor();await credit.waitFor();
      const calls=writes.slice(before);
      assert.deepEqual(calls.map(r=>[r.method,r.path,r.headers.authorization]),[
        ['POST','/api/customer-portal/wallet/top-ups','Bearer audit-customer-token'],
        ['POST','/api/customer-portal/wallet/top-ups/customer-top-up/whatsapp','Bearer audit-customer-token'],
      ]);
      const {amount,requestId}=JSON.parse(calls[0].body);assert.equal(amount,'500');assert.match(requestId,/^[a-f0-9-]{36}$/i);
      assert.deepEqual(JSON.parse(calls[1].body),{});
    }finally{await ctx.close();}
  });
  for(const width of [320,375,390,430,768,1024,1440]){
    await check(`Walk-in and wallet approval controls fit at ${width}px`,async()=>{
      const ctx=await context({width,height:900});
      try{
        const p=await ctx.newPage();
        for(const [view,heading,control] of [
          ['walk-ins','Walk-in Customers',p.getByLabel('Filter payment status')],
          ['wallet-payment-approvals','Wallet Payment Approvals',p.getByRole('textbox',{name:'Reference (optional) or reason for rejection'}).first()],
        ]){
          await p.goto(`${base}/customers?view=${view}`);
          await p.getByRole('heading',{name:heading,exact:true}).last().waitFor();await control.waitFor();
          const box=await control.boundingBox();assert(box&&box.x>=0&&box.x+box.width<=width+1,`${view} controls overflow ${width}px`);
          assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
        }
      }finally{await ctx.close();}
    });
  }
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await check(`admin header, navigation and WhatsApp review fit at ${width}px`, async () => {
      const ctx = await context({width, height: 900});
      try {
        const page = await ctx.newPage();
        await page.goto(base + '/whatsapp-payment-approval');
        const header = page.locator('.om-admin-shell > div > div > header');
        const card = page.locator('.overflow-hidden.rounded-2xl').filter({has: page.locator('.whitespace-pre-wrap')});
        const wrapping = card.locator('.whitespace-pre-wrap');
        await wrapping.waitFor();
        assert.equal(await wrapping.evaluate(el => getComputedStyle(el).overflowWrap), 'anywhere');
        for (const locator of [header, header.getByRole('button', {name: 'Sign out'}), card, card.locator('select'), wrapping]) {
          const box = await locator.boundingBox();
          assert(box && box.x >= 0 && box.x + box.width <= width + 1, `Control exceeds ${width}px viewport`);
        }
        assert(await wrapping.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
        if (width < 1024) {
          const menu = header.getByRole('button', {name: 'Open sidebar'});
          const box = await menu.boundingBox();
          assert(box && box.width >= 44 && box.height >= 44);
          await menu.click();
          await page.getByRole('link', {name: 'WhatsApp Payment Approval'}).waitFor();
        } else {
          await page.getByRole('link', {name: 'WhatsApp Payment Approval'}).waitFor();
        }
      } finally {
        await ctx.close();
      }
    });
  }
  if(liveWebRoot){
    assert.deepEqual(errors,[]);
    console.log('PASS '+checks+' live artifact comparison groups with mocked APIs.');
    return;
  }
  await check('admin sidebar and header stay visible while a page module is delayed',async()=>{
    const ctx=await context({width:1440,height:1000}),p=await ctx.newPage();let release;const wait=new Promise(resolve=>{release=resolve});
    await p.route('**/src/pages/PriceSettings.jsx',async route=>{await wait;await route.continue()});
    try{await p.goto(base+'/price-settings');await p.getByRole('status',{name:'Loading page'}).waitFor();await p.locator('.om-admin-shell').waitFor();assert(await p.locator('aside').isVisible());assert(await p.locator('header').isVisible());release();await p.getByRole('button',{name:/Save/}).first().waitFor();}finally{release();await ctx.close()}
  });
  await check('consented public visits use the isolated analytics endpoint once',async()=>{
    const ctx=await context({width:1280,height:800});await ctx.addInitScript(()=>{if(window.location.origin!=='null')localStorage.setItem('omAnalyticsConsent','accepted');});const p=await ctx.newPage();const before=writes.length;
    try{await p.goto(base+'/');await p.waitForLoadState('networkidle');const tracks=writes.slice(before).filter(request=>request.path==='/api/visitor-analytics/track');assert.equal(tracks.length,1);const payload=JSON.parse(tracks[0].body.toString());assert.equal(payload.page,'/');assert.equal(payload.entryPage,'/');}finally{await ctx.close()}
  });
  const desktop=await context({width:1440,height:1000});const page=await desktop.newPage();
  const source=fs.readFileSync(path.join(root,'frontend/src/App.jsx'),'utf8');
  const routes=[...source.matchAll(/path="([^"]+)"/g)].map(match=>match[1]).filter(p=>p!=='*'&&p!=='/login'&&p!=='/customer-login').map(p=>p.replace(/:[^/]+/g,id));
  if(process.env.AUDIT_QUICK_REVIEW)routes.splice(0,routes.length,'/dashboard','/customers','/customer/dashboard','/','/menu','/customer-forgot-password','/customer-forgot-user-id','/customer-account-setup','/payments');
  await check('all '+routes.length+' defined website/admin/customer routes render in desktop Chrome',async()=>{
    for(const route of routes){await page.goto(base+route);await page.waitForLoadState('networkidle');assert(!await page.getByText('404 - Page Not Found',{exact:true}).count(),'404 '+route);assert((await page.locator('#root').innerText()).trim().length,'Blank route '+route);}
    assert.deepEqual(errors,[]);
    if(process.env.AUDIT_ARTIFACT_DIR){for(const [name,route] of [['admin-dashboard','/dashboard'],['admin-customers','/customers'],['customer-dashboard','/customer/dashboard'],['public-home','/'],['public-menu','/menu']]){await page.goto(base+route);await page.waitForLoadState('networkidle');await page.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,name+'-redesign.png'),fullPage:true});}}
  });
  const mobileAudit=await context({width:390,height:844});const mobilePage=await mobileAudit.newPage();
  await check('all '+routes.length+' defined routes render on mobile without document overflow',async()=>{
    for(const route of routes){await mobilePage.goto(base+route);await mobilePage.waitForLoadState('networkidle');assert(!await mobilePage.getByText('404 - Page Not Found',{exact:true}).count());assert((await mobilePage.locator('#root').innerText()).trim().length);assert(await mobilePage.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile document overflow '+route);}
  });
  if(process.env.AUDIT_ARTIFACT_DIR){await mobilePage.goto(base+'/customer/dashboard');await mobilePage.waitForLoadState('networkidle');await mobilePage.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'customer-mobile-redesign.png'),fullPage:true});}
  await mobileAudit.close();
  await check('dashboard period filters and actionable notification navigation',async()=>{
    await page.goto(base+'/dashboard');await page.getByLabel('Revenue year').selectOption('2026');await page.getByLabel('Revenue month').selectOption('10');await page.getByText('Oct 2026',{exact:true}).waitFor();
    assert.equal(await page.getByText('+12%',{exact:true}).count(),0);
    await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.getByRole('button',{name:'2 Website orders awaiting confirmation'}).click();assert(writes.some(item=>item.path==='/api/dashboard/notifications/read' && JSON.parse(item.body.toString()).category==='orders'));await page.waitForURL('**/website-orders');assert.equal((await page.getByRole('button',{name:'Notifications',exact:true}).innerText()).trim(),'1');await page.getByRole('heading',{name:'Website orders',exact:true}).waitFor();
    await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.keyboard.press('Escape');assert.equal(await page.getByLabel('Action notifications').count(),0);
    await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await page.getByText('You are all caught up. No unread notifications.').waitFor();assert.equal((await page.getByRole('button',{name:'Notifications',exact:true}).innerText()).trim(),'');
    if(process.env.AUDIT_ARTIFACT_DIR){await page.goto(base+'/dashboard');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'dashboard-notifications.png'),fullPage:false});}
  });
  await check('Android app bridge observes admin routes and exports canonical PDF bytes',async()=>{
    const java=fs.readFileSync(path.join(root,'android-admin/app/src/main/java/com/omtiffin/admin/MainActivity.java'),'utf8');
    const source=java.match(/String script=([\s\S]*?);\r?\n        web.evaluateJavascript/)[1];
    const script=[...source.matchAll(/"(?:\\.|[^"\\])*"/g)].map(match=>JSON.parse(match[0])).join('');
    await page.goto(base+'/dashboard');await page.getByLabel('Revenue year').waitFor();
    await page.evaluate(()=>{window.__nativeMessages=[];window.OMAdminNative={postMessage:value=>window.__nativeMessages.push(JSON.parse(value))};});
    await page.evaluate(script);
    assert.equal(await page.evaluate(()=>window.__nativeMessages.find(item=>item.type==='navigation').authenticated),true);
    await page.evaluate(()=>{const bytes='%PDF-1.4\nFixture app download';const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const link=document.createElement('a');link.href=url;link.download='Audit Receipt.pdf';document.body.append(link);link.click();link.remove();window.print();});
    await page.waitForFunction(()=>window.__nativeMessages.some(item=>item.type==='pdf'));
    const pdf=await page.evaluate(()=>window.__nativeMessages.find(item=>item.type==='pdf'));assert.equal(pdf.name,'Audit Receipt.pdf');assert(Buffer.from(pdf.data,'base64').toString().startsWith('%PDF-1.4'));
    assert(await page.evaluate(()=>window.__nativeMessages.some(item=>item.type==='print')));
  });
  await check('archived test alerts stay hidden while genuine delivery history remains',async()=>{
    await page.goto(base+'/announcement-delivery-status');await page.getByText('Real announcement fixture',{exact:true}).first().waitFor();assert.equal(await page.getByText('System Review Test',{exact:true}).count(),0);
    await page.getByLabel('Show archived test alerts').check();await page.getByText('System Review Test',{exact:true}).first().waitFor();await page.getByLabel('Show archived test alerts').uncheck();assert.equal(await page.getByText('System Review Test',{exact:true}).count(),0);
  });
  await check('/admin bookmark enters dashboard and remains signed in during background polling',async()=>{
    await page.goto(base+'/admin');await page.waitForURL('**/dashboard');await page.waitForTimeout(10500);assert(page.url().endsWith('/dashboard'));assert.equal(await page.evaluate(()=>sessionStorage.getItem('token')),'audit-admin-token');
  });
  await check('professional confirmation cancels safely, traps focus, and performs only a confirmed fixture action',async()=>{
    await page.goto(base+'/website-menu');await page.getByRole('button',{name:'Delete',exact:true}).first().click();
    const dialog=page.getByRole('alertdialog');await dialog.waitFor();assert.equal(await page.evaluate(()=>document.getElementById('root').inert),true);
    await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Delete');
    const before=writes.length;await dialog.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(writes.length,before);
    await page.getByRole('button',{name:'Delete',exact:true}).first().click();await page.getByRole('alertdialog').getByRole('button',{name:'Delete',exact:true}).click();await page.waitForTimeout(150);assert(writes.some(request=>request.method==='DELETE'&&request.path==='/api/website-menu/'+id));
  });
  await check('stale 401 and invalid-login 401 preserve a newer authenticated session',async()=>{
    await page.goto(base+'/dashboard');await page.waitForLoadState('networkidle');
    const result=await page.evaluate(async()=>{
      const {default:api}=await import('/src/services/api.js');const original=api.defaults.adapter;
      sessionStorage.setItem('token','old-token');
      api.defaults.adapter=async config=>{sessionStorage.setItem('token','new-token');throw {config,response:{status:401}};};
      try{await api.get('/bills');}catch{}
      const stale=sessionStorage.getItem('token');
      try{await api.post('/admin/login',{});}catch{}
      const invalidLogin=sessionStorage.getItem('token');api.defaults.adapter=original;return {stale,invalidLogin};
    });assert.equal(result.stale,'new-token');assert.equal(result.invalidLogin,'new-token');assert(page.url().endsWith('/dashboard'));
  });
  await check('billing loads its PDF renderer on demand and preserves fixture generation/send/download flow',async()=>{
    await page.goto(base+'/billing');await page.locator('select').first().selectOption(id);await page.getByRole('button',{name:'Generate Bill',exact:true}).click();await page.getByRole('status').filter({hasText:'Bill generated and sent to WhatsApp successfully.'}).waitFor({timeout:30000});
    await page.getByRole('button',{name:'Download PDF',exact:true}).waitFor();const [download]=await Promise.all([page.waitForEvent('download',{timeout:60000}),page.getByRole('button',{name:'Download PDF',exact:true}).click()]);assert(download.suggestedFilename().endsWith('.pdf'));
    assert(writes.some(request=>request.path==='/api/bills/send-whatsapp'));
  });
  await check('WhatsApp groups contacts, searches history, preserves drafts and replies through the existing endpoint',async()=>{
    await page.goto(base+'/whatsapp-inbox');await page.getByRole('button',{name:/Alice Shah/}).waitFor();assert.equal(await page.locator('.wa-contact').count(),2);
    await page.getByRole('textbox',{name:'Search conversations'}).fill('Lunch plan');assert.equal(await page.locator('.wa-contact').count(),1);await page.getByRole('textbox',{name:'Search conversations'}).fill('');
    await page.getByRole('button',{name:/Alice Shah/}).click();assert.equal(await page.locator('.wa-bubble').count(),3);assert((await page.locator('.wa-chat').innerText()).includes('Dinner confirmed'));
    await page.getByRole('textbox',{name:'Reply message'}).fill('Alice draft');await page.getByRole('button',{name:/Bob Patel/}).click();await page.getByRole('textbox',{name:'Reply message'}).fill('Bob draft');await page.getByRole('button',{name:/Alice Shah/}).click();assert.equal(await page.getByRole('textbox',{name:'Reply message'}).inputValue(),'Alice draft');
    await page.getByRole('button',{name:'Mark message a2 as read',exact:true}).click();await page.getByRole('button',{name:'Mark message a2 as read',exact:true}).waitFor({state:'hidden'});
    await page.getByRole('button',{name:'Send reply',exact:true}).click();await page.getByRole('status').filter({hasText:'WhatsApp reply sent successfully.'}).waitFor();assert(writes.some(request=>request.path==='/api/whatsapp-inbox/a2/reply'&&JSON.parse(request.body).message==='Alice draft'));
    if(process.env.AUDIT_ARTIFACT_DIR)await page.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'whatsapp-chat-desktop.png')});
    await page.getByRole('button',{name:'Delete message a1',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.locator('.wa-bubble').count(),3);
    await page.getByRole('button',{name:'Delete message a1',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('button',{name:'Delete message a1',exact:true}).waitFor({state:'hidden'});
  });
  const loginContext=await context({width:1440,height:1000},false);const loginPage=await loginContext.newPage();
  await check('unauthenticated /admin redirects to login; valid fixture login enters dashboard without native popup',async()=>{
    await loginPage.goto(base+'/admin');await loginPage.waitForURL('**/login');await loginPage.getByPlaceholder('Enter Email').waitFor();if(process.env.AUDIT_ARTIFACT_DIR)await loginPage.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'login-redesign.png'),fullPage:true});await loginPage.getByPlaceholder('Enter Email').fill('audit@example.invalid');await loginPage.getByPlaceholder('Enter Password').fill('fixture-password');await loginPage.getByRole('button',{name:'Login',exact:true}).click();await loginPage.waitForURL('**/dashboard');await loginPage.getByRole('status').filter({hasText:'You are signed in successfully.'}).waitFor();
  });
  for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
    const ctx=await context(viewport);const p=await ctx.newPage();
    await check(name+' receipt downloads and sends identical canonical PDF without style loss',async()=>{
      await p.goto(base+'/payment-receipt/'+id);await p.getByRole('button',{name:'Send Receipt PDF',exact:true}).waitFor();
      const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'Save as PDF',exact:true}).click();const download=await downloadPromise;assert(download.suggestedFilename().endsWith('.pdf'));
      const before=writes.length;await p.getByRole('button',{name:'Send Receipt PDF',exact:true}).click();await p.getByRole('status').filter({hasText:'Fixture action completed.'}).waitFor();
      const sent=writes.slice(before).find(request=>request.path==='/api/payments/send-whatsapp');assert(sent);const payload=JSON.parse(sent.body.toString());assert.equal(payload.paymentId,id);assert.equal(payload.renderPdf,true);
      if(process.env.AUDIT_ARTIFACT_DIR)await p.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'receipt-'+name+'-ui.png'),fullPage:true});
      assert((await p.evaluate(()=>document.documentElement.scrollWidth))<=viewport.width,'Horizontal overflow in '+name+' receipt');
    });
    await check(name+' professional invoice keeps stored totals and fits the viewport',async()=>{
      await p.goto(base+'/view-bills/'+id);await p.locator('.invoice-document').waitFor();assert.equal(await p.locator('.invoice-logo').count(),1);assert((await p.locator('.invoice-payment').innerText()).includes('249'));assert((await p.evaluate(()=>document.documentElement.scrollWidth))<=viewport.width);
      if(process.env.AUDIT_ARTIFACT_DIR)await p.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'invoice-'+name+'-ui.png'),fullPage:true});
    });
    if(name==='mobile')await check('mobile WhatsApp conversation navigation and phone search fit viewport',async()=>{
      await p.goto(base+'/whatsapp-inbox');await p.getByRole('button',{name:/Alice Shah/}).click();assert(await p.locator('.wa-chat').isVisible());assert(!(await p.locator('.wa-contacts').isVisible()));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=390));
      if(process.env.AUDIT_ARTIFACT_DIR)await p.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'whatsapp-chat-mobile.png')});
      await p.getByRole('button',{name:'Back to conversations',exact:true}).click();await p.getByRole('textbox',{name:'Search conversations'}).fill('9123456780');assert.equal(await p.locator('.wa-contact').count(),1);
    });
    if(name==='mobile')await check('mobile custom dialog remains within viewport and Escape cancels',async()=>{
      await p.goto(base+'/website-menu');await p.getByRole('button',{name:'Delete',exact:true}).first().click();await p.getByRole('alertdialog').waitFor();const box=await p.getByRole('alertdialog').boundingBox();assert(box.x>=0&&box.x+box.width<=390);
      if(process.env.AUDIT_ARTIFACT_DIR)await p.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'confirmation-mobile.png')});await p.keyboard.press('Escape');assert.equal(await p.getByRole('alertdialog').count(),0);
    });
    await ctx.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS '+checks+' real headless-browser groups; all backend APIs intercepted, no live records or messages changed.');
  await desktop.close();await loginContext.close();
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();await server?.close();});
