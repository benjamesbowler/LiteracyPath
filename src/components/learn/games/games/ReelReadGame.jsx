import { useEffect, useRef } from "react";
import {
  playCelebrationFanfare,
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playTapSound
} from "../../../../utils/audio/gameSfx.js";
import {
  reelReadExpectedWord,
  reelReadAssembledWord,
  reelReadCanAcceptWord,
  reelReadLadder,
  reelReadMatches,
  reelReadResponseEvidence,
  reelReadStars
} from "../../../../utils/reelReadLevels.js";
import { hasRecordedSpeech } from "../../../../utils/learnGamesAudio.js";
import { getLedaWordAudioPath } from "../../../../data/ledaProductionAudio.js";
import { playCueAudio, stopCueAudio } from "../../../../utils/audio/cuePlayer.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import { isPrimaryActionKey, laneDirectionForKey } from "../shared/premiumGameStandard.js";

const THEMES = {
  meadow: {
    name: "Meadow Pond",
    world: "meadow",
    bg: "/images/learn-games/reel-read/meadow-pond.webp",
    waterTop: 0.42,
    waterA: "#2fc8d9",
    waterB: "#0a6384",
    panel: "rgba(8, 34, 51, .78)",
    accent: "#ffd34e",
    accent2: "#53e0ff",
    deep: "#063348",
    horizon: "rgba(26, 104, 79, .38)",
    foreground: "rgba(5, 55, 42, .56)",
    glow: "rgba(255, 221, 114, .2)"
  },
  dino: {
    name: "Fossil Lagoon",
    world: "dino",
    bg: "/images/learn-games/reel-read/dino-lagoon.webp",
    waterTop: 0.43,
    waterA: "#23bfae",
    waterB: "#174b52",
    panel: "rgba(42, 22, 12, .78)",
    accent: "#ffbd38",
    accent2: "#ff7043",
    deep: "#31150c",
    horizon: "rgba(86, 45, 25, .42)",
    foreground: "rgba(54, 28, 15, .6)",
    glow: "rgba(255, 121, 54, .22)"
  },
  moonwood: {
    name: "Moonwood Lake",
    world: "moonwood",
    bg: "/images/learn-games/reel-read/moonwood-lake.webp",
    waterTop: 0.43,
    waterA: "#285fd8",
    waterB: "#101b55",
    panel: "rgba(12, 16, 45, .82)",
    accent: "#c9b8ff",
    accent2: "#7df2ff",
    deep: "#080d29",
    horizon: "rgba(52, 54, 126, .44)",
    foreground: "rgba(9, 14, 52, .68)",
    glow: "rgba(136, 196, 255, .18)"
  }
};

