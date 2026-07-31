// SOUND SEEKERS TRAIL - turn one curriculum stop into one long journey section.
//
// The curriculum is strictly ordered, but movement inside a section is free.
// Children can wander across the path, double back for collectibles, and choose
// how they approach the next friend. Dense forest walls keep that freedom
// legible and prevent the world becoming a flat plaza.

import { buildWalk } from "./questEncounters.js";
import {
  chapterFinaleForStop,
  chapterForStop,
  chapterRouteTopology,
  chapterStopNumber
} from "../data/questChapters.js";
import {
  buildQuestRoute,
  clampRoutePosition,
  routeDirectionAt,
  routeMovementVector,
  routePointAt,
  routeProgressAt,
  routeSidePoint
} from "./questRouteGraph.js";

export { routeDirectionAt, routeMovementVector, routePointAt, routeProgressAt, routeSidePoint };

export const TRAIL_BOUNDS = Object.freeze({
  startZ: 10,
  endZ: -132,
  halfWidth: 4.25
});

export const TRAIL_START = Object.freeze({ x: 0, z: 7.5 });

const FRIENDS = Object.freeze({
  meadow: ["Bouncy", "Moss", "Tumble", "Bramble"],
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
  if (stopIndex?.route) {
    return clampRoutePosition(position || stopIndex.start, stopIndex.route, forwardLimit);
  }
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

function encounterProgress(index, count) {
  if (count === 1) return 0.56;
  const first = count === 2 ? 0.34 : 0.28;
  const last = count === 2 ? 0.72 : 0.76;
  return first + ((last - first) * index) / (count - 1);
}

function rewardCacheDrops(walk, route, rewardIds = [], bonusCacheCount = 0) {
  const unlocked = new Set(rewardIds);
  const relicCount = (unlocked.has("river-whistle") ? 2 : 0) + (unlocked.has("lantern-map") ? 1 : 0);
  const count = Math.max(relicCount, Math.max(0, Number(bonusCacheCount) || 0));
  if (!count) return [];
  return Array.from({ length: count }, (_, index) => {
    const branch = route.branches?.[index % Math.max(1, route.branches.length)];
    const sample = branch?.samples?.[
      Math.min(branch.samples.length - 1, Math.floor(branch.samples.length * (0.58 + index * 0.12)))
    ];
    const fallbackProgress = 0.4 + index * 0.14;
    const fallback = routePointAt(route, fallbackProgress, (index % 2 ? -1 : 1) * 3.2);
    const position = sample || fallback;
    return {
      id: `${walk.stopId}-relic-cache-${index}`,
      x: position.x,
      z: position.z,
      y: position.y + 0.34,
      progress: sample?.routeProgress ?? fallbackProgress,
      cache: true
    };
  });
}

function dropPositions(walk, route, encounters, rewardIds = [], bonusCacheCount = 0) {
  const count = Math.min(22, Math.max(14, walk.drops.length));
  const drops = [];
  for (let index = 0; index < count; index += 1) {
    const progress = 0.12 + ((index + 1) / (count + 1)) * 0.74;
    if (encounters.some(encounter => Math.abs(encounter.progress - progress) < 0.035)) continue;
    const side = index % 2 === 0 ? -1 : 1;
    const spread = 0.75 + ((index * 7) % 10) * 0.19;
    const position = routePointAt(route, progress, side * spread);
    drops.push({
      id: `${walk.stopId}-drop-${index}`,
      x: position.x,
      z: position.z,
      y: position.y + 0.2 + ((index * 13) % 7) * 0.04,
      progress
    });
  }
  return [...drops, ...rewardCacheDrops(walk, route, rewardIds, bonusCacheCount)];
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

function ambientPositions(walk, route, world = walk.world) {
  const kit = kitFor(world);
  const count = world === "moonwood" ? 28 : 22;
  const items = [];
  for (let index = 0; index < count; index += 1) {
    const progress = 0.05 + ((index + 0.5) / count) * 0.88;
    const kind = kit.ambience[index % kit.ambience.length];
    const side = index % 2 === 0 ? -1 : 1;
    const inset = 0.55 + ((index * 5) % 9) * 0.22;
    const position = routeSidePoint(route, progress, side, -inset);
    items.push({
      id: `${walk.stopId}-ambient-${index}`,
      kind,
      x: position.x,
      z: position.z,
      y: position.y + 0.7 + ((index * 7) % 11) * 0.13,
      progress,
      phase: (index * 1.618 + walk.stopIndex * 0.37) % 6.28,
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
  const finale = chapterFinaleForStop(stop);
  if (finale) {
    return {
      ...finale,
      mode: "chapter-finale",
      line: finale.action
    };
  }
  return TRAIL_EVENTS[stop.id] || {
    id: `${stop.id}-gate`,
    mode: "section",
    title: "The trail keeps going",
    line: "Your creature carries the reward forward to the next stop.",
    cue: "gate"
  };
}

export function restoredWorldMoments(chapter, chapterStop, completedStopIds, route, world) {
  if (!chapter || !route || chapterStop <= 1) return [];
  const completed = completedStopIds instanceof Set ? completedStopIds : new Set(completedStopIds || []);
  const kit = kitFor(world || chapter.worldKit);
  return chapter.stopIds
    .slice(0, chapterStop - 1)
    .filter(stopId => completed.has(stopId))
    .map((stopId, index) => {
      const progress = 0.145 + index * 0.055;
      const side = index % 2 === 0 ? -1 : 1;
      const lateral = side * Math.max(1.8, (route.width || TRAIL_BOUNDS.halfWidth) - 0.82 - (index % 2) * 0.28);
      const position = routePointAt(route, progress, lateral);
      return {
        id: `restored-${stopId}`,
        sourceStopId: stopId,
        kind: kit.repairs[index % kit.repairs.length],
        story: chapter.memoryStories?.[index] || null,
        x: position.x,
        y: position.y,
        z: position.z,
        progress,
        restored: true
      };
    });
}

export function firstUnsolvedEncounter(section, solved = []) {
  const done = solved instanceof Set ? solved : new Set(solved);
  return section?.encounters?.find(encounter => !done.has(encounter.id)) || null;
}

export function forwardLimitFor(section, { guideDone = false, solved = [] } = {}) {
  if (!section) return TRAIL_BOUNDS.startZ;
  if (section.route) {
    if (!guideDone) return Math.max(0, section.guide.progress - 0.012);
    const next = firstUnsolvedEncounter(section, solved);
    return next ? Math.max(0, next.progress - 0.012) : 1;
  }
  if (!guideDone) return section.guide.z + 1.35;
  const next = firstUnsolvedEncounter(section, solved);
  return next ? next.z + 1.35 : TRAIL_BOUNDS.endZ;
}

export function buildTrailSection(stopId, options = {}) {
  const walk = buildWalk(stopId, options);
  if (!walk) return null;

  const chapter = chapterForStop(walk.stop);
  const rewardIds = Array.isArray(options.rewardIds) ? [...new Set(options.rewardIds)] : [];
  const completedStopIds = new Set(Array.isArray(options.completedStopIds) ? options.completedStopIds : []);
  const chapterStop = chapterStopNumber(walk.stop);
  const routeTopology = chapterRouteTopology(walk.stop);
  const world = chapter?.worldKit || walk.world;
  const route = buildQuestRoute({
    topology: routeTopology,
    seed: walk.stopIndex,
    width: TRAIL_BOUNDS.halfWidth
  });
  const fallbackFriends = FRIENDS[world] || FRIENDS.meadow;
  const friends = [
    chapter?.cast?.guide?.name || fallbackFriends[0],
    ...(chapter?.cast?.residents || []).map(resident => resident.name)
  ];
  const kit = kitFor(world);
  const encounters = walk.encounters.map((encounter, index, all) => {
    const progress = encounterProgress(index, all.length);
    const side = index % 2 === 0 ? -1 : 1;
    const position = routePointAt(route, progress, side * 0.85);
    const repairPosition = routeSidePoint(route, Math.min(0.86, progress + 0.018), -side, 2.6);
    return {
      ...encounter,
      order: index,
      x: position.x,
      y: position.y,
      z: position.z,
      progress,
      label: LANDMARKS[encounter.kind] || "Trail friend",
      friend: friends[1 + ((index + Math.max(0, chapterStop - 1)) % Math.max(1, friends.length - 1))],
      field: fieldModeFor(encounter.kind),
      repair: {
        kind: repairKindFor(world, encounter, index),
        x: repairPosition.x,
        y: repairPosition.y,
        z: repairPosition.z,
        progress: Math.min(0.86, progress + 0.018)
      },
      atGate: index === all.length - 1
    };
  });

  const landmarkSide = walk.stopIndex % 2 === 0 ? 1 : -1;
  const start = routePointAt(route, 0.02);
  const guide = routePointAt(route, 0.1, -0.9);
  const landmark = routeSidePoint(route, 0.78, landmarkSide, 2.8);
  const gate = routePointAt(route, 0.91);
  const exit = routePointAt(route, 0.985);
  const gateDirection = routeDirectionAt(route, 0.91);
  return {
    stopId: walk.stopId,
    stopIndex: walk.stopIndex,
    stop: walk.stop,
    world,
    chapter,
    chapterStop,
    isChapterFinale: chapterStop === 5,
    finale: chapterFinaleForStop(walk.stop),
    kitId: world,
    topology: routeTopology,
    route,
    variant: variantFor(world, walk.stopIndex),
    lighting: lightForStop(walk.stopIndex, world),
    event: trailEventForStop(walk.stop),
    teach: walk.teach,
    guide: {
      x: guide.x,
      y: guide.y,
      z: guide.z,
      progress: 0.1,
      friend: friends[0]
    },
    landmark: {
      id: `${walk.stopId}-landmark`,
      kind: kit.landmarks[(walk.stopIndex - 1) % kit.landmarks.length],
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      side: landmarkSide,
      progress: 0.78
    },
    gate: {
      x: gate.x,
      y: gate.y,
      z: gate.z,
      progress: 0.91,
      heading: gateDirection.heading
    },
    exit: {
      x: exit.x,
      y: exit.y,
      z: exit.z,
      progress: 0.985
    },
    start: { x: start.x, y: start.y, z: start.z, progress: 0.02 },
    continuity: {
      chapterId: chapter?.id || walk.world,
      previousStopId: walk.stopIndex > 1 ? `s${walk.stopIndex - 1}` : null,
      nextStopId: walk.stopIndex < 40 ? `s${walk.stopIndex + 1}` : "s1",
      continuesChapter: chapterStop < 5,
      resetToMenu: false
    },
    shortcut: chapter?.shortcut || null,
    rewardIds,
    restoredMoments: restoredWorldMoments(chapter, chapterStop, completedStopIds, route, world),
    encounters,
    drops: dropPositions(walk, route, encounters, rewardIds, options.rewardCacheCount),
    ambience: ambientPositions(walk, route, world)
  };
}

// Kept as a compatibility name for saved previews and older imports.
// (The hub-era compat aliases - buildHub, clampHubPosition, HUB_START,
// HUB_BOUNDS - are gone: zero callers, and an alias block is a promise to
// maintain two names forever.)
