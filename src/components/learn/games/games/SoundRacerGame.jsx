import { useEffect, useRef } from "react";
import {
  playCorrectChime,
  playSoftBuzz,
  playCelebrationFanfare,
  playTapSound,
  playWhoosh
} from "../../../../utils/audio/gameSfx";
import { soundRacerLadder, buildTrack } from "../../../../utils/soundRacerTracks.js";
import { worldForGameDifficulty, LEVELS_PER_DIFFICULTY } from "../../../../utils/curriculumLadder.js";
import { starRubric } from "../../../../utils/starRubric.js";

// ── World themes (2.5D canvas palette, not Three.js) ──────────────────────
const WORLD_THEME = {
  meadow: {
    name: "Meadow Dash",
    skyTop: "#7ec6ff", skyMid: "#a9e0ff", skyBottom: "#dff3ff",
    sun: "#fff4c2", ground: "#5aa23f", groundDark: "#3f7a2e",
    road: "#6b8e5e", roadDark: "#5a7a50", roadLine: "#8fb87a", roadEdge: "#4a7a3e",
    tileCorrect: "#7cf0b6", tileWrong: "#e8e0d0", tileBorder: "#5a9e50",
    obstacle: "#c8a86c", racer: "#f4f7ff", racerAccent: "#7cf0b6",
    speedLine: "#ffffff"
  },
  dino: {
    name: "Dino Dash",
    skyTop: "#ffcf7a", skyMid: "#ffb072", skyBottom: "#ff9d7a",
    sun: "#fff0c0", ground: "#8a5a3e", groundDark: "#6b4a28",
    road: "#a67a50", roadDark: "#8a6a40", roadLine: "#c8a070", roadEdge: "#8a5a3e",
    tileCorrect: "#ffd34e", tileWrong: "#e0d8c0", tileBorder: "#c9781a",
    obstacle: "#8a8888", racer: "#f4f7ff", racerAccent: "#ffd34e",
    speedLine: "#ffffff"
  },
  moonwood: {
    name: "Moonwood Flight",
    skyTop: "#1b2f5e", skyMid: "#25406e", skyBottom: "#0e1836",
    sun: "#dfe9ff", ground: "#1a2a5e", groundDark: "#0e1836",
    road: "#2a3a6e", roadDark: "#1a2a5e", roadLine: "#4a5a9e", roadEdge: "#1a2a5e",
    tileCorrect: "#9fe0ff", tileWrong: "#c0c0d0", tileBorder: "#5a7ae0",
    obstacle: "#e0e0e8", racer: "#f4f7ff", racerAccent: "#9fe0ff",
    speedLine: "#ffffff"
  }
};

// Utility: draw a rounded rectangle path
function rrPath(ctx, x, y, w, h, r) {
  const ra = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + ra, y);
  ctx.arcTo(x + w, y, x + w, y + h, ra);
  ctx.arcTo(x + w, y + h, x, y + h, ra);
  ctx.arcTo(x, y + h, x, y, ra);
  ctx.arcTo(x, y, x + w, y, ra);
  ctx.closePath();
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return m + ":" + String(sec).padStart(2, "0") + "." + String(cs).padStart(2, "0");
}

