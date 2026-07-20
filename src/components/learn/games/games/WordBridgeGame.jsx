import { useEffect, useRef } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playCelebrationFanfare,
  playTapSound
} from "../../../../utils/audio/gameSfx";
import {
  worldForGameDifficulty,
  LEVELS_PER_DIFFICULTY
} from "../../../../utils/curriculumLadder.js";
import { makeCatchUp } from "../../../../utils/catchUpQueue.js";
import { starRubric } from "../../../../utils/starRubric.js";
import { wordBridgeLadder } from "../../../../utils/wordBridgeLevels.js";
import { speak, speakWord, cancelSpeech, hasRecordedSpeech } from "../../../../utils/learnGamesAudio.js";

const WORLD_THEME = {
  meadow: {
    name: "Meadow crossing",
    skyTop: "#8ec9ee",
    skyBottom: "#d8f2f1",
    far: "#6ea475",
    mid: "#4d8b51",
    ground: "#3e7d3b",
    groundDark: "#24562d",
    hazard: "#2f9bba",
    hazardDeep: "#12617d",
    accent: "#62b35f",
    accentDark: "#2d6f39",
    tile: "#f4dd7a",
    tileEdge: "#b98232",
    builder: "#f2b447",
    builderTrim: "#4f8c44",
    palA: "#f6f1dc",
    palB: "#d7cfb8",
    light: "#fff6b6",
    assets: {
      background: "/images/learn-games/word-bridge/meadow-background-clean-v2.webp",
      helper: "/images/learn-games/word-bridge/meadow-helper.webp",
      pals: "/images/learn-games/word-bridge/meadow-pals.webp"
    }
  },
  dino: {
    name: "Lava rib bridge",
    skyTop: "#b87148",
    skyBottom: "#efb66b",
    far: "#66483a",
    mid: "#496334",
    ground: "#574529",
    groundDark: "#2d2b1c",
    hazard: "#ef5d31",
    hazardDeep: "#611b18",
    accent: "#d68b36",
    accentDark: "#7c451f",
    tile: "#f0cd68",
    tileEdge: "#9a5427",
    builder: "#7aae47",
    builderTrim: "#f3b43f",
    palA: "#7bc668",
    palB: "#f0b24c",
    light: "#ffd37d",
    assets: {
      background: "/images/learn-games/word-bridge/dino-background-clean-v2.webp",
      helper: "/images/learn-games/word-bridge/dino-helper.webp",
      pals: "/images/learn-games/word-bridge/dino-pals.webp"
    }
  },
  moonwood: {
    name: "Moonwood chasm",
    skyTop: "#111936",
    skyBottom: "#26375f",
    far: "#1c2544",
    mid: "#26335f",
    ground: "#1b3140",
    groundDark: "#0c1726",
    hazard: "#5b58af",
    hazardDeep: "#161326",
    accent: "#8f7dff",
    accentDark: "#433b85",
    tile: "#e8def7",
    tileEdge: "#7665c8",
    builder: "#bda5ff",
    builderTrim: "#f1dbff",
    palA: "#d9e6ff",
    palB: "#8bd7d2",
    light: "#dff4ff",
    assets: {
      background: "/images/learn-games/word-bridge/moonwood-background-clean-v2.webp",
      helper: "/images/learn-games/word-bridge/moonwood-helper.webp",
      pals: "/images/learn-games/word-bridge/moonwood-pals.webp"
    }
  }
};

const KEY_WIDTH = 44;
const KEY_HEIGHT = 50;
// First-run onboarding dismissal is remembered once per device; a denied
// storage (private mode) simply shows the card again next session.
const ONBOARD_KEY = "lp-arcade-onboarded-v1:word-bridge";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeGlyph(value) {
  return String(value || "").trim().toLowerCase();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
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

function fillRound(ctx, x, y, w, h, r, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

function chamferPath(ctx, x, y, w, h, cut = 8) {
  const c = Math.min(cut, w / 3, h / 3);
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

function fillChamfer(ctx, x, y, w, h, cut, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  chamferPath(ctx, x, y, w, h, cut);
  ctx.fill();
}

function strokeChamfer(ctx, x, y, w, h, cut, strokeStyle, lineWidth = 1) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  chamferPath(ctx, x, y, w, h, cut);
  ctx.stroke();
}

function drawPoly(ctx, points, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawCoverImage(ctx, image, x, y, w, h, alignX = 0.5, alignY = 0.5) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  if (!iw || !ih || !w || !h) return false;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * alignX));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * alignY));
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  return true;
}

function imageReady(asset) {
  return !!(asset?.ready && asset.image?.naturalWidth && asset.image?.naturalHeight);
}

function tileWidthFor(glyph, isSentence) {
  const raw = String(glyph || "");
  if (!isSentence) return KEY_WIDTH;
  return clamp(34 + raw.length * 11, 58, 118);
}

function liquidWaveY(x, baseY, amp, freq, phase) {
  return baseY + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 0.43 + phase * 1.7) * amp * 0.38;
}

export default function WordBridgeGame({
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
    let api = { teardown() {} };
    try {
      api = startGame(mountRef.current, {
        difficulty,
        startLevel,
        onScoreUpdate,
        onProgressUpdate,
        onComplete,
        onCheckpoint,
        getSound: () => soundRef.current
      });
      onEngineReady?.(api);
    } catch (err) {
      console.error("[WordBridge] failed to start:", err);
    }
    return () => {
      try {
        api.teardown();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "460px",
        overflow: "hidden",
        background: "#070b1e",
        touchAction: "none"
      }}
    />
  );
}

