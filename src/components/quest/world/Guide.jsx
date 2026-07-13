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

import { useEffect } from "react";
import { sayGrapheme, sayLetterName, displayGrapheme } from "../shells/shellContract.js";
import { hasGraphemeAudio, letterNameSrc } from "../../../utils/questAudio.js";
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

  // The guide SAYS the sound the moment they show up. A child should not have to
  // hunt for a button to find out what the question is.
  useEffect(() => {
    if (isSoundEnabled) sayGrapheme(entry.id, true);
  }, [entry, isSoundEnabled]);

  return (
    <div className="qw-guide">
      <div className="qw-guide-body">
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
