// Pure document renderer. Receives data through stdin; never connects to any database/provider.
const fs=require('fs');
for(const name of ['http','https','net','tls']){const module=require(name);for(const method of ['request','get','connect','createConnection'])if(typeof module[method]==='function')module[method]=()=>{throw Error('PDF renderer network access disabled');};}
global.fetch=async()=>{throw Error('PDF renderer network access disabled');};
let chunks=[],size=0;
process.stdin.on('data',chunk=>{size+=chunk.length;if(size>5*1024*1024){process.stderr.write('PDF_INPUT_TOO_LARGE');process.exit(1);}chunks.push(chunk);});
process.stdin.on('end',async()=>{
 try{
  const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(payload.type==='wallet-qr'){
   if(typeof payload.uri!=='string'||!payload.uri.startsWith('upi://pay?')||payload.uri.length>512)throw Error('Invalid UPI QR');
   const QRCode=require('./backend/node_modules/qrcode'), PDFDocument=require('./backend/node_modules/pdfkit');
   const image=await QRCode.toBuffer(payload.uri,{width:480,margin:4});
   const pdf=new PDFDocument({size:'A5'});
   pdf.pipe(process.stdout);
   pdf.fontSize(20).text('OM Tiffin Service', {align:'center'});
   pdf.moveDown().fontSize(13).text('Wallet top-up payment QR', {align:'center'});
   pdf.image(image,86,150,{width:246});
   pdf.fontSize(10).text('Wallet credit follows payment verification.',60,430,{align:'center'});
   pdf.end();
   return;
  }
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
