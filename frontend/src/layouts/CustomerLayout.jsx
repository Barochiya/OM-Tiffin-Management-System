import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import CustomerSidebar from "../customer/components/CustomerSidebar";
const CustomerLayout = () => {
  useEffect(() => {
    document.title = "OM Tiffin Service - Customer Dashboard";
  }, []);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <CustomerSidebar />
      <div className="lg:pl-[270px] min-h-screen">
        <Outlet />
      </div>
    </div>
  );
};
export default CustomerLayout;

