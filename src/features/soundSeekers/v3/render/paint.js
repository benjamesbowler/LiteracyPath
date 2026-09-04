// Sound Seekers v3 — procedural props in the book style.
//
// Every prop: flat fill + one soft shade + a bold ink outline, rounded chunky
// shapes. Drawn in world units on an already-transformed context. Text baked
// into props (graphemes, words) is drawn here by code — never in raster art.

import { SOUND_SEEKERS_V3_PALETTE as P } from "../../visual/visualTokens.js";

export const PALETTE = P;
export const INK = P.ink;
export const INK_W = 4;
export const CREAM = P.cream;
export const GOLD = P.gold;
export const GOLD_DEEP = P["gold-deep"];
export const LEAF = P.leaf;
export const LEAF_DEEP = P["leaf-deep"];
export const BERRY = P.berry;
export const SKY_INK = P["sky-ink"];
export const WOOD = P.wood;
export const WOOD_DEEP = P["wood-deep"];
export const WOOD_LIGHT = P["wood-light"];
export const STONE = P.stone;
export const STONE_DEEP = P["stone-deep"];

export const FONT_DISPLAY = "\"Baloo 2\", \"Nunito\", \"Arial Rounded MT Bold\", ui-rounded, system-ui, sans-serif";
export const FONT_LETTER = "\"Andika\", \"Lexend\", \"Nunito\", \"Arial Rounded MT Bold\", system-ui, sans-serif";

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function inkFill(ctx, fill, lineWidth = INK_W, stroke = INK) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function shade(ctx, color, alpha = 0.18) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function label(ctx, text, x, y, { size = 28, color = INK, font = FONT_LETTER, weight = 900, align = "center", baseline = "middle", stroke = null, strokeWidth = 6, maxWidth = 0 } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  if (maxWidth > 0) {
    // shrink to fit — a sign never spills past its board
    let fitted = size;
    while (fitted > 10 && ctx.measureText(text).width > maxWidth) {
      fitted -= 1;
      ctx.font = `${weight} ${fitted}px ${font}`;
    }
  }
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (stroke) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = "round";
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// ── ground & platforms ──────────────────────────────────────────────────────
export function ground(ctx, x, y, w, h, pal) {
  // earth block
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = pal.side;
  ctx.fill();
  // grass cap with a wavy lower edge
  ctx.beginPath();
  ctx.moveTo(x, y + 26);
  for (let px = x; px <= x + w; px += 36) {
    ctx.quadraticCurveTo(px + 18, y + 40, px + 36, y + 26);
  }
  ctx.lineTo(x + w, y - 6);
  ctx.lineTo(x, y - 6);
  ctx.closePath();
  ctx.fillStyle = pal.top;
  ctx.fill();
  // darker earth stripe + ink top line
  ctx.beginPath();
  ctx.rect(x, y + h - 18, w, 18);
  ctx.fillStyle = pal.dark;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x + w, y - 6);
  ctx.lineWidth = INK_W;
  ctx.strokeStyle = pal.ink;
  ctx.stroke();
}

export function platform(ctx, x, y, w, h, pal) {
  ctx.save();
  roundRect(ctx, x, y + 6, w, h, 14);
  ctx.fillStyle = pal.side;
  ctx.fill();
  roundRect(ctx, x, y, w, h - 8, 14);
  inkFill(ctx, pal.top, INK_W, pal.ink);
  // a few grass tufts on top
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 3;
  for (let px = x + 18; px < x + w - 12; px += 42) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px - 4, y - 9);
    ctx.moveTo(px + 6, y);
    ctx.lineTo(px + 8, y - 11);
    ctx.stroke();
  }
  ctx.restore();
}

export function stump(ctx, x, y, w, h) {
  ctx.save();
  roundRect(ctx, x, y + 10, w, h - 10, 10);
  inkFill(ctx, WOOD_DEEP);
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 10, w / 2, 11, 0, 0, Math.PI * 2);
  inkFill(ctx, WOOD_LIGHT);
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 10, w / 4, 5, 0, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = WOOD_DEEP;
  ctx.stroke();
  ctx.restore();
}

