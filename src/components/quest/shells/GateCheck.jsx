// THE GATE — the mastery check.
//
// Six items, no hints, no "hear it again", no second chances. The child is not
// told they failed, and the door ALWAYS opens: this measures, it does not block.
// What changes is which stones light up on the Den wall.
//
// It reuses the Sound Stones and Beast Feed rounds rather than inventing a
// third format, because a check should look like the thing it is checking.

import { useEffect, useState } from "react";
import SoundStones from "./SoundStones.jsx";
import BeastFeed from "./BeastFeed.jsx";

export default function GateCheck({ rounds = [], isSoundEnabled = true, onAnswer, onDone }) {
  const [i, setI] = useState(0);
  const round = rounds[i];

  useEffect(() => {
    if (!rounds.length) onDone?.();
  }, [rounds.length, onDone]);

  if (!round) return null;

  const next = () => {
    if (i + 1 >= rounds.length) onDone?.();
    else setI(n => n + 1);
  };

  const Shell = round.shell === "beast-feed" ? BeastFeed : SoundStones;

  return (
    <div className="qs-gate">
      <div className="qs-gate-head">
        <span className="qs-gate-title">The Gate</span>
        <span className="qs-gate-count">{i + 1} of {rounds.length}</span>
      </div>

      {/* No Listen-again button, no hint line: the shells read `gate` and hide
          their help. A check with a help button is a practice round. */}
      <div className="qs-gate-body" data-gate="">
        <Shell
          key={i}
          round={round}
          isSoundEnabled={isSoundEnabled}
          onAnswer={onAnswer}
          onNext={next}
        />
      </div>
    </div>
  );
}
