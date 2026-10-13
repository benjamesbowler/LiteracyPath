import { towerTumbleStep } from './towerTumbleRules.js';

export const TOWER_JUMP_BUFFER_SECONDS = .15;
export const TOWER_LEDGE_GRACE_SECONDS = .1;

// Each physical key or pointer owns its hold. Releasing one must not cancel
// another thumb/key still pressing the same direction.
export function createTowerTumbleInput() {
  const actions = new Map(['left', 'right', 'up', 'down'].map(action => [action, new Set()]));
  return {
    set(action, pressed, source) {
      const owners = actions.get(action);
      if (!owners) return;
      if (pressed) owners.add(source); else owners.delete(source);
    },
    releaseSource(source) { for (const owners of actions.values()) owners.delete(source); },
    clear() { for (const owners of actions.values()) owners.clear(); },
    snapshot: () => Object.fromEntries([...actions].map(([action, owners]) => [action, owners.size > 0])),
  };
}

// Intent belongs to the live controller, never the saved actor or literacy
// record. A release ends a held action; it must not erase a committed jump tap.
export function createTowerTumbleMotor() {
  let jumpBuffer = 0, ledgeGrace = 0;
  const clear = () => { jumpBuffer = 0; ledgeGrace = 0; };
  const requestJump = () => { jumpBuffer = TOWER_JUMP_BUFFER_SECONDS; };
  return {
    requestJump,
    clear,
    inspect: () => ({ jumpBuffer, ledgeGrace }),
    step(actor, input, geometry, dt, options = {}) {
      const delta = Math.min(.05, Math.max(0, dt));
      if (input.jump) requestJump();
      ledgeGrace = actor.grounded ? TOWER_LEDGE_GRACE_SECONDS : Math.max(0, ledgeGrace - delta);
      const requested = jumpBuffer > 0;
      const next = towerTumbleStep(actor, { ...input, jump: requested }, geometry, delta,
        { ...options, jumpGrace: ledgeGrace > 0 });
      // Ladder climbing owns vertical input. Retain a buffered request until
      // the ladder releases it or it expires; sound follows the real impulse.
      const jumped = requested && (actor.grounded || ledgeGrace > 0)
        && !next.climbing && !next.grounded && next.vy > 0;
      if (jumped || next.fell) clear();
      else jumpBuffer = Math.max(0, jumpBuffer - delta);
      return { actor: next, jumped };
    },
  };
}
