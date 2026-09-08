import { useEffect, useMemo, useRef, useState } from "react";
import { CVC_WORDS, SENTENCE_FIX, SENTENCES, SIGHT_WORDS, WORD_FAMILIES } from "../../../../data/learnGamesData";
import { getChildWordAsset } from "../../../../data/childAssets";
import { cancelSpeech, hasRecordedSpeech, speak, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio";
import { hasKnownBadWordAudio } from "../../../../data/knownBadWordAudio.js";
import { playCelebrationFanfare, playCorrectChime, playPopSound, playSoftBuzz } from "../../../../utils/audio/gameSfx";
import { ConfettiCelebration } from "../shared/ConfettiCelebration.jsx";
import { IllustratedGameScene } from "../shared/IllustratedGameScene.jsx";
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
  const pool = (difficulty === "hard"
    ? SIGHT_WORDS.level3
    : difficulty === "medium"
      ? SIGHT_WORDS.level2
      : SIGHT_WORDS.level1).filter(word => !hasKnownBadWordAudio(word));
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

function WordImageCard({ word, secret = false }) {
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
        alt={secret ? "" : asset?.alt || `Picture for ${word}`}
        loading="lazy"
        decoding="async"
        width="240"
        height="240"
        onError={() => setFailedImageWord(word)}
      />
    </div>
  );
}

function RaceMarker() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 28" focusable="false">
      <path d="M7 20h25c5 0 9-3 11-8l1-3-8 2-7-7H16l-5 7H5c-2 0-4 2-4 4s2 5 6 5Z" />
      <circle cx="14" cy="21" r="4" />
      <circle cx="34" cy="21" r="4" />
    </svg>
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

  const [score, setScore] = useState(0);
  // Honor the resume contract: startLevel is a 0-based round index from GamePlayer.
  const [round, setRound] = useState(() => Math.max(0, Math.min(Number(startLevel) || 0, totalRounds - 1)));
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
      return withReroll({ cards: shuffle([...words, ...words].map((word, index) => ({ id: `${word}-${index}`, word }))) });
    }

    if (mode === "family") {
      // Shuffled so each play serves a different mix of families.
      const allFamilies = shuffle(Object.keys(WORD_FAMILIES));
      const familyIds = allFamilies.slice(0, difficulty === "hard" ? 8 : difficulty === "medium" ? 5 : 3);
      const words = familyIds.flatMap(familyId => WORD_FAMILIES[familyId].map(word => ({ familyId, word, onset: word.replace(familyId.slice(1).toLowerCase(), "") })));
      return withReroll({ familyIds, words: shuffle(words), total: words.length });
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
    onComplete?.(nextStars, scoreRef.current, nextCorrect);
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
      />
    );
  } else if (mode === "family") {
    stage = (
      <FamilyGame
        state={gameState}
        isSoundEnabled={isSoundEnabled}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
        schedule={schedule}
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

function BuildGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds, schedule }) {
  const targetWord = state.words[round] || state.words[0];
  const canHearTarget = isSoundEnabled && hasRecordedSpeech(targetWord);
  // placed = [{ letter, tileIndex }] so duplicate letters keep their own tile.
  const [placed, setPlaced] = useState([]);
  const [checking, setChecking] = useState(false);
  // Failed spellings on this word; after 2 the word text appears as a scaffold
  // (many hard words have no image asset, so there is no other visual target).
  const [attempts, setAttempts] = useState(0);
  const answerLockedRef = useRef(false);
  const letters = useMemo(() => {
    const targetLetters = targetWord.split("");
    const distractors = shuffle(DISTRACTOR_LETTERS.filter(letter => !targetLetters.includes(letter))).slice(0, 3);
    return shuffle([...targetLetters, ...distractors]);
  }, [targetWord]);

  useEffect(() => {
    answerLockedRef.current = false;
    if (canHearTarget) speakWord(targetWord);
  }, [canHearTarget, targetWord]);

  const usedTiles = new Set(placed.map(item => item.tileIndex));

  function placeTile(letter, tileIndex) {
    if (answerLockedRef.current || checking || usedTiles.has(tileIndex) || placed.length >= targetWord.length) return;
    if (isSoundEnabled) speakPhoneme(letter);
    const next = [...placed, { letter, tileIndex }];
    setPlaced(next);

    if (next.length !== targetWord.length) return;

    if (next.map(item => item.letter).join("") === targetWord) {
      answerLockedRef.current = true;
      addScore(25);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setChecking(true);
      schedule(() => {
        if (round + 1 >= totalRounds) {
          finish(nextCorrect);
        } else {
          setRound(round + 1);
        }
      }, 550);
    } else {
      // Wrong word: shake, tip the letters back out, let them try again.
      miss();
      setAttempts(current => current + 1);
      setChecking(true);
      schedule(() => {
        setPlaced([]);
        setChecking(false);
        if (canHearTarget) speakWord(targetWord);
      }, 750);
    }
  }

  function removeAt(slotIndex) {
    if (checking || slotIndex >= placed.length) return;
    setPlaced(current => current.filter((_, index) => index !== slotIndex));
  }

  return (
    <IllustratedGameScene mode="build" stageClassName="lg-game-build">
      <p>{canHearTarget ? "Build the word you hear." : "Build this word."}</p>
      {canHearTarget && <button type="button" className="lg-game-audio" onClick={() => speakWord(targetWord)}><span aria-hidden="true">♪</span> Hear word</button>}
      <WordImageCard word={targetWord} secret={canHearTarget} />
      {attempts >= 2 && (
        <div className="lg-game-picture lg-game-picture-text" aria-label={`Hint: the word is ${targetWord}`}>
          <span>{targetWord}</span>
        </div>
      )}
      <div className="lg-game-slots" aria-label="Word letters. Tap a filled box to take the letter out.">
        {targetWord.split("").map((letter, index) => (
          placed[index] ? (
            <button
              key={`slot-${index}`}
              type="button"
              className="filled"
              aria-label={`Remove letter ${placed[index].letter}`}
              onClick={() => removeAt(index)}
            >
              {placed[index].letter}
            </button>
          ) : (
            <span key={`slot-${index}`} />
          )
        ))}
      </div>
      <div className="lg-game-letter-bank">
        {letters.map((letter, index) => (
          <button
            key={`${letter}-${index}`}
            type="button"
            disabled={usedTiles.has(index)}
            className={usedTiles.has(index) ? "used" : ""}
            onClick={() => placeTile(letter, index)}
          >
            {letter}
          </button>
        ))}
      </div>
      <GameMeter current={round + 1} total={totalRounds} />
    </IllustratedGameScene>
  );
}

