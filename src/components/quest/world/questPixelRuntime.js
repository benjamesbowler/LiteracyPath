import Phaser from "phaser";
import {
  createPixelBeastieSheet,
  PIXEL_BEASTIE_DIRECTIONS,
  PIXEL_BEASTIE_FRAME,
  PIXEL_BEASTIE_FRAMES_PER_DIRECTION
} from "./questPixelAvatar.js";
import {
  questAnalogVector,
  questCameraResponse,
  questCameraTravelTarget,
  questChoiceCorridorRadius,
  questPixelAvoidActorOverlap,
  questPointerDestination,
  questPointerObstacleVector,
  questActiveChoiceForwardLimit,
  questPixelCameraZoom,
  questPixelChoiceOffsets,
  questPixelEdgeDetailPositions,
  questPixelSortLaneLayout,
  questPixelVerbProfile,
  questGateCrossingReached,
  questOptionalRouteCenters,
  questRestoredMemoryPlacement,
  questRouteBoundaryProfile,
  questRouteLaneSelection,
  resolveQuestObstacleContacts,
  stepQuestForwardBoundary,
  stepQuestRouteBoundary
} from "../../../utils/questSliceSystems.js";
import {
  QUEST_ACTION_SFX,
  QUEST_FEEDBACK_SFX,
  questCeremonySfxSequence,
  questActionSfxEntry,
  questChapterMaterialSfxEntry,
  playQuestSfxEntry,
  stopQuestActionSfx,
  warmQuestSfxEntries
} from "../../../utils/questActionAudio.js";
import {
  QUEST_PIXEL_CHAPTER_CASTS,
  questPixelNamedChapterCast,
  questPixelMemoryResidentKey,
  questPixelResidentFrameSize,
  questPixelResidentKey,
  questPixelResidentIdlePath,
  questPixelResidentItemPath,
  questPixelResidentJumpPath,
  questPixelResidentPath,
  questPixelResidentWorldScale
} from "../../../data/questPixelCast.js";
import {
  authoredPixelRouteCenters,
  samplePixelMapRoute,
  stopPixelMap
} from "../../../data/questPixelMaps.js";

export const PIXEL_WORLD = Object.freeze({ width: 640, height: 1120, tile: 16 });

const PIXEL_ASSET_ROOT = "/game-assets/quest-pixel";
const ASSET_ROOT = `${PIXEL_ASSET_ROOT}/seedwake`;
export const QUEST_BOOK_WORLD_BACKGROUNDS = Object.freeze({
  meadow: "/game-assets/sound-seekers/worlds/meadow-pals-trail-v2.webp",
  dino: "/game-assets/sound-seekers/worlds/dino-pals-trail-v2.webp",
  moonwood: "/game-assets/sound-seekers/worlds/moonwood-trail-v2.webp"
});
export const QUEST_BOOK_WORLD_ART_URLS = Object.freeze([
  ...Object.values(QUEST_BOOK_WORLD_BACKGROUNDS),
  "/game-assets/sound-seekers/worlds/meadow-pals-overworld-v2.webp",
  "/game-assets/sound-seekers/worlds/dino-pals-overworld-v2.webp",
  "/game-assets/sound-seekers/worlds/moonwood-overworld-v2.webp"
]);
const PIXEL_ACTION_SFX_BY_KEY = Object.freeze(Object.fromEntries(
  Object.values(QUEST_ACTION_SFX).map(entry => [entry.key, entry])
));
const PLAYER_SPEED = 104;
const CHOICE_DISTANCE = 19;
const ENCOUNTER_DISTANCE = 56;
const DROP_DISTANCE = 16;
const RUNTIME_HEALTH_FIRST_SAMPLE_MS = 1500;
const RUNTIME_HEALTH_INTERVAL_MS = 10000;
const BEASTIE_ACTION_FRAMES = Object.freeze({
  discover: [4, 14, 6, 15],
  hop: [4, 6, 15],
  interact: [4, 5, 15],
  carry: [4, 8, 8, 15],
  build: [4, 9, 9, 15],
  chase: [1, 3, 2],
  route: [4, 10, 15],
  sort: [4, 5, 10, 15],
  tool: [4, 9, 9, 15],
  turn: [4, 10, 10, 15],
  steer: [4, 11, 11, 15],
  signal: [4, 12, 12, 6],
  climb: [4, 13, 13, 15],
  pulse: [4, 12, 6, 15]
});
const CEREMONY_RELIC_SHAPES = Object.freeze({
  "seedwake-meadow": "relic-lantern",
  "river-gardens": "river-wheel",
  "fossil-canyon": "fossil-bone",
  "forge-settlement": "forge-gear",
  "glass-marsh": "mirror-shard",
  "storm-coast": "storm-lens",
  "lantern-forest": "forest-star",
  "star-reach": "reading-star"
});
const CEREMONY_FINALE_NODE_SHAPES = Object.freeze({
  "seedwake-meadow": Object.freeze(["finale-flower", "relic-lantern"]),
  "river-gardens": Object.freeze(["river-wheel", "river-lily"]),
  "fossil-canyon": Object.freeze(["fossil-bone", "fossil-track"]),
  "forge-settlement": Object.freeze(["forge-gear", "forge-ore"]),
  "glass-marsh": Object.freeze(["mirror-shard", "marsh-reed"]),
  "storm-coast": Object.freeze(["storm-lens", "fleet-flag"]),
  "lantern-forest": Object.freeze(["forest-moth", "forest-lantern"]),
  "star-reach": Object.freeze(["reading-star", "sky-orb"])
});
const DISCOVERY_MOMENT_SHAPES = Object.freeze({
  "seedwake-meadow": "relic-lantern",
  "river-gardens": "river-sign",
  "fossil-canyon": "fossil-bone",
  "forge-settlement": "forge-gear",
  "glass-marsh": "marsh-reed",
  "storm-coast": "fleet-flag",
  "lantern-forest": "lantern-moth",
  "star-reach": "reading-star"
});
const WORLD_THEMES = Object.freeze({
  meadow: Object.freeze({
    groundKey: "seedwake-field",
    groundFrame: 21,
    pathFrame: 6,
    background: "#244f43",
    gateTint: 0xffffff,
    residents: ["seedwake-mask-frog", "seedwake-spirit", "seedwake-green-pig", "seedwake-shaman-lion", "seedwake-egg-boy"],
    drops: ["seedwake-seed-1", "seedwake-seed-2", "seedwake-seed-3"]
  }),
  dino: Object.freeze({
    groundKey: "dino-field",
    groundFrame: 6,
    pathFrame: 6,
    pathTint: "rgba(123, 67, 43, 0.2)",
    worldTint: "rgba(178, 93, 49, 0.08)",
    background: "#6a3f32",
    gateTint: 0xe1aa70,
    residents: QUEST_PIXEL_CHAPTER_CASTS["fossil-canyon"],
    drops: ["dino-bone", "dino-rock", "dino-amber"]
  }),
  moonwood: Object.freeze({
    groundKey: "moonwood-field",
    groundFrame: 36,
    pathFrame: 51,
    pathTint: "rgba(111, 91, 163, 0.28)",
    worldTint: "rgba(7, 30, 53, 0.72)",
    background: "#172b45",
    gateTint: 0x98a7df,
    residents: QUEST_PIXEL_CHAPTER_CASTS["glass-marsh"],
    drops: ["moonwood-gem-purple", "moonwood-gem-green", "moonwood-gem-red"]
  })
});

const CHAPTER_IDS_BY_STOP = Object.freeze([
  "seedwake-meadow",
  "river-gardens",
  "fossil-canyon",
  "forge-settlement",
  "glass-marsh",
  "storm-coast",
  "lantern-forest",
  "star-reach"
]);

export const CHAPTER_PIXEL_PROFILES = Object.freeze({
  "seedwake-meadow": Object.freeze({
    route: { amplitude: 64, longScale: 128, shortAmplitude: 13, shortScale: 43, phase: 0, pathWidth: 44 },
    groundFrame: 21,
    pathFrame: 6,
    background: "#244f43",
    landmark: "lantern-garden",
    atmosphere: "leaves",
    sceneryTint: 0xffffff,
    residents: WORLD_THEMES.meadow.residents,
    drops: WORLD_THEMES.meadow.drops
  }),
  "river-gardens": Object.freeze({
    route: { amplitude: 78, longScale: 104, shortAmplitude: 9, shortScale: 51, phase: 0.72, pathWidth: 39 },
    groundFrame: 36,
    pathFrame: 6,
    pathTint: "rgba(55, 126, 132, 0.13)",
    worldTint: "rgba(57, 121, 109, 0.08)",
    background: "#1e5058",
    gateTint: 0x9fd5c5,
    landmark: "singing-weir",
    atmosphere: "water-mist",
    sceneryTint: 0xa9d4b0,
    residents: QUEST_PIXEL_CHAPTER_CASTS["river-gardens"],
    drops: ["seedwake-fish", "seedwake-seed-2", "seedwake-seed-3"]
  }),
  "fossil-canyon": Object.freeze({
    route: { amplitude: 48, longScale: 154, shortAmplitude: 18, shortScale: 47, phase: 1.2, pathWidth: 51 },
    groundFrame: 6,
    pathFrame: 6,
    pathTint: "rgba(123, 67, 43, 0.2)",
    worldTint: "rgba(178, 93, 49, 0.08)",
    background: "#6a3f32",
    gateTint: 0xe1aa70,
    landmark: "rib-camp",
    atmosphere: "dust",
    sceneryTint: 0xd59a68,
    residents: WORLD_THEMES.dino.residents,
    drops: WORLD_THEMES.dino.drops
  }),
  "forge-settlement": Object.freeze({
    route: { amplitude: 30, longScale: 190, shortAmplitude: 20, shortScale: 58, phase: 2.05, pathWidth: 47 },
    groundFrame: 6,
    pathFrame: 6,
    pathTint: "rgba(49, 38, 45, 0.36)",
    worldTint: "rgba(68, 45, 54, 0.2)",
    background: "#3b3035",
    gateTint: 0xd89966,
    landmark: "word-forge",
    atmosphere: "forge-sparks",
    sceneryTint: 0xa67b68,
    residents: QUEST_PIXEL_CHAPTER_CASTS["forge-settlement"],
    drops: ["forge-premium-ember-rivet"]
  }),
  "glass-marsh": Object.freeze({
    route: { amplitude: 86, longScale: 112, shortAmplitude: 7, shortScale: 61, phase: 2.8, pathWidth: 34 },
    groundFrame: 36,
    pathFrame: 51,
    pathTint: "rgba(112, 104, 168, 0.14)",
    worldTint: "rgba(22, 34, 73, 0.54)",
    background: "#172b45",
    gateTint: 0x98a7df,
    landmark: "mirror-fen",
    atmosphere: "marsh-motes",
    sceneryTint: 0x93a0d2,
    residents: WORLD_THEMES.moonwood.residents,
    drops: ["glass-premium-mirror-gem"]
  }),
  "storm-coast": Object.freeze({
    route: { amplitude: 54, longScale: 146, shortAmplitude: 16, shortScale: 39, phase: 3.35, pathWidth: 42 },
    groundFrame: 36,
    pathFrame: 51,
    pathTint: "rgba(114, 132, 159, 0.2)",
    worldTint: "rgba(5, 25, 38, 0.84)",
    background: "#0e2436",
    gateTint: 0x9bc6dc,
    landmark: "thunder-lighthouse",
    atmosphere: "rain",
    sceneryTint: 0x7892ad,
    residents: QUEST_PIXEL_CHAPTER_CASTS["storm-coast"],
    drops: ["storm-premium-lens-shard-pickup"]
  }),
  "lantern-forest": Object.freeze({
    route: { amplitude: 92, longScale: 96, shortAmplitude: 11, shortScale: 49, phase: 4.15, pathWidth: 37 },
    groundFrame: 36,
    pathFrame: 51,
    pathTint: "rgba(72, 87, 119, 0.18)",
    worldTint: "rgba(5, 23, 36, 0.78)",
    background: "#0b1f2c",
    gateTint: 0xd6b86f,
    landmark: "sleeping-observatory",
    atmosphere: "lantern-spores",
    sceneryTint: 0x638f91,
    residents: QUEST_PIXEL_CHAPTER_CASTS["lantern-forest"],
    drops: ["lantern-premium-living-map-pickup"]
  }),
  "star-reach": Object.freeze({
    route: { amplitude: 42, longScale: 172, shortAmplitude: 23, shortScale: 68, phase: 5.1, pathWidth: 32 },
    groundFrame: 36,
    pathFrame: 51,
    pathTint: "rgba(151, 136, 206, 0.2)",
    worldTint: "rgba(34, 20, 88, 0.78)",
    background: "#121033",
    gateTint: 0xd0b6ff,
    landmark: "reading-star",
    atmosphere: "starfall",
    sceneryTint: 0x9b8fd4,
    residents: QUEST_PIXEL_CHAPTER_CASTS["star-reach"],
    drops: ["star-premium-reader-page-pickup"]
  })
});

function worldTheme(world) {
  return WORLD_THEMES[world] || WORLD_THEMES.meadow;
}

export function chapterPixelProfile(sectionOrStop = 1) {
  const stopIndex = typeof sectionOrStop === "number"
    ? sectionOrStop
    : Number(sectionOrStop?.stopIndex || 1);
  const inferredId = CHAPTER_IDS_BY_STOP[Math.max(0, Math.min(7, Math.floor((stopIndex - 1) / 5)))];
  const chapterId = typeof sectionOrStop === "object" ? sectionOrStop?.chapter?.id : null;
  return CHAPTER_PIXEL_PROFILES[chapterId || inferredId] || CHAPTER_PIXEL_PROFILES["seedwake-meadow"];
}

const CHOICE_PALETTES = Object.freeze({
  lantern: { body: 0xd78049, edge: 0x633d35, light: 0xffe477, glow: 0xffd85a },
  flower: { body: 0xef8290, edge: 0x68414e, light: 0xffd6da, glow: 0xf5a8cf },
  plank: { body: 0xb77845, edge: 0x50352f, light: 0xe9ad68, glow: 0xf5c96a },
  parcel: { body: 0xc9a3da, edge: 0x51405f, light: 0xf0d9ef, glow: 0xc7a9ee },
  destination: { body: 0x76b89a, edge: 0x294f47, light: 0xc5ead2, glow: 0x7fe0b2 },
  orb: { body: 0x68b5c8, edge: 0x31515d, light: 0xd0f5ef, glow: 0x82e6df },
  sign: { body: 0xd5a05a, edge: 0x50352f, light: 0xf7d68b, glow: 0xf3c96c },
  token: { body: 0xeee0ad, edge: 0x493b39, light: 0xfff7d1, glow: 0xf6d974 },
  river: { body: 0x5ca9ad, edge: 0x254b54, light: 0xbfe3d8, glow: 0x77d6cd },
  fossil: { body: 0xd28b58, edge: 0x58382f, light: 0xf2c477, glow: 0xe9a861 },
  forge: { body: 0xa85f47, edge: 0x3d3035, light: 0xf0a45d, glow: 0xe9794e },
  marsh: { body: 0x8e7ab7, edge: 0x333653, light: 0xcabbe7, glow: 0xa891dd },
  storm: { body: 0x56869f, edge: 0x253947, light: 0xb4d2d7, glow: 0x76b7c8 },
  forest: { body: 0x6e986c, edge: 0x29443e, light: 0xe1d278, glow: 0xc6d67e },
  star: { body: 0x8b78ba, edge: 0x332d57, light: 0xf0d990, glow: 0xc4a8ef }
});

function seededValue(seed) {
  let value = Math.sin(seed * 12.9898) * 43758.5453;
  value -= Math.floor(value);
  return value;
}

export function pixelRouteX(y, stopIndex = 1, chapterId = null) {
  const profile = chapterPixelProfile(chapterId ? { stopIndex, chapter: { id: chapterId } } : stopIndex);
  const route = profile.route;
  const map = stopPixelMap(stopIndex);
  const offset = ((Math.max(1, stopIndex) - 1) % 5) * 0.31;
  const progress = Math.max(0, Math.min(1, (1060 - Number(y || 1060)) / 980));
  const authoredX = samplePixelMapRoute(map.routePoints, progress);
  if (authoredX !== null) return authoredX;
  const phase = offset + route.phase + map.phase;
  const base = Math.sin((y / route.longScale) + phase) * route.amplitude;
  const detail = Math.sin((y / route.shortScale) + (offset * 2)) * route.shortAmplitude;
  if (map.topology === "switchback") {
    const turn = ((progress * 4.2 + map.phase / Math.PI) % 2 + 2) % 2;
    return 320 + ((turn < 1 ? turn : 2 - turn) * 2 - 1) * (route.amplitude + 24) + detail * 0.32;
  }
  if (map.topology === "figure-eight") {
    return 320 + Math.sin(progress * Math.PI * 4 + phase) * (route.amplitude + 18) * Math.sin(progress * Math.PI) + detail * 0.4;
  }
  if (map.topology === "spiral") {
    return 320 + Math.sin(progress * Math.PI * 3.2 + phase) * (38 + progress * 58) + detail * 0.36;
  }
  if (map.topology === "horseshoe") {
    return 320 + Math.sin((progress - 0.5) * Math.PI + phase * 0.25) * (route.amplitude + 18) + detail * 0.28;
  }
  if (map.topology === "ridge-climb") {
    return 320 + Math.sin(progress * Math.PI * 5 + phase) * (route.amplitude * 0.52) + (progress - 0.5) * 88 + detail * 0.24;
  }
  if (map.topology === "hub-and-spokes") {
    const hub = Math.exp(-Math.pow((progress - 0.52) / 0.16, 2));
    return 320 + base * (1 - hub * 0.72) + Math.sin(progress * Math.PI * 6 + phase) * 24 * hub;
  }
  if (map.topology === "island-loop") {
    return 320 + Math.sin(progress * Math.PI * 2.2 + phase) * (route.amplitude + 28) + detail * 0.45;
  }
  if (map.topology === "branching-grove") {
    return 320 + base * 0.78 + detail * 0.62;
  }
  return 320 + base + detail;
}

function pixelRoutePathsX(y, stopIndex) {
  const map = stopPixelMap(stopIndex);
  const progress = Math.max(0, Math.min(1, (1060 - Number(y || 1060)) / 980));
  const authored = authoredPixelRouteCenters(map, progress);
  if (authored) return authored;
  const main = pixelRouteX(y, stopIndex);
  return questOptionalRouteCenters({ main, topology: map.topology, progress, stopIndex });
}

function optionalPixelRoutePoint(progress, stopIndex, fallbackLateral = 0) {
  const point = progressToPixel(progress, stopIndex, fallbackLateral);
  const routes = pixelRoutePathsX(point.y, stopIndex);
  if (routes.length < 2) return point;
  const main = pixelRouteX(point.y, stopIndex);
  const optional = routes.reduce((furthest, route) => (
    Math.abs(route - main) > Math.abs(furthest - main) ? route : furthest
  ), routes[0]);
  return { x: optional, y: point.y };
}

function pixelResidentPoint(section, encounter, index = 0) {
  const map = stopPixelMap(section);
  const sides = map.residentSides;
  const side = sides[index % sides.length] || 0;
  const lateral = side * (map.scene === "arena" ? 18 : map.scene === "workyard" ? 30 : 24);
  return progressToPixel(encounter.progress, section.stopIndex, lateral);
}

export function progressToPixel(progress, stopIndex = 1, lateral = 0) {
  const y = 1060 - (Math.max(0, Math.min(1, Number(progress) || 0)) * 980);
  return { x: pixelRouteX(y, stopIndex) + lateral, y };
}

export function pixelToProgress(y) {
  return Math.max(0, Math.min(1, (1060 - Number(y || 1060)) / 980));
}

export function questPixelCeremonyFormation(gatePoint, count = 4) {
  const layouts = {
    1: [{ x: 0, y: 42 }],
    2: [{ x: -52, y: 54 }, { x: 52, y: 54 }],
    3: [{ x: -76, y: 48 }, { x: 0, y: 30 }, { x: 76, y: 48 }],
    4: [{ x: -84, y: 44 }, { x: -47, y: 62 }, { x: 47, y: 62 }, { x: 84, y: 44 }],
    5: [{ x: -84, y: 44 }, { x: -47, y: 62 }, { x: 47, y: 62 }, { x: 84, y: 44 }, { x: 0, y: 22 }]
  };
  const total = Math.max(0, Math.min(5, Math.floor(Number(count) || 0)));
  const slots = layouts[total] || [];
  return slots.map((slot, index) => ({
    index,
    x: gatePoint.x + slot.x,
    y: gatePoint.y + slot.y
  }));
}

function addTextureFrame(texture, name, x, y, width, height) {
  if (!texture.has(name)) texture.add(name, 0, x, y, width, height);
}

function createGroundCanvas(scene, section) {
  const { width, height, tile } = PIXEL_WORLD;
  const stopIndex = section.stopIndex;
  const theme = worldTheme(section.world);
  const profile = chapterPixelProfile(section);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;
  // One missing texture must never collapse the whole tier: degrade to the
  // theme's base colour instead of throwing out of scene creation.
  if (!scene.textures.exists(theme.groundKey)) {
    ctx.fillStyle = chapterPixelProfile(section).background || "#244f43";
    ctx.fillRect(0, 0, width, height);
    return canvas;
  }
  const source = scene.textures.get(theme.groundKey).getSourceImage();
  const columns = width / tile;
  const rows = height / tile;

  const grassFrame = profile.groundFrame ?? theme.groundFrame;
  const map = stopPixelMap(section);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const sourceX = (grassFrame % 5) * tile;
      const sourceY = Math.floor(grassFrame / 5) * tile;
      ctx.drawImage(source, sourceX, sourceY, tile, tile, column * tile, row * tile, tile, tile);
    }
  }

  if (profile.worldTint || theme.worldTint) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = profile.worldTint || theme.worldTint;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
  }

  {
    const tracePoints = (points, strokeStyle, lineWidth, from = 0, to = 1) => {
      ctx.beginPath();
      const firstY = points ? 1060 - (from * 980) : height + 8;
      const lastY = points ? 1060 - (to * 980) : -8;
      for (let y = firstY; y >= lastY; y -= 4) {
        const progress = Math.max(0, Math.min(1, (1060 - y) / 980));
        const x = points ? samplePixelMapRoute(points, progress) : pixelRouteX(y, stopIndex);
        if (y === firstY) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    };
    const traceRoute = (strokeStyle, lineWidth) => {
      tracePoints(map.routePoints, strokeStyle, lineWidth);
      for (const route of map.optionalRoutes) {
        tracePoints(route.points, strokeStyle, lineWidth, route.from, route.to);
      }
    };
    if (section.chapter?.id === "glass-marsh") {
      traceRoute("rgba(62, 57, 103, 0.94)", profile.route.pathWidth * 2.45);
      traceRoute("rgba(147, 134, 190, 0.22)", profile.route.pathWidth * 1.88);
    } else if (section.chapter?.id === "storm-coast") {
      traceRoute("rgba(26, 39, 52, 0.98)", profile.route.pathWidth * 2.18);
      traceRoute("rgba(91, 119, 132, 0.34)", profile.route.pathWidth * 1.64);
    } else if (section.chapter?.id === "lantern-forest") {
      traceRoute("rgba(22, 38, 55, 0.98)", profile.route.pathWidth * 2.24);
      traceRoute("rgba(81, 113, 116, 0.32)", profile.route.pathWidth * 1.66);
    } else if (section.chapter?.id === "star-reach") {
      traceRoute("rgba(28, 27, 70, 0.98)", profile.route.pathWidth * 2.32);
      traceRoute("rgba(119, 105, 177, 0.36)", profile.route.pathWidth * 1.68);
    } else if (section.chapter?.id === "forge-settlement") {
      traceRoute("rgba(62, 47, 48, 0.66)", profile.route.pathWidth * 1.72);
      traceRoute("rgba(143, 91, 62, 0.16)", profile.route.pathWidth * 1.35);
    } else if (section.chapter?.id === "fossil-canyon") {
      traceRoute("rgba(72, 48, 40, 0.72)", profile.route.pathWidth * 2.06);
      traceRoute("rgba(190, 137, 84, 0.97)", profile.route.pathWidth * 1.9);
      traceRoute("rgba(239, 194, 126, 0.2)", profile.route.pathWidth * 1.42);
      ctx.fillStyle = "rgba(122, 70, 46, 0.3)";
      for (let progress = 0.035; progress < 0.98; progress += 0.052) {
        const y = 1060 - (progress * 980);
        const center = pixelRouteX(y, stopIndex);
        const jitter = (seededValue((progress * 10000) + (stopIndex * 719)) - 0.5) * profile.route.pathWidth;
        ctx.fillRect(Math.round(center + jitter) - 2, Math.round(y) - 1, 4, 2);
      }
    } else {
      const river = section.chapter?.id === "river-gardens";
      traceRoute(river ? "rgba(62, 76, 58, 0.58)" : "rgba(83, 74, 54, 0.56)", profile.route.pathWidth * 2);
      traceRoute(river ? "rgba(202, 166, 108, 0.96)" : "rgba(205, 171, 112, 0.96)", profile.route.pathWidth * 1.88);
      traceRoute(river ? "rgba(239, 209, 151, 0.2)" : "rgba(244, 219, 163, 0.18)", profile.route.pathWidth * 1.4);
      ctx.fillStyle = river ? "rgba(96, 113, 76, 0.34)" : "rgba(115, 91, 55, 0.28)";
      for (let progress = 0.025; progress < 0.99; progress += 0.035) {
        const y = 1060 - (progress * 980);
        const center = pixelRouteX(y, stopIndex);
        const jitter = (seededValue((progress * 10000) + (stopIndex * 719)) - 0.5) * profile.route.pathWidth;
        ctx.fillRect(Math.round(center + jitter) - 2, Math.round(y) - 1, 4, 2);
      }
    }
  }

  return canvas;
}

function createArenaPlazaCanvas(scene, section, palette) {
  const tile = PIXEL_WORLD.tile;
  const rowWidths = [5, 8, 10, 12, 13, 13, 13, 12, 10, 8, 5];
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(...rowWidths) * tile;
  canvas.height = rowWidths.length * tile;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const theme = worldTheme(section.world);
  const profile = chapterPixelProfile(section);
  if (!scene.textures.exists(theme.groundKey)) {
    ctx.fillStyle = profile.background || "#244f43";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }
  const source = scene.textures.get(theme.groundKey).getSourceImage();
  const groundFrame = profile.groundFrame ?? theme.groundFrame;
  const pathFrame = profile.pathFrame ?? theme.pathFrame;

  rowWidths.forEach((widthInTiles, row) => {
    const startColumn = Math.floor((Math.max(...rowWidths) - widthInTiles) / 2);
    for (let localColumn = 0; localColumn < widthInTiles; localColumn += 1) {
      const column = startColumn + localColumn;
      const border = row === 0
        || row === rowWidths.length - 1
        || localColumn === 0
        || localColumn === widthInTiles - 1;
      const variation = seededValue((section.stopIndex * 701) + (row * 41) + localColumn);
      const frame = border || variation > 0.88 ? groundFrame : pathFrame;
      const sourceX = (frame % 5) * tile;
      const sourceY = Math.floor(frame / 5) * tile;
      const x = column * tile;
      const y = row * tile;
      ctx.drawImage(source, sourceX, sourceY, tile, tile, x, y, tile, tile);
      ctx.fillStyle = border
        ? `rgba(${(palette.outer >> 16) & 255}, ${(palette.outer >> 8) & 255}, ${palette.outer & 255}, 0.22)`
        : `rgba(${(palette.inner >> 16) & 255}, ${(palette.inner >> 8) & 255}, ${palette.inner & 255}, 0.1)`;
      ctx.fillRect(x, y, tile, tile);
      if (!border && variation < 0.16) {
        ctx.fillStyle = `rgba(${(palette.highlight >> 16) & 255}, ${(palette.highlight >> 8) & 255}, ${palette.highlight & 255}, 0.48)`;
        ctx.fillRect(x + 3 + ((row + localColumn) % 5), y + 4 + ((row * 2 + localColumn) % 6), 3, 2);
      }
    }
  });
  return canvas;
}

function createEncounterClearingCanvas(scene, section, palette, encounterIndex) {
  const tile = PIXEL_WORLD.tile;
  const canvas = document.createElement("canvas");
  canvas.width = 176;
  canvas.height = 112;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const theme = worldTheme(section.world);
  const profile = chapterPixelProfile(section);
  const source = scene.textures.get(theme.groundKey).getSourceImage();
  const pathFrame = profile.pathFrame ?? theme.pathFrame;
  const rgba = (colour, alpha) => `rgba(${(colour >> 16) & 255}, ${(colour >> 8) & 255}, ${colour & 255}, ${alpha})`;
  const centreX = canvas.width / 2;
  const centreY = canvas.height / 2;

  ctx.fillStyle = rgba(palette.outer, section.chapter?.id === "glass-marsh" ? 0.58 : 0.3);
  ctx.beginPath();
  ctx.ellipse(centreX, centreY, 82, 49, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(centreX, centreY - 1, 78, 45, 0, 0, Math.PI * 2);
  ctx.clip();
  const sourceX = (pathFrame % 5) * tile;
  const sourceY = Math.floor(pathFrame / 5) * tile;
  for (let y = 0; y < canvas.height; y += tile) {
    for (let x = 0; x < canvas.width; x += tile) {
      ctx.drawImage(source, sourceX, sourceY, tile, tile, x, y, tile, tile);
    }
  }
  ctx.fillStyle = rgba(palette.inner, section.chapter?.id === "glass-marsh" ? 0.5 : 0.14);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let fleck = 0; fleck < 22; fleck += 1) {
    const variation = seededValue((section.stopIndex * 977) + (encounterIndex * 113) + (fleck * 37));
    const angle = variation * Math.PI * 2;
    const radius = 12 + (seededValue((fleck * 61) + section.stopIndex) * 60);
    ctx.fillStyle = rgba(palette.highlight, 0.28 + (variation * 0.28));
    ctx.fillRect(
      Math.round(centreX + (Math.cos(angle) * radius)),
      Math.round(centreY + (Math.sin(angle) * radius * 0.52)),
      fleck % 3 === 0 ? 3 : 2,
      2
    );
  }
  ctx.restore();

  ctx.strokeStyle = rgba(palette.highlight, 0.18);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(centreX, centreY - 1, 79, 46, 0, 0, Math.PI * 2);
  ctx.stroke();
  return canvas;
}

function addPixelShadow(scene, x, y, width = 18, height = 7) {
  return scene.add.ellipse(x, y, width, height, 0x132b25, 0.28).setDepth(y - 1);
}

function paletteForShape(shape = "") {
  if (shape.includes("chorus")) return CHOICE_PALETTES.orb;
  if (shape.includes("lantern")) return CHOICE_PALETTES.lantern;
  if (shape.includes("flower") || shape === "fruit") return CHOICE_PALETTES.flower;
  if (shape.includes("plank") || shape.includes("bridge")) return CHOICE_PALETTES.plank;
  if (shape.includes("parcel")) return CHOICE_PALETTES.parcel;
  if (shape.includes("marker") || shape.includes("slot") || shape.includes("pen")) return CHOICE_PALETTES.destination;
  if (shape.includes("orb") || shape.includes("rune")) return CHOICE_PALETTES.orb;
  if (shape.includes("sign") || shape.includes("path")) return CHOICE_PALETTES.sign;
  if (/river|ferry|wheel|weir/.test(shape)) return CHOICE_PALETTES.river;
  if (/fossil|track|rescue/.test(shape)) return CHOICE_PALETTES.fossil;
  if (/forge|ore|rail|word-plate/.test(shape)) return CHOICE_PALETTES.forge;
  if (/marsh|mirror|fen/.test(shape)) return CHOICE_PALETTES.marsh;
  if (/storm|cliff|harbour|shelter|lens|fleet/.test(shape)) return CHOICE_PALETTES.storm;
  if (/forest|moth|memory-sign|telescope|orbit/.test(shape)) return CHOICE_PALETTES.forest;
  if (/star|sky|reading/.test(shape)) return CHOICE_PALETTES.star;
  return CHOICE_PALETTES.token;
}

function authoredChoiceSprite(scene, shape, index, item = {}) {
  const fossilCanyon = scene.model.section.chapter?.id === "fossil-canyon";
  const forgeSettlement = scene.model.section.chapter?.id === "forge-settlement";
  const glassMarsh = scene.model.section.chapter?.id === "glass-marsh";
  const stormCoast = scene.model.section.chapter?.id === "storm-coast";
  const lanternForest = scene.model.section.chapter?.id === "lantern-forest";
  const starReach = scene.model.section.chapter?.id === "star-reach";
  if (fossilCanyon && item.role === "destination") return null;
  const fossilOptions = item.role === "tool-work"
    ? ["fossil-premium-brush-station"]
    : shape.includes("track")
      ? ["fossil-premium-track-marker"]
      : shape.includes("rescue") || shape.includes("flag")
        ? ["fossil-premium-rescue-flag"]
        : shape.includes("beacon")
          ? ["fossil-premium-beacon"]
          : shape.includes("bone")
            ? ["fossil-premium-fitted-bone"]
            : shape.includes("fossil") || shape.includes("rune")
              ? ["fossil-premium-rune"]
              : [];
  const forgeOptions = item.role === "destination"
    ? shape.includes("gear")
      ? ["forge-premium-gear-socket"]
      : shape.includes("rune") || shape.includes("word-plate")
        ? ["forge-premium-word-plate"]
        : []
    : shape.includes("gear")
      ? ["forge-premium-machine-gear"]
      : shape.includes("ore")
        ? ["forge-premium-ore-tray"]
        : shape.includes("rail") || shape.includes("parcel")
          ? ["forge-premium-rail-trolley"]
          : shape.includes("word-plate")
            ? ["forge-premium-word-plate"]
            : shape.includes("rune")
              ? ["forge-premium-rune"]
              : [];
  const glassOptions = item.role === "destination"
    ? shape.includes("mirror") || shape.includes("shard") || shape.includes("slot")
      ? ["glass-premium-mirror-socket"]
      : shape.includes("beacon")
        ? ["glass-premium-fen-beacon"]
        : []
    : shape.includes("reed")
      ? ["glass-premium-tuned-reed"]
      : shape.includes("lily") || shape.includes("path")
        ? ["glass-premium-lily-step"]
        : shape.includes("fish")
          ? ["glass-premium-marsh-fish-net"]
          : shape.includes("beacon")
            ? ["glass-premium-fen-beacon"]
            : shape.includes("mirror") || shape.includes("shard")
              ? ["glass-premium-mirror-shard"]
              : [];
  const stormOptions = item.role === "destination"
    ? shape.includes("lens") || shape.includes("shard") || shape.includes("slot")
      ? ["storm-premium-lens-socket"]
      : shape.includes("harbour") || shape.includes("dock") || shape.includes("crate")
        ? ["storm-premium-harbour-crate"]
        : []
    : shape.includes("cliff") || shape.includes("climb") || shape.includes("hold") || shape.includes("path")
      ? ["storm-premium-cliff-holds"]
      : shape.includes("harbour") || shape.includes("crate") || shape.includes("parcel")
        ? ["storm-premium-harbour-crate"]
        : shape.includes("shelter") || shape.includes("board")
          ? ["storm-premium-shelter-board"]
          : shape.includes("lens") || shape.includes("shard")
            ? ["storm-premium-lens-shard"]
            : shape.includes("fleet") || shape.includes("flag") || shape.includes("signal")
              ? ["storm-premium-fleet-flag"]
              : [];
  const lanternOptions = item.role === "destination"
    ? shape.includes("observatory") || shape.includes("orbit") || shape.includes("dial") || shape.includes("slot")
      ? ["lantern-premium-observatory-socket"]
      : shape.includes("telescope")
        ? ["lantern-premium-telescope-pedestal"]
        : []
    : shape.includes("moth")
      ? ["lantern-premium-moth-roost"]
      : shape.includes("lantern")
        ? ["lantern-premium-forest-lantern"]
        : shape.includes("memory") || shape.includes("path") || shape.includes("sign")
          ? ["lantern-premium-memory-marker"]
          : shape.includes("telescope")
            ? ["lantern-premium-telescope-part"]
            : shape.includes("orbit") || shape.includes("dial") || shape.includes("observatory")
              ? ["lantern-premium-orbit-dial"]
              : [];
  const starOptions = item.role === "destination"
    ? shape.includes("reading") || shape.includes("star") || shape.includes("slot")
      ? ["star-premium-reading-star-socket"]
      : shape.includes("memory")
        ? ["star-premium-memory-page"]
        : []
    : shape.includes("sky") || shape.includes("parcel")
      ? ["star-premium-sky-capsule"]
      : shape.includes("memory")
        ? ["star-premium-memory-page"]
        : shape.includes("reading")
          ? ["star-premium-reading-sigil"]
          : shape.includes("token") || shape.includes("sort")
            ? ["star-premium-sorting-prism"]
            : shape.includes("star") || shape.includes("node")
              ? ["star-premium-route-node"]
              : [];
  const options = starReach && starOptions.length
    ? starOptions
    : lanternForest && lanternOptions.length
    ? lanternOptions
    : stormCoast && stormOptions.length
    ? stormOptions
    : glassMarsh && glassOptions.length
    ? glassOptions
    : forgeSettlement && forgeOptions.length
    ? forgeOptions
    : fossilCanyon && fossilOptions.length
    ? fossilOptions
    : shape.includes("fish")
    ? ["seedwake-fish"]
    : shape.includes("bone") || shape.includes("fossil")
      ? ["dino-bone", "dino-amber", "dino-rock"]
      : shape.includes("shard") || shape.includes("lens") || shape.includes("mirror")
        ? ["moonwood-gem-purple", "moonwood-gem-green", "moonwood-gem-red"]
        : [];
  const available = options.filter(key => scene.textures.exists(key));
  if (!available.length) return null;
  const key = available[index % available.length];
  const sprite = scene.add.image(0, 0, key);
  if (key === "star-premium-sky-capsule") sprite.setScale(0.31);
  else if (key === "star-premium-memory-page") sprite.setScale(0.3);
  else if (key === "star-premium-reading-star-socket") sprite.setScale(0.32);
  else if (key.startsWith("star-premium-")) sprite.setScale(0.32);
  else if (key === "lantern-premium-moth-roost") sprite.setScale(0.42);
  else if (key === "lantern-premium-forest-lantern") sprite.setScale(0.4);
  else if (key === "lantern-premium-memory-marker") sprite.setScale(0.44);
  else if (key === "lantern-premium-telescope-part") sprite.setScale(0.44);
  else if (key === "lantern-premium-orbit-dial") sprite.setScale(0.42);
  else if (key === "lantern-premium-observatory-socket") sprite.setScale(0.44);
  else if (key.startsWith("lantern-premium-")) sprite.setScale(0.46);
  else if (key === "storm-premium-cliff-holds") sprite.setScale(0.43);
  else if (key === "storm-premium-lens-socket") sprite.setScale(0.45);
  else if (key.startsWith("storm-premium-")) sprite.setScale(0.48);
  else if (key === "glass-premium-marsh-fish-net") sprite.setScale(0.48);
  else if (key === "glass-premium-mirror-socket") sprite.setScale(0.46);
  else if (key.startsWith("glass-premium-")) sprite.setScale(0.49);
  else if (key === "forge-premium-ore-tray") sprite.setScale(0.48);
  else if (key === "forge-premium-gear-socket") sprite.setScale(0.52);
  else if (key === "forge-premium-rail-trolley") sprite.setScale(0.56);
  else if (key.startsWith("forge-premium-")) sprite.setScale(0.6);
  else if (key === "fossil-premium-brush-station") sprite.setScale(0.54);
  else if (key.startsWith("fossil-premium-")) sprite.setScale(key === "fossil-premium-beacon" ? 0.58 : 0.62);
  else if (key === "seedwake-fish") sprite.setScale(2.35).setAngle(index % 2 ? 2 : -2);
  else if (key === "dino-bone") sprite.setScale(2.15).setAngle(index % 2 ? 22 : -18);
  else if (key.startsWith("dino-")) sprite.setScale(1.7);
  else sprite.setScale(1.85);
  return sprite;
}

