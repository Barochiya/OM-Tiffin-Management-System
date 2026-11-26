const assert = require("node:assert/strict");
const Payment = require("../models/Payment");

let aggregateCalls = 0;
const rows = [
  { _id: "customer-a", score: 900 },
  { _id: "customer-b", score: 800 },
  { _id: "customer-c", score: 700 },
  { _id: "customer-d", score: 600 },
  { _id: "customer-e", score: 500 },
  { _id: "customer-f", score: 400 },
];
Payment.aggregate = async pipeline => {
  aggregateCalls++;
  assert.deepEqual(pipeline.map(stage => Object.keys(stage)[0]), ["$match", "$lookup", "$unwind", "$match", "$group", "$sort"]);
  assert(!pipeline.some(stage => stage.$out || stage.$merge), "Ranking aggregation must remain read-only");
  return structuredClone(rows);
};

const { getCustomerRanking } = require("../controllers/customerPortalController");
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

(async () => {
  const invalid = response();
  await getCustomerRanking({ customerId: "customer-f", query: { month: "11" } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(aggregateCalls, 0);

  const res = response();
  await getCustomerRanking({ customerId: "customer-f", query: { year: "2026", month: "11", cycle: "2" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.rank, 6);
  assert.equal(res.body.data.totalEligible, 6);
  assert.equal(res.body.data.score, 400);
  assert.equal(res.body.data.progress.thresholdScore, 500);
  assert.equal(res.body.data.progress.amountToTopFive, 100);
  assert.equal(res.body.data.reward.supported, false);
  assert.equal(aggregateCalls, 1);
  console.log("PASS customer ranking validates periods and uses a read-only aggregation pipeline.");
})().catch(error => { console.error(error); process.exitCode = 1; });
