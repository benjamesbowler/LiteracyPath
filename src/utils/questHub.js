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

export const WORLD_KITS = Object.freeze({
  meadow: {
    landmarks: ["windmill", "orchard", "farmstead", "lanternGrove"],
    ambience: ["butterfly", "songbird", "pollen"],
    repairs: ["windmill", "flowerBloom", "bridgeLamp", "sheepReturn"]
  },
  dino: {
    landmarks: ["boneArch", "excavationCamp", "tarPool", "ropeBridge"],
    ambience: ["dust", "ridgeBird", "heatWisp"],
    repairs: ["fossilLamp", "steamVent", "campFlag", "bridgeTorch"]
  },
  moonwood: {
    landmarks: ["lanternTree", "crystalPool", "observatory", "starGate"],
    ambience: ["firefly", "moth", "starDust"],
    repairs: ["lanternBloom", "crystalGlow", "observatorySpin", "starWake"]
  }
});

export const WORLD_VARIANTS = Object.freeze({
  meadow: [
    { id: "orchardLane", label: "orchard lane", density: 1.08, scatter: "fruit", canopyShift: 0 },
    { id: "pondGarden", label: "pond garden", density: 0.92, scatter: "ponds", canopyShift: 1 },
    { id: "farmTrack", label: "farm track", density: 1.18, scatter: "fences", canopyShift: 2 },
    { id: "lanternFair", label: "lantern fair", density: 1.04, scatter: "lanterns", canopyShift: 3 }
  ],
  dino: [
    { id: "boneCanyon", label: "bone canyon", density: 0.9, scatter: "bones", canopyShift: 0 },
    { id: "amberDig", label: "amber dig", density: 1.06, scatter: "crates", canopyShift: 1 },
    { id: "tarFlats", label: "tar flats", density: 0.86, scatter: "tar", canopyShift: 2 },
    { id: "ridgeCamp", label: "ridge camp", density: 1.14, scatter: "flags", canopyShift: 3 }
  ],
  moonwood: [
    { id: "glowfen", label: "glowfen", density: 1.06, scatter: "fungi", canopyShift: 0 },
    { id: "crystalRun", label: "crystal run", density: 0.94, scatter: "crystals", canopyShift: 1 },
    { id: "starOrchard", label: "star orchard", density: 1.16, scatter: "stars", canopyShift: 2 },
    { id: "observatoryPath", label: "observatory path", density: 0.98, scatter: "telescopes", canopyShift: 3 }
  ]
});

export const FIELD_ENCOUNTERS = Object.freeze({
  "flower-patch": { mode: "collect", object: "flower", line: "Collect the flower that makes the sound." },
  "hungry-beast": { mode: "feed", object: "fruit", line: "Feed the creature the matching sound." },
  signpost: { mode: "collect", object: "trail-object", line: "Read the sign, then collect the named thing." },
  "word-beast": { mode: "feed", object: "cake", line: "Feed the creature the matching word." }
});

const LIGHT_ARC = Object.freeze([
  { id: "freshMorning", label: "fresh morning", warmth: 0.1, glow: 0.42 },
  { id: "warmAfternoon", label: "warm afternoon", warmth: 0.34, glow: 0.56 },
  { id: "festivalSunset", label: "festival sunset", warmth: 0.72, glow: 0.72 },
  { id: "ridgeHeat", label: "ridge heat", warmth: 0.84, glow: 0.62 },
  { id: "dustStorm", label: "dust storm", warmth: 0.64, glow: 0.48 },
  { id: "moonTwilight", label: "moonwood twilight", warmth: 0.18, glow: 0.58 },
  { id: "starGlow", label: "star glow", warmth: 0.04, glow: 0.86 },
  { id: "dawnReach", label: "dawn reach", warmth: 0.28, glow: 0.95 }
]);

