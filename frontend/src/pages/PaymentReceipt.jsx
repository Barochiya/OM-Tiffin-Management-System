import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import QRCode from "react-qr-code";

import {
  FaPrint,
  FaFilePdf,
  FaCheckCircle,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaReceipt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaWhatsapp,
} from "react-icons/fa";

import html2pdf from "html2pdf.js";



import logo from "../assets/logo.png";

import {
  getPaymentById,
  sendPaymentReceiptWhatsApp,
} from "../services/paymentService";

export default function PaymentReceipt() {

  const { id } = useParams();

  const receiptRef = useRef();

  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);

  const [sendingWhatsApp, setSendingWhatsApp] =
  useState(false);

  const autoSendStarted = useRef(false);

  useEffect(() => {

    loadPayment();

  }, []);

  const loadPayment = async () => {

    try {

      setLoading(true);

      const res = await getPaymentById(id);

      setPayment(res);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  };

    // =======================================
  // Automatically Send Receipt PDF
  // =======================================

 useEffect(() => {
  if (
    !payment ||
    !receiptRef.current ||
    autoSendStarted.current
  ) {
    return;
  }

  const sendAutomatically = async () => {
    try {
      autoSendStarted.current = true;

      setSendingWhatsApp(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

      const pdfBlob =
        await createReceiptPdf();

      await sendPaymentReceiptWhatsApp(
        payment._id,
        pdfBlob
      );

      console.log(
        "Receipt PDF sent automatically."
      );
    } catch (error) {
      console.error(error);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  sendAutomatically();
}, [payment]);

  if (loading) {

    return (

      <div className="min-h-screen bg-slate-100 flex items-center justify-center">

        <div className="bg-white rounded-2xl shadow-xl px-12 py-10">

          <h2 className="text-2xl font-bold text-slate-700">

            Loading Receipt...

          </h2>

        </div>

      </div>

    );

  }

  if (!payment) {

    return (

      <div className="min-h-screen bg-slate-100 flex items-center justify-center">

        <div className="bg-white rounded-2xl shadow-xl px-12 py-10">

          <h2 className="text-2xl font-bold text-red-600">

            Receipt Not Found

          </h2>

        </div>

      </div>

    );

  }

  const receiptNo = payment._id
  .toString()
  .slice(-6)
  .toUpperCase();

  const paymentDate = new Date(payment.paymentDate);

  const paymentMethod =

  

    payment.paymentMethod === "Cash"

      ? "💵 Cash"

      : payment.paymentMethod === "UPI"

      ? "📱 UPI"

      : payment.paymentMethod === "Card"

      ? "💳 Card"

      : "🌐 Razorpay";

      // =======================================
// Generate Payment Receipt PDF
// =======================================

const getReceiptPdfOptions = () => ({
  margin: 6,

  filename: `OM-Tiffin-Payment-Receipt-${
    receiptNo || payment?._id || "Receipt"
  }.pdf`,

  image: {
    type: "jpeg",
    quality: 0.96,
  },

  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
  },

  jsPDF: {
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  },

  pagebreak: {
    mode: ["css", "legacy"],
  },

  ignoreElements: (element) =>
    element.classList?.contains("no-pdf"),
});

const createReceiptPdf = async () => {
  if (!payment || !receiptRef.current) {
    throw new Error(
      "Payment receipt is not ready."
    );
  }

  return html2pdf()
    .set(getReceiptPdfOptions())
    .from(receiptRef.current)
    .toPdf()
    .outputPdf("blob");
};

// =======================================
// Send Payment Receipt PDF on WhatsApp
// =======================================

const handleSendReceiptWhatsApp = async () => {
  if (!payment?._id) {
    alert("Payment receipt is not ready.");
    return;
  }

  try {
    setSendingWhatsApp(true);

    const pdfBlob = await createReceiptPdf();

    const result =
      await sendPaymentReceiptWhatsApp(
        payment._id,
        pdfBlob
      );

    alert(
      result?.message ||
        "Payment receipt PDF sent successfully on WhatsApp."
    );
  } catch (error) {
    console.error(
      "Payment Receipt WhatsApp Error:",
      error
    );

    alert(
      error.response?.data?.message ||
        error.message ||
        "Failed to send payment receipt on WhatsApp."
    );
  } finally {
    setSendingWhatsApp(false);
  }
};
       return (
  <div className="w-full min-h-screen bg-slate-100 print:bg-white">

    <div className="w-full px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8 print:p-0">

      <div
  ref={receiptRef}
  className="receipt relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl mx-auto overflow-hidden print:shadow-none print:rounded-none print:max-w-none print:w-full"
>

          

            {/* Top Ribbon */}

            <div className="h-3 bg-gradient-to-r from-blue-700 via-green-600 to-blue-700"></div>

            {/* Watermark */}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

              <h1 className="text-[180px] font-extrabold text-green-600 opacity-[0.03] rotate-[-30deg] select-none">

                PAID

              </h1>

            </div>

            {/* Header */}

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8 p-5 sm:p-8 lg:p-10 border-b">

              {/* Company */}

              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">

                <img

                  src={logo}

                  alt="Logo"

                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-blue-100 shrink-0"

                />

                <div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-700">

                    OM TIFFIN

                  </h1>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-700">

                    SERVICE

                  </h2>

                  <p className="text-gray-500 mt-3">

                    Gandhinagar, Gujarat

                  </p>

                  <p className="text-gray-500">

                    📞 +91 7016297983

                  </p>

                  <p className="text-gray-500">

                    ✉ support@omtiffin.in

                  </p>

                </div>

              </div>

              {/* Receipt */}

              <div className="text-center lg:text-right">

                <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-5 py-2 rounded-full font-bold">

                  <FaCheckCircle />

                  PAYMENT RECEIVED

                </span>

                <h1 className="text-4xl font-extrabold text-slate-800 mt-5">

                  PAYMENT RECEIPT

                </h1>

                <p className="text-gray-500 mt-3">

                  Receipt Date

                </p>

                <h3 className="font-bold text-lg">

                  {paymentDate.toLocaleDateString("en-GB")}

                </h3>

              </div>

            </div>

            {/* Summary Cards */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 px-5 sm:px-8 lg:px-10 py-6 sm:py-8">

              <div className="bg-blue-50 rounded-2xl p-5">

                <FaReceipt className="text-3xl text-blue-700 mb-3" />

                <p className="text-gray-500">

                  Receipt No.

                </p>

                <h3 className="text-xl font-bold">

                  {receiptNo}

                </h3>

              </div>

              <div className="bg-green-50 rounded-2xl p-5">

                <FaMoneyBillWave className="text-3xl text-green-700 mb-3" />

                <p className="text-gray-500">

                  Amount

                </p>

                <h3 className="text-3xl font-bold text-green-700">

                  ₹{payment.amount}

                </h3>

              </div>

              <div className="bg-purple-50 rounded-2xl p-5">

                <FaCalendarAlt className="text-3xl text-purple-700 mb-3" />

                <p className="text-gray-500">

                  Payment Date

                </p>

                <h3 className="font-bold">

                  {paymentDate.toLocaleDateString("en-GB")}

                </h3>

              </div>

              <div className="bg-orange-50 rounded-2xl p-5">

                <FaCheckCircle className="text-3xl text-orange-600 mb-3" />

                <p className="text-gray-500">

                  Status

                </p>

                <span className="inline-block bg-green-600 text-white px-4 py-1 rounded-full">
  {payment.bill?.status}
</span>

              </div>

            </div>
                        {/* Customer & Payment Details */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 px-5 sm:px-8 lg:px-10 pb-8 sm:pb-10">

              {/* Customer Card */}

              <div className="bg-slate-50 rounded-2xl border p-5 sm:p-8">

                <div className="flex items-center gap-3 mb-6">

                  <FaUser className="text-2xl text-blue-600" />

                  <h2 className="text-2xl font-bold">

                    Customer Details

                  </h2>

                </div>

                <div className="space-y-4">

                  <div>

                    <p className="text-gray-500 text-sm">

                      Customer Name

                    </p>

                    <h3 className="text-xl font-semibold">

                      {payment.customer?.customerName}

                    </h3>

                  </div>

                  <div className="flex items-center gap-3">

                    <FaPhone className="text-green-600" />

                    <span>

                      {payment.customer?.phone}

                    </span>

                  </div>

                  <div className="flex items-start gap-3">

                    <FaMapMarkerAlt className="text-red-500 mt-1" />

                    <span>

                      {payment.customer?.address}

                    </span>

                  </div>

                </div>

              </div>

              {/* Payment Card */}

              <div className="bg-slate-50 rounded-2xl border p-5 sm:p-8">

                <div className="flex items-center gap-3 mb-6">

                  <FaMoneyBillWave className="text-2xl text-green-600" />

                  <h2 className="text-2xl font-bold">

                    Payment Details

                  </h2>

                </div>

                <div className="space-y-4">

                  <div className="flex justify-between">

                    <span className="text-gray-500">

                      Invoice No

                    </span>

                    <span className="font-semibold">

                      {payment.bill?.invoiceNo}

                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-500">

                      Payment Method

                    </span>

                    <span className="font-semibold">

                      {paymentMethod}

                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-500">

                      Payment Time

                    </span>

                    <span className="font-semibold">

                      {paymentDate.toLocaleTimeString("en-IN")}

                    </span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-500">

                      Status

                    </span>

                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
  {payment.bill?.status}
</span>

                  </div>

                  <div className="pt-6 flex justify-center">

                    <QRCode

                      value={JSON.stringify({

                        receipt: receiptNo,

                        invoice: payment.bill?.invoiceNo,

                        customer: payment.customer?.customerName,

                        amount: payment.amount,

                        status: payment.bill?.status,

                      })}

                      size={130}

                    />

                  </div>

                  <p className="text-center text-gray-500 text-sm">

                    Scan to verify receipt

                  </p>

                </div>

              </div>

            </div>
                        {/* Footer */}

            <div className="border-t px-10 py-8">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left */}

                <div>

                  <h3 className="text-xl font-bold text-blue-700">

                    Thank You ❤️

                  </h3>

                  <p className="text-gray-600 mt-3 leading-7">

                    Thank you for choosing OM TIFFIN SERVICE.

                    This receipt confirms that we have successfully

                    received your payment.

                  </p>

                  <div className="mt-6 text-sm text-gray-500 space-y-2">

                    <p>

                      ✓ This is a computer-generated receipt.

                    </p>

                    <p>

                      ✓ No signature is required for validity.

                    </p>

                    <p>

                      ✓ Please keep this receipt for your records.

                    </p>

                  </div>

                </div>

                {/* Right */}

                <div className="flex flex-col items-center justify-end">

                  <img

                    src={logo}

                    alt="Company"

                    className="w-16 h-16 mb-3 opacity-90"

                  />

                  <div className="w-48 border-b-2 border-gray-400"></div>

                  <p className="mt-3 font-semibold">

                    Authorized Signature

                  </p>

                  <span className="text-sm text-gray-500">

                    OM TIFFIN SERVICE

                  </span>

                </div>

              </div>

            </div>

            {/* Action Buttons */}

            <div className="no-pdf flex flex-wrap justify-center gap-4 px-10 pb-10 print:hidden">

            <button
  onClick={() => window.print()}
  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition"
>
  <FaPrint />
  Print Receipt
</button>

<button
  onClick={async () => {
    try {
      await html2pdf()
        .set(getReceiptPdfOptions())
        .from(receiptRef.current)
        .save();
    } catch (error) {
      console.error(
        "Receipt PDF Error:",
        error
      );

      alert("Failed to create receipt PDF.");
    }
  }}
  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl transition"
>
  <FaFilePdf />
  Save as PDF
</button>

              <button
  onClick={handleSendReceiptWhatsApp}
  disabled={sendingWhatsApp}
  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl transition"
>
  <FaWhatsapp />

  {sendingWhatsApp
    ? "Sending Receipt..."
    : "Send Receipt PDF"}
</button>

            </div>

          </div>

        </div>

      </div>


  );

}