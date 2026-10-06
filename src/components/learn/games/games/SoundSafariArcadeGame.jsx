import { phonicsTargetHint } from "../../../../utils/phonicsTargetPresentation.js";
import { createLearningDwell, LEARNING_PACE } from "../../../../utils/learningPace.js";
import { createBlenderWorldSprite } from '../shared/arcadeBlenderWorlds.js';
import { useEffect, useRef } from "react";
import { soundSafariLayout } from "../../../../utils/soundSafariLayout.js";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playTapSound,
  playWhoosh
} from "../../../../utils/audio/gameSfx.js";
import { speakPhoneme, speakWord, cancelSpeech } from "../../../../utils/learnGamesAudio.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import {
  selectSafariCapture,
  safariSoundKey,
  soundSafariLadder,
  soundSafariStars,
  soundSafariPresentedStars
} from "../../../../utils/soundSafariRounds.js";
import {
  TWO_PI,
  clamp,
  easeOut,
  titleWord,
  text,
  roundedRect,
  imageReady,
  createGameCanvas,
  sizeCanvasToMount,
  prefersReducedMotion,
  canvasPoint,
  createSoundGate,
  createScoreReporter,
  createFrameLoop
} from "../shared/canvasUtils.js";
import { laneDirectionForKey, verticalDirectionForKey } from "../shared/premiumGameStandard.js";
import { advanceSoundSafariWorld, createSoundSafariStepper, releaseSoundSafariNetInput } from "./soundSafariSimulation.js";
import { createSoundSafariCaptureMotion, soundSafariGuideSlot } from './soundSafariCaptureMotion.js';
import { SOUND_SAFARI_ATLASES, SOUND_SAFARI_HORIZONS, SOUND_SAFARI_HORIZON_SIZES } from "./soundSafariArt.generated.js";
import { createSoundSafariAuthoredView } from "./soundSafariAuthoredView.js";
import { buildSoundSafariRounds, commitSoundSafariCapture, newSoundSafariEvidence, soundSafariChoiceSoundKey, requestSoundSafariWordReplay, SOUND_SAFARI_CONSTRUCT } from "./soundSafariLearning.js";
import { createSoundSafariCue } from "./soundSafariCue.js";
import { SOUND_SAFARI_CONTENT_VERSION } from "../../../../data/arcadeContentVersions.js";
import { createSoundSafariCritters, repositionSoundSafariCritters } from './soundSafariCritters.js';
import { createSoundSafariPracticeSession, loadSoundSafariPracticeSession, restoreSoundSafariPracticeSession,
  saveSoundSafariPracticeSession } from './soundSafariPracticeSession.js';

const CONFIG = {
  "sound-safari": {
    title: "Sound Safari",
    action: "Net the sounds in order",
    onboardingHints: [
      "Listen to the word, then net its sounds in order.",
      "Tap a critter to catch it.",
      "Arrows move the net, Space catches."
    ],
    guide: "/images/learn-games/ps1-arcade/sound-safari-guide-v1.webp",
    net: "/images/learn-games/ps1-arcade/sound-safari-net-v1.webp",
    bgByWorld: {
      meadow: "/images/learn-games/arcade-scenes/safari-clearing.webp",
      dino: "/images/learn-games/ps1-arcade/sound-safari-dino-bg-v1.webp",
      moonwood: "/images/learn-games/ps1-arcade/sound-safari-moonwood-bg-v1.webp"
    },
    palSpritesByWorld: {
      meadow: "/images/learn-games/word-bridge/meadow-pals.webp",
      dino: "/images/learn-games/word-bridge/dino-pals.webp",
      moonwood: "/images/learn-games/word-bridge/moonwood-pals.webp"
    },
    accentsByWorld: {
      meadow: { accent: "#CCD5F4", accent2: "#ffcf4a", panel: "rgba(24,38,62,.72)" },
      dino: { accent: "#CCD5F4", accent2: "#ff934a", panel: "rgba(45,20,9,.74)" },
      moonwood: { accent: "#7cf8ff", accent2: "#ffd166", panel: "rgba(9,18,46,.78)" }
    },
    ladder: soundSafariLadder,
    stars: soundSafariStars
  }
};


const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 };
const CREATURE_COLORS = [
  ["#79fff3", "#10455c"],
  ["#ffe16a", "#745018"],
  ["#ff9776", "#71311e"],
  ["#94ff72", "#23552a"],
  ["#cba3ff", "#382861"],
  ["#f7f0d0", "#63572e"]
];

const SAFARI_RENDER_PROFILES = {
  low: {
    tier: "low",
    pixelRatioCap: 1,
    effectScale: 0.42,
    atmosphereMotes: 4,
    cameraMotion: 0.35,
    ambientMotion: 0.45,
    smoothingQuality: "medium"
  },
  medium: {
    tier: "medium",
    pixelRatioCap: 1.5,
    effectScale: 0.72,
    atmosphereMotes: 7,
    cameraMotion: 0.68,
    ambientMotion: 0.72,
    smoothingQuality: "high"
  },
  high: {
    tier: "high",
    pixelRatioCap: 2,
    effectScale: 1,
    atmosphereMotes: 10,
    cameraMotion: 1,
    ambientMotion: 1,
    smoothingQuality: "high"
  }
};

function detectSafariRenderProfile(reduceMotion = false) {
  const memory = Number(window.navigator?.deviceMemory) || 0;
  const cores = Number(window.navigator?.hardwareConcurrency) || 0;
  const constrained = (memory > 0 && memory <= 4) || (cores > 0 && cores <= 4);
  const balanced = (memory > 0 && memory <= 8) || (cores > 0 && cores <= 8);
  const profile = constrained
    ? SAFARI_RENDER_PROFILES.low
    : balanced
      ? SAFARI_RENDER_PROFILES.medium
      : SAFARI_RENDER_PROFILES.high;
  return {
    ...profile,
    cameraMotion: reduceMotion ? 0 : profile.cameraMotion,
    ambientMotion: reduceMotion ? 0 : profile.ambientMotion
  };
}

// Hint lines shrink to fit the panel instead of overflowing narrow screens.

function plateText(ctx, value, x, y, maxWidth, maxSize, minSize = 24) {
  const label = String(value);
  let size = maxSize;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  do {
    ctx.font = `900 ${size}px "Nunito", "Arial Rounded MT Bold", system-ui, sans-serif`;
    if (ctx.measureText(label).width <= maxWidth || size <= minSize) break;
    size -= 1;
  } while (size > minSize);
  ctx.lineWidth = Math.max(4, size * 0.12);
  ctx.strokeStyle = "rgba(255,255,255,.96)";
  ctx.strokeText(label, x, y);
  ctx.fillStyle = "#07101d";
  ctx.fillText(label, x, y);
  ctx.restore();
}

function psxPanel(ctx, x, y, w, h, color = "rgba(5,10,22,.72)", stroke = "rgba(255,255,255,.3)", cut = 16) {
  const c = Math.min(cut, w * 0.18, h * 0.42);
  ctx.save();
  roundedRect(ctx, x, y, w, h, c);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.25)";
  ctx.beginPath();
  ctx.moveTo(x + c + 4, y + 5);
  ctx.lineTo(x + w - c * 0.8, y + 5);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,.48)";
  ctx.beginPath();
  ctx.moveTo(x + c * 0.8, y + h - 5);
  ctx.lineTo(x + w - c - 4, y + h - 5);
  ctx.stroke();
  ctx.restore();
}


function lowPolyShape(ctx, points, fill, stroke = "rgba(0,0,0,.38)") {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point[0], point[1]);
    else ctx.lineTo(point[0], point[1]);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function drawPalSprite(ctx, image, frameIndex, centerX, footY, maxW, maxH, smoothingQuality = "high") {
  if (!imageReady(image)) return null;
  const frameCount = 4;
  const frameW = image.naturalWidth / frameCount;
  const frameH = image.naturalHeight;
  const scale = Math.min(maxW / frameW, maxH / frameH);
  const dw = frameW * scale;
  const dh = frameH * scale;
  const frame = ((frameIndex % frameCount) + frameCount) % frameCount;
  const x = centerX - dw / 2;
  const y = footY - dh;
  const smoothing = ctx.imageSmoothingEnabled;
  const previousQuality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = smoothingQuality;
  ctx.drawImage(image, frame * frameW, 0, frameW, frameH, x, y, dw, dh);
  ctx.imageSmoothingEnabled = smoothing;
  ctx.imageSmoothingQuality = previousQuality;
  return { x, y, w: dw, h: dh };
}

function drawCover(ctx, image, w, h, time = 0, cameraMotion = 1) {
  if (!image?.complete || !image.naturalWidth) return false;
  const cameraZoom = 1.025 + cameraMotion * (0.01 + Math.sin(time * 0.22) * 0.006);
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight) * cameraZoom;
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const driftX = Math.sin(time * 0.16) * w * 0.018 * cameraMotion;
  const driftY = Math.cos(time * 0.12) * h * 0.012 * cameraMotion;
  ctx.drawImage(image, (w - dw) / 2 + driftX, (h - dh) / 2 + driftY, dw, dh);
  return true;
}

function drawFallback(ctx, w, h, theme, time, effectScale = 1) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#12324a");
  g.addColorStop(0.45, "#244b2f");
  g.addColorStop(1, "#06101d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const moteCount = Math.max(16, Math.round(44 * effectScale));
  for (let i = 0; i < moteCount; i += 1) {
    const x = ((i * 137 + time * 12) % (w + 160)) - 80;
    const y = h * 0.18 + ((i * 73) % Math.max(140, h * 0.62));
    ctx.fillStyle = i % 2 ? `${theme.accent}66` : `${theme.accent2}55`;
    ctx.beginPath();
    ctx.arc(x, y, 3 + (i % 4), 0, TWO_PI);
    ctx.fill();
  }
}

