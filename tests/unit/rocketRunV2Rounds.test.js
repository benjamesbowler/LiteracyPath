import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { repairRocketV2Distractors, repairRocketV2RecordedSlots, rocketRunV2Outing, rocketRunRequiredCount,
  rocketV2RecordedOnsetPool, rocketV2WordStartsWithTargetSound } from '../../src/utils/rocketRunV2Rounds.js';
import { buildRocketRunRound, rocketRunLadder, ROCKET_RUN_LEVELS, wordsStartingWithTargetSound,
  rocketRunTargets } from '../../src/utils/rocketRunRounds.js';
import { onsetGrapheme, sharesSound } from '../../src/components/elQuest/elQuestEngine.js';
import { rocketCourierOnsetCue } from '../../src/utils/rocketRunTeachingCue.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { gameRandom, replayWithinBands } from '../../src/utils/gameReplay.js';

test('qu first-/k/ negatives become distinct existing hard-/g/ contrasts without altering the correct words or slot identities', () => {
  for (const target of ['c', 'k']) {
    const correct = target === 'c' ? ['cat', 'cap'] : ['king', 'kite'];
    const bank = { targetGrapheme: target, needed: 2, correct, distractors: ['queen', 'quilt', 'green', 'sun'],
      sequence: [...correct.map((word, id) => ({ id, word, correct: true })),
        ...['queen', 'quilt', 'green', 'sun'].map((word, index) => ({ id: index + 2, word, correct: false }))] };
    const original = structuredClone(bank), repaired = repairRocketV2Distractors(bank, 'medium');
    assert.deepEqual(bank, original, 'the legacy packet is not mutated');
    assert.equal(rocketCourierOnsetCue('queen'), 'k'); assert.equal(rocketCourierOnsetCue('quilt'), 'k');
    assert.ok(!repaired.sequence.some(row => !row.correct && onsetGrapheme(row.word) === 'qu'));
    assert.deepEqual(repaired.correct, original.correct); assert.equal(repaired.needed, original.needed);
    assert.deepEqual(repaired.sequence.map(({ id, correct }) => ({ id, correct })), original.sequence.map(({ id, correct }) => ({ id, correct })));
    assert.equal(new Set(repaired.sequence.map(row => row.word)).size, repaired.sequence.length);
    assert.equal(repaired.distractorRepairs.length, 2);
    for (const repair of repaired.distractorRepairs) assert.ok(wordsStartingWithTargetSound('g').includes(repair.to));
    assert.deepEqual(repaired.sequence.filter(row => row.word === 'green' || row.word === 'sun'), original.sequence.filter(row => row.word === 'green' || row.word === 'sun'));
  }
});

