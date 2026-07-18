// Shared Three.js runtime shell for the 3D arcade games (Rocket Run, Sound
// Racer, Star Gallery, Grammar Grind). Only genuinely duplicated infrastructure
// lives here: the three.js loader, renderer/scene/camera lifecycle, DPR-capped
// resize, the rAF loop handle, GPU disposal, WebGL context-loss notification,
// reduced-motion detection, and the touch steer zones. Everything game-specific
// (tracks, cars, obstacles, scoring, level data) stays in each game file.
//
// Two three.js runtimes coexist on purpose:
//   - Rocket Run / Sound Racer load the pinned r128 UMD build vendored at
//     src/vendor/three/three.min.js (via loadThree below) and code against the
//     r128 API (sRGBEncoding etc.).
//   - Star Gallery / Grammar Grind import the bundled npm `three` package and
//     use newer APIs (outputColorSpace). Converting them to r128 would break
//     them, so both paths stay.
// Every helper here takes the game's THREE instance, so it works with either.

import threeMinUrl from "../../../../vendor/three/three.min.js?url";

// ── three.js loader ──────────────────────────────────────────────────────────
// Idempotent, promise-based script loader for the vendored r128 build. Same
// call shape the games always had: loadThree().then(THREE => ...). The script
// URL goes through Vite's ?url asset pipeline, so it resolves in dev and is
// emitted with a content hash in production builds — no CDN, no SRI gap, and
// it keeps working offline.
export function loadThree() {
  return new Promise((resolve, reject) => {
    if (window.THREE) {
      resolve(window.THREE);
      return;
    }
    const existing = document.querySelector("script[data-three-vendor]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.THREE));
      existing.addEventListener("error", () => reject(new Error("three-load-failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = threeMinUrl;
    script.async = true;
    script.dataset.threeVendor = "1";
    script.onload = () => resolve(window.THREE);
    script.onerror = () => reject(new Error("three-load-failed"));
    document.head.appendChild(script);
  });
}

// ── GPU disposal ─────────────────────────────────────────────────────────────
// Deep-dispose every geometry, material and material map under a subtree.
export function disposeObject(root) {
  if (!root) return;
  root.traverse(node => {
    if (node.geometry) node.geometry.dispose();
    const materials = Array.isArray(node.material) ? node.material : (node.material ? [node.material] : []);
    for (const material of materials) {
      if (material.map) material.map.dispose();
      material.dispose();
    }
  });
}

// Dispose the renderer itself and detach its canvas. forceContextLoss releases
// the GL context immediately instead of waiting for GC (the lane games rely on
// this when a scene is torn down and rebuilt on difficulty change).
export function disposeRenderer(renderer, { forceContextLoss = false } = {}) {
  if (!renderer) return;
  try {
    renderer.dispose();
    if (forceContextLoss && renderer.forceContextLoss) renderer.forceContextLoss();
  } catch {
    /* ignore teardown errors */
  }
  const canvas = renderer.domElement;
  if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
}

// ── Renderer / scene / camera ────────────────────────────────────────────────
// Build a WebGLRenderer with the shared defaults each 3D game used to inline:
// an antialias retry for constrained GPUs, a devicePixelRatio cap, sRGB output
// (encoding on r128, colorSpace on newer three), ACES tone mapping and PCF
// shadow mapping. `new THREE.WebGLRenderer` is the one step that can throw
// (WebGL unavailable / GPU context lost / antialias rejected); with
// retryWithoutAntialias the failure retries once without antialias, otherwise
// the throw propagates to the caller's error handling.
export function createRenderer(THREE, {
  antialias = true,
  powerPreference = "default",
  retryWithoutAntialias = true,
  pixelRatioCap = 2,
  srgbOutput = true,
  toneMappingExposure = null,
  shadowMap = null
} = {}) {
  let renderer;
  if (retryWithoutAntialias) {
    try { renderer = new THREE.WebGLRenderer({ antialias, powerPreference }); }
    catch { renderer = new THREE.WebGLRenderer({ antialias: false }); }
  } else {
    renderer = new THREE.WebGLRenderer({ antialias, powerPreference });
  }
  applyPixelRatio(renderer, { cap: pixelRatioCap });
  if (srgbOutput) {
    if ("outputColorSpace" in renderer && THREE.SRGBColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
  }
  if (toneMappingExposure != null) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = toneMappingExposure;
  }
  if (shadowMap) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = shadowMap === "pcfsoft" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  }
  return renderer;
}

export function createScene(THREE, fog) {
  const scene = new THREE.Scene();
  if (fog) scene.fog = fog;
  return scene;
}

export function createPerspectiveCamera(THREE, { fov, aspect, near = 0.1, far = 100, position, lookAt }) {
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  if (position) camera.position.set(position[0], position[1], position[2]);
  if (lookAt) camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
  return camera;
}

// Cap the pixel ratio so high-DPR screens don't multiply fragment work.
export function applyPixelRatio(renderer, { cap = 2, floor = 0 } = {}) {
  const ratio = window.devicePixelRatio || 1;
  renderer.setPixelRatio(Math.max(floor, Math.min(cap, ratio)));
}

// ── Resize ───────────────────────────────────────────────────────────────────
// Wire the shared "keep the camera aspect and renderer size in sync with the
// mount" behaviour: window resize listener (optional — not every game had one)
// plus a ResizeObserver on the mount. Returns a detach function for teardown.
export function attachResize({ mount, renderer, camera, width, height, listenToWindow = true, updateStyle = true, onResize }) {
  const handle = () => {
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
    renderer.setSize(width(), height(), updateStyle);
    if (onResize) onResize();
  };
  if (listenToWindow) window.addEventListener("resize", handle);
  const observer = new ResizeObserver(handle);
  observer.observe(mount);
  return () => {
    if (listenToWindow) window.removeEventListener("resize", handle);
    observer.disconnect();
  };
}

// ── rAF loop ─────────────────────────────────────────────────────────────────
// Manage the requestAnimationFrame handle for a game tick. The next frame is
// scheduled before the callback runs (the pattern the games already used), so
// a tick that throws can't silently kill the loop, and stop() always has a
// live handle to cancel. start(immediate = true) also runs the first tick
// synchronously, matching engines that used to call their tick directly once
// before entering the rAF cycle.
export function createFrameLoop(callback) {
  let raf = 0;
  let active = false;
  const wrapped = now => {
    if (!active) return;
    raf = requestAnimationFrame(wrapped);
    callback(now);
  };
  return {
    start(immediate = false) {
      if (active) return;
      active = true;
      if (immediate) wrapped(performance.now());
      else raf = requestAnimationFrame(wrapped);
    },
    stop() {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    get running() {
      return active;
    }
  };
}

// ── WebGL context loss ───────────────────────────────────────────────────────
// Notify the game when the GPU context is lost/restored so it can pause and
// resume cleanly. The renderer already owns the low-level handling (it
// preventDefaults the loss event and re-initialises GL state on restore), so
// this guard never touches event.preventDefault — it only observes.
export function attachContextLossGuard(renderer, { onLost, onRestored } = {}) {
  const canvas = renderer && renderer.domElement;
  if (!canvas) return () => {};
  const lost = () => { if (onLost) onLost(); };
  const restored = () => { if (onRestored) onRestored(); };
  canvas.addEventListener("webglcontextlost", lost, false);
  canvas.addEventListener("webglcontextrestored", restored, false);
  return () => {
    canvas.removeEventListener("webglcontextlost", lost, false);
    canvas.removeEventListener("webglcontextrestored", restored, false);
  };
}

// ── Reduced motion ───────────────────────────────────────────────────────────
export function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// ── Quality tiering ──────────────────────────────────────────────────────────
// One small hardware probe shared by all four 3D games so a weak tablet gets a
// lighter scene instead of a stuttery one. Every signal is guarded: a browser
// that hides hardwareConcurrency/deviceMemory (Safari, Firefox) just scores
// "unknown" on that axis and lands on the medium default — never a crash, and
// never a forced low tier from missing data alone.
export const QUALITY_TIERS = Object.freeze({
  low: { pixelRatioCap: 1, shadowMap: "off", particleScale: 0.4 },
  medium: { pixelRatioCap: 1.5, shadowMap: "pcf", particleScale: 0.7 },
  high: { pixelRatioCap: 2, shadowMap: "pcfsoft", particleScale: 1 }
});

function readQualitySignals() {
  const nav = typeof navigator === "undefined" ? {} : navigator;
  return {
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
    devicePixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio,
    reducedMotion: typeof window === "undefined" ? false : prefersReducedMotion()
  };
}

// detectQualityTier() -> "low" | "medium" | "high". Callers may pass their own
// signals object ({ cores, memory, devicePixelRatio, reducedMotion }); with no
// argument the live browser signals are read. prefers-reduced-motion always
// wins: the user asked for less work, so the game renders the light scene.
export function detectQualityTier(signals) {
  const input = signals || readQualitySignals();
  if (input.reducedMotion) return "low";
  const cores = Number(input.cores) || 0;       // 0 = signal unavailable
  const memory = Number(input.memory) || 0;     // 0 = signal unavailable
  const dpr = Math.max(1, Number(input.devicePixelRatio) || 1);
  let score = 0;
  if (cores >= 8) score += 2; else if (cores >= 4) score += 1; else if (cores > 0) score -= 2;
  if (memory >= 8) score += 2; else if (memory >= 4) score += 1; else if (memory > 0) score -= 2;
  if (dpr > 2.5) score -= 1; // very high-DPR screens multiply fragment work even after the cap
  if (score < 0) return "low";
  if (score >= 2) return "high";
  return "medium";
}

// createRenderer's `shadowMap` option, capped at the tier's ceiling: low
// disables shadow maps entirely, medium forces the cheap basic PCF map, high
// keeps the game's own pick (pcf or pcfsoft).
export function shadowMapForTier(tier, preferred = null) {
  if (!preferred || tier === "low") return null;
  if (tier === "medium") return "pcf";
  return preferred;
}

// Scale a particle/effect count for the tier (never zero — a catch burst that
// simply doesn't happen reads as a bug to a child; a smaller one doesn't).
export function particleCountForTier(tier, baseCount) {
  const scale = (QUALITY_TIERS[tier] || QUALITY_TIERS.high).particleScale;
  return Math.max(1, Math.round((Number(baseCount) || 0) * scale));
}

// Re-apply the tier to a live renderer: DPR cap (low=1, medium=1.5, high=2)
// plus the shadow-map off/basic/full switch. Call right after createRenderer
// (and from resize handlers that used to re-cap to a fixed ratio). Games
// create shadow-casting lights only when the tier allows it, so toggling
// shadowMap.enabled here is a belt-and-braces guarantee, not a restyle.
export function applyQualityTier(renderer, tier, { floor = 0 } = {}) {
  const settings = QUALITY_TIERS[tier] || QUALITY_TIERS.high;
  applyPixelRatio(renderer, { cap: settings.pixelRatioCap, floor });
  if (renderer.shadowMap) renderer.shadowMap.enabled = settings.shadowMap !== "off";
  return settings;
}

// ── First-run onboarding persistence ─────────────────────────────────────────
// One dismissal per device per game (keyed by the game's real id). Storage can
// throw (private mode, denied storage): a failed read shows the overlay every
// session and a failed write just means it shows again next time — the game
// must never crash on it.
export function hasSeenOnboarding(gameId) {
  try {
    return window.localStorage.getItem("lp-arcade-onboarded-v1:" + gameId) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingSeen(gameId) {
  try {
    window.localStorage.setItem("lp-arcade-onboarded-v1:" + gameId, "1");
  } catch {
    /* storage is optional — the overlay simply shows again next session */
  }
}

// ── Touch steer zones ────────────────────────────────────────────────────────
// The invisible left/right screen-half buttons the lane games overlay for
// touch steering. With keyboardClick, Enter/Space activation (which fires a
// click with detail 0) also steers; pointer taps already steered on
// pointerdown, so only detail 0 clicks may steer there. Returns a detach
// function for teardown.
export function attachSteerZones({ left, right, onLeft, onRight, keyboardClick = false }) {
  const onLeftClick = event => { if (event.detail === 0) onLeft(); };
  const onRightClick = event => { if (event.detail === 0) onRight(); };
  if (left) left.addEventListener("pointerdown", onLeft);
  if (right) right.addEventListener("pointerdown", onRight);
  if (keyboardClick) {
    if (left) left.addEventListener("click", onLeftClick);
    if (right) right.addEventListener("click", onRightClick);
  }
  return () => {
    if (left) left.removeEventListener("pointerdown", onLeft);
    if (right) right.removeEventListener("pointerdown", onRight);
    if (keyboardClick) {
      if (left) left.removeEventListener("click", onLeftClick);
      if (right) right.removeEventListener("click", onRightClick);
    }
  };
}

// Horizontal drag-to-steer on the canvas itself: a swipe past `threshold`
// pixels steers one lane in that direction. Returns a detach function.
export function attachSwipeSteer(element, { threshold = 40, onSteer }) {
  let dragX = null;
  const onDown = event => { dragX = event.clientX; };
  const onUp = event => {
    if (dragX == null) return;
    const dx = event.clientX - dragX;
    if (Math.abs(dx) > threshold) onSteer(dx > 0 ? 1 : -1);
    dragX = null;
  };
  element.addEventListener("pointerdown", onDown);
  element.addEventListener("pointerup", onUp);
  return () => {
    element.removeEventListener("pointerdown", onDown);
    element.removeEventListener("pointerup", onUp);
  };
}
