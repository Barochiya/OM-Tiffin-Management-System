import { House, CreditCard, LogOut, Megaphone, Inbox, MessageCircle, FileText, Download, ChartColumn, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomerProfile,
  logoutCustomer,
} from "../services/customerAuthService";
const CustomerTiffinPlan = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loadProfile = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setRefreshing(true);
        }
        const result = await getCustomerProfile();
        setCustomer(result.customer || null);
        setError("");
      } catch (err) {
        console.error("Customer tiffin plan error:", err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          logoutCustomer();
          navigate("/customer-login", { replace: true });
          return;
        }
        setError(
          err?.response?.data?.message ||
            "Unable to load your tiffin plan details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );
  useEffect(() => {
    loadProfile({ showLoader: true });
  }, [loadProfile]);
  const formatMoney = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };
  const formatMealType = (value) => {
    if (!value) return "—";
    if (value === "Both") return "Lunch + Dinner";
    if (value === "Lunch") return "Lunch";
    if (value === "Dinner") return "Dinner";
    if (value === "Breakfast") return "Breakfast";
    return value;
  };
  const handleLogout = () => {
    logoutCustomer();
    navigate("/customer-login", { replace: true });
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto" />
          <p className="mt-5 text-slate-600 font-medium">
            Loading your tiffin plan...
          </p>
        </div>
      </div>
    );
  }
  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <ChartColumn className="text-blue-600" size={40} />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Plan Details Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We could not load your current tiffin plan.
          </p>
          <button
            type="button"
            onClick={() => navigate("/customer/dashboard")}
            className="mt-6 w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 font-bold text-white"
          >
            <House size={18} /> Dashboard
          </button>
        </div>
      </div>
    );
  }
  const pricing = customer.pricing || {};
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-6 sm:px-8 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  OM Tiffin Customer Portal
                </p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                  Current Plan / Tiffin Details
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  View your current tiffin service and meal pricing details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadProfile({ showLoader: true })}
                disabled={refreshing}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 px-5 py-3 font-bold text-slate-700"
              >
                {refreshing ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>
          </div>
          <div className="p-5 sm:p-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            {/* Current Service */}
            <section>
              <h2 className="text-lg font-bold text-slate-900">
                Current Service
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    Meal Type
                  </p>
                  <p className="mt-2 text-xl font-bold text-blue-900">
                    {formatMealType(customer.mealType)}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Service Status
                  </p>
                  <p className="mt-2 text-xl font-bold text-emerald-800">
                    {customer.status || "—"}
                  </p>
                </div>
              </div>
            </section>
            {/* Customer Details */}
            <section className="mt-7">
              <h2 className="text-lg font-bold text-slate-900">
                Customer Details
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Customer Name
                  </p>
                  <p className="mt-1 font-bold text-slate-900 break-words">
                    {customer.customerName || "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Customer ID
                  </p>
                  <p className="mt-1 font-bold text-slate-900 break-words">
                    {customer.barcode || "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Phone
                  </p>
                  <p className="mt-1 font-bold text-slate-900 break-words">
                    {customer.phone || "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Address
                  </p>
                  <p className="mt-1 font-bold text-slate-900 break-words">
                    {customer.address || "—"}
                  </p>
                </div>
              </div>
            </section>
            {/* Pricing */}
            <section className="mt-7">
              <h2 className="text-lg font-bold text-slate-900">
                Meal Pricing
              </h2>
              <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200">
                  <div className="px-4 py-3 font-bold text-slate-600">
                    Meal
                  </div>
                  <div className="px-4 py-3 text-right font-bold text-slate-600">
                    Price
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-slate-100">
                  <div className="px-4 py-4 font-semibold text-slate-800">
                    Breakfast
                  </div>
                  <div className="px-4 py-4 text-right font-bold text-slate-900">
                    {formatMoney(pricing.breakfastPrice)}
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-slate-100">
                  <div className="px-4 py-4 font-semibold text-slate-800">
                    Lunch
                  </div>
                  <div className="px-4 py-4 text-right font-bold text-slate-900">
                    {formatMoney(pricing.lunchPrice)}
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="px-4 py-4 font-semibold text-slate-800">
                    Dinner
                  </div>
                  <div className="px-4 py-4 text-right font-bold text-slate-900">
                    {formatMoney(pricing.dinnerPrice)}
                  </div>
                </div>
              </div>
            </section>
            {/* Extra / Discount */}
            <section className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold text-slate-400">
                  Extra Charge
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatMoney(pricing.extraCharge)}
                </p>
                {pricing.extraReason && (
                  <p className="mt-1 text-sm text-slate-500 break-words">
                    {pricing.extraReason}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold text-slate-400">
                  Discount
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatMoney(pricing.discount)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Type: {pricing.discountType || "—"}
                </p>
              </div>
            </section>
            {/* Actions */}
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate("/customer/dashboard")}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 font-bold text-white"
              >
                <House size={18} /> Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate("/customer/payments")}
                className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-3 font-bold text-slate-700"
              >
                <CreditCard size={18} /> Payment History
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-5 py-3 font-bold text-red-700"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CustomerTiffinPlan;
