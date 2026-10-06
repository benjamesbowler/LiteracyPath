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
import { soundRacerLadder, buildSoundRacerEvidenceResult, worldObstacles } from "../../../../utils/soundRacerTracks.js";
import { buildSoundRacerRace } from "../../../../utils/soundRacerRace.js";
import { worldForGameDifficulty, LEVELS_PER_DIFFICULTY } from "../../../../utils/curriculumLadder.js";
import { hasRecordedSpeech, speakPhoneme, speakWord, preloadWordAudio } from "../../../../utils/learnGamesAudio.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import { playCueAudio, stopCueAudio } from "../../../../utils/audio/cuePlayer.js";
import { onsetGrapheme } from "../../../elQuest/elQuestEngine.js";
import { getLedaInstructionAudioPath } from "../../../../data/ledaProductionAudio.js";
import { loadThree, createRenderer, createScene, createPerspectiveCamera, attachResize, createFrameLoop, attachContextLossGuard, attachSwipeSteer, prefersReducedMotion, detectQualityTier, applyQualityTier, shadowMapForTier, particleCountForTier, QUALITY_TIERS, disposeRenderer, disposeObject, setTextureSrgb } from "../shared/threeShell.js";
import { sampleCircuitPath, offsetCircuitPoint, createKart, stepKart, chasePose, createRacerFixedStepper, racerDriveSpeed, classifyRacerContact } from "../../../../utils/soundRacerPhysics.js";
import { laneDirectionForKey } from "../shared/premiumGameStandard.js";
import { createArcadePremiumRenderPipeline } from "../shared/arcadePremiumRender.js";

