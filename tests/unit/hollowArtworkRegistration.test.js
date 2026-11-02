import assert from 'node:assert/strict';
import test from 'node:test';
import { HOLLOW_ITEMS } from '../../src/utils/hollowEconomy.js';
import { HOLLOW_DECORATION_BOUNDS } from '../../src/data/hollowDecorationBounds.generated.js';
import { hollowRoomViewBox } from '../../src/utils/hollowRoomViewport.js';
import { HOLLOW_ARTWORK_CONTACTS, HOLLOW_LEGACY_DEFAULT_SPOTS, HOLLOW_LEGACY_LIVE_SPOTS,
  registeredHollowSpots, hollowDecorationAnchor, hollowDecorationBox } from '../../src/data/hollowArtworkRegistration.js';

test('both previous placement sources translate locally while preserving each saved slot and input', () => {
  for (const legacy of [HOLLOW_LEGACY_DEFAULT_SPOTS, HOLLOW_LEGACY_LIVE_SPOTS]) {
    const snapshot = JSON.stringify(legacy);
    for (const [room, points] of Object.entries(legacy)) {
      const owned = Object.fromEntries(points.map((_, index) => [`${room}-${index + 1}`, `owned-${index}`]));
      const translated = registeredHollowSpots(room, legacy);
      assert.deepEqual(translated, HOLLOW_ARTWORK_CONTACTS[room]);
      assert.equal(translated.length, Object.keys(owned).length);
      translated[0][0] = -1;
      assert.ok(HOLLOW_ARTWORK_CONTACTS[room][0][0] >= 0);
    }
    assert.equal(JSON.stringify(legacy), snapshot);
  }
  const custom = { dino: [[11, 21], [31, 41], [51, 61], [71, 81], [21, 71], [81, 21]] };
  assert.deepEqual(registeredHollowSpots('dino', custom), custom.dino);
});

test('every owned decoration has the same visible centre and bottom on its shelf at either render size', () => {
  for (const { id } of HOLLOW_ITEMS) {
    const body = HOLLOW_DECORATION_BOUNDS[id];
    assert.ok(body && body.bounds[3] > body.bounds[1]);
    const point = { x: 37.25, y: 63.5 }, anchor = hollowDecorationAnchor(id);
    for (const size of [72, 128]) {
      const box = hollowDecorationBox(id, point, size);
      assert.ok(Math.abs(box.x + anchor.centreX * size - point.x * 19.2) < 1e-9);
      assert.ok(Math.abs(box.y + anchor.bottom * size - point.y * 10.8) < 1e-9);
      const cssOffset = (1 - anchor.bottom) * size;
      assert.ok(Math.abs(-size + cssOffset + body.bounds[3] / body.height * size) < 1e-9);
    }
  }
});

test('the Home camera contains the complete bottom-anchored visible bodies after rotation', () => {
  for (const coordinates of Object.values(HOLLOW_ARTWORK_CONTACTS)) {
    const points = coordinates.map(([x, y]) => ({ x, y }));
    for (const [width, height] of [[390, 530], [568, 220], [1440, 830]]) {
      const [x, y, w, h] = hollowRoomViewBox(width, height, points);
      for (const point of points) for (const { id } of HOLLOW_ITEMS) {
        const body = HOLLOW_DECORATION_BOUNDS[id], box = hollowDecorationBox(id, point);
        const left = box.x + box.width * body.bounds[0] / body.width;
        const right = box.x + box.width * body.bounds[2] / body.width;
        const top = box.y + box.height * body.bounds[1] / body.height;
        const bottom = box.y + box.height * body.bounds[3] / body.height;
        assert.ok(left >= x - 1e-8 && right <= x + w + 1e-8);
        assert.ok(top >= y - 1e-8 && bottom <= y + h + 1e-8);
      }
    }
  }
});
