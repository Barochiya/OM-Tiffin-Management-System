import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUserCircle,
  FaKey,
  FaChartPie,
  FaFileInvoiceDollar,
  FaCreditCard,
  FaDownload,
  FaBullhorn,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { logoutCustomer } from "../../services/customerAuthService";
const menuItems = [
  {
    label: "Dashboard",
    path: "/customer/dashboard",
    icon: FaHome,
    color: "text-blue-600",
    active: "bg-blue-50 text-blue-700",
  },
  {
    label: "My Profile",
    path: "/customer/profile",
    icon: FaUserCircle,
    color: "text-indigo-600",
    active: "bg-indigo-50 text-indigo-700",
  },
  {
    label: "Change Password",
    path: "/customer/change-password",
    icon: FaKey,
    color: "text-orange-500",
    active: "bg-orange-50 text-orange-700",
  },
  {
    label: "Tiffin Plan",
    path: "/customer/tiffin-plan",
    icon: FaChartPie,
    color: "text-emerald-600",
    active: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Bill History",
    path: "/customer/bills",
    icon: FaFileInvoiceDollar,
    color: "text-blue-600",
    active: "bg-blue-50 text-blue-700",
  },
  {
    label: "Payment History",
    path: "/customer/payments",
    icon: FaCreditCard,
    color: "text-green-600",
    active: "bg-green-50 text-green-700",
  },
  {
    label: "Download Bills",
    path: "/customer/bills",
    icon: FaDownload,
    color: "text-violet-600",
    active: "bg-violet-50 text-violet-700",
  },
  {
    label: "Announcements",
    path: "/customer/announcements",
    icon: FaBullhorn,
    color: "text-amber-500",
    active: "bg-amber-50 text-amber-700",
  },
];
const CUSTOMER_HEADER_PATHS = [
  "/customer/dashboard",
  "/customer/change-password",
  "/customer/bills",
];
const CustomerSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasPageHeader =
    CUSTOMER_HEADER_PATHS.includes(location.pathname) ||
    location.pathname.startsWith("/customer/bills/");
  useEffect(() => {
    const openSidebar = () => setMobileOpen(true);
    window.addEventListener("customer-sidebar-open", openSidebar);
    return () => {
      window.removeEventListener("customer-sidebar-open", openSidebar);
    };
  }, []);
  const handleLogout = () => {
    logoutCustomer();
    setMobileOpen(false);
    navigate("/customer-login", { replace: true });
  };
  const handleNavigation = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  };
  return (
    <>
      {!hasPageHeader && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open customer menu"
          className="fixed left-3 top-3 z-[60] flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 shadow-lg ring-1 ring-slate-200 lg:hidden"
        >
          <FaBars />
        </button>
      )}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close customer menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-sm ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div>
            <p className="text-lg font-extrabold tracking-wide text-blue-700">
              OM TIFFIN
            </p>
            <p className="text-xs font-medium text-slate-500">
              Customer Portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <FaTimes />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Customer Menu
          </p>
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={`${item.label}-${item.path}`}
                  to={item.path}
                  onClick={handleNavigation}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                      isActive
                        ? `${item.active} shadow-sm`
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon
                    className={`text-base ${
                      item.color
                    } transition-transform group-hover:scale-110`}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <FaSignOutAlt className="text-base" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
export default CustomerSidebar;

