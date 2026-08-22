import { useEffect, useState } from "react";
import {
  getAnnouncementDeliveryStatus,
} from "../services/announcementService";

export default function AnnouncementDeliveryStatus() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // =========================================
  // LOAD ANNOUNCEMENT DELIVERY STATUS
  // =========================================

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      const response =
        await getAnnouncementDeliveryStatus();

      setData(response.data || []);
    } catch (error) {
      console.error(
        "Failed to load announcement status:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // COUNTS
  // =========================================

  const totalCount = data.length;

  const sentCount = data.filter(
    (item) => item.status === "sent"
  ).length;

  const deliveredCount = data.filter(
    (item) => item.status === "delivered"
  ).length;

  const readCount = data.filter(
    (item) => item.status === "read"
  ).length;

  const failedCount = data.filter(
    (item) => item.status === "failed"
  ).length;

  const pendingCount = data.filter(
    (item) => item.status === "pending"
  ).length;

  // =========================================
  // FILTER + SEARCH
  // =========================================

  const filteredData = data.filter((item) => {
    const statusMatch =
      filter === "all" ||
      item.status === filter;

    const search =
      searchTerm.toLowerCase().trim();

    const searchMatch =
      String(item.customerName || "")
        .toLowerCase()
        .includes(search) ||
      String(item.phoneNumber || "")
        .toLowerCase()
        .includes(search) ||
      String(item.title || "")
        .toLowerCase()
        .includes(search) ||
      String(item.templateName || "")
        .toLowerCase()
        .includes(search);

    return statusMatch && searchMatch;
  });

  // =========================================
  // STATUS BADGE
  // =========================================

  const getStatusBadge = (status) => {
    if (status === "read") {
      return (
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
          <span>&#128065;</span>
          <span>Read</span>
        </span>
      );
    }

    if (status === "delivered") {
      return (
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
          <span>&#10003;&#10003;</span>
          <span>Delivered</span>
        </span>
      );
    }

    if (status === "sent") {
      return (
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
          <span>&#10003;</span>
          <span>Sent</span>
        </span>
      );
    }

    if (status === "failed") {
      return (
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
          <span>&#10060;</span>
          <span>Failed</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
        <span>&#9203;</span>
        <span>Pending</span>
      </span>
    );
  };

  // =========================================
  // FILTER BUTTON
  // =========================================

  const filters = [
    ["all", "All"],
    ["pending", "Pending"],
    ["sent", "Sent"],
    ["delivered", "Delivered"],
    ["read", "Read"],
    ["failed", "Failed"],
  ];

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* =================================
            HEADER
        ================================= */}

        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 sm:text-3xl">
                <span className="text-3xl">
                  &#128226;
                </span>

                <span>
                  Announcement Delivery Status
                </span>
              </h1>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Monitor WhatsApp announcement delivery
                customer by customer.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <span>&#8635;</span>
              <span>Refresh</span>
            </button>

          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-700">
              Loading announcement status...
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Please wait.
            </p>
          </div>
        ) : (
          <>
            {/* =================================
               RESPONSIVE DELIVERY LIST
           ================================= */}
           {/* DESKTOP TABLE */}
           <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
             <table className="w-full table-fixed">
               <colgroup>
                 <col className="w-[14%]" />
                 <col className="w-[11%]" />
                 <col className="w-[19%]" />
                 <col className="w-[15%]" />
                 <col className="w-[11%]" />
                 <col className="w-[10%]" />
                 <col className="w-[20%]" />
               </colgroup>
               <thead className="bg-slate-100">
                 <tr>
                   <th className="p-4 text-left text-sm font-bold text-slate-700">
                     Customer
                   </th>
                   <th className="p-4 text-left text-sm font-bold text-slate-700">
                     Phone
                   </th>
                   <th className="p-4 text-left text-sm font-bold text-slate-700">
                     Announcement
                   </th>
                   <th className="p-4 text-left text-sm font-bold text-slate-700">
                     Template
                   </th>
                   <th className="p-4 text-center text-sm font-bold text-slate-700">
                     Status
                   </th>
                   <th className="p-4 text-left text-sm font-bold text-slate-700">
                     Failure Reason
                   </th>
                   <th className="p-4 text-left text-sm font-bold text-slate-700">
                     Timeline
                   </th>
                 </tr>
               </thead>
               <tbody>
                 {filteredData.length === 0 ? (
                   <tr>
                     <td
                       colSpan="7"
                       className="p-12 text-center"
                     >
                       <div className="text-4xl">
                         &#128196;
                       </div>
                       <p className="mt-3 font-semibold text-slate-700">
                         No announcement delivery
                         records found.
                       </p>
                       <p className="mt-1 text-sm text-slate-400">
                         Try changing the search or
                         status filter.
                       </p>
                     </td>
                   </tr>
                 ) : (
                   filteredData.map((item) => (
                     <tr
                       key={item._id}
                       className="border-t border-slate-200 transition hover:bg-slate-50"
                     >
                       {/* CUSTOMER */}
                       <td className="p-4 align-top">
                         <div className="break-words font-semibold text-slate-800">
                           {item.customerName || "Customer"}
                         </div>
                       </td>
                       {/* PHONE */}
                       <td className="p-4 align-top text-sm text-slate-600">
                         <div className="whitespace-nowrap">
                           {item.phoneNumber || "-"}
                         </div>
                       </td>
                       {/* ANNOUNCEMENT */}
                       <td className="p-4 align-top">
                         <div className="break-words font-semibold text-slate-800">
                           {item.title || "-"}
                         </div>
                         <div className="mt-1 truncate text-xs text-slate-500">
                           {item.message || "-"}
                         </div>
                       </td>
                       {/* TEMPLATE */}
                       <td className="p-4 align-top">
                         <span
                           className="block break-words text-sm leading-6 text-slate-600"
                           title={item.templateName || ""}
                         >
                           {item.templateName || "-"}
                         </span>
                       </td>
                       {/* STATUS */}
                       <td className="p-4 text-center align-top">
                         {getStatusBadge(item.status)}
                       </td>
                       {/* FAILURE */}
                       <td className="p-4 align-top text-sm">
                         {item.failureReason ? (
                           <span className="break-words text-red-600">
                             {item.failureReason}
                           </span>
                         ) : (
                           <span className="text-slate-400">
                             -
                           </span>
                         )}
                       </td>
                       {/* TIMELINE */}
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-3 text-sm">
                          {item.sentAt && (
                            <div className="flex min-w-0 items-start gap-2 text-slate-600">
                              <span className="shrink-0 text-center">
                                &#128228;
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold whitespace-nowrap">
                                  Sent
                                </div>
                                <div className="whitespace-nowrap text-xs font-medium text-slate-500">
                                  {new Date(item.sentAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                          {item.deliveredAt && (
                            <div className="flex min-w-0 items-start gap-2 text-green-600">
                              <span className="shrink-0 text-center font-bold">
                                &#10003;&#10003;
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold whitespace-nowrap">
                                  Delivered
                                </div>
                                <div className="whitespace-nowrap text-xs font-medium text-green-600">
                                  {new Date(item.deliveredAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                          {item.readAt && (
                            <div className="flex min-w-0 items-start gap-2 text-blue-600">
                              <span className="shrink-0 text-center">
                                &#128065;
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold whitespace-nowrap">
                                  Read
                                </div>
                                <div className="whitespace-nowrap text-xs font-medium text-blue-600">
                                  {new Date(item.readAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                          {item.status === "pending" && (
                             <div className="flex items-start gap-2 text-orange-600">
                               <span className="shrink-0 text-center">
                                 &#9203;
                               </span>
                               <span className="break-words font-medium">
                                 Waiting for WhatsApp
                               </span>
                             </div>
                           )}
                           {item.status === "failed" && (
                             <div className="flex items-start gap-2 text-red-600">
                               <span className="shrink-0 text-center">
                                 &#10060;
                               </span>
                               <span className="break-words font-medium">
                                 Sending failed
                               </span>
                             </div>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
           {/* MOBILE CARDS */}
           <div className="space-y-4 md:hidden">
             {filteredData.length === 0 ? (
               <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                 <div className="text-4xl">
                   &#128196;
                 </div>
                 <p className="mt-3 font-semibold text-slate-700">
                   No announcement delivery
                   records found.
                 </p>
                 <p className="mt-1 text-sm text-slate-400">
                   Try changing the search or
                   status filter.
                 </p>
               </div>
             ) : (
               filteredData.map((item) => (
                 <div
                   key={item._id}
                   className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm"
                 >
                   {/* CARD HEADER */}
                   <div className="flex items-start justify-between gap-3">
                     <div className="min-w-0">
                       <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                         Customer
                       </p>
                       <p className="mt-1 break-words text-base font-bold text-slate-800">
                         {item.customerName || "Customer"}
                       </p>
                     </div>
                     <div className="shrink-0">
                       {getStatusBadge(item.status)}
                     </div>
                   </div>
                   {/* PHONE */}
                   <div className="mt-4 rounded-xl bg-slate-50 p-3">
                     <p className="text-xs font-semibold text-slate-400">
                       Phone
                     </p>
                     <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                       {item.phoneNumber || "-"}
                     </p>
                   </div>
                   {/* ANNOUNCEMENT */}
                   <div className="mt-3 rounded-xl bg-slate-50 p-3">
                     <p className="text-xs font-semibold text-slate-400">
                       Announcement
                     </p>
                     <p className="mt-1 break-words font-semibold text-slate-800">
                       {item.title || "-"}
                     </p>
                     {item.message && (
                       <p className="mt-2 break-words text-sm text-slate-500">
                         {item.message}
                       </p>
                     )}
                   </div>
                   {/* TEMPLATE */}
                   <div className="mt-3 rounded-xl bg-slate-50 p-3">
                     <p className="text-xs font-semibold text-slate-400">
                       Template
                     </p>
                     <p className="mt-1 break-all text-sm text-slate-700">
                       {item.templateName || "-"}
                     </p>
                   </div>
                   {/* FAILURE */}
                   {item.failureReason && (
                     <div className="mt-3 rounded-xl bg-red-50 p-3">
                       <p className="text-xs font-semibold text-red-600">
                         Failure Reason
                       </p>
                       <p className="mt-1 break-words text-sm text-red-700">
                         {item.failureReason}
                       </p>
                     </div>
                   )}
                   {/* TIMELINE */}
                   <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                     <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                       Timeline
                     </p>
                     <div className="space-y-3">
                       {item.sentAt && (
                         <div className="flex items-start gap-3">
                           <span className="shrink-0 text-base">
                             {"\u{1F4E9}"}
                           </span>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-slate-700">
                               Sent
                             </p>
                             <p className="break-words text-xs text-slate-500">
                               {new Date(
                                 item.sentAt
                               ).toLocaleString()}
                             </p>
                           </div>
                         </div>
                       )}
                       {item.deliveredAt && (
                         <div className="flex items-start gap-3">
                           <span className="shrink-0 font-bold text-base text-green-600">
                             {"\u2713\u2713"}
                           </span>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-green-700">
                               Delivered
                             </p>
                             <p className="break-words text-xs text-slate-500">
                               {new Date(
                                 item.deliveredAt
                               ).toLocaleString()}
                             </p>
                           </div>
                         </div>
                       )}
                       {item.readAt && (
                         <div className="flex items-start gap-3">
                           <span className="shrink-0 text-base">
                             {"\u{1F441}\u{FE0F}"}
                           </span>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-blue-700">
                               Read
                             </p>
                             <p className="break-words text-xs text-slate-500">
                               {new Date(
                                 item.readAt
                               ).toLocaleString()}
                             </p>
                           </div>
                         </div>
                       )}
                       {item.status === "pending" && (
                         <div className="flex items-start gap-3">
                           <span className="shrink-0 text-base">
                             {"\u23F3"}
                           </span>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-orange-700">
                               Pending
                             </p>
                             <p className="break-words text-xs text-slate-500">
                               Waiting for WhatsApp
                             </p>
                           </div>
                         </div>
                       )}
                       {item.status === "failed" && (
                         <div className="flex items-start gap-3">
                           <span className="shrink-0 text-base">
                             {"\u274C"}
                           </span>
                           <div className="min-w-0">
                             <p className="text-sm font-semibold text-red-700">
                               Failed
                             </p>
                             <p className="break-words text-xs text-slate-500">
                               Sending failed
                             </p>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               ))
             )}
           </div>           {/* =================================
                SEARCH
            ================================= */}

            <div className="mb-5">
              <div className="relative">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                  &#128269;
                </span>

                <input
                  type="text"
                  placeholder="Search customer, phone, title or template..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>
            </div>

            {/* =================================
                FILTERS
            ================================= */}

            <div className="mb-6 flex flex-wrap gap-3">

              {filters.map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFilter(value)
                    }
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      filter === value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-700 shadow-sm hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}

            </div>

            {/* =================================
                TABLE
            ================================= */}

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1150px]">

                  <thead className="bg-slate-100">

                    <tr>

                      <th className="p-4 text-left text-sm font-bold text-slate-700">
                        Customer
                      </th>

                      <th className="p-4 text-left text-sm font-bold text-slate-700">
                        Phone
                      </th>

                      <th className="p-4 text-left text-sm font-bold text-slate-700">
                        Announcement
                      </th>

                      <th className="p-4 text-left text-sm font-bold text-slate-700">
                        Template
                      </th>

                      <th className="p-4 text-center text-sm font-bold text-slate-700">
                        Status
                      </th>

                      <th className="p-4 text-left text-sm font-bold text-slate-700">
                        Failure Reason
                      </th>

                      <th className="p-4 text-left text-sm font-bold text-slate-700">
                        Timeline
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredData.length === 0 ? (
                      <tr>

                        <td
                          colSpan="7"
                          className="p-12 text-center"
                        >

                          <div className="text-4xl">
                            &#128196;
                          </div>

                          <p className="mt-3 font-semibold text-slate-700">
                            No announcement delivery
                            records found.
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            Try changing the search or
                            status filter.
                          </p>

                        </td>

                      </tr>
                    ) : (
                      filteredData.map((item) => (
                        <tr
                          key={item._id}
                          className="border-t border-slate-200 transition hover:bg-slate-50"
                        >

                          {/* CUSTOMER */}

                          <td className="p-4 align-top">

                            <div className="font-semibold text-slate-800">
                              {item.customerName ||
                                "Customer"}
                            </div>

                          </td>

                          {/* PHONE */}

                          <td className="p-4 align-top text-sm text-slate-600">
                            {item.phoneNumber || "-"}
                          </td>

                          {/* ANNOUNCEMENT */}

                          <td className="p-4 align-top">

                            <div className="font-semibold text-slate-800">
                              {item.title || "-"}
                            </div>

                            <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {item.message || "-"}
                            </div>

                          </td>

                          {/* TEMPLATE */}

                          <td className="p-4 align-top">

                            <span className="break-all text-sm text-slate-600">
                              {item.templateName || "-"}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="p-4 text-center align-top">
                            {getStatusBadge(
                              item.status
                            )}
                          </td>

                          {/* FAILURE */}

                          <td className="max-w-xs p-4 align-top text-sm">

                            {item.failureReason ? (
                              <span className="text-red-600">
                                {item.failureReason}
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                -
                              </span>
                            )}

                          </td>

                          {/* TIMELINE */}

                          <td className="p-4 align-top">

                            <div className="flex min-w-[260px] flex-col gap-2 text-sm">

                              {/* SENT */}

                              {item.sentAt && (
                                <div className="flex items-center gap-2 text-slate-600">

                                  <span className="w-5 text-center">
                                    &#128228;
                                  </span>

                                  <span>
                                    Sent:
                                  </span>

                                  <span className="font-medium">
                                    {new Date(
                                      item.sentAt
                                    ).toLocaleString()}
                                  </span>

                                </div>
                              )}

                              {/* DELIVERED */}

                              {item.deliveredAt && (
                                <div className="flex items-center gap-2 text-green-600">

                                  <span className="w-5 text-center font-bold">
                                    &#10003;&#10003;
                                  </span>

                                  <span>
                                    Delivered:
                                  </span>

                                  <span className="font-medium">
                                    {new Date(
                                      item.deliveredAt
                                    ).toLocaleString()}
                                  </span>

                                </div>
                              )}

                              {/* READ */}

                              {item.readAt && (
                                <div className="flex items-center gap-2 text-blue-600">

                                  <span className="w-5 text-center">
                                    &#128065;
                                  </span>

                                  <span>
                                    Read:
                                  </span>

                                  <span className="font-medium">
                                    {new Date(
                                      item.readAt
                                    ).toLocaleString()}
                                  </span>

                                </div>
                              )}

                              {/* PENDING */}

                              {item.status ===
                                "pending" && (
                                <div className="flex items-center gap-2 text-orange-600">

                                  <span className="w-5 text-center">
                                    &#9203;
                                  </span>

                                  <span className="font-medium">
                                    Waiting for WhatsApp
                                  </span>

                                </div>
                              )}

                              {/* FAILED */}

                              {item.status ===
                                "failed" && (
                                <div className="flex items-center gap-2 text-red-600">

                                  <span className="w-5 text-center">
                                    &#10060;
                                  </span>

                                  <span className="font-medium">
                                    Sending failed
                                  </span>

                                </div>
                              )}

                            </div>

                          </td>

                        </tr>
                      ))
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* =================================
                FOOTER INFO
            ================================= */}

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">

              <div className="flex items-start gap-3">

                <div className="text-xl">
                  &#8505;
                </div>

                <div>

                  <p className="font-semibold text-blue-800">
                    Live Status Tracking
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    This page automatically refreshes
                    every 3 seconds. WhatsApp delivery
                    status changes are reflected
                    automatically when the webhook
                    receives Sent, Delivered and Read
                    events.
                  </p>

                </div>

              </div>

            </div>

          </>
        )}

      </div>
    </div>
  );
}