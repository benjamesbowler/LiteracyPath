import { interpolateArcadeMotion } from '../shared/arcadeMotion.js';

const ACTOR_FIELDS = ['x', 'y', 'vx', 'vy', 'anim', 'squash', 't', 'life', 'press', 'feedbackTime'];
const VIEW_FIELDS = ['cam', 'camY', 'clock'];

// Presentation owns copies only. The same interpolation phase applies to the
// rider, its moving support, patrols and camera; collision/save state is never
// temporarily rewritten while painting.
export function createLetterLeapMotion() {
  let previous = new WeakMap(), outputs = new WeakMap(), view = null;
  let priorLevel = null, priorPlayer = null;
  const renderedView = {};
  function reset() {
    previous = new WeakMap(); outputs = new WeakMap(); view = null;
    priorLevel = priorPlayer = null;
  }
  return {
    reset,
    capture(state, actors) {
      if (state.level !== priorLevel || state.player !== priorPlayer) reset();
      priorLevel = state.level; priorPlayer = state.player;
      view = { cam: state.cam, camY: state.camY, clock: state.clock };
      for (const actor of actors) {
        if (!actor) continue;
        let sample = previous.get(actor);
        if (!sample) { sample = {}; previous.set(actor, sample); }
        for (const key of ACTOR_FIELDS) sample[key] = actor[key];
      }
    },
    frame(state, alpha) {
      const continuous = priorLevel === state.level && priorPlayer === state.player;
      interpolateArcadeMotion(continuous ? view : null, state, alpha, renderedView, VIEW_FIELDS);
      return renderedView;
    },
    actor(actor, alpha) {
      if (!actor) return actor;
      let output = outputs.get(actor);
      if (!output) { output = {}; outputs.set(actor, output); }
      Object.assign(output, actor);
      interpolateArcadeMotion(previous.get(actor), actor, alpha, output, ACTOR_FIELDS);
      return output;
    },
  };
}
