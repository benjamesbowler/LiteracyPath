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
  if (!classId) return fallback;
  try {
    const saved = JSON.parse(storage?.getItem(`${STORAGE_PREFIX}${classId}`) || "null");
    if (saved?.version !== 1 || !cycleOptions.some(option => option.id === saved.cycleId)) return fallback;
    return {
      cycleId: saved.cycleId,
      day: PRESENTATION_DAYS.some(option => option.value === saved.day) ? saved.day : fallback.day,
      format: "core",
      preview: 0
    };
  } catch {
    return fallback;
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
