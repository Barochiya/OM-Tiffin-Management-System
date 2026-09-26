import { useEffect, useMemo, useState } from "react";
import { getCustomers } from "../services/customerService";
import {
  Megaphone,
  Bell,
  Users,
  Send,
  Smartphone,
  CheckCircle2,
  CalendarDays,
  PartyPopper,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
const ANNOUNCEMENT_TYPES = [
  {
    value: "service",
    label: "Service Update",
    icon: Bell,
  },  {
    value: "festival",
    label: "Festival Announcement",
    icon: PartyPopper,
  },
  {
    value: "holiday",
    label: "Holiday Announcement",
    icon: CalendarDays,
  },
  {
    value: "delay",
    label: "Delivery Delay",
    icon: Truck,
  },
  {
    value: "menu",
    label: "Today's Menu",
    icon: UtensilsCrossed,
  },
];
const INITIAL_FORM = {
  title: "",
  message: "",
  festivalName: "",
  holidayDate: "",
  reason: "",
  resumeDate: "",
  delayReason: "",
  expectedTime: "",
  breakfast: "",
  lunch: "",
  dinner: "",
};
export default function Announcement() {
  const [templateType, setTemplateType] = useState("service");
  const [form, setForm] = useState(INITIAL_FORM);
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
  // FORM HELPERS
  // =========================================
  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };
  const resetForm = () => {
    setForm(INITIAL_FORM);
  };
  // =========================================
  // VALIDATION
  // =========================================
  const validateForm = () => {
    if (templateType === "custom") {
      if (!form.title.trim()) {
        alert("Please enter the announcement title.");
        return false;
      }
      if (!form.message.trim()) {
        alert("Please enter the announcement message.");
        return false;
      }
    }
    if (templateType === "service") {
      if (!form.message.trim()) {
        alert("Please enter the service update message.");
        return false;
      }
    }
    if (templateType === "festival") {
      if (!form.festivalName.trim()) {
        alert("Please enter the festival name.");
        return false;
      }
    }
    if (templateType === "holiday") {
      if (!form.holidayDate.trim()) {
        alert("Please enter the holiday date.");
        return false;
      }
      if (!form.reason.trim()) {
        alert("Please enter the holiday reason.");
        return false;
      }
      if (!form.resumeDate.trim()) {
        alert("Please enter the resume date.");
        return false;
      }
    }
    if (templateType === "delay") {
      if (!form.delayReason.trim()) {
        alert("Please enter the delay reason.");
        return false;
      }
      if (!form.expectedTime.trim()) {
        alert("Please enter the expected delivery time.");
        return false;
      }
    }
    if (templateType === "menu") {
      if (!form.breakfast.trim()) {
        alert("Please enter breakfast.");
        return false;
      }
      if (!form.lunch.trim()) {
        alert("Please enter lunch.");
        return false;
      }
      if (!form.dinner.trim()) {
        alert("Please enter dinner.");
        return false;
      }
    }
    return true;
  };
  // =========================================
  // BUILD PAYLOAD
  // =========================================
  const buildPayload = (customerIds) => {
    const payload = {
      templateType,
      audience: "all",
      customerIds,
    };
    if (templateType === "custom") {
      payload.title = form.title.trim();
      payload.message = form.message.trim();
    }
    if (templateType === "service") {
      payload.message = form.message.trim();
    }
    if (templateType === "festival") {
      payload.festivalName = form.festivalName.trim();
    }
    if (templateType === "holiday") {
      payload.holidayDate = form.holidayDate.trim();
      payload.reason = form.reason.trim();
      payload.resumeDate = form.resumeDate.trim();
    }
    if (templateType === "delay") {
      payload.delayReason = form.delayReason.trim();
      payload.expectedTime = form.expectedTime.trim();
    }
    if (templateType === "menu") {
      payload.breakfast = form.breakfast.trim();
      payload.lunch = form.lunch.trim();
      payload.dinner = form.dinner.trim();
    }
    return payload;
  };
  // =========================================
  // SEND ANNOUNCEMENT
  // =========================================
  const sendAnnouncement = async () => {
    if (!validateForm()) {
      return;
    }
    if (customersWithPhone.length === 0) {
      alert(
        "No customers with valid phone numbers were found."
      );
      return;
    }
    const selectedType =
      ANNOUNCEMENT_TYPES.find(
        (item) => item.value === templateType
      );
    const confirmed = window.confirm(
      `Send ${selectedType?.label || "announcement"} to ${customersWithPhone.length} customer(s)?`
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
          body: JSON.stringify(
            buildPayload(customerIds)
          ),
        }
      );
      const rawResponse = await response.text();
      let data = {};
      try {
        data = rawResponse
          ? JSON.parse(rawResponse)
          : {};
      } catch (parseError) {
        console.error(
          "Announcement response JSON parse failed:",
          parseError,
          rawResponse
        );
        throw new Error(
          "Server returned an invalid response."
        );
      }
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
          `Type: ${selectedType?.label || "Announcement"}\n` +
          `Total Customers: ${total}\n` +
          `WhatsApp Sent: ${sent}\n` +
          `Failed: ${failed}`
      );
      if (failed === 0) {
        resetForm();
      }
    } catch (error) {
      console.error(
        "Announcement error:",
        error
      );
      alert(
        error?.message ||
          "Something went wrong while sending announcement."
      );
    } finally {
      setSending(false);
    }
  };
  // =========================================
  // RENDER FORM
  // =========================================
  const renderFormFields = () => {
    if (templateType === "custom") {
      return (
        <>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Announcement Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                updateField(
                  "title",
                  e.target.value
                )
              }
              placeholder="Enter announcement title"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="mb-7">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Announcement Message
            </label>
            <textarea
              rows={8}
              value={form.message}
              onChange={(e) =>
                updateField(
                  "message",
                  e.target.value
                )
              }
              placeholder="Type your announcement message..."
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </>
      );
    }
    if (templateType === "service") {
      return (
        <div className="mb-7">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Service Update Message
          </label>
          <textarea
            rows={8}
            value={form.message}
            onChange={(e) =>
              updateField("message", e.target.value)
            }
            placeholder="Enter service update message..."
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      );
    }
    if (templateType === "festival") {
      return (
        <div className="mb-7">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Festival Name
          </label>
          <input
            type="text"
            value={form.festivalName}
            onChange={(e) =>
              updateField(
                "festivalName",
                e.target.value
              )
            }
            placeholder="e.g. Diwali"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      );
    }
    if (templateType === "holiday") {
      return (
        <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Holiday Date
            </label>
            <input
              type="text"
              value={form.holidayDate}
              onChange={(e) =>
                updateField(
                  "holidayDate",
                  e.target.value
                )
              }
              placeholder="e.g. 26 January"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Resume Date
            </label>
            <input
              type="text"
              value={form.resumeDate}
              onChange={(e) =>
                updateField(
                  "resumeDate",
                  e.target.value
                )
              }
              placeholder="e.g. 27 January"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Holiday Reason
            </label>
            <textarea
              rows={4}
              value={form.reason}
              onChange={(e) =>
                updateField(
                  "reason",
                  e.target.value
                )
              }
              placeholder="Enter holiday reason"
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      );
    }
    if (templateType === "delay") {
      return (
        <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Delay Reason
            </label>
            <textarea
              rows={4}
              value={form.delayReason}
              onChange={(e) =>
                updateField(
                  "delayReason",
                  e.target.value
                )
              }
              placeholder="Enter delay reason"
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Expected Delivery Time
            </label>
            <input
              type="text"
              value={form.expectedTime}
              onChange={(e) =>
                updateField(
                  "expectedTime",
                  e.target.value
                )
              }
              placeholder="e.g. 8:30 PM"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      );
    }
    if (templateType === "menu") {
      return (
        <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Breakfast
            </label>
            <input
              type="text"
              value={form.breakfast}
              onChange={(e) =>
                updateField(
                  "breakfast",
                  e.target.value
                )
              }
              placeholder="Enter breakfast"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Lunch
            </label>
            <input
              type="text"
              value={form.lunch}
              onChange={(e) =>
                updateField(
                  "lunch",
                  e.target.value
                )
              }
              placeholder="Enter lunch"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Dinner
            </label>
            <input
              type="text"
              value={form.dinner}
              onChange={(e) =>
                updateField(
                  "dinner",
                  e.target.value
                )
              }
              placeholder="Enter dinner"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      );
    }
    return null;
  };
  // =========================================
  // PAGE
  // =========================================
  return (
    <div className="min-h-screen w-full bg-slate-100">
      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-5xl">
          {/* HEADER */}
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
                  Send WhatsApp announcements to your OM Tiffin customers.
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
          {/* ANNOUNCATION TYPE */}
          <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              Announcement Type
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {ANNOUNCEMENT_TYPES.map((item) => {
                const Icon = item.icon;
                const active =
                  templateType === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setTemplateType(item.value);
                      resetForm();
                    }}
                    className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center transition ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-sm font-semibold">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* MAIN FORM */}
          <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
            {renderFormFields()}
            {/* AUDIENCE */}
            <div className="mb-7 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Users
                  className="mt-0.5 shrink-0 text-blue-700"
                  size={22}
                />
                <div>
                  <p className="font-semibold text-blue-800">
                    Audience: All Customers
                  </p>
                  <p className="mt-1 text-sm leading-6 text-blue-700">
                    This announcement will be sent to all customers
                    with a valid WhatsApp number.
                  </p>
                </div>
              </div>
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
                    The selected announcement will be sent using
                    the existing approved OM Tiffin WhatsApp template.
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
                  Send Announcement to All Customers
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
