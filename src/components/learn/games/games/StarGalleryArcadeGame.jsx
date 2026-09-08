import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  playCelebrationFanfare,
  playCorrectChime,
  playSoftBuzz,
  playStarChime,
  playTapSound
} from "../../../../utils/audio/gameSfx.js";
import {
  acceptedRepairAnswers,
  completedSentenceForRepair,
  isAcceptedRepairAnswer,
  starGalleryLadder,
  starGalleryStars
} from "../../../../utils/starGalleryRounds.js";
import { cancelSpeech, speak } from "../../../../utils/learnGamesAudio.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import {
  createRenderer,
  createScene,
  createPerspectiveCamera,
  attachResize,
  createFrameLoop,
  attachContextLossGuard,
  detectQualityTier,
  applyQualityTier,
  shadowMapForTier,
  particleCountForTier,
  QUALITY_TIERS,
  hasSeenOnboarding,
  markOnboardingSeen,
  disposeRenderer,
  disposeObject
} from "../shared/threeShell.js";
import {
  createPausableFrameTimer,
  neutralizeArcadeInput
} from "../shared/frameTiming.js";
import { isPrimaryActionKey, laneDirectionForKey, verticalDirectionForKey } from "../shared/premiumGameStandard.js";
import { createArcadePremiumRenderPipeline } from "../shared/arcadePremiumRender.js";

// Scalable console-style architecture note for future learners: pooled meshes
// and allocation-free frame updates preserve responsive input, while the
// quality-tiered renderer supplies modern surface response and image quality.
// Silhouette economy is intentional; visibly flat lighting is not.

const CONFIG = {
  "star-gallery": {
    title: "Sentence Grove",
    ladder: starGalleryLadder,
    stars: starGalleryStars
  }
};

const WORLD_CONFIG = {
  meadow: {
    name: "Meadow Pals",
    sky: "#78c7ff",
    fog: "#90cdf4",
    ground: "#3f9a58",
    ground2: "#75c963",
    road: "#d7bf8e",
    trim: "#6b4931",
    frame: "#f4bc45",
    accent: "#42ffe4",
    accent2: "#ffe45c",
    danger: "#ff5f91",
    vehicle: "#a26835",
    vehicle2: "#1cc7c9",
    costume: "#55b95d"
  },
  dino: {
    name: "Dino Pals",
    sky: "#6e56a8",
    fog: "#7b536b",
    ground: "#3d744f",
    ground2: "#81643d",
    road: "#a76431",
    trim: "#3f2e27",
    frame: "#f0a23a",
    accent: "#55ffe1",
    accent2: "#ff9f45",
    danger: "#ff664d",
    vehicle: "#46a95f",
    vehicle2: "#d27a34",
    costume: "#d98b38"
  },
  moonwood: {
    name: "Moonwood Pals",
    sky: "#17103f",
    fog: "#271c58",
    ground: "#273357",
    ground2: "#49316f",
    road: "#7f69c9",
    trim: "#31204c",
    frame: "#c79cff",
    accent: "#9e7cff",
    accent2: "#7cf5ff",
    danger: "#ff72d6",
    vehicle: "#5b2f7e",
    vehicle2: "#45d7ff",
    costume: "#7c43c8"
  }
};

const DIFFICULTY = {
  easy: { accel: 17, maxSpeed: 15.5, turn: 2.75, friction: 4.7, hazards: 2, hitPenalty: 28, wrongPenalty: 45 },
  medium: { accel: 19, maxSpeed: 17.5, turn: 3.05, friction: 4.4, hazards: 3, hitPenalty: 38, wrongPenalty: 58 },
  hard: { accel: 21, maxSpeed: 19.5, turn: 3.35, friction: 4.15, hazards: 4, hitPenalty: 50, wrongPenalty: 72 }
};

const MAP_BOUNDS = { minX: -118, maxX: 118, minZ: -88, maxZ: 88 };
const ANSWER_START_CLEARANCE = {
  minDistance: 34,
  frontDistance: 62,
  frontHalfWidth: 24,
  behindBuffer: -6
};

const FOREST_TOKEN_SLOTS = [
  [-94, -64], [-58, -74], [-18, -66], [26, -78], [72, -64], [104, -36],
  [-102, -24], [-70, -28], [-34, -38], [10, -30], [48, -42], [88, -18],
  [-96, 8], [-56, 2], [-15, -2], [24, 10], [62, 4], [100, 22],
  [-84, 42], [-42, 34], [0, 48], [38, 38], [78, 52], [106, 68],
  [-106, 70], [-62, 68], [-22, 78], [20, 70], [58, 78], [92, 42]
];

const SPREAD_FOREST_TOKEN_SLOTS = FOREST_TOKEN_SLOTS.map((_, index) => FOREST_TOKEN_SLOTS[(index * 7 + 13) % FOREST_TOKEN_SLOTS.length]);

const WORLD_PLACEMENT = {
  meadow: {
    start: [0, 66],
    yaw: Math.PI,
    frame: [0, 78],
    hazards: [
      { cx: -42, cz: -14, rx: 18, rz: 12, speed: 0.42, phase: 0.1 },
      { cx: 46, cz: 16, rx: 20, rz: 14, speed: 0.5, phase: 2.5 },
      { cx: -70, cz: 48, rx: 12, rz: 10, speed: 0.58, phase: 4.1 },
      { cx: 70, cz: -50, rx: 14, rz: 12, speed: 0.64, phase: 1.3 }
    ]
  },
  dino: {
    start: [0, 66],
    yaw: Math.PI,
    frame: [0, 78],
    hazards: [
      { cx: -38, cz: -8, rx: 24, rz: 14, speed: 0.48, phase: 0.8 },
      { cx: 46, cz: -24, rx: 22, rz: 18, speed: 0.58, phase: 2.2 },
      { cx: -72, cz: 34, rx: 16, rz: 13, speed: 0.68, phase: 4.4 },
      { cx: 74, cz: 50, rx: 18, rz: 11, speed: 0.72, phase: 1.4 }
    ]
  },
  moonwood: {
    start: [0, 66],
    yaw: Math.PI,
    frame: [0, 78],
    hazards: [
      { cx: -42, cz: -6, rx: 24, rz: 15, speed: 0.42, phase: 0.3 },
      { cx: 42, cz: -8, rx: 20, rz: 20, speed: 0.52, phase: 2.8 },
      { cx: -76, cz: 40, rx: 14, rz: 12, speed: 0.68, phase: 4.6 },
      { cx: 76, cz: 44, rx: 16, rz: 12, speed: 0.72, phase: 1.1 }
    ]
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeOut(value) {
  return 1 - Math.pow(1 - clamp(value, 0, 1), 3);
}

function soundAllowed(options) {
  return options.getSound ? options.getSound() : options.isSoundEnabled;
}

function playSfx(options, fn) {
  if (!soundAllowed(options)) return;
  try {
    fn();
  } catch {
    // Sound is polish, never a gameplay dependency.
  }
}

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.04,
    envMapIntensity: 0.82,
    dithering: true,
    ...extra
  });
}

function emissiveMaterial(color, intensity = 0.7) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.62,
    metalness: 0.08,
    envMapIntensity: 0.88,
    dithering: true
  });
}

function rotate(values, amount) {
  if (!values.length) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function repairForState(state) {
  return state.level?.items[state.itemIndex]?.repairs[0] || null;
}

function themeFor(state) {
  return WORLD_CONFIG[state.level?.world || "meadow"] || WORLD_CONFIG.meadow;
}

function placementFor(state) {
  return WORLD_PLACEMENT[state.level?.world || "meadow"] || WORLD_PLACEMENT.meadow;
}

function settingsFor(state) {
  return DIFFICULTY[state.level?.difficulty || state.difficulty] || DIFFICULTY.easy;
}

function distance2(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function mapWidth(bounds = MAP_BOUNDS) {
  return bounds.maxX - bounds.minX;
}

function mapDepth(bounds = MAP_BOUNDS) {
  return bounds.maxZ - bounds.minZ;
}

function clampPointToBounds(point, bounds = MAP_BOUNDS, pad = 2.8) {
  return {
    x: clamp(point.x, bounds.minX + pad, bounds.maxX - pad),
    z: clamp(point.z, bounds.minZ + pad, bounds.maxZ - pad)
  };
}

function seededOffset(seed, scale = 1) {
  return Math.sin(seed * 12.9898 + 78.233) * scale;
}

function slotPosition(slot, stage, itemIndex, index) {
  const jitterX = seededOffset(stage * 19 + itemIndex * 7 + index * 3, 4.6);
  const jitterZ = seededOffset(stage * 23 + itemIndex * 11 + index * 5, 4.2);
  const clamped = clampPointToBounds({ x: slot[0] + jitterX, z: slot[1] + jitterZ }, MAP_BOUNDS, 8);
  return [clamped.x, clamped.z];
}

function pointXZ(point) {
  return Array.isArray(point) ? { x: point[0], z: point[1] } : { x: point.x, z: point.z };
}

function answerStartClearance(position, placement) {
  const point = pointXZ(position);
  const startX = placement.start[0];
  const startZ = placement.start[1];
  const dx = point.x - startX;
  const dz = point.z - startZ;
  const forward = { x: Math.sin(placement.yaw), z: Math.cos(placement.yaw) };
  const right = { x: Math.cos(placement.yaw), z: -Math.sin(placement.yaw) };
  const distance = Math.hypot(dx, dz);
  const forwardDistance = dx * forward.x + dz * forward.z;
  const lateralDistance = Math.abs(dx * right.x + dz * right.z);
  const tooClose = distance < ANSWER_START_CLEARANCE.minDistance;
  const inFrontLane =
    forwardDistance > ANSWER_START_CLEARANCE.behindBuffer &&
    forwardDistance < ANSWER_START_CLEARANCE.frontDistance &&
    lateralDistance < ANSWER_START_CLEARANCE.frontHalfWidth;

  return {
    distance,
    forwardDistance,
    lateralDistance,
    tooClose,
    inFrontLane,
    clear: !tooClose && !inFrontLane
  };
}

function answerPositionIsClear(position, placement) {
  return answerStartClearance(position, placement).clear;
}

function assignTokenPositions(entries, slots, state) {
  const placement = placementFor(state);
  const usedSlots = new Set();
  const positions = new Array(entries.length);
  const placementOrder = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      if (a.entry.isCorrect === b.entry.isCorrect) return a.index - b.index;
      return a.entry.isCorrect ? -1 : 1;
    });

  for (const { entry, index } of placementOrder) {
    let selected = null;
    for (let offset = 0; offset < slots.length; offset += 1) {
      const slotIndex = (index + offset) % slots.length;
      if (usedSlots.has(slotIndex)) continue;
      const position = slotPosition(slots[slotIndex], state.stage, state.itemIndex, index + entry.copy);
      selected ||= { slotIndex, position };
      if (!entry.isCorrect || answerPositionIsClear(position, placement)) {
        selected = { slotIndex, position };
        break;
      }
    }
    if (!selected) {
      const slotIndex = index % slots.length;
      selected = {
        slotIndex,
        position: slotPosition(slots[slotIndex], state.stage, state.itemIndex, index + entry.copy)
      };
    }
    usedSlots.add(selected.slotIndex);
    positions[index] = selected.position;
  }

  return positions;
}

