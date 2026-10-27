import { interpolateArcadeMotion } from '../shared/arcadeMotion.js';

const netKeys = ['x', 'y', 'angle'];
const critterKeys = ['x', 'y', 'depth'];
const copy = (object, keys) => Object.fromEntries(keys.map(key => [key, object[key]]));

// Only presentation coordinates are sampled. Drawing retains the original
// objects so its measured label/contact boxes still describe the visible art.
// Authoritative motor coordinates are restored before any input can run.
export function createSoundSafariRenderMotion(state) {
  let previous = null;
  const capture = () => ({ net: copy(state.net, netKeys),
    critters: new Map(state.critters.map(critter => [critter, copy(critter, critterKeys)])) });
  return {
    beforeStep() { previous = capture(); },
    reset() { previous = null; },
    draw(alpha, render) {
      if (!previous || state.paused || state.ended || state.onboarding) return render();
      const current = capture();
      interpolateArcadeMotion(previous.net, current.net, alpha, state.net, netKeys, ['angle']);
      for (const critter of state.critters) {
        interpolateArcadeMotion(previous.critters.get(critter), current.critters.get(critter), alpha, critter, critterKeys);
      }
      try { return render(); }
      finally {
        Object.assign(state.net, current.net);
        for (const [critter, pose] of current.critters) Object.assign(critter, pose);
      }
    }
  };
}
