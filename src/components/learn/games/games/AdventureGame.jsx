import { useEffect, useMemo, useRef, useState } from "react";
import { cancelSpeech, hasRecordedSpeech, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio";
import { playCelebrationFanfare, playCorrectChime, playPopSound, playSoftBuzz } from "../../../../utils/audio/gameSfx";
import { ConfettiCelebration } from "../shared/ConfettiCelebration.jsx";
import { ProgressStars } from "../shared/ProgressStars.jsx";
import {
  buildAdventureRoundSet,
  adventureStars
} from "../../../../utils/adventureRounds.js";

// The three adventure games share one engine: rounds in, planks/bins/flowers
// out. Every mistake coaches (replay + retry), every win is a visible thing
// the child MADE (a bridge, a sorted factory line, a garden).

// First-run onboarding is remembered per device and per arcade game id (the
// three modes are three separate games in the hub); storage can be denied
// (private mode), in which case the intro simply shows again next session.
const ONBOARD = {
  rescue: {
    key: "lp-arcade-onboarded-v1:word-rescue",
    goal: "Build the bridge by matching each word you hear!",
    hints: [
      'Tap "Hear word" to listen to the word again.',
      "Click or tap the matching word to lay a plank.",
      "A wrong pick only wobbles - try again!"
    ]
  },
  sort: {
    key: "lp-arcade-onboarded-v1:sound-sort-factory",
    goal: "Sort every word into the bin with the same starting sound!",
    hints: [
      "Read the word riding the factory belt.",
      "Click or tap the bin whose sound it starts with.",
      "Sort them all to finish the factory line."
    ]
  },
  garden: {
    key: "lp-arcade-onboarded-v1:letter-garden",
    goal: "Spell each word to grow a flower!",
    hints: [
      'Tap "Hear word" to listen to the word again.',
      "Click or tap the letters in order.",
      "Finish the word and the flower blooms."
    ]
  }
};

function readOnboarded(key) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markOnboarded(key) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* onboarding is optional */
  }
}

