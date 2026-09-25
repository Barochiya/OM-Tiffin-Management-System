import { House, CreditCard, LogOut, Megaphone, Inbox, MessageCircle, FileText, Download, ChartColumn, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCustomerBillById,
  downloadCustomerBillPdf,
  logoutCustomer,
} from "../services/customerAuthService";
const CustomerBillDetail = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const loadBill = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getCustomerBillById(billId);
      setBill(result.data || null);
    } catch (err) {
      console.error("Customer bill detail error:", err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        logoutCustomer();
        navigate("/customer-login", { replace: true });
        return;
      }
      setError(
        err?.response?.data?.message ||
          "Unable to load this bill."
      );
    } finally {
      setLoading(false);
    }
  }, [billId, navigate]);
  useEffect(() => {
    loadBill();
  }, [loadBill]);
  const handleLogout = () => {
    logoutCustomer();
    navigate("/customer-login", { replace: true });
  };
  const formatMoney = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };
  const formatMonth = (month, year) => {
    if (!month || !year) return "—";
    return new Date(year, month - 1, 1).toLocaleString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );
  };
  const downloadBill = async () => {
    try {
      setDownloading(true);
      setError("");
      const response = await downloadCustomerBillPdf(billId);
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const invoiceName =
        bill?.invoiceNo || `bill-${billId}`;
      link.href = url;
      link.download = `OM-Tiffin-${invoiceName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Customer bill PDF download error:", err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        logoutCustomer();
        navigate("/customer-login", { replace: true });
        return;
      }
      setError(
        err?.response?.data?.message ||
          "Unable to download this bill."
      );
    } finally {
      setDownloading(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto" />
          <p className="mt-5 text-slate-600 font-medium">
            Loading bill...
          </p>
        </div>
      </div>
    );
  }
  if (!bill) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/customer/bills")}
              className="rounded-xl bg-white/15 hover:bg-white/25 px-4 py-2 font-semibold"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2 font-semibold"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-3xl border border-red-200 shadow-sm p-8 text-center">
            <FileText className="text-blue-600" size={40} />
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Bill Not Found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {error || "The requested bill could not be loaded."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/customer/bills")}
              className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-bold"
            >
              Back to Bill History
            </button>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("customer-sidebar-open"))}
                aria-label="Open customer menu"
                className="lg:hidden w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-lg shrink-0"
              >
                ☰
              </button>
              <button
                type="button"
                onClick={() => navigate("/customer/bills")}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-lg"
                title="Back to Bill History"
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-bold">
                OM
              </div>
              <div className="min-w-0">
                <h1 className="font-bold truncate">
                  OM TIFFIN SERVICE
                </h1>
                <p className="text-xs text-blue-100">
                  Bill Details
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-red-500 hover:bg-red-600 px-3 sm:px-4 py-2 text-sm font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-7 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-blue-600">
                  Customer Portal
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  Bill Details
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Invoice:{" "}
                  <span className="font-bold text-slate-700">
                    {bill.invoiceNo || "—"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={downloadBill}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-3 font-bold shadow-sm"
              >
                <Download size={20} />
                {downloading
                  ? "Downloading..."
                  : "Download Bill"}
              </button>
            </div>
          </div>
          <div className="p-5 sm:p-7">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs text-slate-400 font-semibold">
                  Period
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {formatMonth(bill.month, bill.year)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs text-slate-400 font-semibold">
                  Cycle
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {bill.cycle || "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-xs text-blue-500 font-semibold">
                  Total
                </p>
                <p className="mt-1 text-xl font-bold text-blue-700">
                  {formatMoney(bill.totalAmount)}
                </p>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  bill.status === "Paid"
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-amber-50 border-amber-100"
                }`}
              >
                <p className="text-xs text-slate-500 font-semibold">
                  Status
                </p>
                <p
                  className={`mt-1 font-bold ${
                    bill.status === "Paid"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {bill.status || "Pending"}
                </p>
              </div>
            </div>
            <section className="mt-7">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Payment Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs text-blue-500 font-semibold">
                    Total Amount
                  </p>
                  <p className="mt-1 text-xl font-bold text-blue-700">
                    {formatMoney(bill.totalAmount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-xs text-emerald-500 font-semibold">
                    Paid Amount
                  </p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {formatMoney(bill.paidAmount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
                  <p className="text-xs text-red-500 font-semibold">
                    Pending Amount
                  </p>
                  <p className="mt-1 text-xl font-bold text-red-700">
                    {formatMoney(bill.pendingAmount)}
                  </p>
                </div>
              </div>
            </section>
            <section className="mt-7">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Meal Summary
              </h3>
              <div className="w-full overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full table-fixed text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="w-[45%] text-left px-2 sm:px-4 py-3 font-bold text-slate-600">
                        Meal
                      </th>
                      <th className="w-[25%] text-center px-2 sm:px-4 py-3 font-bold text-slate-600">
                        Quantity
                      </th>
                      <th className="w-[30%] text-right px-2 sm:px-4 py-3 font-bold text-slate-600">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="px-2 sm:px-4 py-3 font-semibold">
                        Breakfast
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center">
                        {bill.breakfastQty || 0}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right font-semibold">
                        {formatMoney(bill.breakfastAmount)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-2 sm:px-4 py-3 font-semibold">
                        Lunch
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center">
                        {bill.lunchQty || 0}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right font-semibold">
                        {formatMoney(bill.lunchAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 sm:px-4 py-3 font-semibold">
                        Dinner
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center">
                        {bill.dinnerQty || 0}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right font-semibold">
                        {formatMoney(bill.dinnerAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/customer/bills")}
                className="flex-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 font-bold"
              >
                ← Back to Bill History
              </button>
              <button
                type="button"
                onClick={downloadBill}
                disabled={downloading}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-3 font-bold"
              >
                <Download size={18} /> {downloading ? "Downloading..." : "Download Bill"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default CustomerBillDetail;


