import test from 'node:test';
import assert from 'node:assert/strict';
import { soundSafariLadder } from '../../src/utils/soundSafariRounds.js';
import { buildSoundSafariRounds, commitSoundSafariCapture, newSoundSafariEvidence, requestSoundSafariWordReplay } from '../../src/components/learn/games/games/soundSafariLearning.js';
import { createSoundSafariCue } from '../../src/components/learn/games/games/soundSafariCue.js';
import { createSoundSafariCritters, repositionSoundSafariCritters } from '../../src/components/learn/games/games/soundSafariCritters.js';
import { createSoundSafariPracticeSession, validateSoundSafariPracticeSession, restoreSoundSafariPracticeSession,
  saveSoundSafariPracticeSession, loadSoundSafariPracticeSession } from '../../src/components/learn/games/games/soundSafariPracticeSession.js';

const seed = 0xf123abcd, ladder = soundSafariLadder('easy', seed);
const rounds = buildSoundSafariRounds(ladder, 'easy', seed, 0);
const context = { difficulty: 'easy', seed, journeyIndex: 0, originStage: 0, legacyResume: false, supportReasons: {}, width: 1024, height: 768 };

function fixture(evidence = newSoundSafariEvidence(), index = 0) {
  const round = rounds[0], task = { id: `0-0-${round.word}`, item: ladder[0].words[0], index,
    found: round.units.slice(0, index), attempts: [...evidence.firstResponses, ...evidence.assistedRetries]
      .filter(row => row.roundId === round.roundId && row.slot === index && !row.correct).length };
  const rows = [...evidence.firstResponses, ...evidence.assistedRetries].sort((left, right) => left.eventIndex - right.eventIndex);
  let combo = 0, score = 0;
  for (const row of rows) { if (row.correct) { combo++; score += 95 + Math.min(6, combo) * 18; } else combo = 0; }
  const state = { stage: 0, taskIndex: 0, currentTask: task, tasks: [task], ended: false,
    score, combo, correct: evidence.acceptedResponses.length, mistakes: rows.filter(row => !row.correct).length,
    wordsCompleted: evidence.completions.length, presentedUnits: round.units.length, presentedTaskIds: new Set([task.id]),
    pendingAdvance: index === round.units.length, wordClearT: index === round.units.length ? .001 : 0,
    waveSeed: index + 1, time: 12.4,
    net: { x: 870, y: 575, targetX: 700, targetY: 420, angle: -.15, swingDir: -1, swingT: .1 },
    critters: index < round.units.length ? createSoundSafariCritters(round, { difficulty: 'easy', unitSlot: index, waveSeed: index + 1, width: 1024, height: 768 }) : [] };
  return { state, snapshot: createSoundSafariPracticeSession(state, { ...context, evidence }) };
}
const validate = snapshot => validateSoundSafariPracticeSession(snapshot, 'easy', seed, 0, rounds);

