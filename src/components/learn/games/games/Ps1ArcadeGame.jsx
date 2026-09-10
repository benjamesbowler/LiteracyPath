import { createRhythmClock, nextPhraseBeat } from "../../../../utils/audio/rhythmClock.js";
import { soundBeatLayout } from "../shared/soundBeatLayout.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import { useEffect, useRef } from "react";
import {
  playCorrectChime,
  playSoftBuzz,
  playStarChime,
  playTapSound,
  playWhoosh,
  startSoundBeatMusic,
  getGameAudioTime
} from "../../../../utils/audio/gameSfx.js";
import { speak, speakPhoneme, speakWord, wordAudioDuration, preloadWordAudio } from "../../../../utils/learnGamesAudio.js";
import { soundBeatLadder, soundBeatMercyPolicy, soundBeatStars } from "../../../../utils/soundBeatTracks.js";
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
    action: "Tap each sound on the beat",
    bg: "/images/learn-games/sound-beat/woodland-stage.webp",
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
  const { hitY: targetY, stageY } = soundBeatLayout(w, h);
  const bottomLeft = w < 600 ? 44 : w * 0.25;
  const bottomRight = w - bottomLeft;
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
  const { stageY: topY, padY: bottomY } = soundBeatLayout(w, h);
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
  const point = { ...beatLanePoint(lane, 1, w, h), y: soundBeatLayout(w, h).padY };
  const laneStyle = BEAT_LANES[lane];
  const pulse = state.padPress?.[lane] || 0;
  ctx.save();
  ctx.translate(0, pulse * 5);
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
  text(ctx, ["D", "F", "J", "K"][lane], point.x, point.y, 17, "#fff", "center", 900);
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

  text(ctx, label, point.x, point.y + 1, clamp(25 * point.scale, 14, 34), "#ffffff", "center", 900);
}

function drawSoundBeatHud(ctx, state, config, w) {
  const item = state.currentTask?.item;
  const total = item ? item.beats.length + 1 : 4;
  ctx.save();
  panel(ctx, 12, 10, w - 24, 44, "rgba(3,7,18,.84)", "rgba(180,220,255,.3)");
  text(ctx, `${state.score} pts`, 26, 32, w < 500 ? 16 : 20, "#f8d64b", "left", 900);
  text(ctx, `${Math.min(total, state.beatIndex || 0)} / ${total} beats`, w / 2, 32, 16, "#fff", "center", 800);
  text(ctx, `×${Math.max(1, state.combo)}`, w - 28, 32, 20, config.accent, "right", 900);
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
  ctx.scale(0.86 + scale * 0.18, 0.86 + scale * 0.18);
  text(ctx, main, 0, 0, clamp(w * 0.13, 82, 170), main === "GO!" ? config.accent : config.accent2, "center", 900);
  ctx.restore();
}

function makeTasks(kind, level) {
  return level.items.map(item => ({ type: kind, item, attempts: 0 }));
}

