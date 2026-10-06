import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseWordBridgePhysicalPiece, relayoutWordBridgeReleasedPiece } from '../../src/components/learn/games/games/wordBridgePieceOwnership.js';

const bank = () => [
  { physicalId: 0, glyph: 't', correct: true, order: 0, placed: true, lost: false, x: 100, y: 220, bob: 2 },
  { physicalId: 1, glyph: 'e', correct: true, order: 1, placed: true, lost: false, x: 380, y: 220, bob: 1 },
  { physicalId: 2, glyph: 't', correct: true, order: 3, placed: false, lost: false, x: 700, y: 220, bob: 3 }
];

test('loose drop releases the actual original carried ID once and keeps repeated glyph instances distinct', () => {
  const tiles = bank(), carried = { ...tiles[0], sourceIndex: 0 };
  const released = releaseWordBridgePhysicalPiece(tiles, carried, { x: 250, y: 235 });
  assert.equal(released.tiles.length, tiles.length);
  assert.equal(new Set(released.tiles.map(tile => tile.physicalId)).size, tiles.length);
  assert.equal(released.tile.physicalId, 0);
  assert.equal(released.tile.placed, false);
  assert.deepEqual([released.tile.x, released.tile.y], [250, 235]);
  assert.equal(released.tiles[1], tiles[1], 'a prior placed piece is untouched');
  assert.equal(released.tiles[2], tiles[2], 'the equal second t remains a different loose physical object');
  assert.equal(tiles[0].placed, true, 'a retained original snapshot is not mutated');
});

test('nearby wrong return preserves ID and source properties without depending on a stale array index', () => {
  const tiles = bank(); tiles[2].placed = true;
  const carried = { ...tiles[2], sourceIndex: 0 };
  const returned = releaseWordBridgePhysicalPiece(tiles, carried, { x: 290, y: 232, returnT: .9, localReturn: true });
  assert.equal(returned.index, 2);
  assert.equal(returned.tile.bob, 3);
  assert.equal(returned.tile.localReturn, true);
  assert.equal(returned.tile.returnT, .9);
  assert.equal(returned.tiles.length, 3);
});

test('an absent or duplicated source owner cannot invent another physical piece', () => {
  const tiles = bank();
  assert.equal(releaseWordBridgePhysicalPiece(tiles, { ...tiles[0], physicalId: 9 }, { x: 100, y: 200 }), null);
  assert.equal(releaseWordBridgePhysicalPiece([...tiles, { ...tiles[0] }], tiles[0], { x: 100, y: 200 }), null);
  assert.equal(releaseWordBridgePhysicalPiece(tiles, { ...tiles[0], glyph: 'x' }, { x: 100, y: 200 }), null);
  const released = releaseWordBridgePhysicalPiece(tiles, tiles[0], { x: 180, y: 232 });
  assert.equal(releaseWordBridgePhysicalPiece(released.tiles, tiles[0], { x: 210, y: 232 }), null,
    'An already released piece cannot be released a second time from a stale carry object');
});

test('a real loose release keeps its actual position through first resize and a changed deck, without relaying out untouched repeated pieces', () => {
  const tiles = bank(), released = releaseWordBridgePhysicalPiece(tiles, tiles[0], { x: 172.33333333333272, y: 552.6, localReturn: true });
  const tile = { ...released.tile, w: 64 }, before = structuredClone(tile);
  const same = relayoutWordBridgeReleasedPiece(tile, { previousGround: 581.6, ground: 581.6, previousWidth: 1600, width: 1600 });
  assert.deepEqual(same, tile, 'an initial ResizeObserver callback cannot snap an actual drop back to its bank');
  const resized = relayoutWordBridgeReleasedPiece(tile, { previousGround: 581.6, ground: 430, previousWidth: 1600, width: 2000 });
  assert.ok(Math.abs(resized.x - tile.x * 1.25) < 1e-8);
  assert.ok(Math.abs((resized.y - 430) - (tile.y - 581.6)) < 1e-8, 'the exact physical drop offset survives a changed ground height');
  assert.deepEqual(tile, before); assert.equal(resized.physicalId, tile.physicalId);
  assert.equal(relayoutWordBridgeReleasedPiece({ ...tiles[2], w: 64, localReturn: false }, { previousGround: 220, ground: 300, previousWidth: 1600, width: 1600 }), null,
    'an untouched equal glyph keeps its original bank geometry');
  assert.equal(relayoutWordBridgeReleasedPiece(tile, { previousGround: NaN, ground: 430, previousWidth: 1600, width: 2000 }), null);
});
