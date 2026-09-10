import { useEffect, useRef } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playTapSound,
  playWhoosh
} from "../../../../utils/audio/gameSfx.js";
import { cancelSpeech, speakWord } from "../../../../utils/learnGamesAudio.js";
import { rhymePopLadder, rhymePopStars } from "../../../../utils/rhymePopLevels.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import {
  TWO_PI,
  clamp,
  easeOut,
  text,
  titleWord,
  roundedRect,
  cutRect,
  panel,
  drawCover,
  drawFallback,
  drawScreenGrade,
  createGameCanvas,
  sizeCanvasToMount,
  prefersReducedMotion,
  canvasPoint,
  createSoundGate,
  createScoreReporter,
  createFrameLoop
} from "../shared/canvasUtils.js";
import { isPrimaryActionKey, laneDirectionForKey } from "../shared/premiumGameStandard.js";

const CONFIG = {
  "rhyme-pop": {
    title: "Rhyme Pop",
    action: "Aim and pop a real rhyming word",
    onboardingHints: [
      "Aim with your mouse or finger.",
      "Tap or press Space to shoot.",
      "Tap the Rhymes-with sign to hear it again."
    ],
    bg: "/images/learn-games/ps1-arcade/rhyme-pop-bg.webp",
    bgByWorld: {
      dino: "/images/learn-games/ps1-arcade/rhyme-pop-dino-stage-v2.webp"
    },
    helper: "/images/learn-games/ps1-arcade/rhyme-pop-helper-v1.webp",
    accent: "#ffcf3d",
    accent2: "#3df0ff",
    ladder: rhymePopLadder,
    stars: rhymePopStars
  }
};

const RHYME_ORB_COLORS = [
  ["#58f6ff", "#103858"],
  ["#ffd94c", "#6a3700"],
  ["#ff6f83", "#60101a"],
  ["#b769ff", "#35105a"],
  ["#64ff89", "#0d4a28"]
];
const RHYME_BALLOON_ROWS = [0.18, 0.40, 0.26, 0.46, 0.20, 0.36, 0.30];

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

function drawOnboarding(ctx, state, config, w, h) {
  if (!state.onboarding) return;
  ctx.save();
  ctx.fillStyle = "rgba(2,5,16,.84)";
  ctx.fillRect(0, 0, w, h);
  const panelW = Math.min(w * 0.86, 600);
  const panelH = Math.min(h * 0.66, 400);
  const px = (w - panelW) / 2;
  const py = (h - panelH) / 2;
  panel(ctx, px, py, panelW, panelH, "rgba(4,9,20,.94)", `${config.accent}aa`);
  text(ctx, config.title, w / 2, py + panelH * 0.17, clamp(w * 0.05, 30, 52), config.accent, "center", 900);
  text(ctx, config.action, w / 2, py + panelH * 0.31, clamp(w * 0.026, 17, 24), "#fff", "center", 900);
  const hints = config.onboardingHints || [];
  const hintSize = clamp(w * 0.021, 14, 20);
  const firstY = py + panelH * 0.46;
  const gap = panelH * 0.125;
  for (let i = 0; i < hints.length; i += 1) {
    drawFittedHint(ctx, hints[i], w / 2, firstY + i * gap, panelW * 0.86, hintSize, "#dce8ff");
  }
  text(ctx, "Tap to play · or press any key", w / 2, py + panelH * 0.88, clamp(w * 0.024, 16, 22), config.accent2, "center", 900);
  ctx.restore();
}

function drawHud(ctx, state, config, w, h) {
  panel(ctx, 16, 14, Math.min(520, w - 32), 62, "rgba(7,10,24,.74)", `${config.accent}88`);
  text(ctx, config.title, 38, 35, 23, config.accent);
  text(ctx, config.action, 38, 61, 14, "#dce8ff", "left", 700);

  const rightW = Math.min(330, w * 0.42);
  panel(ctx, w - rightW - 16, 14, rightW, 62, "rgba(7,10,24,.74)", "rgba(255,255,255,.24)");
  text(ctx, `${state.score} pts`, w - rightW + 12, 36, 21, "#fff");
  text(ctx, `Level ${state.stage + 1} of 10`, w - 28, 36, 18, config.accent2, "right");
  text(ctx, `Combo x${Math.max(1, state.combo)}`, w - 28, 61, 14, "#ffeaa0", "right", 800);

  const progressX = 22;
  const progressY = h - 22;
  const progressW = Math.min(340, w - 44);
  ctx.fillStyle = "rgba(255,255,255,.18)";
  roundedRect(ctx, progressX, progressY, progressW, 10, 8);
  ctx.fill();
  ctx.fillStyle = config.accent;
  roundedRect(ctx, progressX, progressY, progressW * state.progress, 10, 8);
  ctx.fill();
}

function drawCountdown(ctx, state, config, w, h) {
  if (state.countdown <= 0) return;
  ctx.save();
  ctx.fillStyle = "rgba(2,5,16,.74)";
  ctx.fillRect(0, 0, w, h);
  const target = state.countdownTarget || config.action;

  if (state.countdownIntro && state.countdown > 3.05) {
    panel(ctx, w * 0.18, h * 0.28, w * 0.64, h * 0.26, "rgba(4,9,20,.82)", `${config.accent}aa`);
    text(ctx, target, w / 2, h * 0.385, clamp(w * 0.04, 28, 58), "#fff", "center", 900);
    text(ctx, "Get ready", w / 2, h * 0.475, 24, config.accent, "center", 900);
    ctx.restore();
    return;
  }

  const timer = Math.min(3, state.countdown);
  const scale = easeOut(1 - (timer % 1));
  const main = timer <= 0.65 ? "GO!" : String(Math.ceil(timer));
  text(ctx, target, w / 2, h * 0.32, clamp(w * 0.042, 25, 54), "#fff", "center");
  ctx.translate(w / 2, h * 0.52);
  ctx.scale(0.86 + scale * 0.18, 0.86 + scale * 0.18);
  text(ctx, main, 0, 0, clamp(w * 0.13, 82, 170), main === "GO!" ? config.accent : config.accent2, "center", 900);
  ctx.restore();
}

