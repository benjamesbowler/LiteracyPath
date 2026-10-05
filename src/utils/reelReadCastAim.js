import { beginReelReadCast, stepReelReadSimulation } from './reelReadSimulation.js';
import { reelReadCastColumn, stepReelReadFish } from './reelReadMotion.js';

export const REEL_READ_AIM_INTERVAL_SECONDS = .05;
const STEP = 1 / 120, ANTICIPATION = .18;

/** Only motor numbers and identities cross this boundary. Target/word,
 * correctness, response history, audio and live object references do not. */
export function detachedReelReadMotorState(state) {
  return {
    elapsed: state.elapsed, stage: state.stage, boatPosition: state.boatPosition,
    boatVelocity: state.boatVelocity || 0, facing: state.facing,
    level: { visibleFish: state.level.visibleFish, fishSpeed: state.level.fishSpeed, hookSpeed: state.level.hookSpeed },
    fish: state.fish.map(({ id, slot, phase, direction }) => ({ id, slot, phase, direction })),
    steering: 0, reeling: false, castPending: false, hook: null, fight: null,
    paused: false, complete: false, celebrating: false,
    castAt: -Infinity, landedAt: state.landedAt, escapeAt: state.escapeAt, errorAt: state.errorAt,
    motorMisses: 0, motorEscapes: 0,
  };
}

/** Forecast the same finite anticipation/drop used by the real motor step.
 * No event/learning callbacks are supplied. The first physical hit is returned
 * even when it is another fish; selected identity never changes hit priority.
 * Geometry reads the detached state and the renderer's current registered art.
 */
export function forecastReelReadCast(state, selectedId, geometry) {
  if (state.paused || state.complete || state.celebrating || state.hook || state.castPending || state.fight) return null;
  const motor = detachedReelReadMotorState(state);
  const selected = motor.fish.find(fish => fish.id === selectedId);
  if (!selected || !(motor.level.hookSpeed > 0) || !(motor.level.visibleFish > 0)) return null;
  const release = geometry({ ...motor, elapsed: motor.elapsed + ANTICIPATION + 1e-7,
    castAt: motor.elapsed, castPending: true });
  if (!release.rod) return null;
  const horizon = ANTICIPATION + Math.max(0, release.layout.controlsTop - 12 - release.rod.tip.y) / motor.level.hookSpeed + STEP * 2;
  let arrival = motor.elapsed + ANTICIPATION;
  let moving = stepReelReadFish(selected, release.layout, motor.level, arrival);
  arrival += Math.max(0, moving.y - release.rod.tip.y) / motor.level.hookSpeed;
  moving = stepReelReadFish(selected, release.layout, motor.level, arrival);
  const column = reelReadCastColumn(release.rod, release.layout, motor.facing);
  const delta = moving.x - column;
  const steering = moving.visible && Math.abs(delta) > 8 ? Math.sign(delta) : 0;
  beginReelReadCast(motor, 'motor-forecast');
  const steps = Math.ceil(horizon / STEP);
  for (let index = 0; index < steps; index++) {
    const view = geometry(motor);
    const hit = stepReelReadSimulation(motor, STEP, { ...view, resolveRod: current => geometry(current).rod });
    if (hit?.type === 'hook-impact') return { firstHit: hit, steps: index + 1, horizonSeconds: horizon,
      steering, projectedFishX: moving.x, releaseColumn: column };
    if (motor.motorMisses || (!motor.castPending && !motor.hook)) break;
  }
  return { firstHit: null, steps, horizonSeconds: horizon, steering,
    projectedFishX: moving.x, releaseColumn: column };
}

/** A registered release can point beyond the readable channel even while its
 * ready pose points toward the selected fish. Consider the real opposite
 * release only when the fish is readable now and that cast's FIRST physical
 * collider is the selected identity. A different first fish cannot authorize
 * a turn or response. Both forecasts own detached motor state. */
export function forecastReelReadAlignedCast(state, selectedId, geometry) {
  const current = forecastReelReadCast(state, selectedId, geometry);
  if (!current) return null;
  if (current.firstHit?.fishId === selectedId) return { ...current, facing: state.facing };
  const motor = detachedReelReadMotorState(state);
  const selected = motor.fish.find(fish => fish.id === selectedId);
  const view = geometry(motor);
  if (!selected || !stepReelReadFish(selected, view.layout, motor.level, motor.elapsed).visible)
    return { ...current, facing: state.facing };
  motor.facing = state.facing === 'left' ? 'right' : 'left';
  const alternate = forecastReelReadCast(motor, selectedId, geometry);
  return alternate?.firstHit?.fishId === selectedId
    ? { ...alternate, facing: motor.facing } : { ...current, facing: state.facing };
}