test('native Hear replay owns the current cue and persists support through immutable first, retry and partial checkpoint rows', async () => {
  const round = rounds[0], supportReasons = {}, clips = []; let at = 10, playable = true, persisted = 0;
  const cue = createSoundSafariCue({ getSound: () => playable, now: () => at,
    speakWord: (_word, options) => new Promise(resolve => clips.push({ options, resolve })) });
  cue.setRound({ ...round, pictures: [] });
  const replay = () => requestSoundSafariWordReplay({ round, supportReasons, canReplay: () => playable,
    persist: () => { persisted++; }, play: () => cue.play() });
  const firstPlay = replay(), interrupted = clips[0], secondPlay = replay();
  assert.equal(interrupted.options.signal.aborted, true, 'A second native Hear replaces the first voice');
  interrupted.options.onEnd(round.audio); interrupted.resolve(); await firstPlay;
  assert.equal(cue.snapshot().delivery, 'pending', 'A replaced cue end cannot deliver the new replay');
  clips[1].options.onEnd(round.audio); clips[1].resolve(); await secondPlay;
  assert.deepEqual(supportReasons[round.roundId], ['word-audio-replay']); assert.equal(persisted, 2);
  const responseContext = () => ({ ...cue.snapshot(), responseAt: ++at, pictureDelivery: 'unavailable',
    supportReasons: supportReasons[round.roundId] });
  const wrong = commitSoundSafariCapture(newSoundSafariEvidence(), round, 0,
    round.choicesBySlot[0].find(label => label !== round.units[0]), round.choicesBySlot[0], responseContext());
  wrong.evidence.motorEvents.catches++; const firstRows = structuredClone(wrong.evidence.firstResponses);
  const thirdPlay = replay(); clips[2].options.onEnd(round.audio); clips[2].resolve(); await thirdPlay;
  const retry = commitSoundSafariCapture(wrong.evidence, round, 0, round.units[0], round.choicesBySlot[0], responseContext());
  retry.evidence.motorEvents.catches++;
  assert.deepEqual(retry.evidence.firstResponses, firstRows);
  for (const row of [firstRows[0], retry.response]) {
    assert(row.supportReasons.includes('word-audio-replay')); assert.equal(row.independentOrderedSoundPractice, false);
    assert.equal(row.deliveryReceipt.source, round.audio); assert(row.deliveryReceipt.endedAt <= row.responseAt);
  }
  const { state } = fixture(retry.evidence, 1);
  const saved = createSoundSafariPracticeSession(state, { ...context, evidence: retry.evidence, supportReasons });
  const restored = validate(saved); assert(restored);
  assert.deepEqual(restored.evidence.firstResponses, firstRows);
  assert.deepEqual(restored.evidence.assistedRetries, retry.evidence.assistedRetries);
  assert.deepEqual(restored.supportReasons, supportReasons);
  supportReasons[round.roundId].push('later-help');
  assert(!restored.evidence.firstResponses[0].supportReasons.includes('later-help'));
  playable = false; assert.equal(replay(), null); assert.equal(clips.length, 3); assert.equal(persisted, 3);
  cue.dispose();
});
function capture(evidence, slot, selected, at) {
  const next = commitSoundSafariCapture(evidence, rounds[0], slot, selected, rounds[0].choicesBySlot[slot], { responseAt: at });
  next.evidence.motorEvents.catches++; return next.evidence;
}

test('Safari zero cursor keeps the actual net and moving wave under a full uint32 seed without inventing learning', () => {
  const { state } = fixture();
  const animal = state.critters.find(critter => !critter.hidden && critter.travelX > 0);
  animal.x += Math.min(4, animal.travelX); animal.spawnT = .8;
  const raw = createSoundSafariPracticeSession(state, { ...context, evidence: newSoundSafariEvidence() });
  const held = validate(raw); assert.ok(held);
  assert.deepEqual(held.net, raw.net); assert.deepEqual(held.critters, raw.critters); assert.deepEqual(held.evidence.firstResponses, []);
  held.critters[0].x = -500; assert.notEqual(held.critters[0].x, raw.critters[0].x);
  assert.equal(validateSoundSafariPracticeSession(raw, 'easy', seed - 1, 0, rounds), null);
  assert.equal(validateSoundSafariPracticeSession(raw, 'easy', seed, 1, rounds), null);
});

test('Safari real wrong and corrected captures retain immutable first rows and the current ordered sound prefix across reload', () => {
  const wrong = rounds[0].choicesBySlot[0].find(label => label !== rounds[0].units[0]);
  const first = capture(newSoundSafariEvidence(), 0, wrong, 10), firstRows = structuredClone(first.firstResponses);
  const corrected = capture(first, 0, rounds[0].units[0], 20);
  const { state, snapshot } = fixture(corrected, 1), held = validate(snapshot);
  assert.ok(held); assert.equal(held.currentTask.index, 1); assert.deepEqual(held.evidence.firstResponses, firstRows);
  assert.equal(held.evidence.assistedRetries[0].independentOrderedSoundPractice, false);
  assert.equal(restoreSoundSafariPracticeSession(state, held, 1024, 768), true);
  assert.deepEqual(state.currentTask.found, rounds[0].units.slice(0, 1)); assert.deepEqual(state.critters, snapshot.critters);
  assert.deepEqual(state.net, snapshot.net); assert.equal(state.score, 113);
});

