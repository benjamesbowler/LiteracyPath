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
  BOOK_CHARACTER_PRESETS,
  piecesForSlot,
  defaultCreature
} from "../../data/creatureParts.js";
import { playPopSound, playCelebrationFanfare } from "../../utils/audio/gameSfx.js";
import { lockedItemAffordance } from "../../policy/lockedItemAffordance.js";
import { SparkIcon } from "../shared/CurrencyIcons.jsx";

const PART_TABS = CREATURE_SLOTS.filter(s => s.kind === "part" && s.id !== "body" && s.id !== "pattern");
const OUTFIT_TABS = CREATURE_SLOTS.filter(s => s.kind === "gear");
const EXPRESSIONS = Object.freeze([
  { id: "happy", label: "Happy", eyes: "eyes-big", mouth: "mouth-smile" },
  { id: "excited", label: "Excited", eyes: "eyes-wide", mouth: "mouth-grin" },
  { id: "thinking", label: "Thinking", eyes: "eyes-sleepy", mouth: "mouth-round" },
  { id: "brave", label: "Brave", eyes: "eyes-fierce", mouth: "mouth-smile" }
]);
const POSES = Object.freeze([
  { id: "idle", label: "Ready" },
  { id: "walk", label: "Walking" },
  { id: "cheer", label: "Cheering" },
  { id: "think", label: "Thinking" }
]);
const FLAGSHIP_BOOK_CHARACTER_IDS = Object.freeze(["tuft", "pebble", "moth"]);
const FLAGSHIP_BOOK_DYES = new Set(FLAGSHIP_BOOK_CHARACTER_IDS.map(id => BOOK_CHARACTER_PRESETS[id]?.dye).filter(Boolean));
const BOOK_CHARACTER_CUTOUTS = Object.freeze({
  tuft: "/game-assets/sound-seekers/avatars-v3/muddy.webp",
  pebble: "/game-assets/sound-seekers/avatars-v3/chompy.webp",
  moth: "/game-assets/sound-seekers/avatars-v3/pip.webp"
});
const GEAR_BADGES = Object.freeze({
  "leaf-cap": "/images/hollow/gear-leaf-cloak.webp",
  "acorn-hat": "/images/hollow/gear-acorn-shield.webp",
  "moth-wings": "/images/hollow/gear-moth-wings.webp",
  "vine-scarf": "/images/hollow/gear-starweave-scarf.webp",
  "stone-staff": "/images/hollow/gear-willow-wand.webp"
});

