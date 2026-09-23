import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LogIn,
  MessageCircle,
  Utensils,
} from "lucide-react";
import "../styles/public-pages.css";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Choose Your Plan",
    text: "Review the available tiffin arrangements and select the option that fits your routine.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Share Your Details",
    text: "Contact OM Tiffin Service and complete the required customer details to start your service.",
  },
  {
    number: "03",
    icon: Utensils,
    title: "Receive Your Meals",
    text: "Enjoy fresh, homestyle meals according to the service arrangement available to you.",
  },
  {
    number: "04",
    icon: LogIn,
    title: "Manage Your Account",
    text: "Registered customers can use the customer portal to manage their profile and service-related information.",
  },
];

const portalFeatures = [
  "Customer profile management",
  "Change password",
  "Bill history",
  "Payment history",
  "Service-related requests",
  "Account information",
];

export default function HowItWorks() {
  useEffect(() => {
    document.title = "How It Works | OM Tiffin Service";
  }, []);

  return (
    <main className="om-public-page bg-slate-50 text-slate-800">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        <div className="om-grid-pattern absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-100">
              Clear • Simple • Convenient
            </p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl lg:text-6xl">
              How It Works
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50 sm:text-xl">
              From selecting a plan to managing your customer account, OM
              Tiffin Service keeps the process straightforward.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, icon: Icon, title, text }) => (
            <article
              key={number}
              className="om-card-hover rounded-3xl bg-white p-7 shadow-lg ring-1 ring-slate-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Icon size={22} />
                </div>
                <span className="text-4xl font-black text-blue-100">{number}</span>
              </div>
              <h2 className="mt-7 text-xl font-black text-slate-950">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                Customer Portal
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                Your service information in one place.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Registered customers can sign in to the customer portal and
                manage supported account and service information without
                depending on the public website for every task.
              </p>
              <Link
                to="/customer-login"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-black text-white shadow-lg hover:bg-blue-700"
              >
                Customer Login
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                  <LogIn size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-300">Portal Features</p>
                  <h3 className="text-xl font-black">Customer self-service</h3>
                </div>
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {portalFeatures.map((feature) => (
                  <div key={feature} className="flex gap-3 rounded-2xl bg-white/5 p-4">
                    <CheckCircle2 className="shrink-0 text-blue-300" size={19} />
                    <span className="text-sm font-semibold text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-blue-50 p-8 sm:p-10">
          <CreditCard className="mx-auto text-blue-600" size={34} />
          <h2 className="mt-4 text-3xl font-black text-slate-950">
            Need help with your service?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">
            Contact OM Tiffin Service for plan information, service assistance
            or customer support.
          </p>
          <Link
            to="/contact"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 font-black text-white hover:bg-orange-600"
          >
            Contact OM Tiffin Service
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
