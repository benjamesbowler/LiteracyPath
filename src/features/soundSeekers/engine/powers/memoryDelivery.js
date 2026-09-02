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

const POWER_ID = "memory_delivery";

export const memoryDelivery = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options);
    const recipients = publicEntries(challenge.presentation?.recipients);
    if (recipients.length === 0) throw new Error("Memory Delivery needs a meaningful recipient");
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
    if (input?.type === "receive_cue") {
      return Object.freeze({ state: transitionPower(state, { cueReceived: true, cueVisible: true }, "receive_cue"), responseIntents: Object.freeze([]) });
    }
    if (input?.type === "replay_cue" && state.cueReceived) {
      return Object.freeze({ state: transitionPower(state, { replayCount: state.replayCount + 1 }, "replay_cue"), responseIntents: Object.freeze([]) });
    }
    if (input?.type === "move" && state.cueReceived) {
      return Object.freeze({ state: transitionPower(state, { cueVisible: false, routeProgress: state.routeProgress + 1 }, "move"), responseIntents: Object.freeze([]) });
    }
    if (input?.type === "arrive" && state.cueReceived && state.routeProgress > 0) {
      return Object.freeze({ state: transitionPower(state, { arrived: true }, "arrive"), responseIntents: Object.freeze([]) });
    }
    if (input?.type === state.expectedAction && state.arrived) {
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
