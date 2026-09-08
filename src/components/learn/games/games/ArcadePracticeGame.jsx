import { useEffect, useMemo, useRef, useState } from "react";
import { CVC_WORDS, SENTENCE_FIX, SENTENCES } from "../../../../data/learnGamesData";
import { getChildWordAsset } from "../../../../data/childAssets";
import { cancelSpeech, hasRecordedSpeech, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio";
import { stopCueAudio } from "../../../../utils/audio/cuePlayer.js";
import { memoryBoards, sentencePractice, sightWordPool } from "../../../../utils/recognitionPractice.js";
import "../../../../styles/recognition-practice.css";
import { buildBlendMissions, buildCvcWorkshopRounds } from "../../../../utils/buildingGrowingRounds.js";
import { MatchGame, TargetGame, SentenceGame, FixGame } from "./RecognitionGameStages.jsx";
import { GameMeter } from "../shared/PracticeGameMeter.jsx";
import { segmentWord } from "../../../../utils/graphemeSegments.js";
import { hasKnownBadWordAudio } from "../../../../data/knownBadWordAudio.js";
import { playCelebrationFanfare, playCorrectChime, playSoftBuzz } from "../../../../utils/audio/gameSfx";
import { ConfettiCelebration } from "../shared/ConfettiCelebration.jsx";
import { IllustratedGameScene } from "../shared/IllustratedGameScene.jsx";
import { WorkshopObjectAction } from "../shared/WorkshopObjectAction.jsx";
import { ProgressStars } from "../shared/ProgressStars.jsx";

const DISTRACTOR_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

/* Each difficulty draws ONLY from its own tier so Hard never serves
   easy words. Easy = CVC (Level 1 sounds), Medium = digraphs and blends,
   Hard = clusters and longer words (Level 2 skills). */
function pickWords(difficulty, limit) {
  // Words with only defective recordings never become listen-and-tap targets.
  const pool = (CVC_WORDS[difficulty] || CVC_WORDS.easy).filter(word => !hasKnownBadWordAudio(word));
  return shuffle(pool).slice(0, limit);
}


function starScore(correct, total, wrongs) {
  if (correct >= total && wrongs === 0) return 3;
  if (correct >= Math.ceil(total * 0.7)) return 2;
  return correct > 0 ? 1 : 0;
}

function GameComplete({ title, stars, score, onRestart }) {
  return (
    <div className="lg-game-complete">
      <ConfettiCelebration show={stars > 0} />
      <img className="kid-cheer" src="/images/learn-games/phinny-cheering.webp" alt="" onError={event => { event.currentTarget.style.display = "none"; }} />
      <h2>{title} complete!</h2>
      <ProgressStars stars={stars} size="lg" />
      <p>{score} points</p>
      {stars > 0 && <p className="kid-coins-earned">+{stars * 7} coins for your Hollow!</p>}
      <button type="button" className="lg-game-primary" onClick={onRestart}>
        Play again
      </button>
    </div>
  );
}

function WordImageCard({ word, secret = false, label = "" }) {
  const [failedImageWord, setFailedImageWord] = useState("");
  const asset = getChildWordAsset(word, { allowBlockedAssessmentImage: true });
  const src = asset?.image || asset?.fallbackImage || "";
  const imageFailed = failedImageWord === word;

  if (!src || imageFailed) {
    // In spelling games the text fallback would give the answer away.
    if (secret) return null;
    return (
      <div className="lg-game-picture lg-game-picture-text" aria-label={`Word card for ${word}`}>
        <span>{word}</span>
      </div>
    );
  }

  return (
    <div className="lg-game-picture">
      <img
        src={src}
        alt={secret ? "" : label || asset?.alt || `Picture for ${word}`}
        loading="lazy"
        decoding="async"
        width="240"
        height="240"
        onError={() => setFailedImageWord(word)}
      />
    </div>
  );
}

export function ArcadePracticeGame({
  title,
  mode,
  difficulty = "easy",
  startLevel = 0,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onResultReady,
  onSessionStart,
  onCheckpoint,
  onEngineReady,
  isSoundEnabled = true
}) {
  const totalRounds = difficulty === "hard" ? 10 : difficulty === "medium" ? 8 : 6;
  const sentenceTier = difficulty === "hard" ? "level3" : difficulty === "medium" ? "level2" : "level1";
  const initialRoundCount = mode === "sentence" ? Math.min(totalRounds, SENTENCES[sentenceTier].length - 1) : mode === "family" ? (difficulty === "hard" ? 6 : difficulty === "medium" ? 5 : 4) : totalRounds;

  const [score, setScore] = useState(0);
  // Honor the resume contract: startLevel is a 0-based round index from GamePlayer.
  const [round, setRound] = useState(() => Math.max(0, Math.min(Number(startLevel) || 0, initialRoundCount - 1)));
  const [correct, setCorrect] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [stars, setStars] = useState(0);
  const [version, setVersion] = useState(0);
  const [shaking, setShaking] = useState(false);
  // Streak: consecutive correct answers earn a growing bonus and a combo chip.
  const [streak, setStreak] = useState(0);
  // Ref mirrors so addScore/finish never read a stale render closure (StrictMode-safe:
  // no side effects inside state updaters, which StrictMode double-invokes).
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const wrongsRef = useRef(0);
  const completedRef = useRef(false);
  const resultReportedRef = useRef(null);
  const responseEvidenceRef = useRef({ firstResponses: [], assistedRetries: [] });
  // Pending timeouts live as {id, fn, remaining, startedAt} entries: cleared on
  // unmount so quitting can't fire finish/onComplete, and frozen by the engine
  // pause contract (GamePlayer pauses on tab-hide and while its quit dialog is
  // open) - pause stops timers and speech, resume re-arms what was left.
  const timersRef = useRef(new Set());
  const pausedRef = useRef(false);

  const gameState = useMemo(() => {
    // Restart increments version purely to re-roll random word/order choices.
    const withReroll = value => ({ ...value, rerollKey: version });

    if (mode === "memory") return withReroll(memoryBoards(difficulty));

    if (mode === "family") {
      const missions = buildBlendMissions(difficulty);
      return withReroll({ missions, total: missions.length });
    }

    if (mode === "sentence") return withReroll(sentencePractice(difficulty, totalRounds));

    if (mode === "quiz") {
      const source = SENTENCE_FIX[difficulty] || SENTENCE_FIX.easy;
      return withReroll({ fixes: shuffle(source).slice(0, totalRounds) });
    }

    if (mode === "target") {
      const pool = sightWordPool(difficulty);
      return withReroll({ pool, words: shuffle(pool).slice(0, totalRounds) });
    }

    if (mode === "build") {
      return withReroll({ rounds: buildCvcWorkshopRounds(difficulty, totalRounds) });
    }

    return withReroll({ words: pickWords(difficulty, totalRounds) });
  }, [difficulty, mode, totalRounds, version]);

  useEffect(() => () => {
    cancelSpeech();
    timersRef.current.forEach(entry => clearTimeout(entry.id));
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!isSoundEnabled) cancelSpeech();
  }, [isSoundEnabled]);

  function armTimer(entry) {
    entry.startedAt = Date.now();
    entry.id = setTimeout(() => {
      timersRef.current.delete(entry);
      entry.fn();
    }, entry.remaining);
  }

  function schedule(fn, ms) {
    const entry = { id: 0, fn, remaining: ms, startedAt: 0 };
    timersRef.current.add(entry);
    if (!pausedRef.current) armTimer(entry);
    return entry.id;
  }

  function pauseEngine() {
    if (pausedRef.current) return;
    pausedRef.current = true;
    cancelSpeech();
    stopCueAudio();
    const now = Date.now();
    timersRef.current.forEach(entry => {
      clearTimeout(entry.id);
      entry.remaining = Math.max(0, entry.remaining - (now - entry.startedAt));
    });
  }

  function resumeEngine() {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    timersRef.current.forEach(entry => armTimer(entry));
  }

  // GamePlayer chrome pauses the engine on tab-hide and while its quit dialog
  // is open. Callbacks only touch refs, so register once.
  useEffect(() => {
    onEngineReady?.({ pause: pauseEngine, resume: resumeEngine });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine callbacks only touch refs, register once
  }, []);

  useEffect(() => {
    onScoreUpdate?.(score);
  }, [onScoreUpdate, score]);

  useEffect(() => {
    onCheckpoint?.(round, totalRounds);
  }, [onCheckpoint, round, totalRounds]);

  useEffect(() => {
    const total = mode === "memory"
      ? gameState.cards.length / 2
      : mode === "family"
        ? gameState.total
        : mode === "sentence"
          ? gameState.sentences.length
        : mode === "quiz"
          ? gameState.fixes?.length
          : totalRounds;
    onProgressUpdate?.(mode === "memory" || mode === "family" ? correct : round + 1, total || 1);
  }, [correct, gameState.cards, gameState.fixes?.length, gameState.sentences?.length, gameState.total, mode, onProgressUpdate, round, totalRounds]);

  function addScore(amount, sfx = playCorrectChime) {
    if (completedRef.current) return;
    // Streak bonus: +2 per answer already in the run, capped so scores stay sane.
    const bonus = Math.min(10, streakRef.current * 2);
    streakRef.current += 1;
    scoreRef.current += amount + bonus;
    setStreak(streakRef.current);
    setScore(scoreRef.current);
    if (isSoundEnabled) sfx();
  }

  function miss() {
    if (completedRef.current) return;
    streakRef.current = 0;
    wrongsRef.current += 1;
    setStreak(0);
    setShaking(true);
    // Clear on a timer, not animationend: under prefers-reduced-motion the
    // shake animation never runs, so animationend never fires and the state
    // (and its static red ring) would stick forever.
    schedule(() => setShaking(false), 420);
    if (isSoundEnabled) playSoftBuzz();
  }

  function resultReady(nextCorrect = correct) {
    if (resultReportedRef.current) return resultReportedRef.current;
    const total = mode === "memory" ? gameState.cards.length / 2 : mode === "family" ? gameState.total : mode === "sentence" ? gameState.sentences.length : mode === "quiz" ? gameState.fixes.length : totalRounds;
    const result = [starScore(nextCorrect, total, wrongsRef.current), scoreRef.current, nextCorrect, responseEvidenceRef.current];
    resultReportedRef.current = result;
    onResultReady?.(...result);
    return result;
  }

  function finish(nextCorrect = correct) {
    if (completedRef.current) return;
    completedRef.current = true;
    const result = resultReady(nextCorrect);
    setStars(result[0]);
    setCompleted(true);
    if (isSoundEnabled) playCelebrationFanfare();
    onComplete?.(...result);
  }

  function recordFirstResponse(response) {
    if (!response || responseEvidenceRef.current.firstResponses.some(item => item.round === response.round)) return;
    responseEvidenceRef.current.firstResponses.push(Object.freeze({ ...response, ...(response.supportUsed ? { supportUsed: Object.freeze([...response.supportUsed]) } : {}) }));
  }

  function recordAssistedRetry(retry) {
    if (!retry) return;
    responseEvidenceRef.current.assistedRetries.push(Object.freeze({ ...retry, practiceOnly: true, independent: false, audioDelivery: "not_measured", supportUsed: Object.freeze([...(retry.supportUsed || [])]) }));
  }

  function restart() {
    onSessionStart?.();
    resultReportedRef.current = null;
    completedRef.current = false;
    scoreRef.current = 0;
    streakRef.current = 0;
    wrongsRef.current = 0;
    setScore(0);
    setStreak(0);
    setRound(0);
    setCorrect(0);
    setCompleted(false);
    setStars(0);
    setVersion(current => current + 1);
    responseEvidenceRef.current = { firstResponses: [], assistedRetries: [] };
  }

  if (completed) {
    return <GameComplete title={title} stars={stars} score={score} onRestart={restart} />;
  }

  let stage;
  if (mode === "memory") {
    stage = (
      <MatchGame
        key={`memory-${version}`}
        state={gameState}
        isSoundEnabled={isSoundEnabled}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
        resultReady={resultReady}
        schedule={schedule}
        recordFirstResponse={recordFirstResponse}
        recordAssistedRetry={recordAssistedRetry}
      />
    );
  } else if (mode === "family") {
    stage = (
      <FamilyGame
        key={`family-${version}-${round}`}
        state={gameState}
        round={round}
        setRound={setRound}
        isSoundEnabled={isSoundEnabled}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
        resultReady={resultReady}
        recordFirstResponse={recordFirstResponse}
        recordAssistedRetry={recordAssistedRetry}
      />
    );
  } else if (mode === "sentence") {
    stage = (
      <SentenceGame
        key={`s-${version}-${round}`}
        state={gameState}
        round={round}
        setRound={setRound}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
        resultReady={resultReady}
        isSoundEnabled={isSoundEnabled}
        difficulty={difficulty}
        schedule={schedule}
        recordFirstResponse={recordFirstResponse}
        recordAssistedRetry={recordAssistedRetry}
      />
    );
  } else if (mode === "quiz") {
    stage = (
      <FixGame
        key={`f-${version}-${round}`}
        state={gameState}
        round={round}
        setRound={setRound}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
        resultReady={resultReady}
        isSoundEnabled={isSoundEnabled}
        totalRounds={totalRounds}
        schedule={schedule}
        recordFirstResponse={recordFirstResponse}
        recordAssistedRetry={recordAssistedRetry}
      />
    );
  } else if (mode === "target") {
    stage = (
      <TargetGame
        key={`target-${version}-${round}`}
        state={gameState}
        round={round}
        setRound={setRound}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
        resultReady={resultReady}
        isSoundEnabled={isSoundEnabled}
        totalRounds={totalRounds}
        schedule={schedule}
        recordFirstResponse={recordFirstResponse}
        recordAssistedRetry={recordAssistedRetry}
      />
    );
  } else {
    stage = (
      <BuildGame
        key={`b-${version}-${round}`}
        state={gameState}
        round={round}
        setRound={setRound}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
        resultReady={resultReady}
        isSoundEnabled={isSoundEnabled}
        totalRounds={totalRounds}
        schedule={schedule}
        recordFirstResponse={recordFirstResponse}
        recordAssistedRetry={recordAssistedRetry}
      />
    );
  }

  return (
    <div
      className={`lg-game-stage-shell lg-illustrated-practice${shaking ? " lg-shake" : ""}`}
      data-game-mode={mode}
    >
      {streak >= 2 && (
        <div className="kid-combo" data-level={streak >= 4 ? "hot" : "warm"} key={streak} aria-live="polite">
          Combo {streak} in a row
        </div>
      )}
      {stage}
    </div>
  );
}

function BuildGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, resultReady, isSoundEnabled, totalRounds, schedule, recordFirstResponse, recordAssistedRetry }) {
  const target = state.rounds[round] || state.rounds[0];
  const targetWord = target?.word || "cat";
  const targetUnits = target?.units || segmentWord(targetWord).map((grapheme, index) => ({ id: `${targetWord}-${index}`, grapheme, index }));
  const canHearTarget = isSoundEnabled && hasRecordedSpeech(targetWord);
  const [placed, setPlaced] = useState([]);
  const [phase, setPhase] = useState("build");
  const [attempts, setAttempts] = useState(0);
  const [wrongIndex, setWrongIndex] = useState(-1);
  const [attempted, setAttempted] = useState(null);
  const [comparison, setComparison] = useState(null);
  const liveRoundRef = useRef(round);
  const liveTargetRef = useRef(targetWord);
  const answerLockedRef = useRef(false);
  const compareTokenRef = useRef(0);
  const inputRevisionRef = useRef(0);
  const firstResponseRecordedRef = useRef(false);
  const letters = useMemo(() => {
    const distractors = shuffle(DISTRACTOR_LETTERS.filter(letter => !targetWord.includes(letter))).slice(0, 3);
    return shuffle([...targetUnits, ...distractors.map((grapheme, index) => ({
      id: `${target.id}-distractor-${index}`,
      grapheme,
      distractor: true
    }))]);
  }, [target, targetUnits, targetWord]);

  useEffect(() => {
    liveRoundRef.current = round;
    liveTargetRef.current = targetWord;
    answerLockedRef.current = false;
    firstResponseRecordedRef.current = false;
    compareTokenRef.current += 1;
    return () => {
      compareTokenRef.current += 1;
      cancelSpeech();
    };
  }, [round, targetWord]);

  useEffect(() => {
    compareTokenRef.current += 1;
    let current = true;
    queueMicrotask(() => { if (current) setComparison(null); });
    if (canHearTarget) speakWord(targetWord);
    else cancelSpeech();
    return () => { current = false; };
  }, [canHearTarget, targetWord]);

  const usedTileIds = new Set(placed.map(item => item.tileId));

  function placeTile(tile) {
    if (answerLockedRef.current || phase !== "build" || usedTileIds.has(tile.id) || placed.length >= targetUnits.length) return;
    compareTokenRef.current += 1;
    const inputRevision = ++inputRevisionRef.current;
    setWrongIndex(-1);
    setAttempted(null);
    setComparison(null);
    if (isSoundEnabled) void speakPhoneme(tile.phoneme || tile.grapheme);
    const next = [...placed, { grapheme: tile.grapheme, phoneme: tile.phoneme || tile.grapheme, tileId: tile.id }];
    setPlaced(next);
    if (next.length !== targetUnits.length) return;

    const builtWord = next.map(item => item.grapheme).join("");
    if (!firstResponseRecordedRef.current) {
      firstResponseRecordedRef.current = true;
      recordFirstResponse({ game: "building-workshop", round, target: targetWord, response: builtWord, correct: builtWord === targetWord, practiceOnly: true, independent: false, supportUsed: ["picture_cue", "spelling_tiles", ...(attempts >= 2 ? ["printed_word_hint"] : [])], audioDelivery: "not_measured", soundEnabled: isSoundEnabled });
    }
    if (builtWord === targetWord) {
      answerLockedRef.current = true;
      addScore(25);
      if (attempts > 0) recordAssistedRetry({ game: "building-workshop", round, target: targetWord, attempts, supportUsed: ["specific_sound_feedback", "preserved_prefix"] });
      const nextCorrect = correct + 1;
      setPhase("blending");
      setCorrect(nextCorrect);
      return;
    }

    const mismatch = targetUnits.findIndex((unit, index) => unit.grapheme !== next[index]?.grapheme);
    miss();
    setAttempts(value => value + 1);
    setWrongIndex(mismatch);
    setAttempted({ index: mismatch, grapheme: next[mismatch]?.grapheme || "", phoneme: next[mismatch]?.phoneme || next[mismatch]?.grapheme || "" });
    const scheduledRound = round;
    schedule(() => {
      if (scheduledRound !== liveRoundRef.current || inputRevision !== inputRevisionRef.current) return;
      setPlaced(current => current.slice(0, Math.max(0, mismatch)));
      setWrongIndex(mismatch);
    }, 520);
  }

  function blendWord() {
    if (phase !== "blending") return;
    compareTokenRef.current += 1;
    if (isSoundEnabled) void speakWord(targetWord);
    setPhase("reveal");
  }

  function useObject() {
    if (phase !== "reveal") return;
    setPhase("used");
    if (round + 1 >= totalRounds) resultReady(correct);
  }

  function continueBuild() {
    if (phase !== "used" || round !== liveRoundRef.current || targetWord !== liveTargetRef.current) return;
    compareTokenRef.current += 1;
    if (round + 1 >= totalRounds) finish(correct);
    else setRound(round + 1);
  }

  function removeAt(slotIndex) {
    if (phase !== "build" || slotIndex >= placed.length) return;
    compareTokenRef.current += 1;
    inputRevisionRef.current += 1;
    setWrongIndex(-1);
    setAttempted(null);
    setComparison(null);
    setPlaced(current => current.slice(0, slotIndex));
  }

  function compareSounds() {
    if (!attempted || !isSoundEnabled) return;
    const token = ++compareTokenRef.current;
    const right = targetUnits[attempted.index]?.phoneme || targetUnits[attempted.index]?.grapheme;
    setComparison({ attempted: attempted.phoneme || attempted.grapheme, right, token });
    void speakPhoneme(attempted.phoneme || attempted.grapheme);
  }

  function hearComparisonTarget() {
    if (!comparison || comparison.token !== compareTokenRef.current || phase !== "build") return;
    compareTokenRef.current += 1;
    setComparison(null);
    if (comparison.right) void speakPhoneme(comparison.right);
  }

  function hearTarget() {
    compareTokenRef.current += 1;
    setComparison(null);
    if (canHearTarget) speakWord(targetWord);
  }

  return (
    <IllustratedGameScene mode="build" stageClassName={`lg-game-build lg-build-phase-${phase}`}>
      <p>{canHearTarget ? "Build the word for the picture. Listen, then tap each sound." : "Build the word for the picture."}</p>
      <div className="lg-workshop-scene" aria-hidden="true">
        <span className="lg-workshop-lamp" />
        <span className="lg-workshop-shelf" />
        <span className={`lg-workshop-blueprint ${phase === "blending" ? "active" : ""}`} />
        <span className="lg-workshop-bench" />
      </div>
      {canHearTarget && <button type="button" className="lg-game-audio" onClick={hearTarget}><span aria-hidden="true">♪</span> Hear word</button>}
      <WordImageCard word={targetWord} label={target.label} />
      {attempts >= 2 && <div className="lg-game-picture lg-game-picture-text" aria-label={`Hint: the word is ${targetWord}`}><span>{targetWord}</span></div>}
      {phase === "build" && <div className="lg-build-label">Place the sounds in order</div>}
      {phase === "blending" && <div className="lg-build-state" role="status"><strong>Blend it</strong><span>{placed.map(item => item.grapheme).join(" ")}</span><button type="button" className="lg-build-blend" onClick={blendWord}>Blend {targetWord}</button></div>}
      {["reveal", "used"].includes(phase) && <div className="lg-build-reveal lg-build-object-result" data-object-action={targetWord} role="status">
        <strong>{phase === "used" ? targetWord : `You built ${targetWord}!`}</strong>
        <WorkshopObjectAction key={target.id} target={target} active={phase === "used"} />
        <span>{phase === "used" ? target.useResult : `Try it in the ${target.destination}.`}</span>
        {phase === "reveal"
          ? <button type="button" className="lg-build-use" onClick={useObject}>Use object</button>
          : <button type="button" className="lg-build-continue" onClick={continueBuild}>{round + 1 >= totalRounds ? "Finish" : "Next build"}</button>}
      </div>}
      <div className="lg-game-slots lg-workshop-slots" aria-label="Word letters. Tap a filled box to undo from that point.">
        {targetUnits.map((unit, index) => placed[index] ? (
          <button key={unit.id} type="button" className={`filled${wrongIndex === index ? " wrong" : ""}`} aria-label={`Undo sound ${placed[index].grapheme}`} onClick={() => removeAt(index)} disabled={phase !== "build"}>{placed[index].grapheme}</button>
          ) : <span key={unit.id} className={wrongIndex === index ? "wrong" : ""} />)}
      </div>
      {wrongIndex >= 0 && <div className="lg-build-feedback" role="status"><strong>Check that sound.</strong> The <b>{attempted?.grapheme || "sound"}</b> sound needs repair.</div>}
      {attempted && <button type="button" className="lg-build-compare" onClick={compareSounds} disabled={!isSoundEnabled}>Compare sounds</button>}
      {comparison && <div className="lg-build-comparison" role="status"><span>First, you placed <b>{comparison.attempted}</b>.</span><button type="button" onClick={hearComparisonTarget} disabled={!isSoundEnabled}>Hear target sound</button></div>}
      <div className="lg-game-letter-bank lg-workshop-bank" aria-label="Sound tiles">
        {letters.map(tile => <button key={tile.id} type="button" data-tile-id={tile.id} disabled={phase !== "build" || usedTileIds.has(tile.id)} className={usedTileIds.has(tile.id) ? "used" : ""} onClick={() => placeTile(tile)}>{tile.grapheme}</button>)}
      </div>
      <GameMeter current={round + 1} total={totalRounds} />
    </IllustratedGameScene>
  );
}

