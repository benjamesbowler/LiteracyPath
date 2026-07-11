// THE TRADING POST — where sparks become parts.
//
// Without this, sparks accumulate forever with nothing to spend them on, and the
// locked pieces in the creature creator are just a tease. The whole reward loop
// (walk -> stars -> sparks -> a new tail) closes here.
//
// SPARKS ARE DERIVED, NEVER STORED. What you own is a pure function of what you
// have earned minus a ledger of what you spent. A sync race can therefore never
// delete a child's tail — the worst it can do is briefly show them fewer sparks.
//
// No IAP. Ever. The only currency is reading.

import { useState } from "react";
import CreatureFigure from "./CreatureFigure.jsx";
import {
  CREATURE_BODIES,
  CREATURE_DYES,
  CREATURE_SLOTS,
  piecesForSlot,
  defaultCreature
} from "../../data/creatureParts.js";
import { availableSparks, canBuy, recordPurchase, ownedPieces } from "../../utils/questProgress.js";
import { playCelebrationFanfare, playSoftBuzz, playStarChime } from "../../utils/audio/gameSfx.js";

const TABS = [
  { id: "body", label: "Bodies" },
  { id: "colour", label: "Colours" },
  ...CREATURE_SLOTS.filter(s => s.kind === "part" && s.id !== "body").map(s => ({ id: s.id, label: s.label }))
];

export default function TradingPost({ state, isSoundEnabled = true, onBuy, onBack }) {
  const [tab, setTab] = useState("crest");
  const [flash, setFlash] = useState(null);

  const sparks = availableSparks(state);
  const owned = ownedPieces(state);

  const stock = tab === "body"
    ? CREATURE_BODIES.map(b => ({ ...b, slot: "body" }))
    : tab === "colour"
      ? CREATURE_DYES.map(d => ({ ...d, slot: "colour" }))
      : piecesForSlot(tab);

  function buy(piece) {
    if (owned.has(piece.id)) return;
    if (!canBuy(state, piece)) {
      // Not enough sparks. Say so plainly rather than doing nothing — a button
      // that silently ignores a child is a broken button, to them.
      setFlash(piece.id);
      if (isSoundEnabled) playSoftBuzz();
      setTimeout(() => setFlash(null), 600);
      return;
    }
    if (isSoundEnabled) { playStarChime(); setTimeout(playCelebrationFanfare, 200); }
    onBuy?.(recordPurchase(state, piece));
  }

  return (
    <div className="q-screen q-post">
      <div className="q-post-head">
        <h1 className="q-title">Trading Post</h1>
        <span className="q-sparks" title="Sparks">{sparks}</span>
      </div>
      <p className="q-note">Stars from the Trail become sparks. Sparks become parts.</p>

      <div className="q-tabs" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`q-tab${tab === t.id ? " is-on" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="q-stock">
        {stock.map(piece => {
          const have = owned.has(piece.id);
          const afford = sparks >= (piece.cost || 0);
          const preview = tab === "colour"
            ? { ...state.creature, dye: piece.id }
            : tab === "body"
              ? { ...defaultCreature(), body: piece.id, dye: state.creature.dye }
              : { ...state.creature, [tab]: piece.id };

          return (
            <button
              key={piece.id}
              type="button"
              className={`q-goods${have ? " is-owned" : ""}${!have && !afford ? " is-short" : ""}${flash === piece.id ? " is-flash" : ""}`}
              onClick={() => buy(piece)}
              disabled={have}
            >
              <span className="q-goods-art">
                <CreatureFigure creature={preview} size={70} mood="still" />
              </span>
              <span className="q-goods-label">{piece.label}</span>
              <span className="q-goods-cost">
                {have ? "Yours" : (piece.cost || 0) === 0 ? "Free" : `${piece.cost}`}
              </span>
            </button>
          );
        })}
      </div>

      <button type="button" className="q-ghost" onClick={onBack}>Back to the Den</button>
    </div>
  );
}
