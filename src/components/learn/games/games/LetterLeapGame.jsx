import { useEffect, useRef, useState } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playCelebrationFanfare,
  playTapSound
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

const GRAV = 0.62, MOVE = 4.2, JUMP = 13.6, GROUND_H = 96;
const SEG = 380, WORD_GAP = 460, MAXH = 5;

function startGame(mount, opts) {
  const world = worldForGameDifficulty(opts.difficulty);
  const theme = WORLD_THEME[world] || WORLD_THEME.meadow;
  const ladder = difficultyLadder("letter-leap", opts.difficulty);
  const sfx = fn => { try { if (opts.getSound && opts.getSound()) fn(); } catch { /* audio optional */ } };

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
    '<div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(6,12,26,.5);padding:8px 16px 10px;border-radius:16px;border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(6px)">' +
      '<span data-ll="lab" style="font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;opacity:.75">Spell the word</span>' +
      '<div data-ll="word" style="display:flex;gap:7px"></div></div>' +
    '<div data-ll="hearts" style="position:absolute;top:14px;right:16px;font-size:1.5rem;letter-spacing:2px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">❤❤❤</div>' +
    '<div data-ll="world" style="position:absolute;top:52px;right:16px;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;opacity:.85;background:rgba(6,12,26,.5);padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14)">Meadow</div>';
  mount.appendChild(hud);
  const elWord = hud.querySelector('[data-ll="word"]');
  const elLab = hud.querySelector('[data-ll="lab"]');
  const elHearts = hud.querySelector('[data-ll="hearts"]');
  const elWorld = hud.querySelector('[data-ll="world"]');

  const padWrap = document.createElement("div");
  padWrap.style.cssText = "position:absolute;inset:0;z-index:6;pointer-events:none";
  padWrap.innerHTML =
    '<div style="position:absolute;bottom:20px;left:20px;display:flex;gap:12px;pointer-events:auto">' +
      '<button data-ll="left" style="width:66px;height:66px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:1.6rem;font-weight:700;backdrop-filter:blur(4px)">◀</button>' +
      '<button data-ll="right" style="width:66px;height:66px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;font-size:1.6rem;font-weight:700;backdrop-filter:blur(4px)">▶</button></div>' +
    '<div style="position:absolute;bottom:20px;right:20px;pointer-events:auto">' +
      '<button data-ll="jump" style="width:86px;height:86px;border-radius:50%;border:0;background:linear-gradient(160deg,#ffd34e,#ffab1e);color:#20140a;font-size:1rem;font-weight:700;box-shadow:0 6px 0 #c9781a">JUMP</button></div>';
  mount.appendChild(padWrap);

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:24px;z-index:20;background:radial-gradient(120% 90% at 50% 25%,rgba(20,40,70,.72),rgba(6,10,22,.94))";
  mount.appendChild(overlay);

  // ── state ────────────────────────────────────────────────────────────────
  const keys = { left: false, right: false, jump: false };
  let player, level, words, wIx, word, nextIx, hearts, running = false, cam = 0, last = 0, invuln = 0;
  let particles = [], spores = [];
  let score = 0, wrongHits = 0, deaths = 0, wordsDoneGlobal = 0;
  const startLevel = Math.max(0, Math.min(Number(opts.startLevel) || 0, ladder.length - 1));
  const stageQueue = makeCatchUp(ladder.map((_, i) => i).slice(startLevel)); // resume mid-ladder; a failed stage returns later
  let stageIdx = 0;
  let legs = null, legIx = 0; // sentence stages: the sentences to build, in order
  let rafId = 0;

  function addScore(n) { score += n; opts.onScoreUpdate && opts.onScoreUpdate(score); }
  function groundY() { return H - GROUND_H; }

  function makeLevel(levelWords, worldKey, levelIndex) {
    const plats = [], bubbles = [], blocks = [], pickups = [], letterX = [];
    let cx = 320;
    levelWords.forEach((up, wi) => {
      for (let i = 0; i < up.length; i += 1) {
        bubbles.push({ x: cx, y: groundY() - 46, ch: up[i], word: wi, order: i, taken: false });
        letterX.push(cx); cx += SEG;
      }
      if (wi < levelWords.length - 1) { plats.push({ x: cx - WORD_GAP * 0.5 - 60, y: groundY() - 104, w: 120 }); cx += WORD_GAP; }
    });
    const flag = cx + 200, L = cx + 360;

    // Difficulty ramp: harder world + higher level = MORE grumpers, wrong letters, pits.
    const bump = { meadow: 0, dino: 2, moonwood: 4 }[worldKey] || 0;
    const foeCount = 3 + Math.round(levelIndex * 0.7) + bump;
    const decoyCount = 2 + Math.round(levelIndex * 0.6) + bump;
    const pitCount = 1 + Math.round(levelIndex * 0.4);
    const blockCount = 2 + Math.round(levelIndex * 0.3);
    const heartCount = 1 + Math.round(levelIndex * 0.2);

    // Candidate slots = clear ground BETWEEN the required letters, so a hazard
    // never blocks a letter the child must collect. Guaranteed placement (not
    // random gates) so every level — including the hard/long-word ones — is busy.
    const slots = [];
    for (let i = 0; i < letterX.length - 1; i += 1) {
      const mx = (letterX[i] + letterX[i + 1]) / 2;
      if (mx > 520 && mx < flag - 220 && letterX[i + 1] - letterX[i] > 200) slots.push(mx);
    }
    for (let i = slots.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
    let s = 0;
    const take = () => (s < slots.length ? slots[s++] : null);
    // Never let a wrong-letter be a letter the child actually needs this stage —
    // grabbing the "B" the HUD asked for must never punish them. Exclude EVERY
    // letter of EVERY word in the stage from the decoy pool.
    const inWords = new Set(levelWords.join("").toUpperCase().split(""));
    const decoyPool = "BDFGJKMPQVXZ".split("").filter(c => !inWords.has(c));

    const pits = [];
    for (let k = 0; k < Math.min(pitCount, Math.floor(slots.length / 3)); k += 1) { const c = take(); if (c != null) pits.push([c - 44, c + 44]); }
    const foes = [];
    for (let k = 0; k < foeCount; k += 1) { const c = take(); if (c != null) foes.push({ x0: c - 62, x1: c + 62, x: c, dir: 1, y: groundY() - 14 }); }
    // Wrong letters sit at GROUND level among the real ones — the child must READ
    // and jump over them (grabbing one costs a heart). Makes the run less trivial.
    for (let k = 0; k < decoyCount && decoyPool.length; k += 1) { const c = take(); if (c != null) bubbles.push({ x: c, y: groundY() - 46, ch: decoyPool[Math.floor(Math.random() * decoyPool.length)], word: -1, order: -1, taken: false }); }
    for (let k = 0; k < blockCount; k += 1) { const c = take(); if (c != null) { const n = 1 + Math.floor(Math.random() * 2); for (let j = 0; j < n; j += 1) blocks.push({ x: c + j * 46 - 23, y: groundY() - 140, w: 44, h: 40, type: Math.random() < 0.3 ? "prize" : "brick", broken: false, used: false }); } }
    for (let k = 0; k < heartCount; k += 1) { const c = take(); if (c != null) pickups.push({ x: c, y: groundY() - 150, taken: false }); }

    return { L, pits, plats, blocks, pickups, bubbles, foes, flag };
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
    renderWord(); updateHearts();
    opts.onProgressUpdate && opts.onProgressUpdate(wordsDoneGlobal, totalWords);
    opts.onCheckpoint && opts.onCheckpoint(stageIdx, LEVELS_PER_DIFFICULTY);
  }

  function renderWord() {
    elWord.innerHTML = "";
    for (let i = 0; i < word.length; i += 1) {
      const s = document.createElement("div");
      const done = i < nextIx, isNext = i === nextIx;
      s.style.cssText = "width:34px;height:44px;display:grid;place-items:center;font-size:1.5rem;font-weight:700;border-radius:10px;" +
        (done
          ? "background:linear-gradient(160deg,#ffd34e,#ffab1e);color:#20140a;border:2px solid #ffcf4a;box-shadow:0 3px 0 #c9781a"
          : isNext
            ? "background:rgba(255,255,255,.06);color:#fff;border:2px solid #ffd34e;box-shadow:0 0 14px rgba(255,211,77,.5)"
            : "background:rgba(255,255,255,.06);color:rgba(255,255,255,.34);border:2px solid rgba(255,255,255,.12)");
      s.textContent = word[i];
      elWord.appendChild(s);
    }
    elLab.textContent = elLab.dataset.sentence === "1"
      ? (elLab.dataset.goal || "Build the sentence")
      : "Word " + (wIx + 1) + " of " + words.length + " · spell it";
  }
  function updateHearts() { elHearts.textContent = "❤".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, 3 - hearts)); }

  function burst(x, y, c) { for (let i = 0; i < 12; i += 1) particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.7) * 6, life: 0.6, c }); }
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
    wordsDoneGlobal += 1; addScore(50);
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
    showOverlay("Stage complete! 🌟", "You spelled every word in " + theme.name + " Lvl " + (stageIdx + 1) + "!", "Next stage", () => { player = null; startStage(); });
  }
  function finishGame() {
    running = false; sfx(playStarChime);
    const stars = starRubric({ correct: wordsDoneGlobal, total: totalWords, mistakes: wrongHits, deaths });
    showOverlay("You did it! 🏆", "You climbed all of " + theme.name + "!", "Done", () => {});
    opts.onComplete && opts.onComplete(stars, score, wordsDoneGlobal);
  }

  function showOverlay(title, text, btnLabel, fn) {
    overlay.innerHTML =
      '<div><h1 style="font-size:clamp(1.6rem,6vw,2.6rem);margin:0">' + title + '</h1>' +
      '<p style="opacity:.9;margin:10px auto 22px;max-width:440px;line-height:1.4">' + text + '</p>' +
      '<button data-ll="cta" style="font-family:inherit;font-weight:700;font-size:1.15rem;color:#20140a;background:linear-gradient(160deg,#ffd34e,#ffab1e);border:0;padding:13px 30px;border-radius:999px;box-shadow:0 6px 0 #c9781a;cursor:pointer">' + btnLabel + '</button></div>';
    overlay.style.display = "grid";
    overlay.querySelector('[data-ll="cta"]').onclick = () => { overlay.style.display = "none"; sfx(playTapSound); fn(); };
  }

  // ── input ─────────────────────────────────────────────────────────────────
  const onKeyDown = e => { if (e.key === "ArrowLeft") keys.left = true; else if (e.key === "ArrowRight") keys.right = true; else if (e.key === " " || e.key === "ArrowUp") { keys.jump = true; e.preventDefault(); } };
  const onKeyUp = e => { if (e.key === "ArrowLeft") keys.left = false; else if (e.key === "ArrowRight") keys.right = false; else if (e.key === " " || e.key === "ArrowUp") keys.jump = false; };
  window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);
  const holders = [];
  const hold = (sel, k) => {
    const el = padWrap.querySelector(sel);
    const down = e => { e.preventDefault(); keys[k] = true; };
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
    p.vx = (keys.right ? MOVE : 0) - (keys.left ? MOVE : 0);
    if (keys.jump && p.onGround) { p.vy = -JUMP; p.onGround = false; p.squash = -0.3; sfx(playTapSound); }
    p.vy += GRAV; if (p.vy > 18) p.vy = 18;
    p.x += p.vx; if (p.vx) p.face = p.vx > 0 ? 1 : -1; p.anim += Math.abs(p.vx) * 0.07;
    p.y += p.vy;
    const wasAir = !p.onGround; p.onGround = false;
    const feet = p.y + p.h / 2;
    for (const pl of level.plats) { if (p.x + p.w / 2 > pl.x && p.x - p.w / 2 < pl.x + pl.w && p.vy >= 0 && feet >= pl.y && feet <= pl.y + 24) { p.y = pl.y - p.h / 2; p.vy = 0; p.onGround = true; p.spawnX = p.x; } }
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
    if (p.onGround && wasAir) p.squash = 0.35;
    p.squash *= 0.8;
    if (p.x < 18) p.x = 18;
    // Catch-up: if the letter they still need is now behind them (walked or jumped
    // past it), slide it back in front — a skipped letter never softlocks the word.
    const need = level.bubbles.find(b => !b.taken && b.word === wIx && b.order === nextIx);
    if (need && need.x < p.x - 40) { need.x = p.x + 320; need.y = groundY() - 46; }
    for (const b of level.bubbles) {
      if (b.taken) continue;
      if (Math.abs(b.x - p.x) < 34 && Math.abs(b.y - p.y) < 42) {
        if (b.word === -1) { b.taken = true; burst(b.x, b.y, "#ff7a66"); hurt(); }
        else if (b.word === wIx && b.order === nextIx) {
          b.taken = true; nextIx += 1; sfx(playPopSound); addScore(10); burst(b.x, b.y, "#ffd34e");
          if (nextIx >= word.length) wordDone(); else renderWord();
        }
      }
    }
    for (const hp of level.pickups) { if (hp.taken) continue; if (Math.abs(hp.x - p.x) < 28 && Math.abs(hp.y - p.y) < 32) { hp.taken = true; hearts = Math.min(MAXH, hearts + 1); updateHearts(); sfx(playStarChime); burst(hp.x, hp.y, "#ff6b8a"); } }
    for (const f of level.foes) {
      f.x += f.dir * 1.5; if (f.x < f.x0 || f.x > f.x1) f.dir *= -1;
      if (Math.abs(f.x - p.x) < 28 && Math.abs(f.y - p.y) < 34) { if (p.vy > 2 && p.y < f.y - 6) { f.dead = true; p.vy = -9; sfx(playPopSound); burst(f.x, f.y, "#a0ffb0"); } else hurt(); }
    }
    level.foes = level.foes.filter(f => !f.dead);
    const stageDone = (wIx >= words.length - 1) && (nextIx >= word.length);
    if (p.x > level.flag && stageDone) {
      if (legs && legIx < legs.length - 1) { nextLeg(); return; }
      clearStage();
    } else if (p.x > level.flag && !stageDone) p.x = level.flag - 4;
    cam = Math.max(0, Math.min(level.L - W, p.x - W * 0.35));
    for (const pt of particles) { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.3; pt.life -= dt; }
    particles = particles.filter(pt => pt.life > 0);
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
  function grassStrip(x, w) { if (w <= 0) return; ctx.fillStyle = theme.ground; ctx.fillRect(x, groundY(), w, 20); ctx.fillStyle = theme.grass; ctx.beginPath(); ctx.moveTo(x, groundY() + 4); for (let gx = x; gx <= x + w; gx += 14) { ctx.lineTo(gx, groundY() - 3); ctx.lineTo(gx + 7, groundY() + 3); } ctx.lineTo(x + w, groundY() + 8); ctx.lineTo(x, groundY() + 8); ctx.closePath(); ctx.fill(); }
  function platform(pl) {
    ctx.fillStyle = "rgba(0,0,0,.22)"; rr(pl.x + 4, pl.y + 8, pl.w, 22, 10); ctx.fill();
    const im = SPR.platform;
    if (im && im.width) { ctx.save(); rr(pl.x, pl.y, pl.w, 28, 10); ctx.clip(); const th = 46, tw = im.width / im.height * th; for (let gx = pl.x; gx < pl.x + pl.w; gx += tw) ctx.drawImage(im, gx, pl.y - 6, tw, th); ctx.restore(); return; }
    const dg = ctx.createLinearGradient(0, pl.y, 0, pl.y + 24); dg.addColorStop(0, theme.grass); dg.addColorStop(0.3, theme.ground); dg.addColorStop(1, theme.dirt[0]); ctx.fillStyle = dg; rr(pl.x, pl.y, pl.w, 24, 10); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.18)"; rr(pl.x + 5, pl.y + 3, pl.w - 10, 4, 2); ctx.fill();
  }
  function bubble(x, y, ch) {
    ctx.save(); ctx.shadowColor = "rgba(95,224,160,.7)"; ctx.shadowBlur = 18;
    const rg = ctx.createRadialGradient(x - 6, y - 6, 3, x, y, 22); rg.addColorStop(0, "#e8fff2"); rg.addColorStop(1, "#3fc98a"); ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(x, y, 21, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(x - 6, y - 7, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#0a1a12"; ctx.font = "700 23px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ch, x, y + 1); ctx.restore();
  }
  function drawBlock(bl) {
    if (bl.broken) return; const x = bl.x, y = bl.y, w = bl.w, h = bl.h;
    if (bl.type === "prize") {
      ctx.fillStyle = bl.used ? "#8a7a3a" : "#ffcf4a"; rr(x, y, w, h, 7); ctx.fill(); ctx.strokeStyle = "#7a5a10"; ctx.lineWidth = 3; rr(x, y, w, h, 7); ctx.stroke();
      ctx.fillStyle = bl.used ? "#6a5a2a" : "#7a5a10"; ctx.font = "700 24px Fredoka,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", x + w / 2, y + h / 2 + 1);
    } else {
      ctx.fillStyle = "#b5602f"; rr(x, y, w, h, 5); ctx.fill(); ctx.strokeStyle = "#7a3d18"; ctx.lineWidth = 3; rr(x, y, w, h, 5); ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,.22)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h / 2); ctx.stroke();
    }
  }
  function drawHeart(x, y) { ctx.save(); ctx.shadowColor = "rgba(255,90,120,.7)"; ctx.shadowBlur = 14; ctx.fillStyle = "#ff5a78"; const s = 13; ctx.beginPath(); ctx.moveTo(x, y + s * 0.7); ctx.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.5, y - s, x, y - s * 0.35); ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.4, x, y + s * 0.7); ctx.fill(); ctx.restore(); }
  function grumper(f) {
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(f.x, f.y + 16, 18, 5, 0, 0, 7); ctx.fill();
    const gim = SPR.grumper;
    if (gim && gim.width) { const h = 48, w = gim.width / gim.height * h; ctx.translate(f.x, f.y); ctx.scale(-f.dir, 1); ctx.drawImage(gim, -w / 2, -h / 2 - 4, w, h); ctx.restore(); return; }
    const gg = ctx.createLinearGradient(0, f.y - 18, 0, f.y + 14); gg.addColorStop(0, "#ff6b57"); gg.addColorStop(1, "#c9331f"); ctx.fillStyle = gg; rr(f.x - 16, f.y - 16, 32, 30, 10); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(f.x - 6, f.y - 4, 4.5, 0, 7); ctx.arc(f.x + 6, f.y - 4, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#0a1a12"; ctx.beginPath(); ctx.arc(f.x - 6 + f.dir * 2, f.y - 4, 2.2, 0, 7); ctx.arc(f.x + 6 + f.dir * 2, f.y - 4, 2.2, 0, 7); ctx.fill(); ctx.restore();
  }
  function drawPlayer() {
    const p = player; if (invuln > 0 && Math.floor(invuln * 12) % 2 === 0) return;
    const sq = p.squash, sx = 1 - sq, sy = 1 + sq, bob = p.onGround ? Math.sin(p.anim) * 1.5 : 0;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(p.x, groundY() - 2 > p.y + 22 ? p.y + 24 : groundY() - 2, 16, 5, 0, 0, 7); ctx.fill();
    ctx.translate(p.x, p.y + bob); ctx.scale(p.face * sx, sy);
    const cim = currentChar();
    if (cim && cim.width) { const h = 66, w = cim.width / cim.height * h; ctx.drawImage(cim, -w / 2, -h / 2 - 6, w, h); ctx.restore(); return; }
    const lk = p.onGround ? Math.sin(p.anim) * 5 : 5; ctx.fillStyle = "#2f7a4b"; rr(-10, 12, 8, 11 + lk, 3); ctx.fill(); rr(2, 12, 8, 11 - lk, 3); ctx.fill();
    const bg = ctx.createLinearGradient(0, -18, 0, 16); bg.addColorStop(0, "#7cf0b6"); bg.addColorStop(1, "#34c589"); ctx.fillStyle = bg; rr(-15, -18, 30, 34, 13); ctx.fill(); ctx.strokeStyle = "#0f6b48"; ctx.lineWidth = 2; rr(-15, -18, 30, 34, 13); ctx.stroke();
    ctx.fillStyle = "#d6fbe8"; rr(-9, -2, 18, 14, 8); ctx.fill();
    ctx.fillStyle = "#0a1a12"; ctx.beginPath(); ctx.arc(-4, -8, 3.2, 0, 7); ctx.arc(7, -8, 3.2, 0, 7); ctx.fill();
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
    const sh = ctx.createLinearGradient(0, H - GROUND_H - 70, 0, H - GROUND_H); sh.addColorStop(0, "rgba(6,10,20,0)"); sh.addColorStop(1, "rgba(6,10,20,.28)"); ctx.fillStyle = sh; ctx.fillRect(0, H - GROUND_H - 70, W, 70);
    return true;
  }
  function draw() {
    if (!level) return;
    const t = Date.now() * 0.001;
    if (!drawBgImage()) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, theme.sky[0]); g.addColorStop(0.55, theme.sky[1]); g.addColorStop(1, theme.sky[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const gx = W * 0.8, gy = H * 0.2; const cg = ctx.createRadialGradient(gx, gy, 10, gx, gy, 180); cg.addColorStop(0, theme.sun); cg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
      treeRow(theme.treeDark, 0.2, H - GROUND_H + 6, 150, 90, 0.28); treeRow(theme.tree, 0.45, H - GROUND_H + 14, 220, 140, 0.6);
    }
    for (const s of spores) { const sx = ((s.x - cam * 0.5) % (W + 60) + W + 60) % (W + 60) - 30; const sy = s.y + Math.sin(t * 0.8 + s.ph) * 14; ctx.globalAlpha = 0.5; ctx.fillStyle = theme.moon ? "#ffe9a0" : "#ffffff"; ctx.beginPath(); ctx.arc(sx, sy, s.s, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.save(); ctx.translate(-cam, 0);
    let x = 0; const dg = ctx.createLinearGradient(0, groundY(), 0, H); dg.addColorStop(0, theme.dirt[0]); dg.addColorStop(1, theme.dirt[1]); ctx.fillStyle = dg; ctx.fillRect(0, groundY() + 16, level.L, GROUND_H);
    for (const p of level.pits) { grassStrip(x, p[0] - x); x = p[1]; } grassStrip(x, level.L - x);
    for (const pl of level.plats) platform(pl);
    for (const bl of level.blocks) drawBlock(bl);
    for (const hp of level.pickups) { if (!hp.taken) drawHeart(hp.x, hp.y + Math.sin(t * 3 + hp.x) * 4); }
    ctx.strokeStyle = "#f2f2f2"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(level.flag, groundY()); ctx.lineTo(level.flag, groundY() - 130); ctx.stroke();
    ctx.fillStyle = "#ffd34e"; ctx.beginPath(); ctx.moveTo(level.flag, groundY() - 130); ctx.lineTo(level.flag + 44, groundY() - 112); ctx.lineTo(level.flag, groundY() - 94); ctx.closePath(); ctx.fill();
    for (const b of level.bubbles) { if (b.taken) continue; const bob = Math.sin(t * 2.4 + b.x) * 4; bubble(b.x, b.y + bob, b.ch); }
    for (const f of level.foes) grumper(f);
    if (player) drawPlayer();
    for (const pt of particles) { ctx.globalAlpha = Math.max(0, pt.life / 0.6); ctx.fillStyle = pt.c; ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.85); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.28)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  // ── art (committed webp). Per-world playable-character roster so different
  // pals appear on different levels; falls back to char-hero until the art lands.
  // Moonwood keeps the current sprout hero; meadow/dino get their own pals. ──
  const CHAR_ROSTER = {
    meadow: ["char-meadow-a.webp", "char-meadow-b.webp", "char-meadow-c.webp"],
    dino: ["char-dino-a.webp", "char-dino-b.webp", "char-dino-c.webp"],
    moonwood: ["char-hero.webp", "char-moonwood-a.webp", "char-moonwood-b.webp"]
  };
  const BGIMG = {}, SPR = {}, charImgs = [];
  const heroImg = new Image(); heroImg.src = "/images/games/char-hero.webp";
  ["meadow", "dino", "moonwood"].forEach(k => { const im = new Image(); im.onload = () => { BGIMG[k] = im; }; im.src = "/images/games/bg-" + k + ".webp"; });
  (CHAR_ROSTER[world] || []).forEach((file, i) => { const im = new Image(); im.onload = () => { charImgs[i] = im; }; im.src = "/images/games/" + file; });
  const currentChar = () => {
    const roster = CHAR_ROSTER[world] || [];
    const idx = roster.length ? stageIdx % roster.length : 0;   // one stable pal per stage — no load-swap/cycling
    return (charImgs[idx] && charImgs[idx].width) ? charImgs[idx] : (heroImg.width ? heroImg : null);
  };
  const sprLoad = (key, file) => { const im = new Image(); im.onload = () => { SPR[key] = im; }; im.src = "/images/games/" + file; };
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