function makeCollectibleTexture(label, theme) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(256, 260, 18, 256, 260, 228);
  glow.addColorStop(0, "rgba(255,255,255,.78)");
  glow.addColorStop(0.32, `${theme.accent2}99`);
  glow.addColorStop(0.72, `${theme.accent}38`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(70, 124);
  ctx.lineTo(454, 124);
  ctx.lineTo(486, 158);
  ctx.lineTo(456, 390);
  ctx.lineTo(68, 390);
  ctx.lineTo(28, 348);
  ctx.lineTo(28, 166);
  ctx.closePath();
  ctx.fillStyle = "rgba(247,253,255,.96)";
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = "rgba(3,9,20,.94)";
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.strokeStyle = theme.accent2;
  ctx.stroke();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = theme.accent;
  for (let y = 151; y < 370; y += 22) {
    ctx.fillRect(58, y, 396, 3);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.beginPath();
  ctx.moveTo(74, 145);
  ctx.lineTo(430, 145);
  ctx.lineTo(448, 164);
  ctx.lineTo(78, 164);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = String(label);
  let size = text.length <= 1 ? 318 : text.length <= 2 ? 264 : text.length <= 3 ? 216 : text.length <= 6 ? 166 : 132;
  ctx.font = `900 ${size}px Trebuchet MS, Arial Rounded MT Bold, sans-serif`;
  while (ctx.measureText(text).width > 430 && size > 80) {
    size -= 8;
    ctx.font = `900 ${size}px Trebuchet MS, Arial Rounded MT Bold, sans-serif`;
  }

  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(26, size * 0.17);
  ctx.strokeStyle = "rgba(255,255,255,.98)";
  ctx.strokeText(text, 256, 272);
  ctx.lineWidth = Math.max(13, size * 0.07);
  ctx.strokeStyle = "rgba(1,4,13,.96)";
  ctx.strokeText(text, 256, 272);
  ctx.fillStyle = "#08101e";
  ctx.fillText(text, 256, 272);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function makeGround(theme, world) {
  const geometry = new THREE.PlaneGeometry(mapWidth() + 20, mapDepth() + 20, 58, 46);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute("position");
  const seed = world === "dino" ? 4.3 : world === "moonwood" ? 8.6 : 1.2;
  const base = new THREE.Color(theme.ground);
  const ridge = new THREE.Color(theme.ground2);
  const shadow = new THREE.Color(world === "dino" ? "#29422f" : world === "moonwood" ? "#171b38" : "#23633c");
  const colors = [];
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const ripple = Math.sin(x * 0.13 + seed) * Math.cos(z * 0.11 - seed) * 0.86 + Math.sin((x + z) * 0.045) * 0.34;
    position.setY(i, ripple - 0.16);
    const light = clamp(0.44 + ripple * 0.16 + Math.sin(x * 0.04 - z * 0.035 + seed) * 0.18, 0, 1);
    const color = base.clone().lerp(light > 0.52 ? ridge : shadow, Math.abs(light - 0.52) * 1.45);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const ground = new THREE.Mesh(geometry, material(theme.ground, { vertexColors: true }));
  ground.receiveShadow = true;
  return ground;
}

function makeCloud(theme, scale = 1) {
  const group = new THREE.Group();
  const cloudMat = material("#f7fbff", { transparent: true, opacity: 0.72, roughness: 0.95 });
  const shadeMat = material(theme.fog, { transparent: true, opacity: 0.32, roughness: 0.95 });
  const puffs = [
    [-1.5, 0, 0, 1.15], [-0.45, 0.18, 0.18, 1.38], [0.82, 0.06, -0.08, 1.18], [1.75, -0.08, 0.08, 0.82]
  ];
  for (const [x, y, z, puffScale] of puffs) {
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(scale * puffScale, 0), cloudMat);
    puff.position.set(x * scale, y * scale, z * scale);
    puff.scale.y = 0.46;
    group.add(puff);
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.3 * scale, 0.18 * scale, 1.0 * scale), shadeMat);
  base.position.y = -0.4 * scale;
  group.add(base);
  group.userData.motion = "cloud";
  group.userData.origin = new THREE.Vector3();
  group.userData.speed = 0.04 + scale * 0.01;
  return group;
}

function makeAtmosphere(theme, world, actors = []) {
  const group = new THREE.Group();
  const sunColor = world === "moonwood" ? theme.accent2 : "#fff2a6";
  const sun = new THREE.Mesh(new THREE.IcosahedronGeometry(world === "moonwood" ? 4.2 : 3.3, 1), emissiveMaterial(sunColor, 1.0));
  sun.position.set(world === "moonwood" ? -38 : 42, world === "moonwood" ? 27 : 32, -70);
  sun.userData.motion = "sun";
  group.add(sun);
  actors.push(sun);

  const cloudPositions = [
    [-52, 28, -56, 2.6], [-14, 34, -67, 1.8], [38, 27, -58, 2.2], [66, 24, -28, 1.5], [-65, 22, 18, 1.7]
  ];
  for (const [x, y, z, scale] of cloudPositions) {
    const cloud = makeCloud(theme, scale);
    cloud.position.set(x, y, z);
    cloud.userData.origin.copy(cloud.position);
    group.add(cloud);
    actors.push(cloud);
  }
  return group;
}

function makeRidge(theme, world) {
  const group = new THREE.Group();
  const ridgeMat = material(world === "moonwood" ? "#181633" : world === "dino" ? "#493f37" : "#557071");
  const snowMat = material(world === "dino" ? theme.danger : world === "moonwood" ? theme.accent2 : "#c8f0ff");
  const points = [
    [-126, -88, 9.0, 19.5], [-104, -94, 12.0, 27.0], [-74, -96, 9.2, 21.0], [-38, -100, 13.6, 30.5],
    [0, -96, 10.0, 22.8], [40, -100, 13.0, 29.4], [82, -92, 9.6, 21.0], [124, -84, 10.4, 23.6],
    [-130, -22, 8.6, 18.2], [130, -18, 10.8, 23.4], [-126, 48, 8.8, 18.6], [126, 54, 11.2, 24.2],
    [-112, 96, 9.4, 20.2], [-66, 103, 11.4, 25.0], [-18, 100, 9.0, 20.0], [34, 103, 11.0, 24.0],
    [82, 98, 10.2, 22.5], [124, 90, 9.0, 20.8]
  ];
  for (const [x, z, radius, height] of points) {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 5), ridgeMat);
    mountain.position.set(x, height / 2 - 0.7, z);
    mountain.rotation.y = (x + z) * 0.07;
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    group.add(mountain);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.42, height * 0.22, 5), snowMat);
    cap.position.set(x, height - 0.7, z);
    cap.rotation.y = mountain.rotation.y + Math.PI / 5;
    cap.castShadow = true;
    group.add(cap);
  }
  return group;
}

function makeTree(theme, scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * scale, 0.34 * scale, 2.1 * scale, 5),
    material("#684027")
  );
  trunk.position.y = 1.05 * scale;
  trunk.castShadow = true;
  group.add(trunk);
  for (let i = 0; i < 3; i += 1) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry((1.35 - i * 0.2) * scale, 1.6 * scale, 5),
      material(i % 2 ? theme.ground2 : theme.ground)
    );
    cone.position.y = (2.0 + i * 0.82) * scale;
    cone.castShadow = true;
    group.add(cone);
  }
  group.userData.motion = "sway";
  group.userData.sway = 0.01 + scale * 0.008;
  return group;
}

function makeRock(world, scale = 1) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(scale, 0),
    material(world === "dino" ? "#68594d" : "#687487")
  );
  rock.scale.y = 0.62;
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

function makeCrystal(theme, scale = 1) {
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(scale, 0), emissiveMaterial(theme.accent, 0.55));
  crystal.scale.y = 1.65;
  crystal.position.y = scale * 1.3;
  crystal.castShadow = true;
  crystal.userData.motion = "crystal";
  return crystal;
}

function makeMushroom(theme, scale = 1) {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 0.9 * scale, 6), material("#e6d5bb"));
  stem.position.y = 0.45 * scale;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.72 * scale, 0.52 * scale, 8), emissiveMaterial(theme.danger, 0.25));
  cap.position.y = 1.03 * scale;
  cap.rotation.y = Math.PI / 8;
  group.add(stem, cap);
  group.userData.motion = "pulse";
  group.userData.baseScale = scale;
  return group;
}

function makeGroundDetail(theme, world, scale = 1) {
  const group = new THREE.Group();
  const leafMat = material(world === "dino" ? "#426f3c" : world === "moonwood" ? "#31456d" : "#4f9a4d");
  const tipMat = emissiveMaterial(world === "moonwood" ? theme.accent2 : theme.accent, world === "moonwood" ? 0.28 : 0.16);
  for (let i = 0; i < 4; i += 1) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.18 * scale, (0.85 + i * 0.12) * scale, 4), leafMat);
    blade.position.set((i - 1.5) * 0.22 * scale, (0.38 + i * 0.03) * scale, Math.sin(i) * 0.16 * scale);
    blade.rotation.z = (i - 1.5) * 0.28;
    blade.rotation.x = -0.18 + i * 0.08;
    blade.castShadow = true;
    group.add(blade);
  }
  if (world !== "dino") {
    for (let i = 0; i < 2; i += 1) {
      const bloom = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 * scale, 0), tipMat);
      bloom.position.set((i ? 0.34 : -0.28) * scale, 0.78 * scale, (i ? -0.2 : 0.18) * scale);
      group.add(bloom);
    }
  }
  group.userData.motion = "sway";
  group.userData.sway = 0.018 + scale * 0.01;
  return group;
}

function makeVolcano(theme) {
  const group = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(5.2, 7.2, 7, 1, true), material("#3f312f"));
  cone.position.y = 3.6;
  cone.castShadow = true;
  const lava = new THREE.Mesh(new THREE.ConeGeometry(2.1, 7.4, 7, 1, true), emissiveMaterial(theme.danger, 0.72));
  lava.position.y = 3.62;
  lava.scale.x = 0.55;
  lava.scale.z = 0.55;
  const plume = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.5, 0),
    material("#6a5865", { transparent: true, opacity: 0.58 })
  );
  plume.position.y = 8.0;
  group.add(cone, lava, plume);
  group.userData.motion = "volcano";
  group.userData.lava = lava;
  group.userData.plume = plume;
  return group;
}

function makeWindmill(theme) {
  const group = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.05, 7.2, 5), material("#d8c18f"));
  tower.position.y = 3.6;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.0, 5), material(theme.trim));
  cap.position.y = 7.7;
  const hub = new THREE.Group();
  const hubCore = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 8), emissiveMaterial(theme.accent2, 0.45));
  hubCore.rotation.x = Math.PI / 2;
  hub.add(hubCore);
  for (let i = 0; i < 4; i += 1) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.3, 0.12), material("#f0e0aa"));
    blade.position.y = 1.2;
    blade.rotation.z = (i * Math.PI) / 2;
    hub.add(blade);
  }
  hub.position.set(0, 7.3, -0.72);
  hub.userData.motion = "windmill";
  group.add(tower, cap, hub);
  group.userData.actor = hub;
  group.traverse(child => {
    child.castShadow = true;
  });
  return group;
}

function makeRibArch() {
  const group = new THREE.Group();
  const boneMat = material("#d8d0bd");
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 5.0 - i * 0.45, 6), boneMat);
      rib.position.set(side * (1.4 + i * 0.82), 2.3 - i * 0.16, 0);
      rib.rotation.z = side * (0.58 + i * 0.12);
      rib.castShadow = true;
      group.add(rib);
    }
  }
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 6.0, 6), boneMat);
  spine.position.y = 4.8;
  spine.rotation.z = Math.PI / 2;
  spine.castShadow = true;
  group.add(spine);
  return group;
}

function makeMoonTower(theme) {
  const group = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.45, 8.2, 6), material(theme.trim));
  tower.position.y = 4.1;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.5, 6), material("#3c1d62"));
  roof.position.y = 9.45;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), emissiveMaterial(theme.accent2, 0.95));
  gem.position.y = 11.05;
  gem.userData.motion = "crystal";
  group.add(tower, roof, gem);
  group.userData.actor = gem;
  group.traverse(child => {
    child.castShadow = true;
  });
  return group;
}

