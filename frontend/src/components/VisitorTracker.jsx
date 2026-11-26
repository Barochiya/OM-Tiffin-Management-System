import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { recordVisit } from "../services/visitorAnalyticsService";

const publicPaths = ["/", "/about", "/plans", "/menu", "/how-it-works", "/contact", "/cart", "/order-details"];
const trackable = (path) => path.startsWith("/customer/") || publicPaths.includes(path);

export default function VisitorTracker() {
  const { pathname } = useLocation();
  const entry = useRef(sessionStorage.getItem("omEntryPage") || pathname);
  const [consent, setConsent] = useState(localStorage.getItem("omAnalyticsConsent"));
  useEffect(() => { sessionStorage.setItem("omEntryPage", entry.current); }, []);
  useEffect(() => {
    if (!trackable(pathname) || consent !== "accepted") return undefined;
    recordVisit(pathname, entry.current);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") recordVisit(pathname, entry.current); }, 60000);
    return () => window.clearInterval(timer);
  }, [pathname, consent]);
  if (!trackable(pathname) || consent || navigator.doNotTrack === "1") return null;
  const choose = (value) => { localStorage.setItem("omAnalyticsConsent", value); setConsent(value); };
  return <aside className="fixed bottom-4 left-4 right-4 z-[300] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl" aria-label="Privacy notice">
    <p className="text-sm font-bold text-slate-900">Privacy-friendly visitor analytics</p>
    <p className="mt-1 text-xs leading-5 text-slate-600">With your permission, OM Tiffin records page, device category and approximate network information to improve this service. We never collect passwords, OTPs, precise GPS or payment credentials.</p>
    <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => choose("declined")} className="rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100">Decline</button><button type="button" onClick={() => choose("accepted")} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Allow analytics</button></div>
  </aside>;
}
