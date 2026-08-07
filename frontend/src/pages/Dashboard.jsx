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

import {
  getDashboardAnalytics,
} from "../services/dashboardService";

export default function Dashboard() {

  // ======================================
  // STATES
  // ======================================

  const [stats, setStats] = useState({

    todaysCollection: 0,

    monthlyRevenue: 0,

    pendingAmount: 0,

    totalCustomers: 0,

    todayMeals: 0,

    todayExtraCharges: 0,

    revenueChart: [],

    recentPayments: [],

    pendingBills: [],

    topCustomers: [],

  });

  const [loading, setLoading] = useState(true);

  // ======================================
  // LOAD DASHBOARD
  // ======================================

  useEffect(() => {

    loadDashboard();

  }, []);

  const loadDashboard = async () => {

    try {

      setLoading(true);

      const res = await getDashboardAnalytics();

      setStats(res.data);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  };

  // ======================================
  // DASHBOARD CARDS
  // ======================================

  const cards = [

    {

      title: "Today's Collection",

      value: `₹${stats.todaysCollection}`,

      color: "text-green-600",

      bg: "bg-green-100",

      icon: <FaMoneyBillWave className="text-3xl" />,

    },

    {

      title: "Monthly Revenue",

      value: `₹${stats.monthlyRevenue}`,

      color: "text-blue-600",

      bg: "bg-blue-100",

      icon: <FaChartLine className="text-3xl" />,

    },

    {

      title: "Pending Amount",

      value: `₹${stats.pendingAmount}`,

      color: "text-red-600",

      bg: "bg-red-100",

      icon: <FaClock className="text-3xl" />,

    },

    {

      title: "Customers",

      value: stats.totalCustomers,

      color: "text-purple-600",

      bg: "bg-purple-100",

      icon: <FaUsers className="text-3xl" />,

    },

    {

      title: "Today's Meals",

      value: stats.todayMeals,

      color: "text-orange-600",

      bg: "bg-orange-100",

      icon: <FaUtensils className="text-3xl" />,

    },

    {

      title: "Extra Charges",

      value: `₹${stats.todayExtraCharges}`,

      color: "text-pink-600",

      bg: "bg-pink-100",

      icon: <FaWallet className="text-3xl" />,

    },

  ];
    // ======================================
  // UI
  // ======================================

  return (

    <div className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto p-4 lg:p-8">

        {/* Header */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">

          <div>

            <h1 className="text-4xl font-bold text-slate-800">

              📊 Dashboard

            </h1>

            <p className="text-gray-500 mt-2">

              Welcome to OM Tiffin Management System

            </p>

          </div>

          <div className="mt-4 lg:mt-0">

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

        {/* Loading */}

        {loading ? (

          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">

            <h2 className="text-xl font-semibold text-gray-600">

              Loading Dashboard...

            </h2>

          </div>

        ) : (

          <>

            {/* KPI Cards */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

              {cards.map((card) => (

                <div

                  key={card.title}

                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"

                >

                  <div className="flex justify-between items-center">

                    <div>

                      <p className="text-gray-500">

                        {card.title}

                      </p>

                      <h2 className={`text-3xl font-bold ${card.color}`}>

                        {card.value}

                      </h2>

                    </div>

                    <div className={`${card.bg} ${card.color} p-4 rounded-xl`}>

                      {card.icon}

                    </div>

                  </div>

                </div>

              ))}

            </div>

            {/* Revenue Chart */}

            <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">

              <h2 className="text-xl font-bold mb-4">

                📈 Revenue Analytics

              </h2>

              <RevenueChart

                data={stats.revenueChart}

              />

            </div>
                        {/* Bottom Widgets */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

              {/* Recent Payments */}

              <div className="bg-white rounded-2xl shadow-lg p-6">

                <h2 className="text-xl font-bold mb-4">

                  💳 Recent Payments

                </h2>

                <RecentPayments
                  data={stats.recentPayments}
                />

              </div>

              {/* Pending Bills */}

              <div className="bg-white rounded-2xl shadow-lg p-6">

                <h2 className="text-xl font-bold mb-4">

                  ⚠️ Pending Bills

                </h2>

                <PendingBills
                  data={stats.pendingBills}
                />

              </div>

              {/* Top Customers */}

              <div className="bg-white rounded-2xl shadow-lg p-6">

                <h2 className="text-xl font-bold mb-4">

                  ⭐ Top Customers

                </h2>

                <TopCustomers
                  data={stats.topCustomers}
                />

              </div>

            </div>

          </>

        )}

      </div>

    </div>

  );

}
