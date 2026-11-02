import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_ATLASES } from '../../src/data/adventureMapAtlas.js';
import { adventureMapGuidePlacement } from '../../src/utils/adventureMapGuidePlacement.js';

const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test('a Guide beside every current atlas stop leaves all27 numbered controls clear', () => {
  const before = structuredClone(ADVENTURE_ATLASES);
  for (const width of [760, 1137, 1760]) for (const atlas of Object.values(ADVENTURE_ATLASES)) {
    const height = width * 1536 / 2752;
    for (const [current, point] of atlas.points.entries()) {
      const markers = atlas.points.map(([x, y], index) => {
        const radius = index === current ? 36 : 29;
        return { left: x / 100 * width - radius, right: x / 100 * width + radius, top: y / 100 * height - radius, bottom: y / 100 * height + radius };
      });
      const position = adventureMapGuidePlacement({ anchor: { x: point[0] / 100 * width, y: point[1] / 100 * height }, size: { width: 70, height: 78 }, bounds: { left: 0, top: 0, right: width, bottom: height }, obstacles: markers });
      const guide = { left: position.x, right: position.x + 70, top: position.y, bottom: position.y + 78 };
      assert.equal(position.clear, true);
      assert.ok(markers.every(marker => !intersects(guide, marker)), `${width}/${current} keeps the Guide off every stop`);
    }
  }
  assert.deepEqual(ADVENTURE_ATLASES, before, 'Decoration cannot move source geometry');
});

test('compact current-stop placement avoids the fixed heading and destination label', () => {
  const obstacles = [
    { left: 72, right: 144, top: 178, bottom: 250 },
    { left: 79, right: 137, top: 126, bottom: 184 },
    { left: 12, right: 308, top: 76, bottom: 177 },
    { left: 28, right: 188, top: 256, bottom: 287 }
  ];
  const position = adventureMapGuidePlacement({ anchor: { x: 108, y: 214 }, size: { width: 70, height: 78 }, bounds: { left: 0, right: 320, top: 64, bottom: 309 }, obstacles });
  assert.equal(position.clear, true);
  assert.ok(obstacles.every(obstacle => !intersects({ left: position.x, right: position.x + 70, top: position.y, bottom: position.y + 78 }, obstacle)));
});
