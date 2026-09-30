export const TEACHER_CYCLE_STORAGE_KEY = "lp-teacher-class-cycles-v1";
export const LEGACY_TEACHER_CYCLE_KEY = "lp-teacher-cycle";
export const TEACHER_CYCLE_MIGRATION_KEY = "lp-teacher-cycle-confirmed-v1";

function browserStorage() {
  try { return typeof window === "undefined" ? null : window.localStorage; }
  catch { return null; }
}

function validCycle(cycleId, cycleOptions) {
  return typeof cycleId === "string" && cycleOptions.some(option => option.id === cycleId);
}

function scopeKey(teacherId, classId) {
  return teacherId && classId ? `${teacherId}:${classId}` : "";
}

export function readTeacherCycleState({ cycleOptions = [], storage = browserStorage() } = {}) {
  let cycles = {};
  let legacyCycleId = "";
  let legacyConfirmed = false;
  try {
    const saved = JSON.parse(storage?.getItem(TEACHER_CYCLE_STORAGE_KEY) || "{}");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      cycles = Object.fromEntries(Object.entries(saved).filter(([, id]) => validCycle(id, cycleOptions)));
    }
  } catch { /* Unreadable context stays unresolved. */ }
  try {
    const legacy = storage?.getItem(LEGACY_TEACHER_CYCLE_KEY);
    legacyCycleId = validCycle(legacy, cycleOptions) ? legacy : "";
    legacyConfirmed = storage?.getItem(TEACHER_CYCLE_MIGRATION_KEY) === "confirmed";
  } catch { /* A legacy read cannot invent a current class cycle. */ }
  return { cycles, legacyCycleId, legacyConfirmed };
}

export function resolveTeacherCycleContext({ state, teacherId = "", classId = "", cycleOptions = [] } = {}) {
  const key = scopeKey(teacherId, classId);
  const saved = key ? state?.cycles?.[key] : "";
  const cycleId = validCycle(saved, cycleOptions) ? saved : "";
  const suggestedCycleId = key && !cycleId && !state?.legacyConfirmed
    && validCycle(state?.legacyCycleId, cycleOptions) ? state.legacyCycleId : "";
  return { cycleId, suggestedCycleId };
}

// A deliberate class choice is the migration confirmation. The device-wide
// source is retained, but never copied into another class automatically.
export function confirmTeacherCycle({ state, teacherId = "", classId = "", cycleId = "", cycleOptions = [], storage = browserStorage() } = {}) {
  const key = scopeKey(teacherId, classId);
  if (!key || !validCycle(cycleId, cycleOptions)) return state;
  const stored = readTeacherCycleState({ cycleOptions, storage });
  const next = {
    ...state,
    cycles: { ...state?.cycles, ...stored.cycles, [key]: cycleId },
    legacyConfirmed: Boolean(state?.legacyConfirmed || stored.legacyConfirmed || validCycle(state?.legacyCycleId, cycleOptions))
  };
  try {
    storage?.setItem(TEACHER_CYCLE_STORAGE_KEY, JSON.stringify(next.cycles));
    if (next.legacyConfirmed) storage?.setItem(TEACHER_CYCLE_MIGRATION_KEY, "confirmed");
  } catch { /* The confirmed choice remains available in this session. */ }
  return next;
}
