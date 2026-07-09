import { useEffect, useMemo, useState } from "react";
import { speakWord } from "../../../../utils/learnGamesAudio";
import { playCelebrationFanfare, playCorrectChime, playPopSound, playSoftBuzz } from "../../../../utils/audio/gameSfx";
import { ConfettiCelebration } from "../shared/ConfettiCelebration.jsx";
import { ProgressStars } from "../shared/ProgressStars.jsx";
import {
  buildRescueRounds,
  buildSortRounds,
  buildGardenRounds,
  adventureStars
} from "../../../../utils/adventureRounds.js";

// The three adventure games share one engine: rounds in, planks/bins/flowers
// out. Every mistake coaches (replay + retry), every win is a visible thing
// the child MADE (a bridge, a sorted factory line, a garden).

function Complete({ title, stars, score, onRestart }) {
  return (
    <div className="lg-game-complete">
      <ConfettiCelebration show={stars > 0} />
      <img className="kid-cheer" src="/images/learn-games/phinny-cheering.webp" alt="" onError={e => { e.currentTarget.style.display = "none"; }} />
      <h2>{title} complete!</h2>
      <ProgressStars stars={stars} size="lg" />
      <p>{score} points</p>
      {stars > 0 && <p className="kid-gems-earned">+{stars} coins for Points + Progress</p>}
      <button type="button" className="lg-game-primary" onClick={onRestart}>Play again</button>
    </div>
  );
}

// ── Word Rescue ────────────────────────────────────────────────────────────
function RescueStage({ rounds, state, isSoundEnabled }) {
  const { index, planks, wrongWord, choose } = state;
  const round = rounds[index] || rounds[rounds.length - 1];

  useEffect(() => {
    if (isSoundEnabled && round) speakWord(round.word);
  }, [isSoundEnabled, round]);

  return (
    <section className="lg-game-stage adv-rescue">
      <p>Read the word to build the bridge!</p>
      <button type="button" className="lg-game-audio" onClick={() => speakWord(round.word)}>Hear word</button>
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
function SortStage({ sort, state }) {
  const { index, beltKey, wrongBin, sortItem } = state;
  const item = sort.items[index] || sort.items[sort.items.length - 1];

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
            onClick={() => sortItem(bin)}
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

  useEffect(() => {
    if (isSoundEnabled && round) speakWord(round.word);
  }, [isSoundEnabled, round]);

  return (
    <section className="lg-game-stage adv-garden">
      <p>Build the word to grow a flower!</p>
      <button type="button" className="lg-game-audio" onClick={() => speakWord(round.word)}>Hear word</button>
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

export function AdventureGame({ title, mode, difficulty = "easy", onScoreUpdate, onProgressUpdate, onComplete, isSoundEnabled = true }) {
  const [version, setVersion] = useState(0);
  const [index, setIndex] = useState(0);
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

  const rescue = useMemo(() => (mode === "rescue" ? buildRescueRounds(difficulty) : []), [mode, difficulty, version]);
  const sort = useMemo(() => (mode === "sort" ? buildSortRounds(difficulty) : null), [mode, difficulty, version]);
  const garden = useMemo(() => (mode === "garden" ? buildGardenRounds(difficulty) : []), [mode, difficulty, version]);
  const total = mode === "rescue" ? rescue.length : mode === "sort" ? sort.items.length : garden.length;

  useEffect(() => { onScoreUpdate?.(score); }, [onScoreUpdate, score]);
  useEffect(() => { onProgressUpdate?.(Math.min(index + 1, total), total || 1); }, [onProgressUpdate, index, total]);

  function finish(correctCount) {
    const earned = adventureStars(correctCount, total, wrongs);
    setStars(earned);
    setCompleted(true);
    if (isSoundEnabled) playCelebrationFanfare();
    onComplete?.(earned, score, correctCount);
  }

  function advance(correctCount) {
    if (index + 1 >= total) window.setTimeout(() => finish(correctCount), 600);
    else window.setTimeout(() => setIndex(i => i + 1), 600);
  }

  function miss(setter, value, replayWord) {
    setWrongs(w => w + 1);
    setter(value);
    if (isSoundEnabled) {
      playSoftBuzz();
      // Coach: hear the target again before retrying.
      if (replayWord) window.setTimeout(() => speakWord(replayWord), 650);
    }
    window.setTimeout(() => setter(""), 500);
  }

  function restart() {
    setVersion(v => v + 1);
    setIndex(0); setScore(0); setWrongs(0); setCompleted(false); setStars(0);
    setTyped([]); setGrown([]); setPlanks(0); setBeltKey(k => k + 1);
  }

  if (completed) return <Complete title={title} stars={stars} score={score} onRestart={restart} />;

  if (mode === "rescue") {
    const state = {
      index, planks, wrongWord,
      choose: word => {
        const round = rescue[index];
        if (!round || word !== round.word) { miss(setWrongWord, word, rescue[index]?.word); return; }
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
        const item = sort.items[index];
        if (!item || bin !== item.bin) { miss(setWrongBin, bin); return; }
        if (isSoundEnabled) playCorrectChime();
        setScore(s => s + 15);
        setBeltKey(k => k + 1);
        advance(index + 1);
      }
    };
    return <SortStage sort={sort} state={state} />;
  }

  const state = {
    index, typed, grown, wrongLetter,
    pickLetter: letter => {
      const round = garden[index];
      if (!round) return;
      const expected = round.word[typed.length];
      if (letter !== expected) { miss(setWrongLetter, letter, round.word); return; }
      const nextTyped = [...typed, letter];
      if (isSoundEnabled) playPopSound();
      setScore(s => s + 6);
      if (nextTyped.length >= round.word.length) {
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