// ── Imperative engine ───────────────────────────────────────────────────────
function startGame(mount, opts) {
  const world = worldForGameDifficulty(opts.difficulty);
  const theme = WORLD_THEME[world] || WORLD_THEME.meadow;
  const ladder = soundRacerLadder(opts.difficulty);
  const levelCount = LEVELS_PER_DIFFICULTY;
  const startLevelIdx = Math.max(0, Math.min(Number(opts.startLevel) || 0, levelCount - 1));
  const sfx = fn => { try { if (opts.getSound && opts.getSound()) fn(); } catch { /* audio optional */ } };
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const bestKey = l => "lp:sound-racer-best:" + opts.difficulty + ":" + l;

  // ── Canvas ─────────────────────────────────────────────────────────────
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%";
  mount.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    W = mount.clientWidth || 640; H = mount.clientHeight || 460;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(mount);

  // ── HUD (DOM overlay, pointer-events only on buttons) ──────────────────
  const hud = document.createElement("div");
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#fff;z-index:4";
  hud.innerHTML =
    '<div style="position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:10px;background:rgba(10,16,40,.72);border:2px solid rgba(120,180,255,.35);border-radius:999px;padding:6px 16px 6px 8px">' +
      '<div data-sr="target" style="width:48px;height:48px;display:grid;place-items:center;font-size:1.7rem;font-weight:700;border-radius:14px;color:#071033;background:linear-gradient(160deg,#ffd34e,#ffa41c);box-shadow:0 4px 0 #c9781a"></div>' +
      '<div style="font-size:1.05rem;font-weight:600">Catch these!</div></div>' +
    '<div style="position:absolute;top:16px;right:16px;text-align:right">' +
      '<div data-sr="timer" style="font-size:1.2rem;font-weight:700;margin-bottom:4px">0:00.00</div>' +
      '<div data-sr="words" style="font-size:1.05rem;opacity:.9;margin-bottom:4px">0 / 0</div>' +
      '<div style="width:120px;height:10px;border-radius:999px;background:rgba(255,255,255,.16);overflow:hidden;margin-left:auto">' +
        '<div data-sr="speed" style="height:100%;width:0%;border-radius:999px;background:linear-gradient(90deg,#3fd6a0,#23a455);transition:width .2s"></div></div></div>' +
    '<div style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:16px">' +
      '<button data-sr="left" aria-label="Steer left" style="width:64px;height:64px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:1.4rem;font-weight:700;backdrop-filter:blur(4px);cursor:pointer;pointer-events:auto">◀</button>' +
      '<button data-sr="right" aria-label="Steer right" style="width:64px;height:64px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:1.4rem;font-weight:700;backdrop-filter:blur(4px);cursor:pointer;pointer-events:auto">▶</button></div>' +
    '<div data-sr="banner" style="position:absolute;top:34%;left:0;right:0;text-align:center;pointer-events:none;font-style:italic;font-weight:800;font-size:clamp(1.3rem,5vw,2.4rem);letter-spacing:.14em;text-transform:uppercase;color:#eaf2ff;text-shadow:0 3px 18px rgba(0,0,0,.6);opacity:0;transition:opacity .3s ease,transform .3s ease;transform:translateX(-40px)"></div>' +
    '<div data-sr="overlay" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;background:radial-gradient(120% 90% at 50% 25%,rgba(30,44,96,.72),rgba(6,9,24,.94));z-index:20;pointer-events:auto"></div>';
  mount.appendChild(hud);
  const el = key => hud.querySelector('[data-sr="' + key + '"]');

  let bannerT = 0;
  function showBanner(text) {
    const b = el("banner"); if (!b) return;
    b.textContent = text;
    b.style.opacity = "1"; b.style.transform = "translateX(0)";
    bannerT = 1.8;
  }
  function hideBanner() {
    const b = el("banner"); if (!b) return;
    b.style.opacity = "0"; b.style.transform = "translateX(-40px)";
  }

  // ── Countdown overlay (dynamic, created per level) ───────────────────
  let countdownEl = null;
  function showCountdown(target) {
    if (countdownEl) { try { countdownEl.remove(); } catch { /* ignore */ } }
    countdownEl = document.createElement("div");
    countdownEl.style.cssText = "position:absolute;inset:0;display:grid;place-items:center;text-align:center;pointer-events:none;background:radial-gradient(120% 90% at 50% 42%,rgba(10,16,40,.6),rgba(6,9,24,.25));z-index:15";
    countdownEl.innerHTML =
      '<div>' +
      '<div style="font-size:1.05rem;font-weight:600;opacity:.92;margin-bottom:14px">Catch the words that start with</div>' +
      '<div style="width:120px;height:120px;margin:0 auto;display:grid;place-items:center;font-size:4.6rem;font-weight:800;border-radius:28px;color:#071033;background:linear-gradient(160deg,#ffd34e,#ffa41c);box-shadow:0 8px 0 #c9781a">' + target + '</div>' +
      '<div data-sr="cd-num" style="font-size:3.4rem;font-weight:800;margin-top:18px;text-shadow:0 3px 18px rgba(0,0,0,.6)">3</div>' +
      '</div>';
    mount.appendChild(countdownEl);
  }
  function updateCountdown(t) {
    if (!countdownEl) return;
    const num = countdownEl.querySelector('[data-sr="cd-num"]');
    if (num) num.textContent = t > 0.5 ? String(Math.max(1, Math.ceil(t - 0.4))) : "GO!";
  }
  function hideCountdown() {
    if (countdownEl) { countdownEl.style.display = "none"; }
  }

  // ── State (all declared before use) ──────────────────────────────────
  let laneIx = 1;
  let racerX = 0;
  let playerZ = 0;
  let speed = 0;
  let wordsCorrect = 0;
  let wordsWrong = 0;
  let obstaclesHit = 0;
  let timeMs = 0;
  let running = false;
  let paused = false;
  let savedRunning = false;
  let countdownT = 0;
  let levelIdx = 0;
  let track = null;
  const passedGates = new Set();
  let boostT = 0;
  let dragT = 0;
  let shakeT = 0;
  let raf = 0;
  let last = 0;
  let particles = [];

  // ── Track constants ────────────────────────────────────────────────────
  const BASE_SPEED = opts.difficulty === "hard" ? 6 : opts.difficulty === "medium" ? 5 : 4;
  const VIEW_DISTANCE = 28;
  const HORIZON_FRAC = 0.22;
  const ROAD_BOTTOM_FRAC = 0.85;

  // ── Level lifecycle ────────────────────────────────────────────────────
  function startLevel() {
    const target = ladder[levelIdx % ladder.length];
    track = buildTrack(target, { difficulty: opts.difficulty, seed: levelIdx });
    playerZ = -3;
    wordsCorrect = 0; wordsWrong = 0; obstaclesHit = 0;
    timeMs = 0;
    passedGates.clear();
    speed = BASE_SPEED;
    boostT = 0; dragT = 0;
    laneIx = 1;
    countdownT = 3.4;
    running = false;
    particles = [];

    el("target").textContent = target;
    updateHud();
    showBanner("Track " + (levelIdx + 1) + " — " + theme.name);
    showCountdown(target);

    if (opts.onCheckpoint) opts.onCheckpoint(levelIdx, levelCount);
    if (opts.onProgressUpdate) opts.onProgressUpdate(levelIdx, levelCount);
  }

  function endLevel() {
    running = false;
    const total = wordsCorrect + wordsWrong + obstaclesHit;
    const accuracy = total > 0 ? Math.round((wordsCorrect / total) * 100) : 0;
    const stars = starRubric({ correct: wordsCorrect, total, mistakes: wordsWrong + obstaclesHit, deaths: 0 });
    const best = getBest(levelIdx);
    const isNewBest = !best || timeMs < best.bestTimeMs;
    if (isNewBest) {
      setBest(levelIdx, { bestTimeMs: timeMs, wordsCorrect, accuracy, stars });
    }

    sfx(playCelebrationFanfare);

    const overlay = el("overlay");
    overlay.innerHTML =
      '<div style="display:grid;gap:14px;justify-items:center">' +
      '<div style="font-size:2rem;font-weight:800">Track Complete!</div>' +
      (isNewBest ? '<div style="font-size:1.2rem;font-weight:700;color:#ffd34e;background:linear-gradient(90deg,#ff6b57,#ff8a3c);padding:6px 18px;border-radius:999px">New Best!</div>' : '') +
      '<div style="font-size:1.15rem;opacity:.9;line-height:1.95;text-align:left;min-width:210px">' +
      'Time &nbsp;<b>' + formatTime(timeMs) + '</b><br>' +
      'Words correct &nbsp;<b>' + wordsCorrect + ' / ' + track.needed + '</b><br>' +
      'Accuracy &nbsp;<b>' + accuracy + '%</b><br>' +
      'Stars &nbsp;<b>' + "★".repeat(stars) + "✩".repeat(3 - stars) + '</b></div>' +
      '<div style="display:flex;gap:12px">' +
      '<button data-sr="again" style="font-family:inherit;font-weight:700;font-size:1.1rem;color:#fff;background:rgba(255,255,255,.16);border:2px solid rgba(255,255,255,.3);padding:13px 24px;border-radius:999px;cursor:pointer">Race Again</button>' +
      '<button data-sr="next" style="font-family:inherit;font-weight:700;font-size:1.1rem;color:#071033;background:linear-gradient(160deg,#ffd34e,#ffa41c);border:0;padding:13px 24px;border-radius:999px;box-shadow:0 6px 0 #c9781a;cursor:pointer">Next Track</button></div>' +
      '</div>';
    overlay.style.display = "grid";

    overlay.querySelector('[data-sr="again"]').addEventListener("click", () => {
      overlay.style.display = "none"; sfx(playTapSound); startLevel();
    });
    overlay.querySelector('[data-sr="next"]').addEventListener("click", () => {
      overlay.style.display = "none"; sfx(playTapSound); nextLevel();
    });

    if (opts.onProgressUpdate) opts.onProgressUpdate(levelIdx + 1, levelCount);
  }

  function nextLevel() {
    levelIdx += 1;
    if (levelIdx >= levelCount) {
      showFinalResults();
    } else {
      startLevel();
    }
  }

  function showFinalResults() {
    let totalStars = 0;
    for (let i = 0; i < levelCount; i += 1) {
      const b = getBest(i);
      if (b) totalStars += b.stars;
    }
    const overlay = el("overlay");
    overlay.innerHTML =
      '<div style="display:grid;gap:14px;justify-items:center">' +
      '<div style="font-size:2rem;font-weight:800">All Tracks Done!</div>' +
      '<div style="font-size:1.3rem">Total Stars: <b>' + "★".repeat(Math.min(3, totalStars)) + "✩".repeat(Math.max(0, 3 - totalStars)) + '</b></div>' +
      '<button data-sr="done" style="font-family:inherit;font-weight:700;font-size:1.15rem;color:#071033;background:linear-gradient(160deg,#ffd34e,#ffa41c);border:0;padding:13px 30px;border-radius:999px;box-shadow:0 6px 0 #c9781a;cursor:pointer">Done</button></div>';
    overlay.style.display = "grid";
    overlay.querySelector('[data-sr="done"]').addEventListener("click", () => {
      overlay.style.display = "none"; sfx(playTapSound);
      if (opts.onComplete) opts.onComplete(totalStars, 0, 0);
    });
    sfx(playCelebrationFanfare);
  }

  function getBest(l) {
    try { const d = localStorage.getItem(bestKey(l)); return d ? JSON.parse(d) : null; }
    catch { return null; }
  }
  function setBest(l, data) {
    try { localStorage.setItem(bestKey(l), JSON.stringify(data)); }
    catch { /* ignore */ }
  }

  // ── Controls ───────────────────────────────────────────────────────────
  function moveLane(dir) {
    if (!running) return;
    const next = Math.max(0, Math.min(2, laneIx + dir));
    if (next !== laneIx) { laneIx = next; sfx(playTapSound); }
  }
  const onLeft = () => moveLane(-1);
  const onRight = () => moveLane(1);
  el("left").addEventListener("pointerdown", onLeft);
  el("right").addEventListener("pointerdown", onRight);

  const onKey = event => {
    if (event.key === "ArrowLeft") moveLane(-1);
    else if (event.key === "ArrowRight") moveLane(1);
  };
  window.addEventListener("keydown", onKey);

  let dragX = null;
  const onDown = event => { dragX = event.clientX; };
  const onUp = event => {
    if (dragX == null) return;
    const dx = event.clientX - dragX;
    if (Math.abs(dx) > 40) moveLane(dx > 0 ? 1 : -1);
    dragX = null;
  };
  cv.addEventListener("pointerdown", onDown);
  cv.addEventListener("pointerup", onUp);

  // ── Update ─────────────────────────────────────────────────────────────
  function update(dt) {
    if (!running || !track) return;
    timeMs += dt * 1000;

    // Speed = base + correct×boost − wrong×drag (never crash-to-zero)
    const boost = boostT > 0 ? 1.8 : 0;
    const drag = dragT > 0 ? 1.2 : 0;
    speed = BASE_SPEED + (wordsCorrect * 0.06) - (wordsWrong * 0.04) - (obstaclesHit * 0.03) + boost - drag;
    if (speed < 2.5) speed = 2.5;
    boostT = Math.max(0, boostT - dt);
    dragT = Math.max(0, dragT - dt);

    playerZ += speed * dt;

    // Resolve gates as they pass the player
    for (const gate of track.gates) {
      if (passedGates.has(gate.z)) continue;
      if (playerZ >= gate.z) {
        passedGates.add(gate.z);
        if (gate.lane === laneIx) {
          if (gate.correct) {
            wordsCorrect += 1;
            boostT = 1.0;
            sfx(playCorrectChime);
            sfx(playWhoosh);
            addParticles(gate.lane, theme.tileCorrect);
          } else if (gate.kind === "obstacle") {
            obstaclesHit += 1;
            dragT = 1.5;
            shakeT = 0.4;
            sfx(playSoftBuzz);
            addParticles(gate.lane, "#ff7a66");
          } else {
            wordsWrong += 1;
            dragT = 1.0;
            shakeT = 0.3;
            sfx(playSoftBuzz);
          }
        }
      }
    }

    // Finish when all gates passed
    if (playerZ >= track.totalLength) {
      endLevel();
      return;
    }

    // Update particles
    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.life -= dt; }
    particles = particles.filter(p => p.life > 0);

    shakeT = Math.max(0, shakeT - dt);
  }

  function addParticles(lane, color) {
    for (let i = 0; i < 10; i += 1) {
      const roadBottom = H * ROAD_BOTTOM_FRAC;
      const roadWidthBottom = W * 0.9;
      const laneX = W * 0.5 + (lane - 1) * (roadWidthBottom / 3);
      particles.push({
        x: laneX + (Math.random() - 0.5) * 40,
        y: roadBottom - 20 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 1,
        life: 0.6,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  function updateHud() {
    if (!track) return;
    const timerEl = el("timer");
    if (timerEl) timerEl.textContent = formatTime(timeMs);
    const wordsEl = el("words");
    if (wordsEl) wordsEl.textContent = wordsCorrect + " / " + track.needed;
    const speedEl = el("speed");
    if (speedEl) {
      const maxSpeed = BASE_SPEED + 6;
      const pct = Math.min(100, Math.max(0, (speed / maxSpeed) * 100));
      speedEl.style.width = pct + "%";
    }
  }

  // ── Draw ───────────────────────────────────────────────────────────────
  function draw() {
    if (!track) return;
    const now = Date.now() * 0.001;
    const horizonY = H * HORIZON_FRAC;
    const roadBottom = H * ROAD_BOTTOM_FRAC;
    const centerX = W * 0.5;
    const roadWidthBottom = W * 0.9;
    const roadWidthHorizon = W * 0.04;

    ctx.save();
    if (shakeT > 0 && !reduceMotion) {
      ctx.translate((Math.random() - 0.5) * 8 * shakeT, (Math.random() - 0.5) * 8 * shakeT);
    }

    // Sky
    const skyG = ctx.createLinearGradient(0, 0, 0, H);
    skyG.addColorStop(0, theme.skyTop);
    skyG.addColorStop(0.5, theme.skyMid);
    skyG.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, H);

    // Sun / moon
    const sunX = W * 0.75;
    const sunY = H * 0.15;
    const sunG = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 100);
    sunG.addColorStop(0, theme.sun);
    sunG.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sunG;
    ctx.fillRect(sunX - 100, sunY - 100, 200, 200);

    // Ground (outside road)
    const groundG = ctx.createLinearGradient(0, roadBottom, 0, H);
    groundG.addColorStop(0, theme.ground);
    groundG.addColorStop(1, theme.groundDark);
    ctx.fillStyle = groundG;
    ctx.fillRect(0, roadBottom, W, H - roadBottom);

    // Road surface
    ctx.fillStyle = theme.road;
    ctx.beginPath();
    ctx.moveTo(centerX - roadWidthHorizon / 2, horizonY);
    ctx.lineTo(centerX + roadWidthHorizon / 2, horizonY);
    ctx.lineTo(centerX + roadWidthBottom / 2, roadBottom);
    ctx.lineTo(centerX - roadWidthBottom / 2, roadBottom);
    ctx.closePath();
    ctx.fill();

    // Road texture (horizontal stripes that move toward player)
    const stripeSpacing = 6;
    const baseZ = Math.floor(playerZ / stripeSpacing) * stripeSpacing;
    for (let i = 0; i < VIEW_DISTANCE / stripeSpacing + 2; i += 1) {
      const z = baseZ + i * stripeSpacing;
      const d = z - playerZ;
      if (d <= 0 || d > VIEW_DISTANCE) continue;
      const t = 1 - d / VIEW_DISTANCE;
      const y = horizonY + (roadBottom - horizonY) * (1 - t);
      const rw = roadWidthHorizon + (roadWidthBottom - roadWidthHorizon) * t;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - rw / 2, y);
      ctx.lineTo(centerX + rw / 2, y);
      ctx.stroke();
    }

    // Lane dividers (converging dashed lines)
    for (let i = 1; i <= 2; i += 1) {
      const frac = (i / 3) - 0.5; // -1/3, 1/3
      const xH = centerX + frac * roadWidthHorizon;
      const xB = centerX + frac * roadWidthBottom;
      ctx.strokeStyle = theme.roadLine;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 14]);
      ctx.beginPath();
      ctx.moveTo(xH, horizonY);
      ctx.lineTo(xB, roadBottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Road edges
    ctx.strokeStyle = theme.roadEdge;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - roadWidthHorizon / 2, horizonY);
    ctx.lineTo(centerX - roadWidthBottom / 2, roadBottom);
    ctx.moveTo(centerX + roadWidthHorizon / 2, horizonY);
    ctx.lineTo(centerX + roadWidthBottom / 2, roadBottom);
    ctx.stroke();

    // ── Draw gates (back to front) ───────────────────────────────────────
    // Collect visible gates
    const visible = [];
    for (const gate of track.gates) {
      if (passedGates.has(gate.z)) continue;
      const d = gate.z - playerZ;
      if (d <= 0 || d > VIEW_DISTANCE) continue;
      visible.push({ gate, d });
    }
    // Sort by distance (far to near) so near gates draw on top
    visible.sort((a, b) => b.d - a.d);

    for (const { gate, d } of visible) {
      const t = Math.max(0, Math.min(1, 1 - d / VIEW_DISTANCE));
      const y = horizonY + (roadBottom - horizonY) * (1 - t);
      const scale = 0.12 + 0.88 * t;
      const rw = roadWidthHorizon + (roadWidthBottom - roadWidthHorizon) * t;
      const laneCenterX = centerX + (gate.lane - 1) * (rw / 3);

      const tileW = 70 * scale;
      const tileH = 32 * scale;

      ctx.save();
      ctx.translate(laneCenterX, y);

      if (gate.kind === "obstacle") {
        // Obstacle drawing per world
        if (world === "meadow") {
          // Hay bale: brown rounded rect with horizontal lines
          ctx.fillStyle = theme.obstacle;
          rrPath(ctx, -tileW / 2, -tileH / 2, tileW, tileH, 6 * scale);
          ctx.fill();
          ctx.strokeStyle = "#8a6a3a";
          ctx.lineWidth = 1 * scale;
          for (let i = 1; i <= 2; i += 1) {
            ctx.beginPath();
            ctx.moveTo(-tileW / 2 + 4 * scale, -tileH / 2 + i * tileH / 3);
            ctx.lineTo(tileW / 2 - 4 * scale, -tileH / 2 + i * tileH / 3);
            ctx.stroke();
          }
        } else if (world === "dino") {
          // Rock: gray circle with highlight
          ctx.fillStyle = theme.obstacle;
          ctx.beginPath();
          ctx.arc(0, 0, tileW / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,0.15)";
          ctx.beginPath();
          ctx.arc(tileW / 4, -tileH / 4, tileW / 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#666";
          ctx.lineWidth = 1 * scale;
          ctx.beginPath();
          ctx.arc(0, 0, tileW / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Cloud bank: fluffy white shape
          ctx.fillStyle = theme.obstacle;
          ctx.beginPath();
          ctx.arc(0, 0, tileW / 2, 0, Math.PI * 2);
          ctx.arc(-tileW / 3, -tileH / 4, tileW / 3, 0, Math.PI * 2);
          ctx.arc(tileW / 3, -tileH / 4, tileW / 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.beginPath();
          ctx.arc(-tileW / 4, -tileH / 4, tileW / 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Word tile
        const bg = gate.correct ? theme.tileCorrect : theme.tileWrong;
        ctx.fillStyle = bg;
        rrPath(ctx, -tileW / 2, -tileH / 2, tileW, tileH, 8 * scale);
        ctx.fill();
        ctx.strokeStyle = theme.tileBorder;
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        // Word text
        ctx.fillStyle = "#0a1a12";
        ctx.font = "700 " + Math.max(8, 16 * scale) + "px Fredoka, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(gate.word, 0, 1 * scale);
      }
      ctx.restore();
    }

    // ── Racer (drawn at bottom, on top of road) ──────────────────────────
    const racerTargetX = centerX + (laneIx - 1) * (roadWidthBottom / 3);
    racerX += (racerTargetX - racerX) * 0.15; // smooth lane transition

    const rW = 44;
    const rH = 28;
    const rY = roadBottom + 8;
    const bob = Math.sin(now * 6) * 3;

    ctx.save();
    ctx.translate(racerX, rY + bob);

    // Racer shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, rH / 2 + 2, rW / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Racer body
    ctx.fillStyle = theme.racer;
    rrPath(ctx, -rW / 2, -rH / 2, rW, rH, 10);
    ctx.fill();
    ctx.strokeStyle = theme.racerAccent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Racer head / windshield
    ctx.fillStyle = theme.racerAccent;
    ctx.beginPath();
    ctx.arc(0, -rH / 2 - 6, 9, 0, Math.PI * 2);
    ctx.fill();

    // Headlight eyes
    ctx.fillStyle = "#0a1a12";
    ctx.beginPath();
    ctx.arc(-6, -rH / 2 - 6, 3, 0, Math.PI * 2);
    ctx.arc(6, -rH / 2 - 6, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ── Speed lines (boost effect, skip if reduced motion) ──────────────
    if (boostT > 0 && !reduceMotion) {
      ctx.globalAlpha = 0.25 * (boostT / 1.0);
      ctx.fillStyle = theme.speedLine;
      for (let i = 0; i < 8; i += 1) {
        const sx = Math.random() < 0.5 ? Math.random() * W * 0.12 : W - Math.random() * W * 0.12;
        const sy = Math.random() * H;
        ctx.fillRect(sx, sy, 2 + Math.random() * 2, 30 + Math.random() * 60);
      }
      ctx.globalAlpha = 1;
    }

    // ── Particles ────────────────────────────────────────────────────────
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / 0.6);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Vignette ───────────────────────────────────────────────────────
    const vg = ctx.createRadialGradient(centerX, H / 2, H * 0.4, centerX, H / 2, H * 0.85);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,.28)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
  }

  // ── Game loop ──────────────────────────────────────────────────────────
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, ((now - last) || 16) / 1000);
    last = now;

    // Countdown
    if (countdownT > 0) {
      countdownT -= dt;
      updateCountdown(countdownT);
      if (countdownT <= 0) {
        running = true;
        hideCountdown();
      }
    }

    // Banner fade
    if (bannerT > 0) {
      bannerT -= dt;
      if (bannerT <= 0) hideBanner();
    }

    update(dt);
    updateHud();
    draw();
  }

  // ── Start ──────────────────────────────────────────────────────────────
  levelIdx = startLevelIdx;
  startLevel();
  raf = requestAnimationFrame(tick);

  // ── Pause / Resume / Teardown ──────────────────────────────────────────
  function pause() { if (paused) return; paused = true; savedRunning = running; running = false; }
  function resume() { if (!paused) return; paused = false; last = performance.now(); if (savedRunning) running = true; }
  function teardown() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    cv.removeEventListener("pointerdown", onDown);
    cv.removeEventListener("pointerup", onUp);
    el("left").removeEventListener("pointerdown", onLeft);
    el("right").removeEventListener("pointerdown", onRight);
    ro.disconnect();
    if (countdownEl) { try { countdownEl.remove(); } catch { /* ignore */ } }
    [cv, hud].forEach(n => { try { n.remove(); } catch { /* ignore */ } });
  }
  return { teardown, pause, resume };
}

// ── React shell ─────────────────────────────────────────────────────────
export default function SoundRacerGame({ difficulty = "easy", startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
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
    } catch (err) { console.error("[SoundRacer] failed to start:", err); }
    return () => { try { api.teardown(); } catch { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);
  return <div ref={mountRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: "460px", overflow: "hidden", background: "#070b1e", touchAction: "none" }} />;
}
