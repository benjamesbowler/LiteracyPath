import test from "node:test";
import assert from "node:assert/strict";
import { createBridgeStage, createBridgeRun, selectBridgeTile, placeBridgeTile, bridgeReceipt, createBridgeIdentities } from "../../src/components/learn/games/games/wordBridgePlacement.js";
import { buildLevel, wordBridgeLadder } from "../../src/utils/wordBridgeLevels.js";

test("identical tokens work in opposite sockets; repeated commits and cancellation do not score", () => {
  const level = buildLevel({ world: "dino", target: "tent", cycle: 5 });
  let state = createBridgeStage(level, 5), run = createBridgeRun(5);
  const ts = state.tiles.filter(tile => tile.glyph === "T");
  assert.notEqual(ts[0].occurrenceId, ts[1].occurrenceId);
  for (const tile of ts) {
    const index = tile.order === 0 ? 3 : 0;
    state = selectBridgeTile(state, tile.occurrenceId);
    const placed = placeBridgeTile(state, run, state.slots[index].slotId);
    state = placed.state; run = placed.run;
    assert.equal(state.slots[index].occurrenceId, tile.occurrenceId);
    const repeated = placeBridgeTile(state, run, state.slots[index].slotId);
    assert.equal(repeated.run, run);
    assert.equal(repeated.outcome, "cancelled");
  }
  assert.equal(run.score, 70);
  const cancelTile = state.tiles.find(tile => tile.glyph === "E");
  state = selectBridgeTile(state, cancelTile.occurrenceId);
  state = selectBridgeTile(state, cancelTile.occurrenceId);
  assert.equal(state.selected, null);
  assert.equal(placeBridgeTile(state, run, state.slots[1].slotId).run, run);
});

test("all authored ladders complete in reverse socket order and immutable receipts have only learning points", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    let run = createBridgeRun();
    for (const [stage, level] of wordBridgeLadder(difficulty).entries()) {
      let state = createBridgeStage(level, stage);
      const ids = createBridgeIdentities(stage, level.target, level.tiles);
      assert.equal(new Set(ids.tiles.map(tile => tile.occurrenceId)).size, ids.tiles.length);
      for (const slot of [...state.slots].reverse()) {
        const used = new Set(state.slots.map(s => s.occurrenceId));
        const tile = state.tiles.find(t => t.glyph.toLowerCase() === slot.needed.toLowerCase() && !used.has(t.occurrenceId));
        const result = placeBridgeTile(selectBridgeTile(state, tile.occurrenceId), run, slot.slotId);
        state = result.state; run = result.run;
      }
      assert.equal(state.phase, "built");
    }
    const receipt = bridgeReceipt(run);
    assert.equal(receipt.words, 10);
    assert.equal(receipt.score, run.firstResponses.length * 35);
    assert.equal(receipt.evidence.assistedRetries.length, 0);
    assert.ok(Object.isFrozen(receipt.evidence.firstResponses));
    assert.throws(() => { receipt.score = 0; });
  }
});

test("resume counts completed stages without inventing earlier response records", () => {
  const run = createBridgeRun(9);
  assert.equal(run.completed, 9);
  assert.equal(run.firstResponses.length, 0);
  assert.equal(run.score, 0);
});
