import test from "node:test";
import assert from "node:assert/strict";
import { currentBillingPeriod, cycleEntries } from "./billingCycle.js";

test("first view selects the current India billing cycle, including midnight boundaries", () => {
  assert.deepEqual(currentBillingPeriod(new Date("2026-10-13T12:00:00Z")), { month: 10, year: 2026, cycle: "1" });
  assert.equal(currentBillingPeriod(new Date("2026-10-15T18:29:59Z")).cycle, "1");
  assert.equal(currentBillingPeriod(new Date("2026-10-15T18:30:00Z")).cycle, "2");
  assert.deepEqual(currentBillingPeriod(new Date("2026-12-31T18:30:00Z")), { month: 1, year: 2027, cycle: "1" });
});

test("current cycle includes every date through today and preserves saved entries", () => {
  const saved = { _id: "saved", date: "2026-10-01T00:00:00.000Z", lunchQty: 10, extraItems: [{ name: "Rice", amount: 40 }] };
  const entries = cycleEntries([saved], { month: 10, year: 2026, cycle: "1" }, "customer", new Date("2026-10-13T12:00:00Z"));
  assert.equal(entries.length, 13);
  assert.equal(entries[0], saved);
  assert.equal(entries.at(-1).date, "2026-10-13T00:00:00.000Z");
  assert.equal(entries[1].isNewEntry, true);
  assert.equal(entries[1].lunchQty, 0);
});

test("future cycle is empty and historical leap-year cycle ends on February29", () => {
  const now = new Date("2026-10-13T12:00:00Z");
  assert.equal(cycleEntries([], { month: 10, year: 2026, cycle: "2" }, "customer", now).length, 0);
  assert.equal(cycleEntries([], { month: 11, year: 2026, cycle: "1" }, "customer", now).length, 0);
  const entries = cycleEntries([], { month: 2, year: 2024, cycle: "2" }, "customer", now);
  assert.equal(entries.length, 14);
  assert.equal(entries.at(-1).date, "2024-02-29T00:00:00.000Z");
});