// ── letter crate / tile ─────────────────────────────────────────────────────
export function crate(ctx, x, y, size, text, { state = "idle", tint = WOOD, glow = 0, scale = 1, rotation = 0 } = {}) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(-size / 2, -size / 2);
  if (glow > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35 * glow;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 40 * glow;
    roundRect(ctx, 0, 0, size, size, 16);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
  }
  roundRect(ctx, 0, 0, size, size, 16);
  inkFill(ctx, state === "open" ? WOOD_LIGHT : tint);
  // plank lines
  ctx.strokeStyle = "rgba(59,35,20,.28)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(10, size * 0.33); ctx.lineTo(size - 10, size * 0.33);
  ctx.moveTo(10, size * 0.67); ctx.lineTo(size - 10, size * 0.67);
  ctx.stroke();
  // label plate
  roundRect(ctx, size * 0.16, size * 0.16, size * 0.68, size * 0.68, 12);
  inkFill(ctx, CREAM, 3);
  label(ctx, text, size / 2, size / 2 + 2, { size: size * 0.44 });
  ctx.restore();
}

export function tile(ctx, x, y, w, h, text, { fill = CREAM, glow = 0, scale = 1, placed = false } = {}) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, -h / 2);
  if (glow > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5 * glow;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 30 * glow;
    roundRect(ctx, 0, 0, w, h, 14);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
  }
  roundRect(ctx, 0, 6, w, h, 14);
  ctx.fillStyle = placed ? GOLD_DEEP : WOOD_DEEP;
  ctx.fill();
  roundRect(ctx, 0, 0, w, h - 4, 14);
  inkFill(ctx, placed ? GOLD : fill);
  label(ctx, text, w / 2, h / 2, { size: Math.min(h * 0.6, w * 0.6) });
  ctx.restore();
}

export function slot(ctx, x, y, w, h, { filled = false, text = "", active = false } = {}) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  if (filled) {
    inkFill(ctx, GOLD);
    label(ctx, text, x + w / 2, y + h / 2, { size: h * 0.58 });
  } else {
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = active ? 5 : 3;
    ctx.strokeStyle = active ? BERRY : "rgba(59,35,20,.55)";
    ctx.fillStyle = active ? "rgba(255,246,220,.85)" : "rgba(255,246,220,.5)";
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

// ── signpost ────────────────────────────────────────────────────────────────
export function signpost(ctx, x, y, w, h, text, { small = false, glow = 0, sub = "" } = {}) {
  ctx.save();
  // post
  roundRect(ctx, x + w / 2 - 12, y + h * 0.55, 24, h * 0.55, 6);
  inkFill(ctx, WOOD_DEEP);
  if (glow > 0) {
    ctx.save();
    ctx.globalAlpha = 0.4 * glow;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 36 * glow;
    roundRect(ctx, x, y, w, h * 0.62, 18);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
  }
  // board
  roundRect(ctx, x, y, w, h * 0.62, 18);
  inkFill(ctx, WOOD);
  roundRect(ctx, x + 10, y + 10, w - 20, h * 0.62 - 20, 12);
  inkFill(ctx, CREAM, 3);
  const size = small ? Math.min(w * 0.3, 34) : Math.min(h * 0.34, w * 0.42);
  ctx.font = `900 ${size}px ${small ? FONT_DISPLAY : FONT_LETTER}`;
  if (small && /\s/.test(text) && ctx.measureText(text).width > (w - 26) * 1.15) {
    // a long place name wraps onto two lines instead of shrinking to a whisper;
    // the size steps down until it fits in two lines
    let fitted = Math.min(size, (w - 22) / 5.2);
    while (fitted > 11) {
      ctx.font = `900 ${fitted}px ${FONT_DISPLAY}`;
      const words = text.split(/\s+/);
      const lines = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > w - 22 && line) { lines.push(line); line = word; } else line = test;
      }
      if (line) lines.push(line);
      if (lines.length <= 2 && lines.every(l => ctx.measureText(l).width <= w - 22)) break;
      fitted -= 1;
    }
    wrapText(ctx, text, x + w / 2, y + h * 0.31 - (sub ? 8 : 0), w - 22, fitted, { weight: 900, lineHeight: 1.05 });
  } else {
    label(ctx, text, x + w / 2, y + h * 0.31 - (sub ? 8 : 0), { size, font: small ? FONT_DISPLAY : FONT_LETTER, maxWidth: w - 26 });
  }
  if (sub) label(ctx, sub, x + w / 2, y + h * 0.5, { size: Math.min(w * 0.14, 20), font: FONT_DISPLAY, color: WOOD_DEEP, maxWidth: w - 26 });
  ctx.restore();
}

