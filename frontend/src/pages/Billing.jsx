import { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import { useReactToPrint } from "react-to-print";
import logo from "../assets/logo.png";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { getCustomersForEntry } from "../services/dailyEntryService";
import { generateBill } from "../services/billService";

export default function Billing() {

  // =====================================
  // States
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
  // Print
  // =====================================

  const handlePrint = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Bill-${month}-${year}`,
  });



  // =====================================
  // Load Customers
  // =====================================

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {

      const res = await getCustomersForEntry();

      console.log("Customers API:", res.data);

      setCustomers(res.data || []);

    } catch (error) {

      console.log(error);

    }
  };

  // =====================================
  // Generate Bill
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

      console.log("Bill Response:", res);

      console.log("Bill Data:", res.data);

      setBill(res.data);

      alert("✅ Bill Generated Successfully");

    } catch (error) {

      console.log(error);

      alert(

        error.response?.data?.message ||

        "Failed to Generate Bill"

      );

    }

  };

  // =====================================
  // Billing Period
  // =====================================

  const getBillingPeriod = () => {

    if (!bill) return "";

    const mm = String(bill.month).padStart(2, "0");

    if (bill.cycle === "1") {

      return `01-${mm}-${bill.year} to 15-${mm}-${bill.year}`;

    }

    const lastDay = new Date(

      bill.year,

      bill.month,

      0

    ).getDate();

    return `16-${mm}-${bill.year} to ${lastDay}-${mm}-${bill.year}`;

  };

// =====================================
// Current Customer Data
// =====================================

const customerData = bill
  ? customers.find((c) => c._id === bill.customer)
  : null;

  console.log("Customer Data:", customerData);

  // =====================================
  // JSX
  // =====================================

  return (

    <div className="flex">

      <Sidebar />

      <div className="ml-64 w-full min-h-screen bg-slate-100">

        <Navbar />

        <div className="p-8">

          <h1 className="text-3xl font-bold">
            Monthly Billing
          </h1>

          <p className="text-gray-500 mt-2">
            Generate monthly bill for customers
          </p>

                    {/* ===================================== */}
          {/* Billing Form */}
          {/* ===================================== */}

          <div className="bg-white rounded-xl shadow-md p-6 mt-8">

            <div className="grid grid-cols-5 gap-5">

              {/* Customer */}

              <div>

                <label className="block mb-2 font-semibold">
                  Customer
                </label>

                <select
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full border rounded-lg p-3"
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

                <input
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) =>
                    setMonth(Number(e.target.value))
                  }
                  className="w-full border rounded-lg p-3"
                />

              </div>

              {/* Year */}

              <div>

                <label className="block mb-2 font-semibold">
                  Year
                </label>

                <input
                  type="number"
                  value={year}
                  onChange={(e) =>
                    setYear(Number(e.target.value))
                  }
                  className="w-full border rounded-lg p-3"
                />

              </div>

              {/* Billing Cycle */}

              <div>

                <label className="block mb-2 font-semibold">
                  Billing Cycle
                </label>

                <select
                  value={cycle}
                  onChange={(e) =>
                    setCycle(e.target.value)
                  }
                  className="w-full border rounded-lg p-3"
                >

                  <option value="1">
                    1 - 15
                  </option>

                  <option value="2">
                    16 - Month End
                  </option>

                </select>

              </div>

              {/* Button */}

              <div className="flex items-end">

                <button
                  onClick={handleGenerate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
                >

                  Generate Bill

                </button>

              </div>

            </div>

          </div>

                    {/* ===================================== */}
          {/* Bill */}
          {/* ===================================== */}

          {bill && (

            <div
  id="bill-print"
  ref={billRef}
  className="relative bg-white rounded-xl shadow-lg mt-8 p-8 overflow-hidden"
>
{/* Watermark */}

<div className="absolute inset-0 flex items-center justify-center pointer-events-none">

  <h1
    className={`text-[170px] font-extrabold rotate-[-30deg] opacity-[0.05]
      ${
        bill.status === "Paid"
          ? "text-green-700"
          : bill.status === "Partial"
          ? "text-yellow-600"
          : "text-red-600"
      }`}
  >
    {bill.status.toUpperCase()}
  </h1>

</div>
              {/* Header */}

              <div className="flex justify-between items-center border-b-2 border-blue-600 pb-6 mb-6">

 <div className="flex items-center gap-5">

  <img
    src={logo}
    alt="Logo"
    className="w-20 h-20 rounded-full"
  />

  <div>

    <h1 className="text-4xl font-bold text-blue-700">
      OM TIFFIN SERVICE
    </h1>

    <p className="text-gray-600 mt-2">
🍱 Fresh • Healthy • Homemade Food
</p>

<p className="text-gray-500 mt-1">
📍 Gandhinagar, Gujarat
</p>

<p className="text-gray-500 mt-1">
📞 +91 7016297983
</p>


  </div>

</div>

  <div className="text-right">

    <h2 className="text-3xl font-bold text-gray-800">
      INVOICE
    </h2>

    <div className="mt-3">

  <p className="text-gray-500 text-sm">
    Invoice Number
  </p>

  <h2 className="text-3xl font-extrabold text-blue-700 tracking-widest">
    {bill?.invoiceNo || "OMTS-202608-0001"}
  </h2>

</div>

<p className="text-xl mt-2">
  <strong>Date :</strong>{" "}
  {new Date().toLocaleDateString("en-GB")}
</p>

<p className="mt-2 text-lg">
  <strong>Due Date :</strong>{" "}
  {bill.cycle === "1"
    ? `15/${String(bill.month).padStart(2, "0")}/${bill.year}`
    : `${new Date(bill.year, bill.month, 0).getDate()}/${String(
        bill.month
      ).padStart(2, "0")}/${bill.year}`}
</p>

  <div className="flex justify-end mt-5">

  {bill.status === "Paid" && (

   <span className="bg-green-600 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg">
    ✅ PAID
</span>
  )}

  {bill.status === "Pending" && (

    <span className="bg-red-600 text-white px-5 py-2 rounded-full font-bold">
      ❌ PENDING
    </span>

  )}

  {bill.status === "Partial" && (

    <span className="bg-orange-500 text-white px-5 py-2 rounded-full font-bold">
      ⚠ PARTIAL
    </span>

  )}



</div>

  </div>

</div>

              {/* Customer Info */}

              <div className="grid grid-cols-2 gap-8 bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm mb-8">

  <div>

  <p className="text-gray-500">
    Customer Name
  </p>

  <h3 className="text-2xl font-bold">
    {customerData?.customerName}
  </h3>

  <p className="text-gray-500 mt-3">
    Mobile
  </p>

  <p className="font-medium">
    {customerData?.phone}
  </p>

  <p className="text-gray-500 mt-3">
    Address
  </p>

  <p className="font-medium">
    {customerData?.address}
  </p>

</div>

  <div>

    <p className="text-gray-500">
      Billing Period
    </p>

    <h3 className="text-xl font-semibold">

      {getBillingPeriod()}

    </h3>

    <p className="text-gray-500 mt-2">

      Billing Cycle

    </p>

    <p>

      {bill.cycle === "1"

        ? "1 - 15"

        : "16 - Month End"}

    </p>

  </div>

</div>

             {/* ================================ */}
{/* Date Wise Table */}
{/* ================================ */}

<div className="mt-10 overflow-hidden rounded-xl border border-gray-200 shadow-sm">

  <table className="w-full">

    <thead className="bg-blue-700 text-white">

      <tr>

        <th className="py-4 px-4 text-center">
          Date
        </th>

        <th className="py-4 px-4 text-center">
          🍳 Breakfast
        </th>

        <th className="py-4 px-4 text-center">
          🍛 Lunch
        </th>

        <th className="py-4 px-4 text-center">
          🍽 Dinner
        </th>

       <th className="border p-3">
            Extra Items
        </th>

        <th className="py-4 px-4 text-right">
            Amount (₹)
        </th>
      </tr>

    </thead>

    <tbody>

  {bill.dailyDetails?.map((day, index) => (

    <tr
      key={index}
      className={`${
        index % 2 === 0
          ? "bg-white"
          : "bg-gray-50"
      } hover:bg-blue-50 transition-colors duration-200`}
    >

      {/* Date */}
      <td className="py-3 px-4 text-center border-t">
        {new Date(day.date).toLocaleDateString("en-GB")}
      </td>

      {/* Breakfast */}
      <td className="py-3 px-4 text-center border-t">
        {day.breakfastQty}
      </td>

      {/* Lunch */}
      <td className="py-3 px-4 text-center border-t">
        {day.lunchQty}
      </td>

      {/* Dinner */}
      <td className="py-3 px-4 text-center border-t">
        {day.dinnerQty}
      </td>

      {/* Extra Items */}
      <td className="py-3 px-4 border-t">

        {day.extraItems?.length > 0 ? (

          <div className="space-y-2">

            {day.extraItems.map((item, i) => (

              <div
                key={i}
                className="flex justify-between items-center bg-orange-50 border border-orange-200 rounded px-2 py-1"
              >

                <span className="font-medium text-orange-700">
                  {item.description}
                </span>

                <span className="font-bold text-red-600">
                  ₹ {item.amount}
                </span>

              </div>

            ))}

          </div>

        ) : (

          <span className="text-gray-400">
            —
          </span>

        )}

      </td>

      {/* Total Amount */}
      <td className="py-3 px-4 text-right font-semibold border-t">
        ₹ {day.total}
      </td>

    </tr>

  ))}

</tbody>
  </table>

</div>

                           

               {/* ================================ */}
{/* Bill Summary Cards */}
{/* ================================ */}

<div className="grid grid-cols-5 gap-6 mt-10">

  {/* Total Amount */}
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
    <p className="text-gray-500 text-sm">
      Total Amount
    </p>

    <h2 className="text-3xl font-bold text-blue-700 mt-3">
      ₹ {bill.totalAmount}
    </h2>
  </div>

  {/* Paid Amount */}
  <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm">
    <p className="text-gray-500 text-sm">
      Paid Amount
    </p>

    <h2 className="text-3xl font-bold text-green-700 mt-3">
      ₹ {bill.paidAmount}
    </h2>
  </div>

{/* Extra Charges */}
<div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">

  <p className="text-gray-500 text-sm">
    Extra Charges
  </p>

  <h2 className="text-3xl font-bold text-orange-600 mt-3">
    ₹ {bill.extraAmount || 0}
  </h2>

</div>

  {/* Pending Amount */}
  <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
    <p className="text-gray-500 text-sm">
      Pending Amount
    </p>

    <h2 className="text-3xl font-bold text-red-700 mt-3">
      ₹ {bill.pendingAmount}
    </h2>
  </div>

  {/* Status */}
  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">

    <p className="text-gray-500 text-sm">
      Payment Status
    </p>

    <div className="mt-4">

      <span
        className={`px-5 py-2 rounded-full text-lg font-bold
        ${
          bill.status === "Paid"
            ? "bg-green-600 text-white"
            : bill.status === "Partial"
            ? "bg-yellow-500 text-white"
            : "bg-red-600 text-white"
        }`}
      >
        {bill.status}
      </span>

    </div>

  </div>

</div>

{/* ================================ */}
{/* Payment Details */}
{/* ================================ */}

<div className="mt-10 border rounded-xl p-6 bg-gray-50">

  <h2 className="text-2xl font-bold mb-6">
    Payment Details
  </h2>

  <div className="grid grid-cols-2 gap-10">

    <div>

      <div className="mb-5">
        <p className="text-gray-500">
          UPI ID
        </p>

        <p className="font-semibold text-lg">
          malaybarochiya-5@oksbi
        </p>
      </div>

      <div className="mb-5">
        <p className="text-gray-500">
          Bank Name
        </p>

        <p className="font-semibold text-lg">
          State Bank of India
        </p>
      </div>

      <div className="mb-5">
        <p className="text-gray-500">
          Account Number
        </p>

        <p className="font-semibold text-lg">
          45073878066
        </p>
      </div>

      <div>
        <p className="text-gray-500">
          IFSC Code
        </p>

        <p className="font-semibold text-lg">
          SBIN0032214
        </p>
      </div>

    </div>

    <div className="flex items-center justify-center">

      <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center w-full">

        <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center">

  <h3 className="text-xl font-bold text-green-700">
    Scan & Pay
  </h3>

  <div className="flex justify-center mt-5">

    <QRCode
      value={`upi://pay?pa=malaybarochiya-5@oksbi&pn=OM TIFFIN SERVICE&am=${bill.pendingAmount}&cu=INR`}
      size={170}
    />

  </div>

  <p className="mt-5 text-lg font-semibold">
    UPI ID
  </p>

  <p className="text-blue-700 font-bold">
    malaybarochiya-5@oksbi
  </p>

</div>

      </div>

    </div>

  </div>

</div>

<div className="mt-10">

  <h3 className="text-xl font-bold mb-4">
    Terms & Conditions
  </h3>

  <ul className="list-disc ml-6 text-gray-700 space-y-2">

    <li>
      Payment should be completed before the due date.
    </li>

    <li>
      Meal changes must be informed at least one day in advance.
    </li>

    <li>
      No refund will be provided for missed meals without prior notice.
    </li>

    <li>
      Online payment is preferred.
    </li>

  </ul>

</div>

{/* ================================ */}
{/* Footer */}
{/* ================================ */}

<div className="mt-12 border-t pt-8">

  <div className="flex justify-between items-end">

    {/* Left */}
    <div>

      <h2 className="text-xl font-bold text-green-700">
        Thank You For Choosing
      </h2>

      <h1 className="text-2xl font-bold text-blue-700 mt-2">
        OM TIFFIN SERVICE
      </h1>

      <p className="text-gray-500 mt-2">
        Fresh • Healthy • Homemade Food
      </p>

      <p className="text-sm text-gray-400 mt-3">
        This is a Computer Generated Invoice.
      </p>

    </div>

    {/* Right */}
    <div className="text-center">

      <img
        src={logo}
        alt="Company Stamp"
        className="w-20 h-20 mx-auto opacity-80"
      />

      <div className="w-44 border-b border-gray-500 mt-4"></div>

      <p className="mt-2 font-semibold">
        Authorized Signature
      </p>

    </div>

  </div>

</div>
              {/* ================================ */}
              {/* Buttons */}
              {/* ================================ */}

              <div className="flex gap-4 mt-8">

                <button
                  onClick={handlePrint}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
                >
                  🖨 Print Bill
                </button>

              <button
  onClick={handlePrint}
  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
>
  📄 Save as PDF
</button>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}