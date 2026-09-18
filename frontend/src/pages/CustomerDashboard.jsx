import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomerMealHistory,
  getCustomerProfile,
  logoutCustomer,
} from "../services/customerAuthService";
import useCustomerAutoRefresh from "../customer/hooks/useCustomerAutoRefresh";
import CustomerModificationRequest from "../customer/components/CustomerModificationRequest";
const CustomerDashboard = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [cycle, setCycle] = useState(now.getDate() <= 15 ? "1" : "2");
  const [mealHistory, setMealHistory] = useState([]);
  const [mealLoading, setMealLoading] = useState(true);
  const [mealError, setMealError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const monthName = useMemo(
    () =>
      new Date(year, month - 1, 1).toLocaleString("en-IN", {
        month: "long",
      }),
    [month, year]
  );
  const loadDashboard = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setRefreshing(true);
        }
        const [profileResult, mealResult] = await Promise.all([
          getCustomerProfile(),
          getCustomerMealHistory(month, year, cycle),
        ]);
        setCustomer(profileResult.customer || profileResult);
        setMealHistory(mealResult.data || []);
        setMealError("");
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Customer dashboard error:", error);
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          logoutCustomer();
          navigate("/customer-login", { replace: true });
          return;
        }
        setMealError(
          error?.response?.data?.message ||
            "Unable to refresh customer dashboard."
        );
      } finally {
        setLoading(false);
        setMealLoading(false);
        setRefreshing(false);
      }
    },
    [month, year, cycle, navigate]
  );
  useEffect(() => {
    loadDashboard({ showLoader: true });
  }, [loadDashboard]);
  useCustomerAutoRefresh(() => {
    loadDashboard();
  });
  const handleManualRefresh = async () => {
    await loadDashboard({ showLoader: true });
  };
  const handleLogout = () => {
    logoutCustomer();
    navigate("/customer-login", { replace: true });
  };
  const totals = useMemo(() => {
    return mealHistory.reduce(
      (result, entry) => {
        result.breakfast += Number(entry.breakfastQty || 0);
        result.lunch += Number(entry.lunchQty || 0);
        result.dinner += Number(entry.dinnerQty || 0);
        return result;
      },
      { breakfast: 0, lunch: 0, dinner: 0 }
    );
  }, [mealHistory]);
  const totalMeals = totals.breakfast + totals.lunch + totals.dinner;
  const formatDate = (dateValue) => {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const formatUpdatedTime = () => {
    if (!lastUpdated) return "Not updated yet";
    return lastUpdated.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto" />
          <p className="mt-5 text-slate-600 font-medium">
            Loading your customer portal...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-[76px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-xl font-bold shadow-inner">
                OM
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                  OM TIFFIN SERVICE
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm">
                  Customer Portal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/15 px-3 sm:px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60"
              >
                <span className={refreshing ? "animate-spin" : ""}>↻</span>
                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing..." : "Refresh"}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-blue-50 border border-slate-200 shadow-sm">
          <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-blue-100/60 blur-2xl" />
          <div className="relative p-5 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Customer Portal
                </div>
                <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
                  Welcome, {customer?.customerName || "Customer"}
                </h2>
                <p className="mt-2 text-slate-500">
                  Manage your tiffin service and view your meal records.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    ID: {customer?.barcode || "—"}
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700">
                    {customer?.mealType || "Meal Type —"}
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                    {customer?.status || "Active"}
                  </span>
                </div>
              </div>
              <div className="w-full lg:w-auto lg:min-w-[230px] rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Current Billing Cycle
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {cycle === "1" ? "1st – 15th" : "16th – End"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {monthName} {year}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
                  Phone
                </p>
                <p className="mt-1 font-semibold text-slate-800 break-all">
                  {customer?.phone || "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
                  Address
                </p>
                <p className="mt-1 font-semibold text-slate-800 whitespace-pre-line">
                  {customer?.address || "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
                  Last Updated
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {formatUpdatedTime()}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Auto refresh: every 5 minutes
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Meal Summary */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-blue-600">
                Overview
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Meal Summary
              </h3>
            </div>
            <div className="hidden sm:block text-sm text-slate-400">
              {mealHistory.length} recorded day
              {mealHistory.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <p className="text-sm font-medium text-slate-500">
                Total Meals
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                {totalMeals}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                All meal quantities
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <p className="text-sm font-medium text-slate-500">
                Breakfast
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                {totals.breakfast}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Quantity served
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <p className="text-sm font-medium text-slate-500">
                Lunch
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                {totals.lunch}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Quantity served
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <p className="text-sm font-medium text-slate-500">
                Dinner
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                {totals.dinner}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Quantity served
              </p>
            </div>
          </div>
        </section>
        <CustomerModificationRequest />      {/* Meal History */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-blue-600">
                  Records
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Meal History
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {monthName} {year} · Cycle {cycle}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full xl:w-auto">
                <select
                  value={month}
                  onChange={(event) =>
                    setMonth(Number(event.target.value))
                  }
                  className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {Array.from({ length: 12 }, (_, index) => {
                    const monthNumber = index + 1;
                    return (
                      <option key={monthNumber} value={monthNumber}>
                        {new Date(2000, index, 1).toLocaleString("en-IN", {
                          month: "short",
                        })}
                      </option>
                    );
                  })}
                </select>
                <select
                  value={year}
                  onChange={(event) =>
                    setYear(Number(event.target.value))
                  }
                  className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {[year - 1, year, year + 1].map((yearValue) => (
                    <option key={yearValue} value={yearValue}>
                      {yearValue}
                    </option>
                  ))}
                </select>
                <select
                  value={cycle}
                  onChange={(event) => setCycle(event.target.value)}
                  className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="1">1–15</option>
                  <option value="2">16–End</option>
                </select>
              </div>
            </div>
          </div>
          {mealError && (
            <div className="mx-5 sm:mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {mealError}
            </div>
          )}
          {mealLoading ? (
            <div className="py-14 text-center">
              <div className="w-8 h-8 rounded-full border-3 border-blue-100 border-t-blue-600 animate-spin mx-auto" />
              <p className="mt-3 text-sm text-slate-500">
                Loading meal history...
              </p>
            </div>
          ) : mealHistory.length === 0 ? (
            <div className="py-14 px-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-2xl">
                🍱
              </div>
              <p className="mt-4 font-semibold text-slate-700">
                No meal entries found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Try another month or billing cycle.
              </p>
            </div>
          ) : (
            <>
              <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-100">
                <p className="text-xs sm:text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-700">
                    {mealHistory.length}
                  </span>{" "}
                  meal record{mealHistory.length === 1 ? "" : "s"}
                </p>
              </div>
              {/* Mobile Meal Cards */}
              <div className="sm:hidden divide-y divide-slate-100">
                {mealHistory.map((entry) => (
                  <div
                    key={`mobile-${entry._id || entry.date}`}
                    className="p-4 bg-white"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide font-bold text-slate-400">
                          Meal Date
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        Recorded
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                        <p className="text-xs font-semibold text-slate-400">
                          Breakfast
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-800">
                          {Number(entry.breakfastQty || 0)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                        <p className="text-xs font-semibold text-blue-500">
                          Lunch
                        </p>
                        <p className="mt-1 text-lg font-bold text-blue-700">
                          {Number(entry.lunchQty || 0)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-center">
                        <p className="text-xs font-semibold text-indigo-500">
                          Dinner
                        </p>
                        <p className="mt-1 text-lg font-bold text-indigo-700">
                          {Number(entry.dinnerQty || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mt-3">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                        <p className="text-xs font-semibold text-slate-400">
                          Extra Items
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {entry.extraItems?.length
                            ? entry.extraItems
                                .map(
                                  (item) =>
                                    `${item.description} (${item.amount})`
                                )
                                .join(", ")
                            : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                        <p className="text-xs font-semibold text-slate-400">
                          Remark
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {entry.remark || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <th className="text-left px-5 sm:px-6 py-4 font-bold">
                        Date
                      </th>
                      <th className="text-center px-4 py-4 font-bold">
                        Breakfast
                      </th>
                      <th className="text-center px-4 py-4 font-bold">
                        Lunch
                      </th>
                      <th className="text-center px-4 py-4 font-bold">
                        Dinner
                      </th>
                      <th className="text-left px-4 py-4 font-bold">
                        Extra Items
                      </th>
                      <th className="text-left px-4 py-4 font-bold">
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mealHistory.map((entry) => (
                      <tr
                        key={entry._id || entry.date}
                        className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition"
                      >
                        <td className="px-5 sm:px-6 py-4">
                          <span className="font-semibold text-slate-800">
                            {formatDate(entry.date)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex min-w-9 justify-center rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                            {Number(entry.breakfastQty || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex min-w-9 justify-center rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                            {Number(entry.lunchQty || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex min-w-9 justify-center rounded-lg bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
                            {Number(entry.dinnerQty || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {entry.extraItems?.length
                            ? entry.extraItems
                                .map(
                                  (item) =>
                                    `${item.description} (${item.amount})`
                                )
                                .join(", ")
                            : "—"}
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {entry.remark || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-slate-400">
                  Billing period: {cycle === "1" ? "1st–15th" : "16th–End"}
                </p>
                <p className="text-xs text-slate-400">
                  Last updated: {formatUpdatedTime()}
                </p>
              </div>
            </>
          )}
        </section>
        {/* Footer Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 pb-3">
          <p className="text-xs text-slate-400">
            OM Tiffin Service · Customer Portal
          </p>
          <p className="inline-flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Auto refresh enabled · Every 5 minutes
          </p>
        </div>
      </main>
    </div>
  );
};
export default CustomerDashboard;




