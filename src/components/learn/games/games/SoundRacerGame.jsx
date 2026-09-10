import { useEffect, useRef, useState } from "react";
import {
  getLearnGameBestSplit,
  saveLearnGameBestSplit
} from "../../../../utils/learnGamesProgress.js";
import {
  playCorrectChime,
  playSoftBuzz,
  playCelebrationFanfare,
  playTapSound,
  playWhoosh,
  playStarChime
} from "../../../../utils/audio/gameSfx";
import { soundRacerLadder, buildTrack, buildSoundRacerEvidenceResult, worldObstacles } from "../../../../utils/soundRacerTracks.js";
import { worldForGameDifficulty, LEVELS_PER_DIFFICULTY } from "../../../../utils/curriculumLadder.js";
import { hasRecordedSpeech, speakPhoneme, speakWord, preloadWordAudio } from "../../../../utils/learnGamesAudio.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import { playCueAudio, stopCueAudio } from "../../../../utils/audio/cuePlayer.js";
import { onsetGrapheme } from "../../../elQuest/elQuestEngine.js";
import { getLedaInstructionAudioPath } from "../../../../data/ledaProductionAudio.js";
import { loadThree, createRenderer, createScene, createPerspectiveCamera, attachResize, createFrameLoop, attachContextLossGuard, attachSwipeSteer, prefersReducedMotion, detectQualityTier, applyQualityTier, shadowMapForTier, particleCountForTier, QUALITY_TIERS, disposeRenderer, disposeObject, setTextureSrgb } from "../shared/threeShell.js";
import { sampleCircuitPath, offsetCircuitPoint, createKart, stepKart, chasePose } from "../../../../utils/soundRacerPhysics.js";
import { laneDirectionForKey } from "../shared/premiumGameStandard.js";
import { createArcadePremiumRenderPipeline } from "../shared/arcadePremiumRender.js";

import { createRacerKart } from "./soundRacerKartAsset.js";
import { createRacerScenery } from "./soundRacerScenery.js";

const LANES = [-3.15, 0, 3.15];
const LANE_NAMES = ["left", "middle", "right"];
const TRACK_WIDTH = 9.6;
const VIEW_DISTANCE = 34;
const CATCH_WINDOW = 0.58;



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
  return "Starts with";
}

