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

const POWER_ID = "echo_search";

function assertResumeHistory(common, resume, candidates) {
  const revealed = candidates.map(() => false);
  let foundCandidateId = null;
  let status = "active";
  for (const { type, indexes } of parseSemanticHistory(common)) {
    if (status !== "active" || indexes.length !== 1 || !candidates[indexes[0]]) {
      throw new Error("Echo Search semantic resume history is impossible");
    }
    if (type === "probe") revealed[indexes[0]] = true;
    else if (type === "confirm_candidate" && revealed[indexes[0]]) {
      foundCandidateId = candidates[indexes[0]].id;
      status = "awaiting_mission_commit";
    } else throw new Error("Echo Search semantic resume history is impossible");
  }
  if (resume.status !== status
    || resume.sourceRevealed !== false
    || resume.foundCandidateId !== foundCandidateId
    || resume.candidates.some((candidate, index) => candidate.revealed !== revealed[index])) {
    throw new Error("Echo Search resume checkpoint does not match its semantic history");
  }
}

export const echoSearch = Object.freeze({
  applyMissionCommitResult(state, result, context) {
    return applyMissionCommitToPower(state, result, context,
      (challenge, options) => echoSearch.createState(challenge, options));
  },

  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options, [
      "candidates", "foundCandidateId", "sourceRevealed"
    ]);
    assertStableCollection(challenge.presentation?.candidates, {
      name: "Echo Search candidates",
      contextId: common.interactionContextId,
      min: 2,
      max: 6,
      fields: ["id", "label", "token"]
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
        || options.resume.candidates.some((item, index) => Object.keys(item || {}).length !== 3
          || item.id !== candidates[index].id
          || item.label !== candidates[index].label
          || typeof item.revealed !== "boolean")
        || (options.resume.foundCandidateId !== null
          && !options.resume.candidates.some(item => item.id === options.resume.foundCandidateId && item.revealed))
        || options.resume.sourceRevealed !== false
        || (options.resume.status === "active" && options.resume.foundCandidateId !== null)) {
        throw new Error("Echo Search resume checkpoint is impossible");
      }
      assertResumeHistory(common, options.resume, candidates);
    }
    return deepFreezeClone({
      ...common,
      candidates,
      foundCandidateId: candidates.some(item => item.id === options.resume?.foundCandidateId)
        ? options.resume.foundCandidateId
        : null,
      sourceRevealed: options.resume?.sourceRevealed === true,
      candidateTokens: Object.fromEntries(challenge.presentation.candidates.map(candidate => [candidate.id, candidate.token]))
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
        state: transitionPower(state, { candidates }, semanticStepFor(state, "probe", index)),
        responseIntents: Object.freeze([])
      });
    }
    if (inputHasExactKeys(input, ["type", "candidateId"])
      && input.type === "confirm_candidate" && typeof input.candidateId === "string"
      && state.candidates.some(item => item.id === input.candidateId && item.revealed)) {
      const index = state.candidates.findIndex(item => item.id === input.candidateId);
      return answerPower(state, challenge, state.candidateTokens[input.candidateId],
        semanticStepFor(state, "confirm_candidate", index), { foundCandidateId: input.candidateId });
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
