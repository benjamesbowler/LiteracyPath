import test from 'node:test';
import assert from 'node:assert/strict';
import { createArcadeRenderGate, arcadeDampingFactor, arcadeHeldAxes } from '../../src/components/learn/games/shared/arcadeFramePolicy.js';
import { burrowStructureChanged } from '../../src/components/learn/games/games/burrowPresentation.js';

test('paused rendering retains a frame, admits resize/art changes and resumes', () => {
  const gate = createArcadeRenderGate();
  assert.equal(gate.shouldRender(false, 'pending'), true);
  assert.equal(gate.shouldRender(true, 'pending'), true);
  for (let frame = 0; frame < 120; frame++) assert.equal(gate.shouldRender(true, 'pending'), false);
  assert.equal(gate.shouldRender(true, 'delivered'), true);
  assert.equal(gate.shouldRender(true, 'delivered'), false);
  gate.invalidate();
  assert.equal(gate.shouldRender(true, 'delivered'), true);
  assert.equal(gate.shouldRender(true, 'delivered'), false);
  assert.equal(gate.shouldRender(false, 'delivered'), true);
  assert.equal(gate.shouldRender(false, 'delivered'), true);
});

test('equivalent held sources cannot increase speed or cancel a still-held direction', () => {
  const sources = new Set(['key-arrowright:right', 'key-d:right', 'pointer-1:right']);
  assert.deepEqual(arcadeHeldAxes(sources), { x: 1, y: 0 });
  sources.delete('key-d:right');
  assert.deepEqual(arcadeHeldAxes(sources), { x: 1, y: 0 });
  sources.add('key-a:left');
  assert.deepEqual(arcadeHeldAxes(sources), { x: 0, y: 0 });
  sources.add('key-w:up'); sources.add('key-arrowup:up');
  assert.deepEqual(arcadeHeldAxes(sources), { x: 0, y: -1 });
  sources.clear();
  assert.deepEqual(arcadeHeldAxes(sources), { x: 0, y: 0 });
});

test('camera settling retains the 60 Hz feel at 30, 60 and 120 Hz', () => {
  for (const factor of [.08, .085, .12]) {
    assert.ok(Math.abs(arcadeDampingFactor(1 / 60, factor) - factor) < 1e-12);
    const positions = [30, 60, 120].map(hz => {
      let value = 0;
      for (let frame = 0; frame < hz; frame++) value += (10 - value) * arcadeDampingFactor(1 / hz, factor);
      return value;
    });
    assert.ok(Math.max(...positions) - Math.min(...positions) < 1e-12);
    assert.equal(arcadeDampingFactor(0, factor), 0);
  }
});

test('construction edits invalidate geometry; garden growth and motion retain it', () => {
  const blocks = [{ type: 'garden', x: 3, z: 5, y: 0, rotation: 0, growth: .1 }];
  assert.equal(burrowStructureChanged(blocks, blocks), false);
  assert.equal(burrowStructureChanged(blocks, [{ ...blocks[0], growth: .8 }]), false);
  for (const [key, value] of [['rotation', 1], ['x', 4], ['y', 1], ['z', 4], ['type', 'roof']]) {
    assert.equal(burrowStructureChanged(blocks, [{ ...blocks[0], [key]: value }]), true);
  }
  assert.equal(burrowStructureChanged(blocks, []), true);
  assert.equal(burrowStructureChanged(blocks, [...blocks, { ...blocks[0], y: 1 }]), true);
});
