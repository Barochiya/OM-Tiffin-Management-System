const StatusBadge = ({ status }) => {
  const active = status === "Active";

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${
        active
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;