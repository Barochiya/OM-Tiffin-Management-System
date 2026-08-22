import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBillById } from "../services/billService";

export default function SingleBill() {
  const { id } = useParams();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBill();
  }, []);

  const loadBill = async () => {
    try {
      const response = await getBillById(id);

      setBill(response.data);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to load bill."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-8">
        Bill not found.
      </div>
    );
  }

  const breakfastQty =
    bill.dailyDetails?.reduce(
      (sum, item) => sum + (item.breakfastQty || 0),
      0
    ) || 0;

  const lunchQty =
    bill.dailyDetails?.reduce(
      (sum, item) => sum + (item.lunchQty || 0),
      0
    ) || 0;

  const dinnerQty =
    bill.dailyDetails?.reduce(
      (sum, item) => sum + (item.dinnerQty || 0),
      0
    ) || 0;

  const extraAmount =
    bill.dailyDetails?.reduce(
      (sum, item) => sum + (item.extraAmount || 0),
      0
    ) || 0;

    const printStyles = `
@media print {

  body * {
    visibility: hidden !important;
  }

  .print-area,
  .print-area * {
    visibility: visible !important;
  }

  .print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: white !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
}

@page {
  margin: 10mm;
}
`;

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 overflow-x-hidden">
        <style>{printStyles}</style>    
      <div className="print-area max-w-5xl w-full mx-auto bg-white rounded-3xl shadow-xl p-4 sm:p-8 min-w-0">

        <div className="text-center border-b pb-5 sm:pb-6 mb-6 sm:mb-8">
          <h1 className="text-4xl font-bold">
            OM TIFFIN SERVICE
          </h1>

          <p className="text-gray-500 mt-2">
            Monthly Invoice
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">

          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl min-w-0">
            <h2 className="text-xl font-bold mb-4">
              Customer Details
            </h2>

            <p>
              <strong>Customer:</strong>{" "}
              {bill.customer?.customerName}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {bill.customer?.phone}
            </p>

            <p>
              <strong>Address:</strong>{" "}
              {bill.customer?.address}
            </p>
          </div>

          <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl min-w-0">
            <h2 className="text-xl font-bold mb-4">
              Invoice Details
            </h2>

            <p>
              <strong>Invoice No:</strong>{" "}
              {bill.invoiceNo}
            </p>

            <p>
              <strong>Month:</strong>{" "}
              {bill.month}/{bill.year}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {bill.status}
            </p>
          </div>

        </div>

        <div className="mb-8">

          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Meal Summary
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">

            <div className="bg-blue-50 p-3 sm:p-4 rounded-xl min-w-0">
              <p className="font-semibold">
                Breakfast Qty
              </p>

              <p className="text-2xl font-bold">
                {breakfastQty}
              </p>
            </div>

            <div className="bg-green-50 p-3 sm:p-4 rounded-xl min-w-0">
              <p className="font-semibold">
                Lunch Qty
              </p>

              <p className="text-2xl font-bold">
                {lunchQty}
              </p>
            </div>

            <div className="bg-purple-50 p-3 sm:p-4 rounded-xl min-w-0">
              <p className="font-semibold">
                Dinner Qty
              </p>

              <p className="text-2xl font-bold">
                {dinnerQty}
              </p>
            </div>

            <div className="bg-orange-50 p-3 sm:p-4 rounded-xl min-w-0">
              <p className="font-semibold">
                Extra Amount
              </p>

              <p className="text-2xl font-bold">
                Rs. {extraAmount}
              </p>
            </div>

          </div>

        </div>

        <div className="mb-8">

          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Daily Details
          </h2>

          <div className="block w-full max-w-full overflow-x-auto rounded-xl border border-gray-200">

            <table className="min-w-[680px] w-full border-collapse">

              <thead className="bg-slate-100">

                <tr>
                  <th className="p-3 whitespace-nowrap text-sm sm:text-base">Date</th>
                  <th className="p-3 whitespace-nowrap text-sm sm:text-base">Breakfast</th>
                  <th className="p-3 whitespace-nowrap text-sm sm:text-base">Lunch</th>
                  <th className="p-3 whitespace-nowrap text-sm sm:text-base">Dinner</th>
                  <th className="p-3 whitespace-nowrap text-sm sm:text-base">Extra</th>
                  <th className="p-3 whitespace-nowrap text-sm sm:text-base">Total</th>
                </tr>

              </thead>

              <tbody>

                {bill.dailyDetails?.map((day) => (
                  <tr
                    key={day._id}
                    className="border-t text-center"
                  >
                    <td className="p-3 whitespace-nowrap text-sm sm:text-base">
                      {new Date(
                        day.date
                      ).toLocaleDateString("en-IN")}
                    </td>

                    <td className="p-3 whitespace-nowrap text-sm sm:text-base">
                      {day.breakfastQty}
                    </td>

                    <td className="p-3 whitespace-nowrap text-sm sm:text-base">
                      {day.lunchQty}
                    </td>

                    <td className="p-3 whitespace-nowrap text-sm sm:text-base">
                      {day.dinnerQty}
                    </td>

                    <td className="p-3 whitespace-nowrap text-sm sm:text-base">
                      Rs. {day.extraAmount}
                    </td>

                    <td className="p-3 whitespace-nowrap text-sm sm:text-base">
                      Rs. {day.dailyTotal}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>
      <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl min-w-0">

          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Payment Summary
          </h2>

          <div className="space-y-3">

            <p>
              <strong>Total Amount:</strong> Rs.
              {bill.totalAmount}
            </p>

            <p>
              <strong>Paid Amount:</strong> Rs.
              {bill.paidAmount}
            </p>

            <p>
              <strong>Pending Amount:</strong> Rs.
              {bill.pendingAmount}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {bill.status}
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}
