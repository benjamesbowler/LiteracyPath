import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordClimbCue } from '../../src/components/learn/games/games/wordClimbCue.js';
import { phonemeAudioCandidates } from '../../src/data/phonemeAudioBank.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

function ownedPlayback() {
  const calls = [], owners = new Set(), releases = [];
  const speaker = (value, options) => new Promise((resolve, reject) => calls.push({ value, options, resolve, reject }));
  const cue = createWordClimbCue({ speak: speaker, speakFeedback: speaker, now: () => 60,
    duckMusic: owner => owners.add(owner), restoreMusic: owner => { releases.push(owner); owners.delete(owner); } });
  return { cue, calls, owners, releases };
}

test('Climb criterion cue requires matching ended recording and returns an immutable receipt copy', async () => {
  const source = phonemeAudioCandidates('f')[0];
  const cue = createWordClimbCue({ speak: async (_, { onEnd }) => onEnd(source), getSound: () => true, now: () => 20 });
  await cue.play('f');
  assert.deepEqual(cue.snapshot(), { target: 'f', delivery: 'delivered', deliveryReceipt: { source, endedAt: 20 } });
  const view = cue.snapshot(); view.deliveryReceipt.source = '/wrong.mp3';
  assert.equal(cue.snapshot().deliveryReceipt.source, source); cue.dispose();
});

test('Climb late aborted, silent promise and unrelated recording cannot create delivered audio', async () => {
  let finish, options;
  const cue = createWordClimbCue({ speak: (_, value) => { options = value; return new Promise(resolve => { finish = resolve; }); }, getSound: () => true });
  const playing = cue.play('f'); cue.stop(); options.onEnd(phonemeAudioCandidates('f')[0]); finish(); await playing;
  assert.equal(cue.snapshot().delivery, 'unavailable'); assert.equal(cue.snapshot().deliveryReceipt, null); cue.dispose();
  for (const speak of [async () => {}, async (_, value) => value.onEnd('/not-the-phoneme.mp3')]) {
    const silent = createWordClimbCue({ speak, getSound: () => true }); await silent.play('f'); assert.equal(silent.snapshot().delivery, 'unavailable'); silent.dispose();
  }
  const muted = createWordClimbCue({ speak: () => assert.fail('Sound-off cannot speak'), getSound: () => false }); await muted.play('f'); assert.equal(muted.snapshot().delivery, 'unavailable'); muted.dispose();
});

test('Climb sound toggle retains one cue owner and rejects a late pending receipt before fresh replay', async () => {
  const source=phonemeAudioCandidates('f')[0];let finish,options,calls=0;
  const cue=createWordClimbCue({speak:(_,value)=>{calls++;options=value;return new Promise(resolve=>{finish=resolve;});},now:()=>30});
  const old=cue.play('f');cue.setEnabled(false);options.onEnd(source);finish();await old;
  assert.equal(cue.snapshot().delivery,'unavailable');assert.equal(cue.snapshot().deliveryReceipt,null);
  await cue.play('f');assert.equal(calls,1);
  cue.setEnabled(true);const replay=cue.play('f');options.onEnd(source);finish();await replay;
  assert.equal(calls,2);assert.deepEqual(cue.snapshot().deliveryReceipt,{source,endedAt:30});cue.dispose();
});

test('Climb teaching music ducks on actual start and releases on end before promise settlement', async () => {
  const { cue, calls, owners, releases } = ownedPlayback();
  const source = phonemeAudioCandidates('f')[0], pending = cue.play('f'), clip = calls[0];
  assert.equal(owners.size, 0, 'Loading an instruction does not duck music');
  clip.options.onStart(); clip.options.onStart();
  assert.equal(owners.size, 1);
  assert.deepEqual(cue.mixSnapshot(), { kind: 'target', value: 'f', startedAt: 60, ducked: true });
  clip.options.onEnd(source);
  assert.equal(owners.size, 0); assert.equal(releases.length, 1);
  assert.deepEqual(cue.snapshot().deliveryReceipt, { source, endedAt: 60 });
  clip.options.onStart(); assert.equal(owners.size, 0, 'A terminal clip cannot start the mix again');
  clip.resolve(); await pending;
  assert.equal(releases.length, 1); assert.equal(cue.mixSnapshot().kind, null);
  cue.dispose();
});

