import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Utensils,
} from "lucide-react";
import { useCart } from "../context/CartContext";
export default function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartItemCount,
    cartTotal,
  } = useCart();
  const handleProceedToOrder = () => {
    if (!cartItems.length) {
      return;
    }
    navigate("/order-details");
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 text-slate-900 transition hover:text-blue-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Utensils size={20} />
            </div>
            <div>
              <p className="text-lg font-black leading-tight">OM Tiffin</p>
              <p className="text-xs font-semibold text-slate-500">
                Fresh • Simple • Reliable
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-700">
            <ShoppingCart size={18} />
            <span className="text-sm font-extrabold">
              {cartItemCount} {cartItemCount === 1 ? "Item" : "Items"}
            </span>
          </div>
        </div>
      </header>
      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Continue Shopping
          </Link>
          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              Your Order
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Your Cart
            </h1>
            <p className="mt-2 text-slate-500">
              Review your selected tiffin items before placing your order.
            </p>
          </div>
        </div>
        {!cartItems.length ? (
          <section className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 shadow-sm">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <ShoppingBag size={36} />
              </div>
              <h2 className="mt-6 text-2xl font-black">
                Your cart is empty
              </h2>
              <p className="mt-3 leading-7 text-slate-500">
                Add your favourite lunch or dinner tiffin from our menu and
                continue your order.
              </p>
              <Link
                to="/#menu"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg transition hover:bg-blue-700"
              >
                Explore Menu
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Cart Items */}
            <section className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div>
                  <p className="font-black">Selected Items</p>
                  <p className="text-sm text-slate-500">
                    {cartItemCount}{" "}
                    {cartItemCount === 1 ? "item" : "items"} in your cart
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Clear Cart
                </button>
              </div>
              {cartItems.map((item) => (
                <article
                  key={`${item.menuItemId}-${item.mealType}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black">
                          {item.name}
                        </h2>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                          {item.mealType}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        ₹{Number(item.price).toFixed(2)} per item
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                      <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.menuItemId,
                              item.mealType,
                              Number(item.quantity) - 1
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center text-slate-700 transition hover:bg-slate-200"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="flex h-10 min-w-10 items-center justify-center border-x border-slate-200 bg-white px-3 text-sm font-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.menuItemId,
                              item.mealType,
                              Number(item.quantity) + 1
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center text-slate-700 transition hover:bg-slate-200"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="min-w-[90px] text-right">
                        <p className="text-lg font-black">
                          ₹
                          {(
                            Number(item.price) * Number(item.quantity)
                          ).toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(
                            item.menuItemId,
                            item.mealType
                          )
                        }
                        className="rounded-xl p-2 text-red-500 transition hover:bg-red-50"
                        aria-label={`Remove ${item.name}`}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            {/* Order Summary */}
            <aside className="lg:sticky lg:top-24">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ShoppingCart size={21} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">
                      Order Summary
                    </h2>
                    <p className="text-sm text-slate-500">
                      {cartItemCount}{" "}
                      {cartItemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-500">
                      Subtotal
                    </span>
                    <span className="font-bold">
                      ₹{cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-500">
                      Delivery
                    </span>
                    <span className="font-bold text-slate-500">
                      As applicable
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black">
                        Total
                      </span>
                      <span className="text-2xl font-black text-blue-600">
                        ₹{cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleProceedToOrder}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-black text-white shadow-lg transition hover:bg-blue-700"
                >
                  Proceed to Order
                  <ArrowRight size={19} />
                </button>
                <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                  You can review your delivery details before submitting the
                  order.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
