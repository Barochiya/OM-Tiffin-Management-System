import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { getWebsiteSettings } from "../services/websiteSettingsService";
import { createWebsiteOrder } from "../services/websiteOrderService";
export default function OrderDetails() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [onlineOrdersEnabled, setOnlineOrdersEnabled] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    mobileNumber: "",
    email: "",
    deliveryAddress: "",
    orderDate: new Date().toISOString().split("T")[0],
    specialInstructions: "",
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderError, setOrderError] = useState("");
  const [placedOrderItems, setPlacedOrderItems] = useState([]);
  const [placedOrderTotal, setPlacedOrderTotal] = useState(0);
  useEffect(() => {
    const loadWebsiteSettings = async () => {
      try {
        const response = await getWebsiteSettings();
        if (response?.success && response?.data) {
          setOnlineOrdersEnabled(
            response.data.onlineOrdersEnabled === true
          );
        }
      } catch (error) {
        console.error("Order Details Settings Error:", error);
        setOnlineOrdersEnabled(false);
      } finally {
        setSettingsLoading(false);
      }
    };
    loadWebsiteSettings();
  }, []);
  useEffect(() => {
    if (!settingsLoading && !onlineOrdersEnabled) {
      navigate("/", { replace: true });
    }
  }, [settingsLoading, onlineOrdersEnabled, navigate]);
  const handleOrderSubmit = async () => {
    setOrderMessage("");
    setOrderError("");
    if (!onlineOrdersEnabled) {
      setOrderError("Online orders are currently disabled.");
      return;
    }
    const customerName = orderForm.customerName.trim();
    const mobileNumber = orderForm.mobileNumber.trim();
    const email = orderForm.email.trim();
    const deliveryAddress = orderForm.deliveryAddress.trim();
    const orderDate = orderForm.orderDate;
    const specialInstructions = orderForm.specialInstructions.trim();
    if (!customerName) {
      setOrderError("Please enter customer name.");
      return;
    }
    if (!mobileNumber) {
      setOrderError("Please enter mobile number.");
      return;
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      setOrderError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!deliveryAddress) {
      setOrderError("Please enter delivery address.");
      return;
    }
    if (!orderDate) {
      setOrderError("Please select order date.");
      return;
    }
    if (!cartItems.length) {
      setOrderError("Your cart is empty.");
      return;
    }
    try {
      setOrderSubmitting(true);
      const response = await createWebsiteOrder({
        customerName,
        mobileNumber,
        email,
        deliveryAddress,
        orderDate,
        specialInstructions,
        items: cartItems,
        totalAmount: cartTotal,
      });
      if (response?.success) {
        setPlacedOrderItems([...cartItems]);
        setPlacedOrderTotal(cartTotal);
        setOrderMessage(
          `Order placed successfully. Order ID: ${
            response.data?._id || "Created"
          }`
        );
        clearCart();
      } else {
        setOrderError(
          response?.message || "Unable to place order."
        );
      }
    } catch (error) {
      console.error("Website Order Submit Error:", error);
      setOrderError(
        error?.response?.data?.message ||
          "Unable to place order. Please try again."
      );
    } finally {
      setOrderSubmitting(false);
    }
  };
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm">
            <Loader2
              size={20}
              className="animate-spin text-blue-600"
            />
            <span className="font-bold text-slate-700">
              Loading order settings...
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (!onlineOrdersEnabled) {
    return null;
  }
  if (!cartItems.length && !orderMessage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <ShoppingCart
              size={48}
              className="mx-auto text-slate-300"
            />
            <h1 className="mt-5 text-3xl font-black text-slate-900">
              Your cart is empty
            </h1>
            <p className="mt-3 text-slate-600">
              Please add items to your cart before proceeding to order.
            </p>
            <Link
              to="/cart"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg transition hover:bg-blue-700"
            >
              <ArrowLeft size={18} />
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Back to Cart
          </Link>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
                Order Details
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
                Complete Your Order
              </h1>
              <p className="mt-3 text-slate-600">
                Please provide your delivery details to place your
                tiffin order.
              </p>
            </div>
            {orderMessage && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                <CheckCircle2
                  size={22}
                  className="mt-0.5 shrink-0"
                />
                <div className="font-semibold">
                  {orderMessage}
                </div>
              </div>
            )}
            {orderError && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
                {orderError}
              </div>
            )}
            {!orderMessage && (
              <>
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="website-order-customer-name"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Customer Name *
                    </label>
                    <input
                      id="website-order-customer-name"
                      type="text"
                      value={orderForm.customerName}
                      onChange={(event) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          customerName: event.target.value,
                        }))
                      }
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="website-order-mobile"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Mobile Number *
                    </label>
                    <input
                      id="website-order-mobile"
                      type="tel"
                      inputMode="numeric"
                      value={orderForm.mobileNumber}
                      onChange={(event) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          mobileNumber: event.target.value,
                        }))
                      }
                      placeholder="Enter mobile number"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="website-order-email"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="website-order-email"
                      type="email"
                      value={orderForm.email}
                      onChange={(event) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="Enter email address (optional)"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="website-order-date"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Order Date *
                    </label>
                    <input
                      id="website-order-date"
                      type="date"
                      value={orderForm.orderDate}
                      onChange={(event) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          orderDate: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="website-order-address"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Delivery Address *
                    </label>
                    <textarea
                      id="website-order-address"
                      rows={3}
                      value={orderForm.deliveryAddress}
                      onChange={(event) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          deliveryAddress: event.target.value,
                        }))
                      }
                      placeholder="Enter complete delivery address"
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="website-order-instructions"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Special Instructions
                    </label>
                    <textarea
                      id="website-order-instructions"
                      rows={3}
                      value={orderForm.specialInstructions}
                      onChange={(event) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          specialInstructions: event.target.value,
                        }))
                      }
                      placeholder="Any special instructions (optional)"
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="mt-7 flex justify-end">
                  <button
                    type="button"
                    onClick={handleOrderSubmit}
                    disabled={orderSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-black text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {orderSubmitting && (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    )}
                    {orderSubmitting
                      ? "Processing..."
                      : "Place Order"}
                  </button>
                </div>
              </>
            )}
          </div>
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <ShoppingCart
                size={22}
                className="text-blue-600"
              />
              <h2 className="text-xl font-black text-slate-900">
                Order Summary
              </h2>
            </div>
            <div className="mt-6 space-y-4">
              {(orderMessage ? placedOrderItems : cartItems).map((item) => (
                <div
                  key={`${item.menuItemId}-${item.mealType}`}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4"
                >
                  <div>
                    <p className="font-bold text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.mealType} × {item.quantity}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-black text-slate-900">
                    ₹
                    {(
                      Number(item.price) *
                      Number(item.quantity)
                    ).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
              <span className="font-bold text-slate-600">
                Total
              </span>
              <span className="text-2xl font-black text-blue-700">
                ₹{(orderMessage ? placedOrderTotal : cartTotal).toFixed(0)}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
