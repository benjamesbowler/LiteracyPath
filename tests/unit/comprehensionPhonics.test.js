import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPREHENSION_PASSAGES } from '../../src/content/comprehension/passages.js';
import { getPassagePhonicsWords } from '../../src/content/comprehension/phonics.js';

import { EXPANSION_PHONICS_AUDIT } from '../fixtures/comprehensionExpansionPhonics.js';

// A reading of every story supplies this independent expected-word audit.
// Keep this explicit: comparing with targetWords would repeat the original bug.
const expectedByPassage = {
  ...EXPANSION_PHONICS_AUDIT,
  'muddy-mat': 'muddy sat mud sun up and ran mat hut had nap',
  'pip-bag': 'had red bag pen then map fell and peg',
  'fluff-log': 'hop onto big log off in pit is cannot sit on',
  'socks-cup': 'cup jug gets wet then',
  'chips-shed': 'dish fish shed shuts',
  'chompy-chip': 'chompy chips bench chip',
  'fluff-path': 'path with thick the then',
  'pip-tent': 'tent gust lost into stays',
  'muddy-cake': 'made cake plate shake safe',
  'socks-kite': 'kite line time',
  'pip-home': 'home note rope',
  'fluff-tune': 'tune flute use',
  'chips-cube': 'cube use',
  'chompy-game': 'make game five line side slides',
  'muddy-rain': 'pail rain waiting',
  'pip-play': 'play day tray stay',
  'fluff-seeds': 'three seeds week green seed keeps',
  'socks-beach': 'beach sea reach',
  'chips-boat': 'boat soak float',
  'chompy-snow': 'snow low snowball row slow',
  'pip-night': 'night bright light high',
  'fluff-blue': 'blue glue',
  'socks-trail': 'trail way rain stay',
  'muddy-seat': 'needs seat tree each read',
  'muddy-bus-stop': 'muddy bus shop sun hot on stops up onto',
  'muddy-pot-lid': 'pot lid sits sink it not fit big bigger this fits on',
  'pip-zip': 'pip cap in bag zip it is and this',
  'pip-pet-food': 'pip pet is in tin dish it sits empty sink then shelf',
  'fluff-broken-pen': 'red hen picks pen ink it still in bin',
  'fluff-mix': 'fluff nuts in cup raisins mix with is but tips into big',
  'socks-wet-hat': 'hat wet hangs peg grass and bag',
  'socks-six-pens': 'six pens in them pen is lifts gets',
  'chips-sun-cap': 'sun cap bag and',
  'chips-map': 'has map dot pond past stops at path and on',
  'chompy-jam': 'has and red jam helps then half',
  'chompy-bin': 'has an can and bag bins stand bin is cans in',
  'muddy-shop-list': 'shopping shop shelf',
  'muddy-ring': 'ring long string hangs swings',
  'pip-lunch-box': 'lunch chops cheese sandwich',
  'pip-sink': 'pink sink',
  'fluff-bath-toy': 'bath the with then',
  'fluff-clock': 'clock tick back checks',
  'socks-string-beads': 'long string hangs',
  'socks-steps': 'steps starts step dust last',
  'chips-brush': 'brush washes shelf',
  'chips-chest': 'chips chest checks latch',
  'chompy-thin-paper': 'the thick thin with both',
  'chompy-stamp': 'sticks stamp post',
  'muddy-bike-tyre': 'ride bike side',
  'muddy-gate': 'made gate space',
  'pip-tape': 'page tape place',
  'pip-cone': 'home cone',
  'fluff-hike': 'hike wide side',
  'socks-hose': 'home rose hose',
  'chips-race': 'race line five',
  'chompy-case': 'case same name cases',
  'muddy-train': 'waits train',
  'muddy-hay': 'day hay tray',
  'pip-sheep': 'sees three sheep tree see',
  'pip-tea': 'tea leaves each',
  'fluff-toast': 'toaster coat toast',
  'fluff-snow-boots': 'snow below window',
  'fluff-night-bag': 'night bright light',
  'socks-blue-glue': 'blue glue',
  'socks-field': 'field piece',
  'socks-these-boxes': 'these',
  'chips-stew': 'stew blew',
  'chips-raincoat': 'rain waits raincoat',
  'chips-day-trip': 'day tray away',
  'chompy-teeth': 'squeezes teeth sees',
  'chompy-peach': 'peach each eats',
  'chompy-road': 'coat road',
};

test('every focused word in all 172 stories matches the reviewed word audit', () => {
  assert.equal(COMPREHENSION_PASSAGES.length, 172);
  assert.deepEqual(new Set(COMPREHENSION_PASSAGES.map(p => p.id)), new Set(Object.keys(expectedByPassage)));
  for (const passage of COMPREHENSION_PASSAGES) {
    const words = getPassagePhonicsWords(passage);
    assert.deepEqual(words, expectedByPassage[passage.id].split(' '), passage.id);
    assert.equal(words.length, new Set(words).size, passage.id);
    for (const target of passage.targetWords) {
      assert.ok(words.includes(target), `${passage.id}: target ${target} must match the focus sound`);
    }
  }
});

