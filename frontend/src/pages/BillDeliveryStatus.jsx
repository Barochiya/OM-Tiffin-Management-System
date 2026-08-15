import { useEffect, useState } from "react";

import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

import {
  getBillDeliveryStatus,
} from "../services/billService";

export default function BillDeliveryStatus() {
  const [data, setData] = useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response =
        await getBillDeliveryStatus();

      setData(response.data || []);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  };

  const deliveredCount = data.filter(
    (item) => item.delivered
  ).length;

  const failedCount = data.filter(
    (item) =>
      !item.delivered &&
      item.reason !== "Not sent yet"
  ).length;

  const notSentCount = data.filter(
    (item) =>
      item.reason === "Not sent yet"
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Bill Delivery Status
          </h1>

          <p className="text-gray-500 mt-2">
            Monitor WhatsApp bill delivery.
          </p>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded-2xl shadow">
            Loading...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow">
                <p className="text-gray-500">
                  Total Bills
                </p>

                <h2 className="text-3xl font-bold">
                  {data.length}
                </h2>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow">
                <p className="text-gray-500">
                  Delivered
                </p>

                <h2 className="text-3xl font-bold text-green-600">
                  {deliveredCount}
                </h2>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow">
                <p className="text-gray-500">
                  Failed
                </p>

                <h2 className="text-3xl font-bold text-red-600">
                  {failedCount}
                </h2>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow">
                <p className="text-gray-500">
                  Not Sent
                </p>

                <h2 className="text-3xl font-bold text-orange-600">
                  {notSentCount}
                </h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4 text-left">
                      Customer
                    </th>

                    <th className="p-4 text-left">
                      Invoice
                    </th>

                    <th className="p-4 text-left">
                      Month
                    </th>

                    <th className="p-4 text-center">
                      Status
                    </th>

                    <th className="p-4 text-left">
                      Reason
                    </th>

                    <th className="p-4 text-left">
                      Sent At
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((item) => (
                    <tr
                      key={item.billId}
                      className="border-t"
                    >
                      <td className="p-4">
                        {item.customer}
                      </td>

                      <td className="p-4">
                        {item.invoice}
                      </td>

                      <td className="p-4">
                        {item.month}/{item.year}
                      </td>

                      <td className="p-4 text-center">
                        {item.delivered ? (
                          <FaCheckCircle className="inline text-green-600" />
                        ) : item.reason ===
                          "Not sent yet" ? (
                          <FaExclamationTriangle className="inline text-orange-500" />
                        ) : (
                          <FaTimesCircle className="inline text-red-600" />
                        )}
                      </td>

                      <td className="p-4">
                        {item.reason}
                      </td>

                      <td className="p-4">
                        {item.sentAt
                          ? new Date(
                              item.sentAt
                            ).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}