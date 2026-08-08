import { useEffect, useState } from "react";
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

import DashboardCard from "../components/DashboardCard";
import RevenueChart from "../components/RevenueChart";
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

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================
  // LOAD DASHBOARD
  // ======================================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response =
        await getDashboardAnalytics();

      setDashboard(response);

      setError("");
    } catch (err) {
      console.error(
        "Dashboard Error:",
        err
      );

      setError(
        "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);
    // ======================================
  // LOADING
  // ======================================

  if (loading) {
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

  if (error) {
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
    subtitle: "Overall Collection",
    growth: "+12%",
  },

  {
    title: "Active Customers",
    value: stats.activeCustomers || 0,
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: <FaUsers />,
    subtitle: "Currently Active",
    growth: "+5%",
  },

  {
    title: "Pending Amount",
    value: `₹${stats.totalPending?.toLocaleString("en-IN") || 0}`,
    color: "text-red-600",
    bg: "bg-red-100",
    icon: <FaClock />,
    subtitle: "Outstanding Payments",
    growth: "-2%",
  },

  {
    title: "Total Customers",
    value: stats.totalCustomers || 0,
    color: "text-purple-600",
    bg: "bg-purple-100",
    icon: <FaUsers />,
    subtitle: "Registered Customers",
    growth: "+8%",
  },

  {
  title: "Today's Collection",
  value: `₹${todayCollection.toLocaleString("en-IN")}`,
  color: "text-emerald-600",
  bg: "bg-emerald-100",
  icon: <FaMoneyBillWave />,
  subtitle: "Today's Received Amount",
  growth: "+18%",
},

{
  title: "Today's Meals",
  value: todayMeals,
  color: "text-orange-600",
  bg: "bg-orange-100",
  icon: <FaUtensils />,
  subtitle: "Meals Delivered Today",
  growth: "+9%",
},
];

  return (
    <div className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Premium Header */}

        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 shadow-xl mb-8">

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">

            <div>

              <h1 className="text-4xl font-bold">
                👋 Welcome Back
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
                🟢 Online
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

        {/* KPI Cards */}

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-6">

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

{/* KPI Cards */}

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-6">
  ...
</div>

{/* Revenue Analytics */}
        
                {/* Revenue Analytics */}

        <div className="mt-8 bg-white rounded-3xl shadow-lg p-6">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-2xl font-bold text-slate-800">
                📈 Revenue Analytics
              </h2>

              <p className="text-gray-500 mt-1">
                Monthly Revenue Overview
              </p>

            </div>

          </div>

          <RevenueChart
            data={revenueChart}
          />

        </div>

        {/* Bottom Widgets */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">

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