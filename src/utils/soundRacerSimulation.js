import { currentRacerRound, reduceRacerIntent } from "./soundRacerMission.js";
import { RACER_LANE_OFFSETS } from "./soundRacerRoute.js";
export const RACER_FIXED_STEP = 1 / 60;
export const RACER_TRAVEL_SPEED = 10;
export const RACER_MAX_FRAME_MS = 250;
export function createRacerSimulation() {
  return { distance: 0, lateral: 0, speed: 0, accumulator: 0, timeSeconds: 0, clockEpoch: null };
}
export function advanceRacerFrame(simulation, initialState, frameMs) {
  let state = initialState;
  const sim = { ...simulation };
  const events = [];
  const clockChanged = sim.clockEpoch !== null && sim.clockEpoch !== state.clockEpoch;
  sim.clockEpoch = state.clockEpoch;
  if (clockChanged) { sim.accumulator = 0; frameMs = 0; }
  if (state.paused || state.phase === "finished") return { sim: { ...sim, accumulator: 0, speed: 0 }, state, events };
  const delta = Math.min(RACER_MAX_FRAME_MS, Math.max(0, Number.isFinite(frameMs) ? frameMs : 0)) / 1000;
  sim.accumulator += delta;
  while (sim.accumulator + 1e-10 >= RACER_FIXED_STEP) {
    sim.accumulator = Math.max(0, sim.accumulator - RACER_FIXED_STEP);
    sim.timeSeconds += RACER_FIXED_STEP;
    const round = currentRacerRound(state);
    if (!round) break;
    const moving = state.phase === "approach" || state.phase === "transition";
    sim.speed = moving ? Math.min(RACER_TRAVEL_SPEED, sim.speed + 20 * RACER_FIXED_STEP) : 0;
    sim.lateral += (RACER_LANE_OFFSETS[state.lane] - sim.lateral) * (1 - Math.exp(-10 * RACER_FIXED_STEP));
    if (!moving) continue;
    const endpoint = state.phase === "approach" ? round.distance
      : state.index === state.mission.rounds.length - 1 ? state.mission.finishDistance : round.distance + 8;
    sim.distance = Math.min(endpoint, sim.distance + sim.speed * RACER_FIXED_STEP);
    if (sim.distance + 1e-9 >= endpoint) {
      sim.distance = endpoint;
      const type = state.phase === "approach" ? "ARRIVE" : "TRANSITION_DONE";
      const intent = { type, revision: state.revision, missionId: state.missionId, roundId: round.id };
      state = reduceRacerIntent(state, intent);
      events.push(intent);
      if (state.phase === "decision" || state.phase === "finished") sim.speed = 0;
      if (state.phase === "finished") { sim.accumulator = 0; break; }
    }
  }
  return { sim, state, events };
}