// ── lantern ─────────────────────────────────────────────────────────────────
export function lantern(ctx, x, y, size, { lit = false, text = "", heart = false, glow = 1, hang = true } = {}) {
  ctx.save();
  const w = size;
  const h = size * 1.25;
  if (hang) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - size * 0.6);
    ctx.lineTo(x + w / 2, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  if (lit) {
    ctx.save();
    ctx.globalAlpha = 0.55 * glow;
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, size * 0.2, x + w / 2, y + h / 2, size * 1.4);
    g.addColorStop(0, "rgba(255,225,120,.9)");
    g.addColorStop(1, "rgba(255,225,120,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, size * 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // cap
  roundRect(ctx, x + w * 0.2, y, w * 0.6, h * 0.14, 6);
  inkFill(ctx, WOOD_DEEP);
  // body
  roundRect(ctx, x, y + h * 0.1, w, h * 0.78, w * 0.22);
  inkFill(ctx, lit ? P["lantern-lit"] : P["lantern-unlit"]);
  // glass panes
  ctx.strokeStyle = "rgba(59,35,20,.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.12);
  ctx.lineTo(x + w * 0.5, y + h * 0.86);
  ctx.stroke();
  // base
  roundRect(ctx, x + w * 0.15, y + h * 0.84, w * 0.7, h * 0.14, 6);
  inkFill(ctx, WOOD_DEEP);
  if (text) label(ctx, text, x + w / 2, y + h * 0.5, { size: Math.min(w * 0.42, h * 0.3), color: lit ? INK : P["lantern-text-unlit"] });
  if (heart) {
    heartShape(ctx, x + w * 0.5, y + h * 0.5, w * 0.16, BERRY);
  }
  ctx.restore();
}

export function heartShape(ctx, cx, cy, r, color = BERRY) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy + r);
  ctx.bezierCurveTo(cx - r * 1.6, cy - r * 0.2, cx - r * 0.8, cy - r * 1.4, cx, cy - r * 0.5);
  ctx.bezierCurveTo(cx + r * 0.8, cy - r * 1.4, cx + r * 1.6, cy - r * 0.2, cx, cy + r);
  ctx.closePath();
  inkFill(ctx, color, 3);
  ctx.restore();
}

// ── baskets, stones, keys, gates, doors, bridge ─────────────────────────────
export function basket(ctx, x, y, w, h, text, { fill = 0, glow = 0, sub = "" } = {}) {
  ctx.save();
  if (glow > 0) {
    ctx.save();
    ctx.globalAlpha = 0.4 * glow;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 36 * glow;
    roundRect(ctx, x, y, w, h, 20);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
  }
  // body (trapezoid)
  ctx.beginPath();
  ctx.moveTo(x, y + 12);
  ctx.lineTo(x + w, y + 12);
  ctx.lineTo(x + w - 14, y + h);
  ctx.lineTo(x + 14, y + h);
  ctx.closePath();
  inkFill(ctx, WOOD);
  // weave
  ctx.strokeStyle = "rgba(59,35,20,.28)";
  ctx.lineWidth = 3;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 6 + i * 3, y + 12 + (h - 12) * (i / 4));
    ctx.lineTo(x + w - 6 - i * 3, y + 12 + (h - 12) * (i / 4));
    ctx.stroke();
  }
  // rim + label
  roundRect(ctx, x - 6, y, w + 12, 24, 10);
  inkFill(ctx, WOOD_LIGHT);
  label(ctx, text, x + w / 2, y + 12, { size: 22 });
  if (sub) label(ctx, sub, x + w / 2, y + h - 22, { size: 18, font: FONT_DISPLAY, color: CREAM, stroke: INK, strokeWidth: 4 });
  // filled items (little discs)
  for (let i = 0; i < fill; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 30 + i * 34, y + 44, 12, 0, Math.PI * 2);
    inkFill(ctx, GOLD, 3);
  }
  ctx.restore();
}

export function stone(ctx, x, y, w, h, text, { glow = 0, lit = false, sunk = false } = {}) {
  ctx.save();
  if (glow > 0) {
    ctx.save();
    ctx.globalAlpha = 0.4 * glow;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 36 * glow;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2 + 8, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = STONE_DEEP;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2 - 4, 0, 0, Math.PI * 2);
  inkFill(ctx, lit ? GOLD : sunk ? P["stone-sunk"] : STONE);
  if (text) label(ctx, text, x + w / 2, y + h / 2 - 2, { size: Math.min(h * 0.62, w * 0.42) });
  ctx.restore();
}

