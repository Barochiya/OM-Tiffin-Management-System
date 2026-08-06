export default function PendingBills({ bills }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-bold mb-4">
        ⏳ Pending Bills
      </h2>

      <table className="w-full">

        <thead>

          <tr className="border-b">

            <th className="text-left py-2">
              Invoice
            </th>

            <th className="text-left py-2">
              Customer
            </th>

            <th className="text-center py-2">
              Pending
            </th>

          </tr>

        </thead>

        <tbody>

          {bills?.length > 0 ? (

            bills.map((bill) => (

              <tr
                key={bill._id}
                className="border-b hover:bg-gray-50"
              >

                <td className="py-3">
                  {bill.invoiceNo}
                </td>

                <td>
                  {bill.customer?.customerName}
                </td>

                <td className="text-center font-semibold text-red-600">
                  ₹ {bill.pendingAmount}
                </td>

              </tr>

            ))

          ) : (

            <tr>

              <td
                colSpan="3"
                className="text-center py-5 text-gray-500"
              >
                No Pending Bills
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}