function startGame(THREE, mount, opts) {
  const width = () => mount.clientWidth || 720;
  const height = () => mount.clientHeight || 460;
  const difficulty = String(opts.difficulty || "easy").toLowerCase();
  const world = worldForGameDifficulty(difficulty);
  const ladder = soundRacerLadder(difficulty);
  const levelCount = LEVELS_PER_DIFFICULTY;
  const startLevelIdx = Math.max(0, Math.min(Number(opts.startLevel) || 0, levelCount - 1));
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  let reduceMotion = motionQuery?.matches ?? prefersReducedMotion();
  // Hardware quality tier: scales the DPR cap, shadow mode and burst particle
  // counts so weak devices get a lighter scene instead of a stuttery one.
  let qualityTier = detectQualityTier();
  const sfx = fn => {
    try {
      if (opts.getSound && opts.getSound()) fn();
    } catch {
      /* audio is optional */
    }
  };
  const recordedCueTimers = new Set();
  function queueRecordedCue(src, delayMs = 0) {
    if (!(opts.getSound && opts.getSound())) return null;
    if (delayMs <= 0) {
      playCueAudio(src);
      return null;
    }
    const timer = window.setTimeout(() => {
      recordedCueTimers.delete(timer);
      if (opts.getSound && opts.getSound()) playCueAudio(src);
    }, delayMs);
    recordedCueTimers.add(timer);
    return timer;
  }

  function cancelRecordedCue(timer) {
    if (timer == null) return;
    window.clearTimeout(timer);
    recordedCueTimers.delete(timer);
  }
  opts.registerCleanup?.(() => {
    for (const timer of recordedCueTimers) window.clearTimeout(timer);
    recordedCueTimers.clear();
  });

  const scene = createScene(THREE);
  const cameraBaseFov = 64;
  // Keep the whole road width readable in portrait, rather than cropping
  // the outside word gates with a landscape-only vertical field of view.
  const roadFov = () => Math.max(cameraBaseFov, 2 * Math.atan(Math.tan(29 * Math.PI / 180) / (width() / height())) * 180 / Math.PI);
  const cameraBaseY = 3.95;
  const cameraBaseZ = 10.45;
  const camera = createPerspectiveCamera(THREE, {
    fov: roadFov(),
    aspect: width() / height(),
    near: 0.1,
    far: 650,
    position: [0, cameraBaseY, cameraBaseZ],
    lookAt: [0, 1.0, -11.8]
  });

  const renderer = createRenderer(THREE, {
    antialias: qualityTier !== "low",
    powerPreference: "default",
    pixelRatioCap: QUALITY_TIERS[qualityTier].pixelRatioCap,
    srgbOutput: true,
    toneMappingExposure: 1.0,
    shadowMap: shadowMapForTier(qualityTier, "pcf")
  });
  // Registered immediately so the React wrapper can release a context even if
  // a later scene constructor throws before startGame returns its full API.
  opts.registerCleanup?.(() => disposeRenderer(renderer, { forceContextLoss: true }));
  applyQualityTier(renderer, qualityTier);
  renderer.setSize(width(), height());
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  mount.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(4, 9, 6);
  keyLight.castShadow = qualityTier !== "low";
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 34;
  keyLight.shadow.camera.left = -9;
  keyLight.shadow.camera.right = 9;
  keyLight.shadow.camera.top = 9;
  keyLight.shadow.camera.bottom = -9;
  scene.add(keyLight);
  scene.add(keyLight.target);
  const fillLight = new THREE.HemisphereLight(0xffffff, 0x101020, 0.6);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x8de8ff, 0.42);
  rimLight.position.set(-6, 5, -10);
  scene.add(rimLight);

  const premiumRender = createArcadePremiumRenderPipeline({
    THREE,
    renderer,
    scene,
    camera,
    tier: qualityTier,
    shadowLights: [keyLight],
    mood: {
      bloomIntensity: 0.085,
      bloomThreshold: 0.86,
      environmentIntensity: 0.92,
      vignetteDarkness: 0.1,
      aoIntensity: 0.72
    }
  });
  qualityTier = premiumRender.effectiveTier;
  applyQualityTier(renderer, qualityTier);
  premiumRender.setTier(qualityTier);
  premiumRender.resize(width(), height());

  function reassessQualityTier() {
    const nextTier = detectQualityTier();
    premiumRender.setTier(nextTier);
    qualityTier = premiumRender.effectiveTier;
    applyQualityTier(renderer, qualityTier);
    renderer.setSize(width(), height(), false);
    premiumRender.resize(width(), height());
  }

  const syncMotionPreference = event => {
    reduceMotion = Boolean(event.matches);
    reassessQualityTier();
  };
  motionQuery?.addEventListener?.("change", syncMotionPreference);
  opts.registerCleanup?.(() => motionQuery?.removeEventListener?.("change", syncMotionPreference));

  const hud = document.createElement("div");
  hud.className = "sound-racer-hud";
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#f8fbff;z-index:4";
  hud.innerHTML =
    '<style>[data-sr-steer-control][data-pressed="true"]{transform:scale(.94)!important;filter:brightness(1.16)!important}</style>' +
    '<div data-sr-panel="target" style="position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:12px;background:rgba(7,10,22,.72);border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 24px rgba(0,0,0,.25);padding:8px 14px 8px 8px;clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)">' +
      '<div data-sr="target" style="width:54px;height:54px;display:grid;place-items:center;font-size:1.85rem;font-weight:900;color:#071033;background:#ffd34e;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22)"></div>' +
      '<div style="min-width:0"><div data-sr="mission" style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;opacity:.76">Catch the sound</div>' +
      '<div data-sr="map" style="font-size:1.02rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Track 1</div></div>' +
      '<button data-sr="hear-target" type="button" aria-label="Hear the target sound again" style="min-width:56px;min-height:56px;padding:6px 10px;border:2px solid rgba(255,255,255,.68);background:#7cf0b6;color:#071033;font:900 1rem/1.05 var(--kid-font-display,Fredoka,sans-serif);box-shadow:inset 0 -4px 0 rgba(0,0,0,.2);pointer-events:auto;cursor:pointer">Hear<br>sound</button></div>' +
    '<div data-sr-panel="status" style="position:absolute;top:16px;right:16px;text-align:right;background:rgba(7,10,22,.62);border:1px solid rgba(255,255,255,.16);padding:9px 12px;min-width:160px;clip-path:polygon(12px 0,100% 0,100% 100%,0 100%,0 12px)">' +
      '<div data-sr="timer" style="font-size:1.15rem;font-weight:900;font-variant-numeric:tabular-nums">0:00.00</div>' +
      '<div data-sr="words" style="font-size:.98rem;opacity:.9">0 / 0 words</div>' +
      '<div data-sr="checkpoint" style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#b7f7df;opacity:.82;margin-top:3px">Checkpoint 1 / 4 · Lap 1 / 1</div>' +
      '<div data-sr="shield" style="font-size:1.05rem;letter-spacing:2px;margin-top:2px">◆◆◆</div>' +
      '<div style="height:9px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:7px"><i data-sr="speed" style="display:block;height:100%;width:0%;background:#7cf0b6;transition:width .18s ease"></i></div></div>' +
    '<div data-sr="left-zone" aria-hidden="true" style="position:absolute;left:0;top:84px;bottom:0;width:42%;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none"></div>' +
    '<div data-sr="right-zone" aria-hidden="true" style="position:absolute;right:0;top:84px;bottom:0;width:42%;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none"></div>' +
    '<button type="button" data-sr="left-control" data-sr-steer-control aria-label="Steer left" style="position:absolute;left:max(16px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom));width:68px;height:68px;display:grid;place-items:center;padding:0;border:2px solid rgba(124,240,182,.9);border-radius:18px;background:linear-gradient(160deg,rgba(14,45,64,.96),rgba(5,20,37,.94));box-shadow:inset 0 0 0 2px rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.42);color:#fff;font:900 2rem/1 var(--kid-font-display,Fredoka,sans-serif);pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;transition:transform .08s ease,filter .08s ease">&#8592;</button>' +
    '<button type="button" data-sr="right-control" data-sr-steer-control aria-label="Steer right" style="position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));width:68px;height:68px;display:grid;place-items:center;padding:0;border:2px solid rgba(124,240,182,.9);border-radius:18px;background:linear-gradient(160deg,rgba(14,45,64,.96),rgba(5,20,37,.94));box-shadow:inset 0 0 0 2px rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.42);color:#fff;font:900 2rem/1 var(--kid-font-display,Fredoka,sans-serif);pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;transition:transform .08s ease,filter .08s ease">&#8594;</button>' +
    '<div data-sr="banner" role="status" aria-live="polite" aria-atomic="true" style="position:absolute;bottom:20px;left:100px;right:100px;text-align:center;pointer-events:none;font-style:italic;font-weight:900;font-size:clamp(.8rem,2vw,1.05rem);letter-spacing:.02em;color:#f5fbff;text-shadow:0 3px 18px rgba(0,0,0,.7);opacity:0;transition:opacity .25s ease,transform .25s ease;transform:translateX(-36px)"></div>' +
    '<div data-sr="countdown" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;pointer-events:none;background:radial-gradient(120% 90% at 50% 42%,rgba(9,12,30,.62),rgba(5,7,18,.24));z-index:12"></div>' +
    '<div style="position:absolute;inset:0;pointer-events:none;z-index:14;opacity:.13;background:linear-gradient(180deg,rgba(145,225,255,.12),transparent 25%,transparent 76%,rgba(4,7,18,.42));mix-blend-mode:soft-light"></div>' +
    '<div data-sr="overlay" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;background:radial-gradient(120% 90% at 50% 24%,rgba(25,34,72,.76),rgba(5,7,18,.95));pointer-events:auto;z-index:20"></div>';
  mount.appendChild(hud);
  opts.registerCleanup?.(() => {
    if (hud.parentNode) hud.parentNode.removeChild(hud);
  });
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
      statusPanel.style.top = compact ? "auto" : "16px";
      statusPanel.style.bottom = compact ? "16px" : "auto";
      statusPanel.style.left = compact ? "96px" : "auto";
      statusPanel.style.right = compact ? "96px" : "16px";
      statusPanel.style.minWidth = compact ? "0" : "160px";
      statusPanel.style.padding = compact ? "5px" : "9px 12px";
      statusPanel.style.textAlign = compact ? "center" : "right";
      for(const key of ["timer","shield","speed"]) el(key).style.display=compact?"none":"";
      el("checkpoint").style.fontSize=compact?".6rem":".72rem";
      el("banner").style.bottom=compact?"94px":"20px";
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
  let racerKart = null;
  let racerScenery = null;


  let gateObjects = [];
  let burstParticles = [];
  let pulseObjects = [];
  let roadTexture = null;
  let currentMap = mapForLevel(world, startLevelIdx);
  let track = null;
  let levelIdx = startLevelIdx;
  let laneIx = 1;
  hud.dataset.soundRacerLane = String(laneIx);
  let playerZ = 0;
  let lateralOffset = 0;
  let kart = null;
  const heldSteering = new Map();
  const brakeHolds = new Set();
  let steeringPulse = 0;
  let steeringPulseT = 0;
  let gateVoice = null;

  let checkpointIndex = 0;
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
  let overlayActive = false;
  let savedRunning = false;
  let countdownT = 0;
  let bannerT = 0;
  let boostT = 0;
  let dragT = 0;
  let shakeT = 0;
  let last = 0;
  let fov = roadFov();
  let pausedFrameRendered = false;
  let completionSent = false;
  let overlayCueTimer = null;

  const levelResults = new Array(levelCount);
  const caughtCorrectWords = new Set();
  const textureCanvasCache = new Map();
  const idleHandles = new Map();
  const prewarmingMaps = new Set();
  // Bests are per-student (scoped by the signed-in session), not per-device:
  // two siblings on one iPad must not share ghost times.
  const bestScope = opts.progressScopeKey || "default";
  const legacyBestKey = index => `lp:sound-racer-best:${bestScope}:${difficulty}:${index}`;

  function material(color, opts = {}) {
    const config = {
      color,
      roughness: opts.roughness ?? 0.62,
      metalness: opts.metalness ?? 0.18,
      flatShading: opts.flatShading ?? qualityTier === "low",
      envMapIntensity: opts.envMapIntensity ?? 0.92,
      dithering: true,
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

  function canvasTexture(width, height, draw, cacheKey = "") {
    const scale = qualityTier === "low" ? 0.5 : qualityTier === "medium" ? 0.75 : 1;
    const resolvedKey = cacheKey ? `${qualityTier}:${cacheKey}` : "";
    let canvas = resolvedKey ? textureCanvasCache.get(resolvedKey) : null;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext("2d");
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      draw(ctx, width, height);
      if (resolvedKey) textureCanvasCache.set(resolvedKey, canvas);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    setTextureSrgb(THREE, tex);
    return tex;
  }

  function cachedCanvasTexture(cacheKey, widthValue, heightValue, draw) {
    return canvasTexture(widthValue, heightValue, draw, cacheKey);
  }

  function makeMountainTexture(layer) {
    return cachedCanvasTexture(`${currentMap.name}:mountain:${layer}`, 1024, 384, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const ranges = layer === 0
        ? [
            { base: 316, amp: 142, step: 48, color: mixHex(currentMap.fog, 0x344853, 0.23), alpha: 0.88 },
            { base: 340, amp: 106, step: 42, color: mixHex(currentMap.fog, 0x405c57, 0.2), alpha: 0.75 }
          ]
        : [
            { base: 326, amp: 118, step: 44, color: mixHex(currentMap.fog, currentMap.terrain, 0.23), alpha: 0.65 },
            { base: 354, amp: 82, step: 34, color: mixHex(currentMap.fog, currentMap.terrain, 0.3), alpha: 0.56 }
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
        for (let i = 0; i < points.length - 1; i++) {
          const p = points[i], next = points[i + 1];
          ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
        }
        ctx.lineTo(points.at(-1).x, points.at(-1).y);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = colorStyle(range.color, range.alpha);
        ctx.fill();

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
        for (let x = 0; x <= w; x += 8) {
          ctx.lineTo(x, h * 0.72 + Math.sin(x * 0.008) * 12 + Math.cos(x * 0.013) * 7);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      }

      const haze = ctx.createLinearGradient(0, 0, 0, h);
      haze.addColorStop(0, colorStyle(currentMap.sky, 0));
      haze.addColorStop(0.55, colorStyle(currentMap.fog, 0.2));
      haze.addColorStop(1, colorStyle(currentMap.fog, 0.72));
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function makeCloudTexture() {
    return cachedCanvasTexture(`${world}:soft-clouds`, 1024, 256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) {
        const x = (i * 137) % w, y = 42 + (i * 31) % 130;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(110 + (i % 5) * 28, 18 + (i % 4) * 8);
        const mist = ctx.createRadialGradient(0, 0, .05, 0, 0, 1);
        mist.addColorStop(0, world === "dino" ? "rgba(91,79,67,.18)" : world === "moonwood" ? "rgba(194,212,255,.17)" : "rgba(255,252,235,.25)");
        mist.addColorStop(.45, world === "dino" ? "rgba(112,96,78,.09)" : "rgba(242,245,237,.1)");
        mist.addColorStop(1, "rgba(242,245,237,0)");
        ctx.fillStyle = mist; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    });
  }

  function makeForestTexture(layer) {
    return cachedCanvasTexture(`${currentMap.name}:forest:${layer}`, 1024, 360, (ctx, w, h) => {
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
    const texture = cachedCanvasTexture(`${currentMap.name}:track`, 768, 1536, (ctx, w, h) => {
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
    const texture = cachedCanvasTexture(`${currentMap.name}:ground-natural`, 512, 512, (ctx, w, h) => {
      ctx.fillStyle = colorStyle(mixHex(currentMap.ground, currentMap.terrain, .22));
      ctx.fillRect(0, 0, w, h);
      let seed = 731 + world.length * 83;
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < 3200; i++) {
        const x = random() * w, y = random() * h;
        ctx.fillStyle = i % 2 ? "rgba(224,227,175,.055)" : "rgba(18,32,17,.045)";
        ctx.beginPath(); ctx.ellipse(x, y, .5 + random() * 2.5, .4 + random() * 1.3, random() * Math.PI, 0, Math.PI * 2); ctx.fill();
      }
    });
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  function makeParticleTexture() {
    return cachedCanvasTexture(`${world}:particle`, 96, 96, (ctx, w, h) => {
      const glow = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
      glow.addColorStop(0, "rgba(255,255,255,.95)");
      glow.addColorStop(0.28, "rgba(255,255,255,.42)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    });
  }

  function makeHorizonGlowTexture() {
    return cachedCanvasTexture(`${currentMap.name}:horizon`, 1024, 256, (ctx, w, h) => {
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
    setTextureSrgb(THREE, tex);
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
    torus.rotation.y = 0;
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

  function makeShip() {
    racerKart = createRacerKart({ world });
    const group = racerKart.root;
    const engines = [makeBoostCone(-0.56, 0.34, 1.43, 0.08, 0.38), makeBoostCone(0.56, 0.34, 1.43, 0.08, 0.38)];
    engines.forEach(engine => group.add(engine));
    group.userData.engines = engines;
    const current = racerKart;
    current.ready.then(ready => {
      if (!ready || racerKart !== current) return;
      premiumRender.prepareObject(group);
      pausedFrameRendered = false;
    });
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
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5.9, 0, 0), new THREE.Vector3(-5.9, 3.4, 0),
      new THREE.Vector3(-5.25, 4.5, 0), new THREE.Vector3(0, 4.65, 0),
      new THREE.Vector3(5.25, 4.5, 0), new THREE.Vector3(5.9, 3.4, 0), new THREE.Vector3(5.9, 0, 0)
    ]);
    const frame = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .13, 8, false), material(0xf6dda3, { roughness: .5, metalness: .25 }));
    frame.castShadow = qualityTier !== "low";
    group.add(frame);
    const texture = canvasTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = "#183e43"; ctx.beginPath(); ctx.arc(w / 2, h / 2, 58, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#f7d985"; ctx.lineWidth = 8; ctx.stroke();
      ctx.fillStyle = "#fff5da"; ctx.font = "800 72px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(index), w / 2, h / 2 + 3);
    });
    for (const side of [-1, 1]) {
      const number = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: true }));
      number.position.set(side * 5.85, 3.0, 0); number.scale.set(.9, .9, 1); group.add(number);
    }
    group.userData.checkpointNumber = index;
    return group;
  }

  function makeMeadowTree(index, scale = 1) {
    const group = new THREE.Group();
    const trunkMat = material(0x8b5630, { roughness: 0.8, metalness: 0.02 });
    const leafA = material(mixHex(currentMap.terrain, 0xc5d4a1, 0.22), { roughness: .98, metalness: 0, flatShading: false });
    const leafB = material(mixHex(currentMap.terrain, 0x345d39, 0.26), { roughness: .98, metalness: 0, flatShading: false });
    const trunkH = 0.96 * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, trunkH, 6), trunkMat);
    trunk.position.y = trunkH * 0.5;
    group.add(trunk);

    for (let i = 0; i < 5; i += 1) {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry((0.46 + (i % 2) * 0.08) * scale, 2), i % 2 ? leafA : leafB);
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
      emissiveIntensity: 0.012,
      flatShading: false
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
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46 * scale, 2), leafMat);
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
        emissiveIntensity: 0.012,
      flatShading: false
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

  function scheduleIdle(callback) {
    const useIdle = typeof window.requestIdleCallback === "function";
    let handle = 0;
    const wrapped = deadline => {
      idleHandles.delete(handle);
      callback(deadline);
    };
    handle = useIdle
      ? window.requestIdleCallback(wrapped, { timeout: 500 })
      : window.setTimeout(() => wrapped({ timeRemaining: () => 8 }), 32);
    idleHandles.set(handle, useIdle);
  }

  function cancelIdleWork() {
    for (const [handle, useIdle] of idleHandles) {
      if (useIdle) window.cancelIdleCallback?.(handle);
      else window.clearTimeout(handle);
    }
    idleHandles.clear();
  }
  opts.registerCleanup?.(cancelIdleWork);

  // Build the next map's expensive canvases one at a time while the current
  // 3.8-second countdown/game is running. Level transitions then upload cached
  // canvases instead of synchronously redrawing thousands of shapes.
  function prewarmMapTextures(nextLevelIndex) {
    const map = mapForLevel(world, nextLevelIndex);
    const prewarmKey = `${qualityTier}:${map.name}`;
    if (prewarmingMaps.has(prewarmKey)) return;
    prewarmingMaps.add(prewarmKey);
    const jobs = [
      () => makeMountainTexture(0),
      () => makeMountainTexture(1),
      () => makeForestTexture(0),
      () => makeForestTexture(1),
      makeTrackTexture,
      makeGroundTexture,
      makeHorizonGlowTexture
    ];
    let jobIndex = 0;
    const runNext = () => {
      if (jobIndex >= jobs.length) return;
      const previousMap = currentMap;
      currentMap = map;
      let texture;
      try {
        texture = jobs[jobIndex]();
      } finally {
        currentMap = previousMap;
        jobIndex += 1;
      }
      texture?.dispose?.();
      if (jobIndex < jobs.length) scheduleIdle(runNext);
    };
    scheduleIdle(runNext);
  }

  function resetSceneForMap() {
    racerScenery?.dispose();
    racerScenery = null;
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
    ambient.intensity = qualityTier === "low" ? 1.45 : world === "moonwood" ? 0.42 : world === "dino" ? 0.46 : 0.52;
    keyLight.color.setHex(currentMap.sun);
    keyLight.intensity = world === "dino" ? 1.72 : 1.42;
    fillLight.color.setHex(currentMap.ambient);
    fillLight.intensity = world === "moonwood" ? 0.5 : 0.42;

    // Distant painted horizon stays outside the whole circuit. The old
    // straight-runner cards crossed the road when the camera turned.
    for(let side=0;side<4;side++) {
      const angle=side*Math.PI/2;
      const mountain=makeBackdropPlane(makeMountainTexture(side%2),560,95,
        40+Math.sin(angle)*270,26,-60+Math.cos(angle)*270,.8);
      mountain.rotation.y=angle;
      sceneryGroup.add(mountain);
      const forest=makeBackdropPlane(makeForestTexture(side%2),500,36,
        40+Math.sin(angle)*240,9,-60+Math.cos(angle)*240,.55);
      forest.rotation.y=angle;
      sceneryGroup.add(forest);
    }
    const clouds=makeBackdropPlane(makeCloudTexture(),500,45,40,65,-260,0.7);
    sceneryGroup.add(clouds);

    const monument = makeWorldMonument();
    sceneryGroup.add(monument);

    const groundGeo = new THREE.PlaneGeometry(500, 500, 24, 30);
    const groundTexture = makeGroundTexture();
    const ground = new THREE.Mesh(
      groundGeo,
      material(0xffffff, {
        roughness: 1,
        metalness: 0,
        envMapIntensity: .3,
        flatShading: false,
        map: groundTexture
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(40, -0.22, -60);
    sceneryGroup.add(ground);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(9, 32, 20),
      basic(currentMap.sun, { transparent: true, opacity: 0.7, depthWrite: false })
    );
    sun.position.set(-24, 21, -92);
    sceneryGroup.add(sun);

    const particleTexture = makeParticleTexture();
    for (let i = 0; i < (qualityTier === "low" ? 16 : 64); i += 1) {
      const particle = makeAtmosphereParticle(i, particleTexture);
      sceneryGroup.add(particle);
    }

    for (let i = 1; i < track.checkpoints.length - 1; i += 1) {
      const gantry = makeTrackGantry(i + 1);
      const point = sampleCircuitPath(track.path, track.checkpoints[i]);
      gantry.position.set(point.x, point.y, point.z);
      gantry.rotation.y = -point.heading;
      gantry.userData.trackBound = true;
      sceneryGroup.add(gantry);
    }

    const propCount = qualityTier === "low" ? 18 : 36;
    for (let i = 0; i < propCount; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const prop = makeRoadsideProp(i, side);
      const point = sampleCircuitPath(track?.path, 10 + i * (track.totalLength - 20) / propCount);
      const offset = offsetCircuitPoint(point, side * (TRACK_WIDTH / 2 + 4.5));
      prop.position.set(offset.x, offset.y, offset.z);
      prop.rotation.y = -point.heading;
      prop.userData.trackBound = true;
      sceneryGroup.add(prop);
    }

    // Raised bridge section follows the same sampled deck as the tyres and
    // gates. Supports and guard rails sit outside the playable road boundary.
    for(let distance=0;distance<track.totalLength;distance+=6) {
      const point=sampleCircuitPath(track.path,distance);
      if(point.y<0.65) continue;
      for(const side of [-1,1]) {
        const edge=offsetCircuitPoint(point,side*(TRACK_WIDTH/2+0.4));
        const height=edge.y+0.25;
        const support=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.38,height,12),material(0xe4cca0,{roughness:0.88}));
        support.position.set(edge.x,height/2-0.22,edge.z);sceneryGroup.add(support);
        const nextPoint=offsetCircuitPoint(sampleCircuitPath(track.path,distance+6),side*(TRACK_WIDTH/2+0.4));
        const start=new THREE.Vector3(edge.x,edge.y+0.65,edge.z),end=new THREE.Vector3(nextPoint.x,nextPoint.y+0.65,nextPoint.z);
        const rail=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,start.distanceTo(end),8),material(0xffe1a3,{roughness:0.6}));
        rail.position.copy(start).add(end).multiplyScalar(0.5);
        rail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());
        sceneryGroup.add(rail);
      }
    }
    const finish=new THREE.Group();
    const flagTexture=canvasTexture(512,96,(ctx,w,h)=>{
      ctx.fillStyle="#f6edc8";ctx.fillRect(0,0,w,h);
      ctx.fillStyle="#182d3d";ctx.font="900 48px sans-serif";ctx.textAlign="center";ctx.fillText("START / FINISH",w/2,66);
    });
    const finishSign=new THREE.Mesh(new THREE.PlaneGeometry(TRACK_WIDTH,1.1),basic(0xffffff,{map:flagTexture,side:THREE.DoubleSide}));
    finishSign.position.y=4.4;finish.add(finishSign);
    sceneryGroup.userData.finishSign = finishSign;
    for(const side of [-1,1]) {
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.16,4.8,12),material(0xf8e8be,{roughness:0.65}));
      pole.position.set(side*5,2.4,0);finish.add(pole);
    }
    const start=sampleCircuitPath(track.path,0);finish.position.set(start.x,start.y,start.z);finish.rotation.y=-start.heading;sceneryGroup.add(finish);
    roadTexture = makeTrackTexture();
    const ribbon = (left, right, height, mat) => {
      const positions=[],uvs=[],indices=[];
      track.path.forEach((point,index) => {
        for (const lateral of [left,right]) {
          const edge=offsetCircuitPoint(point,lateral);
          positions.push(edge.x,edge.y+height,edge.z);
          uvs.push(lateral===left?0:1,point.distance/10);
        }
        if(index) { const n=index*2; indices.push(n-2,n,n-1,n-1,n,n+1); }
      });
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
      geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
      geometry.setIndex(indices);geometry.computeVertexNormals();
      const mesh=new THREE.Mesh(geometry,mat);mesh.receiveShadow=true;trackGroup.add(mesh);
      return mesh;
    };
    ribbon(-TRACK_WIDTH/2,TRACK_WIDTH/2,0,material(0xffffff,{roughness:0.85,metalness:0.04,map:roadTexture,side:THREE.DoubleSide}));
    ribbon(-TRACK_WIDTH/2,TRACK_WIDTH/2,-0.16,material(0x9a8667,{roughness:0.9,side:THREE.DoubleSide}));
    for(const side of [-1,1]) {
      const edge=side*TRACK_WIDTH/2;
      ribbon(edge-0.3,edge+0.3,0.04,material(0xf5dd96,{roughness:0.8,side:THREE.DoubleSide}));
      ribbon(edge-0.08,edge+0.08,0.08,basic(currentMap.rail,{side:THREE.DoubleSide}));
    }

    if (ship) {
      scene.remove(ship);
      racerKart?.dispose();
      disposeObject(ship);
    }
    racerScenery = createRacerScenery(track, world, qualityTier);
    sceneryGroup.add(racerScenery.root);
    const currentScenery = racerScenery;
    currentScenery.ready.then(ready => {
      if (!ready || racerScenery !== currentScenery) return;
      premiumRender.prepareObject(currentScenery.root);
      pausedFrameRendered = false;
    });
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
    const synced = getLearnGameBestSplit(bestScope, "sound-racer", difficulty, index);
    if (synced) return synced;
    try {
      const raw = window.localStorage.getItem(legacyBestKey(index));
      const legacy = raw ? JSON.parse(raw) : null;
      if (legacy && typeof legacy === "object") {
        saveLearnGameBestSplit(bestScope, "sound-racer", difficulty, index, legacy);
        return legacy;
      }
    } catch {
      // A legacy device-only best is optional; the cloud record remains canonical.
    }
    return null;
  }

  function setBest(index, data) {
    saveLearnGameBestSplit(bestScope, "sound-racer", difficulty, index, data);
  }

  function startLevel() {
    cancelRecordedCue(overlayCueTimer);
    overlayCueTimer = null;
    currentMap = mapForLevel(world, levelIdx);
    const target = ladder[levelIdx % ladder.length];
    track = buildTrack(target, { difficulty, seed: levelIdx });
    resetSceneForMap();
    gateObjects = track.gates.map(makeGateObject);
    playerZ = 0;
    kart = createKart(track.path);
    const initialCamera = chasePose(kart);
    camera.position.set(initialCamera.x, initialCamera.y, initialCamera.z);
    camera.lookAt(initialCamera.lookX, initialCamera.lookY, initialCamera.lookZ);
    heldSteering.clear();
    brakeHolds.clear();
    steeringPulseT = 0;
    gateVoice?.abort();
    for (const gate of track.gates.filter(gate => gate.word).slice(0, 6)) preloadWordAudio(gate.word);
    laneIx = 1;
    lateralOffset = LANES[laneIx];


    checkpointIndex = 0;
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
    caughtCorrectWords.clear();
    countdownT = 0;
    running = true;
    hideOverlay();
    hideCountdown();
    // Replay the exact target phoneme at countdown. The approved phoneme bank
    // includes both single letters and the digraphs used by this ladder.
    sfx(() => speakPhoneme(target));
    showBanner(`Track ${levelIdx + 1} — ${currentMap.name}`);

    el("target").textContent = target;
    el("mission").textContent = instructionFor(difficulty);
    el("map").textContent = currentMap.name;
    el("hear-target")?.setAttribute("aria-label", `Hear ${String(target).toUpperCase()} sound again`);
    updateHud();

    opts.onCheckpoint?.(levelIdx, levelCount);
    opts.onProgressUpdate?.(levelIdx, levelCount);
    prewarmMapTextures(levelIdx + 1);
    // Track, labels, gates and the ship are rebuilt for every level. Prepare
    // the live scene only after that rebuild so the active textures receive
    // anisotropy and bloom never retains objects from the previous track.
    premiumRender.prepareObject(scene);
  }

  function hideOverlay() {
    const overlay = el("overlay");
    overlayActive = false;
    pausedFrameRendered = false;
    if (overlay) {
      overlay.style.display = "none";
      overlay.removeAttribute("aria-modal");
      overlay.removeAttribute("role");
      overlay.removeAttribute("aria-label");
    }
  }

  function showOverlay(html, accessibleName) {
    const overlay = el("overlay");
    overlayActive = true;
    pausedFrameRendered = false;
    overlay.innerHTML = html;
    overlay.style.display = "grid";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", accessibleName);
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
    const checkpointEl = el("checkpoint");
    const shieldEl = el("shield");
    const speedEl = el("speed");
    const hearTargetEl = el("hear-target");
    const replayAvailable = opts.getSound ? opts.getSound() : opts.isSoundEnabled !== false;
    if (timerEl) timerEl.textContent = formatTime(timeMs);
    if (wordsEl) wordsEl.textContent = `${wordsCorrect} / ${track.needed} words`;
    const lapLabel = playerZ >= track.totalLength && wordsCorrect >= track.needed
      ? "Finished"
      : `Lap ${Math.floor(Math.max(0, playerZ) / track.totalLength) + 1}`;
    if (checkpointEl) checkpointEl.textContent = `Checkpoint ${Math.min(checkpointIndex + 1, (track.checkpoints?.length || 1))} / ${track.checkpoints?.length || 1} · ${lapLabel}`;
    if (shieldEl) shieldEl.textContent = "◆".repeat(Math.max(0, shield)) + "◇".repeat(Math.max(0, 3 - shield));
    if (hearTargetEl) {
      hearTargetEl.hidden = !replayAvailable;
      hearTargetEl.disabled = !replayAvailable;
    }
    if (speedEl) {
      const maxSpeed = 11.2;
      speedEl.style.background = "#" + currentMap.gate.toString(16).padStart(6, "0");
      speedEl.style.width = `${Math.min(100, Math.max(0, (speed / maxSpeed) * 100))}%`;
    }
    hud.dataset.soundRacerCheckpoint = String(checkpointIndex);
  }

  function addBurst(x, y, z, color, count = 16) {
    if (reduceMotion) return;
    count = particleCountForTier(qualityTier, count);
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
    const lastPending = Math.max(playerZ, ...gateObjects.filter(gate => !gate.resolved).map(gate => gate.z));
    const z = Math.max(lastPending + 18, playerZ + 28);
    // Always a random lane: placing repeat words in the player's current lane
    // after two misses made the game catch the word by itself.
    const lane = Math.floor(Math.random() * LANES.length);
    const gate = { kind: "word", word, correct: true, lane, z, catchup: true, tries };
    preloadWordAudio(word);
    // Catch-up gates wrap onto the same circuit; the road length never changes.
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
    const hit = Math.abs(lateralOffset - LANES[obj.lane]) <= 1.18;
    const point = sampleCircuitPath(track?.path, obj.z);
    const impact = offsetCircuitPoint(point, LANES[obj.lane]);
    if (obj.correct && hit) {
      if (!caughtCorrectWords.has(obj.word)) {
        caughtCorrectWords.add(obj.word);
        wordsCorrect += 1;
        boostT = 1.25;
        addScore(100 + Math.max(0, shield - 1) * 15);
        sfx(playCorrectChime);
        sfx(playWhoosh);
        // The exact target phoneme is recorded for every live track. Some gate
        // words do not yet have an approved whole-word clip, so reinforce the
        // caught onset instead of allowing apparently random silent successes.
        sfx(() => speakPhoneme(track.target));
        showBanner(`${obj.word} starts with ${String(track.target).toUpperCase()} ✓`);
        addBurst(impact.x, impact.y + 1.1, impact.z, currentMap.gate, 20);
      }
    } else if (obj.kind === "obstacle" && hit) {
      obstaclesHit += 1;
      hurtShip("obstacle");
      addBurst(impact.x, impact.y + 0.9, impact.z, 0xff7a66, 14);
    } else if (hit && obj.kind === "word" && !obj.correct) {
      wordsWrong += 1;
      hurtShip("wrong");
      // Name the word's real onset so a wrong catch teaches something.
      const onset = onsetGrapheme(obj.word);
      if (onset) showBanner(`${obj.word} starts with ${String(onset).toUpperCase()}`);
      addBurst(impact.x, impact.y + 1.1, impact.z, 0xff7a66, 12);
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
    return buildSoundRacerEvidenceResult({
      wordsCorrect,
      wordsWrong,
      missedCorrect,
      obstaclesHit,
      score,
      timeMs
    });
  }

  function completeLevel() {
    celebrationT = 1.2;
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

    overlayCueTimer = queueRecordedCue(getLedaInstructionAudioPath("Great job"), 320);

    const overlay = showOverlay(
      '<div style="display:grid;gap:14px;justify-items:center;padding:24px">' +
        '<div aria-hidden="true" style="width:68px;height:68px;display:grid;place-items:center;border-radius:50%;background:#7cf0b6;color:#071033;font-size:2.6rem;font-weight:950">✓</div>' +
        `<div style="font-size:2rem;font-weight:900">Track cleared</div>` +
        (isNewBest ? '<div style="font-size:1rem;font-weight:900;color:#071033;background:#ffd34e;padding:6px 18px">New best split</div>' : "") +
        `<div style="font-size:1.08rem;line-height:1.9;text-align:left;min-width:230px">Time <b>${formatTime(result.timeMs)}</b><br>Words <b>${result.correct} / ${track.needed}</b><br>Sound accuracy <b>${result.accuracy}%</b><br>Stars <b>${"★".repeat(result.stars)}${"✩".repeat(3 - result.stars)}</b></div>` +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">' +
          '<button data-sr="retry" aria-label="Retry this track" style="min-height:56px;font-family:inherit;font-weight:900;font-size:1.05rem;color:#f8fbff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.26);padding:13px 22px;cursor:pointer">↻ Retry track</button>' +
          '<button data-sr="next" aria-label="Go to the next map" style="min-height:56px;font-family:inherit;font-weight:900;font-size:1.05rem;color:#071033;background:#ffd34e;border:0;padding:13px 24px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22);cursor:pointer">➜ Next map</button>' +
        '</div></div>',
      "Track cleared"
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
    const mistakes = results.reduce((sum, item) => sum + item.mistakes, 0);
    const stars = buildSoundRacerEvidenceResult({
      wordsCorrect: correct,
      wordsWrong: mistakes
    }).stars;
    sfx(playCelebrationFanfare);
    overlayCueTimer = queueRecordedCue(getLedaInstructionAudioPath("Great job"), 1100);
    opts.onProgressUpdate?.(levelCount, levelCount);
    const overlay = showOverlay(
      '<div style="display:grid;gap:14px;justify-items:center;padding:24px">' +
        '<div aria-hidden="true" style="font-size:3rem;line-height:1;color:#ffd34e">★</div>' +
        '<div style="font-size:2.05rem;font-weight:900">Cup complete</div>' +
        `<div style="font-size:2.45rem;letter-spacing:8px">${"★".repeat(stars)}${"✩".repeat(3 - stars)}</div>` +
        `<div style="font-size:1.1rem;opacity:.92">Score <b>${score}</b> · Words <b>${correct}</b></div>` +
        '<button data-sr="done" aria-label="Finish Sound Racer" style="min-height:56px;font-family:inherit;font-weight:900;font-size:1.1rem;color:#071033;background:#ffd34e;border:0;padding:13px 30px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22);cursor:pointer">➜ Done</button>' +
      '</div>',
      "Sound Racer complete"
    );
    const doneButton = overlay.querySelector('[data-sr="done"]');
    doneButton.addEventListener("click", () => {
      if (completionSent) return;
      completionSent = true;
      doneButton.disabled = true;
      doneButton.setAttribute("aria-disabled", "true");
      doneButton.style.pointerEvents = "none";
      opts.onComplete?.(stars, score, correct);
    }, { once: true });
  }

  function moveLane(dir) {
    if (paused || overlayActive) return;
    steeringPulse = dir;
    steeringPulseT = 0.24;
  }
  // Holding turns the wheels continuously; a tap gives a short steering nudge.
  // Every input acts on the same kart heading, including native keyboard clicks.
  for (const [key, direction] of [["left-zone",-1],["right-zone",1],["left-control",-1],["right-control",1]]) {
    const control = el(key);
    let pressedAt = 0;
    const down = event => {
      event.preventDefault();
      if (paused || overlayActive) return;
      pressedAt = performance.now();
      control.setPointerCapture?.(event.pointerId);
      heldSteering.set(`pointer-${event.pointerId}`, direction);
      control.dataset.pressed = "true";
    };
    const up = event => {
      if (event.type === "pointerup" && heldSteering.has(`pointer-${event.pointerId}`) && performance.now() - pressedAt < 180) moveLane(direction);
      heldSteering.delete(`pointer-${event.pointerId}`);
      control.dataset.pressed = "false";
    };
    const click = event => { if (event.detail === 0) moveLane(direction); };
    control.addEventListener("pointerdown", down);
    control.addEventListener("pointerup", up);
    control.addEventListener("pointercancel", up);
    control.addEventListener("lostpointercapture", up);
    control.addEventListener("click", click);
    opts.registerCleanup?.(() => {
      control.removeEventListener("pointerdown", down);
      control.removeEventListener("pointerup", up);
      control.removeEventListener("pointercancel", up);
      control.removeEventListener("lostpointercapture", up);
      control.removeEventListener("click", click);
    });
  }

  const hearTargetButton = el("hear-target");
  const replayTargetSound = event => {
    event?.preventDefault();
    event?.stopPropagation();
    const target = String(track?.target || "").toLowerCase();
    if (!target) return;
    sfx(playTapSound);
    sfx(() => speakPhoneme(target));
  };
  hearTargetButton?.addEventListener("click", replayTargetSound);
  opts.registerCleanup?.(() => hearTargetButton?.removeEventListener("click", replayTargetSound));

  const brakeControl = document.createElement("button");
  brakeControl.type = "button";
  brakeControl.textContent = "Brake";
  brakeControl.setAttribute("aria-label", "Hold to brake");
  brakeControl.dataset.sr = "brake-control";
  brakeControl.style.cssText = "position:absolute;left:max(16px,env(safe-area-inset-left));bottom:max(94px,calc(env(safe-area-inset-bottom) + 78px));width:68px;min-height:56px;border:2px solid #ffdb8b;border-radius:16px;background:rgba(20,35,47,.92);color:#fff1c8;font:700 .86rem var(--kid-font-display,Fredoka,sans-serif);pointer-events:auto;touch-action:none;cursor:pointer";
  hud.appendChild(brakeControl);
  const pressBrake = event => {
    if (paused || overlayActive) return;
    event.preventDefault();
    brakeControl.setPointerCapture?.(event.pointerId);
    brakeHolds.add(`pointer-${event.pointerId}`);
  };
  const releaseBrake = event => brakeHolds.delete(`pointer-${event.pointerId}`);
  brakeControl.addEventListener("pointerdown", pressBrake);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) brakeControl.addEventListener(type, releaseBrake);
  const onKey = event => {
    if (paused || overlayActive) return;
    const steeringControlOwnsFocus = event.target?.matches?.('[data-sr="left-control"],[data-sr="right-control"],[data-sr="brake-control"]');
    if (isInteractiveKeyTarget(event.target) && !steeringControlOwnsFocus) return;
    if (event.code === "Space" || event.key === "ArrowDown") { event.preventDefault(); brakeHolds.add(`key-${event.code}`); return; }
    const direction = laneDirectionForKey(event.key);
    if (!direction) return;
    event.preventDefault();
    heldSteering.set(`key-${event.code}`, direction);
  };
  const keyUp = event => { heldSteering.delete(`key-${event.code}`); brakeHolds.delete(`key-${event.code}`); };
  const clearControls = () => {
    heldSteering.clear(); brakeHolds.clear(); steeringPulseT = 0; gateVoice?.abort();
    for (const control of hud.querySelectorAll("[data-pressed]")) control.dataset.pressed = "false";
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearControls);
  opts.registerCleanup?.(() => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", clearControls);
    gateVoice?.abort();
  });

  const detachSwipeSteer = attachSwipeSteer(renderer.domElement, { threshold: 40, onSteer: dir => moveLane(dir) });
  opts.registerCleanup?.(detachSwipeSteer);

  const detachResize = attachResize({
    mount,
    renderer,
    camera,
    width,
    height,
    onResize: () => {
      layoutHud();
      reassessQualityTier();
      pausedFrameRendered = false;
    }
  });
  opts.registerCleanup?.(detachResize);

  function updateAtmosphere(now) {
    const t = now * 0.001;
    const ambientMotionScale = reduceMotion ? 0.2 : 1;
    for (const obj of pulseObjects) {
      const phase = obj.userData.float ?? obj.userData.pulse ?? 0;
      const baseOpacity = obj.userData.baseOpacity ?? obj.material?.opacity ?? 0.5;
      const breath = 0.72 + Math.sin(t * 1.7 + phase) * 0.18 + Math.cos(t * 0.73 + phase * 0.7) * 0.08;
      if (obj.isSprite) {
        obj.position.x = obj.userData.baseX + Math.sin(t * 0.76 + phase) * 0.34 * ambientMotionScale;
        obj.position.y = obj.userData.baseY + Math.cos(t * 0.9 + phase) * 0.28 * ambientMotionScale;
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
      if (obj.word && !obj.prewarmed && distance > 0 && distance < VIEW_DISTANCE) {
        obj.prewarmed = true;
        preloadWordAudio(obj.word);
      }
      if (distance < -3 || distance > VIEW_DISTANCE) {
        obj.mesh.visible = false;
      } else {
        const point = sampleCircuitPath(track.path, obj.z);
        const offset = offsetCircuitPoint(point, LANES[obj.lane]);
        const t = Math.max(0, 1 - distance / VIEW_DISTANCE);
        obj.mesh.visible = true;
        obj.mesh.position.set(offset.x, offset.y + 0.78 + t * 0.34, offset.z);
        const scale = 0.55 + t * 0.72;
        obj.mesh.scale.setScalar(scale);
        obj.mesh.rotation.y = -point.heading;
        if (obj.kind === "obstacle") obj.mesh.rotation.x += dt * 0.8;
      }
      if (obj.catchup && obj.tries >= 2 && !obj.hintShown && distance > 0 && distance <= VIEW_DISTANCE) {
        // After two misses the word stays in a random lane, but the player
        // gets a lane callout instead of the word landing in their lap.
        obj.hintShown = true;
        showBanner(`${obj.word} — ${LANE_NAMES[obj.lane]} lane!`);
        sfx(() => hasRecordedSpeech(obj.word)
          ? speakWord(obj.word)
          : speakPhoneme(track.target));
      }
      if (obj.kind === "word" && !obj.spoken && distance > 0 && distance < Math.max(9, kart.speed * 1.25)) {
        obj.spoken = true;
        gateVoice?.abort();
        gateVoice = new AbortController();
        const signal = gateVoice.signal;
        if (hasRecordedSpeech(obj.word)) sfx(() => speakWord(obj.word, { signal }));
      }
      if (distance <= CATCH_WINDOW) {
        if (obj.spoken) gateVoice?.abort();
        resolveGate(obj);
      }
    }
    const hasPendingCorrect = gateObjects.some(obj => obj.correct && !obj.resolved);
    if (playerZ >= track.totalLength - 2 && wordsCorrect < track.needed && !hasPendingCorrect) {
      const missed = gateObjects.find(obj => obj.correct && obj.resolved && !caughtCorrectWords.has(obj.word))?.word;
      queueCatchUp(missed || track.gates.find(gate => gate.correct)?.word, 2);
    }
    if (playerZ >= track.totalLength && checkpointIndex === track.checkpoints.length - 1 && wordsCorrect >= track.needed) completeLevel();
  }

  function updateShip(dt) {
    if (!ship) return;
    if (!kart) return;
    ship.position.set(kart.x, kart.y, kart.z);
    keyLight.position.set(kart.x - 8, kart.y + 14, kart.z + 8);
    keyLight.target.position.set(kart.x, kart.y, kart.z);
    keyLight.target.updateMatrixWorld();
    ship.rotation.y = -kart.heading;
    ship.rotation.z = kart.bank || 0;
    const ahead = sampleCircuitPath(track.path, kart.progress + 1);
    const behind = sampleCircuitPath(track.path, kart.progress - 1);
    ship.rotation.x = Math.atan2(ahead.y - behind.y, 2);
    racerKart?.update(dt, { steering: kart.steering, speed: running ? kart.speed : 0, recovered: kart.recovered, reducedMotion: reduceMotion, braking: brakeHolds.size > 0, complete: !running && overlayActive });
    hud.dataset.soundRacerAsset = ship.userData.assetState;
    hud.dataset.soundRacerDriver = ship.userData.driverState;
    brakeControl.dataset.pressed = brakeHolds.size ? "true" : "false";
    hud.dataset.soundRacerBraking = String(brakeHolds.size > 0);
    hud.dataset.soundRacerSpeed = String(kart.speed || 0);
    hud.dataset.soundRacerWheelRoll = String(ship.userData.wheelRoll || 0);
    hud.dataset.soundRacerScenery = racerScenery?.root.userData.assetState || "loading";
    const boostScale = boostT > 0 ? 1.55 : 1;
    if (ship.userData.engines) {
      for (const engine of ship.userData.engines) {
        engine.scale.set(1, (reduceMotion ? 0.94 : 0.76 + Math.random() * 0.38) * boostScale, 1);
        engine.material.opacity = reduceMotion ? 0.7 : 0.58 + Math.random() * 0.3;
      }
    }
    if (ship.userData.light) ship.userData.light.intensity = reduceMotion ? 1.15 : 1.0 + Math.random() * 0.8 * boostScale;
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

  let celebrationT = 0;
  let frameCount = 0;
  function tick(now) {
    frameCount += 1;
    const dt = Math.max(0, Math.min(0.05, ((now - last) || 16) / 1000));
    last = now;
    if (!opts.getSound?.()) gateVoice?.abort();
    if (paused || (overlayActive && !running)) {
      if (!paused && overlayActive && celebrationT > 0) {
        celebrationT = Math.max(0, celebrationT - dt);
        racerKart?.update(dt, { complete: true, reducedMotion: reduceMotion });
        hud.dataset.soundRacerDriver = ship?.userData.driverState || "celebrate";
        premiumRender.render(dt);
        return;
      }
      if (!pausedFrameRendered) {
        const renderedTier = premiumRender.render(0);
        if (renderedTier !== qualityTier) {
          qualityTier = renderedTier;
          applyQualityTier(renderer, qualityTier);
          racerScenery?.setTier(qualityTier);
        }
        pausedFrameRendered = true;
      }
      return;
    }

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
      steeringPulseT = Math.max(0, steeringPulseT - dt);
      const steer = heldSteering.size ? [...heldSteering.values()].at(-1) : steeringPulseT > 0 ? steeringPulse : 0;
      kart = stepKart(track.path, kart, { steer, speed: speed * 1.65, brake: brakeHolds.size > 0 }, dt);
      playerZ = kart.progress;
      lateralOffset = kart.lateral;
      laneIx = lateralOffset < -1.5 ? 0 : lateralOffset > 1.5 ? 2 : 1;
      hud.dataset.soundRacerLane = String(laneIx);
      hud.dataset.soundRacerPosition = JSON.stringify({x:kart.x,z:kart.z,heading:kart.heading,progress:playerZ,lateral:lateralOffset,recoveries:kart.recoveries,wordsCorrect,wordsWrong,missedCorrect});
      if (kart.recovered) {
        obstaclesHit += 1;
        hurtShip("off-road");
        gateVoice?.abort();
        showBanner("Back on track — keep steering!");
      }
      while (checkpointIndex < (track.checkpoints?.length || 1) - 1 && playerZ >= track.checkpoints[checkpointIndex + 1]) {
        checkpointIndex += 1;
        sfx(playStarChime);
      }
      updateGates(dt);
      updateHud();
    }

      updateAtmosphere(now);
      updateShip(dt, now);
      updateBursts(dt);
      if (kart) {
        // An overhead sign between the kart and its chase camera must not
        // become a full-screen billboard immediately after crossing the line.
        const lapPosition = ((playerZ % track.totalLength) + track.totalLength) % track.totalLength;
        sceneryGroup.userData.finishSign.visible = lapPosition > 12;
        const pose = chasePose(kart);
        const follow = Math.min(1, dt * 8);
        camera.position.x += (pose.x - camera.position.x) * follow;
        camera.position.y += (pose.y - camera.position.y) * follow;
        camera.position.z += (pose.z - camera.position.z) * follow;
        camera.lookAt(pose.lookX, pose.lookY, pose.lookZ);
      }

    const wantedFov = roadFov() + (boostT > 0 && !reduceMotion ? 9 : 0);
    if (Math.abs(fov - wantedFov) > 0.1) {
      fov += (wantedFov - fov) * Math.min(1, dt * 5);
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    if (!reduceMotion && shakeT > 0) {
      camera.position.x += Math.sin(now * 0.08) * shakeT * 0.6;
      camera.position.y += Math.cos(now * 0.06) * shakeT * 0.24;
    } else {
      // Centreline following above owns the base camera position.
    }
    const renderedTier = premiumRender.render(dt);
    if (renderedTier !== qualityTier) {
      qualityTier = renderedTier;
      applyQualityTier(renderer, qualityTier);
      racerScenery?.setTier(qualityTier);
    }
  }

  if (import.meta.env.DEV) Object.defineProperty(mount, "racerInspection", { configurable: true, get: () => ({
    frames: frameCount, tier: qualityTier, renderCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
    kart: racerKart?.snapshot(), scenery: racerScenery?.root.userData,
    progress: kart?.progress, speed: kart?.speed, steering: kart?.steering, running, paused
  }) });
  startLevel();
  const loop = createFrameLoop(tick);
  loop.start();
  opts.registerCleanup?.(() => loop.stop());

  function pause() {
    clearControls();
    if (paused) return;
    paused = true;
    pausedFrameRendered = false;
    savedRunning = running;
    running = false;
  }

  let introActive = false;
  function resume() {
    if (!paused || introActive) return;
    paused = false;
    pausedFrameRendered = false;
    last = performance.now();
    if (savedRunning) running = true;
  }

  const detachContextGuard = attachContextLossGuard(renderer, {
    onLost: pause,
    onRestored: () => {
      premiumRender.restoreContext();
      resume();
    }
  });
  opts.registerCleanup?.(detachContextGuard);

  function teardown() {
    if (import.meta.env.DEV) delete mount.racerInspection;
    loop.stop();
    cancelIdleWork();
    for (const timer of recordedCueTimers) window.clearTimeout(timer);
    recordedCueTimers.clear();
    stopCueAudio();
    detachContextGuard();
    motionQuery?.removeEventListener?.("change", syncMotionPreference);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", clearControls);
    gateVoice?.abort();

    detachSwipeSteer();
    detachResize();
    if (ship) {
      scene.remove(ship);
      racerKart?.dispose();
      disposeObject(ship);
    }
    for (const obj of gateObjects) {
      gateGroup.remove(obj.mesh);
      disposeObject(obj.mesh);
    }
    disposeObject(trackGroup);
    disposeObject(railGroup);
    racerScenery?.dispose();
    racerScenery = null;
    disposeObject(sceneryGroup);
    disposeObject(burstGroup);
    premiumRender.destroy();
    disposeRenderer(renderer, { forceContextLoss: true });
    textureCanvasCache.clear();
    if (hud.parentNode) hud.parentNode.removeChild(hud);
  }

  return { teardown, pause, resume };
}

export default function SoundRacerGame({
  difficulty = "easy",
  startLevel = 0,
  progressScopeKey = "default",
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
    const startupCleanups = [];
    let api = {
      teardown() {
        for (const cleanup of startupCleanups.splice(0).reverse()) {
          try { cleanup(); } catch { /* continue releasing remaining resources */ }
        }
      }
    };
    loadThree()
      .then(THREE => {
        if (cancelled || !mountRef.current || !THREE) return;
        try {
          const startedApi = startGame(THREE, mountRef.current, {
            difficulty,
            startLevel,
            progressScopeKey,
            onScoreUpdate,
            onProgressUpdate,
            onComplete,
            onCheckpoint,
            getSound: () => soundRef.current,
            registerCleanup: cleanup => startupCleanups.push(cleanup)
          });
          startupCleanups.length = 0;
          api = startedApi;
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
