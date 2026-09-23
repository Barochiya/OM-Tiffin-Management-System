import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomerBills,
  downloadCustomerBillPdf,
  logoutCustomer,
} from "../services/customerAuthService";

const CustomerBillHistory = () => {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingBillId, setDownloadingBillId] = useState("");
  const [error, setError] = useState("");

  const loadBills = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setRefreshing(true);
        }

        const result = await getCustomerBills();
        setBills(result.data || []);
        setError("");
      } catch (err) {
        console.error("Customer bill history error:", err);

        const status = err?.response?.status;

        if (status === 401 || status === 403) {
          logoutCustomer();
          navigate("/customer-login", { replace: true });
          return;
        }

        setError(
          err?.response?.data?.message ||
            "Unable to load your bill history."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    loadBills({ showLoader: true });
  }, [loadBills]);

  const handleLogout = () => {
    logoutCustomer();
    navigate("/customer-login", { replace: true });
  };

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toFixed(2)}`;
  };

  const formatMonth = (month, year) => {
    if (!month || !year) return "—";

    return new Date(year, month - 1, 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    if (status === "Paid") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "Partial") {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }

    return "bg-red-50 text-red-700 border-red-200";
  };

  const viewBill = (billId) => {
    navigate(`/customer/bills/${billId}`);
  };

  const downloadBill = async (bill) => {
    try {
      setDownloadingBillId(bill._id);
      setError("");

      const response = await downloadCustomerBillPdf(bill._id);

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const invoiceName =
        bill?.invoiceNo || `bill-${bill._id}`;

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
      setDownloadingBillId("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto" />

          <p className="mt-5 text-slate-600 font-medium">
            Loading your bill history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-[76px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new Event("customer-sidebar-open")
                  )
                }
                aria-label="Open customer menu"
                className="lg:hidden w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-lg shrink-0"
              >
                ☰
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/customer/dashboard")
                }
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-lg"
                title="Back to Dashboard"
              >
                ←
              </button>

              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-xl font-bold shadow-inner">
                OM
              </div>

              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                  OM TIFFIN SERVICE
                </h1>

                <p className="text-blue-100 text-xs sm:text-sm">
                  Bill History
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  loadBills({ showLoader: true })
                }
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/15 px-3 sm:px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60"
              >
                <span
                  className={refreshing ? "animate-spin" : ""}
                >
                  ↻
                </span>

                <span className="hidden sm:inline">
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-red-500 hover:bg-red-600 px-3 sm:px-4 py-2.5 text-sm font-semibold transition shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <section className="mb-6">
          <p className="text-xs uppercase tracking-wider font-bold text-blue-600">
            Customer Portal
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                📄 Bill History
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                View your previous tiffin bills, payments and pending amounts.
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">
                Total Bills
              </p>

              <p className="text-xl font-bold text-slate-900 mt-1">
                {bills.length}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {bills.length === 0 ? (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-3xl">
              📄
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-800">
              No bills found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Your bill history will appear here once a bill is generated.
            </p>
          </section>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {bills.map((bill) => {
                const isDownloading =
                  downloadingBillId === bill._id;

                return (
                  <div
                    key={bill._id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
                          Invoice
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {bill.invoiceNo || "—"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          bill.status
                        )}`}
                      >
                        {bill.status || "Pending"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs text-slate-400 font-semibold">
                          Period
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {formatMonth(
                            bill.month,
                            bill.year
                          )}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Cycle {bill.cycle || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs text-blue-500 font-semibold">
                          Total
                        </p>

                        <p className="mt-1 text-lg font-bold text-blue-700">
                          {formatMoney(
                            bill.totalAmount
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                        <p className="text-xs text-emerald-500 font-semibold">
                          Paid
                        </p>

                        <p className="mt-1 font-bold text-emerald-700">
                          {formatMoney(
                            bill.paidAmount
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                        <p className="text-xs text-red-500 font-semibold">
                          Pending
                        </p>

                        <p className="mt-1 font-bold text-red-700">
                          {formatMoney(
                            bill.pendingAmount
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          viewBill(bill._id)
                        }
                        disabled={isDownloading}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 text-sm font-bold transition"
                      >
                        View Bill
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadBill(bill)
                        }
                        disabled={isDownloading}
                        className="rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 text-sm font-bold transition inline-flex items-center justify-center gap-2"
                      >
                        {isDownloading ? (
                          <>
                            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <span>↓</span>
                            Download PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <section className="hidden sm:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <th className="text-left px-5 py-4 font-bold">
                        Invoice
                      </th>

                      <th className="text-left px-4 py-4 font-bold">
                        Period
                      </th>

                      <th className="text-center px-4 py-4 font-bold">
                        Cycle
                      </th>

                      <th className="text-right px-4 py-4 font-bold">
                        Total
                      </th>

                      <th className="text-right px-4 py-4 font-bold">
                        Paid
                      </th>

                      <th className="text-right px-4 py-4 font-bold">
                        Pending
                      </th>

                      <th className="text-center px-4 py-4 font-bold">
                        Status
                      </th>

                      <th className="text-center px-5 py-4 font-bold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {bills.map((bill) => {
                      const isDownloading =
                        downloadingBillId === bill._id;

                      return (
                        <tr
                          key={bill._id}
                          className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition"
                        >
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-800">
                              {bill.invoiceNo || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-700">
                              {formatMonth(
                                bill.month,
                                bill.year
                              )}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                              {bill.cycle || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right font-semibold text-slate-800">
                            {formatMoney(
                              bill.totalAmount
                            )}
                          </td>

                          <td className="px-4 py-4 text-right font-semibold text-emerald-700">
                            {formatMoney(
                              bill.paidAmount
                            )}
                          </td>

                          <td className="px-4 py-4 text-right font-semibold text-red-700">
                            {formatMoney(
                              bill.pendingAmount
                            )}
                          </td>

                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                bill.status
                              )}`}
                            >
                              {bill.status || "Pending"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  viewBill(
                                    bill._id
                                  )
                                }
                                disabled={isDownloading}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 text-sm font-bold transition"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  downloadBill(bill)
                                }
                                disabled={isDownloading}
                                className="rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 text-sm font-bold transition inline-flex items-center gap-2"
                              >
                                {isDownloading ? (
                                  <>
                                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    Downloading
                                  </>
                                ) : (
                                  <>
                                    <span>↓</span>
                                    PDF
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default CustomerBillHistory;
