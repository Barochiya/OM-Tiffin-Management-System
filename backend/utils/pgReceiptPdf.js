const PDFDocument=require('pdfkit');
const fs=require('fs'),path=require('path');
module.exports=async function(p,design={}){return new Promise((resolve,reject)=>{
 const defaults=require('./documentDesign').defaults('pg');design=design.enabled===false?{...defaults,signatureImage:design.signatureImage}:{...defaults,...design};
 const doc=new PDFDocument({size:'A4',margin:42}),chunks=[];doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
 const navy=design.primary,gold='#c69b3d',muted='#687b92',ink=design.text,left=42,right=553,width=511,base=design.fontSize,face=design.font;
 const font=(v,bold=false)=>/[\u0A80-\u0AFF]/.test(String(v))?path.join(__dirname,'../assets/fonts/NotoSansGujarati-'+(bold?'Bold':'Regular')+'.ttf'):bold?({'Helvetica':'Helvetica-Bold','Times-Roman':'Times-Bold','Courier':'Courier-Bold'}[face]):face;
 const text=(v,x,y,w,size=11,bold=false,color=ink)=>doc.font(font(v,bold)).fontSize(size<=16?Math.max(7,size+base-11):size).fillColor(color).text(String(v),x,y,{width:w,lineGap:3});
 const bounded=(v,x,y,w,h,size,color,bold=false)=>doc.font(font(v,bold)).fontSize(size).fillColor(color).text(String(v),x,y,{width:w,height:h,ellipsis:true});
 const money=v=>'Rs. '+(Number(v||0)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
 const classic=design.layout==='classic',header=classic?'#fff':navy,headerText=classic?navy:'#fff',headerMuted=classic?muted:'#d5dfee';
 doc.rect(0,0,595,109).fill(header);doc.rect(0,109,595,4).fill(gold);
 const logo=design.logoImage?require('./signatureImage').decode(design.logoImage):path.join(__dirname,'../../frontend/src/assets/om-pg-logo.png');
 const logoX=design.logoPosition==='right'?477:design.logoPosition==='center'?259:42;
 if(design.showLogo){doc.roundedRect(logoX,20,76,76,12).fill('#fff');if(Buffer.isBuffer(logo)||fs.existsSync(logo))doc.image(logo,logoX+1,21,{fit:[74,74]});}
 const tx=design.logoPosition==='left'&&design.showLogo?135:42,tw=design.logoPosition==='center'&&design.showLogo?195:design.logoPosition==='right'&&design.showLogo?410:410;
 bounded(design.businessName,tx,27,tw,29,24,headerText,true);
 if(design.logoPosition==='center'&&design.showLogo)bounded('PAYMENT RECEIPT',358,36,195,28,12,headerText,true);else bounded('PAYMENT RECEIPT',tx,61,tw,18,11,headerMuted,true);
 bounded(design.tagline,tx,80,tw,15,8,headerMuted);
 doc.roundedRect(left,136,width,92,14).fill('#edf4fb');text('AMOUNT RECEIVED',60,151,300,9,true,muted);text(money(p.amountPaise),60,174,400,27,true,navy);text('RECORDED',449,160,85,8,true,'#28684d');
 text('STUDENT',left,252,350,9,true,muted);bounded(p.snapshot.name,left,271,340,42,16,ink,true);text('+'+p.snapshot.phone,left,315,330,10,false,muted);
 text('FEE MONTH',413,252,140,9,true,muted);const month=/^\d{4}-\d{2}$/.test(p.month)?new Date(p.month+'-01T12:00:00Z').toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}):p.month;bounded(month,413,273,140,42,16,navy,true);
 doc.moveTo(left,342).lineTo(right,342).strokeColor('#dce5ef').stroke();
 text('RECEIPT NUMBER',left,357,250,8,true,muted);text(p.receiptNo,left,373,250,10,true);
 text('PAYMENT DATE',315,357,230,8,true,muted);text(p.date,315,373,230,10,true);
 text('PAYMENT METHOD',left,406,250,8,true,muted);text(p.method,left,422,250,11,true);
 if(p.periodStart&&p.periodEnd){text('STAY PERIOD',315,406,230,8,true,muted);text(p.periodStart+' to '+p.periodEnd,315,422,240,10,true);}
 const rows=[['Monthly accommodation fee',p.snapshot.feePaise],['Received with this receipt',p.amountPaise],['Total received for this month',p.snapshot.paidAfterPaise],['Balance after this payment',p.snapshot.pendingAfterPaise]];
 let y=467;for(let i=0;i<rows.length;i++){if(i===3)doc.roundedRect(left,y-8,width,34,7).fill('#edf4fb');text(rows[i][0],left+12,y,330,11,i===3);doc.font(font('',true)).fontSize(base).fillColor(i===3?navy:ink).text(money(rows[i][1]),390,y,{width:148,align:'right'});if(i<3)doc.moveTo(left+12,y+22).lineTo(right-12,y+22).strokeColor('#e5ebf3').stroke();y+=39;}
 if(p.reference){text('REFERENCE / NOTE',left,641,210,8,true,muted);bounded(p.reference,left,657,290,66,9,ink);}
 if(design.signatureImage){require('./signatureImage').validate(design.signatureImage);doc.image(require('./signatureImage').decode(design.signatureImage),386,659,{fit:[130,43],align:'center'});}
 doc.moveTo(354,709).lineTo(right,709).strokeColor('#bcc8d8').stroke();text('Authorized Signature',362,719,185,10,true,navy);bounded(design.businessName,385,739,160,18,9,muted,true);
 if(design.contact)bounded(design.contact,left,758,width,19,9,muted);
 doc.page.margins.bottom=0;doc.rect(0,788,595,54).fill(navy);bounded(design.footer,left,802,130,27,10,'#fff',true);bounded(design.terms,185,803,368,27,8,'#dce6f4');doc.end();
});};
