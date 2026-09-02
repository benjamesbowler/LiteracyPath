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

const POWER_ID = "echo_search";

export const echoSearch = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options, [
      "candidates", "foundCandidateId", "sourceRevealed"
    ]);
    assertStableCollection(challenge.presentation?.candidates, {
      name: "Echo Search candidates",
      contextId: common.interactionContextId,
      min: 2,
      max: 6
    });
    const resumedCandidates = new Map((options.resume?.candidates || []).map(item => [item.id, item]));
    const candidates = (challenge.presentation?.candidates || []).map(item => ({
      id: item.id,
      label: item.label,
      revealed: resumedCandidates.get(item.id)?.revealed === true
    }));
    if (candidates.length < 2 || candidates.some(item => !item.id)) {
      throw new Error("Echo Search needs at least two stable candidates");
    }
    if (options.resume) {
      if (!Array.isArray(options.resume.candidates)
        || options.resume.candidates.length !== candidates.length
        || options.resume.candidates.some((item, index) => item.id !== candidates[index].id
          || item.label !== candidates[index].label
          || typeof item.revealed !== "boolean")
        || (options.resume.foundCandidateId !== null
          && !options.resume.candidates.some(item => item.id === options.resume.foundCandidateId && item.revealed))
        || options.resume.sourceRevealed !== false
        || (options.resume.status === "awaiting_mission_commit"
          && (options.resume.foundCandidateId === null || options.resume.semanticSteps.at(-1) !== "confirm_candidate"))
        || (options.resume.status === "active" && options.resume.foundCandidateId !== null)) {
        throw new Error("Echo Search resume checkpoint is impossible");
      }
    }
    return deepFreezeClone({
      ...common,
      candidates,
      foundCandidateId: candidates.some(item => item.id === options.resume?.foundCandidateId)
        ? options.resume.foundCandidateId
        : null,
      sourceRevealed: options.resume?.sourceRevealed === true
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (inputHasExactKeys(input, ["type", "candidateId"])
      && input.type === "probe" && typeof input.candidateId === "string") {
      const index = state.candidates.findIndex(item => item.id === input.candidateId);
      if (index < 0) return emptyPowerResult(state);
      const candidates = state.candidates.map((item, itemIndex) => itemIndex === index ? { ...item, revealed: true } : item);
      return Object.freeze({
        state: transitionPower(state, { candidates }, `probe:${input.candidateId}`),
        responseIntents: Object.freeze([])
      });
    }
    if (inputHasExactKeys(input, ["type", "candidateId", "token"])
      && input.type === "confirm_candidate" && typeof input.candidateId === "string"
      && state.candidates.some(item => item.id === input.candidateId && item.revealed)) {
      return answerPower(state, challenge, input.token, "confirm_candidate", { foundCandidateId: input.candidateId });
    }
    return emptyPowerResult(state);
  },

  view(state, challenge) {
    assertReducerContext(state, challenge);
    return deepFreezeClone({
      ...commonView(state, challenge),
      candidates: publicEntries(state.candidates, ["id", "label", "revealed"]),
      foundCandidateId: state.foundCandidateId,
      sourceRevealed: state.sourceRevealed
    });
  },

  checkpoint(state) {
    return checkpointState(state, ["candidates", "foundCandidateId", "sourceRevealed"]);
  }
});
