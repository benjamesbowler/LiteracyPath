import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildLevel, WORLD_BY_DIFFICULTY, LEVELS_PER_LINE } from "../../../../utils/sentenceExpressLevels.js";
import { starRubric } from "../../../../utils/starRubric.js";
import { sfx } from "../../../../utils/trainSfx.js";
import { wordAudioPath } from "../../../elQuest/elQuestEngine.js";
import "../../../../styles/sentence-express.css";
import { loadExpressSnapshot, saveExpressSnapshot } from "./sentenceExpressSession.js";
import { createJourneyClock } from "./sentenceExpressJourney.js";
import CarSvg from "./SentenceExpressRollingStock.jsx";

// SENTENCE EXPRESS - flagship game. You are the yard master: rebuild the
// broken sentence-train (couple carriages in order, swap the rusty wrong-word
// car at the repair shed, load the missing crate, pick the capital engine and
// the end-mark caboose), pull the whistle, then read the sentence back as the
// train departs through a scrolling low-poly landscape.
// The arcade adapter owns run totals; the game preserves the current train.

const PHASES = { INTRO: "intro", SHUNT: "shunt", DEPART: "depart", TALLY: "tally" };
const STOPS = { meadow: ["Willow Halt", "River Bridge", "Orchard Yard", "Hilltop Station"], dino: ["Canyon Halt", "Fossil Bridge", "Fern Valley", "Red Rock Yard"], moonwood: ["Lantern Halt", "Moon Bridge", "Moss Hollow", "Star Station"] };
const WORLD_LABELS = { meadow: "MEADOW LINE", dino: "DINO CANYON LINE", moonwood: "MOONWOOD NIGHT LINE" };

// One-line corrective hint per miss kind (the engine shed's
// "Only a capital can lead the train!" is the model).
const MISS_HINTS = {
  order: "Not that car - which word comes next?",
  rusty: "Rusty car! Swap it at the repair shed first.",
  engine: "Only a capital can lead the train!",
  caboose: "That mark does not end this sentence.",
  "early-caboose": "Couple every carriage first!",
  repair: "That is not the word the master said.",
  crate: "That is not the missing word."
};
const TONES = [["#4a90d9", "#2f5d94"], ["#e9a23b", "#a96f16"], ["#3aa17e", "#256b52"], ["#8d6bd9", "#5a3f93"]];

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
      <path d="M12 2.5 15 9l7 .7-5.2 4.6 1.6 6.9L12 17.5 5.6 21.2l1.6-6.9L2 9.7 9 9z"
        fill={filled ? "#f4b942" : "rgba(0,0,0,0.08)"} stroke="#16202e" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

// The station master's brass lantern - the "listen" beacon.
function LanternBadge() {
  return (
    <svg viewBox="0 0 40 52" width="40" height="52" aria-hidden="true">
      <rect x="17" y="2" width="6" height="7" rx="2" fill="#3c485c" stroke="#10151d" strokeWidth="2" />
      <rect x="10" y="8" width="20" height="8" rx="3" fill="#5b4226" stroke="#10151d" strokeWidth="2" />
      <rect x="12" y="16" width="16" height="24" rx="5" fill="#ffd76a" stroke="#10151d" strokeWidth="2.5" />
      <circle cx="20" cy="28" r="5" fill="#fff3c4" />
      <rect x="10" y="40" width="20" height="7" rx="3" fill="#5b4226" stroke="#10151d" strokeWidth="2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6z" fill="#ffd76a" stroke="#16202e" strokeWidth="1.4" />
      <circle cx="12" cy="19.5" r="2" fill="#ffd76a" stroke="#16202e" strokeWidth="1.4" />
    </svg>
  );
}

function GhostSvg() {
  return (
    <svg className="sx-carsvg" viewBox="0 0 150 116" aria-hidden="true">
      <rect x="8" y="30" width="134" height="60" rx="8" fill="rgba(255,255,255,0.10)"
        stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeDasharray="10 8" />
      <circle cx="42" cy="103" r="11" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeDasharray="6 6" />
      <circle cx="108" cy="103" r="11" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeDasharray="6 6" />
    </svg>
  );
}

// Dust kicked up when a carriage slams into place (dx, dy scatter).
const DUST = [[-34, -8], [-20, -24], [0, -30], [20, -24], [34, -8], [10, -34]];

