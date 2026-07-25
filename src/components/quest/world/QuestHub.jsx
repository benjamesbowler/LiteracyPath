// SOUND SEEKERS TRAIL - a long guided journey with room to roam.
//
// Three.js owns the path, forest walls, rigged characters, camera, and gate.
// React owns only the projected labels and phonics interaction panels. Only the
// next story encounter is active, so the 40-stop curriculum stays coherent
// without making movement feel like a side-scrolling level.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import Guide from "./Guide.jsx";
import { ENCOUNTER_VIEWS } from "./encounterViews.js";
import { budgetPhysicalSection } from "../../../utils/questPhysicalPlan.js";

// Touch devices get the big-answer strip PINNED: focus-within only ever
// helped keyboard users; a sighted motor-impaired child on touch saw nothing.
const COARSE_POINTER = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);
import {
  QuestRenderPipeline,
  attachBeveledLetterTokens,
  disposeQuestScene,
  loadQuestTokenFont
} from "./questPremiumRender.js";
import {
  createAuthoredChapterKit,
  createImportedFieldAvatars,
  createImportedNature,
  createRiggedTrailCharacters,
  disposeAssetObject,
  updateAuthoredChapterKit,
  updateImportedFieldAvatar,
  updateImportedNature,
  updateRiggedCharacter
} from "./questAssets.js";
import {
  buildTrailSection,
  clampTrailPosition,
  firstUnsolvedEncounter,
  forwardLimitFor,
  routeDirectionAt,
  routeMovementVector,
  routePointAt,
  routeProgressAt,
  routeSidePoint,
  TRAIL_START
} from "../../../utils/questHub.js";
import { targetsForStop } from "../../../utils/questReviewScheduler.js";
import { targetsAtStop, getStop, QUEST_STOPS } from "../../../data/questSequence.js";
import { starRubric } from "../../../utils/starRubric.js";
import { playCorrectChime, playSoftBuzz, playStarChime, playWhoosh } from "../../../utils/audio/gameSfx.js";
import { displayGrapheme, sayGrapheme, sayWord } from "../shells/shellContract.js";
import { getDye, normalizeCreature } from "../../../data/creatureParts.js";
import { questCreatureRigSpec } from "../../../utils/questCreature3D.js";
import {
  availableSparks,
  questRewardBonuses,
  SPARKS_PER_DROP
} from "../../../utils/questProgress.js";
import {
  createQuestFrameBudgetState,
  detectQuestQuality,
  sampleQuestFrameBudget
} from "../../../utils/questPerformance.js";
import {
  buildPhysicalTask,
  fieldCollisionStep,
  physicalTaskForwardLimit,
  physicalTaskResidentPoint,
  physicalStage,
  physicalStagePrompt,
  physicalStageRecordsMastery,
  physicalTaskKey
} from "../../../utils/questPhysicalMechanics.js";
import { hasGraphemeAudio, hasWordAudio } from "../../../utils/questAudio.js";
import {
  completeTeachBack,
  correctionKey,
  correctionPresentation,
  nextQueuedReview,
  normalizeCorrection,
  promptLevelForMode,
  recordCorrectionMiss
} from "../../../utils/questCorrection.js";
import { seedwakeSatchel, seedwakeStopSpec } from "../../../data/questChapterOne.js";
import { segmentWord } from "../../../utils/questSegments.js";
import {
  advancePhonemeSlotState,
  applyQuestTaskInput,
  createPhonemeSlotState,
  createQuestLocomotionState,
  createSeedwakeVerbState,
  encounterCameraPose,
  isChapterGateOpen,
  projectedRectInsideSafeArea,
  questMechanicProfile,
  questRhythmPulse,
  resolveQuestPointerIntent,
  restoreSeedwakeVerbState,
  seedwakeEncounterHudModel,
  seedwakeResidentPerformance,
  sliceSafeArea,
  stepQuestLocomotion
} from "../../../utils/questSliceSystems.js";

const MOVE_SPEED = 4.6;
const ENCOUNTER_REACH = 1.7;
const AUTOSAVE_MS = 1200;

const RESIDENT_CREATURE_CAST = [
  { body: "pebble", pattern: "pattern-spots", eyes: "eyes-big", mouth: "mouth-grin", crest: "crest-frond", tail: "tail-fern", feet: "feet-round" },
  { body: "stalk", pattern: "pattern-stripes", eyes: "eyes-wide", mouth: "mouth-smile", crest: "crest-ears", tail: "tail-curl", feet: "feet-tall" },
  { body: "moth", pattern: "pattern-stars", eyes: "eyes-sleepy", mouth: "mouth-round", crest: "crest-antenna", tail: "tail-fan", feet: "feet-paws" },
  { body: "boulder", pattern: "pattern-scales", eyes: "eyes-tiny", mouth: "mouth-tusks", crest: "crest-horns", tail: "tail-spade", feet: "feet-hoofs" },
  { body: "spike", pattern: "pattern-none", eyes: "eyes-one", mouth: "mouth-beak", crest: "crest-fin", tail: "tail-spike", feet: "feet-claws" }
];

function residentCreatureSpec(index, world = "meadow") {
  const worldOffset = world === "dino" ? 2 : world === "moonwood" ? 4 : 0;
  const spec = RESIDENT_CREATURE_CAST[(Math.max(0, index) + worldOffset) % RESIDENT_CREATURE_CAST.length];
  return { ...spec, dye: "moss", equipped: { head: null, back: null, neck: null, held: null } };
}

function physicalTaskAnswers(task) {
  if (task?.learningSequence?.length) return [...task.learningSequence];
  return (task?.stages || []).map(stage => stage.items.find(item => item.correct)?.value).filter(value => value != null);
}

const SIGN_OBJECT_COLOURS = {
  red: 0xc95043,
  green: 0x53a85d,
  black: 0x2b2a27
};

const WORLD_THEMES = {
  meadow: {
    name: "Sunlit Meadow",
    sky: 0xa9d4df,
    hemi: 0xd7e8df,
    ground: 0x537a49,
    path: 0xc9aa72,
    pathEdge: 0x7f633e,
    canopy: [0x315f36, 0x447743, 0x5e8c50, 0x789d5d],
    trunk: 0x705035,
    fog: 0xb8d2c8,
    stone: 0x849181,
    gate: 0x85522f,
    structure: 0xb87943,
    water: 0x8fcdd4,
    flower: 0xe8c657,
    glow: 0xffdc70,
    dust: 0xf3e6b3
  },
  dino: {
    name: "Fossil Ridge",
    sky: 0xf0c987,
    hemi: 0xffdfaa,
    ground: 0x9b794b,
    path: 0xd6b77f,
    pathEdge: 0x735236,
    canopy: [0x476b43, 0x5f794b, 0x758653, 0x8b965c],
    trunk: 0x62442e,
    fog: 0xd5bf8d,
    stone: 0x897963,
    gate: 0x76503a,
    structure: 0xa86838,
    water: 0x3e3028,
    flower: 0xc7904d,
    glow: 0xffbd63,
    dust: 0xe7c682
  },
  moonwood: {
    name: "Moonwood",
    sky: 0x3c456a,
    hemi: 0xc9d8ff,
    ground: 0x344f4b,
    path: 0x7a7187,
    pathEdge: 0x40384d,
    canopy: [0x244d55, 0x315b61, 0x42656a, 0x5d7073],
    trunk: 0x40364a,
    fog: 0x45536e,
    stone: 0x69717d,
    gate: 0x58445f,
    structure: 0x6d5f83,
    water: 0x73a5b7,
    flower: 0x8fd3e8,
    glow: 0x9fe7ff,
    dust: 0xaec8ff
  }
};

const SEEDWAKE_VISUAL_MOODS = {
  s1: {
    ground: 0x4d7650, path: 0xcaa878, pathEdge: 0x71543d, stone: 0x6f8079,
    structure: 0xa96845, water: 0x70aeb0, flower: 0xe4aa66, glow: 0xffc95e, fog: 0xaac9bd
  },
  s2: {
    ground: 0x426d58, path: 0xbab486, pathEdge: 0x626b4c, stone: 0x72857d,
    structure: 0x8a6e50, water: 0x479ca0, flower: 0xc89bd7, glow: 0xaee5a0, fog: 0x9fc9c2
  },
  s3: {
    ground: 0x687548, path: 0xc99a68, pathEdge: 0x72543b, stone: 0x776d65,
    structure: 0xb66445, water: 0x6da2a2, flower: 0xe7bd58, glow: 0xf2b85a, fog: 0xbfc7a8
  },
  s4: {
    ground: 0x466b5d, path: 0xa99a78, pathEdge: 0x586554, stone: 0x687c7a,
    structure: 0xa85d4d, water: 0x397f91, flower: 0xd39aaf, glow: 0xb9e5d5, fog: 0x9abbb7
  },
  s5: {
    ground: 0x505d49, path: 0x9f896d, pathEdge: 0x5d5044, stone: 0x746f7d,
    structure: 0x765773, water: 0x5d8092, flower: 0xe8b65f, glow: 0xd2b2f2, fog: 0xa9a9b3
  }
};

const SEEDWAKE_LIGHT_MOODS = {
  s1: { id: "lantern-dawn", warmth: 0.24, glow: 0.5 },
  s2: { id: "fern-morning", warmth: 0.06, glow: 0.56 },
  s3: { id: "rook-noon", warmth: 0.48, glow: 0.52 },
  s4: { id: "river-mist", warmth: 0.02, glow: 0.62 },
  s5: { id: "gate-gloaming", warmth: 0.66, glow: 0.8 }
};

function surfaceMaps(seed, {
  repeatX = 4,
  repeatY = 20,
  contrast = 18,
  kind = "ground",
  anisotropy = 4,
  detail = "rich"
} = {}) {
  const lowDetail = detail === "low";
  const size = lowDetail ? 128 : 256;
  const canvas = document.createElement("canvas");
  const heightCanvas = lowDetail ? null : document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  if (heightCanvas) {
    heightCanvas.width = size;
    heightCanvas.height = size;
  }
  const context = canvas.getContext("2d");
  const heightContext = heightCanvas?.getContext("2d") || null;
  const image = context.createImageData(size, size);
  const heightImage = heightContext?.createImageData(size, size) || null;
  const fade = value => value * value * (3 - 2 * value);
  const hash = (x, y, salt) => {
    const value = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  };
  const tileNoise = (u, v, cells, salt) => {
    const gridX = u * cells;
    const gridY = v * cells;
    const cellX = Math.floor(gridX);
    const cellY = Math.floor(gridY);
    const nextX = (cellX + 1) % cells;
    const nextY = (cellY + 1) % cells;
    const wrappedX = cellX % cells;
    const wrappedY = cellY % cells;
    const blendX = fade(gridX - cellX);
    const blendY = fade(gridY - cellY);
    const top = THREE.MathUtils.lerp(hash(wrappedX, wrappedY, salt), hash(nextX, wrappedY, salt), blendX);
    const bottom = THREE.MathUtils.lerp(hash(wrappedX, nextY, salt), hash(nextX, nextY, salt), blendX);
    return THREE.MathUtils.lerp(top, bottom, blendY);
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const u = x / (size - 1);
      const v = y / (size - 1);
      const broad = tileNoise(u, v, 4, seed) * 0.52
        + tileNoise(u, v, 9, seed + 17) * 0.31
        + tileNoise(u, v, 21, seed + 31) * 0.17;
      const grain = tileNoise(u, v, 67, seed + 47);
      const fibre = kind === "path"
        ? Math.sin(Math.PI * 2 * (u * 29 + v * 83 + seed * 0.043)) * 0.08
        : Math.sin(Math.PI * 2 * (u * 101 - v * 17 + seed * 0.059)) * 0.055;
      const value = THREE.MathUtils.clamp(218 + broad * contrast + grain * 7 + fibre * contrast, 174, 246);
      image.data[index] = value + (kind === "ground" ? 3 : 5);
      image.data[index + 1] = value + (kind === "ground" ? 5 : 3);
      image.data[index + 2] = value - (kind === "ground" ? 4 : 7);
      image.data[index + 3] = 255;
      if (heightImage) {
        const height = THREE.MathUtils.clamp(128 + broad * 42 + grain * 18 + fibre * 34, 38, 224);
        heightImage.data[index] = height;
        heightImage.data[index + 1] = height;
        heightImage.data[index + 2] = height;
        heightImage.data[index + 3] = 255;
      }
    }
  }
  context.putImageData(image, 0, 0);
  if (heightContext && heightImage) heightContext.putImageData(heightImage, 0, 0);
  const markCount = lowDetail ? (kind === "path" ? 42 : 78) : (kind === "path" ? 96 : 180);
  for (let index = 0; index < markCount; index += 1) {
    const randomX = 0.05 + (Math.abs(Math.sin(seed * 19.13 + index * 71.7) * 43758.5453) % 1) * 0.9;
    const randomY = 0.05 + (Math.abs(Math.sin(seed * 31.71 + index * 43.3) * 23421.631) % 1) * 0.9;
    const randomSize = Math.abs(Math.sin(seed * 7.11 + index * 11.9) * 18117.13) % 1;
    context.strokeStyle = kind === "path" ? "rgba(90, 74, 52, 0.17)" : "rgba(53, 84, 41, 0.2)";
    context.lineWidth = 0.8 + randomSize * 1.4;
    context.beginPath();
    context.moveTo(randomX * size, randomY * size);
    context.lineTo(
      randomX * size + (kind === "path" ? 2 : 7 + randomSize * 6),
      randomY * size + (kind === "path" ? 4 + randomSize * 5 : -5 - randomSize * 8)
    );
    context.stroke();
  }
  const map = new THREE.CanvasTexture(canvas);
  const bumpMap = heightCanvas ? new THREE.CanvasTexture(heightCanvas) : null;
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, bumpMap].filter(Boolean)) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = anisotropy;
    texture.userData.questSurface = true;
  }
  return bumpMap ? { map, bumpMap } : { map };
}

function pathRibbon(points, width, y, color, seed, anisotropy = 4, detail = "rich") {
  const steps = Math.max(1, points.length - 1);
  const vertices = [];
  const uvs = [];
  const indices = [];
  for (let index = 0; index <= steps; index += 1) {
    const point = points[index];
    const t = Number.isFinite(point.progress) ? point.progress : index / steps;
    const before = points[Math.max(0, index - 1)];
    const after = points[Math.min(steps, index + 1)];
    const tangent = new THREE.Vector3(
      Number.isFinite(point.tangentX) ? point.tangentX : after.x - before.x,
      Number.isFinite(point.tangentY) ? point.tangentY : (after.y || 0) - (before.y || 0),
      Number.isFinite(point.tangentZ) ? point.tangentZ : after.z - before.z
    ).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
    const pointY = (point.y || 0) + y;
    vertices.push(point.x + side.x, pointY, point.z + side.z, point.x - side.x, pointY, point.z - side.z);
    uvs.push(0, t, 1, t);
    if (index < steps) {
      const a = index * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const maps = surfaceMaps(seed + Math.round(y * 1000), {
    repeatX: 2.2,
    repeatY: 34,
    contrast: 22,
    kind: "path",
    anisotropy,
    detail
  });
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(y >= 0.1 ? 0.66 : 0.78),
      ...maps,
      bumpScale: y >= 0.1 ? 0.055 : 0.08,
      roughness: 0.9,
      envMapIntensity: 0.34,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      side: THREE.DoubleSide
    })
  );
  mesh.receiveShadow = true;
  return mesh;
}

function irregularGladeGeometry(radius, segments, seed) {
  const geometry = new THREE.CircleGeometry(radius, segments);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const distance = Math.hypot(x, y);
    if (distance < radius * 0.5) continue;
    const angle = Math.atan2(y, x);
    const edge = 0.955
      + Math.sin(angle * 3 + seed * 0.71) * 0.028
      + Math.sin(angle * 7 - seed * 0.39) * 0.018;
    positions.setXY(index, x * edge, y * edge);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function buildEncounterGlades(scene, section, theme, quality, maxAnisotropy) {
  const glades = new THREE.Group();
  glades.name = "authored-encounter-glades";
  const taskPoints = [section.guide, ...section.encounters];
  taskPoints.forEach((taskPoint, index) => {
    const radius = index === 0 ? 3.15 : 4.25;
    const centre = index === 0
      ? taskPoint
      : routePointAt(section.route, Math.min(0.9, taskPoint.progress + 0.042));
    const segments = quality.id === "low" ? 36 : 64;
    const maps = surfaceMaps(section.stopIndex * 61 + index * 17, {
      repeatX: 3,
      repeatY: 3,
      contrast: 18,
      kind: "path",
      anisotropy: maxAnisotropy,
      detail: quality.id
    });
    const edge = new THREE.Mesh(
      irregularGladeGeometry(radius, segments, section.stopIndex * 13 + index),
      mat(theme.pathEdge, { roughness: 0.84, envMapIntensity: 0.34 })
    );
    edge.name = `encounter-glade-edge-${index + 1}`;
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(centre.x, (centre.y || 0) + 0.109, centre.z);
    edge.receiveShadow = true;
    glades.add(edge);

    const fill = new THREE.Mesh(
      irregularGladeGeometry(radius - 0.2, segments, section.stopIndex * 13 + index + 0.17),
      mat(new THREE.Color(theme.path).multiplyScalar(0.74), {
        ...maps,
        bumpScale: 0.045,
        roughness: 0.86,
        envMapIntensity: 0.42,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      })
    );
    fill.name = `encounter-glade-${index + 1}`;
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(centre.x, (centre.y || 0) + 0.114, centre.z);
    fill.receiveShadow = true;
    glades.add(fill);
  });
  scene.add(glades);
  return glades;
}

function addTree(scene, x, z, size, theme, shade = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(size);
  const trunkMaterial = mat(theme.trunk, { roughness: 0.86 });
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.25, 1.5, 12),
    trunkMaterial
  );
  trunk.position.y = 0.72;
  trunk.castShadow = true;
  group.add(trunk);

  for (let index = 0; index < 3; index += 1) {
    const angle = index / 3 * Math.PI * 2 + shade * 0.27;
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 0.86, 9), trunkMaterial);
    branch.position.set(Math.cos(angle) * 0.22, 1.18 + index * 0.12, Math.sin(angle) * 0.22);
    branch.rotation.set(Math.sin(angle) * 0.72, angle, Math.cos(angle) * -0.72);
    branch.castShadow = true;
    group.add(branch);
  }

  const crownPositions = [
    [-0.46, 1.67, 0.04, 0.72],
    [0.42, 1.72, -0.05, 0.78],
    [-0.08, 2.08, 0.02, 0.82],
    [0.02, 1.66, 0.42, 0.66],
    [0.1, 1.68, -0.42, 0.64]
  ];
  crownPositions.forEach((entry, index) => {
    const crown = new THREE.Mesh(
      new THREE.DodecahedronGeometry(entry[3], 1),
      mat(theme.canopy[(shade + index) % theme.canopy.length], { roughness: 0.84 })
    );
    crown.position.set(entry[0], entry[1], entry[2]);
    crown.scale.set(1.08, 0.92 + (index % 2) * 0.08, 0.9);
    crown.rotation.y = index * 0.72;
    crown.castShadow = true;
    group.add(crown);
  });
  scene.add(group);
  return group;
}

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.02,
    envMapIntensity: 0.72,
    ...options
  });
}

function glowMat(color, opacity = 0.42) {
  return mat(color, {
    emissive: color,
    emissiveIntensity: 0.92,
    transparent: true,
    opacity,
    roughness: 0.36,
    metalness: 0.04,
    envMapIntensity: 1.2
  });
}

function clayMat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.38,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
    sheen: 0.24,
    sheenRoughness: 0.72,
    envMapIntensity: 0.98,
    ...options
  });
}

function inkMat(options = {}) {
  return clayMat(0x221f2e, { roughness: 0.48, clearcoat: 0.1, ...options });
}

function pathSidePoint(section, progress, side, offset = 1.5) {
  return routeSidePoint(section.route, progress, side, offset);
}

function addFence(scene, section, progress, side, theme, length = 4) {
  const point = pathSidePoint(section, progress, side, 0.72);
  const group = new THREE.Group();
  group.position.set(point.x, point.y, point.z);
  group.rotation.y = routeDirectionAt(section.route, progress).heading + Math.PI / 2;
  const postMaterial = mat(theme.structure);
  const railMaterial = mat(theme.trunk);
  for (let index = 0; index < length; index += 1) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.78, 0.14), postMaterial);
    post.position.set((index - (length - 1) / 2) * 0.7, 0.39, 0);
    post.castShadow = true;
    group.add(post);
  }
  for (const y of [0.38, 0.62]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(length * 0.7, 0.09, 0.1), railMaterial);
    rail.position.set(0, y, 0.04);
    rail.castShadow = true;
    group.add(rail);
  }
  scene.add(group);
  return group;
}

function addCottage(scene, section, progress, side, theme) {
  const point = pathSidePoint(section, progress, side, 2.3);
  const group = new THREE.Group();
  group.position.set(point.x, point.y, point.z);
  group.rotation.y = routeDirectionAt(section.route, progress).heading + (side > 0 ? -0.4 : 0.4);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.92, 1.05), mat(theme.path));
  base.position.y = 0.46;
  base.castShadow = true;
  group.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.98, 0.72, 4), mat(theme.gate));
  roof.position.y = 1.16;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.48, 0.04), mat(theme.trunk));
  door.position.set(0, 0.3, 0.55);
  group.add(door);
  scene.add(group);
  return group;
}

function addWindmill(scene, x, z, theme, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.82, 2.4, 0.7), mat(theme.path));
  tower.position.y = 1.2;
  tower.castShadow = true;
  group.add(tower);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.58, 5), mat(theme.gate));
  roof.position.y = 2.7;
  roof.castShadow = true;
  group.add(roof);
  const spinner = new THREE.Group();
  spinner.position.set(0, 2.16, 0.38);
  const bladeMaterial = mat(theme.glow);
  for (let index = 0; index < 4; index += 1) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.92, 0.07), bladeMaterial);
    blade.position.y = 0.42;
    blade.rotation.z = index * Math.PI / 2;
    blade.castShadow = true;
    spinner.add(blade);
  }
  group.add(spinner);
  scene.add(group);
  return { group, spinner };
}

function addBoneArch(scene, x, z, theme, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  const bone = mat(theme.stone);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.25, 7), bone);
    post.position.set(side * 0.92, 1.08, 0);
    post.rotation.z = side * 0.2;
    post.castShadow = true;
    group.add(post);
  }
  for (let index = 0; index < 5; index += 1) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.22), bone);
    rib.position.set(-0.68 + index * 0.34, 2.12 + Math.sin(index / 4 * Math.PI) * 0.38, 0);
    rib.rotation.z = -0.5 + index * 0.25;
    rib.castShadow = true;
    group.add(rib);
  }
  scene.add(group);
  return group;
}

function addTarPool(scene, x, z, theme, scale = 1) {
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(1.2 * scale, 18),
    mat(theme.water, { transparent: true, opacity: 0.82 })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x, 0.13, z);
  scene.add(pool);
  return pool;
}

function addCrystalCluster(scene, x, z, theme, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const crystalMaterial = glowMat(theme.glow, 0.72);
  for (let index = 0; index < 5; index += 1) {
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.18 * scale, (0.9 + index * 0.12) * scale, 5), crystalMaterial);
    crystal.position.set((index - 2) * 0.28 * scale, 0.45 * scale, Math.sin(index) * 0.18 * scale);
    crystal.rotation.z = (index - 2) * 0.12;
    crystal.castShadow = true;
    group.add(crystal);
  }
  scene.add(group);
  return group;
}

function addLanternTree(scene, x, z, theme, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.4, 7), mat(theme.trunk));
  trunk.position.y = 1.2;
  trunk.castShadow = true;
  group.add(trunk);
  const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.92, 0), mat(theme.canopy[1]));
  crown.position.y = 2.55;
  crown.scale.set(1.05, 0.85, 1.05);
  crown.castShadow = true;
  group.add(crown);
  const glows = [];
  for (let index = 0; index < 6; index += 1) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glowMat(theme.glow, 0.5));
    bulb.position.set(Math.sin(index * 1.7) * 0.72, 2.25 + (index % 3) * 0.22, Math.cos(index * 1.7) * 0.72);
    group.add(bulb);
    glows.push(bulb.material);
  }
  scene.add(group);
  return { group, glows };
}

function addObservatory(scene, x, z, theme, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.86, 1.45, 10), mat(theme.structure));
  base.position.y = 0.72;
  base.castShadow = true;
  group.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.78, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(theme.stone));
  dome.position.y = 1.45;
  dome.castShadow = true;
  group.add(dome);
  const telescope = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.2, 8), mat(theme.glow));
  telescope.position.set(0.58, 1.92, 0);
  telescope.rotation.z = Math.PI / 2.8;
  telescope.castShadow = true;
  group.add(telescope);
  scene.add(group);
  return { group, spinner: telescope };
}

function addFungi(scene, section, z, side, theme) {
  const point = pathSidePoint(section, z, side, 0.92);
  const group = new THREE.Group();
  group.position.set(point.x, point.y, point.z);
  const stemMaterial = mat(theme.path);
  const capMaterial = glowMat(theme.glow, 0.66);
  for (let index = 0; index < 4; index += 1) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.36 + index * 0.04, 7), stemMaterial);
    stem.position.set((index - 1.5) * 0.28, 0.18, Math.sin(index) * 0.15);
    group.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18 + index * 0.02, 10, 6), capMaterial);
    cap.scale.y = 0.48;
    cap.position.set(stem.position.x, 0.4 + index * 0.04, stem.position.z);
    group.add(cap);
  }
  scene.add(group);
  return group;
}

