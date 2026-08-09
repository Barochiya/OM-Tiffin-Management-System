import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaUserPlus,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaEye,
  FaEdit,
  FaMoneyBillWave,
  FaTrash,
  FaWhatsapp,
  FaSpinner,
} from "react-icons/fa";

import {
  getCustomers,
  deleteCustomer,
  markPaymentPaid,
} from "../services/customerService";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const res = await getCustomers(1, 1000);

      setCustomers(res.data || []);
    } catch (error) {
      console.error("Load customers error:", error);
      alert(
        error.response?.data?.message ||
          "❌ Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDelete = async (id, customerName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customerName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await deleteCustomer(id);

      setCustomers((prev) =>
        prev.filter((customer) => customer._id !== id)
      );

      alert("✅ Customer deleted successfully.");
    } catch (error) {
      console.error("Delete customer error:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "❌ Failed to delete customer."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handlePayment = async (id, customerName) => {
    const confirmed = window.confirm(
      `Mark payment as PAID for "${customerName}"?`
    );

    if (!confirmed) return;

    try {
      setPayingId(id);

      await markPaymentPaid(id);

      setCustomers((prev) =>
        prev.map((customer) =>
          customer._id === id
            ? {
                ...customer,
                paymentStatus: "Paid",
                pendingAmount: 0,
              }
            : customer
        )
      );

      alert("✅ Payment marked as Paid.");
    } catch (error) {
      console.error("Payment update error:", error);

      alert(
        error.response?.data?.message ||
          "❌ Failed to update payment."
      );
    } finally {
      setPayingId(null);
    }
  };

  const openWhatsApp = (customer) => {
    const phone = customer.phone?.replace(/\D/g, "");

    if (!phone) {
      alert("Customer phone number not found.");
      return;
    }

    const message = `👋 Hello ${customer.customerName},

Welcome to *OM TIFFIN SERVICE* 🍱

How can we help you today?`;

    window.open(
      `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const sendBulkReminder = () => {
    const pendingCustomers = customers.filter(
      (customer) =>
        customer.paymentStatus !== "Paid" && customer.phone
    );

    if (pendingCustomers.length === 0) {
      alert("No pending payment customers found.");
      return;
    }

    const confirmed = window.confirm(
      `Open WhatsApp reminder for ${pendingCustomers.length} pending customer(s)?`
    );

    if (!confirmed) return;

    pendingCustomers.forEach((customer, index) => {
      setTimeout(() => {
        const phone = customer.phone.replace(/\D/g, "");

        const message = `🍱 *OM TIFFIN SERVICE*

Hello ${customer.customerName},

💰 This is a friendly reminder that your payment is pending.

Please complete your payment at your earliest convenience.

Thank you 🙏`;

        window.open(
          `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      }, index * 1200);
    });
  };

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.customerName
          ?.toLowerCase()
          .includes(query) ||
        customer.phone?.includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) => customer.status !== "Active"
  ).length;

  const pendingPayments = customers.filter(
    (customer) => customer.paymentStatus !== "Paid"
  ).length;

  return (
    <div className="w-full min-w-0">
      <div className="w-full max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              👥 Customers
            </h1>

            <p className="text-gray-500 mt-2">
              Manage all tiffin customers
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={sendBulkReminder}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold transition"
            >
              📢 Bulk Reminder
            </button>

            <Link
              to="/add-customer"
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
            >
              <FaUserPlus />
              Add Customer
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Total Customers</p>
                <h2 className="text-3xl font-bold text-slate-800 mt-1">
                  {customers.length}
                </h2>
              </div>
              <FaUsers className="text-blue-600 text-4xl" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Active</p>
                <h2 className="text-3xl font-bold text-green-600 mt-1">
                  {activeCustomers}
                </h2>
              </div>
              <FaCheckCircle className="text-green-600 text-4xl" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Inactive</p>
                <h2 className="text-3xl font-bold text-red-600 mt-1">
                  {inactiveCustomers}
                </h2>
              </div>
              <FaTimesCircle className="text-red-600 text-4xl" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Pending Payments</p>
                <h2 className="text-3xl font-bold text-orange-600 mt-1">
                  {pendingPayments}
                </h2>
              </div>
              <FaMoneyBillWave className="text-orange-600 text-4xl" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search customer by name or phone..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-slate-500">
              <FaSpinner className="animate-spin mr-3" />
              Loading customers...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full">
                  <thead className="bg-blue-700 text-white">
                    <tr>
                      <th className="px-4 py-4 text-left">Customer</th>
                      <th className="px-4 py-4 text-left">Phone</th>
                      <th className="px-4 py-4 text-left">Meal</th>
                      <th className="px-4 py-4 text-left">Price</th>
                      <th className="px-4 py-4 text-left">Payment</th>
                      <th className="px-4 py-4 text-left">Status</th>
                      <th className="px-4 py-4 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedCustomers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-14 text-center text-slate-500"
                        >
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map((customer) => (
                        <tr
                          key={customer._id}
                          className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 font-semibold text-slate-800">
                            {customer.customerName}
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {customer.phone}
                          </td>

                          <td className="px-4 py-4 text-slate-700">
                            {customer.mealType || "-"}
                          </td>

                          <td className="px-4 py-4 font-semibold text-green-600">
                            ₹{customer.price || 0}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                customer.paymentStatus === "Paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {customer.paymentStatus || "Pending"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                customer.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {customer.status}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/customer/${customer._id}`}
                                title="View Customer"
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                              >
                                <FaEye />
                              </Link>

                              <Link
                                to={`/edit-customer/${customer._id}`}
                                title="Edit Customer"
                                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded-lg"
                              >
                                <FaEdit />
                              </Link>

                              <button
                                type="button"
                                title="Mark Payment Paid"
                                disabled={
                                  payingId === customer._id ||
                                  customer.paymentStatus === "Paid"
                                }
                                onClick={() =>
                                  handlePayment(
                                    customer._id,
                                    customer.customerName
                                  )
                                }
                                className={`p-2 rounded-lg ${
                                  customer.paymentStatus === "Paid"
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-green-100 hover:bg-green-200 text-green-700"
                                }`}
                              >
                                {payingId === customer._id ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaMoneyBillWave />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => openWhatsApp(customer)}
                                title="WhatsApp Chat"
                                className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg"
                              >
                                <FaWhatsapp />
                              </button>

                              <button
                                type="button"
                                disabled={deletingId === customer._id}
                                onClick={() =>
                                  handleDelete(
                                    customer._id,
                                    customer.customerName
                                  )
                                }
                                title="Delete Customer"
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === customer._id ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaTrash />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-slate-200">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setPage((previous) => Math.max(1, previous - 1))
                  }
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ◀ Previous
                </button>

                <span className="font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((previous) =>
                      Math.min(totalPages, previous + 1)
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next ▶
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
