import { isInteractiveKeyTarget } from './interactiveEventTarget.js';
import { isPrimaryActionKey, laneDirectionForKey } from '../components/learn/games/shared/premiumGameStandard.js';

/** Parent main focus is restored by Tools/Escape. Native control activation,
 * text entry and another modal keep their own keys; an unfocused game cannot
 * steer or arm a printed-word response through its window listener. */
export function rocketRunKeyboardAllowed(event, field, active) {
  if (isInteractiveKeyTarget(event.target, event.key)) return false;
  const main = field.closest('.lg-game-player-main');
  return active === field || (main && active === main) || field.contains(active);
}

export function rocketRunKeyAction(key, { repeat = false } = {}) {
  const direction = laneDirectionForKey(key);
  if (direction) return direction < 0 ? 'left' : 'right';
  // A held activation key must not silently select each next arriving word.
  // Steering repeats remain motor input; each Catch needs a fresh activation.
  if (isPrimaryActionKey(key)) return repeat ? null : 'catch';
  if (key === 'Shift') return 'boost';
  return null;
}