function taskUnits() {
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
  const spacing = 60 / (state.roundBpm || state.level.bpm);
  const approachSeconds = Math.max(1.65, spacing * 3.8);

  ctx.save();
  drawBeatBackdrop(ctx, state, config, w, h);
  for (let index = 0; index < (state.performers?.length || 0); index += 1) {
    const actor = state.performers[index];
    if (!actor.complete || !actor.naturalWidth) continue;
    const actorHeight = Math.min(185, h * 0.29, w * 0.34);
    const actorWidth = actorHeight * actor.naturalWidth / actor.naturalHeight;
    const x = w * (index ? 0.9 : 0.1);
    const footY = h * 0.59;
    const response = state.beatPulse * (index ? 0.8 : 1);
    ctx.save();
    ctx.fillStyle = "rgba(2,18,23,.45)";
    ctx.beginPath(); ctx.ellipse(x, footY + 2, actorWidth * 0.4, 7, 0, 0, TWO_PI); ctx.fill();
    ctx.translate(x, footY - response * 12);
    ctx.rotate((index ? -1 : 1) * response * 0.08);
    ctx.drawImage(actor, -actorWidth / 2, -actorHeight, actorWidth, actorHeight);
    ctx.restore();
  }

  const layout = soundBeatLayout(w, h);
  ctx.save();
  const titlePanel = ctx.createLinearGradient(w * 0.29, h * 0.22, w * 0.71, h * 0.4);
  titlePanel.addColorStop(0, "rgba(3,15,14,.42)");
  titlePanel.addColorStop(1, "rgba(1,6,18,.22)");
  ctx.fillStyle = titlePanel;
  roundedRect(ctx, w * 0.25, layout.wordY - 24, w * 0.5, 46, 12);
  ctx.fill();
  const title = item.unit === "words" ? (item.beats[Math.min(state.beatIndex, item.beats.length - 1)] || item.say) : item.say;
  text(ctx, title, w / 2, layout.wordY, Math.min(clamp(w * 0.045, 28, 42), w * 0.64 / Math.max(1, title.length * 0.62)), "#fff", "center", 900);
  ctx.restore();

  drawSoundBeatRunway(ctx, state, config, w, h);

  for (let lane = 0; lane < BEAT_LANES.length; lane += 1) {
    drawBeatTarget(ctx, lane, state, w, h, lane === item.lanes[state.beatIndex]);
  }

  for (let i = state.beatIndex; i < notes.length; i += 1) {
    const noteTime = state.noteStart + i * spacing;
    const progress = 1 - (noteTime - now) / approachSeconds;
    if (progress < -0.04 || progress > 1.18) continue;
    const timeToHit = Math.abs(noteTime - now);
    const active = i === state.beatIndex;
    const nearHit = 1 - clamp(timeToHit / 0.5, 0, 1);
    drawBeatPad(ctx, notes[i] === "blend" ? "GO" : notes[i], item.lanes[i], progress, active && nearHit > 0.2, config, state, w, h);
  }

  const slotW = Math.min(78, (w * 0.34) / notes.length);
  const slotStart = w * 0.5 - (slotW * notes.length) / 2;
  for (let i = 0; i < notes.length; i += 1) {
    const filled = i < state.beatIndex;
    panel(ctx, slotStart + i * slotW, layout.slotsY, slotW - 10, 28, filled ? `${config.accent}d8` : "rgba(5,10,22,.64)", filled ? "#f4ffd8" : "rgba(255,255,255,.22)");
    text(ctx, filled ? (notes[i] === "blend" ? "GO" : notes[i]) : "", slotStart + i * slotW + slotW / 2 - 5, layout.slotsY + 14, 16, filled ? "#07101d" : "#fff", "center", 900);
  }

  for (const burst of state.hitBursts) drawBeatBurst(ctx, burst);
  if (state.judgementT > 0) {
    const p = clamp(state.judgementT / 0.72, 0, 1);
    const lanePoint = beatLanePoint(item.lanes[Math.max(0, state.beatIndex - 1)], 1, w, h);
    const size = Math.min(28, w / Math.max(1, state.judgement.length * 0.72));
    const halfWidth = state.judgement.length * size * 0.35;
    text(ctx, state.judgement, clamp(lanePoint.x, halfWidth + 8, w - halfWidth - 8), lanePoint.y - 78 - (1 - p) * 12, size, state.judgement === "MISS" ? "#ff8d8d" : config.accent, "center", 900);
  }

  text(ctx, item.unit === "syllables" ? "SYLLABLE RHYTHM" : item.unit === "words" ? "WORD RHYTHM" : "SOUND RHYTHM", w / 2, layout.wordY - 31, 12, "#dff7ff", "center", 700);
  ctx.restore();
}

