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

const POWER_ID = "memory_delivery";

export const memoryDelivery = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options, [
      "cueReceived", "cueVisible", "replayCount", "routeProgress", "arrived", "recipients"
    ]);
    assertStableCollection(challenge.presentation?.recipients, {
      name: "Memory Delivery recipients",
      contextId: common.interactionContextId,
      min: 1,
      max: 6
    });
    const recipients = publicEntries(challenge.presentation?.recipients);
    if (recipients.length === 0) throw new Error("Memory Delivery needs a meaningful recipient");
    if (options.resume) {
      const validRecipients = Array.isArray(options.resume.recipients)
        && options.resume.recipients.length === recipients.length
        && options.resume.recipients.every((recipient, index) => Object.keys(recipient || {}).length === 2
          && recipient.id === recipients[index].id && recipient.label === recipients[index].label);
      if (!validRecipients
        || typeof options.resume.cueReceived !== "boolean"
        || typeof options.resume.cueVisible !== "boolean"
        || !Number.isInteger(options.resume.replayCount) || options.resume.replayCount < 0
        || !Number.isInteger(options.resume.routeProgress) || options.resume.routeProgress < 0
        || typeof options.resume.arrived !== "boolean"
        || (options.resume.cueVisible && (!options.resume.cueReceived
          || options.resume.routeProgress !== 0 || options.resume.arrived))
        || (options.resume.routeProgress > 0 && (!options.resume.cueReceived || options.resume.cueVisible))
        || (options.resume.arrived && (!options.resume.cueReceived
          || options.resume.routeProgress === 0 || options.resume.cueVisible))
        || (options.resume.status === "awaiting_mission_commit"
          && (!options.resume.arrived || options.resume.semanticSteps.at(-1) !== common.expectedAction))) {
        throw new Error("Memory Delivery resume checkpoint is impossible");
      }
    }
    return deepFreezeClone({
      ...common,
      cueReceived: options.resume?.cueReceived === true,
      cueVisible: options.resume?.cueVisible === true,
      replayCount: Number.isInteger(options.resume?.replayCount) && options.resume.replayCount >= 0
        ? options.resume.replayCount
        : 0,
      routeProgress: Number.isInteger(options.resume?.routeProgress) && options.resume.routeProgress >= 0
        ? options.resume.routeProgress
        : 0,
      arrived: options.resume?.arrived === true,
      recipients
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (inputHasExactKeys(input, ["type"]) && input.type === "receive_cue") {
      return Object.freeze({ state: transitionPower(state, { cueReceived: true, cueVisible: true }, "receive_cue"), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type"]) && input.type === "replay_cue" && state.cueReceived) {
      return Object.freeze({ state: transitionPower(state, { replayCount: state.replayCount + 1 }, "replay_cue"), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type", "dx", "dy"])
      && input.type === "move" && state.cueReceived
      && Number.isFinite(input.dx) && Number.isFinite(input.dy)
      && (input.dx !== 0 || input.dy !== 0)) {
      return Object.freeze({ state: transitionPower(state, { cueVisible: false, routeProgress: state.routeProgress + 1 }, "move"), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type"])
      && input.type === "arrive" && state.cueReceived && state.routeProgress > 0) {
      return Object.freeze({ state: transitionPower(state, { arrived: true }, "arrive"), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type", "recipientId", "token"])
      && input.type === state.expectedAction && state.arrived
      && state.recipients.some(recipient => recipient.id === input.recipientId)) {
      return answerPower(state, challenge, input.token, state.expectedAction);
    }
    return emptyPowerResult(state);
  },

  view(state, challenge) {
    assertReducerContext(state, challenge);
    return deepFreezeClone({
      ...commonView(state, challenge),
      cueReceived: state.cueReceived,
      cueVisible: state.cueVisible,
      routeProgress: state.routeProgress,
      arrived: state.arrived,
      recipients: state.recipients
    });
  },

  checkpoint(state) {
    return checkpointState(state, ["cueReceived", "cueVisible", "replayCount", "routeProgress", "arrived", "recipients"]);
  }
});
