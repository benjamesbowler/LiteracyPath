import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CVC_WORDS, SENTENCE_FIX, SENTENCES } from "../../../../data/learnGamesData";
import { cancelSpeech } from "../../../../utils/learnGamesAudio";
import { stopCueAudio } from "../../../../utils/audio/cuePlayer.js";
import { memoryBoards, sentencePractice, sightWordPool } from "../../../../utils/recognitionPractice.js";
import "../../../../styles/recognition-practice.css";
import { buildBlendMissions, buildCvcWorkshopRounds } from "../../../../utils/buildingGrowingRounds.js";
import { MatchGame, TargetGame, SentenceGame, FixGame } from "./RecognitionGameStages.jsx";
import { hasKnownBadWordAudio } from "../../../../data/knownBadWordAudio.js";
import { playCelebrationFanfare, playCorrectChime, playSoftBuzz } from "../../../../utils/audio/gameSfx";
import { ConfettiCelebration } from "../shared/ConfettiCelebration.jsx";
import { ProgressStars } from "../shared/ProgressStars.jsx";

import { BuildGame, FamilyGame } from "./PhonicsPlayConstruction.jsx";
import { loadLearnGamesProgress } from "../../../../utils/learnGamesProgress.js";
import { phonicsSessionKey, loadPhonicsSession, savePhonicsSession } from "./phonicsSession.js";
import { PlayHero } from "./PhonicsPlayShared.jsx";

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

