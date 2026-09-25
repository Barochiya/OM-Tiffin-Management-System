import { House, CreditCard, LogOut, Megaphone, Inbox, MessageCircle, FileText, Download, ChartColumn, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomerPayments,
  logoutCustomer,
} from "../services/customerAuthService";
const CustomerPaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loadPayments = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setRefreshing(true);
        }
        const result = await getCustomerPayments();
        setPayments(result.data || []);
        setError("");
      } catch (err) {
        console.error("Customer payment history error:", err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          logoutCustomer();
          navigate("/customer-login", { replace: true });
          return;
        }
        setError(
          err?.response?.data?.message ||
            "Unable to load your payment history."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );
  useEffect(() => {
    loadPayments({ showLoader: true });
  }, [loadPayments]);
  const formatMoney = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };
  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const getStatusClass = (status) => {
    if (status === "Success") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (status === "Pending") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-red-50 text-red-700 border-red-200";
  };
  const getPaymentMethodLabel = (payment) => {
    return payment?.paymentMethod || payment?.gateway || "—";
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
            Loading your payment history...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-6 sm:px-8 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  OM Tiffin Customer Portal
                </p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                  Payment History
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  View your previous payments and payment details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadPayments({ showLoader: true })}
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
            {payments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
                <CreditCard className="text-blue-600" size={40} />
                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  No Payment History
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  No payments are available for your account yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Payment Date
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          {formatDate(payment.paymentDate)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <p className="text-xl font-bold text-blue-600">
                          {formatMoney(payment.amount)}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                            payment.status
                          )}`}
                        >
                          {payment.status || "Unknown"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <p className="text-xs font-medium text-slate-400">
                          Payment Method
                        </p>
                        <p className="mt-1 font-semibold text-slate-800 break-words">
                          {getPaymentMethodLabel(payment)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <p className="text-xs font-medium text-slate-400">
                          Bill
                        </p>
                        <p className="mt-1 font-semibold text-slate-800 break-words">
                          {payment?.bill?.invoiceNo || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <p className="text-xs font-medium text-slate-400">
                          Transaction ID
                        </p>
                        <p className="mt-1 font-semibold text-slate-800 break-all">
                          {payment.transactionId || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <p className="text-xs font-medium text-slate-400">
                          Payment Time
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          {formatDateTime(payment.paymentDate)}
                        </p>
                      </div>
                    </div>
                    {payment.note && (
                      <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs font-medium text-blue-500">
                          Note
                        </p>
                        <p className="mt-1 text-sm font-medium text-blue-900 break-words">
                          {payment.note}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate("/customer/bills")}
                className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-3 font-bold text-slate-700"
              >
                ← Bill History
              </button>
              <button
                type="button"
                onClick={() => navigate("/customer/dashboard")}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 font-bold text-white"
              >
                <House size={18} /> Dashboard
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
export default CustomerPaymentHistory;
