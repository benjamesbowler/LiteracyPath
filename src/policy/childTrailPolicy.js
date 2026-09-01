// THE NODE-SCENE POLICY — shared by the two percentage-positioned child scenes
// (phase C of the 2026-07-29 kids-side redesign).
//
// Binding spec: mockups/design-handoff-kids-side/README.md, "### 2. Sound Trail
// (Sound Seekers)" and "### 3. Adventure Map". Both screens are the same idea
// twice — a path of stops painted over an illustration — so the machinery that
// turns real progress into placed nodes lives HERE, once, instead of being
// written twice and drifting.
//
// WHY THIS IS A POLICY MODULE AND NOT PART OF THE SCREENS. Two reasons, and the
// second is the one that bites:
//
//   1. It is the part worth unit-testing. Which node is "next", which is a
//      milestone, which stops are in view — those are claims about the child's
//      progress, and a claim about a child has to be checkable.
//   2. It must stay importable from `node --test`. src/data/mapStops.js (the
//      admin-placed map coordinates) imports supabaseClient.js, which reads
//      `import.meta.env` and cannot be evaluated in Node — so the landmark
//      NAMES are passed in by the screen rather than imported here. Same
//      precedent as questStore.js vs questProgress.js.
//
// EVERY NUMBER A SCREEN SHOWS COMES FROM REAL STATE. The mock's counts are
// placeholders (the spec says so). Nothing in this file invents a stop, a star
// or a stage; where a fact does not exist, the builders return null and the
// screen says something true instead.

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

// ── The Sound Trail ─────────────────────────────────────────────────────────
//
// Ten nodes on a dashed polyline. The coordinates are the spec's exact list;
// the STATES are not — they are read from the save file, so the shape of the
// path is design and everything drawn on it is fact.
export const TRAIL_NODE_POINTS = Object.freeze([
  Object.freeze([6, 68]), Object.freeze([15, 52]), Object.freeze([24, 66]),
  Object.freeze([33, 46]), Object.freeze([42, 60]), Object.freeze([51, 42]),
  Object.freeze([61, 58]), Object.freeze([70, 40]), Object.freeze([80, 54]),
  Object.freeze([91, 38])
]);

export const TRAIL_NODE_SIZES = Object.freeze({
  done: 38,
  next: 58,
  locked: 34,
  camp: 46
});

/**
 * The ten stops in view, placed and stated.
 *
 * The window slides so the child's NEXT stop lands on the sixth point — the
 * slot the spec marks "next" — and stops sliding at both ends of the trail so
 * the scene is always full. A 40-stop trail on ten dots means the window is the
 * only honest option: drawing forty markers over one illustration would put
 * them 2.5% apart, which is smaller than the marker.
 *
 * @param stops     the whole ordered trail: [{ id, index, name }]
 * @param doneIds   ids the child has finished
 * @param nextIndex 1-based index of the stop they are on (currentStopIndex)
 * @param milestones stopId -> milestone name (a chapter's destination). A
 *                  milestone still ahead renders as the terracotta camp star.
 */
export function buildSoundTrailScene({
  stops = [],
  doneIds = [],
  nextIndex = 1,
  milestones = {},
  points = TRAIL_NODE_POINTS,
  sizes = TRAIL_NODE_SIZES
} = {}) {
  const ordered = stops.filter(Boolean);
  const span = points.length;
  const done = new Set(doneIds || []);
  const target = Number(nextIndex) || 1;
  const lastStart = Math.max(1, ordered.length - span + 1);
  const start = clamp(target - Math.floor(span / 2), 1, lastStart);

  const nodes = [];
  for (let offset = 0; offset < span; offset += 1) {
    const stop = ordered[start - 1 + offset];
    if (!stop) break;
    const [x, y] = points[offset];
    const isDone = done.has(stop.id);
    const isNext = !isDone && stop.index === target;
    const milestone = milestones?.[stop.id] || "";
    // A milestone the child has already reached is simply done — the camp star
    // is a promise about what is still ahead, not a badge for the past.
    const state = isDone ? "done" : isNext ? "next" : milestone ? "camp" : "locked";
    nodes.push({
      key: stop.id,
      stopId: stop.id,
      index: stop.index,
      name: stop.name,
      x,
      y,
      size: sizes[state] || sizes.locked,
      state,
      label: state === "next" ? stop.name : state === "camp" ? milestone : ""
    });
  }

  const next = nodes.find(node => node.state === "next") || null;
  return {
    nodes,
    next,
    windowStart: start,
    windowEnd: start + nodes.length - 1,
    // Every point on the path, so the polyline is drawn from the same list the
    // markers are — a second hard-coded copy is how a dot ends up off the line.
    polyline: nodes.map(node => `${node.x},${node.y}`).join(" ")
  };
}