test('actual V2 outings keep random stream, identities and true denominators while repairing only reviewed missing names or qu negatives', () => {
  let actualRepairs = 0, incomingRepairs = 0;
  for (const difficulty of ['easy', 'medium', 'hard']) for (const seed of [0, 1, 2, 3, 4, 5, 6, 7, 127, 0xffffffff]) {
    const random = gameRandom(seed), targets = replayWithinBands(rocketRunLadder(difficulty), seed, target => target.length);
    const originals = targets.slice(0, ROCKET_RUN_LEVELS).map(target => buildRocketRunRound(target,
      { count: rocketRunRequiredCount(difficulty), difficulty, random }));
    const plans = rocketRunV2Outing(difficulty, seed); assert.equal(plans.length, originals.length);
    for (const [round, plan] of plans.entries()) {
      const original = originals[round]; assert.equal(plan.target, original.targetGrapheme); assert.equal(plan.needed, original.needed);
      assert.equal(plan.choices.length, original.sequence.length); assert.equal(new Set(plan.choices.map(row => row.word)).size, plan.choices.length);
      for (const [ordinal, row] of plan.choices.entries()) {
        const before = original.sequence[ordinal]; assert.equal(row.id, `rocket-${round}-${ordinal}`);
        assert.equal(row.ordinal, ordinal); assert.equal(row.correct, before.correct);
        const incoming = plan.incomingWordRepairs.find(repair => repair.ordinal === ordinal);
        if (incoming) {
          incomingRepairs++; assert.equal(incoming.from, before.word); assert.equal(incoming.to, row.word);
          assert.equal(incoming.src, getLedaWordAudioPath(row.word));
          assert.equal(rocketV2WordStartsWithTargetSound(row.word, plan.target), row.correct);
        } else if (before.correct || onsetGrapheme(before.word) !== 'qu' || !sharesSound(plan.target, 'k')) assert.equal(row.word, before.word);
        else { actualRepairs++; assert.ok(wordsStartingWithTargetSound('g').includes(row.word)); }
        assert.ok(getLedaWordAudioPath(row.word));
        assert.ok(existsSync(new URL('../../public' + getLedaWordAudioPath(row.word), import.meta.url)));
        if (sharesSound(plan.target, 'k') && !row.correct) assert.notEqual(onsetGrapheme(row.word), 'qu');
      }
      assert.equal(plan.distractorRepairs.length, original.sequence.filter(row => !row.correct && onsetGrapheme(row.word) === 'qu'
        && sharesSound(plan.target, 'k')).length);
    }
    assert.deepEqual(rocketRunV2Outing(difficulty, seed), plans, 'identical seed reconstructs identical repaired encounters');
  }
  assert.ok(actualRepairs > 0, 'the retained seeded authored bank actually exercises the learning defect');
  assert.ok(incomingRepairs > 0, 'the retained seeded bank exercises the required incoming-audio repair');
});

test('all 27 target pools retain original counts and difficulty-band capacity with shipped recorded actual-onset members', () => {
  const targets = rocketRunTargets(); assert.equal(targets.length, 27);
  for (const target of targets) for (const difficulty of ['easy', 'medium', 'hard']) {
    const limits = difficulty === 'hard' ? [4, 6] : difficulty === 'medium' ? [3, 5] : [2, 4];
    const inRange = word => word.length >= limits[0] && word.length <= limits[1];
    const original = wordsStartingWithTargetSound(target), originalInBand = original.filter(inRange);
    const source = originalInBand.length < 3 ? original : originalInBand;
    const required = Math.min(source.length, rocketRunRequiredCount(difficulty));
    const pool = rocketV2RecordedOnsetPool(target).filter(word => originalInBand.length < 3 || inRange(word));
    assert.ok(pool.length >= required, `${target}/${difficulty} ${pool.length} recorded members for ${required} original catches`);
    assert.equal(new Set(pool).size, pool.length);
    for (const word of pool) {
      assert.equal(rocketV2WordStartsWithTargetSound(word, target), true);
      const src = getLedaWordAudioPath(word); assert.ok(src, `${word} has a canonical recording`);
      assert.ok(existsSync(new URL('../../public' + src, import.meta.url)), `${word} recording is shipped`);
    }
  }
  // Printed first letters alone cannot admit soft c/g or long vowels.
  for (const [word, target] of [['city', 'c'], ['gem', 'g'], ['item', 'i'], ['acorn', 'a'], ['eagle', 'e']]) {
    assert.equal(rocketV2WordStartsWithTargetSound(word, target), false);
  }
  for (const [word, target] of [['added', 'a'], ['ink', 'i'], ['inside', 'i'], ['mother', 'm'], ['otter', 'o'], ['voice', 'v']]) {
    assert.equal(rocketV2WordStartsWithTargetSound(word, target), true);
    assert.equal(rocketCourierOnsetCue(word), target);
    assert.equal(rocketV2WordStartsWithTargetSound(word, 'e'), false);
  }
});

