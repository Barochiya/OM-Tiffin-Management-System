import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { getCustomers } from "../services/customerService";

export default function Announcement() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [customers, setCustomers] = useState([]);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const applyTemplate = (type) => {
    switch (type) {
      case "holiday":
        setTitle("🍱 Holiday Notice");
        setMessage(`Dear Customer,

Tomorrow OM Tiffin Service will remain CLOSED.

We apologize for the inconvenience.

Thank You 🙏`);
        break;

      case "festival":
        setTitle("🪔 Festival Wishes");
        setMessage(`Dear Customer,

OM Tiffin Service wishes you and your family a very Happy Festival.

May you always stay healthy and happy.

🎉 Thank You`);
        break;

      case "delay":
        setTitle("🚚 Delivery Delay");
        setMessage(`Dear Customer,

Today's tiffin delivery will be delayed by approximately 30 minutes.

Sorry for the inconvenience.

Thank You 🙏`);
        break;

      case "menu":
        setTitle("🍛 Today's Menu");
        setMessage(`Today's Menu

🥘 Dal Fry
🍚 Jeera Rice
🫓 Roti
🥗 Salad

Thank You`);
        break;

      case "payment":
        setTitle("💰 Payment Reminder");
        setMessage(`Dear Customer,

This is a friendly reminder that your monthly payment is pending.

Please complete it at your earliest convenience.

Thank You 🙏`);
        break;

      default:
        break;
    }
  };

  const sendAnnouncement = () => {
    let filtered = customers;

    switch (audience) {
      case "active":
        filtered = customers.filter(
          (c) => c.status === "Active"
        );
        break;

      case "pending":
        filtered = customers.filter(
          (c) => c.paymentStatus !== "Paid"
        );
        break;

      case "lunch":
        filtered = customers.filter(
          (c) => c.mealType === "Lunch"
        );
        break;

      case "dinner":
        filtered = customers.filter(
          (c) => c.mealType === "Dinner"
        );
        break;

      case "both":
        filtered = customers.filter(
          (c) => c.mealType === "Both"
        );
        break;

      default:
        filtered = customers;
    }

    alert(
      `Ready to send announcement to ${filtered.length} customers.`
    );
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 ml-64 min-h-screen bg-slate-100">
        <Navbar />

        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8">
                              <h1 className="text-3xl font-bold text-slate-800">
                📢 Announcement Center
              </h1>

              <p className="text-gray-500 mt-2">
                Send announcements to your customers.
              </p>

              {/* Announcement Title */}

              <div className="mt-8">
                <label className="font-semibold">
                  Announcement Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-2 border rounded-xl p-3"
                  placeholder="Holiday Notice"
                />
              </div>

              {/* Message */}

              <div className="mt-6">
                <label className="font-semibold">
                  Message
                </label>

                <textarea
                  rows={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full mt-2 border rounded-xl p-3"
                  placeholder="Type your announcement..."
                />
              </div>

              {/* Audience */}

              <div className="mt-6">

                <label className="font-semibold">
                  Send To
                </label>

                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full mt-2 border rounded-xl p-3"
                >
                  <option value="all">
                    👥 All Customers
                  </option>

                  <option value="active">
                    ✅ Active Customers
                  </option>

                  <option value="pending">
                    💰 Pending Payment Customers
                  </option>

                  <option value="lunch">
                    🍛 Lunch Customers
                  </option>

                  <option value="dinner">
                    🌙 Dinner Customers
                  </option>

                  <option value="both">
                    🍱 Lunch + Dinner Customers
                  </option>

                </select>

              </div>

              {/* Quick Templates */}

              <div className="mt-8">

                <h2 className="text-xl font-bold mb-4">

                  📋 Quick Templates

                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                  <button
                    onClick={() => applyTemplate("holiday")}
                    className="bg-orange-100 hover:bg-orange-200 rounded-xl p-4 font-semibold"
                  >
                    🍱 Holiday
                  </button>

                  <button
                    onClick={() => applyTemplate("festival")}
                    className="bg-purple-100 hover:bg-purple-200 rounded-xl p-4 font-semibold"
                  >
                    🪔 Festival
                  </button>

                  <button
                    onClick={() => applyTemplate("delay")}
                    className="bg-red-100 hover:bg-red-200 rounded-xl p-4 font-semibold"
                  >
                    🚚 Delivery Delay
                  </button>

                  <button
                    onClick={() => applyTemplate("menu")}
                    className="bg-green-100 hover:bg-green-200 rounded-xl p-4 font-semibold"
                  >
                    🍛 Today's Menu
                  </button>

                  <button
                    onClick={() => applyTemplate("payment")}
                    className="bg-blue-100 hover:bg-blue-200 rounded-xl p-4 font-semibold"
                  >
                    💰 Payment Reminder
                  </button>

                </div>

              </div>
                            {/* WhatsApp Preview */}

              <div className="mt-8 rounded-2xl border bg-slate-50 p-6">

                <h3 className="text-xl font-bold mb-4">
                  📱 WhatsApp Preview
                </h3>

                <div className="bg-white rounded-xl border p-5 whitespace-pre-wrap">

                  <strong>
                    {title || "Announcement Title"}
                  </strong>

                  <br />
                  <br />

                  {message ||
                    "Your announcement message will appear here..."}

                </div>

              </div>

              {/* Action Buttons */}

              <div className="mt-8 flex flex-wrap gap-4">

                <button
                  onClick={sendAnnouncement}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition"
                >
                  📢 Send Announcement
                </button>

                <button
                  onClick={() =>
                    alert(
                      `Preview for "${title || "Announcement"}"`
                    )
                  }
                  className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition"
                >
                  👀 Preview
                </button>

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}