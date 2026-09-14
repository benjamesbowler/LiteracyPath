import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MISSIONS, DEMO_WORDS, NARRATION, wrongFeedback } from '../src/content.js';
import { AUDIO } from '../src/audio.js';
import { LANDMARKS, START, FIREFLIES, freshProgress, parseProgress, settleProgress, roundFor, judge, shuffle, riverZ, canWalk, movePlayer } from '../src/rules.js';

const demoRoot = fileURLToPath(new URL('../', import.meta.url));
const assetFile = url => path.join(demoRoot, url.replace(/^\//, ''));
const saved = changes => ({ ...freshProgress(78241), ...changes });

test('a new adventure has independent recoverable state and awards no literacy for movement', () => {
  const first = freshProgress(99), second = freshProgress(99);
  assert.deepEqual(first, second);
  assert.equal(first.mission, 0);
  assert.equal(first.round, 0);
  assert.equal(first.built, '');
  assert.equal(first.complete, false);
  assert.equal(first.correct, 0);
  assert.equal(first.attempts, 0);
  assert.equal(first.mode, 'explore');
  first.position.x += 9;
  first.fireflies.push(0);
  assert.deepEqual(second.position, START);
  assert.deepEqual(second.fireflies, []);
});

test('all unfinished mission/round checkpoints retain their exact problem and choice layout', () => {
  for (let mission = 0; mission < 3; mission += 1) {
    for (let round = 0; round < 6; round += 1) {
      const original = saved({ mission, round, mode: 'activity', seconds: 91, correct: 7, attempts: 10, fireflies: [1, 4] });
      const currentRound = roundFor(MISSIONS, original);
      if (mission === 2) original.built = currentRound.word.slice(0, 2);
      const restored = parseProgress(JSON.stringify(original));
      assert.ok(restored);
      assert.deepEqual(roundFor(MISSIONS, restored), currentRound);
      assert.equal(restored.built, original.built);
      assert.equal(restored.seconds, 91);
      assert.equal(restored.correct, 7);
      assert.equal(restored.attempts, 10);
      assert.deepEqual(restored.fireflies, [1, 4]);
    }
  }
});

test('unreadable, obsolete, and out-of-range checkpoint identities are rejected', () => {
  for (const raw of ['', 'broken JSON', 'null', '[]', '{}', JSON.stringify(saved({ version: 0 })), JSON.stringify(saved({ seed: 0.4 })), JSON.stringify(saved({ mission: -1 })), JSON.stringify(saved({ mission: 4 })), JSON.stringify(saved({ round: -1 })), JSON.stringify(saved({ round: 6 }))]) {
    assert.equal(parseProgress(raw), null, raw);
  }
});

test('checkpoint cleanup bounds position, deduplicates fireflies and removes malformed build text', () => {
  const restored = parseProgress(JSON.stringify(saved({
    position: { x: 999, z: -999 }, fireflies: [1, 1, 4, -1, 5, '2', 1.3],
    built: '<script>', seconds: -40, mode: 'unrecognised', complete: true,
  })));
  assert.ok(restored.position.x <= 25 && restored.position.z >= -35);
  assert.deepEqual(restored.fireflies, [1, 4]);
  assert.equal(restored.built, '');
  assert.equal(restored.seconds, 0);
  assert.equal(restored.mode, 'explore');
  assert.equal(restored.complete, false);
  assert.deepEqual(parseProgress(JSON.stringify(saved({ position: null }))).position, START);
});

test('the final tree has no extra literacy round and completion requires all three lights', () => {
  assert.equal(roundFor(MISSIONS, saved({ mission: 3 })), null);
  assert.equal(parseProgress(JSON.stringify(saved({ mission: 3, complete: true }))).complete, true);
  for (let mission = 0; mission < 3; mission += 1) {
    assert.equal(parseProgress(JSON.stringify(saved({ mission, complete: true }))).complete, false);
  }
});

test('a saved successful response advances once without awarding the same word twice', () => {
  for (let mission = 0; mission < 3; mission += 1) {
    for (let round = 0; round < 6; round += 1) {
      const original = saved({ mission, round, pending: true, mode: 'activity', correct: mission * 6 + round + 1, attempts: 27 });
      if (mission === 2) original.built = roundFor(MISSIONS, original).word;
      const parsed = parseProgress(JSON.stringify(original));
      assert.equal(parsed.built, original.built, 'a complete three-seed word must survive until settled');
      const recovered = settleProgress(parsed);
      assert.equal(recovered.pending, false);
      assert.equal(recovered.built, '');
      assert.equal(recovered.round, round === 5 ? 0 : round + 1);
      assert.equal(recovered.mode, round === 5 ? 'reward' : 'activity');
      assert.equal(recovered.mission, mission, 'taking the light remains a world consequence');
      assert.equal(recovered.correct, original.correct);
      assert.equal(recovered.attempts, original.attempts);
      assert.deepEqual(settleProgress(recovered), recovered, 'a second resume must not skip another word');
      assert.deepEqual(settleProgress(parseProgress(JSON.stringify(recovered))), recovered);
    }
  }
});

test('unsolved partial spellings and earned rewards survive resume unchanged', () => {
  const progress = saved({ mission: 2, round: 2, mode: 'activity', pending: false });
  progress.built = roundFor(MISSIONS, progress).word.slice(0, 2);
  assert.deepEqual(settleProgress(progress), progress);
  const reward = saved({ mission: 1, round: 0, mode: 'reward', pending: false, correct: 12 });
  assert.equal(parseProgress(JSON.stringify(reward)).mode, 'reward');
  assert.deepEqual(settleProgress(reward), reward);
});

test('replay changes problem order and spatial choices without mutating authored content', () => {
  const original = JSON.stringify(MISSIONS);
  for (let mission = 0; mission < MISSIONS.length; mission += 1) {
    const orders = new Set(), choiceOrders = new Set();
    for (let seed = 1; seed <= 80; seed += 1) {
      const rounds = Array.from({ length: 6 }, (_, round) => roundFor(MISSIONS, saved({ seed, mission, round })));
      assert.equal(new Set(rounds.map(round => round.id)).size, 6);
      assert.deepEqual(new Set(rounds.map(round => round.id)), new Set(MISSIONS[mission].rounds.map(round => round.id)));
      orders.add(rounds.map(round => round.id).join('|'));
      choiceOrders.add(rounds[0].choices.map(choice => choice.id).join('|'));
      assert.deepEqual(roundFor(MISSIONS, saved({ seed, mission, round: 2 })), rounds[2]);
    }
    assert.ok(orders.size > 12, `${MISSIONS[mission].id} lacks varied order`);
    assert.ok(choiceOrders.size > 6, `${MISSIONS[mission].id} lacks varied spatial choices`);
  }
  assert.equal(JSON.stringify(MISSIONS), original);
  const source = ['a', 'b', 'c'];
  shuffle(source, 19);
  assert.deepEqual(source, ['a', 'b', 'c']);
});

test('the demo has exactly three distinct activities with six different targets each', () => {
  assert.deepEqual(MISSIONS.map(mission => mission.id), ['picnic', 'brook', 'lanterns']);
  assert.equal(DEMO_WORDS.length, 18);
  assert.equal(new Set(DEMO_WORDS).size, 18);
  assert.equal(new Set(MISSIONS.map(mission => mission.construct)).size, 3);
  for (const mission of MISSIONS) {
    assert.equal(mission.rounds.length, 6);
    assert.equal(new Set(mission.rounds.map(round => round.id)).size, 6);
    assert.equal(NARRATION[mission.introAudio], mission.intro);
    assert.equal(NARRATION[mission.completeAudio], mission.complete);
  }
});

test('every beginning-sound picture question has one exact phonological answer', () => {
  for (const round of MISSIONS[0].rounds) {
    assert.ok(['m', 's'].includes(round.target));
    assert.equal(round.choices.length, 3);
    assert.equal(new Set(round.choices.map(choice => choice.id)).size, 3);
    const matching = round.choices.filter(choice => choice.id[0] === round.target);
    assert.equal(matching.length, 1);
    assert.equal(matching[0].id, round.answer);
    assert.equal(round.answer, round.word);
    assert.ok(round.promptAudio.includes(`phoneme:${round.target}`));
    assert.ok(!round.promptAudio.includes(`word:${round.answer}`), 'initial cue must not announce the correct object');
    for (const choice of round.choices) {
      assert.ok(choice.picture && choice.audio === `word:${choice.id}`);
      const result = judge(round, choice.id, 0);
      assert.equal(result.correct, choice.id === round.answer);
      assert.equal(result.finished, result.correct);
    }
  }
});

test('bridge words are pictured CVC words and each choice supplies only the missing initial grapheme', () => {
  for (const round of MISSIONS[1].rounds) {
    assert.match(round.word, /^[bcdfghjklmnpqrstvwz][aeiou][bcdfghjklmnpqrstvwz]$/);
    assert.deepEqual(round.phonemes, [...round.word]);
    assert.equal(round.maskedWord, `_${round.word.slice(1)}`);
    assert.equal(round.answer, round.word[0]);
    assert.equal(round.choices.length, 3);
    assert.equal(round.choices.filter(choice => choice.id === round.answer).length, 1);
    assert.ok(round.promptAudio.includes(`word:${round.word}`));
    for (const choice of round.choices) {
      assert.match(choice.id, /^[a-z]$/);
      assert.equal(choice.audio, `phoneme:${choice.id}`);
      assert.deepEqual(judge(round, choice.id, 1), { correct: choice.id === round.answer, built: '', finished: choice.id === round.answer });
    }
  }
});

test('flower completion requires all three ordered sounds and wrong seeds preserve progress', () => {
  for (const round of MISSIONS[2].rounds) {
    assert.match(round.word, /^[bcdfghjklmnpqrstvwz][aeiou][bcdfghjklmnpqrstvwz]$/);
    assert.deepEqual(round.phonemes, [...round.word]);
    assert.deepEqual(round.choices.map(choice => choice.id).sort(), [...round.word].sort());
    assert.equal(new Set(round.phonemes).size, 3, 'a disabled used seed must not be needed again');
    let built = '';
    for (let index = 0; index < 3; index += 1) {
      for (const choice of round.choices.filter(choice => choice.id !== round.phonemes[index])) {
        assert.deepEqual(judge(round, choice.id, 2, built), { correct: false, built, finished: false });
      }
      const result = judge(round, round.phonemes[index], 2, built);
      assert.equal(result.correct, true);
      assert.equal(result.finished, index === 2);
      built = result.built;
      assert.equal(built, round.word.slice(0, index + 1));
    }
    assert.equal(built, round.answer);
  }
});

test('every current cue, hint and possible corrective response maps to recorded local audio', () => {
  const assertCue = cue => {
    assert.ok(AUDIO[cue], `Unknown cue: ${cue}`);
    assert.ok(existsSync(assetFile(AUDIO[cue])), `Missing file: ${cue}`);
  };
  for (const key of Object.keys(NARRATION)) assertCue(key);
  for (const mission of MISSIONS) for (const round of mission.rounds) {
    for (const cue of [...round.promptAudio, ...round.hintAudio, ...round.correctAudio, ...(round.choiceAudio || [])]) assertCue(cue);
    for (const phoneme of round.phonemes || []) assertCue(`phoneme:${phoneme}`);
    for (const choice of round.choices) {
      assertCue(choice.audio);
      for (let index = 0; index < (round.phonemes?.length || 1); index += 1) {
        const feedback = wrongFeedback(mission.id, round, choice.id, index);
        assert.ok(feedback.text);
        for (const cue of feedback.audio) assertCue(cue);
      }
    }
  }
});

test('all pictures and recordings match their exact committed demo provenance', () => {
  const manifest = JSON.parse(readFileSync(path.join(demoRoot, 'source/audio-provenance.json'), 'utf8'));
  const records = new Map(manifest.assets.map(asset => [asset.destination, asset]));
  const neededPictures = new Set();
  for (const mission of MISSIONS) for (const round of mission.rounds) {
    neededPictures.add(round.picture);
    round.choices.forEach(choice => { if (choice.picture) neededPictures.add(choice.picture); });
  }
  assert.equal(neededPictures.size, 18);
  for (const url of [...neededPictures, ...Object.values(AUDIO)]) {
    const record = records.get(url.slice(1));
    assert.ok(record, `No provenance for ${url}`);
    const bytes = readFileSync(assetFile(url));
    assert.equal(bytes.length, record.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256);
    assert.equal(record.fileEvidence.decoded, true);
    if (record.role === 'picture') {
      assert.ok(record.fileEvidence.width >= 500 && record.fileEvidence.height >= 500);
    } else {
      assert.ok(record.fileEvidence.durationSeconds > 0.05);
      assert.ok(record.fileEvidence.peak > 0.01 && record.fileEvidence.peak < 1);
    }
  }
});

test('the bridge unlock is a literacy consequence and the river cannot be walked across early', () => {
  for (let mission = 0; mission < 2; mission += 1) {
    for (let x = -25; x <= 25; x += 1) assert.equal(canWalk(x, riverZ(x), mission), false);
  }
  for (const mission of [2, 3]) {
    assert.equal(canWalk(10, riverZ(10), mission), true);
    assert.equal(canWalk(7, riverZ(7), mission), false);
    assert.equal(canWalk(13, riverZ(13), mission), false);
  }
  assert.equal(canWalk(25.01, 18, 3), false);
  assert.equal(canWalk(-25.01, 18, 3), false);
  assert.equal(canWalk(0, 23.01, 3), false);
  assert.equal(canWalk(0, -35.01, 3), false);
});

function reachableFromStart(mission) {
  const key = (x, z) => `${x},${z}`;
  const queue = [[START.x, START.z]], reached = new Set([key(START.x, START.z)]);
  for (let index = 0; index < queue.length; index += 1) {
    const [x, z] = queue[index];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz, nextKey = key(nx, nz);
      if (!reached.has(nextKey) && canWalk(nx, nz, mission)) {
        reached.add(nextKey);
        queue.push([nx, nz]);
      }
    }
  }
  return reached;
}

test('the pure route rules connect the two banks only after bridge repair', () => {
  const before = reachableFromStart(0), after = reachableFromStart(2);
  for (const landmark of LANDMARKS.slice(0, 2)) assert.ok(before.has(`${landmark.x},${landmark.z}`));
  for (const landmark of LANDMARKS.slice(2)) assert.equal(before.has(`${landmark.x},${landmark.z}`), false);
  for (const landmark of LANDMARKS) assert.ok(after.has(`${landmark.x},${landmark.z}`));
  for (const firefly of FIREFLIES) assert.ok(after.has(`${firefly.x},${firefly.z}`));
});

test('collision clearance blocks the actor body, while diagonal controls keep the same speed', () => {
  const obstacle = { x: 0, z: 18, r: 1 };
  assert.equal(canWalk(1.4, 18, 0, [obstacle]), false);
  assert.equal(canWalk(1.5, 18, 0, [obstacle]), true);
  const straight = { x: 0, z: 17, vx: 0, vz: 0 }, diagonal = { ...straight };
  for (let step = 0; step < 60; step += 1) {
    movePlayer(straight, { x: 1, z: 0 }, 1 / 60, 0, []);
    movePlayer(diagonal, { x: 1, z: 1 }, 1 / 60, 0, []);
  }
  assert.ok(Math.abs(Math.hypot(straight.x, straight.z - 17) - Math.hypot(diagonal.x, diagonal.z - 17)) < 1e-9);
  for (let step = 0; step < 60; step += 1) movePlayer(straight, { x: 0, z: 0 }, 1 / 60, 0, []);
  assert.ok(Math.abs(straight.vx) < 0.0001);
});

test('normal frame-by-frame travel stops at the closed river and can cross the repaired bridge', () => {
  const before = { x: 10, z: 0, vx: 0, vz: 0 }, after = { ...before };
  for (let step = 0; step < 180; step += 1) {
    movePlayer(before, { x: 0, z: -1 }, 1 / 60, 1, []);
    movePlayer(after, { x: 0, z: -1 }, 1 / 60, 2, []);
  }
  assert.ok(before.z > riverZ(10));
  assert.ok(after.z < riverZ(10) - 4);
  assert.equal(canWalk(before.x, before.z, 1), true);
  assert.equal(canWalk(after.x, after.z, 2), true);
});
