// TRAIL SIGNS — reading with a CONSEQUENCE.
//
// A sign says "Tap the red rock." You do it, or you don't. There is no score to
// game, no shape to match, no audio to lean on — the ONLY way through is to read
// the words. This is where decoding turns into comprehension, and it is the one
// shell where the Listen button is deliberately absent.

import { useState } from "react";
import { useAnswerOnce } from "./shellContract.js";
import { playCorrectChime, playSoftBuzz } from "../../../utils/audio/gameSfx.js";
import { CREATURE_INK } from "../../../data/creatureParts.js";

// Props are drawn, not photographed — a WebP of a rock would need an art order,
// and this needs to work today.
const ART = {
  rock: "M14,52 C10,34 24,16 42,14 C60,12 74,26 74,44 C74,54 66,58 44,58 C26,58 17,58 14,52 Z",
  log: "M8,30 L64,26 C74,25 78,32 78,40 C78,48 74,54 64,54 L8,50 C2,50 2,30 8,30 Z",
  bug: "M44,14 C58,14 68,26 68,40 C68,52 58,60 44,60 C30,60 20,52 20,40 C20,26 30,14 44,14 Z",
  cup: "M18,20 L70,20 L64,58 C63,62 60,64 56,64 L32,64 C28,64 25,62 24,58 Z",
  fish: "M12,38 C22,20 48,18 62,32 L78,20 L74,38 L78,56 L62,44 C48,58 22,56 12,38 Z",
  nut: "M44,12 C60,12 70,26 70,42 C70,56 58,64 44,64 C30,64 18,56 18,42 C18,26 28,12 44,12 Z"
};

const COLOUR_VAR = {
  red: "var(--q-sign-red)",
  green: "var(--q-sign-green)",
  black: "var(--q-sign-black)"
};

export default function TrailSigns({ round, isSoundEnabled = true, onAnswer, onNext }) {
  const answerOnce = useAnswerOnce(round, onAnswer);
  const [picked, setPicked] = useState(null);

  function tap(thing) {
    if (picked) return;
    const correct = thing.id === round.answer;
    setPicked({ id: thing.id, correct });
    if (isSoundEnabled) (correct ? playCorrectChime : playSoftBuzz)();
    answerOnce(correct, round.target);
    setTimeout(() => onNext?.(), correct ? 700 : 1250);
  }

  return (
    <div className="qs-shell qs-signs">
      {/* No Listen button, by design. If the app reads the sign aloud, the child
          never has to. This is the shell that makes reading do something. */}
      <div className="qs-sign">{round.text}</div>

      <div className="qs-things">
        {round.things.map(thing => {
          const isPicked = picked?.id === thing.id;
          const fill = thing.colour ? COLOUR_VAR[thing.colour] : "var(--q-accent)";
          return (
            <button
              key={thing.id}
              type="button"
              className={`qs-thing${isPicked ? (picked.correct ? " is-right" : " is-wrong") : ""}`}
              disabled={Boolean(picked)}
              onClick={() => tap(thing)}
              aria-label={thing.word}
            >
              <svg viewBox="0 0 88 76" aria-hidden="true">
                <path d={ART[thing.id]} fill={fill} stroke={CREATURE_INK} strokeWidth="3" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}
      </div>

      {picked && !picked.correct && <p className="qs-hint">Read the sign again.</p>}
    </div>
  );
}
