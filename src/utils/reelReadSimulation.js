import { createFishingFight, stepFishingFight } from './reelReadFishing.js';
import { reelReadHookImpact, stepReelReadFish, reelReadCastColumn } from './reelReadMotion.js';

const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

/** Fill only fresh/landed vacancies. A deliberate wrong answer or a motor
 * escape leaves this school, its IDs, words and slots intact. */
export function fillReelReadSchool(state, seed) {
  const remaining = state.level.correctWords.filter(word => !state.landedWords.includes(word)
    && !state.fish.some(fish => fish.word === word));
  const correctCount = state.fish.filter(fish => state.level.correctWords.includes(fish.word)).length;
  let needed = Math.max(0, Math.min(state.level.correctVisible,
    remaining.length + correctCount) - correctCount);
  while (state.fish.length < state.level.visibleFish && state.landedWords.length < state.level.correctWords.length) {
    const pool = needed ? remaining : state.level.distractors.filter(word => !state.fish.some(fish => fish.word === word));
    const word = pool.shift(); if (!word) break;
    const vacancies = Array.from({ length: state.level.visibleFish }, (_, slot) => slot)
      .filter(slot => !state.fish.some(fish => fish.slot === slot));
    const slot = vacancies[(seed + state.stage * 17 + state.nextId * 11) % vacancies.length];
    const id = state.nextId++;
    state.fish.push({ id, word, slot, phase: (id * 37 + state.stage * 29) % 191, direction: id % 2 ? 1 : -1 });
    if (needed) needed--;
  }
}

/** The first input event begins visible anticipation even if the tap is
 * released before a frame. Held action only controls the subsequent fight. */
export function beginReelReadCast(state, source = 'assistive') {
  if (state.paused || state.complete || state.celebrating || state.hook || state.fight || state.castPending) return false;
  state.castAt = state.elapsed; state.castPending = true; state.actionSource = source;
  return true;
}

/** Fixed-step motor simulation. The renderer supplies its actual painted rod
 * tip; the same hook positions drive line paint and first swept fish contact.
 * onHook alone decides language, before the independent reel/ease struggle. */
export function stepReelReadSimulation(state, seconds, view, { onHook, onLand, onEscape, onMiss } = {}) {
  if (state.paused || state.complete) return;
  const dt = clamp(Number(seconds) || 0, 0, 1 / 60);
  if (!dt) return;
  state.elapsed += dt;
  const { layout } = view;
  const steering = state.steering || 0;
  const desiredVelocity = steering * 170;
  state.boatVelocity = (state.boatVelocity || 0) + (desiredVelocity - (state.boatVelocity || 0)) * Math.min(1, dt * 13);
  const routeLength = Math.max(1, view.route ? view.route.max-view.route.min : layout.width-layout.boatWidth), previousBoat=state.boatPosition;
  state.boatPosition = clamp(previousBoat + state.boatVelocity*dt/routeLength, 0, 1);
  const boatDelta=(state.boatPosition-previousBoat)*routeLength;
  if (steering) state.facing = state.autoSteerId && state.alignFacing ? state.alignFacing : steering < 0 ? 'left' : 'right';
  const rod = view.resolveRod?.(state) || view.rod;
  for (const fish of state.fish) if (fish.id !== state.fight?.fishId)
    Object.assign(fish, stepReelReadFish(fish, layout, state.level, state.elapsed));
  if (state.celebrating || !rod) return;
  if (state.castPending && state.elapsed - state.castAt >= .18) {
    state.castPending = false;
    state.hook = { x: rod.tip.x, y: rod.tip.y, phase: 'dropping',
      column: reelReadCastColumn(rod,layout,state.facing),
      source: state.actionSource };
  }
  const hook = state.hook;
  if (!hook) return;
  if (state.fight) {
    const previous = state.fight;
    state.fight = { ...stepFishingFight(previous,
      { reeling: state.reeling, lateralLoad: steering }, dt), fishId: previous.fishId,
      anchorX: previous.anchorX, anchorY: previous.anchorY };
    const ratio = clamp(state.fight.remaining / state.fight.initialLength, 0, 1.12);
    const alongside = layout.waterTop + 24;
    hook.x = rod.tip.x + (state.fight.anchorX - rod.tip.x) * ratio + state.fight.sway * 18 * ratio;
    hook.y = alongside + (state.fight.anchorY - alongside) * clamp(ratio, 0, 1);
    if (state.fight.escaped) {
      const fish = state.fish.find(row => row.id === state.fight.fishId);
      state.motorEscapes++; state.escapeAt = state.elapsed;
      state.fight = null; state.hook = null; state.reeling = false;
      onEscape?.(fish); // Accepted language and school identity remain untouched.
    } else if (state.fight.landed) {
      const fish = state.fish.find(row => row.id === state.fight.fishId);
      state.landedAt = state.elapsed; state.fight = null; state.hook = null; state.reeling = false;
      onLand?.(fish);
    }
    return;
  }
  const previous = { x: hook.x, y: hook.y };
  hook.column = clamp(hook.column + boatDelta, 48, layout.width - 48);
  hook.x += (hook.column - hook.x) * Math.min(1, dt * 14);
  hook.y += (hook.phase === 'dropping' ? 1 : -1) * state.level.hookSpeed * dt;
  if (hook.phase === 'dropping') {
    const collision = reelReadHookImpact(previous, hook, state.fish.filter(fish => fish.visible), 7);
    if (collision) {
      hook.x = collision.x; hook.y = collision.y;
      const decision = onHook?.(collision.fish, hook.source);
      if (decision?.kind === 'accepted-hook' || decision?.kind === 'motor-rehook') {
        state.fight = { ...createFishingFight({ encounter: state.stage,
          depth: (collision.fish.y - layout.waterTop) / Math.max(1, layout.controlsTop - layout.waterTop),
          seed: collision.fish.id }), fishId: collision.fish.id,
          anchorX: collision.fish.x, anchorY: collision.fish.y };
        hook.phase = 'fight';
      } else hook.phase = 'returning';
      // Primitive motor observation for detached forecasts. The live engine
      // still grants language only through its existing actual onHook above.
      return { type: 'hook-impact', fishId: collision.fish.id, x: collision.x, y: collision.y };
    } else if (hook.y >= layout.controlsTop - 12) {
      hook.phase = 'returning'; state.motorMisses++; onMiss?.();
    }
  } else if (hook.y <= rod.tip.y) state.hook = null;
}