function buildGate(scene, section, theme) {
  const group = new THREE.Group();
  group.position.set(section.gate.x, section.gate.y || 0, section.gate.z);
  group.rotation.y = section.gate.heading || 0;
  const wood = mat(theme.gate, { roughness: 0.84 });
  const cap = mat(theme.pathEdge, { roughness: 0.64 });
  const vine = mat(theme.canopy[1], { roughness: 0.72 });
  const lantern = glowMat(theme.glow, 0.78);

  for (const x of [-3.25, 3.25]) {
    const post = new THREE.Mesh(new RoundedBoxGeometry(0.62, 3.85, 0.72, 4, 0.16), wood);
    post.position.set(x, 1.75, 0);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.26, 10), cap);
    collar.position.set(x, 3.67, 0);
    collar.castShadow = true;
    group.add(collar);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 10), cap);
    top.scale.y = 1.35;
    top.position.set(x, 4.06, 0);
    top.castShadow = true;
    group.add(top);
    for (let leafIndex = 0; leafIndex < 5; leafIndex += 1) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 7), vine);
      leaf.scale.set(1.35, 0.58, 0.5);
      leaf.rotation.z = (leafIndex % 2 ? -1 : 1) * 0.55;
      leaf.position.set(x + (leafIndex % 2 ? -0.28 : 0.28), 0.72 + leafIndex * 0.58, 0.4);
      leaf.castShadow = true;
      group.add(leaf);
    }
  }

  const lintel = new THREE.Mesh(new RoundedBoxGeometry(7.12, 0.68, 0.78, 5, 0.18), wood);
  lintel.position.set(0, 3.34, 0);
  lintel.castShadow = true;
  lintel.receiveShadow = true;
  group.add(lintel);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.16, 10, 44, Math.PI), vine);
  arch.position.set(0, 2.55, 0.42);
  arch.castShadow = true;
  group.add(arch);

  for (const x of [-2.35, 2.35]) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), lantern.clone());
    light.position.set(x, 3.24, 0.52);
    group.add(light);
  }

  const left = new THREE.Group();
  left.position.set(-3.1, 0, 0);
  const leftDoor = new THREE.Mesh(new RoundedBoxGeometry(3.05, 2.58, 0.34, 4, 0.12), wood);
  leftDoor.position.set(1.5, 1.3, 0);
  leftDoor.castShadow = true;
  leftDoor.receiveShadow = true;
  left.add(leftDoor);

  const right = new THREE.Group();
  right.position.set(3.1, 0, 0);
  const rightDoor = new THREE.Mesh(new RoundedBoxGeometry(3.05, 2.58, 0.34, 4, 0.12), wood);
  rightDoor.position.set(-1.5, 1.3, 0);
  rightDoor.castShadow = true;
  rightDoor.receiveShadow = true;
  right.add(rightDoor);

  for (const door of [left, right]) {
    const direction = door === left ? 1 : -1;
    for (let slatIndex = 0; slatIndex < 3; slatIndex += 1) {
      const slat = new THREE.Mesh(new RoundedBoxGeometry(0.08, 2.18, 0.07, 2, 0.025), cap);
      slat.position.set(direction * (0.75 + slatIndex * 0.72), 1.3, 0.21);
      door.add(slat);
    }
  }

  group.add(left, right);
  scene.add(group);
  return { left, right };
}

function buildSectionLandmark(scene, section, theme) {
  const { x, z, kind, progress, side } = section.landmark;
  switch (kind) {
    case "windmill":
      return addWindmill(scene, x, z, theme, 1.45);
    case "orchard":
      for (let index = 0; index < 5; index += 1) {
        addTree(scene, x + (index - 2) * 1.0, z + Math.sin(index) * 0.7, 0.95, theme, index + 2);
      }
      return null;
    case "farmstead":
      return addCottage(scene, section, progress, side, theme);
    case "lanternGrove":
      return addLanternTree(scene, x, z, theme, 1.05);
    case "boneArch":
      return addBoneArch(scene, x, z, theme, 1.75);
    case "excavationCamp":
      return addCottage(scene, section, progress, side, theme);
    case "tarPool":
      return addTarPool(scene, x, z, theme, 1.65);
    case "ropeBridge":
      return addBoneArch(scene, x, z, theme, 1.25);
    case "lanternTree":
      return addLanternTree(scene, x, z, theme, 1.55);
    case "crystalPool":
      addTarPool(scene, x, z, theme, 1.25);
      return addCrystalCluster(scene, x, z, theme, 1.45);
    case "observatory":
      return addObservatory(scene, x, z, theme, 1.45);
    case "starGate":
      return addCrystalCluster(scene, x, z, theme, 1.9);
    default:
      return null;
  }
}

function buildKitDetails(scene, section, theme, quality) {
  let index = 0;
  const density = section.variant?.density || 1;
  const step = Math.max(5.2, quality.decorationStep / density);
  const count = Math.max(12, Math.ceil(section.route.totalLength / step));
  const canopyShift = section.variant?.canopyShift || 0;
  for (let decoration = 0; decoration < count; decoration += 1) {
    const progress = 0.04 + (decoration / Math.max(1, count - 1)) * 0.91;
    if (progress > (section.isChapterFinale ? 0.64 : 0.84)) continue;
    const side = index % 2 === 0 ? -1 : 1;
    const point = pathSidePoint(section, progress, side, 1.1 + (index % 3) * 0.42);
    if (section.world === "meadow") {
      if (section.variant?.scatter === "ponds" && index % 4 === 0) addTarPool(scene, point.x, point.z, theme, 0.52);
      else if (section.variant?.scatter === "lanterns" && index % 4 === 0) addLanternTree(scene, point.x, point.z, theme, 0.54);
      else if (index % 5 === 0) addCottage(scene, section, progress, side, theme);
      else if (index % 3 === 0 || section.variant?.scatter === "fences") addFence(scene, section, progress, side, theme, 5);
      else {
        addTree(scene, point.x, point.z, 0.72 + (index % 4) * 0.08, theme, index + canopyShift);
        if (section.variant?.scatter === "fruit" && index % 2 === 0) {
          const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat(theme.flower));
          fruit.position.set(point.x + side * 0.22, 0.72, point.z + 0.12);
          scene.add(fruit);
        }
      }
    } else if (section.world === "dino") {
      if (section.variant?.scatter === "flags" && index % 4 === 0) {
        const flag = new THREE.Group();
        flag.position.set(point.x, 0, point.z);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 0.08), mat(theme.structure));
        post.position.y = 0.58;
        const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.04), mat(theme.glow));
        cloth.position.set(side * 0.26, 0.9, 0);
        flag.add(post, cloth);
        scene.add(flag);
      } else if (section.variant?.scatter === "tar" && index % 3 === 0) addTarPool(scene, point.x, point.z, theme, 0.72);
      else if (index % 5 === 0 || section.variant?.scatter === "bones") addBoneArch(scene, point.x, point.z, theme, 0.72);
      else if (index % 4 === 0) addTarPool(scene, point.x, point.z, theme, 0.7);
      else {
        const rock = new THREE.Mesh(
          section.variant?.scatter === "crates"
            ? new THREE.BoxGeometry(0.52, 0.38, 0.46)
            : new THREE.DodecahedronGeometry(0.34 + (index % 3) * 0.08, 0),
          mat(section.variant?.scatter === "crates" ? theme.structure : theme.stone)
        );
        rock.scale.set(1.2, 0.68, 0.82);
        rock.position.set(point.x, 0.22, point.z);
        rock.rotation.y = index * 0.63;
        rock.castShadow = true;
        scene.add(rock);
      }
    } else {
      if (section.variant?.scatter === "telescopes" && index % 5 === 0) addObservatory(scene, point.x, point.z, theme, 0.42);
      else if (section.variant?.scatter === "stars" && index % 4 === 0) addCrystalCluster(scene, point.x, point.z, theme, 0.54);
      else if (index % 5 === 0) addLanternTree(scene, point.x, point.z, theme, 0.72);
      else if (index % 3 === 0 || section.variant?.scatter === "crystals") addCrystalCluster(scene, point.x, point.z, theme, 0.7);
      else addFungi(scene, section, progress, side, theme);
    }
    index += 1;
  }
}

function buildRepair(scene, encounter, section, theme) {
  const { kind, x, y = 0, z } = encounter.repair;
  const output = { id: encounter.id, kind, state: 0, glows: [], spinner: null, group: null };
  if (kind === "windmill") {
    Object.assign(output, addWindmill(scene, x, z, theme, 0.72));
  } else if (kind === "flowerBloom") {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const flowerMaterial = glowMat(theme.flower, 0.5);
    for (let index = 0; index < 7; index += 1) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.48, 6), mat(theme.canopy[index % theme.canopy.length]));
      stem.position.set((index - 3) * 0.18, 0.24, Math.sin(index) * 0.18);
      group.add(stem);
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.1, 9, 7), flowerMaterial);
      flower.position.set(stem.position.x, 0.5, stem.position.z);
      group.add(flower);
      output.glows.push(flower.material);
    }
    scene.add(group);
    output.group = group;
  } else if (kind === "crystalGlow") {
    output.group = addCrystalCluster(scene, x, z, theme, 0.9);
    output.group.traverse(child => { if (child.material?.emissive) output.glows.push(child.material); });
  } else if (kind === "observatorySpin") {
    Object.assign(output, addObservatory(scene, x, z, theme, 0.72));
  } else if (kind === "lanternBloom" || kind === "starWake") {
    Object.assign(output, addLanternTree(scene, x, z, theme, 0.7));
  } else if (kind === "fossilLamp" || kind === "bridgeLamp" || kind === "bridgeTorch") {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.95, 7), mat(theme.structure));
    post.position.y = 0.48;
    post.castShadow = true;
    group.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), glowMat(theme.glow, 0.42));
    lamp.position.y = 1.04;
    group.add(lamp);
    output.glows.push(lamp.material);
    scene.add(group);
    output.group = group;
  } else if (kind === "steamVent") {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.28, 8), mat(theme.stone));
    vent.position.y = 0.14;
    vent.castShadow = true;
    group.add(vent);
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), glowMat(theme.dust, 0.18));
    puff.position.y = 0.72;
    group.add(puff);
    output.glows.push(puff.material);
    scene.add(group);
    output.group = group;
  } else if (kind === "campFlag" || kind === "sheepReturn") {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.08, 0.08), mat(theme.structure));
    post.position.y = 0.54;
    group.add(post);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 0.04), mat(theme.glow));
    flag.position.set(0.34, 0.88, 0);
    group.add(flag);
    output.spinner = flag;
    scene.add(group);
    output.group = group;
  }
  if (!output.group && output.spinner?.parent) output.group = output.spinner.parent;
  if (output.group) {
    output.group.position.y = y;
    output.group.userData.baseScale = output.group.scale.clone();
  }
  return output.group ? output : null;
}

function buildRepairMoments(scene, section, theme) {
  const current = section.encounters.map(encounter => buildRepair(scene, encounter, section, theme)).filter(Boolean);
  const restored = (section.restoredMoments || []).map(moment => {
    const repair = buildRepair(scene, { id: moment.id, repair: moment }, section, theme);
    if (repair) repair.restored = true;
    return repair;
  }).filter(Boolean);
  return [...current, ...restored];
}

function addFinalePart(group, geometry, material, {
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  motion = null,
  phase = 0
} = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (motion) {
    mesh.userData.finaleMotion = motion;
    mesh.userData.phase = phase;
    mesh.userData.baseY = y;
    mesh.userData.baseScale = mesh.scale.clone();
  }
  group.add(mesh);
  return mesh;
}

function buildChapterFinale(scene, section, theme) {
  if (!section.finale) return null;
  const group = new THREE.Group();
  const point = routePointAt(section.route, 0.865);
  group.name = `chapter-finale-${section.finale.cue}`;
  group.position.set(point.x, point.y, point.z);
  group.rotation.y = routeDirectionAt(section.route, 0.865).heading;
  group.userData.finaleCue = section.finale.cue;

  const structure = mat(theme.structure, { roughness: 0.68, metalness: 0.08 });
  const stone = mat(theme.stone, { roughness: 0.82 });
  const glass = mat(theme.water, { roughness: 0.16, metalness: 0.42, transparent: true, opacity: 0.72 });
  const glow = glowMat(theme.glow, 0.66);
  const accent = mat(theme.flower, { roughness: 0.48, metalness: 0.06 });
  const cue = section.finale.cue;

  if (cue === "bramble-gate") {
    for (const side of [-1, 1]) {
      addFinalePart(group, new THREE.CylinderGeometry(0.2, 0.34, 4.5, 10), structure, { x: side * 2.75, y: 2.2, motion: "sway", phase: side });
      for (let flower = 0; flower < 3; flower += 1) {
        addFinalePart(group, new THREE.SphereGeometry(0.23, 14, 10), glow, { x: side * (2.45 - flower * 0.28), y: 1.1 + flower * 1.22, z: 0.12, motion: "pulse", phase: flower + side });
      }
    }
    addFinalePart(group, new THREE.TorusGeometry(2.72, 0.24, 12, 40, Math.PI), structure, { y: 2.25, rz: Math.PI, motion: "sway" });
  } else if (cue === "singing-weir") {
    for (let wheel = -1; wheel <= 1; wheel += 1) {
      const hub = new THREE.Group();
      hub.position.set(wheel * 2.1, 1.65, 0);
      hub.userData.finaleMotion = "spin";
      hub.userData.phase = wheel;
      addFinalePart(hub, new THREE.TorusGeometry(0.92, 0.12, 10, 28), structure);
      for (let spoke = 0; spoke < 8; spoke += 1) {
        addFinalePart(hub, new THREE.BoxGeometry(0.1, 1.58, 0.12), accent, { rz: spoke * Math.PI / 4 });
      }
      addFinalePart(hub, new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12), glow, { rx: Math.PI / 2 });
      group.add(hub);
    }
    addFinalePart(group, new THREE.BoxGeometry(7.2, 0.44, 1.2), stone, { y: 0.22, z: 0.25 });
  } else if (cue === "claw-pass") {
    for (let rib = -2; rib <= 2; rib += 1) {
      addFinalePart(group, new THREE.TorusGeometry(2.4 - Math.abs(rib) * 0.12, 0.16, 10, 28, Math.PI), stone, { x: rib * 0.62, y: 0.18, z: rib * 0.35, rz: Math.PI, motion: "sway", phase: rib });
    }
    addFinalePart(group, new THREE.ConeGeometry(0.45, 1.65, 6), accent, { y: 3.55, motion: "pulse" });
    addFinalePart(group, new THREE.SphereGeometry(0.3, 14, 10), glow, { y: 4.5, motion: "pulse", phase: 1.2 });
  } else if (cue === "word-forge") {
    for (let ring = 0; ring < 3; ring += 1) {
      addFinalePart(group, new THREE.TorusGeometry(1.05 + ring * 0.62, 0.16, 12, 36), ring === 1 ? glow : structure, { y: 2.2, z: ring * -0.12, motion: ring % 2 ? "reverse-spin" : "spin", phase: ring });
    }
    addFinalePart(group, new THREE.CylinderGeometry(1.15, 1.45, 1.2, 12), stone, { y: 0.6 });
    addFinalePart(group, new THREE.ConeGeometry(0.58, 2.1, 10), glow, { y: 1.62, motion: "flame" });
  } else if (cue === "mirror-fen") {
    for (let reed = -3; reed <= 3; reed += 1) {
      addFinalePart(group, new THREE.BoxGeometry(0.34, 2.4 + (reed % 2) * 0.35, 0.12), reed % 2 ? glass : glow, { x: reed * 0.78, y: 1.25, z: Math.abs(reed) * 0.16, ry: reed * 0.12, motion: "sway", phase: reed * 0.4 });
    }
    addFinalePart(group, new THREE.TorusGeometry(2.35, 0.12, 10, 40), glass, { y: 2.3, motion: "spin" });
  } else if (cue === "thunder-lighthouse") {
    addFinalePart(group, new THREE.CylinderGeometry(0.78, 1.18, 4.5, 14), stone, { y: 2.25 });
    addFinalePart(group, new THREE.CylinderGeometry(1.05, 0.82, 0.75, 14), glass, { y: 4.55 });
    const beacon = new THREE.Group();
    beacon.position.y = 4.6;
    beacon.userData.finaleMotion = "beam";
    addFinalePart(beacon, new THREE.ConeGeometry(1.05, 7.8, 18, 1, true), glow, { y: 3.8, rz: -Math.PI / 2 });
    group.add(beacon);
    addFinalePart(group, new THREE.SphereGeometry(0.34, 16, 12), glow, { y: 4.58, motion: "pulse" });
  } else if (cue === "sleeping-observatory") {
    addFinalePart(group, new THREE.CylinderGeometry(1.7, 2.05, 1.55, 16), stone, { y: 0.78 });
    addFinalePart(group, new THREE.SphereGeometry(1.75, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass, { y: 1.55, motion: "spin" });
    const telescope = addFinalePart(group, new THREE.CylinderGeometry(0.18, 0.28, 3.4, 12), accent, { x: 0.7, y: 3.05, rz: -Math.PI / 3.2, motion: "telescope" });
    telescope.userData.baseRotationZ = telescope.rotation.z;
    for (let orbit = 0; orbit < 2; orbit += 1) {
      addFinalePart(group, new THREE.TorusGeometry(2.35 + orbit * 0.48, 0.08, 8, 42), glow, { y: 2.4, rx: Math.PI / 2.8 + orbit * 0.35, motion: orbit ? "reverse-spin" : "spin" });
    }
  } else {
    for (let ray = 0; ray < 10; ray += 1) {
      addFinalePart(group, new THREE.ConeGeometry(0.22, 2.8, 5), glow, { y: 3.2, rz: ray * Math.PI / 5, motion: "pulse", phase: ray * 0.42 });
    }
    addFinalePart(group, new THREE.IcosahedronGeometry(1.18, 2), glow, { y: 3.2, motion: "star" });
    for (let orbit = 0; orbit < 3; orbit += 1) {
      addFinalePart(group, new THREE.TorusGeometry(2.25 + orbit * 0.62, 0.07, 8, 48), orbit === 1 ? glass : accent, { y: 3.2, rx: 0.75 + orbit * 0.38, ry: orbit * 0.55, motion: orbit % 2 ? "reverse-spin" : "spin", phase: orbit });
    }
  }

  scene.add(group);
  return group;
}

function buildActEvent(scene, section, theme) {
  if (section.event?.mode === "section") return null;
  if (section.event?.mode === "chapter-finale") return buildChapterFinale(scene, section, theme);
  const group = new THREE.Group();
  group.name = `act-event-${section.event.id}`;
  const glow = glowMat(theme.glow, 0.56);
  const cloth = mat(theme.flower);
  const wood = mat(theme.structure);
  const entryProgress = 0.045;

  for (const side of [-1, 1]) {
    const point = pathSidePoint(section, entryProgress, side, 0.55);
    if (section.event.cue === "festival") {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.8, 7), wood);
      pole.position.set(point.x, point.y + 0.9, point.z);
      const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.48, 3), cloth);
      pennant.position.set(point.x + side * 0.24, point.y + 1.65, point.z);
      pennant.rotation.z = side * Math.PI / 2;
      group.add(pole, pennant);
    } else if (section.event.cue === "forge") {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), glow);
      lamp.position.set(point.x, point.y + 1.1, point.z);
      lamp.userData.phase = side > 0 ? 0.9 : 0.2;
      group.add(lamp);
    } else {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), glow);
      crystal.position.set(point.x, point.y + 1.02, point.z);
      crystal.userData.phase = side > 0 ? 1.4 : 0.4;
      group.add(crystal);
    }
  }

  if (section.event.cue === "festival") {
    for (let row = 0; row < 3; row += 1) {
      const progress = 0.68 + row * 0.065;
      const point = routePointAt(section.route, progress);
      const arch = new THREE.Group();
      arch.position.set(point.x, point.y, point.z);
      arch.rotation.y = routeDirectionAt(section.route, progress).heading;
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.5, 7), wood);
        post.position.set(side * 2.9, 1.2, 0);
        arch.add(post);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.07, 0.08), wood);
      rail.position.y = 2.25;
      arch.add(rail);
      for (let flag = 0; flag < 5; flag += 1) {
        const banner = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.34, 3), cloth);
        banner.position.set(-2.1 + flag * 1.05, 2.02, 0);
        banner.rotation.z = Math.PI;
        arch.add(banner);
      }
      group.add(arch);
    }
  } else if (section.event.cue === "forge") {
    for (let index = 0; index < 9; index += 1) {
      const progress = 0.7 + index * 0.02;
      const side = index % 2 === 0 ? -1 : 1;
      const point = pathSidePoint(section, progress, side, 1.15);
      const piston = new THREE.Group();
      piston.position.set(point.x, point.y, point.z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.24, 8), mat(theme.stone));
      base.position.y = 0.12;
      piston.add(base);
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), wood);
      rod.position.y = 0.7;
      piston.add(rod);
      const spark = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), glow);
      spark.position.y = 1.34;
      piston.add(spark);
      piston.userData.spark = spark;
      piston.userData.phase = index * 0.7;
      group.add(piston);
    }
  } else {
    for (let index = 0; index < 14; index += 1) {
      const progress = 0.65 + index * 0.018;
      const side = index % 2 === 0 ? -1 : 1;
      const point = pathSidePoint(section, progress, side, 0.9 + (index % 4) * 0.2);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.18 + (index % 3) * 0.04, 0), glow);
      star.position.set(point.x, point.y + 1.25 + (index % 5) * 0.18, point.z);
      star.userData.phase = index * 0.51;
      group.add(star);
    }
  }

  scene.add(group);
  return group;
}

function updateActEvent(group, now, completion = 0) {
  if (!group) return;
  const time = now * 0.001;
  const isFinale = Boolean(group.userData.finaleCue);
  let childIndex = 0;
  group.traverse(child => {
    const index = childIndex;
    childIndex += 1;
    const motion = child.userData.finaleMotion;
    if (motion === "spin" || motion === "reverse-spin") {
      child.rotation.z += (motion === "reverse-spin" ? -1 : 1) * (0.003 + completion * 0.025);
    } else if (motion === "beam") {
      child.rotation.y = time * (0.18 + completion * 0.72);
    } else if (motion === "sway") {
      child.rotation.z = Math.sin(time * 1.1 + (child.userData.phase || 0)) * (0.025 + completion * 0.055);
    } else if (motion === "pulse" || motion === "flame" || motion === "star") {
      const pulse = 1 + Math.sin(time * (motion === "flame" ? 7 : 2.5) + (child.userData.phase || 0)) * (0.035 + completion * 0.055);
      child.scale.copy(child.userData.baseScale || new THREE.Vector3(1, 1, 1)).multiplyScalar(pulse);
    } else if (motion === "telescope") {
      child.rotation.z = (child.userData.baseRotationZ || 0) + Math.sin(time * 0.5) * 0.18 * completion;
    }
    if (motion && child.material?.emissive) child.material.emissiveIntensity = 0.55 + completion * 1.25;

    if (child === group || isFinale) return;
    child.rotation.y = Math.sin(time * 0.45 + index) * 0.04;
    if (child.userData.spark) {
      child.userData.spark.position.y = 1.22 + Math.sin(time * 3.6 + child.userData.phase) * 0.22;
    }
    if (child.geometry?.type === "OctahedronGeometry") {
      child.rotation.y += 0.03;
      child.position.y += Math.sin(time * 2.4 + child.userData.phase) * 0.002;
    }
  });
}

function buildAmbientLife(scene, section, theme, quality) {
  const materialByKind = kind => {
    if (kind.includes("firefly") || kind.includes("star")) return glowMat(theme.glow, 0.68);
    if (kind.includes("dust") || kind.includes("pollen") || kind.includes("heat")) return glowMat(theme.dust, 0.28);
    return mat(theme.flower);
  };
  return section.ambience.slice(0, Math.ceil(section.ambience.length * quality.ambientScale)).map(spec => {
    const group = new THREE.Group();
    group.position.set(spec.x, spec.y, spec.z);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.055 * spec.scale, 8, 6), materialByKind(spec.kind));
    group.add(body);
    let wings = null;
    if (spec.kind.includes("butterfly") || spec.kind.includes("moth") || spec.kind.includes("bird")) {
      wings = new THREE.Group();
      const wingMaterial = glowMat(theme.flower, 0.5);
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.16 * spec.scale, 0.02, 0.09 * spec.scale), wingMaterial);
        wing.position.x = side * 0.09 * spec.scale;
        wing.rotation.z = side * 0.42;
        wings.add(wing);
      }
      group.add(wings);
    }
    scene.add(group);
    return {
      group,
      wings,
      kind: spec.kind,
      base: new THREE.Vector3(spec.x, spec.y, spec.z),
      phase: spec.phase,
      scale: spec.scale
    };
  });
}

function updateRepairMoment(repair, solved, dt, now, aura = false) {
  repair.state = THREE.MathUtils.lerp(repair.state, solved ? 1 : aura ? 0.22 : 0, 1 - Math.pow(0.025, dt));
  if (repair.spinner) {
    repair.spinner.rotation.z += dt * (0.55 + repair.state * 3.2);
    repair.spinner.rotation.y = Math.sin(now * 0.0018) * 0.12 * repair.state;
  }
  for (const material of repair.glows) {
    material.opacity = 0.16 + repair.state * 0.58;
    material.emissiveIntensity = 0.22 + repair.state * 1.25;
  }
  if (repair.group?.userData.baseScale) {
    const bounce = solved ? 1 + Math.sin(now * 0.005) * 0.015 * repair.state : aura ? 0.96 : 0.92;
    repair.group.scale.copy(repair.group.userData.baseScale).multiplyScalar(0.9 + repair.state * 0.1);
    repair.group.scale.y *= bounce;
  }
}

function updateAmbientLife(item, now) {
  const time = now * 0.001;
  const drift = item.kind.includes("bird") ? 1.15 : 0.36;
  item.group.position.x = item.base.x + Math.sin(time * drift + item.phase) * (item.kind.includes("bird") ? 1.2 : 0.28);
  item.group.position.y = item.base.y + Math.sin(time * 1.7 + item.phase) * (item.kind.includes("dust") || item.kind.includes("pollen") ? 0.18 : 0.34);
  item.group.position.z = item.base.z + Math.cos(time * 0.72 + item.phase) * 0.22;
  item.group.rotation.y = Math.sin(time + item.phase) * 0.6;
  if (item.wings) item.wings.rotation.z = Math.sin(time * 9 + item.phase) * 0.42;
}

function taskColour(spec, theme) {
  if (spec.colour && SIGN_OBJECT_COLOURS[spec.colour]) return SIGN_OBJECT_COLOURS[spec.colour];
  const cycle = [theme.flower, theme.glow, theme.water, theme.path, theme.structure];
  return cycle[spec.order % cycle.length] || theme.flower;
}

function addFieldLabel(group, label, y = 1.22, width = 0.98) {
  if (!label) return;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 249, 219, 0.96)";
  ctx.beginPath();
  ctx.roundRect(20, 18, 472, 156, 26);
  ctx.fill();
  ctx.strokeStyle = "rgba(42, 38, 26, 0.34)";
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.fillStyle = "rgb(47, 43, 30)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const words = String(label).trim().split(/\s+/).filter(Boolean);
  let fontSize = 54;
  let lines = [];
  while (fontSize >= 25) {
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    lines = [];
    for (const word of words) {
      const candidate = lines.length ? `${lines.at(-1)} ${word}` : word;
      if (lines.length && ctx.measureText(candidate).width > 430) lines.push(word);
      else if (lines.length) lines[lines.length - 1] = candidate;
      else lines.push(word);
    }
    if (lines.length <= 3 && lines.every(line => ctx.measureText(line).width <= 430)) break;
    fontSize -= 3;
  }
  const lineHeight = fontSize * 1.02;
  const firstY = 96 - ((lines.length - 1) * lineHeight) / 2;
  lines.slice(0, 3).forEach((line, index) => ctx.fillText(line, 256, firstY + index * lineHeight, 430));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData.questOwned = true;
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: texture,
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 0.42,
    transparent: true,
    depthWrite: false,
    roughness: 0.3
  });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.375), material);
  tag.name = "field-label";
  tag.position.y = y;
  tag.position.z = 0.08;
  group.add(tag);
  group.userData.billboards = [...(group.userData.billboards || []), tag];
}

