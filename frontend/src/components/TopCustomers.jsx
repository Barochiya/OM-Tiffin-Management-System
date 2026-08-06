export default function TopCustomers({ customers }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-bold mb-4">
        👥 Top Customers
      </h2>

      <table className="w-full">

        <thead>
          <tr className="border-b">
            <th className="text-left py-2">
              Customer
            </th>

            <th className="text-center py-2">
              Status
            </th>
          </tr>
        </thead>

        <tbody>

          {customers?.length > 0 ? (

            customers.map((customer) => (

              <tr
                key={customer._id}
                className="border-b hover:bg-gray-50"
              >
                <td className="py-3">
                  {customer.customerName}
                </td>

                <td className="text-center">

                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                    {customer.status}
                  </span>

                </td>

              </tr>

            ))

          ) : (

            <tr>
              <td
                colSpan="2"
                className="text-center py-5 text-gray-500"
              >
                No Customers
              </td>
            </tr>

          )}

        </tbody>

      </table>

    </div>
  );
}