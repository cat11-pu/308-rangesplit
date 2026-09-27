// rangesrun.js：按处理预算处理并留账
import { splitSegment, locateSegment } from "./segments.js";

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function codes(spec) {
  return {
    range: spec.range_error_code || "E_NO_RANGE",
    small: spec.small_error_code || "E_TOO_SMALL",
    event: spec.event_error_code || "E_BAD_EVENT"
  };
}

function validEvent(event) {
  if (!event || typeof event !== "object") return false;
  if (event.kind === "split") return typeof event.start === "number" && Number.isFinite(event.start);
  if (event.kind === "find") return typeof event.key === "number" && Number.isFinite(event.key);
  return false;
}

function cloneState(state) {
  state = state || {};
  return {
    segments: (state.segments || []).map(function (seg) { return [seg[0], seg[1]]; }),
    found: (state.found || []).slice(),
    ledger: (state.ledger || []).map(function (row) { return [row[0], row[1]]; }),
    applied: (state.applied || []).slice()
  };
}

function toEvent(row) {
  return row[0] === "split" ? { kind: "split", start: row[1] } : { kind: "find", key: row[1] };
}

function toRow(event) {
  return event.kind === "split" ? ["split", event.start] : ["find", event.key];
}

function applyEvent(state, event, spec) {
  if (event.kind === "split") {
    try {
      state.segments = splitSegment(state.segments, event.start);
    } catch (error) {
      const want = codes(spec);
      if (error && error.code === "E_NO_RANGE") fail(want.range);
      if (error && error.code === "E_TOO_SMALL") fail(want.small);
      throw error;
    }
  } else {
    state.found.push(locateSegment(state.segments, event.key));
  }
}

export function step(spec) {
  const want = codes(spec);
  const events = spec.events || [];
  events.forEach(function (event) { if (!validEvent(event)) fail(want.event); });

  const state = cloneState(spec.state);
  let budget = typeof spec.budget === "number" ? spec.budget : 0;
  let served = 0;
  const judged_bound = events.length + state.ledger.length;

  const pending = state.ledger.map(toEvent);
  state.ledger = [];
  let cursor = 0;
  while (cursor < pending.length && budget > 0) {
    applyEvent(state, pending[cursor], spec);
    budget -= 1;
    served += 1;
    cursor += 1;
  }
  for (; cursor < pending.length; cursor += 1) {
    state.ledger.push(toRow(pending[cursor]));
  }

  events.forEach(function (event) {
    if (event.id !== undefined && state.applied.indexOf(event.id) !== -1) return;
    if (event.id !== undefined) state.applied.push(event.id);
    if (budget > 0) {
      applyEvent(state, event, spec);
      budget -= 1;
      served += 1;
    } else {
      state.ledger.push(toRow(event));
    }
  });

  return {
    state: state,
    served: served,
    ledger_before: state.ledger.length,
    ledger: state.ledger.map(function (row) { return [row[0], row[1]]; }),
    judged: served,
    judged_bound: judged_bound
  };
}

export function close(spec) {
  const state = cloneState(spec.state);
  const rows = state.ledger;
  state.ledger = [];
  let catchup = 0;
  rows.forEach(function (row) {
    applyEvent(state, toEvent(row), spec);
    catchup += 1;
  });
  return { state: state, catchup: catchup };
}
