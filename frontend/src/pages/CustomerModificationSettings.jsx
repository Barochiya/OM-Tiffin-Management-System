import { useEffect, useState } from "react";
import {
  FaBell,
  FaCheck,
  FaClock,
  FaSave,
  FaWhatsapp,
} from "react-icons/fa";
import {
  getModificationSettings,
  updateModificationSettings,
} from "../services/customerModificationSettingsService";
const DEFAULT_SETTINGS = {
  adminWhatsAppNumber1: "",
  adminWhatsAppNumber2: "",
  lunchCutoffTime: "10:30",
  dinnerCutoffTime: "17:00",
  skipTiffinEnabled: true,
  extraTiffinEnabled: true,
  mealModificationEnabled: true,
  otherRequestEnabled: true,
};
export default function CustomerModificationSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getModificationSettings();
      if (response?.data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...response.data,
        });
      }
    } catch (err) {
      console.error("Failed to load modification settings:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to load modification settings."
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadSettings();
  }, []);
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
    setMessage("");
    setError("");
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage("");
      setError("");
      const response = await updateModificationSettings(settings);
      if (response?.data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...response.data,
        });
      }
      setMessage(
        response?.message ||
          "Modification settings updated successfully."
      );
    } catch (err) {
      console.error("Failed to update modification settings:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to update modification settings."
      );
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading modification settings...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <FaClock />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Tiffin Modification Settings
            </h1>
            <p className="text-sm text-slate-500">
              Configure modification cutoffs and admin WhatsApp notifications.
            </p>
          </div>
        </div>
      </div>
      {/* Messages */}
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <FaCheck />
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* WhatsApp Notification */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <FaWhatsapp />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Admin WhatsApp Notifications
              </h2>
              <p className="text-sm text-slate-500">
                New customer modification requests will be sent to these numbers.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="adminWhatsAppNumber1"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Admin WhatsApp Number 1
              </label>
              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">+91</span>
                <input
                  id="adminWhatsAppNumber1"
                  name="adminWhatsAppNumber1"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={settings.adminWhatsAppNumber1.replace(/^\+?91/, "")}
                  onChange={(e) => handleChange({ target: { name: "adminWhatsAppNumber1", value: e.target.value.replace(/\D/g, "").slice(0, 10) } })}
                  placeholder="9876543210"
                  className="min-w-0 flex-1 px-4 py-3 outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
              Enter 10-digit WhatsApp number
              </p>
            </div>
            <div>
              <label
                htmlFor="adminWhatsAppNumber2"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Admin WhatsApp Number 2
              </label>
              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">+91</span>
                <input
                  id="adminWhatsAppNumber2"
                  name="adminWhatsAppNumber2"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={settings.adminWhatsAppNumber2.replace(/^\+?91/, "")}
                  onChange={(e) => handleChange({ target: { name: "adminWhatsAppNumber2", value: e.target.value.replace(/\D/g, "").slice(0, 10) } })}
                  placeholder="9876543210"
                  className="min-w-0 flex-1 px-4 py-3 outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
              Enter 10-digit WhatsApp number
              </p>
            </div>
          </div>
        </section>
        {/* Cutoff Times */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800">
              Modification Cutoff Times
            </h2>
            <p className="text-sm text-slate-500">
              Customer requests submitted after the applicable cutoff will be blocked.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="lunchCutoffTime"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Lunch Cutoff Time
              </label>
              <div className="relative">
                <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                <input
                  id="lunchCutoffTime"
                  name="lunchCutoffTime"
                  type="time"
                  value={settings.lunchCutoffTime}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-11 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Default: 10:30 AM
              </p>
            </div>
            <div>
              <label
                htmlFor="dinnerCutoffTime"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Dinner Cutoff Time
              </label>
              <div className="relative">
                <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                <input
                  id="dinnerCutoffTime"
                  name="dinnerCutoffTime"
                  type="time"
                  value={settings.dinnerCutoffTime}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-11 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Default: 5:00 PM
              </p>
            </div>
          </div>
        </section>
        {/* Request Types */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800">
              Request Types
            </h2>
            <p className="text-sm text-slate-500">
              Enable or disable modification request options for customers.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              {
                name: "skipTiffinEnabled",
                title: "Skip Tiffin",
                description: "Allow customers to request a tiffin skip.",
              },
              {
                name: "extraTiffinEnabled",
                title: "Extra Tiffin / Extra Item",
                description: "Allow customers to request an extra tiffin or item.",
              },
              {
                name: "mealModificationEnabled",
                title: "Modify Meal",
                description: "Allow customers to modify their meal selection.",
              },
              {
                name: "otherRequestEnabled",
                title: "Other Requests",
                description: "Allow customers to submit other modification requests.",
              },
            ].map((item) => (
              <label
                key={item.name}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-slate-50"
              >
                <div className="pr-4">
                  <p className="font-semibold text-slate-800">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>
                <input
                  type="checkbox"
                  name={item.name}
                  checked={Boolean(settings[item.name])}
                  onChange={handleChange}
                  className="h-5 w-5 shrink-0 accent-blue-600"
                />
              </label>
            ))}
          </div>
        </section>
        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <FaSave />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
