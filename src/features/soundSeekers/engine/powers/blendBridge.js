import {
  answerPower,
  assertReducerContext,
  checkpointState,
  commonView,
  createCommonState,
  deepFreezeClone,
  emptyPowerResult,
  publicEntries,
  transitionPower
} from "./contracts.js";

const POWER_ID = "blend_bridge";

export const blendBridge = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options);
    const resumedSegments = new Map((options.resume?.segments || []).map(item => [item.id, item]));
    const segments = (challenge.presentation?.segments || []).map(item => ({
      id: item.id,
      label: item.label,
      active: resumedSegments.get(item.id)?.active === true
    }));
    if (segments.length === 0) throw new Error("Blend Bridge needs ordered grapheme segments");
    return deepFreezeClone({
      ...common,
      segments,
      nextSegmentIndex: Number.isInteger(options.resume?.nextSegmentIndex)
        ? Math.max(0, Math.min(segments.length, options.resume.nextSegmentIndex))
        : segments.filter(item => item.active).length,
      sweepComplete: options.resume?.sweepComplete === true,
      choices: publicEntries(challenge.presentation?.choices)
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (input?.type === "activate_segment") {
      const expected = state.segments[state.nextSegmentIndex];
      if (!expected || expected.id !== input.segmentId) return emptyPowerResult(state);
      const segments = state.segments.map((item, index) => index === state.nextSegmentIndex ? { ...item, active: true } : item);
      return Object.freeze({
        state: transitionPower(state, { segments, nextSegmentIndex: state.nextSegmentIndex + 1 }, `activate_segment:${input.segmentId}`),
        responseIntents: Object.freeze([])
      });
    }
    if (input?.type === "sweep_blend" && state.nextSegmentIndex === state.segments.length) {
      return Object.freeze({
        state: transitionPower(state, { sweepComplete: true }, "sweep_blend"),
        responseIntents: Object.freeze([])
      });
    }
    if (input?.type === state.expectedAction && state.sweepComplete) {
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
