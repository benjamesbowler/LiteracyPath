import test from 'node:test';
import assert from 'node:assert/strict';
import { sentenceGroveChoicePositions } from '../../src/components/learn/games/games/sentenceGroveLayout.js';

test('all Sentence Grove choices are nearby, distinct and inside the grove across routes and edges', () => {
  for (const x of [-116, -90, 0, 90, 116]) for (const z of [-86, -60, 0, 60, 86]) for (const yaw of [0, 1.5, Math.PI]) for (let serial=0;serial<12;serial++) {
    const positions=sentenceGroveChoicePositions(3,{x,z,yaw},serial);
    assert.equal(positions.length,3);
    for (const [index,point] of positions.entries()) {
      const distance=Math.hypot(point[0]-x,point[1]-z);
      assert.ok(distance>=12 && distance<=30, `reachable distance ${distance}`);
      assert.ok(point[0]>=-110 && point[0]<=110 && point[1]>=-80 && point[1]<=80);
      for(const other of positions.slice(index+1)) assert.ok(Math.hypot(point[0]-other[0],point[1]-other[1])>8);
    }
  }
});

test('choice placement depends only on route state, never correctness or labels', () => {
  const player={x:0,z:50,yaw:Math.PI};
  assert.deepEqual(sentenceGroveChoicePositions(3,player,2),sentenceGroveChoicePositions(3,player,2));
  assert.notDeepEqual(sentenceGroveChoicePositions(3,player,2),sentenceGroveChoicePositions(3,player,3));
});
