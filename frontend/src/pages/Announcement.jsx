import { useEffect, useState } from "react";
import { getCustomers } from "../services/customerService";

export default function Announcement() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [customers, setCustomers] = useState([]);

  // ==============================
  // Load Customers
  // ==============================
  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // ==============================
  // Quick Templates
  // ==============================
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

  // ==============================
  // Send Announcement
  // ==============================
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

  // ==============================
  // Preview
  // ==============================
  const showPreview = () => {
    alert(
      `Preview for "${title || "Announcement"}"`
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Main Content */}
      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">

        <div className="mx-auto w-full max-w-7xl">

          {/* Page Heading */}
          <div className="mb-6">

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-2xl shadow-sm">
                📢
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                  Announcement Center
                </h1>

                <p className="mt-1 text-sm text-slate-500 sm:text-base">
                  Send announcements and important updates to your customers.
                </p>
              </div>
            </div>

          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

            {/* =====================================
                LEFT - Announcement Form
            ===================================== */}
            <div className="xl:col-span-2">

              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">

                {/* Section Header */}
                <div className="mb-6 border-b border-slate-100 pb-5">

                  <h2 className="text-xl font-bold text-slate-800">
                    Create Announcement
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Write your message and select the customers who should receive it.
                  </p>

                </div>

                {/* Announcement Title */}
                <div className="mb-6">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Announcement Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Holiday Notice"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* Message */}
                <div className="mb-6">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Message
                  </label>

                  <textarea
                    rows={9}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your announcement..."
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-right text-xs text-slate-400">
                    {message.length} characters
                  </p>

                </div>

                {/* Audience */}
                <div className="mb-7">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Send To
                  </label>

                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row">

                  <button
                    onClick={sendAnnouncement}
                    className="flex-1 rounded-xl bg-green-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md"
                  >
                    📢 Send Announcement
                  </button>

                  <button
                    onClick={showPreview}
                    className="flex-1 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                  >
                    👀 Preview
                  </button>

                </div>

              </div>

            </div>

            {/* =====================================
                RIGHT - Preview
            ===================================== */}
            <div className="xl:col-span-1">

              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">

                {/* Preview Header */}
                <div className="mb-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-xl">
                      📱
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-800">
                        WhatsApp Preview
                      </h2>

                      <p className="text-xs text-slate-500">
                        Customer message preview
                      </p>
                    </div>

                  </div>

                </div>

                {/* WhatsApp Message */}
                <div className="rounded-2xl bg-slate-50 p-3">

                  <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 shadow-sm">

                    <h3 className="mb-3 font-bold text-slate-800">
                      {title || "Announcement Title"}
                    </h3>

                    <div className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {message ||
                        "Your announcement message will appear here..."}
                    </div>

                  </div>

                </div>

                {/* Customer Count */}
                <div className="mt-5 rounded-2xl bg-blue-50 p-4">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs font-medium text-blue-600">
                        Selected Audience
                      </p>

                      <p className="mt-1 text-lg font-bold text-blue-800">
                        {(() => {
                          switch (audience) {
                            case "active":
                              return customers.filter(
                                (c) => c.status === "Active"
                              ).length;

                            case "pending":
                              return customers.filter(
                                (c) => c.paymentStatus !== "Paid"
                              ).length;

                            case "lunch":
                              return customers.filter(
                                (c) => c.mealType === "Lunch"
                              ).length;

                            case "dinner":
                              return customers.filter(
                                (c) => c.mealType === "Dinner"
                              ).length;

                            case "both":
                              return customers.filter(
                                (c) => c.mealType === "Both"
                              ).length;

                            default:
                              return customers.length;
                          }
                        })()} Customers
                      </p>
                    </div>

                    <div className="text-3xl">
                      👥
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* =====================================
              Quick Templates
          ===================================== */}
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-5">

              <h2 className="text-xl font-bold text-slate-800">
                📋 Quick Templates
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a template to quickly prepare your announcement.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

              <button
                onClick={() => applyTemplate("holiday")}
                className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-left font-semibold text-orange-700 transition hover:bg-orange-100"
              >
                <div className="mb-2 text-2xl">
                  🍱
                </div>

                <div>
                  Holiday Notice
                </div>

                <p className="mt-1 text-xs font-normal text-orange-600">
                  Inform customers about holidays.
                </p>
              </button>

              <button
                onClick={() => applyTemplate("festival")}
                className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-left font-semibold text-purple-700 transition hover:bg-purple-100"
              >
                <div className="mb-2 text-2xl">
                  🪔
                </div>

                <div>
                  Festival Wishes
                </div>

                <p className="mt-1 text-xs font-normal text-purple-600">
                  Send festive greetings.
                </p>
              </button>

              <button
                onClick={() => applyTemplate("delay")}
                className="rounded-2xl border border-red-100 bg-red-50 p-4 text-left font-semibold text-red-700 transition hover:bg-red-100"
              >
                <div className="mb-2 text-2xl">
                  🚚
                </div>

                <div>
                  Delivery Delay
                </div>

                <p className="mt-1 text-xs font-normal text-red-600">
                  Notify customers about delays.
                </p>
              </button>

              <button
                onClick={() => applyTemplate("menu")}
                className="rounded-2xl border border-green-100 bg-green-50 p-4 text-left font-semibold text-green-700 transition hover:bg-green-100"
              >
                <div className="mb-2 text-2xl">
                  🍛
                </div>

                <div>
                  Today's Menu
                </div>

                <p className="mt-1 text-xs font-normal text-green-600">
                  Share today's meal menu.
                </p>
              </button>

              <button
                onClick={() => applyTemplate("payment")}
                className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <div className="mb-2 text-2xl">
                  💰
                </div>

                <div>
                  Payment Reminder
                </div>

                <p className="mt-1 text-xs font-normal text-blue-600">
                  Remind customers about pending payments.
                </p>
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}