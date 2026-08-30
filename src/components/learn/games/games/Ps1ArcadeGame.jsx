import { useEffect, useRef } from "react";
import {
  playCorrectChime,
  playSoftBuzz,
  playStarChime,
  playTapSound,
  playWhoosh,
  startSoundBeatMusic
} from "../../../../utils/audio/gameSfx.js";
import { speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import {
  soundBeatBlendCompletionAction,
  soundBeatChoiceSet,
  soundBeatLadder,
  soundBeatVisiblePrompt,
  soundBeatStars,
  soundBeatTapFeedback
} from "../../../../utils/soundBeatTracks.js";
import {
  TWO_PI,
  clamp,
  easeOut,
  text,
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

const CONFIG = {
  "sound-beat": {
    title: "Sound Beat",
    action: "Choose each sound, then GO",
    bg: "/images/learn-games/ps1-arcade/sound-beat-stage-v2.webp",
    accent: "#b8ff3d",
    accent2: "#ff3d8b",
    ladder: soundBeatLadder,
    stars: soundBeatStars
  }
};

const BEAT_LANES = [
  { color: "#52fff0", dark: "#073738" },
  { color: "#ffd23d", dark: "#433206" },
  { color: "#ff4f5f", dark: "#4a0810" },
  { color: "#d85cff", dark: "#3d0a4c" }
];

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

  for (const side of [-1, 1]) {
    const speakerX = side < 0 ? w * 0.075 : w * 0.925;
    const speakerY = h * 0.61;
    const speakerW = clamp(w * 0.095, 54, 104);
    const speakerH = clamp(h * 0.25, 126, 210);
    const speakerGrad = ctx.createLinearGradient(speakerX - speakerW / 2, speakerY - speakerH / 2, speakerX + speakerW / 2, speakerY + speakerH / 2);
    speakerGrad.addColorStop(0, "rgba(33,43,70,.92)");
    speakerGrad.addColorStop(0.58, "rgba(4,9,21,.96)");
    speakerGrad.addColorStop(1, "rgba(0,0,0,.98)");
    panel(ctx, speakerX - speakerW / 2, speakerY - speakerH / 2, speakerW, speakerH, speakerGrad, "rgba(255,255,255,.18)");
    for (let ring = 0; ring < 2; ring += 1) {
      const cy = speakerY - speakerH * 0.22 + ring * speakerH * 0.42;
      const radius = speakerW * (0.24 + pulse * 0.04);
      const cone = ctx.createRadialGradient(speakerX - radius * 0.2, cy - radius * 0.28, 2, speakerX, cy, radius);
      cone.addColorStop(0, "rgba(255,255,255,.5)");
      cone.addColorStop(0.22, ring ? `${config.accent2}90` : `${config.accent}90`);
      cone.addColorStop(1, "rgba(2,5,13,.98)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.arc(speakerX, cy, radius, 0, TWO_PI);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,.24)";
      ctx.stroke();
    }
  }
}

function beatLanePoint(lane, progress, w, h) {
  const targetY = h * 0.86;
  const stageY = h * 0.48;
  const bottomLeft = w * (w < 560 ? 0.14 : 0.25);
  const bottomRight = w * (w < 560 ? 0.86 : 0.75);
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

  const sideWall = ctx.createLinearGradient(0, topY, 0, bottomY);
  sideWall.addColorStop(0, "rgba(38,58,92,.46)");
  sideWall.addColorStop(0.6, "rgba(8,15,32,.74)");
  sideWall.addColorStop(1, "rgba(0,0,0,.9)");
  ctx.fillStyle = sideWall;
  ctx.beginPath();
  ctx.moveTo(leftTop, topY);
  ctx.lineTo(leftBottom, bottomY);
  ctx.lineTo(Math.max(0, leftBottom - w * 0.055), bottomY);
  ctx.lineTo(leftTop - w * 0.035, topY + h * 0.035);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(rightTop, topY);
  ctx.lineTo(rightBottom, bottomY);
  ctx.lineTo(Math.min(w, rightBottom + w * 0.055), bottomY);
  ctx.lineTo(rightTop + w * 0.035, topY + h * 0.035);
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

  for (let i = 0; i < 7; i += 1) {
    const p = ((state.time * 0.42 + i / 7) % 1);
    const y = topY + (bottomY - topY) * p;
    const left = leftTop + (leftBottom - leftTop) * p;
    const right = rightTop + (rightBottom - rightTop) * p;
    const inset = (right - left) * 0.33;
    ctx.fillStyle = i % 2 ? `${config.accent}18` : `${config.accent2}18`;
    ctx.beginPath();
    ctx.moveTo(left + inset, y);
    ctx.lineTo(right - inset, y);
    ctx.lineTo(right - inset * 0.7, y + 10 + p * 18);
    ctx.lineTo(left + inset * 0.7, y + 10 + p * 18);
    ctx.closePath();
    ctx.fill();
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
  const padGrad = ctx.createLinearGradient(point.x - 44, point.y - 24, point.x + 44, point.y + 34);
  padGrad.addColorStop(0, "rgba(255,255,255,.28)");
  padGrad.addColorStop(0.36, active ? `${laneStyle.color}8a` : "rgba(255,255,255,.18)");
  padGrad.addColorStop(1, "rgba(2,5,14,.76)");
  ctx.fillStyle = padGrad;
  cutRect(ctx, point.x - 44, point.y - 22, 88, 44, 13);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.34)";
  ctx.lineWidth = 2;
  cutRect(ctx, point.x - 44, point.y - 22, 88, 44, 13);
  ctx.stroke();
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
  const width = Math.min(76 * point.scale, Math.max(58, w / 4 - 10));
  const height = 48 * point.scale;
  const pulse = active ? state.beatPulse || 0 : 0;

  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.scale(1, 0.9);
  ctx.fillStyle = "rgba(0,0,0,.34)";
  cutRect(ctx, -width * 0.52 + 6, -height * 0.5 + 8, width * 1.04, height, 10 * point.scale);
  ctx.fill();

  const fill = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
  fill.addColorStop(0, active ? "#ffffff" : "rgba(255,255,255,.72)");
  fill.addColorStop(0.2, laneStyle.color);
  fill.addColorStop(1, laneStyle.dark);
  ctx.fillStyle = fill;
  cutRect(ctx, -width / 2, -height / 2, width, height, 10 * point.scale);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.34)";
  cutRect(ctx, -width * 0.38, -height * 0.38, width * 0.76, height * 0.18, 5 * point.scale);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.25)";
  cutRect(ctx, -width * 0.4, height * 0.23, width * 0.8, height * 0.16, 5 * point.scale);
  ctx.fill();
  ctx.lineWidth = active ? 5 + pulse * 3 : 3;
  ctx.strokeStyle = active ? "#f8ffff" : "rgba(255,255,255,.62)";
  cutRect(ctx, -width / 2, -height / 2, width, height, 10 * point.scale);
  ctx.stroke();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `${laneStyle.color}cc`;
  ctx.lineWidth = 9 + pulse * 6;
  cutRect(ctx, -width / 2, -height / 2, width, height, 10 * point.scale);
  ctx.stroke();
  ctx.restore();

  const labelLength = Math.max(1, String(label).length);
  const labelSize = clamp(width / Math.max(2.4, labelLength * 0.68), 12, 32);
  text(ctx, label, point.x, point.y + 1, labelSize, "#ffffff", "center", 900);
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

function drawSoundBeatHud(ctx, state, config, w, h) {
  const current = state.currentTask?.item;
  const totalBeats = current ? current.beats.length + 1 : 4;
  const filledBeats = Math.min(totalBeats, state.beatIndex || 0);
  const compact = w < 760 || h < 520;
  const hudY = 16;
  const portraitX = compact ? 50 : 70;
  const portraitY = compact ? 62 : 78;
  const portraitRadius = compact ? 43 : 58;
  const portraitScale = compact ? 0.56 : 0.78;
  const scoreX = compact ? 98 : 150;
  const scoreW = compact ? Math.min(214, w * 0.38) : 260;
  const scoreH = compact ? 56 : 72;
  const meterX = compact ? 18 : w * 0.38;
  const meterY = compact ? 112 : 42;
  const meterW = compact ? w - 36 : w * 0.28;
  const meterPanelY = compact ? 90 : hudY + 6;
  const meterPanelH = compact ? 44 : 50;
  const starsW = compact ? Math.min(162, w * 0.28) : 344;
  const starsX = w - starsW - 16;

  ctx.save();
  ctx.fillStyle = "rgba(3,7,18,.78)";
  ctx.strokeStyle = "rgba(180,220,255,.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.PI / 8 + i * Math.PI / 4;
    const x = portraitX + Math.cos(angle) * portraitRadius;
    const y = portraitY + Math.sin(angle) * portraitRadius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawSoundBeatPortrait(ctx, portraitX, portraitY + (compact ? 5 : 0), portraitScale, state.time);

  panel(ctx, scoreX, hudY, scoreW, scoreH, "rgba(3,7,18,.8)", "rgba(255,255,255,.34)");
  text(ctx, "♪", scoreX + 28, hudY + scoreH * 0.48, compact ? 27 : 34, config.accent2, "center", 900);
  text(ctx, String(state.score).padStart(6, "0"), scoreX + 66, hudY + scoreH * 0.45, compact ? 24 : 31, "#f8d64b", "left", 900);
  const bars = Math.max(1, Math.min(8, state.combo + 1));
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i < bars ? "#55fff0" : "rgba(255,255,255,.16)";
    roundedRect(ctx, scoreX + 52 + i * (compact ? 15 : 18), hudY + scoreH - 18, compact ? 10 : 13, compact ? 9 : 11, 4);
    ctx.fill();
  }
  if (!compact) text(ctx, "⚡", scoreX + scoreW - 34, hudY + 50, 28, "#ffdf3d", "center", 900);

  panel(ctx, meterX, meterPanelY, meterW, meterPanelH, "rgba(3,7,18,.78)", "rgba(255,255,255,.34)");
  for (let i = 0; i < 10; i += 1) {
    const dotX = meterX + 32 + i * ((meterW - 64) / 9);
    ctx.fillStyle = i < filledBeats ? config.accent2 : (i < totalBeats ? config.accent : "rgba(255,255,255,.18)");
    ctx.beginPath();
    ctx.arc(dotX, meterY, compact ? 7 : 9, 0, TWO_PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const activeDotX = meterX + 32 + Math.min(9, filledBeats) * ((meterW - 64) / 9);
  ctx.strokeStyle = "#ffb13d";
  ctx.lineWidth = compact ? 3 : 4;
  ctx.beginPath();
  ctx.moveTo(activeDotX, meterY - (compact ? 22 : 30));
  ctx.lineTo(activeDotX, meterY + (compact ? 22 : 30));
  ctx.stroke();

  panel(ctx, starsX, hudY, starsW, scoreH, "rgba(3,7,18,.8)", "rgba(255,255,255,.34)");
  const starGap = compact ? 26 : 38;
  const starStart = starsX + (compact ? 24 : 28);
  // Live projection: stars the child would earn if every remaining word lands
  // clean from here, using the game's real rubric inputs.
  const remainingWords = Math.max(0, (state.totalUnits || 0) - (state.wordsEnded || 0));
  const projectedStars = state.totalUnits
    ? config.stars({ correct: state.correct + remainingWords, total: state.totalUnits, mistakes: state.mistakes })
    : 0;
  for (let i = 0; i < (compact ? 3 : 5); i += 1) {
    const lit = i < projectedStars;
    text(ctx, lit ? "★" : "☆", starStart + i * starGap, hudY + scoreH * 0.44, compact ? 22 : 28, lit ? "#ffd53b" : "rgba(255,255,255,.34)", "center", 900);
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
  const countdownScale = state.reduceMotion ? 1 : 0.86 + scale * 0.18;
  ctx.scale(countdownScale, countdownScale);
  text(ctx, main, 0, 0, clamp(w * 0.13, 82, 170), main === "GO!" ? config.accent : config.accent2, "center", 900);
  ctx.restore();
}

function makeTasks(kind, level) {
  return level.items.map(item => ({ type: kind, item }));
}

function taskUnits() {
  return 1;
}

function totalUnits(kind, ladder) {
  return ladder.reduce((sum, level) => sum + makeTasks(kind, level).reduce((inner, task) => inner + taskUnits(kind, task), 0), 0);
}

function drawBeat(ctx, state, config, w, h) {
  const task = state.currentTask;
  if (!task) return;
  const item = task.item;
  const notes = [...item.beats, "blend"];
  const visiblePrompt = soundBeatVisiblePrompt(item, state.beatIndex, {
    soundEnabled: state.soundEnabled
  });

  ctx.save();
  drawBeatBackdrop(ctx, state, config, w, h);

  ctx.save();
  const titlePanel = ctx.createLinearGradient(w * 0.29, h * 0.22, w * 0.71, h * 0.4);
  titlePanel.addColorStop(0, "rgba(3,15,14,.42)");
  titlePanel.addColorStop(1, "rgba(1,6,18,.22)");
  ctx.fillStyle = titlePanel;
  roundedRect(ctx, w * 0.31, h * 0.2, w * 0.38, h * 0.16, 8);
  ctx.fill();
  text(
    ctx,
    state.soundEnabled ? "LISTEN · CHOOSE NEXT" : "SOUND OFF · MATCH THE MODEL",
    w / 2,
    h * 0.235,
    clamp(w * 0.016, 11, 17),
    state.soundEnabled ? "#dff7ff" : config.accent,
    "center",
    900
  );
  const titleSize = clamp(
    Math.min(w * 0.055, (w * 0.48) / Math.max(2.4, visiblePrompt.length * 0.58)),
    20,
    74
  );
  text(ctx, visiblePrompt, w / 2, h * 0.3, titleSize, "#fff", "center", 900);
  ctx.restore();

  drawSoundBeatRunway(ctx, state, config, w, h);

  const choiceSet = state.choiceSet || soundBeatChoiceSet(item, state.beatIndex);
  const choiceLanes = choiceSet.choices.length === 1 ? [1] : choiceSet.choices.map((_, index) => index);
  for (let lane = 0; lane < BEAT_LANES.length; lane += 1) {
    const selected = choiceLanes[state.selectedChoice] === lane;
    drawBeatTarget(ctx, lane, state, w, h, selected);
  }

  // All pads share equivalent geometry. The correct sound changes lane for
  // every beat, so position and rhythm timing cannot reveal or determine it.
  for (let index = 0; index < choiceSet.choices.length; index += 1) {
    const lane = choiceLanes[index];
    drawBeatPad(
      ctx,
      choiceSet.choices[index],
      lane,
      1,
      index === state.selectedChoice,
      config,
      state,
      w,
      h
    );
  }

  const slotW = Math.min(78, (w * 0.34) / notes.length);
  const slotStart = w * 0.5 - (slotW * notes.length) / 2;
  const slotY = h - 142;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(slotStart + slotW / 2 - 5, slotY + 19);
  ctx.lineTo(slotStart + (notes.length - 0.5) * slotW - 5, slotY + 19);
  ctx.stroke();
  for (let i = 0; i < notes.length; i += 1) {
    const filled = i < state.beatIndex;
    const active = i === state.beatIndex;
    const focusOffset = active && !state.reduceMotion ? Math.sin(state.time * 5) * 2 : 0;
    const label = notes[i] === "blend" ? "GO" : notes[i];
    const fill = filled ? `${config.accent}d8` : active ? "rgba(255,61,139,.34)" : "rgba(5,10,22,.72)";
    const stroke = filled ? "#f4ffd8" : active ? config.accent2 : "rgba(255,255,255,.22)";
    panel(ctx, slotStart + i * slotW, slotY + focusOffset, slotW - 10, 38, fill, stroke);
    text(ctx, filled ? label : active ? (label === "GO" ? "GO" : "?") : "", slotStart + i * slotW + slotW / 2 - 5, slotY + 19 + focusOffset, clamp(slotW * 0.3, 12, 18), filled ? "#07101d" : "#fff", "center", 900);
    if (active) {
      ctx.fillStyle = config.accent2;
      ctx.beginPath();
      ctx.moveTo(slotStart + i * slotW + slotW / 2 - 11, slotY - 8 + focusOffset);
      ctx.lineTo(slotStart + i * slotW + slotW / 2 + 1, slotY - 8 + focusOffset);
      ctx.lineTo(slotStart + i * slotW + slotW / 2 - 5, slotY - 1 + focusOffset);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  if (!state.reduceMotion) {
    for (const burst of state.hitBursts) drawBeatBurst(ctx, burst);
  }
  if (state.judgementT > 0) {
    const p = clamp(state.judgementT / 0.72, 0, 1);
    const lanePoint = beatLanePoint(Math.max(0, (state.beatIndex - 1) % BEAT_LANES.length), 1, w, h);
    const judgementColor = state.judgement === "SOUND ON!" ? "#ffd23d" : config.accent;
    text(ctx, state.judgement, lanePoint.x, lanePoint.y - 92 - (1 - p) * 20, 34, judgementColor, "center", 900);
  }

  text(ctx, "TAP A PAD · ← → + SPACE", w / 2, h * 0.96, 16, "#dff7ff", "center", 900);
  ctx.restore();
}

function startPs1ArcadeGame(mount, options) {
  const config = CONFIG[options.kind] || CONFIG["sound-beat"];
  const ladder = config.ladder(options.difficulty);
  const total = totalUnits(options.kind, ladder);
  const image = new Image();
  image.src = config.bg;

  const { canvas, ctx } = createGameCanvas(mount);
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", "Sound Beat choice stage. Use Left and Right to select a pad, then Space or Enter to choose it.");
  const liveStatus = document.createElement("div");
  liveStatus.setAttribute("role", "status");
  liveStatus.setAttribute("aria-live", "polite");
  liveStatus.setAttribute("aria-atomic", "true");
  liveStatus.dataset.soundBeatStatus = "true";
  liveStatus.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0";
  mount.appendChild(liveStatus);
  const reduceMotion = prefersReducedMotion();
  const { soundAllowed, sfx } = createSoundGate(options);
  const musicAllowed = () => options.getMusic ? options.getMusic() : options.isMusicEnabled !== false;

  let music = null;
  let musicBpm = 0;
  let musicUnsupported = false;

  // The synth track is the game's metronome: it always runs at the round's BPM
  // so what the child hears IS the timing they tap against. It follows the
  // engine lifecycle (countdown end, pause/resume, destroy) and the independent
  // music flag. Spoken cues and game effects continue to use soundAllowed().
  function ensureMusic() {
    if (state.paused || state.ended || state.countdown > 0 || !musicAllowed() || musicUnsupported) {
      stopMusic();
      return;
    }
    const bpm = Math.round(state.roundBpm || state.level?.bpm || 0);
    if (!bpm) return;
    if (music && musicBpm === bpm) return;
    stopMusic();
    music = startSoundBeatMusic({ bpm });
    musicBpm = bpm;
    if (!music) musicUnsupported = true;
  }

  function stopMusic() {
    if (music) {
      music.stop();
      music = null;
    }
    musicBpm = 0;
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
    choiceSet: null,
    selectedChoice: 0,
    noteStart: 0,
    // A "round" groups several levels so a stop/countdown only happens every
    // >= ROUND_MIN_SECONDS. Tempo + music are held steady across a round.
    roundStartAt: 0,
    roundBpm: 0,
    roundWindow: 0,
    wordRhythmBonus: 0,
    wordsEnded: 0,
    totalUnits: total,
    inputLockedUntil: 0,
    pausedAt: 0,
    judgement: "",
    judgementT: 0,
    beatPulse: 0,
    soundEnabled: soundAllowed(),
    musicEnabled: musicAllowed(),
    hitBursts: [],
    pointer: { x: 0, y: 0 },
    pendingPointer: null,
    awaitingBlend: false,
    pendingBlendCompletion: null,
    promptMode: "",
    reduceMotion
  };

  let w = 1;
  let h = 1;
  let dpr = 1;

  function resize() {
    const size = sizeCanvasToMount(mount, canvas, ctx);
    w = size.width;
    h = size.height;
    dpr = size.dpr;
  }

  const setScore = createScoreReporter(state, options);

  function updateProgress() {
    const clearedInLevel = state.tasks.slice(0, state.taskIndex).reduce((sum, task) => sum + taskUnits(options.kind, task), 0);
    const levelUnits = state.tasks.reduce((sum, task) => sum + taskUnits(options.kind, task), 0) || 1;
    state.progress = clamp((state.stage + clearedInLevel / levelUnits) / ladder.length, 0, 1);
    options.onProgressUpdate?.(state.stage, ladder.length);
  }

  function startLevel() {
    state.level = ladder[state.stage];
    image.src = config.bgByWorld?.[state.level.world] || config.bg;
    state.tasks = makeTasks(options.kind, state.level);
    state.taskIndex = 0;
    state.combo = 0;

    // Group short levels into rounds of >= this many seconds. Only the first
    // level of a round pays the 3-2-1 stop/start; the rest flow straight on,
    // keeping one steady timing window per round.
    const roundFloor = state.level.minPlaySeconds || 60;
    const nowSec = performance.now() / 1000;
    const startNewRound = !state.roundStartAt
      || (nowSec - state.roundStartAt) >= roundFloor;

    if (startNewRound) {
      stopMusic();
      state.roundStartAt = nowSec;
      state.roundBpm = state.level.bpm;
      state.roundWindow = state.level.hitWindowMs;
      state.countdown = 3.45;
      state.countdownTarget = countdownTarget();
    } else {
      // Continue the current round: no countdown, keep tempo + music running.
      state.countdown = 0;
    }
    setupTask();
    updateProgress();
  }

  function countdownTarget() {
    return `Choose matching sounds in ${state.level.world}`;
  }

  function setupTask() {
    state.currentTask = state.tasks[state.taskIndex] || null;
    state.beatIndex = 0;
    state.wordRhythmBonus = 0;
    if (!state.currentTask) return;
    setupBeatChoice();
    const now = performance.now() / 1000;
    state.noteStart = now + 1.05;
    // Mid-round the next word starts right away, so sound out its first note;
    // after a countdown the tick's countdown-end branch does it instead.
    if (state.countdown <= 0 && !state.paused) speakActiveNote();
  }

  function syncChoiceAccessibility({ announce = true } = {}) {
    const item = state.currentTask?.item;
    const choiceSet = state.choiceSet;
    if (!item || !choiceSet) return;
    const promptMode = state.soundEnabled ? "listen" : "model";
    const modeChanged = state.promptMode !== promptMode;
    state.promptMode = promptMode;
    canvas.dataset.soundBeatPromptMode = promptMode;
    const model = String(item.say || item.word || "");
    canvas.setAttribute(
      "aria-label",
      promptMode === "model"
        ? `Sound Beat model matching stage. Model: ${model}. Use Left and Right to select a pad, then Space or Enter to choose it.`
        : "Sound Beat listening stage. Use Left and Right to select a pad, then Space or Enter to choose it."
    );
    if (!announce && !modeChanged) return;
    if (choiceSet.beatUnit === "blend") {
      liveStatus.textContent = promptMode === "model"
        ? `Model: ${model}. Choose GO to complete the target.`
        : "Choose GO to hear the completed target.";
      return;
    }
    liveStatus.textContent = promptMode === "model"
      ? `Sound is off. Model: ${model}. Match the next ${choiceSet.beatUnit}. Options: ${choiceSet.choices.join(", ")}.`
      : `Choose the next ${choiceSet.beatUnit}. Options: ${choiceSet.choices.join(", ")}.`;
  }

  function setupBeatChoice() {
    const item = state.currentTask?.item;
    if (!item) {
      state.choiceSet = null;
      state.selectedChoice = 0;
      return;
    }
    state.choiceSet = soundBeatChoiceSet(item, state.beatIndex, {
      seed: `${state.stage}:${state.taskIndex}`
    });
    state.selectedChoice = 0;
    canvas.dataset.soundBeatIndex = String(state.beatIndex);
    canvas.dataset.soundBeatAnswerIndex = String(state.choiceSet.answerIndex);
    canvas.dataset.soundBeatChoiceCount = String(state.choiceSet.choices.length);
    syncChoiceAccessibility();
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

  // Completing the ordered sounds plus GO is the literacy success. Timing is
  // represented only by the accumulated optional rhythm bonus.
  function endCurrentWord(points = 120) {
    state.wordsEnded += 1;
    finishTask(points + state.wordRhythmBonus);
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

  // Sound out the note the child is about to tap: the grapheme as it becomes
  // the active beat, and the whole word when the final "GO"/blend arrives.
  // Additive only — gated on the live sound flag, silent with sound off.
  async function speakActiveNote() {
    if (!soundAllowed()) return;
    const item = state.currentTask?.item;
    if (!item) return;
    const note = [...item.beats, "blend"][state.beatIndex];
    if (!note) return;
    if (note === "blend") {
      await speakCompletedTarget(item);
    } else if (item.beatUnit === "phoneme") {
      await speakPhoneme(note);
    } else if (item.beatUnit === "syllable") {
      await speakWord(item.word);
    } else {
      await speakWord(note);
    }
  }

  async function speakCompletedTarget(item) {
    if (!soundAllowed() || !item) return;
    if (item.beatUnit === "word") {
      for (const word of item.beats) {
        if (!soundAllowed()) return;
        await speakWord(word);
      }
      return;
    }
    await speakWord(item.word);
  }

  async function finishBlendedWord(task, points) {
    if (state.awaitingBlend) return;
    state.awaitingBlend = true;
    liveStatus.textContent = `Blending ${task.item.say}.`;
    let releaseInputLock = true;
    try {
      await speakCompletedTarget(task.item);
    } catch {
      // The printed completed target remains available if playback fails.
    } finally {
      const action = soundBeatBlendCompletionAction({
        paused: state.paused,
        ended: state.ended,
        sameTask: state.currentTask === task
      });
      if (action === "defer") {
        state.pendingBlendCompletion = { task, points };
        releaseInputLock = false;
      } else if (action === "advance") {
        endCurrentWord(points);
      }
      if (releaseInputLock) state.awaitingBlend = false;
    }
  }

  function tapBeat(choiceIndex = state.selectedChoice) {
    const task = state.currentTask;
    if (!task || state.countdown > 0 || state.awaitingBlend) return;
    const now = performance.now() / 1000;
    // Post-hit lockout: a jittery second tap right after a hit must not be
    // judged against the NEXT note and scored as a miss.
    if (now < state.inputLockedUntil) return;
    ensureMusic();
    const notes = [...task.item.beats, "blend"];
    const choiceSet = state.choiceSet || soundBeatChoiceSet(task.item, state.beatIndex);
    const safeChoiceIndex = clamp(Number(choiceIndex) || 0, 0, choiceSet.choices.length - 1);
    const selectedChoice = choiceSet.choices[safeChoiceIndex];
    if (choiceSet.beatUnit !== "blend" && safeChoiceIndex !== choiceSet.answerIndex) {
      state.mistakes += 1;
      state.combo = 0;
      state.judgement = `${String(selectedChoice).toUpperCase()} → TRY ${String(choiceSet.answer).toUpperCase()}`;
      state.judgementT = 1.05;
      state.beatPulse = 0;
      state.inputLockedUntil = now + 0.24;
      sfx(playSoftBuzz);
      liveStatus.textContent = `You chose ${selectedChoice}. The next unit is ${choiceSet.answer}. Try again.`;
      void speakActiveNote();
      return;
    }
    const spacing = 60 / (state.roundBpm || state.level.bpm);
    const targetTime = state.noteStart + state.beatIndex * spacing;
    const isBlend = notes[state.beatIndex] === "blend";
    const windowSeconds = (state.roundWindow || state.level.hitWindowMs) / 1000;
    const signedDelta = now - targetTime;
    const feedback = soundBeatTapFeedback({
      deltaMs: signedDelta * 1000,
      windowMs: windowSeconds * 1000,
      isBlend
    });

    // The selected unit is the literacy action. Only the required choice reaches
    // this path; timing changes bonus/game feel but never correctness.
    state.judgement = feedback.rhythmLabel;
    state.judgementT = 0.72;
    state.beatPulse = state.reduceMotion ? 0 : feedback.pulse;
    state.wordRhythmBonus += feedback.rhythmBonus;
    if (!state.reduceMotion) {
      const burstPoint = beatLanePoint(state.beatIndex % BEAT_LANES.length, 1, w, h);
      state.hitBursts.push({
        x: burstPoint.x,
        y: burstPoint.y,
        t: 0,
        life: 0.5,
        seed: state.time + state.beatIndex,
        color: feedback.rhythmBonus >= 25 ? config.accent : config.accent2
      });
    }
    sfx(playTapSound);
    state.inputLockedUntil = now + 0.15;
    state.beatIndex += 1;
    if (state.beatIndex >= notes.length) {
      void finishBlendedWord(task, 180);
    } else {
      // After a late activation, give the next sound a fresh, readable approach
      // instead of inheriting an already-expired visual schedule.
      if (signedDelta > windowSeconds) {
        state.noteStart = now + spacing * 0.72 - state.beatIndex * spacing;
      }
      setupBeatChoice();
      if (state.beatIndex < task.item.beats.length) void speakActiveNote();
    }
  }

  function pointerPosition(event) {
    return canvasPoint(canvas, event, w, h);
  }

  function choiceIndexAtPoint(point) {
    const choices = state.choiceSet?.choices || [];
    const lanes = choices.length === 1 ? [1] : choices.map((_, index) => index);
    let nearest = -1;
    let nearestDistance = Infinity;
    for (let index = 0; index < lanes.length; index += 1) {
      const pad = beatLanePoint(lanes[index], 1, w, h);
      const dx = point.x - pad.x;
      const dy = point.y - pad.y;
      const distance = Math.hypot(dx, dy);
      if (Math.abs(dx) <= 58 && Math.abs(dy) <= 48 && distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function onPointerMove(event) {
    state.pointer = pointerPosition(event);
  }

  function onPointerDown(event) {
    state.pointer = pointerPosition(event);
    if (state.paused || state.ended || state.countdown > 0) return;
    const choiceIndex = choiceIndexAtPoint(state.pointer);
    if (choiceIndex < 0) return;
    state.selectedChoice = choiceIndex;
    state.pendingPointer = { pointerId: event.pointerId, choiceIndex };
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture?.(event.pointerId);
  }

  function clearPendingPointer(event) {
    if (state.pendingPointer && event?.pointerId != null && event.pointerId !== state.pendingPointer.pointerId) return;
    state.pendingPointer = null;
  }

  function onPointerUp(event) {
    state.pointer = pointerPosition(event);
    const pending = state.pendingPointer;
    if (!pending || pending.pointerId !== event.pointerId) return;
    const releaseChoice = choiceIndexAtPoint(state.pointer);
    clearPendingPointer(event);
    canvas.releasePointerCapture?.(event.pointerId);
    if (releaseChoice === pending.choiceIndex) tapBeat(releaseChoice);
  }

  function onPointerCancel(event) {
    clearPendingPointer(event);
  }

  function onLostPointerCapture(event) {
    clearPendingPointer(event);
  }

  function onKeyDown(event) {
    if (isInteractiveKeyTarget(event.target)) return;
    if (state.paused || state.ended || state.countdown > 0) return;
    const choices = state.choiceSet?.choices || [];
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && choices.length > 1) {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      state.selectedChoice = (state.selectedChoice + direction + choices.length) % choices.length;
      liveStatus.textContent = `Selected ${choices[state.selectedChoice]}. Press Space or Enter to choose.`;
      return;
    }
    if (/^[1-4]$/.test(event.key) && Number(event.key) <= choices.length) {
      event.preventDefault();
      state.selectedChoice = Number(event.key) - 1;
      tapBeat(state.selectedChoice);
      return;
    }
    if (event.key !== " " && event.key !== "Enter" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (event.repeat) return;
    if (!state.paused && !state.ended && state.countdown <= 0) tapBeat(state.selectedChoice);
  }

  function tickFrame(now, dt) {
    if (!state.paused && !state.ended) {
      const soundEnabled = soundAllowed();
      const soundModeChanged = soundEnabled !== state.soundEnabled;
      state.soundEnabled = soundEnabled;
      state.musicEnabled = musicAllowed();
      if (soundModeChanged) syncChoiceAccessibility({ announce: true });
      if (!reduceMotion) state.time += dt;
      state.beatPulse = Math.max(0, state.beatPulse - dt * 2.8);
      state.judgementT = Math.max(0, state.judgementT - dt);
      state.hitBursts = state.hitBursts
        .map(burst => ({ ...burst, t: burst.t + dt }))
        .filter(burst => burst.t < burst.life);
      const countdownBefore = state.countdown;
      state.countdown = Math.max(0, state.countdown - dt);
      canvas.dataset.soundBeatReady = String(state.countdown <= 0);
      if (countdownBefore > 0 && state.countdown === 0) {
        state.beatIndex = 0;
        state.noteStart = now + 0.82;
        ensureMusic();
        speakActiveNote();
      }
      if (state.currentTask && state.countdown <= 0) ensureMusic();
    }
    draw();
  }

  const loop = createFrameLoop(tickFrame);

  function draw() {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!drawCover(ctx, image, w, h)) drawFallback(ctx, w, h, config, state.time);
    drawScreenGrade(ctx, w, h);
    drawBeat(ctx, state, config, w, h);
    drawSoundBeatHud(ctx, state, config, w, h);
    drawCountdown(ctx, state, config, w, h);
    ctx.restore();
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("lostpointercapture", onLostPointerCapture);
  window.addEventListener("keydown", onKeyDown);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();
  startLevel();
  loop.start();

  const api = {
    pause() {
      if (state.paused) return;
      state.paused = true;
      state.pausedAt = performance.now() / 1000;
      stopMusic();
    },
    resume() {
      if (!state.paused) return;
      const nowSec = performance.now() / 1000;
      // Note timing is wall-clock: push the schedule forward by the paused
      // span so rhythm feedback resumes where it froze.
      if (state.pausedAt) state.noteStart += nowSec - state.pausedAt;
      state.pausedAt = 0;
      state.paused = false;
      loop.reset(nowSec);
      const deferredBlend = state.pendingBlendCompletion;
      state.pendingBlendCompletion = null;
      if (deferredBlend && !state.ended && state.currentTask === deferredBlend.task) {
        state.awaitingBlend = false;
        endCurrentWord(deferredBlend.points);
      }
      ensureMusic();
    },
    replayPrompt() {
      speakActiveNote();
    },
    destroy() {
      state.ended = true;
      state.pendingBlendCompletion = null;
      stopMusic();
      loop.cancel();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("lostpointercapture", onLostPointerCapture);
      window.removeEventListener("keydown", onKeyDown);
      if (canvas.parentNode === mount) mount.removeChild(canvas);
      if (liveStatus.parentNode === mount) mount.removeChild(liveStatus);
    },
    debugSnapshot() {
      return {
        kind: options.kind,
        stage: state.stage,
        score: state.score,
        combo: state.combo,
        taskIndex: state.taskIndex,
        countdown: state.countdown,
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        musicActive: Boolean(music),
        backgroundSrc: image.src,
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
  isSoundEnabled = true,
  isMusicEnabled = true
}) {
  const mountRef = useRef(null);
  const soundRef = useRef(isSoundEnabled);
  const musicRef = useRef(isMusicEnabled);
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
    musicRef.current = isMusicEnabled;
  }, [isMusicEnabled]);

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
    const engine = startPs1ArcadeGame(mountRef.current, {
      kind,
      difficulty,
      startLevel,
      onScoreUpdate: score => handlersRef.current.onScoreUpdate?.(score),
      onProgressUpdate: (current, total) => handlersRef.current.onProgressUpdate?.(current, total),
      onComplete: (stars, finalScore, total) => handlersRef.current.onComplete?.(stars, finalScore, total),
      onCheckpoint: (level, total) => handlersRef.current.onCheckpoint?.(level, total),
      onEngineReady: api => handlersRef.current.onEngineReady?.(api),
      getSound: () => soundRef.current,
      getMusic: () => musicRef.current
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
        minHeight: 0,
        overflow: "hidden",
        background: "#06101d"
      }}
      aria-label={CONFIG[kind]?.title || "Arcade game"}
    />
  );
}