// Static card (no animated intro) so prefers-reduced-motion is respected;
// light panel matches the lg-game-complete card these games already use.
function AdventureOnboarding({ title, copy, onStart }) {
  useEffect(() => {
    const onKey = event => {
      if (event.key === "Escape") return; // GamePlayer owns Esc (quit dialog).
      onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`How to play ${title}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1, // below GamePlayer's quit/resume dialogs (z-index 2)
        display: "grid",
        placeItems: "center",
        background: "rgba(15, 23, 42, 0.55)",
        padding: 20,
        cursor: "pointer"
      }}
      onClick={onStart}
    >
      <div
        style={{
          width: "min(100%, 420px)",
          display: "grid",
          gap: 12,
          justifyItems: "center",
          border: "1px solid var(--lg-border, #CBD5E1)",
          borderRadius: "var(--lg-radius, 16px)",
          background: "var(--lg-surface, #ffffff)",
          boxShadow: "var(--lp-shadow-soft, 0 18px 40px rgba(15, 23, 42, 0.18))",
          padding: "clamp(22px, 4vw, 32px)",
          textAlign: "center"
        }}
      >
        <h2 style={{ margin: 0, color: "#0F172A", fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 700 }}>{title}</h2>
        <p style={{ margin: 0, color: "#475569", fontWeight: 600, lineHeight: 1.4 }}>{copy.goal}</p>
        <div style={{ display: "grid", gap: 8, textAlign: "left", color: "#334155", fontSize: "0.9rem", lineHeight: 1.45, fontWeight: 600 }}>
          {copy.hints.map(hint => <span key={hint}>{hint}</span>)}
        </div>
        <div>
          <button type="button" className="lg-game-primary" onClick={onStart}>Tap to play</button>
          <div style={{ marginTop: 8, fontSize: "0.74rem", fontWeight: 700, color: "#64748B" }}>or press any key</div>
        </div>
      </div>
    </div>
  );
}

function Complete({ title, stars, score, onRestart }) {
  return (
    <div className="lg-game-complete">
      <ConfettiCelebration show={stars > 0} />
      <img className="kid-cheer" src="/images/learn-games/phinny-cheering.webp" alt="" onError={e => { e.currentTarget.style.display = "none"; }} />
      <h2>{title} complete!</h2>
      <ProgressStars stars={stars} size="lg" />
      <p>{score} points</p>
      {stars > 0 && <p className="kid-coins-earned">+{stars * 7} coins for your Hollow!</p>}
      <button type="button" className="lg-game-primary" onClick={onRestart}>Play again</button>
    </div>
  );
}

// ── Word Rescue ────────────────────────────────────────────────────────────
function RescueStage({ rounds, state, isSoundEnabled }) {
  const { index, planks, wrongWord, choose } = state;
  const round = rounds[index] || rounds[rounds.length - 1];
  const canHearWord = isSoundEnabled && hasRecordedSpeech(round?.word);

  useEffect(() => {
    if (canHearWord && round) speakWord(round.word);
  }, [canHearWord, round]);

  return (
    <section className="lg-game-stage adv-rescue">
      <p>{canHearWord ? "Hear the word, then tap the matching word!" : "Tap the matching word to build the bridge!"}</p>
      {canHearWord ? (
        <button type="button" className="lg-game-audio" onClick={() => speakWord(round.word)}>Hear word</button>
      ) : (
        // Sound off: the target only exists as audio, so show it as a card.
        <span className="adv-belt-item" style={{ animation: "none" }}>{round.word}</span>
      )}
      <div className="adv-bridge" aria-label={`${planks} of ${rounds.length} planks built`}>
        <span className="adv-pal" style={{ "--plank": planks }} aria-hidden="true">
          <img src="/images/pals/poses/meadow-wave.webp" alt="" onError={e => { e.currentTarget.style.display = "none"; }} />
        </span>
        {rounds.map((r, i) => (
          <span key={i} className={`adv-plank${i < planks ? " laid" : ""}`} aria-hidden="true" />
        ))}
        <span className="adv-goal" aria-hidden="true">GO</span>
      </div>
      <div className="adv-choices">
        {round.choices.map(word => (
          <button
            key={word}
            type="button"
            className={wrongWord === word ? "kid-wobble" : ""}
            onClick={() => choose(word)}
          >
            {word}
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Sound Sort Factory ─────────────────────────────────────────────────────
function SortStage({ sort, state, isSoundEnabled }) {
  const { index, beltKey, wrongBin, sortItem } = state;
  const item = sort.items[index] || sort.items[sort.items.length - 1];

  useEffect(() => {
    if (isSoundEnabled && item) speakWord(item.word);
  }, [isSoundEnabled, item]);

  return (
    <section className="lg-game-stage adv-sort">
      <p>Which bin does it belong in? Look at how it starts!</p>
      <div className="adv-belt" aria-hidden="true">
        <span key={beltKey} className="adv-belt-item">{item.word}</span>
      </div>
      <div className="adv-bins">
        {[sort.binA, sort.binB].map(bin => (
          <button
            key={bin}
            type="button"
            className={`adv-bin${wrongBin === bin ? " kid-wobble" : ""}`}
            onClick={() => {
              if (isSoundEnabled) speakPhoneme(bin);
              sortItem(bin);
            }}
          >
            <span className="adv-bin-label">{bin}</span>
            <span className="adv-bin-mouth" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Letter Garden ──────────────────────────────────────────────────────────
function GardenStage({ rounds, state, isSoundEnabled }) {
  const { index, typed, grown, wrongLetter, pickLetter } = state;
  const round = rounds[index] || rounds[rounds.length - 1];
  const canHearWord = isSoundEnabled && hasRecordedSpeech(round?.word);

  useEffect(() => {
    if (canHearWord && round) speakWord(round.word);
  }, [canHearWord, round]);

  return (
    <section className="lg-game-stage adv-garden">
      <p>Build the word to grow a flower!</p>
      {canHearWord ? (
        <button type="button" className="lg-game-audio" onClick={() => speakWord(round.word)}>Hear word</button>
      ) : (
        // Sound off: the target only exists as audio, so show it as a card.
        <span className="adv-belt-item" style={{ animation: "none" }}>{round.word}</span>
      )}
      <div className="adv-slots" aria-label={`Spell ${round.word}`}>
        {[...round.word].map((letter, i) => (
          <span key={i} className={`adv-slot${i < typed.length ? " filled" : ""}`}>
            {i < typed.length ? typed[i] : ""}
          </span>
        ))}
      </div>
      <div className="adv-letters">
        {round.bank.map(letter => (
          <button
            key={letter}
            type="button"
            className={wrongLetter === letter ? "kid-wobble" : ""}
            onClick={() => pickLetter(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="adv-garden-row" aria-label={`${grown.length} flowers grown`}>
        {rounds.map((r, i) => (
          <span key={i} className={`adv-flower${i < grown.length ? " grown" : ""}`} style={{ "--flower-hue": `${(i * 42) % 360}deg` }} aria-hidden="true">
            <span className="adv-flower-stem" />
            <span className="adv-flower-head" />
          </span>
        ))}
      </div>
    </section>
  );
}

export function AdventureGame({ title, mode, difficulty = "easy", startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const [version, setVersion] = useState(0);
  const onboard = ONBOARD[mode] || ONBOARD.garden;
  const [introOpen, setIntroOpen] = useState(() => !readOnboarded(onboard.key));

  const roundSet = useMemo(
    () => buildAdventureRoundSet(mode, difficulty, version),
    [mode, difficulty, version]
  );
  const { rescue, sort, garden } = roundSet;
  const total = mode === "rescue" ? rescue.length : mode === "sort" ? sort.items.length : garden.length;

  const [index, setIndex] = useState(() => Math.max(0, Math.min(Number(startLevel) || 0, Math.max(total - 1, 0))));
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [stars, setStars] = useState(0);
  const [typed, setTyped] = useState([]);
  const [grown, setGrown] = useState([]);
  const [planks, setPlanks] = useState(0);
  const [wrongWord, setWrongWord] = useState("");
  const [wrongBin, setWrongBin] = useState("");
  const [wrongLetter, setWrongLetter] = useState("");
  const [beltKey, setBeltKey] = useState(0);
  // Busy blocks all input between a correct tap and the scheduled advance, so
  // double-taps can't double-count or fire onComplete twice. timeoutsRef tracks
  // every pending timer as {id, fn, remaining, startedAt} entries so unmount
  // (quit) can cancel them before finish fires, and so the engine pause
  // contract can freeze and re-arm them (GamePlayer pauses on tab-hide and
  // while its quit dialog is open).
  const busyRef = useRef(false);
  const timeoutsRef = useRef([]);
  const pausedRef = useRef(false);

  useEffect(() => { onScoreUpdate?.(score); }, [onScoreUpdate, score]);
  useEffect(() => { onProgressUpdate?.(Math.min(index + 1, total), total || 1); }, [onProgressUpdate, index, total]);

  // A quit unmounts the game: pending timers must die with it, or a scheduled
  // finish would still fire onComplete and save results after the child left.
  useEffect(() => () => {
    timeoutsRef.current.forEach(entry => window.clearTimeout(entry.id));
    timeoutsRef.current = [];
  }, []);

  function armTimeout(entry) {
    entry.startedAt = Date.now();
    entry.id = window.setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== entry);
      entry.fn();
    }, entry.remaining);
  }

  function later(fn, ms) {
    const entry = { id: 0, fn, remaining: ms, startedAt: 0 };
    timeoutsRef.current.push(entry);
    if (!pausedRef.current) armTimeout(entry);
  }

  function pauseEngine() {
    if (pausedRef.current) return;
    pausedRef.current = true;
    cancelSpeech();
    const now = Date.now();
    timeoutsRef.current.forEach(entry => {
      window.clearTimeout(entry.id);
      entry.remaining = Math.max(0, entry.remaining - (now - entry.startedAt));
    });
  }

  function resumeEngine() {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    timeoutsRef.current.forEach(entry => armTimeout(entry));
  }

  // GamePlayer chrome pauses the engine on tab-hide and while its quit dialog
  // is open. Callbacks only touch refs, so register once.
  useEffect(() => {
    onEngineReady?.({ pause: pauseEngine, resume: resumeEngine });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine callbacks only touch refs, register once
  }, []);

  function finish(correctCount) {
    const earned = adventureStars(correctCount, total, wrongs);
    setStars(earned);
    setCompleted(true);
    if (isSoundEnabled) playCelebrationFanfare();
    onComplete?.(earned, score, correctCount);
  }

  function advance(correctCount) {
    later(() => {
      busyRef.current = false;
      if (index + 1 >= total) finish(correctCount);
      else {
        const next = index + 1;
        setTyped([]); // letters never leak into the next round
        setIndex(next);
        onCheckpoint?.(next, total);
      }
    }, 600);
  }

  function miss(setter, value, replayWord) {
    setWrongs(w => w + 1);
    setter(value);
    if (isSoundEnabled) {
      playSoftBuzz();
      // Coach: hear the target again before retrying.
      if (replayWord) later(() => speakWord(replayWord), 650);
    }
    later(() => setter(""), 500);
  }

  function restart() {
    busyRef.current = false;
    setVersion(v => v + 1);
    setIndex(0); setScore(0); setWrongs(0); setCompleted(false); setStars(0);
    setTyped([]); setGrown([]); setPlanks(0); setBeltKey(k => k + 1);
  }

  if (completed) return <Complete title={title} stars={stars} score={score} onRestart={restart} />;

  // First-run intro: the stage mounts only after dismissal, so gameplay is
  // trivially frozen behind the overlay (no timers or speech can run).
  if (introOpen) {
    return (
      <AdventureOnboarding
        title={title}
        copy={onboard}
        onStart={() => {
          markOnboarded(onboard.key);
          setIntroOpen(false);
        }}
      />
    );
  }

  if (mode === "rescue") {
    const state = {
      index, planks, wrongWord,
      choose: word => {
        if (busyRef.current) return;
        const round = rescue[index];
        if (!round || word !== round.word) { miss(setWrongWord, word, rescue[index]?.word); return; }
        busyRef.current = true;
        if (isSoundEnabled) playPopSound();
        setScore(s => s + 20);
        setPlanks(p => p + 1);
        advance(planks + 1);
      }
    };
    return <RescueStage rounds={rescue} state={state} isSoundEnabled={isSoundEnabled} />;
  }

  if (mode === "sort") {
    const state = {
      index, beltKey, wrongBin,
      sortItem: bin => {
        if (busyRef.current) return;
        const item = sort.items[index];
        if (!item || bin !== item.bin) { miss(setWrongBin, bin); return; }
        busyRef.current = true;
        if (isSoundEnabled) playCorrectChime();
        setScore(s => s + 15);
        setBeltKey(k => k + 1);
        advance(index + 1);
      }
    };
    return <SortStage sort={sort} state={state} isSoundEnabled={isSoundEnabled} />;
  }

  const state = {
    index, typed, grown, wrongLetter,
    pickLetter: letter => {
      if (busyRef.current) return;
      const round = garden[index];
      if (!round) return;
      const expected = round.word[typed.length];
      if (letter !== expected) { miss(setWrongLetter, letter, round.word); return; }
      const nextTyped = [...typed, letter];
      if (isSoundEnabled) playPopSound();
      setScore(s => s + 6);
      if (nextTyped.length >= round.word.length) {
        busyRef.current = true;
        if (isSoundEnabled) playCorrectChime();
        setScore(s => s + 10);
        setGrown(g => [...g, round.flower]);
        setTyped([]);
        advance(grown.length + 1);
      } else {
        setTyped(nextTyped);
      }
    }
  };
  return <GardenStage rounds={garden} state={state} isSoundEnabled={isSoundEnabled} />;
}

export default AdventureGame;
