const DashboardCard = ({ title, value, color }) => {
  return (
    <div
      className="
        bg-white
        rounded-2xl
        shadow-lg
        hover:shadow-2xl
        hover:-translate-y-1
        transition-all
        duration-300
        p-6
        border
        border-gray-100
      "
    >
      <h3 className="text-gray-500 text-base font-medium">
        {title}
      </h3>

      <div
        className={`text-4xl font-bold mt-4 ${color}`}
      >
        {value}
      </div>
    </div>
  );
};

export default DashboardCard;