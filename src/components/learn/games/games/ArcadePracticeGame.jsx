import { useEffect, useMemo, useState } from "react";
import { CVC_WORDS, RHYMING_PAIRS, SENTENCE_FIX, SENTENCES, SIGHT_WORDS, WORD_FAMILIES } from "../../../../data/learnGamesData";
import { getChildWordAsset } from "../../../../data/childAssets";
import { hasRecordedSpeech, speak, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio";
import { hasKnownBadWordAudio } from "../../../../data/knownBadWordAudio.js";
import { playCelebrationFanfare, playCorrectChime, playPopSound, playSoftBuzz, playTrainWhistle } from "../../../../utils/audio/gameSfx";
import { ConfettiCelebration } from "../shared/ConfettiCelebration.jsx";
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

function GameComplete({ title, stars, score, onRestart }) {
  return (
    <div className="lg-game-complete">
      <ConfettiCelebration show={stars > 0} />
      <img className="kid-cheer" src="/images/learn-games/phinny-cheering.webp" alt="" onError={event => { event.currentTarget.style.display = "none"; }} />
      <h2>{title} complete!</h2>
      <ProgressStars stars={stars} size="lg" />
      <p>{score} points</p>
      {stars > 0 && <p className="kid-gems-earned">+{stars} 💎 for your Treasure Den!</p>}
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
        alt={asset?.alt || `Picture for ${word}`}
        loading="lazy"
        decoding="async"
        width="120"
        height="120"
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
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  isSoundEnabled = true
}) {
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [stars, setStars] = useState(0);
  const [version, setVersion] = useState(0);
  const [shaking, setShaking] = useState(false);
  // Streak: consecutive correct answers earn a growing bonus and a combo chip.
  const [streak, setStreak] = useState(0);

  const totalRounds = difficulty === "hard" ? 10 : difficulty === "medium" ? 8 : 6;

  const gameState = useMemo(() => {
    if (mode === "memory") {
      const pairCount = difficulty === "hard" ? 10 : difficulty === "medium" ? 6 : 3;
      const words = pickSightWords(difficulty, pairCount);
      return { cards: shuffle([...words, ...words].map((word, index) => ({ id: `${word}-${index}`, word }))) };
    }

    if (mode === "rhyme") {
      const pairs = RHYMING_PAIRS.slice(0, difficulty === "hard" ? 8 : difficulty === "medium" ? 6 : 4);
      return { cards: shuffle(pairs.flat().map((word, index) => ({ id: `${word}-${index}`, word }))), pairTotal: pairs.length };
    }

    if (mode === "family") {
      // Shuffled so each play serves a different mix of families.
      const allFamilies = shuffle(Object.keys(WORD_FAMILIES));
      const familyIds = allFamilies.slice(0, difficulty === "hard" ? 8 : difficulty === "medium" ? 5 : 3);
      const words = familyIds.flatMap(familyId => WORD_FAMILIES[familyId].map(word => ({ familyId, word, onset: word.replace(familyId.slice(1).toLowerCase(), "") })));
      return { familyIds, words: shuffle(words), total: words.length };
    }

    if (mode === "sentence") {
      const source = difficulty === "hard" ? [...SENTENCES.level1, ...SENTENCES.level2, ...SENTENCES.level3] : difficulty === "medium" ? [...SENTENCES.level1, ...SENTENCES.level2] : SENTENCES.level1;
      return { sentences: shuffle(source).slice(0, totalRounds) };
    }

    if (mode === "quiz") {
      const source = SENTENCE_FIX[difficulty] || SENTENCE_FIX.easy;
      return { fixes: shuffle(source).slice(0, totalRounds) };
    }

    if (mode === "target") {
      const words = mode === "target" ? pickSightWords(difficulty, totalRounds + 12) : pickWords(difficulty, totalRounds + 12);
      return { words };
    }

    return { words: pickWords(difficulty, totalRounds) };
  }, [difficulty, mode, totalRounds, version]);

  useEffect(() => {
    onScoreUpdate?.(score);
  }, [onScoreUpdate, score]);

  useEffect(() => {
    const total = mode === "rhyme"
      ? gameState.pairTotal
      : mode === "family"
        ? gameState.total
        : mode === "quiz"
          ? gameState.fixes?.length
          : totalRounds;
    onProgressUpdate?.(mode === "rhyme" || mode === "family" ? correct : round + 1, total || 1);
  }, [correct, gameState.fixes?.length, gameState.pairTotal, gameState.total, mode, onProgressUpdate, round, totalRounds]);

  function addScore(amount, sfx = playCorrectChime) {
    // Streak bonus: +2 per answer already in the run, capped so scores stay sane.
    setScore(current => current + amount + Math.min(10, streak * 2));
    setStreak(current => current + 1);
    if (isSoundEnabled) sfx();
  }

  function miss() {
    setWrongs(current => current + 1);
    setStreak(0);
    setShaking(true);
    if (isSoundEnabled) playSoftBuzz();
  }

  function finish(nextCorrect = correct) {
    const nextStars = starScore(nextCorrect, mode === "rhyme" ? gameState.pairTotal : mode === "family" ? gameState.total : totalRounds, wrongs);
    setStars(nextStars);
    setCompleted(true);
    if (isSoundEnabled) playCelebrationFanfare();
    onComplete?.(nextStars, score, nextCorrect);
  }

  function restart() {
    setScore(0);
    setWrongs(0);
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
  if (mode === "memory" || mode === "rhyme") {
    stage = (
      <MatchGame
        mode={mode}
        state={gameState}
        isSoundEnabled={isSoundEnabled}
        correct={correct}
        setCorrect={setCorrect}
        addScore={addScore}
        miss={miss}
        finish={finish}
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
      />
    );
  } else {
    stage = (
      <BuildGame
        key={`b-${version}-${round}`}
        variant={mode}
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
      />
    );
  }

  return (
    <div
      className={`lg-game-stage-shell${shaking ? " lg-shake" : ""}`}
      onAnimationEnd={() => setShaking(false)}
    >
      {streak >= 2 && (
        <div className="kid-combo" data-level={streak >= 4 ? "hot" : "warm"} key={streak} aria-live="polite">
          🔥 {streak} in a row!
        </div>
      )}
      {stage}
    </div>
  );
}

function BuildGame({ variant, state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds }) {
  const targetWord = state.words[round] || state.words[0];
  // placed = [{ letter, tileIndex }] so duplicate letters keep their own tile.
  const [placed, setPlaced] = useState([]);
  const [checking, setChecking] = useState(false);
  const letters = useMemo(() => {
    const targetLetters = targetWord.split("");
    const distractors = shuffle(DISTRACTOR_LETTERS.filter(letter => !targetLetters.includes(letter))).slice(0, variant === "build" ? 3 : 5);
    return shuffle([...targetLetters, ...distractors]);
  }, [targetWord, variant]);

  useEffect(() => {
    if (isSoundEnabled) speakWord(targetWord);
  }, [isSoundEnabled, targetWord]);

  const usedTiles = new Set(placed.map(item => item.tileIndex));

  function placeTile(letter, tileIndex) {
    if (checking || usedTiles.has(tileIndex) || placed.length >= targetWord.length) return;
    if (isSoundEnabled) speakPhoneme(letter);
    const next = [...placed, { letter, tileIndex }];
    setPlaced(next);

    if (next.length !== targetWord.length) return;

    if (next.map(item => item.letter).join("") === targetWord) {
      addScore(variant === "train" ? 30 : 25, variant === "train" ? playTrainWhistle : playCorrectChime);
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setChecking(true);
      setTimeout(() => {
        if (round + 1 >= totalRounds) {
          finish(nextCorrect);
        } else {
          setRound(round + 1);
        }
      }, 550);
    } else {
      // Wrong word: shake, tip the letters back out, let them try again.
      miss();
      setChecking(true);
      setTimeout(() => {
        setPlaced([]);
        setChecking(false);
        if (isSoundEnabled) speakWord(targetWord);
      }, 750);
    }
  }

  function removeAt(slotIndex) {
    if (checking || slotIndex >= placed.length) return;
    setPlaced(current => current.filter((_, index) => index !== slotIndex));
  }

  return (
    <section className={`lg-game-stage lg-game-${variant || "build"}`}>
      <p>{variant === "slide" ? "Touch each sound, then blend the word." : variant === "train" ? "Load the train in sound order." : "Build the word you hear."}</p>
      <button type="button" className="lg-game-audio" onClick={() => speakWord(targetWord)}>Hear word</button>
      <WordImageCard word={targetWord} secret />
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
    </section>
  );
}

function MatchGame({ mode, state, isSoundEnabled, correct, setCorrect, addScore, miss, finish }) {
  const [selected, setSelected] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const cards = state.cards;
  const targetMatches = mode === "rhyme" ? state.pairTotal : cards.length / 2;

  function isMatch(first, second) {
    if (mode === "memory") return first.word === second.word;
    return first.word !== second.word && first.word.slice(-2) === second.word.slice(-2);
  }

  function choose(card) {
    if (matchedIds.includes(card.id) || selected.some(item => item.id === card.id)) return;
    if (isSoundEnabled) speakWord(card.word);
    const nextSelected = [...selected, card];
    setSelected(nextSelected);

    if (nextSelected.length < 2) return;

    if (isMatch(nextSelected[0], nextSelected[1])) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      addScore(mode === "memory" ? 12 : 18);
      setMatchedIds(current => [...current, nextSelected[0].id, nextSelected[1].id]);
      setSelected([]);
      if (nextCorrect >= targetMatches) {
        setTimeout(() => finish(nextCorrect), 400);
      }
    } else {
      miss();
      setTimeout(() => setSelected([]), 650);
    }
  }

  return (
    <section className="lg-game-stage">
      <p>{mode === "memory" ? "Find the matching sight words." : "Find the rhyming words."}</p>
      <div className={`lg-card-grid ${mode === "memory" ? "memory" : "rhyme"}`}>
        {cards.map(card => {
          const visible = mode === "rhyme" || matchedIds.includes(card.id) || selected.some(item => item.id === card.id);
          return (
            <button
              key={card.id}
              type="button"
              className={`lg-match-card ${matchedIds.includes(card.id) ? "matched" : ""}${visible ? " revealed" : ""}`}
              onClick={() => choose(card)}
            >
              <span className="lg-card-inner">
                <span className="lg-card-face lg-card-back" aria-hidden="true">?</span>
                <span className="lg-card-face lg-card-front">{card.word}</span>
              </span>
            </button>
          );
        })}
      </div>
      <GameMeter current={correct} total={targetMatches} />
    </section>
  );
}

function FamilyGame({ state, isSoundEnabled, correct, setCorrect, addScore, finish }) {
  const [built, setBuilt] = useState([]);
  const [activeFamily, setActiveFamily] = useState(state.familyIds[0]);
  const familyWords = state.words.filter(item => item.familyId === activeFamily);
  const builtWords = new Set(built);

  function choose(item) {
    const word = item.word;
    if (builtWords.has(word)) return;
    if (isSoundEnabled) speakWord(word);
    const nextCorrect = correct + 1;
    setBuilt(current => [...current, word]);
    setCorrect(nextCorrect);
    addScore(12);
    if (nextCorrect >= state.total) {
      setTimeout(() => finish(nextCorrect), 400);
    }
  }

  return (
    <section className="lg-game-stage">
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
          {familyWords.map(item => (
            <button key={item.word} type="button" disabled={builtWords.has(item.word)} onClick={() => choose(item)}>
              {item.onset || item.word[0]}
            </button>
          ))}
        </div>
      </div>
      <div className="lg-built-words">
        {built.map(word => <span key={word}>{word}</span>)}
      </div>
      <GameMeter current={correct} total={state.total} />
    </section>
  );
}

function TargetGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds }) {
  const target = state.words[round] || state.words[0];
  const options = useMemo(() => shuffle([target, ...shuffle(state.words.filter(word => word !== target)).slice(0, 5)]), [state.words, target]);
  // The bubble the child just popped (plays its burst before the next round)
  // and the bubble that wobbled because it was wrong.
  const [popped, setPopped] = useState("");
  const [wrongWord, setWrongWord] = useState("");

  useEffect(() => {
    if (isSoundEnabled) speakWord(target);
  }, [isSoundEnabled, target]);

  function choose(word, index) {
    if (popped) return;
    if (word !== target) {
      setWrongWord(`${word}-${index}`);
      miss();
      return;
    }
    setPopped(word);
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    addScore(18, playPopSound);
    setTimeout(() => {
      setPopped("");
      if (round + 1 >= totalRounds) finish(nextCorrect);
      else setRound(round + 1);
    }, 380);
  }

  return (
    <section className="lg-game-stage lg-target-stage">
      <p>Listen, then pop the matching bubble!</p>
      <button type="button" className="lg-game-audio" onClick={() => speakWord(target)}>Hear word</button>
      <div className="lg-floating-options">
        {options.map((word, index) => (
          <button
            key={`${word}-${index}`}
            type="button"
            className={`${popped === word && word === target ? "popping" : ""}${wrongWord === `${word}-${index}` ? " wrong" : ""}`}
            style={{ "--float-delay": `${index * 0.12}s` }}
            onClick={() => choose(word, index)}
            onAnimationEnd={() => { if (wrongWord === `${word}-${index}`) setWrongWord(""); }}
          >
            {word}
          </button>
        ))}
      </div>
      <GameMeter current={round + 1} total={totalRounds} />
    </section>
  );
}

function SentenceGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled }) {
  const sentence = state.sentences[round] || state.sentences[0];
  const words = sentence.replace(/[.?!]/g, "").split(/\s+/);
  const [position, setPosition] = useState(0);
  const options = useMemo(() => shuffle(words), [sentence]);

  const canHear = hasRecordedSpeech(sentence);

  useEffect(() => {
    if (isSoundEnabled && canHear) speak(sentence);
  }, [canHear, isSoundEnabled, sentence]);

  function choose(word) {
    if (word !== words[position]) {
      miss();
      return;
    }
    addScore(10);
    if (position + 1 >= words.length) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      addScore(20);
      if (round + 1 >= state.sentences.length) {
        setTimeout(() => finish(nextCorrect), 360);
      } else {
        setRound(round + 1);
      }
    } else {
      setPosition(position + 1);
    }
  }

  return (
    <section className="lg-game-stage">
      <p>Hop on the next word in the sentence.</p>
      {canHear && <button type="button" className="lg-game-audio" onClick={() => speak(sentence)}>Hear sentence</button>}
      <div className="lg-sentence-path">
        {words.map((word, index) => (
          <span key={`${word}-${index}`} className={index < position ? "done" : index === position ? "active" : ""}>
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
    </section>
  );
}

function FixGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled }) {
  const total = state.fixes.length;
  const fix = state.fixes[round] || state.fixes[0];
  const [solved, setSolved] = useState(false);
  const options = useMemo(() => shuffle(fix.options), [fix]);

  const canHear = hasRecordedSpeech(fix.say);

  useEffect(() => {
    if (isSoundEnabled && canHear) speak(fix.say);
  }, [canHear, fix, isSoundEnabled]);

  function choose(option) {
    if (solved) return;
    if (option !== fix.answer) {
      miss();
      return;
    }
    setSolved(true);
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    addScore(25);
    if (isSoundEnabled && canHear) speak(fix.say);
    setTimeout(() => {
      if (round + 1 >= total) {
        finish(nextCorrect);
      } else {
        setRound(round + 1);
      }
    }, 900);
  }

  const sentenceParts = fix.display.split("___");

  return (
    <section className="lg-game-stage lg-race-stage">
      <p>{fix.prompt}</p>
      {canHear && <button type="button" className="lg-game-audio" onClick={() => speak(fix.say)}>Hear sentence</button>}
      <div className="lg-race-track"><span style={{ width: `${Math.max(8, (correct / total) * 100)}%` }}><RaceMarker /></span></div>
      <div className="lg-reading-sentence lg-fix-sentence">
        {sentenceParts[0]}
        <span className={`lg-fix-slot${solved ? " solved" : ""}`}>{solved ? fix.answer : "\u00A0"}</span>
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
    </section>
  );
}

function GameMeter({ current, total }) {
  return (
    <div className="lg-game-meter" aria-label={`${current} of ${total}`}>
      <span>{Math.min(current, total)}/{total}</span>
      <div><i style={{ width: `${Math.min(100, (current / total) * 100)}%` }} /></div>
    </div>
  );
}

export default ArcadePracticeGame;
