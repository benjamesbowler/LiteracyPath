import { PRESENTATION_DAYS } from "./presentationBuilder.js";

const STORAGE_PREFIX = "lp-present-workspace:";
const WEEKDAYS = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null];

export function currentTeachingDay(now = new Date()) {
  return WEEKDAYS[now.getDay()] || null;
}

function browserStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readPresentWorkspaceState({
  classId = "",
  currentCycleId = "",
  explicitCycleId = "",
  resume = false,
  cycleOptions = [],
  now = new Date(),
  storage = browserStorage()
} = {}) {
  const fallback = {
    cycleId: cycleOptions.some(option => option.id === currentCycleId)
      ? currentCycleId
      : "",
    day: currentTeachingDay(now) || "monday",
    format: "core",
    preview: 0
  };
  if (cycleOptions.some(option => option.id === explicitCycleId)) return { ...fallback, cycleId: explicitCycleId };
  return resume ? readSavedPresentWorkspaceState({ classId, cycleOptions, storage }) || fallback : fallback;
}

// Remembering a lesson never silently changes the class's next lesson. The
// launcher offers this record as a deliberate resume action instead.
export function readSavedPresentWorkspaceState({ classId = "", cycleOptions = [], storage = browserStorage() } = {}) {
  if (!classId) return null;
  try {
    const saved = JSON.parse(storage?.getItem(`${STORAGE_PREFIX}${classId}`) || "null");
    if (saved?.version !== 1 || !cycleOptions.some(option => option.id === saved.cycleId)
      || !PRESENTATION_DAYS.some(option => option.value === saved.day)) return null;
    return {
      cycleId: saved.cycleId,
      day: saved.day,
      format: "core",
      preview: 0
    };
  } catch {
    return null;
  }
}

export function rememberPresentWorkspaceState(classId, workspace, storage = browserStorage()) {
  if (!classId) return false;
  try {
    if (!storage) return false;
    storage.setItem(`${STORAGE_PREFIX}${classId}`, JSON.stringify({
      version: 1,
      cycleId: workspace.cycleId,
      day: workspace.day,
      format: "core",
      preview: 0
    }));
    return true;
  } catch {
    return false;
  }
}
