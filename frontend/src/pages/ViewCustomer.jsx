import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { getCustomerById } from "../services/customerService";

export default function ViewCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      const res = await getCustomerById(id);
      setCustomer(res.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load customer");
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-2xl">
        Loading Customer...
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full min-h-screen bg-slate-100">
        <Navbar />

        <div className="p-8">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl mx-auto">

            <h1 className="text-3xl font-bold mb-6">
              Customer Details
            </h1>

            <div className="space-y-8">

  {/* Customer Information */}

  <div className="border rounded-xl p-6">

    <h2 className="text-xl font-bold mb-5">
      👤 Customer Information
    </h2>

    <div className="grid grid-cols-2 gap-5">

      <div>
        <p className="text-gray-500">Customer Name</p>
        <p className="font-semibold text-lg">
          {customer.customerName}
        </p>
      </div>

      <div>
        <p className="text-gray-500">Phone</p>
        <p>{customer.phone}</p>
      </div>

      <div>
        <p className="text-gray-500">Meal Type</p>
        <p>{customer.mealType}</p>
      </div>

      <div>
        <p className="text-gray-500">Status</p>

        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            customer.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {customer.status}
        </span>

      </div>

      <div className="col-span-2">
        <p className="text-gray-500">Address</p>
        <p>{customer.address}</p>
      </div>

    </div>

  </div>

  {/* Pricing */}

  <div className="border rounded-xl p-6">

    <h2 className="text-xl font-bold mb-5">
      💰 Pricing Information
    </h2>

    {customer.pricing?.pricingType === "custom" ? (

      <div className="grid grid-cols-2 gap-5">

        <div>
          <p className="text-gray-500">
            Pricing Type
          </p>

          <p className="font-semibold text-green-600">
            Custom Pricing
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Base Monthly Price
          </p>

          <p>₹{customer.price}</p>
        </div>

        <div>
          <p className="text-gray-500">
            Breakfast Price
          </p>

          <p>₹{customer.pricing.breakfastPrice}</p>
        </div>

        <div>
          <p className="text-gray-500">
            Lunch Price
          </p>

          <p>₹{customer.pricing.lunchPrice}</p>
        </div>

        <div>
          <p className="text-gray-500">
            Dinner Price
          </p>

          <p>₹{customer.pricing.dinnerPrice}</p>
        </div>

        <div>
          <p className="text-gray-500">
            Extra Charge
          </p>

          <p>
            ₹{customer.pricing.extraCharge}
          </p>
        </div>

        <div className="col-span-2">
          <p className="text-gray-500">
            Extra Charge Reason
          </p>

          <p>
            {customer.pricing.extraReason || "-"}
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Discount
          </p>

          <p>
            {customer.pricing.discount}
            {customer.pricing.discountType === "percentage"
              ? "%"
              : " ₹"}
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Discount Type
          </p>

          <p>
            {customer.pricing.discountType}
          </p>
        </div>

      </div>

    ) : (

      <div>

        <p className="text-gray-500">
          Monthly Price
        </p>

        <h2 className="text-3xl font-bold text-green-600 mt-2">
          ₹{customer.price}
        </h2>

      </div>

    )}

  </div>



  {/* Payment */}

  <div className="border rounded-xl p-6">

    <h2 className="text-xl font-bold mb-5">
      💳 Payment Information
    </h2>
   

    <div className="grid grid-cols-2 gap-5">

      <div>
        <p className="text-gray-500">
          Payment Status
        </p>

        <p
          className={
            customer.paymentStatus === "Paid"
              ? "text-green-600 font-semibold"
              : "text-red-600 font-semibold"
          }
        >
          {customer.paymentStatus}
        </p>

      </div>

      <div>
        <p className="text-gray-500">
          Pending Amount
        </p>

        <p>
          ₹{customer.pendingAmount}
        </p>
      </div>

      <div>
        <p className="text-gray-500">
          Payment Month
        </p>

        <p>
          {customer.paymentMonth}
        </p>
      </div>

      <div>
        <p className="text-gray-500">
          Payment Date
        </p>

        <p>
          {customer.paymentDate
            ? new Date(customer.paymentDate).toLocaleDateString()
            : "-"}
        </p>
      </div>
      

    </div>

  </div>

           {/* Buttons */}

<div className="flex gap-4 mt-8">

  <button
    onClick={() => navigate("/customers")}
    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
  >
    ← Back
  </button>

  <button
    onClick={() => navigate(`/edit-customer/${customer._id}`)}
    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg"
  >
    ✏ Edit Customer
  </button>

</div>

</div>

          </div>
        </div>
      </div>
    </div>
  );
}