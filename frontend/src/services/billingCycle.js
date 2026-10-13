export function businessDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  return Object.fromEntries(parts.filter(({ type }) => ["year", "month", "day"].includes(type)).map(({ type, value }) => [type, Number(value)]));
}

export function defaultCycle(month, year, now = new Date()) {
  const today = businessDate(now);
  return Number(month) === today.month && Number(year) === today.year && today.day > 15 ? "2" : "1";
}

export function currentBillingPeriod(now = new Date()) {
  const { month, year } = businessDate(now);
  return { month, year, cycle: defaultCycle(month, year, now) };
}

export function cycleEntries(savedEntries, { month, year, cycle }, customerId, now = new Date()) {
  const today = businessDate(now);
  if (Number(year) * 12 + Number(month) > today.year * 12 + today.month) return [];
  const start = String(cycle) === "1" ? 1 : 16;
  let end = String(cycle) === "1" ? 15 : new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (Number(month) === today.month && Number(year) === today.year) end = Math.min(end, today.day);
  const saved = new Map(savedEntries.map(entry => [new Date(entry.date).toISOString().slice(0, 10), entry]));
  const entries = [];
  for (let day = start; day <= end; day++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    entries.push(saved.get(key) || {
      _id: `new-${key}`, customer: customerId, date: `${key}T00:00:00.000Z`,
      breakfastQty: 0, lunchQty: 0, dinnerQty: 0, extraItems: [], remark: "", isNewEntry: true,
    });
  }
  return entries;
}
