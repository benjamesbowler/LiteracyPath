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
  transitionPower
} from "./contracts.js";

const POWER_ID = "memory_delivery";

function assertResumeHistory(common, resume, recipients) {
  let cueReceived = false;
  let cueVisible = false;
  let replayCount = 0;
  let routeProgress = 0;
  let arrived = false;
  let status = "active";
  for (const { type, indexes } of parseSemanticHistory(common)) {
    if (status !== "active") throw new Error("Memory Delivery semantic resume history is impossible");
    if (type === "receive_cue" && indexes.length === 0 && !cueReceived) {
      cueReceived = true;
      cueVisible = true;
    } else if (type === "replay_cue" && indexes.length === 0 && cueReceived && !arrived) {
      replayCount += 1;
    } else if (type === "move" && indexes.length === 0 && cueReceived && !arrived) {
      cueVisible = false;
      routeProgress += 1;
    } else if (type === "arrive" && indexes.length === 0 && cueReceived && routeProgress > 0 && !arrived) {
      arrived = true;
    } else if (type === common.expectedAction && indexes.length === 1 && recipients[indexes[0]] && arrived) {
      status = "awaiting_mission_commit";
    } else throw new Error("Memory Delivery semantic resume history is impossible");
  }
  if (resume.status !== status || resume.cueReceived !== cueReceived || resume.cueVisible !== cueVisible
    || resume.replayCount !== replayCount || resume.routeProgress !== routeProgress || resume.arrived !== arrived) {
    throw new Error("Memory Delivery resume checkpoint does not match its semantic history");
  }
}

export const memoryDelivery = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options, [
      "cueReceived", "cueVisible", "replayCount", "routeProgress", "arrived", "recipients"
    ]);
    assertStableCollection(challenge.presentation?.recipients, {
      name: "Memory Delivery recipients",
      contextId: common.interactionContextId,
      min: 1,
      max: 6,
      fields: ["id", "label", "token"]
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
          || options.resume.routeProgress === 0 || options.resume.cueVisible))) {
        throw new Error("Memory Delivery resume checkpoint is impossible");
      }
      assertResumeHistory(common, options.resume, recipients);
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
      recipients,
      recipientTokens: Object.fromEntries(challenge.presentation.recipients.map(recipient => [recipient.id, recipient.token]))
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (inputHasExactKeys(input, ["type"]) && input.type === "receive_cue" && !state.cueReceived) {
      return Object.freeze({ state: transitionPower(state, { cueReceived: true, cueVisible: true }, semanticStepFor(state, "receive_cue")), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type"]) && input.type === "replay_cue" && state.cueReceived && !state.arrived) {
      return Object.freeze({ state: transitionPower(state, { replayCount: state.replayCount + 1 }, semanticStepFor(state, "replay_cue")), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type", "dx", "dy"])
      && input.type === "move" && state.cueReceived && !state.arrived
      && Number.isFinite(input.dx) && Number.isFinite(input.dy)
      && (input.dx !== 0 || input.dy !== 0)) {
      return Object.freeze({ state: transitionPower(state, { cueVisible: false, routeProgress: state.routeProgress + 1 }, semanticStepFor(state, "move")), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type"])
      && input.type === "arrive" && state.cueReceived && state.routeProgress > 0 && !state.arrived) {
      return Object.freeze({ state: transitionPower(state, { arrived: true }, semanticStepFor(state, "arrive")), responseIntents: Object.freeze([]) });
    }
    if (inputHasExactKeys(input, ["type", "recipientId"])
      && input.type === state.expectedAction && state.arrived
      && state.recipients.some(recipient => recipient.id === input.recipientId)) {
      const recipientIndex = state.recipients.findIndex(recipient => recipient.id === input.recipientId);
      return answerPower(state, challenge, state.recipientTokens[input.recipientId],
        semanticStepFor(state, state.expectedAction, recipientIndex));
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
