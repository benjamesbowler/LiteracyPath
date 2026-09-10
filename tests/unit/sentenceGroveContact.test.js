import assert from 'node:assert/strict';
import test from 'node:test';
import { GROVE_CUT_REACH, groveVehicleYaw, nearestCuttableTree } from '../../src/components/learn/games/games/sentenceGroveContact.js';

const tree = (x, z, extra = {}) => ({ label: 'cat', position: { x, z }, ...extra });

test('nearby guidance has exactly the actionable cut radius', () => {
  const player = { x: 0, z: 0 };
  assert.equal(nearestCuttableTree(player, [tree(4.8, 0)]), null);
  assert.equal(nearestCuttableTree(player, [tree(GROVE_CUT_REACH, 0)]), null);
  const reachable = tree(GROVE_CUT_REACH - 0.001, 0);
  assert.equal(nearestCuttableTree(player, [reachable]), reachable);
});

test('a cooling down wrong tree cannot hide another reachable target', () => {
  const reachable = tree(3, 0);
  assert.equal(nearestCuttableTree({ x: 0, z: 0 }, [tree(1, 0, { cooldown: 0.5 }), tree(2, 0, { smashed: true }), reachable]), reachable);
  assert.equal(nearestCuttableTree({ x: 0, z: 0 }, [tree(1, 0), reachable]).position.x, 1);
});

test('authored vehicle nose follows the motion heading in every direction', () => {
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 5.4]) {
    const yaw = groveVehicleYaw(heading);
    assert.ok(Math.abs(-Math.sin(yaw) - Math.sin(heading)) < 1e-10);
    assert.ok(Math.abs(-Math.cos(yaw) - Math.cos(heading)) < 1e-10);
  }
});
