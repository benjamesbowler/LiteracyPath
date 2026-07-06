import { useEffect, useRef } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playCelebrationFanfare
} from "../../../../utils/audio/gameSfx";
import { rocketRunTargets, buildRocketRunRound, rocketRunStars } from "../../../../utils/rocketRunRounds.js";

// Word Climb: a read-and-choose vertical jumper. Three leaf-platforms appear on
// the beanstalk; the child taps the one whose word STARTS with the target sound
// and the sprout-climber leaps up toward the canopy. Pure DOM/CSS (no WebGL),
// reuses the tested rocketRunRounds engine so every round is fair and winnable.
const LANES = [0.14, 0.38, 0.62]; // ledge left edges as fraction of width
const LEDGE_W = 0.26;

function summitFor(difficulty) {
  return difficulty === "hard" ? 10 : difficulty === "medium" ? 8 : 6;
}

function startGame(mount, opts) {
  const summit = summitFor(opts.difficulty);
  const targets = rocketRunTargets();
  const target = targets[Math.floor(Math.random() * targets.length)] || "s";
  const round = buildRocketRunRound(target, { count: summit * 2 });
  const correctPool = round.correct.length ? round.correct : ["sun"];
  const distractorPool = round.distractors.length ? round.distractors : ["map", "top"];
  const sfx = fn => { if (opts.isSoundEnabled) { try { fn(); } catch { /* audio optional */ } } };
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  mount.innerHTML = "";
  mount.style.cssText = "position:relative;width:100%;height:100%;min-height:460px;border-radius:20px;overflow:hidden;font-family:var(--kid-font-display,Fredoka,sans-serif);color:#fff;touch-action:manipulation;background:linear-gradient(180deg,#0a1430 0%,#0c2340 46%,#123a2a 100%)";

  // ── Scene: glow beam, climbing guide, foliage, fireflies ─────────────────
  mount.innerHTML =
    '<style>' +
    '@keyframes wcbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}' +
    '@keyframes wcdrift{0%{transform:translate(0,0);opacity:.2}50%{opacity:.9}100%{transform:translate(14px,-26px);opacity:.2}}' +
    '@keyframes wcglow{0%,100%{opacity:.35}50%{opacity:.6}}' +
    '</style>' +
    '<div style="position:absolute;left:50%;top:0;bottom:0;width:180px;transform:translateX(-50%);background:radial-gradient(60% 80% at 50% 40%,rgba(95,224,160,.16),transparent 70%);animation:wcglow 4s ease-in-out infinite;pointer-events:none"></div>' +
    // dashed climbing guide up the centre
    '<div style="position:absolute;left:50%;top:8%;bottom:14%;width:0;transform:translateX(-50%);border-left:3px dashed rgba(120,220,170,.35);pointer-events:none"></div>' +
    // foliage silhouettes (framing depth)
    '<svg viewBox="0 0 400 260" preserveAspectRatio="none" style="position:absolute;left:0;right:0;bottom:0;width:100%;height:38%;pointer-events:none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M0 260 L0 150 Q60 90 110 150 Q150 100 210 150 Q270 90 330 150 Q380 110 400 150 L400 260 Z" fill="#0d2b1e"/>' +
      '<path d="M0 260 L0 200 Q80 150 150 200 Q220 150 300 200 Q360 165 400 200 L400 260 Z" fill="#123a2a"/>' +
    '</svg>' +
    '<div data-wc="fireflies" style="position:absolute;inset:0;pointer-events:none"></div>' +
    // HUD: target chip + stars
    '<div style="position:absolute;top:14px;left:16px;display:flex;align-items:center;gap:10px;background:rgba(10,18,40,.72);border:1px solid rgba(120,160,255,.28);border-radius:999px;padding:6px 16px 6px 7px;z-index:6;backdrop-filter:blur(6px)">' +
      '<div style="width:44px;height:44px;display:grid;place-items:center;font-size:1.5rem;font-weight:700;border-radius:13px;color:#0a1a12;background:linear-gradient(150deg,#5fe0a0,#28b97a);box-shadow:0 4px 0 #1c7f56">' + target + '</div>' +
      '<div style="font-size:1rem;font-weight:600">Climb the <b>' + target + '</b> words!</div></div>' +
    '<div data-wc="stars" style="position:absolute;top:18px;right:18px;font-size:1.5rem;letter-spacing:3px;z-index:6;text-shadow:0 2px 6px rgba(0,0,0,.5)">✩✩✩</div>' +
    '<div data-wc="ledges" style="position:absolute;inset:0;z-index:3"></div>' +
    // base pad + climber
    '<div data-wc="pad" style="position:absolute;width:96px;height:20px;border-radius:999px;background:radial-gradient(closest-side,#1b4d38,rgba(18,58,42,0));z-index:2"></div>' +
    '<div data-wc="climber" style="position:absolute;width:46px;height:50px;z-index:4;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45));animation:wcbob 2.6s ease-in-out infinite">' +
      '<svg width="46" height="50" viewBox="0 0 46 50" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="wcgem" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#c8f7e0"/><stop offset="1" stop-color="#28b97a"/></radialGradient></defs>' +
      '<circle cx="23" cy="26" r="16" fill="url(#wcgem)" stroke="#0f6b48" stroke-width="2"/>' +
      '<ellipse cx="18" cy="20" rx="5" ry="3" fill="rgba(255,255,255,.6)"/>' +
      '<path d="M23 10 q8 -6 14 -3 q-3 8 -14 5 Z" fill="#2fae74" stroke="#0f6b48" stroke-width="1"/></svg></div>' +
    '<div data-wc="overlay" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;background:radial-gradient(120% 90% at 50% 20%,rgba(20,50,40,.72),rgba(6,12,24,.94));z-index:20"></div>';

  const el = k => mount.querySelector('[data-wc="' + k + '"]');
  const ledges = el("ledges");
  const climber = el("climber");
  const pad = el("pad");
  const W = () => mount.clientWidth || 480;
  const Hh = () => mount.clientHeight || 460;
  const laneCenter = lane => LANES[lane] * W() + (LEDGE_W * W()) / 2;
  const LEDGE_BOTTOM = () => Math.round(Hh() * 0.46);
  const GROUND = () => Math.round(Hh() * 0.15);

  // fireflies
  const ff = el("fireflies");
  for (let i = 0; i < 9; i += 1) {
    const f = document.createElement("div");
    const size = 4 + Math.random() * 4;
    f.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;border-radius:50%;background:radial-gradient(closest-side,#eaffb0,rgba(180,255,120,0));left:" + (8 + Math.random() * 84) + "%;top:" + (30 + Math.random() * 60) + "%;animation:wcdrift " + (4 + Math.random() * 4) + "s ease-in-out infinite;animation-delay:" + (Math.random() * 4) + "s";
    ff.appendChild(f);
  }

  let height = 0;
  let wrongHits = 0;
  let running = true;
  let busy = false;

  function placeClimber(lane, bottom) {
    climber.style.left = (laneCenter(lane) - 23) + "px";
    climber.style.bottom = bottom + "px";
    pad.style.left = (laneCenter(lane) - 48) + "px";
    pad.style.bottom = (bottom - 8) + "px";
  }

  function spawnLedges(fromTop) {
    ledges.innerHTML = "";
    const correctLane = Math.floor(Math.random() * 3);
    const cor = shuffle(correctPool);
    const wr = shuffle(distractorPool);
    let ci = 0;
    let wi = 0;
    for (let l = 0; l < 3; l += 1) {
      const item = l === correctLane ? { w: cor[ci++ % cor.length], correct: true } : { w: wr[wi++ % wr.length], correct: false };
      const ledge = document.createElement("div");
      ledge.textContent = item.w;
      // All ledges look identical - the child must READ the word, never guess.
      ledge.style.cssText = "position:absolute;width:26%;max-width:170px;height:62px;border-radius:16px;display:grid;place-items:center;font-size:clamp(1rem,3.2vw,1.4rem);font-weight:700;cursor:pointer;color:#fff;" +
        "background:linear-gradient(180deg,#1e5540,#123a2a);border:1px solid rgba(140,230,180,.28);" +
        "box-shadow:0 10px 0 rgba(4,20,14,.5),0 0 26px rgba(60,190,120,.14),inset 0 2px 0 rgba(190,255,225,.18);" +
        "transition:transform .4s cubic-bezier(.2,.8,.3,1),opacity .3s;left:" + (LANES[l] * 100) + "%;bottom:" + LEDGE_BOTTOM() + "px";
      if (fromTop) { ledge.style.transform = "translateY(-70px)"; ledge.style.opacity = "0"; requestAnimationFrame(() => { ledge.style.transform = "translateY(0)"; ledge.style.opacity = "1"; }); }
      ledge.addEventListener("pointerdown", () => tap(ledge, item, l));
      ledges.appendChild(ledge);
    }
  }

  function puff(lane, bottom) {
    const p = document.createElement("div");
    p.style.cssText = "position:absolute;width:70px;height:28px;border-radius:50%;left:" + (laneCenter(lane) - 35) + "px;bottom:" + (bottom - 6) + "px;background:radial-gradient(closest-side,rgba(200,255,225,.7),transparent 70%);pointer-events:none;z-index:5";
    mount.appendChild(p);
    p.animate([{ opacity: 0.8, transform: "scale(.5)" }, { opacity: 0, transform: "scale(1.7)" }], { duration: 420, easing: "ease-out" });
    setTimeout(() => p.remove(), 440);
  }

  function tap(ledge, item, lane) {
    if (!running || busy) return;
    if (item.correct) {
      busy = true;
      height += 1;
      sfx(playCorrectChime);
      sfx(playPopSound);
      placeClimber(lane, LEDGE_BOTTOM());
      setTimeout(() => puff(lane, LEDGE_BOTTOM()), 240);
      if (opts.onProgressUpdate) opts.onProgressUpdate(height, summit);
      if (height >= summit) { setTimeout(endGame, 480); return; }
      setTimeout(() => {
        Array.from(ledges.children).forEach(c => { c.style.transform = "translateY(90px)"; c.style.opacity = "0"; });
        setTimeout(() => { placeClimber(1, GROUND()); spawnLedges(true); busy = false; }, 240);
      }, 520);
    } else {
      wrongHits += 1;
      sfx(playSoftBuzz);
      ledge.style.background = "linear-gradient(180deg,#5a2436,#3a2130)";
      ledge.style.borderColor = "#8a4a5a";
      ledge.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 320 });
      setTimeout(() => { ledge.style.background = "linear-gradient(180deg,#1e5540,#123a2a)"; ledge.style.borderColor = "rgba(140,230,180,.28)"; }, 340);
    }
  }

  function endGame() {
    running = false;
    const stars = rocketRunStars(height, summit, wrongHits);
    sfx(playStarChime);
    sfx(playCelebrationFanfare);
    el("stars").textContent = "★".repeat(stars) + "✩".repeat(3 - stars);
    const overlay = el("overlay");
    overlay.style.display = "grid";
    overlay.innerHTML = '<div><div style="font-size:2rem;font-weight:700">' + (stars === 3 ? "You reached the canopy!" : "You reached the top!") + '</div><div style="opacity:.9;margin-top:6px;font-size:1.6rem">' + "★".repeat(stars) + "✩".repeat(3 - stars) + '</div></div>';
    if (opts.onProgressUpdate) opts.onProgressUpdate(summit, summit);
    if (opts.onComplete) opts.onComplete(stars, height * 10, summit);
  }

  const onResize = () => { if (running && !busy) { placeClimber(1, GROUND()); Array.from(ledges.children).forEach(c => { c.style.bottom = LEDGE_BOTTOM() + "px"; }); } };
  window.addEventListener("resize", onResize);

  placeClimber(1, GROUND());
  spawnLedges(false);
  if (opts.onProgressUpdate) opts.onProgressUpdate(0, summit);

  return function teardown() {
    running = false;
    window.removeEventListener("resize", onResize);
  };
}

export default function WordClimbGame({ difficulty = "easy", onProgressUpdate, onComplete, isSoundEnabled = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const teardown = startGame(mountRef.current, { difficulty, onProgressUpdate, onComplete, isSoundEnabled });
    return () => { try { teardown(); } catch { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return <div className="word-climb" ref={mountRef} style={{ width: "100%", height: "100%", minHeight: "460px" }} />;
}
