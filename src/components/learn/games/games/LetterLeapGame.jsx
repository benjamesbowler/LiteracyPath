import { useEffect, useRef, useState } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playCelebrationFanfare,
  playTapSound,
  playWhoosh
} from "../../../../utils/audio/gameSfx";
import {
  difficultyLadder,
  worldForGameDifficulty,
  LEVELS_PER_DIFFICULTY
} from "../../../../utils/curriculumLadder.js";
import { makeCatchUp } from "../../../../utils/catchUpQueue.js";
import { starRubric } from "../../../../utils/starRubric.js";

// Letter Leap — a real side-scrolling platformer (ported from the approved
// preview) wired to the shared curriculum framework:
//   difficulty -> world + cast (low=meadow, mid=dino, high=moonwood),
//   10 ramped, no-repeat levels from curriculumLadder, sentences on the hard
//   world's top levels, and catch-up (a failed stage returns later; a missed
//   word's letters respawn ahead).
// Kept imperative (out of React) so the render stays one container, like Rocket Run.

const WORLD_THEME = {
  meadow: { name: "Meadow", sky: ["#7ec6ff", "#a9e0ff", "#dff3ff"], sun: "#fff4c2", tree: "#3f8f52", treeDark: "#2c6b3c", ground: "#5aa23f", grass: "#7fd06a", dirt: ["#8a6238", "#6b4a28"], moon: false },
  dino: { name: "Dino Valley", sky: ["#ffcf7a", "#ffb072", "#ff9d7a"], sun: "#fff0c0", tree: "#b47a3e", treeDark: "#8a5a2c", ground: "#8aa646", grass: "#b6d26a", dirt: ["#7a5330", "#5c3d22"], moon: false },
  moonwood: { name: "Moonwood", sky: ["#1b2f5e", "#25406e", "#0e1836"], sun: "#dfe9ff", tree: "#233f66", treeDark: "#16294a", ground: "#265a4a", grass: "#3f8f74", dirt: ["#1e344a", "#13253a"], moon: true }
};

function pickFoeType(worldKey, levelIndex, k) {
  const pool = ["walker", "walker", "hopper"];
  if (levelIndex >= 2) pool.push("spike");
  if (levelIndex >= 3 || worldKey !== "meadow") pool.push("flyer", "spike");
  return pool[(k * 7 + levelIndex * 3) % pool.length]; // deterministic mix, no clumping
}

const GRAV = 0.62, MOVE = 4.8, JUMP = 13.6, GROUND_H = 96;
const SEG = 440, WORD_GAP = 560, MAXH = 5;

