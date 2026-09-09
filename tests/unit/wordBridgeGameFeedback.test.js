import test from "node:test";
import assert from "node:assert/strict";
import { createBridgeStage, createBridgeRun, selectBridgeTile, placeBridgeTile, bridgeSupport, mismatchFeedback } from "../../src/components/learn/games/games/wordBridgePlacement.js";
import { buildLevel } from "../../src/utils/wordBridgeLevels.js";
test("wrong repair retains first response, correct pieces, and records only successful assisted retry", () => {
  let state = createBridgeStage(buildLevel({ world: "meadow", cycle: 0, target: "bat" }), 0, true);
  let run = createBridgeRun();
  state.cueDelivery = "completed";
  const pick = (glyph, slot) => {
    state = selectBridgeTile(state, state.tiles.find(t => t.glyph === glyph).occurrenceId);
    const result = placeBridgeTile(state, run, state.slots[slot].slotId);
    state = result.state; run = result.run;
  };
  pick("B", 0);
  const prior = state.slots[0];
  pick(state.tiles.find(t => !t.correct).glyph, 1);
  assert.equal(state.slots[0], prior);
  assert.equal(state.selected, null);
  assert.equal(state.modelShown, true);
  assert.equal(run.assistedRetries.length, 0);
  const wrong = run.firstResponses[1];
  assert.equal(wrong.correct, false);
  assert.equal(wrong.targetPart, "A");
  assert.equal(wrong.supportUsed.includes("printed_model"), false);
  pick("A", 1);
  assert.equal(run.firstResponses[1], wrong);
  assert.equal(run.assistedRetries[0].attempts, 2);
  assert.equal(run.assistedRetries[0].correct, true);
  assert.ok(run.assistedRetries[0].supportUsed.includes("printed_model"));
});
test("actual cue delivery and actual model exposure determine support", () => {
  const state = createBridgeStage(buildLevel({ world: "meadow", target: "bat" }), 0, true);
  assert.deepEqual(bridgeSupport(state).supportUsed, []);
  assert.deepEqual(bridgeSupport({ ...state, cueDelivery: "started" }).supportUsed, []);
  assert.deepEqual(bridgeSupport({ ...state, cueDelivery: "completed" }).supportUsed, ["recorded_target_cue"]);
  assert.deepEqual(bridgeSupport({ ...state, modelShown: true, cueDelivery: "failed" }).supportUsed, ["printed_model", "ghost_slots", "audio_failed"]);
  assert.equal(bridgeSupport(state).independent, false);
});
test("feedback identifies the actual response and repair", () => {
  assert.equal(mismatchFeedback("sat", "cat"), "You chose sat. This space needs cat. Try again.");
});

test("repeated mistakes reduce the completed bridge's stars under the shared rubric", () => {
  let state = createBridgeStage(buildLevel({ world: "meadow", target: "bat" }), 0);
  let run = createBridgeRun();
  const answer = (glyph, index) => {
    const selected = state.tiles.find(tile => tile.glyph === glyph);
    state = selectBridgeTile(state, selected.occurrenceId);
    const result = placeBridgeTile(state, run, state.slots[index].slotId);
    state = result.state; run = result.run;
  };
  const wrong = state.tiles.find(tile => !tile.correct).glyph;
  answer(wrong, 0); answer(wrong, 0); answer(wrong, 0);
  answer("B", 0); answer("A", 1); answer("T", 2);
  assert.equal(run.stars[0], 1);
  assert.equal(run.firstResponses[0].correct, false);
  assert.equal(run.assistedRetries[0].attempts, 4);
});
