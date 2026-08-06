import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { getCustomersForEntry } from "../services/dailyEntryService";

import {
  addPayment,
  getBillsByCustomer,
  getPayments,
} from "../services/paymentService";

export default function Payments() {

  // ===============================
  // States
  // ===============================
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);

  const [customer, setCustomer] = useState("");
  const [bill, setBill] = useState("");

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [remark, setRemark] = useState("");
  const [payments, setPayments] = useState([]);

  // ===============================
  // Load Customers
  // ===============================
 useEffect(() => {
  loadCustomers();
  loadPayments();
}, []);

  const loadCustomers = async () => {
    try {
      const res = await getCustomersForEntry();
      setCustomers(res.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const loadPayments = async () => {
  try {
    const res = await getPayments();

    console.log("Payments API Response:", res);

    setPayments(res);

  } catch (error) {
    console.log(error);
  }
};

  // ===============================
  // Customer Change
  // ===============================
  const handleCustomerChange = async (customerId) => {
  setCustomer(customerId);

  try {
    const res = await getBillsByCustomer(customerId);
    setBills(res);
  } catch (error) {
    console.log(error);
  }
};
  const handleSavePayment = async () => {
  try {
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
    // Reset Form
    setBill("");
    setAmount("");
    setRemark("");
    setPaymentMethod("Cash");

    // Reload Bills
    if (customer) {
      const res = await getBillsByCustomer(customer);
      setBills(res);
    }

  } catch (error) {
    console.log(error);

    alert(
      error.response?.data?.message ||
      "Failed to save payment"
    );
  }
};

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full min-h-screen bg-slate-100">
        <Navbar />

        <div className="p-8">

          <h1 className="text-3xl font-bold">
            Payment Management
          </h1>

          <p className="text-gray-500 mt-2">
            Receive customer payments and manage pending dues.
          </p>

          <div className="bg-white rounded-xl shadow-md mt-8 p-8">

            <h2 className="text-xl font-semibold mb-6">
              💳 Add Payment
            </h2>

            <div className="grid grid-cols-2 gap-6">

              <div>
  <label className="block mb-2 font-medium">
    Customer
  </label>

  <select
    value={customer}
    onChange={(e) => handleCustomerChange(e.target.value)}
    className="w-full border rounded-lg p-3"
  >
    <option value="">Select Customer</option>

    {customers.map((c) => (
      <option key={c._id} value={c._id}>
        {c.customerName}
      </option>
    ))}
  </select>
</div>

              <div>
                <label className="block mb-2 font-medium">
                  Bill
                </label>

                <select
  value={bill}
  onChange={(e) => {
    const selectedBill = bills.find(
      (b) => b._id === e.target.value
    );

    setBill(e.target.value);

    if (selectedBill) {
      setAmount(selectedBill.pendingAmount);
    }
  }}
  className="w-full border rounded-lg p-3"
>
  <option value="">Select Bill</option>

  {bills.map((b) => (
    <option key={b._id} value={b._id}>
      {b.month}/{b.year} - ₹{b.pendingAmount}
    </option>
  ))}
</select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Amount
                </label>

               <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Payment Mode
                </label>

               <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank</option>
                    <option value="Razorpay">Razorpay</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block mb-2 font-medium">
                  Remark
                </label>

                <textarea
                    rows="3"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full border rounded-lg p-3"
                />
              </div>

            </div>

            <button
                    onClick={handleSavePayment}
                    className="mt-8 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg"
                    >
                    💾 Save Payment
            </button>

          </div>
                 
                 <div className="bg-white rounded-xl shadow-md mt-8 p-8">

  <h2 className="text-2xl font-bold mb-6">
    💰 Payment History
  </h2>

  <table className="w-full">

    <thead className="bg-blue-600 text-white">
  <tr>
    <th className="p-3">Customer</th>
    <th className="p-3">Invoice</th>
    <th className="p-3">Amount</th>
    <th className="p-3">Mode</th>
    <th className="p-3">Date</th>
    <th className="p-3">Action</th>
  </tr>
</thead>

    <tbody>
  {payments.map((payment) => (
    <tr
      key={payment._id}
      className="border-b"
    >
      <td className="p-3">
        {payment.customer?.customerName}
      </td>

      <td className="p-3">
        {payment.bill?.invoiceNo || "N/A"}
      </td>

      <td className="p-3">
        ₹{payment.amount}
      </td>

      <td className="p-3">
        {payment.paymentMethod}
      </td>

      <td className="p-3">
        {new Date(payment.paymentDate).toLocaleDateString("en-GB")}
      </td>

      <td className="p-3">
        <Link
          to={`/payment-receipt/${payment._id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
        >
          👁 Receipt
        </Link>
      </td>
    </tr>
  ))}
</tbody>

  </table>

</div>
        </div>
      </div>

      
    </div>
  );
}