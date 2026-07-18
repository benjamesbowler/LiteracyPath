// Shared canvas helpers for the canvas-based arcade games (Sound Beat / Ps1,
// Rhyme Pop, Sound Safari). These helpers were forked across the three game
// files; this module is the canonical copy they now import. Where the forks
// had drifted by tiny amounts, one version won — the decision is documented
// on the helper itself — and the difference was visually imperceptible.

export const TWO_PI = Math.PI * 2;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Cubic ease-out; input is clamped to [0, 1] so overshoot never inverts.
export function easeOut(value) {
  return 1 - Math.pow(1 - clamp(value, 0, 1), 3);
}

export function titleWord(value) {
  const word = String(value || "");
  return word ? `${word.slice(0, 1).toUpperCase()}${word.slice(1)}` : "";
}

// Stroked arcade label. Sound Safari's fork used stroke alpha .76 where the
// other two used .72; .72 won (majority fork, imperceptible difference).
export function text(ctx, value, x, y, size, color = "#fff", align = "left", weight = 800) {
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

export function roundedRect(ctx, x, y, w, h, r) {
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

export function cutRect(ctx, x, y, w, h, cut = 12) {
  const c = Math.min(cut, w / 3, h / 3);
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.lineTo(x, y + c);
  ctx.closePath();
}

// Bevelled HUD panel with a gloss pass. Rhyme Pop's fork had a slightly
// fainter gloss (alpha 0.38, stops .26@0 / .08@0.18) than Sound Beat's
// (alpha 0.42, stops .28@0 / .08@0.16) used here; the difference is
// imperceptible and this version covers both.
export function panel(ctx, x, y, w, h, color = "rgba(5,10,22,.72)", stroke = "rgba(255,255,255,.28)") {
  ctx.save();
  cutRect(ctx, x, y, w, h, Math.min(18, h * 0.32));
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 0.42;
  const gloss = ctx.createLinearGradient(0, y, 0, y + h);
  gloss.addColorStop(0, "rgba(255,255,255,.28)");
  gloss.addColorStop(0.16, "rgba(255,255,255,.08)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  cutRect(ctx, x + 2, y + 2, w - 4, Math.max(6, h * 0.34), Math.min(14, h * 0.24));
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  cutRect(ctx, x, y, w, h, Math.min(18, h * 0.32));
  ctx.stroke();
  ctx.restore();
}

export function imageReady(image) {
  return Boolean(image?.complete && image.naturalWidth);
}

// Cover-fit backdrop draw; returns false while the image is still loading so
// the caller can paint the fallback instead. Sound Safari keeps its own
// zoom/drift variant locally.
export function drawCover(ctx, image, w, h) {
  if (!image.complete || !image.naturalWidth) return false;
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return true;
}

// Starfield painted behind the game while its backdrop image loads. Sound
// Safari keeps its own two-tone themed variant locally.
export function drawFallback(ctx, w, h, config, time) {
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

// CRT-style vignette + scanlines + grain. Sound Safari keeps its own heavier
// grade (extra multiply dither pass) locally.
export function drawScreenGrade(ctx, w, h) {
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

// Full-bleed game canvas + 2d context, styled exactly as the three arcade
// engines had it inline.
export function createGameCanvas(mount) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none;background:#06101d";
  mount.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  return { canvas, ctx };
}

// devicePixelRatio-aware canvas sizing (dpr capped at 2) with the engines'
// shared minimum logical size. Returns the logical size and applied dpr.
export function sizeCanvasToMount(mount, canvas, ctx) {
  const rect = mount.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(320, rect.width || mount.clientWidth || 640);
  const height = Math.max(280, rect.height || mount.clientHeight || 420);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, dpr };
}

export function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// Pointer event -> logical canvas coordinates (the CSS-pixel space the game
// draws in after the dpr transform).
export function canvasPoint(canvas, event, width, height) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (width / rect.width),
    y: (event.clientY - rect.top) * (height / rect.height)
  };
}

// Live sound gate: `sfx` runs an SFX thunk only when sound is on right now
// (via options.getSound() or the options.isSoundEnabled snapshot) and never
// lets an audio failure break play.
export function createSoundGate(options) {
  function soundAllowed() {
    return options.getSound ? options.getSound() : options.isSoundEnabled;
  }
  function sfx(fn) {
    if (soundAllowed()) {
      try { fn(); } catch { /* sound is optional */ }
    }
  }
  return { soundAllowed, sfx };
}

// Score write-through: clamp/round into state and echo to the HUD callback.
export function createScoreReporter(state, options) {
  return next => {
    state.score = Math.max(0, Math.round(next));
    options.onScoreUpdate?.(state.score);
  };
}

// Shared rAF loop skeleton: compute the clamped frame dt, run one frame, then
// schedule the next. `reset` re-anchors the clock after a pause so the first
// resumed frame does not jump; `cancel` stops the loop on destroy.
export function createFrameLoop(onFrame) {
  let raf = 0;
  let last = performance.now() / 1000;
  function tick() {
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, now - last);
    last = now;
    onFrame(now, dt);
    raf = window.requestAnimationFrame(tick);
  }
  return {
    start() {
      tick();
    },
    reset(now = performance.now() / 1000) {
      last = now;
    },
    cancel() {
      window.cancelAnimationFrame(raf);
    }
  };
}
