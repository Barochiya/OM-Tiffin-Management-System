// Pure document renderer. Receives data through stdin; never connects to any database/provider.
const fs=require('fs');
for(const name of ['http','https','net','tls']){const module=require(name);for(const method of ['request','get','connect','createConnection'])if(typeof module[method]==='function')module[method]=()=>{throw Error('PDF renderer network access disabled');};}
global.fetch=async()=>{throw Error('PDF renderer network access disabled');};
let chunks=[],size=0;
process.stdin.on('data',chunk=>{size+=chunk.length;if(size>5*1024*1024){process.stderr.write('PDF_INPUT_TOO_LARGE');process.exit(1);}chunks.push(chunk);});
process.stdin.on('end',async()=>{
 try{
  const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const designModule=require('./backend/utils/documentDesign');
  if(payload.operation==='validate-design'){process.stdout.write(JSON.stringify(designModule.validate(payload.design,payload.type)));return;}
  if(!['bill','receipt','salary','pg'].includes(payload.type)||!payload.data||typeof payload.data!=='object')throw Error('Invalid PDF payload');
  const design=designModule.validate(payload.design||designModule.defaults(payload.type),payload.type);designModule.load=async()=>design;
  let bytes;
  if(payload.type==='pg')bytes=await require('./backend/utils/pgReceiptPdf')(payload.data,design);
  else if(payload.type==='salary')bytes=await require('./backend/utils/salarySlipPdf')(payload.data,design);
  else if(payload.type==='bill')bytes=await require('./backend/utils/billPdfGenerator')(payload.data,payload.customer||payload.data.customer||{});
  else bytes=await require('./backend/utils/receiptPdfGenerator')({...payload.data,customer:payload.customer||payload.data.customer||{}});
  if(!Buffer.isBuffer(bytes)||!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))throw Error('Invalid PDF result');
  process.stdout.write(bytes);
 }catch{process.stderr.write('PDF_RENDER_FAILED');process.exitCode=1;}
});
