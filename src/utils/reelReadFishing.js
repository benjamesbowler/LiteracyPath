const PONDS = [
  { id: 'shallows', name: 'Sunny shallows', length: 17.4, reelRate: 3.05, pullRate: .8, period: 3.6, tensionRate: .26 },
  { id: 'channel', name: 'Reed channel', length: 19.6, reelRate: 3.05, pullRate: 1.05, period: 3.1, tensionRate: .33 },
  { id: 'deep', name: 'Deep pool', length: 20.8, reelRate: 3.15, pullRate: 1.25, period: 2.8, tensionRate: .4 }
];

export function fishingPondForEncounter(index = 0) {
  return PONDS[index < 3 ? 0 : index < 7 ? 1 : 2];
}

export function createFishingFight({ encounter = 0, depth = .5, seed = 0 } = {}) {
  const pond = fishingPondForEncounter(encounter);
  const initialLength = pond.length + Math.max(0, Math.min(1, depth)) * 2.6;
  return { pond, initialLength, remaining: initialLength, tension: .18, strain: 0, elapsed: 0,
    phase: (Math.abs(seed) % 11) * .23, pull: 0, sway: 0, landed: false, escaped: false };
}

/** Metres of line, reel force and fish pull. No answer/scoring or waiting clock. */
export function stepFishingFight(previous, { reeling = false, lateralLoad = 0 } = {}, seconds = 1 / 60) {
  if (previous.landed || previous.escaped) return previous;
  const dt = Math.max(0, Math.min(.05, Number(seconds) || 0));
  if (!dt) return previous;
  const state = { ...previous, elapsed: previous.elapsed + dt };
  const angle = state.elapsed * Math.PI * 2 / state.pond.period + state.phase;
  state.pull = Math.max(0, Math.sin(angle)) ** 4;
  state.sway = Math.sin(angle * .56) * state.pull;
  const payout = state.pull * state.pond.pullRate;
  state.remaining = Math.min(state.initialLength * 1.12, Math.max(0,
    state.remaining + (reeling ? payout - state.pond.reelRate : payout * .8) * dt));
  const tensionChange = reeling
    ? .065 + state.pull * state.pond.tensionRate + Math.min(.1, Math.abs(lateralLoad) * .1)
    : -.5 + state.pull * .075;
  state.tension = Math.max(.04, Math.min(1, state.tension + tensionChange * dt));
  state.strain = Math.max(0, state.strain + (state.tension > .94 ? dt : -dt * 2));
  state.escaped = state.strain >= .72;
  state.landed = !state.escaped && state.remaining <= .75;
  return state;
}

/** Catch up one slow rendering frame without large collision/line jumps. */
export function fishingFrameSteps(seconds) {
  const elapsed = Math.max(0, Math.min(.12, Number(seconds) || 0));
  if (!elapsed) return [];
  const count = Math.ceil(elapsed / .025);
  return Array.from({ length: count }, () => elapsed / count);
}