test('Climb target replacement and feedback readback abort overlap without stale mix or target credit', async () => {
  const { cue, calls, owners, releases } = ownedPlayback();
  const target = cue.play('f'), previous = calls[0]; previous.options.onStart();
  const readback = cue.playFeedback('day'), current = calls[1];
  assert.equal(previous.options.signal.aborted, true); assert.equal(owners.size, 0);
  current.options.onStart(); const currentOwner = [...owners][0];
  previous.options.onStart(); previous.options.onEnd(phonemeAudioCandidates('f')[0]); previous.resolve(); await target;
  assert.equal(owners.has(currentOwner), true, 'An old finally cannot unduck the replacement');
  assert.equal(releases.length, 1); assert.equal(cue.snapshot().delivery, 'unavailable');
  current.options.onEnd(getLedaWordAudioPath('day')); current.resolve(); await readback;
  assert.equal(owners.size, 0);
  assert.deepEqual(cue.feedbackSnapshot(), { word: 'day', delivery: 'delivered',
    deliveryReceipt: { source: getLedaWordAudioPath('day'), endedAt: 60 } });
  assert.equal(cue.snapshot().deliveryReceipt, null, 'A word readback does not replace the phoneme receipt');
  const copy = cue.feedbackSnapshot(); copy.deliveryReceipt.source = '/changed.mp3';
  assert.equal(cue.feedbackSnapshot().deliveryReceipt.source, getLedaWordAudioPath('day'));
  cue.dispose();
});

test('Climb pause/save abort, sound-off and disposal release only their active voice and reject late ends', async () => {
  for (const stop of [cue => cue.stop(), cue => cue.setEnabled(false), cue => cue.dispose()]) {
    const { cue, calls, owners, releases } = ownedPlayback();
    const pending = cue.playFeedback('day'), clip = calls[0]; clip.options.onStart(); stop(cue);
    assert.equal(clip.options.signal.aborted, true); assert.equal(owners.size, 0); assert.equal(releases.length, 1);
    clip.options.onStart(); clip.options.onEnd(getLedaWordAudioPath('day')); clip.resolve(); await pending;
    assert.equal(owners.size, 0); assert.equal(releases.length, 1);
    assert.equal(cue.feedbackSnapshot().delivery, 'unavailable'); assert.equal(cue.feedbackSnapshot().deliveryReceipt, null);
    cue.dispose();
  }
});

test('Climb failed or silently fulfilled teaching speech cannot retain a duck or invent delivered feedback', async () => {
  for (const finish of [clip => clip.reject(Error('real playback failed')), clip => clip.resolve(),
    clip => { clip.options.onEnd('/unrelated-recording.mp3'); clip.resolve(); }]) {
    const { cue, calls, owners, releases } = ownedPlayback();
    const pending = cue.playFeedback('day'), clip = calls[0]; clip.options.onStart(); finish(clip); await pending;
    assert.equal(owners.size, 0); assert.equal(releases.length, 1);
    assert.equal(cue.feedbackSnapshot().delivery, 'unavailable'); assert.equal(cue.feedbackSnapshot().deliveryReceipt, null);
    cue.dispose();
  }
});

test('Climb delivered criterion survives a separate corrective word, and muted feedback never starts', async () => {
  const { cue, calls, owners } = ownedPlayback();
  const source = phonemeAudioCandidates('f')[0], target = cue.play('f');
  calls[0].options.onStart(); calls[0].options.onEnd(source); calls[0].resolve(); await target;
  const receipt = cue.snapshot();
  const feedback = cue.playFeedback('day'); calls[1].options.onStart(); calls[1].resolve(); await feedback;
  assert.deepEqual(cue.snapshot(), receipt, 'Corrective words preserve the already heard criterion');
  cue.setEnabled(false); await cue.playFeedback('day'); await cue.play('f');
  assert.equal(calls.length, 2); assert.equal(owners.size, 0); cue.dispose();
});
