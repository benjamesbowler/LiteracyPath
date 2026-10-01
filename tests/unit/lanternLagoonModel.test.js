import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { LANTERN_READING_SCENES, LANTERN_SUPPORTED_SCENES } from '../../src/data/lanternLagoonContent.js';
import { LANTERN_ASSETS } from '../../src/data/lanternLagoonAssets.js';
import { appendLanternRetry, appendLanternSupport, buildLanternLagoonDeck, isLanternSavedSessionValid, isLanternSentenceReadable, lanternChoiceDescription, lanternResponse, lanternSentenceRecording, LANTERN_EVIDENCE_HISTORY_LIMIT, newLanternEvidence } from '../../src/utils/lanternLagoonModel.js';
import { createLanternVoice } from '../../src/utils/lanternLagoonVoice.js';

test('every authored message has exactly one whole-sentence match and meaningful same-animal/feature contrasts', () => {
  const bank = [...LANTERN_READING_SCENES, ...LANTERN_SUPPORTED_SCENES];
  assert.equal(new Set(bank.map(scene => scene.id)).size, bank.length);
  assert.ok(bank.length >= 36);
  function matches(choice, sentence) {
    const text = sentence.toLowerCase().replace(/[,.]/gu, '');
    const relation = `the ${choice.species} is ${choice.relation} the ${choice.object}`;
    const action = `the ${choice.species} is ${choice.action}`;
    if (choice.companion) return text === `${relation} and ${lanternChoiceDescription(choice.companion).toLowerCase().replace(/[.]/gu, '')}`;
    if (choice.action !== 'sitting') return text === action || (choice.object !== 'grass' && [ `${action} ${choice.relation} the ${choice.object}`, `${action} and it is ${choice.relation} the ${choice.object}` ].includes(text));
    return text === relation;
  }
  for (const scene of bank) {
    assert.equal(scene.choices.length, 3, scene.id);
    assert.equal(scene.choices.filter(choice => matches(choice, scene.sentence)).length, 1, scene.id);
    assert.ok(matches(scene.choices[scene.answer], scene.sentence), scene.id);
    assert.equal(new Set(scene.choices.map(lanternChoiceDescription)).size, 3, scene.id);
    assert.ok(scene.choices.filter(choice => choice.species === scene.choices[scene.answer].species).length >= 2, scene.id);
  }
});

test('independent print uses confirmed EL code/HFW, never component-letter guesses or difficulty promotion', () => {
  for (const cycle of [null, 1, 4, 9]) assert.equal(isLanternSentenceReadable('The cat is on the mat.', cycle), false);
  assert.equal(isLanternSentenceReadable('The cat is on the mat.', 10), true);
  assert.equal(isLanternSentenceReadable('The cat is in the box.', 10), false);
  assert.equal(isLanternSentenceReadable('The cat is in the box.', 11), true);
  assert.equal(isLanternSentenceReadable('The hen is in the pen.', 11), false);
  assert.equal(isLanternSentenceReadable('The hen is in the pen.', 12), true);
  for (const sentence of ['The duck is under the bridge.', 'The rabbit is sleeping.', 'The cat is beside the mat.']) assert.equal(isLanternSentenceReadable(sentence, 27), false);
  for (const difficulty of ['easy', 'medium', 'hard']) for (const taughtCycle of [10, 11, 12, 27]) {
    const deck = buildLanternLagoonDeck({ taughtCycle, difficulty });
    assert.equal(deck.mode, 'reading'); assert.ok(deck.rounds.length >= 4);
    assert.ok(deck.rounds.every(scene => isLanternSentenceReadable(scene.sentence, taughtCycle)));
  }
});

