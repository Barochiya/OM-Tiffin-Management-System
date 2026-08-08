import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

export default function PendingBills({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FaExclamationTriangle className="text-red-600" />
          Pending Bills
        </h3>

        <span className="text-sm text-gray-500">
          {data.length} Bills
        </span>
      </div>

      {data.length === 0 ? (
        <div className="border rounded-xl p-10 text-center text-gray-500">
          🎉 No Pending Bills
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-3">Customer</th>
                <th className="text-left py-3">Pending</th>
                <th className="text-left py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {data.map((bill) => (
                <tr
                  key={bill._id}
                  className="border-b hover:bg-red-50 transition"
                >
                  <td className="py-3 font-medium">
                   {bill.customer?.customerName || "-"}
                  </td>

                  <td className="py-3 font-bold text-red-600">
                    ₹{bill.pendingAmount || 0}
                  </td>

                  <td className="py-3">
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      {bill.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}