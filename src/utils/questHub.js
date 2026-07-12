// SOUND SEEKERS TRAIL - turn one curriculum stop into one long journey section.
//
// The curriculum is strictly ordered, but movement inside a section is free.
// Children can wander across the path, double back for collectibles, and choose
// how they approach the next friend. Dense forest walls keep that freedom
// legible and prevent the world becoming a flat plaza.

import { buildWalk } from "./questEncounters.js";

export const TRAIL_BOUNDS = Object.freeze({
  startZ: 10,
  endZ: -132,
  halfWidth: 4.25
});

export const TRAIL_START = Object.freeze({ x: 0, z: 7.5 });
export const TRAIL_GATE_Z = -121;
export const TRAIL_EXIT_Z = -128.5;

const FRIENDS = Object.freeze({
  meadow: ["Pip", "Moss", "Tumble", "Bramble"],
  dino: ["Fen", "Rook", "Amber", "Claw"],
  moonwood: ["Vale", "Echo", "Luma", "Wisp"]
});

const LANDMARKS = Object.freeze({
  "flower-patch": "Flower field",
  "hungry-beast": "Hungry hollow",
  "broken-bridge": "Old bridge",
  "echo-cave": "Echo cave",
  "sheep-pens": "Sheep meadow",
  "word-beast": "Beast burrow",
  signpost: "Trail signs",
  "story-rock": "Story stones"
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function trailProgress(z) {
  const length = TRAIL_BOUNDS.startZ - TRAIL_BOUNDS.endZ;
  return Math.max(0, Math.min(1, (TRAIL_BOUNDS.startZ - finite(z, TRAIL_START.z)) / length));
}

export function trailCenterX(z, stopIndex = 1) {
  const t = trailProgress(z);
  const phase = finite(stopIndex, 1) * 0.47;
  return (
    Math.sin(t * Math.PI * 2.15 + phase) * 1.15
    + Math.sin(t * Math.PI * 4.7 + phase * 0.6) * 0.42
  );
}

export function trailHalfWidth(z, stopIndex = 1) {
  const t = trailProgress(z);
  return TRAIL_BOUNDS.halfWidth + Math.sin(t * Math.PI * 3 + finite(stopIndex, 1)) * 0.35;
}

export function clampTrailPosition(position = TRAIL_START, stopIndex = 1, forwardLimit = TRAIL_BOUNDS.endZ) {
  const z = Math.max(
    Math.max(TRAIL_BOUNDS.endZ, finite(forwardLimit, TRAIL_BOUNDS.endZ)),
    Math.min(TRAIL_BOUNDS.startZ, finite(position.z, TRAIL_START.z))
  );
  const center = trailCenterX(z, stopIndex);
  const halfWidth = trailHalfWidth(z, stopIndex);
  return {
    x: Math.max(center - halfWidth, Math.min(center + halfWidth, finite(position.x, center))),
    z
  };
}

function encounterZ(index, count) {
  const first = -34;
  const last = -108;
  if (count === 1) return -79;
  return first + ((last - first) * index) / (count - 1);
}

function dropPositions(walk, stopIndex, encounters) {
  const count = Math.min(22, Math.max(14, walk.drops.length));
  const drops = [];
  for (let index = 0; index < count; index += 1) {
    const t = (index + 1) / (count + 1);
    const z = 2 - t * 116;
    if (encounters.some(encounter => Math.abs(encounter.z - z) < 4.5)) continue;
    const center = trailCenterX(z, stopIndex);
    const side = index % 2 === 0 ? -1 : 1;
    const spread = 0.75 + ((index * 7) % 10) * 0.19;
    drops.push({
      id: `${walk.stopId}-drop-${index}`,
      x: center + side * spread,
      z,
      y: 0.2 + ((index * 13) % 7) * 0.04
    });
  }
  return drops;
}

export function firstUnsolvedEncounter(section, solved = []) {
  const done = solved instanceof Set ? solved : new Set(solved);
  return section?.encounters?.find(encounter => !done.has(encounter.id)) || null;
}

export function forwardLimitFor(section, { guideDone = false, solved = [] } = {}) {
  if (!section) return TRAIL_BOUNDS.startZ;
  if (!guideDone) return section.guide.z + 1.35;
  const next = firstUnsolvedEncounter(section, solved);
  return next ? next.z + 1.35 : TRAIL_BOUNDS.endZ;
}

export function buildTrailSection(stopId, options = {}) {
  const walk = buildWalk(stopId, options);
  if (!walk) return null;

  const friends = FRIENDS[walk.world] || FRIENDS.meadow;
  const encounters = walk.encounters.map((encounter, index, all) => {
    const z = encounterZ(index, all.length);
    const center = trailCenterX(z, walk.stopIndex);
    return {
      ...encounter,
      order: index,
      x: center + (index % 2 === 0 ? -0.85 : 0.85),
      z,
      label: LANDMARKS[encounter.kind] || "Trail friend",
      friend: friends[(index + 1) % friends.length],
      atGate: index === all.length - 1
    };
  });

  const guideZ = -12;
  return {
    stopId: walk.stopId,
    stopIndex: walk.stopIndex,
    stop: walk.stop,
    world: walk.world,
    teach: walk.teach,
    guide: {
      x: trailCenterX(guideZ, walk.stopIndex) - 0.9,
      z: guideZ,
      friend: friends[0]
    },
    gate: {
      x: trailCenterX(TRAIL_GATE_Z, walk.stopIndex),
      z: TRAIL_GATE_Z
    },
    exit: {
      x: trailCenterX(TRAIL_EXIT_Z, walk.stopIndex),
      z: TRAIL_EXIT_Z
    },
    encounters,
    drops: dropPositions(walk, walk.stopIndex, encounters)
  };
}

// Kept as a compatibility name for saved previews and older imports.
export const buildHub = buildTrailSection;
export const clampHubPosition = clampTrailPosition;
export const HUB_START = TRAIL_START;
export const HUB_BOUNDS = Object.freeze({ x: TRAIL_BOUNDS.halfWidth, z: Math.abs(TRAIL_BOUNDS.endZ) });