test('unknown/early code defaults to genuine recorded listening; supported bridge and increasing bands remain available', () => {
  const deck = buildLanternLagoonDeck();
  assert.equal(deck.mode, 'listening'); assert.equal(deck.rounds.length, 8);
  for (const round of deck.rounds) assert.ok(round.audioPath && fs.existsSync(`public${round.audioPath}`));
  const allScenes = [...LANTERN_READING_SCENES, ...LANTERN_SUPPORTED_SCENES];
  assert.equal(new Set(allScenes.map(scene => lanternSentenceRecording(scene.sentence))).size, 30);
  assert.ok(allScenes.every(scene => lanternSentenceRecording(scene.sentence)));
  const heard = new Set();
  for (let seed = 1; seed <= 50; seed++) for (const round of buildLanternLagoonDeck({ mode: 'listening', sessionSeed: seed }).rounds) heard.add(round.sentence);
  assert.ok(heard.size >= 24, `entry listening has ${heard.size} distinct whole sentences`);
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const supported = buildLanternLagoonDeck({ difficulty, mode: 'together', sessionSeed: 91 });
    assert.equal(supported.rounds[0].id, 'duck-under-bridge');
    assert.equal(Math.max(...supported.rounds.map(scene => scene.band)), difficulty === 'hard' ? 4 : difficulty === 'medium' ? 3 : 2);
    const listening = buildLanternLagoonDeck({ difficulty, mode: 'listening', sessionSeed: 91 });
    assert.equal(Math.max(...listening.rounds.map(scene => scene.band)), difficulty === 'hard' ? 4 : difficulty === 'medium' ? 3 : 2);
    assert.ok(listening.rounds.every(scene => fs.existsSync(`public${scene.audioPath}`)));
  }
});

test('repeated help retains bounded history plus truthful cumulative support count', () => {
  let evidence = newLanternEvidence(buildLanternLagoonDeck(), 2);
  for (let index = 0; index < 600; index++) evidence = appendLanternSupport(evidence, { kind: 'mission-help', index });
  assert.equal(evidence.supportEvents.length, LANTERN_EVIDENCE_HISTORY_LIMIT);
  assert.equal(evidence.totalSupportEvents, 600); assert.equal(evidence.supportEvents.at(-1).index, 599);
  assert.deepEqual(evidence.firstResponses, []);
  const first = { correct: false, independent: true }; evidence.firstResponses.push(first);
  for (let index = 0; index < 600; index++) evidence = appendLanternRetry(evidence, { attempt: index + 1, independent: false });
  assert.equal(evidence.totalRetries, 600); assert.equal(evidence.assistedRetries.length, LANTERN_EVIDENCE_HISTORY_LIMIT);
  assert.equal(evidence.assistedRetries.at(-1).attempt, 600); assert.deepEqual(evidence.firstResponses, [first]);
});

test('seed/chapter reproduce full rebuilt choices, vary ordering and preserve answer truth without answer decoration', () => {
  const options = { difficulty: 'hard', taughtCycle: 12, sessionSeed: 733, journey: { index: 3 } };
  assert.deepEqual(buildLanternLagoonDeck(options), buildLanternLagoonDeck(options));
  assert.notDeepEqual(buildLanternLagoonDeck(options), buildLanternLagoonDeck({ ...options, sessionSeed: 734 }));
  assert.notDeepEqual(buildLanternLagoonDeck(options), buildLanternLagoonDeck({ ...options, journey: { index: 4 } }));
  const answerSlots = new Set();
  for (let seed = 1; seed <= 30; seed++) for (const scene of buildLanternLagoonDeck({ ...options, sessionSeed: seed }).rounds) {
    assert.equal(scene.choices.filter(choice => choice.id === scene.answerId).length, 1);
    answerSlots.add(scene.choices.findIndex(choice => choice.id === scene.answerId));
    assert.ok(scene.choices.every(choice => !('correct' in choice) && !('glow' in choice)));
  }
  assert.deepEqual([...answerSlots].sort(), [0, 1, 2]);
});
test('resume requires intact local support history, real seeded answer truth, and current confirmed print eligibility', () => {
  const options = { taughtCycle: 10, sessionSeed: 49, journey: { index: 1 } }, deck = buildLanternLagoonDeck(options);
  const snapshot = { deck, seed: 49, journeyIndex: 1, round: 0, phase: 'active', attempts: 0, selectedId: null, support: [], modelled: false, audioDelivery: 'not_requested', evidence: newLanternEvidence(deck, 49), score: 0 };
  assert.equal(isLanternSavedSessionValid(snapshot, options), true);
  assert.equal(isLanternSavedSessionValid(snapshot, { ...options, taughtCycle: 12 }), true);
  assert.equal(isLanternSavedSessionValid(snapshot, { ...options, taughtCycle: 9 }), false);
  assert.equal(isLanternSavedSessionValid(snapshot, { ...options, journey: { index: 2 } }), false);
  for (const mutate of [value => { delete value.support; }, value => { delete value.evidence; }, value => { delete value.evidence.supportEvents; }, value => { value.deck.rounds[0].answerId = value.deck.rounds[0].choices.find(choice => choice.id !== value.deck.rounds[0].answerId).id; }, value => { value.attempts = 1; }, value => { value.phase = 'correct'; }]) {
    const invalid = structuredClone(snapshot); mutate(invalid); assert.equal(isLanternSavedSessionValid(invalid, options), false);
  }
  const wrong = deck.rounds[0].choices.find(choice => choice.id !== deck.rounds[0].answerId);
  const afterError = { ...snapshot, attempts: 1, selectedId: wrong.id, evidence: { ...snapshot.evidence, firstResponses: [lanternResponse(deck.rounds[0], wrong.id)] } };
  assert.equal(isLanternSavedSessionValid(afterError, options), true);
});

