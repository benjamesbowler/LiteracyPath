import HERO_ANIMATIONS from '../content/heroAnimations.json' with { type: 'json' };

const ACTION_LENGTH = { use: .42, celebrate: .75, sad: .36, land: .22 };
const isAirborne = state => state === 'jump' || state === 'fall';
const wrap = (n, length) => ((n % length) + length) % length;

/** Pure pose selection. All silhouettes come from drawings; these values never
 * modify player coordinates, velocity, collision, or educational outcomes. */
export function sampleCampaignHeroPose(id, { state = 'idle', elapsed = 0, clock = 0, gait = 0, reducedMotion = false } = {}) {
  const atlas = HERO_ANIMATIONS[id];
  if (!atlas) return null;
  if (state === 'walk' || state === 'run') return { sheet: 'walk', frame: Math.floor(wrap(gait, 1) * atlas.frames.length), state };
  let frame = 0;
  if (state === 'jump' || state === 'fall') frame = 3;
  else if (state === 'land') frame = reducedMotion || elapsed < .11 ? 2 : 0;
  else if (state === 'use' || state === 'talk') frame = reducedMotion || elapsed > .055 && elapsed < .32 ? 4 : 0;
  else if (state === 'celebrate') frame = reducedMotion || elapsed > .07 && elapsed < .64 ? 5 : elapsed < .07 ? 2 : 0;
  else if (state === 'sad') frame = elapsed < .14 ? 2 : elapsed < .28 ? 1 : 0;
  else if (!reducedMotion) {
    // The same calm pose with closed eyelids, not a walking pose or whole-body bob.
    const phase = wrap(clock + [...id].reduce((n, c) => n + c.charCodeAt(0), 0) * .013, 4.1);
    frame = phase > 3.81 && phase < 3.96 ? 1 : 0;
  }
  return { sheet: 'action', frame, state };
}

/** One instance per actor. Advance on simulation updates, not texture uploads.
 * speed is actual world distance/second. actionId restarts an explicit one-shot
 * even if its state name matches the previous event. */
export function createCampaignHeroAnimator(id) {
  let clock = 0, gait = 0, elapsed = 0, previous = 'idle', active = 'idle', lastAction;
  return {
    update(dt, { state = 'idle', speed = 0, actionId, reducedMotion = false } = {}) {
      const delta = Number.isFinite(dt) ? Math.max(0, Math.min(.1, dt)) : 0;
      clock += delta;
      const travel = Number.isFinite(speed) ? Math.abs(speed) : 0;
      if ((state === 'walk' || state === 'run') && travel > 0) gait = wrap(gait + travel * delta / 155, 1);
      const newAction = actionId !== undefined && actionId !== lastAction;
      if (isAirborne(previous) && !isAirborne(state)) { active = 'land'; elapsed = 0; }
      else if (state !== previous || newAction) {
        // A landing recovery survives idle/walk changes, but never delays jumping.
        if (active !== 'land' || elapsed >= ACTION_LENGTH.land || isAirborne(state) || newAction) { active = state; elapsed = 0; }
      } else elapsed += delta;
      if (active === 'land' && elapsed >= ACTION_LENGTH.land) { active = state; elapsed = 0; }
      if (ACTION_LENGTH[active] && active !== 'land' && elapsed >= ACTION_LENGTH[active]) active = travel > 10 ? 'walk' : 'idle';
      previous = state;
      if (actionId !== undefined) lastAction = actionId;
      return sampleCampaignHeroPose(id, { state: active, elapsed, clock, gait, reducedMotion });
    },
  };
}

/** Rendering-only magenta key. It preserves neutral whites and skin/fur colours;
 * the source PNG remains unchanged. Removes backing spill at antialiased edges. */
export function keyCampaignHeroPixels(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const excess = Math.max(0, Math.min(r, b) - g);
    if (excess <= 24) continue;
    const alpha = Math.max(0, Math.min(1, (174 - excess) / 150));
    if (alpha < .02) { pixels[i + 3] = 0; continue; }
    const spill = 255 * (1 - alpha);
    pixels[i] = Math.max(0, Math.min(255, (r - spill) / alpha));
    pixels[i + 1] = Math.min(255, g / alpha);
    pixels[i + 2] = Math.max(0, Math.min(255, (b - spill) / alpha));
    pixels[i + 3] = Math.round(pixels[i + 3] * alpha);
  }
  return pixels;
}