function GameComplete({ title, stars, score, onRestart, onNextLevel }) {
  return (
    <div className="lg-game-complete">
      <ConfettiCelebration show={stars > 0} />
      <PlayHero className="kid-cheer" />
      <h2>{title} complete!</h2>
      <ProgressStars stars={stars} size="lg" />
      <p>{score} points</p>
      {stars > 0 && <p className="kid-coins-earned">+{stars * 7} coins for your Hollow!</p>}
      <div className="lg-completion-actions">
        {onNextLevel && <button type="button" className="lg-game-primary" onClick={onNextLevel}>Next level</button>}
        <button type="button" className="lg-game-primary" onClick={onRestart}>
          Replay level
        </button>
      </div>
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
  onRequestNextLevel,
  onRequestReplay,
  onCheckpoint,
  onEngineReady,
  isSoundEnabled = true,
  progressScopeKey = "default"
}) {
  const totalRounds = difficulty === "hard" ? 10 : difficulty === "medium" ? 8 : 6;
  const sentenceTier = difficulty === "hard" ? "level3" : difficulty === "medium" ? "level2" : "level1";
  const initialRoundCount = mode === "memory" ? (difficulty === "easy" ? 1 : 2) : mode === "sentence" ? Math.min(totalRounds, SENTENCES[sentenceTier].length - 1) : mode === "family" ? (difficulty === "hard" ? 6 : difficulty === "medium" ? 5 : 4) : totalRounds;

  const sessionKey = phonicsSessionKey(progressScopeKey, mode, difficulty);
  const [saved] = useState(() => {
    const gameId = { build: "cvc-word-builder", memory: "sight-word-memory", family: "blend-and-build", target: "pop-the-word", sentence: "word-hopscotch", quiz: "reading-race" }[mode];
    const checkpoint = loadLearnGamesProgress(progressScopeKey).games?.[gameId]?.checkpoints?.[difficulty];
    return checkpoint ? loadPhonicsSession(sessionKey, Number(startLevel) || 0) : null;
  });
  const stageSnapshotRef = useRef(saved?.stage || null);
  const saveStateRef = useRef(null);
  const [score, setScore] = useState(saved?.score || 0);
  // Honor the resume contract: startLevel is a 0-based round index from GamePlayer.
  const [round, setRound] = useState(() => Math.max(0, Math.min(Number(startLevel) || 0, initialRoundCount - 1)));
  const [correct, setCorrect] = useState(() => saved?.correct ?? (mode === "memory" ? round * (difficulty === "hard" ? 5 : 3) : round));
  const [completed, setCompleted] = useState(false);
  const [stars, setStars] = useState(0);
  const [version, setVersion] = useState(0);
  const [shaking, setShaking] = useState(false);
  // Streak: consecutive correct answers earn a growing bonus and a combo chip.
  const [streak, setStreak] = useState(saved?.streak || 0);
  // Ref mirrors so addScore/finish never read a stale render closure (StrictMode-safe:
  // no side effects inside state updaters, which StrictMode double-invokes).
  const scoreRef = useRef(saved?.score || 0);
  const streakRef = useRef(saved?.streak || 0);
  const wrongsRef = useRef(saved?.wrongs || 0);
  const completedRef = useRef(false);
  const resultReportedRef = useRef(null);
  const responseEvidenceRef = useRef(saved?.evidence || { firstResponses: [], assistedRetries: [] });
  // Pending timeouts live as {id, fn, remaining, startedAt} entries: cleared on
  // unmount so quitting can't fire finish/onComplete, and frozen by the engine
  // pause contract (GamePlayer pauses on tab-hide and while its quit dialog is
  // open) - pause stops timers and speech, resume re-arms what was left.
  const timersRef = useRef(new Set());
  const pausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [discoveries, setDiscoveries] = useState(saved?.discoveries || []);
  const discoveryIds = useRef(new Set((saved?.discoveries || []).map(item => item.id)));
  function addDiscovery(item) {
    if (discoveryIds.current.has(item.id)) return;
    discoveryIds.current.add(item.id);
    setDiscoveries(current => [...current, item]);
  }

  const gameState = useMemo(() => {
    if (version === 0 && saved) return saved.gameState;
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
  }, [difficulty, mode, totalRounds, version, saved]);

  useLayoutEffect(() => {
    saveStateRef.current = { gameState, round, score, correct, streak, wrongs: wrongsRef.current, evidence: responseEvidenceRef.current, discoveries, stage: stageSnapshotRef.current };
    if (!completedRef.current) savePhonicsSession(sessionKey, saveStateRef.current);
  }, [gameState, round, score, correct, streak, discoveries, sessionKey]);
  function saveStage(snapshot) {
    stageSnapshotRef.current = { round, data: snapshot };
    if (!completedRef.current && saveStateRef.current) savePhonicsSession(sessionKey, { ...saveStateRef.current, wrongs: wrongsRef.current, evidence: responseEvidenceRef.current, stage: stageSnapshotRef.current });
  }
  const resumeStage = version === 0 && saved?.stage?.round === round ? saved.stage.data : null;

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
    setIsPaused(true);
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
    setIsPaused(false);
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
    const checkpointTotal = mode === "memory" ? gameState.boards.length : mode === "family" ? gameState.total : mode === "sentence" ? gameState.sentences.length : mode === "quiz" ? gameState.fixes.length : totalRounds;
    onCheckpoint?.(round, checkpointTotal);
  }, [onCheckpoint, round, totalRounds, mode, gameState]);

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
    onProgressUpdate?.(correct, total || 1);
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
    savePhonicsSession(sessionKey, null);
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
    stageSnapshotRef.current = null;
    savePhonicsSession(sessionKey, null);
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
    discoveryIds.current.clear();
    setDiscoveries([]);
    responseEvidenceRef.current = { firstResponses: [], assistedRetries: [] };
  }

  if (completed) {
    return <GameComplete title={title} stars={stars} score={score} onRestart={onRequestReplay || restart} onNextLevel={onRequestNextLevel} />;
  }

  let stage;
  if (mode === "memory") {
    stage = (
      <MatchGame
        key={`memory-${version}`}
        round={round}
        setRound={setRound}
        state={gameState}
        paused={isPaused}
        resume={resumeStage}
        onSnapshot={saveStage}
        discovered={discoveries}
        onDiscover={addDiscovery}
        difficulty={difficulty}
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
        schedule={schedule}
        state={gameState}
        paused={isPaused}
        resume={resumeStage}
        onSnapshot={saveStage}
        discovered={discoveries}
        onDiscover={addDiscovery}
        difficulty={difficulty}
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
        paused={isPaused}
        resume={resumeStage}
        onSnapshot={saveStage}
        discovered={discoveries}
        onDiscover={addDiscovery}
        difficulty={difficulty}
        round={round}
        setRound={setRound}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
        resultReady={resultReady}
        isSoundEnabled={isSoundEnabled}
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
        paused={isPaused}
        resume={resumeStage}
        onSnapshot={saveStage}
        discovered={discoveries}
        onDiscover={addDiscovery}
        difficulty={difficulty}
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
        paused={isPaused}
        resume={resumeStage}
        onSnapshot={saveStage}
        discovered={discoveries}
        onDiscover={addDiscovery}
        difficulty={difficulty}
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
        paused={isPaused}
        resume={resumeStage}
        onSnapshot={saveStage}
        discovered={discoveries}
        onDiscover={addDiscovery}
        difficulty={difficulty}
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
      className={`lg-game-stage-shell pp-shell${shaking ? " pp-error" : ""}`}
      data-game-mode={mode}
    >
      {stage}
    </div>
  );
}

export default ArcadePracticeGame;
