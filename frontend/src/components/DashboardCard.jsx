import React from "react";

export default function DashboardCard({
  title,
  value,
  icon,
  color = "text-blue-600",
  bg = "bg-blue-100",
  subtitle = "",
  growth = null,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 animate-pulse">
        <div className="flex items-center justify-between">

          <div className="flex-1">

            <div className="h-4 w-24 rounded bg-slate-200 mb-4"></div>

            <div className="h-8 w-32 rounded bg-slate-200 mb-4"></div>

            <div className="h-3 w-40 rounded bg-slate-200"></div>

          </div>

          <div className="w-16 h-16 rounded-2xl bg-slate-200"></div>

        </div>
      </div>
    );
  }

  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        bg-white
        border
        border-slate-100
        shadow-md
        hover:shadow-2xl
        hover:-translate-y-1
        transition-all
        duration-300
        p-6
      "
    >
      {/* Top Gradient */}

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className={`text-3xl font-bold mt-3 ${color}`}>
            {value}
          </h2>

          {subtitle && (
            <p className="text-sm text-slate-400 mt-2">
              {subtitle}
            </p>
          )}

          {growth && (
            <div className="inline-flex items-center mt-4 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              ↑ {growth}
            </div>
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
            shadow-md
            group-hover:scale-110
            transition-transform
            duration-300
          `}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}