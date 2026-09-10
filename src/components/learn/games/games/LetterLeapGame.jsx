import { useEffect, useRef } from "react";
import "./LetterLeapGame.css";
import { CAST, HEROES } from "../../../../features/soundSeekers/v3/content/cast.js";
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
import { hasRecordedSpeech, speakWord } from "../../../../utils/learnGamesAudio.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import { getChildWordAsset } from "../../../../data/childAssets.js";
import { laneDirectionForKey, verticalDirectionForKey } from "../shared/premiumGameStandard.js";

// Letter Leap — a real side-scrolling platformer (ported from the approved
// preview) wired to the shared curriculum framework:
//   difficulty -> world + cast (low=meadow, mid=dino, high=moonwood),
//   10 ramped, no-repeat levels from curriculumLadder, sentences on the hard
//   world's top levels, and catch-up (a failed stage returns later; a missed
//   word's uncollected letters stay on their original platforms).
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
const FIXED_STEP = 1 / 60;
const MAX_RETINA_BACKING_PIXELS = 1_600_000;

function recordWordEvidence(completedKeys, stageIndex, sentenceLegIndex, wordIndex) {
  const evidenceKey = [stageIndex, sentenceLegIndex, wordIndex].join(":");
  const added = !completedKeys.has(evidenceKey);
  if (added) completedKeys.add(evidenceKey);
  return { added, count: completedKeys.size };
}

function buildLetterLeapChoicePlan(levelWords, worldKey, levelIndex, random = Math.random) {
  const words = levelWords.map(value => String(value).toUpperCase());
  const taught = [...new Set(words.join(""))];
  return words.map((up, wordIndex) => Array.from(up, (target, order) => {
    const pool = taught.filter(ch => ch !== target);
    const decoy = pool[Math.floor(random() * pool.length)] || (target === "A" ? "T" : "A");
    const targetFirst = random() < 0.5;
    // Two separate encounters along the trail, with identical appearance and
    // reachable terrain. Neither the first object nor the upper route predicts
    // the answer. Coordinates are assigned once and survive every retry.
    return {
      choiceId: wordIndex + ":" + order,
      choices: [targetFirst ? target : decoy, targetFirst ? decoy : target].map((ch, slot) => ({
        ch, word: ch === target ? wordIndex : -1, order, slot, offsetX: slot * 170,
        rise: slot === 1 ? (worldKey === "meadow" && levelIndex < 3 ? 72 : 96) : 0
      }))
    };
  }));
}

function letterLeapVelocity(velocity, axis, grounded) {
  const target = axis * MOVE;
  const acceleration = axis ? (grounded ? 0.78 : 0.48) : (grounded ? 1.05 : 0.3);
  const difference = target - velocity;
  return Math.abs(difference) <= acceleration ? target : velocity + Math.sign(difference) * acceleration;
}

function isLetterLeapCurrentChoice(choice, wordIndex, letterIndex) {
  return choice.decisionWord === wordIndex && choice.decisionOrder === letterIndex;
}

function collectLetterLeapChoice(choice) {
  // A pickup owns only its own removal. Its neighbour remains in the world.
  choice.taken = true;
}

function bounceLetterLeapSpring(player, spring, ground, previousFeet) {
  const feet = player.y + player.h / 2;
  const cap = ground - 32;
  const crossingCap = previousFeet <= cap + 4 && feet >= cap;
  const walkingOntoSpring = player.onGround && feet >= cap && feet <= ground + 1;
  if (player.vy < 0 || Math.abs(spring.x - player.x) >= 24 ||
      (!crossingCap && !walkingOntoSpring) || spring.press > 0) return false;
  player.y = cap - player.h / 2;
  player.vy = -19;
  player.springLaunch = true;
  player.onGround = false;
  player.stood = null;
  player.squash = -0.45;
  spring.press = 0.2;
  return true;
}

function buildLetterLeapTrail(x, ground, stage, encounter, world) {
  const plats = [], pits = [], springs = [], coins = [];
  const worldOffset = { meadow: 0, dino: 2, moonwood: 4 }[world] || 0;
  const sections = [];
  const roomWidth = 460 + (stage % 5) * 24;
  // Four playable rooms between spelling encounters. Each has a safe approach,
  // a different jump line and an optional upper reward route.
  for (let room = 0; room < 4; room += 1) {
    const left = x + room * roomWidth;
    const kind = (stage + Math.floor(stage / 3) + encounter * 5 + room * (stage % 2 ? 5 : 1) + worldOffset) % 6;
    sections.push({ x: left, kind });
    const shelf = (dx, rise, w = 104, move = null) => {
      const p = { x: left + dx, y: ground - rise, w, trailShelf: true };
      if (move) Object.assign(p, { baseX: p.x, baseY: p.y, move });
      plats.push(p);
      coins.push({ x: p.x + w / 2, y: p.y - 26, taken: false });
    };
    if (kind === 0) {
      springs.push({ x: left + 70, press: 0 });
      shelf(138, 150, 128); shelf(296, 222, 110); shelf(392, 104, 64);
    } else if (kind === 1) {
      pits.push([left + 110, left + 350]);
      shelf(122, 70); shelf(262, 116);
    } else if (kind === 2) {
      shelf(45, 66); shelf(185, 140); shelf(325, 208);
    } else if (kind === 3) {
      shelf(45, 80);
      shelf(205, 126, 110, { axis: "y", range: 24, speed: 1.2 + (stage % 3) * 0.15, t: encounter + room });
      shelf(360, 78, 84);
    } else if (kind === 4) {
      pits.push([left + 100, left + 190], [left + 280, left + 365]);
      shelf(188, 76, 88); shelf(294, 145, 88);
    } else {
      shelf(55, 90, 150); shelf(250, 162, 150);
      springs.push({ x: left + 222, press: 0 });
    }
    // Ground coins and the upper trail make a route choice visible through play.
    for (const dx of [35, 225, 420]) {
      const coinX = left + dx;
      if (!pits.some(([a, b]) => coinX > a - 24 && coinX < b + 24)) coins.push({ x: coinX, y: ground - 28, taken: false });
    }
  }
  return { length: roomWidth * 4, plats, pits, springs, coins, sections };
}

function rebaseLetterLeapWorld(level, player, deltaY) {
  if (!Number.isFinite(deltaY) || deltaY === 0) return;
  const shift = (item, keys) => {
    if (!item) return;
    for (const key of keys) {
      if (Number.isFinite(item[key])) item[key] += deltaY;
    }
  };

  shift(player, ["y"]);
  for (const platform of level?.plats || []) shift(platform, ["y", "baseY", "prevY"]);
  for (const block of level?.blocks || []) shift(block, ["y"]);
  for (const pickup of level?.pickups || []) shift(pickup, ["y"]);
  for (const bubble of level?.bubbles || []) shift(bubble, ["y"]);
  for (const foe of level?.foes || []) shift(foe, ["y", "baseY"]);
  for (const coin of level?.coins || []) shift(coin, ["y"]);
  for (const star of level?.stars || []) shift(star, ["y"]);
}

function letterLeapDecorativeTime(reduceMotion, nowMs) {
  return reduceMotion ? 0 : nowMs * 0.001;
}

function letterLeapRenderScale(width, height, devicePixelRatio = 1) {
  const requestedScale = Math.min(Math.max(Number(devicePixelRatio) || 1, 1), 2);
  const backingPixels = Math.max(1, width) * Math.max(1, height) * requestedScale * requestedScale;
  return backingPixels > MAX_RETINA_BACKING_PIXELS ? 1 : requestedScale;
}

function letterLeapInitialChoiceCenter(width) {
  return Math.max(200, Math.min(320, Math.max(1, width) - 120));
}

function letterLeapCameraLookahead(width) {
  return Math.min(90, Math.max(48, Math.max(1, width) * 0.16));
}