function buildFieldAvatar(spec, theme, { interactive = true } = {}) {
  const group = new THREE.Group();
  group.name = `field-object-${spec.id}`;
  group.position.set(spec.x, spec.y || 0, spec.z);
  group.userData.fieldSpec = spec;
  if (interactive) group.userData.fieldChoice = spec;
  group.userData.baseY = spec.y || 0;
  group.userData.baseX = spec.x;
  group.userData.baseZ = spec.z;
  group.userData.phase = spec.order * 0.75;
  group.userData.motionParts = [];
  const sizeScale = spec.size === "big" ? 1.32 : spec.size === "small" ? 0.76 : 1;
  group.scale.setScalar(sizeScale);

  const color = taskColour(spec, theme);
  const primary = clayMat(color, { roughness: 0.54, clearcoat: 0.28 });
  const secondary = clayMat(theme.path, { roughness: 0.66, clearcoat: 0.16 });
  const dark = clayMat(theme.trunk, { roughness: 0.72, clearcoat: 0.08 });
  if (spec.shape === "flower") {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.72, 7), mat(theme.canopy[(spec.order + 1) % theme.canopy.length]));
    stem.position.y = 0.36;
    group.add(stem);
    for (let index = 0; index < 6; index += 1) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), primary);
      const angle = (index / 6) * Math.PI * 2;
      petal.scale.set(1.1, 0.56, 0.22);
      petal.position.set(Math.cos(angle) * 0.18, 0.82 + Math.sin(angle) * 0.05, Math.sin(angle) * 0.18);
      petal.rotation.z = angle;
      group.add(petal);
      group.userData.motionParts.push({ object: petal, type: "petal", phase: angle, baseY: petal.position.y });
    }
    const centre = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mat(theme.path));
    centre.position.y = 0.82;
    group.add(centre);
    addFieldLabel(group, spec.label, 1.22);
  } else if (spec.shape === "fruit") {
    for (let index = 0; index < 3; index += 1) {
      const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), primary);
      const angle = index / 3 * Math.PI * 2;
      lobe.position.set(Math.cos(angle) * 0.12, 0.49 + (index === 0 ? 0.03 : 0), Math.sin(angle) * 0.08);
      lobe.scale.set(0.92, 1.24, 0.88);
      group.add(lobe);
    }
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.3, 10), dark);
    stem.position.set(0.02, 0.9, 0);
    stem.rotation.z = -0.12;
    group.add(stem);
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 18, 10),
      clayMat(theme.canopy[(spec.order + 2) % theme.canopy.length], { roughness: 0.72 })
    );
    leaf.scale.set(1.45, 0.26, 0.66);
    leaf.position.set(0.17, 0.94, 0.01);
    leaf.rotation.z = -0.42;
    group.add(leaf);
    group.userData.motionParts.push({ object: leaf, type: "leaf", baseRotation: leaf.rotation.z });
    addFieldLabel(group, spec.label, 1.18);
  } else if (spec.shape === "cake") {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.58, 0.08, 28), secondary);
    plate.position.y = 0.08;
    group.add(plate);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.46, 0.4, 28), primary);
    base.position.y = 0.31;
    group.add(base);
    const icing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.14, 28),
      clayMat(theme.glow, { roughness: 0.4, clearcoat: 0.36 })
    );
    icing.position.y = 0.58;
    group.add(icing);
    for (let index = 0; index < 7; index += 1) {
      const angle = index / 7 * Math.PI * 2;
      const drip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), icing.material);
      drip.scale.y = 1.6 + (index % 2) * 0.35;
      drip.position.set(Math.cos(angle) * 0.4, 0.51 - (index % 2) * 0.03, Math.sin(angle) * 0.4);
      group.add(drip);
    }
    for (let index = 0; index < 9; index += 1) {
      const sprinkle = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.012, 0.065, 4, 6),
        clayMat([theme.flower, theme.water, theme.structure][index % 3], { roughness: 0.5 })
      );
      const angle = index * 2.4;
      sprinkle.position.set(Math.cos(angle) * (0.12 + (index % 3) * 0.1), 0.67, Math.sin(angle) * (0.12 + (index % 3) * 0.1));
      sprinkle.rotation.set(Math.PI / 2, angle, angle * 0.35);
      group.add(sprinkle);
    }
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.34, 12), dark);
    candle.position.y = 0.86;
    group.add(candle);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), glowMat(theme.glow, 0.82));
    flame.scale.set(0.7, 1.45, 0.7);
    flame.position.y = 1.07;
    group.add(flame);
    group.userData.motionParts.push({ object: flame, type: "flame" });
    addFieldLabel(group, spec.label, 1.34, 1.26);
  } else if (spec.shape === "bridge-slot") {
    const dock = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.12, 0.72),
      new THREE.MeshPhysicalMaterial({
        color: theme.water,
        emissive: theme.glow,
        emissiveIntensity: 0.72,
        transparent: true,
        opacity: 0.68,
        roughness: 0.28,
        transmission: 0.08,
        thickness: 0.18
      })
    );
    dock.position.y = 0.11;
    dock.rotation.y = Math.PI / 2;
    group.add(dock);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.045, 10, 36), glowMat(theme.glow, 1.15));
    rim.position.y = 0.2;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);
    group.userData.motionParts.push({ object: rim, type: "orbit" });
  } else if (["bridge-plank", "river-plank", "placed-plank"].includes(spec.shape)) {
    const placed = spec.shape === "placed-plank";
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.16, 0.48),
      placed ? clayMat(theme.structure, { roughness: 0.62, clearcoat: 0.18 }) : primary
    );
    plank.position.y = placed ? 0.18 : 0.34;
    plank.rotation.y = placed ? Math.PI / 2 : -0.08;
    group.add(plank);
    for (const side of [-1, 1]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.02, 8), dark);
      rope.position.set(0, plank.position.y + 0.1, side * 0.18);
      rope.rotation.z = Math.PI / 2;
      rope.rotation.y = placed ? Math.PI / 2 : 0;
      group.add(rope);
    }
    group.userData.motionParts.push({ object: plank, type: placed ? "settle" : "plank", baseY: plank.position.y });
    addFieldLabel(group, spec.label, placed ? 0.88 : 1.08);
  } else if (spec.shape === "echo-orb" || spec.shape === "echo-rune") {
    const rune = spec.shape === "echo-rune";
    const orb = new THREE.Mesh(
      rune ? new THREE.OctahedronGeometry(0.3, 1) : new THREE.IcosahedronGeometry(0.34, 2),
      glowMat(rune ? theme.glow : color, rune ? 1.18 : 0.82)
    );
    orb.position.y = rune ? 0.56 : 0.7;
    group.add(orb);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(rune ? 0.42 : 0.48, 0.025, 8, 32),
      glowMat(theme.water, 0.72)
    );
    halo.position.y = orb.position.y;
    halo.rotation.x = Math.PI / 2.7;
    group.add(halo);
    group.userData.motionParts.push({ object: halo, type: "orbit" });
    addFieldLabel(group, spec.label, 1.24);
  } else if (spec.shape === "sound-pen") {
    const arch = new THREE.Group();
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.12, 12), primary);
      post.position.set(side * 0.48, 0.56, 0);
      arch.add(post);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.18, 0.22), primary);
    lintel.position.y = 1.08;
    arch.add(lintel);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.08), secondary);
      rail.position.set(side * 0.42, 0.42, 0.24);
      rail.rotation.y = side * 0.72;
      arch.add(rail);
    }
    group.add(arch);
    group.userData.motionParts.push({ object: arch, type: "pen", baseY: arch.position.y });
    addFieldLabel(group, spec.label, 1.54, 1.16);
  } else if (spec.shape === "sorted-token") {
    const wool = clayMat(theme.hemi, { roughness: 0.84, clearcoat: 0.08 });
    for (let index = 0; index < 5; index += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), wool);
      const angle = index / 5 * Math.PI * 2;
      puff.position.set(Math.cos(angle) * 0.18, 0.42 + (index % 2) * 0.08, Math.sin(angle) * 0.12);
      group.add(puff);
    }
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), dark);
    face.position.set(0.27, 0.45, 0.03);
    group.add(face);
    group.userData.motionParts.push({ object: face, type: "nod", baseRotation: 0 });
    addFieldLabel(group, spec.label, 1.02, 1.08);
  } else if (spec.shape === "story-path") {
    const portal = new THREE.Group();
    for (let index = 0; index < 7; index += 1) {
      const angle = Math.PI * (index / 6);
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1), index % 2 ? primary : secondary);
      stone.position.set(Math.cos(angle) * 0.72, 0.1 + Math.sin(angle) * 1.35, 0);
      stone.rotation.set(index * 0.2, index * 0.37, index * 0.14);
      portal.add(stone);
    }
    const shimmer = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 32),
      new THREE.MeshPhysicalMaterial({
        color: theme.glow,
        emissive: theme.glow,
        emissiveIntensity: 0.54,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: THREE.DoubleSide,
        roughness: 0.3,
        transmission: 0.08,
        thickness: 0.25
      })
    );
    shimmer.position.y = 0.9;
    shimmer.scale.y = 1.55;
    portal.add(shimmer);
    group.add(portal);
    group.userData.motionParts.push({ object: shimmer, type: "shimmer" });
    addFieldLabel(group, spec.label, 2.05, 1.82);
  } else if (spec.shape === "fish") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 30, 18), primary);
    body.scale.set(1.45, 0.68, 0.5);
    body.position.y = 0.46;
    group.add(body);
    const tailPivot = new THREE.Group();
    tailPivot.position.set(-0.52, 0.46, 0);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.42, 4), primary);
    tail.position.x = -0.18;
    tail.rotation.z = -Math.PI / 2;
    tail.rotation.y = Math.PI / 4;
    tailPivot.add(tail);
    group.add(tailPivot);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.34, 3), secondary);
    fin.position.set(-0.05, 0.77, 0);
    fin.rotation.z = -0.18;
    group.add(fin);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 12), clayMat(0xfffbef));
    eye.position.set(0.38, 0.55, 0.19);
    eye.scale.z = 0.5;
    group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 8), inkMat());
    pupil.position.set(0.4, 0.55, 0.24);
    pupil.scale.z = 0.42;
    group.add(pupil);
    group.userData.motionParts.push({ object: tailPivot, type: "tail" });
  } else if (spec.shape === "log") {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.92, 12), mat(theme.trunk));
    log.rotation.z = Math.PI / 2;
    log.position.y = 0.34;
    group.add(log);
  } else if (spec.shape === "bug") {
    for (let index = 0; index < 3; index += 1) {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), index === 1 ? primary : dark);
      body.position.set((index - 1) * 0.22, 0.38, 0);
      group.add(body);
    }
    for (const side of [-1, 1]) {
      for (let leg = 0; leg < 3; leg += 1) {
        const limb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.34), dark);
        limb.position.set((leg - 1) * 0.18, 0.29, side * 0.22);
        limb.rotation.y = side * 0.6;
        group.add(limb);
      }
    }
  } else if (spec.shape === "cup") {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.58, 14), primary);
    cup.position.y = 0.38;
    group.add(cup);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 12, Math.PI * 1.4), primary);
    handle.position.set(0.34, 0.42, 0);
    handle.rotation.y = Math.PI / 2;
    group.add(handle);
  } else if (spec.shape === "nut") {
    const nut = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), primary);
    nut.scale.set(0.9, 1.18, 0.9);
    nut.position.y = 0.42;
    group.add(nut);
  } else if (spec.shape === "fork-sign") {
    // Trail Run: an arrow board at the mouth of a fork. The child runs into
    // the one signed with the sound they heard.
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.05, 10), dark);
    post.position.y = 0.52;
    group.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.36, 0.08), primary);
    board.position.set(0.06, 0.94, 0);
    group.add(board);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.24, 4), primary);
    tip.rotation.z = -Math.PI / 2;
    tip.position.set(0.56, 0.94, 0);
    group.add(tip);
    group.userData.motionParts.push({ object: board, type: "leaf", baseRotation: board.rotation.z });
    addFieldLabel(group, spec.label, 1.36);
  } else {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), spec.shape === "rock" ? mat(theme.stone) : primary);
    rock.scale.set(1.18, 0.72, 0.92);
    rock.position.y = 0.34;
    group.add(rock);
  }

  const labelledShapes = new Set([
    "flower", "fruit", "cake", "bridge-plank", "river-plank", "placed-plank", "echo-orb", "echo-rune",
    "sound-pen", "sorted-token", "story-path", "fork-sign"
  ]);
  if (spec.label && !labelledShapes.has(spec.shape)) {
    addFieldLabel(group, spec.label, 1.05);
  }

  if (interactive) {
    const hitProxy = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.54, 0.82, 6, 12),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false
      })
    );
    hitProxy.name = "field-hit-proxy";
    hitProxy.position.y = 0.68;
    hitProxy.scale.set(1.12, 1.08, 1.12);
    group.add(hitProxy);
  }

  group.traverse(child => {
    child.castShadow = child.name !== "field-hit-proxy";
    if (interactive) child.userData.fieldChoice = spec;
  });
  // Sightline protection follows the printed grapheme rather than the
  // avatar's ground-level origin or its oversized collision proxy.
  group.userData.sightlineTarget = group.getObjectByName("field-label") || null;
  return group;
}

function buildFieldTasks(scene, section, theme) {
  const tasks = new Map();
  for (const encounter of section.encounters) {
    encounter.beats.forEach((beat, beatIndex) => {
      const task = buildPhysicalTask(section, encounter, beat, beatIndex);
      if (!task) return;
      const group = new THREE.Group();
      group.name = `field-task-${task.key}`;
      group.visible = false;
      const items = task.items.map(spec => {
        const avatar = buildFieldAvatar(spec, theme);
        group.add(avatar);
        return avatar;
      });
      const completions = task.completions.map(spec => {
        const avatar = buildFieldAvatar(spec, theme, { interactive: false });
        avatar.visible = false;
        group.add(avatar);
        return avatar;
      });
      scene.add(group);
      tasks.set(task.key, { ...task, group, items, completions, resolved: false });
    });
  }
  return tasks;
}

function attachImportedFieldAvatars(tasks, avatars) {
  for (const task of tasks.values()) {
    for (const item of [...task.items, ...task.completions]) {
      const spec = item.userData.fieldSpec;
      const imported = avatars.get(spec.id);
      if (!imported) continue;
      const billboards = new Set(item.userData.billboards || []);
      for (const child of item.children) {
        if (!billboards.has(child)) child.visible = false;
      }
      item.userData.motionParts = [];
      item.userData.importedFieldAvatar = imported;
      item.add(imported);
    }
  }
}

// ── SIGHTLINE: NOTHING STANDS BETWEEN A CHILD AND THE ANSWER ────────────────
//
// Playtest: "sometimes the letter is covered by a tree or a pot and we can't
// read it." A choice the child cannot see is a question they cannot answer,
// and they get marked wrong for the scenery.
//
// The scene already MEASURED this — updateSliceDebug raycasts camera->choice
// and reports rayClear — but nothing ever acted on it, so the harness went
// green while real play stayed blocked. Measuring a problem is not fixing it.
//
// This is the fix: while a task is on screen, anything intruding on the line
// from the camera to a choice fades out of the way, and fades back the moment
// it stops intruding. Fading rather than hiding, because a tree that pops out
// of existence reads as a bug; a tree that ghosts reads as the world getting
// out of your way.
//
// Materials are cloned on first fade (`questSightlineClone`) because scenery
// shares materials — fading the shared one would ghost every tree in the world
// at once.
const SIGHTLINE_FADE_OPACITY = 0.16;
const SIGHTLINE_FADE_PER_SECOND = 5.2;

function sectionGateIsOpen(encounters = [], solved = []) {
  return encounters.length === 0 || isChapterGateOpen(encounters, solved);
}

function fieldStageRecordsMastery(stage, soundEnabled) {
  const kind = stage?.audioCue?.kind || null;
  const value = stage?.audioCue?.value || null;
  const available = kind === "grapheme"
    ? hasGraphemeAudio(value)
    : kind === "word" && hasWordAudio(value);
  return physicalStageRecordsMastery(stage, Boolean(soundEnabled && available));
}

function sightlineMaterials(object) {
  const list = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
  if (!object.userData.questSightlineClone && list.length) {
    // Clone once, so this object can fade without taking its siblings with it.
    const cloned = list.map(material => {
      const copy = material.clone();
      copy.transparent = true;
      copy.depthWrite = false;
      return copy;
    });
    object.material = Array.isArray(object.material) ? cloned : cloned[0];
    object.userData.questSightlineClone = true;
    object.userData.questSightlineBaseOpacity = list[0]?.opacity ?? 1;
  }
  return Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
}

function fieldChoiceSightlineTarget(item, target) {
  const anchor = item?.userData?.sightlineTarget || item;
  return anchor.getWorldPosition(target);
}

// Choices, characters, the ground and the labels are never occluders — they
// are either the thing we are protecting or the surface it stands on.
function sightlineCanFade(object) {
  if (!object?.isMesh) return false;
  if (object.userData.fieldChoice || object.userData.questNeverFade) return false;
  if (object.name === "field-label" || object.name === "ground") return false;
  let node = object;
  while (node) {
    if (node.userData?.fieldChoice || node.userData?.questCharacter) return false;
    node = node.parent;
  }
  return true;
}

function sightlineIsVisible(object) {
  let node = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}

function createSightlineState() {
  return {
    raycaster: new THREE.Raycaster(),
    origin: new THREE.Vector3(),
    target: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    occluders: [],
    blocking: new Set(),
    frame: 0,
    liveKey: ""
  };
}

function refreshSightlineOccluders(scene, sightline) {
  const occluders = [];
  scene.traverse(object => {
    if (sightlineCanFade(object)) occluders.push(object);
  });
  sightline.occluders = occluders;
}

function updateSightline(camera, task, active, beatIndex, stageIndex, faded, dt, sightline) {
  const visible = task?.group?.visible && active;
  const liveKey = visible ? `${active.id}:${beatIndex}:${stageIndex}` : "";
  const refreshBlocking = visible && (liveKey !== sightline.liveKey || sightline.frame % 4 === 0);
  sightline.frame += 1;

  if (!visible) {
    sightline.blocking.clear();
  } else if (refreshBlocking) {
    sightline.blocking.clear();
    sightline.origin.copy(camera.position);
    for (const item of task.items) {
      if (!item.visible) continue;
      fieldChoiceSightlineTarget(item, sightline.target);
      sightline.direction.subVectors(sightline.target, sightline.origin);
      const distance = sightline.direction.length();
      if (distance < 0.001) continue;
      sightline.raycaster.set(sightline.origin, sightline.direction.normalize());
      sightline.raycaster.far = distance - 0.12; // stop just short of the choice itself
      for (const hit of sightline.raycaster.intersectObjects(sightline.occluders, false)) {
        if (sightlineIsVisible(hit.object)) sightline.blocking.add(hit.object);
      }
    }
  }
  sightline.liveKey = liveKey;
  const blocking = sightline.blocking;

  // Fade the blockers down, everything previously faded back up.
  for (const object of blocking) faded.add(object);
  for (const object of [...faded]) {
    const wants = blocking.has(object) ? SIGHTLINE_FADE_OPACITY : (object.userData.questSightlineBaseOpacity ?? 1);
    const materials = sightlineMaterials(object);
    let settled = true;
    for (const material of materials) {
      const next = THREE.MathUtils.damp(material.opacity, wants, SIGHTLINE_FADE_PER_SECOND, dt);
      material.opacity = next;
      if (Math.abs(next - wants) > 0.01) settled = false;
    }
    // Fully restored and no longer blocking: stop tracking it.
    if (settled && !blocking.has(object)) {
      for (const material of materials) {
        material.opacity = object.userData.questSightlineBaseOpacity ?? 1;
        material.depthWrite = true;
      }
      faded.delete(object);
    } else if (blocking.has(object)) {
      for (const material of materials) material.depthWrite = false;
    }
  }
}

function updateFieldTasks(tasks, active, beatIndex, stageIndex, correction, now, camera, dt, player, action, ambientNow = now) {
  const liveKey = active ? physicalTaskKey(active, beatIndex) : null;
  // Two clocks: `now` drives FUNCTIONAL feedback (action reveals compare
  // against real timestamps), `ambientNow` drives decoration and freezes
  // under reduced motion.
  const time = ambientNow * 0.001;
  const visibleChoices = correction?.visibleIds ? new Set(correction.visibleIds) : null;
  for (const [key, task] of tasks) {
    const live = key === liveKey && !task.resolved;
    task.group.visible = live;
    if (!live) continue;
    const liveStage = task.stages[stageIndex];
    const rhythmPulse = liveStage?.rhythm ? questRhythmPulse(now) : null;
    task.items.forEach((item, index) => {
      const choice = item.userData.fieldChoice;
      const currentStage = task.stages[stageIndex];
      const carried = Number.isInteger(currentStage?.carryFromStage)
        && choice?.stage === currentStage.carryFromStage
        && choice?.correct;
      item.visible = carried || (live
        && choice?.stage === stageIndex
        && (!visibleChoices || visibleChoices.has(choice.id)));
      if (!item.visible) return;
      updateImportedFieldAvatar(item.userData.importedFieldAvatar, dt);
      if (carried) {
        const screenRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
        item.position.x = player.x + screenRight.x * 0.62;
        item.position.z = player.z + screenRight.z * 0.62;
        item.position.y = (player.y || 0) + 1.02 + Math.sin(time * 6.2) * 0.035;
        item.rotation.y = camera.rotation.y + Math.PI;
        item.scale.setScalar(0.68);
      } else {
        item.position.x = item.userData.baseX;
        item.position.z = item.userData.baseZ;
        item.scale.setScalar(choice?.size === "big" ? 1.32 : choice?.size === "small" ? 0.76 : 1);
        if (rhythmPulse && choice?.stage === stageIndex) {
          item.scale.multiplyScalar(0.96 + rhythmPulse.intensity * 0.16);
        }
      }
      const teaching = correction?.mode === "teach" && correction.correctId === choice.id;
      if (!carried) {
        const actionProgress = action?.choiceId === choice.id
          ? THREE.MathUtils.clamp(1 - (action.until - now) / Math.max(1, action.duration), 0, 1)
          : 0;
        const liftByAction = {
          jump: 0.72,
          search: 0.38,
          build: 0.26,
          "lift-plank": 0.34,
          "place-plank": 0.28,
          conduct: 0.18,
          carry: 0.2
        };
        const rightLift = action?.correct && action?.choiceId === choice.id
          ? Math.sin(actionProgress * Math.PI) * (liftByAction[action.kind] || 0.34)
          : 0;
        item.position.y = (item.userData.baseY || 0)
          + Math.sin(time * (teaching ? 5.2 : 2.8) + item.userData.phase) * (teaching ? 0.12 : 0.06)
          + (teaching ? 0.18 : 0)
          + rightLift;
        item.rotation.y = Math.sin(time * (teaching ? 1.8 : 0.82) + item.userData.phase) * (teaching ? 0.42 : 0.24)
          + actionProgress * Math.PI * (action?.correct ? 1.6 : 0.08);
        if (action?.correct && action.taskKey === task.key && task.mechanic === "gate-chorus") {
          item.scale.multiplyScalar(1 + Math.sin(actionProgress * Math.PI) * 0.11);
        }
      }
      for (const material of item.userData.importedFieldAvatar?.userData.fieldMaterials || []) {
        if (!material.emissive) continue;
        material.emissiveIntensity = Math.max(
          rhythmPulse && choice?.stage === stageIndex ? 0.3 + rhythmPulse.intensity * 0.62 : choice.shape?.includes("lantern") ? 0.34 : 0,
          teaching ? 1.5 : action?.correct && action?.choiceId === choice.id ? 1.9 : 0
        );
      }
      for (const part of item.userData.motionParts || []) {
        if (part.type === "tail") part.object.rotation.y = Math.sin(time * 7.2 + item.userData.phase) * 0.42;
        else if (part.type === "leaf") part.object.rotation.z = part.baseRotation + Math.sin(time * 3.1 + item.userData.phase) * 0.12;
        else if (part.type === "petal") part.object.position.y = part.baseY + Math.sin(time * 2.4 + part.phase) * 0.025;
        else if (part.type === "flame") {
          const flicker = 0.9 + Math.sin(time * 11.5 + index) * 0.12;
          part.object.scale.set(0.7 * flicker, 1.45 / flicker, 0.7 * flicker);
          part.object.material.emissiveIntensity = 0.9 + flicker * 0.45;
        } else if (part.type === "plank") part.object.rotation.z = Math.sin(time * 2.2 + index) * 0.04;
        else if (part.type === "orbit") part.object.rotation.z += dt * 0.8;
        else if (part.type === "pen") part.object.position.y = part.baseY + Math.sin(time * 2 + index) * 0.025;
        else if (part.type === "shimmer") part.object.material.opacity = 0.18 + Math.sin(time * 3 + index) * 0.07;
      }
      for (const billboard of item.userData.billboards || []) {
        billboard.quaternion.copy(camera.quaternion);
      }
      item.userData.updateHudWorldPosition?.();
    });
    task.completions.forEach((item, index) => {
      const spec = item.userData.fieldSpec || {};
      const justCompleted = action?.correct
        && action.taskKey === task.key
        && action.stage === spec.revealStage;
      item.visible = live && (Number(spec.revealStage ?? index) < stageIndex || justCompleted);
      if (!item.visible) return;
      item.position.y = (item.userData.baseY || 0) + Math.sin(time * 2 + index) * 0.025;
      if (justCompleted) {
        const revealProgress = THREE.MathUtils.clamp(
          1 - (action.until - now) / Math.max(1, action.duration),
          0,
          1
        );
        const revealScale = 0.72 + (1 - (1 - revealProgress) ** 3) * 0.28;
        item.scale.setScalar(revealScale);
        item.position.y += Math.sin(revealProgress * Math.PI) * (task.mechanic === "bridge-build" ? 0.34 : 0.2);
      } else {
        item.scale.setScalar(1);
      }
      for (const billboard of item.userData.billboards || []) billboard.quaternion.copy(camera.quaternion);
      item.userData.updateHudWorldPosition?.();
      for (const part of item.userData.motionParts || []) {
        if (part.type === "orbit") part.object.rotation.z += dt * 0.55;
        else if (part.type === "nod") part.object.rotation.z = Math.sin(time * 2.5 + index) * 0.08;
      }
    });
  }
}

let contactShadowTexture = null;

function makeContactShadowMaterial(opacity = 0.28) {
  if (!contactShadowTexture) {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(96, 96, 9, 96, 96, 88);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.48)");
    gradient.addColorStop(0.55, "rgba(0, 0, 0, 0.18)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 192, 192);
    contactShadowTexture = new THREE.CanvasTexture(canvas);
    contactShadowTexture.colorSpace = THREE.SRGBColorSpace;
  }
  return new THREE.MeshStandardMaterial({
    color: 0x000000,
    map: contactShadowTexture,
    transparent: true,
    opacity,
    depthWrite: false
  });
}

function addContactShadow(group, radius = 0.88, opacity = 0.26) {
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2.2, radius * 1.45),
    makeContactShadowMaterial(opacity)
  );
  shadow.name = "contact-shadow";
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.016;
  shadow.renderOrder = -1;
  group.add(shadow);
  return shadow;
}

