import {
  answerPower,
  assertReducerContext,
  assertStableCollection,
  checkpointState,
  commonView,
  createCommonState,
  deepFreezeClone,
  emptyPowerResult,
  inputHasExactKeys,
  publicEntries,
  transitionPower
} from "./contracts.js";

const POWER_ID = "contrast_sort";

export const contrastSort = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options, ["items", "bins", "placements"]);
    assertStableCollection(challenge.presentation?.items, {
      name: "Contrast Sort items",
      contextId: common.interactionContextId,
      min: 4,
      max: 6
    });
    assertStableCollection(challenge.presentation?.bins, {
      name: "Contrast Sort bins",
      contextId: common.interactionContextId,
      min: 2,
      max: 3
    });
    const items = publicEntries(challenge.presentation?.items);
    const bins = publicEntries(challenge.presentation?.bins);
    if (items.length < 4 || items.length > 6 || bins.length < 2 || bins.length > 3) {
      throw new Error("Contrast Sort needs one current item from a four-to-six item set and two or three bins");
    }
    if (options.resume) {
      const sameCollection = (resumed, canonical) => Array.isArray(resumed)
        && resumed.length === canonical.length
        && resumed.every((item, index) => item.id === canonical[index].id && item.label === canonical[index].label);
      const placementEntries = options.resume.placements && typeof options.resume.placements === "object"
        && !Array.isArray(options.resume.placements)
        ? Object.entries(options.resume.placements)
        : null;
      if (!sameCollection(options.resume.items, items)
        || !sameCollection(options.resume.bins, bins)
        || !placementEntries
        || placementEntries.some(([itemId, binId]) => !items.some(item => item.id === itemId)
          || !bins.some(bin => bin.id === binId))
        || (options.resume.status === "awaiting_mission_commit"
          && (placementEntries.length === 0 || options.resume.semanticSteps.at(-1) !== common.expectedAction))) {
        throw new Error("Contrast Sort resume checkpoint is impossible");
      }
    }
    const placements = options.resume?.placements || {};
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
    if (inputHasExactKeys(input, ["type", "itemId"])
      && input.type === "reverse_placement" && typeof input.itemId === "string") {
      const placements = { ...state.placements };
      delete placements[input.itemId];
      return deepFreezeClone({
        state: transitionPower(state, { placements }, `reverse_placement:${input.itemId}`),
        responseIntents: []
      });
    }
    if (!inputHasExactKeys(input, ["type", "itemId", "binId", "token"])
      || input.type !== state.expectedAction
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
