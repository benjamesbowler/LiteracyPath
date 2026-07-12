// SOUND SEEKERS TRAIL - a long guided journey with room to roam.
//
// Three.js owns the path, forest walls, camera, and gate. React owns the
// illustrated creature, friends, collectibles, and phonics encounters. Only the
// next story encounter is active, so the 40-stop curriculum stays coherent
// without making movement feel like a side-scrolling level.

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import CreatureFigure from "../CreatureFigure.jsx";
import Guide from "./Guide.jsx";
import Prop from "./Prop.jsx";
import { ENCOUNTER_VIEWS } from "./encounterViews.js";
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
import { playStarChime, playWhoosh } from "../../../utils/audio/gameSfx.js";

const MOVE_SPEED = 4.6;
const ENCOUNTER_REACH = 1.7;
const AUTOSAVE_MS = 1200;

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

function pathRibbon(points, width, y, color) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(point => new THREE.Vector3(point.x, y, point.z)),
    false,
    "catmullrom",
    0.34
  );
  const steps = 150;
  const vertices = [];
  const indices = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
    vertices.push(point.x + side.x, y, point.z + side.z, point.x - side.x, y, point.z - side.z);
    if (index < steps) {
      const a = index * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide })
  );
  mesh.receiveShadow = true;
  return mesh;
}

function addTree(scene, x, z, size, theme, shade = 0) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * size, 0.24 * size, 1.35 * size, 7),
    new THREE.MeshStandardMaterial({ color: theme.trunk, roughness: 1, flatShading: true })
  );
  trunk.position.set(x, 0.65 * size, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.88 * size, 0),
    new THREE.MeshStandardMaterial({ color: theme.canopy[shade % theme.canopy.length], roughness: 0.95, flatShading: true })
  );
  crown.scale.set(1, 1.2, 1);
  crown.position.set(x, 1.65 * size, z);
  crown.castShadow = true;
  scene.add(crown);
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
    ambientScale: low ? 0.55 : 1
  };
}

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.94, flatShading: true, ...options });
}

