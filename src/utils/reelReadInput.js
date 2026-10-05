import { isInteractiveKeyTarget } from './interactiveEventTarget.js';
import { isPrimaryActionKey, laneDirectionForKey } from '../components/learn/games/shared/premiumGameStandard.js';

/** Global game keys belong only to the focused play field. Native control
 * activation, text entry, menus and dialogs retain their own behaviour. */
export function reelReadKeyboardAllowed(event, mount, active) {
  if (isInteractiveKeyTarget(event.target, event.key)) return false;
  const main = mount.closest('.lg-game-player-main');
  return active === main || active === mount || mount.contains(active);
}

export function reelReadKeyAction(key) {
  const direction = laneDirectionForKey(key);
  if (direction) return direction < 0 ? 'left' : 'right';
  return isPrimaryActionKey(key) || key === 'ArrowDown' ? 'cast' : null;
}