function smileMesh(material, width = 0.24, drop = 0.055) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-width / 2, 0, 0),
    new THREE.Vector3(0, -drop, 0.006),
    new THREE.Vector3(width / 2, 0, 0)
  ]);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.012, 8, false), material);
}

function trackedMaterial(model, material) {
  material.transparent = true;
  model.userData.materials.push(material);
  return material;
}

function residentPalette(world, order = 0) {
  const sets = {
    meadow: [
      { skin: 0x6ea84f, dark: 0x3f7638, belly: 0xcfe4b0, accent: 0xf0c04a },
      { skin: 0x4f8f6a, dark: 0x356449, belly: 0xc4e0cb, accent: 0xe8c657 },
      { skin: 0x8aa95c, dark: 0x58733f, belly: 0xe4ecc4, accent: 0xd98b58 }
    ],
    dino: [
      { skin: 0xb97848, dark: 0x714b33, belly: 0xf0c987, accent: 0x8b965c },
      { skin: 0x8f6e50, dark: 0x5b4632, belly: 0xe0c18e, accent: 0xffbd63 },
      { skin: 0xa86838, dark: 0x65412b, belly: 0xf1d0a0, accent: 0x758653 }
    ],
    moonwood: [
      { skin: 0x5d7073, dark: 0x304f5d, belly: 0xc9d8ff, accent: 0x9fe7ff },
      { skin: 0x6d5f83, dark: 0x40364a, belly: 0xd3cdec, accent: 0x8fd3e8 },
      { skin: 0x42656a, dark: 0x244d55, belly: 0xcdebe9, accent: 0xb9d9ff }
    ]
  };
  const choices = sets[world] || sets.meadow;
  return choices[Math.abs(order) % choices.length];
}

function creaturePalette(creature) {
  const dye = getDye(creature?.dye || "moss");
  return {
    skin: dye.skin,
    dark: dye.skinDark,
    belly: dye.belly,
    accent: dye.accent
  };
}

function makeCapsule(radius, length, material, capSegments = 12, radialSegments = 28) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments), material);
}

function addCharacterMotif(model, world, materials, parts) {
  const accent = materials.accent;
  const dark = materials.dark;
  if (world === "dino") {
    for (let index = 0; index < 3; index += 1) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08 - index * 0.008, 0.24, 18), accent);
      horn.position.set((index - 1) * 0.12, 1.94 - index * 0.02, -0.03);
      horn.rotation.x = -0.18;
      horn.castShadow = true;
      model.add(horn);
    }
    const tail = makeCapsule(0.075, 0.58, dark, 8, 18);
    tail.name = "tail";
    tail.position.set(-0.48, 0.72, -0.2);
    tail.rotation.set(0.2, 0.7, Math.PI / 2.35);
    tail.castShadow = true;
    model.add(tail);
    parts.tail = tail;
    return;
  }
  if (world === "moonwood") {
    const crown = new THREE.Group();
    crown.name = "star-crown";
    crown.position.set(0, 1.88, 0.05);
    for (let index = 0; index < 5; index += 1) {
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 8), accent);
      ray.position.set(Math.sin(index * 1.256) * 0.11, Math.cos(index * 1.256) * 0.08, 0);
      ray.rotation.z = -index * 1.256;
      ray.castShadow = true;
      crown.add(ray);
    }
    model.add(crown);
    parts.crown = crown;
    return;
  }
  for (const side of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 14), accent);
    leaf.name = side < 0 ? "leaf-left" : "leaf-right";
    leaf.scale.set(0.55, 1.15, 0.18);
    leaf.position.set(side * 0.32, 1.77, 0.02);
    leaf.rotation.z = side * -0.55;
    leaf.rotation.y = side * 0.22;
    leaf.castShadow = true;
    model.add(leaf);
  }
  const tail = makeCapsule(0.06, 0.5, dark, 8, 18);
  tail.name = "leaf-tail";
  tail.position.set(-0.42, 0.7, -0.18);
  tail.rotation.set(0.1, 0.35, Math.PI / 2.45);
  tail.castShadow = true;
  model.add(tail);
  parts.tail = tail;
}

const CREATURE_BODY_PROFILES = {
  tuft: { body: [1.05, 1.05, 0.82], head: [1.04, 0.92, 0.92], headY: 1.42, armX: 0.38, legX: 0.18 },
  spike: { body: [0.9, 1.12, 0.78], head: [0.96, 1.02, 0.88], headY: 1.48, armX: 0.35, legX: 0.16 },
  pebble: { body: [1.28, 0.76, 0.94], head: [1.2, 0.82, 0.98], headY: 1.31, armX: 0.45, legX: 0.22 },
  stalk: { body: [0.72, 1.32, 0.72], head: [0.86, 1.06, 0.84], headY: 1.57, armX: 0.3, legX: 0.14 },
  moth: { body: [0.98, 1.02, 0.74], head: [1.12, 0.9, 0.86], headY: 1.43, armX: 0.37, legX: 0.18 },
  boulder: { body: [1.2, 1, 0.92], head: [1.12, 0.94, 0.94], headY: 1.43, armX: 0.43, legX: 0.22 }
};

function addCreaturePattern(root, pattern, materials, bodyY) {
  if (!pattern || pattern === "pattern-none") return;
  const group = new THREE.Group();
  group.name = pattern;
  if (pattern === "pattern-stripes") {
    for (const [index, y] of [0.6, 0.82, 1.04].entries()) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.29 - index * 0.018, 0.025, 10, 30), materials.accent);
      stripe.position.set(0, y, 0.25);
      stripe.scale.set(1, 0.72, 0.25);
      group.add(stripe);
    }
  } else {
    const positions = pattern === "pattern-stars"
      ? [[-0.18, bodyY + 0.18], [0.16, bodyY - 0.03], [-0.04, bodyY - 0.25]]
      : [[-0.18, bodyY + 0.2], [0.17, bodyY + 0.05], [-0.08, bodyY - 0.22], [0.22, bodyY - 0.28]];
    positions.forEach(([x, y], index) => {
      const geometry = pattern === "pattern-stars"
        ? new THREE.OctahedronGeometry(0.065, 0)
        : pattern === "pattern-scales"
          ? new THREE.TorusGeometry(0.065, 0.016, 8, 18, Math.PI)
          : new THREE.SphereGeometry(0.06 + (index % 2) * 0.018, 18, 12);
      const mark = new THREE.Mesh(geometry, materials.accent);
      mark.position.set(x, y, 0.39);
      mark.scale.z = 0.25;
      if (pattern === "pattern-scales") mark.rotation.z = Math.PI;
      group.add(mark);
    });
  }
  root.add(group);
}

function addCreatureEyes(root, eyeId, materials, headY) {
  const group = new THREE.Group();
  group.name = eyeId;
  let positions = [[-0.17, headY + 0.05], [0.17, headY + 0.05]];
  if (eyeId === "eyes-one") positions = [[0, headY + 0.05]];
  if (eyeId === "eyes-three") positions = [[-0.17, headY + 0.02], [0.17, headY + 0.02], [0, headY + 0.22]];
  const size = eyeId === "eyes-big" ? 0.125 : eyeId === "eyes-tiny" ? 0.068 : 0.095;

  positions.forEach(([x, y], index) => {
    const stalk = eyeId === "eyes-stalks";
    if (stalk) {
      const stem = makeCapsule(0.025, 0.19, materials.skin, 6, 12);
      stem.position.set(x, y + 0.15, 0.12);
      stem.rotation.z = x * -0.7;
      group.add(stem);
      y += 0.27;
    }
    const eye = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), materials.white);
    eye.position.set(x, y, stalk ? 0.22 : 0.4);
    eye.scale.set(eyeId === "eyes-wide" ? 1.32 : 1, eyeId === "eyes-sleepy" ? 0.5 : 1.1, 0.45);
    eye.userData.blinkBaseY = eye.scale.y;
    group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(size * 0.38, 16, 10), materials.dark);
    pupil.position.set(x + (index % 2 ? -0.008 : 0.008), y - 0.008, stalk ? 0.268 : 0.457);
    pupil.scale.z = 0.34;
    pupil.userData.blinkBaseY = pupil.scale.y;
    group.add(pupil);
    if (eyeId === "eyes-goggle") {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(size * 1.18, 0.018, 8, 22), materials.accent);
      rim.position.set(x, y, stalk ? 0.276 : 0.466);
      group.add(rim);
    }
  });

  if (eyeId === "eyes-fierce") {
    for (const side of [-1, 1]) {
      const brow = makeCapsule(0.018, 0.13, materials.dark, 6, 12);
      brow.position.set(side * 0.17, headY + 0.17, 0.47);
      brow.rotation.z = side * 0.82;
      group.add(brow);
    }
  }
  root.add(group);
  return group;
}

function addCreatureMouth(root, mouthId, materials, headY) {
  const group = new THREE.Group();
  group.name = mouthId;
  const y = headY - 0.18;
  if (mouthId === "mouth-beak") {
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 20), materials.accent);
    beak.position.set(0, y, 0.48);
    beak.rotation.x = Math.PI / 2;
    group.add(beak);
  } else if (mouthId === "mouth-round") {
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.024, 10, 24), materials.dark);
    mouth.position.set(0, y, 0.47);
    group.add(mouth);
  } else if (mouthId === "mouth-snout") {
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 14), materials.belly);
    snout.position.set(0, y + 0.015, 0.41);
    snout.scale.set(1.2, 0.58, 0.42);
    group.add(snout);
    for (const side of [-1, 1]) {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), materials.dark);
      nostril.position.set(side * 0.055, y + 0.025, 0.49);
      group.add(nostril);
    }
  } else {
    const mouth = mouthId === "mouth-grin"
      ? new THREE.Mesh(new THREE.SphereGeometry(0.14, 22, 12), materials.white)
      : smileMesh(materials.dark, mouthId === "mouth-whisker" ? 0.18 : 0.23, 0.055);
    mouth.position.set(0, y, 0.465);
    mouth.rotation.z = Math.PI;
    if (mouthId === "mouth-grin") mouth.scale.set(1.2, 0.4, 0.18);
    group.add(mouth);
    if (["mouth-tusks", "mouth-fangs"].includes(mouthId)) {
      for (const side of [-1, 1]) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.035, mouthId === "mouth-tusks" ? 0.17 : 0.12, 12), materials.white);
        tooth.position.set(side * 0.09, y - 0.055, 0.49);
        tooth.rotation.z = mouthId === "mouth-tusks" ? side * 0.35 + Math.PI : 0;
        group.add(tooth);
      }
    }
    if (mouthId === "mouth-whisker") {
      for (const side of [-1, 1]) {
        for (const offset of [-0.035, 0.035]) {
          const whisker = makeCapsule(0.008, 0.2, materials.dark, 4, 8);
          whisker.position.set(side * 0.19, y + offset, 0.46);
          whisker.rotation.z = Math.PI / 2 + side * offset * 3;
          group.add(whisker);
        }
      }
    }
  }
  root.add(group);
}

function addCreatureCrest(root, crestId, materials, headY, parts) {
  if (!crestId || crestId === "crest-none") return;
  const group = new THREE.Group();
  group.name = crestId;
  group.position.y = headY + 0.41;
  const addCone = (x, height, tilt = 0) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.07, height, 18), materials.accent);
    cone.position.set(x, height * 0.42, 0);
    cone.rotation.z = tilt;
    group.add(cone);
  };
  if (["crest-horns", "crest-spikes", "crest-crown"].includes(crestId)) {
    const count = crestId === "crest-horns" ? 2 : crestId === "crest-crown" ? 5 : 4;
    for (let i = 0; i < count; i += 1) addCone((i - (count - 1) / 2) * 0.12, crestId === "crest-crown" ? 0.22 : 0.27 - Math.abs(i - (count - 1) / 2) * 0.02, (i - (count - 1) / 2) * -0.12);
  } else if (crestId === "crest-antenna") {
    for (const side of [-1, 1]) {
      const stem = makeCapsule(0.022, 0.34, materials.dark, 6, 12);
      stem.position.set(side * 0.13, 0.16, 0);
      stem.rotation.z = side * -0.42;
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 10), materials.accent);
      tip.position.set(side * 0.2, 0.35, 0);
      group.add(stem, tip);
    }
  } else if (crestId === "crest-ears") {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 24), materials.skin);
      ear.position.set(side * 0.26, 0.15, 0);
      ear.rotation.z = side * -0.42;
      group.add(ear);
    }
  } else if (crestId === "crest-shell") {
    const shell = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.055, 10, 28, Math.PI * 1.7), materials.accent);
    shell.rotation.z = -0.3;
    group.add(shell);
  } else if (crestId === "crest-frond") {
    const stem = makeCapsule(0.025, 0.35, materials.dark, 6, 12);
    stem.position.y = 0.16;
    group.add(stem);
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 10), materials.accent);
      leaf.position.set(side * 0.09, 0.22 + (side + 1) * 0.055, 0);
      leaf.scale.set(1.3, 0.55, 0.3);
      leaf.rotation.z = side * 0.5;
      group.add(leaf);
    }
  } else if (crestId === "crest-flame") {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.48, 24), materials.accent);
    flame.position.y = 0.2;
    flame.scale.z = 0.7;
    group.add(flame);
  } else {
    addCone(0, 0.42, crestId === "crest-fin" ? -0.3 : 0);
  }
  root.add(group);
  parts.crest = group;
}

function addCreatureTail(root, tailId, materials, parts) {
  if (!tailId || tailId === "tail-none") return;
  const group = new THREE.Group();
  group.name = tailId;
  group.position.set(-0.43, 0.72, -0.18);
  const stem = makeCapsule(tailId === "tail-spike" ? 0.095 : 0.06, tailId === "tail-curl" ? 0.62 : 0.48, materials.dark, 8, 18);
  stem.rotation.set(0.12, 0.4, Math.PI / 2.4);
  group.add(stem);
  const tipMaterial = tailId === "tail-moon" ? materials.white : materials.accent;
  if (tailId === "tail-fan" || tailId === "tail-fern") {
    for (let index = -1; index <= 1; index += 1) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 10), tipMaterial);
      leaf.position.set(-0.34, 0.08 + index * 0.1, 0);
      leaf.scale.set(1.25, 0.5, 0.26);
      leaf.rotation.z = index * 0.45;
      group.add(leaf);
    }
  } else {
    const tip = tailId === "tail-spade"
      ? new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.25, 4), tipMaterial)
      : new THREE.Mesh(new THREE.SphereGeometry(tailId === "tail-tuft" ? 0.14 : 0.1, 18, 12), tipMaterial);
    tip.position.set(-0.36, 0.08, 0);
    if (tailId === "tail-moon") tip.scale.set(0.55, 1.25, 0.35);
    group.add(tip);
  }
  root.add(group);
  parts.tail = group;
}

function creatureFoot(feetId, side, materials) {
  const group = new THREE.Group();
  const material = feetId === "feet-webbed" ? materials.accent : materials.dark;
  const foot = feetId === "feet-round"
    ? new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), material)
    : feetId === "feet-hoofs"
      ? new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 18), material)
      : makeCapsule(feetId === "feet-tall" ? 0.065 : 0.075, feetId === "feet-tall" ? 0.42 : 0.26, material, 8, 18);
  foot.position.y = feetId === "feet-tall" ? -0.19 : -0.12;
  if (!["feet-hoofs", "feet-round"].includes(feetId)) foot.rotation.x = Math.PI / 2;
  foot.rotation.z = side * 0.08;
  if (feetId === "feet-webbed") foot.scale.set(1.45, 1, 0.55);
  group.add(foot);
  if (feetId === "feet-claws") {
    for (let index = -1; index <= 1; index += 1) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.1, 10), materials.white);
      claw.position.set(index * 0.045, -0.15, 0.12);
      claw.rotation.x = Math.PI / 2;
      group.add(claw);
    }
  }
  return group;
}

function addCreatureGear(root, equipped, materials, headY, parts) {
  if (equipped?.back === "moth-wings") {
    const wings = new THREE.Group();
    wings.name = "moth-wings";
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(0.38, 28, 18), materials.accent);
      wing.position.set(side * 0.42, 1.02, -0.18);
      wing.scale.set(0.72, 1.18, 0.18);
      wing.rotation.z = side * -0.45;
      wings.add(wing);
    }
    root.add(wings);
    parts.wings = wings;
  }
  if (equipped?.neck === "vine-scarf") {
    const scarf = new THREE.Group();
    scarf.name = "vine-scarf";
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 10, 32), materials.accent);
    collar.position.set(0, headY - 0.39, 0.01);
    collar.rotation.x = Math.PI / 2;
    const end = makeCapsule(0.035, 0.34, materials.accent, 6, 12);
    end.position.set(0.2, headY - 0.58, 0.32);
    end.rotation.z = -0.2;
    scarf.add(collar, end);
    root.add(scarf);
    parts.scarf = scarf;
  }
  if (["leaf-cap", "acorn-hat"].includes(equipped?.head)) {
    const hat = new THREE.Group();
    hat.name = equipped.head;
    hat.position.set(0, headY + 0.35, 0.03);
    const crown = new THREE.Mesh(
      equipped.head === "acorn-hat" ? new THREE.SphereGeometry(0.27, 28, 14) : new THREE.SphereGeometry(0.32, 28, 14),
      equipped.head === "acorn-hat" ? materials.dark : materials.accent
    );
    crown.scale.set(1, 0.46, 0.88);
    crown.position.y = 0.06;
    hat.add(crown);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 10), materials.accent);
    leaf.position.set(0.18, 0.18, 0);
    leaf.scale.set(1.25, 0.45, 0.24);
    leaf.rotation.z = -0.5;
    hat.add(leaf);
    root.add(hat);
    parts.hat = hat;
  }
  if (equipped?.held === "stone-staff") {
    const staff = new THREE.Group();
    staff.name = "stone-staff";
    staff.position.set(0.57, 0.56, 0.07);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.15, 12), materials.dark);
    shaft.position.y = 0.2;
    shaft.rotation.z = -0.08;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 1), materials.accent);
    stone.position.set(-0.045, 0.78, 0);
    staff.add(shaft, stone);
    root.add(staff);
    parts.held = staff;
  }
}

function buildCharacterAvatar({ palette, world = "meadow", scale = 1, role = "resident", phase = 0, creature = null }) {
  const root = new THREE.Group();
  root.name = `${role}-avatar`;
  root.scale.setScalar(scale);
  root.userData.baseScale = scale;
  root.userData.phase = phase;
  root.userData.materials = [];
  root.userData.parts = {};
  root.userData.groundY = 0;

  const materials = {
    skin: trackedMaterial(root, clayMat(palette.skin)),
    belly: trackedMaterial(root, clayMat(palette.belly, { roughness: 0.4, clearcoat: 0.2 })),
    dark: trackedMaterial(root, inkMat({ color: palette.dark })),
    accent: trackedMaterial(root, clayMat(palette.accent, {
      roughness: 0.34,
      emissive: new THREE.Color(palette.accent).multiplyScalar(0.12),
      emissiveIntensity: 0.55
    })),
    white: trackedMaterial(root, clayMat(0xfffbef, { roughness: 0.34, clearcoat: 0.34 }))
  };

  const custom = creature ? normalizeCreature(creature) : null;
  if (custom) {
    root.userData.avatarSpec = questCreatureRigSpec(custom);
    root.userData.rigKind = "articulated-modular-creature";
  }
  const bodyId = custom?.body || "tuft";
  const profile = CREATURE_BODY_PROFILES[bodyId] || CREATURE_BODY_PROFILES.tuft;

  addContactShadow(root, role === "player" ? 0.9 : 0.78, role === "player" ? 0.31 : 0.24);

  const bodyJoint = new THREE.Group();
  bodyJoint.name = "joint-body";
  root.add(bodyJoint);
  root.userData.parts.bodyJoint = bodyJoint;

  const body = bodyId === "boulder"
    ? new THREE.Mesh(new THREE.DodecahedronGeometry(0.54, 2), materials.skin)
    : bodyId === "spike"
      ? new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.18, 36), materials.skin)
      : makeCapsule(0.36, 0.68, materials.skin, 16, 34);
  body.name = "body";
  body.position.y = 0.82;
  body.scale.set(...profile.body);
  body.castShadow = true;
  bodyJoint.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.27, 30, 18), materials.belly);
  belly.name = "belly";
  belly.position.set(0, bodyId === "pebble" ? 0.67 : 0.74, 0.31);
  belly.scale.set(profile.body[0] * 0.86, profile.body[1] * 1.02, 0.22);
  bodyJoint.add(belly);

  const headJoint = new THREE.Group();
  headJoint.name = "joint-head";
  root.add(headJoint);
  root.userData.parts.headJoint = headJoint;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 36, 24), materials.skin);
  head.name = "head";
  head.position.set(0, profile.headY, 0.02);
  head.scale.set(...profile.head);
  head.castShadow = true;
  headJoint.add(head);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 26, 14), materials.belly);
  muzzle.name = "muzzle";
  muzzle.position.set(0, profile.headY - 0.15, 0.39);
  muzzle.scale.set(1.25, 0.58, 0.2);
  headJoint.add(muzzle);

  addCreaturePattern(bodyJoint, custom?.pattern, materials, 0.82);
  root.userData.parts.eyes = addCreatureEyes(headJoint, custom?.eyes || "eyes-round", materials, profile.headY);
  addCreatureMouth(headJoint, custom?.mouth || "mouth-smile", materials, profile.headY);
  addCreatureCrest(headJoint, custom?.crest, materials, profile.headY, root.userData.parts);
  addCreatureTail(root, custom?.tail, materials, root.userData.parts);

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? "arm-left" : "arm-right";
    arm.position.set(side * profile.armX, 1.04, 0.02);
    const limb = makeCapsule(0.065, 0.48, materials.dark, 8, 18);
    limb.position.y = -0.26;
    limb.rotation.z = side * 0.12;
    limb.castShadow = true;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 18, 12), materials.skin);
    hand.position.set(side * 0.02, -0.56, 0.02);
    hand.castShadow = true;
    arm.add(limb, hand);
    root.add(arm);
    root.userData.parts[side < 0 ? "leftArm" : "rightArm"] = arm;

    const leg = new THREE.Group();
    leg.name = side < 0 ? "leg-left" : "leg-right";
    leg.position.set(side * profile.legX, 0.34, 0.04);
    const foot = creatureFoot(custom?.feet || "feet-paws", side, materials);
    leg.add(foot);
    root.add(leg);
    root.userData.parts[side < 0 ? "leftLeg" : "rightLeg"] = leg;
  }

  if (custom?.body === "moth" && custom.equipped?.back !== "moth-wings") {
    addCreatureGear(root, { back: "moth-wings" }, materials, profile.headY, root.userData.parts);
  }
  addCreatureGear(root, custom?.equipped, materials, profile.headY, root.userData.parts);
  if (root.userData.parts.hat) headJoint.add(root.userData.parts.hat);
  if (!custom) addCharacterMotif(root, world, materials, root.userData.parts);

  root.traverse(child => {
    if (child.isMesh && child.name !== "contact-shadow") {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return root;
}

function setCharacterOpacity(model, opacity) {
  for (const material of model.userData.materials || []) {
    material.opacity = opacity;
  }
}

function updateCharacterMotion(model, {
  now,
  dt,
  mood = "idle",
  moving = false,
  solved = false,
  next = false,
  visible = true,
  turn = 0,
  activity = null,
  bank = 0,
  performance = null
}) {
  const rigged = updateRiggedCharacter(model, {
    now,
    dt,
    mood,
    moving,
    solved,
    next,
    visible,
    turn
  });
  if (rigged) {
    if (!visible) return;
    const performanceProgress = performance
      ? THREE.MathUtils.clamp(1 - (performance.until - now) / Math.max(1, performance.duration), 0, 1)
      : 0;
    const success = performance?.outcome === "correct";
    model.position.y += success ? Math.sin(performanceProgress * Math.PI) * 0.42 : 0;
    model.rotation.z = -bank * 0.34 + (performance && !success ? Math.sin(performanceProgress * Math.PI) * 0.1 : 0);
    return;
  }
  model.visible = visible;
  if (!visible) return;
  const phase = model.userData.phase || 0;
  const time = now * 0.001 + phase;
  const parts = model.userData.parts || {};
  const walk = moving ? 1 : 0;
  const cheer = mood === "cheer" || solved ? 1 : 0;
  const teach = mood === "teach" || next ? 1 : 0;
  const idleLift = Math.sin(time * 1.8) * 0.025;
  const walkLift = Math.abs(Math.sin(time * 7.4)) * 0.06 * walk;
  const targetScale = (model.userData.baseScale || 1) * (next ? 1.08 : solved ? 0.94 : 1);
  const actionProgress = activity
    ? THREE.MathUtils.clamp(1 - (activity.until - now) / Math.max(1, activity.duration), 0, 1)
    : 0;
  const actionLift = activity?.kind === "jump" ? Math.sin(actionProgress * Math.PI) * 0.9 : 0;
  const performanceProgress = performance
    ? THREE.MathUtils.clamp(1 - (performance.until - now) / Math.max(1, performance.duration), 0, 1)
    : 0;
  const successPerformance = performance?.outcome === "correct";
  const performanceLift = successPerformance
    ? Math.sin(performanceProgress * Math.PI) * (performance.clip?.includes("bounce") ? 0.62 : 0.38)
    : 0;
  const recoveryLean = performance && !successPerformance
    ? Math.sin(performanceProgress * Math.PI) * (performance.clip?.includes("measure") ? 0.14 : 0.08)
    : 0;

  model.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 1 - Math.pow(0.015, dt));
  model.position.y = (model.userData.groundY || 0) + idleLift + walkLift + actionLift + performanceLift + cheer * Math.sin(time * 7.2) * 0.035;
  model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, turn, 1 - Math.pow(0.01, dt));
  model.rotation.z = Math.sin(time * 7.4) * 0.035 * walk
    + Math.sin(time * 2.1) * 0.025 * teach
    - bank * 0.36
    + recoveryLean;

  if (parts.leftLeg) parts.leftLeg.rotation.x = Math.sin(time * 7.4) * 0.42 * walk;
  if (parts.rightLeg) parts.rightLeg.rotation.x = -Math.sin(time * 7.4) * 0.42 * walk;
  if (parts.leftArm) {
    parts.leftArm.rotation.z = 0.3 + Math.sin(time * 7.4 + Math.PI) * 0.22 * walk - cheer * 0.92;
    parts.leftArm.rotation.x = Math.sin(time * 4.7) * 0.1 * teach;
    if (activity?.kind === "carry") {
      parts.leftArm.rotation.z = -0.45;
      parts.leftArm.rotation.x = -0.9;
    } else if (activity?.kind === "build") {
      parts.leftArm.rotation.x = -0.8 + Math.sin(actionProgress * Math.PI * 2) * 0.5;
    } else if (activity?.kind === "conduct") {
      parts.leftArm.rotation.z = -0.7 - Math.sin(actionProgress * Math.PI * 2) * 0.36;
    } else if (performance?.clip?.includes("hammer")) {
      parts.leftArm.rotation.x = -0.9 + Math.sin(performanceProgress * Math.PI * 4) * 0.68;
    } else if (successPerformance) {
      parts.leftArm.rotation.z -= Math.sin(performanceProgress * Math.PI) * 0.72;
    }
  }
  if (parts.rightArm) {
    parts.rightArm.rotation.z = -0.3 + Math.sin(time * 7.4) * 0.22 * walk + teach * (0.75 + Math.sin(time * 5.8) * 0.22) + cheer * 0.92;
    parts.rightArm.rotation.x = Math.sin(time * 5.1) * 0.1 * teach;
    if (activity?.kind === "carry") {
      parts.rightArm.rotation.z = 0.45;
      parts.rightArm.rotation.x = -0.9;
    } else if (activity?.kind === "build") {
      parts.rightArm.rotation.x = -1.2 - Math.sin(actionProgress * Math.PI * 2) * 0.55;
    } else if (activity?.kind === "conduct") {
      parts.rightArm.rotation.z = 0.7 + Math.sin(actionProgress * Math.PI * 2) * 0.36;
    } else if (performance?.clip?.includes("conduct")) {
      parts.rightArm.rotation.z = 0.62 + Math.sin(performanceProgress * Math.PI * 4) * 0.42;
    } else if (successPerformance) {
      parts.rightArm.rotation.z += Math.sin(performanceProgress * Math.PI) * 0.72;
    }
  }
  if (parts.bodyJoint) {
    const breath = 1 + Math.sin(time * 2.35) * (moving ? 0.008 : 0.018);
    parts.bodyJoint.scale.set(1 / Math.sqrt(breath), breath, 1 / Math.sqrt(breath));
  }
  if (parts.headJoint) {
    parts.headJoint.rotation.y = Math.sin(time * 1.35) * 0.055 + turn * 0.45;
    parts.headJoint.rotation.x = Math.sin(time * 1.9) * 0.018 - walkLift * 0.22;
    parts.headJoint.rotation.z = Math.sin(time * 2.15) * 0.025 + cheer * Math.sin(time * 5.4) * 0.06;
    if (performance && !successPerformance) {
      parts.headJoint.rotation.x += Math.sin(performanceProgress * Math.PI * 2) * 0.09;
    }
  }
  if (parts.eyes) {
    const blinkPhase = (time + phase * 0.83) % 4.35;
    const blinkAmount = blinkPhase > 4.18 ? 0.08 : 1;
    const blend = 1 - Math.pow(0.0002, dt);
    parts.eyes.traverse(part => {
      if (!Number.isFinite(part.userData?.blinkBaseY)) return;
      part.scale.y = THREE.MathUtils.lerp(part.scale.y, part.userData.blinkBaseY * blinkAmount, blend);
    });
  }
  if (parts.tail) {
    parts.tail.rotation.y = 0.35 + Math.sin(time * (moving ? 6.4 : 2.2)) * 0.25;
  }
  if (parts.crown) {
    parts.crown.rotation.z = Math.sin(time * 2.5) * 0.08;
  }
  if (parts.crest) parts.crest.rotation.z = Math.sin(time * 2.2) * 0.045;
  if (parts.hat) parts.hat.rotation.z = Math.sin(time * 2.05) * 0.035;
  if (parts.wings) {
    const flutter = 1 + Math.sin(time * (moving ? 8.6 : 3.4)) * (moving ? 0.08 : 0.025);
    parts.wings.scale.set(flutter, 1, 1);
  }
  if (parts.held) parts.held.rotation.z = Math.sin(time * (moving ? 6.8 : 2)) * 0.06;
  if (parts.scarf) parts.scarf.rotation.z = Math.sin(time * (moving ? 5.2 : 1.8)) * 0.035;
  setCharacterOpacity(model, solved ? 0.68 : 1);
}

