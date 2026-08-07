/**
 * "Stores nothing" as a property of the system, not a promise each feature keeps.
 *
 * WHY THIS SHAPE. The anonymous try-mode's entire legal basis is that it
 * collects nothing from a child — no account, no name, no persistent
 * identifier. That claim is only worth making if it cannot be broken by
 * accident, and 45 files in this codebase write to localStorage directly. Going
 * through all 45 and adding a conditional would work exactly until somebody
 * adds the forty-sixth.
 *
 * So the interception happens once, at the boundary. `installEphemeralStorage`
 * replaces the storage object itself with a memory-backed one; every existing
 * caller keeps working unchanged and writes into a bucket that dies with the
 * tab. The equivalent guard for the network lives in
 * src/data/boundaries/facade.js, which is already the single choke point every
 * Supabase call passes through — verified by tools/checkSupabaseDomainBoundaries.mjs.
 *
 * Two boundaries, both enforced, both testable. That is the difference between
 * being able to say "this mode cannot store anything" and hoping.
 */

/** A Storage-shaped object backed by a Map. Same surface, no disk. */
export function createMemoryStorage(seed = {}) {
  const entries = new Map(Object.entries(seed));
  return {
    get length() {
      return entries.size;
    },
    key(index) {
      return [...entries.keys()][index] ?? null;
    },
    getItem(key) {
      const value = entries.get(String(key));
      return value === undefined ? null : value;
    },
    setItem(key, value) {
      entries.set(String(key), String(value));
    },
    removeItem(key) {
      entries.delete(String(key));
    },
    clear() {
      entries.clear();
    },
    /** Test-only view. Not part of the Storage interface. */
    __entries: entries
  };
}

/**
 * Swaps window.localStorage and window.sessionStorage for memory-backed ones.
 *
 * Returns a restore function. If the swap cannot be performed — a browser that
 * refuses to redefine the property — it returns null AND the caller must treat
 * that as fatal for the try-mode. A demo that silently fell back to real
 * storage would be collecting data from a child while telling them it wasn't,
 * which is worse than not shipping the demo.
 */
export function installEphemeralStorage(target = globalThis) {
  if (!target) return null;

  const original = {};
  const restore = () => {
    for (const [name, descriptor] of Object.entries(original)) {
      try {
        Object.defineProperty(target, name, descriptor);
      } catch {
        // Nothing useful to do; the page is being torn down either way.
      }
    }
  };

  for (const name of ["localStorage", "sessionStorage"]) {
    const descriptor = Object.getOwnPropertyDescriptor(target, name);
    // A storage the browser never provided (private mode, some embedded
    // webviews) needs no swap and is not a failure.
    if (!descriptor) continue;
    try {
      Object.defineProperty(target, name, {
        configurable: true,
        enumerable: descriptor.enumerable ?? true,
        get: memoryFor(name)
      });
      original[name] = descriptor;
    } catch {
      restore();
      return null;
    }
  }

  return restore;
}

const memories = new Map();
function memoryFor(name) {
  if (!memories.has(name)) memories.set(name, createMemoryStorage());
  const storage = memories.get(name);
  return () => storage;
}

/** Test hook. Drops the memory buckets so one test cannot see another's writes. */
export function resetEphemeralStorage() {
  memories.clear();
}

/**
 * Did anything reach real storage while ephemeral mode was on?
 *
 * The assertion the whole claim rests on, exposed so a test can make it rather
 * than a person having to check by hand. Pass the REAL storage object captured
 * before installation.
 */
export function realStorageKeysWritten(realStorage, ignorePrefixes = []) {
  if (!realStorage) return [];
  const keys = [];
  for (let index = 0; index < realStorage.length; index += 1) {
    const key = realStorage.key(index);
    if (key && !ignorePrefixes.some(prefix => key.startsWith(prefix))) keys.push(key);
  }
  return keys;
}
