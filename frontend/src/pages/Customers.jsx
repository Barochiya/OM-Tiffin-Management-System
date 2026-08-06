import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import {
  getCustomers,
  deleteCustomer,
  markPaymentPaid,
} from "../services/customerService";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

 useEffect(() => {
  loadCustomers();
}, [page, search, status]);

const loadCustomers = async () => {
  try {
    setLoading(true);

    const res = await getCustomers(
      page,
      5,
      search,
      status
    );

    setCustomers(res.data || []);
    setTotalPages(res.totalPages || 1);

  } catch (err) {
    console.log(err);
    alert("Failed to load customers");
  } finally {
    setLoading(false);
  }
};

const handleDelete = async (id, customerName) => {
  const confirmDelete = window.confirm(
    `Are you sure you want to delete "${customerName}"?`
  );

  if (!confirmDelete) return;

  try {
    await deleteCustomer(id);

    alert("✅ Customer deleted successfully");

    loadCustomers();

  } catch (error) {
    console.error(error);

    alert("❌ Failed to delete customer");
  }
};

const handlePayment = async (id, customerName) => {
  const confirmPay = window.confirm(
    `Mark payment as PAID for "${customerName}"?`
  );

  if (!confirmPay) return;

  try {
    await markPaymentPaid(id);

    alert("✅ Payment marked as Paid");

    loadCustomers();

  } catch (error) {
    console.error(error);

    alert(
      error.response?.data?.message ||
      "❌ Failed to update payment"
    );
  }
};

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full min-h-screen bg-slate-100">
        <Navbar />

        <div className="p-8">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Customers
              </h1>

              <p className="text-gray-500">
                Manage all tiffin customers
              </p>
            </div>

            <Link
              to="/add-customer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
            >
              + Add Customer
            </Link>
          </div>

          {/* Search + Filter */}
          <div className="bg-white rounded-xl shadow-md p-5 mb-6">

            <div className="flex flex-col md:flex-row gap-4 justify-between">

              <input
                type="text"
                placeholder="🔍 Search Customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="border rounded-lg px-4 py-3 w-full md:w-96"
              />

              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="border rounded-lg px-4 py-3 w-full md:w-56"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

            </div>

          </div>

          {/* Table */}

          <div className="bg-white rounded-xl shadow-md overflow-hidden">

            {loading ? (

              <div className="text-center p-10">
                Loading...
              </div>

            ) : customers.length === 0 ? (

              <div className="text-center p-10">
                No Customers Found
              </div>

            ) : (

              <>
                <table className="w-full">

                  <thead className="bg-blue-600 text-white">

                    <tr>
                      <th className="p-4 text-left">
                        Customer
                      </th>

                      <th className="p-4 text-left">
                        Phone
                      </th>

                      <th className="p-4 text-left">
                        Meal
                      </th>

                      <th className="p-4 text-left">
                        Price
                        </th>

                        <th className="p-4 text-left">
                        Payment
                        </th>

                        <th className="p-4 text-left">
                        Status
                        </th>

                      <th className="p-4 text-center">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {customers.map((customer) => (

                      <tr
                        key={customer._id}
                        className="border-b hover:bg-slate-50"
                      >

                        <td className="p-4 font-semibold">
                          {customer.customerName}
                        </td>

                        <td className="p-4">
                          {customer.phone}
                        </td>

                        <td className="p-4">
                          {customer.mealType}
                        </td>

                        <td className="p-4">
  {customer.pricing?.pricingType === "custom" ? (
    <div className="text-sm space-y-1">
      <div className="font-bold text-green-600">
        🟢 Custom Pricing
      </div>

      <div>
        🍳 Breakfast : ₹{customer.pricing.breakfastPrice}
      </div>

      <div>
        🍛 Lunch : ₹{customer.pricing.lunchPrice}
      </div>

      <div>
        🍽 Dinner : ₹{customer.pricing.dinnerPrice}
      </div>

      {customer.pricing.extraCharge > 0 && (
        <div className="text-blue-600">
          ➕ Extra : ₹{customer.pricing.extraCharge}
        </div>
      )}

      {customer.pricing.discount > 0 && (
        <div className="text-red-600">
          ➖ Discount : {customer.pricing.discount}
          {customer.pricing.discountType === "percentage"
            ? "%"
            : " ₹"}
        </div>
      )}
    </div>
  ) : (
    <span className="font-semibold text-green-600">
      ₹{customer.latestBill?.totalAmount || 0}
    </span>
  )}
</td>

<td className="p-4">
  {customer.latestBill?.status === "Paid" ? (
    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
      ✅ Paid
    </span>
  ) : (
    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
      ❌ Pending
    </span>
  )}
</td>

<td className="p-4">
  <StatusBadge
    status={customer.status}
  />
</td>

                        <td className="p-4">

                          <div className="flex justify-center gap-2">

  <Link
    to={`/customer/${customer._id}`}
    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition"
    title="View Customer"
  >
    👁
  </Link>

  <Link
    to={`/edit-customer/${customer._id}`}
    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded transition"
    title="Edit Customer"
  >
    ✏
  </Link>

<button
  onClick={() =>
    handlePayment(
      customer.latestBill?._id,
      customer.customerName
    )
  }
  disabled={
    !customer.latestBill ||
    customer.latestBill.status === "Paid"
  }
  className={`px-3 py-1 rounded transition ${
    !customer.latestBill ||
    customer.latestBill.status === "Paid"
      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
      : "bg-green-100 hover:bg-green-200 text-green-700"
  }`}
  title={
    customer.latestBill?.status === "Paid"
      ? "Already Paid"
      : "Mark as Paid"
  }
>
  💰
</button>

  <button
    onClick={() =>
      handleDelete(customer._id, customer.customerName)
    }
    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition"
    title="Delete Customer"
  >
    🗑
  </button>

</div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

                {/* Pagination */}

                <div className="flex justify-between items-center p-5 border-t bg-gray-50">

                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50"
                  >
                    ◀ Previous
                  </button>

                  <p className="font-semibold">
                    Page {page} of {totalPages}
                  </p>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    Next ▶
                  </button>

                </div>

              </>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}