import { createRacerKart } from "./soundRacerKartAsset.js";
import { createRacerScenery, racerTerrainHeight } from "./soundRacerScenery.js";
import { createRacerSurfaceTexture, racerSurfaceTextureReady } from "./soundRacerAuthoredWorld.js";
import { newSoundRacerPractice, recordRacerWordChoice } from "../../../../utils/soundRacerPractice.js";
import { loadSoundRacerSession, saveSoundRacerSession, soundRacerSignature } from "../../../../utils/soundRacerSession.js";
import {createSportsFrameTelemetry} from "../../../../utils/sportsArcadePerformance.js";
import {createSportsRendererHost,createCanvasPremiumBridge,createRacerCanvasPresentation} from './sportsCanvasRenderer.js';
import {RACER_SURFACE_METRES} from './racerCanvasWorldArt.js';
import {disposeOwnedSportsPrimaryGroup,disposeOwnedSportsTexture,disposeOwnedSportsWordGates} from './sportsOwnedGltfResources.js';
import { SOUND_RACER_CONTENT_VERSION } from "../../../../data/arcadeContentVersions.js";
import {createMoonFogPrimaryOwner} from './moonFogAsset.js';

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
  const sessionRaces=ladder.map((target,index)=>buildSoundRacerRace(target,{difficulty,seed:opts.sessionSeed?`${opts.sessionSeed}:${index}`:index}));
  let restoredState=opts.resumedCheckpoint?loadSoundRacerSession(opts.progressScopeKey||"default",{
    difficulty,index:startLevelIdx,sessionSeed:opts.sessionSeed||0,journeyIndex:opts.journey?.index||0,races:sessionRaces}):null;
  let restoredSession=false;
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  let reduceMotion = motionQuery?.matches ?? prefersReducedMotion();
  // Hardware quality tier: scales the DPR cap, shadow mode and burst particle
  // counts so weak devices get a lighter scene instead of a stuttery one.
  let qualityTier = detectQualityTier();
  const frameTelemetry=createSportsFrameTelemetry();
  let requestedRendererFallback=null;
  let canvasPresentation=null,canvasReady=null,graphicsLoading=false,detachContextGuard=()=>{},detachSwipeSteer=()=>{};
  let primaryOwnersReleased=false,primaryReleaseReceipt=null;
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
  const cameraBaseFov = 60;
  // Keep the whole road width readable in portrait, rather than cropping
  // the outside word gates with a landscape-only vertical field of view.
  const roadFov = () => Math.min(80, Math.max(cameraBaseFov, 2 * Math.atan(Math.tan(29 * Math.PI / 180) / (width() / height())) * 180 / Math.PI));
  const cameraBaseY = 3.0;
  const cameraBaseZ = 5.4;
  const camera = createPerspectiveCamera(THREE, {
    fov: roadFov(),
    aspect: width() / height(),
    near: 0.1,
    far: 650,
    position: [0, cameraBaseY, cameraBaseZ],
    lookAt: [0, 1.0, -11.8]
  });

  const presentationHost=createSportsRendererHost(()=>createRenderer(THREE, {
    antialias: qualityTier !== "low",
    powerPreference: "default",
    pixelRatioCap: QUALITY_TIERS[qualityTier].pixelRatioCap,
    srgbOutput: true,
    toneMappingExposure: 1.0,
    shadowMap: shadowMapForTier(qualityTier, "pcf")
  }));
  const renderer=presentationHost.renderer;
  // Registered immediately so the React wrapper can release a context even if
  // a later scene constructor throws before startGame returns its full API.
  opts.registerCleanup?.(() => disposeRenderer(renderer, { forceContextLoss: true }));
  applyQualityTier(renderer, qualityTier);
  renderer.setSize(width(), height());
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";
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

  const premiumRender = presentationHost.mode==='canvas'?createCanvasPremiumBridge():createArcadePremiumRenderPipeline({
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
    if(presentationHost.mode==='canvas')return;
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
    '<style>[data-sr-steer-control][data-pressed="true"]{transform:scale(.94)!important;filter:brightness(1.16)!important}@media(min-width:768px) and (min-height:421px){[data-sr=brake-control]{min-width:72px!important;min-height:72px!important}}</style>' +
    '<div data-sr-panel="target" style="position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:12px;background:rgba(7,10,22,.72);border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 24px rgba(0,0,0,.25);padding:8px 14px 8px 8px;clip-path:polygon(0 0,100% 0,calc(100% - 14px) 100%,0 100%)">' +
      '<div data-sr="target" style="width:54px;height:54px;display:grid;place-items:center;font-size:1.85rem;font-weight:900;color:#18263e;background:#CCD5F4;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22)"></div>' +
      '<div style="min-width:0;flex:1"><div data-sr="mission" style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;font-weight:800;opacity:1">Catch the sound</div>' +
      '<div data-sr="map" style="font-size:1.02rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Track 1</div></div>' +
      '<button data-sr="hear-target" type="button" aria-label="Hear the target sound again" style="flex-shrink:0;min-width:56px;min-height:56px;padding:6px 10px;border:2px solid rgba(255,255,255,.68);background:#CCD5F4;color:#071033;font:900 1rem/1.05 var(--kid-font-display,Fredoka,sans-serif);box-shadow:inset 0 -4px 0 rgba(0,0,0,.2);pointer-events:auto;cursor:pointer">Hear<br>sound</button></div>' +
    '<div data-sr-panel="status" style="position:absolute;top:16px;right:16px;text-align:right;background:rgba(7,10,22,.62);border:1px solid rgba(255,255,255,.16);padding:9px 12px;min-width:160px;clip-path:polygon(12px 0,100% 0,100% 100%,0 100%,0 12px)">' +
      '<div data-sr="timer" style="font-size:1.15rem;font-weight:900;font-variant-numeric:tabular-nums">0:00.00</div>' +
      '<div data-sr="words" style="font-size:.98rem;opacity:.9">0 / 0 words</div>' +
      '<div data-sr="checkpoint" style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#E9EDF9;opacity:.82;margin-top:3px">Sector 1 / 3 · Lap 1 / 3</div>' +
      '<div data-sr="shield" style="font-size:1.05rem;letter-spacing:2px;margin-top:2px">◆◆◆</div>' +
      '<div style="height:9px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:7px"><i data-sr="speed" style="display:block;height:100%;width:0%;background:#CCD5F4;transition:width .18s ease"></i></div></div>' +
    '<div data-sr="left-zone" aria-hidden="true" style="position:absolute;left:0;top:84px;bottom:0;width:42%;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none"></div>' +
    '<div data-sr="right-zone" aria-hidden="true" style="position:absolute;right:0;top:84px;bottom:0;width:42%;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none"></div>' +
    '<button type="button" data-sr="left-control" data-sr-steer-control aria-label="Steer left" style="position:absolute;left:max(16px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom));width:68px;height:68px;display:grid;place-items:center;padding:0;border:2px solid #CCD5F4;border-radius:18px;background:linear-gradient(160deg,#3454C8f5,#18263Ef5);box-shadow:inset 0 0 0 2px rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.42);color:#fff;font:900 2rem/1 var(--kid-font-display,Fredoka,sans-serif);pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;transition:transform .08s ease,filter .08s ease">&#8592;</button>' +
    '<button type="button" data-sr="right-control" data-sr-steer-control aria-label="Steer right" style="position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));width:68px;height:68px;display:grid;place-items:center;padding:0;border:2px solid #CCD5F4;border-radius:18px;background:linear-gradient(160deg,#3454C8f5,#18263Ef5);box-shadow:inset 0 0 0 2px rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.42);color:#fff;font:900 2rem/1 var(--kid-font-display,Fredoka,sans-serif);pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;transition:transform .08s ease,filter .08s ease">&#8594;</button>' +
    '<div data-sr="banner" role="status" aria-live="polite" aria-atomic="true" style="position:absolute;bottom:20px;left:100px;right:100px;text-align:center;pointer-events:none;padding:8px 12px;border:1px solid #CCD5F4;border-radius:12px;background:rgba(255,249,237,.96);box-shadow:0 3px 14px rgba(24,38,62,.24);font-weight:900;font-size:clamp(.8rem,2vw,1.05rem);letter-spacing:.02em;color:#18263e;opacity:0;transition:opacity .25s ease,transform .25s ease;transform:translateX(-36px)"></div>' +
    '<div data-sr="countdown" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;pointer-events:none;background:radial-gradient(120% 90% at 50% 42%,rgba(9,12,30,.62),rgba(5,7,18,.24));z-index:12"></div>' +
    '<div data-sr="color-grade" style="position:absolute;inset:0;pointer-events:none;z-index:14;opacity:.13;background:linear-gradient(180deg,rgba(145,225,255,.12),transparent 25%,transparent 76%,rgba(4,7,18,.42));mix-blend-mode:soft-light"></div>' +
    '<div data-sr="overlay" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;background:radial-gradient(120% 90% at 50% 24%,rgba(25,34,72,.76),rgba(5,7,18,.95));pointer-events:auto;z-index:20"></div>';
  mount.appendChild(hud);
  opts.registerCleanup?.(() => {
    if (hud.parentNode) hud.parentNode.removeChild(hud);
  });
  const el = key => hud.querySelector(`[data-sr="${key}"]`);
  function layoutHud() {
    const targetPanel = hud.querySelector('[data-sr-panel="target"]');
    const statusPanel = hud.querySelector('[data-sr-panel="status"]');
    const compact = width() < 640 || height() < 420;
    if (targetPanel) {
      // The broad held-steering regions start below shared chrome. Teaching
      // replay is above them so a Hear press cannot become a lane response.
      targetPanel.style.zIndex = "3";
      targetPanel.style.top = "88px";
      targetPanel.style.left = compact ? "10px" : "16px";
      targetPanel.style.right = compact ? "10px" : "";
      targetPanel.style.gap = compact ? "9px" : "12px";
      targetPanel.style.padding = compact ? "7px 12px 7px 7px" : "8px 14px 8px 8px";
    }
    if (statusPanel) {
      statusPanel.style.zIndex = "3";
      statusPanel.style.top = compact ? "auto" : "88px";
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
  const moonFog=world==='moonwood'?createMoonFogPrimaryOwner():null;


  let gateObjects = [];
  let burstParticles = [];
  let pulseObjects = [];
  let roadTexture = null;
  let surfaceReady = Promise.resolve([]);
  let currentMap = mapForLevel(world, startLevelIdx + (opts.journey?.route || 0));
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
  let gateVoiceCarrier = null;

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
  let disposed = false;
  let assetsLoading = false;
  let loadGeneration = 0;
  let pendingOpeningCue = false;
  let hasLaneIntent = false;
  let targetDelivery = "pending";
  let targetReceipt = null;
  let targetVoice = null;
  let evidence = newSoundRacerPractice({sessionSeed:opts.sessionSeed||0,journeyIndex:opts.journey?.index||0,difficulty});
  const supportReasons=new Set();
  let sessionStarted=false;
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
  let lastSavedTime=0;
  const graphicsNotice=document.createElement('div');graphicsNotice.hidden=true;graphicsNotice.setAttribute('role','status');
  graphicsNotice.style.cssText='margin-top:6px;padding:5px 7px;border:1px solid #3454c8;border-radius:10px;background:#fffdf3ed;color:#18263e;font:700 12px var(--kid-font-display,Fredoka,sans-serif);pointer-events:auto';hud.querySelector('[data-sr-panel="status"]').appendChild(graphicsNotice);
  function releasePrimaryOwners(){
    if(primaryOwnersReleased)return;
    primaryOwnersReleased=true;
    const model=racerKart.releasePrimary();
    racerScenery.dispose();
    const scenery=structuredClone(racerScenery.root.userData.primaryRelease);
    const groups=[trackGroup,railGroup,sceneryGroup,burstGroup,ship].map(root=>disposeOwnedSportsPrimaryGroup(root));
    if(ship?.userData.engines)ship.userData.engines.length=0;
    burstParticles=[];pulseObjects=[];roadTexture=null;
    if(scene.background?.isTexture){scene.background.dispose();scene.background.source.data=null;scene.background=null;}
    for(const canvas of textureCanvasCache.values())canvas.width=canvas.height=1;
    textureCanvasCache.clear();
    const fog=moonFog?.releasePrimary()||null;
    primaryReleaseReceipt={generation:loadGeneration,model,scenery,groups,fog,canvasScene:canvasPresentation.snapshot().sceneDelivery,canvasDriver:canvasPresentation.snapshot().originalAthlete.delivery};
  }
  function switchToCanvas(reason){
    if(canvasReady)return canvasReady;graphicsLoading=true;clearControls();physicsClock.reset();frameTelemetry.reset();detachContextGuard();premiumRender.destroy();
    const generation=loadGeneration;detachSwipeSteer();presentationHost.switchCanvas(reason);renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(width(),height(),false);
    // Keep the primary's authored grading. Recovery avoids a full-viewport
    // blend group over its independently rendered, already coloured artwork.
    el('color-grade').style.mixBlendMode='normal';
    detachSwipeSteer=attachSwipeSteer(renderer.domElement,{threshold:40,onSteer:dir=>moveLane(dir)});
    canvasPresentation=createRacerCanvasPresentation({world,renderer,camera,sceneData:racerScenery.canvasScene(),track});
    graphicsNotice.hidden=false;graphicsNotice.textContent='Getting your kart ready…';
    canvasReady=canvasPresentation.ready.then(ready=>{
      if(generation!==loadGeneration)return false;
      physicsClock.reset();last=performance.now();pausedFrameRendered=false;
      if(ready){releasePrimaryOwners();graphicsLoading=false;graphicsNotice.hidden=true;graphicsNotice.textContent='';}
      else{graphicsNotice.textContent='Your kart is not ready yet. ';const retry=document.createElement('button');retry.type='button';retry.textContent='Try again';retry.style.cssText='min-width:56px;min-height:56px;margin-top:8px;background:#f3f5ff;color:#18263e;border:2px solid #3454c8;border-radius:12px;touch-action:manipulation';retry.onclick=()=>{canvasPresentation.dispose();canvasPresentation=null;canvasReady=null;switchToCanvas(reason);};graphicsNotice.appendChild(retry);}return ready;
    });return canvasReady;
  }
  function renderPresentation(dt){
    if(presentationHost.mode!=='canvas')return premiumRender.render(dt);
    if(canvasPresentation&&kart)canvasPresentation.draw({kart,pose:racerKart.presentationPose(),dt,gates:gateObjects});return 'canvas';
  }
  const textureCanvasCache = new Map();
  // Bests are per-student (scoped by the signed-in session), not per-device:
  // two siblings on one iPad must not share ghost times.
  const bestScope = opts.progressScopeKey || "default";
  const bestRaceKey = `${difficulty}:three-lap-v1`;
  const legacyBestKey = index => `lp:sound-racer-best:${bestScope}:${bestRaceKey}:${index}`;

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

  function makeTrackTexture() {
    return createRacerSurfaceTexture('paving', world, renderer);
  }

  function makeGroundTexture() {
    return createRacerSurfaceTexture('grass', world, renderer);
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
    const accent = 0xccd5f4;
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
      moonFog.attach(group);
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
      if(presentationHost.mode!=='canvas')premiumRender.prepareObject(group);
      pausedFrameRendered = false;
    });
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

  function resetSceneForMap() {
    racerScenery?.dispose();
    racerScenery = null;
    moonFog?.detach(gateGroup);
    disposeOwnedSportsWordGates(gateGroup,gateObjects);

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

    if (scene.background?.isTexture) scene.background.dispose();
    scene.background = cachedCanvasTexture(`${currentMap.name}:sky-gradient`, 32, 512, (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, colorStyle(mixHex(currentMap.sky, 0x152b4b, world === "moonwood" ? .35 : .2)));
      gradient.addColorStop(.52, colorStyle(currentMap.sky));
      gradient.addColorStop(1, colorStyle(mixHex(currentMap.fog, currentMap.sun, .22)));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });
    scene.fog = new THREE.FogExp2(currentMap.fog, world === "dino" ? 0.0062 : world === "moonwood" ? 0.008 : 0.0055);
    ambient.color.setHex(currentMap.ambient);
    ambient.intensity = (world === "moonwood" ? 0.42 : world === "dino" ? 0.46 : 0.52) + (qualityTier === "low" ? .16 : 0);
    keyLight.color.setHex(currentMap.sun);
    keyLight.intensity = world === "dino" ? 1.72 : 1.42;
    fillLight.color.setHex(currentMap.ambient);
    fillLight.intensity = world === "moonwood" ? 0.5 : 0.42;

    // Original authored distant scenery and bounded route-local 3D venues
    // belong to createRacerScenery; no fixed-coordinate monument crosses a bend.

    const groundGeo = new THREE.PlaneGeometry(500, 500, 64, 64);
    const groundVertices = groundGeo.attributes.position;
    for (let index = 0; index < groundVertices.count; index++) {
      const x = groundVertices.getX(index) + 40;
      const z = -groundVertices.getY(index) - 60;
      groundVertices.setZ(index, racerTerrainHeight(track.path, x, z) + .22);
    }
    groundGeo.computeVertexNormals();
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
    ground.material.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float lawnLight=dot(diffuseColor.rgb,vec3(.299,.587,.114));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(lawnLight),.28)*.84+vec3(.09,.065,.025);`);
    };
    ground.material.customProgramCacheKey=()=>"sound-racer-sunlit-lawn-v1";
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(40, -0.22, -60);
    sceneryGroup.add(ground);
    const groundReady = racerSurfaceTextureReady(groundTexture).then(delivered => {
      if (!delivered && ground.parent === sceneryGroup) { ground.material.map = null; ground.material.color.setHex(currentMap.terrain); ground.material.needsUpdate = true; }
      return delivered;
    });

    const particleTexture = makeParticleTexture();
    for (let i = 0; i < (qualityTier === "low" ? 16 : 64); i += 1) {
      const particle = makeAtmosphereParticle(i, particleTexture);
      sceneryGroup.add(particle);
    }

    for (let i = 1; i < track.circuitCheckpoints.length - 1; i += 1) {
      const gantry = makeTrackGantry(i + 1);
      const point = sampleCircuitPath(track.path, track.circuitCheckpoints[i]);
      gantry.position.set(point.x, point.y, point.z);
      gantry.rotation.y = -point.heading;
      gantry.userData.trackBound = true;
      sceneryGroup.add(gantry);
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
          uvs.push(edge.x/RACER_SURFACE_METRES.paving,edge.z/RACER_SURFACE_METRES.paving);
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
    const road = ribbon(-TRACK_WIDTH/2,TRACK_WIDTH/2,0,material(0xffffff,{roughness:0.85,metalness:0.04,map:roadTexture,side:THREE.DoubleSide}));
    const roadReady = racerSurfaceTextureReady(roadTexture).then(delivered => {
      if (!delivered && road.parent === trackGroup) { road.material.map = null; road.material.color.setHex(currentMap.trackA); road.material.needsUpdate = true; }
      return delivered;
    });
    surfaceReady = Promise.all([groundReady, roadReady]);
    ribbon(-TRACK_WIDTH/2,TRACK_WIDTH/2,-0.16,material(0x9a8667,{roughness:0.9,side:THREE.DoubleSide}));
    for(const side of [-1,1]) {
      const edge=side*TRACK_WIDTH/2;
      ribbon(edge-0.3,edge+0.3,0.04,material(0xf5dd96,{roughness:0.8,side:THREE.DoubleSide}));
      ribbon(edge-0.06,edge+0.06,0.08,material(0xf5edcd,{roughness:.9,side:THREE.DoubleSide}));
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
      if(presentationHost.mode!=='canvas')premiumRender.prepareObject(currentScenery.root);
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
    const synced = getLearnGameBestSplit(bestScope, "sound-racer", bestRaceKey, index);
    if (synced) return synced;
    try {
      const raw = window.localStorage.getItem(legacyBestKey(index));
      const legacy = raw ? JSON.parse(raw) : null;
      if (legacy && typeof legacy === "object") {
        saveLearnGameBestSplit(bestScope, "sound-racer", bestRaceKey, index, legacy);
        return legacy;
      }
    } catch {
      // A legacy device-only best is optional; the cloud record remains canonical.
    }
    return null;
  }

  function setBest(index, data) {
    saveLearnGameBestSplit(bestScope, "sound-racer", bestRaceKey, index, data);
  }

  function saveCurrentRace() {
    if(!track||!kart||assetsLoading||completionSent)return;
    const receipt=saveSoundRacerSession(bestScope,difficulty,{
      version:SOUND_RACER_CONTENT_VERSION,checkpointSemantics:"active-track-index",
      sessionSeed:opts.sessionSeed||0,journeyIndex:opts.journey?.index||0,difficulty,index:levelIdx,signature:soundRacerSignature(track),
      kart:{...kart,aimLateral:kart.aimLateral??kart.lateral,bank:kart.bank||0},timeMs,score,levelStartScore,
      shield,wordsCorrect,wordsWrong,missedCorrect,obstaclesHit,caughtCorrectWords:[...caughtCorrectWords],
      supportReasons:[...supportReasons],evidence,levelResults:Array.from(levelResults,result=>result||null),
      gates:gateObjects.filter((gate,index)=>index<track.gates.length||!gate.resolved).map(gate=>({
        kind:gate.kind,word:gate.word,correct:gate.correct,lane:gate.lane,z:gate.z,resolved:gate.resolved,
        tries:gate.tries,catchup:Boolean(gate.catchup),hintShown:gate.hintShown,
      })),
    });
    lastSavedTime=timeMs;hud.dataset.soundRacerSaved=String(receipt.localSaved);
  }

  function restoreRace() {
    if(!restoredState)return;
    const saved=restoredState;restoredState=null;restoredSession=true;
    moonFog?.detach(gateGroup);
    disposeOwnedSportsWordGates(gateGroup,gateObjects);
    gateObjects=saved.gates.map(gate=>({...makeGateObject(gate),resolved:gate.resolved,hintShown:gate.hintShown}));
    kart={...saved.kart};playerZ=kart.progress;lateralOffset=kart.lateral;speed=kart.speed;
    laneIx=lateralOffset< -1.5?0:lateralOffset>1.5?2:1;
    checkpointIndex=Math.max(0,Math.min(track.checkpoints.length-1,Math.floor(playerZ/(track.totalLength/3))));
    timeMs=saved.timeMs;score=saved.score;levelStartScore=saved.levelStartScore;
    shield=saved.shield;wordsCorrect=saved.wordsCorrect;wordsWrong=saved.wordsWrong;
    missedCorrect=saved.missedCorrect;obstaclesHit=saved.obstaclesHit;evidence=saved.evidence;
    saved.levelResults.forEach((result,index)=>{levelResults[index]=result;});
    saved.caughtCorrectWords.forEach(word=>caughtCorrectWords.add(word));
    saved.supportReasons.forEach(reason=>supportReasons.add(reason));supportReasons.add("resumed-target-cue");
    hasLaneIntent=false;lastSavedTime=timeMs;opts.onScoreUpdate?.(score);
    const pose=chasePose(kart);camera.position.set(pose.x,pose.y,pose.z);camera.lookAt(pose.lookX,pose.lookY,pose.lookZ);
  }

  function startLevel() {
    primaryOwnersReleased=false;primaryReleaseReceipt=null;
    canvasPresentation?.dispose();canvasPresentation=null;canvasReady=null;graphicsLoading=presentationHost.mode==='canvas';
    cancelRecordedCue(overlayCueTimer);
    overlayCueTimer = null;
    physicsClock.reset();
    assetsLoading = true;
    const generation = ++loadGeneration;
    hasLaneIntent = false;
    targetDelivery = "pending";
    targetReceipt = null;
    targetVoice?.abort();
    supportReasons.clear();
    pendingOpeningCue = true;
    currentMap = mapForLevel(world, levelIdx + (opts.journey?.route || 0));
    const target = ladder[levelIdx % ladder.length];
    track = sessionRaces[levelIdx];
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
    speed = racerDriveSpeed({ difficulty });
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
    restoreRace();
    countdownT = 0;
    running = false;
    hideOverlay();
    hideCountdown();
    // Replay the exact target phoneme at countdown. The approved phoneme bank
    // includes both single letters and the digraphs used by this ladder.
    showBanner("Preparing your driver and circuit…");
    Promise.all([racerKart.ready, racerScenery.ready, surfaceReady,moonFog?.ready]).then(async() => {
      if (generation !== loadGeneration) return;
      if(presentationHost.mode==='canvas'||racerKart.root.userData.assetState==='error')await switchToCanvas(presentationHost.reason||'primary-and-model-recovery-unavailable');
      if(generation!==loadGeneration)return;
      if(presentationHost.mode!=='canvas'&&moonFog?.snapshot().delivery==='unavailable'){
        graphicsNotice.hidden=false;graphicsNotice.textContent='Watch out for the moon fog.';
      }
      assetsLoading = false;
      physicsClock.reset();
      savedRunning = true;
      running = !paused;
      if(!sessionStarted){sessionStarted=true;opts.onSessionStart?.();}
      pausedFrameRendered = false;
      showBanner(`Track ${levelIdx + 1} — steer to choose a word`);
      saveCurrentRace();
    });

    el("target").textContent = target;
    el("mission").textContent = instructionFor(difficulty);
    el("map").textContent = currentMap.name;
    el("hear-target")?.setAttribute("aria-label", `Hear ${String(target).toUpperCase()} sound again`);
    updateHud();

    opts.onCheckpoint?.(levelIdx, levelCount);
    opts.onProgressUpdate?.(levelIdx, levelCount);
    // Track, labels, gates and the ship are rebuilt for every level. Prepare
    // the live scene only after that rebuild so the active textures receive
    // anisotropy and bloom never retains objects from the previous track.
    if(presentationHost.mode!=='canvas')premiumRender.prepareObject(scene);
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
    const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
    setText(timerEl,formatTime(timeMs));
    setText(wordsEl,`${wordsCorrect} / ${track.needed} words`);
    const lapLabel = playerZ >= track.raceLength && wordsCorrect >= track.needed
      ? "Finished"
      : `Lap ${Math.min(track.laps, Math.floor(Math.max(0, playerZ) / track.totalLength) + 1)} / ${track.laps}`;
    setText(checkpointEl,playerZ >= track.raceLength && wordsCorrect >= track.needed
      ? "Finished"
      : playerZ >= track.raceLength && wordsCorrect < track.needed
        ? "Finish your word gates"
        : `Sector ${Math.min(3, checkpointIndex % 3 + 1)} / 3 · ${lapLabel}`);
    setText(shieldEl,"◆".repeat(Math.max(0, shield)) + "◇".repeat(Math.max(0, 3 - shield)));
    if (hearTargetEl) {
      if(hearTargetEl.disabled!==!replayAvailable)hearTargetEl.disabled=!replayAvailable;
      const html=replayAvailable ? "Hear<br>sound" : "Sound<br>off";
      if(hearTargetEl.innerHTML!==html)hearTargetEl.innerHTML=html;
      const opacity=replayAvailable ? "1" : "0.72";
      if(hearTargetEl.style.opacity!==opacity)hearTargetEl.style.opacity=opacity;
      const label=replayAvailable
        ? `Hear ${String(track.target).toUpperCase()} sound again`
        : "Sound is off. Turn sound on in Tools to hear the target again.";
      if(hearTargetEl.getAttribute('aria-label')!==label)hearTargetEl.setAttribute('aria-label',label);
    }
    if (speedEl) {
      const maxSpeed = racerDriveSpeed({ difficulty, boosted: true });
      const speedWidth=`${Math.min(100, Math.max(0, (speed / maxSpeed) * 100))}%`;
      if(speedEl.style.width!==speedWidth)speedEl.style.width=speedWidth;
    }
    if(hud.dataset.soundRacerCheckpoint!==String(checkpointIndex))hud.dataset.soundRacerCheckpoint=String(checkpointIndex);
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
    const response = classifyRacerContact({ hit, correct: obj.correct, kind: obj.kind, hasLaneIntent });
    if(response==="correct"||response==="wrong")evidence=recordRacerWordChoice(evidence,obj,{
      hasLaneIntent,levelIndex:levelIdx,target:track.target,targetDelivery,targetReceipt,supportReasons:[...supportReasons],motorAssist:true,
      soundEnabled:opts.getSound?.()!==false,
      graphicsRecovery:presentationHost.mode==="canvas"?"authored-driving-art":ship.userData.assetRecovery?"gzip-recovery":"primary",
    });
    if (response === "correct") {
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
    } else if (response === "obstacle") {
      obstaclesHit += 1;
      hurtShip("obstacle");
      addBurst(impact.x, impact.y + 0.9, impact.z, 0xff7a66, 14);
    } else if (response === "wrong") {
      wordsWrong += 1;
      hurtShip("wrong");
      // Name the word's real onset so a wrong catch teaches something.
      const onset = onsetGrapheme(obj.word);
      if (onset) showBanner(`${obj.word} starts with ${String(onset).toUpperCase()}`);
      addBurst(impact.x, impact.y + 1.1, impact.z, 0xff7a66, 12);
    } else if (response === "missed") {
      missedCorrect += 1;
      queueCatchUp(obj.word, (obj.tries || 0) + 1);
      sfx(playWhoosh);
    }

    if (obj.mesh.userData.sprite) obj.mesh.userData.sprite.material.opacity = 0;
    obj.mesh.visible = false;
    updateHud();
    saveCurrentRace();
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
        '<div aria-hidden="true" style="width:68px;height:68px;display:grid;place-items:center;border-radius:50%;background:#CCD5F4;color:#071033;font-size:2.6rem;font-weight:950">✓</div>' +
        `<div style="font-size:2rem;font-weight:900">Track cleared</div>` +
        (isNewBest ? '<div style="font-size:1rem;font-weight:900;color:#071033;background:#ffd34e;padding:6px 18px">New best split</div>' : "") +
        `<div style="font-size:1.08rem;line-height:1.9;text-align:left;min-width:230px">Time <b>${formatTime(result.timeMs)}</b><br>Words <b>${result.correct} / ${track.needed}</b><br>Sound accuracy <b>${result.accuracy}%</b><br>Stars <b>${"★".repeat(result.stars)}${"✩".repeat(3 - result.stars)}</b></div>` +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">' +
          '<button data-sr="retry" aria-label="Retry this track" style="min-height:56px;font-family:inherit;font-weight:900;font-size:1.05rem;color:#f8fbff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.26);padding:13px 22px;cursor:pointer">↻ Retry track</button>' +
          '<button data-sr="next" aria-label="Go to the next map" style="min-height:56px;font-family:inherit;font-weight:900;font-size:1.05rem;color:#fff;background:#3454C8;border:0;padding:13px 24px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.22);cursor:pointer">➜ Next map</button>' +
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
    if (completionSent) return;
    completionSent = true;
    const results = levelResults.filter(Boolean);
    const correct = results.reduce((sum, item) => sum + item.correct, 0);
    const mistakes = results.reduce((sum, item) => sum + item.mistakes, 0);
    const stars = buildSoundRacerEvidenceResult({
      wordsCorrect: correct,
      wordsWrong: mistakes
    }).stars;
    sfx(playCelebrationFanfare);
    // The shared result surface already provides Next level and Replay level.
    // Completing the cup must reach it without a second Done confirmation.
    if (opts.onComplete) {
      opts.onProgressUpdate?.(levelCount, levelCount);
      opts.onComplete(stars, score, correct,structuredClone(evidence));
      return;
    }
    overlayCueTimer = queueRecordedCue(getLedaInstructionAudioPath("Great job"), 1100);
    opts.onProgressUpdate?.(levelCount, levelCount);
    showOverlay(
      '<div style="display:grid;gap:14px;justify-items:center;padding:24px">' +
        '<div aria-hidden="true" style="font-size:3rem;line-height:1;color:#ffd34e">★</div>' +
        '<div style="font-size:2.05rem;font-weight:900">Cup complete</div>' +
        `<div style="font-size:2.45rem;letter-spacing:8px">${"★".repeat(stars)}${"✩".repeat(3 - stars)}</div>` +
        `<div style="font-size:1.1rem;opacity:.92">Score <b>${score}</b> · Words <b>${correct}</b></div>` +
      '</div>',
      "Sound Racer complete"
    );
  }

  function moveLane(dir) {
    if (paused || overlayActive || assetsLoading||graphicsLoading) return;
    frameTelemetry.markInput();
    hasLaneIntent = true;
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
      if (paused || overlayActive || assetsLoading||graphicsLoading) return;
      frameTelemetry.markInput();
      hasLaneIntent = true;
      pressedAt = performance.now();
      control.setPointerCapture?.(event.pointerId);
      heldSteering.set(`pointer-${event.pointerId}`, direction);
      control.dataset.pressed = "true";
    };
    const up = event => {
      frameTelemetry.markInput();
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
  function playTargetCue() {
    targetVoice?.abort();
    const controller=new AbortController();targetVoice=controller;
    targetDelivery=opts.getSound?.()===false?"unavailable":"pending";
    if(targetDelivery==="unavailable")return;
    void speakPhoneme(track.target,{signal:controller.signal,onEnd:source=>{
      if(targetVoice!==controller||controller.signal.aborted)return;
      targetDelivery="delivered";
      targetReceipt={source,deliveredAt:new Date().toISOString(),playTimeMs:timeMs};
    }}).catch(()=>{
      if(targetVoice===controller&&!controller.signal.aborted)targetDelivery="unavailable";
    }).finally(()=>{
      if(targetVoice===controller&&!controller.signal.aborted&&targetDelivery==="pending")targetDelivery="unavailable";
    });
  }
  const replayTargetSound = event => {
    event?.preventDefault();
    event?.stopPropagation();
    if(paused||assetsLoading)return;
    const target = String(track?.target || "").toLowerCase();
    if (!target) return;
    supportReasons.add("target-audio-replay");
    sfx(playTapSound);
    playTargetCue();
  };
  hearTargetButton?.addEventListener("click", replayTargetSound);
  opts.registerCleanup?.(() => hearTargetButton?.removeEventListener("click", replayTargetSound));

  const brakeControl = document.createElement("button");
  brakeControl.type = "button";
  brakeControl.textContent = "Brake";
  brakeControl.setAttribute("aria-label", "Hold to brake");
  brakeControl.dataset.sr = "brake-control";
  brakeControl.style.cssText = "position:absolute;left:max(16px,env(safe-area-inset-left));bottom:max(96px,calc(env(safe-area-inset-bottom) + 80px));width:68px;min-height:56px;border:2px solid #CCD5F4;border-radius:16px;background:#18263Eed;color:#fff;font:700 .86rem var(--kid-font-display,Fredoka,sans-serif);pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer";
  hud.appendChild(brakeControl);
  const pressBrake = event => {
    if (paused || overlayActive || assetsLoading||graphicsLoading) return;
    frameTelemetry.markInput();
    event.preventDefault();
    brakeControl.setPointerCapture?.(event.pointerId);
    brakeHolds.add(`pointer-${event.pointerId}`);
  };
  const releaseBrake = event => {frameTelemetry.markInput();brakeHolds.delete(`pointer-${event.pointerId}`);};
  brakeControl.addEventListener("pointerdown", pressBrake);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) brakeControl.addEventListener(type, releaseBrake);
  const onKey = event => {
    if (paused || overlayActive || assetsLoading||graphicsLoading) return;
    const steeringControlOwnsFocus = event.target?.matches?.('[data-sr="left-control"],[data-sr="right-control"],[data-sr="brake-control"]')
      || (event.target?.matches?.('[data-sr="hear-target"]') && Boolean(laneDirectionForKey(event.key)));
    if (isInteractiveKeyTarget(event.target, event.key) && !steeringControlOwnsFocus) return;
    if (event.code === "Space" || event.key === "ArrowDown") { event.preventDefault();frameTelemetry.markInput();brakeHolds.add(`key-${event.code}`); return; }
    const direction = laneDirectionForKey(event.key);
    if (!direction) return;
    event.preventDefault();
    if (!event.repeat && !heldSteering.has(`key-${event.code}`)) moveLane(direction);
    heldSteering.set(`key-${event.code}`, direction);
  };
  const keyUp = event => {if(heldSteering.has(`key-${event.code}`)||brakeHolds.has(`key-${event.code}`))frameTelemetry.markInput();heldSteering.delete(`key-${event.code}`); brakeHolds.delete(`key-${event.code}`); };
  const clearControls = () => {
    heldSteering.clear(); brakeHolds.clear(); steeringPulseT = 0; gateVoice?.abort();
    if(targetDelivery==="pending")pendingOpeningCue=true;
    targetVoice?.abort();
    // Only an interrupted live cue is replayable. A naturally completed word
    // keeps its spoken flag, while Help/blur preserves the unresolved target.
    if (gateVoiceCarrier && !gateVoiceCarrier.resolved) gateVoiceCarrier.spoken = false;
    gateVoice = null; gateVoiceCarrier = null;
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

  detachSwipeSteer = attachSwipeSteer(renderer.domElement, { threshold: 40, onSteer: dir => moveLane(dir) });
  opts.registerCleanup?.(()=>detachSwipeSteer());

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
        obj.audioDelivery="pending";
        gateVoice?.abort();
        gateVoiceCarrier = null;
        const controller = new AbortController();
        gateVoice = controller;
        const signal = controller.signal;
        if (hasRecordedSpeech(obj.word)) sfx(() => {
          gateVoiceCarrier = obj;
          void speakWord(obj.word, { signal,onEnd:()=>{obj.audioDelivery="delivered";} }).finally(() => {
            if (gateVoice === controller) { gateVoice = null; gateVoiceCarrier = null; }
          });
        });
      }
      if (distance <= CATCH_WINDOW) {
        if (obj.spoken) gateVoice?.abort();
        resolveGate(obj);
      }
    }
    const hasPendingCorrect = gateObjects.some(obj => obj.correct && !obj.resolved);
    if (playerZ >= track.raceLength - 2 && wordsCorrect < track.needed && !hasPendingCorrect) {
      const missed = gateObjects.find(obj => obj.correct && obj.resolved && !caughtCorrectWords.has(obj.word))?.word;
      queueCatchUp(missed || track.gates.find(gate => gate.correct)?.word, 2);
    }
    if (playerZ >= track.raceLength && checkpointIndex === track.checkpoints.length - 1 && wordsCorrect >= track.needed) completeLevel();
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

  const physicsClock = createRacerFixedStepper();
  let celebrationT = 0;
  let frameCount = 0;
  function tick(now) {
    const cpuStart=performance.now(),rawFrameMs=(now-last)||16;
    frameCount += 1;
    const { steps: frameSteps, elapsed: dt } = physicsClock.advance(((now - last) || 16) / 1000);
    last = now;
    if (!opts.getSound?.()) gateVoice?.abort();
    hud.dataset.soundRacerLoading = String(assetsLoading);
    if (assetsLoading||graphicsLoading) {
      frameTelemetry.reset();
      physicsClock.reset();
      updateShip(0);
      renderPresentation(0);
      return;
    }
    if (paused || document.hidden || (overlayActive && !running)) {
      frameTelemetry.reset();
      if(document.hidden)clearControls();
      physicsClock.reset();
      if (!paused && overlayActive && celebrationT > 0) {
        celebrationT = Math.max(0, celebrationT - dt);
        racerKart?.update(dt, { complete: true, reducedMotion: reduceMotion });
        hud.dataset.soundRacerDriver = ship?.userData.driverState || "celebrate";
        renderPresentation(dt);
        return;
      }
      if (!pausedFrameRendered) {
        const renderedTier = renderPresentation(0);
        if (renderedTier !== 'canvas'&&renderedTier !== qualityTier) {
          qualityTier = renderedTier;
          applyQualityTier(renderer, qualityTier);
          racerScenery?.setTier(qualityTier);
        }
        pausedFrameRendered = true;
      }
      return;
    }

    racerScenery?.update(dt, reduceMotion, kart,camera);
    if (pendingOpeningCue) {
      pendingOpeningCue = false;
      playTargetCue();
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

    for (const dt of frameSteps) if (running && track) {
      timeMs += dt * 1000;
      const nextWord = gateObjects.filter(gate => gate.kind === "word" && !gate.resolved && gate.z >= playerZ).reduce((nearest, gate) => Math.min(nearest, gate.z - playerZ), Infinity);
      speed = racerDriveSpeed({ difficulty, wordDistance: nextWord, boosted: boostT > 0, slowed: dragT > 0 });
      boostT = Math.max(0, boostT - dt);
      dragT = Math.max(0, dragT - dt);
      shakeT = Math.max(0, shakeT - dt);
      steeringPulseT = Math.max(0, steeringPulseT - dt);
      const steer = heldSteering.size ? [...heldSteering.values()].at(-1) : steeringPulseT > 0 ? steeringPulse : 0;
      kart = stepKart(track.path, kart, { steer, speed, brake: brakeHolds.size > 0, roadAssist: true }, dt);
      playerZ = kart.progress;
      lateralOffset = kart.lateral;
      laneIx = lateralOffset < -1.5 ? 0 : lateralOffset > 1.5 ? 2 : 1;
      if (kart.recovered) {
        hasLaneIntent = false;
        obstaclesHit += 1;
        hurtShip("off-road");
        gateVoice?.abort();
        showBanner("Back on track — keep steering!");
      }
      while (checkpointIndex < (track.checkpoints?.length || 1) - 1 && playerZ >= track.checkpoints[checkpointIndex + 1]) {
        checkpointIndex += 1;
        sfx(playStarChime);
        if (checkpointIndex % 3 === 0 && checkpointIndex < track.checkpoints.length - 1) {
          showBanner(checkpointIndex === 6 ? "Final lap — keep racing!" : "Lap 2 — fresh word gates!");
        }
      }
      updateGates(dt);
    }
    if (kart) {
      hud.dataset.soundRacerLane = String(laneIx);
      hud.dataset.soundRacerPosition = JSON.stringify({x:kart.x,z:kart.z,heading:kart.heading,progress:playerZ,lateral:lateralOffset,recoveries:kart.recoveries,wordsCorrect,wordsWrong,missedCorrect});
      updateHud();
      if(timeMs-lastSavedTime>=5000)saveCurrentRace();
    }

      updateAtmosphere(now);
      updateShip(frameSteps.length / 60);
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
    const renderedTier = renderPresentation(dt);
    if (renderedTier !== 'canvas'&&renderedTier !== qualityTier) {
      qualityTier = renderedTier;
      applyQualityTier(renderer, qualityTier);
      racerScenery?.setTier(qualityTier);
    }
    const change=frameTelemetry.rendered(rawFrameMs,{tier:renderedTier,cpuStart});
    if(change?.to==='canvas'){requestedRendererFallback=change;switchToCanvas(change.reason);}
    else if(change){qualityTier=change.to;applyQualityTier(renderer,qualityTier);premiumRender.setTier(qualityTier);racerScenery?.setTier(qualityTier);premiumRender.resize(width(),height());}
  }

  if (import.meta.env.DEV) Object.defineProperty(mount, "racerInspection", { configurable: true, get: () => ({
    frames: frameCount, tier: qualityTier, renderCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
    performance:{...frameTelemetry.snapshot(),requestedRendererFallback:requestedRendererFallback?{...requestedRendererFallback}:null},
    presentation:{...presentationHost.snapshot(),canvas:canvasPresentation?.snapshot()||null,primaryOwnersReleased,primaryReleaseReceipt:primaryReleaseReceipt?structuredClone(primaryReleaseReceipt):null,
      gateLabelCount:gateObjects.filter(gate=>gate.mesh.userData.sprite?.material.map?.image).length,
      gateLabelBytes:gateObjects.reduce((sum,gate)=>{const image=gate.mesh.userData.sprite?.material.map?.image;return sum+(image?image.width*image.height*4:0);},0)},graphicsLoading,
    geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
    kart: racerKart?.snapshot(), scenery: structuredClone(racerScenery?.root.userData || null),moonFog:moonFog?.snapshot()||null,
    camera:{position:camera.position.toArray(),matrix:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray()},
    progress: kart?.progress, aimLateral: kart?.aimLateral, speed: kart?.speed, steering: kart?.steering, running, paused,
    timeMs, raceLength: track?.raceLength, laps: track?.laps, checkpointIndex, assetsLoading, hasLaneIntent,shield,obstaclesHit,
    targetDelivery,targetReceipt:structuredClone(targetReceipt),evidence:structuredClone(evidence),supportReasons:[...supportReasons],restoredSession,
    nextGates: gateObjects.filter(gate => !gate.resolved && gate.z >= playerZ - 2).sort((a, b) => a.z - b.z).slice(0, 4).map(({ kind, z, lane, word, correct, catchup }) => ({ kind, z, lane, word, correct, catchup }))
  }) });
  if(import.meta.env.DEV)Object.defineProperty(mount,"racerGroundComparison",{configurable:true,value:()=>{
    if(disposed||!paused||graphicsLoading||presentationHost.mode!=='canvas')return null;
    const beforeTime=timeMs,beforeKart=JSON.stringify(kart),beforeEvidence=JSON.stringify(evidence);
    const result=canvasPresentation?.compareFrame({kart,pose:racerKart.presentationPose(),gates:gateObjects});
    return result?{...result,timeBefore:beforeTime,timeAfter:timeMs,controllerUnchanged:beforeKart===JSON.stringify(kart),evidenceUnchanged:beforeEvidence===JSON.stringify(evidence)}:null;
  }});
  if(import.meta.env.DEV)Object.defineProperty(mount,"racerSamplingComparison",{configurable:true,value:(sampling='medium')=>{
    if(disposed||!paused||graphicsLoading||presentationHost.mode!=='canvas')return null;
    const beforeTime=timeMs,beforeKart=JSON.stringify(kart),beforeEvidence=JSON.stringify(evidence);
    const result=canvasPresentation?.compareSampling({kart,pose:racerKart.presentationPose(),gates:gateObjects},sampling);
    return result?{...result,timeBefore:beforeTime,timeAfter:timeMs,controllerUnchanged:beforeKart===JSON.stringify(kart),evidenceUnchanged:beforeEvidence===JSON.stringify(evidence)}:null;
  }});
  if(import.meta.env.DEV)Object.defineProperty(mount,"racerSamplingDiagnostic",{configurable:true,value:sampling=>{
    if(disposed||!paused||graphicsLoading||presentationHost.mode!=='canvas')return false;
    return canvasPresentation?.setSamplingDiagnostic(sampling)||false;
  }});
  if(import.meta.env.DEV)Object.defineProperty(mount,"racerFrameRows",{configurable:true,get:()=>disposed?null:frameTelemetry.snapshotFrameRows()});
  if(import.meta.env.DEV)Object.defineProperty(mount,"racerPrepareDriverCandidate",{configurable:true,value:async()=>{
    if(disposed||!paused||graphicsLoading||presentationHost.mode!=='canvas')return false;
    return await canvasPresentation?.prepareDriverCandidate()||false;
  }});
  if(import.meta.env.DEV)Object.defineProperty(mount,"racerDriverFormat",{configurable:true,value:format=>{
    if(disposed||!paused||graphicsLoading||presentationHost.mode!=='canvas')return false;
    return canvasPresentation?.selectDriverFormat({kart,pose:racerKart.presentationPose(),gates:gateObjects},format)||false;
  }});
  if(import.meta.env.DEV)Object.defineProperty(mount,"racerDriverComparison",{configurable:true,value:()=>{
    if(disposed||!paused||graphicsLoading||presentationHost.mode!=='canvas')return null;
    const beforeTime=timeMs,beforeKart=JSON.stringify(kart),beforeEvidence=JSON.stringify(evidence);
    const result=canvasPresentation?.compareDriverCandidate({kart,pose:racerKart.presentationPose(),gates:gateObjects});
    return result?{...result,timeBefore:beforeTime,timeAfter:timeMs,controllerUnchanged:beforeKart===JSON.stringify(kart),evidenceUnchanged:beforeEvidence===JSON.stringify(evidence)}:null;
  }});
  startLevel();
  const loop = createFrameLoop(tick);
  loop.start();
  opts.registerCleanup?.(() => loop.stop());

  function pause() {
    if(disposed)return;
    saveCurrentRace();
    clearControls();
    frameTelemetry.reset();
    physicsClock.reset();
    if (paused) return;
    paused = true;
    pausedFrameRendered = false;
    savedRunning = running;
    running = false;
  }

  let introActive = false;
  function resume() {
    if (disposed || !paused || introActive) return;
    paused = false;
    pausedFrameRendered = false;
    physicsClock.reset();
    last = performance.now();
    if (savedRunning) running = true;
  }

  detachContextGuard = presentationHost.mode==='canvas'?()=>{}:attachContextLossGuard(renderer, {
    onLost: () => switchToCanvas('webgl-context-lost'),
    onRestored: () => {
      premiumRender.restoreContext();
      resume();
    }
  });
  opts.registerCleanup?.(detachContextGuard);

  function teardown() {
    if(disposed)return;
    saveCurrentRace();
    disposed=true;
    running=false;
    loadGeneration += 1;
    canvasPresentation?.dispose();
    if (import.meta.env.DEV){delete mount.racerInspection;delete mount.racerGroundComparison;delete mount.racerSamplingComparison;delete mount.racerSamplingDiagnostic;delete mount.racerFrameRows;delete mount.racerPrepareDriverCandidate;delete mount.racerDriverFormat;delete mount.racerDriverComparison;}
    loop.stop();
    for (const timer of recordedCueTimers) window.clearTimeout(timer);
    recordedCueTimers.clear();
    stopCueAudio();
    detachContextGuard();
    motionQuery?.removeEventListener?.("change", syncMotionPreference);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", clearControls);
    gateVoice?.abort();
    targetVoice?.abort();

    detachSwipeSteer();
    detachResize();
    if (ship) {
      scene.remove(ship);
      racerKart?.dispose();
      disposeOwnedSportsPrimaryGroup(ship);
      if(ship.userData.engines)ship.userData.engines.length=0;
    }
    moonFog?.detach(gateGroup);
    moonFog?.dispose();
    disposeOwnedSportsWordGates(gateGroup,gateObjects);
    disposeOwnedSportsPrimaryGroup(trackGroup);
    disposeOwnedSportsPrimaryGroup(railGroup);
    racerScenery?.dispose();
    racerScenery = null;
    disposeOwnedSportsPrimaryGroup(sceneryGroup);
    disposeOwnedSportsPrimaryGroup(burstGroup);
    burstParticles=[];pulseObjects=[];roadTexture=null;
    premiumRender.destroy();
    if (scene.background?.isTexture)disposeOwnedSportsTexture(scene.background);
    scene.background=null;
    disposeRenderer(renderer, { forceContextLoss: true });
    for(const canvas of textureCanvasCache.values())canvas.width=canvas.height=1;
    textureCanvasCache.clear();
    if (hud.parentNode) hud.parentNode.removeChild(hud);
  }

  return { teardown, pause, resume,markSupported:reason=>supportReasons.add(String(reason||"mission-help")),
    debugSnapshot: () => import.meta.env.DEV ? mount.racerInspection : null };
}

export default function SoundRacerGame({
  difficulty = "easy",
  sessionSeed = 0, journey = null,
  startLevel = 0,
  progressScopeKey = "default",
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  onEngineReady,
  onSessionStart,
  resumedCheckpoint=false,
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
            sessionSeed, journey,
            startLevel,
            progressScopeKey,
            onScoreUpdate,
            onProgressUpdate,
            onComplete,
            onCheckpoint,
            onSessionStart,
            resumedCheckpoint,
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
  }, [difficulty, sessionSeed]);

  return (
    <div
      ref={mountRef}
      className="sound-racer"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
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
