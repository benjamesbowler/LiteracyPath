import assert from "node:assert/strict";
import test from "node:test";
import { adventureQuestionEvidence, adventureCheckSnapshot, createAdventureRun, recordAdventureOutcome } from "../../src/components/elQuest/adventureRunState.js";
import { normalizeAssessmentAttempt } from "../../src/data/assessmentHistoryStore.js";
import { buildLearningEvidenceProfile } from "../../src/utils/learningEvidenceInsights.js";

const round = { roundKey: "cycle-6:word:cat", targetWord: "cat", construct: "word_recognition", mechanicId: "sightWordChoice", answer: "cat" };
const stamp = "2026-09-28T08:30:00.000Z";
function respond(state, selected, correct, evidence = { independent: true }) {
  const outcome = { selected, correct, evidence, roundIndex: 0 };
  return recordAdventureOutcome(state, { ...outcome, questionRecord: adventureQuestionEvidence(round, outcome) });
}

test("Adventure saved teaching evidence keeps the first error after successful retry", () => {
  const start = createAdventureRun(1);
  const wrong = respond(start, "cap", false);
  const finished = respond(wrong, "cat", true);
  const snapshot = adventureCheckSnapshot(finished, stamp);
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.source, "adventure_map");
  assert.equal(snapshot.completedAt, stamp);
  assert.equal(snapshot.questionRecords[0].selectedAnswer, "cap");
  assert.equal(snapshot.questionRecords[0].correctAnswer, "cat");
  assert.equal(snapshot.questionRecords[0].isCorrect, false);
  assert.equal(snapshot.questionRecords[0].completedAfterSupport, true);
  assert.equal(snapshot.questionRecords[0].attempts, 2);
  assert.equal(start.questionRecords[0], null);
  assert.equal(wrong.attempts[0], 1);
});

test("supported success is completion without independent correctness", () => {
  const state = respond(createAdventureRun(1), "cat", true, { independent: false, supportUsed: ["model"] });
  const record = adventureCheckSnapshot(state, stamp).questionRecords[0];
  assert.equal(record.responseStatus, "supported");
  assert.equal(record.isCorrect, null);
  assert.equal(record.evidence.independent, false);
});

test("unheard required audio stays missing evidence and repeated passes retain semantic identity", () => {
  const record = adventureQuestionEvidence({ ...round, semanticKey: "word:cat" }, {
    selected: "cat", correct: true, evidence: { audioRequired: true, audioDelivered: false, independent: false }
  });
  assert.equal(record.responseStatus, "media_failed");
  assert.equal(record.audioDelivery, "failed");
  assert.equal(record.semanticKey, "word:cat");
  const profile = buildLearningEvidenceProfile([record, { ...record, questionId: "pass-2" }], { source: "adventure_map" });
  assert.equal(profile.totals.mediaFailed, 2);
  assert.equal(profile.totals.supported, 0);
  assert.equal(profile.totals.distinctItems, 1);
  assert.equal(profile.totals.repeatedPresentations, 1);
  assert.match(profile.nextSteps[0].nextAction, /Restore and replay/);
});

test("an interrupted or old resumed run cannot acquire invented item evidence", () => {
  assert.equal(adventureCheckSnapshot(respond(createAdventureRun(1), "cap", false), stamp), null);
  assert.equal(adventureCheckSnapshot({ total: 1, completed: 1, firstAttempts: [true] }, stamp), null);
});

test("picture responses save readable labels instead of opaque cell IDs", () => {
  const record = adventureQuestionEvidence({ ...round, mechanicId: "pictureSearch", objects: [{id:"cell-42",word:"rabbit"}] }, {selected:["cell-42"],correct:false});
  assert.equal(record.selectedAnswer, "rabbit");
});

test("letter grids save the administered letters and never claim a construct is a target", () => {
  const record = adventureQuestionEvidence({ roundKey: "grid-1", mechanicId: "letterGrid", construct: "visual_letter_search", targetLetters: ["s", "a"] }, { selected: ["S", "a"], correct: false });
  assert.equal(record.itemKey, "s / a");
  const legacy = adventureQuestionEvidence({ roundKey: "legacy-1", construct: "visual_letter_search" }, { correct: true });
  assert.equal(legacy.itemKey, "");
});

test("partial spelling records the requested letter, not the supplied whole word", () => {
  const record = adventureQuestionEvidence({ ...round, mechanicId: "missingLetter", missingGrapheme: "a" }, {
    selected: "o", correct: false, evidence: { independent: false, supportUsed: ["partial_spelling_model"] }
  });
  assert.equal(record.selectedAnswer, "o");
  assert.equal(record.correctAnswer, "a");
  assert.equal(record.targetWord, "cat");
  assert.equal(record.responseStatus, "supported");
});

test("history normalization preserves administered constructs and breadth without guessing legacy fields", () => {
  const record = normalizeAssessmentAttempt({ attemptId:"evidence-depth",studentId:"test",assessmentType:"skills",skillId:"nouns",completedAt:stamp,questionRecords:[{
    questionId:"question-1",isCorrect:false,selectedAnswer:"paint",correctAnswer:"brush",constructClaim:"noun_in_sentence",semanticKey:"naming-tool",coverageTags:["person","thing"],responseFormat:"GRAMMAR_SENTENCE_FIT",targetKind:"word_function",contrast:"same-word-different-role"
  }] }).questionRecords[0];
  assert.equal(record.evidenceConstruct,"noun_in_sentence");
  assert.equal(record.semanticKey,"naming-tool");
  assert.deepEqual(record.coverageTags,["person","thing"]);
  assert.equal(record.contrast,"same-word-different-role");
  assert.equal(record.selectedAnswer,"paint");
  const old = normalizeAssessmentAttempt({attemptId:"old",studentId:"test",assessmentType:"skills",completedAt:stamp,questionRecords:[{questionId:"legacy"}]}).questionRecords[0];
  assert.equal(old.evidenceConstruct,"");
  assert.deepEqual(old.coverageTags,[]);
});
