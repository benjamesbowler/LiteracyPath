import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';
import { createWordBridgeCue } from '../../src/components/learn/games/games/wordBridgeCue.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

const source = fs.readFileSync('src/components/learn/games/games/WordBridgeGame.jsx', 'utf8');
const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
const engine = ast.program.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'startGame');
const productionFunctions = ['pause', 'resume', 'resumeInterruptedTarget', 'persistPractice'].map(name => {
  const node = engine.body.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === name);
  assert(node, 'Exercise the actual production lifecycle function');
  return source.slice(node.start, node.end);
}).join('\n');
function lifecycle() {
  let enabled = true;
  const calls = [], round = { target: 'pen', audio: getLedaWordAudioPath('pen'), isSentence: false };
  const cue = createWordBridgeCue({ getSound: () => enabled, duckMusic() {}, restoreMusic() {},
    speakWord(target, options) { return new Promise(resolve => calls.push({ target, options, resolve })); } });
  const state = vm.createContext({ cue, opts: { getSound: () => enabled }, paused: false, onboarding: false,
    phase: 'PLAYING', saveHeld: false, document: { hidden: false }, stepRemainder: .009, resultDwell: null,
    performance: { now: () => 100 }, last: 0, persisted: 0, cleared: 0, loops: 0,
    currentLevel: {}, builder: {}, pendingPracticeSnapshot: null, pendingCompletion: false, sincePracticeSave: 0,
    difficulty: 'easy', contentVersion: 'word-bridge-v3', overlay: { style: {} }, saveAllowed: true,
    practiceSnapshot: () => ({ captured: true }),
    saveWordBridgePracticeSession() { state.persisted++; return { localSaved: state.saveAllowed }; },
    showOverlay(title, message, label, retry) { state.retry = retry; }, finishGame() { assert.fail('No invented completion'); },
    clearHeldControls() { state.cleared++; },
    ensureLoop() { state.loops++; }, speakTarget() { return cue.play(round); } });
  vm.runInContext(productionFunctions, state);
  return { state, cue, round, calls, mute() { enabled = false; }, play: () => state.speakTarget() };
}

test('actual Bridge pause aborts an opening cue; ordinary resume requests the exact target again and rejects its old late end', async () => {
  const owner = lifecycle(), first = owner.play(), old = owner.calls[0];
  old.options.onStart(); owner.state.pause();
  assert.equal(old.options.signal.aborted, true); assert.equal(owner.cue.snapshot().delivery, 'unavailable');
  assert.equal(owner.state.paused, true); assert.equal(owner.state.persisted, 1); assert.equal(owner.state.cleared, 1);
  owner.state.resume(); assert.equal(owner.state.paused, false); assert.equal(owner.state.stepRemainder, 0);
  assert.equal(owner.calls.length, 2, 'a real resume restarts the interrupted exact recorded cue');
  const current = owner.calls[1]; assert.equal(current.target, 'pen'); assert.equal(current.options.signal.aborted, false);
  old.options.onEnd(owner.round.audio); old.resolve(); await first;
  assert.equal(owner.cue.snapshot().delivery, 'pending', 'a stopped earlier generation cannot count delivered');
  current.options.onStart(); current.options.onEnd(owner.round.audio); current.resolve(); await Promise.resolve();
  assert.equal(owner.cue.snapshot().deliveryReceipt.source, owner.round.audio); owner.cue.dispose();
});

test('actual ordinary resume preserves an already ended cue and respects sound-off, hidden, save-held and onboarding ownership', async () => {
  const ended = lifecycle(), playing = ended.play(), clip = ended.calls[0]; clip.options.onEnd(ended.round.audio); clip.resolve(); await playing;
  ended.state.pause(); ended.state.resume(); assert.equal(ended.calls.length, 1); ended.cue.dispose();
  for (const condition of ['muted', 'hidden', 'save', 'onboarding']) {
    const owner = lifecycle(), pending = owner.play(); owner.state.pause();
    if (condition === 'muted') owner.mute();
    if (condition === 'hidden') owner.state.document.hidden = true;
    if (condition === 'save') owner.state.saveHeld = true;
    if (condition === 'onboarding') owner.state.onboarding = true;
    owner.state.resume(); assert.equal(owner.calls.length, 1, condition + ' cannot start teaching audio');
    owner.calls[0].resolve(); await pending; owner.cue.dispose();
  }
});

test('actual Bridge resume retains the existing feedback dwell resume path without a second ordinary cue request', () => {
  const owner = lifecycle(), events = [];
  owner.state.resultDwell = { active: true, pause() { events.push('pause'); }, waitFor(promise) { assert(promise?.then); events.push('wait'); }, resume() { events.push('resume'); } };
  owner.state.pause(); owner.state.resume(); assert.deepEqual(events, ['pause', 'wait', 'resume']);
  assert.equal(owner.calls.length, 1); owner.calls[0].resolve(); owner.cue.dispose();
});


test('actual failed-save callback restarts an interrupted current cue only after genuine local-save success', async () => {
  const owner = lifecycle(), first = owner.play(), old = owner.calls[0]; old.options.onStart();
  owner.state.saveAllowed = false; assert.equal(owner.state.persistPractice(), false);
  assert.equal(owner.state.saveHeld, true); assert.equal(old.options.signal.aborted, true);
  owner.state.resumeInterruptedTarget(); assert.equal(owner.calls.length, 1, 'no voice while save holding');
  owner.state.retry(); assert.equal(owner.state.saveHeld, true); assert.equal(owner.calls.length, 1, 'failed retry does not play');
  owner.state.saveAllowed = true; owner.state.retry();
  assert.equal(owner.state.saveHeld, false); assert.equal(owner.calls.length, 2); assert.equal(owner.state.pendingPracticeSnapshot, null);
  old.options.onEnd(owner.round.audio); old.resolve(); await first;
  assert.equal(owner.cue.snapshot().delivery, 'pending'); const current = owner.calls[1];
  current.options.onEnd(owner.round.audio); current.resolve(); await Promise.resolve();
  assert.equal(owner.cue.snapshot().delivery, 'delivered'); owner.cue.dispose();
});
