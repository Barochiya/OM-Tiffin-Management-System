import { useEffect } from "react";
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
  useEffect(() => {
    document.title = "About | OM Tiffin Service";
  }, []);

  return (
    <main className="om-public-page bg-slate-50 text-slate-800">
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
              About OM Tiffin Service
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50 sm:text-xl">
              A practical everyday tiffin service focused on fresh meals,
              dependable service and a convenient customer experience.
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
              OM Tiffin Service is built for people who want a simple and
              dependable solution for their regular meal requirements. The
              website and customer portal make it easier to understand plans,
              view the available menu and manage a registered customer account.
            </p>
            <p className="mt-4 leading-7 text-slate-600">
              Whether you need a daily arrangement, a monthly service or a plan
              tailored to your routine, the service is structured to keep the
              process clear and convenient.
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
    </main>
  );
}
