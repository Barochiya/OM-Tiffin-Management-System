const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {periods,boundary,change}=require('../backend/utils/dashboardPeriods');
const now=new Date('2026-10-08T10:00:00Z');
assert.equal(boundary(2026,1).toISOString(),'2025-12-31T18:30:00.000Z');
assert.equal(periods({year:'2026',month:'1'},now).previousStart.toISOString(),'2025-11-30T18:30:00.000Z');
assert.equal(periods({year:'2024',month:'2'},now).end.toISOString(),'2024-02-29T18:30:00.000Z');
assert.equal(change(150,100,'test').percent,50);assert.equal(change(0,100,'test').percent,-100);assert.equal(change(50,0,'test').percent,null);
for(const query of [{year:'2026',month:'13'},{year:'all',month:'2'},{year:'bad'},{year:'2026',month:'1.5'}])assert.throws(()=>periods(query,now));
const payments=[{amount:100,paymentDate:new Date('2025-12-31T20:00:00Z'),status:'Success'}, {amount:200,paymentDate:new Date('2026-01-31T20:00:00Z'),status:'Success'}, {amount:300,paymentDate:new Date('2025-12-20T20:00:00Z'),status:'Success'}, {amount:999,paymentDate:new Date('2026-01-15T00:00:00Z'),status:'Failed'}];
const chain=value=>({populate(){return this;},sort(){return this;},limit(){return Promise.resolve(value);},then(resolve,reject){return Promise.resolve(value).then(resolve,reject);}});
function model(name,value){const file=require.resolve(path.join(root,'backend/models',name));require.cache[file]={id:file,filename:file,loaded:true,exports:value};}
model('Payment',{find:()=>chain([]),aggregate:async pipeline=>{
 assert.deepEqual(pipeline[0],{$match:{status:'Success'}});
 let rows=payments.filter(row=>row.status==='Success');
 const range=pipeline.find(stage=>stage.$match?.reportingDate)?.$match.reportingDate;
 if(range) rows=rows.filter(row=>row.paymentDate>=range.$gte&&row.paymentDate<range.$lt);
 const group=pipeline.find(stage=>stage.$group).$group;
 if(group.total)return [{total:rows.reduce((sum,row)=>sum+row.amount,0)}];
 if(group.totalPaid)return [];
 if(group.revenue){const groups={};for(const row of rows){const date=new Date(+row.paymentDate+19800000),year=date.getUTCFullYear(),month=date.getUTCMonth()+1,key=year+'-'+month;groups[key]||={_id:{year,month},revenue:0};groups[key].revenue+=row.amount;}return Object.values(groups);}
 return [{_id:2026},{_id:2025}];
}});
model('Tiffin',{countDocuments:async filter=>filter?8:10});model('Bill',{find:filter=>{assert.equal(filter.carriedForward.$ne,true);return chain([{pendingAmount:20}]);},countDocuments:async()=>2});
model('DailyEntry',{aggregate:async()=>[{total:3}]});
const controller=require('../backend/controllers/dashboardController');
const res=()=>({code:200,status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
(async()=>{
 let result=res();await controller.getDashboard({query:{year:'2026',month:'1'}},result);
 assert.equal(result.body.stats.totalRevenue,100);assert.equal(result.body.growth.revenue.percent,-66.7);
 assert.equal(result.body.revenueChart[0].growth.percent,-66.7);assert.equal(result.body.revenueChart[1].revenue,200);assert.equal(result.body.revenueChart[1].growth.percent,100);
 assert.equal(result.body.growth.active.percent,80);assert.equal(result.body.growth.pending.percent,null);
 result=res();await controller.getDashboard({query:{year:'2026'}},result);assert.equal(result.body.stats.totalRevenue,300);
 result=res();await controller.getDashboard({query:{}},result);assert.equal(result.body.stats.totalRevenue,600);
 result=res();await controller.getDashboard({query:{year:'bad'}},result);assert.equal(result.code,400);
 const filters={};for(const name of ['WebsiteOrder','WebsiteReview','CustomerModificationRequest','WhatsAppMessage','AnnouncementDelivery'])model(name,{countDocuments:async filter=>{filters[name]||=[];filters[name].push(filter);if(name==='WebsiteReview')throw Error('Fixture unavailable');return 2;}});
 const notifications=require('../backend/controllers/adminNotificationsController');result=res();await notifications.getAdminNotifications({},result);
 assert.equal(result.body.total,12);assert.deepEqual(result.body.unavailable,['reviews']);
 assert.deepEqual(filters.WhatsAppMessage[1].paymentStatus,{$ne:'pending_review'});
 const routes=require('../backend/routes/dashboardRoutes').stack.filter(layer=>layer.route);assert(routes.every(layer=>layer.route.stack.length===2));
 console.log('PASS IST year/month boundaries, leap year, real positive/negative growth, zero baselines, successful payments only, year separation, current customer share, invalid filters, protected notifications, partial errors and no double-counted payment messages. No DB connection or writes.');
})().catch(error=>{console.error(error);process.exitCode=1;});
