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
import { sayGraphemeWithName, displayGrapheme } from "../shells/shellContract.js";
import { hasGraphemeAudio } from "../../../utils/questAudio.js";
import { playTapSound } from "../../../utils/audio/gameSfx.js";

const GUIDES = {
  meadow: { name: "Pip" },
  dino: { name: "Fen" },
  moonwood: { name: "Vale" }
};

export default function Guide({ world = "meadow", entries = [], entry, isSoundEnabled, onNext }) {
  const guide = GUIDES[world] || GUIDES.meadow;
  const sounds = entries.length ? entries : entry ? [entry] : [];
  const firstSound = sounds[0]?.id;

  // The guide SAYS the sound the moment they show up. A child should not have to
  // hunt for a button to find out what the question is.
  useEffect(() => {
    if (isSoundEnabled && firstSound) sayGraphemeWithName(firstSound, true);
  }, [firstSound, isSoundEnabled]);

  if (!sounds.length) return null;

  return (
    <div className="qw-guide">
      <div className="qw-guide-body">
        <div className="qw-bubble">
          <span className="qw-guide-name">{guide.name}</span>
          <p className="qw-guide-line">Listen to today&apos;s sounds.</p>

          <div className="qw-sound-row" aria-label="Today&apos;s sounds">
            {sounds.map(sound => (
              <button
                key={sound.id}
                type="button"
                className="qw-bigsound"
                disabled={!hasGraphemeAudio(sound.id)}
                onClick={() => { if (isSoundEnabled) { playTapSound(); sayGraphemeWithName(sound.id, true); } }}
                aria-label={`Hear the sound ${displayGrapheme(sound.id)}`}
              >
                {displayGrapheme(sound.id)}
              </button>
            ))}
          </div>

          <button type="button" className="qw-go" onClick={onNext}>
            Let&apos;s go
          </button>
        </div>
      </div>
    </div>
  );
}