test('first response, replay, partial/failed/off audio, guide, adult support, retries and modelling cannot create independent claims', () => {
  const round = buildLanternLagoonDeck({ taughtCycle: 10 }).rounds[0];
  assert.equal(lanternResponse(round, round.answerId).independent, true);
  for (const options of [{ replayUsed: true }, { attempt: 1 }, { modelUsed: true }, { supportUsed: ['mission-help'] }, { supportUsed: ['resume_without_support_record'] }, ...['requested', 'playing', 'ended', 'unavailable', 'sound_off'].map(audioDelivery => ({ audioDelivery }))]) {
    const response = lanternResponse(round, round.answerId, options);
    assert.equal(response.independent, false); assert.equal(response.practiceOnly, true);
    assert.ok(Object.isFrozen(response)); assert.ok(Object.isFrozen(response.supportUsed));
  }
  assert.equal(lanternResponse(round, round.answerId, { audioDelivery: 'ended' }).responseMode, 'listening_supported');
  assert.deepEqual(lanternResponse(round, round.answerId, { supportUsed: ['mission-help'] }).supportUsed, ['mission-help']);
  const supported = buildLanternLagoonDeck({ mode: 'together' });
  assert.equal(lanternResponse(supported.rounds[0], supported.rounds[0].answerId).responseMode, 'adult_supported');
  assert.equal(newLanternEvidence(supported, 1).formalAssessment, false);
});

test('all selected runtime art is optimized, exactly traceable, with complete tracked sources', () => {
  for (const asset of Object.values(LANTERN_ASSETS)) {
    assert.ok(asset.bytes < 350000, asset.path);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`public${asset.path}`)).digest('hex'), asset.sha256);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(asset.source)).digest('hex'), asset.sourceSha256);
    assert.ok(fs.statSync(asset.source).size < 5 * 1024 * 1024);
    if (!asset.path.includes('horizon')) assert.equal(asset.alpha, true);
  }
});

