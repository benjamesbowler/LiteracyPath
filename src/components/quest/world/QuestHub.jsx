// SOUND SEEKERS TRAIL - a long guided journey with room to roam.
//
// Three.js owns the path, forest walls, rigged characters, camera, and gate.
// React owns only the projected labels and phonics interaction panels. Only the
// next story encounter is active, so the 40-stop curriculum stays coherent
// without making movement feel like a side-scrolling level.

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  VignetteEffect
} from "postprocessing";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import Guide from "./Guide.jsx";
import { ENCOUNTER_VIEWS } from "./encounterViews.js";
import {
  createImportedNature,
  createRiggedTrailCharacters,
  disposeAssetObject,
  updateImportedNature,
  updateRiggedCharacter
} from "./questAssets.js";
import {
  buildTrailSection,
  clampTrailPosition,
  firstUnsolvedEncounter,
  forwardLimitFor,
  trailCenterX,
  trailHalfWidth,
  trailProgress,
  TRAIL_BOUNDS,
  TRAIL_EXIT_Z,
  TRAIL_GATE_Z,
  TRAIL_START
} from "../../../utils/questHub.js";
import { targetsForStop } from "../../../utils/questReviewScheduler.js";
import { targetsAtStop, getStop, QUEST_STOPS } from "../../../data/questSequence.js";
import { starRubric } from "../../../utils/starRubric.js";
import { playCorrectChime, playSoftBuzz, playStarChime, playWhoosh } from "../../../utils/audio/gameSfx.js";
import { displayGrapheme, sayGrapheme, sayWord } from "../shells/shellContract.js";
import { getDye } from "../../../data/creatureParts.js";

const MOVE_SPEED = 4.6;
const ENCOUNTER_REACH = 1.7;
const AUTOSAVE_MS = 1200;
const FIELD_OBJECT_REACH = 0.82;

const FIELD_TASK_KINDS = new Set(["flower-patch", "hungry-beast", "signpost", "word-beast"]);
const SIGN_OBJECT_COLOURS = {
  red: 0xc95043,
  green: 0x53a85d,
  black: 0x2b2a27
};

const WORLD_THEMES = {
  meadow: {
    name: "Sunlit Meadow",
    sky: 0xcfeab8,
    sun: 0xfff1c2,
    hemi: 0xfff7d7,
    ground: 0x719956,
    path: 0xd8bc80,
    pathEdge: 0xa9834e,
    canopy: [0x3f7638, 0x568a43, 0x6f9b4c, 0x86aa59],
    trunk: 0x705035,
    fog: 0xcce0aa,
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
    sun: 0xffd08a,
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
    sun: 0xb9d9ff,
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

function surfaceTexture(seed, { repeatX = 4, repeatY = 20, contrast = 18 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = "rgb(224, 224, 218)";
  context.fillRect(0, 0, 256, 256);
  for (let index = 0; index < 180; index += 1) {
    const randomX = Math.abs(Math.sin(seed * 19.13 + index * 71.7) * 43758.5453) % 1;
    const randomY = Math.abs(Math.sin(seed * 31.71 + index * 43.3) * 23421.631) % 1;
    const randomSize = Math.abs(Math.sin(seed * 7.11 + index * 11.9) * 18117.13) % 1;
    const shade = 224 + Math.round((randomSize - 0.5) * contrast);
    context.fillStyle = `rgba(${shade}, ${shade}, ${Math.max(0, shade - 4)}, ${0.12 + randomSize * 0.14})`;
    context.beginPath();
    context.ellipse(randomX * 256, randomY * 256, 3 + randomSize * 18, 2 + randomSize * 8, randomX * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;
  texture.userData.questSurface = true;
  return texture;
}

function pathRibbon(points, width, y, color, seed) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(point => new THREE.Vector3(point.x, y, point.z)),
    false,
    "catmullrom",
    0.34
  );
  const steps = 150;
  const vertices = [];
  const uvs = [];
  const indices = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
    vertices.push(point.x + side.x, y, point.z + side.z, point.x - side.x, y, point.z - side.z);
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
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(y >= 0.1 ? 0.66 : 0.78),
      map: surfaceTexture(seed + Math.round(y * 1000), { repeatX: 2.2, repeatY: 34, contrast: 22 }),
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.18,
      side: THREE.DoubleSide
    })
  );
  mesh.receiveShadow = true;
  return mesh;
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

function chooseTrailQuality() {
  const memory = Number(navigator.deviceMemory) || 8;
  const narrow = window.innerWidth < 760;
  const low = memory <= 4 || narrow;
  return {
    pixelRatio: low ? 1.2 : 1.65,
    shadows: !low,
    treeRows: low ? 2 : 3,
    decorationStep: low ? 14 : 9,
    ambientScale: low ? 0.55 : 1,
    postEffects: !low
  };
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
  return new THREE.MeshStandardMaterial({
    color,
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
    roughness: 0.62,
    metalness: 0.01,
    clearcoat: 0.22,
    clearcoatRoughness: 0.64,
    sheen: 0.18,
    envMapIntensity: 0.86,
    ...options
  });
}

function inkMat(options = {}) {
  return clayMat(0x221f2e, { roughness: 0.48, clearcoat: 0.1, ...options });
}

function pathSidePoint(section, z, side, offset = 1.5) {
  return {
    x: trailCenterX(z, section.stopIndex) + side * (trailHalfWidth(z, section.stopIndex) + offset),
    z
  };
}

function addFence(scene, section, z, side, theme, length = 4) {
  const point = pathSidePoint(section, z, side, 0.72);
  const group = new THREE.Group();
  group.position.set(point.x, 0, point.z);
  group.rotation.y = side > 0 ? -0.14 : 0.14;
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

function addCottage(scene, section, z, side, theme) {
  const point = pathSidePoint(section, z, side, 2.3);
  const group = new THREE.Group();
  group.position.set(point.x, 0, point.z);
  group.rotation.y = side > 0 ? -0.4 : 0.4;
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
  group.position.set(point.x, 0, point.z);
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
  group.position.set(section.gate.x, 0, section.gate.z);
  const wood = mat(theme.gate, { roughness: 0.84 });
  const cap = mat(theme.pathEdge, { roughness: 0.9 });

  for (const x of [-3.35, 3.35]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 3.7, 0.5), wood);
    post.position.set(x, 1.75, 0);
    post.castShadow = true;
    group.add(post);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 5), cap);
    top.position.set(x, 3.9, 0);
    top.castShadow = true;
    group.add(top);
  }

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.48, 0.55), wood);
  lintel.position.set(0, 3.25, 0);
  lintel.castShadow = true;
  group.add(lintel);

  const left = new THREE.Group();
  left.position.set(-3.1, 0, 0);
  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(3.05, 2.5, 0.26), wood);
  leftDoor.position.set(1.5, 1.3, 0);
  leftDoor.castShadow = true;
  left.add(leftDoor);

  const right = new THREE.Group();
  right.position.set(3.1, 0, 0);
  const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(3.05, 2.5, 0.26), wood);
  rightDoor.position.set(-1.5, 1.3, 0);
  rightDoor.castShadow = true;
  right.add(rightDoor);

  group.add(left, right);
  scene.add(group);
  return { left, right };
}

