import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import profiles from '../../src/features/soundSeekers/v3/content/heroAnimations.json' with {type:'json'};
const publicRoot=new URL('../../public/',import.meta.url);
test('all eight playable Pals ship distinct alpha atlases with valid grounded frames',()=>{
 assert.deepEqual(Object.keys(profiles).sort(),['speedy','bouncy','woolly','splashy','clucky','muddy','chompy','pip'].sort());
 const hashes=new Set();
 for(const [id,profile] of Object.entries(profiles)){
  const bytes=fs.readFileSync(new URL(profile.src.slice(1),publicRoot));
  assert.equal(bytes.toString('ascii',1,4),'PNG',id);
  assert.equal(bytes[25],6,`${id}: PNG needs real alpha`);
  assert.equal(bytes.readUInt32BE(16),profile.width);assert.equal(bytes.readUInt32BE(20),profile.height);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),profile.sha256);hashes.add(profile.sha256);
  assert.ok(profile.frames.length>=4,id);assert.ok(fs.existsSync(new URL(profile.canonicalIdentityReference.slice(1),publicRoot)),id);
  for(const frame of profile.frames){assert.ok(frame.x>=0&&frame.y>=0&&frame.x+frame.width<=profile.width&&frame.y+frame.height<=profile.height,id);assert.ok(frame.anchorX>0&&frame.anchorX<frame.width&&frame.anchorY>0&&frame.anchorY<frame.height,id);}
 }
 assert.equal(hashes.size,8);
});
