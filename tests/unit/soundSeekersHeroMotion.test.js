import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import HERO_ANIMATIONS from '../../src/features/soundSeekers/v3/content/heroAnimations.json' with { type: 'json' };
import HERO_ACTIONS from '../../src/features/soundSeekers/v3/content/heroActions.json' with { type: 'json' };
import { createCampaignHeroAnimator, keyCampaignHeroPixels, sampleCampaignHeroPose } from '../../src/features/soundSeekers/v3/render/heroMotion.js';

test('every playable Pal has distinct complete action drawings in a verified atlas', () => {
 for (const id of Object.keys(HERO_ANIMATIONS)) {
  const a=HERO_ACTIONS[id]; assert.ok(a,id);
  assert.deepEqual(a.frames.map(f=>f.pose),['rest','blink','crouch','air','reach','cheer']);
  assert.equal(a.sha256,crypto.createHash('sha256').update(fs.readFileSync(new URL('../../public'+a.src,import.meta.url))).digest('hex'));
  for(const f of a.frames){assert.ok(f.x>=0&&f.y>=0&&f.x+f.width<=a.width&&f.y+f.height<=a.height,id+f.pose);assert.ok(f.anchorY<=f.height&&f.anchorX>0);}
  assert.ok(a.frames[2].bodyHeight<a.frames[0].bodyHeight,id+' anticipation is a crouch drawing');
 }
});

test('gait is driven by traveled distance and freezes when stopped', () => {
 const slow=createCampaignHeroAnimator('speedy'),fast=createCampaignHeroAnimator('speedy');
 const s=slow.update(.1,{state:'walk',speed:100}),f=fast.update(.1,{state:'walk',speed:300});
 assert.notEqual(s.frame,f.frame);
 const still=slow.update(.1,{state:'walk',speed:0}); assert.equal(still.frame,s.frame);
 const before=slow.update(0,{state:'walk',speed:100}); slow.update(.1,{state:'idle'});
 assert.equal(slow.update(0,{state:'walk',speed:100}).frame,before.frame,'idle does not reset the gait phase');
});

test('landing uses an impact drawing then recovers without changing input state', () => {
 const a=createCampaignHeroAnimator('bouncy'); assert.equal(a.update(.1,{state:'jump'}).frame,3);
 a.update(.1,{state:'fall'});
 assert.deepEqual(a.update(.1,{state:'idle'}),{sheet:'action',frame:2,state:'land'});
 for(let i=0;i<4;i++)a.update(.1,{state:'idle'});
 assert.equal(a.update(.1,{state:'idle'}).state,'idle');
 assert.equal(a.update(.1,{state:'jump'}).frame,3,'new jump interrupts recovery immediately');
});

test('interaction events restart only when explicitly requested and feedback expires', () => {
 const a=createCampaignHeroAnimator('pip'); a.update(.05,{state:'use',actionId:1});
 assert.equal(a.update(.1,{state:'use',actionId:1}).frame,4);
 for(let i=0;i<5;i++)a.update(.1,{state:'use',actionId:1});
 assert.equal(a.update(.1,{state:'use',actionId:1}).state,'idle');
 assert.equal(a.update(.1,{state:'use',actionId:2}).state,'use');
});

test('reduced motion retains meaningful action poses but stops idle blinking', () => {
 for(const clock of [0,1,2,3,4,5,6,7,8])assert.equal(sampleCampaignHeroPose('speedy',{clock,reducedMotion:true}).frame,0);
 assert.equal(sampleCampaignHeroPose('speedy',{state:'jump',reducedMotion:true}).frame,3);
 assert.equal(sampleCampaignHeroPose('speedy',{state:'use',reducedMotion:true}).frame,4);
 assert.equal(sampleCampaignHeroPose('speedy',{state:'celebrate',reducedMotion:true}).frame,5);
});

test('rendering key removes magenta backing without eating neutral whites or pink skin', () => {
 const pixels=new Uint8ClampedArray([255,0,255,255,236,22,239,255,255,255,255,255,255,164,164,255,12,12,12,255,34,98,41,255]);
 keyCampaignHeroPixels(pixels);
 assert.equal(pixels[3],0); assert.equal(pixels[7],0);
 assert.deepEqual([...pixels.slice(8)],[255,255,255,255,255,164,164,255,12,12,12,255,34,98,41,255]);
});
