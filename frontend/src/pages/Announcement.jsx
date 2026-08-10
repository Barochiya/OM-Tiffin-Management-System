import { useEffect, useMemo, useState } from "react";
import { getCustomers } from "../services/customerService";

export default function Announcement() {
  // =========================================
  // STATES
  // =========================================

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // =========================================
  // LOAD CUSTOMERS
  // =========================================

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      const res = await getCustomers(1, 1000);

      setCustomers(res?.data || []);
    } catch (error) {
      console.error("Failed to load customers:", error);

      alert(
        error?.response?.data?.message ||
          "❌ Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // FILTER CUSTOMERS BY AUDIENCE
  // =========================================

  const filteredCustomers = useMemo(() => {
    switch (audience) {
      case "active":
        return customers.filter(
          (customer) => customer.status === "Active"
        );

      case "pending":
        return customers.filter(
          (customer) => customer.paymentStatus !== "Paid"
        );

      case "lunch":
        return customers.filter(
          (customer) => customer.mealType === "Lunch"
        );

      case "dinner":
        return customers.filter(
          (customer) => customer.mealType === "Dinner"
        );

      case "both":
        return customers.filter(
          (customer) => customer.mealType === "Both"
        );

      case "all":
      default:
        return customers;
    }
  }, [customers, audience]);

  // =========================================
  // CUSTOMERS WITH PHONE NUMBERS
  // =========================================

  const customersWithPhone = useMemo(() => {
    return filteredCustomers.filter((customer) => {
      const phone =
        customer?.phone ||
        customer?.mobile ||
        customer?.whatsappNumber;

      return String(phone || "").replace(/\D/g, "").length >= 10;
    });
  }, [filteredCustomers]);

  // =========================================
  // QUICK TEMPLATES
  // =========================================

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

  // =========================================
  // PREVIEW
  // =========================================

  const showPreview = () => {
    if (!title.trim() && !message.trim()) {
      alert("Please enter an announcement title or message first.");
      return;
    }

    alert(
      `Preview Ready\n\n${title || "Announcement"}\n\n${
        message || "No message entered."
      }`
    );
  };

  // =========================================
  // SEND ANNOUNCEMENT
  // =========================================

 const sendAnnouncement = async () => {
  if (!title.trim()) {
    alert("Please enter an announcement title.");
    return;
  }

  if (!message.trim()) {
    alert("Please enter an announcement message.");
    return;
  }

  if (filteredCustomers.length === 0) {
    alert("No customers found for the selected audience.");
    return;
  }

  if (customersWithPhone.length === 0) {
    alert(
      "No customers with valid phone numbers were found."
    );
    return;
  }

  const confirmed = window.confirm(
    `Send announcement to ${customersWithPhone.length} customer(s)?`
  );

  if (!confirmed) return;

  try {
    setSending(true);

    const customerIds = customersWithPhone
      .map((customer) => customer._id)
      .filter(Boolean);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/announcements/send`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          audience,
          customerIds,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Failed to prepare announcement."
      );
    }

    console.log("Announcement API response:", data);

    alert(
      `✅ Announcement prepared successfully!\n\n` +
      `Customers: ${customerIds.length}\n\n` +
      `WhatsApp sending will be connected after Meta Production setup.`
    );
  } catch (error) {
    console.error("❌ Announcement error:", error);

    alert(
      error.message ||
        "❌ Something went wrong while sending announcement."
    );
  } finally {
    setSending(false);
  }
};

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-7xl">

          {/* =====================================
              PAGE HEADER
          ===================================== */}

          <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold text-slate-800 sm:text-3xl">
                  📢 Announcement Center
                </h1>

                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  Send announcements to your OM Tiffin customers.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
                <span className="text-xl">👥</span>

                <div>
                  <p className="text-xs text-blue-600">
                    Customers
                  </p>

                  <p className="font-bold text-blue-800">
                    {loading ? "..." : customers.length}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* =====================================
              MAIN GRID
          ===================================== */}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

            {/* =====================================
                LEFT - FORM
            ===================================== */}

            <div className="xl:col-span-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">

                {/* Announcement Title */}

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Announcement Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Holiday Notice"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Message */}

                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Message
                    </label>

                    <span className="text-xs text-slate-400">
                      {message.length} characters
                    </span>
                  </div>

                  <textarea
                    rows={9}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your announcement..."
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
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

                {/* Audience Info */}

                <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-medium text-blue-600">
                      Selected Audience
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-800">
                      {filteredCustomers.length}
                    </p>

                    <p className="text-xs text-blue-600">
                      customer(s)
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                    <p className="text-xs font-medium text-green-600">
                      Valid WhatsApp Numbers
                    </p>

                    <p className="mt-1 text-2xl font-bold text-green-800">
                      {customersWithPhone.length}
                    </p>

                    <p className="text-xs text-green-600">
                      ready for API sending
                    </p>
                  </div>

                </div>

                {/* =====================================
                    QUICK TEMPLATES
                ===================================== */}

                <div className="mb-7">

                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                      📋 Quick Templates
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Select a template to quickly prepare your announcement.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    <button
                      type="button"
                      onClick={() => applyTemplate("holiday")}
                      className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-left font-semibold text-orange-700 transition hover:bg-orange-100 active:scale-[0.99]"
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
                      type="button"
                      onClick={() => applyTemplate("festival")}
                      className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-left font-semibold text-purple-700 transition hover:bg-purple-100 active:scale-[0.99]"
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
                      type="button"
                      onClick={() => applyTemplate("delay")}
                      className="rounded-2xl border border-red-100 bg-red-50 p-4 text-left font-semibold text-red-700 transition hover:bg-red-100 active:scale-[0.99]"
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
                      type="button"
                      onClick={() => applyTemplate("menu")}
                      className="rounded-2xl border border-green-100 bg-green-50 p-4 text-left font-semibold text-green-700 transition hover:bg-green-100 active:scale-[0.99]"
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
                      type="button"
                      onClick={() => applyTemplate("payment")}
                      className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-[0.99]"
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

                {/* =====================================
                    ACTION BUTTONS
                ===================================== */}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={sendAnnouncement}
                    disabled={sending || loading}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {sending ? (
                      <>⏳ Preparing...</>
                    ) : (
                      <>📢 Send Announcement</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={showPreview}
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                  >
                    👀 Preview
                  </button>

                </div>

              </div>
            </div>

            {/* =====================================
                RIGHT - WHATSAPP PREVIEW
            ===================================== */}

            <div className="xl:col-span-1">

              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">

                <div className="mb-5">
                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                      📱
                    </div>

                    <div className="min-w-0">
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

                    <h3 className="mb-3 break-words font-bold text-slate-800">
                      {title || "Announcement Title"}
                    </h3>

                    <div className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {message ||
                        "Your announcement message will appear here..."}
                    </div>

                  </div>

                </div>

                {/* Audience Summary */}

                <div className="mt-5 rounded-2xl bg-blue-50 p-4">

                  <div className="flex items-center justify-between gap-3">

                    <div className="min-w-0">

                      <p className="text-xs font-medium text-blue-600">
                        Selected Audience
                      </p>

                      <p className="mt-1 text-lg font-bold text-blue-800">
                        {filteredCustomers.length} Customer
                        {filteredCustomers.length === 1 ? "" : "s"}
                      </p>

                      <p className="mt-1 text-xs text-blue-600">
                        {customersWithPhone.length} valid phone number
                        {customersWithPhone.length === 1 ? "" : "s"}
                      </p>

                    </div>

                    <div className="shrink-0 text-3xl">
                      👥
                    </div>

                  </div>

                </div>

                {/* API Status */}

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                  <div className="flex items-start gap-3">

                    <div className="text-xl">
                      ⚠️
                    </div>

                    <div className="min-w-0">

                      <p className="font-semibold text-amber-800">
                        WhatsApp API
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Production WhatsApp sending is currently pending
                        Meta verification. The customer selection and
                        announcement preparation are ready.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}