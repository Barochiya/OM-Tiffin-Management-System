import { Hand, CircleCheck, TrendingUp } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaWallet,
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
  downloadFinancialReportPdf,
} from "../services/dashboardService";

export default function Dashboard() {
  // ======================================
  // STATES
  // ======================================

  const [exporting, setExporting] = useState(false);
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const [cycle, setCycle] = useState('all');
  const requestVersion = useRef(0);
  const foregroundLoading = useRef(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================
  // LOAD DASHBOARD
  // ======================================

  const loadDashboard = useCallback(async (options = {}) => {
    const quiet = options?.quiet === true;
    if (quiet && foregroundLoading.current) return;
    const version = ++requestVersion.current;
    try {
      if (!quiet) { foregroundLoading.current = true; setLoading(true); }

      const response =
        await getDashboardAnalytics({ year, month, cycle });
      if(version !== requestVersion.current) return;

      setDashboard(response);

      if (!quiet) setError("");
    } catch (err) {
      if(version !== requestVersion.current) return;
      console.error(
        "Dashboard Error:",
        err
      );

      if (!quiet) setError(
        err.code === "ECONNABORTED" ? "Unable to load dashboard. The server is taking longer than usual. Your tools are still available; tap Retry." : "Unable to load dashboard."
      );
    } finally {
      if(version === requestVersion.current && !quiet) { foregroundLoading.current = false; setLoading(false); }
    }
  }, [year, month, cycle]);

  const exportFinancialReport = async () => {
    setExporting(true);
    try {
      const response = await downloadFinancialReportPdf({ year, month, cycle });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url;
      link.download = "om-tiffin-financial-report-" + year + "-" + month + "-" + cycle + ".pdf";
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || "Unable to download financial report"); }
    finally { setExporting(false); }
  };
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  useEffect(() => {
    let running = false;
    const refresh = async () => {
      if (document.hidden || running) return;
      running = true;
      try { await loadDashboard({ quiet: true }); } finally { running = false; }
    };
    const timer = setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
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
  subtitle: <>Meals Recorded Today<span data-dashboard-meal-value={Number(dashboard?.todayMealAmount ?? 0)} className="block mt-2 text-lg font-bold text-orange-600">₹{Number(dashboard?.todayMealAmount ?? 0).toLocaleString("en-IN", {maximumFractionDigits: 2})}<span className="ml-1 text-xs font-normal text-slate-500">Today’s meal value</span></span></>,
  growth: dashboard?.growth?.meals,
},
];

const formatAmount = amount => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(amount || 0);
const finance = dashboard?.financialSummary;
const financialCards = finance ? [
  {title:'Collection / Received payments', key:'directCollections', color:'text-blue-600', bg:'bg-blue-100', icon:<FaMoneyBillWave />, note:"Today's total collection (all receipts): " + formatAmount(todayCollection)},
  {title:'Approved wallet funding', key:'approvedWalletFunding', color:'text-emerald-600', bg:'bg-emerald-100', icon:<FaWallet />, note:'Wallet advances; excluded from revenue'},
  {title:'Wallet applied to invoices', key:'walletApplied', color:'text-indigo-600', bg:'bg-indigo-100', icon:<FaFileInvoice />, note:'Wallet funding allocated to invoices'},
  {title:'Excess credited to wallets', key:'excessWalletCredits', color:'text-purple-600', bg:'bg-purple-100', icon:<FaPlus />, note:'Excess receipts; excluded from revenue'},
  {title:'Current net wallet balance', key:'currentWalletNet', color:Number(finance.currentWalletNet || 0)<0?'text-red-600':'text-teal-600', bg:Number(finance.currentWalletNet || 0)<0?'bg-red-100':'bg-teal-100', icon:<FaWallet />, note:'Current credit less outstanding across wallets'},
].map(({key,note,...card}) => ({...card,value:formatAmount(finance[key]),subtitle:key==='currentWalletNet'?'Current balance · All customers':(key==='directCollections'?'Direct payments · ':'')+(dashboard?.period?.label || 'Selected period'),growth:{percent:null,label:note}})) : [];
const displayedCards = finance ? [
  cards[0], financialCards[0], cards[2],
  {...cards[1],title:'Total Customers / Active',value:String(stats.totalCustomers || 0)+' / '+String(stats.activeCustomers || 0),subtitle:'Registered customers / Currently active'},
  ...financialCards.slice(1), cards[5],
] : cards;

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
  <div className="mr-auto"><h2 className="font-bold text-slate-900">Revenue reporting</h2><p className="mt-1 text-sm text-slate-500">Gross invoices by generation date and cycle · Collections by payment date</p></div>
  <label className="text-sm font-semibold text-slate-600">Year<select aria-label="Revenue year" className="mt-2 block rounded-xl border border-slate-200 bg-white px-4 py-2.5" value={year} onChange={event=>{setYear(event.target.value);setMonth('all');}}><option value="all">All time</option>{(dashboard?.availableYears || [new Date().getFullYear()]).map(value=><option key={value} value={value}>{value}</option>)}</select></label>
  <label className="text-sm font-semibold text-slate-600">Month<select aria-label="Revenue month" disabled={year==='all'} className="mt-2 block rounded-xl border border-slate-200 bg-white px-4 py-2.5 disabled:opacity-50" value={month} onChange={event=>setMonth(event.target.value)}><option value="all">Whole year</option>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name,index)=><option key={name} value={index+1}>{name}</option>)}</select></label>
  <label className="text-sm font-semibold text-slate-600">Cycle<select aria-label="Revenue cycle" className="mt-2 block rounded-xl border border-slate-200 bg-white px-4 py-2.5" value={cycle} onChange={event=>setCycle(event.target.value)}><option value="all">Both cycles</option><option value="1">Cycle 1 (1–15)</option><option value="2">Cycle 2 (16–End)</option></select></label>
  <button type="button" disabled={loading} onClick={loadDashboard} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading?'Updating…':'Refresh'}</button>
  <button type="button" disabled={exporting || (cycle !== 'all' && month === 'all')} onClick={exportFinancialReport} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 disabled:opacity-50">{exporting ? 'Preparing…' : 'Download financial report (PDF)'}</button>
  {cycle !== 'all' && month === 'all' && <p className="w-full text-xs text-slate-500">Select a month to download a half-month reconciliation report.</p>}
  {dashboard?.undatedInvoices > 0 && <p className="w-full text-sm text-amber-700">{dashboard.undatedInvoices} historical invoices need a verified generation date before revenue can be assigned to a period.</p>}
  {dashboard?.unassignedPayments?.count > 0 && <p className="w-full text-sm text-amber-700">₹{Number(dashboard.unassignedPayments.amount).toLocaleString("en-IN")} across {dashboard.unassignedPayments.count} payments have no valid bill link. Review these collections for reconciliation.</p>}
  {error && <p role="alert" className="w-full text-sm text-red-600">{error} Showing the last loaded report.</p>}
  {loading && <p role="status" className="w-full text-sm text-slate-500">Updating report…</p>}
</section>
{/* KPI Cards */}

<div aria-label="Dashboard metrics" className="dashboard-kpis grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

  {displayedCards.map((card) => (
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