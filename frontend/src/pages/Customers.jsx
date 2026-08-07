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
} from "react-icons/fa";

import { getCustomers } from "../services/customerService";

export default function Customers() {

  // ==========================
  // STATES
  // ==========================

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [page, setPage] = useState(1);

  const pageSize = 10;

  // ==========================
  // LOAD CUSTOMERS
  // ==========================

  const loadCustomers = async () => {

  try {

    setLoading(true);

    const res = await getCustomers();

    setCustomers(res.data || []);

  } catch (err) {

    console.log(err);

  } finally {

    setLoading(false);

  }

};

// 👇👇 YAHAN ADD KARO

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

// 👇 iske baad already ye rahega

useEffect(() => {

  loadCustomers();

}, []);

 
    // ==========================
  // FILTERED CUSTOMERS
  // ==========================

  const filteredCustomers = useMemo(() => {

    return customers.filter((customer) => {

      const matchesSearch =
        customer.customerName
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||

        customer.phone
          ?.includes(search);

      const matchesStatus =
        statusFilter === "All"
          ? true
          : customer.status === statusFilter;

      return matchesSearch && matchesStatus;

    });

  }, [customers, search, statusFilter]);

  // ==========================
  // PAGINATION
  // ==========================

  const totalPages = Math.ceil(
    filteredCustomers.length / pageSize
  );

  const paginatedCustomers =
    filteredCustomers.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

  // ==========================
  // SUMMARY
  // ==========================

  const activeCustomers =
    customers.filter(
      (c) => c.status === "Active"
    ).length;

  const inactiveCustomers =
    customers.filter(
      (c) => c.status !== "Active"
    ).length;

  // ==========================
  // UI
  // ==========================

  return (

    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">

      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-slate-800">

              👥 Customers

            </h1>

            <p className="text-gray-500 mt-2">

              Manage all tiffin customers

            </p>

          </div>

          <Link

            to="/add-customer"

            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 w-fit"

          >

            <FaUserPlus />

            Add Customer

          </Link>

        </div>

        {/* Summary Cards */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-gray-500">

                  Total Customers

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

                  Active

                </p>

                <h2 className="text-3xl font-bold text-green-600">

                  {activeCustomers}

                </h2>

              </div>

              <FaCheckCircle className="text-green-600 text-4xl"/>

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="flex justify-between items-center">

              <div>

                <p className="text-gray-500">

                  Inactive

                </p>

                <h2 className="text-3xl font-bold text-red-600">

                  {inactiveCustomers}

                </h2>

              </div>

              <FaTimesCircle className="text-red-600 text-4xl"/>

            </div>

          </div>

        </div>
                {/* Search & Filter */}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Search */}

            <div className="relative lg:col-span-2">

              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search customer by name or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* Status Filter */}

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >

              <option value="All">

                All Status

              </option>

              <option value="Active">

                Active

              </option>

              <option value="Inactive">

                Inactive

              </option>

            </select>

          </div>

        </div>

        {/* Customers Table */}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-blue-700 text-white">

                <tr>

                  <th className="px-4 py-4 text-left">
                    Customer
                  </th>

                  <th className="px-4 py-4 text-left">
                    Phone
                  </th>

                  <th className="px-4 py-4 text-left">
                    Meal
                  </th>

                  <th className="px-4 py-4 text-left">
                    Price
                  </th>

                  <th className="px-4 py-4 text-left">
                    Payment
                  </th>

                  <th className="px-4 py-4 text-left">
                    Status
                  </th>

                  <th className="px-4 py-4 text-center">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="text-center py-10"
                    >

                      Loading...

                    </td>

                  </tr>

                ) : paginatedCustomers.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="text-center py-10 text-gray-500"
                    >

                      No Customers Found

                    </td>

                  </tr>

                ) : (

                  paginatedCustomers.map((customer) => (

                    <tr
                      key={customer._id}
                      className="border-b hover:bg-slate-50"
                    >

                      <td className="px-4 py-4 font-semibold">

                        {customer.customerName}

                      </td>

                      <td className="px-4 py-4">

                        {customer.phone}

                      </td>

                      <td className="px-4 py-4">

                        {customer.mealType}

                      </td>

                      <td className="px-4 py-4 font-bold text-green-600">

                        ₹{customer.price}

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

                      {/* Status */}

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

                      {/* Actions */}

                      <td className="px-4 py-4">

                        <div className="flex items-center justify-center gap-2">

                          <Link
                            to={`/customer/${customer._id}`}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                          >
                            <FaEye />
                          </Link>
                                  
                          <Link
                            to={`/edit-customer/${customer._id}`}
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded-lg"
                          >
                            <FaEdit />
                          </Link>

                          <Link
                            to="/payments"
                            className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg"
                          >
                            <FaMoneyBillWave />
                          </Link>
                            <button
                                          onClick={() => openWhatsApp(customer)}
                                          className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg"
                                          title="WhatsApp Chat"
                                        >
                                    <FaWhatsapp />
                                  </button>
                          <button
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
                            onClick={() => {

                              if (
                                window.confirm(
                                  "Delete this customer?"
                                )
                              ) {

                                alert(
                                  "Delete API will be connected next."
                                );

                              }

                            }}
                          >
                            <FaTrash />
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

          <div className="flex justify-between items-center p-6 border-t">

            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="bg-slate-200 disabled:opacity-40 px-5 py-2 rounded-lg"
            >

              ◀ Previous

            </button>

            <span className="font-semibold">

              Page {page} of {totalPages || 1}

            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="bg-blue-600 text-white disabled:opacity-40 px-5 py-2 rounded-lg"
            >

              Next ▶

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}
