import { useEffect, useMemo, useRef, useState } from "react";
import { buildLevel, WORLD_BY_DIFFICULTY, LEVELS_PER_LINE } from "../../../../utils/sentenceExpressLevels.js";
import { starRubric } from "../../../../utils/starRubric.js";
import { sfx } from "../../../../utils/trainSfx.js";
import { wordAudioPath } from "../../../elQuest/elQuestEngine.js";
import "../../../../styles/sentence-express.css";

// SENTENCE EXPRESS - flagship game. You are the yard master: rebuild the
// broken sentence-train (couple carriages in order, swap the rusty wrong-word
// car at the repair shed, load the missing crate, pick the capital engine and
// the end-mark caboose), pull the whistle, then read the sentence back as the
// train departs through a scrolling low-poly landscape.
// Prototype scope: full loop + juice; arcade registration/persistence land in
// the integration pass (Codex owns those files right now).

const PHASES = { INTRO: "intro", SHUNT: "shunt", DEPART: "depart", TALLY: "tally" };
const WORLD_LABELS = { meadow: "MEADOW LINE", dino: "DINO CANYON LINE", moonwood: "MOONWOOD NIGHT LINE" };
const FAULT_LABELS = {
  order: "carriages scrambled", engine: "engine missing", caboose: "caboose missing",
  rusty: "one rusty car", gap: "one crate lost"
};
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
// First-run onboarding dismissal is remembered once per device; a denied
// storage (private mode) simply shows the card again next session.
const ONBOARD_KEY = "lp-arcade-onboarded-v1:sentence-express";

// -- SVG rolling stock --------------------------------------------------------
function Wheel({ cx, cy, r }) {
  return (
    <g className="sx-wheel">
      <circle cx={cx} cy={cy} r={r} fill="#1d232e" stroke="#0c0f15" strokeWidth="3" />
      <rect x={cx - 1.5} y={cy - r + 3.5} width="3" height={2 * r - 7} rx="1.5" fill="#5a6474" />
      <rect x={cx - r + 3.5} y={cy - 1.5} width={2 * r - 7} height="3" rx="1.5" fill="#5a6474" />
      <circle cx={cx} cy={cy} r={r * 0.3} fill="#5a6474" stroke="#0c0f15" strokeWidth="2" />
    </g>
  );
}