export const TRAIL_EVENTS = Object.freeze({
  s8: {
    id: "blendFestival",
    mode: "act",
    title: "The Blend Festival is waking",
    line: "Banners lift over the meadow and the road opens toward Fossil Ridge.",
    cue: "festival"
  },
  s17: {
    id: "wordForge",
    mode: "act",
    title: "The Word Forge is running",
    line: "The old machines turn, sparks rise, and Moonwood appears beyond the ridge.",
    cue: "forge"
  },
  s40: {
    id: "starReach",
    mode: "finale",
    title: "The Star Reach is awake",
    line: "Every sound you carried is singing back along the trail.",
    cue: "stars"
  }
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

function kitFor(world) {
  return WORLD_KITS[world] || WORLD_KITS.meadow;
}

function variantFor(world, stopIndex) {
  const variants = WORLD_VARIANTS[world] || WORLD_VARIANTS.meadow;
  return variants[(Math.max(1, finite(stopIndex, 1)) - 1) % variants.length];
}

function fieldModeFor(kind) {
  return FIELD_ENCOUNTERS[kind] || null;
}

function lightForStop(stopIndex, world) {
  if (world === "meadow") {
    if (stopIndex >= 8) return LIGHT_ARC[2];
    if (stopIndex >= 4) return LIGHT_ARC[1];
    return LIGHT_ARC[0];
  }
  if (world === "dino") return stopIndex >= 16 ? LIGHT_ARC[4] : LIGHT_ARC[3];
  if (stopIndex >= 40) return LIGHT_ARC[7];
  if (stopIndex >= 36) return LIGHT_ARC[6];
  return LIGHT_ARC[5];
}

function ambientPositions(walk, stopIndex) {
  const kit = kitFor(walk.world);
  const count = walk.world === "moonwood" ? 28 : 22;
  const items = [];
  for (let index = 0; index < count; index += 1) {
    const t = (index + 0.5) / count;
    const z = TRAIL_BOUNDS.startZ - 8 - t * 112;
    const center = trailCenterX(z, stopIndex);
    const half = trailHalfWidth(z, stopIndex);
    const kind = kit.ambience[index % kit.ambience.length];
    const side = index % 2 === 0 ? -1 : 1;
    const inset = 0.55 + ((index * 5) % 9) * 0.22;
    items.push({
      id: `${walk.stopId}-ambient-${index}`,
      kind,
      x: center + side * Math.max(0.4, half - inset),
      z,
      y: 0.7 + ((index * 7) % 11) * 0.13,
      phase: (index * 1.618 + stopIndex * 0.37) % 6.28,
      scale: 0.74 + ((index * 13) % 7) * 0.08
    });
  }
  return items;
}

function repairKindFor(world, encounter, order) {
  const kit = kitFor(world);
  const byEncounter = {
    meadow: {
      "flower-patch": "flowerBloom",
      "broken-bridge": "bridgeLamp",
      "hungry-beast": "windmill",
      "sheep-pens": "sheepReturn"
    },
    dino: {
      "flower-patch": "fossilLamp",
      "broken-bridge": "bridgeTorch",
      "echo-cave": "steamVent",
      "story-rock": "campFlag"
    },
    moonwood: {
      "flower-patch": "lanternBloom",
      "broken-bridge": "crystalGlow",
      "echo-cave": "starWake",
      "story-rock": "observatorySpin"
    }
  };
  return byEncounter[world]?.[encounter.kind] || kit.repairs[order % kit.repairs.length];
}

export function trailEventForStop(stop) {
  if (!stop) return null;
  return TRAIL_EVENTS[stop.id] || {
    id: `${stop.id}-gate`,
    mode: "section",
    title: "The trail keeps going",
    line: "Your creature carries the reward forward to the next stop.",
    cue: "gate"
  };
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
  const kit = kitFor(walk.world);
  const encounters = walk.encounters.map((encounter, index, all) => {
    const z = encounterZ(index, all.length);
    const center = trailCenterX(z, walk.stopIndex);
    const side = index % 2 === 0 ? -1 : 1;
    return {
      ...encounter,
      order: index,
      x: center + side * 0.85,
      z,
      label: LANDMARKS[encounter.kind] || "Trail friend",
      friend: friends[(index + 1) % friends.length],
      field: fieldModeFor(encounter.kind),
      repair: {
        kind: repairKindFor(walk.world, encounter, index),
        x: center - side * 2.6,
        z: z - 2.4
      },
      atGate: index === all.length - 1
    };
  });

  const guideZ = -12;
  const landmarkZ = -99;
  const landmarkSide = walk.stopIndex % 2 === 0 ? 1 : -1;
  return {
    stopId: walk.stopId,
    stopIndex: walk.stopIndex,
    stop: walk.stop,
    world: walk.world,
    kitId: walk.world,
    variant: variantFor(walk.world, walk.stopIndex),
    lighting: lightForStop(walk.stopIndex, walk.world),
    event: trailEventForStop(walk.stop),
    teach: walk.teach,
    guide: {
      x: trailCenterX(guideZ, walk.stopIndex) - 0.9,
      z: guideZ,
      friend: friends[0]
    },
    landmark: {
      id: `${walk.stopId}-landmark`,
      kind: kit.landmarks[(walk.stopIndex - 1) % kit.landmarks.length],
      x: trailCenterX(landmarkZ, walk.stopIndex) + landmarkSide * (trailHalfWidth(landmarkZ, walk.stopIndex) + 2.8),
      z: landmarkZ
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
    drops: dropPositions(walk, walk.stopIndex, encounters),
    ambience: ambientPositions(walk, walk.stopIndex)
  };
}

// Kept as a compatibility name for saved previews and older imports.
export const buildHub = buildTrailSection;
export const clampHubPosition = clampTrailPosition;
export const HUB_START = TRAIL_START;
export const HUB_BOUNDS = Object.freeze({ x: TRAIL_BOUNDS.halfWidth, z: Math.abs(TRAIL_BOUNDS.endZ) });
