const wrapped = angle => Math.atan2(Math.sin(angle), Math.cos(angle));

/** Presentation only. Inputs contain place receipts and visible geometry, never
 * questions, expected answers, learner ability, or a source of new rewards. */
export function stepCampaignResident(previous, {
  home, work, player, completedCount = 0, dt = 0, active = true, reduced = false
}) {
  const state = previous || { heading: .4, completedCount, celebration: 0, mode: 'attend', started: false, nearby: false };
  if (!active) return state.started ? state : { ...state, completedCount };
  const seconds = Math.min(.25, Math.max(0, Number.isFinite(dt) ? dt : 0));
  const repaired = state.started && completedCount > state.completedCount;
  const celebration = reduced ? 0 : repaired ? 1.8 : Math.max(0, state.celebration - seconds);
  // Hysteresis avoids repeatedly changing attention on the edge of the radius.
  const distance = Math.hypot(player.x - home.x, player.z - home.z);
  const nearby = distance < (state.nearby ? 6 : 4.8);
  const target = nearby ? player : work;
  const bearing = Math.atan2(target.x - home.x, target.z - home.z);
  const difference = wrapped(bearing - state.heading);
  const turn = Math.min(Math.abs(difference), seconds * 2.2) * Math.sign(difference);
  return {
    heading: wrapped(reduced ? bearing : state.heading + turn),
    completedCount, celebration, nearby, started: true,
    mode: celebration > 0 ? 'celebrate' : nearby ? 'greet' : 'attend'
  };
}
