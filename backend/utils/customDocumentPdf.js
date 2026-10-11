const PDFDocument=require('pdfkit'),QRCode=require('qrcode'),fs=require('fs'),path=require('path');
const logo=path.join(__dirname,'../../frontend/src/assets/logo.png');
const money=v=>'Rs. '+Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
module.exports=async(type,data,customer,design)=>{
 const qr=design.showQr?await QRCode.toBuffer(type==='bill'?`upi://pay?pa=${encodeURIComponent(design.upiId)}&pn=${encodeURIComponent(design.businessName)}&am=${Number(data.pendingAmount||0)}`:JSON.stringify({receipt:data.receiptNo,invoice:data.bill?.invoiceNo,amount:data.amount}),{width:180,margin:1}):null;
 return new Promise((resolve,reject)=>{
 const doc=new PDFDocument({size:'A4',margin:40,bufferPages:true}),chunks=[];doc.on('data',c=>chunks.push(c));doc.on('error',reject);doc.on('end',()=>resolve(Buffer.concat(chunks)));
 try{
 const font=(text,bold=false)=>/[\u0A80-\u0AFF]/.test(String(text))?path.join(__dirname,`../assets/fonts/NotoSansGujarati-${bold?'Bold':'Regular'}.ttf`):bold?({'Helvetica':'Helvetica-Bold','Times-Roman':'Times-Bold','Courier':'Courier-Bold'}[design.font]):design.font;
 const text=(value,x,y,width=515,size=design.fontSize,bold=false,color=design.text,align='left')=>{value=String(value??'-');doc.font(font(value,bold)).fontSize(size).fillColor(color).text(value,x,y,{width,align});return doc.y;};
 const line=y=>doc.moveTo(40,y).lineTo(555,y).strokeColor('#dbe3df').stroke();
 const room=h=>{if(doc.y+h>760){doc.addPage();doc.y=45;}};
 if(design.layout==='modern')doc.rect(40,36,515,5).fill(design.primary);
 let y=55;
 if(design.showLogo&&fs.existsSync(logo)){const x=design.logoPosition==='center'?268:design.logoPosition==='right'?505:40;doc.image(logo,x,y,{fit:[50,50]});y+=62;}
 const align=design.logoPosition==='center'?'center':'left';
 y=text(design.businessName,40,y,515,21,true,design.primary,align)+6;
 y=text(design.tagline,40,y,515,10,false,design.text,align)+6;
 y=text(design.contact,40,y,515,10,false,design.text,align)+18;
 y=text(type==='bill'?'TAX INVOICE':'PAYMENT RECEIPT',40,y,515,16,true,design.primary)+8;
 const number=type==='bill'?data.invoiceNo:data.receiptNo||String(data._id||'').slice(-6).toUpperCase();
 y=text('No: '+number,40,y,515,11,true)+4;
 const when=type==='bill'?`Period: ${data.month}/${data.year} · Cycle ${data.cycle}`:'Date: '+new Date(data.paymentDate).toLocaleDateString('en-GB',{timeZone:'Asia/Kolkata'});
 y=text(when,40,y)+12;line(y);y+=14;
 y=text(customer?.customerName,40,y,515,12,true)+4;
 y=text(customer?.phone,40,y)+4;y=text(customer?.address,40,y)+16;doc.y=y;
 if(type==='bill'){
  doc.rect(40,y,515,25).fill(design.primary);text('Date / Meal details',48,y+7,350,10,true,'#ffffff');text('Amount',440,y+7,105,10,true,'#ffffff','right');doc.y=y+34;
  for(const day of data.dailyDetails||[]){
    const date=new Date(day.date).toLocaleDateString('en-GB',{timeZone:'Asia/Kolkata'});
    const extras=(day.extraItems||[]).map(item=>`${item.description||'Extra'}: ${money(item.amount)}`).join('; ');
    const meals=`${date} · Breakfast: ${day.breakfastQty||0} · Lunch: ${day.lunchQty||0} · Dinner: ${day.dinnerQty||0}`;
    const details=[meals,extras,day.remark].filter(Boolean).join('\n');
    doc.font(font(details)).fontSize(design.fontSize);
    room(doc.heightOfString(details,{width:365})+25);y=doc.y;
    const end=text(details,48,y,365);
    text(money(day.dailyTotal??day.totalAmount??day.total),440,y,105,10,true,design.text,'right');
    doc.y=Math.max(end,doc.y)+12;line(doc.y);doc.y+=8;
  }
  if(!(data.dailyDetails||[]).length){text('No date-wise meal records',48,doc.y);doc.y+=14;}
 }
 room(190);y=doc.y+12;
 const rows=type==='bill'?[['Current cycle',Number(data.totalAmount||0)-Number(data.previousPendingAmount||0)],['Previous balance',Number(data.previousPendingAmount||0)],['Total payable',Number(data.totalAmount||0)],['Paid',Number(data.paidAmount||0)],['Balance',Number(data.pendingAmount||0)]]:[['Payment received',data.amount],['Invoice',data.bill?.invoiceNo],['Method',data.paymentMethod],['Bill balance',Number(data.bill?.pendingAmount||0)]];
 for(const [label,value] of rows){text(label,40,y,300,11,true);text(typeof value==='number'?money(value):value,350,y,205,12,true,design.primary,'right');y+=27;}
 doc.y=y+10;room(30);doc.y=text('Status: '+String(type==='bill'?data.status:data.bill?.status||'-'),40,doc.y,515,10,true)+14;
 if(qr){room(115);doc.image(qr,40,doc.y,{width:85});text(type==='bill'?'Scan to pay':'Receipt verification',138,doc.y+28,400,10);doc.y+=110;}
 if(design.terms){room(85);doc.y=text(design.terms,40,doc.y,515,9)+15;}
 if(design.footer){room(65);line(doc.y);doc.y=text(design.footer,40,doc.y+12,515,10,false,design.text,'center');}
 const range=doc.bufferedPageRange();for(let i=0;i<range.count;i++){doc.switchToPage(i);text(`${i+1} / ${range.count}`,40,790,515,8,false,'#68756e','right');}
 doc.end();
 }catch(e){doc.destroy();reject(e);}
 });
};
