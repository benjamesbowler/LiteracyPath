const clamp = value => Math.max(0, Math.min(1, value));
const collectSeconds = .38, releaseSeconds = .62;
const point = value => value && Number.isFinite(value.x) && Number.isFinite(value.y);

export function soundSafariGuideSlot(slot, slotCount, width, height) {
  const slotWidth = Math.min(82, (width - 90) / Math.max(4, slotCount));
  const y = height - (height < 360 ? 52 : 74), boxHeight = height < 360 ? 34 : 56;
  const x = width / 2 - slotWidth * slotCount / 2 + slot * slotWidth;
  return { x, y, width: slotWidth - 8, height: boxHeight,
    centre: { x: x + slotWidth / 2 - 4, y: y + boxHeight / 2 } };
}

// A cosmetic owner follows already accepted catches. It never sees the needed
// sound, selects a creature, advances the controller or supplies a response.
// Positions are normalised so a viewport change cannot replay an accepted catch.
export function createSoundSafariCaptureMotion() {
  const flights = new Map();
  let disposed = false;
  return {
    begin({ id, roundId, slot, slotCount, critter, centre, radius, width, height }) {
      if (disposed || typeof id !== 'string' || !id || typeof roundId !== 'string' || !roundId
        || flights.has(id) || !Number.isInteger(slotCount) || slotCount < 1 || slotCount > 16
        || !Number.isInteger(slot) || slot < 0 || slot >= slotCount || !point(centre)
        || ![width, height, radius].every(value => Number.isFinite(value) && value > 0)) return false;
      if (flights.size >= 16) return false;
      flights.set(id, { id, roundId, slot, slotCount,
        critter: { type: critter?.type || 0, phase: critter?.phase || 0, vx: critter?.vx || 0,
          color: critter?.color || 0, spriteFrame: critter?.spriteFrame || 0 },
        from: { x: centre.x / width, y: centre.y / height }, radius: radius / Math.min(width, height),
        age: 0, releaseAge: null, releaseAt: null, releasing: false });
      return true;
    },
    release(roundId) {
      if (disposed) return;
      for (const flight of flights.values()) if (flight.roundId === roundId && !flight.releasing) {
        flight.releasing = true; flight.releaseAt = Math.max(collectSeconds, flight.age);
      }
    },
    advance(dt) {
      if (disposed || !Number.isFinite(dt) || dt < 0 || dt > .2) return;
      for (const [id, flight] of flights) {
        flight.age += dt;
        if (flight.releasing && flight.age >= flight.releaseAt) {
          flight.releaseAge = Math.max(0, flight.age - flight.releaseAt);
          if (flight.releaseAge >= releaseSeconds) flights.delete(id);
        }
      }
    },
    sample(width, height, slotPosition, reducedMotion = false) {
      if (disposed || ![width, height].every(value => Number.isFinite(value) && value > 0)) return [];
      const sampled = [];
      for (const flight of flights.values()) {
        const target = slotPosition(flight.slot, flight.slotCount);
        if (!point(target)) continue;
        const start = { x: flight.from.x * width, y: flight.from.y * height };
        const releasing = flight.releaseAge !== null;
        const t = clamp((releasing ? flight.releaseAge / releaseSeconds : flight.age / collectSeconds));
        const eased = t * t * (3 - 2 * t);
        const from = releasing ? target : start, to = releasing ? start : target;
        const arc = reducedMotion ? 0 : Math.sin(Math.PI * t) * Math.min(50, height * .08);
        const x = from.x + (to.x - from.x) * eased, y = from.y + (to.y - from.y) * eased - arc;
        const originalRadius = flight.radius * Math.min(width, height);
        const radius = releasing ? 12 + (originalRadius - 12) * eased : originalRadius + (12 - originalRadius) * eased;
        sampled.push({ id: flight.id, roundId: flight.roundId, slot: flight.slot,
          phase: releasing ? 'release' : t === 1 ? 'guide' : 'collect',
          x, y, radius, opacity: releasing ? 1 - eased : 1,
          critter: { ...flight.critter, x, y, hitX: x, hitY: y, r: radius, hitRadius: radius } });
      }
      return sampled;
    },
    clear() { flights.clear(); },
    inspect: () => ({ disposed, flights: [...flights.values()].map(({ id, roundId, slot, age, releasing, releaseAge }) =>
      ({ id, roundId, slot, age, releasing, releaseAge })) }),
    dispose() { disposed = true; flights.clear(); }
  };
}
