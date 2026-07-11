// SOUND SORT — two pens, one sound each.
//
// The ONLY shell that can teach an ALTERNATIVE PRONUNCIATION, and that makes it
// the most important one in Act III. `snow` and `cow` are both spelled `ow`;
// `book` and `moon` are both `oo`. Looking at the letters tells you nothing —
// you have to hear it. Every other shell in this game can, in principle, be
// beaten by matching shapes. This one cannot.
//
// Each word is TAPPABLE FOR AUDIO before you sort it. That is not a hint, it is
// the task: the child's job is to listen and decide, not to guess.

import { useState } from "react";
import { useAnswerOnce, sayWord, sayGrapheme, displayGrapheme } from "./shellContract.js";
import { hasWordAudio } from "../../../utils/questAudio.js";
import { playCorrectChime, playSoftBuzz, playPopSound } from "../../../utils/audio/gameSfx.js";

export default function SoundSort({ round, isSoundEnabled = true, onAnswer, onNext }) {
  const answerOnce = useAnswerOnce(round, onAnswer);
  const [sorted, setSorted] = useState({});
  const [slipped, setSlipped] = useState(false);
  const [held, setHeld] = useState(null);

  const remaining = round.items.filter(item => !sorted[item.word]);
  const done = remaining.length === 0;

  function tapWord(item) {
    if (isSoundEnabled && hasWordAudio(item.word)) sayWord(item.word, true);
    setHeld(held?.word === item.word ? null : item);
  }

  function tapPen(pen) {
    if (!held || done) return;
    const correct = held.pen === pen;

    if (!correct) {
      setSlipped(true);
      if (isSoundEnabled) playSoftBuzz();
      setHeld(null);
      return;
    }

    if (isSoundEnabled) playPopSound();
    const next = { ...sorted, [held.word]: pen };
    setSorted(next);
    setHeld(null);

    if (Object.keys(next).length === round.items.length) {
      // Correct only if they never put a word in the wrong pen. Otherwise a child
      // can brute-force every word into both pens and "master" the sound.
      answerOnce(!slipped, round.target);
      if (isSoundEnabled) playCorrectChime();
      setTimeout(() => onNext?.(), 1200);
    }
  }

  return (
    <div className="qs-shell qs-sort">
      <p className="qs-prompt">Which sound do you hear?</p>
      <p className="qs-hint">Tap a word to hear it. Then tap its pen.</p>

      <div className="qs-pens">
        {round.pens.map(pen => (
          <button
            key={pen}
            type="button"
            className={`qs-pen${held ? " is-live" : ""}`}
            disabled={!held || done}
            onClick={() => tapPen(pen)}
          >
            <span className="qs-pen-sound">
              {displayGrapheme(pen.split("_")[0])}
              <em
                role="presentation"
                onClick={e => { e.stopPropagation(); if (isSoundEnabled) sayGrapheme(pen, true); }}
              >
                hear
              </em>
            </span>
            <span className="qs-pen-words">
              {round.items.filter(i => sorted[i.word] === pen).map(i => (
                <span key={i.word}>{i.word}</span>
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="qs-sortpile">
        {remaining.map(item => (
          <button
            key={item.word}
            type="button"
            className={`qs-sortword${held?.word === item.word ? " is-held" : ""}`}
            onClick={() => tapWord(item)}
          >
            {item.word}
          </button>
        ))}
        {done && <p className="qs-word-reveal">All sorted.</p>}
      </div>
    </div>
  );
}
