// Sound Seekers — character preview harness (dev only, not in the build).
//
//   npm run dev -- --host      then open the NETWORK url (not localhost — the
//                              Chrome extension can't reach localhost)
//   /quest-creature-preview.html?seed=7&count=24
//
// The first row is the shipping book-character system with every wearable slot
// filled simultaneously. The legacy vector wall and builder remain below for
// save-compatibility inspection.

import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import CreatureFigure from "./components/quest/CreatureFigure.jsx";
import BookCharacterAvatar from "./components/quest/BookCharacterAvatar.jsx";
import {
  CREATURE_BODIES,
  CREATURE_DYES,
  CREATURE_SLOTS,
  piecesForSlot,
  defaultCreature
} from "./data/creatureParts.js";
import "./styles/quest.css";

const MOODS = ["idle", "walk", "cheer", "think", "sad", "hatch"];
const BOOK_CHARACTER_BODIES = ["tuft", "pebble", "moth"];
const FULL_EQUIPMENT = Object.freeze({
  head: "acorn-hat",
  back: "moth-wings",
  neck: "vine-scarf",
  held: "stone-staff"
});

// Deterministic PRNG so ?seed=7 always gives the same wall — otherwise "it
// looked fine last time" is unfalsifiable.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

function randomCreature(rand) {
  const creature = { ...defaultCreature() };
  creature.body = pick(rand, CREATURE_BODIES).id;
  creature.dye = pick(rand, CREATURE_DYES).id;
  for (const slot of CREATURE_SLOTS) {
    if (slot.kind !== "part" || slot.id === "body") continue;
    const options = piecesForSlot(slot.id);
    if (options.length) creature[slot.id] = pick(rand, options).id;
  }
  return creature;
}

function Wall({ seed, count }) {
  const creatures = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => randomCreature(rand));
  }, [seed, count]);

  return (
    <div className="qp-grid">
      {creatures.map((creature, i) => (
        <figure className="qp-cell" key={i}>
          <CreatureFigure creature={creature} size={126} mood="idle" title={`Creature ${i + 1}`} />
          <figcaption>{creature.body} · {creature.dye}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function BookCharacterEquipmentWall() {
  return (
    <section aria-labelledby="book-character-equipment-heading">
      <h2 id="book-character-equipment-heading">Shipping book characters · all gear equipped</h2>
      <div className="qp-grid qp-book-grid">
        {BOOK_CHARACTER_BODIES.map(body => {
          const creature = {
            ...defaultCreature(),
            body,
            equipped: FULL_EQUIPMENT
          };
          return (
            <figure className="qp-cell" key={body}>
              <BookCharacterAvatar creature={creature} size={240} />
              <figcaption>{body} · back + head + neck + held</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function Builder() {
  const [creature, setCreature] = useState(() => defaultCreature());
  const [mood, setMood] = useState("idle");
  // Remounting on a mood change restarts the one-shot animations (cheer, hatch),
  // which otherwise only ever play once per page load.
  const [replay, setReplay] = useState(0);

  const set = (key, value) => setCreature(prev => ({ ...prev, [key]: value }));
  const setMoodAndReplay = next => {
    setMood(next);
    setReplay(n => n + 1);
  };

  return (
    <div className="qp-builder">
      <div className="qp-builder-stage">
        <CreatureFigure key={`${mood}-${replay}`} creature={creature} size={260} mood={mood} />
        <div className="qp-moods">
          {MOODS.map(m => (
            <button
              key={m}
              type="button"
              className="qp-chip"
              aria-pressed={mood === m}
              onClick={() => setMoodAndReplay(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="qp-slot">
          <h3>Body</h3>
          <div className="qp-reel">
            {CREATURE_BODIES.map(body => (
              <button
                key={body.id}
                type="button"
                className="qp-chip"
                aria-pressed={creature.body === body.id}
                onClick={() => set("body", body.id)}
              >
                {body.label}
              </button>
            ))}
          </div>
        </div>

        <div className="qp-slot">
          <h3>Colour</h3>
          <div className="qp-reel">
            {CREATURE_DYES.map(dye => (
              <button
                key={dye.id}
                type="button"
                className="qp-swatch"
                aria-pressed={creature.dye === dye.id}
                aria-label={dye.label}
                title={dye.label}
                style={{ background: dye.skin }}
                onClick={() => set("dye", dye.id)}
              />
            ))}
          </div>
        </div>

        {CREATURE_SLOTS.filter(s => s.kind === "part" && s.id !== "body").map(slot => (
          <div className="qp-slot" key={slot.id}>
            <h3>{slot.label}</h3>
            <div className="qp-reel">
              {piecesForSlot(slot.id).map(piece => (
                <button
                  key={piece.id}
                  type="button"
                  className="qp-chip"
                  aria-pressed={creature[slot.id] === piece.id}
                  onClick={() => set(slot.id, piece.id)}
                >
                  {piece.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get("seed") || "7");
  const count = Number(params.get("count") || "24");

  return (
    <div className="qp-shell">
      <h1>Sound Seekers — character and equipment audit</h1>
      <p className="qp-note">
        The book-character row is the shipping visual check: wings remain behind the body, hats and
        scarves stay attached, and held objects sit in front. The {count} legacy randomised creatures
        (seed {seed}) and builder remain below to verify old saves.
      </p>
      <BookCharacterEquipmentWall />
      <Wall seed={seed} count={count} />
      <Builder />
    </div>
  );
}

export default Preview;

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<Preview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
