const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
(async()=>{
 let token=null,calls=0,pending=[];
 const api={get(){calls++;return new Promise((resolve,reject)=>pending.push({resolve,reject}));},put:async()=>({data:{success:true}})};
 const ctx=vm.createContext({sessionStorage:{getItem:()=>token}});
 const mod=new vm.SourceTextModule(fs.readFileSync(path.join(__dirname,'../frontend/src/services/websiteSettingsService.js'),'utf8'),{context:ctx});
 await mod.link(()=>new vm.SyntheticModule(['default'],function(){this.setExport('default',api)},{context:ctx}));await mod.evaluate();
 const get=mod.namespace.getWebsiteSettings;
 const a=get(),b=get();assert.equal(calls,1);assert.equal(a,b);pending.shift().resolve({data:{version:1}});assert.equal((await a).version,1);
 const c=get();assert.equal(calls,2);pending.shift().resolve({data:{version:2}});assert.equal((await c).version,2);
 const d=get();pending.shift().reject(Error('offline'));await assert.rejects(d);const e=get();assert.equal(calls,4);pending.shift().resolve({data:{version:3}});await e;
 const publicRead=get();token='new-session';const authenticatedRead=get();assert.equal(calls,6);assert.notEqual(publicRead,authenticatedRead);pending.shift().resolve({data:{public:true}});pending.shift().resolve({data:{admin:true}});await Promise.all([publicRead,authenticatedRead]);
 const app=fs.readFileSync(path.join(__dirname,'../frontend/src/App.jsx'),'utf8');assert(app.includes('import Customers from'));assert(!app.includes('const Customers = lazy'));assert(app.includes('Suspense fallback'));assert(app.includes('lazy(() => import('));
 const billing=fs.readFileSync(path.join(__dirname,'../frontend/src/pages/Billing.jsx'),'utf8');assert(!billing.includes('import html2pdf from'));assert(billing.includes('import("html2pdf.js")'));
 for(const name of ['AdminLayout','CustomerLayout','PublicWebsiteLayout'])assert(fs.readFileSync(path.join(__dirname,'../frontend/src/layouts/'+name+'.jsx'),'utf8').includes('<Suspense fallback={<PageLoading />}><Outlet /></Suspense>'));
 console.log('PASS concurrent settings coalescing, fresh reads, failed-read retry, session isolation, route splitting and deferred PDF renderer');
})().catch(error=>{console.error(error);process.exitCode=1});
