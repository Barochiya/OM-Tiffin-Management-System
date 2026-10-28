const PDFDocument=require('pdfkit');
const fs=require('fs'),path=require('path');
module.exports=async function(p,design={}){return new Promise((resolve,reject)=>{
 const doc=new PDFDocument({size:'A4',margin:42}),chunks=[];doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
 const navy='#142d50',gold='#c69b3d',muted='#687b92',ink='#203b56',left=42,right=553,width=511;
 const font=(v,bold=false)=>/[\u0A80-\u0AFF]/.test(String(v))?path.join(__dirname,'../assets/fonts/NotoSansGujarati-'+(bold?'Bold':'Regular')+'.ttf'):bold?'Helvetica-Bold':'Helvetica';
 const text=(v,x,y,w,size=11,bold=false,color=ink)=>doc.font(font(v,bold)).fontSize(size).fillColor(color).text(String(v),x,y,{width:w,lineGap:3});
 const money=v=>'Rs. '+(Number(v||0)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
 doc.rect(0,0,595,109).fill(navy);doc.rect(0,109,595,4).fill(gold);
 const logo=path.join(__dirname,'../../frontend/src/assets/om-pg-logo.png');doc.roundedRect(42,20,76,76,12).fill('#fff');if(fs.existsSync(logo))doc.image(logo,43,21,{fit:[74,74]});
 text('OM PG',135,27,270,24,true,'#fff');text('PAYMENT RECEIPT',135,61,270,11,true,'#d5dfee');text('MONTHLY ACCOMMODATION',135,80,330,8,false,'#d5dfee');
 doc.roundedRect(left,136,width,92,14).fill('#edf4fb');text('AMOUNT RECEIVED',60,151,300,9,true,muted);text(money(p.amountPaise),60,174,400,27,true,navy);text('RECORDED',449,160,85,8,true,'#28684d');
 text('STUDENT',left,252,350,9,true,muted);text(p.snapshot.name,left,271,340,16,true);text('+'+p.snapshot.phone,left,doc.y+6,330,10,false,muted);
 text('FEE MONTH',413,252,140,9,true,muted);text(p.month,413,273,140,16,true,navy);
 doc.moveTo(left,334).lineTo(right,334).strokeColor('#dce5ef').stroke();
 text('RECEIPT NUMBER',left,351,250,8,true,muted);text(p.receiptNo,left,367,250,10,true);
 text('PAYMENT DATE',315,351,230,8,true,muted);text(p.date,315,367,230,10,true);
 text('PAYMENT METHOD',left,400,250,8,true,muted);text(p.method,left,416,250,11,true);
 const rows=[['Monthly accommodation fee',p.snapshot.feePaise],['Received with this receipt',p.amountPaise],['Total received for this month',p.snapshot.paidAfterPaise],['Balance after this payment',p.snapshot.pendingAfterPaise]];
 let y=461;for(let i=0;i<rows.length;i++){if(i===3)doc.roundedRect(left,y-8,width,34,7).fill('#edf4fb');text(rows[i][0],left+12,y,330,11,i===3);doc.font('Helvetica-Bold').fontSize(11).fillColor(i===3?navy:ink).text(money(rows[i][1]),390,y,{width:148,align:'right'});if(i<3)doc.moveTo(left+12,y+22).lineTo(right-12,y+22).strokeColor('#e5ebf3').stroke();y+=39;}
 if(p.reference){text('REFERENCE / NOTE',left,636,210,8,true,muted);text(p.reference,left,652,290,9,false,ink);}
 if(design.signatureImage){require('./signatureImage').validate(design.signatureImage);doc.image(require('./signatureImage').decode(design.signatureImage),386,652,{fit:[130,43],align:'center'});}
 doc.moveTo(354,703).lineTo(right,703).strokeColor('#bcc8d8').stroke();text('Authorized Signature',362,714,185,10,true,navy);text('OM PG',416,734,130,9,true,muted);
 doc.page.margins.bottom=0;doc.rect(0,788,595,54).fill(navy);text('OM PG',left,802,90,10,true,'#fff');text('This receipt records the payment and balance shown above.',130,803,423,8,false,'#dce6f4');
 doc.end();
});};
