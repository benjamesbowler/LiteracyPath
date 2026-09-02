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

const POWER_ID = "blend_bridge";

export const blendBridge = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options, [
      "segments", "nextSegmentIndex", "sweepComplete", "choices"
    ]);
    assertStableCollection(challenge.presentation?.segments, {
      name: "Blend Bridge segments",
      contextId: common.interactionContextId,
      min: 1,
      max: 12
    });
    assertStableCollection(challenge.presentation?.choices, {
      name: "Blend Bridge choices",
      contextId: common.interactionContextId,
      min: 2,
      max: 6,
      fields: ["id", "label", "token"]
    });
    const resumedSegments = new Map((options.resume?.segments || []).map(item => [item.id, item]));
    const segments = (challenge.presentation?.segments || []).map(item => ({
      id: item.id,
      label: item.label,
      active: resumedSegments.get(item.id)?.active === true
    }));
    if (segments.length === 0) throw new Error("Blend Bridge needs ordered grapheme segments");
    const choices = publicEntries(challenge.presentation?.choices);
    if (options.resume) {
      const validSegments = Array.isArray(options.resume.segments)
        && options.resume.segments.length === segments.length
        && options.resume.segments.every((segment, index) => Object.keys(segment || {}).length === 3
          && segment.id === segments[index].id && segment.label === segments[index].label
          && typeof segment.active === "boolean");
      const validChoices = Array.isArray(options.resume.choices)
        && options.resume.choices.length === choices.length
        && options.resume.choices.every((choice, index) => Object.keys(choice || {}).length === 2
          && choice.id === choices[index].id && choice.label === choices[index].label);
      const activeCount = validSegments ? options.resume.segments.filter(segment => segment.active).length : -1;
      const contiguous = validSegments && options.resume.segments.every((segment, index) => segment.active === (index < activeCount));
      if (!validSegments || !validChoices || !contiguous
        || !Number.isInteger(options.resume.nextSegmentIndex)
        || options.resume.nextSegmentIndex !== activeCount
        || typeof options.resume.sweepComplete !== "boolean"
        || (options.resume.sweepComplete && activeCount !== segments.length)
        || (options.resume.status === "awaiting_mission_commit"
          && (!options.resume.sweepComplete || options.resume.semanticSteps.at(-1) !== common.expectedAction))) {
        throw new Error("Blend Bridge resume checkpoint is impossible");
      }
    }
    return deepFreezeClone({
      ...common,
      segments,
      nextSegmentIndex: Number.isInteger(options.resume?.nextSegmentIndex)
        ? Math.max(0, Math.min(segments.length, options.resume.nextSegmentIndex))
        : segments.filter(item => item.active).length,
      sweepComplete: options.resume?.sweepComplete === true,
      choices,
      choiceTokens: Object.fromEntries(challenge.presentation.choices.map(choice => [choice.id, choice.token]))
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (inputHasExactKeys(input, ["type", "segmentId"]) && input.type === "activate_segment") {
      const expected = state.segments[state.nextSegmentIndex];
      if (!expected || expected.id !== input.segmentId) return emptyPowerResult(state);
      const segments = state.segments.map((item, index) => index === state.nextSegmentIndex ? { ...item, active: true } : item);
      return Object.freeze({
        state: transitionPower(state, { segments, nextSegmentIndex: state.nextSegmentIndex + 1 }, `activate_segment:${input.segmentId}`),
        responseIntents: Object.freeze([])
      });
    }
    if (inputHasExactKeys(input, ["type"])
      && input.type === "sweep_blend" && state.nextSegmentIndex === state.segments.length) {
      return Object.freeze({
        state: transitionPower(state, { sweepComplete: true }, "sweep_blend"),
        responseIntents: Object.freeze([])
      });
    }
    if (inputHasExactKeys(input, ["type", "choiceId", "token"])
      && input.type === state.expectedAction && state.sweepComplete
      && state.choices.some(choice => choice.id === input.choiceId)
      && state.choiceTokens[input.choiceId] === input.token) {
      return answerPower(state, challenge, input.token, state.expectedAction);
    }
    return emptyPowerResult(state);
  },

  view(state, challenge) {
    assertReducerContext(state, challenge);
    return deepFreezeClone({
      ...commonView(state, challenge),
      segments: publicEntries(state.segments, ["id", "label", "active"]),
      sweepComplete: state.sweepComplete,
      choices: state.choices
    });
  },

  checkpoint(state) {
    return checkpointState(state, ["segments", "nextSegmentIndex", "sweepComplete", "choices"]);
  }
});
