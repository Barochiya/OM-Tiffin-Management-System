import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  return (
  <div
    className="
      fixed
      top-0
      left-0
      h-screen
      w-72
      bg-gradient-to-b
      from-blue-700
      to-blue-900
      text-white
      shadow-2xl
      flex
      flex-col
      z-50
      lg:translate-x-0
      transition-transform
      duration-300
    "
  >
    
    <div className="fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-2xl flex flex-col print:!hidden">

      {/* Logo */}
      <div className="flex items-center gap-4 p-6 border-b border-blue-500">
        <img
          src="/logo.png"
          alt="OM Tiffin Service"
          className="w-16 h-16 rounded-full bg-white p-1 shadow-lg"
        />

        <div>
          <h1 className="text-xl font-bold leading-6">
            OM TIFFIN SERVICE
          </h1>

          <p className="text-sm text-blue-100">
            ADMIN PANEL
          </p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 mt-6 px-3 space-y-2">

        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/dashboard"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          📊 Dashboard
        </Link>

        {/* Customers */}
        <Link
          to="/customers"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/customers"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          👥 Customers
        </Link>

        {/* Add Customer */}
        <Link
          to="/add-customer"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/add-customer"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          ➕ Add Customer
        </Link>

        {/* Daily Entry */}
        <Link
          to="/daily-entry"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/daily-entry"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          📅 Daily Entry
        </Link>

        {/* Price Settings */}
        <Link
          to="/price-settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/price-settings"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          ⚙️ Price Settings
        </Link>

        {/* Billing */}
        <Link
          to="/billing"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/billing"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          🧾 Billing
        </Link>

        {/* Payments */}
        <Link
          to="/payments"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/payments"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          💳 Payments
        </Link>

      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-blue-500">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white text-blue-700 flex items-center justify-center font-bold text-lg">
            A
          </div>

          <div>
            <p className="font-semibold">Om Tiffin Services</p>
            <p className="text-xs text-blue-200">
              9409380470
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;