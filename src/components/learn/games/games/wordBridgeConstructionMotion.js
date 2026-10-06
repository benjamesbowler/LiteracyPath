// Cosmetic handoff only. The physical controller commits pickup/placement and
// owns its piece IDs; these samples never accept a matching answer or gate input.
const DURATIONS = Object.freeze({ pickup: .24, place: .28, recover: .26 });
const clamp01 = value => Math.max(0, Math.min(1, value));
const point = value => value && Number.isFinite(value.x) && Number.isFinite(value.y);
const validSurface = value => value && point(value.centre) && Number.isFinite(value.angle)
  && Number.isFinite(value.width) && value.width > 0 && Number.isFinite(value.height) && value.height > 0;

export function newWordBridgeConstructionMotion(kind, physicalId, destination = null) {
  if (!Object.hasOwn(DURATIONS, kind) || !Number.isSafeInteger(physicalId) || physicalId < 0) return null;
  if (kind !== 'pickup' && !validSurface(destination)) return null;
  return { kind, physicalId, elapsed: 0, duration: DURATIONS[kind],
    destination: destination ? structuredClone(destination) : null };
}

export function advanceWordBridgeConstructionMotion(motion, dt) {
  if (!motion || !Number.isFinite(dt) || dt < 0) return motion;
  const elapsed = Math.min(motion.duration, motion.elapsed + dt);
  return elapsed >= motion.duration ? null : { ...motion, elapsed };
}

export function wordBridgeSlotSurface(slot) {
  if (!slot || !Number.isFinite(slot.x) || !Number.isFinite(slot.y)
    || !Number.isFinite(slot.w) || slot.w <= 0 || !Number.isFinite(slot.h) || slot.h <= 0) return null;
  return { centre: { x: slot.x + slot.w / 2, y: slot.y + slot.h / 2 }, angle: 0,
    width: slot.w, height: slot.h };
}

// Recompute from the current measured palms on every frame, so walking/facing
// remains live. A frozen start-hand coordinate would detach a carried piece.
export function wordBridgeConstructionSample(motion, handSurface, { reducedMotion = false } = {}) {
  if (!motion || !Object.hasOwn(DURATIONS, motion.kind) || !validSurface(handSurface)) return null;
  const t = clamp01(motion.elapsed / motion.duration);
  if (motion.kind === 'pickup') return {
    kind: motion.kind, physicalId: motion.physicalId, progress: t,
    reaching: !reducedMotion && t < .5, surface: structuredClone(handSurface),
    suppressPlacedPiece: false, attachedToMeasuredPalms: true
  };
  if (!validSurface(motion.destination)) return null;
  // The released plank leaves the palms and settles into the already committed
  // physical slot. Its identity stays one piece throughout this brief transfer.
  const release = reducedMotion ? 1 : clamp01((t - .25) / .75);
  const ease = release * release * (3 - 2 * release);
  const lerp = (a, b) => a + (b - a) * ease;
  const destination = motion.destination;
  return {
    kind: motion.kind, physicalId: motion.physicalId, progress: t,
    reaching: !reducedMotion, attachedToMeasuredPalms: release === 0,
    suppressPlacedPiece: motion.kind === 'place' && !reducedMotion,
    surface: {
      centre: { x: lerp(handSurface.centre.x, destination.centre.x), y: lerp(handSurface.centre.y, destination.centre.y) },
      angle: lerp(handSurface.angle, destination.angle), width: lerp(handSurface.width, destination.width),
      height: lerp(handSurface.height, destination.height)
    }
  };
}
