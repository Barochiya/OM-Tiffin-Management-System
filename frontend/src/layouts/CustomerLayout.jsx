import { Suspense } from "react";
import PageLoading from "../components/PageLoading";
﻿import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import CustomerSidebar from "../customer/components/CustomerSidebar";
import "../styles/customer-premium.css";
const CustomerLayout = () => {
  useEffect(() => {
    document.title = "OM Tiffin Service - Customer Dashboard";
  }, []);
  return (
    <div className="om-customer-shell min-h-screen bg-slate-50 text-slate-800">
      <CustomerSidebar />
      <div className="min-h-screen pb-20 lg:pb-0 lg:pl-[270px]">
        <Suspense fallback={<PageLoading />}><Outlet /></Suspense>
      </div>
    </div>
  );
};
export default CustomerLayout;

