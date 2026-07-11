// BEAST FEED — see the letter, tap the beast that SAYS it.
// Direction: letter -> sound. The reverse of Sound Stones.
//
// This shell exists for one reason: mastery rule 3 ("proved in >= 2 different
// shells"). A child who has learnt "the sh stone is the third one" can pass
// Sound Stones forever without reading. They cannot pass this.

import { useEffect, useState } from "react";
import { useAnswerOnce, sayGrapheme, displayGrapheme, hushCue } from "./shellContract.js";
import { hasGraphemeAudio } from "../../../utils/questAudio.js";
import { playCorrectChime, playSoftBuzz } from "../../../utils/audio/gameSfx.js";
// Ink and paper — the two colours a dye never changes. Imported rather than
// typed, so the beast's eyes match the creature's exactly.
import { CREATURE_INK, CREATURE_PAPER } from "../../../data/creatureParts.js";

export default function BeastFeed({ round, isSoundEnabled = true, onAnswer, onNext }) {
  const answerOnce = useAnswerOnce(round, onAnswer);
  const [picked, setPicked] = useState(null);
  const [heard, setHeard] = useState([]);

  // No state reset here: StopRunner remounts with a fresh key per round attempt.
  // See the note in SoundStones.jsx.
  useEffect(() => () => hushCue(), [round]);

  // The child taps a beast to HEAR it, then taps again to feed it. Two-stage on
  // purpose: they must listen before they commit, which is the whole skill.
  function tap(choice) {
    if (picked) return;
    if (!heard.includes(choice)) {
      if (isSoundEnabled) sayGrapheme(choice, true);
      setHeard(list => [...list, choice]);
      return;
    }
    const correct = choice === round.answer;
    setPicked({ choice, correct });
    if (isSoundEnabled) (correct ? playCorrectChime : playSoftBuzz)();
    answerOnce(correct, round.target);
    setTimeout(() => onNext?.(), correct ? 620 : 1150);
  }

  return (
    <div className="qs-shell qs-feed">
      <p className="qs-prompt">
        Feed the beast that says <strong className="qs-target">{displayGrapheme(round.target)}</strong>
      </p>
      <p className="qs-hint">Tap a beast to hear it. Tap again to feed it.</p>

      <div className="qs-choices">
        {round.choices.map(choice => {
          const isPicked = picked?.choice === choice;
          const reveal = picked && choice === round.answer;
          const listened = heard.includes(choice);
          const mute = !hasGraphemeAudio(choice);
          return (
            <button
              key={choice}
              type="button"
              className={`qs-beast${listened ? " is-heard" : ""}${isPicked ? (picked.correct ? " is-right" : " is-wrong") : ""}${reveal && !isPicked ? " is-reveal" : ""}`}
              disabled={Boolean(picked)}
              onClick={() => tap(choice)}
              aria-label={listened ? `Feed the beast that says ${choice}` : "Hear this beast"}
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <path d="M50,12 C74,12 88,30 88,54 C88,78 72,90 50,90 C28,90 12,78 12,54 C12,30 26,12 50,12 Z" fill="var(--q-accent)" />
                <path d="M12,60 C20,84 34,90 50,90 C66,90 80,84 88,60 C82,80 68,86 50,86 C32,86 18,80 12,60 Z" fill="var(--q-deep)" opacity="0.55" />
                <circle cx="36" cy="46" r="9" fill={CREATURE_PAPER} />
                <circle cx="64" cy="46" r="9" fill={CREATURE_PAPER} />
                <circle cx="38" cy="47" r="4" fill={CREATURE_INK} />
                <circle cx="66" cy="47" r="4" fill={CREATURE_INK} />
                <path d="M34,66 C42,76 58,76 66,66 Z" fill={CREATURE_INK} />
              </svg>
              {/* The letter is NEVER drawn on the beast — that would turn a
                  listening task into a matching task. Only the mute badge shows. */}
              {mute && <span className="qs-mute" aria-hidden="true">no sound yet</span>}
              {listened && <span className="qs-heard-tick" aria-hidden="true">heard</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