const mark = (focus, text, targetWords = []) => getPassagePhonicsWords({ focus, text, targetWords });

test('the Muddy/mat regression marks all short-a and short-u words, once each', () => {
  const passage = COMPREHENSION_PASSAGES.find(p => p.id === 'muddy-mat');
  assert.deepEqual(getPassagePhonicsWords(passage), ['muddy', 'sat', 'mud', 'sun', 'up', 'and', 'ran', 'mat', 'hut', 'had', 'nap']);
});

test('spelling lookalikes do not override pronunciation, even when authored as targets', () => {
  assert.deepEqual(mark('Short a / short u', 'A mat was put in mud.', ['a', 'was', 'put']), ['mat', 'mud']);
  assert.deepEqual(mark('ai', 'Said rain again waiting.', ['said']), ['rain', 'waiting']);
  assert.deepEqual(mark('ea', 'Head bread sea reach.', ['head', 'bread']), ['sea', 'reach']);
  assert.deepEqual(mark('ow as in snow', 'Down snow now slow snowball.', ['down']), ['snow', 'slow', 'snowball']);
  assert.deepEqual(mark('a-e', 'Have a cake on a table.', ['have', 'table']), ['cake']);
  assert.deepEqual(mark('i-e', 'Give five little stones.', ['give', 'little']), ['five']);
  assert.deepEqual(mark('o-e', 'Come home with some stones.', ['come', 'some']), ['home', 'stones']);
  assert.deepEqual(mark('u-e', 'Use a cube, not a tube of lettuce.', ['lettuce']), ['use', 'cube', 'tube']);
  assert.deepEqual(mark('ie as in field', 'The piece lies in a field.', ['lies']), ['piece', 'field']);
  assert.deepEqual(mark('st', 'Listen to the steps.', ['listen']), ['steps']);
});

test('literal focus spelling is retained for mixtures, inflections and compounds', () => {
  assert.deepEqual(mark('Short u', 'Some mud from a full cup.', ['some', 'from', 'full']), ['mud', 'cup']);
  assert.deepEqual(mark('a-e / i-e', 'Make five lines beside the game.'), ['make', 'five', 'lines', 'beside', 'game']);
  assert.deepEqual(mark('ee / ea', 'Each green leaf needs a tree.'), ['each', 'green', 'leaf', 'needs', 'tree']);
  assert.deepEqual(mark('st / nt blends', 'The tent stays up in a gust.'), ['tent', 'stays', 'gust']);
  assert.deepEqual(mark('sh', 'The shed shuts.'), ['shed', 'shuts']);
  assert.deepEqual(mark('ai / ay', 'Rain waits by the trail on a day away.'), ['rain', 'waits', 'trail', 'day', 'away']);
  assert.deepEqual(mark('ew as in stew', 'New stew blew.'), ['new', 'stew', 'blew']);
  assert.deepEqual(mark('e-e as in these', 'These boxes hold leaves.'), ['these']);
});

test('marks use story words only and include known regularly pronounced names', () => {
  assert.deepEqual(mark('Short i', 'Pip sits in it. Pip sits.', ['pig']), ['pip', 'sits', 'in', 'it']);
  assert.deepEqual(mark('ch', 'Chips checks wood chips. Chompy checks chips.'), ['chips', 'checks', 'chompy']);
  assert.deepEqual(mark('Short o', 'Socks has socks.'), ['socks']);
  assert.deepEqual(mark('Short u', 'Fluff’s cup and Muddy\'s mug.'), ['fluff', 'cup', 'muddy', 'mug']);
  assert.deepEqual(mark('Short i', 'Muddy Fluff Pip Socks Chips Chompy.'), ['pip', 'chips']);
  assert.deepEqual(mark('Short o', 'Muddy Fluff Pip Socks Chips Chompy.'), ['socks', 'chompy']);
  assert.deepEqual(mark('Short a', 'Muddy Fluff Pip Socks Chips Chompy.'), []);
});

test('unknown patterns and malformed inputs fail conservatively without mutation', () => {
  assert.deepEqual(getPassagePhonicsWords(null), []);
  assert.deepEqual(getPassagePhonicsWords({focus: 'ai'}), []);
  assert.deepEqual(mark('imaginary', 'rain mat'), []);
  assert.deepEqual(mark('ai', 'unreviewedvocabulary'), []);
  const passage = Object.freeze({focus: 'ai', text: 'RAIN, rain; pail! Waiting.', targetWords: Object.freeze(['rain'])});
  assert.deepEqual(getPassagePhonicsWords(passage), ['rain', 'pail', 'waiting']);
});
