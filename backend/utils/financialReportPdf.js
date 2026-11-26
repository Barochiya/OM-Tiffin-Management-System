const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const money = value => 'Rs. ' + Number(value || 0).toLocaleString('en-IN', {minimumFractionDigits:2,maximumFractionDigits:2});
const paise = value => Math.round(Number(value || 0) * 100);
const date = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB',{timeZone:'Asia/Kolkata'}); };
module.exports = (report, brand = {}) => new Promise((resolve,reject) => {
  const doc = new PDFDocument({size:'A4',margin:40,bufferPages:true,info:{Title:'OM Tiffin Financial Report',Author:brand.businessName || 'OM TIFFIN SERVICE'}}), chunks=[];
  doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
  try {
    const L=40,W=515,BOTTOM=779,blue='#17375e',muted='#64748b',border='#dce5f1';
    const logo=path.join(__dirname,'../../frontend/src/assets/logo.png');
    const gujaratiRange=String.fromCharCode(0xA80)+'-'+String.fromCharCode(0xAFF);
    const isGujarati=new RegExp('['+gujaratiRange+']','u');
    const splitGujarati=new RegExp('(['+gujaratiRange+']+)','u');
    const font=(value,bold=false)=>isGujarati.test(String(value)) ? path.join(__dirname,'../assets/fonts/NotoSansGujarati-'+(bold?'Bold':'Regular')+'.ttf') : bold?'Helvetica-Bold':'Helvetica';
    const text=(value,x,y,w,size=9,bold=false,color='#172b49',align='left')=>{
      value=String(value??'-');const parts=value.split(splitGujarati).filter(Boolean);
      doc.fontSize(size).fillColor(color);
      parts.forEach((part,index)=>{
        doc.font(font(part,bold));const options={width:w,align,lineGap:2,continued:index<parts.length-1};
        if(index===0)doc.text(part,x,y,options);else doc.text(part,options);
      });
    };
    const height=(value,w,size=9,bold=false)=>{
      value=String(value??'-');const base=doc.font(bold?'Helvetica-Bold':'Helvetica').fontSize(size).heightOfString(value,{width:w,lineGap:2});
      return isGujarati.test(value)?Math.max(base,doc.font(font(value,bold)).fontSize(size).heightOfString(value,{width:w,lineGap:2}))+12:base;
    };
    const header=()=>{
      doc.rect(0,0,595,7).fill(blue);
      if(fs.existsSync(logo))doc.image(logo,L,25,{fit:[44,44]});
      text(brand.businessName || 'OM TIFFIN SERVICE',96,28,330,17,true,blue);
      text('FINANCIAL REPORT',96,51,300,10,true,muted);
      text(report.period || 'All time',L,84,360,11,true);
      text('Generated '+date(report.generatedAt || new Date()),385,84,170,8,false,muted,'right');
      doc.moveTo(L,106).lineTo(L+W,106).strokeColor(border).stroke();
      return 122;
    };
    let y=header();
    const total=(rows,key)=>rows.reduce((sum,row)=>sum+paise(row[key]),0)/100;
    const revenues=report.revenue || [],collections=report.collections || [],wallets=report.wallets || [],dues=report.outstanding || [];
    const summary=[['Gross invoice revenue',total(revenues,'grossAmount')],['Approved collections',total(collections,'amount')],['Wallet closing balance',wallets.reduce((sum,row)=>sum+Number(row.closingPaise || 0),0)/100],['Current invoice outstanding',total(dues,'outstanding')]];
    const walletClosing=summary[2][1];
    if(report.expenseSummary){summary.push(['Recorded business expenses',Number(report.expenseSummary.expensePaise || 0)/100],['Net after recorded expenses',Number(report.expenseSummary.netEarningsPaise || 0)/100]);}
    summary.forEach(([label,value],i)=>{const x=L+(i%2)*265,top=y+Math.floor(i/2)*79;doc.roundedRect(x,top,250,66,7).fillAndStroke('#f3f7fd',border);text(label,x+13,top+13,224,9,false,muted);text(money(value),x+13,top+32,224,16,true,i===3?'#c52222':blue);});
    y+=Math.ceil(summary.length/2)*79+16;
    text('Reporting basis',L,y,W,11,true,blue);y+=22;
    for(const note of [report.basis==='bill-period'?'Revenue follows the original invoice billing month/cycle; generation timestamps are unchanged.':'Revenue uses the actual invoice generation date; carried balances are excluded.',report.basis==='bill-period'?'Receipts follow the linked bill period, including later receipts. Wallet top-ups and excess credit are excluded.':'Collections use approved payment receipt dates. Wallet funding and excess credits are not revenue.','Wallet figures reconcile the selected period. Outstanding invoices show the current amount due.','This is a read-only system statement. Generating it does not change customer or financial records.','Net earnings use recorded business expenses only. Include all costs for a complete result.']){const h=height(note,W,9);text(note,L,y,W,9,false,muted);y+=h+9;}
    const customer=id=>{const entry=report.customers?.[id];return entry ? entry.name+(entry.code?' / '+entry.code:'') : String(id || '-');};
    const table=(title,description,columns,rows,footnote)=>{
      doc.addPage();y=header();
      const tableHeader=()=>{text(title,L,y,W,15,true,blue);y+=25;const h=height(description,W,8);text(description,L,y,W,8,false,muted);y+=h+13;doc.rect(L,y,W,27).fill(blue);let x=L;for(const column of columns){text(column.title,x+7,y+9,column.width-14,8,true,'#ffffff',column.align || 'left');x+=column.width;}y+=27;};
      tableHeader();
      if(!rows.length){text('No records for this selection.',L+8,y+16,W-16,10,false,muted);y+=46;}
      rows.forEach((row,index)=>{
        const values=columns.map(column=>String(column.get(row)??'-'));
        const rowHeight=Math.max(27,...values.map((value,i)=>height(value,columns[i].width-14,8)+14));
        if(y+rowHeight>BOTTOM-32){doc.addPage();y=header();tableHeader();}
        doc.rect(L,y,W,rowHeight).fill(index%2?'#f5f8fc':'#ffffff');let x=L;
        values.forEach((value,i)=>{text(value,x+7,y+7,columns[i].width-14,8,false,'#172b49',columns[i].align || 'left');x+=columns[i].width;});
        y+=rowHeight;doc.moveTo(L,y).lineTo(L+W,y).strokeColor(border).lineWidth(.4).stroke();
      });
      const fh=height(footnote,W-20,9,true)+20;if(y+fh>BOTTOM){doc.addPage();y=header();}
      doc.roundedRect(L,y+10,W,fh,5).fill('#eaf1fb');text(footnote,L+10,y+20,W-20,9,true,blue);
    };
    table('1. Revenue report',report.basis==='bill-period'?'Gross value by original bill month/cycle. Carried balances excluded; original invoice timestamps remain unchanged.':'Gross invoice/order value by actual generation date. Previous carried dues and wallet funding are excluded.',[
      {title:'Invoice / order',width:139,get:r=>r.invoice},{title:'Customer',width:192,get:r=>customer(r.customer)},{title:report.basis==='bill-period'?'Bill cycle':'Generated',width:80,get:r=>report.basis==='bill-period'?'Cycle '+r.cycle:date(r.generatedAt)},{title:'Gross value',width:104,align:'right',get:r=>money(r.grossAmount)},
    ],[...revenues].sort((a,b)=>String(a.generatedAt).localeCompare(String(b.generatedAt))),'Total gross invoice revenue: '+money(total(revenues,'grossAmount')));
    table('2. Collection report',report.basis==='bill-period'?'Receipts against selected bill month/cycle, regardless of received date. Actual receipt dates shown below. Carry may be included in linked bill receipts.':'Approved invoice payments, walk-in receipts and wallet funding by receipt date. Receipt amounts do not create additional invoice revenue.',[
      {title:'Received / type',width:112,get:r=>date(r.receivedAt)+' / '+String(r.kind || '').replaceAll('-',' ')},{title:'Customer',width:182,get:r=>customer(r.customer)},{title:report.basis==='bill-period'?'Invoice / reference':'Reference / ID',width:117,get:r=>report.basis==='bill-period'?r.invoice+' / '+(r.reference || r.id):r.reference || r.id},{title:'Received',width:104,align:'right',get:r=>money(r.amount)},
    ],[...collections].sort((a,b)=>String(a.receivedAt).localeCompare(String(b.receivedAt))),'Total approved collections: '+money(total(collections,'amount')));
    table('3. Wallet reconciliation','Opening balance + credits - debits = closing balance. Adjustments and reversals remain in the underlying wallet ledger.',[
      {title:'Customer',width:167,get:r=>customer(r.customer)},{title:'Opening',width:87,align:'right',get:r=>money(r.openingPaise/100)},{title:'Credits',width:87,align:'right',get:r=>money(r.creditsPaise/100)},{title:'Debits',width:87,align:'right',get:r=>money(r.debitsPaise/100)},{title:'Closing',width:87,align:'right',get:r=>money(r.closingPaise/100)},
    ],[...wallets].sort((a,b)=>customer(a.customer).localeCompare(customer(b.customer))),wallets.every(row=>row.reconciled)?'All wallet balances reconcile. Net closing: '+money(walletClosing):'Reconciliation exceptions require review. Net closing: '+money(walletClosing));
    table('4. Outstanding report','Current unpaid invoice balances, excluding superseded carried invoices and cancelled invoices. This section is a current snapshot.',[
      {title:'Invoice',width:153,get:r=>r.invoice},{title:'Customer',width:240,get:r=>customer(r.customer)},{title:'Outstanding',width:122,align:'right',get:r=>money(r.outstanding)},
    ],[...dues].sort((a,b)=>b.outstanding-a.outstanding),'Current total invoice outstanding: '+money(total(dues,'outstanding')));
    if(report.expenses)table('5. Business expenses','Saved, non-cancelled expense entries by expense date. Cancelled entries remain in the application audit history.',[
      {title:'Date',width:73,get:r=>date(r.date+'T00:00:00+05:30')},{title:'Category',width:90,get:r=>String(r.category || 'other').replaceAll('_',' ')},{title:'Description',width:181,get:r=>r.title},{title:'Method',width:69,get:r=>r.paymentMethod},{title:'Expense',width:102,align:'right',get:r=>money(r.amountPaise/100)},
    ],[...report.expenses].sort((a,b)=>String(a.date).localeCompare(String(b.date))),'Total recorded expenses: '+money(Number(report.expenseSummary?.expensePaise || 0)/100)+' | Net after recorded expenses: '+money(Number(report.expenseSummary?.netEarningsPaise || 0)/100));
    const range=doc.bufferedPageRange();
    for(let i=range.start;i<range.start+range.count;i++){doc.switchToPage(i);doc.page.margins.bottom=0;doc.moveTo(L,796).lineTo(L+W,796).strokeColor(border).stroke();text('OM TIFFIN SERVICE | Financial statement',L,805,360,7,false,muted);text('Page '+(i+1)+' of '+range.count,430,805,125,7,false,muted,'right');}
    doc.end();
  }catch(error){doc.destroy();reject(error);}
});
