const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const logo = path.join(__dirname, '../../frontend/src/assets/logo.png');
const money = value => 'Rs. ' + Number(value || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

// Preserve the receipt's card layout while applying the saved design tokens.
module.exports = async function receiptCardPdf(payment, customer = {}, design) {
 const receiptNo = payment.receiptNo || String(payment._id || '').slice(-6).toUpperCase();
 const bill = payment.bill || {};
 const date = new Date(payment.paymentDate);
 const dateText = Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB', {timeZone:'Asia/Kolkata'});
 const timeText = Number.isNaN(date.getTime()) ? '-' : date.toLocaleTimeString('en-IN', {timeZone:'Asia/Kolkata'});
 const qr = design.showQr ? await QRCode.toBuffer(JSON.stringify({receipt:receiptNo,invoice:bill.invoiceNo,customer:customer.customerName,amount:payment.amount,status:bill.status}), {width:240,margin:1}) : null;
 return new Promise((resolve,reject) => {
  const doc = new PDFDocument({size:'A4',margin:36,info:{Title:'Payment Receipt '+receiptNo,Author:design.businessName}}), chunks=[];
  doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
  try {
   const width=523, gap=12, half=(width-gap)/2, right=36+half+gap;
   const muted='#64748b', border='#dce3ed', green='#009b45';
   const font=(value,bold=false)=>/[\u0A80-\u0AFF]/.test(String(value))?path.join(__dirname,'../assets/fonts/NotoSansGujarati-'+(bold?'Bold':'Regular')+'.ttf'):bold?({'Helvetica':'Helvetica-Bold','Times-Roman':'Times-Bold','Courier':'Courier-Bold'}[design.font]):design.font;
   const text=(value,x,y,w,size=design.fontSize,bold=false,color=design.text,align='left')=>{value=String(value??'-');doc.font(font(value,bold)).fontSize(size).fillColor(color).text(value,x,y,{width:w,align,lineGap:2});return doc.y;};
   const height=(value,w,size=design.fontSize,bold=false)=>doc.font(font(value,bold)).fontSize(size).heightOfString(String(value??'-'),{width:w,lineGap:2});
   const rule=y=>doc.moveTo(36,y).lineTo(559,y).strokeColor(border).lineWidth(.7).stroke();
   const card=(x,y,w,h)=>doc.roundedRect(x,y,w,h,8).fillAndStroke(design.layout==='classic'?'#ffffff':'#f6f8fc',border);
   const mark=(x,y,color)=>{doc.circle(x+5,y+5,5).fill(color);};
   doc.rect(36,34,width,3).fill(design.primary);
   const hasLogo=design.showLogo&&fs.existsSync(logo), groupWidth=294;
   let nameX=36,nameY=58,nameWidth=groupWidth;
   if(hasLogo){
    const x=design.logoPosition==='center'?36+(groupWidth-52)/2:design.logoPosition==='right'?36+groupWidth-52:36;
    doc.image(logo,x,58,{fit:[52,52]});
    if(design.logoPosition==='center')nameY=120;
    else if(design.logoPosition==='left'){nameX=101;nameWidth=groupWidth-65;}
    else nameWidth=groupWidth-65;
   }
   const align=design.logoPosition==='center'?'center':'left';
   let headerEnd=text(design.businessName,nameX,nameY,nameWidth,19,true,design.primary,align)+5;
   if(design.tagline)headerEnd=text(design.tagline,nameX,headerEnd,nameWidth,9,false,muted,align)+4;
   if(design.contact)headerEnd=text(design.contact,nameX,headerEnd,nameWidth,9,false,muted,align)+6;
   doc.roundedRect(404,58,155,19,9).fill('#dcfce7');text('PAYMENT RECEIVED',410,63,143,8,true,green,'center');
   let titleEnd=text('PAYMENT RECEIPT',344,93,215,17,true,design.text,'right');
   titleEnd=text('Receipt Date',344,titleEnd+9,215,9,false,muted,'right');
   titleEnd=text(dateText,344,titleEnd+4,215,10,true,design.text,'right');
   let y=Math.max(headerEnd,titleEnd,135)+17;rule(y);y+=17;
   const cardWidth=(width-3*gap)/4;
   const summaries=[['Receipt No.',receiptNo,design.primary],['Amount',money(payment.amount),green],['Payment Date',dateText,'#9333ea'],['Status','Paid',green]];
   const summaryHeight=Math.max(76,...summaries.map(([,v])=>height(v,cardWidth-20,design.fontSize,true)+46));
   summaries.forEach(([label,value,color],i)=>{const x=36+i*(cardWidth+gap);card(x,y,cardWidth,summaryHeight);mark(x+11,y+12,color);text(label,x+11,y+29,cardWidth-22,8,false,muted);text(value,x+11,y+44,cardWidth-22,design.fontSize,true,color);});
   y+=summaryHeight+17;
   const cx=51,px=right+15,inner=half-30;
   const customerFields=[['Customer Name',customer.customerName],['Phone',customer.phone],['Delivery Address',customer.address]];
   const paymentFields=[['Invoice No.',bill.invoiceNo],['Payment Method',payment.paymentMethod],['Payment Time',timeText],['Bill Status',bill.status||'-'],['Bill Balance',money(bill.pendingAmount)]];
   const customerHeight=customerFields.reduce((n,[,v])=>n+height(v,inner,design.fontSize,true)+30,0)+50;
   const rowHeights=paymentFields.map(([,v])=>Math.max(27,height(v,inner-92,design.fontSize,true)+10));
   const panelHeight=Math.max(242,customerHeight,55+rowHeights.reduce((a,b)=>a+b,0)+(qr?110:10));
   card(36,y,half,panelHeight);card(right,y,half,panelHeight);
   mark(cx,y+18,design.primary);text('Customer Details',cx+18,y+15,inner-18,12,true);
   mark(px,y+18,green);text('Payment Details',px+18,y+15,inner-18,12,true);
   let cy=y+49;for(const [label,value] of customerFields){text(label,cx,cy,inner,8,false,muted);cy=text(value,cx,cy+15,inner,design.fontSize,true)+15;}
   let py=y+49;paymentFields.forEach(([label,value],i)=>{text(label,px,py,86,8,false,muted);text(value,px+92,py,inner-92,design.fontSize,true,design.text,'right');py+=rowHeights[i];});
   if(qr){doc.image(qr,px+(inner-72)/2,py+4,{width:72,height:72});text('Scan to verify receipt',px,py+82,inner,8,false,muted,'center');}
   y+=panelHeight+19;rule(y);y+=17;
   const footerWidth=320;
   const footer=design.footer||'Thank you for choosing '+design.businessName+'. This receipt confirms that we have successfully received your payment.';
   const terms=design.terms||'This is a computer-generated receipt.\nNo signature is required for validity.\nPlease keep this receipt for your records.';
   const needed=height(footer,footerWidth,9)+height(terms,footerWidth,8)+65;
   if(y+needed>790){doc.addPage();y=45;}
   text('Thank You',36,y,footerWidth,14,true,design.primary);
   let fy=text(footer,36,y+28,footerWidth,9,false,design.text)+12;
   text(terms,36,fy,footerWidth,8,false,muted);
   if(design.signatureImage)doc.image(require('./signatureImage').decode(design.signatureImage),389,y+18,{fit:[170,50],align:'center',valign:'center'});
   doc.moveTo(389,y+76).lineTo(559,y+76).strokeColor('#94a3b8').stroke();
   text('Authorized Signature',389,y+86,170,9,true,design.text,'center');text(design.businessName,389,y+103,170,8,false,muted,'center');
   doc.end();
  }catch(error){doc.destroy();reject(error);}
 });
};