function MatchGame({ state, isSoundEnabled, correct, setCorrect, addScore, miss, finish, schedule }) {
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

    if (nextSelected[0].word === nextSelected[1].word) {
      const nextCorrect = correct + 1;
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

function FamilyGame({ state, isSoundEnabled, correct, setCorrect, addScore, miss, finish, schedule }) {
  const [built, setBuilt] = useState([]);
  const builtRef = useRef(new Set());
  const [activeFamily, setActiveFamily] = useState(state.familyIds[0]);
  const builtWords = new Set(built);

  // Each family round mixes its real onsets with 1-2 decoys borrowed from the
  // other families in play, so a tap can actually be wrong.
  const options = useMemo(() => {
    const familyOnsets = state.words
      .filter(item => item.familyId === activeFamily)
      .map(item => ({ onset: item.onset || item.word[0], word: item.word }));
    const decoys = [];
    for (const item of shuffle(state.words.filter(entry => entry.familyId !== activeFamily))) {
      const onset = item.onset || item.word[0];
      if (!familyOnsets.some(option => option.onset === onset) && !decoys.includes(onset)) decoys.push(onset);
      if (decoys.length >= 2) break;
    }
    return shuffle([...familyOnsets, ...decoys.map(onset => ({ onset, word: "" }))]);
  }, [activeFamily, state.words]);

  function choose(option) {
    if (!option.word) {
      miss();
      return;
    }
    if (builtRef.current.has(option.word)) return;
    builtRef.current.add(option.word);
    if (isSoundEnabled) speakWord(option.word);
    const nextCorrect = correct + 1;
    setBuilt(current => [...current, option.word]);
    setCorrect(nextCorrect);
    addScore(12);
    if (nextCorrect >= state.total) {
      schedule(() => finish(nextCorrect), 400);
    }
  }

  return (
    <IllustratedGameScene mode="family">
      <p>Pick a beginning sound to build each word family.</p>
      <div className="lg-family-tabs">
        {state.familyIds.map(familyId => (
          <button key={familyId} type="button" className={familyId === activeFamily ? "active" : ""} onClick={() => setActiveFamily(familyId)}>
            {familyId}
          </button>
        ))}
      </div>
      <div className="lg-family-board">
        <div className="lg-rime-tile">{activeFamily}</div>
        <div className="lg-game-letter-bank">
          {options.map(option => (
            <button key={option.onset} type="button" disabled={builtWords.has(option.word)} onClick={() => choose(option)}>
              {option.onset}
            </button>
          ))}
        </div>
      </div>
      <div className="lg-built-words">
        {built.map(word => <span key={word}>{word}</span>)}
      </div>
      <GameMeter current={correct} total={state.total} />
    </IllustratedGameScene>
  );
}

function TargetGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds, schedule }) {
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
    <IllustratedGameScene mode="target" stageClassName="lg-target-stage">
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
      <GameMeter current={round + 1} total={totalRounds} />
    </IllustratedGameScene>
  );
}

function SentenceGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, difficulty, schedule }) {
  const sentence = state.sentences[round] || state.sentences[0];
  const words = useMemo(() => sentence.replace(/[.?!]/g, "").split(/\s+/), [sentence]);
  const [position, setPosition] = useState(0);
  const options = useMemo(() => shuffle(words), [words]);

  const canHear = isSoundEnabled && hasRecordedSpeech(sentence);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (isSoundEnabled && canHear) speak(sentence);
  }, [canHear, isSoundEnabled, sentence]);

  function choose(word) {
    if (resolvedRef.current) return;
    if (word !== words[position]) {
      miss();
      return;
    }
    addScore(10);
    if (position + 1 >= words.length) {
      resolvedRef.current = true;
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      addScore(20);
      if (round + 1 >= state.sentences.length) {
        schedule(() => finish(nextCorrect), 360);
      } else {
        setRound(round + 1);
      }
    } else {
      setPosition(position + 1);
    }
  }

  return (
    <IllustratedGameScene mode="sentence">
      <p>Hop on the next word in the sentence.</p>
      {canHear && <button type="button" className="lg-game-audio" onClick={() => speak(sentence)}><span aria-hidden="true">♪</span> Hear sentence</button>}
      <div className="lg-sentence-path">
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className={index < position ? "done" : index === position && difficulty !== "hard" ? "active" : ""}>
            {word}
          </span>
        ))}
      </div>
      <div className="lg-hop-grid">
        {options.map((word, index) => (
          <button key={`${word}-${index}`} type="button" onClick={() => choose(word)}>
            {word}
          </button>
        ))}
      </div>
      <GameMeter current={round + 1} total={state.sentences.length} />
    </IllustratedGameScene>
  );
}

function FixGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, schedule }) {
  const total = state.fixes.length;
  const fix = state.fixes[round] || state.fixes[0];
  const [solved, setSolved] = useState(false);
  const [solvedAnswer, setSolvedAnswer] = useState("");
  const resolvedRef = useRef(false);
  const options = useMemo(() => shuffle(fix.options), [fix]);

  const canHear = isSoundEnabled && hasRecordedSpeech(fix.say);

  useEffect(() => {
    if (isSoundEnabled && canHear) speak(fix.say);
  }, [canHear, fix, isSoundEnabled]);

  function choose(option) {
    if (resolvedRef.current || solved) return;
    if (!isAcceptedAnswer(fix, option)) {
      miss();
      return;
    }
    resolvedRef.current = true;
    setSolved(true);
    setSolvedAnswer(option);
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    addScore(25);
    if (isSoundEnabled && canHear) speak(fix.say);
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
      {canHear && <button type="button" className="lg-game-audio" onClick={() => speak(fix.say)}><span aria-hidden="true">♪</span> Hear sentence</button>}
      <div className="lg-race-track"><span style={{ width: `${Math.max(8, (correct / total) * 100)}%` }}><RaceMarker /></span></div>
      <div className="lg-reading-sentence lg-fix-sentence">
        {sentenceParts[0]}
        <span className={`lg-fix-slot${solved ? " solved" : ""}`}>{solved ? solvedAnswer : "\u00A0"}</span>
        {sentenceParts[1] || ""}
      </div>
      <div className="lg-hop-grid">
        {options.map((option, index) => (
          <button key={`${option}-${index}`} type="button" onClick={() => choose(option)}>
            {option}
          </button>
        ))}
      </div>
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