function drawSceneLighting(ctx, w, h, theme, renderProfile) {
  ctx.save();
  const keyLight = ctx.createRadialGradient(w * 0.76, h * 0.16, 0, w * 0.76, h * 0.16, h * 0.74);
  keyLight.addColorStop(0, `${theme.accent2}38`);
  keyLight.addColorStop(0.34, `${theme.accent2}16`);
  keyLight.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.72 + renderProfile.effectScale * 0.28;
  ctx.fillStyle = keyLight;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  const depthHaze = ctx.createLinearGradient(0, h * 0.22, 0, h * 0.76);
  depthHaze.addColorStop(0, "rgba(220,238,248,0)");
  depthHaze.addColorStop(0.52, `${theme.accent}12`);
  depthHaze.addColorStop(0.7, "rgba(7,18,28,.08)");
  depthHaze.addColorStop(1, "rgba(1,5,12,.26)");
  ctx.fillStyle = depthHaze;
  ctx.fillRect(0, 0, w, h);

  const vignette = ctx.createRadialGradient(w * 0.52, h * 0.42, h * 0.18, w * 0.52, h * 0.46, h * 0.9);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(0.68, "rgba(2,6,18,.035)");
  vignette.addColorStop(1, "rgba(0,3,10,.46)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawWorldAtmosphere(ctx, state, theme, w, h) {
  const pulse = state.pulse || 0;
  const renderProfile = state.renderProfile || SAFARI_RENDER_PROFILES.high;
  const ambientMotion = renderProfile.ambientMotion;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < renderProfile.atmosphereMotes; i += 1) {
    const x = w * (0.12 + i * 0.085) + Math.sin(state.time * 0.55 + i) * 18 * ambientMotion;
    const y = h * (0.22 + (i % 4) * 0.1) + Math.cos(state.time * 0.42 + i) * 14 * ambientMotion;
    const r = 10 + (i % 3) * 5 + pulse * 8;
    const g = ctx.createRadialGradient(x, y, 1, x, y, r * 3.4);
    g.addColorStop(0, i % 2 ? theme.accent : theme.accent2);
    g.addColorStop(0.22, `${i % 2 ? theme.accent : theme.accent2}8a`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.4, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();

  const ground = ctx.createLinearGradient(0, h * 0.68, 0, h);
  ground.addColorStop(0, "rgba(0,0,0,0)");
  ground.addColorStop(0.62, "rgba(2,10,10,.2)");
  ground.addColorStop(1, "rgba(0,0,0,.54)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const horizon = ctx.createLinearGradient(0, h * 0.36, 0, h * 0.7);
  horizon.addColorStop(0, `${theme.accent2}00`);
  horizon.addColorStop(0.48, `${theme.accent2}16`);
  horizon.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = horizon;
  ctx.fillRect(0, h * 0.32, w, h * 0.36);
  ctx.restore();
}

function drawHabitatFloor(ctx, state, theme, w, h) {
  const world = state.level?.world || "meadow";
  const t = state.time * (state.renderProfile?.ambientMotion ?? 1);
  const floorY = h * 0.54;
  const worldFloor = world === "dino" ? {
    near: "rgba(37,54,31,.56)",
    far: "rgba(82,50,32,.34)",
    pool: "rgba(255,116,56,.24)",
    edge: "rgba(48,92,55,.78)"
  } : world === "moonwood" ? {
    near: "rgba(18,34,54,.6)",
    far: "rgba(35,28,62,.42)",
    pool: "rgba(124,248,255,.2)",
    edge: "rgba(49,54,92,.78)"
  } : {
    near: "rgba(38,89,42,.58)",
    far: "rgba(68,103,55,.38)",
    pool: "rgba(255,207,74,.2)",
    edge: "rgba(41,118,55,.74)"
  };

  ctx.save();
  const floor = ctx.createLinearGradient(0, floorY, 0, h);
  floor.addColorStop(0, "rgba(0,0,0,0)");
  floor.addColorStop(0.32, worldFloor.far);
  floor.addColorStop(0.74, worldFloor.near);
  floor.addColorStop(1, "rgba(0,0,0,.58)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY - 8, w, h - floorY + 8);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (let i = 0; i < 9; i += 1) {
    const y = h * (0.57 + i * 0.043);
    const left = w * (0.07 + i * 0.01);
    const right = w * (0.93 - i * 0.012);
    ctx.fillStyle = `rgba(0,0,0,${0.07 + i * 0.012})`;
    ctx.beginPath();
    ctx.moveTo(left, y + Math.sin(t * 0.22 + i) * 3);
    ctx.bezierCurveTo(w * 0.32, y - 18, w * 0.64, y + 18, right, y - 6);
    ctx.lineTo(right, y + 10);
    ctx.bezierCurveTo(w * 0.64, y + 30, w * 0.32, y + 2, left, y + 16);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  for (let i = 0; i < 12; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side < 0 ? w * (0.04 + (i % 6) * 0.055) : w * (0.82 + (i % 6) * 0.035);
    const y = h * (0.62 + (i % 4) * 0.065) + Math.sin(t * 0.25 + i) * 3;
    const s = 30 + (i % 5) * 9;
    lowPolyShape(ctx, [
      [x - s * 0.8, y + s * 0.28],
      [x - s * 0.25, y - s * 0.42],
      [x + s * 0.62, y - s * 0.2],
      [x + s * 0.9, y + s * 0.34],
      [x + s * 0.1, y + s * 0.56]
    ], worldFloor.edge, "rgba(0,0,0,.24)");
  }

  for (let i = 0; i < 9; i += 1) {
    const x = w * (0.18 + i * 0.08) + Math.sin(t * 0.18 + i) * 6;
    const y = h * (0.62 + (i % 4) * 0.055);
    const rx = w * (0.035 + (i % 3) * 0.012);
    const ry = 14 + (i % 3) * 5;
    ctx.fillStyle = i % 2 === 0 ? worldFloor.near : worldFloor.edge;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, (i % 2 ? -0.16 : 0.12), 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 7; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side < 0 ? w * (0.1 + i * 0.035) : w * (0.9 - i * 0.038);
    const y = h * (0.7 + (i % 3) * 0.075) + Math.sin(t * 0.4 + i) * 4;
    const rx = w * (0.055 + (i % 3) * 0.018);
    ctx.fillStyle = worldFloor.pool;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, 10 + (i % 3) * 5, -0.08 * side, 0, TWO_PI);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < 15; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side < 0 ? w * (0.06 + (i % 7) * 0.045) : w * (0.94 - (i % 7) * 0.044);
    const y = h * (0.67 + (i % 5) * 0.055);
    const s = 18 + (i % 4) * 6;
    const leaf = world === "dino" ? "rgba(63,112,52,.72)" : world === "moonwood" ? "rgba(48,78,94,.66)" : "rgba(67,136,62,.7)";
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(side * (0.22 + (i % 3) * 0.08));
    for (let blade = 0; blade < 3; blade += 1) {
      lowPolyShape(ctx, [
        [0, 0],
        [side * (s * (0.16 + blade * 0.08)), -s * (0.86 + blade * 0.18)],
        [side * (s * (0.34 + blade * 0.12)), -s * (0.12 + blade * 0.12)]
      ], leaf, "rgba(0,0,0,.18)");
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawWorldMotion(ctx, state, theme, w, h) {
  const world = state.level?.world || "meadow";
  const renderProfile = state.renderProfile || SAFARI_RENDER_PROFILES.high;
  const t = state.time * renderProfile.ambientMotion;
  const effectCount = (count, minimum = 4) => Math.max(minimum, Math.round(count * renderProfile.effectScale));

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  if (world === "dino") {
    for (let i = 0; i < effectCount(18); i += 1) {
      const p = (t * 0.22 + i * 0.137) % 1;
      const x = w * (0.12 + ((i * 0.29 + p * 0.18) % 0.82));
      const y = h * (0.2 + p * 0.58);
      ctx.fillStyle = `rgba(255,122,56,${0.1 + p * 0.28})`;
      ctx.beginPath();
      ctx.arc(x, y, 2 + p * 5, 0, TWO_PI);
      ctx.fill();
    }
    for (let i = 0; i < effectCount(6, 2); i += 1) {
      const y = h * (0.58 + i * 0.055) + Math.sin(t * 0.8 + i) * 5;
      ctx.strokeStyle = `rgba(255,180,92,${0.08 + i * 0.015})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, y);
      ctx.bezierCurveTo(w * 0.34, y - 18, w * 0.62, y + 22, w * 0.88, y - 8);
      ctx.stroke();
    }
  } else if (world === "moonwood") {
    for (let i = 0; i < effectCount(16); i += 1) {
      const p = (t * 0.12 + i * 0.151) % 1;
      const x = w * (0.08 + ((i * 0.21 + Math.sin(t * 0.12 + i) * 0.04) % 0.86));
      const y = h * (0.18 + p * 0.62);
      ctx.strokeStyle = `${theme.accent}${Math.round(58 + p * 80).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 7 + p * 10, 0.1, Math.PI * 1.35);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < effectCount(18); i += 1) {
      const p = (t * 0.16 + i * 0.119) % 1;
      const x = w * (0.08 + ((i * 0.31 + p * 0.11) % 0.84));
      const y = h * (0.22 + p * 0.58);
      lowPolyShape(ctx, [[x, y], [x + 8, y - 4], [x + 16, y], [x + 8, y + 5]], `${theme.accent2}6a`, "rgba(0,0,0,.12)");
    }
  }
  ctx.restore();
}

function drawWorldGeometry(ctx, state, theme, w, h, layer = "back") {
  const world = state.level?.world || "meadow";
  const t = state.time * (state.renderProfile?.ambientMotion ?? 1);
  ctx.save();
  if (layer === "back") {
    ctx.globalAlpha = 0.72;
    for (let i = 0; i < 8; i += 1) {
      const x = w * (0.12 + i * 0.11) + Math.sin(t * 0.18 + i) * 5;
      const y = h * (0.55 + (i % 3) * 0.045);
      const s = 22 + (i % 4) * 7;
      const color = world === "dino" ? "rgba(58,42,34,.72)" : world === "moonwood" ? "rgba(25,48,58,.68)" : "rgba(38,83,45,.62)";
      lowPolyShape(ctx, [[x - s, y + s], [x - s * 0.52, y - s * 0.35], [x + s * 0.2, y - s * 0.72], [x + s, y + s * 0.48]], color, "rgba(255,255,255,.09)");
    }
    if (world === "dino") {
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 5; i += 1) {
        const x = w * (0.24 + i * 0.13);
        const ember = ctx.createRadialGradient(x, h * 0.62, 2, x, h * 0.62, 60 + i * 8);
        ember.addColorStop(0, "rgba(255,147,74,.46)");
        ember.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = ember;
        ctx.beginPath();
        ctx.arc(x, h * 0.62, 60 + i * 8, 0, TWO_PI);
        ctx.fill();
      }
    }
    if (world === "moonwood") {
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = `${theme.accent}26`;
      ctx.lineWidth = 8;
      for (let i = 0; i < 5; i += 1) {
        const x = w * (0.2 + i * 0.16);
        ctx.beginPath();
        ctx.moveTo(x, h * 0.22);
        ctx.bezierCurveTo(x - 40, h * 0.4, x + 50, h * 0.54, x - 16, h * 0.76);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < 5; i += 1) {
      const x = w * (0.07 + i * 0.23) + Math.sin(t * 0.11 + i) * 8;
      const base = h * (0.57 + (i % 2) * 0.04);
      const trunk = world === "dino" ? "rgba(83,61,39,.72)" : world === "moonwood" ? "rgba(42,38,66,.72)" : "rgba(51,77,42,.7)";
      const crown = world === "dino" ? "rgba(45,96,58,.68)" : world === "moonwood" ? "rgba(50,69,96,.62)" : "rgba(57,123,61,.66)";
      lowPolyShape(ctx, [
        [x - 12, base + 36],
        [x - 4, base - 72],
        [x + 18, base - 76],
        [x + 22, base + 38]
      ], trunk, "rgba(0,0,0,.26)");
      lowPolyShape(ctx, [
        [x - 72, base - 36],
        [x - 22, base - 118],
        [x + 62, base - 88],
        [x + 74, base - 18],
        [x + 8, base + 8]
      ], crown, "rgba(0,0,0,.18)");
      lowPolyShape(ctx, [
        [x - 50, base - 78],
        [x + 4, base - 150],
        [x + 84, base - 94],
        [x + 38, base - 48]
      ], `${theme.accent}32`, null);
    }
  } else {
    ctx.globalAlpha = 0.92;
    const leftColor = world === "dino" ? "rgba(32,72,34,.9)" : world === "moonwood" ? "rgba(18,35,43,.92)" : "rgba(28,84,39,.9)";
    const rightColor = world === "dino" ? "rgba(62,38,30,.86)" : world === "moonwood" ? "rgba(38,29,60,.86)" : "rgba(45,96,43,.86)";
    for (let i = 0; i < 6; i += 1) {
      const x = i < 3 ? w * (0.02 + i * 0.045) : w * (0.9 + (i - 3) * 0.04);
      const base = h * (0.93 + (i % 2) * 0.05);
      const tall = h * (0.18 + (i % 3) * 0.035);
      const color = i < 3 ? leftColor : rightColor;
      lowPolyShape(ctx, [[x, base], [x + 20, base - tall], [x + 42, base], [x + 16, base - tall * 0.36]], color, "rgba(0,0,0,.28)");
      lowPolyShape(ctx, [[x + 24, base + 8], [x + 55, base - tall * 0.78], [x + 82, base + 8], [x + 46, base - tall * 0.28]], color, "rgba(0,0,0,.28)");
    }
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.985, w * 0.52, h * 0.07, 0, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}

function drawSoundPlaque(ctx, label, x, y, w, h, theme, isNeeded, time) {
  const shimmer = 0.5 + Math.sin(time * 3.4 + x * 0.01) * 0.5;
  ctx.save();
  ctx.shadowColor = isNeeded ? `${theme.accent}88` : "rgba(0,0,0,.55)";
  ctx.shadowBlur = isNeeded ? 22 : 9;
  ctx.shadowOffsetY = 5;
  psxPanel(ctx, x + 7, y + 8, w, h, "rgba(0,0,0,.42)", "rgba(0,0,0,0)", 12);
  psxPanel(
    ctx,
    x,
    y,
    w,
    h,
    isNeeded ? "rgba(255,251,222,.98)" : "rgba(236,247,255,.98)",
    isNeeded ? `${theme.accent2}f0` : "rgba(7,18,34,.82)",
    12
  );
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = isNeeded ? `${theme.accent}42` : "rgba(255,255,255,.3)";
  roundedRect(ctx, x + 12, y + 8, w - 24, 7, 3);
  ctx.fill();
  ctx.strokeStyle = `${theme.accent}${Math.round(48 + shimmer * 48).toString(16).padStart(2, "0")}`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 18, y + h - 11);
  ctx.lineTo(x + w - 18, y + h - 11);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  plateText(ctx, label, x + w / 2, y + h * 0.56, w - 12, 34, 20);
  ctx.restore();
}

function drawHud(ctx, state, config, theme, w, h) {
  text(ctx, `${state.score} pts`, w - 16, h - 15, 16, "#fff", "right", 900);

  const progressX = 24;
  const progressY = h - 10;
  const progressW = Math.min(420, w - 150);
  ctx.fillStyle = "rgba(2,7,18,.68)";
  roundedRect(ctx, progressX - 4, progressY - 3, progressW + 8, 11, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.16)";
  roundedRect(ctx, progressX, progressY, progressW, 5, 2);
  ctx.fill();
  ctx.fillStyle = theme.accent;
  roundedRect(ctx, progressX, progressY, progressW * state.progress, 5, 2);
  ctx.fill();
  for (let i = 1; i < 10; i += 1) {
    const x = progressX + (progressW * i) / 10;
    ctx.strokeStyle = "rgba(0,0,0,.58)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, progressY - 2);
    ctx.lineTo(x, progressY + 6);
    ctx.stroke();
  }
}

function drawCountdown(ctx, state, config, theme, w, h) {
  if (state.countdown <= 0) return;
  ctx.save();
  ctx.fillStyle = "rgba(2,5,16,.76)";
  ctx.fillRect(0, 0, w, h);
  const scale = easeOut(1 - (state.countdown % 1));
  const main = state.countdown <= 0.65 ? "GO!" : String(Math.ceil(state.countdown));
  psxPanel(ctx, w * 0.2, h * 0.18, w * 0.6, h * 0.18, "rgba(3,8,18,.82)", `${theme.accent}9a`, 24);
  text(ctx, state.countdownTarget || config.action, w / 2, h * 0.27, clamp(w * 0.041, 25, 54), "#fff", "center", 900);
  ctx.translate(w / 2, h * 0.53);
  ctx.scale(0.86 + scale * 0.18, 0.86 + scale * 0.18);
  text(ctx, main, 0, 0, clamp(w * 0.13, 82, 170), main === "GO!" ? theme.accent : theme.accent2, "center", 900);
  ctx.restore();
}

function makeTasks(level) {
  return level.words.map((item, index) => ({
    type: "sound-safari",
    item,
    id: `${level.level}-${index}-${item.word}`,
    index: 0,
    found: [],
    attempts: 0,
    picture: null
  }));
}

function taskUnits(task) {
  return task.item.graphemes.length;
}

function neededSound(task) {
  return task?.item.graphemes[task.index] || "";
}

function difficultyRank(difficulty) {
  return DIFFICULTY_RANK[difficulty] ?? 0;
}

function challengeSettings(difficulty, stage) {
  const rank = difficultyRank(difficulty);
  return {
    rank,
    targetCount: clamp(4 + rank + Math.floor((stage + 1) / 3), 4, 8),
    speed: 1 + rank * 0.24 + stage * 0.045
  };
}


function drawSoundSlots(ctx, task, theme, w, h) {
  const slots = task.item.graphemes;
  for (let i = 0; i < slots.length; i += 1) {
    const filled = i < task.index;
    const box = soundSafariGuideSlot(i, slots.length, w, h);
    psxPanel(ctx, box.x, box.y, box.width, box.height, filled ? `${theme.accent}d8` : "rgba(4,9,20,.72)", filled ? "#FFFFFF" : "rgba(255,255,255,.33)", 11);
    if (filled) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `${theme.accent}45`;
      roundedRect(ctx, box.x + 5, box.y + 5, box.width - 10, box.height - 10, 4);
      ctx.fill();
      ctx.restore();
    }
    text(ctx, filled ? slots[i] : "", box.centre.x, box.centre.y, h < 360 ? 20 : 23, filled ? "#07101d" : "#fff", "center", 900);
  }
}

function drawFieldGuide(ctx, task, theme, w, h, showNeeded, coach = "") {
  const box = fieldGuideReplayBox(w, h);
  psxPanel(ctx, box.x, box.y, box.w, box.h, "rgba(255,249,224,.97)", "#929DAF", 14);
  const label = "Build the word";
  const caption = h < 360 && coach ? coach : showNeeded ? `Hint: ${phonicsTargetHint(task.item.word, task.attempts)}` : "";
  const picture = task.picture;
  if (picture?.complete && picture.naturalWidth) ctx.drawImage(picture, box.x + 6, box.y + 5, 48, 48);
  const textX = box.x + 62 + (box.w - 126) / 2;
  plateText(ctx, label, textX, box.y + (caption ? 20 : 28), box.w - 126, 22, 14);
  if (caption) plateText(ctx, caption, textX, box.y + 43, box.w - 126, 16, 12);
}

function fieldGuideReplayBox(w, h) {
  return soundSafariLayout(w, h, 4).guide;
}

function pointInside(box, x, y) {
  return Boolean(box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h);
}

function drawGuide(ctx, image, theme, w, h, time) {
  if (w < 800 || h < 440) return;
  const baseX = 92;
  const baseY = h - 108;
  const size = 148;
  const bob = Math.sin(time * 2.3) * 2.5;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.42)";
  ctx.beginPath();
  ctx.ellipse(baseX + size * 0.08, baseY + size * 0.42, size * 0.42, size * 0.1, 0, 0, TWO_PI);
  ctx.fill();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(baseX, baseY - size * 0.18, 5, baseX, baseY - size * 0.18, size * 0.7);
  glow.addColorStop(0, `${theme.accent}28`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(baseX, baseY - size * 0.18, size * 0.7, 0, TWO_PI);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  psxPanel(ctx, baseX - size * 0.48, baseY + size * 0.27, size * 0.92, 34, "rgba(3,9,18,.72)", `${theme.accent}84`, 10);
  text(ctx, "GUIDE", baseX - size * 0.02, baseY + size * 0.38, clamp(size * 0.105, 15, 21), theme.accent2, "center", 900);
  if (image?.complete && image.naturalWidth) {
    ctx.drawImage(image, baseX - size * 0.48, baseY - size * 0.7 + bob, size, size);
  } else {
    ctx.translate(baseX, baseY);
    ctx.fillStyle = theme.accent2;
    ctx.beginPath();
    ctx.arc(0, -42, 26, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = theme.accent;
    roundedRect(ctx, -28, -14, 56, 64, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

function drawNet(ctx, state, theme, w, h, image) {
  const net = state.net;
  const swing = net.swingT > 0 ? easeOut(net.swingT / 0.22) : 0;
  const scale = clamp(Math.min(w, h) * 0.0005, 0.29, 0.4);
  const ring = 98 * scale;
  const bob = Math.sin(state.time * 3.1) * 0.035 * (state.renderProfile?.ambientMotion ?? 1);
  const swingAngle = swing * (net.swingDir || 1) * 0.48;
  const angle = (net.angle || 0) + swingAngle + bob;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(net.x + 10, net.y + ring * 0.82, ring * 0.96, ring * 0.26, -0.12 + angle * 0.4, 0, TWO_PI);
  ctx.fill();

  if (swing > 0) {
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i += 1) {
      ctx.strokeStyle = `${i % 2 ? theme.accent : theme.accent2}${Math.round((0.2 - i * 0.026) * 255).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 9 - i;
      ctx.beginPath();
      ctx.moveTo(net.x - 70 - i * 9, net.y + 34 + i * 5);
      ctx.quadraticCurveTo(net.x - 18, net.y - 54 - i * 3, net.x + ring * 1.15, net.y - ring * 0.52);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  if (imageReady(image)) {
    ctx.save();
    ctx.translate(net.x, net.y);
    ctx.rotate(angle);
    const smoothing = ctx.imageSmoothingEnabled;
    const previousQuality = ctx.imageSmoothingQuality;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = state.renderProfile?.smoothingQuality || "high";
    ctx.drawImage(image, -308 * scale, -167 * scale, image.naturalWidth * scale, image.naturalHeight * scale);
    ctx.imageSmoothingEnabled = smoothing;
    ctx.imageSmoothingQuality = previousQuality;
    ctx.restore();
  } else {
    ctx.strokeStyle = "#f6f0d8";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(net.x, net.y, ring, ring * 0.74, -0.16 + angle, 0, TWO_PI);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `${theme.accent}aa`;
  ctx.lineWidth = 3 + swing * 4;
  ctx.beginPath();
  ctx.ellipse(net.x, net.y, ring + 8 + swing * 16, ring * 0.78 + 8, -0.16 + angle, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

function critterCenter(critter, time) {
  const wobbleX = Math.sin(time * critter.wobbleSpeed + critter.phase) * critter.wobble;
  const wobbleY = Math.cos(time * (critter.wobbleSpeed * 0.8) + critter.phase) * critter.wobbleY;
  return {
    x: clamp(critter.x + wobbleX, critter.homeX - critter.travelX, critter.homeX + critter.travelX),
    y: clamp(critter.y + wobbleY, critter.homeY - critter.travelY, critter.homeY + critter.travelY)
  };
}

function drawCritterAnchor(ctx, center, r, depth, world, theme, time) {
  const sway = Math.sin(time * 0.8 + center.x * 0.01) * r * 0.04;
  ctx.save();
  ctx.globalAlpha = 0.76 + depth * 0.2;
  if (world === "dino") {
    lowPolyShape(ctx, [
      [center.x - r * 1.22, center.y + r * 0.78],
      [center.x - r * 0.52, center.y + r * 0.34],
      [center.x + r * 0.86, center.y + r * 0.44],
      [center.x + r * 1.32, center.y + r * 0.86],
      [center.x + r * 0.08, center.y + r * 1.02]
    ], "rgba(70,52,42,.88)", "rgba(255,158,72,.2)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,119,58,.22)";
    ctx.beginPath();
    ctx.ellipse(center.x + r * 0.16, center.y + r * 0.78, r * 0.84, r * 0.16, 0, 0, TWO_PI);
    ctx.fill();
  } else if (world === "moonwood") {
    lowPolyShape(ctx, [
      [center.x - r * 1.05, center.y + r * 0.78],
      [center.x - r * 0.44 + sway, center.y + r * 0.24],
      [center.x + r * 0.5 + sway, center.y + r * 0.22],
      [center.x + r * 1.1, center.y + r * 0.78],
      [center.x + r * 0.18, center.y + r * 1.06]
    ], "rgba(31,35,62,.9)", `${theme.accent}33`);
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `${theme.accent}58`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center.x, center.y + r * 0.72, r * 0.82, 0.18, Math.PI * 0.86);
    ctx.stroke();
  } else {
    lowPolyShape(ctx, [
      [center.x - r * 1.28, center.y + r * 0.84],
      [center.x - r * 0.72 + sway, center.y + r * 0.42],
      [center.x + r * 0.82 + sway, center.y + r * 0.38],
      [center.x + r * 1.24, center.y + r * 0.82],
      [center.x + r * 0.06, center.y + r * 1.02]
    ], "rgba(42,85,43,.88)", "rgba(255,255,255,.12)");
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = `${theme.accent2}42`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(center.x - r * 0.9, center.y + r * 0.64);
    ctx.quadraticCurveTo(center.x, center.y + r * 0.36, center.x + r * 0.9, center.y + r * 0.64);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCreatureBody(ctx, critter, world, r, bright, dark, isNeeded, theme, time) {
  const light = isNeeded ? theme.accent : bright;
  if (world === "dino") {
    lowPolyShape(ctx, [[-r * 1.36, r * 0.06], [-r * 2.08, -r * 0.24], [-r * 1.12, -r * 0.32]], dark, "rgba(0,0,0,.32)");
    lowPolyShape(ctx, [[-r * 0.95, r * 0.38], [-r * 0.52, r * 0.92], [-r * 0.18, r * 0.42]], dark, "rgba(0,0,0,.34)");
    lowPolyShape(ctx, [[r * 0.12, r * 0.42], [r * 0.58, r * 0.96], [r * 0.88, r * 0.32]], dark, "rgba(0,0,0,.34)");
    lowPolyShape(ctx, [[-r * 1.06, r * 0.42], [-r * 0.72, -r * 0.44], [r * 0.62, -r * 0.5], [r * 1.16, r * 0.18], [r * 0.42, r * 0.68]], light, "rgba(0,0,0,.48)");
    lowPolyShape(ctx, [[r * 0.58, -r * 0.36], [r * 1.28, -r * 0.58], [r * 1.46, -r * 0.04], [r * 0.82, r * 0.18]], bright, "rgba(0,0,0,.42)");
    for (let i = 0; i < 4; i += 1) {
      lowPolyShape(ctx, [[-r * 0.56 + i * r * 0.34, -r * 0.53], [-r * 0.38 + i * r * 0.34, -r * 0.92], [-r * 0.2 + i * r * 0.34, -r * 0.5]], theme.accent2, "rgba(0,0,0,.34)");
    }
  } else if (world === "moonwood") {
    lowPolyShape(ctx, [[-r * 1.16, -r * 0.04], [-r * 1.78, -r * 0.72], [-r * 1.44, r * 0.48], [-r * 0.58, r * 0.24]], `${bright}96`, "rgba(0,0,0,.34)");
    lowPolyShape(ctx, [[r * 1.16, -r * 0.04], [r * 1.78, -r * 0.72], [r * 1.44, r * 0.48], [r * 0.58, r * 0.24]], `${bright}96`, "rgba(0,0,0,.34)");
    lowPolyShape(ctx, [[-r * 0.74, r * 0.62], [-r * 0.62, -r * 0.68], [-r * 0.2, -r * 1.02], [0, -r * 0.64], [r * 0.2, -r * 1.02], [r * 0.62, -r * 0.68], [r * 0.74, r * 0.62], [0, r * 0.98]], light, "rgba(0,0,0,.46)");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.3);
    glow.addColorStop(0, `${theme.accent}55`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.3, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  } else {
    lowPolyShape(ctx, [[-r * 1.28, -r * 0.08], [-r * 1.7, -r * 0.56], [-r * 1.32, r * 0.44], [-r * 0.56, r * 0.18]], `${bright}84`, "rgba(0,0,0,.26)");
    lowPolyShape(ctx, [[r * 1.28, -r * 0.08], [r * 1.7, -r * 0.56], [r * 1.32, r * 0.44], [r * 0.56, r * 0.18]], `${bright}84`, "rgba(0,0,0,.26)");
    lowPolyShape(ctx, [[-r * 0.94, r * 0.28], [-r * 0.52, -r * 0.56], [r * 0.46, -r * 0.62], [r * 0.98, r * 0.26], [r * 0.28, r * 0.78], [-r * 0.48, r * 0.68]], light, "rgba(0,0,0,.46)");
    lowPolyShape(ctx, [[-r * 0.4, -r * 0.56], [-r * 0.12, -r * 0.96], [r * 0.1, -r * 0.58]], theme.accent2, "rgba(0,0,0,.3)");
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, -r * 0.64);
    ctx.quadraticCurveTo(-r * 1.18, -r * 1.18, -r * 1.52, -r * 0.72);
    ctx.moveTo(r * 0.62, -r * 0.62);
    ctx.quadraticCurveTo(r * 1.04, -r * 1.08, r * 1.42, -r * 0.68);
    ctx.stroke();
  }

  lowPolyShape(ctx, [[-r * 0.62, -r * 0.42], [-r * 0.04, -r * 0.72], [r * 0.24, -r * 0.1], [-r * 0.22, r * 0.08]], "rgba(255,255,255,.24)", null);
  lowPolyShape(ctx, [[r * 0.16, -r * 0.08], [r * 0.74, -r * 0.34], [r * 0.64, r * 0.3], [r * 0.04, r * 0.5]], "rgba(0,0,0,.16)", null);

  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.beginPath();
  ctx.arc(-r * 0.24, -r * 0.2, r * 0.12, 0, TWO_PI);
  ctx.arc(r * 0.28, -r * 0.21, r * 0.12, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = "#07101d";
  ctx.beginPath();
  ctx.arc(-r * 0.23 + Math.sin(time * 2 + critter.phase) * r * 0.012, -r * 0.2, r * 0.052, 0, TWO_PI);
  ctx.arc(r * 0.29 + Math.sin(time * 2 + critter.phase) * r * 0.012, -r * 0.21, r * 0.052, 0, TWO_PI);
  ctx.fill();
}

function drawCritter(ctx, critter, theme, time, world, sprite, renderProfile, authoredView) {
  const center = critterCenter(critter, time);
  const spawn = easeOut(critter.spawnT ?? 1);
  const r = critter.r * (critter.scareT > 0 ? 0.94 + Math.sin(time * 36) * 0.04 : 1) * clamp(spawn, 0.24, 1);
  const [bright, dark] = CREATURE_COLORS[critter.color % CREATURE_COLORS.length];
  // Choice styling must never reveal the needed sound.
  const isNeeded = false;
  const depth = critter.depth ?? 0.5;
  const footY = center.y + r * (0.72 + depth * 0.08);
  const spriteMaxH = r * (2.42 + depth * 0.62);
  const spriteMaxW = spriteMaxH * 1.14;
  const plateTextValue = String(critter.label);
  const plateW = critter.plateWidth || 140;
  const plateH = 56;
  const plateY = footY - clamp(r * 0.04, 3, 8);

  critter.hitX = center.x;
  critter.hitY = center.y + r * 0.18;
  // Keep touch targets generous without letting them engulf adjacent critters;
  // ambiguous overlap is resolved separately by selectSafariCapture().
  critter.hitRadius = Math.max(r + 40, spriteMaxH * 0.52);
  critter.labelBox = {
    x: center.x - plateW / 2,
    y: plateY,
    w: plateW,
    h: plateH
  };

  drawCritterAnchor(ctx, center, r, depth, world, theme, time);
  ctx.save();
  ctx.globalAlpha = critter.caught ? 0.28 : 1;

  ctx.save();
  ctx.translate(center.x + r * 0.1, footY - r * 0.03);
  ctx.scale(1, 0.22);
  const contactShadow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.32);
  contactShadow.addColorStop(0, `rgba(0,0,0,${0.42 + depth * 0.12})`);
  contactShadow.addColorStop(0.56, "rgba(0,0,0,.24)");
  contactShadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = contactShadow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.32, 0, TWO_PI);
  ctx.fill();
  ctx.restore();

  const authoredBody = authoredView?.drawCritter(ctx, world, critter, time);
  const spriteReady = imageReady(sprite);
  if (!authoredBody && spriteReady) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(center.x, center.y, 4, center.x, center.y, spriteMaxH * 0.62);
    glow.addColorStop(0, `${theme.accent2}26`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(center.x, center.y, spriteMaxH * 0.62, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(center.x, footY);
    ctx.rotate(Math.sin(time * 1.45 + critter.phase) * 0.035);
    ctx.translate(-center.x, -footY);
    const frame = critter.spriteFrame + Math.floor(time * (critter.scareT > 0 ? 8 : 2.25) + critter.phase);
    ctx.filter = `hue-rotate(${((critter.color % 7) - 3) * 11}deg) saturate(1.08) contrast(1.04)`;
    drawPalSprite(
      ctx,
      sprite,
      frame,
      center.x,
      footY,
      spriteMaxW,
      spriteMaxH,
      renderProfile?.smoothingQuality || "high"
    );
    ctx.filter = "none";
    ctx.restore();
  } else if (!authoredBody) {
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(Math.sin(time * 1.6 + critter.phase) * 0.05);
    ctx.scale(0.9 + spawn * 0.1, 0.78 + spawn * 0.22);
    drawCreatureBody(ctx, critter, world, r, bright, dark, isNeeded, theme, time);
    ctx.restore();
  }

  drawSoundPlaque(ctx, plateTextValue, center.x - plateW / 2, plateY, plateW, plateH, theme, isNeeded, time);

  ctx.restore();
}

function drawCaptureBurst(ctx, burst) {
  const p = clamp(burst.t / burst.life, 0, 1);
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = burst.color;
  ctx.lineWidth = 5 * (1 - p) + 1;
  ctx.beginPath();
  ctx.arc(burst.x, burst.y, 18 + p * 92, 0, TWO_PI);
  ctx.stroke();
  for (let i = 0; i < 12; i += 1) {
    const angle = burst.seed + i * TWO_PI / 12;
    const dist = 16 + p * (34 + (i % 4) * 13);
    ctx.fillStyle = i % 2 ? burst.color : "#fffbd1";
    ctx.beginPath();
    ctx.arc(burst.x + Math.cos(angle) * dist, burst.y + Math.sin(angle) * dist, 5 * (1 - p), 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}

function drawCoach(ctx, state, theme, w, h) {
  if (h < 360 || !state.coachT || !state.coachText) return;
  const p = clamp(state.coachT / 1.15, 0, 1);
  ctx.save();
  ctx.globalAlpha = p;
  psxPanel(ctx, 12, h - 106, w - 24, 26, "rgba(3,8,18,.72)", `${theme.accent}78`, 12);
  text(ctx, state.coachText, w / 2, h - 93, clamp(w * 0.018, 12, 18), "#eaf8ff", "center", 900);
  ctx.restore();
}

function drawWordClear(ctx, state, theme, w, h) {
  if (!state.wordClearT) return;
  const p = clamp(state.wordClearT / 1.08, 0, 1);
  ctx.save();
  ctx.globalAlpha = p;
  ctx.fillStyle = "rgba(2,6,18,.32)";
  ctx.fillRect(0, h * 0.28, w, h * 0.26);
  text(ctx, state.wordClearLabel || "Word complete", w / 2, h * 0.39, clamp(w * 0.037, 30, 58), theme.accent, "center", 900);
  text(ctx, "Sounds caught in order", w / 2, h * 0.47, clamp(w * 0.018, 17, 24), "#fff", "center", 800);
  ctx.restore();
}

function drawSafari(ctx, state, config, theme, images, w, h, blenderWorld, reduceMotion, authoredView, captureMotion) {
  const task = state.currentTask;
  if (!task) return;
  // A partial sound hint becomes available only after two wrong attempts on
  // this grapheme, in every difficulty.
  const showHint = task.attempts >= 2;
  drawWorldAtmosphere(ctx, state, theme, w, h);
  if (!state.backgroundReady) {
    drawHabitatFloor(ctx, state, theme, w, h);
    drawWorldGeometry(ctx, state, theme, w, h, "back");
    blenderWorld?.drawLandscape(ctx,{width:w,height:h,ground:h*.88,time:state.time,world:state.level?.world,reducedMotion:reduceMotion,paused:state.paused});
  }
  drawWorldMotion(ctx, state, theme, w, h);
  if (!state.backgroundReady) drawWorldGeometry(ctx, state, theme, w, h, "front");
  const campSize = Math.min(175, h * .25);
  blenderWorld?.draw(ctx, w - campSize * 1.04, h * .96 - campSize, campSize, campSize, state.time, { reducedMotion: reduceMotion, paused: state.paused, opacity: .87 });
  drawFieldGuide(ctx, task, theme, w, h, showHint, state.coachT ? state.coachText : "");
  const palSprite = images.pals[state.level?.world] || images.pals.meadow;
  // Accepted creatures travel beneath the live choice/label layers. Their
  // illustration can never conceal a required sound or own another catch.
  for (const flight of captureMotion.sample(w, h, (slot, count) => soundSafariGuideSlot(slot, count, w, h).centre, reduceMotion)) {
    ctx.save(); ctx.globalAlpha = flight.opacity;
    if (!authoredView.drawCritter(ctx, state.level?.world || 'meadow', flight.critter, state.time)) {
      if (imageReady(palSprite)) drawPalSprite(ctx, palSprite, flight.critter.spriteFrame, flight.x, flight.y + flight.radius,
        flight.radius * 2.5, flight.radius * 2.5, state.renderProfile?.smoothingQuality || 'high');
      else {
        const [bright, dark] = CREATURE_COLORS[flight.critter.color % CREATURE_COLORS.length];
        ctx.translate(flight.x, flight.y);
        drawCreatureBody(ctx, flight.critter, state.level?.world || 'meadow', flight.radius, bright, dark, false, theme, state.time);
      }
    }
    ctx.restore();
  }
  for (const critter of [...state.critters].sort((a, b) => (a.hitY || a.y) - (b.hitY || b.y))) {
    if (critter.hidden) continue;
    drawCritter(
      ctx,
      critter,
      theme,
      state.time,
      state.level?.world || "meadow",
      palSprite,
      state.renderProfile,
      authoredView
    );
  }
  for (const burst of state.bursts) drawCaptureBurst(ctx, burst);
  drawSoundSlots(ctx, task, theme, w, h);
  const world = state.level?.world || "meadow";
  const netRadius = 98 * clamp(Math.min(w, h) * .0005, .29, .4);
  if (!authoredView?.drawOperatorAndNet(ctx, world, state, w, h, netRadius)) {
    drawGuide(ctx, images.guide, theme, w, h, state.time * (state.renderProfile?.ambientMotion ?? 1));
    drawNet(ctx, state, theme, w, h, images.net);
  }

  if (state.judgementT > 0) {
    const p = clamp(state.judgementT / 0.72, 0, 1);
    const color = state.judgement === "CAUGHT" ? theme.accent : "#ff9aa8";
    if (!state.coachT) text(ctx, state.judgement, w / 2, h - 93, 20 * p, color, "center", 900);
  }
  drawCoach(ctx, state, theme, w, h);
  drawWordClear(ctx, state, theme, w, h);
}

function startSoundSafariArcadeGame(mount, options) {
  const blenderWorld = createBlenderWorldSprite("sound-safari", mount, { landscape: true });
  const config = CONFIG[options.kind] || CONFIG["sound-safari"];
  const ladder = config.ladder(options.difficulty, options.sessionSeed);
  const journeyIndex = Number.isInteger(options.journey?.index) ? options.journey.index : 0;
  const learningRounds = buildSoundSafariRounds(ladder, options.difficulty, options.sessionSeed, journeyIndex);
  const heldSession = loadSoundSafariPracticeSession(options.progressScopeKey, options.difficulty, options.sessionSeed, journeyIndex, learningRounds);
  const originStage = heldSession?.originStage ?? clamp(Number(options.startLevel) || 0, 0, ladder.length - 1);
  const legacyResume = heldSession?.legacyResume ?? originStage > 0;
  let evidence = heldSession?.evidence || newSoundSafariEvidence();
  const supportReasons = heldSession?.supportReasons || {};
  const authoredView = createSoundSafariAuthoredView({ atlases: SOUND_SAFARI_ATLASES,
    horizons: SOUND_SAFARI_HORIZONS, horizonSizes: SOUND_SAFARI_HORIZON_SIZES });
  const images = {
    guide: loadImage(config.guide),
    net: loadImage(config.net),
    backgrounds: Object.fromEntries(Object.entries(config.bgByWorld).map(([world, src]) => [world, loadImage(src)])),
    pals: Object.fromEntries(Object.entries(config.palSpritesByWorld).map(([world, src]) => [world, loadImage(src)]))
  };

  const { canvas, ctx } = createGameCanvas(mount);
  const nativeControls = document.createElement('div');
  nativeControls.style.cssText = 'position:absolute;inset:0;z-index:3;pointer-events:none';
  nativeControls.setAttribute('role', 'group'); nativeControls.setAttribute('aria-label', 'Safari sounds and word replay');
  const replayButton = document.createElement('button'); replayButton.type = 'button';
  replayButton.setAttribute('aria-label', 'Hear the word');
  replayButton.style.cssText = 'position:absolute;right:12px;top:8px;width:56px;height:56px;border:0;border-radius:12px;background:#3454C8;color:#FFFFFF;pointer-events:auto;touch-action:manipulation;font:inherit;font-size:12px;font-weight:800;display:grid;place-content:center;gap:2px';
  const speaker = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  speaker.setAttribute('viewBox', '0 0 24 24'); speaker.setAttribute('width', '22'); speaker.setAttribute('height', '22'); speaker.setAttribute('aria-hidden', 'true');
  const speakerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  speakerPath.setAttribute('d', 'M3 9h4l5-4v14l-5-4H3z M16 8a6 6 0 0 1 0 8 M19 5a10 10 0 0 1 0 14');
  speakerPath.setAttribute('fill', 'none'); speakerPath.setAttribute('stroke', 'currentColor'); speakerPath.setAttribute('stroke-width', '2'); speakerPath.setAttribute('stroke-linecap', 'round'); speakerPath.setAttribute('stroke-linejoin', 'round');
  speaker.append(speakerPath); const replayLabel = document.createElement('span'); replayLabel.textContent = 'Hear';
  replayButton.append(speaker, replayLabel); nativeControls.append(replayButton); mount.append(nativeControls);
  const choiceButtons = new Map(); let focusNextChoice = false;
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  let reduceMotion = motionQuery?.matches ?? prefersReducedMotion();
  let renderProfile = detectSafariRenderProfile(reduceMotion);
  const syncReducedMotion = event => {
    reduceMotion = Boolean(event.matches);
    renderProfile = detectSafariRenderProfile(reduceMotion);
    state.renderProfile = renderProfile;
    resize();
  };
  const { soundAllowed, sfx } = createSoundGate(options);
  const cue = createSoundSafariCue({ speakWord, speakPhoneme, getSound: soundAllowed });

  const state = {
    stage: heldSession?.stage ?? clamp(Number(options.startLevel) || 0, 0, 9),
    rank: difficultyRank(options.difficulty),
    level: null,
    tasks: [],
    taskIndex: 0,
    currentTask: null,
    countdown: 0,
    countdownTarget: "",
    score: 0,
    combo: 0,
    correct: 0,
    mistakes: 0,
    wordsCompleted: 0,
    presentedUnits: 0,
    presentedTaskIds: new Set(),
    progress: 0,
    paused: false,
    saveHeld: false,
    ended: false,
    onboarding: false,
    time: 0,
    pulse: 0,
    judgement: "",
    judgementT: 0,
    coachText: "",
    coachT: 0,
    wordClearT: 0,
    wordClearLabel: "",
    pendingAdvance: false,
    waveSeed: 0,
    renderProfile,
    critters: [],
    bursts: [],
    pointer: { x: 0, y: 0 },
    net: { x: 0, y: 0, targetX: 0, targetY: 0, angle: 0, swingDir: 1, swingT: 0 }
  };
  const captureMotion = createSoundSafariCaptureMotion();

  let w = 1;
  let h = 1;
  let dpr = 1;
  let initialized = false, disposed = false, pendingPracticeSnapshot = null, pendingCompletion = false;
  let pendingCheckpoint = null;
  let completionReported = false, externalPause = false, sincePracticeSave = 0;
  let restoring = Boolean(heldSession);
  const saveNotice = document.createElement('div');
  saveNotice.hidden = true;
  saveNotice.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:20;max-width:calc(100% - 32px);padding:16px;border:2px solid #CCD5F4;border-radius:16px;background:#FFFFFF;color:#18263E;text-align:center;pointer-events:auto';
  const saveMessage = document.createElement('p'); saveMessage.textContent = 'Keep this safari open. Try saving again.';
  const retrySave = document.createElement('button'); retrySave.type = 'button'; retrySave.textContent = 'Try saving again';
  retrySave.style.cssText = 'min-width:160px;min-height:56px;padding:8px 16px;border:2px solid #CCD5F4;border-radius:12px;background:#3454C8;color:#FFFFFF;font:inherit;font-weight:800;touch-action:manipulation';
  saveNotice.append(saveMessage, retrySave); mount.append(saveNotice);
  motionQuery?.addEventListener?.("change", syncReducedMotion);

  function practiceSnapshot() {
    return createSoundSafariPracticeSession(state, { difficulty: options.difficulty, seed: options.sessionSeed, journeyIndex,
      originStage, legacyResume, evidence, supportReasons, width: w, height: h });
  }
  function persistPractice(snapshot = pendingPracticeSnapshot || practiceSnapshot()) {
    if (!initialized || disposed) return true;
    const receipt = saveSoundSafariPracticeSession(options.progressScopeKey, options.difficulty, snapshot);
    sincePracticeSave = 0;
    if (receipt.localSaved) { pendingPracticeSnapshot = null; state.saveHeld = false; saveNotice.hidden = true; return true; }
    pendingPracticeSnapshot = receipt.snapshot; state.saveHeld = true; state.paused = true;
    state.net.targetX = state.net.x; state.net.targetY = state.net.y;
    simulation.reset(); resultDwell?.pause(); cue.stop(); cancelSpeech();
    saveNotice.hidden = false; return false;
  }
  function resumePlay() {
    if (disposed || state.saveHeld || externalPause || document.hidden) return;
    state.paused = false; simulation.reset(); loop.reset();
    if (!state.ended && !state.pendingAdvance) void cue.play();
    if (resultDwell?.active) { resultDwell.waitFor(soundAllowed() ? cue.play() : undefined); resultDwell.resume(); }
  }
  function retryPracticeSave() {
    if (!pendingPracticeSnapshot || !persistPractice(pendingPracticeSnapshot)) return;
    if (pendingCheckpoint !== null) {
      options.onCheckpoint?.(pendingCheckpoint, ladder.length);
      pendingCheckpoint = null;
    }
    if (pendingCompletion) { pendingCompletion = false; reportCompletion(); }
    resumePlay();
  }
  retrySave.addEventListener('click', retryPracticeSave);
  const replayWord = () => {
    const round = learningRounds.find(item => item.stage === state.stage && item.wordSlot === state.taskIndex);
    const voice = requestSoundSafariWordReplay({ round, supportReasons,
      canReplay: () => !disposed && !state.paused && !state.ended && !state.saveHeld && !document.hidden && soundAllowed(),
      persist: persistPractice, play: () => cue.play() });
    if (!voice) return;
    if(resultDwell?.active)resultDwell.waitFor(voice);
    setCoach(state.pendingAdvance?'Word complete — listen again.':'Listen, then catch each sound');
  };
  replayButton.addEventListener('click', replayWord);

  function syncNativeChoices() {
    replayButton.disabled = !soundAllowed() || state.paused || state.ended;
    for (const [critter, button] of choiceButtons) {
      if (!state.critters.includes(critter)) { button.remove(); choiceButtons.delete(critter); }
    }
    for (const critter of state.critters) {
      let button = choiceButtons.get(critter);
      if (!button) {
        button = document.createElement('button'); button.type = 'button';
        button.setAttribute('aria-label', `Catch ${critter.label}`);
        button.style.cssText = 'position:absolute;min-width:56px;min-height:56px;border:0;border-radius:12px;background:transparent;color:transparent;pointer-events:auto;touch-action:manipulation';
        button.addEventListener('focus', () => { button.style.outline = '3px solid #3454C8'; button.style.outlineOffset = '3px'; });
        button.addEventListener('blur', () => { button.style.outline = 'none'; });
        button.addEventListener('keydown', event => { if (event.repeat && [' ', 'Enter'].includes(event.key)) event.preventDefault(); });
        button.addEventListener('pointermove', onPointerMove);
        button.addEventListener('click', event => {
          if (!state.critters.includes(critter) || critter.hidden || critter.caught || !critter.labelBox) return;
          const before = state.currentTask?.index, box = critter.labelBox;
          captureAt(box.x + box.w / 2, box.y + box.h / 2);
          if (event.detail === 0 && state.currentTask?.index !== before) focusNextChoice = true;
        });
        nativeControls.append(button); choiceButtons.set(critter, button);
      }
      const box = critter.labelBox;
      button.hidden = !box || critter.hidden || critter.caught || state.pendingAdvance || state.ended;
      button.disabled = state.paused;
      if (box) Object.assign(button.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${Math.max(56, box.w)}px`, height: `${Math.max(56, box.h)}px` });
    }
    if (focusNextChoice && !state.pendingAdvance) {
      const first = [...choiceButtons.values()].find(button => !button.hidden && !button.disabled);
      first?.focus({ preventScroll: true }); focusNextChoice = false;
    }
  }

  function theme() {
    return config.accentsByWorld[state.level?.world] || config.accentsByWorld.meadow;
  }

  function resize() {
    const prevW = w;
    const prevH = h;
    renderProfile = detectSafariRenderProfile(reduceMotion);
    state.renderProfile = renderProfile;
    const size = sizeCanvasToMount(mount, canvas, ctx);
    w = size.width;
    h = Math.max(220, mount.getBoundingClientRect().height || size.height);
    const cappedDpr = Math.min(size.dpr, renderProfile.pixelRatioCap);
    if (cappedDpr !== size.dpr || h !== size.height) {
      canvas.width = Math.floor(w * cappedDpr);
      canvas.height = Math.floor(h * cappedDpr);
      ctx.setTransform(cappedDpr, 0, 0, cappedDpr, 0, 0);
    }
    dpr = cappedDpr;
    const replay = soundSafariLayout(w, h, 4).replay;
    Object.assign(replayButton.style, { right: 'auto', left: `${replay.x}px`, top: `${replay.y}px` });
    const hasNetPosition = state.net.x > 0 && state.net.y > 0;
    state.net.x = clamp(hasNetPosition ? state.net.x * w / Math.max(1, prevW) : w * 0.86, w * 0.1, w * 0.93);
    state.net.y = clamp(hasNetPosition ? state.net.y * h / Math.max(1, prevH) : h * 0.76, h * 0.18, h * 0.79);
    state.net.targetX = state.net.x;
    state.net.targetY = state.net.y;
    repositionCritters(prevW, prevH);
  }

  const setScore = createScoreReporter(state, options);

  function levelUnits() {
    return state.tasks.reduce((sum, task) => sum + taskUnits(task), 0) || 1;
  }

  function updateProgress() {
    const clearedTasks = state.tasks.slice(0, state.taskIndex).reduce((sum, task) => sum + taskUnits(task), 0);
    const currentUnits = state.currentTask ? state.currentTask.index : 0;
    state.progress = clamp((state.stage + (clearedTasks + currentUnits) / levelUnits()) / ladder.length, 0, 1);
    options.onProgressUpdate?.(state.stage, ladder.length);
  }

  function countdownTarget() {
    return "Listen, then net the sounds";
  }

  function startLevel() {
    state.level = ladder[state.stage];
    void authoredView.preload(state.level.world);
    state.tasks = makeTasks(state.level);
    state.taskIndex = 0;
    state.combo = 0;
    state.bursts = [];
    state.wordClearT = 0;
    state.pendingAdvance = false;
    state.waveSeed = state.stage * 9 + (options.journey?.route || 0) * 5;
    state.countdown = 0;
    setupTask();
    state.countdownTarget = countdownTarget();
    updateProgress();
  }

  function setupTask() {
    captureMotion.clear();
    state.currentTask = state.tasks[state.taskIndex] || null;
    state.judgement = "";
    state.judgementT = 0;
    state.coachText = "";
    state.coachT = 0;
    if (!state.currentTask) return;
    cue.setRound(learningRounds.find(round => round.stage === state.stage && round.wordSlot === state.taskIndex));
    if (!state.presentedTaskIds.has(state.currentTask.id)) {
      state.presentedTaskIds.add(state.currentTask.id);
      state.presentedUnits += taskUnits(state.currentTask);
    }
    if (!state.onboarding && !restoring) void cue.play();
    state.waveSeed += 1;
    setupCritters();
  }

  function setupCritters() {
    const task = state.currentTask;
    if (!task || w < 10 || h < 10 || state.pendingAdvance) return;
    const round = learningRounds.find(item => item.stage === state.stage && item.wordSlot === state.taskIndex);
    state.critters = createSoundSafariCritters(round, { difficulty: options.difficulty,
      unitSlot: task.index, waveSeed: state.waveSeed, width: w, height: h });
  }

  // Resize must not rebuild critters: recreating them would resurrect caught
  // ones. Scale their positions into the new bounds instead.
  function repositionCritters(prevW, prevH) {
    if (!state.critters.length || prevW < 10 || prevH < 10) return;
    repositionSoundSafariCritters(state.critters, { width: w, height: h, previousWidth: prevW, previousHeight: prevH,
      waveSeed: state.waveSeed, needed: neededSound(state.currentTask) });
  }

  function setCoach(message) {
    state.coachText = message;
    state.coachT = 1.15;
  }

  function finishUnit(points = 90) {
    state.correct += 1;
    state.combo += 1;
    setScore(state.score + points + Math.min(6, state.combo) * 18);
    sfx(state.combo > 2 ? playStarChime : playCorrectChime);
  }

  let resultDwell = null, finalPhoneme = Promise.resolve();
  function scheduleWordClear(task) {
    const round = learningRounds.find(item => item.stage === state.stage && item.wordSlot === state.taskIndex);
    captureMotion.release(round.roundId);
    state.pendingAdvance = true;
    state.wordClearT = LEARNING_PACE.word / 1000;
    resultDwell?.cancel();
    resultDwell = createLearningDwell({ minimumMs: LEARNING_PACE.word, onAdvance: () => {} });
    const voice = Promise.resolve(finalPhoneme).then(current => current === false || state.paused || state.ended || state.currentTask !== task || !soundAllowed() ? undefined : cue.play());
    resultDwell.waitFor(voice);
    state.wordClearLabel = `${titleWord(task.item.word)} complete`;
    state.wordsCompleted += 1;
    state.critters = [];
    sfx(playWhoosh);
  }

  function nextTask() {
    state.taskIndex += 1;
    state.pendingAdvance = false;
    state.wordClearT = 0;
    if (state.taskIndex >= state.tasks.length) {
      finishLevel();
      return;
    }
    setupTask();
    updateProgress();
    persistPractice();
  }

  function finishLevel() {
    const nextStage = state.stage + 1;
    if (nextStage >= ladder.length) {
      state.ended = true;
      state.taskIndex = state.tasks.length - 1;
      state.pendingAdvance = false;
      state.progress = 1;
      if (!persistPractice()) { pendingCompletion = true; return; }
      reportCompletion();
      return;
    }
    state.stage = nextStage;
    startLevel();
    pendingCheckpoint = state.stage;
    if (persistPractice()) {
      options.onCheckpoint?.(pendingCheckpoint, ladder.length);
      pendingCheckpoint = null;
    }
  }

  function reportCompletion() {
    if (completionReported || state.saveHeld) return;
    completionReported = true;
    options.onProgressUpdate?.(ladder.length, ladder.length);
    options.onComplete?.(soundSafariPresentedStars({
      correct: state.correct, presentedUnits: state.presentedUnits, mistakes: state.mistakes
    }), state.score, state.wordsCompleted, {
      contentVersion: SOUND_SAFARI_CONTENT_VERSION, construct: SOUND_SAFARI_CONSTRUCT, practiceOnly: true,
      sessionSeed: options.sessionSeed, journeyIndex, originStage, legacyResume,
      nativeV2CaptureCount: evidence.firstResponses.length + evidence.assistedRetries.length,
      ...structuredClone(evidence)
    });
  }

  function captureAt(x, y) {
    const task = state.currentTask;
    if (!task || state.paused || state.ended || state.onboarding || state.countdown > 0 || state.pendingAdvance) return;
    state.net.targetX = clamp(x || state.net.x, w * 0.1, w * 0.93);
    state.net.targetY = clamp(y || state.net.y, h * 0.18, h * 0.79);
    state.net.swingDir = x < state.net.x ? -1 : 1;
    state.net.swingT = 0.22;
    sfx(playTapSound);

    if (pointInside(fieldGuideReplayBox(w, h), x, y)) {
      void cue.play();
      setCoach("Listen, then catch each sound");
      return;
    }

    const hitEntries = state.critters
      .filter(critter => !critter.hidden)
      .map(critter => {
        const center = critterCenter(critter, state.time);
        const labelBox = critter.labelBox;
        const inLabel = Boolean(
          labelBox &&
          x >= labelBox.x &&
          x <= labelBox.x + labelBox.w &&
          y >= labelBox.y &&
          y <= labelBox.y + labelBox.h
        );
        const distance = Math.hypot(x - (critter.hitX || center.x), y - (critter.hitY || center.y));
        return { critter, center, distance, inLabel };
      });

    const needed = neededSound(task);
    const hit = selectSafariCapture(hitEntries, needed);
    if (!hit) {
      evidence.motorEvents.emptySwings++;
      // Medium/hard conceal the needed grapheme until the adaptive hint
      // unlocks (2 misses on this grapheme), matching drawSafari's showHint.
      setCoach(task.attempts >= 2 ? `Find ${needed} next` : "Say the word slowly — which sound is next?");
      void cue.play();
      persistPractice();
      return;
    }

    const round = learningRounds.find(item => item.stage === state.stage && item.wordSlot === state.taskIndex);
    const result = commitSoundSafariCapture(evidence, round, task.index, hit.critter.label,
      state.critters.filter(critter => !critter.hidden).map(critter => critter.label), {
        ...cue.snapshot(), soundEnabled: soundAllowed(), modelUsed: task.attempts >= 2,
        supportReasons: supportReasons[round.roundId] || [], legacyResume
      });
    if (!result) return;
    evidence = result.evidence; evidence.motorEvents.catches++;

    if (hit.critter.label !== needed) {
      state.mistakes += 1;
      task.attempts += 1;
      state.combo = 0;
      state.judgement = "TRY AGAIN";
      state.judgementT = 0.72;
      state.pulse = 0.5;
      hit.critter.scareT = 0.7;
      hit.critter.vx += (hit.center.x >= x ? 1 : -1) * 60;
      hit.critter.vy += (hit.center.y >= y ? 1 : -1) * 34;
      setCoach(task.attempts >= 2 ? `Need ${needed} before ${hit.critter.label}` : `You caught ${hit.critter.label}. Listen again.`);
      sfx(playSoftBuzz);
      const selectedSoundKey = soundSafariChoiceSoundKey(round, task.index, hit.critter.label);
      const selectedSlot = task.index, selectedAttempt = task.attempts;
      const contrast = soundAllowed() && selectedSoundKey ? cue.playPhoneme(selectedSoundKey) : Promise.resolve(true);
      void contrast.then(current => {
        if (current && !state.paused && !state.ended && !state.saveHeld && state.currentTask === task
          && task.index === selectedSlot && task.attempts === selectedAttempt && soundAllowed()) return cue.play();
      });
      persistPractice();
      return;
    }

    hit.critter.caught = true;
    captureMotion.begin({ id: result.response.responseId, roundId: round.roundId, slot: task.index,
      slotCount: task.item.graphemes.length, critter: hit.critter,
      centre: { x: hit.critter.hitX || hit.center.x, y: hit.critter.hitY || hit.center.y },
      radius: hit.critter.hitRadius || hit.critter.r, width: w, height: h });
    state.bursts.push({
      x: hit.center.x,
      y: hit.center.y,
      t: 0,
      life: 0.62,
      seed: state.time + task.index,
      color: theme().accent
    });
    state.judgement = "CAUGHT";
    state.judgementT = 0.72;
    state.pulse = 1;
    const caughtSoundKey = safariSoundKey(task.item, task.index);
    task.found.push(needed);
    task.index += 1;
    task.attempts = 0;
    finishUnit(95);
    sfx(playPopSound);
    if (soundAllowed()) finalPhoneme = cue.playPhoneme(caughtSoundKey);
    updateProgress();
    if (task.index >= task.item.graphemes.length) {
      scheduleWordClear(task);
    } else {
      // Medium/hard: naming the next grapheme here would undo the concealment
      // (attempts resets on each catch), so coach without revealing it.
      setCoach("Caught! Which sound is next?");
      state.waveSeed += 1;
      setupCritters();
    }
    persistPractice();
  }

  function pointerPosition(event) {
    return canvasPoint(canvas, event, w, h);
  }

  function onPointerMove(event) {
    if (state.paused || state.ended) return;
    const point = pointerPosition(event);
    state.pointer = point;
    state.net.targetX = clamp(point.x, w * 0.1, w * 0.93);
    state.net.targetY = clamp(point.y, h * 0.18, h * 0.79);
  }

  function onPointerDown(event) {
    const point = pointerPosition(event);
    state.pointer = point;

    captureAt(point.x, point.y);
  }

  function releaseNetInput() { releaseSoundSafariNetInput(state); }

  function onKeyDown(event) {
    if (isInteractiveKeyTarget(event.target, event.key)) return;
    if (state.paused || state.ended) return;
    if (event.repeat && (event.key === " " || event.key === "Enter")) return;

    const move = 48;
    let handled = true;
    const horizontal = laneDirectionForKey(event.key);
    const vertical = verticalDirectionForKey(event.key);
    if (horizontal) state.net.targetX += move * horizontal;
    else if (vertical) state.net.targetY += move * vertical;
    else if (event.key === " " || event.key === "Enter") {
      captureAt(state.net.x, state.net.y);
    } else {
      handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    state.net.targetX = clamp(state.net.targetX, w * 0.1, w * 0.93);
    state.net.targetY = clamp(state.net.targetY, h * 0.18, h * 0.79);
  }

  const simulation = createSoundSafariStepper(state,
    dt => { captureMotion.advance(dt); return advanceSoundSafariWorld(state, dt, { height: h, reducedMotion: reduceMotion }); },
    () => { if (!resultDwell?.active) nextTask(); });

  function tickFrame(now, dt) {
    simulation.advance(dt);
    if (!state.paused && !state.ended) {
      sincePracticeSave += dt;
      if (sincePracticeSave >= 2) persistPractice();
    }
    draw();
  }

  const loop = createFrameLoop(tickFrame);

  function draw() {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const activeTheme = theme();
    if (state.currentTask) state.currentTask.picture = cue.picture;
    const bg = images.backgrounds[state.level?.world] || images.backgrounds.meadow;
    state.backgroundReady = authoredView.drawBackground(ctx, state.level?.world || "meadow", w, h)
      || drawCover(ctx, bg, w, h, state.time, renderProfile.cameraMotion);
    if (!state.backgroundReady) {
      drawFallback(ctx, w, h, activeTheme, state.time, renderProfile.effectScale);
    }
    drawSceneLighting(ctx, w, h, activeTheme, renderProfile);
    drawSafari(ctx, state, config, activeTheme, images, w, h, blenderWorld, reduceMotion, authoredView, captureMotion);
    drawHud(ctx, state, config, activeTheme, w, h);
    drawCountdown(ctx, state, config, activeTheme, w, h);

    ctx.restore();
    syncNativeChoices();
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointercancel", releaseNetInput);
  canvas.addEventListener("lostpointercapture", releaseNetInput);
  nativeControls.addEventListener("pointercancel", releaseNetInput);
  nativeControls.addEventListener("lostpointercapture", releaseNetInput);
  window.addEventListener("keydown", onKeyDown);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();
  startLevel();
  if (heldSession) {
    restoreSoundSafariPracticeSession(state, heldSession, w, h);
    cue.setRound(learningRounds.find(round => round.stage === state.stage && round.wordSlot === state.taskIndex));
    if (state.pendingAdvance) {
      resultDwell = createLearningDwell({ minimumMs: state.wordClearT * 1000, onAdvance: () => {} });
      resultDwell.waitFor(soundAllowed() ? cue.play() : undefined);
      state.wordClearLabel = `${titleWord(state.currentTask.item.word)} complete`;
    } else if (!state.ended) void cue.play();
    setScore(state.score); updateProgress();
  }
  restoring = false;
  initialized = true;
  options.onSessionStart?.();
  pendingCheckpoint = state.stage;
  if (persistPractice()) {
    options.onCheckpoint?.(pendingCheckpoint, ladder.length);
    pendingCheckpoint = null;
  }
  loop.start();

  const api = {
    pause() {
      externalPause = true; persistPractice();
      resultDwell?.pause(); cue.stop(); cancelSpeech();
      state.paused = true;
      releaseNetInput();
      simulation.reset();
    },
    resume() {
      externalPause = false; resumePlay();
    },
    destroy() {
      persistPractice(); disposed = true;
      resultDwell?.cancel(); cue.dispose(); cancelSpeech();
      captureMotion.dispose();
      authoredView.dispose();
      blenderWorld.dispose();
      state.ended = true;
      loop.cancel();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointercancel", releaseNetInput);
      canvas.removeEventListener("lostpointercapture", releaseNetInput);
      nativeControls.removeEventListener("pointercancel", releaseNetInput);
      nativeControls.removeEventListener("lostpointercapture", releaseNetInput);
      window.removeEventListener("keydown", onKeyDown);
      motionQuery?.removeEventListener?.("change", syncReducedMotion);
      retrySave.removeEventListener('click', retryPracticeSave); saveNotice.remove();
      replayButton.removeEventListener('click', replayWord); choiceButtons.clear(); nativeControls.remove();
      if (import.meta.env.DEV && window.__soundSafariSnapshot === snapshot) delete window.__soundSafariSnapshot;
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    },
    debugSnapshot({ history = true } = {}) {
      return {
        kind: options.kind,
        stage: state.stage,
        world: state.level?.world,
        difficulty: options.difficulty,
        targetCount: challengeSettings(options.difficulty, state.stage).targetCount,
        score: state.score,
        combo: state.combo,
        taskIndex: state.taskIndex,
        countdown: state.countdown,
        paused: state.paused,
        saveHeld: state.saveHeld, completionReported,
        ended: state.ended,
        net: { ...state.net },
        onboarding: state.onboarding,
        needed: neededSound(state.currentTask),
        currentTask: state.currentTask ? structuredClone({ ...state.currentTask, picture: null }) : null,
        simulation: simulation.inspect(),
        authoredArt: authoredView.inspect(),
        capturedCreatureMotion: captureMotion.inspect(),
        learning: { contentVersion: SOUND_SAFARI_CONTENT_VERSION, construct: SOUND_SAFARI_CONSTRUCT,
          sessionSeed: options.sessionSeed, journeyIndex, originStage, legacyResume, ...structuredClone(history ? evidence : {
            firstResponseCount:evidence.firstResponses.length,assistedRetryCount:evidence.assistedRetries.length,
            acceptedResponseCount:evidence.acceptedResponses.length,completionCount:evidence.completions.length,motorEvents:evidence.motorEvents }) },
        cue: cue.snapshot(),
        feedbackVoice: cue.feedbackSnapshot(), voiceMix: cue.mixSnapshot(),
        critters: state.critters.map(critter => ({
          hidden: Boolean(critter.hidden),
          label: critter.label,
          x: critter.hitX || critter.x,
          y: critter.hitY || critter.y,
          r: critter.hitRadius || critter.r,
          labelBox: critter.labelBox ? { ...critter.labelBox } : null,
          moveStyle: critter.moveStyle,
          caught: critter.caught
        })),
        judgement: state.judgement,
        coachText: state.coachText,
        presentedUnits: state.presentedUnits,
        reducedMotion: reduceMotion,
        wordClearT: state.wordClearT,
        backgroundReady: Boolean(images.backgrounds[state.level?.world]?.complete),
        guideReady: Boolean(images.guide?.complete),
        netReady: imageReady(images.net),
        palReady: Boolean(images.pals[state.level?.world]?.complete)
      };
    }
  };
  const snapshot = options => structuredClone(api.debugSnapshot(options));
  api.inspect = snapshot;
  api.markSupported = (reason = 'mission-help') => {
    const round = learningRounds.find(item => item.stage === state.stage && item.wordSlot === state.taskIndex);
    if (round && typeof reason === 'string' && reason.length > 0 && reason.length <= 80) {
      supportReasons[round.roundId] = [...new Set([...(supportReasons[round.roundId] || []), reason])].slice(-24);
      persistPractice();
    }
  };
  api.soundChanged = () => {
    cue.stop();cancelSpeech();
    if(state.paused||state.ended||!soundAllowed())return;
    const voice=cue.play();
    if(resultDwell?.active)resultDwell.waitFor(voice);
  };
  const onVisibility = () => {
    if (document.hidden) {
      persistPractice(); releaseNetInput(); state.paused = true;
      simulation.reset(); resultDwell?.pause(); cue.stop(); cancelSpeech();
    } else if (!externalPause) resumePlay();
  };
  const onBlur = () => { persistPractice(); releaseNetInput(); };
  document.addEventListener('visibilitychange', onVisibility); window.addEventListener('blur', onBlur);
  const destroy = api.destroy;
  api.destroy = () => { document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('blur', onBlur); destroy(); };
  if (import.meta.env.DEV) window.__soundSafariSnapshot = snapshot;
  options.onEngineReady?.(api);
  if (state.ended && !state.saveHeld) reportCompletion();
  return api;
}

export default function SoundSafariArcadeGame({
  kind,
  difficulty = "easy",
  sessionSeed = 0, journey = null,
  startLevel = 0,
  progressScopeKey = 'default',
  onSessionStart,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  onEngineReady,
  isSoundEnabled = true
}) {
  const mountRef = useRef(null);
  const soundRef = useRef(isSoundEnabled);
  const engineRef = useRef(null);
  const handlersRef = useRef({
    onScoreUpdate,
    onProgressUpdate,
    onComplete,
    onCheckpoint,
    onEngineReady,
    onSessionStart
  });

  useEffect(() => {
    soundRef.current = isSoundEnabled; engineRef.current?.soundChanged?.();
  }, [isSoundEnabled]);

  useEffect(() => {
    handlersRef.current = {
      onScoreUpdate,
      onProgressUpdate,
      onComplete,
      onCheckpoint,
      onEngineReady, onSessionStart
    };
  }, [onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, onSessionStart]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const engine = startSoundSafariArcadeGame(mountRef.current, {
      kind,
      difficulty,
      sessionSeed, journey,
      startLevel,
      progressScopeKey,
      onSessionStart: () => handlersRef.current.onSessionStart?.(),
      onScoreUpdate: score => handlersRef.current.onScoreUpdate?.(score),
      onProgressUpdate: (current, total) => handlersRef.current.onProgressUpdate?.(current, total),
      onComplete: (stars, finalScore, total, evidence) => handlersRef.current.onComplete?.(stars, finalScore, total, evidence),
      onCheckpoint: (level, total) => handlersRef.current.onCheckpoint?.(level, total),
      onEngineReady: api => handlersRef.current.onEngineReady?.(api),
      getSound: () => soundRef.current
    });
    engineRef.current = engine;
    return () => { engineRef.current = null; engine.destroy(); };
  }, [kind, difficulty, sessionSeed, startLevel, journey, progressScopeKey]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        overflow: "hidden",
        background: "#06101d"
      }}
      aria-label={CONFIG[kind]?.title || "Sound Safari"}
    />
  );
}
