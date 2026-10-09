import { createArcadeRenderGate } from '../shared/arcadeFramePolicy.js';
import { arcadePixelRatio } from '../shared/arcadeRenderBudget.js';
import { getChildWordAsset } from "../../../../data/childAssets.js";
import { phonicsTargetHint } from "../../../../utils/phonicsTargetPresentation.js";
import { createLearningDwell, LEARNING_PACE } from "../../../../utils/learningPace.js";
import { arcadeSurfaceTexture } from '../shared/arcadeWorldSurfaces.js';
import {createSkateAuthoredWorld,createSkateOriginalMaterials,mapSkateSurface,SKATE_MATERIAL_TINTS} from './spellSkateAuthoredWorld.js';
import "../shared/arcadeMissionHud.css";
import "./SpellSkateWorld.css";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  playCelebrationFanfare,
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playTapSound,
  playWhoosh
} from "../../../../utils/audio/gameSfx.js";
import {
  grammarGrindLadder,
  grammarGrindSegmentChoices,
  grammarGrindStars
} from "../../../../utils/grammarGrindLevels.js";
import { hasRecordedSpeech, speak, speakWord, speakPhoneme } from "../../../../utils/learnGamesAudio.js";
import {newSpellSkatePractice,recordSpellSkateChoice,completeSpellSkateWord,spellSkateWrongCounts} from "../../../../utils/spellSkatePractice.js";
import {loadSpellSkateSession,saveSpellSkateSession,spellSkateSignature} from "../../../../utils/spellSkateSession.js";
import {SPELL_SKATE_CONTENT_VERSION} from "../../../../data/arcadeContentVersions.js";
import {createSportsFrameTelemetry} from "../../../../utils/sportsArcadePerformance.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import { batchSportsStaticWorld } from "./sportsStaticBatch.js";
import {createSportsRendererHost,createCanvasPremiumBridge,createSkateCanvasPresentation} from './sportsCanvasRenderer.js';
import {disposeOwnedSportsPrimaryGroup} from './sportsOwnedGltfResources.js';
import { createRenderer, createScene, createPerspectiveCamera, attachResize, createFrameLoop, attachContextLossGuard, detectQualityTier, applyQualityTier, shadowMapForTier, particleCountForTier, QUALITY_TIERS, disposeRenderer, disposeObject } from "../shared/threeShell.js";
import { createArcadePremiumRenderPipeline } from "../shared/arcadePremiumRender.js";

import { createSpellSkater } from "./spellSkaterAsset.js";
import { createSkateTextSign, createSkateRampGeometry, createSkateBowlGeometry, createSkateDeckGeometry, createSkateParkDressing, sampleSkateSurface, skateSurfaceTilt, resolveSkateObstacleContact, planSkateRoute, createSkateRouteRecovery, createSkateFixedStepper, skateMotion, skateAction, chooseSkateDestination } from "./spellSkatePark.js";

const THEMES = {
  easy: {
    name: "Meadow Skate School",
    sky: "#8fded4",
    fog: "#dcebe5",
    ground: "#6da85c",
    ground2: "#8fc76d",
    accent: "#ffd45c",
    accent2: "#42b9a7",
    gate: "#fff2bf",
    token: "#ffdf67",
    correct: "#3454C8",
    wrong: "#ed6b67",
    rail: "#fff2cf",
    world: "meadow"
  },
  medium: {
    name: "Dino Quarry Park",
    sky: "#f2a15e",
    fog: "#f6bf76",
    ground: "#5f5547",
    ground2: "#846747",
    accent: "#ffbf3c",
    accent2: "#ff6844",
    gate: "#ffe6a8",
    token: "#7df2ff",
    correct: "#3454C8",
    wrong: "#ff4f4f",
    rail: "#ffe0a2",
    world: "dino"
  },
  hard: {
    name: "Moonwood Neon Bowl",
    sky: "#111b4a",
    fog: "#19235d",
    ground: "#202445",
    ground2: "#32356d",
    accent: "#c8b7ff",
    accent2: "#7df2ff",
    gate: "#aef7ff",
    token: "#ffd5ff",
    correct: "#3454C8",
    wrong: "#ff5bbd",
    rail: "#cfe6ff",
    world: "moonwood"
  }
};

const ARENA_LIMIT = 82;
const PLAYER_RADIUS = 2.15;
const MAX_SPEED = { easy: 9, medium: 29, hard: 33 };
const TOKEN_COUNT = { easy: 0, medium: 12, hard: 14 };
const STYLE_WINDOW = 6;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function distanceToSegment(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const len2 = vx * vx + vz * vz || 1;
  const t = clamp((wx * vx + wz * vz) / len2, 0, 1);
  const x = ax + vx * t;
  const z = az + vz * t;
  const dx = px - x;
  const dz = pz - z;
  return { distance: Math.hypot(dx, dz), t, x, z };
}

function makeMat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.68,
    metalness: options.metalness ?? 0.08,
    emissive: options.emissive ?? "#000000",
    emissiveIntensity: options.emissiveIntensity ?? 0,
    envMapIntensity: options.envMapIntensity ?? 0.86,
    dithering: true
  });
}

