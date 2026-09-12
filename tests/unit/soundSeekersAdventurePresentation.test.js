import test from 'node:test';
import assert from 'node:assert/strict';
import WALK from '../../src/features/soundSeekers/v3/content/heroAnimations.json' with {type:'json'};
import ACTION from '../../src/features/soundSeekers/v3/content/heroActions.json' with {type:'json'};
import {HERO_BILLBOARD,RESIDENT_BILLBOARD,cameraReachBeforeObstacle} from '../../src/features/soundSeekers/v3/render/adventurePresentation.js';

test('every authored walk/action pose fits both billboard canvases without clipping',()=>{
 for(const [kind,l] of Object.entries({hero:HERO_BILLBOARD,resident:RESIDENT_BILLBOARD}))for(const atlas of [WALK,ACTION])for(const [id,a] of Object.entries(atlas))for(const f of a.frames){
  const scale=l.drawHeight/a.referenceHeight;
  assert.ok(l.x-f.anchorX*scale>=0,`${kind} ${id} left`);
  assert.ok(l.x+(f.width-f.anchorX)*scale<=l.size,`${kind} ${id} right`);
  // Walk atlas rectangles include transparent padding below their measured feet.
  const inkTop=atlas===WALK?f.bodyHeight:f.anchorY;
  const inkBottom=atlas===WALK?0:f.height-f.anchorY;
  assert.ok(l.footY-inkTop*scale>=0,`${kind} ${id} top`);
  assert.ok(l.footY+inkBottom*scale<=l.size,`${kind} ${id} bottom`);
 }
});

test('canvas headroom preserves existing body scale and ground registration',()=>{
 assert.equal(HERO_BILLBOARD.worldSize/HERO_BILLBOARD.size,3.2/384);
 assert.equal(RESIDENT_BILLBOARD.worldSize/RESIDENT_BILLBOARD.size,2.65/256);
 assert.equal((HERO_BILLBOARD.size-HERO_BILLBOARD.footY)*HERO_BILLBOARD.worldSize/HERO_BILLBOARD.size,16*3.2/384);
 assert.equal((RESIDENT_BILLBOARD.size-RESIDENT_BILLBOARD.footY)*RESIDENT_BILLBOARD.worldSize/RESIDENT_BILLBOARD.size,4*2.65/256);
});

test('camera remains before nearby obstructions instead of crossing a four-unit floor',()=>{
 for(const distance of [2.01,2.5,3,3.99,4,7,16]){const reach=cameraReachBeforeObstacle(18,distance);assert.ok(reach<distance);assert.ok(reach>0);}
 assert.equal(cameraReachBeforeObstacle(12,Infinity),12);
 assert.equal(cameraReachBeforeObstacle(12,30),12);
});