function FamilyGame({ state, round, setRound, isSoundEnabled, correct, setCorrect, addScore, miss, finish, resultReady, recordFirstResponse, recordAssistedRetry }) {
  const mission = state.missions[round] || state.missions[0];
  const targetWord = mission?.word || "cat";
  const canHearTarget = isSoundEnabled && hasRecordedSpeech(targetWord);
  const [phase, setPhase] = useState("build");
  const [wrongOnset, setWrongOnset] = useState("");
  const [reuseOpen, setReuseOpen] = useState(false);
  const [reuseOnset, setReuseOnset] = useState("");
  const [reuseBuilt, setReuseBuilt] = useState("");
  const resolvedRef = useRef(false);
  const firstResponseRecordedRef = useRef(false);
  const responseAttemptsRef = useRef(0);
  const speechTokenRef = useRef(0);
  const soundEnabledRef = useRef(isSoundEnabled);
  const targetOnset = mission?.onset || targetWord[0];
  const options = useMemo(() => shuffle([targetOnset, ...shuffle((mission?.familyWords || []).filter(word => word !== targetWord).map(word => word.slice(0, word.length - (mission?.familyId?.length - 1 || 2)))).slice(0, 2)]), [mission, targetWord, targetOnset]);
  const reuseOptions = useMemo(() => (mission?.familyWords || [])
    .filter(word => word !== targetWord)
    .map(word => ({ word, onset: word.slice(0, word.length - (mission?.familyId?.length - 1 || 2)) }))
    .filter((item, index, items) => items.findIndex(candidate => candidate.onset === item.onset) === index)
    .slice(0, 3), [mission, targetWord]);

  useEffect(() => {
    soundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  useEffect(() => {
    resolvedRef.current = false;
    firstResponseRecordedRef.current = false;
    responseAttemptsRef.current = 0;
    speechTokenRef.current += 1;
    if (soundEnabledRef.current && hasRecordedSpeech(targetWord)) speakWord(targetWord);
    return () => {
      speechTokenRef.current += 1;
      cancelSpeech();
    };
  }, [round, targetWord]);

  useEffect(() => {
    speechTokenRef.current += 1;
    if (!isSoundEnabled) cancelSpeech();
  }, [isSoundEnabled]);

  function choose(onset) {
    if (phase !== "build" || resolvedRef.current) return;
    if (!firstResponseRecordedRef.current) {
      firstResponseRecordedRef.current = true;
      recordFirstResponse({ game: "blend-family", round, target: targetWord, response: onset, correct: onset === targetOnset, practiceOnly: true, independent: false, supportUsed: ["printed_target", "visible_rime"], audioDelivery: "not_measured", soundEnabled: isSoundEnabled });
    }
    if (onset !== targetOnset) {
      setWrongOnset(onset);
      responseAttemptsRef.current += 1;
      miss();
      return;
    }
    resolvedRef.current = true;
    setWrongOnset("");
    setPhase("reveal");
    if (responseAttemptsRef.current > 0) recordAssistedRetry({ game: "blend-family", round, target: targetWord, attempts: responseAttemptsRef.current, supportUsed: ["rime_reveal", "specific_onset_feedback"] });
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    addScore(18);
  }

  function chooseReuseOnset(onset) {
    if (phase !== "reveal" || reuseBuilt) return;
    setReuseOnset(onset);
  }

  function buildReuseWord() {
    if (phase !== "reveal" || !reuseOnset || reuseBuilt) return;
    const item = reuseOptions.find(option => option.onset === reuseOnset);
    if (!item) return;
    setReuseBuilt(item.word);
    if (round + 1 >= state.total) resultReady(correct);
    if (isSoundEnabled && hasRecordedSpeech(item.word)) void speakWord(item.word);
  }

  function continueFamily() {
    if (!reuseBuilt) return;
    speechTokenRef.current += 1;
    if (round + 1 >= state.total) finish(correct);
    else setRound(round + 1);
  }

  return (
    <IllustratedGameScene mode="family" stageClassName="lg-blend-stage">
      <p>{phase === "build" ? "Build the named word: join the first sound to the rime." : `Built ${targetWord}. Reuse the rime in another word.`}</p>
      <div className="lg-blend-scene" aria-hidden="true"><span className="lg-blend-track" /><span className="lg-blend-object" /></div>
      {canHearTarget && phase === "build" && <button type="button" className="lg-game-audio" onClick={() => speakWord(targetWord)}><span aria-hidden="true">♪</span> Hear target</button>}
      <div className="lg-blend-target"><WordImageCard word={targetWord} label={mission?.label} /><div><span className="lg-blend-kicker">Target object</span><strong>{targetWord}</strong></div></div>
      <div className="lg-family-board" data-family={mission?.familyId}>
        <div className="lg-game-letter-bank" aria-label="Onset choices">
          {options.map(onset => <button key={onset} type="button" disabled={phase !== "build"} className={wrongOnset === onset ? "wrong" : ""} onClick={() => choose(onset)}>{onset}</button>)}
        </div>
        <div className="lg-blend-joiner" aria-hidden="true">+</div>
        <div className="lg-rime-tile" aria-label={`Rime -${mission?.rime || "at"}`}>-{mission?.rime || "at"}</div>
      </div>
      {wrongOnset && <div className="lg-game-feedback" role="status">Try the onset that makes the named target.</div>}
      {phase === "reveal" && <div className="lg-blend-reveal" role="status"><strong>{targetWord}</strong><span>Object built! Listen for the whole word, then reuse -{mission.rime}.</span><button type="button" className="lg-blend-reuse" onClick={() => setReuseOpen(true)} disabled={reuseOpen || Boolean(reuseBuilt)}>Reuse -{mission.rime}</button>{reuseOpen && <div className="lg-blend-reuse-builder"><span className="lg-blend-reuse-kicker">Choose an onset</span><div className="lg-blend-reuse-onsets">{reuseOptions.map(option => <button key={option.word} type="button" disabled={Boolean(reuseBuilt)} className={reuseOnset === option.onset ? "selected" : ""} aria-label={`Use ${option.onset} with -${mission.rime} to build ${option.word}`} onClick={() => chooseReuseOnset(option.onset)}>{option.onset}</button>)}</div>{reuseOnset && <button type="button" className="lg-blend-reuse-rime" onClick={buildReuseWord} disabled={Boolean(reuseBuilt)} aria-label={`Join ${reuseOnset} and -${mission.rime}`}>{reuseBuilt || `-${mission.rime}`}</button>}</div>}<div className="lg-blend-reuse-list">{reuseBuilt && <><span>{reuseOnset}{mission.rime} = {reuseBuilt}</span><button type="button" className="lg-blend-continue" onClick={continueFamily}>Continue</button></>}</div></div>}
      <GameMeter current={correct} total={state.total} />
    </IllustratedGameScene>
  );
}

export default ArcadePracticeGame;