const PIXEL_LOWERCASE_GLYPHS = Object.freeze({
  a: ["00000", "00000", "01110", "00001", "01111", "10001", "01111"],
  b: ["10000", "10000", "10110", "11001", "10001", "11001", "10110"],
  c: ["00000", "00000", "01110", "10001", "10000", "10001", "01110"],
  d: ["00001", "00001", "01101", "10011", "10001", "10011", "01101"],
  e: ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  f: ["00110", "01001", "01000", "11100", "01000", "01000", "01000"],
  g: ["00000", "01101", "10011", "10001", "01111", "00001", "01110"],
  h: ["10000", "10000", "10110", "11001", "10001", "10001", "10001"],
  i: ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  j: ["00010", "00000", "00110", "00010", "00010", "10010", "01100"],
  k: ["10000", "10001", "10010", "11100", "10010", "10001", "10001"],
  l: ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  m: ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
  n: ["00000", "00000", "10110", "11001", "10001", "10001", "10001"],
  o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  p: ["00000", "10110", "11001", "10001", "11110", "10000", "10000"],
  q: ["00000", "01101", "10011", "10001", "01111", "00001", "00001"],
  r: ["00000", "00000", "10110", "11001", "10000", "10000", "10000"],
  s: ["00000", "00000", "01111", "10000", "01110", "00001", "11110"],
  t: ["00100", "00100", "11111", "00100", "00100", "00101", "00010"],
  u: ["00000", "00000", "10001", "10001", "10001", "10011", "01101"],
  v: ["00000", "00000", "10001", "10001", "10001", "01010", "00100"],
  w: ["00000", "00000", "10001", "10001", "10101", "10101", "01010"],
  x: ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
  y: ["00000", "10001", "10001", "01111", "00001", "10001", "01110"],
  z: ["00000", "00000", "11111", "00010", "00100", "01000", "11111"]
});

function addPixelLowercaseGlyph(scene, value, y) {
  const rows = PIXEL_LOWERCASE_GLYPHS[String(value).toLowerCase()];
  if (!rows) return null;
  const pixel = 3;
  const width = rows[0].length * pixel;
  const height = rows.length * pixel;
  const glyph = scene.add.graphics();
  glyph.fillStyle(0x2d2730, 1);
  rows.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell === "1") {
        glyph.fillRect(
          Math.round((-width / 2) + (columnIndex * pixel)),
          Math.round(y - (height / 2) + (rowIndex * pixel)),
          pixel,
          pixel
        );
      }
    });
  });
  return glyph;
}