export function key(ctx, x, y, w, text, { glow = 0, turned = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (turned) ctx.rotate(-0.5);
  if (glow > 0) {
    ctx.save();
    ctx.globalAlpha = 0.45 * glow;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 30 * glow;
    roundRect(ctx, 0, 0, w, 44, 14);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
  }
  // bow (ring)
  ctx.beginPath();
  ctx.arc(24, 22, 22, 0, Math.PI * 2);
  inkFill(ctx, GOLD);
  ctx.beginPath();
  ctx.arc(24, 22, 9, 0, Math.PI * 2);
  inkFill(ctx, CREAM, 3);
  // shaft with word plate
  roundRect(ctx, 44, 12, w - 44, 22, 8);
  inkFill(ctx, GOLD);
  roundRect(ctx, 50, 4, w - 70, 36, 10);
  inkFill(ctx, CREAM, 3);
  label(ctx, text, 50 + (w - 70) / 2, 22, { size: 24 });
  // teeth
  roundRect(ctx, w - 18, 30, 8, 14, 3);
  inkFill(ctx, GOLD, 3);
  roundRect(ctx, w - 6, 30, 6, 10, 3);
  inkFill(ctx, GOLD, 3);
  ctx.restore();
}

export function gate(ctx, x, y, w, h, { open = 0, pal } = {}) {
  ctx.save();
  // posts
  roundRect(ctx, x - 22, y - 20, 26, h + 20, 8);
  inkFill(ctx, STONE_DEEP);
  roundRect(ctx, x + w - 4, y - 20, 26, h + 20, 8);
  inkFill(ctx, STONE_DEEP);
  // arch top
  roundRect(ctx, x - 30, y - 42, w + 60, 30, 12);
  inkFill(ctx, STONE);
  // doors (two leaves swing outward as `open` → 1)
  const leaf = w / 2;
  for (const side of [0, 1]) {
    ctx.save();
    const hinge = side === 0 ? x : x + w;
    ctx.translate(hinge, y);
    ctx.scale(side === 0 ? 1 - open * 0.9 : -(1 - open * 0.9), 1);
    roundRect(ctx, 0, 0, leaf, h, 6);
    inkFill(ctx, pal?.plank || WOOD);
    ctx.strokeStyle = "rgba(59,35,20,.3)";
    ctx.lineWidth = 3;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(leaf * (i / 4), 6);
      ctx.lineTo(leaf * (i / 4), h - 6);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

export function door(ctx, x, y, w, h, text, { icon = "", glow = 0, open = 0 } = {}) {
  ctx.save();
  if (glow > 0) {
    ctx.save();
    ctx.globalAlpha = 0.4 * glow;
    ctx.shadowColor = GOLD;
    ctx.shadowBlur = 36 * glow;
    roundRect(ctx, x, y, w, h, w / 2);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
  }
  // frame
  ctx.beginPath();
  ctx.moveTo(x - 10, y + h);
  ctx.lineTo(x - 10, y + w / 2);
  ctx.arc(x + w / 2, y + w / 2, w / 2 + 10, Math.PI, 0);
  ctx.lineTo(x + w + 10, y + h);
  ctx.closePath();
  inkFill(ctx, STONE);
  // leaf
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 - open * 0.85, 1);
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, w / 2);
  ctx.arc(w / 2, w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(w, h);
  ctx.closePath();
  inkFill(ctx, WOOD);
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.58, 6, 0, Math.PI * 2);
  inkFill(ctx, GOLD, 3);
  ctx.restore();
  if (open > 0.5) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + w / 2);
    ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,230,140,.7)";
    ctx.fill();
  }
  // plaque with icon + word
  roundRect(ctx, x - 8, y - 46, w + 16, 40, 12);
  inkFill(ctx, CREAM, 3);
  label(ctx, `${icon ? `${icon} ` : ""}${text}`, x + w / 2, y - 26, { size: 20, font: FONT_DISPLAY });
  ctx.restore();
}

