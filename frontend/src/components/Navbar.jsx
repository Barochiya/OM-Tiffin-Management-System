const Navbar = () => {
  return (
    <div className="bg-white shadow-md px-8 py-4 flex justify-between items-center print:hidden">

      <h2 className="text-2xl font-bold text-slate-800">
        Dashboard
      </h2>

      <button className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg">
        Logout
      </button>

    </div>
  );
};

export default Navbar;