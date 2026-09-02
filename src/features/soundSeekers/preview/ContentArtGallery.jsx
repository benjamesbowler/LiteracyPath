import { useMemo, useState } from "react";

import { getBiomeKit } from "../content/biomeKits.js";
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
  if (window.innerHeight > window.innerWidth) return "portrait";
  if (window.innerWidth >= 900) return "tablet";
  return "landscape";
}

function appearanceForOption(optionId) {
  const raw = {
    schemaVersion: 1,
    bodyShapeId: SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes[0],
    paletteTokenId: SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes[0],
    accessories: { back: null, head: null, neck: null, held: null }
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
  const [activationCount, setActivationCount] = useState(0);
  const [appearance, setAppearance] = useState(() => appearanceForOption(query.optionId));
  const kit = getBiomeKit(replay.childScene.chapterId);
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
      data-gallery-fixture={query.fixtureId}
      data-gallery-phase={replay.phase}
      data-gallery-activation-count={String(activationCount)}
      data-expected-code-native-ids={JSON.stringify(kit.codeNativeSemanticIds)}
    >
      <header className="sound-seekers-content-gallery__header">
        <p>Sound Seekers v2 content and art</p>
        <h1>{title}</h1>
      </header>

      {query.mode === "creator" ? (
        <section
          className="sound-seekers-content-gallery__creator"
          data-creator-serialized={serializedAppearance}
          data-creator-signature={appearanceSignature(roundTrippedAppearance)}
        >
          <SoundSeekersCharacterCreator value={roundTrippedAppearance} onChange={setAppearance} />
          <div data-character-context="gallery-world">
            <SoundSeekersCharacter characterId="player" pose="walk" appearance={roundTrippedAppearance} />
          </div>
        </section>
      ) : character ? (
        <section className="sound-seekers-content-gallery__character-stage">
          <SoundSeekersCharacter
            characterId={character.characterId}
            pose={pose}
            appearance={character.characterId === "player" ? roundTrippedAppearance : undefined}
          />
        </section>
      ) : (
        <div className="sound-seekers-content-gallery__scene-wrap" data-code-native-world="">
          <SceneVisual
            childScene={replay.childScene}
            activeAttemptId={replay.context?.attemptId || null}
            reducerRevision={replay.context?.reducerRevision ?? null}
            sceneAccess={replay.sceneAccess}
            cropProfile={cropProfileForViewport()}
            densityProfile={query.density}
            motionProfile={query.motion}
            onChoose={() => setActivationCount(count => count + 1)}
          />
          <div data-gallery-semantic-inventory="" aria-hidden="true">
            {kit.codeNativeSemanticIds.map(id => (
              <span key={id} data-code-native-semantic-id={id} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
