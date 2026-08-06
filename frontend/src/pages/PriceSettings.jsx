import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  getPrices,
  updatePrices,
} from "../services/customerService";

export default function PriceSettings() {
  const [prices, setPrices] = useState({
    breakfast: 40,
    lunch: 70,
    dinner: 90,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      const res = await getPrices();

      setPrices({
        breakfast: res.data.breakfast,
        lunch: res.data.lunch,
        dinner: res.data.dinner,
      });
    } catch (error) {
      console.log(error);
      alert("Failed to load prices");
    }
  };

  const handleChange = (e) => {
    setPrices({
      ...prices,
      [e.target.name]: Number(e.target.value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await updatePrices(prices);

      alert("✅ Prices Updated Successfully");
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Failed to update prices"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full min-h-screen bg-slate-100">
        <Navbar />

        <div className="p-8">

          <div className="bg-white rounded-xl shadow-md p-8 max-w-xl mx-auto">

            <h1 className="text-3xl font-bold text-slate-800">
              Meal Price Settings
            </h1>

            <p className="text-gray-500 mt-2 mb-8">
              Update default meal prices
            </p>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              <div>
                <label className="block font-semibold mb-2">
                  🍳 Breakfast Price
                </label>

                <input
                  type="number"
                  name="breakfast"
                  value={prices.breakfast}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  🍛 Lunch Price
                </label>

                <input
                  type="number"
                  name="lunch"
                  value={prices.lunch}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  🍽 Dinner Price
                </label>

                <input
                  type="number"
                  name="dinner"
                  value={prices.dinner}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
              >
                {loading
                  ? "Saving..."
                  : "💾 Save Prices"}
              </button>

            </form>

          </div>

        </div>
      </div>
    </div>
  );
}