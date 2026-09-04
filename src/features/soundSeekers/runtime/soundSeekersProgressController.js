import {
  isSoundSeekersV2,
  normalizeSoundSeekersState
} from "../engine/stateV2.js";
import { computeHydratedValue } from "../../../utils/progressMerge.js";
import {
  loadSoundSeekersV2Progress,
  questProgressStorageKey,
  saveSoundSeekersV2Progress
} from "../../../utils/questStore.js";

const HYDRATION_EVENT = "lp-progress-hydrated";
const COMMIT_OPTION_KEYS = Object.freeze(["flush"]);

function dataTree(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return true;
  if (Array.isArray(value)) return Reflect.ownKeys(value)
    .every(key => key === "length" || (typeof key === "string" && /^\d+$/u.test(key)))
    && value.every(dataTree);
  if (!value || typeof value !== "object"
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    || Reflect.ownKeys(value).some(key => typeof key !== "string")) return false;
  return Object.values(value).every(dataTree);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort()
    .map(key => [key, canonicalJson(value[key])]));
}

function sameState(left, right) {
  return JSON.stringify(canonicalJson(left)) === JSON.stringify(canonicalJson(right));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function canonicalState(raw) {
  if (!dataTree(raw) || !isSoundSeekersV2(raw)) {
    throw new TypeError("Sound Seekers progress requires canonical v2 state");
  }
  const normalized = normalizeSoundSeekersState(raw);
  if (!sameState(raw, normalized)) {
    throw new TypeError("Sound Seekers progress requires canonical v2 state");
  }
  return deepFreeze(normalized);
}

function canonicalCommitOptions(raw = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)
    || Object.getPrototypeOf(raw) !== Object.prototype
    || Reflect.ownKeys(raw).some(key => typeof key !== "string"
      || !COMMIT_OPTION_KEYS.includes(key))
    || (Object.hasOwn(raw, "flush") && typeof raw.flush !== "boolean")) {
    throw new TypeError("Sound Seekers progress commit options are invalid");
  }
  return { flush: raw.flush === true };
}

export function reconcileSoundSeekersHydration(current, stored, {
  resetApplied,
  preferStoredVolatile = false
} = {}) {
  const currentState = canonicalState(current);
  const storedState = canonicalState(stored);
  if (typeof resetApplied !== "boolean" || typeof preferStoredVolatile !== "boolean") {
    throw new TypeError("Sound Seekers hydration needs an explicit reset result");
  }
  if (resetApplied) return storedState;
  // The v2 merge deliberately keeps volatile resume fields from its local
  // argument. Before any child action, the newly hydrated persisted state is
  // the authority for those fields. Once play is dirty, the in-flight local
  // route/checkpoint/settings remain authoritative while durable sets merge.
  const volatileState = preferStoredVolatile ? storedState : currentState;
  const otherState = preferStoredVolatile ? currentState : storedState;
  const merged = computeHydratedValue(
    "phonics_quest", "__all__", volatileState, otherState
  );
  return canonicalState(preferStoredVolatile
    ? { ...merged, assignment: storedState.assignment }
    : merged);
}

export function createSoundSeekersProgressController({
  progressScopeKey,
  load = loadSoundSeekersV2Progress,
  save = saveSoundSeekersV2Progress,
  eventTarget = typeof window === "undefined" ? null : window,
  storage = eventTarget?.localStorage ?? null
} = {}) {
  if (typeof progressScopeKey !== "string" || !progressScopeKey.trim()
    || typeof load !== "function" || typeof save !== "function"
    || (eventTarget !== null && (typeof eventTarget.addEventListener !== "function"
      || typeof eventTarget.removeEventListener !== "function"))) {
    throw new TypeError("Sound Seekers progress controller dependencies are invalid");
  }
  const scopeKey = progressScopeKey;
  const storageKey = questProgressStorageKey(scopeKey);
  const listeners = new Set();
  let state = canonicalState(load(scopeKey));
  let dirty = false;
  let flushQueued = false;
  let disposed = false;
  let observing = false;

  function publish(next) {
    if (sameState(state, next)) return state;
    state = next;
    for (const listener of listeners) listener();
    return state;
  }

  function flush() {
    flushQueued = false;
    if (!dirty || disposed) return state;
    const saved = canonicalState(save(scopeKey, state));
    dirty = false;
    return publish(saved);
  }

  function scheduleFlush() {
    if (flushQueued || disposed) return;
    flushQueued = true;
    queueMicrotask(() => {
      if (!disposed) flush();
    });
  }

  function applyStored(stored, resetApplied) {
    const next = reconcileSoundSeekersHydration(state, stored, {
      resetApplied,
      preferStoredVolatile: !dirty
    });
    publish(next);
    dirty = resetApplied ? false : !sameState(next, stored);
    if (dirty) scheduleFlush();
  }

  function handleHydrated(event) {
    const detail = event?.detail;
    if (disposed || event?.type !== HYDRATION_EVENT
      || !detail || typeof detail !== "object" || Array.isArray(detail)
      || String(detail.studentId) !== scopeKey
      || !Array.isArray(detail.rows)
      || typeof detail.resetApplied !== "boolean") return;
    applyStored(canonicalState(load(scopeKey)), detail.resetApplied);
  }

  function handleStorage(event) {
    const StorageEventClass = eventTarget?.StorageEvent ?? globalThis.StorageEvent;
    if (disposed || typeof StorageEventClass !== "function"
      || !(event instanceof StorageEventClass)
      || event.type !== "storage" || event.key !== storageKey
      || event.storageArea !== storage || typeof event.newValue !== "string") return;
    applyStored(canonicalState(load(scopeKey)), false);
  }

  function startObserving() {
    if (observing || disposed || !eventTarget) return;
    eventTarget.addEventListener(HYDRATION_EVENT, handleHydrated);
    eventTarget.addEventListener("storage", handleStorage);
    observing = true;
  }

  function stopObserving() {
    if (!observing || !eventTarget) return;
    eventTarget.removeEventListener(HYDRATION_EVENT, handleHydrated);
    eventTarget.removeEventListener("storage", handleStorage);
    observing = false;
  }

  return Object.freeze({
    getSnapshot() { return state; },
    subscribe(listener) {
      if (disposed || typeof listener !== "function") {
        throw new TypeError("Sound Seekers progress subscription is invalid");
      }
      listeners.add(listener);
      startObserving();
      let subscribed = true;
      return () => {
        if (!subscribed) return;
        subscribed = false;
        listeners.delete(listener);
        if (!listeners.size) stopObserving();
      };
    },
    commit(update, rawOptions = {}) {
      if (disposed) throw new Error("Sound Seekers progress controller is disposed");
      const options = canonicalCommitOptions(rawOptions);
      const candidate = typeof update === "function" ? update(state) : update;
      const childState = canonicalState(candidate);
      // Assignment is teacher-owned. A child-game update may carry the copy it
      // was given, but it can never replace or clear that authority locally.
      const next = canonicalState({ ...childState, assignment: state.assignment });
      publish(next);
      dirty = true;
      if (options.flush) flush();
      else scheduleFlush();
      return state;
    },
    flush,
    dispose() {
      if (disposed) return;
      flush();
      disposed = true;
      stopObserving();
      listeners.clear();
    }
  });
}