function TrainCar({ kind = "wagon", tone = 0, word, ghost = false, lit = false, rusty = false, arrived = false, small = false, smoking = false, blasting = false, onClick, label }) {
  const cls = `sx-carbox sx-kind-${kind} ${small ? "sx-small" : ""} ${ghost ? "sx-ghostbox" : ""} ${lit ? "sx-lit" : ""} ${arrived ? "sx-arrive" : ""}`;
  const body = (
    <>
      {ghost ? <GhostSvg /> : <CarSvg kind={kind} tone={tone} rusty={rusty} />}
      <span className={`sx-carword ${kind === "caboose" ? "sx-markword" : ""}`}>{ghost ? "+" : word}</span>
      {rusty && <span className="sx-rustwisp" aria-hidden="true" />}
      {smoking && (
        <span className="sx-smokes" aria-hidden="true">
          {[0, 1, 2, 3, 4].map(i => <span key={i} className="sx-smoke" style={{ animationDelay: `${i * 0.45}s` }} />)}
        </span>
      )}
      {blasting && (
        <span className="sx-smokes sx-blastset" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map(i => <span key={i} className="sx-smoke sx-blast" style={{ animationDelay: `${i * 0.09}s` }} />)}
        </span>
      )}
      {arrived && DUST.map(([dx, dy], i) => (
        <span key={i} className="sx-dust" style={{ "--dx": `${dx}px`, "--dy": `${dy}px` }} aria-hidden="true" />
      ))}
    </>
  );
  if (onClick) {
    return <button type="button" className={cls} style={{ "--car-length": `${Math.max(kind === "engine" ? 130 : 106, String(word || "").length * 13 + 40)}px` }} onClick={onClick} aria-label={label || `carriage ${word}`}>{body}</button>;
  }
  return <div className={cls}>{body}</div>;
}

function Scenery({ world }) {
  return <>
    <div className="sx-landscape" aria-hidden="true" />
    {world === "moonwood" && [18, 38, 65, 84].map((left, i) =>
      <span key={left} className="sx-glowbug" aria-hidden="true" style={{ left: `${left}%`, top: `${31 + i * 4}%`, animationDelay: `${i * .7}s` }} />)}
  </>;
}

// Scrolling foreground strip under the track: grass tufts (meadow),
// rocks and bones (dino), glowing mushrooms (moonwood). Rendered twice
// side-by-side so the depart run can loop it seamlessly.
function ForeSvg({ world }) {
  const slots = Array.from({ length: 16 }, (_, i) => i);
  return (
    <svg className="sx-foresvg" viewBox="0 0 800 42" preserveAspectRatio="none" aria-hidden="true">
      {slots.map(i => {
        const x = i * 50 + ((i * 37) % 21);
        if (world === "dino") {
          return i % 3 === 2
            ? <g key={i}><rect x={x} y="30" width="10" height="4" rx="2" className="sx-f-bone" /><rect x={x + 12} y="28" width="4" height="8" rx="2" className="sx-f-bone" /></g>
            : <ellipse key={i} cx={x + 10} cy={36} rx={9 + ((i * 13) % 7)} ry={5 + ((i * 7) % 3)} className="sx-f-rock" />;
        }
        if (world === "moonwood") {
          return i % 3 === 1
            ? <g key={i}><rect x={x + 6} y="26" width="5" height="12" rx="2" className="sx-f-stem" /><ellipse cx={x + 8.5} cy="26" rx="9" ry="6" className="sx-f-cap" /><circle cx={x + 8.5} cy="24" r="1.6" className="sx-f-spot" /></g>
            : <ellipse key={i} cx={x + 8} cy={38} rx={10} ry={4} className="sx-f-moss" />;
        }
        return i % 4 === 3
          ? <g key={i}><circle cx={x + 6} cy="28" r="3.4" className="sx-f-flower" /><rect x={x + 5} y="30" width="2" height="10" className="sx-f-stem" /></g>
          : <path key={i} d={`M${x} 40 q3 -12 6 0 q2 -9 5 0 q3 -12 6 0 z`} className="sx-f-grass" />;
      })}
    </svg>
  );
}

function playWord(word, onEnd) {
  const path = wordAudioPath(String(word).toLowerCase().replace(/[.?!]/g, ""));
  if (!path) { onEnd?.(); return null; }
  try {
    const audio = new Audio(path);
    if (onEnd) audio.addEventListener("ended", onEnd, { once: true });
    audio.play().catch(() => onEnd?.());
    return audio;
  } catch { onEnd?.(); return null; }
}

