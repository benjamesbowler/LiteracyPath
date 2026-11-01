// Physics remains authoritative. Renderers sample between two completed poses
// using the same alpha for the actor, camera and moving world objects.
export function interpolateArcadeMotion(previous, current, alpha, output, keys, angleKeys = []) {
  const amount = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
  for (const key of keys) {
    const end = current[key];
    const start = previous?.[key];
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      output[key] = end;
      continue;
    }
    const difference = angleKeys.includes(key)
      ? Math.atan2(Math.sin(end - start), Math.cos(end - start))
      : end - start;
    output[key] = start + difference * amount;
  }
  return output;
}

// One semantic actor can replace its physics object on every step. Keep the
// previous numeric pose separately and reuse a render-only output object.
export function createArcadeMotionTrack(keys, angleKeys = []) {
  let previous = null;
  const output = {};
  return {
    capture(current) {
      if (!current) { previous = null; return; }
      previous ||= {};
      for (const key of keys) previous[key] = current[key];
    },
    reset() { previous = null; },
    sample(current, alpha, snap = false) {
      if (!current) return null;
      for (const key of Object.keys(output)) if (!Object.hasOwn(current, key)) delete output[key];
      Object.assign(output, current);
      return interpolateArcadeMotion(snap ? null : previous, current, alpha, output, keys, angleKeys);
    },
  };
}
