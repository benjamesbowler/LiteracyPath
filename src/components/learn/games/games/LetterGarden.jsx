import { AdventureGame } from "./AdventureGame.jsx";
import { useMemo, useState } from "react";
import { CAST } from "../../../../features/soundSeekers/v3/content/cast.js";
import { WordPicture } from "./PhonicsPlayShared.jsx";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import { buildPhonicsGardenRounds } from "./phonicsBuildingRounds.js";
import "./phonics-building.css";

function Flower({ grown, kind = "sunflower" }) {
  const petals = kind === "rose" || kind === "poppy" ? "#e992a2" : kind === "bluebell" ? "#aaa0e4" : kind === "daisy" ? "#fff8e7" : "#ffdb76";
  const tree = /tree|bush/.test(kind);
  return <svg className={`pb-flower${grown ? " is-grown" : ""}`} viewBox="0 0 160 180" aria-hidden="true">
    <path d="M80 168Q70 105 82 61" fill="none" stroke="#44774a" strokeWidth="10" strokeLinecap="round" />
    <path d="M78 133Q19 151 25 105Q66 100 78 133M82 110Q130 131 137 84Q96 80 82 110" fill="#73a858" stroke="#44774a" strokeWidth="3" />
    {tree ? <><path d="M29 97Q3 45 41 29Q70 4 103 28Q148 30 135 83Q145 119 90 119Q43 128 29 97" fill="#73a858" stroke="#44774a" strokeWidth="3" />{[44,76,107,68].map((x,i)=><circle key={i} cx={x} cy={49+i*13} r="10" fill="#e992a2" />)}</> : <>{[0, 60, 120, 180, 240, 300].map(angle => <ellipse key={angle} cx="80" cy="29" rx="18" ry="29" transform={`rotate(${angle} 80 62)`} fill={petals} stroke="#d8a24c" strokeWidth="2" />)}<circle cx="80" cy="62" r="22" fill="#9b6339" /><circle cx="74" cy="57" r="3" fill="#fff0ae" /></>}
  </svg>;
}

function GardenBed({ rounds, state, isSoundEnabled }) {
  const round = rounds[state.index], solved = state.grown.some(item => item.id === round.id);
  const [wrong, setWrong] = useState("");
  const { canHear, replay } = useRecordedPracticeCue(round.word, isSoundEnabled && !state.paused, true, state.ownReplay);
  const letters = solved ? [...round.word] : [...round.sourceWord];
  const seeds = useMemo(() => {
    const expected = round.word[round.changeIndex], old = round.sourceWord[round.changeIndex];
    // Three plausible seeds keep the direct choice readable on small phones.
    // Difficulty comes from the word/grapheme contrast, never smaller targets.
    const count = 3;
    const chosen = new Set([expected, old, ...round.bank.filter(letter => letter !== expected && letter !== old).slice(0, count - 2)]);
    return round.bank.filter(letter => chosen.has(letter));
  }, [round]);
  function plant(letter) {
    if (state.paused || solved) return;
    const next = [...round.sourceWord]; next[round.changeIndex] = letter;
    if (next.join("") !== round.word) setWrong(`${letter} makes ${next.join("")}. We need ${round.word}. Change letter ${round.changeIndex + 1}.`);
    else setWrong("");
    state.pickLetter(letter);
  }
  return <section className={`pb-stage pb-garden${solved ? " is-grown" : ""}${state.paused ? " is-paused" : ""}`} data-building-game="garden" data-aw-mode="garden" data-aw-index={state.index} data-target={round.word} data-source={round.sourceWord} data-change-index={round.changeIndex} data-built={state.grown.length}>
    <header className="pb-hud">
      <div><strong>Change {round.sourceWord} to {round.word}</strong><p>Tap a seed for the highlighted letter.</p></div>
      <span className="pb-progress" aria-label={`${state.grown.length} of ${rounds.length} completed`}>{state.grown.length}/{rounds.length}</span>
      <button type="button" className="pb-replay" disabled={state.paused || !canHear} onClick={replay} aria-label="Hear target word"><span aria-hidden="true">♪</span></button>
    </header>
    <div className="pb-world">
      <div className="pb-garden-guide"><img src={CAST.woolly.heroSprite || CAST.woolly.sprite} alt={CAST.woolly.name} draggable="false" /></div>
      <div className="pb-garden-goal"><span>Grow</span><WordPicture key={round.word} word={round.word} /><strong>{round.word}</strong></div>
      <div className="pb-word-bed">
        <div className="pb-garden-row" role="group" aria-label="Word garden"><div className="pb-garden-letters">{letters.map((letter, index) => <span className={`pb-garden-letter${index === round.changeIndex ? " is-changing" : ""}${solved ? " is-solved" : ""}`} key={index} aria-label={`${index === round.changeIndex ? "Change " : ""}letter ${index + 1}: ${letter}`}>{letter}<span className="pb-letter-marker" aria-hidden="true">{index === round.changeIndex ? solved ? "✓" : "↓" : ""}</span></span>)}</div><Flower grown={solved} kind={round.flower} /></div>
        <div className="pb-piece-bank pb-seed-bank" role="group" aria-label="Letter seeds">{seeds.map(letter => <button type="button" key={letter} className="pb-tile pb-seed" data-seed={letter} disabled={state.paused || solved} onClick={() => plant(letter)} aria-label={`Plant ${letter}`}>{letter}<span aria-hidden="true">✦</span></button>)}</div>
      </div>
      <div className="pb-grown-garden" aria-label="Plants grown">{state.grown.slice(-5).map(item => <div key={item.id}><Flower grown kind={item.flower} /><span>{item.word}</span></div>)}</div>
    </div>
    <p className="pb-feedback" role="status" aria-live="polite">{solved ? `${round.sourceWord} becomes ${round.word}! Your flower is growing.` : wrong || `Keep the other letters. Change letter ${round.changeIndex + 1} to make ${round.word}.`}</p>
  </section>;
}

export function LetterGardenStage(props) {
  // A new word owns its own feedback and seeds; a previous error cannot leak
  // into the next bed or into a restored later checkpoint.
  return <GardenBed key={props.rounds[props.state.index].id} {...props} />;
}

export default function LetterGarden(props) {
  return <AdventureGame {...props} title="Letter Garden" mode="garden" stageComponents={{ garden: LetterGardenStage }} roundBuilders={{ garden: buildPhonicsGardenRounds }} />;
}