// Every timeout and word-audio element is registered so pause and unmount
// can cancel all of them (GamePlayer pauses on tab-hide and quit dialog).
function scheduleTimer(registry, timer) {
  timer.started = performance.now();
  timer.native = window.setTimeout(() => { registry.delete(timer); timer.fn(); }, timer.remaining);
}
function later(registry, ms, fn) {
  const timer = { remaining: ms, fn, native: null, started: performance.now() };
  registry.add(timer);
  if (!registry.paused) scheduleTimer(registry, timer);
  return timer;
}
function cancelLater(registry, timer) {
  registry.delete(timer);
  window.clearTimeout(timer.native);
}
function pauseTimers(registry) {
  registry.paused = true;
  for (const timer of registry) {
    if (timer.native !== null) timer.remaining = Math.max(0, timer.remaining - (performance.now() - timer.started));
    window.clearTimeout(timer.native);
    timer.native = null;
  }
}
function resumeTimers(registry) {
  registry.paused = false;
  for (const timer of registry) scheduleTimer(registry, timer);
}
function playWordTracked(registry, word, onEnd) {
  const audio = playWord(word, onEnd);
  if (audio) {
    registry.add(audio);
    audio.addEventListener("ended", () => registry.delete(audio), { once: true });
  }
  return audio;
}

