import test from 'node:test';
import assert from 'node:assert/strict';
import { createRocketTeachingCue, rocketCourierOnsetCue } from '../../src/utils/rocketRunTeachingCue.js';
import { newRocketRunEvidence } from '../../src/utils/rocketRunEvidence.js';
import { phonemeAudioCandidates } from '../../src/data/phonemeAudioBank.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

const flush = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };
function fixture() {
  const state = { round: 0, seed: 127, foregroundElapsed: 0, paused: false, completed: false,
    flight: { stopped: false }, evidence: newRocketRunEvidence(), activeTargetReceipt: null };
  const plan = { round: 0, target: 'm' }, calls = [], support = [], events = [], cancellations = [];
  let sound = true;
  function speak(kind, value, options) {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    calls.push({ kind, value, options, resolve });
    return promise;
  }
  const cue = createRocketTeachingCue({ getState: () => state, getPlan: () => plan,
    getSound: () => sound, onSupport: reason => support.push(reason),
    onEvent: event => events.push(event), cancelApproach: (...args) => cancellations.push(args),
    speakPhoneme: (value, options) => speak('phoneme', value, options),
    speakWord: (value, options) => speak('word', value, options) });
  return { state, plan, calls, cue, support, events, cancellations, mute: () => { sound = false; } };
}

test('only the actual matching phoneme end becomes target delivery; replay remains supported', async () => {
  const f = fixture();
  assert.equal(f.cue.target(), true); assert.equal(f.cue.busy(), true);
  f.calls[0].options.onStart();
  assert.equal(f.state.evidence.audioReceipts.length, 0);
  f.calls[0].options.onEnd('/audio/invented.mp3');
  assert.equal(f.state.activeTargetReceipt, null);
  f.state.foregroundElapsed = .7;
  f.calls[0].options.onEnd(phonemeAudioCandidates('m')[0]);
  f.calls[0].options.onEnd(phonemeAudioCandidates('m')[0]);
  assert.equal(f.state.evidence.audioReceipts.length, 1);
  assert.equal(f.state.activeTargetReceipt.kind, 'target-phoneme');
  assert.equal(f.state.activeTargetReceipt.at, .7);
  f.calls[0].resolve(); await flush(); assert.equal(f.cue.busy(), false);
  assert.equal(f.cue.target({ replay: true }), true);
  assert.deepEqual(f.support, ['target-replay']);
  assert.equal(f.cancellations.at(-1)[0], 'target-replay');
  f.calls[1].resolve(); await flush();
  assert.equal(f.state.evidence.audioReceipts.length, 1, 'a settled-but-undelivered replay invents no end');
  f.cue.dispose();
});

test('contrast waits for each real playback to settle, then replays the target without locking physical input', async () => {
  const f = fixture(); f.cue.contrast('that');
  assert.deepEqual(f.calls.map(call => [call.kind, call.value]), [['word', 'that']]);
  f.state.foregroundElapsed = .4; f.calls[0].options.onEnd(getLedaWordAudioPath('that'));
  assert.equal(f.state.evidence.audioReceipts.length, 0, 'selected-word feedback is not the target cue');
  f.calls[0].resolve(); await flush();
  assert.equal(f.calls[1].value, 'th_voiced');
  f.calls[1].options.onEnd(phonemeAudioCandidates('th_voiced')[0]); f.calls[1].resolve(); await flush();
  assert.equal(f.calls[2].value, 'm');
  f.state.foregroundElapsed = 1.2; f.calls[2].options.onEnd(phonemeAudioCandidates('m')[0]);
  f.calls[2].resolve(); await flush();
  assert.equal(f.state.activeTargetReceipt.at, 1.2);
  assert.deepEqual(f.support, ['contrast-feedback']);
  assert.equal(f.state.paused, false); assert.equal(f.state.flight.stopped, false);
  f.cue.dispose();
});

test('pause, mute, task change, replacement and exit cannot deliver obsolete teaching audio', async () => {
  for (const change of [f => { f.state.paused = true; }, f => f.mute(),
    f => { f.state.seed = 128; }, f => { f.plan.target = 's'; },
    f => f.cue.target({ replay: true }), f => f.cue.dispose()]) {
    const f = fixture(); f.cue.target();
    change(f); f.calls[0].options.onEnd(phonemeAudioCandidates('m')[0]); f.cue.sync();
    assert.equal(f.state.evidence.audioReceipts.length, 0);
    assert.equal(f.calls[0].options.signal.aborted, true);
    f.calls[0].resolve(); await flush();
    f.cue.dispose(); f.calls.slice(1).forEach(call => call.resolve()); await flush();
  }
});

test('missing optional names skip truthfully to the actual onset and target; observations are cloned', async () => {
  const f = fixture(); f.cue.contrast('throat');
  assert.equal(getLedaWordAudioPath('throat'), '');
  await flush(); assert.equal(f.calls[0].value, 'th');
  assert.equal(f.events[0].type, 'teaching-unavailable');
  const snapshot = f.cue.inspect(); snapshot.owner.steps[0].value = 'changed'; snapshot.lastEvent.type = 'changed';
  assert.equal(f.cue.inspect().owner.steps[0].value, 'throat');
  assert.notEqual(f.cue.inspect().lastEvent.type, 'changed');
  f.cue.dispose(); f.calls[0].resolve(); await flush();
});

test('spoken onset feedback handles voiced th, vowel all and qu without falsely reading a first letter', () => {
  assert.equal(rocketCourierOnsetCue('that'), 'th_voiced');
  assert.equal(rocketCourierOnsetCue('all'), 'aw');
  assert.equal(rocketCourierOnsetCue('queen'), 'k');
  assert.equal(rocketCourierOnsetCue('quilt'), 'k');
  assert.equal(rocketCourierOnsetCue('ship'), 'sh');
});

test('optional accepted-word reinforcement works in the final reward without retroactively creating a target receipt', async () => {
  const f = fixture(); f.state.completed = true;
  f.state.evidence.firstResponses.push({ at: .2, deliveryAtResponse: 'pending' });
  assert.equal(f.cue.reinforce('map'), true);
  f.state.foregroundElapsed = .7; f.calls[0].options.onEnd(getLedaWordAudioPath('map'));
  f.calls[0].resolve(); await flush();
  assert.equal(f.state.evidence.audioReceipts.length, 0);
  assert.equal(f.state.evidence.firstResponses[0].deliveryAtResponse, 'pending');
  assert.equal(f.events.at(-1).role, 'accepted-word');
  assert.deepEqual(f.support, []); f.cue.dispose();
});
