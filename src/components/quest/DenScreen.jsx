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
import { playWhoosh } from "../../utils/audio/gameSfx.js";

// Only show stones for sounds the child could plausibly have met — an empty
// wall of 103 sockets on day one is a wall of things you haven't done.
const WALL_LOOKAHEAD = 8;

function DenNavIcon({ kind }) {
  const common = {
    className: "q-den-nav-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };
  if (kind === "settings") {
    return <svg {...common}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5 7 7M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5" /><circle cx="12" cy="12" r="7.1" /></svg>;
  }
  if (kind === "map") {
    return <svg {...common}><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z" /><path d="M9 3v16M15 5v16" /><path d="m5.5 14 2-2 2.5 1 2.5-4 2.5 2 3.5-3" /></svg>;
  }
  if (kind === "review") {
    return <svg {...common}><path d="M9 18V6l10-2v12" /><ellipse cx="6.5" cy="18" rx="2.5" ry="2" /><ellipse cx="16.5" cy="16" rx="2.5" ry="2" /><path d="M9 9l10-2" /></svg>;
  }
  if (kind === "creature") {
    return <svg {...common}><circle cx="6" cy="8" r="2" /><circle cx="10" cy="5.5" r="2" /><circle cx="14" cy="5.5" r="2" /><circle cx="18" cy="8" r="2" /><path d="M7.2 16.4c.5-3 2.4-5.2 4.8-5.2s4.3 2.2 4.8 5.2c.4 2.4-1.2 3.7-3 2.7a3.8 3.8 0 0 0-3.6 0c-1.8 1-3.4-.3-3-2.7Z" /></svg>;
  }
  return <svg {...common}><path d="M6 8h12l1 13H5Z" /><path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2M8 12h8M9 16h6" /></svg>;
}

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
  const [settingsFallback, setSettingsFallback] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const settingsRef = useRef(null);
  const settingsTriggerRef = useRef(null);
  const settingsCloseRef = useRef(null);
  const settingsWasOpenRef = useRef(false);
  const index = currentStopIndex(state);
  const adventure = QUEST_STOPS[Math.min(QUEST_STOPS.length - 1, Math.max(0, index - 1))];
  const visible = [...taughtThrough(Math.min(QUEST_STOPS.length, index + WALL_LOOKAHEAD))];
  const lit = visible.filter(g => isMastered(state.mastery, g)).length;
  const relics = unlockedChapterRewards(state);
  const reviewPlan = freeRoamReviewPlan(state);
  const reviewLabel = reviewPlan.weakest.length ? "Practise sounds again" : "Explore today's sounds";

  const followDenLink = callback => {
    if (soundEnabled) playWhoosh();
    callback?.();
  };

  useEffect(() => {
    const dialog = settingsRef.current;
    if (!dialog) return undefined;
    let focusFrame = 0;
    const supportsNativeModal = (
      typeof dialog.showModal === "function"
      && typeof dialog.close === "function"
    );

    if (settingsOpen) {
      settingsWasOpenRef.current = true;
      let fallback = !supportsNativeModal;
      if (!fallback && !dialog.open) {
        try {
          dialog.showModal();
        } catch {
          fallback = true;
        }
      }
      if (fallback) {
        dialog.setAttribute("open", "");
        dialog.dataset.fallbackModal = "true";
      } else {
        delete dialog.dataset.fallbackModal;
      }
      setSettingsFallback(fallback);
      focusFrame = window.requestAnimationFrame(() => settingsCloseRef.current?.focus());
    } else {
      const fallback = dialog.dataset.fallbackModal === "true";
      if (dialog.open || dialog.hasAttribute("open")) {
        if (!fallback && typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
      }
      delete dialog.dataset.fallbackModal;
      setSettingsFallback(false);
      if (settingsWasOpenRef.current) {
        settingsWasOpenRef.current = false;
        focusFrame = window.requestAnimationFrame(() => settingsTriggerRef.current?.focus());
      }
    }

    return () => window.cancelAnimationFrame(focusFrame);
  }, [settingsOpen]);

  const containSettingsFocus = event => {
    if (!settingsOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setSettingsOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [...(settingsRef.current?.querySelectorAll(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"
    ) || [])];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (!settingsRef.current?.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="q-screen q-den">
      <ParallaxScene world="meadow" offset={0} className="q-den-scene">
        <div className="q-den-creature">
          <CreatureFigure creature={state.creature} size={230} mood="idle" />
        </div>
      </ParallaxScene>

      <div
        className="q-den-panel"
        inert={settingsOpen && settingsFallback ? true : undefined}
        aria-hidden={settingsOpen && settingsFallback ? "true" : undefined}
      >
        <div className="q-den-head">
          <h1 className="q-title">Your Den</h1>
          <div className="q-den-tools">
            <span className="q-sparks" title="Sparks"><strong>{availableSparks(state)}</strong><small>Sparks</small></span>
            <button
              ref={settingsTriggerRef}
              type="button"
              className="q-settings-button"
              onClick={() => followDenLink(() => setSettingsOpen(true))}
              aria-label="Open settings"
            >
              <DenNavIcon kind="settings" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="q-den-adventure">
          <div>
            <span className="q-den-kicker">The world outside</span>
            <strong>{adventure?.name || "Sunlit Meadow"}</strong>
          </div>
          <button type="button" className="q-primary" onClick={() => followDenLink(onWalk)} aria-label="Open the trail map">
            <DenNavIcon kind="map" />
            <span>Open Trail Map</span>
          </button>
        </div>

        <div className="q-den-links">
          <button type="button" className="q-ghost" onClick={() => followDenLink(onReview)} aria-label={reviewLabel}>
            <DenNavIcon kind="review" />
            <span>{reviewLabel}</span>
          </button>
          <button type="button" className="q-ghost" onClick={() => followDenLink(onEditCreature)} aria-label="Change my creature">
            <DenNavIcon kind="creature" />
            <span>Change my creature</span>
          </button>
          <button type="button" className="q-ghost" onClick={() => followDenLink(onTradingPost)} aria-label="Open the Trading Post">
            <DenNavIcon kind="post" />
            <span>Trading Post</span>
          </button>
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
            <h2 className="q-subhead">Words to practise <span className="q-count">{state.trickies.length}</span></h2>
            <div className="q-trickies">
              {state.trickies.map(word => <span key={word} className="q-trickie">{word}</span>)}
            </div>
          </>
        )}

      </div>

      {settingsOpen && settingsFallback && <div className="q-settings-fallback-backdrop" aria-hidden="true" />}
      <dialog
        ref={settingsRef}
        className="q-settings-dialog"
        open={settingsOpen && settingsFallback ? true : undefined}
        data-fallback-modal={settingsOpen && settingsFallback ? "true" : undefined}
        role="dialog"
        aria-modal={settingsOpen ? "true" : undefined}
        aria-labelledby="q-settings-title"
        onClose={() => setSettingsOpen(false)}
        onCancel={event => { event.preventDefault(); setSettingsOpen(false); }}
        onKeyDown={containSettingsFocus}
      >
        <div className="q-settings-head">
          <div>
            <span>For this device</span>
            <h2 id="q-settings-title">Display, sound and access</h2>
          </div>
          <button ref={settingsCloseRef} type="button" className="q-settings-close" onClick={() => setSettingsOpen(false)} aria-label="Close settings">Close</button>
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
