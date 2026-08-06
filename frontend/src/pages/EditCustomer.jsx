import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  getCustomerById,
  updateCustomer,
} from "../services/customerService";

export default function EditCustomer() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

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
  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      setLoading(true);

      const res = await getCustomerById(id);

     setFormData({
  customerName: res.data.customerName,
  phone: res.data.phone,
  address: res.data.address,
  mealType: res.data.mealType,
  price: res.data.price,
  status: res.data.status,

  pricing: {
    pricingType:
      res.data.pricing?.pricingType || "default",

    breakfastPrice:
      res.data.pricing?.breakfastPrice || 0,

    lunchPrice:
      res.data.pricing?.lunchPrice || 0,

    dinnerPrice:
      res.data.pricing?.dinnerPrice || 0,

    extraCharge:
      res.data.pricing?.extraCharge || 0,

    extraReason:
      res.data.pricing?.extraReason || "",

    discountType:
      res.data.pricing?.discountType || "fixed",

    discount:
      res.data.pricing?.discount || 0,
  },
});

    } catch (error) {
      console.error(error);
      alert("Failed to load customer");
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

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
          name === "pricingType" ||
          name === "discountType" ||
          name === "extraReason"
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
      await updateCustomer(id, formData);

      alert("✅ Customer Updated Successfully");

      navigate("/customers");

    } catch (error) {
      console.error(error);

      alert(
  error.response?.data?.message ||
  "Failed to Update Customer"
);
    }
  };

if (loading) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-2xl font-semibold text-blue-600">
        Loading Customer...
      </div>
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

            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Edit Customer
            </h1>

            <p className="text-gray-500 mb-8">
              Update customer information
            </p>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              <div>
                <label className="block font-semibold mb-2">
                  Customer Name
                </label>

                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Phone Number
                </label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Address
                </label>

                <textarea
                  rows="3"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Meal Type
                </label>

                <select
                  name="mealType"
                  value={formData.mealType}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                >
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Both</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Monthly Price
                </label>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            
            {/* Pricing Settings */}

<div className="border rounded-xl p-6 bg-gray-50">

  <h2 className="text-xl font-bold mb-5">
    💰 Customer Pricing
  </h2>

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
      <option value="default">Default Price</option>
      <option value="custom">Custom Price</option>
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
            <option value="fixed">Fixed</option>
            <option value="percentage">Percentage</option>
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
              <div className="flex gap-4 pt-4">

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                >
                  💾 Update Customer
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/customers")}
                    className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-lg"
                    >
                        ↩ Cancel
                </button>

              </div>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}