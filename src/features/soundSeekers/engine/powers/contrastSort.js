import {
  answerPower,
  assertReducerContext,
  checkpointState,
  commonView,
  createCommonState,
  deepFreezeClone,
  emptyPowerResult,
  publicEntries
} from "./contracts.js";

const POWER_ID = "contrast_sort";

export const contrastSort = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options);
    const items = publicEntries(challenge.presentation?.items);
    const bins = publicEntries(challenge.presentation?.bins);
    if (items.length < 4 || items.length > 6 || bins.length < 2 || bins.length > 3) {
      throw new Error("Contrast Sort needs one current item from a four-to-six item set and two or three bins");
    }
    const placements = Object.fromEntries(Object.entries(options.resume?.placements || {})
      .filter(([itemId, binId]) => items.some(item => item.id === itemId) && bins.some(bin => bin.id === binId)));
    return deepFreezeClone({
      ...common,
      items,
      bins,
      placements
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (input?.type === "reverse_placement" && typeof input.itemId === "string") {
      const placements = { ...state.placements };
      delete placements[input.itemId];
      return deepFreezeClone({ state: { ...state, placements }, responseIntents: [] });
    }
    if (input?.type !== state.expectedAction
      || !state.items.some(item => item.id === input.itemId)
      || !state.bins.some(bin => bin.id === input.binId)) return emptyPowerResult(state);
    return answerPower(state, challenge, input.token, state.expectedAction, {
      placements: { ...state.placements, [input.itemId]: input.binId }
    });
  },

  view(state, challenge) {
    assertReducerContext(state, challenge);
    return deepFreezeClone({
      ...commonView(state, challenge),
      items: state.items,
      bins: state.bins,
      placements: state.placements
    });
  },

  checkpoint(state) {
    return checkpointState(state, ["items", "bins", "placements"]);
  }
});
