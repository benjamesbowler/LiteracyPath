import { useEffect, useRef } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playTapSound,
  playWhoosh
} from "../../../../utils/audio/gameSfx.js";
import { speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import {
  selectSafariCapture,
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
      meadow: "/images/learn-games/ps1-arcade/sound-safari-meadow-bg-v1.webp",
      dino: "/images/learn-games/ps1-arcade/sound-safari-dino-bg-v1.webp",
      moonwood: "/images/learn-games/ps1-arcade/sound-safari-moonwood-bg-v1.webp"
    },
    palSpritesByWorld: {
      meadow: "/images/learn-games/word-bridge/meadow-pals.webp",
      dino: "/images/learn-games/word-bridge/dino-pals.webp",
      moonwood: "/images/learn-games/word-bridge/moonwood-pals.webp"
    },
    accentsByWorld: {
      meadow: { accent: "#7cff82", accent2: "#ffcf4a", panel: "rgba(8,42,31,.72)" },
      dino: { accent: "#66ffd6", accent2: "#ff934a", panel: "rgba(45,20,9,.74)" },
      moonwood: { accent: "#7cf8ff", accent2: "#ffd166", panel: "rgba(9,18,46,.78)" }
    },
    ladder: soundSafariLadder,
    stars: soundSafariStars
  }
};

