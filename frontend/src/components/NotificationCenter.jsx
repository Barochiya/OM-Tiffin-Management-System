import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, ShieldQuestion, TriangleAlert, X } from "lucide-react";
import {
  dismissNotification, getNotifications, resolveConfirmation, subscribeNotifications,
} from "../services/notifications";

export default function NotificationCenter() {
  const { toasts, confirmation } = useSyncExternalStore(subscribeNotifications, getNotifications, getNotifications);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!confirmation) return;
    const previousFocus = document.activeElement;
    const app = document.getElementById("root");
    const wasInert = app?.inert;
    if (app) app.inert = true;
    dialogRef.current?.querySelector("[data-cancel]")?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); resolveConfirmation(false); }
      if (event.key !== "Tab") return;
      const buttons = [...(dialogRef.current?.querySelectorAll("button") || [])];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (app) app.inert = wasInert;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [confirmation?.id]);
  return createPortal(
    <>
      <div className="fixed inset-x-3 top-4 z-[10000] ml-auto flex max-w-md flex-col gap-3 sm:right-5 sm:left-auto sm:w-96" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = toast.type === "error" ? TriangleAlert : toast.type === "success" ? CheckCircle2 : Info;
          return (
            <div key={toast.id} role="status" className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <Icon size={22} className={`mt-0.5 shrink-0 ${toast.type === "error" ? "text-red-600" : toast.type === "success" ? "text-green-600" : "text-blue-600"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">OM Tiffin Service</p>
                <p className="mt-1 max-h-52 overflow-y-auto whitespace-pre-line break-words text-sm leading-6 text-slate-600">{toast.message}</p>
              </div>
              <button type="button" onClick={() => dismissNotification(toast.id)} aria-label="Dismiss notification" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>
          );
        })}
      </div>
      {confirmation && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) resolveConfirmation(false); }}>
          <section ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className={`mb-5 inline-flex rounded-2xl p-3 ${confirmation.destructive ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}><ShieldQuestion size={28} /></div>
            <h2 id="confirmation-title" className="text-xl font-bold text-slate-900">{confirmation.title}</h2>
            <p id="confirmation-message" className="mt-3 max-h-[45vh] overflow-y-auto whitespace-pre-line break-words text-sm leading-7 text-slate-600">{confirmation.message}</p>
            <div className="mt-7 flex justify-end gap-3">
              <button data-cancel type="button" onClick={() => resolveConfirmation(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={() => resolveConfirmation(true)} className={`rounded-xl px-5 py-3 text-sm font-bold text-white ${confirmation.destructive ? "bg-red-600 hover:bg-red-700" : "bg-blue-700 hover:bg-blue-800"}`}>{confirmation.confirmLabel}</button>
            </div>
          </section>
        </div>
      )}
    </>, document.body
  );
}
