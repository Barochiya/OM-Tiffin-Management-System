import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Heart,
  MapPin,
  ShieldCheck,
  Star,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import logo from "../assets/logo.png";
import { getWebsiteSettings } from "../services/websiteSettingsService";
import { getPublicMenuItems } from "../services/websiteMenuService";
import { getPublicReviews, createPublicReview } from "../services/websiteReviewService";
import { createWebsiteOrder } from "../services/websiteOrderService";
import { useCart } from "../context/CartContext";
const plans = [
  {
    title: "Daily Tiffin",
    subtitle: "Fresh meal whenever you need it",
    price: "Starting from â‚¹90",
    icon: UtensilsCrossed,
  },
  {
    title: "Monthly Tiffin",
    subtitle: "Convenient monthly meal service",
    price: "Flexible plans",
    icon: Clock3,
  },
  {
    title: "Custom Plan",
    subtitle: "Plan your meals around your needs",
    price: "Custom pricing",
    icon: Heart,
  },
];
const benefits = [
  "Freshly prepared meals",
  "Hygienic food preparation",
  "Flexible tiffin plans",
  "Reliable daily service",
  "Customer-friendly support",
  "Easy customer management",
];
const steps = [
  {
    number: "01",
    title: "Choose Your Plan",
    text: "Select a tiffin plan that fits your daily or monthly needs.",
  },
  {
    number: "02",
    title: "Start Your Service",
    text: "Complete your details and start receiving your tiffin service.",
  },
  {
    number: "03",
    title: "Enjoy Your Meal",
    text: "Get fresh, homestyle meals with dependable daily service.",
  },
];
const testimonials = [
  {
    name: "Happy Customer",
    role: "OM Tiffin Customer",
    text: "Fresh, homestyle meals and dependable daily service make my routine much easier.",
  },
  {
    name: "Regular Customer",
    role: "OM Tiffin Customer",
    text: "The service is convenient, the meals are satisfying, and the support team is helpful.",
  },
  {
    name: "Satisfied Customer",
    role: "OM Tiffin Customer",
    text: "A simple and reliable tiffin service for everyday meal requirements.",
  },
];

