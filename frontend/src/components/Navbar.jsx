import { FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Navbar = ({ setSidebarOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="bg-white shadow-md px-6 py-4 flex items-center justify-between">

      {/* Left */}
      <div className="flex items-center gap-4">

        {/* Mobile Menu */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-2xl text-blue-700"
        >
          <FaBars />
        </button>

        <h2 className="text-2xl font-bold text-slate-800">
          Dashboard
        </h2>

      </div>

      {/* Right */}
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg transition"
      >
        Logout
      </button>

    </div>
  );
};

export default Navbar;