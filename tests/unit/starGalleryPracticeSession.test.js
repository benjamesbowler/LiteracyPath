import test from 'node:test';
import assert from 'node:assert/strict';
import { starGalleryLadder } from '../../src/utils/starGalleryRounds.js';
import { sentenceGroveChoicePositions, SENTENCE_GROVE_MAP_BOUNDS } from '../../src/components/learn/games/games/sentenceGroveLayout.js';
import { buildSentenceGroveRounds, commitSentenceGroveRepair, newSentenceGroveEvidence } from '../../src/components/learn/games/games/starGalleryLearning.js';
import { createSentenceGrovePracticeSession, restoreSentenceGrovePracticeSession, sentenceGroveWorldFitsChapter,
  validateSentenceGrovePracticeSession, loadSentenceGrovePracticeSession, saveSentenceGrovePracticeSession } from '../../src/components/learn/games/games/starGalleryPracticeSession.js';

const rounds = buildSentenceGroveRounds(starGalleryLadder('easy', 3), 'easy', 3, 0);
const point = value => ({ ...value, copy(next) { Object.assign(this, next); return this; } });

function fixture({ stage = 0, itemIndex = 0, originStage = 0, evidence = newSentenceGroveEvidence(), locked = false, legacyResume = false } = {}) {
  const round = rounds[stage * 4 + itemIndex], anchor = { x: 0, z: 66, yaw: Math.PI }, gateSerial = stage * 4 + itemIndex + 1;
  const positions = sentenceGroveChoicePositions(round.choices.length, anchor, gateSerial - 1 + stage * 7 + itemIndex * 3);
  const state = { stage, itemIndex, worldStage: originStage, gateSerial, choiceAnchor: anchor,
    gateLocked: locked, selectedAnswer: locked ? round.acceptedAnswers[0] : '', ended: false,
    score: 210, correct: evidence.completions.length, mistakes: evidence.firstResponses.filter(row => !row.correct).length,
    itemMisses: 0, combo: 1, focus: 46, rush: 0, invulnerable: 0, framePulse: 0,
    feedback: { text: 'Read the sentence', sub: '', tone: 'good', life: 0, maxLife: 1 },
    mapBounds: SENTENCE_GROVE_MAP_BOUNDS, player: { x: 4, z: 54, yaw: 2.4, speed: 4.2 }, steerVisual: .1,
    hazards: [{ stun: .5 }, { stun: 0 }], tokens: round.choices.map((choice, index) => {
      const home = point({ x: positions[index][0], y: 0, z: positions[index][1] });
      return { choice, home, group: { position: point(home), visible: true }, smashed: locked && choice === round.acceptedAnswers[0],
        cooldown: locked ? 99 : 0, smashLife: locked ? -.3 : 0, bump: 0 };
    }) };
  // Renderer-like point methods are intentionally omitted from serialized data.
  const source = createSentenceGrovePracticeSession({ ...state, tokens: state.tokens.map(token => ({ ...token, home: { x: token.home.x, y: token.home.y, z: token.home.z } })) },
    { difficulty: 'easy', seed: 3, journeyIndex: 0, originStage, legacyResume, evidence, supportReasons: {}, sceneTime: 12.4 });
  return { state, source, round };
}

test('Grove zero cursor retains actual driving position and a stable equal-choice fan without inventing a repair', () => {
  const { source } = fixture();
  const held = validateSentenceGrovePracticeSession(source, 'easy', 3, 0, rounds);
  assert.ok(held); assert.deepEqual(held.world.player, source.world.player); assert.deepEqual(held.world.tokens, source.world.tokens);
  assert.equal(held.correct, 0); assert.deepEqual(held.evidence.firstResponses, []);
  held.world.player.x += 1; assert.notEqual(held.world.player.x, source.world.player.x);
  assert.equal(validateSentenceGrovePracticeSession(source, 'easy', 4, 0, rounds), null);
  assert.equal(validateSentenceGrovePracticeSession(source, 'easy', 3, 1, rounds), null);
  assert.equal(validateSentenceGrovePracticeSession(source, 'easy', 3, 0, rounds, 1), null);
});

