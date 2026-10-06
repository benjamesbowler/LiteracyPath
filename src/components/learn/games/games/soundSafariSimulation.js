const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const SOUND_SAFARI_STEP = 1 / 60;
const MAX_STEPS = 12;

// Cancelling pointer/keyboard intent stops the live net at its actual current
// position. It never completes an in-flight catch or changes learning rows.
export function releaseSoundSafariNetInput(state) {
  const net = state?.net;
  if (!Number.isFinite(net?.x) || !Number.isFinite(net?.y)) return false;
  net.targetX = net.x; net.targetY = net.y;
  return true;
}

// Existing Safari motion equations, separated from rendering/curriculum.
// Capture selection stays in soundSafariRounds; this never awards learning.
export function advanceSoundSafariWorld(state, dt, { height, reducedMotion = false }) {
  const motionDt = reducedMotion ? dt * .35 : dt;
  state.time += motionDt;
  state.pulse = Math.max(0, state.pulse - dt * 2.7);
  state.judgementT = Math.max(0, state.judgementT - dt);
  state.coachT = Math.max(0, state.coachT - dt);
  state.net.swingT = Math.max(0, state.net.swingT - dt);
  const previousX = state.net.x, previousY = state.net.y;
  state.net.x += (state.net.targetX - state.net.x) * clamp(dt * 12, 0, 1);
  state.net.y += (state.net.targetY - state.net.y) * clamp(dt * 12, 0, 1);
  const tilt = clamp((state.net.x - previousX) * .018 + (state.net.y - previousY) * .01, -.44, .44);
  state.net.angle += (tilt - state.net.angle) * clamp(dt * 9, 0, 1);
  state.countdown = Math.max(0, state.countdown - dt);
  for (const critter of state.critters) {
    critter.scareT = Math.max(0, critter.scareT - dt);
    critter.spawnT = Math.min(1, (critter.spawnT ?? 1) + dt * 2.5);
    const time = state.time + critter.phase;
    if (critter.moveStyle === 'orbit') {
      const targetX = critter.homeX + Math.sin(time * .92 * critter.speedScale) * critter.orbitX;
      const targetY = critter.homeY + Math.cos(time * .78 * critter.speedScale) * critter.orbitY;
      critter.x += (targetX - critter.x) * clamp(motionDt * 2.4, 0, 1);
      critter.y += (targetY - critter.y) * clamp(motionDt * 2.1, 0, 1);
    } else if (critter.moveStyle === 'zigzag') {
      critter.x += critter.vx * motionDt;
      critter.y += (critter.vy + Math.sin(time * 3.1) * 24 * critter.speedScale) * motionDt;
    } else if (critter.moveStyle === 'peek') {
      const peek = Math.max(0, Math.sin(time * 1.35));
      const targetX = critter.homeX + Math.sin(time * .72) * critter.orbitX * 1.35;
      const targetY = critter.homeY - peek * critter.orbitY * 1.7;
      critter.x += (targetX - critter.x) * clamp(motionDt * 2.8, 0, 1);
      critter.y += (targetY - critter.y) * clamp(motionDt * 3.1, 0, 1);
    } else {
      critter.x += critter.vx * motionDt; critter.y += critter.vy * motionDt;
    }
    if (critter.scareT > 0) {
      critter.x += Math.cos(time * 4.7) * critter.scareT * 48 * motionDt;
      critter.y += Math.sin(time * 5.1) * critter.scareT * 30 * motionDt;
    }
    critter.depth = clamp((critter.y - height * .28) / (height * .38), 0, 1);
    const minX = critter.homeX - critter.travelX, maxX = critter.homeX + critter.travelX;
    const minY = critter.homeY - critter.travelY, maxY = critter.homeY + critter.travelY;
    if (critter.x < minX || critter.x > maxX) { critter.x = clamp(critter.x, minX, maxX); critter.vx *= -1; }
    if (critter.y < minY || critter.y > maxY) { critter.y = clamp(critter.y, minY, maxY); critter.vy *= -1; }
  }
  state.bursts = state.bursts.map(burst => ({ ...burst, t: burst.t + dt })).filter(burst => burst.t < burst.life);
  if (state.wordClearT > 0) state.wordClearT = Math.max(.001, state.wordClearT - dt);
  return state.pendingAdvance && state.wordClearT > 0 && state.wordClearT <= .001;
}

export function createSoundSafariStepper(state, advance, onWordReady = () => {}) {
  let remainder = 0, steps = 0;
  return {
    advance(seconds) {
      if (state.paused || state.ended || state.onboarding) { remainder = 0; return 0; }
      if (!Number.isFinite(seconds) || seconds < 0) return 0;
      remainder = Math.min(MAX_STEPS * SOUND_SAFARI_STEP, remainder + Math.min(seconds, .2));
      let count = 0;
      while (remainder + 1e-9 >= SOUND_SAFARI_STEP && count < MAX_STEPS) {
        const wordReady = advance(SOUND_SAFARI_STEP);
        remainder = Math.max(0, remainder - SOUND_SAFARI_STEP); steps++; count++;
        if (wordReady) onWordReady();
        if (state.paused || state.ended || state.onboarding) { remainder = 0; break; }
      }
      return count;
    },
    reset() { remainder = 0; },
    inspect: () => ({ step: SOUND_SAFARI_STEP, remainder, steps, maxSteps: MAX_STEPS })
  };
}
