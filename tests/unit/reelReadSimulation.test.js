import test from 'node:test';
import assert from 'node:assert/strict';
import { beginReelReadCast, fillReelReadSchool, stepReelReadSimulation } from '../../src/utils/reelReadSimulation.js';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';
import { reelReadHookDecision, reelReadLandAcceptedFish } from '../../src/utils/reelReadHookDecision.js';
import { reelReadStageLayout, stepReelReadFish, reelReadCastColumn } from '../../src/utils/reelReadMotion.js';

const level = reelReadV2Ladder('easy', 913)[0];
function fixture() {
  const state = { stage: 0, level, elapsed: 0, boatPosition: .4, facing: 'right', steering: 0,
    nextId: 1, fish: [], acceptedWords: [], landedWords: [], motorMisses: 0, motorEscapes: 0 };
  fillReelReadSchool(state, 913); return state;
}
const view = { layout: reelReadStageLayout(1000, 700), rod: { tip: { x: 300, y: 310 } } };
const ticks = (state, count, handlers, geometry = view) => {
  for (let i = 0; i < count; i++) stepReelReadSimulation(state, 1 / 120, geometry, handlers);
};
const waitForSchoolCast = (state,fish,handlers) => {
  const position=stepReelReadFish(fish,view.layout,state.level,0);
  const period=position.currentPeriod/state.level.fishSpeed;
  let next=(reelReadCastColumn(view.rod,view.layout,state.facing)-position.x)/state.level.fishSpeed-.5;
  while(next<=state.elapsed)next+=period;
  ticks(state,Math.ceil((next-state.elapsed)*120),handlers);
};

test('a short native cast retains anticipation and strikes the first physical school body', () => {
  const state = fixture();
  const fish = state.fish.find(row => row.word === level.correctWords[0]);
  // Keep this genuine moving fish across the dropping column at the contact
  // time; another correct word below cannot be preferred by the collision.
  state.fish = [fish]; fish.slot = 0; fish.direction = 1; fish.phase = 403;
  waitForSchoolCast(state,fish);
  let contacts = 0;
  beginReelReadCast(state, 'pointer'); state.reeling = false;
  assert.equal(state.castPending, true);
  ticks(state, 18); assert.equal(state.hook, undefined);
  ticks(state, 120, { onHook(row) {
    contacts++; const decision = reelReadHookDecision(level, row.word, state.acceptedWords, state.landedWords);
    state.acceptedWords = decision.acceptedWords; return decision;
  } });
  assert.equal(contacts, 1); assert.deepEqual(state.acceptedWords, [fish.word]);
  assert.equal(state.fight.fishId, fish.id); assert.deepEqual(state.landedWords, []);
});

test('wrong contact and motor miss never replace fish IDs, words or slots', () => {
  const state = fixture(), school = structuredClone(state.fish.map(({ id, word, slot }) => ({ id, word, slot })));
  const wrong = state.fish.find(row => !level.correctWords.includes(row.word));
  state.fish = [wrong]; wrong.slot = 0; wrong.direction = 1; wrong.phase = 403;
  waitForSchoolCast(state,wrong);
  beginReelReadCast(state, 'keyboard');
  let wrongResponses = 0;
  ticks(state, 160, { onHook(row) { wrongResponses++; return reelReadHookDecision(level, row.word); } });
  assert.equal(wrongResponses, 1); assert.deepEqual(state.acceptedWords, []);
  assert.ok(school.some(row => row.id === wrong.id && row.word === wrong.word));
  const retained = structuredClone(state.fish.map(({ id, word, slot }) => ({ id, word, slot })));
  beginReelReadCast(state, 'keyboard'); ticks(state, 200,undefined,{...view,rod:{tip:{x:850,y:310}}});
  assert.equal(state.motorMisses, 1);
  assert.deepEqual(state.fish.map(({ id, word, slot }) => ({ id, word, slot })), retained);
});

test('accepted hook, strained escape and actual re-hook preserve prefix without another literacy response', () => {
  const state = fixture(), fish = state.fish.find(row => row.word === level.correctWords[0]);
  state.fish = [fish]; fish.slot = 0; fish.direction = 1; fish.phase = 403;
  const responses = [];
  const handlers = { onHook(row) {
    const result = reelReadHookDecision(level, row.word, state.acceptedWords, state.landedWords);
    if (result.literacyResponse) responses.push(result);
    state.acceptedWords = result.acceptedWords; return result;
  }, onLand(row) { state.landedWords = reelReadLandAcceptedFish(state.acceptedWords, state.landedWords, row.word); } };
  waitForSchoolCast(state,fish,handlers);
  beginReelReadCast(state, 'keyboard'); ticks(state, 90, handlers);
  assert.equal(responses.length, 1);
  state.fight.tension = 1; state.fight.remaining = 20; state.fight.initialLength = 20; state.reeling = true;
  ticks(state, 100, handlers);
  assert.equal(state.motorEscapes, 1); assert.deepEqual(state.acceptedWords, [fish.word]); assert.deepEqual(state.landedWords, []);
  waitForSchoolCast(state,fish,handlers);
  beginReelReadCast(state, 'keyboard'); ticks(state, 90, handlers);
  assert.ok(state.fight); assert.equal(responses.length, 1);
  state.fight.remaining = .8; state.reeling = true; ticks(state, 4, handlers);
  assert.deepEqual(state.landedWords, [fish.word]); assert.equal(responses.length, 1);
});