export default function CreatureCreator({
  creature,
  owned,
  sparkBalance = 0,
  isSoundEnabled = true,
  onChange,
  onDone,
  hatched = false
}) {
  const [tab, setTab] = useState("body");
  const [hatching, setHatching] = useState(false);
  const own = owned || new Set();

  const set = (key, value) => {
    if (isSoundEnabled) playPopSound();
    onChange?.({ ...creature, [key]: value });
  };
  const setMany = values => {
    if (isSoundEnabled) playPopSound();
    onChange?.({ ...creature, ...values });
  };
  const setOutfit = (slot, value) => {
    if (isSoundEnabled) playPopSound();
    onChange?.({ ...creature, equipped: { ...(creature.equipped || {}), [slot]: value } });
  };

  const hatch = () => {
    setHatching(true);
    if (isSoundEnabled) playCelebrationFanfare();
    setTimeout(() => onDone?.(), 1000);
  };

  const tabs = [
    { id: "body", label: "Character" },
    { id: "colour", label: "Colours" },
    { id: "expression", label: "Moods" },
    { id: "pose", label: "Poses" },
    { id: "pattern", label: "Patterns" },
    ...OUTFIT_TABS.map(s => ({ id: s.id, label: s.label === "Held" ? "Accessories" : s.label }))
  ];
  const activeTabIndex = Math.max(0, tabs.findIndex(item => item.id === tab));
  const selectedBody = CREATURE_BODIES.find(body => body.id === creature.body);
  const selectedBookCutout = BOOK_CHARACTER_CUTOUTS[creature.body] || null;
  const originalDye = BOOK_CHARACTER_PRESETS[creature.body]?.dye;
  const selectedExpression = EXPRESSIONS.find(expression => (
    creature.eyes === expression.eyes && creature.mouth === expression.mouth
  ))?.id || "happy";
  const equippedBadges = Object.values(creature.equipped || {})
    .filter(Boolean)
    .map(id => ({ id, badge: GEAR_BADGES[id] }))
    .filter(item => item.badge);

  return (
    <div className="q-screen q-creator">
      <h1 className="q-title" data-child-title="">{hatched ? "Change your book character" : "Choose your book character"}</h1>
      <p className="q-creator-instruction" data-child-instruction="">
        Pick a book friend. Change their colour, mood, pose and trail gear.
      </p>
      <p className="q-creator-step" data-child-progress="">
        Part {activeTabIndex + 1} of {tabs.length}: {tabs[activeTabIndex].label}
      </p>

      <div className="q-creator-stage">
        {selectedBookCutout && (
          <div
            className={`q-creator-book-identity is-pose-${creature.pose || "idle"}`}
            data-dye={creature.dye === originalDye ? "original" : creature.dye}
            data-mood={selectedExpression}
            aria-label={`${selectedBody?.label || "Book character"}, from ${selectedBody?.series || "our books"}`}
          >
            <div className="q-creator-book-character">
              <img src={selectedBookCutout} alt="" />
              {equippedBadges.map((item, index) => (
                <i key={item.id} className={`q-creator-gear-badge is-${index}`} aria-hidden="true">
                  <img src={item.badge} alt="" />
                </i>
              ))}
            </div>
            <span>{selectedBody?.label}</span>
            <small>{selectedBody?.series}</small>
          </div>
        )}
      </div>

      <div className="q-tabs" role="tablist" aria-label="Book character options" data-child-choices="">
        {tabs.map((t, tabIndex) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            /* Roving tabIndex + arrow keys: the full tablist pattern (same as
               the Trading Post) - half an ARIA pattern reads as broken to a
               screen reader. */
            tabIndex={tab === t.id ? 0 : -1}
            className={`q-tab${tab === t.id ? " is-on" : ""}`}
            onClick={() => setTab(t.id)}
            onKeyDown={event => {
              if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const nextIndex = event.key === "Home" ? 0
                : event.key === "End" ? tabs.length - 1
                : (tabIndex + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
              setTab(tabs[nextIndex].id);
              event.currentTarget.parentElement?.children[nextIndex]?.focus();
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={`q-reel q-reel--${tab}`}>
        {tab === "body" && CREATURE_BODIES.filter(body => FLAGSHIP_BOOK_CHARACTER_IDS.includes(body.id)).map(body => (
          <Option
            key={body.id}
            featured
            label={`${body.label} · ${body.series}`}
            cost={0}
            balance={sparkBalance}
            locked={false}
            selected={creature.body === body.id}
            onPick={() => setMany({
              ...BOOK_CHARACTER_PRESETS[body.id],
              equipped: creature.equipped,
              pose: creature.pose || "idle"
            })}
          >
            {body.portrait
              ? <img className="q-book-character-portrait" src={body.portrait} alt="" />
              : <CreatureFigure creature={{ ...defaultCreature(), ...BOOK_CHARACTER_PRESETS[body.id] }} size={58} mood="still" title={body.label} />}
          </Option>
        ))}

        {tab === "colour" && CREATURE_DYES.map(dye => (
          <Option
            key={dye.id}
            label={dye.label}
            cost={dye.cost}
            balance={sparkBalance}
            locked={!FLAGSHIP_BOOK_DYES.has(dye.id) && !own.has(dye.id) && dye.cost > 0}
            selected={creature.dye === dye.id}
            onPick={() => set("dye", dye.id)}
          >
            <span className="q-swatch" style={{ background: dye.skin, borderColor: dye.skinDark }} />
          </Option>
        ))}

        {tab === "expression" && EXPRESSIONS.map(expression => (
          <Option
            key={expression.id}
            label={expression.label}
            selected={creature.eyes === expression.eyes && creature.mouth === expression.mouth}
            onPick={() => setMany({ eyes: expression.eyes, mouth: expression.mouth })}
          >
            <CreatureFigure creature={{ ...creature, eyes: expression.eyes, mouth: expression.mouth }} size={58} mood="still" />
          </Option>
        ))}

        {tab === "pose" && POSES.map(pose => (
          <Option
            key={pose.id}
            label={pose.label}
            selected={(creature.pose || "idle") === pose.id}
            onPick={() => set("pose", pose.id)}
          >
            <CreatureFigure creature={creature} size={58} mood={pose.id} />
          </Option>
        ))}

        {OUTFIT_TABS.some(slot => slot.id === tab) && (
          <>
            <Option
              label="No item"
              selected={!creature.equipped?.[tab]}
              onPick={() => setOutfit(tab, null)}
            >
              <CreatureFigure creature={{ ...creature, equipped: { ...creature.equipped, [tab]: null } }} size={58} mood="still" />
            </Option>
            {piecesForSlot(tab).map(piece => (
              <Option
                key={piece.id}
                label={piece.label}
                cost={piece.cost}
                balance={sparkBalance}
                locked={!own.has(piece.id)}
                selected={creature.equipped?.[tab] === piece.id}
                onPick={() => setOutfit(tab, piece.id)}
              >
                <CreatureFigure creature={{ ...creature, equipped: { ...creature.equipped, [tab]: piece.id } }} size={58} mood="still" />
              </Option>
            ))}
          </>
        )}

        {PART_TABS.some(slot => slot.id === tab) && piecesForSlot(tab).map(piece => (
          <Option
            key={piece.id}
            label={piece.label}
            cost={piece.cost}
            balance={sparkBalance}
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

      <button
        type="button"
        className="q-primary"
        onClick={hatch}
        disabled={hatching}
        data-child-primary=""
        data-child-emphasis="primary"
        data-child-emphasis-cue=""
      >
        {hatched ? "Done" : "Start my adventure"}
      </button>
    </div>
  );
}

function Option({ label, cost, balance, locked, selected, featured = false, onPick, children }) {
  const affordance = locked
    ? lockedItemAffordance({
      cost,
      balance,
      currency: { singular: "Spark", plural: "Sparks" }
    })
    : null;
  const lockedCopy = affordance?.text || "";

  return (
    <button
      type="button"
      className={`q-option${featured ? " is-featured" : ""}${selected ? " is-on" : ""}${locked ? " is-locked" : ""}`}
      aria-pressed={selected}
      aria-label={locked ? `${label}. ${lockedCopy}` : label}
      data-locked-item={locked ? "quest-creature" : undefined}
      disabled={locked}
      onClick={onPick}
    >
      <span className="q-option-art">{children}</span>
      <span className="q-option-label">{label}</span>
      {/* A locked piece shows its PRICE, not a padlock. A padlock says "no".
          A price says "walk a bit further". */}
      {locked && (
        <span className="q-option-cost">
          <SparkIcon size={14} />
          <span className="q-option-cost-copy">
            <span className="q-option-price">{affordance.priceText}</span>
            {" — earn "}
            {affordance.shortfall} more
          </span>
        </span>
      )}
    </button>
  );
}
