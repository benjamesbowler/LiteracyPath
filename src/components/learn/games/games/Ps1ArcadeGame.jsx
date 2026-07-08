import { useEffect, useRef } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  startSoundBeatMusic,
  playTapSound,
  playWhoosh
} from "../../../../utils/audio/gameSfx.js";
import { rhymePopLadder, rhymePopStars } from "../../../../utils/rhymePopLevels.js";
import { soundBeatLadder, soundBeatStars } from "../../../../utils/soundBeatTracks.js";
import { soundSafariLadder, soundSafariStars } from "../../../../utils/soundSafariRounds.js";
import { starGalleryLadder, starGalleryStars } from "../../../../utils/starGalleryRounds.js";

const CONFIG = {
  "sound-beat": {
    title: "Sound Beat",
    action: "Tap each sound on the beat",
    bg: "/images/learn-games/ps1-arcade/sound-beat-stage-v2.webp",
    accent: "#b8ff3d",
    accent2: "#ff3d8b",
    ladder: soundBeatLadder,
    stars: soundBeatStars
  },
  "rhyme-pop": {
    title: "Rhyme Pop",
    action: "Aim and pop a real rhyming word",
    bg: "/images/learn-games/ps1-arcade/rhyme-pop-bg.webp",
    bgByWorld: {
      dino: "/images/learn-games/ps1-arcade/rhyme-pop-dino-stage-v2.webp"
    },
    accent: "#ffcf3d",
    accent2: "#3df0ff",
    ladder: rhymePopLadder,
    stars: rhymePopStars
  },
  "sound-safari": {
    title: "Sound Safari",
    action: "Net the sounds in order",
    bg: "/images/learn-games/ps1-arcade/sound-safari-bg.webp",
    accent: "#55ff7a",
    accent2: "#ff8d3d",
    ladder: soundSafariLadder,
    stars: soundSafariStars
  },
  "star-gallery": {
    title: "Star Gallery",
    action: "Tap the piece that fixes the sentence",
    bg: "/images/learn-games/ps1-arcade/star-gallery-bg.webp",
    accent: "#7fd8ff",
    accent2: "#ffdf55",
    ladder: starGalleryLadder,
    stars: starGalleryStars
  }
};

const TWO_PI = Math.PI * 2;
const BEAT_LANES = [
  { color: "#52fff0", dark: "#073738" },
  { color: "#ffd23d", dark: "#433206" },
  { color: "#ff4f5f", dark: "#4a0810" },
  { color: "#d85cff", dark: "#3d0a4c" }
];
const RHYME_ORB_COLORS = [
  ["#58f6ff", "#103858"],
  ["#ffd94c", "#6a3700"],
  ["#ff6f83", "#60101a"],
  ["#b769ff", "#35105a"],
  ["#64ff89", "#0d4a28"]
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeOut(value) {
  return 1 - Math.pow(1 - clamp(value, 0, 1), 3);
}

function text(ctx, value, x, y, size, color = "#fff", align = "left", weight = 800) {
  ctx.save();
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size * 0.13);
  ctx.strokeStyle = "rgba(0,0,0,.72)";
  ctx.strokeText(String(value), x, y);
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y);
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCover(ctx, image, w, h) {
  if (!image.complete || !image.naturalWidth) return false;
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return true;
}

function drawFallback(ctx, w, h, config, time) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#101a36");
  g.addColorStop(0.45, "#24425a");
  g.addColorStop(1, "#08101d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 42; i += 1) {
    const x = ((i * 137 + time * 18) % (w + 180)) - 90;
    const y = 40 + ((i * 71) % Math.max(120, h - 120));
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,.08)" : `${config.accent}33`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 5), 0, TWO_PI);
    ctx.fill();
  }
}

function drawScreenGrade(ctx, w, h) {
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.12, w * 0.5, h * 0.48, h * 0.85);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(0.62, "rgba(2,6,18,.12)");
  vignette.addColorStop(1, "rgba(0,0,0,.58)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(0,0,0,.12)";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 260; i += 1) {
    const x = (i * 83) % w;
    const y = (i * 47) % h;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

function panel(ctx, x, y, w, h, color = "rgba(5,10,22,.72)", stroke = "rgba(255,255,255,.28)") {
  ctx.save();
  roundedRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();
}

function drawBeatBackdrop(ctx, state, config, w, h) {
  const pulse = state.beatPulse || 0;
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.44, 20, w * 0.5, h * 0.44, h * (0.56 + pulse * 0.06));
  glow.addColorStop(0, `${config.accent}44`);
  glow.addColorStop(0.38, `${config.accent2}1f`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const beamCount = 7;
  for (let i = 0; i < beamCount; i += 1) {
    const t = state.time * 0.7 + i * 0.8;
    const x = w * (0.18 + i * 0.11) + Math.sin(t) * w * 0.025;
    const beam = ctx.createLinearGradient(x, h * 0.2, x + Math.sin(t * 0.7) * 140, h);
    beam.addColorStop(0, `${i % 2 ? config.accent : config.accent2}00`);
    beam.addColorStop(0.35, `${i % 2 ? config.accent : config.accent2}${pulse > 0.2 ? "3d" : "24"}`);
    beam.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = beam;
    ctx.lineWidth = 18 + pulse * 20;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.22);
    ctx.lineTo(w * 0.5 + (i - 3) * w * 0.1, h);
    ctx.stroke();
  }
  ctx.restore();

  const baseY = h * 0.9;
  for (let i = 0; i < 24; i += 1) {
    const barW = w * 0.012;
    const x = w * 0.18 + i * w * 0.028;
    const height = (18 + Math.sin(state.time * 7 + i * 0.9) * 14 + pulse * 35) * (0.8 + (i % 5) * 0.12);
    ctx.fillStyle = i % 3 === 0 ? `${config.accent}90` : `${config.accent2}78`;
    roundedRect(ctx, x, baseY - height, barW, height, 5);
    ctx.fill();
  }
}

