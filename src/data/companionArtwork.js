import { COMPANION_ARTWORK, HOLLOW_ITEM_ARTWORK } from './companionArtwork.generated.js';
import { withRepairedImageVersion } from '../utils/repairedImageVersion.js';

export function companionPortraitPath(characterId) {
  return withRepairedImageVersion(COMPANION_ARTWORK[characterId]?.portrait || `/images/companions/${characterId}.webp`);
}

export function companionFullArtworkPath(characterId, gearId = '') {
  const artwork = COMPANION_ARTWORK[characterId];
  const registered = gearId ? artwork?.gear[gearId] : artwork?.base;
  // A future unknown item keeps the existing missing-image fallback; never
  // silently substitute another Guide or a different equipped item.
  return withRepairedImageVersion(registered || `/images/companions/full/${characterId}${gearId ? '--' + gearId : ''}.webp`);
}

export function companionGearLayerPath(characterId, gearId) {
  const layer = COMPANION_ARTWORK[characterId]?.layers[gearId];
  return layer ? withRepairedImageVersion(layer) : '';
}

// A whole genuinely posed outfit supplies the body. Other equipment uses
// real alpha cutouts, so independent full bodies are never faded together.
export function companionFigurePlan(characterId, gear) {
  if (gear.length <= 1) return { primary: companionFullArtworkPath(characterId, gear[0]?.id), primaryFull: companionFullArtworkPath(characterId, gear[0]?.id), layers: [], feetRegion: null };
  const held = gear.find(item => item.slot === 'held');
  const feet = gear.find(item => item.slot === 'feet');
  const primary = held || feet;
  const layers = gear.filter(item => item !== primary || item.slot === 'held').map(item => ({ ...item, src: companionGearLayerPath(characterId, item.id) })).filter(item => item.src);
  if (gear.some(item => item.id === 'gear-explorer-pack')) layers.push({ id: 'gear-explorer-pack-front', slot: 'pack-front', src: withRepairedImageVersion(COMPANION_ARTWORK[characterId].frontPack) });
  const primaryFull = companionFullArtworkPath(characterId, primary?.id);
  const alpha = COMPANION_ARTWORK[characterId]?.bodyAlpha[primary?.id || 'base'];
  return { primary: alpha ? withRepairedImageVersion(alpha) : primaryFull, primaryFull, layers, feetRegion: held && feet ? COMPANION_ARTWORK[characterId]?.feetRegion : null };
}

export function hollowItemArtworkPath(itemId) {
  const src = HOLLOW_ITEM_ARTWORK[itemId];
  return src ? withRepairedImageVersion(src) : '';
}
