import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reelReadRodTransform, reelReadHookImpact, reelReadStageLayout, stepReelReadFish, reelReadOperatorFrame, reelReadActorPlacement } from '../../src/utils/reelReadMotion.js';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';
const registration = JSON.parse(readFileSync(new URL('../../source-art/arcade/physical-worlds/reel-read/fishing-registration-v1.json', import.meta.url)));

test('actual visible source grips register one physical rod/reel/tip matrix in every seated action', () => {
  for (const [index, character] of ['bouncy', 'chompy', 'pip'].entries()) {
    const world = ['meadow', 'dino', 'moonwood'][index], parts = registration.kits[world];
    for (const sockets of Object.values(registration.actors[character].sockets)) {
      const placed = Object.fromEntries(Object.entries(sockets).map(([name, p]) => [name, { x: p[0] * .47 + 31, y: p[1] * .47 + 14 }]));
      const pose = reelReadRodTransform(parts, placed);
      const transform = p => ({ x: pose.matrix.a * p[0] + pose.matrix.c * p[1] + pose.matrix.e,
        y: pose.matrix.b * p[0] + pose.matrix.d * p[1] + pose.matrix.f });
      assert.ok(Math.hypot(transform(parts.rodGrip).x - placed.rodGrip.x, transform(parts.rodGrip).y - placed.rodGrip.y) < 1e-9);
      assert.deepEqual(pose.origin, placed.rodGrip);
      assert.ok(Math.hypot(transform(parts.rodTip).x - pose.tip.x, transform(parts.rodTip).y - pose.tip.y) < 1e-9);
      assert.equal(pose.pairedContact, Boolean(placed.reelGrip));
      if (placed.reelGrip) assert.ok(pose.reelSeparation < 1e-9);
      else assert.equal(pose.reelSeparation, null);
    }
  }
  assert.equal(reelReadRodTransform(registration.kits.meadow, {}), null);
});

test('a nearer wrong fish physically blocks the swept hook before a farther correct part', () => {
  const wrong = { id: 7, word: 'food', x: 40, y: 70, rx: 24, ry: 12 };
  const correct = { id: 2, word: 'foot', x: 40, y: 125, rx: 28, ry: 14 };
  for (const school of [[wrong, correct], [correct, wrong]]) {
    const hit = reelReadHookImpact({ x: 40, y: 20 }, { x: 40, y: 180 }, school, 3);
    assert.equal(hit.fish.id, wrong.id);
    assert.ok(hit.u < .25);
  }
  assert.equal(reelReadHookImpact({ x: 100, y: 20 }, { x: 100, y: 180 }, [wrong, correct], 3), null);
  assert.equal(reelReadHookImpact({ x: 40, y: 70 }, { x: 40, y: 70 }, [wrong]).u, 0);
});

test('every unchanged school identity circulates into the visible pool with readable faces above the thumb controls', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) for (const [width, height] of [[320,340],[320,568],[568,260],[568,320],[1366,768]]) {
    const layout = reelReadStageLayout(width,height);
    assert.equal(layout.fishFontSize,16);
    for (const level of reelReadV2Ladder(difficulty,913)) for (let slot=0; slot<level.visibleFish; slot++) {
      const fish={id:slot+1,word:level.correctWords[0],slot,phase:slot*71,direction:slot%2?-1:1};
      const original=structuredClone(fish);let exposed=false;
      for(let elapsed=0; elapsed<90; elapsed+=.25){
        const position=stepReelReadFish(fish,layout,level,elapsed);
        assert.ok(Number.isFinite(position.x)&&Number.isFinite(position.y));
        assert.ok(position.y+position.ry < layout.controlsTop-8);
        if(layout.compact)assert.ok(position.labelY-24>=layout.cue.y+layout.cue.height+6,
          'even the tallest compact cue retains a gap above the moving word face');
        if(position.x>64&&position.x<width-64) exposed=true;
      }
      assert.ok(exposed,`${difficulty}/${level.level}/${slot} must genuinely swim into view`);
      assert.deepEqual(fish,original);
    }
  }
});

