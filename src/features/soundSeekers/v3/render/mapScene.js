// Sound Seekers v3 — the Story Trail (world map scene).
//
// One long painted world made of four panels. The hero walks node to node
// along a smooth curve through the forty stops. Only completed stops and the
// next stop are walkable; every other stop still shows its character waiting
// in the distance, so the whole world is visible from the start.

import { LANDS, PANELS, PANEL_H, PANEL_W, TRAIL, WORLD_W } from "../content/trail.js";
import { CAST } from "../content/cast.js";
import { isStopCompleted, isStopUnlocked } from "../engine/progress.js";
import { createPuppet, drawPuppet, getImage, tickPuppet } from "./sprites.js";
import {
  CREAM, FONT_DISPLAY, GOLD, INK, INK_W, PALETTE, WOOD_DEEP, arrow, inkFill, label, lantern, roundRect, signpost, sparkle
} from "./paint.js";

const WALK_SPEED = 420; // world px / s
const HERO_H = 112;     // world px
const NPC_H = 104;

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
  };
}

// Sample the whole trail into a polyline with cumulative distances.
function buildPath(points) {
  const pts = [points[0], ...points, points[points.length - 1]];
  const samples = [];
  let dist = 0;
  const stopAt = [];
  for (let i = 1; i < pts.length - 2; i += 1) {
    stopAt.push(dist);
    for (let k = 0; k < 24; k += 1) {
      const p = catmull(pts[i - 1], pts[i], pts[i + 1], pts[i + 2], k / 24);
      if (samples.length) dist += Math.hypot(p.x - samples[samples.length - 1].x, p.y - samples[samples.length - 1].y);
      samples.push({ ...p, d: dist });
    }
  }
  const last = points[points.length - 1];
  dist += Math.hypot(last.x - samples[samples.length - 1].x, last.y - samples[samples.length - 1].y);
  samples.push({ ...last, d: dist });
  stopAt.push(dist);
  return { samples, stopAt, length: dist };
}

