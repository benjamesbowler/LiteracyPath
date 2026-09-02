import {
  answerPower,
  assertReducerContext,
  checkpointState,
  commonView,
  createCommonState,
  deepFreezeClone,
  emptyPowerResult,
  inputHasExactKeys,
  morphologyPower,
  publicEntries
} from "./contracts.js";

const POWER_ID = "word_forge";

function initialRack(challenge) {
  return (challenge.presentation?.rack || []).map(tile => ({
    id: tile.id,
    label: tile.label,
    token: tile.token,
    placed: false
  }));
}

function initialSlots(challenge) {
  return (challenge.presentation?.slots || []).map(slot => ({ id: slot.id, tileId: null }));
}

export const wordForge = Object.freeze({
  createState(challenge, options = {}) {
    const common = createCommonState(POWER_ID, challenge, options);
    if (common.morphology) {
      const tileId = "morphology-ending-tile";
      const resumedPlaced = options.resume?.rack?.find(tile => tile.id === tileId)?.placed === true;
      return deepFreezeClone({
        ...common,
        rack: [{ id: tileId, label: common.morphology.ending, placed: resumedPlaced }],
        slots: [
          { id: "morphology-base-slot", tileId: "morphology-base-fixed" },
          { id: "morphology-ending-slot", tileId: resumedPlaced ? tileId : null }
        ],
        sweep: options.resume?.sweep === "meaning_ready" ? "meaning_ready" : "not_ready"
      });
    }
    const rack = initialRack(challenge);
    const slots = initialSlots(challenge);
    if (rack.length < 2 || slots.length === 0 || rack.some(tile => !tile.id || !tile.label)) {
      throw new Error("Word Forge needs a stable rack and sound slots");
    }
    const canonicalSlotIds = new Set(slots.map(slot => slot.id));
    const canonicalRackIds = new Set(rack.map(tile => tile.id));
    const resumeSlotsAreValid = Array.isArray(options.resume?.slots)
      && options.resume.slots.length === slots.length
      && options.resume.slots.every(slot => canonicalSlotIds.has(slot.id)
        && (slot.tileId === null || canonicalRackIds.has(slot.tileId)));
    const resumedSlots = resumeSlotsAreValid ? options.resume.slots : slots;
    const placedIds = new Set(resumedSlots.map(slot => slot.tileId).filter(Boolean));
    return deepFreezeClone({
      ...common,
      rack: rack.map(tile => ({ ...tile, placed: placedIds.has(tile.id) })),
      slots: resumedSlots,
      sweep: ["not_ready", "ready", "complete", "meaning_ready"].includes(options.resume?.sweep)
        ? options.resume.sweep
        : "not_ready"
    });
  },

  reduce(state, input, { challenge } = {}) {
    assertReducerContext(state, challenge);
    if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
    if (state.morphology) {
      if (!inputHasExactKeys(input, ["type", "tileId"])
        || input.type !== "place_tile"
        || input.tileId !== "morphology-ending-tile"
        || state.rack[0]?.placed) return emptyPowerResult(state);
      const rack = state.rack.map(tile => ({ ...tile, placed: true }));
      const slots = state.slots.map(slot => slot.id === "morphology-ending-slot"
        ? { ...slot, tileId: input.tileId }
        : slot);
      return morphologyPower(state, challenge, "place_tile", {
        rack,
        slots,
        sweep: "meaning_ready"
      });
    }
    if (!inputHasExactKeys(input, ["type", "tileId"]) || input.type !== "place_tile") {
      return emptyPowerResult(state);
    }
    const tile = state.rack.find(item => item.id === input.tileId && !item.placed);
    const position = Number.isInteger(challenge.position)
      ? challenge.position
      : state.slots.findIndex(slot => !slot.tileId);
    if (!tile || position < 0 || !state.slots[position]) return emptyPowerResult(state);
    const slots = state.slots.map((slot, index) => index === position ? { ...slot, tileId: tile.id } : slot);
    const rack = state.rack.map(item => item.id === tile.id ? { ...item, placed: true } : item);
    return answerPower(state, challenge, tile.token, "place_tile", { slots, rack });
  },

  view(state, challenge) {
    assertReducerContext(state, challenge);
    return deepFreezeClone({
      ...commonView(state, challenge),
      slots: publicEntries(state.slots, ["id", "tileId"]),
      rack: publicEntries(state.rack),
      sweep: state.sweep,
      morphology: state.morphology
    });
  },

  checkpoint(state) {
    const rack = state.rack.map(({ id, label, placed }) => ({ id, label, placed }));
    return checkpointState({ ...state, rack }, ["slots", "rack", "sweep", "morphology"]);
  }
});
