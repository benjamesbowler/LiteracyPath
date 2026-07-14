// THE REWARD — one per sound, one per stop, and the gear lands ON the creature.
//
// Reward density is deliberately high, and the cosmetic appears instantly rather
// than in a menu. Both of those are lifted straight from Teach Your Monster,
// because both of them are right.
//
// The stones that light here are the MASTERED ones — which may be none. That is
// not softened. A child who guessed their way through gets the gear and the
// stop, and an unlit stone, and the sound comes back tomorrow.

import { useEffect } from "react";
import { ConfettiCelebration } from "../learn/games/shared/ConfettiCelebration.jsx";
import { getPiece } from "../../data/creatureParts.js";
import { displayGrapheme } from "./shells/shellContract.js";
import { playStarChime, playCelebrationFanfare } from "../../utils/audio/gameSfx.js";
import { trailEventForStop } from "../../utils/questHub.js";
import { seedwakeSatchel } from "../../data/questChapterOne.js";

export default function RewardScreen({
  stop,
  nextStop = null,
  stars,
  newStones = [],
  gear = null,
  chapterReward = null,
  state = null,
  isSoundEnabled = true,
  overlay = false,
  onContinue
}) {
  const gearPiece = gear ? getPiece(gear) : null;
  const event = trailEventForStop(stop);
  const satchel = seedwakeSatchel(state);

  useEffect(() => {
    if (!isSoundEnabled) return undefined;
    playStarChime();
    if (stars < 2) return undefined;
    const t = setTimeout(playCelebrationFanfare, 380);
    return () => clearTimeout(t);
  }, [stars, isSoundEnabled]);

  return (
    <section
      className={`q-reward${overlay ? " q-reward-overlay" : " q-screen"}`}
      data-event={event.mode}
      aria-modal={overlay ? "true" : undefined}
      role={overlay ? "dialog" : undefined}
      aria-label={`${stop.name} reward`}
    >
      {/* No stars, no confetti. Celebrating a run where the child got nothing
          right teaches them the celebration is meaningless. */}
      <ConfettiCelebration show={stars > 0} />

      <div className="q-reward-card q-reward-ceremony-card">
        <div className="q-reward-copy">
          <span className="q-reward-kicker">Chapter restored</span>
          <h1 className="q-title">{chapterReward?.label || (event.mode === "section" ? stop.name : event.title)}</h1>
          <p className="q-reward-line">{event.line}</p>

          {chapterReward && (
            <div className="q-ceremony-relic">
              <span aria-hidden="true" />
              <div>
                <strong>{chapterReward.label}</strong>
                <small>{chapterReward.abilityLabel}</small>
              </div>
            </div>
          )}

          {chapterReward?.chapterId === "seedwake-meadow" && (
            <div className="q-seedwake-summary">
              <div>
                <span>Seedwake satchel</span>
                <strong>{satchel.total} finds · {satchel.sparksBanked} Sparks banked</strong>
              </div>
              <ol aria-label="Restored Seedwake landmarks">
                {satchel.pockets.map(pocket => (
                  <li key={pocket.id} className={pocket.repaired ? "is-restored" : ""}>
                    <span>{pocket.count}</span>
                    <strong>{pocket.repair.label}</strong>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="q-reward-stars" aria-label={`${stars} of 3 stars`}>
            {[0, 1, 2].map(i => (
              <span key={i} className={`q-star${i < stars ? " is-on" : ""}`} style={{ animationDelay: `${i * 140}ms` }}>★</span>
            ))}
          </div>

          {gearPiece && (
            <p className="q-reward-gear">
              Found: <strong>{gearPiece.label}</strong>
            </p>
          )}

          {newStones.length > 0 ? (
            <div className="q-reward-stones">
              <p className="q-note">New stones for your wall:</p>
              <div className="q-wall">
                {newStones.map((g, i) => (
                  <span key={g} className="q-stone q-stone-mastered is-landing" style={{ animationDelay: `${i * 120}ms` }}>
                    {displayGrapheme(g)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            // Honest, and gentle. No "you failed" — there is no failing here.
            <p className="q-note q-reward-none">
              No new stones yet. These sounds will come back.
            </p>
          )}

          {nextStop && (
            <p className="q-reward-next">
              Next trail: <strong>{nextStop.name}</strong>
            </p>
          )}

          <button type="button" className="q-primary" onClick={onContinue}>Continue the trail</button>
        </div>

        <div className="q-reward-stage q-ceremony-view" aria-hidden="true">
          <span className="q-ceremony-ring is-outer" />
          <span className="q-ceremony-ring is-inner" />
          <span className="q-ceremony-relic-mark" />
        </div>
      </div>
    </section>
  );
}