test('Grove reload keeps first-wrong and supported correct retry while restoring the same actual cut tree and rover', () => {
  const round = rounds[0], wrong = round.choices.find(choice => !round.acceptedAnswers.includes(choice));
  const first = commitSentenceGroveRepair(newSentenceGroveEvidence(), round, wrong, { responseAt: 10 });
  const right = commitSentenceGroveRepair(first.evidence, round, round.acceptedAnswers[0], { responseAt: 20 });
  const { source } = fixture({ evidence: right.evidence, locked: true });
  source.itemMisses = 1; source.supportReasons[round.roundId] = ['contrast-teaching-after-error'];
  const held = validateSentenceGrovePracticeSession(source, 'easy', 3, 0, rounds), live = fixture().state;
  assert.ok(held); assert.equal(restoreSentenceGrovePracticeSession(live, held), true);
  assert.deepEqual(held.evidence.firstResponses, first.evidence.firstResponses); assert.deepEqual(held.evidence.assistedRetries, right.evidence.assistedRetries);
  assert.equal(live.gateLocked, true); assert.equal(live.correct, 1); assert.deepEqual(live.player, source.world.player);
  assert.equal(live.tokens.filter(token => token.smashed).length, 1);
  live.tokens.forEach((token, index) => {
    assert.equal(token.home.x, held.world.tokens[index].home.x); assert.equal(token.home.z, held.world.tokens[index].home.z);
  });
  assert.deepEqual(live.hazards, held.world.hazards);
  assert.equal(restoreSentenceGrovePracticeSession({ ...live, tokens: live.tokens.slice(1) }, held), false);
});

test('Grove preserves later chapter repair prefixes and marks positive legacy starts without fabricating earlier rows', () => {
  const first = commitSentenceGroveRepair(newSentenceGroveEvidence(), rounds[0], rounds[0].acceptedAnswers[0], { responseAt: 10 });
  const next = fixture({ itemIndex: 1, evidence: first.evidence }).source;
  assert.ok(validateSentenceGrovePracticeSession(next, 'easy', 3, 0, rounds));
  const skipped = structuredClone(next); skipped.itemIndex = 2;
  assert.equal(validateSentenceGrovePracticeSession(skipped, 'easy', 3, 0, rounds), null);
  const legacy = fixture({ stage: 3, originStage: 3, legacyResume: true }).source;
  assert.ok(validateSentenceGrovePracticeSession(legacy, 'easy', 3, 0, rounds));
  assert.deepEqual(legacy.evidence.completions, []); assert.equal(legacy.originRepairSlot, 12);
  const falseHistory = structuredClone(legacy); falseHistory.legacyResume = false;
  assert.equal(validateSentenceGrovePracticeSession(falseHistory, 'easy', 3, 0, rounds), null);
});

test('Grove rejects moved targets, invented tree disappearance, fake completion, unbounded state and a different regenerated chapter', () => {
  for (const mutate of [
    source => { source.world.tokens[0].home.x += 1; }, source => { source.world.tokens[0].choice = 'invented repair'; },
    source => { source.world.tokens[0].smashed = true; }, source => { source.correct = 1; },
    source => { source.ended = true; }, source => { source.world.player.speed = Infinity; },
    source => { source.extra = 'x'.repeat(2000001); }
  ]) {
    const { source } = fixture(); mutate(source); assert.equal(validateSentenceGrovePracticeSession(source, 'easy', 3, 0, rounds), null);
  }
  const { source } = fixture();
  assert.equal(sentenceGroveWorldFitsChapter(source, SENTENCE_GROVE_MAP_BOUNDS, 2), true);
  assert.equal(sentenceGroveWorldFitsChapter(source, SENTENCE_GROVE_MAP_BOUNDS, 3), false);
  source.world.player.x = 500;
  assert.equal(sentenceGroveWorldFitsChapter(source, SENTENCE_GROVE_MAP_BOUNDS, 2), false);
});

test('Grove quota recovery retains the exact scoped snapshot and leaves another child and game untouched', () => {
  const previous = globalThis.window, values = new Map(); let blocked = true;
  globalThis.window = { localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => {
    if (blocked) throw new Error('QuotaExceededError'); values.set(key, value);
  } } };
  try {
    const { source } = fixture(), before = structuredClone(source);
    values.set('literacy-guide-learn-games:grove-a', JSON.stringify({ games: { 'letter-leap': { score: 25 } } }));
    values.set('literacy-guide-learn-games:grove-b', JSON.stringify({ games: { 'star-gallery': { score: 42 } } }));
    const otherChild = values.get('literacy-guide-learn-games:grove-b');
    const failure = saveSentenceGrovePracticeSession('grove-a', 'easy', source);
    assert.equal(failure.localSaved, false); assert.deepEqual(failure.snapshot, before);
    assert.equal(loadSentenceGrovePracticeSession('grove-a', 'easy', 3, 0, rounds), null);
    assert.deepEqual(source, before);
    blocked = false;
    assert.equal(saveSentenceGrovePracticeSession('grove-a', 'easy', failure.snapshot).localSaved, true);
    assert.deepEqual(loadSentenceGrovePracticeSession('grove-a', 'easy', 3, 0, rounds), before);
    const saved = JSON.parse(values.get('literacy-guide-learn-games:grove-a'));
    assert.deepEqual(saved.games['letter-leap'], { score: 25 }); assert.equal(values.get('literacy-guide-learn-games:grove-b'), otherChild);
  } finally { globalThis.window = previous; }
});
