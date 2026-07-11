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
import CreatureFigure from "./CreatureFigure.jsx";
import { ConfettiCelebration } from "../learn/games/shared/ConfettiCelebration.jsx";
import { getPiece } from "../../data/creatureParts.js";
import { displayGrapheme } from "./shells/shellContract.js";
import { playStarChime, playCelebrationFanfare } from "../../utils/audio/gameSfx.js";

export default function RewardScreen({ stop, stars, newStones = [], gear = null, creature, isSoundEnabled = true, onContinue }) {
  const gearPiece = gear ? getPiece(gear) : null;

  useEffect(() => {
    if (!isSoundEnabled) return undefined;
    playStarChime();
    if (stars < 2) return undefined;
    const t = setTimeout(playCelebrationFanfare, 380);
    return () => clearTimeout(t);
  }, [stars, isSoundEnabled]);

  // Show the creature WEARING the new gear immediately — that is the payoff.
  const dressed = gearPiece
    ? { ...creature, equipped: { ...creature.equipped, [gearPiece.slot]: gearPiece.id } }
    : creature;

  return (
    <div className="q-screen q-reward">
      {/* No stars, no confetti. Celebrating a run where the child got nothing
          right teaches them the celebration is meaningless. */}
      <ConfettiCelebration show={stars > 0} />

      <h1 className="q-title">{stop.name}</h1>

      <div className="q-reward-stars" aria-label={`${stars} of 3 stars`}>
        {[0, 1, 2].map(i => (
          <span key={i} className={`q-star${i < stars ? " is-on" : ""}`} style={{ animationDelay: `${i * 140}ms` }}>★</span>
        ))}
      </div>

      <div className="q-reward-stage">
        <CreatureFigure creature={dressed} size={186} mood="cheer" />
      </div>

      {gearPiece && (
        <p className="q-reward-gear">
          You found a <strong>{gearPiece.label}</strong>.
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
          No new stones yet — these sounds will come back. Keep walking.
        </p>
      )}

      <button type="button" className="q-primary" onClick={onContinue}>Back to the Trail</button>
    </div>
  );
}