function startPs1ArcadeGame(mount, options) {
  const config = CONFIG[options.kind] || CONFIG["sound-beat"];
  const ladder = config.ladder(options.difficulty);
  const total = totalUnits(options.kind, ladder);
  const image = new Image();
  image.src = config.bg;
  const performerBank = Object.fromEntries(Object.entries({ meadow: ["bouncy", "woolly"], dino: ["chompy", "sunny"], moonwood: ["pip", "wren"] }).map(([world, names]) => [world, names.map(name => {
    const image = new Image(); image.src = `/game-assets/sound-seekers/v3/cast/${world}/${name}.webp`; return image;
  })]));

  const { canvas, ctx } = createGameCanvas(mount);
  const reduceMotion = prefersReducedMotion();
  const { soundAllowed, sfx } = createSoundGate(options);
  const musicAllowed = () => options.getMusic ? options.getMusic() : options.isMusicEnabled === true;

  const rhythmClock = createRhythmClock({ wallTime: () => performance.now() / 1000, audioTime: getGameAudioTime });
  let voiceController = null;
  let voiceUntil = 0;
  let pendingNoteCue = false;
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
    music = startSoundBeatMusic({ bpm, beatAt: performance.now() / 1000 + state.roundStartAt - rhythmClock.now() });
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
    resultAt: null,
    time: 0,
    beatIndex: 0,
    noteStart: 0,
    // A "round" groups several levels so a stop/countdown only happens every
    // >= ROUND_MIN_SECONDS. Tempo + music are held steady across a round.
    roundStartAt: 0,
    roundBpm: 0,
    roundWindow: 0,
    currentWordClean: true,
    wordsEnded: 0,
    totalUnits: total,
    inputLockedUntil: 0,
    judgement: "",
    judgementT: 0,
    beatPulse: 0,
    padPress: [0, 0, 0, 0],
    soundEnabled: soundAllowed(),
    musicEnabled: musicAllowed(),
    hitBursts: [],
    pointer: { x: 0, y: 0 }
  };

  let w = 1;
  let h = 1;
  let dpr = 1;
  const padGroup = document.createElement("div");
  padGroup.setAttribute("role", "group");
  padGroup.setAttribute("aria-label", "Rhythm pads");
  padGroup.style.cssText = "position:absolute;inset:0;pointer-events:none";
  const padButtons = BEAT_LANES.map((_, lane) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Play ${["cyan", "gold", "red", "purple"][lane]} pad (${"DFJK"[lane]})`);
    button.style.cssText = "position:absolute;transform:translate(-50%,-50%);pointer-events:auto;background:transparent;border:0;border-radius:50%;color:transparent;touch-action:manipulation;min-width:56px;min-height:56px";
    button.textContent = "DFJK"[lane];
    const play = () => { if (!state.paused && !state.ended) tapBeat(lane); };
    button.addEventListener("pointerdown", event => { event.preventDefault(); event.stopPropagation(); play(); });
    button.addEventListener("click", event => { if (event.detail === 0) play(); });
    padGroup.appendChild(button);
    return button;
  });
  mount.appendChild(padGroup);

  function resize() {
    const size = sizeCanvasToMount(mount, canvas, ctx);
    w = size.width;
    h = size.height;
    dpr = size.dpr;
    const actual = mount.getBoundingClientRect();
    padButtons.forEach((button, lane) => {
      const point = beatLanePoint(lane, 1, w, h);
      Object.assign(button.style, { left: `${point.x / w * 100}%`, top: `${soundBeatLayout(w, h).padY / h * 100}%`, width: `${Math.max(56, 88 * actual.width / w)}px`, height: `${Math.max(56, 72 * actual.height / h)}px` });
    });
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
    state.performers = performerBank[state.level.world];
    image.src = config.bgByWorld?.[state.level.world] || config.bg;
    state.tasks = makeTasks(options.kind, state.level);
    state.taskIndex = 0;
    state.combo = 0;

    // Group short levels into rounds of >= this many seconds. Only the first
    // level of a round pays the 3-2-1 stop/start; the rest flow straight on,
    // keeping one steady timing window per round.
    const roundFloor = state.level.minPlaySeconds || 60;
    const nowSec = rhythmClock.now();
    const startNewRound = !state.roundStartAt
      || (nowSec - state.roundStartAt) >= roundFloor;

    if (startNewRound) {
      stopMusic();
      state.roundStartAt = nowSec;
      state.roundBpm = state.level.bpm;
      state.roundWindow = state.level.hitWindowMs;
      state.countdown = 0;
      state.countdownTarget = countdownTarget();
    } else {
      // Continue the current round: no countdown, keep tempo + music running.
      state.countdown = 0;
    }
    setupTask();
    updateProgress();
  }

  function countdownTarget() {
    return `Tap sounds in ${state.level.world}`;
  }

  function setupTask() {
    state.currentTask = state.tasks[state.taskIndex] || null;
    state.beatIndex = 0;
    state.currentWordClean = true;
    if (!state.currentTask) return;
    const now = rhythmClock.now();
    state.noteStart = nextPhraseBeat(now, state.roundStartAt, 60 / state.roundBpm, Math.max(1.05, voiceUntil - now + 0.8));
    preloadWordAudio(state.currentTask.item.word);
    // Mid-round the next word starts right away, so sound out its first note;
    // after a countdown the tick's countdown-end branch does it instead.
    if (state.countdown <= 0) speakActiveNote();
  }

  function missCurrent() {
    if (!state.currentTask || state.ended) return;
    state.currentTask.attempts += 1;
    const mercy = soundBeatMercyPolicy(state.currentTask.attempts);
    state.mistakes += 1;
    state.combo = 0;
    state.judgement = "TRY AGAIN";
    state.judgementT = 0.85;
    state.beatPulse = 0.7;
    sfx(playSoftBuzz);
    state.currentWordClean = false;
    if (mercy.advanceWithoutCredit) {
      state.judgement = "KEEP GOING";
      state.inputLockedUntil = rhythmClock.now() + 0.2;
      endCurrentWord(0);
      return;
    }

    // First miss rehearses the blend from sound one. Repeated misses retain
    // the current beat and widen its timing window instead of bouncing a
    // motor-delayed child back to the beginning forever.
    if (mercy.replayFromStart) state.beatIndex = 0;
    const spacing = 60 / (state.roundBpm || state.level.bpm);
    state.noteStart = nextPhraseBeat(rhythmClock.now(), state.roundStartAt, spacing, 0.9) - state.beatIndex * spacing;
    speakActiveNote();
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

  // A word only counts as "correct" if every beat in it was hit cleanly;
  // otherwise it still advances (no requeue, no repeat) but earns no credit.
  function endCurrentWord(points = 120) {
    state.wordsEnded += 1;
    if (state.currentWordClean) finishTask(points);
    else nextTask();
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
      // Let the child's final blend finish before shared completion pauses the
      // engine. This uses the same pausable clock, not a background timer.
      state.resultAt = Math.max(rhythmClock.now() + 0.2, voiceUntil);
      return;
    }
    state.stage = nextStage;
    startLevel();
  }

  // Sound out the note the child is about to tap: the grapheme as it becomes
  // the active beat, and the whole word when the final "GO"/blend arrives.
  // Additive only — gated on the live sound flag, silent with sound off.
  function speakActiveNote({ blendAction = false, manual = false } = {}) {
    if (!soundAllowed()) return;
    const item = state.currentTask?.item;
    if (!item) return;
    const note = [...item.beats, "blend"][state.beatIndex];
    if (!note) return;
    if (rhythmClock.now() < voiceUntil && !manual) { pendingNoteCue = true; return; }
    if (note === "blend" && !blendAction && !manual) return;
    voiceController?.abort();
    const controller = new AbortController();
    voiceController = controller;
    pendingNoteCue = false;
    const options = { signal: controller.signal };
    let playback;
    if (note === "blend" || (item.unit === "syllables" && (state.beatIndex === 0 || manual))) {
      voiceUntil = rhythmClock.now() + (/\s/.test(item.word) ? item.word.split(/\s+/).reduce((sum, word) => sum + wordAudioDuration(word), 0) : wordAudioDuration(item.word)) + 0.15;
      playback = /\s/.test(item.word) ? speak(item.say, options) : speakWord(item.word, options);
    } else if (item.unit === "sounds") playback = speakPhoneme(note, options);
    else if (item.unit === "words") playback = speakWord(note, options);
    void Promise.resolve(playback).finally(() => {
      if (voiceController === controller) { voiceController = null; voiceUntil = 0; }
    });
  }

  function tapBeat(lane = state.currentTask?.item.lanes[state.beatIndex]) {
    const task = state.currentTask;
    if (!task || state.countdown > 0) return;
    if (lane != null) state.padPress[lane] = 1;
    if (lane !== task.item.lanes[state.beatIndex]) {
      state.judgement = "FOLLOW THE NOTE";
      state.judgementT = 0.5;
      return;
    }
    const now = rhythmClock.now();
    // Post-hit lockout: a jittery second tap right after a hit must not be
    // judged against the NEXT note and scored as a miss.
    if (now < state.inputLockedUntil) return;
    ensureMusic();
    const notes = [...task.item.beats, "blend"];
    const spacing = 60 / (state.roundBpm || state.level.bpm);
    const targetTime = state.noteStart + state.beatIndex * spacing;
    const isBlend = notes[state.beatIndex] === "blend";
    const mercy = soundBeatMercyPolicy(task.attempts);
    const windowSeconds = ((state.roundWindow || state.level.hitWindowMs) / 1000) * mercy.windowScale;
    const signedDelta = now - targetTime;
    const delta = Math.abs(signedDelta);
    // Real timing: you must tap the beat inside its window. The final "GO"/blend
    // is the one forgiving beat — it waits for the tap so a good run is never
    // lost at the finish line. Everything else is a proper rhythm hit or a miss.
    if (!isBlend && signedDelta < -windowSeconds) {
      // An eager tap before the approach window is guidance, not a mistake.
      state.judgement = "WAIT";
      state.judgementT = 0.5;
      state.inputLockedUntil = now + 0.12;
      return;
    }
    if (isBlend || delta <= windowSeconds) {
      const quality = isBlend
        ? "PERFECT"
        : delta <= windowSeconds * 0.34 ? "PERFECT" : delta <= windowSeconds * 0.67 ? "GREAT" : "GOOD";
      state.judgement = quality;
      state.judgementT = 0.72;
      state.beatPulse = quality === "PERFECT" ? 1 : quality === "GREAT" ? 0.82 : 0.65;
      const burstPoint = beatLanePoint(task.item.lanes[state.beatIndex], 1, w, h);
      state.hitBursts.push({
        x: burstPoint.x,
        y: burstPoint.y,
        t: 0,
        life: 0.5,
        seed: state.time + state.beatIndex,
        color: quality === "PERFECT" ? config.accent : config.accent2
      });
      sfx(playTapSound);
      state.inputLockedUntil = now + 0.15;
      if (isBlend) speakActiveNote({ blendAction: true });
      state.beatIndex += 1;
      if (state.beatIndex >= notes.length) endCurrentWord(180);
      else speakActiveNote();
    } else {
      missCurrent();
    }
  }

  function pointerPosition(event) {
    return canvasPoint(canvas, event, w, h);
  }

  function onPointerMove(event) {
    state.pointer = pointerPosition(event);
  }

  function onPointerDown(event) {
    state.pointer = pointerPosition(event);
    if (state.paused || state.ended || state.countdown > 0) return;
    const lane = BEAT_LANES.findIndex((_, index) => {
      const point = beatLanePoint(index, 1, w, h);
      return Math.abs(state.pointer.x - point.x) <= 44 && Math.abs(state.pointer.y - soundBeatLayout(w, h).padY) <= 36;
    });
    if (lane >= 0) tapBeat(lane);
  }

  function onKeyDown(event) {
    if (isInteractiveKeyTarget(event.target) && !padGroup.contains(event.target)) return;
    if (padGroup.contains(event.target) && [" ", "Enter"].includes(event.key)) return;
    const lane = ["d", "f", "j", "k"].indexOf(event.key.toLowerCase());
    if (lane < 0 && event.key !== " " && event.key !== "Enter" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (!event.repeat && !state.paused && !state.ended && state.countdown <= 0) tapBeat(lane < 0 ? undefined : lane);
  }

  function tickFrame(_wallNow, dt) {
    const now = rhythmClock.now();
    if (!state.paused && state.resultAt !== null && now >= state.resultAt) {
      state.resultAt = null;
      options.onComplete?.(config.stars({ correct: state.correct, total, mistakes: state.mistakes }), state.score, total);
    }
    canvas.dataset.soundBeatReady = String(state.countdown <= 0);
    canvas.dataset.soundBeatIndex = String(state.beatIndex);
    if (!state.paused && !state.ended) {
      state.soundEnabled = soundAllowed();
      if (!state.soundEnabled) { voiceController?.abort(); voiceController = null; voiceUntil = 0; pendingNoteCue = false; }
      else if (pendingNoteCue && now >= voiceUntil) speakActiveNote();
      state.musicEnabled = musicAllowed();
      state.time += reduceMotion ? dt * 0.35 : dt;
      state.beatPulse = Math.max(0, state.beatPulse - dt * 2.8);
      state.padPress = state.padPress.map(value => Math.max(0, value - dt * 6));
      state.judgementT = Math.max(0, state.judgementT - dt);
      state.hitBursts = state.hitBursts
        .map(burst => ({ ...burst, t: burst.t + dt }))
        .filter(burst => burst.t < burst.life);
      const countdownBefore = state.countdown;
      state.countdown = Math.max(0, state.countdown - dt);
      if (countdownBefore > 0 && state.countdown === 0) {
        state.beatIndex = 0;
        state.noteStart = now + 0.82;
        ensureMusic();
        speakActiveNote();
      }
      if (state.currentTask && state.countdown <= 0) {
        ensureMusic();
        const notes = [...state.currentTask.item.beats, "blend"];
        const spacing = 60 / (state.roundBpm || state.level.bpm);
        const targetTime = state.noteStart + state.beatIndex * spacing;
        const autoMissWindow = ((state.roundWindow || state.level.hitWindowMs) / 1000)
          * soundBeatMercyPolicy(state.currentTask.attempts).windowScale;
        // Letter beats time out if you never tap them (that's the rhythm). The
        // final "GO"/blend is exempt — it waits for the tap so the word is never
        // lost at the finish line.
        if (state.beatIndex < notes.length - 1 && now - targetTime > autoMissWindow + 0.12) {
          missCurrent();
        }
      }
    }
    draw(now);
  }

  const loop = createFrameLoop(tickFrame);

  function draw(now) {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!drawCover(ctx, image, w, h)) drawFallback(ctx, w, h, config, state.time);
    drawBeat(ctx, state, config, w, h, now);
    drawSoundBeatHud(ctx, state, config, w, h);
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
  loop.start();

  const api = {
    replayPrompt: () => speakActiveNote({ manual: true }),
    pause() {
      if (state.paused) return;
      state.paused = true;
      rhythmClock.pause();
      voiceController?.abort(); voiceController = null; voiceUntil = 0; pendingNoteCue = true;
      stopMusic();
    },
    resume() {
      if (!state.paused) return;
      rhythmClock.resume();
      state.paused = false;
      loop.reset(performance.now() / 1000);
      ensureMusic();
    },
    destroy() {
      state.ended = true;
      voiceController?.abort();
      stopMusic();
      loop.cancel();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      padGroup.remove();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    },
    debugSnapshot() {
      return {
        kind: options.kind,
        beatIndex: state.beatIndex,
        targetTime: state.noteStart + state.beatIndex * 60 / state.roundBpm,
        clockTime: rhythmClock.now(),
        lane: state.currentTask?.item.lanes[state.beatIndex],
        paused: state.paused,
        ended: state.ended,
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
  isMusicEnabled = false
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
