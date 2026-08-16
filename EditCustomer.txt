import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getCustomerById,
  updateCustomer,
} from "../services/customerService";

const emptyForm = {
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
};

export default function EditCustomer() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);

      const response = await getCustomerById(id);
      const customer = response?.data || response;

      setFormData({
        customerName: customer?.customerName || "",
        phone: customer?.phone || "",
        address: customer?.address || "",
        mealType: customer?.mealType || "Lunch",
        price: customer?.price ?? "",
        status: customer?.status || "Active",

        pricing: {
          pricingType:
            customer?.pricing?.pricingType || "default",

          breakfastPrice:
            customer?.pricing?.breakfastPrice ?? 0,

          lunchPrice:
            customer?.pricing?.lunchPrice ?? 0,

          dinnerPrice:
            customer?.pricing?.dinnerPrice ?? 0,

          extraCharge:
            customer?.pricing?.extraCharge ?? 0,

          extraReason:
            customer?.pricing?.extraReason || "",

          discountType:
            customer?.pricing?.discountType || "fixed",

          discount:
            customer?.pricing?.discount ?? 0,
        },
      });
    } catch (error) {
      console.error("Load customer error:", error);

      alert(
        error.response?.data?.message ||
          "❌ Failed to load customer"
      );

      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    const pricingFields = [
      "pricingType",
      "breakfastPrice",
      "lunchPrice",
      "dinnerPrice",
      "extraCharge",
      "extraReason",
      "discountType",
      "discount",
    ];

    if (pricingFields.includes(name)) {
      setFormData((previous) => ({
        ...previous,
        pricing: {
          ...previous.pricing,
          [name]:
            name === "pricingType" ||
            name === "discountType" ||
            name === "extraReason"
              ? value
              : Number(value),
        },
      }));
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "price"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await updateCustomer(id, formData);

      alert("✅ Customer Updated Successfully");

      navigate("/customers");
    } catch (error) {
      console.error("Update customer error:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "❌ Failed to update customer"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500">
          Loading customer...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7 lg:p-9">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              Edit Customer
            </h1>

            <p className="text-gray-500 mt-2">
              Update customer information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-semibold mb-2">
                Customer Name
              </label>

              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Address
              </label>

              <textarea
                rows="4"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block font-semibold mb-2">
                  Meal Type
                </label>

                <select
                  name="mealType"
                  value={formData.mealType}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Both">Both</option>
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
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50">
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
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 font-medium">
                        Breakfast Price
                      </label>

                      <input
                        type="number"
                        name="breakfastPrice"
                        value={formData.pricing.breakfastPrice}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">
                        Lunch Price
                      </label>

                      <input
                        type="number"
                        name="lunchPrice"
                        value={formData.pricing.lunchPrice}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">
                        Dinner Price
                      </label>

                      <input
                        type="number"
                        name="dinnerPrice"
                        value={formData.pricing.dinnerPrice}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      Extra Charge
                    </label>

                    <input
                      type="number"
                      name="extraCharge"
                      value={formData.pricing.extraCharge}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      Extra Charge Reason
                    </label>

                    <input
                      type="text"
                      name="extraReason"
                      value={formData.pricing.extraReason}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-medium">
                        Discount Type
                      </label>

                      <select
                        name="discountType"
                        value={formData.pricing.discountType}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="percentage">
                          Percentage
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">
                        Discount
                      </label>

                      <input
                        type="number"
                        name="discount"
                        value={formData.pricing.discount}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="sm:flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-xl font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-5 py-3 rounded-xl font-semibold"
              >
                {saving ? "Saving..." : "💾 Update Customer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
