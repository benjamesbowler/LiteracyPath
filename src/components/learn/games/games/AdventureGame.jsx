import { useEffect, useMemo, useRef, useState } from "react";
import { cancelSpeech, hasRecordedSpeech, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio";
import { playCelebrationFanfare, playCorrectChime, playPopSound, playSoftBuzz } from "../../../../utils/audio/gameSfx";
import { ConfettiCelebration } from "../shared/ConfettiCelebration.jsx";
import { IllustratedGameScene } from "../shared/IllustratedGameScene.jsx";
import { ProgressStars } from "../shared/ProgressStars.jsx";
import { getChildWordAsset } from "../../../../data/childAssets.js";
import {
  buildAdventureRoundSet,
  adventureStars
} from "../../../../utils/adventureRounds.js";

// The three adventure games share one engine: rounds in, planks/bins/plants
// out. Every mistake coaches (replay + retry), every win is a visible thing
// the child MADE (a bridge, a sorted factory line, a transformed plant).

// First-run onboarding is remembered per device and per arcade game id (the
// three modes are three separate games in the hub); storage can be denied
// (private mode), in which case the intro simply shows again next session.
const ONBOARD = {
  rescue: {
    key: "lp-arcade-onboarded-v1:word-rescue",
    goal: "Build the bridge by matching each word you hear!",
    hints: [
      "Listen to the word.",
      "Tap the matching word to lay a plank."
    ]
  },
  sort: {
    key: "lp-arcade-onboarded-v1:sound-sort-factory",
    goal: "Sort every word into the bin with the same starting sound!",
    hints: [
      "Read the word on the belt.",
      "Tap its starting-sound bin."
    ]
  },
  garden: {
    key: "lp-arcade-onboarded-v1:letter-garden",
    goal: "Change one word to grow a labeled plant!",
    hints: [
      "Start with the known word.",
      "Change one sound, then spell the new word."
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
  const startRef = useRef(null);

  useEffect(() => {
    const startButton = startRef.current;
    startButton?.focus({ preventScroll: true });
    const focusFrame = window.requestAnimationFrame(() => startButton?.focus({ preventScroll: true }));
    const onKey = event => {
      if (event.key === "Tab") {
        event.preventDefault();
        startButton?.focus({ preventScroll: true });
        return;
      }
      if (!["Enter", " "].includes(event.key)) return;
      if (event.target === startButton) return;
      event.preventDefault();
      onStart();
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKey, true);
    };
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
        <div style={{ width: "100%", display: "grid", gap: 10, textAlign: "left", color: "#334155", fontSize: "1.02rem", lineHeight: 1.4, fontWeight: 650 }}>
          {copy.hints.map((hint, index) => (
            <span key={hint} style={{ minHeight: 44, display: "grid", gridTemplateColumns: "36px 1fr", alignItems: "center", gap: 10 }}>
              <b aria-hidden="true" style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 12, background: "var(--game-accent-soft, #EAF7F0)", color: "#0F172A" }}>{index + 1}</b>
              {hint}
            </span>
          ))}
        </div>
        <div>
          <button
            ref={startRef}
            type="button"
            className="lg-game-primary"
            onClick={onStart}
            style={{ minWidth: 156, minHeight: 56 }}
          >
            Tap to play
          </button>
          <div style={{ marginTop: 8, fontSize: "0.74rem", fontWeight: 700, color: "#64748B" }}>or press Enter</div>
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
    <IllustratedGameScene mode="rescue" stageClassName="adv-rescue">
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
    </IllustratedGameScene>
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
    <IllustratedGameScene mode="sort" stageClassName="adv-sort">
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
    </IllustratedGameScene>
  );
}

// ── Letter Garden ──────────────────────────────────────────────────────────
function GardenStage({ rounds, state, isSoundEnabled }) {
  const { index, typed, grown, wrongLetter, pickLetter, hearWord } = state;
  const round = rounds[index] || rounds[rounds.length - 1];
  const canHearWord = isSoundEnabled && hasRecordedSpeech(round?.word);
  const cueAsset = getChildWordAsset(round?.word);
  const cueImage = cueAsset?.image || cueAsset?.fallbackImage || "";
  const displayLetters = typed.length ? typed : [...round.sourceWord];
  const isChanged = typed.length > 0;
  const [failedCueImage, setFailedCueImage] = useState("");
  const showPictureCue = Boolean(cueImage) && failedCueImage !== cueImage;

  useEffect(() => {
    if (canHearWord && round) speakWord(round.word);
  }, [canHearWord, round]);

  return (
    <IllustratedGameScene mode="garden" stageClassName="adv-garden">
      <p><span>Change <strong>{round?.sourceWord}</strong> → grow!</span></p>
      <div className="adv-garden-scene" aria-hidden="true"><span className="adv-garden-sun" /><span className="adv-garden-hill" /><span className="adv-garden-watering-can" /></div>
      <div className="adv-word-cue">
        {showPictureCue && (
          <img
            src={cueImage}
            alt={round.targetLabel || cueAsset?.alt || `Picture for ${round.word}`}
            onError={() => setFailedCueImage(cueImage)}
          />
        )}
        {canHearWord && <button type="button" className="lg-game-audio" onClick={hearWord}>Hear word</button>}
        {!canHearWord && !showPictureCue && (
          // No reliable picture or audio cue: show the target so the round stays possible.
          <span className="adv-belt-item" style={{ animation: "none" }}>{round.word}</span>
        )}
      </div>
      <div className="adv-change-arrow" aria-hidden="true"><span>{round.sourceWord}</span><b>→</b><span>new plant word</span></div>
      <div className="adv-slots" aria-label={`Change ${round.sourceWord} to spell ${round.word}`}>
        {[...round.word].map((letter, i) => (
          <span key={i} data-change-index={i === round.changeIndex ? "true" : "false"} className={`adv-slot${displayLetters[i] ? " filled" : ""}${i === round.changeIndex ? " changeable" : ""}${isChanged && i === round.changeIndex ? " changed" : ""}`}>
            {displayLetters[i] || ""}
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
      <div className="adv-garden-row" aria-label={`${grown.length} labeled plants grown`}>
        {rounds.map((r, i) => {
          const grownRound = grown.find(item => item.id === r.id);
          const label = grownRound ? `${grownRound.word} ${grownRound.plantName}` : `Ready for ${r.plantName}`;
          return (
            <div key={r.id || i} className={`adv-plant-card${grownRound ? " grown" : ""}`} data-plant={r.flower} aria-label={label}>
              <span className="adv-plant" aria-hidden="true"><span className="adv-plant-stem" /><span className="adv-plant-crown" /></span>
              <span className="adv-plant-label">{grownRound ? grownRound.word : "ready"}</span>
              <span className="adv-plant-name">{grownRound ? grownRound.plantName : r.plantName}</span>
            </div>
          );
        })}
      </div>
    </IllustratedGameScene>
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
  const scoreRef = useRef(0);
  const activeIndexRef = useRef(index);
  const soundEnabledRef = useRef(isSoundEnabled);
  const speechTokenRef = useRef(0);
  const responseEvidenceRef = useRef({ firstResponses: [], assistedRetries: [] });
  const responseAttemptsRef = useRef(new Map());

  useEffect(() => { activeIndexRef.current = index; }, [index]);
  useEffect(() => { soundEnabledRef.current = isSoundEnabled; }, [isSoundEnabled]);

  useEffect(() => { onScoreUpdate?.(score); }, [onScoreUpdate, score]);
  useEffect(() => { onProgressUpdate?.(Math.min(index + 1, total), total || 1); }, [onProgressUpdate, index, total]);

  useEffect(() => {
    if (!isSoundEnabled) {
      speechTokenRef.current += 1;
      cancelSpeech();
    }
  }, [isSoundEnabled]);

  // A quit unmounts the game: pending timers must die with it, or a scheduled
  // finish would still fire onComplete and save results after the child left.
  useEffect(() => () => {
    speechTokenRef.current += 1;
    cancelSpeech();
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
    speechTokenRef.current += 1;
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
    onComplete?.(earned, scoreRef.current, correctCount, responseEvidenceRef.current);
  }

  function advance(correctCount) {
    later(() => {
      speechTokenRef.current += 1;
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
      const replayIndex = activeIndexRef.current;
      const replayToken = ++speechTokenRef.current;
      if (replayWord) later(() => {
        if (replayToken !== speechTokenRef.current || replayIndex !== activeIndexRef.current || !soundEnabledRef.current || pausedRef.current || busyRef.current) return;
        speakWord(replayWord);
      }, 650);
    }
    later(() => setter(""), 500);
  }

  function restart() {
    speechTokenRef.current += 1;
    busyRef.current = false;
    setVersion(v => v + 1);
    setIndex(0); scoreRef.current = 0; setScore(0); setWrongs(0); setCompleted(false); setStars(0);
    setTyped([]); setGrown([]); setPlanks(0); setBeltKey(k => k + 1);
    responseEvidenceRef.current = { firstResponses: [], assistedRetries: [] };
    responseAttemptsRef.current = new Map();
  }

  function recordFirstResponse(response) {
    if (!response || responseEvidenceRef.current.firstResponses.some(item => item.round === response.round)) return;
    responseEvidenceRef.current.firstResponses.push(Object.freeze({ ...response, ...(response.supportUsed ? { supportUsed: Object.freeze([...response.supportUsed]) } : {}) }));
  }

  function recordAssistedRetry(retry) {
    if (!retry) return;
    responseEvidenceRef.current.assistedRetries.push(Object.freeze({ ...retry, practiceOnly: true, independent: false, audioDelivery: "not_measured", supportUsed: Object.freeze([...(retry.supportUsed || [])]) }));
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
        if (!round) return;
        if (!responseEvidenceRef.current.firstResponses.some(item => item.round === index)) {
          recordFirstResponse({ game: "word-rescue", round: index, target: round.word, response: word, correct: word === round.word, soundEnabled: isSoundEnabled });
        }
        if (word !== round.word) {
          responseAttemptsRef.current.set(index, (responseAttemptsRef.current.get(index) || 0) + 1);
          miss(setWrongWord, word, round.word);
          return;
        }
        busyRef.current = true;
        const attempts = responseAttemptsRef.current.get(index) || 0;
        if (attempts) recordAssistedRetry({ game: "word-rescue", round: index, target: round.word, attempts, supportUsed: ["target_replay"] });
        if (isSoundEnabled) playPopSound();
        scoreRef.current += 20;
        setScore(scoreRef.current);
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
        if (!item) return;
        if (!responseEvidenceRef.current.firstResponses.some(entry => entry.round === index)) {
          recordFirstResponse({ game: "sound-sort-factory", round: index, target: item.word, response: bin, correct: bin === item.bin, soundEnabled: isSoundEnabled });
        }
        if (bin !== item.bin) {
          responseAttemptsRef.current.set(index, (responseAttemptsRef.current.get(index) || 0) + 1);
          miss(setWrongBin, bin);
          return;
        }
        busyRef.current = true;
        const attempts = responseAttemptsRef.current.get(index) || 0;
        if (attempts) recordAssistedRetry({ game: "sound-sort-factory", round: index, target: item.word, attempts, supportUsed: ["target_replay"] });
        if (isSoundEnabled) playCorrectChime();
        scoreRef.current += 15;
        setScore(scoreRef.current);
        setBeltKey(k => k + 1);
        advance(index + 1);
      }
    };
    return <SortStage sort={sort} state={state} isSoundEnabled={isSoundEnabled} />;
  }

  const state = {
    index, typed, grown, wrongLetter,
    hearWord: () => {
      const round = garden[index];
      speechTokenRef.current += 1;
      cancelSpeech();
      if (round && soundEnabledRef.current && hasRecordedSpeech(round.word)) speakWord(round.word);
    },
    pickLetter: letter => {
      if (busyRef.current) return;
      const round = garden[index];
      if (!round) return;
      const expected = round.word[round.changeIndex];
      if (!responseEvidenceRef.current.firstResponses.some(item => item.round === index)) {
        recordFirstResponse({ game: "letter-garden", round: index, target: round.word, response: letter, correct: letter === expected, practiceOnly: true, independent: false, supportUsed: ["unchanged_source_letters", "picture_or_printed_target"], audioDelivery: "not_measured", soundEnabled: isSoundEnabled });
      }
      if (letter !== expected) {
        responseAttemptsRef.current.set(index, (responseAttemptsRef.current.get(index) || 0) + 1);
        miss(setWrongLetter, letter, round.word);
        return;
      }
      const attempts = responseAttemptsRef.current.get(index) || 0;
      if (attempts) recordAssistedRetry({ game: "letter-garden", round: index, target: round.word, attempts, supportUsed: ["target_replay", "unchanged_source_letters"] });
      const nextTyped = typed.length ? [...typed] : [...round.sourceWord];
      nextTyped[round.changeIndex] = letter;
      if (isSoundEnabled) playPopSound();
      scoreRef.current += 16;
      setScore(scoreRef.current);
      busyRef.current = true;
      if (isSoundEnabled) playCorrectChime();
      setGrown(g => [...g, round]);
      setTyped(nextTyped);
      advance(grown.length + 1);
    }
  };
  return <GardenStage rounds={garden} state={state} isSoundEnabled={isSoundEnabled} />;
}

export default AdventureGame;
