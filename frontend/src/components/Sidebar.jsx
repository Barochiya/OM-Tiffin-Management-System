import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ sidebarOpen = false, setSidebarOpen = () => {} }) => {
  const location = useLocation();

const closeSidebar = () => {
  if (window.innerWidth < 1024) {
    setSidebarOpen(false);
  }
};

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 w-64 h-screen bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-2xl flex flex-col print:!hidden transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >

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
      <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto pb-6">

        <Link
          to="/dashboard"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/dashboard"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          📊 Dashboard
        </Link>

        <Link
          to="/customers"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/customers"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          👥 Customers
        </Link>

        <Link
          to="/add-customer"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/add-customer"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          ➕ Add Customer
        </Link>

        <Link
          to="/daily-entry"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/daily-entry"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          📅 Daily Entry
        </Link>

        <Link
          to="/price-settings"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/price-settings"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          ⚙️ Price Settings
        </Link>

        <Link
          to="/billing"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/billing"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          🧾 Billing
        </Link>

        <Link
  to="/view-bills"
  onClick={closeSidebar}
  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
    location.pathname === "/view-bills"
      ? "bg-white text-blue-700 font-semibold shadow"
      : "hover:bg-blue-600"
  }`}
>
  📄 View Bills
</Link>

        <Link
          to="/payments"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/payments"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          💳 Payments
        </Link>

          <Link
  to="/announcement"
  onClick={closeSidebar}
  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
    location.pathname === "/announcement"
      ? "bg-white text-blue-700 font-semibold shadow"
      : "hover:bg-blue-600"
  }`}
>
  📢 Announcement Center
</Link>

        <Link
  to="/bill-delivery-status"
  onClick={closeSidebar}
  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
    location.pathname === "/bill-delivery-status"
      ? "bg-white text-blue-700 font-semibold shadow"
      : "hover:bg-blue-600"
  }`}
>
  📨 Bill Delivery Status
</Link>
    <Link
      to="/announcement-delivery-status"
      onClick={closeSidebar}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
        location.pathname === "/announcement-delivery-status"
          ? "bg-white text-blue-700 font-semibold shadow"
          : "hover:bg-blue-600"
      }`}
    >
      📢 Announcement Status
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

      </aside>
    </>
  );
};

export default Sidebar;
