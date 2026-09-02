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
  parseSemanticHistory,
  publicEntries,
  semanticStepFor,
  tokenIsValid,
  transitionPower
} from "./contracts.js";

const POWER_ID = "story_power";

function assertResumeHistory(common, resume, choices, choiceTokens) {
  let textRead = false;
  let narrativeChoiceToken = null;
  let status = "active";
  for (const { type, indexes } of parseSemanticHistory(common)) {
    if (status !== "active") throw new Error("Story Power semantic resume history is impossible");
    if (type === "read_text" && indexes.length === 0) textRead = true;
    else if (type === "narrative_choice" && indexes.length === 1 && choices[indexes[0]] && textRead) {
      narrativeChoiceToken = choiceTokens[choices[indexes[0]].id];
    } else if (type === common.expectedAction && indexes.length === 1 && choices[indexes[0]] && textRead) {
      status = "awaiting_mission_commit";
    } else throw new Error("Story Power semantic resume history is impossible");
  }
  if (resume.status !== status || resume.textRead !== textRead
    || resume.narrativeChoiceToken !== narrativeChoiceToken) {
    throw new Error("Story Power resume checkpoint does not match its semantic history");
  }
}

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
    const choiceTokens = Object.fromEntries(challenge.presentation.choices.map(choice => [choice.id, choice.token]));
    if (choices.length === 0) throw new Error("Story Power needs text-supported choices");
    if (options.resume) {
      const validChoices = Array.isArray(options.resume.choices)
        && options.resume.choices.length === choices.length
        && options.resume.choices.every((choice, index) => Object.keys(choice || {}).length === 2
          && choice.id === choices[index].id && choice.label === choices[index].label);
      if (!validChoices
        || typeof options.resume.textRead !== "boolean"
        || (options.resume.narrativeChoiceToken !== null
          && !tokenIsValid(options.resume.narrativeChoiceToken))) {
        throw new Error("Story Power resume checkpoint is impossible");
      }
      assertResumeHistory(common, options.resume, choices, choiceTokens);
    }
    return deepFreezeClone({
      ...common,
      textRead: options.resume?.textRead === true,
      narrativeChoiceToken: tokenIsValid(options.resume?.narrativeChoiceToken)
        ? options.resume.narrativeChoiceToken
        : null,
      choices,
      choiceTokens
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (inputHasExactKeys(input, ["type"]) && input.type === "read_text") {
      return Object.freeze({ state: transitionPower(state, { textRead: true }, semanticStepFor(state, "read_text")), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type", "choiceId"])
      && input.type === "narrative_choice" && state.textRead
      && state.choices.some(choice => choice.id === input.choiceId)) {
      const choiceIndex = state.choices.findIndex(choice => choice.id === input.choiceId);
      return Object.freeze({
        state: transitionPower(state, { narrativeChoiceToken: state.choiceTokens[input.choiceId] },
          semanticStepFor(state, "narrative_choice", choiceIndex)),
        responseIntents: Object.freeze([])
      });
    }
    if (inputHasExactKeys(input, ["type", "choiceId", "token"])
      && input.type === state.expectedAction && state.textRead
      && state.choices.some(choice => choice.id === input.choiceId)
      && state.choiceTokens[input.choiceId] === input.token) {
      const choiceIndex = state.choices.findIndex(choice => choice.id === input.choiceId);
      return answerPower(state, challenge, input.token,
        semanticStepFor(state, state.expectedAction, choiceIndex));
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
