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
  grammarGrindStars
} from "../../../../utils/grammarGrindLevels.js";
import { hasRecordedSpeech, speak } from "../../../../utils/learnGamesAudio.js";
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

const THEMES = {
  easy: {
    name: "Meadow Skate School",
    sky: "#8fded4",
    fog: "#d9f2c1",
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

function wrapAngle(value) {
  let angle = value;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function localPoint(px, pz, zone) {
  const dx = px - zone.x;
  const dz = pz - zone.z;
  const c = Math.cos(-zone.rot);
  const s = Math.sin(-zone.rot);
  return {
    x: dx * c - dz * s,
    z: dx * s + dz * c
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
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function makeRampGeometry(width, depth, height) {
  const hw = width / 2;
  const hd = depth / 2;
  const positions = new Float32Array([
    -hw, 0, -hd, hw, 0, -hd, -hw, height, hd,
    hw, 0, -hd, hw, height, hd, -hw, height, hd,
    -hw, 0, hd, -hw, height, hd, hw, 0, hd,
    hw, 0, hd, -hw, height, hd, hw, height, hd,
    -hw, 0, -hd, -hw, height, hd, -hw, 0, hd,
    hw, 0, -hd, hw, 0, hd, hw, height, hd,
    -hw, 0, -hd, -hw, 0, hd, hw, 0, -hd,
    hw, 0, -hd, -hw, 0, hd, hw, 0, hd
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeQuarterPipeGeometry(width, radius, segments = 14) {
  const hw = width / 2;
  const positions = [];
  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 0.5;
    const b = ((i + 1) / segments) * Math.PI * 0.5;
    const ya = Math.sin(a) * radius;
    const za = -Math.cos(a) * radius;
    const yb = Math.sin(b) * radius;
    const zb = -Math.cos(b) * radius;
    positions.push(
      -hw, ya, za, hw, ya, za, -hw, yb, zb,
      hw, ya, za, hw, yb, zb, -hw, yb, zb
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
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
  const base = ctx.createLinearGradient(0, 0, 512, 512);
  base.addColorStop(0, theme.ground);
  base.addColorStop(0.52, theme.ground2);
  base.addColorStop(1, theme.ground);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "rgba(255,255,255,.045)";
  for (let y = 0; y < 512; y += 64) {
    for (let x = 0; x < 512; x += 64) {
      if ((x + y) % 128 === 0) ctx.fillRect(x, y, 64, 64);
    }
  }
  ctx.strokeStyle = "rgba(255,255,255,.13)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,.18)";
  ctx.lineWidth = 5;
  for (let i = 0; i < 22; i += 1) {
    const x = (i * 73) % 512;
    const y = (i * 139) % 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo((x + 24 + i * 7) % 512, y + 18);
    ctx.lineTo((x + 46 + i * 5) % 512, y + 26);
    ctx.stroke();
  }
  ctx.strokeStyle = theme.gate || theme.accent2;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(256, 256, 122, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.34)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(256, 72 + i * 96);
    ctx.lineTo(282, 98 + i * 96);
    ctx.lineTo(256, 124 + i * 96);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,.2)";
  ctx.font = "900 36px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SPELL", 256, 240);
  ctx.fillText("& SKATE", 256, 290);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 9);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function makeSkater(theme) {
  const group = new THREE.Group();
  const skin = makeMat("#c8793e", { roughness: 0.72 });
  const shirt = makeMat(theme.accent2, { roughness: 0.62, emissive: theme.accent2, emissiveIntensity: 0.04 });
  const shorts = makeMat("#253b66");
  const boardMat = makeMat("#ffcf4d", { roughness: 0.5, metalness: 0.06 });
  const dark = makeMat("#161923", { roughness: 0.8 });
  const shoe = makeMat("#f6f7ff", { roughness: 0.62 });

  const board = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.14, 4.15), boardMat);
  board.position.y = 0.25;
  board.castShadow = true;
  group.add(board);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.12, 0.54), boardMat);
  nose.position.set(0, 0.33, 2.18);
  nose.rotation.x = -0.35;
  group.add(nose);
  const tail = nose.clone();
  tail.position.z = -2.18;
  tail.rotation.x = 0.35;
  group.add(tail);

  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.28, 8);
  for (const x of [-0.72, 0.72]) {
    for (const z of [-1.35, 1.35]) {
      const wheel = new THREE.Mesh(wheelGeo, dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.06, z);
      wheel.castShadow = true;
      group.add(wheel);
    }
  }

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 0.62), shorts);
  hips.position.y = 1.08;
  hips.castShadow = true;
  group.add(hips);

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.24, 0.62), shirt);
  body.position.y = 1.9;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 1), skin);
  head.position.y = 2.82;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(new THREE.DodecahedronGeometry(0.56, 0), makeMat("#382012"));
  hair.scale.set(1.08, 0.42, 0.88);
  hair.position.set(0, 3.12, -0.04);
  hair.castShadow = true;
  group.add(hair);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.72), makeMat(theme.accent));
  cap.position.set(0, 3.2, 0.1);
  cap.castShadow = true;
  group.add(cap);

  const limbGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.9, 8);
  const armL = new THREE.Mesh(limbGeo, skin);
  armL.position.set(-0.74, 1.85, 0.16);
  armL.rotation.z = -0.62;
  armL.castShadow = true;
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.74;
  armR.rotation.z = 0.62;
  group.add(armR);

  const legL = new THREE.Mesh(limbGeo, skin);
  legL.position.set(-0.34, 0.75, 0.6);
  legL.rotation.x = 0.75;
  legL.castShadow = true;
  group.add(legL);
  const legR = legL.clone();
  legR.position.set(0.34, 0.75, -0.48);
  legR.rotation.x = -0.58;
  group.add(legR);

  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.72), shoe);
  footL.position.set(-0.38, 0.46, 0.98);
  footL.rotation.x = 0.12;
  footL.castShadow = true;
  group.add(footL);
  const footR = footL.clone();
  footR.position.set(0.38, 0.46, -0.92);
  group.add(footR);

  group.userData = { board, body, head, armL, armR, legL, legR };
  return group;
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
    srgbOutput: false,
    shadowMap: shadowMapForTier(qualityTier, "pcf")
  });
  applyQualityTier(renderer, qualityTier);
  renderer.domElement.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none";
  mount.appendChild(renderer.domElement);

  const scene = createScene(THREE, new THREE.Fog(theme.fog, 86, 190));
  scene.background = new THREE.Color(theme.sky);
  const camera = createPerspectiveCamera(THREE, { fov: 60, aspect: 1, near: 0.1, far: 360 });

  const hemi = new THREE.HemisphereLight("#ffffff", theme.ground, 1.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#ffffff", 2.1);
  sun.position.set(-44, 82, 38);
  sun.castShadow = qualityTier !== "low";
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  scene.add(sun);

  function reassessQualityTier() {
    qualityTier = detectQualityTier();
    particleScale = QUALITY_TIERS[qualityTier].particleScale;
    applyQualityTier(renderer, qualityTier);
    sun.castShadow = qualityTier !== "low";
  }
  const syncMotionPreference = () => reassessQualityTier();
  motionQuery?.addEventListener?.("change", syncMotionPreference);

  const root = new THREE.Group();
  scene.add(root);
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(230, 32, 16),
    new THREE.MeshBasicMaterial({ map: makeSkyTexture(theme, difficulty), side: THREE.BackSide, depthWrite: false })
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
  const railZones = [];
  const platformZones = [];

  function addRamp(x, z, rot, width, depth, height) {
    const mesh = new THREE.Mesh(makeRampGeometry(width, depth, height), shared.ramp);
    mesh.position.set(x, 0.02, z);
    mesh.rotation.y = rot;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    park.add(mesh);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.08, 0.42), shared.rampSide);
    stripe.position.set(x, height + 0.06, z + Math.cos(rot) * (depth * 0.43));
    stripe.rotation.y = rot;
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
    const pipe = new THREE.Mesh(makeQuarterPipeGeometry(width, radius), shared.ramp);
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
    rampZones.push({ x, z, rot, width, depth: radius * 1.4, height: radius, cooldown: 0 });
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
    const deck = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), shared.ramp);
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
    // park without blocking the phoneme line or inviting six-button play.
    addRamp(-34, -30, Math.PI * 0.08, 15, 18, 3.2);
    addRamp(35, -64, -Math.PI * 0.12, 15, 18, 3.2);
    addSkillSign(-31, 28, Math.PI * 0.04, "LISTEN");
    addSkillSign(31, -8, -Math.PI * 0.04, "BUILD");
  } else {
    addRamp(-42, -34, Math.PI * 0.16, 18, 21, 4.8);
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

  function addDecor() {
    const rand = seeded(difficulty === "hard" ? 90 : difficulty === "medium" ? 45 : 18);
    const decoMat = makeMat(difficulty === "hard" ? "#1a265c" : difficulty === "medium" ? "#6b3d28" : "#77b95d");
    for (let i = 0; i < 26; i += 1) {
      const angle = (i / 26) * Math.PI * 2;
      const radius = 94 + rand() * 22;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      if (difficulty === "medium" && i % 4 === 0) {
        const volcano = new THREE.Mesh(new THREE.ConeGeometry(8 + rand() * 7, 22 + rand() * 16, 6), decoMat);
        volcano.position.set(x, 10, z);
        volcano.castShadow = true;
        park.add(volcano);
        const glow = new THREE.Mesh(new THREE.ConeGeometry(3.2, 7, 6), makeMat("#ff5f38", { emissive: "#ff5f38", emissiveIntensity: 0.45 }));
        glow.position.set(x, 25, z);
        park.add(glow);
      } else if (difficulty === "hard") {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(5 + rand() * 8, 22 + rand() * 34, 5 + rand() * 7), decoMat);
        tower.position.set(x, tower.geometry.parameters.height / 2, z);
        tower.castShadow = true;
        park.add(tower);
      } else {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 7, 7), makeMat("#6a3f24"));
        trunk.position.set(x, 3.5, z);
        const crown = new THREE.Mesh(new THREE.ConeGeometry(4.6 + rand() * 2, 11 + rand() * 4, 7), decoMat);
        crown.position.set(x, 12, z);
        trunk.castShadow = true;
        crown.castShadow = true;
        park.add(trunk, crown);
      }
    }
  }
  addDecor();

  const skater = makeSkater(theme);
  if (difficulty === "easy") skater.scale.setScalar(1.25);
  scene.add(skater);

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:5;font-family:var(--kid-font-display,Fredoka,Arial,sans-serif);color:#fff";
  overlay.innerHTML =
    '<div data-gg-panel="left" style="position:absolute;top:14px;left:16px;min-width:220px;background:linear-gradient(135deg,rgba(6,10,28,.9),rgba(20,32,70,.72));border:1px solid rgba(125,242,255,.32);padding:12px 16px;clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);box-shadow:0 12px 34px rgba(0,0,0,.32)">' +
      '<div data-gg="level" style="font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:#9bf4ff;font-weight:900">Level 1</div>' +
      '<div data-gg="score" style="font-size:1.42rem;font-weight:950;line-height:1.08">0 pts</div>' +
      '<div data-gg="combo" style="font-size:.82rem;color:#ffe17a;font-weight:900">Combo x1</div>' +
    '</div>' +
    '<div data-gg-panel="center" style="position:absolute;top:14px;left:50%;transform:translateX(-50%);width:min(680px,calc(100vw - 360px));min-width:330px;text-align:center;background:linear-gradient(135deg,rgba(6,10,28,.94),rgba(20,32,70,.78));border:1px solid rgba(255,255,255,.18);padding:12px 18px 14px;clip-path:polygon(18px 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,18px 100%,0 50%);box-shadow:0 12px 34px rgba(0,0,0,.34)">' +
      '<div data-gg="prompt" style="font-size:clamp(1rem,2.4vw,1.72rem);font-weight:950;line-height:1.05"></div>' +
      '<div data-gg="sentence" style="margin-top:5px;font-size:clamp(.84rem,1.5vw,1.08rem);font-weight:850;color:#eaf8ff"></div>' +
      '<div data-gg="cue" style="margin-top:4px;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:#9bf4ff;font-weight:900"></div>' +
      '<div data-gg="coach" style="margin:7px auto 0;max-width:560px;font-size:.82rem;line-height:1.15;color:#ffe7a3;font-weight:850"></div>' +
      '<button data-gg="hear" type="button" aria-label="Hear the word" style="margin-top:7px;padding:4px 14px;border:1px solid rgba(125,242,255,.5);background:rgba(6,10,28,.72);color:#9bf4ff;font-weight:900;border-radius:8px;font-size:.72rem;letter-spacing:.12em;pointer-events:auto;cursor:pointer">HEAR WORD</button>' +
    '</div>' +
    '<div data-gg-panel="right" style="position:absolute;top:14px;right:16px;text-align:right;background:linear-gradient(135deg,rgba(6,10,28,.9),rgba(20,32,70,.72));border:1px solid rgba(125,242,255,.32);padding:12px 16px;clip-path:polygon(0 0,calc(100% - 12px) 0,100% 100%,12px 100%);box-shadow:0 12px 34px rgba(0,0,0,.32)">' +
      '<div data-gg="world" style="font-size:.78rem;letter-spacing:.13em;text-transform:uppercase;color:#9bf4ff;font-weight:900"></div>' +
      '<div data-gg="speed" style="font-size:1.22rem;font-weight:950">0 kmh</div>' +
      '<div data-gg="trick" style="font-size:.82rem;color:#ffe17a;font-weight:900">Find the next sound</div>' +
      '<div style="margin-top:7px;width:142px;height:8px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.2);margin-left:auto;overflow:hidden"><div data-gg="boostbar" style="height:100%;width:42%;background:linear-gradient(90deg,#7df2ff,#ffe17a)"></div></div>' +
      '<div data-gg="style" style="margin-top:4px;font-size:.72rem;color:#d9f2ff;font-weight:900;text-transform:uppercase;letter-spacing:.08em">Style ready</div>' +
    '</div>' +
    '<div data-gg="banner" style="position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);text-align:center;font-size:clamp(2.2rem,8vw,6.8rem);font-weight:950;text-shadow:0 10px 30px rgba(0,0,0,.62),0 0 18px rgba(125,242,255,.4);display:none"></div>' +
    '<div data-gg-controls="left" style="position:absolute;bottom:18px;left:18px;display:flex;gap:10px;pointer-events:auto">' +
      '<button data-gg-btn="left" aria-label="Turn left" style="width:74px;height:64px;border:1px solid rgba(125,242,255,.42);background:rgba(6,10,28,.76);color:#fff;font-size:1.6rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">←</button>' +
      '<button data-gg-btn="right" aria-label="Turn right" style="width:74px;height:64px;border:1px solid rgba(125,242,255,.42);background:rgba(6,10,28,.76);color:#fff;font-size:1.6rem;font-weight:950;border-radius:18px;box-shadow:0 10px 24px rgba(0,0,0,.3)">→</button>' +
    '</div>' +
    '<div data-gg-controls="right" style="position:absolute;bottom:18px;right:18px;display:flex;gap:10px;pointer-events:auto">' +
      '<button data-gg-btn="brake" aria-label="Brake" style="width:72px;height:58px;border:1px solid rgba(255,255,255,.3);background:rgba(6,10,28,.64);color:#fff;font-weight:950;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.3)">BRAKE</button>' +
      '<button data-gg-btn="boost" aria-label="Boost" style="width:78px;height:58px;border:1px solid rgba(125,242,255,.52);background:linear-gradient(160deg,#131b3d,#33e6ff);color:#fff;font-weight:950;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.3)">BOOST</button>' +
      '<button data-gg-btn="push" aria-label="Push" style="width:72px;height:58px;border:1px solid rgba(255,255,255,.3);background:linear-gradient(160deg,#7df2ff,#38bdf8);color:#07101d;font-weight:950;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.3)">PUSH</button>' +
      '<button data-gg-btn="jump" aria-label="Jump trick" style="width:86px;height:68px;border:1px solid rgba(255,255,255,.58);background:linear-gradient(160deg,#fff0a8,#ffc83d 55%,#f59e0b);color:#201400;font-weight:950;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.3),inset 0 -8px 0 rgba(0,0,0,.2)">TRICK</button>' +
    '</div>' +
    (difficulty === "easy"
      ? '<div data-gg-guide style="position:absolute;right:18px;bottom:12px;width:min(190px,23vw);display:grid;justify-items:center;filter:drop-shadow(0 12px 18px rgba(29,73,57,.28))">' +
          '<img src="/images/pals/meadow-point.webp" alt="" style="display:block;width:100%;max-height:150px;object-fit:contain;object-position:center bottom">' +
          '<div style="margin-top:-13px;padding:6px 12px;border-radius:999px;background:rgba(255,250,226,.94);border:2px solid rgba(66,153,119,.45);color:#214d3e;font-size:.76rem;font-weight:950;box-shadow:0 7px 18px rgba(29,73,57,.16)">Follow the glowing sound</div>' +
        '</div>'
      : '');
  const advancedControls = overlay.querySelector('[data-gg-controls="right"]');
  if (advancedControls && difficulty === "easy") advancedControls.style.display = "none";
  const rightPanel = overlay.querySelector('[data-gg-panel="right"]');
  if (rightPanel && difficulty === "easy") rightPanel.style.display = "none";
  const easySteering = overlay.querySelector('[data-gg-controls="left"]');
  if (easySteering && difficulty === "easy") {
    easySteering.style.left = "50%";
    easySteering.style.transform = "translateX(-50%)";
  }
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
        font-size: .98rem !important;
        line-height: 1.05 !important;
      }
      [data-gg="sentence"] {
        font-size: .8rem !important;
        margin-top: 3px !important;
      }
      [data-gg="cue"] {
        font-size: .64rem !important;
        margin-top: 3px !important;
      }
      [data-gg="coach"] {
        max-width: 100% !important;
        font-size: .68rem !important;
        line-height: 1.1 !important;
        margin-top: 5px !important;
      }
      [data-gg-controls="left"] {
        bottom: 86px !important;
        left: 10px !important;
        gap: 7px !important;
      }
      [data-gg-controls="right"] {
        left: 10px !important;
        right: 10px !important;
        bottom: 10px !important;
        gap: 7px !important;
        justify-content: space-between !important;
      }
      [data-gg-btn] {
        height: 54px !important;
        border-radius: 7px !important;
        font-size: .74rem !important;
      }
      [data-gg-btn="left"],
      [data-gg-btn="right"] {
        width: 64px !important;
      }
      [data-gg-btn="brake"],
      [data-gg-btn="boost"],
      [data-gg-btn="push"],
      [data-gg-btn="jump"] {
        width: auto !important;
        flex: 1 1 0 !important;
        min-width: 0 !important;
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
  let boost = 42;
  let boostFlash = 0;
  let styleWindow = 0;
  let styleScore = 0;
  let lineStep = 0;
  let lineReady = false;
  let lineReadyDelay = 0;
  let easyLaneTarget = 0;
  let easyLaneChosen = false;
  let trailTimer = 0;
  let phase = "countdown";
  let phaseTimer = 4.2;
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
    rampLock: 0
  };
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
      lineRoot.remove(node.group);
      disposeObject(node.group);
    }
  }

  function createLineNode(label, index, position, coach) {
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
    const texture = makeTextTexture(label, theme, {
      width: 384,
      height: 128,
      size: 52,
      border: theme.token || theme.accent,
      bg: "rgba(4,8,22,.82)"
    });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 1.35),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    sign.position.y = 3.8;
    sign.userData.billboard = true;
    group.add(sign);
    lineRoot.add(group);
    lineNodes.push({ group, ring, ringMat, arrow, sign, index, label, coach, radius: 4.2, used: false });
  }

  function placeLineNodes() {
    clearLineNodes();
    lineStep = 0;
    lineReady = false;
    lineReadyDelay = 0;
    easyLaneTarget = 0;
    easyLaneChosen = false;
    const count = Math.max(1, level.segments.length);
    level.segments.forEach((segment, index) => {
      const easyPosition = {
        // The beginner run teaches order and blending. Every sound sits on the
        // main path, so success does not depend on fine motor steering.
        x: 0,
        z: 7 - index * 24
      };
      const offset = levelIndex * 0.47 + (difficulty === "hard" ? 0.8 : difficulty === "medium" ? 0.35 : 0);
      const angle = offset + 0.9 + (index / count) * Math.PI * 1.72;
      const radius = 31 + (index % 2) * 10;
      createLineNode(
        segment,
        index,
        difficulty === "easy"
          ? easyPosition
          : { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius },
        index === count - 1
          ? `${segment} completes ${level.audioWord}. Now choose the built word.`
          : `Good. Now collect ${level.segments[index + 1]}.`
      );
    });
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

    const labelTexture = makeTextTexture(choice, theme, {
      fg: "#ffffff",
      border: gateColor,
      bg: "rgba(4,8,22,.94)",
      size: choice.length > 10 ? 64 : (easyGate ? 92 : 108)
    });
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(easyGate ? 9.1 : 11.1, easyGate ? 3.35 : 3.9),
      new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    label.position.set(0, 5.65, 0.34);
    label.renderOrder = 3;
    label.userData.billboard = true;
    group.add(label);

    const ringRadius = easyGate ? 3.9 : 4.6;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, 0.08, 8, 36), gateMat);
    ring.position.set(0, 4.5, -0.03);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), gateMat);
    marker.position.set(0, 10.55, 0);
    group.add(marker);

    group.userData = { choice, index, correct: isCorrect, cooldown: 0, label, marker, beam };
    gatesRoot.add(group);
    gates.push({ group, choice, correct: isCorrect, pos: group.position, radius: easyGate ? 4.2 : 4.8, cooldown: 0 });
  }

  function placeGates() {
    clearGates();
    const rand = seeded(levelIndex * 401 + (difficulty === "hard" ? 900 : difficulty === "medium" ? 500 : 100));
    const baseAngles = [Math.PI * 0.12, Math.PI * 0.78, Math.PI * 1.43];
    const options = [...level.options];
    for (let i = 0; i < options.length; i += 1) {
      const swap = i + Math.floor(rand() * (options.length - i));
      [options[i], options[swap]] = [options[swap], options[i]];
    }
    if (difficulty === "easy" && options.length === 3) {
      const sideIndex = levelIndex % 2 === 0 ? 0 : 2;
      const correctIndex = options.indexOf(level.correct);
      [options[correctIndex], options[sideIndex]] = [options[sideIndex], options[correctIndex]];
    }
    options.forEach((choice, index) => {
      if (difficulty === "easy") {
        const lane = index - (options.length - 1) / 2;
        createGate(choice, index, { x: lane * 14, z: -66 }, level.correct);
        return;
      }
      const angle = baseAngles[index % baseAngles.length] + rand() * 0.36 - 0.18 + levelIndex * 0.17;
      const radius = 43 + rand() * 22;
      createGate(choice, index, { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius }, level.correct);
    });
  }

  function updateHud() {
    const canHearLevel = getSound() && levelSpeechParts().some(part => hasRecordedSpeech(part));
    el.hear.style.display = canHearLevel ? "" : "none";
    el.hear.disabled = !canHearLevel;
    el.level.textContent = `Level ${levelIndex + 1}/${ladder.length}`;
    el.score.textContent = `${Math.max(0, Math.round(score))} pts`;
    el.combo.textContent = `Combo x${combo}`;
    el.prompt.textContent = level.prompt;
    el.sentence.textContent = difficulty === "easy"
      ? level.segments.map((segment, index) => (index < lineStep ? segment : "_")).join("  ")
      : level.sentence;
    el.cue.textContent = level.focus || level.cue;
    el.coach.textContent = coachText || level.teaching || level.cue;
    el.world.textContent = theme.name;
    el.speed.textContent = `${Math.round(Math.abs(player.speed) * 3.2)} kmh`;
    el.trick.textContent = player.grind > 0 ? "Grinding rail" : player.air > 0.2 ? "Air trick" : message || (lineReady ? "Choose the built word" : "Find the next sound");
    el.boostbar.style.width = `${Math.round(clamp(boost, 0, BOOST_MAX))}%`;
    el.boostbar.style.filter = boostFlash > 0 ? "brightness(1.75)" : "";
    el.style.textContent = lineReady
      ? `${level.audioWord} is ready`
      : lineStep < level.segments.length
        ? `Sound ${lineStep + 1} of ${level.segments.length}`
        : styleWindow > 0
          ? `Style bank ${Math.round(styleScore)}`
          : "Collect sounds and skate";
    if (phase === "countdown") {
      el.banner.style.display = "block";
      el.banner.textContent = phaseTimer > 2.35 ? "LISTEN" : phaseTimer > 1.55 ? "3" : phaseTimer > 0.8 ? "2" : phaseTimer > 0.2 ? "1" : "GO";
    } else if (messageTimer > 0) {
      el.banner.style.display = "block";
      el.banner.textContent = message;
      el.banner.style.fontSize = "clamp(1.7rem,4.4vw,3.8rem)";
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

  function loadLevel(index, introMessage = "Collect the sounds", introCoach = null) {
    levelIndex = clamp(index, 0, ladder.length - 1);
    level = ladder[levelIndex];
    levelMisses = 0;
    placeGates();
    placePickups();
    placeLineNodes();
    if (difficulty === "easy") {
      // Each spelling word starts from the same calm, centred runway. Carrying
      // the previous answer lane into the next word left the skater travelling
      // parallel to the sound path and could make level two impossible.
      player.pos.set(0, 0, 24);
      player.yaw = Math.PI;
      player.speed = 0;
      player.vy = 0;
      player.air = 0;
      player.onGround = true;
      easyLaneTarget = 0;
      easyLaneChosen = false;
    }
    message = introMessage;
    coachText = introCoach || level.teaching || level.cue;
    messageTimer = 1.25;
    gateCooldown = 0.6;
    opts.onProgressUpdate?.(levelIndex, ladder.length);
    opts.onCheckpoint?.(levelIndex, ladder.length);
    updateHud();
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
    opts.onScoreUpdate?.(score);
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
      correct += 1;
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
      mistakes += 1;
      levelMisses += 1;
      combo = 1;
      spawnBurst(gate.pos, theme.wrong, 12);
      sfx(playSoftBuzz);
      message = "Try that word again";
      coachText = grammarGrindChoiceFeedback(gate.choice, level, { reveal: levelMisses >= 2 });
      messageTimer = 1.6;
      gateCooldown = 0.8;
      if (difficulty === "easy") {
        player.pos.set(0, 0, -38);
        player.yaw = Math.PI;
        player.speed = 0;
        easyLaneTarget = 0;
        easyLaneChosen = false;
      }
    }
  }

  function handleJump() {
    if (!keys.jumpPressed) return;
    keys.jumpPressed = false;
    if (!player.onGround || player.stun > 0) return;
    player.vy = 11 + Math.min(4, Math.abs(player.speed) * 0.14);
    player.onGround = false;
    player.air = 0.02;
    player.airTime = 0;
    player.trick = 0.8;
    sfx(playWhoosh);
  }

  function updateRamps(dt) {
    player.rampLock = Math.max(0, player.rampLock - dt);
    rampZones.forEach(zone => {
      zone.cooldown = Math.max(0, zone.cooldown - dt);
      const p = localPoint(player.pos.x, player.pos.z, zone);
      if (
        Math.abs(p.x) < zone.width / 2 &&
        Math.abs(p.z) < zone.depth / 2 &&
        player.onGround &&
        zone.cooldown <= 0 &&
        player.rampLock <= 0 &&
        Math.abs(player.speed) > 8
      ) {
        const forward = Math.cos(wrapAngle(player.yaw - zone.rot));
        if (forward > 0.25 || p.z > zone.depth * 0.2) {
          player.vy = 10.5 + zone.height * 0.55 + Math.min(5, Math.abs(player.speed) * 0.1);
          player.onGround = false;
          player.air = 0.02;
          player.airTime = 0;
          player.trick = 1;
          player.rampLock = 1.2;
          zone.cooldown = 1.4;
          combo = clamp(combo + 1, 1, 9);
          awardStyle(28, "Air +28");
          sfx(playWhoosh);
        }
      }
    });
  }

  function updateRails(dt) {
    player.railLock = Math.max(0, player.railLock - dt);
    if (player.grind > 0 && player.grindRail) {
      const rail = player.grindRail;
      player.grind -= dt;
      player.grindT = clamp(player.grindT + (dt * Math.max(0.12, Math.abs(player.speed))) / rail.length, 0, 1);
      const x = rail.ax + (rail.bx - rail.ax) * player.grindT;
      const z = rail.az + (rail.bz - rail.az) * player.grindT;
      player.pos.set(x, 1.04, z);
      player.air = 1.04;
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
    const turn = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
    // Level 1 is a spelling game, not a six-button skate simulator. The skater
    // rolls at a calm automatic pace; the child only steers toward c → a → t.
    const push = difficulty === "easy"
      && phase === "playing"
      && (!lineReady || (lineReadyDelay <= 0 && easyLaneChosen))
      ? 1
      : (keys.push ? 1 : 0);
    const brake = keys.brake ? 1 : 0;
    const boostActive = keys.boost && boost > 1 && phase === "playing" && player.stun <= 0 && player.grind <= 0;
    player.stun = Math.max(0, player.stun - dt);
    if (phase === "playing" && player.stun <= 0 && player.grind <= 0) {
      const speedFactor = clamp(Math.abs(player.speed) / MAX_SPEED[difficulty], 0.22, 1);
      const drift = brake > 0 && Math.abs(player.speed) > 8 ? 1.4 : 1;
      player.yaw += turn * dt * (1.65 + speedFactor * 1.1) * drift * (player.speed >= 0 ? 1 : -1);
      player.speed += push * dt * 24;
      if (boostActive) {
        player.speed += dt * (player.speed >= 0 ? 32 : 18);
        boost = clamp(boost - dt * 34, 0, BOOST_MAX);
        boostFlash = 0.16;
      } else if (Math.abs(player.speed) > 6 && player.onGround) {
        boost = clamp(boost + dt * 2.5, 0, BOOST_MAX);
      }
      player.speed -= brake * dt * 28;
    }
    boostFlash = Math.max(0, boostFlash - dt);
    styleWindow = Math.max(0, styleWindow - dt);
    if (styleWindow <= 0) styleScore = Math.max(0, styleScore - dt * 24);
    player.speed *= player.onGround ? Math.pow(0.945, dt * 8) : Math.pow(0.984, dt * 8);
    const topSpeed = MAX_SPEED[difficulty] + (boostActive ? 8 : 0);
    player.speed = clamp(player.speed, -MAX_SPEED[difficulty] * 0.45, topSpeed);
    handleJump();

    if (player.grind <= 0) {
      const dir = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw));
      player.pos.addScaledVector(dir, player.speed * dt);
    }
    if (difficulty === "easy" && lineReady) {
      // Word-choice arrows select a clear lane instead of demanding precise
      // free-angle steering at the final three gates.
      player.yaw = Math.PI;
      player.pos.x += (easyLaneTarget - player.pos.x) * clamp(dt * 6, 0, 1);
    }

    let surfaceHeight = 0;
    for (const platform of platformZones) {
      const p = localPoint(player.pos.x, player.pos.z, platform);
      if (Math.abs(p.x) < platform.width / 2 && Math.abs(p.z) < platform.depth / 2) {
        surfaceHeight = Math.max(surfaceHeight, platform.height);
      }
    }

    if (!player.onGround && player.grind <= 0) {
      player.vy -= 24 * dt;
      player.air += player.vy * dt;
      player.airTime += dt;
      if (player.air <= surfaceHeight) {
        player.air = surfaceHeight;
        player.vy = 0;
        player.onGround = true;
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
      if (difficulty === "easy" && player.pos.z < 0) {
        player.pos.set(0, 0, lineReady ? -38 : 24);
        player.yaw = Math.PI;
        player.speed = 0;
        easyLaneTarget = 0;
        easyLaneChosen = false;
        message = lineReady ? "Choose the word you built" : "Try the glowing sound";
        coachText = lineReady
          ? `${level.segments.join(" + ")} spells ${level.audioWord}. Choose ${level.audioWord}.`
          : `Listen again, then follow sound ${lineStep + 1}.`;
        messageTimer = 1.4;
        speakLevelAloud();
        return;
      }
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
      if (Math.hypot(dx, dz) < gate.radius && player.air < 4.8) handleGate(gate);
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
    lineNodes.forEach(node => {
      const active = node.index === lineStep && !lineReady;
      const complete = node.index < lineStep || lineReady;
      node.group.visible = !complete || lineReady;
      node.ringMat.opacity = active ? 0.72 + Math.sin(time * 5) * 0.16 : lineReady ? 0.22 : 0.28;
      node.group.scale.setScalar(active ? 1 + Math.sin(time * 4.4) * 0.08 : 0.86);
      node.sign.visible = active;
      node.arrow.visible = active;
      node.arrow.rotation.y += dt * (active ? 3.4 : 1.1);
      node.arrow.position.y = 2.25 + Math.sin(time * 3 + node.index) * 0.35;
      if (node.sign.userData.billboard) node.sign.lookAt(camera.position);
      if (!active) return;
      if (difficulty === "easy" && player.pos.z < node.group.position.z - 7) {
        // Missing a phoneme should produce another supported attempt, never a
        // long empty skate to the arena wall.
        node.group.position.set(player.pos.x, 0.18, player.pos.z - 16);
        message = `Try ${node.label} again`;
        coachText = `Listen for ${node.label}. Follow the glowing ring.`;
        messageTimer = 1.1;
      }
      const dx = node.group.position.x - player.pos.x;
      const dz = node.group.position.z - player.pos.z;
      if (Math.hypot(dx, dz) < node.radius && player.air < 4.8) {
        node.used = true;
        lineStep += 1;
        coachText = node.coach;
        awardStyle(18 + node.index * 8, `${node.label} line`);
        spawnBurst(node.group.position, theme.token || theme.accent, 12);
        sfx(playPopSound);
        if (lineStep >= lineNodes.length) {
          lineReady = true;
          if (difficulty === "easy") {
            player.speed = 0;
            easyLaneTarget = 0;
            easyLaneChosen = false;
            lineReadyDelay = 2.6;
          }
          coachText = `${level.segments.join(" + ")} spells ${level.audioWord}. Tap left or right to choose ${level.audioWord}.`;
          message = "Word ready";
          messageTimer = 1;
          sfx(playStarChime);
        }
      }
    });
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

  function updateSkater(time) {
    skater.position.set(player.pos.x, 0.25 + player.air, player.pos.z);
    skater.rotation.y = player.yaw;
    const lean = clamp(player.speed / MAX_SPEED[difficulty], -0.5, 0.9);
    skater.rotation.z = ((keys.left ? 0.12 : 0) - (keys.right ? 0.12 : 0)) - lean * 0.08;
    skater.rotation.x = player.air > 0 ? Math.sin(time * 9) * 0.08 : 0;
    const model = skater.userData;
    if (model.board) model.board.rotation.z = Math.sin(time * 13) * (player.grind > 0 ? 0.18 : 0.04);
    if (model.body) model.body.rotation.x = player.trick > 0 ? Math.sin(time * 11) * 0.22 : -lean * 0.18;
    if (model.armL) model.armL.rotation.z = -0.62 + Math.sin(time * 8) * 0.18 + (player.air > 0 ? -0.35 : 0);
    if (model.armR) model.armR.rotation.z = 0.62 - Math.sin(time * 8) * 0.18 + (player.air > 0 ? 0.35 : 0);
    if (model.legL) model.legL.rotation.x = 0.75 + Math.sin(time * 10) * (keys.push ? 0.2 : 0.05);
    if (model.legR) model.legR.rotation.x = -0.58 - Math.sin(time * 10) * (keys.push ? 0.2 : 0.05);
  }

  function updateCamera(dt) {
    const followDistance = difficulty === "easy" ? 11.5 : 17;
    const followHeight = difficulty === "easy" ? 6.8 : 8.6;
    const sideOffset = difficulty === "easy" ? 1.7 : 3.2;
    const behind = new THREE.Vector3(
      -Math.sin(player.yaw) * followDistance,
      followHeight + player.air * 0.22,
      -Math.cos(player.yaw) * followDistance
    );
    const side = new THREE.Vector3(Math.cos(player.yaw) * sideOffset, 0, -Math.sin(player.yaw) * sideOffset);
    const targetPos = player.pos.clone().add(behind).add(side);
    camera.position.lerp(targetPos, clamp(dt * 4.4, 0, 1));
    const look = player.pos.clone();
    look.y = 2.4 + player.air * 0.28;
    camera.lookAt(look);
  }

  function update(dt, time) {
    if (paused || completed) return;
    if (phase === "countdown") {
      phaseTimer -= dt;
      if (phaseTimer <= 0) {
        phase = "playing";
        message = "Find the first sound";
        messageTimer = 1.2;
      }
    }
    lineReadyDelay = Math.max(0, lineReadyDelay - dt);
    messageTimer = Math.max(0, messageTimer - dt);
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboTimer <= 0 && combo > 1 && player.grind <= 0) combo = 1;
    updatePlayer(dt);
    updateGates(dt);
    updatePickups(dt, time);
    updateLineNodes(dt, time);
    updateTrails(dt, time);
    updateParticles(dt);
    updateSkater(time);
    updateCamera(dt);
    flushScore();
    updateHud();
  }

  function render(now) {
    const time = now * 0.001;
    const dt = Math.min(0.04, (now - lastTime || 16) / 1000);
    lastTime = now;
    update(dt, time);
    renderer.render(scene, camera);
  }
  const loop = createFrameLoop(render);

  function setKey(key, value) {
    if (key === "jump" && value && !keys.jump) keys.jumpPressed = true;
    keys[key] = value;
  }

  function onKeyDown(event) {
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
    event.preventDefault();
  }

  function bindButton(name, key) {
    const button = overlay.querySelector(`[data-gg-btn="${name}"]`);
    if (!button) return;
    const down = event => {
      event.preventDefault();
      button.style.transform = "translateY(2px) scale(.98)";
      // Beginner controls must work as taps as well as holds. Young children
      // often release before the next animation frame, which previously made
      // the arrow look pressed without steering the skater at all.
      if (difficulty === "easy" && (key === "left" || key === "right")) {
        if (lineReady) {
          easyLaneTarget = clamp(easyLaneTarget + (key === "left" ? -14 : 14), -14, 14);
          easyLaneChosen = true;
        } else {
          player.yaw += key === "left" ? 0.2 : -0.2;
        }
      }
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
    button.addEventListener("pointerleave", up);
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

  // First-run onboarding: one spelling goal + the skate controls, shown once
  // per device. update() returns immediately while paused is set, so the
  // countdown, skater and particles all freeze behind the overlay, and a
  // GamePlayer chrome resume is ignored until the child dismisses — the two
  // pauses can't fight. (paused is set directly here, not via api.pause(), so
  // the level intro speech keeps playing while the child reads.)
  let introActive = false;
  let introEl = null;
  function dismissIntro() {
    if (!introActive) return;
    introActive = false;
    markOnboardingSeen("grammar-grind");
    if (introEl) introEl.remove();
    introEl = null;
    window.removeEventListener("keydown", onIntroKey, true);
    paused = false;
  }
  function onIntroKey(event) {
    event.preventDefault();
    dismissIntro();
  }
  if (!hasSeenOnboarding("grammar-grind")) {
    introActive = true;
    paused = true;
    introEl = document.createElement("div");
    introEl.style.cssText = "position:absolute;inset:0;display:grid;place-items:center;text-align:center;background:rgba(4,8,22,.9);pointer-events:auto;cursor:pointer";
    introEl.innerHTML = difficulty === "easy"
      ? '<div style="display:grid;gap:14px;justify-items:center;max-width:min(520px,88vw);padding:20px">' +
          '<div style="font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;color:#9bf4ff;font-weight:900">Spell & Skate</div>' +
          '<div style="font-size:clamp(1.55rem,4.2vw,2.2rem);font-weight:950;line-height:1.12;text-wrap:balance">Build the word in order</div>' +
          '<div aria-hidden="true" style="display:flex;align-items:center;gap:12px;font-size:2rem"><svg viewBox="0 0 24 24" width="34" height="34"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Zm11.5-.7v7.4a4.5 4.5 0 0 0 0-7.4Zm0-3.3v2.1a7 7 0 0 1 0 9.8V19a9 9 0 0 0 0-14Z"/></svg><span>c</span><span>→</span><span>a</span><span>→</span><span>t</span></div>' +
          '<div style="font-size:1rem;font-weight:800;line-height:1.45;opacity:.94">The skater moves for you. Use only ← and →.</div>' +
          '<div style="display:flex;gap:12px"><span style="display:grid;place-items:center;width:74px;height:58px;border-radius:16px;background:rgba(125,242,255,.18);font-size:1.7rem">←</span><span style="display:grid;place-items:center;width:74px;height:58px;border-radius:16px;background:rgba(125,242,255,.18);font-size:1.7rem">→</span></div>' +
          '<div style="padding:12px 30px;border:1px solid rgba(255,255,255,.58);background:linear-gradient(160deg,#fff0a8,#ffc83d 55%,#f59e0b);color:#201400;font-weight:950;border-radius:16px;box-shadow:0 10px 24px rgba(0,0,0,.3),inset 0 -7px 0 rgba(0,0,0,.16)">Play</div>' +
        '</div>'
      : '<div style="display:grid;gap:12px;justify-items:center;max-width:min(600px,88vw);padding:20px">' +
          '<div style="font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;color:#9bf4ff;font-weight:900">Spell & Skate</div>' +
          '<div style="font-size:clamp(1.25rem,3.6vw,1.8rem);font-weight:950;line-height:1.25;text-wrap:balance">Listen to the word. Collect its sounds in order, then skate through the word you built.</div>' +
          '<div style="font-size:.95rem;font-weight:800;line-height:1.6;opacity:.92">Steer with ← →, push with ↑, brake with ↓.<br>Press Space to jump. Hold Shift to boost.</div>' +
          '<div style="padding:12px 28px;border:1px solid rgba(255,255,255,.58);background:linear-gradient(160deg,#fff0a8,#ffc83d 55%,#f59e0b);color:#201400;font-weight:950;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,.3),inset 0 -8px 0 rgba(0,0,0,.2)">Play</div>' +
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
      paused = true;
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
      window.removeEventListener("keydown", onIntroKey, true);
      motionQuery?.removeEventListener?.("change", syncMotionPreference);
      detachResize();
      clearGates();
      clearPickups();
      clearLineNodes();
      disposeObject(root);
      disposeObject(skater);
      particlesRoot.children.slice().forEach(child => {
        particlesRoot.remove(child);
        disposeObject(child);
      });
      trailsRoot.children.slice().forEach(child => {
        trailsRoot.remove(child);
        disposeObject(child);
      });
      disposeRenderer(renderer);
      overlay.remove();
    }
  };
  const detachContextGuard = attachContextLossGuard(renderer, { onLost: () => api.pause(), onRestored: () => api.resume() });
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
