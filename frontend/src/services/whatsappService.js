export const sendReceiptWhatsApp = (payment) => {

  if (!payment) return;

  const phone =
    payment.customer?.phone?.replace(/\D/g, "");

  if (!phone) {

    alert("Customer phone number not found.");

    return;

  }

  const receiptNo =
    payment.receiptNo ||
    payment._id?.slice(-6).toUpperCase();

  const message = `🧾 *OM TIFFIN SERVICE*

✅ Payment Received Successfully

👤 Customer : ${payment.customer?.customerName}

📄 Receipt No : ${receiptNo}

💰 Amount : ₹${payment.amount}

💳 Payment Method : ${payment.paymentMethod}

📅 Date : ${new Date(
    payment.paymentDate
  ).toLocaleDateString("en-GB")}

🙏 Thank you for choosing OM TIFFIN SERVICE.`;

  window.open(

    `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`,

    "_blank"

  );

};
export const sendInvoiceWhatsApp = (bill) => {

  if (!bill) return;

  const phone =
    bill.customer?.phone?.replace(/\D/g, "");

  if (!phone) {

    alert("Customer phone number not found.");

    return;

  }

  const message = `🍱 *OM TIFFIN SERVICE*

📄 Monthly Invoice

👤 Customer : ${bill.customer?.customerName}

🧾 Invoice No : ${bill.invoiceNo}

💰 Total Amount : ₹${bill.totalAmount}

📅 Billing Month : ${bill.month}

🙏 Thank you for choosing OM TIFFIN SERVICE.

Please complete your payment.

Regards,
OM TIFFIN SERVICE`;

  window.open(

    `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`,

    "_blank"

  );

};