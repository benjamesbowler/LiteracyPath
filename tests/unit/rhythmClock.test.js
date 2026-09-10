import test from 'node:test';
import assert from 'node:assert/strict';
import { createRhythmClock, nextPhraseBeat } from '../../src/utils/audio/rhythmClock.js';
import { soundBeatLadder } from '../../src/utils/soundBeatTracks.js';

test('rhythm follows audio time and changes source without a jump', () => {
  let wall = 100, audio = null;
  const clock = createRhythmClock({ wallTime: () => wall, audioTime: () => audio });
  wall += 1;
  assert.equal(clock.now(), 101);
  audio = 20;
  assert.equal(clock.now(), 101);
  wall += 1; audio += 0.9;
  assert.ok(Math.abs(clock.now() - 101.9) < 1e-9);
  audio = null;
  assert.ok(Math.abs(clock.now() - 101.9) < 1e-9);
  wall += 0.1;
  assert.ok(Math.abs(clock.now() - 102) < 1e-9);
});

test('pause freezes input and note time for an arbitrarily long absence', () => {
  let wall = 20;
  const clock = createRhythmClock({ wallTime: () => wall, audioTime: () => null });
  const target = nextPhraseBeat(clock.now(), 20, 0.75);
  clock.pause(); wall += 600;
  assert.equal(clock.now(), 20);
  clock.resume(); wall += 0.75;
  assert.equal(clock.now(), 20.75);
  assert.equal(target - clock.now(), 0.75);
});

test('every phrase starts on the musical beat with readable lead-in', () => {
  for (const bpm of [82,94,108,135]) for (const now of [0,0.5,12.34,89.1]) {
    const spacing = 60 / bpm;
    const target = nextPhraseBeat(now, 0, spacing);
    assert.ok(target >= now + 1.05);
    assert.ok(Math.abs(target / spacing - Math.round(target / spacing)) < 1e-8);
  }
});

test('all tracks identify the taught unit and author a pad for every sound and blend', () => {
  const patterns = new Set();
  for (const difficulty of ['easy','medium','hard']) for (const level of soundBeatLadder(difficulty)) for (const item of level.items) {
    assert.ok(['sounds','syllables','words'].includes(item.unit));
    assert.equal(item.lanes.length, item.beats.length + 1);
    assert.ok(item.lanes.every(lane => Number.isInteger(lane) && lane >= 0 && lane < 4));
    patterns.add(item.lanes.join(','));
  }
  assert.ok(patterns.size > 5);
});