function makeSkyTexture(theme, difficulty) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, difficulty === "hard" ? "#070a20" : difficulty === "medium" ? "#7a2d28" : "#71cfff");
  gradient.addColorStop(0.48, theme.sky);
  gradient.addColorStop(1, theme.fog);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rand = seeded(difficulty === "hard" ? 720 : difficulty === "medium" ? 430 : 120);
  if (difficulty === "hard") {
    ctx.fillStyle = "rgba(255,255,255,.88)";
    for (let i = 0; i < 130; i += 1) {
      const x = rand() * canvas.width;
      const y = rand() * canvas.height * 0.55;
      const size = rand() * 2.2 + 0.7;
      ctx.fillRect(x, y, size, size);
    }
    ctx.fillStyle = "rgba(191,216,255,.18)";
    ctx.beginPath();
    ctx.arc(820, 96, 54, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(255,255,255,.46)";
    for (let i = 0; i < 18; i += 1) {
      const x = rand() * canvas.width;
      const y = 56 + rand() * 170;
      const w = 52 + rand() * 116;
      ctx.beginPath();
      ctx.ellipse(x, y, w, 14 + rand() * 18, rand() * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let layer = 0; layer < 3; layer += 1) {
    ctx.fillStyle = difficulty === "hard"
      ? `rgba(${36 + layer * 18},${50 + layer * 12},${104 + layer * 26},${0.54 - layer * 0.08})`
      : difficulty === "medium"
        ? `rgba(${78 + layer * 32},${47 + layer * 18},${30 + layer * 10},${0.58 - layer * 0.08})`
        : `rgba(${41 + layer * 26},${98 + layer * 24},${91 + layer * 12},${0.46 - layer * 0.06})`;
    ctx.beginPath();
    ctx.moveTo(0, 356 + layer * 34);
    for (let x = 0; x <= canvas.width + 80; x += 64) {
      const peak = 260 + layer * 36 + rand() * 86;
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  if (difficulty === "medium") {
    ctx.fillStyle = "rgba(255,98,52,.72)";
    ctx.beginPath();
    ctx.moveTo(660, 290);
    ctx.lineTo(722, 162);
    ctx.lineTo(784, 292);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,210,82,.65)";
    ctx.fillRect(714, 168, 16, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function makeTextTexture(text, theme, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = options.width || 768;
  canvas.height = options.height || 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = options.bg || "rgba(7,12,28,.9)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = options.border || theme.accent2;
  ctx.lineWidth = 12;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = "rgba(255,255,255,.14)";
  for (let y = 24; y < canvas.height; y += 18) ctx.fillRect(24, y, canvas.width - 48, 2);
  ctx.fillStyle = options.fg || "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = options.size || 92;
  do {
    ctx.font = `900 ${size}px Fredoka, Arial, sans-serif`;
    if (ctx.measureText(text).width < canvas.width - 72) break;
    size -= 4;
  } while (size >= 32);
  ctx.shadowColor = "rgba(0,0,0,.7)";
  ctx.shadowBlur = 14;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 8, canvas.width - 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}


function startGame(mount, opts) {
  const renderGate = createArcadeRenderGate();
  const difficulty = ["easy", "medium", "hard"].includes(String(opts.difficulty)) ? String(opts.difficulty) : "easy";
  const ladder = grammarGrindLadder(difficulty, opts.sessionSeed, opts.journey?.index || 0);
  const theme = THEMES[difficulty] || THEMES.easy;
  const startAt = clamp(Number(opts.startLevel) || 0, 0, ladder.length - 1);
  let sessionStartIndex = startAt;
  const progressScope = opts.progressScopeKey || "default";
  const getSound = () => opts.getSound?.() !== false;
  const sfx = fn => {
    try {
      if (getSound()) fn();
    } catch {
      /* sound is optional */
    }
  };
  // Hardware quality tier: scales the DPR cap, shadow mode and burst/trail
  // particle rates so weak devices get a lighter scene instead of a stuttery one.
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  let gardenWorld = null,staticParkBatch=null;
  let qualityTier = detectQualityTier();
  let particleScale = QUALITY_TIERS[qualityTier].particleScale;

  const presentationHost=createSportsRendererHost(()=>createRenderer(THREE, {
    antialias: true,
    powerPreference: "high-performance",
    retryWithoutAntialias: false,
    pixelRatioCap: QUALITY_TIERS[qualityTier].pixelRatioCap,
    srgbOutput: true,
    toneMappingExposure: 1.1,
    shadowMap: shadowMapForTier(qualityTier, "pcf")
  }));
  const renderer=presentationHost.renderer;
  applyQualityTier(renderer, qualityTier);
  renderer.domElement.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none";
  mount.appendChild(renderer.domElement);

  const scene = createScene(THREE, new THREE.Fog(theme.fog, 86, 190));
  scene.background = new THREE.Color(theme.sky);
  const camera = createPerspectiveCamera(THREE, { fov: 60, aspect: 1, near: 0.1, far: 360 });

  const hemi = new THREE.HemisphereLight(difficulty === "hard" ? "#bdcdec" : "#e5f0f1", difficulty === "hard" ? "#24365a" : "#536351", .95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(difficulty === "hard" ? "#c8d9ff" : "#fff3dc", difficulty === "hard" ? 1.25 : 1.65);
  sun.position.set(-44, 82, 38);
  sun.castShadow = qualityTier !== "low";
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  scene.add(sun);

  const rim = new THREE.DirectionalLight(theme.accent2, difficulty === "hard" ? 0.42 : 0.28);
  rim.position.set(46, 28, -58);
  scene.add(rim);

  const premiumRender = presentationHost.mode==='canvas'?createCanvasPremiumBridge():createArcadePremiumRenderPipeline({
    THREE,
    renderer,
    scene,
    camera,
    tier: qualityTier,
    shadowLights: [sun],
    mood: {
      bloomIntensity: difficulty === "hard" ? 0.072 : 0.045,
      bloomThreshold: difficulty === "hard" ? 0.9 : 0.95,
      environmentIntensity: 0.36,
      vignetteDarkness: 0.09,
      aoIntensity: 0.78,
      aoRadius: 0.09
    }
  });
  qualityTier = premiumRender.effectiveTier;
  particleScale = QUALITY_TIERS[qualityTier].particleScale;
  applyQualityTier(renderer, qualityTier);
  premiumRender.setTier(qualityTier);

  function reassessQualityTier() {
    if(presentationHost.mode==='canvas')return;
    premiumRender.setTier(detectQualityTier());
    qualityTier = premiumRender.effectiveTier;
    gardenWorld?.setQuality(qualityTier);
    particleScale = QUALITY_TIERS[qualityTier].particleScale;
    applyQualityTier(renderer, qualityTier);
    premiumRender.resize(mount.clientWidth || 960, mount.clientHeight || 560);
  }
  const syncMotionPreference = () => reassessQualityTier();
  motionQuery?.addEventListener?.("change", syncMotionPreference);

  const root = new THREE.Group();
  scene.add(root);
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(230, 32, 16),
    new THREE.MeshBasicMaterial({ map: makeSkyTexture(theme, difficulty), side: THREE.BackSide, depthWrite: false, fog: false })
  );
  root.add(skyDome);
  const park = new THREE.Group();
  root.add(park);
  const pickupsRoot = new THREE.Group();
  scene.add(pickupsRoot);
  const lineRoot = new THREE.Group();
  scene.add(lineRoot);
  const particlesRoot = new THREE.Group();
  scene.add(particlesRoot);
  const trailsRoot = new THREE.Group();
  scene.add(trailsRoot);
  const authoredMaterials=createSkateOriginalMaterials(theme.world,renderer);

  const shared = {
    ramp: makeMat(theme.ground2),
    rampSide: makeMat(theme.accent, { roughness: 0.58, emissive: theme.accent, emissiveIntensity: 0.03 }),
    rail: makeMat(theme.rail, { roughness: 0.42, metalness: 0.5 }),
    post: makeMat("#11182c", { roughness: 0.42, metalness: 0.25 }),
    cone: makeMat(theme.accent),
    gate: makeMat(theme.gate || theme.accent2, { emissive: theme.gate || theme.accent2, emissiveIntensity: 0.34 }),
    token: makeMat(theme.token || theme.accent, { roughness: 0.34, metalness: 0.18, emissive: theme.token || theme.accent, emissiveIntensity: 0.42 }),
    glowGood: makeMat(theme.correct, { emissive: theme.correct, emissiveIntensity: 0.52 }),
    glowBad: makeMat(theme.wrong, { emissive: theme.wrong, emissiveIntensity: 0.4 })
  };
  shared.ramp.map=authoredMaterials.textures.concrete;shared.ramp.color.set(SKATE_MATERIAL_TINTS[theme.world].ramp);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA_LIMIT * 2.25, ARENA_LIMIT * 2.25, 16, 16),
    new THREE.MeshStandardMaterial({ map: arcadeSurfaceTexture("concrete", {easy:"meadow",medium:"dino",hard:"moonwood"}[difficulty]), roughness: 0.78, metalness: 0.04 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.material.map.dispose();ground.material.map=authoredMaterials.textures.concrete;ground.material.color.set(SKATE_MATERIAL_TINTS[theme.world].floor);mapSkateSurface(ground.geometry);
  ground.receiveShadow = true;
  park.add(ground);

  if (difficulty === "easy") {
    // A calm, readable route through Meadow School. The early spelling task
    // should look like a journey with a destination, not a grey free-roam
    // arena. The path also gives young children a strong forward cue.
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 152),
      new THREE.MeshStandardMaterial({ color: "#d4d2bf", map: arcadeSurfaceTexture("concrete", {easy:"meadow",medium:"dino",hard:"moonwood"}[difficulty]), roughness: .94 })
    );
    path.rotation.x = -Math.PI / 2;
    path.material.map.dispose();path.material.map=authoredMaterials.textures.concrete;path.material.color.set('#fffaf1');mapSkateSurface(path.geometry);
    path.position.set(0, 0.035, -28);
    path.receiveShadow = true;
    park.add(path);
    for (const x of [-11.5, 11.5]) {
      const border = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.24, 152),
        makeMat(x < 0 ? "#3f9f83" : "#58b894", { roughness: 0.8 })
      );
      border.position.set(x, 0.1, -28);
      border.receiveShadow = true;
      park.add(border);
    }
    for (let z = 36; z >= -94; z -= 13) {
      const steppingStone = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.4, 0.16, 12),
        makeMat("#bacabf", { roughness: 0.94 })
      );
      steppingStone.position.set(Math.sin(z * 0.12) * 2.2, 0.14, z);
      steppingStone.receiveShadow = true;
      park.add(steppingStone);
    }
  }

  const boundaryMat = makeMat(difficulty === "easy" ? "#3f8668" : "#0c1022", {
    roughness: difficulty === "easy" ? 0.86 : 0.54,
    metalness: difficulty === "easy" ? 0 : 0.22,
    emissive: theme.accent2,
    emissiveIntensity: difficulty === "easy" ? 0.01 : 0.05
  });
  for (const side of [
    { x: 0, z: -ARENA_LIMIT, w: ARENA_LIMIT * 2, d: 1.2 },
    { x: 0, z: ARENA_LIMIT, w: ARENA_LIMIT * 2, d: 1.2 },
    { x: -ARENA_LIMIT, z: 0, w: 1.2, d: ARENA_LIMIT * 2 },
    { x: ARENA_LIMIT, z: 0, w: 1.2, d: ARENA_LIMIT * 2 }
  ]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(side.w, 2.8, side.d), boundaryMat);
    wall.position.set(side.x, 1.4, side.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    park.add(wall);
  }

  const rampZones = [];
  const rampAccents = [];
  const railZones = [];
  const platformZones = [];

  function addRamp(x, z, rot, width, depth, height) {
    const mesh = new THREE.Mesh(createSkateRampGeometry(width, depth, height), shared.ramp);
    mesh.position.set(x, 0.02, z);
    mesh.rotation.y = rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    park.add(mesh);
    const coping=new THREE.Group();coping.position.set(x,height+.09,z);coping.rotation.y=rot;
    const metalLip=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,width,16),shared.rail);
    metalLip.rotation.z=Math.PI/2;metalLip.position.z=depth/2;metalLip.castShadow=true;coping.add(metalLip);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(width * .92,.08,.26),shared.rampSide.clone());
    stripe.position.set(0,.025,depth/2+.16);stripe.receiveShadow=true;coping.add(stripe);
    stripe.material.userData.sportsMutable=true;rampAccents.push(stripe.material);park.add(coping);
    rampZones.push({ x, z, rot, width, depth, height, cooldown: 0 });
  }

  function addRail(x, z, rot, length) {
    const group = new THREE.Group();
    group.position.set(x, 1.14, z);
    group.rotation.y = rot;
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, length, 10), shared.rail);
    rail.rotation.z = Math.PI / 2;
    rail.castShadow = true;
    group.add(rail);
    for (const sx of [-length * 0.38, length * 0.38]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.18, 8), shared.post);
      post.position.set(sx, -0.58, 0);
      post.castShadow = true;
      group.add(post);
    }
    park.add(group);
    const dx = Math.cos(rot) * length * 0.5;
    const dz = -Math.sin(rot) * length * 0.5;
    railZones.push({ ax: x - dx, az: z - dz, bx: x + dx, bz: z + dz, rot, length });
  }

  function addQuarterPipe(x, z, rot, width, radius) {
    const group = new THREE.Group();
    group.position.set(x, 0.03, z);
    group.rotation.y = rot;
    const pipe = new THREE.Mesh(createSkateRampGeometry(width, radius, radius, "quarter"), shared.ramp);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    group.add(pipe);
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, width + 1.2, 10), shared.rail);
    lip.rotation.z = Math.PI / 2;
    lip.position.set(0, radius + 0.12, 0);
    lip.castShadow = true;
    group.add(lip);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, 0.28), shared.rampSide);
    glow.position.set(0, 0.2, -radius + 0.55);
    group.add(glow);
    park.add(group);
    rampZones.push({ x, z, rot, width, depth: radius, height: radius, kind: "quarter", cooldown: 0 });
  }

  function addLightPylon(x, z, rot) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rot;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 13, 8), shared.post);
    pole.position.y = 6.5;
    pole.castShadow = true;
    group.add(pole);
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.1, 1.1),
      makeMat(theme.gate || theme.accent2, { emissive: theme.gate || theme.accent2, emissiveIntensity: 0.8 })
    );
    lamp.position.set(0, 13.1, -1.3);
    lamp.castShadow = true;
    group.add(lamp);
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(7, 18, 4, 1, true),
      new THREE.MeshBasicMaterial({
        color: theme.gate || theme.accent2,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    beam.position.set(0, 5.2, -5.4);
    beam.rotation.x = Math.PI;
    group.add(beam);
    park.add(group);
  }

  function addPlatform(x, z, rot, width, depth, height) {
    const group = new THREE.Group();
    group.position.set(x, height / 2, z);
    group.rotation.y = rot;
    const deck = new THREE.Mesh(createSkateDeckGeometry(width, depth, height), shared.ramp);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);
    for (const sx of [-width / 2 + 0.7, width / 2 - 0.7]) {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, depth + 0.5), shared.rampSide);
      trim.position.set(sx, height / 2 + 0.18, 0);
      group.add(trim);
    }
    park.add(group);
    platformZones.push({ x, z, rot, width, depth, height });
  }

  function addSkillSign(x, z, rot, text) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rot;
    const postGeo = new THREE.CylinderGeometry(0.14, 0.2, 4.4, 7);
    for (const sx of [-2.8, 2.8]) {
      const post = new THREE.Mesh(postGeo, shared.post);
      post.position.set(sx, 2.2, 0);
      post.castShadow = true;
      group.add(post);
    }
    const texture = makeTextTexture(text, theme, {
      width: 640,
      height: 192,
      size: 62,
      border: theme.gate || theme.accent2,
      bg: "rgba(4,8,22,.86)"
    });
    const sign = createSkateTextSign(texture, 6.8, 2.1);
    sign.name = `Readable ${text} banner`;
    sign.position.set(0, 4.5, 0.06);
    sign.castShadow = true;
    group.add(sign);
    park.add(group);
  }

  if (difficulty === "easy") {
    // Actual gentle side banks are visible from the opening and stay clear of
    // the teaching corridor and the existing planted furniture islands.
    addRamp(-20, -4, Math.PI, 12, 16, 2.4);
    addRamp(24, -22, 0, 14, 16, 2.8);
    addRail(18, 12, Math.PI/2, 10);
    addSkillSign(-31, 28, Math.PI * 0.04, "LISTEN");
    addSkillSign(31, -8, -Math.PI * 0.04, "BUILD");
  } else {
    addRamp(-51, -14, Math.PI, 12, 18, 3.6);
    addRamp(24, -24, Math.PI * 1.18, 20, 22, 5.2);
    addRamp(-2, 56, Math.PI, 32, 18, 4.1);
    addRamp(44, -46, -Math.PI * 0.38, 16, 18, 3.8);
    addQuarterPipe(-58, 22, Math.PI * 0.48, 24, 7.8);
    addQuarterPipe(58, -24, -Math.PI * 0.52, 28, 8.2);
    addQuarterPipe(-2, -68, 0, 34, 7.4);
    addRail(-24, 14, -Math.PI * 0.18, 24);
    addRail(28, -4, Math.PI * 0.28, 30);
    addRail(0, -52, 0, 26);
    addPlatform(-20, -18, Math.PI * 0.08, 22, 10, 1.7);
    addPlatform(25, 24, -Math.PI * 0.12, 26, 9, 1.9);
    addPlatform(7, -34, Math.PI * 0.42, 18, 8, 1.45);
    addLightPylon(-66, -16, Math.PI * 0.25);
    addLightPylon(68, 16, -Math.PI * 0.25);
    addLightPylon(-18, 70, Math.PI);
    addLightPylon(18, -70, 0);
    addSkillSign(-52, 52, Math.PI * 0.28, "STYLE");
    addSkillSign(52, -54, -Math.PI * 0.72, "FOCUS");
  }

  const bowl = new THREE.Mesh(createSkateBowlGeometry(16, 3.6), shared.ramp);
  bowl.position.set(-51, 0, -39);
  bowl.castShadow = true; bowl.receiveShadow = true;
  park.add(bowl);
  const bowlCoping=new THREE.Mesh(new THREE.TorusGeometry(16,.11,12,128),shared.rail);
  bowlCoping.rotation.x=Math.PI/2;bowlCoping.position.set(-51,3.66,-39);
  bowlCoping.castShadow=true;bowlCoping.receiveShadow=true;park.add(bowlCoping);
  rampZones.push({x:-51,z:-39,rot:0,width:32,depth:32,radius:16,height:3.6,kind:"bowl"});
  const dressing = createSkateParkDressing(theme, difficulty);
  const parkObstacles = dressing.userData.obstacles;
  park.add(dressing);
  park.traverse(node=>{
    if(!node.isMesh)return;
    for(const material of Array.isArray(node.material)?node.material:[node.material]){
      if(material===shared.ramp)mapSkateSurface(node.geometry);
      if(material.name==='SkateOriginalTimber'){material.map=authoredMaterials.textures.wood;material.color.set('#ffffff');mapSkateSurface(node.geometry,1.8);}
      if(material.name==='SkateOriginalStone'){material.map=authoredMaterials.textures.concrete;mapSkateSurface(node.geometry);}
    }
  });
  gardenWorld = createSkateAuthoredWorld(theme.world,qualityTier,{islands:parkObstacles,onReady:(group,delivery)=>{
    dressing.traverse(node=>{if(delivery.trees&&node.userData.gardenTreeFallback)node.visible=false;if(delivery.horizon&&node.name==='Planted park hill')node.visible=false;});
    gardenWorld.setQuality(qualityTier);premiumRender.prepareObject(group);
  }});
  gardenWorld.root.userData.sportsBatchDynamic=true;
  park.add(gardenWorld.root);
  mount.dataset.authoredWorld = "spell-skate-v2";
  const skaterAsset = createSpellSkater({world:theme.world});
  const skater = skaterAsset.root;
  if (difficulty === "easy") skater.scale.setScalar(1.25);
  scene.add(skater);
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowContext = shadowCanvas.getContext("2d");
  const shadowGradient = shadowContext.createRadialGradient(32,32,3,32,32,30);
  shadowGradient.addColorStop(0,"rgba(20,31,33,.48)");
  shadowGradient.addColorStop(1,"rgba(20,31,33,0)");
  shadowContext.fillStyle = shadowGradient; shadowContext.fillRect(0,0,64,64);
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(3.8,6.1), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
  contactShadow.rotation.x = -Math.PI / 2;
  scene.add(contactShadow);
  const primaryAssetsReady=Promise.all([skaterAsset.ready,gardenWorld.ready,authoredMaterials.ready]);
  let primaryOwnersReleased=false,primaryReleaseReceipt=null;


  const overlay = document.createElement("div");
  overlay.classList.add("gg-game-hud");
  overlay.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:5;font-family:var(--kid-font-display,Fredoka,Arial,sans-serif);color:#fff";
  overlay.innerHTML =
    '<div data-gg-panel="left" style="position:absolute;top:14px;left:16px;min-width:220px;background:linear-gradient(135deg,rgba(6,10,28,.9),rgba(20,32,70,.72));border:1px solid rgba(125,242,255,.32);padding:12px 16px;clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);box-shadow:0 12px 34px rgba(0,0,0,.32)">' +
      '<div data-gg="level" style="font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:#9bf4ff;font-weight:900">Word 1</div>' +
      '<div data-gg="score" style="font-size:1.42rem;font-weight:950;line-height:1.08">0 pts</div>' +
      '<div data-gg="combo" style="font-size:.82rem;color:#ffe17a;font-weight:900">Combo x1</div>' +
    '</div>' +
    '<div data-gg-panel="center" style="position:absolute;top:14px;left:50%;transform:translateX(-50%);width:min(760px,calc(100vw - 360px));min-width:330px;text-align:center;background:linear-gradient(135deg,rgba(6,10,28,.96),rgba(20,32,70,.86));border:2px solid rgba(125,242,255,.32);padding:14px 24px 16px;clip-path:polygon(18px 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,18px 100%,0 50%);box-shadow:0 14px 38px rgba(0,0,0,.42)">' +
      '<img data-gg="picture" alt="Word picture. Tap Hear for its name." style="width:56px;height:56px;object-fit:contain;float:left;margin-right:10px">' +
      '<div data-gg="picture-recovery" role="img" aria-label="Picture unavailable. Use Hear for the word." hidden><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 25h11l15-12v38L23 39H12z" fill="#3454C8"/><path d="M45 23q10 9 0 18m7-25q17 16 0 32" fill="none" stroke="#18263E" stroke-width="4" stroke-linecap="round"/></svg></div>' +
      '<div data-gg="prompt" data-child-instruction style="font-size:clamp(1.38rem,2.4vw,1.78rem);font-weight:950;line-height:1.05;text-wrap:balance"></div>' +
      '<div data-gg="sentence" style="margin-top:7px;font-size:clamp(1.1rem,1.8vw,1.42rem);font-weight:900;color:#eaf8ff;letter-spacing:.08em"></div>' +
      '<div data-gg="cue" style="margin-top:5px;font-size:.82rem;letter-spacing:.08em;text-transform:uppercase;color:#9bf4ff;font-weight:900"></div>' +
      '<div data-gg="coach" style="margin:8px auto 0;max-width:620px;font-size:clamp(1rem,1.45vw,1.16rem);line-height:1.22;color:#ffe7a3;font-weight:900;text-wrap:balance"></div>' +
      '<button data-gg="hear" type="button" aria-label="Hear the word again" style="min-width:168px;min-height:56px;margin-top:10px;padding:10px 20px;border:2px solid rgba(125,242,255,.62);background:rgba(6,10,28,.82);color:#9bf4ff;font-weight:950;border-radius:10px;font-size:1rem;letter-spacing:.07em;pointer-events:auto;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.28)">HEAR WORD AGAIN</button>' +
    '</div>' +
    '<div data-gg-panel="right" style="position:absolute;top:14px;right:16px;text-align:right;background:linear-gradient(135deg,rgba(6,10,28,.9),rgba(20,32,70,.72));border:1px solid rgba(125,242,255,.32);padding:12px 16px;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 100%,12px 100%);box-shadow:0 12px 34px rgba(0,0,0,.32)">' +
      '<div data-gg="world" style="font-size:.78rem;letter-spacing:.13em;text-transform:uppercase;color:#9bf4ff;font-weight:900"></div>' +
      '<div data-gg="speed" style="font-size:1.22rem;font-weight:950">0 kmh</div>' +
      '<div data-gg="trick" style="font-size:.82rem;color:#ffe17a;font-weight:900">Find the next spelling part</div>' +
      '<div data-gg="style" style="margin-top:4px;font-size:.72rem;color:#d9f2ff;font-weight:900;text-transform:uppercase;letter-spacing:.08em">Style ready</div>' +
    '</div>' +
    '<div data-gg="banner" style="position:absolute;left:50%;bottom:100px;transform:translateX(-50%);max-width:75%;padding:7px 14px;border-radius:12px;background:rgba(12,39,47,.9);text-align:center;font-size:1.1rem;font-weight:800;display:none"></div>' +
    '<div data-gg-controls="left" style="position:absolute;bottom:18px;left:18px;display:flex;gap:10px;pointer-events:auto">' +
      '<button data-gg-btn="left" aria-label="Turn left" style="width:70px;height:64px;border:1px solid rgba(125,242,255,.42);background:rgba(6,10,28,.76);color:#fff;font-size:1.6rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">←</button>' +
      '<button data-gg-btn="right" aria-label="Turn right" style="width:70px;height:64px;border:1px solid rgba(125,242,255,.42);background:rgba(6,10,28,.76);color:#fff;font-size:1.6rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">→</button>' +
    '</div>' +
    '<div data-gg-controls="right" style="position:absolute;bottom:18px;right:18px;display:flex;gap:10px;pointer-events:auto">' +
      '<button data-gg-btn="push" aria-label="Move forward" style="width:76px;height:64px;border:1px solid rgba(125,242,255,.52);background:linear-gradient(160deg,#7df2ff,#38bdf8);color:#07101d;font-size:.82rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">↑<br>FORWARD</button>' +
      '<button data-gg-btn="brake" aria-label="Move back" style="width:76px;height:64px;border:1px solid rgba(255,255,255,.3);background:rgba(6,10,28,.76);color:#fff;font-size:.82rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">↓<br>BACK</button>' +
      '<button data-gg-btn="jump" aria-label="Jump trick" style="width:86px;height:68px;border:1px solid rgba(255,255,255,.58);background:linear-gradient(160deg,#fff0a8,#ffc83d 55%,#f59e0b);color:#201400;font-weight:950;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.3),inset 0 -8px 0 rgba(0,0,0,.2)">JUMP /<br>TRICK</button>' +
    '</div>' +
    (difficulty === "easy"
      ? '<div data-gg-guide style="position:absolute;right:18px;bottom:102px;width:min(190px,23vw);display:grid;justify-items:center;filter:drop-shadow(0 12px 18px rgba(24,38,62,.28))">' +
          '<img src="/images/pals/meadow-point.webp" alt="" style="display:block;width:100%;max-height:150px;object-fit:contain;object-position:center bottom">' +
          '<div style="margin-top:-13px;padding:6px 12px;border-radius:999px;background:rgba(255,250,226,.94);border:2px solid rgba(146,157,175,.45);color:#18263E;font-size:.76rem;font-weight:950;box-shadow:0 7px 18px rgba(24,38,62,.16)">Explore and build the word</div>' +
        '</div>'
      : '');
  const rightPanel = overlay.querySelector('[data-gg-panel="right"]');
  if (rightPanel && difficulty === "easy") rightPanel.style.display = "none";
  const overlayStyle = document.createElement("style");
  overlayStyle.textContent = `
    @media (max-width: 760px) {
      [data-gg-panel="left"] {
        top: 8px !important;
        left: 8px !important;
        min-width: 116px !important;
        width: 116px !important;
        padding: 7px 9px !important;
      }
      [data-gg-panel="center"] {
        top: 108px !important;
        left: 8px !important;
        right: 8px !important;
        transform: none !important;
        width: auto !important;
        min-width: 0 !important;
        padding: 8px 10px 10px !important;
      }
      [data-gg-panel="right"] {
        top: 8px !important;
        right: 8px !important;
        width: 164px !important;
        padding: 7px 9px !important;
      }
      [data-gg="level"],
      [data-gg="world"] {
        font-size: .62rem !important;
        letter-spacing: .1em !important;
      }
      [data-gg="score"],
      [data-gg="speed"] {
        font-size: 1rem !important;
        line-height: 1 !important;
      }
      [data-gg="combo"],
      [data-gg="trick"],
      [data-gg="style"] {
        font-size: .66rem !important;
      }
      [data-gg="prompt"] {
        font-size: 1.38rem !important;
        line-height: 1.05 !important;
      }
      [data-gg="sentence"] {
        font-size: 1.08rem !important;
        margin-top: 5px !important;
      }
      [data-gg="cue"] {
        font-size: .72rem !important;
        margin-top: 4px !important;
      }
      [data-gg="coach"] {
        max-width: 100% !important;
        font-size: 1rem !important;
        line-height: 1.15 !important;
        margin-top: 6px !important;
      }
      [data-gg="hear"] {
        min-height: 56px !important;
        margin-top: 7px !important;
        padding: 8px 14px !important;
        font-size: 1rem !important;
      }
      [data-gg-controls="left"] {
        bottom: 10px !important;
        left: 10px !important;
        gap: 8px !important;
      }
      [data-gg-controls="right"] {
        left: auto !important;
        right: 10px !important;
        bottom: 10px !important;
        gap: 8px !important;
        justify-content: space-between !important;
      }
      [data-gg-btn] {
        height: 58px !important;
        border-radius: 7px !important;
        font-size: .74rem !important;
      }
      [data-gg-btn="left"],
      [data-gg-btn="right"] {
        width: 58px !important;
        font-size: 1.65rem !important;
      }
      [data-gg-btn="brake"],
      [data-gg-btn="push"] {
        width: 64px !important;
      }
      [data-gg-btn="jump"] {
        width: 68px !important;
      }
      [data-gg-guide] {
        right: 10px !important;
        bottom: 78px !important;
        width: min(126px, 30vw) !important;
      }
    }
  `;
  overlay.appendChild(overlayStyle);
  mount.appendChild(overlay);

  const el = {
    level: overlay.querySelector('[data-gg="level"]'),
    score: overlay.querySelector('[data-gg="score"]'),
    combo: overlay.querySelector('[data-gg="combo"]'),
    prompt: overlay.querySelector('[data-gg="prompt"]'),
    picture: overlay.querySelector('[data-gg="picture"]'),
    pictureRecovery: overlay.querySelector('[data-gg="picture-recovery"]'),
    sentence: overlay.querySelector('[data-gg="sentence"]'),
    cue: overlay.querySelector('[data-gg="cue"]'),
    coach: overlay.querySelector('[data-gg="coach"]'),
    hear: overlay.querySelector('[data-gg="hear"]'),
    world: overlay.querySelector('[data-gg="world"]'),
    speed: overlay.querySelector('[data-gg="speed"]'),
    trick: overlay.querySelector('[data-gg="trick"]'),
    style: overlay.querySelector('[data-gg="style"]'),
    banner: overlay.querySelector('[data-gg="banner"]')
  };
  overlay.querySelector('[data-gg-panel="center"]').appendChild(el.level);
  overlay.appendChild(el.coach);
  el.coach.setAttribute("role", "status");
  el.coach.setAttribute("aria-live", "polite");
  if (difficulty === "easy") {
    overlay.querySelector('[data-gg-panel="left"]').style.display="none";
    el.score.style.display = "none";
    el.combo.style.display = "none";
  }

  let running = true;
  let assetsLoading = true;
  let graphicsLoading=false,canvasPresentation=null,canvasReady=null;
  let detachContextGuard=()=>{};
  let paused = false;
  const physicsClock = createSkateFixedStepper();
  const frameTelemetry=createSportsFrameTelemetry();
  let requestedRendererFallback=null;
  let lastTime = 0;
  let levelIndex = startAt;
  let level = ladder[levelIndex];
  let score = 0;
  let correct = 0;
  let mistakes = 0;
  let wordMistakes = 0;
  let scoreDirty = false;
  let lastScoreSent = 0;
  let lastScoreSentAt = 0;
  let levelVoice = null, resultVoice = null;
  let wordDelivery = "pending", wordReceipt = null;
  let pictureUrl=null,pictureDelivery="pending",pictureRequested=false;
  el.picture.onload=()=>{
    if(!running||el.picture.getAttribute("src")!==pictureUrl)return;
    pictureDelivery="delivered";el.picture.hidden=false;el.pictureRecovery.hidden=true;
  };
  el.picture.onerror=()=>{
    if(!running||el.picture.getAttribute("src")!==pictureUrl)return;
    pictureDelivery="unavailable";el.picture.hidden=true;el.pictureRecovery.hidden=false;
  };
  const supportReasons = new Set();
  let evidence = newSpellSkatePractice({sessionSeed:opts.sessionSeed,journeyIndex:opts.journey?.index||0,difficulty});
  let motorIntent = false, selectedIntent = null;
  let combo = 1;
  let comboTimer = 0;
  let message = "";
  let messageTimer = 0;
  let coachText = level.teaching || level.cue;
  let correctionTimer = 0;
  let boostFlash = 0;
  let styleWindow = 0;
  let styleScore = 0;
  let lineStep = 0;
  let lineReady = false;
  let lineChoiceCooldown = 0;
  let trailTimer = 0;
  let phase = "playing";
  let phaseTimer = 0;
  let resultDwell = null;
  const resultReadback = () => {
    if(!getSound())return;
    resultVoice?.abort();const voice=new AbortController();resultVoice=voice;
    return speakWord(level.audioWord,{signal:voice.signal}).catch(()=>{});
  };
  let completed = false;
  const keys = { left: false, right: false, push: false, brake: false, jump: false, jumpPressed: false };
  const player = {
    pos: new THREE.Vector3(0, 0, 24),
    yaw: Math.PI,
    speed: 0,
    vy: 0,
    air: 0,
    airTime: 0,
    onGround: true,
    stun: 0,
    grind: 0,
    grindRail: null,
    grindT: 0,
    airTricks: 0,
    spinAngle: 0,
    spinTarget: 0,
    railIntent: 0,
    grindDirection: 1,
    railLock: 0,
    rampLock: 0,
    landTime: 0,
    recoverTime: 0,
    surfacePitch: 0,
    surfaceRoll: 0,
    motorRecoveries: 0,
    landingRecoveries: 0,
    lastContact: null
  };
  let assistRoute = [];
  const assistRouteRecovery=createSkateRouteRecovery();
  const assistContactRecoveries=[];
  const assistTravelLog=[];
  const pickups = [];
  const lineNodes = [];
  const particles = [];
  const trails = [];

  const graphicsNotice=document.createElement('div');graphicsNotice.className='gg-graphics-recovery';graphicsNotice.hidden=true;
  graphicsNotice.setAttribute('role','status');overlay.appendChild(graphicsNotice);
  function releasePrimaryOwners(){
    if(primaryOwnersReleased)return;
    primaryOwnersReleased=true;
    const model=skaterAsset.releasePrimary();
    gardenWorld.dispose();staticParkBatch?.dispose();
    const scenery=structuredClone(gardenWorld.root.userData.primaryRelease);
    const groups=[root,contactShadow].map(disposeOwnedSportsPrimaryGroup);
    authoredMaterials.dispose();
    primaryReleaseReceipt={model,scenery,groups,canvasScene:canvasPresentation.snapshot().renderer,
      canvasAthlete:canvasPresentation.snapshot().originalAthlete.delivery};
  }
  function switchToCanvas(reason){
    if(canvasReady)return canvasReady;
    graphicsLoading=true;releaseControls();physicsClock.reset();frameTelemetry.reset();
    detachContextGuard();premiumRender.destroy();presentationHost.switchCanvas(reason);
    renderer.setPixelRatio(arcadePixelRatio(1.5));renderer.setSize(mount.clientWidth||960,mount.clientHeight||560,false);
    canvasPresentation=createSkateCanvasPresentation({world:theme.world,renderer,camera,sceneData:gardenWorld.canvasScene(),ramps:rampZones,platforms:platformZones,rails:railZones,heroScale:skater.scale.y});
    graphicsNotice.hidden=false;graphicsNotice.textContent='Getting your park ready…';
    canvasReady=canvasPresentation.ready.then(async ready=>{
      if(!running)return false;
      if(ready){await primaryAssetsReady;if(!running)return false;releasePrimaryOwners();}
      physicsClock.reset();lastTime=0;
      if(ready){graphicsLoading=false;graphicsNotice.hidden=true;}
      else{
        graphicsNotice.textContent='The skater artwork could not load. ';
        const retry=document.createElement('button');retry.type='button';retry.textContent='Try graphics again';retry.onclick=()=>{canvasPresentation.dispose();canvasPresentation=null;canvasReady=null;switchToCanvas(reason);};graphicsNotice.appendChild(retry);
      }return ready;
    });return canvasReady;
  }

  const detachResize = attachResize({
    mount,
    renderer,
    camera,
    width: () => mount.clientWidth || 960,
    height: () => mount.clientHeight || 560,
    listenToWindow: false,
    updateStyle: false,
    onResize: () => { reassessQualityTier(); renderGate.invalidate(); }
  });

  function clearPickups() {
    while (pickups.length) {
      const pickup = pickups.pop();
      pickupsRoot.remove(pickup.group);
      disposeObject(pickup.group);
    }
  }

  function clearLineNodes() {
    while (lineNodes.length) {
      const node = lineNodes.pop();
      node.button?.remove();
      lineRoot.remove(node.group);
      disposeObject(node.group);
    }
  }

  function safeLearningPosition(index, seedOffset = 0) {
    return chooseSkateDestination(player.pos,player.yaw,index,seedOffset,lineNodes.map(item=>item.group.position),rampZones,platformZones,parkObstacles);
  }

  function destinationExclusions(button) {
    return lineNodes
      .filter(item=>item.button!==button && Math.hypot(player.pos.x-item.group.position.x,player.pos.z-item.group.position.z)>item.radius+2)
      .map(item=>({x:item.group.position.x,z:item.group.position.z,radius:Math.max(.5,item.radius-2)}));
  }

  function recoverSelectedRouteAfterContact(kind) {
    if(!assistRoute.length||!selectedIntent||selectedIntent.levelIndex!==levelIndex||selectedIntent.step!==lineStep)return;
    const target=lineNodes.find(item=>item.label===selectedIntent.label);
    if(!target)return;
    const result=assistRouteRecovery.recover(player.pos,target.destination,rampZones,platformZones,[...parkObstacles,...destinationExclusions(target.button)],assistRoute);
    assistRoute=result.route;
    assistContactRecoveries.push({kind,reason:result.reason,replanned:result.replanned,position:{x:player.pos.x,z:player.pos.z},target:{x:target.destination.x,z:target.destination.z},route:assistRoute.map(point=>({...point}))});
    if(assistContactRecoveries.length>30)assistContactRecoveries.shift();
    if(!assistRoute.length){message="Use the arrows to skate around, or choose the part again.";messageTimer=3;}
  }

  function choiceButton(label, position, kind) {
    const button=document.createElement("button");
    button.type="button";button.className="gg-world-choice";button.textContent=label;
    button.dataset.skateChoice=kind;button.dataset.value=label;
    button.setAttribute("aria-label",`Skate to ${label}`);
    button.style.width=`${Math.max(64,Math.min(150,label.length*17+24))}px`;
    button.addEventListener("click",()=>{
      if(paused||completed||assetsLoading||graphicsLoading)return;
      frameTelemetry.markInput();
      const sameIntent=selectedIntent?.levelIndex===levelIndex&&selectedIntent.step===lineStep&&selectedIntent.label===label;
      if(!sameIntent) {
        recordChoice(label,"selected-skate-destination",true);
        if(label!==level.segments[lineStep])teachWrongPart(label);
      }
      selectedIntent={levelIndex,step:lineStep,label,responseCounted:true};
      mount.dataset.skateDestination=label;
      // Destination steering must not collect a different answer on the way.
      // These are navigation exclusions only: manual skating still contacts all choices.
      const others=destinationExclusions(button);
      assistRouteRecovery.reset();
      assistRoute=planSkateRoute(player.pos,position,rampZones,platformZones,[...parkObstacles,...others]);
      assistTravelLog.push({start:{x:player.pos.x,z:player.pos.z,yaw:player.yaw,speed:Math.max(0,player.speed)},target:{...position},route:assistRoute.map(point=>({...point})),radius:4.2,maxSpeed:MAX_SPEED[difficulty]});
      if(assistTravelLog.length>60)assistTravelLog.shift();
      mount.dataset.skateTravelLog=JSON.stringify(assistTravelLog);
      saveCurrentSession();
    });
    button.addEventListener("keydown",event=>{const key={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"push",ArrowDown:"brake"}[event.key];if(key){event.preventDefault();setKey(key,true);}});
    mount.appendChild(button);return button;
  }

  function updateWorldChoices() {
    const choices=lineReady?[]:lineNodes,width=mount.clientWidth,height=mount.clientHeight;
    const cueRect=overlay.querySelector('[data-gg-panel="center"]').getBoundingClientRect();
    const mountRect=mount.getBoundingClientRect();
    const short=width>=500&&height<=450;
    const choiceRowY=Math.min(cueRect.bottom-mountRect.top+38,height-132);
    const cameraForward=new THREE.Vector3();camera.getWorldDirection(cameraForward);
    for(const item of lineNodes) {
      const visible=choices.includes(item)&&!completed;
      item.button.hidden=!visible;item.button.disabled=paused||!visible;
      if(!visible)continue;
      const point=item.group.position.clone();point.y+=3.8;
      const inFront=point.clone().sub(camera.position).dot(cameraForward)>0;
      point.project(camera);
      const x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;
      const offscreen=short||!inFront||x<45||x>width-45||y<choiceRowY-28||y>height-132;
      item.button.dataset.offscreen=String(offscreen);
      fitChoice(item,offscreen);
      item.button.style.left=`${offscreen?(choices.indexOf(item)+.5)*width/choices.length:clamp(x,75,width-75)}px`;
      item.button.style.top=`${offscreen?choiceRowY:clamp(y,choiceRowY,height-132)}px`;
      if(short){item.button.style.left=`${width-248+(choices.indexOf(item)+.5)*80}px`;item.button.style.top="112px";}
      item.button.dataset.worldX=item.group.position.x.toFixed(2);item.button.dataset.worldZ=item.group.position.z.toFixed(2);
    }
    function fitChoice(item,offscreen) {
      const length=item.label.length;
      const available=short?72:width/choices.length-12;
      const fitted=Math.min(Math.max(64,length*17+32+(offscreen?24:0)),150,available);
      item.button.style.width=`${fitted}px`;
      item.button.style.fontSize=`${short?18:Math.max(18,Math.min(28,(fitted-28-(offscreen?22:0))/(length*.65)))}px`;
    }
    // Near-collinear destinations must never produce overlapping touch targets.
    const overlap=choices.some((a,i)=>choices.slice(i+1).some(b=>
      Math.abs(parseFloat(a.button.style.left)-parseFloat(b.button.style.left))<(parseFloat(a.button.style.width)+parseFloat(b.button.style.width))/2+10 &&
      Math.abs(parseFloat(a.button.style.top)-parseFloat(b.button.style.top))<66));
    if(overlap&&!short) choices.forEach((item,index)=>{
      item.button.dataset.offscreen="true";
      fitChoice(item,true);
      item.button.style.left=`${(index+.5)*width/choices.length}px`;
      item.button.style.top=`${choiceRowY}px`;
    });
  }

  function createLineNode(label, index, position, coach, correctChoice) {
    const group = new THREE.Group();
    group.position.set(position.x, 0.18, position.z);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3454c8,
      transparent: true,
      opacity: 0.34,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.12, 8, 42), ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.78, 1.8, 4),
      new THREE.MeshBasicMaterial({ color: 0xe9edf9, transparent: true, opacity: 0.72, depthWrite: false })
    );
    arrow.position.y = 2.25;
    arrow.rotation.y = Math.PI * 0.25;
    group.add(arrow);
    lineRoot.add(group);
    lineNodes.push({ button:choiceButton(label,position,"part"), destination:position, group, ring, ringMat, arrow, index, label, coach, radius: 4.2, correct: label === correctChoice });
  }

  function rebuildLineChoices() {
    clearLineNodes();
    const expected = level.segments[lineStep];
    if (!expected) return;
    const choices = grammarGrindSegmentChoices(level, ladder, lineStep, levelIndex + (opts.sessionSeed || 0));
    choices.forEach((segment, index) => {
      createLineNode(
        segment,
        index,
        safeLearningPosition(index, lineStep + levelIndex + (opts.journey?.route || 0)),
        lineStep === level.segments.length - 1
          ? `${expected} completes ${level.audioWord}. Word built!`
          : "Good. Listen for the next part.",
        expected
      );
    });
  }

  function placeLineNodes() {
    lineStep = 0;
    wordMistakes = 0;
    lineReady = false;
    lineChoiceCooldown = 0;
    rebuildLineChoices();
  }

  function placePickup(pickup, seedOffset = 0) {
    const rand = seeded((levelIndex + 1) * 8803 + seedOffset * 97 + Math.floor(performance.now() * 0.01));
    let x = 0;
    let z = 0;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = 16 + rand() * 56;
      x = Math.sin(angle) * radius;
      z = Math.cos(angle) * radius;
      if (Math.hypot(x - player.pos.x, z - player.pos.z) > 16) break;
    }
    pickup.group.position.set(x, 1.8, z);
    pickup.group.visible = true;
    pickup.collected = false;
    pickup.respawn = 0;
  }

  function createPickup(index) {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.13, 8, 28), shared.token);
    ring.castShadow = true;
    group.add(ring);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.54, 0), shared.gate);
    core.castShadow = true;
    group.add(core);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.65, 0.045, 6, 32),
      new THREE.MeshBasicMaterial({ color: theme.gate || theme.accent2, transparent: true, opacity: 0.55, depthWrite: false })
    );
    halo.rotation.x = Math.PI / 2;
    group.add(halo);
    pickupsRoot.add(group);
    const pickup = { group, ring, core, halo, collected: false, respawn: 0, index };
    pickups.push(pickup);
    placePickup(pickup, index);
  }

  function placePickups() {
    clearPickups();
    const count = TOKEN_COUNT[difficulty] || TOKEN_COUNT.easy;
    for (let i = 0; i < count; i += 1) createPickup(i);
  }

  function setHudText(node,value) { if(node.textContent !== String(value)) node.textContent=String(value); }
  function loadWordPicture({retry=false}={}) {
    const url=getChildWordAsset(level.audioWord)?.image||null;
    if(pictureRequested&&url===pictureUrl&&!retry)return;
    pictureRequested=true;
    pictureUrl=url;pictureDelivery=url?"pending":"unavailable";
    el.picture.hidden=!url;el.pictureRecovery.hidden=Boolean(url);
    if(url)el.picture.src=url;else el.picture.removeAttribute("src");
  }
  function updateHud() {
    const canHearLevel = getSound() && levelSpeechParts().some(part => hasRecordedSpeech(part));
    el.hear.style.display = "";
    el.hear.disabled = !canHearLevel;
    setHudText(el.level, `Word ${levelIndex + 1} of ${ladder.length}`);
    setHudText(el.score, `${Math.max(0, Math.round(score))} pts`);
    setHudText(el.combo, `Combo x${combo}`);
    setHudText(el.prompt, completed ? "Park complete" : lineReady ? `${level.audioWord} complete!` : "Build the word you hear");
    loadWordPicture();
    setHudText(el.sentence, level.segments.map((segment, index) => (index < lineStep ? segment : "_")).join("  "));
    setHudText(el.cue, lineReady ? level.focus : phonicsTargetHint(level.audioWord, wordMistakes));
    overlay.dataset.correction = String(correctionTimer > 0);
    setHudText(el.coach, correctionTimer > 0 ? coachText : "");
    setHudText(el.hear, getSound() ? "Hear" : "Sound off");
    el.hear.setAttribute("aria-label", getSound() ? "Hear the word again" : "Sound off. Turn on sound in game controls");
    setHudText(el.world, theme.name);
    setHudText(el.speed, `${Math.round(Math.abs(player.speed) * 3.2)} kmh`);
    setHudText(el.trick, player.grind > 0 ? "Grinding rail" : !player.onGround ? (player.airTricks > 1 ? "Double spin" : player.airTricks ? "Air spin" : "Ollie") : message || (lineReady ? "Word complete!" : "Find the next spelling part"));
    setHudText(el.style, lineReady
      ? `${level.audioWord} is ready`
      : lineStep < level.segments.length
        ? `Part ${lineStep + 1} of ${level.segments.length}`
        : styleWindow > 0
          ? `Style bank ${Math.round(styleScore)}`
          : "Build words and skate");
    if (phase === "countdown") {
      el.banner.style.display = "block";
      setHudText(el.banner, phaseTimer > 2.35 ? "LISTEN" : phaseTimer > 1.55 ? "3" : phaseTimer > 0.8 ? "2" : phaseTimer > 0.2 ? "1" : "GO");
    } else if (messageTimer > 0 && message && correctionTimer <= 0) {
      el.banner.style.display = "block";
      setHudText(el.banner, message);
      el.banner.style.fontSize = "clamp(1rem,2vw,1.3rem)";
    } else {
      el.banner.style.display = "none";
      el.banner.style.fontSize = "";
    }
  }

  function levelSpeechParts() {
    return [level.prompt, level.audioWord].filter(Boolean);
  }

  // This word owns its recordings, including clips queued during loading.
  // Only the actual whole-word end receipt establishes delivered stimulus.
  function speakLevelAloud({replay=false}={}) {
    if (assetsLoading || paused) return;
    if(replay&&pictureDelivery==="unavailable")loadWordPicture({retry:true});
    if(replay)supportReasons.add("word-audio-replay");
    levelVoice?.abort();resultVoice?.abort();
    wordReceipt=null;wordDelivery=getSound()?"pending":"unavailable";
    if(!getSound())return;
    const controller=new AbortController();levelVoice=controller;
    const currentLevel=levelIndex,word=level.audioWord;
    const parts = levelSpeechParts();
    const voice=(async()=>{
      for(const part of parts) {
        if(!running||controller.signal.aborted||!getSound()||currentLevel!==levelIndex)return;
        const options={signal:controller.signal};
        if(part===word) options.onEnd=source=>{
          if(controller.signal.aborted||levelVoice!==controller||levelIndex!==currentLevel)return;
          wordDelivery="delivered";wordReceipt={source,deliveredAt:new Date().toISOString(),playTimeMs:activeSimulationSeconds*1000};
        };
        await Promise.resolve(part===word?speakWord(part,options):speak(part,options)).catch(()=>{});
      }
      if(!controller.signal.aborted&&wordDelivery!=="delivered")wordDelivery="unavailable";
    })();
    resultDwell?.waitFor(voice);
    return voice;
  }

  function recordChoice(selected,inputAuthority,motorAssist=false) {
    evidence=recordSpellSkateChoice(evidence,{levelIndex,word:level.audioWord,segments:level.segments,step:lineStep,
      selected,choices:lineNodes.map(node=>node.label)}, {deliberate:true,inputAuthority,motorAssist,wordDelivery,wordReceipt,
      supportReasons:[...supportReasons],partialHint:Boolean(phonicsTargetHint(level.audioWord,wordMistakes)),soundEnabled:getSound(),
      graphicsRecovery:presentationHost.mode==="canvas"?"authored-skating-art":skater.userData.assetRecovery?"gzip-recovery":"primary"});
  }

  function teachWrongPart(selected) {
    ({mistakes,wordMistakes}=spellSkateWrongCounts({mistakes,wordMistakes},{selected,expected:level.segments[lineStep]}));
    supportReasons.add("teaching-feedback");combo=1;correctionTimer=2.8;
    message=`${selected} is not next`;messageTimer=1.45;
    const hint=phonicsTargetHint(level.audioWord,wordMistakes);
    coachText=hint?`Hint: ${hint}. Listen again.`:`You chose ${selected}. Hear that sound, then listen to the word.`;
    sfx(playSoftBuzz);
    if(!getSound())return;
    levelVoice?.abort();resultVoice?.abort();wordDelivery="pending";wordReceipt=null;
    const controller=new AbortController();levelVoice=controller;
    const currentLevel=levelIndex,word=level.audioWord;
    (async()=>{
      await speakPhoneme(selected,{signal:controller.signal}).catch(()=>{});
      if(controller.signal.aborted||!running||currentLevel!==levelIndex)return;
      await speakWord(word,{signal:controller.signal,onEnd:source=>{
        if(controller.signal.aborted||levelVoice!==controller||levelIndex!==currentLevel)return;
        wordDelivery="delivered";wordReceipt={source,deliveredAt:new Date().toISOString(),playTimeMs:activeSimulationSeconds*1000};
      }}).catch(()=>{});
      if(!controller.signal.aborted&&wordDelivery!=="delivered")wordDelivery="unavailable";
    })();
  }

  function loadLevel(index, introMessage = "Collect the spelling parts", introCoach = null) {
    physicsClock.reset();
    levelVoice?.abort();resultVoice?.abort();wordReceipt=null;wordDelivery="pending";
    supportReasons.clear();motorIntent=false;selectedIntent=null;
    levelIndex = clamp(index, 0, ladder.length - 1);
    level = ladder[levelIndex];
    placePickups();
    placeLineNodes();
    if (difficulty === "easy" && index === startAt) {
      // Initialise the run once; completed words never teleport the skater. Leave movement
      // under the child's control and scatter every new choice around them.
      player.pos.set(0, 0, 24);
      player.yaw = Math.PI;
      player.speed = 0;
      player.vy = 0;
      player.air = 0;
      player.onGround = true;
    }
    message = index === startAt && introMessage === "Collect the spelling parts" ? "" : introMessage;
    correctionTimer = 0;
    coachText = introCoach || level.teaching || level.cue;
    messageTimer = 1.25;
    opts.onProgressUpdate?.(levelIndex, ladder.length);
    opts.onCheckpoint?.(levelIndex, ladder.length);
    updateHud();
    // Level labels and pickups are replaced here, so refresh the
    // premium material/bloom selection after the new live objects exist.
    premiumRender.prepareObject(scene);
    speakLevelAloud();
    saveCurrentSession();
  }

  function saveCurrentSession() {
    if (assetsLoading || completed || !running) return;
    const {pos,grindRail} = player;
    const physical=Object.fromEntries(Object.entries(player).filter(([key])=>!["pos","grindRail","lastContact"].includes(key)));
    const result=saveSpellSkateSession(progressScope,difficulty,{
      version:SPELL_SKATE_CONTENT_VERSION,checkpointSemantics:"active-word-index",
      sessionSeed:opts.sessionSeed||0,journeyIndex:opts.journey?.index||0,difficulty,index:levelIndex,
      sessionStartIndex,signature:spellSkateSignature(ladder),score,correct,mistakes,wordMistakes,
      activeSeconds:activeSimulationSeconds,phase,phaseTimer:Math.max(0,phaseTimer),lineStep,lineReady,lineChoiceCooldown,
      combo,comboTimer,styleWindow,styleScore,supportReasons:[...supportReasons],evidence,
      player:{...physical,pos:{x:pos.x,y:pos.y,z:pos.z},grindRailIndex:railZones.indexOf(grindRail)},
      pickups:pickups.map(pickup=>({x:pickup.group.position.x,z:pickup.group.position.z,collected:pickup.collected,respawn:pickup.respawn})),
      choices:lineNodes.map(node=>({label:node.label,x:node.group.position.x,z:node.group.position.z,contactLock:Boolean(node.contactLock)})),
      selectedIntent,assistRoute:assistRoute.map(point=>({x:point.x,z:point.z}))
    });
    lastSavedSeconds=activeSimulationSeconds;mount.dataset.skateSaved=String(result.localSaved);
  }

  function restoreSession() {
    if(!opts.resumedCheckpoint)return;
    const saved=loadSpellSkateSession(progressScope,{sessionSeed:opts.sessionSeed||0,journeyIndex:opts.journey?.index||0,
      difficulty,index:startAt,ladder,railCount:railZones.length,pickupCount:pickups.length});
    mount.dataset.skateRestored=String(Boolean(saved));
    if(!saved)return;
    sessionStartIndex=saved.sessionStartIndex;score=saved.score;correct=saved.correct;mistakes=saved.mistakes;wordMistakes=saved.wordMistakes;
    phase=saved.phase;phaseTimer=saved.phaseTimer;lineStep=saved.lineStep;lineReady=saved.lineReady;lineChoiceCooldown=saved.lineChoiceCooldown;
    combo=saved.combo;comboTimer=saved.comboTimer;styleWindow=saved.styleWindow;styleScore=saved.styleScore;
    evidence=saved.evidence;activeSimulationSeconds=saved.activeSeconds;lastSavedSeconds=activeSimulationSeconds;
    saved.supportReasons.forEach(reason=>supportReasons.add(reason));supportReasons.add("resumed-word-cue");
    const {pos,grindRailIndex,...physical}=saved.player;
    Object.assign(player,physical);player.pos.set(pos.x,pos.y,pos.z);player.grindRail=railZones[grindRailIndex]||null;player.lastContact=null;
    rebuildLineChoices();
    saved.choices.forEach((choice,index)=>{
      const node=lineNodes[index];node.group.position.set(choice.x,.18,choice.z);
      Object.assign(node.destination,{x:choice.x,z:choice.z});node.contactLock=choice.contactLock;
    });
    saved.pickups.forEach((state,index)=>{
      const pickup=pickups[index];pickup.group.position.set(state.x,1.8,state.z);
      pickup.collected=state.collected;pickup.respawn=state.respawn;pickup.group.visible=!state.collected;
    });
    selectedIntent=saved.selectedIntent;assistRoute=saved.assistRoute;motorIntent=false;
    scoreDirty=true;opts.onScoreUpdate?.(Math.round(score));updateSkater(0);updateCamera(1);updateHud();
  }

  function addScore(amount) {
    score = Math.max(0, score + amount);
    scoreDirty = true;
  }

  // Grinding adds fractional points every frame; only tell the host when the
  // rounded score actually changes, at most ~10Hz, so React isn't re-rendering
  // 60 times a second. force flushes the final value at game end.
  function flushScore(force = false) {
    if (!scoreDirty) return;
    const rounded = Math.max(0, Math.round(score));
    if (rounded === lastScoreSent) {
      scoreDirty = false;
      return;
    }
    const now = performance.now();
    if (!force && now - lastScoreSentAt < 100) return;
    lastScoreSent = rounded;
    lastScoreSentAt = now;
    scoreDirty = false;
    opts.onScoreUpdate?.(rounded);
  }

  function awardStyle(amount, label) {
    styleWindow = STYLE_WINDOW;
    styleScore = clamp(styleScore + amount, 0, 420);
    boostFlash = 0.2;
    addScore(amount * combo);
    if (label) {
      message = label;
      messageTimer = 0.95;
    }
  }

  function spawnTrail(time) {
    if (Math.abs(player.speed) < 9 && player.grind <= 0 && boostFlash <= 0) return;
    const mat = new THREE.MeshBasicMaterial({
      color: boostFlash > 0 ? theme.token || theme.accent : theme.gate || theme.accent2,
      transparent: true,
      opacity: boostFlash > 0 ? 0.38 : 0.2,
      depthWrite: false
    });
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 3.8), mat);
    streak.position.set(player.pos.x, 0.08 + player.air * 0.2, player.pos.z);
    streak.rotation.x = -Math.PI / 2;
    streak.rotation.z = -player.yaw + Math.sin(time * 7) * 0.08;
    trailsRoot.add(streak);
    trails.push({ mesh: streak, life: 0.38 });
  }

  function spawnBurst(position, color, count = 18) {
    count = particleCountForTier(qualityTier, count);
    const mat = makeMat(color, { emissive: color, emissiveIntensity: 0.8 });
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18 + Math.random() * 0.12, 0), mat.clone());
      mesh.position.copy(position);
      mesh.position.y += 4 + Math.random() * 3;
      particlesRoot.add(mesh);
      particles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 15, 5 + Math.random() * 9, (Math.random() - 0.5) * 15),
        life: 0.75 + Math.random() * 0.45
      });
    }
  }

  function finishGame() {
    if (completed) return;
    completed = true;
    phase = "complete";
    // A restored run includes its earned words and original scoring denominator.
    const stars = grammarGrindStars({ correct, total: Math.max(1, ladder.length - sessionStartIndex), mistakes });
    opts.onProgressUpdate?.(ladder.length, ladder.length);
    sfx(playCelebrationFanfare);
    message = stars === 3 ? "Perfect run" : "Park cleared";
    messageTimer = 3.5;
    flushScore(true);
    opts.onComplete?.(stars, score, ladder.length, structuredClone(evidence));
  }

  function completeSpelledWord() {
    if (phase !== "playing" || lineStep !== level.segments.length) return;
    phase = "word-complete";
    phaseTimer = LEARNING_PACE.word / 1000;
    resultDwell?.cancel();
    resultDwell = createLearningDwell({ minimumMs: LEARNING_PACE.word, onAdvance: () => {} });
    resultDwell.waitFor(resultReadback());
    assistRoute = [];
    correct += 1;
    evidence=completeSpellSkateWord(evidence,levelIndex,level.audioWord,level.segments);
    rampAccents.forEach((material, i) => { if (i <= correct % Math.max(1, rampAccents.length)) { material.emissive.set(theme.accent); material.emissiveIntensity = .3 + correct * .025; } });
    combo = clamp(combo + 1, 1, 9);
    comboTimer = 6;
    const styleBonus = styleWindow > 0 ? Math.round((70 + styleScore) * combo) : 0;
    const lineBonus = 260 * combo;
    addScore(180 * combo + Math.round(Math.abs(player.speed) * 8) + styleBonus + lineBonus);
    boostFlash = 0.32;
    spawnBurst(player.pos, theme.correct, 22);
    sfx(playCorrectChime);
    sfx(playStarChime);
    message = `${level.audioWord} complete!`;
    coachText = `${level.segments.join(" + ")} spells ${level.audioWord}.`;
    messageTimer = 1.25;
    styleWindow = 0;
    styleScore = 0;
  }

  function nearestRail() {
    if (player.railLock > 0 || player.air > 4.2) return null;
    let nearest = null;
    for (const rail of railZones) {
      const hit = distanceToSegment(player.pos.x, player.pos.z, rail.ax, rail.az, rail.bx, rail.bz);
      if (hit.distance < 2.8 && (!nearest || hit.distance < nearest.hit.distance)) nearest = { rail, hit };
    }
    return nearest;
  }

  function startGrind({ rail, hit }) {
    const along = Math.atan2(rail.bx - rail.ax, rail.bz - rail.az);
    const travelHeading = player.yaw + (player.speed < 0 ? Math.PI : 0);
    player.grindDirection = Math.cos(travelHeading - along) >= 0 ? 1 : -1;
    player.yaw = along + (player.grindDirection < 0 ? Math.PI : 0);
    player.speed = Math.max(4, Math.abs(player.speed));
    player.grind = .95;
    player.grindRail = rail;
    player.grindT = hit.t;
    player.onGround = false;
    player.vy = 0;
    player.airTime = 0;
    player.airTricks = 0;
    player.spinAngle = player.spinTarget = 0;
    player.railIntent = 0;
    combo = clamp(combo + 1, 1, 9);
    awardStyle(24, "Rail +24");
    sfx(playPopSound);
  }

  function handleJump() {
    if (!keys.jumpPressed) return;
    keys.jumpPressed = false;
    if (phase !== "playing") return;
    const rail = nearestRail();
    const action = skateAction(player, Boolean(rail));
    if (action === "none") return;
    player.railIntent = .65;
    if (action === "grind") {
      startGrind(rail);
    } else if (action === "spin") {
      // Extra presses change the pose, never gravity or jump height. Two spins
      // per flight keeps holding/tapping from generating unlimited rewards.
      player.airTricks += 1;
      player.spinTarget += Math.PI * 2;
    } else {
      if (action === "pop-out") {
        player.grind = 0;
        player.grindRail = null;
        player.railLock = .8;
      }
      player.vy = action === "pop-out" ? 7.5 : 11 + Math.min(4, Math.abs(player.speed) * .14);
      player.onGround = false;
      player.air += .02;
      player.airTime = 0;
      player.airTricks = 0;
      player.spinAngle = player.spinTarget = 0;
    }
    sfx(playWhoosh);
  }

  function updateRamps(dt) {
    player.rampLock = Math.max(0, player.rampLock - dt);
    // Surface following is handled before jump/landing integration. Launches
    // happen only after leaving a real elevated lip, never upon rectangle entry.
  }

  function updateRails(dt) {
    player.railLock = Math.max(0, player.railLock - dt);
    if (player.grind > 0 && player.grindRail) {
      const rail = player.grindRail;
      player.grind -= dt;
      player.grindT = clamp(player.grindT + player.grindDirection * (dt * Math.max(0.12, Math.abs(player.speed))) / rail.length, 0, 1);
      const x = rail.ax + (rail.bx - rail.ax) * player.grindT;
      const z = rail.az + (rail.bz - rail.az) * player.grindT;
      // The deck underside meets the 1.30 m rail crown at either actor scale.
      const railContactHeight = 1.30 - .44 * skater.scale.y - .005;
      player.pos.set(x, 0, z);
      player.air = railContactHeight;
      player.vy = 0;
      player.onGround = false;
      addScore(dt * 18 * combo);
      if (player.grind <= 0 || (player.grindDirection > 0 ? player.grindT >= .98 : player.grindT <= .02)) {
        player.grind = 0;
        player.grindRail = null;
        player.railLock = 0.8;
        player.vy = 4.5;
      }
      return;
    }
    if ((!keys.jump && player.railIntent <= 0 && player.air < .35) || Math.abs(player.speed) < 3) return;
    const rail = nearestRail();
    if (rail) startGrind(rail);
  }

  function updatePlayer(dt) {
    let turn = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
    let push = keys.push ? 1 : 0;
    let brake = keys.brake ? 1 : 0;
    let assistSpeedLimit=14;
    if(assistRoute.length) {
      const steering=assistRouteRecovery.steering(player.pos,player.yaw,assistRoute);
      turn=steering.turn;push=steering.push;brake=steering.brake;assistSpeedLimit=steering.limit;
      player.speed=assistRoute.length?Math.max(0,player.speed):0;
    }
    const boostActive = Boolean(push && !brake && !assistRoute.length && phase === "playing" && player.stun <= 0 && player.grind <= 0);
    const wasStunned = player.stun > 0;
    player.stun = Math.max(0, player.stun - dt);
    player.landTime = Math.max(0, player.landTime - dt);
    player.recoverTime = Math.max(0, player.recoverTime - dt);
    if (wasStunned && player.stun === 0) player.recoverTime = .65;
    const moving=phase === "playing" && player.stun <= 0 && player.grind <= 0;
    const topSpeed=assistRoute.length?assistSpeedLimit:MAX_SPEED[difficulty]+8;
    const motion=skateMotion(player,{turn,push,brake,active:moving,boost:boostActive,maxSpeed:MAX_SPEED[difficulty],minSpeed:assistRoute.length?0:-MAX_SPEED[difficulty]*.45,topSpeed},dt);
    player.yaw=motion.yaw;player.speed=motion.speed;
    if (boostActive) boostFlash = .16;
    boostFlash = Math.max(0, boostFlash - dt);
    styleWindow = Math.max(0, styleWindow - dt);
    if (styleWindow <= 0) styleScore = Math.max(0, styleScore - dt * 24);
    player.railIntent = Math.max(0, player.railIntent - dt);
    handleJump();
    player.spinAngle = Math.min(player.spinTarget, player.spinAngle + dt * Math.PI * 2 / .42);

    const previousPosition = player.pos.clone();
    const previousHeight = player.air;
    const wasGrounded = player.onGround;
    if (player.grind <= 0) {
      const dir = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw));
      player.pos.addScaledVector(dir, player.speed * dt);
    }
    let surface = sampleSkateSurface(player.pos.x, player.pos.z, rampZones, platformZones);
    if (player.onGround && surface.height - previousHeight > Math.max(.5, Math.abs(player.speed) * dt * .9)) {
      player.pos.copy(previousPosition);
      player.speed *= -.18;
      player.stun = .25;
      player.motorRecoveries += 1;
      surface = sampleSkateSurface(player.pos.x, player.pos.z, rampZones, platformZones);
      recoverSelectedRouteAfterContact("raised-surface");
    }
    const surfaceHeight = surface.height;
    if (player.onGround && previousHeight - surfaceHeight > .4) {
      player.onGround = false;
      player.vy = Math.max(0, Math.abs(player.speed) * Math.sin(-player.surfacePitch) * .55);
      player.airTime = 0;
    }
    const tilt = skateSurfaceTilt(player.pos.x, player.pos.z, player.yaw, rampZones, platformZones);
    const blend = 1 - Math.exp(-12 * dt);
    player.surfacePitch += ((player.onGround ? tilt.pitch : 0) - player.surfacePitch) * blend;
    player.surfaceRoll += ((player.onGround ? tilt.roll : 0) - player.surfaceRoll) * blend;

    if (!player.onGround && player.grind <= 0) {
      player.vy -= 24 * dt;
      player.air += player.vy * dt;
      player.airTime += dt;
      if (player.air <= surfaceHeight) {
        player.air = surfaceHeight;
        player.vy = 0;
        player.onGround = true;
        player.landTime = .42;
        // Bank style only on landing after real travel; stationary tapping
        // cannot earn literacy credit or farm an endless airborne combo.
        if (player.airTime >= .95 && Math.abs(player.speed) > 6) {
          const style = 10 + player.airTricks * 8;
          awardStyle(style, player.airTricks ? `Spin landed +${style}` : "Style +10");
        }
        player.airTricks = 0;
        player.spinAngle = player.spinTarget = 0;
        player.airTime = 0;
        if (Math.abs(player.speed) > 6) addScore(12 * combo);
      }
    } else if (player.onGround && player.grind <= 0) {
      player.air = surfaceHeight;
    }

    if (player.onGround && player.grind <= 0) {
      const contact = resolveSkateObstacleContact(player.pos, previousPosition, parkObstacles, PLAYER_RADIUS);
      if (contact) {
        // This is local collision separation, not a respawn. Resolve at landing
        // as well as on the ground; the previous airborne position may already
        // overlap the object and must never become a permanent rollback target.
        const dx = contact.x - player.pos.x, dz = contact.z - player.pos.z;
        player.lastContact = { kind: wasGrounded ? "ground" : "landing", from: { x: player.pos.x, z: player.pos.z }, to: { ...contact } };
        if (!wasGrounded) player.landingRecoveries += 1;
        const inward = (Math.sin(player.yaw) * dx + Math.cos(player.yaw) * dz) * player.speed < 0;
        player.pos.x = contact.x;
        player.pos.z = contact.z;
        player.air = sampleSkateSurface(contact.x, contact.z, rampZones, platformZones).height;
        if (inward) player.speed *= -.18;
        player.stun = .25;
        player.motorRecoveries += 1;
        recoverSelectedRouteAfterContact("park-object");
      }
    }

    updateRamps(dt);
    updateRails(dt);

    if (Math.abs(player.pos.x) > ARENA_LIMIT - PLAYER_RADIUS) {
      player.pos.x = clamp(player.pos.x, -ARENA_LIMIT + PLAYER_RADIUS, ARENA_LIMIT - PLAYER_RADIUS);
      player.speed *= -0.22;
      sfx(playTapSound);
    }
    if (Math.abs(player.pos.z) > ARENA_LIMIT - PLAYER_RADIUS) {
      player.pos.z = clamp(player.pos.z, -ARENA_LIMIT + PLAYER_RADIUS, ARENA_LIMIT - PLAYER_RADIUS);
      player.speed *= -0.22;
      sfx(playTapSound);
    }
  }

  function updatePickups(dt, time) {
    pickups.forEach(pickup => {
      if (pickup.collected) {
        pickup.respawn -= dt;
        if (pickup.respawn <= 0) placePickup(pickup, pickup.index + levelIndex * 17);
        return;
      }
      pickup.group.position.y = 1.75 + Math.sin(time * 3.2 + pickup.index) * 0.34;
      pickup.ring.rotation.y += dt * 2.7;
      pickup.ring.rotation.x = Math.sin(time * 1.8 + pickup.index) * 0.42;
      pickup.core.rotation.x += dt * 2.1;
      pickup.core.rotation.y += dt * 3.4;
      pickup.halo.rotation.z += dt * 1.8;
      const dx = pickup.group.position.x - player.pos.x;
      const dz = pickup.group.position.z - player.pos.z;
      if (Math.hypot(dx, dz) < 3 && player.air < 4.5) {
        pickup.collected = true;
        pickup.group.visible = false;
        pickup.respawn = 6.5 + pickup.index * 0.13;
        awardStyle(14, "Token +14");
        spawnBurst(pickup.group.position, theme.token || theme.accent, 10);
        sfx(playPopSound);
      }
    });
  }

  function updateLineNodes(dt, time) {
    lineChoiceCooldown = Math.max(0, lineChoiceCooldown - dt);
    // A correct collision rebuilds lineNodes. Iterate a snapshot and stop after
    // one collision so newly created choices cannot be consumed in this frame.
    for (const node of [...lineNodes]) {
      node.group.visible = !lineReady;
      node.ringMat.opacity = 0.52 + Math.sin(time * 4.4 + node.index) * 0.12;
      node.group.scale.setScalar(0.94 + Math.sin(time * 3.6 + node.index) * 0.04);
      node.arrow.visible = true;
      node.arrow.rotation.y += dt * 2.4;
      node.arrow.position.y = 2.25 + Math.sin(time * 3 + node.index) * 0.35;
      if (lineReady || lineChoiceCooldown > 0) return;
      const dx = node.group.position.x - player.pos.x;
      const dz = node.group.position.z - player.pos.z;
      const inside = Math.hypot(dx,dz)<node.radius && player.air<4.8;
      if(!inside) node.contactLock=false;
      if(inside && !node.contactLock) {
        const selected=selectedIntent?.levelIndex===levelIndex&&selectedIntent.step===lineStep&&selectedIntent.label===node.label;
        const responseCounted=selected&&selectedIntent.responseCounted;
        if(!selected&&!motorIntent)continue;
        if(!selected)recordChoice(node.label,"manual-skate-contact");
        selectedIntent=null;
        node.contactLock=true;
        lineChoiceCooldown = 0.7;
        if (!node.correct) {
          if(assistRoute.length) player.speed=0;
          assistRoute=[];
          if(!responseCounted)teachWrongPart(node.label);
          spawnBurst(node.group.position, theme.wrong, 10);
          saveCurrentSession();
          break;
        }
        if (assistRoute.length) player.speed = 0;
        assistRoute = [];
        lineStep += 1;
        coachText = node.coach;
        awardStyle(18 + lineStep * 8, `${node.label} found`);
        spawnBurst(node.group.position, theme.token || theme.accent, 12);
        sfx(playPopSound);
        if (lineStep >= level.segments.length) {
          lineReady = true;
          clearLineNodes();
          completeSpelledWord();
        } else {
          rebuildLineChoices();
          message = "Listen for the next spelling part";
          messageTimer = 0.9;
        }
        saveCurrentSession();
        break;
      }
    }
  }

  function updateTrails(dt, time) {
    trailTimer -= dt;
    if (trailTimer <= 0 && phase === "playing") {
      spawnTrail(time);
      // Weaker tiers spawn trail streaks at a slower cadence (same look, fewer meshes).
      trailTimer = (boostFlash > 0 ? 0.045 : 0.09) / particleScale;
    }
    for (let i = trails.length - 1; i >= 0; i -= 1) {
      const trail = trails[i];
      trail.life -= dt;
      trail.mesh.material.opacity = Math.max(0, trail.life) * 0.42;
      trail.mesh.scale.x += dt * 1.2;
      trail.mesh.scale.y += dt * 2.8;
      if (trail.life <= 0) {
        trailsRoot.remove(trail.mesh);
        disposeObject(trail.mesh);
        trails.splice(i, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= dt;
      p.vel.y -= 16 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 5;
      p.mesh.rotation.y += dt * 7;
      p.mesh.scale.setScalar(clamp(p.life, 0, 1));
      if (p.life <= 0) {
        particlesRoot.remove(p.mesh);
        disposeObject(p.mesh);
        particles.splice(i, 1);
      }
    }
  }

  function updateSkater(dt) {
    skater.position.set(player.pos.x, .005 + player.air, player.pos.z);
    skater.rotation.order = "YXZ";
    skater.rotation.set(player.surfacePitch, player.yaw, player.surfaceRoll);
    skaterAsset.update(dt, player, { ...keys, push: keys.push || assistRoute.length > 0 });
    const contactHeight = sampleSkateSurface(player.pos.x,player.pos.z,rampZones,platformZones).height;
    contactShadow.position.set(player.pos.x,contactHeight+.03,player.pos.z);
    contactShadow.rotation.z = -player.yaw;
    contactShadow.material.opacity = Math.max(.18, .9 - Math.max(0,player.air-contactHeight)*.14);

  }

  function updateCamera(dt) {
    const width=mount.clientWidth,height=mount.clientHeight;
    const portrait=width<500&&height>width,short=width>=500&&height<=450;
    const heroHeight=(skater.userData.authoredHeight||3.8)*skater.scale.y;
    const heroPixels=portrait?Math.min(190,height*.32):120;
    const followDistance = portrait||short?Math.max(12.5,heroHeight*height/(2*Math.tan(camera.fov*Math.PI/360)*heroPixels)):11.5;
    const followHeight = 6.8;
    const sideOffset = portrait||short?0:1.7;
    const groundHeight = sampleSkateSurface(player.pos.x, player.pos.z, rampZones, platformZones).height;
    const airborneHeight = Math.max(0, player.air - groundHeight);
    const behind = new THREE.Vector3(
      -Math.sin(player.yaw) * followDistance,
      followHeight + groundHeight + airborneHeight * .3,
      -Math.cos(player.yaw) * followDistance
    );
    const side = new THREE.Vector3(Math.cos(player.yaw) * sideOffset, 0, -Math.sin(player.yaw) * sideOffset);
    const targetPos = player.pos.clone().add(behind).add(side);
    camera.position.lerp(targetPos, clamp(dt * 4.4, 0, 1));
    const look = player.pos.clone();
    look.y = 2.4 + groundHeight + airborneHeight * .6;
    if(portrait||short){
      const cueBottom=overlay.querySelector('[data-gg-panel="center"]').getBoundingClientRect().bottom-mount.getBoundingClientRect().top;
      const safeTop=cueBottom+(portrait?76:8),safeBottom=height-(portrait?136:12);
      const desiredCenter=(safeTop+safeBottom)/2;
      look.y=heroHeight*.5+(desiredCenter-height*.5)/height*2*Math.tan(camera.fov*Math.PI/360)*followDistance+groundHeight+airborneHeight*.6;
    }
    camera.lookAt(look);
  }

  function update(dt, time) {
    if (paused || completed || assetsLoading) return;
    if (phase === "countdown") {
      phaseTimer -= dt;
      if (phaseTimer <= 0) {
        phase = "playing";
        message = "Find the first spelling part";
        messageTimer = 1.2;
      }
    }
    if (phase === "word-complete") {
      phaseTimer -= dt;
      if (phaseTimer <= 0 && !resultDwell?.active) {
        if (levelIndex >= ladder.length - 1) { finishGame(); return; }
        phase = "playing";
        loadLevel(levelIndex + 1, message);
      }
    }
    messageTimer = Math.max(0, messageTimer - dt);
    correctionTimer = Math.max(0, correctionTimer - dt);
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboTimer <= 0 && combo > 1 && player.grind <= 0) combo = 1;
    updatePlayer(dt);
    updatePickups(dt, time);
    updateLineNodes(dt, time);
    updateTrails(dt, time);
    updateParticles(dt);
    updateSkater(dt);
    updateCamera(dt);
  }

  premiumRender.resize(mount.clientWidth || 960, mount.clientHeight || 560);

  let lastDiagnosticTime=0,activeSimulationSeconds=0,lastSavedSeconds=0;
  function render(now) {
    const frozen=paused||document.hidden;
    const revision=`${assetsLoading}:${graphicsLoading}:${presentationHost.mode}:${gardenWorld.root.userData.assetState}:${skater.userData.assetState}`;
    if(!renderGate.shouldRender(frozen,revision)){lastTime=now;physicsClock.reset();return;}
    const cpuStart=performance.now();
    const rawDelta = Math.max(.001,(now-lastTime || 16)/1000);
    const dt = Math.min(.12,rawDelta);
    lastTime = now;
    if(!paused && !completed && !assetsLoading&&!graphicsLoading){
      gardenWorld.update(dt,{camera:camera.position,player:player.pos,reducedMotion:motionQuery?.matches});
    }
    if (!paused && !completed && !assetsLoading&&!graphicsLoading && !document.hidden) {
      const steps = physicsClock.advance(rawDelta);
      for (const step of steps) { activeSimulationSeconds += step; update(step, activeSimulationSeconds); }
      if (!steps.length) updateSkater(0);
      if(activeSimulationSeconds-lastSavedSeconds>=5)saveCurrentSession();
    } else physicsClock.reset();
    mount.dataset.gardenWorldState = gardenWorld.root.userData.assetState;
    mount.dataset.authoredWorldState = gardenWorld.root.userData.assetState;
    mount.dataset.authoredWorldTime = String(gardenWorld.root.userData.animationTime || 0);
    flushScore();
    updateHud();
    if(now-lastDiagnosticTime>=100){
      lastDiagnosticTime=now;
    mount.dataset.skaterAsset = skater.userData.assetState;
    mount.dataset.skaterState = skater.userData.animationState;
    mount.dataset.skaterGrounded = String(player.onGround);
    mount.dataset.skaterHeight = player.air.toFixed(3);
    mount.dataset.skaterSpeed = player.speed.toFixed(2);
    mount.dataset.skaterAirTricks = String(player.airTricks);
    mount.dataset.skaterSpin = player.spinAngle.toFixed(3);
    mount.dataset.skaterAutoSpeed = String(keys.push && !keys.brake && !paused);
    mount.dataset.skaterActiveSeconds = activeSimulationSeconds.toFixed(2);
    mount.dataset.skaterHeading = player.yaw.toFixed(4);
    mount.dataset.skaterPosition = `${player.pos.x.toFixed(2)},${player.pos.z.toFixed(2)}`;
    mount.dataset.motorRecoveries = String(player.motorRecoveries);
    mount.dataset.skateLevel = String(levelIndex);
    mount.dataset.spellingStep = String(lineStep);
    mount.dataset.languageMistakes = String(mistakes);
    mount.dataset.skateAssist = String(assistRoute.length>0);
      mount.dataset.skaterFrameMs=(rawDelta*1000).toFixed(1);
      mount.dataset.skaterQuality=qualityTier;
    }
    updateWorldChoices();
    const renderedTier = presentationHost.mode==='canvas'?'canvas':premiumRender.render(dt);
    if(canvasPresentation){const pose=skaterAsset.presentationPose();canvasPresentation.draw({player,state:pose.state,phase:pose.phase,dt,groundHeight:sampleSkateSurface(player.pos.x,player.pos.z,rampZones,platformZones).height,choices:lineNodes.map(node=>({x:node.group.position.x,y:node.group.position.y,z:node.group.position.z})),pickups:pickups.filter(item=>!item.collected).map(item=>({x:item.group.position.x,y:item.group.position.y,z:item.group.position.z}))});}
    if (renderedTier !== 'canvas' && renderedTier !== qualityTier) {
      qualityTier = renderedTier;
      gardenWorld?.setQuality(qualityTier);
      particleScale = QUALITY_TIERS[qualityTier].particleScale;
      applyQualityTier(renderer, qualityTier);
    }
    const change=frameTelemetry.rendered(rawDelta*1000,{tier:renderedTier,active:!paused&&!completed&&!assetsLoading&&!graphicsLoading&&!document.hidden,cpuStart});
    if(change?.to==='canvas'){requestedRendererFallback=change;switchToCanvas(change.reason);}
    else if(change){qualityTier=change.to;applyQualityTier(renderer,qualityTier);premiumRender.setTier(qualityTier);gardenWorld.setQuality(qualityTier);particleScale=QUALITY_TIERS[qualityTier].particleScale;premiumRender.resize(mount.clientWidth||960,mount.clientHeight||560);}
  }
  const loop = createFrameLoop(render);

  function setKey(key, value) {
    if (value && (paused || completed || assetsLoading||graphicsLoading)) return;
    frameTelemetry.markInput();
    if(value) {assistRoute = [];selectedIntent=null;if(["left","right","push","brake"].includes(key))motorIntent=true;}
    if (value && !keys[key]) {
      if (key === "left" || key === "right") player.yaw += key === "left" ? 0.12 : -0.12;
      if (key === "push") player.speed = Math.max(player.speed, 1.8);
      if (key === "brake") player.speed = Math.min(player.speed, -1.2);
    }
    if (key === "jump" && value && !keys.jump) keys.jumpPressed = true;
    keys[key] = value;
  }

  function onKeyDown(event) {
    if (isInteractiveKeyTarget(event.target, event.key)) return;
    if (["ArrowLeft", "a", "A"].includes(event.key)) setKey("left", true);
    else if (["ArrowRight", "d", "D"].includes(event.key)) setKey("right", true);
    else if (["ArrowUp", "w", "W"].includes(event.key)) setKey("push", true);
    else if (["ArrowDown", "s", "S"].includes(event.key)) setKey("brake", true);
    else if (event.key === " " || event.key === "Enter") setKey("jump", true);
    else return;
    event.preventDefault();
  }

  function onKeyUp(event) {
    if (["ArrowLeft", "a", "A"].includes(event.key)) setKey("left", false);
    else if (["ArrowRight", "d", "D"].includes(event.key)) setKey("right", false);
    else if (["ArrowUp", "w", "W"].includes(event.key)) setKey("push", false);
    else if (["ArrowDown", "s", "S"].includes(event.key)) setKey("brake", false);
    else if (event.key === " " || event.key === "Enter") setKey("jump", false);
    else return;
    if (!isInteractiveKeyTarget(event.target)) event.preventDefault();
  }

  function bindButton(name, key) {
    const button = overlay.querySelector(`[data-gg-btn="${name}"]`);
    if (!button) return;
    const down = event => {
      event.preventDefault();
      if (event.repeat || paused || completed || assetsLoading) return;
      if (event.pointerId !== undefined) button.setPointerCapture?.(event.pointerId);
      button.style.transform = "translateY(2px) scale(.98)";
      setKey(key, true);
    };
    const up = event => {
      event?.preventDefault?.();
      button.style.transform = "";
      setKey(key, false);
    };
    button.addEventListener("keydown", event => { if ([" ", "Enter"].includes(event.key)) down(event); });
    button.addEventListener("keyup", event => { if ([" ", "Enter"].includes(event.key)) up(event); });
    button.addEventListener("blur", up);
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("lostpointercapture", up);
  }

  function releaseControls() {
    Object.keys(keys).forEach(key => { keys[key] = false; });
    overlay.querySelectorAll('[data-gg-btn]').forEach(button => { button.style.transform = ""; });
  }
  const resetVisibleClock = () => { physicsClock.reset(); lastTime = 0; if (document.hidden) { releaseControls(); saveCurrentSession(); } };
  document.addEventListener("visibilitychange", resetVisibleClock);
  window.addEventListener("blur", releaseControls);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  bindButton("left", "left");
  bindButton("right", "right");
  bindButton("push", "push");
  bindButton("brake", "brake");
  bindButton("jump", "jump");
  el.hear.addEventListener("click", ()=>speakLevelAloud({replay:true}));

  loadLevel(startAt);
  camera.position.set(0, 10, 42);
  camera.lookAt(0, 1.8, 0);
  restoreSession();
  if(presentationHost.mode==='canvas')switchToCanvas(presentationHost.reason);
  loop.start();
  primaryAssetsReady.then(()=>{
    if(!running)return;
    if(!primaryOwnersReleased)staticParkBatch=batchSportsStaticWorld(park);
    if(skater.userData.assetState==='error')switchToCanvas('primary-and-model-recovery-unavailable');
    assetsLoading=false;physicsClock.reset();lastTime=0;
    if(presentationHost.mode!=='canvas')premiumRender.prepareObject(skater);
    opts.onSessionStart?.();
    saveCurrentSession();
    if(lineReady){
      resultDwell=createLearningDwell({minimumMs:Math.max(0,phaseTimer)*1000,onAdvance:()=>{}});
      if(paused)resultDwell.pause();else resultDwell.waitFor(resultReadback());
    }else if(!paused)speakLevelAloud();
  });

  let introActive = false;

  const currentCanvasInput=()=>{const pose=skaterAsset.presentationPose();return{player,state:pose.state,phase:pose.phase,groundHeight:sampleSkateSurface(player.pos.x,player.pos.z,rampZones,platformZones).height,choices:lineNodes.map(node=>({x:node.group.position.x,y:node.group.position.y,z:node.group.position.z})),pickups:pickups.filter(item=>!item.collected).map(item=>({x:item.group.position.x,y:item.group.position.y,z:item.group.position.z}))};};
  if(import.meta.env.DEV)Object.defineProperty(mount,"skatePrepareAthleteCandidate",{configurable:true,value:async()=>{
    if(!running||!paused||graphicsLoading||presentationHost.mode!=='canvas')return false;
    return await canvasPresentation?.prepareAthleteCandidate()||false;
  }});
  if(import.meta.env.DEV)Object.defineProperty(mount,"skateAthleteFormat",{configurable:true,value:format=>{
    if(!running||!paused||graphicsLoading||presentationHost.mode!=='canvas')return false;
    return canvasPresentation?.selectAthleteFormat(currentCanvasInput(),format)||false;
  }});
  if(import.meta.env.DEV)Object.defineProperty(mount,"skateAthleteComparison",{configurable:true,value:()=>{
    if(!running||!paused||graphicsLoading||presentationHost.mode!=='canvas')return null;
    const beforeTime=activeSimulationSeconds,beforePlayer=JSON.stringify(player),beforeEvidence=JSON.stringify(evidence);
    const result=canvasPresentation?.compareAthleteCandidate(currentCanvasInput());
    return result?{...result,timeBefore:beforeTime,timeAfter:activeSimulationSeconds,controllerUnchanged:beforePlayer===JSON.stringify(player),evidenceUnchanged:beforeEvidence===JSON.stringify(evidence)}:null;
  }});

  function readRenderingReceipt() {
    if (!running) return null;
    const read = fn => { try { return fn(); } catch { return null; } };
    // Read only this already-created renderer's context; never allocate a
    // canvas/context or retain a live GL reference in a diagnostic receipt.
    const context = read(() => renderer.getContext?.()) || null;
    const lost = context ? read(() => context.isContextLost()) : null;
    const debug = context && lost !== true
      ? read(() => context.getExtension("WEBGL_debug_renderer_info")) : null;
    const parameter = key => context && lost !== true && key !== undefined
      ? read(() => context.getParameter(key)) : null;
    return {
      definition: "Read-only current renderer/context and existing latest600 active frame ledger; no new sampler or hardware presentation timing.",
      frameRows: frameTelemetry.snapshotFrameRows(),
      activeMode: presentationHost.mode, modeReason: presentationHost.reason,
      declared3DTier: qualityTier, effectivePremiumTier: premiumRender.effectiveTier,
      graphicsLoading, assetsLoading, paused, completed,
      qualityChange: requestedRendererFallback ? { ...requestedRendererFallback } : null,
      context: {
        status: !context ? "unavailable" : lost === true ? "lost" : lost === false ? "active" : "unknown",
        lost, maskedVendor: parameter(context?.VENDOR), maskedRenderer: parameter(context?.RENDERER),
        version: parameter(context?.VERSION), shadingLanguage: parameter(context?.SHADING_LANGUAGE_VERSION),
        debugExtensionAvailable: !!debug,
        unmaskedVendor: debug ? parameter(debug.UNMASKED_VENDOR_WEBGL) : null,
        unmaskedRenderer: debug ? parameter(debug.UNMASKED_RENDERER_WEBGL) : null,
        attributes: context && lost !== true ? read(() => { const attributes=context.getContextAttributes(); return attributes ? { ...attributes } : null; }) : null,
        drawingBufferSize: [renderer.domElement?.width ?? null, renderer.domElement?.height ?? null],
        pixelRatio: read(() => renderer.getPixelRatio()),
        connected: renderer.domElement?.isConnected ?? false
      },
      lastThreeInfo: { ...renderer.info.render, memory: { ...renderer.info.memory } },
      page: { visibilityState: document.visibilityState, focused: document.hasFocus() }
    };
  }
  if (import.meta.env.DEV) Object.defineProperty(mount, "skateRenderingReceipt", {
    configurable: true, get: readRenderingReceipt
  });

  const api = {
    debugSnapshot() {
      if(!running)return null;
      return {
        phase, paused, completed, assetsLoading,graphicsLoading, levelIndex, lineStep, mistakes, score,
        character:skaterAsset.snapshot(),qualityTier,
        presentation:{...presentationHost.snapshot(),canvas:canvasPresentation?.snapshot()||null,primaryOwnersReleased,primaryReleaseReceipt:primaryReleaseReceipt?structuredClone(primaryReleaseReceipt):null},
        performance:{...frameTelemetry.snapshot(),requestedRendererFallback:requestedRendererFallback?{...requestedRendererFallback}:null,
          renderCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures},
        scenery:structuredClone(gardenWorld.root.userData),materials:authoredMaterials.snapshot(),staticBatch:staticParkBatch?.snapshot()||null,
        camera:{position:camera.position.toArray(),matrix:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray()},
        wordDelivery,wordReceipt:wordReceipt?{...wordReceipt}:null,picture:{source:pictureUrl,delivery:pictureDelivery},supportReasons:[...supportReasons],evidence:structuredClone(evidence),
        position: { x: player.pos.x, z: player.pos.z },
        heading: player.yaw, speed: player.speed, height: player.air,
        grounded: player.onGround, stun: player.stun, grind: player.grind,
        motorRecoveries: player.motorRecoveries, landingRecoveries: player.landingRecoveries, lastContact: player.lastContact?structuredClone(player.lastContact):null, activeSeconds: activeSimulationSeconds,
        assistRoute: assistRoute.map(point => ({ ...point })),
        assistContactRecoveries:structuredClone(assistContactRecoveries),
        obstacles: parkObstacles.map(obstacle => ({ ...obstacle })),
        surfaces:{ramps:rampZones.map(zone=>({...zone})),rails:railZones.map(zone=>({...zone})),platforms:platformZones.map(zone=>({...zone}))}
      };
    },
    pause() {
      if(!running)return;
      resultDwell?.pause();levelVoice?.abort();resultVoice?.abort();
      paused = true;
      physicsClock.reset(); lastTime = 0;
      frameTelemetry.reset();
      releaseControls();
      saveCurrentSession();
    },
    resume() {
      if(!running)return;
      physicsClock.reset(); lastTime = 0;
      if (!introActive) { paused = false; if (resultDwell?.active) { resultDwell.waitFor(resultReadback()); resultDwell.resume(); } else if(wordDelivery!=="delivered")speakLevelAloud(); }
    },
    markSupported(reason="mission-help") {if(typeof reason==="string"&&reason.length>0&&reason.length<=100&&supportReasons.size<30)supportReasons.add(reason);},
    setSoundEnabled(enabled) {
      if(!running)return;
      if(!enabled){levelVoice?.abort();resultVoice?.abort();if(wordDelivery==="pending")wordDelivery="unavailable";}
      else if(!paused&&!completed&&!assetsLoading)speakLevelAloud({replay:true});
    },
    teardown() {
      if(!running)return;
      saveCurrentSession();
      resultDwell?.cancel();levelVoice?.abort();resultVoice?.abort();
      gardenWorld.dispose();staticParkBatch?.dispose();
      canvasPresentation?.dispose();
      running = false;
      if(import.meta.env.DEV){delete mount.skatePrepareAthleteCandidate;delete mount.skateAthleteFormat;delete mount.skateAthleteComparison;delete mount.skateRenderingReceipt;}
      el.picture.onload=el.picture.onerror=null;el.picture.removeAttribute("src");
      loop.stop();
      detachContextGuard();
      window.removeEventListener("blur", releaseControls);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", resetVisibleClock);

      motionQuery?.removeEventListener?.("change", syncMotionPreference);
      detachResize();
      clearPickups();
      clearLineNodes();
      disposeOwnedSportsPrimaryGroup(root);
      authoredMaterials.dispose();
      disposeOwnedSportsPrimaryGroup(contactShadow);
      skaterAsset.dispose();
      disposeObject(skater);
      particlesRoot.children.slice().forEach(child => {
        particlesRoot.remove(child);
        disposeObject(child);
      });
      trailsRoot.children.slice().forEach(child => {
        trailsRoot.remove(child);
        disposeObject(child);
      });
      premiumRender.destroy();
      disposeRenderer(renderer,{forceContextLoss:true});
      overlay.remove();
    }
  };
  detachContextGuard = presentationHost.mode==='canvas'?()=>{}:attachContextLossGuard(renderer, {
    onLost: () => switchToCanvas('webgl-context-lost'),
    onRestored: () => {
      premiumRender.restoreContext();
      api.resume();
    }
  });
  return api;
}

export default function GrammarGrindGame({
  difficulty = "easy",
  sessionSeed = 0, journey = null,
  startLevel = 0,
  resumedCheckpoint = false, progressScopeKey = "default",
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  onEngineReady,
  onSessionStart,
  isSoundEnabled = true
}) {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const soundRef = useRef(isSoundEnabled);

  useEffect(() => {
    soundRef.current = isSoundEnabled;
    engineRef.current?.setSoundEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const engine = startGame(mountRef.current, {
      difficulty,
      sessionSeed, journey,
      startLevel,
      resumedCheckpoint,progressScopeKey,
      onScoreUpdate,
      onProgressUpdate,
      onComplete,
      onCheckpoint,
      onSessionStart,
      getSound: () => soundRef.current
    });
    engineRef.current=engine;
    onEngineReady?.(engine);
    return () => {engine.teardown();engineRef.current=null;};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, sessionSeed]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        background: "#070b1a",
        touchAction: "none"
      }}
    />
  );
}
