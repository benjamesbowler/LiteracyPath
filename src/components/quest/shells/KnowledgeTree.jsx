// THE KNOWLEDGE TREE — the teaching moment. NOT a game.
//
// Explicit instruction before practice: this is the part of the Science of
// Reading that a pile of mini-games on its own does not give you. A child meets
// the sound here, properly, before anyone asks them to do anything with it.
//
// It says the LETTER NAME as well as the SOUND. Teach Your Monster never says
// letter names, and it is one of the loudest complaints in their parent reviews
// — you cannot tell a child "the letters s and h together say /sh/" if they
// cannot name s.

import { useEffect, useState } from "react";
import { sayGrapheme, sayLetterName, sayWord, displayGrapheme, hushCue } from "./shellContract.js";
import { hasGraphemeAudio, hasWordAudio, letterNameSrc } from "../../../utils/questAudio.js";
import { playTapSound } from "../../../utils/audio/gameSfx.js";

export default function KnowledgeTree({ entries = [], isSoundEnabled = true, onDone }) {
  const [i, setI] = useState(0);
  const entry = entries[i];

  useEffect(() => {
    if (!entry) return;
    // Sound first, name second: the sound is what they will use to read.
    if (isSoundEnabled) sayGrapheme(entry.id, true);
    return () => hushCue();
  }, [entry, isSoundEnabled]);

  if (!entry) return null;

  const single = entry.id.length === 1 && /[a-z]/.test(entry.id);
  const canName = single && Boolean(letterNameSrc(entry.id));
  const canSound = hasGraphemeAudio(entry.id);
  const last = i === entries.length - 1;

  return (
    <div className="qs-shell qs-teach">
      <p className="qs-prompt">A new sound</p>

      <div className="qs-glyph" aria-label={`the sound ${entry.id}`}>
        {displayGrapheme(entry.id)}
      </div>

      <div className="qs-teach-buttons">
        <button
          type="button"
          className="qs-listen"
          disabled={!canSound}
          onClick={() => { if (isSoundEnabled) { playTapSound(); sayGrapheme(entry.id, true); } }}
        >
          {canSound ? "Hear the sound" : "No sound yet"}
        </button>
        {canName && (
          <button
            type="button"
            className="qs-listen is-ghost"
            onClick={() => { if (isSoundEnabled) sayLetterName(entry.id, true); }}
          >
            Hear its name
          </button>
        )}
      </div>

      <p className="qs-hint">Tap a word to hear it.</p>
      <div className="qs-examples">
        {entry.examples.map(word => (
          <button
            key={word}
            type="button"
            className="qs-example"
            disabled={!hasWordAudio(word)}
            onClick={() => { if (isSoundEnabled) sayWord(word, true); }}
          >
            {word}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="qs-primary"
        onClick={() => (last ? onDone?.() : setI(n => n + 1))}
      >
        {last ? "I'm ready" : "Next sound"}
      </button>

      <div className="qs-pips" aria-hidden="true">
        {entries.map((e, n) => <span key={e.id} className={n <= i ? "is-on" : ""} />)}
      </div>
    </div>
  );
}