function buildSectionLandmark(scene, section, theme) {
  const { x, z, kind } = section.landmark;
  switch (kind) {
    case "windmill":
      return addWindmill(scene, x, z, theme, 1.45);
    case "orchard":
      for (let index = 0; index < 5; index += 1) {
        addTree(scene, x + (index - 2) * 1.0, z + Math.sin(index) * 0.7, 0.95, theme, index + 2);
      }
      return null;
    case "farmstead":
      return addCottage(scene, section, z, x > trailCenterX(z, section.stopIndex) ? 1 : -1, theme);
    case "lanternGrove":
      return addLanternTree(scene, x, z, theme, 1.05);
    case "boneArch":
      return addBoneArch(scene, x, z, theme, 1.75);
    case "excavationCamp":
      return addCottage(scene, section, z, x > trailCenterX(z, section.stopIndex) ? 1 : -1, theme);
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
  const canopyShift = section.variant?.canopyShift || 0;
  for (let z = TRAIL_BOUNDS.startZ - 6; z >= TRAIL_BOUNDS.endZ + 5; z -= step) {
    const side = index % 2 === 0 ? -1 : 1;
    const point = pathSidePoint(section, z, side, 1.1 + (index % 3) * 0.42);
    if (section.world === "meadow") {
      if (section.variant?.scatter === "ponds" && index % 4 === 0) addTarPool(scene, point.x, point.z, theme, 0.52);
      else if (section.variant?.scatter === "lanterns" && index % 4 === 0) addLanternTree(scene, point.x, point.z, theme, 0.54);
      else if (index % 5 === 0) addCottage(scene, section, z, side, theme);
      else if (index % 3 === 0 || section.variant?.scatter === "fences") addFence(scene, section, z, side, theme, 5);
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
      else addFungi(scene, section, z, side, theme);
    }
    index += 1;
  }
}

function buildRepair(scene, encounter, section, theme) {
  const { kind, x, z } = encounter.repair;
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
  } else if (kind === "fossilLamp" || kind === "bridgeTorch") {
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
  if (output.group) output.group.userData.baseScale = output.group.scale.clone();
  return output.group ? output : null;
}

function buildRepairMoments(scene, section, theme) {
  return section.encounters.map(encounter => buildRepair(scene, encounter, section, theme)).filter(Boolean);
}

function buildActEvent(scene, section, theme) {
  if (section.event?.mode === "section") return null;
  const group = new THREE.Group();
  group.name = `act-event-${section.event.id}`;
  const glow = glowMat(theme.glow, 0.56);
  const cloth = mat(theme.flower);
  const wood = mat(theme.structure);
  const anchor = section.gate;
  const entryZ = TRAIL_START.z - 3.8;

  for (const side of [-1, 1]) {
    const point = pathSidePoint(section, entryZ, side, 0.55);
    if (section.event.cue === "festival") {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.8, 7), wood);
      pole.position.set(point.x, 0.9, point.z);
      const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.48, 3), cloth);
      pennant.position.set(point.x + side * 0.24, 1.65, point.z);
      pennant.rotation.z = side * Math.PI / 2;
      group.add(pole, pennant);
    } else if (section.event.cue === "forge") {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), glow);
      lamp.position.set(point.x, 1.1, point.z);
      lamp.userData.phase = side > 0 ? 0.9 : 0.2;
      group.add(lamp);
    } else {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), glow);
      crystal.position.set(point.x, 1.02, point.z);
      crystal.userData.phase = side > 0 ? 1.4 : 0.4;
      group.add(crystal);
    }
  }

  if (section.event.cue === "festival") {
    for (let row = 0; row < 3; row += 1) {
      const z = anchor.z + 12 + row * 7;
      const center = trailCenterX(z, section.stopIndex);
      const arch = new THREE.Group();
      arch.position.set(center, 0, z);
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
      const z = anchor.z + 6 + index * 2.8;
      const side = index % 2 === 0 ? -1 : 1;
      const point = pathSidePoint(section, z, side, 1.15);
      const piston = new THREE.Group();
      piston.position.set(point.x, 0, point.z);
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
      const z = anchor.z + 4 + index * 2.2;
      const side = index % 2 === 0 ? -1 : 1;
      const point = pathSidePoint(section, z, side, 0.9 + (index % 4) * 0.2);
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.18 + (index % 3) * 0.04, 0), glow);
      star.position.set(point.x, 1.25 + (index % 5) * 0.18, point.z);
      star.userData.phase = index * 0.51;
      group.add(star);
    }
  }

  scene.add(group);
  return group;
}