const faqs = [
  {
    question: "How can I start OM Tiffin Service?",
    answer: "Choose a suitable plan, contact OM Tiffin Service, and complete your customer details to get started.",
  },
  {
    question: "Which meals are available?",
    answer: "Meal availability depends on the current OM Tiffin Service settings and the meal options enabled for your service.",
  },
  {
    question: "Can I change my meal requirements?",
    answer: "Yes. Customers can submit a modification request through the customer portal for supported changes.",
  },
  {
    question: "How does customer login work?",
    answer: "Registered customers can use their OM Tiffin customer credentials to access the customer portal and manage their account.",
  },
  {
    question: "How can I contact OM Tiffin Service?",
    answer: "Use the Contact section on this website to reach OM Tiffin Service for plan details, service information, or assistance.",
  },
  {
    question: "Are online orders currently available?",
    answer: "Online ordering depends on the Online Orders setting. When online ordering is enabled, customers can add available menu items to the cart and place an order.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);
useEffect(() => {
    document.title = "OM Tiffin Service";
  }, []);
  const {
  cartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  cartItemCount,
  cartTotal,
} = useCart();
  const [settings, setSettings] = useState({
    websiteEnabled: true,
    plansEnabled: true,
    menuEnabled: true,
    onlineOrdersEnabled: false,
    lunchEnabled: true,
    dinnerEnabled: true,
    contactEnabled: true,
    customerLoginEnabled: true,
    testimonialsEnabled: true,
  });
  useEffect(() => {
    let isMounted = true;
    const loadWebsiteSettings = async () => {
      try {
        const response = await getWebsiteSettings();
        if (isMounted && response?.success && response?.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error("Website Settings Load Error:", error);
      }
    };
    loadWebsiteSettings();
    const settingsRefreshInterval = setInterval(
      loadWebsiteSettings,
      5000
    );
    return () => {
      isMounted = false;
      clearInterval(settingsRefreshInterval);
    };
  }, []);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewForm, setReviewForm] = useState({
    customerName: "",
    rating: 0,
    reviewText: "",
  });
  useEffect(() => {
    const loadPublicMenu = async () => {
      try {
        setMenuLoading(true);
        const response = await getPublicMenuItems();
        if (response?.success) {
          setMenuItems(response.data || []);
        } else {
          setMenuItems([]);
        }
      } catch (error) {
        console.error("Public Website Menu Load Error:", error);
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };
    loadPublicMenu();
  }, []);
  useEffect(() => {
    let isMounted = true;

    const loadPublicReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await getPublicReviews();

        if (isMounted && response?.success) {
          setReviews(response.data || []);
        } else if (isMounted) {
          setReviews([]);
        }
      } catch (error) {
        console.error("Public Website Reviews Load Error:", error);
        if (isMounted) {
          setReviews([]);
        }
      } finally {
        if (isMounted) {
          setReviewsLoading(false);
        }
      }
    };

    loadPublicReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  // PUBLIC_REVIEW_AUTO_REFRESH_30S
  useEffect(() => {
    let isMounted = true;

    const refreshPublicReviews = async () => {
      try {
        const response = await getPublicReviews();

        if (isMounted && response?.success) {
          setReviews(response.data || []);
        }
      } catch (error) {
        console.error("Public Website Reviews Auto Refresh Error:", error);
      }
    };

    const intervalId = setInterval(refreshPublicReviews, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);
  if (!settings.websiteEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
          <img
            src={logo}
            alt="OM Tiffin Service"
            className="mx-auto h-24 w-24 rounded-full border border-slate-200 object-cover"
          />
          <h1 className="mt-6 text-3xl font-black text-slate-900">
            OM Tiffin Service
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Website is temporarily unavailable.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Please contact OM Tiffin Service for assistance.
          </p>
          <a
            href="tel:9409380470"
            className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            Contact Us
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Hero */}
      {/* Hero */}
      <main>
        <section
          id="home"
          className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700"
        >
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div className="text-white">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                <Star size={16} className="fill-current" />
                Fresh â€¢ Homestyle â€¢ Reliable
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Fresh &amp; Delicious
                <span className="block text-orange-300">Tiffin Service</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100 sm:text-xl">
                Enjoy fresh, homestyle meals with a convenient tiffin service
                designed for your everyday needs.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#plans"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-orange-600"
                >
                  Explore Tiffin Plans
                  <ArrowRight size={18} />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Contact Us
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-blue-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} />
                  Fresh Meals
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} />
                  Hygienic Service
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} />
                  Flexible Plans
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-4 rounded-[2rem] bg-orange-400/30 blur-2xl" />
                <div className="relative rounded-[2rem] border border-white/20 bg-white p-7 shadow-2xl">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                    <img
                      src={logo}
                      alt="OM Tiffin Service"
                      className="h-16 w-16 rounded-full object-cover border-2 border-blue-100"
                    />
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        OM TIFFIN SERVICE
                      </p>
                      <h2 className="text-xl font-extrabold text-slate-900">
                        Homestyle Meals
                      </h2>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {[
                      ["ðŸ›", "Freshly Prepared Meals"],
                      ["ðŸ¥—", "Balanced & Delicious Food"],
                      ["ðŸ•’", "Convenient Daily Service"],
                      ["â¤ï¸", "Made for Your Comfort"],
                    ].map(([emoji, text]) => (
                      <div
                        key={text}
                        className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4"
                      >
                        <span className="text-2xl">{emoji}</span>
                        <span className="font-semibold text-slate-700">
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-center">
                    <p className="text-sm font-medium text-blue-700">
                      Your everyday meal, made simple.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* About */}
        <section id="about" className="bg-white py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
                About OM Tiffin
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                Simple food. Reliable service. Everyday comfort.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                OM Tiffin Service is focused on providing convenient,
                homestyle meals for customers who want a dependable everyday
                food solution.
              </p>
              <div className="mt-7 flex items-start gap-4">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    Focused on quality &amp; convenience
                  </h3>
                  <p className="mt-1 text-slate-600">
                    A simple service experience from plan selection to daily
                    tiffin delivery.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <CheckCircle2 className="text-green-500" size={22} />
                  <p className="mt-3 font-bold text-slate-800">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Plans */}
        <section id="plans" className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
                Tiffin Plans
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                Choose a plan that works for you
              </h2>
              <p className="mt-4 text-slate-600">
                Flexible options for your daily and monthly meal requirements.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {plans.map(({ title, subtitle, price, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-2 min-h-12 text-slate-600">{subtitle}</p>
                  <p className="mt-5 text-lg font-extrabold text-blue-600">
                    {price}
                  </p>
                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600"
                  >
                    Enquire Now
                    <ArrowRight size={17} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Website Menu */}
        {settings.menuEnabled && (
          <section id="menu" className="bg-white py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
                  Our Menu
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                  Fresh meals for your day
                </h2>
                <p className="mt-4 text-slate-600">
                  Explore our available lunch and dinner options.
                </p>
              </div>
              {menuLoading ? (
                <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
                  <p className="font-semibold text-slate-500">
                    Loading menu...
                  </p>
                </div>
              ) : (
                <div className="mt-12 space-y-14">
                  {/* Lunch */}
                  {settings.lunchEnabled && (
                    <div>
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                          <UtensilsCrossed size={22} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">
                            Lunch
                          </h3>
                          <p className="text-sm text-slate-500">
                            Freshly prepared lunch options
                          </p>
                        </div>
                      </div>
                      {menuItems.filter(
                        (item) =>
                          item.mealType === "Lunch" ||
                          item.mealType === "Both"
                      ).length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {menuItems
                            .filter(
                              (item) =>
                                item.mealType === "Lunch" ||
                                item.mealType === "Both"
                            )
                            .map((item) => (
                              <div
                                key={`lunch-${item._id}`}
                                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h4 className="text-lg font-black text-slate-900">
                                      {item.name}
                                    </h4>
                                    {item.description && (
                                      <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700">
                                    â‚¹{Number(item.price || 0).toFixed(0)}
                                  </div>
                                </div>
                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                  <span className="text-xs font-bold uppercase tracking-wide text-green-600">
                                    Available
                                  </span>
                                  {settings.onlineOrdersEnabled ? (
  <button
    type="button"
    onClick={() => addToCart(item, "Lunch")}
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700"
  >
    Add to Cart
  </button>
) : (
  <a
    href="#contact"
    className="text-sm font-bold text-slate-800 hover:text-blue-600"
  >
    Enquire Now â†’
  </a>
)}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                          <p className="font-semibold text-slate-500">
                            Lunch menu is currently unavailable.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Dinner */}
                  {settings.dinnerEnabled && (
                    <div>
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                          <Clock3 size={22} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">
                            Dinner
                          </h3>
                          <p className="text-sm text-slate-500">
                            Freshly prepared dinner options
                          </p>
                        </div>
                      </div>
                      {menuItems.filter(
                        (item) =>
                          item.mealType === "Dinner" ||
                          item.mealType === "Both"
                      ).length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {menuItems
                            .filter(
                              (item) =>
                                item.mealType === "Dinner" ||
                                item.mealType === "Both"
                            )
                            .map((item) => (
                              <div
                                key={`dinner-${item._id}`}
                                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h4 className="text-lg font-black text-slate-900">
                                      {item.name}
                                    </h4>
                                    {item.description && (
                                      <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-700">
                                    â‚¹{Number(item.price || 0).toFixed(0)}
                                  </div>
                                </div>
                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                  <span className="text-xs font-bold uppercase tracking-wide text-green-600">
                                    Available
                                  </span>
                                  {settings.onlineOrdersEnabled ? (
  <button
    type="button"
    onClick={() => addToCart(item, "Dinner")}
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700"
  >
    Add to Cart
  </button>
) : (
  <a
    href="#contact"
    className="text-sm font-bold text-slate-800 hover:text-blue-600"
  >
    Enquire Now â†’
  </a>
)}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                          <p className="font-semibold text-slate-500">
                            Dinner menu is currently unavailable.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
        {/* How it works */}
        <section id="how-it-works" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
                How It Works
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                Getting started is easy
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative rounded-3xl border border-slate-200 p-7"
                >
                  <span className="text-5xl font-black text-blue-100">
                    {step.number}
                  </span>
                  <h3 className="mt-3 text-xl font-black text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Testimonials */}
        {settings.testimonialsEnabled && (
          <section id="testimonials" className="bg-slate-50 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
                  Customer Reviews
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                  What our customers say
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                  Real reviews from customers who have shared their experience with OM Tiffin Service.
                </p>
              </div>

              {reviewsLoading ? (
                <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <p className="font-semibold text-slate-600">Loading customer reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {reviews.map((review) => (
                    <article
                      key={review._id}
                      className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
                    >
                      <div
                        className="flex items-center gap-1 text-orange-500"
                        aria-label={`${review.rating} star rating`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={18}
                            className={star <= review.rating ? "fill-current" : "text-slate-300"}
                          />
                        ))}
                      </div>

                      <p className="mt-5 leading-7 text-slate-600">
                        &quot;{review.reviewText}&quot;
                      </p>

                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <p className="font-black text-slate-900">{review.customerName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Verified customer review
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                    <Star size={26} className="fill-current" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-slate-900">
                    Be the first to review OM Tiffin Service
                  </h3>
                  <p className="mt-2 text-slate-600">
                    Share your experience with our tiffin service.
                  </p>
                </div>
              )}

              <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-orange-500">
                    Share your experience
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">
                    Write a Review
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your review will be published after approval by OM Tiffin Service.
                  </p>
                </div>

                <form
                  className="mt-6 space-y-5"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setReviewError("");
                    setReviewSuccess("");

                    const customerName = reviewForm.customerName.trim();
                    const reviewText = reviewForm.reviewText.trim();

                    if (!customerName) {
                      setReviewError("Please enter your name.");
                      return;
                    }

                    if (!reviewText) {
                      setReviewError("Please write your review.");
                      return;
                    }

                    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
                      setReviewError("Please select a rating from 1 to 5 stars.");
                      return;
                    }

                    try {
                      setReviewSubmitting(true);

                      const response = await createPublicReview({
                        customerName,
                        rating: reviewForm.rating,
                        reviewText,
                      });

                      if (!response?.success) {
                        throw new Error(response?.message || "Unable to submit your review.");
                      }

                      setReviewForm({
                        customerName: "",
                        rating: 0,
                        reviewText: "",
                      });

                      setReviewSuccess(
                        "Thank you! Your review has been submitted and is waiting for approval."
                      );
                    } catch (error) {
                      console.error("Public Review Submission Error:", error);
                      setReviewError(
                        error?.response?.data?.message ||
                          error?.message ||
                          "Unable to submit your review. Please try again."
                      );
                    } finally {
                      setReviewSubmitting(false);
                    }
                  }}
                >
                  <div>
                    <label
                      htmlFor="review-customer-name"
                      className="mb-2 block text-sm font-bold text-slate-800"
                    >
                      Your Name
                    </label>
                    <input
                      id="review-customer-name"
                      type="text"
                      maxLength={100}
                      value={reviewForm.customerName}
                      onChange={(event) =>
                        setReviewForm((current) => ({
                          ...current,
                          customerName: event.target.value,
                        }))
                      }
                      placeholder="Enter your name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      disabled={reviewSubmitting}
                    />
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-bold text-slate-800">
                      Your Rating
                    </span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setReviewForm((current) => ({
                              ...current,
                              rating: star,
                            }))
                          }
                          disabled={reviewSubmitting}
                          aria-label={`Rate ${star} out of 5 stars`}
                          className="rounded-lg p-1 text-orange-500 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Star
                            size={28}
                            className={star <= reviewForm.rating ? "fill-current" : "text-slate-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review-text"
                      className="mb-2 block text-sm font-bold text-slate-800"
                    >
                      Your Review
                    </label>
                    <textarea
                      id="review-text"
                      rows={5}
                      maxLength={1000}
                      value={reviewForm.reviewText}
                      onChange={(event) =>
                        setReviewForm((current) => ({
                          ...current,
                          reviewText: event.target.value,
                        }))
                      }
                      placeholder="Tell us about your experience..."
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      disabled={reviewSubmitting}
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {reviewForm.reviewText.length}/1000
                    </p>
                  </div>

                  {reviewError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {reviewError}
                    </div>
                  )}

                  {reviewSuccess && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                      {reviewSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {settings.faqEnabled && (
          <section id="faq" className="bg-white py-20">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="text-center">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
                  FAQ
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
                  Frequently asked questions
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-slate-600">
                  Find quick answers about plans, meals, customer accounts, and online ordering.
                </p>
              </div>
              <div className="mt-10 space-y-3">
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div
                      key={faq.question}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-slate-900 transition hover:bg-white sm:px-6"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.question}</span>
                        <span className="shrink-0 text-xl text-blue-600">
                          {isOpen ? "âˆ’" : "+"}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-200 bg-white px-5 py-4 leading-7 text-slate-600 sm:px-6">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}


        {/* CTA */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-12 text-center text-white sm:px-12">
            <h2 className="text-3xl font-black sm:text-4xl">
              Ready to make your meals simpler?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-blue-100">
              Connect with OM Tiffin Service and find the right tiffin option
              for your needs.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="#contact"
                className="rounded-xl bg-orange-500 px-6 py-3.5 font-bold hover:bg-orange-600"
              >
                Get Started
              </a>
              {settings.customerLoginEnabled && (
                <Link
                  to="/customer-login"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold hover:bg-white/20"
                >
                  Customer Login
                </Link>
              )}
            </div>
          </div>
        </section>
        {/* Contact */}
        <section id="contact" className="bg-slate-50 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
              Let&apos;s talk about your tiffin requirements
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 text-slate-600 sm:flex-row">
              <span className="flex items-center gap-2">
                <MapPin size={19} className="text-blue-600" />
                Gandhinagar
              </span>
              <span className="hidden sm:block">â€¢</span>
              <span>Contact OM Tiffin Service for plan details</span>
            </div>
            <div className="mt-8 flex justify-center">
              <a
                href="tel:9409380470"
                className="rounded-xl bg-blue-600 px-7 py-3.5 font-bold text-white shadow-lg hover:bg-blue-700"
              >
                Call OM Tiffin Service
              </a>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="bg-slate-950 py-8 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="OM Tiffin Service"
              className="h-9 w-9 rounded-full object-cover"
            />
            <span>Â© 2026 OM Tiffin Service</span>
          </div>
          <div className="flex gap-5">
            {settings.customerLoginEnabled && (
              <Link to="/customer-login" className="hover:text-white">
                Customer Login
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}













