function glowMat(color, opacity = 0.42) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity,
    roughness: 0.45,
    flatShading: true
  });
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
  const wood = new THREE.MeshStandardMaterial({ color: theme.gate, roughness: 0.92, flatShading: true });
  const cap = new THREE.MeshStandardMaterial({ color: theme.pathEdge, roughness: 1, flatShading: true });

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
  for (let z = TRAIL_BOUNDS.startZ - 6; z >= TRAIL_BOUNDS.endZ + 5; z -= quality.decorationStep) {
    const side = index % 2 === 0 ? -1 : 1;
    const point = pathSidePoint(section, z, side, 1.1 + (index % 3) * 0.42);
    if (section.world === "meadow") {
      if (index % 5 === 0) addCottage(scene, section, z, side, theme);
      else if (index % 3 === 0) addFence(scene, section, z, side, theme, 5);
      else addTree(scene, point.x, point.z, 0.72 + (index % 4) * 0.08, theme, index);
    } else if (section.world === "dino") {
      if (index % 5 === 0) addBoneArch(scene, point.x, point.z, theme, 0.72);
      else if (index % 4 === 0) addTarPool(scene, point.x, point.z, theme, 0.7);
      else {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34 + (index % 3) * 0.08, 0), mat(theme.stone));
        rock.scale.set(1.2, 0.68, 0.82);
        rock.position.set(point.x, 0.22, point.z);
        rock.rotation.y = index * 0.63;
        rock.castShadow = true;
        scene.add(rock);
      }
    } else {
      if (index % 5 === 0) addLanternTree(scene, point.x, point.z, theme, 0.72);
      else if (index % 3 === 0) addCrystalCluster(scene, point.x, point.z, theme, 0.7);
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
    new THREE.MeshStandardMaterial({ color: theme.ground, roughness: 1, flatShading: true })
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
  scene.add(pathRibbon(points, 7.35, 0.075, theme.pathEdge));
  scene.add(pathRibbon(points, 6.6, 0.105, theme.path));

  // The two dense tree belts are both scenery and the readable collision wall.
  // Several staggered rows stop the route reading as a thin road on a flat map.
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
        addTree(scene, x, treeZ, size, theme, treeIndex + row);
      }
    }
    treeIndex += 1;
  }

  const rockMaterial = new THREE.MeshStandardMaterial({ color: theme.stone, roughness: 1, flatShading: true });
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

  return { ground, gate: buildGate(scene, section, theme), landmark, repairs, ambience, actEvent };
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
  const initialPosition = clampTrailPosition(resume?.position || TRAIL_START, section?.stopIndex, initialLimit);
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
  const playerElementRef = useRef(null);
  const guideRef = useRef(null);
  const landmarkRefs = useRef(new Map());
  const dropRefs = useRef(new Map());

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { onCheckpointRef.current = onCheckpoint; }, [onCheckpoint]);
  useEffect(() => { meetIndexRef.current = meetIndex; }, [meetIndex]);
  useEffect(() => { beatIndexRef.current = beatIndex; }, [beatIndex]);

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
      checkpoint();
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

  useEffect(() => {
    if (!section || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
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
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const lightMood = section.lighting || { glow: 0.5, warmth: 0.3 };
    scene.fog = new THREE.Fog(theme.fog, 15 + lightMood.warmth * 2, 38 + lightMood.glow * 7);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 95);
    const landscape = buildLandscape(scene, section, theme, quality);

    scene.add(new THREE.HemisphereLight(theme.hemi, theme.ground, 1.9 + lightMood.glow * 0.8));
    const sun = new THREE.DirectionalLight(theme.sun, 2.65 + lightMood.glow * 1.35);
    sun.position.set(-7 + lightMood.warmth * 3, 13 + lightMood.glow * 2, 8 - lightMood.warmth * 2);
    sun.castShadow = quality.shadows;
    sun.shadow.mapSize.set(quality.shadows ? 1024 : 256, quality.shadows ? 1024 : 256);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    const viewport = { width: 1, height: 1 };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      viewport.width = Math.max(1, rect.width);
      viewport.height = Math.max(1, rect.height);
      renderer.setSize(viewport.width, viewport.height, false);
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
    let previous = performance.now();
    let wasMoving = false;
    let lastAutosave = performance.now();
    let lastPercent = Math.round(trailProgress(playerRef.current.z) * 100);
    let gateAmount = section.encounters.every(encounter => solvedRef.current.has(encounter.id)) ? 1 : 0;
    const lookTarget = new THREE.Vector3(playerRef.current.x, 0.2, playerRef.current.z - 4.1);

    const currentLimit = () => forwardLimitFor(section, {
      guideDone: guideDoneRef.current,
      solved: solvedRef.current
    });

    const onPointer = event => {
      if (phaseRef.current !== "trail" || activeRef.current) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
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
      lastCorrectRef.current = encounter.kind === "story-rock";
      setSelectedId(null);
      setBeatIndex(0);
      setActive(encounter);
      checkpoint({ active: encounter, beatIndex: 0, phase: "trail" });
    };

    const animate = now => {
      const dt = Math.min(0.045, (now - previous) / 1000);
      previous = now;
      const player = playerRef.current;
      let moving = false;

      if (phaseRef.current === "trail" && !activeRef.current && !finishingRef.current) {
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
        } else if (guideDoneRef.current) {
          const nextEncounter = firstUnsolvedEncounter(section, solvedRef.current);
          if (nextEncounter && Math.hypot(nextEncounter.x - player.x, nextEncounter.z - player.z) <= ENCOUNTER_REACH) {
            beginEncounter(nextEncounter);
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
        setMood(moving ? "walk" : "idle");
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

      let focus = new THREE.Vector3(player.x, 0.2, player.z - 4.1);
      let desiredCamera = new THREE.Vector3(player.x, 8.8, player.z + 9.6);
      const currentActive = activeRef.current;
      if (phaseRef.current === "teach") {
        focus = new THREE.Vector3(section.guide.x, 0.85, section.guide.z);
        desiredCamera = new THREE.Vector3(section.guide.x - 2.4, 6.4, section.guide.z + 7.4);
      } else if (currentActive) {
        const side = currentActive.order % 2 === 0 ? 1 : -1;
        focus = new THREE.Vector3(currentActive.x, 0.9, currentActive.z);
        desiredCamera = new THREE.Vector3(currentActive.x + side * 2.7, 5.9, currentActive.z + 6.5);
      } else if (allSolved && player.z < TRAIL_GATE_Z + 19) {
        focus = new THREE.Vector3(section.gate.x, 1.45, section.gate.z);
        desiredCamera = new THREE.Vector3(player.x, 11.6, player.z + 12.4);
      } else {
        const nextFocus = !guideDoneRef.current
          ? section.guide
          : firstUnsolvedEncounter(section, solvedRef.current);
        if (nextFocus && Math.abs(player.z - nextFocus.z) < 20) {
          focus = new THREE.Vector3(
            player.x * 0.55 + nextFocus.x * 0.45,
            0.45,
            (player.z - 4.1) * 0.58 + nextFocus.z * 0.42
          );
          desiredCamera = new THREE.Vector3(player.x, 9.5, player.z + 10.3);
        }
      }
      camera.position.lerp(desiredCamera, 1 - Math.pow(0.002, dt));
      lookTarget.lerp(focus, 1 - Math.pow(0.004, dt));
      camera.lookAt(lookTarget);

      projectElement(playerElementRef.current, player, camera, viewport, { lift: 0.26, scale: 0.88, anchor: "-76%" });
      projectElement(guideRef.current, section.guide, camera, viewport, { lift: 0.36, scale: 0.78 });
      for (const encounter of section.encounters) {
        projectElement(landmarkRefs.current.get(encounter.id), encounter, camera, viewport, { lift: 0.24, scale: 0.88 });
      }
      for (const drop of section.drops) {
        projectElement(dropRefs.current.get(drop.id), drop, camera, viewport, { lift: 0.36, scale: 0.48, anchor: "-50%" });
      }

      renderer.render(scene, camera);
      if (!readySent) {
        readySent = true;
        setSceneReady(true);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      scene.traverse(object => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
    };
  }, [section, theme, isSoundEnabled, checkpoint, onFinish]);

  const answer = (correct, target) => {
    lastCorrectRef.current = correct;
    tallyRef.current.total += 1;
    if (correct) tallyRef.current.correct += 1;
    else tallyRef.current.mistakes += 1;
    setMood(correct ? "cheer" : "sad");
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
      setRetryNonce(value => value + 1);
      setMood("idle");
      checkpoint({ active: current, beatIndex: beatIndexRef.current });
      return;
    }
    if (beatIndexRef.current + 1 < current.beats.length) {
      const nextIndex = beatIndexRef.current + 1;
      beatIndexRef.current = nextIndex;
      lastCorrectRef.current = current.kind === "story-rock";
      setBeatIndex(nextIndex);
      checkpoint({ active: current, beatIndex: nextIndex });
      return;
    }

    const nextSolved = new Set([...solvedRef.current, current.id]);
    solvedRef.current = nextSolved;
    activeRef.current = null;
    beatIndexRef.current = 0;
    setSolved(nextSolved);
    setActive(null);
    setBeatIndex(0);
    setMood("cheer");
    checkpoint({ solved: nextSolved, active: null, beatIndex: 0, phase: "trail" });

    if (section.encounters.every(encounter => nextSolved.has(encounter.id))) {
      setGateOpen(true);
      if (isSoundEnabled) playWhoosh();
    }
  };

  if (!section) return null;
  const View = active ? ENCOUNTER_VIEWS[active.kind] : null;
  const teach = section.teach[meetIndex];
  const nextEncounter = firstUnsolvedEncounter(section, solved);
  const sectionNumber = stop?.index || 1;

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
      data-light={section.lighting?.id || "trailLight"}
      data-event={section.event?.mode || "section"}
      style={{
        "--qh-backdrop": `url(/images/quest/${section.world}/sky.webp)`,
        "--qh-glow": section.lighting?.glow ?? 0.5
      }}
    >
      <canvas ref={canvasRef} className="qh-canvas" aria-label={`Follow the trail through ${theme.name}`} tabIndex="0" />

      {!sceneReady && !sceneError && <div className="qh-loading" aria-live="polite">Opening the trail...</div>}

      <div className="qh-world-layer" aria-hidden={phase !== "trail" || Boolean(active)}>
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
              <img className="qh-friend" src={`/images/quest/props/guide-${section.world}.webp`} alt="" draggable="false" />
              <Prop kind={encounter.kind} done={isSolved} />
              {isNext && <span className="qh-beacon" aria-hidden="true">?</span>}
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
          <img src={`/images/quest/props/guide-${section.world}.webp`} alt="" draggable="false" />
          <span>{section.guide.friend}</span>
        </button>

        <div ref={playerElementRef} className="qh-player" aria-hidden="true">
          <CreatureFigure creature={state.creature} size={142} mood={mood} />
        </div>
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

      {View && active && (
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
