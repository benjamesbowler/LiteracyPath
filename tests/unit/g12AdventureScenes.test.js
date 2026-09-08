import assert from "node:assert/strict";
import test from "node:test";

import {
  RESCUE_ANCHORS,
  SORT_ANCHORS,
  rescueFriendX,
  sortTargetX
} from "../../src/components/learn/games/games/G12AdventureGeometry.js";

test("G12 Rescue normalizes the friend against the bridge anchors", () => {
  assert.equal(rescueFriendX(0), RESCUE_ANCHORS.bridgeStart);
  assert.equal(rescueFriendX(0.5), 49);
  assert.equal(rescueFriendX(1), RESCUE_ANCHORS.bridgeEnd);
  assert.ok(RESCUE_ANCHORS.homeX > RESCUE_ANCHORS.bridgeEnd);
});

test("G12 Sort keeps both bin endpoints in one scene coordinate system", () => {
  assert.equal(sortTargetX("bin-a"), SORT_ANCHORS.binA);
  assert.equal(sortTargetX("bin-b"), SORT_ANCHORS.binB);
  assert.ok(SORT_ANCHORS.itemStart < SORT_ANCHORS.binA);
  assert.ok(SORT_ANCHORS.binA < SORT_ANCHORS.binB);
});
