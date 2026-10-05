import { createLearningDwell, LEARNING_PACE } from "../../../../utils/learningPace.js";
import BlenderGardenBackdrop from "../shared/BlenderGardenBackdrop.jsx";
import BlenderWorldVignette from '../shared/BlenderWorldVignette.jsx';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { WORLD_BY_DIFFICULTY, LEVELS_PER_LINE } from "../../../../utils/sentenceExpressLevels.js";
import { newGameSeed } from '../../../../utils/gameReplay.js';
import { starRubric } from "../../../../utils/starRubric.js";
import { sfx } from "../../../../utils/trainSfx.js";
import { wordAudioPath } from "../../../elQuest/elQuestEngine.js";
import "../../../../styles/sentence-express.css";
import { saveExpressSnapshot } from "./sentenceExpressSession.js";
import { createJourneyClock } from "./sentenceExpressJourney.js";
import CarSvg from "./SentenceExpressRollingStock.jsx";
import { SENTENCE_EXPRESS_INSTRUCTIONS } from "./sentenceExpressInstructions.js";
import { getLedaInstructionAudioPath } from "../../../../data/ledaProductionAudio.js";
import SentenceExpressAuthoredView from './SentenceExpressAuthoredView.jsx';
import { createSentenceExpressReadback } from './sentenceExpressReadback.js';
import { speakWord } from '../../../../utils/learnGamesAudio.js';
import { createSentenceExpressPracticeController } from './sentenceExpressPracticeController.js';
import { duckGameMusic, restoreGameMusic } from '../../../../utils/audio/gameMusic.js';

// SENTENCE EXPRESS - flagship game. You are the yard master: rebuild the
// broken sentence-train (couple carriages in order, swap the rusty wrong-word
// car at the repair shed, load the missing crate, pick the capital engine and
// the end-mark caboose), then read the completed sentence back as the
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

