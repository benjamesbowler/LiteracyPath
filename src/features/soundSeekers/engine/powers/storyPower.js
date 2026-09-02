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
  tokenIsValid,
  transitionPower
} from "./contracts.js";

const POWER_ID = "story_power";

export const storyPower = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options, ["textRead", "choices", "narrativeChoiceToken"]);
    assertStableCollection(challenge.presentation?.choices, {
      name: "Story Power choices",
      contextId: common.interactionContextId,
      min: 2,
      max: 6,
      fields: ["id", "label", "token"]
    });
    const choices = publicEntries(challenge.presentation?.choices);
    if (choices.length === 0) throw new Error("Story Power needs text-supported choices");
    if (options.resume) {
      const validChoices = Array.isArray(options.resume.choices)
        && options.resume.choices.length === choices.length
        && options.resume.choices.every((choice, index) => Object.keys(choice || {}).length === 2
          && choice.id === choices[index].id && choice.label === choices[index].label);
      if (!validChoices
        || typeof options.resume.textRead !== "boolean"
        || (options.resume.narrativeChoiceToken !== null
          && !tokenIsValid(options.resume.narrativeChoiceToken))
        || (options.resume.status === "awaiting_mission_commit"
          && (!options.resume.textRead || options.resume.semanticSteps.at(-1) !== common.expectedAction))) {
        throw new Error("Story Power resume checkpoint is impossible");
      }
    }
    return deepFreezeClone({
      ...common,
      textRead: options.resume?.textRead === true,
      narrativeChoiceToken: tokenIsValid(options.resume?.narrativeChoiceToken)
        ? options.resume.narrativeChoiceToken
        : null,
      choices,
      choiceTokens: Object.fromEntries(challenge.presentation.choices.map(choice => [choice.id, choice.token]))
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (inputHasExactKeys(input, ["type"]) && input.type === "read_text") {
      return Object.freeze({ state: transitionPower(state, { textRead: true }, "read_text"), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type", "token"])
      && input.type === "narrative_choice" && tokenIsValid(input.token)) {
      return Object.freeze({
        state: transitionPower(state, { narrativeChoiceToken: input.token }, "narrative_choice"),
        responseIntents: Object.freeze([])
      });
    }
    if (inputHasExactKeys(input, ["type", "choiceId", "token"])
      && input.type === state.expectedAction && state.textRead
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
      textRead: state.textRead,
      choices: state.choices,
      narrativeChoiceMade: state.narrativeChoiceToken !== null
    });
  },

  checkpoint(state) {
    return checkpointState(state, ["textRead", "choices", "narrativeChoiceToken"]);
  }
});
