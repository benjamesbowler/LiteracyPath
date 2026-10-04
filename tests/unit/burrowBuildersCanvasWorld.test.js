import test from 'node:test';
import assert from 'node:assert/strict';
import { createBurrowProjection } from '../../src/components/learn/games/games/burrowBuildersCanvasWorld.js';
import { buildBurrowMissions, terrainAt } from '../../src/utils/burrowBuildersRules.js';

test('fixed Hard projection keeps its reading landmarks truthful on phone, tablet and desktop', () => {
  for (const [width, height] of [[320,568],[568,320],[768,1024],[1280,900]]) {
    const p = createBurrowProjection(width,height,0,true), point = (x,z) => p.project(x-5,Math.max(0,terrainAt(x,z)?.height||0),z-5);
    const pond = point(5,7), garden = point(3,7), gate = point(7,7), cottage = point(1,2), behind = point(1,1), a = point(8,3), between = point(8,4), b = point(8,5);
    assert.ok(garden.x < pond.x && gate.x > pond.x, 'Left and right are visually on the named side of the pond');
    assert.ok(behind.y < cottage.y, 'Behind the cottage projects toward the rear of the visible island');
    // The northern tree stands on raised terrain, so compare the intended
    // ground footprints at their shared base rather than their canopy tops.
    const first = p.project(3,0,-2), middle = p.project(3,0,-1), last = p.project(3,0,0);
    assert.ok(middle.x < first.x && middle.x > last.x);
    assert.ok(middle.y > first.y && middle.y < last.y);
    assert.ok([a,between,b].every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));
    const missions=buildBurrowMissions('hard',23,0);
    assert.ok(missions.every(m=>m.choices.some(c=>c.x===m.correct.x&&c.z===m.correct.z)));
  }
});

test('every selectable finite island cell has a finite projection in all four build cameras', () => {
  for(const camera of [0,1,2,3]) for(const [width,height] of [[320,568],[568,320],[1280,900]]) {
    const p=createBurrowProjection(width,height,camera);
    for(let z=0;z<11;z++)for(let x=0;x<11;x++){const tile=terrainAt(x,z);if(!tile)continue;const q=p.project(x-5,tile.height,z-5);assert.ok(Number.isFinite(q.x)&&Number.isFinite(q.y));}
    assert.ok(p.scale>0);
  }
});
