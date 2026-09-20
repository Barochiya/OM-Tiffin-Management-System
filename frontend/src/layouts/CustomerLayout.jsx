import { Outlet } from "react-router-dom";
import CustomerSidebar from "../customer/components/CustomerSidebar";
const CustomerLayout = () => {
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
