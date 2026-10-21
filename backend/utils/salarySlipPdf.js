const PDFDocument=require('pdfkit');
const path=require('path'),fs=require('fs');
module.exports=async function salarySlipPdf(payment){
 const snap=payment.snapshot,person=snap.employee,p=snap.payroll;
 return new Promise((resolve,reject)=>{
  const doc=new PDFDocument({size:'A4',margin:42,info:{Title:'Salary slip '+payment.slipNo,Author:'OM Tiffin Service'}}),chunks=[];
  doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
  const text=(v,x,y,width,size=10,bold=false,color='#18372e')=>{v=String(v??'—');const gujarati=/[\u0a80-\u0aff]/.test(v);doc.font(gujarati?path.join(__dirname,'../assets/fonts/NotoSansGujarati-'+(bold?'Bold':'Regular')+'.ttf'):bold?'Helvetica-Bold':'Helvetica').fontSize(size).fillColor(color).text(v,x,y,{width,lineGap:3});};
  const money=n=>'Rs. '+Number((n||0)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  try{
   doc.roundedRect(42,40,511,102,12).fill('#163f35');const logo=path.join(__dirname,'../../frontend/src/assets/logo.png');if(fs.existsSync(logo))doc.image(logo,57,60,{fit:[54,54]});
   text('OM TIFFIN SERVICE',126,62,250,19,true,'#ffffff');text('EMPLOYEE SALARY PAYMENT SLIP',126,94,330,9,true,'#d6e5cf');
   text(payment.slipNo,42,164,330,13,true);text('Recorded payment',385,164,168,10,true,'#227346');
   doc.moveTo(42,193).lineTo(553,193).strokeColor('#d9e4de').stroke();
   text('EMPLOYEE',42,212,230,9,true,'#6e8178');text(person.name,42,231,235,16,true);text('Mobile: '+person.phone,42,258,240);text('Joining date: '+person.joiningDate,42,280,240);
   text('SALARY PERIOD',320,212,230,9,true,'#6e8178');text(p.periodStart&&p.periodEnd?p.periodStart+' to '+p.periodEnd:payment.month,320,232,230,11,true);text('Payment date: '+payment.date,320,258,230);text('Method: '+payment.method,320,280,230);
   doc.roundedRect(42,316,511,64,9).fill('#edf4ed');text('PAYMENT AMOUNT',58,331,230,9,true,'#61756a');text(money(payment.amountPaise),58,350,330,19,true,'#22664f');
   let y=404;const row=(label,value,bold=false)=>{text(label,54,y,310,10,bold);text(value,364,y,177,10,bold,'#18372e');doc.moveTo(54,y+24).lineTo(541,y+24).strokeColor('#e4eae6').stroke();y+=33;};
   row('Gross earned ('+p.accruedDays+' elapsed working days)',money(p.grossPaise));row('Absence deduction ('+p.absentShifts+' absent shifts)',money(p.absenceDeductionPaise));row('Allowance',money(p.settings.allowancePaise));row('Other deduction',money(p.settings.deductionPaise));row('Net earned for salary cycle',money(p.netPaise),true);row('Total paid after this payment',money(snap.paidAfterPaise));row('Salary balance after this payment',money(snap.balanceAfterPaise),true);
   if(payment.note)text('Payment reference: '+payment.note,54,y+10,487,9,false,'#61756a');
   text('Employee acknowledgement',54,741,240,9,true);text('Authorized Signature',330,741,210,9,true);doc.moveTo(54,731).lineTo(248,731).strokeColor('#9bad9f').stroke();doc.moveTo(330,731).lineTo(535,731).stroke();
   text('This slip records a salary payment. Figures reflect the saved payment-time snapshot.',42,783,511,8,false,'#72857a');doc.end();
  }catch(e){reject(e);doc.destroy();}
 });
};
