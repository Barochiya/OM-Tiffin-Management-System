import { Link, useLocation } from "react-router-dom";
import {
  FaWallet,
  FaUsers,
  FaUserPlus,
  FaCalendarAlt,
  FaBarcode,
  FaCog,
  FaFileInvoiceDollar,
  FaFileInvoice,
  FaMoneyBillWave,
  FaBullhorn,
  FaTruck,
  FaWhatsapp,
  FaMoneyCheckAlt,
  FaUtensils,
  FaStar,
} from "react-icons/fa";

const Sidebar = ({ sidebarOpen = false, setSidebarOpen = () => {} }) => {
  const location = useLocation();
  const walletsActive = location.pathname === "/wallets" || (location.pathname === "/customers" && new URLSearchParams(location.search).get("view") === "wallets");

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
        className={`fixed left-0 top-0 z-50 w-[240px] max-w-[78vw] h-screen bg-gradient-to-b lg:w-64 from-blue-700 to-blue-900 text-white shadow-2xl flex flex-col print:!hidden transform transition-transform duration-300 ${
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

      <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="absolute right-2 top-2 rounded-lg p-2 text-white lg:hidden">✕</button>
      {/* Menu */}
      <nav aria-label="Admin navigation" className="flex-1 mt-4 px-3 overflow-y-auto pb-6">
        <section aria-labelledby="admin-nav-0" className="mb-4">
          <h2 id="admin-nav-0" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Overview</h2>
          <div className="space-y-1">
            <Link
          to="/dashboard"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/dashboard"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          Dashboard
        </Link>
          </div>
        </section>
        <section aria-labelledby="admin-nav-1" className="mb-4">
          <h2 id="admin-nav-1" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Customers</h2>
          <div className="space-y-1">
            <Link
          to="/customers"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/customers" && !walletsActive && new URLSearchParams(location.search).get("view") !== "pg" && new URLSearchParams(location.search).get("view") !== "employees" && new URLSearchParams(location.search).get("view") !== "review-invitations"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          <FaUsers className="text-blue-200" />
          Customers
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
          <FaUserPlus className="text-green-300" />
          Add Customer
        </Link>
          </div>
        </section>
        <section aria-labelledby="admin-nav-2" className="mb-4">
          <h2 id="admin-nav-2" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Daily work</h2>
          <div className="space-y-1">
            <Link
          to="/daily-entry"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/daily-entry"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          <FaCalendarAlt className="text-yellow-300" />
          Daily Entry
        </Link>
            <Link
         to="/barcode-entry"
         onClick={closeSidebar}
         className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
           location.pathname === "/barcode-entry"
             ? "bg-white text-blue-700 font-semibold shadow"
             : "hover:bg-blue-600"
         }`}
       >
         <FaBarcode className="text-purple-300" />
         Barcode Entry
       </Link>
            <Link
        to="/customer-modification-requests"
        onClick={closeSidebar}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
          location.pathname === "/customer-modification-requests"
            ? "bg-white text-blue-700 font-semibold shadow"
            : "hover:bg-blue-600"
        }`}
      >
        <FaCalendarAlt className="text-orange-300" />
        Tiffin Modifications
      </Link>
          </div>
        </section>
        <section aria-labelledby="admin-nav-3" className="mb-4">
          <h2 id="admin-nav-3" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Team &amp; payroll</h2>
          <div className="space-y-1">
            <Link to="/customers?view=employees" onClick={closeSidebar} className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${(location.pathname === "/employees" || (location.pathname === "/customers" && new URLSearchParams(location.search).get("view") === "employees")) ? "bg-white text-blue-700 font-semibold shadow" : "hover:bg-blue-600"}`}><FaUsers />Employee Management</Link>
          </div>
        </section>
        <section aria-labelledby="admin-nav-pg" className="mb-4"><h2 id="admin-nav-pg" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">PG Management</h2><Link to="/customers?view=pg" onClick={closeSidebar} className={`flex items-center gap-3 rounded-lg px-4 py-3 ${new URLSearchParams(location.search).get('view')==='pg'?'bg-white text-blue-700 font-semibold':'hover:bg-blue-600'}`}><FaUsers/>Students & Payments</Link></section>
        <section aria-labelledby="admin-nav-4" className="mb-4">
          <h2 id="admin-nav-4" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Wallets &amp; balances</h2>
          <div className="space-y-1">
            <Link to="/customers?view=wallets" onClick={closeSidebar} className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${walletsActive ? "bg-white text-blue-700 font-semibold shadow" : "hover:bg-blue-600"}`}><FaWallet />Customer Wallets</Link>
          </div>
        </section>
        <section aria-labelledby="admin-nav-5" className="mb-4">
          <h2 id="admin-nav-5" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Billing &amp; receipts</h2>
          <div className="space-y-1">
            <Link
          to="/billing"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/billing"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          <FaFileInvoiceDollar className="text-orange-300" />
          Billing
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
  <FaFileInvoice className="text-cyan-300" />
  View Bills
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
          <FaMoneyBillWave className="text-green-300" />
          Payments
        </Link>
            <Link to="/document-design" onClick={closeSidebar} className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${(location.pathname === "/document-design") ? "bg-white text-blue-700 font-semibold shadow" : "hover:bg-blue-600"}`}><FaCog />Bill &amp; Receipt Design</Link>
          </div>
        </section>
        <section aria-labelledby="admin-nav-6" className="mb-4">
          <h2 id="admin-nav-6" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Delivery status</h2>
          <div className="space-y-1">
            <Link
  to="/bill-delivery-status"
  onClick={closeSidebar}
  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
    location.pathname === "/bill-delivery-status"
      ? "bg-white text-blue-700 font-semibold shadow"
      : "hover:bg-blue-600"
  }`}
>
  <FaTruck className="text-cyan-300" />
  Bill Delivery Status
</Link>
            <Link to="/receipt-delivery-status" onClick={closeSidebar} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${location.pathname === "/receipt-delivery-status" ? "bg-white text-blue-700 font-semibold shadow" : "hover:bg-blue-600"}`}><FaTruck className="text-cyan-300" />Receipt Delivery Status</Link>
            <Link
      to="/announcement-delivery-status"
      onClick={closeSidebar}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
        location.pathname === "/announcement-delivery-status"
          ? "bg-white text-blue-700 font-semibold shadow"
          : "hover:bg-blue-600"
      }`}
    >
      <FaBullhorn className="text-yellow-300" />
      Announcement Status
    </Link>
          </div>
        </section>
        <section aria-labelledby="admin-nav-7" className="mb-4">
          <h2 id="admin-nav-7" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">WhatsApp &amp; announcements</h2>
          <div className="space-y-1">
            <Link
          to="/whatsapp-inbox"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/whatsapp-inbox"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          <FaWhatsapp className="text-green-400" />
          WhatsApp Inbox
        </Link>
            <Link
          to="/whatsapp-payment-approval"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
            location.pathname === "/whatsapp-payment-approval"
              ? "bg-white text-blue-700 font-semibold shadow"
              : "hover:bg-blue-600"
          }`}
        >
          <FaMoneyCheckAlt className="text-emerald-300" />
          WhatsApp Payment Approval
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
  <FaBullhorn className="text-yellow-300" />
  Announcement Center
