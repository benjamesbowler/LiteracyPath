// World units: one fork every 22 units, three lane centres on an 11-unit road.
// Distance increases along negative Z. Heading is Three.js yaw relative to -Z;
// a model authored facing +Z therefore uses rotation.y = Math.PI + heading.
export const RACER_LANE_OFFSETS = Object.freeze([-3, 0, 3]);
export const RACER_FORK_SPACING = 22;
export const RACER_ROAD_WIDTH = 11;
export function sampleRacerRoute(distance, lateralOffset = 0) {
  // Negative distance is the straight starting apron and chase-camera space.
  const s = Number.isFinite(distance) ? distance : 0;
  const lateral = Number.isFinite(lateralOffset) ? lateralOffset : 0;
  const t = Math.max(0, s - RACER_FORK_SPACING) * Math.PI / 90;
  const x = 5 * Math.sin(t) ** 3;
  const slope = s <= RACER_FORK_SPACING ? 0 : 15 * Math.sin(t) ** 2 * Math.cos(t) * Math.PI / 90;
  const norm = Math.hypot(slope, 1);
  const tangent = { x: slope / norm, y: 0, z: -1 / norm };
  const right = { x: 1 / norm, y: 0, z: slope / norm };
  return {
    position: { x: x + right.x * lateral, y: 0, z: -s + right.z * lateral },
    tangent, right, heading: Math.atan2(-tangent.x, -tangent.z), width: RACER_ROAD_WIDTH
  };
}