const SAFARI_LAYOUTS = {
  4: [
    { x: 0.2, y: 0.36 },
    { x: 0.46, y: 0.32 },
    { x: 0.76, y: 0.42 },
    { x: 0.44, y: 0.6 }
  ],
  5: [
    { x: 0.2, y: 0.34 },
    { x: 0.48, y: 0.31 },
    { x: 0.78, y: 0.41 },
    { x: 0.3, y: 0.56 },
    { x: 0.6, y: 0.6 }
  ],
  6: [
    { x: 0.18, y: 0.34 },
    { x: 0.42, y: 0.3 },
    { x: 0.68, y: 0.35 },
    { x: 0.31, y: 0.54 },
    { x: 0.57, y: 0.6 },
    { x: 0.82, y: 0.5 }
  ],
  7: [
    { x: 0.17, y: 0.33 },
    { x: 0.4, y: 0.29 },
    { x: 0.64, y: 0.34 },
    { x: 0.84, y: 0.45 },
    { x: 0.29, y: 0.55 },
    { x: 0.52, y: 0.62 },
    { x: 0.74, y: 0.58 }
  ],
  8: [
    { x: 0.16, y: 0.32 },
    { x: 0.37, y: 0.29 },
    { x: 0.58, y: 0.32 },
    { x: 0.8, y: 0.4 },
    { x: 0.26, y: 0.52 },
    { x: 0.47, y: 0.6 },
    { x: 0.68, y: 0.59 },
    { x: 0.86, y: 0.56 }
  ]
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

// First-run onboarding: one intro card per device, dismissed forever after.
// Storage may be denied (private mode) — then the card shows again next
// session, but it must never crash the game.
function hasSeenOnboarding(kind) {
  try {
    return window.localStorage.getItem(`lp-arcade-onboarded-v1:${kind}`) === "1";
  } catch {
    return false;
  }
}

function markOnboardingSeen(kind) {
  try {
    window.localStorage.setItem(`lp-arcade-onboarded-v1:${kind}`, "1");
  } catch { /* storage denied: the card simply returns next session */ }
}

// Hint lines shrink to fit the panel instead of overflowing narrow screens.
function drawFittedHint(ctx, value, x, y, maxWidth, size, color) {
  let fitted = size;
  ctx.save();
  ctx.font = `700 ${fitted}px "Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif`;
  while (fitted > 12 && ctx.measureText(value).width > maxWidth) {
    fitted -= 1;
    ctx.font = `700 ${fitted}px "Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif`;
  }
  ctx.restore();
  text(ctx, value, x, y, fitted, color, "center", 700);
}

function drawOnboarding(ctx, state, config, theme, w, h) {
  if (!state.onboarding) return;
  ctx.save();
  ctx.fillStyle = "rgba(2,5,16,.84)";
  ctx.fillRect(0, 0, w, h);
  const panelW = Math.min(w * 0.86, 600);
  const panelH = Math.min(h * 0.66, 400);
  const px = (w - panelW) / 2;
  const py = (h - panelH) / 2;
  psxPanel(ctx, px, py, panelW, panelH, "rgba(3,8,18,.94)", `${theme.accent}aa`, 24);
  text(ctx, config.title, w / 2, py + panelH * 0.14, clamp(w * 0.05, 30, 52), theme.accent, "center", 900);
  text(ctx, config.action, w / 2, py + panelH * 0.25, clamp(w * 0.026, 17, 24), "#fff", "center", 900);

  // Picture-first rule: listen -> find the shown sound -> net the critter.
  // The text remains for readers/translation, but is no longer the only way a
  // pre-reader can understand the first-run card.
  const iconY = py + panelH * 0.39;
  const iconSize = clamp(panelH * 0.13, 42, 58);
  const iconXs = [w / 2 - iconSize * 1.65, w / 2, w / 2 + iconSize * 1.65];
  for (const iconX of iconXs) psxPanel(ctx, iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize, "rgba(255,255,255,.1)", `${theme.accent2}aa`, 9);
  text(ctx, "♪", iconXs[0], iconY + 2, iconSize * 0.62, theme.accent2, "center", 900);
  text(ctx, "sh", iconXs[1], iconY + 1, iconSize * 0.42, "#fff", "center", 900);
  text(ctx, "◎", iconXs[2], iconY + 2, iconSize * 0.62, theme.accent, "center", 900);
  text(ctx, "→", (iconXs[0] + iconXs[1]) / 2, iconY + 2, iconSize * 0.42, "#fff", "center", 900);
  text(ctx, "→", (iconXs[1] + iconXs[2]) / 2, iconY + 2, iconSize * 0.42, "#fff", "center", 900);
  const hints = config.onboardingHints || [];
  const hintSize = clamp(w * 0.021, 14, 20);
  const firstY = py + panelH * 0.57;
  const gap = panelH * 0.09;
  for (let i = 0; i < hints.length; i += 1) {
    drawFittedHint(ctx, hints[i], w / 2, firstY + i * gap, panelW * 0.86, hintSize, "#eaf8ff");
  }
  text(ctx, "Tap to play · or press any key", w / 2, py + panelH * 0.88, clamp(w * 0.024, 16, 22), theme.accent2, "center", 900);
  ctx.restore();
}

function plateText(ctx, value, x, y, maxWidth, maxSize, minSize = 24) {
  const label = String(value);
  let size = maxSize;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  do {
    ctx.font = `900 ${size}px "Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif`;
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
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c * 0.55, y);
  ctx.lineTo(x + w, y + c * 0.55);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c * 0.55, y + h);
  ctx.lineTo(x, y + h - c * 0.55);
  ctx.lineTo(x, y + c);
  ctx.closePath();
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

function drawBolt(ctx, x, y, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(0,0,0,.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI / 6 + i * Math.PI / 3;
    const px = x + Math.cos(angle) * 5;
    const py = y + Math.sin(angle) * 5;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
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

function drawPalSprite(ctx, image, frameIndex, centerX, footY, maxW, maxH) {
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
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, frame * frameW, 0, frameW, frameH, x, y, dw, dh);
  ctx.imageSmoothingEnabled = smoothing;
  return { x, y, w: dw, h: dh };
}

function drawCover(ctx, image, w, h, time = 0) {
  if (!image?.complete || !image.naturalWidth) return false;
  const cameraZoom = 1.035 + Math.sin(time * 0.22) * 0.006;
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight) * cameraZoom;
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const driftX = Math.sin(time * 0.16) * w * 0.018;
  const driftY = Math.cos(time * 0.12) * h * 0.012;
  ctx.drawImage(image, (w - dw) / 2 + driftX, (h - dh) / 2 + driftY, dw, dh);
  return true;
}

function drawFallback(ctx, w, h, theme, time) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#12324a");
  g.addColorStop(0.45, "#244b2f");
  g.addColorStop(1, "#06101d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 44; i += 1) {
    const x = ((i * 137 + time * 12) % (w + 160)) - 80;
    const y = h * 0.18 + ((i * 73) % Math.max(140, h * 0.62));
    ctx.fillStyle = i % 2 ? `${theme.accent}66` : `${theme.accent2}55`;
    ctx.beginPath();
    ctx.arc(x, y, 3 + (i % 4), 0, TWO_PI);
    ctx.fill();
  }
}

function drawScreenGrade(ctx, w, h) {
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.42, h * 0.12, w * 0.5, h * 0.48, h * 0.86);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(0.6, "rgba(2,6,18,.08)");
  vignette.addColorStop(1, "rgba(0,0,0,.58)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(0,0,0,.14)";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  ctx.fillStyle = "rgba(255,255,255,.035)";
  for (let y = 2; y < h; y += 4) ctx.fillRect(0, y, w, 1);

  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 240; i += 1) {
    ctx.fillRect((i * 83) % w, (i * 47) % h, 1, 1);
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (let y = 0; y < h; y += 8) {
    for (let x = (y / 8) % 2 ? 4 : 0; x < w; x += 8) {
      ctx.fillStyle = "rgba(0,0,0,.055)";
      ctx.fillRect(x, y, 4, 4);
    }
  }
  ctx.restore();
}