test('whole unchanged school faces cannot overtake, cross another lane or cover the boat bank',()=>{
  for(const difficulty of ['easy','medium','hard'])for(const [width,height] of [[320,340],[320,568],[568,260],[568,320],[1366,768]]) {
    const layout=reelReadStageLayout(width,height);
    for(const level of reelReadV2Ladder(difficulty,913))for(let elapsed=0;elapsed<30;elapsed+=.2) {
      const rows=Array.from({length:level.visibleFish},(_,slot)=>stepReelReadFish({slot,phase:slot*71,direction:slot%2?-1:1},layout,level,elapsed)).filter(row=>row.visible);
      for(const row of rows) {
        assert.ok(row.x-54>=layout.fishChannel.left+8-1e-8&&row.x+54<=layout.fishChannel.right-8+1e-8);
        assert.ok(row.labelY+48<=layout.controlsTop-8+1e-8,'64px word target clears the 56px thumb controls');
        if(!layout.compact||layout.portrait)
          assert.ok(row.labelY-24>=layout.hullTop+layout.hullHeight+8-1e-8,'whole rotated plaque clears the whole hull');
      }
      for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++) {
        const dx=Math.abs(rows[i].x-rows[j].x),dy=Math.abs(rows[i].labelY-rows[j].labelY);
        assert.ok(dx>=116||dy>=56,'independent rotated word faces retain an 8px gap');
      }
    }
  }
});

test('cast, real tension/reel/ease, motor recovery and finale select their authored fishing actions', () => {
  const base={elapsed:20,castAt:-1,errorAt:-1,escapeAt:-1,landedAt:-1,steering:0};
  assert.equal(reelReadOperatorFrame({...base,castAt:19.97}),4);
  assert.equal(reelReadOperatorFrame({...base,castAt:19.92}),5);
  assert.equal(reelReadOperatorFrame({...base,castAt:19.85}),6);
  assert.equal(reelReadOperatorFrame({...base,castAt:19.75}),7);
  assert.equal(reelReadOperatorFrame({...base,fight:{elapsed:.2},reeling:true}),9);
  assert.equal(reelReadOperatorFrame({...base,fight:{elapsed:.2},reeling:false}),10);
  assert.equal(reelReadOperatorFrame({...base,escapeAt:19.9}),11);
  assert.equal(reelReadOperatorFrame({...base,celebrating:true,celebrationAt:19.5}),15);
});

test('selected action bounds keep whole operators and hulls outside cue/control regions without changing the boat route',()=>{
  const frames=[{bounds:[44,18,242,300],anchor:[145,300]}, {bounds:[12,2,288,317],anchor:[151,317]},
    {bounds:[18,25,283,308],anchor:[143,308]}];
  const atlas={nominalHeight:2.2,pixelsPerUnit:130,frames};
  for(const [width,height] of [[320,340],[320,568],[568,260],[568,320],[1366,768]]) {
    const layout=reelReadStageLayout(width,height),routes=[];
    for(const frame of frames)for(const facing of ['left','right'])for(const position of [0,.4,1]){
      const placed=reelReadActorPlacement(layout,atlas,frame,position,facing);
      assert.ok(placed.bodyBounds.top>=layout.operatorTop-1e-9);
      assert.ok(placed.bodyBounds.left>=8&&placed.bodyBounds.right<=width-8);
      assert.ok(placed.boatX-layout.boatWidth*.5>=8-1e-9);
      assert.ok(placed.boatX+layout.boatWidth*.5<=width-8+1e-9);
      if(layout.compact)assert.ok(placed.bodyBounds.left>=layout.cue.x+layout.cue.width+8-1e-9);
      routes.push(placed.route);
    }
    assert.ok(routes[0].max>=routes[0].min);
    assert.ok(routes.every(route=>JSON.stringify(route)===JSON.stringify(routes[0])));
  }
});
