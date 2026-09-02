import {
  answerPower,
  assertReducerContext,
  checkpointState,
  commonView,
  createCommonState,
  deepFreezeClone,
  emptyPowerResult,
  publicEntries,
  tokenIsValid,
  transitionPower
} from "./contracts.js";

const POWER_ID = "story_power";

export const storyPower = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options);
    const choices = publicEntries(challenge.presentation?.choices);
    if (choices.length === 0) throw new Error("Story Power needs text-supported choices");
    return deepFreezeClone({
      ...common,
      textRead: options.resume?.textRead === true,
      narrativeChoiceToken: tokenIsValid(options.resume?.narrativeChoiceToken)
        ? options.resume.narrativeChoiceToken
        : null,
      choices
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (input?.type === "read_text") {
      return Object.freeze({ state: transitionPower(state, { textRead: true }, "read_text"), responseIntents: Object.freeze([]) });
    }
    if (input?.type === "narrative_choice" && tokenIsValid(input.token)) {
      return Object.freeze({
        state: transitionPower(state, { narrativeChoiceToken: input.token }, "narrative_choice"),
        responseIntents: Object.freeze([])
      });
    }
    if (input?.type === state.expectedAction && state.textRead) {
      return answerPower(state, challenge, input.token, state.expectedAction);
    }
    return emptyPowerResult(state);
  },

  view(state, challenge) {
    assertReducerContext(state, challenge);
    return deepFreezeClone({
      ...commonView(state, challenge),
      textRead: state.textRead,
      choices: state.choices,
      narrativeChoiceMade: state.narrativeChoiceToken !== null
    });
  },

  checkpoint(state) {
    return checkpointState(state, ["textRead", "choices", "narrativeChoiceToken"]);
  }
});
