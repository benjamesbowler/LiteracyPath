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
import BookCharacterAvatar from "./BookCharacterAvatar.jsx";
import { bookCharacterForCreature } from "./bookCharacterAvatar.js";
import {
  CREATURE_BODIES,
  CREATURE_SLOTS,
  BOOK_CHARACTER_PRESETS,
  piecesForSlot
} from "../../data/creatureParts.js";
import { playPopSound, playCelebrationFanfare } from "../../utils/audio/gameSfx.js";
import { lockedItemAffordance } from "../../policy/lockedItemAffordance.js";
import { SparkIcon } from "../shared/CurrencyIcons.jsx";

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
const CHARACTER_LOOKS = Object.freeze({
  tuft: Object.freeze([
    { id: "coral", label: "Story pink", variant: "original" },
    { id: "sand", label: "Honey gold", variant: "honey" },
    { id: "plum", label: "Moon lavender", variant: "moon" },
    { id: "clay", label: "Woodland brown", variant: "woodland" }
  ]),
  pebble: Object.freeze([
    { id: "ember", label: "Story orange", variant: "original" },
    { id: "moss", label: "Leaf green", variant: "honey" },
    { id: "slate", label: "Moon blue", variant: "moon" },
    { id: "coral", label: "Berry red", variant: "woodland" }
  ]),
  moth: Object.freeze([
    { id: "fern", label: "Story green", variant: "original" },
    { id: "sand", label: "Honey gold", variant: "honey" },
    { id: "plum", label: "Moon violet", variant: "moon" },
    { id: "teal", label: "Woodland teal", variant: "woodland" }
  ])
});
const OUTFIT_LABELS = Object.freeze({
  "leaf-cap": "Leaf cloak",
  "acorn-hat": "Acorn cap",
  "moth-wings": "Moth wings",
  "vine-scarf": "Vine scarf",
  "stone-staff": "Willow wand"
});
const OUTFIT_OPTIONS = Object.freeze(OUTFIT_TABS.flatMap(slot => (
  piecesForSlot(slot.id).map(piece => ({ ...piece, displayLabel: OUTFIT_LABELS[piece.id] || piece.label }))
)));
const EMPTY_OUTFIT = Object.freeze({ head: null, back: null, neck: null, held: null });

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

  const setMany = values => {
    if (isSoundEnabled) playPopSound();
    onChange?.({ ...creature, ...values });
  };
  const setOutfit = piece => {
    if (isSoundEnabled) playPopSound();
    if (!piece) {
      onChange?.({ ...creature, equipped: { ...EMPTY_OUTFIT } });
      return;
    }
    const selected = creature.equipped?.[piece.slot] === piece.id;
    onChange?.({
      ...creature,
      equipped: {
        ...EMPTY_OUTFIT,
        [piece.slot]: selected ? null : piece.id
      }
    });
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
    { id: "outfit", label: "Outfits" }
  ];
  const activeTabIndex = Math.max(0, tabs.findIndex(item => item.id === tab));
  const selectedCharacter = bookCharacterForCreature(creature);
  const characterLooks = CHARACTER_LOOKS[creature.body] || CHARACTER_LOOKS.tuft;
  const equippedIds = Object.values(creature.equipped || {}).filter(Boolean);

  return (
    <div className="q-screen q-creator">
      <h1 className="q-title" data-child-title="">{hatched ? "Change your book character" : "Choose your book character"}</h1>
      <p className="q-creator-instruction" data-child-instruction="">
        Pick a book friend. Then choose one finished look made just for them.
      </p>
      <p className="q-creator-step" data-child-progress="">
        Part {activeTabIndex + 1} of {tabs.length}: {tabs[activeTabIndex].label}
      </p>

      <div className="q-creator-stage">
        {selectedCharacter && (
          <div className="q-creator-book-identity">
            <div className="q-creator-book-character">
              <BookCharacterAvatar creature={creature} size={230} decorative />
            </div>
            <span>{selectedCharacter.name}</span>
            <small>{selectedCharacter.series}</small>
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
              equipped: { ...EMPTY_OUTFIT },
              pose: "idle",
              visualVariant: "pose-ready"
            })}
          >
            <BookCharacterAvatar
              creature={{
                ...creature,
                ...BOOK_CHARACTER_PRESETS[body.id],
                equipped: { ...EMPTY_OUTFIT },
                pose: "idle",
                visualVariant: "pose-ready"
              }}
              size={78}
              decorative
            />
          </Option>
        ))}

        {tab === "colour" && characterLooks.map(look => (
          <Option
            key={look.id}
            label={look.label}
            selected={creature.dye === look.id}
            onPick={() => setMany({
              dye: look.id,
              pose: "idle",
              equipped: { ...EMPTY_OUTFIT },
              visualVariant: `look-${look.variant}`
            })}
          >
            <BookCharacterAvatar
              creature={{
                ...creature,
                ...BOOK_CHARACTER_PRESETS[creature.body],
                dye: look.id,
                pose: "idle",
                equipped: { ...EMPTY_OUTFIT },
                visualVariant: `look-${look.variant}`
              }}
              size={66}
              decorative
            />
          </Option>
        ))}

        {tab === "expression" && EXPRESSIONS.map(expression => (
          <Option
            key={expression.id}
            label={expression.label}
            selected={creature.eyes === expression.eyes && creature.mouth === expression.mouth}
            onPick={() => setMany({
              eyes: expression.eyes,
              mouth: expression.mouth,
              pose: "idle",
              equipped: { ...EMPTY_OUTFIT },
              visualVariant: `mood-${expression.id === "thinking" ? "thoughtful" : expression.id}`
            })}
          >
            <BookCharacterAvatar
              creature={{
                ...creature,
                ...BOOK_CHARACTER_PRESETS[creature.body],
                eyes: expression.eyes,
                mouth: expression.mouth,
                pose: "idle",
                equipped: { ...EMPTY_OUTFIT },
                visualVariant: `mood-${expression.id === "thinking" ? "thoughtful" : expression.id}`
              }}
              size={66}
              decorative
            />
          </Option>
        ))}

        {tab === "pose" && POSES.map(pose => (
          <Option
            key={pose.id}
            label={pose.label}
            selected={(creature.pose || "idle") === pose.id}
            onPick={() => setMany({
              pose: pose.id,
              equipped: { ...EMPTY_OUTFIT },
              visualVariant: `pose-${pose.id === "idle" ? "ready"
                : pose.id === "walk" ? "walking"
                  : pose.id === "cheer" ? "cheering"
                    : "thinking"}`
            })}
          >
            <BookCharacterAvatar
              creature={{
                ...creature,
                ...BOOK_CHARACTER_PRESETS[creature.body],
                pose: pose.id,
                equipped: { ...EMPTY_OUTFIT },
                visualVariant: `pose-${pose.id === "idle" ? "ready"
                  : pose.id === "walk" ? "walking"
                    : pose.id === "cheer" ? "cheering"
                      : "thinking"}`
              }}
              size={66}
              pose={pose.id}
              decorative
            />
          </Option>
        ))}

        {tab === "outfit" && (
          <>
            <Option
              label="Remove all"
              selected={!equippedIds.length}
              onPick={() => setOutfit(null)}
            >
              <BookCharacterAvatar
                creature={{ ...creature, equipped: { ...EMPTY_OUTFIT } }}
                size={66}
                decorative
              />
            </Option>
            {OUTFIT_OPTIONS.map(piece => (
              <Option
                key={piece.id}
                label={piece.displayLabel}
                cost={piece.cost}
                unlock={piece.unlock}
                balance={sparkBalance}
                locked={!own.has(piece.id)}
                selected={equippedIds.includes(piece.id)}
                onPick={() => setOutfit(piece)}
              >
                <BookCharacterAvatar
                  creature={{
                    ...creature,
                    equipped: {
                      ...EMPTY_OUTFIT,
                      [piece.slot]: piece.id
                    }
                  }}
                  size={66}
                  decorative
                />
              </Option>
            ))}
          </>
        )}
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

function Option({ label, cost, unlock, balance, locked, selected, featured = false, onPick, children }) {
  const isTrailReward = locked && Number(cost) === 0 && Boolean(unlock);
  const affordance = locked && !isTrailReward
    ? lockedItemAffordance({
      cost,
      balance,
      currency: { singular: "Spark", plural: "Sparks" }
    })
    : null;
  const lockedCopy = isTrailReward ? "Find this on the Sound Trail." : affordance?.text || "";

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
          {isTrailReward
            ? <span className="q-option-cost-copy">Trail reward</span>
            : (
              <span className="q-option-cost-copy">
                <span className="q-option-price">{affordance.priceText}</span>
                {" — earn "}
                {affordance.shortfall} more
              </span>
            )}
        </span>
      )}
    </button>
  );
}
