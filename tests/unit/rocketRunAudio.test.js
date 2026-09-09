import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ROCKET_AUDIO_SCRIPTS, rocketInstructionPath, rocketFeedbackClips } from '../../src/components/learn/games/games/rocketRunAudio.js';
import { buildFlightPlan, flightChoices } from '../../src/components/learn/games/games/rocketRunFlight.js';
import { getPreferredPhonemeAudioPath } from '../../src/data/phonemeAudioBank.js';

test('Rocket instructions cover both actions and bind exact Leda text to recorded bytes', () => {
  assert.match(ROCKET_AUDIO_SCRIPTS.instruction, /Tap its gate, then tap Fly through/);
  const provenance = JSON.parse(readFileSync('public/audio/rocket-run/provenance.json', 'utf8'));
  assert.equal(provenance.voice, 'en-US-Chirp3-HD-Leda');
  for (const [id, text] of Object.entries(ROCKET_AUDIO_SCRIPTS)) {
    const row = provenance.assets[id];
    assert.equal(row.text, text); assert.equal(row.audio, rocketInstructionPath(id));
    assert.equal(row.sha256, createHash('sha256').update(readFileSync(`public${row.audio}`)).digest('hex'));
    assert.ok(row.durationSeconds > 0); assert.equal(row.humanListening, 'unknown');
  }
});

test('every recorded choice has specific spoken onset feedback and a retained target on wrong answers', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) for (const round of buildFlightPlan(difficulty, 41)) {
    for (const gate of round.gates) for (const choice of flightChoices(gate)) {
      const correct = choice.word === gate.word;
      const clips = rocketFeedbackClips({ response: choice.word, target: gate.target, correct });
      assert.equal(clips.length, correct ? 4 : 5);
      for (const clip of clips) assert.ok(clip && existsSync(`public${clip}`), `${choice.word}: ${clip}`);
      assert.equal(clips.at(-1), correct ? rocketInstructionPath('powered') : getPreferredPhonemeAudioPath(gate.target));
    }
  }
});

test('ambiguous onset spellings cannot become corrective phoneme claims', () => {
  for (const response of ['that', 'all', 'item', 'gem']) {
    assert.deepEqual(rocketFeedbackClips({ response, target: 'b', correct: false }), [], response);
  }
  for (const difficulty of ['easy', 'medium', 'hard']) for (const round of buildFlightPlan(difficulty, 41)) {
    for (const gate of round.gates) for (const attempt of [0, 1, 2, 3]) {
      for (const choice of flightChoices(gate, attempt)) {
        assert.ok(!['that', 'all', 'item', 'gem'].includes(choice.word), choice.word);
      }
    }
  }
});
