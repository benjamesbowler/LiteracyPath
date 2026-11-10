import { passagePicture } from '../comprehension/pictures.js';
import { CYCLE_SHORT_PICTURES } from './pictures.generated.js';

// Every picture resolves against the complete passage reviewed with its panels.
export function cycleShortPicture(passage) {
  if (!passage || typeof passage.id !== 'string' || typeof passage.text !== 'string') return null;
  if (passage.sourcePassageId) return passagePicture({...passage, id: passage.sourcePassageId});
  const picture = Object.hasOwn(CYCLE_SHORT_PICTURES, passage.id) ? CYCLE_SHORT_PICTURES[passage.id] : null;
  return picture?.sourceText === passage.text ? picture : null;
}
