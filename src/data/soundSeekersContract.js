// Lightweight cross-surface contract. The full Sound Seekers sequence is lazy,
// but Home needs the trail total without pulling that content into the entry
// bundle.
export const SOUND_SEEKERS_TRAIL_COUNT = 40;

export function isSoundSeekersTrailId(value) {
  const match = /^s(\d+)$/.exec(String(value || ""));
  if (!match) return false;
  const index = Number(match[1]);
  return index >= 1 && index <= SOUND_SEEKERS_TRAIL_COUNT;
}
