import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { createCustomer } from "../services/customerService";

export default function AddCustomer() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
  customerName: "",
  phone: "",
  address: "",
  mealType: "Lunch",
  price: "",
  status: "Active",

  pricing: {
    pricingType: "default",

    breakfastPrice: 0,
    lunchPrice: 0,
    dinnerPrice: 0,

    extraCharge: 0,
    extraReason: "",

    discountType: "fixed",
    discount: 0,
  },
});

 const handleChange = (e) => {
  const { name, value } = e.target;

  if (
    [
      "pricingType",
      "breakfastPrice",
      "lunchPrice",
      "dinnerPrice",
      "extraCharge",
      "extraReason",
      "discountType",
      "discount",
    ].includes(name)
  ) {
    setFormData({
      ...formData,
      pricing: {
        ...formData.pricing,
        [name]:
          name === "extraReason" ||
          name === "pricingType" ||
          name === "discountType"
            ? value
            : Number(value),
      },
    });
  } else {
    setFormData({
      ...formData,
      [name]: value,
    });
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createCustomer(formData);

      alert("✅ Customer Added Successfully");

      navigate("/customers");

    } catch (error) {
      console.error("Full Error:", error);
      console.log("Response:", error.response);

      alert(
        error.response?.data?.message ||
        "❌ Failed to Add Customer"
      );
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full min-h-screen bg-slate-100">
        <Navbar />

        <div className="p-8">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl mx-auto">

            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Add Customer
            </h1>

            <p className="text-gray-500 mb-8">
              Fill customer information
            </p>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* Customer Name */}
              <div>
                <label className="block font-semibold mb-2">
                  Customer Name
                </label>

                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Enter Customer Name"
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold mb-2">
                  Phone Number
                </label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter Phone Number"
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block font-semibold mb-2">
                  Address
                </label>

                <textarea
                  rows="3"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter Address"
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>

              {/* Meal Type */}
              <div>
                <label className="block font-semibold mb-2">
                  Meal Type
                </label>

                <select
                  name="mealType"
                  value={formData.mealType}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                >
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Both">Both</option>
                </select>
              </div>


              {/* Status */}
              <div>
                <label className="block font-semibold mb-2">
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Pricing Settings */}

<div className="border rounded-xl p-6 bg-gray-50">

  <h2 className="text-xl font-bold mb-5">
    💰 Customer Pricing
  </h2>

  {/* Pricing Type */}

  <div className="mb-5">
    <label className="block font-semibold mb-2">
      Pricing Type
    </label>

    <select
      name="pricingType"
      value={formData.pricing.pricingType}
      onChange={handleChange}
      className="w-full border rounded-lg px-4 py-3"
    >
      <option value="default">
        Default Price
      </option>

      <option value="custom">
        Custom Price
      </option>
    </select>
  </div>

  {formData.pricing.pricingType === "custom" && (

    <div className="space-y-5">

      <div className="grid grid-cols-3 gap-4">

        <div>
          <label className="block mb-2">
            Breakfast Price
          </label>

          <input
            type="number"
            name="breakfastPrice"
            value={formData.pricing.breakfastPrice}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          />
        </div>

        <div>
          <label className="block mb-2">
            Lunch Price
          </label>

          <input
            type="number"
            name="lunchPrice"
            value={formData.pricing.lunchPrice}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          />
        </div>

        <div>
          <label className="block mb-2">
            Dinner Price
          </label>

          <input
            type="number"
            name="dinnerPrice"
            value={formData.pricing.dinnerPrice}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          />
        </div>

      </div>

      <div>

        <label className="block mb-2">
          Extra Charge
        </label>

        <input
          type="number"
          name="extraCharge"
          value={formData.pricing.extraCharge}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-3"
        />

      </div>

      <div>

        <label className="block mb-2">
          Extra Charge Reason
        </label>

        <input
          type="text"
          name="extraReason"
          value={formData.pricing.extraReason}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-3"
        />

      </div>

      <div className="grid grid-cols-2 gap-4">

        <div>

          <label className="block mb-2">
            Discount Type
          </label>

          <select
            name="discountType"
            value={formData.pricing.discountType}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="fixed">
              Fixed
            </option>

            <option value="percentage">
              Percentage
            </option>

          </select>

        </div>

        <div>

          <label className="block mb-2">
            Discount
          </label>

          <input
            type="number"
            name="discount"
            value={formData.pricing.discount}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3"
          />

        </div>

      </div>

    </div>

  )}

</div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                >
                  Save Customer
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/customers")}
                  className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-lg"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        </div>
      </div>
    </div>
  );
}