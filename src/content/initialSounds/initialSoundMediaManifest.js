import { initialSoundWordBank } from "./initialSoundWordBank.js";
import {
  initialSoundAudioMediaIds,
  initialSoundCompleteMediaIds,
  initialSoundImageMediaIds
} from "./initialSoundImportedMediaStatus.js";

export const initialSoundMediaManifest = Object.fromEntries(
  initialSoundWordBank.map(item => [
    item.id,
    {
      id: item.id,
      letter: item.letter,
      targetWord: item.targetWord,
      imageKey: item.imageKey,
      imageUrl: item.imageUrl,
      audioKey: item.audioKey,
      audioUrl: item.audioUrl,
      imageStatus: initialSoundImageMediaIds.has(item.id) ? "imported" : "missing",
      audioStatus: initialSoundAudioMediaIds.has(item.id) ? "imported" : "missing",
      status: initialSoundCompleteMediaIds.has(item.id) ? "imported" : "missing_media"
    }
  ])
);

export function getInitialSoundMedia(itemOrId) {
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
  return initialSoundMediaManifest[id] || null;
}

export function hasInitialSoundImage(item, assetExists = () => true) {
  return Boolean(item?.imageUrl) && assetExists(item.imageUrl);
}

export function hasInitialSoundAudio(item, assetExists = () => true) {
  return Boolean(item?.audioUrl) && assetExists(item.audioUrl);
}

export function hasImportedInitialSoundImage(itemOrId) {
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
  return initialSoundImageMediaIds.has(id);
}

export function hasImportedInitialSoundAudio(itemOrId) {
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
  return initialSoundAudioMediaIds.has(id);
}

export function hasImportedInitialSoundMedia(itemOrId) {
  const id = typeof itemOrId === "string" ? itemOrId : itemOrId?.id;
  return initialSoundCompleteMediaIds.has(id);
}

export function attachInitialSoundMediaStatus(item, assetExists = () => true) {
  const imageAvailable = hasInitialSoundImage(item, assetExists);
  const audioAvailable = hasInitialSoundAudio(item, assetExists);
  const importedImage = hasImportedInitialSoundImage(item);
  const importedAudio = hasImportedInitialSoundAudio(item);
  return {
    ...item,
    media: {
      imageAvailable,
      audioAvailable,
      importedImage,
      importedAudio,
      importedComplete: importedImage && importedAudio,
      missingImage: !imageAvailable,
      missingAudio: !audioAvailable
    }
  };
}
