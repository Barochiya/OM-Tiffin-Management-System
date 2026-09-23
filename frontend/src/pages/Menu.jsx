import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import { getPublicMenuItems } from "../services/websiteMenuService";
export default function Menu() {
  const { addToCart, cartItems } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMealType, setSelectedMealType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadMenu = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getPublicMenuItems();
      if (response?.success) {
        setMenuItems(Array.isArray(response.data) ? response.data : []);
      } else {
        setMenuItems([]);
        setError(response?.message || "Unable to load menu.");
      }
    } catch (err) {
      console.error("Public menu load error:", err);
      setMenuItems([]);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load menu. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadMenu();
  }, []);
  const mealTypes = useMemo(() => {
    const types = menuItems
      .map((item) => item?.mealType)
      .filter(Boolean)
      .map((type) => String(type));
    return ["All", ...Array.from(new Set(types))];
  }, [menuItems]);
  const filteredItems = useMemo(() => {
    if (selectedMealType === "All") {
      return menuItems;
    }
    return menuItems.filter(
      (item) =>
        String(item?.mealType || "").toLowerCase() ===
        selectedMealType.toLowerCase()
    );
  }, [menuItems, selectedMealType]);
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            Our Menu
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Explore the available OM Tiffin Service menu.
          </p>
        </div>
        {/* Meal Type Filter */}
        {!loading && !error && menuItems.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {mealTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedMealType(type)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  selectedMealType === type
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
        {/* Loading */}
        {loading && (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div className="h-6 w-2/3 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-full rounded bg-slate-200" />
                <div className="mt-2 h-4 w-4/5 rounded bg-slate-200" />
                <div className="mt-6 h-8 w-24 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}
        {/* Error */}
        {!loading && error && (
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800">
              Unable to load menu
            </h2>
            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={loadMenu}
              className="mt-5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}
        {/* Empty */}
        {!loading && !error && menuItems.length === 0 && (
          <div className="mx-auto mt-12 max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              Menu Coming Soon
            </h2>
            <p className="mt-3 text-slate-600">
              Our menu is currently being updated. Please check again soon.
            </p>
          </div>
        )}
        {/* Menu Cards */}
        {!loading && !error && filteredItems.length > 0 && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <article
                key={item._id}
                className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {item.name}
                    </h2>
                    {item.mealType && (
                      <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {item.mealType}
                      </span>
                    )}
                  </div>
                  {item.price !== undefined &&
                    item.price !== null && (
                      <div className="shrink-0 text-xl font-bold text-blue-600">
                        ₹{Number(item.price).toFixed(0)}
                      </div>
                    )}
                </div>
                {item.description && (
                  <p className="mt-5 leading-7 text-slate-600">
                    {item.description}
                  </p>
                )}
                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => addToCart(item, item.mealType)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                  >
                    Add to Cart
                  </button>
                  {(() => {
                    const cartItem = cartItems.find(
                      (cartEntry) =>
                        String(cartEntry.menuItemId) === String(item._id) &&
                        cartEntry.mealType === item.mealType
                    );
                    return cartItem ? (
                      <span className="shrink-0 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                        {cartItem.quantity} added
                      </span>
                    ) : null;
                  })()}
                </div>
              </article>
            ))}
          </div>
        )}
        {/* Filter has no results */}
        {!loading &&
          !error &&
          menuItems.length > 0 &&
          filteredItems.length === 0 && (
            <div className="mt-12 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                No menu items found
              </h2>
              <p className="mt-2 text-slate-600">
                There are no menu items available for {selectedMealType}.
              </p>
            </div>
          )}
      </section>
    </main>
  );
}