const BOAT_SRC = "/images/learn-games/reel-read/angler-boat.webp";
const FISH_SRC = "/images/learn-games/reel-read/fish-gold.webp";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundRect(ctx, x, y, w, h, r) {
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

function fillRound(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

function strokeRound(ctx, x, y, w, h, r, stroke, lineWidth = 1) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
}

function drawCover(ctx, image, x, y, w, h, alignX = 0.5, alignY = 0.5) {
  const iw = image?.naturalWidth || image?.width || 0;
  const ih = image?.naturalHeight || image?.height || 0;
  if (!iw || !ih || !w || !h) return false;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = clamp((iw - sw) * alignX, 0, Math.max(0, iw - sw));
  const sy = clamp((ih - sh) * alignY, 0, Math.max(0, ih - sh));
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  return true;
}

function loadImage(src, onReady) {
  const image = new Image();
  const asset = { image, ready: false, failed: false };
  image.decoding = "async";
  image.onload = () => {
    asset.ready = true;
    onReady?.();
  };
  image.onerror = () => {
    asset.failed = true;
    onReady?.();
  };
  image.src = src;
  return asset;
}

function textWidthFor(ctx, text, maxWidth, startSize, minSize = 13) {
  let size = startSize;
  do {
    ctx.font = `950 ${size}px Fredoka, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  } while (size >= minSize);
  return minSize;
}

function rotate(values, amount) {
  if (!values.length) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function isActionKey(key) {
  return isPrimaryActionKey(key) || key === "ArrowDown";
}

// First-run onboarding is remembered per device; storage can be denied
// (private mode), in which case the intro simply shows again next session.
const ONBOARD_KEY = "lp-arcade-onboarded-v1:reel-read";

function readOnboarded() {
  try {
    return window.localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return false;
  }
}

function markOnboarded() {
  try {
    window.localStorage.setItem(ONBOARD_KEY, "1");
  } catch {
    /* onboarding is optional */
  }
}

export default function ReelReadGame({
  difficulty = "easy",
  startLevel = 0,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onResultReady,
  onSessionStart,
  onCheckpoint,
  onEngineReady,
  isSoundEnabled = true
}) {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const soundRef = useRef(isSoundEnabled);

  useEffect(() => {
    soundRef.current = isSoundEnabled;
    engineRef.current?.refreshSoundState?.();
  }, [isSoundEnabled]);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const api = startGame(mountRef.current, {
      difficulty,
      startLevel,
      onScoreUpdate,
      onProgressUpdate,
      onComplete,
      onResultReady,
      onSessionStart,
      onCheckpoint,
      getSound: () => soundRef.current
    });
    engineRef.current = api;
    onEngineReady?.(api);
    return () => {
      if (engineRef.current === api) engineRef.current = null;
      api.teardown();
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
        minHeight: "480px",
        overflow: "hidden",
        background: "#06101d",
        touchAction: "none"
      }}
    />
  );
}

function startGame(mount, opts) {
  const difficulty = ["easy", "medium", "hard"].includes(String(opts.difficulty)) ? String(opts.difficulty) : "easy";
  const ladder = reelReadLadder(difficulty);
  const startAt = clamp(Number(opts.startLevel) || 0, 0, ladder.length - 1);
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%";
  mount.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const targets = document.createElement("div");
  targets.style.cssText = "position:absolute;inset:0;z-index:4;pointer-events:none";
  mount.appendChild(targets);

  const controls = document.createElement("div");
  controls.style.cssText = "position:absolute;inset:0;z-index:5;pointer-events:none";
  controls.innerHTML =
    '<div style="position:absolute;left:18px;bottom:18px;display:flex;gap:10px;pointer-events:auto">' +
      '<button data-rr="left" aria-label="Move left" style="width:62px;height:58px;border:1px solid rgba(255,255,255,.26);background:rgba(4,11,25,.58);color:white;font-size:1.55rem;font-weight:950;backdrop-filter:blur(4px);border-radius:8px;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 10px 24px rgba(0,0,0,.28)">&#9664;</button>' +
      '<button data-rr="right" aria-label="Move right" style="width:62px;height:58px;border:1px solid rgba(255,255,255,.26);background:rgba(4,11,25,.58);color:white;font-size:1.55rem;font-weight:950;backdrop-filter:blur(4px);border-radius:8px;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 10px 24px rgba(0,0,0,.28)">&#9654;</button>' +
    '</div>' +
    '<button data-rr="replay" type="button" aria-label="Hear the target word again" style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);width:168px;min-width:96px;min-height:66px;padding:10px 18px;pointer-events:auto;border:2px solid rgba(255,255,255,.62);background:rgba(4,11,25,.78);color:#ffffff;font-family:var(--kid-font-display,Fredoka,sans-serif);font-weight:950;font-size:1rem;line-height:1.15;letter-spacing:.02em;border-radius:8px;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 24px rgba(0,0,0,.32);cursor:pointer">Hear word again</button>' +
      '<button data-rr="cast" type="button" aria-label="Cast at the selected fish" style="position:absolute;right:18px;bottom:18px;width:108px;height:66px;pointer-events:auto;border:1px solid rgba(255,255,255,.55);background:linear-gradient(160deg,#fff2a8,#ffc43d 55%,#d97a1e);color:#211606;font-family:var(--kid-font-display,Fredoka,sans-serif);font-weight:950;font-size:.95rem;letter-spacing:.04em;border-radius:8px;box-shadow:inset 0 -8px 0 rgba(0,0,0,.24),0 14px 26px rgba(0,0,0,.28);cursor:pointer">CAST</button>';
  mount.appendChild(controls);

  const statusEl = document.createElement("div");
  statusEl.dataset.rr = "status";
  statusEl.setAttribute("aria-live", "polite");
  statusEl.style.cssText = "position:absolute;left:50%;bottom:91px;transform:translateX(-50%);z-index:6;max-width:calc(100% - 230px);min-height:28px;padding:7px 13px;border-radius:999px;background:rgba(3,10,24,.78);border:1px solid rgba(255,255,255,.3);color:#fff;font:800 15px/1.2 Fredoka,Arial,sans-serif;text-align:center;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
  mount.appendChild(statusEl);

  const resultEl = document.createElement("div");
  resultEl.dataset.rr = "result";
  resultEl.style.cssText = `position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;padding:18px;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif)`;
  resultEl.innerHTML = `<div style="width:min(480px,calc(100% - 24px));padding:20px;border-radius:14px;background:${THEMES.meadow.panel};border:1px solid rgba(255,255,255,.3);box-shadow:0 20px 55px rgba(0,0,0,.42);text-align:center;pointer-events:auto"><div data-rr="result-title" style="color:#ffd34e;font-size:1.4rem;font-weight:950"></div><div data-rr="result-assembly" style="margin:12px 0 16px;color:#fff;font-size:1.12rem;line-height:1.35;font-weight:850"></div><button data-rr="next" type="button" style="min-width:150px;min-height:56px;padding:10px 18px;border:2px solid #ffd34e;border-radius:10px;background:#ffd34e;color:#211606;font:950 1rem Fredoka,Arial,sans-serif;cursor:pointer"></button></div>`;
  mount.appendChild(resultEl);
  const resultTitle = resultEl.querySelector('[data-rr="result-title"]');
  const resultAssembly = resultEl.querySelector('[data-rr="result-assembly"]');
  const btnNext = resultEl.querySelector('[data-rr="next"]');

  const btnLeft = controls.querySelector('[data-rr="left"]');
  const btnRight = controls.querySelector('[data-rr="right"]');
  const btnReplay = controls.querySelector('[data-rr="replay"]');
  const btnCast = controls.querySelector('[data-rr="cast"]');

  let w = 0;
  let h = 0;
  let waterTop = 0;
  let rafId = 0;
  let lastTime = 0;
  let running = true;
  let paused = false;
  // First-run intro overlay: independent of the chrome pause so GamePlayer's
  // resume can't unpause gameplay behind the overlay. update() halts on either.
  let introOpen = false;
  let introEl = null;
  let score = 0;
  let levelIndex = startAt;
  let level = ladder[levelIndex];
  let theme = THEMES[level.world] || THEMES.meadow;
  let caught = [];
  let wordsCaught = 0;
  let mistakes = 0;
  let stageStars = [];
  let phase = "countdown";
  let phaseTimer = 3.2;
  let banner = "";
  let bannerTimer = 0;
  let fish = [];
  let bursts = [];
  let floaters = [];
  let spawnSeed = 1;
  let activePointer = null;
  let selectedFishId = null;
  let lockedFishId = null;
  let targetButtons = new Map();
  let finalised = false;
  let cueDelivery = "pending";
  let cueHistory = [];
  let cueSerial = 0;
  let firstResponses = [];
  let assistedRetries = [];
  let responseAttempts = new Map();
  let resultReceipt = null;
  const keys = { left: false, right: false, cast: false };
  const boat = {
    x: 0,
    targetX: null,
    bob: 0,
    speed: 290,
    casting: false,
    hookX: 0,
    hookY: 0,
    hookMaxY: 0,
    hookState: "ready",
    caughtFish: null
  };

  const images = {
    bg: loadImage(theme.bg, render),
    boat: loadImage(BOAT_SRC, render),
    fish: loadImage(FISH_SRC, render)
  };

  function sfx(fn) {
    try {
      if (opts.getSound?.()) fn();
    } catch {
      /* sound is optional */
    }
  }

  function setCueDelivery(type) {
    cueDelivery = type;
    cueHistory = [...new Set([...cueHistory, type])];
    statusEl.dataset.cueDelivery = type;
    mount.dataset.rrCueDelivery = type;
  }

  function stopTargetCue(next = "interrupted") {
    cueSerial += 1;
    stopCueAudio();
    if (["loading", "started"].includes(cueDelivery)) setCueDelivery(next);
  }

  function speakCue(word = level.target) {
    if (introOpen) return;
    if (!opts.getSound?.()) {
      setCueDelivery("muted");
      return;
    }
    const text = String(word || level.target);
    const src = hasRecordedSpeech(text) ? getLedaWordAudioPath(text) : "";
    stopTargetCue("interrupted");
    if (!src) {
      setCueDelivery("unavailable");
      statusEl.dataset.support = "printed_target";
      return;
    }
    const serial = ++cueSerial;
    setCueDelivery("loading");
    playCueAudio(src, {
      cueId: `reel-read:${difficulty}:${levelIndex}:${text}`,
      playImmediately: true,
      onDelivery: event => {
        if (serial !== cueSerial) return;
        setCueDelivery(event.type);
        if (event.type === "failed" || event.type === "unavailable") {
          statusEl.dataset.support = "printed_target";
          setStatus("The recording did not finish. Use the printed target.");
        }
        if (event.type === "interrupted") setStatus("Audio stopped. The printed target stays available.");
      }
    });
  }

  function refreshSoundState() {
    const enabled = Boolean(opts.getSound?.());
    if (!enabled) {
      if (["loading", "started"].includes(cueDelivery)) stopTargetCue("muted");
      setCueDelivery("muted");
    }
    const compact = w > 0 && w < 560;
    btnReplay.disabled = !enabled;
    btnReplay.setAttribute("aria-disabled", String(!enabled));
    btnReplay.setAttribute("aria-label", enabled ? `Hear ${level.target} again` : "Word replay unavailable while sound is off");
    btnReplay.textContent = enabled ? (compact ? "Hear word" : "Hear word again") : (compact ? "Sound off" : "Sound is off");
    btnReplay.style.cursor = enabled ? "pointer" : "not-allowed";
    btnReplay.style.opacity = enabled ? "1" : ".68";
    refreshCastControl();
  }

  function refreshCastControl() {
    const isCasting = boat.hookState !== "ready";
    const canCast = phase === "playing" && boat.hookState === "ready" && Boolean(selectedFishId);
    btnCast.disabled = !canCast && !isCasting;
    btnCast.setAttribute("aria-disabled", String(btnCast.disabled));
    btnCast.textContent = isCasting ? "CANCEL" : "CAST";
    btnCast.setAttribute("aria-label", isCasting ? "Cancel cast" : canCast ? "Cast at the selected fish" : "Choose a fish before casting");
    btnCast.style.cursor = btnCast.disabled ? "not-allowed" : "pointer";
    btnCast.style.opacity = btnCast.disabled ? ".62" : "1";
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function responseEvidence(item, correct) {
    const key = `${levelIndex}:${item.word}`;
    const attempts = (responseAttempts.get(key) || 0) + 1;
    responseAttempts.set(key, attempts);
    const evidence = reelReadResponseEvidence({
      difficulty,
      levelIndex,
      target: level.target,
      response: item.word,
      correct,
      attempts,
      fishId: item.id,
      audioDelivery: cueDelivery,
      cueHistory,
      supportUsed: ["printed_target", "named_fish_label"],
      soundEnabled: Boolean(opts.getSound?.())
    });
    if (attempts === 1) firstResponses.push(evidence);
    else assistedRetries.push(Object.freeze({
      ...evidence,
      practiceOnly: true,
      independent: false,
      supportUsed: Object.freeze([...evidence.supportUsed, "specific_fish_feedback", "retry_same_target"])
    }));
    mount.dataset.rrFirstResponses = String(firstResponses.length);
    mount.dataset.rrAssistedRetries = String(assistedRetries.length);
  }

  function receiptForFinalLevel(stars) {
    return Object.freeze({
      stars,
      score,
      words: wordsCaught,
      evidence: Object.freeze({
        practiceOnly: true,
        independent: false,
        target: level.target,
        levelId: `reel-read-${difficulty}-${levelIndex}`,
        phase: "level-complete",
        audioDelivery: cueDelivery,
        cueHistory: Object.freeze([...cueHistory]),
        firstResponses: Object.freeze([...firstResponses]),
        assistedRetries: Object.freeze([...assistedRetries])
      })
    });
  }

  function layoutReplayControl() {
    const compact = w < 560;
    const crowded = w < 375;
    btnReplay.style.width = compact && !crowded ? "96px" : "168px";
    btnReplay.style.left = compact && !crowded ? "calc(50% + 13px)" : "50%";
    btnReplay.style.bottom = crowded ? "96px" : "18px";
    btnReplay.style.padding = compact ? "6px" : "10px 18px";
    refreshSoundState();
  }

  function resize() {
    w = mount.clientWidth || 800;
    h = mount.clientHeight || 520;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    waterTop = h * theme.waterTop;
    boat.x = boat.x || w * 0.5;
    boat.x = clamp(boat.x, 78, w - 78);
    layoutReplayControl();
    // Compact landscape/portrait layouts use the selected border and CAST/CANCEL
    // label as the visible feedback; keep the live status available to assistive
    // technology without placing a text pill over the named fish.
    statusEl.style.display = w < 700 ? "none" : "block";
    refreshCastControl();
    render();
  }

  function getBoatMetrics(time = performance.now() / 1000) {
    const boatW = clamp(w * 0.26, 170, 320);
    const boatH = boatW * 0.6;
    const boatY = waterTop + 18 + Math.sin(time * 2.1) * 4;
    return { boatW, boatH, boatY };
  }

  function getRodTip(time = performance.now() / 1000) {
    const { boatW, boatH, boatY } = getBoatMetrics(time);
    return {
      x: boat.x + boatW * 0.535,
      y: boatY - boatH * 0.768
    };
  }

  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  resize();

  function remainingWords() {
    if (level.orderMatters) return level.correctWords.slice(caught.length);
    return level.correctWords.filter(word => !caught.includes(word));
  }

  function activeWords() {
    return new Set(fish.filter(item => item.x > -36 && item.x < w + 36).map(item => item.word));
  }

  function pickFrom(values, avoid = new Set()) {
    const available = values.filter(value => !avoid.has(value));
    const bank = available.length ? available : values;
    const word = bank[spawnSeed % bank.length];
    spawnSeed += 1;
    return word;
  }

  function makeFish(forceCorrect = false, lane = 0, forcedWord = null) {
    const avoid = activeWords();
    const remaining = remainingWords();
    const shouldCorrect = forceCorrect || (remaining.length && Math.random() < 0.36);
    const wasForced = Boolean(forcedWord);
    let word = forcedWord;
    if (word) spawnSeed += 1;
    else {
      word = shouldCorrect
        ? pickFrom(rotate(remaining, spawnSeed), avoid)
        : pickFrom(rotate(level.distractors, spawnSeed * 3), avoid);
    }
    if (avoid.has(word)) word = pickFrom(rotate(level.distractors, spawnSeed * 5), avoid);
    const correct = reelReadMatches(word, level);
    const dir = (spawnSeed + lane) % 2 === 0 ? 1 : -1;
    const laneCount = Math.max(4, level.visibleFish - 1);
    const top = waterTop + 78;
    const bottom = h - clamp(h * 0.18, 108, 150);
    const y = clamp(top + (lane + 0.35 + Math.random() * 0.45) * ((bottom - top) / laneCount), top, bottom);
    const size = 0.74 + Math.random() * 0.1;
    const initialX = clamp(((lane + 1) / (level.visibleFish + 1)) * w + (Math.random() - 0.5) * 80, 120, w - 120);
    const forcedX = dir > 0 ? 96 + lane * 18 : w - 96 - lane * 18;
    const entryX = dir > 0
      ? -110 - lane * 118 - Math.random() * 80
      : w + 110 + lane * 118 + Math.random() * 80;
    return {
      id: `${word}-${spawnSeed}-${Math.random().toString(16).slice(2)}`,
      word,
      correct,
      x: wasForced && phase !== "countdown" ? forcedX : phase === "countdown" ? initialX : entryX,
      y,
      vx: dir * level.fishSpeed * (0.78 + Math.random() * 0.42),
      scale: size,
      lane,
      wobble: Math.random() * Math.PI * 2,
      flash: 0
    };
  }

  function refillFish() {
    const targetCount = Math.max(4, level.visibleFish);
    while (fish.length < targetCount) {
      const currentCorrect = fish.filter(item => item.correct).length;
      const remainingCorrect = remainingWords().length;
      const lane = fish.length % Math.max(4, targetCount);
      const expected = reelReadExpectedWord(level, caught);
      const forcedWord = expected && !activeWords().has(expected) ? expected : null;
      fish.push(makeFish(forcedWord || currentCorrect < Math.min(level.correctVisible, remainingCorrect), lane, forcedWord));
    }
  }

  function syncFishTargets(time = performance.now() / 1000) {
    const visible = new Set();
    const placed = [];
    const playableTop = waterTop + (w < 375 ? 18 : 48);
    const playableBottom = Math.max(playableTop, h - (w < 375 ? 260 : 150));
    fish.forEach((item, index) => {
      if (item.x < -80 || item.x > w + 80) return;
      visible.add(item.id);
      const compactTarget = w < 700;
      let width = compactTarget ? 56 : clamp(28 + item.word.length * 9, 56, Math.min(122, Math.max(56, w - 20)));
      const compactColumn = compactTarget ? index % 5 : 0;
      const compactRow = 0;
      let x = compactTarget
        ? 10 + compactColumn * ((w - 20) / 5) + (w - 20) / 10
        : clamp(item.x, width / 2 + 6, w - width / 2 - 6);
      let y = compactTarget
        ? clamp(playableTop + compactRow * 64, playableTop, playableBottom)
        : clamp(item.y + Math.sin(item.wobble + time * 2.5) * 4, playableTop, playableBottom);
      for (const previous of compactTarget ? [] : placed) {
        if (Math.abs(x - previous.x) < (width + previous.width) / 2 + 8 && Math.abs(y - previous.y) < 62) {
          y = previous.y + 62;
          if (y > playableBottom) {
            y = playableBottom;
            x = clamp(x + width / 2 + previous.width / 2 + 10, width / 2 + 6, w - width / 2 - 6);
          }
        }
      }
      placed.push({ x, y, width });
      let button = targetButtons.get(item.id);
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.dataset.rr = "fish";
        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          nominateFish(item.id);
        });
        targetButtons.set(item.id, button);
        targets.appendChild(button);
      }
      button.textContent = item.word;
      button.dataset.fishId = item.id;
      button.setAttribute("aria-label", `Choose fish ${item.word}`);
      button.setAttribute("aria-pressed", String(selectedFishId === item.id));
      button.disabled = phase !== "playing" || boat.hookState !== "ready";
      button.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);width:${width}px;min-height:56px;padding:7px 6px;z-index:1;pointer-events:auto;border:3px solid ${selectedFishId === item.id ? theme.accent : "rgba(20,36,47,.72)"};border-radius:12px;background:${selectedFishId === item.id ? "rgba(255,245,180,.98)" : "rgba(255,248,211,.96)"};color:#17212a;font:950 ${item.word.length > 8 ? 13 : 16}px/1.05 Fredoka,Arial,sans-serif;box-shadow:${selectedFishId === item.id ? `0 0 0 5px ${theme.accent}66,0 8px 20px rgba(0,0,0,.35)` : "0 7px 18px rgba(0,0,0,.25)"};cursor:${button.disabled ? "not-allowed" : "pointer"};opacity:${button.disabled ? ".62" : "1"};touch-action:manipulation`;
    });
    for (const [id, button] of targetButtons) {
      if (!visible.has(id)) {
        button.remove();
        targetButtons.delete(id);
      }
    }
  }

  function startLevel(nextIndex) {
    levelIndex = clamp(nextIndex, 0, ladder.length - 1);
    level = ladder[levelIndex];
    theme = THEMES[level.world] || THEMES.meadow;
    images.bg = loadImage(theme.bg, render);
    waterTop = h * theme.waterTop;
    caught = [];
    mistakes = 0;
    fish = [];
    bursts = [];
    floaters = [];
    spawnSeed = levelIndex * 37 + (difficulty === "hard" ? 700 : difficulty === "medium" ? 300 : 0);
    boat.x = clamp(w * 0.48, 78, w - 78);
    boat.targetX = null;
    boat.hookState = "ready";
    boat.caughtFish = null;
    selectedFishId = null;
    lockedFishId = null;
    responseAttempts = new Map();
    stopTargetCue("interrupted");
    phase = "countdown";
    phaseTimer = 3.2;
    banner = level.prompt;
    bannerTimer = 4.1;
    refillFish();
    opts.onProgressUpdate?.(levelIndex + 1, ladder.length);
    opts.onCheckpoint?.(levelIndex, ladder.length);
    refreshSoundState();
    resultEl.style.display = "none";
    targets.style.display = "block";
    setCueDelivery(opts.getSound?.() ? "pending" : "muted");
    setStatus("Get ready to choose a fish.");
    speakCue(level.target);
    render();
  }

  function completeLevel() {
    phase = "level-complete";
    phaseTimer = 0;
    // Ladders here have only 2-3 targets, where one slip used to cost two
    // whole stars; forgive the first mistake on those small ladders.
    const gradedMistakes = level.correctWords.length <= 3 ? Math.max(0, mistakes - 1) : mistakes;
    const stars = reelReadStars({ correct: caught.length, total: caught.length + gradedMistakes, mistakes: gradedMistakes });
    stageStars[levelIndex] = stars;
    score += 80 + stars * 60;
    opts.onScoreUpdate?.(score);
    opts.onProgressUpdate?.(levelIndex + 1, ladder.length);
    sfx(playStarChime);
    banner = stars === 3 ? "Perfect catch" : "Pond cleared";
    bannerTimer = 1.8;
    if (levelIndex >= ladder.length - 1 && !resultReceipt) {
      resultReceipt = receiptForFinalLevel(stars);
      resultEl.dataset.resultReady = "true";
      resultEl.dataset.firstResponses = String(firstResponses.length);
      resultEl.dataset.assistedRetries = String(assistedRetries.length);
      opts.onResultReady?.(resultReceipt.stars, resultReceipt.score, resultReceipt.words, resultReceipt.evidence);
    }
    targets.style.display = "none";
    resultTitle.textContent = stars === 3 ? "Perfect catch!" : "Pond cleared!";
    resultAssembly.textContent = level.orderMatters
      ? `${caught.join(" + ")} = ${reelReadAssembledWord(level, caught)}`
      : `You caught ${caught.join(", ")} — words that match ${level.target}.`;
    btnNext.textContent = levelIndex >= ladder.length - 1 ? "FINISH TRIP" : "NEXT LEVEL";
    resultEl.querySelector("div").style.background = theme.panel;
    resultEl.style.display = "flex";
    refreshCastControl();
  }

  function finishGame() {
    if (finalised) return;
    finalised = true;
    phase = "finished";
    resultEl.style.display = "none";
    targets.style.display = "none";
    setStatus("Fishing trip complete.");
    refreshCastControl();
    const finalReceipt = resultReceipt || receiptForFinalLevel(stageStars[levelIndex] || 1);
    sfx(playCelebrationFanfare);
    opts.onComplete?.(finalReceipt.stars, finalReceipt.score, finalReceipt.words, finalReceipt.evidence);
  }

  function requestCast() {
    if (boat.hookState !== "ready") {
      cancelCast();
      return;
    }
    if (phase !== "playing" || !selectedFishId) {
      setStatus("Choose a fish first.");
      return;
    }
    const target = fish.find(item => item.id === selectedFishId);
    if (!target) {
      selectedFishId = null;
      setStatus("That fish swam away. Choose another fish.");
      return;
    }
    const tip = getRodTip();
    lockedFishId = target.id;
    sfx(playTapSound);
    boat.hookState = "dropping";
    boat.hookX = target.x;
    boat.hookY = tip.y;
    boat.hookMaxY = h - 58;
    boat.caughtFish = null;
    setStatus(`Casting at ${target.word}.`);
    refreshCastControl();
  }

  function cancelCast() {
    if (boat.hookState === "ready") return;
    boat.hookState = "ready";
    boat.caughtFish = null;
    lockedFishId = null;
    setStatus(selectedFishId ? "Cast cancelled. Cast again when ready." : "Cast cancelled. Choose a fish.");
    refreshCastControl();
  }

  function nominateFish(id) {
    if (phase !== "playing" || boat.hookState !== "ready") return;
    const item = fish.find(candidate => candidate.id === id);
    if (!item) return;
    selectedFishId = item.id;
    setStatus(`Selected ${item.word}. Press CAST.`);
    speakCue(item.word);
    refreshCastControl();
    render();
  }

  function catchFish(item) {
    boat.caughtFish = item;
    boat.hookState = "returning";
    const correct = reelReadCanAcceptWord(item.word, level, caught);
    responseEvidence(item, correct);
    if (correct) {
      fish = fish.filter(f => f !== item);
      caught.push(item.word);
      wordsCaught += 1;
      score += 120;
      addBurst(item.x, item.y, theme.accent, 14);
      addFloater(item.x, item.y - 28, `+ ${item.word}`, "#fff7b8");
      sfx(playCorrectChime);
      speakCue(item.word);
      opts.onScoreUpdate?.(score);
      if (caught.length >= level.correctWords.length) completeLevel();
    } else {
      // Release the wrong fish back instead of removing it, and name what's needed.
      item.vx = -item.vx;
      const needed = level.orderMatters
        ? `You need ${reelReadExpectedWord(level, caught)} first`
        : `Need: ${remainingWords().join(", ")}`;
      mistakes += 1;
      score = Math.max(0, score - 25);
      addBurst(item.x, item.y, "rgba(255,92,92,.86)", 10);
      addFloater(item.x, item.y - 28, needed, "#ffd0d0");
      sfx(playSoftBuzz);
      opts.onScoreUpdate?.(score);
    }
    selectedFishId = null;
    lockedFishId = null;
    setStatus(correct ? `${item.word} fits!` : `Try again: ${item.word} is not the next match.`);
    refreshCastControl();
    refillFish();
  }

  function addBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i += 1) {
      bursts.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 210,
        vy: -40 - Math.random() * 120,
        r: 2 + Math.random() * 4,
        color,
        life: 0.55 + Math.random() * 0.3,
        ttl: 0.75
      });
    }
  }

  function addFloater(x, y, text, color) {
    floaters.push({ x, y, text, color, life: 1, ttl: 1 });
  }

  function showIntro() {
    introOpen = true;
    introEl = document.createElement("div");
    introEl.setAttribute("role", "dialog");
    introEl.setAttribute("aria-modal", "true");
    introEl.setAttribute("aria-label", "How to play Reel & Read");
    // Static card (no animated intro) so prefers-reduced-motion is respected.
    introEl.style.cssText =
      "position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(3,8,18,.68);cursor:pointer;font-family:var(--kid-font-display,Fredoka,sans-serif)";
    introEl.innerHTML =
      `<div style="max-width:min(440px,88%);background:${theme.panel};border:1px solid rgba(255,255,255,.24);border-radius:12px;padding:22px 26px;text-align:center;box-shadow:0 18px 46px rgba(0,0,0,.45)">` +
        `<div style="color:${theme.accent};font-weight:950;font-size:1.35rem;letter-spacing:.03em">Reel &amp; Read</div>` +
        '<p style="color:#ffffff;font-weight:800;font-size:1rem;margin:10px 0 0;line-height:1.4">Steer the boat and hook the fish with the right words!</p>' +
        '<div style="margin-top:14px;display:grid;gap:8px;text-align:left;color:rgba(255,255,255,.92);font-weight:700;font-size:.86rem;line-height:1.45">' +
          '<span>Choose a named fish, then cast at that fish.</span>' +
          '<span>Steer: Arrow keys or A / D, drag on the pond, or hold the &#9664; &#9654; buttons.</span>' +
          '<span>Cancel a cast any time without losing a reading try.</span>' +
        '</div>' +
        `<button type="button" style="margin-top:18px;border:2px solid ${theme.accent};border-radius:10px;background:rgba(255,255,255,.08);color:${theme.accent};padding:9px 20px;font:inherit;font-weight:950;font-size:1.05rem;letter-spacing:.04em;cursor:pointer">Tap to play</button>` +
        '<div style="margin-top:6px;color:rgba(255,255,255,.72);font-weight:700;font-size:.74rem">or press Enter</div>' +
      '</div>';
    const startButton = introEl.querySelector("button");
    startButton?.addEventListener("pointerdown", event => {
      event.stopPropagation();
    });
    startButton?.addEventListener("click", event => {
      event.preventDefault();
      dismissIntro();
    });
    introEl.addEventListener("pointerdown", event => {
      event.preventDefault();
      dismissIntro();
    });
    mount.appendChild(introEl);
  }

  function dismissIntro() {
    if (!introOpen) return;
    introOpen = false;
    markOnboarded();
    if (introEl) {
      introEl.remove();
      introEl = null;
    }
    // The dismissing tap/key must not steer or cast on the first live frame.
    keys.left = false;
    keys.right = false;
    keys.cast = false;
    boat.targetX = null;
    activePointer = null;
    lastTime = performance.now();
    speakCue(level.target);
  }

  function update(dt) {
    if (paused || introOpen) return;
    boat.bob += dt;
    if (bannerTimer > 0) bannerTimer = Math.max(0, bannerTimer - dt);

    if (phase === "countdown") {
      phaseTimer -= dt;
      if (phaseTimer <= 0) {
        phase = "playing";
        banner = level.prompt;
        bannerTimer = 2.2;
        setStatus("Choose a fish, then cast.");
        refreshCastControl();
      }
    }

    const left = keys.left ? 1 : 0;
    const right = keys.right ? 1 : 0;
    const axis = right - left;
    if (axis) {
      boat.targetX = null;
      boat.x += axis * boat.speed * dt;
    } else if (boat.targetX != null) {
      const diff = boat.targetX - boat.x;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), boat.speed * dt);
      boat.x += step;
      if (Math.abs(diff) < 4) boat.targetX = null;
    }
    boat.x = clamp(boat.x, 78, w - 78);
    fish.forEach(item => {
      item.x += item.vx * dt;
      if (item.x < 72) {
        item.x = 72;
        item.vx = Math.abs(item.vx);
      } else if (item.x > w - 72) {
        item.x = w - 72;
        item.vx = -Math.abs(item.vx);
      }
      item.wobble += dt * 4;
      item.flash = Math.max(0, item.flash - dt);
    });
    // Cull band must exceed the farthest spawn entryX (~±780px), otherwise
    // entering fish are deleted the frame they spawn and refillFish churns.
    fish = fish.filter(item => item.x > -900 && item.x < w + 900);
    refillFish();

    if (boat.hookState === "dropping") {
      boat.hookY += level.hookSpeed * dt;
      const item = fish.find(candidate => candidate.id === lockedFishId);
      if (!item) {
        cancelCast();
      } else {
        // The nominated ID owns this cast. Other moving fish can never steal it.
        boat.hookX = item.x;
        const ry = Math.abs(item.y - boat.hookY);
        if (ry < 34 * item.scale) catchFish(item);
      }
      if (boat.hookY >= boat.hookMaxY && boat.hookState === "dropping") {
        boat.hookState = "returning";
        sfx(playPopSound);
      }
    } else if (boat.hookState === "returning") {
      const tip = getRodTip();
      boat.hookX += (tip.x - boat.hookX) * clamp(dt * 7, 0, 1);
      boat.hookY -= level.hookSpeed * 1.25 * dt;
      if (boat.hookY <= tip.y + 4) {
        boat.hookState = "ready";
        boat.caughtFish = null;
        refreshCastControl();
      }
    }

    bursts.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.life -= dt;
    });
    bursts = bursts.filter(p => p.life > 0);
    floaters.forEach(p => {
      p.y -= 34 * dt;
      p.life -= dt;
    });
    floaters = floaters.filter(p => p.life > 0);
  }

  function drawFallbackBackground(time) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, theme.world === "moonwood" ? "#101b55" : "#83d8ff");
    sky.addColorStop(0.42, theme.world === "dino" ? "#e99b4e" : "#dff6ff");
    sky.addColorStop(1, theme.waterB);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = theme.world === "dino" ? "#426338" : theme.world === "moonwood" ? "#1d2a66" : "#73b964";
    for (let i = 0; i < 8; i += 1) {
      const x = (i * 173 + Math.sin(time + i) * 18) % (w + 140) - 70;
      ctx.beginPath();
      ctx.arc(x, waterTop - 8 + (i % 3) * 10, 90 + (i % 4) * 30, Math.PI, 0);
      ctx.fill();
    }
  }

  function drawSceneParallax(time) {
    const sway = (boat.x / Math.max(1, w) - 0.5) * 36;
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = theme.horizon;
    for (let ridge = 0; ridge < 3; ridge += 1) {
      const baseY = waterTop - 42 - ridge * 34;
      const offset = -sway * (0.18 + ridge * 0.12) + Math.sin(time * 0.18 + ridge) * 10;
      ctx.beginPath();
      ctx.moveTo(-60, waterTop + 18);
      for (let x = -60; x <= w + 100; x += 95) {
        const peak = baseY - Math.sin((x + ridge * 71) * 0.018 + time * 0.08) * (16 + ridge * 7) - (x % 190 === 0 ? 22 : 0);
        ctx.lineTo(x + offset, peak);
      }
      ctx.lineTo(w + 100, waterTop + 20);
      ctx.closePath();
      ctx.globalAlpha = 0.23 - ridge * 0.045;
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(w * 0.5, waterTop * 0.2, 10, w * 0.5, waterTop * 0.22, Math.max(w, h) * 0.65);
    glow.addColorStop(0, theme.glow);
    glow.addColorStop(0.62, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, waterTop + 90);
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = theme.accent2;
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const x = ((i * 239 + time * 14) % (w + 260)) - 130;
      ctx.beginPath();
      ctx.moveTo(x - sway * 0.3, waterTop * 0.16);
      ctx.lineTo(x + 64 - sway * 0.08, waterTop + 44);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWaterSurface(time) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 2; i += 1) {
      ctx.globalAlpha = 0.38 - i * 0.12;
      ctx.strokeStyle = i === 0 ? "rgba(248,255,255,.82)" : theme.accent2;
      ctx.lineWidth = i === 0 ? 3 : 1.5;
      ctx.beginPath();
      for (let x = -30; x <= w + 30; x += 14) {
        const y = waterTop + Math.sin(x * 0.02 + time * 2.2 + i) * (3 + i * 2) + Math.sin(x * 0.051 - time * 1.5) * 1.8;
        if (x === -30) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWater(time) {
    const gradient = ctx.createLinearGradient(0, waterTop, 0, h);
    gradient.addColorStop(0, `${theme.waterA}cc`);
    gradient.addColorStop(0.55, `${theme.waterB}dd`);
    gradient.addColorStop(1, theme.deep);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, waterTop, w, h - waterTop);

    if (reduceMotion) return;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let row = 0; row < 14; row += 1) {
      const y = waterTop + 18 + row * ((h - waterTop) / 14);
      const alpha = 0.12 - row * 0.005;
      ctx.strokeStyle = `rgba(224,255,255,${Math.max(0.03, alpha)})`;
      ctx.lineWidth = row % 3 === 0 ? 2 : 1;
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 18) {
        const yy = y + Math.sin(x * 0.021 + time * 1.7 + row) * (3 + row * 0.12);
        if (x === -20) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 42; i += 1) {
      const x = (i * 157 + time * (18 + (i % 5) * 5)) % (w + 90) - 45;
      const y = waterTop + 38 + ((i * 83) % Math.max(1, h - waterTop - 80));
      const alpha = 0.05 + (i % 4) * 0.018;
      ctx.strokeStyle = `rgba(210,255,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 18, y + Math.sin(time + i) * 5, x + 54, y + Math.cos(time * 0.7 + i) * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBoatReflection(time) {
    const boatW = clamp(w * 0.26, 170, 320);
    const boatH = boatW * 0.32;
    const y = waterTop + 48 + Math.sin(time * 2.1) * 3;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.globalCompositeOperation = "multiply";
    const reflection = ctx.createRadialGradient(boat.x, y, 12, boat.x, y, boatW * 0.55);
    reflection.addColorStop(0, "rgba(0,0,0,.6)");
    reflection.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = reflection;
    ctx.beginPath();
    ctx.ellipse(boat.x + 4, y, boatW * 0.54, boatH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawForeground(time) {
    ctx.save();
    ctx.fillStyle = theme.foreground;
    ctx.globalAlpha = 0.82;
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 97 - time * 18) % (w + 140) - 70;
      const base = h + 8;
      const height = 44 + (i % 5) * 14;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x + 8, base - height * 0.55, x + 2 + Math.sin(time + i) * 8, base - height);
      ctx.quadraticCurveTo(x + 18, base - height * 0.48, x + 18, base);
      ctx.closePath();
      ctx.fill();
    }
    const dark = ctx.createLinearGradient(0, h - 120, 0, h);
    dark.addColorStop(0, "rgba(0,0,0,0)");
    dark.addColorStop(1, "rgba(0,0,0,.42)");
    ctx.fillStyle = dark;
    ctx.fillRect(0, h - 120, w, 120);
    ctx.restore();
  }

  function drawHud() {
    const found = caught.length;
    const panelW = Math.min(560, w - 36);
    const panelH = level.orderMatters ? 122 : 98;
    fillRound(ctx, 18, 16, panelW, panelH, 8, theme.panel);
    strokeRound(ctx, 18, 16, panelW, panelH, 8, "rgba(255,255,255,.18)", 1.5);
    ctx.fillStyle = theme.accent;
    ctx.font = "950 18px Fredoka, Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(`LEVEL ${levelIndex + 1}`, 34, 28);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${w < 620 ? "800 17px" : "900 22px"} Fredoka, Arial, sans-serif`;
    ctx.fillText(level.prompt, 34, 52, panelW - 32);
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.font = "800 15px Fredoka, Arial, sans-serif";
    ctx.fillText(level.cue, 34, 79, panelW - 32);

    if (level.orderMatters) {
      let slotX = 34;
      const slotY = 103;
      level.correctWords.forEach((part, index) => {
        const filled = caught[index];
        const label = filled || `${index + 1}`;
        const slotW = clamp(42 + part.length * 13, 58, 126);
        fillRound(ctx, slotX, slotY, slotW, 25, 7, filled ? "rgba(255,245,180,.95)" : "rgba(255,255,255,.16)");
        strokeRound(ctx, slotX, slotY, slotW, 25, 7, filled ? theme.accent : "rgba(255,255,255,.26)", 1.5);
        ctx.fillStyle = filled ? "#1e2330" : "rgba(255,255,255,.72)";
        ctx.font = "950 15px Fredoka, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, slotX + slotW / 2, slotY + 13, slotW - 10);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        slotX += slotW + 7;
      });
    }

    const rightW = w < 700 ? 174 : 220;
    fillRound(ctx, w - rightW - 18, 16, rightW, 78, 8, theme.panel);
    strokeRound(ctx, w - rightW - 18, 16, rightW, 78, 8, "rgba(255,255,255,.18)", 1.5);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 15px Fredoka, Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${theme.name}`, w - 34, 29);
    ctx.fillStyle = theme.accent;
    ctx.font = "950 24px Fredoka, Arial, sans-serif";
    ctx.fillText(`${found}/${level.correctWords.length}`, w - 34, 54);
    ctx.textAlign = "left";

    const barX = 34;
    const barY = 16 + panelH + 10;
    const barW = Math.min(380, w - 68);
    fillRound(ctx, barX, barY, barW, 10, 5, "rgba(255,255,255,.18)");
    fillRound(ctx, barX, barY, barW * (found / level.correctWords.length), 10, 5, theme.accent);
  }

  function drawFish(item, time) {
    const depth = clamp((item.y - waterTop) / Math.max(1, h - waterTop), 0, 1);
    const depthScale = item.scale * (0.88 + depth * 0.28);
    const width = 118 * depthScale;
    const height = 70 * depthScale;
    const bob = Math.sin(item.wobble + time * 2.5) * 4;
    const facingRight = item.vx > 0;

    ctx.save();
    ctx.globalAlpha = 0.13 + depth * 0.12;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#00151e";
    ctx.beginPath();
    ctx.ellipse(item.x - Math.sign(item.vx) * 16, item.y + bob + height * 0.42, width * 0.44, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(230,255,255,.52)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(item.x - Math.sign(item.vx) * width * 0.42, item.y + bob + height * 0.06);
    ctx.quadraticCurveTo(item.x - Math.sign(item.vx) * width * 0.74, item.y + bob - 5, item.x - Math.sign(item.vx) * width * 1.05, item.y + bob + 4);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(item.x, item.y + bob);
    if (facingRight) ctx.scale(-1, 1);
    ctx.globalAlpha = 0.96;
    ctx.filter = `saturate(${1.06 + depth * 0.16}) contrast(${1.05 + depth * 0.14})`;
    if (images.fish.ready) {
      ctx.drawImage(images.fish.image, -width / 2, -height / 2, width, height);
    } else {
      ctx.fillStyle = "#ffd34e";
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.42, height * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(width * 0.36, 0);
      ctx.lineTo(width * 0.56, -height * 0.25);
      ctx.lineTo(width * 0.56, height * 0.25);
      ctx.closePath();
      ctx.fill();
    }
    ctx.filter = "none";
    ctx.restore();

    // The semantic DOM target is the one readable label. Avoid painting a
    // second moving copy underneath it, which creates visual noise at compact
    // sizes and makes the selected word harder to follow.
    if (targetButtons.size) return;

    const labelW = clamp(46 + item.word.length * 13, 76, 162) * depthScale;
    const labelH = 30 * depthScale;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.28)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    fillRound(ctx, item.x - labelW / 2, item.y - labelH / 2 + bob, labelW, labelH, 8, "rgba(255,248,211,.94)");
    ctx.shadowColor = "transparent";
    strokeRound(ctx, item.x - labelW / 2, item.y - labelH / 2 + bob, labelW, labelH, 8, "rgba(35,45,60,.5)", 2);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#ffffff";
    fillRound(ctx, item.x - labelW / 2 + 4, item.y - labelH / 2 + bob + 3, labelW - 8, Math.max(4, labelH * 0.22), 4, "rgba(255,255,255,.38)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1e2330";
    const size = textWidthFor(ctx, item.word, labelW - 12, 22 * depthScale, 12);
    ctx.font = `950 ${size}px Fredoka, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.word, item.x, item.y + bob + 1, labelW - 10);
    ctx.textAlign = "left";
    ctx.restore();
  }

  function drawBoat(time) {
    const { boatW, boatH, boatY } = getBoatMetrics(time);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.32)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    if (images.boat.ready) {
      ctx.filter = "saturate(1.08) contrast(1.08)";
      ctx.drawImage(images.boat.image, boat.x - boatW * 0.46, boatY - boatH * 0.78, boatW, boatH);
      ctx.filter = "none";
    } else {
      fillRound(ctx, boat.x - boatW * 0.42, boatY - 36, boatW * 0.86, 44, 14, "#b46c30");
      fillRound(ctx, boat.x - 24, boatY - 92, 48, 58, 12, "#3276ad");
    }
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = theme.accent2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boat.x - boatW * 0.38, boatY - boatH * 0.22);
    ctx.quadraticCurveTo(boat.x, boatY - boatH * 0.1, boat.x + boatW * 0.38, boatY - boatH * 0.24);
    ctx.stroke();
    ctx.restore();
  }

  function drawHook(time) {
    if (boat.hookState === "ready") return;
    const tip = getRodTip(time);
    const rodX = tip.x;
    const rodY = tip.y;
    ctx.save();
    ctx.strokeStyle = "rgba(125,242,255,.28)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(rodX, rodY);
    ctx.lineTo(boat.hookX, boat.hookY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(246,252,255,.92)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rodX, rodY);
    ctx.lineTo(boat.hookX, boat.hookY);
    ctx.stroke();
    ctx.strokeStyle = "#1f2632";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(boat.hookX, boat.hookY + 7, 8, -Math.PI * 0.25, Math.PI * 1.1);
    ctx.stroke();
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(boat.hookX, boat.hookY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    bursts.forEach(p => {
      const alpha = clamp(p.life / p.ttl, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    floaters.forEach(p => {
      const alpha = clamp(p.life / p.ttl, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.font = "950 21px Fredoka, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(0,0,0,.42)";
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    });
  }

  function drawBanner() {
    if (phase === "playing") return;
    let text = banner;
    if (phase === "countdown") {
      text = phaseTimer > 2.15 ? level.prompt : phaseTimer > 1.4 ? "3" : phaseTimer > 0.7 ? "2" : phaseTimer > 0.15 ? "1" : "GO";
    } else if (phase === "finished") {
      text = "Fishing trip complete";
    }
    if (!text) return;
    const big = phase === "countdown" && /^(?:[123]|GO)$/.test(text);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `950 ${big ? clamp(w * 0.13, 70, 128) : clamp(w * 0.045, 25, 44)}px Fredoka, Arial, sans-serif`;
    const tw = Math.min(w - 52, ctx.measureText(text).width + 52);
    const th = big ? clamp(h * 0.18, 96, 150) : 74;
    const x = (w - tw) / 2;
    const y = big ? h * 0.32 - th / 2 : h * 0.27 - th / 2;
    fillRound(ctx, x, y, tw, th, 12, "rgba(5,10,24,.62)");
    strokeRound(ctx, x, y, tw, th, 12, "rgba(255,255,255,.22)", 1.4);
    ctx.fillStyle = big ? theme.accent : "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = 14;
    ctx.fillText(text, w / 2, y + th / 2 + 2, tw - 28);
    ctx.restore();
  }

  function drawScreenGrade() {
    ctx.save();
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.52, Math.min(w, h) * 0.2, w * 0.5, h * 0.55, Math.max(w, h) * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.78, "rgba(0,0,0,.10)");
    vignette.addColorStop(1, "rgba(0,0,0,.38)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function render() {
    if (!ctx || !w || !h) return;
    mount.dataset.rrPhase = phase;
    mount.dataset.rrSelectedFishId = selectedFishId || "";
    mount.dataset.rrCueDelivery = cueDelivery;
    const time = performance.now() / 1000;
    ctx.clearRect(0, 0, w, h);
    if (images.bg.ready) drawCover(ctx, images.bg.image, 0, 0, w, h, 0.5, 0.5);
    else drawFallbackBackground(time);
    if (!reduceMotion) drawSceneParallax(time);
    drawWater(time);
    drawBoatReflection(time);
    fish
      .slice()
      .sort((a, b) => a.y - b.y)
      .forEach(item => drawFish(item, time));
    drawHook(time);
    drawBoat(time);
    if (!reduceMotion) drawWaterSurface(time);
    drawParticles();
    drawForeground(time);
    drawHud();
    drawBanner();
    drawScreenGrade();
    syncFishTargets(time);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - lastTime || 16) / 1000);
    lastTime = now;
    update(dt);
    if (!paused) render();
    rafId = window.requestAnimationFrame(loop);
  }

  function onKeyDown(event) {
    if (isInteractiveKeyTarget(event.target)) return;
    if (introOpen) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        dismissIntro();
      }
      return;
    }
    const direction = laneDirectionForKey(event.key);
    if (direction < 0) {
      event.preventDefault();
      keys.left = true;
    }
    if (direction > 0) {
      event.preventDefault();
      keys.right = true;
    }
    if (isActionKey(event.key)) {
      event.preventDefault();
      requestCast();
    }
  }

  function onKeyUp(event) {
    if (introOpen) return;
    const interactiveTarget = isInteractiveKeyTarget(event.target);
    const direction = laneDirectionForKey(event.key);
    if (direction < 0) {
      if (!interactiveTarget) event.preventDefault();
      keys.left = false;
    }
    if (direction > 0) {
      if (!interactiveTarget) event.preventDefault();
      keys.right = false;
    }
    if (isActionKey(event.key)) {
      if (!interactiveTarget) event.preventDefault();
      keys.cast = false;
    }
  }

  function setButton(button, key) {
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      keys[key] = true;
      button.style.transform = "translateY(2px) scale(.98)";
    });
    button.addEventListener("pointerup", event => {
      event.preventDefault();
      keys[key] = false;
      button.style.transform = "";
    });
    button.addEventListener("pointercancel", () => {
      keys[key] = false;
      button.style.transform = "";
    });
    button.addEventListener("lostpointercapture", () => {
      keys[key] = false;
      button.style.transform = "";
    });
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    activePointer = event.pointerId;
    boat.targetX = clamp(x, 78, w - 78);
    if (y > waterTop && boat.hookState !== "ready") cancelCast();
  }

  function onPointerMove(event) {
    if (event.pointerId !== activePointer) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    boat.targetX = clamp(x, 78, w - 78);
  }

  function onPointerUp(event) {
    if (event.pointerId === activePointer) activePointer = null;
    keys.cast = false;
  }

  function onCastClick(event) {
    event.preventDefault();
    event.stopPropagation();
    requestCast();
  }

  function onCastCancel() {
    keys.cast = false;
    if (boat.hookState !== "ready") cancelCast();
  }

  function replayTarget(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!opts.getSound?.()) return;
    speakCue(level.target);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  btnReplay.addEventListener("click", replayTarget);
  setButton(btnLeft, "left");
  setButton(btnRight, "right");
  btnCast.addEventListener("click", onCastClick);
  btnCast.addEventListener("pointercancel", onCastCancel);
  btnCast.addEventListener("lostpointercapture", onCastCancel);
  btnNext.addEventListener("click", () => {
    if (levelIndex >= ladder.length - 1) finishGame();
    else startLevel(levelIndex + 1);
  });

  // Show the intro before the first level boots so its speakCue stays silent
  // and the countdown is frozen until the child dismisses the overlay.
  opts.onSessionStart?.();
  if (!readOnboarded()) showIntro();
  startLevel(startAt);
  lastTime = performance.now();
  rafId = window.requestAnimationFrame(loop);

  return {
    pause() {
      paused = true;
      keys.left = false;
      keys.right = false;
      keys.cast = false;
      if (boat.hookState !== "ready") cancelCast();
      stopTargetCue("interrupted");
      // Hide the intro while the chrome quit dialog is up so they never overlap.
      if (introEl) introEl.style.display = "none";
    },
    resume() {
      paused = false;
      lastTime = performance.now();
      if (introEl) introEl.style.display = "flex";
    },
    refreshSoundState,
    teardown() {
      running = false;
      window.cancelAnimationFrame(rafId);
      stopTargetCue("interrupted");
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      btnReplay.removeEventListener("click", replayTarget);
      btnCast.removeEventListener("click", onCastClick);
      btnCast.removeEventListener("pointercancel", onCastCancel);
      btnCast.removeEventListener("lostpointercapture", onCastCancel);
      targetButtons.clear();
      observer.disconnect();
      mount.innerHTML = "";
    }
  };
}
