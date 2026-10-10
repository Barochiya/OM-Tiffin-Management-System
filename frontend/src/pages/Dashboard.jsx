import { Hand, CircleCheck, TrendingUp } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaUsers,
  FaClock,
  FaUtensils,
  FaPlus,
  FaFileInvoice,
  FaBullhorn,
} from "react-icons/fa";

import GrowthBadge from "../components/GrowthBadge";
import DashboardCard from "../components/DashboardCard";
const RevenueChart = lazy(() => import("../components/RevenueChart"));
import RecentPayments from "../components/RecentPayments";
import PendingBills from "../components/PendingBills";
import TopCustomers from "../components/TopCustomers";

import {
  getDashboardAnalytics,
} from "../services/dashboardService";

export default function Dashboard() {
  // ======================================
  // STATES
  // ======================================

  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const requestVersion = useRef(0);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================
  // LOAD DASHBOARD
  // ======================================

  const loadDashboard = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      setLoading(true);

      const response =
        await getDashboardAnalytics({ year, month });
      if(version !== requestVersion.current) return;

      setDashboard(response);

      setError("");
    } catch (err) {
      if(version !== requestVersion.current) return;
      console.error(
        "Dashboard Error:",
        err
      );

      setError(
        err.code === "ECONNABORTED" ? "Unable to load dashboard. The server is taking longer than usual. Your tools are still available; tap Retry." : "Unable to load dashboard."
      );
    } finally {
      if(version === requestVersion.current) setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useEffect(() => { const version = requestVersion; return () => { version.current++; }; }, []);
    // ======================================
  // LOADING
  // ======================================

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>

          <h2 className="text-2xl font-bold text-slate-700">
            Loading Dashboard...
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait while we fetch your latest data.
          </p>

        </div>
      </div>
    );
  }

  // ======================================
  // ERROR
  // ======================================

  if (error && !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">

        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md">

          <h2 className="text-3xl mb-3">⚠️</h2>

          <h2 className="text-2xl font-bold text-red-600">
            Dashboard Error
          </h2>

          <p className="text-gray-500 mt-3">
            {error}
          </p>

          <button
            onClick={loadDashboard}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
          >
            Retry
          </button>

        </div>

      </div>
    );
  }

  // ======================================
  // DASHBOARD DATA
  // ======================================

  const stats = dashboard?.stats || {};

  const recentPayments =
    dashboard?.recentPayments || [];

  const pendingBills =
    dashboard?.pendingBills || [];

  const topCustomers =
    dashboard?.topCustomers || [];

  const revenueChart =
    dashboard?.revenueChart || [];

    // ======================================
// TODAY ANALYTICS
// ======================================

const todayCollection =
  dashboard?.todayCollection ?? 0;

const todayMeals =
  dashboard?.todayMeals ?? 0;
      // ======================================
  // KPI CARDS
  // ======================================

  const cards = [
  {
    title: "Total Revenue",
    value: `₹${stats.totalRevenue?.toLocaleString("en-IN") || 0}`,
    color: "text-green-600",
    bg: "bg-green-100",
    icon: <FaMoneyBillWave />,
    subtitle: dashboard?.period?.label || "All time",
    growth: dashboard?.growth?.revenue,
  },

  {
    title: "Active Customers",
    value: stats.activeCustomers || 0,
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: <FaUsers />,
    subtitle: "Currently Active",
    growth: dashboard?.growth?.active,
  },

  {
    title: "Pending Amount",
    value: `₹${stats.totalPending?.toLocaleString("en-IN") || 0}`,
    color: "text-red-600",
    bg: "bg-red-100",
    icon: <FaClock />,
    subtitle: "Outstanding Payments",
    growth: dashboard?.growth?.pending,
  },

  {
    title: "Total Customers",
    value: stats.totalCustomers || 0,
    color: "text-purple-600",
    bg: "bg-purple-100",
    icon: <FaUsers />,
    subtitle: "Registered Customers",
    growth: dashboard?.growth?.customers,
  },

  {
  title: "Today's Collection",
  value: `₹${todayCollection.toLocaleString("en-IN")}`,
  color: "text-emerald-600",
  bg: "bg-emerald-100",
  icon: <FaMoneyBillWave />,
  subtitle: "Today's Received Amount",
  growth: dashboard?.growth?.collection,
},

{
  title: "Today's Meals",
  value: todayMeals,
  color: "text-orange-600",
  bg: "bg-orange-100",
  icon: <FaUtensils />,
  subtitle: "Meals Recorded Today",
  growth: dashboard?.growth?.meals,
},
];

  return (
    <div className="dashboard-page min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Premium Header */}

        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 shadow-xl mb-8">

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">

            <div>

              <h1 className="text-4xl font-bold">
                <Hand size={20} /> Welcome Back
              </h1>

              <p className="mt-2 text-blue-100 text-lg">
                OM Tiffin Management System
              </p>

              <p className="text-sm text-blue-200 mt-2">
                Manage Customers, Billing, Payments & Analytics
              </p>

            </div>

            <div className="mt-6 lg:mt-0 bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-5">

              <p className="text-sm text-blue-100">
                System Status
              </p>

              <h3 className="text-2xl font-bold text-green-300 mt-1">
                <CircleCheck size={18} /> Online
              </h3>

              <p className="text-sm text-blue-100 mt-2">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>

            </div>

          </div>

        </div>

{/* Reporting controls */}
<section aria-label="Revenue filters" className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5">
  <div className="mr-auto"><h2 className="font-bold text-slate-900">Revenue reporting</h2><p className="mt-1 text-sm text-slate-500">Successful payments · India time · current customer counts and balances</p></div>
  <label className="text-sm font-semibold text-slate-600">Year<select aria-label="Revenue year" className="mt-2 block rounded-xl border border-slate-200 bg-white px-4 py-2.5" value={year} onChange={event=>{setYear(event.target.value);setMonth('all');}}><option value="all">All time</option>{(dashboard?.availableYears || [new Date().getFullYear()]).map(value=><option key={value} value={value}>{value}</option>)}</select></label>
  <label className="text-sm font-semibold text-slate-600">Month<select aria-label="Revenue month" disabled={year==='all'} className="mt-2 block rounded-xl border border-slate-200 bg-white px-4 py-2.5 disabled:opacity-50" value={month} onChange={event=>setMonth(event.target.value)}><option value="all">Whole year</option>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name,index)=><option key={name} value={index+1}>{name}</option>)}</select></label>
  <button type="button" disabled={loading} onClick={loadDashboard} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading?'Updating…':'Refresh'}</button>
  {error && <p role="alert" className="w-full text-sm text-red-600">{error} Showing the last loaded report.</p>}
  {loading && <p role="status" className="w-full text-sm text-slate-500">Updating report…</p>}
