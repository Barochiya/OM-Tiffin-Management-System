import React from "react";
import { FaMoneyBillWave } from "react-icons/fa";

export default function RecentPayments({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FaMoneyBillWave className="text-blue-600" />
          Recent Payments
        </h3>

        <span className="text-sm text-gray-500">
          {data.length} Records
        </span>
      </div>

      {data.length === 0 ? (
        <div className="border rounded-xl p-10 text-center text-gray-500">
          No Recent Payments
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-3">Customer</th>
                <th className="text-left py-3">Amount</th>
                <th className="text-left py-3">Mode</th>
                <th className="text-left py-3">Date</th>
              </tr>
            </thead>

            <tbody>
              {data.map((payment) => (
                <tr
                  key={payment._id}
                  className="border-b hover:bg-slate-50 transition"
                >
                  <td className="py-3 font-medium">
                    {payment.customer?.name || "-"}
                  </td>

                  <td className="py-3 font-semibold text-green-600">
                    ₹{payment.amount}
                  </td>

                  <td className="py-3">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                      {payment.paymentMode || "-"}
                    </span>
                  </td>

                  <td className="py-3 text-gray-500">
                    {payment.createdAt
                      ? new Date(payment.createdAt).toLocaleDateString("en-IN")
                      : "-"}
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