function addScenery(root, theme, world, actors = []) {
  root.add(makeRidge(theme, world));
  root.add(makeAtmosphere(theme, world, actors));

  const treePositions = [
    [-108, -72, 1.35], [-92, 34, 1.2], [-76, 70, 1.0], [-38, 82, 0.9],
    [42, 80, 1.1], [92, 58, 1.3], [108, -54, 1.4], [-112, -6, 1.0],
    [-72, -78, 0.95], [68, -80, 1.1], [110, 4, 0.95], [-14, -82, 0.82],
    [6, 78, 0.72], [68, 72, 0.86], [-84, -12, 0.86]
  ];
  for (const [x, z, scale] of treePositions) {
    const prop = world === "moonwood" && Math.abs(x) % 2 ? makeMushroom(theme, scale * 1.7) : makeTree(theme, scale);
    prop.position.set(x, 0, z);
    root.add(prop);
    actors.push(prop);
  }

  for (let i = 0; i < 74; i += 1) {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const x = MAP_BOUNDS.minX + 18 + col * 23.2 + seededOffset(i + row * 3, 5.8);
    const z = MAP_BOUNDS.minZ + 14 + row * 23.8 + seededOffset(i + col * 5, 6.2);
    if (Math.abs(x) < 18 && z > 48) continue;
    if (FOREST_TOKEN_SLOTS.some(([slotX, slotZ]) => Math.abs(slotX - x) < 9 && Math.abs(slotZ - z) < 9)) continue;
    const scale = 0.62 + ((i * 17) % 7) * 0.085;
    const prop = world === "moonwood" && i % 4 === 0 ? makeMushroom(theme, scale * 1.7) : makeTree(theme, scale);
    prop.position.set(x, 0, z);
    prop.rotation.y = (i * 0.71) % Math.PI;
    root.add(prop);
    actors.push(prop);
  }

  const rockPositions = [[-96, -48], [-56, -62], [-17, -48], [32, -58], [88, -40], [-5, 28], [64, 28], [-88, 18], [18, -12], [42, -5], [-104, 58], [102, 58]];
  for (const [x, z] of rockPositions) {
    const prop = world === "moonwood" ? makeCrystal(theme, 0.55) : makeRock(world, 0.78);
    prop.position.set(x, 0, z);
    prop.rotation.y = (x + z) * 0.11;
    root.add(prop);
    actors.push(prop);
  }

  for (let i = 0; i < 52; i += 1) {
    const x = MAP_BOUNDS.minX + 12 + ((i * 31) % 220) + seededOffset(i * 3 + 19, 4.8);
    const z = MAP_BOUNDS.minZ + 10 + ((i * 47) % 164) + seededOffset(i * 5 + 11, 4.6);
    if (Math.abs(x) < 22 && z > 46) continue;
    if (FOREST_TOKEN_SLOTS.some(([slotX, slotZ]) => Math.abs(slotX - x) < 7 && Math.abs(slotZ - z) < 7)) continue;
    const detail = makeGroundDetail(theme, world, 0.72 + ((i * 13) % 5) * 0.13);
    detail.position.set(x, 0.02, z);
    detail.rotation.y = (i * 0.83) % Math.PI;
    root.add(detail);
    actors.push(detail);
  }

  if (world === "meadow") {
    const windmill = makeWindmill(theme);
    windmill.position.set(76, 0, 74);
    windmill.rotation.y = -0.4;
    root.add(windmill);
    actors.push(windmill.userData.actor);
  }

  if (world === "dino") {
    const volcano = makeVolcano(theme);
    volcano.position.set(96, 0, -78);
    volcano.scale.setScalar(1.35);
    root.add(volcano);
    actors.push(volcano);
    const ribs = makeRibArch(theme);
    ribs.position.set(-82, 0, -58);
    ribs.rotation.y = 0.72;
    root.add(ribs);
  }

  if (world === "moonwood") {
    const arch = new THREE.Group();
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.7, 5.5, 0.8), material(theme.trim));
    const right = left.clone();
    left.position.set(-2.4, 2.75, 0);
    right.position.set(2.4, 2.75, 0);
    const top = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.27, 5, 12, Math.PI), emissiveMaterial(theme.accent, 0.28));
    top.rotation.z = Math.PI;
    top.position.y = 5.35;
    arch.add(left, right, top);
    arch.position.set(0, 0, -82);
    arch.scale.setScalar(1.6);
    root.add(arch);
    const tower = makeMoonTower(theme);
    tower.position.set(86, 0, 70);
    tower.rotation.y = -0.55;
    root.add(tower);
    actors.push(tower.userData.actor);
  }
}

function makeCourse(root, theme) {
  const bounds = { ...MAP_BOUNDS };
  const railMat = emissiveMaterial(theme.accent, 0.2);
  const postMat = material(theme.trim);
  const clearingMat = material(theme.road, { roughness: 0.92, metalness: 0.01, transparent: true, opacity: 0.46 });
  const clearings = [
    [0, 66, 11, 7, 0],
    [-52, 16, 12, 8, 0.3],
    [38, -24, 11, 7, -0.4],
    [86, 34, 10, 6, 0.6],
    [-82, -44, 12, 7, -0.2]
  ];
  for (const [x, z, sx, sz, angle] of clearings) {
    const clearing = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.06, 18), clearingMat);
    clearing.scale.set(sx, 1, sz);
    clearing.position.set(x, 0.02, z);
    clearing.rotation.y = angle;
    clearing.receiveShadow = true;
    root.add(clearing);
  }

  const addFencePost = (x, z, angle) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.15, 0.34), postMat);
    post.position.set(x, 0.58, z);
    post.castShadow = true;
    root.add(post);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 5.2), railMat);
    rail.position.set(x, 0.96, z);
    rail.rotation.y = angle;
    rail.castShadow = true;
    root.add(rail);
  };
  for (let x = bounds.minX; x <= bounds.maxX; x += 8) {
    addFencePost(x, bounds.minZ, Math.PI / 2);
    addFencePost(x, bounds.maxZ, Math.PI / 2);
  }
  for (let z = bounds.minZ; z <= bounds.maxZ; z += 8) {
    addFencePost(bounds.minX, z, 0);
    addFencePost(bounds.maxX, z, 0);
  }
  return { bounds };
}

function makeStartCamp(theme, world) {
  const group = new THREE.Group();
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.08, 18),
    material(theme.road, { roughness: 0.9, metalness: 0.02, transparent: true, opacity: 0.64 })
  );
  pad.scale.set(7.8, 1, 4.2);
  pad.receiveShadow = true;
  group.add(pad);

  const postMat = material(theme.trim);
  const lampMat = emissiveMaterial(world === "moonwood" ? theme.accent2 : theme.frame, 0.88);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.4, 5), postMat);
    post.position.set(side * 4.9, 1.2, -1.8);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.16, 0.18), postMat);
    cross.position.set(side * 4.55, 2.34, -1.8);
    cross.rotation.z = side * 0.12;
    const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), lampMat);
    lantern.position.set(side * 4.05, 2.06, -1.8);
    lantern.userData.motion = "crystal";
    group.add(post, cross, lantern);
    group.userData.actor = lantern;
  }

  const crateMat = material(world === "dino" ? "#6b4630" : "#8b5a35");
  for (const [x, z, sx, sz] of [[-3.25, 1.65, 1.25, 0.9], [3.3, 1.45, 1.05, 1.1], [-4.15, 0.15, 0.78, 0.72]]) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.72, sz), crateMat);
    crate.position.set(x, 0.4, z);
    crate.rotation.y = seededOffset(x + z, 0.3);
    crate.castShadow = true;
    group.add(crate);
  }

  const toolHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.9, 5), material("#6f4226"));
  toolHandle.position.set(2.1, 0.95, 2.5);
  toolHandle.rotation.z = -0.58;
  const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.18), emissiveMaterial(theme.accent2, 0.22));
  axeHead.position.set(2.58, 1.54, 2.5);
  axeHead.rotation.z = -0.58;
  group.add(toolHandle, axeHead);

  group.traverse(child => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return group;
}

function makeFrame(theme, pose) {
  const group = new THREE.Group();
  const wood = material(theme.trim);
  const glow = emissiveMaterial(theme.frame, 0.45);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.9, 0.92), wood);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.9, 0.92), wood);
  const top = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.82, 0.9), wood);
  const leftBrace = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.0, 0.54), wood);
  const rightBrace = leftBrace.clone();
  left.position.set(-5.0, 2.45, 0);
  right.position.set(5.0, 2.45, 0);
  top.position.set(0, 5.0, 0);
  leftBrace.position.set(-3.55, 3.65, 0);
  rightBrace.position.set(3.55, 3.65, 0);
  leftBrace.rotation.z = -0.58;
  rightBrace.rotation.z = 0.58;
  const floorGlow = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.12, 2.05), glow);
  floorGlow.position.set(0, 0.08, 0);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 2.45),
    new THREE.MeshStandardMaterial({
      color: theme.frame,
      emissive: theme.frame,
      emissiveIntensity: 0.38,
      roughness: 0.7,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      flatShading: true
    })
  );
  panel.position.set(0, 3.2, -0.12);
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), emissiveMaterial(theme.accent2, 0.9));
  beacon.position.set(0, 5.95, 0);
  group.add(left, right, top, leftBrace, rightBrace, floorGlow, panel, beacon);
  group.position.set(pose.x, 0, pose.z);
  group.rotation.y = pose.yaw;
  group.traverse(child => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  group.userData.beacon = beacon;
  group.userData.panel = panel;
  group.userData.floorGlow = floorGlow;
  return group;
}

function makeVehicle(theme, world) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.82, 3.05), material(theme.vehicle));
  body.position.y = 0.72;
  body.castShadow = true;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.24, 1.75, 4), material(theme.vehicle2));
  nose.position.set(0, 0.85, -1.55);
  nose.rotation.x = Math.PI / 2;
  nose.rotation.y = Math.PI / 4;
  nose.castShadow = true;
  group.add(body, nose);

  const wheelMat = emissiveMaterial(theme.vehicle2, 0.22);
  const wheels = [];
  for (const x of [-1.42, 1.42]) {
    for (const z of [-1.05, 1.05]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 8), wheelMat);
      wheel.position.set(x, 0.42, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheels.push(wheel);
      group.add(wheel);
    }
  }

  if (world === "meadow") {
    const bonnet = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 1.35), material("#c47d2d"));
    bonnet.position.set(0, 1.0, -0.92);
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 1.25, 6), material("#30251f"));
    chimney.position.set(-0.62, 1.75, -1.25);
    const rollBar = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.75, 0.16), material(theme.trim));
    rollBar.position.set(0, 1.65, 0.98);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.54, 1.12), material("#8d5d33"));
    crate.position.set(0, 0.93, 1.38);
    for (const wheel of wheels) {
      if (wheel.position.z > 0) wheel.scale.setScalar(1.34);
    }
    group.add(bonnet, chimney, rollBar, crate);
  }

  if (world === "dino") {
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.3, 6), material(theme.vehicle2));
    tail.position.set(0, 0.82, 1.95);
    tail.rotation.x = -Math.PI / 2;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 1.25, 6), material(theme.vehicle));
    neck.position.set(0, 1.45, -1.6);
    neck.rotation.x = 0.42;
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58, 0), material(theme.vehicle2));
    head.position.set(0, 1.92, -2.22);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.44), material(theme.accent2));
    jaw.position.set(0, 1.72, -2.55);
    for (const x of [-0.74, 0.74]) {
      for (const z of [-0.55, 0.76]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.72, 5), material("#345334"));
        leg.position.set(x, 0.5, z);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.7), material(theme.accent2));
        foot.position.set(x, 0.13, z - 0.12);
        group.add(leg, foot);
      }
    }
    group.add(tail, neck, head, jaw);
  }

  if (world === "moonwood") {
    const prow = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.35, 5), emissiveMaterial(theme.accent2, 0.28));
    prow.position.set(0, 0.92, -2.1);
    prow.rotation.x = Math.PI / 2;
    const lanternMat = emissiveMaterial(theme.frame, 0.8);
    for (const x of [-1.34, 1.34]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.2, 5), material("#8b5a35"));
      arm.position.set(x, 1.18, -0.15);
      arm.rotation.z = Math.PI / 2;
      const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), lanternMat);
      lantern.position.set(x * 1.28, 1.18, -0.15);
      group.add(arm, lantern);
    }
    group.add(prow);
  }

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.5, 0.9, 6), material(theme.costume));
  torso.position.set(0, 1.55, 0.35);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), material("#8c5632"));
  head.position.set(0, 2.26, 0.34);
  const hat = new THREE.Mesh(
    world === "moonwood" ? new THREE.ConeGeometry(0.64, 0.92, 6) : new THREE.ConeGeometry(0.54, 0.58, 5),
    material(world === "moonwood" ? "#4d217c" : theme.costume)
  );
  hat.position.set(0, world === "moonwood" ? 2.95 : 2.7, 0.34);
  group.add(torso, head, hat);

  if (world === "dino") {
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.74, 5), material(theme.accent2));
    crest.position.set(0, 1.55, -1.95);
    crest.rotation.x = -Math.PI / 2;
    group.add(crest);
  }
  if (world === "moonwood") {
    const broom = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 3.6, 6), material("#8b5a35"));
    broom.position.set(0, 0.45, 1.6);
    broom.rotation.x = Math.PI / 2;
    const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.9, 6), material(theme.frame));
    bristles.position.set(0, 0.45, 3.48);
    bristles.rotation.x = Math.PI / 2;
    group.add(broom, bristles);
  }

  group.userData = { wheels };
  group.traverse(child => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return group;
}

