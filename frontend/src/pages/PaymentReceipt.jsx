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
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import logo from "../assets/logo.png";

import { getPaymentById } from "../services/paymentService";

export default function PaymentReceipt() {

  const { id } = useParams();

  const receiptRef = useRef();

  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);

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

  const receiptNumber =

    payment.receiptNo ||

    payment._id.slice(-6).toUpperCase();

  const paymentDate = new Date(payment.paymentDate);

  const paymentMethod =

    payment.paymentMethod === "Cash"

      ? "💵 Cash"

      : payment.paymentMethod === "UPI"

      ? "📱 UPI"

      : payment.paymentMethod === "Card"

      ? "💳 Card"

      : "🌐 Razorpay";
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

            className="relative bg-white rounded-3xl shadow-2xl max-w-6xl mx-auto overflow-hidden print:shadow-none"

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

            <div className="relative z-10 flex justify-between items-center p-10 border-b">

              {/* Company */}

              <div className="flex items-center gap-6">

                <img

                  src={logo}

                  alt="Logo"

                  className="w-28 h-28 rounded-full border-4 border-blue-100"

                />

                <div>

                  <h1 className="text-5xl font-extrabold text-blue-700">

                    OM TIFFIN

                  </h1>

                  <h2 className="text-5xl font-extrabold text-blue-700">

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

              <div className="text-right">

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

            <div className="grid grid-cols-4 gap-6 px-10 py-8">

              <div className="bg-blue-50 rounded-2xl p-5">

                <FaReceipt className="text-3xl text-blue-700 mb-3" />

                <p className="text-gray-500">

                  Receipt No.

                </p>

                <h3 className="text-xl font-bold">

                  {receiptNumber}

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

                  {payment.status}

                </span>

              </div>

            </div>
                        {/* Customer & Payment Details */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-10 pb-10">

              {/* Customer Card */}

              <div className="bg-slate-50 rounded-2xl border p-8">

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

              <div className="bg-slate-50 rounded-2xl border p-8">

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

                      {payment.status}

                    </span>

                  </div>

                  <div className="pt-6 flex justify-center">

                    <QRCode

                      value={JSON.stringify({

                        receipt: receiptNumber,

                        invoice: payment.bill?.invoiceNo,

                        customer: payment.customer?.customerName,

                        amount: payment.amount,

                        status: payment.status,

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

            <div className="flex flex-wrap justify-center gap-4 px-10 pb-10 print:hidden">

              <button

                onClick={() => window.print()}

                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition"

              >

                <FaPrint />

                Print Receipt

              </button>

              <button

                onClick={() => window.print()}

                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl transition"

              >

                <FaFilePdf />

                Save as PDF

              </button>

              <button

                onClick={() => {

                  const text =

                    `Payment Receipt\n\n` +

                    `Receipt No: ${receiptNumber}\n` +

                    `Customer: ${payment.customer?.customerName}\n` +

                    `Amount: ₹${payment.amount}\n` +

                    `Status: ${payment.status}`;

                  window.open(

                    `https://wa.me/?text=${encodeURIComponent(text)}`,

                    "_blank"

                  );

                }}

                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl transition"

              >

                📲 Share on WhatsApp

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}