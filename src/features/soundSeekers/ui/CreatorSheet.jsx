import { SoundSeekersCharacterCreator } from "../visual/CharacterCreator.jsx";
import { SoundSeekersCharacter } from "../visual/CharacterSystem.jsx";
import {
  appearanceSignature,
  createCharacterAppearance,
  serializeCharacterAppearance
} from "../visual/characterCustomization.js";
import { ModalSurface } from "./ModalSurface.jsx";

export function CreatorSheet({ appearance, onChange, onClose }) {
  const normalized = createCharacterAppearance(appearance);
  if (typeof onChange !== "function" || typeof onClose !== "function") {
    throw new TypeError("Sound Seekers creator needs appearance-change and close actions");
  }
  const serialized = serializeCharacterAppearance(normalized);
  const signature = appearanceSignature(normalized);
  return (
    <ModalSurface className="ss-sheet ss-creator" labelledBy="ss-creator-title" onClose={onClose}>
      <header className="ss-sheet__header">
        <div>
          <p className="ss-eyebrow">Make the hero yours</p>
          <h1 id="ss-creator-title">My Sound Seeker</h1>
        </div>
        <button type="button" className="ss-icon-button" aria-label="Close character creator" data-ss-modal-initial-focus="" onClick={onClose}>×</button>
      </header>
      <div className="ss-creator__layout">
        <div
          className="ss-creator__stage"
          data-appearance-signature={signature}
          data-serialized-appearance={serialized}
        >
          <div className="ss-creator__halo" aria-hidden="true" />
          <SoundSeekersCharacter characterId="player" pose="celebrate" appearance={normalized} />
          <p>Your look changes. Your reading challenge never does.</p>
        </div>
        <SoundSeekersCharacterCreator
          value={normalized}
          onChange={next => onChange(createCharacterAppearance(next))}
        />
      </div>
      <button className="ss-primary-button ss-sheet__done" type="button" onClick={onClose}>Back to the trail</button>
    </ModalSurface>
  );
}

export default CreatorSheet;
