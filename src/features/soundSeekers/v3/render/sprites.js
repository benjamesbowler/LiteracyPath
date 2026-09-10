// Sound Seekers v3 — image loading and "paper puppet" character animation.
//
// Every character is one cut-out drawing (a real book character), animated in
// code: breathing, walking bob + lean, jump stretch, landing squash,
// celebration hops, a thinking tilt. Anticipation → contact → follow-through
// come from these curves, not from extra frames.

import { INK, inkFill, roundRect, CREAM } from "./paint.js";

const cache = new Map();

export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (cache.has(src)) return cache.get(src).promise;
  const entry = { img: null, ready: false, failed: false };
  entry.promise = new Promise(resolve => {
    if (typeof Image === "undefined") { entry.failed = true; resolve(null); return; }
    const img = new Image();
    img.decoding = "async";
    img.onload = () => { entry.img = img; entry.ready = true; resolve(img); };
    img.onerror = () => { entry.failed = true; resolve(null); };
    img.src = src;
  });
  cache.set(src, entry);
  return entry.promise;
}

export function getImage(src) {
  const entry = src ? cache.get(src) : null;
  if (!entry) { if (src) loadImage(src); return null; }
  return entry.ready ? entry.img : null;
}

export function imageState(src) {
  const entry = src ? cache.get(src) : null;
  if (!entry) return "pending";
  return entry.ready ? "ready" : entry.failed ? "failed" : "loading";
}

export function preload(srcs) {
  return Promise.all([...new Set(srcs.filter(Boolean))].map(loadImage));
}

export function retryFailedImages(srcs) {
  for (const src of srcs) if (cache.get(src)?.failed) cache.delete(src);
}

// ── puppet ──────────────────────────────────────────────────────────────────
export function createPuppet() {
  return { squash: 0, squashT: 0, hopT: 0, blinkT: 0, lastFacing: 1 };
}

// state: idle | walk | jump | fall | celebrate | think | sad | talk
export function drawPuppet(ctx, img, { x, y, height, facing = 1, t = 0, state = "idle", puppet, alpha = 1, tint = null, shadow = true, wobble = 0, src = null }) {
  // while a drawing is still loading, show only its shadow — never a flash of
  // ghost placeholders; the ghost is for a drawing that is genuinely missing
  if (!img && src && imageState(src) !== "failed") alpha *= 0.001;
  const p = puppet || createPuppet();
  let sx = 1;
  let sy = 1;
  let rot = 0;
  let dy = 0;
  let dx = 0;
  switch (state) {
    case "walk":
      dy = -Math.abs(Math.sin(t * 11)) * height * 0.045;
      rot = Math.sin(t * 11) * 0.05 * facing;
      sy = 1 + Math.sin(t * 22) * 0.02;
      break;
    case "jump":
      sy = 1.08; sx = 0.94; rot = -0.06 * facing;
      break;
    case "fall":
      sy = 1.04; sx = 0.97; rot = 0.04 * facing;
      break;
    case "celebrate":
      dy = -Math.abs(Math.sin(t * 8)) * height * 0.14;
      rot = Math.sin(t * 8) * 0.12;
      sy = 1 + Math.max(0, Math.sin(t * 8)) * 0.06;
      sx = 1 - Math.max(0, Math.sin(t * 8)) * 0.04;
      break;
    case "think":
      rot = 0.09 * facing;
      dy = Math.sin(t * 2) * 2;
      break;
    case "sad":
      rot = 0.12 * facing;
      sy = 0.96;
      dy = height * 0.02;
      break;
    case "talk":
      dy = -Math.abs(Math.sin(t * 6)) * height * 0.02;
      sy = 1 + Math.sin(t * 12) * 0.015;
      break;
    default: // idle: breathing
      sy = 1 + Math.sin(t * 1.8) * 0.015;
      sx = 1 - Math.sin(t * 1.8) * 0.008;
      dy = Math.sin(t * 1.8) * 1.5;
  }
  // landing squash / wrong-answer wobble overlay
  if (p.squash > 0) {
    sy *= 1 - p.squash * 0.18;
    sx *= 1 + p.squash * 0.16;
  }
  if (wobble > 0) rot += Math.sin(t * 40) * 0.12 * wobble;

  const w = img ? height * (img.naturalWidth / img.naturalHeight) : height * 0.7;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (shadow) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.25;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x, y + 4, w * 0.36 * (1 - dy / height), height * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.translate(x + dx, y + dy);
  ctx.rotate(rot);
  ctx.scale(sx * facing, sy);
  if (img) {
    ctx.drawImage(img, -w / 2, -height, w, height);
    if (tint) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = tint;
      ctx.fillRect(-w / 2, -height, w, height);
      ctx.restore();
    }
  } else {
    placeholder(ctx, w, height);
  }
  ctx.restore();
  return { w };
}

function placeholder(ctx, w, h) {
  roundRect(ctx, -w / 2, -h, w, h, w * 0.4);
  inkFill(ctx, CREAM);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-w * 0.18, -h * 0.68, w * 0.06, 0, Math.PI * 2);
  ctx.arc(w * 0.18, -h * 0.68, w * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -h * 0.5, w * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

export function tickPuppet(p, dt) {
  if (p.squash > 0) {
    p.squashT += dt;
    p.squash = Math.max(0, 1 - p.squashT / 0.18);
  }
}

export function squashPuppet(p, amount = 1) {
  p.squash = amount;
  p.squashT = 0;
}