function CarSvg({ kind = "wagon", tone = 0, rusty = false }) {
  const [hi, lo] = rusty
    ? ["#8a6e52", "#5d4630"]
    : kind === "engine" ? ["#e2543e", "#992e1f"]
      : kind === "caboose" ? ["#c9563f", "#8f3527"]
        : TONES[tone % TONES.length];
  if (kind === "engine") {
    return (
      <svg className="sx-carsvg" viewBox="0 0 170 116" aria-hidden="true">
        <polygon points="2,98 24,98 24,70" fill="#39424f" stroke="#10151d" strokeWidth="3" />
        <rect x="26" y="16" width="16" height="34" rx="3" fill="#2c3440" stroke="#10151d" strokeWidth="3" />
        <rect x="20" y="10" width="28" height="9" rx="3" fill="#39424f" stroke="#10151d" strokeWidth="3" />
        <rect x="14" y="46" width="94" height="44" rx="9" fill={hi} stroke="#10151d" strokeWidth="3" />
        <rect x="16" y="68" width="90" height="20" rx="7" fill={lo} />
        <ellipse cx="76" cy="44" rx="11" ry="8" fill="#d8b13c" stroke="#10151d" strokeWidth="3" />
        <rect x="102" y="20" width="60" height="70" rx="7" fill={hi} stroke="#10151d" strokeWidth="3" />
        <rect x="104" y="62" width="56" height="26" rx="5" fill={lo} />
        <rect x="112" y="30" width="24" height="20" rx="3" fill="#bfe3f2" stroke="#10151d" strokeWidth="3" />
        <rect x="97" y="13" width="70" height="10" rx="4" fill="#2c3440" stroke="#10151d" strokeWidth="3" />
        <rect x="8" y="90" width="158" height="10" rx="4" fill="#242b36" stroke="#10151d" strokeWidth="3" />
        <circle cx="10" cy="60" r="6" fill="#ffd76a" stroke="#10151d" strokeWidth="3" />
        <Wheel cx="54" cy="101" r="13" />
        <Wheel cx="102" cy="103" r="10" />
        <Wheel cx="140" cy="103" r="10" />
      </svg>
    );
  }
  if (kind === "caboose") {
    return (
      <svg className="sx-carsvg" viewBox="0 0 150 116" aria-hidden="true">
        <rect x="50" y="8" width="50" height="24" rx="4" fill={hi} stroke="#10151d" strokeWidth="3" />
        <rect x="58" y="14" width="14" height="10" rx="2" fill="#bfe3f2" stroke="#10151d" strokeWidth="2" />
        <rect x="4" y="28" width="142" height="10" rx="4" fill="#2c3440" stroke="#10151d" strokeWidth="3" />
        <rect x="10" y="36" width="130" height="54" rx="8" fill={hi} stroke="#10151d" strokeWidth="3" />
        <rect x="12" y="64" width="126" height="24" rx="6" fill={lo} />
        <circle cx="140" cy="52" r="5" fill="#ffd76a" stroke="#10151d" strokeWidth="2" />
        <rect x="8" y="90" width="134" height="10" rx="4" fill="#242b36" stroke="#10151d" strokeWidth="3" />
        <Wheel cx="42" cy="103" r="11" />
        <Wheel cx="108" cy="103" r="11" />
      </svg>
    );
  }
  return (
    <svg className="sx-carsvg" viewBox="0 0 150 116" aria-hidden="true">
      <rect x="2" y="26" width="146" height="10" rx="4" fill="#39424f" stroke="#10151d" strokeWidth="3" />
      <rect x="8" y="34" width="134" height="56" rx="8" fill={hi} stroke="#10151d" strokeWidth="3" />
      <rect x="10" y="63" width="130" height="25" rx="6" fill={lo} />
      {[38, 68, 98, 122].map(x => (
        <line key={x} x1={x} y1="38" x2={x} y2="86" stroke="#10151d" strokeWidth="2" opacity="0.22" />
      ))}
      {rusty && (
        <g opacity="0.9">
          <circle cx="40" cy="52" r="8" fill="#6b4a2c" />
          <circle cx="112" cy="72" r="10" fill="#6b4a2c" />
          <circle cx="80" cy="44" r="5" fill="#6b4a2c" />
        </g>
      )}
      <rect x="6" y="90" width="138" height="9" rx="4" fill="#242b36" stroke="#10151d" strokeWidth="3" />
      <Wheel cx="42" cy="103" r="11" />
      <Wheel cx="108" cy="103" r="11" />
    </svg>
  );
}

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
    return <button type="button" className={cls} onClick={onClick} aria-label={label || `carriage ${word}`}>{body}</button>;
  }
  return <div className={cls}>{body}</div>;
}

// Horizon buildings: a little station house (left) and water tower (right).
function StationHouse() {
  return (
    <svg className="sx-building sx-house" viewBox="0 0 120 80" aria-hidden="true">
      <rect x="14" y="34" width="92" height="44" rx="4" />
      <polygon points="6,38 60,8 114,38" />
      <rect x="50" y="52" width="20" height="26" rx="3" className="sx-b-dark" />
      <rect x="24" y="46" width="14" height="12" rx="2" className="sx-b-glow" />
      <rect x="82" y="46" width="14" height="12" rx="2" className="sx-b-glow" />
    </svg>
  );
}
function WaterTower() {
  return (
    <svg className="sx-building sx-tower" viewBox="0 0 90 110" aria-hidden="true">
      <rect x="22" y="10" width="46" height="38" rx="8" />
      <polygon points="18,14 45,2 72,14" />
      <rect x="28" y="48" width="6" height="58" />
      <rect x="56" y="48" width="6" height="58" />
      <rect x="24" y="72" width="42" height="5" />
    </svg>
  );
}

