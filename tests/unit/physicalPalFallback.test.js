import assert from 'node:assert/strict';
import test from 'node:test';
import { drawPhysicalPalFallback, physicalPalFallbackPose } from '../../src/components/learn/games/shared/physicalPalFallback.js';

test('unavailable-art recovery preserves each canonical cast and physical sole baseline', () => {
  for (const [world, character] of [['meadow','bouncy'],['dino','chompy'],['moonwood','pip']]) {
    for (const time of [0,.7,2,4.4]) {
      const right = physicalPalFallbackPose({world,x:80,y:200,height:76,moving:true,time});
      const left = physicalPalFallbackPose({world,x:80,y:200,height:76,moving:true,time,direction:'left'});
      assert.equal(right.character,character);
      assert.equal(right.representation,'procedural-art-unavailable');
      assert.equal(right.soles.length,2);
      assert.equal(Math.max(...right.soles.map(foot=>foot.y)),200);
      for (let i=0;i<2;i++) {
        assert.ok(right.soles[i].y<=200);
        assert.equal(left.soles[i].x,160-right.soles[i].x);
        assert.equal(left.soles[i].y,right.soles[i].y);
      }
    }
  }
});

test('a held simulation clock freezes recovery pose while locomotion and jumps remain distinct', () => {
  const options={world:'meadow',x:20,y:90,moving:true,time:.7};
  assert.deepEqual(physicalPalFallbackPose(options),physicalPalFallbackPose({...options}));
  assert.notDeepEqual(physicalPalFallbackPose(options).soles,physicalPalFallbackPose({...options,time:2}).soles);
  const jump=physicalPalFallbackPose({...options,action:'jump'});
  assert.equal(jump.airborne,true);
  assert.ok(jump.soles.every(sole=>sole.y<90));
});

test('drawing every recovery cast needs no image/network and restores the caller canvas state', () => {
  for (const world of ['meadow','dino','moonwood']) {
    const calls=[];
    const ctx=new Proxy({}, {get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true});
    const result=drawPhysicalPalFallback(ctx,{world,x:80,y:200,height:76,moving:true,time:.7});
    assert.equal(calls[0][0],'save');
    assert.equal(calls.at(-1)[0],'restore');
    assert.ok(calls.some(([key])=>key==='fill'));
    assert.ok(calls.every(([key])=>key!=='drawImage'));
    assert.equal(result.representation,'procedural-art-unavailable');
  }
});

test('tool sockets follow actual drawn arm caps or palms across mirroring, scaling and frozen actions', () => {
  for (const world of ['meadow', 'dino', 'moonwood']) for (const action of ['idle', 'jump', 'celebrate']) {
    const options = { world, x: 80, y: 200, height: 76, moving: true, time: .7, action };
    const ellipses = [], ctx = new Proxy({}, { get: (_, key) => (...args) => { if (key === 'ellipse') ellipses.push(args); }, set: () => true });
    const pose = drawPhysicalPalFallback(ctx, options), mirrored = physicalPalFallbackPose({ ...options, direction: 'left' });
    assert.equal(Object.keys(pose.handSockets).length, world === 'dino' ? 1 : 2, 'only actually drawn hands are exposed');
    for (const [name, point] of Object.entries(pose.handSockets)) {
      const arm = pose.arms[name], hand = pose.hands[name];
      assert.ok(ellipses.some(([x, y, rx, ry, angle]) => x === arm.x && y === arm.y && rx === arm.rx && ry === arm.ry && angle === arm.rotation), 'socket geometry is used by the actual drawer');
      if (world === 'moonwood') assert.ok(ellipses.some(([x, y, rx, ry]) => x === hand.x && y === hand.y && rx === 5 && ry === 5));
      else {
        const dx = hand.x - arm.x, dy = hand.y - arm.y, c = Math.cos(arm.rotation), s = Math.sin(arm.rotation);
        assert.ok(((dx * c + dy * s) / arm.rx) ** 2 + ((-dx * s + dy * c) / arm.ry) ** 2 < 1, 'forehand attaches inside visible arm paint');
      }
      assert.equal(point.x, options.x + hand.x * pose.scale); assert.equal(point.y, options.y + hand.y * pose.scale);
      assert.equal(mirrored.handSockets[name].x, 160 - point.x); assert.equal(mirrored.handSockets[name].y, point.y);
    }
    assert.deepEqual(physicalPalFallbackPose(options), physicalPalFallbackPose({ ...options }), 'held clock keeps the attachment frozen');
  }
});