function makeToken(label, isCorrect, answer, theme, position) {
  const group = new THREE.Group();
  const labelString = String(label);
  const faceWidth = labelString.length <= 1 ? 3.0 : labelString.length <= 3 ? 3.55 : labelString.length <= 7 ? 4.35 : 5.1;
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 0.34, 7), material("#6f4226"));
  stump.position.y = 0.17;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.5, 3.05, 7), material("#784b2b"));
  trunk.position.y = 1.68;
  // Every tree renders identically — correctness is only revealed after the player cuts.
  const cutMark = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.18, 0.08), emissiveMaterial(theme.accent, 0.42));
  cutMark.position.set(0, 1.06, -0.42);
  cutMark.rotation.z = -0.3;
  const foliageMat = material(theme.ground, { emissive: new THREE.Color(theme.ground), emissiveIntensity: 0.02 });
  const lower = new THREE.Mesh(new THREE.ConeGeometry(1.55, 1.85, 6), foliageMat);
  lower.position.y = 3.0;
  const mid = new THREE.Mesh(new THREE.ConeGeometry(1.28, 1.7, 6), foliageMat);
  mid.position.y = 3.92;
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.94, 1.38, 6), foliageMat);
  top.position.y = 4.72;
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 16),
    new THREE.MeshBasicMaterial({ color: "#02050a", transparent: true, opacity: 0.32, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.035;
  for (let i = 0; i < 5; i += 1) {
    const root = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 1.18), material("#5f381f"));
    root.position.set(Math.sin(i * 1.26) * 0.36, 0.18, Math.cos(i * 1.26) * 0.48);
    root.rotation.y = i * 1.26;
    root.castShadow = true;
    group.add(root);
  }
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(faceWidth, 1.24, 0.16),
    material("#f5f8ff", { roughness: 0.62, metalness: 0.02, transparent: true, opacity: 0.94 })
  );
  face.position.set(0, 2.24, -0.78);
  const signRail = new THREE.Mesh(new THREE.BoxGeometry(faceWidth + 0.28, 0.16, 0.22), emissiveMaterial(theme.accent, 0.28));
  signRail.position.set(0, 2.94, -0.75);
  const signBottom = signRail.clone();
  signBottom.position.y = 1.52;
  const leftPeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.72, 5), material(theme.trim));
  leftPeg.position.set(-faceWidth * 0.43, 2.22, -0.9);
  leftPeg.rotation.x = Math.PI / 2;
  const rightPeg = leftPeg.clone();
  rightPeg.position.x = faceWidth * 0.43;
  const texture = makeCollectibleTexture(label, theme);
  const labelMesh = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false
    })
  );
  const labelWidth = labelString.length <= 1 ? 2.78 : labelString.length <= 2 ? 3.18 : labelString.length <= 4 ? 4.05 : labelString.length <= 7 ? 4.85 : 5.65;
  labelMesh.scale.set(labelWidth, 2.34, 1);
  labelMesh.position.set(0, 2.28, -1.1);
  labelMesh.renderOrder = 10;
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), emissiveMaterial(theme.accent, 0.72));
  beacon.position.y = 5.68;
  const glow = new THREE.PointLight(theme.accent, 0.78, 12, 2.2);
  glow.position.y = 3.5;
  group.add(shadow, stump, trunk, cutMark, lower, mid, top, face, signRail, signBottom, leftPeg, rightPeg, labelMesh, beacon, glow);
  group.position.set(position[0], 0, position[1]);
  group.rotation.y = seededOffset(position[0] + position[1], Math.PI);
  group.traverse(child => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return {
    label,
    isCorrect,
    answer,
    group,
    labelMesh,
    baseScale: labelMesh.scale.clone(),
    beacon,
    glow,
    cutMark,
    signRail,
    home: group.position.clone(),
    trunk,
    face,
    cooldown: 0,
    collected: false,
    smashed: false,
    smashLife: 0,
    smashMax: 0.7,
    bump: 0
  };
}

function makeHazard(theme, index) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.88, 0), emissiveMaterial(index % 2 ? theme.danger : theme.accent, 0.62));
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.08, 5, 12),
    material("#f5f8ff", { emissive: new THREE.Color(theme.danger), emissiveIntensity: 0.18 })
  );
  ring.rotation.x = Math.PI / 2;
  const wingMat = material(theme.trim);
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 0.42), wingMat);
  const rightWing = leftWing.clone();
  leftWing.position.set(-0.9, 0, 0);
  rightWing.position.set(0.9, 0, 0);
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.82, 5), emissiveMaterial(theme.danger, 0.5));
  spike.position.set(0, 0, -0.88);
  spike.rotation.x = Math.PI / 2;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.12), emissiveMaterial("#ffffff", 0.42));
  visor.position.set(0, 0.18, -0.66);
  group.add(core, ring, leftWing, rightWing, spike, visor);
  group.userData = { core, ring };
  group.traverse(child => {
    child.castShadow = true;
  });
  return group;
}

function makeTrailParticle(theme) {
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    new THREE.MeshBasicMaterial({ color: theme.accent, transparent: true, opacity: 0.55, depthWrite: false })
  );
  mesh.visible = false;
  mesh.userData = { life: 0, maxLife: 1 };
  return mesh;
}

function createHud() {
  const overlay = document.createElement("div");
  overlay.style.cssText = [
    "position:absolute",
    "inset:0",
    "pointer-events:none",
    "font-family:Trebuchet MS,Arial Rounded MT Bold,system-ui,sans-serif",
    "color:white",
    "text-shadow:0 2px 0 rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.8)"
  ].join(";");
  overlay.innerHTML = `
    <div data-role="panel-left" style="position:absolute;left:16px;top:12px;width:218px;padding:12px 16px;background:rgba(3,7,18,.76);border:2px solid rgba(105,255,230,.6);clip-path:polygon(9% 0,100% 0,100% 76%,90% 100%,0 100%,0 18%);">
      <div data-role="title" style="font-size:22px;font-weight:900;color:#7fffe9;">Sentence Grove</div>
      <div data-role="room" style="margin-top:4px;font-size:13px;font-weight:800;"></div>
    </div>
    <div data-role="prompt-panel" style="position:absolute;left:50%;top:88px;transform:translateX(-50%);width:min(680px,86vw);padding:16px 22px 18px;background:rgba(3,7,18,.9);border:2px solid rgba(255,226,92,.78);clip-path:polygon(5% 0,96% 0,100% 26%,94% 100%,5% 100%,0 70%,0 18%);text-align:center;pointer-events:auto;box-shadow:0 14px 34px rgba(0,0,0,.34);">
      <div data-role="prompt" data-child-instruction style="font-size:clamp(18px,2.2vw,24px);font-weight:900;color:#ffe45c;line-height:1.12;text-wrap:balance;"></div>
      <div data-role="cue" aria-label="Picture cue" style="margin-top:6px;font-size:clamp(18px,2.4vw,26px);font-weight:900;color:#9fffe9;line-height:1.12;text-wrap:balance;"></div>
      <div data-role="display" data-repair-sentence style="margin-top:6px;font-size:clamp(24px,3.2vw,36px);font-weight:900;line-height:1.12;overflow-wrap:anywhere;text-wrap:balance;"></div>
      <button data-role="replay" type="button" aria-label="Hear the sentence again" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:220px;min-height:56px;margin-top:12px;padding:10px 18px;border:2px solid rgba(159,255,233,.78);border-radius:12px;background:linear-gradient(180deg,rgba(24,75,78,.96),rgba(8,38,48,.96));color:#d9fff7;font-family:inherit;font-size:16px;font-weight:900;line-height:1.1;letter-spacing:.02em;text-shadow:0 2px 0 rgba(0,0,0,.8);box-shadow:0 5px 0 rgba(0,0,0,.45);cursor:pointer;touch-action:manipulation;">
        <span aria-hidden="true" style="font-size:20px;">&#128266;</span>
        <span data-role="replay-label">Hear sentence again</span>
      </button>
    </div>
    <div data-role="panel-right" style="position:absolute;right:16px;top:12px;width:205px;padding:12px 16px;background:rgba(3,7,18,.78);border:2px solid rgba(255,226,92,.6);clip-path:polygon(0 0,90% 0,100% 22%,100% 100%,8% 100%,0 78%);text-align:right;">
      <div data-role="score" style="font-size:22px;font-weight:900;">0 pts</div>
      <div data-role="streak" style="margin-top:4px;font-size:13px;font-weight:900;color:#fff1a8;"></div>
    </div>
    <div style="position:absolute;left:22px;right:22px;bottom:14px;height:22px;">
      <div style="position:absolute;left:0;bottom:0;width:40%;height:10px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:99px;overflow:hidden;">
        <div data-role="progress" style="height:100%;width:0%;background:#52ffe1;"></div>
      </div>
      <div data-role="status" style="position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);font-size:14px;font-weight:900;"></div>
      <div style="position:absolute;right:0;bottom:0;width:24%;height:10px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.32);border-radius:99px;overflow:hidden;">
        <div data-role="focus" style="height:100%;width:0%;background:#ffffff;"></div>
      </div>
    </div>
    <div data-role="move-controls" style="position:absolute;left:22px;bottom:48px;display:flex;gap:10px;pointer-events:auto;">
      <button data-role="move-forward" type="button" aria-label="Move forward" style="width:76px;height:64px;border:2px solid rgba(105,255,230,.68);background:linear-gradient(160deg,#7fffe9,#38bdf8);color:#052e2b;font-family:inherit;font-size:13px;font-weight:900;border-radius:18px;box-shadow:0 4px 0 rgba(0,0,0,.45);touch-action:none;">↑<br>FORWARD</button>
      <button data-role="move-back" type="button" aria-label="Move back" style="width:76px;height:64px;border:2px solid rgba(255,255,255,.42);background:rgba(3,7,18,.82);color:#fff;font-family:inherit;font-size:13px;font-weight:900;border-radius:18px;box-shadow:0 4px 0 rgba(0,0,0,.45);touch-action:none;">↓<br>BACK</button>
    </div>
    <div data-role="steer-controls" style="position:absolute;right:22px;bottom:48px;display:flex;align-items:flex-end;gap:10px;pointer-events:auto;">
      <button data-role="turn-left" type="button" aria-label="Turn left" style="width:64px;height:64px;border:2px solid rgba(105,255,230,.58);background:rgba(3,7,18,.82);color:#fff;font-family:inherit;font-size:28px;font-weight:900;border-radius:18px;box-shadow:0 4px 0 rgba(0,0,0,.45);touch-action:none;">←</button>
      <button data-role="turn-right" type="button" aria-label="Turn right" style="width:64px;height:64px;border:2px solid rgba(105,255,230,.58);background:rgba(3,7,18,.82);color:#fff;font-family:inherit;font-size:28px;font-weight:900;border-radius:18px;box-shadow:0 4px 0 rgba(0,0,0,.45);touch-action:none;">→</button>
      <button data-role="cut" type="button" aria-label="Cut the nearby answer tree" style="min-width:116px;height:64px;padding:0 20px;font-family:inherit;font-size:23px;font-weight:900;color:#052e2b;background:#52ffe1;border:3px solid rgba(255,255,255,.88);border-radius:18px;box-shadow:0 4px 0 rgba(0,0,0,.45);cursor:pointer;touch-action:none;">CUT</button>
    </div>
    <div data-role="feedback" style="position:absolute;left:50%;top:166px;transform:translateX(-50%);min-width:min(360px,78vw);max-width:680px;padding:14px 22px;background:rgba(3,7,18,.84);border:2px solid rgba(255,226,92,.68);clip-path:polygon(4% 0,97% 0,100% 24%,96% 100%,4% 100%,0 76%,0 18%);text-align:center;opacity:0;transition:opacity .12s linear;">
      <div data-role="feedback-main" style="font-size:27px;font-weight:900;color:#ffe45c;"></div>
      <div data-role="feedback-sub" style="font-size:15px;font-weight:800;margin-top:4px;"></div>
    </div>
    <div data-role="countdown" style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,4,16,.50),rgba(2,4,16,.24));display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;">
      <div data-role="countdown-prompt" style="max-width:min(860px,86vw);font-size:clamp(26px,5vw,46px);font-weight:900;line-height:1.05;text-wrap:balance;"></div>
      <div data-role="countdown-cue" aria-label="Picture cue" style="max-width:min(880px,88vw);margin-top:18px;font-size:clamp(18px,2.6vw,28px);font-weight:900;color:#9fffe9;line-height:1.12;text-wrap:balance;"></div>
      <div data-role="countdown-display" data-repair-sentence style="max-width:min(880px,88vw);margin-top:8px;font-size:clamp(24px,3.8vw,36px);font-weight:900;color:#ffe45c;line-height:1.12;overflow-wrap:anywhere;"></div>
      <div data-role="countdown-main" style="font-size:clamp(76px,16vw,144px);font-weight:900;color:#52ffe1;line-height:1.05;"></div>
    </div>
    <style>
      [data-role="replay"]:focus-visible { outline:4px solid #fff7b2;outline-offset:3px; }
      [data-role="replay"]:active { transform:translateY(2px);box-shadow:0 3px 0 rgba(0,0,0,.45) !important; }
    </style>
  `;
  const nodes = {};
  overlay.querySelectorAll("[data-role]").forEach(node => {
    const key = node.dataset.role.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    nodes[key] = node;
  });
  nodes.title.textContent = "Sentence Grove";
  return { overlay, nodes };
}

