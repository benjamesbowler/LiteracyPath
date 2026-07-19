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

import { useEffect, useRef, useState } from "react";
import CreatureFigure from "./CreatureFigure.jsx";
import {
  CREATURE_BODIES,
  CREATURE_DYES,
  CREATURE_GEAR,
  CREATURE_SLOTS,
  piecesForSlot,
} from "../../data/creatureParts.js";
import {
  availableSparks,
  canBuy,
  equipOwnedPiece,
  recordPurchaseAndEquip,
  ownedPieces
} from "../../utils/questProgress.js";
import { playCelebrationFanfare, playSoftBuzz, playStarChime } from "../../utils/audio/gameSfx.js";

const TABS = [
  { id: "body", label: "Bodies" },
  { id: "colour", label: "Colours" },
  ...CREATURE_SLOTS.filter(s => s.kind === "part" && s.id !== "body").map(s => ({ id: s.id, label: s.label })),
  ...CREATURE_SLOTS.filter(s => s.kind === "gear").map(s => ({ id: s.id, label: s.label }))
];

export default function TradingPost({ state, isSoundEnabled = true, onBuy, onBack }) {
  const [tab, setTab] = useState("crest");
  const [selectedId, setSelectedId] = useState(null);
  const [flash, setFlash] = useState(null);
  const [notice, setNotice] = useState("");
  const timersRef = useRef(new Set());
  const tabRefs = useRef({});

  useEffect(() => () => {
    timersRef.current.forEach(timer => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  function schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
  }

  const sparks = availableSparks(state);
  const owned = ownedPieces(state);

  const stock = tab === "body"
    ? CREATURE_BODIES.map(b => ({ ...b, slot: "body" }))
    : tab === "colour"
      ? CREATURE_DYES.map(d => ({ ...d, slot: "colour" }))
      : CREATURE_SLOTS.find(slot => slot.id === tab)?.kind === "gear"
        ? CREATURE_GEAR.filter(piece => piece.slot === tab)
        : piecesForSlot(tab);

  const selected = stock.find(piece => piece.id === selectedId) || stock[0] || null;
  const selectedOwned = Boolean(selected && owned.has(selected.id));
  const selectedEquipped = Boolean(selected && (
    selected.slot === "colour"
      ? state.creature.dye === selected.id
      : selected.slot === "body"
        ? state.creature.body === selected.id
        : CREATURE_SLOTS.find(slot => slot.id === selected.slot)?.kind === "gear"
          ? state.creature.equipped?.[selected.slot] === selected.id
          : state.creature[selected.slot] === selected.id
  ));
  const preview = (() => {
    if (!selected) return state.creature;
    if (selected.slot === "colour") return { ...state.creature, dye: selected.id };
    if (selected.slot === "body") return { ...state.creature, body: selected.id };
    if (CREATURE_SLOTS.find(slot => slot.id === selected.slot)?.kind === "gear") {
      return {
        ...state.creature,
        equipped: { ...state.creature.equipped, [selected.slot]: selected.id }
      };
    }
    return { ...state.creature, [selected.slot]: selected.id };
  })();

  function showNotice(message, pieceId = null) {
    setNotice(message);
    setFlash(pieceId);
    schedule(() => {
      setNotice("");
      setFlash(null);
    }, 1500);
  }

  function selectTab(nextTab, focus = false) {
    setTab(nextTab);
    setSelectedId(null);
    setNotice("");
    if (focus) tabRefs.current[nextTab]?.focus();
  }

  function handleTabKeyDown(event, index) {
    let nextIndex = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % TABS.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TABS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    selectTab(TABS[nextIndex].id, true);
  }

  function buyOrEquip(piece) {
    if (!piece) return;
    if (owned.has(piece.id)) {
      if (selectedEquipped) return;
      if (isSoundEnabled) playStarChime();
      onBuy?.(equipOwnedPiece(state, piece));
      showNotice(`${piece.label} is on.`);
      return;
    }
    if (piece.unlock) {
      if (isSoundEnabled) playSoftBuzz();
      showNotice("Find this on the trail.", piece.id);
      return;
    }
    if (!canBuy(state, piece)) {
      if (isSoundEnabled) playSoftBuzz();
      showNotice(`You need ${(piece.cost || 0) - sparks} more Sparks.`, piece.id);
      return;
    }
    if (isSoundEnabled) { playStarChime(); schedule(playCelebrationFanfare, 200); }
    onBuy?.(recordPurchaseAndEquip(state, piece));
    showNotice(`${piece.label} is yours and ready to wear.`);
  }

  return (
    <div className="q-screen q-post">
      <div className="q-post-head">
        {/* The door is in the header, matching the map - not a ghost at the
            bottom of a scrollable column a child may never reach. */}
        <button type="button" className="q-ghost q-post-back" onClick={onBack}>&#8592; Den</button>
        <div>
          <span className="q-post-kicker">Bramble's wagon</span>
          <h1 className="q-title">Trading Post</h1>
        </div>
        <span className="q-sparks" title="Sparks"><strong>{sparks}</strong><small>Sparks</small></span>
      </div>

      <div className="q-tabs q-post-tabs" role="tablist" aria-label="Try-on shelves">
        {TABS.map((t, index) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`q-post-tab-${t.id}`}
            aria-controls={`q-post-panel-${t.id}`}
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
            className={`q-tab${tab === t.id ? " is-on" : ""}`}
            ref={element => { tabRefs.current[t.id] = element; }}
            onClick={() => selectTab(t.id)}
            onKeyDown={event => handleTabKeyDown(event, index)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {selected && (
        <section
          className="q-post-preview"
          id={`q-post-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`q-post-tab-${tab}`}
          aria-label={`${selected.label} preview`}
        >
          <div className="q-post-stage">
            <CreatureFigure creature={preview} size={230} mood="idle" />
          </div>
          <div className="q-post-offer">
            <span className="q-post-status">{selectedEquipped ? "Wearing now" : selectedOwned ? "In your wardrobe" : selected.unlock ? "Trail treasure" : "Ready to collect"}</span>
            <h2>{selected.label}</h2>
            <p>{selectedEquipped ? "This is part of your current look." : selectedOwned ? "Try it with everything else you are wearing." : selected.unlock ? "Keep walking to discover this reward." : `Spend ${selected.cost || 0} Sparks earned on the trail.`}</p>
            <button
              type="button"
              className="q-primary q-post-action"
              onClick={() => buyOrEquip(selected)}
              disabled={selectedEquipped}
            >
              {selectedEquipped
                ? "Wearing"
                : selectedOwned
                  ? "Wear it"
                  : selected.unlock
                    ? "Find on trail"
                    : canBuy(state, selected)
                      ? `Get it for ${selected.cost || 0}`
                      : `Need ${Math.max(0, (selected.cost || 0) - sparks)} more`}
            </button>
            <p className="q-post-notice" role="status" aria-live="polite">{notice}</p>
          </div>
        </section>
      )}

      <div className="q-stock">
        {stock.map(piece => {
          const have = owned.has(piece.id);
          const afford = sparks >= (piece.cost || 0);
          const equipped = piece.id === selected?.id ? selectedEquipped : (
            piece.slot === "colour"
              ? state.creature.dye === piece.id
              : piece.slot === "body"
                ? state.creature.body === piece.id
                : CREATURE_SLOTS.find(slot => slot.id === piece.slot)?.kind === "gear"
                  ? state.creature.equipped?.[piece.slot] === piece.id
                  : state.creature[piece.slot] === piece.id
          );
          const thumbnail = piece.slot === "colour"
            ? { ...state.creature, dye: piece.id }
            : piece.slot === "body"
              ? { ...state.creature, body: piece.id }
              : CREATURE_SLOTS.find(slot => slot.id === piece.slot)?.kind === "gear"
                ? { ...state.creature, equipped: { ...state.creature.equipped, [piece.slot]: piece.id } }
                : { ...state.creature, [piece.slot]: piece.id };

          return (
            <button
              key={piece.id}
              type="button"
              className={`q-goods${have ? " is-owned" : ""}${!have && !afford ? " is-short" : ""}${selected?.id === piece.id ? " is-selected" : ""}${flash === piece.id ? " is-flash" : ""}`}
              aria-pressed={selected?.id === piece.id}
              onClick={() => { setSelectedId(piece.id); setNotice(""); }}
            >
              <span className="q-goods-art">
                <CreatureFigure creature={thumbnail} size={70} mood="still" />
              </span>
              <span className="q-goods-label">{piece.label}</span>
              <span className="q-goods-cost">
                {equipped ? "Wearing" : have ? "Yours" : piece.unlock ? "Trail" : (piece.cost || 0) === 0 ? "Free" : `${piece.cost}`}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
