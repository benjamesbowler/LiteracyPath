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
  grammarGrindChoiceFeedback,
  grammarGrindIsCorrect,
  grammarGrindLadder,
  grammarGrindSegmentChoices,
  grammarGrindStars
} from "../../../../utils/grammarGrindLevels.js";
import { hasRecordedSpeech, speak } from "../../../../utils/learnGamesAudio.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import { createRenderer, createScene, createPerspectiveCamera, attachResize, createFrameLoop, attachContextLossGuard, detectQualityTier, applyQualityTier, shadowMapForTier, particleCountForTier, QUALITY_TIERS, disposeRenderer, disposeObject } from "../shared/threeShell.js";
import { createArcadePremiumRenderPipeline } from "../shared/arcadePremiumRender.js";

import { createSpellSkater } from "./spellSkaterAsset.js";
import { createSkateRampGeometry, createSkateBowlGeometry, createSkateDeckGeometry, createSkateParkDressing, sampleSkateSurface, skateSurfaceTilt, skateObstacleAt, planSkateRoute, skateFrameSteps, nextSkateQuality, skateSteering, skateMotion, chooseSkateDestination } from "./spellSkatePark.js";

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
    correct: "#42b96e",
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
    correct: "#92ef72",
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
    correct: "#6cffd5",
    wrong: "#ff5bbd",
    rail: "#cfe6ff",
    world: "moonwood"
  }
};

const ARENA_LIMIT = 82;
const PLAYER_RADIUS = 2.15;
const MAX_SPEED = { easy: 9, medium: 29, hard: 33 };
const BOOST_MAX = 100;
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

