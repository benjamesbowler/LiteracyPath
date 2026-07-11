// SOUND STONES — hear the sound, tap the letter that makes it.
// Direction: sound -> letter. The classic GPC recognition drill.

import { useEffect, useState } from "react";
import { useAnswerOnce, sayGrapheme, displayGrapheme } from "./shellContract.js";
import { hasGraphemeAudio } from "../../../utils/questAudio.js";
import { playCorrectChime, playSoftBuzz, playTapSound } from "../../../utils/audio/gameSfx.js";

export default function SoundStones({ round, isSoundEnabled = true, onAnswer, onNext }) {
  const answerOnce = useAnswerOnce(round, onAnswer);
  const [picked, setPicked] = useState(null);
  const canHear = hasGraphemeAudio(round.target);

  // Play the cue the moment the round appears — the child should not have to
  // hunt for a button to find out what the question is.
  //
  // NOTE there is no state reset here. StopRunner remounts this component with a
  // fresh key for every round attempt, so `picked` resets by construction. Doing
  // it with setState-in-an-effect both trips the lint rule and leaves a real
  // hole: when the catch-up queue re-serves the SAME round index (which happens
  // whenever a shell has one target left and the child misses it), the key
  // wouldn't change, the component wouldn't remount, and the child would be
  // locked out of a round they'd already answered.
  useEffect(() => {
    if (isSoundEnabled) sayGrapheme(round.target, true);
  }, [round, isSoundEnabled]);

  function choose(choice) {
    if (picked) return;
    const correct = choice === round.answer;
    setPicked({ choice, correct });
    if (isSoundEnabled) (correct ? playCorrectChime : playSoftBuzz)();
    answerOnce(correct, round.target);
    // Wrong answers linger a beat longer, and the RIGHT stone lights up — a
    // child who guessed must still see the answer, or the miss teaches nothing.
    setTimeout(() => onNext?.(), correct ? 620 : 1150);
  }

  return (
    <div className="qs-shell qs-stones">
      <p className="qs-prompt">Which stone makes this sound?</p>

      <button
        type="button"
        className="qs-listen"
        disabled={!canHear}
        onClick={() => { if (isSoundEnabled) { playTapSound(); sayGrapheme(round.target, true); } }}
      >
        {canHear ? "Hear it again" : "Listen"}
      </button>

      <div className="qs-choices">
        {round.choices.map(choice => {
          const isPicked = picked?.choice === choice;
          const reveal = picked && choice === round.answer;
          return (
            <button
              key={choice}
              type="button"
              className={`qs-stone${isPicked ? (picked.correct ? " is-right" : " is-wrong") : ""}${reveal && !isPicked ? " is-reveal" : ""}`}
              disabled={Boolean(picked)}
              onClick={() => choose(choice)}
            >
              <span className="qs-stone-face">{displayGrapheme(choice)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
