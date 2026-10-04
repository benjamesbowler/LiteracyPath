import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { phonicsTargetHint } from '../../src/utils/phonicsTargetPresentation.js';
import { GAME_LIST } from '../../src/data/learnGamesData.js';
import { buildSortRounds } from '../../src/utils/adventureRounds.js';

test('partial spelling help starts after two mistakes and never supplies the whole answer', () => {
  for (const word of ['sock','ship','cat','rain','go','sh']) {
    assert.equal(phonicsTargetHint(word,0),'');
    assert.equal(phonicsTargetHint(word,1),'');
    const hint=phonicsTargetHint(word,2);
    assert.ok(hint.includes('*'));
    assert.equal(hint.length,word.length);
    assert.notEqual(hint,word);
  }
  assert.equal(phonicsTargetHint('sock',2),'**ck');
  for (const word of ['', 'a', 'two words', 'a_e']) assert.equal(phonicsTargetHint(word,4),'');
});

test('every menu game has its own matching generated icon and recorded prompt', () => {
  const manifest=JSON.parse(readFileSync(new URL('../../public/images/learn-games/menu/manifest.json',import.meta.url)));
  assert.equal(GAME_LIST.length,27);
  assert.equal(new Set(GAME_LIST.map(game=>game.menuArt)).size,27);
  for (const game of GAME_LIST) {
    const asset=readFileSync(new URL(`../../public${game.menuArt}`,import.meta.url));
    assert.ok(asset.length>1000);
    assert.ok(JSON.stringify(manifest).includes(game.id));
  }
});

test('audio-first sound sorting never asks children to distinguish w from wh', () => {
  for (const difficulty of ['easy','medium','hard']) {
    const round=buildSortRounds(difficulty,()=>.4);
    assert.ok(round.items.length>0);
    assert.ok(round.items.every(item=>![item.binA,item.binB].includes('wh')));
  }
});
