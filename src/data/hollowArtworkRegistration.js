// Contact points belong to these complete room illustrations. Coordinates are
// the centre of a usable tabletop surface, not the centre of an item or label.
// Slot order preserves every saved s1..s6 / expansion-1..4 ownership binding.
import { HOLLOW_DECORATION_BOUNDS } from './hollowDecorationBounds.generated.js';

export const HOLLOW_ARTWORK_REVISION = 'clean-cartoon-room-contacts-2026-11-02';

const percent = points => points.map(([x, y]) => [x / 1672 * 100, y / 941 * 100]);
export const HOLLOW_ARTWORK_CONTACTS = {
  dino: percent([[382, 564], [557, 564], [738, 564], [920, 564], [1103, 564], [1278, 564]]),
  meadow: percent([[416, 645], [584, 645], [759, 645], [936, 645], [1111, 645], [1286, 645]]),
  moonwood: percent([[214, 738], [468, 738], [719, 738], [970, 738], [1215, 738], [1460, 738]]),
  'exp-cave': percent([[401, 520], [687, 520], [987, 520], [1272, 520]]),
  'exp-garden': percent([[520, 795], [731, 447], [959, 651], [1222, 795]]),
  'exp-pond': percent([[473, 497], [714, 497], [959, 497], [1201, 497]]),
  'exp-treetop': percent([[351, 781], [737, 781], [1124, 781], [1318, 366]])
};

// Explicit compatibility inputs from the previous art revision. Matching an
// entire old room translates it once in memory; no cached or hosted layout,
// purchase record, slot identifier or app_config row is rewritten.
export const HOLLOW_LEGACY_DEFAULT_SPOTS = {
  meadow: [[31, 63], [40, 34], [48, 63], [57, 34], [66, 63], [74, 34]],
  dino: [[20, 57], [31, 57], [43, 57], [54, 57], [65, 57], [76, 57]],
  moonwood: [[17, 67], [28, 67], [40, 67], [51, 67], [63, 67], [74, 67]],
  'exp-garden': [[26, 64], [43, 44], [60, 64], [76, 44]],
  'exp-pond': [[26, 64], [43, 44], [60, 64], [76, 44]],
  'exp-cave': [[26, 64], [43, 44], [60, 64], [76, 44]],
  'exp-treetop': [[26, 64], [43, 44], [60, 64], [76, 44]]
};
export const HOLLOW_LEGACY_LIVE_SPOTS = {
  dino: [[22.7, 56.1], [34, 56.3], [45.3, 56.3], [55.9, 56.3], [66.7, 56.1], [77.6, 55.9]],
  meadow: [[29.7, 62.6], [39.8, 46.2], [47.2, 24.5], [57.5, 63], [67.2, 46.4], [76.4, 62.4]],
  moonwood: [[14.3, 75.9], [28.4, 74.4], [43.1, 73.1], [58.7, 73], [74.4, 73.8], [88.2, 74.9]],
  'exp-cave': [[23.7, 50.4], [41.7, 50.1], [58.9, 50.9], [76.7, 50.4]],
  'exp-garden': [[30.2, 83.3], [42.5, 45.2], [56.3, 65.5], [69.6, 83.6]],
  'exp-pond': [[28.1, 48.5], [43.4, 48.4], [58.1, 48.8], [72.6, 47.7]],
  'exp-treetop': [[22.4, 81.6], [44.2, 81.2], [66.2, 80.9], [71.4, 31.6]]
};

const equal = (a, b) => Array.isArray(a) && a.length === b?.length &&
  a.every((point, i) => point.length === 2 && point.every((n, j) => Math.abs(n - b[i][j]) < .000001));

export function registeredHollowSpots(roomId, override) {
  const current = HOLLOW_ARTWORK_CONTACTS[roomId] || HOLLOW_ARTWORK_CONTACTS.meadow;
  const selected = override?.[roomId];
  if (!selected?.length || equal(selected, HOLLOW_LEGACY_DEFAULT_SPOTS[roomId]) || equal(selected, HOLLOW_LEGACY_LIVE_SPOTS[roomId])) {
    return current.map(point => [...point]);
  }
  // An admin edit on the current room remains authoritative.
  return selected.map(point => [...point]);
}

export function hollowDecorationAnchor(itemId) {
  const body = HOLLOW_DECORATION_BOUNDS[itemId];
  if (!body) return { centreX: .5, bottom: 1 };
  return { centreX: (body.bounds[0] + body.bounds[2]) / (2 * body.width), bottom: body.bounds[3] / body.height };
}

export function hollowDecorationBox(itemId, point, size = 128) {
  const anchor = hollowDecorationAnchor(itemId);
  return { x: point.x * 19.2 - size * anchor.centreX, y: point.y * 10.8 - size * anchor.bottom, width: size, height: size };
}
