export default function RecentPayments({ payments }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-bold mb-4">
        💳 Recent Payments
      </h2>

      <table className="w-full">

        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Customer</th>
            <th className="text-center py-2">Amount</th>
            <th className="text-center py-2">Mode</th>
          </tr>
        </thead>

        <tbody>

          {payments?.length > 0 ? (

            payments.map((payment) => (

              <tr
                key={payment._id}
                className="border-b hover:bg-gray-50"
              >

                <td className="py-3">
                  {payment.customer?.customerName}
                </td>

                <td className="text-center">
                  ₹{payment.amount}
                </td>

                <td className="text-center">
                  {payment.paymentMethod}
                </td>

              </tr>

            ))

          ) : (

            <tr>

              <td
                colSpan="3"
                className="text-center py-5 text-gray-500"
              >
                No Payments
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}