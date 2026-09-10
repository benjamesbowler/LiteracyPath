import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSoundRacerRace } from '../../src/utils/soundRacerRace.js';
import { soundRacerLadder } from '../../src/utils/soundRacerTracks.js';
import { wordStartsWithTargetSound } from '../../src/utils/rocketRunRounds.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { sampleCircuitPath, createKart, stepKart, angleDelta } from '../../src/utils/soundRacerPhysics.js';

test('every existing circuit has three real laps with unique recorded sound targets', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) soundRacerLadder(difficulty).forEach((target, seed) => {
    const race = buildSoundRacerRace(target, { difficulty, seed });
    assert.equal(race.laps, 3);
    assert.equal(race.raceLength, race.totalLength * 3);
    assert.equal(race.checkpoints.length, 10);
    assert.equal(race.checkpoints.at(-1), race.raceLength);
    const correct = race.gates.filter(gate => gate.correct);
    const [min, max] = { easy: [2, 4], medium: [3, 5], hard: [4, 6] }[difficulty];
    assert.ok(correct.every(gate => gate.word.length >= min && gate.word.length <= max));
    assert.equal(new Set(correct.map(gate => gate.word)).size, race.needed);
    assert.equal(correct.length, race.needed);
    assert.ok(race.lapGoals.every(count => count >= 3));
    for (const gate of race.gates) {
      assert.ok(gate.z > (gate.lap - 1) * race.totalLength && gate.z < gate.lap * race.totalLength);
      if (!gate.word) continue;
      assert.ok(gate.word.length >= min && gate.word.length <= max);
      assert.equal(wordStartsWithTargetSound(gate.word, target), gate.correct, `${target}: ${gate.word}`);
      const path = getLedaWordAudioPath(gate.word);
      assert.ok(path && fs.existsSync(`public${path}`), `${gate.word} recorded clip`);
    }
    for (const lap of [1, 2, 3]) assert.equal(correct.filter(gate => gate.lap === lap).length, race.lapGoals[lap - 1]);
    const a = sampleCircuitPath(race.path, 42), b = sampleCircuitPath(race.path, race.totalLength + 42);
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < .0001);
  });
});

test('race generation is reproducible and does not mutate the one-lap circuit contract', () => {
  const first = buildSoundRacerRace('b', { difficulty: 'easy', seed: 0 });
  assert.deepEqual(buildSoundRacerRace('b', { difficulty: 'easy', seed: 0 }), first);
  assert.equal(first.totalLength, 560);
  assert.equal(first.raceLength, 1680);
  assert.ok(first.gates.length > 60);
});


test('ordinary steering crosses all three seams without projection shortcuts or recovery', () => {
  const race = buildSoundRacerRace('b', { difficulty: 'easy', seed: 0 });
  let kart = createKart(race.path), frames = 0;
  for (; frames < 60 * 240 && kart.progress < race.raceLength; frames++) {
    const ahead = sampleCircuitPath(race.path, kart.progress + 6);
    const desired = Math.atan2(ahead.x - kart.x, -(ahead.z - kart.z));
    const steer = Math.max(-1, Math.min(1, angleDelta(kart.heading, desired) * 2.5));
    kart = stepKart(race.path, kart, { steer, speed: 9 }, 1 / 60);
  }
  assert.ok(kart.progress >= race.raceLength);
  assert.equal(kart.recoveries, 0);
  assert.ok(frames / 60 >= 120);
});
