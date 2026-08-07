import { useEffect, useState } from "react";
import { FaBars } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DashboardCard from "../components/DashboardCard";
import RevenueChart from "../components/RevenueChart";
import RecentPayments from "../components/RecentPayments";
import PendingBills from "../components/PendingBills";
import TopCustomers from "../components/TopCustomers";

import { getDashboardAnalytics } from "../services/dashboardService";

export default function Dashboard() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

 const loadDashboard = async () => {
  try {

    const res = await getDashboardAnalytics();

   console.log("API Response:", res);
console.log("Dashboard Data:", res.data);

    setStats(res.data);

  } catch (err) {
    console.log(err);
  }
};

useEffect(() => {
  loadDashboard();
}, []);

  return (
    <div className="flex">

      <>
  {/* Mobile Overlay */}
  {sidebarOpen && (
    <div
      onClick={() => setSidebarOpen(false)}
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
    />
  )}

  {/* Sidebar */}
  <div
    className={`fixed top-0 left-0 h-screen z-50 transition-transform duration-300
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0`}
  >
    <Sidebar />
  </div>
</>

      <div className="lg:ml-64 min-h-screen bg-slate-100">

        <Navbar setSidebarOpen={setSidebarOpen} />

        <div className="p-8">

          <h1 className="text-3xl font-bold text-slate-800">
            📊 Dashboard
          </h1>

          <p className="text-gray-600 mt-2">
            Welcome to OM Tiffin Management System
          </p>

          {/* Analytics Cards */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">

            <DashboardCard
              title="💰 Today's Collection"
              value={`₹${stats.todaysCollection}`}
              color="text-green-600"
            />

            <DashboardCard
              title="📈 Monthly Revenue"
              value={`₹${stats.monthlyRevenue}`}
              color="text-blue-600"
            />

            <DashboardCard
              title="⏳ Pending Amount"
              value={`₹${stats.pendingAmount}`}
              color="text-red-600"
            />

            <DashboardCard
              title="👥 Total Customers"
              value={stats.totalCustomers}
              color="text-purple-600"
            />

            <DashboardCard
              title="🍱 Today's Meals"
              value={stats.todayMeals}
              color="text-orange-600"
            />

            <DashboardCard
              title="📦 Today's Extra Charges"
              value={`₹${stats.todayExtraCharges}`}
              color="text-pink-600"
            />

          </div>

          {/* Revenue Chart */}

          <RevenueChart
            data={stats.revenueChart}
          />

{/* Bottom Section */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

  <RecentPayments
    payments={stats.recentPayments}
  />

  <PendingBills
    bills={stats.pendingBills}
  />

</div>

<div className="mt-8">

  <TopCustomers
    customers={stats.topCustomers}
  />

</div>

        </div>

      </div>

    </div>
  );
}