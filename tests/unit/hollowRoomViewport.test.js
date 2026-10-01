import test from "node:test";
import assert from "node:assert/strict";
import { hollowRoomViewBox } from "../../src/utils/hollowRoomViewport.js";
import { DEFAULT_HOLLOW_SPOTS } from "../../src/data/hollowSpots.js";

function assertSafeCamera(width, height, spots) {
  const [x, y, w, h] = hollowRoomViewBox(width, height, spots);
  assert.ok(Math.abs(w / h - width / height) < 1e-8, "source art uses uniform scaling");
  for (const spot of spots) {
    const cx = spot.x * 19.2, cy = spot.y * 10.8;
    assert.ok(cx - 80 >= x - 1e-8 && cx + 80 <= x + w + 1e-8, "whole decoration and clearance fit horizontally");
    assert.ok(cy - 80 >= y - 1e-8 && cy + 80 <= y + h + 1e-8, "whole decoration and clearance fit vertically");
  }
  return [x, y, w, h];
}

test("every theme's authored display spots fit on portrait, landscape and wide room cameras", () => {
  for (const spots of Object.values(DEFAULT_HOLLOW_SPOTS)) {
    for (const [w, h] of [[320, 260], [390, 530], [568, 220], [1024, 520], [1920, 830]]) assertSafeCamera(w, h, spots.map(([x, y]) => ({ x, y })));
  }
});

test("a wide desktop room fills its width instead of a small centered picture", () => {
  const [, , width] = assertSafeCamera(1920, 830, DEFAULT_HOLLOW_SPOTS.meadow.map(([x, y]) => ({ x, y })));
  assert.equal(width, 1920);
});

test("custom edge positions protect complete saved tiles without stretching them", () => {
  assertSafeCamera(320, 440, [{ x: 0, y: 0 }, { x: 100, y: 100 }]);
});

test("unmeasured rooms keep the original scene and malformed coordinates are ignored", () => {
  assert.deepEqual(hollowRoomViewBox(0, 500, []), [0, 0, 1920, 1080]);
  assert.deepEqual(hollowRoomViewBox(320, 0, []), [0, 0, 1920, 1080]);
  assert.deepEqual(hollowRoomViewBox(320, 500, [{ x: NaN, y: 40 }]), [0, 0, 1920, 1080]);
});
