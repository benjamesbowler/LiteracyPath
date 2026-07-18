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
  reelReadIsCorrectCatch,
  reelReadLadder,
  reelReadMatches,
  reelReadStars
} from "../../../../utils/reelReadLevels.js";
import { speakWord } from "../../../../utils/learnGamesAudio.js";

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
  return key === " " || key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === "e";
}

export default function ReelReadGame({
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
    const api = startGame(mountRef.current, {
      difficulty,
      startLevel,
      onScoreUpdate,
      onProgressUpdate,
      onComplete,
      onCheckpoint,
      getSound: () => soundRef.current
    });
    onEngineReady?.(api);
    return () => api.teardown();
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

  const controls = document.createElement("div");
  controls.style.cssText = "position:absolute;inset:0;z-index:5;pointer-events:none";
  controls.innerHTML =
    '<div style="position:absolute;left:18px;bottom:18px;display:flex;gap:10px;pointer-events:auto">' +
      '<button data-rr="left" aria-label="Move left" style="width:62px;height:58px;border:1px solid rgba(255,255,255,.26);background:rgba(4,11,25,.58);color:white;font-size:1.55rem;font-weight:950;backdrop-filter:blur(4px);border-radius:8px;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 10px 24px rgba(0,0,0,.28)">&#9664;</button>' +
      '<button data-rr="right" aria-label="Move right" style="width:62px;height:58px;border:1px solid rgba(255,255,255,.26);background:rgba(4,11,25,.58);color:white;font-size:1.55rem;font-weight:950;backdrop-filter:blur(4px);border-radius:8px;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 10px 24px rgba(0,0,0,.28)">&#9654;</button>' +
    '</div>' +
    '<button data-rr="cast" aria-label="Cast hook" style="position:absolute;right:18px;bottom:18px;width:108px;height:66px;pointer-events:auto;border:1px solid rgba(255,255,255,.55);background:linear-gradient(160deg,#fff2a8,#ffc43d 55%,#d97a1e);color:#211606;font-family:var(--kid-font-display,Fredoka,sans-serif);font-weight:950;font-size:.95rem;letter-spacing:.04em;border-radius:8px;box-shadow:inset 0 -8px 0 rgba(0,0,0,.24),0 14px 26px rgba(0,0,0,.28)">CAST</button>';
  mount.appendChild(controls);

  const btnLeft = controls.querySelector('[data-rr="left"]');
  const btnRight = controls.querySelector('[data-rr="right"]');
  const btnCast = controls.querySelector('[data-rr="cast"]');

  let w = 0;
  let h = 0;
  let waterTop = 0;
  let rafId = 0;
  let lastTime = 0;
  let running = true;
  let paused = false;
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

  function speakCue(word) {
    try {
      if (opts.getSound?.()) speakWord(word);
    } catch {
      /* speech is optional */
    }
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
    phase = "countdown";
    phaseTimer = 3.2;
    banner = level.prompt;
    bannerTimer = 4.1;
    refillFish();
    opts.onProgressUpdate?.(levelIndex + 1, ladder.length);
    opts.onCheckpoint?.(levelIndex, ladder.length);
    speakCue(level.target);
    render();
  }

  function completeLevel() {
    phase = "level-complete";
    phaseTimer = 2.0;
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
  }

  function finishGame() {
    phase = "finished";
    const totalStars = stageStars.reduce((sum, stars) => sum + (Number(stars) || 0), 0);
    const finalStars = stageStars.length ? Math.max(1, Math.round(totalStars / stageStars.length)) : 0;
    sfx(playCelebrationFanfare);
    opts.onComplete?.(finalStars, score, wordsCaught);
  }

  function requestCast() {
    if (phase !== "playing" || boat.hookState !== "ready") return;
    const tip = getRodTip();
    sfx(playTapSound);
    boat.hookState = "dropping";
    boat.hookX = tip.x;
    boat.hookY = tip.y;
    boat.hookMaxY = h - 58;
    boat.caughtFish = null;
  }

  function catchFish(item) {
    boat.caughtFish = item;
    boat.hookState = "returning";
    if (reelReadIsCorrectCatch(item.word, level, caught) && !caught.includes(item.word)) {
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

  function update(dt) {
    if (paused) return;
    boat.bob += dt;
    if (bannerTimer > 0) bannerTimer = Math.max(0, bannerTimer - dt);

    if (phase === "countdown") {
      phaseTimer -= dt;
      if (phaseTimer <= 0) {
        phase = "playing";
        banner = level.prompt;
        bannerTimer = 2.2;
      }
    } else if (phase === "level-complete") {
      phaseTimer -= dt;
      if (phaseTimer <= 0) {
        if (levelIndex >= ladder.length - 1) finishGame();
        else startLevel(levelIndex + 1);
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
    if (keys.cast) requestCast();

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
      for (const item of fish) {
        const rx = Math.abs(item.x - boat.hookX);
        const ry = Math.abs(item.y - boat.hookY);
        if (rx < 56 * item.scale && ry < 31 * item.scale) {
          catchFish(item);
          break;
        }
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
    if (bannerTimer <= 0 && phase === "playing") return;
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

  function drawScreenGrade(time) {
    ctx.save();
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.52, Math.min(w, h) * 0.2, w * 0.5, h * 0.55, Math.max(w, h) * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.78, "rgba(0,0,0,.10)");
    vignette.addColorStop(1, "rgba(0,0,0,.38)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    for (let y = Math.floor(time * 24) % 4; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    ctx.restore();
  }

  function render() {
    if (!ctx || !w || !h) return;
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
    drawScreenGrade(time);
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
    if (event.key === "ArrowLeft" || event.key === "a") {
      event.preventDefault();
      keys.left = true;
    }
    if (event.key === "ArrowRight" || event.key === "d") {
      event.preventDefault();
      keys.right = true;
    }
    if (isActionKey(event.key)) {
      event.preventDefault();
      keys.cast = true;
    }
  }

  function onKeyUp(event) {
    if (event.key === "ArrowLeft" || event.key === "a") {
      event.preventDefault();
      keys.left = false;
    }
    if (event.key === "ArrowRight" || event.key === "d") {
      event.preventDefault();
      keys.right = false;
    }
    if (isActionKey(event.key)) {
      event.preventDefault();
      keys.cast = false;
    }
  }

  function setButton(button, key) {
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
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
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    activePointer = event.pointerId;
    boat.targetX = clamp(x, 78, w - 78);
    if (y > waterTop && phase === "playing") keys.cast = true;
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

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  setButton(btnLeft, "left");
  setButton(btnRight, "right");
  setButton(btnCast, "cast");

  startLevel(startAt);
  lastTime = performance.now();
  rafId = window.requestAnimationFrame(loop);

  return {
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
      lastTime = performance.now();
    },
    teardown() {
      running = false;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      observer.disconnect();
      mount.innerHTML = "";
    }
  };
}
