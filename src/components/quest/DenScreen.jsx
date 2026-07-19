// THE DEN — home base, and the trophy cabinet.
//
// The Stone Wall is the honest signal, and it is the ONLY place the two tracks
// are visible side by side: a stone lights when its sound is MASTERED, not when
// the stop is passed. A child can have walked ten stops and have four lit
// stones, and that is not a punishment — it is the truth, and it is the thing
// a parent can look at and understand in one second.

import { useEffect, useRef, useState } from "react";
import CreatureFigure from "./CreatureFigure.jsx";
import ParallaxScene from "./ParallaxScene.jsx";
import { QUEST_STOPS, taughtThrough } from "../../data/questSequence.js";
import { isMastered, MASTERY_STATES } from "../../utils/questMastery.js";
import { availableSparks, currentStopIndex, unlockedChapterRewards } from "../../utils/questProgress.js";
import { displayGrapheme } from "./shells/shellContract.js";
import { freeRoamReviewPlan } from "../../utils/questReviewMode.js";

// Only show stones for sounds the child could plausibly have met — an empty
// wall of 103 sockets on day one is a wall of things you haven't done.
const WALL_LOOKAHEAD = 8;

export default function DenScreen({
  state,
  reducedMotion = false,
  highContrast = false,
  quietSoundscape = false,
  soundEnabled = true,
  onReducedMotion,
  onHighContrast,
  onQuietSoundscape,
  onSoundEnabled,
  onResetCreature,
  onResetProgress,
  onWalk,
  onReview,
  onEditCreature,
  onTradingPost
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const settingsRef = useRef(null);
  const index = currentStopIndex(state);
  const adventure = QUEST_STOPS[Math.min(QUEST_STOPS.length - 1, Math.max(0, index - 1))];
  const visible = [...taughtThrough(Math.min(QUEST_STOPS.length, index + WALL_LOOKAHEAD))];
  const lit = visible.filter(g => isMastered(state.mastery, g)).length;
  const relics = unlockedChapterRewards(state);
  const reviewPlan = freeRoamReviewPlan(state);

  useEffect(() => {
    const dialog = settingsRef.current;
    if (!dialog) return;
    if (settingsOpen && !dialog.open) dialog.showModal();
    else if (!settingsOpen && dialog.open) dialog.close();
  }, [settingsOpen]);

  return (
    <div className="q-screen q-den">
      <ParallaxScene world="meadow" offset={0} className="q-den-scene">
        <div className="q-den-creature">
          <CreatureFigure creature={state.creature} size={230} mood="idle" />
        </div>
      </ParallaxScene>

      <div className="q-den-panel">
        <div className="q-den-head">
          <h1 className="q-title">Your Den</h1>
          <div className="q-den-tools">
            <span className="q-sparks" title="Sparks"><strong>{availableSparks(state)}</strong><small>Sparks</small></span>
            <button type="button" className="q-settings-button" onClick={() => setSettingsOpen(true)}>Settings</button>
          </div>
        </div>

        <div className="q-den-adventure">
          <div>
            <span className="q-den-kicker">The world outside</span>
            <strong>{adventure?.name || "Sunlit Meadow"}</strong>
          </div>
          <button type="button" className="q-primary" onClick={onWalk}>
            Open Trail Map
          </button>
        </div>

        <div className="q-den-links">
          <button type="button" className="q-ghost" onClick={onReview}>
            {reviewPlan.weakest.length ? "Practise tricky sounds" : "Explore today's sounds"}
          </button>
          <button type="button" className="q-ghost" onClick={onEditCreature}>Change my creature</button>
          <button type="button" className="q-ghost" onClick={onTradingPost}>Trading Post</button>
        </div>

        {relics.length > 0 && (
          <>
            <h2 className="q-subhead">Chapter Relics <span className="q-count">{relics.length} of 8</span></h2>
            <div className="q-relic-shelf">
              {relics.map((relic, relicIndex) => (
                <article key={relic.id} className="q-relic" data-ability={relic.ability}>
                  <span className="q-relic-mark" aria-hidden="true">{relicIndex + 1}</span>
                  <span>
                    <strong>{relic.label}</strong>
                    <small>{relic.abilityLabel}</small>
                  </span>
                </article>
              ))}
            </div>
          </>
        )}

        <h2 className="q-subhead">
          The Stone Wall <span className="q-count">{lit} of {visible.length} lit</span>
        </h2>
        <p className="q-note">A stone lights up when you really know its sound — not just when you walk past it.</p>

        <div className="q-wall" role="list">
          {visible.map(g => {
            const record = state.mastery?.[g];
            const state_ = record?.state || MASTERY_STATES.NOT_STARTED;
            // role=list + per-stone labels: the old title tooltips never
            // appear on touch and said nothing to a screen reader; the
            // ::after glyph (star / dot / hollow) carries the state without
            // colour.
            return (
              <span
                key={g}
                role="listitem"
                className={`q-stone q-stone-${state_}`}
                aria-label={`${displayGrapheme(g)}: ${state_.replace("-", " ")}`}
              >
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

      </div>

      <dialog
        ref={settingsRef}
        className="q-settings-dialog"
        aria-labelledby="q-settings-title"
        onClose={() => setSettingsOpen(false)}
        onCancel={() => setSettingsOpen(false)}
      >
        <div className="q-settings-head">
          <div>
            <span>For this device</span>
            <h2 id="q-settings-title">Display, sound and access</h2>
          </div>
          <button type="button" className="q-settings-close" onClick={() => setSettingsOpen(false)} aria-label="Close settings">Close</button>
        </div>
        {/* NO PICTURE-STYLE CHOICE.
          *
          * Sound Seekers is a pixel game. It had a "Picture style" dropdown
          * offering Automatic / Pixel / Rich 3D / Balanced 3D / Low-power 3D /
          * Accessible 2D — six renderers, presented to a five-year-old, three
          * of which drop them into a different-looking game entirely. A child
          * cannot make that choice meaningfully and should never be asked to.
          * The renderers still exist as automatic fallbacks; they are simply
          * no longer a question the child has to answer. */}
        <p>Choose the most comfortable way to play.</p>
        <fieldset className="q-accessibility-options">
          <legend>Comfort</legend>
          <label><input type="checkbox" checked={reducedMotion} onChange={event => onReducedMotion?.(event.target.checked)} />Reduce motion</label>
          <label><input type="checkbox" checked={highContrast} onChange={event => onHighContrast?.(event.target.checked)} />High contrast</label>
          <label><input type="checkbox" checked={quietSoundscape} onChange={event => onQuietSoundscape?.(event.target.checked)} />Quiet soundscape (spoken sounds stay on)</label>
          <label><input type="checkbox" checked={soundEnabled} onChange={event => onSoundEnabled?.(event.target.checked)} />Sound on</label>
        </fieldset>

        {/* START AGAIN.
          *
          * Two separate doors, because they are two very different regrets.
          * "I don't like how my creature looks" is a five-second fix and must
          * cost nothing — every sound the child has learnt stays exactly where
          * it is. "I want to start the whole adventure again" throws away real
          * work, so it asks twice and says plainly what will be lost. */}
        <fieldset className="q-reset-options">
          <legend>Start again</legend>
          <button
            type="button"
            className="q-ghost q-reset-creature"
            onClick={() => onResetCreature?.()}
          >
            Make a new creature
          </button>
          <small>Your sounds, stones and stars all stay.</small>

          {confirmingReset ? (
            <div className="q-reset-confirm" role="group" aria-label="Confirm starting over">
              <strong>Start the whole adventure again?</strong>
              <small>Your stones, stars and creature go back to the beginning. This cannot be undone.</small>
              <div className="q-reset-confirm-actions">
                <button type="button" className="q-ghost" onClick={() => setConfirmingReset(false)}>No, keep going</button>
                <button
                  type="button"
                  className="q-danger"
                  onClick={() => { setConfirmingReset(false); onResetProgress?.(); }}
                >
                  Yes, start again
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="q-ghost q-reset-progress"
              onClick={() => setConfirmingReset(true)}
            >
              Start the adventure again
            </button>
          )}
        </fieldset>

        <button type="button" className="q-primary q-settings-done" onClick={() => setSettingsOpen(false)}>Done</button>
      </dialog>
    </div>
  );
}
