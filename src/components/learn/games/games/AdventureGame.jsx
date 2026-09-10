import { useEffect, useMemo, useRef, useState } from "react";
import { cancelSpeech, hasRecordedSpeech, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio";
import { playCelebrationFanfare, playCorrectChime, playPopSound, playSoftBuzz } from "../../../../utils/audio/gameSfx";
import { ConfettiCelebration } from "../shared/ConfettiCelebration.jsx";
import { IllustratedGameScene } from "../shared/IllustratedGameScene.jsx";
import { ProgressStars } from "../shared/ProgressStars.jsx";
import { getChildWordAsset } from "../../../../data/childAssets.js";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import { stopCueAudio } from "../../../../utils/audio/cuePlayer.js";
import { RiverRescueScene, WordConveyorScene } from "./adventureScenes.jsx";
import {
  buildAdventureRoundSet,
  adventureStars
} from "../../../../utils/adventureRounds.js";

// The three adventure games share one engine: rounds in, planks/bins/plants
// out. Every mistake coaches (replay + retry), every win is a visible thing
// the child MADE (a bridge, a sorted factory line, a transformed plant).

// Static card (no animated intro) so prefers-reduced-motion is respected;
// light panel matches the lg-game-complete card these games already use.

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
  const { index, resumeSteps, currentSolvedSteps, paused, arrivalReady, wrongWord, choose, finish } = state;
  const round = rounds[index] || rounds[rounds.length - 1];
  const { canHear: canHearWord, replay } = useRecordedPracticeCue(round?.word, isSoundEnabled && !paused);

  return (
    <IllustratedGameScene mode="rescue" stageClassName="adv-rescue">
      <p>{canHearWord ? "Hear the word, then tap the matching word to lay a plank." : "Read the word, then tap it to lay a plank."}</p>
      {canHearWord ? (
        <button type="button" className="lg-game-audio" onClick={replay}>Hear word</button>
      ) : (
        // Sound off: the target only exists as audio, so show it as a card.
        <span className="adv-belt-item" style={{ animation: "none" }}>{round.word}</span>
      )}
      <RiverRescueScene total={rounds.length} knownCompletedSteps={resumeSteps} currentSolvedSteps={currentSolvedSteps} paused={paused} />
      {arrivalReady ? (
        <button type="button" className="lg-game-primary adventure-finish" onClick={finish}>Finish</button>
      ) : (
        <div className="adv-choices">
          {round.choices.map(word => (
            <button
              key={word}
              type="button"
              className={wrongWord === word ? "kid-wobble" : ""}
              onClick={() => choose(word, canHearWord)}
            >
              {word}
            </button>
          ))}
        </div>
      )}
    </IllustratedGameScene>
  );
}

