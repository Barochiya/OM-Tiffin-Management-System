import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock3,
  Heart,
  MessageCircle,
  UtensilsCrossed,
} from "lucide-react";
import "../styles/public-pages.css";

const plans = [
  {
    title: "Daily Tiffin",
    subtitle: "For flexible everyday requirements",
    price: "Starting from ₹90",
    icon: UtensilsCrossed,
    featured: true,
    points: [
      "Fresh daily meal arrangement",
      "Suitable for regular requirements",
      "Simple service process",
      "Customer support when needed",
    ],
  },
  {
    title: "Monthly Tiffin",
    subtitle: "For a consistent meal routine",
    price: "Flexible plans",
    icon: Clock3,
    points: [
      "Convenient monthly arrangement",
      "Designed for routine meal needs",
      "Easy customer account management",
      "Service support",
    ],
  },
  {
    title: "Custom Plan",
    subtitle: "For requirements that need flexibility",
    price: "Custom pricing",
    icon: Heart,
    points: [
      "Discuss your meal requirements",
      "Plan around your routine",
      "Flexible service discussion",
      "Direct support from OM Tiffin Service",
    ],
  },
];

export default function Plans() {
  useEffect(() => {
    document.title = "Tiffin Plans | OM Tiffin Service";
  }, []);

  return (
    <main className="om-public-page bg-slate-50 text-slate-800">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        <div className="om-grid-pattern absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-100">
            Simple • Flexible • Convenient
          </p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl lg:text-6xl">
            Tiffin Plans
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50 sm:text-xl">
            Choose a service arrangement that fits your daily routine, monthly
            requirements or specific meal needs.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-7 lg:grid-cols-3">
          {plans.map(({ title, subtitle, price, icon: Icon, featured, points }) => (
            <article
              key={title}
              className={`om-card-hover relative overflow-hidden rounded-3xl bg-white p-7 shadow-lg ring-1 ${
                featured
                  ? "ring-2 ring-blue-500 lg:-translate-y-2"
                  : "ring-slate-200"
              }`}
            >
              {featured && (
                <div className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white">
                  Popular
                </div>
              )}

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon size={26} />
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-950">{title}</h2>
              <p className="mt-2 min-h-12 text-slate-600">{subtitle}</p>
              <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-2xl font-black text-blue-600">{price}</p>
              </div>

              <div className="mt-7 space-y-4">
                {points.map((point) => (
                  <div key={point} className="flex gap-3">
                    <Check className="mt-0.5 shrink-0 text-green-600" size={19} />
                    <span className="text-sm font-semibold leading-6 text-slate-700">
                      {point}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/contact"
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-black transition ${
                  featured
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                Discuss This Plan
                <ArrowRight size={18} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                Need help choosing?
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                Tell us what your routine looks like.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Plan availability and pricing can depend on the service
                configuration and your requirements. Contact OM Tiffin Service
                to discuss the suitable arrangement.
              </p>
            </div>
            <div className="rounded-3xl bg-blue-50 p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    Let&apos;s discuss your requirement
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use the Contact page to reach OM Tiffin Service for plan
                    details and assistance.
                  </p>
                  <Link
                    to="/contact"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600"
                  >
                    Contact Us
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
