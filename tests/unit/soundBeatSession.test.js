import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUND_BEAT_CONTENT_VERSION, newSoundBeatEvidence, soundBeatResponse, validateSoundBeatSession } from '../../src/utils/soundBeatSession.js';
import { soundBeatLadder } from '../../src/utils/soundBeatTracks.js';

function fixture() {
  const ladder = soundBeatLadder('easy', 7), item = ladder[0].items[0];
  let evidence = newSoundBeatEvidence();
  for (const beat of [0, 1]) evidence = soundBeatResponse(evidence, item, { stage: 0, task: 0, beat, lane: item.lanes[beat], deltaMs: 0, quality: 'PERFECT', at: 10 + beat, supportReasons: ['timing-mercy'] }).evidence;
  evidence.motorEvents.timingMisses = 2;
  return { context: { seed: 7, stage: 0, journeyIndex: 2, ladder }, value: {
    version: SOUND_BEAT_CONTENT_VERSION, seed: 7, journeyIndex: 2, stage: 0, taskIndex: 0, word: item.word, beatIndex: 2,
    phase: 'playing', attempts: 2, score: 0, correct: 0, wordsEnded: 0, mistakes: 2, combo: 0, currentWordClean: false,
    roundElapsed: 14, roundBpm: 82, roundWindow: 460, remainingDelay: 0.4, supportReasons: ['timing-mercy'], evidence
  } };
}

test('a retained-prefix mercy phrase validates without resetting response, motor or support history', () => {
  const { value, context } = fixture();
  const restored = validateSoundBeatSession(value, context);
  assert.deepEqual(restored, value);
  restored.evidence.acceptedResponses.length = 0;
  assert.equal(value.evidence.acceptedResponses.length, 2, 'returned state cannot mutate the stored source');
});

test('restore rejects a mismatched bank/seed/journey and fabricated prefix, clean credit or future response', () => {
  const { value, context } = fixture();
  for (const patch of [{ seed: 8 }, { journeyIndex: 3 }, { word: 'wrong' }, { beatIndex: 3 }, { currentWordClean: true }, { score: 200 }]) {
    assert.equal(validateSoundBeatSession({ ...value, ...patch }, context), null);
  }
  const unsupported = structuredClone(value); unsupported.evidence.acceptedResponses.pop();
  assert.equal(validateSoundBeatSession(unsupported, context), null);
  const future = structuredClone(value); const item = context.ladder[0].items[1];
  future.evidence.firstResponses.push(soundBeatResponse(newSoundBeatEvidence(), item, { stage: 0, task: 1, beat: 0, lane: item.lanes[0], deltaMs: 0, quality: 'PERFECT' }).row);
  assert.equal(validateSoundBeatSession(future, context), null);
});

test('a delivered response requires an actual earlier receipt for the same authored unit', () => {
  const { value, context } = fixture();
  for (const rows of [value.evidence.firstResponses, value.evidence.acceptedResponses]) rows[0].deliveryAtResponse = 'delivered';
  assert.equal(validateSoundBeatSession(value, context), null);
  value.evidence.audioReceipts.push({ stage: 0, task: 0, beat: 0, kind: 'unit', src: '/audio/phonemes/s.mp3', at: 9 });
  for (const rows of [value.evidence.firstResponses, value.evidence.acceptedResponses]) rows[0].deliveryReceipt = structuredClone(value.evidence.audioReceipts[0]);
  assert.ok(validateSoundBeatSession(value, context));
  value.evidence.audioReceipts[0].at = 11;
  assert.equal(validateSoundBeatSession(value, context), null);
});

test('a late first response and supported retry are distinct; supplied-note tapping never promotes encoding mastery', () => {
  const item = soundBeatLadder('easy', 7)[0].items[0];
  let evidence = newSoundBeatEvidence();
  evidence = soundBeatResponse(evidence, item, { stage: 0, task: 0, beat: 0, lane: item.lanes[0], deltaMs: 900, quality: 'MISS', delivery: 'delivered' }).evidence;
  evidence = soundBeatResponse(evidence, item, { stage: 0, task: 0, beat: 0, lane: item.lanes[0], deltaMs: 0, quality: 'GOOD', delivery: 'delivered', supportReasons: ['timing-mercy'] }).evidence;
  assert.equal(evidence.firstResponses[0].correct, false);
  assert.equal(evidence.assistedRetries.length, 1);
  assert.equal(evidence.acceptedResponses.length, 1);
  for (const row of [...evidence.firstResponses, ...evidence.assistedRetries]) {
    assert.equal(row.independentEncodingPractice, false);
    assert.equal(row.independentRhythmPractice, false);
    assert.equal(row.wordVisible, false);
  }
  const receipt = { stage: 0, task: 0, beat: 0, kind: 'unit', src: '/audio/phonemes/s.mp3', at: 9 };
  const fresh = soundBeatResponse(newSoundBeatEvidence(), item, { stage: 0, task: 0, beat: 0, lane: item.lanes[0], deltaMs: 0, quality: 'PERFECT', delivery: 'delivered', deliveryReceipt: receipt }).row;
  assert.equal(fresh.independentRhythmPractice, true);
  assert.equal(fresh.independentEncodingPractice, false);
});
