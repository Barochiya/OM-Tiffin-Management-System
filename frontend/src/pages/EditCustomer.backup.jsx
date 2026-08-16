import { useState } from "react";
import { useNavigate } from "react-router-dom";


import {
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaUtensils,
  FaSave,
  FaArrowLeft,
  FaMoneyBillWave,
} from "react-icons/fa";

import { createCustomer } from "../services/customerService";

export default function AddCustomer() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] =
  useState("");

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

if (name === "phone") {

  const cleanPhone =
    value.replace(/\D/g, "").replace(/^91/, "");

  if (
    cleanPhone.length > 0 &&
    !/^[6-9]\d{0,9}$/.test(cleanPhone)
  ) {

    setPhoneError(
      "Invalid WhatsApp number"
    );

  } else {

    setPhoneError("");

  }

}

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

  const cleanPhone = formData.phone
    .replace(/\D/g, "")
    .replace(/^91/, "");

  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {

    setPhoneError(
      "Invalid WhatsApp number"
    );

    return;

  }

  try {

    setLoading(true);

    await createCustomer(formData);

    alert("✅ Customer Added Successfully");

    navigate("/customers");

  } catch (error) {

    console.log(error);

    alert(
      error.response?.data?.message ||
      "Failed to Add Customer"
    );

  } finally {

    setLoading(false);

  }

};
  return (
  <div className="p-4 lg:p-8">

    <div className="max-w-6xl mx-auto">

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-800">
          ➕ Add New Customer
        </h1>

        <p className="text-gray-500 mt-2">
          Register a new customer in OM Tiffin Management System
        </p>

      </div>

      {/* Main Card */}

      <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">

        {/* Customer Information */}

        <div className="flex items-center gap-3 mb-6">

          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">

            <FaUser className="text-blue-700 text-xl" />

          </div>

          <div>

            <h2 className="text-2xl font-bold">
              Customer Information
            </h2>

            <p className="text-gray-500 text-sm">
              Fill basic customer details
            </p>

          </div>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* Row 1 */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Customer Name */}

            <div>

              <label className="block font-semibold mb-2">
                Customer Name
              </label>

              <div className="relative">

                <FaUser className="absolute left-4 top-4 text-gray-400" />

                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Enter Customer Name"
                  className="w-full border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />

              </div>

            </div>

            {/* Phone */}

            <div>

              <label className="block font-semibold mb-2">
                Phone Number
              </label>

              <div className="relative">

  <FaPhone className="absolute left-4 top-4 text-gray-400" />

  <input
    type="tel"
    name="phone"
    value={formData.phone}
    onChange={handleChange}
    placeholder="9409380470"
    maxLength={13}
    className="w-full border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
    required
  />

  {phoneError && (
  <p className="text-red-600 text-sm mt-2">
    ❌ {phoneError}
  </p>
)}

</div>

            </div>

          </div>
                    {/* Address */}

          <div>

            <label className="block font-semibold mb-2">
              Address
            </label>

            <div className="relative">

              <FaMapMarkerAlt className="absolute left-4 top-4 text-gray-400" />

              <textarea
                rows="4"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter Customer Address"
                className="w-full border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                required
              />

            </div>

          </div>

          {/* Meal Type + Status */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>

              <label className="block font-semibold mb-2">
                Meal Type
              </label>

              <div className="relative">

                <FaUtensils className="absolute left-4 top-4 text-gray-400" />

                <select
                  name="mealType"
                  value={formData.mealType}
                  onChange={handleChange}
                  className="w-full border rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Breakfast">
                    Breakfast
                  </option>

                  <option value="Lunch">
                    Lunch
                  </option>

                  <option value="Dinner">
                    Dinner
                  </option>

                  <option value="Both">
                    Lunch + Dinner
                  </option>

                </select>

              </div>

            </div>

            <div>

              <label className="block font-semibold mb-2">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Active">
                  🟢 Active
                </option>

                <option value="Inactive">
                  🔴 Inactive
                </option>

              </select>

            </div>

          </div>

          {/* Pricing Card */}

          <div className="bg-slate-50 rounded-2xl border p-6">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">

                <FaMoneyBillWave className="text-green-700 text-xl" />

              </div>

              <div>

                <h2 className="text-2xl font-bold">
                  Customer Pricing
                </h2>

                <p className="text-gray-500 text-sm">
                  Configure custom pricing if required
                </p>

              </div>

            </div>
                        {/* Pricing Type */}

            <div className="mb-6">

              <label className="block font-semibold mb-2">
                Pricing Type
              </label>

              <select
                name="pricingType"
                value={formData.pricing.pricingType}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >

                <option value="default">
                  Use Default Price
                </option>

                <option value="custom">
                  Use Custom Price
                </option>

              </select>

            </div>

            {formData.pricing.pricingType === "custom" && (

              <div className="space-y-6">

                {/* Meal Prices */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  <div>

                    <label className="block font-semibold mb-2">
                      Breakfast Price
                    </label>

                    <input
                      type="number"
                      name="breakfastPrice"
                      value={formData.pricing.breakfastPrice}
                      onChange={handleChange}
                      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                  </div>

                  <div>

                    <label className="block font-semibold mb-2">
                      Lunch Price
                    </label>

                    <input
                      type="number"
                      name="lunchPrice"
                      value={formData.pricing.lunchPrice}
                      onChange={handleChange}
                      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                  </div>

                  <div>

                    <label className="block font-semibold mb-2">
                      Dinner Price
                    </label>

                    <input
                      type="number"
                      name="dinnerPrice"
                      value={formData.pricing.dinnerPrice}
                      onChange={handleChange}
                      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                  </div>

                </div>
                                {/* Extra Charge */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>

                    <label className="block font-semibold mb-2">
                      Extra Charge
                    </label>

                    <input
                      type="number"
                      name="extraCharge"
                      value={formData.pricing.extraCharge}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                  </div>

                  <div>

                    <label className="block font-semibold mb-2">
                      Reason
                    </label>

                    <input
                      type="text"
                      name="extraReason"
                      value={formData.pricing.extraReason}
                      onChange={handleChange}
                      placeholder="Optional"
                      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                  </div>

                </div>

                {/* Discount */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>

                    <label className="block font-semibold mb-2">
                      Discount Type
                    </label>

                    <select
                      name="discountType"
                      value={formData.pricing.discountType}
                      onChange={handleChange}
                      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="fixed">
                        Fixed ₹
                      </option>

                      <option value="percentage">
                        Percentage %
                      </option>

                    </select>

                  </div>

                  <div>

                    <label className="block font-semibold mb-2">
                      Discount
                    </label>

                    <input
                      type="number"
                      name="discount"
                      value={formData.pricing.discount}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                  </div>

                </div>

              </div>

            )}

          </div>

          {/* Buttons */}

          <div className="flex flex-col md:flex-row gap-4 pt-4">

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 font-bold flex justify-center items-center gap-2 transition disabled:bg-gray-400"
            >

              <FaSave />

              {loading
                ? "Saving..."
                : "Save Customer"}

            </button>

            <button
              type="button"
              onClick={() => navigate("/customers")}
              className="flex-1 border border-gray-300 rounded-xl py-3 font-semibold hover:bg-gray-100 flex justify-center items-center gap-2"
            >

              <FaArrowLeft />

              Back

            </button>

          </div>

        </form>

      </div>

    </div>

  </div>

);
}