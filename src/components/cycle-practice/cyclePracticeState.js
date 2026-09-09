import { buildCyclePracticePlan } from "./cyclePracticeContent.js";
import { CYCLE_ACTIVITY_GAP_MS, CYCLE_PRACTICE_VERSION } from "../../policy/cyclePracticePolicy.js";

export const buildCyclePlan = buildCyclePracticePlan;

export function createCycleClock(now = performance.now()) {
  let lastTick = now, lastInput = null, previousCheckActive = false;
  const values = { activePracticeSeconds: 0, sessionElapsedSeconds: 0, checkSeconds: 0 };
  return {
    values,
    restore(saved = {}) { for (const key of Object.keys(values)) values[key] = Number.isFinite(Number(saved[key])) ? Math.max(0, Number(saved[key])) : 0; },
    tick(at, mode, visible, paused) {
      const dt = Math.max(0, at - lastTick) / 1000;
      lastTick = at;
      values.sessionElapsedSeconds += dt;
      if (previousCheckActive) values.checkSeconds += dt;
      previousCheckActive = visible && !paused && mode === "assessment";
      if (!visible || paused) lastInput = null;
    },
    input(at, mode, visible, paused) {
      if (!visible || paused || mode !== "practice") { lastInput = null; return; }
      if (lastInput !== null && at >= lastInput && at - lastInput <= CYCLE_ACTIVITY_GAP_MS) values.activePracticeSeconds += (at - lastInput) / 1000;
      lastInput = at;
    },
    resetInput() { lastInput = null; }
  };
}
export function cycleStorageKey(scope, session, cycle) { return `lp:cycle-session:v2:${encodeURIComponent(scope)}:${encodeURIComponent(session || "preview")}:${cycle}`; }
export function readCycleState(key, storage) {
  try { const saved = JSON.parse((storage || globalThis.localStorage).getItem(key)); return saved?.version === CYCLE_PRACTICE_VERSION && ["practice", "assessment"].includes(saved.mode)
      && Array.isArray(saved.assessmentRecords) && Array.isArray(saved.practiceRecords)
      && [saved.pass, saved.practiceIndex, saved.assessmentIndex, saved.attempts].every(v => Number.isInteger(v) && v >= 0) ? saved : null; } catch { return null; }
}
export function writeCycleState(key, state, storage) {
  try { storage ||= globalThis.localStorage; const value = JSON.stringify({ ...state, version: CYCLE_PRACTICE_VERSION }); storage.setItem(key, value); return storage.getItem(key) === value; } catch { return false; }
}
