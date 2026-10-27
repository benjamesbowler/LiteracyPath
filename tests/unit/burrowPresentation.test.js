import test from 'node:test';
import assert from 'node:assert/strict';
import { burrowPlacementPreview } from '../../src/components/learn/games/games/burrowPresentation.js';
import { createBurrowWorld, placeBurrowPart, walkingHeight } from '../../src/utils/burrowBuildersRules.js';

test('preview follows real water crossing rules without spending materials or editing the world', () => {
  const world = { ...createBurrowWorld(), selectedPart: 'bridge', selection: { x: 5, z: 5 }, rotation: 1 };
  const before = structuredClone(world);
  assert.equal(walkingHeight(world, 5, 5), null);
  const preview = burrowPlacementPreview(world), actual = placeBurrowPart(world);
  assert.equal(preview.valid, true); assert.equal(preview.y, actual.block.y); assert.equal(preview.rotation, actual.block.rotation);
  assert.deepEqual(world, before);
  assert.equal(burrowPlacementPreview({ ...world, selectedPart: 'roof' }).valid, false);
});

test('preview stacking height, exhausted materials and gate-turn action agree with placement', () => {
  let world = { ...createBurrowWorld(), selectedPart: 'wood', selection: { x: 3, z: 8 } };
  world = placeBurrowPart(world).world;
  assert.equal(burrowPlacementPreview(world).y, placeBurrowPart(world).block.y);
  const depleted = { ...world, materials: { ...world.materials, wood: 0 } };
  assert.equal(burrowPlacementPreview(depleted).valid, false);
  assert.equal(burrowPlacementPreview(depleted, { free: true }).valid, true);
  world = placeBurrowPart({ ...createBurrowWorld(), selectedPart: 'gate', selection: { x: 3, z: 8 } }).world;
  const preview = burrowPlacementPreview(world);
  assert.equal(preview.kind, 'gate'); assert.equal(preview.rotation, 1); assert.equal(preview.label, 'Open gate');
});

test('reading-plan preview stays neutral and never exposes answer correctness', () => {
  const world = { ...createBurrowWorld(), selectedPart: 'garden', selection: { x: 5, z: 5 } };
  assert.equal(burrowPlacementPreview(world).valid, false);
  const preview = burrowPlacementPreview(world, { reading: true });
  assert.equal(preview.valid, null); assert.equal(preview.kind, 'plan'); assert.equal(preview.reason, undefined);
});
