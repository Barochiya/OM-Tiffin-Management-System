import { useEffect, useState } from "react";
import {
  getBillDeliveryStatus,
  retryBill,
} from "../services/billService";

export default function BillDeliveryStatus() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      const response = await getBillDeliveryStatus();
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

  const handleRetry = async (billId) => {
    try {
      await retryBill(billId);

      alert("Bill sent successfully.");

      loadData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Retry failed."
      );
    }
  };

  const deliveredCount = data.filter(
    (item) => item.status === "delivered"
  ).length;

  const readCount = data.filter(
    (item) => item.status === "read"
  ).length;

  const failedCount = data.filter(
    (item) => item.status === "failed"
  ).length;

  const notSentCount = data.filter(
    (item) => item.status === "pending"
  ).length;

  const filteredData = data.filter((item) => {
    const statusMatch =
      filter === "all" ||
      item.status === filter;

    const customerName = String(
      item.customer || ""
    ).toLowerCase();

    const invoiceNumber = String(
      item.invoice || ""
    ).toLowerCase();

    const search = searchTerm.toLowerCase();

    const searchMatch =
      customerName.includes(search) ||
      invoiceNumber.includes(search);

    return statusMatch && searchMatch;
  });

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString();
    } catch {
      return "-";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "read":
        return "Read";

      case "delivered":
        return "Delivered";

      case "sent":
        return "Sent";

      case "failed":
        return "Failed";

      case "pending":
        return "Pending";

      default:
        return "Pending";
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "read":
        return "bg-blue-100 text-blue-700";

      case "delivered":
        return "bg-green-100 text-green-700";

      case "sent":
        return "bg-gray-100 text-gray-700";

      case "failed":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "read":
        return "\u{1F441}\u{FE0F}";
      case "delivered":
        return "\u2713\u2713";
      case "sent":
        return "\u{1F4E9}";
      case "failed":
        return "\u274C";
      case "pending":
        return "\u23F3";
      default:
        return "\u23F3";
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 p-3 sm:p-4 lg:p-8">
      <div className="mx-auto w-full max-w-7xl min-w-0">

        {/* HEADER */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Bill Delivery Status
          </h1>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Monitor WhatsApp bill delivery.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            <p className="font-semibold text-gray-600">
              Loading...
            </p>
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5 lg:gap-6">

              {/* TOTAL */}
              <div className="min-w-0 rounded-2xl bg-white p-4 shadow sm:p-6">
                <p className="text-xs text-gray-500 sm:text-sm">
                  Total Bills
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                  {data.length}
                </h2>
              </div>

              {/* DELIVERED */}
              <div className="min-w-0 rounded-2xl bg-white p-4 shadow sm:p-6">
                <p className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
                  <span className="font-bold text-green-600">
                    ✓✓
                  </span>
                  <span>Delivered</span>
                </p>

                <h2 className="mt-1 text-2xl font-bold text-green-600 sm:text-3xl">
                  {deliveredCount}
                </h2>
              </div>

              {/* READ */}
              <div className="min-w-0 rounded-2xl bg-white p-4 shadow sm:p-6">
                <p className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
                  <span className="font-bold text-blue-600">
                    ✓✓
                  </span>
                  <span>Read</span>
                </p>

                <h2 className="mt-1 text-2xl font-bold text-blue-600 sm:text-3xl">
                  {readCount}
                </h2>
              </div>

              {/* FAILED */}
              <div className="min-w-0 rounded-2xl bg-white p-4 shadow sm:p-6">
                <p className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
                  <span className="font-bold text-red-600">
                    !
                  </span>
                  <span>Failed</span>
                </p>

                <h2 className="mt-1 text-2xl font-bold text-red-600 sm:text-3xl">
                  {failedCount}
                </h2>
              </div>

              {/* NOT SENT */}
              <div className="min-w-0 rounded-2xl bg-white p-4 shadow sm:p-6">
                <p className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
                  <span className="font-bold text-orange-600">
                    !
                  </span>
                  <span>Not Sent</span>
                </p>

                <h2 className="mt-1 text-2xl font-bold text-orange-600 sm:text-3xl">
                  {notSentCount}
                </h2>
              </div>
            </div>

            {/* SEARCH */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search customer or invoice..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 md:w-96"
              />
            </div>

            {/* FILTERS */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 sm:gap-3">

              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setFilter("sent")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                  filter === "sent"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Sent
              </button>

              <button
                type="button"
                onClick={() => setFilter("delivered")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                  filter === "delivered"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Delivered
              </button>

              <button
                type="button"
                onClick={() => setFilter("read")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                  filter === "read"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Read
              </button>

              <button
                type="button"
                onClick={() => setFilter("failed")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                  filter === "failed"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Failed
              </button>
            </div>

            {/* EMPTY STATE */}
            {filteredData.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center shadow">
                <p className="font-semibold text-gray-700">
                  No bill delivery records found.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Try changing your search or filter.
                </p>
              </div>
            )}

            {/* DESKTOP TABLE */}
            {filteredData.length > 0 && (
              <div className="hidden overflow-x-auto rounded-2xl bg-white shadow md:block">
                <table className="w-full min-w-0 table-fixed">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Customer
                      </th>

                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Invoice
                      </th>

                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Month
                      </th>

                      <th className="p-4 text-center text-sm font-semibold text-gray-700">
                        Status
                      </th>

                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Reason
                      </th>

                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Sent At
                      </th>

                      <th className="p-4 text-left text-sm font-semibold text-gray-700">
                        Timeline
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredData.map((item) => (
                      <tr
                        key={item.billId}
                        className="border-t border-gray-100 hover:bg-slate-50"
                      >
                        <td className="p-4">
                          <p className="font-semibold text-gray-800">
                            {item.customer || "-"}
                          </p>
                        </td>

                        <td className="p-4 text-sm text-gray-700">
                          {item.invoice || "-"}
                        </td>

                        <td className="p-4 text-sm text-gray-700">
                          {item.month || "-"}/
                          {item.year || "-"}
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${getStatusClasses(
                              item.status
                            )}`}
                          >
                            <span>
                              {getStatusIcon(
                                item.status
                              )}
                            </span>

                            <span>
                              {getStatusLabel(
                                item.status
                              )}
                            </span>
                          </span>
                        </td>

                        <td className="max-w-[220px] p-4 text-sm text-gray-600">
                          {item.reason || "-"}
                        </td>

                        <td className="p-4 text-sm text-gray-600">
                          {formatDate(item.sentAt)}
                        </td>

                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-2 text-sm">

                            {item.sentAt && (
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 font-bold text-gray-500">
                                  📩
                                </span>

                                <div>
                                  <p className="font-semibold text-gray-700">
                                    Sent
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {formatDate(
                                      item.sentAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {item.deliveredAt && (
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 font-bold text-green-600">
                                  ✓✓</span>

                                <div>
                                  <p className="font-semibold text-green-600">
                                    Delivered
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {formatDate(
                                      item.deliveredAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {item.readAt && (
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 font-bold text-blue-600">
                                  👁️</span>

                                <div>
                                  <p className="font-semibold text-blue-600">
                                    Read
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {formatDate(
                                      item.readAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {item.failedAt && (
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 font-bold text-red-600">
                                  ❌</span>

                                <div>
                                  <p className="font-semibold text-red-600">
                                    Failed
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {formatDate(
                                      item.failedAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {item.status === "failed" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRetry(
                                    item.billId
                                  )
                                }
                                className="mt-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                              >
                                Retry Bill
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MOBILE CARDS */}
            {filteredData.length > 0 && (
              <div className="space-y-3 md:hidden">
                {filteredData.map((item) => (
                  <div
                    key={item.billId}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >

                    {/* CUSTOMER + STATUS */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Customer
                        </p>

                        <p className="mt-1 truncate text-base font-bold text-gray-800">
                          {item.customer || "-"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap ${getStatusClasses(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    {/* BILL DETAILS */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-gray-500">
                          Invoice
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-gray-800">
                          {item.invoice || "-"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-gray-500">
                          Month
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-800">
                          {item.month || "-"}/
                          {item.year || "-"}
                        </p>
                      </div>
                    </div>

                    {/* REASON */}
                    {item.reason && (
                      <div className="mt-3 rounded-xl bg-orange-50 p-3">
                        <p className="text-xs font-semibold text-orange-700">
                          Reason
                        </p>

                        <p className="mt-1 break-words text-sm text-orange-900">
                          {item.reason}
                        </p>
                      </div>
                    )}

                    {/* TIMELINE */}
                   <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                     <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                       Delivery Timeline
                     </p>
                     <div className="space-y-3">
                       {item.sentAt && (
                         <div className="flex items-start gap-3">
                           <span className="shrink-0 text-base leading-5">
                             {"\u{1F4E9}"}
                           </span>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-gray-700">
                               Sent
                             </p>
                             <p className="break-words text-xs text-gray-500">
                               {formatDate(item.sentAt)}
                             </p>
                           </div>
                         </div>
                       )}
                       {item.deliveredAt && (
                         <div className="flex items-start gap-3">
                           <span className="shrink-0 text-base font-bold leading-5 text-green-600">
                             {"\u2713\u2713"}
                           </span>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-green-700">
                               Delivered
                             </p>
                             <p className="break-words text-xs text-gray-500">
                               {formatDate(item.deliveredAt)}
                             </p>
                           </div>
                         </div>
                       )}
                       {item.readAt && (
                         <div className="flex items-start gap-3">
                           <span className="shrink-0 text-base leading-5">
                             {"\u{1F441}\u{FE0F}"}
                           </span>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-blue-700">
                               Read
                             </p>
                             <p className="break-words text-xs text-gray-500">
                               {formatDate(item.readAt)}
                             </p>
                           </div>
                         </div>
                       )}
                       {item.failedAt && (
                         <div className="flex items-start gap-3">
                           <span className="shrink-0 text-base leading-5">
                             {"\u274C"}
                           </span>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-red-700">
                               Failed
                             </p>
                             <p className="break-words text-xs text-gray-500">
                               {formatDate(item.failedAt)}
                             </p>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                   {/* RETRY */}
                    {item.status === "failed" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRetry(item.billId)
                        }
                        className="mt-4 w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-600 active:scale-[0.98]"
                      >
                        Retry Bill Delivery
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}