// -- Game ---------------------------------------------------------------------
export default function SentenceExpressGame({
  difficulty = "easy",
  startLevel = 0,
  sessionKey,
  resumeEligible = false,
  isSoundEnabled = true,
  onComplete = () => {},
  onQuit = () => {},
  onReplay,
  // GamePlayer pauses on tab-hide and while its quit dialog is open.
  onEngineReady,
  // The arcade shell (GamePlayer) has its own close button; hide ours there
  // so onQuit fires only at the true end of the 10-level run.
  showQuit = true
}) {
  const [saved] = useState(() => resumeEligible ? loadExpressSnapshot(sessionKey, startLevel) : null);
  const world = WORLD_BY_DIFFICULTY[difficulty] || "meadow";
  const [levelIndex, setLevelIndex] = useState(Math.max(0, Math.min(LEVELS_PER_LINE - 1, startLevel)));
  const level = useMemo(() => buildLevel(difficulty, levelIndex), [difficulty, levelIndex]);
  const [trainIndex, setTrainIndex] = useState(saved?.trainIndex || 0);
  const [queue, setQueue] = useState(() => (saved?.queue || []).map(id => level.trains.find(t => t.id === id)).filter(Boolean)); // catch-up: failed trains re-run once
  const train = queue.length && trainIndex >= level.trains.length
    ? queue[0]
    : level.trains[Math.min(trainIndex, level.trains.length - 1)];

  const [finished, setFinished] = useState(false);
  const ticketButton = useRef(null);
  const [phase, setPhase] = useState(saved?.phase ?? PHASES.SHUNT);
  const [coupled, setCoupled] = useState(saved?.coupled ?? []);
  const [engineChoice, setEngineChoice] = useState(saved?.engineChoice ?? null);
  const [cabooseChoice, setCabooseChoice] = useState(saved?.cabooseChoice ?? null);
  const [rustyFixed, setRustyFixed] = useState(saved?.rustyFixed ?? false);
  const [gapFilled, setGapFilled] = useState(saved?.gapFilled ?? false);
  const [jolt, setJolt] = useState(false);
  const [bump, setBump] = useState(false);
  const [banner, setBanner] = useState("");
  const [stamp, setStamp] = useState(false);
  const [delay, setDelay] = useState(saved?.delay ?? 0);       // this train's mistakes
  const [mistakes, setMistakes] = useState(saved?.mistakes ?? 0); // level total
  const [combo, setCombo] = useState(saved?.combo ?? 1);
  const [express, setExpress] = useState(saved?.express ?? 0);
  const [litWord, setLitWord] = useState(-1);
  const [motion, setMotion] = useState("enter"); // enter -> idle -> out
  const [blast, setBlast] = useState(false);     // whistle steam burst
  const [comboToast, setComboToast] = useState("");
  const [hint, setHint] = useState(""); // one-line corrective hint after a miss

  const paused = useRef(false);
  const stageRef = useRef(null);
  const pausedAnimations = useRef([]);
  const departureFrame = useRef(null);
  const journeyClock = useRef(null);
  const journeyAnimations = useRef([]);
  const audioRef = useRef(null);
  const chuffStop = useRef(null);
  const timers = useRef(new Set());       // every pending timeout id
  const wordAudios = useRef(new Set());   // every live word-audio element
  const departResume = useRef(null);      // depart read-back continuation while paused
  const announceResume = useRef(null);    // station-master read-aloud continuation
  const phaseRef = useRef(PHASES.SHUNT);
  const soundRef = useRef(isSoundEnabled);
  const speechGeneration = useRef(0);
  const [journey, setJourney] = useState(0);

  useLayoutEffect(() => {
    // Departure scores and its old train index must never be stored together.
    // Reloading mid-journey restores the already-built train before its award.
    if (phase === PHASES.DEPART) return;
    saveExpressSnapshot(sessionKey, { levelIndex, trainIndex, queue: queue.map(t => t.id), phase, coupled, engineChoice, cabooseChoice, rustyFixed, gapFilled, delay, mistakes, combo, express });
  }, [sessionKey, levelIndex, trainIndex, queue, phase, coupled, engineChoice, cabooseChoice, rustyFixed, gapFilled, delay, mistakes, combo, express]);

  useEffect(() => { if (phase === PHASES.TALLY) ticketButton.current?.focus(); }, [phase]);

  // The corrected word sequence the child must rebuild.
  const solution = useMemo(() => train.words.map((w, i) => {
    if (train.rusty && i === train.rusty.index) return train.rusty.correct;
    if (train.gap && i === train.gap.index) return train.gap.correct;
    return w;
  }), [train]);

  const needsEngine = Boolean(train.engine) && engineChoice === null;
  const nextSlot = coupled.length;
  const trackDone = coupled.length === train.words.length
    && (!train.caboose || cabooseChoice === train.endMark)
    && (!train.engine || engineChoice === train.engine.correct);

  useEffect(() => {
    soundRef.current = isSoundEnabled;
    if (!isSoundEnabled) {
      speechGeneration.current += 1;
      audioRef.current?.pause?.();
      audioRef.current = null;
      chuffStop.current?.();
      chuffStop.current = null;
      announceResume.current = null;
      departResume.current = null;
    }
  }, [isSoundEnabled]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // GamePlayer freezes the game on tab-hide and while its quit dialog is
  // open: stop the chuff loop, checkpoint the depart chain, and pause any
  // playing word audio; resume picks everything back up.
  function enginePause() {
    if (paused.current) return;
    paused.current = true;
    pauseTimers(timers.current);
    journeyClock.current?.pause(performance.now());
    pausedAnimations.current = stageRef.current?.getAnimations({ subtree: true }).filter(animation => animation.playState === "running") || [];
    pausedAnimations.current.forEach(animation => animation.pause());
    chuffStop.current?.();
    chuffStop.current = null;
    audioRef.current?.pause?.();
  }
  function engineResume() {
    if (!paused.current) return;
    paused.current = false;
    resumeTimers(timers.current);
    journeyClock.current?.resume(performance.now());
    pausedAnimations.current.forEach(animation => animation.play());
    pausedAnimations.current = [];
    const pending = departResume.current || announceResume.current;
    departResume.current = null;
    announceResume.current = null;
    if (pending) pending();
    else if (soundRef.current) {
      const audio = audioRef.current;
      if (audio && !audio.ended && audio.paused) audio.play().catch(() => { /* needs a gesture first */ });
    }
    if (phaseRef.current === PHASES.DEPART && soundRef.current && !chuffStop.current) {
      chuffStop.current = sfx.startChuff();
    }
  }

  useEffect(() => {
    onEngineReady?.({ pause: enginePause, resume: engineResume });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callbacks only touch refs, register once
  }, []);

  useEffect(() => {
    const pendingTimers = timers.current;
    const liveAudios = wordAudios.current;
    return () => {
      cancelAnimationFrame(departureFrame.current);
      for (const timer of pendingTimers) window.clearTimeout(timer.native);
      pendingTimers.clear();
      chuffStop.current?.();
      for (const audio of liveAudios) { try { audio.pause(); } catch { /* already gone */ } }
      liveAudios.clear();
    };
  }, []);

  function announce() {
    if (!soundRef.current) return;
    const generation = ++speechGeneration.current;
    audioRef.current?.pause?.();
    let i = 0;
    const speakNext = () => {
      if (generation !== speechGeneration.current || i >= solution.length) return;
      if (paused.current) { announceResume.current = speakNext; return; }
      audioRef.current = playWordTracked(wordAudios.current, solution[i], () => { i += 1; speakNext(); });
    };
    speakNext();
  }
  // A fresh train rolls IN from off-screen, then the station master reads
  // the target sentence.
  useEffect(() => {
    if (phase !== PHASES.SHUNT) return undefined;
    const registry = timers.current;
    const t0 = later(registry, 0, () => setMotion("enter"));
    const tIn = later(registry, 90, () => setMotion("idle"));
    const stopArrivalChuff = isSoundEnabled ? sfx.startChuff() : () => {};
    chuffStop.current = stopArrivalChuff; // so enginePause silences it too
    const tChuff = later(registry, 1300, stopArrivalChuff);
    const tSay = later(registry, 1500, () => announce());
    return () => {
      cancelLater(registry, t0); cancelLater(registry, tIn);
      cancelLater(registry, tChuff); cancelLater(registry, tSay);
      stopArrivalChuff();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per train entry
  }, [phase, train.id]);

  useEffect(() => {
    if (!banner) return undefined;
    const registry = timers.current;
    const t = later(registry, 1300, () => setBanner(""));
    return () => cancelLater(registry, t);
  }, [banner]);

  useEffect(() => {
    if (!hint) return undefined;
    const registry = timers.current;
    const t = later(registry, 1700, () => setHint(""));
    return () => cancelLater(registry, t);
  }, [hint]);

  function miss(kind) {
    if (isSoundEnabled) sfx.buzz();
    setJolt(true);
    setDelay(d => d + 1);
    setMistakes(m => m + 1);
    setCombo(1);
    setHint(MISS_HINTS[kind] || "Try again!");
    later(timers.current, 460, () => setJolt(false));
    // Only order-type misses need the sentence again; panel misses just buzz.
    if ((kind === "order" || kind === "rusty") && isSoundEnabled) announce();
  }

  function goodBump() {
    if (isSoundEnabled) sfx.clunk();
    setBump(true);
    later(timers.current, 240, () => setBump(false));
  }

  function couple(wordIndex) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current || needsEngine || coupled.includes(wordIndex)) return;
    if (train.rusty && wordIndex === train.rusty.index && !rustyFixed) {
      miss("rusty"); // rusty car won't couple - repair shed first
      return;
    }
    // Correct if this carriage carries the word the next empty slot needs
    // (identical words like "the" are interchangeable by design).
    if (solution[wordIndex] === solution[nextSlot]) {
      setCoupled(c => c.includes(wordIndex) ? c : [...c, wordIndex]);
      goodBump();
      return;
    }
    miss("order");
  }

  function chooseEngine(option) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current) return;
    if (option === train.engine.correct) {
      setEngineChoice(option);
      setCoupled(c => (c.includes(0) ? c : [0, ...c]));
      goodBump();
    } else miss("engine");
  }
  function chooseCaboose(mark) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current) return;
    if (coupled.length < train.words.length) { miss("early-caboose"); return; }
    if (mark === train.endMark) { setCabooseChoice(mark); goodBump(); }
    else miss("caboose");
  }
  function repairRusty(option) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current) return;
    if (option === train.rusty.correct) { setRustyFixed(true); if (isSoundEnabled) sfx.ding(); }
    else miss("repair");
  }
  function loadCrate(option) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current) return;
    if (option === train.gap.correct) { setGapFilled(true); if (isSoundEnabled) sfx.ding(); }
    else miss("crate");
  }

  function depart() {
    if (!trackDone || phaseRef.current !== PHASES.SHUNT || paused.current) return;
    phaseRef.current = PHASES.DEPART;
    stageRef.current?.querySelector(".sx-train")?.scrollTo({ left: 0 });
    const onTime = delay === 0;
    if (onTime) {
      setExpress(e => e + 1);
      const next = Math.min(3, combo + 1);
      setCombo(next);
      if (next > 1) {
        setComboToast(`COMBO x${next}!`);
        later(timers.current, 1400, () => setComboToast(""));
      }
      setStamp(true);
      if (isSoundEnabled) later(timers.current, 550, () => { if (soundRef.current) sfx.stamp(); });
    }
    setBlast(true);
    later(timers.current, 1100, () => setBlast(false));
    if (isSoundEnabled) {
      sfx.whistle();
      sfx.crossingBell();
      chuffStop.current = sfx.startChuff();
    }
    setPhase(PHASES.DEPART);
    // The whistle starts travel immediately. Reading follows the moving train,
    // with one current clip and no narration gate before departure or next play.
    const generation = ++speechGeneration.current;
    audioRef.current?.pause?.();
    announceResume.current = null;
    setMotion("out");
    setJourney(0);
    journeyClock.current = createJourneyClock(performance.now());
    journeyAnimations.current = [];
    const travel = () => {
      const elapsed = journeyClock.current.elapsed(performance.now());
      if (!journeyAnimations.current.length) {
        const names = ["sx-follow-train", "sx-route-pan", "sx-station-pass", "sx-arriving-station"];
        journeyAnimations.current = stageRef.current?.getAnimations({ subtree: true }).filter(animation => names.includes(animation.animationName)) || [];
      }
      // The train, scenery and destination share the same unpaused clock even
      // after a long frame gap. Wheel rotation remains independent.
      if (!paused.current) for (const animation of journeyAnimations.current) animation.currentTime = Math.min(elapsed, 6500);
      setJourney(Math.min(1, elapsed / 6500));
      if (!paused.current && elapsed >= 6500) { departureFrame.current = null; finishTrain(); }
      else departureFrame.current = requestAnimationFrame(travel);
    };
    departureFrame.current = requestAnimationFrame(travel);
    let i = 0;
    const step = () => {
      if (generation !== speechGeneration.current || i >= solution.length) return;
      if (paused.current) { departResume.current = step; return; }
      if (soundRef.current) {
        const wordIndex = i;
        setLitWord(-1);
        audioRef.current = playWordTracked(wordAudios.current, solution[i], () => { i += 1; step(); });
        audioRef.current?.addEventListener("playing", () => {
          if (generation === speechGeneration.current) setLitWord(wordIndex);
        }, { once: true });
      } else {
        setLitWord(i);
        later(timers.current, 560, () => { i += 1; step(); });
      }
    };
    step();
  }

  function finishTrain() {
    speechGeneration.current += 1;
    audioRef.current?.pause?.();
    departResume.current = null;
    announceResume.current = null;
    chuffStop.current?.();
    chuffStop.current = null;
    setLitWord(-1);
    setStamp(false);
    const failedThisTrain = delay >= 3;
    const nextQueue = failedThisTrain && !queue.includes(train)
      ? [...queue, train]
      : queue.filter(t => t !== train);
    const moreMain = trainIndex + 1 < level.trains.length;
    if (moreMain || nextQueue.length) {
      setQueue(nextQueue);
      setTrainIndex(t => t + 1);
      resetTrainState();
      setBanner(failedThisTrain ? "We'll try that train again soon!" : "Next train is rolling in...");
      setPhase(PHASES.SHUNT);
    } else {
      if (isSoundEnabled) (level.isGoldRun ? sfx.fanfare() : sfx.chime());
      setPhase(PHASES.TALLY);
    }
  }

  function resetTrainState() {
    setCoupled([]); setEngineChoice(null); setCabooseChoice(null);
    setRustyFixed(false); setGapFilled(false); setDelay(0);
  }

  const stars = starRubric({
    correct: Math.max(0, level.totalTargets - mistakes),
    total: level.totalTargets,
    mistakes
  });

  function nextLevel() {
    if (phaseRef.current !== PHASES.TALLY || paused.current) return;
    phaseRef.current = PHASES.SHUNT;
    onComplete({ level: levelIndex, stars, mistakes, express });
    if (levelIndex + 1 < LEVELS_PER_LINE) {
      setLevelIndex(l => l + 1);
      setTrainIndex(0); setQueue([]); setMistakes(0); setExpress(0); setCombo(1);
      resetTrainState();
      setPhase(PHASES.SHUNT);
    } else {
      saveExpressSnapshot(sessionKey, null);
      setFinished(true);
      onQuit();
    }
  }

  function replayLine() {
    if (paused.current || !finished) return;
    onReplay?.();
    saveExpressSnapshot(sessionKey, null);
    setLevelIndex(0); setTrainIndex(0); setQueue([]);
    setMistakes(0); setExpress(0); setCombo(1); setFinished(false);
    resetTrainState();
    phaseRef.current = PHASES.SHUNT;
    setPhase(PHASES.SHUNT);
  }

  const rolling = phase === PHASES.DEPART;
  const targetSentence = `${solution.join(" ")}${train.endMark}`;
  const yardInstruction = needsEngine
    ? "Choose the capital engine."
    : train.rusty && !rustyFixed
      ? "Fix the rusty word."
      : train.gap && !gapFilled
        ? "Load the missing word."
        : coupled.length < train.words.length
          ? "Tap the word cars in sentence order."
          : train.caboose && !cabooseChoice
            ? "Choose the end mark."
            : "Pull the whistle.";

  return (
    <div ref={stageRef} className={`sx-stage sx-${world} sx-motion-${motion} ${jolt ? "sx-jolt" : ""} ${bump ? "sx-bump" : ""} ${rolling ? "sx-scroll" : ""}`} data-phase={phase} data-train-id={train.id} data-journey={journey.toFixed(3)} style={{ "--route-position": `${(levelIndex * 9 + trainIndex * 3) % 100}%` }}>
      <div className="sx-sky"><Scenery world={world} /></div>
      <div className="sx-flash" aria-hidden="true" />

      <header className="sx-hud">
        <span className="sx-title">SENTENCE EXPRESS</span>
        <span className="sx-linechip">{WORLD_LABELS[world]} - level {levelIndex + 1} - train {Math.min(trainIndex + 1, level.trains.length)} of {level.trains.length}</span>
        <span className="sx-combochip" key={`combo-${combo}`}>COMBO x{combo}</span>
        <span className="sx-clock" role="status" aria-live="polite">
          <span className="sx-clockface" aria-hidden="true">
            <i className="sx-hand sx-hhand" />
            <i className="sx-hand sx-mhand" style={{ transform: `rotate(${delay * 30}deg)` }} />
          </span>
          {delay ? `+${delay} min` : "ON TIME"}
        </span>
        {showQuit && <button type="button" className="sx-quit" onClick={onQuit} aria-label="Leave the game">X</button>}
      </header>

      <div className="sx-mainline" inert={phase === PHASES.TALLY ? true : undefined}>
        <div className="sx-raildeck">
      <div className="sx-station" aria-hidden="true"><span>{STOPS[world][(levelIndex * 3 + trainIndex) % 4]}</span><i /><i /></div>
      {rolling && <div className="sx-destination" aria-hidden="true"><span>{STOPS[world][(levelIndex * 3 + trainIndex + 1) % 4]}</span><i /><i /></div>}

        <div className={`sx-signal ${(trackDone && phase === PHASES.SHUNT) || rolling ? "sx-go" : ""}`} aria-hidden="true">
          <i className="sx-arm" /><i className="sx-lamp" />
        </div>
        <div className={`sx-train ${rolling || motion !== "idle" ? "sx-rolling" : ""}`} role="region" aria-label="Sentence train: scroll to see every carriage" tabIndex={0}>
          <TrainCar kind="engine" word={train.engine ? (engineChoice ?? "?") : solution[0]}
            ghost={train.engine ? engineChoice === null : coupled.length === 0}
            onClick={phase === PHASES.SHUNT && coupled.length === 1 ? () => { setCoupled([]); setEngineChoice(null); setCabooseChoice(null); } : undefined} label="Uncouple last car" lit={litWord === 0} smoking={rolling || motion !== "idle"} blasting={blast} />
          {solution.slice(1).map((word, i) => {
            const slot = i + 1;
            const filled = coupled.length > slot;
            return (
              <TrainCar key={slot} tone={slot % TONES.length} word={word} ghost={!filled}
                onClick={filled && coupled.length === slot + 1 && phase === PHASES.SHUNT ? () => { setCoupled(c => c.slice(0, -1)); setCabooseChoice(null); } : undefined} label="Uncouple last car" lit={litWord === slot} arrived={filled && coupled.length === slot + 1 && phase === PHASES.SHUNT} />
            );
          })}
          <TrainCar kind="caboose" word={train.caboose ? (cabooseChoice ?? "?") : train.endMark}
            ghost={Boolean(train.caboose) && !cabooseChoice} />
        </div>
        <div className="sx-trackbed" />
        <div className="sx-fore" aria-hidden="true"><ForeSvg world={world} /><ForeSvg world={world} /></div>
        </div>
        {rolling && (
          <div className="sx-karaoke" aria-live="polite">
            {solution.map((w, i) => (
              <span key={i} className={i === litWord ? "sx-word-lit" : ""}>
                {w}{i === solution.length - 1 ? train.endMark : ""}{" "}
              </span>
            ))}
          </div>
        )}
      </div>

      {phase === PHASES.SHUNT && (
        <section className="sx-yard">
          <div className="sx-workbench" role="region" aria-label="Sidings and repair tools: scroll for more" tabIndex={0}>
          <div className="sx-spur">
            <div className="sx-spurlabel">SIDINGS - TAP TO COUPLE</div>
            <div className="sx-spurcars">
              {train.sidingOrder.filter(i => i !== 0 || !train.engine).map(i => {
                // Coupled cars leave a stable empty space so nothing re-flows
                // under a child's finger mid-level.
                if (coupled.includes(i)) {
                  return <span key={i} className="sx-carbox sx-small sx-heldslot" aria-hidden="true" />;
                }
                // The lost-crate car waits as a ghost until its crate loads.
                if (train.gap && i === train.gap.index && !gapFilled) {
                  return <TrainCar key={i} small ghost word="?" />;
                }
                const isRusty = train.rusty && i === train.rusty.index && !rustyFixed;
                return (
                  <TrainCar key={i} small tone={i % TONES.length} rusty={isRusty}
                    word={isRusty ? train.rusty.wrong : solution[i]}
                    onClick={() => couple(i)} label={`couple ${isRusty ? train.rusty.wrong : solution[i]}`} />
                );
              })}
            </div>
            <div className="sx-spurtrack" />
          </div>

          <div className="sx-structures">
            {train.engine && engineChoice === null && (
              <div className="sx-structure sx-engineshed">
                <h4>ENGINE SHED - pick the leader</h4>
                <div className="sx-optionrow">
                  {train.engine.options.map(o => (
                    <TrainCar key={o} small kind="engine" word={o} onClick={() => chooseEngine(o)} label={`engine ${o}`} />
                  ))}
                </div>
                <small>Only a capital can lead the train!</small>
              </div>
            )}
            {train.rusty && !rustyFixed && (
              <div className="sx-structure sx-shed">
                <h4>REPAIR SHED - swap the rusty car</h4>
                <div className="sx-optionrow">
                  {train.rusty.options.map(o => (
                    <button key={o} type="button" className="sx-plate" onClick={() => repairRusty(o)}>{o}</button>
                  ))}
                </div>
              </div>
            )}
            {train.gap && !gapFilled && (
              <div className="sx-structure sx-crates">
                <h4>LOST CRATE - load the missing word</h4>
                <div className="sx-optionrow">
                  {train.gap.options.map(o => (
                    <button key={o} type="button" className="sx-crate" onClick={() => loadCrate(o)}>{o}</button>
                  ))}
                </div>
              </div>
            )}
            {train.caboose && coupled.length === train.words.length && !cabooseChoice && (
              <div className="sx-structure sx-cabooserack">
                <h4>PICK THE CABOOSE MARK</h4>
                <div className="sx-optionrow">
                  {train.caboose.options.map(o => (
                    <button key={o} type="button" className="sx-disc" onClick={() => chooseCaboose(o)}>{o}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          </div>
          <div className="sx-master">
            <span className="sx-pal" aria-hidden="true"><LanternBadge /></span>
            <div className="sx-bubble">
              <p className="sx-objective" data-child-instruction>{hint ? <span className="sx-hint" role="status">{hint}</span> : yardInstruction}</p>
              <p className="sx-target">{targetSentence}</p>
              {isSoundEnabled ? (
                <button type="button" className="sx-bell" onClick={announce} aria-label="Hear the sentence again">
                  <BellIcon /> Hear sentence again
                </button>
              ) : null}
            </div>
          </div>

          <button type="button" className={`sx-lever ${trackDone ? "sx-ready" : ""}`} disabled={!trackDone} onClick={depart}>
            <i className="sx-leverarm" aria-hidden="true" />
            <span>PULL WHISTLE</span>
            {!trackDone && <small>couple every car first!</small>}
          </button>
        </section>
      )}

      {stamp && <div className="sx-stamp" aria-hidden="true">EXPRESS!<em>ON TIME</em></div>}
      {comboToast && <div className="sx-combotoast" aria-hidden="true">{comboToast}</div>}
      {banner && <div className="sx-banner">{banner}</div>}

      {phase === PHASES.TALLY && (
        <section className="sx-ticket" role={finished ? "dialog" : "region"} aria-modal={finished ? true : undefined} aria-label={finished ? "Sentence Express complete" : `Level ${levelIndex + 1} complete`}>
          {stars > 1 && Array.from({ length: 16 }, (_, i) => (
            <span key={i} className="sx-confetti" aria-hidden="true"
              style={{ left: `${(i * 6.3 + 2) % 96}%`, animationDelay: `${(i % 8) * 0.14}s`, background: TONES[i % TONES.length][0] }} />
          ))}
          <h2>{level.isGoldRun ? "GOLD MAIL RUN COMPLETE!" : `LEVEL ${levelIndex + 1} COMPLETE!`}</h2>
          <p className="sx-stars">{[0, 1, 2].map(i => <StarIcon key={i} filled={i < stars} />)}</p>
          <div className="sx-tallyrows">
            <span>Express departures <b>{express} of {level.trains.length}</b></span>
            <span>Delays <b>{mistakes ? `+${mistakes} min` : "none"}</b></span>
          </div>
          <button ref={ticketButton} type="button" className="sx-golden" onClick={finished ? replayLine : nextLevel}>
            {finished ? "Play again" : levelIndex + 1 < LEVELS_PER_LINE ? "NEXT DEPARTURE ->" : "FINISH THE LINE"}
          </button>
        </section>
      )}
    </div>
  );
}
