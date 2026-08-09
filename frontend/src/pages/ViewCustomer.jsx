import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaPhone,
  FaMapMarkerAlt,
  FaUser,
  FaUtensils,
  FaRupeeSign,
  FaCheckCircle,
} from "react-icons/fa";

import { getCustomerById } from "../services/customerService";

export default function ViewCustomer() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);

      const response = await getCustomerById(id);
      setCustomer(response?.data || response);
    } catch (error) {
      console.error("Load customer error:", error);

      alert(
        error.response?.data?.message ||
          "❌ Failed to load customer"
      );

      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500">
          Loading customer details...
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">Customer not found.</p>

        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="w-full max-w-6xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Customer Details
            </h1>

            <p className="text-gray-500 mt-2">
              View customer information and pricing
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/customers"
              className="inline-flex items-center gap-2 border border-slate-300 hover:bg-white px-4 py-3 rounded-xl font-semibold text-slate-700"
            >
              <FaArrowLeft />
              Back
            </Link>

            <Link
              to={`/edit-customer/${customer._id}`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold"
            >
              <FaEdit />
              Edit
            </Link>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-7 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
                <FaUser className="text-3xl" />
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold break-words">
                  {customer.customerName}
                </h2>

                <p className="mt-1 opacity-90">
                  {customer.phone}
                </p>
              </div>

              <span
                className={`sm:ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                  customer.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <FaCheckCircle />
                {customer.status || "Active"}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FaUser className="text-xl text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-800">
                    Customer Information
                  </h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-gray-500">
                      Customer Name
                    </p>
                    <p className="text-lg font-semibold text-slate-800 mt-1">
                      {customer.customerName}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <FaPhone className="text-green-600 mt-1" />

                    <div>
                      <p className="text-sm text-gray-500">
                        Phone
                      </p>
                      <p className="font-semibold mt-1">
                        {customer.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-red-500 mt-1" />

                    <div>
                      <p className="text-sm text-gray-500">
                        Address
                      </p>
                      <p className="font-semibold mt-1 leading-6">
                        {customer.address || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FaUtensils className="text-xl text-orange-500" />
                  <h3 className="text-xl font-bold text-slate-800">
                    Meal & Payment
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-sm text-gray-500">
                      Meal Type
                    </p>
                    <p className="font-semibold mt-1">
                      {customer.mealType || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Monthly Price
                    </p>
                    <p className="font-semibold text-green-600 mt-1">
                      ₹{customer.price || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Payment Status
                    </p>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                        customer.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {customer.paymentStatus || "Pending"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Pending Amount
                    </p>
                    <p className="font-semibold text-red-600 mt-1">
                      ₹{customer.pendingAmount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-6 rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaRupeeSign className="text-xl text-indigo-600" />

                <h3 className="text-xl font-bold text-slate-800">
                  Customer Pricing
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Breakfast
                  </p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    ₹
                    {customer.pricing?.breakfastPrice ??
                      0}
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Lunch
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ₹
                    {customer.pricing?.lunchPrice ??
                      0}
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Dinner
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    ₹
                    {customer.pricing?.dinnerPrice ??
                      0}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Pricing Type
                  </p>
                  <p className="text-lg font-bold text-slate-800 mt-2 capitalize">
                    {customer.pricing?.pricingType ||
                      "default"}
                  </p>
                </div>
              </div>

              {(customer.pricing?.extraCharge ||
                customer.pricing?.discount) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Extra Charge
                    </p>
                    <p className="font-semibold mt-1">
                      ₹{customer.pricing?.extraCharge || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Discount
                    </p>
                    <p className="font-semibold mt-1">
                      {customer.pricing?.discount || 0}
                      {customer.pricing?.discountType ===
                      "percentage"
                        ? "%"
                        : " ₹"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
