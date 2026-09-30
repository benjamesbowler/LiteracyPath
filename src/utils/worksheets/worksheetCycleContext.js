const STORAGE_PREFIX = "lp-worksheets-cycle:";

function browserStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function worksheetCycleStorageKey(teacherId = "", classId = "") {
  if (!teacherId || !classId) return "";
  return `${STORAGE_PREFIX}${encodeURIComponent(teacherId)}:${encodeURIComponent(classId)}`;
}

export function readWorksheetCycleContext({
  teacherId = "",
  classId = "",
  currentCycleId = "",
  cycleOptions = [],
  storage = browserStorage()
} = {}) {
  const valid = id => cycleOptions.some(option => option.id === id);
  const inheritedCycleId = valid(currentCycleId) ? currentCycleId : "";
  const fallback = {
    cycleId: inheritedCycleId,
    currentCycleId: inheritedCycleId,
    source: inheritedCycleId ? "class" : "unresolved"
  };
  const key = worksheetCycleStorageKey(teacherId, classId);
  if (!key) return fallback;
  try {
    const saved = storage?.getItem(key);
    return saved && valid(saved)
      ? { ...fallback, cycleId: saved, source: "override" }
      : fallback;
  } catch {
    return fallback;
  }
}

export function rememberWorksheetCycleOverride({
  teacherId = "",
  classId = "",
  cycleId = "",
  cycleOptions = [],
  storage = browserStorage()
} = {}) {
  const key = worksheetCycleStorageKey(teacherId, classId);
  if (!key || !cycleOptions.some(option => option.id === cycleId)) return false;
  try {
    if (!storage) return false;
    storage.setItem(key, cycleId);
    return true;
  } catch {
    return false;
  }
}

export function clearWorksheetCycleOverride({
  teacherId = "",
  classId = "",
  storage = browserStorage()
} = {}) {
  const key = worksheetCycleStorageKey(teacherId, classId);
  if (!key) return false;
  try {
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
