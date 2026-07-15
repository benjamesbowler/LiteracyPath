import test from "node:test";
import assert from "node:assert/strict";
import {
  QUEST_ROUTE_TOPOLOGIES,
  buildQuestRoute,
  clampRoutePosition,
  routeDirectionAt,
  routeMovementVector,
  routePointAt,
  routeProgressAt,
  routeSidePoint
} from "../../src/utils/questRouteGraph.js";

test("route-relative controls keep screen left and right correctly oriented", () => {
  const north = { x: 0, z: -1 };
  assert.deepEqual(routeMovementVector(north, { lateral: -1 }), { x: -1, z: 0 });
  assert.deepEqual(routeMovementVector(north, { lateral: 1 }), { x: 1, z: 0 });
  assert.deepEqual(routeMovementVector(north, { forward: 1 }), { x: 0, z: -1 });

  const east = { x: 1, z: 0 };
  assert.deepEqual(routeMovementVector(east, { lateral: -1 }), { x: 0, z: -1 });
  assert.deepEqual(routeMovementVector(east, { lateral: 1 }), { x: 0, z: 1 });
});

test("every route topology builds a traversable high-resolution graph", () => {
  for (const [index, topology] of QUEST_ROUTE_TOPOLOGIES.entries()) {
    const route = buildQuestRoute({ topology, seed: index + 1 });
    assert.equal(route.topology, topology);
    assert.ok(route.totalLength > 90, `${topology} is too short`);
    assert.ok(route.samples.length > 100, `${topology} is under-sampled`);
    assert.ok(route.bounds.maxX > route.bounds.minX);
    assert.ok(route.bounds.maxZ > route.bounds.minZ);
    const start = routePointAt(route, 0);
    const end = routePointAt(route, 1);
    assert.ok(Math.hypot(end.x - start.x, end.z - start.z) > 20, `${topology} ends beside its entrance`);
  }
});

test("route points, directions and side offsets share one distance model", () => {
  const route = buildQuestRoute({ topology: "switchback", seed: 7 });
  for (const progress of [0.08, 0.25, 0.5, 0.77, 0.94]) {
    const centre = routePointAt(route, progress);
    const direction = routeDirectionAt(route, progress);
    const side = routeSidePoint(route, progress, 1, 2);
    assert.ok(Math.abs(routeProgressAt(route, centre) - progress) < 0.015);
    assert.ok(Math.abs(Math.hypot(direction.x, direction.y, direction.z) - 1) < 0.02);
    assert.ok(Math.hypot(side.x - centre.x, side.z - centre.z) > route.width + 1.8);
  }
});

test("route clamping follows bends, elevation and closed progress gates", () => {
  const route = buildQuestRoute({ topology: "ridge-climb", seed: 3 });
  const wanted = routePointAt(route, 0.82, 99);
  const blocked = clampRoutePosition(wanted, route, 0.4);
  assert.ok(blocked.routeProgress <= 0.400001);
  assert.ok(Math.abs(routeProgressAt(route, blocked) - 0.4) < 0.025);
  assert.ok(blocked.y > 0, "ridge route lost elevation");

  const open = clampRoutePosition(wanted, route, 1);
  assert.ok(open.routeProgress > 0.75);
  const centre = routePointAt(route, open.routeProgress);
  assert.ok(Math.hypot(open.x - centre.x, open.z - centre.z) <= route.width + 0.01);
});

test("branching route graphs expose optional walkable edges", () => {
  const route = buildQuestRoute({ topology: "hub-and-spokes", seed: 2 });
  assert.ok(route.branches.length >= 3);
  route.branches.forEach(branch => {
    assert.ok(branch.samples.length > 2);
    assert.ok(branch.totalLength > 5);
    assert.ok(branch.startProgress >= 0 && branch.startProgress <= 1);
  });
});

test("route samples turn continuously without polyline corner snaps", () => {
  for (const [index, topology] of QUEST_ROUTE_TOPOLOGIES.entries()) {
    const route = buildQuestRoute({ topology, seed: index + 1 });
    let largestTurn = 0;
    for (let sampleIndex = 1; sampleIndex < route.samples.length; sampleIndex += 1) {
      const before = route.samples[sampleIndex - 1];
      const after = route.samples[sampleIndex];
      const dot = Math.max(-1, Math.min(1,
        before.tangentX * after.tangentX
        + before.tangentY * after.tangentY
        + before.tangentZ * after.tangentZ
      ));
      largestTurn = Math.max(largestTurn, Math.acos(dot));
      assert.ok(after.progress > before.progress, `${topology} route progress went backwards`);
    }
    assert.ok(largestTurn < 0.5, `${topology} still contains a hard ${largestTurn.toFixed(3)} radian corner`);
  }
});
