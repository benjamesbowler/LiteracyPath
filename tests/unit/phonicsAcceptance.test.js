import test from "node:test";
import assert from "node:assert/strict";
import { phonicsAcceptance } from "../../src/utils/phonicsAcceptance.js";

const envelope = () => ({ gameState: { words: ["cat", "dog"] }, round: 0, score: 0, streak: 0, correct: 0, discoveries: [], modelNext: false,
  evidence: { firstResponses: [{ response: "wrong", correct: false }], assistedRetries: [] } });

test("a saved learned answer contains scene, reward, supported evidence and next-model policy together", () => {
  const current = envelope();
  const original = structuredClone(current);
  const completed = { popped: true, learningEpisode: { phase: "complete" } };
  const credit = { id: "pop:0", score: 20, correct: 1, discovery: { id: "word-0" }, modelNext: true,
    assisted: { game: "pop-the-word", round: 0, independent: true, supportUsed: ["worked_model"] } };
  const { state } = phonicsAcceptance(current, 0, completed, credit);
  const saved = JSON.parse(JSON.stringify(state));
  assert.equal(saved.stage.data.popped, true);
  assert.equal(saved.score, 20);
  assert.equal(saved.correct, 1);
  assert.equal(saved.streak, 1);
  assert.equal(saved.discoveries.length, 1);
  assert.equal(saved.evidence.assistedRetries[0].independent, false);
  assert.equal(saved.evidence.assistedRetries[0].practiceOnly, true);
  assert.equal(saved.modelNext, true);
  assert.deepEqual(saved.acceptedReceipts, ["pop:0"]);
  assert.deepEqual(current, original, "preparing a held save must not mutate live counters or evidence");
});
test("a reloaded receipt never adds a second reward, streak, discovery or evidence row", () => {
  const credit = { id: "pop:0", score: 20, correct: 1, discovery: { id: "word-0" }, assisted: { round: 0 } };
  const first = phonicsAcceptance(envelope(), 0, { popped: true }, credit).state;
  const reloaded = JSON.parse(JSON.stringify(first));
  const repeated = phonicsAcceptance(reloaded, 0, { popped: true }, credit);
  assert.equal(repeated.applied, false);
  assert.deepEqual(repeated.state, first);
});
test("partial sentence words receive distinct durable credits while retaining the same outing slot", () => {
  const first = phonicsAcceptance(envelope(), 0, { index: 1 }, { id: "hop:0:0", score: 10 }).state;
  const second = phonicsAcceptance(first, 0, { index: 2 }, { id: "hop:0:1", score: 10 }).state;
  assert.equal(second.stage.data.index, 2);
  assert.equal(second.score, 22);
  assert.equal(second.correct, 0);
  assert.equal(second.streak, 2);
  assert.deepEqual(second.acceptedReceipts, ["hop:0:0", "hop:0:1"]);
});
test("already discovered legacy tickets remain unique during conservative accepted-stage recovery", () => {
  const current = envelope();
  current.discoveries = [{ id: "word-0" }];
  const next = phonicsAcceptance(current, 0, { popped: true }, { id: "pop:0", score: 20, correct: 1, discovery: { id: "word-0" } }).state;
  assert.equal(next.discoveries.length, 1);
});
test("legacy evidence saved before old counters is retained once during recovery", () => {
  const current = envelope();
  current.evidence.assistedRetries = [{ round: 0, learningEpisode: { id: "frozen-episode" } }];
  const next = phonicsAcceptance(current, 0, { popped: true }, { id: "pop:0", score: 20, correct: 1,
    assisted: { round: 0, learningEpisode: { id: "frozen-episode" } } }).state;
  assert.equal(next.correct, 1);
  assert.equal(next.score, 20);
  assert.equal(next.evidence.assistedRetries.length, 1);
  assert.deepEqual(next.evidence.assistedRetries[0], current.evidence.assistedRetries[0]);
});
test("unusable credit cannot create a persisted acceptance or regress correct counters", () => {
  assert.equal(phonicsAcceptance(null, 0, {}, { id: "pop:0", score: 20 }), null);
  assert.equal(phonicsAcceptance(envelope(), 0, {}, { score: 20 }), null);
  assert.equal(phonicsAcceptance(envelope(), 0, {}, { id: "pop:0", score: NaN }), null);
  assert.equal(phonicsAcceptance(envelope(), 0, {}, { id: "pop:0", score: -1 }), null);
  const current = envelope(); current.correct = 1;
  assert.equal(phonicsAcceptance(current, 0, {}, { id: "pop:0", score: 20, correct: 0 }), null);
});
