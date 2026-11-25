import { Suspense, useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";
import PageLoading from "../components/PageLoading";
import Sidebar from "../components/Sidebar";

export default function AdminLayout() {
  const [openLocation, setOpenLocation] = useState(null);
  const { key: locationKey } = useLocation();
  const sidebarOpen = openLocation === locationKey;
  const menuButton = useRef(null);
  const closeButton = useRef(null);
  const sidebar = useRef(null);

  useEffect(() => {
    document.title = "OM Tiffin Service - Admin";
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;

    const desktop = window.matchMedia("(min-width: 64rem)");
    const opener = menuButton.current;
    const closeOnDesktop = (event) => {
      if (event.matches) setOpenLocation(null);
    };
    desktop.addEventListener("change", closeOnDesktop);
    closeButton.current?.focus();

    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      if (!desktop.matches) opener?.focus();
    };
  }, [sidebarOpen]);

  function handleSidebarKeyDown(event) {
    if (!sidebarOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpenLocation(null);
      return;
    }
    if (event.key !== "Tab") return;

    const links = sidebar.current.querySelectorAll("a[href]");
    const first = closeButton.current;
    const last = links[links.length - 1] ?? first;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!sessionStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="om-admin-shell flex min-h-screen w-full min-w-0 bg-slate-100">
      <Sidebar
        sidebarOpen={sidebarOpen}
        closeSidebar={() => setOpenLocation(null)}
        sidebarRef={sidebar}
        closeButtonRef={closeButton}
        onKeyDown={handleSidebarKeyDown}
      />
      <div className="flex h-screen w-0 min-w-0 flex-1 flex-col lg:ml-64" inert={sidebarOpen}>
        <div className="sticky top-0 z-50 shrink-0">
          <Navbar
            sidebarOpen={sidebarOpen}
            menuButtonRef={menuButton}
            openSidebar={() => setOpenLocation(locationKey)}
          />
        </div>
        <main className="w-full min-w-0 max-w-full flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
