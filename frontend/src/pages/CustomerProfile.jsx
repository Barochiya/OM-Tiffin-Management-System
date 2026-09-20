import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaPhone,
  FaMapMarkerAlt,
  FaBarcode,
  FaUtensils,
  FaCheckCircle,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import {
  getCustomerProfile,
  updateCustomerProfile,
  logoutCustomer,
} from "../services/customerAuthService";
const CustomerProfile = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getCustomerProfile();
      if (!result?.success || !result?.customer) {
        setError(
          result?.message || "Unable to load customer profile."
        );
        return;
      }
      const profile = result.customer;
      setCustomer(profile);
      setForm({
        customerName: profile.customerName || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        logoutCustomer();
        navigate("/customer-login", { replace: true });
        return;
      }
      setError(
        err?.response?.data?.message ||
          "Unable to load customer profile."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };
  const handleCancel = () => {
    setForm({
      customerName: customer?.customerName || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
    });
    setEditing(false);
    setError("");
    setSuccess("");
  };
  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const customerName = form.customerName.trim();
    const phone = form.phone.replace(/\D/g, "");
    const address = form.address.trim();
    if (!customerName) {
      setError("Customer name is required.");
      return;
    }
    if (customerName.length > 100) {
      setError("Customer name cannot exceed 100 characters.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }
    if (!address) {
      setError("Address is required.");
      return;
    }
    if (address.length > 500) {
      setError("Address cannot exceed 500 characters.");
      return;
    }
    try {
      setSaving(true);
      const result = await updateCustomerProfile({
        customerName,
        phone,
        address,
      });
      if (!result?.success) {
        setError(
          result?.message || "Unable to update profile."
        );
        return;
      }
      const updatedCustomer = result.customer;
      setCustomer(updatedCustomer);
      setForm({
        customerName: updatedCustomer?.customerName || "",
        phone: updatedCustomer?.phone || "",
        address: updatedCustomer?.address || "",
      });
      setEditing(false);
      setSuccess(
        result?.message ||
          "Customer profile updated successfully."
      );
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        logoutCustomer();
        navigate("/customer-login", { replace: true });
        return;
      }
      setError(
        err?.response?.data?.message ||
          "Unable to update customer profile."
      );
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-6 h-8 w-48 rounded bg-slate-200" />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-20 rounded-xl bg-slate-100" />
              <div className="h-20 rounded-xl bg-slate-100" />
              <div className="h-20 rounded-xl bg-slate-100" />
              <div className="h-20 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error || "Customer profile not found."}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <FaUserCircle className="text-3xl" />
              </div>
              <div>
                <p className="text-sm text-blue-100">
                  Customer Portal
                </p>
                <h1 className="text-2xl font-extrabold">
                  My Profile
                </h1>
              </div>
            </div>
            {!editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setError("");
                  setSuccess("");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow transition hover:bg-blue-50"
              >
                <FaEdit />
                Edit Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25"
              >
                <FaTimes />
                Cancel
              </button>
            )}
          </div>
        </div>
        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <FaCheckCircle />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSave}>
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-lg font-extrabold text-slate-800">
                  Personal Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the contact details associated with your
                  OM Tiffin account.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="customerName"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Customer Name
                  </label>
                  <div className="relative">
                    <FaUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" />
                    <input
                      id="customerName"
                      name="customerName"
                      type="text"
                      value={form.customerName}
                      onChange={handleChange}
                      maxLength={100}
                      disabled={!editing || saving}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Mobile Number
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={10}
                      disabled={!editing || saving}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Address
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-4 text-red-500" />
                    <textarea
                      id="address"
                      name="address"
                      rows={4}
                      value={form.address}
                      onChange={handleChange}
                      maxLength={500}
                      disabled={!editing || saving}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <div className="mt-1 text-right text-xs text-slate-400">
                      {form.address.length}/500
                    </div>
                  </div>
                </div>
              </div>
              {editing && (
                <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaSave />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </section>
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="mb-5 text-lg font-extrabold text-slate-800">
                Account Details
              </h2>
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                    <FaBarcode />
                    User ID / Barcode
                  </div>
                  <p className="break-all font-mono text-lg font-extrabold text-blue-800">
                    {customer.barcode || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-600">
                    <FaUtensils />
                    Meal Type
                  </div>
                  <p className="font-bold capitalize text-emerald-800">
                    {customer.mealType || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-green-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-green-600">
                    <FaCheckCircle />
                    Account Status
                  </div>
                  <p className="font-bold capitalize text-green-800">
                    {customer.status || "—"}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-400">
                User ID, meal type and account status are managed by
                OM Tiffin Service and cannot be edited from the
                customer portal.
              </p>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CustomerProfile;
