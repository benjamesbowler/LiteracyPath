// THE GUIDE — a character gives you the task, not a text box.
//
// From the research doc, and it is right:
//
//   weak:   a text box says "Find words beginning with W."
//   strong: the Meadow guide says the windmill lost its /w/ wind. Catch the /w/
//           words to start it turning again.
//
// The first version of this was a big yellow square with a letter in it and a
// "Let's go" button. That is a flashcard with a drop shadow. A child does not
// travel anywhere for a flashcard.
//
// One guide per land, so the world has someone in it who knows you.

import { useEffect, useState } from "react";
import { sayGrapheme, sayLetterName, displayGrapheme } from "../shells/shellContract.js";
import { hasGraphemeAudio, letterNameSrc } from "../../../utils/questAudio.js";
import { CREATURE_INK, CREATURE_PAPER } from "../../../data/creatureParts.js";
import { playTapSound } from "../../../utils/audio/gameSfx.js";

const GUIDES = {
  meadow: { name: "Pip", line: g => `I found a new sound out here. Listen — it says ${g}.` },
  dino: { name: "Fen", line: g => `The old stones are humming. Hear it? That's ${g}.` },
  moonwood: { name: "Vale", line: g => `The dark is full of sounds. This one is ${g}.` }
};

export default function Guide({ world = "meadow", entry, isSoundEnabled, onNext, last }) {
  const guide = GUIDES[world] || GUIDES.meadow;
  const single = entry.id.length === 1 && /[a-z]/.test(entry.id);
  const canName = single && Boolean(letterNameSrc(entry.id));
  const canSound = hasGraphemeAudio(entry.id);

  // The painted guide, with the vector one as a net if the art isn't there yet.
  const [noArt, setNoArt] = useState(false);

  // The guide SAYS the sound the moment they show up. A child should not have to
  // hunt for a button to find out what the question is.
  useEffect(() => {
    if (isSoundEnabled) sayGrapheme(entry.id, true);
  }, [entry, isSoundEnabled]);

  return (
    <div className="qw-guide">
      <div className="qw-guide-body">
        {noArt ? (
          <svg viewBox="0 0 120 130" className="qw-guide-art" aria-hidden="true">
            <ellipse cx="60" cy="122" rx="34" ry="7" fill={CREATURE_INK} opacity="0.25" />
            <path d="M60,16 C88,16 104,38 104,68 C104,100 86,118 60,118 C34,118 16,100 16,68 C16,38 32,16 60,16 Z" fill="var(--q-accent)" />
            <path d="M16,76 C24,104 40,118 60,118 C80,118 96,104 104,76 C98,102 82,114 60,114 C38,114 22,102 16,76 Z" fill="var(--q-deep)" opacity="0.4" />
            <path d="M26,26 C18,10 26,2 40,8 C36,16 32,22 30,30 Z" fill="var(--q-deep)" />
            <path d="M94,26 C102,10 94,2 80,8 C84,16 88,22 90,30 Z" fill="var(--q-deep)" />
            <circle cx="44" cy="60" r="13" fill={CREATURE_PAPER} />
            <circle cx="78" cy="60" r="13" fill={CREATURE_PAPER} />
            <circle cx="47" cy="62" r="6" fill={CREATURE_INK} />
            <circle cx="81" cy="62" r="6" fill={CREATURE_INK} />
            <path d="M48,88 C56,98 70,98 78,88" stroke={CREATURE_INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>
        ) : (
          <img
            className="qw-guide-art"
            src={`/images/quest/props/guide-${world}.webp`}
            alt=""
            aria-hidden="true"
            draggable="false"
            onError={() => setNoArt(true)}
          />
        )}

        <div className="qw-bubble">
          <span className="qw-guide-name">{guide.name}</span>
          <p className="qw-guide-line">{guide.line(displayGrapheme(entry.id))}</p>

          <button
            type="button"
            className="qw-bigsound"
            disabled={!canSound}
            onClick={() => { if (isSoundEnabled) { playTapSound(); sayGrapheme(entry.id, true); } }}
          >
            {displayGrapheme(entry.id)}
          </button>

          {canName && (
            <button
              type="button"
              className="qw-listen"
              onClick={() => { if (isSoundEnabled) sayLetterName(entry.id, true); }}
            >
              What is it called?
            </button>
          )}

          {/* Example words: not a lesson, just three things it lives in. */}
          {entry.examples?.length > 0 && (
            <p className="qw-guide-eg">{entry.examples.join(" · ")}</p>
          )}

          <button type="button" className="qw-go" onClick={onNext}>
            {last ? "Let's go" : "What else?"}
          </button>
        </div>
      </div>
    </div>
  );
}
