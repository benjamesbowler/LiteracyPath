import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { CREATURE_TYPES, creatureArt, habitatArt, safariCreatureForSlot, displaySafariGrapheme,
  SAFARI_SCENE_ASSETS, SAFARI_SCENE_KIT, safariSceneMarkup } from '../../src/components/learn/games/games/soundSafariScene.js';

test('six distinct creature silhouettes use one equal material family, never answer status', () => {
  assert.equal(CREATURE_TYPES.length, 6);
  assert.equal(new Set(CREATURE_TYPES.map(creatureArt)).size, 6);
  for (const type of CREATURE_TYPES) {
    assert.equal(creatureArt(type, true), creatureArt(type, false));
    assert.match(creatureArt(type), /viewBox="0 0 110 96"/);
    assert.match(creatureArt(type), /ss-creature-body/);
    assert.match(creatureArt(type), /ellipse[^>]*cy="87"/);
  }
  for (let seed = 0; seed < 120; seed++) {
    const species = Array.from({length:6}, (_,slot) => safariCreatureForSlot(slot, seed));
    assert.equal(new Set(species).size, 6);
    for (let slot=0; slot<6; slot++) assert.equal(safariCreatureForSlot(slot,seed,true), safariCreatureForSlot(slot,seed,false));
  }
});
test('spelling display retains multi-letter and split units without changing source keys', () => {
  for (const value of ['sh','ck','bb','irr','x','qu']) assert.equal(displaySafariGrapheme(value), value);
  assert.equal(displaySafariGrapheme('i_e'), 'i–e');
  assert.equal(displaySafariGrapheme('a'), 'a');
});
test('canonical ranger and habitats retain exact inherited bytes and honest provenance', () => {
  for (const asset of SAFARI_SCENE_ASSETS) {
    assert.equal(createHash('sha256').update(readFileSync(`public${asset.path}`)).digest('hex'),asset.sha256);
    for(const key of ['origin','creator','licence','revision','modifications','role']) assert.ok(asset[key]);
  }
  assert.equal(SAFARI_SCENE_ASSETS.length,4);
  assert.equal(SAFARI_SCENE_KIT.assets,SAFARI_SCENE_ASSETS);
  assert.equal(SAFARI_SCENE_KIT.geometry.path,'src/components/learn/games/games/soundSafariScene.js');
  assert.ok(Object.isFrozen(SAFARI_SCENE_KIT.geometry));
});
test('native scene owns replay, explicit model help, feedback and a word-part path', () => {
  const markup=safariSceneMarkup();
  for(const id of ['hear','model','field','feedback','path','overlay']) assert.match(markup,new RegExp(`data-ss="${id}"`));
  assert.match(markup,/role="status"/);assert.match(markup,/role="list"/);
  assert.doesNotMatch(markup,/canvas|isNeeded|browserTTS|Next sound:/);
  for(const world of ['meadow','dino','moonwood']) assert.match(habitatArt(world),/viewBox="0 0 220 155"/);
});
