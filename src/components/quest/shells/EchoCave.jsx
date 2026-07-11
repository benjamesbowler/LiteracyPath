// ECHO CAVE — hear the word, tap out its sounds in order. The cave echoes each
// one back.
//
// This is SEGMENTING, the reverse of blending, and it is the skill that becomes
// spelling. A child who can blend but not segment can read and cannot write.
//
// Unlike the Stone Bridge there are no empty planks showing the shape of the
// answer — they have to hold the sounds in their head and pull them out in
// order. That is the whole difficulty, and it is the point.

import { useEffect, useState } from "react";
import { useAnswerOnce, sayWord, sayGrapheme, displayGrapheme } from "./shellContract.js";
import { hasWordAudio } from "../../../utils/questAudio.js";
import { playCorrectChime, playSoftBuzz, playPopSound } from "../../../utils/audio/gameSfx.js";

export default function EchoCave({ round, isSoundEnabled = true, onAnswer, onNext }) {
  const answerOnce = useAnswerOnce(round, onAnswer);
  const [said, setSaid] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [slipped, setSlipped] = useState(false);
  const [done, setDone] = useState(false);
  const canHear = hasWordAudio(round.word);

  // No state reset here: StopRunner remounts with a fresh key per round attempt.
  useEffect(() => {
    if (isSoundEnabled) sayWord(round.word, true);
  }, [round, isSoundEnabled]);

  function tapKey(key) {
    if (done) return;
    const expected = round.sounds[said.length];

    if (key !== expected) {
      setWrong(key);
      setSlipped(true);
      if (isSoundEnabled) playSoftBuzz();
      setTimeout(() => setWrong(null), 420);
      return;
    }

    const next = [...said, key];
    setSaid(next);
    if (isSoundEnabled) { playPopSound(); sayGrapheme(key, true); }

    if (next.length === round.sounds.length) {
      setDone(true);
      // Correct ONLY if they got there without a wrong tap. Otherwise every word
      // is a guaranteed pass and the mastery record is fiction.
      answerOnce(!slipped, round.target);
      if (isSoundEnabled) setTimeout(() => { playCorrectChime(); sayWord(round.word, true); }, 280);
      setTimeout(() => onNext?.(), 1500);
    }
  }

  return (
    <div className="qs-shell qs-echo">
      <p className="qs-prompt">What sounds do you hear?</p>

      <button
        type="button"
        className="qs-listen"
        disabled={!canHear}
        onClick={() => { if (isSoundEnabled) sayWord(round.word, true); }}
      >
        {canHear ? "Hear the word" : "Listen"}
      </button>

      {/* The echoes: what they have said back so far. Empty slots are dots, not
          blanks — a blank the same width as the answer is a hint. */}
      <div className="qs-echoes">
        {round.sounds.map((_, i) => (
          <span key={i} className={`qs-echo-slot${said[i] ? " is-said" : ""}`}>
            {said[i] ? displayGrapheme(said[i]) : "·"}
          </span>
        ))}
      </div>

      {done && <p className="qs-word-reveal">{round.word}</p>}

      <div className="qs-keys">
        {round.keys.map(key => (
          <button
            key={key}
            type="button"
            className={`qs-key${wrong === key ? " is-wobble" : ""}`}
            disabled={done}
            onClick={() => tapKey(key)}
          >
            {displayGrapheme(key)}
          </button>
        ))}
      </div>
    </div>
  );
}
