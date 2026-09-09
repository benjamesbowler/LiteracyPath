import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { RHYME_SCENE_ASSETS, RHYME_SCENE_KIT, balloonSkin, balloonArtwork, basketArtwork } from '../../src/components/learn/games/games/rhymePopScene.js';

test('every choice uses the same faceted balloon, knot and tether regardless of rhyme membership', () => {
  for (let slot = 0; slot < 7; slot++) {
    assert.equal(balloonSkin(slot, 41, true), balloonSkin(slot, 41, false));
    assert.match(balloonArtwork(), /rp-balloon-body/);
    assert.match(balloonArtwork(), /rp-balloon-knot/);
    assert.match(balloonArtwork(), /rp-balloon-tether/);
  }
  assert.notEqual(balloonSkin(0, 41), balloonSkin(1, 41));
});
test('basket accepts exactly six collected balloons with explicit unfilled slots', () => {
  for (let found = 0; found <= 6; found++) {
    const art = basketArtwork(found);
    assert.equal((art.match(/data-collected="true"/g) || []).length, found);
    assert.equal((art.match(/data-collected="false"/g) || []).length, 6 - found);
    assert.match(art, /rp-basket-hull/);
  }
});
test('canonical existing art remains byte-identical and provenance is not invented', () => {
  for (const asset of RHYME_SCENE_ASSETS) {
    assert.ok(existsSync(`public${asset.path}`));
    assert.equal(createHash('sha256').update(readFileSync(`public${asset.path}`)).digest('hex'), asset.sha256);
    assert.ok(asset.origin && asset.creator && asset.licence && asset.revision && asset.modifications && asset.role);
  }
  assert.equal(RHYME_SCENE_KIT.assets, RHYME_SCENE_ASSETS);
  assert.ok(existsSync(RHYME_SCENE_KIT.geometry.path));
  assert.equal(RHYME_SCENE_KIT.geometry.roles.length, 3);
  assert.ok(Object.isFrozen(RHYME_SCENE_KIT.geometry));
});