// ── Sound Sort Factory ─────────────────────────────────────────────────────
function SortStage({ sort, state, isSoundEnabled }) {
  const { index, motion, paused, arrivalReady, sortItem, finish } = state;
  const item = sort.items[index] || sort.items[sort.items.length - 1];

  useEffect(() => {
    if (isSoundEnabled && item) speakWord(item.word);
  }, [isSoundEnabled, item]);

  return (
    <IllustratedGameScene mode="sort" stageClassName="adv-sort">
      <p data-task-mode="orthographic">Read the printed word. Sort its beginning grapheme into the matching bin.</p>
      <WordConveyorScene item={item} binA={sort.binA} binB={sort.binB} motion={motion} paused={paused} onSelect={bin => { if (isSoundEnabled) speakPhoneme(bin); sortItem(bin); }} />
      {arrivalReady && <button type="button" className="lg-game-primary adventure-finish" onClick={finish}>Finish</button>}
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

export function AdventureGame({ title, mode, difficulty = "easy", startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onResultReady, onSessionStart, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const [version, setVersion] = useState(0);

  const roundSet = useMemo(
    () => buildAdventureRoundSet(mode, difficulty, version),
    [mode, difficulty, version]
  );
  const { rescue, sort, garden } = roundSet;
  const total = mode === "rescue" ? rescue.length : mode === "sort" ? sort.items.length : garden.length;
  const initialStartLevel = Math.max(0, Math.min(Number(startLevel) || 0, Math.max(total - 1, 0)));

  const [index, setIndex] = useState(initialStartLevel);
  const [score, setScore] = useState(0);
  const wrongsRef = useRef(0);
  const completionReportedRef = useRef(false);
  const [completed, setCompleted] = useState(false);
  const [stars, setStars] = useState(0);
  const [typed, setTyped] = useState([]);
  const [grown, setGrown] = useState([]);
  const [planks, setPlanks] = useState(initialStartLevel);
  const [wrongWord, setWrongWord] = useState("");
  const [wrongBin, setWrongBin] = useState("");
  const [wrongLetter, setWrongLetter] = useState("");
  const [sortMotion, setSortMotion] = useState({ phase: "idle", bin: "", token: 0 });
  const [enginePaused, setEnginePaused] = useState(false);
  const [arrivalReady, setArrivalReady] = useState(false);
  const [resumeSteps, setResumeSteps] = useState(initialStartLevel);
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
  const sortMotionRef = useRef(false);
  const resultReadyRef = useRef(false);
  const onResultReadyRef = useRef(onResultReady);
  const onSessionStartRef = useRef(onSessionStart);

  useEffect(() => { activeIndexRef.current = index; }, [index]);
  useEffect(() => { soundEnabledRef.current = isSoundEnabled; }, [isSoundEnabled]);
  useEffect(() => { onResultReadyRef.current = onResultReady; }, [onResultReady]);
  useEffect(() => { onSessionStartRef.current = onSessionStart; }, [onSessionStart]);
  useEffect(() => { onSessionStartRef.current?.(); }, []);

  useEffect(() => { onScoreUpdate?.(score); }, [onScoreUpdate, score]);
  useEffect(() => { onProgressUpdate?.(Math.min(index + 1, total), total || 1); }, [onProgressUpdate, index, total]);

  useEffect(() => {
    if (!isSoundEnabled) {
      speechTokenRef.current += 1;
      cancelSpeech();
      stopCueAudio();
    }
  }, [isSoundEnabled]);

  // A quit unmounts the game: pending timers must die with it, or a scheduled
  // finish would still fire onComplete and save results after the child left.
  useEffect(() => () => {
    speechTokenRef.current += 1;
    cancelSpeech();
    stopCueAudio();
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
    setEnginePaused(true);
    speechTokenRef.current += 1;
    cancelSpeech();
    stopCueAudio();
    const now = Date.now();
    timeoutsRef.current.forEach(entry => {
      window.clearTimeout(entry.id);
      entry.remaining = Math.max(0, entry.remaining - (now - entry.startedAt));
    });
  }

  function resumeEngine() {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setEnginePaused(false);
    timeoutsRef.current.forEach(entry => armTimeout(entry));
  }

  // GamePlayer chrome pauses the engine on tab-hide and while its quit dialog
  // is open. Callbacks only touch refs, so register once.
  useEffect(() => {
    onEngineReady?.({ pause: pauseEngine, resume: resumeEngine });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine callbacks only touch refs, register once
  }, []);

  function finish(correctCount) {
    if (completionReportedRef.current) return;
    completionReportedRef.current = true;
    setArrivalReady(false);
    const earned = adventureStars(correctCount, total, wrongsRef.current);
    setStars(earned);
    setCompleted(true);
    if (isSoundEnabled) playCelebrationFanfare();
    onComplete?.(earned, scoreRef.current, correctCount, responseEvidenceRef.current);
  }

  function notifyResultReady(correctCount) {
    if (resultReadyRef.current || index + 1 < total) return;
    resultReadyRef.current = true;
    onResultReadyRef.current?.(adventureStars(correctCount, total, wrongsRef.current), scoreRef.current, correctCount, responseEvidenceRef.current);
  }

  function advance(correctCount, delay = 600) {
    later(() => {
      speechTokenRef.current += 1;
      const isFinal = index + 1 >= total;
      busyRef.current = false;
      if (isFinal && mode === "garden") finish(correctCount);
      else if (isFinal) setArrivalReady(true);
      else {
        sortMotionRef.current = false;
        setSortMotion({ phase: "idle", bin: "", token: 0 });
        const next = index + 1;
        setTyped([]); // letters never leak into the next round
        setIndex(next);
        onCheckpoint?.(next, total);
      }
    }, delay);
  }

  function miss(setter, value, replayWord) {
    wrongsRef.current += 1;
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
    setIndex(0); scoreRef.current = 0; setScore(0); wrongsRef.current = 0; completionReportedRef.current = false; setCompleted(false); setStars(0);
    setTyped([]); setGrown([]); setPlanks(0); setSortMotion({ phase: "idle", bin: "", token: 0 });
    setArrivalReady(false); setResumeSteps(0);
    sortMotionRef.current = false;
    resultReadyRef.current = false;
    responseEvidenceRef.current = { firstResponses: [], assistedRetries: [] };
    responseAttemptsRef.current = new Map();
    onSessionStartRef.current?.();
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

  if (mode === "rescue") {
    const state = {
      index, planks, resumeSteps, currentSolvedSteps: Math.max(0, planks - resumeSteps), paused: enginePaused, arrivalReady, wrongWord,
      choose: (word, canReplay) => {
        if (busyRef.current) return;
        const round = rescue[index];
        if (!round) return;
        if (!responseEvidenceRef.current.firstResponses.some(item => item.round === index)) {
          recordFirstResponse({ game: "word-rescue", round: index, target: round.word, response: word, correct: word === round.word, practiceOnly: true, independent: false, supportUsed: [canReplay ? "spoken_target" : "printed_target"], audioDelivery: canReplay ? "requested" : "not_available", soundEnabled: isSoundEnabled });
        }
        if (word !== round.word) {
          responseAttemptsRef.current.set(index, (responseAttemptsRef.current.get(index) || 0) + 1);
          miss(setWrongWord, word, canReplay ? round.word : null);
          return;
        }
        busyRef.current = true;
        const attempts = responseAttemptsRef.current.get(index) || 0;
        if (attempts) recordAssistedRetry({ game: "word-rescue", round: index, target: round.word, attempts, supportUsed: [canReplay ? "target_replay" : "printed_target"] });
        if (isSoundEnabled) playPopSound();
        scoreRef.current += 20;
        setScore(scoreRef.current);
        setPlanks(p => p + 1);
        notifyResultReady(index + 1);
        advance(planks + 1);
      }
    };
    return <RescueStage rounds={rescue} state={{ ...state, finish: () => finish(total) }} isSoundEnabled={isSoundEnabled} />;
  }

  if (mode === "sort") {
    const state = {
      index, wrongBin, motion: sortMotion, paused: enginePaused, arrivalReady,
      sortItem: bin => {
        if (busyRef.current || sortMotionRef.current) return;
        const item = sort.items[index];
        if (!item) return;
        if (!responseEvidenceRef.current.firstResponses.some(entry => entry.round === index)) {
          recordFirstResponse({ game: "sound-sort-factory", round: index, target: item.word, response: bin, correct: bin === item.bin, practiceOnly: true, independent: false, supportUsed: ["printed_orthographic_grapheme"], audioDelivery: "not_measured", soundEnabled: isSoundEnabled });
        }
        if (bin !== item.bin) {
          responseAttemptsRef.current.set(index, (responseAttemptsRef.current.get(index) || 0) + 1);
          sortMotionRef.current = true;
          const token = sortMotion.token + 1;
          setSortMotion({ phase: "wrong-out", bin, token });
          miss(setWrongBin, bin);
          later(() => setSortMotion({ phase: "wrong-return", bin, token }), 280);
          later(() => { sortMotionRef.current = false; setSortMotion({ phase: "idle", bin: "", token: 0 }); }, 620);
          return;
        }
        busyRef.current = true;
        const attempts = responseAttemptsRef.current.get(index) || 0;
        if (attempts) recordAssistedRetry({ game: "sound-sort-factory", round: index, target: item.word, attempts, supportUsed: ["retry_same_item"] });
        if (isSoundEnabled) playCorrectChime();
        scoreRef.current += 15;
        setScore(scoreRef.current);
        sortMotionRef.current = true;
        setSortMotion({ phase: "correct", bin, token: sortMotion.token + 1 });
        notifyResultReady(index + 1);
        advance(index + 1, 700);
      }
    };
    return <SortStage sort={sort} state={{ ...state, finish: () => finish(total) }} isSoundEnabled={isSoundEnabled} />;
  }

  const state = {
    index, typed, grown, wrongLetter,
    hearWord: () => {
      const round = garden[index];
      speechTokenRef.current += 1;
      cancelSpeech();
      stopCueAudio();
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
      notifyResultReady(grown.length + 1);
      advance(grown.length + 1);
    }
  };
  return <GardenStage rounds={garden} state={state} isSoundEnabled={isSoundEnabled} />;
}

export default AdventureGame;
