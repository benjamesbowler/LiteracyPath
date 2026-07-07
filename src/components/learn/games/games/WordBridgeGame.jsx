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

// ── world theming (same palette set as Letter Leap) ────────────────────────
const WORLD_THEME = {
  meadow: { name: "Meadow", sky: "#7ec6ff", ground: "#5aa23f", hazard: "#3b82c4", accent: "#4E8C44" },
  dino: { name: "Dino Valley", sky: "#ffcf7a", ground: "#8aa646", hazard: "#c2410c", accent: "#C2702A" },
  moonwood: { name: "Moonwood", sky: "#1b2f5e", ground: "#265a4a", hazard: "#5e4d9c", accent: "#5E4D9C" }
};

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
  useEffect(() => { soundRef.current = isSoundEnabled; }, [isSoundEnabled]);
  useEffect(() => {
    if (!mountRef.current) return undefined;
    let api = { teardown() {} };
    try {
      api = startGame(mountRef.current, {
        difficulty, startLevel, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint,
        getSound: () => soundRef.current
      });
      if (onEngineReady) onEngineReady(api);
    } catch (err) { console.error("[WordBridge] failed to start:", err); }
    return () => { try { api.teardown(); } catch { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);
  return (
    <div
      ref={mountRef}
      style={{
        position: "relative", width: "100%", height: "100%", minHeight: "460px",
        overflow: "hidden", background: "#070b1e", touchAction: "none"
      }}
    />
  );
}

// ── imperative engine (one RAF loop, outside React) ───────────────────────
function startGame(mount, opts) {
  const world = worldForGameDifficulty(opts.difficulty);
  const theme = WORLD_THEME[world] || WORLD_THEME.meadow;
  const ladder = wordBridgeLadder(opts.difficulty);
  const sfx = (fn) => { try { if (opts.getSound && opts.getSound()) fn(); } catch { /* audio optional */ } };
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ── Canvas ──────────────────────────────────────────────────────────────
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%";
  mount.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    W = mount.clientWidth || 640;
    H = mount.clientHeight || 460;
    cv.width = W * DPR;
    cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(mount);

  // ── HUD ─────────────────────────────────────────────────────────────────
  const hud = document.createElement("div");
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#fff;z-index:4";
  hud.innerHTML =
    '<div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(6,12,26,.5);padding:8px 16px 10px;border-radius:16px;border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(6px)">' +
      '<span data-wb="lab" style="font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;opacity:.75">Build the word</span>' +
      '<div data-wb="target" style="display:flex;gap:7px"></div></div>' +
    '<div data-wb="progress" style="position:absolute;top:14px;left:16px;font-size:1.02rem;font-weight:700;background:rgba(6,12,26,.5);padding:5px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14)">Lvl 1/10</div>' +
    '<div data-wb="stars" style="position:absolute;top:14px;right:16px;font-size:1.5rem;letter-spacing:2px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">☆☆☆</div>' +
    '<div data-wb="world" style="position:absolute;top:52px;right:16px;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;opacity:.85;background:rgba(6,12,26,.5);padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14)">Meadow</div>';
  mount.appendChild(hud);
  const elTarget = hud.querySelector('[data-wb="target"]');
  const elLab = hud.querySelector('[data-wb="lab"]');
  const elProgress = hud.querySelector('[data-wb="progress"]');
  const elStars = hud.querySelector('[data-wb="stars"]');
  const elWorld = hud.querySelector('[data-wb="world"]');

  // ── Touch controls ──────────────────────────────────────────────────────
  const padWrap = document.createElement("div");
  padWrap.style.cssText = "position:absolute;inset:0;z-index:6;pointer-events:none";
  padWrap.innerHTML =
    '<div style="position:absolute;bottom:20px;left:20px;display:flex;gap:12px;pointer-events:auto">' +
      '<button data-wb="left" style="width:66px;height:66px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:1.6rem;font-weight:700;backdrop-filter:blur(4px)">◀</button>' +
      '<button data-wb="right" style="width:66px;height:66px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:1.6rem;font-weight:700;backdrop-filter:blur(4px)">▶</button></div>' +
    '<div style="position:absolute;bottom:20px;right:20px;pointer-events:auto">' +
      '<button data-wb="action" style="width:86px;height:86px;border-radius:50%;border:0;background:linear-gradient(160deg,#ffd34e,#ffab1e);color:#20140a;font-size:1rem;font-weight:700;box-shadow:0 6px 0 #c9781a">PICK</button></div>';
  mount.appendChild(padWrap);

  // ── Overlay (results / try-again) ───────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:24px;z-index:20;background:radial-gradient(120% 90% at 50% 25%,rgba(20,40,70,.72),rgba(6,10,22,.94))";
  mount.appendChild(overlay);

  // ── Game state ──────────────────────────────────────────────────────────
  const keys = { left: false, right: false, action: false };
  let actionConsumed = false;
  let running = false, paused = false, savedRunning = false, last = 0;
  let rafId = 0;
  let currentLevel = null;
  let builder = null;
  let tiles = [];
  let slots = [];
  let pals = [];
  let score = 0, wrongHits = 0, wordsDone = 0;
  const startIdx = Math.max(0, Math.min(Number(opts.startLevel) || 0, ladder.length - 1));
  let stageQueue = makeCatchUp(ladder.map((_, i) => i).slice(startIdx));
  let stageIdx = 0;
  let phase = "GET_READY";
  let phaseTimer = 0;
  let wobbleSlot = -1;
  let wobbleT = 0;
  let floats = [];
  let GROUND_Y = 0;
  let bell = { x: 0, y: 0, r: 22 };

  // ── Input listeners ───────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
    if (e.key === " " || e.key === "e" || e.key === "Enter") { keys.action = true; actionConsumed = false; }
  }
  function onKeyUp(e) {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
    if (e.key === " " || e.key === "e" || e.key === "Enter") { keys.action = false; actionConsumed = false; }
  }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const btnLeft = padWrap.querySelector('[data-wb="left"]');
  const btnRight = padWrap.querySelector('[data-wb="right"]');
  const btnAction = padWrap.querySelector('[data-wb="action"]');

  function setTouch(btn, key) {
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); keys[key] = true; actionConsumed = false; });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); keys[key] = false; actionConsumed = false; });
    btn.addEventListener("mousedown", (e) => { e.preventDefault(); keys[key] = true; actionConsumed = false; });
    btn.addEventListener("mouseup", (e) => { e.preventDefault(); keys[key] = false; actionConsumed = false; });
  }
  setTouch(btnLeft, "left");
  setTouch(btnRight, "right");
  setTouch(btnAction, "action");

  function addFloat(x, y, txt) { floats.push({ x, y, txt, life: 0.8 }); }

  // ── Stage lifecycle ───────────────────────────────────────────────────────
  function startStage() {
    stageIdx = stageQueue.peek();
    if (stageIdx == null) { finishGame(); return; }
    const level = ladder[stageIdx];
    currentLevel = level;
    GROUND_Y = H - 60;

    // Builder
    builder = { x: 60, y: GROUND_Y - 36, w: 24, h: 36, speed: 140, carrying: null, anim: 0 };

    // Tiles — scatter on ground, keep a minimum margin from edges
    const margin = 80;
    const usable = W - margin * 2;
    tiles = level.tiles.map((t, i) => ({
      ...t,
      x: margin + (i + 0.5) * (usable / Math.max(level.tiles.length, 1)),
      y: GROUND_Y - 25,
      w: 40,
      h: 50,
      placed: false,
      lost: false
    }));

    // Slots — centred above the gap
    const slotW = 44;
    const gapW = Math.max(180, level.slots * (slotW + 10));
    const gapX = (W - gapW) / 2;
    slots = Array.from({ length: level.slots }, (_, i) => ({
      x: gapX + i * (slotW + 10) + 5,
      y: GROUND_Y - 150,
      w: slotW,
      h: 54,
      filled: false,
      needed: Array.isArray(level.target) ? String(level.target[i]) : String(level.target[i] || ""),
      order: i
    }));

    // Pals
    pals = Array.from({ length: level.pals }, (_, i) => ({
      x: 20 + i * 18,
      y: GROUND_Y - 8,
      state: "waiting",
      t: Math.random() * 6
    }));

    // Bell
    bell = { x: W - 50, y: GROUND_Y - 120, r: 22 };

    phase = "GET_READY";
    phaseTimer = 2.0;
    wobbleSlot = -1;
    floats = [];

    // HUD
    const target = currentLevel.target;
    const isSentence = Array.isArray(target);
    elLab.textContent = isSentence ? "Build the sentence" : "Build the word";
    elWorld.textContent = `${theme.name} · Lvl ${stageIdx + 1}/${LEVELS_PER_DIFFICULTY}`;
    elProgress.textContent = `Lvl ${stageIdx + 1}/${LEVELS_PER_DIFFICULTY}`;
    elStars.textContent = "☆☆☆";
    renderTargetHUD();

    running = true;
    opts.onProgressUpdate && opts.onProgressUpdate(wordsDone, ladder.length);
    opts.onCheckpoint && opts.onCheckpoint(stageIdx, LEVELS_PER_DIFFICULTY);
  }

  function renderTargetHUD() {
    elTarget.innerHTML = "";
    const target = currentLevel.target;
    const items = Array.isArray(target) ? target : target.split("");
    for (let i = 0; i < items.length; i += 1) {
      const s = document.createElement("div");
      const filled = slots[i]?.filled;
      s.style.cssText = "width:40px;height:44px;display:grid;place-items:center;font-size:1.2rem;font-weight:700;border-radius:10px;" +
        (filled
          ? "background:linear-gradient(160deg,#ffd34e,#ffab1e);color:#20140a;border:2px solid #ffcf4a;box-shadow:0 3px 0 #c9781a"
          : "background:rgba(255,255,255,.06);color:rgba(255,255,255,.5);border:2px solid rgba(255,255,255,.12)");
      s.textContent = items[i];
      elTarget.appendChild(s);
    }
  }

  function showOverlay(title, subtitle, btnText, onClick) {
    overlay.style.display = "grid";
    overlay.innerHTML =
      `<div style="font-size:1.8rem;font-weight:700;color:#fff;margin-bottom:8px">${title}</div>` +
      `<div style="font-size:1rem;color:rgba(255,255,255,.8);margin-bottom:16px">${subtitle}</div>` +
      `<button id="wb-ov-btn" style="padding:12px 24px;border-radius:12px;border:0;background:linear-gradient(160deg,#ffd34e,#ffab1e);color:#20140a;font-size:1rem;font-weight:700">${btnText}</button>`;
    overlay.querySelector("#wb-ov-btn").addEventListener("click", onClick);
  }

  function finishGame() {
    running = false;
    showOverlay("All Done!", `Score: ${score}`, "Play Again", () => {
      overlay.style.display = "none";
      wordsDone = 0;
      score = 0;
      stageQueue = makeCatchUp(ladder.map((_, i) => i));
      startStage();
    });
    opts.onComplete && opts.onComplete({ score });
  }

  function tryAgain() {
    running = false;
    showOverlay("Try again!", "The bridge needs more tiles.", "Retry", () => {
      overlay.style.display = "none";
      startStage();
    });
  }

  function levelComplete() {
    const total = slots.length + wrongHits;
    const stars = starRubric({ correct: slots.length, total, mistakes: 0, deaths: 0 });
    wordsDone += 1;
    elStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    sfx(playStarChime);
    stageQueue.complete();
    opts.onScoreUpdate && opts.onScoreUpdate(score);
    opts.onProgressUpdate && opts.onProgressUpdate(wordsDone, ladder.length);

    setTimeout(() => {
      overlay.style.display = "none";
      startStage();
    }, 2000);
  }

  // ── Action handling ───────────────────────────────────────────────────────
  function handleAction() {
    if (phase === "BELL_READY") {
      const d = Math.hypot(builder.x - bell.x, builder.y - bell.y);
      if (d < 60) {
        phase = "PALS_CROSSING";
        sfx(playCelebrationFanfare);
      }
      return;
    }

    if (phase !== "PLAYING") return;

    if (builder.carrying) {
      // Try to place in nearest unfilled slot
      const slot = slots.find((s) => !s.filled && Math.abs(builder.x - (s.x + s.w / 2)) < 40 && Math.abs(builder.y - s.y) < 70);
      if (slot) {
        const needed = slot.needed;
        const placed = builder.carrying.glyph;
        if (placed === needed.toUpperCase()) {
          slot.filled = true;
          builder.carrying = null;
          score += 25;
          sfx(playCorrectChime);
          addFloat(slot.x + slot.w / 2, slot.y, "+25");
          renderTargetHUD();
          if (slots.every((s) => s.filled)) {
            phase = "BELL_READY";
          }
        } else {
          // Wrong tile for this slot → drop into hazard
          builder.carrying = null;
          wrongHits += 1;
          wobbleSlot = slot.order;
          wobbleT = 0.4;
          sfx(playSoftBuzz);
          checkOutOfTiles();
        }
      } else {
        // Drop on ground
        tiles.push({ ...builder.carrying, x: builder.x, y: builder.y, w: 40, h: 50, placed: false, lost: false });
        builder.carrying = null;
        sfx(playTapSound);
      }
    } else {
      // Pick up nearest available tile
      const idx = tiles.findIndex((t) => !t.placed && !t.lost && Math.abs(builder.x - t.x) < 40 && Math.abs(builder.y - t.y) < 60);
      if (idx >= 0) {
        builder.carrying = { ...tiles[idx] };
        tiles[idx].placed = true;
        sfx(playTapSound);
      }
    }
  }

  function checkOutOfTiles() {
    const remaining = tiles.filter((t) => !t.placed && !t.lost && t.correct).length + (builder.carrying?.correct ? 1 : 0);
    if (remaining === 0 && !slots.every((s) => s.filled)) {
      tryAgain();
    }
  }

  // ── Update / Render ───────────────────────────────────────────────────────
  function update(dt) {
    phaseTimer -= dt;

    if (phase === "GET_READY") {
      if (phaseTimer <= 0) phase = "PLAYING";
      return;
    }

    if (phase === "PLAYING" || phase === "BELL_READY") {
      builder.anim += dt;
      builder.vx = 0;
      if (keys.left) builder.vx = -builder.speed;
      if (keys.right) builder.vx = builder.speed;
      builder.x += builder.vx * dt;
      builder.x = Math.max(16, Math.min(W - 16, builder.x));

      if (keys.action && !actionConsumed) {
        actionConsumed = true;
        handleAction();
      }

      // Floats
      for (const f of floats) { f.y -= 40 * dt; f.life -= dt; }
      floats = floats.filter((f) => f.life > 0);

      // Wobble decay
      if (wobbleT > 0) wobbleT -= dt;
      else wobbleSlot = -1;
    }

    if (phase === "PALS_CROSSING") {
      for (const pal of pals) {
        if (pal.state === "waiting") pal.state = "walking";
        if (pal.state === "walking") {
          pal.x += 90 * dt;
          if (pal.x >= W - 20) {
            pal.state = "crossed";
            score += 10;
            sfx(playPopSound);
          }
        }
      }
      if (pals.every((p) => p.state === "crossed")) {
        phase = "LEVEL_COMPLETE";
        levelComplete();
      }
    }
  }

  function render() {
    // Sky
    ctx.fillStyle = theme.sky;
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Hazard gap
    const gapW = Math.max(180, currentLevel.slots * 54);
    const gapX = (W - gapW) / 2;
    ctx.fillStyle = theme.hazard;
    ctx.fillRect(gapX, GROUND_Y, gapW, H - GROUND_Y);

    // Slots
    for (let i = 0; i < slots.length; i += 1) {
      const s = slots[i];
      const isWobble = (wobbleSlot === i && wobbleT > 0);
      const offsetX = isWobble ? Math.sin(wobbleT * 40) * 3 : 0;
      ctx.save();
      ctx.translate(offsetX, 0);
      if (s.filled) {
        ctx.fillStyle = theme.accent;
        ctx.beginPath();
        roundRect(ctx, s.x, s.y, s.w, s.h, 8);
        ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundRect(ctx, s.x, s.y, s.w, s.h, 8);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        roundRect(ctx, s.x, s.y, s.w, s.h, 8);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = "bold 18px Fredoka, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.needed, s.x + s.w / 2, s.y + s.h / 2);
      }
      ctx.restore();
    }

    // Tiles on ground
    for (const t of tiles) {
      if (t.placed || t.lost) continue;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.beginPath();
      roundRect(ctx, t.x - t.w / 2, t.y - t.h / 2, t.w, t.h, 8);
      ctx.fill();
      ctx.fillStyle = "#333";
      ctx.font = "bold 18px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.glyph, t.x, t.y);
    }

    // Builder
    const bob = (phase === "PLAYING" || phase === "BELL_READY") && Math.abs(builder.vx) > 10 && !reduceMotion
      ? Math.sin(builder.anim * 12) * 3
      : 0;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(builder.x - builder.w / 2, builder.y + bob, builder.w, builder.h);
    // Head
    ctx.fillStyle = "#ffeaa7";
    ctx.beginPath();
    ctx.arc(builder.x, builder.y + bob - 6, 8, 0, Math.PI * 2);
    ctx.fill();

    // Carried tile
    if (builder.carrying) {
      ctx.fillStyle = "#ffd34e";
      ctx.beginPath();
      roundRect(ctx, builder.x - 16, builder.y + bob - 46, 32, 40, 6);
      ctx.fill();
      ctx.fillStyle = "#333";
      ctx.font = "bold 16px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(builder.carrying.glyph, builder.x, builder.y + bob - 26);
    }

    // Pals
    for (const pal of pals) {
      if (pal.state === "crossed") continue;
      ctx.fillStyle = "#ff6b6b";
      ctx.beginPath();
      ctx.arc(pal.x, pal.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bell
    if (phase === "BELL_READY") {
      const pulse = reduceMotion ? 0 : Math.sin(performance.now() / 200) * 3;
      ctx.fillStyle = "#ffd34e";
      ctx.beginPath();
      ctx.arc(bell.x, bell.y, bell.r + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#20140a";
      ctx.font = "bold 12px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("RING", bell.x, bell.y);
    }

    // Floats
    for (const f of floats) {
      ctx.fillStyle = `rgba(255,255,255,${f.life})`;
      ctx.font = "bold 16px Fredoka, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.txt, f.x, f.y);
    }
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.moveTo(x + rr, y);
    c.lineTo(x + w - rr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr);
    c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr);
    c.quadraticCurveTo(x, y, x + rr, y);
    c.closePath();
  }

  function loop(ts) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    if (!paused) {
      update(dt);
      render();
    }
  }

  function pause() {
    if (paused) return;
    paused = true;
    savedRunning = running;
    running = false;
  }

  function resume() {
    if (!paused) return;
    paused = false;
    last = performance.now();
    if (savedRunning) running = true;
  }

  function teardown() {
    running = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    ro.disconnect();
    mount.innerHTML = "";
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  startStage();
  rafId = requestAnimationFrame(loop);
  last = performance.now();

  return { teardown, pause, resume };
}