function addChoiceArt(scene, container, item, index) {
  const shape = String(item.shape || "token");
  const palette = paletteForShape(shape);
  const destinationShape = shape.includes("marker") || shape.includes("slot") || shape.includes("pen");
  const glow = scene.add.ellipse(0, 2, shape.includes("plank") ? 48 : 38, shape.includes("plank") ? 27 : 38, palette.glow, 0.14);
  const shadow = scene.add.ellipse(0, 11, shape.includes("plank") ? 39 : 27, shape.includes("plank") ? 9 : 8, 0x172926, 0.3);
  const art = scene.add.graphics();
  const authoredSprite = authoredChoiceSprite(scene, shape, index, item);
  let radius = CHOICE_DISTANCE;
  let labelY = -1;

  if (authoredSprite) {
    radius = shape.includes("rail") || shape.includes("parcel") ? 27 : 24;
    labelY = shape.includes("ore") ? 3 : -1;
  } else if (shape.includes("lantern")) {
    if (shape.includes("chorus")) {
      art.fillStyle(palette.glow, 0.7).fillCircle(-14, -2, 4).fillCircle(14, -2, 4);
      art.fillStyle(palette.edge, 1).fillTriangle(-6, -14, 6, -14, 0, -20);
    }
    art.fillStyle(palette.edge, 1).fillRect(-12, -12, 24, 25);
    art.fillStyle(palette.body, 1).fillRect(-9, -10, 18, 20);
    art.fillStyle(palette.light, 1).fillRect(-6, -7, 12, 13);
    art.fillStyle(palette.edge, 1).fillRect(-6, -16, 12, 4).fillRect(-4, 13, 8, 3);
    art.fillStyle(0xffffff, 0.75).fillRect(-4, -5, 3, 5);
  } else if (shape.includes("flower") || shape === "fruit") {
    art.fillStyle(0x4d8057, 1).fillRect(-2, 7, 4, 12);
    for (const [x, y] of [[0, -10], [10, -2], [7, 8], [-7, 8], [-10, -2]]) {
      art.fillStyle(index % 2 ? 0xc8a1df : palette.body, 1).fillCircle(x, y, 8);
    }
    art.fillStyle(palette.light, 1).fillCircle(0, 0, 10);
    radius = 21;
  } else if (shape.includes("plank") || shape.includes("bridge")) {
    const slot = shape.includes("slot");
    if (slot) {
      art.fillStyle(palette.edge, 1).fillRect(-28, -14, 12, 28).fillRect(16, -14, 12, 28);
      art.fillStyle(0x8c7660, 1).fillRect(-25, -11, 7, 22).fillRect(18, -11, 7, 22);
      art.fillStyle(palette.body, 1).fillRect(-30, -15, 16, 6).fillRect(14, 8, 16, 6);
      art.fillStyle(palette.light, 0.52).fillRect(-14, -7, 28, 14);
      art.lineStyle(2, palette.edge, 0.72).strokeRect(-14, -7, 28, 14);
      art.fillStyle(palette.light, 0.88).fillRect(-26, -9, 4, 3).fillRect(21, 6, 4, 3);
    } else {
      art.fillStyle(palette.edge, 1).fillRoundedRect(-23, -12, 46, 24, 5);
      art.fillStyle(palette.body, 1).fillRoundedRect(-20, -9, 40, 18, 4);
      art.fillStyle(palette.light, 0.7).fillRect(-15, -6, 28, 3);
      art.fillStyle(palette.edge, 1).fillCircle(-15, 5, 2).fillCircle(15, 5, 2);
    }
    radius = 23;
  } else if (shape.includes("parcel")) {
    art.fillStyle(palette.edge, 1).fillRoundedRect(-19, -14, 38, 28, 5);
    art.fillStyle(palette.body, 1).fillRoundedRect(-16, -11, 32, 22, 3);
    art.fillStyle(palette.light, 1).fillRect(-3, -11, 6, 22).fillRect(-16, -3, 32, 6);
    radius = 22;
  } else if (shape.includes("ferry")) {
    art.fillStyle(0xe3f3ee, 0.62).fillEllipse(0, 13, 55, 13);
    art.fillStyle(palette.edge, 1).fillTriangle(-27, -9, 27, -9, 19, 14).fillTriangle(-27, -9, 19, 14, -19, 14);
    art.fillStyle(palette.body, 1).fillRoundedRect(-22, -7, 44, 16, 5);
    art.fillStyle(palette.light, 0.86).fillRect(-15, -5, 27, 3);
    art.fillStyle(palette.edge, 1).fillRect(-3, -23, 5, 17);
    art.fillStyle(0xf4e6b9, 1).fillTriangle(2, -22, 18, -13, 2, -7);
    radius = 28;
  } else if (shape.includes("fish")) {
    if (!authoredSprite) {
      art.fillStyle(palette.edge, 1).fillRect(-13, -8, 24, 16);
      art.fillStyle(palette.body, 1).fillRect(-10, -6, 21, 12);
      art.fillStyle(palette.light, 0.88).fillRect(-7, -4, 9, 4);
      art.fillStyle(palette.body, 1).fillTriangle(10, 0, 22, -10, 22, 10);
      art.fillStyle(palette.edge, 1).fillRect(-8, -2, 3, 3);
    }
    radius = 22;
  } else if (shape.includes("gear") || shape.includes("paddle") || shape.includes("dial")) {
    art.fillStyle(palette.edge, 1).fillCircle(0, 0, 17);
    for (let tooth = 0; tooth < 8; tooth += 1) {
      const angle = (Math.PI * 2 * tooth) / 8;
      art.fillStyle(palette.edge, 1).fillRect((Math.cos(angle) * 17) - 3, (Math.sin(angle) * 17) - 3, 6, 6);
    }
    art.fillStyle(palette.body, 1).fillCircle(0, 0, 13);
    art.fillStyle(palette.light, 0.85).fillCircle(-4, -5, 4);
    art.fillStyle(palette.edge, 1).fillCircle(0, 0, 5);
    radius = 23;
  } else if ((shape.includes("bone") || shape.includes("fossil")) && !destinationShape) {
    if (!authoredSprite) {
      art.fillStyle(palette.edge, 1).fillRect(-12, -5, 24, 10);
      art.fillStyle(palette.light, 1).fillRect(-11, -3, 22, 6);
      for (const x of [-13, 13]) {
        art.fillStyle(palette.light, 1).fillCircle(x, -5, 6).fillCircle(x, 5, 6);
        art.lineStyle(2, palette.edge, 1).strokeCircle(x, -5, 6).strokeCircle(x, 5, 6);
      }
    }
    radius = 23;
  } else if (shape.includes("shard") || shape.includes("lens") || shape.includes("mirror")) {
    if (!authoredSprite) {
      art.fillStyle(palette.edge, 1).fillTriangle(0, -20, 17, 11, -17, 11);
      art.fillStyle(palette.body, 1).fillTriangle(0, -16, 13, 9, -13, 9);
      art.fillStyle(palette.light, 0.9).fillTriangle(-2, -12, 4, -2, -8, 3);
    }
    radius = 23;
  } else if (shape.includes("moth")) {
    art.fillStyle(palette.edge, 1).fillEllipse(-9, -1, 16, 22).fillEllipse(9, -1, 16, 22);
    art.fillStyle(palette.body, 1).fillEllipse(-8, -1, 12, 18).fillEllipse(8, -1, 12, 18);
    art.fillStyle(palette.light, 0.88).fillCircle(-8, -3, 4).fillCircle(8, -3, 4);
    art.fillStyle(palette.edge, 1).fillRect(-2, -10, 4, 24);
    radius = 22;
  } else if (shape.includes("lily") || shape.includes("reed")) {
    if (shape.includes("reed")) {
      art.fillStyle(palette.edge, 1).fillRect(-2, -13, 4, 28);
      art.fillStyle(palette.light, 1).fillRoundedRect(-8, -17, 16, 12, 5);
    } else {
      art.fillStyle(palette.edge, 1).fillCircle(0, 0, 18);
      art.fillStyle(palette.body, 1).fillCircle(0, 0, 15);
      art.fillStyle(palette.edge, 1).fillTriangle(0, 0, 18, -5, 14, 8);
      art.fillStyle(palette.light, 1).fillCircle(-5, -4, 4);
    }
    radius = 22;
  } else if (shape.includes("bell") || shape.includes("beacon")) {
    if (!authoredSprite) {
      art.fillStyle(palette.edge, 1).fillRect(-3, 7, 6, 14);
      art.fillStyle(palette.edge, 1).fillRoundedRect(-15, -16, 30, 25, 6);
      art.fillStyle(palette.body, 1).fillRoundedRect(-12, -13, 24, 19, 5);
      art.fillStyle(palette.light, 1).fillCircle(-4, -7, 5);
      art.fillStyle(palette.edge, 1).fillRect(-10, 7, 20, 4);
    }
    radius = 22;
  } else if (shape.includes("buoy")) {
    art.lineStyle(3, palette.light, 0.72).lineBetween(-24, 0, 24, 0);
    for (const x of [-24, 24]) {
      art.fillStyle(palette.edge, 1).fillCircle(x, 0, 8);
      art.fillStyle(palette.body, 1).fillCircle(x, 0, 5);
      art.fillStyle(palette.light, 1).fillRect(x - 2, -16, 4, 10);
      art.fillStyle(0xf2e6b8, 0.92).fillTriangle(x + 2, -16, x + 12, -12, x + 2, -8);
    }
    radius = 28;
  } else if (shape.includes("climb-hold")) {
    art.fillStyle(palette.edge, 1).fillEllipse(0, 2, 38, 19);
    art.fillStyle(palette.body, 1).fillEllipse(0, 0, 32, 14);
    art.fillStyle(palette.light, 0.82).fillEllipse(-6, -3, 14, 5);
    art.fillStyle(0x413946, 0.72).fillCircle(10, 3, 3);
    radius = 24;
  } else if (shape.includes("flag")) {
    if (!authoredSprite) {
      art.fillStyle(palette.edge, 1).fillRect(-10, -18, 5, 39);
      art.fillStyle(palette.edge, 1).fillTriangle(-6, -17, 19, -12, -6, 3);
      art.fillStyle(palette.body, 1).fillTriangle(-5, -14, 14, -10, -5, -1);
      art.fillStyle(palette.light, 0.82).fillRect(-2, -11, 7, 3);
    }
    radius = 22;
  } else if (shape.includes("star") || shape.includes("sky")) {
    const points = [];
    for (let point = 0; point < 10; point += 1) {
      const angle = (-Math.PI / 2) + ((Math.PI * 2 * point) / 10);
      const distance = point % 2 === 0 ? 19 : 8;
      points.push({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
    }
    art.fillStyle(palette.edge, 1).fillPoints(points, true);
    const innerPoints = points.map(point => ({ x: point.x * 0.78, y: point.y * 0.78 }));
    art.fillStyle(palette.light, 1).fillPoints(innerPoints, true);
    radius = 23;
  } else if (shape.includes("marker") || shape.includes("slot") || shape.includes("pen")) {
    if (scene.model.section.chapter?.id === "fossil-canyon" && shape.includes("bone")) {
      art.lineStyle(7, palette.light, 0.9).lineBetween(-12, 0, 12, 0);
      art.lineStyle(2, 0xfff3c2, 1).lineBetween(-12, -1, 12, -1);
      for (const x of [-15, 15]) {
        art.lineStyle(5, palette.light, 0.9).strokeCircle(x, -5, 5).strokeCircle(x, 5, 5);
        art.lineStyle(2, 0xfff3c2, 0.96).strokeCircle(x, -5, 4).strokeCircle(x, 5, 4);
      }
      glow.setAlpha(0.34).setScale(1.18);
    } else {
      art.lineStyle(5, palette.light, 0.95).strokeCircle(0, 0, 18);
      art.lineStyle(2, palette.edge, 1).strokeCircle(0, 0, 18);
      art.fillStyle(palette.body, 0.66).fillCircle(0, 0, 12);
      art.fillStyle(0xffffff, 0.8).fillTriangle(-5, 2, 5, 2, 0, -6);
    }
    radius = 22;
  } else if (shape.includes("orb") || shape.includes("rune")) {
    art.fillStyle(palette.edge, 1).fillCircle(0, 0, 17);
    art.fillStyle(palette.body, 1).fillCircle(0, 0, 14);
    art.fillStyle(palette.light, 0.86).fillCircle(-5, -6, 5);
  } else if (shape.includes("sign") || shape.includes("path")) {
    if (!authoredSprite) {
      art.fillStyle(palette.edge, 1).fillRoundedRect(-22, -15, 44, 27, 4);
      art.fillStyle(palette.body, 1).fillRoundedRect(-19, -12, 38, 21, 3);
      art.fillStyle(palette.edge, 1).fillRect(-3, 10, 6, 12);
    }
    radius = 23;
    labelY = -2;
  } else if (shape === "cake") {
    art.fillStyle(0x6d3f3d, 1).fillRoundedRect(-17, -3, 34, 17, 5);
    art.fillStyle(0xf2b7bd, 1).fillRoundedRect(-16, -9, 32, 11, 5);
    art.fillStyle(0xfff1c9, 1).fillCircle(-8, -7, 3).fillCircle(8, -7, 3);
    labelY = 4;
  } else {
    art.fillStyle(palette.edge, 1).fillRoundedRect(-15, -15, 30, 30, 6);
    art.fillStyle(palette.body, 1).fillRoundedRect(-12, -12, 24, 24, 4);
    art.fillStyle(palette.light, 0.7).fillRect(-8, -9, 13, 3);
  }

  const rawLabel = destinationShape ? "" : String(item.label ?? item.value ?? "");
  const embeddedLabel = Boolean(rawLabel) && (
    ["token", "orb", "rune"].includes(shape)
    || (rawLabel.length <= 3 && /lantern|sign|path|track|parcel|flower|plank|bridge|fish|bone|fossil|shard|lens|mirror|flag|beacon|gear|ore|rail|word-plate|rune|reed|lily|moth|telescope|orbit|dial/.test(shape))
    || (rawLabel.length <= 4 && /star|sky|memory|reading|node/.test(shape))
  );
  const authoredLabelBadge = embeddedLabel && authoredSprite && rawLabel.length <= 3;
  const separateRune = Boolean(rawLabel) && !embeddedLabel;
  const singleRune = separateRune && rawLabel.length === 1;
  if (separateRune) labelY = -29;
  const labelPlate = scene.add.graphics();
  if (separateRune) {
    const plateWidth = rawLabel.length > 4 ? 44 : rawLabel.length > 2 ? 35 : singleRune ? 29 : 25;
    const plateHeight = singleRune ? 27 : 21;
    labelPlate.fillStyle(palette.edge, 1).fillRoundedRect(-(plateWidth / 2), labelY - (plateHeight / 2), plateWidth, plateHeight, 4);
    labelPlate.fillStyle(0xf4e6bd, 1).fillRoundedRect(-(plateWidth / 2) + 2, labelY - (plateHeight / 2) + 2, plateWidth - 4, plateHeight - 4, 3);
    labelPlate.fillStyle(palette.light, 0.58).fillRect(-(plateWidth / 2) + 5, labelY - (plateHeight / 2) + 4, Math.max(5, plateWidth * 0.38), 2);
    labelPlate.fillStyle(palette.edge, 0.86).fillRect(-2, labelY + (plateHeight / 2) - 1, 4, 4);
  } else if (authoredLabelBadge) {
    const badgeWidth = rawLabel.length === 1 ? 16 : 23;
    labelPlate.fillStyle(palette.edge, 0.94).fillRoundedRect(-(badgeWidth / 2), labelY - 8, badgeWidth, 16, 4);
    labelPlate.fillStyle(0xf4e6bd, 1).fillRoundedRect(-(badgeWidth / 2) + 2, labelY - 6, badgeWidth - 4, 12, 3);
  }
  const pixelGlyph = embeddedLabel && rawLabel.length === 1 && !/[a-z]/i.test(rawLabel)
    ? addPixelLowercaseGlyph(scene, rawLabel, labelY)
    : null;
  const labelStyle = {
    color: "#2d2730",
    fontFamily: embeddedLabel ? "Verdana, Arial, sans-serif" : "Arial Black, Arial, sans-serif",
    fontSize: rawLabel.length > 4 ? "11px" : rawLabel.length > 2 ? "13px" : singleRune ? "19px" : separateRune ? "15px" : embeddedLabel ? "22px" : "18px",
    fontStyle: "bold",
    align: "center",
    padding: { left: 2, right: 2, top: singleRune ? 3 : 0, bottom: singleRune ? 3 : 1 },
    resolution: 2,
    wordWrap: rawLabel.length > 5 ? { width: 34, useAdvancedWrap: true } : undefined
  };
  if (embeddedLabel && !pixelGlyph) {
    labelStyle.stroke = "#fff4d7";
    labelStyle.strokeThickness = 1;
  }
  const label = pixelGlyph || scene.add.text(0, labelY, rawLabel, labelStyle).setOrigin(0.5);
  container.add([glow, shadow, art, ...(authoredSprite ? [authoredSprite] : []), labelPlate, label]);
  return { glow, shadow, art, authoredSprite, labelPlate, label, radius };
}

function completedShape(shape = "") {
  if (shape.includes("reed")) return "marsh-reed";
  if (shape.includes("lily")) return "marsh-lily";
  if (shape.includes("fish")) return "river-fish";
  if (shape.includes("ore")) return "forge-ore";
  if (shape.includes("sluice")) return "river-sign";
  if (shape.includes("observatory")) return "orbit-dial";
  if (shape.includes("beacon") || shape.includes("flag")) return shape.includes("flag") ? "fleet-flag" : "fen-beacon";
  if (shape.includes("gear") || shape.includes("paddle") || shape.includes("dial")) return "forge-gear";
  if (shape.includes("bone") || shape.includes("fossil")) return "fossil-bone";
  if (shape.includes("shard") || shape.includes("lens") || shape.includes("mirror")) return "lens-shard";
  if (shape.includes("moth")) return "lantern-moth";
  if (shape.includes("star") || shape.includes("sky")) return "star-node";
  if (shape.includes("lantern")) return "chorus-lantern";
  if (shape.includes("flower")) return "jump-flower";
  if (shape.includes("parcel")) return "sound-parcel";
  if (shape.includes("plank")) return "river-plank";
  if (shape.includes("rune")) return "echo-orb";
  return "delivery-marker";
}

function completionLateral(shape = "", ordinal = 0) {
  if (/(plank|bridge|board|gear|paddle|bone|shard|lens|mirror|telescope|memory)/.test(shape)) return 0;
  const side = ordinal % 2 === 0 ? -1 : 1;
  return side * (42 + Math.floor(ordinal / 2) * 16);
}

function completionMotion(shape = "") {
  if (/(turning|wheel|gear|dial|observatory)/.test(shape)) return "turn";
  if (/(lit|ringing|beacon|lantern|star|awakened|forged)/.test(shape)) return "glow";
  if (/(fish|moth|parcel|crate|cargo)/.test(shape)) return "bob";
  return "settled";
}

class QuestPixelScene extends Phaser.Scene {
  constructor(options) {
    super({ key: `QuestPixel-${options.instanceId}` });
    this.options = options;
    this.bridge = options.bridge;
    this.model = options.model;
    this.choiceObjects = [];
    this.choiceCorridorRadius = 0;
    this.choiceInside = new Set();
    this.choiceStageDecor = null;
    this.dropObjects = new Map();
    this.residents = new Map();
    this.ceremonySprites = [];
    this.ceremonyDecor = [];
    this.ceremonyTimers = [];
    this.ceremonyActive = false;
    this.memoryCameos = [];
    this.memoryStoryMoment = null;
    this.discoveryMoments = [];
    this.reactiveFoliage = [];
    this.navigationObstacles = [];
    this.completionObjects = new Map();
    this.carriedObject = null;
    this.carriedObjectMode = null;
    this.pointerTarget = null;
    this.directionInput = { left: false, right: false, up: false, down: false };
    this.pointerMarker = null;
    this.routeLaneIndex = null;
    this.optionalRouteActive = false;
    this.choiceCooldownUntil = 0;
    this.playerActionLockedUntil = 0;
    this.gateGlowTween = null;
    this.encounterLatch = null;
    this.encounterAttemptAt = 0;
    this.gateLatch = false;
    this.lastFacing = "down";
    this.lastModelSignature = "";
    this.lastCarriedSignature = "";
    this.failedAssetKeys = new Set();
    this.failedTextureKeys = new Set();
    this.sceneShuttingDown = false;
    this.nextRuntimeHealthAt = RUNTIME_HEALTH_FIRST_SAMPLE_MS;
  }

  preload() {
    this.load.on("loaderror", file => {
      const key = String(file?.key || "unknown");
      this.failedAssetKeys.add(key);
      if (file?.type === "image") this.failedTextureKeys.add(key);
      this.bridge.onRuntimeSignal?.({
        type: "asset-error",
        key,
        url: String(file?.url || ""),
        assetType: String(file?.type || "unknown")
      });
    });
    const world = this.model.section.world;
    const bookWorldBackground = QUEST_BOOK_WORLD_BACKGROUNDS[world];
    if (bookWorldBackground) {
      this.load.image("book-world-background", bookWorldBackground);
    }
    const chapterId = this.model.section.chapter?.id;
    const minimalStarReachLoad = chapterId === "star-reach";
    const activeProfile = chapterPixelProfile(this.model.section);
    const activeResidents = [...new Set(activeProfile.residents)];
    if (!minimalStarReachLoad) {
      this.load.image("seedwake-field", `${ASSET_ROOT}/tiles/field.png`);
      this.load.image("seedwake-nature", `${ASSET_ROOT}/tiles/nature.png`);
      this.load.image("seedwake-village", `${ASSET_ROOT}/tiles/village.png`);
    }
    if (this.model.section.chapter?.id === "seedwake-meadow") {
      const premiumSceneryRoot = `${ASSET_ROOT}/scenery-premium`;
      this.load.image("seedwake-premium-tree", `${premiumSceneryRoot}/round-tree.png`);
      this.load.image("seedwake-premium-blossom-tree", `${premiumSceneryRoot}/blossom-tree.png`);
      this.load.image("seedwake-premium-shrub", `${premiumSceneryRoot}/flower-shrub.png`);
      this.load.image("seedwake-premium-hollow-tree", `${premiumSceneryRoot}/hollow-tree.png`);
      this.load.image("seedwake-premium-ruin", `${premiumSceneryRoot}/trail-ruin.png`);
      this.load.image("seedwake-premium-seed-lantern", `${premiumSceneryRoot}/seed-lantern.png`);
    }
    if (this.model.section.chapter?.id === "river-gardens") {
      const premiumSceneryRoot = `${PIXEL_ASSET_ROOT}/river-gardens/scenery-premium`;
      this.load.image("river-premium-waterwheel", `${premiumSceneryRoot}/waterwheel-weir.png`);
      this.load.image("river-premium-lily-ferry", `${premiumSceneryRoot}/lily-ferry.png`);
      this.load.image("river-premium-sluice-gate", `${premiumSceneryRoot}/sluice-gate.png`);
      this.load.image("river-premium-canal-map", `${premiumSceneryRoot}/canal-map.png`);
      this.load.image("river-premium-garden-arch", `${premiumSceneryRoot}/garden-arch.png`);
      this.load.image("river-premium-willow", `${premiumSceneryRoot}/willow-bank.png`);
    }
    if (this.model.section.chapter?.id === "fossil-canyon") {
      const premiumSceneryRoot = `${PIXEL_ASSET_ROOT}/fossil-canyon/scenery-premium`;
      const premiumInteractionRoot = `${PIXEL_ASSET_ROOT}/fossil-canyon/interaction-premium`;
      this.load.image("fossil-premium-rib-arch", `${premiumSceneryRoot}/rib-arch.png`);
      this.load.image("fossil-premium-dig-camp", `${premiumSceneryRoot}/dig-camp.png`);
      this.load.image("fossil-premium-rope-bridge", `${premiumSceneryRoot}/rope-bridge.png`);
      this.load.image("fossil-premium-bone-signal", `${premiumSceneryRoot}/bone-signal.png`);
      this.load.image("fossil-premium-amber-outcrop", `${premiumSceneryRoot}/amber-outcrop.png`);
      this.load.image("fossil-premium-survey-station", `${premiumSceneryRoot}/survey-station.png`);
      this.load.image("fossil-premium-dig-basin", `${premiumSceneryRoot}/dig-basin.png`);
      this.load.image("fossil-premium-rune", `${premiumInteractionRoot}/fossil-rune.png`);
      this.load.image("fossil-premium-track-marker", `${premiumInteractionRoot}/track-marker.png`);
      this.load.image("fossil-premium-fitted-bone", `${premiumInteractionRoot}/fitted-bone.png`);
      this.load.image("fossil-premium-rescue-flag", `${premiumInteractionRoot}/rescue-flag.png`);
      this.load.image("fossil-premium-beacon", `${premiumInteractionRoot}/fossil-beacon.png`);
      this.load.image("fossil-premium-brush-station", `${premiumInteractionRoot}/brush-station.png`);
    }
    if (this.model.section.chapter?.id === "forge-settlement") {
      const premiumSceneryRoot = `${PIXEL_ASSET_ROOT}/forge-settlement/scenery-premium`;
      const premiumInteractionRoot = `${PIXEL_ASSET_ROOT}/forge-settlement/interaction-premium`;
      this.load.image("forge-premium-gearworks-gate", `${premiumSceneryRoot}/gearworks-gate.png`);
      this.load.image("forge-premium-ore-hopper", `${premiumSceneryRoot}/ore-hopper.png`);
      this.load.image("forge-premium-plate-foundry", `${premiumSceneryRoot}/plate-foundry.png`);
      this.load.image("forge-premium-night-train", `${premiumSceneryRoot}/night-train.png`);
      this.load.image("forge-premium-word-forge", `${premiumSceneryRoot}/word-forge.png`);
      this.load.image("forge-premium-workshop-market", `${premiumSceneryRoot}/workshop-market.png`);
      this.load.image("forge-premium-steam-pipes", `${premiumSceneryRoot}/steam-pipes.png`);
      this.load.image("forge-premium-tool-rack", `${premiumSceneryRoot}/tool-rack.png`);
      this.load.image("forge-premium-rail-signal", `${premiumSceneryRoot}/rail-signal.png`);
      this.load.image("forge-premium-ore-cart", `${premiumSceneryRoot}/ore-cart.png`);
      this.load.image("forge-premium-sorting-conveyor", `${premiumSceneryRoot}/sorting-conveyor.png`);
      this.load.image("forge-premium-ember-rivet", `${premiumSceneryRoot}/ember-rivet.png`);
      this.load.image("forge-premium-machine-gear", `${premiumInteractionRoot}/machine-gear.png`);
      this.load.image("forge-premium-ore-tray", `${premiumInteractionRoot}/ore-tray.png`);
      this.load.image("forge-premium-rune", `${premiumInteractionRoot}/forge-rune.png`);
      this.load.image("forge-premium-rail-trolley", `${premiumInteractionRoot}/rail-trolley.png`);
      this.load.image("forge-premium-word-plate", `${premiumInteractionRoot}/word-plate.png`);
      this.load.image("forge-premium-gear-socket", `${premiumInteractionRoot}/gear-socket.png`);
    }
    if (this.model.section.chapter?.id === "glass-marsh") {
      const premiumSceneryRoot = `${PIXEL_ASSET_ROOT}/glass-marsh/scenery-premium`;
      const premiumInteractionRoot = `${PIXEL_ASSET_ROOT}/glass-marsh/interaction-premium`;
      this.load.image("glass-premium-reedlight-landing", `${premiumSceneryRoot}/reedlight-landing.png`);
      this.load.image("glass-premium-ripple-pool", `${premiumSceneryRoot}/ripple-pool.png`);
      this.load.image("glass-premium-mica-steps", `${premiumSceneryRoot}/mica-steps.png`);
      this.load.image("glass-premium-glint-causeway", `${premiumSceneryRoot}/glint-causeway.png`);
      this.load.image("glass-premium-mirror-fen-beacon", `${premiumSceneryRoot}/mirror-fen-beacon.png`);
      this.load.image("glass-premium-workshop", `${premiumSceneryRoot}/glass-workshop.png`);
      this.load.image("glass-premium-reeds", `${premiumSceneryRoot}/glass-reeds.png`);
      this.load.image("glass-premium-lilies", `${premiumSceneryRoot}/crystal-lilies.png`);
      this.load.image("glass-premium-lantern", `${premiumSceneryRoot}/marsh-lantern.png`);
      this.load.image("glass-premium-mirror-pool", `${premiumSceneryRoot}/mirror-pool.png`);
      this.load.image("glass-premium-boardwalk", `${premiumSceneryRoot}/glass-boardwalk.png`);
      this.load.image("glass-premium-mirror-gem", `${premiumSceneryRoot}/mirror-gem.png`);
      this.load.image("glass-premium-tuned-reed", `${premiumInteractionRoot}/tuned-reed.png`);
      this.load.image("glass-premium-lily-step", `${premiumInteractionRoot}/lily-step.png`);
      this.load.image("glass-premium-marsh-fish-net", `${premiumInteractionRoot}/marsh-fish-net.png`);
      this.load.image("glass-premium-mirror-shard", `${premiumInteractionRoot}/mirror-shard.png`);
      this.load.image("glass-premium-fen-beacon", `${premiumInteractionRoot}/fen-beacon.png`);
      this.load.image("glass-premium-mirror-socket", `${premiumInteractionRoot}/mirror-socket.png`);
    }
    if (this.model.section.chapter?.id === "storm-coast") {
      const premiumSceneryRoot = `${PIXEL_ASSET_ROOT}/storm-coast/scenery-premium`;
      const premiumInteractionRoot = `${PIXEL_ASSET_ROOT}/storm-coast/interaction-premium`;
      this.load.image("storm-premium-galecliff-path", `${premiumSceneryRoot}/galecliff-path.png`);
      this.load.image("storm-premium-shellhaven", `${premiumSceneryRoot}/shellhaven.png`);
      this.load.image("storm-premium-signal-harbour", `${premiumSceneryRoot}/signal-harbour.png`);
      this.load.image("storm-premium-stormglass-cove", `${premiumSceneryRoot}/stormglass-cove.png`);
      this.load.image("storm-premium-thunder-lighthouse", `${premiumSceneryRoot}/thunder-lighthouse.png`);
      this.load.image("storm-premium-storm-shelter", `${premiumSceneryRoot}/storm-shelter.png`);
      this.load.image("storm-premium-black-cliff", `${premiumSceneryRoot}/black-cliff.png`);
      this.load.image("storm-premium-tide-pool", `${premiumSceneryRoot}/tide-pool.png`);
      this.load.image("storm-premium-buoy", `${premiumSceneryRoot}/storm-buoy.png`);
      this.load.image("storm-premium-boardwalk", `${premiumSceneryRoot}/harbour-boardwalk.png`);
      this.load.image("storm-premium-windbreak", `${premiumSceneryRoot}/sailcloth-windbreak.png`);
      this.load.image("storm-premium-lens-shard-pickup", `${premiumSceneryRoot}/lens-shard-pickup.png`);
      this.load.image("storm-premium-cliff-holds", `${premiumInteractionRoot}/cliff-holds.png`);
      this.load.image("storm-premium-harbour-crate", `${premiumInteractionRoot}/harbour-crate.png`);
      this.load.image("storm-premium-shelter-board", `${premiumInteractionRoot}/shelter-board.png`);
      this.load.image("storm-premium-lens-shard", `${premiumInteractionRoot}/storm-lens-shard.png`);
      this.load.image("storm-premium-fleet-flag", `${premiumInteractionRoot}/fleet-signal-flag.png`);
      this.load.image("storm-premium-lens-socket", `${premiumInteractionRoot}/lighthouse-lens-socket.png`);
    }
    if (this.model.section.chapter?.id === "lantern-forest") {
      const premiumSceneryRoot = `${PIXEL_ASSET_ROOT}/lantern-forest/scenery-premium`;
      const premiumInteractionRoot = `${PIXEL_ASSET_ROOT}/lantern-forest/interaction-premium`;
      this.load.image("lantern-premium-mothlight-gate", `${premiumSceneryRoot}/mothlight-gate.png`);
      this.load.image("lantern-premium-echo-roots", `${premiumSceneryRoot}/echo-roots.png`);
      this.load.image("lantern-premium-wispwood-turn", `${premiumSceneryRoot}/wispwood-turn.png`);
      this.load.image("lantern-premium-orbit-hollow", `${premiumSceneryRoot}/orbit-hollow.png`);
      this.load.image("lantern-premium-sleeping-observatory", `${premiumSceneryRoot}/sleeping-observatory.png`);
      this.load.image("lantern-premium-workshop", `${premiumSceneryRoot}/lantern-tree-workshop.png`);
      this.load.image("lantern-premium-tree", `${premiumSceneryRoot}/lantern-tree.png`);
      this.load.image("lantern-premium-roots", `${premiumSceneryRoot}/luminous-roots.png`);
      this.load.image("lantern-premium-moths", `${premiumSceneryRoot}/moth-cluster.png`);
      this.load.image("lantern-premium-root-bridge", `${premiumSceneryRoot}/root-footbridge.png`);
      this.load.image("lantern-premium-telescope-pedestal", `${premiumSceneryRoot}/telescope-pedestal.png`);
      this.load.image("lantern-premium-living-map-pickup", `${premiumSceneryRoot}/living-map-pickup.png`);
      this.load.image("lantern-premium-moth-roost", `${premiumInteractionRoot}/moth-roost.png`);
      this.load.image("lantern-premium-forest-lantern", `${premiumInteractionRoot}/forest-lantern.png`);
      this.load.image("lantern-premium-memory-marker", `${premiumInteractionRoot}/memory-path-marker.png`);
      this.load.image("lantern-premium-telescope-part", `${premiumInteractionRoot}/telescope-part.png`);
      this.load.image("lantern-premium-orbit-dial", `${premiumInteractionRoot}/observatory-orbit-dial.png`);
      this.load.image("lantern-premium-observatory-socket", `${premiumInteractionRoot}/observatory-alignment-socket.png`);
    }
    if (this.model.section.chapter?.id === "star-reach") {
      const premiumSceneryRoot = `${PIXEL_ASSET_ROOT}/star-reach/scenery-premium`;
      const premiumInteractionRoot = `${PIXEL_ASSET_ROOT}/star-reach/interaction-premium`;
      this.load.image("star-premium-comet-stair", `${premiumSceneryRoot}/comet-stair.png`);
      this.load.image("star-premium-aster-archive", `${premiumSceneryRoot}/aster-archive.png`);
      this.load.image("star-premium-dawn-causeway", `${premiumSceneryRoot}/dawn-causeway.png`);
      this.load.image("star-premium-reading-skybridge", `${premiumSceneryRoot}/reading-skybridge.png`);
      this.load.image("star-premium-first-reading-star", `${premiumSceneryRoot}/first-reading-star.png`);
      this.load.image("star-premium-workshop", `${premiumSceneryRoot}/star-road-workshop.png`);
      this.load.image("star-premium-floating-garden", `${premiumSceneryRoot}/floating-star-garden.png`);
      this.load.image("star-premium-constellation-rail", `${premiumSceneryRoot}/constellation-rail.png`);
      this.load.image("star-premium-skybridge-island", `${premiumSceneryRoot}/skybridge-island.png`);
      this.load.image("star-premium-comet-beacon", `${premiumSceneryRoot}/comet-beacon.png`);
      this.load.image("star-premium-dawn-crystals", `${premiumSceneryRoot}/dawn-crystals.png`);
      this.load.image("star-premium-reader-page-pickup", `${premiumSceneryRoot}/reader-page-pickup.png`);
      this.load.image("star-premium-route-node", `${premiumInteractionRoot}/constellation-route-node.png`);
      this.load.image("star-premium-sky-capsule", `${premiumInteractionRoot}/sky-courier-capsule.png`);
      this.load.image("star-premium-sorting-prism", `${premiumInteractionRoot}/star-sorting-prism.png`);
      this.load.image("star-premium-memory-page", `${premiumInteractionRoot}/memory-journey-page.png`);
      this.load.image("star-premium-reading-sigil", `${premiumInteractionRoot}/reading-sound-sigil.png`);
      this.load.image("star-premium-reading-star-socket", `${premiumInteractionRoot}/first-reading-star-socket.png`);
    }
    for (const key of activeResidents) {
      const frameSize = questPixelResidentFrameSize(key);
      this.load.spritesheet(key, questPixelResidentPath(key), { frameWidth: frameSize, frameHeight: frameSize });
      const idlePath = questPixelResidentIdlePath(key);
      if (idlePath) this.load.spritesheet(`${key}-idle-sheet`, idlePath, { frameWidth: frameSize, frameHeight: frameSize });
      const itemPath = questPixelResidentItemPath(key);
      if (itemPath) this.load.spritesheet(`${key}-item-sheet`, itemPath, { frameWidth: frameSize, frameHeight: frameSize });
      const jumpPath = questPixelResidentJumpPath(key);
      if (jumpPath) this.load.spritesheet(`${key}-jump-sheet`, jumpPath, { frameWidth: frameSize, frameHeight: frameSize });
    }
    if (!minimalStarReachLoad) {
      this.load.spritesheet("seedwake-flag", `${ASSET_ROOT}/animated/flag-green.png`, { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet("seedwake-flower", `${ASSET_ROOT}/animated/flower.png`, { frameWidth: 4, frameHeight: 8 });
      this.load.spritesheet("seedwake-ripple", `${ASSET_ROOT}/animated/water-ripples.png`, { frameWidth: 16, frameHeight: 16 });
      this.load.spritesheet("seedwake-leaf", `${ASSET_ROOT}/fx/leaf.png`, { frameWidth: 8, frameHeight: 7 });
      this.load.spritesheet("seedwake-frog", `${ASSET_ROOT}/animals/frog.png`, { frameWidth: 16, frameHeight: 16 });
      this.load.image("seedwake-reactive-grass", `${ASSET_ROOT}/props/reactive-grass.png`);
      this.load.image("seedwake-seed-1", `${ASSET_ROOT}/items/seed-1.png`);
      this.load.image("seedwake-seed-2", `${ASSET_ROOT}/items/seed-2.png`);
      this.load.image("seedwake-seed-3", `${ASSET_ROOT}/items/seed-3.png`);
      this.load.image("seedwake-fish", `${ASSET_ROOT}/items/fish.png`);
    }
    this.load.spritesheet("seedwake-spark", `${ASSET_ROOT}/fx/spark.png`, { frameWidth: 30, frameHeight: 35 });
    this.load.spritesheet("seedwake-cache-wood-burst", `${ASSET_ROOT}/fx/cache-wood-burst.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet("seedwake-cache-pot-burst", `${ASSET_ROOT}/fx/cache-pot-burst.png`, { frameWidth: 14, frameHeight: 14 });
    this.load.spritesheet("seedwake-grass-rustle", `${ASSET_ROOT}/fx/grass-rustle.png`, { frameWidth: 12, frameHeight: 13 });
    this.load.image("seedwake-cache-crate", `${ASSET_ROOT}/props/cache-crate.png`);
    this.load.image("seedwake-cache-pot", `${ASSET_ROOT}/props/cache-pot.png`);
    if (activeProfile.atmosphere === "rain") {
      this.load.image("quest-weather-rain", `${PIXEL_ASSET_ROOT}/weather/rain.png`);
      this.load.spritesheet("quest-weather-rain-floor", `${PIXEL_ASSET_ROOT}/weather/rain-on-floor.png`, { frameWidth: 8, frameHeight: 8 });
    }
    if (activeProfile.atmosphere === "water-mist") {
      this.load.image("quest-weather-cloud", `${PIXEL_ASSET_ROOT}/weather/cloud.png`);
    }
    if (activeProfile.atmosphere === "starfall") {
      this.load.spritesheet("quest-weather-snow", `${PIXEL_ASSET_ROOT}/weather/snow.png`, { frameWidth: 8, frameHeight: 8 });
    }
    const materialSound = questChapterMaterialSfxEntry(this.model.section.chapter?.id);
    warmQuestSfxEntries([
      ...Object.values(QUEST_FEEDBACK_SFX),
      ...Object.values(QUEST_ACTION_SFX),
      materialSound
    ]);
    if (world === "dino") {
      this.load.image("dino-field", `${PIXEL_ASSET_ROOT}/dino/tiles/field.png`);
      this.load.image("dino-desert", `${PIXEL_ASSET_ROOT}/dino/tiles/desert.png`);
      this.load.image("dino-relief", `${PIXEL_ASSET_ROOT}/dino/tiles/relief.png`);
      this.load.image("dino-camp", `${PIXEL_ASSET_ROOT}/dino/tiles/camp.png`);
      this.load.spritesheet("dino-quicksand", `${PIXEL_ASSET_ROOT}/dino/animated/quicksand.png`, { frameWidth: 32, frameHeight: 32 });
      this.load.image("dino-bone", `${PIXEL_ASSET_ROOT}/dino/items/bone.png`);
      this.load.image("dino-rock", `${PIXEL_ASSET_ROOT}/dino/items/rock.png`);
      this.load.image("dino-amber", `${PIXEL_ASSET_ROOT}/dino/items/amber.png`);
    }
    if (world === "moonwood") {
      this.load.image("moonwood-field", `${PIXEL_ASSET_ROOT}/moonwood/tiles/field.png`);
      if (!minimalStarReachLoad) {
        this.load.image("moonwood-ruins", `${PIXEL_ASSET_ROOT}/moonwood/tiles/ruins.png`);
        this.load.image("moonwood-elements", `${PIXEL_ASSET_ROOT}/moonwood/tiles/elements.png`);
        this.load.image("moonwood-fog", `${PIXEL_ASSET_ROOT}/moonwood/fx/fog.png`);
        this.load.image("moonwood-raylight", `${PIXEL_ASSET_ROOT}/moonwood/fx/raylight.png`);
        this.load.image("moonwood-gem-purple", `${PIXEL_ASSET_ROOT}/moonwood/items/gem-purple.png`);
        this.load.image("moonwood-gem-green", `${PIXEL_ASSET_ROOT}/moonwood/items/gem-green.png`);
        this.load.image("moonwood-gem-red", `${PIXEL_ASSET_ROOT}/moonwood/items/gem-red.png`);
      }
    }
  }

  createNeutralTexture(key) {
    if (!key || this.textures.exists(key)) return;
    const texture = this.textures.createCanvas(key, 32, 32);
    const ctx = texture?.getContext?.();
    if (!ctx) return;
    ctx.clearRect(0, 0, 32, 32);
    ctx.fillStyle = "#5c4d66";
    ctx.beginPath();
    ctx.arc(16, 17, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4e6bd";
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillStyle = "#d9b866";
    ctx.fillRect(13, 7, 6, 18);
    ctx.fillRect(7, 13, 18, 6);
    texture.refresh();
  }

  ensureAssetFallbackTextures() {
    this.createNeutralTexture("quest-neutral-placeholder");
    for (const key of this.failedTextureKeys) this.createNeutralTexture(key);
  }

  create() {
    try {
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
      this.ensureAssetFallbackTextures();
      this.physics.world.setBounds(0, 0, PIXEL_WORLD.width, PIXEL_WORLD.height);
      this.createPlayerTexture();
      this.createAnimations();
      this.createGround();
      if (!this.textures.exists("book-world-background")) {
        this.createWaterGarden();
        this.createScenery();
        this.createReactiveFoliage();
        this.createStopMapComposition();
        this.createEncounterEdgeDetails();
        this.createChapterSetPieces();
        this.createRestoredMoments();
        this.createRelicEffects();
      }
      this.createGate();
      this.createResidents();
      this.createDrops();
      this.createPlayer();
      this.createInput();
      this.applyModel(this.model, true);
      this.scale.on("resize", this.handleResize, this);
      this.handleResize({ width: this.scale.width, height: this.scale.height });
      this.bridge.onReady?.();
    } catch (error) {
      this.bridge.onError?.(error instanceof Error ? error.message : "Pixel scene creation failed");
      throw error;
    }
  }

  createAnimations() {
    for (const direction of PIXEL_BEASTIE_DIRECTIONS) {
      const row = PIXEL_BEASTIE_DIRECTIONS.indexOf(direction);
      this.anims.create({
        key: `beastie-${direction}`,
        frames: [0, 1, 2, 3].map(frame => ({ key: "pixel-beastie", frame: (row * PIXEL_BEASTIE_FRAMES_PER_DIRECTION) + frame })),
        frameRate: 9,
        repeat: -1
      });
      for (const [action, frames] of Object.entries(BEASTIE_ACTION_FRAMES)) {
        this.anims.create({
          key: `beastie-action-${action}-${direction}`,
          frames: frames.map(frame => ({ key: "pixel-beastie", frame: (row * PIXEL_BEASTIE_FRAMES_PER_DIRECTION) + frame })),
          frameRate: 11,
          repeat: 0
        });
      }
    }
    for (const key of chapterPixelProfile(this.model.section).residents) {
      if (this.failedAssetKeys.has(key) || !this.textures.exists(key)) continue;
      const idleSheet = `${key}-idle-sheet`;
      const idleTexture = !this.failedAssetKeys.has(idleSheet) && this.textures.exists(idleSheet) ? idleSheet : key;
      const itemSheet = `${key}-item-sheet`;
      const itemTexture = !this.failedAssetKeys.has(itemSheet) && this.textures.exists(itemSheet) ? itemSheet : idleTexture;
      const jumpSheet = `${key}-jump-sheet`;
      const jumpTexture = !this.failedAssetKeys.has(jumpSheet) && this.textures.exists(jumpSheet) ? jumpSheet : idleTexture;
      const workFrames = [
        { key: idleTexture, frame: 0, duration: 140 },
        { key: itemTexture, frame: 0, duration: 260 },
        { key: itemTexture, frame: 0, duration: 160 },
        { key: idleTexture, frame: 1, duration: 180 }
      ];
      const celebrationFrames = [0, 1, 2, 3, 2, 1, 0].map(frame => ({ key: jumpTexture, frame }));
      this.anims.create({
        key: `${key}-idle`,
        frames: [0, 1, 2, 3].map(frame => ({ key: idleTexture, frame })),
        frameRate: 4,
        repeat: -1
      });
      this.anims.create({
        key: `${key}-work-left`,
        frames: workFrames,
        frameRate: 6,
        repeat: -1,
        repeatDelay: 240
      });
      this.anims.create({
        key: `${key}-work-right`,
        frames: workFrames,
        frameRate: 6,
        repeat: -1,
        repeatDelay: 240
      });
      this.anims.create({
        key: `${key}-celebrate`,
        frames: celebrationFrames,
        frameRate: 10,
        repeat: 0
      });
      this.anims.create({
        key: `${key}-ceremony`,
        frames: [
          ...[0, 1, 2, 3].map(frame => ({ key: idleTexture, frame })),
          ...celebrationFrames
        ],
        frameRate: 8,
        repeat: -1,
        repeatDelay: 540
      });
    }
    if (this.textures.exists("seedwake-flag")) {
      this.anims.create({
        key: "seedwake-flag-wave",
        frames: this.anims.generateFrameNumbers("seedwake-flag", { start: 0, end: 3 }),
        frameRate: 7,
        repeat: -1
      });
    }
    if (this.textures.exists("seedwake-flower")) {
      this.anims.create({
        key: "seedwake-flower-bloom",
        frames: this.anims.generateFrameNumbers("seedwake-flower", { start: 0, end: 4 }),
        frameRate: 5,
        repeat: -1,
        yoyo: true,
        repeatDelay: 420
      });
    }
    if (this.textures.exists("seedwake-ripple")) {
      this.anims.create({
        key: "seedwake-ripple-idle",
        frames: this.anims.generateFrameNumbers("seedwake-ripple", { start: 0, end: 3 }),
        frameRate: 5,
        repeat: -1
      });
    }
    if (this.textures.exists("seedwake-frog")) {
      this.anims.create({
        key: "seedwake-frog-idle",
        frames: this.anims.generateFrameNumbers("seedwake-frog", { start: 0, end: 1 }),
        frameRate: 2,
        repeat: -1
      });
    }
    this.anims.create({
      key: "seedwake-spark-burst",
      frames: this.anims.generateFrameNumbers("seedwake-spark", { start: 0, end: 8 }),
      frameRate: 15,
      repeat: 0,
      hideOnComplete: true
    });
    if (this.textures.exists("quest-weather-rain-floor")) {
      this.anims.create({
        key: "quest-weather-rain-splash",
        frames: this.anims.generateFrameNumbers("quest-weather-rain-floor", { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (this.model.section.world === "dino") {
      this.anims.create({
        key: "dino-quicksand-idle",
        frames: this.anims.generateFrameNumbers("dino-quicksand", { start: 0, end: 7 }),
        frameRate: 9,
        repeat: -1
      });
    }
  }

  createPlayerTexture() {
    const canvas = createPixelBeastieSheet(this.model.creature);
    const texture = this.textures.addCanvas("pixel-beastie", canvas);
    for (let row = 0; row < PIXEL_BEASTIE_DIRECTIONS.length; row += 1) {
      for (let frame = 0; frame < PIXEL_BEASTIE_FRAMES_PER_DIRECTION; frame += 1) {
        const frameIndex = (row * PIXEL_BEASTIE_FRAMES_PER_DIRECTION) + frame;
        texture.add(frameIndex, 0, frame * PIXEL_BEASTIE_FRAME, row * PIXEL_BEASTIE_FRAME, PIXEL_BEASTIE_FRAME, PIXEL_BEASTIE_FRAME);
      }
    }
  }

  createGround() {
    if (this.textures.exists("book-world-background")) {
      this.add.image(0, 0, "book-world-background")
        .setOrigin(0)
        .setDisplaySize(PIXEL_WORLD.width, PIXEL_WORLD.height)
        .setDepth(-1000);
      return;
    }
    const canvas = createGroundCanvas(this, this.model.section);
    this.textures.addCanvas("seedwake-ground", canvas);
    this.add.image(0, 0, "seedwake-ground").setOrigin(0).setDepth(-1000);
  }

  createWaterGarden() {
    const world = this.model.section.world;
    const profile = chapterPixelProfile(this.model.section);
    const chapterId = this.model.section.chapter?.id;
    const pondSide = this.model.section.stopIndex % 2 === 0 ? -1 : 1;
    const pondX = pixelRouteX(555, this.model.section.stopIndex) + (pondSide * 104);
    this.navigationObstacles.push({ x: pondX, y: 550, radius: 40 });
    if (chapterId === "fossil-canyon") {
      const fossilHazards = [
        ["fossil-premium-dig-camp", 0.34],
        ["fossil-premium-rib-arch", 0.38],
        ["fossil-premium-bone-signal", 0.36],
        ["fossil-premium-amber-outcrop", 0.4],
        ["fossil-premium-survey-station", 0.35]
      ];
      const [hazardKey, hazardScale] = fossilHazards[(this.model.section.stopIndex - 1) % 5];
      addPixelShadow(this, pondX, 566, 54, 12);
      this.add.image(pondX, 570, hazardKey)
        .setOrigin(0.5, 1)
        .setScale(hazardScale)
        .setFlipX(this.model.section.stopIndex % 2 === 0)
        .setDepth(569);
      return;
    }
    if (chapterId === "forge-settlement") {
      const forgeHazards = [
        ["forge-premium-steam-pipes", 0.3],
        ["forge-premium-ore-cart", 0.3],
        ["forge-premium-tool-rack", 0.3],
        ["forge-premium-rail-signal", 0.28],
        ["forge-premium-sorting-conveyor", 0.31]
      ];
      const [hazardKey, hazardScale] = forgeHazards[(this.model.section.stopIndex - 1) % 5];
      addPixelShadow(this, pondX, 566, 45, 10);
      this.add.image(pondX, 570, hazardKey)
        .setOrigin(0.5, 1)
        .setScale(hazardScale)
        .setFlipX(this.model.section.stopIndex % 2 === 0)
        .setDepth(569);
      return;
    }
    if (chapterId === "glass-marsh") {
      const glassHazards = [
        ["glass-premium-reeds", 0.3],
        ["glass-premium-lilies", 0.32],
        ["glass-premium-lantern", 0.26],
        ["glass-premium-mirror-pool", 0.32],
        ["glass-premium-boardwalk", 0.32]
      ];
      const [hazardKey, hazardScale] = glassHazards[(this.model.section.stopIndex - 1) % 5];
      addPixelShadow(this, pondX, 568, 50, 11);
      this.add.image(pondX, 568, hazardKey)
        .setOrigin(0.5, 1)
        .setScale(hazardScale)
        .setFlipX(this.model.section.stopIndex % 2 === 0)
        .setDepth(559);
      return;
    }
    if (chapterId === "lantern-forest") {
      addPixelShadow(this, pondX, 568, 76, 14);
      this.add.image(pondX, 568, "lantern-premium-tree")
        .setOrigin(0.5, 1)
        .setScale(0.38)
        .setDepth(559);
      this.add.image(pondX - 64, 570, "lantern-premium-roots")
        .setOrigin(0.5, 1)
        .setScale(0.32)
        .setDepth(560);
      this.add.image(pondX + 54, 545, "lantern-premium-moths")
        .setScale(0.26)
        .setDepth(560);
      return;
    }
    if (chapterId === "star-reach") {
      addPixelShadow(this, pondX, 568, 82, 15);
      this.add.image(pondX, 568, "star-premium-floating-garden")
        .setOrigin(0.5, 1)
        .setScale(0.4)
        .setDepth(559);
      this.add.image(pondX + 58, 566, "star-premium-dawn-crystals")
        .setOrigin(0.5, 1)
        .setScale(0.27)
        .setDepth(560);
      return;
    }
    const pond = this.add.graphics().setDepth(530);
    const rows = chapterId === "river-gardens" ? [86, 116, 142, 142, 126, 96] : [68, 88, 104, 104, 96, 78];
    rows.forEach((rowWidth, index) => {
      const y = 520 + (index * 11);
      pond.fillStyle(world === "moonwood" ? 0x28365f : 0x244d57, 0.96);
      pond.fillRect(pondX - (rowWidth / 2), y, rowWidth, 12);
      if (index > 0 && index < rows.length - 1) {
        pond.fillStyle(world === "moonwood" ? 0x765a9c : 0x4b91a2, 0.98);
        pond.fillRect(pondX - (rowWidth / 2) + 5, y + 2, rowWidth - 10, 10);
      }
    });
    pond.fillStyle(world === "moonwood" ? 0xc7b4ec : 0x7bc0c0, 0.6);
    pond.fillRect(pondX - 34, 534, 52, 3);
    for (const [x, y] of [[pondX - 22, 548], [pondX + 24, 568], [pondX + 8, 538]]) {
      const ripple = this.add.sprite(x, y, "seedwake-ripple").play("seedwake-ripple-idle").setDepth(y);
      if (world === "moonwood") ripple.setTint(0xc6a9ef);
    }
    if (world === "meadow") {
      this.add.sprite(pondX + 36, 574, "seedwake-frog").play("seedwake-frog-idle").setDepth(575);
    } else {
      for (const y of [360, 710]) {
        this.add.image(pixelRouteX(y, this.model.section.stopIndex), y, "moonwood-fog")
          .setScale(0.72)
          .setAlpha(0.07)
          .setDepth(-850);
      }
      this.add.image(pondX - 92, 516, "moonwood-raylight").setScale(0.62).setAlpha(0.1).setDepth(-840);
    }
    if (!this.model.reducedMotion && profile.atmosphere === "water-mist") {
      this.tweens.add({ targets: pond, alpha: { from: 0.9, to: 1 }, duration: 1300, yoyo: true, repeat: -1 });
    }
  }

  createChapterSetPieces() {
    const profile = chapterPixelProfile(this.model.section);
    this.createChapterTerrain(profile);
    this.createChapterLandmark(profile);
    this.createChapterAtmosphere(profile);
  }

  createStopMapComposition() {
    const section = this.model.section;
    const map = stopPixelMap(section);
    const profile = chapterPixelProfile(section);
    const chapterId = section.chapter?.id;
    const palette = chapterId === "fossil-canyon"
      ? { outer: 0x623d31, inner: 0xa76947, highlight: 0xe0a66d, structure: 0x5a3b32 }
      : chapterId === "forge-settlement"
        ? { outer: 0x2f3038, inner: 0x5f4548, highlight: 0xd28555, structure: 0x252831 }
        : chapterId === "glass-marsh"
          ? { outer: 0x1c3e4b, inner: 0x456b73, highlight: 0xc8b9ed, structure: 0x252e55 }
        : chapterId === "storm-coast"
          ? { outer: 0x172936, inner: 0x355c68, highlight: 0x9fc9d3, structure: 0x1d2934 }
        : chapterId === "lantern-forest"
          ? { outer: 0x172f38, inner: 0x315963, highlight: 0xe0bd6c, structure: 0x202d46 }
        : chapterId === "star-reach"
          ? { outer: 0x24234e, inner: 0x5c548b, highlight: 0xf0ca82, structure: 0x302b62 }
          : { outer: 0x315443, inner: 0x5f8558, highlight: 0xc3d47c, structure: 0x3a493b };
    const ground = this.add.graphics().setDepth(-895);

    section.encounters.forEach((encounter, index) => {
      const point = pixelResidentPoint(section, encounter, index);
      if (chapterId === "forge-settlement" && index === 0 && map.authorship !== "route-authored") {
        const localStop = (section.stopIndex - 1) % 5;
        const landmarks = [
          ["forge-premium-gearworks-gate", 0.4],
          ["forge-premium-ore-hopper", 0.43],
          ["forge-premium-plate-foundry", 0.4],
          ["forge-premium-night-train", 0.39],
          ["forge-premium-word-forge", 0.38]
        ];
        const [landmarkKey, landmarkScale] = landmarks[localStop];
        const landmarkSide = localStop % 2 === 0 ? 1 : -1;
        const landmarkX = point.x + (landmarkSide * 154);
        this.add.image(landmarkX, point.y + 45, landmarkKey)
          .setOrigin(0.5, 1)
          .setScale(landmarkScale)
          .setFlipX(landmarkKey === "forge-premium-night-train" && landmarkSide < 0)
          .setDepth(point.y + 36);
      }
      if (chapterId === "glass-marsh" && index === 0 && map.authorship !== "route-authored") {
        const localStop = (section.stopIndex - 1) % 5;
        const landmarks = [
          ["glass-premium-reedlight-landing", 0.4],
          ["glass-premium-ripple-pool", 0.4],
          ["glass-premium-mica-steps", 0.37],
          ["glass-premium-glint-causeway", 0.38],
          ["glass-premium-mirror-fen-beacon", 0.35]
        ];
        const [landmarkKey, landmarkScale] = landmarks[localStop];
        const landmarkSide = localStop % 2 === 0 ? -1 : 1;
        this.add.image(point.x + (landmarkSide * 154), point.y + 44, landmarkKey)
          .setOrigin(0.5, 1)
          .setScale(landmarkScale)
          .setFlipX(landmarkKey === "glass-premium-glint-causeway" && landmarkSide > 0)
          .setDepth(point.y + 35);
      }
      if (chapterId === "storm-coast" && index === 0 && map.authorship !== "route-authored") {
        const localStop = (section.stopIndex - 1) % 5;
        const landmarks = [
          ["storm-premium-galecliff-path", 0.35],
          ["storm-premium-shellhaven", 0.36],
          ["storm-premium-signal-harbour", 0.36],
          ["storm-premium-stormglass-cove", 0.35],
          ["storm-premium-thunder-lighthouse", 0.34]
        ];
        const [landmarkKey, landmarkScale] = landmarks[localStop];
        const landmarkSide = localStop % 2 === 0 ? -1 : 1;
        this.add.image(point.x + (landmarkSide * 158), point.y + 49, landmarkKey)
          .setOrigin(0.5, 1)
          .setScale(landmarkScale)
          .setDepth(point.y + 38);
      }
      if (chapterId === "lantern-forest" && index === 0 && map.authorship !== "route-authored") {
        const localStop = (section.stopIndex - 1) % 5;
        const landmarks = [
          ["lantern-premium-mothlight-gate", 0.35],
          ["lantern-premium-echo-roots", 0.34],
          ["lantern-premium-wispwood-turn", 0.35],
          ["lantern-premium-orbit-hollow", 0.34],
          ["lantern-premium-sleeping-observatory", 0.34]
        ];
        const [landmarkKey, landmarkScale] = landmarks[localStop];
        const landmarkSide = localStop % 2 === 0 ? -1 : 1;
        this.add.image(point.x + (landmarkSide * 158), point.y + 49, landmarkKey)
          .setOrigin(0.5, 1)
          .setScale(landmarkScale)
          .setDepth(point.y + 38);
      }
      if (chapterId === "star-reach" && index === 0 && map.authorship !== "route-authored") {
        const localStop = (section.stopIndex - 1) % 5;
        const landmarks = [
          ["star-premium-comet-stair", 0.35],
          ["star-premium-aster-archive", 0.34],
          ["star-premium-dawn-causeway", 0.35],
          ["star-premium-reading-skybridge", 0.35],
          ["star-premium-first-reading-star", 0.34]
        ];
        const [landmarkKey, landmarkScale] = landmarks[localStop];
        const landmarkSide = localStop % 2 === 0 ? -1 : 1;
        this.add.image(point.x + (landmarkSide * 158), point.y + 49, landmarkKey)
          .setOrigin(0.5, 1)
          .setScale(landmarkScale)
          .setDepth(point.y + 38);
      }
      if (map.scene === "grove") {
        if (chapterId === "star-reach") {
          for (const side of [-1, 1]) {
            const key = side < 0 ? "star-premium-dawn-crystals" : "star-premium-floating-garden";
            this.add.image(point.x + (side * 72), point.y + 37, key)
              .setOrigin(0.5, 1)
              .setScale(key === "star-premium-dawn-crystals" ? 0.24 : 0.23)
              .setFlipX(side > 0)
              .setAlpha(0.8)
              .setDepth(point.y - 3);
          }
        } else if (chapterId === "lantern-forest") {
          for (const side of [-1, 1]) {
            const key = side < 0 ? "lantern-premium-moths" : "lantern-premium-roots";
            this.add.image(point.x + (side * 70), point.y + 36, key)
              .setOrigin(0.5, 1)
              .setScale(key === "lantern-premium-moths" ? 0.25 : 0.27)
              .setFlipX(side > 0)
              .setAlpha(0.78)
              .setDepth(point.y - 3);
          }
        } else if (chapterId === "storm-coast") {
          for (const side of [-1, 1]) {
            this.add.image(point.x + (side * 68), point.y + 38, side < 0 ? "storm-premium-buoy" : "storm-premium-windbreak")
              .setOrigin(0.5, 1)
              .setScale(side < 0 ? 0.2 : 0.25)
              .setFlipX(side > 0)
              .setAlpha(0.76)
              .setDepth(point.y - 3);
          }
        } else if (chapterId === "glass-marsh") {
          for (const side of [-1, 1]) {
            this.add.image(point.x + (side * 66), point.y + 34, "glass-premium-lilies")
              .setOrigin(0.5, 1)
              .setScale(0.22)
              .setFlipX(side > 0)
              .setAlpha(0.72)
              .setDepth(point.y - 3);
          }
        } else if (map.authorship === "route-authored") {
          ground.fillStyle(palette.outer, 0.18).fillEllipse(point.x, point.y + 10, 118, 68);
          ground.fillStyle(palette.inner, 0.2).fillEllipse(point.x, point.y + 8, 104, 56);
          for (let petal = 0; petal < 8; petal += 1) {
            const angle = (Math.PI * 2 * petal) / 8;
            ground.fillStyle(palette.highlight, 0.68).fillCircle(
              point.x + Math.cos(angle) * 54,
              point.y + 10 + Math.sin(angle) * 30,
              petal % 2 ? 2 : 3
            );
          }
        } else {
          const clearingKey = `quest-encounter-clearing-${section.stopId}-${index}`;
          this.textures.addCanvas(
            clearingKey,
            createEncounterClearingCanvas(this, section, palette, index)
          );
          this.add.image(point.x, point.y + 8, clearingKey).setDepth(-894);
          for (let petal = 0; petal < 6; petal += 1) {
            const angle = (Math.PI * 2 * petal) / 6;
            ground.fillStyle(palette.highlight, 0.74).fillRect(point.x + Math.cos(angle) * 50 - 2, point.y + 10 + Math.sin(angle) * 24 - 2, 4, 4);
          }
        }
      } else if (map.scene === "terraces") {
        if (chapterId === "fossil-canyon") {
          const clearingKey = `quest-encounter-clearing-${section.stopId}-${index}`;
          this.textures.addCanvas(
            clearingKey,
            createEncounterClearingCanvas(this, section, palette, index)
          );
          this.add.image(point.x, point.y + 8, clearingKey).setDepth(-894);
          for (const [offsetX, offsetY, width] of [[-52, 22, 14], [48, 28, 18], [-40, -25, 11], [54, -17, 13]]) {
            ground.fillStyle(palette.outer, 0.9).fillRoundedRect(point.x + offsetX - width / 2, point.y + offsetY, width, 7, 3);
            ground.fillStyle(palette.highlight, 0.62).fillRect(point.x + offsetX - width / 4, point.y + offsetY + 1, width / 2, 2);
          }
        } else if (chapterId === "forge-settlement") {
          const clearingKey = `quest-encounter-clearing-${section.stopId}-${index}`;
          this.textures.addCanvas(
            clearingKey,
            createEncounterClearingCanvas(this, section, palette, index)
          );
          this.add.image(point.x, point.y + 8, clearingKey).setDepth(-894);
          this.add.image(point.x + (index % 2 ? 58 : -58), point.y + 25, "forge-premium-ore-tray")
            .setOrigin(0.5, 1)
            .setScale(0.34)
            .setDepth(point.y - 2);
        } else if (chapterId === "glass-marsh") {
          this.add.image(point.x + (index % 2 ? 58 : -58), point.y + 31, "glass-premium-lilies")
            .setOrigin(0.5, 1)
            .setScale(0.31)
            .setDepth(point.y - 2);
        } else if (chapterId === "star-reach") {
          this.add.image(point.x + (index % 2 ? 62 : -62), point.y + 34, "star-premium-constellation-rail")
            .setOrigin(0.5, 1)
            .setScale(0.27)
            .setFlipX(index % 2 === 0)
            .setDepth(point.y - 2);
        } else if (chapterId === "lantern-forest") {
          this.add.image(point.x + (index % 2 ? 62 : -62), point.y + 33, "lantern-premium-roots")
            .setOrigin(0.5, 1)
            .setScale(0.29)
            .setFlipX(index % 2 === 0)
            .setDepth(point.y - 2);
        } else if (chapterId === "storm-coast") {
          this.add.image(point.x + (index % 2 ? 62 : -62), point.y + 34, "storm-premium-black-cliff")
            .setOrigin(0.5, 1)
            .setScale(0.25)
            .setFlipX(index % 2 === 0)
            .setDepth(point.y - 2);
        } else {
          for (let step = 0; step < 3; step += 1) {
            const width = 126 - step * 22;
            ground.fillStyle(palette.structure, 0.94).fillRect(point.x - width / 2, point.y + 20 + step * 9, width, 8);
            ground.fillStyle(palette.highlight, 0.58).fillRect(point.x - width / 2 + 4, point.y + 21 + step * 9, width - 8, 2);
          }
        }
      } else if (map.scene === "crossing") {
        for (const [offsetX, offsetY] of [[-58, -22], [58, -22], [-58, 25], [58, 25]]) {
          if (chapterId === "fossil-canyon") {
            const trackX = point.x + offsetX;
            const trackY = point.y + offsetY;
            ground.fillStyle(palette.outer, 0.88)
              .fillEllipse(trackX, trackY + 3, 8, 12)
              .fillCircle(trackX - 6, trackY - 4, 3)
              .fillCircle(trackX, trackY - 7, 3)
              .fillCircle(trackX + 6, trackY - 4, 3);
            ground.fillStyle(palette.highlight, 0.72).fillRect(trackX - 2, trackY, 4, 3);
          } else if (chapterId === "forge-settlement") {
            if (offsetY < 0) {
              this.add.image(point.x + offsetX, point.y + offsetY + 12, "forge-premium-ember-rivet")
                .setScale(0.16)
                .setAlpha(0.42)
                .setDepth(point.y - 4);
            }
          } else if (chapterId === "glass-marsh") {
            const key = offsetY < 0 ? "glass-premium-lily-step" : "glass-premium-mirror-pool";
            this.add.image(point.x + offsetX, point.y + offsetY + 10, key)
              .setScale(key === "glass-premium-lily-step" ? 0.36 : 0.25)
              .setAlpha(0.72)
              .setDepth(point.y - 4);
          } else if (chapterId === "star-reach") {
            const key = offsetY < 0 ? "star-premium-skybridge-island" : "star-premium-dawn-crystals";
            this.add.image(point.x + offsetX, point.y + offsetY + 12, key)
              .setScale(key === "star-premium-skybridge-island" ? 0.25 : 0.23)
              .setAlpha(0.8)
              .setDepth(point.y - 4);
          } else if (chapterId === "lantern-forest") {
            const key = offsetY < 0 ? "lantern-premium-root-bridge" : "lantern-premium-telescope-pedestal";
            this.add.image(point.x + offsetX, point.y + offsetY + 12, key)
              .setScale(key === "lantern-premium-root-bridge" ? 0.26 : 0.24)
              .setAlpha(0.78)
              .setDepth(point.y - 4);
          } else if (chapterId === "storm-coast") {
            const key = offsetY < 0 ? "storm-premium-boardwalk" : "storm-premium-tide-pool";
            this.add.image(point.x + offsetX, point.y + offsetY + 12, key)
              .setScale(key === "storm-premium-boardwalk" ? 0.28 : 0.24)
              .setAlpha(0.76)
              .setDepth(point.y - 4);
          } else {
            ground.fillStyle(palette.structure, 1).fillRoundedRect(point.x + offsetX - 8, point.y + offsetY - 6, 16, 12, 3);
            ground.fillStyle(palette.highlight, 0.68).fillRect(point.x + offsetX - 5, point.y + offsetY - 4, 8, 3);
          }
        }
      } else if (map.scene === "workyard") {
        if (chapterId === "fossil-canyon") {
          this.add.image(point.x, point.y + 28, "fossil-premium-dig-basin")
            .setOrigin(0.5)
            .setScale(0.52)
            .setDepth(-894);
        } else if (chapterId === "forge-settlement") {
          this.add.image(point.x, point.y + 21, "forge-premium-gear-socket")
            .setOrigin(0.5)
            .setScale(0.7)
            .setAlpha(0.84)
            .setDepth(-894);
        } else if (chapterId === "glass-marsh") {
          this.add.image(point.x + (index % 2 ? 62 : -62), point.y + 27, "glass-premium-lilies")
            .setOrigin(0.5, 1)
            .setScale(0.26)
            .setAlpha(0.78)
            .setDepth(point.y - 3);
        } else if (chapterId === "star-reach") {
          this.add.image(point.x + (index % 2 ? 64 : -64), point.y + 31, "star-premium-memory-page")
            .setOrigin(0.5, 1)
            .setScale(0.27)
            .setFlipX(index % 2 === 0)
            .setAlpha(0.84)
            .setDepth(point.y - 3);
        } else if (chapterId === "lantern-forest") {
          this.add.image(point.x + (index % 2 ? 64 : -64), point.y + 31, "lantern-premium-telescope-pedestal")
            .setOrigin(0.5, 1)
            .setScale(0.26)
            .setFlipX(index % 2 === 0)
            .setAlpha(0.82)
            .setDepth(point.y - 3);
        } else if (chapterId === "storm-coast") {
          this.add.image(point.x + (index % 2 ? 64 : -64), point.y + 31, "storm-premium-windbreak")
            .setOrigin(0.5, 1)
            .setScale(0.25)
            .setFlipX(index % 2 === 0)
            .setAlpha(0.8)
            .setDepth(point.y - 3);
        } else {
          ground.fillStyle(palette.outer, 0.88).fillRoundedRect(point.x - 68, point.y - 29, 136, 72, 6);
          for (let tile = 0; tile < 32; tile += 1) {
            const tileX = point.x - 60 + (tile % 8) * 15;
            const tileY = point.y - 21 + Math.floor(tile / 8) * 15;
            ground.fillStyle((tile + Math.floor(tile / 8)) % 2 ? palette.inner : palette.structure, 0.7).fillRect(tileX, tileY, 14, 14);
          }
          ground.lineStyle(3, palette.highlight, 0.6).strokeRoundedRect(point.x - 68, point.y - 29, 136, 72, 6);
        }
      } else if (chapterId === "glass-marsh") {
        this.add.image(point.x + (index % 2 ? 64 : -64), point.y + 26, "glass-premium-lilies")
          .setOrigin(0.5, 1)
          .setScale(0.25)
          .setAlpha(0.76)
          .setDepth(point.y - 3);
      } else if (chapterId === "star-reach") {
        this.add.image(point.x + (index % 2 ? 66 : -66), point.y + 30, "star-premium-comet-beacon")
          .setOrigin(0.5, 1)
          .setScale(0.22)
          .setFlipX(index % 2 === 0)
          .setDepth(point.y - 3);
      } else if (chapterId === "lantern-forest") {
        this.add.image(point.x + (index % 2 ? 66 : -66), point.y + 30, "lantern-premium-moths")
          .setOrigin(0.5, 1)
          .setScale(0.24)
          .setFlipX(index % 2 === 0)
          .setDepth(point.y - 3);
      } else if (chapterId === "storm-coast") {
        this.add.image(point.x + (index % 2 ? 66 : -66), point.y + 29, "storm-premium-buoy")
          .setOrigin(0.5, 1)
          .setScale(0.2)
          .setFlipX(index % 2 === 0)
          .setDepth(point.y - 3);
      } else {
        const clearingKey = `quest-encounter-clearing-${section.stopId}-${index}`;
        this.textures.addCanvas(
          clearingKey,
          createEncounterClearingCanvas(this, section, palette, index)
        );
        this.add.image(point.x, point.y + 8, clearingKey).setDepth(-894);
      }
    });

    // Authored maps already own their scenery hierarchy and terrain anchors.
    // Do not layer legacy scene templates back over their task-safe bays.
    if (map.sceneryAnchors.length) return;

    if (map.scene === "grove") {
      for (const [progress, side] of [[0.24, -1], [0.51, 1], [0.76, -1]]) {
        const y = 1060 - progress * 980;
        const x = pixelRouteX(y, section.stopIndex) + side * 132;
        const frame = Math.round((section.stopIndex * 7) + (progress * 100)) % 2 ? "round-tree-cluster" : "hollow-home";
        addPixelShadow(this, x, y + 4, 44, 10);
        if (chapterId === "forge-settlement") {
          const forgeKey = progress === 0.51 ? "forge-premium-night-train" : "forge-premium-workshop-market";
          this.add.image(x, y, forgeKey)
            .setOrigin(0.5, 1)
            .setScale(forgeKey === "forge-premium-night-train" ? 0.4 : 0.36)
            .setFlipX(side > 0)
            .setDepth(y);
        } else if (chapterId === "glass-marsh") {
          const glassKey = progress === 0.51 ? "glass-premium-workshop" : "glass-premium-reeds";
          this.add.image(x, y, glassKey)
            .setOrigin(0.5, 1)
            .setScale(glassKey === "glass-premium-workshop" ? 0.36 : 0.32)
            .setFlipX(side > 0)
            .setDepth(y);
        } else if (chapterId === "lantern-forest") {
          const lanternKey = progress === 0.51 ? "lantern-premium-workshop" : "lantern-premium-tree";
          this.add.image(x, y, lanternKey)
            .setOrigin(0.5, 1)
            .setScale(lanternKey === "lantern-premium-workshop" ? 0.32 : 0.34)
            .setFlipX(side > 0)
            .setDepth(y);
        } else if (chapterId === "star-reach") {
          const starKey = progress === 0.51 ? "star-premium-workshop" : "star-premium-floating-garden";
          this.add.image(x, y, starKey)
            .setOrigin(0.5, 1)
            .setScale(starKey === "star-premium-workshop" ? 0.32 : 0.3)
            .setFlipX(side > 0)
            .setDepth(y);
        } else if (chapterId === "storm-coast") {
          const stormKey = progress === 0.51 ? "storm-premium-storm-shelter" : "storm-premium-black-cliff";
          this.add.image(x, y, stormKey)
            .setOrigin(0.5, 1)
            .setScale(stormKey === "storm-premium-storm-shelter" ? 0.33 : 0.3)
            .setFlipX(side > 0)
            .setDepth(y);
        } else if (chapterId === "seedwake-meadow") {
          this.add.image(
            x,
            y,
            frame === "round-tree-cluster" ? "seedwake-premium-tree" : "seedwake-premium-blossom-tree"
          ).setOrigin(0.5, 1)
            .setScale(frame === "round-tree-cluster" ? 0.45 : 0.42)
            .setDepth(y);
        } else if (chapterId === "fossil-canyon") {
          this.add.image(
            x,
            y,
            frame === "round-tree-cluster" ? "fossil-premium-bone-signal" : "fossil-premium-survey-station"
          ).setOrigin(0.5, 1)
            .setScale(frame === "round-tree-cluster" ? 0.38 : 0.34)
            .setDepth(y);
        } else {
          this.add.image(x, y, "seedwake-village", frame)
            .setOrigin(0.5, 1)
            .setScale(frame === "round-tree-cluster" ? 0.9 : 1.04)
            .setTint(profile.sceneryTint)
            .setDepth(y);
        }
      }
    } else if (map.scene === "terraces") {
      const terraceProgress = chapterId === "glass-marsh" ? [0.34, 0.68] : [0.3, 0.52, 0.74];
      for (const progress of terraceProgress) {
        const y = 1060 - progress * 980;
        const center = pixelRouteX(y, section.stopIndex);
        if (chapterId === "forge-settlement") {
          for (const side of [-1, 1]) {
            const hopperX = center + side * 118;
            addPixelShadow(this, hopperX, y + 34, 50, 11);
            this.add.image(hopperX, y + 38, "forge-premium-ore-hopper")
              .setOrigin(0.5, 1)
              .setScale(0.32)
              .setFlipX(side > 0)
              .setDepth(y + 31);
          }
        } else if (chapterId === "fossil-canyon") {
          const shelfOffset = progress === 0.52 ? 116 : 102;
          for (const side of [-1, 1]) {
            const shelfX = center + side * shelfOffset;
            addPixelShadow(this, shelfX, y + 38, 66, 13);
            this.add.image(shelfX, y + 43, "fossil-premium-amber-outcrop")
              .setOrigin(0.5, 1)
              .setScale(side < 0 ? 0.5 : 0.44)
              .setFlipX((side < 0) === (progress > 0.5))
              .setDepth(y + 36);
          }
        } else if (chapterId === "glass-marsh") {
          for (const side of [-1, 1]) {
            const key = progress > 0.5 ? "glass-premium-mica-steps" : "glass-premium-lilies";
            const glassX = center + side * 118;
            addPixelShadow(this, glassX, y + 34, 46, 10);
            this.add.image(glassX, y + 38, key)
              .setOrigin(0.5, 1)
              .setScale(key === "glass-premium-mica-steps" ? 0.28 : 0.34)
              .setFlipX(side > 0)
              .setDepth(y + 31);
          }
        } else if (chapterId === "lantern-forest") {
          for (const side of [-1, 1]) {
            const key = progress > 0.5 ? "lantern-premium-roots" : "lantern-premium-telescope-pedestal";
            this.add.image(center + side * 120, y + 39, key)
              .setOrigin(0.5, 1)
              .setScale(key === "lantern-premium-roots" ? 0.3 : 0.27)
              .setFlipX(side > 0)
              .setDepth(y + 31);
          }
        } else if (chapterId === "star-reach") {
          for (const side of [-1, 1]) {
            const key = progress > 0.5 ? "star-premium-dawn-crystals" : "star-premium-constellation-rail";
            this.add.image(center + side * 120, y + 39, key)
              .setOrigin(0.5, 1)
              .setScale(key === "star-premium-dawn-crystals" ? 0.28 : 0.3)
              .setFlipX(side > 0)
              .setDepth(y + 31);
          }
        } else if (chapterId === "storm-coast") {
          for (const side of [-1, 1]) {
            const key = progress > 0.5 ? "storm-premium-black-cliff" : "storm-premium-tide-pool";
            this.add.image(center + side * 122, y + 40, key)
              .setOrigin(0.5, 1)
              .setScale(key === "storm-premium-black-cliff" ? 0.29 : 0.32)
              .setFlipX(side > 0)
              .setDepth(y + 31);
          }
        } else {
          ground.fillStyle(palette.structure, 1).fillRect(center - 156, y + 24, 116, 8).fillRect(center + 40, y + 24, 116, 8);
          ground.fillStyle(palette.highlight, 0.62).fillRect(center - 152, y + 25, 108, 3).fillRect(center + 44, y + 25, 108, 3);
        }
      }
    } else if (map.scene === "crossing") {
      const y = 532 + ((section.stopIndex % 3) - 1) * 46;
      const center = pixelRouteX(y, section.stopIndex);
      if (chapterId === "forge-settlement") {
        for (const [start, width] of [[0, Math.max(0, center - 70)], [center + 70, Math.max(0, PIXEL_WORLD.width - center - 70)]]) {
          ground.fillStyle(palette.outer, 0.95).fillRect(start, y - 16, width, 34);
          ground.fillStyle(palette.inner, 0.86).fillRect(start, y - 10, width, 22);
          ground.fillStyle(palette.highlight, 0.55).fillRect(start, y - 6, width, 3);
        }
        for (const side of [-1, 1]) {
          const foundryX = center + side * 142;
          this.add.image(foundryX, y + 34, "forge-premium-plate-foundry")
            .setOrigin(0.5, 1)
            .setScale(0.3)
            .setFlipX(side > 0)
            .setDepth(y + 28);
        }
      } else if (chapterId === "glass-marsh") {
        this.add.image(center, y + 13, "glass-premium-boardwalk")
          .setOrigin(0.5)
          .setScale(0.58)
          .setDepth(-894);
        for (const side of [-1, 1]) {
          this.add.image(center + side * 128, y + 30, "glass-premium-mirror-pool")
            .setOrigin(0.5)
            .setScale(0.5)
            .setDepth(-896);
        }
      } else if (chapterId === "lantern-forest") {
        this.add.image(center, y + 13, "lantern-premium-root-bridge")
          .setOrigin(0.5)
          .setScale(0.58)
          .setDepth(-894);
        for (const side of [-1, 1]) {
          this.add.image(center + side * 128, y + 31, "lantern-premium-roots")
            .setOrigin(0.5)
            .setScale(0.38)
            .setDepth(-896);
        }
      } else if (chapterId === "star-reach") {
        this.add.image(center, y + 13, "star-premium-reading-skybridge")
          .setOrigin(0.5)
          .setScale(0.42)
          .setDepth(-894);
        for (const side of [-1, 1]) {
          this.add.image(center + side * 130, y + 31, "star-premium-skybridge-island")
            .setOrigin(0.5)
            .setScale(0.3)
            .setFlipX(side > 0)
            .setDepth(-896);
        }
      } else if (chapterId === "storm-coast") {
        this.add.image(center, y + 13, "storm-premium-boardwalk")
          .setOrigin(0.5)
          .setScale(0.62)
          .setDepth(-894);
        for (const side of [-1, 1]) {
          this.add.image(center + side * 130, y + 31, "storm-premium-tide-pool")
            .setOrigin(0.5)
            .setScale(0.5)
            .setDepth(-896);
        }
      } else {
        ground.fillStyle(palette.outer, 0.95).fillRect(0, y - 20, PIXEL_WORLD.width, 42);
        ground.fillStyle(palette.inner, 0.86).fillRect(0, y - 13, PIXEL_WORLD.width, 27);
        ground.fillStyle(palette.highlight, 0.55).fillRect(0, y - 8, PIXEL_WORLD.width, 3);
        for (let x = center - 44; x <= center + 44; x += 11) {
          ground.fillStyle(palette.structure, 1).fillRect(x, y - 25, 9, 50);
          ground.fillStyle(0xb47d50, 0.94).fillRect(x + 2, y - 23, 5, 46);
        }
      }
    } else if (map.scene === "workyard") {
      const y = 540;
      const center = pixelRouteX(y, section.stopIndex);
      if (chapterId === "fossil-canyon") {
        this.add.image(center, y + 12, "fossil-premium-dig-basin")
          .setOrigin(0.5)
          .setScale(0.78)
          .setDepth(-894);
      } else if (chapterId === "forge-settlement") {
        this.add.image(center, y + 15, "forge-premium-gear-socket")
          .setOrigin(0.5)
          .setScale(1.5)
          .setAlpha(0.82)
          .setDepth(-894);
      } else if (chapterId === "glass-marsh") {
        this.add.image(center, y + 15, "glass-premium-mirror-socket")
          .setOrigin(0.5)
          .setScale(0.9)
          .setAlpha(0.84)
          .setDepth(-894);
      } else if (chapterId === "lantern-forest") {
        this.add.image(center, y + 16, "lantern-premium-observatory-socket")
          .setOrigin(0.5)
          .setScale(0.78)
          .setAlpha(0.86)
          .setDepth(-894);
      } else if (chapterId === "star-reach") {
        this.add.image(center, y + 16, "star-premium-memory-page")
          .setOrigin(0.5)
          .setScale(0.66)
          .setAlpha(0.88)
          .setDepth(-894);
        this.add.image(center + 138, y + 42, "star-premium-workshop")
          .setOrigin(0.5, 1)
          .setScale(0.3)
          .setDepth(y + 20);
      } else if (chapterId === "storm-coast") {
        this.add.image(center, y + 17, "storm-premium-storm-shelter")
          .setOrigin(0.5)
          .setScale(0.58)
          .setDepth(-894);
      } else {
        ground.fillStyle(palette.outer, 0.95).fillRoundedRect(center - 118, y - 82, 236, 164, 8);
        for (let row = 0; row < 10; row += 1) {
          for (let column = 0; column < 14; column += 1) {
            ground.fillStyle((row + column) % 2 ? palette.inner : palette.structure, 0.72)
              .fillRect(center - 105 + column * 15, y - 68 + row * 15, 14, 14);
          }
        }
        ground.lineStyle(3, palette.highlight, 0.58).strokeRoundedRect(center - 118, y - 82, 236, 164, 8);
      }
    } else if (chapterId === "glass-marsh") {
      const y = 244;
      const center = pixelRouteX(y, section.stopIndex);
      this.add.image(center, y + 8, "glass-premium-mirror-pool")
        .setScale(0.78)
        .setAlpha(0.86)
        .setDepth(-894);
      this.add.image(center + 132, y + 32, "glass-premium-mirror-fen-beacon")
        .setOrigin(0.5, 1)
        .setScale(0.33)
        .setDepth(y + 20);
    } else if (chapterId === "lantern-forest") {
      const y = 244;
      const center = pixelRouteX(y, section.stopIndex);
      this.add.image(center, y + 8, "lantern-premium-orbit-dial")
        .setScale(0.72)
        .setAlpha(0.92)
        .setDepth(-894);
      this.add.image(center + 138, y + 36, "lantern-premium-sleeping-observatory")
        .setOrigin(0.5, 1)
        .setScale(0.3)
        .setDepth(y + 20);
    } else if (chapterId === "star-reach") {
      const y = 244;
      const center = pixelRouteX(y, section.stopIndex);
      this.add.image(center, y + 8, "star-premium-reading-star-socket")
        .setScale(0.7)
        .setAlpha(0.92)
        .setDepth(-894);
      this.add.image(center + 138, y + 38, "star-premium-dawn-crystals")
        .setOrigin(0.5, 1)
        .setScale(0.28)
        .setDepth(y + 20);
    } else if (chapterId === "storm-coast") {
      const y = 244;
      const center = pixelRouteX(y, section.stopIndex);
      this.add.image(center, y + 8, "storm-premium-lens-socket")
        .setScale(0.7)
        .setAlpha(0.9)
        .setDepth(-894);
      this.add.image(center + 136, y + 36, "storm-premium-thunder-lighthouse")
        .setOrigin(0.5, 1)
        .setScale(0.29)
        .setDepth(y + 20);
    } else {
      const y = 244;
      const center = pixelRouteX(y, section.stopIndex);
      const plazaKey = `quest-arena-plaza-${section.stopId}`;
      this.textures.addCanvas(plazaKey, createArenaPlazaCanvas(this, section, palette));
      this.add.image(center, y, plazaKey).setDepth(-894);
    }
  }

  createEncounterEdgeDetails() {
    const section = this.model.section;
    const profile = chapterPixelProfile(section);
    const world = section.world;
    const premiumSeedwake = section.chapter?.id === "seedwake-meadow";
    const premiumForge = section.chapter?.id === "forge-settlement";
    const premiumGlass = section.chapter?.id === "glass-marsh";
    const premiumStorm = section.chapter?.id === "storm-coast";
    const premiumLantern = section.chapter?.id === "lantern-forest";
    const premiumStar = section.chapter?.id === "star-reach";
    const accent = section.chapter?.id === "river-gardens"
      ? 0x9fe3d0
      : section.chapter?.id === "forge-settlement"
        ? 0xe29b63
        : section.chapter?.id === "glass-marsh"
          ? 0xc9bbef
        : section.chapter?.id === "storm-coast"
          ? 0x9fc9d3
        : section.chapter?.id === "lantern-forest"
          ? 0xe6c873
        : section.chapter?.id === "star-reach"
          ? 0xd6baff
          : profile.sceneryTint;

    section.encounters.forEach((encounter, encounterIndex) => {
      const residentPoint = pixelResidentPoint(section, encounter, encounterIndex);
      const details = questPixelEdgeDetailPositions({
        x: residentPoint.x,
        y: residentPoint.y,
        encounterIndex,
        worldWidth: PIXEL_WORLD.width
      });
      details.forEach((point, detailIndex) => {
        if (premiumStorm && detailIndex > 0) return;
        if (premiumLantern && detailIndex > 0) return;
        if (premiumStar && detailIndex > 0) return;
        if (premiumGlass && detailIndex > 1) return;
        if (premiumForge) {
          const keys = [
            "forge-premium-steam-pipes",
            "forge-premium-tool-rack",
            "forge-premium-rail-signal",
            "forge-premium-ore-cart"
          ];
          const key = keys[(encounterIndex + detailIndex) % keys.length];
          const scale = key === "forge-premium-rail-signal"
            ? 0.24
            : key === "forge-premium-tool-rack"
              ? 0.23
              : 0.25;
          const forgeDetail = this.add.image(point.x, point.y, key)
            .setOrigin(0.5, 1)
            .setScale(scale)
            .setFlipX(point.side > 0)
            .setDepth(point.y);
          this.navigationObstacles.push({ x: point.x, y: point.y - 3, radius: point.band === "outer" ? 17 : 12 });
          if (!this.model.reducedMotion) {
            this.tweens.add({
              targets: forgeDetail,
              y: point.y - 1,
              duration: 1600 + (detailIndex * 130),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut"
            });
          }
          return;
        }
        if (premiumLantern) {
          const keys = [
            "lantern-premium-tree",
            "lantern-premium-roots",
            "lantern-premium-moths",
            "lantern-premium-telescope-pedestal"
          ];
          const key = keys[(encounterIndex + detailIndex) % keys.length];
          const detail = this.add.image(point.x, point.y, key)
            .setOrigin(0.5, key === "lantern-premium-moths" ? 0.72 : 1)
            .setScale(key === "lantern-premium-tree" ? 0.28 : key === "lantern-premium-telescope-pedestal" ? 0.24 : 0.27)
            .setFlipX(point.side > 0)
            .setDepth(point.y);
          if (["lantern-premium-tree", "lantern-premium-telescope-pedestal"].includes(key)) {
            this.navigationObstacles.push({ x: point.x, y: point.y - 3, radius: point.band === "outer" ? 15 : 11 });
          }
          if (!this.model.reducedMotion) {
            this.tweens.add({
              targets: detail,
              y: point.y - 1,
              alpha: { from: 0.84, to: 1 },
              duration: 1550 + (detailIndex * 150),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut"
            });
          }
          return;
        }
        if (premiumStar) {
          const keys = [
            "star-premium-floating-garden",
            "star-premium-dawn-crystals",
            "star-premium-comet-beacon",
            "star-premium-skybridge-island"
          ];
          const key = keys[(encounterIndex + detailIndex) % keys.length];
          const detail = this.add.image(point.x, point.y, key)
            .setOrigin(0.5, 1)
            .setScale(key === "star-premium-comet-beacon" ? 0.23 : key === "star-premium-dawn-crystals" ? 0.26 : 0.24)
            .setFlipX(point.side > 0)
            .setDepth(point.y);
          if (["star-premium-floating-garden", "star-premium-comet-beacon", "star-premium-skybridge-island"].includes(key)) {
            this.navigationObstacles.push({ x: point.x, y: point.y - 3, radius: point.band === "outer" ? 15 : 11 });
          }
          if (!this.model.reducedMotion) {
            this.tweens.add({
              targets: detail,
              y: point.y - 2,
              alpha: { from: 0.88, to: 1 },
              duration: 1500 + (detailIndex * 150),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut"
            });
          }
          return;
        }
        if (premiumStorm) {
          const keys = [
            "storm-premium-black-cliff",
            "storm-premium-tide-pool",
            "storm-premium-buoy",
            "storm-premium-windbreak"
          ];
          const key = keys[(encounterIndex + detailIndex) % keys.length];
          const scale = key === "storm-premium-buoy"
            ? 0.2
            : key === "storm-premium-black-cliff"
              ? 0.25
              : 0.28;
          const detail = this.add.image(point.x, point.y, key)
            .setOrigin(0.5, key === "storm-premium-tide-pool" ? 0.72 : 1)
            .setScale(scale)
            .setFlipX(point.side > 0)
            .setDepth(point.y);
          if (["storm-premium-black-cliff", "storm-premium-buoy", "storm-premium-windbreak"].includes(key)) {
            this.navigationObstacles.push({ x: point.x, y: point.y - 3, radius: point.band === "outer" ? 15 : 11 });
          }
          if (!this.model.reducedMotion) {
            this.tweens.add({
              targets: detail,
              y: point.y - 1,
              alpha: { from: 0.84, to: 1 },
              duration: 1450 + (detailIndex * 150),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut"
            });
          }
          return;
        }
        if (premiumGlass) {
          const keys = [
            "glass-premium-reeds",
            "glass-premium-lilies",
            "glass-premium-lantern",
            "glass-premium-mirror-pool"
          ];
          const key = keys[(encounterIndex + detailIndex) % keys.length];
          const scale = key === "glass-premium-lantern"
            ? 0.24
            : key === "glass-premium-reeds"
              ? 0.26
              : 0.3;
          const detail = this.add.image(point.x, point.y, key)
            .setOrigin(0.5, key === "glass-premium-mirror-pool" ? 0.7 : 1)
            .setScale(scale)
            .setFlipX(point.side > 0)
            .setDepth(point.y);
          if (["glass-premium-reeds", "glass-premium-lantern"].includes(key)) {
            this.navigationObstacles.push({ x: point.x, y: point.y - 3, radius: point.band === "outer" ? 15 : 11 });
          }
          if (!this.model.reducedMotion) {
            this.tweens.add({
              targets: detail,
              y: point.y - 1,
              alpha: { from: 0.84, to: 1 },
              duration: 1500 + (detailIndex * 140),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut"
            });
          }
          return;
        }
        if (world === "dino") {
          const rock = this.add.image(point.x, point.y, "seedwake-nature", "rock-cluster")
            .setOrigin(0.5, 1)
            .setScale(point.band === "outer" ? 0.38 : detailIndex % 2 ? 0.22 : 0.27)
            .setFlipX(point.side > 0)
            .setTint(profile.sceneryTint)
            .setDepth(point.y);
          this.add.image(point.x + (point.side * 17), point.y + 3, "seedwake-nature", "rock-cluster")
            .setOrigin(0.5, 1)
            .setScale(0.13)
            .setFlipX(point.side < 0)
            .setTint(accent)
            .setDepth(point.y + 1);
          if (!this.model.reducedMotion) {
            this.tweens.add({
              targets: rock,
              y: point.y - 1,
              duration: 1700 + (encounterIndex * 90),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut"
            });
          }
          return;
        }

        if (point.band === "outer") {
          const shrub = this.add.image(
            point.x,
            point.y,
            premiumSeedwake ? "seedwake-premium-shrub" : "seedwake-nature",
            premiumSeedwake ? undefined : "tree-round"
          )
            .setOrigin(0.5, 1)
            .setScale(premiumSeedwake ? 0.28 : world === "moonwood" ? 0.58 : 0.5)
            .setFlipX(point.side > 0)
            .setDepth(point.y);
          if (!premiumSeedwake) shrub.setTint(profile.sceneryTint);
          const flower = this.add.sprite(point.x + (point.side * 16), point.y + 1, "seedwake-flower")
            .setOrigin(0.5, 1)
            .setScale(1.75)
            .setTint(accent)
            .setDepth(point.y + 1);
          if (this.model.reducedMotion) flower.setFrame(2);
          else {
            flower.play("seedwake-flower-bloom");
            this.tweens.add({ targets: shrub, angle: { from: -1, to: 1 }, duration: 1800 + (detailIndex * 110), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          }
          return;
        }

        const grass = this.add.image(point.x, point.y, "seedwake-reactive-grass")
          .setOrigin(0.5, 0.88)
          .setScale(world === "moonwood" ? 0.96 : 0.86)
          .setFlipX(point.side > 0)
          .setTint(profile.sceneryTint)
          .setDepth(point.y);
        const flower = this.add.sprite(point.x + (point.side * 14), point.y + 1, "seedwake-flower")
          .setOrigin(0.5, 1)
          .setScale(world === "moonwood" ? 1.65 : 1.5)
          .setTint(accent)
          .setDepth(point.y + 1);
        if (this.model.reducedMotion) flower.setFrame(2);
        else {
          flower.play("seedwake-flower-bloom");
          this.tweens.add({
            targets: grass,
            angle: { from: -2, to: 2 },
            duration: 1300 + (detailIndex * 180),
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
      });
    });
  }

  createChapterTerrain(profile) {
    const stopIndex = this.model.section.stopIndex;
    const localStop = (stopIndex - 1) % 5;
    if (profile.landmark === "singing-weir") {
      const crossings = stopPixelMap(this.model.section).terrainAnchors.length
        ? stopPixelMap(this.model.section).terrainAnchors.map(progress => 1060 - (progress * 980))
        : [760, 332];
      for (const y of crossings) {
        const center = pixelRouteX(y, stopIndex);
        const water = this.add.graphics().setDepth(-910);
        water.fillStyle(0x183f50, 1).fillRect(0, y - 18, PIXEL_WORLD.width, 38);
        water.fillStyle(0x4d9eaa, 0.96).fillRect(0, y - 13, PIXEL_WORLD.width, 25);
        water.fillStyle(0x9bd5cf, 0.68).fillRect(0, y - 7, PIXEL_WORLD.width, 3);
        const bridge = this.add.graphics().setDepth(y - 1);
        for (let x = center - 43; x <= center + 43; x += 10) {
          bridge.fillStyle(0x4c352f, 1).fillRect(x - 1, y - 24, 9, 49);
          bridge.fillStyle(0xb57646, 1).fillRect(x, y - 22, 7, 45);
        }
      }
    }
    if (profile.landmark === "rib-camp") {
      const crossings = stopPixelMap(this.model.section).terrainAnchors
        .map(progress => 1060 - (progress * 980));
      crossings.forEach((y, index) => {
        const center = pixelRouteX(y, stopIndex);
        const ravine = this.add.graphics().setDepth(-910);
        ravine.fillStyle(0x3b2827, 0.98)
          .fillRect(0, y - 19, Math.max(0, center - 54), 38)
          .fillRect(center + 54, y - 19, Math.max(0, PIXEL_WORLD.width - center - 54), 38);
        ravine.fillStyle(0x7f4935, 0.94)
          .fillRect(0, y - 19, Math.max(0, center - 54), 4)
          .fillRect(center + 54, y - 19, Math.max(0, PIXEL_WORLD.width - center - 54), 4);
        ravine.fillStyle(0xd28b55, 0.5)
          .fillRect(0, y + 14, Math.max(0, center - 54), 3)
          .fillRect(center + 54, y + 14, Math.max(0, PIXEL_WORLD.width - center - 54), 3);
        this.add.image(center, y + 43, "fossil-premium-rope-bridge")
          .setOrigin(0.5, 1)
          .setScale(index % 2 ? 0.4 : 0.42)
          .setFlipX(index % 2 === 1)
          .setDepth(-889);
      });
    }
    if (profile.landmark === "word-forge") {
      const crossings = stopPixelMap(this.model.section).terrainAnchors.length
        ? stopPixelMap(this.model.section).terrainAnchors.map(progress => 1060 - (progress * 980))
        : [820, 260];
      for (const y of crossings) {
        const center = pixelRouteX(y, stopIndex);
        const rail = this.add.graphics().setDepth(-870);
        for (const [start, width] of [[0, Math.max(0, center - 72)], [center + 72, Math.max(0, PIXEL_WORLD.width - center - 72)]]) {
          rail.fillStyle(0x4b3c3d, 1).fillRect(start, y - 15, width, 30);
          rail.fillStyle(0x232630, 1).fillRect(start, y - 10, width, 4).fillRect(start, y + 7, width, 4);
          for (let x = start; x < start + width; x += 18) rail.fillStyle(0x79584a, 1).fillRect(x, y - 14, 5, 28);
        }
        rail.fillStyle(0xd18b57, 0.86).fillRect(center - 47, y - 1, 18, 3).fillRect(center + 29, y - 1, 18, 3);
      }
    }
    if (profile.landmark === "thunder-lighthouse") {
      const seaOnLeft = localStop % 2 === 0;
      const sea = this.add.graphics().setDepth(-930);
      const shoreline = [
        { x: 0, y: 0 }, { x: 174, y: 0 }, { x: 148, y: 192 }, { x: 177, y: 366 },
        { x: 143, y: 548 }, { x: 171, y: 748 }, { x: 151, y: PIXEL_WORLD.height }, { x: 0, y: PIXEL_WORLD.height }
      ];
      const seaPoints = seaOnLeft
        ? shoreline
        : shoreline.map(point => ({ x: PIXEL_WORLD.width - point.x, y: point.y })).reverse();
      sea.fillStyle(0x0c273a, 1).fillPoints(seaPoints, true);
      for (const [y, inset] of [[118, 28], [344, 51], [612, 34], [858, 58]]) {
        const waveX = seaOnLeft ? inset : PIXEL_WORLD.width - inset;
        sea.fillStyle(0x6aa0ae, 0.5).fillRoundedRect(waveX - (seaOnLeft ? 0 : 48), y, 48, 3, 1);
        sea.fillStyle(0xc3dbe0, 0.4).fillRoundedRect(waveX + (seaOnLeft ? 18 : -38), y + 6, 28, 2, 1);
      }
      const crossings = stopPixelMap(this.model.section).terrainAnchors
        .map(progress => 1060 - (progress * 980));
      crossings.forEach((y, index) => {
        const center = pixelRouteX(y, stopIndex);
        const wash = this.add.graphics().setDepth(-912);
        const start = seaOnLeft ? 0 : center + 54;
        const width = seaOnLeft ? Math.max(0, center - 54) : Math.max(0, PIXEL_WORLD.width - center - 54);
        wash.fillStyle(0x173d50, 0.94).fillRect(start, y - 16, width, 33);
        wash.fillStyle(0x5e97a6, 0.58).fillRect(start, y - 9, width, 18);
        wash.fillStyle(0xc2dce0, 0.46).fillRect(start, y - 4, width, 3);
        this.add.image(center, y + 27, "storm-premium-boardwalk")
          .setOrigin(0.5, 1)
          .setScale(index % 2 ? 0.42 : 0.45)
          .setFlipX(index % 2 === 1)
          .setDepth(-889);
      });
    }
    if (profile.landmark === "mirror-fen") {
      const crossings = stopPixelMap(this.model.section).terrainAnchors
        .map(progress => 1060 - (progress * 980));
      crossings.forEach((y, index) => {
        const center = pixelRouteX(y, stopIndex);
        const channel = this.add.graphics().setDepth(-910);
        channel.fillStyle(0x173b50, 0.96).fillRect(0, y - 18, PIXEL_WORLD.width, 36);
        channel.fillStyle(0x4f7f91, 0.58).fillRect(0, y - 11, PIXEL_WORLD.width, 22);
        channel.fillStyle(0xb7d9d6, 0.42).fillRect(0, y - 5, PIXEL_WORLD.width, 3);
        this.add.image(center, y + 31, "glass-premium-boardwalk")
          .setOrigin(0.5, 1)
          .setScale(index % 2 ? 0.46 : 0.48)
          .setFlipX(index % 2 === 1)
          .setDepth(-889);
      });
      this.model.section.encounters.forEach((encounter, index) => {
        const point = progressToPixel(encounter.progress, stopIndex, index % 2 ? 132 : -132);
        this.add.image(point.x, point.y + 13, "glass-premium-mirror-pool")
          .setScale(0.46)
          .setAlpha(0.82)
          .setDepth(-890);
        this.add.image(point.x + (index % 2 ? -64 : 64), point.y + 18, index % 2 ? "glass-premium-lilies" : "glass-premium-reeds")
          .setOrigin(0.5, 1)
          .setScale(index % 2 ? 0.3 : 0.25)
          .setDepth(point.y - 3);
      });
    }
    if (profile.landmark === "thunder-lighthouse") {
      this.model.section.encounters.forEach((encounter, index) => {
        const point = progressToPixel(encounter.progress, stopIndex, index % 2 ? 142 : -142);
        const terrainKey = index % 2 ? "storm-premium-black-cliff" : "storm-premium-tide-pool";
        this.add.image(point.x, point.y + 28, terrainKey)
          .setOrigin(0.5, 1)
          .setScale(terrainKey === "storm-premium-black-cliff" ? 0.28 : 0.46)
          .setFlipX(index % 2 === 0)
          .setDepth(point.y - 1);
      });
    }
    if (profile.landmark === "sleeping-observatory") {
      const crossings = stopPixelMap(this.model.section).terrainAnchors
        .map(progress => 1060 - (progress * 980));
      crossings.forEach((y, index) => {
        const center = pixelRouteX(y, stopIndex);
        const rootBed = this.add.graphics().setDepth(-912);
        rootBed.fillStyle(0x132638, 0.96).fillRect(0, y - 15, PIXEL_WORLD.width, 31);
        rootBed.fillStyle(0x335668, 0.72).fillRect(0, y - 8, PIXEL_WORLD.width, 17);
        rootBed.fillStyle(0xc8c36b, 0.28).fillRect(0, y - 3, PIXEL_WORLD.width, 3);
        this.add.image(center, y + 31, "lantern-premium-root-bridge")
          .setOrigin(0.5, 1)
          .setScale(index % 2 ? 0.43 : 0.46)
          .setFlipX(index % 2 === 1)
          .setDepth(-889);
      });
      this.model.section.encounters.forEach((encounter, index) => {
        const point = progressToPixel(encounter.progress, stopIndex, index % 2 ? 142 : -142);
        const terrainKey = index % 2 ? "lantern-premium-tree" : "lantern-premium-roots";
        this.add.image(point.x, point.y + 28, terrainKey)
          .setOrigin(0.5, 1)
          .setScale(terrainKey === "lantern-premium-tree" ? 0.31 : 0.38)
          .setFlipX(index % 2 === 0)
          .setDepth(point.y - 1);
      });
    }
    if (profile.landmark === "reading-star") {
      const voidMask = this.add.graphics().setDepth(-925);
      voidMask.fillStyle(0x11102f, 1).fillRect(0, 0, 118, PIXEL_WORLD.height).fillRect(522, 0, 118, PIXEL_WORLD.height);
      const railCrossings = stopPixelMap(this.model.section).terrainAnchors.length
        ? stopPixelMap(this.model.section).terrainAnchors.map(progress => 1060 - (progress * 980))
        : [190, 410, 650, 890];
      for (const y of railCrossings) {
        const center = pixelRouteX(y, stopIndex);
        this.add.image(center, y + 48, "star-premium-constellation-rail")
          .setOrigin(0.5, 1)
          .setScale(0.58)
          .setAlpha(0.68)
          .setDepth(-892);
      }
      this.model.section.encounters.forEach((encounter, index) => {
        const point = progressToPixel(encounter.progress, stopIndex, index % 2 ? 138 : -138);
        const islandKey = index % 2 ? "star-premium-skybridge-island" : "star-premium-floating-garden";
        this.add.image(point.x, point.y + 28, islandKey)
          .setOrigin(0.5, 1)
          .setScale(islandKey === "star-premium-skybridge-island" ? 0.5 : 0.48)
          .setFlipX(index % 2 === 0)
          .setAlpha(0.86)
          .setDepth(point.y - 2);
      });
    }
  }

  createChapterLandmark(profile) {
    const stopIndex = this.model.section.stopIndex;
    const localStop = (stopIndex - 1) % 5;
    const map = stopPixelMap(this.model.section);
    const progress = map.landmarkAnchor?.progress ?? (0.57 + ((localStop % 3) * 0.055));
    const lateral = map.landmarkAnchor?.lateral ?? ((localStop % 2 === 0 ? -1 : 1) * 154);
    const side = Math.sign(lateral) || 1;
    const point = progressToPixel(progress, stopIndex, lateral);
    addPixelShadow(this, point.x, point.y + 5, 58, 13);

    if (profile.landmark === "lantern-garden") {
      const landmarks = [
        ["seedwake-premium-hollow-tree", 0.54],
        ["seedwake-premium-ruin", 0.56],
        ["seedwake-premium-blossom-tree", 0.52],
        ["seedwake-premium-tree", 0.54],
        ["seedwake-premium-seed-lantern", 0.68]
      ];
      const [landmarkKey, landmarkScale] = landmarks[localStop];
      this.add.image(point.x, point.y, landmarkKey)
        .setOrigin(0.5, 1)
        .setScale(landmarkScale)
        .setDepth(point.y);
      const lanterns = this.add.graphics().setDepth(point.y + 2);
      for (const offset of [-34, 0, 34]) {
        lanterns.fillStyle(0x50352f, 1).fillRect(point.x + offset - 2, point.y - 21, 4, 20);
        lanterns.fillStyle(0xffdf72, 1).fillRect(point.x + offset - 5, point.y - 24, 10, 8);
      }
      return;
    }

    if (profile.landmark === "singing-weir") {
      const landmarks = [
        ["river-premium-willow", 0.52],
        ["river-premium-lily-ferry", 0.62],
        ["river-premium-canal-map", 0.55],
        ["river-premium-garden-arch", 0.54],
        ["river-premium-waterwheel", 0.52]
      ];
      const [landmarkKey, landmarkScale] = landmarks[localStop];
      this.add.image(point.x, point.y, landmarkKey)
        .setOrigin(0.5, 1)
        .setScale(landmarkScale)
        .setDepth(point.y + 1);
      return;
    }

    if (profile.landmark === "rib-camp") {
      const landmarks = [
        ["fossil-premium-amber-outcrop", 0.56],
        ["fossil-premium-survey-station", 0.5],
        ["fossil-premium-dig-camp", 0.52],
        ["fossil-premium-rope-bridge", 0.5],
        ["fossil-premium-bone-signal", 0.52]
      ];
      const [landmarkKey, landmarkScale] = landmarks[localStop];
      this.add.image(point.x, point.y, landmarkKey)
        .setOrigin(0.5, 1)
        .setScale(landmarkScale)
        .setDepth(point.y + 1);
      return;
    }

    if (profile.landmark === "word-forge") {
      const landmarks = [
        ["forge-premium-gearworks-gate", 0.5],
        ["forge-premium-ore-hopper", 0.55],
        ["forge-premium-plate-foundry", 0.5],
        ["forge-premium-night-train", 0.48],
        ["forge-premium-word-forge", 0.48]
      ];
      const [landmarkKey, landmarkScale] = landmarks[localStop];
      this.add.image(point.x, point.y, landmarkKey)
        .setOrigin(0.5, 1)
        .setScale(landmarkScale)
        .setFlipX(side > 0 && landmarkKey === "forge-premium-night-train")
        .setDepth(point.y);
      return;
    }

    if (profile.landmark === "mirror-fen") {
      const landmarks = [
        ["glass-premium-reedlight-landing", 0.5],
        ["glass-premium-ripple-pool", 0.48],
        ["glass-premium-mica-steps", 0.44],
        ["glass-premium-glint-causeway", 0.45],
        ["glass-premium-mirror-fen-beacon", 0.42]
      ];
      const [landmarkKey, landmarkScale] = landmarks[localStop];
      this.add.image(point.x, point.y, landmarkKey)
        .setOrigin(0.5, 1)
        .setScale(landmarkScale)
        .setFlipX(side > 0 && landmarkKey === "glass-premium-glint-causeway")
        .setDepth(point.y);
      return;
    }

    if (profile.landmark === "thunder-lighthouse") {
      const landmarks = [
        ["storm-premium-galecliff-path", 0.44],
        ["storm-premium-shellhaven", 0.43],
        ["storm-premium-signal-harbour", 0.43],
        ["storm-premium-stormglass-cove", 0.42],
        ["storm-premium-thunder-lighthouse", 0.4]
      ];
      const [landmarkKey, landmarkScale] = landmarks[localStop];
      this.add.image(point.x, point.y, landmarkKey)
        .setOrigin(0.5, 1)
        .setScale(landmarkScale)
        .setDepth(point.y);
      return;
    }

    if (profile.landmark === "sleeping-observatory") {
      const landmarks = [
        ["lantern-premium-mothlight-gate", 0.43],
        ["lantern-premium-echo-roots", 0.41],
        ["lantern-premium-wispwood-turn", 0.42],
        ["lantern-premium-orbit-hollow", 0.4],
        ["lantern-premium-sleeping-observatory", 0.4]
      ];
      const [landmarkKey, landmarkScale] = landmarks[localStop];
      this.add.image(point.x, point.y, landmarkKey)
        .setOrigin(0.5, 1)
        .setScale(landmarkScale)
        .setDepth(point.y);
      return;
    }

    if (profile.landmark === "reading-star") {
      const landmarks = [
        ["star-premium-comet-stair", 0.43],
        ["star-premium-aster-archive", 0.42],
        ["star-premium-dawn-causeway", 0.43],
        ["star-premium-reading-skybridge", 0.42],
        ["star-premium-first-reading-star", 0.42]
      ];
      const [landmarkKey, landmarkScale] = landmarks[localStop];
      this.add.image(point.x, point.y, landmarkKey)
        .setOrigin(0.5, 1)
        .setScale(landmarkScale)
        .setDepth(point.y);
      return;
    }

    const shrine = this.add.graphics().setDepth(point.y);
    shrine.fillStyle(0x4d486f, 1).fillRoundedRect(point.x - 46, point.y - 25, 92, 26, 5);
    shrine.fillStyle(0xa48ecb, 1).fillRect(point.x - 35, point.y - 31, 70, 7);
    const starPoints = [];
    for (let index = 0; index < 10; index += 1) {
      const angle = (-Math.PI / 2) + ((Math.PI * 2 * index) / 10);
      const radius = index % 2 === 0 ? 31 : 13;
      starPoints.push({ x: point.x + (Math.cos(angle) * radius), y: point.y - 70 + (Math.sin(angle) * radius) });
    }
    shrine.fillStyle(0xffe38d, 1).fillPoints(starPoints, true);
    shrine.fillStyle(0xfff6d2, 1).fillCircle(point.x - 7, point.y - 77, 6);
  }

  createChapterAtmosphere(profile) {
    if (this.model.reducedMotion) return;
    const stopIndex = this.model.section.stopIndex;
    const atmosphere = profile.atmosphere;
    const count = atmosphere === "rain" ? 24 : 12;
    for (let index = 0; index < count; index += 1) {
      const y = 70 + (index * (980 / count));
      const x = 34 + (seededValue((index * 73) + (stopIndex * 311)) * 572);
      let mote;
      if (atmosphere === "rain") {
        const landingX = x - 26;
        const landingY = y + 88;
        mote = this.add.image(x, y, "quest-weather-rain").setScale(index % 3 === 0 ? 2.4 : 1.8).setAlpha(0.58);
        this.tweens.add({ targets: mote, x: landingX, y: landingY, alpha: { from: 0.12, to: 0.68 }, duration: 780 + (index * 21), repeat: -1 });
        if (index % 3 === 0) {
          this.add.sprite(landingX, landingY + 2, "quest-weather-rain-floor")
            .setScale(1.5)
            .setAlpha(0.52)
            .play("quest-weather-rain-splash")
            .setDepth(landingY + 3);
        }
      } else if (atmosphere === "forge-sparks") {
        const landmarkY = 420 + ((index % 4) * 55);
        const landmarkX = pixelRouteX(landmarkY, stopIndex) + ((index % 2 ? 1 : -1) * 145);
        mote = this.add.sprite(landmarkX, landmarkY, "seedwake-spark", index % 9)
          .setScale(index % 3 === 0 ? 0.18 : 0.13)
          .setTint(index % 3 ? 0xff9c4a : 0xffdd73)
          .setAlpha(0.78);
        this.tweens.add({ targets: mote, x: landmarkX + ((index % 2 ? 1 : -1) * 13), y: landmarkY - 39, alpha: 0, duration: 850 + (index * 45), repeat: -1 });
      } else if (atmosphere === "starfall") {
        mote = this.add.sprite(x, y, "quest-weather-snow", index % 7)
          .setScale(index % 4 === 0 ? 1.5 : 1)
          .setTint(0xe3d3ff)
          .setAlpha(0.72)
          .setAngle(-28);
        this.tweens.add({ targets: mote, x: x - 58, y: y + 35, angle: 22, alpha: 0.08, duration: 1800 + (index * 80), repeat: -1 });
      } else if (atmosphere === "water-mist") {
        mote = this.add.image(x, y, "quest-weather-cloud")
          .setScale(index % 3 === 0 ? 0.38 : 0.28)
          .setTint(0xc6e5dd)
          .setAlpha(0.1);
        this.tweens.add({ targets: mote, x: x + (index % 2 ? 38 : -38), y: y - 12, alpha: { from: 0.06, to: 0.16 }, duration: 3600 + (index * 120), yoyo: true, repeat: -1 });
      } else if (["marsh-motes", "lantern-spores"].includes(atmosphere)) {
        const color = atmosphere === "lantern-spores" ? 0xe9d77f : 0xc6aeeb;
        mote = this.add.sprite(x, y, "seedwake-leaf", index % 9)
          .setScale(index % 3 === 0 ? 0.65 : 0.45)
          .setTint(color)
          .setAlpha(0.58);
        this.tweens.add({ targets: mote, x: x + (index % 2 ? 16 : -16), y: y - 24, alpha: { from: 0.18, to: 0.72 }, duration: 2100 + (index * 90), yoyo: true, repeat: -1 });
      } else {
        mote = this.add.sprite(x, y, "seedwake-leaf", index % 9).setAlpha(atmosphere === "dust" ? 0.43 : 0.72);
        if (atmosphere === "dust") mote.setTint(0xd58c58);
        this.tweens.add({ targets: mote, x: x + (index % 2 ? 24 : -24), y: y + 34, angle: index % 2 ? 100 : -100, duration: 2500 + (index * 90), repeat: -1 });
      }
      mote.setDepth(y + 18);
    }
  }

  createRestoredMoments() {
    const moments = this.model.section.restoredMoments || [];
    const world = this.model.section.world;
    const profile = chapterPixelProfile(this.model.section);
    const powered = Boolean(this.model.section.rewardBonuses?.repairAura || this.model.section.rewardBonuses?.worldLight);
    const encounterProgress = this.model.section.encounters.map(encounter => Number(encounter.progress) || 0);
    const occupiedResidentKeys = new Set(this.model.section.encounters.map(encounter => (
      questPixelResidentKey(this.model.section.chapter?.id, encounter.friend, world)
    )));
    const returningResidentKeys = new Set();
    moments.forEach((moment, index) => {
      const memoryPlacement = questRestoredMemoryPlacement(index);
      const candidates = [
        Number(moment.progress) || 0.16,
        0.14 + (index * 0.12),
        0.82 - (index * 0.1)
      ].map(progress => Math.max(0.1, Math.min(0.9, progress)));
      const safeProgress = candidates.find(progress => (
        encounterProgress.every(encounter => Math.abs(encounter - progress) >= 0.12)
      )) ?? candidates[0];
      const point = progressToPixel(safeProgress, this.model.section.stopIndex, memoryPlacement.landmarkLateral);
      addPixelShadow(this, point.x, point.y + 4, 36, 9);
      const glow = this.add.circle(point.x, point.y - 24, powered ? 29 : 22, powered ? 0xffe08a : 0x9fdcb0, powered ? 0.24 : 0.14)
        .setDepth(point.y - 2);
      let landmark;
      if (this.model.section.chapter?.id === "fossil-canyon") {
        landmark = this.add.image(
          point.x,
          point.y,
          index % 2 ? "fossil-premium-dig-camp" : "fossil-premium-survey-station"
        ).setOrigin(0.5, 1).setScale(index % 2 ? 0.34 : 0.32);
      } else if (this.model.section.chapter?.id === "forge-settlement") {
        const forgeMemoryKeys = [
          "forge-premium-tool-rack",
          "forge-premium-steam-pipes",
          "forge-premium-rail-signal",
          "forge-premium-ore-cart"
        ];
        const forgeMemoryKey = forgeMemoryKeys[index % forgeMemoryKeys.length];
        landmark = this.add.image(point.x, point.y, forgeMemoryKey)
          .setOrigin(0.5, 1)
          .setScale(forgeMemoryKey === "forge-premium-rail-signal" ? 0.27 : 0.3);
      } else if (this.model.section.chapter?.id === "glass-marsh") {
        const glassMemoryKeys = [
          "glass-premium-lantern",
          "glass-premium-lilies",
          "glass-premium-reeds",
          "glass-premium-workshop"
        ];
        const glassMemoryKey = glassMemoryKeys[index % glassMemoryKeys.length];
        landmark = this.add.image(point.x, point.y, glassMemoryKey)
          .setOrigin(0.5, 1)
          .setScale(glassMemoryKey === "glass-premium-workshop" ? 0.28 : 0.3);
      } else if (this.model.section.chapter?.id === "storm-coast") {
        const stormMemoryKeys = [
          "storm-premium-buoy",
          "storm-premium-windbreak",
          "storm-premium-boardwalk",
          "storm-premium-storm-shelter"
        ];
        const stormMemoryKey = stormMemoryKeys[index % stormMemoryKeys.length];
        landmark = this.add.image(point.x, point.y, stormMemoryKey)
          .setOrigin(0.5, 1)
          .setScale(stormMemoryKey === "storm-premium-storm-shelter" ? 0.28 : 0.3);
      } else if (this.model.section.chapter?.id === "lantern-forest") {
        const lanternMemoryKeys = [
          "lantern-premium-moths",
          "lantern-premium-roots",
          "lantern-premium-telescope-pedestal",
          "lantern-premium-workshop"
        ];
        const lanternMemoryKey = lanternMemoryKeys[index % lanternMemoryKeys.length];
        landmark = this.add.image(point.x, point.y, lanternMemoryKey)
          .setOrigin(0.5, 1)
          .setScale(lanternMemoryKey === "lantern-premium-workshop" ? 0.27 : 0.29);
      } else if (this.model.section.chapter?.id === "star-reach") {
        const starMemoryKeys = [
          "star-premium-floating-garden",
          "star-premium-constellation-rail",
          "star-premium-dawn-crystals",
          "star-premium-workshop"
        ];
        const starMemoryKey = starMemoryKeys[index % starMemoryKeys.length];
        landmark = this.add.image(point.x, point.y, starMemoryKey)
          .setOrigin(0.5, 1)
          .setScale(starMemoryKey === "star-premium-workshop" ? 0.28 : 0.3);
      } else if (world === "dino") {
        landmark = this.add.image(point.x, point.y, "dino-camp", "ridge-camp").setOrigin(0.5, 1).setScale(0.3);
      } else if (world === "moonwood") {
        landmark = this.add.image(point.x, point.y, "moonwood-ruins", "moon-ruin").setOrigin(0.5, 1).setScale(0.28);
      } else if (this.model.section.chapter?.id === "seedwake-meadow") {
        landmark = this.add.image(
          point.x,
          point.y,
          index % 2 ? "seedwake-premium-ruin" : "seedwake-premium-hollow-tree"
        ).setOrigin(0.5, 1).setScale(index % 2 ? 0.42 : 0.34);
      } else if (this.model.section.chapter?.id === "river-gardens") {
        landmark = this.add.image(
          point.x,
          point.y,
          index % 2 ? "river-premium-lily-ferry" : "river-premium-canal-map"
        ).setOrigin(0.5, 1).setScale(index % 2 ? 0.42 : 0.38);
      } else {
        landmark = this.add.image(point.x, point.y, "seedwake-village", index % 2 ? "meadow-home" : "hollow-home").setOrigin(0.5, 1).setScale(0.62);
      }
      if (!["forge-settlement", "glass-marsh", "storm-coast", "lantern-forest", "star-reach"].includes(this.model.section.chapter?.id)) {
        landmark.setTint(powered ? 0xffefb0 : profile.sceneryTint);
      }
      landmark.setDepth(point.y).setData("restoredStopId", moment.sourceStopId);
      const light = this.add.rectangle(point.x, point.y - 22, 7, 8, 0xffdf72, 1).setDepth(point.y + 2);
      const cameoKey = questPixelMemoryResidentKey(
        this.model.section.chapter?.id,
        moment.sourceStopId,
        world
      );
      if (!occupiedResidentKeys.has(cameoKey) && !returningResidentKeys.has(cameoKey)) {
        returningResidentKeys.add(cameoKey);
        const cameoPoint = progressToPixel(safeProgress, this.model.section.stopIndex, memoryPlacement.cameoLateral);
        const cameo = this.add.sprite(cameoPoint.x, point.y + 1, cameoKey)
          .setOrigin(0.5, 0.88)
          .setScale(questPixelResidentWorldScale(cameoKey, 0.9))
          .setDepth(point.y + 3)
          .play(`${cameoKey}-idle`);
        cameo.setData("memoryStopId", moment.sourceStopId);
        this.memoryCameos.push({
          sprite: cameo,
          key: cameoKey,
          stopId: moment.sourceStopId,
          story: moment.story,
          landmark,
          glow,
          light,
          greeted: false
        });
      }
      if (!this.model.reducedMotion) {
        this.tweens.add({ targets: [glow, light], alpha: { from: powered ? 0.28 : 0.14, to: powered ? 0.7 : 0.46 }, duration: 1100 + index * 130, yoyo: true, repeat: -1 });
      }
    });
  }

  createRelicEffects() {
    const bonuses = this.model.section.rewardBonuses || {};
    if (bonuses.pathGlow) {
      for (const progress of [0.2, 0.36, 0.52, 0.68, 0.84]) {
        const point = progressToPixel(progress, this.model.section.stopIndex, (Math.round(progress * 100) % 2 ? -1 : 1) * 44);
        const marker = this.add.circle(point.x, point.y, 3, 0xb9f2df, 0.82).setDepth(point.y - 1);
        if (!this.model.reducedMotion) this.tweens.add({ targets: marker, alpha: { from: 0.3, to: 1 }, duration: 780, yoyo: true, repeat: -1 });
      }
    }
    if (bonuses.worldLight) {
      this.add.rectangle(PIXEL_WORLD.width / 2, PIXEL_WORLD.height / 2, PIXEL_WORLD.width, PIXEL_WORLD.height, 0xffe9aa, 0.055)
        .setDepth(1500)
        .setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  createScenery() {
    const world = this.model.section.world;
    const profile = chapterPixelProfile(this.model.section);
    const premiumSeedwake = this.model.section.chapter?.id === "seedwake-meadow";
    const premiumRiver = this.model.section.chapter?.id === "river-gardens";
    const premiumFossil = this.model.section.chapter?.id === "fossil-canyon";
    const premiumForge = this.model.section.chapter?.id === "forge-settlement";
    const premiumGlass = this.model.section.chapter?.id === "glass-marsh";
    const premiumStorm = this.model.section.chapter?.id === "storm-coast";
    const premiumLantern = this.model.section.chapter?.id === "lantern-forest";
    const premiumStar = this.model.section.chapter?.id === "star-reach";
    if (!premiumStar) {
      const nature = this.textures.get("seedwake-nature");
      const village = this.textures.get("seedwake-village");
      addTextureFrame(nature, "tree-round", 0, 0, 32, 32);
      addTextureFrame(nature, "tree-pine", 32, 0, 32, 32);
      addTextureFrame(nature, "tree-dead", 64, 0, 32, 32);
      addTextureFrame(nature, "tree-lush", 96, 0, 32, 32);
      addTextureFrame(nature, "tree-pink", 224, 0, 32, 32);
      addTextureFrame(nature, "rock-cluster", 240, 144, 64, 48);
      addTextureFrame(village, "moss-arch", 0, 48, 32, 48);
      addTextureFrame(village, "hollow-home", 176, 4, 48, 48);
      addTextureFrame(village, "meadow-home", 176, 52, 48, 44);
      addTextureFrame(village, "hollow-stump", 112, 128, 48, 64);
      addTextureFrame(village, "round-tree-cluster", 0, 96, 64, 48);
    }
    if (world === "dino") {
      addTextureFrame(this.textures.get("dino-camp"), "ridge-camp", 0, 0, 176, 82);
      addTextureFrame(this.textures.get("dino-desert"), "bone-outpost", 208, 96, 104, 80);
    }
    if (world === "moonwood" && !premiumStar) {
      addTextureFrame(this.textures.get("moonwood-ruins"), "moon-ruin", 112, 48, 128, 112);
    }

    const stopIndex = this.model.section.stopIndex;
    const map = stopPixelMap(this.model.section);
    const encounterClearings = this.model.section.encounters.map(encounter => (
      progressToPixel(encounter.progress, stopIndex)
    ));
    if (map.sceneryAnchors.length) {
      for (const anchor of map.sceneryAnchors) {
        const point = progressToPixel(anchor.progress, stopIndex, anchor.lateral);
        const shrub = anchor.key === "seedwake-premium-shrub";
        const riverProp = anchor.key.startsWith("river-premium-");
        const fossilProp = anchor.key.startsWith("fossil-premium-");
        const forgeProp = anchor.key.startsWith("forge-premium-");
        const glassProp = anchor.key.startsWith("glass-premium-");
        const stormProp = anchor.key.startsWith("storm-premium-");
        const lanternProp = anchor.key.startsWith("lantern-premium-");
        const starProp = anchor.key.startsWith("star-premium-");
        const compactRiverProp = [
          "river-premium-canal-map",
          "river-premium-lily-ferry",
          "river-premium-sluice-gate"
        ].includes(anchor.key);
        const compactFossilProp = [
          "fossil-premium-amber-outcrop",
          "fossil-premium-bone-signal",
          "fossil-premium-survey-station"
        ].includes(anchor.key);
        const compactForgeProp = [
          "forge-premium-steam-pipes",
          "forge-premium-tool-rack",
          "forge-premium-rail-signal",
          "forge-premium-ore-cart"
        ].includes(anchor.key);
        const compactGlassProp = [
          "glass-premium-reeds",
          "glass-premium-lilies",
          "glass-premium-lantern",
          "glass-premium-mirror-pool",
          "glass-premium-boardwalk"
        ].includes(anchor.key);
        const compactStormProp = [
          "storm-premium-black-cliff",
          "storm-premium-tide-pool",
          "storm-premium-buoy",
          "storm-premium-boardwalk",
          "storm-premium-windbreak"
        ].includes(anchor.key);
        const compactLanternProp = [
          "lantern-premium-tree",
          "lantern-premium-roots",
          "lantern-premium-moths",
          "lantern-premium-root-bridge",
          "lantern-premium-telescope-pedestal"
        ].includes(anchor.key);
        const compactStarProp = [
          "star-premium-floating-garden",
          "star-premium-constellation-rail",
          "star-premium-skybridge-island",
          "star-premium-comet-beacon",
          "star-premium-dawn-crystals"
        ].includes(anchor.key);
        addPixelShadow(
          this,
          point.x,
          point.y + 1,
          shrub ? 22 : compactRiverProp ? 28 : riverProp ? 36 : compactFossilProp || compactForgeProp || compactGlassProp || compactStormProp || compactLanternProp || compactStarProp ? 30 : fossilProp || forgeProp || glassProp || stormProp || lanternProp || starProp ? 42 : 38,
          shrub ? 7 : compactRiverProp || compactFossilProp || compactForgeProp || compactGlassProp || compactStormProp || compactLanternProp || compactStarProp ? 8 : fossilProp || forgeProp || glassProp || stormProp || lanternProp || starProp ? 10 : 9
        );
        const scenery = this.add.image(point.x, point.y, anchor.key)
          .setOrigin(0.5, 1)
          .setScale(anchor.scale)
          .setFlipX(Boolean(anchor.flipX))
          .setDepth(point.y);
        scenery.setData("authoredStopScenery", true);
        if (!this.model.reducedMotion && anchor.motion === "steam") {
          this.tweens.add({
            targets: scenery,
            y: point.y - 2,
            alpha: { from: 0.86, to: 1 },
            duration: 1280,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        } else if (!this.model.reducedMotion && anchor.motion === "signal") {
          this.tweens.add({
            targets: scenery,
            alpha: { from: 0.76, to: 1 },
            duration: 720,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        } else if (!this.model.reducedMotion && anchor.motion === "glow") {
          this.tweens.add({
            targets: scenery,
            y: point.y - 1,
            alpha: { from: 0.78, to: 1 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        } else if (!this.model.reducedMotion && anchor.motion === "bob") {
          this.tweens.add({
            targets: scenery,
            y: point.y - 3,
            angle: { from: -1.5, to: 1.5 },
            duration: 1180,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        } else if (!this.model.reducedMotion && anchor.motion === "gale") {
          this.tweens.add({
            targets: scenery,
            angle: { from: -1, to: 1 },
            alpha: { from: 0.88, to: 1 },
            duration: 940,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        } else if (!this.model.reducedMotion && anchor.motion === "flutter") {
          this.tweens.add({
            targets: scenery,
            x: point.x + (anchor.flipX ? -3 : 3),
            y: point.y - 3,
            angle: { from: -2, to: 2 },
            duration: 820,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        } else if (!this.model.reducedMotion && anchor.motion === "float") {
          this.tweens.add({
            targets: scenery,
            y: point.y - 3,
            alpha: { from: 0.86, to: 1 },
            duration: 1420,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
        if (!anchor.passable) {
          this.navigationObstacles.push({
            x: point.x,
            y: point.y - 4,
            radius: shrub ? 11 : compactRiverProp ? 14 : riverProp ? 18 : compactFossilProp || compactForgeProp || compactGlassProp || compactStormProp || compactLanternProp || compactStarProp ? 15 : fossilProp || forgeProp || glassProp || stormProp || lanternProp || starProp ? 21 : 19
          });
        }
      }
      return;
    }
    const proceduralSceneryRows = map.sceneryAnchors.length
      ? []
      : Array.from({ length: 24 }, (_, index) => 42 + (index * 46))
          .filter(y => y < PIXEL_WORLD.height - 20);
    for (const y of proceduralSceneryRows) {
      const center = pixelRouteX(y, stopIndex);
      for (const side of [-1, 1]) {
        const noise = seededValue((y * 13) + (side * 117) + (stopIndex * 41));
        const x = center + (side * (92 + (noise * 76)));
        const blocksRoute = pixelRoutePathsX(y, stopIndex).some(routeX => (
          Math.abs(routeX - x) < profile.route.pathWidth + 34
        ));
        const blocksEncounter = encounterClearings.some(point => (
          Math.abs(point.y - y) < 132 && Math.abs(point.x - x) < 152
        ));
        if (blocksRoute || blocksEncounter) continue;
        const frame = profile.landmark === "fossil-canyon" || profile.landmark === "rib-camp"
          ? noise > 0.44 ? "rock-cluster" : "tree-dead"
          : profile.landmark === "word-forge"
            ? noise > 0.3 ? "rock-cluster" : "tree-dead"
            : profile.landmark === "thunder-lighthouse" || profile.landmark === "reading-star"
              ? noise > 0.52 ? "rock-cluster" : "tree-pine"
              : world === "moonwood"
                ? noise > 0.76 ? "tree-pink" : noise > 0.48 ? "tree-pine" : "tree-lush"
                : noise > 0.82 ? "tree-pine" : noise > 0.72 ? "tree-pink" : noise > 0.56 ? "tree-lush" : "tree-round";
        const premiumTree = premiumSeedwake && frame !== "rock-cluster";
        const premiumShrub = premiumTree && noise < 0.18;
        const premiumBlossom = premiumTree && !premiumShrub && ["tree-pink", "tree-pine"].includes(frame);
        const premiumRiverWillow = premiumRiver && frame !== "rock-cluster" && noise < 0.64;
        const premiumFossilSurvey = premiumFossil && noise < 0.16;
        const premiumFossilOutcrop = premiumFossil && !premiumFossilSurvey && noise > 0.42;
        const forgeSceneryKeys = [
          "forge-premium-steam-pipes",
          "forge-premium-tool-rack",
          "forge-premium-rail-signal",
          "forge-premium-ore-cart"
        ];
        const premiumForgeKey = premiumForge && noise >= 0.52
          ? forgeSceneryKeys[Math.floor(noise * 100) % forgeSceneryKeys.length]
          : null;
        const glassSceneryKeys = [
          "glass-premium-reeds",
          "glass-premium-lilies",
          "glass-premium-lantern",
          "glass-premium-mirror-pool"
        ];
        const premiumGlassKey = premiumGlass && noise >= 0.52
          ? glassSceneryKeys[Math.floor(noise * 100) % glassSceneryKeys.length]
          : null;
        const stormSceneryKeys = [
          "storm-premium-black-cliff",
          "storm-premium-tide-pool",
          "storm-premium-buoy",
          "storm-premium-windbreak"
        ];
        const premiumStormKey = premiumStorm && noise >= 0.74
          ? stormSceneryKeys[Math.floor(noise * 100) % stormSceneryKeys.length]
          : null;
        const lanternSceneryKeys = [
          "lantern-premium-tree",
          "lantern-premium-roots",
          "lantern-premium-moths",
          "lantern-premium-telescope-pedestal"
        ];
        const premiumLanternKey = premiumLantern && noise >= 0.7
          ? lanternSceneryKeys[Math.floor(noise * 100) % lanternSceneryKeys.length]
          : null;
        const starSceneryKeys = [
          "star-premium-floating-garden",
          "star-premium-dawn-crystals",
          "star-premium-comet-beacon",
          "star-premium-skybridge-island"
        ];
        const premiumStarKey = premiumStar && noise >= 0.72
          ? starSceneryKeys[Math.floor(noise * 100) % starSceneryKeys.length]
          : null;
        if (premiumForge && !premiumForgeKey) continue;
        if (premiumGlass && !premiumGlassKey) continue;
        if (premiumStorm && !premiumStormKey) continue;
        if (premiumLantern && !premiumLanternKey) continue;
        if (premiumStar && !premiumStarKey) continue;
        addPixelShadow(
          this,
          x,
          y + 1,
          premiumStarKey ? 31 : premiumLanternKey ? 31 : premiumStormKey ? 31 : premiumGlassKey ? 30 : premiumForgeKey ? 28 : premiumFossilSurvey ? 36 : premiumFossilOutcrop ? 34 : premiumRiverWillow ? 40 : premiumShrub ? 23 : premiumTree ? 38 : world === "dino" && frame === "rock-cluster" ? 34 : 22,
          premiumStarKey || premiumLanternKey || premiumStormKey || premiumGlassKey || premiumForgeKey || premiumFossilSurvey || premiumFossilOutcrop || premiumRiverWillow || premiumTree ? 9 : 7
        );
        const scenery = this.add.image(
          x,
          y,
          premiumStarKey
            ? premiumStarKey
            : premiumLanternKey
            ? premiumLanternKey
            : premiumStormKey
            ? premiumStormKey
            : premiumGlassKey
            ? premiumGlassKey
            : premiumForgeKey
            ? premiumForgeKey
            : premiumFossilSurvey
            ? "fossil-premium-survey-station"
            : premiumFossilOutcrop
              ? "fossil-premium-amber-outcrop"
              : premiumRiverWillow
            ? "river-premium-willow"
            : premiumTree
            ? premiumShrub
              ? "seedwake-premium-shrub"
              : premiumBlossom
                ? "seedwake-premium-blossom-tree"
                : "seedwake-premium-tree"
            : "seedwake-nature",
          premiumTree || premiumRiverWillow || premiumFossilSurvey || premiumFossilOutcrop || premiumForgeKey || premiumGlassKey || premiumStormKey || premiumLanternKey || premiumStarKey ? undefined : frame
        ).setOrigin(0.5, 1).setDepth(y);
        if (premiumStarKey) {
          scenery.setScale(premiumStarKey === "star-premium-comet-beacon" ? 0.22 : premiumStarKey === "star-premium-dawn-crystals" ? 0.25 : 0.24);
        } else if (premiumLanternKey) {
          scenery.setScale(premiumLanternKey === "lantern-premium-tree" ? 0.27 : premiumLanternKey === "lantern-premium-telescope-pedestal" ? 0.22 : 0.26);
        } else if (premiumStormKey) {
          scenery.setScale(premiumStormKey === "storm-premium-buoy" ? 0.2 : premiumStormKey === "storm-premium-black-cliff" ? 0.25 : 0.27);
        } else if (premiumGlassKey) {
          scenery.setScale(premiumGlassKey === "glass-premium-lantern" ? 0.22 : premiumGlassKey === "glass-premium-reeds" ? 0.25 : 0.28);
        } else if (premiumForgeKey) scenery.setScale(premiumForgeKey === "forge-premium-rail-signal" ? 0.22 : 0.25);
        else if (premiumFossilSurvey) scenery.setScale(0.26 + (noise * 0.05));
        else if (premiumFossilOutcrop) scenery.setScale(0.28 + (noise * 0.06));
        else if (premiumRiverWillow) scenery.setScale(0.3 + (noise * 0.07));
        else if (premiumShrub) scenery.setScale(0.28 + (noise * 0.08));
        else if (premiumTree) scenery.setScale((premiumBlossom ? 0.36 : 0.38) + (noise * 0.06));
        else if (frame === "rock-cluster") scenery.setScale(0.66);
        else if (world === "dino") scenery.setScale(1.05);
        if (!premiumTree && !premiumRiverWillow && !premiumFossilSurvey && !premiumFossilOutcrop && !premiumForgeKey && !premiumGlassKey && !premiumStormKey && !premiumLanternKey && !premiumStarKey) scenery.setTint(profile.sceneryTint);
        const stormObstacle = !premiumStormKey || ["storm-premium-black-cliff", "storm-premium-buoy", "storm-premium-windbreak"].includes(premiumStormKey);
        const lanternObstacle = !premiumLanternKey || ["lantern-premium-tree", "lantern-premium-telescope-pedestal"].includes(premiumLanternKey);
        const starObstacle = !premiumStarKey || ["star-premium-floating-garden", "star-premium-comet-beacon", "star-premium-skybridge-island"].includes(premiumStarKey);
        if (starObstacle && lanternObstacle && stormObstacle && (!premiumGlassKey || ["glass-premium-reeds", "glass-premium-lantern"].includes(premiumGlassKey))) {
          this.navigationObstacles.push({
            x,
            y: y - 4,
            radius: premiumStarKey ? 15 : premiumLanternKey ? 15 : premiumStormKey ? 15 : premiumGlassKey ? 14 : premiumForgeKey ? 14 : premiumFossilSurvey ? 18 : premiumFossilOutcrop ? 17 : premiumRiverWillow ? 21 : premiumShrub ? 12 : premiumTree ? 20 : frame === "rock-cluster" ? 17 : 12
          });
        }
        if (["lantern-garden", "singing-weir"].includes(profile.landmark) && noise > 0.35 && noise < 0.52) {
          const secondX = x + (side * 36);
          addPixelShadow(this, secondX, y + 16, 19, 6);
          this.add.image(
            secondX,
            y + 16,
            premiumSeedwake
              ? "seedwake-premium-shrub"
              : premiumRiver
                ? "river-premium-willow"
                : "seedwake-nature",
            premiumSeedwake || premiumRiver ? undefined : "tree-round"
          ).setOrigin(0.5, 1).setScale(premiumSeedwake ? 0.28 : premiumRiver ? 0.22 : 0.82).setDepth(y + 16);
          this.navigationObstacles.push({ x: secondX, y: y + 12, radius: 10 });
        }
      }
    }

    for (let index = 0; index < 20; index += 1) {
      if (premiumGlass || premiumStorm || premiumLantern || premiumStar) continue;
      const y = 100 + (index * 51);
      const center = pixelRouteX(y, stopIndex);
      const side = index % 2 === 0 ? -1 : 1;
      const x = center + (side * (70 + (seededValue(index * 97) * 34)));
      const color = world === "dino"
        ? index % 2 ? 0xa75f3b : 0xe1ad64
        : world === "moonwood"
          ? index % 3 === 0 ? 0x88d8cf : index % 3 === 1 ? 0xb79bea : 0xf1cf75
          : index % 3 === 0 ? 0xffe276 : index % 3 === 1 ? 0xf58c8b : 0xc9a8e8;
      const flower = this.add.rectangle(x, y, world === "meadow" ? 3 : 4, world === "moonwood" ? 6 : 3, color, 1).setDepth(y);
      if (!this.model.reducedMotion) {
        this.tweens.add({ targets: flower, y: y - 1, duration: 900 + (index * 17), yoyo: true, repeat: -1 });
      }
    }

    const landmarkProgress = 0.57 + ((((stopIndex - 1) % 5) % 3) * 0.055);
    const landmarkSide = (stopIndex - 1) % 5 % 2 === 0 ? -1 : 1;
    const clusterPoint = progressToPixel(Math.max(0.16, landmarkProgress - 0.13), stopIndex, -landmarkSide * 148);
    addPixelShadow(this, clusterPoint.x, clusterPoint.y + 3, 54, 12);
    if (profile.landmark === "fossil-canyon" || profile.landmark === "rib-camp") {
      this.add.image(clusterPoint.x, clusterPoint.y, "fossil-premium-rib-arch")
        .setOrigin(0.5, 1).setScale(0.48).setDepth(clusterPoint.y);
    } else if (profile.landmark === "word-forge") {
      this.add.image(clusterPoint.x, clusterPoint.y, "forge-premium-workshop-market")
        .setOrigin(0.5, 1).setScale(0.36).setDepth(clusterPoint.y);
    } else if (profile.landmark === "mirror-fen") {
      this.add.image(clusterPoint.x, clusterPoint.y, "glass-premium-workshop")
        .setOrigin(0.5, 1).setScale(0.36).setDepth(clusterPoint.y);
    } else if (profile.landmark === "thunder-lighthouse") {
      this.add.image(clusterPoint.x, clusterPoint.y, "storm-premium-storm-shelter")
        .setOrigin(0.5, 1).setScale(0.36).setDepth(clusterPoint.y);
    } else if (profile.landmark === "sleeping-observatory") {
      this.add.image(clusterPoint.x, clusterPoint.y, "lantern-premium-workshop")
        .setOrigin(0.5, 1).setScale(0.34).setDepth(clusterPoint.y);
    } else if (profile.landmark === "reading-star") {
      this.add.image(clusterPoint.x, clusterPoint.y, "star-premium-workshop")
        .setOrigin(0.5, 1).setScale(0.34).setDepth(clusterPoint.y);
    } else if (premiumSeedwake) {
      this.add.image(clusterPoint.x, clusterPoint.y, "seedwake-premium-tree")
        .setOrigin(0.5, 1).setScale(0.56).setDepth(clusterPoint.y);
    } else if (premiumRiver) {
      this.add.image(clusterPoint.x, clusterPoint.y, "river-premium-garden-arch")
        .setOrigin(0.5, 1).setScale(0.5).setDepth(clusterPoint.y);
    } else {
      const cluster = this.add.image(clusterPoint.x, clusterPoint.y, "seedwake-village", "round-tree-cluster")
        .setOrigin(0.5, 1).setScale(1.08).setDepth(clusterPoint.y);
      cluster.setTint(profile.sceneryTint);
    }
    this.navigationObstacles.push({ x: clusterPoint.x, y: clusterPoint.y - 5, radius: 23 });
  }

  createGate() {
    const theme = worldTheme(this.model.section.world);
    const profile = chapterPixelProfile(this.model.section);
    const gatePoint = progressToPixel(this.model.section.gate.progress, this.model.section.stopIndex);
    addPixelShadow(this, gatePoint.x, gatePoint.y + 2, 44, 10);
    if (this.model.section.chapter?.id === "river-gardens") {
      this.add.image(gatePoint.x, gatePoint.y + 5, "river-premium-sluice-gate")
        .setOrigin(0.5, 1)
        .setScale(0.5)
        .setDepth(gatePoint.y + 2);
    } else if (this.model.section.chapter?.id === "fossil-canyon") {
      this.add.image(gatePoint.x, gatePoint.y + 5, "fossil-premium-rib-arch")
        .setOrigin(0.5, 1)
        .setScale(0.46)
        .setDepth(gatePoint.y + 2);
    } else if (this.model.section.chapter?.id === "forge-settlement") {
      this.add.image(gatePoint.x, gatePoint.y + 6, "forge-premium-gearworks-gate")
        .setOrigin(0.5, 1)
        .setScale(0.42)
        .setDepth(gatePoint.y + 2);
    } else if (this.model.section.chapter?.id === "glass-marsh") {
      this.add.image(gatePoint.x, gatePoint.y + 7, "glass-premium-mirror-fen-beacon")
        .setOrigin(0.5, 1)
        .setScale(0.38)
        .setDepth(gatePoint.y + 2);
    } else if (this.model.section.chapter?.id === "storm-coast") {
      this.add.image(gatePoint.x, gatePoint.y + 7, "storm-premium-thunder-lighthouse")
        .setOrigin(0.5, 1)
        .setScale(0.34)
        .setDepth(gatePoint.y + 2);
    } else if (this.model.section.chapter?.id === "lantern-forest") {
      const finalStop = (this.model.section.stopIndex - 1) % 5 === 4;
      this.add.image(
        gatePoint.x,
        gatePoint.y + 7,
        finalStop ? "lantern-premium-sleeping-observatory" : "lantern-premium-mothlight-gate"
      )
        .setOrigin(0.5, 1)
        .setScale(finalStop ? 0.34 : 0.39)
        .setDepth(gatePoint.y + 2);
    } else if (this.model.section.chapter?.id === "star-reach") {
      const finalStop = (this.model.section.stopIndex - 1) % 5 === 4;
      this.add.image(
        gatePoint.x,
        gatePoint.y + 7,
        finalStop ? "star-premium-first-reading-star" : "star-premium-comet-stair"
      )
        .setOrigin(0.5, 1)
        .setScale(finalStop ? 0.36 : 0.4)
        .setDepth(gatePoint.y + 2);
    } else {
      this.add.image(gatePoint.x, gatePoint.y + 3, "seedwake-village", "moss-arch")
        .setOrigin(0.5, 1)
        .setScale(1.35)
        .setTint(profile.gateTint || theme.gateTint)
        .setDepth(gatePoint.y + 2);
    }
    if (this.model.section.chapter?.id === "seedwake-meadow") {
      this.add.image(gatePoint.x - 42, gatePoint.y + 4, "seedwake-premium-seed-lantern")
        .setOrigin(0.5, 1).setScale(0.42).setDepth(gatePoint.y + 1);
      this.add.image(gatePoint.x + 42, gatePoint.y + 4, "seedwake-premium-seed-lantern")
        .setOrigin(0.5, 1).setScale(0.42).setFlipX(true).setDepth(gatePoint.y + 1);
    }
    const glassGate = this.model.section.chapter?.id === "glass-marsh";
    const stormGate = this.model.section.chapter?.id === "storm-coast";
    const lanternGate = this.model.section.chapter?.id === "lantern-forest";
    const starGate = this.model.section.chapter?.id === "star-reach";
    this.gateBarrier = this.add.rectangle(gatePoint.x, gatePoint.y - 7, 22, 6, glassGate ? 0xa99bd7 : stormGate ? 0x68a8b7 : lanternGate ? 0xd1b467 : starGate ? 0xc3a3ef : 0x9d653f, 0.96)
      .setStrokeStyle(2, glassGate ? 0x29315c : stormGate ? 0x172b3a : lanternGate ? 0x182b3b : starGate ? 0x201d48 : 0x3c3132, 1)
      .setDepth(gatePoint.y + 3);
    this.gateGlow = this.add.rectangle(gatePoint.x, gatePoint.y - 8, 30, 13, 0xf2d369, 0).setDepth(gatePoint.y + 1);
    if (glassGate) {
      this.add.image(gatePoint.x - 38, gatePoint.y - 4, "glass-premium-lantern")
        .setOrigin(0.5, 1).setScale(0.22).setDepth(gatePoint.y + 4);
      this.add.image(gatePoint.x + 38, gatePoint.y - 4, "glass-premium-lantern")
        .setOrigin(0.5, 1).setScale(0.22).setFlipX(true).setDepth(gatePoint.y + 4);
    } else if (stormGate) {
      this.add.image(gatePoint.x - 38, gatePoint.y - 3, "storm-premium-buoy")
        .setOrigin(0.5, 1).setScale(0.19).setDepth(gatePoint.y + 4);
      this.add.image(gatePoint.x + 38, gatePoint.y - 3, "storm-premium-buoy")
        .setOrigin(0.5, 1).setScale(0.19).setFlipX(true).setDepth(gatePoint.y + 4);
    } else if (lanternGate) {
      this.add.image(gatePoint.x - 39, gatePoint.y - 3, "lantern-premium-forest-lantern")
        .setOrigin(0.5, 1).setScale(0.22).setDepth(gatePoint.y + 4);
      this.add.image(gatePoint.x + 39, gatePoint.y - 3, "lantern-premium-forest-lantern")
        .setOrigin(0.5, 1).setScale(0.22).setFlipX(true).setDepth(gatePoint.y + 4);
    } else if (starGate) {
      this.add.image(gatePoint.x - 39, gatePoint.y - 3, "star-premium-comet-beacon")
        .setOrigin(0.5, 1).setScale(0.2).setDepth(gatePoint.y + 4);
      this.add.image(gatePoint.x + 39, gatePoint.y - 3, "star-premium-comet-beacon")
        .setOrigin(0.5, 1).setScale(0.2).setFlipX(true).setDepth(gatePoint.y + 4);
    } else {
      this.add.sprite(gatePoint.x - 29, gatePoint.y - 23, "seedwake-flag").play("seedwake-flag-wave").setDepth(gatePoint.y + 4);
      this.add.sprite(gatePoint.x + 29, gatePoint.y - 23, "seedwake-flag").setFlipX(true).play("seedwake-flag-wave").setDepth(gatePoint.y + 4);
    }
    this.gatePoint = gatePoint;
  }

  createReactiveFoliage() {
    const profile = chapterPixelProfile(this.model.section);
    const authoredMap = stopPixelMap(this.model.section).authorship === "route-authored";
    const fossilCanyon = this.model.section.chapter?.id === "fossil-canyon";
    const forgeSettlement = this.model.section.chapter?.id === "forge-settlement";
    const glassMarsh = this.model.section.chapter?.id === "glass-marsh";
    const stormCoast = this.model.section.chapter?.id === "storm-coast";
    const lanternForest = this.model.section.chapter?.id === "lantern-forest";
    const starReach = this.model.section.chapter?.id === "star-reach";
    const forgeKeys = ["forge-premium-steam-pipes", "forge-premium-rail-signal", "forge-premium-ore-cart"];
    for (let index = 0; index < 12; index += 1) {
      if (authoredMap || fossilCanyon) continue;
      const progress = 0.14 + (index * 0.063);
      const side = index % 2 === 0 ? -1 : 1;
      const point = progressToPixel(progress, this.model.section.stopIndex, side * (78 + (index % 3) * 9));
      if (stormCoast && index % 3 !== 0) continue;
      if (lanternForest && index % 2 !== 0) continue;
      if (starReach && index % 3 !== 0) continue;
      if (forgeSettlement) {
        const key = forgeKeys[index % forgeKeys.length];
        const prop = this.add.image(point.x, point.y, key)
          .setOrigin(0.5, 0.86)
          .setScale(key === "forge-premium-rail-signal" ? 0.2 : 0.22)
          .setDepth(point.y + 1);
        if (!this.model.reducedMotion) {
          this.tweens.add({
            targets: prop,
            y: point.y - 1,
            alpha: { from: 0.82, to: 1 },
            duration: 1250 + (index * 55),
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
        continue;
      }
      if (glassMarsh) {
        const key = ["glass-premium-reeds", "glass-premium-lilies", "glass-premium-lantern"][index % 3];
        const prop = this.add.image(point.x, point.y, key)
          .setOrigin(0.5, 0.88)
          .setScale(key === "glass-premium-lantern" ? 0.19 : 0.22)
          .setDepth(point.y + 1);
        this.reactiveFoliage.push({ sprite: prop, baseX: point.x, baseY: point.y, lastRustleAt: -Infinity });
        continue;
      }
      if (stormCoast) {
        const key = ["storm-premium-buoy", "storm-premium-windbreak", "storm-premium-tide-pool"][index % 3];
        const prop = this.add.image(point.x, point.y, key)
          .setOrigin(0.5, 0.88)
          .setScale(key === "storm-premium-buoy" ? 0.18 : 0.21)
          .setDepth(point.y + 1);
        this.reactiveFoliage.push({ sprite: prop, baseX: point.x, baseY: point.y, lastRustleAt: -Infinity });
        continue;
      }
      if (lanternForest) {
        const key = ["lantern-premium-roots", "lantern-premium-moths", "lantern-premium-telescope-pedestal"][index % 3];
        const prop = this.add.image(point.x, point.y, key)
          .setOrigin(0.5, 0.88)
          .setScale(key === "lantern-premium-telescope-pedestal" ? 0.2 : 0.23)
          .setDepth(point.y + 1);
        this.reactiveFoliage.push({ sprite: prop, baseX: point.x, baseY: point.y, lastRustleAt: -Infinity });
        continue;
      }
      if (starReach) {
        const key = ["star-premium-dawn-crystals", "star-premium-reader-page-pickup", "star-premium-constellation-rail"][Math.floor(index / 3) % 3];
        const prop = this.add.image(point.x, point.y, key)
          .setOrigin(0.5, 0.88)
          .setScale(key === "star-premium-reader-page-pickup" ? 0.3 : key === "star-premium-constellation-rail" ? 0.2 : 0.22)
          .setDepth(point.y + 1);
        this.reactiveFoliage.push({ sprite: prop, baseX: point.x, baseY: point.y, lastRustleAt: -Infinity });
        continue;
      }
      const sprite = this.add.image(point.x, point.y, "seedwake-reactive-grass")
        .setOrigin(0.5, 0.86)
        .setScale(1.04 + (index % 3) * 0.08)
        .setTint(profile.sceneryTint)
        .setDepth(point.y + 1);
      this.reactiveFoliage.push({ sprite, baseX: point.x, baseY: point.y, lastRustleAt: -Infinity });
    }
  }

  createResidents() {
    const profile = chapterPixelProfile(this.model.section);
    this.model.section.encounters.forEach((encounter, index) => {
      const key = questPixelResidentKey(
        this.model.section.chapter?.id,
        encounter.friend,
        this.model.section.world
      );
      const point = pixelResidentPoint(this.model.section, encounter, index);
      const premiumResident = questPixelResidentFrameSize(key) > 16;
      const shadow = addPixelShadow(this, point.x, point.y + 2, premiumResident ? 34 : 18, premiumResident ? 8 : 6);
      const animated = !this.failedAssetKeys.has(key) && this.textures.exists(key);
      const sprite = this.add.sprite(point.x, point.y, animated ? key : "quest-neutral-placeholder")
        .setOrigin(0.5, 0.88)
        .setScale(questPixelResidentWorldScale(key))
        .setDepth(point.y);
      if (animated) sprite.play(`${key}-idle`);
      if (profile.residentTint) sprite.setTint(profile.residentTint);
      sprite.setData("encounterId", encounter.id);
      sprite.setData("baseX", point.x);
      sprite.setData("baseY", point.y);
      const routeCentre = pixelRouteX(point.y, this.model.section.stopIndex);
      const entry = {
        encounter,
        point,
        sprite,
        shadow,
        key,
        animated,
        workFacing: point.x >= routeCentre ? "left" : "right",
        performanceMode: null,
        performanceLockedUntil: 0
      };
      this.residents.set(encounter.id, entry);
      this.setResidentPerformance(entry, "idle", true, index);
    });
  }

  setResidentPerformance(entry, mode, force = false, index = 0) {
    if (!entry?.sprite?.active) return;
    if (!force && entry.performanceLockedUntil > this.time.now) return;
    if (!force && entry.performanceMode === mode) return;
    const { sprite, shadow, point, key, workFacing } = entry;
    this.tweens.killTweensOf(sprite);
    if (shadow) this.tweens.killTweensOf(shadow);
    sprite.setPosition(point.x, point.y).setAngle(0).setScale(questPixelResidentWorldScale(key));
    sprite.setFlipX(mode === "work" && workFacing === "right");
    shadow?.setPosition(point.x, point.y + 2).setDepth(point.y - 1).setAlpha(0.28);
    entry.performanceMode = mode;
    if (!entry.animated) return;
    sprite.play(mode === "work" ? `${key}-work-${workFacing}` : `${key}-idle`, true);
    if (this.model.reducedMotion) return;
    if (mode === "work") {
      const direction = workFacing === "left" ? -1 : 1;
      this.tweens.add({
        targets: sprite,
        x: point.x + direction * 4,
        y: point.y - 2,
        angle: direction * 2,
        duration: 360 + index * 35,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      return;
    }
    this.tweens.add({
      targets: sprite,
      y: point.y - 2,
      angle: index % 2 ? 1.2 : -1.2,
      duration: 920 + index * 130,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  clearCeremony(restoreResidents = true) {
    for (const timer of this.ceremonyTimers) timer.remove(false);
    this.ceremonyTimers = [];
    for (const participant of this.ceremonySprites) {
      this.tweens.killTweensOf(participant.sprite);
      this.tweens.killTweensOf(participant.shadow);
      if (participant.residentEntry && restoreResidents) {
        this.setResidentPerformance(participant.residentEntry, "idle", true, participant.index);
      } else if (!participant.residentEntry) {
        participant.sprite.destroy();
        participant.shadow.destroy();
      }
    }
    for (const object of this.ceremonyDecor) this.destroyTweenedObject(object);
    this.ceremonySprites = [];
    this.ceremonyDecor = [];
    this.ceremonyActive = false;
    const collected = new Set(this.model?.collectedIds || []);
    for (const [id, drop] of this.dropObjects) drop.setVisible(!collected.has(id));
  }

  syncCeremony(active) {
    if (!active) {
      if (this.ceremonyActive) this.clearCeremony();
      return;
    }
    if (this.ceremonyActive || !this.player || !this.gatePoint) return;
    this.ceremonyActive = true;

    for (const choice of this.choiceObjects) this.destroyTweenedObject(choice.container);
    this.choiceObjects = [];
    this.choiceCorridorRadius = 0;
    this.choiceInside.clear();
    for (const drop of this.dropObjects.values()) drop.setVisible(false);
    this.destroyTweenedObject(this.choiceStageDecor);
    this.choiceStageDecor = null;
    this.destroyTweenedObject(this.carriedObject);
    this.carriedObject = null;
    this.carriedObjectMode = null;

    const profile = chapterPixelProfile(this.model.section);
    const availableResidents = [...this.residents.values()];
    const castKeys = questPixelNamedChapterCast(
      this.model.section.chapter?.id,
      this.model.section.world
    );
    const formation = questPixelCeremonyFormation(this.gatePoint, castKeys.length);
    const usedResidents = new Set();

    this.ceremonySprites = castKeys.map((key, index) => {
      const point = formation[index];
      const residentEntry = availableResidents.find(entry => entry.key === key && !usedResidents.has(entry)) || null;
      if (residentEntry) usedResidents.add(residentEntry);
      const premiumResident = questPixelResidentFrameSize(key) > 16;
      const shadow = residentEntry?.shadow || addPixelShadow(
        this,
        point.x,
        point.y + 2,
        premiumResident ? 34 : 18,
        premiumResident ? 8 : 6
      );
      const sprite = residentEntry?.sprite || this.add.sprite(
        this.gatePoint.x + (index < 2 ? -126 : 126),
        this.gatePoint.y + 88,
        key
      ).setOrigin(0.5, 0.88).setScale(questPixelResidentWorldScale(key));
      this.tweens.killTweensOf(sprite);
      this.tweens.killTweensOf(shadow);
      sprite
        .setAlpha(1)
        .setTint(profile.residentTint || 0xffffff)
        .setAngle(0)
        .setScale(questPixelResidentWorldScale(key))
        .setDepth(point.y + 4);
      shadow.setAlpha(0.28).setDepth(point.y - 1);
      sprite.play(this.model.reducedMotion ? `${key}-idle` : `${key}-ceremony`, true);

      if (this.model.reducedMotion) {
        sprite.setPosition(point.x, point.y);
        shadow.setPosition(point.x, point.y + 2);
      } else {
        const startX = sprite.x;
        const startY = sprite.y;
        shadow.setPosition(startX, startY + 2);
        const delay = index * 90;
        this.tweens.add({
          targets: sprite,
          x: point.x,
          y: point.y,
          duration: 520,
          delay,
          ease: "Sine.easeInOut",
          onComplete: () => {
            if (!sprite.active || !this.ceremonyActive) return;
            this.tweens.add({
              targets: sprite,
              y: point.y - 5,
              duration: 340 + (index * 35),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut"
            });
          }
        });
        this.tweens.add({
          targets: shadow,
          x: point.x,
          y: point.y + 2,
          duration: 520,
          delay,
          ease: "Sine.easeInOut"
        });
      }
      return { index, key, point, sprite, shadow, residentEntry };
    });

    this.tweens.killTweensOf(this.player);
    this.tweens.killTweensOf(this.playerShadow);
    this.player.body.setVelocity(0, 0);
    const playerPoint = { x: this.gatePoint.x, y: this.gatePoint.y + 102 };
    if (this.model.reducedMotion) {
      this.player.setPosition(playerPoint.x, playerPoint.y).setAngle(0);
      this.playerShadow.setPosition(playerPoint.x, playerPoint.y + 5);
      this.player.stop().setFrame(PIXEL_BEASTIE_DIRECTIONS.indexOf("up") * PIXEL_BEASTIE_FRAMES_PER_DIRECTION);
    } else {
      this.player.play("beastie-action-discover-up", true);
      this.tweens.add({
        targets: this.player,
        x: playerPoint.x,
        y: playerPoint.y,
        duration: 560,
        ease: "Sine.easeInOut",
        onComplete: () => {
          if (!this.player.active || !this.ceremonyActive) return;
          this.tweens.add({
            targets: this.player,
            y: playerPoint.y - 6,
            duration: 360,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
      });
      this.tweens.add({
        targets: this.playerShadow,
        x: playerPoint.x,
        y: playerPoint.y + 5,
        duration: 560,
        ease: "Sine.easeInOut"
      });
    }

    const chapterId = this.model.section.chapter?.id || "seedwake-meadow";
    const finaleNodeShapes = CEREMONY_FINALE_NODE_SHAPES[chapterId] || CEREMONY_FINALE_NODE_SHAPES["star-reach"];
    const finaleNodeOffsets = [-72, -36, 0, 36, 72];
    this.ceremonyDecor = finaleNodeOffsets.map((offset, index) => {
      const x = this.gatePoint.x + offset;
      const y = this.gatePoint.y + 8 + (Math.abs(offset) / 18);
      const node = this.add.container(x, y).setDepth(this.gatePoint.y + 2).setScale(0.62);
      const visual = addChoiceArt(this, node, {
        shape: finaleNodeShapes[index % finaleNodeShapes.length],
        label: ""
      }, index);
      visual.shadow.setVisible(false);
      visual.glow.setAlpha(0.24);
      if (!this.model.reducedMotion) {
        node.setScale(0.18).setAlpha(0.4);
        this.tweens.add({
          targets: node,
          scale: 0.62,
          alpha: 1,
          duration: 300,
          delay: 130 + (index * 80),
          ease: "Back.easeOut",
          onComplete: () => {
            if (!node.active || !this.ceremonyActive) return;
            this.tweens.add({
              targets: node,
              scale: { from: 0.58, to: 0.66 },
              duration: 620 + (index * 35),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut"
            });
            this.tweens.add({
              targets: visual.glow,
              alpha: { from: 0.16, to: 0.42 },
              duration: 620 + (index * 35),
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut"
            });
          }
        });
      }
      return node;
    });

    const handoffPoint = formation.at(-1) || { x: this.gatePoint.x + 72, y: this.gatePoint.y + 44 };
    const relicTarget = { x: playerPoint.x, y: playerPoint.y - 40 };
    const relic = this.add.container(handoffPoint.x, handoffPoint.y - 22)
      .setDepth(relicTarget.y + 22)
      .setScale(this.model.reducedMotion ? 0.78 : 0.34)
      .setData("chapterRelic", this.model.section.chapter?.chapterReward?.id || chapterId);
    const relicVisual = addChoiceArt(this, relic, {
      shape: CEREMONY_RELIC_SHAPES[chapterId] || "reading-star",
      label: ""
    }, 0);
    relicVisual.shadow.setVisible(false);
    relicVisual.glow.setAlpha(0.48);
    if (this.model.reducedMotion) {
      relic.setPosition(relicTarget.x, relicTarget.y);
    } else {
      this.tweens.add({
        targets: relic,
        x: relicTarget.x,
        y: relicTarget.y,
        scale: 0.78,
        angle: 360,
        duration: 420,
        delay: 460,
        ease: "Sine.easeInOut",
        onComplete: () => {
          if (!relic.active || !this.ceremonyActive) return;
          this.tweens.add({
            targets: relic,
            y: relicTarget.y - 5,
            duration: 380,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
          this.tweens.add({
            targets: relicVisual.glow,
            alpha: { from: 0.28, to: 0.62 },
            scale: { from: 0.92, to: 1.18 },
            duration: 540,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
      });
    }
    this.ceremonyDecor.push(relic);

    this.gateBarrier.setVisible(false);
    this.gateGlow.setAlpha(this.model.reducedMotion ? 0.32 : 0.46);
    for (const cue of questCeremonySfxSequence(chapterId, { reducedMotion: this.model.reducedMotion })) {
      if (cue.delay <= 0) {
        this.playSfx(cue.key, cue.volume);
        continue;
      }
      this.ceremonyTimers.push(this.time.delayedCall(cue.delay, () => {
        if (this.ceremonyActive) this.playSfx(cue.key, cue.volume);
      }));
    }
  }

  createDrops() {
    const textures = chapterPixelProfile(this.model.section).drops;
    this.model.section.drops.forEach((drop, index) => {
      const progress = Number.isFinite(drop.progress) ? drop.progress : 0.17 + (index * 0.1);
      const fallbackLateral = drop.cache ? (index % 2 === 0 ? -104 : 104) : index % 2 === 0 ? -34 : 34;
      const usesOptionalRoute = drop.cache || index % 5 === 0;
      const point = usesOptionalRoute
        ? optionalPixelRoutePoint(progress, this.model.section.stopIndex, fallbackLateral)
        : progressToPixel(progress, this.model.section.stopIndex, fallbackLateral);
      addPixelShadow(this, point.x, point.y + 6, 13, 5);
      if (drop.cache) {
        const cacheGlow = this.add.circle(point.x, point.y, 14, 0xffdc72, 0.2).setDepth(point.y);
        if (!this.model.reducedMotion) this.tweens.add({ targets: cacheGlow, scale: { from: 0.8, to: 1.25 }, alpha: { from: 0.12, to: 0.34 }, duration: 720, yoyo: true, repeat: -1 });
      }
      const cacheTexture = index % 2 === 0 ? "seedwake-cache-crate" : "seedwake-cache-pot";
      const dropTexture = drop.cache ? cacheTexture : textures[index % textures.length];
      const sprite = this.add.image(point.x, point.y, dropTexture)
        .setDepth(point.y + 1)
        .setScale(drop.cache ? 1.18 : dropTexture === "star-premium-reader-page-pickup" ? 0.27 : ["forge-premium-ember-rivet", "glass-premium-mirror-gem", "storm-premium-lens-shard-pickup", "lantern-premium-living-map-pickup"].includes(dropTexture) ? 0.34 : 1);
      sprite.setData("dropId", drop.id);
      sprite.setData("baseY", point.y);
      sprite.setData("cacheBurst", drop.cache ? (index % 2 === 0 ? "wood" : "pot") : null);
      sprite.setData("optionalDiscovery", drop.cache ? this.model.section.chapter?.optionalDiscovery || null : null);
      if (!this.model.reducedMotion) {
        this.tweens.add({ targets: sprite, y: point.y - 3, duration: 850 + (index * 35), yoyo: true, repeat: -1 });
      }
      this.dropObjects.set(drop.id, sprite);
    });
  }

  createPlayer() {
    const resumedEncounter = this.model.resume?.activeId
      ? this.model.section.encounters.find(item => item.id === this.model.resume.activeId)
      : null;
    const resume = this.model.resume?.pixelPosition
      || (resumedEncounter
        ? progressToPixel(Math.max(0, resumedEncounter.progress - 0.072), this.model.section.stopIndex)
        : this.model.resume?.phase === "gate"
          ? progressToPixel(Math.max(0, this.model.section.gate.progress - 0.045), this.model.section.stopIndex)
        : null);
    const start = resume || progressToPixel(this.model.section.start.progress, this.model.section.stopIndex);
    this.playerShadow = addPixelShadow(this, start.x, start.y + 5, 27, 7);
    this.player = this.physics.add.sprite(start.x, start.y, "pixel-beastie", 0)
      .setOrigin(0.5, 0.78)
      .setScale(0.86)
      .setDepth(start.y + 2);
    this.player.body.setSize(18, 12).setOffset(23, 44).setCollideWorldBounds(true);
    const activeResident = this.residents.get(this.model.activeEncounterId);
    const cameraStart = this.model.activeStage && activeResident
      ? { x: activeResident.point.x, y: activeResident.point.y + 26 }
      : start;
    this.cameraFocus = this.add.zone(cameraStart.x, cameraStart.y, 1, 1);
    this.cameras.main.setBounds(0, 0, PIXEL_WORLD.width, PIXEL_WORLD.height);
    this.cameras.main.startFollow(this.cameraFocus, false, 0.14, 0.14, 0, 28);
    this.cameras.main.setBackgroundColor(chapterPixelProfile(this.model.section).background);
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");
    this.input.on("pointerdown", pointer => {
      if (!this.player) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const rhythmChoice = this.model.activeStage?.rhythm ? this.choiceObjects[0] : null;
      if (rhythmChoice && Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, rhythmChoice.x, rhythmChoice.y) <= rhythmChoice.radius * 2.4) {
        this.bridge.onChoice?.(rhythmChoice.id);
        return;
      }
      if (this.isMovementLocked()) return;
      this.setPointerTarget(worldPoint.x, worldPoint.y, true);
    });
  }

  forwardMovementLimit() {
    const activeResident = this.residents.get(this.model.activeEncounterId);
    return this.model.phase === "gate"
      ? this.gatePoint.y - 48
      : activeResident
        ? this.model.activeStage
          ? questActiveChoiceForwardLimit({
              residentLimit: activeResident.point.y - 74,
              choices: this.choiceObjects
            })
          : activeResident.point.y + 24
        : this.gatePoint.y + 18;
  }

  setPointerTarget(x, y, showMarker = false) {
    const targetY = Math.max(Number(y) || 0, this.forwardMovementLimit());
    if (this.textures.exists("book-world-background")) {
      this.pointerTarget = {
        x: Phaser.Math.Clamp(Number(x) || 0, 24, PIXEL_WORLD.width - 24),
        y: Phaser.Math.Clamp(targetY, 24, PIXEL_WORLD.height - 24)
      };
      if (showMarker) this.showPointerMarker(this.pointerTarget);
      return;
    }
    const gateApproach = this.model.phase === "gate" && targetY <= this.gatePoint.y + 96;
    const routeCenters = gateApproach
      ? [this.gatePoint.x]
      : pixelRoutePathsX(targetY, this.model.section.stopIndex);
    const targetX = gateApproach ? this.gatePoint.x : x;
    const lane = questRouteLaneSelection({ x: targetX, centers: routeCenters });
    const target = questPointerDestination({
      x: targetX,
      y: targetY,
      routeCenterX: lane.center,
      forwardLimit: this.forwardMovementLimit(),
      corridorRadius: Math.max(routeCenters.length > 1 ? 48 : 100, this.choiceCorridorRadius + 22)
    });
    this.pointerTarget = target;
    if (!showMarker) return;
    this.showPointerMarker(target);
  }

  showPointerMarker(target) {
    this.pointerMarker?.destroy();
    const marker = this.add.circle(target.x, target.y, 5, 0xf5d76f, 0.2)
      .setStrokeStyle(2, 0xfff0a2, 0.9)
      .setDepth(target.y + 16);
    this.pointerMarker = marker;
    if (this.model.reducedMotion) {
      this.time.delayedCall(220, () => {
        if (marker.active) marker.destroy();
        if (this.pointerMarker === marker) this.pointerMarker = null;
      });
      return;
    }
    this.tweens.add({
      targets: marker,
      scale: 2.1,
      alpha: 0,
      duration: 360,
      ease: "Quad.easeOut",
      onComplete: () => {
        marker.destroy();
        if (this.pointerMarker === marker) this.pointerMarker = null;
      }
    });
  }

  activeVerbProfile() {
    const stage = this.model?.activeStage;
    return questPixelVerbProfile(stage?.verbPattern || "single", stage?.mechanic || "trail");
  }

  handleResize(gameSize, scheduleChoiceRebuild = true) {
    if (!this.cameras?.main) return;
    const width = Number(gameSize?.width) || this.scale.width;
    const height = Number(gameSize?.height) || this.scale.height;
    const zoom = questPixelCameraZoom({
      width,
      height,
      profileZoom: this.activeVerbProfile().zoom,
      activeStage: Boolean(this.model?.activeStage)
    });
    this.cameraTargetZoom = zoom;
    const zoomChanged = Math.abs((this.lastAppliedZoom ?? -1) - zoom) > 0.025;
    const animate = this.cameraZoomReady
      && !this.model?.reducedMotion
      && Math.abs(this.cameras.main.zoom - zoom) > 0.025;
    if (animate) this.cameras.main.zoomTo(zoom, 260, "Sine.easeInOut", true);
    else this.cameras.main.setZoom(zoom);
    this.cameraZoomReady = true;
    this.lastAppliedZoom = zoom;
    // Routine iOS URL-bar resizes fire this constantly. Rebuilding every
    // choice container on each one could destroy a tap target UNDER the
    // child's finger - only rebuild when the zoom bucket truly changed, and
    // debounced so a resize storm settles first.
    if (scheduleChoiceRebuild && zoomChanged && this.model?.activeStage && this.model?.activeEncounterId) {
      window.clearTimeout(this.resizeRebuildTimer);
      this.resizeRebuildTimer = window.setTimeout(() => {
        if (!this.sceneShuttingDown && this.sys?.isActive?.() && this.model?.activeStage && this.model?.activeEncounterId) {
          this.rebuildChoices(this.model.activeStage, this.model.activeEncounterId);
        }
      }, 150);
    }
  }

  isMovementLocked() {
    return Boolean(
      this.gateLatch
      || !this.model?.interactive
      || this.model?.phase === "teach"
      || this.model?.activeStage?.rhythm
    );
  }

  setModel(nextModel) {
    this.model = nextModel;
    if (this.sys.isActive()) this.applyModel(nextModel, false);
  }

  applyModel(model, first) {
    if (!model) return;
    const solved = new Set(model.solvedIds || []);
    const collected = new Set(model.collectedIds || []);
    for (const [id, resident] of this.residents) {
      resident.sprite.setAlpha(solved.has(id) ? 0.62 : 1);
      resident.sprite.setTint(solved.has(id) ? 0xbfd8c2 : 0xffffff);
      if (!model.ceremony) {
        this.setResidentPerformance(
          resident,
          !solved.has(id) && id === model.activeEncounterId ? "work" : "idle"
        );
      }
    }
    for (const [id, drop] of this.dropObjects) drop.setVisible(!collected.has(id));
    this.syncCompletions(model.completionMarks || []);

    const gateOpen = model.ceremony || model.phase === "gate" || solved.size >= this.model.section.encounters.length;
    this.gateBarrier.setVisible(!gateOpen);
    this.gateGlow.setAlpha(gateOpen ? 0.32 : 0);
    if (gateOpen && !first && !model.reducedMotion && !this.gateGlowTween) {
      this.gateGlowTween = this.tweens.add({ targets: this.gateGlow, alpha: { from: 0.12, to: 0.4 }, duration: 680, yoyo: true, repeat: -1 });
    } else if ((!gateOpen || model.reducedMotion) && this.gateGlowTween) {
      this.gateGlowTween.stop();
      this.gateGlowTween.remove();
      this.gateGlowTween = null;
    }
    this.syncCeremony(Boolean(model.ceremony));

    const stage = model.activeStage;
    const signature = stage
      ? `${model.activeEncounterId}:${stage.id}:${(stage.items || []).map(item => `${item.id}:${item.shape}`).join("|")}`
      : "none";
    if (signature !== this.lastModelSignature) {
      this.lastModelSignature = signature;
      // A stage transition is not a resize. Refresh the camera target without
      // entering the resize debounce, then rebuild immediately so beat N can
      // never retain beat N-1's answer objects on a stable viewport.
      this.handleResize({ width: this.scale.width, height: this.scale.height }, false);
      window.clearTimeout(this.resizeRebuildTimer);
      this.rebuildChoices(model.activeStage, model.activeEncounterId);
      this.syncCarriedObject(this.model?.activeStage);
      this.choiceInside.clear();
      if (this.player) {
        for (const choice of this.choiceObjects) {
          const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, choice.x, choice.y);
          if (!["turn-node", "steer-gate"].includes(choice.item.role) && distance <= choice.radius + 12) {
            this.choiceInside.add(choice.id);
          }
        }
      }
      this.choiceCooldownUntil = this.time.now + 520;
    }
  }

  rebuildChoices(stage, encounterId) {
    for (const entry of this.choiceObjects) this.destroyTweenedObject(entry.container);
    this.choiceObjects = [];
    this.choiceCorridorRadius = 0;
    this.destroyTweenedObject(this.choiceStageDecor);
    this.choiceStageDecor = null;
    if (!stage || !encounterId) return;
    const resident = this.residents.get(encounterId);
    if (!resident) return;
    const items = stage.items || [];
    const stagingZoom = Math.max(0.1, this.cameraTargetZoom || this.cameras.main.zoom);
    const positions = questPixelChoiceOffsets(stage.layout, items.length, {
      viewportWidth: this.scale.width,
      zoom: stagingZoom
    });
    // Keep answer formations readable even when a child reaches a resident
    // from the side of a bend. Movement can curve; the choice ring should not.
    const forward = { x: 0, y: 1 };
    const right = { x: 1, y: 0 };
    const visibleHalfWidth = this.scale.width / (stagingZoom * 2);
    const cameraCentreX = Phaser.Math.Clamp(resident.point.x, visibleHalfWidth, PIXEL_WORLD.width - visibleHalfWidth);
    const choiceLeft = cameraCentreX - visibleHalfWidth + 48;
    const choiceRight = cameraCentreX + visibleHalfWidth - 48;
    const profile = this.activeVerbProfile();
    const movingSortLane = profile.response === "sort" && stage.layout === "sorting-lane";
    const sortLaneLayout = movingSortLane
      ? questPixelSortLaneLayout({
          resident: resident.point,
          player: this.player,
          forward,
          right,
          choiceLeft,
          choiceRight,
          count: items.length
        })
      : null;
    if (movingSortLane) {
      const laneX = sortLaneLayout.center.x;
      const laneY = sortLaneLayout.center.y;
      const lane = this.add.container(laneX, laneY).setDepth(laneY - 70);
      const belt = this.model.section.chapter?.id === "forge-settlement"
        ? this.add.image(0, 0, "forge-premium-sorting-conveyor").setScale(0.34)
        : this.add.graphics();
      if (typeof belt.fillStyle === "function") {
        belt.fillStyle(0x282c35, 0.98).fillRoundedRect(-50, -14, 100, 28, 6);
        belt.fillStyle(0x5b6270, 1).fillRoundedRect(-44, -10, 88, 20, 4);
        belt.fillStyle(0x303642, 1).fillRect(-40, -5, 80, 10);
        for (const offset of [-26, 0, 26]) {
          belt.fillStyle(0xc8ad65, 0.88).fillTriangle(offset - 6, -5, offset + 3, 0, offset - 6, 5);
        }
        belt.fillStyle(0x1d2028, 1).fillRoundedRect(-60, -18, 16, 36, 4);
        belt.fillStyle(0x1d2028, 1).fillRoundedRect(44, -18, 16, 36, 4);
        belt.fillStyle(0x8ea778, 1).fillRect(-56, -13, 8, 26);
        belt.fillStyle(0xd7a45c, 1).fillRect(48, -13, 8, 26);
      }
      lane.add(belt);
      lane.setRotation(Math.atan2(right.y, right.x));
      this.choiceStageDecor = lane;
    } else if (profile.response === "steer" && stage.steerStep) {
      const target = items[0];
      const targetPoint = progressToPixel(
        Number(target?.progress) || 0,
        this.model.section.stopIndex,
        Number(target?.steerLateral) || 0
      );
      const startX = this.player?.x ?? resident.point.x;
      const startY = this.player?.y ?? resident.point.y;
      const channel = this.add.container(0, 0).setDepth(Math.min(startY, targetPoint.y) - 72);
      const water = this.add.graphics();
      water.lineStyle(54, 0x193c58, 0.72).lineBetween(startX, startY, targetPoint.x, targetPoint.y);
      water.lineStyle(42, 0x347895, 0.92).lineBetween(startX, startY, targetPoint.x, targetPoint.y);
      water.lineStyle(3, 0xa9e3df, 0.54).lineBetween(startX, startY, targetPoint.x, targetPoint.y);
      channel.add(water);
      for (let wakeIndex = 1; wakeIndex <= 4; wakeIndex += 1) {
        const amount = wakeIndex / 5;
        const wake = this.add.ellipse(
          Phaser.Math.Linear(startX, targetPoint.x, amount),
          Phaser.Math.Linear(startY, targetPoint.y, amount),
          13,
          4,
          0xd8f5ed,
          0.34
        );
        channel.add(wake);
        if (!this.model.reducedMotion) {
          this.tweens.add({
            targets: wake,
            scaleX: { from: 0.72, to: 1.2 },
            alpha: { from: 0.18, to: 0.52 },
            duration: 520 + (wakeIndex * 70),
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
      }
      this.choiceStageDecor = channel;
    } else if (profile.response === "signal" && stage.signalStep) {
      const target = items[0];
      const rawTarget = progressToPixel(
        Number(target?.progress) || 0,
        this.model.section.stopIndex,
        Number(target?.signalLateral) || 0
      );
      const targetX = Phaser.Math.Clamp(rawTarget.x, choiceLeft, choiceRight);
      const relay = this.add.container(0, 0).setDepth(Math.min(resident.point.y, rawTarget.y) - 3);
      const beam = this.add.graphics();
      const tint = chapterPixelProfile(this.model.section).gateTint || 0xf2dc83;
      beam.lineStyle(9, 0x263e4d, 0.46).lineBetween(resident.point.x, resident.point.y - 12, targetX, rawTarget.y);
      beam.lineStyle(5, tint, 1).lineBetween(resident.point.x, resident.point.y - 12, targetX, rawTarget.y);
      beam.lineStyle(2, 0xfff6ce, 0.96).lineBetween(resident.point.x, resident.point.y - 12, targetX, rawTarget.y);
      beam.fillStyle(tint, 0.86).fillCircle(resident.point.x, resident.point.y - 12, 5);
      beam.fillStyle(0xfff4bf, 0.92).fillCircle(targetX, rawTarget.y, 6);
      relay.add(beam);
      relay.setAlpha(this.model.reducedMotion ? 0.78 : 0.56);
      this.choiceStageDecor = relay;
    } else if (profile.response === "climb" && stage.climbStep) {
      const target = items[0];
      const rawTarget = progressToPixel(
        Number(target?.progress) || 0,
        this.model.section.stopIndex,
        Number(target?.climbLateral) || 0
      );
      const targetX = Phaser.Math.Clamp(rawTarget.x, choiceLeft, choiceRight);
      const startX = this.player?.x ?? resident.point.x;
      const startY = this.player?.y ?? resident.point.y;
      const face = this.add.container(0, 0).setDepth(Math.min(startY, rawTarget.y) - 76);
      for (let ridge = 0; ridge <= 4; ridge += 1) {
        const amount = ridge / 4;
        const ridgeX = Phaser.Math.Linear(startX, targetX, amount) + ((ridge % 3) - 1) * 9;
        const ridgeY = Phaser.Math.Linear(startY, rawTarget.y, amount);
        face.add(this.add.image(ridgeX, ridgeY, "seedwake-nature", "rock-cluster")
          .setScale(0.68 + ((ridge % 2) * 0.08))
          .setAngle(ridge % 2 ? 5 : -4)
          .setTint(ridge % 2 ? 0x758296 : 0x66758b));
      }
      const rock = this.add.graphics();
      rock.lineStyle(7, 0x313b4c, 0.68).lineBetween(startX, startY, targetX, rawTarget.y);
      rock.lineStyle(3, 0xe2c28a, 0.9).lineBetween(startX, startY, targetX, rawTarget.y);
      for (let chip = 1; chip <= 4; chip += 1) {
        const amount = chip / 5;
        const chipX = Phaser.Math.Linear(startX, targetX, amount) + (chip % 2 ? -18 : 18);
        const chipY = Phaser.Math.Linear(startY, rawTarget.y, amount);
        rock.fillStyle(chip % 2 ? 0x4b3c3f : 0xc29368, 0.82).fillCircle(chipX, chipY, 4 + (chip % 2));
      }
      face.add(rock);
      this.choiceStageDecor = face;
    } else if (profile.response === "turn" && stage.turnStep) {
      const dialX = resident.point.x + (forward.x * 30);
      const dialY = resident.point.y + (forward.y * 30);
      const dial = this.add.container(dialX, dialY).setDepth(dialY - 64);
      const face = this.add.graphics();
      const tint = chapterPixelProfile(this.model.section).gateTint || 0xd9c276;
      face.fillStyle(0x252b38, 0.96).fillCircle(0, 0, 48);
      face.lineStyle(5, tint, 0.82).strokeCircle(0, 0, 43);
      face.lineStyle(2, 0xe9dfb2, 0.56).strokeCircle(0, 0, 29);
      for (const angle of [155, -85, 75]) {
        const radians = Phaser.Math.DegToRad(angle);
        face.lineStyle(3, tint, 0.58).lineBetween(0, 0, Math.cos(radians) * 37, Math.sin(radians) * 37);
      }
      face.fillStyle(tint, 1).fillCircle(0, 0, 9);
      face.fillStyle(0xfff2c2, 0.9).fillCircle(-3, -3, 3);
      dial.add(face);
      for (const [index, angle] of [155, -85, 75].entries()) {
        const radians = Phaser.Math.DegToRad(angle);
        dial.add(this.add.sprite(Math.cos(radians) * 43, Math.sin(radians) * 43, "seedwake-spark", index * 2)
          .setScale(index + 1 <= stage.turnStep ? 0.18 : 0.12)
          .setTint(tint)
          .setAlpha(index + 1 <= stage.turnStep ? 0.88 : 0.34));
      }
      this.choiceStageDecor = dial;
    }
    items.forEach((item, index) => {
      const [lateral, towardPlayer] = positions[index % positions.length];
      const rhythmAnchor = stage.rhythm && this.player
        ? { x: this.player.x, y: this.player.y - 34 }
        : null;
      const routeAnchor = profile.response === "route" && item.role === "route-destination" && Number.isFinite(Number(item.progress))
        ? progressToPixel(Number(item.progress), this.model.section.stopIndex, index % 2 ? -22 : 22)
        : null;
      const pursuitAnchor = profile.response === "chase" && item.role === "pursuit-target" && stage.pursuitStep && Number.isFinite(Number(item.progress))
        ? progressToPixel(Number(item.progress), this.model.section.stopIndex, Number(item.pursuitLateral) || 0)
        : null;
      const sortAnchor = profile.response === "sort" && item.role === "sort-destination" && Number.isFinite(Number(item.progress))
        ? progressToPixel(Number(item.progress), this.model.section.stopIndex, Number(item.sortLateral) || 0)
        : null;
      const steerAnchor = profile.response === "steer" && item.role === "steer-gate" && Number.isFinite(Number(item.progress))
        ? progressToPixel(Number(item.progress), this.model.section.stopIndex, Number(item.steerLateral) || 0)
        : null;
      const signalAnchor = profile.response === "signal" && item.role === "signal-pad" && Number.isFinite(Number(item.progress))
        ? progressToPixel(Number(item.progress), this.model.section.stopIndex, Number(item.signalLateral) || 0)
        : null;
      const climbAnchor = profile.response === "climb" && item.role === "climb-hold" && Number.isFinite(Number(item.progress))
        ? progressToPixel(Number(item.progress), this.model.section.stopIndex, Number(item.climbLateral) || 0)
        : null;
      const turnRadians = profile.response === "turn" && item.role === "turn-node"
        ? Phaser.Math.DegToRad(Number(item.turnAngle) || 0)
        : null;
      const turnAnchor = turnRadians == null
        ? null
        : {
            x: resident.point.x + (forward.x * 30) + (Math.cos(turnRadians) * 48),
            y: resident.point.y + (forward.y * 30) + (Math.sin(turnRadians) * 48)
          };
      const sortLaneAnchor = movingSortLane ? sortLaneLayout.points[index] : null;
      const rawX = routeAnchor?.x ?? pursuitAnchor?.x ?? sortAnchor?.x ?? steerAnchor?.x ?? signalAnchor?.x ?? climbAnchor?.x ?? turnAnchor?.x ?? rhythmAnchor?.x ?? sortLaneAnchor?.x ?? (resident.point.x + (right.x * lateral) + (forward.x * towardPlayer));
      const rawY = routeAnchor?.y ?? pursuitAnchor?.y ?? sortAnchor?.y ?? steerAnchor?.y ?? signalAnchor?.y ?? climbAnchor?.y ?? turnAnchor?.y ?? rhythmAnchor?.y ?? sortLaneAnchor?.y ?? (resident.point.y + (right.y * lateral) + (forward.y * towardPlayer));
      const anchored = routeAnchor || pursuitAnchor || sortAnchor || steerAnchor || signalAnchor || climbAnchor || turnAnchor || rhythmAnchor || sortLaneAnchor;
      const residentSafePoint = anchored || !movingSortLane
        ? { x: rawX, y: rawY }
        : questPixelAvoidActorOverlap({
            point: { x: rawX, y: rawY },
            actor: resident.point,
            right,
            index,
            clearance: 66,
            nudge: 42
          });
      const actorSafePoint = anchored
        ? residentSafePoint
        : questPixelAvoidActorOverlap({
            point: residentSafePoint,
            actor: this.player,
            right,
            index
          });
      const x = Phaser.Math.Clamp(actorSafePoint.x, choiceLeft, choiceRight);
      const y = actorSafePoint.y;
      const container = this.add.container(x, y).setDepth(y + 3);
      const visual = addChoiceArt(this, container, item, index);
      if (routeAnchor) {
        visual.glow.setAlpha(this.model.reducedMotion ? 0.42 : 0.26).setScale(1.14);
        const breadcrumbTint = chapterPixelProfile(this.model.section).gateTint || 0xffe38d;
        for (let step = 1; step <= 3; step += 1) {
          const progress = step / 4;
          const localX = resident.point.x + ((x - resident.point.x) * progress) - x;
          const localY = resident.point.y + ((y - resident.point.y) * progress) - y;
          const breadcrumb = this.add.sprite(localX, localY, "seedwake-spark", (index + step) % 9)
            .setScale(0.21)
            .setTint(breadcrumbTint)
            .setAlpha(0.94);
          container.add(breadcrumb);
          if (!this.model.reducedMotion) {
            this.tweens.add({
              targets: breadcrumb,
              alpha: { from: 0.42, to: 0.9 },
              scale: { from: 0.17, to: 0.24 },
              duration: 460 + (step * 90),
              yoyo: true,
              repeat: -1
            });
          }
        }
      }
      const objectScale = movingSortLane
        ? 0.72
        : String(item.label ?? item.value ?? "").length > 4 ? 1 : 1.05;
      container.setScale(objectScale);
      if (!this.model.reducedMotion) {
        this.tweens.add({ targets: visual.glow, alpha: { from: 0.1, to: 0.36 }, scale: { from: 0.92, to: 1.12 }, duration: 800 + (index * 70), yoyo: true, repeat: -1 });
        if (profile.response === "hop") {
          this.tweens.add({ targets: container, y: y - 4, duration: 520 + index * 70, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        } else if (profile.response === "carry") {
          this.tweens.add({ targets: container, angle: { from: -2, to: 2 }, duration: 640 + index * 55, yoyo: true, repeat: -1 });
        } else if (profile.response === "build") {
          this.tweens.add({ targets: container, scaleX: { from: 0.97, to: 1.03 }, duration: 760 + index * 60, yoyo: true, repeat: -1 });
        } else if (profile.response === "chase") {
          const chaseX = Phaser.Math.Clamp(x + (index % 2 ? 18 : -18), choiceLeft, choiceRight);
          this.tweens.add({
            targets: container,
            x: chaseX,
            y: y + (index % 2 ? -8 : 8),
            angle: { from: index % 2 ? -3 : 3, to: index % 2 ? 3 : -3 },
            duration: 720 + index * 90,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        } else if (profile.response === "route") {
          this.tweens.add({ targets: visual.glow, scale: { from: 0.86, to: 1.22 }, alpha: { from: 0.14, to: 0.46 }, duration: 560, yoyo: true, repeat: -1 });
        } else if (profile.response === "turn") {
          // Infinite rotation is the most expensive animation a CANVAS
          // Graphics object can run (full re-tessellation per frame) and it
          // blurs pixel art. A scale pulse reads as the same "alive" cue.
          this.tweens.add({ targets: visual.art, scale: { from: 1, to: 1.08 }, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          this.tweens.add({ targets: visual.glow, scale: { from: 0.9, to: 1.24 }, alpha: { from: 0.16, to: 0.5 }, duration: 620, yoyo: true, repeat: -1 });
        } else if (profile.response === "steer") {
          this.tweens.add({ targets: container, angle: { from: -2.5, to: 2.5 }, duration: 540, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          this.tweens.add({ targets: visual.glow, scale: { from: 0.94, to: 1.18 }, alpha: { from: 0.18, to: 0.48 }, duration: 580, yoyo: true, repeat: -1 });
        } else if (profile.response === "signal") {
          this.tweens.add({ targets: visual.glow, scale: { from: 0.88, to: 1.28 }, alpha: { from: 0.16, to: 0.54 }, duration: 520, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          this.tweens.add({ targets: container, y: y - 3, duration: 680, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        } else if (profile.response === "climb") {
          this.tweens.add({ targets: visual.glow, scale: { from: 0.9, to: 1.2 }, alpha: { from: 0.14, to: 0.48 }, duration: 560, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        } else if (profile.response === "pulse") {
          this.tweens.add({ targets: container, scale: { from: 0.94, to: 1.08 }, duration: 460, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        }
      }
      const reachScale = Math.max(1, Number(this.model.section.rewardBonuses?.interactionRadius || 0.82) / 0.82);
      const choiceReachScale = movingSortLane ? 0.58 : reachScale;
      const turnReachScale = item.role === "turn-node" ? 1.55 : 1;
      const steerReachScale = item.role === "steer-gate" ? 1.3 : 1;
      const signalReachScale = item.role === "signal-pad" ? 1.25 : 1;
      const climbReachScale = item.role === "climb-hold" ? 1.28 : 1;
      this.choiceObjects.push({
        id: item.id,
        item,
        x,
        y,
        container,
        ...visual,
        radius: visual.radius * choiceReachScale * turnReachScale * steerReachScale * signalReachScale * climbReachScale,
        sortOriginX: movingSortLane ? x : null,
        sortOriginY: movingSortLane ? y : null,
        sortRightX: movingSortLane ? right.x : null,
        sortRightY: movingSortLane ? right.y : null,
        sortPhase: movingSortLane ? 0 : null
      });
    });
    const lateralMotionPadding = profile.response === "sort"
      ? 10
      : profile.response === "chase" ? 20 : 0;
    this.choiceCorridorRadius = questChoiceCorridorRadius({
      choices: this.choiceObjects.map(choice => ({
        x: choice.container.x,
        radius: choice.radius,
        routeCenters: pixelRoutePathsX(choice.container.y, this.model.section.stopIndex),
        motionPadding: lateralMotionPadding
      }))
    });
  }

  syncCompletions(marks) {
    const wanted = new Set(marks.map(mark => mark.id));
    for (const [id, object] of this.completionObjects) {
      if (wanted.has(id)) continue;
      this.destroyTweenedObject(object);
      this.completionObjects.delete(id);
    }
    const encounterCounts = new Map();
    for (const mark of marks) {
      const resident = this.residents.get(mark.encounterId);
      if (!resident) continue;
      const ordinal = encounterCounts.get(mark.encounterId) || 0;
      encounterCounts.set(mark.encounterId, ordinal + 1);
      if (this.completionObjects.has(mark.id)) continue;
      const progress = Number(mark.progress);
      const hasRoutePosition = Number.isFinite(progress);
      const routePoint = hasRoutePosition
        ? progressToPixel(progress, this.model.section.stopIndex, completionLateral(mark.shape, ordinal))
        : null;
      const x = routePoint?.x ?? resident.point.x + (ordinal % 2 === 0 ? -92 : 92);
      const y = routePoint?.y ?? resident.point.y - 20 + (Math.floor(ordinal / 2) * 36);
      const container = this.add.container(x, y).setDepth(y + 1).setScale(0.82);
      const visual = addChoiceArt(this, container, {
        shape: completedShape(mark.shape),
        label: mark.showToken ? mark.label : ""
      }, ordinal);
      visual.glow.setAlpha(0.16);
      this.completionObjects.set(mark.id, container);
      if (!this.model.reducedMotion) {
        container.setScale(0.2);
        this.tweens.add({ targets: container, scale: 0.82, duration: 260, ease: "Back.easeOut" });
        const sparkle = this.add.sprite(x, y, "seedwake-spark").setDepth(y + 20);
        sparkle.play({ key: "seedwake-spark-burst", ignoreIfPlaying: true });
        const motion = completionMotion(mark.shape);
        this.time.delayedCall(280, () => {
          if (!container.active) return;
          if (motion === "turn") {
            this.tweens.add({ targets: [visual.art, visual.authoredSprite].filter(Boolean), scale: { from: 1, to: 1.06 }, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          } else if (motion === "glow") {
            this.tweens.add({ targets: visual.glow, alpha: { from: 0.12, to: 0.42 }, duration: 720, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          } else if (motion === "bob") {
            this.tweens.add({ targets: container, y: y - 3, duration: 680, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          }
        });
      }
    }
  }

  syncCarriedObject(stage) {
    const steering = stage?.verbPattern === "steer" && Boolean(stage?.steerStep);
    const carriedSignature = stage
      ? `${stage.id}:${steering ? "steer" : "carry"}:${stage.carryFromStage ?? "none"}:${stage.playerAction || "none"}:${stage.items?.[0]?.shape || "none"}`
      : "none";
    if (carriedSignature === this.lastCarriedSignature) return;
    this.lastCarriedSignature = carriedSignature;
    this.destroyTweenedObject(this.carriedObject);
    this.carriedObject = null;
    this.carriedObjectMode = null;
    if (!steering && stage?.carryFromStage == null && !["carry", "place-plank"].includes(stage?.playerAction)) return;
    const destinationShape = String(stage.items?.[0]?.shape || "");
    const shape = steering
      ? "river-ferry"
      : stage.playerAction === "place-plank"
      ? "river-plank"
      : destinationShape.replace(/-(marker|slot)$/, "") || "sound-parcel";
    const container = this.add.container(this.player.x, this.player.y + (steering ? 7 : -21)).setScale(steering ? 0.78 : 0.58);
    const visual = addChoiceArt(this, container, { shape, label: "" }, 0);
    visual.glow.setVisible(false);
    if (steering) visual.shadow.setVisible(false);
    this.carriedObject = container;
    this.carriedObjectMode = steering ? "steer" : "carry";
  }

  destroyTweenedObject(object) {
    if (!object) return;
    const targets = [object, ...(Array.isArray(object.list) ? object.list : [])];
    for (const target of targets) this.tweens.killTweensOf(target);
    object.destroy(true);
  }

  playSfx(key, volume = 0.28) {
    const material = questChapterMaterialSfxEntry(this.model?.section?.chapter?.id);
    const entry = QUEST_FEEDBACK_SFX[key]
      || PIXEL_ACTION_SFX_BY_KEY[key]
      || (material?.key === key ? material : null);
    playQuestSfxEntry(entry, { enabled: this.model?.soundEnabled, volume });
  }

  playFeedback(kind, choiceId = null) {
    const choice = choiceId ? this.choiceObjects.find(entry => entry.id === choiceId) : null;
    const residentEntry = this.residents.get(this.model.activeEncounterId) || null;
    const resident = residentEntry?.sprite || null;
    if (kind === "wait") {
      const waitSound = questActionSfxEntry({ kind: "wait" });
      if (waitSound) this.playSfx(waitSound.key, 0.22);
      if (choice && !this.model.reducedMotion) {
        this.tweens.add({ targets: choice.container, scale: 1.06, duration: 85, yoyo: true });
      }
      return;
    }
    if (kind === "wrong") {
      this.playSfx("seedwake-wrong", 0.18);
      if (choice && !this.model.reducedMotion) {
        this.tweens.add({ targets: choice.container, x: choice.x + 4, duration: 55, yoyo: true, repeat: 2 });
      }
      if (resident && !this.model.reducedMotion) {
        this.tweens.killTweensOf(resident);
        residentEntry.performanceLockedUntil = this.time.now + 430;
        this.tweens.add({
          targets: resident,
          x: resident.x + 3,
          duration: 65,
          yoyo: true,
          repeat: 2,
          onComplete: () => this.setResidentPerformance(residentEntry, "work", true)
        });
      }
      return;
    }
    if (kind === "success") {
      this.playSfx("seedwake-success", 0.32);
    } else {
      const stage = this.model?.activeStage;
      const actionSound = questActionSfxEntry({
        kind: "correct",
        verbPattern: stage?.verbPattern,
        playerAction: stage?.playerAction
      });
      this.playSfx(actionSound?.key || "seedwake-magic", 0.27);
      const materialSound = questChapterMaterialSfxEntry(this.model.section.chapter?.id);
      if (materialSound) this.playSfx(materialSound.key, 0.1);
    }
    if (choice && !this.model.reducedMotion) {
      this.tweens.add({ targets: choice.container, scale: 1.2, duration: 110, yoyo: true });
    }
    if (!this.model.reducedMotion) this.playActionPerformance(residentEntry);
  }

  playActionPerformance(residentEntry) {
    const profile = this.activeVerbProfile();
    this.tweens.killTweensOf(this.player);
    this.playerActionLockedUntil = this.time.now + 360;
    this.player.play(`beastie-action-${profile.response}-${this.lastFacing}`, true);
    if (profile.response === "hop") {
      this.tweens.add({ targets: this.player, y: this.player.y - 10, duration: 120, yoyo: true, ease: "Quad.easeOut" });
    } else if (profile.response === "carry") {
      this.tweens.add({ targets: this.player, scaleX: 0.96, scaleY: 1.06, duration: 120, yoyo: true });
    } else if (profile.response === "build") {
      this.tweens.add({ targets: this.player, angle: -7, duration: 90, yoyo: true, repeat: 1 });
    } else if (profile.response === "chase") {
      const x = this.lastFacing === "left" ? -7 : this.lastFacing === "right" ? 7 : 0;
      const y = this.lastFacing === "up" ? -7 : this.lastFacing === "down" ? 7 : 0;
      this.tweens.add({ targets: this.player, x: this.player.x + x, y: this.player.y + y, duration: 95, yoyo: true, ease: "Quad.easeOut" });
    } else if (profile.response === "route") {
      this.tweens.add({ targets: this.player, y: this.player.y - 8, duration: 105, yoyo: true, ease: "Quad.easeOut" });
    } else if (profile.response === "sort") {
      const push = this.lastFacing === "left" ? -7 : this.lastFacing === "right" ? 7 : 5;
      this.tweens.add({ targets: this.player, x: this.player.x + push, angle: push < 0 ? -6 : 6, duration: 105, yoyo: true, repeat: 1, ease: "Quad.easeOut" });
    } else if (profile.response === "tool") {
      this.tweens.add({ targets: this.player, angle: { from: -8, to: 8 }, duration: 90, yoyo: true, repeat: 2, ease: "Sine.easeInOut" });
    } else if (profile.response === "turn") {
      this.tweens.add({ targets: this.player, angle: { from: -10, to: 10 }, duration: 110, yoyo: true, repeat: 1, ease: "Sine.easeInOut" });
    } else if (profile.response === "steer") {
      const lean = this.lastFacing === "left" ? -9 : this.lastFacing === "right" ? 9 : 5;
      this.tweens.add({ targets: this.player, angle: lean, duration: 100, yoyo: true, repeat: 1, ease: "Sine.easeInOut" });
    } else if (profile.response === "signal") {
      this.tweens.add({ targets: this.player, scale: { from: 0.96, to: 1.1 }, angle: { from: -4, to: 4 }, duration: 120, yoyo: true, repeat: 1, ease: "Sine.easeInOut" });
    } else if (profile.response === "climb") {
      this.tweens.add({ targets: this.player, y: this.player.y - 9, angle: { from: -5, to: 5 }, duration: 125, yoyo: true, repeat: 1, ease: "Quad.easeOut" });
    } else if (profile.response === "pulse") {
      this.tweens.add({ targets: this.player, scale: 1.12, duration: 130, yoyo: true, ease: "Sine.easeOut" });
    } else {
      this.tweens.add({ targets: this.player, y: this.player.y - 5, duration: 100, yoyo: true });
    }
    if (residentEntry?.sprite) {
      const resident = residentEntry.sprite;
      this.tweens.killTweensOf(resident);
      const key = residentEntry.key;
      residentEntry.performanceLockedUntil = this.time.now + 520;
      if (key) resident.play(`${key}-celebrate`, true);
      this.tweens.add({
        targets: resident,
        y: resident.y - 7,
        scaleX: resident.scaleX * 1.08,
        scaleY: resident.scaleY * 1.08,
        duration: 130,
        yoyo: true,
        ease: "Back.easeOut",
        onComplete: () => {
          if (resident.active) this.setResidentPerformance(residentEntry, "work", true);
        }
      });
    }
  }

  update(time, delta) {
    if (!this.player || !this.model) return;
    this.bridge.onFrame?.(delta);
    if (this.bridge.onDiagnostics && time >= this.nextRuntimeHealthAt) {
      this.bridge.onDiagnostics(this.getDiagnostics());
      this.nextRuntimeHealthAt = time + RUNTIME_HEALTH_INTERVAL_MS;
    }
    this.updateMovement(delta);
    this.player.setDepth(this.player.y + 3);
    this.playerShadow.setPosition(this.player.x, this.player.y + 5).setDepth(this.player.y - 1);
    if (this.carriedObject) {
      if (this.carriedObjectMode === "steer") {
        this.carriedObject
          .setPosition(this.player.x, this.player.y + 7)
          .setDepth(this.player.y + 1)
          .setAngle(Phaser.Math.Clamp(this.player.body.velocity.x * 0.07, -9, 9));
      } else {
        this.carriedObject.setPosition(this.player.x, this.player.y - 21).setDepth(this.player.y + 5);
      }
    }
    this.updateCameraFocus(delta);
    this.updateEncounters();
    this.updateMemoryCameos();
    this.updateReactiveFoliage(time);
    this.updateChoices(time);
    this.updateDrops();
    this.updateGate();
  }

  updateCameraFocus(delta = 16.7) {
    if (!this.cameraFocus) return;
    if (this.ceremonyActive) {
      const response = questCameraResponse(delta, 70);
      this.cameraFocus.x = Phaser.Math.Linear(this.cameraFocus.x, this.gatePoint.x, response);
      this.cameraFocus.y = Phaser.Math.Linear(this.cameraFocus.y, this.gatePoint.y + 58, response);
      return;
    }
    const resident = this.model.activeStage
      ? this.residents.get(this.model.activeEncounterId)
      : null;
    const profile = this.activeVerbProfile();
    const travelChoice = ["steer", "climb"].includes(profile.response) ? this.choiceObjects[0] : null;
    const travelTarget = questCameraTravelTarget({
      playerX: this.player.x,
      playerY: this.player.y,
      velocityX: this.player.body?.velocity?.x,
      velocityY: this.player.body?.velocity?.y,
      velocityScale: profile.response === "steer" ? 0.3 : 0.24,
      maxLead: profile.response === "steer" ? 42 : 34
    });
    const residentFocus = resident ? {
      x: Phaser.Math.Linear(resident.point.x + profile.cameraSide, this.player.x, 0.42),
      y: resident.point.y - 24
    } : null;
    const targetX = travelChoice
      ? Phaser.Math.Linear(this.player.x, travelChoice.container.x, 0.58)
      : residentFocus?.x ?? travelTarget.x;
    const targetY = travelChoice
      ? Phaser.Math.Linear(this.player.y, travelChoice.container.y, 0.58)
      : residentFocus?.y ?? travelTarget.y;
    const response = questCameraResponse(delta, resident ? 86 : 74);
    this.cameraFocus.x = Phaser.Math.Linear(this.cameraFocus.x, targetX, response);
    this.cameraFocus.y = Phaser.Math.Linear(this.cameraFocus.y, targetY, response);
  }

  readGamepadVector() {
    const pads = globalThis.navigator?.getGamepads?.();
    if (!pads) return { x: 0, y: 0, magnitude: 0 };
    let pad = null;
    for (const candidate of pads) {
      if (candidate?.connected) {
        pad = candidate;
        break;
      }
    }
    if (!pad) return { x: 0, y: 0, magnitude: 0 };

    const pressed = index => Boolean(pad.buttons?.[index]?.pressed);
    const digitalX = Number(pressed(15)) - Number(pressed(14));
    const digitalY = Number(pressed(13)) - Number(pressed(12));
    const axisX = Number(pad.axes?.[0]) || 0;
    const axisY = Number(pad.axes?.[1]) || 0;
    return questAnalogVector({
      x: digitalX || axisX,
      y: digitalY || axisY
    });
  }

  updateMovement(delta = 16.7) {
    const body = this.player.body;
    if (this.time.now < this.playerActionLockedUntil) {
      body.setVelocity(0, 0);
      return;
    }
    if (this.isMovementLocked()) {
      body.setVelocity(0, 0);
      this.player.stop();
      return;
    }
    let x = 0;
    let y = 0;
    if (this.directionInput.left) x -= 1;
    if (this.directionInput.right) x += 1;
    if (this.directionInput.up) y -= 1;
    if (this.directionInput.down) y += 1;
    if (this.cursors.left.isDown || this.wasd.A.isDown) x -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) x += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) y -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) y += 1;

    if (!x && !y) {
      const gamepad = this.readGamepadVector();
      x = gamepad.x;
      y = gamepad.y;
    }

    if (!x && !y && this.pointerTarget) {
      const dx = this.pointerTarget.x - this.player.x;
      const dy = this.pointerTarget.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 4) this.pointerTarget = null;
      else {
        const steering = questPointerObstacleVector({
          playerX: this.player.x,
          playerY: this.player.y,
          targetX: this.pointerTarget.x,
          targetY: this.pointerTarget.y,
          obstacles: this.navigationObstacles
        });
        x = steering.x;
        y = steering.y;
      }
    } else if (x || y) {
      this.pointerTarget = null;
    }

    const profile = this.activeVerbProfile();
    if (profile.response === "steer" && (x || y)) {
      x = Phaser.Math.Clamp(x * 0.82, -0.82, 0.82);
      y = Phaser.Math.Clamp(Math.min(-0.46, y), -1, -0.46);
    }
    const length = Math.hypot(x, y) || 1;
    const inputStrength = Math.min(1, Math.hypot(x, y));
    const targetVelocityX = (x / length) * PLAYER_SPEED * profile.speed * inputStrength;
    const targetVelocityY = (y / length) * PLAYER_SPEED * profile.speed * inputStrength;
    const responseMs = profile.response === "steer" ? (x || y ? 170 : 126) : (x || y ? 92 : 68);
    const response = 1 - Math.exp(-Math.max(1, delta) / responseMs);
    const velocityX = Phaser.Math.Linear(body.velocity.x, targetVelocityX, response);
    const velocityY = Phaser.Math.Linear(body.velocity.y, targetVelocityY, response);
    body.setVelocity(Math.abs(velocityX) < 0.35 ? 0 : velocityX, Math.abs(velocityY) < 0.35 ? 0 : velocityY);

    const freeBookWorld = this.textures.exists("book-world-background");
    const gateApproach = this.model.phase === "gate" && this.player.y <= this.gatePoint.y + 128;
    const routeCenters = gateApproach
      ? [this.gatePoint.x]
      : pixelRoutePathsX(this.player.y, this.model.section.stopIndex);
    const lane = questRouteLaneSelection({
      x: this.pointerTarget?.x ?? this.player.x,
      centers: routeCenters,
      intentX: x,
      previousIndex: routeCenters.length > 1 ? this.routeLaneIndex : null
    });
    this.routeLaneIndex = routeCenters.length > 1 ? lane.index : null;
    const optionalRouteActive = routeCenters.length > 1 && lane.index > 0;
    if (optionalRouteActive && !this.optionalRouteActive) {
      this.bridge.onInteraction?.({ type: "optional-route" });
    }
    this.optionalRouteActive = optionalRouteActive;
    const activeMap = stopPixelMap(this.model.section);
    const visibleRouteWidth = chapterPixelProfile(this.model.section).route.pathWidth;
    const forwardAssist = activeMap.authorship === "route-authored" && Math.abs(x) < 0.05 && y < -0.05;
    const branchBoundary = questRouteBoundaryProfile({
      gateApproach,
      routeCount: routeCenters.length,
      authored: activeMap.authorship === "route-authored",
      pathWidth: visibleRouteWidth,
      forwardAssist,
      choiceCorridorRadius: this.model.activeStage ? this.choiceCorridorRadius : 0
    });
    const routeBoundary = stepQuestRouteBoundary({
      x: this.player.x,
      velocityX: body.velocity.x,
      center: lane.center,
      dt: delta / 1000,
      ...branchBoundary
    });
    if (!freeBookWorld) {
      this.player.x = routeBoundary.x;
      body.setVelocityX(routeBoundary.velocityX);
    }
    const forwardLimit = this.forwardMovementLimit();
    const forwardBoundary = stepQuestForwardBoundary({
      y: this.player.y,
      velocityY: body.velocity.y,
      limit: forwardLimit,
      dt: delta / 1000
    });
    this.player.y = forwardBoundary.y;
    body.setVelocityY(forwardBoundary.velocityY);
    const obstacleContact = resolveQuestObstacleContacts({
      x: this.player.x,
      y: this.player.y,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      obstacles: this.navigationObstacles
    });
    this.player.setPosition(obstacleContact.x, obstacleContact.y);
    body.setVelocity(obstacleContact.velocityX, obstacleContact.velocityY);
    const reconciledRoute = stepQuestRouteBoundary({
      x: this.player.x,
      velocityX: body.velocity.x,
      center: lane.center,
      ...branchBoundary
    });
    const reconciledForward = stepQuestForwardBoundary({
      y: this.player.y,
      velocityY: body.velocity.y,
      limit: forwardLimit
    });
    this.player.setPosition(freeBookWorld ? this.player.x : reconciledRoute.x, reconciledForward.y);
    body.setVelocity(freeBookWorld ? body.velocity.x : reconciledRoute.velocityX, reconciledForward.velocityY);
    if (!x && !y && Math.hypot(body.velocity.x, body.velocity.y) < 5) {
      this.player.stop();
      this.player.setFrame((PIXEL_BEASTIE_DIRECTIONS.indexOf(this.lastFacing) * PIXEL_BEASTIE_FRAMES_PER_DIRECTION));
      return;
    }
    const facingX = x || body.velocity.x;
    const facingY = y || body.velocity.y;
    const facing = Math.abs(facingX) > Math.abs(facingY)
      ? (facingX < 0 ? "left" : "right")
      : (facingY < 0 ? "up" : "down");
    this.lastFacing = facing;
    this.player.play(`beastie-${facing}`, true);
  }

  updateEncounters() {
    const activeId = this.model.activeEncounterId;
    if (!activeId || this.model.activeStage) return;
    const resident = this.residents.get(activeId);
    if (!resident) return;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, resident.point.x, resident.point.y);
    const reachScale = Math.max(1, Number(this.model.section.rewardBonuses?.interactionRadius || 0.82) / 0.82);
    if (distance <= ENCOUNTER_DISTANCE * reachScale && this.encounterLatch !== activeId) {
      this.encounterLatch = activeId;
      this.encounterAttemptAt = this.time.now;
      this.pointerTarget = null;
      this.bridge.onEncounter?.(activeId);
    }
    if (
      distance <= ENCOUNTER_DISTANCE * reachScale
      && this.encounterLatch === activeId
      && this.time.now - this.encounterAttemptAt > 420
    ) {
      // React may still have been committing the previous encounter when the
      // first contact arrived. Re-arm until an active stage confirms receipt.
      this.encounterLatch = null;
    }
    if (distance > (ENCOUNTER_DISTANCE * reachScale) + 18 && this.encounterLatch === activeId) {
      this.encounterLatch = null;
      this.encounterAttemptAt = 0;
    }
  }

  updateMemoryCameos() {
    for (const cameo of this.memoryCameos) {
      if (cameo.greeted || !cameo.sprite?.active) continue;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, cameo.sprite.x, cameo.sprite.y);
      if (distance > 46) continue;
      cameo.greeted = true;
      this.bridge.onInteraction?.({
        type: "memory-greeting",
        sourceStopId: cameo.stopId,
        speaker: cameo.story?.speaker || null
      });
      cameo.sprite.play(`${cameo.key}-celebrate`, true);
      this.playMemoryStory(cameo);
      this.playSfx("seedwake-magic", 0.12);
      if (!this.model.reducedMotion) {
        this.tweens.add({
          targets: cameo.sprite,
          y: cameo.sprite.y - 7,
          duration: 140,
          yoyo: true,
          ease: "Back.easeOut"
        });
        const sparkle = this.add.sprite(cameo.sprite.x, cameo.sprite.y - 13, "seedwake-spark")
          .setScale(0.72)
          .setDepth(cameo.sprite.y + 20);
        sparkle.play({ key: "seedwake-spark-burst", ignoreIfPlaying: true });
      }
      this.time.delayedCall(560, () => {
        if (cameo.sprite.active) cameo.sprite.play(`${cameo.key}-idle`, true);
      });
    }
  }

  clearMemoryStory() {
    const moment = this.memoryStoryMoment;
    if (!moment) return;
    moment.timer?.remove(false);
    for (const object of moment.objects) {
      if (object?.active) this.destroyTweenedObject(object);
    }
    this.memoryStoryMoment = null;
  }

  playMemoryStory(cameo) {
    if (!cameo?.story || !cameo.sprite?.active) return;
    this.clearMemoryStory();
    const { story } = cameo;
    const bubbleX = Phaser.Math.Clamp(cameo.sprite.x, 126, PIXEL_WORLD.width - 126);
    const bubbleY = cameo.sprite.y - 86;
    const panel = this.add.graphics();
    panel.fillStyle(0x203a34, 0.96);
    panel.lineStyle(2, 0xf1ce66, 1);
    panel.fillRoundedRect(-118, -45, 236, 84, 7);
    panel.strokeRoundedRect(-118, -45, 236, 84, 7);
    panel.fillStyle(0x203a34, 0.96);
    panel.fillTriangle(-9, 39, 9, 39, 0, 49);
    const speaker = this.add.text(-105, -37, story.speaker, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#f7d878"
    });
    const line = this.add.text(-105, -20, story.line, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "10px",
      color: "#fff9e6",
      backgroundColor: "#203a34",
      wordWrap: { width: 210 },
      lineSpacing: 1
    });
    const change = this.add.text(-105, 16, story.change, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "8px",
      fontStyle: "bold",
      color: "#bce5c8",
      wordWrap: { width: 210 }
    });
    const bubble = this.add.container(bubbleX, bubbleY, [panel, speaker, line, change])
      .setDepth(4200);
    const routeX = pixelRouteX(cameo.sprite.y, this.model.section.stopIndex);
    const markers = Array.from({ length: 4 }, (_, index) => {
      const amount = (index + 1) / 5;
      return this.add.circle(
        Phaser.Math.Linear(cameo.sprite.x, routeX, amount),
        cameo.sprite.y + (index * 3),
        index === 3 ? 4 : 3,
        0xf2cf65,
        0.86
      ).setDepth(cameo.sprite.y + 4);
    });
    const memoryMoment = { objects: [bubble, ...markers], timer: null };
    this.memoryStoryMoment = memoryMoment;

    if (!this.model.reducedMotion) {
      bubble.setAlpha(0).setScale(0.92);
      this.tweens.add({ targets: bubble, alpha: 1, scaleX: 1, scaleY: 1, duration: 180, ease: "Back.easeOut" });
      markers.forEach((marker, index) => {
        marker.setAlpha(0.18);
        this.tweens.add({ targets: marker, alpha: 1, scaleX: 1.35, scaleY: 1.35, delay: index * 90, duration: 260, yoyo: true });
      });
      if (cameo.landmark?.active) {
        this.tweens.add({
          targets: cameo.landmark,
          scaleX: cameo.landmark.scaleX * 1.045,
          scaleY: cameo.landmark.scaleY * 1.045,
          duration: 210,
          yoyo: true,
          ease: "Sine.easeOut"
        });
      }
    }
    memoryMoment.timer = this.time.delayedCall(4400, () => {
      if (this.memoryStoryMoment === memoryMoment) this.clearMemoryStory();
    });
  }

  updateReactiveFoliage(time) {
    if (this.model.reducedMotion) return;
    for (const foliage of this.reactiveFoliage) {
      const { sprite } = foliage;
      if (!sprite?.active || time - foliage.lastRustleAt < 720) continue;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (distance > 19) continue;
      foliage.lastRustleAt = time;
      this.tweens.killTweensOf(sprite);
      sprite.setPosition(foliage.baseX, foliage.baseY).setAngle(0);
      this.tweens.add({
        targets: sprite,
        x: foliage.baseX + (this.player.x < sprite.x ? 3 : -3),
        angle: this.player.x < sprite.x ? 9 : -9,
        duration: 90,
        yoyo: true,
        repeat: 1,
        ease: "Sine.easeOut",
        onComplete: () => sprite.setPosition(foliage.baseX, foliage.baseY).setAngle(0)
      });
      for (let index = 0; index < 3; index += 1) {
        const fragment = this.add.image(sprite.x, sprite.y - 5, "seedwake-grass-rustle", (index * 2) % 6)
          .setDepth(sprite.y + 10)
          .setScale(0.72);
        this.tweens.add({
          targets: fragment,
          x: sprite.x + (index - 1) * 11,
          y: sprite.y - 12 - index * 3,
          angle: (index - 1) * 42,
          alpha: 0,
          duration: 320 + index * 45,
          ease: "Quad.easeOut",
          onComplete: () => fragment.destroy()
        });
      }
    }
  }

  updateToolChoice(choice, time, distance) {
    if (distance > choice.radius) {
      choice.toolStartedAt = null;
      choice.nextToolParticleAt = null;
      choice.glow.setAlpha(0.14).setScale(1);
      return false;
    }
    const holdMs = Math.max(500, Number(choice.item.toolHoldMs) || 850);
    if (choice.toolStartedAt == null) {
      choice.toolStartedAt = time;
      choice.nextToolParticleAt = time;
      this.pointerTarget = null;
      this.player.body.setVelocity(0, 0);
      this.playerActionLockedUntil = time + holdMs;
      this.player.play(`beastie-action-tool-${this.lastFacing}`, true);
    }
    const progress = Math.min(1, (time - choice.toolStartedAt) / holdMs);
    choice.glow.setAlpha(this.model.reducedMotion ? 0.46 : 0.18 + (progress * 0.5));
    if (!this.model.reducedMotion) {
      choice.glow.setScale(1 + (progress * 0.28));
      if (time >= choice.nextToolParticleAt) {
        choice.nextToolParticleAt = time + 145;
        const fragment = this.add.sprite(choice.container.x, choice.container.y - 4, "seedwake-leaf", Math.floor(time / 145) % 9)
          .setScale(0.34)
          .setTint(0xd8a56d)
          .setDepth(choice.container.y + 18);
        this.tweens.add({
          targets: fragment,
          x: fragment.x + (Math.random() < 0.5 ? -12 : 12),
          y: fragment.y - 15,
          angle: Math.random() < 0.5 ? -70 : 70,
          alpha: 0,
          duration: 310,
          ease: "Quad.easeOut",
          onComplete: () => fragment.destroy()
        });
      }
    }
    if (progress < 1) return false;
    choice.toolStartedAt = null;
    this.choiceCooldownUntil = time + 780;
    this.bridge.onChoice?.(choice.id);
    return true;
  }

  updateSignalChoice(choice, time, distance) {
    const idleAlpha = this.model.reducedMotion ? 0.78 : 0.56;
    if (distance > choice.radius) {
      choice.signalStartedAt = null;
      choice.nextSignalPulseAt = null;
      choice.glow.setAlpha(0.14).setScale(1);
      this.choiceStageDecor?.setAlpha(idleAlpha);
      return false;
    }
    const holdMs = Math.max(520, Number(choice.item.signalHoldMs) || 700);
    if (choice.signalStartedAt == null) {
      choice.signalStartedAt = time;
      choice.nextSignalPulseAt = time;
      this.pointerTarget = null;
      this.player.body.setVelocity(0, 0);
      this.playerActionLockedUntil = time + holdMs;
      this.player.play(`beastie-action-signal-${this.lastFacing}`, true);
    }
    const progress = Math.min(1, (time - choice.signalStartedAt) / holdMs);
    choice.glow.setAlpha(0.28 + (progress * 0.46));
    this.choiceStageDecor?.setAlpha(idleAlpha + (progress * (1 - idleAlpha)));
    if (!this.model.reducedMotion) {
      choice.glow.setScale(1 + (progress * 0.34));
      if (time >= choice.nextSignalPulseAt) {
        choice.nextSignalPulseAt = time + 150;
        const resident = this.residents.get(this.model.activeEncounterId);
        const pulse = this.add.sprite(choice.container.x, choice.container.y - 5, "seedwake-spark", Math.floor(time / 150) % 9)
          .setScale(0.32)
          .setTint(chapterPixelProfile(this.model.section).gateTint || 0xf2dc83)
          .setDepth(choice.container.y + 20);
        this.tweens.add({
          targets: pulse,
          x: resident?.point.x ?? choice.container.x,
          y: (resident?.point.y ?? choice.container.y) - 12,
          alpha: 0,
          duration: 300,
          ease: "Sine.easeIn",
          onComplete: () => pulse.destroy()
        });
      }
    }
    if (progress < 1) return false;
    choice.signalStartedAt = null;
    this.choiceCooldownUntil = time + 720;
    this.bridge.onChoice?.(choice.id);
    return true;
  }

  updateClimbChoice(choice, time, distance) {
    if (distance > choice.radius) {
      choice.climbStartedAt = null;
      choice.nextClimbChipAt = null;
      choice.glow.setAlpha(0.14).setScale(1);
      this.player.setAngle(0);
      return false;
    }
    const holdMs = Math.max(420, Number(choice.item.climbHoldMs) || 520);
    if (choice.climbStartedAt == null) {
      choice.climbStartedAt = time;
      choice.nextClimbChipAt = time;
      this.pointerTarget = null;
      this.player.body.setVelocity(0, 0);
      this.playerActionLockedUntil = time + holdMs;
      this.player.play(`beastie-action-climb-${this.lastFacing}`, true);
    }
    const progress = Math.min(1, (time - choice.climbStartedAt) / holdMs);
    choice.glow.setAlpha(0.24 + (progress * 0.5));
    if (!this.model.reducedMotion) {
      choice.glow.setScale(1 + (progress * 0.3));
      this.player.setAngle(Math.sin(progress * Math.PI * 4) * 4);
      if (time >= choice.nextClimbChipAt) {
        choice.nextClimbChipAt = time + 140;
        const chip = this.add.sprite(choice.container.x, choice.container.y + 4, "seedwake-leaf", Math.floor(time / 140) % 9)
          .setScale(0.28)
          .setTint(0x9a7358)
          .setDepth(choice.container.y + 18);
        this.tweens.add({
          targets: chip,
          x: chip.x + (Math.random() < 0.5 ? -10 : 10),
          y: chip.y + 12,
          alpha: 0,
          duration: 280,
          ease: "Quad.easeIn",
          onComplete: () => chip.destroy()
        });
      }
    }
    if (progress < 1) return false;
    choice.climbStartedAt = null;
    this.player.setAngle(0);
    this.choiceCooldownUntil = time + 700;
    this.bridge.onChoice?.(choice.id);
    return true;
  }

  updateChoices(time) {
    if (this.model.activeStage?.rhythm || !this.choiceObjects.length || time < this.choiceCooldownUntil) return;
    for (const choice of this.choiceObjects) {
      if (choice.sortPhase != null && !this.model.reducedMotion) {
        const travel = (((time * 0.018) + choice.sortPhase) % 20) - 10;
        choice.container.x = choice.sortOriginX + (choice.sortRightX * travel);
        choice.container.y = choice.sortOriginY + (choice.sortRightY * travel);
        choice.x = choice.container.x;
        choice.y = choice.container.y;
      }
      const choiceX = choice.container.x;
      const choiceY = choice.container.y;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, choiceX, choiceY);
      if (choice.item.role === "tool-work") {
        if (this.updateToolChoice(choice, time, distance)) return;
        continue;
      }
      if (choice.item.role === "signal-pad") {
        if (this.updateSignalChoice(choice, time, distance)) return;
        continue;
      }
      if (choice.item.role === "climb-hold") {
        if (this.updateClimbChoice(choice, time, distance)) return;
        continue;
      }
      if (distance <= choice.radius && !this.choiceInside.has(choice.id)) {
        this.choiceInside.add(choice.id);
        this.pointerTarget = null;
        this.player.body.setVelocity(0, 0);
        const angle = Phaser.Math.Angle.Between(choiceX, choiceY, this.player.x, this.player.y);
        const shortRelease = ["turn-node", "steer-gate"].includes(choice.item.role);
        const clearDistance = choice.radius + (shortRelease ? 4 : 15);
        this.player.x += Math.cos(angle) * clearDistance;
        this.player.y += Math.sin(angle) * clearDistance;
        this.choiceCooldownUntil = time + 780;
        this.bridge.onChoice?.(choice.id);
        return;
      }
      if (distance > choice.radius + 10) this.choiceInside.delete(choice.id);
    }
  }

  updateDrops() {
    const collectionScale = Math.max(1, Number(this.model.section.rewardBonuses?.collectionRadius || 0.72) / 0.72);
    for (const [id, sprite] of this.dropObjects) {
      if (!sprite.visible) continue;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (distance > DROP_DISTANCE * collectionScale) continue;
      sprite.setVisible(false);
      this.burstCache(sprite);
      this.playSfx("seedwake-pickup", 0.24);
      const discovery = sprite.getData("optionalDiscovery") || null;
      if (discovery) this.playDiscoveryMoment(sprite, discovery);
      this.bridge.onDrop?.(id, {
        cache: Boolean(sprite.getData("cacheBurst")),
        discovery
      });
      if (!this.model.reducedMotion) {
        const sparkle = this.add.sprite(sprite.x, sprite.y, "seedwake-spark").setDepth(sprite.y + 20);
        sparkle.play({ key: "seedwake-spark-burst", ignoreIfPlaying: true });
      }
    }
  }

  playDiscoveryMoment(cacheSprite, discovery) {
    if (!cacheSprite || !discovery) return;
    const chapterId = this.model.section.chapter?.id;
    const profile = chapterPixelProfile(this.model.section);
    const speaker = String(discovery.title || "").split(/[\u2019']/)[0].trim().toLowerCase();
    const resident = [...this.residents.values()].find(entry => (
      String(entry.encounter?.friend || "").trim().toLowerCase() === speaker
    ));
    const key = resident?.key || questPixelResidentKey(
      chapterId,
      speaker,
      this.model.section.world
    );
    const centreSide = cacheSprite.x < PIXEL_WORLD.width / 2 ? 1 : -1;
    const echoX = cacheSprite.x + (centreSide * 30);
    const echoY = cacheSprite.y - 8;
    const glow = this.add.circle(echoX, echoY - 8, 24, profile.gateTint || 0xffdf82, 0.22)
      .setDepth(cacheSprite.y + 8);
    const echo = this.add.sprite(echoX, echoY, key)
      .setOrigin(0.5, 0.88)
      .setScale(questPixelResidentWorldScale(key, 1.26))
      .setAlpha(this.model.reducedMotion ? 0.92 : 0)
      .setTint(profile.residentTint || 0xffffff)
      .setDepth(cacheSprite.y + 10)
      .play(`${key}-celebrate`);
    const item = this.add.container(cacheSprite.x - (centreSide * 16), cacheSprite.y - 17)
      .setDepth(cacheSprite.y + 11)
      .setScale(this.model.reducedMotion ? 0.86 : 0.18)
      .setAlpha(this.model.reducedMotion ? 1 : 0);
    const itemVisual = addChoiceArt(this, item, {
      shape: DISCOVERY_MOMENT_SHAPES[chapterId] || "echo-orb",
      label: ""
    }, 0);
    itemVisual.shadow.setVisible(false);
    itemVisual.labelPlate.setVisible(false);
    itemVisual.glow.setAlpha(0.34);

    const moment = { objects: [glow, echo, item], timer: null };
    const finish = () => {
      for (const object of moment.objects) {
        if (object?.active) this.destroyTweenedObject(object);
      }
      this.discoveryMoments = this.discoveryMoments.filter(entry => entry !== moment);
    };
    moment.timer = this.time.delayedCall(this.model.reducedMotion ? 1150 : 1320, () => {
      if (this.model.reducedMotion) {
        finish();
        return;
      }
      this.tweens.add({
        targets: [glow, echo, item],
        alpha: 0,
        y: "-=4",
        duration: 260,
        ease: "Sine.easeIn",
        onComplete: finish
      });
    });
    this.discoveryMoments.push(moment);

    const material = questChapterMaterialSfxEntry(chapterId);
    if (material) this.playSfx(material.key, 0.12);
    if (this.model.reducedMotion) return;
    this.tweens.add({ targets: glow, alpha: { from: 0.12, to: 0.5 }, scale: { from: 0.7, to: 1.18 }, duration: 520, yoyo: true, repeat: 1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: echo, alpha: 0.96, y: echoY - 5, duration: 220, ease: "Back.easeOut" });
    this.tweens.add({ targets: item, alpha: 1, scale: 0.86, angle: 360, duration: 420, ease: "Back.easeOut" });
  }

  burstCache(sprite) {
    const burstKind = sprite.getData("cacheBurst");
    if (!burstKind || this.model.reducedMotion) return;
    const texture = burstKind === "wood" ? "seedwake-cache-wood-burst" : "seedwake-cache-pot-burst";
    for (let index = 0; index < 6; index += 1) {
      const angle = (-Math.PI * 0.88) + (index * (Math.PI * 0.76 / 5));
      const distance = 15 + (index % 3) * 5;
      const fragment = this.add.image(sprite.x, sprite.y - 3, texture, index)
        .setDepth(sprite.y + 18)
        .setScale(0.72 + (index % 2) * 0.14);
      this.tweens.add({
        targets: fragment,
        x: sprite.x + Math.cos(angle) * distance,
        y: sprite.y + Math.sin(angle) * distance + 8,
        angle: (index % 2 ? 1 : -1) * (70 + index * 18),
        alpha: 0,
        duration: 360 + index * 28,
        ease: "Quad.easeOut",
        onComplete: () => fragment.destroy()
      });
    }
  }

  updateGate() {
    if (this.gateLatch || this.model.phase !== "gate") return;
    if (!questGateCrossingReached({
      playerX: this.player.x,
      playerY: this.player.y,
      gateX: this.gatePoint.x,
      gateY: this.gatePoint.y
    })) return;
    this.gateLatch = true;
    this.playFeedback("success");
    this.pointerTarget = null;
    this.player.body.setVelocity(0, 0);
    this.player.play("beastie-up", true);
    this.tweens.add({
      targets: this.player,
      y: this.gatePoint.y - 46,
      duration: 340,
      ease: "Sine.easeInOut"
    });
    this.cameras.main.flash(260, 246, 221, 126, false);
    this.time.delayedCall(360, () => this.bridge.onGate?.());
  }

  getPlayerPosition() {
    return this.player
      ? { x: this.player.x, y: this.player.y, progress: pixelToProgress(this.player.y) }
      : null;
  }

  getDiagnostics() {
    return {
      type: "runtime-health",
      tierId: "pixel",
      displayObjects: this.children?.list?.filter(item => item?.active !== false).length || 0,
      tweens: this.tweens?.getTweens?.().length || 0,
      textures: this.textures?.getTextureKeys?.().length || 0,
      activeChoices: this.choiceObjects.length,
      completions: this.completionObjects.size
    };
  }

  getLayoutSnapshot() {
    const resident = this.model?.activeEncounterId
      ? this.residents.get(this.model.activeEncounterId)
      : null;
    const view = this.cameras?.main?.worldView;
    const map = stopPixelMap(this.model.section);
    return {
      map: {
        stopId: this.model.section.stopId,
        authorship: map.authorship,
        topology: map.topology,
        routeSignature: [0.1, 0.3, 0.5, 0.7, 0.9].map(progress => (
          Math.round(pixelRouteX(1060 - (progress * 980), this.model.section.stopIndex))
        )),
        landmarkAnchor: map.landmarkAnchor
      },
      player: this.player ? {
        x: this.player.x,
        y: this.player.y,
        visible: this.player.visible,
        active: this.player.active,
        alpha: this.player.alpha,
        frame: this.player.frame?.name ?? this.player.frame?.index ?? null,
        animation: this.player.anims?.currentAnim?.key || null,
        animationPlaying: Boolean(this.player.anims?.isPlaying)
      } : null,
      resident: resident?.point ? { x: resident.point.x, y: resident.point.y } : null,
      encounter: {
        activeId: this.model?.activeEncounterId || null,
        latch: this.encounterLatch,
        attemptAt: this.encounterAttemptAt
      },
      choices: this.choiceObjects.map(choice => {
        const bounds = choice.container.getBounds?.();
        return {
          id: choice.id,
          x: choice.container.x,
          y: choice.container.y,
          radius: choice.radius,
          bounds: bounds ? {
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom
          } : null
        };
      }),
      choiceCorridorRadius: this.choiceCorridorRadius,
      decor: this.choiceStageDecor
        ? { x: this.choiceStageDecor.x, y: this.choiceStageDecor.y }
        : null,
      camera: view
        ? {
            left: view.x,
            top: view.y,
            right: view.right,
            bottom: view.bottom,
            zoom: this.cameras.main.zoom
          }
        : null
    };
  }

  shutdown() {
    if (this.sceneShuttingDown) return;
    this.sceneShuttingDown = true;
    if (this.ceremonyActive) this.clearCeremony(false);
    this.clearMemoryStory();
    for (const moment of this.discoveryMoments) {
      moment.timer?.remove(false);
      for (const object of moment.objects) {
        if (object?.active) this.destroyTweenedObject(object);
      }
    }
    this.discoveryMoments = [];
    this.gateGlowTween?.stop();
    this.gateGlowTween?.remove();
    this.gateGlowTween = null;
    // React can unmount while Phaser is still booting, or after Phaser has
    // already released the scene systems. In both cases shutdown must remain
    // idempotent and must not turn a harmless route change into an error-boundary
    // recovery.
    this.scale?.off?.("resize", this.handleResize, this);
    window.clearTimeout(this.resizeRebuildTimer);
    stopQuestActionSfx();
  }
}

export function createQuestPixelRuntime(parent, initialModel, bridge = {}) {
  const instanceId = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
  const scene = new QuestPixelScene({ instanceId, model: initialModel, bridge });
  const game = new Phaser.Game({
    // Pixel mode is deliberately the low-overhead authored path. Rich 3D owns
    // WebGL; opening a second WebGL context here only adds shader/context boot
    // cost without improving this 2D sprite scene.
    type: Phaser.CANVAS,
    parent,
    width: Math.max(320, parent.clientWidth || 960),
    height: Math.max(320, parent.clientHeight || 540),
    // Phaser 4's Canvas renderer deliberately runs this low-overhead pixel
    // scene at CSS-pixel resolution. There is no supported `resolution` game
    // config in Phaser 4; an old inert key falsely claimed a 2x DPR cap.
    backgroundColor: chapterPixelProfile(initialModel.section).background,
    transparent: false,
    render: {
      antialias: false,
      smoothPixelArt: false,
      pixelArt: true,
      roundPixels: true,
      powerPreference: "high-performance"
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    // Pixel SFX use the shared, duck-aware HTMLAudio pool. Keeping Phaser's
    // separate WebAudio/HTML5 managers would ship two audio stacks.
    audio: { noAudio: true },
    scene
  });

  return {
    game,
    setModel(model) {
      scene.setModel(model);
    },
    getPlayerPosition() {
      return scene.getPlayerPosition();
    },
    getDiagnostics() {
      return scene.getDiagnostics();
    },
    getLayoutSnapshot() {
      return scene.getLayoutSnapshot();
    },
    move(direction) {
      if (!scene.player || scene.isMovementLocked()) return;
      const amount = 42;
      const vectors = {
        left: [-amount, 0],
        right: [amount, 0],
        up: [0, -amount],
        down: [0, amount]
      };
      const [x, y] = vectors[direction] || [0, 0];
      scene.setPointerTarget(scene.player.x + x, scene.player.y + y);
    },
    startMove(direction) {
      if (!Object.hasOwn(scene.directionInput, direction)) return;
      scene.pointerTarget = null;
      scene.directionInput[direction] = true;
    },
    stopMove(direction) {
      if (!Object.hasOwn(scene.directionInput, direction)) return;
      scene.directionInput[direction] = false;
    },
    playFeedback(kind, choiceId) {
      scene.playFeedback(kind, choiceId);
    },
    destroy() {
      scene.shutdown();
      game.destroy(true);
    }
  };
}
