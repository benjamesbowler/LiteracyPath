const VALID_STATUSES = new Set(["pending", "loaded", "failed"]);
const VALID_EVENT_TYPES = new Set(["loaded", "failed", "source_changed"]);

function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value, keys) {
  const actualKeys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  return actualKeys.length === keys.length
    && actualKeys.every(key => typeof key === "string" && keys.includes(key))
    && keys.every(key => Object.hasOwn(descriptors[key], "value")
      && descriptors[key].enumerable);
}

function requireSource(src) {
  if (typeof src !== "string" || src.length === 0 || src !== src.trim()) {
    throw new TypeError("Background image source must be a non-empty trimmed string");
  }
  return src;
}

function requireState(state) {
  if (
    !isPlainRecord(state)
    || !hasExactKeys(state, ["src", "status", "revision"])
    || typeof state.src !== "string"
    || state.src.length === 0
    || state.src !== state.src.trim()
    || !VALID_STATUSES.has(state.status)
    || !Number.isSafeInteger(state.revision)
    || state.revision < 0
  ) {
    throw new TypeError("Invalid background image state");
  }
}

function requireEvent(event) {
  if (!isPlainRecord(event) || !hasExactKeys(event, ["type", "src"])) {
    throw new TypeError("Invalid background image event");
  }
  if (!VALID_EVENT_TYPES.has(event.type)) {
    throw new TypeError(`Invalid background image event type: ${String(event.type)}`);
  }
  requireSource(event.src);
}

function frozenState(src, status, revision) {
  return Object.freeze({ src, status, revision });
}

export function createBackgroundImageState(src) {
  return frozenState(requireSource(src), "pending", 0);
}

export function reduceBackgroundImageState(state, event) {
  requireState(state);
  requireEvent(event);

  if (event.type === "source_changed") {
    if (state.revision === Number.MAX_SAFE_INTEGER) {
      throw new RangeError("Background image state revision cannot advance safely");
    }
    return frozenState(event.src, "pending", state.revision + 1);
  }
  if (event.src !== state.src || event.type === state.status) return state;
  return frozenState(state.src, event.type, state.revision);
}
