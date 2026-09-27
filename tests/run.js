import assert from "node:assert";
import { splitSegment, locateSegment } from "../segments.js";
import { step, close } from "../rangesrun.js";
import { render } from "../app.js";

const base = {
  budget: 1,
  state: { segments: [[0, 10]], found: [], ledger: [], applied: [] },
  events: [{ id: 1, kind: "find", key: 3 }],
  range_error_code: "E_NO_RANGE", small_error_code: "E_TOO_SMALL",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("splitSegment returns segments", () => {
  assert.ok(Array.isArray(splitSegment([[0, 10]], 0)));
});

check("locateSegment returns a number", () => {
  assert.strictEqual(typeof locateSegment([[0, 10]], 3), "number");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
