const PDFDocument = require('pdfkit');
const path = require('node:path');
const { decode } = require('./signatureImage');

module.exports = function walkInReceiptPdf(payment, customer = {}, design = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 36 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const style = design.enabled === false ? {} : design;
    const accent = style.primary || '#152c52';
    const ink = style.text || '#0f172a';
    const format = paise => Number.isInteger(paise)
      ? 'Rs. ' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : 'Unavailable';
    const width = doc.page.width - 72;
    const font = style.font || 'Helvetica';
    const bold = { Helvetica: 'Helvetica-Bold', 'Times-Roman': 'Times-Bold', Courier: 'Courier-Bold' }[font];
    const size = style.fontSize || 10;
    const classic = style.layout === 'classic';
    doc.roundedRect(27, 26, width + 18, 102, 10).fill(classic ? '#edf2f7' : accent);
    const headerInk = classic ? ink : '#ffffff';
    const showLogo = style.showLogo !== false;
    const position = style.logoPosition || 'left';
    const logoX = position === 'right' ? doc.page.width - 83 : position === 'center' ? (doc.page.width - 46) / 2 : 38;
    if (showLogo) {
      doc.roundedRect(logoX, 36, 46, 46, 6).fill('#ffffff');
      doc.image(path.join(__dirname, '../../frontend/src/assets/logo.png'), logoX + 3, 39, { fit: [40, 40], align: 'center' });
    }
    const center = showLogo && position === 'center';
    const titleX = showLogo && position === 'left' ? 96 : 38;
    const titleWidth = showLogo && !center ? width - 60 : width - 4;
    doc.font(bold).fontSize(center ? 13 : 17).fillColor(headerInk).text(style.businessName || 'OM TIFFIN SERVICE', titleX, center ? 85 : 44, { width: titleWidth, height: 24, ellipsis: true, align: center ? 'center' : 'left' });
    doc.font(font).fontSize(10).text('WALK-IN PAYMENT RECEIPT', titleX, center ? 105 : 70, { width: titleWidth, align: center ? 'center' : 'left' });
    if (!center && style.tagline) doc.fontSize(8).text(style.tagline, titleX, 90, { width: titleWidth, height: 16, ellipsis: true });

    const date = new Date(payment.paymentDate);
    const details = [
      ['Receipt', payment.receiptNo],
      ['Customer', customer.customerName || 'Walk-in customer'],
      ['Payment date', Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })],
      ['Payment method', payment.paymentMethod],
      ...(payment.reference ? [['Reference', payment.reference]] : []),
    ];
    doc.y = 147;
    for (const [label, value] of details) {
      const y = doc.y;
      doc.font(bold).fontSize(size).fillColor(accent).text(label, 36, y, { width: 90 });
      doc.font(font).fillColor(ink).text(String(value || 'Unavailable'), 130, y, { width: width - 94 });
      doc.moveDown(0.35);
    }

    const rows = [
      ['This payment', Math.round(Number(payment.amount) * 100)],
      ['Order total', payment.orderTotalPaise],
      ['Paid to date', payment.paidAfterPaise],
      ['Balance due', payment.remainingPaise],
    ];
    let top = doc.y + 12;
    for (const [index, [label, paise]] of rows.entries()) {
      doc.roundedRect(36, top, width, 32, 5).fill(index === 3 ? accent : '#eef3f8');
      doc.font(bold).fontSize(size + 1).fillColor(index === 3 ? '#ffffff' : ink);
      doc.text(label, 48, top + 10, { width: width / 2 });
      doc.text(format(paise), 36 + width / 2, top + 10, { width: width / 2 - 12, align: 'right' });
      top += 37;
    }
    if (design.signatureImage) {
      doc.image(decode(design.signatureImage), 36 + width - 125, top + 10, { fit: [125, 42], align: 'center' });
      doc.font(font).fontSize(9).fillColor(ink).text('Authorized signature', 36 + width - 125, top + 55, { width: 125, align: 'center' });
      top += 69;
    }
    doc.font(font).fontSize(8).fillColor(ink).text(style.footer || 'Thank you for choosing OM Tiffin Service.', 36, top + 7, { width });
    doc.end();
  });
};
