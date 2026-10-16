const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve(__dirname,'..');
const out=process.env.WALLET_TEST_OUTPUT || path.join(require('node:os').tmpdir(),'omtiffin-wallet-qa');fs.mkdirSync(out,{recursive:true});
const person={_id:'synthetic-id',customerName:'Synthetic Customer',phone:'0000000000',barcode:'OMT-SYNTH',address:'Synthetic address',pricing:{},status:'Active'};
const row={_id:'meal:synthetic',type:'meal',modified:true,serviceDate:'2026-10-16',amountPaise:-9000,balancePaise:-9000,sequence:2,quantities:{breakfast:0,lunch:1,dinner:0}};
let browser,server,writes=0;
(async()=>{try{
server=http.createServer((req,res)=>{let file=path.join(root,'frontend/dist',new URL(req.url,'http://localhost').pathname);if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'frontend/dist/index.html');res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(file));}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE || (process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
for(const width of [360,430,1280]){
 const ctx=await browser.newContext({viewport:{width,height:900}});await ctx.addInitScript(()=>{sessionStorage.setItem('token','synthetic-only');sessionStorage.setItem('customerToken','synthetic-only');sessionStorage.setItem('customerUser',JSON.stringify({isFirstLogin:false}));});
 await ctx.route('**/api/**',async route=>{const req=route.request(),u=new URL(req.url()),p=u.pathname.replace(/^\/api/,'');if(req.method()!=='GET'){writes++;return route.fulfill({json:{success:true}});}let data={success:true,data:[]};
 if(p==='/wallets')data={success:true,data:u.searchParams.get('search')==='missing'?[]:[{customer:person._id,name:person.customerName,barcode:person.barcode,active:true,balancePaise:-9000,advancePaise:0}],summary:{customers:1,creditPaise:0,duePaise:9000}};
 else if(p.startsWith('/wallets/')||p==='/customer-portal/wallet'){if(u.searchParams.get('mode')==='cycle')await new Promise(r=>setTimeout(r,200));data={success:true,data:{active:true,balancePaise:-9000,sequence:2,history:u.searchParams.get('mode')==='cycle'?[]:[row],nextBefore:null}};}
 else if(p==='/customer-portal/profile')data={success:true,customer:person,account:{isFirstLogin:false}};
 else if(p.startsWith('/tiffins/'))data={success:true,data:person};
 else if(p==='/website-settings')data={success:true,data:{websiteEnabled:true}};
 await route.fulfill({json:data});
 });
 const page=await ctx.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/customers?view=wallets');await page.getByRole('button',{name:'Open wallet for Synthetic Customer',exact:true}).waitFor();
 if(width>=1024){assert((await page.getByRole('link',{name:'Customer Wallets',exact:true}).getAttribute('class')).includes('bg-white'));assert(!(await page.getByRole('link',{name:'Customers',exact:true}).getAttribute('class')).includes('bg-white'));}
 await page.getByRole('button',{name:'Open wallet for Synthetic Customer',exact:true}).click();await page.getByText('Entry modified',{exact:true}).waitFor();assert.equal(await page.getByText('Entry modified',{exact:true}).count(),1);
 await page.screenshot({path:path.join(out,`admin-${width}.png`)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByLabel('Wallet history filter').selectOption('cycle');assert.equal(await page.getByText('Entry modified',{exact:true}).count(),0);await page.getByText('No entries in this view.',{exact:false}).waitFor();await page.getByLabel('Wallet history filter').selectOption('all');await page.getByText('Entry modified',{exact:true}).waitFor();
 await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);assert.equal(await page.getByRole('button',{name:'Open wallet for Synthetic Customer',exact:true}).evaluate(el=>el===document.activeElement),true);
 await page.getByRole('searchbox').fill('missing');await page.getByText('No matching customers.',{exact:true}).waitFor();
 await page.goto(base+'/customer/dashboard');await page.getByRole('button',{name:'Open my wallet',exact:true}).waitFor();assert.equal(await page.getByRole('table',{name:'Wallet entries, latest update first'}).count(),0);await page.getByRole('button',{name:'Open my wallet',exact:true}).click();await page.getByText('Entry modified',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Add adjustment',exact:true}).count(),0);await page.screenshot({path:path.join(out,`customer-${width}.png`)});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await ctx.close();console.log('PASS '+width+'px wallet navigation, grouping, search, filter loading, close/focus, customer ownership UI and no horizontal overflow');
}assert.equal(writes,0);console.log('PASS no write requests or external customer actions');
}finally{await browser?.close();server?.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