function pointAt(path, d) {
  const s = path.samples;
  if (d <= 0) return s[0];
  if (d >= path.length) return s[s.length - 1];
  let lo = 0;
  let hi = s.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid].d <= d) lo = mid; else hi = mid;
  }
  const a = s[lo];
  const b = s[hi];
  const t = (d - a.d) / Math.max(1e-6, b.d - a.d);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function createMapScene({ progress, heroId, onArrive, onSelectStop, reducedMotion = false, fx = null }) {
  const path = buildPath(TRAIL.map(s => ({ x: s.world.x, y: s.world.y - 6 })));
  const state = {
    progress,
    heroId,
    stopIndex: Math.max(0, TRAIL.findIndex(s => s.id === progress.currentStopId)),
    d: 0,
    targetD: 0,
    moving: false,
    facing: 1,
    t: 0,
    camX: 0,
    camTarget: 0,
    puppet: createPuppet(),
    npcPuppets: new Map(),
    highlightT: 0,
    reducedMotion,
    intro: 1.2
  };
  state.d = path.stopAt[state.stopIndex];
  state.targetD = state.d;

  function view(w, h) {
    const scale = h / PANEL_H;
    return { w, h, scale, viewWorldW: w / scale };
  }

  function heroStand(stopIndex) {
    return path.stopAt[stopIndex];
  }

  function travelToIndex(index) {
    if (index < 0 || index >= TRAIL.length) return false;
    if (!isStopUnlocked(state.progress, TRAIL[index].id)) return false;
    state.targetD = heroStand(index);
    state.moving = true;
    state.facing = state.targetD >= state.d ? 1 : -1;
    return true;
  }

  function currentStop() {
    return TRAIL[state.stopIndex];
  }

  function update(dt, v) {
    state.t += dt;
    state.intro = Math.max(0, state.intro - dt);
    tickPuppet(state.puppet, dt);
    if (state.moving) {
      const dir = Math.sign(state.targetD - state.d);
      const step = WALK_SPEED * dt * (state.reducedMotion ? 3 : 1);
      if (Math.abs(state.targetD - state.d) <= step) {
        state.d = state.targetD;
        state.moving = false;
        state.stopIndex = path.stopAt.findIndex(sd => Math.abs(sd - state.d) < 1);
        state.highlightT = 0.6;
        fx?.land?.();
        onArrive?.(currentStop());
      } else {
        state.d += dir * step;
        // update stopIndex to the nearest passed stop for the camera
      }
    }
    if (state.highlightT > 0) state.highlightT -= dt;
    // camera: follow the hero with a little lookahead, clamped to the world
    const hero = pointAt(path, state.d);
    const target = hero.x - v.viewWorldW * 0.42 + (state.moving ? state.facing * 60 : 0);
    state.camTarget = Math.max(0, Math.min(WORLD_W - v.viewWorldW, target));
    const k = state.reducedMotion ? 1 : Math.min(1, dt * 4);
    state.camX += (state.camTarget - state.camX) * k;
  }

  function worldToScreen(v, x, y) {
    return { x: (x - state.camX) * v.scale, y: y * v.scale };
  }

  function drawPanels(ctx, v) {
    PANELS.forEach((panel, i) => {
      const sx = (i * PANEL_W - state.camX) * v.scale;
      const sw = PANEL_W * v.scale;
      if (sx > v.w || sx + sw < 0) return;
      const img = getImage(panel.image);
      ctx.save();
      if (img) {
        if (panel.flip) {
          ctx.translate(sx + sw, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, sw, v.h);
        } else {
          ctx.drawImage(img, sx, 0, sw, v.h);
        }
      } else {
        ctx.fillStyle = LANDS[panel.land].accent;
        ctx.fillRect(sx, 0, sw, v.h);
      }
      ctx.restore();
      if (panel.tint === "night") {
        ctx.save();
        ctx.fillStyle = "rgba(24,16,70,.48)";
        ctx.fillRect(sx, 0, sw, v.h);
        // stars
        ctx.fillStyle = "rgba(255,245,200,.9)";
        for (let k = 0; k < 60; k += 1) {
          const px = sx + ((k * 977) % PANEL_W) * v.scale;
          const py = ((k * 431) % 260) * v.scale;
          const tw = 0.5 + 0.5 * Math.sin(state.t * 2 + k);
          ctx.globalAlpha = 0.4 + 0.6 * tw;
          ctx.beginPath();
          ctx.arc(px, py, (1 + (k % 3)) * 0.8 * v.scale, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      // land border seam (left edge of every panel but the first)
      if (i > 0) {
        const g = ctx.createLinearGradient(sx - 60 * v.scale, 0, sx + 60 * v.scale, 0);
        g.addColorStop(0, "rgba(40,30,20,0)");
        g.addColorStop(0.5, "rgba(40,30,20,.55)");
        g.addColorStop(1, "rgba(40,30,20,0)");
        ctx.fillStyle = g;
        ctx.fillRect(sx - 60 * v.scale, 0, 120 * v.scale, v.h);
      }
    });
  }

  function drawTrail(ctx, v) {
    const dotEvery = 26;
    ctx.save();
    for (let d = 0; d < path.length; d += dotEvery) {
      const p = pointAt(path, d);
      const sp = worldToScreen(v, p.x, p.y + 26);
      if (sp.x < -20 || sp.x > v.w + 20) continue;
      // which segment? completed if the stop after this distance is unlocked
      const segIndex = path.stopAt.findIndex(sd => sd > d);
      const reachable = segIndex > 0 ? isStopUnlocked(state.progress, TRAIL[Math.min(segIndex, TRAIL.length - 1)].id) : true;
      const walked = d <= state.d;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, (walked ? 6 : 5) * v.scale, 0, Math.PI * 2);
      ctx.fillStyle = walked ? GOLD : reachable ? PALETTE["trail-reachable"] : "rgba(255,246,220,.55)";
      ctx.fill();
      ctx.lineWidth = 2.5 * v.scale;
      ctx.strokeStyle = walked ? "rgba(59,35,20,.9)" : reachable ? "rgba(59,35,20,.7)" : "rgba(59,35,20,.35)";
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStops(ctx, v) {
    const heroStop = state.stopIndex;
    const sorted = TRAIL.map((s, i) => ({ s, i })).sort((a, b) => a.s.world.y - b.s.world.y);
    for (const { s, i } of sorted) {
      const sp = worldToScreen(v, s.world.x, s.world.y);
      if (sp.x < -260 || sp.x > v.w + 260) continue;
      const unlocked = isStopUnlocked(state.progress, s.id);
      const done = isStopCompleted(state.progress, s.id);
      const current = i === heroStop && !state.moving;
      const isNext = unlocked && !done;
      const land = LANDS[s.land];
      // pad
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y + 8 * v.scale, 52 * v.scale, 22 * v.scale, 0, 0, Math.PI * 2);
      inkFill(ctx, done ? GOLD : unlocked ? CREAM : "rgba(255,246,220,.55)", INK_W * v.scale * 0.8, unlocked ? INK : "rgba(59,35,20,.5)");
      if (isNext && !state.reducedMotion) {
        const pulse = 0.5 + 0.5 * Math.sin(state.t * 3);
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y + 8 * v.scale, (58 + pulse * 8) * v.scale, (26 + pulse * 4) * v.scale, 0, 0, Math.PI * 2);
        ctx.lineWidth = 4 * v.scale;
        ctx.strokeStyle = `rgba(245,198,68,${0.9 - pulse * 0.5})`;
        ctx.stroke();
      }
      ctx.restore();
      // character waiting on the pad
      const cast = CAST[s.character];
      const img = cast ? getImage(cast.sprite) : null;
      if (!state.npcPuppets.has(s.id)) state.npcPuppets.set(s.id, createPuppet());
      const npcState = done ? "celebrate" : current ? "talk" : isNext ? "idle" : "idle";
      drawPuppet(ctx, img, {
        src: cast?.sprite,
        x: sp.x + 40 * v.scale,
        y: sp.y + 6 * v.scale,
        height: NPC_H * (cast?.scale || 1) * v.scale * (unlocked ? 1 : 0.86),
        facing: -1,
        t: state.t + i,
        state: done && !current ? "idle" : npcState,
        puppet: state.npcPuppets.get(s.id),
        alpha: unlocked ? 1 : 0.82,
        shadow: true
      });
      // lantern on a short post
      lantern(ctx, sp.x - 82 * v.scale, sp.y - 46 * v.scale, 20 * v.scale, { lit: done, hang: false, glow: 0.8 });
      // name sign: only where it matters (here, next, or fixed) — the rest keep
      // the map readable with a small marker post
      const showSign = current || isNext || done;
      if (showSign) {
        signpost(ctx, sp.x - 62 * v.scale, sp.y - 168 * v.scale, 124 * v.scale, 110 * v.scale, s.name, { small: true, glow: current ? 0.6 : 0 });
      } else {
        roundRect(ctx, sp.x - 5 * v.scale, sp.y - 60 * v.scale, 10 * v.scale, 60 * v.scale, 4 * v.scale);
        inkFill(ctx, WOOD_DEEP, 3 * v.scale);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y - 66 * v.scale, 11 * v.scale, 0, Math.PI * 2);
        inkFill(ctx, land.accent, 3 * v.scale);
      }
      if (done) sparkle(ctx, sp.x - 72 * v.scale, sp.y - 52 * v.scale, (6 + 2 * Math.sin(state.t * 4 + i)) * v.scale, 0.9);
    }
  }

  function drawHero(ctx, v) {
    const hero = pointAt(path, state.d);
    const sp = worldToScreen(v, hero.x, hero.y);
    const cast = CAST[state.heroId];
    const src = cast?.heroSprite || cast?.sprite;
    const img = src ? getImage(src) : null;
    drawPuppet(ctx, img, {
      src,
      x: sp.x - (state.moving ? 0 : 100 * v.scale), // idle: beside the pad, clear of the sign
      y: sp.y + 10 * v.scale,
      height: HERO_H * v.scale,
      facing: state.facing,
      t: state.t,
      state: state.moving ? "walk" : state.highlightT > 0 ? "celebrate" : "idle",
      puppet: state.puppet
    });
  }

  function drawLandTitles(ctx, v) {
    PANELS.forEach((panel, i) => {
      const sx = (i * PANEL_W - state.camX) * v.scale;
      const cx = sx + (PANEL_W * v.scale) / 2;
      if (cx < -300 || cx > v.w + 300) return;
      ctx.save();
      roundRect(ctx, cx - 150 * v.scale, 84 * v.scale, 300 * v.scale, 46 * v.scale, 18 * v.scale);
      inkFill(ctx, "rgba(255,246,220,.9)", 3 * v.scale);
      label(ctx, panel.title, cx, 107 * v.scale, { size: 24 * v.scale, font: FONT_DISPLAY, color: INK });
      ctx.restore();
    });
  }

  function draw(ctx, w, h) {
    const v = view(w, h);
    ctx.clearRect(0, 0, w, h);
    drawPanels(ctx, v);
    drawTrail(ctx, v);
    drawStops(ctx, v);
    drawHero(ctx, v);
    drawLandTitles(ctx, v);
    // "go" hint arrow above the next stop when the hero is idle
    if (!state.moving) {
      const nextIndex = TRAIL.findIndex(s => isStopUnlocked(state.progress, s.id) && !isStopCompleted(state.progress, s.id));
      if (nextIndex >= 0 && nextIndex !== state.stopIndex) {
        const s = TRAIL[nextIndex];
        const sp = worldToScreen(v, s.world.x, s.world.y);
        const bob = state.reducedMotion ? 0 : Math.sin(state.t * 4) * 6 * v.scale;
        arrow(ctx, sp.x, sp.y - 150 * v.scale + bob, 34 * v.scale, nextIndex >= state.stopIndex ? 1 : -1, 0.95);
      }
    }
    // intro/edge vignette
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(20,14,8,.18)");
    g.addColorStop(0.2, "rgba(20,14,8,0)");
    g.addColorStop(0.85, "rgba(20,14,8,0)");
    g.addColorStop(1, "rgba(20,14,8,.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return v;
  }

  function hitStop(sx, sy, w, h) {
    const v = view(w, h);
    let best = null;
    for (let i = 0; i < TRAIL.length; i += 1) {
      const s = TRAIL[i];
      const sp = worldToScreen(v, s.world.x, s.world.y);
      const dx = (sx - sp.x) / (90 * v.scale);
      const dy = (sy - (sp.y - 40 * v.scale)) / (110 * v.scale);
      const d = dx * dx + dy * dy;
      if (d <= 1 && (!best || d < best.d)) best = { i, d };
    }
    return best ? best.i : -1;
  }

  function pointerDown(sx, sy, w, h) {
    if (state.moving) return null;
    const i = hitStop(sx, sy, w, h);
    if (i < 0) return null;
    if (i === state.stopIndex) { onSelectStop?.(TRAIL[i]); return "select"; }
    if (travelToIndex(i)) return "travel";
    fx?.wobble?.();
    return "locked";
  }

  function key(code) {
    if (state.moving) return false;
    if (code === "ArrowRight" || code === "KeyD") return travelToIndex(state.stopIndex + 1);
    if (code === "ArrowLeft" || code === "KeyA") return travelToIndex(state.stopIndex - 1);
    if (code === "Enter" || code === "Space" || code === "KeyE") { onSelectStop?.(currentStop()); return true; }
    return false;
  }

  return {
    update,
    draw,
    pointerDown,
    key,
    travelToIndex,
    travelToStop: id => travelToIndex(TRAIL.findIndex(s => s.id === id)),
    currentStop,
    setProgress(p) { state.progress = p; },
    setHero(id) { state.heroId = id; },
    get moving() { return state.moving; },
    get stopIndex() { return state.stopIndex; },
    assets: () => [...PANELS.map(p => p.image), ...TRAIL.map(s => CAST[s.character]?.sprite), CAST[heroId]?.heroSprite || CAST[heroId]?.sprite]
  };
}
