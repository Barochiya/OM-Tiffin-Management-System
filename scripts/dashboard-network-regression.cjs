const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
(async()=>{
 let calls=0,scenario='network';
 const api={get:async()=>{calls++;if(scenario==='network'&&calls===1)throw Object.assign(Error('Synthetic connection failure'),{code:'ERR_NETWORK'});if(scenario==='auth')throw Object.assign(Error('Synthetic unauthorized'),{response:{status:401}});if(scenario==='timeout')throw Object.assign(Error('Synthetic timeout'),{code:'ECONNABORTED'});return {data:{stats:{totalRevenue:500}}};}};
 const context=vm.createContext({console});const mod=new vm.SourceTextModule(fs.readFileSync(path.join(__dirname,'../frontend/src/services/dashboardService.js'),'utf8'),{context});
 await mod.link(()=>new vm.SyntheticModule(['default'],function(){this.setExport('default',api);},{context}));await mod.evaluate();
 const result=await mod.namespace.getDashboardAnalytics();assert.equal(result.stats.totalRevenue,500);assert.equal(calls,2);
 calls=0;scenario='auth';await assert.rejects(()=>mod.namespace.getDashboardAnalytics());assert.equal(calls,1);
 calls=0;scenario='timeout';await assert.rejects(()=>mod.namespace.getDashboardAnalytics());assert.equal(calls,2);
 console.log('PASS dashboard read retries one transient network failure, never retries auth failures, and stops after two timed-out attempts; no real network or writes');
})().catch(error=>{console.error(error);process.exitCode=1;});