class TestAudio extends EventTarget {
  static instances = [];
  constructor(src) { super(); this.src = src; this.paused = true; this.plays = 0; TestAudio.instances.push(this); }
  play() { this.paused = false; this.plays++; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
  pause() { this.paused = true; }
}
test('sentence owner waits for real ended, pauses/resumes exact clip and cancellation resolves without false delivery', async () => {
  const delivery = []; const owner = createLanternVoice('/recorded.mp3', { AudioClass: TestAudio, onDelivery: status => delivery.push(status) });
  const audio = TestAudio.instances.at(-1); let resolved = false; owner.promise.then(() => { resolved = true; });
  await Promise.resolve(); assert.equal(resolved, false);
  owner.pause(); assert.equal(audio.paused, true); assert.equal(owner.active, true);
  owner.resume(); assert.equal(audio.paused, false); assert.equal(audio.plays, 2);
  audio.dispatchEvent(new Event('ended')); assert.equal(await owner.promise, 'ended');
  assert.deepEqual(delivery, ['playing', 'playing', 'ended']);
  const cancelled = createLanternVoice('/another.mp3', { AudioClass: TestAudio }); cancelled.cancel();
  assert.equal(await cancelled.promise, 'cancelled'); assert.equal(TestAudio.instances.at(-1).paused, true);
});
test('unavailable recordings never report delivery or use browser synthesis', async () => {
  class FailingAudio extends TestAudio { play() { return Promise.reject(new Error('blocked')); } }
  const delivery = []; const owner = createLanternVoice('/missing.mp3', { AudioClass: FailingAudio, onDelivery: status => delivery.push(status) });
  assert.equal(await owner.promise, 'unavailable'); assert.deepEqual(delivery, ['unavailable']);
});

function fakeClock() {
  let time = 0, serial = 0; const tasks = new Map();
  return { now: () => time, schedule: (fn, ms) => { const id = ++serial; tasks.set(id, { at: time + ms, fn }); return id; }, clear: id => tasks.delete(id),
    tick(ms) { const end = time + ms; while (true) { const next = [...tasks].filter(([, value]) => value.at <= end).sort((a, b) => a[1].at - b[1].at)[0]; if (!next) break; tasks.delete(next[0]); time = next[1].at; next[1].fn(); } time = end; } };
}
test('actual long duration is never cut at loading deadline; missing ended and stalled progress terminate honestly', async () => {
  const clock = fakeClock();
  class LongAudio extends TestAudio { constructor(src) { super(src); this.duration = 40; this.currentTime = 0; this.playbackRate = 1; } }
  const delivery = []; const voice = createLanternVoice('/long.mp3', { AudioClass: LongAudio, ...clock, onDelivery: value => delivery.push(value) });
  const audio = TestAudio.instances.at(-1);
  clock.tick(15001); assert.equal(voice.active, true);
  audio.currentTime = 15; audio.dispatchEvent(new Event('timeupdate'));
  clock.tick(26998); assert.equal(voice.active, true);
  clock.tick(2); assert.equal(await voice.promise, 'unavailable'); assert.equal(audio.paused, true);
  assert.ok(!delivery.includes('ended'));
});
test('late playing cancels loading watchdog and metadata watchdog freezes through a long pause', async () => {
  const clock = fakeClock();
  class LateAudio extends TestAudio { constructor(src) { super(src); this.duration = 7; this.currentTime = 0; } play() { this.paused = false; this.plays++; return Promise.resolve(); } }
  const voice = createLanternVoice('/late.mp3', { AudioClass: LateAudio, ...clock });
  const audio = TestAudio.instances.at(-1);
  clock.tick(14000); audio.dispatchEvent(new Event('playing'));
  clock.tick(2000); assert.equal(voice.active, true); voice.pause(); clock.tick(120000); assert.equal(voice.active, true);
  voice.resume(); clock.tick(6999); assert.equal(voice.active, true);
  audio.dispatchEvent(new Event('ended')); assert.equal(await voice.promise, 'ended');
});
test('duplicate stalled timeupdate events cannot keep a missing-ended recording alive forever', async () => {
  const clock = fakeClock();
  class StalledAudio extends TestAudio { constructor(src) { super(src); this.duration = 1; this.currentTime = 1; } }
  const voice = createLanternVoice('/stalled-progress.mp3', { AudioClass: StalledAudio, ...clock });
  const audio = TestAudio.instances.at(-1);
  for (let second = 0; second < 5; second++) { clock.tick(1000); audio.dispatchEvent(new Event('timeupdate')); audio.dispatchEvent(new Event('playing')); }
  assert.equal(await voice.promise, 'unavailable'); assert.equal(audio.paused, true);
});
test('loading without playing fails finitely, and cancelled stale ended cannot overwrite status', async () => {
  const clock = fakeClock();
  class SilentAudio extends TestAudio { play() { return Promise.resolve(); } }
  const statuses = []; const voice = createLanternVoice('/stall.mp3', { AudioClass: SilentAudio, ...clock, onDelivery: status => statuses.push(status) });
  const audio = TestAudio.instances.at(-1); clock.tick(15000);
  assert.equal(await voice.promise, 'unavailable'); audio.dispatchEvent(new Event('ended')); assert.deepEqual(statuses, ['unavailable']);
  const cancelClock = fakeClock(); const cancelled = createLanternVoice('/cancel.mp3', { AudioClass: TestAudio, ...cancelClock, onDelivery: status => statuses.push(status) });
  cancelled.cancel(); clock.tick(300000); TestAudio.instances.at(-1).dispatchEvent(new Event('ended'));
  assert.equal(await cancelled.promise, 'cancelled'); assert.equal(statuses.at(-1), 'cancelled');
});

test('owned narration ducks only actual speech and restores its mix on pause, failure, ended and cancel', async () => {
  const clock = fakeClock(), mix = [];
  class HeldStartAudio extends TestAudio { play() { this.paused = false; return Promise.resolve(); } }
  const options = { AudioClass: HeldStartAudio, ...clock, duckMusic: () => mix.push('duck'), restoreMusic: () => mix.push('restore') };
  const voice = createLanternVoice('/mix.mp3', options), audio = TestAudio.instances.at(-1);
  assert.deepEqual(mix, []); audio.dispatchEvent(new Event('playing')); assert.deepEqual(mix, ['duck']);
  audio.dispatchEvent(new Event('playing')); assert.deepEqual(mix, ['duck']);
  voice.pause(); assert.deepEqual(mix, ['duck', 'restore']);
  audio.dispatchEvent(new Event('playing')); assert.equal(audio.paused, true); assert.deepEqual(mix, ['duck', 'restore']);
  voice.resume(); assert.deepEqual(mix, ['duck', 'restore']); audio.dispatchEvent(new Event('playing'));
  assert.deepEqual(mix, ['duck', 'restore', 'duck']); audio.dispatchEvent(new Event('ended'));
  assert.equal(await voice.promise, 'ended'); assert.deepEqual(mix, ['duck', 'restore', 'duck', 'restore']);
  voice.cancel(); assert.equal(mix.length, 4);
  for (const terminal of ['cancel', 'error']) {
    const owner = createLanternVoice('/next.mp3', options); TestAudio.instances.at(-1).dispatchEvent(new Event('playing'));
    if (terminal === 'cancel') owner.cancel(); else TestAudio.instances.at(-1).dispatchEvent(new Event('error'));
    assert.equal(await owner.promise, terminal === 'cancel' ? 'cancelled' : 'unavailable');
    assert.deepEqual(mix.slice(-2), ['duck', 'restore']);
  }
});
test('replay owners have distinct mix tokens and a cancelled recording releases only its own token', async () => {
  const events = []; const options = { AudioClass: TestAudio, duckMusic: token => events.push(['duck', token]), restoreMusic: token => events.push(['restore', token]) };
  const first = createLanternVoice('/first.mp3', options), second = createLanternVoice('/second.mp3', options);
  const firstToken = events[0][1], secondToken = events[1][1]; assert.notEqual(firstToken, secondToken);
  first.cancel(); assert.deepEqual(events.at(-1), ['restore', firstToken]);
  second.pause(); assert.deepEqual(events.at(-1), ['restore', secondToken]);
  second.resume(); assert.deepEqual(events.at(-1), ['duck', secondToken]);
  TestAudio.instances.at(-1).dispatchEvent(new Event('ended')); assert.equal(await second.promise, 'ended');
  assert.deepEqual(events.at(-1), ['restore', secondToken]); assert.equal(await first.promise, 'cancelled');
});
