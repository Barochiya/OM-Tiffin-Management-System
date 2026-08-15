const PDFDocument = require("pdfkit");

const generateBillPdf = (bill, customer) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const buffers = [];

      doc.on("data", (buffer) => {
        buffers.push(buffer);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      doc.fontSize(22).text(
        "OM TIFFIN SERVICE",
        {
          align: "center",
        }
      );

      doc.moveDown();

      doc.fontSize(14).text(
        `Invoice No: ${bill.invoiceNo}`
      );

      doc.text(
        `Customer: ${customer.customerName}`
      );

      doc.text(
        `Phone: ${customer.phone}`
      );

      doc.text(
        `Month: ${bill.month}/${bill.year}`
      );

      doc.text(
        `Status: ${bill.status}`
      );

      doc.moveDown();

      doc.fontSize(16).text(
        "Meal Details"
      );

      doc.moveDown();

      bill.dailyDetails.forEach((day) => {
        const date = new Date(
          day.date
        ).toLocaleDateString("en-IN");

        doc.fontSize(11).text(
          `${date}
Breakfast: ${day.breakfastQty}
Lunch: ${day.lunchQty}
Dinner: ${day.dinnerQty}
Extra: ₹${day.extraAmount}
Total: ₹${day.dailyTotal}`
        );

        doc.moveDown();
      });

      doc.moveDown();

      doc.fontSize(14).text(
        `Total Amount: ₹${bill.totalAmount}`
      );

      doc.text(
        `Paid Amount: ₹${bill.paidAmount}`
      );

      doc.text(
        `Pending Amount: ₹${bill.pendingAmount}`
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateBillPdf;