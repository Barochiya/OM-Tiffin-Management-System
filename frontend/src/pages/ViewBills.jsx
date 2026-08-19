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

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200">
          <table className="w-full table-auto">
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

      <td className="p-5 font-semibold">
        ₹{bill.totalAmount}
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
        <span className="mr-1">👁</span>
        Read
      </>
    )}

    {bill.whatsappDelivery?.status === "delivered" && (
      <>
        <span className="mr-1">✓✓</span>
        Delivered
      </>
    )}

    {bill.whatsappDelivery?.status === "sent" && (
      <>
        <span className="mr-1">✓✓</span>
        Sent
      </>
    )}

    {bill.whatsappDelivery?.status === "failed" && (
      <>
        <span className="mr-1">❌</span>
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
        <span className="mr-1">⏳</span>
        Pending
      </>
    )}
  </span>
</td>

      <td className="p-4">
  <div className="flex flex-wrap items-center justify-center gap-2">
    <button
      onClick={() =>
        navigate(`/view-bills/${bill._id}`)
      }
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white"
    >
      <FaEye />

      <span>View</span>
    </button>

    <button
      onClick={() =>
        handleDownload(bill._id)
      }
      className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white"
    >
      <FaDownload />

      <span>Download</span>
    </button>

    <button
      onClick={() =>
        handlePrint(bill._id)
      }
      className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-white"
    >
      <FaPrint />

      <span>Print</span>
    </button>

    <button
      onClick={() =>
        handleWhatsApp(bill._id)
      }
      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-white"
    >
      <FaWhatsapp />

      <span>WhatsApp</span>
    </button>
  </div>
</td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}