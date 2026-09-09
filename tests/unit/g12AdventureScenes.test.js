import assert from "node:assert/strict";
import test from "node:test";

import {
  RIVER_ROUTE_ANCHORS,
  WORD_CONVEYOR_ANCHORS,
  riverFriendPosition,
  conveyorBinPosition
} from "../../src/components/learn/games/games/adventureSceneGeometry.js";

test("River Rescue reaches the doorway on the same scene coordinate system", () => {
  assert.equal(riverFriendPosition(0), RIVER_ROUTE_ANCHORS.friendStartX);
  assert.equal(riverFriendPosition(1), RIVER_ROUTE_ANCHORS.homeX);
  assert.ok(RIVER_ROUTE_ANCHORS.homeX > RIVER_ROUTE_ANCHORS.bridgeEndX);
  assert.equal(RIVER_ROUTE_ANCHORS.friendWidth, RIVER_ROUTE_ANCHORS.door.width);
});

test("Word Conveyor keeps both bin endpoints in one scene coordinate system", () => {
  assert.equal(conveyorBinPosition("bin-a"), WORD_CONVEYOR_ANCHORS.binA);
  assert.equal(conveyorBinPosition("bin-b"), WORD_CONVEYOR_ANCHORS.binB);
  assert.ok(WORD_CONVEYOR_ANCHORS.itemStart < WORD_CONVEYOR_ANCHORS.binA);
  assert.ok(WORD_CONVEYOR_ANCHORS.binA < WORD_CONVEYOR_ANCHORS.binB);
});
