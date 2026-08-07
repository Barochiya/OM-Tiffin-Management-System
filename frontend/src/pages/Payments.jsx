import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaMoneyBillWave,
  FaUsers,
  FaReceipt,
  FaWallet,
  FaSearch,
} from "react-icons/fa";

import {
  getCustomersForEntry,
} from "../services/dailyEntryService";

import {
  addPayment,
  getBillsByCustomer,
  getPayments,
} from "../services/paymentService";

export default function Payments() {

  // ===========================
  // STATES
  // ===========================

  const [customers, setCustomers] = useState([]);

  const [bills, setBills] = useState([]);

  const [payments, setPayments] = useState([]);

  const [customer, setCustomer] = useState("");

  const [bill, setBill] = useState("");

  const [amount, setAmount] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [remark, setRemark] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);
  // ===========================
  // LOAD DATA
  // ===========================

  useEffect(() => {

    loadCustomers();

    loadPayments();

  }, []);

  // ===========================
  // LOAD CUSTOMERS
  // ===========================

  const loadCustomers = async () => {

    try {

      const res = await getCustomersForEntry();

      setCustomers(res.data || []);

    } catch (error) {

      console.log(error);

    }

  };

  // ===========================
  // LOAD PAYMENTS
  // ===========================

  const loadPayments = async () => {

    try {

      const res = await getPayments();

      setPayments(res);

    } catch (error) {

      console.log(error);

    }

  };

  // ===========================
  // CUSTOMER CHANGE
  // ===========================

  const handleCustomerChange = async (customerId) => {

    setCustomer(customerId);

    try {

      const res =
        await getBillsByCustomer(customerId);

      setBills(res);

    } catch (error) {

      console.log(error);

    }

  };

  // ===========================
  // SAVE PAYMENT
  // ===========================

  const handleSavePayment = async () => {

    try {

      setLoading(true);

      const paymentData = {

        customer,

        bill,

        amount: Number(amount),

        paymentMethod,

        remark,

      };

      await addPayment(paymentData);

      await loadPayments();

      alert("✅ Payment Saved Successfully");

      setBill("");

      setAmount("");

      setRemark("");

      setPaymentMethod("Cash");

      if (customer) {

        const res =
          await getBillsByCustomer(customer);

        setBills(res);

      }

    } catch (error) {

      console.log(error);

      alert(

        error.response?.data?.message ||

        "Failed to Save Payment"

      );

    } finally {

      setLoading(false);

    }

  };
    // ===========================
  // UI
  // ===========================

  return (

    <div className="p-4 lg:p-8 bg-slate-100 min-h-screen">

      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-slate-800">

              💳 Payment Management

            </h1>

            <p className="text-gray-500 mt-2">

              Receive customer payments and manage payment history.

            </p>

          </div>

        </div>

        {/* Dashboard Cards */}

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

              <FaUsers className="text-blue-600 text-4xl"/>

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-gray-500">

                  Bills

                </p>

                <h2 className="text-3xl font-bold">

                  {bills.length}

                </h2>

              </div>

              <FaReceipt className="text-orange-500 text-4xl"/>

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-gray-500">

                  Payments

                </p>

                <h2 className="text-3xl font-bold">

                  {payments.length}

                </h2>

              </div>

              <FaMoneyBillWave className="text-green-600 text-4xl"/>

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-gray-500">

                  Mode

                </p>

                <h2 className="text-xl font-bold">

                  {paymentMethod}

                </h2>

              </div>

              <FaWallet className="text-purple-600 text-4xl"/>

            </div>

          </div>

        </div>

        {/* Search */}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

          <div className="relative">

            <FaSearch className="absolute left-4 top-4 text-gray-400"/>

            <input

              type="text"

              placeholder="Search Customer..."

              value={search}

              onChange={(e)=>setSearch(e.target.value)}

              className="w-full border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"

            />

          </div>

        </div>

        {/* Add Payment Card */}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">

  ➕ Add Payment

</h2>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  {/* Customer */}

  <div>

    <label className="block mb-2 font-semibold">

      Customer

    </label>

    <select

      value={customer}

      onChange={(e)=>handleCustomerChange(e.target.value)}

      className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"

    >

      <option value="">

        Select Customer

      </option>

      {customers

        .filter((c)=>

          c.customerName

            .toLowerCase()

            .includes(search.toLowerCase())

        )

        .map((c)=>(

          <option

            key={c._id}

            value={c._id}

          >

            {c.customerName}

          </option>

      ))}

    </select>

  </div>

  {/* Bill */}

  <div>

    <label className="block mb-2 font-semibold">

      Bill

    </label>

    <select

      value={bill}

      onChange={(e)=>{

        const selectedBill = bills.find(

          (b)=>b._id===e.target.value

        );

        setBill(e.target.value);

        if(selectedBill){

          setAmount(selectedBill.pendingAmount);

        }

      }}

      className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"

    >

      <option value="">

        Select Bill

      </option>

      {bills.map((b)=>(

        <option

          key={b._id}

          value={b._id}

        >

          {b.month}/{b.year} - ₹{b.pendingAmount}

        </option>

      ))}

    </select>

  </div>

  {/* Amount */}

  <div>

    <label className="block mb-2 font-semibold">

      Amount

    </label>

    <input

      type="number"

      value={amount}

      onChange={(e)=>setAmount(e.target.value)}

      className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"

    />

  </div>

  {/* Payment Mode */}

  <div>

    <label className="block mb-2 font-semibold">

      Payment Method

    </label>

    <select

      value={paymentMethod}

      onChange={(e)=>setPaymentMethod(e.target.value)}

      className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"

    >

      <option value="Cash">Cash</option>

      <option value="UPI">UPI</option>

      <option value="Bank">Bank</option>

      <option value="Razorpay">Razorpay</option>

    </select>

  </div>

</div>

{/* Remark */}

<div className="mt-6">

  <label className="block mb-2 font-semibold">

    Remark

  </label>

  <textarea

    rows="3"

    value={remark}

    onChange={(e)=>setRemark(e.target.value)}

    className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"

  />

</div>

<div className="mt-8">

  <button

    onClick={handleSavePayment}

    disabled={loading}

    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold transition"

  >

    {loading

      ? "Saving..."

      : "💾 Save Payment"}

  </button>

</div>

</div>
        {/* Payment History */}

        <div className="bg-white rounded-2xl shadow-lg mt-8 p-6">

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">

            <h2 className="text-2xl font-bold">
              💰 Payment History
            </h2>

            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-semibold">
              Total Payments : {payments.length}
            </span>

          </div>

          <div className="overflow-x-auto rounded-xl border">

            <table className="min-w-full">

              <thead className="bg-blue-700 text-white">

                <tr>

                  <th className="px-4 py-3 text-left">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left">
                    Invoice
                  </th>

                  <th className="px-4 py-3 text-left">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-left">
                    Method
                  </th>

                  <th className="px-4 py-3 text-left">
                    Date
                  </th>

                  <th className="px-4 py-3 text-center">
                    Receipt
                  </th>

                </tr>

              </thead>

              <tbody>

                {payments.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="text-center py-10 text-gray-500"
                    >

                      No Payments Found

                    </td>

                  </tr>

                ) : (

                  payments

                    .filter((payment) =>
                      payment.customer?.customerName
                        ?.toLowerCase()
                        .includes(search.toLowerCase())
                    )

                    .map((payment) => (

                      <tr
                        key={payment._id}
                        className="border-b hover:bg-slate-50 transition"
                      >

                        <td className="px-4 py-3">
                          {payment.customer?.customerName}
                        </td>

                        <td className="px-4 py-3">
                          {payment.bill?.invoiceNo || "-"}
                        </td>

                        <td className="px-4 py-3 font-bold text-green-600">
                          ₹{payment.amount}
                        </td>

                        <td className="px-4 py-3">

                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">

                            {payment.paymentMethod}

                          </span>

                        </td>

                        <td className="px-4 py-3">

                          {new Date(
                            payment.paymentDate
                          ).toLocaleDateString("en-GB")}

                        </td>

                        <td className="px-4 py-3 text-center">

                          <Link
                            to={`/payment-receipt/${payment._id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                          >

                            👁 Receipt

                          </Link>

                        </td>

                      </tr>

                    ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>

  );

}