export function bridge(ctx, x, y, w, h, planks, { pal } = {}) {
  ctx.save();
  // posts
  for (const px of [x - 8, x + w - 10]) {
    roundRect(ctx, px, y - 40, 18, h + 40, 6);
    inkFill(ctx, WOOD_DEEP);
  }
  // rope
  ctx.beginPath();
  ctx.moveTo(x, y - 30);
  ctx.quadraticCurveTo(x + w / 2, y - 6, x + w, y - 30);
  ctx.lineWidth = 4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // planks
  const count = planks.length;
  const pw = (w - 8) / count;
  planks.forEach((p, i) => {
    const px = x + 4 + i * pw;
    if (p.filled) {
      roundRect(ctx, px + 3, y + (p.drop || 0), pw - 6, h, 8);
      inkFill(ctx, pal?.plank || WOOD);
      if (p.text) label(ctx, p.text, px + pw / 2, y + h / 2 + (p.drop || 0), { size: Math.min(h * 0.55, pw * 0.5) });
    } else {
      ctx.setLineDash([8, 7]);
      roundRect(ctx, px + 3, y, pw - 6, h, 8);
      ctx.lineWidth = p.active ? 5 : 3;
      ctx.strokeStyle = p.active ? BERRY : "rgba(59,35,20,.5)";
      ctx.fillStyle = "rgba(255,246,220,.45)";
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  ctx.restore();
}

export function water(ctx, x, y, w, h, t, { color = P.water, deep = P["water-deep"] } = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = deep;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  for (let px = x; px <= x + w; px += 40) {
    ctx.quadraticCurveTo(px + 20, y + 8 + Math.sin(t * 2 + px * 0.05) * 6, px + 40, y + 8);
  }
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i += 1) {
    const wx = x + ((i * 173 + t * 40) % (w + 80)) - 40;
    ctx.beginPath();
    ctx.moveTo(wx, y + 26 + i * 12);
    ctx.quadraticCurveTo(wx + 14, y + 20 + i * 12, wx + 28, y + 26 + i * 12);
    ctx.stroke();
  }
  ctx.restore();
}

export function bush(ctx, x, y, w, h, color = LEAF, dark = LEAF_DEEP) {
  ctx.save();
  // back-to-front lobes, each filled then inked, so the front lobe's fill
  // covers the back lobe's outline (classic cartoon bush)
  const lobes = [
    [x + w * 0.8, y + h * 0.65, w * 0.24, h * 0.35],
    [x + w * 0.3, y + h * 0.6, w * 0.3, h * 0.4],
    [x + w * 0.58, y + h * 0.5, w * 0.36, h * 0.48]
  ];
  for (const [cx, cy, rx, ry] of lobes) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    inkFill(ctx, color);
  }
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.58, y + h * 0.8, w * 0.32, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

export function hill(ctx, x, y, w, h, color) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.4, x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function cloud(ctx, x, y, w) {
  ctx.save();
  ctx.globalAlpha *= 0.9;
  ctx.fillStyle = P.white;
  for (const [cx, cy, r] of [[x + w * 0.25, y, w * 0.2], [x + w * 0.75, y, w * 0.2], [x + w * 0.5, y - w * 0.1, w * 0.27]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.rect(x + w * 0.2, y - 2, w * 0.6, w * 0.18);
  ctx.fill();
  ctx.restore();
}

export function speechBubble(ctx, x, y, w, h, text, { tailX = x + 40, size = 22, font = FONT_DISPLAY } = {}) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 18);
  inkFill(ctx, CREAM, 3);
  ctx.beginPath();
  ctx.moveTo(tailX - 12, y + h - 1);
  ctx.lineTo(tailX, y + h + 18);
  ctx.lineTo(tailX + 14, y + h - 1);
  ctx.closePath();
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(tailX - 12, y + h);
  ctx.lineTo(tailX, y + h + 18);
  ctx.lineTo(tailX + 14, y + h);
  ctx.stroke();
  wrapText(ctx, text, x + w / 2, y + h / 2, w - 28, size, { font, color: INK, weight: 800 });
  ctx.restore();
}

export function wrapText(ctx, text, cx, cy, maxWidth, size, { font = FONT_DISPLAY, color = INK, weight = 800, lineHeight = 1.25 } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  const lh = size * lineHeight;
  const startY = cy - ((lines.length - 1) * lh) / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lh));
  return lines.length;
}

export function sparkle(ctx, x, y, r, alpha = 1, color = GOLD) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.4;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function dust(ctx, x, y, r, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(255,245,220,.9)";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function frame(ctx, x, y, w, h, { fill = CREAM } = {}) {
  ctx.save();
  roundRect(ctx, x - 8, y - 8, w + 16, h + 16, 16);
  inkFill(ctx, WOOD);
  roundRect(ctx, x, y, w, h, 10);
  inkFill(ctx, fill, 3);
  ctx.restore();
}

export function arrow(ctx, x, y, size, dir = 1, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.beginPath();
  ctx.moveTo(-size * 0.5, -size * 0.3);
  ctx.lineTo(size * 0.1, -size * 0.3);
  ctx.lineTo(size * 0.1, -size * 0.6);
  ctx.lineTo(size * 0.6, 0);
  ctx.lineTo(size * 0.1, size * 0.6);
  ctx.lineTo(size * 0.1, size * 0.3);
  ctx.lineTo(-size * 0.5, size * 0.3);
  ctx.closePath();
  inkFill(ctx, GOLD);
  ctx.restore();
}
