import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex justify-between items-center bg-white p-5 shadow">

      <h2 className="text-2xl font-bold text-slate-800">
        Dashboard
      </h2>

      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
      >
        Logout
      </button>

    </div>
  );
};

export default Navbar;