function updateActEvent(group, now) {
  if (!group) return;
  const time = now * 0.001;
  group.children.forEach((child, index) => {
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

function updateRepairMoment(repair, solved, dt, now) {
  repair.state = THREE.MathUtils.lerp(repair.state, solved ? 1 : 0, 1 - Math.pow(0.025, dt));
  if (repair.spinner) {
    repair.spinner.rotation.z += dt * (0.55 + repair.state * 3.2);
    repair.spinner.rotation.y = Math.sin(now * 0.0018) * 0.12 * repair.state;
  }
  for (const material of repair.glows) {
    material.opacity = 0.16 + repair.state * 0.58;
    material.emissiveIntensity = 0.22 + repair.state * 1.25;
  }
  if (repair.group?.userData.baseScale) {
    const bounce = solved ? 1 + Math.sin(now * 0.005) * 0.015 * repair.state : 0.92;
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

function fieldTaskKey(encounter, beatIndex) {
  return `${encounter?.id || "none"}:${beatIndex}`;
}

function isPhysicalFieldTask(encounter, beat) {
  return Boolean(encounter && beat && FIELD_TASK_KINDS.has(encounter.kind));
}

function fieldTaskForBeat(section, encounter, beat, beatIndex = 0) {
  if (!isPhysicalFieldTask(encounter, beat)) return null;
  let prompt = "Collect the matching thing.";
  let items = [];

  if (encounter.kind === "flower-patch" || encounter.kind === "hungry-beast") {
    const shape = encounter.kind === "flower-patch" ? "flower" : "fruit";
    prompt = encounter.kind === "flower-patch"
      ? `Collect the ${displayGrapheme(beat.target)} flower.`
      : `Feed the creature ${displayGrapheme(beat.target)} fruit.`;
    items = (beat.choices || []).map(choice => ({
      id: `${encounter.id}-${beatIndex}-${choice}`,
      value: choice,
      label: displayGrapheme(choice),
      shape,
      correct: choice === beat.answer
    }));
  } else if (encounter.kind === "word-beast") {
    prompt = `Feed it ${beat.word}.`;
    items = (beat.choices || []).map(choice => ({
      id: `${encounter.id}-${beatIndex}-${choice}`,
      value: choice,
      label: choice,
      shape: "cake",
      correct: choice === beat.answer
    }));
  } else if (encounter.kind === "signpost") {
    prompt = beat.text || "Read the sign, then collect the right thing.";
    items = (beat.things || []).map(thing => ({
      id: `${encounter.id}-${beatIndex}-${thing.id}`,
      value: thing.id,
      label: [thing.size, thing.colour].filter(Boolean).join(" "),
      shape: thing.id,
      colour: thing.colour,
      size: thing.size,
      word: thing.word,
      correct: thing.id === beat.answer
    }));
  }

  const count = Math.max(1, items.length);
  const mid = (count - 1) / 2;
  const baseZ = encounter.z + 0.42;
  const spacing = count > 3 ? 1.15 : 1.48;
  return {
    key: fieldTaskKey(encounter, beatIndex),
    prompt,
    help: "Walk into the right object or tap it.",
    encounterId: encounter.id,
    beatIndex,
    items: items.map((item, index) => {
      const position = clampTrailPosition({
        x: trailCenterX(baseZ, section.stopIndex) + (index - mid) * spacing,
        z: baseZ + Math.abs(index - mid) * 0.2
      }, section.stopIndex, TRAIL_BOUNDS.endZ);
      return { ...item, x: position.x, z: position.z, order: index };
    })
  };
}

function taskColour(spec, theme) {
  if (spec.colour && SIGN_OBJECT_COLOURS[spec.colour]) return SIGN_OBJECT_COLOURS[spec.colour];
  const cycle = [theme.flower, theme.glow, theme.water, theme.path, theme.structure];
  return cycle[spec.order % cycle.length] || theme.flower;
}

function addFieldLabel(group, label, y = 1.22, width = 0.98) {
  if (!label) return;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 249, 219, 0.96)";
  roundRect(ctx, 28, 30, 200, 68, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(42, 38, 26, 0.34)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "rgb(47, 43, 30)";
  ctx.font = "800 48px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(label).slice(0, 8), 128, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.5), material);
  tag.position.y = y;
  tag.position.z = 0.08;
  group.add(tag);
  group.userData.billboards = [...(group.userData.billboards || []), tag];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function buildFieldAvatar(spec, theme) {
  const group = new THREE.Group();
  group.name = `field-object-${spec.id}`;
  group.position.set(spec.x, 0, spec.z);
  group.userData.fieldChoice = spec;
  group.userData.baseY = 0;
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
  } else {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), spec.shape === "rock" ? mat(theme.stone) : primary);
    rock.scale.set(1.18, 0.72, 0.92);
    rock.position.y = 0.34;
    group.add(rock);
  }

  if (spec.label && spec.shape !== "flower" && spec.shape !== "fruit" && spec.shape !== "cake") {
    addFieldLabel(group, spec.label, 1.05);
  }

  group.traverse(child => {
    child.castShadow = true;
    child.userData.fieldChoice = spec;
  });
  return group;
}

function buildFieldTasks(scene, section, theme) {
  const tasks = new Map();
  for (const encounter of section.encounters) {
    encounter.beats.forEach((beat, beatIndex) => {
      const task = fieldTaskForBeat(section, encounter, beat, beatIndex);
      if (!task) return;
      const group = new THREE.Group();
      group.name = `field-task-${task.key}`;
      group.visible = false;
      const items = task.items.map(spec => {
        const avatar = buildFieldAvatar(spec, theme);
        group.add(avatar);
        return avatar;
      });
      scene.add(group);
      tasks.set(task.key, { ...task, group, items, resolved: false });
    });
  }
  return tasks;
}

function updateFieldTasks(tasks, active, beatIndex, now, camera) {
  const liveKey = active ? fieldTaskKey(active, beatIndex) : null;
  const time = now * 0.001;
  for (const [key, task] of tasks) {
    const live = key === liveKey && !task.resolved;
    task.group.visible = live;
    if (!live) continue;
    task.items.forEach((item, index) => {
      item.position.y = Math.sin(time * 2.8 + item.userData.phase) * 0.06;
      item.rotation.y = Math.sin(time * 0.82 + item.userData.phase) * 0.24;
      for (const part of item.userData.motionParts || []) {
        if (part.type === "tail") part.object.rotation.y = Math.sin(time * 7.2 + item.userData.phase) * 0.42;
        else if (part.type === "leaf") part.object.rotation.z = part.baseRotation + Math.sin(time * 3.1 + item.userData.phase) * 0.12;
        else if (part.type === "petal") part.object.position.y = part.baseY + Math.sin(time * 2.4 + part.phase) * 0.025;
        else if (part.type === "flame") {
          const flicker = 0.9 + Math.sin(time * 11.5 + index) * 0.12;
          part.object.scale.set(0.7 * flicker, 1.45 / flicker, 0.7 * flicker);
          part.object.material.emissiveIntensity = 0.9 + flicker * 0.45;
        }
      }
      for (const billboard of item.userData.billboards || []) {
        billboard.quaternion.copy(camera.quaternion);
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
  return new THREE.MeshBasicMaterial({
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

function buildCharacterAvatar({ palette, world = "meadow", scale = 1, role = "resident", phase = 0 }) {
  const root = new THREE.Group();
  root.name = `${role}-avatar`;
  root.scale.setScalar(scale);
  root.userData.baseScale = scale;
  root.userData.phase = phase;
  root.userData.materials = [];
  root.userData.parts = {};

  const materials = {
    skin: trackedMaterial(root, clayMat(palette.skin)),
    belly: trackedMaterial(root, clayMat(palette.belly, { roughness: 0.7, clearcoat: 0.14 })),
    dark: trackedMaterial(root, inkMat({ color: palette.dark })),
    accent: trackedMaterial(root, clayMat(palette.accent, {
      roughness: 0.45,
      emissive: new THREE.Color(palette.accent).multiplyScalar(0.12),
      emissiveIntensity: 0.55
    })),
    white: trackedMaterial(root, clayMat(0xfffbef, { roughness: 0.34, clearcoat: 0.34 }))
  };

  addContactShadow(root, role === "player" ? 0.9 : 0.78, role === "player" ? 0.31 : 0.24);

  const body = makeCapsule(0.36, 0.68, materials.skin, 16, 34);
  body.name = "body";
  body.position.y = 0.82;
  body.scale.set(1.05, 1.05, 0.82);
  body.castShadow = true;
  root.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.27, 30, 18), materials.belly);
  belly.name = "belly";
  belly.position.set(0, 0.72, 0.31);
  belly.scale.set(0.9, 1.1, 0.22);
  root.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 36, 24), materials.skin);
  head.name = "head";
  head.position.set(0, 1.42, 0.02);
  head.scale.set(1.04, 0.92, 0.92);
  head.castShadow = true;
  root.add(head);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 26, 14), materials.belly);
  muzzle.name = "muzzle";
  muzzle.position.set(0, 1.27, 0.39);
  muzzle.scale.set(1.25, 0.58, 0.2);
  root.add(muzzle);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 22, 14), materials.white);
    eye.position.set(side * 0.17, 1.47, 0.39);
    eye.scale.set(1, 1.1, 0.45);
    root.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), materials.dark);
    pupil.position.set(side * 0.185, 1.455, 0.45);
    pupil.scale.set(1, 1, 0.36);
    root.add(pupil);
  }

  const mouth = smileMesh(materials.dark, 0.23, 0.055);
  mouth.name = "mouth";
  mouth.position.set(0, 1.245, 0.465);
  mouth.rotation.z = Math.PI;
  root.add(mouth);

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? "arm-left" : "arm-right";
    arm.position.set(side * 0.38, 1.04, 0.02);
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
    leg.position.set(side * 0.18, 0.34, 0.04);
    const foot = makeCapsule(0.075, 0.26, materials.dark, 8, 18);
    foot.position.y = -0.12;
    foot.rotation.x = Math.PI / 2;
    foot.rotation.z = side * 0.08;
    foot.castShadow = true;
    leg.add(foot);
    root.add(leg);
    root.userData.parts[side < 0 ? "leftLeg" : "rightLeg"] = leg;
  }

  addCharacterMotif(root, world, materials, root.userData.parts);

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
  turn = 0
}) {
  if (updateRiggedCharacter(model, {
    now,
    dt,
    mood,
    moving,
    solved,
    next,
    visible,
    turn
  })) return;
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

  model.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 1 - Math.pow(0.015, dt));
  model.position.y = idleLift + walkLift + cheer * Math.sin(time * 7.2) * 0.035;
  model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, turn, 1 - Math.pow(0.01, dt));
  model.rotation.z = Math.sin(time * 7.4) * 0.035 * walk + Math.sin(time * 2.1) * 0.025 * teach;

  if (parts.leftLeg) parts.leftLeg.rotation.x = Math.sin(time * 7.4) * 0.42 * walk;
  if (parts.rightLeg) parts.rightLeg.rotation.x = -Math.sin(time * 7.4) * 0.42 * walk;
  if (parts.leftArm) {
    parts.leftArm.rotation.z = 0.3 + Math.sin(time * 7.4 + Math.PI) * 0.22 * walk - cheer * 0.92;
    parts.leftArm.rotation.x = Math.sin(time * 4.7) * 0.1 * teach;
  }
  if (parts.rightArm) {
    parts.rightArm.rotation.z = -0.3 + Math.sin(time * 7.4) * 0.22 * walk + teach * (0.75 + Math.sin(time * 5.8) * 0.22) + cheer * 0.92;
    parts.rightArm.rotation.x = Math.sin(time * 5.1) * 0.1 * teach;
  }
  if (parts.tail) {
    parts.tail.rotation.y = 0.35 + Math.sin(time * (moving ? 6.4 : 2.2)) * 0.25;
  }
  if (parts.crown) {
    parts.crown.rotation.z = Math.sin(time * 2.5) * 0.08;
  }
  setCharacterOpacity(model, solved ? 0.68 : 1);
}