</Link>
            <Link
         to="/customer-login-id-sender"
         onClick={closeSidebar}
         className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
           location.pathname === "/customer-login-id-sender"
             ? "bg-white text-blue-700 font-semibold shadow"
             : "hover:bg-blue-600"
         }`}
       >
         <FaWhatsapp className="text-green-400" />
         Customer Login ID Sender
       </Link>
          </div>
        </section>
        <section aria-labelledby="admin-nav-reviews" className="mb-4">
          <h2 id="admin-nav-reviews" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Customer feedback</h2>
          <Link to="/customers?view=review-invitations" onClick={closeSidebar} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${new URLSearchParams(location.search).get('view')==='review-invitations'?'bg-white text-blue-700 font-semibold':'hover:bg-blue-600'}`}><FaStar/>Review Invitations</Link>
        </section>
        <section aria-labelledby="admin-nav-8" className="mb-4">
          <h2 id="admin-nav-8" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Website</h2>
          <div className="space-y-1">
            <Link to="/website-orders" onClick={closeSidebar} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${location.pathname === "/website-orders" ? "bg-white text-blue-700 font-semibold" : "hover:bg-blue-600"}`}><FaTruck />Website Orders</Link>
            <Link
        to="/website-menu"
        onClick={closeSidebar}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
          location.pathname === "/website-menu"
            ? "bg-white text-blue-700 font-semibold shadow"
            : "hover:bg-blue-600"
        }`}
      >
        <FaUtensils className="text-orange-300" />
        Website Menu
      </Link>
            <Link
        to="/website-reviews"
        onClick={closeSidebar}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
          location.pathname === "/website-reviews"
            ? "bg-white text-blue-700 font-semibold shadow"
            : "hover:bg-blue-600"
        }`}
      >
        <FaStar className="text-yellow-300" />
        Reviews
      </Link>
            <Link
        to="/website-settings"
        onClick={closeSidebar}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
          location.pathname === "/website-settings"
            ? "bg-white text-blue-700 font-semibold shadow"
            : "hover:bg-blue-600"
        }`}
      >
        <FaCog className="text-yellow-300" />
        Website Settings
      </Link>
          </div>
        </section>
        <section aria-labelledby="admin-nav-9" className="mb-4">
          <h2 id="admin-nav-9" className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Administration &amp; settings</h2>
          <div className="space-y-1">
            <Link
          to="/users"
          onClick={closeSidebar}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all
            duration-300 ${
              location.pathname === "/users"
                ? "bg-white text-blue-700 font-semibold shadow"
                : "hover:bg-blue-600"
            }`}
        >
          <FaUsers className="text-blue-200" />
          Users
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
          <FaCog className="text-gray-200" />
          Price Settings
        </Link>
            <Link
        to="/customer-modification-settings"
        onClick={closeSidebar}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
          location.pathname === "/customer-modification-settings"
            ? "bg-white text-blue-700 font-semibold shadow"
            : "hover:bg-blue-600"
        }`}
      >
        <FaCog className="text-cyan-300" />
        Tiffin Modification Settings
      </Link>
          </div>
        </section>
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

















