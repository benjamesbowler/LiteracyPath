// Physical route recipes are independent of word identity and answer position.
// Vertical ascent and cross-bough traversal occur in separate connected spaces:
// holding Up while steering cannot climb through the gap between the trees.
export const PACED_CLIMB_LAYOUT = 'paced-v1';
export const CLIMB_LAYOUT_REVISIONS = Object.freeze(['paced-v1', 'short-v2', 'short-v1', 'long-v1']);
export const PACED_CLIMB_STEER_SPEED = 180;
export const CLIMB_GATE_RADIUS = 8;
const routes = {
  easy: { height: 2200, span: 400 }, medium: { height: 1900, span: 350 }, hard: { height: 1650, span: 325 },
};
const places = ['Root fork', 'Nest bough', 'Fern spiral', 'Windward bridge', 'Lantern lookout', 'Crown walk', 'Fossil fork', 'Twin vines', 'Star observatory', 'Summit garden'];
const rhythms = [[.26, .72], [.34, .78], [.22, .65], [.31, .69], [.29, .81], [.37, .73]];

export function pacedClimbRecipe(difficulty) { return { ...(routes[difficulty] || routes.easy) }; }
export function isPacedClimb(journey) { return journey?.layoutRevision === PACED_CLIMB_LAYOUT; }
export function climbLayoutRevision(journey) {
  if (!journey || !Number.isSafeInteger(journey.stageIndex) || journey.stageIndex < 0 || ![6, 8, 10].includes(journey.summit)) return null;
  if (journey.layoutRevision !== undefined) return CLIMB_LAYOUT_REVISIONS.includes(journey.layoutRevision) ? journey.layoutRevision : null;
  // Old saves did not carry a revision. Recognise only the actual shipped
  // recipes, then validate every saved platform/prop against that recipe.
  if (journey.travelPerSection === 13600 / journey.summit) return 'long-v1';
  if (journey.travelPerSection !== 300 + journey.stageIndex % 3 * 30) return null;
  return journey.obstacles?.every(value => value.width === 104) ? 'short-v2'
    : journey.obstacles?.every(value => value.width === 122) ? 'short-v1' : null;
}

export function pacedClimbSection(journey, section) {
  const rhythm = rhythms[(section + Math.floor(journey.stageIndex / 3)) % rhythms.length];
  const start = section * journey.sectionHeight, span = journey.crossingSpan;
  return { section, start, first: start + Math.round(journey.travelPerSection * rhythm[0]),
    second: start + Math.round(journey.travelPerSection * rhythm[1]), top: start + journey.travelPerSection,
    span, place: places[(section + Math.floor(journey.stageIndex / 3)) % places.length] };
}

export function pacedClimbCenter(journey, y, startX = null, branchSide = null) {
  const section = Math.min(journey.summit - 1, Math.max(0, Math.floor(y / journey.sectionHeight)));
  const route = pacedClimbSection(journey, section), side = branchSide ?? journey.routeChoices?.[section] ?? 0;
  if (y < route.first || y >= route.second) {
    if (startX !== null && section > 0 && y - route.start < 240) return startX + (500 - startX) * (y - route.start) / 240;
    return 500;
  }
  if (!side) return 500;
  const t = (y - route.first) / (route.second - route.first);
  const bend = Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI) * (14 + section % 3 * 5);
  return 500 + side * (route.span + bend);
}

export function pacedClimbRadius(journey, y) {
  const section = Math.min(journey.summit - 1, Math.max(0, Math.floor(y / journey.sectionHeight)));
  const route = pacedClimbSection(journey, section);
  if(y===route.first||y===route.second)return CLIMB_GATE_RADIUS;
  const approaching = y < route.first ? route.first - y : y < route.second ? route.second - y : Infinity;
  const radius = y > route.first && y < route.second ? 78 : 140;
  return approaching < 130 ? CLIMB_GATE_RADIUS + (radius - CLIMB_GATE_RADIUS) * Math.max(0, approaching) / 130 : radius;
}

// Render both available paths before a choice is made. No unbroken centre
// trunk may imply a shortcut through the physical middle gap.
export function pacedClimbSurfaces(journey, from, to, step = 18) {
  const surfaces = [];
  const firstSection = Math.max(0, Math.floor(from / journey.sectionHeight));
  const lastSection = Math.min(journey.summit - 1, Math.floor(to / journey.sectionHeight));
  for (let section = firstSection; section <= lastSection; section++) {
    const route = pacedClimbSection(journey, section);
    for (const [low, high, sides] of [[route.start - (section ? 0 : 180), route.first, [0]],
      [route.first, route.second, [-1, 1]], [route.second, route.start + journey.sectionHeight, [0]]]) {
      const a = Math.max(from, low), b = Math.min(to, high); if (a > b) continue;
      for (const side of sides) {
        const points = [];
        for (let y = a; y < b; y += step) points.push({ y, x: pacedClimbCenter(journey, y, null, side), radius: side ? 78 : 140 });
        // The root/side/canopy surfaces meet a real horizontal bough. Keep the
        // side endpoint on its tree rather than reset x at the section boundary.
        const endpoint = side ? 500 + side * route.span : 500;
        points.push({ y: b, x: b === route.second || b === route.first ? endpoint : pacedClimbCenter(journey, b, null, side), radius: side ? 78 : 140 });
        if (points.length > 1) surfaces.push({ section, side, points });
      }
    }
  }
  return surfaces;
}

export function pacedClimbCrossings(journey) {
  return Array.from({ length: journey.summit }, (_, section) => {
    const route = pacedClimbSection(journey, section);
    return [-1, 1].flatMap(side => [
      { id: `bough-out-${section}-${side}`, section, side, y: route.first, fromX: 500, toX: 500 + side * route.span, phase: 'out' },
      { id: `bough-back-${section}-${side}`, section, side, y: route.second, fromX: 500 + side * route.span, toX: 500, phase: 'back' },
    ]);
  }).flat();
}

export function pacedClimbWaypoint(world, side = 1) {
  const journey = world.journey; if (!isPacedClimb(journey) || journey.phase !== 'climb' || world.completed) return null;
  const route = pacedClimbSection(journey, world.step), crossing = journey.crossing;
  if (crossing) return { x: crossing.phase === 'out' ? 500 + (crossing.side || side) * route.span : 500, y: crossing.y,
    crossing: true, label: crossing.phase === 'out' ? `Cross ${side < 0 ? 'left' : 'right'} bough` : 'Cross to the canopy' };
  const branch = journey.routeChoices[world.step] || side;
  const gate = world.y < route.first ? route.first : world.y < route.second ? route.second : route.top;
  const near = journey.obstacles.find(o => o.section === world.step && o.y > world.y - 30 && o.y - world.y < 185
    && (o.routeSide === undefined || o.routeSide === 0 || o.routeSide === branch));
  const centre = pacedClimbCenter(journey, world.y, journey.branchStartX);
  return { x: centre - (near?.side || 0) * 55, y: gate, crossing: false, label: `Climb to ${route.place.toLowerCase()}` };
}

export function pacedClimbMinimumSeconds(journey) {
  // Entry gates allow at most8 units of horizontal tolerance. Only the two
  // actual cross-bough phases supply the remaining distance, with y frozen.
  return journey.summit * (journey.travelPerSection / 108 + 2 * (journey.crossingSpan - CLIMB_GATE_RADIUS) / PACED_CLIMB_STEER_SPEED + .94);
}
