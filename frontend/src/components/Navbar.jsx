import { useEffect, useState } from "react";
import {
  FaBars,
  FaBell,
  FaSignOutAlt,
} from "react-icons/fa";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { getBillDeliveryStatus } from "../services/billService";

const Navbar = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [notificationCount, setNotificationCount] =
    useState(0);

  // =========================================
  // PAGE TITLE
  // =========================================

  const getPageInfo = () => {
    const path = location.pathname;

    if (path === "/dashboard") {
      return {
        title: "Dashboard",
        subtitle:
          "Welcome to OM Tiffin Management System",
      };
    }

    if (path === "/customers") {
      return {
        title: "Customers",
        subtitle:
          "Manage your OM Tiffin customers",
      };
    }

    if (path === "/add-customer") {
      return {
        title: "Add Customer",
        subtitle:
          "Add a new customer to OM Tiffin",
      };
    }

    if (path.startsWith("/edit-customer/")) {
      return {
        title: "Edit Customer",
        subtitle:
          "Update customer information",
      };
    }

    if (path.startsWith("/customer/")) {
      return {
        title: "Customer Details",
        subtitle:
          "View customer information",
      };
    }

    if (path === "/daily-entry") {
      return {
        title: "Daily Entry",
        subtitle:
          "Manage daily tiffin entries",
      };
    }

    if (path === "/price-settings") {
      return {
        title: "Price Settings",
        subtitle:
          "Manage meal pricing",
      };
    }

    if (path === "/billing") {
      return {
        title: "Billing",
        subtitle:
          "Generate and manage customer bills",
      };
    }

    if (path === "/view-bills") {
      return {
        title: "View Bills",
        subtitle:
          "View generated customer bills",
      };
    }

    if (path.startsWith("/view-bills/")) {
      return {
        title: "Bill Details",
        subtitle:
          "View customer bill details",
      };
    }

    if (path === "/payments") {
      return {
        title: "Payments",
        subtitle:
          "Manage customer payments",
      };
    }

    if (path.startsWith("/payment-receipt/")) {
      return {
        title: "Payment Receipt",
        subtitle:
          "View payment receipt",
      };
    }

    if (path === "/announcement") {
      return {
        title: "Announcement Center",
        subtitle:
          "Send WhatsApp announcements to customers",
      };
    }

    if (
      path ===
      "/announcement-delivery-status"
    ) {
      return {
        title:
          "Announcement Delivery Status",
        subtitle:
          "Monitor WhatsApp announcement delivery",
      };
    }

    if (path === "/bill-delivery-status") {
      return {
        title: "Bill Delivery Status",
        subtitle:
          "Monitor WhatsApp bill delivery",
      };
    }

    if (path === "/business-info") {
      return {
        title: "Business Information",
        subtitle:
          "Manage OM Tiffin business information",
      };
    }

    return {
      title: "OM Tiffin Management System",
      subtitle:
        "Admin Panel",
    };
  };

  const pageInfo = getPageInfo();

  // =========================================
  // LOAD NOTIFICATIONS
  // =========================================

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const response =
        await getBillDeliveryStatus();

      const data =
        response.data || [];

      const count =
        data.filter(
          (item) =>
            item.status === "pending" ||
            item.status === "failed"
        ).length;

      setNotificationCount(count);
    } catch (error) {
      console.error(
        "Notification Error:",
        error
      );
    }
  };

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <header className="flex items-center justify-between gap-3 bg-white px-3 py-3 shadow-md sm:px-6 sm:py-4 lg:px-8">

      {/* LEFT */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">

        <button
          type="button"
          onClick={() =>
            setSidebarOpen(true)
          }
          className="text-2xl text-slate-700 lg:hidden"
          aria-label="Open sidebar"
        >
          <FaBars />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-800 sm:text-2xl">
            {pageInfo.title}
          </h1>

          <p className="truncate text-xs text-gray-500 sm:text-sm">
            {pageInfo.subtitle}
          </p>
        </div>

      </div>

      {/* RIGHT */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">

        {/* NOTIFICATIONS */}

        <button
          type="button"
          title="Bill Notifications"
          onClick={() =>
            navigate(
              "/bill-delivery-status"
            )
          }
          className="relative rounded-full p-2 hover:bg-gray-100"
        >
          <FaBell className="text-xl text-slate-600" />

          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {notificationCount}
            </span>
          )}
        </button>

        {/* ADMIN */}

        <div className="hidden items-center gap-3 md:flex">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
            A
          </div>

          <div>
            <h3 className="font-semibold">
              Admin
            </h3>

            <p className="text-xs text-gray-500">
              OM Tiffin Service
            </p>
          </div>

        </div>

        {/* LOGOUT */}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          <FaSignOutAlt />

          <span className="hidden md:block">
            Logout
          </span>
        </button>

      </div>

    </header>
  );
};

export default Navbar;