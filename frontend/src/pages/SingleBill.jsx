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
    <div className="min-h-screen bg-slate-100 p-6">
        <style>{printStyles}</style>    
      <div className="print-area max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8">

        <div className="text-center border-b pb-6 mb-8">
          <h1 className="text-4xl font-bold">
            OM TIFFIN SERVICE
          </h1>

          <p className="text-gray-500 mt-2">
            Monthly Invoice
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">

          <div className="bg-slate-50 p-6 rounded-2xl">
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

          <div className="bg-slate-50 p-6 rounded-2xl">
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

          <h2 className="text-2xl font-bold mb-4">
            Meal Summary
          </h2>

          <div className="grid md:grid-cols-4 gap-4">

            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="font-semibold">
                Breakfast Qty
              </p>

              <p className="text-2xl font-bold">
                {breakfastQty}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-xl">
              <p className="font-semibold">
                Lunch Qty
              </p>

              <p className="text-2xl font-bold">
                {lunchQty}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl">
              <p className="font-semibold">
                Dinner Qty
              </p>

              <p className="text-2xl font-bold">
                {dinnerQty}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl">
              <p className="font-semibold">
                Extra Amount
              </p>

              <p className="text-2xl font-bold">
                ₹{extraAmount}
              </p>
            </div>

          </div>

        </div>

        <div className="mb-8">

          <h2 className="text-2xl font-bold mb-4">
            Daily Details
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full border">

              <thead className="bg-slate-100">

                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Breakfast</th>
                  <th className="p-3">Lunch</th>
                  <th className="p-3">Dinner</th>
                  <th className="p-3">Extra</th>
                  <th className="p-3">Total</th>
                </tr>

              </thead>

              <tbody>

                {bill.dailyDetails?.map((day) => (
                  <tr
                    key={day._id}
                    className="border-t text-center"
                  >
                    <td className="p-3">
                      {new Date(
                        day.date
                      ).toLocaleDateString("en-IN")}
                    </td>

                    <td className="p-3">
                      {day.breakfastQty}
                    </td>

                    <td className="p-3">
                      {day.lunchQty}
                    </td>

                    <td className="p-3">
                      {day.dinnerQty}
                    </td>

                    <td className="p-3">
                      ₹{day.extraAmount}
                    </td>

                    <td className="p-3">
                      ₹{day.dailyTotal}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

        <div className="bg-slate-50 p-6 rounded-2xl">

          <h2 className="text-2xl font-bold mb-4">
            Payment Summary
          </h2>

          <div className="space-y-3">

            <p>
              <strong>Total Amount:</strong> ₹
              {bill.totalAmount}
            </p>

            <p>
              <strong>Paid Amount:</strong> ₹
              {bill.paidAmount}
            </p>

            <p>
              <strong>Pending Amount:</strong> ₹
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