test('Safari resize preserves actual moving offsets and caught state rather than spawning a fresh wave', () => {
  const wave = createSoundSafariCritters(rounds[0], { difficulty: 'easy', unitSlot: 0, waveSeed: 1, width: 1024, height: 768 });
  const moving = wave.find(critter => !critter.hidden && critter.travelX > 0);
  moving.x += Math.min(5, moving.travelX); const offset = moving.x - moving.homeX;
  const actual = wave[0]; actual.caught = true;
  repositionSoundSafariCritters(wave, { width: 1200, height: 820, previousWidth: 1024, previousHeight: 768, waveSeed: 1, needed: rounds[0].units[0] });
  assert.equal(actual.caught, true); assert.ok(Math.abs(moving.x - moving.homeX - offset * 1200 / 1024) < 1e-8);
  assert.deepEqual(wave.map(critter => critter.label), rounds[0].choicesBySlot[0]);
});

test('Safari scoped validation rejects credited jumps, altered choices, fake caught animals and overwritten native event order', () => {
  for (const mutate of [snapshot => { snapshot.currentTask.index = 1; snapshot.currentTask.found = rounds[0].units.slice(0, 1); },
    snapshot => { snapshot.correct = 1; }, snapshot => { snapshot.critters[0].label = 'invented'; },
    snapshot => { snapshot.critters[0].caught = true; }, snapshot => { snapshot.ended = true; },
    snapshot => { snapshot.net.x = Infinity; }, snapshot => { snapshot.extra = 'x'.repeat(2000001); }]) {
    const { snapshot } = fixture(); mutate(snapshot); assert.equal(validate(snapshot), null);
  }
  const accepted = capture(newSoundSafariEvidence(), 0, rounds[0].units[0], 10);
  const { snapshot } = fixture(accepted, 1); snapshot.evidence.firstResponses[0].eventIndex = 1;
  assert.equal(validate(snapshot), null);
  const legacy = fixture().snapshot; legacy.originStage = 3; legacy.stage = 3; legacy.legacyResume = true;
  const round = rounds.find(item => item.stage === 3 && item.wordSlot === 0);
  Object.assign(legacy, { currentTask: { index: 0, found: [], attempts: 0 }, combo: 0, presentedUnits: round.units.length,
    presentedTaskIds: [`3-0-${round.word}`], waveSeed: 28,
    critters: createSoundSafariCritters(round, { difficulty: 'easy', unitSlot: 0, waveSeed: 28, width: 1024, height: 768 }) });
  assert.ok(validate(legacy)); assert.deepEqual(legacy.evidence.completions, []);
  legacy.legacyResume = false; assert.equal(validate(legacy), null);
});

test('Safari quota retry keeps the exact child-scoped snapshot and preserves sibling games and another child', () => {
  const previous = globalThis.window, values = new Map(); let denied = false;
  globalThis.window = { localStorage: { getItem: key => values.get(key) || null,
    setItem(key, value) { if (denied) throw new DOMException('full', 'QuotaExceededError'); values.set(key, value); },
    removeItem: key => values.delete(key) } };
  try {
    values.set('literacy-guide-learn-games:safari-child-one', JSON.stringify({ games: { 'letter-leap': { score: 25 } } }));
    const { snapshot } = fixture(); const one = saveSoundSafariPracticeSession('safari-child-one', 'easy', snapshot);
    assert.equal(one.localSaved, true);
    const two = saveSoundSafariPracticeSession('safari-child-two', 'easy', snapshot); assert.equal(two.localSaved, true);
    const before = new Map(values); denied = true;
    const changed = structuredClone(snapshot); changed.time = 40;
    const failed = saveSoundSafariPracticeSession('safari-child-one', 'easy', changed);
    assert.equal(failed.localSaved, false); assert.deepEqual(failed.snapshot, changed); assert.deepEqual(values, before);
    denied = false; assert.equal(saveSoundSafariPracticeSession('safari-child-one', 'easy', failed.snapshot).localSaved, true);
    assert.equal(loadSoundSafariPracticeSession('safari-child-one', 'easy', seed, 0, rounds).time, 40);
    assert.equal(loadSoundSafariPracticeSession('safari-child-two', 'easy', seed, 0, rounds).time, snapshot.time);
    assert.equal(JSON.parse(values.get('literacy-guide-learn-games:safari-child-one')).games['letter-leap'].score, 25);
  } finally { globalThis.window = previous; }
});