test('a fully selected hard short-i bank preserves twelve real IDs and coherent lists when issue becomes inside', () => {
  const correct = wordsStartingWithTargetSound('i').filter(word => word.length >= 4 && word.length <= 6);
  assert.equal(correct.length, 12);
  const bank = { targetGrapheme: 'i', needed: 12, correct, distractors: ['coat', 'thumb'],
    sequence: [...correct.map((word, ordinal) => ({ word, correct: true, id: `trial-${ordinal}`, ordinal })),
      ...['coat', 'thumb'].map((word, index) => ({ word, correct: false, id: `wrong-${index}`, ordinal: index + 12 }))] };
  const original = structuredClone(bank), repaired = repairRocketV2RecordedSlots(bank, 'hard');
  assert.deepEqual(bank, original); assert.equal(repaired.needed, 12);
  assert.equal(new Set(repaired.sequence.map(row => row.word)).size, repaired.sequence.length);
  assert.deepEqual(repaired.correct, repaired.sequence.filter(row => row.correct).map(row => row.word));
  assert.deepEqual(repaired.distractors, repaired.sequence.filter(row => !row.correct).map(row => row.word));
  assert.equal(repaired.correct.includes('inside'), true); assert.equal(repaired.correct.includes('issue'), false);
  assert.deepEqual(repaired.sequence.map(({ id, ordinal, correct: value }) => ({ id, ordinal, value })),
    original.sequence.map(({ id, ordinal, correct: value }) => ({ id, ordinal, value })));
  assert.deepEqual(repairRocketV2RecordedSlots(bank, 'hard'), repaired);
});

test('multiple unavailable names never reuse an already selected spelling or mutate old authoring receipts', () => {
  const bank = { targetGrapheme: 'e', needed: 5, correct: ['elf', 'edge', 'ebb', 'elk', 'elm'], distractors: ['cat', 'sun'],
    sequence: ['elf', 'edge', 'ebb', 'elk', 'elm'].map((word, ordinal) => ({ word, correct: true, ordinal }))
      .concat(['cat', 'sun'].map((word, index) => ({ word, correct: false, ordinal: index + 5 }))),
    authoringReceipts: [{ word: 'ebb', kind: 'original-bank-provenance' }] };
  const original = structuredClone(bank), repaired = repairRocketV2RecordedSlots(bank, 'easy');
  assert.deepEqual(bank, original); assert.deepEqual(repaired.authoringReceipts, original.authoringReceipts);
  assert.equal(repaired.incomingWordRepairs.length, 3); assert.equal(new Set(repaired.sequence.map(row => row.word)).size, 7);
  assert.deepEqual(repaired.correct, repaired.sequence.filter(row => row.correct).map(row => row.word));
  assert.deepEqual(repaired.distractors, ['cat', 'sun']);
  assert.equal(repaired.needed, 5);
  for (const repair of repaired.incomingWordRepairs) {
    assert.ok(!['elf', 'edge'].includes(repair.to)); assert.equal(rocketV2WordStartsWithTargetSound(repair.to, 'e'), true);
  }
});

test('six reviewed capacity extras retain exact shipped canonical recording bytes', () => {
  const receipts = {
    added: '4cc330ef354e9dceea2e1e20e7d3470327cfc2be5b05cf6540aec7dcfbce54a6',
    ink: '266f43d04ad56054d409bb264a564253fdef078507297dedd48f559f06d0be86',
    inside: 'bade515385e1763b179f41877bc55eb1540c4237c36b1c1082aef4f00af17c39',
    mother: '9a501ab04458b97be8339e25ebfdc6009deb9a3b2d22a66ae16edbc43683561b',
    otter: 'aa1a5223b00adafaf3c6ad07de2a61231013fe8c2f885b5e1a769aaa21876c63',
    voice: 'e4eb21d65b007a35585d7d0f453d07df3de58613a50d0b3055b5a10eb6c2b9b8',
  };
  for (const [word, sha256] of Object.entries(receipts)) {
    const src = getLedaWordAudioPath(word), bytes = readFileSync(new URL('../../public' + src, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), sha256);
  }
  for (const word of ['added', 'ink', 'otter', 'voice']) {
    const src = getLedaWordAudioPath(word); assert.ok(src);
    assert.ok(readFileSync(new URL('../../public' + src, import.meta.url)).byteLength > 1000);
  }
});
