import test from "node:test";
import assert from "node:assert/strict";
import { sampleRacerRoute, RACER_LANE_OFFSETS } from "../../src/utils/soundRacerRoute.js";
test("road, lane, vehicle and camera anchors share continuous finite analytic geometry", () => {
  for (let s = 0; s <= 260; s += 0.5) {
    const centre = sampleRacerRoute(s);
    const { tangent, right } = centre;
    assert.ok(Math.abs(Math.hypot(tangent.x, tangent.z) - 1) < 1e-12);
    assert.ok(Math.abs(tangent.x * right.x + tangent.z * right.z) < 1e-12);
    // Native +Z vehicle rotated PI+heading follows the analytic tangent.
    assert.ok(Math.abs(Math.sin(Math.PI + centre.heading) - tangent.x) < 1e-12);
    assert.ok(Math.abs(Math.cos(Math.PI + centre.heading) - tangent.z) < 1e-12);
    for (const lane of RACER_LANE_OFFSETS) {
      const position = sampleRacerRoute(s, lane).position;
      assert.ok(Math.abs(Math.hypot(position.x - centre.position.x, position.z - centre.position.z) - Math.abs(lane)) < 1e-10);
      assert.ok(Math.abs(lane) < centre.width / 2);
    }
    const next = sampleRacerRoute(s + 0.0001).position;
    assert.ok(Math.hypot(next.x - centre.position.x, next.z - centre.position.z) < 0.0002);
  }
  assert.deepEqual(sampleRacerRoute(-10).position, { x: 0, y: 0, z: 10 });
  assert.deepEqual(sampleRacerRoute(-8.8, 3).position, { x: 3, y: 0, z: 8.8 });
  assert.equal(Math.abs(sampleRacerRoute(-18).heading), 0);
  assert.deepEqual(sampleRacerRoute(NaN, Infinity), sampleRacerRoute(0));
});
