import { useEffect, useState } from "react";
import {
  FaGlobe,
  FaList,
  FaShoppingCart,
  FaUsers,
  FaComments,
  FaQuestionCircle,
  FaPhone,
  FaUtensils,
  FaBell,
  FaSave,
  FaSyncAlt,
} from "react-icons/fa";
import {
  getWebsiteSettings,
  updateWebsiteSettings,
} from "../services/websiteSettingsService";
const defaultSettings = {
  websiteEnabled: true,
  plansEnabled: true,
  menuEnabled: true,
  onlineOrdersEnabled: false,
  inquiriesEnabled: true,
  customerLoginEnabled: true,
  testimonialsEnabled: true,
  faqEnabled: true,
  contactEnabled: true,
  lunchEnabled: true,
  dinnerEnabled: true,
  notificationEnabled: true,
  adminMobile1: "",
  adminMobile2: "",
};
const WebsiteSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const response = await getWebsiteSettings();
      if (response?.data) {
        setSettings({
          ...defaultSettings,
          ...response.data,
        });
      }
    } catch (err) {
      console.error("Load Website Settings Error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load website settings."
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadSettings();
  }, []);
  const handleToggle = (field) => {
    setSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const response = await updateWebsiteSettings(settings);
      if (response?.data) {
        setSettings({
          ...defaultSettings,
          ...response.data,
        });
      }
      setMessage(
        response?.message ||
          "Website settings updated successfully."
      );
    } catch (err) {
      console.error("Save Website Settings Error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save website settings."
      );
    } finally {
      setSaving(false);
    }
  };
  const ToggleRow = ({
    icon: Icon,
    title,
    description,
    field,
  }) => (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800">
            {title}
          </h3>
          <p className="text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => handleToggle(field)}
          aria-label={`${title} ${settings[field] ? "enabled" : "disabled"}`}
          aria-pressed={settings[field]}
          className={`relative h-8 w-14 shrink-0 overflow-hidden rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            settings[field]
              ? "border-blue-600 bg-blue-600"
              : "border-slate-300 bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200 ${
              settings[field]
                ? "right-1"
                : "left-1"
            }`}
          />
        </button>
        <span
          className={`min-w-[38px] text-right text-xs font-bold ${
            settings[field]
              ? "text-blue-600"
              : "text-slate-500"
          }`}
        >
          {settings[field] ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="mx-auto mb-3 animate-spin text-3xl text-blue-600" />
          <p className="text-slate-600">
            Loading website settings...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-900 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Website Settings
            </h1>
            <p className="mt-1 text-sm text-blue-100 sm:text-base">
              Manage website features and customer-facing options.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSyncAlt />
            Refresh
          </button>
        </div>
      </div>
      {/* Messages */}
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {/* Website */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Website
          </h2>
          <p className="text-sm text-slate-500">
            Control the main customer-facing website features.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <ToggleRow
            icon={FaGlobe}
            title="Website Enabled"
            description="Enable or disable the website."
            field="websiteEnabled"
          />
          <ToggleRow
            icon={FaList}
            title="Plans"
            description="Show available tiffin plans."
            field="plansEnabled"
          />
          <ToggleRow
            icon={FaUtensils}
            title="Menu"
            description="Show the food menu section."
            field="menuEnabled"
          />
          <ToggleRow
            icon={FaShoppingCart}
            title="Online Orders"
            description="Enable online ordering features."
            field="onlineOrdersEnabled"
          />
          <ToggleRow
            icon={FaUsers}
            title="Customer Login"
            description="Allow customers to access the portal."
            field="customerLoginEnabled"
          />
        </div>
      </section>
      {/* Content */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Content & Communication
          </h2>
          <p className="text-sm text-slate-500">
            Control optional website content sections.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <ToggleRow
            icon={FaComments}
            title="Inquiries"
            description="Allow customer inquiries."
            field="inquiriesEnabled"
          />
          <ToggleRow
            icon={FaComments}
            title="Testimonials"
            description="Show customer testimonials."
            field="testimonialsEnabled"
          />
          <ToggleRow
            icon={FaQuestionCircle}
            title="FAQ"
            description="Show frequently asked questions."
            field="faqEnabled"
          />
          <ToggleRow
            icon={FaPhone}
            title="Contact"
            description="Show contact information."
            field="contactEnabled"
          />
          <ToggleRow
            icon={FaBell}
            title="Notifications"
            description="Enable website notifications."
            field="notificationEnabled"
          />
        </div>
      </section>
      {/* Meal availability */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Meal Availability
          </h2>
          <p className="text-sm text-slate-500">
            Control website availability for regular meal services.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <ToggleRow
            icon={FaUtensils}
            title="Lunch"
            description="Show lunch availability."
            field="lunchEnabled"
          />
          <ToggleRow
            icon={FaUtensils}
            title="Dinner"
            description="Show dinner availability."
            field="dinnerEnabled"
          />
        </div>
      </section>
      {/* Admin Contact */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800">
            Admin Contact
          </h2>
          <p className="text-sm text-slate-500">
            Contact numbers used by website communication features.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="adminMobile1"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Admin Mobile 1
            </label>
            <input
              id="adminMobile1"
              name="adminMobile1"
              type="tel"
              value={settings.adminMobile1}
              onChange={handleChange}
              placeholder="Enter primary mobile number"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="adminMobile2"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Admin Mobile 2
            </label>
            <input
              id="adminMobile2"
              name="adminMobile2"
              type="tel"
              value={settings.adminMobile2}
              onChange={handleChange}
              placeholder="Enter secondary mobile number"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>
      {/* Save */}
      <div className="sticky bottom-3 z-10 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <FaSyncAlt className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FaSave />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};
export default WebsiteSettings;



