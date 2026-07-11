// TRAIL RUN — the same recognition, but FAST.
//
// Fluency is not knowing a sound. It is knowing it without stopping to think.
// The fork rushes toward you; you take the one signed with the sound you just
// heard. Same question as Sound Stones, different pressure — which is also why
// it counts as a genuinely SECOND SHELL toward mastery.
//
// RUNNING OUT OF TIME IS A MISS, NOT A DEATH. There is no fail state, no lives,
// no restart. The sound simply comes back, later, in a different game. A timer
// that punishes is a timer that teaches a child to freeze.

import { useEffect, useRef, useState } from "react";
import { useAnswerOnce, sayGrapheme, displayGrapheme } from "./shellContract.js";
import { hasGraphemeAudio } from "../../../utils/questAudio.js";
import { playCorrectChime, playSoftBuzz, playWhoosh } from "../../../utils/audio/gameSfx.js";

const TICK_MS = 100;

export default function TrailRun({ round, isSoundEnabled = true, onAnswer, onNext }) {
  const answerOnce = useAnswerOnce(round, onAnswer);
  const [picked, setPicked] = useState(null);
  const [left, setLeft] = useState(round.seconds * 1000);
  const timer = useRef(null);
  const canHear = hasGraphemeAudio(round.target);

  useEffect(() => {
    if (isSoundEnabled) { playWhoosh(); sayGrapheme(round.target, true); }
  }, [round, isSoundEnabled]);

  // The countdown, and the timeout, in ONE effect.
  //
  // They were two: an interval that ticked `left` to zero, and a second effect
  // that reacted to left===0 by calling setState in its body. That is a
  // cascading render (and a lint error) — and worse, it is a re-entrancy hazard:
  // the second effect re-runs on every dependency change, so a child could be
  // marked wrong twice for one round. Handling the timeout inside the tick
  // callback makes the miss fire exactly once, by construction.
  useEffect(() => {
    if (picked) return undefined;
    let over = null;

    timer.current = setInterval(() => {
      setLeft(ms => {
        if (ms > TICK_MS) return ms - TICK_MS;
        clearInterval(timer.current);
        // Time up = a MISS, not a death. No lives, no restart, no fail screen.
        // The sound simply comes back later, in a different game. A timer that
        // punishes is a timer that teaches a child to freeze.
        setPicked({ choice: null, correct: false, timeout: true });
        if (isSoundEnabled) playSoftBuzz();
        answerOnce(false, round.target);
        over = setTimeout(() => onNext?.(), 1250);
        return 0;
      });
    }, TICK_MS);

    return () => {
      clearInterval(timer.current);
      if (over) clearTimeout(over);
    };
  }, [picked, answerOnce, round.target, isSoundEnabled, onNext]);

  function choose(choice) {
    if (picked) return;
    clearInterval(timer.current);
    const correct = choice === round.answer;
    setPicked({ choice, correct });
    if (isSoundEnabled) (correct ? playCorrectChime : playSoftBuzz)();
    answerOnce(correct, round.target);
    setTimeout(() => onNext?.(), correct ? 560 : 1150);
  }

  const pct = Math.max(0, (left / (round.seconds * 1000)) * 100);

  return (
    <div className="qs-shell qs-run">
      <p className="qs-prompt">Take the path that makes this sound!</p>

      <button
        type="button"
        className="qs-listen"
        disabled={!canHear || Boolean(picked)}
        onClick={() => { if (isSoundEnabled) sayGrapheme(round.target, true); }}
      >
        {canHear ? "Hear it" : "Listen"}
      </button>

      <div className="qs-timer" aria-label={`${Math.ceil(left / 1000)} seconds left`}>
        <span className="qs-timer-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="qs-forks">
        {round.choices.map(choice => {
          const isPicked = picked?.choice === choice;
          const reveal = picked && choice === round.answer;
          return (
            <button
              key={choice}
              type="button"
              className={`qs-fork${isPicked ? (picked.correct ? " is-right" : " is-wrong") : ""}${reveal && !isPicked ? " is-reveal" : ""}`}
              disabled={Boolean(picked)}
              onClick={() => choose(choice)}
            >
              <span className="qs-fork-post" aria-hidden="true" />
              <span className="qs-fork-sign">{displayGrapheme(choice)}</span>
            </button>
          );
        })}
      </div>

      {picked?.timeout && <p className="qs-hint">Too slow that time. It&rsquo;ll come back.</p>}
    </div>
  );
}
