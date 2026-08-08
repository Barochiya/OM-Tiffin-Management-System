import React from "react";

export default function DashboardCard({
  title,
  value,
  icon,
  color = "text-blue-600",
  bg = "bg-blue-100",
  subtitle = "",
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-3 w-full">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>

          <div className="w-16 h-16 rounded-xl bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        bg-white
        rounded-2xl
        shadow-md
        hover:shadow-xl
        transition-all
        duration-300
        p-6
        border
        border-slate-100
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">
            {title}
          </p>

          <h2 className={`text-3xl font-bold mt-2 ${color}`}>
            {value}
          </h2>

          {subtitle && (
            <p className="text-xs text-gray-400 mt-2">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`
            ${bg}
            ${color}
            w-16
            h-16
            rounded-2xl
            flex
            items-center
            justify-center
            text-3xl
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}