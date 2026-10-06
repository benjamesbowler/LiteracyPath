import test from 'node:test';
import assert from 'node:assert/strict';
import { createRocketApproachCue } from '../../src/utils/rocketRunApproachCue.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { newRocketRunEvidence } from '../../src/utils/rocketRunEvidence.js';

function fixture({ getSpeed } = {}) {
  const state = { round: 0, seed: 127, foregroundElapsed: 0, paused: false, completed: false,
    flight: { stopped: false }, evidence: newRocketRunEvidence(),
    carriers: [{ trialId: 'map', flightId: 1, word: 'map', z: -18, alive: true, passed: false,
      visible: true, readable: true, approachSpoken: false }] };
  let muted = false, blocked = false, highlight = null;
  const calls = [], events = [];
  const cue = createRocketApproachCue({ getState: () => state, getPlan: () => ({ round: 0, target: 'm' }),
    getSound: () => !muted, getBlocked: () => blocked, wordDuration: () => 1, getSpeed,
    setHighlight: value => { highlight = value; }, onEvent: event => events.push(event),
    speakWord(word, options) {
      let settle;
      const playback = new Promise(resolve => { settle = resolve; });
      calls.push({ word, options, settle }); return playback;
    } });
  return { state, cue, calls, events, highlight: () => highlight,
    mute: () => { muted = true; }, block: value => { blocked = value; } };
}

test('approach recomputes actual TTC after speed changes and records start/end only through their callbacks', async () => {
  const f = fixture(); f.cue.sync(11); assert.equal(f.calls.length, 0);
  f.cue.sync(19); assert.equal(f.calls.length, 1); assert.equal(f.highlight(), null);
  assert.equal(f.state.evidence.audioStarts.length, 0); assert.equal(f.state.evidence.audioReceipts.length, 0);
  assert.equal(f.events[0].z, -18); assert.equal(f.events[0].speed, 19);
  assert.equal(f.events[0].ttc, 16.2 / 19);
  f.state.foregroundElapsed = .2; f.calls[0].options.onStart(); f.calls[0].options.onStart();
  assert.equal(f.highlight(), 1); assert.equal(f.state.evidence.audioStarts.length, 1);
  f.state.foregroundElapsed = 1.2;
  f.calls[0].options.onEnd('/audio/invented.mp3'); assert.equal(f.state.evidence.audioReceipts.length, 0);
  f.calls[0].options.onEnd(getLedaWordAudioPath('map')); f.calls[0].settle(); await Promise.resolve(); await Promise.resolve();
  assert.equal(f.state.evidence.audioReceipts.length, 1);
  assert.equal(f.state.evidence.audioReceipts[0].at, 1.2);
  assert.equal(f.state.evidence.audioReceipts[0].flightId, 1);
  f.cue.dispose();
});

test('actual onset records callback-time position/current speed and cannot deliver after the collision plane', () => {
  let speed = 19;
  const f = fixture({ getSpeed: () => speed }); f.cue.sync(speed);
  f.state.carriers[0].z = -9; speed = 8;
  f.calls[0].options.onStart();
  const receipt = f.state.evidence.audioStarts[0];
  assert.equal(receipt.physicalApproach.z, -9); assert.equal(receipt.physicalApproach.speed, 8);
  assert.equal(receipt.physicalApproach.ttc, 7.2 / 8);
  assert.equal(receipt.flightId, 1); assert.equal(f.highlight(), 1);
  f.state.carriers[0].z = -1.7;
  f.calls[0].options.onEnd(getLedaWordAudioPath('map'));
  assert.equal(f.state.evidence.audioReceipts.length, 0, 'a late end beyond the real contact plane cannot claim near-word delivery');
  f.cue.sync(speed); assert.equal(f.calls[0].options.signal.aborted, true);
  f.cue.dispose(); f.calls[0].settle();
});

test('pause cancels pending ownership and preserves a real start without fabricating a late end', () => {
  const f = fixture(); f.state.carriers[0].z = -12; f.cue.sync(11);
  f.calls[0].options.onStart(); f.state.paused = true; f.cue.sync(11);
  assert.equal(f.calls[0].options.signal.aborted, true); assert.equal(f.highlight(), null);
  f.calls[0].options.onEnd(getLedaWordAudioPath('map'));
  assert.equal(f.state.evidence.audioStarts.length, 1); assert.equal(f.state.evidence.audioReceipts.length, 0);
  assert.equal(f.state.carriers[0].approachSpoken, false);
  f.state.paused = false; f.cue.sync(11); assert.equal(f.calls.length, 2);
  f.calls[0].options.onStart(); assert.equal(f.state.evidence.audioStarts.length, 1);
  f.cue.dispose(); f.calls.forEach(call => call.settle());
});

test('passage, a hidden resized plaque, mute, replay priority and a new outing cannot deliver an obsolete carrier', () => {
  for (const change of [f => { f.state.carriers[0].passed = true; }, f => f.mute(),
    f => f.block(true), f => { f.state.seed = 128; },
    f => { f.state.carriers[0].visible = false; }, f => { f.state.carriers[0].readable = false; }]) {
    const f = fixture(); f.state.carriers[0].z = -12; f.cue.sync(11);
    change(f); f.calls[0].options.onStart(); f.calls[0].options.onEnd(getLedaWordAudioPath('map'));
    assert.equal(f.state.evidence.audioStarts.length, 0); assert.equal(f.state.evidence.audioReceipts.length, 0);
    f.cue.sync(11); assert.equal(f.calls[0].options.signal.aborted, true);
    f.cue.dispose(); f.calls.forEach(call => call.settle());
  }
});

test('inspection and event observation cannot mutate active ownership', () => {
  const f = fixture(); f.state.carriers[0].z = -12; f.cue.sync(11);
  const observed = f.cue.inspect(); observed.owner.word = 'changed'; observed.lastEvent.flightId = 999;
  assert.equal(f.cue.inspect().owner.word, 'map'); assert.equal(f.cue.inspect().lastEvent.flightId, 1);
  f.events[0].word = 'changed'; f.calls[0].options.onStart();
  assert.equal(f.state.evidence.audioStarts[0].word, 'map');
  f.cue.dispose(); f.calls[0].settle();
});
