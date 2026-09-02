import { SoundSeekersCharacter } from "./CharacterSystem.jsx";
import {
  SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS,
  createCharacterAppearance
} from "./characterCustomization.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "./visualTokens.js";

const TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, color]) => (
    [`--ss-token-${tokenId}`, color]
  ))
));

const SLOT_LABELS = Object.freeze({
  back: "Back gear",
  head: "Head gear",
  neck: "Neck gear",
  held: "Hand gear"
});

function readableLabel(id, emptyLabel = "No gear") {
  if (id === null) return emptyLabel;
  return id
    .replace(/^(?:body-shape|player-palette|gear-(?:back|head|neck|held))-/u, "")
    .split("-")
    .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function ChoiceSwatch({ kind, optionId }) {
  const isPalette = kind === "paletteTokenId";
  const isBody = kind === "bodyShapeId";
  const slot = kind.startsWith("accessory:") ? kind.slice("accessory:".length) : null;
  return (
    <span
      className={`sound-seekers-character-creator__swatch sound-seekers-character-creator__swatch--${
        isPalette ? "palette" : isBody ? "body" : slot || "empty"
      }`}
      aria-hidden="true"
      data-creator-swatch={isPalette ? "palette" : isBody ? "body" : slot || "none"}
      data-swatch-option={optionId ?? "none"}
      style={isPalette ? { "--ss-swatch-color": `var(--ss-token-${optionId})` } : undefined}
    >
      <span />
    </span>
  );
}

function ChoiceButton({ kind, optionId, selected, onChoose }) {
  const label = readableLabel(optionId);
  return (
    <button
      className="sound-seekers-character-creator__choice"
      type="button"
      aria-label={label}
      aria-pressed={selected}
      data-creator-control=""
      data-creator-kind={kind}
      data-option-id={optionId ?? "none"}
      data-min-css-px="56"
      onClick={onChoose}
    >
      <ChoiceSwatch kind={kind} optionId={optionId} />
      <span className="sound-seekers-character-creator__choice-label">{label}</span>
      <span className="sound-seekers-character-creator__choice-mark" aria-hidden="true">✓</span>
    </button>
  );
}

function ChoiceGroup({ legend, kind, options, selectedId, onSelect }) {
  return (
    <fieldset className="sound-seekers-character-creator__group" data-creator-group={kind}>
      <legend>{legend}</legend>
      <div className="sound-seekers-character-creator__choices">
        {options.map(optionId => (
          <ChoiceButton
            key={optionId ?? "none"}
            kind={kind}
            optionId={optionId}
            selected={optionId === selectedId}
            onChoose={() => onSelect(optionId)}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function SoundSeekersCharacterCreator({ value, onChange }) {
  if (typeof onChange !== "function") {
    throw new TypeError("Sound Seekers character creator onChange must be a function");
  }
  const appearance = createCharacterAppearance(value);

  const commitAppearance = nextAppearance => {
    onChange(createCharacterAppearance(nextAppearance));
  };
  const selectMainOption = (key, optionId) => {
    commitAppearance({ ...appearance, [key]: optionId });
  };
  const selectAccessory = (slot, accessoryId) => {
    commitAppearance({
      ...appearance,
      accessories: { ...appearance.accessories, [slot]: accessoryId }
    });
  };

  return (
    <section
      className="sound-seekers-character-creator"
      aria-label="Make your Sound Seeker"
      style={TOKEN_STYLE}
      data-character-creator=""
    >
      <div className="sound-seekers-character-creator__preview" data-character-context="creator-preview">
        <SoundSeekersCharacter characterId="player" pose="idle" appearance={appearance} />
      </div>
      <div className="sound-seekers-character-creator__controls">
        <ChoiceGroup
          legend="Body shape"
          kind="bodyShapeId"
          options={SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes}
          selectedId={appearance.bodyShapeId}
          onSelect={optionId => selectMainOption("bodyShapeId", optionId)}
        />
        <ChoiceGroup
          legend="Color"
          kind="paletteTokenId"
          options={SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes}
          selectedId={appearance.paletteTokenId}
          onSelect={optionId => selectMainOption("paletteTokenId", optionId)}
        />
        {Object.entries(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot)
          .map(([slot, options]) => (
            <ChoiceGroup
              key={slot}
              legend={SLOT_LABELS[slot]}
              kind={`accessory:${slot}`}
              options={options}
              selectedId={appearance.accessories[slot]}
              onSelect={accessoryId => selectAccessory(slot, accessoryId)}
            />
          ))}
      </div>
    </section>
  );
}