function buildPlayerRelic(player, section, theme) {
  const rewardId = section.rewardIds?.at(-1);
  if (!rewardId) return null;
  const relic = new THREE.Group();
  relic.name = `active-relic-${rewardId}`;
  relic.position.set(0.88, 1.58, 0.02);
  const colours = [theme.glow, theme.water, theme.flower, theme.structure];
  const colour = colours[section.rewardIds.length % colours.length];
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 1), glowMat(colour, 0.9));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.018, 8, 28), glowMat(theme.glow, 0.72));
  ring.rotation.x = Math.PI / 2.7;
  relic.add(core, ring);
  relic.userData.core = core;
  relic.userData.ring = ring;
  player.add(relic);
  return relic;
}

function buildTrailCharacters(scene, section, theme, creature) {
  const characters = {
    player: buildCharacterAvatar({
      palette: creaturePalette(creature),
      world: section.world,
      scale: 0.9,
      role: "player",
      phase: 0.2,
      creature
    }),
    guide: buildCharacterAvatar({
      palette: residentPalette(section.world, 0),
      world: section.world,
      scale: 1.1,
      role: "guide",
      phase: 1.1,
      creature: residentCreatureSpec(section.stopIndex + 1, section.world)
    }),
    residents: new Map(),
    relic: null
  };

  characters.relic = buildPlayerRelic(characters.player, section, theme);

  characters.player.position.set(section.start?.x ?? TRAIL_START.x, section.start?.y || 0, section.start?.z ?? TRAIL_START.z);
  characters.player.userData.groundY = section.start?.y || 0;
  characters.guide.position.set(section.guide.x, section.guide.y || 0, section.guide.z);
  characters.guide.userData.groundY = section.guide.y || 0;
  scene.add(characters.player);
  scene.add(characters.guide);

  section.encounters.forEach(encounter => {
    const resident = buildCharacterAvatar({
      palette: residentPalette(section.world, encounter.order + (section.chapterStop || 1)),
      world: section.world,
      scale: 1.06,
      role: "resident",
      phase: 1.8 + encounter.order * 0.73,
      creature: residentCreatureSpec(section.stopIndex + encounter.order + 2, section.world)
    });
    resident.position.set(encounter.x, encounter.y || 0, encounter.z);
    resident.userData.groundY = encounter.y || 0;
    characters.residents.set(encounter.id, resident);
    scene.add(resident);
  });

  return characters;
}

function updateTrailCharacters(characters, section, {
  player,
  target,
  moving,
  guideDone,
  active,
  activeTask,
  solved,
  nextEncounter,
  mood,
  now,
  dt,
  activity,
  bank,
  reaction
}) {
  characters.player.position.x = player.x;
  characters.player.position.z = player.z;
  characters.player.userData.groundY = player.y || 0;
  const travelX = (target?.x ?? player.x) - player.x;
  const travelZ = (target?.z ?? player.z) - player.z;
  if (moving && Math.hypot(travelX, travelZ) > 0.015) {
    characters.player.userData.facing = Math.atan2(travelX, travelZ);
  }
  const turn = characters.player.userData.facing || routeDirectionAt(section.route, routeProgressAt(section.route, player)).heading;
  updateCharacterMotion(characters.player, { now, dt, mood, moving, turn, activity, bank, performance: reaction });
  if (characters.relic) {
    const time = now * 0.001;
    characters.relic.position.y = 1.58 + Math.sin(time * 2.4) * 0.08;
    characters.relic.userData.core.rotation.y += dt * 1.1;
    characters.relic.userData.ring.rotation.z += dt * 0.7;
  }

  const guideVisible = !guideDone || !active;
  characters.guide.userData.groundY = section.guide.y || 0;
  const guideFacing = Math.atan2(
    player.x - characters.guide.position.x,
    player.z - characters.guide.position.z
  );
  updateCharacterMotion(characters.guide, {
    now,
    dt,
    mood: guideDone ? "idle" : "teach",
    next: !guideDone,
    visible: guideVisible,
    turn: guideFacing
  });

  for (const encounter of section.encounters) {
    const resident = characters.residents.get(encounter.id);
    if (!resident) continue;
    const isSolved = solved.has(encounter.id);
    const isNext = nextEncounter?.id === encounter.id && guideDone;
    const isActive = active?.id === encounter.id;
    if (isActive && activeTask) {
      const shoulder = physicalTaskResidentPoint(section, encounter);
      const settle = 1 - Math.pow(0.018, dt);
      resident.position.x = THREE.MathUtils.lerp(resident.position.x, shoulder.x, settle);
      resident.position.z = THREE.MathUtils.lerp(resident.position.z, shoulder.z, settle);
      resident.userData.groundY = shoulder.y || encounter.y || 0;
    } else {
      resident.position.x = THREE.MathUtils.lerp(resident.position.x, encounter.x, 0.08);
      resident.position.z = THREE.MathUtils.lerp(resident.position.z, encounter.z, 0.08);
      resident.userData.groundY = encounter.y || 0;
    }
    const residentFacing = Math.atan2(
      player.x - resident.position.x,
      player.z - resident.position.z
    );
    updateCharacterMotion(resident, {
      now,
      dt,
      mood: isActive || isNext ? "teach" : isSolved ? "cheer" : "idle",
      solved: isSolved,
      next: isNext,
      visible: !active || isActive,
      turn: isActive || isNext ? residentFacing : routeDirectionAt(section.route, encounter.progress).heading,
      performance: isActive ? reaction : null
    });
  }
}

function seededParticle(seed, index, spread) {
  return (Math.abs(Math.sin(seed * 17.23 + index * 91.71) * 43758.5453) % 1 - 0.5) * spread;
}

function buildQuestAtmosphere(scene, section, theme, quality) {
  const chapterIndex = section.chapter?.index || 1;
  const weatherKind = section.stopId === "s4"
    ? "mist"
    : section.stopId === "s5"
      ? "stars"
      : chapterIndex <= 2
        ? "pollen"
    : chapterIndex <= 4
      ? "dust"
      : chapterIndex === 6
        ? "rain"
        : "stars";
  const count = Math.max(0, Math.round(220 * quality.particleScale));
  const positions = new Float32Array(count * 3);
  const bounds = section.route.bounds;
  const centreX = (bounds.minX + bounds.maxX) / 2;
  const centreZ = (bounds.minZ + bounds.maxZ) / 2;
  const spreadX = Math.max(28, bounds.maxX - bounds.minX + 10);
  const spreadZ = Math.max(40, bounds.maxZ - bounds.minZ + 10);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = centreX + seededParticle(section.stopIndex, index, spreadX);
    positions[index * 3 + 1] = 0.5 + Math.abs(seededParticle(section.stopIndex + 2, index, 8));
    positions[index * 3 + 2] = centreZ + seededParticle(section.stopIndex + 4, index, spreadZ);
  }
  const weatherGeometry = new THREE.BufferGeometry();
  weatherGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const weatherMaterial = new THREE.PointsMaterial({
    color: weatherKind === "rain" || weatherKind === "mist" ? 0xc6e9ff : weatherKind === "dust" ? 0xe6be77 : theme.glow,
    size: weatherKind === "rain" ? 0.055 : weatherKind === "mist" ? 0.1 : weatherKind === "stars" ? 0.11 : 0.075,
    transparent: true,
    opacity: weatherKind === "rain" ? 0.42 : weatherKind === "mist" ? 0.24 : 0.58,
    depthWrite: false,
    blending: weatherKind === "stars" ? THREE.AdditiveBlending : THREE.NormalBlending
  });
  const weather = new THREE.Points(weatherGeometry, weatherMaterial);
  weather.name = `quest-weather-${weatherKind}`;
  weather.frustumCulled = false;
  scene.add(weather);

  let water = null;
  const seedwakeWater = ["s2", "s4"].includes(section.stopId);
  if (quality.water && (seedwakeWater || [2, 5, 6].includes(chapterIndex))) {
    const progress = section.stopId === "s4" ? 0.36 : section.stopId === "s2" ? 0.38 : 0.66;
    const side = section.stopId === "s4" ? 1 : chapterIndex === 5 ? 1 : -1;
    const point = routeSidePoint(section.route, progress, side, seedwakeWater ? (section.stopId === "s4" ? 2.9 : 3.4) : 4.8);
    const waterRadius = section.stopId === "s4" ? 7 : chapterIndex === 6 ? 7.5 : 5.5;
    const geometry = new THREE.CircleGeometry(waterRadius, 48);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        questTime: { value: 0 },
        waterColour: { value: new THREE.Color(theme.water) },
        glowColour: { value: new THREE.Color(theme.glow) }
      },
      vertexShader: `
        uniform float questTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 transformed = position;
          transformed.z += sin(position.x * 1.7 + questTime * 1.3) * 0.045;
          transformed.z += cos(position.y * 1.35 - questTime) * 0.035;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform float questTime;
        uniform vec3 waterColour;
        uniform vec3 glowColour;
        varying vec2 vUv;
        void main() {
          float ripple = sin((vUv.x + vUv.y) * 34.0 + questTime * 2.0) * 0.5 + 0.5;
          vec3 colour = mix(waterColour, glowColour, 0.08 + ripple * 0.12);
          float edge = 1.0 - smoothstep(0.38, 0.5, distance(vUv, vec2(0.5)));
          gl_FragColor = vec4(colour, (0.74 + ripple * 0.12) * edge);
        }
      `
    });
    water = new THREE.Mesh(geometry, material);
    water.name = "authored-water-surface";
    water.rotation.x = -Math.PI / 2;
    water.position.set(point.x, point.y + 0.045, point.z);
    const waterBank = new THREE.Mesh(
      new THREE.RingGeometry(waterRadius * 0.94, waterRadius, 64),
      mat(theme.pathEdge, { roughness: 0.84, metalness: 0, envMapIntensity: 0.5 })
    );
    waterBank.name = "authored-water-bank";
    waterBank.rotation.x = -Math.PI / 2;
    waterBank.position.set(point.x, point.y + 0.035, point.z);
    waterBank.receiveShadow = true;
    scene.add(waterBank);
    scene.add(water);
  }

  const finalePoint = routePointAt(section.route, 0.86);
  const ceremonyCount = Math.max(24, Math.round(140 * Math.max(0.3, quality.particleScale)));
  const ceremonyPositions = new Float32Array(ceremonyCount * 3);
  for (let index = 0; index < ceremonyCount; index += 1) {
    const angle = (index / ceremonyCount) * Math.PI * 2;
    const radius = 1.4 + (index % 9) * 0.26;
    ceremonyPositions[index * 3] = finalePoint.x + Math.cos(angle) * radius;
    ceremonyPositions[index * 3 + 1] = 0.8 + (index % 11) * 0.31;
    ceremonyPositions[index * 3 + 2] = finalePoint.z + Math.sin(angle) * radius;
  }
  const ceremonyGeometry = new THREE.BufferGeometry();
  ceremonyGeometry.setAttribute("position", new THREE.BufferAttribute(ceremonyPositions, 3));
  const ceremony = new THREE.Points(
    ceremonyGeometry,
    new THREE.PointsMaterial({
      color: theme.glow,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  ceremony.name = "chapter-ceremony-particles";
  ceremony.visible = false;
  scene.add(ceremony);

  const stormLight = chapterIndex === 6 ? new THREE.PointLight(0xd6efff, 0, 28, 1.6) : null;
  if (stormLight) {
    stormLight.position.set(finalePoint.x, 8, finalePoint.z);
    scene.add(stormLight);
  }
  return { weather, weatherKind, water, ceremony, stormLight, bounds };
}

function updateQuestAtmosphere(atmosphere, now, dt, ceremonyActive) {
  if (!atmosphere) return;
  const positions = atmosphere.weather.geometry.attributes.position;
  const fallSpeed = atmosphere.weatherKind === "rain" ? 5.5 : atmosphere.weatherKind === "dust" ? 0.22 : 0.12;
  for (let index = 0; index < positions.count; index += 1) {
    let y = positions.getY(index) - dt * fallSpeed;
    if (y < 0.25) y = 7.5 + (index % 7) * 0.24;
    positions.setY(index, y);
    positions.setX(index, positions.getX(index) + Math.sin(now * 0.0007 + index) * dt * 0.08);
  }
  positions.needsUpdate = true;
  if (atmosphere.water) atmosphere.water.material.uniforms.questTime.value = now * 0.001;
  atmosphere.ceremony.visible = Boolean(ceremonyActive);
  if (ceremonyActive) {
    atmosphere.ceremony.rotation.y += dt * 0.46;
    atmosphere.ceremony.position.y = Math.sin(now * 0.002) * 0.18;
  }
  if (atmosphere.stormLight) {
    const pulse = Math.sin(now * 0.0031) > 0.97 ? 2.4 : 0.08;
    atmosphere.stormLight.intensity = ceremonyActive ? 1.2 : pulse;
  }
}

function buildLandscape(scene, section, theme, quality, maxAnisotropy = 4) {
  const bounds = section.route.bounds;
  const groundWidth = Math.max(34, bounds.maxX - bounds.minX);
  const groundDepth = Math.max(34, bounds.maxZ - bounds.minZ);
  const groundCentreX = (bounds.minX + bounds.maxX) / 2;
  const groundCentreZ = (bounds.minZ + bounds.maxZ) / 2;
  const groundSegments = quality.id === "low" ? 36 : 72;
  const groundGeometry = new THREE.PlaneGeometry(groundWidth, groundDepth, groundSegments, groundSegments);
  const positions = groundGeometry.attributes.position;
  const routeSamples = [
    ...section.route.samples,
    ...section.route.branches.flatMap(branch => branch.samples)
  ];
  for (let index = 0; index < positions.count; index += 1) {
    const worldX = groundCentreX + positions.getX(index);
    const worldZ = groundCentreZ - positions.getY(index);
    let nearest = routeSamples[0];
    let nearestDistanceSquared = Infinity;
    for (const sample of routeSamples) {
      const distanceSquared = (sample.x - worldX) ** 2 + (sample.z - worldZ) ** 2;
      if (distanceSquared < nearestDistanceSquared) {
        nearestDistanceSquared = distanceSquared;
        nearest = sample;
      }
    }
    const nearestDistance = Math.sqrt(nearestDistanceSquared);
    const routeBlend = 1 - THREE.MathUtils.smoothstep(nearestDistance, 4.4, 12.5);
    const fineRelief = Math.sin(worldX * 0.54 + section.stopIndex) * 0.035
      + Math.cos(worldZ * 0.27 - section.stopIndex * 0.4) * 0.045
      + Math.sin((worldX + worldZ) * 0.83) * 0.018;
    positions.setZ(index, (nearest?.y || 0) * routeBlend + fineRelief * (0.45 + routeBlend * 0.55));
  }
  groundGeometry.computeVertexNormals();
  const groundMaps = surfaceMaps(section.stopIndex * 47, {
    repeatX: 8,
    repeatY: 30,
    contrast: 30,
    kind: "ground",
    anisotropy: maxAnisotropy,
    detail: quality.id
  });
  const ground = new THREE.Mesh(
    groundGeometry,
    mat(theme.ground, {
      ...groundMaps,
      bumpScale: 0.075,
      roughness: 0.86,
      envMapIntensity: 0.52
    })
  );
  ground.name = "trail-ground";
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(groundCentreX, -0.035, groundCentreZ);
  ground.receiveShadow = true;
  scene.add(ground);

  const points = section.route.samples;
  scene.add(pathRibbon(points, 5.85, 0.065, theme.pathEdge, section.stopIndex * 13, maxAnisotropy, quality.id));
  scene.add(pathRibbon(points, 5.25, 0.105, theme.path, section.stopIndex * 17, maxAnisotropy, quality.id));
  section.route.branches.forEach((branch, index) => {
    const branchPoints = branch.samples;
    scene.add(pathRibbon(branchPoints, 4.7, 0.06, theme.pathEdge, section.stopIndex * 29 + index, maxAnisotropy, quality.id));
    scene.add(pathRibbon(branchPoints, 4.15, 0.1, theme.path, section.stopIndex * 31 + index, maxAnisotropy, quality.id));
    if (section.rewardIds?.includes("mirror-reed")) {
      const pathGlow = pathRibbon(branchPoints, 0.24, 0.13, theme.glow, section.stopIndex * 37 + index, maxAnisotropy, quality.id);
      pathGlow.material.map?.dispose();
      pathGlow.material.map = null;
      pathGlow.material.color.set(theme.glow);
      pathGlow.material.emissive = new THREE.Color(theme.glow);
      pathGlow.material.emissiveIntensity = 0.72;
      pathGlow.material.transparent = true;
      pathGlow.material.opacity = 0.68;
      scene.add(pathGlow);
    }
  });
  const glades = buildEncounterGlades(scene, section, theme, quality, maxAnisotropy);

  // This belt is a load-safe fallback. Textured instanced trees replace it once
  // the glTF nature set is ready, so a network or GPU failure never removes the
  // readable collision wall around the route.
  const fallbackTrees = new THREE.Group();
  fallbackTrees.name = "fallback-tree-belt";
  scene.add(fallbackTrees);
  let treeIndex = 0;
  const treeBands = Math.max(24, Math.ceil(section.route.totalLength / 3.7));
  for (let band = 0; band < treeBands; band += 1) {
    const progress = band / Math.max(1, treeBands - 1);
    if (progress > (section.isChapterFinale ? 0.64 : 0.82)) continue;
    for (const side of [-1, 1]) {
      for (let row = 0; row < quality.treeRows; row += 1) {
        const stagger = ((treeIndex + row * 3) % 5) * 0.18;
        const treePoint = routeSidePoint(section.route, progress, side, 1.05 + row * 2.05 + stagger);
        const size = 0.82 + ((treeIndex * 11 + row * 7) % 10) * 0.045;
        const tree = addTree(fallbackTrees, treePoint.x, treePoint.z, size, theme, treeIndex + row);
        tree.position.y = treePoint.y;
      }
    }
    treeIndex += 1;
  }

  const rockMaterial = mat(theme.stone, { roughness: 0.9, flatShading: true });
  for (let index = 0; index < 18; index += 1) {
    const progress = 0.04 + index / 19 * 0.91;
    const side = index % 2 ? 1 : -1;
    const point = routeSidePoint(section.route, progress, side, (section.route.width || 3) + 0.75);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24 + (index % 3) * 0.07, 0), rockMaterial);
    rock.scale.y = 0.62;
    rock.position.set(point.x, point.y + 0.2, point.z);
    rock.rotation.y = index * 0.73;
    rock.castShadow = true;
    scene.add(rock);
  }

  const proceduralScenery = new THREE.Group();
  proceduralScenery.name = "procedural-scenery-fallback";
  scene.add(proceduralScenery);
  buildKitDetails(proceduralScenery, section, theme, quality);
  const landmark = buildSectionLandmark(proceduralScenery, section, theme);
  const repairs = buildRepairMoments(scene, section, theme);
  const ambience = buildAmbientLife(scene, section, theme, quality);
  const actEvent = buildActEvent(scene, section, theme);
  const fieldTasks = buildFieldTasks(scene, section, theme);
  if (section.rewardIds?.includes("first-reading-star")) {
    const rewardLight = new THREE.PointLight(theme.glow, 1.4, 18, 1.8);
    rewardLight.position.set(section.landmark.x, (section.landmark.y || 0) + 3.2, section.landmark.z);
    scene.add(rewardLight);
  }

  return {
    ground,
    glades,
    fallbackTrees,
    proceduralScenery,
    gate: buildGate(scene, section, theme),
    landmark,
    repairs,
    ambience,
    actEvent,
    fieldTasks
  };
}

