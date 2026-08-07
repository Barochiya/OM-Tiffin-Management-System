import { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import { useReactToPrint } from "react-to-print";
import { FaUsers, FaFileInvoice, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";

import logo from "../assets/logo.png";

import { getCustomersForEntry } from "../services/dailyEntryService";
import { generateBill } from "../services/billService";

export default function Billing() {

  // =====================================
  // STATES
  // =====================================

  const [customers, setCustomers] = useState([]);

  const [customer, setCustomer] = useState("");

  const [month, setMonth] = useState(
    new Date().getMonth() + 1
  );

  const [year, setYear] = useState(
    new Date().getFullYear()
  );

  const [cycle, setCycle] = useState("1");

  const [bill, setBill] = useState(null);

  const billRef = useRef(null);

  // =====================================
  // PRINT
  // =====================================

  const handlePrint = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Bill-${month}-${year}`,
  });

  // =====================================
  // LOAD CUSTOMERS
  // =====================================

  useEffect(() => {

    loadCustomers();

  }, []);

  const loadCustomers = async () => {

    try {

      const res = await getCustomersForEntry();

      setCustomers(res.data || []);

    } catch (error) {

      console.log(error);

    }

  };

  // =====================================
  // GENERATE BILL
  // =====================================

  const handleGenerate = async () => {

    if (!customer) {

      alert("Please Select Customer");

      return;

    }

    try {

      const res = await generateBill({

        customer,

        month,

        year,

        cycle,

      });

      setBill(res.data);

      alert("✅ Bill Generated Successfully");

    } catch (error) {

      console.log(error);

      alert(

        error.response?.data?.message ||

        "Failed To Generate Bill"

      );

    }

  };
    // =====================================
  // BILLING PERIOD
  // =====================================

  const getBillingPeriod = () => {

    if (cycle === "1") {

      return "1 - 15";

    }

    return "16 - End";

  };

  // =====================================
  // CUSTOMER DATA
  // =====================================

  const customerData =
    customers.find(
      (c) => c._id === customer
    );

  // =====================================
  // UI
  // =====================================

  return (

    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">

      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-slate-800">

            🧾 Billing Management

          </h1>

          <p className="text-gray-500 mt-2">

            Generate professional invoices for customers.

          </p>

        </div>

        {/* Summary Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-gray-500">

                  Customers

                </p>

                <h2 className="text-3xl font-bold">

                  {customers.length}

                </h2>

              </div>

              <FaUsers className="text-4xl text-blue-600"/>

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-gray-500">

                  Month

                </p>

                <h2 className="text-3xl font-bold">

                  {month}

                </h2>

              </div>

              <FaCalendarAlt className="text-4xl text-orange-500"/>

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-gray-500">

                  Year

                </p>

                <h2 className="text-3xl font-bold">

                  {year}

                </h2>

              </div>

              <FaFileInvoice className="text-4xl text-green-600"/>

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-gray-500">

                  Status

                </p>

                <h2 className="text-xl font-bold">

                  {bill ? bill.status : "Ready"}

                </h2>

              </div>

              <FaMoneyBillWave className="text-4xl text-purple-600"/>

            </div>

          </div>

        </div>

        {/* Billing Form */}

        <div className="bg-white rounded-2xl shadow-lg p-6">

          <h2 className="text-2xl font-bold mb-6">

            Generate New Bill

          </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Customer */}

            <div>

              <label className="block mb-2 font-semibold">
                Customer
              </label>

              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >

                <option value="">
                  Select Customer
                </option>

                {customers.map((c) => (

                  <option
                    key={c._id}
                    value={c._id}
                  >

                    {c.customerName}

                  </option>

                ))}

              </select>

            </div>

            {/* Month */}

            <div>

              <label className="block mb-2 font-semibold">
                Month
              </label>

              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >

                {Array.from({ length: 12 }, (_, i) => (

                  <option
                    key={i + 1}
                    value={i + 1}
                  >

                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}

                  </option>

                ))}

              </select>

            </div>

            {/* Year */}

            <div>

              <label className="block mb-2 font-semibold">
                Year
              </label>

              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />

            </div>

            {/* Cycle */}

            <div>

              <label className="block mb-2 font-semibold">
                Billing Cycle
              </label>

              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >

                <option value="1">
                  1 - 15
                </option>

                <option value="2">
                  16 - End
                </option>

              </select>

            </div>

          </div>

          {/* Generate Button */}

          <div className="mt-8">

            <button
              onClick={handleGenerate}
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-bold transition"
            >

              🧾 Generate Bill

            </button>

          </div>

        </div>

        {/* Invoice */}
                {bill && (

          <div
            ref={billRef}
            className="bg-white rounded-2xl shadow-xl mt-8 p-8"
          >

            {/* Invoice Header */}

            <div className="flex flex-col md:flex-row justify-between items-center border-b pb-6">

              <div className="flex items-center gap-4">

                <img
                  src={logo}
                  alt="OM Tiffin"
                  className="w-20 h-20 rounded-full border"
                />

                <div>

                  <h1 className="text-3xl font-bold text-blue-700">

                    OM TIFFIN SERVICE

                  </h1>

                  <p className="text-gray-500">

                    Healthy • Fresh • Homemade

                  </p>

                </div>

              </div>

              <div className="text-right mt-6 md:mt-0">

                <h2 className="text-2xl font-bold">

                  TAX INVOICE

                </h2>

                <p>

                  Invoice :
                  <strong>

                    {bill.invoiceNo}

                  </strong>

                </p>

                <p>

                  Date :
                  {" "}
                  {new Date().toLocaleDateString()}

                </p>

              </div>

            </div>

            {/* Customer Details */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">

              <div>

                <h3 className="font-bold text-lg mb-3">

                  Customer Details

                </h3>

                <p>

                  <strong>Name :</strong>

                  {" "}

                  {customerData?.customerName}

                </p>

                <p>

                  <strong>Mobile :</strong>

                  {" "}

                  {customerData?.mobile}

                </p>

                <p>

                  <strong>Address :</strong>

                  {" "}

                  {customerData?.address}

                </p>

              </div>

              <div>

                <h3 className="font-bold text-lg mb-3">

                  Billing Details

                </h3>

                <p>

                  <strong>Month :</strong>

                  {" "}

                  {month}

                </p>

                <p>

                  <strong>Year :</strong>

                  {" "}

                  {year}

                </p>

                <p>

                  <strong>Period :</strong>

                  {" "}

                  {getBillingPeriod()}

                </p>

              </div>

            </div>

            {/* Meals Table */}
            {/* Meals Table */}

<div className="mt-8 overflow-x-auto">

  <table className="min-w-full border border-gray-300">

    <thead className="bg-blue-700 text-white">

      <tr>

        <th className="border px-4 py-3">
          Description
        </th>

        <th className="border px-4 py-3">
          Qty
        </th>

        <th className="border px-4 py-3">
          Rate
        </th>

        <th className="border px-4 py-3">
          Amount
        </th>

      </tr>

    </thead>

    <tbody>

      <tr>

        <td className="border px-4 py-3">

          Lunch Meals

        </td>

        <td className="border px-4 py-3 text-center">

          {bill.totalLunch}

        </td>

        <td className="border px-4 py-3 text-center">

          ₹{bill.lunchPrice}

        </td>

        <td className="border px-4 py-3 text-right">

          ₹{bill.lunchAmount}

        </td>

      </tr>

      <tr>

        <td className="border px-4 py-3">

          Dinner Meals

        </td>

        <td className="border px-4 py-3 text-center">

          {bill.totalDinner}

        </td>

        <td className="border px-4 py-3 text-center">

          ₹{bill.dinnerPrice}

        </td>

        <td className="border px-4 py-3 text-right">

          ₹{bill.dinnerAmount}

        </td>

      </tr>

      <tr>

        <td className="border px-4 py-3">

          Extra Charges

        </td>

        <td className="border px-4 py-3 text-center">

          -

        </td>

        <td className="border px-4 py-3 text-center">

          -

        </td>

        <td className="border px-4 py-3 text-right">

          ₹{bill.extraCharges}

        </td>

      </tr>

      <tr className="bg-slate-100 font-bold">

        <td
          colSpan="3"
          className="border px-4 py-3 text-right"
        >

          Grand Total

        </td>

        <td className="border px-4 py-3 text-right text-green-700">

          ₹{bill.totalAmount}

        </td>

      </tr>

    </tbody>

  </table>

</div>

{/* Payment Summary */}

<div className="grid md:grid-cols-2 gap-6 mt-8">

  <div className="bg-green-50 rounded-xl p-5">

    <h3 className="font-bold text-lg mb-4">

      Payment Summary

    </h3>

    <div className="space-y-2">

      <div className="flex justify-between">

        <span>Total Bill</span>

        <strong>

          ₹{bill.totalAmount}

        </strong>

      </div>

      <div className="flex justify-between">

        <span>Paid</span>

        <strong className="text-green-600">

          ₹{bill.paidAmount}

        </strong>

      </div>

      <div className="flex justify-between">

        <span>Pending</span>

        <strong className="text-red-600">

          ₹{bill.pendingAmount}

        </strong>

      </div>

    </div>

  </div>

  <div className="bg-blue-50 rounded-xl p-5">

    <h3 className="font-bold text-lg mb-4">

      Bill Status

    </h3>

    <div className="text-center">

      <span className="px-5 py-2 rounded-full bg-blue-700 text-white font-bold">

        {bill.status}

      </span>

    </div>

  </div>

</div>

{/* QR Section */}
{/* QR Section */}

<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

  {/* QR */}

  <div className="bg-white border rounded-2xl p-6 flex flex-col items-center">

    <h3 className="text-xl font-bold mb-4">

      Scan & Pay

    </h3>

    <QRCode
      value={`upi://pay?pa=omtiffin@upi&pn=OM Tiffin Service&am=${bill.pendingAmount}`}
      size={180}
    />

    <p className="mt-4 text-sm text-gray-500 text-center">

      Scan this QR using any UPI App

    </p>

  </div>

  {/* Bank Details */}

  <div className="bg-white border rounded-2xl p-6">

    <h3 className="text-xl font-bold mb-5">

      Payment Details

    </h3>

    <div className="space-y-3">

      <div className="flex justify-between">

        <span>UPI ID</span>

        <strong>

          omtiffin@upi

        </strong>

      </div>

      <div className="flex justify-between">

        <span>Account Name</span>

        <strong>

          OM TIFFIN SERVICE

        </strong>

      </div>

      <div className="flex justify-between">

        <span>IFSC</span>

        <strong>

          SBIN0001234

        </strong>

      </div>

      <div className="flex justify-between">

        <span>Bank</span>

        <strong>

          State Bank of India

        </strong>

      </div>

    </div>

  </div>

</div>

{/* Terms */}

<div className="mt-10 bg-yellow-50 border border-yellow-300 rounded-2xl p-6">

  <h3 className="text-lg font-bold mb-3">

    Terms & Conditions

  </h3>

  <ul className="list-disc pl-5 space-y-2 text-gray-700">

    <li>

      Payment due within 7 days.

    </li>

    <li>

      Meals once delivered cannot be refunded.

    </li>

    <li>

      Contact OM Tiffin Service for any billing issue.

    </li>

  </ul>

</div>

{/* Buttons */}

<div className="flex flex-wrap gap-4 mt-10">

  <button

    onClick={handlePrint}

    className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-xl"

  >

    🖨 Print Invoice

  </button>

  <button

    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl"

  >

    📄 Download PDF

  </button>

</div>

{/* Footer */}
{/* Footer */}

<div className="mt-12 border-t pt-8">

  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

    {/* Thank You */}

    <div>

      <h3 className="text-xl font-bold text-blue-700 mb-3">

        Thank You ❤️

      </h3>

      <p className="text-gray-600 leading-7">

        Thank you for choosing

        <strong> OM TIFFIN SERVICE </strong>

        We appreciate your trust and look forward to serving you with fresh,
        healthy and hygienic homemade meals every day.

      </p>

    </div>

    {/* Contact */}

    <div className="text-left md:text-right">

      <h3 className="text-xl font-bold mb-3">

        Contact Information

      </h3>

      <p>

        📞 +91 94093 80470

      </p>

      <p>

        📧 omtiffinservice@gmail.com

      </p>

      <p>

        📍 Gandhinagar, Gujarat

      </p>

    </div>

  </div>

  {/* Copyright */}

  <div className="border-t mt-8 pt-5 text-center text-gray-500 text-sm">

    © 2026 OM TIFFIN SERVICE

    <br />

    Powered By OM Tiffin Management System

  </div>

</div>

{/* Close Invoice */}

          </div>

        )}

      </div>

    </div>

  );

}