function makeTasks(kind, level) {
  return [{
    type: kind,
    level,
    targetWord: level.targetWord,
    totalRhymes: level.rhymingWords.length,
    correctFound: 0,
    remainingRhymes: [...level.rhymingWords],
    unusedDistractors: [...level.distractors],
    usedWords: [],
    attempts: 0
  }];
}

function taskUnits(kind, task) {
  if (kind === "rhyme-pop") return task.totalRhymes || task.level?.rhymingWords?.length || 1;
  return 1;
}

function totalUnits(kind, ladder) {
  return ladder.reduce((sum, level) => sum + makeTasks(kind, level).reduce((inner, task) => inner + taskUnits(kind, task), 0), 0);
}

function drawBubble(ctx, x, y, r, label, fill, stroke = "rgba(255,255,255,.8)") {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,.95)");
  g.addColorStop(0.22, fill);
  g.addColorStop(1, "rgba(30,50,90,.92)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  text(ctx, label, x, y, Math.max(18, r * 0.47), "#07101d", "center", 900);
}

function rhymeLauncherPoint(w, h) {
  return { x: w / 2, y: h * 0.825 };
}

// The "Rhymes with X" panel drawn by drawRhymeLauncher. Tapping it repeats the
// target word aloud instead of firing a shot.
function rhymeTargetPanelHit(x, y, w, h) {
  return x >= w * 0.34 && x <= w * 0.66 && y >= h * 0.65 && y <= h * 0.65 + 72;
}

