import React from "react";
import { FaCrown, FaMedal } from "react-icons/fa";

export default function TopCustomers({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FaCrown className="text-yellow-500" />
          Top Customers
        </h3>

        <span className="text-sm text-gray-500">
          {data.length} Customers
        </span>
      </div>

      {data.length === 0 ? (
        <div className="border rounded-xl p-10 text-center text-gray-500">
          No Customer Data
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((customer, index) => (
            <div
              key={customer._id || index}
              className="flex items-center justify-between border rounded-xl p-4 hover:bg-yellow-50 transition"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                    w-10
                    h-10
                    rounded-full
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-white
                    ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-orange-500"
                        : "bg-blue-500"
                    }
                  `}
                >
                  {index + 1}
                </div>

                <div>
                  <h4 className="font-semibold">
                    {customer.customer?.name ||
                      customer.name ||
                      "Unknown Customer"}
                  </h4>

                  <p className="text-sm text-gray-500">
                    Top Paying Customer
                  </p>
                </div>
              </div>

              <div className="text-right">
                <FaMedal className="text-yellow-500 ml-auto mb-1" />

                <p className="font-bold text-green-600">
                  ₹
                  {customer.totalPaid ||
                    customer.amount ||
                    0}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}