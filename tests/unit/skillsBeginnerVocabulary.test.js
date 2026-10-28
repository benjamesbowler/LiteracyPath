import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { questions as initialSounds } from '../../src/data/v3/banks/initial_sounds.v3.generated.js';
import { questions as rhyming } from '../../src/data/v3/banks/rhyming.v3.generated.js';
import { questions as digraphs } from '../../src/data/v3/banks/digraphs.v3.generated.js';
import { questions as cvc } from '../../src/data/v3/banks/cvc_short_vowels.v3.generated.js';
import { questions as vowels } from '../../src/data/v3/banks/short_vowel_discrimination.v3.generated.js';
import { questions as silentE } from '../../src/data/v3/banks/long_vowels_silent_e.v3.generated.js';
import { questions as hfw } from '../../src/data/v3/banks/hfw_76_100.v3.generated.js';
import { questions as relations } from '../../src/data/v3/banks/antonyms_synonyms.v3.generated.js';

// Editorially reviewed entry words, including everyday longer words such as
// umbrella. Word length or a single easy onset alone cannot establish access.
const familiarInitialWords = new Set(`
ant apple at bat bed bell bike boat bone bread cake cap chick corn cup deer dig
dog dot drum duck egg elbow end fan fish foot fox fun gate glass goat gum hat hip
house ill in is it jam jet jog key kid king kite lamp leaf leg lid lion lip map mat
moon mop mud mug nap net nose nut off on orange pan pen pet pig pin pot ring
rocket rose rug sad seal ship spoon sun tap tent tiger top umbrella up us van
vase vet watch web wheel wig wind window yawn yell yes yo-yo zebra zip zipper zoo
`.trim().split(/\s+/));

test('entry initial-sound targets and every distractor use reviewed familiar words', () => {
  for (const item of initialSounds.filter(item => item.level === 1)) {
    for (const word of [item.targetWord, ...item.choices]) {
      assert.ok(/^[a-z]$/.test(word) || familiarInitialWords.has(word),
        `${item.id}: review unfamiliar entry vocabulary ${word}`);
    }
  }
});

test('entry sound, spelling and word-recognition questions exclude reported vocabulary traps', () => {
  const unsuitable = /\b(?:vulture|iguana|igloo|jellyfish|underpants|wasp|ox|axe|fig|jig|bog|vat|pheasant|phonics|phrase|dune|duke|fuse|lumber|nimble|silt)\b/i;
  for (const item of [...initialSounds, ...rhyming, ...digraphs, ...cvc, ...vowels, ...silentE, ...hfw]) {
    if (item.level !== 1) continue;
    const stimulus = [item.targetWord, item.prompt, item.spokenPrompt, ...item.choices].filter(Boolean).join(' ');
    assert.doesNotMatch(stimulus, unsuitable, item.id);
  }
});

test('entry word relations do not require advanced incidental synonym vocabulary', () => {
  const unsuitable = /\b(?:scorching|spotless|glossy|watchful|wakeful|vacant|rapid|silky|slick|spongy)\b/i;
  for (const item of relations.filter(item => item.level === 1)) {
    assert.doesNotMatch([item.prompt, ...item.choices].join(' '), unsuitable, item.id);
  }
  assert.ok(relations.some(item => item.level === 2 && item.choices.includes('historic')),
    'later precise word-meaning work retains its distinct construct');
});

test('simpler spoken targets retain exact recorded audio and matching picture labels', () => {
  const root = path.resolve(import.meta.dirname, '../..');
  for (const item of [...initialSounds, ...rhyming].filter(item => item.level === 1)) {
    for (const word of [item.targetWord, ...(item.imageCards || []).map(card => card.word)]) {
      const audio = getLedaWordAudioPath(word);
      assert.ok(audio && fs.existsSync(path.join(root, 'public', audio)), `${item.id}: ${word}`);
    }
    for (const card of item.imageCards || []) {
      assert.ok(item.choices.includes(card.word), `${item.id}: picture is attached to its spoken choice`);
    }
  }
  const jamPair = initialSounds.find(item => item.id === 'lp3.initial_sounds.l1.C.j.v3');
  assert.equal(jamPair.answer, 'jam');
  assert.match(jamPair.imageCards.find(card => card.word === 'jam').image, /\/jam\.webp$/);
});