function createStarGalleryEngine(mount, options) {
  const config = CONFIG[options.kind] || CONFIG["star-gallery"];
  const ladder = config.ladder(options.difficulty);
  const total = ladder.reduce((sum, level) => sum + level.items.length, 0);
  const previousPosition = mount.style.position;
  if (!previousPosition) mount.style.position = "relative";
  // Hardware quality tier: scales the DPR cap, shadow mode and trail particle
  // pool so weak devices get a lighter scene instead of a stuttery one.
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  let qualityTier = detectQualityTier();

  const renderer = createRenderer(THREE, {
    antialias: qualityTier !== "low",
    powerPreference: "high-performance",
    retryWithoutAntialias: false,
    pixelRatioCap: QUALITY_TIERS[qualityTier].pixelRatioCap,
    srgbOutput: true,
    toneMappingExposure: 1.08,
    shadowMap: shadowMapForTier(qualityTier, "pcf")
  });
  applyQualityTier(renderer, qualityTier, { floor: 1 });
  renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;background:#050716;touch-action:none";
  mount.appendChild(renderer.domElement);

  const { overlay, nodes } = createHud();
  mount.appendChild(overlay);

  const scene = createScene(THREE);
  const camera = createPerspectiveCamera(THREE, { fov: 56, aspect: 16 / 9, near: 0.1, far: 220 });
  const premiumRender = createArcadePremiumRenderPipeline({
    THREE,
    renderer,
    scene,
    camera,
    tier: qualityTier,
    mood: {
      bloomIntensity: 0.072,
      bloomThreshold: 0.87,
      environmentIntensity: 0.9,
      vignetteDarkness: 0.1,
      aoIntensity: 0.82,
      aoRadius: 0.095
    }
  });
  qualityTier = premiumRender.effectiveTier;
  applyQualityTier(renderer, qualityTier, { floor: 1 });
  premiumRender.setTier(qualityTier);
  const frameTimer = createPausableFrameTimer();
  let elapsedTime = 0;
  function readFrameDelta(now) {
    const delta = frameTimer.read(now);
    elapsedTime += delta;
    return delta;
  }
  const keys = { left: false, right: false, up: false, down: false, boost: false };
  const timers = new Set();
  const state = {
    difficulty: options.difficulty,
    stage: clamp(Number(options.startLevel) || 0, 0, ladder.length - 1),
    level: null,
    itemIndex: 0,
    worldRoot: null,
    tokenRoot: null,
    levelRoot: null,
    mapBounds: { ...MAP_BOUNDS },
    frameGroup: null,
    vehicle: null,
    sceneryActors: [],
    player: { x: 0, z: 0, yaw: 0, speed: 0 },
    steerVisual: 0,
    tokens: [],
    hazards: [],
    trailRoot: null,
    trailParticles: [],
    trailCursor: 0,
    trailClock: 0,
    score: 0,
    correct: 0,
    mistakes: 0,
    hazardHits: 0,
    itemMisses: 0,
    combo: 0,
    focus: 28,
    rush: 0,
    progress: 0,
    countdown: 0,
    feedback: { text: "", sub: "", tone: "good", life: 0, maxLife: 1 },
    invulnerable: 0,
    framePulse: 0,
    transitioning: false,
    gateLocked: false,
    gateSerial: 0,
    nearTreeLabel: "",
    ended: false,
    paused: false,
    pointer: { active: false, steer: 0, throttle: 0 },
    total
  };
  function schedule(fn, ms) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
    return timer;
  }

  const mountWidth = () => {
    const rect = mount.getBoundingClientRect();
    return Math.max(320, rect.width || mount.clientWidth || 640);
  };
  const mountHeight = () => {
    const rect = mount.getBoundingClientRect();
    return Math.max(280, rect.height || mount.clientHeight || 420);
  };
  const handleResize = () => {
    reassessQualityTier();
    premiumRender.resize(mountWidth(), mountHeight());
    // Collapse the fixed side panels on narrow screens so they stop overlapping the center prompt.
    const narrowHud = mountWidth() < 650;
    nodes.panelLeft.style.display = narrowHud ? "none" : "";
    nodes.panelRight.style.display = narrowHud ? "none" : "";
  };

  function reassessQualityTier() {
    premiumRender.setTier(detectQualityTier());
    qualityTier = premiumRender.effectiveTier;
    applyQualityTier(renderer, qualityTier, { floor: 1 });
    if (renderer.shadowMap) {
      renderer.shadowMap.type = THREE.PCFShadowMap;
    }
    state.levelRoot?.traverse?.(node => {
      if (node.isDirectionalLight && node.userData.arcadePremiumShadow) {
        premiumRender.configureShadowLight(node);
      }
    });
  }
  const syncMotionPreference = () => reassessQualityTier();
  motionQuery?.addEventListener?.("change", syncMotionPreference);

  function setScore(nextScore) {
    state.score = Math.max(0, Math.round(nextScore));
    options.onScoreUpdate?.(state.score);
  }

  function updateProgress() {
    state.progress = total ? state.correct / total : 0;
    options.onProgressUpdate?.(state.correct, total);
  }

  function setFeedback(text, sub = "", tone = "good", life = 1.05) {
    state.feedback = { text, sub, tone, life, maxLife: life };
  }

  function currentPrompt() {
    const repair = repairForState(state);
    return repair ? `${repair.prompt}` : "Hit the word that completes it";
  }

  function resetPlayer() {
    const placement = placementFor(state);
    state.player.x = placement.start[0];
    state.player.z = placement.start[1];
    state.player.yaw = placement.yaw;
    state.player.speed = 0;
    if (state.vehicle) {
      state.vehicle.position.set(state.player.x, 0, state.player.z);
      state.vehicle.rotation.y = state.player.yaw;
    }
    camera.position.set(state.player.x - 10, 8, state.player.z + 14);
    camera.lookAt(state.player.x, 1.4, state.player.z);
  }

  function clearLevel() {
    if (state.levelRoot) {
      state.levelRoot.traverse(node => {
        if (node.isDirectionalLight && node.userData.arcadePremiumShadow) {
          premiumRender.unregisterShadowLight(node);
        }
      });
      scene.remove(state.levelRoot);
      disposeObject(state.levelRoot);
    }
    state.levelRoot = null;
    state.worldRoot = null;
    state.tokenRoot = null;
    state.frameGroup = null;
    state.vehicle = null;
    state.sceneryActors = [];
    state.tokens = [];
    state.hazards = [];
    state.trailRoot = null;
    state.trailParticles = [];
    state.trailCursor = 0;
    state.trailClock = 0;
  }

  function buildLevelWorld() {
    clearLevel();
    const theme = themeFor(state);
    const world = state.level.world;
    const placement = placementFor(state);
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.Fog(theme.fog, 102, 245);
    const root = new THREE.Group();
    state.levelRoot = root;
    scene.add(root);

    const ambient = new THREE.AmbientLight(
      new THREE.Color(theme.sky).lerp(new THREE.Color("#fff4dc"), 0.18),
      world === "moonwood" ? 0.24 : 0.34
    );
    const hemi = new THREE.HemisphereLight(theme.sky, theme.ground2, 1.42);
    root.add(ambient, hemi);
    const sun = new THREE.DirectionalLight("#fff3cc", world === "moonwood" ? 2.0 : 2.45);
    sun.position.set(-18, 24, 18);
    sun.castShadow = qualityTier !== "low";
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 170;
    sun.shadow.camera.left = -110;
    sun.shadow.camera.right = 110;
    sun.shadow.camera.top = 110;
    sun.shadow.camera.bottom = -110;
    root.add(sun);
    premiumRender.registerShadowLight(sun);

    const rim = new THREE.DirectionalLight(theme.accent2, world === "moonwood" ? 0.52 : 0.34);
    rim.position.set(32, 15, -36);
    root.add(rim);

    const worldRoot = new THREE.Group();
    state.worldRoot = worldRoot;
    root.add(worldRoot);
    worldRoot.add(makeGround(theme, world));
    const map = makeCourse(worldRoot, theme, world);
    state.mapBounds = map.bounds;
    addScenery(worldRoot, theme, world, state.sceneryActors);

    state.frameGroup = makeFrame(theme, { x: placement.frame[0], z: placement.frame[1], yaw: 0 });
    worldRoot.add(state.frameGroup);

    const startCamp = makeStartCamp(theme, world);
    startCamp.position.set(placement.start[0], 0.02, placement.start[1] + 2.6);
    startCamp.rotation.y = placement.yaw;
    worldRoot.add(startCamp);
    if (startCamp.userData.actor) state.sceneryActors.push(startCamp.userData.actor);

    state.vehicle = makeVehicle(theme, world);
    worldRoot.add(state.vehicle);
    state.trailRoot = new THREE.Group();
    state.trailParticles = Array.from({ length: particleCountForTier(qualityTier, 34) }, () => {
      const particle = makeTrailParticle(theme);
      state.trailRoot.add(particle);
      return particle;
    });
    worldRoot.add(state.trailRoot);

    state.hazards = placement.hazards.slice(0, Math.min(placement.hazards.length, settingsFor(state).hazards + Math.floor(state.stage / 4))).map((hazardConfig, index) => {
      const mesh = makeHazard(theme, index);
      worldRoot.add(mesh);
      return { ...hazardConfig, mesh, radius: 2.0 + index * 0.18, stun: 0 };
    });
    state.tokenRoot = new THREE.Group();
    worldRoot.add(state.tokenRoot);
    premiumRender.prepareObject(scene);
  }

  function clearTokens() {
    if (!state.tokenRoot) return;
    for (const child of [...state.tokenRoot.children]) {
      state.tokenRoot.remove(child);
      disposeObject(child);
    }
    state.tokens = [];
  }

  function buildItemTokens({ feedback = false, respawn = false } = {}) {
    clearTokens();
    const repair = repairForState(state);
    if (!repair) return;
    const theme = themeFor(state);
    const choices = rotate(repair.options, state.gateSerial + state.itemIndex);
    const expanded = [];
    for (const choice of choices) {
      const copies = choice === repair.answer ? 2 : state.level.difficulty === "hard" ? 3 : 2;
      for (let copy = 0; copy < copies; copy += 1) {
        expanded.push({ choice, copy, isCorrect: isAcceptedRepairAnswer(repair, choice) });
      }
    }
    const tokenCount = Math.min(state.level.difficulty === "hard" ? 9 : state.level.difficulty === "medium" ? 8 : 7, expanded.length);
    const rotatedChoices = rotate(expanded, state.gateSerial + state.stage).slice(0, tokenCount);
    if (!rotatedChoices.some(entry => entry.isCorrect)) {
      rotatedChoices[rotatedChoices.length - 1] = { choice: repair.answer, copy: 0, isCorrect: true };
    }
    const slots = rotate(SPREAD_FOREST_TOKEN_SLOTS, state.stage * 7 + state.itemIndex * 5 + state.gateSerial * 3);
    const positions = assignTokenPositions(rotatedChoices, slots, state);
    state.gateLocked = false;
    state.nearTreeLabel = "";
    state.itemMisses = 0;
    state.gateSerial += 1;
    state.tokens = rotatedChoices.map((entry, index) => {
      const position = positions[index] || slotPosition(slots[index % slots.length], state.stage, state.itemIndex, index + entry.copy);
      const token = makeToken(String(entry.choice), entry.isCorrect, String(repair.answer), theme, position);
      token.choice = entry.choice;
      state.tokenRoot.add(token.group);
      return token;
    });
    premiumRender.prepareObject(scene);
    if (feedback) {
      setFeedback(respawn ? "SEARCH AGAIN" : "FORESTER BRIEF", "Find and cut the tree with the missing part", respawn ? "bad" : "good", 1.05);
      speakItem();
    }
  }

  function startLevel(stage, { countdown = true } = {}) {
    state.stage = clamp(stage, 0, ladder.length - 1);
    state.level = ladder[state.stage];
    state.itemIndex = 0;
    state.transitioning = false;
    state.gateLocked = false;
    state.gateSerial = 0;
    buildLevelWorld();
    resetPlayer();
    buildItemTokens({ feedback: true });
    state.countdown = countdown ? 5.05 : 0;
    state.invulnerable = 0;
    options.onCheckpoint?.(state.stage, ladder.length);
    updateProgress();
  }

  function finishGame() {
    if (state.ended) return;
    state.ended = true;
    options.onProgressUpdate?.(total, total);
    playSfx(options, playCelebrationFanfare);
    options.onComplete?.(config.stars({ correct: state.correct, total, mistakes: state.mistakes }), state.score, total);
  }

  function nextItemOrLevel() {
    state.itemIndex += 1;
    state.transitioning = false;
    state.gateLocked = false;
    if (state.itemIndex < state.level.items.length) {
      buildItemTokens({ feedback: true });
      return;
    }
    const checkpointBonus = Math.max(0, 260 + state.combo * 18 - state.mistakes * 6);
    setScore(state.score + checkpointBonus);
    if (state.stage + 1 >= ladder.length) {
      setFeedback("FOREST COMPLETE", `Final streak x${Math.max(1, state.combo)}`, "good", 1.45);
      playSfx(options, playCelebrationFanfare);
      schedule(finishGame, 900);
      return;
    }
    state.stage += 1;
    state.level = ladder[state.stage];
    state.itemIndex = 0;
    setFeedback("NEXT GROVE", `${state.level.focusSkill} trees hidden`, "good", 1.05);
    options.onCheckpoint?.(state.stage, ladder.length);
    buildItemTokens({ feedback: true });
  }

  // Category rule reminders for wrong cuts — the literal answer is only revealed
  // after a second miss on the same item so trial-and-error never pays.
  function hintForRepair(repair) {
    const categoryHints = {
      capital: "Start the sentence with a capital letter",
      punctuation: "Say the sentence aloud — how should it end?",
      "short vowel": "Listen for the vowel sound",
      "sight word": "Remember how the tricky word is spelled",
      blend: "Say the sounds together — which blend fits?",
      "vowel team": "Sound out the vowel team",
      digraph: "Two letters, one sound — say it slowly",
      contraction: "Two words squeezed into one — which letters hide?",
      suffix: "Look at the word ending",
      usage: "Which word makes the sentence sound right?"
    };
    return categoryHints[repair?.category] || repair?.prompt || "Check the sentence and try another tree";
  }

  // Trees all look identical until cut — only then does the choice get colour-coded.
  function revealTokenColors(token) {
    const theme = themeFor(state);
    const reveal = new THREE.Color(token.isCorrect ? theme.accent2 : theme.danger);
    for (const mesh of [token.cutMark, token.signRail, token.beacon]) {
      if (mesh?.material) {
        mesh.material.color.copy(reveal);
        mesh.material.emissive.copy(reveal);
      }
    }
    if (token.glow) token.glow.color.copy(reveal);
  }

  // Speech is additive polish: always gated on the game's live sound flag.
  function speakItem() {
    if (!soundAllowed(options)) return;
    const repair = repairForState(state);
    if (!repair) return;
    speak(`${repair.prompt}. ${repair.display}`);
  }

  function cutChoiceTree(token) {
    if (state.gateLocked || token.cooldown > 0 || token.smashed) return;
    revealTokenColors(token);
    if (token.isCorrect) {
      state.gateLocked = true;
      state.correct += 1;
      state.combo += 1;
      state.focus = clamp(state.focus + 18 + Math.min(10, state.combo), 0, 100);
      token.smashed = true;
      token.smashLife = token.smashMax;
      token.cooldown = 99;
      for (const other of state.tokens) {
        if (other !== token) other.cooldown = 99;
      }
      if (state.focus >= 100 && state.rush <= 0) {
        state.rush = 6.0;
        state.focus = 0;
        setFeedback("PERFECT CUT", "Double points while it lasts", "good", 1.05);
        playSfx(options, playStarChime);
      } else {
        setFeedback("SENTENCE FIXED", state.combo >= 3 ? `Streak x${state.combo}` : `Added ${token.answer}`, "good", 1.05);
        playSfx(options, state.combo >= 3 ? playStarChime : playCorrectChime);
      }
      state.framePulse = 1;
      setScore(state.score + (210 + Math.min(12, state.combo) * 34) * (state.rush > 0 ? 2 : 1));
      updateProgress();
      schedule(nextItemOrLevel, 720);
    } else {
      state.mistakes += 1;
      state.itemMisses += 1;
      state.combo = 0;
      state.focus = clamp(state.focus - 18, 0, 100);
      token.cooldown = 1.2 + (state.itemMisses - 1) * 0.8;
      token.bump = 0.56;
      state.player.speed *= 0.28;
      setScore(state.score - settingsFor(state).wrongPenalty);
      const revealAnswer = state.itemMisses >= 2;
      setFeedback(
        "WRONG TREE",
        revealAnswer ? `Look for ${token.answer}` : hintForRepair(repairForState(state)),
        "bad",
        revealAnswer ? 1.15 : 0.95
      );
      playSfx(options, playSoftBuzz);
    }
  }

  function tryCutNearestTree() {
    if (state.countdown > 0 || state.gateLocked) return;
    let closest = null;
    let closestDistance = Infinity;
    for (const token of state.tokens) {
      if (token.smashed || token.cooldown > 0) continue;
      const dist = distance2({ x: state.player.x, z: state.player.z }, token.group.position);
      if (dist < closestDistance) {
        closest = token;
        closestDistance = dist;
      }
    }
    if (closest && closestDistance < 4.2) {
      cutChoiceTree(closest);
    } else {
      setFeedback("NO TREE NEARBY", "Move closer before cutting", "bad", 0.62);
      playSfx(options, playSoftBuzz);
    }
  }

  function hazardHit(hazard) {
    if (state.invulnerable > 0 || state.countdown > 0 || hazard.stun > 0) return;
    state.invulnerable = 1.1;
    // Hazard bumps are driving slips, not literacy mistakes — tracked separately
    // so they never feed the star rubric.
    state.hazardHits += 1;
    state.combo = 0;
    state.focus = clamp(state.focus - 14, 0, 100);
    state.player.speed = state.player.speed >= 0 ? Math.max(3.6, state.player.speed * 0.54) : Math.min(-1.6, state.player.speed * 0.54);
    hazard.stun = 0.6;
    setScore(state.score - settingsFor(state).hitPenalty);
    setFeedback("FOREST SPRITE", "It knocked your tools loose", "bad", 0.85);
    playSfx(options, playSoftBuzz);
  }

  function updateControls(dt) {
    const settings = settingsFor(state);
    const steerInput = (keys.left ? 1 : 0) - (keys.right ? 1 : 0) + state.pointer.steer;
    const throttleInput = (keys.up ? 1 : 0) - (keys.down ? 0.72 : 0) + state.pointer.throttle;
    state.steerVisual += (clamp(steerInput, -1, 1) - state.steerVisual) * Math.min(1, dt * 8);
    const maxSpeed = settings.maxSpeed * 0.62 * (state.rush > 0 || keys.boost ? 1.18 : 1);
    state.player.speed += throttleInput * settings.accel * 0.68 * dt;
    if (Math.abs(throttleInput) < 0.05) {
      const drag = settings.friction * 1.25 * dt;
      state.player.speed = Math.abs(state.player.speed) <= drag ? 0 : state.player.speed - Math.sign(state.player.speed) * drag;
    }
    state.player.speed = clamp(state.player.speed, -maxSpeed * 0.42, maxSpeed);
    const turnPower = settings.turn * (0.28 + Math.min(1, Math.abs(state.player.speed) / Math.max(1, settings.maxSpeed)) * 0.92);
    state.player.yaw += steerInput * turnPower * dt * (state.player.speed >= 0 ? 1 : -1);
    state.player.x += Math.sin(state.player.yaw) * state.player.speed * dt;
    state.player.z += Math.cos(state.player.yaw) * state.player.speed * dt;
    const clamped = clampPointToBounds(state.player, state.mapBounds, 3.4);
    const clampedX = clamped.x;
    const clampedZ = clamped.z;
    if (clampedX !== state.player.x || clampedZ !== state.player.z) {
      state.player.x = clampedX;
      state.player.z = clampedZ;
      state.player.speed *= -0.24;
      if (state.feedback.life <= 0) setFeedback("MAP EDGE", "Turn back into the woods", "bad", 0.55);
    }
  }

  function updateVehicle(dt) {
    if (!state.vehicle) return;
    const speedNorm = clamp(Math.abs(state.player.speed) / Math.max(1, settingsFor(state).maxSpeed), 0, 1);
    const bounce = Math.sin(elapsedTime * (7 + speedNorm * 10)) * 0.04 * speedNorm;
    const roll = -state.steerVisual * 0.22 * speedNorm;
    const pitch = -Math.sign(state.player.speed) * speedNorm * 0.035;
    state.vehicle.position.set(state.player.x, 0.04 + bounce, state.player.z);
    state.vehicle.rotation.set(pitch, state.player.yaw, roll);
    for (const wheel of state.vehicle.userData.wheels || []) {
      wheel.rotation.x += state.player.speed * dt * 2.2;
    }
  }

  function updateScenery(dt) {
    const t = elapsedTime;
    for (const actor of state.sceneryActors) {
      if (!actor?.userData?.motion) continue;
      const motion = actor.userData.motion;
      if (motion === "cloud") {
        const origin = actor.userData.origin;
        actor.position.x = origin.x + Math.sin(t * actor.userData.speed + origin.z * 0.07) * 4.2;
        actor.position.y = origin.y + Math.sin(t * 0.23 + origin.x * 0.03) * 0.45;
        actor.rotation.y += dt * 0.025;
      } else if (motion === "sun") {
        actor.rotation.y += dt * 0.14;
        actor.rotation.z += dt * 0.08;
      } else if (motion === "sway") {
        actor.rotation.z = Math.sin(t * 1.2 + actor.position.x * 0.03) * actor.userData.sway;
      } else if (motion === "pulse") {
        actor.scale.setScalar(1 + Math.sin(t * 2.4 + actor.position.x * 0.04) * 0.045);
      } else if (motion === "crystal") {
        actor.rotation.y += dt * 0.9;
        actor.position.y += Math.sin(t * 2.2 + actor.position.x) * dt * 0.05;
      } else if (motion === "volcano") {
        const lava = actor.userData.lava;
        const plume = actor.userData.plume;
        if (lava) {
          lava.scale.set(0.55 + Math.sin(t * 3.3) * 0.06, 1, 0.55 + Math.cos(t * 2.7) * 0.05);
          lava.material.emissiveIntensity = 0.72 + Math.sin(t * 5.1) * 0.16;
        }
        if (plume) {
          plume.rotation.y += dt * 0.5;
          plume.position.y = 8 + Math.sin(t * 1.7) * 0.35;
          plume.scale.setScalar(1 + Math.sin(t * 2.1) * 0.08);
        }
      } else if (motion === "windmill") {
        actor.rotation.z += dt * 2.6;
      }
    }
  }

  function updateTrails(dt) {
    state.trailClock -= dt;
    const speed = Math.abs(state.player.speed);
    const activeTrailCount = Math.min(state.trailParticles.length, particleCountForTier(qualityTier, 34));
    if (activeTrailCount && speed > 4.2 && state.trailClock <= 0) {
      const particle = state.trailParticles[state.trailCursor % activeTrailCount];
      state.trailCursor += 1;
      const side = Math.sin(elapsedTime * 19 + state.trailCursor) * 0.34;
      const forward = new THREE.Vector3(Math.sin(state.player.yaw), 0, Math.cos(state.player.yaw));
      const right = new THREE.Vector3(Math.cos(state.player.yaw), 0, -Math.sin(state.player.yaw));
      particle.position.set(
        state.player.x - forward.x * 1.72 + right.x * side,
        0.52,
        state.player.z - forward.z * 1.72 + right.z * side
      );
      particle.rotation.set(elapsedTime * 2.1, state.player.yaw, elapsedTime * 1.7);
      particle.scale.setScalar(state.rush > 0 ? 1.55 : 1);
      particle.userData.life = state.rush > 0 ? 0.72 : 0.5;
      particle.userData.maxLife = particle.userData.life;
      particle.visible = true;
      particle.material.opacity = state.rush > 0 ? 0.78 : 0.48;
      state.trailClock = state.rush > 0 ? 0.018 : 0.036;
    }

    for (const particle of state.trailParticles) {
      if (!particle.visible) continue;
      particle.userData.life -= dt;
      if (particle.userData.life <= 0) {
        particle.visible = false;
        continue;
      }
      const fade = particle.userData.life / Math.max(0.01, particle.userData.maxLife);
      particle.material.opacity = 0.55 * fade;
      particle.scale.multiplyScalar(1 + dt * 1.35);
      particle.position.y += dt * 0.24;
      particle.rotation.y += dt * 4.2;
    }
  }

  function updateTokens(dt) {
    let closest = null;
    let closestDistance = Infinity;
    for (const token of state.tokens) {
      token.cooldown = Math.max(0, token.cooldown - dt);
      if (token.smashed) {
        token.smashLife -= dt;
        const amount = 1 - clamp(token.smashLife / Math.max(0.01, token.smashMax), 0, 1);
        token.group.scale.set(1, Math.max(0.08, 1 - amount * 0.25), 1);
        token.group.position.y = token.home.y + Math.sin(amount * Math.PI) * 0.36;
        token.group.rotation.z = -amount * 1.32;
        token.group.rotation.x = amount * 0.36;
        if (token.face?.material) token.face.material.opacity = Math.max(0.18, 1 - amount);
        token.labelMesh.scale.copy(token.baseScale).multiplyScalar(Math.max(0.15, 1 - amount * 0.7));
        if (token.smashLife <= 0) token.group.visible = false;
        continue;
      }
      token.bump = Math.max(0, token.bump - dt);
      const bumpWave = token.bump > 0 ? Math.sin(token.bump * 28) * token.bump : 0;
      const dist = distance2({ x: state.player.x, z: state.player.z }, token.group.position);
      if (dist < closestDistance) {
        closest = token;
        closestDistance = dist;
      }
      token.group.position.set(
        token.home.x,
        token.home.y + Math.sin(elapsedTime * 2.1 + token.home.x) * 0.025 + Math.abs(bumpWave) * 0.38,
        token.home.z
      );
      token.group.rotation.z = bumpWave * 0.22;
      token.labelMesh.scale.copy(token.baseScale).multiplyScalar(1 + (dist < 6 ? 0.13 : Math.sin(elapsedTime * 3.2) * 0.025) + token.bump * 0.2);
      token.beacon.rotation.y += dt * 1.6;
      token.beacon.position.y = 5.68 + Math.sin(elapsedTime * 4 + token.home.x) * 0.18;
      token.glow.intensity = (dist < 6 ? 1.75 : 0.82) + Math.sin(elapsedTime * 4) * 0.12 + token.bump * 1.8;
    }
    // Cutting is always deliberate: Space/Enter/E, or the on-screen CUT button
    // (see tryCutNearestTree) — never a proximity accident.
    state.nearTreeLabel = closest && closestDistance < 5.2 ? closest.label : "";
  }

  function updateHazards(dt) {
    for (const hazard of state.hazards) {
      hazard.stun = Math.max(0, hazard.stun - dt);
      const t = elapsedTime * hazard.speed + hazard.phase;
      hazard.mesh.position.set(
        hazard.cx + Math.cos(t) * hazard.rx,
        1.45 + Math.sin(t * 2.1) * 0.24,
        hazard.cz + Math.sin(t * 1.13) * hazard.rz
      );
      hazard.mesh.rotation.x += dt * 1.9;
      hazard.mesh.rotation.y += dt * 2.4;
      hazard.mesh.scale.setScalar(hazard.stun > 0 ? 0.72 : 1);
      if (distance2({ x: state.player.x, z: state.player.z }, hazard.mesh.position) < hazard.radius + 1.3) hazardHit(hazard);
    }
  }

  function updateFrame(dt) {
    if (!state.frameGroup) return;
    const beacon = state.frameGroup.userData.beacon;
    const panel = state.frameGroup.userData.panel;
    const floorGlow = state.frameGroup.userData.floorGlow;
    if (beacon) {
      beacon.rotation.y += dt * 1.5;
      beacon.position.y = 5.25 + Math.sin(elapsedTime * 4) * 0.18;
      beacon.scale.setScalar(1 + state.framePulse * 0.45 + Math.sin(elapsedTime * 5) * 0.06);
    }
    if (panel?.material) {
      panel.material.opacity = 0.42 + state.framePulse * 0.22 + Math.sin(elapsedTime * 3) * 0.05;
      panel.material.emissiveIntensity = 0.32 + state.framePulse * 0.45;
    }
    if (floorGlow) {
      floorGlow.scale.set(1 + Math.sin(elapsedTime * 6) * 0.08 + state.framePulse * 0.22, 1, 1 + state.framePulse * 0.24);
    }
    state.framePulse = Math.max(0, state.framePulse - dt * 1.8);
  }

  function updateCamera(dt) {
    const forward = new THREE.Vector3(Math.sin(state.player.yaw), 0, Math.cos(state.player.yaw));
    const speedNorm = clamp(Math.abs(state.player.speed) / Math.max(1, settingsFor(state).maxSpeed), 0, 1);
    const chaseDistance = 14.6 + speedNorm * 2.2;
    const cameraHeight = 9.2 + speedNorm * 0.9 + (state.rush > 0 ? 0.8 : 0);
    const desired = new THREE.Vector3(
      state.player.x - forward.x * chaseDistance,
      cameraHeight,
      state.player.z - forward.z * chaseDistance
    );
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    camera.fov += ((state.rush > 0 ? 62 : 58 + speedNorm * 2) - camera.fov) * Math.min(1, dt * 4);
    camera.updateProjectionMatrix();
    const lookAt = new THREE.Vector3(state.player.x + forward.x * (4.6 + speedNorm * 2), 1.9, state.player.z + forward.z * (4.6 + speedNorm * 2));
    camera.lookAt(lookAt);
  }

  function updateHud() {
    const theme = themeFor(state);
    const answerClearances = state.tokens
      .filter(token => token.isCorrect && !token.smashed && token.group)
      .map(token => answerStartClearance(token.group.position, placementFor(state)));
    renderer.domElement.dataset.playerX = state.player.x.toFixed(2);
    renderer.domElement.dataset.playerZ = state.player.z.toFixed(2);
    renderer.domElement.dataset.speed = state.player.speed.toFixed(2);
    renderer.domElement.dataset.targetTree = repairForState(state)?.answer || "";
    renderer.domElement.dataset.targetCue = repairForState(state)?.cue || "";
    renderer.domElement.dataset.choiceLocked = state.gateLocked ? "1" : "0";
    renderer.domElement.dataset.nearTree = state.nearTreeLabel;
    renderer.domElement.dataset.treeCount = String(state.tokens.filter(token => !token.smashed).length);
    renderer.domElement.dataset.correctTreeCount = String(state.tokens.filter(token => token.isCorrect && !token.smashed).length);
    renderer.domElement.dataset.answerMinStartDistance = answerClearances.length
      ? Math.min(...answerClearances.map(clearance => clearance.distance)).toFixed(2)
      : "";
    renderer.domElement.dataset.answerFrontLaneCount = String(answerClearances.filter(clearance => clearance.inFrontLane).length);
    renderer.domElement.dataset.answerTooCloseCount = String(answerClearances.filter(clearance => clearance.tooClose).length);
    renderer.domElement.dataset.itemIndex = String(state.itemIndex);
    renderer.domElement.dataset.correct = String(state.correct);
    renderer.domElement.dataset.completedRepair = completedSentenceForRepair(repairForState(state));
    if (state.frameGroup) {
      renderer.domElement.dataset.frameX = state.frameGroup.position.x.toFixed(2);
      renderer.domElement.dataset.frameZ = state.frameGroup.position.z.toFixed(2);
    }
    nodes.room.textContent = `${theme.name} ${state.stage + 1} of 10`;
    nodes.prompt.textContent = currentPrompt();
    const repair = repairForState(state);
    nodes.cue.textContent = repair?.cue ? `Picture cue: ${repair.cue}` : "";
    nodes.cue.setAttribute("aria-label", repair?.cue ? `Picture cue: ${repair.cue}` : "Picture cue");
    nodes.display.textContent = state.gateLocked
      ? completedSentenceForRepair(repair)
      : repair?.display || "";
    const canReplay = soundAllowed(options);
    nodes.replay.disabled = !canReplay;
    nodes.replay.style.opacity = canReplay ? "1" : "0.72";
    nodes.replay.style.cursor = canReplay ? "pointer" : "not-allowed";
    nodes.replayLabel.textContent = canReplay ? "Hear sentence again" : "Sentence shown - sound off";
    nodes.replay.setAttribute("aria-label", canReplay ? "Hear the sentence again" : "Sentence shown; sound is off");
    nodes.score.textContent = `${state.score} pts`;
    nodes.streak.textContent = `Streak x${Math.max(1, state.combo)}`;
    nodes.progress.style.width = `${Math.round(state.progress * 100)}%`;
    nodes.progress.style.background = theme.accent;
    nodes.focus.style.width = `${Math.round((state.rush > 0 ? 1 : state.focus / 100) * 100)}%`;
    nodes.focus.style.background = state.rush > 0 ? theme.accent2 : "#ffffff";
    nodes.status.textContent = state.nearTreeLabel ? `Cut ${state.nearTreeLabel}?` : `Fixed ${state.correct}/${total}`;
    nodes.cut.style.opacity = state.nearTreeLabel ? "1" : "0.55";

    nodes.feedback.style.opacity = state.feedback.life > 0 ? String(easeOut(state.feedback.life / state.feedback.maxLife)) : "0";
    nodes.feedbackMain.textContent = state.feedback.text;
    nodes.feedbackSub.textContent = state.feedback.sub;
    nodes.feedbackMain.style.color = state.feedback.tone === "bad" ? "#ffabb6" : theme.accent2;

    if (state.countdown > 0) {
      const repair = repairForState(state);
      nodes.countdown.style.display = "flex";
      nodes.countdownPrompt.textContent = `Find the tree that fixes:`;
      nodes.countdownCue.textContent = repair?.cue ? `Picture cue: ${repair.cue}` : "";
      nodes.countdownDisplay.textContent = repair?.display || "";
      nodes.countdownMain.textContent = state.countdown <= 0.72 ? "BEGIN" : String(Math.ceil(state.countdown));
      nodes.countdownMain.style.color = state.countdown <= 0.72 ? theme.accent : theme.accent2;
    } else {
      nodes.countdown.style.display = "none";
    }
  }

  function update(dt) {
    if (state.paused || state.ended) return;
    dt = Math.min(0.05, dt);
    if (state.countdown > 0) {
      state.countdown = Math.max(0, state.countdown - dt);
      updateScenery(dt);
      updateHazards(dt * 0.35);
      updateVehicle(dt);
      updateTrails(dt);
      updateFrame(dt);
      updateCamera(dt);
      state.feedback.life = Math.max(0, state.feedback.life - dt);
      updateHud();
      return;
    }
    updateScenery(dt);
    updateControls(dt);
    updateVehicle(dt);
    updateTrails(dt);
    updateTokens(dt);
    updateHazards(dt);
    updateFrame(dt);
    updateCamera(dt);
    state.rush = Math.max(0, state.rush - dt);
    state.invulnerable = Math.max(0, state.invulnerable - dt);
    state.feedback.life = Math.max(0, state.feedback.life - dt);
    updateHud();
  }

  function animate(now) {
    const dt = readFrameDelta(now);
    update(dt);
    const renderedTier = premiumRender.render(dt);
    if (renderedTier !== qualityTier) {
      qualityTier = renderedTier;
      applyQualityTier(renderer, qualityTier, { floor: 1 });
    }
  }
  const loop = createFrameLoop(animate);

  function onKeyDown(event) {
    if (isInteractiveKeyTarget(event.target)) return;
    if (state.ended || state.paused) return;
    const horizontal = laneDirectionForKey(event.key);
    const vertical = verticalDirectionForKey(event.key);
    if (horizontal < 0) {
      event.preventDefault();
      keys.left = true;
    } else if (horizontal > 0) {
      event.preventDefault();
      keys.right = true;
    } else if (vertical < 0) {
      event.preventDefault();
      keys.up = true;
    } else if (vertical > 0) {
      event.preventDefault();
      keys.down = true;
    } else if (event.key === "Shift") {
      event.preventDefault();
      keys.boost = true;
    } else if (isPrimaryActionKey(event.key)) {
      event.preventDefault();
      tryCutNearestTree();
    }
  }

  function onKeyUp(event) {
    const horizontal = laneDirectionForKey(event.key);
    const vertical = verticalDirectionForKey(event.key);
    if (horizontal < 0) keys.left = false;
    else if (horizontal > 0) keys.right = false;
    else if (vertical < 0) keys.up = false;
    else if (vertical > 0) keys.down = false;
    else if (event.key === "Shift") keys.boost = false;
  }

  function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(1, rect.width);
    const y = (event.clientY - rect.top) / Math.max(1, rect.height);
    state.pointer.steer = clamp((x - 0.5) * 2.35, -1, 1);
    state.pointer.throttle = y < 0.72 ? 1 : y > 0.88 ? -0.6 : 0.45;
  }

  function onPointerDown(event) {
    event.preventDefault();
    state.pointer.active = true;
    renderer.domElement.setPointerCapture?.(event.pointerId);
    updatePointer(event);
    playSfx(options, playTapSound);
  }

  function onPointerMove(event) {
    if (!state.pointer.active) return;
    updatePointer(event);
  }

  function onPointerUp(event) {
    event.preventDefault();
    state.pointer.active = false;
    state.pointer.steer = 0;
    state.pointer.throttle = 0;
  }

  function bindTouchButton(node, key) {
    if (!node) return;
    const down = event => {
      event.preventDefault();
      event.stopPropagation();
      node.setPointerCapture?.(event.pointerId);
      node.style.transform = "translateY(2px) scale(.98)";
      keys[key] = true;
      if (key === "up") state.player.speed = Math.max(state.player.speed, 1.8);
      if (key === "down") state.player.speed = Math.min(state.player.speed, -1.2);
    };
    const up = event => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      node.style.transform = "";
      keys[key] = false;
    };
    node.addEventListener("pointerdown", down);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
    node.addEventListener("lostpointercapture", up);
  }

  const detachResize = attachResize({
    mount,
    renderer,
    camera,
    width: mountWidth,
    height: mountHeight,
    listenToWindow: false,
    updateStyle: false,
    onResize: handleResize
  });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);
  bindTouchButton(nodes.moveForward, "up");
  bindTouchButton(nodes.moveBack, "down");
  bindTouchButton(nodes.turnLeft, "left");
  bindTouchButton(nodes.turnRight, "right");
  nodes.cut.addEventListener("pointerdown", event => {
    event.preventDefault();
    event.stopPropagation();
    playSfx(options, playTapSound);
    tryCutNearestTree();
  });
  nodes.replay.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    speakItem();
  });
  startLevel(state.stage, { countdown: true });

  // First-run onboarding: one goal line + the controls, shown once per device.
  // update() returns immediately while state.paused is set, so the countdown
  // and every actor freeze behind the overlay, and a GamePlayer chrome resume
  // is ignored until the child dismisses — the two pauses can't fight.
  let introActive = false;
  let introEl = null;
  function dismissIntro() {
    if (!introActive) return;
    introActive = false;
    markOnboardingSeen(options.kind || "star-gallery");
    if (introEl) introEl.style.display = "none";
    window.removeEventListener("keydown", onIntroKey, true);
    neutralizeArcadeInput(keys, state.pointer);
    state.paused = false;
    frameTimer.resume(); // discard the time spent reading, so the countdown doesn't lurch
  }
  function onIntroKey(event) {
    if (isInteractiveKeyTarget(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    dismissIntro();
  }
  if (!hasSeenOnboarding(options.kind || "star-gallery")) {
    introActive = true;
    state.paused = true;
    introEl = document.createElement("div");
    introEl.style.cssText = "position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:rgba(2,4,16,.88);pointer-events:auto;cursor:pointer";
    introEl.innerHTML =
      '<div style="display:grid;gap:14px;justify-items:center;max-width:min(560px,88vw);padding:20px">' +
        '<div style="font-size:13px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#7fffe9">Sentence Grove</div>' +
        '<div style="font-size:clamp(20px,3.4vw,28px);font-weight:900;line-height:1.25;text-wrap:balance">Drive through the grove and cut the tree with the word that fixes the sentence.</div>' +
        '<div style="font-size:15px;font-weight:800;line-height:1.6;opacity:.92">Drive with the arrow keys or WASD — on a touch screen, use the movement buttons or press and drag to steer.<br>Press Space, Enter, or the CUT button to cut a tree. Hold Shift for a boost.</div>' +
        '<div style="font-size:17px;font-weight:900;color:#052e2b;background:#52ffe1;border:3px solid rgba(255,255,255,.88);border-radius:14px;padding:12px 30px;box-shadow:0 4px 0 rgba(0,0,0,.45)">Tap to play</div>' +
        '<div style="font-size:12px;font-weight:800;opacity:.65">or press any key</div>' +
      '</div>';
    introEl.addEventListener("pointerdown", event => {
      event.preventDefault();
      dismissIntro();
    });
    window.addEventListener("keydown", onIntroKey, true);
    overlay.appendChild(introEl);
  }

  const api = {
    pause() {
      neutralizeArcadeInput(keys, state.pointer);
      state.paused = true;
      frameTimer.pause();
    },
    resume() {
      if (introActive) return;
      neutralizeArcadeInput(keys, state.pointer);
      state.paused = false;
      frameTimer.resume();
    },
    destroy() {
      state.ended = true;
      cancelSpeech();
      loop.stop();
      detachContextGuard();
      timers.forEach(timer => window.clearTimeout(timer));
      timers.clear();
      detachResize();
      motionQuery?.removeEventListener?.("change", syncMotionPreference);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onIntroKey, true);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      clearLevel();
      premiumRender.destroy();
      disposeRenderer(renderer);
      if (overlay.parentNode === mount) mount.removeChild(overlay);
      if (options.debugGlobalName && window[options.debugGlobalName] === api) delete window[options.debugGlobalName];
      mount.style.position = previousPosition;
    },
    debugSnapshot() {
      return {
        kind: options.kind,
        stage: state.stage,
        world: state.level?.world,
        levelTitle: state.level?.title,
        itemIndex: state.itemIndex,
        score: state.score,
        correct: state.correct,
        total,
        mistakes: state.mistakes,
        hazardHits: state.hazardHits,
        combo: state.combo,
        countdown: state.countdown,
        currentRepair: repairForState(state),
        currentCompletedSentence: completedSentenceForRepair(repairForState(state)),
        currentAcceptedAnswers: acceptedRepairAnswers(repairForState(state)),
        player: { ...state.player },
        gateLocked: state.gateLocked,
        nearTreeLabel: state.nearTreeLabel,
        elapsedTime,
        paused: state.paused,
        input: {
          keys: { ...keys },
          pointer: { ...state.pointer }
        },
        mapBounds: state.mapBounds,
        frame: state.frameGroup
          ? {
              x: state.frameGroup.position.x,
              z: state.frameGroup.position.z,
              yaw: state.frameGroup.rotation.y
            }
          : null,
        targetTree: repairForState(state)?.answer || null,
        tokens: state.tokens.map(token => ({
          label: token.label,
          isCorrect: token.isCorrect,
          smashed: token.smashed,
          cooldown: token.cooldown,
          position: token.group ? { x: token.group.position.x, z: token.group.position.z } : null,
          startClearance: token.group ? answerStartClearance(token.group.position, placementFor(state)) : null
        })),
        hazards: state.hazards.map(hazard => ({
          x: hazard.mesh.position.x,
          z: hazard.mesh.position.z,
          stun: hazard.stun
        }))
      };
    },
    debugStartLevel(stage) {
      startLevel(stage, { countdown: true });
      updateHud();
      return api.debugSnapshot();
    }
  };
  const detachContextGuard = attachContextLossGuard(renderer, {
    onLost: () => api.pause(),
    onRestored: () => {
      premiumRender.restoreContext();
      api.resume();
    }
  });
  if (options.debugGlobalName) window[options.debugGlobalName] = api;
  options.onEngineReady?.(api);
  loop.start(true); // immediate first tick preserves the old synchronous animate() call
  return api;
}

