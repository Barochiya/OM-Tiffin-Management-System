const PDFDocument = require("pdfkit");

const generateBillPdf = (bill, customer) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const buffers = [];

      doc.on("data", (chunk) => {
        buffers.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      // Header

      doc.fontSize(24).text(
        "OM TIFFIN SERVICE",
        {
          align: "center",
        }
      );

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .text(
          "Fresh Food • On-Time Delivery • Trusted Service",
          {
            align: "center",
          }
        );

      doc.moveDown();

      // Invoice Information

      doc.fontSize(16).text("Invoice Details");

      doc.moveDown(0.5);

      doc.fontSize(11);

      doc.text(
        `Invoice No: ${bill.invoiceNo || "-"}`
      );

      doc.text(
        `Customer: ${
          customer.customerName || "-"
        }`
      );

      doc.text(
        `Phone: ${customer.phone || "-"}`
      );

      doc.text(
        `Billing Period: ${bill.month}/${bill.year}`
      );

      doc.text(
        `Status: ${bill.status || "-"}`
      );

      doc.moveDown();

      // Table Header

      doc.fontSize(16).text("Meal Details");

      doc.moveDown(0.5);

      doc.fontSize(10);

      doc.text(
        "Date | B | L | D | Extra | Total"
      );

      doc.moveDown(0.3);

      // Daily Entries

      bill.dailyDetails.forEach((day) => {
        const date = new Date(
          day.date
        ).toLocaleDateString("en-IN");

        doc.text(
          `${date} | ${day.breakfastQty} | ${day.lunchQty} | ${day.dinnerQty} | Rs.${day.extraAmount} | Rs.${day.dailyTotal}`
        );
      });

      doc.moveDown();

      // Summary

      doc.fontSize(16).text(
        "Payment Summary"
      );

      doc.moveDown(0.5);

      doc.fontSize(12);

      doc.text(
        `Total Amount: Rs.${bill.totalAmount}`
      );

      doc.text(
        `Paid Amount: Rs.${bill.paidAmount}`
      );

      doc.text(
        `Pending Amount: Rs.${bill.pendingAmount}`
      );

      doc.moveDown(2);

      doc
        .fontSize(10)
        .text(
          "Thank you for choosing OM TIFFIN SERVICE",
          {
            align: "center",
          }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateBillPdf;