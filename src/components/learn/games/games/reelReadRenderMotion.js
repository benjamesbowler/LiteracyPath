import { interpolateArcadeMotion } from '../shared/arcadeMotion.js';
const fishKeys = ['x', 'y', 'labelX', 'labelY'];
const rootKeys = ['boatPosition', 'elapsed'];

// A detached render view keeps the painted rod, hook, fish and native labels
// on one fractional pose without feeding delayed positions into swept contact.
export function createReelReadRenderMotion(state) {
  let previous = null;
  return {
    beforeStep() {
      previous = { stage: state.stage, boatPosition: state.boatPosition, elapsed: state.elapsed,
        fish: new Map(state.fish.map(fish => [fish.id, { ...fish }])),
        hookRef: state.hook, hook: state.hook && { ...state.hook } };
    },
    reset() { previous = null; },
    sample(alpha) {
      if (!previous || state.paused || previous.stage !== state.stage) return state;
      const view = interpolateArcadeMotion(previous, state, alpha, { ...state }, rootKeys);
      view.fish = state.fish.map(fish => interpolateArcadeMotion(previous.fish.get(fish.id), fish, alpha, { ...fish }, fishKeys));
      if (state.hook && previous.hookRef === state.hook && previous.hook?.phase === state.hook.phase)
        view.hook = interpolateArcadeMotion(previous.hook, state.hook, alpha, { ...state.hook }, ['x', 'y']);
      return view;
    }
  };
}