function buildTrailCharacters(scene, section, theme, creature) {
  const characters = {
    player: buildCharacterAvatar({
      palette: creaturePalette(creature),
      world: section.world,
      scale: 1.18,
      role: "player",
      phase: 0.2
    }),
    guide: buildCharacterAvatar({
      palette: residentPalette(section.world, 0),
      world: section.world,
      scale: 1.1,
      role: "guide",
      phase: 1.1
    }),
    residents: new Map()
  };

  characters.player.position.set(TRAIL_START.x, 0, TRAIL_START.z);
  characters.guide.position.set(section.guide.x, 0, section.guide.z);
  scene.add(characters.player);
  scene.add(characters.guide);

  section.encounters.forEach(encounter => {
    const resident = buildCharacterAvatar({
      palette: residentPalette(section.world, encounter.order + 1),
      world: section.world,
      scale: 1.06,
      role: "resident",
      phase: 1.8 + encounter.order * 0.73
    });
    resident.position.set(encounter.x, 0, encounter.z);
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
  beatIndex,
  solved,
  nextEncounter,
  mood,
  now,
  dt
}) {
  characters.player.position.x = player.x;
  characters.player.position.z = player.z;
  const turn = THREE.MathUtils.clamp(((target?.x ?? player.x) - player.x) * -0.24, -0.38, 0.38);
  updateCharacterMotion(characters.player, { now, dt, mood, moving, turn });

  const activeTask = active ? fieldTaskForBeat(section, active, active.beats[beatIndex], beatIndex) : null;
  const guideVisible = !guideDone || !active;
  updateCharacterMotion(characters.guide, {
    now,
    dt,
    mood: guideDone ? "idle" : "teach",
    next: !guideDone,
    visible: guideVisible,
    turn: 0.12
  });

  for (const encounter of section.encounters) {
    const resident = characters.residents.get(encounter.id);
    if (!resident) continue;
    const isSolved = solved.has(encounter.id);
    const isNext = nextEncounter?.id === encounter.id && guideDone;
    const isActive = active?.id === encounter.id;
    if (isActive && activeTask) {
      const itemMid = activeTask.items[Math.floor(activeTask.items.length / 2)] || encounter;
      resident.position.x = THREE.MathUtils.lerp(resident.position.x, itemMid.x - 1.35, 0.08);
      resident.position.z = THREE.MathUtils.lerp(resident.position.z, itemMid.z + 1.05, 0.08);
    } else {
      resident.position.x = THREE.MathUtils.lerp(resident.position.x, encounter.x, 0.08);
      resident.position.z = THREE.MathUtils.lerp(resident.position.z, encounter.z, 0.08);
    }
    updateCharacterMotion(resident, {
      now,
      dt,
      mood: isActive || isNext ? "teach" : isSolved ? "cheer" : "idle",
      solved: isSolved,
      next: isNext,
      visible: !active || isActive,
      turn: isActive ? -0.2 : isNext ? 0.2 : 0
    });
  }
}

function buildLandscape(scene, section, theme, quality) {
  const length = TRAIL_BOUNDS.startZ - TRAIL_BOUNDS.endZ + 18;
  const groundGeometry = new THREE.PlaneGeometry(34, length, 20, 96);
  const positions = groundGeometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    positions.setZ(index, Math.sin(x * 0.54) * 0.05 + Math.cos(y * 0.19) * 0.07);
  }
  groundGeometry.computeVertexNormals();
  const ground = new THREE.Mesh(
    groundGeometry,
    mat(theme.ground, {
      map: surfaceTexture(section.stopIndex * 47, { repeatX: 7, repeatY: 26, contrast: 28 }),
      roughness: 0.92,
      envMapIntensity: 0.42
    })
  );
  ground.name = "trail-ground";
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = (TRAIL_BOUNDS.startZ + TRAIL_BOUNDS.endZ) / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const points = [];
  for (let z = TRAIL_BOUNDS.startZ + 4; z >= TRAIL_BOUNDS.endZ - 4; z -= 4) {
    points.push({ x: trailCenterX(z, section.stopIndex), z });
  }
  scene.add(pathRibbon(points, 7.35, 0.075, theme.pathEdge, section.stopIndex * 13));
  scene.add(pathRibbon(points, 6.6, 0.105, theme.path, section.stopIndex * 17));

  // This belt is a load-safe fallback. Textured instanced trees replace it once
  // the glTF nature set is ready, so a network or GPU failure never removes the
  // readable collision wall around the route.
  const fallbackTrees = new THREE.Group();
  fallbackTrees.name = "fallback-tree-belt";
  scene.add(fallbackTrees);
  let treeIndex = 0;
  for (let z = TRAIL_BOUNDS.startZ + 2; z >= TRAIL_BOUNDS.endZ - 3; z -= 3.7) {
    const center = trailCenterX(z, section.stopIndex);
    const width = trailHalfWidth(z, section.stopIndex);
    for (const side of [-1, 1]) {
      for (let row = 0; row < quality.treeRows; row += 1) {
        const stagger = ((treeIndex + row * 3) % 5) * 0.18;
        const x = center + side * (width + 1.05 + row * 2.05 + stagger);
        const treeZ = z + (row % 2 ? 1.45 : 0) + Math.sin(treeIndex * 1.7) * 0.35;
        const size = 0.82 + ((treeIndex * 11 + row * 7) % 10) * 0.045;
        addTree(fallbackTrees, x, treeZ, size, theme, treeIndex + row);
      }
    }
    treeIndex += 1;
  }

  const rockMaterial = mat(theme.stone, { roughness: 0.9, flatShading: true });
  for (let index = 0; index < 18; index += 1) {
    const z = 3 - index * 7.1;
    const side = index % 2 ? 1 : -1;
    const x = trailCenterX(z, section.stopIndex) + side * (trailHalfWidth(z, section.stopIndex) - 0.25);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24 + (index % 3) * 0.07, 0), rockMaterial);
    rock.scale.y = 0.62;
    rock.position.set(x, 0.2, z);
    rock.rotation.y = index * 0.73;
    rock.castShadow = true;
    scene.add(rock);
  }

  buildKitDetails(scene, section, theme, quality);
  const landmark = buildSectionLandmark(scene, section, theme);
  const repairs = buildRepairMoments(scene, section, theme);
  const ambience = buildAmbientLife(scene, section, theme, quality);
  const actEvent = buildActEvent(scene, section, theme);
  const fieldTasks = buildFieldTasks(scene, section, theme);

  return {
    ground,
    fallbackTrees,
    gate: buildGate(scene, section, theme),
    landmark,
    repairs,
    ambience,
    actEvent,
    fieldTasks
  };
}