function letterLeapGroundHeight(height) {
  // The shared arcade shell can leave only ~164 CSS px below its header on a
  // 568x320 phone. Reserving the full desktop dirt band in that space put the
  // player and every letter behind the top HUD. Keep the playable baseline
  // below the compact target strip while retaining the authored 96px ground
  // everywhere with enough vertical room.
  return Math.min(GROUND_H, Math.max(40, Math.round(Math.max(1, height) * 0.25)));
}

function startGame(mount, opts) {
  const world = worldForGameDifficulty(opts.difficulty);
  const theme = WORLD_THEME[world] || WORLD_THEME.meadow;
  mount.dataset.world = world;
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

  // These two objects are created after the first canvas measurement, but the
  // ResizeObserver may run again as the fullscreen shell settles. Keeping them
  // in scope here lets resize() translate the existing course to the new ground
  // line instead of leaving the player and letters floating at the old height.
  let player = null;
  let level = null;

  // ── DOM: canvas + HUD + touch pad + overlay (all inside the mount) ────────
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%";
  mount.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0;
  let DPR = 1;
  let rebuildVisualOverlay = () => {};
  function resize() {
    const previousGroundY = H > 0 ? H - letterLeapGroundHeight(H) : null;
    W = mount.clientWidth || 640; H = mount.clientHeight || 460;
    if (previousGroundY != null) {
      rebaseLetterLeapWorld(level, player, (H - letterLeapGroundHeight(H)) - previousGroundY);
    }
    DPR = letterLeapRenderScale(W, H, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(W * DPR));
    cv.height = Math.max(1, Math.round(H * DPR));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    rebuildVisualOverlay();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(mount);

  const hud = document.createElement("div");
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#fff;z-index:4";
  hud.innerHTML =
    '<div data-ll="target-panel" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;min-height:78px;background:linear-gradient(92deg,rgba(7,12,32,.94),rgba(22,39,83,.82));padding:10px 24px 13px;border:1px solid rgba(126,232,255,.52);clip-path:polygon(14px 0,calc(100% - 22px) 0,100% 50%,calc(100% - 22px) 100%,14px 100%,0 50%);box-shadow:0 12px 30px rgba(0,0,0,.38),inset 0 0 0 1px rgba(255,255,255,.12);backdrop-filter:blur(6px)">' +
      '<img data-ll="picture" alt="" style="display:none;width:64px;height:64px;object-fit:contain;border-radius:10px;background:rgba(255,255,255,.94);padding:4px;box-shadow:0 5px 14px rgba(0,0,0,.3)">' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:7px"><span data-ll="lab" style="font-size:clamp(.82rem,1.35vw,1rem);font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#b7f9ff;opacity:.98;text-wrap:balance">Choose the next letter</span>' +
      '<div data-ll="word" style="display:flex;gap:7px"></div></div></div>' +
    '<div data-ll="coins" style="position:absolute;top:14px;left:16px;font-size:1.02rem;font-weight:900;background:linear-gradient(100deg,rgba(7,12,32,.86),rgba(24,44,86,.72));padding:7px 14px;border:1px solid rgba(126,232,255,.34);clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);box-shadow:0 8px 20px rgba(0,0,0,.26)">Coins x0</div>' +
    '<div data-ll="hearts" style="position:absolute;top:14px;right:16px;font-size:1.5rem;letter-spacing:2px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">❤❤❤</div>' +
    '<div data-ll="world" style="position:absolute;top:52px;right:16px;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#8ff6ff;background:linear-gradient(100deg,rgba(7,12,32,.86),rgba(24,44,86,.72));padding:5px 12px;border:1px solid rgba(126,232,255,.34);clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)">Meadow</div>' +
    '<button data-ll="hear" type="button" aria-label="Hear the word" style="display:none;position:absolute;top:86px;right:16px;width:56px;height:56px;pointer-events:auto;border:1px solid rgba(126,232,255,.5);background:rgba(7,12,32,.82);color:#fff;font-size:1.25rem;font-weight:900;cursor:pointer;clip-path:polygon(10px 0,100% 0,calc(100% - 10px) 100%,0 100%);box-shadow:0 8px 20px rgba(0,0,0,.3)">♪</button>';
  mount.appendChild(hud);
  const responsiveStyle = document.createElement("style");
  responsiveStyle.textContent =
    '@media (max-width:600px){' +
      '.letter-leap [data-ll="target-panel"]{top:8px!important;width:calc(100% - 24px);box-sizing:border-box;justify-content:center;gap:8px!important;min-height:72px!important;padding:7px 12px 9px!important}' +
      '.letter-leap [data-ll="picture"]{width:52px!important;height:52px!important}' +
      '.letter-leap [data-ll="lab"]{font-size:.8rem!important;letter-spacing:.06em!important}' +
      '.letter-leap [data-ll="word"]>div{width:38px!important;height:46px!important;font-size:1.5rem!important}' +
      '.letter-leap [data-ll="coins"]{top:88px!important;left:10px!important}' +
      '.letter-leap [data-ll="hearts"]{top:88px!important;right:10px!important}' +
      '.letter-leap [data-ll="world"]{top:124px!important;right:10px!important}' +
      '.letter-leap [data-ll="hear"]{top:156px!important;right:10px!important}' +
    '}' +
    '@media (max-height:420px) and (orientation:landscape){' +
      '.letter-leap [data-ll="target-panel"]{top:3px!important;left:50%!important;transform:translateX(-50%)!important;width:auto!important;max-width:calc(100% - 132px)!important;min-height:56px!important;gap:7px!important;padding:4px 11px 6px!important}' +
      '.letter-leap [data-ll="picture"]{width:44px!important;height:44px!important;padding:2px!important}' +
      '.letter-leap [data-ll="lab"]{font-size:.78rem!important;line-height:1.08!important;letter-spacing:.04em!important}' +
      '.letter-leap [data-ll="word"]{gap:3px!important}' +
      '.letter-leap [data-ll="word"]>div{width:34px!important;height:40px!important;font-size:1.25rem!important;border-width:1px!important}' +
      '.letter-leap [data-ll="coins"],.letter-leap [data-ll="world"]{display:none!important}' +
      '.letter-leap [data-ll="hearts"]{top:4px!important;right:7px!important;font-size:1.05rem!important}' +
      '.letter-leap [data-ll="hear"]{top:30px!important;right:6px!important;width:56px!important;height:56px!important}' +
      '.letter-leap [data-ll="move-controls"]{bottom:4px!important;left:4px!important;gap:8px!important}' +
      '.letter-leap [data-ll="move-controls"] button{width:56px!important;height:56px!important}' +
      '.letter-leap [data-ll="leap-controls"]{bottom:4px!important;right:4px!important}' +
      '.letter-leap [data-ll="jump"]{width:96px!important;height:56px!important;font-size:.82rem!important;box-shadow:0 5px 0 #9a5a14,inset 0 0 0 2px rgba(255,255,255,.24)!important}' +
    '}';
  mount.appendChild(responsiveStyle);
  const elWord = hud.querySelector('[data-ll="word"]');
  const elLab = hud.querySelector('[data-ll="lab"]');
  const elHearts = hud.querySelector('[data-ll="hearts"]');
  const elWorld = hud.querySelector('[data-ll="world"]');
  const elCoins = hud.querySelector('[data-ll="coins"]');
  const elHear = hud.querySelector('[data-ll="hear"]');
  const elPicture = hud.querySelector('[data-ll="picture"]');
  function updateCoins() { if (elCoins) elCoins.textContent = "Coins x" + coins + (starTokens ? "  Stars x" + starTokens : ""); }

  const padWrap = document.createElement("div");
  padWrap.style.cssText = "position:absolute;inset:0;z-index:6;pointer-events:none";
  padWrap.innerHTML =
    '<div data-ll="move-controls" style="position:absolute;bottom:20px;left:20px;display:flex;gap:12px;pointer-events:auto">' +
      '<button type="button" data-ll="left" aria-label="Move left" style="width:66px;height:62px;border:1px solid rgba(126,232,255,.5);background:rgba(7,12,32,.68);color:#fff;font-size:1.6rem;font-weight:900;backdrop-filter:blur(4px);clip-path:polygon(18px 0,100% 0,calc(100% - 10px) 100%,0 100%);box-shadow:0 8px 18px rgba(0,0,0,.32);transition:filter .12s ease,transform .12s ease">◀</button>' +
      '<button type="button" data-ll="right" aria-label="Move right" style="width:66px;height:62px;border:1px solid rgba(126,232,255,.5);background:rgba(7,12,32,.68);color:#fff;font-size:1.6rem;font-weight:900;backdrop-filter:blur(4px);clip-path:polygon(10px 0,100% 0,calc(100% - 18px) 100%,0 100%);box-shadow:0 8px 18px rgba(0,0,0,.32);transition:filter .12s ease,transform .12s ease">▶</button></div>' +
    '<div data-ll="leap-controls" style="position:absolute;bottom:20px;right:20px;pointer-events:auto">' +
      '<button type="button" data-ll="jump" aria-label="Leap right" style="width:112px;height:76px;border:1px solid rgba(255,255,255,.72);background:linear-gradient(160deg,#ffe879,#ff9f24);color:#20140a;font-size:1rem;font-weight:900;letter-spacing:.04em;box-shadow:0 7px 0 #9a5a14,inset 0 0 0 2px rgba(255,255,255,.24);clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%);transition:filter .12s ease,transform .12s ease">LEAP ▶</button></div>';
  mount.appendChild(padWrap);
  const elJump = padWrap.querySelector('[data-ll="jump"]');

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:24px;z-index:20;background:radial-gradient(120% 90% at 50% 25%,rgba(20,40,70,.72),rgba(6,10,22,.94))";
  mount.appendChild(overlay);

  const visualOverlay = document.createElement("canvas");
  rebuildVisualOverlay = () => {
    visualOverlay.width = Math.max(1, Math.round(W));
    visualOverlay.height = Math.max(1, Math.round(H));
    const overlayCtx = visualOverlay.getContext("2d");
    overlayCtx.clearRect(0, 0, W, H);
    const light = overlayCtx.createLinearGradient(0, 0, 0, H);
    light.addColorStop(0, "rgba(220,248,255,.05)");
    light.addColorStop(0.6, "rgba(255,255,255,0)");
    light.addColorStop(1, "rgba(4,10,24,.12)");
    overlayCtx.fillStyle = light;
    overlayCtx.fillRect(0, 0, W, H);
    const vignette = overlayCtx.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.94);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.76, "rgba(3,8,20,.12)");
    vignette.addColorStop(1, "rgba(3,8,20,.48)");
    overlayCtx.fillStyle = vignette;
    overlayCtx.fillRect(0, 0, W, H);
  };
  rebuildVisualOverlay();

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

  function drawCinematicOverlay() {
    ctx.drawImage(visualOverlay, 0, 0, W, H);
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
        ctx.bezierCurveTo(px + layer.step * 0.15, peak, px + layer.step * 0.72, peak, px + layer.step, layer.base);
      }
      ctx.lineTo(W + layer.step, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ── state ────────────────────────────────────────────────────────────────
  const keys = { left: false, right: false, jump: false };
  let words, wIx, word, nextIx, hearts, running = false, cam = 0, camY = 0, last = 0, frameAccumulator = 0, invuln = 0;
  let particles = [], spores = [], floats = [];
  let score = 0, wrongHits = 0, wordsDoneGlobal = 0;
  let wordTransitionT = 0;
  const completedWordEvidence = new Set(); // stage/leg/word keys survive catch-up replays without double-counting
  // Modern game-feel state (Mission 1)
  const COYOTE = 0.12, JUMP_BUFFER = 0.14;
  let coyoteT = 0, jumpBufT = 0, runDustT = 0, shakeT = 0;
  let tapMoveT = 0, tapMoveDir = 0, pointerJumpHoldT = 0, autoLeapT = 0, autoLeapStopX = null;

  let coins = 0, starTokens = 0, starFlash = 0; // collectibles (Mission 2)
  let idleT = 0; // idle-animation timer (Mission 5)
  const startLevel = Math.max(0, Math.min(Number(opts.startLevel) || 0, ladder.length - 1));
  const stageQueue = makeCatchUp(ladder.map((_, i) => i).slice(startLevel)); // resume mid-ladder; a failed stage returns later
  let stageIdx = 0;
  let legs = null, legIx = 0; // sentence stages: the sentences to build, in order
  let rafId = 0;

  function addScore(n) { score += n; opts.onScoreUpdate && opts.onScoreUpdate(score); }
  function groundY() { return H - letterLeapGroundHeight(H); }

  function canHearTarget() {
    return Boolean(word && opts.getSound?.() && hasRecordedSpeech(word));
  }
  function syncHearControl() {
    if (!elHear) return;
    const available = hasRecordedSpeech(word || "");
    const enabled = available && Boolean(opts.getSound?.());
    elHear.dataset.audioAvailable = available ? "true" : "false";
    elHear.disabled = !enabled;
    elHear.style.display = enabled ? "grid" : "none";
    elHear.setAttribute("aria-label", legs ? "Hear the current sentence word" : "Hear the word");
  }
  function speakTarget() {
    if (canHearTarget()) void speakWord(word.toLowerCase());
  }
  elHear?.addEventListener("click", speakTarget);

  function shuffleArr(a) { for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function makeLevel(levelWords, worldKey, levelIndex) {
    const plats = [], bubbles = [], blocks = [], pickups = [], letterX = [];
    const pits = [], foes = [], trailSprings = [], trailCoins = [], sections = [];
    const bump = { meadow: 0, dino: 2, moonwood: 4 }[worldKey] || 0;
    const hard = worldKey !== "meadow";
    const choicePlan = buildLetterLeapChoicePlan(levelWords, worldKey, levelIndex);

    // Place each grapheme once in the authored route.  Pickups are persistent
    // world objects: they never regroup, chase the player or move through a
    // platform after a nearby answer is collected.
    let cx = letterLeapInitialChoiceCenter(W);
    levelWords.forEach((up, wi) => {
      for (let i = 0; i < up.length; i += 1) {
        const decision = choicePlan[wi][i];
        for (const choice of decision.choices) {
          let bubbleY = groundY() - 46;
          if (choice.rise) {
            const py = groundY() - choice.rise;
            // An upper trail sits beyond the lower letter, so neither pickup
            // is hidden beneath a shelf. Both routes stay physically reachable.
            plats.push({ x: cx + choice.offsetX - 72, y: py, w: 144, letterShelf: true });
            bubbleY = py - 40;
          }
          bubbles.push({
            x: cx + choice.offsetX,
            y: bubbleY,
            ch: choice.ch,
            word: choice.word,
            order: choice.order,
            decisionWord: wi,
            decisionOrder: i,
            choiceId: decision.choiceId,
            taken: false, cooldown: 0
          });
        }
        letterX.push(cx, cx + 170); cx += SEG;
        const trail = buildLetterLeapTrail(cx, groundY(), levelIndex, bubbles.length / 2 - 1, worldKey);
        plats.push(...trail.plats); pits.push(...trail.pits);
        trailSprings.push(...trail.springs); trailCoins.push(...trail.coins);
        sections.push(...trail.sections);
        cx += trail.length;
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
          plats.push({ x: cx + 80, y: groundY() - 104, w: 120 });
          cx += WORD_GAP;
        }
      }
    });
    const flag = cx + 200, L = cx + 360;

    // Hazards use open travel space between the individual letter encounters.
    const hazardSlots = [];
    for (let i = 0; i < letterX.length - 1; i += 1) {
      const a = letterX[i], b = letterX[i + 1];
      if (b - a < 220) continue;
      const mid = (a + b) / 2;
      if (mid < 520 || mid > flag - 220) continue;
      if (pits.some(q => mid > q[0] - 80 && mid < q[1] + 80)) continue;
      hazardSlots.push(mid);
    }
    shuffleArr(hazardSlots);

    const foeCount = 4 + Math.round(levelIndex * 0.9) + bump;
    const blockCount = 2 + Math.round(levelIndex * 0.4);
    const heartCount = 1 + Math.round(levelIndex * 0.2);
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
    const coinsArr = [...trailCoins];
    for (const [pl, pr] of pits) {
      if (pr - pl < 140) continue; // ravines only, not tiny hazard pits
      for (let i = 0; i < 5; i += 1) { const u = (i + 0.5) / 5; coinsArr.push({ x: pl + (pr - pl) * u, y: groundY() - 90 - Math.sin(u * Math.PI) * 58, taken: false }); }
    }
    for (const pl of plats) { if (!pl.letterShelf && !pl.trailShelf && pl.y < groundY() - 70) coinsArr.push({ x: pl.x + pl.w / 2, y: pl.y - 22, taken: false }); }
    const starsArr = [];
    for (const pl of plats.filter(pl => !pl.letterShelf).sort((a, b) => a.y - b.y).slice(0, 3)) starsArr.push({ x: pl.x + pl.w / 2, y: pl.y - 32, taken: false });
    // Springs on the ground below the highest star tokens (bounce up to reach them).
    const springsArr = [...trailSprings];
    for (const st of starsArr) {
      if (st.y >= groundY() - 130) continue;
      let x = Math.max(140, st.x - 60);
      const pit = pits.find(([left, right]) => x > left - 32 && x < right + 32);
      if (pit) x = pit[0] - 48;
      if (!springsArr.some(sp => Math.abs(sp.x - x) < 48)) springsArr.push({ x, press: 0 });
    }

    const visibleCoins = coinsArr.filter(coin => !bubbles.some(b => Math.abs(coin.x - b.x) < 60 && Math.abs(coin.y - b.y) < 60));
    return { L, pits, plats, blocks, pickups, bubbles, foes, flag, coins: visibleCoins, stars: starsArr, springs: springsArr, sections };
  }
  function inPit(x) { return level.pits.some(p => x > p[0] && x < p[1]); }

  function startStage() {
    stageIdx = stageQueue.peek();
    if (stageIdx == null) { finishGame(); return; }
    const plan = ladder[stageIdx];
    legs = allStageSentences[stageIdx]; legIx = 0;
    words = (legs ? legs[0] : allStageWords[stageIdx]).slice();
    wIx = 0; word = words[0] || ""; nextIx = 0;
    wordTransitionT = 0;
    level = makeLevel(words, world, stageIdx);
    player = { x: 70, y: groundY() - 46, w: 32, h: 46, vx: 0, vy: 0, onGround: true, face: 1, anim: 0, spawnX: 70, squash: 0 };
    hearts = 3; cam = 0; camY = 0; invuln = 0; particles = [];
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
      s.style.cssText = "width:44px;height:52px;display:grid;place-items:center;font-size:1.75rem;font-weight:900;clip-path:polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%);text-shadow:none;" +
        (done
          ? "background:linear-gradient(160deg,#ffe879,#ff9f24);color:#20140a;border:1px solid rgba(255,255,255,.66);box-shadow:0 4px 0 #9a5a14,inset 0 0 0 2px rgba(255,255,255,.18)"
          : isNext
            ? "background:rgba(7,12,32,.42);color:#fff;border:1px solid #ffe879;box-shadow:0 0 18px rgba(255,232,121,.58),inset 0 0 0 2px rgba(255,255,255,.1)"
            : "background:rgba(7,12,32,.38);color:rgba(255,255,255,.38);border:1px solid rgba(126,232,255,.22);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)");
      s.textContent = done ? word[i] : "";
      s.setAttribute("aria-label", done
        ? `Completed letter ${word[i]}`
        : isNext ? "Next empty letter slot" : "Empty letter slot");
      elWord.appendChild(s);
    }
    const pictureAsset = getChildWordAsset(word.toLowerCase());
    const picturePath = pictureAsset?.image || pictureAsset?.fallbackImage || "";
    if (elPicture) {
      elPicture.style.display = picturePath ? "block" : "none";
      if (picturePath) elPicture.src = picturePath;
      else elPicture.removeAttribute("src");
      elPicture.alt = picturePath ? "Picture clue for the word to spell" : "";
    }
    const needsModelSupport = !picturePath && !canHearTarget();
    elLab.dataset.supportMode = needsModelSupport ? "model" : "independent-cue";
    if (needsModelSupport) {
      elLab.textContent = `MODEL · SPELL ${word}`;
    } else if (elLab.dataset.sentence === "1") {
      const sentenceWords = legs?.[legIx] || [];
      elLab.textContent = sentenceWords.map((part, index) => (
        index === wIx ? "_".repeat(Math.max(2, String(part).length)) : part
      )).join(" ") || "Build the sentence";
    } else {
      elLab.textContent = "Choose letter " + (nextIx + 1) + " of " + word.length + " · word " + (wIx + 1) + " of " + words.length;
    }
    syncHearControl();
  }
  function updateHearts() { elHearts.textContent = "❤".repeat(Math.max(0, hearts)) + "♡".repeat(Math.max(0, 3 - hearts)); }

  function burst(x, y, c) { for (let i = 0; i < 12; i += 1) particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.7) * 6, life: 0.6, c }); }
  function addFloat(x, y, txt) { floats.push({ x, y, txt, life: 0.8 }); }
  function burstBlock(bl) { for (let i = 0; i < 9; i += 1) particles.push({ x: bl.x + bl.w / 2, y: bl.y + bl.h / 2, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 6 - 1, life: 0.7, c: "#b5602f" }); }

  function hurt() {
    if (invuln > 0) return;
    hearts -= 1; updateHearts(); sfx(playSoftBuzz); invuln = 1.3; burst(player.x, player.y, "#ff7a66");
    if (hearts <= 0) {
      running = false;
      stageQueue.miss(); // this stage comes back later (catch-up)
      opts.onProgressUpdate && opts.onProgressUpdate(wordsDoneGlobal, totalWords);
      showOverlay("Catch up later!", "The grumpers got you, but every word you spelled is saved. This stage will come back around.", "Keep going", () => { player = null; startStage(); });
    } else {
      player.x = player.spawnX; player.y = groundY() - 46; player.vx = 0; player.vy = 0; cam = Math.max(0, player.x - W * 0.35);
    }
  }
  function wordDone() {
    burst(player.x, player.y - 16, "#7cf0b6"); sfx(playCorrectChime);
    const evidence = recordWordEvidence(completedWordEvidence, stageIdx, legIx, wIx);
    if (evidence.added) {
      wordsDoneGlobal = evidence.count;
      addScore(50);
      addFloat(player.x, player.y - 34, "+50 · saved");
      opts.onProgressUpdate && opts.onProgressUpdate(wordsDoneGlobal, totalWords);
    } else {
      addFloat(player.x, player.y - 34, "✓ saved");
    }
    // Keep the completed spelling on screen long enough to read. Previously
    // the slots were replaced by the next word in the same collision frame,
    // which made correct play look as if it had been discarded.
    renderWord();
    elLab.textContent = word + " built!";
    wordTransitionT = reduceMotion ? 0.48 : 0.72;
  }
  function finishWordTransition() {
    wordTransitionT = 0;
    if (wIx < words.length - 1) {
      wIx += 1;
      word = words[wIx];
      nextIx = 0;
      renderWord();
      return;
    }
    elLab.textContent = word + " built · reach the finish";
  }
  // Sentence stage: after building one sentence, roll on to the next one in the
  // bucket (fresh strip of letter bubbles), so a hard level plays ALL its sentences.
  function nextLeg() {
    legIx += 1;
    words = legs[legIx].slice();
    wIx = 0; word = words[0] || ""; nextIx = 0;
    wordTransitionT = 0;
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
    const stars = starRubric({ correct: wordsDoneGlobal, total: totalWords, mistakes: wrongHits, deaths: 0 });
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
    "min-width:168px",
    "min-height:56px",
    "padding:14px 32px",
    "clip-path:polygon(12px 0,100% 0,calc(100% - 12px) 100%,0 100%)",
    "box-shadow:0 7px 0 #9a5a14,inset 0 0 0 2px rgba(255,255,255,.18)",
    "cursor:pointer"
  ].join(";");

  let overlayFocusTrap = null;
  function closeOverlayDialog() {
    if (overlayFocusTrap) overlay.removeEventListener("keydown", overlayFocusTrap);
    overlayFocusTrap = null;
    overlay.style.display = "none";
    overlay.removeAttribute("role");
    overlay.removeAttribute("aria-modal");
    overlay.removeAttribute("aria-label");
    hud.inert = false;
    padWrap.inert = false;
  }
  function openOverlayDialog(label) {
    closeOverlayDialog();
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", label);
    hud.inert = true;
    padWrap.inert = true;
    overlay.style.display = "grid";
    const cta = overlay.querySelector('[data-ll="cta"]');
    overlayFocusTrap = event => {
      if (event.key !== "Tab") return;
      event.preventDefault();
      cta?.focus();
    };
    overlay.addEventListener("keydown", overlayFocusTrap);
    cta?.focus();
  }

  function showOverlay(title, text, btnLabel, fn) {
    overlay.innerHTML =
      '<div style="max-width:520px;padding:24px 30px;background:linear-gradient(140deg,rgba(7,12,32,.92),rgba(22,39,83,.72));border:1px solid rgba(126,232,255,.36);clip-path:polygon(18px 0,100% 0,calc(100% - 18px) 100%,0 100%);box-shadow:0 20px 60px rgba(0,0,0,.42),inset 0 0 0 1px rgba(255,255,255,.08)"><h1 style="font-size:clamp(1.6rem,6vw,2.6rem);margin:0">' + title + '</h1>' +
      '<p style="opacity:.9;margin:10px auto 22px;max-width:440px;line-height:1.4">' + text + '</p>' +
      '<button data-ll="cta" style="' + ctaStyle + '">' + btnLabel + '</button></div>';
    openOverlayDialog(title);
    overlay.querySelector('[data-ll="cta"]').onclick = () => { closeOverlayDialog(); sfx(playTapSound); fn(); };
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
    openOverlayDialog(title);
    overlay.querySelector('[data-ll="cta"]').onclick = () => { closeOverlayDialog(); sfx(playTapSound); fn(); };
  }

  // ── input ─────────────────────────────────────────────────────────────────
  function releaseInputs() {
    keys.left = keys.right = keys.jump = false;
    jumpBufT = 0;
    tapMoveT = 0;
    tapMoveDir = 0;
    pointerJumpHoldT = 0;
    autoLeapT = 0;
    autoLeapStopX = null;
  }
  function syncLeapDirection() {
    if (!elJump) return;
    const movingLeft = player?.face < 0;
    elJump.setAttribute("aria-label", movingLeft ? "Leap left" : "Leap right");
    elJump.textContent = movingLeft ? "LEAP ◀" : "LEAP ▶";
  }
  function nextTouchLeapStop() {
    return player ? player.x + player.face * 190 : null;
  }
  const isJumpKey = key => key === " " || verticalDirectionForKey(key) === -1;
  const onKeyDown = e => {
    // Shared game chrome keeps native keyboard behaviour, but a touch control
    // that still owns focus must not make the movement keys appear broken.
    if (isInteractiveKeyTarget(e.target) && !padWrap.contains(e.target)) return;
    // Enter and Space activate a focused movement button through its native
    // click. Away from a button, Space keeps its game-wide leap behaviour.
    if (padWrap.contains(e.target) && (e.key === "Enter" || e.key === " ")) return;
    const direction = laneDirectionForKey(e.key);
    if (direction < 0) { keys.left = true; e.preventDefault(); }
    else if (direction > 0) { keys.right = true; e.preventDefault(); }
    else if (isJumpKey(e.key)) {
      keys.jump = true;
      if (!e.repeat) jumpBufT = JUMP_BUFFER;
      e.preventDefault();
    }
  };
  const onKeyUp = e => {
    const direction = laneDirectionForKey(e.key);
    if (direction < 0) keys.left = false;
    else if (direction > 0) keys.right = false;
    else if (isJumpKey(e.key)) keys.jump = false;
  };
  window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);
  const holders = [];
  const hold = (sel, k) => {
    const el = padWrap.querySelector(sel);
    const activateTap = () => {
      if (k === "left" || k === "right") {
        autoLeapT = 0;
        autoLeapStopX = null;
        tapMoveDir = k === "left" ? -1 : 1;
        tapMoveT = 0.18;
      } else {
        jumpBufT = JUMP_BUFFER;
        pointerJumpHoldT = 0.3;
        // One-finger leap follows the same physical arc and can collect a
        // letter; a held direction always takes over the assist immediately.
        if (!keys.left && !keys.right) {
          autoLeapT = 1.2;
          autoLeapStopX = nextTouchLeapStop();
        }
      }
    };
    const down = e => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      el.style.filter = "brightness(1.12)";
      el.style.transform = "translateY(2px) scale(.98)";
      keys[k] = true;
      activateTap();
    };
    const click = e => {
      if (e.detail !== 0) return;
      e.preventDefault();
      activateTap();
    };
    const up = () => {
      keys[k] = false;
      el.style.filter = "";
      el.style.transform = "";
    };
    const cancel = () => {
      up();
      if ((k === "left" && tapMoveDir < 0) || (k === "right" && tapMoveDir > 0)) tapMoveT = 0;
      if (k === "jump") { pointerJumpHoldT = 0; autoLeapT = 0; autoLeapStopX = null; }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", cancel);
    el.addEventListener("lostpointercapture", up);
    el.addEventListener("click", click);
    holders.push([el, down, up, cancel, click]);
  };
  hold('[data-ll="left"]', "left"); hold('[data-ll="right"]', "right"); hold('[data-ll="jump"]', "jump");

  // ── update ─────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!running || !player) return;
    if (invuln > 0) invuln -= dt;
    const p = player;
    if (wordTransitionT > 0) {
      wordTransitionT = Math.max(0, wordTransitionT - dt);
      if (wordTransitionT === 0) finishWordTransition();
    }
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
    const heldAxis = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const assistedAxis = heldAxis || (tapMoveT > 0 ? tapMoveDir : (autoLeapT > 0 ? p.face : 0));
    p.vx = letterLeapVelocity(p.vx, assistedAxis, p.onGround);
    // Coyote time + jump buffering + variable jump height (modern platformer feel).
    coyoteT = p.onGround ? COYOTE : Math.max(0, coyoteT - dt);
    jumpBufT = Math.max(0, jumpBufT - dt);
    if (jumpBufT > 0 && (p.onGround || coyoteT > 0)) {
      p.vy = -JUMP; p.onGround = false; coyoteT = 0; jumpBufT = 0; p.squash = -0.3; sfx(playTapSound);
    }
    if (!p.springLaunch && !keys.jump && pointerJumpHoldT <= 0 && p.vy < -4) p.vy = -4; // release early = shorter manual hop
    tapMoveT = Math.max(0, tapMoveT - dt);
    pointerJumpHoldT = Math.max(0, pointerJumpHoldT - dt);
    autoLeapT = Math.max(0, autoLeapT - dt);
    if (autoLeapT === 0) autoLeapStopX = null;
    p.vy += GRAV; if (p.vy > 18) p.vy = 18;
    if (p.vy >= 0) p.springLaunch = false;
    const nextPlayerX = p.x + p.vx;
    const reachedLeapStop = autoLeapT > 0 && Number.isFinite(autoLeapStopX) && (
      (p.face > 0 && nextPlayerX >= autoLeapStopX) ||
      (p.face < 0 && nextPlayerX <= autoLeapStopX)
    );
    if (reachedLeapStop) {
      p.x = autoLeapStopX;
      p.vx = 0;
      autoLeapT = 0;
      autoLeapStopX = null;
    } else {
      p.x = nextPlayerX;
    }
    if (p.vx) {
      const nextFace = p.vx > 0 ? 1 : -1;
      if (nextFace !== p.face) { p.face = nextFace; syncLeapDirection(); }
    }
    p.anim += Math.abs(p.vx) * 0.07;
    const previousFeet = p.y + p.h / 2;
    p.y += p.vy;
    const wasAir = !p.onGround; p.onGround = false;
    const feet = p.y + p.h / 2;
    for (const pl of level.plats) { if (p.x + p.w / 2 > pl.x && p.x - p.w / 2 < pl.x + pl.w && p.vy >= 0 && feet >= pl.y && feet <= pl.y + 24) { p.y = pl.y - p.h / 2; p.vy = 0; p.onGround = true; if (!inPit(p.x)) p.spawnX = p.x; p.stood = pl; } }
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
    if (feet >= groundY()) { if (inPit(p.x)) { if (p.y > H + 40) hurt(); } else { p.y = groundY() - p.h / 2; p.vy = 0; p.onGround = true; if (p.x > 70 && !inPit(p.x - 24)) p.spawnX = Math.max(p.spawnX, p.x - 24); } }
    for (const sp of level.springs) {
      sp.press = Math.max(0, sp.press - dt);
      if (bounceLetterLeapSpring(p, sp, groundY(), previousFeet)) { coyoteT = 0; sfx(playWhoosh); }
    }
    if (p.onGround && wasAir) {
      p.squash = 0.35;
      for (let i = 0; i < 6; i += 1) particles.push({ x: p.x + (Math.random() - 0.5) * 20, y: p.y + p.h / 2 - 2, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 1.5, life: 0.5, c: "#cfc9bd" });
    }
    if (p.onGround && p.vx !== 0) { runDustT -= dt; if (runDustT <= 0) { runDustT = 0.18; particles.push({ x: p.x - p.face * 12, y: p.y + p.h / 2 - 2, vx: -p.face * 1.2, vy: -Math.random(), life: 0.4, c: "#cfc9bd" }); } }
    idleT = (p.vx === 0 && p.onGround) ? idleT + dt : 0;
    p.squash *= 0.8;
    if (p.x < 18) p.x = 18;
    // A missed pickup stays at its authored coordinate; backtracking is the
    // recovery action and preserves every surrounding platform and hazard.
    for (const b of level.bubbles) {
      if (b.taken) continue;
      b.cooldown = Math.max(0, (b.cooldown || 0) - dt);
      if (!isLetterLeapCurrentChoice(b, wIx, nextIx)) continue;
      const touching = Math.abs(b.x - p.x) < 34 && Math.abs(b.y - p.y) < 42;
      if (!touching) b.touching = false;
      if (touching) {
        if (b.word === -1) {
          const freshContact = !b.touching;
          b.touching = true;
          if (!freshContact || b.cooldown > 0) continue;
          b.cooldown = 1.4;
          wrongHits += 1; // literacy mistakes — the ONLY mistakes the star rubric sees
          burst(b.x, b.y, "#ff7a66"); sfx(playSoftBuzz);
          const tip = "That's " + b.ch + " — you need " + word[Math.min(nextIx, word.length - 1)] + "!";
          addFloat(b.x, b.y - 26, tip); // teach, don't punish: no heart lost
          sfx(() => speakWord(word.toLowerCase()));
        }
        else if (b.word === wIx && b.order === nextIx) {
          const alreadySaved = completedWordEvidence.has([stageIdx, legIx, wIx].join(":"));
          collectLetterLeapChoice(b); nextIx += 1; sfx(playPopSound); burst(b.x, b.y, "#ffd34e");
          if (alreadySaved) addFloat(b.x, b.y - 22, "✓ saved");
          else { addScore(10); addFloat(b.x, b.y - 22, "+10"); }
          if (nextIx >= word.length) wordDone();
          else {
            renderWord();
          }
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
    const camTarget = Math.max(0, Math.min(level.L - W, p.x - W * 0.35 + p.face * letterLeapCameraLookahead(W)));
    cam += (camTarget - cam) * Math.min(1, dt * 7);
    const verticalTarget = Math.min(0, p.y - Math.max(120, H * 0.52));
    camY += (verticalTarget - camY) * Math.min(1, dt * 9);
    camY = Math.min(camY, p.y - Math.min(H - 40, 154));
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
    if (w <= 0 || x > cam + W + 128 || x + w < cam - 128) return;
    const y = groundY();
    const end = x + w;
    const left = Math.max(x, Math.floor(cam / 128) * 128 - 128);
    const right = Math.min(end, cam + W + 128);
    const side = ctx.createLinearGradient(0, y, 0, H + 200);
    side.addColorStop(0, theme.dirt[0]); side.addColorStop(1, theme.dirt[1]);
    ctx.fillStyle = side; ctx.fillRect(x, y, w, H + 200 - y);
    // The committed terrain asset is a sheet, not a transparent single tile.
    // Sample the solid grass/rock centre instead of stretching its white gutters.
    const im = SPR.platform;
    if (im?.width) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, H + 200 - y); ctx.clip();
      for (let gx = left; gx < right; gx += 128) {
        ctx.drawImage(im, 140, 238, 185, 101, gx, y, 128, 78);
      }
      ctx.restore();
    }
    ctx.fillStyle = theme.grass;
    ctx.fillRect(x, y - 2, w, 5);
    ctx.strokeStyle = theme.ground; ctx.lineWidth = 2;
    for (let gx = left; gx < right; gx += 18) {
      if (gx < x || gx > end) continue;
      const length = 3 + 3 * Math.abs(Math.sin(gx * 0.17));
      ctx.beginPath(); ctx.moveTo(gx, y + 2); ctx.quadraticCurveTo(gx - 2, y - length, gx - 5, y - length); ctx.stroke();
    }
  }

  function platform(pl) {
    if (pl.x > cam + W + 100 || pl.x + pl.w < cam - 100) return;
    ctx.fillStyle = "rgba(0,0,0,.26)";
    panelPath(pl.x + 6, pl.y + 12, pl.w, 26, 8);
    ctx.fill();
    const im = SPR.platform;
    if (im && im.width) {
      ctx.save();
      panelPath(pl.x, pl.y, pl.w, 32, 9);
      ctx.clip();
      for (let gx = pl.x; gx < pl.x + pl.w; gx += 96) {
        ctx.drawImage(im, 140, 238, 185, 101, gx, pl.y, 96, 52);
      }
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
    ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(39,55,33,.35)";
    rr(x - 33, y - 29, 66, 58, 16);
    ctx.fill();
    const rg = ctx.createLinearGradient(x - 30, y - 27, x + 32, y + 29);
    rg.addColorStop(0, "#fff9d9");
    rg.addColorStop(0.34, "#ffe9a0");
    rg.addColorStop(1, "#dfae52");
    ctx.fillStyle = rg;
    rr(x - 30, y - 27, 60, 54, 14);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.72)";
    ctx.lineWidth = 2;
    rr(x - 30, y - 27, 60, 54, 14);
    ctx.stroke();
    ctx.fillStyle = "#061022";
    ctx.font = "900 32px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, x, y + 2);
    ctx.fillStyle = "rgba(255,255,255,.62)";
    ctx.fillRect(x - 17, y - 19, 20, 3);
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
    if (sp.x < cam - 64 || sp.x > cam + W + 64) return;
    const y = groundY(); const press = sp.press > 0 ? 8 : 0;
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
    const sq = p.squash, sx = 1 - sq, sy = 1 + sq, bob = !reduceMotion && p.onGround ? Math.sin(p.anim) * 1.5 : 0;
    ctx.save();
    // Identify the hero on arrival, then clear the label as movement begins.
    if (p.anim < 1) {
      const cueY = p.y - (H >= 220 ? 74 : 54);
      ctx.shadowColor = "rgba(88,241,255,.84)";
      ctx.shadowBlur = 14;
      ctx.strokeStyle = "rgba(126,246,255,.96)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(p.x, groundY() - 2, 30, 9, 0, 0, 7);
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (H >= 220) {
        ctx.fillStyle = "rgba(7,12,32,.9)";
        panelPath(p.x - 27, cueY - 10, 54, 22, 6);
        ctx.fill();
        ctx.strokeStyle = "#8ff6ff";
        ctx.lineWidth = 2;
        panelPath(p.x - 27, cueY - 10, 54, 22, 6);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "900 13px Fredoka, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("YOU", p.x, cueY + 1);
      }
      ctx.fillStyle = "#ffe879";
      ctx.strokeStyle = "rgba(7,12,32,.88)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x - 9, cueY + (H >= 220 ? 17 : 1));
      ctx.lineTo(p.x + 9, cueY + (H >= 220 ? 17 : 1));
      ctx.lineTo(p.x, cueY + (H >= 220 ? 29 : 13));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,.34)"; ctx.beginPath(); ctx.ellipse(p.x, groundY() - 2 > p.y + 22 ? p.y + 24 : groundY() - 2, 23, 6, 0, 0, 7); ctx.fill();
    ctx.translate(p.x, p.y + bob); ctx.scale(p.face * sx, sy);
    const cim = currentChar();
    if (cim && cim.width) {
      const h = H < 240 ? 56 : 76, w = cim.width / cim.height * h;
      const lean = reduceMotion ? 0 : (p.onGround ? Math.sin(p.anim) * Math.min(0.055, Math.abs(p.vx) * 0.012) : Math.max(-0.12, Math.min(0.12, p.vy * 0.012)));
      ctx.rotate(lean);
      ctx.drawImage(cim, -w / 2, p.h / 2 - h, w, h);
      ctx.restore();
      return;
    }
    const lk = p.onGround ? Math.sin(p.anim) * 5 : 5; ctx.fillStyle = "#2f7a4b"; rr(-10, 12, 8, 11 + lk, 3); ctx.fill(); rr(2, 12, 8, 11 - lk, 3); ctx.fill();
    const bg = ctx.createLinearGradient(0, -18, 0, 16); bg.addColorStop(0, "#7cf0b6"); bg.addColorStop(1, "#34c589"); ctx.fillStyle = bg; rr(-15, -18, 30, 34, 13); ctx.fill(); ctx.strokeStyle = "#0f6b48"; ctx.lineWidth = 2; rr(-15, -18, 30, 34, 13); ctx.stroke();
    ctx.fillStyle = "#d6fbe8"; rr(-9, -2, 18, 14, 8); ctx.fill();
    const blink = !reduceMotion && idleT > 2 && Math.floor(idleT * 2.5) % 5 === 0; // idle blink (Mission 5)
    ctx.fillStyle = "#0a1a12";
    if (blink) { ctx.fillRect(-6, -9, 5, 1.6); ctx.fillRect(4, -9, 5, 1.6); }
    else { ctx.beginPath(); ctx.arc(-4, -8, 3.2, 0, 7); ctx.arc(7, -8, 3.2, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function drawBgImage(time) {
    const im = BGIMG[world];
    if (!im || !im.width) return false;
    const scale = H / im.height, iw = im.width * scale, shift = cam * 0.35;
    for (let i = Math.floor(shift / iw) - 1; i * iw - shift < W + iw; i += 1) {
      const x = i * iw - shift; ctx.save();
      if (((i % 2) + 2) % 2 === 1) { ctx.translate(x + iw, 0); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, iw, H); }
      else ctx.drawImage(im, x, 0, iw, H);
      ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = 0.18; drawDepthScenery(time); ctx.restore();
    const ground = groundY();
    const sh = ctx.createLinearGradient(0, ground - 70, 0, ground); sh.addColorStop(0, "rgba(6,10,20,0)"); sh.addColorStop(1, "rgba(6,10,20,.28)"); ctx.fillStyle = sh; ctx.fillRect(0, ground - 70, W, 70);
    return true;
  }
  function draw() {
    if (!level) return;
    // One frozen decorative clock gates every continuous ambient animation:
    // depth drift, spores, pickups, pennant waves, bubbles, coins and stars.
    const t = letterLeapDecorativeTime(reduceMotion, Date.now());
    if (!drawBgImage(t)) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, theme.sky[0]); g.addColorStop(0.55, theme.sky[1]); g.addColorStop(1, theme.sky[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const gx = W * 0.8, gy = H * 0.2; const cg = ctx.createRadialGradient(gx, gy, 10, gx, gy, 180); cg.addColorStop(0, theme.sun); cg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
      drawDepthScenery(t);
      treeRow(theme.treeDark, 0.2, groundY() + 6, 150, 90, 0.28); treeRow(theme.tree, 0.45, groundY() + 14, 220, 140, 0.6);
    }
    for (const s of spores) { const sx = ((s.x - cam * 0.5) % (W + 60) + W + 60) % (W + 60) - 30; const sy = reduceMotion ? s.y : s.y + Math.sin(t * 0.8 + s.ph) * 14; ctx.globalAlpha = 0.5; ctx.fillStyle = theme.moon ? "#ffe9a0" : "#ffffff"; ctx.beginPath(); ctx.arc(sx, sy, s.s, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    const shx = (shakeT > 0 && !reduceMotion) ? (Math.random() - 0.5) * 6 * (shakeT / 0.22) : 0;
    const shy = (shakeT > 0 && !reduceMotion) ? (Math.random() - 0.5) * 6 * (shakeT / 0.22) : 0;
    ctx.save(); ctx.translate(-cam + shx, -camY + shy);
    let x = 0; const dg = ctx.createLinearGradient(0, groundY(), 0, H); dg.addColorStop(0, theme.dirt[0]); dg.addColorStop(1, theme.dirt[1]); ctx.fillStyle = dg; ctx.fillRect(0, groundY() + 16, level.L, letterLeapGroundHeight(H));
    for (const p of level.pits) { grassStrip(x, p[0] - x); x = p[1]; } grassStrip(x, level.L - x);
    for (const pl of level.plats) platform(pl);
    for (const sp of level.springs) drawSpring(sp);
    for (const bl of level.blocks) drawBlock(bl);
    for (const hp of level.pickups) { if (!hp.taken) drawHeart(hp.x, reduceMotion ? hp.y : hp.y + Math.sin(t * 3 + hp.x) * 4); }
    ctx.strokeStyle = "#d8f5ff"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(level.flag, groundY()); ctx.lineTo(level.flag, groundY() - 138); ctx.stroke();
    ctx.strokeStyle = "rgba(47,131,255,.65)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(level.flag + 9, groundY() - 8); ctx.lineTo(level.flag + 9, groundY() - 132); ctx.stroke();
    { // Mission 5: waving 3-segment pennant; glows gold once the stage is completable.
      const fx = level.flag, fy = groundY() - 130; const canFinish = wIx >= words.length - 1 && nextIx >= word.length;
      ctx.save(); if (canFinish) { ctx.shadowColor = "rgba(255,214,90,.9)"; ctx.shadowBlur = 16; }
      ctx.fillStyle = canFinish ? "#ffe879" : "#8ff6ff"; ctx.beginPath(); ctx.moveTo(fx, fy);
      for (let s = 0; s <= 3; s += 1) { const u = s / 3; const wave = reduceMotion ? 0 : Math.sin(t * 6 + s) * 4; ctx.lineTo(fx + u * 56, fy + 6 + wave); }
      for (let s = 3; s >= 0; s -= 1) { const u = s / 3; const wave = reduceMotion ? 0 : Math.sin(t * 6 + s) * 4; ctx.lineTo(fx + u * 56 - 9, fy + 28 + wave); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    for (const b of level.bubbles) {
      if (b.taken) continue;
      const bob = reduceMotion ? 0 : Math.sin(t * 2.4 + b.x) * 4;
      if (b.x < cam - 64 || b.x > cam + W + 64) continue;
      bubble(b.x, b.y + bob, b.ch);
    }
    for (const cn of level.coins) { if (cn.taken || cn.x < cam - 32 || cn.x > cam + W + 32) continue; const wob = reduceMotion ? 1 : Math.abs(Math.cos(t * 4 + cn.x)); ctx.save(); ctx.fillStyle = "#ffd34e"; ctx.strokeStyle = "#b7841a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cn.x, cn.y + (reduceMotion ? 0 : Math.sin(t * 3 + cn.x) * 3), 9 * wob + 1, 10, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.arc(cn.x - 2, cn.y - 3, 2, 0, 7); ctx.fill(); ctx.restore(); }
    for (const st of level.stars) { if (!st.taken) drawStarToken(st.x, reduceMotion ? st.y : st.y + Math.sin(t * 2 + st.x) * 4, reduceMotion ? 0 : t); }
    for (const f of level.foes) drawFoe(f);
    if (player) drawPlayer();
    for (const pt of particles) { ctx.globalAlpha = Math.max(0, pt.life / 0.6); ctx.fillStyle = pt.c; ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.font = "700 18px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const fl of floats) { ctx.globalAlpha = Math.max(0, fl.life / 0.8); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(6,10,20,.85)"; ctx.strokeText(fl.txt, fl.x, fl.y); ctx.fillStyle = "#fff"; ctx.fillText(fl.txt, fl.x, fl.y); ctx.globalAlpha = 1; }
    ctx.restore();
    // Low-hearts tension: the vignette pulses subtly red at 1 heart.
    if (hearts <= 1 && !reduceMotion) {
      const a = (0.16 + Math.abs(Math.sin(t * 4)) * 0.16).toFixed(3);
      const rv = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9); rv.addColorStop(0, "rgba(255,40,60,0)"); rv.addColorStop(1, "rgba(255,30,50," + a + ")"); ctx.fillStyle = rv; ctx.fillRect(0, 0, W, H);
    }
    if (starFlash > 0) { ctx.fillStyle = "rgba(255,214,90," + (starFlash * 0.4).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
    drawCinematicOverlay();
  }

  // ── Current canonical book art ─────────────────────────────────────────────
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
  // Use the current book-cast registry: Speedy, Chompy and Pip have authored
  // side-view hero art. A character's identity stays stable throughout its world.
  const hero = CAST[HEROES.find(candidate => candidate.land === world).id];
  const BGIMG = {}, SPR = {};
  let heroImage = null;
  const loadHero = new Image();
  loadHero.onload = () => { try { heroImage = alphaTrim(loadHero); } catch { heroImage = loadHero; } };
  loadHero.onerror = () => { loadHero.onerror = null; loadHero.src = hero.sprite; };
  loadHero.src = hero.heroSprite;
  cv.setAttribute("aria-label", `${hero.name} runs and jumps through the letter trail`);
  ["meadow", "dino", "moonwood"].forEach(k => { const im = new Image(); im.onload = () => { BGIMG[k] = im; }; im.src = "/images/games/bg-" + k + ".webp"; });
  const currentChar = () => heroImage;
  const sprLoad = (key, file) => { const im = new Image(); im.onload = () => { try { SPR[key] = alphaTrim(im); } catch { SPR[key] = im; } }; im.src = "/images/games/" + file; };
  sprLoad("grumper", "enemy-grumper.webp");
  const platformImage = new Image();
  platformImage.onload = () => { SPR.platform = platformImage; };
  platformImage.src = "/images/games/tile-platform.webp";

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    const elapsed = last ? Math.min(0.05, (now - last) / 1000) : FIXED_STEP;
    last = now;
    frameAccumulator = Math.min(0.1, frameAccumulator + elapsed);
    while (frameAccumulator >= FIXED_STEP) {
      update(FIXED_STEP);
      frameAccumulator -= FIXED_STEP;
    }
    draw();
  }
  rafId = requestAnimationFrame(loop);
  startStage();

  let paused = false, savedRunning = false, onboarding = false;
  function pause() { if (paused) return; paused = true; savedRunning = running; running = false; releaseInputs(); }
  function resume() { if (!paused || onboarding) return; paused = false; last = performance.now(); frameAccumulator = 0; if (savedRunning) running = true; }

  function teardown() {
    running = false;
    delete mount.__letterLeapSnapshot;
    closeOverlayDialog();
    cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp);
    holders.forEach(([el, down, up, cancel, click]) => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
      el.removeEventListener("lostpointercapture", up);
      el.removeEventListener("click", click);
    });
    elHear?.removeEventListener("click", speakTarget);
    ro.disconnect();
    [cv, hud, responsiveStyle, padWrap, overlay].forEach(n => { try { n.remove(); } catch { /* ignore */ } });
  }
  if (import.meta.env.DEV && window.location.pathname === "/preview/game-overlay.html") {
    mount.__letterLeapSnapshot = () => ({
      player: player ? { ...player, stood: undefined } : null, cam, camY, running,
      word, wordIndex: wIx, letterIndex: nextIx, stageIndex: stageIdx,
      wordsDone: wordsDoneGlobal, wrongHits, wordTransitionT,
      bubbles: level.bubbles.map(b => ({ ...b })),
      foes: level.foes.map(f => ({ ...f })), blocks: level.blocks.map(b => ({ ...b })),
      platforms: level.plats.map(p => ({ ...p })), pits: level.pits.map(p => [...p]),
      springs: level.springs.map(sp => ({ ...sp })), sections: level.sections.map(section => ({ ...section })),
      groundY: groundY(), flag: level.flag, height: H
    });
  }
  return { teardown, pause, resume, refreshSoundState: renderWord };
}

export default function LetterLeapGame({ difficulty = "easy", startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const soundRef = useRef(isSoundEnabled);
  useEffect(() => {
    soundRef.current = isSoundEnabled;
    engineRef.current?.refreshSoundState?.();
    const hear = mountRef.current?.querySelector?.('[data-ll="hear"]');
    if (!hear) return;
    const enabled = isSoundEnabled && hear.dataset.audioAvailable === "true";
    hear.disabled = !enabled;
    hear.style.display = enabled ? "grid" : "none";
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
    engineRef.current = api;
    if (onEngineReady) onEngineReady(api);
    return () => {
      if (engineRef.current === api) engineRef.current = null;
      try { api.teardown(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);
  return (
    <div
      className="letter-leap"
      ref={mountRef}
      style={{ position: "relative", width: "100%", height: "100%", minHeight: 0, overflow: "hidden", background: "#0a1020", touchAction: "none" }}
    />
  );
}
