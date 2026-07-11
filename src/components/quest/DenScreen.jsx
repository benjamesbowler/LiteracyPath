// THE DEN — home base, and the trophy cabinet.
//
// The Stone Wall is the honest signal, and it is the ONLY place the two tracks
// are visible side by side: a stone lights when its sound is MASTERED, not when
// the stop is passed. A child can have walked ten stops and have four lit
// stones, and that is not a punishment — it is the truth, and it is the thing
// a parent can look at and understand in one second.

import CreatureFigure from "./CreatureFigure.jsx";
import ParallaxScene from "./ParallaxScene.jsx";
import { QUEST_STOPS, taughtThrough } from "../../data/questSequence.js";
import { isMastered, MASTERY_STATES } from "../../utils/questMastery.js";
import { availableSparks, currentStopIndex } from "../../utils/questProgress.js";
import { displayGrapheme } from "./shells/shellContract.js";

// Only show stones for sounds the child could plausibly have met — an empty
// wall of 103 sockets on day one is a wall of things you haven't done.
const WALL_LOOKAHEAD = 8;

export default function DenScreen({ state, onWalk, onEditCreature }) {
  const index = currentStopIndex(state);
  const visible = [...taughtThrough(Math.min(QUEST_STOPS.length, index + WALL_LOOKAHEAD))];
  const lit = visible.filter(g => isMastered(state.mastery, g)).length;

  return (
    <div className="q-screen q-den">
      <ParallaxScene world="meadow" offset={0} className="q-den-scene">
        <div className="q-den-creature">
          <CreatureFigure creature={state.creature} size={190} mood="idle" />
        </div>
      </ParallaxScene>

      <div className="q-den-panel">
        <div className="q-den-head">
          <h1 className="q-title">Your Den</h1>
          <span className="q-sparks" title="Sparks">{availableSparks(state)}</span>
        </div>

        <h2 className="q-subhead">
          The Stone Wall <span className="q-count">{lit} of {visible.length} lit</span>
        </h2>
        <p className="q-note">A stone lights up when you really know its sound — not just when you walk past it.</p>

        <div className="q-wall">
          {visible.map(g => {
            const record = state.mastery?.[g];
            const state_ = record?.state || MASTERY_STATES.NOT_STARTED;
            return (
              <span key={g} className={`q-stone q-stone-${state_}`} title={state_.replace("-", " ")}>
                {displayGrapheme(g)}
              </span>
            );
          })}
        </div>

        {state.trickies.length > 0 && (
          <>
            <h2 className="q-subhead">Your Trickies <span className="q-count">{state.trickies.length}</span></h2>
            <div className="q-trickies">
              {state.trickies.map(word => <span key={word} className="q-trickie">{word}</span>)}
            </div>
          </>
        )}

        <div className="q-den-actions">
          <button type="button" className="q-primary" onClick={onWalk}>
            {index === 1 ? "Start the Trail" : "Walk the Trail"}
          </button>
          <button type="button" className="q-ghost" onClick={onEditCreature}>Change my creature</button>
        </div>
      </div>
    </div>
  );
}
