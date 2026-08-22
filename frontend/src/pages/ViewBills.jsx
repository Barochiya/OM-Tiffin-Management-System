import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBills } from "../services/billService";
import {
  FaEye,
  FaDownload,
  FaPrint,
  FaWhatsapp,
} from "react-icons/fa";

export default function ViewBills() {
  const [bills, setBills] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const navigate = useNavigate();

  useEffect(() => {
  loadBills();

  const interval = setInterval(() => {
    loadBills();
  }, 1000);

  return () => clearInterval(interval);
}, []);

  const loadBills = async () => {
    try {
      const response =
        await getAllBills();

      setBills(response.data || []);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to load bills."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (billId) => {
  window.open(
    `/view-bills/${billId}`,
    "_blank"
  );
};

const handlePrint = (billId) => {
  const printWindow = window.open(
    `/view-bills/${billId}`,
    "_blank"
  );

  const checkLoaded = setInterval(() => {
    if (
      printWindow &&
      printWindow.document &&
      printWindow.document.readyState === "complete"
    ) {
      clearInterval(checkLoaded);

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 1000);
    }
  }, 500);
};

const handleWhatsApp = (billId) => {
  navigate(`/view-bills/${billId}`);
};

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow">
        Loading Bills...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            View Bills
          </h1>

          <p className="text-gray-500 mt-2">
            View all generated bills.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
  <table className="w-full table-fixed">
    <colgroup>
      <col className="w-[15%]" />
      <col className="w-[13%]" />
      <col className="w-[9%]" />
      <col className="w-[9%]" />
      <col className="w-[11%]" />
      <col className="w-[11%]" />
      <col className="w-[32%]" />
    </colgroup>
            <thead className="bg-gray-50">
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

                <th className="p-4 text-left">
                  Total
                </th>

                <th className="p-4 text-left">
                  Payment
                </th>

                <th className="p-4 text-left">
                  WhatsApp
                </th>

                <th className="p-4 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
  {bills.map((bill) => (
    <tr
      key={bill._id}
      className="border-t hover:bg-gray-50 transition"
    >
      <td className="p-5 font-medium">
        {bill.customer?.customerName}
      </td>

      <td className="p-5 font-mono">
        {bill.invoiceNo}
      </td>

      <td className="p-5">
        {bill.month}/{bill.year}
      </td>

      <td className="p-5 font-semibold whitespace-nowrap">
        Rs. {bill.totalAmount}
      </td>

      <td className="p-5">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            bill.status === "Paid"
              ? "bg-green-100 text-green-700"
              : bill.status === "Partial"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {bill.status}
        </span>
      </td>

     <td className="p-5">
  <span
    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
      bill.whatsappDelivery?.status === "read"
        ? "bg-blue-100 text-blue-700"
        : bill.whatsappDelivery?.status === "delivered"
        ? "bg-green-100 text-green-700"
        : bill.whatsappDelivery?.status === "sent"
        ? "bg-gray-100 text-gray-700"
        : bill.whatsappDelivery?.status === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    {bill.whatsappDelivery?.status === "read" && (
      <>

        Read
      </>
    )}

    {bill.whatsappDelivery?.status === "delivered" && (
      <>

        Delivered
      </>
    )}

    {bill.whatsappDelivery?.status === "sent" && (
      <>

        Sent
      </>
    )}

    {bill.whatsappDelivery?.status === "failed" && (
      <>

        Failed
      </>
    )}

    {![
      "read",
      "delivered",
      "sent",
      "failed",
    ].includes(
      bill.whatsappDelivery?.status
    ) && (
      <>

        Pending
      </>
    )}
  </span>
</td>

      <td className="p-4">
  <div className="grid grid-cols-2 gap-3 w-full max-w-[300px] mx-auto">
    <button
      onClick={() =>
        navigate(`/view-bills/${bill._id}`)
      }
      className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-2 text-sm text-white w-full hover:bg-blue-700 transition"
    >
      <FaEye />

      <span>View</span>
    </button>

    <button
      onClick={() =>
        handleDownload(bill._id)
      }
      className="flex items-center justify-center gap-1 rounded-lg bg-green-600 px-2 py-2 text-sm text-white w-full hover:bg-green-700 transition"
    >
      <FaDownload />

      <span>Download</span>
    </button>

    <button
      onClick={() =>
        handlePrint(bill._id)
      }
      className="flex items-center justify-center gap-1 rounded-lg bg-purple-600 px-2 py-2 text-sm text-white w-full hover:bg-purple-700 transition"
    >
      <FaPrint />

      <span>Print</span>
    </button>

    <button
      onClick={() =>
        handleWhatsApp(bill._id)
      }
      className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-2 text-sm text-white w-full hover:bg-emerald-700 transition"
    >
      <FaWhatsapp />

      <span>WhatsApp</span>
    </button>
  </div>
</td>
    </tr>
  ))}
</tbody>
          </table></div>
        {/* Mobile Bill Cards */}
        <div className="md:hidden px-3 py-5 space-y-5">
          {bills.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
              No bills found.
            </div>
          ) : (
            bills.map((bill) => (
              <div
                key={bill._id}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-md w-full"
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Customer
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-800 break-words">
                      {bill.customer?.customerName || "-"}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                      bill.status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : bill.status === "Partial"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {bill.status || "Pending"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3.5 mb-5">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">Invoice</p>
                    <p className="mt-1 text-[15px] font-semibold font-mono text-gray-800 break-all">
                      {bill.invoiceNo}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">Month</p>
                    <p className="mt-1 text-[15px] font-semibold text-gray-800">
                      {bill.month}/{bill.year}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="mt-1 text-lg font-bold text-gray-800">
                      Rs. {bill.totalAmount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-400">WhatsApp</p>
                    <span className="mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700">
                      {bill.whatsappDelivery?.status === "read"
                        ? "Read"
                        : bill.whatsappDelivery?.status === "delivered"
                        ? "Delivered"
                        : bill.whatsappDelivery?.status === "sent"
                        ? "Sent"
                        : bill.whatsappDelivery?.status === "failed"
                        ? "Failed"
                        : "Pending"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate(`/view-bills/${bill._id}`)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white"
                  >
                    <FaEye />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownload(bill._id)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-3 text-sm font-semibold text-white"
                  >
                    <FaDownload />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handlePrint(bill._id)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-3 py-3 text-sm font-semibold text-white"
                  >
                    <FaPrint />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => handleWhatsApp(bill._id)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white"
                  >
                    <FaWhatsapp />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>
    </div>
  );
}