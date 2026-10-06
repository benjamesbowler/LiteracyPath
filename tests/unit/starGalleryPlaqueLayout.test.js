import test from 'node:test';
import assert from 'node:assert/strict';
import { grovePlaqueProjectionVisible, layoutGrovePlaques } from '../../src/components/learn/games/games/starGalleryPlaqueLayout.js';

test('all three actual plaque anchors retain equal16px glyphs, source aspect and readable viewport extents', () => {
  for (const [width, height, promptBottom] of [[320, 780, 174], [568, 320, 124], [1280, 800, 88]]) {
    const source = [0, 1, 2].map(id => ({ id, x: 24 + id * (width - 48) / 2, y: promptBottom + 36,
      pixelsPerUnit: 3, worldHeight: 1.7, aspect: [1.2, 2.5, 1.8][id], glyphFraction: .5 }));
    const before = structuredClone(source), plaques = layoutGrovePlaques(source, { width, height, promptBottom });
    assert.equal(plaques.length, 3); assert.deepEqual(source, before);
    for (const plaque of plaques) {
      assert(plaque.glyphPixels >= 16); assert(Math.abs(plaque.worldWidth / plaque.worldHeight - source[plaque.id].aspect) < 1e-12);
      assert.deepEqual(plaque.anchor, { x: source[plaque.id].x, y: source[plaque.id].y });
      assert(plaque.bounds.x >= 6 && plaque.bounds.right <= width - 6); assert(plaque.bounds.y >= promptBottom + 6);
      assert(plaque.bounds.bottom <= height - 84);
      const centreX = plaque.bounds.x + plaque.center.x * plaque.bounds.width;
      const centreY = plaque.bounds.y + (1 - plaque.center.y) * plaque.bounds.height;
      assert(Math.abs(centreX - plaque.anchor.x) < 1e-12 && Math.abs(centreY - plaque.anchor.y) < 1e-12);
    }
    for (const [i, a] of plaques.entries()) for (const b of plaques.slice(i + 1)) {
      assert(a.bounds.right <= b.bounds.x || b.bounds.right <= a.bounds.x || a.bounds.bottom <= b.bounds.y || b.bounds.bottom <= a.bounds.y);
    }
  }
});

test('nearby readable plaques retain their actual size and a behind-camera plaque has no fabricated projection', () => {
  const plaques = layoutGrovePlaques([{ id: 1, x: 200, y: 250, pixelsPerUnit: 30, worldHeight: 3, aspect: 1, glyphFraction: .5 },
    { id: 2, x: 30, y: 250, pixelsPerUnit: 0, worldHeight: 2, aspect: 1, glyphFraction: .5 }], { width: 568, height: 600, promptBottom: 130 });
  assert.equal(plaques.length, 1); assert.equal(plaques[0].worldHeight, 3); assert.equal(plaques[0].glyphPixels, 45);
});

test('the actual short Canvas driver rectangle stays clear of equally styled anchored word plaques', () => {
  const reserved = [{ x: 270, y: 214, right: 300, bottom: 242 }];
  const items = [180, 284, 384].map((x, id) => ({ id, x, y: [166, 218, 166][id],
    pixelsPerUnit: 1, worldHeight: 34, aspect: [2.9, 3.2, 2.8][id], glyphFraction: 18 / 34 }));
  const plaques = layoutGrovePlaques(items, { width: 568, height: 320, promptBottom: 120, glyphFloor: 18, reserved });
  for (const plaque of plaques) {
    assert(plaque.clear); assert(plaque.glyphPixels >= 18); assert.equal(plaque.anchor.x, items[plaque.id].x);
    for (const box of reserved) assert(plaque.bounds.right <= box.x || box.right <= plaque.bounds.x
      || plaque.bounds.bottom <= box.y || box.bottom <= plaque.bounds.y);
  }
});

test('the observed near-camera gr paper stays bounded and readable without changing its tree anchor or source aspect', () => {
  const observed = { id: 'gr', x: 8870.602658039401, y: 12847.011069121698,
    pixelsPerUnit: 3434.9758306173026 / 1.7, worldHeight: 1.7,
    aspect: 3104.001596938032 / 3434.9758306173026,
    glyphFraction: 1580.2255067940189 / 3434.9758306173026 };
  const original = structuredClone(observed);
  for (const [width, height, promptBottom] of [[1280, 800, 88], [320, 780, 174], [568, 320, 120]]) {
    const [paper] = layoutGrovePlaques([observed], { width, height, promptBottom,
      reserved: [{ x: width / 2 - 40, y: height / 2, right: width / 2 + 40, bottom: height / 2 + 80 }] });
    assert(paper.clear);
    assert(paper.bounds.height <= 110 && paper.bounds.width < 110);
    assert(paper.glyphPixels >= 16);
    assert(paper.bounds.x >= 6 && paper.bounds.right <= width - 6);
    assert(paper.bounds.y >= promptBottom + 6 && paper.bounds.bottom <= height - 84);
    assert.deepEqual(paper.anchor, { x: observed.x, y: observed.y });
    assert(Math.abs(paper.worldWidth / paper.worldHeight - observed.aspect) < 1e-12);
  }
  assert.deepEqual(observed, original);
});

test('a near-plane or behind-camera tree cannot keep a previous projected reading paper visible', () => {
  assert.equal(grovePlaqueProjectionVisible(.09, .1, -1.1), false);
  assert.equal(grovePlaqueProjectionVisible(-4, .1, 1.05), false);
  assert.equal(grovePlaqueProjectionVisible(4, .1, .95), true);
  assert.equal(grovePlaqueProjectionVisible(300, .1, 1.01), false);
  assert.equal(grovePlaqueProjectionVisible(NaN, .1, .95), false);
});

test('the close-view gr paper cannot cover actual driving controls or the displayed result banner', () => {
  const reserved = [{ x: 1094, y: 601, right: 1168, bottom: 758 },
    { x: 1177, y: 680, right: 1263, bottom: 758 }, { x: 460, y: 610, right: 820, bottom: 668 }];
  const [paper] = layoutGrovePlaques([{ id: 'gr', x: 8870.602658039401, y: 12847.011069121698,
    pixelsPerUnit: 2000, worldHeight: 1.7, aspect: .904, glyphFraction: .46 }],
  { width: 1280, height: 800, promptBottom: 88, reserved });
  assert(paper.clear); assert(paper.glyphPixels >= 16);
  for (const rect of reserved) assert(paper.bounds.right <= rect.x || rect.right <= paper.bounds.x
    || paper.bounds.bottom <= rect.y || rect.bottom <= paper.bounds.y);
  assert.deepEqual(paper.anchor, { x: 8870.602658039401, y: 12847.011069121698 });
});
