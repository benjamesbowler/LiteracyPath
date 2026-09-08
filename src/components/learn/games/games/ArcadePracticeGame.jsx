import { useEffect, useMemo, useRef, useState } from "react";
import { CVC_WORDS, SENTENCE_FIX, SENTENCES, SIGHT_WORDS } from "../../../../data/learnGamesData";
import { getChildWordAsset } from "../../../../data/childAssets";
import { cancelSpeech, hasRecordedSpeech, speak, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio";
import { buildBlendMissions, buildCvcWorkshopRounds } from "../../../../utils/buildingGrowingRounds.js";
import { completeRepairDisplay } from "../../../../utils/repairSentence.js";
import { segmentWord } from "../../../../utils/graphemeSegments.js";
import { hasKnownBadWordAudio } from "../../../../data/knownBadWordAudio.js";
import { playCelebrationFanfare, playCorrectChime, playPopSound, playSoftBuzz } from "../../../../utils/audio/gameSfx";
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

function pickSightWords(difficulty, limit) {
  const pool = [...new Set((difficulty === "hard"
    ? SIGHT_WORDS.level3
    : difficulty === "medium"
      ? SIGHT_WORDS.level2
      : SIGHT_WORDS.level1))].filter(word => !hasKnownBadWordAudio(word));
  return shuffle(pool).slice(0, limit);
}

function starScore(correct, total, wrongs) {
  if (correct >= total && wrongs === 0) return 3;
  if (correct >= Math.ceil(total * 0.7)) return 2;
  return correct > 0 ? 1 : 0;
}

function acceptedAnswers(item) {
  return Array.isArray(item?.acceptedAnswers) && item.acceptedAnswers.length
    ? item.acceptedAnswers
    : [item?.answer];
}

function isAcceptedAnswer(item, answer) {
  return acceptedAnswers(item).includes(answer);
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
  onCheckpoint,
  onEngineReady,
  isSoundEnabled = true
}) {
  const totalRounds = difficulty === "hard" ? 10 : difficulty === "medium" ? 8 : 6;
  const initialRoundCount = mode === "family" ? (difficulty === "hard" ? 6 : difficulty === "medium" ? 5 : 4) : totalRounds;

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

    if (mode === "memory") {
      const pairCount = difficulty === "hard" ? 10 : difficulty === "medium" ? 6 : 3;
      const words = pickSightWords(difficulty, pairCount);
      const cards = words.flatMap((word, pairIndex) => [
        { id: `pair-${pairIndex}-a`, pairId: `pair-${pairIndex}`, word },
        { id: `pair-${pairIndex}-b`, pairId: `pair-${pairIndex}`, word }
      ]);
      return withReroll({ cards: shuffle(cards) });
    }

    if (mode === "family") {
      const missions = buildBlendMissions(difficulty);
      return withReroll({ missions, total: missions.length });
    }

    if (mode === "sentence") {
      const source = difficulty === "hard" ? [...SENTENCES.level1, ...SENTENCES.level2, ...SENTENCES.level3] : difficulty === "medium" ? [...SENTENCES.level1, ...SENTENCES.level2] : SENTENCES.level1;
      return withReroll({ sentences: shuffle(source).slice(0, totalRounds) });
    }

    if (mode === "quiz") {
      const source = SENTENCE_FIX[difficulty] || SENTENCE_FIX.easy;
      return withReroll({ fixes: shuffle(source).slice(0, totalRounds) });
    }

    if (mode === "target") {
      const words = mode === "target" ? pickSightWords(difficulty, totalRounds + 12) : pickWords(difficulty, totalRounds + 12);
      return withReroll({ words });
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
        : mode === "quiz"
          ? gameState.fixes?.length
          : totalRounds;
    onProgressUpdate?.(mode === "memory" || mode === "family" ? correct : round + 1, total || 1);
  }, [correct, gameState.cards, gameState.fixes?.length, gameState.total, mode, onProgressUpdate, round, totalRounds]);

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

  function finish(nextCorrect = correct) {
    if (completedRef.current) return;
    completedRef.current = true;
    // Memory's max correct is the pair count, not totalRounds — grade against pairs.
    const total = mode === "memory" ? gameState.cards.length / 2 : mode === "family" ? gameState.total : totalRounds;
    const nextStars = starScore(nextCorrect, total, wrongsRef.current);
    setStars(nextStars);
    setCompleted(true);
    if (isSoundEnabled) playCelebrationFanfare();
    onComplete?.(nextStars, scoreRef.current, nextCorrect, responseEvidenceRef.current);
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
        schedule={schedule}
        recordFirstResponse={recordFirstResponse}
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
        isSoundEnabled={isSoundEnabled}
        totalRounds={totalRounds}
        schedule={schedule}
        recordFirstResponse={recordFirstResponse}
      />
    );
  } else if (mode === "target") {
    stage = (
      <TargetGame
        state={gameState}
        round={round}
        setRound={setRound}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
        isSoundEnabled={isSoundEnabled}
        totalRounds={totalRounds}
        schedule={schedule}
        recordFirstResponse={recordFirstResponse}
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

function BuildGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds, schedule, recordFirstResponse, recordAssistedRetry }) {
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

function MatchGame({ state, isSoundEnabled, correct, setCorrect, addScore, miss, finish, schedule, recordFirstResponse }) {
  const [selected, setSelected] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const selectedRef = useRef([]);
  const matchedIdsRef = useRef(new Set());
  const cards = state.cards;
  const targetMatches = cards.length / 2;

  function choose(card) {
    // Two cards already face-up (pending flip-back): ignore further taps so an
    // extra click during the animation can't score a second penalty.
    if (selectedRef.current.length >= 2 || matchedIdsRef.current.has(card.id) || selectedRef.current.some(item => item.id === card.id)) return;
    if (isSoundEnabled) speakWord(card.word);
    const nextSelected = [...selectedRef.current, card];
    selectedRef.current = nextSelected;
    setSelected(nextSelected);

    if (nextSelected.length < 2) return;

    if (nextSelected[0].pairId === nextSelected[1].pairId) {
      const nextCorrect = correct + 1;
      recordFirstResponse?.({ game: "sight-word-memory", round: nextSelected[0].pairId, target: nextSelected[0].word, response: nextSelected[1].word, correct: true, practiceOnly: true, independent: false, supportUsed: ["spatial_pairing"], audioDelivery: "not_measured", soundEnabled: isSoundEnabled });
      setCorrect(nextCorrect);
      addScore(12);
      matchedIdsRef.current.add(nextSelected[0].id);
      matchedIdsRef.current.add(nextSelected[1].id);
      setMatchedIds([...matchedIdsRef.current]);
      selectedRef.current = [];
      setSelected([]);
      if (nextCorrect >= targetMatches) {
        schedule(() => finish(nextCorrect), 400);
      }
    } else {
      recordFirstResponse?.({
        game: "sight-word-memory",
        round: nextSelected[0].pairId,
        target: nextSelected[0].word,
        response: nextSelected[1].word,
        correct: false,
        practiceOnly: true,
        independent: false,
        supportUsed: ["spatial_pairing"],
        audioDelivery: "not_measured",
        soundEnabled: isSoundEnabled
      });
      miss();
      schedule(() => {
        selectedRef.current = [];
        setSelected([]);
      }, 650);
    }
  }

  return (
    <IllustratedGameScene mode="memory">
      <p>Find the matching sight words.</p>
      <div className="lg-card-grid memory" data-card-count={cards.length}>
        {cards.map((card, cardIndex) => {
          const matched = matchedIds.includes(card.id);
          const visible = matched || selected.some(item => item.id === card.id);
          const cardPosition = `${cardIndex + 1} of ${cards.length}`;
          const accessibleName = matched
            ? `Matched card ${cardPosition}: ${card.word}`
            : visible
              ? `Revealed card ${cardPosition}: ${card.word}`
              : `Hidden card ${cardPosition}`;
          return (
            <button
              key={card.id}
              type="button"
              data-pair-id={card.pairId}
              className={`lg-match-card ${matched ? "matched" : ""}${visible ? " revealed" : ""}`}
              aria-label={accessibleName}
              onClick={() => choose(card)}
            >
              <span className="lg-card-inner">
                <span className="lg-card-face lg-card-back" aria-hidden="true">?</span>
                <span className="lg-card-face lg-card-front" aria-hidden={!visible}>{card.word}</span>
              </span>
            </button>
          );
        })}
      </div>
      <GameMeter current={correct} total={targetMatches} />
    </IllustratedGameScene>
  );
}

function FamilyGame({ state, round, setRound, isSoundEnabled, correct, setCorrect, addScore, miss, finish, recordFirstResponse, recordAssistedRetry }) {
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

function TargetGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds, schedule, recordFirstResponse }) {
  const target = state.words[round] || state.words[0];
  const canHearTarget = isSoundEnabled && hasRecordedSpeech(target);
  const options = useMemo(() => shuffle([target, ...shuffle(state.words.filter(word => word !== target)).slice(0, 5)]), [state.words, target]);
  // The bubble the child just popped (plays its burst before the next round)
  // and the bubble that wobbled because it was wrong.
  const [popped, setPopped] = useState("");
  const [wrongWord, setWrongWord] = useState("");
  const resolvedRef = useRef(false);

  useEffect(() => {
    resolvedRef.current = false;
    if (canHearTarget) speakWord(target);
  }, [canHearTarget, target]);

  function choose(word, index) {
    if (resolvedRef.current || popped) return;
    if (word !== target) {
      setWrongWord(`${word}-${index}`);
      // Timer, not animationend: reduced-motion suppresses the wobble, so
      // animationend never fires and the wrong state would stick.
      schedule(() => setWrongWord(""), 420);
      miss();
      return;
    }
    recordFirstResponse?.({ game: "pop-the-word", round, target, response: word, correct: true, practiceOnly: true, independent: false, supportUsed: [canHearTarget ? "spoken_target" : "printed_target"], audioDelivery: canHearTarget ? "requested" : "not_available", soundEnabled: isSoundEnabled });
    resolvedRef.current = true;
    setPopped(word);
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    addScore(18, playPopSound);
    schedule(() => {
      setPopped("");
      if (round + 1 >= totalRounds) finish(nextCorrect);
      else setRound(round + 1);
    }, 380);
  }

  return (
    <IllustratedGameScene mode="target" stageClassName={`lg-target-stage${popped || wrongWord ? " lg-target-frozen" : ""}`}>
      <p>{canHearTarget ? "Listen, then pop the matching bubble!" : "Pop the matching bubble!"}</p>
      {canHearTarget
        ? <button type="button" className="lg-game-audio" onClick={() => speakWord(target)}><span aria-hidden="true">♪</span> Hear word</button>
        : <div className="lg-game-picture lg-game-picture-text" aria-label={`Find ${target}`}><span>{target}</span></div>}
      <div className="lg-floating-options">
        {options.map((word, index) => (
          <button
            key={`${word}-${index}`}
            type="button"
            className={`${popped === word && word === target ? "popping" : ""}${wrongWord === `${word}-${index}` ? " wrong" : ""}`}
            style={{ "--float-delay": `${index * 0.12}s` }}
            onClick={() => choose(word, index)}
          >
            {word}
          </button>
        ))}
      </div>
      {popped && <div className="lg-target-reveal" role="status"><strong>{target}</strong><span>The balloon popped! A new word scene is ready.</span><i aria-hidden="true" /></div>}
      <GameMeter current={round + 1} total={totalRounds} />
    </IllustratedGameScene>
  );
}

function SentenceGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, difficulty, schedule, recordFirstResponse, recordAssistedRetry }) {
  const sentence = state.sentences[round] || state.sentences[0];
  const words = useMemo(() => sentence.replace(/[.?!]/g, "").split(/\s+/), [sentence]);
  const [position, setPosition] = useState(0);
  const [modelVisible, setModelVisible] = useState(true);
  const positionRef = useRef(0);
  const firstResponseRecordedRef = useRef(false);
  const attemptsRef = useRef(0);
  const options = useMemo(() => shuffle(words), [words]);

  const canHear = isSoundEnabled && hasRecordedSpeech(sentence);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (modelVisible && isSoundEnabled && canHear) speak(sentence);
  }, [canHear, isSoundEnabled, modelVisible, sentence]);

  function choose(word) {
    if (modelVisible || resolvedRef.current || position !== positionRef.current) return;
    const isCorrect = word === words[position];
    if (!firstResponseRecordedRef.current) {
      firstResponseRecordedRef.current = true;
      recordFirstResponse?.({ game: "word-hopscotch", round, target: words[0], response: word, correct: isCorrect, practiceOnly: true, independent: true, supportUsed: ["model_removed", "spoken_or_pictured_sentence"], audioDelivery: canHear ? "requested" : "not_available", soundEnabled: isSoundEnabled });
    }
    if (!isCorrect) {
      attemptsRef.current += 1;
      miss();
      return;
    }
    positionRef.current += 1;
    const nextPosition = position + 1;
    setPosition(nextPosition);
    if (attemptsRef.current > 0) recordAssistedRetry?.({ game: "word-hopscotch", round, target: words[0], attempts: attemptsRef.current, supportUsed: ["replay_or_retry"] });
    addScore(10);
    if (nextPosition >= words.length) {
      resolvedRef.current = true;
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      addScore(20);
      if (round + 1 >= state.sentences.length) {
        schedule(() => finish(nextCorrect), 360);
      } else {
        setRound(round + 1);
      }
    }
  }

  return (
    <IllustratedGameScene mode="sentence">
      <p>Hop on the next word in the sentence.</p>
      {canHear && <button type="button" className="lg-game-audio" onClick={() => speak(sentence)}><span aria-hidden="true">♪</span> Hear sentence</button>}
      {modelVisible
        ? <div className="lg-sentence-model" role="group" aria-label="Sentence model"><strong>Read the model</strong><span>{sentence}</span><button type="button" onClick={() => setModelVisible(false)}>Hide model &amp; start</button></div>
        : <>
            <div className="lg-sentence-path" aria-label="Sentence order after model removal">
              {words.map((word, index) => (
                <span key={`${word}-${index}`} data-word={word} className={index < position ? "done" : index === position && difficulty !== "hard" ? "active" : ""}>
                  {index < position ? word : "○"}
                </span>
              ))}
            </div>
            <div className="lg-hop-grid">
              {options.map((word, index) => (
                <button key={`${word}-${index}`} type="button" onClick={() => choose(word)} disabled={position >= words.length}>
                  {word}
                </button>
              ))}
            </div>
          </>}
      {!modelVisible && position >= words.length && <div className="lg-sentence-complete" role="status"><strong>Sentence built!</strong><span>{sentence}</span></div>}
      <GameMeter current={round + 1} total={state.sentences.length} />
    </IllustratedGameScene>
  );
}

function FixGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, schedule, recordFirstResponse }) {
  const total = state.fixes.length;
  const fix = state.fixes[round] || state.fixes[0];
  const [solved, setSolved] = useState(false);
  const [solvedAnswer, setSolvedAnswer] = useState("");
  const [wrongOption, setWrongOption] = useState("");
  const resolvedRef = useRef(false);
  const options = useMemo(() => shuffle(fix.options), [fix]);

  const completedSentence = completeRepairDisplay(fix.display, solvedAnswer);
  const spokenSentence = solved ? completedSentence : fix.say;
  const canHear = isSoundEnabled && hasRecordedSpeech(spokenSentence);

  useEffect(() => {
    if (canHear) speak(spokenSentence);
    else cancelSpeech();
  }, [canHear, spokenSentence]);

  function choose(option) {
    if (resolvedRef.current || solved) return;
    const accepted = isAcceptedAnswer(fix, option);
    recordFirstResponse?.({ game: "sentence-fix-it", round, target: fix.answer, response: option, correct: accepted, practiceOnly: true, independent: accepted, supportUsed: ["sentence_context"], audioDelivery: canHear ? "requested" : "not_available", soundEnabled: isSoundEnabled });
    if (!accepted) {
      setWrongOption(option);
      miss();
      schedule(() => setWrongOption(""), 500);
      return;
    }
    resolvedRef.current = true;
    setWrongOption("");
    setSolved(true);
    setSolvedAnswer(option);
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    addScore(25);
    schedule(() => {
      if (round + 1 >= total) {
        finish(nextCorrect);
      } else {
        setRound(round + 1);
      }
    }, 900);
  }

  const sentenceParts = fix.display.split("___");

  return (
    <IllustratedGameScene mode="quiz" stageClassName="lg-race-stage">
      <p>{fix.prompt}</p>
      {canHear && <button type="button" className="lg-game-audio" onClick={() => speak(spokenSentence)}><span aria-hidden="true">♪</span> Hear sentence</button>}
      <div className={`lg-fix-bench${solved ? " repaired" : ""}`} aria-label={solved ? "Sentence repaired" : "Repair bench"}><span className="lg-fix-tool" aria-hidden="true" /><strong>{solved ? "Sentence repaired" : "Repair the sentence"}</strong></div>
      <div className="lg-reading-sentence lg-fix-sentence">
        {solved
          ? completedSentence
          : <>
              {sentenceParts[0]}
              <span className="lg-fix-slot">{"\u00A0"}</span>
              {sentenceParts[1] || ""}
            </>}
      </div>
      <div className="lg-hop-grid">
        {options.map((option, index) => (
          <button key={`${option}-${index}`} type="button" onClick={() => choose(option)} disabled={solved}>
            {option}
          </button>
        ))}
      </div>
      {wrongOption && <div className="lg-fix-feedback" role="status">{fix.kind === "capital" ? "Names and sentence starts need a capital." : fix.kind === "end" ? "Check what kind of sentence this is: telling, asking, or strong feeling." : "Read the whole sentence and choose the word that makes sense."}</div>}
      {solved && <div className="lg-fix-complete" role="status">You repaired it. Read the whole sentence.</div>}
      <GameMeter current={round + 1} total={total} />
    </IllustratedGameScene>
  );
}

function GameMeter({ current, total }) {
  return (
    <div className="lg-game-meter" aria-label={`${current} of ${total}`}>
      <span>{Math.min(current, total)} of {total}</span>
      <div><i style={{ width: `${Math.min(100, (current / total) * 100)}%` }} /></div>
    </div>
  );
}

export default ArcadePracticeGame;