</section>
{/* KPI Cards */}

<div className="dashboard-kpis grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-6">

  {cards.map((card) => (
    <DashboardCard
      key={card.title}
      title={card.title}
      value={card.value}
      color={card.color}
      bg={card.bg}
      icon={card.icon}
      subtitle={card.subtitle}
      growth={card.growth}
    />
  ))}

</div>

{/* Quick Actions */}

<div className="mt-8 bg-white rounded-3xl shadow-lg p-6">

  <div className="flex items-center justify-between mb-6">

    <div>
      <h2 className="text-2xl font-bold text-slate-800">
        ⚡ Quick Actions
      </h2>

      <p className="text-gray-500 mt-1">
        Frequently used shortcuts
      </p>
    </div>

  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

    <Link
      to="/customers"
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 text-center transition-all duration-300 hover:scale-105"
    >
      <FaPlus className="mx-auto text-3xl mb-3" />
      <h3 className="font-semibold">
        Add Customer
      </h3>
    </Link>

    <Link
      to="/payments"
      className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-5 text-center transition-all duration-300 hover:scale-105"
    >
      <FaMoneyBillWave className="mx-auto text-3xl mb-3" />
      <h3 className="font-semibold">
        New Payment
      </h3>
    </Link>

    <Link
      to="/billing"
      className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl p-5 text-center transition-all duration-300 hover:scale-105"
    >
      <FaFileInvoice className="mx-auto text-3xl mb-3" />
      <h3 className="font-semibold">
        Generate Bill
      </h3>
    </Link>

    <Link
      to="/announcement"
      className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-5 text-center transition-all duration-300 hover:scale-105 min-w-0"
    >
      <FaBullhorn className="mx-auto text-3xl mb-3" />
      <h3 className="font-semibold break-words leading-6">Announcement</h3>
    </Link>

  </div>

</div>
        
                {/* Revenue Analytics */}

        <div className="mt-8 bg-white rounded-3xl shadow-lg p-6">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-2xl font-bold text-slate-800">
                <TrendingUp size={20} /> Revenue Analytics
              </h2>

              <p className="text-gray-500 mt-1">
                Monthly revenue · {dashboard?.period?.chartYear || new Date().getFullYear()}
              </p>

            </div>

          </div>

          <Suspense fallback={<div role="status" className="h-64 rounded-xl bg-slate-50 p-5 text-slate-500">Loading chart...</div>}><RevenueChart data={revenueChart} /></Suspense>
          <p className="mt-3 text-xs text-slate-500">Growth compares each calendar month with the previous month. The current month is partial; future months have no comparison.</p>
          <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-3">Month</th><th className="py-3">Collection</th><th className="py-3">Monthly growth</th></tr></thead><tbody>{revenueChart.map(row=><tr key={row.month} className="border-b border-slate-100"><td className="py-3 font-medium">{row.month}</td><td>₹{row.revenue.toLocaleString('en-IN')}</td><td className="pb-3"><GrowthBadge growth={row.growth}/></td></tr>)}</tbody></table></div>

        </div>

        {/* Bottom Widgets */}

        <div className="dashboard-widgets grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">

          {/* Recent Payments */}

          <div className="bg-white rounded-3xl shadow-lg p-6">

            <RecentPayments
              data={recentPayments}
            />

          </div>

          {/* Pending Bills */}

          <div className="bg-white rounded-3xl shadow-lg p-6">

            <PendingBills
              data={pendingBills}
            />

          </div>

          {/* Top Customers */}

          <div className="bg-white rounded-3xl shadow-lg p-6">

            <TopCustomers
              data={topCustomers}
            />

          </div>

        </div>

      </div>

    </div>

  );
}