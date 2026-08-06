import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import logo from "../assets/logo.png";

import { getPaymentById } from "../services/paymentService";

export default function PaymentReceipt() {
  const { id } = useParams();

  const [payment, setPayment] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    loadPayment();
  }, []);

  const loadPayment = async () => {
    try {
      const res = await getPaymentById(id);
      setPayment(res);
    } catch (error) {
      console.log(error);
    }
  };



  if (!payment) {
    return <h2 className="text-center mt-20">Loading...</h2>;
  }

  return (
    <div className="flex print:block">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 w-full min-h-screen bg-slate-100 print:ml-0 print:bg-white">

        {/* Navbar */}
        <Navbar />

        <div className="p-8">

  <div
  ref={receiptRef}
  className="receipt relative bg-white shadow-xl rounded-xl p-8 mt-6 w-full max-w-4xl mx-auto print:shadow-none"
>
    {/* Watermark */}
   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

  <h1 className="text-[160px] font-extrabold text-green-600 opacity-[0.03] rotate-[-30deg] select-none">
  PAID
</h1>

</div>
   
    {/* Header */}
            <div className="flex justify-between items-start border-b pb-6">

              <div className="flex items-center gap-6">

                <img
                    src={logo}
                    alt="Logo"
                    className="w-24 h-24 rounded-full"
                />

                <div>
                  <h2 className="text-3xl font-extrabold text-blue-700 tracking-wide">
                    OM TIFFIN SERVICE
                  </h2>

                  <p className="text-gray-500">
                    Gandhinagar, Gujarat
                  </p>

                  <p className="text-gray-500">
                    +91 7016297983
                  </p>
                </div>

              </div>

              <div className="text-right">

                <h1 className="text-3xl font-extrabold text-green-700 tracking-wide">
                  PAYMENT RECEIPT
                </h1>

                    <p className="text-sm text-gray-600 mt-1">
                            Receipt Date : {new Date(payment.paymentDate).toLocaleDateString("en-GB")}
                    </p>

              </div>

            </div>

            {/* Customer & Payment */}
            <div className="grid grid-cols-2 gap-12 mt-10 items-start">

              <div>

                <h3 className="font-bold text-lg mb-3">
                  Customer Details
                </h3>

                <p><b>Name :</b> {payment.customer?.customerName}</p>
                <p><b>Phone :</b> {payment.customer?.phone}</p>
                <p><b>Address :</b> {payment.customer?.address}</p>

              </div>

              <div>

                <h3 className="font-bold text-lg mb-3">
                  Payment Details
                </h3>

                

                <div className="space-y-2">
  <p>
    <b>Invoice No :</b> {payment.bill?.invoiceNo}
  </p>

  <div className="bg-blue-50 border border-blue-300 rounded-lg px-4 py-3 mt-2">

  <p className="text-sm text-gray-600">
    Receipt Number
  </p>

  <h2 className="text-xl font-bold text-blue-700 tracking-wider">
    {payment.receiptNo || payment._id.slice(-6).toUpperCase()}
  </h2>

</div>

<p>
  <b>Payment Date :</b>{" "}
  {new Date(payment.paymentDate).toLocaleDateString("en-GB")}
</p>

<p>
  <b>Payment Time :</b>{" "}
  {new Date(payment.paymentDate).toLocaleTimeString("en-IN")}
</p>

 <p>
  <b>Payment Method :</b>{" "}
  {payment.paymentMethod === "Cash"
    ? "💵 Cash"
    : payment.paymentMethod === "UPI"
    ? "📱 UPI"
    : payment.paymentMethod === "Card"
    ? "💳 Card"
    : "🌐 Razorpay"}
</p>

  <div className="flex items-center gap-3">

  <b>Status :</b>

  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
    {payment.status}
  </span>

  <span className="border-2 border-green-600 text-green-600 font-bold px-4 py-1 rounded rotate-[-10deg]">
    PAID
  </span>

</div>
</div>
              </div>

            </div>

            {/* Amount */}
            <div className="bg-green-50 border-2 border-green-200 mt-10 rounded-xl p-10 text-center">

              <h3 className="text-xl font-semibold">
                Amount Received
              </h3>

              <h1 className="text-6xl font-bold text-green-700 mt-3">
                ₹{payment.amount}
              </h1>

            </div>

           {/* Footer */}
<div className="mt-10 border-t pt-8">

  <div className="flex justify-between items-end min-h-[220px]">

    {/* Left Side */}
    <div className="text-gray-600 self-end">

      <p>Thank You for choosing</p>

      <h3 className="text-xl font-bold text-blue-700 mt-2">
        OM TIFFIN SERVICE
      </h3>

      <p className="text-sm mt-2">
        This is a computer generated receipt.
      </p>

    </div>

   {/* Right Side */}
<div className="flex flex-col items-center justify-end h-full">

  <QRCode
    value={JSON.stringify({
      invoice: payment.bill?.invoiceNo,
      receipt: payment.receiptNo || payment._id,
      customer: payment.customer?.customerName,
      amount: payment.amount,
      method: payment.paymentMethod,
      date: new Date(payment.paymentDate).toLocaleDateString("en-GB"),
    })}
    size={75}
  />

  <img
    src={logo}
    alt="Company Stamp"
    className="w-12 h-12 mt-4 opacity-80"
  />

  <div className="w-36 border-b border-gray-400 mt-3 mx-auto"></div>

  <p className="mt-2 font-semibold">
    Authorized Signature
  </p>

</div>

  </div>

</div>

            {/* Print Button */}
           
        <div className="flex justify-center gap-5 mt-10 print:hidden">

        <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
        >
            🖨 Print Receipt
        </button>

       <button
  onClick={() => window.print()}
  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg"
>
  📄 Save as PDF
</button>

</div>

          </div>

        </div>

      </div>

    </div>
  );
}