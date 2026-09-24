import { useEffect, useState } from "react";
import {
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import "../styles/public-pages.css";

const PHONE = "9409380470";
const WHATSAPP = "919409380470";

export default function Contact() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "Contact | OM Tiffin Service";
  }, []);

  const openWhatsApp = () => {
  const text =
    message.trim() ||
    "Hello OM Tiffin Service, I would like to know more about your tiffin plans.";
  const whatsappUrl =
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
};

  return (
    <main className="om-public-page bg-slate-50 text-slate-800">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        <div className="om-grid-pattern absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-100">
              We&apos;re here to help
            </p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl lg:text-6xl">
              Contact Us
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50 sm:text-xl">
              Have a question about plans, meals or customer service? Reach out
              to OM Tiffin Service.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-7 md:grid-cols-3">
          <a
            href={`tel:${PHONE}`}
            className="om-card-hover rounded-3xl bg-white p-7 shadow-lg ring-1 ring-slate-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Phone size={22} />
            </div>
            <h2 className="mt-6 text-xl font-black text-slate-950">Call Us</h2>
            <p className="mt-2 text-slate-600">Speak directly with OM Tiffin Service.</p>
            <p className="mt-4 font-black text-blue-600">9409380470</p>
          </a>

          <button
            type="button"
            onClick={openWhatsApp}
            className="om-card-hover text-left rounded-3xl bg-white p-7 shadow-lg ring-1 ring-slate-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <MessageCircle size={22} />
            </div>
            <h2 className="mt-6 text-xl font-black text-slate-950">WhatsApp</h2>
            <p className="mt-2 text-slate-600">
              Send your requirement directly through WhatsApp.
            </p>
            <p className="mt-4 font-black text-green-600">Start a Chat</p>
          </button>

          <div className="rounded-3xl bg-white p-7 shadow-lg ring-1 ring-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <MapPin size={22} />
            </div>
            <h2 className="mt-6 text-xl font-black text-slate-950">Service Area</h2>
            <p className="mt-2 text-slate-600">
              OM Tiffin Service is based in Gandhinagar.
            </p>
            <p className="mt-4 font-black text-orange-600">Gandhinagar</p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                Send an Enquiry
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
                Tell us what you need.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Write your requirement below. The WhatsApp button will open a
                chat with your message so you can continue the conversation
                directly.
              </p>

              <div className="mt-7 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <Clock3 className="mt-0.5 shrink-0 text-blue-600" size={20} />
                <div>
                  <p className="font-bold text-slate-900">Quick support</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Contact OM Tiffin Service for plan details, service
                    information or assistance.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200 sm:p-8">
              <label
                htmlFor="contact-message"
                className="text-sm font-black text-slate-800"
              >
                Your message
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={7}
                placeholder="Example: I want to know about monthly tiffin plans..."
                className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={openWhatsApp}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-black text-white shadow-lg transition hover:bg-blue-700"
              >
                <Send size={18} />
                Send on WhatsApp
              </button>
              <a
                href={`tel:${PHONE}`}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-black text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Phone size={18} />
                Call 9409380470
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
