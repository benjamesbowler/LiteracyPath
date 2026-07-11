// STONE BRIDGE — hear the word, lay one plank per sound, in order.
// This is BLENDING: the skill that turns letter knowledge into reading.

import { useEffect, useState } from "react";
import { useAnswerOnce, sayWord, sayGrapheme, displayGrapheme } from "./shellContract.js";
import { hasWordAudio } from "../../../utils/questAudio.js";
import { playCorrectChime, playSoftBuzz, playPopSound } from "../../../utils/audio/gameSfx.js";

export default function StoneBridge({ round, isSoundEnabled = true, onAnswer, onNext }) {
  const answerOnce = useAnswerOnce(round, onAnswer);
  const [laid, setLaid] = useState([]);
  const [wobble, setWobble] = useState(null);
  const [done, setDone] = useState(false);
  const [slipped, setSlipped] = useState(false);
  const canHear = hasWordAudio(round.word);

  // No state reset here: StopRunner remounts with a fresh key per round attempt.
  // See the note in SoundStones.jsx.
  useEffect(() => {
    if (isSoundEnabled) sayWord(round.word, true);
  }, [round, isSoundEnabled]);

  function tapTile(tile, index) {
    if (done) return;
    const expected = round.planks[laid.length];

    if (tile !== expected) {
      // The plank WOBBLES. It does not drop the child in the river. A blending
      // error is a thinking error, and punishing it with a fail screen teaches
      // a child to stop trying rather than to try again.
      setWobble(index);
      setSlipped(true);
      if (isSoundEnabled) playSoftBuzz();
      setTimeout(() => setWobble(null), 420);
      return;
    }

    const next = [...laid, { tile, from: index }];
    setLaid(next);
    if (isSoundEnabled) { playPopSound(); sayGrapheme(tile, true); }

    if (next.length === round.planks.length) {
      setDone(true);
      // The child got there. Whether it counts as a CORRECT response depends on
      // whether they got there without slipping — otherwise every word is a
      // guaranteed 100%, and mastery means nothing.
      const clean = !slipped;
      if (isSoundEnabled) setTimeout(() => { playCorrectChime(); sayWord(round.word, true); }, 260);
      answerOnce(clean, round.target);
      setTimeout(() => onNext?.(), 1500);
    }
  }

  const usedFrom = new Set(laid.map(l => l.from));

  return (
    <div className="qs-shell qs-bridge">
      <p className="qs-prompt">Build the bridge. One plank for each sound.</p>

      <button
        type="button"
        className="qs-listen"
        disabled={!canHear}
        onClick={() => { if (isSoundEnabled) sayWord(round.word, true); }}
      >
        {canHear ? "Hear the word" : "Listen"}
      </button>

      <div className="qs-bridge-span">
        {round.planks.map((plank, i) => {
          const placed = laid[i];
          return (
            <span key={i} className={`qs-plank${placed ? " is-laid" : ""}`}>
              {placed ? displayGrapheme(placed.tile) : ""}
            </span>
          );
        })}
      </div>

      {done && <p className="qs-word-reveal">{round.word}</p>}

      <div className="qs-tray">
        {round.tray.map((tile, i) => (
          <button
            key={`${tile}-${i}`}
            type="button"
            className={`qs-tile${usedFrom.has(i) ? " is-used" : ""}${wobble === i ? " is-wobble" : ""}`}
            disabled={usedFrom.has(i) || done}
            onClick={() => tapTile(tile, i)}
          >
            {displayGrapheme(tile)}
          </button>
        ))}
      </div>
    </div>
  );
}