// Deterministic Fisher-Yates shuffle so which slots hold the rhymes varies from
// round to round (not always the left side) but stays stable within a round.
function shuffleSeeded(arr, seed) {
  const a = [...arr];
  let s = (seed >>> 0) || 1;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rhymeBubbleCenter(bubble, now) {
  const wobbleX = Math.sin(now * bubble.wobbleSpeed + bubble.phase) * bubble.wobble;
  const wobbleY = Math.cos(now * (bubble.wobbleSpeed * 0.82) + bubble.phase) * bubble.wobbleY;
  return { x: bubble.x + wobbleX, y: bubble.y + wobbleY };
}

function rhymeCableY(w, x, h, now) {
  return h * 0.108 + Math.sin((x / Math.max(1, w)) * TWO_PI + now * 0.85) * 9;
}

function drawRhymeRigging(ctx, state, config, w, h) {
  ctx.save();
  const left = w * 0.08;
  const right = w * 0.92;
  const top = h * 0.078;
  const bottom = h * 0.118;
  const rail = ctx.createLinearGradient(left, top, right, bottom);
  rail.addColorStop(0, "rgba(30,14,7,.92)");
  rail.addColorStop(0.34, `${config.accent}cc`);
  rail.addColorStop(0.74, "rgba(92,45,18,.9)");
  rail.addColorStop(1, "rgba(255,239,168,.75)");

  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(0,0,0,.56)";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(left, top + 6);
  ctx.lineTo(right, bottom + 6);
  ctx.stroke();

  ctx.strokeStyle = rail;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  for (let i = 0; i <= 12; i += 1) {
    const x = left + ((right - left) / 12) * i;
    const y = top + (bottom - top) * ((x - left) / Math.max(1, right - left));
    ctx.strokeStyle = i % 2 ? "rgba(255,235,158,.46)" : "rgba(8,4,2,.58)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 9);
    ctx.lineTo(x + 18, y + 11);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,241,183,.68)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let i = 0; i <= 48; i += 1) {
    const x = (w / 48) * i;
    const y = rhymeCableY(w, x, h, state.time);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawRhymeStageFloor(ctx, state, w, h) {
  const topY = h * 0.69;
  const bottomY = h + 24;
  const center = w * 0.5;
  ctx.save();
  const floor = ctx.createLinearGradient(0, topY, 0, h);
  floor.addColorStop(0, "rgba(10,26,34,.24)");
  floor.addColorStop(0.54, "rgba(12,16,28,.58)");
  floor.addColorStop(1, "rgba(3,5,13,.96)");
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.moveTo(w * 0.16, topY);
  ctx.lineTo(w * 0.84, topY);
  ctx.lineTo(w * 1.04, bottomY);
  ctx.lineTo(w * -0.04, bottomY);
  ctx.closePath();
  ctx.fill();

  for (const side of [-1, 1]) {
    const innerTop = side < 0 ? w * 0.105 : w * 0.895;
    const innerBottom = side < 0 ? w * 0.045 : w * 0.955;
    const outerBottom = side < 0 ? -w * 0.025 : w * 1.025;
    const railGrad = ctx.createLinearGradient(innerTop, topY, innerBottom, h);
    railGrad.addColorStop(0, "rgba(255,243,180,.44)");
    railGrad.addColorStop(0.5, "rgba(27,44,64,.76)");
    railGrad.addColorStop(1, "rgba(2,5,14,.98)");
    ctx.fillStyle = railGrad;
    ctx.beginPath();
    ctx.moveTo(innerTop, topY);
    ctx.lineTo(innerBottom, bottomY);
    ctx.lineTo(outerBottom, bottomY);
    ctx.lineTo(side < 0 ? w * 0.055 : w * 0.945, topY + h * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = side < 0 ? "rgba(61,240,255,.48)" : "rgba(255,207,61,.5)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(innerTop, topY + 3);
    ctx.lineTo(innerBottom, h + 8);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,222,112,.28)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 10; i += 1) {
    const x = w * (0.18 + i * 0.064);
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(center + (x - center) * 2.35, bottomY);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 4; i += 1) {
    const laneX = w * (0.32 + i * 0.12);
    const color = RHYME_ORB_COLORS[i][0];
    const glow = ctx.createLinearGradient(laneX, topY, laneX, h);
    glow.addColorStop(0, `${color}00`);
    glow.addColorStop(0.5, `${color}22`);
    glow.addColorStop(1, `${color}58`);
    ctx.strokeStyle = glow;
    ctx.lineWidth = 26 + Math.sin(state.time * 2 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(laneX, topY + 8);
    ctx.lineTo(center + (laneX - center) * 1.7, h + 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRhymeProgressPips(ctx, task, config, w, h) {
  const total = task.totalRhymes || 1;
  const found = task.correctFound || 0;
  const gap = 24;
  const startX = w / 2 - ((total - 1) * gap) / 2;
  const y = h * 0.227;

  ctx.save();
  for (let i = 0; i < total; i += 1) {
    const filled = i < found;
    const x = startX + i * gap;
    ctx.fillStyle = filled ? config.accent : "rgba(255,255,255,.18)";
    ctx.beginPath();
    ctx.arc(x, y, filled ? 7 : 5, 0, TWO_PI);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = filled ? "#fffbd1" : "rgba(255,255,255,.42)";
    ctx.stroke();
  }
  ctx.restore();
}

function drawRhymeCoach(ctx, state, config, w, h) {
  if (!state.coachT || !state.coachText) return;
  const p = clamp(state.coachT / 1.6, 0, 1);
  ctx.save();
  ctx.globalAlpha = clamp(p * 1.25, 0, 1);
  panel(ctx, w * 0.285, h * 0.565, w * 0.43, 48, "rgba(4,9,20,.76)", `${config.accent2}70`);
  text(ctx, state.coachText, w / 2, h * 0.598, clamp(w * 0.019, 17, 24), "#eaf8ff", "center", 900);
  ctx.restore();
}

function drawRhymeRoundClear(ctx, state, config, w, h) {
  if (!state.roundClearT) return;
  const p = clamp(state.roundClearT / 1.35, 0, 1);
  ctx.save();
  ctx.fillStyle = `rgba(2,5,16,${0.22 + p * 0.18})`;
  ctx.fillRect(0, 0, w, h);
  panel(ctx, w * 0.24, h * 0.31, w * 0.52, h * 0.22, "rgba(4,9,20,.82)", `${config.accent}aa`);
  text(ctx, state.roundClearLabel || "Rhyme family clear", w / 2, h * 0.39, clamp(w * 0.038, 28, 56), config.accent, "center", 900);
  text(ctx, "Next rhyme group loading", w / 2, h * 0.475, 22, "#fff", "center", 900);
  ctx.restore();
}

function drawRhymeBackdropFx(ctx, state, config, w, h) {
  const pulse = state.beatPulse || 0;
  const sky = ctx.createRadialGradient(w * 0.5, h * 0.46, 20, w * 0.5, h * 0.46, h * 0.62);
  sky.addColorStop(0, `${config.accent2}22`);
  sky.addColorStop(0.52, "rgba(0,0,0,0)");
  sky.addColorStop(1, "rgba(0,0,0,.36)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (state.level?.world === "dino") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 9; i += 1) {
      const x = w * (0.18 + i * 0.08) + Math.sin(state.time * 0.7 + i) * 24;
      const flame = ctx.createLinearGradient(x, h * 0.32, x, h);
      flame.addColorStop(0, "rgba(255,113,55,0)");
      flame.addColorStop(0.55, `rgba(255,154,55,${0.06 + pulse * 0.05})`);
      flame.addColorStop(1, "rgba(255,220,90,0)");
      ctx.strokeStyle = flame;
      ctx.lineWidth = 16 + pulse * 10;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.34);
      ctx.lineTo(w * 0.5 + (i - 4) * w * 0.07, h * 0.88);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawRhymeOrb(ctx, bubble, task, state, now, w, h) {
  const center = rhymeBubbleCenter(bubble, now);
  const [bright, dark] = RHYME_ORB_COLORS[bubble.colorIndex % RHYME_ORB_COLORS.length];
  const r = bubble.r;
  const anchorX = center.x + Math.sin(now * 1.2 + bubble.phase) * 5;
  const anchorY = rhymeCableY(w, anchorX, h, now);
  bubble.hitX = center.x;
  bubble.hitY = center.y;

  ctx.save();
  ctx.strokeStyle = "rgba(255,248,219,.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY + 2);
  ctx.quadraticCurveTo(anchorX + Math.sin(now + bubble.phase) * 8, (anchorY + center.y - r) / 2, center.x, center.y - r - 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,232,129,.95)";
  ctx.beginPath();
  ctx.arc(anchorX, anchorY, 5, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(center.x + 8, center.y + r * 0.82, r * 0.78, r * 0.2, 0, 0, TWO_PI);
  ctx.fill();

  const g = ctx.createRadialGradient(center.x - r * 0.38, center.y - r * 0.42, r * 0.05, center.x, center.y, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.16, bright);
  g.addColorStop(0.74, dark);
  g.addColorStop(1, "rgba(3,7,18,.95)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(center.x, center.y, r, 0, TWO_PI);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,.76)";
  ctx.stroke();

  const capW = r * 0.46;
  const capH = r * 0.24;
  const cap = ctx.createLinearGradient(center.x - capW / 2, center.y - r - capH / 2, center.x + capW / 2, center.y - r + capH);
  cap.addColorStop(0, "#fff3b3");
  cap.addColorStop(0.52, "#c57920");
  cap.addColorStop(1, "#38210b");
  ctx.fillStyle = cap;
  roundedRect(ctx, center.x - capW / 2, center.y - r - capH * 0.38, capW, capH, capH * 0.3);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.52)";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `${bright}8a`;
  ctx.lineWidth = 9 + (state.beatPulse || 0) * 4;
  ctx.beginPath();
  ctx.arc(center.x, center.y, r + 4, 0, TWO_PI);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  // Keyboard aiming must be as legible as a pointer crosshair. This outline
  // marks only the currently focused balloon; it never reveals correctness.
  if (state.keyboardBubbleId === bubble.id) {
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "#fffbd1";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r + 13, 0, TWO_PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.beginPath();
  ctx.ellipse(center.x - r * 0.24, center.y - r * 0.3, r * 0.17, r * 0.1, -0.5, 0, TWO_PI);
  ctx.fill();
  const label = bubble.word || bubble.rime;
  const labelSize = label.length > 5 ? Math.max(17, r * 0.32) : Math.max(23, r * 0.44);
  const labelW = clamp(label.length * labelSize * 0.48 + 22, r * 1.05, r * 1.82);
  const labelH = labelSize * 1.25;
  ctx.fillStyle = "rgba(2,6,18,.38)";
  cutRect(ctx, center.x - labelW / 2, center.y - labelH / 2 + 2, labelW, labelH, Math.min(10, labelH * 0.28));
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.32)";
  ctx.lineWidth = 1.5;
  cutRect(ctx, center.x - labelW / 2, center.y - labelH / 2 + 2, labelW, labelH, Math.min(10, labelH * 0.28));
  ctx.stroke();
  text(ctx, label, center.x, center.y + 2, labelSize, "#fff", "center", 900);
  ctx.restore();
}

function drawRhymeShot(ctx, shot, now) {
  ctx.save();
  for (let i = 0; i < shot.trail.length; i += 1) {
    const point = shot.trail[i];
    const p = i / Math.max(1, shot.trail.length - 1);
    ctx.globalAlpha = p * 0.5;
    ctx.fillStyle = shot.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, shot.r * p, 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const glow = ctx.createRadialGradient(shot.x, shot.y, 3, shot.x, shot.y, shot.r * 2.8);
  glow.addColorStop(0, "#fff");
  glow.addColorStop(0.32, shot.color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(shot.x, shot.y, shot.r * 2.1, 0, TWO_PI);
  ctx.fill();

  ctx.fillStyle = shot.color;
  ctx.beginPath();
  ctx.arc(shot.x, shot.y + Math.sin(now * 9 + shot.seed) * 2, shot.r, 0, TWO_PI);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#f8ffff";
  ctx.stroke();
  text(ctx, shot.label, shot.x, shot.y + 1, Math.max(18, shot.r * 0.9), "#06101d", "center", 900);
  ctx.restore();
}

function drawRhymeBurst(ctx, burst) {
  const p = clamp(burst.t / burst.life, 0, 1);
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = burst.color;
  ctx.lineWidth = 5 * (1 - p) + 1;
  ctx.beginPath();
  ctx.arc(burst.x, burst.y, 18 + p * 96, 0, TWO_PI);
  ctx.stroke();
  for (let i = 0; i < 14; i += 1) {
    const a = burst.seed + i * TWO_PI / 14;
    const d = 18 + p * (42 + (i % 4) * 15);
    ctx.fillStyle = i % 2 ? burst.color : "#fffbd1";
    ctx.beginPath();
    ctx.arc(burst.x + Math.cos(a) * d, burst.y + Math.sin(a) * d, 5 * (1 - p), 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}

function drawRhymeHelper(ctx, image, x, groundY, targetHeight, config, state) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath();
  ctx.ellipse(x, groundY + 8, targetHeight * 0.34, targetHeight * 0.08, 0, 0, TWO_PI);
  ctx.fill();
  if (image?.complete && image.naturalWidth) {
    const aspect = image.naturalWidth / image.naturalHeight;
    const dw = targetHeight * aspect;
    ctx.drawImage(image, x - dw * 0.5, groundY - targetHeight, dw, targetHeight);
  } else {
    drawLowPolyPal(ctx, x, groundY - 64, 0.78 + (state.beatPulse || 0) * 0.04, config, state.time);
  }
  ctx.restore();
}

function drawRhymeLauncher(ctx, state, config, w, h) {
  const task = state.currentTask;
  const launch = rhymeLauncherPoint(w, h);
  const targetX = state.pointer.x || w * 0.5;
  const targetY = state.pointer.y || h * 0.36;
  const dx = targetX - launch.x;
  const dy = targetY - launch.y;
  const angle = Math.atan2(dy, dx);
  const pulse = state.beatPulse || 0;

  ctx.save();
  ctx.setLineDash([12, 13]);
  ctx.strokeStyle = `${config.accent2}aa`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(launch.x, launch.y - 28);
  ctx.lineTo(clamp(targetX, w * 0.08, w * 0.92), clamp(targetY, h * 0.16, h * 0.7));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `${config.accent2}88`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(clamp(targetX, w * 0.08, w * 0.92), clamp(targetY, h * 0.16, h * 0.7), 18 + pulse * 8, 0, TWO_PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(clamp(targetX, w * 0.08, w * 0.92) - 27, clamp(targetY, h * 0.16, h * 0.7));
  ctx.lineTo(clamp(targetX, w * 0.08, w * 0.92) + 27, clamp(targetY, h * 0.16, h * 0.7));
  ctx.moveTo(clamp(targetX, w * 0.08, w * 0.92), clamp(targetY, h * 0.16, h * 0.7) - 27);
  ctx.lineTo(clamp(targetX, w * 0.08, w * 0.92), clamp(targetY, h * 0.16, h * 0.7) + 27);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  const plinth = ctx.createLinearGradient(w * 0.36, h * 0.78, w * 0.64, h * 0.93);
  plinth.addColorStop(0, "rgba(255,210,90,.9)");
  plinth.addColorStop(0.5, "rgba(105,58,24,.92)");
  plinth.addColorStop(1, "rgba(18,11,9,.96)");
  ctx.fillStyle = plinth;
  cutRect(ctx, launch.x - 140, launch.y + 38, 280, 54, 18);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,.34)";
  cutRect(ctx, launch.x - 140, launch.y + 38, 280, 54, 18);
  ctx.stroke();

  ctx.save();
  ctx.translate(launch.x, launch.y);
  ctx.rotate(angle);
  const barrel = ctx.createLinearGradient(-18, -24, 128, 24);
  barrel.addColorStop(0, "#292334");
  barrel.addColorStop(0.5, "#56efff");
  barrel.addColorStop(1, "#0b3342");
  ctx.fillStyle = barrel;
  cutRect(ctx, -18, -22, 132, 44, 14);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,.66)";
  cutRect(ctx, -18, -22, 132, 44, 14);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.52)";
  cutRect(ctx, 74, -13, 34, 26, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.22)";
  cutRect(ctx, 10, 10, 72, 8, 3);
  ctx.fill();
  ctx.restore();

  drawRhymeHelper(ctx, config.helperImage, launch.x - 168, h * 0.93 - pulse * 8, clamp(h * 0.31, 185, 245), config, state);
  // Loaded ammo: a plain orb, no word inside (a word here read as "the answer").
  drawBubble(ctx, launch.x, launch.y, 42 + pulse * 5, "", config.accent2, "rgba(255,255,255,.9)");

  panel(ctx, w * 0.34, h * 0.65, w * 0.32, 72, "rgba(4,9,20,.68)", `${config.accent}88`);
  text(ctx, "Rhymes with", w / 2, h * 0.678, 19, "#fff", "center", 900);
  text(ctx, titleWord(task.targetWord), w / 2, h * 0.72, 32, config.accent, "center", 900);
  ctx.restore();
}

function drawRhymePop(ctx, state, config, w, h) {
  const task = state.currentTask;
  if (!task) return;
  drawRhymeBackdropFx(ctx, state, config, w, h);
  drawRhymeStageFloor(ctx, state, w, h);
  drawRhymeRigging(ctx, state, config, w, h);

  // No big instruction banner in the play area (distracting). The target word
  // lives in the compact launcher panel at the bottom; progress shows as pips.
  drawRhymeProgressPips(ctx, task, config, w, h);

  const bubbles = state.bubbles || [];
  for (const bubble of bubbles) {
    drawRhymeOrb(ctx, bubble, task, state, state.time, w, h);
  }

  for (const shot of state.shots || []) drawRhymeShot(ctx, shot, state.time);
  for (const burst of state.rhymeBursts || []) drawRhymeBurst(ctx, burst);
  // Highlight ring for ONLY the balloon that was just popped (drawn at its last
  // position; ringing every remaining rhyme balloon telegraphed the answers).
  if (state.popRing) {
    const ringP = clamp(state.popRing.t / 0.72, 0, 1);
    ctx.save();
    ctx.globalAlpha = ringP;
    ctx.strokeStyle = "#fffbd1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(state.popRing.x, state.popRing.y, state.popRing.r + 13 + Math.sin(state.time * 9) * 3, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }
  drawRhymeLauncher(ctx, state, config, w, h);

  if (state.judgementT > 0) {
    const p = clamp(state.judgementT / 0.72, 0, 1);
    const color = state.judgement === "POP!" ? config.accent : "#ff9aa8";
    text(ctx, state.judgement, w / 2, h * 0.55 - (1 - p) * 20, 34, color, "center", 900);
  }
  drawRhymeCoach(ctx, state, config, w, h);
  drawRhymeRoundClear(ctx, state, config, w, h);
}

function drawLowPolyPal(ctx, x, y, scale, config, now) {
  ctx.save();
  ctx.translate(x, y + Math.sin(now * 2.2) * 4);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(0, 55, 56, 18, 0, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = config.accent2;
  ctx.beginPath();
  ctx.moveTo(-42, 26);
  ctx.lineTo(-18, -30);
  ctx.lineTo(30, -25);
  ctx.lineTo(46, 30);
  ctx.lineTo(0, 58);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.55)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = config.accent;
  ctx.beginPath();
  ctx.moveTo(-12, -28);
  ctx.lineTo(10, -56);
  ctx.lineTo(34, -24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-14, -4, 6, 0, TWO_PI);
  ctx.arc(18, -5, 6, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = "#07101d";
  ctx.beginPath();
  ctx.arc(-13, -3, 2.8, 0, TWO_PI);
  ctx.arc(19, -4, 2.8, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function startRhymePopArcadeGame(mount, options) {
  const config = CONFIG[options.kind] || CONFIG["rhyme-pop"];
  const ladder = config.ladder(options.difficulty);
  const total = totalUnits(options.kind, ladder);
  const image = new Image();
  image.src = config.bg;
  const helperImage = new Image();
  if (config.helper) helperImage.src = config.helper;
  config.helperImage = helperImage;

  const { canvas, ctx } = createGameCanvas(mount);
  const reduceMotion = prefersReducedMotion();
  const { soundAllowed, sfx } = createSoundGate(options);

  // Speech follows the same live sound flag as the SFX helper: never speak when
  // sound is off, and never let a speech failure break play.
  function speakCue(word) {
    if (!soundAllowed()) return;
    try { speakWord(word); } catch { /* speech is optional */ }
  }

  const state = {
    stage: clamp(Number(options.startLevel) || 0, 0, 9),
    level: null,
    tasks: [],
    taskIndex: 0,
    currentTask: null,
    countdown: 0,
    countdownIntro: false,
    countdownTarget: "",
    roundStartAt: 0,
    score: 0,
    combo: 0,
    correct: 0,
    mistakes: 0,
    progress: 0,
    paused: false,
    ended: false,
    onboarding: !hasSeenOnboarding(options.kind),
    time: 0,
    judgement: "",
    judgementT: 0,
    coachText: "",
    coachT: 0,
    roundClearT: 0,
    roundClearLabel: "",
    roundPendingAdvance: false,
    beatPulse: 0,
    soundEnabled: soundAllowed(),
    popRing: null,
    rhymeBursts: [],
    shots: [],
    bubbles: [],
    nextBubbleId: 1,
    keyboardBubbleId: null,
    pointer: { x: 0, y: 0 }
  };

  let w = 1;
  let h = 1;
  let dpr = 1;

  function resize() {
    const size = sizeCanvasToMount(mount, canvas, ctx);
    w = size.width;
    h = size.height;
    dpr = size.dpr;
    setupEntities();
  }

  const setScore = createScoreReporter(state, options);

  function updateProgress() {
    const clearedInLevel = state.tasks.slice(0, state.taskIndex).reduce((sum, task) => sum + taskUnits(options.kind, task), 0);
    const levelUnits = state.tasks.reduce((sum, task) => sum + taskUnits(options.kind, task), 0) || 1;
    const currentUnits = options.kind === "rhyme-pop" && state.currentTask ? state.currentTask.correctFound || 0 : 0;
    state.progress = clamp((state.stage + (clearedInLevel + currentUnits) / levelUnits) / ladder.length, 0, 1);
    options.onProgressUpdate?.(state.stage, ladder.length);
  }

  function startLevel() {
    state.level = ladder[state.stage];
    image.src = config.bgByWorld?.[state.level.world] || config.bg;
    state.tasks = makeTasks(options.kind, state.level);
    state.taskIndex = 0;
    state.combo = 0;
    state.shots = [];
    state.rhymeBursts = [];
    state.popRing = null;
    state.coachText = "";
    state.coachT = 0;
    state.roundClearT = 0;
    state.roundClearLabel = "";
    state.roundPendingAdvance = false;
    if (options.kind === "rhyme-pop") state.bubbles = [];

    // Group levels into rounds of >= minPlaySeconds so a stop/countdown only
    // happens roughly once a minute instead of after every level.
    const roundFloor = state.level.minPlaySeconds || 60;
    const nowSec = performance.now() / 1000;
    const startNewRound = options.kind !== "rhyme-pop"
      || !state.roundStartAt
      || (nowSec - state.roundStartAt) >= roundFloor;

    if (startNewRound) {
      const firstEver = !state.roundStartAt;
      state.roundStartAt = nowSec;
      state.countdownIntro = options.kind === "rhyme-pop" && firstEver;
      state.countdown = state.countdownIntro ? 4.25 : 3.25;
      state.countdownTarget = countdownTarget();
    } else {
      // Continue the current round: flow straight into the next level.
      state.countdownIntro = false;
      state.countdown = 0;
    }
    setupTask();
    updateProgress();
    // "Listen and rhyme": say the target word as each level starts. Held while
    // the first-run card is up; dismissOnboarding says it instead.
    if (!state.onboarding) speakCue(state.level.targetWord);
  }

  // First-run intro card: dropping the flag lets the frozen countdown start.
  // Independent of state.paused so the chrome pause and the card never fight.
  function dismissOnboarding() {
    if (!state.onboarding) return;
    state.onboarding = false;
    markOnboardingSeen(options.kind);
    if (state.level?.targetWord) speakCue(state.level.targetWord);
  }

  function countdownTarget() {
    return `Shoot all the words that rhyme with ${titleWord(state.level.targetWord)}`;
  }

  function setupTask() {
    state.currentTask = state.tasks[state.taskIndex] || null;
    state.shots = [];
    if (!state.currentTask) return;
    if (options.kind === "rhyme-pop") {
      state.bubbles = [];
      initialiseRhymeRound(state.currentTask);
    }
    setupEntities();
  }

  function initialiseRhymeRound(task) {
    if (!task || task.roundReady) return;
    task.remainingRhymes = [...task.level.rhymingWords];
    task.unusedDistractors = [...task.level.distractors];
    task.usedWords = [];
    task.correctFound = 0;
    task.totalRhymes = task.level.rhymingWords.length;
    task.roundReady = true;
  }

  function setRhymeCoach(message) {
    state.coachText = message;
    state.coachT = message ? 1.6 : 0;
  }

  function scheduleRhymeAdvance(task) {
    state.roundClearLabel = `${titleWord(task.targetWord)} family clear`;
    state.roundClearT = 1.35;
    state.roundPendingAdvance = true;
    state.shots = [];
    state.bubbles = [];
    setRhymeCoach("");
  }

  function rhymeBubbleShape(bubble, index, total) {
    const slots = Math.max(1, total);
    const p = slots === 1 ? 0.5 : index / (slots - 1);
    const xWobble = Math.sin((state.stage + 1) * 1.73 + index * 2.11) * w * 0.016;
    const yRow = RHYME_BALLOON_ROWS[index % RHYME_BALLOON_ROWS.length];
    return {
      ...bubble,
      x: w * 0.16 + (w * 0.68) * p + xWobble,
      y: h * yRow,
      r: clamp(w * 0.028, 26, 44),
      vx: (index % 2 ? -1 : 1) * (30 + state.level.dropRate * 95 + index * 9),
      phase: state.stage * 1.7 + state.taskIndex * 0.9 + index * 1.8 + (bubble.spawnSeed || 0),
      wobble: 16 + index * 5,
      wobbleY: 10 + index * 3,
      wobbleSpeed: 1.2 + index * 0.18,
      colorIndex: index + state.stage + (bubble.kind === "rhyme" ? 1 : 0)
    };
  }

  function takeRhymeWord(task, kind, avoidWord = "") {
    const visible = new Set((state.bubbles || []).map(bubble => bubble.word));
    const poolName = kind === "rhyme" ? "remainingRhymes" : "unusedDistractors";
    const pool = task[poolName] || [];
    while (pool.length) {
      const word = pool.shift();
      if (word !== avoidWord && !visible.has(word) && !task.usedWords.includes(word)) {
        task.usedWords.push(word);
        return word;
      }
    }

    if (kind !== "distractor") return null;
    const fallback = task.level.distractors.find(word => word !== avoidWord && !visible.has(word));
    return fallback || null;
  }

  function makeRhymeBubble(task, kind, index, avoidWord = "") {
    const word = takeRhymeWord(task, kind, avoidWord);
    if (!word) return null;
    return rhymeBubbleShape({
      id: state.nextBubbleId++,
      word,
      kind,
      spawnSeed: state.time + index * 0.37
    }, index, task.level.visibleBalloons);
  }

  function preferredRhymeReplacementKind(task) {
    const visibleCorrect = (state.bubbles || []).filter(bubble => bubble.kind === "rhyme").length;
    const desiredCorrect = Math.min(task.level.correctVisible || 2, visibleCorrect + (task.remainingRhymes?.length || 0));
    if (visibleCorrect < desiredCorrect && task.remainingRhymes?.length) return "rhyme";
    return "distractor";
  }

  function rebuildRhymeBalloons(task) {
    initialiseRhymeRound(task);
    const total = task.level.visibleBalloons;
    if (state.bubbles?.length) {
      state.bubbles = state.bubbles.map((bubble, index) => rhymeBubbleShape(bubble, index, state.bubbles.length));
      return;
    }

    const correctCount = Math.min(task.level.correctVisible || 2, task.remainingRhymes.length, total);
    // Scatter the rhymes across random SLOTS each round so the correct balloons
    // aren't always on the same side / same spots.
    const kinds = shuffleSeeded(
      Array.from({ length: total }, (_, i) => (i < correctCount ? "rhyme" : "distractor")),
      state.stage * 101 + state.taskIndex * 17 + 7
    );
    state.bubbles = [];
    for (let index = 0; index < total; index += 1) {
      const bubble = makeRhymeBubble(task, kinds[index], index);
      if (bubble) state.bubbles.push(rhymeBubbleShape(bubble, state.bubbles.length, total));
    }
  }

  function replaceRhymeBubble(task, removedIndex, avoidWord) {
    if (!task || task.correctFound >= task.totalRhymes) return;
    const kind = preferredRhymeReplacementKind(task);
    const bubble = makeRhymeBubble(task, kind, removedIndex, avoidWord)
      || makeRhymeBubble(task, "distractor", removedIndex, avoidWord);
    if (!bubble) return;
    // Only place the NEW balloon. Do not re-lay-out the others — re-shaping all
    // bubbles snapped every balloon back to the grid on each pop (the "reset"/
    // jump). Existing balloons keep drifting from where they were.
    const shaped = rhymeBubbleShape(bubble, Math.min(removedIndex, task.level.visibleBalloons - 1), task.level.visibleBalloons);
    state.bubbles.splice(Math.min(removedIndex, state.bubbles.length), 0, shaped);
  }

  function setupEntities() {
    const task = state.currentTask;
    if (!task || w < 10 || h < 10) return;
    if (options.kind === "rhyme-pop") {
      rebuildRhymeBalloons(task);
    }
  }

  function finishUnit(points = 100) {
    state.correct += 1;
    state.combo += 1;
    setScore(state.score + points + Math.min(6, state.combo) * 20);
    sfx(state.combo > 2 ? playStarChime : playCorrectChime);
  }

  function nextTask() {
    state.taskIndex += 1;
    updateProgress();
    if (state.taskIndex >= state.tasks.length) {
      finishLevel();
      return;
    }
    setupTask();
  }

  function finishLevel() {
    sfx(playWhoosh);
    const nextStage = state.stage + 1;
    options.onCheckpoint?.(nextStage, ladder.length);
    if (nextStage >= ladder.length) {
      state.ended = true;
      state.progress = 1;
      options.onProgressUpdate?.(ladder.length, ladder.length);
      options.onComplete?.(config.stars({ correct: state.correct, total, mistakes: state.mistakes }), state.score, total);
      return;
    }
    state.stage = nextStage;
    startLevel();
  }

  function fireRhymeShot(x, y) {
    const task = state.currentTask;
    if (!task || state.countdown > 0 || state.roundPendingAdvance || state.shots.length >= 2) return;
    const launch = rhymeLauncherPoint(w, h);
    // Aim EXACTLY where the child tapped — no snapping to a balloon. Skill: line
    // the shot up, watch for balloons in the way, and bank off a wall for the
    // high ones.
    const aimX = clamp(x || w / 2, w * 0.06, w * 0.94);
    const aimY = clamp(y || h * 0.3, h * 0.06, h * 0.7);
    let dx = aimX - launch.x;
    let dy = aimY - launch.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    if (distance < 30) {
      dx = 0;
      dy = -1;
    } else {
      dx /= distance;
      dy /= distance;
    }
    const speed = clamp(w * 0.7, 560, 860);
    state.shots.push({
      x: launch.x,
      y: launch.y - 20,
      vx: dx * speed,
      vy: dy * speed,
      r: clamp(w * 0.019, 18, 28),
      label: "",
      color: config.accent2,
      seed: state.time + state.shots.length,
      trail: []
    });
    state.beatPulse = 0.35;
    sfx(playTapSound);
  }

  function resolveRhymeHit(shot, bubble) {
    const task = state.currentTask;
    if (!task) return;
    const correct = bubble.kind === "rhyme";
    const removedIndex = Math.max(0, state.bubbles.indexOf(bubble));
    state.bubbles = state.bubbles.filter(item => item !== bubble);
    state.rhymeBursts.push({
      x: bubble.hitX || bubble.x,
      y: bubble.hitY || bubble.y,
      t: 0,
      life: correct ? 0.66 : 0.42,
      seed: state.time + shot.seed,
      color: correct ? config.accent : "#ff7a8a"
    });
    // Say every popped word so the game works as "listen and rhyme".
    speakCue(bubble.word);
    if (correct) {
      state.judgement = "POP!";
      state.judgementT = 0.72;
      state.beatPulse = 1;
      // Ring ONLY the balloon just popped (it is already out of state.bubbles,
      // so the ring draws at its last position) — ringing every remaining rhyme
      // balloon telegraphed the answers.
      state.popRing = { x: bubble.hitX || bubble.x, y: bubble.hitY || bubble.y, r: bubble.r, t: 0.72 };
      sfx(playPopSound);
      task.correctFound = (task.correctFound || 0) + 1;
      finishUnit(140);
      updateProgress();
      if (task.correctFound >= task.totalRhymes) {
        scheduleRhymeAdvance(task);
      } else {
        setRhymeCoach(`${titleWord(bubble.word)} rhymes with ${titleWord(task.targetWord)}`);
        replaceRhymeBubble(task, removedIndex, bubble.word);
      }
    } else {
      state.mistakes += 1;
      state.combo = 0;
      state.judgement = "TRY AGAIN";
      state.judgementT = 0.72;
      state.beatPulse = 0.62;
      setRhymeCoach(`${titleWord(bubble.word)} does not rhyme with ${titleWord(task.targetWord)}`);
      sfx(playSoftBuzz);
      replaceRhymeBubble(task, removedIndex, bubble.word);
    }
  }

  function tapRhyme(x, y) {
    const task = state.currentTask;
    // Tapping the target panel repeats the word instead of firing a shot.
    if (task && rhymeTargetPanelHit(x, y, w, h)) {
      speakCue(task.targetWord);
      return;
    }
    fireRhymeShot(x, y);
  }

  function pointerPosition(event) {
    return canvasPoint(canvas, event, w, h);
  }

  function onPointerMove(event) {
    state.pointer = pointerPosition(event);
    state.keyboardBubbleId = null;
  }

  function onPointerDown(event) {
    const point = pointerPosition(event);
    state.pointer = point;
    if (state.onboarding) {
      dismissOnboarding();
      return;
    }
    if (state.paused || state.ended || state.countdown > 0) return;
    if (options.kind === "rhyme-pop") tapRhyme(point.x, point.y);
  }

  function onKeyDown(event) {
    if (isInteractiveKeyTarget(event.target)) return;
    // Any key starts play from the intro card (Esc stays with the chrome).
    if (state.onboarding) {
      if (event.key === "Escape") return;
      if (event.key === " " || event.key === "Enter" || event.key.startsWith("Arrow")) event.preventDefault();
      dismissOnboarding();
      return;
    }
    if (options.kind !== "rhyme-pop" || state.paused || state.ended || state.countdown > 0) return;
    const direction = laneDirectionForKey(event.key);
    if (direction && state.bubbles.length) {
      event.preventDefault();
      const foundIndex = state.bubbles.findIndex(bubble => bubble.id === state.keyboardBubbleId);
      const currentIndex = foundIndex >= 0 ? foundIndex : (direction > 0 ? -1 : 0);
      const nextIndex = (currentIndex + direction + state.bubbles.length) % state.bubbles.length;
      const bubble = state.bubbles[nextIndex];
      state.keyboardBubbleId = bubble.id;
      state.pointer = { x: bubble.hitX || bubble.x, y: bubble.hitY || bubble.y };
      return;
    }
    if (!isPrimaryActionKey(event.key)) return;
    event.preventDefault();
    const selected = state.bubbles.find(bubble => bubble.id === state.keyboardBubbleId);
    fireRhymeShot(selected?.hitX || state.pointer.x || w / 2, selected?.hitY || state.pointer.y || h * 0.34);
  }

  function updateRhymePop(dt) {
    if (!state.currentTask || state.countdown > 0 || state.roundPendingAdvance) return;
    for (const bubble of state.bubbles) {
      bubble.x += bubble.vx * dt;
      const minX = w * 0.14 + bubble.r;
      const maxX = w * 0.86 - bubble.r;
      if (bubble.x < minX || bubble.x > maxX) {
        bubble.x = clamp(bubble.x, minX, maxX);
        bubble.vx *= -1;
      }
    }

    for (const shot of state.shots) {
      shot.trail.push({ x: shot.x, y: shot.y });
      if (shot.trail.length > 8) shot.trail.shift();
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      // Bounce off the side walls so a skilled bank shot can reach the high
      // balloons on the far side.
      const leftWall = w * 0.06 + shot.r;
      const rightWall = w * 0.94 - shot.r;
      if (shot.x < leftWall) { shot.x = leftWall; shot.vx = Math.abs(shot.vx); }
      else if (shot.x > rightWall) { shot.x = rightWall; shot.vx = -Math.abs(shot.vx); }
      // Hit whatever the shot actually touches FIRST — a wrong balloon in the
      // way gets popped (a miss), so obstacles matter and there is no auto-aim.
      // Easy mode lets shots pass through distractors so a drifting wrong
      // balloon can't turn good aim into a mistake.
      const easyAim = state.level?.difficulty === "easy";
      const hit = state.bubbles.find(bubble => {
        if (easyAim && bubble.kind !== "rhyme") return false;
        const center = rhymeBubbleCenter(bubble, state.time);
        return Math.hypot(shot.x - center.x, shot.y - center.y) <= bubble.r + shot.r * 0.85;
      });
      if (hit) {
        shot.dead = true;
        const beforeTask = state.currentTask;
        resolveRhymeHit(shot, hit);
        if (beforeTask !== state.currentTask) return;
      } else if (shot.y < -80 || shot.y > h + 80) {
        // Flew off the top/bottom without hitting anything — just a spent shot,
        // no penalty. Try again.
        shot.dead = true;
      }
    }
    state.shots = state.shots.filter(shot => !shot.dead);
    state.rhymeBursts = state.rhymeBursts
      .map(burst => ({ ...burst, t: burst.t + dt }))
      .filter(burst => burst.t < burst.life);
  }

  function tickFrame(now, dt) {
    if (!state.paused && !state.ended && !state.onboarding) {
      state.soundEnabled = soundAllowed();
      state.time += reduceMotion ? dt * 0.35 : dt;
      state.beatPulse = Math.max(0, state.beatPulse - dt * 2.8);
      state.judgementT = Math.max(0, state.judgementT - dt);
      state.coachT = Math.max(0, state.coachT - dt);
      if (state.popRing) {
        state.popRing.t -= dt;
        if (state.popRing.t <= 0) state.popRing = null;
      }
      state.countdown = Math.max(0, state.countdown - dt);
      if (options.kind === "rhyme-pop") {
        if (state.roundPendingAdvance) {
          state.roundClearT = Math.max(0, state.roundClearT - dt);
          if (state.roundClearT === 0) {
            state.roundPendingAdvance = false;
            nextTask();
          }
        } else {
          updateRhymePop(dt);
        }
      }
    }
    draw();
  }

  const loop = createFrameLoop(tickFrame);

  function draw() {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!drawCover(ctx, image, w, h)) drawFallback(ctx, w, h, config, state.time);
    drawScreenGrade(ctx, w, h);
    drawRhymePop(ctx, state, config, w, h);
    drawHud(ctx, state, config, w, h);
    drawCountdown(ctx, state, config, w, h);
    drawOnboarding(ctx, state, config, w, h);
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
      cancelSpeech();
    },
    resume() {
      state.paused = false;
      loop.reset();
    },
    destroy() {
      state.ended = true;
      cancelSpeech();
      loop.cancel();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    },
    debugSnapshot() {
      return {
        kind: options.kind,
        stage: state.stage,
        score: state.score,
        combo: state.combo,
        taskIndex: state.taskIndex,
        countdown: state.countdown,
        countdownTarget: state.countdownTarget,
        onboarding: state.onboarding,
        audioArmed: false,
        soundEnabled: state.soundEnabled,
        musicActive: false,
        backgroundSrc: image.src,
        bubbles: state.bubbles?.map(bubble => ({
          id: bubble.id,
          word: bubble.word,
          kind: bubble.kind,
          rime: bubble.rime,
          x: bubble.hitX || bubble.x,
          y: bubble.hitY || bubble.y,
          r: bubble.r
        })),
        shots: state.shots?.length || 0,
        judgement: state.judgement,
        coachText: state.coachText,
        coachT: state.coachT,
        roundClearT: state.roundClearT,
        roundPendingAdvance: state.roundPendingAdvance,
        currentTask: state.currentTask ? {
          targetWord: state.currentTask.targetWord,
          totalRhymes: state.currentTask.totalRhymes,
          correctFound: state.currentTask.correctFound,
          remainingRhymes: [...(state.currentTask.remainingRhymes || [])],
          unusedDistractors: [...(state.currentTask.unusedDistractors || [])]
        } : null
      };
    }
  };
  options.onEngineReady?.(api);
  return api;
}

export default function RhymePopArcadeGame({
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

  // Mount the engine ONCE per game/difficulty/start. The callback props used to
  // sit in this dependency array, so every score or progress update re-rendered
  // the parent, handed down fresh callback identities, and tore the engine down
  // and rebuilt it — the countdown/"reset over and over" loop. Handlers now go
  // through a ref, so scoring never rebuilds the engine mid-play.
  useEffect(() => {
    if (!mountRef.current) return undefined;
    const engine = startRhymePopArcadeGame(mountRef.current, {
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
      aria-label={CONFIG[kind]?.title || "Arcade game"}
    />
  );
}