/**
 * The "Sounds you own" chips.
 *
 * `owned` is every grapheme taught through the LAST FINISHED stop — what the
 * child actually has. `mastered` is the subset the mastery gate has actually
 * credited. `focus` is what the NEXT stop teaches: not owned yet, so the first
 * of them is the highlighted target and the rest sit pale beside it.
 *
 * ORDER: mastered first, then the newest still-being-learnt, then the focus.
 *
 * That order is not cosmetic. The list has to be capped — the panel cannot
 * scroll (no child screen may) and a child forty stops along owns well over a
 * hundred spellings — and the obvious cap, "keep the newest", keeps exactly the
 * sounds least likely to be mastered yet. Measured on a twelve-stop save: every
 * one of the fifteen newest was still pale, so a panel titled "Sounds you own"
 * rendered as a wall of grey for a child who had mastered twenty-two of them.
 * Mastered-first shows the collection the title promises, and `hidden` reports
 * what is not on screen so the count beside the title stays true.
 */
export function buildSoundChips({ owned = [], mastered = [], focus = [], limit = 18 } = {}) {
  const focusList = focus.filter(Boolean);
  const masteredSet = new Set(mastered);
  const ownedList = owned.filter(Boolean).filter(id => !focusList.includes(id));
  const masteredList = ownedList.filter(id => masteredSet.has(id));
  const learningList = ownedList.filter(id => !masteredSet.has(id));

  const room = Math.max(0, limit - focusList.length);
  const shownMastered = masteredList.slice(0, room);
  const shownLearning = learningList.slice(
    Math.max(0, learningList.length - Math.max(0, room - shownMastered.length))
  );
  const chips = [
    ...shownMastered.map(id => ({ id, state: "mastered" })),
    ...shownLearning.map(id => ({ id, state: "owned" })),
    ...focusList.map((id, position) => ({ id, state: position === 0 ? "focus" : "ahead" }))
  ];
  return {
    chips,
    ownedCount: ownedList.length,
    masteredCount: masteredList.length,
    hidden: Math.max(0, ownedList.length - shownMastered.length - shownLearning.length)
  };
}

// ── The Adventure Map ───────────────────────────────────────────────────────
//
// A land's NINE stops on a dotted polyline, over the same wide map art the mode
// itself uses, plus four stop cards below.
//
// THE COORDINATES ARE NOT DESIGN, AND THIS MODULE DOES NOT OWN THEM. They are
// the admin-placed landmark positions in src/data/mapStops.js
// (DEFAULT_WIDE_MAP_POINTS, nine per world, put there with the click-to-place
// editor and overridable live from it), and they are percentages OF THAT PLATE:
// stop 3 is "the Duck Pond" only because 21.2/48.2 is where the pond is
// painted. So `points` is a parameter, passed in by the screen after it has
// applied the admin override with wideMapPointsFor() — the same read
// ElSkillsQuest does — and one click-to-place edit moves both surfaces
// together. There is deliberately no default list: a mock's invented arc used
// to sit here and it drew the Farm Gate in the middle of a carrot patch.
//
// The land's nine cycles, the nine landmark names and the nine points are one
// list three times over; they are paired by index and never windowed.

export const MAP_STOP_SIZES = Object.freeze({ done: 46, next: 64, locked: 46 });

export const MAP_CARD_COUNT = 4;

// The three lands, in journey order. The bands mirror worldForCycle() in
// palWorlds.js and the names mirror WORLD_REGIONS in the Skills Quest itself —
// tests/unit/kidsTrailScreens.test.js asserts both still agree, because two
// lists that disagree put a child in Dinosaur Valley under a Meadow sign.
export const ADVENTURE_MAP_PARTS = Object.freeze([
  Object.freeze({ id: "meadow", name: "Meadow Farm", part: 1, first: 1, last: 9 }),
  Object.freeze({ id: "dino", name: "Dinosaur Valley", part: 2, first: 10, last: 18 }),
  Object.freeze({ id: "moonwood", name: "Moonwood Forest", part: 3, first: 19, last: 27 })
]);

export function adventureMapPartFor(cycleNumber) {
  const n = Number(cycleNumber) || 1;
  return ADVENTURE_MAP_PARTS.find(part => n >= part.first && n <= part.last)
    || ADVENTURE_MAP_PARTS[0];
}