function projectElement(element, worldPosition, camera, viewport, {
  lift = 0,
  scale = 1,
  anchor = "-88%",
  maxDistance = 35
} = {}) {
  if (!element) return;
  const point = new THREE.Vector3(worldPosition.x, (worldPosition.y || 0) + lift, worldPosition.z);
  const distance = camera.position.distanceTo(point);
  point.project(camera);
  const visible = distance < maxDistance && point.z > -1 && point.z < 1 && Math.abs(point.x) < 1.08 && point.y < 0.78 && point.y > -1.15;
  element.hidden = !visible;
  if (!visible) return;
  const x = (point.x * 0.5 + 0.5) * viewport.width;
  const y = (-point.y * 0.5 + 0.5) * viewport.height;
  const perspective = THREE.MathUtils.clamp(11 / distance, 0.46, 1.06);
  element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, ${anchor}) scale(${perspective * scale})`;
  element.style.zIndex = String(Math.round(600 - distance * 9));
}

export default function QuestHub({
  stopId,
  state,
  resume = null,
  isSoundEnabled = true,
  extendedResponse = false,
  isInteractive = true,
  journeyStatus = "active",
  mode = "journey",
  targetsOverride = null,
  qualityTier = null,
  ceremony = false,
  onAnswer,
  onCheckpoint,
  onFinish,
  onPrepareNext,
  onSceneReady,
  onSceneError,
  onRuntimeSignal,
  onAudioState,
  onQuit
}) {
  const stop = getStop(stopId);
  const [rewardBonuses] = useState(() => questRewardBonuses(state));
  const [section] = useState(() => {
    const targets = Array.isArray(targetsOverride) && targetsOverride.length
      ? [...new Set(targetsOverride)]
      : targetsForStop(targetsAtStop(stopId), state.mastery, stop?.index || 1);
    const seed = (stop?.index || 1) * 1000 + (state.trail.stopsDone.length || 0) + (mode === "review" ? 509 : 0);
    const built = buildTrailSection(stopId, {
      mastery: state.mastery,
      targets,
      seed,
      rewardIds: rewardBonuses.rewardIds,
      rewardCacheCount: rewardBonuses.branchCacheCount,
      completedStopIds: state.trail.stopsDone
    });
    // SAME budget as the 2D and pixel renderers: one stop, one content plan.
    // The hub used to skip budgeting entirely, so the same stop served
    // different beats depending on which renderer a device landed in.
    return budgetPhysicalSection({ ...built, rewardBonuses });
  });
  const theme = useMemo(() => ({
    ...(WORLD_THEMES[section?.world] || WORLD_THEMES.meadow),
    ...(SEEDWAKE_VISUAL_MOODS[stopId] || {})
  }), [section?.world, stopId]);

  const validEncounterIds = new Set(section?.encounters.map(encounter => encounter.id) || []);
  const validDropIds = new Set(section?.drops.map(drop => drop.id) || []);
  const initialSolved = Array.isArray(resume?.solved) ? resume.solved.filter(id => validEncounterIds.has(id)) : [];
  const initialPicked = Array.isArray(resume?.drops) ? resume.drops.filter(id => validDropIds.has(id)) : [];
  const initialGuideDone = Boolean(resume?.guideDone) || !section?.teach?.length;
  const initialMeetIndex = Math.max(0, Math.min(section?.teach?.length - 1 || 0, Number(resume?.meetIndex) || 0));
  const initialLimit = forwardLimitFor(section, { guideDone: initialGuideDone, solved: initialSolved });
  // A checkpoint changes while the child walks. Keep the position that mounted
  // this run stable so an autosave cannot tear down and recreate the 3D scene.
  const [initialPosition] = useState(() => (
    clampTrailPosition(resume?.position || section?.start || TRAIL_START, section, initialLimit)
  ));
  const resumedActive = section?.encounters.find(encounter => encounter.id === resume?.activeId && !initialSolved.includes(encounter.id)) || null;
  const initialBeatIndex = Math.max(0, Math.min((resumedActive?.beats.length || 1) - 1, Number(resume?.beatIndex) || 0));
  const resumedTask = resumedActive
    ? buildPhysicalTask(section, resumedActive, resumedActive.beats[initialBeatIndex], initialBeatIndex)
    : null;
  const initialFieldStage = Math.max(0, Math.min((resumedTask?.stages.length || 1) - 1, Number(resume?.fieldStage) || 0));
  const initialCorrections = resume?.corrections && typeof resume.corrections === "object"
    ? Object.fromEntries(Object.entries(resume.corrections).map(([key, value]) => [key, normalizeCorrection(value)]))
    : {};
  const initialCorrection = normalizeCorrection(
    resumedActive ? initialCorrections[correctionKey(resumedActive, initialBeatIndex, initialFieldStage)] : null
  );
  const initialReviewQueue = Array.isArray(resume?.reviewQueue)
    ? [...new Set(resume.reviewQueue.filter(Number.isInteger))]
    : [];
  const initialReviewedBeats = Array.isArray(resume?.reviewedBeats)
    ? [...new Set(resume.reviewedBeats.filter(Number.isInteger))]
    : [];
  const initialRemediationBeat = Number.isInteger(resume?.remediationBeat) ? resume.remediationBeat : null;
  const initialTally = resume?.tally && typeof resume.tally === "object"
    ? { correct: Number(resume.tally.correct) || 0, total: Number(resume.tally.total) || 0, mistakes: Number(resume.tally.mistakes) || 0 }
    : { correct: 0, total: 0, mistakes: 0 };
  const initialPhase = resume?.phase === "teach" && !initialGuideDone ? "teach" : "trail";
  const initialGateOpen = sectionGateIsOpen(section?.encounters || [], initialSolved);
  const initialRoutePercent = Math.round(routeProgressAt(section.route, initialPosition) * 100);

  const playerRef = useRef({ ...initialPosition });
  const targetRef = useRef({ ...initialPosition });
  const solvedRef = useRef(new Set(initialSolved));
  const pickedRef = useRef(new Set(initialPicked));
  const guideDoneRef = useRef(initialGuideDone);
  const meetIndexRef = useRef(initialMeetIndex);
  const selectedRef = useRef(null);
  const activeRef = useRef(resumedActive);
  const beatIndexRef = useRef(initialBeatIndex);
  const fieldStageRef = useRef(initialFieldStage);
  const phaseRef = useRef(initialPhase);
  const tallyRef = useRef(initialTally);
  const firstTallyRef = useRef(new Map());
  const frameTaskCacheRef = useRef({ key: null, task: null });
  const lastCorrectRef = useRef(resumedActive?.kind === "story-rock");
  const onCheckpointRef = useRef(onCheckpoint);
  const onFinishRef = useRef(onFinish);
  const onSceneReadyRef = useRef(onSceneReady);
  const onSceneErrorRef = useRef(onSceneError);
  const onRuntimeSignalRef = useRef(onRuntimeSignal);
  const sceneLoadStartedAtRef = useRef(null);
  const interactiveRef = useRef(Boolean(isInteractive));
  const journeyStatusRef = useRef(journeyStatus);
  const ceremonyRef = useRef(Boolean(ceremony));
  const finishingRef = useRef(false);
  const fieldTaskSelectRef = useRef(null);
  const fieldChoiceLockRef = useRef(false);
  const fieldCollisionArmedRef = useRef(true);
  const interactionActionRef = useRef(null);
  const correctionRecordsRef = useRef(initialCorrections);
  const correctionRef = useRef(initialCorrection);
  const reviewQueueRef = useRef(initialReviewQueue);
  const reviewedBeatsRef = useRef(initialReviewedBeats);
  const remediationBeatRef = useRef(initialRemediationBeat);
  const verbStateRef = useRef(
    resumedTask
      ? restoreSeedwakeVerbState(
        resumedTask.mechanic,
        physicalTaskAnswers(resumedTask),
        resumedTask.stages,
        initialFieldStage
      )
      : null
  );
  const verbTaskKeyRef = useRef(resumedTask?.key || null);
  const reactionRef = useRef(null);

  const [phase, setPhase] = useState(initialPhase);
  const [guideDone, setGuideDone] = useState(initialGuideDone);
  const [meetIndex] = useState(initialMeetIndex);
  const [solved, setSolved] = useState(() => new Set(initialSolved));
  const [picked, setPicked] = useState(() => new Set(initialPicked));
  const [selectedId, setSelectedId] = useState(null);
  const [active, setActive] = useState(resumedActive);
  const [beatIndex, setBeatIndex] = useState(initialBeatIndex);
  const [fieldStage, setFieldStage] = useState(initialFieldStage);
  const [retryNonce, setRetryNonce] = useState(0);
  const [correction, setCorrection] = useState(initialCorrection);
  const [remediationBeat, setRemediationBeat] = useState(initialRemediationBeat);
  const [mood, setMood] = useState("idle");
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [gateOpen, setGateOpen] = useState(initialGateOpen);
  const [routePercent, setRoutePercent] = useState(initialRoutePercent);
  const [pickupNotice, setPickupNotice] = useState(null);
  const [phonemeFillCount, setPhonemeFillCount] = useState(initialFieldStage);
  const [interactionFeedback, setInteractionFeedback] = useState(null);
  const [fieldChoicesLocked, setFieldChoicesLocked] = useState(false);

  const canvasRef = useRef(null);
  const lightweightCeremonyMount = ceremony && !isInteractive;
  const sceneGenerationRef = useRef(0);
  const guideRef = useRef(null);
  const landmarkRefs = useRef(new Map());
  const dropRefs = useRef(new Map());
  const landmarkRefCallbacks = useMemo(() => new Map(
    (section?.encounters || []).map(encounter => [encounter.id, node => {
      if (node) landmarkRefs.current.set(encounter.id, node);
      else landmarkRefs.current.delete(encounter.id);
    }])
  ), [section]);
  const dropRefCallbacks = useMemo(() => new Map(
    (section?.drops || []).map(drop => [drop.id, node => {
      if (node) dropRefs.current.set(drop.id, node);
      else dropRefs.current.delete(drop.id);
    }])
  ), [section]);
  const viewFocusRef = useRef(null);
  const moodRef = useRef("idle");
  const delayedActionsRef = useRef(new Set());

  const scheduleAction = useCallback((callback, delay) => {
    const timer = window.setTimeout(() => {
      delayedActionsRef.current.delete(timer);
      callback();
    }, delay);
    delayedActionsRef.current.add(timer);
    return timer;
  }, []);

  useEffect(() => () => {
    for (const timer of delayedActionsRef.current) window.clearTimeout(timer);
    delayedActionsRef.current.clear();
  }, []);

  const setTrailMood = useCallback(nextMood => {
    moodRef.current = nextMood;
    setMood(nextMood);
  }, []);

  const setFieldChoiceLock = useCallback(locked => {
    fieldChoiceLockRef.current = Boolean(locked);
    setFieldChoicesLocked(Boolean(locked));
  }, []);

  const setCorrectionFor = useCallback((encounter, nextBeatIndex, nextStageIndex, { reset = false } = {}) => {
    const key = correctionKey(encounter, nextBeatIndex, nextStageIndex);
    if (reset) delete correctionRecordsRef.current[key];
    const next = normalizeCorrection(correctionRecordsRef.current[key]);
    correctionRef.current = next;
    setCorrection(next);
    return next;
  }, []);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    onAudioState?.(ceremony ? "ceremony" : active ? "encounter" : "travel");
  }, [active, ceremony, onAudioState]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      viewFocusRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active?.id, beatIndex, fieldStage, gateOpen, guideDone, phase]);
  useEffect(() => { onCheckpointRef.current = onCheckpoint; }, [onCheckpoint]);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
  useEffect(() => { onSceneReadyRef.current = onSceneReady; }, [onSceneReady]);
  useEffect(() => { onSceneErrorRef.current = onSceneError; }, [onSceneError]);
  useEffect(() => { onRuntimeSignalRef.current = onRuntimeSignal; }, [onRuntimeSignal]);
  useEffect(() => { interactiveRef.current = Boolean(isInteractive); }, [isInteractive]);
  useEffect(() => { journeyStatusRef.current = journeyStatus; }, [journeyStatus]);
  useEffect(() => { ceremonyRef.current = Boolean(ceremony); }, [ceremony]);
  useEffect(() => { meetIndexRef.current = meetIndex; }, [meetIndex]);
  useEffect(() => { beatIndexRef.current = beatIndex; }, [beatIndex]);
  useEffect(() => { fieldStageRef.current = fieldStage; }, [fieldStage]);
  useEffect(() => { moodRef.current = mood; }, [mood]);

  useEffect(() => {
    if (initialGateOpen) onPrepareNext?.(stopId);
  }, [initialGateOpen, onPrepareNext, stopId]);

  useEffect(() => {
    if (!pickupNotice) return undefined;
    const timer = window.setTimeout(() => setPickupNotice(null), 1800);
    return () => window.clearTimeout(timer);
  }, [pickupNotice]);

  useEffect(() => {
    if (!interactionFeedback) return undefined;
    const timer = window.setTimeout(() => setInteractionFeedback(null), interactionFeedback.duration || 1000);
    return () => window.clearTimeout(timer);
  }, [interactionFeedback]);

  const checkpoint = useCallback((overrides = {}) => {
    const currentActive = overrides.active === undefined ? activeRef.current : overrides.active;
    const nextSolved = overrides.solved || solvedRef.current;
    const nextPicked = overrides.picked || pickedRef.current;
    onCheckpointRef.current?.({
      stopId,
      phase: overrides.phase || phaseRef.current,
      position: { ...playerRef.current },
      guideDone: overrides.guideDone ?? guideDoneRef.current,
      meetIndex: overrides.meetIndex ?? meetIndexRef.current,
      activeId: currentActive?.id || null,
      beatIndex: overrides.beatIndex ?? beatIndexRef.current,
      fieldStage: overrides.fieldStage ?? fieldStageRef.current,
      corrections: { ...(overrides.corrections || correctionRecordsRef.current) },
      reviewQueue: [...(overrides.reviewQueue || reviewQueueRef.current)],
      reviewedBeats: [...(overrides.reviewedBeats || reviewedBeatsRef.current)],
      remediationBeat: overrides.remediationBeat === undefined ? remediationBeatRef.current : overrides.remediationBeat,
      solved: [...nextSolved],
      drops: [...nextPicked],
      tally: { ...tallyRef.current }
    });
  }, [stopId]);

  useEffect(() => {
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") checkpoint();
    };
    const saveOnPageHide = () => checkpoint();
    document.addEventListener("visibilitychange", saveWhenHidden);
    window.addEventListener("pagehide", saveOnPageHide);
    return () => {
      if (!finishingRef.current) checkpoint();
      document.removeEventListener("visibilitychange", saveWhenHidden);
      window.removeEventListener("pagehide", saveOnPageHide);
    };
  }, [checkpoint]);

  const moveToEncounter = useCallback(encounter => {
    const next = firstUnsolvedEncounter(section, solvedRef.current);
    if (!encounter || encounter.id !== next?.id || activeRef.current || !guideDoneRef.current) return;
    selectedRef.current = encounter.id;
    setSelectedId(encounter.id);
    const limit = forwardLimitFor(section, { guideDone: true, solved: solvedRef.current });
    targetRef.current = clampTrailPosition(encounter, section, limit);
    if (isSoundEnabled) playWhoosh();
  }, [isSoundEnabled, section]);

  const cuePhysicalTask = useCallback((encounter, index = 0, stageIndex = fieldStageRef.current) => {
    if (!isSoundEnabled) return;
    const beat = encounter?.beats?.[index];
    const stage = physicalStage(buildPhysicalTask(section, encounter, beat, index), stageIndex);
    if (stage?.audioCue?.kind === "grapheme") sayGrapheme(stage.audioCue.value, true);
    else if (stage?.audioCue?.kind === "word") sayWord(stage.audioCue.value, true);
  }, [isSoundEnabled, section]);

  useEffect(() => {
    if (!section || !canvasRef.current) return undefined;
    sceneLoadStartedAtRef.current = Date.now();
    const canvas = canvasRef.current;
    sceneGenerationRef.current += 1;
    canvas.dataset.sceneGeneration = String(sceneGenerationRef.current);
    const quality = qualityTier?.id ? qualityTier : detectQuestQuality(state.settings);
    const scene = new THREE.Scene();
    const lightMood = {
      ...(section.lighting || { glow: 0.5, warmth: 0.3 }),
      ...(SEEDWAKE_LIGHT_MOODS[stopId] || {})
    };
    const skyFallback = new THREE.Color(theme.sky);
    scene.background = skyFallback;
    scene.fog = new THREE.Fog(theme.fog, 29 + lightMood.warmth * 4, 88 + lightMood.glow * 20);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 170);
    camera.position.set(initialPosition.x, (initialPosition.y || 0) + 4.7, initialPosition.z + 7.4);
    let renderPipeline;
    try {
      renderPipeline = new QuestRenderPipeline({
        canvas,
        scene,
        camera,
        quality,
        theme,
        lightMood,
        initialPosition: {
          x: initialPosition.x,
          y: initialPosition.y,
          z: initialPosition.z
        },
        worldLight: rewardBonuses.worldLight
      });
    } catch {
      queueMicrotask(() => {
        setSceneError(true);
        onSceneErrorRef.current?.();
      });
      return undefined;
    }
    const renderQuality = renderPipeline.quality;
    const maxAnisotropy = renderPipeline.maxAnisotropy;
    const landscape = buildLandscape(scene, section, theme, renderQuality, maxAnisotropy);
    const atmosphere = buildQuestAtmosphere(scene, section, theme, renderQuality);
    const characters = buildTrailCharacters(scene, section, theme, state.creature);
    const { sun, sunOffset } = renderPipeline.lighting;

    const viewport = { width: 1, height: 1 };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      viewport.width = Math.max(1, rect.width);
      viewport.height = Math.max(1, rect.height);
      renderPipeline.resize(viewport.width, viewport.height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const keys = new Set();
    let frame = 0;
    let readySent = false;
    let firstFrameRendered = false;
    // The authored fallback is a complete playable frame. Reveal it on the
    // first render, then stream heavier glTF upgrades without holding a child
    // on a loading screen while models parse or shaders compile.
    let visualAssetsSettled = true;
    let assetsDisposed = false;
    const deferredAssetTimers = new Set();
    let importedNature = null;
    let authoredChapterKit = null;
    let previous = performance.now();
    let lastRenderedFrame = -Infinity;
    let ambientNow = performance.now();
    // Scenery currently ghosted out of the child's sightline — see updateSightline.
    const sightlineFaded = new Set();
    const sightline = createSightlineState();
    refreshSightlineOccluders(scene, sightline);
    let wasMoving = false;
    let lastAutosave = performance.now();
    let lastPercent = Math.round(routeProgressAt(section.route, playerRef.current) * 100);
    let gateAmount = sectionGateIsOpen(section.encounters, solvedRef.current) ? 1 : 0;
    let locomotionState = createQuestLocomotionState(
      routeDirectionAt(section.route, routeProgressAt(section.route, playerRef.current)).heading
    );
    let frameBudget = createQuestFrameBudgetState(renderQuality.id);
    let contextFailed = false;
    const sendRuntimeSignal = signal => {
      if (!signal || !interactiveRef.current) return;
      onRuntimeSignalRef.current?.({
        ...signal,
        stopId,
        at: new Date().toISOString()
      });
    };
    const handleContextLost = event => {
      event.preventDefault();
      if (contextFailed || assetsDisposed) return;
      contextFailed = true;
      checkpoint();
      sendRuntimeSignal({
        type: "context-lost",
        fromTier: renderQuality.id,
        toTier: "2d"
      });
      setSceneError(true);
    };
    const handleContextRestored = () => {
      sendRuntimeSignal({
        type: "context-restored",
        tierId: renderQuality.id
      });
    };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);
    const skyTexture = new THREE.TextureLoader().load(
      `/images/quest/${section.world}/sky.webp`,
      texture => {
        if (assetsDisposed) {
          texture.dispose();
          return;
        }
        scene.background = texture;
      },
      undefined,
      () => {
        if (!assetsDisposed) scene.background = skyFallback;
      }
    );
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.minFilter = THREE.LinearMipmapLinearFilter;
    skyTexture.magFilter = THREE.LinearFilter;
    skyTexture.userData.questOwned = true;
    const lookTarget = new THREE.Vector3(
      playerRef.current.x,
      (playerRef.current.y || 0) + 1.02,
      playerRef.current.z - 0.18
    );
    const initialRouteDirection = routeDirectionAt(section.route, routeProgressAt(section.route, playerRef.current));
    const trailCameraDirection = new THREE.Vector3(initialRouteDirection.x, 0, initialRouteDirection.z).normalize();
    const desiredTrailDirection = trailCameraDirection.clone();
    const desiredSunPosition = new THREE.Vector3();
    const desiredSunTarget = new THREE.Vector3();
    let encounterCameraState = null;
    const cachedPhysicalTask = () => {
      const currentActive = activeRef.current;
      const currentBeatIndex = beatIndexRef.current;
      const taskCacheKey = currentActive
        ? `${currentActive.id}:${currentBeatIndex}`
        : null;
      if (taskCacheKey !== frameTaskCacheRef.current.key) {
        frameTaskCacheRef.current = {
          key: taskCacheKey,
          task: currentActive
            ? buildPhysicalTask(section, currentActive, currentActive.beats?.[currentBeatIndex], currentBeatIndex)
            : null
        };
      }
      return frameTaskCacheRef.current.task;
    };
    camera.lookAt(lookTarget);

    const revealScene = () => {
      if (readySent || assetsDisposed || !firstFrameRendered || !visualAssetsSettled) return;
      readySent = true;
      setSceneReady(true);
      sendRuntimeSignal({
        type: "scene-ready",
        tierId: renderQuality.id,
        loadMs: Date.now() - sceneLoadStartedAtRef.current
      });
      onSceneReadyRef.current?.(section);
    };

    const deferAssetLoad = (factory, delay) => new Promise(resolve => {
      const timer = window.setTimeout(() => {
        deferredAssetTimers.delete(timer);
        if (assetsDisposed) {
          resolve(undefined);
          return;
        }
        Promise.resolve()
          .then(factory)
          .then(resolve, () => resolve(undefined));
      }, delay);
      deferredAssetTimers.add(timer);
    });

    const natureLoad = lightweightCeremonyMount
      ? Promise.resolve(undefined)
      : deferAssetLoad(
        () => createImportedNature(section, theme, renderQuality, { maxAnisotropy }),
        680
      )
      .then(nextNature => {
        if (!nextNature) return;
        if (assetsDisposed) {
          disposeAssetObject(nextNature);
          return;
        }
        importedNature = nextNature;
        scene.add(importedNature);
        if (importedNature.userData.replacesFallbackTrees && landscape.fallbackTrees) {
          scene.remove(landscape.fallbackTrees);
          disposeAssetObject(landscape.fallbackTrees);
          landscape.fallbackTrees = null;
        }
        refreshSightlineOccluders(scene, sightline);
      })
      .catch(() => undefined);

    const chapterKitLoad = lightweightCeremonyMount
      ? Promise.resolve(undefined)
      : deferAssetLoad(
        () => createAuthoredChapterKit(section, theme, renderQuality, { maxAnisotropy }),
        220
      )
      .then(nextKit => {
        if (!nextKit) return;
        if (assetsDisposed) {
          disposeAssetObject(nextKit);
          return;
        }
        authoredChapterKit = nextKit;
        scene.add(authoredChapterKit);
        if (landscape.proceduralScenery) landscape.proceduralScenery.visible = false;
        refreshSightlineOccluders(scene, sightline);
      })
      .catch(() => undefined);

    const riggedCastLoad = (lightweightCeremonyMount
      ? Promise.resolve(undefined)
      : deferAssetLoad(() => createRiggedTrailCharacters(section, {
        includePlayer: false,
        maxAnisotropy,
        compact: viewport.width < 640
      }), 90)).then(nextCast => {
      if (!nextCast) return;
      if (assetsDisposed) {
        if (nextCast.guide) disposeAssetObject(nextCast.guide);
        for (const resident of nextCast.residents.values()) disposeAssetObject(resident);
        return;
      }
      if (nextCast.guide) {
        const previousGuide = characters.guide;
        nextCast.guide.position.copy(previousGuide.position);
        nextCast.guide.userData.groundY = previousGuide.userData.groundY || 0;
        scene.remove(previousGuide);
        disposeAssetObject(previousGuide);
        characters.guide = nextCast.guide;
        scene.add(characters.guide);
      }
      for (const [encounterId, nextResident] of nextCast.residents) {
        const previousResident = characters.residents.get(encounterId);
        if (!previousResident) {
          disposeAssetObject(nextResident);
          continue;
        }
        nextResident.position.copy(previousResident.position);
        nextResident.userData.groundY = previousResident.userData.groundY || 0;
        scene.remove(previousResident);
        disposeAssetObject(previousResident);
        characters.residents.set(encounterId, nextResident);
        scene.add(nextResident);
      }
      refreshSightlineOccluders(scene, sightline);
    }).catch(() => undefined);

    const fieldSpecs = [...landscape.fieldTasks.values()].flatMap(task => (
      [...task.items, ...task.completions].map(item => {
        const spec = item.userData.fieldSpec;
        return {
          ...spec,
          tint: spec.shape === "cake" || spec.shape?.includes("lantern") || spec.colour ? taskColour(spec, theme) : null
        };
      })
    ));
    const fieldAvatarLoad = lightweightCeremonyMount
      ? Promise.resolve(undefined)
      : deferAssetLoad(
        () => createImportedFieldAvatars(fieldSpecs, { maxAnisotropy }),
        420
      )
      .then(avatars => {
        if (!avatars) return;
        if (assetsDisposed) {
          for (const avatar of avatars.values()) disposeAssetObject(avatar);
          return;
        }
        attachImportedFieldAvatars(landscape.fieldTasks, avatars);
        refreshSightlineOccluders(scene, sightline);
      })
      .catch(() => undefined);
    const letterTokenLoad = Promise.all([
      fieldAvatarLoad,
      lightweightCeremonyMount ? Promise.resolve(undefined) : deferAssetLoad(() => loadQuestTokenFont(), 540)
    ])
      .then(([, font]) => {
        if (assetsDisposed || !font) return;
        attachBeveledLetterTokens(landscape.fieldTasks, font);
      })
      .catch(() => undefined);

    Promise.allSettled([natureLoad, letterTokenLoad, chapterKitLoad, riggedCastLoad]);

    const currentLimit = () => {
      const baseLimit = forwardLimitFor(section, {
        guideDone: guideDoneRef.current,
        solved: solvedRef.current
      });
      const current = activeRef.current;
      const currentBeat = current?.beats?.[beatIndexRef.current];
      const task = current ? buildPhysicalTask(section, current, currentBeat, beatIndexRef.current) : null;
      return physicalTaskForwardLimit(
        section,
        current,
        task,
        baseLimit,
        rewardBonuses.interactionRadius
      );
    };

    const sliceDebug = import.meta.env.DEV ? {
      snapshot: null,
      motion: null,
      journey: null,
      choose(outcome = "correct") {
        const current = activeRef.current;
        const task = current
          ? landscape.fieldTasks.get(physicalTaskKey(current, beatIndexRef.current))
          : null;
        const choice = task?.items.find(item => (
          item.userData.fieldChoice?.stage === fieldStageRef.current
          && Boolean(item.userData.fieldChoice?.correct) === (outcome === "correct")
        ))?.userData.fieldChoice;
        return Boolean(choice && fieldTaskSelectRef.current?.(choice));
      },
      loseContext() {
        handleContextLost({ preventDefault() {} });
        return true;
      }
    } : null;
    if (sliceDebug && interactiveRef.current) window.__questSliceDebug = sliceDebug;

    const visibleThroughParents = object => {
      let current = object;
      while (current) {
        if (!current.visible) return false;
        current = current.parent;
      }
      return true;
    };
    const belongsTo = (object, root) => {
      let current = object;
      while (current) {
        if (current === root) return true;
        current = current.parent;
      }
      return false;
    };
    const boxScreenRect = box => {
      const corners = [];
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z).project(camera));
        }
      }
      const xs = corners.map(point => (point.x * 0.5 + 0.5) * viewport.width);
      const ys = corners.map(point => (-point.y * 0.5 + 0.5) * viewport.height);
      return {
        left: Math.min(...xs),
        top: Math.min(...ys),
        right: Math.max(...xs),
        bottom: Math.max(...ys)
      };
    };
    const updateSliceDebug = (task, cameraTarget) => {
      if (!sliceDebug || !task) return;
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      const safeArea = sliceSafeArea(viewport.width, viewport.height);
      const stageItems = task.items.filter(item => (
        item.visible && item.userData.fieldChoice?.stage === fieldStageRef.current
      ));
      const previousCamera = sliceDebug.snapshot?.camera?.position;
      const cameraPosition = camera.position.toArray();
      const cameraDelta = previousCamera
        ? Math.hypot(...cameraPosition.map((value, index) => value - previousCamera[index]))
        : Infinity;
      const itemEvidence = stageItems.map(item => {
        const box = new THREE.Box3().setFromObject(item);
        const rect = boxScreenRect(box);
        const target = fieldChoiceSightlineTarget(item, new THREE.Vector3());
        const direction = target.clone().sub(camera.position);
        const targetDistance = direction.length();
        raycaster.set(camera.position, direction.normalize());
        const firstHit = raycaster.intersectObjects(scene.children, true).find(hit => (
          hit.distance <= targetDistance + 0.3
          && visibleThroughParents(hit.object)
          && hit.object.isMesh
          && hit.object.name !== "field-label"
        ));
        return {
          id: item.userData.fieldChoice.id,
          value: item.userData.fieldChoice.value,
          rect,
          insideSafeArea: projectedRectInsideSafeArea(rect, safeArea),
          firstHit: firstHit?.object?.name || firstHit?.object?.type || null,
          rayClear: Boolean(firstHit && belongsTo(firstHit.object, item))
        };
      });
      sliceDebug.snapshot = {
        stopId,
        encounterId: activeRef.current?.id || null,
        encounterKind: activeRef.current?.kind || null,
        beatIndex: beatIndexRef.current,
        stageIndex: fieldStageRef.current,
        safeArea,
        hudNodes: document.querySelectorAll("[data-quest-hud-node]").length,
        camera: {
          position: cameraPosition,
          delta: cameraDelta,
          settled: cameraTarget ? camera.position.distanceTo(cameraTarget) < 0.02 : false
        },
        items: itemEvidence
      };
    };

    const onPointer = event => {
      if (!interactiveRef.current || phaseRef.current !== "trail") return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const currentActive = activeRef.current;
      if (currentActive) {
        const task = landscape.fieldTasks.get(physicalTaskKey(currentActive, beatIndexRef.current));
        if (task?.group.visible && !fieldChoiceLockRef.current) {
          const stageItems = task.items.filter(item => (
            item.visible && item.userData.fieldChoice?.stage === fieldStageRef.current
          ));
          const hit = raycaster.intersectObjects(stageItems, true)[0];
          let node = hit?.object || null;
          while (node && !node.userData.fieldChoice) node = node.parent;
          const intent = resolveQuestPointerIntent({
            encounterActive: true,
            fieldChoice: node?.userData.fieldChoice || null,
            mechanic: task.mechanic
          });
          if (intent.type === "activate") {
            fieldTaskSelectRef.current?.(intent.fieldChoice);
            return;
          }
          if (intent.type === "approach") {
            const destination = stageItems.find(item => belongsTo(hit?.object, item));
            if (!destination) return;
            selectedRef.current = intent.fieldChoice.id;
            setSelectedId(intent.fieldChoice.id);
            targetRef.current = clampTrailPosition({
              x: destination.userData.baseX,
              y: destination.userData.baseY || 0,
              z: destination.userData.baseZ
            }, section, currentLimit());
            return;
          }
        }
        return;
      }

      const hit = raycaster.intersectObject(landscape.ground, false)[0];
      if (!hit) return;
      selectedRef.current = null;
      setSelectedId(null);
      targetRef.current = clampTrailPosition(hit.point, section, currentLimit());
    };

    const onKeyDown = event => {
      if (!interactiveRef.current) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) {
        keys.add(event.key.toLowerCase());
        event.preventDefault();
      }
    };
    const onKeyUp = event => keys.delete(event.key.toLowerCase());
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const beginEncounter = encounter => {
      const firstTask = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
      activeRef.current = encounter;
      selectedRef.current = null;
      targetRef.current = { ...playerRef.current };
      locomotionState = createQuestLocomotionState(characters.player.userData.facing || locomotionState.heading);
      beatIndexRef.current = 0;
      fieldStageRef.current = 0;
      setFieldChoiceLock(false);
      fieldCollisionArmedRef.current = true;
      reviewQueueRef.current = [];
      reviewedBeatsRef.current = [];
      remediationBeatRef.current = null;
      verbStateRef.current = firstTask
        ? createSeedwakeVerbState(firstTask.mechanic, physicalTaskAnswers(firstTask))
        : null;
      verbTaskKeyRef.current = firstTask?.key || null;
      setCorrectionFor(encounter, 0, 0);
      lastCorrectRef.current = encounter.kind === "story-rock";
      setSelectedId(null);
      setBeatIndex(0);
      setFieldStage(0);
      setPhonemeFillCount(0);
      setInteractionFeedback(null);
      setActive(encounter);
      cuePhysicalTask(encounter, 0, 0);
      checkpoint({ active: encounter, beatIndex: 0, fieldStage: 0, phase: "trail" });
    };

    const animate = now => {
      if (contextFailed || assetsDisposed) return;
      try {
        animateFrame(now);
      } catch (error) {
        contextFailed = true;
        checkpoint();
        setSceneError(true);
        onSceneErrorRef.current?.(error instanceof Error ? error.message : String(error));
      }
    };

    const animateFrame = now => {
      if (sliceDebug && interactiveRef.current && window.__questSliceDebug !== sliceDebug) {
        window.__questSliceDebug = sliceDebug;
      }
      const minimumFrameInterval = interactiveRef.current
        ? renderQuality.id === "low" ? 1000 / 30 : 0
        : 50;
      if (now - lastRenderedFrame < minimumFrameInterval) {
        frame = requestAnimationFrame(animate);
        return;
      }
      lastRenderedFrame = now;
      const renderedFrameMs = now - previous;
      const dt = Math.max(0, Math.min(0.045, renderedFrameMs / 1000));
      previous = now;
      if (interactiveRef.current && !contextFailed) {
        const emitted = sampleQuestFrameBudget(frameBudget, renderedFrameMs);
        if (emitted) {
          frameBudget = emitted.state;
          checkpoint();
          sendRuntimeSignal(emitted.signal);
        }
      }
      // Decorative motion runs on its own clock so reduced-motion can freeze
      // it without touching gameplay. motionScale 1 = full ambience; 0 = the
      // birds, petals, bobbing drops and flame flicker hold still while the
      // child, the camera and every reveal keep working on real time.
      const motionScale = Number.isFinite(renderQuality.motionScale) ? renderQuality.motionScale : 1;
      ambientNow += dt * 1000 * motionScale;
      if (!interactiveRef.current && !ceremonyRef.current) {
        if (!firstFrameRendered && journeyStatusRef.current === "preloading") {
          renderPipeline.renderBackdrop();
          firstFrameRendered = true;
        }
        revealScene();
        frame = requestAnimationFrame(animate);
        return;
      }
      const player = playerRef.current;
      let moving = false;
      // Memoized per (encounter, beat): this used to rebuild the FULL
      // task object EVERY RENDERED FRAME of the 3D loop - the pixel tier
      // already cached the identical computation.
      const currentPhysicalTask = cachedPhysicalTask();
      const physicalTaskActive = Boolean(currentPhysicalTask) && !fieldChoiceLockRef.current;
      const mechanicProfile = questMechanicProfile(
        currentPhysicalTask?.chapterAuthored ? currentPhysicalTask.mechanic : null
      );

      if (interactiveRef.current && phaseRef.current === "trail" && (!activeRef.current || physicalTaskActive) && !finishingRef.current) {
        let inputX = 0;
        let inputForward = 0;
        if (keys.has("arrowleft") || keys.has("a")) inputX -= 1;
        if (keys.has("arrowright") || keys.has("d")) inputX += 1;
        if (keys.has("arrowup") || keys.has("w")) inputForward += 1;
        if (keys.has("arrowdown") || keys.has("s")) inputForward -= 1;
        const routeControl = routeDirectionAt(section.route, routeProgressAt(section.route, player));
        const routeMovement = routeMovementVector(routeControl, {
          lateral: inputX,
          forward: inputForward
        });
        const dx = routeMovement.x;
        const dz = routeMovement.z;

        if (dx || dz) {
          const length = Math.hypot(dx, dz);
          locomotionState = stepQuestLocomotion(locomotionState, {
            desiredX: dx / length,
            desiredZ: dz / length,
            dt,
            maxSpeed: MOVE_SPEED * mechanicProfile.speed
          });
          const next = clampTrailPosition({
            x: player.x + locomotionState.x * dt,
            z: player.z + locomotionState.z * dt
          }, section, currentLimit());
          Object.assign(player, next);
          targetRef.current = { ...player };
          selectedRef.current = null;
          moving = true;
        } else {
          const playerProgress = routeProgressAt(section.route, player);
          const targetProgress = Number.isFinite(targetRef.current.routeProgress)
            ? targetRef.current.routeProgress
            : routeProgressAt(section.route, targetRef.current);
          const progressGap = targetProgress - playerProgress;
          const routeWaypoint = Math.abs(progressGap) > 0.006
            ? routePointAt(
              section.route,
              playerProgress + Math.sign(progressGap) * Math.min(
                Math.abs(progressGap),
                (MOVE_SPEED * dt * 1.35) / section.route.totalLength
              )
            )
            : targetRef.current;
          const tx = routeWaypoint.x - player.x;
          const tz = routeWaypoint.z - player.z;
          const distance = Math.hypot(tx, tz);
          if (distance > 0.04) {
            locomotionState = stepQuestLocomotion(locomotionState, {
              desiredX: tx / distance,
              desiredZ: tz / distance,
              dt,
                maxSpeed: MOVE_SPEED * mechanicProfile.speed
            });
            const step = Math.min(distance, locomotionState.speed * dt);
            const next = clampTrailPosition({
              x: player.x + (tx / distance) * step,
              z: player.z + (tz / distance) * step
            }, section, currentLimit());
            Object.assign(player, next);
            moving = true;
          } else {
            locomotionState = stepQuestLocomotion(locomotionState, {
              dt,
              maxSpeed: MOVE_SPEED * mechanicProfile.speed
            });
            if (!locomotionState.settled) {
              const next = clampTrailPosition({
                x: player.x + locomotionState.x * dt,
                z: player.z + locomotionState.z * dt
              }, section, currentLimit());
              Object.assign(player, next);
              targetRef.current = { ...player };
              moving = true;
            }
          }
        }

        if (!guideDoneRef.current && Math.hypot(section.guide.x - player.x, section.guide.z - player.z) <= ENCOUNTER_REACH) {
          targetRef.current = { ...player };
          phaseRef.current = "teach";
          setPhase("teach");
          moving = false;
          checkpoint({ phase: "teach" });
        } else if (guideDoneRef.current && !activeRef.current) {
          const nextEncounter = firstUnsolvedEncounter(section, solvedRef.current);
          if (nextEncounter && Math.hypot(nextEncounter.x - player.x, nextEncounter.z - player.z) <= ENCOUNTER_REACH) {
            beginEncounter(nextEncounter);
            moving = false;
          }
        }

        const activeTask = activeRef.current
          ? landscape.fieldTasks.get(physicalTaskKey(activeRef.current, beatIndexRef.current))
          : null;
        if (activeTask?.group.visible && !fieldChoiceLockRef.current) {
          const collision = fieldCollisionStep({
            armed: fieldCollisionArmedRef.current,
            player,
            stage: fieldStageRef.current,
            interactionRadius: rewardBonuses.interactionRadius * mechanicProfile.collision,
            items: activeTask.items.map(item => ({
              visible: item.visible,
              x: item.position.x,
              z: item.position.z,
              choice: item.userData.fieldChoice
            }))
          });
          fieldCollisionArmedRef.current = collision.armed;
          if (collision.choice) {
            fieldTaskSelectRef.current?.(collision.choice);
            moving = false;
          }
        }

        const foundDrop = section.drops.find(drop => (
          !pickedRef.current.has(drop.id)
          && Math.hypot(drop.x - player.x, drop.z - player.z) < rewardBonuses.collectionRadius
        ));
        if (foundDrop) {
          const next = new Set([...pickedRef.current, foundDrop.id]);
          pickedRef.current = next;
          setPicked(next);
          const collectible = seedwakeStopSpec(stopId)?.collectible;
          setPickupNotice(foundDrop.cache
            ? `Route cache opened · +${SPARKS_PER_DROP} Sparks`
            : `${collectible?.label || "Trail find"} · +${SPARKS_PER_DROP} Sparks`);
          if (isSoundEnabled) playStarChime();
          checkpoint({ picked: next });
        }

        const allSolved = sectionGateIsOpen(section.encounters, solvedRef.current);
        const gateHandoffProgress = Math.min(section.exit.progress, section.gate.progress + 0.042);
        if (allSolved && routeProgressAt(section.route, player) >= gateHandoffProgress) {
          finishingRef.current = true;
          targetRef.current = { ...player };
          // Finishing records the complete tally and clears the old checkpoint
          // in QuestRoot. Queuing one last checkpoint here races that commit and
          // can remount the completed trail (or return to the Den) as the next
          // trail is being created.
          const score = tallyRef.current;
          const stars = starRubric({ correct: score.correct, total: score.total, mistakes: score.mistakes, deaths: 0 });
          onFinishRef.current?.(stars, { ...score, drops: pickedRef.current.size });
        }
      }

      if (moving !== wasMoving) {
        wasMoving = moving;
        setTrailMood(moving ? "walk" : "idle");
      }
      if (sliceDebug) {
        sliceDebug.motion = {
          speed: locomotionState.speed,
          bank: locomotionState.bank,
          heading: locomotionState.heading,
          settled: locomotionState.settled,
          moving
        };
      }

      if (moving && now - lastAutosave >= AUTOSAVE_MS) {
        lastAutosave = now;
        checkpoint();
      }

      const playerProgress = routeProgressAt(section.route, player);
      desiredSunPosition.set(player.x + sunOffset.x, (player.y || 0) + sunOffset.y, player.z + sunOffset.z);
      desiredSunTarget.set(player.x, player.y || 0, player.z);
      const lightFollow = 1 - Math.pow(0.025, dt);
      sun.position.lerp(desiredSunPosition, lightFollow);
      sun.target.position.lerp(desiredSunTarget, lightFollow);
      sun.target.updateMatrixWorld();
      const percent = Math.round(playerProgress * 100);
      if (percent !== lastPercent && percent % 2 === 0) {
        lastPercent = percent;
        setRoutePercent(percent);
      }

      const allSolved = sectionGateIsOpen(section.encounters, solvedRef.current);
      if (sliceDebug) {
        sliceDebug.journey = {
          stopId,
          phase: phaseRef.current,
          guideDone: guideDoneRef.current,
          meetIndex: meetIndexRef.current,
          activeId: activeRef.current?.id || null,
          beatIndex: beatIndexRef.current,
          stageIndex: fieldStageRef.current,
          inputLocked: fieldChoiceLockRef.current,
          lastCorrect: lastCorrectRef.current,
          solvedCount: solvedRef.current.size,
          encounterCount: section.encounters.length,
          gateOpen: allSolved,
          playerProgress
        };
      }
      gateAmount = THREE.MathUtils.lerp(gateAmount, allSolved ? 1 : 0, 1 - Math.pow(0.003, dt));
      landscape.gate.left.rotation.y = -gateAmount * 1.33;
      landscape.gate.right.rotation.y = gateAmount * 1.33;

      for (const item of landscape.ambience) updateAmbientLife(item, ambientNow);
      for (const repair of landscape.repairs) {
        updateRepairMoment(repair, repair.restored || solvedRef.current.has(repair.id), dt, ambientNow, rewardBonuses.repairAura);
      }
      updateActEvent(landscape.actEvent, ambientNow, gateAmount);

      const rawRouteDirection = routeDirectionAt(section.route, playerProgress);
      desiredTrailDirection.set(rawRouteDirection.x, 0, rawRouteDirection.z).normalize();
      trailCameraDirection.lerp(desiredTrailDirection, 1 - Math.pow(0.035, dt)).normalize();
      const routeDirection = {
        x: trailCameraDirection.x,
        y: rawRouteDirection.y,
        z: trailCameraDirection.z,
        heading: Math.atan2(trailCameraDirection.x, trailCameraDirection.z)
      };
      let focus = new THREE.Vector3(
        player.x + routeDirection.x * 1.25,
        (player.y || 0) + 1.02,
        player.z + routeDirection.z * 1.25
      );
      let desiredCamera = new THREE.Vector3(
        player.x - routeDirection.x * 7.4,
        (player.y || 0) + 4.7,
        player.z - routeDirection.z * 7.4
      );
      let desiredFov = 50;
      const currentActive = activeRef.current;
      if (phaseRef.current === "teach") {
        encounterCameraState = null;
        const direction = routeDirectionAt(section.route, section.guide.progress);
        focus = new THREE.Vector3(section.guide.x, (section.guide.y || 0) + 1.28, section.guide.z);
        desiredCamera = new THREE.Vector3(
          section.guide.x - direction.x * 7.7 - direction.z * 1.8,
          (section.guide.y || 0) + 5,
          section.guide.z - direction.z * 7.7 + direction.x * 1.8
        );
      } else if (currentActive) {
        const direction = routeDirectionAt(section.route, currentActive.progress);
        const liveTask = landscape.fieldTasks.get(physicalTaskKey(currentActive, beatIndexRef.current));
        const cameraItems = liveTask?.items
          .filter(item => item.userData.fieldChoice?.stage === fieldStageRef.current)
          .map(item => ({
            x: item.userData.baseX,
            y: item.userData.baseY,
            z: item.userData.baseZ
          })) || [currentActive];
        const residentPoint = physicalTaskResidentPoint(section, currentActive);
        cameraItems.push(
          { x: residentPoint.x, y: residentPoint.y || 0, z: residentPoint.z },
          { x: player.x, y: player.y || 0, z: player.z }
        );
        const cameraKey = `${currentActive.id}:${beatIndexRef.current}:${fieldStageRef.current}:${viewport.width}x${viewport.height}`;
        if (encounterCameraState?.key !== cameraKey) {
          const basePose = encounterCameraPose(cameraItems, direction, viewport);
          const profile = questMechanicProfile(liveTask?.chapterAuthored ? liveTask.mechanic : null);
          const baseFocus = new THREE.Vector3(basePose.focus.x, basePose.focus.y, basePose.focus.z);
          const basePosition = new THREE.Vector3(basePose.position.x, basePose.position.y, basePose.position.z);
          const offset = basePosition.sub(baseFocus).multiplyScalar(profile.distance);
          const right = new THREE.Vector3(direction.z, 0, -direction.x);
          const profiledPosition = baseFocus.clone()
            .add(offset)
            .addScaledVector(right, profile.side);
          profiledPosition.y += profile.elevation;
          encounterCameraState = {
            key: cameraKey,
            focus: basePose.focus,
            position: {
              x: profiledPosition.x,
              y: profiledPosition.y,
              z: profiledPosition.z
            },
            fov: profile.fov
          };
        }
        focus = new THREE.Vector3(
          encounterCameraState.focus.x,
          encounterCameraState.focus.y,
          encounterCameraState.focus.z
        );
        desiredCamera = new THREE.Vector3(
          encounterCameraState.position.x,
          encounterCameraState.position.y,
          encounterCameraState.position.z
        );
        desiredFov = encounterCameraState.fov;
      } else if (allSolved && playerProgress > section.gate.progress - 0.15) {
        encounterCameraState = null;
        if (section.isChapterFinale) {
          const finalePoint = routePointAt(section.route, 0.865);
          const finaleDirection = routeDirectionAt(section.route, 0.865);
          const compactFinaleView = viewport.width < 640;
          const finaleDistance = compactFinaleView ? 18.5 : 9.2;
          const finaleSide = compactFinaleView ? 1.35 : 1.8;
          focus = new THREE.Vector3(
            finalePoint.x,
            (finalePoint.y || 0) + (compactFinaleView ? 2.55 : 2.15),
            finalePoint.z
          );
          desiredFov = 50;
          desiredCamera = new THREE.Vector3(
            finalePoint.x - finaleDirection.x * finaleDistance - finaleDirection.z * finaleSide,
            (finalePoint.y || 0) + (compactFinaleView ? 8 : 5.25),
            finalePoint.z - finaleDirection.z * finaleDistance + finaleDirection.x * finaleSide
          );
        } else {
          focus = new THREE.Vector3(section.gate.x, (section.gate.y || 0) + 1.45, section.gate.z);
          desiredCamera = new THREE.Vector3(
            player.x - routeDirection.x * 11,
            (player.y || 0) + 7.2,
            player.z - routeDirection.z * 11
          );
        }
      } else {
        encounterCameraState = null;
        const nextFocus = !guideDoneRef.current
          ? section.guide
          : firstUnsolvedEncounter(section, solvedRef.current);
        if (nextFocus && Math.hypot(player.x - nextFocus.x, player.z - nextFocus.z) < rewardBonuses.routeFocusDistance) {
          focus = new THREE.Vector3(
            player.x * 0.68 + nextFocus.x * 0.32,
            (player.y || 0) * 0.68 + (nextFocus.y || 0) * 0.32 + 0.95,
            player.z * 0.72 + nextFocus.z * 0.28
          );
          desiredCamera = new THREE.Vector3(
            player.x - routeDirection.x * 7.8,
            (player.y || 0) + 4.8,
            player.z - routeDirection.z * 7.8
          );
        }
      }
      if (currentActive && !firstFrameRendered) {
        camera.position.copy(desiredCamera);
        lookTarget.copy(focus);
      } else {
        camera.position.lerp(desiredCamera, 1 - Math.pow(0.028, dt));
        lookTarget.lerp(focus, 1 - Math.pow(0.018, dt));
      }
      if (currentActive && camera.position.distanceTo(desiredCamera) < 0.012) camera.position.copy(desiredCamera);
      if (currentActive && lookTarget.distanceTo(focus) < 0.008) lookTarget.copy(focus);
      const nextFov = THREE.MathUtils.lerp(camera.fov, desiredFov, 1 - Math.pow(0.028, dt));
      if (Math.abs(nextFov - camera.fov) > 0.001) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(lookTarget);
      const liveEncounter = activeRef.current;
      // A collision can advance the beat earlier in this frame. Re-read through
      // the same cache so the new beat builds once while an unchanged beat is
      // reused by movement, field rendering, camera and character animation.
      const liveTask = cachedPhysicalTask();
      const liveStage = physicalStage(liveTask, fieldStageRef.current);
      const liveInteraction = interactionActionRef.current?.until > now
        ? interactionActionRef.current
        : liveStage?.playerAction === "carry"
          ? { kind: "carry", until: now + 1000, duration: 1000 }
          : null;
      updateFieldTasks(
        landscape.fieldTasks,
        liveEncounter,
        beatIndexRef.current,
        fieldStageRef.current,
        correctionPresentation(liveStage, correctionRef.current),
        now,
        camera,
        dt,
        player,
        liveInteraction,
        ambientNow
      );
      const debugTask = liveEncounter
        ? landscape.fieldTasks.get(physicalTaskKey(liveEncounter, beatIndexRef.current))
        : null;
      // Clear the sightline BEFORE the debug snapshot measures it, so rayClear
      // reports what the child will actually see this frame.
      updateSightline(
        camera,
        debugTask,
        liveEncounter,
        beatIndexRef.current,
        fieldStageRef.current,
        sightlineFaded,
        dt,
        sightline
      );
      updateSliceDebug(debugTask, desiredCamera);
      const accentTask = liveEncounter
        ? landscape.fieldTasks.get(physicalTaskKey(liveEncounter, beatIndexRef.current))
        : null;
      renderPipeline.updateTargetLights(accentTask?.items || []);
      updateTrailCharacters(characters, section, {
        player,
        target: targetRef.current,
        moving,
        guideDone: guideDoneRef.current,
        active: activeRef.current,
        activeTask: liveTask,
        solved: solvedRef.current,
        nextEncounter: firstUnsolvedEncounter(section, solvedRef.current),
        mood: ceremonyRef.current ? "cheer" : moodRef.current,
        now,
        dt,
        activity: liveInteraction,
        bank: locomotionState.bank,
        reaction: reactionRef.current?.until > now ? reactionRef.current : null
      });
      updateImportedNature(importedNature, now);
      updateAuthoredChapterKit(authoredChapterKit, dt);
      updateQuestAtmosphere(atmosphere, now, dt, ceremonyRef.current);
      const clearCameraCorridor = playerProgress > (section.isChapterFinale ? 0.62 : 0.88);
      const clearEncounterStage = Boolean(liveEncounter);
      if (importedNature) {
        importedNature.visible = !clearCameraCorridor;
        for (const layer of importedNature.children) {
          layer.visible = !clearEncounterStage || !layer.name.startsWith("textured-tree-belt");
        }
      }
      if (landscape.fallbackTrees) landscape.fallbackTrees.visible = !clearCameraCorridor && !clearEncounterStage;
      if (authoredChapterKit) authoredChapterKit.visible = true;
      for (const asset of authoredChapterKit?.children || []) {
        asset.visible = !(clearEncounterStage && asset.userData.hideDuringEncounter);
      }
      if (landscape.proceduralScenery) {
        landscape.proceduralScenery.visible = !authoredChapterKit;
      }

      projectElement(guideRef.current, section.guide, camera, viewport, { lift: 1.65, scale: 0.72, anchor: "-20%" });
      for (const encounter of section.encounters) {
        projectElement(landmarkRefs.current.get(encounter.id), encounter, camera, viewport, { lift: 1.58, scale: 0.78, anchor: "-20%" });
      }
      for (const drop of section.drops) {
        projectElement(dropRefs.current.get(drop.id), drop, camera, viewport, {
          lift: 0.36,
          scale: drop.cache ? 0.62 : 0.48,
          anchor: "-50%",
          maxDistance: rewardBonuses.projectionDistance
        });
      }

      renderPipeline.render(dt);
      firstFrameRendered = true;
      revealScene();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      assetsDisposed = true;
      for (const timer of deferredAssetTimers) window.clearTimeout(timer);
      deferredAssetTimers.clear();
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("webglcontextlost", handleContextLost, false);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored, false);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (scene.background === skyTexture) scene.background = null;
      if (sliceDebug && window.__questSliceDebug === sliceDebug) delete window.__questSliceDebug;
      skyTexture.dispose();
      disposeQuestScene(scene);
      renderPipeline.destroy();
    };
  }, [
    section,
    stopId,
    theme,
    state.creature,
    initialPosition.x,
    initialPosition.y,
    initialPosition.z,
    isSoundEnabled,
    checkpoint,
    cuePhysicalTask,
    setCorrectionFor,
    setFieldChoiceLock,
    setTrailMood,
    rewardBonuses,
    qualityTier,
    state.settings,
    lightweightCeremonyMount
  ]);

  const answer = (correct, target, meta = {}) => {
    lastCorrectRef.current = correct;
    // FIRST ATTEMPT PER BEAT is what stars score. The correction ladder
    // (retry -> narrow -> teach) is the intended teaching path; counting
    // every rung as a fresh mistake punished the child for using it — a
    // ladder child landed at 1 star where a guesser's luck earned 3.
    const beatKey = `${activeRef.current?.id || "field"}:${beatIndexRef.current}`;
    if (!firstTallyRef.current.has(beatKey)) {
      firstTallyRef.current.set(beatKey, correct);
      tallyRef.current.total += 1;
      if (correct) tallyRef.current.correct += 1;
      else tallyRef.current.mistakes += 1;
    }
    const reaction = {
      outcome: correct ? "correct" : "wrong",
      clip: seedwakeResidentPerformance(stopId, correct ? "correct" : "wrong"),
      duration: correct ? 900 : 720,
      until: performance.now() + (correct ? 900 : 720)
    };
    reactionRef.current = reaction;
    setInteractionFeedback({
      kind: correct ? "success" : "retry",
      announcement: correct ? "Correct. The sound is in place." : "Try again. Listen for the sound.",
      duration: correct ? 1100 : 820
    });
    setTrailMood(correct ? "cheer" : "sad");
    if (target == null) return;
    for (const one of Array.isArray(target) ? target : [target]) {
      if (one) onAnswer?.(one, correct, activeRef.current?.kind || "trail", meta);
    }
  };

  const completeEncounter = current => {
    const nextSolved = new Set([...solvedRef.current, current.id]);
    solvedRef.current = nextSolved;
    activeRef.current = null;
    beatIndexRef.current = 0;
    fieldStageRef.current = 0;
    setFieldChoiceLock(false);
    reviewQueueRef.current = [];
    reviewedBeatsRef.current = [];
    remediationBeatRef.current = null;
    verbStateRef.current = null;
    verbTaskKeyRef.current = null;
    setSolved(nextSolved);
    setActive(null);
    setBeatIndex(0);
    setFieldStage(0);
    setPhonemeFillCount(0);
    setInteractionFeedback(null);
    setRemediationBeat(null);
    setCorrectionFor(null, 0, 0, { reset: true });
    setTrailMood("cheer");
    checkpoint({
      solved: nextSolved,
      active: null,
      beatIndex: 0,
      fieldStage: 0,
      phase: "trail",
      reviewQueue: [],
      reviewedBeats: [],
      remediationBeat: null
    });

    if (sectionGateIsOpen(section.encounters, nextSolved)) {
      setGateOpen(true);
      onPrepareNext?.(stopId);
      if (isSoundEnabled) playWhoosh();
    }
  };

  const beginDeferredReview = (current, reviewIndex) => {
    const prefix = `${current.id}:${reviewIndex}:`;
    correctionRecordsRef.current = Object.fromEntries(
      Object.entries(correctionRecordsRef.current).filter(([key]) => !key.startsWith(prefix))
    );
    remediationBeatRef.current = reviewIndex;
    beatIndexRef.current = reviewIndex;
    fieldStageRef.current = 0;
    setFieldChoiceLock(false);
    const reviewTask = buildPhysicalTask(section, current, current.beats[reviewIndex], reviewIndex);
    verbStateRef.current = reviewTask
      ? createSeedwakeVerbState(reviewTask.mechanic, physicalTaskAnswers(reviewTask))
      : null;
    verbTaskKeyRef.current = reviewTask?.key || null;
    lastCorrectRef.current = current.kind === "story-rock";
    setBeatIndex(reviewIndex);
    setFieldStage(0);
    setPhonemeFillCount(0);
    setRemediationBeat(reviewIndex);
    setRetryNonce(value => value + 1);
    setCorrectionFor(current, reviewIndex, 0, { reset: true });
    setTrailMood("teach");
    cuePhysicalTask(current, reviewIndex, 0);
    checkpoint({
      active: current,
      beatIndex: reviewIndex,
      fieldStage: 0,
      corrections: correctionRecordsRef.current,
      reviewQueue: reviewQueueRef.current,
      reviewedBeats: reviewedBeatsRef.current,
      remediationBeat: reviewIndex
    });
  };

  const nextBeat = () => {
    const current = activeRef.current;
    if (!current) return;
    // The final helper owns the physical gate. A miss gets another friendly try
    // at the same beat; there is no extra boss quiz and no permanent failure.
    if (current.atGate && !lastCorrectRef.current) {
      setFieldChoiceLock(false);
      setRetryNonce(value => value + 1);
      setTrailMood("idle");
      cuePhysicalTask(current, beatIndexRef.current, fieldStageRef.current);
      checkpoint({ active: current, beatIndex: beatIndexRef.current, fieldStage: fieldStageRef.current });
      return;
    }

    if (remediationBeatRef.current !== null) {
      reviewedBeatsRef.current = [...new Set([...reviewedBeatsRef.current, remediationBeatRef.current])];
      const nextReview = nextQueuedReview(reviewQueueRef.current, reviewedBeatsRef.current);
      if (nextReview !== null) beginDeferredReview(current, nextReview);
      else completeEncounter(current);
      return;
    }

    if (beatIndexRef.current + 1 < current.beats.length) {
      const nextIndex = beatIndexRef.current + 1;
      beatIndexRef.current = nextIndex;
      fieldStageRef.current = 0;
      setFieldChoiceLock(false);
      lastCorrectRef.current = current.kind === "story-rock";
      setBeatIndex(nextIndex);
      setFieldStage(0);
      setPhonemeFillCount(0);
      setCorrectionFor(current, nextIndex, 0);
      const followingTask = buildPhysicalTask(section, current, current.beats[nextIndex], nextIndex);
      verbStateRef.current = followingTask
        ? createSeedwakeVerbState(followingTask.mechanic, physicalTaskAnswers(followingTask))
        : null;
      verbTaskKeyRef.current = followingTask?.key || null;
      cuePhysicalTask(current, nextIndex, 0);
      checkpoint({ active: current, beatIndex: nextIndex, fieldStage: 0 });
      return;
    }

    const nextReview = nextQueuedReview(reviewQueueRef.current, reviewedBeatsRef.current);
    if (nextReview !== null) beginDeferredReview(current, nextReview);
    else completeEncounter(current);
  };

  useEffect(() => {
    fieldTaskSelectRef.current = choice => {
      if (!choice || fieldChoiceLockRef.current) return false;
      const current = activeRef.current;
      const beat = current?.beats?.[beatIndexRef.current];
      const task = buildPhysicalTask(section, current, beat, beatIndexRef.current);
      const stage = physicalStage(task, fieldStageRef.current);
      if (!stage || choice.stage !== fieldStageRef.current) return false;
      fieldCollisionArmedRef.current = false;
      targetRef.current = { ...playerRef.current };
      selectedRef.current = null;
      setSelectedId(null);
      setFieldChoiceLock(true);
      if (!verbStateRef.current || verbTaskKeyRef.current !== task.key) {
        verbStateRef.current = task.chapterAuthored
          ? restoreSeedwakeVerbState(
            task.mechanic,
            physicalTaskAnswers(task),
            task.stages,
            fieldStageRef.current
          )
          : null;
        verbTaskKeyRef.current = task.key;
      }
      const verbResult = applyQuestTaskInput({
        chapterAuthored: task.chapterAuthored,
        mechanic: task.mechanic,
        state: verbStateRef.current,
        input: {
          type: stage.playerAction,
          correct: Boolean(choice.correct),
          value: choice.value,
          stage: fieldStageRef.current,
          onBeat: task.mechanic !== "gate-chorus" || questRhythmPulse(performance.now()).open
        }
      });
      verbStateRef.current = verbResult.state;
      const right = Boolean(choice.correct && verbResult.accepted);
      const motorRetry = Boolean(choice.correct && verbResult.recordAttempt === false);
      const actionKind = stage.playerAction === "pick-up" ? "carry" : stage.playerAction || task.mechanic;
      interactionActionRef.current = {
        taskKey: task.key,
        choiceId: choice.id,
        stage: fieldStageRef.current,
        kind: actionKind,
        correct: right,
        duration: right ? 620 : 380,
        until: performance.now() + (right ? 620 : 380)
      };
      if (isSoundEnabled && !motorRetry) (right ? playCorrectChime : playSoftBuzz)();
      if (!right) {
        if (motorRetry) {
          setInteractionFeedback({
            kind: "rhythm",
            announcement: "Wait for the bright glow",
            duration: 560
          });
          scheduleAction(() => {
            setFieldChoiceLock(false);
            setTrailMood("idle");
          }, 420);
          return true;
        }
        const key = correctionKey(current, beatIndexRef.current, fieldStageRef.current);
        const preAttemptLevel = promptLevelForMode(correctionRecordsRef.current[key]?.mode);
        const nextCorrection = recordCorrectionMiss(correctionRecordsRef.current[key], choice.id);
        correctionRecordsRef.current = { ...correctionRecordsRef.current, [key]: nextCorrection };
        correctionRef.current = nextCorrection;
        setCorrection(nextCorrection);
        if (nextCorrection.misses >= 3 && remediationBeatRef.current === null) {
          reviewQueueRef.current = [...new Set([...reviewQueueRef.current, beatIndexRef.current])];
        }
        // The miss belongs to the sound THIS stage wanted, not to every
        // grapheme in the word — beat.target is an array for word beats, and
        // fanning a miss across all of them punished sounds the child never
        // even got to attempt.
        answer(false, stage.items?.find(item => item.correct)?.value || beat.target, {
          promptLevel: preAttemptLevel,
          recordsMastery: fieldStageRecordsMastery(stage, isSoundEnabled)
        });
        checkpoint({
          active: current,
          corrections: correctionRecordsRef.current,
          reviewQueue: reviewQueueRef.current,
          reviewedBeats: reviewedBeatsRef.current,
          remediationBeat: remediationBeatRef.current
        });
        if (nextCorrection.mode === "teach") {
          setTrailMood("teach");
          cuePhysicalTask(current, beatIndexRef.current, fieldStageRef.current);
          scheduleAction(() => {
            const guided = completeTeachBack(correctionRecordsRef.current[key]);
            correctionRecordsRef.current = { ...correctionRecordsRef.current, [key]: guided };
            correctionRef.current = guided;
            setCorrection(guided);
            setFieldChoiceLock(false);
            setTrailMood("idle");
            cuePhysicalTask(current, beatIndexRef.current, fieldStageRef.current);
            checkpoint({ corrections: correctionRecordsRef.current, reviewQueue: reviewQueueRef.current });
          }, 1450);
        } else {
          scheduleAction(() => {
            setFieldChoiceLock(false);
            setTrailMood("idle");
            cuePhysicalTask(current, beatIndexRef.current, fieldStageRef.current);
          }, 820);
        }
        return true;
      }

      const nextStage = fieldStageRef.current + 1;
      setPhonemeFillCount(Math.min(task.stages.length, nextStage));
      if (nextStage < task.stages.length) {
        scheduleAction(() => {
          fieldStageRef.current = nextStage;
          setFieldChoiceLock(false);
          setFieldStage(nextStage);
          setCorrectionFor(current, beatIndexRef.current, nextStage);
          setTrailMood("cheer");
          cuePhysicalTask(current, beatIndexRef.current, nextStage);
          checkpoint({ active: current, beatIndex: beatIndexRef.current, fieldStage: nextStage });
        }, 480);
        return true;
      }

      answer(true, beat.target, {
        promptLevel: promptLevelForMode(correctionRef.current?.mode),
        recordsMastery: fieldStageRecordsMastery(stage, isSoundEnabled)
      });
      const blendComplete = Boolean(beat.word && task.stages.length > 1);
      if (blendComplete) {
        const graphemes = physicalTaskAnswers(task);
        let slotState = createPhonemeSlotState(graphemes);
        for (const grapheme of graphemes) slotState = advancePhonemeSlotState(slotState, grapheme, true);
        setInteractionFeedback({
          kind: "blend",
          announcement: slotState.announcement || `Word complete: ${beat.word}`,
          duration: 1250
        });
        scheduleAction(() => sayWord(beat.word, isSoundEnabled), 300);
      }
      scheduleAction(nextBeat, blendComplete ? 1180 : 640);
      return true;
    };
  });

  const activeFieldTask = useMemo(() => (
    active ? buildPhysicalTask(section, active, active.beats[beatIndex], beatIndex) : null
  ), [active, beatIndex, section]);
  const encounterTasks = useMemo(() => (
    active?.beats?.map((encounterBeat, encounterBeatIndex) => (
      buildPhysicalTask(section, active, encounterBeat, encounterBeatIndex)
    )) || []
  ), [active, section]);
  const previousBestDrops = Number(state.trail?.drops?.[stopId]) || 0;
  const seedwakeSpec = seedwakeStopSpec(stopId);
  const liveSeedwakeState = useMemo(() => (seedwakeSpec ? {
    ...state,
    trail: {
      ...state.trail,
      drops: {
        ...state.trail?.drops,
        [stopId]: Math.max(previousBestDrops, picked.size)
      }
    }
  } : state), [picked.size, previousBestDrops, seedwakeSpec, state, stopId]);
  const satchel = useMemo(() => seedwakeSatchel(liveSeedwakeState), [liveSeedwakeState]);
  const activeBeat = active?.beats?.[beatIndex] || null;
  const wordBuild = useMemo(() => {
    const taskParts = activeFieldTask ? physicalTaskAnswers(activeFieldTask) : [];
    const activeWordSounds = activeBeat?.word ? new Set(segmentWord(activeBeat.word)) : new Set();
    const stageAnswers = (activeFieldTask?.stages || [])
      .map(stage => (stage.items || []).find(item => item.correct)?.value)
      .filter(value => value != null)
      .map(String)
      .filter(value => activeWordSounds.has(value))
      .filter((value, index, all) => value !== all[index - 1]);
    const activeWordParts = Boolean(activeBeat?.word) && stageAnswers.length > 1
      ? (taskParts.length > 1 ? taskParts : segmentWord(activeBeat.word))
      : [];
    let activeSlotState = createPhonemeSlotState(activeWordParts);
    for (const grapheme of activeWordParts.slice(0, phonemeFillCount)) {
      activeSlotState = advancePhonemeSlotState(activeSlotState, grapheme, true);
    }
    return { activeSlotState, activeWordParts };
  }, [activeBeat, activeFieldTask, phonemeFillCount]);
  const encounterProgress = useMemo(() => {
    const stageCount = encounterTasks.reduce((total, task) => total + (task?.stages.length || 0), 0);
    const stageIndex = encounterTasks
      .slice(0, beatIndex)
      .reduce((total, task) => total + (task?.stages.length || 0), 0) + fieldStage;
    return { stageCount, stageIndex };
  }, [beatIndex, encounterTasks, fieldStage]);

  if (!section) {
    // A section that failed to build must never render NOTHING - a black
    // screen with no exit is a dead end for a child. Show a door.
    return (
      <div className="qh-root qh-root-empty">
        <button type="button" className="q-ghost qh-leave qh-leave-floating" onClick={onQuit}>
          &#8592; Den
        </button>
        <p className="qh-empty-note">This trail could not open. Tap the door to go back.</p>
      </div>
    );
  }
  const View = active ? ENCOUNTER_VIEWS[active.kind] : null;
  const teach = section.teach[meetIndex];
  const nextEncounter = firstUnsolvedEncounter(section, solved);
  const sectionNumber = stop?.index || 1;
  const activeFieldStage = physicalStage(activeFieldTask, fieldStage);
  const activeCorrection = correctionPresentation(activeFieldStage, correction);

  // WHEN THE SOUND CANNOT PLAY, SAY WHAT TO FIND — the 2D views already did
  // this and the 3D world did not, which is how the field ended up asking for
  // a sound it had no recording of and showing a prompt a non-reader cannot
  // read. Eight graphemes are still awaiting a gold-voice clip (aw, ore, air,
  // are, ear, ure, le, tion — see NEEDS_AUDIO); the house rule forbids a
  // browser voice and forbids a substitute clip, so the honest fallback is to
  // NAME the target on screen and decline to bank mastery for a sound we never
  // actually played.
  const stageCueKind = activeFieldStage?.audioCue?.kind || null;
  const stageCueValue = activeFieldStage?.audioCue?.value || null;
  const stageCueAvailable = stageCueKind === "grapheme"
    ? hasGraphemeAudio(stageCueValue)
    : stageCueKind === "word" && hasWordAudio(stageCueValue);
  const stageSoundDelivered = Boolean(isSoundEnabled && stageCueAvailable);
  const stageRecordsMastery = physicalStageRecordsMastery(activeFieldStage, stageSoundDelivered);
  const fieldPrompt = stageRecordsMastery
    ? activeCorrection.prompt
    : physicalStagePrompt(activeFieldStage, false);
  const pendingDropSparks = Math.max(0, picked.size - previousBestDrops) * SPARKS_PER_DROP;
  const liveSparks = availableSparks(state) + pendingDropSparks;
  const currentPocket = satchel.pockets.find(pocket => pocket.stopId === stopId);
  // SHOW THE WORD BEING BUILT WHEREVER A WORD IS BEING BUILT.
  //
  // This used to be an allowlist of two mechanics ("bridge-build" and the
  // echo cave), which meant every authored chapter sequence — dig-and-build,
  // waterwheel-sequence, forge-recipe, telescope-build and the rest — spelt a
  // word out one sound at a time and never showed the child the word taking
  // shape. Same task, same learning moment, no builder, purely because the
  // mechanic had a different name.
  //
  // The real condition is structural, not nominal: there is a word, and the
  // stages answer with SUCCESSIVE DIFFERENT sounds of it.
  //
  // "More than one stage" is not enough, and getting that wrong showed a word
  // builder reading "m". Several authored verbs are two-stage but single-sound
  // — fish-rescue spots the letter and then chases it, so both stages answer
  // `m` and the child is only ever asked for one sound. Collapsing repeats
  // separates "spell m-a-t" from "find m, twice".
  // Only the word's OWN sounds count. Many verbs answer a sound and then a
  // place — track-sort picks `a` and then a route, delivery picks a parcel and
  // then a marker. Those destination ids are not phonemes and must never land
  // in a slot.
  const { activeSlotState, activeWordParts } = wordBuild;
  const encounterStageCount = encounterProgress.stageCount;
  const encounterStageIndex = encounterProgress.stageIndex;
  const encounterHud = activeFieldStage
    ? seedwakeEncounterHudModel({
      objective: activeCorrection.prompt,
      rewardLabel: seedwakeSpec?.collectible.plural || "finds",
      rewardCount: currentPocket?.count || 0,
      stageIndex: encounterStageIndex,
      stageCount: encounterStageCount || 1
    })
    : [];

  const leaveWorld = () => {
    onQuit?.();
  };

  const moveToNext = () => {
    if (gateOpen) {
      targetRef.current = clampTrailPosition(section.exit, section, 1);
      if (isSoundEnabled) playWhoosh();
      return;
    }
    if (!guideDone) {
      targetRef.current = clampTrailPosition(
        section.guide,
        section,
        forwardLimitFor(section)
      );
      return;
    }
    if (nextEncounter) moveToEncounter(nextEncounter);
  };

  return (
    <main
      className={`q-screen qh-root${sceneReady ? " is-ready" : ""}${sceneError ? " has-fallback" : ""}${active ? " is-encounter-active" : ""}`}
      data-world={section.world}
      data-chapter={section.chapter?.id || section.world}
      data-route-topology={section.topology}
      data-variant={section.variant?.id || section.world}
      data-light={section.lighting?.id || "trailLight"}
      data-event={section.event?.mode || "section"}
      data-finale={section.finale?.cue || "none"}
      data-restored-moments={section.restoredMoments.length}
      data-interactive={isInteractive ? "true" : "false"}
      data-play-mode={mode}
      data-quality={qualityTier?.id || state.settings?.displayMode || "auto"}
      data-player-body={normalizeCreature(state.creature).body}
      data-player-dye={normalizeCreature(state.creature).dye}
      style={{
        "--qh-backdrop": `url(/images/quest/${section.world}/sky.webp)`,
        "--qh-glow": section.lighting?.glow ?? 0.5
      }}
    >
      <canvas ref={canvasRef} className="qh-canvas" aria-label={`Follow the trail through ${theme.name}`} tabIndex="0" />

      {!sceneReady && !sceneError && <div className="qh-loading" aria-live="polite">Opening the trail...</div>}

      <div className={`qh-world-layer${active ? " is-encounter-active" : ""}`} aria-hidden={phase !== "trail" || Boolean(active)}>
        {section.drops.map(drop => (
          <span
            key={drop.id}
            ref={dropRefCallbacks.get(drop.id)}
            className={`qh-drop${drop.cache ? " is-cache" : ""}${picked.has(drop.id) ? " is-picked" : ""}`}
          >
            <img src="/images/quest/props/sun-drop.webp" alt="" draggable="false" />
          </span>
        ))}

        {section.encounters.map(encounter => {
          const isSolved = solved.has(encounter.id);
          const isNext = nextEncounter?.id === encounter.id && guideDone;
          return (
            <button
              key={encounter.id}
              ref={landmarkRefCallbacks.get(encounter.id)}
              type="button"
              className={`qh-landmark${isSolved ? " is-solved" : ""}${isNext ? " is-next" : ""}${selectedId === encounter.id ? " is-selected" : ""}`}
              disabled={!isNext || Boolean(active)}
              onClick={() => moveToEncounter(encounter)}
              aria-label={isSolved ? `${encounter.friend} helped` : isNext ? `Help ${encounter.friend} at ${encounter.label}` : `${encounter.label} is farther along the trail`}
            >
              {isNext && <span className="qh-beacon" aria-hidden="true">?</span>}
              <span className="qh-place-token" aria-hidden="true">{encounter.field ? encounter.field.object : "task"}</span>
              <span className="qh-place-name"><strong>{encounter.friend}</strong>{encounter.label}</span>
            </button>
          );
        })}

        <button
          ref={guideRef}
          type="button"
          className={`qh-resident${guideDone ? " is-met" : " is-next"}`}
          disabled={guideDone}
          onClick={() => {
            if (guideDone) return;
            targetRef.current = clampTrailPosition(section.guide, section, forwardLimitFor(section));
          }}
          aria-label={guideDone ? `${section.guide.friend} taught the new sounds` : `Meet ${section.guide.friend}`}
        >
          {!guideDone && <span className="qh-beacon" aria-hidden="true">!</span>}
          <span className="qh-resident-chip">{section.guide.friend}</span>
        </button>
      </div>

      {/* Mid-encounter, the full HUD hides but the DOOR STAYS: a child deep
          in a task must always have one visible way out (the other two
          renderers never lose theirs). Quitting checkpoints via the unmount
          save, so no progress is lost. */}
      {active && (
        <button type="button" className="q-ghost qh-leave qh-leave-floating" onClick={leaveWorld}>
          &#8592; Den
        </button>
      )}
      {!active && <header className="qh-hud">
        <button type="button" className="q-ghost qh-leave" onClick={leaveWorld}>Back to the Den</button>
        <div className="qh-land-title">
          <span>{stop?.name || theme.name}</span>
          <strong>{mode === "review" ? "Sound practice" : `Trail ${sectionNumber} of ${QUEST_STOPS.length}`}</strong>
        </div>
        <div className="qh-economy">
          {seedwakeSpec && (
            <div className="qh-satchel" aria-label={`${satchel.total} chapter finds, including ${currentPocket?.count || 0} ${seedwakeSpec.collectible.plural}`}>
              <span className="qh-satchel-mark" aria-hidden="true" />
              <span><strong>{satchel.total}</strong><small>chapter finds</small></span>
              <em>{satchel.nextCacheAt ? `${satchel.nextCacheAt - satchel.total} to cache` : "caches open"}</em>
            </div>
          )}
          <div className="qh-drops" aria-label={`${liveSparks} sparks available`}>
            <img src="/images/quest/props/sun-drop.webp" alt="" />
            <span>{liveSparks}</span>
          </div>
        </div>
      </header>}

      {!active && <div className="qh-route-meter" aria-label={`${routePercent}% through this trail`}>
        <span style={{ "--qh-progress": `${routePercent}%` }} />
      </div>}

      {pickupNotice && <div className="qh-pickup-notice" aria-live="polite">{pickupNotice}</div>}

      {sceneReady && activeFieldStage && (
        <header className="qh-encounter-hud" aria-label="Current objective and reward">
          <button
            type="button"
            className="qh-objective-cue"
            data-quest-hud-node="objective"
            onClick={() => cuePhysicalTask(active, beatIndex, fieldStage)}
            aria-label={`${encounterHud[0]?.label}. Play the sound again.`}
          >
            <span aria-hidden="true" />
            <strong>{encounterHud[0]?.label}</strong>
          </button>
          <div
            className="qh-encounter-reward"
            data-quest-hud-node="reward"
            aria-label={`${encounterHud[1]?.count || 0} ${encounterHud[1]?.label || "finds"}; ${encounterHud[1]?.progress || "1 of 1"}`}
          >
            <span className="qh-satchel-mark" aria-hidden="true" />
            <strong>{encounterHud[1]?.count || 0}</strong>
            <small>{encounterHud[1]?.progress}</small>
          </div>
        </header>
      )}

      {sceneReady && activeFieldStage && (
        <div ref={viewFocusRef} tabIndex={-1} className={`qh-semantic-choices${COARSE_POINTER ? " is-pinned" : ""}`} role="group" aria-label="Answer choices">
          {activeFieldStage.items
            .filter(item => activeCorrection.visibleIds.includes(item.id))
            .map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => fieldTaskSelectRef.current?.(item)}
                onKeyDown={event => {
                  if (!['Enter', ' '].includes(event.key)) return;
                  event.preventDefault();
                  fieldTaskSelectRef.current?.(item);
                }}
                disabled={fieldChoicesLocked}
                aria-label={`Choose ${item.label}`}
              >
                {displayGrapheme(item.label)}
              </button>
            ))}
        </div>
      )}

      {activeWordParts.length > 1 && (
        <div
          className={`qh-phoneme-build${activeSlotState.complete ? " is-complete" : ""}${interactionFeedback?.kind === "blend" ? " is-blending" : ""}`}
          data-word={activeBeat.word}
          aria-label={`Build ${activeBeat.word}`}
        >
          <div className="qh-phoneme-slots">
            {activeWordParts.map((grapheme, index) => (
              <span
                key={`${grapheme}-${index}`}
                className={index < activeSlotState.filled.length ? "is-filled" : ""}
                data-filled={index < activeSlotState.filled.length ? "true" : "false"}
              >
                {index < activeSlotState.filled.length ? displayGrapheme(grapheme) : ""}
              </span>
            ))}
          </div>
          {activeSlotState.complete && (
            <strong className="qh-success-marker" aria-label="Word complete">
              <span aria-hidden="true" />{activeBeat.word}
            </strong>
          )}
        </div>
      )}

      <div className="q-visually-hidden" aria-live="assertive" aria-atomic="true">
        {interactionFeedback?.announcement || ""}
      </div>

      {/* Rendered only when it HAS a next action - a primary button with
          nothing written on it is worse than no button. */}
      {phase === "trail" && !active && (gateOpen || !guideDone || nextEncounter) && (
        <button ref={viewFocusRef} type="button" className={`qh-next-call${gateOpen ? " is-gate" : ""}`} onClick={moveToNext} aria-live="polite">
          {gateOpen ? (
            section.isChapterFinale
              ? <><strong>{section.finale.title}</strong><span>Walk into the restored destination</span></>
              : <><strong>The gate is open</strong><span>Walk through to the next trail</span></>
          ) : !guideDone ? (
            <><strong>{section.guide.friend} is waiting</strong><span>Follow the path</span></>
          ) : (
            <><strong>{nextEncounter.friend} needs help</strong><span>{nextEncounter.label}</span></>
          )}
        </button>
      )}

      {phase === "teach" && teach && (
        <div ref={viewFocusRef} tabIndex={-1}>
          <Guide
            key={teach.id}
            world={section.world}
            entries={section.teach}
            isSoundEnabled={isSoundEnabled}
            onNext={() => {
              guideDoneRef.current = true;
              setGuideDone(true);
              phaseRef.current = "trail";
              setPhase("trail");
              checkpoint({ phase: "trail", guideDone: true, meetIndex: 0 });
            }}
          />
        </div>
      )}

      {sceneReady && activeFieldTask?.storyText && activeFieldStage && (
        <div
          key={`${active.id}-${beatIndex}-${fieldStage}-${activeCorrection.mode}-${remediationBeat ?? "main"}`}
          className={`qh-field-hud is-${activeCorrection.mode}${activeFieldTask.storyText ? " is-story" : ""}`}
          data-correction-mode={activeCorrection.mode}
          data-visible-choices={activeCorrection.visibleIds.length}
          aria-label={`${active.friend}: ${fieldPrompt}`}
          aria-live="polite"
        >
          <span>{active.friend}</span>
          <p>{activeFieldTask.storyText}</p>
          <strong>{fieldPrompt}</strong>
          <em>{activeCorrection.help}</em>
        </div>
      )}

      {View && active && !activeFieldTask && (
        <div className="qw-panel qh-panel">
          <View
            key={`${active.id}-${beatIndex}-${retryNonce}`}
            beat={active.beats[beatIndex]}
            index={beatIndex}
            total={active.beats.length}
            isSoundEnabled={isSoundEnabled}
            extendedResponse={extendedResponse}
            onBeat={answer}
            onDone={nextBeat}
          />
        </div>
      )}
    </main>
  );
}
