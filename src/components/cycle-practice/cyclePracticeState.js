import { buildStationRounds, stationsForCycle, isCycleQuestEligibleRound } from "../elQuest/elQuestEngine.js";
import { distributeAnswerPositions } from "../../utils/answerPositionShuffle.js";
import { CYCLE_ACTIVITY_GAP_MS, CYCLE_PRACTICE_VERSION } from "../../policy/cyclePracticePolicy.js";

export function buildCyclePlan(cycle, seed, pass = 0, check = false) {
  if (!cycle) return { rounds: [], unavailable: ["Cycle"] };
  const unavailable = [];
  let stations;
  try { stations = stationsForCycle(cycle).filter(s => !["check", "poem"].includes(s.id)); }
  catch { return { rounds: [], unavailable: ["Cycle content"] }; }
  let rounds = stations.flatMap(station => {
    try {
      // Fixed source pool; successive passes rotate through it before repeating.
      const pool = buildStationRounds(cycle, station.id, { seed: `${seed}:${station.id}` }).map((round, index) => ({ ...round, id: round.id || `${cycle.id}:${station.id}:${index}` })).filter(r => r.mechanicId !== "poemSpotlight");
      if (!pool.length) throw new Error("empty");
      const selected = check ? pool.filter(isCycleQuestEligibleRound) : Array.from({ length: Math.min(3, pool.length) }, (_, i) => pool[(pass * 3 + i) % pool.length]);
      return selected.map(r => ({ ...r, stationId: check ? "check" : station.id, stationTitle: check ? "Cycle Check" : station.title }));
    } catch { unavailable.push(station.title); return []; }
  });
  if (check) {
    // Filter before composing: one representative of every eligible construct,
    // then fresh additional items to ten. Never truncate away a construct.
    const byConstruct = new Map();
    for (const round of rounds) if (!byConstruct.has(round.construct)) byConstruct.set(round.construct, round);
    const first = [...byConstruct.values()];
    const ids = new Set(first.map(r => r.id));
    const remaining = rounds.filter(r => !ids.has(r.id));
    rounds = [...first, ...remaining].slice(0, Math.max(10, first.length));
  }
  return { rounds: distributeAnswerPositions(rounds, `${seed}:${pass}:${check}`), unavailable };
}

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
