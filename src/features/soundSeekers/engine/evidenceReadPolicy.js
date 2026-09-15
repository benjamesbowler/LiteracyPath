// Read-only interpretation of saved evidence. Reporting and progress restore
// must not initialize the gameplay controller or download its audio catalogues.
export const AUDIO_COMPLETED = "completed";

function finiteNonNegative(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function dateFor(value) {
  if (value === null || value === undefined || value === "") return null;
  try {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function normalizedEvidenceAt(value) {
  const date = dateFor(value);
  return date ? date.toISOString() : null;
}

export function isValidSessionDay(value) {
  const match = typeof value === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day);
}

// Uses the local calendar getters deliberately. A session may also supply its
// trusted child-local day, which wins over this device-local fallback.
export function localSessionDayFor(at) {
  const date = dateFor(at);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function evidenceIsIndependent(event) {
  if (!event || event.evidenceKind !== "practice") return false;
  if (finiteNonNegative(event.supportLevel) !== 0 || event.revealed === true) return false;
  return event.audioRequired === false || event.cueDelivery === AUDIO_COMPLETED;
}
