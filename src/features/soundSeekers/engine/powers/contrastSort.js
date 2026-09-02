import {
  applyMissionCommitToPower,
  answerPower,
  assertReducerContext,
  assertStableCollection,
  checkpointState,
  commonView,
  createCommonState,
  deepFreezeClone,
  emptyPowerResult,
  inputHasExactKeys,
  parseSemanticHistory,
  publicEntries,
  semanticStepFor,
  transitionPower
} from "./contracts.js";

const POWER_ID = "contrast_sort";

function assertResumeHistory(common, resume, items, bins) {
  const placements = {};
  let status = "active";
  for (const { type, indexes } of parseSemanticHistory(common)) {
    if (status !== "active") throw new Error("Contrast Sort semantic resume history is impossible");
    if (type === "reverse_placement" && indexes.length === 1 && items[indexes[0]]) {
      delete placements[items[indexes[0]].id];
    } else if (type === common.expectedAction && indexes.length === 2
      && items[indexes[0]] && bins[indexes[1]]) {
      placements[items[indexes[0]].id] = bins[indexes[1]].id;
      status = "awaiting_mission_commit";
    } else throw new Error("Contrast Sort semantic resume history is impossible");
  }
  if (resume.status !== status
    || JSON.stringify(Object.entries(resume.placements).sort()) !== JSON.stringify(Object.entries(placements).sort())) {
    throw new Error("Contrast Sort resume checkpoint does not match its semantic history");
  }
}

export const contrastSort = Object.freeze({
  applyMissionCommitResult(state, result, context) {
    return applyMissionCommitToPower(state, result, context,
      (challenge, options) => contrastSort.createState(challenge, options));
  },

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
      max: 3,
      fields: ["id", "label", "token"]
    });
    const items = publicEntries(challenge.presentation?.items);
    const bins = publicEntries(challenge.presentation?.bins);
    if (items.length < 4 || items.length > 6 || bins.length < 2 || bins.length > 3) {
      throw new Error("Contrast Sort needs one current item from a four-to-six item set and two or three bins");
    }
    if (options.resume) {
      const sameCollection = (resumed, canonical) => Array.isArray(resumed)
        && resumed.length === canonical.length
        && resumed.every((item, index) => Object.keys(item || {}).length === 2
          && item.id === canonical[index].id && item.label === canonical[index].label);
      const placementEntries = options.resume.placements && typeof options.resume.placements === "object"
        && !Array.isArray(options.resume.placements)
        ? Object.entries(options.resume.placements)
        : null;
      if (!sameCollection(options.resume.items, items)
        || !sameCollection(options.resume.bins, bins)
        || !placementEntries
        || placementEntries.some(([itemId, binId]) => !items.some(item => item.id === itemId)
          || !bins.some(bin => bin.id === binId))) {
        throw new Error("Contrast Sort resume checkpoint is impossible");
      }
      assertResumeHistory(common, options.resume, items, bins);
    }
    const placements = options.resume?.placements || {};
    return deepFreezeClone({
      ...common,
      items,
      bins,
      placements,
      binTokens: Object.fromEntries(challenge.presentation.bins.map(bin => [bin.id, bin.token]))
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (inputHasExactKeys(input, ["type", "itemId"])
      && input.type === "reverse_placement" && typeof input.itemId === "string") {
      const itemIndex = state.items.findIndex(item => item.id === input.itemId);
      if (itemIndex < 0) return emptyPowerResult(state);
      const placements = { ...state.placements };
      delete placements[input.itemId];
      return deepFreezeClone({
        state: transitionPower(state, { placements }, semanticStepFor(state, "reverse_placement", itemIndex)),
        responseIntents: []
      });
    }
    if (!inputHasExactKeys(input, ["type", "itemId", "binId"])
      || input.type !== state.expectedAction
      || !state.items.some(item => item.id === input.itemId)
      || !state.bins.some(bin => bin.id === input.binId)) return emptyPowerResult(state);
    const itemIndex = state.items.findIndex(item => item.id === input.itemId);
    const binIndex = state.bins.findIndex(bin => bin.id === input.binId);
    return answerPower(state, challenge, state.binTokens[input.binId],
      semanticStepFor(state, state.expectedAction, itemIndex, binIndex), {
      placements: { ...state.placements, [input.itemId]: input.binId }
    });
  },

  view(state, challenge, assists) {
    assertReducerContext(state, challenge);
    return deepFreezeClone({
      ...commonView(state, challenge, assists),
      items: state.items,
      bins: state.bins,
      placements: state.placements
    });
  },

  checkpoint(state) {
    return checkpointState(state, ["items", "bins", "placements"]);
  }
});
