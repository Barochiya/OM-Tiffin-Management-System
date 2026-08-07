import { FaBars, FaBell, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Navbar = ({ setSidebarOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white shadow-md px-4 lg:px-8 py-4 flex items-center justify-between">

      {/* Left */}
      <div className="flex items-center gap-4">

        {/* Mobile Menu */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-2xl text-slate-700"
        >
          <FaBars />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            Welcome to OM Tiffin Management System
          </p>
        </div>

      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Notification */}
        <button className="relative p-2 rounded-full hover:bg-gray-100">

          <FaBell className="text-xl text-slate-600" />

          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center">
            3
          </span>

        </button>

        {/* Admin */}
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

        {/* Logout */}
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