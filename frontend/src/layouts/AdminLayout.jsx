import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-100">

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Area */}
      <div className="flex-1 min-w-0 w-0 lg:ml-64 flex flex-col h-screen">

  <div className="sticky top-0 z-50 shrink-0">

    <Navbar
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />

  </div>

  <main className="flex-1 overflow-y-auto w-full min-w-0 max-w-full p-3 sm:p-4 md:p-6">

    <Outlet />

  </main>

</div>

    </div>
  );
}