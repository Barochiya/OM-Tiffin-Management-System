import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import "../styles/public-pages.css";

const values = [
  {
    icon: UtensilsCrossed,
    title: "Fresh & Homestyle",
    text: "Meals are presented around the idea of simple, familiar and satisfying everyday food.",
  },
  {
    icon: ShieldCheck,
    title: "Hygiene First",
    text: "A dependable tiffin experience starts with clean, organized and responsible food preparation.",
  },
  {
    icon: Heart,
    title: "Customer Focused",
    text: "The service is designed around practical daily meal requirements and customer convenience.",
  },
];

const benefits = [
  "Freshly prepared meals",
  "Hygienic food preparation",
  "Flexible tiffin plans",
  "Reliable daily service",
  "Customer-friendly support",
  "Customer portal access",
];

export default function About() {
  return (
    <div className="om-public-page bg-slate-50 text-slate-800">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        <div className="om-grid-pattern absolute inset-0 opacity-20" />
        <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
              <Sparkles size={16} />
              Fresh • Homestyle • Reliable
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              About OM Tiffin Services in Gandhinagar
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50 sm:text-xl">
              Based in Sector 6/C near Civil Hospital, OM Tiffin Services helps
              customers in Gandhinagar arrange regular lunch and dinner meals.
              Explore daily, monthly and custom tiffin plans with our team.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/plans"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-black text-white shadow-lg transition hover:bg-orange-600"
              >
                Explore Plans
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              Who We Are
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Everyday meals, made easier.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              We are based at Plot No 1086/2, Bhuneshwari Society, Sector 6/C,
              near Civil Hospital, Gandhinagar, Gujarat 382006. If you are looking
              for a regular meal arrangement, our team can help you confirm the
              available meals, a suitable plan and delivery availability for your address.
            </p>
            <p className="mt-4 leading-7 text-slate-600">
              A daily arrangement can suit a changing routine, while a monthly
              plan can help you organise regular meals. Lunch, dinner and custom
              requirements should be confirmed with our team before starting.
              Check the current menu and pricing rather than relying on an old bill or offer.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-200">
            <div className="rounded-2xl bg-blue-50 p-6">
              <p className="text-sm font-black uppercase tracking-widest text-blue-600">
                Our Focus
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-950">
                Food + Service + Convenience
              </h3>
              <div className="mt-6 space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="shrink-0 text-blue-600" size={20} />
                    <span className="font-semibold text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              What Matters
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Built around the customer experience.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="om-card-hover rounded-3xl border border-slate-200 bg-slate-50 p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                  <Icon size={22} />
                </div>
                <h3 className="mt-6 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="text-2xl font-black text-slate-950">Your customer account</h2>
            <p className="mt-4 leading-7 text-slate-600">Registered customers can sign in to the customer portal to view their meal records, bills and payment history. Their wallet shows available credit or the amount outstanding, with previous entries available in history. The portal gives customers a place to check their records and contact the team about their service.</p>
            <Link to="/customer-login" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-700">Customer portal <ArrowRight size={18} /></Link>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="text-2xl font-black text-slate-950">Before starting your tiffin service</h2>
            <p className="mt-4 leading-7 text-slate-600">Share your delivery address, preferred meals and intended start date. Let us know about dietary requirements so that we can discuss whether the available menu is suitable. Confirm delivery coverage, the current price and your meal arrangement directly with the team before placing an order.</p>
            <p className="mt-4 leading-7 text-slate-600">Call <a href="tel:+917016297983" className="font-bold text-blue-700">7016297983</a> or <a href="tel:+919409380470" className="font-bold text-blue-700">9409380470</a> for current service information.</p>
            <Link to="/menu" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-700">Explore the menu <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
            Ready to get started?
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Find a tiffin plan that fits your routine.
          </h2>
          <Link
            to="/plans"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 font-black text-white transition hover:bg-orange-600"
          >
            View Tiffin Plans
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
