let snapshot = { toasts: [], confirmation: null };
let nextId = 1;
const subscribers = new Set();
const confirmations = [];
const timers = new Map();
const publish = (next) => {
  snapshot = next;
  subscribers.forEach((listener) => listener());
};
export const subscribeNotifications = (listener) => {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
};
export const getNotifications = () => snapshot;
export const dismissNotification = (id) => {
  clearTimeout(timers.get(id));
  timers.delete(id);
  publish({ ...snapshot, toasts: snapshot.toasts.filter((item) => item.id !== id) });
};
export const notify = (message, options = {}) => {
  const text = String(message || "").replace(/^(?:✅|❌|⚠\uFE0F?)+\s*/u, "").trim();
  if (!text) return;
  const existing = snapshot.toasts.find((item) => item.message === text);
  if (existing) return existing.id;
  const id = nextId++;
  const toast = { id, message: text, type: options.type || "info" };
  const toasts = [...snapshot.toasts, toast];
  if (toasts.length > 5) dismissNotification(toasts.shift().id);
  publish({ ...snapshot, toasts });
  timers.set(id, setTimeout(() => dismissNotification(id), options.duration ?? 7000));
  return id;
};
export const confirmAction = (message, options = {}) => new Promise((resolve) => {
  const destructive = /\bdelete\b/i.test(String(message));
  confirmations.push({
    id: nextId++, message: String(message), title: options.title || "Confirm action",
    confirmLabel: options.confirmLabel || (destructive ? "Delete" : "Continue"),
    destructive, resolve,
  });
  if (!snapshot.confirmation) publish({ ...snapshot, confirmation: confirmations[0] });
});
export const resolveConfirmation = (accepted) => {
  const current = confirmations.shift();
  if (!current) return;
  publish({ ...snapshot, confirmation: confirmations[0] || null });
  current.resolve(accepted === true);
};