function projectElement(element, worldPosition, camera, viewport, { lift = 0, scale = 1, anchor = "-88%" } = {}) {
  if (!element) return;
  const point = new THREE.Vector3(worldPosition.x, lift, worldPosition.z);
  const distance = camera.position.distanceTo(point);
  point.project(camera);
  const visible = distance < 35 && point.z > -1 && point.z < 1 && Math.abs(point.x) < 1.08 && point.y < 0.78 && point.y > -1.15;
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
  onAnswer,
  onCheckpoint,
  onFinish,
  onQuit
}) {
  const stop = getStop(stopId);
  const [section] = useState(() => {
    const targets = targetsForStop(targetsAtStop(stopId), state.mastery, stop?.index || 1);
    const seed = (stop?.index || 1) * 1000 + (state.trail.stopsDone.length || 0);
    return buildTrailSection(stopId, { mastery: state.mastery, targets, seed });
  });
  const theme = WORLD_THEMES[section?.world] || WORLD_THEMES.meadow;

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
    clampTrailPosition(resume?.position || TRAIL_START, section?.stopIndex, initialLimit)
  ));
  const resumedActive = section?.encounters.find(encounter => encounter.id === resume?.activeId && !initialSolved.includes(encounter.id)) || null;
  const initialBeatIndex = Math.max(0, Math.min((resumedActive?.beats.length || 1) - 1, Number(resume?.beatIndex) || 0));
  const initialTally = resume?.tally && typeof resume.tally === "object"
    ? { correct: Number(resume.tally.correct) || 0, total: Number(resume.tally.total) || 0, mistakes: Number(resume.tally.mistakes) || 0 }
    : { correct: 0, total: 0, mistakes: 0 };
  const initialPhase = resume?.phase === "teach" && !initialGuideDone ? "teach" : "trail";
  const initialGateOpen = section?.encounters.every(encounter => initialSolved.includes(encounter.id)) || false;
  const initialRoutePercent = Math.round(trailProgress(initialPosition.z) * 100);

  const playerRef = useRef({ ...initialPosition });
  const targetRef = useRef({ ...initialPosition });
  const solvedRef = useRef(new Set(initialSolved));
  const pickedRef = useRef(new Set(initialPicked));
  const guideDoneRef = useRef(initialGuideDone);
  const meetIndexRef = useRef(initialMeetIndex);
  const selectedRef = useRef(null);
  const activeRef = useRef(resumedActive);
  const beatIndexRef = useRef(initialBeatIndex);
  const phaseRef = useRef(initialPhase);
  const tallyRef = useRef(initialTally);
  const lastCorrectRef = useRef(resumedActive?.kind === "story-rock");
  const onCheckpointRef = useRef(onCheckpoint);
  const finishingRef = useRef(false);
  const fieldTaskSelectRef = useRef(null);
  const fieldChoiceLockRef = useRef(false);

  const [phase, setPhase] = useState(initialPhase);
  const [guideDone, setGuideDone] = useState(initialGuideDone);
  const [meetIndex, setMeetIndex] = useState(initialMeetIndex);
  const [solved, setSolved] = useState(() => new Set(initialSolved));
  const [picked, setPicked] = useState(() => new Set(initialPicked));
  const [selectedId, setSelectedId] = useState(null);
  const [active, setActive] = useState(resumedActive);
  const [beatIndex, setBeatIndex] = useState(initialBeatIndex);
  const [retryNonce, setRetryNonce] = useState(0);
  const [mood, setMood] = useState("idle");
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [gateOpen, setGateOpen] = useState(initialGateOpen);
  const [routePercent, setRoutePercent] = useState(initialRoutePercent);

  const canvasRef = useRef(null);
  const sceneGenerationRef = useRef(0);
  const guideRef = useRef(null);
  const landmarkRefs = useRef(new Map());
  const dropRefs = useRef(new Map());
  const moodRef = useRef("idle");

  const setTrailMood = useCallback(nextMood => {
    moodRef.current = nextMood;
    setMood(nextMood);
  }, []);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { onCheckpointRef.current = onCheckpoint; }, [onCheckpoint]);
  useEffect(() => { meetIndexRef.current = meetIndex; }, [meetIndex]);
  useEffect(() => { beatIndexRef.current = beatIndex; }, [beatIndex]);
  useEffect(() => { moodRef.current = mood; }, [mood]);

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
    targetRef.current = clampTrailPosition({ x: encounter.x, z: encounter.z + 0.8 }, section.stopIndex, limit);
    if (isSoundEnabled) playWhoosh();
  }, [isSoundEnabled, section]);

  const cuePhysicalTask = useCallback((encounter, index = 0) => {
    if (!isSoundEnabled) return;
    const beat = encounter?.beats?.[index];
    if (!isPhysicalFieldTask(encounter, beat)) return;
    if (encounter.kind === "flower-patch" || encounter.kind === "hungry-beast") {
      sayGrapheme(beat.target, true);
    } else if (encounter.kind === "word-beast") {
      sayWord(beat.word, true);
    }
  }, [isSoundEnabled]);

  useEffect(() => {
    if (!section || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    sceneGenerationRef.current += 1;
    canvas.dataset.sceneGeneration = String(sceneGenerationRef.current);
    const quality = chooseTrailQuality();
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => setSceneError(true));
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.76 + (section.lighting?.glow || 0.5) * 0.05;
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const lightMood = section.lighting || { glow: 0.5, warmth: 0.3 };
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.Fog(theme.fog, 15 + lightMood.warmth * 2, 38 + lightMood.glow * 7);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 95);
    camera.position.set(initialPosition.x, 4.05, initialPosition.z + 6.45);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    const landscape = buildLandscape(scene, section, theme, quality);
    const characters = buildTrailCharacters(scene, section, theme, state.creature);

    scene.add(new THREE.HemisphereLight(theme.hemi, theme.ground, 0.72 + lightMood.glow * 0.34));
    const sun = new THREE.DirectionalLight(theme.sun, 1.18 + lightMood.glow * 0.48);
    sun.position.set(-7 + lightMood.warmth * 3, 13 + lightMood.glow * 2, 8 - lightMood.warmth * 2);
    sun.castShadow = quality.shadows;
    sun.shadow.mapSize.set(quality.shadows ? 1024 : 256, quality.shadows ? 1024 : 256);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    const rim = new THREE.DirectionalLight(theme.glow, 0.34 + lightMood.glow * 0.32);
    rim.position.set(5, 4.6, -7);
    scene.add(rim);

    let composer = null;
    try {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const effects = [
        new BloomEffect({
          intensity: 0.1 + lightMood.glow * 0.08,
          luminanceThreshold: 0.78,
          luminanceSmoothing: 0.38,
          mipmapBlur: true
        }),
        new VignetteEffect({ darkness: 0.18, offset: 0.25 })
      ];
      if (quality.postEffects) effects.unshift(new SMAAEffect());
      composer.addPass(new EffectPass(camera, ...effects));
    } catch {
      composer = null;
    }

    const viewport = { width: 1, height: 1 };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      viewport.width = Math.max(1, rect.width);
      viewport.height = Math.max(1, rect.height);
      renderer.setSize(viewport.width, viewport.height, false);
      composer?.setSize(viewport.width, viewport.height);
      camera.aspect = viewport.width / viewport.height;
      camera.updateProjectionMatrix();
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
    let visualAssetsSettled = false;
    let assetsDisposed = false;
    let importedNature = null;
    let previous = performance.now();
    let wasMoving = false;
    let lastAutosave = performance.now();
    let lastPercent = Math.round(trailProgress(playerRef.current.z) * 100);
    let gateAmount = section.encounters.every(encounter => solvedRef.current.has(encounter.id)) ? 1 : 0;
    const lookTarget = new THREE.Vector3(playerRef.current.x, 1.02, playerRef.current.z - 0.18);
    camera.lookAt(lookTarget);

    const revealScene = () => {
      if (readySent || assetsDisposed || !firstFrameRendered || !visualAssetsSettled) return;
      readySent = true;
      setSceneReady(true);
    };

    const disposeCharacterSet = set => {
      disposeAssetObject(set?.player);
      disposeAssetObject(set?.guide);
      for (const resident of set?.residents?.values?.() || []) disposeAssetObject(resident);
    };

    const replaceCharacter = (current, replacement) => {
      if (!replacement) return current;
      replacement.position.copy(current.position);
      replacement.rotation.copy(current.rotation);
      replacement.visible = current.visible;
      scene.remove(current);
      disposeAssetObject(current);
      scene.add(replacement);
      return replacement;
    };

    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const characterLoad = createRiggedTrailCharacters(section, {
      playerTint: creaturePalette(state.creature).skin,
      maxAnisotropy,
      compact: window.innerWidth < 640
    }).then(nextCharacters => {
      if (assetsDisposed) {
        disposeCharacterSet(nextCharacters);
        return;
      }
      characters.player = replaceCharacter(characters.player, nextCharacters.player);
      characters.guide = replaceCharacter(characters.guide, nextCharacters.guide);
      for (const [encounterId, replacement] of nextCharacters.residents) {
        const current = characters.residents.get(encounterId);
        if (current) characters.residents.set(encounterId, replaceCharacter(current, replacement));
        else disposeAssetObject(replacement);
      }
    }).catch(() => undefined);

    const natureLoad = createImportedNature(section, theme, quality, { maxAnisotropy })
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
      })
      .catch(() => undefined);

    const visualAssetTimeout = window.setTimeout(() => {
      visualAssetsSettled = true;
      revealScene();
    }, 3600);
    Promise.allSettled([characterLoad, natureLoad]).then(() => {
      if (assetsDisposed) return;
      window.clearTimeout(visualAssetTimeout);
      visualAssetsSettled = true;
      revealScene();
    });

    const currentLimit = () => forwardLimitFor(section, {
      guideDone: guideDoneRef.current,
      solved: solvedRef.current
    });

    const onPointer = event => {
      if (phaseRef.current !== "trail") return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const currentActive = activeRef.current;
      if (currentActive) {
        const task = landscape.fieldTasks.get(fieldTaskKey(currentActive, beatIndexRef.current));
        if (task?.group.visible && !fieldChoiceLockRef.current) {
          const hit = raycaster.intersectObjects(task.items, true)[0];
          let node = hit?.object || null;
          while (node && !node.userData.fieldChoice) node = node.parent;
          if (node?.userData.fieldChoice) {
            fieldTaskSelectRef.current?.(node.userData.fieldChoice);
            return;
          }
        }
        return;
      }

      const hit = raycaster.intersectObject(landscape.ground, false)[0];
      if (!hit) return;
      selectedRef.current = null;
      setSelectedId(null);
      targetRef.current = clampTrailPosition(hit.point, section.stopIndex, currentLimit());
    };

    const onKeyDown = event => {
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
      activeRef.current = encounter;
      selectedRef.current = null;
      targetRef.current = { ...playerRef.current };
      beatIndexRef.current = 0;
      fieldChoiceLockRef.current = false;
      lastCorrectRef.current = encounter.kind === "story-rock";
      setSelectedId(null);
      setBeatIndex(0);
      setActive(encounter);
      cuePhysicalTask(encounter, 0);
      checkpoint({ active: encounter, beatIndex: 0, phase: "trail" });
    };

    const animate = now => {
      const dt = Math.min(0.045, (now - previous) / 1000);
      previous = now;
      const player = playerRef.current;
      let moving = false;
      const physicalBeat = activeRef.current?.beats?.[beatIndexRef.current];
      const physicalTaskActive = isPhysicalFieldTask(activeRef.current, physicalBeat) && !fieldChoiceLockRef.current;

      if (phaseRef.current === "trail" && (!activeRef.current || physicalTaskActive) && !finishingRef.current) {
        let dx = 0;
        let dz = 0;
        if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
        if (keys.has("arrowright") || keys.has("d")) dx += 1;
        if (keys.has("arrowup") || keys.has("w")) dz -= 1;
        if (keys.has("arrowdown") || keys.has("s")) dz += 1;

        if (dx || dz) {
          const length = Math.hypot(dx, dz);
          const next = clampTrailPosition({
            x: player.x + (dx / length) * MOVE_SPEED * dt,
            z: player.z + (dz / length) * MOVE_SPEED * dt
          }, section.stopIndex, currentLimit());
          Object.assign(player, next);
          targetRef.current = { ...player };
          selectedRef.current = null;
          moving = true;
        } else {
          const tx = targetRef.current.x - player.x;
          const tz = targetRef.current.z - player.z;
          const distance = Math.hypot(tx, tz);
          if (distance > 0.04) {
            const step = Math.min(distance, MOVE_SPEED * dt);
            const next = clampTrailPosition({
              x: player.x + (tx / distance) * step,
              z: player.z + (tz / distance) * step
            }, section.stopIndex, currentLimit());
            Object.assign(player, next);
            moving = true;
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
          ? landscape.fieldTasks.get(fieldTaskKey(activeRef.current, beatIndexRef.current))
          : null;
        if (activeTask?.group.visible && !fieldChoiceLockRef.current) {
          const foundItem = activeTask.items.find(item => (
            Math.hypot(item.position.x - player.x, item.position.z - player.z) < FIELD_OBJECT_REACH
          ));
          if (foundItem?.userData.fieldChoice) {
            fieldTaskSelectRef.current?.(foundItem.userData.fieldChoice);
            moving = false;
          }
        }

        const foundDrop = section.drops.find(drop => (
          !pickedRef.current.has(drop.id)
          && Math.hypot(drop.x - player.x, drop.z - player.z) < 0.72
        ));
        if (foundDrop) {
          const next = new Set([...pickedRef.current, foundDrop.id]);
          pickedRef.current = next;
          setPicked(next);
          if (isSoundEnabled) playStarChime();
          checkpoint({ picked: next });
        }

        const allSolved = section.encounters.every(encounter => solvedRef.current.has(encounter.id));
        if (allSolved && player.z <= TRAIL_EXIT_Z + 0.15) {
          finishingRef.current = true;
          targetRef.current = { ...player };
          checkpoint();
          const score = tallyRef.current;
          const stars = starRubric({ correct: score.correct, total: score.total, mistakes: score.mistakes, deaths: 0 });
          onFinish?.(stars, { ...score, drops: pickedRef.current.size });
        }
      }

      if (moving !== wasMoving) {
        wasMoving = moving;
        setTrailMood(moving ? "walk" : "idle");
      }

      if (moving && now - lastAutosave >= AUTOSAVE_MS) {
        lastAutosave = now;
        checkpoint();
      }

      const percent = Math.round(trailProgress(player.z) * 100);
      if (percent !== lastPercent && percent % 2 === 0) {
        lastPercent = percent;
        setRoutePercent(percent);
      }

      const allSolved = section.encounters.every(encounter => solvedRef.current.has(encounter.id));
      gateAmount = THREE.MathUtils.lerp(gateAmount, allSolved ? 1 : 0, 1 - Math.pow(0.003, dt));
      landscape.gate.left.rotation.y = -gateAmount * 1.33;
      landscape.gate.right.rotation.y = gateAmount * 1.33;

      for (const item of landscape.ambience) updateAmbientLife(item, now);
      for (const repair of landscape.repairs) updateRepairMoment(repair, solvedRef.current.has(repair.id), dt, now);
      updateActEvent(landscape.actEvent, now);

      let focus = new THREE.Vector3(player.x, 1.02, player.z - 0.18);
      let desiredCamera = new THREE.Vector3(player.x, 4.05, player.z + 6.45);
      const currentActive = activeRef.current;
      if (phaseRef.current === "teach") {
        focus = new THREE.Vector3(section.guide.x, 1.28, section.guide.z);
        desiredCamera = new THREE.Vector3(section.guide.x - 1.7, 4.35, section.guide.z + 6.6);
      } else if (currentActive) {
        const side = currentActive.order % 2 === 0 ? 1 : -1;
        focus = new THREE.Vector3(currentActive.x, 1.12, currentActive.z);
        desiredCamera = new THREE.Vector3(currentActive.x + side * 2.05, 4.35, currentActive.z + 6.25);
      } else if (allSolved && player.z < TRAIL_GATE_Z + 19) {
        focus = new THREE.Vector3(section.gate.x, 1.45, section.gate.z);
        desiredCamera = new THREE.Vector3(player.x, 11.6, player.z + 12.4);
      } else {
        const nextFocus = !guideDoneRef.current
          ? section.guide
          : firstUnsolvedEncounter(section, solvedRef.current);
        if (nextFocus && Math.abs(player.z - nextFocus.z) < 14) {
          focus = new THREE.Vector3(
            player.x * 0.68 + nextFocus.x * 0.32,
            0.95,
            (player.z - 0.18) * 0.72 + nextFocus.z * 0.28
          );
          desiredCamera = new THREE.Vector3(player.x, 4.25, player.z + 6.7);
        }
      }
      camera.position.lerp(desiredCamera, 1 - Math.pow(0.002, dt));
      lookTarget.lerp(focus, 1 - Math.pow(0.004, dt));
      camera.lookAt(lookTarget);
      updateFieldTasks(landscape.fieldTasks, activeRef.current, beatIndexRef.current, now, camera);
      updateTrailCharacters(characters, section, {
        player,
        target: targetRef.current,
        moving,
        guideDone: guideDoneRef.current,
        active: activeRef.current,
        beatIndex: beatIndexRef.current,
        solved: solvedRef.current,
        nextEncounter: firstUnsolvedEncounter(section, solvedRef.current),
        mood: moodRef.current,
        now,
        dt
      });
      updateImportedNature(importedNature, now);

      projectElement(guideRef.current, section.guide, camera, viewport, { lift: 1.65, scale: 0.72, anchor: "-20%" });
      for (const encounter of section.encounters) {
        projectElement(landmarkRefs.current.get(encounter.id), encounter, camera, viewport, { lift: 1.58, scale: 0.78, anchor: "-20%" });
      }
      for (const drop of section.drops) {
        projectElement(dropRefs.current.get(drop.id), drop, camera, viewport, { lift: 0.36, scale: 0.48, anchor: "-50%" });
      }

      if (composer) composer.render(dt);
      else renderer.render(scene, camera);
      firstFrameRendered = true;
      revealScene();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      assetsDisposed = true;
      window.clearTimeout(visualAssetTimeout);
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      scene.traverse(object => {
        object.geometry?.dispose?.();
        const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
        materials.forEach(material => {
          if (material.map?.userData.questSurface) material.map.dispose();
          material.dispose();
        });
      });
      composer?.dispose?.();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [
    section,
    theme,
    state.creature,
    initialPosition.x,
    initialPosition.z,
    isSoundEnabled,
    checkpoint,
    onFinish,
    cuePhysicalTask,
    setTrailMood
  ]);

  const answer = (correct, target) => {
    lastCorrectRef.current = correct;
    tallyRef.current.total += 1;
    if (correct) tallyRef.current.correct += 1;
    else tallyRef.current.mistakes += 1;
    setTrailMood(correct ? "cheer" : "sad");
    if (target == null) return;
    for (const one of Array.isArray(target) ? target : [target]) {
      if (one) onAnswer?.(one, correct, activeRef.current?.kind || "trail");
    }
  };

  const nextBeat = () => {
    const current = activeRef.current;
    if (!current) return;
    // The final helper owns the physical gate. A miss gets another friendly try
    // at the same beat; there is no extra boss quiz and no permanent failure.
    if (current.atGate && !lastCorrectRef.current) {
      fieldChoiceLockRef.current = false;
      setRetryNonce(value => value + 1);
      setTrailMood("idle");
      cuePhysicalTask(current, beatIndexRef.current);
      checkpoint({ active: current, beatIndex: beatIndexRef.current });
      return;
    }
    if (beatIndexRef.current + 1 < current.beats.length) {
      const nextIndex = beatIndexRef.current + 1;
      beatIndexRef.current = nextIndex;
      fieldChoiceLockRef.current = false;
      lastCorrectRef.current = current.kind === "story-rock";
      setBeatIndex(nextIndex);
      cuePhysicalTask(current, nextIndex);
      checkpoint({ active: current, beatIndex: nextIndex });
      return;
    }

    const nextSolved = new Set([...solvedRef.current, current.id]);
    solvedRef.current = nextSolved;
    activeRef.current = null;
    beatIndexRef.current = 0;
    fieldChoiceLockRef.current = false;
    setSolved(nextSolved);
    setActive(null);
    setBeatIndex(0);
    setTrailMood("cheer");
    checkpoint({ solved: nextSolved, active: null, beatIndex: 0, phase: "trail" });

    if (section.encounters.every(encounter => nextSolved.has(encounter.id))) {
      setGateOpen(true);
      if (isSoundEnabled) playWhoosh();
    }
  };

  useEffect(() => {
    fieldTaskSelectRef.current = choice => {
      if (!choice || fieldChoiceLockRef.current) return;
      const current = activeRef.current;
      const beat = current?.beats?.[beatIndexRef.current];
      if (!isPhysicalFieldTask(current, beat)) return;
      fieldChoiceLockRef.current = true;
      const right = Boolean(choice.correct);
      answer(right, beat.target);
      if (isSoundEnabled) (right ? playCorrectChime : playSoftBuzz)();
      window.setTimeout(nextBeat, right ? 640 : 980);
    };
  });

  if (!section) return null;
  const View = active ? ENCOUNTER_VIEWS[active.kind] : null;
  const teach = section.teach[meetIndex];
  const nextEncounter = firstUnsolvedEncounter(section, solved);
  const sectionNumber = stop?.index || 1;
  const activeFieldTask = active ? fieldTaskForBeat(section, active, active.beats[beatIndex], beatIndex) : null;

  const leaveWorld = () => {
    checkpoint();
    onQuit?.();
  };

  const moveToNext = () => {
    if (gateOpen) {
      targetRef.current = clampTrailPosition(section.exit, section.stopIndex, TRAIL_BOUNDS.endZ);
      if (isSoundEnabled) playWhoosh();
      return;
    }
    if (!guideDone) {
      targetRef.current = clampTrailPosition(
        { x: section.guide.x, z: section.guide.z + 0.8 },
        section.stopIndex,
        forwardLimitFor(section)
      );
      return;
    }
    if (nextEncounter) moveToEncounter(nextEncounter);
  };

  return (
    <main
      className={`q-screen qh-root${sceneReady ? " is-ready" : ""}${sceneError ? " has-fallback" : ""}`}
      data-world={section.world}
      data-variant={section.variant?.id || section.world}
      data-light={section.lighting?.id || "trailLight"}
      data-event={section.event?.mode || "section"}
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
            ref={node => { if (node) dropRefs.current.set(drop.id, node); else dropRefs.current.delete(drop.id); }}
            className={`qh-drop${picked.has(drop.id) ? " is-picked" : ""}`}
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
              ref={node => { if (node) landmarkRefs.current.set(encounter.id, node); else landmarkRefs.current.delete(encounter.id); }}
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
            targetRef.current = clampTrailPosition({ x: section.guide.x, z: section.guide.z + 0.8 }, section.stopIndex, forwardLimitFor(section));
          }}
          aria-label={guideDone ? `${section.guide.friend} taught the new sounds` : `Meet ${section.guide.friend}`}
        >
          {!guideDone && <span className="qh-beacon" aria-hidden="true">!</span>}
          <span className="qh-resident-chip">{section.guide.friend}</span>
        </button>
      </div>

      <header className="qh-hud">
        <button type="button" className="q-ghost qh-leave" onClick={leaveWorld}>Back to the Den</button>
        <div className="qh-land-title">
          <span>{stop?.name || theme.name}</span>
          <strong>Trail {sectionNumber} of {QUEST_STOPS.length}</strong>
        </div>
        <div className="qh-drops" aria-label={`${picked.size} sparks found`}>
          <img src="/images/quest/props/sun-drop.webp" alt="" />
          <span>{picked.size}</span>
        </div>
      </header>

      <div className="qh-route-meter" aria-label={`${routePercent}% through this trail`}>
        <span style={{ "--qh-progress": `${routePercent}%` }} />
      </div>

      {phase === "trail" && !active && (
        <button type="button" className={`qh-next-call${gateOpen ? " is-gate" : ""}`} onClick={moveToNext} aria-live="polite">
          {gateOpen ? (
            <><strong>The gate is open</strong><span>Walk through to the next trail</span></>
          ) : !guideDone ? (
            <><strong>{section.guide.friend} is waiting</strong><span>Follow the path</span></>
          ) : nextEncounter ? (
            <><strong>{nextEncounter.friend} needs help</strong><span>{nextEncounter.label}</span></>
          ) : null}
        </button>
      )}

      {phase === "teach" && teach && (
        <Guide
          key={teach.id}
          world={section.world}
          entry={teach}
          isSoundEnabled={isSoundEnabled}
          last={meetIndex + 1 >= section.teach.length}
          onNext={() => {
            if (meetIndex + 1 < section.teach.length) {
              const nextIndex = meetIndex + 1;
              meetIndexRef.current = nextIndex;
              setMeetIndex(nextIndex);
              checkpoint({ phase: "teach", meetIndex: nextIndex });
            } else {
              guideDoneRef.current = true;
              setGuideDone(true);
              phaseRef.current = "trail";
              setPhase("trail");
              checkpoint({ phase: "trail", guideDone: true });
            }
          }}
        />
      )}

      {activeFieldTask && (
        <div className="qh-field-hud" aria-live="polite">
          <span>with {active.friend} in the scene</span>
          <strong>{activeFieldTask.prompt}</strong>
          <em>{activeFieldTask.help}</em>
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
            onBeat={answer}
            onDone={nextBeat}
          />
        </div>
      )}
    </main>
  );
}
