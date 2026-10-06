const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

export function rocketFlightState({ lane = 1, x = 0, hearts = 3 } = {}) {
  return { lane: clamp(Math.trunc(lane), 0, 2), x, velocity: 0, bank: 0,
    hearts: clamp(Math.trunc(hearts), 0, 3), immunity: 0, motorHits: 0,
    motorMisses: 0, motorRetries: 0, stopped: hearts <= 0 };
}

/** An unfinished lane animation never owns the next input. The visible craft
 * and collider share this continuous position, including an immediate reverse.
 */
export function steerRocketFlight(state, direction) {
  if (state.stopped || ![-1, 1].includes(direction)) return false;
  const next = clamp(state.lane + direction, 0, 2);
  if (next === state.lane) return false;
  state.lane = next;
  return true;
}

export function stepRocketFlight(state, seconds, laneX, { reducedMotion = false } = {}) {
  if (state.stopped) return;
  const dt = clamp(Number(seconds) || 0, 0, 1 / 60);
  if (!dt) return;
  const target = laneX(state.lane), before = state.x;
  // Critically damped physical steering; no cosmetic delay before movement.
  const omega = 19, displacement = state.x - target, damping = Math.exp(-omega * dt);
  const sum = state.velocity + omega * displacement;
  state.x = target + (displacement + sum * dt) * damping;
  state.velocity = (state.velocity - omega * sum * dt) * damping;
  if (Math.abs(state.x - target) < .0001 && Math.abs(state.velocity) < .001) {
    state.x = target; state.velocity = 0;
  }
  const visibleVelocity = (state.x - before) / dt;
  state.bank = reducedMotion ? 0 : clamp(-visibleVelocity * .035, -.24, .24);
  state.immunity = Math.max(0, state.immunity - dt);
}

/** Pure motor event. No word, receipt, answer counter or star field is read or
 * written. The caller visibly renders immunity and the stopped Retry state. */
export function hitRocketMeteor(state) {
  if (state.stopped || state.immunity > 0) return false;
  state.hearts = Math.max(0, state.hearts - 1);
  state.motorHits += 1;
  state.immunity = 1.4;
  state.stopped = state.hearts === 0;
  return true;
}

export function retryRocketFlight(state) {
  if (!state.stopped) return false;
  state.hearts = 3; state.immunity = 1.4; state.stopped = false;
  state.velocity = 0; state.bank = 0; state.motorRetries += 1;
  return true;
}

/** Earliest swept world-space encounter, independent of spelling/correctness.
 * A wide debug collider cannot cause an adjacent-lane catch invisible in play.
 */
export function rocketFlightContact(from, to, bodies, radius = .34) {
  let first = null;
  for (const body of bodies) {
    if (body.passed || body.alive === false) continue;
    const rz = Math.max(.001, body.depthRadius || .24), rx = Math.max(.001, (body.radius || .43) + radius);
    const x = (from.x - body.x) / rx, z = (from.z - body.z) / rz;
    const dx = (to.x - from.x) / rx, dz = (to.z - from.z) / rz;
    const a = dx * dx + dz * dz, c = x * x + z * z - 1;
    let t = c <= 0 ? 0 : null;
    if (t == null && a > 0) {
      const b = 2 * (x * dx + z * dz), d = b * b - 4 * a * c;
      if (d >= 0) {
        const enter = (-b - Math.sqrt(d)) / (2 * a);
        if (enter >= 0 && enter <= 1) t = enter;
      }
    }
    if (t != null && (!first || t < first.t)) first = { body, t,
      x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t };
  }
  return first;
}
