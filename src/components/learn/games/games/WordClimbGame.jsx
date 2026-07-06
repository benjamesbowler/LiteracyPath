import { useEffect, useRef } from "react";
import {
  playCorrectChime,
  playPopSound,
  playSoftBuzz,
  playStarChime,
  playCelebrationFanfare
} from "../../../../utils/audio/gameSfx";
import { rocketRunTargets, buildRocketRunRound, rocketRunStars } from "../../../../utils/rocketRunRounds.js";

// Word Climb: a read-and-choose vertical jumper. Three identical-looking ledges
// appear; the child taps the one whose word STARTS with the target sound and
// the climber leaps up the beanstalk toward the summit. Pure DOM/CSS (no WebGL),
// reuses the tested rocketRunRounds engine so every round is fair and winnable.
const LANES = [0.085, 0.35, 0.615]; // ledge left edges as fraction of width
const LEDGE_W = 0.3;

function summitFor(difficulty) {
  return difficulty === "hard" ? 10 : difficulty === "medium" ? 8 : 6;
}

function startGame(mount, opts) {
  const summit = summitFor(opts.difficulty);
  const target = rocketRunTargets()[Math.floor(Math.random() * rocketRunTargets().length)] || "s";
  const round = buildRocketRunRound(target, { count: summit * 2 });
  const correctPool = round.correct.length ? round.correct : ["sun"];
  const distractorPool = round.distractors.length ? round.distractors : ["map", "top"];
  const sfx = fn => { if (opts.isSoundEnabled) { try { fn(); } catch { /* audio optional */ } } };
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  mount.innerHTML = "";
  mount.style.cssText = "position:relative;width:100%;height:100%;min-height:440px;border-radius:20px;overflow:hidden;font-family:var(--kid-font-display,Fredoka,sans-serif);background:radial-gradient(120% 80% at 50% 120%,#123a2a 0%,#0c2340 42%,#070c1a 100%);color:#fff;touch-action:manipulation";
  mount.innerHTML =
    '<div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(2px 2px at 15% 20%,#8fb4ff55,transparent),radial-gradient(1.5px 1.5px at 80% 15%,#ffffff33,transparent),radial-gradient(2px 2px at 60% 35%,#7fe0c044,transparent)"></div>' +
    '<div data-wc="hud" style="position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-start;padding:14px 16px;z-index:5">' +
      '<div style="display:flex;align-items:center;gap:10px;background:rgba(10,18,40,.7);border:1px solid rgba(120,160,255,.28);border-radius:999px;padding:6px 14px 6px 7px">' +
        '<div style="width:44px;height:44px;display:grid;place-items:center;font-size:1.5rem;font-weight:700;border-radius:13px;color:#0a1a12;background:linear-gradient(150deg,#5fe0a0,#28b97a);box-shadow:0 4px 0 #1c7f56">' + target + '</div>' +
        '<div style="font-size:1rem;font-weight:600">Climb the <b>' + target + '</b> words!</div></div>' +
      '<div style="text-align:right"><div data-wc="stars" style="font-size:1.3rem;letter-spacing:2px">✩✩✩</div>' +
        '<div style="width:14px;height:140px;border-radius:999px;background:rgba(255,255,255,.14);position:relative;overflow:hidden;margin-left:auto;margin-top:6px"><i data-wc="fill" style="position:absolute;left:0;right:0;bottom:0;height:0;border-radius:999px;background:linear-gradient(0deg,#5fe0a0,#9df0c8);transition:height .4s cubic-bezier(.2,.9,.3,1)"></i></div></div>' +
    '</div>' +
    '<div data-wc="ledges"></div>' +
    '<div data-wc="climber" style="position:absolute;width:48px;height:52px;z-index:3;transition:left .4s cubic-bezier(.34,1.5,.5,1),bottom .4s cubic-bezier(.3,.7,.3,1)">' +
      '<svg width="48" height="52" viewBox="0 0 52 56"><path d="M26 4 C36 14 36 30 26 44 C16 30 16 14 26 4 Z" fill="#ffd34e" stroke="#c9781a" stroke-width="2"/><circle cx="26" cy="21" r="6" fill="#12183a"/></svg></div>' +
    '<div data-wc="overlay" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;background:radial-gradient(120% 90% at 50% 20%,rgba(20,50,40,.7),rgba(6,12,24,.94));z-index:20"></div>';

  const el = k => mount.querySelector('[data-wc="' + k + '"]');
  const ledges = el("ledges");
  const climber = el("climber");
  const W = () => mount.clientWidth || 480;
  const Hh = () => mount.clientHeight || 440;
  const laneCenter = lane => LANES[lane] * W() + (LEDGE_W * W()) / 2;
  const LEDGE_BOTTOM = () => Math.round(Hh() * 0.5);
  const GROUND = () => Math.round(Hh() * 0.13);

  let height = 0;
  let wrongHits = 0;
  let running = true;
  let busy = false;

  function placeClimber(lane, bottom) {
    climber.style.left = (laneCenter(lane) - 24) + "px";
    climber.style.bottom = bottom + "px";
  }
  function setFill() { el("fill").style.height = Math.min(100, Math.round((100 * height) / summit)) + "%"; }

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
      ledge.style.cssText = "position:absolute;width:30%;max-width:180px;height:60px;border-radius:16px;display:grid;place-items:center;font-size:clamp(1rem,3.2vw,1.4rem);font-weight:700;cursor:pointer;color:#fff;background:#16223f;border:1px solid rgba(255,255,255,.1);box-shadow:0 8px 0 rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.08);transition:transform .38s cubic-bezier(.2,.8,.3,1),opacity .3s,background .2s;left:" + (LANES[l] * 100) + "%;bottom:" + LEDGE_BOTTOM() + "px";
      if (fromTop) { ledge.style.transform = "translateY(-60px)"; ledge.style.opacity = "0"; requestAnimationFrame(() => { ledge.style.transform = "translateY(0)"; ledge.style.opacity = "1"; }); }
      ledge.addEventListener("pointerdown", () => tap(ledge, item, l));
      ledges.appendChild(ledge);
    }
  }

  function tap(ledge, item, lane) {
    if (!running || busy) return;
    if (item.correct) {
      busy = true;
      height += 1;
      setFill();
      sfx(playCorrectChime);
      sfx(playPopSound);
      placeClimber(lane, LEDGE_BOTTOM());
      if (opts.onProgressUpdate) opts.onProgressUpdate(height, summit);
      if (height >= summit) { setTimeout(endGame, 460); return; }
      setTimeout(() => {
        Array.from(ledges.children).forEach(c => { c.style.transform = "translateY(80px)"; c.style.opacity = "0"; });
        setTimeout(() => { placeClimber(1, GROUND()); spawnLedges(true); busy = false; }, 230);
      }, 520);
    } else {
      wrongHits += 1;
      sfx(playSoftBuzz);
      ledge.style.background = "#3a2130";
      ledge.style.borderColor = "#8a4a5a";
      setTimeout(() => { ledge.style.background = "#16223f"; ledge.style.borderColor = "rgba(255,255,255,.1)"; }, 320);
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
    overlay.innerHTML = '<div><div style="font-size:2rem;font-weight:700">' + (stars === 3 ? "Perfect climb!" : "You reached the top!") + '</div><div style="opacity:.85;margin-top:6px;font-size:1.5rem">' + "★".repeat(stars) + "✩".repeat(3 - stars) + '</div></div>';
    if (opts.onProgressUpdate) opts.onProgressUpdate(summit, summit);
    if (opts.onComplete) opts.onComplete(stars, height * 10, summit);
  }

  const onResize = () => { if (running && !busy) { placeClimber(1, GROUND()); Array.from(ledges.children).forEach(c => { c.style.bottom = LEDGE_BOTTOM() + "px"; }); } };
  window.addEventListener("resize", onResize);

  setFill();
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

  return <div className="word-climb" ref={mountRef} style={{ width: "100%", height: "100%", minHeight: "440px" }} />;
}