function beatLanePoint(lane, progress, w, h) {
  const targetY = h * 0.86;
  const stageY = h * 0.48;
  const bottomLeft = w * 0.25;
  const bottomRight = w * 0.75;
  const topLeft = w * 0.39;
  const topRight = w * 0.61;
  const bottomStep = (bottomRight - bottomLeft) / (BEAT_LANES.length - 1);
  const topStep = (topRight - topLeft) / (BEAT_LANES.length - 1);
  const p = clamp(progress, 0, 1);
  const y = stageY + (targetY - stageY) * p;
  const xTop = topLeft + lane * topStep;
  const xBottom = bottomLeft + lane * bottomStep;
  return {
    x: xTop + (xBottom - xTop) * p,
    y,
    scale: 0.48 + p * 0.72
  };
}

function drawSoundBeatRunway(ctx, state, config, w, h) {
  const pulse = state.beatPulse || 0;
  const topY = h * 0.48;
  const bottomY = h * 0.91;
  const leftTop = w * 0.33;
  const rightTop = w * 0.67;
  const leftBottom = w * 0.1;
  const rightBottom = w * 0.9;

  ctx.save();
  const runway = ctx.createLinearGradient(0, topY, 0, bottomY);
  runway.addColorStop(0, "rgba(7,14,28,.62)");
  runway.addColorStop(0.55, "rgba(5,10,22,.82)");
  runway.addColorStop(1, "rgba(1,4,12,.96)");
  ctx.fillStyle = runway;
  ctx.beginPath();
  ctx.moveTo(leftTop, topY);
  ctx.lineTo(rightTop, topY);
  ctx.lineTo(rightBottom, bottomY);
  ctx.lineTo(leftBottom, bottomY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(111,241,255,.82)";
  ctx.lineWidth = 5 + pulse * 3;
  ctx.beginPath();
  ctx.moveTo(leftTop, topY);
  ctx.lineTo(leftBottom, bottomY);
  ctx.moveTo(rightTop, topY);
  ctx.lineTo(rightBottom, bottomY);
  ctx.stroke();

  for (let i = 0; i < 9; i += 1) {
    const p = i / 8;
    const y = topY + (bottomY - topY) * p;
    const inset = p * (leftTop - leftBottom);
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + p * 0.16})`;
    ctx.lineWidth = 1 + p * 3;
    ctx.beginPath();
    ctx.moveTo(leftTop - inset, y);
    ctx.lineTo(rightTop + inset, y);
    ctx.stroke();
  }

  for (let lane = 0; lane < BEAT_LANES.length; lane += 1) {
    const laneStyle = BEAT_LANES[lane];
    const top = beatLanePoint(lane, 0, w, h);
    const bottom = beatLanePoint(lane, 1, w, h);
    const glow = ctx.createLinearGradient(top.x, top.y, bottom.x, bottom.y);
    glow.addColorStop(0, `${laneStyle.color}16`);
    glow.addColorStop(0.58, `${laneStyle.color}54`);
    glow.addColorStop(1, `${laneStyle.color}d4`);
    ctx.strokeStyle = glow;
    ctx.lineWidth = 15 + pulse * 4;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.38)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "screen";
  const footGlow = ctx.createRadialGradient(w * 0.5, h * 0.88, 18, w * 0.5, h * 0.88, w * 0.45);
  footGlow.addColorStop(0, `${config.accent2}32`);
  footGlow.addColorStop(0.5, `${config.accent}18`);
  footGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = footGlow;
  ctx.fillRect(0, h * 0.48, w, h * 0.52);
  ctx.restore();
}

function drawBeatTarget(ctx, lane, state, w, h, active) {
  const point = beatLanePoint(lane, 1, w, h);
  const laneStyle = BEAT_LANES[lane];
  const pulse = active ? state.beatPulse || 0 : 0;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(point.x, point.y, 8, point.x, point.y, 64 + pulse * 30);
  glow.addColorStop(0, `${laneStyle.color}78`);
  glow.addColorStop(0.55, `${laneStyle.color}22`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(point.x - 90, point.y - 90, 180, 180);
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 5 + pulse * 5;
  ctx.strokeStyle = laneStyle.color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 34 + pulse * 10, 0, TWO_PI);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,.88)";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 21 + pulse * 6, 0, TWO_PI);
  ctx.stroke();
  ctx.fillStyle = active ? `${laneStyle.color}cc` : "rgba(255,255,255,.14)";
  ctx.beginPath();
  ctx.arc(point.x, point.y, 8 + pulse * 5, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawBeatPad(ctx, label, lane, progress, active, config, state, w, h) {
  const point = beatLanePoint(lane, progress, w, h);
  const laneStyle = BEAT_LANES[lane];
  const width = 76 * point.scale;
  const height = 48 * point.scale;
  const pulse = active ? state.beatPulse || 0 : 0;

  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.scale(1, 0.9);
  ctx.fillStyle = "rgba(0,0,0,.34)";
  roundedRect(ctx, -width * 0.52 + 6, -height * 0.5 + 8, width * 1.04, height, 10 * point.scale);
  ctx.fill();

  const fill = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
  fill.addColorStop(0, active ? "#ffffff" : "rgba(255,255,255,.72)");
  fill.addColorStop(0.2, laneStyle.color);
  fill.addColorStop(1, laneStyle.dark);
  ctx.fillStyle = fill;
  roundedRect(ctx, -width / 2, -height / 2, width, height, 10 * point.scale);
  ctx.fill();
  ctx.lineWidth = active ? 5 + pulse * 3 : 3;
  ctx.strokeStyle = active ? "#f8ffff" : "rgba(255,255,255,.62)";
  ctx.stroke();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `${laneStyle.color}cc`;
  ctx.lineWidth = 9 + pulse * 6;
  roundedRect(ctx, -width / 2, -height / 2, width, height, 10 * point.scale);
  ctx.stroke();
  ctx.restore();

  text(ctx, label, point.x, point.y + 1, clamp(25 * point.scale, 14, 34), "#ffffff", "center", 900);
}

function drawSoundBeatPortrait(ctx, x, y, scale, now) {
  ctx.save();
  ctx.translate(x, y + Math.sin(now * 2.3) * 1.6);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(0,0,0,.26)";
  ctx.beginPath();
  ctx.ellipse(0, 45, 36, 12, 0, 0, TWO_PI);
  ctx.fill();

  ctx.fillStyle = "#e34158";
  ctx.beginPath();
  ctx.moveTo(-36, 58);
  ctx.lineTo(-21, 19);
  ctx.lineTo(21, 19);
  ctx.lineTo(38, 58);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.58)";
  ctx.lineWidth = 4;
  ctx.stroke();

  const face = ctx.createLinearGradient(-18, -34, 22, 30);
  face.addColorStop(0, "#f3b36e");
  face.addColorStop(0.7, "#c66f32");
  face.addColorStop(1, "#8a401f");
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.ellipse(0, -6, 30, 34, 0, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.58)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#2a170f";
  ctx.beginPath();
  ctx.moveTo(-30, -18);
  ctx.lineTo(-18, -45);
  ctx.lineTo(-6, -26);
  ctx.lineTo(8, -48);
  ctx.lineTo(17, -23);
  ctx.lineTo(33, -36);
  ctx.lineTo(25, -9);
  ctx.lineTo(-25, -7);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#39e6df";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, -15, 38, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.fillStyle = "#1c4d58";
  ctx.strokeStyle = "rgba(0,0,0,.62)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect?.(-43, -20, 16, 31, 7);
  if (!ctx.roundRect) roundedRect(ctx, -43, -20, 16, 31, 7);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect?.(27, -20, 16, 31, 7);
  if (!ctx.roundRect) roundedRect(ctx, 27, -20, 16, 31, 7);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#07101d";
  ctx.beginPath();
  ctx.arc(-10, -6, 3.5, 0, TWO_PI);
  ctx.arc(13, -6, 3.5, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "#551d1d";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(2, 6, 11, 0.13 * Math.PI, 0.87 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = "#ffd23d";
  ctx.beginPath();
  ctx.moveTo(0, 21);
  ctx.lineTo(5, 31);
  ctx.lineTo(17, 32);
  ctx.lineTo(8, 39);
  ctx.lineTo(11, 51);
  ctx.lineTo(0, 44);
  ctx.lineTo(-11, 51);
  ctx.lineTo(-8, 39);
  ctx.lineTo(-17, 32);
  ctx.lineTo(-5, 31);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSoundBeatHud(ctx, state, config, w) {
  const current = state.currentTask?.item;
  const totalBeats = current ? current.beats.length + 1 : 4;
  const filledBeats = Math.min(totalBeats, state.beatIndex || 0);
  const hudY = 16;

  ctx.save();
  ctx.fillStyle = "rgba(3,7,18,.78)";
  ctx.strokeStyle = "rgba(180,220,255,.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.PI / 8 + i * Math.PI / 4;
    const x = 70 + Math.cos(angle) * 58;
    const y = 70 + Math.sin(angle) * 58;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawSoundBeatPortrait(ctx, 70, 78, 0.78, state.time);

  panel(ctx, 150, hudY, 260, 72, "rgba(3,7,18,.8)", "rgba(255,255,255,.34)");
  text(ctx, "♪", 178, hudY + 34, 34, config.accent2, "center", 900);
  text(ctx, String(state.score).padStart(6, "0"), 220, hudY + 31, 31, "#f8d64b", "left", 900);
  const bars = Math.max(1, Math.min(8, state.combo + 1));
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i < bars ? "#55fff0" : "rgba(255,255,255,.16)";
    roundedRect(ctx, 202 + i * 18, hudY + 53, 13, 11, 4);
    ctx.fill();
  }
  text(ctx, "⚡", 376, hudY + 50, 28, "#ffdf3d", "center", 900);

  const meterX = w * 0.38;
  const meterY = 42;
  const meterW = w * 0.28;
  panel(ctx, meterX, hudY + 6, meterW, 50, "rgba(3,7,18,.78)", "rgba(255,255,255,.34)");
  for (let i = 0; i < 10; i += 1) {
    const dotX = meterX + 32 + i * ((meterW - 64) / 9);
    ctx.fillStyle = i < filledBeats ? config.accent2 : (i < totalBeats ? config.accent : "rgba(255,255,255,.18)");
    ctx.beginPath();
    ctx.arc(dotX, meterY, 9, 0, TWO_PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const activeDotX = meterX + 32 + Math.min(9, filledBeats) * ((meterW - 64) / 9);
  ctx.strokeStyle = "#ffb13d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(activeDotX, meterY - 30);
  ctx.lineTo(activeDotX, meterY + 30);
  ctx.stroke();

  panel(ctx, w - 360, hudY, 344, 72, "rgba(3,7,18,.8)", "rgba(255,255,255,.34)");
  for (let i = 0; i < 5; i += 1) {
    text(ctx, i < 3 ? "★" : "☆", w - 332 + i * 38, hudY + 31, 28, i < 3 ? "#ffd53b" : "rgba(255,255,255,.34)", "center", 900);
  }
  for (let i = 0; i < 3; i += 1) {
    const x = w - 116 + i * 34;
    ctx.fillStyle = i < 2 ? "#ff4f5f" : "rgba(255,255,255,.18)";
    ctx.beginPath();
    ctx.moveTo(x, hudY + 43);
    ctx.bezierCurveTo(x - 20, hudY + 25, x - 20, hudY + 5, x, hudY + 18);
    ctx.bezierCurveTo(x + 20, hudY + 5, x + 20, hudY + 25, x, hudY + 43);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.42)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawBeatBurst(ctx, burst) {
  const p = clamp(burst.t / burst.life, 0, 1);
  const r = 18 + p * 72;
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.strokeStyle = burst.color;
  ctx.lineWidth = 4 * (1 - p) + 1;
  ctx.beginPath();
  ctx.arc(burst.x, burst.y, r, 0, TWO_PI);
  ctx.stroke();
  for (let i = 0; i < 10; i += 1) {
    const a = i * TWO_PI / 10 + burst.seed;
    const inner = r * 0.4;
    const outer = r * (0.9 + (i % 3) * 0.08);
    ctx.beginPath();
    ctx.moveTo(burst.x + Math.cos(a) * inner, burst.y + Math.sin(a) * inner);
    ctx.lineTo(burst.x + Math.cos(a) * outer, burst.y + Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHud(ctx, state, config, w, h) {
  if (config.title === "Sound Beat") {
    drawSoundBeatHud(ctx, state, config, w, h);
    return;
  }
  panel(ctx, 16, 14, Math.min(520, w - 32), 62, "rgba(7,10,24,.74)", `${config.accent}88`);
  text(ctx, config.title, 38, 35, 23, config.accent);
  text(ctx, config.action, 38, 61, 14, "#dce8ff", "left", 700);

  const rightW = Math.min(330, w * 0.42);
  panel(ctx, w - rightW - 16, 14, rightW, 62, "rgba(7,10,24,.74)", "rgba(255,255,255,.24)");
  text(ctx, `${state.score} pts`, w - rightW + 12, 36, 21, "#fff");
  text(ctx, `Level ${state.stage + 1}/10`, w - 28, 36, 18, config.accent2, "right");
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
  const scale = easeOut(1 - (state.countdown % 1));
  const main = state.countdown <= 0.65 ? "GO!" : String(Math.ceil(state.countdown));
  const target = state.countdownTarget || config.action;
  text(ctx, target, w / 2, h * 0.32, clamp(w * 0.042, 25, 54), "#fff", "center");
  ctx.translate(w / 2, h * 0.52);
  ctx.scale(0.86 + scale * 0.18, 0.86 + scale * 0.18);
  text(ctx, main, 0, 0, clamp(w * 0.13, 82, 170), main === "GO!" ? config.accent : config.accent2, "center", 900);
  ctx.restore();
}

function makeTasks(kind, level) {
  if (kind === "sound-beat") {
    return level.items.map(item => ({ type: kind, item, attempts: 0 }));
  }
  if (kind === "rhyme-pop") {
    return level.pairs.map(pair => ({ type: kind, pair, level, attempts: 0 }));
  }
  if (kind === "sound-safari") {
    return level.words.map(word => ({ type: kind, word, index: 0, attempts: 0 }));
  }
  return level.items.map(item => ({ type: kind, item, answerIndex: 0, attempts: 0 }));
}

function taskUnits(kind, task) {
  if (kind === "sound-safari") return task.word.graphemes.length;
  if (kind === "star-gallery") return task.item.answers?.length || 1;
  return 1;
}

function totalUnits(kind, ladder) {
  return ladder.reduce((sum, level) => sum + makeTasks(kind, level).reduce((inner, task) => inner + taskUnits(kind, task), 0), 0);
}

function drawBeat(ctx, state, config, w, h, now) {
  const task = state.currentTask;
  if (!task) return;
  const item = task.item;
  const notes = [...item.beats, "blend"];
  const spacing = 60 / state.level.bpm;
  const approachSeconds = Math.max(1.65, spacing * 3.8);

  ctx.save();
  drawBeatBackdrop(ctx, state, config, w, h);

  ctx.save();
  const titlePanel = ctx.createLinearGradient(w * 0.29, h * 0.22, w * 0.71, h * 0.4);
  titlePanel.addColorStop(0, "rgba(3,15,14,.42)");
  titlePanel.addColorStop(1, "rgba(1,6,18,.22)");
  ctx.fillStyle = titlePanel;
  roundedRect(ctx, w * 0.31, h * 0.2, w * 0.38, h * 0.16, 8);
  ctx.fill();
  text(ctx, item.say, w / 2, h * 0.265, clamp(w * 0.055, 38, 74), "#fff", "center", 900);
  text(ctx, `${state.level.bpm} BPM`, w / 2, h * 0.335, 18, config.accent, "center", 900);
  ctx.restore();

  drawSoundBeatRunway(ctx, state, config, w, h);

  for (let lane = 0; lane < BEAT_LANES.length; lane += 1) {
    drawBeatTarget(ctx, lane, state, w, h, lane === state.beatIndex % BEAT_LANES.length);
  }

  for (let i = state.beatIndex; i < notes.length; i += 1) {
    const noteTime = state.noteStart + i * spacing;
    const progress = 1 - (noteTime - now) / approachSeconds;
    if (progress < -0.04 || progress > 1.18) continue;
    const timeToHit = Math.abs(noteTime - now);
    const active = i === state.beatIndex;
    const nearHit = 1 - clamp(timeToHit / 0.5, 0, 1);
    drawBeatPad(ctx, notes[i] === "blend" ? "GO" : notes[i], i % BEAT_LANES.length, progress, active && nearHit > 0.2, config, state, w, h);
  }

  const slotW = Math.min(78, (w * 0.34) / notes.length);
  const slotStart = w * 0.5 - (slotW * notes.length) / 2;
  for (let i = 0; i < notes.length; i += 1) {
    const filled = i < state.beatIndex;
    panel(ctx, slotStart + i * slotW, h - 142, slotW - 10, 38, filled ? `${config.accent}d8` : "rgba(5,10,22,.64)", filled ? "#f4ffd8" : "rgba(255,255,255,.22)");
    text(ctx, filled ? (notes[i] === "blend" ? "GO" : notes[i]) : "", slotStart + i * slotW + slotW / 2 - 5, h - 123, 18, filled ? "#07101d" : "#fff", "center", 900);
  }

  for (const burst of state.hitBursts) drawBeatBurst(ctx, burst);
  if (state.judgementT > 0) {
    const p = clamp(state.judgementT / 0.72, 0, 1);
    const lanePoint = beatLanePoint(Math.max(0, (state.beatIndex - 1) % BEAT_LANES.length), 1, w, h);
    text(ctx, state.judgement, lanePoint.x, lanePoint.y - 92 - (1 - p) * 20, 34, state.judgement === "MISS" ? "#ff8d8d" : config.accent, "center", 900);
  }

  if (state.soundEnabled && !state.audioArmed) {
    text(ctx, "TAP / SPACE TO START MUSIC", w / 2, h * 0.74, clamp(w * 0.026, 20, 32), "#fff", "center", 900);
  }
  text(ctx, "SPACE / TAP", w / 2, h * 0.96, 16, "#dff7ff", "center", 900);
  ctx.restore();
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

function rhymeBubbleCenter(bubble, now) {
  const wobbleX = Math.sin(now * bubble.wobbleSpeed + bubble.phase) * bubble.wobble;
  const wobbleY = Math.cos(now * (bubble.wobbleSpeed * 0.82) + bubble.phase) * bubble.wobbleY;
  return { x: bubble.x + wobbleX, y: bubble.y + wobbleY };
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

function drawRhymeOrb(ctx, bubble, task, state, now) {
  const center = rhymeBubbleCenter(bubble, now);
  const [bright, dark] = RHYME_ORB_COLORS[bubble.colorIndex % RHYME_ORB_COLORS.length];
  const r = bubble.r;
  bubble.hitX = center.x;
  bubble.hitY = center.y;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - r - 6);
  ctx.lineTo(center.x + Math.sin(now * 1.3 + bubble.phase) * 8, center.y - r - 46);
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

  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `${bright}8a`;
  ctx.lineWidth = 9 + (state.beatPulse || 0) * 4;
  ctx.beginPath();
  ctx.arc(center.x, center.y, r + 4, 0, TWO_PI);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.beginPath();
  ctx.ellipse(center.x - r * 0.24, center.y - r * 0.3, r * 0.17, r * 0.1, -0.5, 0, TWO_PI);
  ctx.fill();
  text(ctx, bubble.rime, center.x, center.y + 2, Math.max(21, r * 0.42), "#07101d", "center", 900);

  if (bubble.rime === task.pair.rime && state.judgement === "POP!") {
    ctx.strokeStyle = "#fffbd1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center.x, center.y, r + 13 + Math.sin(now * 9) * 3, 0, TWO_PI);
    ctx.stroke();
  }
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

  const plinth = ctx.createLinearGradient(w * 0.36, h * 0.78, w * 0.64, h * 0.93);
  plinth.addColorStop(0, "rgba(255,210,90,.9)");
  plinth.addColorStop(0.5, "rgba(105,58,24,.92)");
  plinth.addColorStop(1, "rgba(18,11,9,.96)");
  ctx.fillStyle = plinth;
  roundedRect(ctx, launch.x - 140, launch.y + 38, 280, 54, 24);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,.34)";
  ctx.stroke();

  ctx.save();
  ctx.translate(launch.x, launch.y);
  ctx.rotate(angle);
  const barrel = ctx.createLinearGradient(-18, -24, 128, 24);
  barrel.addColorStop(0, "#292334");
  barrel.addColorStop(0.5, "#56efff");
  barrel.addColorStop(1, "#0b3342");
  ctx.fillStyle = barrel;
  roundedRect(ctx, -18, -22, 132, 44, 18);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255,255,255,.66)";
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.52)";
  roundedRect(ctx, 74, -13, 34, 26, 10);
  ctx.fill();
  ctx.restore();

  drawLowPolyPal(ctx, launch.x - 162, launch.y + 22 - pulse * 8, 0.78 + pulse * 0.04, config, state.time);
  drawBubble(ctx, launch.x, launch.y, 42 + pulse * 5, task.pair.onset, config.accent2, "rgba(255,255,255,.9)");

  panel(ctx, w * 0.35, h * 0.66, w * 0.3, 62, "rgba(4,9,20,.62)", `${config.accent}88`);
  text(ctx, `${task.pair.onset} + ?`, w * 0.43, h * 0.692, 25, "#fff", "center", 900);
  text(ctx, task.pair.word, w * 0.57, h * 0.692, 32, config.accent, "center", 900);
  ctx.restore();
}

function drawRhymePop(ctx, state, config, w, h) {
  const task = state.currentTask;
  if (!task) return;
  drawRhymeBackdropFx(ctx, state, config, w, h);

  panel(ctx, w * 0.32, h * 0.105, w * 0.36, 72, "rgba(4,9,20,.58)", `${config.accent2}88`);
  text(ctx, `Build ${task.pair.word}`, w / 2, h * 0.132, clamp(w * 0.04, 28, 54), "#fff", "center", 900);
  text(ctx, `Find ${task.pair.rime}`, w / 2, h * 0.185, 20, config.accent, "center", 900);

  const bubbles = state.bubbles || [];
  for (const bubble of bubbles) {
    drawRhymeOrb(ctx, bubble, task, state, state.time);
  }

  for (const shot of state.shots || []) drawRhymeShot(ctx, shot, state.time);
  for (const burst of state.rhymeBursts || []) drawRhymeBurst(ctx, burst);
  drawRhymeLauncher(ctx, state, config, w, h);

  if (state.judgementT > 0) {
    const p = clamp(state.judgementT / 0.72, 0, 1);
    const color = state.judgement === "POP!" ? config.accent : "#ff9aa8";
    text(ctx, state.judgement, w / 2, h * 0.55 - (1 - p) * 20, 34, color, "center", 900);
  }
}

function drawCritter(ctx, critter, needed, config, now) {
  const bob = Math.sin(now * 2 + critter.phase) * 7;
  const x = critter.x + Math.sin(now * critter.speed + critter.phase) * 12;
  const y = critter.y + bob;
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + critter.r * 0.78, critter.r * 0.78, critter.r * 0.24, 0, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = critter.label === needed ? config.accent : "rgba(190,220,255,.96)";
  ctx.beginPath();
  ctx.arc(x, y, critter.r, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.52)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.beginPath();
  ctx.arc(x - critter.r * 0.28, y - critter.r * 0.28, critter.r * 0.18, 0, TWO_PI);
  ctx.fill();
  text(ctx, critter.label, x, y + 2, Math.max(18, critter.r * 0.62), "#07101d", "center", 900);
  critter.hitX = x;
  critter.hitY = y;
}

function drawSafari(ctx, state, config, w, h) {
  const task = state.currentTask;
  if (!task) return;
  const needed = task.word.graphemes[task.index];
  text(ctx, task.word.word, w / 2, h * 0.17, clamp(w * 0.05, 33, 68), "#fff", "center", 900);
  text(ctx, `Next sound: ${needed}`, w / 2, h * 0.24, 24, config.accent, "center", 900);
  for (const critter of state.critters || []) drawCritter(ctx, critter, needed, config, state.time);

  const slotW = Math.min(90, (w - 80) / Math.max(4, task.word.graphemes.length));
  const startX = w / 2 - (slotW * task.word.graphemes.length) / 2;
  for (let i = 0; i < task.word.graphemes.length; i += 1) {
    panel(ctx, startX + i * slotW, h - 92, slotW - 8, 54, i < task.index ? `${config.accent}cc` : "rgba(5,10,22,.72)", "rgba(255,255,255,.32)");
    text(ctx, i < task.index ? task.word.graphemes[i] : "?", startX + i * slotW + slotW / 2 - 4, h - 65, 23, i < task.index ? "#07101d" : "#fff", "center", 900);
  }

  const px = state.pointer.x || w * 0.5;
  const py = state.pointer.y || h * 0.56;
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(px, py, 42, 0, TWO_PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px + 27, py + 32);
  ctx.lineTo(px + 84, py + 86);
  ctx.stroke();
}

function activeGalleryAnswer(task) {
  if (task.item.answers?.length) return task.item.answers[task.answerIndex || 0];
  return task.item;
}

function drawGallery(ctx, state, config, w, h) {
  const task = state.currentTask;
  if (!task) return;
  const answer = activeGalleryAnswer(task);
  panel(ctx, w * 0.08, h * 0.14, w * 0.84, 118, "rgba(4,8,20,.78)", `${config.accent2}88`);
  text(ctx, answer.prompt, w / 2, h * 0.18, 21, config.accent2, "center", 900);
  text(ctx, answer.display, w / 2, h * 0.245, clamp(w * 0.03, 22, 42), "#fff", "center", 900);

  for (const card of state.cards || []) {
    ctx.save();
    ctx.translate(card.x, card.y);
    ctx.rotate(Math.sin(state.time * 1.5 + card.phase) * 0.05);
    panel(ctx, -58, -42, 116, 84, card.label === answer.answer ? "rgba(255,242,155,.94)" : "rgba(210,235,255,.92)", "rgba(255,255,255,.86)");
    text(ctx, card.label, 0, 1, card.label.length > 5 ? 24 : 35, "#07101d", "center", 900);
    ctx.restore();
  }
  drawLowPolyPal(ctx, w * 0.18, h * 0.78, 0.95, config, state.time);
  text(ctx, task.item.answers?.length ? `Fix ${task.answerIndex + 1}/2` : "Fix it", w * 0.82, h * 0.79, 28, config.accent, "center", 900);
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

function startPs1ArcadeGame(mount, options) {
  const config = CONFIG[options.kind] || CONFIG["sound-beat"];
  const ladder = config.ladder(options.difficulty);
  const total = totalUnits(options.kind, ladder);
  const image = new Image();
  image.src = config.bg;

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none;background:#06101d";
  mount.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const sfx = fn => {
    if (options.getSound ? options.getSound() : options.isSoundEnabled) {
      try { fn(); } catch { /* sound is optional */ }
    }
  };
  let music = null;

  function soundAllowed() {
    return options.getSound ? options.getSound() : options.isSoundEnabled;
  }

  function ensureMusic() {
    if (options.kind !== "sound-beat" || music || !state.audioArmed || state.paused || state.ended || !soundAllowed()) return;
    const nextMusic = startSoundBeatMusic({ bpm: state.level?.bpm || 96, volume: 0.16 });
    if (nextMusic) music = nextMusic;
  }

  function stopMusic() {
    if (!music) return;
    music.stop();
    music = null;
  }

  function armSoundBeatMusic() {
    if (options.kind !== "sound-beat") return;
    state.audioArmed = true;
    state.soundEnabled = soundAllowed();
    ensureMusic();
  }

  const state = {
    stage: clamp(Number(options.startLevel) || 0, 0, 9),
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
    progress: 0,
    paused: false,
    ended: false,
    time: 0,
    beatIndex: 0,
    noteStart: 0,
    judgement: "",
    judgementT: 0,
    beatPulse: 0,
    audioArmed: false,
    soundEnabled: soundAllowed(),
    hitBursts: [],
    rhymeBursts: [],
    shots: [],
    bubbles: [],
    critters: [],
    cards: [],
    pointer: { x: 0, y: 0 }
  };

  let raf = 0;
  let last = performance.now() / 1000;
  let w = 1;
  let h = 1;
  let dpr = 1;

  function resize() {
    const rect = mount.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(320, rect.width || mount.clientWidth || 640);
    h = Math.max(280, rect.height || mount.clientHeight || 420);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setupEntities();
  }

  function setScore(next) {
    state.score = Math.max(0, Math.round(next));
    options.onScoreUpdate?.(state.score);
  }

  function updateProgress() {
    const clearedInLevel = state.tasks.slice(0, state.taskIndex).reduce((sum, task) => sum + taskUnits(options.kind, task), 0);
    const levelUnits = state.tasks.reduce((sum, task) => sum + taskUnits(options.kind, task), 0) || 1;
    state.progress = clamp((state.stage + clearedInLevel / levelUnits) / ladder.length, 0, 1);
    options.onProgressUpdate?.(state.stage, ladder.length);
  }

  function startLevel() {
    if (options.kind === "sound-beat") stopMusic();
    state.level = ladder[state.stage];
    image.src = config.bgByWorld?.[state.level.world] || config.bg;
    state.tasks = makeTasks(options.kind, state.level);
    state.taskIndex = 0;
    state.combo = 0;
    state.shots = [];
    state.rhymeBursts = [];
    state.countdown = 3.45;
    state.countdownTarget = countdownTarget();
    setupTask();
    updateProgress();
  }

  function countdownTarget() {
    if (options.kind === "sound-beat") return `Tap sounds in ${state.level.world}`;
    if (options.kind === "rhyme-pop") return `Pop ${state.level.rime} words`;
    if (options.kind === "sound-safari") return "Net the sounds in order";
    return "Find the sentence fix";
  }

  function setupTask() {
    state.currentTask = state.tasks[state.taskIndex] || null;
    state.beatIndex = 0;
    state.shots = [];
    if (!state.currentTask) return;
    const now = performance.now() / 1000;
    if (options.kind === "sound-beat") state.noteStart = now + 1.05;
    setupEntities();
  }

  function setupEntities() {
    const task = state.currentTask;
    if (!task || w < 10 || h < 10) return;
    if (options.kind === "rhyme-pop") {
      const rimes = task.level.rimes;
      const shift = (state.stage + state.taskIndex * 2 + 1) % rimes.length;
      const orderedRimes = rimes.map((_, index) => rimes[(index + shift) % rimes.length]);
      const gap = Math.min(190, w / (orderedRimes.length + 1));
      state.bubbles = orderedRimes.map((rime, index) => ({
        rime,
        x: w / 2 + (index - (orderedRimes.length - 1) / 2) * gap,
        y: h * (0.28 + (index % 2) * 0.13),
        r: clamp(w * 0.035, 36, 55),
        vx: (index % 2 ? -1 : 1) * (16 + state.level.dropRate * 60 + index * 7),
        phase: state.stage * 1.7 + state.taskIndex * 0.9 + index * 1.8,
        wobble: 16 + index * 5,
        wobbleY: 10 + index * 3,
        wobbleSpeed: 1.2 + index * 0.18,
        colorIndex: index + state.stage
      }));
    }
    if (options.kind === "sound-safari") {
      const labels = [...task.word.graphemes, ...task.word.decoys];
      state.critters = labels.map((label, index) => ({
        label,
        x: w * (0.17 + (index % 4) * 0.22),
        y: h * (0.34 + Math.floor(index / 4) * 0.19),
        r: clamp(w * 0.026, 25, 42),
        phase: index * 1.7,
        speed: 0.7 + (index % 4) * 0.13
      }));
    }
    if (options.kind === "star-gallery") {
      const answer = activeGalleryAnswer(task);
      state.cards = answer.options.map((label, index) => ({
        label,
        x: w * (0.22 + index * 0.23),
        y: h * (0.47 + (index % 2) * 0.13),
        phase: index * 1.9
      }));
    }
  }

  function requeueTask() {
    const task = state.currentTask;
    if (task && (task.attempts || 0) < 2) {
      state.tasks.push({ ...task, attempts: (task.attempts || 0) + 1, index: 0, answerIndex: 0 });
    }
  }

  function missCurrent({ requeue = true } = {}) {
    if (!state.currentTask || state.ended) return;
    state.mistakes += 1;
    state.combo = 0;
    if (options.kind === "sound-beat") {
      state.judgement = "MISS";
      state.judgementT = 0.72;
      state.beatPulse = 0.65;
    }
    if (requeue) requeueTask();
    sfx(playSoftBuzz);
    nextTask();
  }

  function finishUnit(points = 100) {
    state.correct += 1;
    state.combo += 1;
    setScore(state.score + points + Math.min(6, state.combo) * 20);
    sfx(state.combo > 2 ? playStarChime : playCorrectChime);
  }

  function finishTask(points = 100) {
    finishUnit(points);
    nextTask();
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
      stopMusic();
      state.progress = 1;
      options.onProgressUpdate?.(ladder.length, ladder.length);
      options.onComplete?.(config.stars({ correct: state.correct, total, mistakes: state.mistakes }), state.score, total);
      return;
    }
    state.stage = nextStage;
    startLevel();
  }

  function tapBeat() {
    const task = state.currentTask;
    if (!task || state.countdown > 0) return;
    ensureMusic();
    const now = performance.now() / 1000;
    const notes = [...task.item.beats, "blend"];
    const spacing = 60 / state.level.bpm;
    const targetTime = state.noteStart + state.beatIndex * spacing;
    const windowSeconds = state.level.hitWindowMs / 1000;
    const delta = Math.abs(now - targetTime);
    if (delta <= windowSeconds) {
      const quality = delta <= windowSeconds * 0.33 ? "PERFECT" : delta <= windowSeconds * 0.66 ? "GREAT" : "GOOD";
      state.judgement = quality;
      state.judgementT = 0.72;
      state.beatPulse = quality === "PERFECT" ? 1 : quality === "GREAT" ? 0.82 : 0.65;
      const burstPoint = beatLanePoint(state.beatIndex % BEAT_LANES.length, 1, w, h);
      state.hitBursts.push({
        x: burstPoint.x,
        y: burstPoint.y,
        t: 0,
        life: 0.5,
        seed: state.time + state.beatIndex,
        color: quality === "PERFECT" ? config.accent : config.accent2
      });
      sfx(playTapSound);
      state.beatIndex += 1;
      if (state.beatIndex >= notes.length) finishTask(180);
    } else {
      missCurrent();
    }
  }

  function rhymeMiss(label = "MISS") {
    if (!state.currentTask || state.ended) return;
    state.mistakes += 1;
    state.combo = 0;
    state.judgement = label;
    state.judgementT = 0.72;
    state.beatPulse = 0.62;
    sfx(playSoftBuzz);
  }

  function fireRhymeShot(x, y) {
    const task = state.currentTask;
    if (!task || state.countdown > 0 || state.shots.length >= 2) return;
    const launch = rhymeLauncherPoint(w, h);
    const targetX = clamp(x || w / 2, w * 0.08, w * 0.92);
    const targetY = clamp(y || h * 0.34, h * 0.12, h * 0.72);
    let dx = targetX - launch.x;
    let dy = targetY - launch.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    if (distance < 30) {
      dx = 0;
      dy = -1;
    } else {
      dx /= distance;
      dy /= distance;
    }
    const speed = clamp(w * 0.78, 620, 930);
    state.shots.push({
      x: launch.x,
      y: launch.y - 20,
      vx: dx * speed,
      vy: dy * speed,
      r: clamp(w * 0.021, 22, 34),
      label: task.pair.onset,
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
    const correct = bubble.rime === task.pair.rime;
    state.rhymeBursts.push({
      x: bubble.hitX || bubble.x,
      y: bubble.hitY || bubble.y,
      t: 0,
      life: correct ? 0.66 : 0.42,
      seed: state.time + shot.seed,
      color: correct ? config.accent : "#ff7a8a"
    });
    if (correct) {
      state.judgement = "POP!";
      state.judgementT = 0.72;
      state.beatPulse = 1;
      sfx(playPopSound);
      finishUnit(140);
      nextTask();
    } else {
      rhymeMiss("TRY AGAIN");
    }
  }

  function tapRhyme(x, y) {
    fireRhymeShot(x, y);
  }

  function tapSafari(x, y) {
    const task = state.currentTask;
    if (!task) return;
    const hit = state.critters.find(critter => Math.hypot(x - (critter.hitX || critter.x), y - (critter.hitY || critter.y)) <= critter.r + 16);
    if (!hit) return;
    const needed = task.word.graphemes[task.index];
    if (hit.label === needed) {
      finishUnit(80);
      task.index += 1;
      if (task.index >= task.word.graphemes.length) nextTask();
      else setupEntities();
    } else {
      state.mistakes += 1;
      state.combo = 0;
      sfx(playSoftBuzz);
    }
  }

  function tapGallery(x, y) {
    const task = state.currentTask;
    if (!task) return;
    const hit = state.cards.find(card => Math.abs(x - card.x) <= 66 && Math.abs(y - card.y) <= 52);
    if (!hit) return;
    const answer = activeGalleryAnswer(task);
    if (hit.label === answer.answer) {
      finishUnit(120);
      if (task.item.answers?.length && task.answerIndex < task.item.answers.length - 1) {
        task.answerIndex += 1;
        setupEntities();
      } else {
        nextTask();
      }
    } else {
      missCurrent();
    }
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (w / rect.width),
      y: (event.clientY - rect.top) * (h / rect.height)
    };
  }

  function onPointerMove(event) {
    state.pointer = pointerPosition(event);
  }

  function onPointerDown(event) {
    const point = pointerPosition(event);
    state.pointer = point;
    if (options.kind === "sound-beat") {
      armSoundBeatMusic();
      if (state.paused || state.ended || state.countdown > 0) return;
      tapBeat();
    }
    else if (state.paused || state.ended || state.countdown > 0) return;
    else if (options.kind === "rhyme-pop") tapRhyme(point.x, point.y);
    else if (options.kind === "sound-safari") tapSafari(point.x, point.y);
    else tapGallery(point.x, point.y);
  }

  function onKeyDown(event) {
    if (event.key !== " " && event.key !== "Enter" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (options.kind === "sound-beat") {
      armSoundBeatMusic();
      if (!state.paused && !state.ended && state.countdown <= 0) tapBeat();
    }
    if (options.kind === "rhyme-pop" && !state.paused && !state.ended && state.countdown <= 0) {
      fireRhymeShot(state.pointer.x || w / 2, state.pointer.y || h * 0.34);
    }
  }

  function updateRhymePop(dt) {
    if (!state.currentTask || state.countdown > 0) return;
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
      const hit = state.bubbles.find(bubble => {
        const center = rhymeBubbleCenter(bubble, state.time);
        return Math.hypot(shot.x - center.x, shot.y - center.y) <= bubble.r + shot.r * 0.7;
      });
      if (hit) {
        shot.dead = true;
        const beforeTask = state.currentTask;
        resolveRhymeHit(shot, hit);
        if (beforeTask !== state.currentTask) return;
      }
      if (shot.x < -80 || shot.x > w + 80 || shot.y < -80 || shot.y > h + 80) {
        shot.dead = true;
        rhymeMiss();
      }
    }
    state.shots = state.shots.filter(shot => !shot.dead);
    state.rhymeBursts = state.rhymeBursts
      .map(burst => ({ ...burst, t: burst.t + dt }))
      .filter(burst => burst.t < burst.life);
  }

  function tick() {
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, now - last);
    last = now;
    if (!state.paused && !state.ended) {
      state.soundEnabled = soundAllowed();
      state.time += reduceMotion ? dt * 0.35 : dt;
      state.beatPulse = Math.max(0, state.beatPulse - dt * 2.8);
      state.judgementT = Math.max(0, state.judgementT - dt);
      state.hitBursts = state.hitBursts
        .map(burst => ({ ...burst, t: burst.t + dt }))
        .filter(burst => burst.t < burst.life);
      const countdownBefore = state.countdown;
      state.countdown = Math.max(0, state.countdown - dt);
      if (options.kind === "sound-beat" && countdownBefore > 0 && state.countdown === 0) {
        state.beatIndex = 0;
        state.noteStart = now + 0.82;
        ensureMusic();
      }
      if (options.kind === "sound-beat" && state.currentTask && state.countdown <= 0) {
        if (!soundAllowed()) stopMusic();
        else ensureMusic();
        const notes = [...state.currentTask.item.beats, "blend"];
        const spacing = 60 / state.level.bpm;
        const targetTime = state.noteStart + state.beatIndex * spacing;
        if (state.beatIndex < notes.length && now - targetTime > state.level.hitWindowMs / 1000 + 0.12) {
          missCurrent();
        }
      }
      if (options.kind === "rhyme-pop") updateRhymePop(dt);
      if (options.kind === "star-gallery") {
        for (const card of state.cards) {
          card.x += state.level.driftSpeed * dt * 38;
          if (card.x > w + 80) card.x = -90;
        }
      }
    }
    draw(now);
    raf = window.requestAnimationFrame(tick);
  }

  function draw(now) {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!drawCover(ctx, image, w, h)) drawFallback(ctx, w, h, config, state.time);
    drawScreenGrade(ctx, w, h);
    if (options.kind === "sound-beat") drawBeat(ctx, state, config, w, h, now);
    else if (options.kind === "rhyme-pop") drawRhymePop(ctx, state, config, w, h);
    else if (options.kind === "sound-safari") drawSafari(ctx, state, config, w, h);
    else drawGallery(ctx, state, config, w, h);
    drawHud(ctx, state, config, w, h);
    drawCountdown(ctx, state, config, w, h);
    ctx.restore();
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("keydown", onKeyDown);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();
  startLevel();
  tick();

  const api = {
    pause() {
      state.paused = true;
      stopMusic();
    },
    resume() {
      state.paused = false;
      last = performance.now() / 1000;
    },
    destroy() {
      state.ended = true;
      stopMusic();
      window.cancelAnimationFrame(raf);
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
        audioArmed: state.audioArmed,
        soundEnabled: state.soundEnabled,
        musicActive: Boolean(music),
        backgroundSrc: image.src,
        bubbles: state.bubbles?.map(bubble => ({
          rime: bubble.rime,
          x: bubble.hitX || bubble.x,
          y: bubble.hitY || bubble.y,
          r: bubble.r
        })),
        shots: state.shots?.length || 0,
        judgement: state.judgement,
        currentTask: state.currentTask
      };
    }
  };
  options.onEngineReady?.(api);
  return api;
}

export default function Ps1ArcadeGame({
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

  useEffect(() => {
    soundRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const engine = startPs1ArcadeGame(mountRef.current, {
      kind,
      difficulty,
      startLevel,
      onScoreUpdate,
      onProgressUpdate,
      onComplete,
      onCheckpoint,
      onEngineReady,
      getSound: () => soundRef.current
    });
    return () => engine.destroy();
  }, [kind, difficulty, startLevel, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady]);

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
