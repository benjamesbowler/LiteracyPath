import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordClimbCanvasBark, drawWordClimbBarkStrips, WORD_CLIMB_BARK_PATH } from '../../src/components/learn/games/games/wordClimbCanvasBark.js';

function fixture({ decode = async () => {} } = {}) {
  const draws = [], changes = [], timers = new Map(), canvases = [];
  const ctx = { drawImage: (...args) => draws.push(args), fillRect() {},
    createLinearGradient: () => ({ addColorStop() {} }) };
  const image = { naturalWidth: 512, naturalHeight: 512, decode,
    removeAttribute() { this.src = ''; } };
  const owner = createWordClimbCanvasBark('meadow', { makeImage: () => image,
    makeCanvas: () => { const canvas = { getContext: () => ctx }; canvases.push(canvas); return canvas; },
    setTimer: callback => { timers.set(1, callback); return 1; }, clearTimer: id => timers.delete(id),
    onDelivery: value => changes.push(value) });
  return { owner, image, draws, changes, timers, canvases };
}

test('Climb Canvas bark uses the retained decoded albedo once and releases its image and single shaded surface', async () => {
  let resolveDecode;
  const item = fixture({ decode: () => new Promise(resolve => { resolveDecode = resolve; }) });
  assert.equal(item.image.src, WORD_CLIMB_BARK_PATH); assert.equal(item.owner.delivery(), 'pending');
  const loading = item.image.onload(); assert.equal(item.owner.surface(), null);
  resolveDecode(); await loading; assert.equal(await item.owner.ready, true);
  assert.equal(item.owner.delivery(), 'delivered'); assert.equal(item.canvases.length, 1);
  assert.equal(item.draws.length, 2); assert(item.draws.every(row => row[0] === item.image));
  assert.deepEqual(item.changes, ['delivered']); assert.equal(item.timers.size, 0);
  const snapshot = item.owner.inspect(); snapshot.delivery = 'forged'; assert.equal(item.owner.delivery(), 'delivered');
  const surface = item.owner.surface(); item.owner.dispose(); item.owner.dispose();
  assert.equal(surface.width, 1); assert.equal(surface.height, 1);
  assert.equal(item.image.src, ''); assert.equal(item.owner.surface(), null); assert.equal(item.owner.delivery(), 'disposed');
});

test('A pending Climb bark decode cannot create or publish a surface after engine disposal', async () => {
  let resolveDecode;
  const item = fixture({ decode: () => new Promise(resolve => { resolveDecode = resolve; }) });
  const loading = item.image.onload(); item.owner.dispose();
  assert.equal(await item.owner.ready, false); resolveDecode(); await loading;
  assert.equal(item.canvases.length, 0); assert.deepEqual(item.changes, []);
  assert.equal(item.owner.delivery(), 'disposed'); assert.equal(item.timers.size, 0);
});

test('An actual failed bark image remains unavailable without preventing the existing geometry recovery', async () => {
  const item = fixture(); item.image.onerror(); assert.equal(await item.owner.ready, false);
  assert.equal(item.owner.delivery(), 'unavailable'); assert.equal(item.owner.surface(), null);
  assert.equal(item.canvases.length, 0); assert.deepEqual(item.changes, ['unavailable']); item.owner.dispose();
});

test('Textured Climb strips retain the real route silhouette and world registration while the camera moves', () => {
  const surface = { width: 512, height: 512 }, points = [{ x: 490, y: 90, radius: 100 }, { x: 515, y: 120, radius: 120 }];
  const original = structuredClone(points), collect = camera => {
    const calls = [], polygon = [], transforms = [];
    const ctx = { save() {}, restore() {}, beginPath() {}, closePath() {}, clip() {},
      moveTo: (...args) => polygon.push(args), lineTo: (...args) => polygon.push(args),
      transform: (...args) => transforms.push(args),
      drawImage: (...args) => calls.push(args) };
    const count = drawWordClimbBarkStrips(ctx, surface, points, (x, y) => ({ x: x * 1.3, y: camera - y * 1.4 }));
    assert.equal(count, calls.length); assert(count >= 2 && count <= 8);
    return { calls, polygon, transforms };
  };
  const first = collect(800), next = collect(950);
  assert.deepEqual(points, original);
  assert.deepEqual(first.polygon.slice(0, 4).map(([x]) => x), [507, 513.5, 825.5, 767], 'One whole-trunk mask retains both actual route edges');
  const firstTriangle = first.polygon.slice(4, 7);
  assert(Math.abs(firstTriangle[0][1] - (632 - .8)) < 1e-9);
  assert(Math.abs(firstTriangle[1][1] - (632 - .8)) < 1e-9,
    'Wide thin triangles have a real 0.8px perpendicular overlap on both horizontal-edge vertices');
  assert.equal(first.calls.length, next.calls.length);
  assert.deepEqual(first.calls, next.calls, 'Camera motion retains identical ordinary and boundary-repeat tile draws');
  assert.equal(first.calls.filter(call => call[2] === -512).length, 2);
  assert.equal(first.calls.filter(call => call[2] === 512).length, 2);
  assert(first.calls.every(call => call[0] === surface && call[1] === 0 && [-512, 0, 512].includes(call[2])),
    'UV wrap overlaps reuse the exact retained tile under the same transform, without another bank');
  for (let index = 0; index < first.transforms.length; index++) {
    assert.deepEqual(first.transforms[index].slice(0, 5), next.transforms[index].slice(0, 5), 'Camera movement never shifts the UV source or curved horizontal geometry');
    assert(Math.abs(next.transforms[index][5] - first.transforms[index][5] - 150) < 1e-9);
  }
  const uv = ((-120 / 110 * 512) % 512 + 512) % 512;
  const mapped = (matrix, x, y) => ({ x: matrix[0] * x + matrix[2] * y + matrix[4], y: matrix[1] * x + matrix[3] * y + matrix[5] });
  for (const matrix of first.transforms.slice(0, 2)) {
    const topLeft = mapped(matrix, 0, uv);
    assert(Math.abs(topLeft.x - 513.5) < 1e-9); assert(Math.abs(topLeft.y - 632) < 1e-9);
  }
  const shared = mapped(first.transforms[0], 512, 512), sharedOther = mapped(first.transforms[1], 512, 512);
  assert(Math.hypot(shared.x - sharedOther.x, shared.y - sharedOther.y) < 1e-9, 'Both triangles map the identical shared UV edge to the identical actual trunk point');
});
