import { useEffect, useMemo, useState } from "react";
import { CVC_WORDS, RHYMING_PAIRS, SENTENCES, SIGHT_WORDS, WORD_FAMILIES } from "../../../../data/learnGamesData";
import { getChildWordAsset } from "../../../../data/childAssets";
import { speak, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio";
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

function pickWords(difficulty, limit) {
  const pool = [
    ...CVC_WORDS.easy,
    ...(difficulty !== "easy" ? CVC_WORDS.medium : []),
    ...(difficulty === "hard" ? CVC_WORDS.hard : [])
  ];
  return shuffle(pool).slice(0, limit);
}

function pickSightWords(difficulty, limit) {
  const pool = [
    ...SIGHT_WORDS.level1,
    ...(difficulty !== "easy" ? SIGHT_WORDS.level2 : []),
    ...(difficulty === "hard" ? SIGHT_WORDS.level3 : [])
  ];
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
      <img src="/images/learn-games/phinny-cheering.webp" alt="" />
      <h2>{title} complete!</h2>
      <ProgressStars stars={stars} size="lg" />
      <p>{score} points</p>
      <button type="button" className="lg-game-primary" onClick={onRestart}>
        Play again
      </button>
    </div>
  );
}

function WordImageCard({ word }) {
  const asset = getChildWordAsset(word, { allowBlockedAssessmentImage: true });
  const src = asset?.image || asset?.fallbackImage || `/images/cvc/${word}.svg`;
  if (!src) return null;

  return (
    <div className="lg-game-picture">
      <img src={src} alt={asset?.alt || `Picture for ${word}`} loading="lazy" decoding="async" width="120" height="120" />
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
      const familyIds = difficulty === "hard"
        ? ["-AT", "-AN", "-IG", "-OP", "-UN", "-EN", "-ET", "-OT", "-UG", "-IN"].slice(0, 8)
        : difficulty === "medium"
          ? ["-AT", "-AN", "-IG", "-OP", "-ET"]
          : ["-AT", "-AN", "-IG"];
      const words = familyIds.flatMap(familyId => WORD_FAMILIES[familyId].map(word => ({ familyId, word, onset: word.replace(familyId.slice(1).toLowerCase(), "") })));
      return { familyIds, words: shuffle(words), total: words.length };
    }

    if (mode === "sentence") {
      const source = difficulty === "hard" ? [...SENTENCES.level1, ...SENTENCES.level2, ...SENTENCES.level3] : difficulty === "medium" ? [...SENTENCES.level1, ...SENTENCES.level2] : SENTENCES.level1;
      return { sentences: shuffle(source).slice(0, totalRounds) };
    }

    if (mode === "quiz") {
      const source = [...SENTENCES.level1, ...SENTENCES.level2, ...SENTENCES.level3];
      return { sentences: shuffle(source).slice(0, totalRounds) };
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
        : totalRounds;
    onProgressUpdate?.(mode === "rhyme" || mode === "family" ? correct : round + 1, total || 1);
  }, [correct, gameState.pairTotal, gameState.total, mode, onProgressUpdate, round, totalRounds]);

  function addScore(amount, sfx = playCorrectChime) {
    setScore(current => current + amount);
    if (isSoundEnabled) sfx();
  }

  function miss() {
    setWrongs(current => current + 1);
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
        title={title}
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
        title={title}
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
        title={title}
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
      <QuizGame
        title={title}
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
        title={title}
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
        title={title}
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
      {stage}
    </div>
  );
}

function BuildGame({ title, variant, state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds }) {
  const targetWord = state.words[round] || state.words[0];
  const [answer, setAnswer] = useState([]);
  const letters = useMemo(() => {
    const targetLetters = targetWord.split("");
    const distractors = shuffle(DISTRACTOR_LETTERS.filter(letter => !targetLetters.includes(letter))).slice(0, variant === "build" ? 3 : 5);
    return shuffle([...targetLetters, ...distractors]);
  }, [targetWord, variant]);

  useEffect(() => {
    setAnswer([]);
    if (isSoundEnabled) speakWord(targetWord);
  }, [isSoundEnabled, targetWord]);

  function choose(letter) {
    const expected = targetWord[answer.length];
    if (letter !== expected) {
      miss();
      return;
    }
    if (isSoundEnabled) speakPhoneme(letter);
    const nextAnswer = [...answer, letter];
    setAnswer(nextAnswer);
    addScore(variant === "train" ? 10 : 8, variant === "train" ? playTrainWhistle : playCorrectChime);

    if (nextAnswer.join("") === targetWord) {
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      setTimeout(() => {
        if (round + 1 >= totalRounds) {
          finish(nextCorrect);
        } else {
          setRound(round + 1);
        }
      }, 550);
    }
  }

  return (
    <section className={`lg-game-stage lg-game-${variant || "build"}`}>
      <p>{variant === "slide" ? "Touch each sound, then blend the word." : variant === "train" ? "Load the train in sound order." : "Build the word you hear."}</p>
      <button type="button" className="lg-game-audio" onClick={() => speakWord(targetWord)}>Hear word</button>
      <WordImageCard word={targetWord} />
      <div className="lg-game-slots" aria-label="Word letters">
        {targetWord.split("").map((letter, index) => (
          <span key={`${letter}-${index}`} className={answer[index] ? "filled" : ""}>
            {answer[index] || ""}
          </span>
        ))}
      </div>
      <div className="lg-game-letter-bank">
        {letters.map((letter, index) => (
          <button key={`${letter}-${index}`} type="button" onClick={() => choose(letter)}>
            {letter}
          </button>
        ))}
      </div>
      <GameMeter current={round + 1} total={totalRounds} />
    </section>
  );
}