// -- World scenery (low-poly silhouettes, clouds, fireflies) ------------------
function Scenery({ world }) {
  if (world === "moonwood") {
    return (
      <>
        <div className="sx-starfield" />
        <div className="sx-moon" />
        <StationHouse /><WaterTower />
        <span className="sx-glowbug" style={{ left: "16%", top: "50%" }} />
        <span className="sx-glowbug" style={{ left: "55%", top: "44%", animationDelay: "0.9s" }} />
        <span className="sx-glowbug" style={{ left: "83%", top: "53%", animationDelay: "1.7s" }} />
      </>
    );
  }
  if (world === "dino") {
    return (
      <>
        <div className="sx-sun sx-dinosun" />
        <span className="sx-cloud" style={{ left: "14%", top: "10%" }} />
        <span className="sx-cloud" style={{ left: "62%", top: "6%", animationDelay: "7s" }} />
        <span className="sx-ptero" style={{ left: "70%", top: "16%" }} />
        <StationHouse /><WaterTower />
        <span className="sx-ember" style={{ left: "24%", top: "46%" }} />
        <span className="sx-ember" style={{ left: "60%", top: "52%", animationDelay: "1.2s" }} />
        <span className="sx-ember" style={{ left: "88%", top: "44%", animationDelay: "2.1s" }} />
      </>
    );
  }
  return (
    <>
      <div className="sx-sun" />
      <span className="sx-cloud" style={{ left: "8%", top: "9%" }} />
      <span className="sx-cloud" style={{ left: "48%", top: "5%", animationDelay: "5s" }} />
      <span className="sx-cloud" style={{ left: "78%", top: "14%", animationDelay: "10s" }} />
      <StationHouse /><WaterTower />
      <span className="sx-butterfly" style={{ left: "30%", top: "42%" }} />
      <span className="sx-butterfly sx-butterfly2" style={{ left: "72%", top: "48%", animationDelay: "2.4s" }} />
    </>
  );
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
function later(registry, ms, fn) {
  const id = window.setTimeout(() => { registry.delete(id); fn(); }, ms);
  registry.add(id);
  return id;
}
function cancelLater(registry, id) {
  registry.delete(id);
  window.clearTimeout(id);
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
  isSoundEnabled = true,
  onComplete = () => {},
  onQuit = () => {},
  // GamePlayer pauses on tab-hide and while its quit dialog is open.
  onEngineReady,
  // The arcade shell (GamePlayer) has its own close button; hide ours there
  // so onQuit fires only at the true end of the 10-level run.
  showQuit = true
}) {
  const world = WORLD_BY_DIFFICULTY[difficulty] || "meadow";
  const [levelIndex, setLevelIndex] = useState(Math.max(0, Math.min(LEVELS_PER_LINE - 1, startLevel)));
  const level = useMemo(() => buildLevel(difficulty, levelIndex), [difficulty, levelIndex]);
  const [trainIndex, setTrainIndex] = useState(0);
  const [queue, setQueue] = useState([]); // catch-up: failed trains re-run once
  const train = queue.length && trainIndex >= level.trains.length
    ? queue[0]
    : level.trains[Math.min(trainIndex, level.trains.length - 1)];

  const [phase, setPhase] = useState(PHASES.INTRO);
  const [coupled, setCoupled] = useState([]);
  const [engineChoice, setEngineChoice] = useState(null);
  const [cabooseChoice, setCabooseChoice] = useState(null);
  const [rustyFixed, setRustyFixed] = useState(false);
  const [gapFilled, setGapFilled] = useState(false);
  const [jolt, setJolt] = useState(false);
  const [bump, setBump] = useState(false);
  const [banner, setBanner] = useState("");
  const [stamp, setStamp] = useState(false);
  const [delay, setDelay] = useState(0);       // this train's mistakes
  const [mistakes, setMistakes] = useState(0); // level total
  const [combo, setCombo] = useState(1);
  const [express, setExpress] = useState(0);
  const [litWord, setLitWord] = useState(-1);
  const [motion, setMotion] = useState("enter"); // enter -> idle -> out
  const [blast, setBlast] = useState(false);     // whistle steam burst
  const [comboToast, setComboToast] = useState("");
  const [hint, setHint] = useState(""); // one-line corrective hint after a miss
  // First-run onboarding: shown over the (already idle) intro ticket once per
  // device; the train never rolls in until the child reaches the yard, so the
  // whole game is naturally frozen behind the card.
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return window.localStorage.getItem(ONBOARD_KEY) !== "1"; } catch { return true; }
  });
  const paused = useRef(false);
  const audioRef = useRef(null);
  const chuffStop = useRef(null);
  const timers = useRef(new Set());       // every pending timeout id
  const wordAudios = useRef(new Set());   // every live word-audio element
  const departResume = useRef(null);      // depart read-back continuation while paused
  const announceResume = useRef(null);    // station-master read-aloud continuation
  const phaseRef = useRef(PHASES.INTRO);
  const soundRef = useRef(isSoundEnabled);

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

  useEffect(() => { soundRef.current = isSoundEnabled; }, [isSoundEnabled]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // GamePlayer freezes the game on tab-hide and while its quit dialog is
  // open: stop the chuff loop, checkpoint the depart chain, and pause any
  // playing word audio; resume picks everything back up.
  function enginePause() {
    if (paused.current) return;
    paused.current = true;
    chuffStop.current?.();
    chuffStop.current = null;
    audioRef.current?.pause?.();
  }
  function engineResume() {
    if (!paused.current) return;
    paused.current = false;
    const pending = departResume.current || announceResume.current;
    departResume.current = null;
    announceResume.current = null;
    if (pending) pending();
    else {
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
      for (const id of pendingTimers) window.clearTimeout(id);
      pendingTimers.clear();
      chuffStop.current?.();
      for (const audio of liveAudios) { try { audio.pause(); } catch { /* already gone */ } }
      liveAudios.clear();
    };
  }, []);

  function announce() {
    if (!isSoundEnabled) return;
    audioRef.current?.pause?.();
    let i = 0;
    const speakNext = () => {
      if (i >= solution.length) return;
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
    if (phase !== PHASES.SHUNT || needsEngine) return;
    if (train.rusty && wordIndex === train.rusty.index && !rustyFixed) {
      miss("rusty"); // rusty car won't couple - repair shed first
      return;
    }
    // Correct if this carriage carries the word the next empty slot needs
    // (identical words like "the" are interchangeable by design).
    if (solution[wordIndex] === solution[nextSlot]) {
      setCoupled(c => [...c, wordIndex]);
      goodBump();
      return;
    }
    miss("order");
  }

  function chooseEngine(option) {
    if (option === train.engine.correct) {
      setEngineChoice(option);
      setCoupled(c => (c.includes(0) ? c : [0, ...c]));
      goodBump();
    } else miss("engine");
  }
  function chooseCaboose(mark) {
    if (coupled.length < train.words.length) { miss("early-caboose"); return; }
    if (mark === train.endMark) { setCabooseChoice(mark); goodBump(); }
    else miss("caboose");
  }
  function repairRusty(option) {
    if (option === train.rusty.correct) { setRustyFixed(true); if (isSoundEnabled) sfx.ding(); }
    else miss("repair");
  }
  function loadCrate(option) {
    if (option === train.gap.correct) { setGapFilled(true); if (isSoundEnabled) sfx.ding(); }
    else miss("crate");
  }

  function depart() {
    if (!trackDone) return;
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
      if (isSoundEnabled) later(timers.current, 550, () => sfx.stamp());
    }
    setBlast(true);
    later(timers.current, 1100, () => setBlast(false));
    if (isSoundEnabled) {
      sfx.whistle();
      sfx.crossingBell();
      chuffStop.current = sfx.startChuff();
    }
    setPhase(PHASES.DEPART);
    let i = 0;
    const leaveStation = () => {
      // Read-back done: the train accelerates out of the scene.
      setMotion("out");
      later(timers.current, 1500, () => {
        if (paused.current) { departResume.current = finishTrain; return; }
        finishTrain();
      });
    };
    // Pause checkpoints the chain: a timer that fires while paused stores its
    // continuation instead of advancing, and engineResume runs it later.
    const step = () => {
      if (paused.current) { departResume.current = step; return; }
      if (i >= solution.length) {
        later(timers.current, 450, () => {
          if (paused.current) { departResume.current = leaveStation; return; }
          leaveStation();
        });
        return;
      }
      setLitWord(i);
      if (isSoundEnabled) {
        audioRef.current = playWordTracked(wordAudios.current, solution[i], () => { i += 1; step(); });
      } else later(timers.current, 560, () => { i += 1; step(); });
    };
    later(timers.current, 950, step);
  }

  function finishTrain() {
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
    onComplete({ level: levelIndex, stars, mistakes, express });
    if (levelIndex + 1 < LEVELS_PER_LINE) {
      setLevelIndex(l => l + 1);
      setTrainIndex(0); setQueue([]); setMistakes(0); setExpress(0); setCombo(1);
      resetTrainState();
      setPhase(PHASES.INTRO);
    } else {
      onQuit();
    }
  }

  function startLevelPlay() {
    sfx.unlock(); // first user gesture unlocks the AudioContext
    setPhase(PHASES.SHUNT);
  }

  function dismissOnboarding() {
    try { window.localStorage.setItem(ONBOARD_KEY, "1"); } catch { /* storage optional */ }
    setShowOnboarding(false);
  }

  const faultList = [...new Set(level.trains.flatMap(t => t.faults))]
    .map(f => FAULT_LABELS[f]).filter(Boolean).join(" - ");
  const rolling = phase === PHASES.DEPART;

  return (
    <div className={`sx-stage sx-${world} sx-motion-${motion} ${jolt ? "sx-jolt" : ""} ${bump ? "sx-bump" : ""} ${rolling ? "sx-scroll" : ""}`} data-phase={phase}>
      <div className="sx-sky"><Scenery world={world} /></div>
      <div className="sx-far" />
      <div className="sx-mid" />
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

      <div className="sx-mainline">
        <div className={`sx-signal ${(trackDone && phase === PHASES.SHUNT) || rolling ? "sx-go" : ""}`} aria-hidden="true">
          <i className="sx-arm" /><i className="sx-lamp" />
        </div>
        <div className={`sx-train ${rolling || motion !== "idle" ? "sx-rolling" : ""}`}>
          <TrainCar kind="engine" word={train.engine ? (engineChoice ?? "?") : solution[0]}
            ghost={train.engine ? engineChoice === null : coupled.length === 0}
            lit={litWord === 0} smoking={rolling || motion !== "idle"} blasting={blast} />
          {solution.slice(1).map((word, i) => {
            const slot = i + 1;
            const filled = coupled.length > slot;
            return (
              <TrainCar key={slot} tone={slot % TONES.length} word={word} ghost={!filled}
                lit={litWord === slot} arrived={filled && coupled.length === slot + 1 && phase === PHASES.SHUNT} />
            );
          })}
          <TrainCar kind="caboose" word={train.caboose ? (cabooseChoice ?? "?") : train.endMark}
            ghost={Boolean(train.caboose) && !cabooseChoice} />
        </div>
        <div className="sx-trackbed" />
        <div className="sx-fore" aria-hidden="true"><ForeSvg world={world} /><ForeSvg world={world} /></div>
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

          <div className="sx-master">
            <span className="sx-pal" aria-hidden="true"><LanternBadge /></span>
            <div className="sx-bubble">
              <p>Build the train that says...</p>
              {isSoundEnabled ? (
                <button type="button" className="sx-bell" onClick={announce}><BellIcon /> Hear it again</button>
              ) : (
                // Sound off: the listen button would no-op, so read it instead.
                <p className="sx-sayit">"{solution.join(" ")}{train.endMark}"</p>
              )}
              {hint && <p className="sx-hint" role="status">{hint}</p>}
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

      {phase === PHASES.INTRO && showOnboarding && (
        <section className="sx-ticket" role="dialog" aria-label="How to play Sentence Express">
          <h2>HOW TO PLAY</h2>
          <p className="sx-ticketsub">Rebuild the sentence train so it rolls away reading just right!</p>
          <ul style={{ textAlign: "left", margin: "0 0 14px", paddingLeft: 20, lineHeight: 1.55, fontSize: 14, fontWeight: 600 }}>
            <li>Tap (or click) the siding cars in order to couple the sentence.</li>
            <li>Fix the faults: pick the capital engine, swap the rusty car, load the lost crate, choose the end-mark caboose.</li>
            <li>Tap "Hear it again" to listen, then PULL WHISTLE when the track is ready.</li>
          </ul>
          <button type="button" className="sx-golden" onClick={dismissOnboarding}>TAP TO PLAY</button>
        </section>
      )}

      {phase === PHASES.INTRO && !showOnboarding && (
        <section className="sx-ticket sx-introticket">
          <h2>{WORLD_LABELS[world]}</h2>
          <p className="sx-ticketsub">Level {levelIndex + 1}{level.isGoldRun ? " - GOLD MAIL RUN" : ""} - {level.trains.length} trains</p>
          <div className="sx-route" aria-label={`Station ${levelIndex + 1} of ${LEVELS_PER_LINE}`}>
            {Array.from({ length: LEVELS_PER_LINE }, (_, i) => (
              <i key={i} className={i < levelIndex ? "sx-done" : i === levelIndex ? "sx-here" : ""} />
            ))}
          </div>
          <p className="sx-faults">Faults reported: {faultList}</p>
          <button type="button" className="sx-golden" onClick={startLevelPlay}>TO THE YARD -&gt;</button>
        </section>
      )}

      {phase === PHASES.TALLY && (
        <section className="sx-ticket">
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
          <button type="button" className="sx-golden" onClick={nextLevel}>
            {levelIndex + 1 < LEVELS_PER_LINE ? "NEXT DEPARTURE ->" : "FINISH THE LINE"}
          </button>
        </section>
      )}
    </div>
  );
}
