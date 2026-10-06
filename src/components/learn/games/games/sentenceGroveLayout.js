// Every answer uses the same nearby route fan. Correctness never participates
// in placement: a near, central or easy-to-reach tree is not a visual clue.
export const SENTENCE_GROVE_MAP_BOUNDS = Object.freeze({ minX: -118, maxX: 118, minZ: -88, maxZ: 88 });
export function sentenceGroveChoicePositions(count, player, serial = 0, bounds = SENTENCE_GROVE_MAP_BOUNDS) {
  const nearEdge = player.x < bounds.minX + 35 || player.x > bounds.maxX - 35 || player.z < bounds.minZ + 35 || player.z > bounds.maxZ - 35;
  const heading = nearEdge ? Math.atan2(-player.x, -player.z) : player.yaw;
  const skew = Math.sin(serial * 2.17) * 0.12;
  const positions = [];
  for (let index = 0; index < count; index += 1) {
    const angle = heading + (count === 1 ? 0 : (index / (count - 1) - 0.5) * 1.4) + skew;
    const distance = 23 + Math.sin(serial * 1.7 + index * 2.1) * 3;
    // A narrow corner can leave too little arc for all answers at one radius.
    // Search nearby rows as well so no choice is dropped or overlapped.
    findPosition: for (const radius of [distance, 29, 22, 16]) {
      for (let turn = 0; turn < 40; turn += 1) {
        const offset = turn === 0 ? 0 : Math.ceil(turn / 2) * 0.18 * (turn % 2 ? 1 : -1);
        const point = [player.x + Math.sin(angle + offset) * radius, player.z + Math.cos(angle + offset) * radius];
        if (point[0] < bounds.minX + 8 || point[0] > bounds.maxX - 8 || point[1] < bounds.minZ + 8 || point[1] > bounds.maxZ - 8) continue;
        if (positions.some(other => Math.hypot(point[0] - other[0], point[1] - other[1]) < 9)) continue;
        positions.push(point);
        break findPosition;
      }
    }
  }
  return positions;
}
