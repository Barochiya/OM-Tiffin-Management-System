import { useEffect, useState } from "react";

import { getBillDeliveryStatus } from "../services/billService";

export default function BillDeliveryStatus() {
  const [data, setData] = useState([]);

const [filter, setFilter] =
  useState("all");

  const [searchTerm, setSearchTerm] =
  useState("");

const [loading, setLoading] =
  useState(true);


  useEffect(() => {
  loadData();

  const interval = setInterval(() => {
    loadData();
  }, 10000);

  return () => {
    clearInterval(interval);
  };
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
  (item) =>
    item.status === "delivered"
).length;

const readCount = data.filter(
  (item) =>
    item.status === "read"
).length;

const failedCount = data.filter(
  (item) =>
    item.status === "failed"
).length;

const notSentCount = data.filter(
  (item) =>
    item.status === "pending"
).length;


const filteredData = data.filter(
  (item) => {
    const statusMatch =
      filter === "all" ||
      item.status === filter;

    const searchMatch =
      item.customer
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        );

    return (
      statusMatch && searchMatch
    );
  }
);

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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow">
                <p className="text-gray-500">
                  Total Bills
                </p>

                <h2 className="text-3xl font-bold">
                  {data.length}
                </h2>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow">
                <p className="flex items-center gap-2 text-gray-500">
  <span className="text-green-600 font-bold">
    ✓✓
  </span>

  <span>Delivered</span>
</p>

                <h2 className="text-3xl font-bold text-green-600">
                  {deliveredCount}
                </h2>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow">
                <p className="flex items-center gap-2 text-gray-500">
  <span>👁</span>

  <span>Read</span>
</p>

                <h2 className="text-3xl font-bold text-blue-600">
                  {readCount}
                </h2>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow">
               <p className="flex items-center gap-2 text-gray-500">
  <span>❌</span>

  <span>Failed</span>
</p>

                <h2 className="text-3xl font-bold text-red-600">
                  {failedCount}
                </h2>
              </div>



              <div className="bg-white p-6 rounded-2xl shadow">
                <p className="flex items-center gap-2 text-gray-500">
  <span>⏳</span>

  <span>Not Sent</span>
</p>

                <h2 className="text-3xl font-bold text-orange-600">
                  {notSentCount}
                </h2>
              </div>
            </div>

            <div className="mb-4">
  <input
    type="text"
    placeholder="🔍 Search customer..."
    value={searchTerm}
    onChange={(e) =>
      setSearchTerm(e.target.value)
    }
    className="w-full md:w-80 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none"
  />
</div>

            <div className="flex flex-wrap gap-3 mb-6">
  <button
    onClick={() => setFilter("all")}
    className="px-4 py-2 rounded-full bg-slate-200"
  >
    All
  </button>

  <button
    onClick={() => setFilter("sent")}
    className="px-4 py-2 rounded-full bg-slate-200"
  >
    Sent
  </button>

  <button
    onClick={() => setFilter("delivered")}
    className="px-4 py-2 rounded-full bg-slate-200"
  >
    Delivered
  </button>

  <button
    onClick={() => setFilter("read")}
    className="px-4 py-2 rounded-full bg-slate-200"
  >
    Read
  </button>

  <button
    onClick={() => setFilter("failed")}
    className="px-4 py-2 rounded-full bg-slate-200"
  >
    Failed
  </button>
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
                    <th className="w-40 p-4 text-left">
                      Timeline
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((item) => (
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
  <div
    className={`inline-flex items-center justify-center gap-2 min-w-[120px] rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
      item.status === "read"
        ? "bg-blue-100 text-blue-700"
        : item.status === "delivered"
        ? "bg-green-100 text-green-700"
        : item.status === "sent"
        ? "bg-gray-100 text-gray-700"
        : item.status === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    {item.status === "read" && (
      <>
        <span>👁</span>
        <span>Read</span>
      </>
    )}

    {item.status === "delivered" && (
      <>
        <span>✓✓</span>
        <span>Delivered</span>
      </>
    )}

    {item.status === "sent" && (
      <>
        <span>✓✓</span>
        <span>Sent</span>
      </>
    )}

    {item.status === "failed" && (
      <>
        <span>❌</span>
        <span>Failed</span>
      </>
    )}

    {item.status === "pending" && (
      <>
        <span>⏳</span>
        <span>Pending</span>
      </>
    )}
  </div>
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
                      <td className="p-4 align-middle">
  <div className="flex flex-col gap-2 text-sm">

    {item.sentAt && (
      <div className="flex items-center gap-2">
        <span>📨</span>

        <span className="text-gray-600">
  Sent
</span>
      </div>
    )}

    {item.deliveredAt && (
      <div className="flex items-center gap-2 pl-3">
       <div className="h-4 border-l-2 border-gray-300 ml-2"></div>

        <span className="text-green-600">
          ✓✓ Delivered
        </span>
      </div>
    )}

    {item.readAt && (
      <div className="flex items-center gap-2 pl-3">
        <div className="h-4 border-l-2 border-gray-300 ml-2"></div>

        <span className="text-blue-600">
          👁 Read
        </span>
      </div>
    )}

    {item.failedAt && (
      <div className="flex items-center gap-2 pl-3">
        <div className="h-4 border-l-2 border-gray-300 ml-2"></div>
        <span className="text-red-600">
          ❌ Failed
        </span>
      </div>
    )}

  </div>
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