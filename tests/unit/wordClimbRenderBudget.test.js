import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordClimbRenderBudget } from '../../src/components/learn/games/games/wordClimbRenderBudget.js';

test('Climb degrades through the current sustained shared policy and eventually requests its complete Canvas world', () => {
  const budget = createWordClimbRenderBudget('high'), changes = []; let at = 0;
  for (let frame = 0; frame < 800 && !changes.includes('canvas'); frame++) {
    at += 60; const change = budget.observe(at, true); if (change) changes.push(change);
  }
  assert.deepEqual(changes, ['medium', 'low', 'canvas']);
  const snapshot = budget.inspect(); assert.equal(snapshot.policy, '2d');
  assert(snapshot.reports.every(row => row.type === 'quality-change' && row.averageFrameMs === 60));
  assert.deepEqual(snapshot.reports.map(row => [row.fromTier, row.toTier]), [
    ['rich', 'balanced'], ['balanced', 'low'], ['low', '2d']
  ]);
  snapshot.reports[0].toTier = 'forged'; assert.notEqual(budget.inspect().reports[0].toTier, 'forged');
});

test('one slow frame, a long paused/loading gap and stable native pacing cannot discard Climb art', () => {
  const budget = createWordClimbRenderBudget('high'); let at = 0;
  budget.observe(at, true);
  for (let index = 0; index < 50; index++) { at += 16; assert.equal(budget.observe(at, true), null); }
  at += 100; assert.equal(budget.observe(at, true), null);
  budget.observe(at, false); at += 10000; assert.equal(budget.observe(at, true), null);
  for (let index = 0; index < 500; index++) { at += 16; assert.equal(budget.observe(at, true), null); }
  assert.equal(budget.inspect().tier, 'high');
  assert.equal(budget.pixelRatio(3), 1.5);
});

test('the lowest hardware hint still needs actual sustained rendered evidence before Canvas', () => {
  const budget = createWordClimbRenderBudget('low');
  assert.equal(budget.pixelRatio(2), 1); assert.equal(budget.inspect().tier, 'low');
  assert.equal(budget.observe(0, true), null);
  let change = null;
  for (let index = 1; index <= 300 && !change; index++) change = budget.observe(index * 60, true);
  assert.equal(change, 'canvas');
  assert.equal(budget.inspect().reports.at(-1).fromTier, 'low');
  assert.equal(budget.inspect().reports.at(-1).toTier, '2d');
});
