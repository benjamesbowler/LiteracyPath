import { useState } from "react";

import {
  TRY_LEVELS,
  TRY_MODE_NOTICE
} from "../policy/tryModeSession.js";
import "../styles/try-mode.css";

/**
 * The front door to the anonymous try-mode.
 *
 * TWO AUDIENCES ON ONE SCREEN, AND THEY WANT OPPOSITE THINGS. The child wants
 * to press the big button. The adult standing behind them needs to understand,
 * before that happens, that no account is being made and nothing is being kept.
 * So the notice is written for the adult and placed where an adult reads —
 * above the choice, in adult language — while the choice itself is three large
 * plain cards a child could pick unaided.
 *
 * WHY A LEVEL PICKER AT ALL. Normally the app works out where a child belongs
 * from their assessment history. There isn't any, and creating some would mean
 * measuring the child, which is exactly what this mode promises not to do.
 * Asking is the honest alternative, and it is better for the adult anyway:
 * they can jump straight to the part that interests them rather than grinding
 * up from Level A.
 */
export function TryModePage({ onStart, onBack, unavailable = false }) {
  const [level, setLevel] = useState(TRY_LEVELS[0].id);

  if (unavailable) {
    // Reached when ephemeral storage could not be installed. The demo is
    // REFUSED rather than degraded: running it against real storage would be
    // collecting data from a child while this very screen promised otherwise.
    return (
      <div className="app try-shell">
        <div className="card page-card page-stack try-card">
          <h1>The try-out is not available in this browser</h1>
          <p>
            This version keeps nothing at all, and to guarantee that it needs a browser
            feature yours has turned off — often private browsing, or blocked site data.
          </p>
          <p className="muted-text">
            Rather than run it anyway and store things we told you we would not, we would
            rather not run it. Turning site data back on, or using a different browser,
            will fix it.
          </p>
          <button className="report-button" onClick={onBack} type="button">Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app try-shell">
      <div className="card page-card page-stack try-card">
        <h1>Try it now — no sign-up</h1>

        {/* For the adult. Deliberately first, and deliberately not in child voice. */}
        <div className="try-notice" role="note">
          <strong>{TRY_MODE_NOTICE.beforeStart.heading}</strong>
          <p>{TRY_MODE_NOTICE.beforeStart.body}</p>
        </div>

        <h2 className="try-question">How much reading can they do already?</h2>
        <p className="muted-text try-help">
          Pick anything — it only decides where the books start. Nothing is tested and
          nothing is recorded.
        </p>

        <div className="try-levels" role="radiogroup" aria-label="Starting level">
          {TRY_LEVELS.map(option => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={level === option.id}
              className={`try-level${level === option.id ? " is-selected" : ""}`}
              onClick={() => setLevel(option.id)}
            >
              <span className="try-level-label">{option.label}</span>
              <span className="try-level-detail">{option.detail}</span>
            </button>
          ))}
        </div>

        <div className="button-row">
          <button className="main-button" onClick={() => onStart?.(level)} type="button">
            Start playing
          </button>
          <button className="report-button" onClick={onBack} type="button">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown when the try session ends.
 *
 * THIS IS THE ONE THAT MATTERS. A warning at the front door is read by somebody
 * who has lost nothing yet. The moment that actually lands is finishing a book
 * and finding there is nothing to keep — so the explanation, and the invitation,
 * belong here. Anything else leaves a parent to meet the consequence alone and
 * conclude the product is broken rather than deliberately empty-handed.
 */
export function TryModeEndPage({ nickname, onRestart, onSeeFullVersion, onBack }) {
  return (
    <div className="app try-shell">
      <div className="card page-card page-stack try-card">
        <h1>{TRY_MODE_NOTICE.onLeaving.heading}</h1>
        {nickname && (
          <p className="try-nickname">
            {nickname} had a good go. That name was made up for the session and is gone too.
          </p>
        )}
        <p>{TRY_MODE_NOTICE.onLeaving.body}</p>
        <div className="button-row">
          <button className="main-button" onClick={onSeeFullVersion} type="button">
            {TRY_MODE_NOTICE.onLeaving.callToAction}
          </button>
          <button className="report-button" onClick={onRestart} type="button">
            Try again
          </button>
          <button className="report-button" onClick={onBack} type="button">
            Back to the start
          </button>
        </div>
      </div>
    </div>
  );
}
