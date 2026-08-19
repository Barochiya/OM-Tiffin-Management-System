import { useEffect, useState } from "react";
import { FaBars, FaBell, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { getBillDeliveryStatus } from "../services/billService";

const Navbar = ({ setSidebarOpen }) => {
  

  const navigate = useNavigate();

  const [notificationCount, setNotificationCount] =
    useState(0);

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

    const notificationCount =
      data.filter(
        (item) =>
          item.status === "pending" ||
          item.status === "failed"
      ).length;

    setNotificationCount(
      notificationCount
    );
  } catch (error) {
    console.error(
      "Notification Error:",
      error
    );
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">

      <div className="flex items-center gap-2 sm:gap-4 min-w-0">

        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-2xl text-slate-700"
        >
          <FaBars />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
            Dashboard
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 truncate">
            Welcome to OM Tiffin Management System
          </p>
        </div>

      </div>

      <div className="flex items-center gap-2 sm:gap-4 min-w-0">

        <button
          title="Bill Notifications"
          onClick={() =>
            navigate("/bill-delivery-status")
          }
          className="relative p-2 rounded-full hover:bg-gray-100"
        >
          <FaBell className="text-xl text-slate-600" />

          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        <div className="hidden md:flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
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

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
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