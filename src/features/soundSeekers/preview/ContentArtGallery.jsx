import { useMemo, useState } from "react";

import {
  replaySoundSeekersGalleryFixture
} from "./galleryReplayRecipes.js";
import { SoundSeekersCharacterCreator } from "../visual/CharacterCreator.jsx";
import { SoundSeekersCharacter } from "../visual/CharacterSystem.jsx";
import {
  SOUND_SEEKERS_CHARACTER_VISUALS,
  SOUND_SEEKERS_PLAYER_VISUAL,
  SOUND_SEEKERS_POSE_IDS
} from "../visual/characterCatalog.js";
import {
  SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS,
  appearanceSignature,
  createCharacterAppearance,
  deserializeCharacterAppearance,
  serializeCharacterAppearance
} from "../visual/characterCustomization.js";
import { SOUND_SEEKERS_MEANING_VISUALS } from "../visual/sceneVisualCatalog.js";
import { SceneVisual } from "../visual/SceneVisual.jsx";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "../visual/visualTokens.js";
import "./content-art-gallery.css";

const TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => [`--ss-token-${tokenId}`, value])
));
const slug = value => String(value).toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
const CHARACTERS = [...SOUND_SEEKERS_CHARACTER_VISUALS, SOUND_SEEKERS_PLAYER_VISUAL];

function cropProfileForViewport() {
  if (typeof window === "undefined") return "landscape";
  if (window.innerHeight > window.innerWidth) return "portrait";
  if (window.innerWidth >= 900) return "tablet";
  return "landscape";
}

function appearanceForOption(optionId) {
  const defaultAccessories = Object.fromEntries(["back", "head", "neck", "held"].map(slot => [
    slot,
    SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot[slot].find(value => value !== null)
  ]));
  const raw = {
    schemaVersion: 1,
    bodyShapeId: SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes[0],
    paletteTokenId: SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes[0],
    accessories: defaultAccessories
  };
  if (SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes.includes(optionId)) raw.bodyShapeId = optionId;
  if (SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes.includes(optionId)) raw.paletteTokenId = optionId;
  for (const slot of ["back", "head", "neck", "held"]) {
    if (SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot[slot].includes(optionId)) {
      raw.accessories[slot] = optionId;
    }
  }
  return createCharacterAppearance(raw);
}

function modeRecord(mode, prefix, records, getId) {
  if (!mode.startsWith(prefix)) return null;
  const id = mode.slice(prefix.length);
  return records.find(record => slug(getId(record)) === id) || null;
}

export function ContentArtGallery({ query }) {
  const desiredMeaning = modeRecord(query.mode, "meaning-", SOUND_SEEKERS_MEANING_VISUALS, visual => visual.semanticId);
  const replay = useMemo(() => replaySoundSeekersGalleryFixture({
    recipeId: query.fixtureId,
    sceneId: query.sceneId,
    seed: query.seed,
    optionId: query.fixtureId.startsWith("boss-") ? query.optionId : null,
    meaningSemanticId: desiredMeaning?.semanticId || null
  }), [query.fixtureId, query.sceneId, query.seed, query.optionId, desiredMeaning?.semanticId]);
  const [activation, setActivation] = useState(() => ({ count: 0, token: "" }));
  const [appearance, setAppearance] = useState(() => appearanceForOption(query.optionId));
  const compositionMode = query.mode === "wonder"
    ? "wonder"
    : query.mode === "route-landmark"
      ? "ordinary"
      : query.fixtureId === "boss-resolved"
      ? "boss-resolved"
      : "ordinary";
  const character = modeRecord(query.mode, "character-", CHARACTERS, visual => visual.characterId);
  const pose = SOUND_SEEKERS_POSE_IDS.includes(query.optionId) ? query.optionId : "idle";
  const serializedAppearance = serializeCharacterAppearance(appearance);
  const roundTrippedAppearance = deserializeCharacterAppearance(serializedAppearance);
  const title = character
    ? `${character.characterId}: ${pose}`
    : desiredMeaning
      ? desiredMeaning.accessibleLabel
      : `${replay.childScene.stopId.toUpperCase()} · ${replay.childScene.residentId}`;

  return (
    <main
      className={`sound-seekers-content-gallery ${query.labels === "hidden" ? "sound-seekers-content-gallery--labels-hidden" : ""}`}
      style={TOKEN_STYLE}
      data-gallery-root=""
      data-gallery-ready="true"
      data-gallery-mode={query.mode}
      data-gallery-composition={compositionMode}
      data-gallery-fixture={query.fixtureId}
      data-gallery-phase={replay.phase}
      data-gallery-activation-count={String(activation.count)}
      data-gallery-last-activation-token={activation.token}
    >
      <header className="sound-seekers-content-gallery__header">
        <p>Sound Seekers v2 content and art</p>
        <h1>{title}</h1>
      </header>

      {query.mode === "creator" ? (
        <section
          className="sound-seekers-content-gallery__creator"
          data-task4-rendered-subtree=""
          data-creator-serialized={serializedAppearance}
          data-creator-signature={appearanceSignature(roundTrippedAppearance)}
        >
          <SoundSeekersCharacterCreator value={roundTrippedAppearance} onChange={setAppearance} />
          <div data-character-context="gallery-world">
            <SoundSeekersCharacter characterId="player" pose="walk" appearance={roundTrippedAppearance} />
          </div>
        </section>
      ) : character ? (
        <section className="sound-seekers-content-gallery__character-stage" data-task4-rendered-subtree="">
          <SoundSeekersCharacter
            characterId={character.characterId}
            pose={pose}
            appearance={character.characterId === "player" ? roundTrippedAppearance : undefined}
          />
        </section>
      ) : (
        <div className="sound-seekers-content-gallery__scene-wrap" data-task4-rendered-subtree="">
          <SceneVisual
            childScene={replay.childScene}
            activeAttemptId={replay.context?.attemptId || null}
            reducerRevision={replay.context?.reducerRevision ?? null}
            sceneAccess={replay.sceneAccess}
            cropProfile={cropProfileForViewport()}
            densityProfile={query.density}
            motionProfile={query.motion}
            compositionMode={compositionMode}
            onChoose={token => setActivation(previous => ({
              count: previous.count + 1,
              token
            }))}
          />
        </div>
      )}
    </main>
  );
}
