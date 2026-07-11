// WORD BEAST — heart words, as a COLLECTION.
//
// Feed the Beast the right word three times and it JOINS you: the word becomes a
// creature that lives in your Den. Straight lift of Teach Your Monster's
// "Trickies", which is the best sight-word mechanic in the category — because it
// makes a sight word something you OWN, not a flashcard you endure.
//
// Heart words are the ones that CANNOT be sounded out ("the", "was", "said").
// The distractors are therefore other HEART words, never decodable ones: offer a
// decodable distractor and a child can win by sounding it out, which is the one
// skill this is deliberately not testing.

import { useEffect, useState } from "react";
import { useAnswerOnce, sayWord } from "./shellContract.js";
import { hasWordAudio } from "../../../utils/questAudio.js";
import { CREATURE_INK, CREATURE_PAPER } from "../../../data/creatureParts.js";
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare } from "../../../utils/audio/gameSfx.js";

const FEEDS_TO_TAME = 3;

export default function WordBeast({ round, isSoundEnabled = true, onAnswer, onNext }) {
  const answerOnce = useAnswerOnce(round, onAnswer);
  const [fed, setFed] = useState(0);
  const [picked, setPicked] = useState(null);
  const [tamed, setTamed] = useState(false);
  const [missed, setMissed] = useState(false);
  const canHear = hasWordAudio(round.word);

  useEffect(() => {
    if (isSoundEnabled) sayWord(round.word, true);
  }, [round, isSoundEnabled]);

  function feed(choice) {
    if (picked || tamed) return;
    const correct = choice === round.answer;
    setPicked({ choice, correct });

    if (!correct) {
      setMissed(true);
      if (isSoundEnabled) playSoftBuzz();
      // A miss does not reset the count. Losing three feeds' progress to one
      // slip is how a child decides the game hates them.
      setTimeout(() => setPicked(null), 900);
      return;
    }

    const next = fed + 1;
    setFed(next);
    if (isSoundEnabled) playCorrectChime();

    if (next >= FEEDS_TO_TAME) {
      setTamed(true);
      // ONE response per round, and it counts as correct only if they never fed
      // it the wrong word — otherwise taming is automatic and proves nothing.
      answerOnce(!missed, round.target);
      if (isSoundEnabled) setTimeout(playCelebrationFanfare, 260);
      setTimeout(() => onNext?.(), 1900);
      return;
    }

    setTimeout(() => setPicked(null), 620);
  }

  return (
    <div className="qs-shell qs-wordbeast">
      <p className="qs-prompt">
        The Beast is hungry for <strong className="qs-target">{round.word}</strong>
      </p>
      <p className="qs-hint">You can&rsquo;t sound this word out. You just have to know it.</p>

      <button
        type="button"
        className="qs-listen"
        disabled={!canHear}
        onClick={() => { if (isSoundEnabled) sayWord(round.word, true); }}
      >
        {canHear ? "Hear it" : "Listen"}
      </button>

      <div className={`qs-bigbeast${tamed ? " is-tamed" : ""}${picked?.correct ? " is-chewing" : ""}${picked && !picked.correct ? " is-spitting" : ""}`}>
        <svg viewBox="0 0 120 110" aria-hidden="true">
          <path d="M60,8 C92,8 112,32 112,62 C112,90 92,104 60,104 C28,104 8,90 8,62 C8,32 28,8 60,8 Z" fill="var(--q-accent)" />
          <path d="M8,68 C16,96 34,104 60,104 C86,104 104,96 112,68 C104,92 86,100 60,100 C34,100 16,92 8,68 Z" fill="var(--q-deep)" opacity="0.5" />
          <circle cx="42" cy="44" r="12" fill={CREATURE_PAPER} />
          <circle cx="78" cy="44" r="12" fill={CREATURE_PAPER} />
          <circle cx="45" cy="46" r="5.5" fill={CREATURE_INK} />
          <circle cx="81" cy="46" r="5.5" fill={CREATURE_INK} />
          <path className="qs-beast-mouth" d="M36,72 C46,90 74,90 84,72 Z" fill={CREATURE_INK} />
        </svg>
        <span className="qs-feeds" aria-label={`${fed} of ${FEEDS_TO_TAME} fed`}>
          {Array.from({ length: FEEDS_TO_TAME }, (_, i) => (
            <span key={i} className={i < fed ? "is-on" : ""} />
          ))}
        </span>
      </div>

      {tamed ? (
        <p className="qs-tamed-line">
          <strong>{round.word}</strong> joined you! It lives in your Den now.
        </p>
      ) : (
        <div className="qs-choices qs-wordcards">
          {round.choices.map(choice => {
            const isPicked = picked?.choice === choice;
            return (
              <button
                key={choice}
                type="button"
                className={`qs-wordcard${isPicked ? (picked.correct ? " is-right" : " is-wrong") : ""}`}
                disabled={Boolean(picked)}
                onClick={() => feed(choice)}
              >
                {choice}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
