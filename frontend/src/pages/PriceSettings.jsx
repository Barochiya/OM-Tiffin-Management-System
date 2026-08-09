import { useEffect, useState } from "react";

import {
  FaCoffee,
  FaUtensils,
  FaMoon,
  FaSave,
} from "react-icons/fa";

import {
  getPrices,
  updatePrices,
} from "../services/customerService";

export default function PriceSettings() {
  const [prices, setPrices] = useState({
    breakfast: 40,
    lunch: 90,
    dinner: 90,
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      setLoading(true);

      const res = await getPrices();

      if (res.data?.data) {
        setPrices({
          breakfast: res.data.data.breakfast,
          lunch: res.data.data.lunch,
          dinner: res.data.data.dinner,
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setPrices({
      ...prices,
      [e.target.name]: Number(e.target.value),
    });
  };

  const cards = [
    {
      title: "Breakfast",
      icon: <FaCoffee className="text-3xl" />,
      value: prices.breakfast,
      color: "text-orange-500",
      bg: "bg-orange-100",
    },
    {
      title: "Lunch",
      icon: <FaUtensils className="text-3xl" />,
      value: prices.lunch,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Dinner",
      icon: <FaMoon className="text-3xl" />,
      value: prices.dinner,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await updatePrices(prices);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
        "Failed to Update Prices"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Main Content */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page Header */}
        <div className="mb-8 text-center">

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
            💰 Meal Price Settings
          </h1>

          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Configure default meal prices for all customers.
          </p>

        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">

          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-lg p-5 sm:p-6"
            >

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-500">
                    {card.title}
                  </p>

                  <h2
                    className={`text-3xl font-bold ${card.color}`}
                  >
                    ₹{card.value}
                  </h2>
                </div>

                <div
                  className={`${card.bg} p-4 rounded-xl ${card.color}`}
                >
                  {card.icon}
                </div>

              </div>

            </div>
          ))}

        </div>

        {/* Price Form */}
        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8">

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
          >

            {/* Breakfast */}
            <div>
              <label className="block font-semibold mb-2">
                🍳 Breakfast Price
              </label>

              <input
                type="number"
                name="breakfast"
                value={prices.breakfast}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Lunch */}
            <div>
              <label className="block font-semibold mb-2">
                🍛 Lunch Price
              </label>

              <input
                type="number"
                name="lunch"
                value={prices.lunch}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {/* Dinner */}
            <div>
              <label className="block font-semibold mb-2">
                🌙 Dinner Price
              </label>

              <input
                type="number"
                name="dinner"
                value={prices.dinner}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Save Button */}
            <div className="sm:col-span-2 lg:col-span-3 mt-2">

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition flex justify-center items-center gap-3 ${
                  loading
                    ? "bg-gray-500 cursor-not-allowed"
                    : saved
                    ? "bg-green-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >

                <FaSave />

                {loading
                  ? "Saving..."
                  : saved
                  ? "✅ Prices Saved Successfully"
                  : "💾 Save Prices"}

              </button>

            </div>

          </form>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">

          <p>
            💡 These prices will be used as the default meal rates
            for new billing and daily entries.
          </p>

          <p className="mt-2">
            © 2026 OM Tiffin Management System
          </p>

        </div>

      </div>

    </div>
  );
}