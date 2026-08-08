import { useEffect, useState } from "react";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaUsers,
  FaUtensils,
  FaClock,
  FaWallet,
} from "react-icons/fa";

import DashboardCard from "../components/DashboardCard";
import RevenueChart from "../components/RevenueChart";
import RecentPayments from "../components/RecentPayments";
import PendingBills from "../components/PendingBills";
import TopCustomers from "../components/TopCustomers";

import { getDashboardAnalytics } from "../services/dashboardService";

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

      const data = await getDashboardAnalytics();

      setDashboard(data);

      setError("");
    } catch (err) {
      console.error(err);

      setError("Unable to load dashboard.");
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
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-2xl font-bold text-slate-700">
            Loading Dashboard...
          </h2>
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
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-2xl font-bold text-red-600">
            {error}
          </h2>
        </div>
      </div>
    );
  }

  // ======================================
  // API DATA
  // ======================================

  const stats = dashboard?.stats || {};

  const recentPayments =
    dashboard?.recentPayments || [];

  const pendingBills =
    dashboard?.pendingBills || [];

  const topCustomers =
    dashboard?.topCustomers || [];

  const cards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue || 0}`,
      color: "text-green-600",
      bg: "bg-green-100",
      icon: <FaMoneyBillWave />,
    },

    {
      title: "Active Customers",
      value: stats.activeCustomers || 0,
      color: "text-blue-600",
      bg: "bg-blue-100",
      icon: <FaUsers />,
    },

    {
      title: "Pending Amount",
      value: `₹${stats.totalPending || 0}`,
      color: "text-red-600",
      bg: "bg-red-100",
      icon: <FaClock />,
    },

    {
      title: "Total Customers",
      value: stats.totalCustomers || 0,
      color: "text-purple-600",
      bg: "bg-purple-100",
      icon: <FaUsers />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">

          <div>

            <h1 className="text-4xl font-bold text-slate-800">

              📊 Dashboard

            </h1>

            <p className="text-gray-500 mt-2">

              Welcome to OM Tiffin Management System

            </p>

          </div>

          <div className="mt-6 lg:mt-0">

            <div className="bg-white rounded-2xl shadow-lg px-6 py-4">

              <p className="text-sm text-gray-500">

                System Status

              </p>

              <h3 className="text-green-600 font-bold text-lg">

                🟢 Online

              </h3>

            </div>

          </div>

        </div>
                {/* KPI Cards */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {cards.map((card) => (

            <DashboardCard
              key={card.title}
              title={card.title}
              value={card.value}
              color={card.color}
              bg={card.bg}
              icon={card.icon}
            />

          ))}

        </div>

        {/* Revenue Analytics */}

        <div className="bg-white rounded-3xl shadow-lg p-6 mt-8">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-2xl font-bold text-slate-800">

                📈 Revenue Analytics

              </h2>

              <p className="text-gray-500 mt-1">

                Monthly revenue overview

              </p>

            </div>

          </div>

          <RevenueChart
            data={dashboard?.revenueChart || []}
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