function startGame(mount, opts) {
  const world = worldForGameDifficulty(opts.difficulty);
  const theme = WORLD_THEME[world] || WORLD_THEME.meadow;
  const ladder = difficultyLadder("letter-leap", opts.difficulty);
  const sfx = fn => { try { if (opts.getSound && opts.getSound()) fn(); } catch { /* audio optional */ } };
  const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // The full word list for a stage. A sentence stage now plays EVERY sentence in
  // its bucket (not just the first) as sequential "legs" — flattened here only so
  // totalWords/progress count every word the child will actually spell.
  const stageWords = plan => (plan.mode === "sentence"
    ? plan.targets.flat()
    : plan.targets).map(w => String(w).toUpperCase());
  // Per-stage sentence legs (each leg = one sentence's words); null for letter stages.
  const allStageSentences = ladder.map(plan => (plan.mode === "sentence"
    ? plan.targets.map(s => s.map(w => String(w).toUpperCase()))
    : null));

  const allStageWords = ladder.map(stageWords);
  const totalWords = allStageWords.reduce((s, w) => s + w.length, 0) || 1;

  // ── DOM: canvas + HUD + touch pad + overlay (all inside the mount) ────────
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%";
  mount.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    W = mount.clientWidth || 640; H = mount.clientHeight || 460;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(mount);

  const hud = document.createElement("div");
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#fff;z-index:4";
  hud.innerHTML =
    '<div style="position:absolute;inset:0;opacity:.16;background:repeating-linear-gradient(180deg,rgba(255,255,255,.22) 0 1px,transparent 1px 4px),radial-gradient(92% 86% at 50% 52%,transparent 58%,rgba(0,0,0,.56));mix-blend-mode:screen"></div>' +
    '<div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;background:linear-gradient(92deg,rgba(7,12,32,.92),rgba(22,39,83,.76));padding:9px 20px 11px;border:1px solid rgba(126,232,255,.42);clip-path:polygon(14px 0,calc(100% - 22px) 0,100% 50%,calc(100% - 22px) 100%,14px 100%,0 50%);box-shadow:0 10px 28px rgba(0,0,0,.36),inset 0 0 0 1px rgba(255,255,255,.1);backdrop-filter:blur(6px)">' +
      '<span data-ll="lab" style="font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:#8ff6ff;opacity:.86">Spell the word</span>' +
      '<div data-ll="word" style="display:flex;gap:7px"></div></div>' +
    '<div data-ll="coins" style="position:absolute;top:14px;left:16px;font-size:1.02rem;font-weight:900;background:linear-gradient(100deg,rgba(7,12,32,.86),rgba(24,44,86,.72));padding:7px 14px;border:1px solid rgba(126,232,255,.34);clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);box-shadow:0 8px 20px rgba(0,0,0,.26)">Coins x0</div>' +
    '<div data-ll="hearts" style="position:absolute;top:14px;right:16px;font-size:1.5rem;letter-spacing:2px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">❤❤❤</div>' +
    '<div data-ll="world" style="position:absolute;top:52px;right:16px;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#8ff6ff;background:linear-gradient(100deg,rgba(7,12,32,.86),rgba(24,44,86,.72));padding:5px 12px;border:1px solid rgba(126,232,255,.34);clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)">Meadow</div>';
  mount.appendChild(hud);
  const elWord = hud.querySelector('[data-ll="word"]');
  const elLab = hud.querySelector('[data-ll="lab"]');
  const elHearts = hud.querySelector('[data-ll="hearts"]');
  const elWorld = hud.querySelector('[data-ll="world"]');
  const elCoins = hud.querySelector('[data-ll="coins"]');
  function updateCoins() { if (elCoins) elCoins.textContent = "Coins x" + coins + (starTokens ? "  Stars x" + starTokens : ""); }

  const padWrap = document.createElement("div");
  padWrap.style.cssText = "position:absolute;inset:0;z-index:6;pointer-events:none";
  padWrap.innerHTML =
    '<div style="position:absolute;bottom:20px;left:20px;display:flex;gap:12px;pointer-events:auto">' +
      '<button data-ll="left" style="width:66px;height:62px;border:1px solid rgba(126,232,255,.38);background:rgba(7,12,32,.54);color:#fff;font-size:1.6rem;font-weight:900;backdrop-filter:blur(4px);clip-path:polygon(18px 0,100% 0,calc(100% - 10px) 100%,0 100%);box-shadow:0 8px 18px rgba(0,0,0,.32)">◀</button>' +
      '<button data-ll="right" style="width:66px;height:62px;border:1px solid rgba(126,232,255,.38);background:rgba(7,12,32,.54);color:#fff;font-size:1.6rem;font-weight:900;backdrop-filter:blur(4px);clip-path:polygon(10px 0,100% 0,calc(100% - 18px) 100%,0 100%);box-shadow:0 8px 18px rgba(0,0,0,.32)">▶</button></div>' +
    '<div style="position:absolute;bottom:20px;right:20px;pointer-events:auto">' +
      '<button data-ll="jump" style="width:96px;height:76px;border:1px solid rgba(255,255,255,.62);background:linear-gradient(160deg,#ffe879,#ff9f24);color:#20140a;font-size:1rem;font-weight:900;letter-spacing:.04em;box-shadow:0 7px 0 #9a5a14,inset 0 0 0 2px rgba(255,255,255,.18);clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%)">JUMP</button></div>';
  mount.appendChild(padWrap);

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:24px;z-index:20;background:radial-gradient(120% 90% at 50% 25%,rgba(20,40,70,.72),rgba(6,10,22,.94))";
  mount.appendChild(overlay);

  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = grainCanvas.height = 96;
  const grainCtx = grainCanvas.getContext("2d");
  for (let y = 0; y < grainCanvas.height; y += 2) {
    for (let x = 0; x < grainCanvas.width; x += 2) {
      const v = 120 + Math.floor(Math.random() * 90);
      grainCtx.fillStyle = "rgba(" + v + "," + v + "," + v + ",0.055)";
      grainCtx.fillRect(x, y, 1, 1);
    }
  }
  const grainPattern = ctx.createPattern(grainCanvas, "repeat");

  function panelPath(x, y, w, h, cut = 10) {
    ctx.beginPath();
    ctx.moveTo(x + cut, y);
    ctx.lineTo(x + w - cut, y);
    ctx.lineTo(x + w, y + cut);
    ctx.lineTo(x + w - cut, y + h);
    ctx.lineTo(x + cut, y + h);
    ctx.lineTo(x, y + h - cut);
    ctx.lineTo(x, y + cut);
    ctx.closePath();
  }

  function drawPs2Overlay(time) {
    ctx.save();
    if (grainPattern) {
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = grainPattern;
      ctx.translate(Math.floor(time * 9) % 96, Math.floor(time * 5) % 96);
      ctx.fillRect(-96, -96, W + 192, H + 192);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.92);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(0.72, "rgba(0,0,0,.2)");
    vig.addColorStop(1, "rgba(0,0,0,.56)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawDepthScenery(time) {
    const horizon = groundY() - 86;
    const palettes = {
      meadow: { far: "rgba(59,86,116,.36)", mid: "rgba(35,84,66,.46)", near: "rgba(29,61,48,.58)", beam: "rgba(126,232,255,.18)" },
      dino: { far: "rgba(119,65,52,.42)", mid: "rgba(105,80,43,.5)", near: "rgba(68,52,38,.62)", beam: "rgba(255,186,100,.18)" },
      moonwood: { far: "rgba(38,55,94,.46)", mid: "rgba(23,45,70,.58)", near: "rgba(13,31,54,.68)", beam: "rgba(159,190,255,.16)" }
    };
    const p = palettes[world] || palettes.meadow;
    ctx.save();
    const glow = ctx.createRadialGradient(W * 0.74, H * 0.18, 4, W * 0.74, H * 0.18, Math.max(W, H) * 0.48);
    glow.addColorStop(0, p.beam);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    const layers = [
      { par: 0.08, base: horizon + 34, amp: 82, step: 138, color: p.far },
      { par: 0.16, base: horizon + 58, amp: 62, step: 104, color: p.mid },
      { par: 0.28, base: horizon + 80, amp: 46, step: 76, color: p.near }
    ];
    for (const layer of layers) {
      const off = ((-cam * layer.par) % layer.step + layer.step) % layer.step;
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(-layer.step, H);
      for (let x = -layer.step; x < W + layer.step * 2; x += layer.step) {
        const px = x + off;
        const peak = layer.base - layer.amp * (0.48 + 0.52 * Math.abs(Math.sin((x + time * 18) * 0.011)));
        ctx.lineTo(px, layer.base);
        ctx.lineTo(px + layer.step * 0.46, peak);
        ctx.lineTo(px + layer.step, layer.base);
      }
      ctx.lineTo(W + layer.step, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ── state ────────────────────────────────────────────────────────────────
  const keys = { left: false, right: false, jump: false };
  let player, level, words, wIx, word, nextIx, hearts, running = false, cam = 0, last = 0, invuln = 0;
  let particles = [], spores = [], floats = [];
  let score = 0, wrongHits = 0, deaths = 0, wordsDoneGlobal = 0;
  // Modern game-feel state (Mission 1)
  const COYOTE = 0.12, JUMP_BUFFER = 0.14;
  let coyoteT = 0, jumpBufT = 0, runDustT = 0, shakeT = 0;
  let coins = 0, starTokens = 0, starFlash = 0; // collectibles (Mission 2)
  let idleT = 0; // idle-animation timer (Mission 5)
  const startLevel = Math.max(0, Math.min(Number(opts.startLevel) || 0, ladder.length - 1));
  const stageQueue = makeCatchUp(ladder.map((_, i) => i).slice(startLevel)); // resume mid-ladder; a failed stage returns later
  let stageIdx = 0;
  let legs = null, legIx = 0; // sentence stages: the sentences to build, in order
  let rafId = 0;

  function addScore(n) { score += n; opts.onScoreUpdate && opts.onScoreUpdate(score); }
  function groundY() { return H - GROUND_H; }

  function shuffleArr(a) { for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function makeLevel(levelWords, worldKey, levelIndex) {
    const plats = [], bubbles = [], blocks = [], pickups = [], letterX = [];
    const pits = [], foes = [];
    const bump = { meadow: 0, dino: 2, moonwood: 4 }[worldKey] || 0;
    const hard = worldKey !== "meadow";

    let cx = 320;
    levelWords.forEach((up, wi) => {
      for (let i = 0; i < up.length; i += 1) {
        // Mid/hard worlds: every 3rd letter sits on a RAISED platform the child
        // must jump up to (a brick sits before it as a step/visual cue).
        const raised = hard && levelIndex >= 1 && i > 0 && (wi + i) % 3 === 2;
        if (raised) {
          const py = groundY() - 118;
          plats.push({ x: cx - 66, y: py, w: 132 });
          blocks.push({ x: cx - 150, y: groundY() - 60, w: 44, h: 40, type: "brick", broken: false, used: false });
          bubbles.push({ x: cx, y: py - 44, ch: up[i], word: wi, order: i, taken: false });
        } else {
          bubbles.push({ x: cx, y: groundY() - 46, ch: up[i], word: wi, order: i, taken: false });
        }
        letterX.push(cx); cx += SEG;
      }
      if (wi < levelWords.length - 1) {
        // Feature room between words: a RAVINE crossed by two staggered hop
        // platforms (mid/hard + later easy levels), else the classic platform.
        const useRavine = (hard || levelIndex >= 3) && (hard || wi % 2 === 1);
        if (useRavine) {
          const left = cx - 40, wRav = 230 + Math.min(90, levelIndex * 12);
          pits.push([left, left + wRav]);
          const hopW = 104;
          plats.push({ x: left + wRav * 0.22 - hopW / 2, y: groundY() - 92, w: hopW });
          const hop2 = { x: left + wRav * 0.62 - hopW / 2, y: groundY() - 138, w: hopW };
          if (levelIndex >= 4) { const xm = hard && wRav > 290; hop2.baseX = hop2.x; hop2.baseY = hop2.y; hop2.move = { axis: xm ? "x" : "y", range: xm ? 60 : 34, speed: 1.4, t: Math.random() * 6 }; }
          plats.push(hop2);
          cx += wRav + WORD_GAP * 0.5;
        } else {
          plats.push({ x: cx - WORD_GAP * 0.5 - 60, y: groundY() - 104, w: 120 });
          cx += WORD_GAP;
        }
      }
    });
    const flag = cx + 200, L = cx + 360;

    // SEPARATE slot budgets: hazards (foes/blocks/hearts/small pits) use gap
    // midpoints; decoys get their OWN offset slots so they can no longer be
    // starved by the hazard budget — this is why levels felt empty of wrong
    // letters before.
    const hazardSlots = [], decoySlots = [];
    for (let i = 0; i < letterX.length - 1; i += 1) {
      const a = letterX[i], b = letterX[i + 1];
      if (b - a < 220) continue;
      const mid = (a + b) / 2;
      if (mid < 520 || mid > flag - 220) continue;
      if (pits.some(q => mid > q[0] - 80 && mid < q[1] + 80)) continue;
      hazardSlots.push(mid);
      decoySlots.push(mid - 92, mid + 92);
    }
    shuffleArr(hazardSlots); shuffleArr(decoySlots);

    const foeCount = 4 + Math.round(levelIndex * 0.9) + bump;
    const decoyCount = 5 + Math.round(levelIndex * 1.0) + bump;
    const blockCount = 2 + Math.round(levelIndex * 0.4);
    const heartCount = 1 + Math.round(levelIndex * 0.2);

    const inWords = new Set(levelWords.join("").toUpperCase().split(""));
    const decoyPool = "BDFGJKMPQVXZ".split("").filter(c => !inWords.has(c));

    for (let k = 0; k < decoyCount && decoyPool.length && decoySlots.length; k += 1) {
      const c = decoySlots.pop();
      bubbles.push({ x: c, y: groundY() - 46, ch: decoyPool[Math.floor(Math.random() * decoyPool.length)], word: -1, order: -1, taken: false });
    }
    for (let k = 0; k < foeCount && hazardSlots.length; k += 1) {
      const c = hazardSlots.pop();
      foes.push({
        type: pickFoeType(worldKey, levelIndex, k),
        x0: c - 70, x1: c + 70, x: c, dir: Math.random() < 0.5 ? -1 : 1,
        y: groundY() - 20, baseY: groundY() - 20, t: Math.random() * 6
      });
    }
    for (let k = 0; k < blockCount && hazardSlots.length; k += 1) {
      const c = hazardSlots.pop();
      const n = 1 + Math.floor(Math.random() * 2);
      for (let j = 0; j < n; j += 1) blocks.push({ x: c + j * 46 - 23, y: groundY() - 140, w: 44, h: 40, type: Math.random() < 0.3 ? "prize" : "brick", broken: false, used: false });
    }
    for (let k = 0; k < heartCount && hazardSlots.length; k += 1) {
      const c = hazardSlots.pop();
      pickups.push({ x: c, y: groundY() - 150, taken: false });
    }
    // Extra small pits deep in a run (levels 5+), on ground stretches only.
    const smallPits = levelIndex >= 4 ? 1 + Math.floor(levelIndex / 4) : 0;
    for (let k = 0; k < smallPits && hazardSlots.length; k += 1) {
      const c = hazardSlots.pop();
      pits.push([c - 40, c + 40]);
    }
    pits.sort((a, b) => a[0] - b[0]); // grass-strip renderer REQUIRES ascending pits

    // ── Mission 2: collectibles — a coin arc over every ravine, coins on the
    //    high platforms, and 3 star tokens on the highest platforms (risk/reward).
    const coinsArr = [];
    for (const [pl, pr] of pits) {
      if (pr - pl < 140) continue; // ravines only, not tiny hazard pits
      for (let i = 0; i < 5; i += 1) { const u = (i + 0.5) / 5; coinsArr.push({ x: pl + (pr - pl) * u, y: groundY() - 90 - Math.sin(u * Math.PI) * 58, taken: false }); }
    }
    for (const pl of plats) { if (pl.y < groundY() - 70) coinsArr.push({ x: pl.x + pl.w / 2, y: pl.y - 22, taken: false }); }
    const starsArr = [];
    for (const pl of plats.slice().sort((a, b) => a.y - b.y).slice(0, 3)) starsArr.push({ x: pl.x + pl.w / 2, y: pl.y - 32, taken: false });
    // Springs on the ground below the highest star tokens (bounce up to reach them).
    const springsArr = [];
    for (const st of starsArr) { if (st.y < groundY() - 130) springsArr.push({ x: Math.max(140, st.x - 60), press: 0, taken: false }); }

    return { L, pits, plats, blocks, pickups, bubbles, foes, flag, coins: coinsArr, stars: starsArr, springs: springsArr };
  }
  function inPit(x) { return level.pits.some(p => x > p[0] && x < p[1]); }

  function startStage() {
    stageIdx = stageQueue.peek();
    if (stageIdx == null) { finishGame(); return; }
    const plan = ladder[stageIdx];
    legs = allStageSentences[stageIdx]; legIx = 0;
    words = (legs ? legs[0] : allStageWords[stageIdx]).slice();
    wIx = 0; word = words[0] || ""; nextIx = 0;
    level = makeLevel(words, world, stageIdx);
    player = { x: 70, y: groundY() - 46, w: 32, h: 46, vx: 0, vy: 0, onGround: true, face: 1, anim: 0, spawnX: 70, squash: 0 };
    hearts = 3; cam = 0; invuln = 0; particles = [];
    spores = []; for (let i = 0; i < 26; i += 1) spores.push({ x: Math.random() * 2400, y: Math.random() * H, s: 1 + Math.random() * 2.4, ph: Math.random() * 6 });
    elWorld.textContent = theme.name + " · Lvl " + (stageIdx + 1) + "/" + LEVELS_PER_DIFFICULTY;
    elLab.dataset.sentence = plan.mode === "sentence" ? "1" : "";
    elLab.dataset.goal = legs ? legs[legIx].join(" ") : "";
    running = true;
    renderWord(); updateHearts(); updateCoins();
    opts.onProgressUpdate && opts.onProgressUpdate(wordsDoneGlobal, totalWords);
    opts.onCheckpoint && opts.onCheckpoint(stageIdx, LEVELS_PER_DIFFICULTY);
  }

  function renderWord() {
    elWord.innerHTML = "";
    for (let i = 0; i < word.length; i += 1) {
      const s = document.createElement("div");
      const done = i < nextIx, isNext = i === nextIx;
      s.style.cssText = "width:38px;height:46px;display:grid;place-items:center;font-size:1.58rem;font-weight:900;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);text-shadow:none;" +
        (done
          ? "background:linear-gradient(160deg,#ffe879,#ff9f24);color:#20140a;border:1px solid rgba(255,255,255,.66);box-shadow:0 4px 0 #9a5a14,inset 0 0 0 2px rgba(255,255,255,.18)"
          : isNext
            ? "background:rgba(7,12,32,.42);color:#fff;border:1px solid #ffe879;box-shadow:0 0 18px rgba(255,232,121,.58),inset 0 0 0 2px rgba(255,255,255,.1)"
            : "background:rgba(7,12,32,.38);color:rgba(255,255,255,.38);border:1px solid rgba(126,232,255,.22);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)");
      s.textContent = word[i];
      elWord.appendChild(s);
    }
    elLab.textContent = elLab.dataset.sentence === "1"
      ? (elLab.dataset.goal || "Build the sentence")
      : "Word " + (wIx + 1) + " of " + words.length + " · spell it";
  }
  function updateHearts() { elHearts.textContent = "❤".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, 3 - hearts)); }

  function burst(x, y, c) { for (let i = 0; i < 12; i += 1) particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.7) * 6, life: 0.6, c }); }
  function addFloat(x, y, txt) { floats.push({ x, y, txt, life: 0.8 }); }
  function burstBlock(bl) { for (let i = 0; i < 9; i += 1) particles.push({ x: bl.x + bl.w / 2, y: bl.y + bl.h / 2, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 6 - 1, life: 0.7, c: "#b5602f" }); }

  function hurt() {
    if (invuln > 0) return;
    hearts -= 1; updateHearts(); wrongHits += 1; sfx(playSoftBuzz); invuln = 1.3; burst(player.x, player.y, "#ff7a66");
    if (hearts <= 0) {
      running = false; deaths += 1;
      stageQueue.miss(); // this stage comes back later (catch-up)
      showOverlay("Catch up later!", "The grumpers got you — this stage will come back around. Keep going!", "Keep going", () => { player = null; startStage(); });
    } else {
      player.x = player.spawnX; player.y = groundY() - 46; player.vx = 0; player.vy = 0; cam = Math.max(0, player.x - W * 0.35);
    }
  }
  function wordDone() {
    burst(player.x, player.y - 16, "#7cf0b6"); sfx(playCorrectChime);
    wordsDoneGlobal += 1; addScore(50); addFloat(player.x, player.y - 34, "+50");
    opts.onProgressUpdate && opts.onProgressUpdate(wordsDoneGlobal, totalWords);
    if (wIx < words.length - 1) { wIx += 1; word = words[wIx]; nextIx = 0; }
    renderWord();
  }
  // Sentence stage: after building one sentence, roll on to the next one in the
  // bucket (fresh strip of letter bubbles), so a hard level plays ALL its sentences.
  function nextLeg() {
    legIx += 1;
    words = legs[legIx].slice();
    wIx = 0; word = words[0] || ""; nextIx = 0;
    level = makeLevel(words, world, stageIdx);
    player.x = 70; player.y = groundY() - 46; player.vx = 0; player.vy = 0; player.spawnX = 70; cam = 0;
    elLab.dataset.goal = legs[legIx].join(" ");
    sfx(playTapSound);
    renderWord();
  }
  function clearStage() {
    running = false; sfx(playCelebrationFanfare); addScore(100);
    stageQueue.complete();
    if (stageQueue.isDone) { finishGame(); return; }
    showTally("Stage complete", "Next stage", () => { player = null; startStage(); });
  }
  function finishGame() {
    running = false; sfx(playStarChime);
    const stars = starRubric({ correct: wordsDoneGlobal, total: totalWords, mistakes: wrongHits, deaths });
    showTally("You did it", "Done", () => {});
    opts.onComplete && opts.onComplete(stars, score, wordsDoneGlobal);
  }

  const ctaStyle = [
    "font-family:inherit",
    "font-weight:900",
    "font-size:1.12rem",
    "letter-spacing:.05em",
    "text-transform:uppercase",
    "color:#20140a",
    "background:linear-gradient(160deg,#ffe879,#ff9f24)",
    "border:1px solid rgba(255,255,255,.62)",
    "padding:14px 32px",
    "clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%)",
    "box-shadow:0 7px 0 #9a5a14,inset 0 0 0 2px rgba(255,255,255,.18)",
    "cursor:pointer"
  ].join(";");

  function showOverlay(title, text, btnLabel, fn) {
    overlay.innerHTML =
      '<div style="max-width:520px;padding:24px 30px;background:linear-gradient(140deg,rgba(7,12,32,.92),rgba(22,39,83,.72));border:1px solid rgba(126,232,255,.36);clip-path:polygon(18px 0,100% 0,calc(100% - 18px) 100%,0 100%);box-shadow:0 20px 60px rgba(0,0,0,.42),inset 0 0 0 1px rgba(255,255,255,.08)"><h1 style="font-size:clamp(1.6rem,6vw,2.6rem);margin:0">' + title + '</h1>' +
      '<p style="opacity:.9;margin:10px auto 22px;max-width:440px;line-height:1.4">' + text + '</p>' +
      '<button data-ll="cta" style="' + ctaStyle + '">' + btnLabel + '</button></div>';
    overlay.style.display = "grid";
    overlay.querySelector('[data-ll="cta"]').onclick = () => { overlay.style.display = "none"; sfx(playTapSound); fn(); };
  }
  // Results tally card (Mission 2/4): counts of what the child actually collected.
  function showTally(title, btnLabel, fn) {
    const stageStars = level ? level.stars.filter(s => s.taken).length : 0;
    overlay.innerHTML =
      '<div style="display:grid;gap:12px;justify-items:center;padding:24px 30px;background:linear-gradient(140deg,rgba(7,12,32,.92),rgba(22,39,83,.72));border:1px solid rgba(126,232,255,.36);clip-path:polygon(18px 0,100% 0,calc(100% - 18px) 100%,0 100%);box-shadow:0 20px 60px rgba(0,0,0,.42),inset 0 0 0 1px rgba(255,255,255,.08)">' +
      '<h1 style="font-size:clamp(1.5rem,6vw,2.4rem);margin:0">' + title + '</h1>' +
      '<div style="font-size:1.05rem;opacity:.94;line-height:1.95;text-align:left;min-width:210px">' +
      'Words spelled &nbsp;<b>' + wordsDoneGlobal + '</b><br>' +
      'Coins &nbsp;<b>' + coins + '</b><br>' +
      'Stars this stage &nbsp;<b>' + ("★".repeat(stageStars) + "☆".repeat(3 - stageStars)) + '</b><br>' +
      'Score &nbsp;<b>' + score + '</b></div>' +
      '<button data-ll="cta" style="' + ctaStyle + ';margin-top:4px">' + btnLabel + '</button></div>';
    overlay.style.display = "grid";
    overlay.querySelector('[data-ll="cta"]').onclick = () => { overlay.style.display = "none"; sfx(playTapSound); fn(); };
  }

  // ── input ─────────────────────────────────────────────────────────────────
  const onKeyDown = e => { if (e.key === "ArrowLeft") keys.left = true; else if (e.key === "ArrowRight") keys.right = true; else if (e.key === " " || e.key === "ArrowUp") { keys.jump = true; if (!e.repeat) jumpBufT = JUMP_BUFFER; e.preventDefault(); } };
  const onKeyUp = e => { if (e.key === "ArrowLeft") keys.left = false; else if (e.key === "ArrowRight") keys.right = false; else if (e.key === " " || e.key === "ArrowUp") keys.jump = false; };
  window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);
  const holders = [];
  const hold = (sel, k) => {
    const el = padWrap.querySelector(sel);
    const down = e => { e.preventDefault(); keys[k] = true; if (k === "jump") jumpBufT = JUMP_BUFFER; };
    const up = () => { keys[k] = false; };
    el.addEventListener("pointerdown", down); el.addEventListener("pointerup", up); el.addEventListener("pointerleave", up);
    holders.push([el, down, up]);
  };
  hold('[data-ll="left"]', "left"); hold('[data-ll="right"]', "right"); hold('[data-ll="jump"]', "jump");

  // ── update ─────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!running || !player) return;
    if (invuln > 0) invuln -= dt;
    const p = player;
    // Mission 3: move platforms and carry the rider (uses LAST frame's p.stood),
    // then clear p.stood so this frame's collisions can re-establish it.
    for (const pl of level.plats) {
      if (!pl.move) continue;
      pl.move.t += dt;
      const off = Math.sin(pl.move.t * pl.move.speed) * pl.move.range;
      pl.prevX = pl.x; pl.prevY = pl.y;
      if (pl.move.axis === "x") pl.x = pl.baseX + off; else pl.y = pl.baseY + off;
      if (p.stood === pl) { p.x += pl.x - pl.prevX; p.y += pl.y - pl.prevY; }
    }
    p.stood = null;
    p.vx = (keys.right ? MOVE : 0) - (keys.left ? MOVE : 0);
    // Coyote time + jump buffering + variable jump height (modern platformer feel).
    coyoteT = p.onGround ? COYOTE : Math.max(0, coyoteT - dt);
    jumpBufT = Math.max(0, jumpBufT - dt);
    if (jumpBufT > 0 && (p.onGround || coyoteT > 0)) {
      p.vy = -JUMP; p.onGround = false; coyoteT = 0; jumpBufT = 0; p.squash = -0.3; sfx(playTapSound);
    }
    if (!keys.jump && p.vy < -4) p.vy = -4; // release early = shorter hop
    p.vy += GRAV; if (p.vy > 18) p.vy = 18;
    p.x += p.vx; if (p.vx) p.face = p.vx > 0 ? 1 : -1; p.anim += Math.abs(p.vx) * 0.07;
    p.y += p.vy;
    const wasAir = !p.onGround; p.onGround = false;
    const feet = p.y + p.h / 2;
    for (const pl of level.plats) { if (p.x + p.w / 2 > pl.x && p.x - p.w / 2 < pl.x + pl.w && p.vy >= 0 && feet >= pl.y && feet <= pl.y + 24) { p.y = pl.y - p.h / 2; p.vy = 0; p.onGround = true; p.spawnX = p.x; p.stood = pl; } }
    for (const sp of level.springs) { if (Math.abs(sp.x - p.x) < 24 && p.onGround && p.y + p.h / 2 >= groundY() - 10) { p.vy = -19; p.onGround = false; p.squash = -0.45; sp.press = 0.2; sfx(playWhoosh); } }
    for (const bl of level.blocks) {
      if (bl.broken) continue;
      const ox = p.x + p.w / 2 > bl.x + 4 && p.x - p.w / 2 < bl.x + bl.w - 4;
      const head = p.y - p.h / 2;
      if (ox && p.vy >= 0 && feet >= bl.y && feet <= bl.y + 22) { p.y = bl.y - p.h / 2; p.vy = 0; p.onGround = true; }
      else if (ox && p.vy < 0 && head <= bl.y + bl.h && head >= bl.y + bl.h - 22) {
        p.vy = 1.5;
        if (bl.type === "brick") { bl.broken = true; sfx(playPopSound); burstBlock(bl); }
        else if (bl.type === "prize" && !bl.used) { bl.used = true; sfx(playStarChime); level.pickups.push({ x: bl.x + bl.w / 2, y: bl.y - 16, taken: false }); }
      }
    }
    if (feet >= groundY()) { if (inPit(p.x)) { if (p.y > H + 40) hurt(); } else { p.y = groundY() - p.h / 2; p.vy = 0; p.onGround = true; if (p.x > 70) p.spawnX = Math.max(p.spawnX, p.x - 24); } }
    if (p.onGround && wasAir) {
      p.squash = 0.35;
      for (let i = 0; i < 6; i += 1) particles.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y + p.h / 2 - 2, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 1.5, life: 0.5, c: "#cfc9bd" });
    }
    if (p.onGround && p.vx !== 0) { runDustT -= dt; if (runDustT <= 0) { runDustT = 0.18; particles.push({ x: p.x - p.face * 12, y: p.y + p.h / 2 - 2, vx: -p.face * 1.2, vy: -Math.random(), life: 0.4, c: "#cfc9bd" }); } }
    idleT = (p.vx === 0 && p.onGround) ? idleT + dt : 0;
    p.squash *= 0.8;
    if (p.x < 18) p.x = 18;
    // Catch-up: if the letter they still need is now behind them (walked or jumped
    // past it), slide it back in front — a skipped letter never softlocks the word.
    const need = level.bubbles.find(b => !b.taken && b.word === wIx && b.order === nextIx);
    if (need && need.x < p.x - 40) {
      let nx = p.x + 320;
      const pit = level.pits.find(q => nx > q[0] - 40 && nx < q[1] + 40);
      if (pit) nx = pit[1] + 80;
      need.x = nx; need.y = groundY() - 46;
    }
    for (const b of level.bubbles) {
      if (b.taken) continue;
      if (Math.abs(b.x - p.x) < 34 && Math.abs(b.y - p.y) < 42) {
        if (b.word === -1) { b.taken = true; burst(b.x, b.y, "#ff7a66"); hurt(); }
        else if (b.word === wIx && b.order === nextIx) {
          b.taken = true; nextIx += 1; sfx(playPopSound); addScore(10); burst(b.x, b.y, "#ffd34e"); addFloat(b.x, b.y - 22, "+10");
          if (nextIx >= word.length) wordDone(); else renderWord();
        }
      }
    }
    for (const hp of level.pickups) { if (hp.taken) continue; if (Math.abs(hp.x - p.x) < 28 && Math.abs(hp.y - p.y) < 32) { hp.taken = true; hearts = Math.min(MAXH, hearts + 1); updateHearts(); sfx(playStarChime); burst(hp.x, hp.y, "#ff6b8a"); } }
    for (const cn of level.coins) { if (cn.taken) continue; if (Math.abs(cn.x - p.x) < 26 && Math.abs(cn.y - p.y) < 30) { cn.taken = true; coins += 1; addScore(5); addFloat(cn.x, cn.y - 16, "+5"); sfx(playPopSound); updateCoins(); } }
    for (const st of level.stars) { if (st.taken) continue; if (Math.abs(st.x - p.x) < 30 && Math.abs(st.y - p.y) < 34) { st.taken = true; starTokens += 1; addFloat(st.x, st.y - 22, "★"); sfx(playStarChime); burst(st.x, st.y, "#ffe08a"); if (level.stars.every(s => s.taken)) { addScore(250); starFlash = 1; } updateCoins(); } }
    for (const f of level.foes) {
      f.t += dt;
      if (f.type === "walker" || f.type === "spike") {
        f.x += f.dir * (f.type === "spike" ? 1.1 : 1.9);
        if (f.x < f.x0 || f.x > f.x1) f.dir *= -1;
        f.y = f.baseY;
      } else if (f.type === "hopper") {
        f.x += f.dir * 1.5;
        if (f.x < f.x0 || f.x > f.x1) f.dir *= -1;
        const ph = f.t % 1.6;
        f.y = f.baseY - (ph < 0.8 ? Math.sin((ph / 0.8) * Math.PI) * 46 : 0);
      } else if (f.type === "flyer") {
        f.x += f.dir * 2.3;
        if (f.x < f.x0 - 40 || f.x > f.x1 + 40) f.dir *= -1;
        f.y = f.baseY - 64 + Math.sin(f.t * 2.2) * 18;
      }
      if (Math.abs(f.x - p.x) < 26 && Math.abs(f.y - p.y) < 32) {
        const stomp = p.vy > 2 && p.y < f.y - 6;
        if (stomp && f.type !== "spike") { f.dead = true; p.vy = -9; sfx(playPopSound); burst(f.x, f.y, "#a0ffb0"); addScore(5); addFloat(f.x, f.y - 20, "+5"); shakeT = 0.22; }
        else hurt(); // spikes can NEVER be stomped — jump OVER them
      }
    }
    level.foes = level.foes.filter(f => !f.dead);
    const stageDone = (wIx >= words.length - 1) && (nextIx >= word.length);
    if (p.x > level.flag && stageDone) {
      if (legs && legIx < legs.length - 1) { nextLeg(); return; }
      clearStage();
    } else if (p.x > level.flag && !stageDone) p.x = level.flag - 4;
    // Camera lookahead: bias the view the way the child is facing (SMW feel).
    const camTarget = Math.max(0, Math.min(level.L - W, p.x - W * 0.35 + p.face * 90));
    cam += (camTarget - cam) * Math.min(1, dt * 4);
    for (const pt of particles) { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.3; pt.life -= dt; }
    particles = particles.filter(pt => pt.life > 0);
    for (const fl of floats) { fl.y -= dt * 50; fl.life -= dt; }
    floats = floats.filter(fl => fl.life > 0);
    shakeT = Math.max(0, shakeT - dt);
    starFlash = Math.max(0, starFlash - dt * 1.4);
  }

  // ── draw (faithful to the approved preview) ────────────────────────────────
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function treeRow(col, par, base, spacing, ht, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = col; const off = -cam * par;
    for (let i = -1; i < W / spacing + 2; i += 1) {
      const px = i * spacing + ((off % spacing) + spacing) % spacing;
      ctx.fillRect(px - 6, base - ht * 0.5, 12, ht * 0.5);
      ctx.beginPath(); ctx.arc(px, base - ht * 0.55, ht * 0.34, 0, 7); ctx.arc(px - ht * 0.28, base - ht * 0.4, ht * 0.26, 0, 7); ctx.arc(px + ht * 0.28, base - ht * 0.4, ht * 0.26, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function grassStrip(x, w) {
    if (w <= 0) return;
    const y = groundY();
    const top = ctx.createLinearGradient(0, y - 10, 0, y + 20);
    top.addColorStop(0, theme.grass);
    top.addColorStop(0.45, theme.ground);
    top.addColorStop(1, theme.dirt[0]);
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    for (let gx = x; gx <= x + w + 20; gx += 28) {
      ctx.lineTo(gx + 9, y - 9);
      ctx.lineTo(gx + 22, y + 6);
    }
    ctx.lineTo(x + w, y + 20);
    ctx.lineTo(x, y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.16)";
    ctx.fillRect(x, y - 2, w, 2);
    const side = ctx.createLinearGradient(0, y + 16, 0, H);
    side.addColorStop(0, theme.dirt[0]);
    side.addColorStop(0.55, theme.dirt[1]);
    side.addColorStop(1, "#071022");
    ctx.fillStyle = side;
    ctx.fillRect(x, y + 16, w, H - y - 16);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 1;
    for (let gx = x + 20; gx < x + w; gx += 64) {
      ctx.beginPath();
      ctx.moveTo(gx, y + 24);
      ctx.lineTo(gx - 22, H);
      ctx.stroke();
    }
  }
  function platform(pl) {
    ctx.fillStyle = "rgba(0,0,0,.26)";
    panelPath(pl.x + 6, pl.y + 12, pl.w, 26, 8);
    ctx.fill();
    const im = SPR.platform;
    if (im && im.width) {
      ctx.save();
      panelPath(pl.x, pl.y, pl.w, 32, 9);
      ctx.clip();
      const th = 50, tw = im.width / im.height * th;
      for (let gx = pl.x; gx < pl.x + pl.w; gx += tw) ctx.drawImage(im, gx, pl.y - 8, tw, th);
      ctx.fillStyle = "rgba(8,18,34,.2)";
      ctx.fillRect(pl.x, pl.y + 22, pl.w, 10);
      ctx.restore();
      return;
    }
    const dg = ctx.createLinearGradient(0, pl.y, 0, pl.y + 32);
    dg.addColorStop(0, theme.grass);
    dg.addColorStop(0.34, theme.ground);
    dg.addColorStop(1, theme.dirt[0]);
    ctx.fillStyle = dg;
    panelPath(pl.x, pl.y, pl.w, 32, 9);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = 2;
    panelPath(pl.x + 2, pl.y + 2, pl.w - 4, 8, 4);
    ctx.stroke();
  }
  function bubble(x, y, ch) {
    ctx.save();
    ctx.shadowColor = "rgba(126,232,255,.7)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(8,18,42,.58)";
    panelPath(x - 27, y - 22, 54, 44, 9);
    ctx.fill();
    const rg = ctx.createLinearGradient(x - 24, y - 20, x + 26, y + 24);
    rg.addColorStop(0, "#eaffff");
    rg.addColorStop(0.34, "#8ff6ff");
    rg.addColorStop(1, "#2f83ff");
    ctx.fillStyle = rg;
    panelPath(x - 24, y - 20, 48, 40, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.72)";
    ctx.lineWidth = 2;
    panelPath(x - 24, y - 20, 48, 40, 8);
    ctx.stroke();
    ctx.fillStyle = "#061022";
    ctx.font = "900 28px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, x, y + 2);
    ctx.fillStyle = "rgba(255,255,255,.62)";
    ctx.fillRect(x - 14, y - 14, 16, 3);
    ctx.restore();
  }
  function drawBlock(bl) {
    if (bl.broken) return; const x = bl.x, y = bl.y, w = bl.w, h = bl.h;
    ctx.fillStyle = "rgba(0,0,0,.24)";
    panelPath(x + 4, y + 6, w, h, 6);
    ctx.fill();
    if (bl.type === "prize") {
      const pg = ctx.createLinearGradient(x, y, x + w, y + h);
      pg.addColorStop(0, bl.used ? "#8a7a3a" : "#ffe879");
      pg.addColorStop(1, bl.used ? "#5f552f" : "#ff9f24");
      ctx.fillStyle = pg; panelPath(x, y, w, h, 7); ctx.fill(); ctx.strokeStyle = bl.used ? "#6a5a2a" : "#9a5a14"; ctx.lineWidth = 3; panelPath(x, y, w, h, 7); ctx.stroke();
      ctx.fillStyle = bl.used ? "#6a5a2a" : "#20140a"; ctx.font = "900 24px Fredoka,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", x + w / 2, y + h / 2 + 1);
    } else {
      const bg = ctx.createLinearGradient(x, y, x + w, y + h);
      bg.addColorStop(0, "#d6813e");
      bg.addColorStop(1, "#7a3d18");
      ctx.fillStyle = bg; panelPath(x, y, w, h, 5); ctx.fill(); ctx.strokeStyle = "#5b2c12"; ctx.lineWidth = 3; panelPath(x, y, w, h, 5); ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,.22)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h / 2); ctx.stroke();
    }
  }
  function drawHeart(x, y) { ctx.save(); ctx.shadowColor = "rgba(255,90,120,.7)"; ctx.shadowBlur = 14; ctx.fillStyle = "#ff5a78"; const s = 13; ctx.beginPath(); ctx.moveTo(x, y + s * 0.7); ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.5, y - s, x, y - s * 0.35); ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.4, x, y + s * 0.7); ctx.fill(); ctx.restore(); }
  function drawStarToken(x, y, tt) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tt * 1.2); ctx.shadowColor = "rgba(255,214,90,.7)"; ctx.shadowBlur = 12; ctx.fillStyle = "#ffd34e"; ctx.strokeStyle = "#b7841a"; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const r = i % 2 === 0 ? 13 : 5.5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function drawSpring(sp) {
    const y = groundY(); const press = sp.press > 0 ? 8 : 0; sp.press = Math.max(0, sp.press - 0.02);
    ctx.save();
    ctx.fillStyle = "#c9331f"; rr(sp.x - 14, y - 10 + press, 28, 10 - press, 4); ctx.fill();
    ctx.strokeStyle = "#9aa4b2"; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) { const yy = y - 12 - i * 6 + press; ctx.beginPath(); ctx.moveTo(sp.x - 11, yy); ctx.lineTo(sp.x + 11, yy - 3); ctx.stroke(); }
    ctx.fillStyle = "#e8524a"; rr(sp.x - 15, y - 32 + press, 30, 8, 4); ctx.fill();
    ctx.restore();
  }
  function drawFoe(f) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath(); ctx.ellipse(f.x, f.baseY + 18, 16, 5, 0, 0, 7); ctx.fill();
    const gim = SPR["foe-" + f.type] || (f.type === "walker" ? SPR.grumper : null);
    if (gim && gim.width) {
      const h = f.type === "flyer" ? 40 : 46;
      const w = gim.width / gim.height * h;
      ctx.translate(f.x, 0); ctx.scale(-f.dir, 1);
      ctx.drawImage(gim, -w / 2, f.y + 22 - h, w, h); // FEET at f.y+22 — anchored, never floats
      ctx.restore();
      return;
    }
    // Canvas fallbacks (ship these — sprites are optional polish):
    ctx.translate(f.x, f.y);
    if (f.type === "spike") {
      ctx.fillStyle = "#8a3bb8";
      for (let i = 0; i < 7; i += 1) { const a = -Math.PI + (i / 6) * Math.PI; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14 + 2); ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26 + 2); ctx.lineTo(Math.cos(a + 0.28) * 14, Math.sin(a + 0.28) * 14 + 2); ctx.closePath(); ctx.fill(); }
      const sg = ctx.createLinearGradient(0, -16, 0, 16); sg.addColorStop(0, "#b45de0"); sg.addColorStop(1, "#7a2aa8"); ctx.fillStyle = sg;
      rr(-16, -14, 32, 32, 12); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-6, -2, 4, 0, 7); ctx.arc(6, -2, 4, 0, 7); ctx.fill();
      ctx.fillStyle = "#1a0a24"; ctx.beginPath(); ctx.arc(-6 + f.dir * 2, -2, 2, 0, 7); ctx.arc(6 + f.dir * 2, -2, 2, 0, 7); ctx.fill();
    } else if (f.type === "hopper") {
      const squish = f.y === f.baseY ? 0.15 : -0.12;
      ctx.scale(1 + squish, 1 - squish);
      const hg = ctx.createLinearGradient(0, -20, 0, 18); hg.addColorStop(0, "#4aa3ff"); hg.addColorStop(1, "#1f5fd0"); ctx.fillStyle = hg;
      rr(-14, -20, 28, 38, 12); ctx.fill();
      ctx.fillStyle = "#173a6b"; rr(-13, 14, 9, 8, 3); ctx.fill(); rr(4, 14, 9, 8, 3); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-5, -8, 4.5, 0, 7); ctx.arc(6, -8, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = "#0a1a2e"; ctx.beginPath(); ctx.arc(-5 + f.dir * 2, -8, 2.2, 0, 7); ctx.arc(6 + f.dir * 2, -8, 2.2, 0, 7); ctx.fill();
    } else if (f.type === "flyer") {
      const flap = Math.sin(f.t * 10) * 10;
      ctx.fillStyle = "#e8a13c";
      ctx.beginPath(); ctx.ellipse(-16, -2 - flap * 0.4, 12, 6, -0.5 - flap * 0.03, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16, -2 - flap * 0.4, 12, 6, 0.5 + flap * 0.03, 0, 7); ctx.fill();
      const fg = ctx.createLinearGradient(0, -14, 0, 12); fg.addColorStop(0, "#ffcf5e"); fg.addColorStop(1, "#e08b1f"); ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-5, -3, 4, 0, 7); ctx.arc(5, -3, 4, 0, 7); ctx.fill();
      ctx.fillStyle = "#2e1a05"; ctx.beginPath(); ctx.arc(-5 + f.dir * 2, -3, 2, 0, 7); ctx.arc(5 + f.dir * 2, -3, 2, 0, 7); ctx.fill();
    } else {
      const gg = ctx.createLinearGradient(0, -18, 0, 14); gg.addColorStop(0, "#ff6b57"); gg.addColorStop(1, "#c9331f"); ctx.fillStyle = gg;
      rr(-16, -16, 32, 30, 10); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-6, -4, 4.5, 0, 7); ctx.arc(6, -4, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = "#0a1a12"; ctx.beginPath(); ctx.arc(-6 + f.dir * 2, -4, 2.2, 0, 7); ctx.arc(6 + f.dir * 2, -4, 2.2, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function drawPlayer() {
    const p = player; if (invuln > 0 && Math.floor(invuln * 12) % 2 === 0) return;
    const sq = p.squash, sx = 1 - sq, sy = 1 + sq, bob = p.onGround ? Math.sin(p.anim) * 1.5 : 0;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.34)"; ctx.beginPath(); ctx.ellipse(p.x, groundY() - 2 > p.y + 22 ? p.y + 24 : groundY() - 2, 23, 6, 0, 0, 7); ctx.fill();
    ctx.translate(p.x, p.y + bob); ctx.scale(p.face * sx, sy);
    const cim = currentChar();
    if (cim && cim.width) {
      const h = 72, w = cim.width / cim.height * h;
      ctx.shadowColor = "rgba(126,232,255,.42)";
      ctx.shadowBlur = 14;
      ctx.drawImage(cim, -w / 2, -h / 2 - 8, w, h);
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#8ff6ff";
      panelPath(-w / 2 + 4, -h / 2 - 6, w - 8, h - 6, 12);
      ctx.fill();
      ctx.restore();
      return;
    }
    const lk = p.onGround ? Math.sin(p.anim) * 5 : 5; ctx.fillStyle = "#2f7a4b"; rr(-10, 12, 8, 11 + lk, 3); ctx.fill(); rr(2, 12, 8, 11 - lk, 3); ctx.fill();
    const bg = ctx.createLinearGradient(0, -18, 0, 16); bg.addColorStop(0, "#7cf0b6"); bg.addColorStop(1, "#34c589"); ctx.fillStyle = bg; rr(-15, -18, 30, 34, 13); ctx.fill(); ctx.strokeStyle = "#0f6b48"; ctx.lineWidth = 2; rr(-15, -18, 30, 34, 13); ctx.stroke();
    ctx.fillStyle = "#d6fbe8"; rr(-9, -2, 18, 14, 8); ctx.fill();
    const blink = idleT > 2 && Math.floor(idleT * 2.5) % 5 === 0; // idle blink (Mission 5)
    ctx.fillStyle = "#0a1a12";
    if (blink) { ctx.fillRect(-6, -9, 5, 1.6); ctx.fillRect(4, -9, 5, 1.6); }
    else { ctx.beginPath(); ctx.arc(-4, -8, 3.2, 0, 7); ctx.arc(7, -8, 3.2, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function drawBgImage() {
    const im = BGIMG[world];
    if (!im || !im.width) return false;
    const scale = H / im.height, iw = im.width * scale, shift = cam * 0.35;
    for (let i = Math.floor(shift / iw) - 1; i * iw - shift < W + iw; i += 1) {
      const x = i * iw - shift; ctx.save();
      if (((i % 2) + 2) % 2 === 1) { ctx.translate(x + iw, 0); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, iw, H); }
      else ctx.drawImage(im, x, 0, iw, H);
      ctx.restore();
    }
    drawDepthScenery(Date.now() * 0.001);
    const sh = ctx.createLinearGradient(0, H - GROUND_H - 70, 0, H - GROUND_H); sh.addColorStop(0, "rgba(6,10,20,0)"); sh.addColorStop(1, "rgba(6,10,20,.28)"); ctx.fillStyle = sh; ctx.fillRect(0, H - GROUND_H - 70, W, 70);
    return true;
  }
  function draw() {
    if (!level) return;
    const t = Date.now() * 0.001;
    if (!drawBgImage()) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, theme.sky[0]); g.addColorStop(0.55, theme.sky[1]); g.addColorStop(1, theme.sky[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const gx = W * 0.8, gy = H * 0.2; const cg = ctx.createRadialGradient(gx, gy, 10, gx, gy, 180); cg.addColorStop(0, theme.sun); cg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
      drawDepthScenery(t);
      treeRow(theme.treeDark, 0.2, H - GROUND_H + 6, 150, 90, 0.28); treeRow(theme.tree, 0.45, H - GROUND_H + 14, 220, 140, 0.6);
    }
    for (const s of spores) { const sx = ((s.x - cam * 0.5) % (W + 60) + W + 60) % (W + 60) - 30; const sy = s.y + Math.sin(t * 0.8 + s.ph) * 14; ctx.globalAlpha = 0.5; ctx.fillStyle = theme.moon ? "#ffe9a0" : "#ffffff"; ctx.beginPath(); ctx.arc(sx, sy, s.s, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    const shx = (shakeT > 0 && !reduceMotion) ? (Math.random() - 0.5) * 6 * (shakeT / 0.22) : 0;
    const shy = (shakeT > 0 && !reduceMotion) ? (Math.random() - 0.5) * 6 * (shakeT / 0.22) : 0;
    ctx.save(); ctx.translate(-cam + shx, shy);
    let x = 0; const dg = ctx.createLinearGradient(0, groundY(), 0, H); dg.addColorStop(0, theme.dirt[0]); dg.addColorStop(1, theme.dirt[1]); ctx.fillStyle = dg; ctx.fillRect(0, groundY() + 16, level.L, GROUND_H);
    for (const p of level.pits) { grassStrip(x, p[0] - x); x = p[1]; } grassStrip(x, level.L - x);
    for (const pl of level.plats) platform(pl);
    for (const sp of level.springs) drawSpring(sp);
    for (const bl of level.blocks) drawBlock(bl);
    for (const hp of level.pickups) { if (!hp.taken) drawHeart(hp.x, hp.y + Math.sin(t * 3 + hp.x) * 4); }
    ctx.strokeStyle = "#d8f5ff"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(level.flag, groundY()); ctx.lineTo(level.flag, groundY() - 138); ctx.stroke();
    ctx.strokeStyle = "rgba(47,131,255,.65)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(level.flag + 9, groundY() - 8); ctx.lineTo(level.flag + 9, groundY() - 132); ctx.stroke();
    { // Mission 5: waving 3-segment pennant; glows gold once the stage is completable.
      const fx = level.flag, fy = groundY() - 130; const canFinish = wIx >= words.length - 1 && nextIx >= word.length;
      ctx.save(); if (canFinish) { ctx.shadowColor = "rgba(255,214,90,.9)"; ctx.shadowBlur = 16; }
      ctx.fillStyle = canFinish ? "#ffe879" : "#8ff6ff"; ctx.beginPath(); ctx.moveTo(fx, fy);
      for (let s = 0; s <= 3; s += 1) { const u = s / 3; ctx.lineTo(fx + u * 56, fy + 6 + Math.sin(t * 6 + s) * 4); }
      for (let s = 3; s >= 0; s -= 1) { const u = s / 3; ctx.lineTo(fx + u * 56 - 9, fy + 28 + Math.sin(t * 6 + s) * 4); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    for (const b of level.bubbles) { if (b.taken) continue; const bob = Math.sin(t * 2.4 + b.x) * 4; bubble(b.x, b.y + bob, b.ch); }
    for (const cn of level.coins) { if (cn.taken) continue; const wob = Math.abs(Math.cos(t * 4 + cn.x)); ctx.save(); ctx.fillStyle = "#ffd34e"; ctx.strokeStyle = "#b7841a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cn.x, cn.y + Math.sin(t * 3 + cn.x) * 3, 9 * wob + 1, 10, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.arc(cn.x - 2, cn.y - 3, 2, 0, 7); ctx.fill(); ctx.restore(); }
    for (const st of level.stars) { if (!st.taken) drawStarToken(st.x, st.y + Math.sin(t * 2 + st.x) * 4, t); }
    for (const f of level.foes) drawFoe(f);
    if (player) drawPlayer();
    for (const pt of particles) { ctx.globalAlpha = Math.max(0, pt.life / 0.6); ctx.fillStyle = pt.c; ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.font = "700 18px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const fl of floats) { ctx.globalAlpha = Math.max(0, fl.life / 0.8); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(6,10,20,.85)"; ctx.strokeText(fl.txt, fl.x, fl.y); ctx.fillStyle = "#fff"; ctx.fillText(fl.txt, fl.x, fl.y); ctx.globalAlpha = 1; }
    ctx.restore();
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.85); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.28)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // Low-hearts tension: the vignette pulses subtly red at 1 heart.
    if (hearts <= 1 && !reduceMotion) {
      const a = (0.16 + Math.abs(Math.sin(t * 4)) * 0.16).toFixed(3);
      const rv = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9); rv.addColorStop(0, "rgba(255,40,60,0)"); rv.addColorStop(1, "rgba(255,30,50," + a + ")"); ctx.fillStyle = rv; ctx.fillRect(0, 0, W, H);
    }
    if (starFlash > 0) { ctx.fillStyle = "rgba(255,214,90," + (starFlash * 0.4).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
    drawPs2Overlay(t);
  }

  // ── art (committed webp). Per-world playable-character roster so different
  // pals appear on different levels; falls back to char-hero until the art lands.
  // Moonwood keeps the current sprout hero; meadow/dino get their own pals. ──
  // Crop transparent padding off a sprite once at load — padding is why enemies
  // and pals appeared to FLOAT above the ground.
  function alphaTrim(img) {
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let top = c.height, left = c.width, right = 0, bottom = 0;
    for (let py = 0; py < c.height; py += 1) {
      for (let px = 0; px < c.width; px += 1) {
        if (d[(py * c.width + px) * 4 + 3] > 12) {
          if (px < left) left = px;
          if (px > right) right = px;
          if (py < top) top = py;
          if (py > bottom) bottom = py;
        }
      }
    }
    if (right <= left || bottom <= top) return img;
    const out = document.createElement("canvas");
    out.width = right - left + 1; out.height = bottom - top + 1;
    out.getContext("2d").drawImage(img, -left, -top);
    return out;
  }
  const CHAR_ROSTER = {
    meadow: ["char-meadow-a.webp", "char-meadow-b.webp", "char-meadow-c.webp"],
    dino: ["char-dino-a.webp", "char-dino-b.webp", "char-dino-c.webp"],
    moonwood: ["char-hero.webp", "char-moonwood-a.webp", "char-moonwood-b.webp"]
  };
  const BGIMG = {}, SPR = {}, charImgs = [];
  const heroImg = new Image(); heroImg.src = "/images/games/char-hero.webp";
  ["meadow", "dino", "moonwood"].forEach(k => { const im = new Image(); im.onload = () => { BGIMG[k] = im; }; im.src = "/images/games/bg-" + k + ".webp"; });
  (CHAR_ROSTER[world] || []).forEach((file, i) => { const im = new Image(); im.onload = () => { try { charImgs[i] = alphaTrim(im); } catch { charImgs[i] = im; } }; im.src = "/images/games/" + file; });
  const currentChar = () => {
    const roster = CHAR_ROSTER[world] || [];
    const idx = roster.length ? stageIdx % roster.length : 0;   // one stable pal per stage — no load-swap/cycling
    return (charImgs[idx] && charImgs[idx].width) ? charImgs[idx] : (heroImg.width ? heroImg : null);
  };
  const sprLoad = (key, file) => { const im = new Image(); im.onload = () => { try { SPR[key] = alphaTrim(im); } catch { SPR[key] = im; } }; im.src = "/images/games/" + file; };
  sprLoad("grumper", "enemy-grumper.webp");
  sprLoad("platform", "tile-platform.webp");

  function loop(now) { rafId = requestAnimationFrame(loop); const dt = Math.min(0.05, ((now - last) || 16) / 1000); last = now; update(dt); draw(); }
  rafId = requestAnimationFrame(loop);
  startStage();

  let paused = false, savedRunning = false;
  function pause() { if (paused) return; paused = true; savedRunning = running; running = false; }
  function resume() { if (!paused) return; paused = false; last = performance.now(); if (savedRunning) running = true; }
  function teardown() {
    running = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp);
    holders.forEach(([el, down, up]) => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointerup", up); el.removeEventListener("pointerleave", up); });
    ro.disconnect();
    [cv, hud, padWrap, overlay].forEach(n => { try { n.remove(); } catch { /* ignore */ } });
  }
  return { teardown, pause, resume };
}

export default function LetterLeapGame({ difficulty = "easy", startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const mountRef = useRef(null);
  const soundRef = useRef(isSoundEnabled);
  const [ready] = useState(true);
  useEffect(() => { soundRef.current = isSoundEnabled; }, [isSoundEnabled]);
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
    if (onEngineReady) onEngineReady(api);
    return () => { try { api.teardown(); } catch { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);
  return (
    <div
      className="letter-leap"
      ref={mountRef}
      style={{ position: "relative", width: "100%", height: "100%", minHeight: "460px", overflow: "hidden", background: "#0a1020", touchAction: "none" }}
      data-ready={ready ? "1" : "0"}
    />
  );
}
