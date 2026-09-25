import { useEffect, useMemo, useState } from "react";
import { getCustomers } from "../services/customerService";
import {
  Megaphone,
  Users,
  Send,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
export default function Announcement() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
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
          "Failed to load customers."
      );
    } finally {
      setLoading(false);
    }
  };
  // =========================================
  // CUSTOMERS WITH VALID PHONE NUMBERS
  // =========================================
  const customersWithPhone = useMemo(() => {
    return customers.filter((customer) => {
      const phone =
        customer?.phone ||
        customer?.mobile ||
        customer?.whatsappNumber;
      return (
        String(phone || "")
          .replace(/\D/g, "")
          .length >= 10
      );
    });
  }, [customers]);
  // =========================================
  // SEND ANNOUNCEMENT
  // =========================================
  const sendAnnouncement = async () => {
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (!cleanTitle) {
      alert("Please enter the announcement title.");
      return;
    }
    if (!cleanMessage) {
      alert("Please enter the announcement message.");
      return;
    }
    if (customersWithPhone.length === 0) {
      alert(
        "No customers with valid phone numbers were found."
      );
      return;
    }
    const confirmed = window.confirm(
      `Send this announcement to ${customersWithPhone.length} customer(s)?`
    );
    if (!confirmed) {
      return;
    }
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
            templateType: "custom",
            title: cleanTitle,
            message: cleanMessage,
            audience: "all",
            customerIds,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to send announcement."
        );
      }
      console.log(
        "Announcement API response:",
        data
      );
      const sent = data.data?.sent || 0;
      const failed = data.data?.failed || 0;
      const total =
        data.data?.totalCustomers ||
        customerIds.length;
      alert(
        `Announcement Sending Completed!\n\n` +
          `Total Customers: ${total}\n` +
          `WhatsApp Sent: ${sent}\n` +
          `Failed: ${failed}`
      );
      if (failed === 0) {
        setTitle("");
        setMessage("");
      }
    } catch (error) {
      console.error(
        "Announcement error:",
        error
      );
      alert(
        error.message ||
          "Something went wrong while sending announcement."
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
        <div className="mx-auto w-full max-w-5xl">
          {/* PAGE HEADER */}
          <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold text-slate-800 sm:text-3xl">
                  <Megaphone
                    className="mr-2 inline-block"
                    size={24}
                  />
                  Announcement Center
                </h1>
                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  Send WhatsApp announcements to your OM
                  Tiffin customers.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
                <Users size={18} />
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
          {/* MAIN CONTENT */}
          <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            {/* TITLE */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Announcement Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Enter announcement title"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* MESSAGE */}
            <div className="mb-7">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Announcement Message
              </label>
              <textarea
                rows={8}
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                placeholder="Type your announcement message..."
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* CUSTOMER INFO */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <Users size={22} />
                  <div>
                    <p className="text-xs font-medium text-blue-600">
                      Total Customers
                    </p>
                    <p className="mt-1 text-2xl font-bold text-blue-800">
                      {loading ? "..." : customers.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={22} />
                  <div>
                    <p className="text-xs font-medium text-green-600">
                      Valid WhatsApp Numbers
                    </p>
                    <p className="mt-1 text-2xl font-bold text-green-800">
                      {customersWithPhone.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* WHATSAPP INFO */}
            <div className="mb-7 rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <Smartphone
                  className="mt-0.5 shrink-0"
                  size={22}
                />
                <div>
                  <p className="font-semibold text-green-800">
                    WhatsApp Announcement
                  </p>
                  <p className="mt-1 text-sm leading-6 text-green-700">
                    Your title and message will be sent
                    together through the approved OM Tiffin
                    WhatsApp announcement template.
                  </p>
                </div>
              </div>
            </div>
            {/* SEND */}
            <button
              type="button"
              onClick={sendAnnouncement}
              disabled={sending || loading}
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send size={19} />
                  Send Announcement
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
