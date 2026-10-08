const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const logoPath = path.join(__dirname, "../../frontend/src/assets/logo.png");
const fontPath = path.join(__dirname, "../assets/fonts");
const receiptFont = (text, bold = false) => /[\u0A80-\u0AFF]/.test(String(text ?? "")) ? path.join(fontPath, `NotoSansGujarati-${bold ? "Bold" : "Regular"}.ttf`) : bold ? "Helvetica-Bold" : "Helvetica";
const safe = (value) => String(value ?? "-");
const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

// A single server-rendered A4 layout is used by every device and delivery action.
module.exports = async function generateReceiptPdf(payment) {
  const receiptNo = payment.receiptNo || String(payment._id).slice(-6).toUpperCase();
  const customer = payment.customer || {};
  const bill = payment.bill || {};
  const paymentDate = new Date(payment.paymentDate);
  const dateText = Number.isNaN(paymentDate.getTime()) ? "-" : paymentDate.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
  const timeText = Number.isNaN(paymentDate.getTime()) ? "-" : paymentDate.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });
  const qr = await QRCode.toBuffer(JSON.stringify({ receipt: receiptNo, invoice: bill.invoiceNo, customer: customer.customerName, amount: payment.amount, status: bill.status }), { width: 240, margin: 1 });
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 36, info: { Title: `OM Tiffin Payment Receipt ${receiptNo}`, Author: "OM Tiffin Service" } });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      const width = doc.page.width - 72;
      const label = (text, x, y, w = width, options = {}) => doc.font(receiptFont(text)).fontSize(9).fillColor("#64748b").text(safe(text), x, y, { width: w, ...options });
      const value = (text, x, y, w = width, options = {}) => doc.font(receiptFont(text, true)).fontSize(11).fillColor("#0f172a").text(safe(text), x, y, { width: w, ...options });
      doc.rect(36, 36, width, 5).fill("#1d4ed8");
      if (fs.existsSync(logoPath)) doc.image(logoPath, 36, 59, { fit: [62, 62] });
      doc.font("Helvetica-Bold").fontSize(20).fillColor("#1d4ed8").text("OM TIFFIN SERVICE", 110, 60, { width: width - 74 });
      label("Gandhinagar, Gujarat", 110, 88);
      label("+91 7016297983  |  support@omtiffin.in", 110, 103);
      doc.font("Helvetica-Bold").fontSize(21).fillColor("#0f172a").text("PAYMENT RECEIPT", 36, 147);
      label("PAYMENT RECEIVED", 36, 179);
      label(`Receipt date: ${dateText}`, 340, 179, width - 304, { align: "right" });
      const gap = 10, cardWidth = (width - gap * 3) / 4;
      const summaries = [["Receipt No.",receiptNo,"#eff6ff"],["Amount",money(payment.amount),"#f0fdf4"],["Payment Date",dateText,"#faf5ff"],["Bill Status",bill.status,"#fff7ed"]];
      summaries.forEach(([title,text,color],index)=>{
        const x=36+index*(cardWidth+gap);
        doc.roundedRect(x,207,cardWidth,72,8).fill(color);
        label(title,x+12,221,cardWidth-24);
        value(text,x+12,244,cardWidth-24,{height:30,ellipsis:true});
      });
      const half=(width-20)/2;
      doc.roundedRect(36,300,half,270,10).fillAndStroke("#f8fafc","#e2e8f0");
      doc.roundedRect(56+half,300,half,270,10).fillAndStroke("#f8fafc","#e2e8f0");
      value("Customer Details",52,320,half-32);
      label("Customer Name",52,352,half-32);
      value(customer.customerName,52,370,half-32,{height:44,ellipsis:true});
      label("Phone",52,422,half-32);
      value(customer.phone,52,439,half-32);
      label("Delivery Address",52,471,half-32);
      doc.font(receiptFont(customer.address)).fontSize(10).fillColor("#334155").text(safe(customer.address),52,489,{width:half-32,height:66,ellipsis:true});
      const x=72+half;
      value("Payment Details",x,320,half-32);
      for(const [index,[title,text]] of [["Invoice No.",bill.invoiceNo],["Payment Method",payment.paymentMethod],["Payment Time",timeText],["Bill Status",bill.status]].entries()){
        const y=353+index*33;label(title,x,y,88);value(text,x+91,y,half-123,{height:25,ellipsis:true});
      }
      doc.image(qr,x+(half-32-68)/2,487,{width:68,height:68});
      label("Scan to verify receipt",x,559,half-32,{align:"center"});
      doc.moveTo(36,596).lineTo(36+width,596).strokeColor("#e2e8f0").stroke();
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#1d4ed8").text("Thank You",36,616);
      doc.font("Helvetica").fontSize(10).fillColor("#475569").text("Thank you for choosing OM TIFFIN SERVICE.\nThis receipt confirms that we have successfully\nreceived your payment.",36,642,{width:half+20,lineGap:4});
      label("This is a computer-generated receipt.\nNo signature is required for validity.\nPlease keep this receipt for your records.",36,705,half+30,{lineGap:4});
      if(fs.existsSync(logoPath)) doc.image(logoPath,420,623,{fit:[54,54]});
      doc.moveTo(366,696).lineTo(555,696).strokeColor("#94a3b8").stroke();
      value("Authorized Signature",366,709,189,{align:"center"});
      label("OM TIFFIN SERVICE",366,729,189,{align:"center"});
      doc.end();
    } catch(error) { doc.destroy(); reject(error); }
  });
};
