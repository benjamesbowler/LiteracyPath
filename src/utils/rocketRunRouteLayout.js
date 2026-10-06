const passages = {
  planet: { kind: 'planet-approach', primary: 'planet', secondary: ['beacon', 'beacon'] },
  asteroid: { kind: 'asteroid-corridor', primary: 'asteroid', secondary: ['asteroid', 'asteroid'] },
  station: { kind: 'station-fly-through', primary: 'portal', secondary: ['station', 'beacon'] },
  comet: { kind: 'comet-side-passage', primary: 'comet', secondary: ['planet', 'beacon'] },
};

// Each row authors all four real passages: order, travelled lengths, side,
// dressing distance and arrival spacing. These are scene compositions, not
// target banks or extra motor colliders. The gate's original open channel and
// the exact carrier/meteor simulation remain independent of this scenery.
const itineraries = {
  meadow: [
    { name: 'Garden Orbit', order: ['planet', 'asteroid', 'station', 'comet'],
      lengths: [60, 54, 64, 58], sides: [-1, 1, 0, 1], distances: [9, 8, 0, 8],
      dressing: [8, 7.8], spacing: [14, 30], scales: [.82, .78] },
    { name: 'Mill Harbour', order: ['station', 'planet', 'comet', 'asteroid'],
      lengths: [64, 58, 62, 52], sides: [0, 1, -1, -1], distances: [0, 9.6, 8.4, 8.8],
      dressing: [9.1, 8.6], spacing: [19, 37], scales: [.78, .86] },
    { name: 'Starlight Delivery', order: ['comet', 'station', 'asteroid', 'planet'],
      lengths: [56, 66, 52, 62], sides: [-1, 0, 1, -1], distances: [8.9, 0, 8.2, 9.4],
      dressing: [8.4, 9], spacing: [11, 33], scales: [.86, .74] },
  ],
  dino: [
    { name: 'Amber Rim', order: ['asteroid', 'planet', 'comet', 'station'],
      lengths: [58, 62, 54, 62], sides: [-1, 1, 1, 0], distances: [8.6, 9.3, 8.2, 0],
      dressing: [8.9, 8.1], spacing: [16, 35], scales: [.8, .84] },
    { name: 'Fossil Crossing', order: ['station', 'asteroid', 'planet', 'comet'],
      lengths: [68, 50, 64, 54], sides: [0, 1, -1, -1], distances: [0, 8.1, 9.7, 8.6],
      dressing: [8.3, 9.2], spacing: [21, 40], scales: [.86, .72] },
    { name: 'Comet Crater', order: ['planet', 'comet', 'station', 'asteroid'],
      lengths: [56, 60, 66, 54], sides: [-1, 1, 0, -1], distances: [9.8, 8.8, 0, 8.4],
      dressing: [9.4, 8.5], spacing: [12, 31], scales: [.74, .88] },
  ],
  moonwood: [
    { name: 'Lantern Crescent', order: ['comet', 'planet', 'asteroid', 'station'],
      lengths: [60, 58, 50, 68], sides: [1, -1, 1, 0], distances: [8.3, 9.5, 8.7, 0],
      dressing: [8.2, 9.3], spacing: [18, 38], scales: [.84, .76] },
    { name: 'Branchway Crossing', order: ['asteroid', 'station', 'comet', 'planet'],
      lengths: [52, 66, 58, 60], sides: [1, 0, -1, -1], distances: [8.9, 0, 8.1, 9.2],
      dressing: [9.2, 8.4], spacing: [13, 34], scales: [.76, .86] },
    { name: 'Twilight Circuit', order: ['planet', 'station', 'asteroid', 'comet'],
      lengths: [62, 64, 56, 54], sides: [1, 0, -1, 1], distances: [9.1, 0, 8.3, 8.9],
      dressing: [8.6, 9.5], spacing: [22, 41], scales: [.88, .72] },
  ],
};

export function rocketRunItinerary({ world = 'meadow', round = 0, seed = 0, journeyIndex = 0 } = {}) {
  world = Object.hasOwn(itineraries, world) ? world : 'meadow';
  round = Number.isInteger(round) ? Math.max(0, round) : 0;
  seed = Number.isInteger(seed) ? seed >>> 0 : 0;
  journeyIndex = Number.isInteger(journeyIndex) ? Math.max(0, journeyIndex) : 0;
  const index = (seed % 3 + round % 3 + journeyIndex % 3) % 3;
  const value = itineraries[world][index];
  return { id: `${world}-${index + 1}`, world, index, name: value.name,
    sections: value.order.map((key, i) => ({ ...passages[key], secondary: [...passages[key].secondary],
      length: value.lengths[i], side: value.sides[i], distance: value.distances[i],
      dressing: [...value.dressing], spacing: [...value.spacing], scales: [...value.scales] })) };
}

/** Real travelled distance places all authored route objects. The four
 * composed passages keep the three motor lanes open; no target, answer or
 * language history is read. IDs/anchors remain stable through retries,
 * pause and orientation changes. The renderers consume the same rows.
 */
export function rocketRunRouteLayout({ distance = 0, round = 0, seed = 0, world = 'meadow', journeyIndex = 0 } = {}) {
  distance = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  round = Number.isInteger(round) ? Math.max(0, round) : 0;
  seed = Number.isInteger(seed) ? seed >>> 0 : 0;
  const itinerary = rocketRunItinerary({ world, round, seed, journeyIndex });
  const sections = itinerary.sections, routeLength = sections.reduce((n, row) => n + row.length, 0);
  const cycle = Math.floor(distance/routeLength), rows = [];
  let currentKind = sections[0].kind;
  for (let turn = Math.max(0, cycle-1); turn <= cycle+1; turn++) {
    let offset = turn*routeLength;
    for (let index = 0; index < sections.length; index++) {
      const section = sections[index], local = distance-offset;
      if (local >= 0 && local < section.length) currentKind = section.kind;
      const mirror = ((seed ^ Math.imul(round+1, 31) ^ Math.imul(turn+1, 17)) >>> 0)%2 ? 1 : -1;
      const mainX = section.side === 0 ? 0 : section.side * mirror * section.distance;
      const y = section.primary === 'planet' ? 3.8 : section.primary === 'portal' ? -.25 : 1.7;
      const entries = [
        { role: section.primary, x: mainX, y, delay: 0, scale: section.primary === 'planet' ? 1.15 : 1 },
        { role: section.secondary[0], x: -mirror*section.dressing[0], y: section.secondary[0] === 'station' ? -.1 : .6,
          delay: section.spacing[0], scale: section.scales[0] },
        { role: section.secondary[1], x: mirror*section.dressing[1], y: 1.1, delay: section.spacing[1], scale: section.scales[1] },
      ];
      entries.forEach((entry, number) => {
        const z = -55+local-entry.delay;
        if (z < -70 || z > 8) return;
        rows.push({ id: `route-${itinerary.id}-${turn}-${index}-${number}`, itineraryId: itinerary.id, section: section.kind,
          role: entry.role, x: entry.x, y: entry.y, z, scale: entry.scale,
          openChannel: entry.role === 'portal', motorCollider: false });
      });
      offset += section.length;
    }
  }
  return { itineraryId: itinerary.id, itineraryName: itinerary.name, kind: currentKind, cycle, routeLength, objects: rows };
}