function makeGroundTexture(theme) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 0, 512, 512);
  const rand = seeded(481);
  for (let i = 0; i < 4200; i += 1) {
    const x = rand() * 512, y = rand() * 512;
    ctx.strokeStyle = i % 2 ? "rgba(244,245,184,.08)" : "rgba(15,65,46,.10)";
    ctx.lineWidth = .5 + rand();
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+rand()*3-1.5,y-2-rand()*4); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 9);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function startGame(mount, opts) {
  const difficulty = ["easy", "medium", "hard"].includes(String(opts.difficulty)) ? String(opts.difficulty) : "easy";
  const ladder = grammarGrindLadder(difficulty);
  const theme = THEMES[difficulty] || THEMES.easy;
  const startAt = clamp(Number(opts.startLevel) || 0, 0, ladder.length - 1);
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
  let qualityTier = detectQualityTier();
  let particleScale = QUALITY_TIERS[qualityTier].particleScale;

  const renderer = createRenderer(THREE, {
    antialias: true,
    powerPreference: "high-performance",
    retryWithoutAntialias: false,
    pixelRatioCap: QUALITY_TIERS[qualityTier].pixelRatioCap,
    srgbOutput: true,
    toneMappingExposure: 1.1,
    shadowMap: shadowMapForTier(qualityTier, "pcf")
  });
  applyQualityTier(renderer, qualityTier);
  renderer.domElement.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none";
  mount.appendChild(renderer.domElement);

  const scene = createScene(THREE, new THREE.Fog(theme.fog, 86, 190));
  scene.background = new THREE.Color(theme.sky);
  const camera = createPerspectiveCamera(THREE, { fov: 60, aspect: 1, near: 0.1, far: 360 });

  const hemi = new THREE.HemisphereLight("#ffffff", theme.ground, 1.3);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff7e2", 2.1);
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

  const premiumRender = createArcadePremiumRenderPipeline({
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
    premiumRender.setTier(detectQualityTier());
    qualityTier = premiumRender.effectiveTier;
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
  const gatesRoot = new THREE.Group();
  scene.add(gatesRoot);
  const pickupsRoot = new THREE.Group();
  scene.add(pickupsRoot);
  const lineRoot = new THREE.Group();
  scene.add(lineRoot);
  const particlesRoot = new THREE.Group();
  scene.add(particlesRoot);
  const trailsRoot = new THREE.Group();
  scene.add(trailsRoot);

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

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA_LIMIT * 2.25, ARENA_LIMIT * 2.25, 16, 16),
    new THREE.MeshStandardMaterial({ map: makeGroundTexture(theme), roughness: 0.78, metalness: 0.04 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  park.add(ground);

  if (difficulty === "easy") {
    // A calm, readable route through Meadow School. The early spelling task
    // should look like a journey with a destination, not a grey free-roam
    // arena. The path also gives young children a strong forward cue.
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 152),
      makeMat("#f7dfa0", { roughness: 0.92, metalness: 0 })
    );
    path.rotation.x = -Math.PI / 2;
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
        makeMat(z % 26 === 10 ? "#f8c95a" : "#fff1bd", { roughness: 0.88 })
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
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.08, 0.42), shared.rampSide);
    stripe.position.set(x, height + 0.06, z + Math.cos(rot) * (depth * 0.43));
    stripe.rotation.y = rot;
    stripe.material = shared.rampSide.clone();
    rampAccents.push(stripe.material);
    park.add(stripe);
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
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 2.1),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
    );
    sign.position.set(0, 4.5, 0.06);
    sign.castShadow = true;
    group.add(sign);
    park.add(group);
  }

  if (difficulty === "easy") {
    // Keep the route open. Two distant side ramps make it feel like a skate
    // park without blocking the spelling route.
    addRamp(-51, -14, Math.PI, 12, 18, 3.6);
    addRamp(35, -64, -Math.PI * 0.12, 15, 18, 3.2);
    addSkillSign(-31, 28, Math.PI * 0.04, "LISTEN");
    addSkillSign(31, -8, -Math.PI * 0.04, "BUILD");
  } else {
    addRamp(-51, -14, Math.PI, 12, 18, 3.6);
    addRamp(38, 32, Math.PI * 1.18, 20, 22, 5.2);
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
  rampZones.push({x:-51,z:-39,rot:0,width:32,depth:32,radius:16,height:3.6,kind:"bowl"});
  const dressing = createSkateParkDressing(theme, difficulty);
  const parkObstacles = dressing.userData.obstacles;
  park.add(dressing);
  const skaterAsset = createSpellSkater();
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
      '<div style="margin-top:7px;width:142px;height:8px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.2);margin-left:auto;overflow:hidden"><div data-gg="boostbar" style="height:100%;width:42%;background:linear-gradient(90deg,#7df2ff,#ffe17a)"></div></div>' +
      '<div data-gg="style" style="margin-top:4px;font-size:.72rem;color:#d9f2ff;font-weight:900;text-transform:uppercase;letter-spacing:.08em">Style ready</div>' +
    '</div>' +
    '<div data-gg="banner" style="position:absolute;left:50%;bottom:100px;transform:translateX(-50%);max-width:75%;padding:7px 14px;border-radius:12px;background:rgba(12,39,47,.9);text-align:center;font-size:1.1rem;font-weight:800;display:none"></div>' +
    '<div data-gg-controls="left" style="position:absolute;bottom:18px;left:18px;display:flex;gap:10px;pointer-events:auto">' +
      '<button data-gg-btn="push" aria-label="Move forward" style="width:76px;height:64px;border:1px solid rgba(125,242,255,.52);background:linear-gradient(160deg,#7df2ff,#38bdf8);color:#07101d;font-size:.82rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">↑<br>FORWARD</button>' +
      '<button data-gg-btn="brake" aria-label="Move back" style="width:76px;height:64px;border:1px solid rgba(255,255,255,.3);background:rgba(6,10,28,.76);color:#fff;font-size:.82rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">↓<br>BACK</button>' +
    '</div>' +
    '<div data-gg-controls="right" style="position:absolute;bottom:18px;right:18px;display:flex;gap:10px;pointer-events:auto">' +
      '<button data-gg-btn="left" aria-label="Turn left" style="width:70px;height:64px;border:1px solid rgba(125,242,255,.42);background:rgba(6,10,28,.76);color:#fff;font-size:1.6rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">←</button>' +
      '<button data-gg-btn="right" aria-label="Turn right" style="width:70px;height:64px;border:1px solid rgba(125,242,255,.42);background:rgba(6,10,28,.76);color:#fff;font-size:1.6rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">→</button>' +
      '<button data-gg-btn="boost" aria-label="Boost" style="width:72px;height:58px;border:1px solid rgba(125,242,255,.52);background:linear-gradient(160deg,#131b3d,#33e6ff);color:#fff;font-weight:950;border-radius:12px;box-shadow:0 10px 24px rgba(0,0,0,.3)">BOOST</button>' +
      '<button data-gg-btn="jump" aria-label="Jump trick" style="width:86px;height:68px;border:1px solid rgba(255,255,255,.58);background:linear-gradient(160deg,#fff0a8,#ffc83d 55%,#f59e0b);color:#201400;font-weight:950;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.3),inset 0 -8px 0 rgba(0,0,0,.2)">TRICK</button>' +
    '</div>' +
    (difficulty === "easy"
      ? '<div data-gg-guide style="position:absolute;right:18px;bottom:102px;width:min(190px,23vw);display:grid;justify-items:center;filter:drop-shadow(0 12px 18px rgba(29,73,57,.28))">' +
          '<img src="/images/pals/meadow-point.webp" alt="" style="display:block;width:100%;max-height:150px;object-fit:contain;object-position:center bottom">' +
          '<div style="margin-top:-13px;padding:6px 12px;border-radius:999px;background:rgba(255,250,226,.94);border:2px solid rgba(66,153,119,.45);color:#214d3e;font-size:.76rem;font-weight:950;box-shadow:0 7px 18px rgba(29,73,57,.16)">Explore and build the word</div>' +
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
        gap: 7px !important;
      }
      [data-gg-controls="right"] {
        left: auto !important;
        right: 10px !important;
        bottom: 10px !important;
        gap: 7px !important;
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
      }
      [data-gg-btn="brake"],
      [data-gg-btn="push"] {
        width: 64px !important;
      }
      [data-gg-btn="boost"] {
        display: none !important;
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
    sentence: overlay.querySelector('[data-gg="sentence"]'),
    cue: overlay.querySelector('[data-gg="cue"]'),
    coach: overlay.querySelector('[data-gg="coach"]'),
    hear: overlay.querySelector('[data-gg="hear"]'),
    world: overlay.querySelector('[data-gg="world"]'),
    speed: overlay.querySelector('[data-gg="speed"]'),
    trick: overlay.querySelector('[data-gg="trick"]'),
    boostbar: overlay.querySelector('[data-gg="boostbar"]'),
    style: overlay.querySelector('[data-gg="style"]'),
    banner: overlay.querySelector('[data-gg="banner"]')
  };
  overlay.appendChild(el.coach);
  el.coach.setAttribute("role", "status");
  el.coach.setAttribute("aria-live", "polite");
  if (difficulty === "easy") {
    el.score.style.display = "none";
    el.combo.style.display = "none";
  }

  let running = true;
  let paused = false;
  let lastTime = 0;
  let levelIndex = startAt;
  let level = ladder[levelIndex];
  let score = 0;
  let correct = 0;
  let mistakes = 0;
  let levelMisses = 0;
  let scoreDirty = false;
  let lastScoreSent = 0;
  let lastScoreSentAt = 0;
  let speechToken = 0;
  let combo = 1;
  let comboTimer = 0;
  let gateCooldown = 0;
  let message = "";
  let messageTimer = 0;
  let coachText = level.teaching || level.cue;
  let correctionTimer = 0;
  let boost = 42;
  let boostFlash = 0;
  let styleWindow = 0;
  let styleScore = 0;
  let lineStep = 0;
  let lineReady = false;
  let lineReadyDelay = 0;
  let lineChoiceCooldown = 0;
  let trailTimer = 0;
  let phase = "playing";
  let phaseTimer = 0;
  let completed = false;
  const keys = { left: false, right: false, push: false, brake: false, boost: false, jump: false, jumpPressed: false };
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
    trick: 0,
    railLock: 0,
    rampLock: 0,
    landTime: 0,
    recoverTime: 0,
    surfacePitch: 0,
    surfaceRoll: 0,
    motorRecoveries: 0
  };
  let assistRoute = [];
  const assistTravelLog=[];
  const gates = [];
  const pickups = [];
  const lineNodes = [];
  const particles = [];
  const trails = [];

  const detachResize = attachResize({
    mount,
    renderer,
    camera,
    width: () => mount.clientWidth || 960,
    height: () => mount.clientHeight || 560,
    listenToWindow: false,
    updateStyle: false,
    onResize: reassessQualityTier
  });

  function clearGates() {
    while (gates.length) {
      const gate = gates.pop();
      gate.button?.remove();
      gatesRoot.remove(gate.group);
      disposeObject(gate.group);
    }
  }

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
    return chooseSkateDestination(player.pos,player.yaw,index,seedOffset,[...lineNodes,...gates].map(item=>item.group.position),rampZones,platformZones,parkObstacles);
  }

  function choiceButton(label, position, kind) {
    const button=document.createElement("button");
    button.type="button";button.className="gg-world-choice";button.textContent=label;
    button.dataset.skateChoice=kind;button.dataset.value=label;
    button.setAttribute("aria-label",`${kind === "gate" ? "Skate through" : "Skate to"} ${label}`);
    button.style.width=`${Math.max(64,Math.min(150,label.length*17+24))}px`;
    button.addEventListener("click",()=>{
      if(paused||completed)return;
      mount.dataset.skateDestination=label;
      // Destination steering must not collect a different answer on the way.
      // These are navigation exclusions only: manual skating still contacts all choices.
      const others=(kind === "gate" ? gates : lineNodes)
        .filter(item=>item.button!==button && Math.hypot(player.pos.x-item.group.position.x,player.pos.z-item.group.position.z)>item.radius+2)
        .map(item=>({x:item.group.position.x,z:item.group.position.z,radius:Math.max(.5,item.radius-2)}));
      assistRoute=planSkateRoute(player.pos,position,rampZones,platformZones,[...parkObstacles,...others]);
      assistTravelLog.push({start:{x:player.pos.x,z:player.pos.z,yaw:player.yaw,speed:Math.max(0,player.speed)},target:{...position},route:assistRoute.map(point=>({...point})),radius:kind==="gate"?(difficulty==="easy"?4.2:4.8):4.2,maxSpeed:MAX_SPEED[difficulty]});
      mount.dataset.skateTravelLog=JSON.stringify(assistTravelLog);
    });
    button.addEventListener("keydown",event=>{const key={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"push",ArrowDown:"brake"}[event.key];if(key){event.preventDefault();setKey(key,true);}});
    mount.appendChild(button);return button;
  }

  function updateWorldChoices() {
    const choices=lineReady?gates:lineNodes,width=mount.clientWidth,height=mount.clientHeight;
    const choiceRowY=Math.min(height<500?110:145,height-125);
    const cameraForward=new THREE.Vector3();camera.getWorldDirection(cameraForward);
    for(const item of [...lineNodes,...gates]) {
      const visible=choices.includes(item)&&!completed;
      item.button.hidden=!visible;item.button.disabled=paused||!visible;
      if(!visible)continue;
      item.button.style.width=`${Math.min(Math.max(64,Math.min(150,item.button.textContent.length*17+24)),width/choices.length-12)}px`;
      const point=item.group.position.clone();point.y+=3.8;
      const inFront=point.clone().sub(camera.position).dot(cameraForward)>0;
      point.project(camera);
      const x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;
      const offscreen=!inFront||x<45||x>width-45||y<105||y>height-115;
      item.button.dataset.offscreen=String(offscreen);
      item.button.style.left=`${offscreen?(choices.indexOf(item)+.5)*width/choices.length:clamp(x,75,width-75)}px`;
      item.button.style.top=`${offscreen?choiceRowY:clamp(y,110,height-115)}px`;
      item.button.dataset.worldX=item.group.position.x.toFixed(2);item.button.dataset.worldZ=item.group.position.z.toFixed(2);
    }
    // Near-collinear destinations must never produce overlapping touch targets.
    const overlap=choices.some((a,i)=>choices.slice(i+1).some(b=>
      Math.abs(parseFloat(a.button.style.left)-parseFloat(b.button.style.left))<(parseFloat(a.button.style.width)+parseFloat(b.button.style.width))/2+10 &&
      Math.abs(parseFloat(a.button.style.top)-parseFloat(b.button.style.top))<66));
    if(overlap) choices.forEach((item,index)=>{
      item.button.dataset.offscreen="true";
      item.button.style.left=`${(index+.5)*width/choices.length}px`;
      item.button.style.top=`${choiceRowY}px`;
    });
  }

  function createLineNode(label, index, position, coach, correctChoice) {
    const group = new THREE.Group();
    group.position.set(position.x, 0.18, position.z);
    const ringMat = new THREE.MeshBasicMaterial({
      color: index === 0 ? theme.gate || theme.accent2 : index === 1 ? theme.token || theme.accent : theme.correct,
      transparent: true,
      opacity: 0.34,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.12, 8, 42), ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.78, 1.8, 4),
      new THREE.MeshBasicMaterial({ color: theme.token || theme.accent, transparent: true, opacity: 0.72, depthWrite: false })
    );
    arrow.position.y = 2.25;
    arrow.rotation.y = Math.PI * 0.25;
    group.add(arrow);
    lineRoot.add(group);
    lineNodes.push({ button:choiceButton(label,position,"part"), group, ring, ringMat, arrow, index, label, coach, radius: 4.2, correct: label === correctChoice });
  }

  function rebuildLineChoices() {
    clearLineNodes();
    const expected = level.segments[lineStep];
    if (!expected) return;
    const choices = grammarGrindSegmentChoices(level, ladder, lineStep, levelIndex);
    choices.forEach((segment, index) => {
      createLineNode(
        segment,
        index,
        safeLearningPosition(index, lineStep + levelIndex),
        lineStep === level.segments.length - 1
          ? `${expected} completes ${level.audioWord}. Now choose the built word.`
          : `Good. Now find ${level.segments[lineStep + 1]}.`,
        expected
      );
    });
  }

  function placeLineNodes() {
    lineStep = 0;
    lineReady = false;
    lineReadyDelay = 0;
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

  function createGate(choice, index, position, correctChoice) {
    const group = new THREE.Group();
    group.position.set(position.x, 0, position.z);
    group.rotation.y = Math.atan2(-position.x, -position.z);
    const isCorrect = choice === correctChoice;
    const gateColor = theme.gate || theme.accent2;
    const gateMat = makeMat(gateColor, { emissive: gateColor, emissiveIntensity: 0.38 });
    const frameMat = makeMat("#101a32", { roughness: 0.42, metalness: 0.18, emissive: gateColor, emissiveIntensity: 0.08 });
    const easyGate = difficulty === "easy";
    const gateSpan = easyGate ? 8.6 : 10.4;
    const gateHalf = gateSpan / 2;

    const postGeo = new THREE.BoxGeometry(0.68, 9.5, 0.68);
    const topGeo = new THREE.BoxGeometry(gateSpan, 0.68, 0.68);
    for (const x of [-gateHalf, gateHalf]) {
      const post = new THREE.Mesh(postGeo, frameMat);
      post.position.set(x, 4.75, 0);
      post.castShadow = true;
      group.add(post);
    }
    const top = new THREE.Mesh(topGeo, frameMat);
    top.position.set(0, 9.52, 0);
    top.castShadow = true;
    group.add(top);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(easyGate ? 6.2 : 7.5, 0.18, 0.34), gateMat);
    glow.position.set(0, 0.7, 0);
    group.add(glow);
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(easyGate ? 3.1 : 3.7, 11, 5, 1, true),
      new THREE.MeshBasicMaterial({ color: gateColor, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })
    );
    beam.position.set(0, 5.7, -0.28);
    beam.rotation.x = Math.PI;
    group.add(beam);

    const ringRadius = easyGate ? 3.9 : 4.6;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, 0.08, 8, 36), gateMat);
    ring.position.set(0, 4.5, -0.03);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), gateMat);
    marker.position.set(0, 10.55, 0);
    group.add(marker);

    group.userData = { choice, index, correct: isCorrect, cooldown: 0, marker, beam };
    gatesRoot.add(group);
    gates.push({ button:choiceButton(choice,position,"gate"), group, choice, correct: isCorrect, pos: group.position, radius: easyGate ? 4.2 : 4.8, cooldown: 0 });
  }

  function placeGates() {
    clearGates();
    const rand = seeded(levelIndex * 401 + (difficulty === "hard" ? 900 : difficulty === "medium" ? 500 : 100));
    const options = [...level.options];
    for (let i = 0; i < options.length; i += 1) {
      const swap = i + Math.floor(rand() * (options.length - i));
      [options[i], options[swap]] = [options[swap], options[i]];
    }
    options.forEach((choice, index) => {
      createGate(choice, index, safeLearningPosition(index, levelIndex), level.correct);
    });
  }

  function setHudText(node,value) { if(node.textContent !== String(value)) node.textContent=String(value); }
  function updateHud() {
    const canHearLevel = getSound() && levelSpeechParts().some(part => hasRecordedSpeech(part));
    el.hear.style.display = canHearLevel ? "" : "none";
    el.hear.disabled = !canHearLevel;
    setHudText(el.level, `${theme.name.split(" ")[0]} · Word ${levelIndex + 1}/${ladder.length}`);
    setHudText(el.score, `${Math.max(0, Math.round(score))} pts`);
    setHudText(el.combo, `Combo x${combo}`);
    const nextSegment = difficulty === "easy" ? level.segments?.[lineStep] : null;
    setHudText(el.prompt, completed ? "Park complete" : difficulty === "easy"
      ? lineReady
        ? `Choose ${level.audioWord}`
        : nextSegment ? `Collect ${nextSegment} next` : "Word built"
      : lineReady ? `Skate through ${level.audioWord}` : `Build ${level.audioWord}`);
    setHudText(el.sentence, level.segments.map((segment, index) => (index < lineStep ? segment : "_")).join("  "));
    setHudText(el.cue, level.focus || level.cue);
    overlay.dataset.correction = String(correctionTimer > 0);
    setHudText(el.coach, correctionTimer > 0 ? coachText : "");
    setHudText(el.hear, "♪");
    el.hear.setAttribute("aria-label", level.audioWord ? `Hear ${level.audioWord} again` : "Hear the word again");
    setHudText(el.world, theme.name);
    setHudText(el.speed, `${Math.round(Math.abs(player.speed) * 3.2)} kmh`);
    setHudText(el.trick, player.grind > 0 ? "Grinding rail" : player.air > 0.2 ? "Air trick" : message || (lineReady ? "Choose the built word" : "Find the next spelling part"));
    el.boostbar.style.width = `${Math.round(clamp(boost, 0, BOOST_MAX))}%`;
    el.boostbar.style.filter = boostFlash > 0 ? "brightness(1.75)" : "";
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
    } else if (messageTimer > 0 && message) {
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

  // speak() stops any clip that is already playing, so the parts are chained
  // one after another instead of fired together. Silent when sound is off or
  // no recorded clip exists - the game stays fully playable either way.
  function speakLevelAloud() {
    if (!getSound()) return;
    const token = (speechToken += 1);
    const parts = levelSpeechParts();
    const playPart = partIndex => {
      if (!running || token !== speechToken || !getSound() || partIndex >= parts.length) return;
      Promise.resolve(speak(parts[partIndex]))
        .catch(() => {})
        .then(() => playPart(partIndex + 1));
    };
    playPart(0);
  }

  function loadLevel(index, introMessage = "Collect the spelling parts", introCoach = null) {
    levelIndex = clamp(index, 0, ladder.length - 1);
    level = ladder[levelIndex];
    levelMisses = 0;
    placeGates();
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
    gateCooldown = 0.6;
    opts.onProgressUpdate?.(levelIndex, ladder.length);
    opts.onCheckpoint?.(levelIndex, ladder.length);
    updateHud();
    // Level labels, gates and pickups are replaced here, so refresh the
    // premium material/bloom selection after the new live objects exist.
    premiumRender.prepareObject(scene);
    speakLevelAloud();
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
    boost = clamp(boost + amount * 0.55, 0, BOOST_MAX);
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
    // Rate accuracy against the levels this run actually presented (a resumed
    // checkpoint run only plays ladder.length - startAt targets).
    const stars = grammarGrindStars({ correct, total: Math.max(1, ladder.length - startAt), mistakes });
    opts.onProgressUpdate?.(ladder.length, ladder.length);
    sfx(playCelebrationFanfare);
    message = stars === 3 ? "Perfect run" : "Park cleared";
    messageTimer = 3.5;
    flushScore(true);
    opts.onComplete?.(stars, score, ladder.length);
  }

  function handleGate(gate) {
    if (phase !== "playing" || !lineReady || gateCooldown > 0 || gate.cooldown > 0) return;
    gate.cooldown = 1.4;
    if (grammarGrindIsCorrect(gate.choice, level)) {
      if (assistRoute.length) player.speed = 0;
      assistRoute = [];
      correct += 1;
      rampAccents.forEach((material, i) => { if (i <= correct % Math.max(1, rampAccents.length)) { material.emissive.set(theme.accent); material.emissiveIntensity = .3 + correct * .025; } });
      combo = clamp(combo + 1, 1, 9);
      comboTimer = 6;
      const styleBonus = styleWindow > 0 ? Math.round((70 + styleScore) * combo) : 0;
      const lineBonus = lineReady ? 260 * combo : 0;
      addScore(180 * combo + Math.round(Math.abs(player.speed) * 8) + styleBonus + lineBonus);
      boost = clamp(boost + 18 + combo * 2, 0, BOOST_MAX);
      boostFlash = 0.32;
      spawnBurst(gate.pos, theme.correct, 22);
      sfx(playCorrectChime);
      if (lineBonus > 0) sfx(playStarChime);
      message = lineBonus > 0 ? `Word built +${lineBonus}` : styleBonus > 0 ? `Style word +${styleBonus}` : `Correct: ${gate.choice}`;
      coachText = level.success || level.teaching || level.cue;
      messageTimer = 1.25;
      lineReady = false;
      styleWindow = 0;
      styleScore = 0;
      if (levelIndex >= ladder.length - 1) finishGame();
      else loadLevel(levelIndex + 1, message, ladder[levelIndex + 1]?.teaching);
    } else {
      if(assistRoute.length) player.speed=0;
      assistRoute=[];
      mistakes += 1;
      levelMisses += 1;
      combo = 1;
      spawnBurst(gate.pos, theme.wrong, 12);
      sfx(playSoftBuzz);
      message = "Try that word again";
      coachText = grammarGrindChoiceFeedback(gate.choice, level, { reveal: levelMisses >= 2 });
      correctionTimer = 4;
      messageTimer = 1.6;
      gateCooldown = 0.8;
    }
  }

  function handleJump() {
    if (!keys.jumpPressed) return;
    keys.jumpPressed = false;
    if (!player.onGround || player.stun > 0) return;
    player.vy = 11 + Math.min(4, Math.abs(player.speed) * 0.14);
    player.onGround = false;
    player.air += 0.02;
    player.airTime = 0;
    player.trick = 0.8;
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
      player.grindT = clamp(player.grindT + (dt * Math.max(0.12, Math.abs(player.speed))) / rail.length, 0, 1);
      const x = rail.ax + (rail.bx - rail.ax) * player.grindT;
      const z = rail.az + (rail.bz - rail.az) * player.grindT;
      // The deck underside meets the 1.30 m rail crown at either actor scale.
      const railContactHeight = 1.30 - .44 * skater.scale.y - .005;
      player.pos.set(x, 0, z);
      player.air = railContactHeight;
      player.vy = 0;
      player.onGround = false;
      addScore(dt * 18 * combo);
      if (player.grind <= 0 || player.grindT >= 0.98) {
        player.grind = 0;
        player.grindRail = null;
        player.railLock = 0.8;
        player.vy = 4.5;
      }
      return;
    }
    if ((!keys.jump && player.air < 0.35) || player.railLock > 0 || Math.abs(player.speed) < 7) return;
    for (const rail of railZones) {
      const hit = distanceToSegment(player.pos.x, player.pos.z, rail.ax, rail.az, rail.bx, rail.bz);
      if (hit.distance < 2.8 && player.air < 4.2) {
        player.grind = 0.95;
        player.grindRail = rail;
        player.yaw = Math.atan2(rail.bx - rail.ax, rail.bz - rail.az);
        player.speed = Math.abs(player.speed);
        player.grindT = hit.t;
        player.airTime = 0;
        combo = clamp(combo + 1, 1, 9);
        awardStyle(24, "Rail +24");
        sfx(playPopSound);
        break;
      }
    }
  }

  function updatePlayer(dt) {
    let turn = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
    let push = keys.push ? 1 : 0;
    let brake = keys.brake ? 1 : 0;
    let assistSpeedLimit=14;
    if(assistRoute.length) {
      const steering=skateSteering(player.pos,player.yaw,assistRoute);
      turn=steering.turn;push=steering.push;brake=steering.brake;assistSpeedLimit=steering.limit;
      player.speed=assistRoute.length?Math.max(0,player.speed):0;
    }
    const boostActive = keys.boost && boost > 1 && phase === "playing" && player.stun <= 0 && player.grind <= 0;
    const wasStunned = player.stun > 0;
    player.stun = Math.max(0, player.stun - dt);
    player.landTime = Math.max(0, player.landTime - dt);
    player.recoverTime = Math.max(0, player.recoverTime - dt);
    if (wasStunned && player.stun === 0) player.recoverTime = .65;
    const moving=phase === "playing" && player.stun <= 0 && player.grind <= 0;
    const wasFast=Math.abs(player.speed)>6;
    const topSpeed=(assistRoute.length?assistSpeedLimit:MAX_SPEED[difficulty])+(boostActive?8:0);
    const motion=skateMotion(player,{turn,push,brake,active:moving,boost:boostActive,maxSpeed:MAX_SPEED[difficulty],minSpeed:assistRoute.length?0:-MAX_SPEED[difficulty]*.45,topSpeed},dt);
    player.yaw=motion.yaw;player.speed=motion.speed;
    if(moving){
      if(boostActive){boost=clamp(boost-dt*34,0,BOOST_MAX);boostFlash=.16;}
      else if(wasFast && player.onGround)boost=clamp(boost+dt*2.5,0,BOOST_MAX);
    }
    boostFlash = Math.max(0, boostFlash - dt);
    styleWindow = Math.max(0, styleWindow - dt);
    if (styleWindow <= 0) styleScore = Math.max(0, styleScore - dt * 24);
    handleJump();

    const previousPosition = player.pos.clone();
    const previousHeight = player.air;
    if (player.grind <= 0) {
      const dir = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw));
      player.pos.addScaledVector(dir, player.speed * dt);
    }
    let surface = sampleSkateSurface(player.pos.x, player.pos.z, rampZones, platformZones);
    if (player.onGround && (skateObstacleAt(player.pos.x,player.pos.z,parkObstacles) || surface.height - previousHeight > Math.max(.5, Math.abs(player.speed) * dt * .9))) {
      player.pos.copy(previousPosition);
      player.speed *= -.18;
      player.stun = .25;
      player.motorRecoveries += 1;
      surface = sampleSkateSurface(player.pos.x, player.pos.z, rampZones, platformZones);
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
        player.trick = 0;
        // Style is earned by real air (speed-boosted jumps, ramp launches) -
        // a stationary hop (~0.92s) stays below the threshold, so TRICK-spam
        // in place no longer farms style points and boost.
        if (player.airTime >= 0.95) awardStyle(10, "Style +10");
        player.airTime = 0;
        if (Math.abs(player.speed) > 6) addScore(12 * combo);
      }
    } else if (player.onGround && player.grind <= 0) {
      player.air = surfaceHeight;
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

  function updateGates(dt) {
    gateCooldown = Math.max(0, gateCooldown - dt);
    gates.forEach(gate => {
      gate.group.visible = lineReady;
      if (!lineReady) return;
      gate.cooldown = Math.max(0, gate.cooldown - dt);
      gate.group.rotation.z = Math.sin(performance.now() * 0.0018 + gate.group.userData.index) * 0.035;
      if (gate.group.userData.marker) {
        gate.group.userData.marker.rotation.y += dt * 3.2;
        gate.group.userData.marker.position.y = 9.45 + Math.sin(performance.now() * 0.003 + gate.group.userData.index) * 0.35;
      }
      if (gate.group.userData.beam) {
        gate.group.userData.beam.scale.setScalar(1 + Math.sin(performance.now() * 0.004 + gate.group.userData.index) * 0.06);
      }
      gate.group.children.forEach(child => {
        if (child.userData.billboard) child.lookAt(camera.position);
      });
      const dx = gate.pos.x - player.pos.x;
      const dz = gate.pos.z - player.pos.z;
      const inside = Math.hypot(dx,dz)<gate.radius && player.air<4.8;
      if(!inside) gate.contactLock=false;
      if(inside && !gate.contactLock){gate.contactLock=true;handleGate(gate);}
    });
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
        node.contactLock=true;
        lineChoiceCooldown = 0.7;
        if (!node.correct) {
          if(assistRoute.length) player.speed=0;
          assistRoute=[];
          mistakes += 1;
          combo = 1;
          message = `${node.label} is not next`;
          coachText = `Listen again. Find ${level.segments[lineStep]} next in ${level.audioWord}.`;
          messageTimer = 1.45;
          spawnBurst(node.group.position, theme.wrong, 10);
          sfx(playSoftBuzz);
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
          placeGates();
          lineReadyDelay = 0.8;
          clearLineNodes();
          coachText = `${level.segments.join(" + ")} spells ${level.audioWord}. Find and skate through ${level.audioWord}.`;
          message = "Word ready";
          messageTimer = 1;
          sfx(playStarChime);
        } else {
          rebuildLineChoices();
          message = `Now find ${level.segments[lineStep]}`;
          messageTimer = 0.9;
        }
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
    const followDistance = difficulty === "easy" ? 11.5 : 17;
    const followHeight = difficulty === "easy" ? 6.8 : 8.6;
    const sideOffset = difficulty === "easy" ? 1.7 : 3.2;
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
    camera.lookAt(look);
  }

  function update(dt, time) {
    if (paused || completed) return;
    if (phase === "countdown") {
      phaseTimer -= dt;
      if (phaseTimer <= 0) {
        phase = "playing";
        message = "Find the first spelling part";
        messageTimer = 1.2;
      }
    }
    lineReadyDelay = Math.max(0, lineReadyDelay - dt);
    messageTimer = Math.max(0, messageTimer - dt);
    correctionTimer = Math.max(0, correctionTimer - dt);
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboTimer <= 0 && combo > 1 && player.grind <= 0) combo = 1;
    updatePlayer(dt);
    updateGates(dt);
    updatePickups(dt, time);
    updateLineNodes(dt, time);
    updateTrails(dt, time);
    updateParticles(dt);
    updateSkater(dt);
    updateCamera(dt);
  }

  premiumRender.resize(mount.clientWidth || 960, mount.clientHeight || 560);

  let frameBudgetSeconds=0,frameBudgetCount=0,lastDiagnosticTime=0,activeSimulationSeconds=0;
  function render(now) {
    const time = now * 0.001;
    const rawDelta = Math.max(.001,(now-lastTime || 16)/1000);
    const dt = Math.min(.12,rawDelta);
    lastTime = now;
    if(!paused && !completed){
      activeSimulationSeconds+=dt;
      frameBudgetSeconds+=rawDelta;frameBudgetCount++;
      if(frameBudgetSeconds>=2 && frameBudgetCount>=5){
        const average=frameBudgetSeconds/frameBudgetCount;
        mount.dataset.skaterMeanFrameMs=(average*1000).toFixed(1);
        const next=nextSkateQuality(qualityTier,average);
        if(next!==qualityTier){qualityTier=next;applyQualityTier(renderer,next);premiumRender.setTier(next);particleScale=QUALITY_TIERS[next].particleScale;premiumRender.resize(mount.clientWidth||960,mount.clientHeight||560);}
        frameBudgetSeconds=0;frameBudgetCount=0;
      }
    }
    for(const step of skateFrameSteps(dt)) update(step,time);
    flushScore();
    updateHud();
    if(now-lastDiagnosticTime>=100){
      lastDiagnosticTime=now;
    mount.dataset.skaterAsset = skater.userData.assetState;
    mount.dataset.skaterState = skater.userData.animationState;
    mount.dataset.skaterGrounded = String(player.onGround);
    mount.dataset.skaterHeight = player.air.toFixed(3);
    mount.dataset.skaterSpeed = player.speed.toFixed(2);
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
    const renderedTier = premiumRender.render(dt);
    if (renderedTier !== qualityTier) {
      qualityTier = renderedTier;
      particleScale = QUALITY_TIERS[qualityTier].particleScale;
      applyQualityTier(renderer, qualityTier);
    }
  }
  const loop = createFrameLoop(render);

  function setKey(key, value) {
    if(value) assistRoute = [];
    if (key === "jump" && value && !keys.jump) keys.jumpPressed = true;
    keys[key] = value;
  }

  function onKeyDown(event) {
    if (isInteractiveKeyTarget(event.target)) return;
    if (["ArrowLeft", "a", "A"].includes(event.key)) setKey("left", true);
    else if (["ArrowRight", "d", "D"].includes(event.key)) setKey("right", true);
    else if (["ArrowUp", "w", "W"].includes(event.key)) setKey("push", true);
    else if (["ArrowDown", "s", "S"].includes(event.key)) setKey("brake", true);
    else if (event.key === "Shift" || event.key === "b" || event.key === "B") setKey("boost", true);
    else if (event.key === " " || event.key === "Enter") setKey("jump", true);
    else return;
    event.preventDefault();
  }

  function onKeyUp(event) {
    if (["ArrowLeft", "a", "A"].includes(event.key)) setKey("left", false);
    else if (["ArrowRight", "d", "D"].includes(event.key)) setKey("right", false);
    else if (["ArrowUp", "w", "W"].includes(event.key)) setKey("push", false);
    else if (["ArrowDown", "s", "S"].includes(event.key)) setKey("brake", false);
    else if (event.key === "Shift" || event.key === "b" || event.key === "B") setKey("boost", false);
    else if (event.key === " " || event.key === "Enter") setKey("jump", false);
    else return;
    if (!isInteractiveKeyTarget(event.target)) event.preventDefault();
  }

  function bindButton(name, key) {
    const button = overlay.querySelector(`[data-gg-btn="${name}"]`);
    if (!button) return;
    const down = event => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      button.style.transform = "translateY(2px) scale(.98)";
      if (key === "left" || key === "right") player.yaw += key === "left" ? 0.12 : -0.12;
      if (key === "push") player.speed = Math.max(player.speed, 1.8);
      if (key === "brake") player.speed = Math.min(player.speed, -1.2);
      setKey(key, true);
    };
    const up = event => {
      event?.preventDefault?.();
      button.style.transform = "";
      setKey(key, false);
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("lostpointercapture", up);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  bindButton("left", "left");
  bindButton("right", "right");
  bindButton("push", "push");
  bindButton("brake", "brake");
  bindButton("boost", "boost");
  bindButton("jump", "jump");
  el.hear.addEventListener("click", speakLevelAloud);

  loadLevel(startAt);
  camera.position.set(0, 10, 42);
  camera.lookAt(0, 1.8, 0);
  loop.start();

  let introActive = false;

  const api = {
    pause() {
      paused = true;
      Object.keys(keys).forEach(key=>{keys[key]=false;});
      speechToken += 1;
    },
    resume() {
      if (!introActive) paused = false;
    },
    teardown() {
      running = false;
      loop.stop();
      detachContextGuard();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

      motionQuery?.removeEventListener?.("change", syncMotionPreference);
      detachResize();
      clearGates();
      clearPickups();
      clearLineNodes();
      disposeObject(root);
      disposeObject(contactShadow);
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
      disposeRenderer(renderer);
      overlay.remove();
    }
  };
  const detachContextGuard = attachContextLossGuard(renderer, {
    onLost: () => api.pause(),
    onRestored: () => {
      premiumRender.restoreContext();
      api.resume();
    }
  });
  return api;
}

export default function GrammarGrindGame({
  difficulty = "easy",
  startLevel = 0,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  onEngineReady,
  isSoundEnabled = true
}) {
  const mountRef = useRef(null);
  const soundRef = useRef(isSoundEnabled);

  useEffect(() => {
    soundRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const engine = startGame(mountRef.current, {
      difficulty,
      startLevel,
      onScoreUpdate,
      onProgressUpdate,
      onComplete,
      onCheckpoint,
      getSound: () => soundRef.current
    });
    onEngineReady?.(engine);
    return () => engine.teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "520px",
        overflow: "hidden",
        background: "#070b1a",
        touchAction: "none"
      }}
    />
  );
}
