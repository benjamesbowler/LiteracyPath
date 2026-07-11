// STORY STONES — a real page, read for meaning.
//
// The payoff for the whole trail. Every word on the page is decodable by this
// stop or a heart word already taught, and tools/checkQuestIntegrity.js fails
// the build otherwise — which is the only thing standing between "a page" and
// "a page the child cannot read".
//
// EVERY WORD IS TAPPABLE FOR AUDIO. That is the single most-requested missing
// feature in Teach Your Monster's reviews, and it costs us nothing: a child who
// gets stuck on one word can unstick themselves instead of giving up on the
// sentence.
//
// It scores NO mastery. Reading a page is not a grapheme response, and pretending
// it is would inflate every record. The choice at the end is a real choice about
// the story, not a right answer.

import { useState } from "react";
import { sayWord } from "./shellContract.js";
import { hasWordAudio } from "../../../utils/questAudio.js";
import { playTapSound, playPopSound } from "../../../utils/audio/gameSfx.js";

const cleanWord = w => w.replace(/[^A-Za-z'-]/g, "");

export default function StoryStones({ round, isSoundEnabled = true, onNext }) {
  const [chosen, setChosen] = useState(null);

  function choose(choice) {
    if (chosen) return;
    setChosen(choice);
    if (isSoundEnabled) playPopSound();
    setTimeout(() => onNext?.(), 900);
  }

  return (
    <div className="qs-shell qs-story">
      <p className="qs-prompt">Read the page.</p>

      <p className="qs-page">
        {round.text.split(/(\s+)/).map((token, i) => {
          if (!token.trim()) return <span key={i}>{token}</span>;
          const word = cleanWord(token);
          const speakable = word && hasWordAudio(word);
          return (
            <button
              key={i}
              type="button"
              className={`qs-pageword${speakable ? "" : " is-mute"}`}
              disabled={!speakable}
              onClick={() => { if (isSoundEnabled) { playTapSound(); sayWord(word, true); } }}
            >
              {token}
            </button>
          );
        })}
      </p>
      <p className="qs-hint">Stuck on a word? Tap it.</p>

      <div className="qs-storychoices">
        {round.choices.map(choice => (
          <button
            key={choice}
            type="button"
            className={`qs-storychoice${chosen === choice ? " is-on" : ""}`}
            disabled={Boolean(chosen)}
            onClick={() => choose(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
