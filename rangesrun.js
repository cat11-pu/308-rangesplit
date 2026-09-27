// rangesrun.js：按处理预算处理并留账
import { splitSegment, locateSegment } from "./segments.js";

function pairOf(event) {
  return event.kind === "find" ? ["find", event.key] : ["split", event.start];
}

function cloneState(state) {
  return {
    segments: state.segments.map(function (seg) { return [seg[0], seg[1]]; }),
    found: state.found.slice(),
    ledger: state.ledger.map(function (event) { return Object.assign({}, event); }),
    applied: state.applied.slice()
  };
}

function validateEvent(event) {
  const ok = event !== null && typeof event === "object" &&
    ((event.kind === "split" && Number.isFinite(event.start)) ||
     (event.kind === "find" && Number.isFinite(event.key)));
  if (!ok) {
    const error = new Error("bad event");
    error.code = "E_BAD_EVENT";
    throw error;
  }
}

function applyEvent(state, event) {
  if (event.kind === "split") {
    state.segments = splitSegment(state.segments, event.start);
  } else {
    state.found.push(locateSegment(state.segments, event.key));
  }
  state.applied.push(event.id);
}

export function step(spec) {
  const events = spec.events || [];
  events.forEach(validateEvent);
  const state = cloneState(spec.state);
  const budget = Math.max(0, spec.budget || 0);
  const queue = state.ledger.concat(events.filter(function (event) {
    return state.applied.indexOf(event.id) === -1;
  }));
  let served = 0;
  const rest = [];
  queue.forEach(function (event) {
    if (served < budget) {
      applyEvent(state, event);
      served += 1;
    } else {
      rest.push(event);
    }
  });
  state.ledger = rest;
  return {
    state: state,
    served: served,
    ledger_before: rest.length,
    ledger: rest.map(pairOf),
    judged: served,
    judged_bound: queue.length
  };
}

export function close(spec) {
  const state = cloneState(spec.state);
  let catchup = 0;
  state.ledger.forEach(function (event) {
    applyEvent(state, event);
    catchup += 1;
  });
  state.ledger = [];
  return { state: state, catchup: catchup };
}
