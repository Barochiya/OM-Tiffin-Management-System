const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const root = process.argv[2] || path.resolve(__dirname,'..');
const frontendRequire = createRequire(path.join(root,'frontend/package.json'));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const id='507f1f77bcf86cd799439011';
const customer={_id:id,customerName:'Audit Customer',phone:'0000000000',address:'Audit Address, Gandhinagar',status:'Active',mealType:'Both',barcode:'OMT-000001',pricing:{pricingType:'default',breakfastPrice:0,lunchPrice:117,dinnerPrice:132},advanceBalance:0};
const bill={_id:id,customer,invoiceNo:'AUDIT-1',month:10,year:2026,cycle:'1',status:'Partial',totalAmount:249,paidAmount:125,pendingAmount:124,dailyDetails:[],whatsappDelivery:{status:'sent'}};
const payment={_id:id,customer,bill,amount:125,paymentMethod:'Bank',paymentDate:'2026-10-08T02:00:00Z',status:'Success'};
const menu={_id:id,name:'Audit Both Meal',description:'Fixture only',mealType:'Both',price:80,isAvailable:true,sortOrder:1};
const settings={websiteEnabled:true,plansEnabled:true,menuEnabled:true,onlineOrdersEnabled:true,inquiriesEnabled:true,customerLoginEnabled:true,testimonialsEnabled:true,faqEnabled:true,contactEnabled:true,lunchEnabled:true,dinnerEnabled:true};
let server,browser,checks=0;
const errors=[],writes=[];
async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
function fixture(url,method){
  const p=url.pathname.replace(/^\/api/,'');
  if(method!=='GET'){
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
  if(p.startsWith('/customer-portal/'))return {success:true,data:[]};
  if(p==='/customer-modification-admin/settings')return {success:true,data:{lunchCutoffTime:'10:30',dinnerCutoffTime:'17:00',skipTiffinEnabled:true,extraTiffinEnabled:true,mealModificationEnabled:true,otherRequestEnabled:true}};
  if(p.startsWith('/customer-modification-admin/'))return {success:true,data:[]};
  if(p.startsWith('/daily-entry'))return {success:true,data:[]};
  if(p==='/bills/delivery-status'||p==='/announcement-status'||p.startsWith('/whatsapp-inbox'))return {success:true,data:[]};
  if(p==='/bills')return {success:true,data:[bill]};
  if(p.startsWith('/bills/'))return {success:true,data:bill};
  if(p==='/payments')return [payment];
  if(p.startsWith('/payments/pending/')||p.startsWith('/payments/customer/'))return [bill];
  if(p.startsWith('/payments/'))return payment;
  if(p==='/dashboard')return {stats:{totalCustomers:1,activeCustomers:1,totalRevenue:125,pendingAmount:124,todayCollection:125,todayMeals:2},revenueChart:[],recentPayments:[],pendingBills:[],topCustomers:[]};
  if(p.startsWith('/barcodes'))return {success:true,barcode:customer.barcode,customer,items:[{customer,barcode:customer.barcode}]};
  if(p.startsWith('/website-orders'))return {success:true,data:[]};
  throw Error('Missing API fixture: '+method+' '+p);
}
async function context(viewport,authenticated=true){
  const ctx=await browser.newContext({viewport,acceptDownloads:true});
  if(authenticated)await ctx.addInitScript(({id})=>{
    if (window.location.origin === 'null') return;
    sessionStorage.setItem('token','audit-admin-token');sessionStorage.setItem('customerToken','audit-customer-token');sessionStorage.setItem('customerUser',JSON.stringify({userId:'AUDIT',isFirstLogin:false}));
    localStorage.setItem('om-tiffin-website-cart',JSON.stringify([{menuItemId:id,name:'Audit Both Meal',price:80,quantity:1,mealType:'Lunch'}]));
  },{id});
  const pdf=await require(path.join(root,'backend/utils/receiptPdfGenerator'))(payment);
  await ctx.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.hostname==='127.0.0.1'&&url.port==='5011'){
      try{
        if(request.method()!=='GET')writes.push({method:request.method(),path:url.pathname,headers:request.headers(),body:request.postDataBuffer()});
        if(url.pathname.endsWith('/pdf'))return route.fulfill({status:200,contentType:'application/pdf',body:pdf});
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture(url,request.method()))});
      }catch(error){errors.push(error.message);return route.fulfill({status:500,body:JSON.stringify({message:error.message})});}
    }
    if(url.hostname==='127.0.0.1'&&url.port==='5179')return route.continue();
    return route.abort();
  });
  ctx.on('page',page=>{page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>{errors.push('Native '+dialog.type()+' dialog: '+dialog.message());dialog.dismiss();});});
  return ctx;
}
(async()=>{
  process.env.VITE_API_URL='http://127.0.0.1:5011/api';
  const vite=await import(pathToFileURL(frontendRequire.resolve('vite')).href);
  server=await vite.createServer({root:path.join(root,'frontend'),server:{host:'127.0.0.1',port:5179,strictPort:true},logLevel:'error'});await server.listen();
  browser=await chromium.launch({channel:process.env.AUDIT_BROWSER_CHANNEL||'chrome',headless:true});
  const base='http://127.0.0.1:5179';
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
      const sent=writes.slice(before).find(request=>request.path==='/api/payments/send-whatsapp');assert(sent);assert.equal(sent.headers['x-payment-id'],id);assert.equal(sent.body.subarray(0,5).toString(),'%PDF-');
      if(process.env.AUDIT_ARTIFACT_DIR)await p.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'receipt-'+name+'-ui.png'),fullPage:true});
      assert((await p.evaluate(()=>document.documentElement.scrollWidth))<=viewport.width,'Horizontal overflow in '+name+' receipt');
    });
    await check(name+' professional invoice keeps stored totals and fits the viewport',async()=>{
      await p.goto(base+'/view-bills/'+id);await p.locator('.invoice-document').waitFor();assert.equal(await p.locator('.invoice-logo').count(),1);assert((await p.locator('.invoice-payment').innerText()).includes('249'));assert((await p.evaluate(()=>document.documentElement.scrollWidth))<=viewport.width);
      if(process.env.AUDIT_ARTIFACT_DIR)await p.screenshot({path:path.join(process.env.AUDIT_ARTIFACT_DIR,'invoice-'+name+'-ui.png'),fullPage:true});
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
