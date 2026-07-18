import { useEffect, useRef, useState } from "react";
import {
  playCorrectChime,
  playSoftBuzz,
  playCelebrationFanfare,
  playTapSound,
  playWhoosh,
  playStarChime
} from "../../../../utils/audio/gameSfx";
import { soundRacerLadder, buildTrack, worldObstacles } from "../../../../utils/soundRacerTracks.js";
import { worldForGameDifficulty, LEVELS_PER_DIFFICULTY } from "../../../../utils/curriculumLadder.js";
import { starRubric } from "../../../../utils/starRubric.js";
import { speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { onsetGrapheme } from "../../../elQuest/elQuestEngine.js";

const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const LANES = [-3.15, 0, 3.15];
const LANE_NAMES = ["left", "middle", "right"];
const TRACK_UNIT = 3.05;
const TRACK_WIDTH = 9.6;
const TRACK_SEGMENT_LENGTH = 8;
const TRACK_SEGMENTS = 28;
const VIEW_DISTANCE = 34;
const CATCH_Z = 2.4;
const CATCH_WINDOW = 0.58;
const SCENERY_WRAP_Z = -235;
const SCENERY_RESET_Z = 18;

const WORLD_MAPS = {
  meadow: [
    {
      name: "Glass meadow circuit",
      sky: 0x78b7d8,
      fog: 0x7db1c8,
      ambient: 0xbde9d1,
      sun: 0xffd781,
      ground: 0x356b45,
      terrain: 0x75a94d,
      trackA: 0x27303a,
      trackB: 0x35424c,
      rail: 0x7be7b1,
      gate: 0x7cf0b6,
      wrong: 0xd6d4bc,
      hazard: 0xc7a15f,
      vehicle: 0xf3f8ff,
      trim: 0x57dfa0,
      boost: 0xc7ffe5
    },
    {
      name: "Canal rushway",
      sky: 0x8dc7ed,
      fog: 0x8dbdd0,
      ambient: 0xd4f2ff,
      sun: 0xffec9c,
      ground: 0x2e6e72,
      terrain: 0x4aa39a,
      trackA: 0x203845,
      trackB: 0x2d505a,
      rail: 0x88f4ff,
      gate: 0x8df7ff,
      wrong: 0xdad8c6,
      hazard: 0xb88d50,
      vehicle: 0xf5fbff,
      trim: 0x3fd6ff,
      boost: 0xd7fbff
    },
    {
      name: "Orchard switchback",
      sky: 0xd3a875,
      fog: 0xb18b61,
      ambient: 0xffd6a8,
      sun: 0xffc46b,
      ground: 0x4d6734,
      terrain: 0xa06d3e,
      trackA: 0x3a342c,
      trackB: 0x514434,
      rail: 0xffcf6c,
      gate: 0xffd66b,
      wrong: 0xd3ceb8,
      hazard: 0xd1a36a,
      vehicle: 0xfffaf0,
      trim: 0xffb24d,
      boost: 0xffefbf
    }
  ],
  dino: [
    {
      name: "Volcano swampway",
      sky: 0xaa7651,
      fog: 0x775642,
      ambient: 0xe5c28a,
      sun: 0xffb45e,
      ground: 0x34422f,
      terrain: 0x6f6d3e,
      trackA: 0x202530,
      trackB: 0x343236,
      rail: 0xffb13d,
      gate: 0xffd34e,
      wrong: 0xd8ccb2,
      hazard: 0x6a5947,
      vehicle: 0x4f8e3d,
      trim: 0xf2b23d,
      boost: 0xffd27a
    },
    {
      name: "Fern fossil run",
      sky: 0x9db76a,
      fog: 0x6f7641,
      ambient: 0xd8df8a,
      sun: 0xffd373,
      ground: 0x4e5c2f,
      terrain: 0x87a044,
      trackA: 0x2f3326,
      trackB: 0x454832,
      rail: 0xc7ef58,
      gate: 0xe5ff7d,
      wrong: 0xcfcab2,
      hazard: 0x807768,
      vehicle: 0x52783d,
      trim: 0xb4d84d,
      boost: 0xf1ffc0
    },
    {
      name: "Lava rib pass",
      sky: 0xb3493d,
      fog: 0x642821,
      ambient: 0xff9870,
      sun: 0xffc05b,
      ground: 0x3c2021,
      terrain: 0x783125,
      trackA: 0x2a2222,
      trackB: 0x49302c,
      rail: 0xff5d3b,
      gate: 0xffb35d,
      wrong: 0xd7c4b4,
      hazard: 0x615b58,
      vehicle: 0x7d4e35,
      trim: 0xff744c,
      boost: 0xffbe80
    }
  ],
  moonwood: [
    {
      name: "Moonwood skyline",
      sky: 0x121a3a,
      fog: 0x101528,
      ambient: 0x8392ff,
      sun: 0xdfe9ff,
      ground: 0x121d36,
      terrain: 0x314166,
      trackA: 0x171c2f,
      trackB: 0x26304e,
      rail: 0x8fa3ff,
      gate: 0x9fe0ff,
      wrong: 0xbec1d0,
      hazard: 0xd7e5ff,
      vehicle: 0xf0f4ff,
      trim: 0x9fe0ff,
      boost: 0xdaf7ff
    },
    {
      name: "Crystal ravine",
      sky: 0x272247,
      fog: 0x171428,
      ambient: 0xc1a5ff,
      sun: 0xf1dbff,
      ground: 0x17192f,
      terrain: 0x664b8b,
      trackA: 0x201b2d,
      trackB: 0x342a45,
      rail: 0xff8ad8,
      gate: 0xffb7eb,
      wrong: 0xc8bdcf,
      hazard: 0xe7ddff,
      vehicle: 0xf4f0ff,
      trim: 0xff8ad8,
      boost: 0xffd7f2
    },
    {
      name: "Eclipse causeway",
      sky: 0x111924,
      fog: 0x0a1118,
      ambient: 0x85d0bb,
      sun: 0x80ffd8,
      ground: 0x102320,
      terrain: 0x286052,
      trackA: 0x121d22,
      trackB: 0x22343a,
      rail: 0x59ffd4,
      gate: 0x8affd9,
      wrong: 0xb6c6c5,
      hazard: 0xdaf8ef,
      vehicle: 0xf2fffb,
      trim: 0x59ffd4,
      boost: 0xcffff0
    }
  ]
};

function loadThree() {
  return new Promise((resolve, reject) => {
    if (window.THREE) {
      resolve(window.THREE);
      return;
    }
    const existing = document.querySelector("script[data-three-cdn]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.THREE));
      existing.addEventListener("error", () => reject(new Error("three-load-failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = THREE_SRC;
    script.async = true;
    script.dataset.threeCdn = "1";
    script.onload = () => resolve(window.THREE);
    script.onerror = () => reject(new Error("three-load-failed"));
    document.head.appendChild(script);
  });
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${min}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function hexParts(hex) {
  return {
    r: (hex >> 16) & 255,
    g: (hex >> 8) & 255,
    b: hex & 255
  };
}

function colorStyle(hex, alpha = 1) {
  const { r, g, b } = hexParts(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixHex(a, b, t) {
  const ca = hexParts(a);
  const cb = hexParts(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const blue = Math.round(ca.b + (cb.b - ca.b) * t);
  return (r << 16) | (g << 8) | blue;
}

function mapForLevel(world, levelIdx) {
  const maps = WORLD_MAPS[world] || WORLD_MAPS.meadow;
  return maps[levelIdx % maps.length];
}

function instructionFor() {
  // Matching is initial-sound only at every difficulty, so the copy must
  // say "start with" everywhere (hard mode used to promise "carrying this
  // sound", which the track builder does not deliver).
  return "Catch words that start with";
}

function countdownPrompt(target) {
  const letter = String(target || "").toUpperCase();
  return `Find Words Beginning With ${letter}`;
}

function disposeObject(obj) {
  if (!obj) return;
  obj.traverse(node => {
    if (node.geometry) node.geometry.dispose();
    const materials = Array.isArray(node.material) ? node.material : (node.material ? [node.material] : []);
    for (const material of materials) {
      if (material.map) material.map.dispose();
      material.dispose();
    }
  });
}

function startGame(THREE, mount, opts) {
  const width = () => mount.clientWidth || 720;
  const height = () => mount.clientHeight || 460;
  const difficulty = String(opts.difficulty || "easy").toLowerCase();
  const world = worldForGameDifficulty(difficulty);
  const ladder = soundRacerLadder(difficulty);
  const levelCount = LEVELS_PER_DIFFICULTY;
  const startLevelIdx = Math.max(0, Math.min(Number(opts.startLevel) || 0, levelCount - 1));
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const sfx = fn => {
    try {
      if (opts.getSound && opts.getSound()) fn();
    } catch {
      /* audio is optional */
    }
  };

  const scene = new THREE.Scene();
  const cameraBaseFov = 64;
  const cameraBaseY = 3.95;
  const cameraBaseZ = 10.45;
  const camera = new THREE.PerspectiveCamera(cameraBaseFov, width() / height(), 0.1, 190);
  camera.position.set(0, cameraBaseY, cameraBaseZ);
  camera.lookAt(0, 1.0, -11.8);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "default" });
  } catch {
    renderer = new THREE.WebGLRenderer({ antialias: false });
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.setSize(width(), height());
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  if (renderer.shadowMap) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
  }
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  mount.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(4, 9, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 34;
  keyLight.shadow.camera.left = -9;
  keyLight.shadow.camera.right = 9;
  keyLight.shadow.camera.top = 9;
  keyLight.shadow.camera.bottom = -9;
  scene.add(keyLight);
  const fillLight = new THREE.HemisphereLight(0xffffff, 0x101020, 0.6);
  scene.add(fillLight);

  const hud = document.createElement("div");
  hud.className = "sound-racer-hud";
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#f8fbff;z-index:4";
  hud.innerHTML =
    '<div data-sr-panel="target" style="position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:12px;background:rgba(7,10,22,.72);border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 24px rgba(0,0,0,.25);padding:8px 14px 8px 8px;clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)">' +
      '<div data-sr="target" style="width:54px;height:54px;display:grid;place-items:center;font-size:1.85rem;font-weight:900;color:#071033;background:#ffd34e;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22)"></div>' +
      '<div><div data-sr="mission" style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;opacity:.76">Catch the sound</div>' +
      '<div data-sr="map" style="font-size:1.02rem;font-weight:800;white-space:nowrap">Track 1</div></div></div>' +
    '<div data-sr-panel="status" style="position:absolute;top:16px;right:16px;text-align:right;background:rgba(7,10,22,.62);border:1px solid rgba(255,255,255,.16);padding:9px 12px;min-width:160px;clip-path:polygon(12px 0,100% 0,100% 100%,0 100%,0 12px)">' +
      '<div data-sr="timer" style="font-size:1.15rem;font-weight:900;font-variant-numeric:tabular-nums">0:00.00</div>' +
      '<div data-sr="words" style="font-size:.98rem;opacity:.9">0 / 0 words</div>' +
      '<div data-sr="shield" style="font-size:1.05rem;letter-spacing:2px;margin-top:2px">◆◆◆</div>' +
      '<div style="height:9px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:7px"><i data-sr="speed" style="display:block;height:100%;width:0%;background:#7cf0b6;transition:width .18s ease"></i></div></div>' +
    '<button data-sr="left" aria-label="Steer left" style="position:absolute;left:0;top:84px;bottom:0;width:42%;background:transparent;border:0;pointer-events:auto"></button>' +
    '<button data-sr="right" aria-label="Steer right" style="position:absolute;right:0;top:84px;bottom:0;width:42%;background:transparent;border:0;pointer-events:auto"></button>' +
    '<div style="position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:12px;pointer-events:none">' +
      '<div style="width:58px;height:50px;display:grid;place-items:center;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(4px);font-size:1.4rem">◀</div>' +
      '<div style="width:58px;height:50px;display:grid;place-items:center;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(4px);font-size:1.4rem">▶</div></div>' +
    '<div data-sr="banner" style="position:absolute;top:34%;left:0;right:0;text-align:center;pointer-events:none;font-style:italic;font-weight:900;font-size:clamp(1.25rem,5vw,2.5rem);letter-spacing:.12em;text-transform:uppercase;color:#f5fbff;text-shadow:0 3px 18px rgba(0,0,0,.7);opacity:0;transition:opacity .25s ease,transform .25s ease;transform:translateX(-36px)"></div>' +
    '<div data-sr="countdown" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;pointer-events:none;background:radial-gradient(120% 90% at 50% 42%,rgba(9,12,30,.62),rgba(5,7,18,.24));z-index:12"></div>' +
    '<div style="position:absolute;inset:0;pointer-events:none;z-index:14;opacity:.16;background:repeating-linear-gradient(0deg,rgba(255,255,255,.16) 0,rgba(255,255,255,.16) 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) 4px);mix-blend-mode:overlay"></div>' +
    '<div data-sr="overlay" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;background:radial-gradient(120% 90% at 50% 24%,rgba(25,34,72,.76),rgba(5,7,18,.95));pointer-events:auto;z-index:20"></div>';
  mount.appendChild(hud);
  const el = key => hud.querySelector(`[data-sr="${key}"]`);
  function layoutHud() {
    const targetPanel = hud.querySelector('[data-sr-panel="target"]');
    const statusPanel = hud.querySelector('[data-sr-panel="status"]');
    const compact = width() < 560;
    if (targetPanel) {
      targetPanel.style.top = compact ? "10px" : "14px";
      targetPanel.style.left = compact ? "10px" : "16px";
      targetPanel.style.right = compact ? "10px" : "";
      targetPanel.style.gap = compact ? "9px" : "12px";
      targetPanel.style.padding = compact ? "7px 12px 7px 7px" : "8px 14px 8px 8px";
    }
    if (statusPanel) {
      statusPanel.style.top = compact ? "82px" : "16px";
      statusPanel.style.right = compact ? "10px" : "16px";
      statusPanel.style.minWidth = compact ? "138px" : "160px";
      statusPanel.style.padding = compact ? "7px 10px" : "9px 12px";
    }
  }
  layoutHud();

  const trackGroup = new THREE.Group();
  const railGroup = new THREE.Group();
  const sceneryGroup = new THREE.Group();
  const gateGroup = new THREE.Group();
  const burstGroup = new THREE.Group();
  scene.add(trackGroup, railGroup, sceneryGroup, gateGroup, burstGroup);

  let ship = null;
  let trackSegments = [];
  let railSegments = [];
  let gateObjects = [];
  let burstParticles = [];
  let pulseObjects = [];
  let roadTexture = null;
  let currentMap = mapForLevel(world, startLevelIdx);
  let track = null;
  let levelIdx = startLevelIdx;
  let laneIx = 1;
  let playerZ = 0;
  let speed = 0;
  let timeMs = 0;
  let score = 0;
  let levelStartScore = 0;
  let wordsCorrect = 0;
  let wordsWrong = 0;
  let missedCorrect = 0;
  let obstaclesHit = 0;
  let shield = 3;
  let running = false;
  let paused = false;
  let savedRunning = false;
  let countdownT = 0;
  let bannerT = 0;
  let boostT = 0;
  let dragT = 0;
  let shakeT = 0;
  let catchUpSerial = 0;
  let elapsed = 0;
  let raf = 0;
  let last = 0;
  let fov = cameraBaseFov;
  const levelResults = new Array(levelCount);
  const caughtCorrectWords = new Set();
  // Bests are per-student (scoped by the signed-in session), not per-device:
  // two siblings on one iPad must not share ghost times.
  let bestScope = "default";
  try {
    bestScope = JSON.parse(window.localStorage.getItem("lp-student-session-v1") || "null")?.studentId || "default";
  } catch { /* no session - keep default */ }
  const bestKey = index => `lp:sound-racer-best:${bestScope}:${difficulty}:${index}`;

  function material(color, opts = {}) {
    const config = {
      color,
      roughness: opts.roughness ?? 0.62,
      metalness: opts.metalness ?? 0.18,
      flatShading: opts.flatShading ?? true,
      emissive: opts.emissive || 0x000000,
      emissiveIntensity: opts.emissiveIntensity || 0,
      transparent: opts.transparent || false,
      opacity: opts.opacity ?? 1
    };
    if (opts.map) config.map = opts.map;
    if (opts.side !== undefined) config.side = opts.side;
    if (opts.alphaTest !== undefined) config.alphaTest = opts.alphaTest;
    return new THREE.MeshStandardMaterial(config);
  }

  function basic(color, opts = {}) {
    const config = {
      color,
      transparent: opts.transparent || false,
      opacity: opts.opacity ?? 1,
      depthWrite: opts.depthWrite ?? true
    };
    if (opts.map) config.map = opts.map;
    if (opts.blending !== undefined) config.blending = opts.blending;
    if (opts.side !== undefined) config.side = opts.side;
    if (opts.fog !== undefined) config.fog = opts.fog;
    if (opts.alphaTest !== undefined) config.alphaTest = opts.alphaTest;
    return new THREE.MeshBasicMaterial(config);
  }

  function setModelShadows(root, cast = true, receive = true) {
    root.traverse(node => {
      if (!node.isMesh) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material].filter(Boolean);
      const transparent = mats.some(mat => mat.transparent && (mat.opacity ?? 1) < 0.98);
      node.castShadow = transparent ? false : cast;
      node.receiveShadow = transparent ? false : receive;
    });
    return root;
  }

  function canvasTexture(width, height, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    draw(ctx, width, height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeMountainTexture(layer) {
    return canvasTexture(1024, 384, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const ranges = layer === 0
        ? [
            { base: 316, amp: 205, step: 58, color: mixHex(currentMap.fog, 0x141a28, 0.5), alpha: 0.98 },
            { base: 340, amp: 136, step: 42, color: mixHex(currentMap.fog, 0x24313c, 0.42), alpha: 0.82 }
          ]
        : [
            { base: 326, amp: 118, step: 44, color: mixHex(currentMap.fog, currentMap.terrain, 0.38), alpha: 0.9 },
            { base: 354, amp: 82, step: 34, color: mixHex(currentMap.terrain, 0x0e1711, 0.34), alpha: 0.74 }
          ];

      for (const [rangeIx, range] of ranges.entries()) {
        const points = [];
        for (let x = -range.step; x <= w + range.step; x += range.step) {
          const noise = Math.sin((x + layer * 37 + rangeIx * 81) * 0.019) * 0.34 +
            Math.cos((x + rangeIx * 43) * 0.043) * 0.22;
          const spike = ((Math.abs(Math.sin((x + layer * 17) * 0.011)) + noise + 1.1) / 2.2) * range.amp;
          points.push({ x, y: range.base - spike });
        }

        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(points[0].x, points[0].y);
        for (const p of points) ctx.lineTo(p.x, p.y);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = colorStyle(range.color, range.alpha);
        ctx.fill();

        for (let i = 1; i < points.length - 1; i += 2) {
          const p = points[i];
          const left = points[i - 1];
          const right = points[i + 1];
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + 2);
          ctx.lineTo((p.x + right.x) / 2, range.base + 14);
          ctx.lineTo(p.x + 14, range.base + 34);
          ctx.closePath();
          ctx.fillStyle = colorStyle(mixHex(range.color, 0x05070d, 0.36), 0.34);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(p.x, p.y + 4);
          ctx.lineTo((p.x + left.x) / 2, range.base + 10);
          ctx.lineTo(p.x - 10, range.base + 24);
          ctx.closePath();
          ctx.fillStyle = colorStyle(mixHex(range.color, 0xffffff, 0.18), 0.24);
          ctx.fill();

          if (layer === 0 && i % 4 === 1) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y + 6);
            ctx.lineTo(p.x - 17, p.y + 38);
            ctx.lineTo(p.x + 22, p.y + 42);
            ctx.closePath();
            ctx.fillStyle = "rgba(230,240,235,.18)";
            ctx.fill();
          }
        }
      }

      if (world === "dino" && layer === 0) {
        const volcanoX = w * 0.56;
        const volcanoTop = h * 0.2;
        const volcanoBase = h * 0.92;
        ctx.beginPath();
        ctx.moveTo(volcanoX - 205, volcanoBase);
        ctx.lineTo(volcanoX - 34, volcanoTop + 22);
        ctx.lineTo(volcanoX + 30, volcanoTop + 18);
        ctx.lineTo(volcanoX + 238, volcanoBase);
        ctx.closePath();
        ctx.fillStyle = colorStyle(mixHex(currentMap.hazard, 0x1c1813, 0.45), 0.94);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(volcanoX - 54, volcanoTop + 25);
        ctx.lineTo(volcanoX + 30, volcanoTop + 22);
        ctx.lineTo(volcanoX + 58, volcanoTop + 64);
        ctx.lineTo(volcanoX - 78, volcanoTop + 68);
        ctx.closePath();
        ctx.fillStyle = colorStyle(mixHex(currentMap.trackA, 0xff6d3a, 0.24), 0.9);
        ctx.fill();

        for (let i = 0; i < 5; i += 1) {
          ctx.beginPath();
          ctx.moveTo(volcanoX - 36 + i * 18, volcanoTop + 56);
          ctx.bezierCurveTo(volcanoX - 62 + i * 24, volcanoTop + 112, volcanoX - 12 + i * 16, volcanoTop + 160, volcanoX - 42 + i * 30, volcanoBase - 28);
          ctx.lineWidth = 7 + (i % 2) * 3;
          ctx.strokeStyle = colorStyle(i % 2 ? 0xffc05b : 0xff5936, 0.72);
          ctx.stroke();
        }

        for (let i = 0; i < 9; i += 1) {
          const puffX = volcanoX - 42 + i * 17;
          const puffY = volcanoTop - 6 - (i % 4) * 12;
          const smoke = ctx.createRadialGradient(puffX, puffY, 2, puffX, puffY, 42 + i * 4);
          smoke.addColorStop(0, "rgba(72,64,58,.42)");
          smoke.addColorStop(1, "rgba(72,64,58,0)");
          ctx.fillStyle = smoke;
          ctx.beginPath();
          ctx.ellipse(puffX, puffY, 58, 22, i * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (world === "moonwood" && layer === 0) {
        const moonX = w * 0.73;
        const moonY = h * 0.2;
        const moon = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 72);
        moon.addColorStop(0, "rgba(232,244,255,.9)");
        moon.addColorStop(0.55, "rgba(196,218,255,.54)");
        moon.addColorStop(1, "rgba(160,190,255,0)");
        ctx.fillStyle = moon;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 72, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colorStyle(currentMap.sky, 0.72);
        ctx.beginPath();
        ctx.arc(moonX + 28, moonY - 6, 66, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colorStyle(mixHex(currentMap.terrain, 0x030615, 0.64), 0.72);
        for (let i = 0; i < 22; i += 1) {
          const x = (i * 59) % w;
          const treeH = 74 + (i % 6) * 16;
          ctx.save();
          ctx.translate(x, h - 12);
          ctx.rotate(((i % 5) - 2) * 0.08);
          ctx.fillRect(-5, -treeH, 10, treeH);
          ctx.fillRect(-3, -treeH * 0.78, 58, 7);
          ctx.fillRect(-48, -treeH * 0.56, 50, 6);
          ctx.restore();
        }
      }

      if (world === "meadow" && layer === 1) {
        ctx.fillStyle = colorStyle(mixHex(currentMap.terrain, 0xf3ffcf, 0.22), 0.62);
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        for (let x = 0; x <= w; x += 32) {
          ctx.lineTo(x, h * 0.68 + Math.sin(x * 0.016) * 18 + Math.cos(x * 0.029) * 9);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      }

      const haze = ctx.createLinearGradient(0, 0, 0, h);
      haze.addColorStop(0, colorStyle(currentMap.sky, 0));
      haze.addColorStop(0.55, colorStyle(currentMap.fog, 0.12));
      haze.addColorStop(1, colorStyle(currentMap.fog, 0.5));
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function makeCloudTexture() {
    return canvasTexture(1024, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 18; i += 1) {
        const x = (i * 137) % w;
        const y = 42 + (i * 31) % 130;
        const widthValue = 120 + (i % 5) * 36;
        const heightValue = (world === "dino" ? 24 : 16) + (i % 4) * 7;
        const gradient = ctx.createRadialGradient(x, y, 8, x, y, widthValue * 0.62);
        if (world === "dino") {
          gradient.addColorStop(0, "rgba(82,70,60,.38)");
          gradient.addColorStop(0.45, "rgba(118,100,82,.2)");
        } else if (world === "moonwood") {
          gradient.addColorStop(0, "rgba(194,212,255,.24)");
          gradient.addColorStop(0.45, "rgba(122,136,214,.14)");
        } else {
          gradient.addColorStop(0, "rgba(255,255,245,.36)");
          gradient.addColorStop(0.45, "rgba(240,245,235,.2)");
        }
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x, y, widthValue, heightValue, -0.04 + i * 0.01, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function makeForestTexture(layer) {
    return canvasTexture(1024, 360, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const trunk = mixHex(currentMap.ground, 0x1a100b, 0.55);
      const count = layer === 0 ? 48 : 70;

      if (world === "dino") {
        ctx.fillStyle = colorStyle(mixHex(currentMap.ground, 0x0d2017, 0.28), layer === 0 ? 0.46 : 0.3);
        ctx.fillRect(0, h - 44, w, 44);
        for (let i = 0; i < count; i += 1) {
          const x = (i / count) * w + ((i * 41 + layer * 23) % 34) - 17;
          const treeH = 82 + ((i * 47 + layer * 19) % (layer === 0 ? 124 : 82));
          const base = h - 4 - ((i * 13) % 16);
          const topY = base - treeH;
          ctx.fillStyle = colorStyle(trunk, layer === 0 ? 0.8 : 0.58);
          ctx.fillRect(x - 5, topY + treeH * 0.2, 10, treeH * 0.8);
          for (let leaf = 0; leaf < 7; leaf += 1) {
            const angle = -1.25 + leaf * 0.42;
            const len = treeH * (0.36 + (leaf % 3) * 0.04);
            ctx.save();
            ctx.translate(x, topY + treeH * 0.22);
            ctx.rotate(angle);
            ctx.fillStyle = colorStyle(leaf % 2 ? mixHex(currentMap.terrain, 0x24330d, 0.32) : mixHex(currentMap.terrain, 0xd1d66a, 0.2), layer === 0 ? 0.86 : 0.58);
            ctx.beginPath();
            ctx.ellipse(len * 0.36, 0, len * 0.38, treeH * 0.035, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
        for (let i = 0; i < 28; i += 1) {
          const x = (i * 71) % w;
          const y = h - 26 - (i % 4) * 7;
          ctx.strokeStyle = colorStyle(mixHex(currentMap.terrain, 0xcad36f, 0.18), layer === 0 ? 0.68 : 0.42);
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x, h);
          ctx.quadraticCurveTo(x - 12, y + 24, x + 8, y);
          ctx.stroke();
        }
      } else if (world === "moonwood") {
        for (let i = 0; i < count; i += 1) {
          const x = (i / count) * w + ((i * 31 + layer * 47) % 34) - 17;
          const treeH = 104 + ((i * 43 + layer * 17) % (layer === 0 ? 132 : 78));
          const base = h - 4 - ((i * 7) % 18);
          ctx.strokeStyle = colorStyle(mixHex(currentMap.ground, 0x02020a, 0.62), layer === 0 ? 0.9 : 0.62);
          ctx.lineWidth = 7 + (i % 4);
          ctx.beginPath();
          ctx.moveTo(x, base);
          ctx.bezierCurveTo(x - 18, base - treeH * 0.34, x + 24, base - treeH * 0.62, x - 4, base - treeH);
          ctx.stroke();
          for (let branch = 0; branch < 4; branch += 1) {
            const by = base - treeH * (0.28 + branch * 0.14);
            const dir = branch % 2 ? 1 : -1;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x + dir * 2, by);
            ctx.quadraticCurveTo(x + dir * (30 + branch * 6), by - 16, x + dir * (58 + branch * 4), by - 8);
            ctx.stroke();
          }
          ctx.fillStyle = colorStyle(i % 2 ? mixHex(currentMap.terrain, 0x29375e, 0.42) : mixHex(currentMap.terrain, 0x7f61b5, 0.24), layer === 0 ? 0.72 : 0.48);
          ctx.beginPath();
          ctx.ellipse(x + ((i % 3) - 1) * 12, base - treeH * 0.9, treeH * 0.17, treeH * 0.1, i * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const leafDark = mixHex(currentMap.terrain, 0x1e4b1f, 0.28);
        const leafLight = mixHex(currentMap.terrain, 0xf0ffd1, 0.34);
        ctx.fillStyle = colorStyle(mixHex(currentMap.terrain, 0xf0efb0, 0.2), layer === 0 ? 0.3 : 0.2);
        ctx.fillRect(0, h - 54, w, 54);
        for (let i = 0; i < count; i += 1) {
          const x = (i / count) * w + ((i * 37 + layer * 61) % 30) - 15;
          const treeH = 62 + ((i * 53 + layer * 29) % (layer === 0 ? 96 : 62));
          const base = h - 2 - ((i * 11) % 18);
          ctx.fillStyle = colorStyle(trunk, 0.66);
          ctx.fillRect(x - 4, base - treeH * 0.48, 8, treeH * 0.52);
          for (let blob = 0; blob < 4; blob += 1) {
            const bx = x + ((blob % 2) ? 14 : -12);
            const by = base - treeH * (0.58 + blob * 0.08);
            ctx.fillStyle = colorStyle(blob % 2 ? leafDark : leafLight, layer === 0 ? 0.82 : 0.56);
            ctx.beginPath();
            ctx.ellipse(bx, by, treeH * 0.22, treeH * 0.18, blob * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.strokeStyle = colorStyle(0xf1d486, layer === 0 ? 0.52 : 0.28);
        ctx.lineWidth = 5;
        for (let y = h - 44; y < h - 22; y += 16) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x <= w; x += 44) ctx.lineTo(x, y + Math.sin(x * 0.04) * 3);
          ctx.stroke();
        }
      }

      const fade = ctx.createLinearGradient(0, 0, 0, h);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(1, colorStyle(currentMap.fog, layer === 0 ? 0.18 : 0.36));
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function makeTrackTexture() {
    const texture = canvasTexture(768, 1536, (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, colorStyle(mixHex(currentMap.trackA, 0x000000, 0.38), 1));
      bg.addColorStop(0.16, colorStyle(mixHex(currentMap.trackA, currentMap.rail, 0.08), 1));
      bg.addColorStop(0.5, colorStyle(mixHex(currentMap.trackB, 0xffffff, 0.09), 1));
      bg.addColorStop(0.84, colorStyle(mixHex(currentMap.trackA, currentMap.rail, 0.08), 1));
      bg.addColorStop(1, colorStyle(mixHex(currentMap.trackA, 0x000000, 0.38), 1));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.globalAlpha = 0.32;
      for (let i = 0; i < 1200; i += 1) {
        const x = (i * 79) % w;
        const y = (i * 43) % h;
        ctx.fillStyle = i % 3 ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.34)";
        ctx.fillRect(x, y, 1 + (i % 9), 1 + (i % 2));
      }
      ctx.globalAlpha = 1;

      for (let y = 0; y < h; y += 96) {
        const panel = ctx.createLinearGradient(0, y, w, y + 72);
        panel.addColorStop(0, colorStyle(0xffffff, 0.04));
        panel.addColorStop(0.52, colorStyle(0x000000, 0.1));
        panel.addColorStop(1, colorStyle(0xffffff, 0.025));
        ctx.fillStyle = panel;
        ctx.fillRect(w * 0.11, y + 10, w * 0.78, 72);
        ctx.fillStyle = colorStyle(mixHex(currentMap.trackA, 0xffffff, 0.1), 0.62);
        ctx.fillRect(w * 0.08, y, w * 0.84, 3);
        ctx.fillStyle = colorStyle(0x000000, 0.22);
        ctx.fillRect(w * 0.13, y + 82, w * 0.74, 3);
      }

      const railGlow = ctx.createLinearGradient(0, 0, w, 0);
      railGlow.addColorStop(0, colorStyle(currentMap.rail, 0.94));
      railGlow.addColorStop(0.06, colorStyle(currentMap.rail, 0.22));
      railGlow.addColorStop(0.5, "rgba(255,255,255,0)");
      railGlow.addColorStop(0.94, colorStyle(currentMap.rail, 0.22));
      railGlow.addColorStop(1, colorStyle(currentMap.rail, 0.94));
      ctx.fillStyle = railGlow;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = colorStyle(currentMap.rail, 0.92);
      for (const x of [62, w - 70]) ctx.fillRect(x, 0, 10, h);

      for (let y = 34; y < h; y += 116) {
        ctx.fillStyle = colorStyle(currentMap.gate, 0.46);
        ctx.fillRect(w * 0.26, y, 16, 46);
        ctx.fillRect(w * 0.72, y + 26, 16, 46);
        ctx.fillStyle = colorStyle(currentMap.rail, 0.28);
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath();
          ctx.moveTo(8 + i * 34, y + 10);
          ctx.lineTo(28 + i * 34, y + 30);
          ctx.lineTo(8 + i * 34, y + 50);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(w - 8 - i * 34, y + 10);
          ctx.lineTo(w - 28 - i * 34, y + 30);
          ctx.lineTo(w - 8 - i * 34, y + 50);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.strokeStyle = colorStyle(0xffffff, 0.18);
      ctx.lineWidth = 2;
      for (const x of [w * 0.34, w * 0.5, w * 0.66]) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = colorStyle(currentMap.gate, 0.5);
      ctx.lineWidth = 1;
      for (let y = -w; y < h + w; y += 48) {
        ctx.beginPath();
        ctx.moveTo(w * 0.1, y);
        ctx.lineTo(w * 0.9, y + w * 0.16);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 3);
    return texture;
  }

  function makeGroundTexture() {
    const texture = canvasTexture(512, 512, (ctx, w, h) => {
      const base = ctx.createLinearGradient(0, 0, w, h);
      base.addColorStop(0, colorStyle(mixHex(currentMap.ground, 0xffffff, world === "meadow" ? 0.18 : 0.04), 1));
      base.addColorStop(0.52, colorStyle(currentMap.ground, 1));
      base.addColorStop(1, colorStyle(mixHex(currentMap.ground, 0x000000, world === "moonwood" ? 0.42 : 0.18), 1));
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 900; i += 1) {
        const x = (i * 53) % w;
        const y = (i * 97) % h;
        const alpha = 0.06 + (i % 7) * 0.012;
        ctx.fillStyle = i % 2
          ? colorStyle(mixHex(currentMap.terrain, 0xffffff, 0.18), alpha)
          : colorStyle(mixHex(currentMap.ground, 0x000000, 0.32), alpha);
        ctx.fillRect(x, y, 1 + (i % 8), 1 + (i % 4));
      }

      if (world === "dino") {
        ctx.strokeStyle = colorStyle(0x8bdc7b, 0.18);
        ctx.lineWidth = 4;
        for (let i = 0; i < 34; i += 1) {
          const x = (i * 41) % w;
          ctx.beginPath();
          ctx.moveTo(x, h);
          ctx.quadraticCurveTo(x - 18, h - 88 - (i % 5) * 11, x + 10, h - 142 - (i % 3) * 9);
          ctx.stroke();
        }
      } else if (world === "moonwood") {
        ctx.strokeStyle = colorStyle(currentMap.trim, 0.16);
        ctx.lineWidth = 2;
        for (let i = 0; i < 36; i += 1) {
          const x = (i * 47) % w;
          const y = (i * 83) % h;
          ctx.beginPath();
          ctx.moveTo(x - 18, y);
          ctx.lineTo(x + 18, y + 8);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = colorStyle(0xd8ef91, 0.18);
        ctx.lineWidth = 3;
        for (let y = 12; y < h; y += 38) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x <= w; x += 38) ctx.lineTo(x, y + Math.sin(x * 0.04) * 4);
          ctx.stroke();
        }
      }
    });
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(9, 12);
    return texture;
  }

  function makeParticleTexture() {
    return canvasTexture(96, 96, (ctx, w, h) => {
      const glow = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
      glow.addColorStop(0, "rgba(255,255,255,.95)");
      glow.addColorStop(0.28, "rgba(255,255,255,.42)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function makeHorizonGlowTexture() {
    return canvasTexture(1024, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w * 0.5, h * 0.62, 12, w * 0.5, h * 0.62, w * 0.5);
      glow.addColorStop(0, colorStyle(currentMap.sun, world === "moonwood" ? 0.28 : 0.22));
      glow.addColorStop(0.36, colorStyle(currentMap.gate, world === "dino" ? 0.13 : 0.08));
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = colorStyle(currentMap.fog, 0.16);
      for (let y = h * 0.62; y < h; y += 14) ctx.fillRect(0, y, w, 2);
    });
  }

  function labelTexture(text, accent, isWrong) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const cutPanel = (x, y, w, h, cut) => {
      ctx.beginPath();
      ctx.moveTo(x + cut, y);
      ctx.lineTo(x + w - cut, y);
      ctx.lineTo(x + w, y + cut);
      ctx.lineTo(x + w - cut, y + h);
      ctx.lineTo(x + cut, y + h);
      ctx.lineTo(x, y + h - cut);
      ctx.lineTo(x, y + cut);
      ctx.closePath();
    };
    const accentHex = "#" + accent.toString(16).padStart(6, "0");
    const bg = ctx.createLinearGradient(42, 56, 470, 196);
    bg.addColorStop(0, isWrong ? "rgba(24,18,20,.94)" : "rgba(5,16,32,.96)");
    bg.addColorStop(0.58, isWrong ? "rgba(50,32,36,.88)" : "rgba(16,38,70,.92)");
    bg.addColorStop(1, isWrong ? "rgba(14,12,16,.9)" : "rgba(3,10,22,.94)");
    ctx.fillStyle = "rgba(0,0,0,.34)";
    ctx.beginPath();
    cutPanel(50, 78, 428, 118, 20);
    ctx.fill();
    ctx.fillStyle = bg;
    cutPanel(42, 66, 428, 118, 20);
    ctx.fill();
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.globalAlpha = isWrong ? 0.16 : 0.24;
    ctx.fillStyle = accentHex;
    for (let x = 72; x < 448; x += 34) ctx.fillRect(x, 76, 16, 96);
    ctx.globalAlpha = 1;
    ctx.font = "900 112px Fredoka, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 15;
    ctx.strokeStyle = "rgba(0,0,0,.86)";
    ctx.strokeText(String(text || "").toLowerCase(), 256, 128);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(text || "").toLowerCase(), 256, 128);
    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.fillRect(76, 82, 126, 4);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeWordGate(gate) {
    const group = new THREE.Group();
    // Correct and wrong gates look identical until passed through: the lesson
    // is reading the word on the gate, not spotting which ring glows.
    const accent = currentMap.gate;
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.075, 8, 24),
      basic(accent, {
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    torus.rotation.y = Math.PI / 2;
    group.add(torus);

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42, 0),
      material(accent, {
        metalness: 0.15,
        roughness: 0.36,
        emissive: accent,
        emissiveIntensity: 0.45
      })
    );
    core.position.y = -0.02;
    core.castShadow = true;
    group.add(core);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture(gate.word, accent, false),
      transparent: true,
      depthTest: false,
      depthWrite: false
    }));
    sprite.renderOrder = 10;
    sprite.scale.set(3.65, 1.78, 1);
    sprite.position.set(0, 1.24, 0.25);
    group.add(sprite);
    group.userData.spin = 1.15;
    group.userData.sprite = sprite;
    return setModelShadows(group, true, false);
  }

  function makeHazard(type) {
    const group = new THREE.Group();
    if (type === "haybale") {
      const bale = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.8, 0.8, 1, 1, 1), material(currentMap.hazard, { roughness: 0.9 }));
      bale.rotation.set(0.08, 0.15, -0.04);
      group.add(bale);
      for (let i = -1; i <= 1; i += 1) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.06, 0.86), basic(0x6e5130));
        band.position.y = i * 0.22;
        group.add(band);
      }
    } else if (type === "cloudbank") {
      for (let i = 0; i < 4; i += 1) {
        const puff = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.42 + i * 0.06, 1),
          basic(currentMap.hazard, { transparent: true, opacity: 0.78 })
        );
        puff.position.set((i - 1.5) * 0.36, 0.1 + Math.sin(i) * 0.1, (i % 2) * 0.18);
        group.add(puff);
      }
    } else {
      const rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.72, 0),
        material(currentMap.hazard, { roughness: 0.98, metalness: 0.04 })
      );
      rock.rotation.set(0.4, 0.2, 0.1);
      group.add(rock);
    }
    return setModelShadows(group, true, true);
  }

  function makeGateObject(gate) {
    const mesh = gate.kind === "obstacle"
      ? makeHazard(worldObstacles(world))
      : makeWordGate(gate);
    mesh.position.set(LANES[gate.lane], 0.98, -100);
    mesh.visible = false;
    gateGroup.add(mesh);
    return { ...gate, mesh, resolved: false, tries: gate.tries || 0, baseLane: gate.lane, hintShown: false };
  }

  function makeBoostCone(x, y, z, radius = 0.24, length = 1.18) {
    const engine = new THREE.Mesh(new THREE.ConeGeometry(radius, length, 16, 1, true), basic(currentMap.boost, {
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    }));
    engine.rotation.x = Math.PI / 2;
    engine.position.set(x, y, z);
    return engine;
  }

  function finishShip(group, engines, light, scale = 1.08) {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.18, 28),
      basic(0x000000, { transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.48, 0.38);
    shadow.scale.set(1.45, 0.54, 1);
    group.add(shadow);

    const hoverGlow = new THREE.Mesh(
      new THREE.CircleGeometry(1.0, 28),
      basic(currentMap.boost, {
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    hoverGlow.rotation.x = -Math.PI / 2;
    hoverGlow.position.set(0, -0.46, 0.28);
    hoverGlow.scale.set(1.2, 0.38, 1);
    hoverGlow.userData.pulse = 2.4;
    hoverGlow.userData.baseOpacity = 0.2;
    pulseObjects.push(hoverGlow);
    group.add(hoverGlow);

    group.userData.engines = engines;
    group.userData.light = light;
    group.position.set(0, 1.0, 4.35);
    group.scale.set(scale, scale, scale);
    return setModelShadows(group, true, true);
  }

  function makeMeadowVehicle() {
    const group = new THREE.Group();
    const green = material(0x4d9f4f, { roughness: 0.45, metalness: 0.18, emissive: 0x193918, emissiveIntensity: 0.05 });
    const yellow = material(0xe8c246, { roughness: 0.38, metalness: 0.32, emissive: 0x5a4100, emissiveIntensity: 0.05 });
    const wood = material(0x9a6535, { roughness: 0.72, metalness: 0.04 });
    const dark = material(0x12161b, { roughness: 0.52, metalness: 0.3 });
    const glass = material(0xa8efff, {
      roughness: 0.12,
      metalness: 0.06,
      emissive: 0x2ca8d2,
      emissiveIntensity: 0.34,
      transparent: true,
      opacity: 0.86
    });

    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.38, 1.2), green);
    hood.position.set(0, 0.02, -0.38);
    hood.rotation.x = -0.04;
    group.add(hood);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.3, 0.36), yellow);
    nose.position.set(0, -0.02, -1.15);
    group.add(nose);

    const grill = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.06), dark);
    grill.position.set(0, -0.02, -1.36);
    group.add(grill);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.58, 0.58), green);
    cab.position.set(0, 0.34, 0.22);
    cab.rotation.x = -0.05;
    group.add(cab);

    const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.32, 0.08), glass);
    windscreen.position.set(0, 0.42, -0.1);
    group.add(windscreen);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.12, 0.72), yellow);
    roof.position.set(0, 0.72, 0.2);
    group.add(roof);

    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.28, 0.86), wood);
    bed.position.set(0, 0.02, 0.88);
    group.add(bed);

    for (const x of [-0.48, 0.48]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.9), wood);
      rail.position.set(x, 0.26, 0.88);
      group.add(rail);
    }

    for (const side of [-1, 1]) {
      for (const z of [-0.7, 0.78]) {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 12), dark);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(side * 0.74, -0.28, z);
        group.add(tire);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.2, 10), yellow);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(side * 0.76, -0.28, z);
        group.add(hub);
      }

      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 1.38), yellow);
      wing.position.set(side * 0.98, -0.06, 0.1);
      wing.rotation.z = side * -0.1;
      group.add(wing);
    }

    const engines = [
      makeBoostCone(-0.36, -0.12, 1.46, 0.2, 0.9),
      makeBoostCone(0.36, -0.12, 1.46, 0.2, 0.9)
    ];
    for (const engine of engines) group.add(engine);

    const light = new THREE.PointLight(currentMap.boost, 2, 8);
    light.position.set(0, -0.02, 1.58);
    group.add(light);
    return finishShip(group, engines, light, 1.03);
  }

  function makeDinoVehicle() {
    const group = new THREE.Group();
    const skin = material(mixHex(currentMap.vehicle, 0x244b26, 0.18), {
      metalness: 0.16,
      roughness: 0.5,
      flatShading: true,
      emissive: mixHex(currentMap.vehicle, currentMap.trim, 0.18),
      emissiveIntensity: 0.055
    });
    const trim = material(currentMap.trim, {
      metalness: 0.26,
      roughness: 0.48,
      emissive: currentMap.trim,
      emissiveIntensity: 0.14
    });
    const lava = material(0xff8a34, { metalness: 0.2, roughness: 0.34, emissive: 0xff4a1f, emissiveIntensity: 0.26 });
    const bone = material(0xf1e2bc, { metalness: 0.1, roughness: 0.52 });
    const dark = material(0x151a18, { metalness: 0.36, roughness: 0.48 });
    const black = material(0x05070a, { metalness: 0.5, roughness: 0.38 });
    const bellyMat = material(0x172015, { metalness: 0.28, roughness: 0.6, emissive: 0x0a1608, emissiveIntensity: 0.04 });
    const amberEye = basic(0xffd34e, { transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });

    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.78, 0), skin);
    body.scale.set(1.12, 0.5, 1.56);
    body.position.set(0, 0.08, 0.08);
    group.add(body);

    const belly = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.18, 1.82), bellyMat);
    belly.position.set(0, -0.2, 0.17);
    belly.rotation.x = -0.03;
    group.add(belly);

    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.74), black);
    saddle.position.set(0, 0.42, -0.02);
    saddle.rotation.x = -0.08;
    group.add(saddle);

    const saddleStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.035, 0.62),
      basic(currentMap.gate, { transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    saddleStripe.position.set(0, 0.525, -0.03);
    saddleStripe.rotation.x = -0.08;
    group.add(saddleStripe);

    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.44, 0), skin);
    head.scale.set(0.9, 0.62, 0.72);
    head.position.set(0, 0.24, -1.1);
    group.add(head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.2, 0.5), bone);
    snout.position.set(0, 0.16, -1.42);
    group.add(snout);

    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), amberEye);
      eye.position.set(side * 0.24, 0.34, -1.28);
      group.add(eye);

      const spot = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), lava);
      spot.position.set(side * 0.42, 0.26, -0.28);
      spot.scale.set(1, 0.54, 0.86);
      group.add(spot);

      const nostril = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.05), black);
      nostril.position.set(side * 0.14, 0.18, -1.68);
      group.add(nostril);

      const cheekStripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.64), trim);
      cheekStripe.position.set(side * 0.34, 0.31, -1.08);
      cheekStripe.rotation.y = side * 0.22;
      cheekStripe.rotation.z = side * -0.18;
      group.add(cheekStripe);
    }

    for (let i = 0; i < 6; i += 1) {
      const plate = new THREE.Mesh(new THREE.ConeGeometry(0.2 - i * 0.012, 0.56 - i * 0.035, 3), i % 2 ? lava : bone);
      plate.position.set(0, 0.62 - i * 0.018, -0.86 + i * 0.34);
      plate.rotation.y = Math.PI / 6;
      plate.rotation.x = -0.08;
      group.add(plate);
    }

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 8), skin);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0.16, 1.22);
    group.add(tail);

    for (const side of [-1, 1]) {
      const flank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 1.5), trim);
      flank.position.set(side * 0.78, -0.02, 0.16);
      flank.rotation.z = side * -0.14;
      flank.rotation.y = side * 0.14;
      group.add(flank);

      const lowerStripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.05, 1.28),
        basic(currentMap.gate, { transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      lowerStripe.position.set(side * 0.86, 0.12, 0.18);
      lowerStripe.rotation.y = side * 0.14;
      group.add(lowerStripe);

      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 1.0), dark);
      pod.position.set(side * 0.55, -0.27, 0.66);
      group.add(pod);

      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.18), black);
      intake.position.set(side * 0.55, -0.2, 0.08);
      group.add(intake);
    }

    const engines = [
      makeBoostCone(-0.38, -0.08, 1.24),
      makeBoostCone(0.38, -0.08, 1.24)
    ];
    for (const engine of engines) group.add(engine);

    const light = new THREE.PointLight(currentMap.boost, 2.4, 9);
    light.position.set(0, -0.05, 1.38);
    group.add(light);
    return finishShip(group, engines, light, 0.98);
  }

  function makeMoonwoodVehicle() {
    const group = new THREE.Group();
    const wood = material(0x5b3a2d, { roughness: 0.74, metalness: 0.06 });
    const bristle = material(0xa87b46, { roughness: 0.82, metalness: 0.03 });
    const purple = material(0x4e336e, { roughness: 0.48, metalness: 0.2, emissive: 0x24113d, emissiveIntensity: 0.1 });
    const dark = material(0x11111d, { roughness: 0.5, metalness: 0.32 });
    const silver = material(0xc7d6ff, { roughness: 0.24, metalness: 0.42, emissive: 0x5e76c8, emissiveIntensity: 0.1 });
    const glow = material(currentMap.trim, {
      roughness: 0.12,
      metalness: 0.04,
      emissive: currentMap.trim,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.9
    });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.15, 8), wood);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, -0.06, 0.05);
    group.add(shaft);

    const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.78, 9), bristle);
    bristles.rotation.x = -Math.PI / 2;
    bristles.position.set(0, -0.06, 1.54);
    bristles.scale.x = 1.28;
    group.add(bristles);

    const prow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 8), silver);
    prow.rotation.x = Math.PI / 2;
    prow.position.set(0, -0.06, -1.44);
    group.add(prow);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.25, 0.72), purple);
    seat.position.set(0, 0.14, 0.18);
    seat.rotation.x = -0.08;
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.62, 0.18), purple);
    back.position.set(0, 0.44, 0.52);
    back.rotation.x = -0.24;
    group.add(back);

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 18), dark);
    brim.position.set(0, 0.66, -0.04);
    group.add(brim);

    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.72, 9), dark);
    hat.position.set(0, 1.02, -0.04);
    hat.rotation.z = -0.18;
    group.add(hat);

    const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.06, 12), purple);
    hatBand.position.set(0, 0.79, -0.04);
    group.add(hatBand);

    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.18), silver);
      rail.position.set(side * 0.62, 0.08, 0.18);
      rail.rotation.z = side * -0.1;
      group.add(rail);

      const wisp = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), glow);
      wisp.position.set(side * 0.42, 0.08, 1.06);
      group.add(wisp);
    }

    const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), glow);
    lantern.position.set(0, 0.14, -1.16);
    group.add(lantern);

    const engines = [
      makeBoostCone(-0.3, -0.04, 1.5, 0.18, 0.82),
      makeBoostCone(0.3, -0.04, 1.5, 0.18, 0.82)
    ];
    for (const engine of engines) group.add(engine);

    const light = new THREE.PointLight(currentMap.boost, 2.8, 9);
    light.position.set(0, 0.05, 1.3);
    group.add(light);
    return finishShip(group, engines, light, 1.02);
  }

  function makeShip() {
    if (world === "meadow") return makeMeadowVehicle();
    if (world === "moonwood") return makeMoonwoodVehicle();
    return makeDinoVehicle();
  }

  function makeTrackSegment(index, roadTexture) {
    const group = new THREE.Group();
    const shadow = new THREE.Mesh(
      new THREE.BoxGeometry(TRACK_WIDTH + 1.35, 0.08, TRACK_SEGMENT_LENGTH * 0.98),
      basic(0x020308, { transparent: true, opacity: 0.52, depthWrite: false })
    );
    shadow.position.y = -0.13;
    shadow.position.z = 0.08;
    group.add(shadow);

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(TRACK_WIDTH, 0.16, TRACK_SEGMENT_LENGTH * 0.94),
      material(index % 2 ? currentMap.trackA : currentMap.trackB, {
        metalness: 0.48,
        roughness: 0.34,
        emissive: currentMap.trackA,
        emissiveIntensity: 0.025,
        map: roadTexture
      })
    );
    slab.receiveShadow = true;
    group.add(slab);

    const centerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(TRACK_WIDTH * 0.6, 0.028, TRACK_SEGMENT_LENGTH * 0.68),
      basic(currentMap.rail, { transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    centerPanel.position.y = 0.105;
    centerPanel.position.z = -0.14;
    group.add(centerPanel);

    const inset = new THREE.Mesh(
      new THREE.BoxGeometry(TRACK_WIDTH * 0.42, 0.032, TRACK_SEGMENT_LENGTH * 0.42),
      material(mixHex(currentMap.trackB, 0xffffff, 0.04), {
        metalness: 0.42,
        roughness: 0.38,
        emissive: currentMap.rail,
        emissiveIntensity: 0.02
      })
    );
    inset.position.set(0, 0.11, 0.1);
    group.add(inset);

    for (const z of [-2.6, 0, 2.6]) {
      const cross = new THREE.Mesh(
        new THREE.BoxGeometry(TRACK_WIDTH * 0.92, 0.03, 0.08),
        basic(currentMap.rail, { transparent: true, opacity: 0.18 })
      );
      cross.position.set(0, 0.12, z);
      group.add(cross);
    }

    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.34, TRACK_SEGMENT_LENGTH * 0.86),
        material(currentMap.trackB, { metalness: 0.24, roughness: 0.54 })
      );
      curb.receiveShadow = true;
      curb.position.set(side * (TRACK_WIDTH / 2 + 0.08), 0.18, 0);
      curb.rotation.z = side * 0.06;
      group.add(curb);

      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.06, TRACK_SEGMENT_LENGTH * 0.86),
        basic(currentMap.rail, { transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      glow.position.set(side * (TRACK_WIDTH / 2 - 0.18), 0.38, 0);
      glow.userData.pulse = 0.22 + index * 0.17 + side;
      glow.userData.baseOpacity = 0.72;
      pulseObjects.push(glow);
      group.add(glow);

      const outerWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.98, TRACK_SEGMENT_LENGTH * 0.86),
        material(mixHex(currentMap.trackB, 0xffffff, 0.1), {
          metalness: 0.48,
          roughness: 0.34,
          emissive: currentMap.rail,
          emissiveIntensity: 0.025
        })
      );
      outerWall.receiveShadow = true;
      outerWall.position.set(side * (TRACK_WIDTH / 2 + 0.56), 0.48, 0);
      outerWall.rotation.z = side * -0.08;
      group.add(outerWall);

      const lowerSkirt = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.2, TRACK_SEGMENT_LENGTH * 0.82),
        material(mixHex(currentMap.trackA, 0x000000, 0.5), { metalness: 0.28, roughness: 0.58 })
      );
      lowerSkirt.position.set(side * (TRACK_WIDTH / 2 + 0.92), -0.02, 0);
      lowerSkirt.rotation.z = side * -0.18;
      group.add(lowerSkirt);

      for (let i = 0; i < 3; i += 1) {
        const chevron = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.045, 0.74),
          basic(i % 2 ? currentMap.gate : currentMap.rail, {
            transparent: true,
            opacity: 0.46,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          })
        );
        chevron.position.set(side * (TRACK_WIDTH / 2 + 0.02), 0.56, -2.38 + i * 2.34);
        chevron.rotation.y = side * 0.48;
        chevron.rotation.z = side * -0.18;
        group.add(chevron);
      }
    }

    return group;
  }

  function makeBillboard(label, side) {
    const group = new THREE.Group();
    const postMat = material(0x1b2029, { metalness: 0.44, roughness: 0.46 });
    const panelMat = material(currentMap.trackA, {
      metalness: 0.22,
      roughness: 0.42,
      emissive: currentMap.trackA,
      emissiveIntensity: 0.08
    });
    for (const x of [-0.82, 0.82]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.75, 0.12), postMat);
      post.position.set(x, 0.78, 0);
      group.add(post);
    }

    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.78, 0.12), panelMat);
    panel.position.y = 1.7;
    group.add(panel);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.64, 0.12, 0.135),
      basic(currentMap.rail, { transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    stripe.position.set(0, 1.88, 0.08);
    group.add(stripe);

    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.14), basic(currentMap.gate, { transparent: true, opacity: 0.78 }));
    notch.position.set(label % 2 ? 0.72 : -0.72, 1.55, 0.09);
    group.add(notch);
    group.rotation.y = side > 0 ? -0.28 : 0.28;
    return group;
  }

  function makeTrackGantry(index) {
    const group = new THREE.Group();
    const metal = material(0x232938, { metalness: 0.55, roughness: 0.38 });
    const light = basic(currentMap.gate, { transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    for (const side of [-1, 1]) {
      const x = side * 6.45;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.65, 0.2), metal);
      post.position.set(x, 1.3, 0);
      group.add(post);

      const flag = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.48, 0.1), material(index % 2 ? currentMap.trackB : currentMap.trackA, {
        metalness: 0.26,
        roughness: 0.38,
        emissive: currentMap.gate,
        emissiveIntensity: 0.07
      }));
      flag.position.set(x + side * 0.54, 2.22, -0.02);
      flag.rotation.y = side * -0.22;
      group.add(flag);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.08, 0.18), light);
      lamp.position.set(x + side * 0.36, 1.82, -0.1);
      lamp.rotation.y = side * -0.22;
      group.add(lamp);
    }
    group.userData.scrollFactor = 0.16;
    return group;
  }

  function makeMeadowTree(index, scale = 1) {
    const group = new THREE.Group();
    const trunkMat = material(0x8b5630, { roughness: 0.8, metalness: 0.02 });
    const leafA = material(mixHex(currentMap.terrain, 0xcff49b, 0.36), { roughness: 0.75, metalness: 0.02 });
    const leafB = material(mixHex(currentMap.terrain, 0x24572c, 0.18), { roughness: 0.78, metalness: 0.02 });
    const trunkH = 0.96 * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, trunkH, 6), trunkMat);
    trunk.position.y = trunkH * 0.5;
    group.add(trunk);

    for (let i = 0; i < 5; i += 1) {
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry((0.46 + (i % 2) * 0.08) * scale, 0), i % 2 ? leafA : leafB);
      crown.position.set(((i % 3) - 1) * 0.22 * scale, trunkH + (0.2 + i * 0.055) * scale, ((i % 2) - 0.5) * 0.22 * scale);
      crown.scale.set(1.08, 0.82, 1);
      group.add(crown);
    }
    return group;
  }

  function makeDinoTree(index, scale = 1) {
    const group = new THREE.Group();
    const trunkMat = material(mixHex(currentMap.ground, 0x3a1c0e, 0.5), { roughness: 0.88, metalness: 0.02 });
    const leafA = material(mixHex(currentMap.terrain, 0xd5dc75, 0.22), { roughness: 0.8, metalness: 0.03 });
    const leafB = material(mixHex(currentMap.terrain, 0x17300d, 0.32), { roughness: 0.83, metalness: 0.03 });
    const trunkH = 1.45 * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, trunkH, 6), trunkMat);
    trunk.position.y = trunkH * 0.5;
    trunk.rotation.z = ((index % 5) - 2) * 0.03;
    group.add(trunk);

    for (let i = 0; i < 9; i += 1) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.04 * scale, 1.18 * scale), i % 2 ? leafA : leafB);
      leaf.position.y = trunkH + 0.08 * scale;
      leaf.rotation.y = (i / 9) * Math.PI * 2;
      leaf.rotation.x = 0.48 + (i % 3) * 0.07;
      leaf.position.x = Math.sin(leaf.rotation.y) * 0.28 * scale;
      leaf.position.z = Math.cos(leaf.rotation.y) * 0.28 * scale;
      group.add(leaf);
    }
    return group;
  }

  function makeMoonwoodTree(index, scale = 1) {
    const group = new THREE.Group();
    const trunkMat = material(mixHex(currentMap.ground, 0x05020a, 0.68), { roughness: 0.82, metalness: 0.04 });
    const leafMat = material(mixHex(currentMap.terrain, index % 2 ? 0x7a5ab4 : 0x263f6c, 0.32), {
      roughness: 0.76,
      metalness: 0.04,
      emissive: currentMap.trim,
      emissiveIntensity: 0.025
    });
    const trunkH = 1.36 * scale;
    for (let i = 0; i < 3; i += 1) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.13 * scale, trunkH * 0.42, 5), trunkMat);
      trunk.position.set(((i % 2) - 0.5) * 0.08 * scale, trunkH * (0.22 + i * 0.23), 0);
      trunk.rotation.z = ((index + i) % 2 ? 0.22 : -0.18);
      group.add(trunk);
    }
    for (let branch = 0; branch < 5; branch += 1) {
      const limb = new THREE.Mesh(new THREE.BoxGeometry(0.09 * scale, 0.08 * scale, 0.78 * scale), trunkMat);
      limb.position.set(((branch % 2) ? 0.32 : -0.32) * scale, trunkH * (0.5 + branch * 0.08), 0);
      limb.rotation.y = branch * 0.7;
      limb.rotation.z = ((branch % 2) ? -0.52 : 0.52);
      group.add(limb);
    }
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46 * scale, 0), leafMat);
    crown.position.set(0.04 * scale, trunkH + 0.18 * scale, 0);
    crown.scale.set(1.18, 0.8, 1.08);
    group.add(crown);
    return group;
  }

  function makeEvergreen(index, scale = 1) {
    if (world === "meadow") return makeMeadowTree(index, scale);
    if (world === "dino") return makeDinoTree(index, scale);
    if (world === "moonwood") return makeMoonwoodTree(index, scale);

    const group = new THREE.Group();
    const trunkMat = material(mixHex(currentMap.ground, 0x26120a, 0.62), { roughness: 0.86, metalness: 0.02 });
    const leafDark = material(mixHex(currentMap.terrain, 0x06120b, 0.48), { roughness: 0.82, metalness: 0.03 });
    const leafLight = material(mixHex(currentMap.terrain, 0xd6e7bd, 0.2), { roughness: 0.78, metalness: 0.03 });
    const trunkH = 1.2 * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, trunkH, 5), trunkMat);
    trunk.position.y = trunkH * 0.5;
    group.add(trunk);

    const tiers = 4;
    for (let i = 0; i < tiers; i += 1) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry((0.68 - i * 0.08) * scale, (0.82 - i * 0.05) * scale, 7),
        i % 2 ? leafDark : leafLight
      );
      cone.position.y = trunkH * 0.5 + i * 0.38 * scale + 0.48 * scale;
      cone.rotation.y = (index + i) * 0.9;
      cone.rotation.z = ((index + i) % 2 ? 0.04 : -0.04);
      group.add(cone);
    }
    group.scale.y = 1.08 + (index % 4) * 0.08;
    return group;
  }

  function makeRockScatter(index) {
    const group = new THREE.Group();
    const rockBase = material(mixHex(currentMap.hazard, currentMap.ground, 0.34), { roughness: 0.94, metalness: 0.04 });
    const rockHi = material(mixHex(currentMap.hazard, 0xffffff, 0.12), { roughness: 0.9, metalness: 0.04 });
    const count = 4 + (index % 4);
    for (let i = 0; i < count; i += 1) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.34 + ((index + i) % 5) * 0.08, 0),
        i % 3 === 0 ? rockHi : rockBase
      );
      rock.scale.set(1.35 + (i % 2) * 0.44, 0.55 + (i % 3) * 0.18, 0.82 + (i % 4) * 0.16);
      rock.position.set((i - count / 2) * 0.42, 0.12 + i * 0.018, (i % 2) * 0.42);
      rock.rotation.set(i * 0.36, index * 0.4 + i, i * 0.12);
      group.add(rock);
    }
    return group;
  }

  function makeMeadowFence(index, side) {
    const group = new THREE.Group();
    const woodMat = material(0xba7b3e, { roughness: 0.82, metalness: 0.02 });
    const hayMat = material(0xd9b64b, { roughness: 0.8, metalness: 0.02 });
    const flowerMats = [
      material(0xffd25f, { roughness: 0.7, metalness: 0.02, emissive: 0x5d3500, emissiveIntensity: 0.04 }),
      material(0xff7fb4, { roughness: 0.7, metalness: 0.02, emissive: 0x5d1230, emissiveIntensity: 0.04 }),
      material(0xb6f574, { roughness: 0.7, metalness: 0.02 })
    ];

    for (let i = 0; i < 4; i += 1) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.14), woodMat);
      post.position.set((i - 1.5) * 0.82, 0.35, 0);
      group.add(post);
    }
    for (const y of [0.32, 0.56]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 0.1), woodMat);
      rail.position.set(0, y, side * 0.02);
      rail.rotation.z = side * 0.04;
      group.add(rail);
    }
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.58, 10), hayMat);
    bale.rotation.z = Math.PI / 2;
    bale.position.set(side * 0.48, 0.2, 0.56);
    group.add(bale);
    for (let i = 0; i < 7; i += 1) {
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07 + (i % 2) * 0.02, 0), flowerMats[(index + i) % flowerMats.length]);
      flower.position.set(-1.15 + i * 0.36, 0.08, 0.58 + (i % 3) * 0.1);
      group.add(flower);
    }
    return group;
  }

  function makeSwampPool(index, side) {
    const group = new THREE.Group();
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 1.08, 0.05, 18),
      basic(mixHex(currentMap.ground, 0x38d0a9, 0.36), {
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    water.scale.set(1.72, 1, 0.62);
    water.position.set(side * 0.12, 0.03, 0.22);
    group.add(water);

    const reedMat = material(mixHex(currentMap.terrain, 0xc3bd62, 0.3), { roughness: 0.82, metalness: 0.02 });
    const padMat = material(mixHex(currentMap.terrain, 0x24390e, 0.22), { roughness: 0.78, metalness: 0.02 });
    for (let i = 0; i < 10; i += 1) {
      const reed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.68 + (i % 3) * 0.12, 0.05), reedMat);
      reed.position.set(-1.1 + i * 0.25, 0.32, -0.32 + (i % 4) * 0.2);
      reed.rotation.z = ((i % 3) - 1) * 0.16;
      group.add(reed);
    }
    for (let i = 0; i < 4; i += 1) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.025, 10), padMat);
      pad.position.set(-0.56 + i * 0.36, 0.07, 0.04 + (i % 2) * 0.28);
      pad.scale.x = 1.42;
      group.add(pad);
    }
    group.add(makeRockScatter(index + 6));
    return group;
  }

  function makeMoonwoodPatch(index, side) {
    const group = new THREE.Group();
    const stemMat = material(0xe1d8c8, { roughness: 0.76, metalness: 0.02 });
    const capMat = material(index % 2 ? 0x9d67d8 : 0x6aa8ff, {
      roughness: 0.52,
      metalness: 0.08,
      emissive: currentMap.trim,
      emissiveIntensity: 0.12
    });
    const glowMat = basic(currentMap.gate, { transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false });

    for (let i = 0; i < 7; i += 1) {
      const size = 0.16 + (i % 3) * 0.05;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.28, size * 0.38, size * 1.7, 7), stemMat);
      stem.position.set(-0.86 + i * 0.28, size * 0.78, 0.1 + (i % 3) * 0.22);
      stem.rotation.z = ((i % 2) ? 0.12 : -0.08);
      group.add(stem);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(size, size * 0.8, 9), capMat);
      cap.position.set(stem.position.x, size * 1.58, stem.position.z);
      group.add(cap);
    }

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.15, 0.09), material(0x2b2237, { roughness: 0.7, metalness: 0.08 }));
    post.position.set(side * 0.84, 0.55, -0.24);
    group.add(post);
    const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), glowMat);
    lantern.position.set(side * 0.84, 1.22, -0.24);
    group.add(lantern);
    const light = new THREE.PointLight(currentMap.gate, 0.7, 4);
    light.position.copy(lantern.position);
    group.add(light);
    return group;
  }

  function makeTreeCluster(index, side) {
    const group = new THREE.Group();
    const count = 4 + (index % 4);
    for (let i = 0; i < count; i += 1) {
      const tree = makeEvergreen(index + i, 0.92 + ((index + i) % 5) * 0.15);
      tree.position.set((i - count / 2) * 0.78 + side * ((i % 2) * 0.5), 0, (i % 2) * 0.78);
      tree.rotation.y = side * 0.22 + i * 0.18;
      group.add(tree);
    }
    const rocks = makeRockScatter(index);
    rocks.position.set(side * -0.25, 0, 0.85);
    group.add(rocks);
    return group;
  }

  function makeRoadsideProp(index, side) {
    const group = new THREE.Group();
    const roll = (index * 2 + (side > 0 ? 1 : 0)) % 7;

    if (world === "meadow") {
      if (roll === 0) {
        group.add(makeTreeCluster(index, side));
      } else if (roll === 1 || roll === 4) {
        group.add(makeMeadowFence(index, side));
      } else if (roll === 2) {
        const nearTree = makeEvergreen(index, 1.42);
        nearTree.position.set(side * 0.22, 0, 0);
        group.add(nearTree);
        const fence = makeMeadowFence(index + 3, side);
        fence.position.set(side * -0.5, 0, 0.9);
        group.add(fence);
      } else if (roll === 3) {
        group.add(makeBillboard(index, side));
      } else {
        group.add(makeRockScatter(index));
        const flowers = makeMeadowFence(index + 5, side);
        flowers.position.set(side * 0.45, 0, 0.72);
        flowers.scale.setScalar(0.74);
        group.add(flowers);
      }
    } else if (world === "dino") {
      if (roll === 0) {
        group.add(makeTreeCluster(index, side));
      } else if (roll === 1 || roll === 4) {
        group.add(makeSwampPool(index, side));
      } else if (roll === 2) {
        const nearTree = makeEvergreen(index, 1.92);
        nearTree.position.set(side * 0.12, 0, 0);
        group.add(nearTree);
        const pool = makeSwampPool(index + 4, side);
        pool.position.set(side * -0.44, 0, 1.0);
        pool.scale.setScalar(0.72);
        group.add(pool);
      } else if (roll === 3) {
        group.add(makeBillboard(index, side));
        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.32, 0.88, 8),
          basic(0xff7a32, { transparent: true, opacity: 0.76, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        flame.position.set(side * 0.42, 0.88, 0.48);
        group.add(flame);
      } else {
        const basalt = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 1.5 + roll * 0.16, 2.5),
          material(mixHex(currentMap.hazard, 0x2b2420, 0.36), { roughness: 0.86, metalness: 0.08 })
        );
        basalt.position.y = 0.75 + roll * 0.07;
        basalt.rotation.y = side * 0.18;
        group.add(basalt);
        group.add(makeRockScatter(index + 8));
      }
    } else if (world === "moonwood") {
      if (roll === 0) {
        group.add(makeTreeCluster(index, side));
      } else if (roll === 1 || roll === 4) {
        group.add(makeMoonwoodPatch(index, side));
      } else if (roll === 2) {
        const nearTree = makeEvergreen(index, 1.82);
        nearTree.position.set(side * 0.12, 0, 0);
        group.add(nearTree);
        const patch = makeMoonwoodPatch(index + 2, side);
        patch.position.set(side * -0.56, 0, 0.92);
        patch.scale.setScalar(0.76);
        group.add(patch);
      } else if (roll === 3) {
        group.add(makeBillboard(index, side));
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.42, 0.035, 8, 20),
          basic(currentMap.gate, { transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        halo.position.set(side * 0.44, 1.84, 0.05);
        halo.rotation.x = Math.PI / 2;
        group.add(halo);
      } else {
        const shard = new THREE.Mesh(
          new THREE.ConeGeometry(0.34, 1.42 + roll * 0.16, 5),
          material(mixHex(currentMap.hazard, currentMap.trim, 0.22), {
            roughness: 0.42,
            metalness: 0.26,
            emissive: currentMap.trim,
            emissiveIntensity: 0.04
          })
        );
        shard.position.y = 0.7 + roll * 0.08;
        shard.rotation.z = side * -0.12;
        group.add(shard);
        group.add(makeRockScatter(index));
      }
    } else {
      if (roll === 0) {
        group.add(makeTreeCluster(index, side));
      } else if (roll === 1) {
        group.add(makeRockScatter(index));
      } else if (roll === 2) {
        const nearTree = makeEvergreen(index, 1.72);
        nearTree.position.set(side * 0.18, 0, 0);
        group.add(nearTree);
        const rocks = makeRockScatter(index + 3);
        rocks.position.set(side * -0.44, 0, 0.9);
        group.add(rocks);
      } else if (roll === 3) {
        group.add(makeBillboard(index, side));
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.08, 0.9),
          basic(currentMap.rail, { transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        cap.position.y = 2.25;
        cap.position.x = side * 0.4;
        group.add(cap);
      } else {
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 1.35 + roll * 0.18, 2.35),
          material(mixHex(currentMap.hazard, currentMap.trackA, 0.22), { roughness: 0.76, metalness: 0.12 })
        );
        wall.position.y = 0.7 + roll * 0.08;
        wall.rotation.y = side * 0.2;
        group.add(wall);
        const lightSlit = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.07, 1.6),
          basic(currentMap.gate, { transparent: true, opacity: 0.58, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        lightSlit.position.y = 1.2 + roll * 0.08;
        lightSlit.rotation.y = side * 0.2;
        group.add(lightSlit);
      }
    }
    group.position.x = side * (8.2 + (index % 4) * 1.35);
    group.rotation.y += side * 0.12;
    group.userData.scrollFactor = 0.16;
    return group;
  }

  function makeTracksideBank(index, side) {
    const group = new THREE.Group();
    const bankBase = world === "dino"
      ? mixHex(currentMap.ground, 0x16361f, 0.32)
      : mixHex(currentMap.terrain, currentMap.ground, 0.35);
    const ridgeBase = world === "dino"
      ? mixHex(currentMap.hazard, 0x1c1510, 0.42)
      : mixHex(currentMap.hazard, currentMap.ground, 0.18);
    const bankMat = material(bankBase, {
      roughness: 0.84,
      metalness: world === "moonwood" ? 0.12 : 0.04,
      emissive: world === "moonwood" ? currentMap.trim : 0x000000,
      emissiveIntensity: world === "moonwood" ? 0.025 : 0
    });
    const ridgeMat = material(ridgeBase, {
      roughness: 0.9,
      metalness: world === "dino" ? 0.1 : 0.03
    });

    const slab = new THREE.Mesh(new THREE.BoxGeometry(5.8 + (index % 3) * 0.62, 0.24, 8.6), bankMat);
    slab.position.set(side * 0.6, 0.04, 0);
    slab.rotation.z = side * -0.07;
    slab.rotation.y = side * (0.04 + (index % 2) * 0.03);
    group.add(slab);

    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.7 + (index % 4) * 0.09, 8.2), ridgeMat);
    ridge.position.set(side * 2.52, 0.28, -0.12);
    ridge.rotation.z = side * -0.18;
    group.add(ridge);

    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.05, 7.6),
      basic(world === "meadow" ? currentMap.rail : currentMap.gate, {
        transparent: true,
        opacity: world === "dino" ? 0.34 : 0.26,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    light.position.set(side * -1.98, 0.22, 0);
    light.userData.pulse = 0.6 + index * 0.19;
    light.userData.baseOpacity = world === "dino" ? 0.34 : 0.26;
    pulseObjects.push(light);
    group.add(light);

    if (world === "dino") {
      const swampWater = new THREE.Mesh(
        new THREE.BoxGeometry(2.7 + (index % 2) * 0.42, 0.035, 7.4),
        basic(mixHex(currentMap.ground, 0x19c39f, 0.46), {
          transparent: true,
          opacity: 0.36,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      swampWater.position.set(side * -0.92, 0.19, 0.14);
      swampWater.rotation.z = side * -0.04;
      swampWater.userData.pulse = 0.3 + index * 0.15;
      swampWater.userData.baseOpacity = 0.36;
      pulseObjects.push(swampWater);
      group.add(swampWater);

      for (let i = 0; i < 5; i += 1) {
        const reed = new THREE.Mesh(
          new THREE.BoxGeometry(0.045, 0.66 + (i % 3) * 0.16, 0.045),
          material(mixHex(currentMap.terrain, 0xd8d46d, 0.22), { roughness: 0.86, metalness: 0.02 })
        );
        reed.position.set(side * (-1.74 + i * 0.32), 0.48, -2.8 + i * 1.34);
        reed.rotation.z = side * (0.16 + i * 0.025);
        group.add(reed);
      }

      const lava = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.04, 5.4),
        basic(0xff7337, { transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      lava.position.set(side * 0.52, 0.2, -0.3);
      lava.rotation.y = side * 0.16;
      lava.userData.pulse = 1.2 + index * 0.23;
      lava.userData.baseOpacity = 0.42;
      pulseObjects.push(lava);
      group.add(lava);
      for (let i = 0; i < 3; i += 1) {
        const steam = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.22 + i * 0.05, 1),
          basic(0xc7bda4, { transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        steam.position.set(side * (0.35 + i * 0.24), 0.54 + i * 0.14, -1.1 + i * 1.9);
        steam.scale.set(1.4, 0.58, 1);
        steam.userData.pulse = 0.8 + index * 0.17 + i;
        steam.userData.baseOpacity = 0.2;
        pulseObjects.push(steam);
        group.add(steam);
      }
    } else if (world === "moonwood") {
      for (let i = 0; i < 4; i += 1) {
        const crystal = new THREE.Mesh(
          new THREE.ConeGeometry(0.12 + i * 0.025, 0.58 + i * 0.12, 5),
          material(mixHex(currentMap.trim, 0xffffff, 0.16), {
            roughness: 0.28,
            metalness: 0.26,
            emissive: currentMap.trim,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.82
          })
        );
        crystal.position.set(side * (0.2 + i * 0.42), 0.38 + i * 0.04, -2.8 + i * 1.6);
        crystal.rotation.z = side * (0.08 + i * 0.04);
        crystal.userData.pulse = 0.7 + index * 0.13 + i;
        crystal.userData.baseOpacity = 0.82;
        pulseObjects.push(crystal);
        group.add(crystal);
      }
    } else {
      for (let i = 0; i < 5; i += 1) {
        const grass = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.52 + (i % 3) * 0.13, 0.05),
          material(mixHex(currentMap.terrain, 0xf1ef92, 0.24), { roughness: 0.78, metalness: 0.02 })
        );
        grass.position.set(side * (-1.0 + i * 0.46), 0.36, -3.2 + i * 1.34);
        grass.rotation.z = side * (0.12 + i * 0.04);
        group.add(grass);
      }
    }

    group.position.x = side * 8.1;
    group.rotation.y = side * 0.08;
    group.userData.scrollFactor = 0.16;
    return group;
  }

  function makeAtmosphereParticle(index, texture) {
    const color = world === "dino"
      ? 0xffb36a
      : world === "moonwood"
        ? currentMap.trim
        : 0xeaffb9;
    const material = new THREE.SpriteMaterial({
      map: texture,
      color,
      transparent: true,
      opacity: world === "moonwood" ? 0.34 : 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true
    });
    const sprite = new THREE.Sprite(material);
    const side = index % 2 === 0 ? -1 : 1;
    const spread = 13 + (index % 7) * 4.6;
    sprite.position.set(side * spread, 2.6 + (index % 9) * 0.82, -12 - index * 4.4);
    const scale = 0.42 + (index % 5) * 0.16;
    sprite.scale.set(scale, scale, 1);
    sprite.userData.baseX = sprite.position.x;
    sprite.userData.baseY = sprite.position.y;
    sprite.userData.baseOpacity = material.opacity;
    sprite.userData.scrollFactor = 0.08 + (index % 4) * 0.018;
    sprite.userData.float = 0.6 + index * 0.21;
    pulseObjects.push(sprite);
    return sprite;
  }

  function makeWorldMonument() {
    const group = new THREE.Group();

    if (world === "dino") {
      group.position.set(20, 0, -98);
      const basalt = material(mixHex(currentMap.hazard, 0x1a140f, 0.42), {
        roughness: 0.92,
        metalness: 0.08,
        emissive: 0x22100a,
        emissiveIntensity: 0.04
      });
      const lavaMat = basic(0xff6a34, {
        transparent: true,
        opacity: 0.76,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const cone = new THREE.Mesh(new THREE.ConeGeometry(9.4, 23, 9, 1, false), basalt);
      cone.position.y = 11.5;
      cone.scale.set(1.08, 1, 0.72);
      cone.rotation.z = -0.05;
      group.add(cone);

      const shoulder = new THREE.Mesh(
        new THREE.ConeGeometry(7.2, 12, 8, 1, false),
        material(mixHex(currentMap.hazard, currentMap.ground, 0.18), { roughness: 0.9, metalness: 0.05 })
      );
      shoulder.position.set(-5.8, 5.8, 1.2);
      shoulder.scale.set(1.2, 0.7, 0.82);
      shoulder.rotation.z = 0.12;
      group.add(shoulder);

      const crater = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 3.05, 0.45, 12), material(0x18100c, {
        roughness: 0.82,
        metalness: 0.08,
        emissive: 0xff4b25,
        emissiveIntensity: 0.18
      }));
      crater.position.set(0.12, 22.0, 0.1);
      crater.scale.z = 0.72;
      group.add(crater);

      for (let i = 0; i < 5; i += 1) {
        const stream = new THREE.Mesh(new THREE.BoxGeometry(0.22 + i * 0.05, 8.8 - i * 0.7, 0.12), lavaMat);
        stream.position.set(-2.8 + i * 1.35, 15.5 - i * 1.18, 4.0 - i * 0.28);
        stream.rotation.z = -0.28 + i * 0.11;
        stream.userData.pulse = 1.1 + i * 0.42;
        stream.userData.baseOpacity = 0.76;
        pulseObjects.push(stream);
        group.add(stream);
      }

      for (let i = 0; i < 10; i += 1) {
        const puff = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.4 + (i % 4) * 0.34, 1),
          basic(0x51483f, { transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        puff.position.set(-3.5 + i * 0.9, 24.2 + (i % 5) * 0.78, -0.5 - i * 0.42);
        puff.scale.set(1.7, 0.62, 0.85);
        puff.userData.pulse = 0.7 + i * 0.3;
        puff.userData.baseOpacity = 0.22;
        pulseObjects.push(puff);
        group.add(puff);
      }

      const glow = new THREE.PointLight(0xff6d32, 2.6, 48);
      glow.position.set(0, 17, 4.5);
      group.add(glow);
    } else if (world === "moonwood") {
      group.position.set(-20, 0, -86);
      const bark = material(mixHex(currentMap.ground, 0x06030b, 0.72), {
        roughness: 0.82,
        metalness: 0.04,
        emissive: currentMap.trim,
        emissiveIntensity: 0.025
      });
      const glowMat = basic(currentMap.trim, {
        transparent: true,
        opacity: 0.54,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      for (let i = 0; i < 5; i += 1) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55 - i * 0.04, 0.88 - i * 0.06, 8.2, 6), bark);
        trunk.position.set(i * 1.12, 3.8 + i * 1.65, i * 0.2);
        trunk.rotation.z = -0.35 + i * 0.14;
        trunk.rotation.x = 0.08;
        group.add(trunk);
      }

      for (let i = 0; i < 7; i += 1) {
        const branch = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.42, 7.8 - i * 0.5), bark);
        branch.position.set(-2.8 + i * 1.05, 8.2 + (i % 3) * 1.08, -0.7);
        branch.rotation.y = -0.35 + i * 0.18;
        branch.rotation.z = i % 2 ? -0.62 : 0.54;
        group.add(branch);
      }

      for (let i = 0; i < 8; i += 1) {
        const crystal = new THREE.Mesh(
          new THREE.ConeGeometry(0.52 + (i % 3) * 0.16, 2.8 + (i % 4) * 0.5, 5),
          material(mixHex(currentMap.trim, 0xffffff, 0.18), {
            roughness: 0.25,
            metalness: 0.22,
            emissive: currentMap.trim,
            emissiveIntensity: 0.28,
            transparent: true,
            opacity: 0.86
          })
        );
        crystal.position.set(-6 + i * 1.6, 1.25 + (i % 3) * 0.26, 2.6 + (i % 2) * 0.7);
        crystal.rotation.z = -0.2 + i * 0.05;
        crystal.userData.pulse = 0.5 + i * 0.22;
        crystal.userData.baseOpacity = 0.86;
        pulseObjects.push(crystal);
        group.add(crystal);
      }

      const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.06, 8, 48), glowMat);
      ring.position.set(2.2, 12.6, -1.3);
      ring.rotation.y = Math.PI / 2.5;
      ring.userData.pulse = 1.8;
      ring.userData.baseOpacity = 0.54;
      pulseObjects.push(ring);
      group.add(ring);
    } else {
      group.position.set(-21, 0, -88);
      const wood = material(0x8a5a34, { roughness: 0.78, metalness: 0.03 });
      const cream = material(0xf7e5a8, { roughness: 0.65, metalness: 0.02 });
      const roof = material(mixHex(currentMap.hazard, 0x6b3b2c, 0.26), { roughness: 0.72, metalness: 0.04 });
      const sail = basic(0xf8f4da, { transparent: true, opacity: 0.74 });

      const tower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 8.8, 1.8), cream);
      tower.position.y = 4.4;
      tower.rotation.z = -0.05;
      group.add(tower);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.8, 4), roof);
      cap.position.y = 9.55;
      cap.rotation.y = Math.PI / 4;
      group.add(cap);

      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.6, 10), wood);
      axle.rotation.x = Math.PI / 2;
      axle.position.set(0, 7.6, 1.05);
      group.add(axle);

      for (let i = 0; i < 4; i += 1) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.36, 4.2, 0.06), sail);
        blade.position.set(0, 7.6, 1.42);
        blade.rotation.z = Math.PI / 4 + i * (Math.PI / 2);
        group.add(blade);
      }

      for (let i = 0; i < 5; i += 1) {
        const hay = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55 + (i % 2) * 0.12, 0.55 + (i % 2) * 0.12, 1.0, 10),
          material(0xdfbe55, { roughness: 0.85, metalness: 0.02 })
        );
        hay.rotation.z = Math.PI / 2;
        hay.position.set(4.1 + i * 0.95, 0.55, 1.3 + (i % 2) * 0.38);
        group.add(hay);
      }
    }

    return group;
  }

  function makeBackdropPlane(texture, widthValue, heightValue, x, y, z, opacity = 1) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(widthValue, heightValue),
      basic(0xffffff, {
        map: texture,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false
      })
    );
    plane.position.set(x, y, z);
    plane.renderOrder = -5;
    return plane;
  }

  function resetSceneForMap() {
    for (const obj of gateObjects) {
      gateGroup.remove(obj.mesh);
      disposeObject(obj.mesh);
    }
    gateObjects = [];

    while (trackGroup.children.length) {
      const child = trackGroup.children.pop();
      disposeObject(child);
    }
    while (railGroup.children.length) {
      const child = railGroup.children.pop();
      disposeObject(child);
    }
    while (sceneryGroup.children.length) {
      const child = sceneryGroup.children.pop();
      disposeObject(child);
    }
    while (burstGroup.children.length) {
      const child = burstGroup.children.pop();
      disposeObject(child);
    }
    burstParticles = [];
    pulseObjects = [];

    scene.background = new THREE.Color(mixHex(currentMap.sky, 0x0b1020, world === "moonwood" ? 0.3 : world === "dino" ? 0.14 : 0.08));
    scene.fog = new THREE.FogExp2(currentMap.fog, world === "dino" ? 0.0094 : world === "moonwood" ? 0.0115 : 0.009);
    ambient.color.setHex(currentMap.ambient);
    ambient.intensity = world === "moonwood" ? 0.42 : world === "dino" ? 0.46 : 0.52;
    keyLight.color.setHex(currentMap.sun);
    keyLight.intensity = world === "dino" ? 1.72 : 1.42;
    fillLight.color.setHex(currentMap.ambient);
    fillLight.intensity = world === "moonwood" ? 0.5 : 0.42;

    const mountainBack = makeBackdropPlane(makeMountainTexture(0), 190, 66, 0, 18, -146, 0.96);
    sceneryGroup.add(mountainBack);
    const mountainFront = makeBackdropPlane(makeMountainTexture(1), 210, 48, 0, 10, -116, 0.86);
    sceneryGroup.add(mountainFront);
    const horizonGlow = makeBackdropPlane(makeHorizonGlowTexture(), 180, 40, 0, 11.4, -112, world === "moonwood" ? 0.66 : 0.78);
    sceneryGroup.add(horizonGlow);
    const clouds = makeBackdropPlane(makeCloudTexture(), 165, 38, 3, 20, -102, 0.7);
    sceneryGroup.add(clouds);
    const forestFar = makeBackdropPlane(makeForestTexture(1), 168, 34, 0, 7.2, -90, 0.74);
    sceneryGroup.add(forestFar);
    const forestLeft = makeBackdropPlane(makeForestTexture(0), 72, 31, -43, 6.4, -62, 0.84);
    forestLeft.rotation.y = Math.PI * 0.09;
    sceneryGroup.add(forestLeft);
    const forestRight = makeBackdropPlane(makeForestTexture(0), 72, 31, 43, 6.4, -62, 0.84);
    forestRight.rotation.y = -Math.PI * 0.09;
    sceneryGroup.add(forestRight);

    const monument = makeWorldMonument();
    sceneryGroup.add(monument);

    const groundGeo = new THREE.PlaneGeometry(170, 260, 24, 30);
    const groundPositions = groundGeo.attributes.position;
    for (let i = 0; i < groundPositions.count; i += 1) {
      const x = groundPositions.getX(i);
      const y = groundPositions.getY(i);
      const distanceFromTrack = Math.max(0, Math.abs(x) - TRACK_WIDTH * 0.65);
      const ridge = Math.sin(i * 1.7 + levelIdx) * 0.16 + Math.cos(y * 0.09 + x * 0.03) * 0.2;
      groundPositions.setZ(i, distanceFromTrack > 0 ? ridge * Math.min(1.7, distanceFromTrack / 12) : -0.06);
    }
    groundGeo.computeVertexNormals();
    const groundTexture = makeGroundTexture();
    const ground = new THREE.Mesh(
      groundGeo,
      material(mixHex(currentMap.ground, 0x000000, 0.08), {
        roughness: 0.82,
        metalness: world === "moonwood" ? 0.08 : 0.03,
        map: groundTexture
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.08, -70);
    sceneryGroup.add(ground);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(9, 16, 16),
      basic(currentMap.sun, { transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    sun.position.set(-24, 21, -92);
    sceneryGroup.add(sun);

    const particleTexture = makeParticleTexture();
    for (let i = 0; i < 64; i += 1) {
      const particle = makeAtmosphereParticle(i, particleTexture);
      sceneryGroup.add(particle);
    }

    for (let i = 0; i < 10; i += 1) {
      const gantry = makeTrackGantry(i);
      gantry.position.set(0, 0.02, -34 - i * 27);
      sceneryGroup.add(gantry);
    }

    for (let i = 0; i < 30; i += 1) {
      for (const side of [-1, 1]) {
        const bank = makeTracksideBank(i, side);
        bank.position.z = -10 - i * 8.1;
        sceneryGroup.add(bank);
      }
    }

    for (let i = 0; i < 58; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const prop = makeRoadsideProp(i, side);
      prop.position.z = -9 - i * 4.7;
      sceneryGroup.add(prop);
    }

    trackSegments = [];
    roadTexture = makeTrackTexture();
    for (let i = 0; i < TRACK_SEGMENTS; i += 1) {
      const seg = makeTrackSegment(i, roadTexture);
      seg.position.y = 0;
      trackGroup.add(seg);
      trackSegments.push(seg);
    }

    railSegments = [];
    const railXs = [-TRACK_WIDTH / 2, -TRACK_WIDTH / 6, TRACK_WIDTH / 6, TRACK_WIDTH / 2];
    for (let i = 0; i < TRACK_SEGMENTS; i += 1) {
      for (const x of railXs) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(x === railXs[0] || x === railXs[railXs.length - 1] ? 0.18 : 0.08, 0.08, TRACK_SEGMENT_LENGTH * 0.82),
          basic(currentMap.rail, { transparent: true, opacity: x === railXs[0] || x === railXs[railXs.length - 1] ? 0.68 : 0.38 })
        );
        rail.position.x = x;
        rail.position.y = 0.18;
        rail.userData.segmentIx = i;
        railGroup.add(rail);
        railSegments.push(rail);
      }
    }

    if (ship) {
      scene.remove(ship);
      disposeObject(ship);
    }
    ship = makeShip();
    scene.add(ship);
  }

  function showBanner(text) {
    const b = el("banner");
    if (!b) return;
    b.textContent = text;
    b.style.opacity = "1";
    b.style.transform = "translateX(0)";
    bannerT = 1.5;
  }

  function showCountdown(target) {
    const cd = el("countdown");
    if (!cd) return;
    const prompt = countdownPrompt(target, difficulty);
    const letter = String(target || "").toUpperCase();
    const accent = "#" + currentMap.gate.toString(16).padStart(6, "0");
    cd.innerHTML =
      '<div style="width:min(88vw,720px);display:grid;justify-items:center;gap:18px;padding:30px 18px;color:#f8fbff;text-shadow:0 4px 20px rgba(0,0,0,.72)">' +
        '<div style="font-size:.85rem;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.78)">Sound Racer</div>' +
        `<div style="font-size:clamp(2.15rem,8vw,5.35rem);line-height:.92;font-weight:950;letter-spacing:.01em;text-transform:uppercase;max-width:680px;text-wrap:balance">${prompt}</div>` +
        `<div style="width:min(38vw,172px);height:min(38vw,172px);display:grid;place-items:center;font-size:clamp(4.5rem,18vw,7.4rem);font-weight:950;color:#071033;background:#ffd34e;border:4px solid rgba(255,255,255,.72);box-shadow:inset 0 -12px 0 rgba(0,0,0,.26),0 18px 48px rgba(0,0,0,.42);clip-path:polygon(8% 0,100% 0,92% 100%,0 100%)">${letter}</div>` +
        `<div style="width:min(72vw,420px);height:8px;background:rgba(255,255,255,.15);box-shadow:0 0 26px ${accent};overflow:hidden"><i style="display:block;width:100%;height:100%;background:${accent}"></i></div>` +
        '<div data-sr="cd-num" style="font-size:clamp(4.2rem,17vw,9rem);line-height:.82;font-weight:950;font-variant-numeric:tabular-nums;color:#ffffff;text-shadow:0 0 20px rgba(255,211,78,.7),0 5px 24px rgba(0,0,0,.9)">3</div>' +
      '</div>';
    cd.style.display = "grid";
  }

  function hideCountdown() {
    const cd = el("countdown");
    if (cd) cd.style.display = "none";
  }

  function updateCountdown() {
    const cd = el("countdown");
    const num = cd?.querySelector('[data-sr="cd-num"]');
    if (!num) return;
    let label = "GO!";
    if (countdownT > 2.6) label = "3";
    else if (countdownT > 1.6) label = "2";
    else if (countdownT > 0.6) label = "1";
    num.textContent = label;
    num.style.letterSpacing = label === "GO!" ? ".08em" : "0";
  }

  function getBest(index) {
    try {
      const data = localStorage.getItem(bestKey(index));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function setBest(index, data) {
    try {
      localStorage.setItem(bestKey(index), JSON.stringify(data));
    } catch {
      /* storage is optional */
    }
  }

  function startLevel() {
    currentMap = mapForLevel(world, levelIdx);
    resetSceneForMap();
    const target = ladder[levelIdx % ladder.length];
    track = buildTrack(target, { difficulty, seed: levelIdx });
    gateObjects = track.gates.map(makeGateObject);
    playerZ = -4;
    laneIx = 1;
    speed = difficulty === "hard" || difficulty === "high" ? 6.8 : difficulty === "medium" || difficulty === "mid" ? 6.1 : 5.4;
    timeMs = 0;
    wordsCorrect = 0;
    wordsWrong = 0;
    missedCorrect = 0;
    obstaclesHit = 0;
    shield = 3;
    boostT = 0;
    dragT = 0;
    shakeT = 0;
    catchUpSerial = 0;
    caughtCorrectWords.clear();
    countdownT = 3.8;
    running = false;
    hideOverlay();
    showCountdown(target);
    // Speak the target sound at countdown (single letters get the pure phoneme
    // clip; digraphs get an example word from the track, since speakPhoneme
    // only handles one letter).
    if (/^[a-z]$/.test(target)) {
      sfx(() => speakPhoneme(target));
    } else {
      const example = track.gates.find(gate => gate.correct)?.word;
      if (example) sfx(() => speakWord(example));
    }
    showBanner(`Track ${levelIdx + 1} — ${currentMap.name}`);

    el("target").textContent = target;
    el("mission").textContent = instructionFor(difficulty);
    el("map").textContent = currentMap.name;
    updateHud();

    opts.onCheckpoint?.(levelIdx, levelCount);
    opts.onProgressUpdate?.(levelIdx, levelCount);
  }

  function hideOverlay() {
    const overlay = el("overlay");
    if (overlay) overlay.style.display = "none";
  }

  function showOverlay(html) {
    const overlay = el("overlay");
    overlay.innerHTML = html;
    overlay.style.display = "grid";
    return overlay;
  }

  function addScore(points) {
    score = Math.max(0, score + points);
    opts.onScoreUpdate?.(score);
  }

  function updateHud() {
    if (!track) return;
    const timerEl = el("timer");
    const wordsEl = el("words");
    const shieldEl = el("shield");
    const speedEl = el("speed");
    if (timerEl) timerEl.textContent = formatTime(timeMs);
    if (wordsEl) wordsEl.textContent = `${wordsCorrect} / ${track.needed} words`;
    if (shieldEl) shieldEl.textContent = "◆".repeat(Math.max(0, shield)) + "◇".repeat(Math.max(0, 3 - shield));
    if (speedEl) {
      const maxSpeed = 11.2;
      speedEl.style.background = "#" + currentMap.gate.toString(16).padStart(6, "0");
      speedEl.style.width = `${Math.min(100, Math.max(0, (speed / maxSpeed) * 100))}%`;
    }
  }

  function addBurst(x, y, z, color, count = 16) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.08 + Math.random() * 0.12, 0),
        basic(color, { transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      mesh.position.set(x, y, z);
      burstGroup.add(mesh);
      burstParticles.push({
        mesh,
        life: 0.6,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4,
        vz: (Math.random() - 0.3) * 6,
        spin: Math.random() * 6
      });
    }
  }

  function queueCatchUp(word, tries = 0) {
    if (!track || !word) return;
    catchUpSerial += 1;
    const z = Math.max(track.totalLength + 18, playerZ + 28 + (catchUpSerial % 3) * 9);
    // Always a random lane: placing repeat words in the player's current lane
    // after two misses made the game catch the word by itself.
    const lane = Math.floor(Math.random() * LANES.length);
    const gate = { kind: "word", word, correct: true, lane, z, catchup: true, tries };
    track.totalLength = Math.max(track.totalLength, z + 36);
    gateObjects.push(makeGateObject(gate));
  }

  function hurtShip(kind) {
    dragT = kind === "obstacle" ? 1.45 : 1.0;
    shakeT = kind === "obstacle" ? 0.48 : 0.32;
    shield -= 1;
    sfx(playSoftBuzz);
    if (shield <= 0) {
      shield = 3;
      dragT = 2.2;
      showBanner("Stabilizers reset");
    }
  }

  function resolveGate(obj) {
    obj.resolved = true;
    const hit = obj.lane === laneIx;
    if (obj.correct && hit) {
      if (!caughtCorrectWords.has(obj.word)) {
        caughtCorrectWords.add(obj.word);
        wordsCorrect += 1;
        boostT = 1.25;
        addScore(100 + Math.max(0, shield - 1) * 15);
        sfx(playCorrectChime);
        sfx(playWhoosh);
        sfx(() => speakWord(obj.word));
        addBurst(LANES[obj.lane], 1.1, CATCH_Z, currentMap.gate, 20);
      }
    } else if (obj.kind === "obstacle" && hit) {
      obstaclesHit += 1;
      hurtShip("obstacle");
      addBurst(LANES[obj.lane], 0.9, CATCH_Z, 0xff7a66, 14);
    } else if (hit && obj.kind === "word" && !obj.correct) {
      wordsWrong += 1;
      hurtShip("wrong");
      // Name the word's real onset so a wrong catch teaches something.
      const onset = onsetGrapheme(obj.word);
      if (onset) showBanner(`${obj.word} starts with ${String(onset).toUpperCase()}`);
      addBurst(LANES[obj.lane], 1.1, CATCH_Z, 0xff7a66, 12);
    } else if (obj.correct && !hit) {
      missedCorrect += 1;
      queueCatchUp(obj.word, (obj.tries || 0) + 1);
      sfx(playWhoosh);
    }

    if (obj.mesh.userData.sprite) obj.mesh.userData.sprite.material.opacity = 0;
    obj.mesh.visible = false;
    updateHud();
  }

  function levelResult() {
    const mistakes = wordsWrong + missedCorrect + obstaclesHit;
    const total = wordsCorrect + mistakes;
    const stars = starRubric({ correct: wordsCorrect, total, mistakes, deaths: 0 });
    const accuracy = total > 0 ? Math.round((wordsCorrect / total) * 100) : 0;
    return { correct: wordsCorrect, total, mistakes, stars, accuracy, score, timeMs };
  }

  function completeLevel() {
    running = false;
    const result = levelResult();
    levelResults[levelIdx] = result;
    const best = getBest(levelIdx);
    const newBestTime = !best || result.timeMs < best.bestTimeMs;
    const newBestStars = !best || result.stars > best.stars;
    const isNewBest = newBestTime || newBestStars;
    // Time and stars are stored independently: beating one must never
    // overwrite (regress) the other.
    if (isNewBest) {
      setBest(levelIdx, {
        bestTimeMs: newBestTime ? result.timeMs : best.bestTimeMs,
        stars: newBestStars ? result.stars : best.stars,
        accuracy: Math.max(best?.accuracy || 0, result.accuracy)
      });
    }
    opts.onProgressUpdate?.(levelIdx + 1, levelCount);
    sfx(playStarChime);

    if (levelIdx >= levelCount - 1) {
      finishRun();
      return;
    }

    const overlay = showOverlay(
      '<div style="display:grid;gap:14px;justify-items:center;padding:24px">' +
        `<div style="font-size:2rem;font-weight:900">Track cleared</div>` +
        (isNewBest ? '<div style="font-size:1rem;font-weight:900;color:#071033;background:#ffd34e;padding:6px 18px">New best split</div>' : "") +
        `<div style="font-size:1.08rem;line-height:1.9;text-align:left;min-width:230px">Time <b>${formatTime(result.timeMs)}</b><br>Words <b>${result.correct} / ${track.needed}</b><br>Accuracy <b>${result.accuracy}%</b><br>Stars <b>${"★".repeat(result.stars)}${"✩".repeat(3 - result.stars)}</b></div>` +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">' +
          '<button data-sr="retry" style="font-family:inherit;font-weight:900;font-size:1.05rem;color:#f8fbff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.26);padding:13px 22px;cursor:pointer">Retry track</button>' +
          '<button data-sr="next" style="font-family:inherit;font-weight:900;font-size:1.05rem;color:#071033;background:#ffd34e;border:0;padding:13px 24px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22);cursor:pointer">Next map</button>' +
        '</div></div>'
    );
    overlay.querySelector('[data-sr="retry"]').addEventListener("click", () => {
      sfx(playTapSound);
      // Restore the score snapshot taken when this track started so retrying
      // a track cannot farm points on top of the previous attempt.
      score = levelStartScore;
      opts.onScoreUpdate?.(score);
      startLevel();
    });
    overlay.querySelector('[data-sr="next"]').addEventListener("click", () => {
      sfx(playTapSound);
      levelIdx += 1;
      levelStartScore = score;
      startLevel();
    });
  }

  function finishRun() {
    const results = levelResults.filter(Boolean);
    const correct = results.reduce((sum, item) => sum + item.correct, 0);
    const total = results.reduce((sum, item) => sum + item.total, 0);
    const mistakes = results.reduce((sum, item) => sum + item.mistakes, 0);
    const stars = starRubric({ correct, total, mistakes, deaths: 0 });
    sfx(playCelebrationFanfare);
    opts.onProgressUpdate?.(levelCount, levelCount);
    const overlay = showOverlay(
      '<div style="display:grid;gap:14px;justify-items:center;padding:24px">' +
        '<div style="font-size:2.05rem;font-weight:900">Cup complete</div>' +
        `<div style="font-size:2.45rem;letter-spacing:8px">${"★".repeat(stars)}${"✩".repeat(3 - stars)}</div>` +
        `<div style="font-size:1.1rem;opacity:.92">Score <b>${score}</b> · Words <b>${correct}</b></div>` +
        '<button data-sr="done" style="font-family:inherit;font-weight:900;font-size:1.1rem;color:#071033;background:#ffd34e;border:0;padding:13px 30px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22);cursor:pointer">Done</button>' +
      '</div>'
    );
    overlay.querySelector('[data-sr="done"]').addEventListener("click", () => {
      opts.onComplete?.(stars, score, correct);
    });
  }

  function moveLane(dir) {
    if (!running) return;
    const next = Math.max(0, Math.min(2, laneIx + dir));
    if (next !== laneIx) {
      laneIx = next;
      sfx(playTapSound);
    }
  }

  const onLeft = () => moveLane(-1);
  const onRight = () => moveLane(1);
  // Keyboard activation (Enter/Space) fires click with detail 0; pointer taps
  // already steered on pointerdown, so only detail 0 clicks may steer here.
  const onLeftClick = event => { if (event.detail === 0) onLeft(); };
  const onRightClick = event => { if (event.detail === 0) onRight(); };
  el("left").addEventListener("pointerdown", onLeft);
  el("right").addEventListener("pointerdown", onRight);
  el("left").addEventListener("click", onLeftClick);
  el("right").addEventListener("click", onRightClick);

  const onKey = event => {
    if (event.key === "ArrowLeft" || event.key === "a") moveLane(-1);
    if (event.key === "ArrowRight" || event.key === "d") moveLane(1);
  };
  window.addEventListener("keydown", onKey);

  let dragX = null;
  const onPointerDown = event => { dragX = event.clientX; };
  const onPointerUp = event => {
    if (dragX == null) return;
    const dx = event.clientX - dragX;
    if (Math.abs(dx) > 40) moveLane(dx > 0 ? 1 : -1);
    dragX = null;
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);

  const onResize = () => {
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
    renderer.setSize(width(), height());
    layoutHud();
  };
  window.addEventListener("resize", onResize);
  const ro = new ResizeObserver(onResize);
  ro.observe(mount);

  function updateTrackVisuals() {
    const travel = ((playerZ * TRACK_UNIT) % TRACK_SEGMENT_LENGTH + TRACK_SEGMENT_LENGTH) % TRACK_SEGMENT_LENGTH;
    if (roadTexture) roadTexture.offset.y = (playerZ * 0.012 + elapsed * 0.045) % 1;
    for (let i = 0; i < trackSegments.length; i += 1) {
      trackSegments[i].position.z = CATCH_Z + travel - i * TRACK_SEGMENT_LENGTH;
    }
    for (let i = 0; i < railSegments.length; i += 1) {
      const segmentIx = railSegments[i].userData.segmentIx ?? Math.floor(i / 4);
      railSegments[i].position.z = CATCH_Z + travel - segmentIx * TRACK_SEGMENT_LENGTH;
      railSegments[i].material.opacity = 0.34 + Math.abs(Math.sin(elapsed * 2 + segmentIx * 0.3)) * 0.3;
    }
    for (const prop of sceneryGroup.children) {
      const scrollFactor = prop.userData?.scrollFactor;
      if (!scrollFactor) continue;
      prop.position.z += speed * TRACK_UNIT * scrollFactor;
      if (prop.position.z > SCENERY_RESET_Z) prop.position.z = SCENERY_WRAP_Z - Math.random() * 28;
    }
  }

  function updateAtmosphere(now) {
    const t = now * 0.001;
    for (const obj of pulseObjects) {
      const phase = obj.userData.float ?? obj.userData.pulse ?? 0;
      const baseOpacity = obj.userData.baseOpacity ?? obj.material?.opacity ?? 0.5;
      const breath = 0.72 + Math.sin(t * 1.7 + phase) * 0.18 + Math.cos(t * 0.73 + phase * 0.7) * 0.08;
      if (obj.isSprite) {
        obj.position.x = obj.userData.baseX + Math.sin(t * 0.76 + phase) * 0.34;
        obj.position.y = obj.userData.baseY + Math.cos(t * 0.9 + phase) * 0.28;
        obj.material.opacity = Math.max(0.04, baseOpacity * breath);
      } else if (obj.material && obj.material.transparent) {
        obj.material.opacity = Math.max(0.05, baseOpacity * breath);
      }
    }
  }

  function updateGates(dt) {
    if (!track) return;
    for (const obj of gateObjects) {
      if (obj.resolved) continue;
      const distance = obj.z - playerZ;
      if (distance < -3 || distance > VIEW_DISTANCE) {
        obj.mesh.visible = false;
      } else {
        const z = CATCH_Z - distance * TRACK_UNIT;
        const t = Math.max(0, 1 - distance / VIEW_DISTANCE);
        obj.mesh.visible = true;
        obj.mesh.position.set(LANES[obj.lane], 0.78 + t * 0.34, z);
        const scale = 0.55 + t * 0.72;
        obj.mesh.scale.setScalar(scale);
        obj.mesh.rotation.y += dt * obj.mesh.userData.spin;
        if (obj.kind === "obstacle") obj.mesh.rotation.x += dt * 0.8;
      }
      if (obj.catchup && obj.tries >= 2 && !obj.hintShown && distance > 0 && distance <= VIEW_DISTANCE) {
        // After two misses the word stays in a random lane, but the player
        // gets a lane callout instead of the word landing in their lap.
        obj.hintShown = true;
        showBanner(`${obj.word} — ${LANE_NAMES[obj.lane]} lane!`);
        sfx(() => speakWord(obj.word));
      }
      if (distance <= CATCH_WINDOW) resolveGate(obj);
    }
    const hasPendingCorrect = gateObjects.some(obj => obj.correct && !obj.resolved);
    if (playerZ >= track.totalLength - 2 && wordsCorrect < track.needed && !hasPendingCorrect) {
      const missed = gateObjects.find(obj => obj.correct && obj.resolved && !caughtCorrectWords.has(obj.word))?.word;
      queueCatchUp(missed || track.gates.find(gate => gate.correct)?.word, 2);
    }
    if (playerZ >= track.totalLength && wordsCorrect >= track.needed) completeLevel();
  }

  function updateShip(dt, now) {
    if (!ship) return;
    const targetX = LANES[laneIx];
    ship.position.x += (targetX - ship.position.x) * Math.min(1, dt * 10);
    ship.rotation.z = (targetX - ship.position.x) * -0.22;
    ship.rotation.x = Math.sin(now * 0.004) * 0.045;
    ship.position.y = 1.03 + Math.sin(now * 0.006) * 0.045;
    const boostScale = boostT > 0 ? 1.55 : 1;
    if (ship.userData.engines) {
      for (const engine of ship.userData.engines) {
        engine.scale.set(1, (0.76 + Math.random() * 0.38) * boostScale, 1);
        engine.material.opacity = 0.58 + Math.random() * 0.3;
      }
    }
    if (ship.userData.light) ship.userData.light.intensity = 1.0 + Math.random() * 0.8 * boostScale;
  }

  function updateBursts(dt) {
    for (const p of burstParticles) {
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += p.spin * dt;
      p.mesh.rotation.y += p.spin * dt;
      p.mesh.material.opacity = Math.max(0, p.life / 0.6);
    }
    for (let i = burstParticles.length - 1; i >= 0; i -= 1) {
      if (burstParticles[i].life <= 0) {
        const mesh = burstParticles[i].mesh;
        burstGroup.remove(mesh);
        disposeObject(mesh);
        burstParticles.splice(i, 1);
      }
    }
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, ((now - last) || 16) / 1000);
    last = now;
    if (paused) {
      renderer.render(scene, camera);
      return;
    }

    elapsed += dt;
    if (countdownT > 0) {
      countdownT -= dt;
      updateCountdown();
      if (countdownT <= 0) {
        running = true;
        hideCountdown();
      }
    }

    if (bannerT > 0) {
      bannerT -= dt;
      if (bannerT <= 0) {
        const b = el("banner");
        if (b) {
          b.style.opacity = "0";
          b.style.transform = "translateX(-36px)";
        }
      }
    }

    if (running && track) {
      timeMs += dt * 1000;
      const base = difficulty === "hard" || difficulty === "high" ? 6.8 : difficulty === "medium" || difficulty === "mid" ? 6.1 : 5.4;
      const boost = boostT > 0 ? 2.4 : 0;
      const drag = dragT > 0 ? 2.0 : 0;
      speed = Math.max(3.2, base + boost + wordsCorrect * 0.07 - drag);
      boostT = Math.max(0, boostT - dt);
      dragT = Math.max(0, dragT - dt);
      shakeT = Math.max(0, shakeT - dt);
      playerZ += speed * dt;
      updateGates(dt);
      updateHud();
    }

    updateTrackVisuals();
    updateAtmosphere(now);
    updateShip(dt, now);
    updateBursts(dt);

    const wantedFov = boostT > 0 && !reduceMotion ? 73 : cameraBaseFov;
    if (Math.abs(fov - wantedFov) > 0.1) {
      fov += (wantedFov - fov) * Math.min(1, dt * 5);
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    if (!reduceMotion && shakeT > 0) {
      camera.position.x = Math.sin(now * 0.08) * shakeT * 0.6;
      camera.position.y = cameraBaseY + Math.cos(now * 0.06) * shakeT * 0.24;
    } else {
      camera.position.x *= 0.84;
      camera.position.y += (cameraBaseY - camera.position.y) * 0.12;
    }
    renderer.render(scene, camera);
  }

  startLevel();
  raf = requestAnimationFrame(tick);

  function pause() {
    if (paused) return;
    paused = true;
    savedRunning = running;
    running = false;
  }

  function resume() {
    if (!paused) return;
    paused = false;
    last = performance.now();
    if (savedRunning) running = true;
  }

  function teardown() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
    renderer.domElement.removeEventListener("pointerup", onPointerUp);
    el("left").removeEventListener("pointerdown", onLeft);
    el("right").removeEventListener("pointerdown", onRight);
    el("left").removeEventListener("click", onLeftClick);
    el("right").removeEventListener("click", onRightClick);
    ro.disconnect();
    if (ship) {
      scene.remove(ship);
      disposeObject(ship);
    }
    for (const obj of gateObjects) {
      gateGroup.remove(obj.mesh);
      disposeObject(obj.mesh);
    }
    disposeObject(trackGroup);
    disposeObject(railGroup);
    disposeObject(sceneryGroup);
    disposeObject(burstGroup);
    try {
      renderer.dispose();
      renderer.forceContextLoss?.();
    } catch {
      /* ignore teardown errors */
    }
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    if (hud.parentNode) hud.parentNode.removeChild(hud);
  }

  return { teardown, pause, resume };
}

export default function SoundRacerGame({
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
  const [status, setStatus] = useState("loading");
  const soundRef = useRef(isSoundEnabled);

  useEffect(() => { soundRef.current = isSoundEnabled; }, [isSoundEnabled]);

  useEffect(() => {
    let cancelled = false;
    let api = { teardown() {} };
    loadThree()
      .then(THREE => {
        if (cancelled || !mountRef.current || !THREE) return;
        try {
          api = startGame(THREE, mountRef.current, {
            difficulty,
            startLevel,
            onScoreUpdate,
            onProgressUpdate,
            onComplete,
            onCheckpoint,
            getSound: () => soundRef.current
          });
          onEngineReady?.(api);
          setStatus("playing");
        } catch (err) {
          console.error("[SoundRacer] failed to start:", err);
          try { api.teardown(); } catch { /* ignore */ }
          if (!cancelled) setStatus("error");
        }
      })
      .catch(err => {
        console.error("[SoundRacer] three.js failed to load:", err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      try { api.teardown(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <div
      ref={mountRef}
      className="sound-racer"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "460px",
        overflow: "hidden",
        background: "#070b1e",
        touchAction: "none"
      }}
    >
      {status === "loading" && (
        <div className="sound-racer-status" style={statusStyle}>Loading the grid...</div>
      )}
      {status === "error" && (
        <div className="sound-racer-status" style={statusStyle}>This game needs 3D graphics. Try refreshing the page, or pick another game.</div>
      )}
    </div>
  );
}

const statusStyle = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  color: "#dce6ff",
  fontFamily: "var(--kid-font-display, Fredoka, sans-serif)",
  fontSize: "1.2rem"
};