function MatchGame({ title, mode, state, isSoundEnabled, correct, setCorrect, addScore, miss, finish }) {
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
              className={`lg-match-card ${matchedIds.includes(card.id) ? "matched" : ""}`}
              onClick={() => choose(card)}
            >
              {visible ? card.word : "?"}
            </button>
          );
        })}
      </div>
      <GameMeter current={correct} total={targetMatches} />
    </section>
  );
}

function FamilyGame({ title, state, isSoundEnabled, correct, setCorrect, addScore, miss, finish }) {
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

function TargetGame({ title, state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds }) {
  const target = state.words[round] || state.words[0];
  const options = useMemo(() => shuffle([target, ...shuffle(state.words.filter(word => word !== target)).slice(0, 5)]), [state.words, target]);

  useEffect(() => {
    if (isSoundEnabled) speakWord(target);
  }, [isSoundEnabled, target]);

  function choose(word) {
    if (word !== target) {
      miss();
      return;
    }
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    addScore(18, playPopSound);
    if (round + 1 >= totalRounds) {
      setTimeout(() => finish(nextCorrect), 360);
    } else {
      setRound(round + 1);
    }
  }

  return (
    <section className="lg-game-stage lg-target-stage">
      <p>Listen, then tap the matching word.</p>
      <button type="button" className="lg-game-audio" onClick={() => speakWord(target)}>Hear word</button>
      <div className="lg-floating-options">
        {options.map((word, index) => (
          <button key={`${word}-${index}`} type="button" style={{ "--float-delay": `${index * 0.12}s` }} onClick={() => choose(word)}>
            {word}
          </button>
        ))}
      </div>
      <GameMeter current={round + 1} total={totalRounds} />
    </section>
  );
}

function SentenceGame({ title, state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled }) {
  const sentence = state.sentences[round] || state.sentences[0];
  const words = sentence.replace(/[.?!]/g, "").split(/\s+/);
  const [position, setPosition] = useState(0);
  const options = useMemo(() => shuffle(words), [sentence]);

  useEffect(() => {
    setPosition(0);
    if (isSoundEnabled) speak(sentence);
  }, [isSoundEnabled, sentence]);

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
      <button type="button" className="lg-game-audio" onClick={() => speak(sentence)}>Hear sentence</button>
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

function QuizGame({ title, state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds }) {
  const sentence = state.sentences[round] || state.sentences[0];
  const answer = sentence.split(/\s+/).find(word => word.length > 3)?.replace(/[.?!]/g, "") || sentence.split(/\s+/)[0];
  const allWords = state.sentences.join(" ").replace(/[.?!]/g, "").split(/\s+/).filter(word => word.length > 2);
  const options = useMemo(() => shuffle([answer, ...shuffle(allWords.filter(word => word !== answer)).slice(0, 3)]), [allWords, answer]);

  useEffect(() => {
    if (isSoundEnabled) speak(sentence);
  }, [isSoundEnabled, sentence]);

  function choose(word) {
    if (word !== answer) {
      miss();
      return;
    }
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    addScore(25);
    if (round + 1 >= totalRounds) {
      setTimeout(() => finish(nextCorrect), 360);
    } else {
      setRound(round + 1);
    }
  }

  return (
    <section className="lg-game-stage lg-race-stage">
      <p>Read the sentence and choose the focus word.</p>
      <button type="button" className="lg-game-audio" onClick={() => speak(sentence)}>Hear sentence</button>
      <div className="lg-race-track"><span style={{ width: `${Math.max(8, (correct / totalRounds) * 100)}%` }}><RaceMarker /></span></div>
      <div className="lg-reading-sentence">{sentence}</div>
      <div className="lg-hop-grid">
        {options.map((word, index) => (
          <button key={`${word}-${index}`} type="button" onClick={() => choose(word)}>
            {word}
          </button>
        ))}
      </div>
      <GameMeter current={round + 1} total={totalRounds} />
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
