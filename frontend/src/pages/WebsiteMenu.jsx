import { useEffect, useState } from "react";
import {
  Edit,
  Plus,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../services/websiteMenuService";
const emptyForm = {
  name: "",
  description: "",
  price: "",
  mealType: "Lunch",
  isAvailable: true,
  sortOrder: 0,
};
export default function WebsiteMenu() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMenuItems();
      if (response?.success) {
        setItems(response.data || []);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Website Menu Load Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load website menu."
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadItems();
  }, []);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const name = form.name.trim();
    const price = Number(form.price);
    const sortOrder = Number(form.sortOrder);
    if (!name) {
      setError("Menu item name is required.");
      return;
    }
    if (
      form.price === "" ||
      Number.isNaN(price) ||
      price < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }
    if (Number.isNaN(sortOrder)) {
      setError("Please enter a valid sort order.");
      return;
    }
    const payload = {
      name,
      description: form.description.trim(),
      price,
      mealType: form.mealType,
      isAvailable: Boolean(form.isAvailable),
      sortOrder,
    };
    try {
      setSaving(true);
      if (editingId) {
        await updateMenuItem(editingId, payload);
        setSuccess("Menu item updated successfully.");
      } else {
        await createMenuItem(payload);
        setSuccess("Menu item added successfully.");
      }
      resetForm();
      await loadItems();
    } catch (err) {
      console.error("Website Menu Save Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to save menu item."
      );
    } finally {
      setSaving(false);
    }
  };
  const handleEdit = (item) => {
    setError("");
    setSuccess("");
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      price:
        item.price !== undefined && item.price !== null
          ? String(item.price)
          : "",
      mealType: item.mealType || "Lunch",
      isAvailable: Boolean(item.isAvailable),
      sortOrder:
        item.sortOrder !== undefined && item.sortOrder !== null
          ? item.sortOrder
          : 0,
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this menu item?"
    );
    if (!confirmed) return;
    try {
      setError("");
      setSuccess("");
      await deleteMenuItem(id);
      setSuccess("Menu item deleted successfully.");
      if (editingId === id) {
        resetForm();
      }
      await loadItems();
    } catch (err) {
      console.error("Website Menu Delete Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to delete menu item."
      );
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Utensils size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                  Website Menu
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage menu items displayed on the public website.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Menu Item
          </button>
        </div>
        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}
        {/* Form */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {editingId ? "Edit Menu Item" : "Add Menu Item"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure the item for your public website menu.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Menu Item Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Gujarati Special Tiffin"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* Price */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Price *
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g. 90"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* Meal Type */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Meal Type *
              </label>
              <select
                name="mealType"
                value={form.mealType}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Both">Both</option>
              </select>
            </div>
            {/* Sort Order */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Sort Order
              </label>
              <input
                type="number"
                name="sortOrder"
                value={form.sortOrder}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* Description */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                placeholder="Short description of the menu item..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* Availability */}
            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={form.isAvailable}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block font-bold text-slate-800">
                    Available on Website
                  </span>
                  <span className="block text-sm text-slate-500">
                    Show this item in the public menu.
                  </span>
                </span>
              </label>
            </div>
            {/* Submit */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {editingId ? (
                  <Edit size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Menu Item"
                    : "Add Menu Item"}
              </button>
            </div>
          </form>
        </div>
        {/* Menu List */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-black text-slate-900">
              Menu Items
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {items.length} item{items.length === 1 ? "" : "s"} configured.
            </p>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center text-sm font-medium text-slate-500">
              Loading menu items...
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Utensils
                size={38}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 font-bold text-slate-700">
                No menu items yet.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add your first website menu item above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900">
                        {item.name}
                      </h3>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {item.mealType}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          item.isAvailable
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.isAvailable
                          ? "Available"
                          : "Hidden"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-2 text-sm text-slate-500">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <span className="font-black text-slate-800">
                        ₹{Number(item.price || 0).toFixed(2)}
                      </span>
                      <span className="text-slate-500">
                        Sort: {item.sortOrder ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