function TrainCar({ kind = "wagon", tone = 0, word, ghost = false, lit = false, rusty = false, arrived = false, next = false, smoking = false, blasting = false, onClick, label }) {
  const cls = `sx-carbox sx-kind-${kind} ${ghost ? "sx-ghostbox" : ""} ${lit ? "sx-lit" : ""} ${arrived ? "sx-arrive" : ""} ${next ? "sx-nextslot" : ""}`;
  const body = (
    <>
      {ghost ? <GhostSvg /> : <CarSvg kind={kind} tone={tone} rusty={rusty} />}
      <span className={`sx-carword ${kind === "caboose" ? "sx-markword" : ""}`}>{ghost ? (next ? "Next" : "") : word}</span>
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

function Scenery({ world, isPaused }) {
  return <>
    <div className="sx-landscape" aria-hidden="true" />
      <BlenderGardenBackdrop gameId="sentence-express" isPaused={isPaused} world={world} />
    <BlenderWorldVignette gameId="sentence-express" isPaused={isPaused} />
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
    let settled = false;
    const finish = () => { if (settled) return; settled = true; onEnd?.(); };
    if (onEnd) { audio.addEventListener("ended", finish, { once: true }); audio.addEventListener("error", finish, { once: true }); }
    audio.play().catch(finish);
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
function playWordTracked(registry, word, onEnd, onStart) {
  const audio = playWord(word, onEnd);
  if (audio) {
    registry.add(audio);
    audio.addEventListener('play', onStart);
    audio.addEventListener("ended", () => registry.delete(audio), { once: true });
    audio.addEventListener("error", () => registry.delete(audio), { once: true });
  }
  return audio;
}

// -- Game ---------------------------------------------------------------------
export default function SentenceExpressGame({
  difficulty = "easy",
  startLevel = 0,
  sessionKey,
  resumeEligible = false,
  sessionSeed = 0, journey: arcadeJourney = null,
  progressScopeKey = 'default',
  onSessionStart,
  onCheckpoint,
  onPracticeReady,
  isSoundEnabled = true,
  onComplete = () => {},
  onQuit = () => {},
  onReplay,
  onRequestNextLevel,
  onRequestReplay,
  // GamePlayer pauses on tab-hide and while its quit dialog is open.
  onEngineReady,
  // Original sources are admitted only after encoding and native review.
  // Null keeps the retained complete railway/rolling-stock recovery active.
  authoredAtlases = null,
  authoredYards = null,
  // The arcade shell (GamePlayer) has its own close button; hide ours there
  // so onQuit fires only at the true end of the 10-level run.
  showQuit = true
}) {
  const [practice, setPractice] = useState(() => createSentenceExpressPracticeController({ difficulty,
    seed: sessionSeed, journeyIndex: arcadeJourney?.index ?? 0, startLevel,
    scope: progressScopeKey, resumeEligible }));
  const saved = practice.initial;
  const world = WORLD_BY_DIFFICULTY[difficulty] || "meadow";
  const [levelIndex, setLevelIndex] = useState(saved.levelIndex);
  const level = useMemo(() => practice.line[levelIndex], [practice, levelIndex]);
  const [trainIndex, setTrainIndex] = useState(saved?.trainIndex || 0);
  const [queue, setQueue] = useState(() => (saved?.queue || []).map(id => level.trains.find(t => t.id === id)).filter(Boolean)); // catch-up: failed trains re-run once
  const [finished, setFinished] = useState(saved.phase === 'finished');
  const ticketButton = useRef(null);
  const [phase, setPhase] = useState(saved.phase === 'finished' ? PHASES.TALLY : saved.phase);
  const [tallyTrainId, setTallyTrainId] = useState(saved.trainId);
  const train = phase === PHASES.TALLY ? level.trains.find(item => item.id === tallyTrainId) || level.trains.at(-1)
    : queue.length && trainIndex >= level.trains.length ? queue[0]
      : level.trains[Math.min(trainIndex, level.trains.length - 1)];
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
  const [engineTransfer, setEngineTransfer] = useState(null);

  const focusNextChoice = useRef(false);
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
  const resultDwell = useRef(null);
  const announceResume = useRef(null);    // station-master read-aloud continuation
  const phaseRef = useRef(saved.phase === 'finished' ? PHASES.TALLY : saved.phase);
  const soundRef = useRef(isSoundEnabled);
  const speechGeneration = useRef(0);
  const instructionMix = useRef({});
  const [journey, setJourney] = useState(0);
  const authoredInspect = useRef(() => null);
  const [authoredDelivery, setAuthoredDelivery] = useState(null);
  const [saveHeld, setSaveHeld] = useState(false);
  const physicalState = useRef(null);
  const pendingTransition = useRef(null);
  const initialCheckpoint = useRef(true);
  const lastCheckpoint = useRef(null);
  const externallyPaused = useRef(false);
  const saveButton = useRef(null);
  const practiceRef = useRef(practice);
  practiceRef.current = practice;
  const lifecycleActions = useRef(null);
  const journeyTransition = useRef(false);
  const stageAwardReported = useRef(new Set(saved.stageAwards.map(row => row.stage)));
  const completionReported = useRef(false);
  const readbackOwner = useRef(null);
  if (!readbackOwner.current) readbackOwner.current = createSentenceExpressReadback({
    speakWord, getSound: () => soundRef.current,
    onWord: ({ index, active }) => {
      setLitWord(active ? index : -1);
      if (active) { chuffStop.current?.(); chuffStop.current = null; }
    }
  });

  physicalState.current = { levelIndex, trainIndex, trainId: train.id, queue, phase, finished,
    coupled, engineChoice, cabooseChoice, rustyFixed, gapFilled, delay, mistakes, combo, express };

  function persistPractice() {
    if (!practice.isHeld() && !practice.sync(physicalState.current)) return false;
    if (physicalState.current.phase === PHASES.DEPART && journeyClock.current) {
      practice.observeDeparture(Math.min(6500, journeyClock.current.elapsed(performance.now())), readbackOwner.current.inspect().readback);
    }
    const receipt = practice.persist();
    if (!receipt.localSaved) {
      // The controller holds its exact snapshot and input pauses immediately.
      // Publish the external save failure to React after this commit, without
      // a cascading layout-effect render or delaying the actual input guard.
      enginePause();
      queueMicrotask(() => { if (!practice.inspect().disposed) setSaveHeld(true); });
      return false;
    }
    if (practice.migrationPending) {
      saveExpressSnapshot(sessionKey || practice.oldKey, null);
      saveExpressSnapshot(practice.oldRunKey, null);
    }
    if (initialCheckpoint.current) {
      initialCheckpoint.current = false;
      onSessionStart?.();
      onPracticeReady?.({ runTotals: practice.runTotals(), stageAwards: practice.inspect().stageAwards, evidence: practice.completionEvidence() });
    }
    if (lastCheckpoint.current !== levelIndex) {
      lastCheckpoint.current = levelIndex;
      onCheckpoint?.(levelIndex, LEVELS_PER_LINE);
    }
    return true;
  }

  function retryPracticeSave() {
    if (!practice.isHeld() || !persistPractice()) return;
    setSaveHeld(false);
    if (!externallyPaused.current && !document.hidden) engineResume();
    const continueTransition = pendingTransition.current;
    pendingTransition.current = null;
    continueTransition?.();
  }

  useLayoutEffect(() => { lifecycleActions.current?.persistPractice(); }, [levelIndex, trainIndex, queue, phase, finished,
    coupled, engineChoice, cabooseChoice, rustyFixed, gapFilled, delay, mistakes, combo, express]);
  useEffect(() => { if (saveHeld) saveButton.current?.focus({ preventScroll: true }); }, [saveHeld]);

  useEffect(() => { if (phase === PHASES.TALLY && finished) ticketButton.current?.focus(); }, [phase, finished]);

  // The corrected word sequence the child must rebuild.
  const solution = useMemo(() => train.words.map((w, i) => {
    if (train.rusty && i === train.rusty.index) return train.rusty.correct;
    if (train.gap && i === train.gap.index) return train.gap.correct;
    return w;
  }), [train]);

  const needsEngine = Boolean(train.engine) && engineChoice === null;
  const nextSlot = coupled.length;
  const needsRepair = Boolean(train.rusty) && !rustyFixed;
  const needsCrate = Boolean(train.gap) && !gapFilled;
  const trackDone = coupled.length === train.words.length
    && (!train.caboose || cabooseChoice === train.endMark)
    && (!train.engine || engineChoice === train.engine.correct);

  const task = needsEngine ? "engine" : needsRepair ? "repair" : needsCrate ? "gap"
    : coupled.length < train.words.length ? "build" : !trackDone ? "caboose" : "send";
  const yardInstruction = SENTENCE_EXPRESS_INSTRUCTIONS[task];
  const stageNumber = needsEngine ? 1 : trackDone ? 3 : 2;
  const instructionPath = getLedaInstructionAudioPath(yardInstruction);

  // Keep the live insertion point in view without reversing reading order.
  useLayoutEffect(() => {
    if (focusNextChoice.current) {
      stageRef.current?.querySelector(".sx-workbench button")?.focus({ preventScroll: true });
      focusNextChoice.current = false;
    }
    const rail = stageRef.current?.querySelector(".sx-train");
    const next = rail?.querySelector(".sx-nextslot") || rail?.lastElementChild;
    if (!rail || !next) return;
    const bounds = next.getBoundingClientRect();
    const railBounds = rail.getBoundingClientRect();
    if (bounds.right > railBounds.right - 16) rail.scrollLeft += bounds.right - railBounds.right + 16;
    if (bounds.left < railBounds.left + 16) rail.scrollLeft -= railBounds.left - bounds.left + 16;
  }, [coupled.length, task]);

  useEffect(() => {
    soundRef.current = isSoundEnabled;
    if (!isSoundEnabled) {
      if (phaseRef.current === PHASES.DEPART) {
        audioRef.current?.pause?.(); chuffStop.current?.(); chuffStop.current = null;
        readbackOwner.current.soundChanged(); return;
      }
      speechGeneration.current += 1;
      audioRef.current?.pause?.();
      restoreGameMusic(instructionMix.current);
      audioRef.current = null;
      chuffStop.current?.();
      chuffStop.current = null;
      announceResume.current = null;
    }
  }, [isSoundEnabled]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // GamePlayer freezes the game on tab-hide and while its quit dialog is
  // open: stop the chuff loop, checkpoint the depart chain, and pause any
  // playing word audio; resume picks everything back up.
  function enginePause() {
    if (paused.current) return;
    resultDwell.current?.pause();
    paused.current = true;
    pauseTimers(timers.current);
    journeyClock.current?.pause(performance.now());
    pausedAnimations.current = stageRef.current?.getAnimations({ subtree: true }).filter(animation => animation.playState === "running") || [];
    pausedAnimations.current.forEach(animation => animation.pause());
    chuffStop.current?.();
    chuffStop.current = null;
    audioRef.current?.pause?.();
    restoreGameMusic(instructionMix.current);
    readbackOwner.current.pause();
  }
  function engineResume() {
    if (!paused.current || practice.isHeld()) return;
    paused.current = false;
    readbackOwner.current.resume();
    resultDwell.current?.resume();
    resumeTimers(timers.current);
    journeyClock.current?.resume(performance.now());
    pausedAnimations.current.forEach(animation => animation.play());
    pausedAnimations.current = [];
    const pending = announceResume.current;
    announceResume.current = null;
    if (pending) pending();
    else if (soundRef.current && phaseRef.current !== PHASES.DEPART) {
      const audio = audioRef.current;
      if (audio && !audio.ended && audio.paused) audio.play().catch(() => { /* needs a gesture first */ });
    }
    if (phaseRef.current === PHASES.DEPART && soundRef.current && !readbackOwner.current.inspect().running && !chuffStop.current) {
      chuffStop.current = sfx.startChuff();
    }
  }

  useEffect(() => {
    onEngineReady?.({
      pause() { externallyPaused.current = true; persistPractice(); enginePause(); },
      resume() { externallyPaused.current = false; if (!document.hidden) engineResume(); },
      markSupported(reason = 'mission-help') { practice.markSupported(reason); persistPractice(); },
      inspect: options => ({ authoredWorld: authoredInspect.current(), readback: readbackOwner.current.inspect(),
        practice: practice.inspect(options), physical: structuredClone(physicalState.current) })
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one owned API per practice controller; mutable physical state lives in refs
  }, [practice]);

  useEffect(() => {
    // React's development mount replay tears down the first owned sound
    // controller. A disposed owner must never be reused by the next mount.
    if (readbackOwner.current.inspect().disposed) readbackOwner.current = createSentenceExpressReadback({
      speakWord, getSound: () => soundRef.current,
      onWord: ({ index, active }) => {
        setLitWord(active ? index : -1);
        if (active) { chuffStop.current?.(); chuffStop.current = null; }
      }
    });
    const pendingTimers = timers.current;
    const liveAudios = wordAudios.current;
    const ownedReadback = readbackOwner.current;
    const ownedInstructionMix = instructionMix.current;
    const onVisibility = () => {
      lifecycleActions.current.persistPractice();
      if (document.hidden) lifecycleActions.current.enginePause();
      else if (!externallyPaused.current) lifecycleActions.current.engineResume();
    };
    const onBlur = () => { lifecycleActions.current.persistPractice(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      const ownedPractice = practiceRef.current;
      if (!ownedPractice.isHeld()) {
        ownedPractice.sync(physicalState.current);
        if (physicalState.current.phase === PHASES.DEPART && journeyClock.current) {
          ownedPractice.observeDeparture(Math.min(6500, journeyClock.current.elapsed(performance.now())), ownedReadback.inspect().readback);
        }
      }
      ownedPractice.persist();
      speechGeneration.current += 1;
      cancelAnimationFrame(departureFrame.current);
      resultDwell.current?.cancel();
      for (const timer of pendingTimers) window.clearTimeout(timer.native);
      pendingTimers.clear();
      chuffStop.current?.();
      for (const audio of liveAudios) { try { audio.pause(); } catch { /* already gone */ } }
      liveAudios.clear();
      ownedReadback.dispose();
      restoreGameMusic(ownedInstructionMix);
    };
  }, []);
  lifecycleActions.current = { persistPractice, enginePause, engineResume };

  function announce() {
    if (!soundRef.current) return;
    const generation = ++speechGeneration.current;
    audioRef.current?.pause?.();
    restoreGameMusic(instructionMix.current);
    let i = 0;
    const speakNext = () => {
      if (generation !== speechGeneration.current || i >= solution.length) return;
      if (paused.current) { announceResume.current = speakNext; return; }
      audioRef.current = playWordTracked(wordAudios.current, solution[i], () => {
        if (generation !== speechGeneration.current) return;
        restoreGameMusic(instructionMix.current); i += 1; speakNext();
      }, () => {
        if (generation === speechGeneration.current && !paused.current && soundRef.current) duckGameMusic(instructionMix.current);
      });
    };
    speakNext();
  }
  function replayInstruction() {
    if (!soundRef.current || paused.current || !instructionPath) return;
    const generation = ++speechGeneration.current;
    audioRef.current?.pause?.();
    restoreGameMusic(instructionMix.current);
    announceResume.current = null;
    const audio = new Audio(instructionPath);
    audioRef.current = audio;
    wordAudios.current.add(audio);
    audio.addEventListener('play', () => {
      if (generation === speechGeneration.current && !paused.current && soundRef.current) duckGameMusic(instructionMix.current);
    });
    const finish = () => {
      wordAudios.current.delete(audio);
      if (generation !== speechGeneration.current) return;
      restoreGameMusic(instructionMix.current);
      if (task !== "engine" && task !== "send") announce();
    };
    audio.addEventListener("ended", finish, { once: true });
    const failed = () => {
      wordAudios.current.delete(audio);
      if (generation === speechGeneration.current) restoreGameMusic(instructionMix.current);
    };
    audio.addEventListener("error", failed, { once: true });
    audio.play().catch(failed);
  }
  useEffect(() => {
    if (phase === PHASES.SHUNT) replayInstruction();
    // The cue changes with the visible action; words can still be chosen during it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yardInstruction, train.id, phase, isSoundEnabled]);

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
    return () => {
      cancelLater(registry, t0); cancelLater(registry, tIn);
      cancelLater(registry, tChuff);
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
    setHint("");
    if (isSoundEnabled) sfx.clunk();
    setBump(true);
    later(timers.current, 240, () => setBump(false));
  }

  function applyAssembly(assembly) {
    setCoupled(assembly.coupled); setEngineChoice(assembly.engineChoice);
    setCabooseChoice(assembly.cabooseChoice); setRustyFixed(assembly.rustyFixed); setGapFilled(assembly.gapFilled);
  }

  function uncoupleLastCar() {
    if (phaseRef.current !== PHASES.SHUNT || paused.current || practice.isHeld()) return;
    const result = practice.uncouple();
    if (!result) return;
    applyAssembly(result.assembly); goodBump();
  }

  function couple(wordIndex, event) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current || needsEngine || coupled.includes(wordIndex)) return;
    const result = practice.choose(wordIndex);
    if (!result) return;
    if (train.rusty && wordIndex === train.rusty.index && !rustyFixed) {
      miss("rusty"); // rusty car won't couple - repair shed first
      return;
    }
    // Correct if this carriage carries the word the next empty slot needs
    // (identical words like "the" are interchangeable by design).
    if (result.correct) {
      focusNextChoice.current = event?.detail === 0;
      applyAssembly(result.assembly);
      goodBump();
      return;
    }
    miss("order");
  }

  function chooseEngine(option, event) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current) return;
    const result = practice.choose(option);
    if (!result) return;
    if (result.correct) {
      const source = event?.currentTarget?.getBoundingClientRect();
      const stageBounds = stageRef.current?.getBoundingClientRect();
      const destination = stageRef.current?.querySelector(".sx-train > .sx-kind-engine")?.getBoundingClientRect();
      if (source && destination && stageBounds && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setEngineTransfer({ word: option, x: source.left - stageBounds.left, y: source.top - stageBounds.top, width: source.width, height: source.height,
          dx: destination.left - source.left, dy: destination.top - source.top,
          sx: destination.width / source.width, sy: destination.height / source.height,
          font: getComputedStyle(event.currentTarget.querySelector(".sx-carword")).fontSize });
        later(timers.current, 480, () => setEngineTransfer(null));
      }
      focusNextChoice.current = event?.detail === 0;
      applyAssembly(result.assembly);
      goodBump();
    } else miss("engine");
  }
  function chooseCaboose(mark, event) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current) return;
    if (coupled.length < train.words.length) { miss("early-caboose"); return; }
    const result = practice.choose(mark);
    if (!result) return;
    if (result.correct) { focusNextChoice.current = event?.detail === 0; applyAssembly(result.assembly); goodBump(); }
    else miss("caboose");
  }
  function repairRusty(option, event) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current) return;
    const result = practice.choose(option);
    if (!result) return;
    if (result.correct) { focusNextChoice.current = event?.detail === 0; setHint(""); applyAssembly(result.assembly); if (isSoundEnabled) sfx.ding(); }
    else miss("repair");
  }
  function loadCrate(option, event) {
    if (phaseRef.current !== PHASES.SHUNT || paused.current) return;
    const result = practice.choose(option);
    if (!result) return;
    if (result.correct) { focusNextChoice.current = event?.detail === 0; setHint(""); applyAssembly(result.assembly); if (isSoundEnabled) sfx.ding(); }
    else miss("crate");
  }

  function depart() {
    if (!trackDone || phaseRef.current !== PHASES.SHUNT || paused.current) return;
    if (!practice.send()) return;
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
    startJourney({ travelMs: 0, readback: [] });
  }

  function startJourney(departure) {
    journeyTransition.current = false;
    // Send is available only for the fully completed sentence. Reading follows the moving train,
    // with one current clip. Departure stays immediate; the next sentence waits for actual readback.
    const generation = ++speechGeneration.current;
    audioRef.current?.pause?.();
    audioRef.current = null;
    restoreGameMusic(instructionMix.current);
    announceResume.current = null;
    setMotion("out");
    const initialTravel = departure?.travelMs || 0;
    setJourney(Math.min(1, initialTravel / 6500));
    journeyClock.current = createJourneyClock(performance.now() - initialTravel);
    journeyAnimations.current = [];
    let travelDone = false;
    let resolveReadback;
    const readback = new Promise(resolve => { resolveReadback = resolve; });
    resultDwell.current?.cancel();
    resultDwell.current = createLearningDwell({ minimumMs: Math.max(0, LEARNING_PACE.sentence - initialTravel), onAdvance: () => { if (travelDone && generation === speechGeneration.current) finishTrain(); } });
    if (paused.current) {
      journeyClock.current.pause(performance.now());
      resultDwell.current.pause();
      readbackOwner.current.pause();
    }
    let readbackDone = false;
    let nextPracticeSave = initialTravel + 1000;
    resultDwell.current.waitFor(readback);
    const travel = () => {
      const elapsed = journeyClock.current.elapsed(performance.now());
      if (!paused.current) {
        practice.observeDeparture(Math.min(elapsed, 6500), readbackOwner.current.inspect().readback);
        if (elapsed >= nextPracticeSave) { nextPracticeSave = elapsed + 1000; persistPractice(); }
      }
      if (!journeyAnimations.current.length) {
        const names = ["sx-follow-train", "sx-route-pan", "sx-station-pass", "sx-arriving-station"];
        journeyAnimations.current = stageRef.current?.getAnimations({ subtree: true }).filter(animation => names.includes(animation.animationName)) || [];
      }
      // The train, scenery and destination share the same unpaused clock even
      // after a long frame gap. Wheel rotation remains independent.
      if (!paused.current) for (const animation of journeyAnimations.current) animation.currentTime = Math.min(elapsed, 6500);
      setJourney(Math.min(1, elapsed / 6500));
      if (!paused.current && elapsed >= 6500) {
        travelDone = true;
        if (readbackDone && !resultDwell.current?.active) { departureFrame.current = null; finishTrain(); }
        else departureFrame.current = requestAnimationFrame(travel);
      }
      else departureFrame.current = requestAnimationFrame(travel);
    };
    departureFrame.current = requestAnimationFrame(travel);
    // The real sequential owner records only the current matching Howler end.
    // Error, abort, muted pacing and a fulfilled promise never become speech
    // delivery; pause replays the same uncompleted word on resume.
    void readbackOwner.current.play(practice.currentRound(), { readback: departure?.readback || [] }).then(result => {
      if (generation !== speechGeneration.current || !result?.completed) return;
      readbackDone = true; resolveReadback();
      if (!paused.current && soundRef.current && journeyClock.current.elapsed(performance.now()) < 6500 && !chuffStop.current) {
        chuffStop.current = sfx.startChuff();
      }
    });
  }

  useEffect(() => {
    if (saved.phase === PHASES.DEPART) startJourney(practice.inspect().departure);
    // The saved explicit Send is resumed, never emitted again by mount replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finishTrain() {
    if (journeyTransition.current) return;
    if (!practice.settleDeparture({ travelComplete: journeyClock.current?.elapsed(performance.now()) >= 6500,
      readback: readbackOwner.current.inspect().readback })) return;
    if (!persistPractice()) { pendingTransition.current = finishTrain; return; }
    journeyTransition.current = true;
    pendingTransition.current = null;
    resultDwell.current?.cancel();
    readbackOwner.current.stop();
    cancelAnimationFrame(departureFrame.current); departureFrame.current = null;
    speechGeneration.current += 1;
    audioRef.current?.pause?.();
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
      setQueue([]);
      setTallyTrainId(train.id);
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
    const award = practice.awardStage({ stars, mistakes, express }) || practice.inspect().stageAwards.find(row => row.stage === levelIndex);
    if (!award) return;
    if (!persistPractice()) { pendingTransition.current = nextLevel; return; }
    pendingTransition.current = null;
    if (!stageAwardReported.current.has(levelIndex)) {
      stageAwardReported.current.add(levelIndex);
      onComplete({ level: levelIndex, ...award, runTotals: practice.runTotals(), evidence: practice.completionEvidence() });
    }
    phaseRef.current = PHASES.SHUNT;
    if (levelIndex + 1 < LEVELS_PER_LINE) {
      setLevelIndex(l => l + 1);
      setTrainIndex(0); setQueue([]); setMistakes(0); setExpress(0); setCombo(1);
      resetTrainState();
      setPhase(PHASES.SHUNT);
    } else {
      setFinished(true);
      phaseRef.current = PHASES.TALLY;
    }
  }

  useLayoutEffect(() => {
    if (!finished || completionReported.current || practice.isHeld() || !persistPractice()) return;
    completionReported.current = true;
    onQuit(practice.completionEvidence());
    // Persist the actual finished state before handing a result to the host.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, saveHeld]);

  useEffect(() => {
    if (phase !== PHASES.TALLY || finished) return undefined;
    const registry = timers.current;
    const timer = later(registry, 1000, nextLevel);
    if (paused.current) pauseTimers(registry);
    return () => cancelLater(registry, timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one automatic award per tally
  }, [phase, levelIndex, finished]);

  function replayLine() {
    if (paused.current || !finished) return;
    if (onRequestReplay) { onRequestReplay(); return; }
    onReplay?.();
    const previousSeed = practice.inspect().metadata.sessionSeed;
    const next = createSentenceExpressPracticeController({ difficulty, seed: newGameSeed(previousSeed),
      journeyIndex: arcadeJourney?.index ?? 0, startLevel: 0, scope: progressScopeKey });
    practice.dispose(); setPractice(next);
    initialCheckpoint.current = true; lastCheckpoint.current = null;
    completionReported.current = false; stageAwardReported.current = new Set();
    pendingTransition.current = null; journeyClock.current = null;
    setLevelIndex(0); setTrainIndex(0); setQueue([]);
    setMistakes(0); setExpress(0); setCombo(1); setFinished(false);
    resetTrainState();
    phaseRef.current = PHASES.SHUNT;
    setPhase(PHASES.SHUNT);
  }

  const rolling = phase === PHASES.DEPART;
  const targetSentence = `${solution.join(" ")}${train.endMark}`;

  return (
    <div ref={stageRef} className={`sx-stage sx-${world} sx-motion-${motion} ${jolt ? "sx-jolt" : ""} ${bump ? "sx-bump" : ""} ${rolling ? "sx-scroll" : ""} ${engineTransfer ? "sx-engine-moving" : ""}`} data-phase={phase} data-task={task} data-stage={stageNumber} data-train-id={train.id} data-journey={journey.toFixed(3)} data-authored-world={authoredDelivery?.yard} style={{ "--route-position": `${(levelIndex * 9 + trainIndex * 3) % 100}%` }}>
      {saveHeld && <div className="sx-save-recovery" role="status">
        <p>Keep this train open. Try saving again.</p>
        <button ref={saveButton} type="button" onClick={retryPracticeSave}>Try saving again</button>
      </div>}
      <div className="sx-sky"><Scenery world={world} isPaused={() => paused.current} /></div>
      {authoredAtlases && authoredYards && <SentenceExpressAuthoredView stageRef={stageRef} world={world}
        atlases={authoredAtlases} yards={authoredYards} inspectRef={authoredInspect} onDelivery={setAuthoredDelivery}
        state={{ phase, journey, stopIndex: levelIndex * 3 + trainIndex, isPaused: () => paused.current,
          recovering: jolt, coupling: bump, needsEngine, canSend: trackDone }} />}
      <div className="sx-flash" aria-hidden="true" />

      <header className="sx-hud" aria-label={`${WORLD_LABELS[world]} line progress`}>
        <span className="sx-title">SENTENCE EXPRESS</span>
        <span className="sx-linechip">Level {levelIndex + 1} · Train {Math.min(trainIndex + 1, level.trains.length)} of {level.trains.length}</span>
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

      <div className="sx-mainline" inert={phase === PHASES.TALLY || saveHeld ? true : undefined}>
        <div className="sx-raildeck">
      <div className="sx-station" aria-hidden="true"><span>{STOPS[world][(levelIndex * 3 + trainIndex) % 4]}</span><i /><i /></div>
      {rolling && <div className="sx-destination" aria-hidden="true"><span>{STOPS[world][(levelIndex * 3 + trainIndex + 1) % 4]}</span><i /><i /></div>}

        <div className={`sx-signal ${(trackDone && phase === PHASES.SHUNT) || rolling ? "sx-go" : ""}`} aria-hidden="true">
          <i className="sx-arm" /><i className="sx-lamp" />
        </div>
        <div className={`sx-train ${rolling || motion !== "idle" ? "sx-rolling" : ""}`} role="region" aria-label="Your sentence, read from left to right" dir="ltr" tabIndex={0}>
          <TrainCar kind="engine" word={train.engine ? (engineChoice ?? "?") : solution[0]}
            ghost={train.engine ? engineChoice === null : coupled.length === 0} next={nextSlot === 0} arrived={coupled.length === 1 && !engineTransfer}
            onClick={phase === PHASES.SHUNT && coupled.length === 1 ? uncoupleLastCar : undefined} label="Uncouple last car" lit={litWord === 0} smoking={rolling || motion !== "idle"} blasting={blast} />
          {solution.slice(1).map((word, i) => {
            const slot = i + 1;
            const filled = coupled.length > slot;
            return (
              <TrainCar key={slot} tone={slot % TONES.length} word={word} ghost={!filled} next={slot === nextSlot}
                onClick={filled && coupled.length === slot + 1 && phase === PHASES.SHUNT ? uncoupleLastCar : undefined} label="Uncouple last car" lit={litWord === slot} arrived={filled && coupled.length === slot + 1 && phase === PHASES.SHUNT} />
            );
          })}
          <TrainCar kind="caboose" word={train.caboose ? (cabooseChoice ?? "?") : train.endMark}
            ghost={Boolean(train.caboose) && !cabooseChoice} next={task === "caboose"} />
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
        <section className="sx-yard" aria-label={`Step ${stageNumber} of 3`} inert={saveHeld ? true : undefined}>
          <div className="sx-taskbar">
            <div className="sx-instruction">
              <span className="sx-step">{stageNumber} / 3 · {needsEngine ? "Choose the engine" : trackDone ? "Send the train" : "Build the sentence"}</span>
              <p className="sx-objective" data-child-instruction>{yardInstruction}</p>
              {hint && <p className="sx-hint" role="status">{hint}</p>}
            </div>
            <button type="button" className="sx-replay" onClick={replayInstruction}
              disabled={!isSoundEnabled || !instructionPath}
              aria-label={!isSoundEnabled ? "Instruction replay unavailable while sound is off" : "Hear the instruction again"}>
              <BellIcon /><span>{isSoundEnabled ? "Hear how" : "Sound off"}</span>
            </button>
          </div>
          <div className="sx-workbench">
            {needsEngine ? (
              <div className="sx-engineshed" role="group" aria-label="Choose an engine">
                {train.engine.options.map(option => (
                  <TrainCar key={option} kind="engine" word={option} onClick={event => chooseEngine(option, event)} label={`engine ${option}`} />
                ))}
              </div>
            ) : needsRepair ? (
              <div className="sx-repairbench">
                <TrainCar rusty word={train.rusty.wrong} />
                <div className="sx-optionrow" role="group" aria-label="Fix the rusty word">
                  {train.rusty.options.map(option => <button key={option} type="button" className="sx-plate" onClick={event => repairRusty(option, event)}>{option}</button>)}
                </div>
              </div>
            ) : needsCrate ? (
              <div className="sx-optionrow" role="group" aria-label="Choose the missing word">
                {train.gap.options.map(option => <button key={option} type="button" className="sx-crate" onClick={event => loadCrate(option, event)}>{option}</button>)}
              </div>
            ) : task === "caboose" ? (
              <div className="sx-optionrow" role="group" aria-label="Choose the end mark">
                {train.caboose.options.map(option => <button key={option} type="button" className="sx-disc" onClick={event => chooseCaboose(option, event)}>{option}</button>)}
              </div>
            ) : trackDone ? (
              <button type="button" className="sx-send" onClick={depart}>Send the train! <span aria-hidden="true">→</span></button>
            ) : (
              <div className="sx-spur">
                <div className="sx-spurcars" role="group" aria-label="Words to finish the sentence">
                  {train.sidingOrder.filter(i => i !== 0 || !train.engine).map(i => coupled.includes(i)
                    ? <span key={i} className="sx-carbox sx-heldslot" aria-hidden="true" />
                    : <TrainCar key={i} tone={i % TONES.length} word={solution[i]} onClick={event => couple(i, event)} label={`couple ${solution[i]}`} />)}
                </div>
                <div className="sx-spurtrack" />
              </div>
            )}
          </div>
          {!needsEngine && <div className="sx-sentence-cue">
            <p className="sx-target">{targetSentence}</p>
            <button type="button" className="sx-replay" onClick={announce} disabled={!isSoundEnabled}
              aria-label={isSoundEnabled ? "Hear the sentence again" : "Sentence replay unavailable while sound is off"}>
              <BellIcon /><span>{isSoundEnabled ? "Hear sentence" : "Sound off"}</span>
            </button>
          </div>}
        </section>
      )}
      {engineTransfer && <div className="sx-engine-transfer" aria-hidden="true" style={{
        left: engineTransfer.x, top: engineTransfer.y, width: engineTransfer.width, height: engineTransfer.height,
        "--transfer-x": `${engineTransfer.dx}px`, "--transfer-y": `${engineTransfer.dy}px`,
        "--transfer-sx": engineTransfer.sx, "--transfer-sy": engineTransfer.sy, "--transfer-font": engineTransfer.font
      }}><TrainCar kind="engine" word={engineTransfer.word} /></div>}

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
          {finished ? <button ref={ticketButton} type="button" className="sx-golden" onClick={onRequestNextLevel || replayLine}>
            {onRequestNextLevel ? (arcadeJourney ? "Next line" : "Next level") : "Play again"}
          </button> : <p role="status">{levelIndex + 1 < LEVELS_PER_LINE ? "Next train arriving…" : "Line complete!"}</p>}
          {finished && onRequestNextLevel && <button type="button" className="sx-golden" onClick={replayLine}>Replay level</button>}
        </section>
      )}
    </div>
  );
}