export default function StarGalleryArcadeGame({
  kind,
  difficulty = "easy",
  startLevel = 0,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  onEngineReady,
  debugGlobalName,
  isSoundEnabled = true
}) {
  const mountRef = useRef(null);
  const soundRef = useRef(isSoundEnabled);
  const handlersRef = useRef({
    onScoreUpdate,
    onProgressUpdate,
    onComplete,
    onCheckpoint,
    onEngineReady
  });

  useEffect(() => {
    soundRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  useEffect(() => {
    handlersRef.current = {
      onScoreUpdate,
      onProgressUpdate,
      onComplete,
      onCheckpoint,
      onEngineReady
    };
  }, [onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const engine = createStarGalleryEngine(mountRef.current, {
      kind,
      difficulty,
      startLevel,
      debugGlobalName,
      getSound: () => soundRef.current,
      onScoreUpdate: score => handlersRef.current.onScoreUpdate?.(score),
      onProgressUpdate: (current, totalValue) => handlersRef.current.onProgressUpdate?.(current, totalValue),
      onComplete: (stars, finalScore, totalValue) => handlersRef.current.onComplete?.(stars, finalScore, totalValue),
      onCheckpoint: (level, totalLevels) => handlersRef.current.onCheckpoint?.(level, totalLevels),
      onEngineReady: api => handlersRef.current.onEngineReady?.(api)
    });
    return () => engine.destroy();
  }, [kind, difficulty, startLevel, debugGlobalName]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "360px",
        background: "#050716",
        overflow: "hidden"
      }}
    />
  );
}