function drawWorldAtmosphere(ctx, state, theme, w, h) {
  const pulse = state.pulse || 0;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 10; i += 1) {
    const x = w * (0.12 + i * 0.085) + Math.sin(state.time * 0.55 + i) * 18;
    const y = h * (0.22 + (i % 4) * 0.1) + Math.cos(state.time * 0.42 + i) * 14;
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
  const t = state.time;
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
  const t = state.time;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  if (world === "dino") {
    for (let i = 0; i < 18; i += 1) {
      const p = (t * 0.22 + i * 0.137) % 1;
      const x = w * (0.12 + ((i * 0.29 + p * 0.18) % 0.82));
      const y = h * (0.2 + p * 0.58);
      ctx.fillStyle = `rgba(255,122,56,${0.1 + p * 0.28})`;
      ctx.beginPath();
      ctx.arc(x, y, 2 + p * 5, 0, TWO_PI);
      ctx.fill();
    }
    for (let i = 0; i < 6; i += 1) {
      const y = h * (0.58 + i * 0.055) + Math.sin(t * 0.8 + i) * 5;
      ctx.strokeStyle = `rgba(255,180,92,${0.08 + i * 0.015})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, y);
      ctx.bezierCurveTo(w * 0.34, y - 18, w * 0.62, y + 22, w * 0.88, y - 8);
      ctx.stroke();
    }
  } else if (world === "moonwood") {
    for (let i = 0; i < 16; i += 1) {
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
    for (let i = 0; i < 18; i += 1) {
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
  const t = state.time;
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
  plateText(ctx, label, x + w / 2, y + h * 0.56, w - 26, clamp(h * 0.72, 36, 54), 30);
  ctx.restore();
}

function drawHud(ctx, state, config, theme, w, h) {
  const leftW = Math.min(560, w - 32);
  psxPanel(ctx, 16, 14, leftW, 72, theme.panel, `${theme.accent}a8`, 18);
  drawBolt(ctx, 35, 33, theme.accent2);
  drawBolt(ctx, leftW - 6, 67, theme.accent);
  text(ctx, config.title, 54, 38, 25, theme.accent, "left", 900);
  text(ctx, config.action, 54, 66, 15, "#eaf8ff", "left", 700);

  const rightW = Math.min(360, w * 0.42);
  psxPanel(ctx, w - rightW - 16, 14, rightW, 72, "rgba(4,8,20,.78)", "rgba(255,255,255,.32)", 18);
  text(ctx, `${state.score} pts`, w - rightW + 18, 40, 23, "#fff", "left", 900);
  text(ctx, `Level ${state.stage + 1} of 10`, w - 30, 38, 18, theme.accent2, "right", 900);
  text(ctx, `Combo x${Math.max(1, state.combo)}`, w - 30, 65, 15, "#ffeaa0", "right", 800);

  const progressX = 24;
  const progressY = h - 24;
  const progressW = Math.min(420, w - 48);
  ctx.fillStyle = "rgba(2,7,18,.68)";
  roundedRect(ctx, progressX - 4, progressY - 5, progressW + 8, 19, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.16)";
  roundedRect(ctx, progressX, progressY, progressW, 9, 4);
  ctx.fill();
  ctx.fillStyle = theme.accent;
  roundedRect(ctx, progressX, progressY, progressW * state.progress, 9, 4);
  ctx.fill();
  for (let i = 1; i < 10; i += 1) {
    const x = progressX + (progressW * i) / 10;
    ctx.strokeStyle = "rgba(0,0,0,.58)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, progressY - 2);
    ctx.lineTo(x, progressY + 11);
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
    attempts: 0
  }));
}

function taskUnits(task) {
  return task.item.graphemes.length;
}

function neededSound(task) {
  return task?.item.graphemes[task.index] || "";
}

function speakGrapheme(grapheme) {
  const value = String(grapheme || "");
  if (!value) return;
  // speakPhoneme handles both letters and recorded digraphs (sh/ch/th/wh/ck/ng).
  // Sending a digraph through speak() incorrectly looks for a word named "sh".
  speakPhoneme(value);
}

function rotate(values, amount) {
  if (!values.length) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
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

function safariLayout(count) {
  return SAFARI_LAYOUTS[clamp(count, 4, 8)] || SAFARI_LAYOUTS[4];
}

function critterLabels(task, stage, taskIndex, difficulty) {
  const needed = neededSound(task);
  const distractors = unique([
    ...task.item.decoys,
    ...task.item.graphemes.filter(label => label !== needed)
  ]).filter(label => label !== needed);
  const count = challengeSettings(difficulty, stage).targetCount;
  const ordered = rotate(distractors, stage + taskIndex + task.index).slice(0, count - 1);
  const insertAt = (stage + taskIndex * 2 + task.index) % (ordered.length + 1);
  return [...ordered.slice(0, insertAt), needed, ...ordered.slice(insertAt)];
}

function drawSoundSlots(ctx, task, theme, w, h) {
  const slots = task.item.graphemes;
  const slotW = Math.min(82, (w - 90) / Math.max(4, slots.length));
  const startX = w / 2 - (slotW * slots.length) / 2;
  for (let i = 0; i < slots.length; i += 1) {
    const filled = i < task.index;
    const x = startX + i * slotW;
    psxPanel(ctx, x, h - 104, slotW - 8, 56, filled ? `${theme.accent}d8` : "rgba(4,9,20,.72)", filled ? "#f6ffe7" : "rgba(255,255,255,.33)", 11);
    if (filled) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `${theme.accent}45`;
      roundedRect(ctx, x + 5, h - 99, slotW - 18, 46, 4);
      ctx.fill();
      ctx.restore();
    }
    text(ctx, filled ? slots[i] : "", x + slotW / 2 - 4, h - 75, 23, filled ? "#07101d" : "#fff", "center", 900);
  }
}

function drawFieldGuide(ctx, task, theme, w, h, showNeeded) {
  const guideW = Math.min(560, w * 0.62);
  const x = w / 2 - guideW / 2;
  psxPanel(ctx, x, h * 0.112, guideW, 112, "rgba(3,8,18,.72)", `${theme.accent2}92`, 24);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `${theme.accent}18`;
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(x + 28 + i * (guideW - 56) / 8, h * 0.122, 3, 92);
  }
  ctx.restore();
  text(ctx, titleWord(task.item.word), w / 2, h * 0.156, clamp(w * 0.046, 35, 66), "#fff", "center", 900);
  if (showNeeded) {
    psxPanel(ctx, w / 2 - Math.min(280, guideW * 0.42) / 2, h * 0.198, Math.min(280, guideW * 0.42), 38, "rgba(0,0,0,.38)", `${theme.accent}86`, 10);
    text(ctx, `Next sound: ${neededSound(task)}`, w / 2, h * 0.222, clamp(w * 0.024, 20, 30), theme.accent, "center", 900);
  }

  // The whole field guide is a generous replay target; this speaker mark gives
  // pre-readers a persistent, language-independent way to hear the word again.
  const speakerX = x + guideW - 40;
  const speakerY = h * 0.156;
  ctx.save();
  ctx.fillStyle = `${theme.accent}2e`;
  ctx.strokeStyle = `${theme.accent}b8`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(speakerX, speakerY, 25, 0, TWO_PI);
  ctx.fill();
  ctx.stroke();
  text(ctx, "♪", speakerX, speakerY + 1, 27, theme.accent, "center", 900);
  ctx.restore();
}

function fieldGuideReplayBox(w, h) {
  const guideW = Math.min(560, w * 0.62);
  return { x: w / 2 - guideW / 2, y: h * 0.112, w: guideW, h: 112 };
}

function pointInside(box, x, y) {
  return Boolean(box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h);
}

function drawGuide(ctx, image, theme, w, h, time) {
  const baseX = clamp(w * 0.12, 78, 150);
  const baseY = h - clamp(h * 0.2, 110, 168);
  const size = clamp(w * 0.19, 128, 214);
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
  const bob = Math.sin(state.time * 3.1) * 0.035;
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
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, -308 * scale, -167 * scale, image.naturalWidth * scale, image.naturalHeight * scale);
    ctx.imageSmoothingEnabled = smoothing;
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
    x: critter.x + wobbleX,
    y: critter.y + wobbleY
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

function drawCritter(ctx, critter, needed, theme, time, world, sprite) {
  const center = critterCenter(critter, time);
  const spawn = easeOut(critter.spawnT ?? 1);
  const r = critter.r * (critter.scareT > 0 ? 0.94 + Math.sin(time * 36) * 0.04 : 1) * clamp(spawn, 0.24, 1);
  const [bright, dark] = CREATURE_COLORS[critter.color % CREATURE_COLORS.length];
  const isNeeded = critter.label === needed;
  const depth = critter.depth ?? 0.5;
  const footY = center.y + r * (0.72 + depth * 0.08);
  const spriteMaxH = r * (2.42 + depth * 0.62);
  const spriteMaxW = spriteMaxH * 1.14;
  const plateTextValue = String(critter.label);
  const plateW = clamp(122 + plateTextValue.length * 34 + r * 0.4, 146, 238);
  const plateH = clamp(r * 0.86, 58, 76);
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

  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(center.x + r * 0.1, footY - r * 0.03, r * 1.18, r * 0.22, 0, 0, TWO_PI);
  ctx.fill();

  const spriteReady = imageReady(sprite);
  if (spriteReady) {
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
    drawPalSprite(ctx, sprite, frame, center.x, footY, spriteMaxW, spriteMaxH);
    ctx.filter = "none";
    ctx.restore();
  } else {
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
  if (!state.coachT || !state.coachText) return;
  const p = clamp(state.coachT / 1.15, 0, 1);
  ctx.save();
  ctx.globalAlpha = p;
  psxPanel(ctx, w * 0.25, h * 0.615, w * 0.5, 48, "rgba(3,8,18,.72)", `${theme.accent}78`, 12);
  text(ctx, state.coachText, w / 2, h * 0.645, clamp(w * 0.018, 17, 24), "#eaf8ff", "center", 900);
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

function drawSafari(ctx, state, config, theme, images, w, h) {
  const task = state.currentTask;
  if (!task) return;
  // Easy always shows the needed sound; medium/hard reveal it only as an
  // adaptive hint after 2 mistakes on the current grapheme.
  const showHint = state.rank === 0 || task.attempts >= 2;
  drawWorldAtmosphere(ctx, state, theme, w, h);
  drawHabitatFloor(ctx, state, theme, w, h);
  drawWorldGeometry(ctx, state, theme, w, h, "back");
  drawWorldMotion(ctx, state, theme, w, h);
  drawFieldGuide(ctx, task, theme, w, h, showHint);
  const palSprite = images.pals[state.level?.world] || images.pals.meadow;
  for (const critter of [...state.critters].sort((a, b) => (a.hitY || a.y) - (b.hitY || b.y))) {
    drawCritter(ctx, critter, showHint ? neededSound(task) : "", theme, state.time, state.level?.world || "meadow", palSprite);
  }
  for (const burst of state.bursts) drawCaptureBurst(ctx, burst);
  drawSoundSlots(ctx, task, theme, w, h);
  drawWorldGeometry(ctx, state, theme, w, h, "front");
  drawGuide(ctx, images.guide, theme, w, h, state.time);
  drawNet(ctx, state, theme, w, h, images.net);

  if (state.judgementT > 0) {
    const p = clamp(state.judgementT / 0.72, 0, 1);
    const color = state.judgement === "CAUGHT" ? theme.accent : "#ff9aa8";
    text(ctx, state.judgement, w / 2, h * 0.55 - (1 - p) * 20, 34, color, "center", 900);
  }
  drawCoach(ctx, state, theme, w, h);
  drawWordClear(ctx, state, theme, w, h);
}

function startSoundSafariArcadeGame(mount, options) {
  const config = CONFIG[options.kind] || CONFIG["sound-safari"];
  const ladder = config.ladder(options.difficulty);
  const images = {
    guide: loadImage(config.guide),
    net: loadImage(config.net),
    backgrounds: Object.fromEntries(Object.entries(config.bgByWorld).map(([world, src]) => [world, loadImage(src)])),
    pals: Object.fromEntries(Object.entries(config.palSpritesByWorld).map(([world, src]) => [world, loadImage(src)]))
  };

  const { canvas, ctx } = createGameCanvas(mount);
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  let reduceMotion = motionQuery?.matches ?? prefersReducedMotion();
  const syncReducedMotion = event => { reduceMotion = Boolean(event.matches); };
  motionQuery?.addEventListener?.("change", syncReducedMotion);
  const { soundAllowed, sfx } = createSoundGate(options);

  const state = {
    stage: clamp(Number(options.startLevel) || 0, 0, 9),
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
    ended: false,
    onboarding: !hasSeenOnboarding(options.kind),
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
    critters: [],
    bursts: [],
    pointer: { x: 0, y: 0 },
    net: { x: 0, y: 0, targetX: 0, targetY: 0, angle: 0, swingDir: 1, swingT: 0 }
  };

  let w = 1;
  let h = 1;
  let dpr = 1;

  function theme() {
    return config.accentsByWorld[state.level?.world] || config.accentsByWorld.meadow;
  }

  function resize() {
    const prevW = w;
    const prevH = h;
    const size = sizeCanvasToMount(mount, canvas, ctx);
    w = size.width;
    h = size.height;
    dpr = size.dpr;
    const hasNetPosition = state.net.x > 0 && state.net.y > 0;
    state.net.x = clamp(hasNetPosition ? state.net.x : w * 0.86, w * 0.12, w * 0.92);
    state.net.y = clamp(hasNetPosition ? state.net.y : h * 0.76, h * 0.2, h * 0.79);
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
    const first = state.tasks[0]?.item.word;
    return first ? `Net the sounds in ${titleWord(first)}` : config.action;
  }

  function startLevel() {
    state.level = ladder[state.stage];
    state.tasks = makeTasks(state.level);
    state.taskIndex = 0;
    state.combo = 0;
    state.bursts = [];
    state.wordClearT = 0;
    state.pendingAdvance = false;
    state.waveSeed = state.stage * 9;
    state.countdown = 3.0;
    setupTask();
    state.countdownTarget = countdownTarget();
    updateProgress();
  }

  function setupTask() {
    state.currentTask = state.tasks[state.taskIndex] || null;
    state.judgement = "";
    state.judgementT = 0;
    state.coachText = "";
    state.coachT = 0;
    if (!state.currentTask) return;
    if (!state.presentedTaskIds.has(state.currentTask.id)) {
      state.presentedTaskIds.add(state.currentTask.id);
      state.presentedUnits += taskUnits(state.currentTask);
    }
    // Held while the first-run card is up; dismissOnboarding says it instead.
    if (!state.onboarding && soundAllowed()) speakWord(state.currentTask.item.word);
    state.waveSeed += 1;
    setupCritters();
  }

  // First-run intro card: dropping the flag lets the frozen countdown start.
  // Independent of state.paused so the chrome pause and the card never fight.
  function dismissOnboarding() {
    if (!state.onboarding) return;
    state.onboarding = false;
    markOnboardingSeen(options.kind);
    if (state.currentTask && soundAllowed()) speakWord(state.currentTask.item.word);
  }

  function setupCritters() {
    const task = state.currentTask;
    if (!task || w < 10 || h < 10 || state.pendingAdvance) return;
    const challenge = challengeSettings(options.difficulty, state.stage);
    const labels = critterLabels(task, state.stage, state.taskIndex, options.difficulty);
    const styles = challenge.rank === 0 ? ["drift", "orbit"] : challenge.rank === 1 ? ["drift", "orbit", "zigzag"] : ["drift", "orbit", "zigzag", "peek"];
    const layout = safariLayout(labels.length);
    const crowdScale = labels.length >= 8 ? 0.66 : labels.length >= 7 ? 0.72 : labels.length >= 6 ? 0.8 : labels.length >= 5 ? 0.88 : 1;
    state.critters = labels.map((label, index) => {
      const position = layout[(index + state.waveSeed) % layout.length];
      const y = clamp(
        h * position.y + Math.cos(index * 1.7 + state.stage + task.index + state.waveSeed) * h * 0.011,
        h * 0.3,
        h - clamp(h * 0.34, 178, 244)
      );
      const depth = clamp((y - h * 0.28) / (h * 0.38), 0, 1);
      const x = clamp(
        w * position.x + Math.sin(index * 1.8 + state.stage + task.index + state.waveSeed) * w * 0.012,
        w * 0.12,
        w * 0.9
      );
      const moveStyle = styles[(index + state.stage + task.index + state.waveSeed) % styles.length];
      const speedScale = challenge.speed * (0.88 + (index % 4) * 0.12);
      return {
        label,
        x,
        y,
        homeX: x,
        homeY: y,
        depth,
        r: clamp(Math.min(w, h) * (0.046 + depth * 0.018) * crowdScale, 28, 58),
        vx: (index % 2 ? -1 : 1) * (7 + depth * 6 + state.stage * 0.75 + index) * speedScale,
        vy: (index % 3 - 1) * (3 + depth * 2.5) * speedScale,
        phase: state.stage * 1.4 + state.taskIndex * 0.9 + task.index * 0.6 + index * 1.7,
        wobble: 9 + depth * 7 + index,
        wobbleY: 5 + depth * 5 + (index % 3) * 2,
        wobbleSpeed: (0.78 + index * 0.08 + depth * 0.08) * speedScale,
        orbitX: w * (0.018 + (index % 3) * 0.012) * speedScale,
        orbitY: h * (0.012 + (index % 2) * 0.01) * speedScale,
        moveStyle,
        speedScale,
        color: index + state.stage + task.index,
        type: (index + state.stage) % 3,
        spriteFrame: (index + state.stage + task.index) % 4,
        scareT: 0,
        spawnT: 0,
        caught: false
      };
    });
  }

  // Resize must not rebuild critters: recreating them would resurrect caught
  // ones. Scale their positions into the new bounds instead.
  function repositionCritters(prevW, prevH) {
    if (!state.critters.length || prevW < 10 || prevH < 10) return;
    const scaleX = w / prevW;
    const scaleY = h / prevH;
    const maxY = h - clamp(h * 0.34, 178, 244);
    for (const critter of state.critters) {
      critter.x = clamp(critter.x * scaleX, w * 0.12, w * 0.9);
      critter.y = clamp(critter.y * scaleY, h * 0.3, maxY);
      critter.homeX = clamp(critter.homeX * scaleX, w * 0.12, w * 0.9);
      critter.homeY = clamp(critter.homeY * scaleY, h * 0.3, maxY);
      critter.orbitX *= scaleX;
      critter.orbitY *= scaleY;
    }
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

  function scheduleWordClear(task) {
    state.pendingAdvance = true;
    state.wordClearT = 1.08;
    state.wordClearLabel = `${titleWord(task.item.word)} complete`;
    state.wordsCompleted += 1;
    state.critters = [];
    sfx(playWhoosh);
  }

  function nextTask() {
    state.taskIndex += 1;
    state.pendingAdvance = false;
    if (state.taskIndex >= state.tasks.length) {
      finishLevel();
      return;
    }
    setupTask();
    updateProgress();
  }

  function finishLevel() {
    const nextStage = state.stage + 1;
    options.onCheckpoint?.(nextStage, ladder.length);
    if (nextStage >= ladder.length) {
      state.ended = true;
      state.progress = 1;
      options.onProgressUpdate?.(ladder.length, ladder.length);
      options.onComplete?.(soundSafariPresentedStars({
        correct: state.correct,
        presentedUnits: state.presentedUnits,
        mistakes: state.mistakes
      }), state.score, state.wordsCompleted);
      return;
    }
    state.stage = nextStage;
    startLevel();
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
      if (soundAllowed()) speakWord(task.item.word);
      setCoach("Listen, then catch each sound");
      return;
    }

    const hitEntries = state.critters
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
      // Medium/hard conceal the needed grapheme until the adaptive hint
      // unlocks (2 misses on this grapheme), matching drawSafari's showHint.
      setCoach(state.rank === 0 || task.attempts >= 2 ? `Find ${needed} next` : "Say the word slowly — which sound is next?");
      if (soundAllowed()) speakWord(task.item.word);
      return;
    }

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
      setCoach(state.rank === 0 || task.attempts >= 2 ? `Need ${needed} before ${hit.critter.label}` : "Not that one — listen to the word again!");
      sfx(playSoftBuzz);
      if (soundAllowed()) speakWord(task.item.word);
      return;
    }

    hit.critter.caught = true;
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
    task.found.push(needed);
    task.index += 1;
    task.attempts = 0;
    finishUnit(95);
    sfx(playPopSound);
    if (soundAllowed()) speakGrapheme(needed);
    updateProgress();
    if (task.index >= task.item.graphemes.length) {
      scheduleWordClear(task);
    } else {
      // Medium/hard: naming the next grapheme here would undo the concealment
      // (attempts resets on each catch), so coach without revealing it.
      setCoach(state.rank === 0 ? `Now find ${neededSound(task)}` : "Caught! Which sound is next?");
      state.waveSeed += 1;
      setupCritters();
    }
  }

  function pointerPosition(event) {
    return canvasPoint(canvas, event, w, h);
  }

  function onPointerMove(event) {
    const point = pointerPosition(event);
    state.pointer = point;
    state.net.targetX = clamp(point.x, w * 0.1, w * 0.93);
    state.net.targetY = clamp(point.y, h * 0.18, h * 0.79);
  }

  function onPointerDown(event) {
    const point = pointerPosition(event);
    state.pointer = point;
    if (state.onboarding) {
      dismissOnboarding();
      return;
    }
    captureAt(point.x, point.y);
  }

  function onKeyDown(event) {
    // Only game activation keys dismiss the card. Tab and assistive-tech or
    // browser shortcuts must continue to work while onboarding is visible.
    if (state.onboarding) {
      const activates = event.key === " " || event.key === "Enter" || event.key.startsWith("Arrow");
      if (!activates) return;
      event.preventDefault();
      dismissOnboarding();
      return;
    }
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

  function update(dt) {
    const motionDt = reduceMotion ? dt * 0.35 : dt;
    state.time += motionDt;
    state.pulse = Math.max(0, state.pulse - dt * 2.7);
    state.judgementT = Math.max(0, state.judgementT - dt);
    state.coachT = Math.max(0, state.coachT - dt);
    state.net.swingT = Math.max(0, state.net.swingT - dt);
    const prevNetX = state.net.x;
    const prevNetY = state.net.y;
    state.net.x += (state.net.targetX - state.net.x) * clamp(dt * 12, 0, 1);
    state.net.y += (state.net.targetY - state.net.y) * clamp(dt * 12, 0, 1);
    const moveTilt = clamp((state.net.x - prevNetX) * 0.018 + (state.net.y - prevNetY) * 0.01, -0.44, 0.44);
    state.net.angle += (moveTilt - state.net.angle) * clamp(dt * 9, 0, 1);
    state.countdown = Math.max(0, state.countdown - dt);

    for (const critter of state.critters) {
      critter.scareT = Math.max(0, critter.scareT - dt);
      critter.spawnT = Math.min(1, (critter.spawnT ?? 1) + dt * 2.5);
      const t = state.time + critter.phase;
      if (critter.moveStyle === "orbit") {
        const targetX = critter.homeX + Math.sin(t * 0.92 * critter.speedScale) * critter.orbitX;
        const targetY = critter.homeY + Math.cos(t * 0.78 * critter.speedScale) * critter.orbitY;
        critter.x += (targetX - critter.x) * clamp(motionDt * 2.4, 0, 1);
        critter.y += (targetY - critter.y) * clamp(motionDt * 2.1, 0, 1);
      } else if (critter.moveStyle === "zigzag") {
        critter.x += critter.vx * motionDt;
        critter.y += (critter.vy + Math.sin(t * 3.1) * 24 * critter.speedScale) * motionDt;
      } else if (critter.moveStyle === "peek") {
        const peek = Math.max(0, Math.sin(t * 1.35));
        const targetX = critter.homeX + Math.sin(t * 0.72) * critter.orbitX * 1.35;
        const targetY = critter.homeY - peek * critter.orbitY * 1.7;
        critter.x += (targetX - critter.x) * clamp(motionDt * 2.8, 0, 1);
        critter.y += (targetY - critter.y) * clamp(motionDt * 3.1, 0, 1);
      } else {
        critter.x += critter.vx * motionDt;
        critter.y += critter.vy * motionDt;
      }
      if (critter.scareT > 0) {
        critter.x += Math.cos(t * 4.7) * critter.scareT * 48 * motionDt;
        critter.y += Math.sin(t * 5.1) * critter.scareT * 30 * motionDt;
      }
      critter.depth = clamp((critter.y - h * 0.28) / (h * 0.38), 0, 1);
      const edgePad = Math.max(76, critter.r * 1.75);
      const minX = edgePad;
      const maxX = w - edgePad;
      const minY = h * 0.3;
      const maxY = h - clamp(h * 0.34, 178, 244);
      if (critter.x < minX || critter.x > maxX) {
        critter.x = clamp(critter.x, minX, maxX);
        critter.vx *= -1;
      }
      if (critter.y < minY || critter.y > maxY) {
        critter.y = clamp(critter.y, minY, maxY);
        critter.vy *= -1;
      }
    }

    state.bursts = state.bursts
      .map(burst => ({ ...burst, t: burst.t + dt }))
      .filter(burst => burst.t < burst.life);

    if (state.wordClearT > 0) {
      state.wordClearT = Math.max(0, state.wordClearT - dt);
      if (state.wordClearT === 0 && state.pendingAdvance) nextTask();
    }
  }

  function tickFrame(now, dt) {
    if (!state.paused && !state.ended && !state.onboarding) update(dt);
    draw();
  }

  const loop = createFrameLoop(tickFrame);

  function draw() {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const activeTheme = theme();
    const bg = images.backgrounds[state.level?.world] || images.backgrounds.meadow;
    if (!drawCover(ctx, bg, w, h, state.time)) drawFallback(ctx, w, h, activeTheme, state.time);
    drawSafari(ctx, state, config, activeTheme, images, w, h);
    drawScreenGrade(ctx, w, h);
    drawHud(ctx, state, config, activeTheme, w, h);
    drawCountdown(ctx, state, config, activeTheme, w, h);
    drawOnboarding(ctx, state, config, activeTheme, w, h);
    ctx.restore();
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("keydown", onKeyDown);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();
  startLevel();
  loop.start();

  const api = {
    pause() {
      state.paused = true;
    },
    resume() {
      state.paused = false;
      loop.reset();
    },
    destroy() {
      state.ended = true;
      loop.cancel();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      motionQuery?.removeEventListener?.("change", syncReducedMotion);
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    },
    debugSnapshot() {
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
        onboarding: state.onboarding,
        needed: neededSound(state.currentTask),
        currentTask: state.currentTask,
        critters: state.critters.map(critter => ({
          label: critter.label,
          x: critter.hitX || critter.x,
          y: critter.hitY || critter.y,
          r: critter.hitRadius || critter.r,
          labelBox: critter.labelBox,
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
  options.onEngineReady?.(api);
  return api;
}

export default function SoundSafariArcadeGame({
  kind,
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
  const handlersRef = useRef({
    onScoreUpdate,
    onProgressUpdate,
    onComplete,
    onCheckpoint,
    onEngineReady
  });

  useEffect(() => {
    soundRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  useEffect(() => {
    handlersRef.current = {
      onScoreUpdate,
      onProgressUpdate,
      onComplete,
      onCheckpoint,
      onEngineReady
    };
  }, [onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const engine = startSoundSafariArcadeGame(mountRef.current, {
      kind,
      difficulty,
      startLevel,
      onScoreUpdate: score => handlersRef.current.onScoreUpdate?.(score),
      onProgressUpdate: (current, total) => handlersRef.current.onProgressUpdate?.(current, total),
      onComplete: (stars, finalScore, total) => handlersRef.current.onComplete?.(stars, finalScore, total),
      onCheckpoint: (level, total) => handlersRef.current.onCheckpoint?.(level, total),
      onEngineReady: api => handlersRef.current.onEngineReady?.(api),
      getSound: () => soundRef.current
    });
    return () => engine.destroy();
  }, [kind, difficulty, startLevel]);

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