function startGame(mount, opts) {
  const difficulty = String(opts.difficulty || "easy").toLowerCase();
  const world = worldForGameDifficulty(difficulty);
  const theme = WORLD_THEME[world] || WORLD_THEME.meadow;
  const ladder = wordBridgeLadder(difficulty);
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const sfx = fn => {
    try {
      if (opts.getSound?.()) fn();
    } catch {
      /* audio is optional */
    }
  };

  const cv = document.createElement("canvas");
  cv.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%";
  mount.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0;
  let H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = mount.clientWidth || 640;
    H = mount.clientHeight || 460;
    cv.width = W * DPR;
    cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ResizeObserver callbacks fire asynchronously, after startGame has finished
  // initializing, so it is safe to touch level state here. Geometry (ground,
  // gap, slots, tile homes, HUD) is recomputed instead of only rescaling.
  function onResize() {
    resize();
    if (!currentLevel || !builder) return;
    layoutScene(false);
    layoutHud();
    renderTargetHUD();
    render();
  }

  resize();
  const ro = new ResizeObserver(onResize);
  ro.observe(mount);

  const hud = document.createElement("div");
  hud.className = "word-bridge-hud";
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#fff;z-index:4";
  hud.innerHTML =
    '<div data-wb-panel="target" style="position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:12px;background:rgba(7,10,22,.72);border:1px solid rgba(255,255,255,.18);box-shadow:0 12px 26px rgba(0,0,0,.26);padding:9px 16px 10px 10px;clip-path:polygon(0 0,100% 0,calc(100% - 15px) 100%,0 100%)">' +
      '<div data-wb="level" style="min-width:54px;height:54px;display:grid;place-items:center;font-size:1.35rem;font-weight:950;color:#071033;background:#ffd34e;box-shadow:inset 0 -6px 0 rgba(0,0,0,.24)">1</div>' +
      '<div style="display:grid;gap:4px"><div data-wb="lab" style="font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;opacity:.78">Build the word</div>' +
      '<div data-wb="target" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"></div></div>' +
      '<button data-wb="hear" type="button" aria-label="Hear the word" style="pointer-events:auto;width:46px;height:46px;flex:none;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font-size:1.25rem;display:grid;place-items:center;cursor:pointer;clip-path:polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)">♪</button></div>' +
    '<div data-wb-panel="status" style="position:absolute;top:16px;right:16px;text-align:right;background:rgba(7,10,22,.64);border:1px solid rgba(255,255,255,.16);box-shadow:0 12px 24px rgba(0,0,0,.22);padding:9px 12px;min-width:154px;clip-path:polygon(12px 0,100% 0,100% 100%,0 100%,0 12px)">' +
      '<div data-wb="stars" style="font-size:1.22rem;letter-spacing:2px;color:#ffd34e;filter:drop-shadow(0 2px 4px rgba(0,0,0,.45))">☆☆☆</div>' +
      '<div data-wb="world" style="font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;opacity:.84;margin-top:2px">Meadow</div>' +
      '<div style="height:8px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:7px"><i data-wb="patience" style="display:block;height:100%;width:100%;background:#ffd34e;transition:width .18s ease"></i></div></div>' +
    '<div data-wb="banner" style="position:absolute;top:31%;left:0;right:0;text-align:center;pointer-events:none;font-style:italic;font-weight:950;font-size:clamp(1.3rem,5vw,2.65rem);letter-spacing:.11em;text-transform:uppercase;color:#f8fbff;text-shadow:0 4px 20px rgba(0,0,0,.76);opacity:0;transform:translateY(16px);transition:opacity .22s ease,transform .22s ease"></div>';
  mount.appendChild(hud);

  const elTarget = hud.querySelector('[data-wb="target"]');
  const elLab = hud.querySelector('[data-wb="lab"]');
  const elLevel = hud.querySelector('[data-wb="level"]');
  const elStars = hud.querySelector('[data-wb="stars"]');
  const elWorld = hud.querySelector('[data-wb="world"]');
  const elPatience = hud.querySelector('[data-wb="patience"]');
  const elBanner = hud.querySelector('[data-wb="banner"]');
  const elHear = hud.querySelector('[data-wb="hear"]');

  function targetSpeechText() {
    if (!currentLevel) return "";
    return Array.isArray(currentLevel.target)
      ? currentLevel.target.join(" ")
      : String(currentLevel.target);
  }

  function canHearTarget() {
    return Boolean(opts.getSound?.() && hasRecordedSpeech(targetSpeechText()));
  }

  function syncHearControl() {
    if (!elHear) return;
    const available = canHearTarget();
    elHear.style.display = available ? "grid" : "none";
    elHear.disabled = !available;
  }

  // "Hear the word" is exposed only when this exact target has a recording.
  function speakTarget() {
    if (!currentLevel || !canHearTarget()) return;
    if (Array.isArray(currentLevel.target)) speak(currentLevel.target.join(" "));
    else speakWord(String(currentLevel.target));
  }
  elHear?.addEventListener("click", speakTarget);

  function layoutHud() {
    const compact = W < 590;
    const targetPanel = hud.querySelector('[data-wb-panel="target"]');
    const statusPanel = hud.querySelector('[data-wb-panel="status"]');
    if (targetPanel) {
      targetPanel.style.left = compact ? "10px" : "16px";
      targetPanel.style.right = compact ? "10px" : "";
      targetPanel.style.gap = compact ? "8px" : "12px";
      targetPanel.style.padding = compact ? "8px 12px 9px 8px" : "9px 16px 10px 10px";
    }
    if (statusPanel) {
      statusPanel.style.top = compact ? "86px" : "16px";
      statusPanel.style.right = compact ? "10px" : "16px";
      statusPanel.style.minWidth = compact ? "138px" : "154px";
    }
  }

  const padWrap = document.createElement("div");
  padWrap.style.cssText = "position:absolute;inset:0;z-index:6;pointer-events:none";
  padWrap.innerHTML =
    '<div style="position:absolute;bottom:18px;left:18px;display:flex;gap:10px;pointer-events:auto">' +
      '<button data-wb="left" aria-label="Move left" style="width:62px;height:58px;border:1px solid rgba(255,255,255,.28);background:linear-gradient(160deg,rgba(30,42,70,.62),rgba(4,8,20,.64));color:#fff;font-size:1.45rem;font-weight:900;backdrop-filter:blur(4px);clip-path:polygon(13px 0,100% 0,100% calc(100% - 13px),calc(100% - 13px) 100%,0 100%,0 13px);box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 10px 20px rgba(0,0,0,.26)">&#9664;</button>' +
      '<button data-wb="right" aria-label="Move right" style="width:62px;height:58px;border:1px solid rgba(255,255,255,.28);background:linear-gradient(160deg,rgba(30,42,70,.62),rgba(4,8,20,.64));color:#fff;font-size:1.45rem;font-weight:900;backdrop-filter:blur(4px);clip-path:polygon(13px 0,100% 0,100% calc(100% - 13px),calc(100% - 13px) 100%,0 100%,0 13px);box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 10px 20px rgba(0,0,0,.26)">&#9654;</button></div>' +
    '<div style="position:absolute;bottom:18px;right:18px;pointer-events:auto">' +
      '<button data-wb="action" aria-label="Pick or drop tile" style="width:98px;height:66px;border:1px solid rgba(255,255,255,.55);background:linear-gradient(160deg,#fff0a8 0%,#ffd451 42%,#e58d27 100%);color:#20140a;font-size:.95rem;font-weight:950;letter-spacing:.04em;clip-path:polygon(15px 0,100% 0,100% calc(100% - 15px),calc(100% - 15px) 100%,0 100%,0 15px);box-shadow:inset 0 -8px 0 rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.55),0 13px 22px rgba(0,0,0,.28)">PICK</button></div>';
  mount.appendChild(padWrap);

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:24px;z-index:20;background:radial-gradient(120% 90% at 50% 25%,rgba(20,40,70,.72),rgba(6,10,22,.94));pointer-events:auto";
  mount.appendChild(overlay);

  const keys = { left: false, right: false, action: false };
  let actionConsumed = false;
  let actionQueued = false;
  let running = false;
  let paused = false;
  let onboarding = false;
  let rafId = 0;
  let levelCompleteTimer = 0;
  let last = 0;
  let currentLevel = null;
  let builder = null;
  let tiles = [];
  let slots = [];
  let pals = [];
  let particles = [];
  let floats = [];
  let score = 0;
  let wordsDone = 0;
  let levelMistakes = 0;
  let stageStars = [];
  let stageIdx = 0;
  let phase = "GET_READY";
  let phaseTimer = 0;
  let bannerT = 0;
  let wobbleSlot = -1;
  let wobbleT = 0;
  let bridgeGlow = 0;
  let patienceLeft = 0;
  let actionButtonLabel = "";
  let GROUND_Y = 0;
  let gap = { x: 0, w: 0 };
  let bell = { x: 0, y: 0, r: 22 };
  let moveTargetX = null;
  let pendingTapAction = null;
  const startIdx = Math.max(0, Math.min(Number(opts.startLevel) || 0, ladder.length - 1));
  let stageQueue = makeCatchUp(ladder.map((_, i) => i).slice(startIdx));
  const sceneAssets = {
    background: loadSceneImage(theme.assets?.background),
    helper: loadSceneImage(theme.assets?.helper),
    pals: loadSceneImage(theme.assets?.pals)
  };

  function loadSceneImage(src) {
    const asset = { image: new Image(), ready: false, failed: false };
    if (!src) {
      asset.failed = true;
      return asset;
    }
    asset.image.decoding = "async";
    asset.image.onload = () => {
      asset.ready = true;
      if (currentLevel && builder) render();
    };
    asset.image.onerror = () => {
      asset.failed = true;
    };
    asset.image.src = src;
    return asset;
  }

  function setBanner(text, seconds = 1.4) {
    elBanner.textContent = text;
    elBanner.style.opacity = "1";
    elBanner.style.transform = "translateY(0)";
    bannerT = seconds;
  }

  function clearBanner() {
    elBanner.style.opacity = "0";
    elBanner.style.transform = "translateY(16px)";
  }

  function emitBurst(x, y, color, count = 12, power = 1) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 150 * power,
        vy: (-70 - Math.random() * 100) * power,
        size: 3 + Math.random() * 5,
        color,
        life: 0.55 + Math.random() * 0.35,
        ttl: 0.75
      });
    }
  }

  function addFloat(x, y, txt, color = "#ffffff") {
    floats.push({ x, y, txt, color, life: 0.9, ttl: 0.9 });
  }

  function isActionKey(key) {
    return key === " " || key === "e" || key === "Enter" || key === "ArrowUp";
  }

  // Keys are only captured while the stage is actually interactive — when
  // paused (quit dialog) or behind an overlay, arrows/space must reach the page.
  function keysActive() {
    return !paused && (phase === "GET_READY" || phase === "PLAYING" || phase === "BELL_READY");
  }

  function onKeyDown(e) {
    if (!keysActive()) return;
    if (e.key === "ArrowLeft" || e.key === "a") {
      e.preventDefault();
      keys.left = true;
      moveTargetX = null;
      pendingTapAction = null;
    }
    if (e.key === "ArrowRight" || e.key === "d") {
      e.preventDefault();
      keys.right = true;
      moveTargetX = null;
      pendingTapAction = null;
    }
    if (isActionKey(e.key)) {
      e.preventDefault();
      actionQueued = true;
      keys.action = true;
      actionConsumed = false;
    }
  }

  function onKeyUp(e) {
    // Always release key state (the phase may have changed mid-press), but
    // only swallow the event while the game is interactive.
    const active = keysActive();
    if (e.key === "ArrowLeft" || e.key === "a") {
      if (active) e.preventDefault();
      keys.left = false;
    }
    if (e.key === "ArrowRight" || e.key === "d") {
      if (active) e.preventDefault();
      keys.right = false;
    }
    if (isActionKey(e.key)) {
      if (active) e.preventDefault();
      keys.action = false;
      actionConsumed = false;
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const btnLeft = padWrap.querySelector('[data-wb="left"]');
  const btnRight = padWrap.querySelector('[data-wb="right"]');
  const btnAction = padWrap.querySelector('[data-wb="action"]');

  function updateActionButton() {
    const label = builder?.carrying ? "DROP" : phase === "BELL_READY" ? "RING" : "PICK";
    if (label === actionButtonLabel) return;
    actionButtonLabel = label;
    btnAction.textContent = label;
    btnAction.setAttribute("aria-label", label === "DROP" ? "Drop tile" : label === "RING" ? "Ring bell" : "Pick tile");
  }

  function setTouch(btn, key) {
    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      keys[key] = true;
      if (key === "action") actionQueued = true;
      actionConsumed = false;
      moveTargetX = null;
      pendingTapAction = null;
      btn.style.transform = "translateY(2px) scale(.98)";
    });
    btn.addEventListener("pointerup", e => {
      e.preventDefault();
      keys[key] = false;
      actionConsumed = false;
      btn.style.transform = "";
    });
    btn.addEventListener("pointercancel", () => {
      keys[key] = false;
      btn.style.transform = "";
    });
  }

  setTouch(btnLeft, "left");
  setTouch(btnRight, "right");
  setTouch(btnAction, "action");

  cv.addEventListener("pointerdown", event => {
    if (!(phase === "PLAYING" || phase === "BELL_READY") || !builder) return;
    const rect = cv.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const tileIx = hitTestTile(x, y);
    const slot = hitTestSlot(x, y);
    const bellHit = Math.hypot(x - bell.x, y - bell.y) < bell.r + 18;
    if (tileIx >= 0) {
      moveTargetX = clamp(tiles[tileIx].x, 18, W - 18);
      pendingTapAction = { type: "tile", x: moveTargetX };
    } else if (slot) {
      moveTargetX = clamp(slot.x + slot.w / 2, 18, W - 18);
      pendingTapAction = { type: "slot", x: moveTargetX };
    } else if (bellHit) {
      moveTargetX = clamp(bell.x, 18, W - 18);
      pendingTapAction = { type: "bell", x: moveTargetX };
    } else {
      moveTargetX = clamp(x, 18, W - 18);
      pendingTapAction = null;
    }
    if (Math.abs(builder.x - moveTargetX) < 34 && pendingTapAction) {
      keys.action = true;
      actionQueued = true;
      actionConsumed = false;
    }
  });

  cv.addEventListener("pointerup", () => {
    keys.action = false;
    actionConsumed = false;
  });

  function renderTargetHUD() {
    elTarget.innerHTML = "";
    const target = currentLevel.target;
    const items = Array.isArray(target) ? target : String(target).toUpperCase().split("");
    const compact = W < 590;
    for (let i = 0; i < items.length; i += 1) {
      const item = String(items[i]);
      const filled = slots[i]?.filled;
      const box = document.createElement("div");
      const boxW = Array.isArray(target)
        ? clamp(34 + item.length * 9, compact ? 46 : 54, compact ? 76 : 96)
        : compact ? 30 : 36;
      box.style.cssText =
        `width:${boxW}px;height:${compact ? 34 : 39}px;display:grid;place-items:center;font-size:${Array.isArray(target) ? ".82rem" : "1.08rem"};font-weight:950;border-radius:8px;` +
        (filled
          ? "background:linear-gradient(160deg,#ffe16f,#ffb437);color:#20140a;border:2px solid rgba(255,255,255,.62);box-shadow:inset 0 -4px 0 rgba(0,0,0,.22)"
          : "background:rgba(255,255,255,.07);color:rgba(255,255,255,.56);border:2px solid rgba(255,255,255,.14)");
      box.textContent = item;
      elTarget.appendChild(box);
    }
  }

  function targetItemsFor(level) {
    return Array.isArray(level.target)
      ? level.target.map(item => String(item))
      : String(level.target).toUpperCase().split("");
  }

  // Geometry for the current stage. startStage calls this with initial=true to
  // (re)create slots/tiles/pals; the ResizeObserver calls it with initial=false
  // so positions track the container without resetting stage progress.
  function layoutScene(initial) {
    const items = targetItemsFor(currentLevel);
    const isSentence = Array.isArray(currentLevel.target);
    GROUND_Y = Math.max(330, H - 86);

    const gapPad = isSentence ? 70 : 54;
    const baseSlotGap = isSentence ? 7 : 9;
    const maxGapW = Math.min(W - 128, isSentence ? 520 : 380);
    const totalFor = (widths, sGap) =>
      widths.reduce((sum, width) => sum + width, 0) + sGap * Math.max(0, widths.length - 1);
    // Long sentences must shrink to fit the available gap instead of spilling
    // past the bridge onto the tile banks (happens below ~700px wide).
    const baseWidths = items.map(item => tileWidthFor(item, isSentence));
    const fitScale = Math.min(1, Math.max(140, maxGapW - gapPad) / Math.max(1, totalFor(baseWidths, baseSlotGap)));
    const tileFitWidth = width => Math.max(isSentence ? 30 : 26, Math.round(width * fitScale));
    const widths = baseWidths.map(tileFitWidth);
    const slotGap = Math.max(3, Math.round(baseSlotGap * fitScale));
    const slotTotal = totalFor(widths, slotGap);
    const gapW = clamp(slotTotal + gapPad, 190, maxGapW);
    const gapX = (W - gapW) / 2;
    gap = { x: gapX, w: gapW };

    const slotY = GROUND_Y - KEY_HEIGHT + 7;
    let cursor = gapX + (gapW - slotTotal) / 2;
    const rects = items.map((item, i) => {
      const rect = { x: cursor, y: slotY, w: widths[i], h: KEY_HEIGHT };
      cursor += widths[i] + slotGap;
      return rect;
    });

    if (initial) {
      slots = rects.map((rect, i) => ({
        ...rect,
        filled: false,
        needed: items[i],
        placedGlyph: "",
        order: i,
        snap: 0
      }));

      builder = {
        x: Math.max(58, gapX - 122),
        y: GROUND_Y - 36,
        w: 28,
        h: 38,
        vx: 0,
        speed: W < 560 ? 190 : 210,
        carrying: null,
        anim: 0,
        facing: 1
      };

      const leftTiles = [];
      const rightTiles = [];
      currentLevel.tiles.forEach((tile, i) => {
        if (i % 2 === 0) leftTiles.push({ tile, i });
        else rightTiles.push({ tile, i });
      });

      function placeTile(entry, sideIndex, sideCount, side) {
        const glyph = String(entry.tile.glyph);
        const w = tileFitWidth(tileWidthFor(glyph, isSentence));
        const bankStart = side < 0 ? 52 : gapX + gapW + 46;
        const bankEnd = side < 0 ? gapX - 42 : W - 52;
        const bankWidth = Math.max(60, bankEnd - bankStart);
        const x = bankStart + (sideIndex + 0.5) * (bankWidth / Math.max(sideCount, 1));
        return {
          ...entry.tile,
          glyph,
          x: clamp(x, 38 + w / 2, W - 38 - w / 2),
          y: GROUND_Y - 29 - (entry.i % 3) * 5,
          w,
          h: KEY_HEIGHT,
          placed: false,
          lost: false,
          bob: Math.random() * Math.PI * 2,
          homeX: x,
          bankSide: side,
          bankIndex: sideIndex,
          bankCount: sideCount,
          bankRow: entry.i % 3
        };
      }

      tiles = [
        ...leftTiles.map((entry, i) => placeTile(entry, i, leftTiles.length, -1)),
        ...rightTiles.map((entry, i) => placeTile(entry, i, rightTiles.length, 1))
      ];
    } else {
      // Relayout only: keep fill/carry state, refresh positions and sizes.
      slots = slots.map((slot, i) => ({ ...slot, ...rects[i] }));
      if (builder) {
        builder.y = GROUND_Y - 36;
        builder.x = clamp(builder.x, 18, W - 18);
        builder.speed = W < 560 ? 190 : 210;
        if (builder.carrying) {
          builder.carrying.w = tileFitWidth(tileWidthFor(String(builder.carrying.glyph), isSentence));
          builder.carrying.h = KEY_HEIGHT;
        }
      }
      for (const t of tiles) {
        t.w = tileFitWidth(tileWidthFor(String(t.glyph), isSentence));
        t.h = KEY_HEIGHT;
        if (t.placed || t.lost) continue;
        const bankStart = t.bankSide < 0 ? 52 : gap.x + gap.w + 46;
        const bankEnd = t.bankSide < 0 ? gap.x - 42 : W - 52;
        const bankWidth = Math.max(60, bankEnd - bankStart);
        const x = bankStart + (t.bankIndex + 0.5) * (bankWidth / Math.max(t.bankCount, 1));
        t.homeX = x;
        t.x = clamp(x, 38 + t.w / 2, W - 38 - t.w / 2);
        t.y = GROUND_Y - 29 - t.bankRow * 5;
      }
    }

    const palSpacing = clamp((gap.x - 92) / Math.max(1, currentLevel.pals - 1), 28, 48);
    if (initial) {
      pals = Array.from({ length: currentLevel.pals }, (_, i) => ({
        x: 32 + i * palSpacing,
        homeX: 32 + i * palSpacing,
        y: GROUND_Y - 9,
        state: "waiting",
        t: i * 0.8,
        speed: 80 + (i % 3) * 8,
        color: i % 2 ? theme.palA : theme.palB
      }));
    } else {
      pals.forEach((pal, i) => {
        pal.homeX = 32 + i * palSpacing;
        pal.y = GROUND_Y - 9;
      });
    }

    bell = { x: W - 54, y: GROUND_Y - 96, r: 21 };
  }

  function startStage() {
    stageIdx = stageQueue.peek();
    if (stageIdx == null) {
      finishGame();
      return;
    }

    currentLevel = ladder[stageIdx];
    const isSentence = Array.isArray(currentLevel.target);
    levelMistakes = 0;
    patienceLeft = currentLevel.patience;
    particles = [];
    floats = [];
    wobbleSlot = -1;
    wobbleT = 0;
    bridgeGlow = 0;
    moveTargetX = null;
    pendingTapAction = null;
    overlay.style.display = "none";

    layoutScene(true);

    phase = "GET_READY";
    phaseTimer = 2.0;
    setBanner(isSentence ? "Build the sentence" : `Build ${String(currentLevel.target).toUpperCase()}`, 1.9);

    elLab.textContent = isSentence ? "Build the sentence" : "Build the word";
    elHear?.setAttribute("aria-label", isSentence ? "Hear the sentence" : "Hear the word");
    syncHearControl();
    elLevel.textContent = String(stageIdx + 1);
    elWorld.textContent = `${theme.name} · ${stageIdx + 1}/${LEVELS_PER_DIFFICULTY}`;
    elStars.textContent = "☆☆☆";
    if (elPatience) elPatience.style.width = "100%";
    layoutHud();
    renderTargetHUD();
    updateActionButton();

    running = true;
    opts.onProgressUpdate?.(wordsDone, ladder.length);
    opts.onCheckpoint?.(stageIdx, LEVELS_PER_DIFFICULTY);
    ensureLoop();
  }

  function showOverlay(title, subtitle, btnText, onClick) {
    overlay.style.display = "grid";
    overlay.innerHTML =
      '<div style="width:min(88vw,490px);display:grid;gap:14px;justify-items:center;padding:28px 24px;color:#f8fbff;text-shadow:0 4px 20px rgba(0,0,0,.72);background:linear-gradient(160deg,rgba(17,27,53,.78),rgba(6,9,22,.82));border:1px solid rgba(255,255,255,.22);clip-path:polygon(22px 0,100% 0,100% calc(100% - 22px),calc(100% - 22px) 100%,0 100%,0 22px);box-shadow:0 22px 52px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.18)">' +
        `<div style="font-size:2.05rem;font-weight:950;line-height:1">${title}</div>` +
        `<div style="font-size:1.02rem;line-height:1.45;color:rgba(255,255,255,.82);max-width:34ch">${subtitle}</div>` +
        `<button id="wb-ov-btn" style="font-family:inherit;font-weight:950;font-size:1.02rem;color:#20140a;background:linear-gradient(160deg,#fff0a8,#ffbd38);border:1px solid rgba(255,255,255,.5);padding:13px 27px;clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);box-shadow:inset 0 -6px 0 rgba(0,0,0,.24);cursor:pointer">${btnText}</button>` +
      "</div>";
    overlay.querySelector("#wb-ov-btn").addEventListener("click", onClick);
  }

  // First-run onboarding: one goal line + the controls (desktop AND touch),
  // shown once per device. The stage stays frozen behind it (GET_READY never
  // ticks while paused) until the child dismisses the card.
  function showOnboarding() {
    overlay.style.display = "grid";
    overlay.innerHTML =
      '<div style="width:min(88vw,490px);display:grid;gap:14px;justify-items:center;padding:28px 24px;color:#f8fbff;text-shadow:0 4px 20px rgba(0,0,0,.72);background:linear-gradient(160deg,rgba(17,27,53,.78),rgba(6,9,22,.82));border:1px solid rgba(255,255,255,.22);clip-path:polygon(22px 0,100% 0,100% calc(100% - 22px),calc(100% - 22px) 100%,0 100%,0 22px);box-shadow:0 22px 52px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.18)">' +
        '<div style="font-size:2.05rem;font-weight:950;line-height:1">Word Bridge</div>' +
        '<div style="font-size:1.02rem;line-height:1.45;color:rgba(255,255,255,.82);max-width:34ch">Carry each letter tile into the gap to build the word bridge, so the pals can cross!</div>' +
        '<ul style="text-align:left;font-size:.95rem;line-height:1.55;color:rgba(255,255,255,.82);margin:0;padding-left:20px;max-width:38ch">' +
          '<li><b>Desktop:</b> Arrow keys or A/D to walk; Space, E, or Enter to pick up and drop tiles.</li>' +
          '<li><b>Touch:</b> the walk buttons and PICK/DROP — or tap a tile, slot, or the bell to walk there.</li>' +
          '<li>Fill every slot, then ring the bell to call the pals across.</li>' +
        '</ul>' +
        '<button id="wb-onboard-btn" style="font-family:inherit;font-weight:950;font-size:1.02rem;color:#20140a;background:linear-gradient(160deg,#fff0a8,#ffbd38);border:1px solid rgba(255,255,255,.5);padding:13px 27px;clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);box-shadow:inset 0 -6px 0 rgba(0,0,0,.24);cursor:pointer">Tap to play</button>' +
      "</div>";
    const btn = overlay.querySelector("#wb-onboard-btn");
    if (btn) btn.focus(); // keyboard kids can dismiss with Enter/Space
    btn.addEventListener("click", () => {
      try { window.localStorage.setItem(ONBOARD_KEY, "1"); } catch { /* storage optional */ }
      overlay.style.display = "none";
      keys.left = keys.right = keys.action = false; // the dismiss tap/key never leaks input
      actionQueued = false;
      actionConsumed = false;
      onboarding = false;
      sfx(playTapSound);
      resume();
    });
  }

  function maybeOnboard() {
    let seen;
    try { seen = window.localStorage.getItem(ONBOARD_KEY) === "1"; } catch { seen = false; }
    if (seen) return;
    onboarding = true; // set BEFORE pause so a chrome resume can't slip past it
    pause();
    showOnboarding();
  }

  function finishGame() {
    phase = "FINISHED";
    const totalStars = stageStars.reduce((sum, stars) => sum + stars, 0);
    const runStars = stageStars.length ? Math.max(1, Math.round(totalStars / stageStars.length)) : 0;
    showOverlay("Cup complete", `Score ${score} · Bridges ${wordsDone}/${ladder.length}`, "Play again", () => {
      overlay.style.display = "none";
      wordsDone = 0;
      score = 0;
      stageStars = [];
      stageQueue = makeCatchUp(ladder.map((_, i) => i));
      opts.onScoreUpdate?.(score);
      startStage();
    });
    opts.onComplete?.(runStars, score, wordsDone);
  }

  function tryAgain(reason = "The bridge needs another try.") {
    phase = "TRY_AGAIN";
    showOverlay("Try again", reason, "Retry bridge", () => {
      overlay.style.display = "none";
      startStage();
    });
  }

  function levelComplete() {
    if (phase === "LEVEL_COMPLETE") return;
    phase = "LEVEL_COMPLETE";
    phaseTimer = 1.8;
    const total = slots.length + levelMistakes;
    const stars = starRubric({ correct: slots.length, total, mistakes: levelMistakes, deaths: 0 });
    stageStars[stageIdx] = stars;
    wordsDone += 1;
    elStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    bridgeGlow = 1.2;
    setBanner("Bridge complete", 1.6);
    sfx(playStarChime);
    stageQueue.complete();
    opts.onScoreUpdate?.(score);
    opts.onProgressUpdate?.(wordsDone, ladder.length);

    window.clearTimeout(levelCompleteTimer);
    levelCompleteTimer = window.setTimeout(() => {
      levelCompleteTimer = 0;
      if (phase === "LEVEL_COMPLETE") startStage();
    }, 1800);
  }

  function hitTestTile(x, y) {
    for (let i = tiles.length - 1; i >= 0; i -= 1) {
      const t = tiles[i];
      if (t.placed || t.lost) continue;
      const left = t.x - t.w / 2 - 8;
      const top = t.y - t.h / 2 - 8;
      if (x >= left && x <= left + t.w + 16 && y >= top && y <= top + t.h + 18) return i;
    }
    return -1;
  }

  function hitTestSlot(x, y) {
    return slots.find(slot =>
      !slot.filled &&
      x >= slot.x - 12 &&
      x <= slot.x + slot.w + 12 &&
      y >= slot.y - 18 &&
      y <= slot.y + slot.h + 30
    ) || null;
  }

  function nearestLooseTile() {
    if (!builder) return -1;
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < tiles.length; i += 1) {
      const t = tiles[i];
      if (t.placed || t.lost) continue;
      const dx = Math.abs(builder.x - t.x);
      const dy = Math.abs(builder.y - t.y);
      const range = Math.max(40, t.w * 0.5 + 22);
      if (dx < range && dy < 58 && dx + dy * 0.2 < bestDist) {
        best = i;
        bestDist = dx + dy * 0.2;
      }
    }
    return best;
  }

  function nearestOpenSlot() {
    if (!builder) return null;
    let best = null;
    let bestDist = Infinity;
    for (const slot of slots) {
      if (slot.filled) continue;
      const center = slot.x + slot.w / 2;
      const dx = Math.abs(builder.x - center);
      const range = Math.max(44, slot.w * 0.5 + 26);
      if (dx < range && dx < bestDist) {
        best = slot;
        bestDist = dx;
      }
    }
    return best;
  }

  function dropCarriedOnGround() {
    if (!builder?.carrying) return;
    const carried = builder.carrying;
    tiles.push({
      ...carried,
      x: clamp(builder.x, 36 + carried.w / 2, W - 36 - carried.w / 2),
      y: GROUND_Y - 29,
      placed: false,
      lost: false,
      bob: Math.random() * Math.PI * 2
    });
    builder.carrying = null;
    sfx(playTapSound);
  }

  function checkOutOfTiles() {
    const remaining = tiles.filter(t => !t.placed && !t.lost && t.correct).length + (builder?.carrying?.correct ? 1 : 0);
    if (remaining === 0 && !slots.every(s => s.filled)) {
      tryAgain("The bridge ran out of the right tiles.");
    }
  }

  function handleAction() {
    if (!builder) return;
    if (phase === "BELL_READY") {
      const d = Math.hypot(builder.x - bell.x, builder.y - bell.y);
      if (d < 76) {
        phase = "PALS_CROSSING";
        bridgeGlow = 1.3;
        setBanner("Pals crossing", 1.2);
        sfx(playCelebrationFanfare);
      } else if (builder.carrying) {
        dropCarriedOnGround();
      }
      return;
    }

    if (phase !== "PLAYING") return;

    if (builder.carrying) {
      const slot = nearestOpenSlot();
      if (!slot) {
        dropCarriedOnGround();
        return;
      }

      const carried = builder.carrying;
      const carriedValue = normalizeGlyph(carried.glyph);
      const neededValue = normalizeGlyph(slot.needed);
      // Match by glyph, not by tile order: with duplicate letters (the two Ts
      // in "tent") either copy may fill any unfilled slot showing that glyph.
      const isRightTile = carried.correct && carriedValue === neededValue;

      if (isRightTile) {
        slot.filled = true;
        slot.placedGlyph = String(carried.glyph);
        slot.snap = 0.42;
        builder.carrying = null;
        score += 35;
        bridgeGlow = 0.42;
        sfx(playCorrectChime);
        emitBurst(slot.x + slot.w / 2, slot.y + 10, theme.light, 12, 0.8);
        addFloat(slot.x + slot.w / 2, slot.y - 10, "+35", theme.light);
        renderTargetHUD();
        if (slots.every(s => s.filled)) {
          phase = "BELL_READY";
          setBanner("Tap the bell", 1.3);
        }
      } else if (carried.correct && carried.order !== slot.order) {
        wobbleSlot = slot.order;
        wobbleT = 0.48;
        levelMistakes += 1;
        sfx(playSoftBuzz);
        addFloat(slot.x + slot.w / 2, slot.y - 10, "later", "#fff4bf");
      } else {
        builder.carrying = null;
        levelMistakes += 1;
        wobbleSlot = slot.order;
        wobbleT = 0.48;
        sfx(playSoftBuzz);
        emitBurst(slot.x + slot.w / 2, GROUND_Y + 8, theme.hazard, 16, 1.1);
        addFloat(slot.x + slot.w / 2, slot.y - 10, "try", "#ffd6c7");
        checkOutOfTiles();
      }
    } else {
      const idx = nearestLooseTile();
      if (idx >= 0) {
        tiles[idx].placed = true;
        builder.carrying = {
          ...tiles[idx],
          sourceIndex: idx
        };
        sfx(playTapSound);
        emitBurst(tiles[idx].x, tiles[idx].y, theme.tile, 6, 0.55);
      }
    }
  }

  function update(dt) {
    if (!currentLevel || !builder) return;
    phaseTimer -= dt;
    updateActionButton();

    if (bannerT > 0) {
      bannerT -= dt;
      if (bannerT <= 0) clearBanner();
    }

    if (phase === "GET_READY") {
      if (phaseTimer <= 0) {
        phase = "PLAYING";
        setBanner("Build the bridge", 1.0);
      }
    }

    if (phase === "PLAYING" || phase === "BELL_READY") {
      builder.anim += dt;
      builder.vx = 0;
      if (keys.left) builder.vx = -builder.speed;
      if (keys.right) builder.vx = builder.speed;

      if (!keys.left && !keys.right && moveTargetX != null) {
        const dx = moveTargetX - builder.x;
        if (Math.abs(dx) < 5) {
          builder.vx = 0;
          moveTargetX = null;
          if (pendingTapAction) {
            handleAction();
            pendingTapAction = null;
            actionConsumed = true;
          }
        } else {
          builder.vx = Math.sign(dx) * Math.min(builder.speed, Math.abs(dx) / Math.max(dt, 0.016));
        }
      }

      if (Math.abs(builder.vx) > 1) builder.facing = builder.vx > 0 ? 1 : -1;
      builder.x += builder.vx * dt;
      builder.x = clamp(builder.x, 18, W - 18);

      if (phase === "PLAYING") {
        patienceLeft = Math.max(0, patienceLeft - dt);
        if (patienceLeft <= 0) {
          // Gentle consequence: the timer refills and the pals drift back to
          // the gap start (progress resets to 0 below). No star penalty, no
          // lost tiles — just a nudge to keep building.
          patienceLeft = currentLevel.patience;
          setBanner("The pals wander back", 1.4);
        }
        const progress = clamp(1 - patienceLeft / Math.max(1, currentLevel.patience), 0, 1);
        const edge = gap.x - 18;
        for (let i = 0; i < pals.length; i += 1) {
          if (pals[i].state !== "waiting") continue;
          const targetX = Math.min(edge - i * 30, pals[i].homeX + progress * (gap.x - 78 - i * 16));
          pals[i].x += (targetX - pals[i].x) * Math.min(1, dt * 1.6);
        }
        if (elPatience) {
          elPatience.style.background = patienceLeft < 6 ? "#ff8a66" : "#ffd34e";
          elPatience.style.width = `${Math.max(0, Math.min(100, (patienceLeft / currentLevel.patience) * 100))}%`;
        }
      }

      if ((keys.action || actionQueued) && !actionConsumed) {
        actionConsumed = true;
        actionQueued = false;
        handleAction();
      }
    }

    if (phase === "PALS_CROSSING") {
      bridgeGlow = Math.max(bridgeGlow, 0.35);
      for (const pal of pals) {
        if (pal.state === "waiting") pal.state = "walking";
        if (pal.state === "walking") {
          pal.t += dt;
          pal.x += pal.speed * dt;
          if (pal.x >= W - 24) {
            pal.state = "crossed";
            score += 12;
            sfx(playPopSound);
            emitBurst(W - 26, pal.y - 10, theme.light, 8, 0.6);
          }
        }
      }
      if (pals.every(p => p.state === "crossed")) levelComplete();
    }

    for (const slot of slots) {
      slot.snap = Math.max(0, slot.snap - dt);
    }
    bridgeGlow = Math.max(0, bridgeGlow - dt * 0.8);
    if (wobbleT > 0) wobbleT -= dt;
    else wobbleSlot = -1;

    for (const f of floats) {
      f.y -= 42 * dt;
      f.life -= dt;
    }
    floats = floats.filter(f => f.life > 0);

    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 190 * dt;
      p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);
  }

  function drawSky() {
    if (imageReady(sceneAssets.background)) {
      const alignX = world === "moonwood" ? 0.5 : 0.58;
      drawCoverImage(ctx, sceneAssets.background.image, 0, 0, W, H, alignX, 0.5);
      const shade = ctx.createLinearGradient(0, 0, 0, H);
      shade.addColorStop(0, "rgba(4,8,18,.05)");
      shade.addColorStop(0.58, "rgba(4,8,18,.02)");
      shade.addColorStop(1, "rgba(4,8,18,.34)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, W, H);

      if (world === "moonwood") {
        ctx.fillStyle = "rgba(255,231,148,.62)";
        for (let i = 0; i < 28; i += 1) {
          const flicker = reduceMotion ? 0.5 : 0.35 + Math.sin(performance.now() * 0.0018 + i) * 0.2;
          ctx.globalAlpha = clamp(flicker, 0.16, 0.7);
          ctx.beginPath();
          ctx.arc((i * 89 + 37) % W, 62 + (i * 53) % Math.max(120, H * 0.62), 1.3 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "rgba(255,255,255,.045)";
      for (let y = 20; y < H; y += 6) ctx.fillRect(0, y, W, 1);
      return;
    }

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, theme.skyTop);
    sky.addColorStop(0.62, theme.skyBottom);
    sky.addColorStop(1, theme.far);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    if (world === "moonwood") {
      ctx.fillStyle = "rgba(230,240,255,.55)";
      ctx.beginPath();
      ctx.arc(W * 0.77, 88, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme.skyTop;
      ctx.beginPath();
      ctx.arc(W * 0.79, 78, 38, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 34; i += 1) {
        ctx.fillStyle = `rgba(225,240,255,${0.15 + (i % 5) * 0.045})`;
        ctx.fillRect((i * 83) % W, 34 + (i * 47) % 180, 2, 2);
      }
    } else {
      const sunX = world === "dino" ? W * 0.76 : W * 0.22;
      const sunY = world === "dino" ? 86 : 76;
      const sun = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 62);
      sun.addColorStop(0, "rgba(255,246,190,.9)");
      sun.addColorStop(0.5, "rgba(255,226,130,.38)");
      sun.addColorStop(1, "rgba(255,226,130,0)");
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 62, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,.08)";
    for (let y = 20; y < H; y += 5) ctx.fillRect(0, y, W, 1);
  }

  function drawMountains() {
    if (imageReady(sceneAssets.background)) return;

    function ridge(base, amp, step, color, offset) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = -step; x <= W + step; x += step) {
        const y = base - Math.abs(Math.sin((x + offset) * 0.014)) * amp - Math.cos((x + offset) * 0.031) * amp * 0.22;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    }
    ridge(GROUND_Y - 118, 64, 56, theme.far, 10);
    ridge(GROUND_Y - 72, 42, 42, theme.mid, 60);

    if (world === "dino") {
      const vx = W * 0.67;
      drawPoly(ctx, [[vx - 82, GROUND_Y - 54], [vx - 20, GROUND_Y - 210], [vx + 38, GROUND_Y - 206], [vx + 112, GROUND_Y - 54]], "#5b3d30");
      drawPoly(ctx, [[vx - 20, GROUND_Y - 205], [vx + 38, GROUND_Y - 205], [vx + 18, GROUND_Y - 178], [vx - 34, GROUND_Y - 178]], "#2b211c");
      ctx.strokeStyle = "rgba(255,105,48,.72)";
      ctx.lineWidth = 5;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(vx - 18 + i * 15, GROUND_Y - 178);
        ctx.bezierCurveTo(vx - 30 + i * 18, GROUND_Y - 136, vx - 8 + i * 11, GROUND_Y - 104, vx - 38 + i * 25, GROUND_Y - 58);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(55,45,40,.28)";
      for (let i = 0; i < 8; i += 1) {
        ctx.beginPath();
        ctx.ellipse(vx - 34 + i * 13, GROUND_Y - 230 - (i % 4) * 8, 34, 12, i * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (world === "meadow") {
      const bx = W * 0.73;
      fillRound(ctx, bx, GROUND_Y - 120, 68, 64, 4, "#b96d42");
      drawPoly(ctx, [[bx - 8, GROUND_Y - 120], [bx + 34, GROUND_Y - 154], [bx + 78, GROUND_Y - 120]], "#7b342a");
      ctx.fillStyle = "rgba(255,241,190,.72)";
      ctx.fillRect(bx + 25, GROUND_Y - 94, 18, 24);
      ctx.strokeStyle = "rgba(255,255,255,.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W * 0.31, GROUND_Y - 142);
      ctx.lineTo(W * 0.31, GROUND_Y - 78);
      ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        ctx.save();
        ctx.translate(W * 0.31, GROUND_Y - 142);
        ctx.rotate(i * Math.PI / 2);
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.fillRect(-3, -34, 6, 32);
        ctx.restore();
      }
    } else {
      ctx.strokeStyle = "rgba(7,11,22,.72)";
      ctx.lineWidth = 7;
      for (let i = 0; i < 20; i += 1) {
        const x = (i * 57) % W;
        const h = 74 + (i % 7) * 22;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y - 36);
        ctx.bezierCurveTo(x - 20, GROUND_Y - 70, x + 26, GROUND_Y - 104, x - 4, GROUND_Y - h);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(142,125,255,.24)";
      for (let i = 0; i < 12; i += 1) {
        ctx.beginPath();
        ctx.ellipse((i * 83) % W, GROUND_Y - 82 - (i % 5) * 18, 18, 28, i * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawGround(now) {
    if (imageReady(sceneAssets.background)) {
      const platformGrad = ctx.createLinearGradient(0, GROUND_Y - 38, 0, H);
      platformGrad.addColorStop(0, theme.ground);
      platformGrad.addColorStop(0.58, theme.groundDark);
      platformGrad.addColorStop(1, "rgba(5,8,12,.94)");

      function drawPlatform(x0, x1, waveOffset) {
        if (x1 <= x0) return;
        ctx.fillStyle = platformGrad;
        ctx.beginPath();
        ctx.moveTo(x0, H);
        ctx.lineTo(x0, GROUND_Y - 25);
        const steps = Math.max(3, Math.round((x1 - x0) / 62));
        for (let i = 0; i <= steps; i += 1) {
          const x = x0 + ((x1 - x0) * i) / steps;
          const y = GROUND_Y - 25 + Math.sin(i * 1.37 + waveOffset) * 5 - (i % 2) * 2;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(x1, H);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = world === "dino" ? "rgba(255,189,92,.42)" : world === "moonwood" ? "rgba(177,227,255,.34)" : "rgba(232,255,183,.44)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i <= steps; i += 1) {
          const x = x0 + ((x1 - x0) * i) / steps;
          const y = GROUND_Y - 27 + Math.sin(i * 1.37 + waveOffset) * 5 - (i % 2) * 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      drawPlatform(0, gap.x, 0.4);
      drawPlatform(gap.x + gap.w, W, 2.1);

      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(0, GROUND_Y - 2, gap.x, 9);
      ctx.fillRect(gap.x + gap.w, GROUND_Y - 2, W - gap.x - gap.w, 9);

      for (let i = 0; i < 22; i += 1) {
        const x = (i * 73 + 19) % W;
        if (x > gap.x - 18 && x < gap.x + gap.w + 18) continue;
        const baseY = GROUND_Y - 23 + Math.sin(now + i) * 2;
        if (world === "dino") {
          ctx.strokeStyle = i % 2 ? "rgba(40,72,31,.72)" : "rgba(82,115,45,.74)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, baseY);
          ctx.quadraticCurveTo(x - 10, baseY - 19, x + 5, baseY - 37 - (i % 3) * 6);
          ctx.stroke();
          ctx.fillStyle = "rgba(42,73,31,.58)";
          for (let leaf = 0; leaf < 3; leaf += 1) {
            ctx.beginPath();
            ctx.ellipse(x + leaf * 7 - 8, baseY - 21 - leaf * 5, 12, 4, -0.45 + leaf * 0.28, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (world === "moonwood") {
          const glow = ctx.createRadialGradient(x, baseY - 8, 1, x, baseY - 8, 22);
          glow.addColorStop(0, "rgba(178,244,255,.34)");
          glow.addColorStop(1, "rgba(178,244,255,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, baseY - 8, 22, 0, Math.PI * 2);
          ctx.fill();
          drawPoly(ctx, [[x - 5, baseY], [x, baseY - 23 - (i % 4) * 4], [x + 8, baseY]], "rgba(181,217,255,.58)");
          ctx.fillStyle = "rgba(236,245,255,.72)";
          ctx.beginPath();
          ctx.ellipse(x + 11, baseY - 9, 9, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = "rgba(51,112,45,.72)";
          ctx.lineWidth = 2;
          for (let blade = 0; blade < 4; blade += 1) {
            ctx.beginPath();
            ctx.moveTo(x + blade * 4, baseY);
            ctx.quadraticCurveTo(x + blade * 3 - 7, baseY - 13, x + blade * 5 - 3, baseY - 25 - (blade % 2) * 4);
            ctx.stroke();
          }
          ctx.fillStyle = i % 3 ? "rgba(255,246,190,.86)" : "rgba(255,184,110,.86)";
          ctx.beginPath();
          ctx.arc(x + 7, baseY - 18, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    const leftGrad = ctx.createLinearGradient(0, GROUND_Y - 32, 0, H);
    leftGrad.addColorStop(0, theme.ground);
    leftGrad.addColorStop(1, theme.groundDark);
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, GROUND_Y - 28, gap.x, H - GROUND_Y + 28);
    ctx.fillRect(gap.x + gap.w, GROUND_Y - 28, W - gap.x - gap.w, H - GROUND_Y + 28);

    ctx.fillStyle = "rgba(255,255,255,.12)";
    for (let x = 0; x < W; x += 36) {
      if (x > gap.x - 10 && x < gap.x + gap.w + 10) continue;
      ctx.fillRect(x, GROUND_Y - 30 + Math.sin(now * 1.2 + x * 0.03) * 2, 20, 3);
    }

    ctx.fillStyle = "rgba(0,0,0,.24)";
    ctx.fillRect(0, GROUND_Y - 2, gap.x, 9);
    ctx.fillRect(gap.x + gap.w, GROUND_Y - 2, W - gap.x - gap.w, 9);

    if (world === "dino") {
      ctx.fillStyle = "rgba(30,45,22,.58)";
      for (let i = 0; i < 14; i += 1) {
        const x = (i * 61) % W;
        if (x > gap.x - 16 && x < gap.x + gap.w + 16) continue;
        ctx.save();
        ctx.translate(x, GROUND_Y - 28);
        ctx.rotate(((i % 5) - 2) * 0.15);
        ctx.fillRect(-3, -30 - (i % 4) * 8, 6, 32 + (i % 4) * 8);
        for (let leaf = 0; leaf < 5; leaf += 1) {
          ctx.rotate(0.55);
          ctx.fillRect(0, -22, 26, 4);
        }
        ctx.restore();
      }
    } else if (world === "moonwood") {
      ctx.fillStyle = "rgba(210,235,255,.42)";
      for (let i = 0; i < 10; i += 1) {
        const x = (i * 97 + 30) % W;
        if (x > gap.x - 20 && x < gap.x + gap.w + 20) continue;
        drawPoly(ctx, [[x, GROUND_Y - 24], [x + 8, GROUND_Y - 56], [x + 17, GROUND_Y - 24]], "rgba(182,210,255,.45)");
      }
    }
  }

  function drawHazard(now) {
    const hx = gap.x;
    const hw = gap.w;
    const hy = GROUND_Y - 28;
    const hh = H - hy;
    if (hw <= 0 || hh <= 0) return;

    function liquidShape(baseY, amp, freq, phase, fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.moveTo(hx, liquidWaveY(hx, baseY, amp, freq, phase));
      for (let x = hx; x <= hx + hw + 8; x += 8) {
        ctx.lineTo(x, liquidWaveY(x, baseY, amp, freq, phase));
      }
      ctx.lineTo(hx + hw, H + 8);
      ctx.lineTo(hx, H + 8);
      ctx.closePath();
      ctx.fill();
    }

    function liquidLine(baseY, amp, freq, phase, strokeStyle, lineWidth = 2) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hx, liquidWaveY(hx, baseY, amp, freq, phase));
      for (let x = hx; x <= hx + hw + 8; x += 8) {
        ctx.lineTo(x, liquidWaveY(x, baseY, amp, freq, phase));
      }
      ctx.stroke();
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(hx, hy - 3, hw, hh + 6);
    ctx.clip();

    if (world === "dino") {
      const base = ctx.createLinearGradient(0, hy, 0, H);
      base.addColorStop(0, "#f35a1c");
      base.addColorStop(0.2, "#aa2312");
      base.addColorStop(0.58, "#4b0b08");
      base.addColorStop(1, "#120102");
      ctx.fillStyle = base;
      ctx.fillRect(hx, hy - 3, hw, hh + 6);

      const coreGlow = ctx.createRadialGradient(hx + hw * 0.5, hy + 44, 8, hx + hw * 0.5, hy + 54, hw * 0.62);
      coreGlow.addColorStop(0, "rgba(255,213,90,.45)");
      coreGlow.addColorStop(0.38, "rgba(255,93,24,.3)");
      coreGlow.addColorStop(1, "rgba(65,4,3,0)");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(hx, hy - 3, hw, hh + 6);

      liquidShape(hy + 12, 6, 0.036, now * 2.6, "rgba(255,87,19,.42)");
      liquidShape(hy + 31, 10, 0.024, -now * 1.7, "rgba(128,23,13,.46)");
      ctx.globalCompositeOperation = "lighter";
      liquidLine(hy + 16, 5, 0.042, now * 3.2, "rgba(255,226,96,.78)", 2.5);
      liquidLine(hy + 47, 8, 0.026, -now * 2.1, "rgba(255,117,28,.56)", 2);

      for (let i = 0; i < 12; i += 1) {
        const streamX = hx + ((i * 47 + now * 32) % (hw + 60)) - 30;
        const streamY = hy + 22 + (i % 5) * 18;
        const len = 34 + (i % 4) * 11;
        ctx.strokeStyle = i % 3 === 0 ? "rgba(255,244,143,.74)" : "rgba(255,123,31,.58)";
        ctx.lineWidth = i % 3 === 0 ? 3 : 2;
        ctx.shadowColor = "rgba(255,108,22,.86)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(streamX, streamY);
        ctx.bezierCurveTo(streamX + 18, streamY - 8, streamX + len * 0.5, streamY + 12, streamX + len, streamY + 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < 8; i += 1) {
        const x = hx + ((i * 59 - now * 22) % (hw + 70)) - 35;
        const y = hy + 40 + (i % 4) * 32 + Math.sin(now * 1.6 + i) * 5;
        ctx.fillStyle = "rgba(39,12,9,.54)";
        ctx.beginPath();
        ctx.ellipse(x, y, 19 + (i % 3) * 5, 7 + (i % 2) * 3, Math.sin(i) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,151,41,.34)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      for (let i = 0; i < 10; i += 1) {
        const bubbleY = hy + 82 - ((now * (20 + i * 3) + i * 31) % Math.max(70, hh + 30));
        const bubbleX = hx + ((i * 41 + Math.sin(now + i) * 18) % hw);
        const r = 3 + (i % 4);
        ctx.strokeStyle = "rgba(255,220,116,.58)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (world === "moonwood") {
      const base = ctx.createLinearGradient(0, hy, 0, H);
      base.addColorStop(0, "#7b6dff");
      base.addColorStop(0.28, "#4b3a9f");
      base.addColorStop(0.7, "#16152d");
      base.addColorStop(1, "#070711");
      ctx.fillStyle = base;
      ctx.fillRect(hx, hy - 3, hw, hh + 6);

      const portal = ctx.createRadialGradient(hx + hw * 0.5, hy + 40, 5, hx + hw * 0.5, hy + 44, hw * 0.68);
      portal.addColorStop(0, "rgba(190,247,255,.62)");
      portal.addColorStop(0.42, "rgba(143,125,255,.42)");
      portal.addColorStop(1, "rgba(18,15,38,0)");
      ctx.fillStyle = portal;
      ctx.fillRect(hx, hy - 3, hw, hh + 6);

      ctx.globalCompositeOperation = "lighter";
      liquidShape(hy + 13, 5, 0.033, now * 2.1, "rgba(184,239,255,.38)");
      liquidShape(hy + 30, 8, 0.024, -now * 1.6, "rgba(143,125,255,.34)");
      liquidLine(hy + 17, 4, 0.046, now * 2.8, "rgba(230,248,255,.62)", 2);
      liquidLine(hy + 52, 7, 0.027, -now * 2, "rgba(182,154,255,.5)", 2);

      for (let i = 0; i < 20; i += 1) {
        const x = hx + ((i * 37 + now * 18) % hw);
        const y = hy + 18 + ((i * 43 - now * 26) % Math.max(80, hh));
        const alpha = 0.22 + (i % 5) * 0.08;
        ctx.fillStyle = `rgba(238,249,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + (i % 3) * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 8; i += 1) {
        const x = hx + ((i * 61 - now * 16) % (hw + 50)) - 25;
        ctx.strokeStyle = "rgba(204,244,255,.25)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, hy + 10);
        ctx.bezierCurveTo(x - 22, hy + 52, x + 34, hy + 78, x - 8, H + 10);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    } else {
      const base = ctx.createLinearGradient(0, hy, 0, H);
      base.addColorStop(0, "#53d6e7");
      base.addColorStop(0.24, "#1884a8");
      base.addColorStop(0.66, "#0b4f72");
      base.addColorStop(1, "#06273c");
      ctx.fillStyle = base;
      ctx.fillRect(hx, hy - 3, hw, hh + 6);

      const shine = ctx.createRadialGradient(hx + hw * 0.42, hy + 24, 2, hx + hw * 0.42, hy + 28, hw * 0.65);
      shine.addColorStop(0, "rgba(206,255,255,.55)");
      shine.addColorStop(0.38, "rgba(99,209,231,.22)");
      shine.addColorStop(1, "rgba(6,39,60,0)");
      ctx.fillStyle = shine;
      ctx.fillRect(hx, hy - 3, hw, hh + 6);

      liquidShape(hy + 12, 5, 0.041, now * 2.2, "rgba(194,253,255,.26)");
      liquidShape(hy + 29, 8, 0.026, -now * 1.5, "rgba(59,185,214,.34)");
      liquidLine(hy + 15, 5, 0.044, now * 3.1, "rgba(240,255,255,.66)", 2);
      liquidLine(hy + 45, 6, 0.031, -now * 2.3, "rgba(159,239,255,.32)", 1.8);

      ctx.strokeStyle = "rgba(220,255,255,.28)";
      ctx.lineWidth = 1.3;
      for (let y = hy + 34; y < H; y += 20) {
        ctx.beginPath();
        for (let x = hx; x <= hx + hw + 8; x += 10) {
          const yy = y + Math.sin(x * 0.042 + now * 2.2 + y * 0.08) * 3;
          if (x === hx) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      for (let i = 0; i < 11; i += 1) {
        const x = hx + ((i * 43 + now * 24) % hw);
        const y = hy + 28 + (i % 4) * 26;
        ctx.fillStyle = "rgba(246,255,255,.5)";
        ctx.beginPath();
        ctx.ellipse(x, y + Math.sin(now * 2 + i) * 3, 12 + (i % 3) * 4, 2.2, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const vignette = ctx.createLinearGradient(0, hy, 0, H);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.4)");
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = vignette;
    ctx.fillRect(hx, hy, hw, hh);
    ctx.restore();

    const rimGlow = world === "dino"
      ? "rgba(255,174,50,.72)"
      : world === "moonwood"
        ? "rgba(190,235,255,.54)"
        : "rgba(209,255,255,.56)";
    ctx.strokeStyle = "rgba(0,0,0,.34)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(hx + 3, hy + 2);
    ctx.lineTo(hx + hw - 3, hy + 2);
    ctx.stroke();
    liquidLine(hy + 7, 3, 0.048, now * 2.6, rimGlow, 2.5);
  }

  function drawSlots() {
    if (!slots.length) return;
    const bridgeTop = slots[0].y;
    const bridgeBottom = bridgeTop + KEY_HEIGHT;
    const bridgeMid = bridgeTop + KEY_HEIGHT * 0.54;
    const glowAlpha = bridgeGlow > 0 ? Math.min(0.42, bridgeGlow * 0.36) : 0;
    if (glowAlpha) {
      ctx.fillStyle = `rgba(255,230,116,${glowAlpha})`;
      ctx.fillRect(gap.x + 6, bridgeTop + 2, gap.w - 12, KEY_HEIGHT);
    }

    ctx.fillStyle = "rgba(0,0,0,.26)";
    ctx.beginPath();
    ctx.ellipse(gap.x + gap.w / 2, bridgeBottom + 14, gap.w * 0.47, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    const deckGrad = ctx.createLinearGradient(0, bridgeTop - 6, 0, bridgeBottom + 20);
    deckGrad.addColorStop(0, world === "dino" ? "rgba(75,42,24,.88)" : world === "moonwood" ? "rgba(38,47,82,.86)" : "rgba(31,72,75,.84)");
    deckGrad.addColorStop(0.52, world === "dino" ? "rgba(47,24,18,.9)" : world === "moonwood" ? "rgba(18,22,44,.9)" : "rgba(12,42,54,.9)");
    deckGrad.addColorStop(1, "rgba(4,6,12,.88)");
    drawPoly(ctx, [
      [Math.max(0, gap.x - 36), bridgeTop + 9],
      [gap.x + gap.w + 36, bridgeTop + 5],
      [gap.x + gap.w + 18, bridgeBottom + 18],
      [gap.x - 18, bridgeBottom + 22]
    ], deckGrad);
    ctx.strokeStyle = "rgba(255,255,255,.13)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.max(0, gap.x - 31), bridgeTop + 12);
    ctx.lineTo(gap.x + gap.w + 30, bridgeTop + 8);
    ctx.stroke();

    ctx.strokeStyle = world === "dino" ? "rgba(255,187,58,.42)" : world === "moonwood" ? "rgba(200,238,255,.34)" : "rgba(219,255,255,.38)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let rail = 0; rail < 2; rail += 1) {
      const y = bridgeTop + 7 + rail * 32;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, gap.x - 34), y);
      ctx.lineTo(gap.x + gap.w + 34, y + (rail ? 4 : -3));
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    const filledSlots = slots.filter(slot => slot.filled);
    for (let i = 0; i < filledSlots.length - 1; i += 1) {
      const a = filledSlots[i];
      const b = filledSlots[i + 1];
      const connectorX = a.x + a.w - 2;
      const connectorW = b.x - connectorX + 2;
      if (connectorW <= 0 || connectorW > 34) continue;
      const connectorGrad = ctx.createLinearGradient(0, bridgeTop + 8, 0, bridgeBottom);
      connectorGrad.addColorStop(0, "#ffe99a");
      connectorGrad.addColorStop(1, theme.tileEdge);
      fillChamfer(ctx, connectorX, bridgeTop + 13, connectorW, KEY_HEIGHT - 17, 4, connectorGrad);
      fillChamfer(ctx, connectorX, bridgeBottom - 8, connectorW, 8, 2, "rgba(55,31,12,.24)");
    }

    for (let i = 0; i < slots.length; i += 1) {
      const s = slots[i];
      const isWobble = wobbleSlot === i && wobbleT > 0;
      const dx = isWobble ? Math.sin(wobbleT * 44) * 4 : 0;
      const snapY = s.snap > 0 ? -Math.sin(s.snap * Math.PI * 6) * s.snap * 5 : 0;
      ctx.save();
      ctx.translate(dx, snapY);

      if (s.filled) {
        const tileGrad = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
        tileGrad.addColorStop(0, "#fff4b4");
        tileGrad.addColorStop(0.36, theme.tile);
        tileGrad.addColorStop(0.72, theme.tileEdge);
        tileGrad.addColorStop(1, "rgba(74,42,16,.88)");
        fillChamfer(ctx, s.x - 1, s.y + 9, s.w + 3, s.h - 1, 9, "rgba(58,30,10,.55)");
        fillChamfer(ctx, s.x, s.y, s.w, s.h - 5, 9, tileGrad);
        fillChamfer(ctx, s.x + 5, s.y + 5, s.w - 10, 8, 4, "rgba(255,255,255,.38)");
        fillChamfer(ctx, s.x + 6, s.y + s.h - 16, s.w - 12, 6, 3, "rgba(54,31,12,.24)");
        strokeChamfer(ctx, s.x, s.y, s.w, s.h - 5, 9, "rgba(60,35,15,.56)", 2.4);
        ctx.fillStyle = "rgba(75,43,14,.28)";
        ctx.beginPath();
        ctx.arc(s.x + 8, s.y + 9, 2, 0, Math.PI * 2);
        ctx.arc(s.x + s.w - 8, s.y + 9, 2, 0, Math.PI * 2);
        ctx.fill();
        const glyph = s.placedGlyph || s.needed;
        const glyphSize = s.w > 74
          ? clamp((s.w - 12) / Math.max(String(glyph).length, 4) * 1.55, 14, 21)
          : 24;
        ctx.fillStyle = "#21180d";
        ctx.font = `950 ${glyphSize}px Fredoka, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(255,247,196,.62)";
        ctx.strokeText(glyph, s.x + s.w / 2, s.y + (s.h - 6) / 2 + 2, s.w - 8);
        ctx.fillText(glyph, s.x + s.w / 2, s.y + (s.h - 6) / 2 + 2, s.w - 8);
      } else {
        const wellGrad = ctx.createLinearGradient(0, s.y + 4, 0, s.y + s.h + 4);
        wellGrad.addColorStop(0, "rgba(255,255,255,.12)");
        wellGrad.addColorStop(0.48, "rgba(4,7,16,.26)");
        wellGrad.addColorStop(1, "rgba(0,0,0,.36)");
        fillChamfer(ctx, s.x, s.y + 7, s.w, s.h - 5, 9, wellGrad);
        strokeChamfer(ctx, s.x, s.y + 7, s.w, s.h - 5, 9, "rgba(255,255,255,.34)", 2);
        ctx.fillStyle = world === "dino" ? "rgba(255,213,112,.32)" : world === "moonwood" ? "rgba(224,242,255,.32)" : "rgba(240,255,255,.35)";
        fillChamfer(ctx, s.x + 6, s.y + 12, s.w - 12, 4, 2, ctx.fillStyle);
        ctx.fillStyle = "rgba(255,255,255,.4)";
        const glyph = s.needed;
        const glyphSize = s.w > 74
          ? clamp((s.w - 12) / Math.max(String(glyph).length, 4) * 1.42, 13, 19)
          : 20;
        ctx.font = `950 ${glyphSize}px Fredoka, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(glyph, s.x + s.w / 2, s.y + s.h / 2 + 5, s.w - 8);
      }
      ctx.restore();
    }

    ctx.strokeStyle = "rgba(0,0,0,.22)";
    ctx.lineWidth = 2;
    for (let x = gap.x + 18; x < gap.x + gap.w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, bridgeTop + 8);
      ctx.lineTo(x + 14, bridgeBottom + 1);
      ctx.stroke();
    }

    const edgeGrad = ctx.createLinearGradient(0, bridgeMid - 6, 0, bridgeMid + 18);
    edgeGrad.addColorStop(0, "rgba(255,255,255,.16)");
    edgeGrad.addColorStop(0.58, "rgba(255,255,255,.03)");
    edgeGrad.addColorStop(1, "rgba(0,0,0,.16)");
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(gap.x + 2, bridgeMid - 7, gap.w - 4, 26);
  }

  function drawTile(t, now, carried = false) {
    const bob = carried ? 0 : Math.sin(now * 2 + t.bob) * 1.5;
    const x = carried ? t.x : t.x - t.w / 2;
    const y = carried ? t.y : t.y - t.h / 2 + bob;
    ctx.save();
    ctx.translate(0, carried ? Math.sin(now * 8) * 1.5 : 0);
    ctx.fillStyle = "rgba(0,0,0,.24)";
    ctx.beginPath();
    ctx.ellipse(x + t.w / 2, y + t.h + 7, t.w * 0.42, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = carried ? "rgba(255,221,95,.46)" : "rgba(0,0,0,.28)";
    ctx.shadowBlur = carried ? 14 : 8;
    ctx.shadowOffsetY = carried ? 2 : 4;
    const grad = ctx.createLinearGradient(0, y, 0, y + t.h);
    grad.addColorStop(0, "#fff1a5");
    grad.addColorStop(0.44, theme.tile);
    grad.addColorStop(0.76, theme.tileEdge);
    grad.addColorStop(1, "rgba(74,42,16,.88)");
    fillChamfer(ctx, x, y, t.w, t.h, 10, grad);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    fillChamfer(ctx, x + 5, y + 5, t.w - 10, 8, 4, "rgba(255,255,255,.4)");
    fillChamfer(ctx, x + 6, y + t.h - 12, t.w - 12, 6, 3, "rgba(54,31,12,.24)");
    strokeChamfer(ctx, x, y, t.w, t.h, 10, "rgba(62,38,12,.56)", 2.4);
    strokeChamfer(ctx, x + 3, y + 3, t.w - 6, t.h - 6, 7, "rgba(255,255,255,.22)", 1.2);
    ctx.fillStyle = "#21180d";
    const glyph = String(t.glyph);
    const glyphSize = t.w > 74
      ? clamp((t.w - 12) / Math.max(glyph.length, 4) * 1.55, 14, 21)
      : 25;
    ctx.font = `950 ${glyphSize}px Fredoka, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,247,196,.68)";
    ctx.strokeText(glyph, x + t.w / 2, y + t.h / 2 + 1, t.w - 8);
    ctx.fillText(glyph, x + t.w / 2, y + t.h / 2 + 1, t.w - 8);
    ctx.restore();
  }

  function drawTiles(now) {
    for (const t of tiles) {
      if (t.placed || t.lost) continue;
      drawTile(t, now);
    }
  }

  function drawBuilder(now) {
    if (!builder) return;
    const walking = Math.abs(builder.vx) > 8 && (phase === "PLAYING" || phase === "BELL_READY");
    const bob = walking && !reduceMotion ? Math.sin(builder.anim * 13) * 3 : 0;
    const x = builder.x;
    const y = builder.y + bob;

    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y - 8, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (imageReady(sceneAssets.helper)) {
      const img = sceneAssets.helper.image;
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const sourceH = ih * 0.94;
      const drawH = clamp(H * 0.2, 78, 108);
      const drawW = drawH * (iw / sourceH);
      const footY = GROUND_Y - 1 + bob * 0.28;

      ctx.save();
      ctx.translate(x, 0);
      ctx.scale(builder.facing < 0 ? -1 : 1, 1);
      ctx.shadowColor = "rgba(0,0,0,.34)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(img, 0, 0, iw, sourceH, -drawW / 2, footY - drawH, drawW, drawH);
      ctx.restore();

      if (builder.carrying) {
        drawTile({
          ...builder.carrying,
          x: x - builder.carrying.w / 2,
          y: footY - drawH - 44,
          h: KEY_HEIGHT
        }, now, true);
      }
      return;
    }

    ctx.strokeStyle = theme.builderTrim;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 23);
    ctx.lineTo(x - 13 + Math.sin(builder.anim * 10) * 4, GROUND_Y - 5);
    ctx.moveTo(x + 7, y + 23);
    ctx.lineTo(x + 13 - Math.sin(builder.anim * 10) * 4, GROUND_Y - 5);
    ctx.stroke();

    const bodyGrad = ctx.createLinearGradient(0, y - 6, 0, y + 36);
    bodyGrad.addColorStop(0, theme.builder);
    bodyGrad.addColorStop(1, theme.builderTrim);
    fillRound(ctx, x - builder.w / 2, y - 4, builder.w, builder.h, 8, bodyGrad);
    fillRound(ctx, x - builder.w / 2 + 5, y + 2, builder.w - 10, 6, 4, "rgba(255,255,255,.28)");

    ctx.strokeStyle = theme.builderTrim;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 7);
    ctx.lineTo(x - 20 * builder.facing, y + 14);
    ctx.moveTo(x + 9, y + 7);
    ctx.lineTo(x + 14 * builder.facing, y + 19);
    ctx.stroke();

    ctx.fillStyle = "#ffe2ad";
    ctx.beginPath();
    ctx.arc(x, y - 12, 10, 0, Math.PI * 2);
    ctx.fill();
    fillRound(ctx, x - 13, y - 24, 26, 9, 5, theme.builderTrim);
    drawPoly(ctx, [[x + 8 * builder.facing, y - 24], [x + 24 * builder.facing, y - 20], [x + 8 * builder.facing, y - 18]], theme.builderTrim);
    ctx.fillStyle = "#2a2216";
    ctx.beginPath();
    ctx.arc(x + 4 * builder.facing, y - 12, 2, 0, Math.PI * 2);
    ctx.fill();

    if (builder.carrying) {
      drawTile({
        ...builder.carrying,
        x: x - builder.carrying.w / 2,
        y: y - 74,
        h: KEY_HEIGHT
      }, now, true);
    }
  }

  function drawPal(pal, index, now) {
    if (pal.state === "crossed") return;
    const bob = Math.sin(now * 5 + index) * 2;
    const x = pal.x;
    const y = pal.y + bob;
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y - 4, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (imageReady(sceneAssets.pals)) {
      const img = sceneAssets.pals.image;
      const frameCount = 4;
      const frameW = (img.naturalWidth || img.width) / frameCount;
      const frameH = img.naturalHeight || img.height;
      const frame = pal.state === "walking"
        ? Math.floor(now * 8 + index) % frameCount
        : index % frameCount;
      const drawH = clamp(H * 0.1, 44, 58);
      const drawW = drawH * (frameW / frameH);
      const footY = GROUND_Y - 2 + bob * 0.25;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.24)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(
        img,
        frame * frameW,
        0,
        frameW,
        frameH,
        x - drawW / 2,
        footY - drawH,
        drawW,
        drawH
      );
      ctx.restore();
      return;
    }

    if (world === "dino") {
      ctx.fillStyle = pal.color;
      ctx.beginPath();
      ctx.ellipse(x, y - 8, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 9, y - 13, 6, 0, Math.PI * 2);
      ctx.fill();
      drawPoly(ctx, [[x - 12, y - 9], [x - 22, y - 16], [x - 14, y - 4]], pal.color);
      ctx.fillStyle = theme.light;
      ctx.beginPath();
      ctx.arc(x + 11, y - 14, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (world === "moonwood") {
      ctx.fillStyle = pal.color;
      ctx.beginPath();
      ctx.arc(x, y - 11, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.beginPath();
      ctx.arc(x - 4, y - 13, 2, 0, Math.PI * 2);
      ctx.arc(x + 4, y - 13, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 3);
      ctx.lineTo(x - 13, y + 4);
      ctx.moveTo(x + 8, y - 3);
      ctx.lineTo(x + 13, y + 4);
      ctx.stroke();
    } else {
      ctx.fillStyle = pal.color;
      ctx.beginPath();
      ctx.ellipse(x, y - 10, 13, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2c2a23";
      ctx.beginPath();
      ctx.arc(x + 9, y - 12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2c2a23";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 2);
      ctx.lineTo(x - 7, y + 6);
      ctx.moveTo(x + 5, y - 2);
      ctx.lineTo(x + 5, y + 6);
      ctx.stroke();
    }
  }

  function drawPals(now, crossingOnly = false) {
    for (let i = 0; i < pals.length; i += 1) {
      const isCrossing = pals[i].state === "walking";
      if (crossingOnly !== isCrossing) continue;
      drawPal(pals[i], i, now);
    }
  }

  function drawBell(now) {
    if (phase !== "BELL_READY" && phase !== "PALS_CROSSING") return;
    const pulse = phase === "BELL_READY" && !reduceMotion ? Math.sin(now * 6) * 4 : 0;
    ctx.strokeStyle = "rgba(255,255,255,.32)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bell.x, bell.y + 22);
    ctx.lineTo(bell.x, GROUND_Y - 24);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(bell.x, bell.y + 26, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createRadialGradient(bell.x - 5, bell.y - 6, 4, bell.x, bell.y, bell.r + 12 + pulse);
    grad.addColorStop(0, "#fff4b8");
    grad.addColorStop(0.58, "#ffd34e");
    grad.addColorStop(1, "rgba(255,211,78,.18)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bell.x, bell.y, bell.r + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#20140a";
    ctx.font = "950 11px Fredoka, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TAP", bell.x, bell.y - 2);
  }

  function drawEffects() {
    for (const p of particles) {
      const alpha = clamp(p.life / p.ttl, 0, 1);
      ctx.fillStyle = p.color.replace(")", `,${alpha})`).replace("rgb(", "rgba(");
      if (!ctx.fillStyle.startsWith("rgba")) ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const f of floats) {
      const alpha = clamp(f.life / f.ttl, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color;
      ctx.font = "950 17px Fredoka, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.txt, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawPhaseOverlay() {
    if (phase === "GET_READY") {
      const label = phaseTimer > 1.2 ? "3" : phaseTimer > 0.55 ? "2" : "1";
      ctx.fillStyle = "rgba(5,8,18,.24)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffffff";
      ctx.font = `950 ${Math.min(110, W * 0.18)}px Fredoka, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(255,211,78,.75)";
      ctx.shadowBlur = 24;
      ctx.fillText(label, W / 2, H * 0.43);
      ctx.shadowBlur = 0;
    } else if (phase === "LEVEL_COMPLETE") {
      ctx.fillStyle = "rgba(255,211,78,.08)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawPostFx(now) {
    ctx.save();
    const tone = ctx.createLinearGradient(0, 0, W, H);
    tone.addColorStop(0, world === "dino" ? "rgba(255,136,48,.08)" : world === "moonwood" ? "rgba(120,122,255,.09)" : "rgba(95,220,255,.06)");
    tone.addColorStop(0.58, "rgba(255,255,255,0)");
    tone.addColorStop(1, "rgba(0,0,0,.2)");
    ctx.fillStyle = tone;
    ctx.fillRect(0, 0, W, H);

    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.47, Math.min(W, H) * 0.24, W * 0.5, H * 0.5, Math.max(W, H) * 0.68);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.72, "rgba(0,0,0,.1)");
    vignette.addColorStop(1, "rgba(0,0,0,.38)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "rgba(255,255,255,.18)";
    for (let y = (Math.floor(now * 20) % 4); y < H; y += 4) {
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = "rgba(0,0,0,.42)";
    for (let x = 0; x < W; x += 3) {
      ctx.fillRect(x, 0, 1, H);
    }
    ctx.restore();
  }

  function render() {
    syncHearControl();
    const now = performance.now() * 0.001;
    ctx.clearRect(0, 0, W, H);
    if (!currentLevel || !builder) return;
    drawSky();
    drawMountains();
    drawHazard(now);
    drawGround(now);
    drawPals(now, false);
    drawSlots();
    drawPals(now, true);
    drawTiles(now);
    drawBell(now);
    drawBuilder(now);
    drawEffects();
    drawPostFx(now);
    drawPhaseOverlay();
  }

  function ensureLoop() {
    if (rafId) return;
    last = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function loop(ts) {
    if (!running) {
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(((ts - last) || 16) / 1000, 0.05);
    last = ts;
    if (!paused) update(dt);
    render();
  }

  function pause() {
    paused = true;
  }

  function resume() {
    if (!paused || onboarding) return;
    paused = false;
    last = performance.now();
    ensureLoop();
  }

  function teardown() {
    running = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
    // Cancel the level-complete timer too, or it fires after unmount and
    // restarts the render loop on a detached canvas.
    window.clearTimeout(levelCompleteTimer);
    levelCompleteTimer = 0;
    cancelSpeech();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    ro.disconnect();
    mount.innerHTML = "";
  }

  startStage();
  maybeOnboard(); // first run only: freeze the stage behind the how-to card

  return { teardown, pause, resume };
}