export function resolveAdventureMapCycleLock({ cycles = [], lockedCycleId = null } = {}) {
  const locked = lockedCycleId !== null && lockedCycleId !== undefined;
  if (!locked) {
    return { locked: false, cycleId: "", cycle: null, contentAvailable: true };
  }

  const cycleId = String(lockedCycleId || "").trim();
  const cycle = cycles.find(item => (
    item?.cycleNumber
    && item.id === cycleId
  )) || null;
  return {
    locked: true,
    cycleId,
    cycle,
    contentAvailable: Boolean(cycle)
  };
}

export function adventureMapFocusLockFor({ isStudentMode = false, session = null } = {}) {
  const focusLocked = Boolean(isStudentMode && session?.target === "adventure_map");
  return {
    focusLocked,
    lockedCycleId: focusLocked
      ? String(session?.resolved_config?.cycle_id || "").trim()
      : null
  };
}

/**
 * The map scene and the four cards under it.
 *
 * @param cycles   the playable cycles of ONE land, in order:
 *                 [{ id, cycleNumber }]
 * @param starsFor (cycleId) => stars earned, 0-3
 * @param landmarks the painted place names for those cycles, same order
 * @param points   the admin-placed [x, y] percentage pairs for those cycles,
 *                 same order — wideMapPointsFor(worldId, override) from
 *                 src/data/mapStops.js. No list, no markers.
 * @param activeCycleId an exact teacher-assigned cycle, or null for the
 *                 ordinary first-unfinished progression rule
 */
export function buildAdventureMapScene({
  cycles = [],
  starsFor = () => 0,
  landmarks = [],
  points = [],
  sizes = MAP_STOP_SIZES,
  cardCount = MAP_CARD_COUNT,
  activeCycleId = null
} = {}) {
  const list = cycles.filter(Boolean).map((cycle, position) => ({
    id: cycle.id,
    number: cycle.cycleNumber,
    name: landmarks[position] || cycle.title || "",
    stars: Math.max(0, Math.min(3, Number(starsFor(cycle.id)) || 0)),
    position
  }));

  const exactCycleLock = activeCycleId !== null && activeCycleId !== undefined;
  const activeCyclePosition = exactCycleLock
    ? list.findIndex(item => item.id === activeCycleId)
    : -1;
  const firstUnfinished = list.findIndex(item => item.stars <= 0);
  // Every stop finished means the land is done: the last one stays "next" so
  // the screen still has somewhere to point rather than nowhere.
  const nextPosition = exactCycleLock
    ? activeCyclePosition
    : firstUnfinished >= 0 ? firstUnfinished : Math.max(0, list.length - 1);
  const stateFor = item => {
    if (exactCycleLock && item.position === activeCyclePosition) return "next";
    if (item.stars > 0) return "done";
    if (exactCycleLock) return "locked";
    if (item.position === nextPosition) return "next";
    return "locked";
  };

  // EVERY STOP IN THE LAND, PAIRED BY INDEX — no sliding window. Nine cycles,
  // nine painted landmarks, nine placed coordinates: stop N is drawn at
  // points[N] because that is where landmarks[N] is painted, so a window that
  // slid the list would put the child's stop on someone else's landmark. A
  // cycle with no coordinate is left off the plate rather than given an
  // invented one.
  const stops = [];
  for (const item of list) {
    const point = points[item.position];
    if (!Array.isArray(point) || point.length < 2) continue;
    const [x, y] = point;
    const state = stateFor(item);
    stops.push({
      ...item,
      x,
      y,
      state,
      size: sizes[state] || sizes.locked,
      label: state === "next" ? item.name : ""
    });
  }

  // The cards keep the current stop third, which is where the spec's four
  // states put it: two behind, the one you are on, one ahead.
  const cardAnchor = nextPosition >= 0 ? nextPosition : 0;
  const cardStart = clamp(cardAnchor - 2, 0, Math.max(0, list.length - cardCount));
  const cards = list
    .slice(cardStart, cardStart + cardCount)
    .map(item => ({ ...item, state: stateFor(item) }));

  const next = nextPosition >= 0 ? list[nextPosition] || null : null;
  return {
    stops,
    cards,
    next: next ? { ...next, state: stateFor(next) } : null,
    activeCycleAvailable: !exactCycleLock || activeCyclePosition >= 0,
    polyline: stops.map(stop => `${stop.x},${stop.y}`).join(" ")
  };
}
