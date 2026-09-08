// Immutable completion evidence is separate from the forward-only navigation
// status. Completion means the activity finished; it is not a mastery claim.
const STATUS_RANK = { default: 0, locked: 1, inprogress: 2, completed: 3 };

export function practiceProgressStatus(value) {
  if (typeof value === "string" && Object.hasOwn(STATUS_RANK, value)) return value;
  if (value && typeof value === "object") {
    if (typeof value.status === "string" && Object.hasOwn(STATUS_RANK, value.status)) return value.status;
    const recovered = Object.keys(value).filter(key => /^\d+$/.test(key))
      .sort((a, b) => Number(a) - Number(b)).map(key => value[key]).join("");
    if (Object.hasOwn(STATUS_RANK, recovered)) return recovered;
  }
  return "";
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export function normalizePracticeCompletionEvent(value) {
  if (!value || typeof value !== "object" || typeof value.id !== "string" || !value.id.trim()
    || typeof value.contentVersion !== "string" || !value.contentVersion.trim()
    || typeof value.completedAt !== "string" || !Number.isFinite(Date.parse(value.completedAt))
    || !Array.isArray(value.steps) || !value.steps.length
    || value.steps.some(step => !step || typeof step !== "object" || Array.isArray(step))) return null;
  try { return JSON.parse(JSON.stringify(value)); } catch { return null; }
}
export function mergePracticeProgressRecords(existing, incoming) {
  const oldStatus = practiceProgressStatus(existing);
  const newStatus = practiceProgressStatus(incoming);
  const status = (STATUS_RANK[oldStatus] ?? -1) > (STATUS_RANK[newStatus] ?? -1) ? oldStatus : newStatus;
  const completions = new Map();
  const ids = value => Array.isArray(value?.completionConflictIds) ? value.completionConflictIds.filter(id => typeof id === "string") : [];
  const conflictIds = new Set([...ids(existing), ...ids(incoming)]);
  for (const raw of [...(Array.isArray(existing?.completions) ? existing.completions : []), ...(Array.isArray(incoming?.completions) ? incoming.completions : [])]) {
    const event = normalizePracticeCompletionEvent(raw);
    if (!event) continue;
    const previous = completions.get(event.id);
    if (!previous) completions.set(event.id, event);
    else if (canonical(previous) !== canonical(event)) conflictIds.add(event.id);
  }
  const unknownLegacy = value => practiceProgressStatus(value) === "completed"
    && (typeof value !== "object" || value.v !== 3 || !Array.isArray(value.completions) || value.completions.length === 0);
  return {
    v: 3, status: status || "default", completions: [...completions.values()],
    legacyEvidenceUnknown: Boolean(existing?.legacyEvidenceUnknown || incoming?.legacyEvidenceUnknown || unknownLegacy(existing) || (completions.size === 0 && unknownLegacy(incoming))),
    ...(conflictIds.size ? { completionConflictIds: [...conflictIds] } : {})
  };
}
export function normalizePracticeProgressRecords(map = {}) {
  return Object.fromEntries(Object.entries(map || {}).filter(([, value]) => practiceProgressStatus(value))
    .map(([key, value]) => [key, mergePracticeProgressRecords(undefined, value)]));
}
export function practiceStatusMap(map = {}) {
  return Object.fromEntries(Object.entries(map || {}).map(([key, value]) => [key, practiceProgressStatus(value)]).filter(([, status]) => status));
}
// Keep historical scalar hydration compatible until evidence-bearing v3 rows
// arrive. Explicit record loaders always expose normalized v3 records.
export function mergePracticeProgressValue(existing, incoming) {
  const record = mergePracticeProgressRecords(existing, incoming);
  return existing?.v === 3 || incoming?.v === 3 || existing?.completions || incoming?.completions ? record : record.status;
}
export function readPracticeProgressRecords(storageKey) {
  try { return normalizePracticeProgressRecords(JSON.parse(localStorage.getItem(storageKey) || "{}")); }
  catch { return {}; }
}
export function writePracticeProgressRecords(storageKey, progress, { area, scopeKey, enqueue }) {
  const previous = readPracticeProgressRecords(storageKey);
  const next = { ...previous };
  for (const [key, value] of Object.entries(progress || {})) {
    if (practiceProgressStatus(value)) next[key] = mergePracticeProgressRecords(previous[key], value);
  }
  let localSaved = false;
  try { localStorage.setItem(storageKey, JSON.stringify(next)); localSaved = true; }
  catch { /* Queue admission is independent of local record storage. */ }
  let queued = true;
  for (const [key, value] of Object.entries(next)) {
    try { if (enqueue(area, key, value, { scopeKey }) !== true) queued = false; }
    catch { queued = false; }
  }
  return { localSaved, queued };
}
