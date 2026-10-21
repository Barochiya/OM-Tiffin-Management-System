const PDFDocument=require('pdfkit');
const path=require('path'),fs=require('fs');
module.exports=async function salarySlipPdf(payment,settings){
 const snap=payment.snapshot,person=snap.employee,p=snap.payroll,designs=require('./documentDesign');
 const saved=settings||await designs.load('salary');const d=designs.validate(saved.enabled?saved:designs.defaults('salary'),'salary');
 return new Promise((resolve,reject)=>{
  const doc=new PDFDocument({size:'A4',margin:42,info:{Title:'Salary slip '+payment.slipNo,Author:d.businessName}}),chunks=[];
  doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
  const boldFont={'Helvetica':'Helvetica-Bold','Times-Roman':'Times-Bold','Courier':'Courier-Bold'}[d.font];
  const font=(v,bold)=>/[\u0a80-\u0aff]/.test(v)?path.join(__dirname,'../assets/fonts/NotoSansGujarati-'+(bold?'Bold':'Regular')+'.ttf'):bold?boldFont:d.font;
  const text=(v,x,y,width,size=d.fontSize,bold=false,color=d.text,options={})=>{v=String(v??'—');doc.font(font(v,bold)).fontSize(size).fillColor(color).text(v,x,y,{width,lineGap:3,...options});return doc.y;};
  const money=n=>'Rs. '+Number((n||0)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  try{
   const center=d.logoPosition==='center',headerHeight=center?150:126,modern=d.layout==='modern',headerText=modern?'#ffffff':d.text;
   if(modern)doc.roundedRect(42,40,511,headerHeight,12).fill(d.primary);else doc.rect(42,40,511,headerHeight).strokeColor(d.primary).stroke();
   const logo=path.join(__dirname,'../../frontend/src/assets/logo.png');if(d.showLogo&&fs.existsSync(logo))doc.image(logo,center?277:d.logoPosition==='right'?485:57,55,{fit:center?[40,40]:[50,50]});
   const hx=center?58:d.showLogo&&d.logoPosition==='left'?123:58,hw=center?479:d.showLogo?360:479,hy=center?99:57;
   text(d.businessName,hx,hy,hw,18,true,headerText,{height:44,ellipsis:true,align:center?'center':'left'});
   text('EMPLOYEE SALARY PAYMENT SLIP',hx,hy+43,hw,9,true,headerText,{align:center?'center':'left'});
   text(d.tagline,hx,hy+61,hw,8,false,headerText,{height:15,ellipsis:true,align:center?'center':'left'});text(d.contact,hx,hy+77,hw,8,false,headerText,{height:18,ellipsis:true,align:center?'center':'left'});
   let y=40+headerHeight+23;text(payment.slipNo,42,y,330,13,true,d.primary);text('Recorded payment',385,y,168,10,true,d.primary);y+=30;
   text('EMPLOYEE',42,y,230,9,true);text('SALARY PERIOD',320,y,230,9,true);y+=21;
   text(person.name,42,y,235,15,true,d.text,{height:28,ellipsis:true});text(p.periodStart&&p.periodEnd?p.periodStart+' to '+p.periodEnd:payment.month,320,y,230,11,true);y+=32;
   text('Mobile: '+person.phone,42,y,240);text('Payment date: '+payment.date,320,y,230);y+=23;text('Joining date: '+person.joiningDate,42,y,240);text('Method: '+payment.method,320,y,230);y+=26;
   doc.roundedRect(42,y,511,64,9).fill('#f0f4f5');text('CASH PAYMENT AMOUNT',58,y+12,230,9,true);text(money(payment.amountPaise),58,y+31,440,19,true,d.primary);y+=78;
   const nextPage=()=>{doc.addPage();text(d.businessName+' · Salary slip',42,40,511,12,true,d.primary);y=76;};
   const row=(label,value,bold=false)=>{doc.font(font(label,bold)).fontSize(d.fontSize);const height=Math.max(doc.heightOfString(label,{width:295,lineGap:3}),doc.heightOfString(value,{width:177,lineGap:3}))+10;if(y+height>716)nextPage();text(label,54,y,295,d.fontSize,bold);text(value,364,y,177,d.fontSize,bold,d.text,{align:'right'});doc.moveTo(54,y+height-5).lineTo(541,y+height-5).strokeColor('#e0e7e4').stroke();y+=height;};
   row('Gross earned ('+p.accruedDays+' elapsed working days)',money(p.grossPaise));row('Absence deduction ('+p.absentShifts+' absent shifts)',money(p.absenceDeductionPaise));row('Allowance',money(p.settings.allowancePaise));row('Other deduction',money(p.settings.deductionPaise));row('Net earned for salary cycle',money(p.netPaise),true);if(payment.advanceRecoveredPaise>0)row('Advance adjusted in this payment',money(payment.advanceRecoveredPaise));row('Total settled after this payment',money(snap.paidAfterPaise));row('Salary balance after this payment',money(snap.balanceAfterPaise),true);
   for(const message of [payment.note?'Payment reference: '+payment.note:'',d.footer,d.terms]){if(!message)continue;doc.font(font(message,false)).fontSize(9);const h=doc.heightOfString(message,{width:487,lineGap:3})+12;if(y+h>706)nextPage();y=text(message,54,y+7,487,9)+8;}
   if(y+57>740)nextPage();y=Math.max(y+57,730);
   if(d.signatureImage)doc.image(require('./signatureImage').decode(d.signatureImage),{fit:[180,48],x:338,y:y-57});
   doc.moveTo(54,y).lineTo(248,y).strokeColor('#9bad9f').stroke();doc.moveTo(330,y).lineTo(535,y).stroke();text('Employee acknowledgement',54,y+10,240,9,true);text('Authorized Signature',330,y+10,210,9,true,d.text,{align:'center'});text(d.businessName,330,y+28,210,8,false,d.text,{height:28,ellipsis:true,align:'center'});doc.end();
  }catch(e){reject(e);doc.destroy();}
 });
};
