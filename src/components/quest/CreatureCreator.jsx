// THE CREATURE CREATOR — the first 90 seconds, before a single letter.
//
// This is not a settings screen. It is the emotional hook: a child who built
// this thing will come back to dress it. Teach Your Monster's own stated
// rationale, and they're right about it.
//
// Every choice applies LIVE, with a bounce. Nothing is behind a confirm dialog.
// Locked pieces show as dim silhouettes with a price — which is how a child
// learns, without being told, that walking the trail buys parts.

import { useState } from "react";
import CreatureFigure from "./CreatureFigure.jsx";
import {
  CREATURE_BODIES,
  CREATURE_DYES,
  CREATURE_SLOTS,
  piecesForSlot,
  defaultCreature
} from "../../data/creatureParts.js";
import { playPopSound, playCelebrationFanfare } from "../../utils/audio/gameSfx.js";

const PART_TABS = CREATURE_SLOTS.filter(s => s.kind === "part" && s.id !== "body" && s.id !== "pattern");

export default function CreatureCreator({ creature, owned, isSoundEnabled = true, onChange, onDone, hatched = false }) {
  const [tab, setTab] = useState("body");
  const [hatching, setHatching] = useState(false);
  const own = owned || new Set();

  const set = (key, value) => {
    if (isSoundEnabled) playPopSound();
    onChange?.({ ...creature, [key]: value });
  };

  const hatch = () => {
    setHatching(true);
    if (isSoundEnabled) playCelebrationFanfare();
    setTimeout(() => onDone?.(), 1000);
  };

  const tabs = [
    { id: "body", label: "Body" },
    { id: "colour", label: "Colour" },
    ...PART_TABS.map(s => ({ id: s.id, label: s.label })),
    { id: "pattern", label: "Pattern" }
  ];

  return (
    <div className="q-screen q-creator">
      <h1 className="q-title">{hatched ? "Change your creature" : "Make your creature"}</h1>

      <div className="q-creator-stage">
        <CreatureFigure
          key={hatching ? "hatch" : "idle"}
          creature={creature}
          size={230}
          mood={hatching ? "hatch" : "idle"}
        />
      </div>

      <div className="q-tabs" role="tablist">
        {tabs.map(t => (
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

      <div className="q-reel">
        {tab === "body" && CREATURE_BODIES.map(body => (
          <Option
            key={body.id}
            label={body.label}
            cost={body.cost}
            locked={!own.has(body.id) && body.cost > 0}
            selected={creature.body === body.id}
            onPick={() => set("body", body.id)}
          >
            <CreatureFigure creature={{ ...defaultCreature(), body: body.id, dye: creature.dye }} size={58} mood="still" />
          </Option>
        ))}

        {tab === "colour" && CREATURE_DYES.map(dye => (
          <Option
            key={dye.id}
            label={dye.label}
            cost={dye.cost}
            locked={!own.has(dye.id) && dye.cost > 0}
            selected={creature.dye === dye.id}
            onPick={() => set("dye", dye.id)}
          >
            <span className="q-swatch" style={{ background: dye.skin, borderColor: dye.skinDark }} />
          </Option>
        ))}

        {tab !== "body" && tab !== "colour" && piecesForSlot(tab).map(piece => (
          <Option
            key={piece.id}
            label={piece.label}
            cost={piece.cost}
            locked={!own.has(piece.id) && piece.cost > 0}
            selected={creature[tab] === piece.id}
            onPick={() => set(tab, piece.id)}
          >
            <CreatureFigure
              creature={{ ...defaultCreature(), dye: creature.dye, body: creature.body, [tab]: piece.id }}
              size={58}
              mood="still"
            />
          </Option>
        ))}
      </div>

      <button type="button" className="q-primary" onClick={hatch} disabled={hatching}>
        {hatched ? "Done" : "Hatch my creature"}
      </button>
    </div>
  );
}

function Option({ label, cost, locked, selected, onPick, children }) {
  return (
    <button
      type="button"
      className={`q-option${selected ? " is-on" : ""}${locked ? " is-locked" : ""}`}
      aria-pressed={selected}
      disabled={locked}
      onClick={onPick}
    >
      <span className="q-option-art">{children}</span>
      <span className="q-option-label">{label}</span>
      {/* A locked piece shows its PRICE, not a padlock. A padlock says "no".
          A price says "walk a bit further". */}
      {locked && <span className="q-option-cost">{cost}</span>}
    </button>
  );
}
