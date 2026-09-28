import assert from "node:assert/strict";
import test from "node:test";
import { buildLearningEvidenceProfile } from "../../src/utils/learningEvidenceInsights.js";
import { buildSkillsCheckReportModel } from "../../src/data/studentReportingWorkspaceModel.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";
import { cyclePracticeEvidenceProfile, exportCycleSessionResultsCsv } from "../../src/utils/cyclePracticeReporting.js";

const question = (id, values = {}) => ({ questionId: id, semanticKey: id, itemKey: "m", itemType: "initial_sound", targetWord: "moon", templateType: "FIRST_SOUND", responseStatus: "correct", isCorrect: true, ...values });

test("coverage separates broad evidence from repeated practice and stays descriptive", () => {
  const rows = [question("a"), question("a", { responseStatus: "incorrect", isCorrect: false, selectedAnswer: "n", correctAnswer: "m" }),
    question("b", { itemKey: "s", templateType: "SOUND_TO_LETTER" })];
  const original = JSON.stringify(rows);
  const report = buildLearningEvidenceProfile(rows);
  assert.deepEqual(report.totals, { presented: 3, scored: 3, correct: 2, incorrect: 1, supported: 0, mediaFailed: 0, unscored: 0, distinctItems: 2, distinctTargets: 2, distinctFormats: 2, repeatedPresentations: 1, itemIdentityMissing: 0 });
  assert.deepEqual(report.targets[0].confusions, [{ selected: "n", expected: "m", count: 1 }]);
  assert.match(report.targets[0].nextAction, /first sound/);
  assert.match(report.targets[0].nextAction, /fresh pictured word/);
  assert.equal(report.status, undefined);
  assert.equal(JSON.stringify(rows), original);
});

test("support, unavailable media and explicit legacy state cannot become correct or incorrect", () => {
  const report = buildLearningEvidenceProfile([
    question("support", { evidence: { supportLevel: 1 } }),
    question("self", { responseStatus: "self_corrected" }),
    question("media", { audioRequired: true, audioDelivery: "unavailable" }),
    question("old", { responseStatus: "legacy_unverified" }),
    question("empty", { responseStatus: "not_scorable", isCorrect: null })
  ], { source: "cycle_practice" });
  assert.equal(report.totals.correct, 0);
  assert.equal(report.totals.incorrect, 0);
  assert.equal(report.totals.scored, 0);
  assert.equal(report.totals.supported, 2);
  assert.equal(report.totals.mediaFailed, 1);
  assert.equal(report.totals.unscored, 2);
  assert.match(report.claimBoundary, /do not establish formal mastery/);
});

test("unsupported old practice and void administrations remain outside independent evidence", () => {
  const old = buildLearningEvidenceProfile([question("a", { responseStatus: undefined })], { source: "adventure_map" });
  assert.equal(old.totals.scored, 0);
  assert.equal(old.totals.unscored, 1);
  const voided = buildLearningEvidenceProfile([question("a")], { administrationStatus: "not_scorable" });
  assert.equal(voided.totals.correct, 0);
  assert.equal(voided.totals.unscored, 1);
});

test("explicit response status wins over contradictory legacy Boolean flags", () => {
  const report = buildLearningEvidenceProfile([
    question("wrong", { responseStatus: "incorrect", isCorrect: true, selectedAnswer: "n", correctAnswer: "m" }),
    question("right", { responseStatus: "correct", isCorrect: false })
  ]);
  assert.equal(report.totals.correct, 1);
  assert.equal(report.totals.incorrect, 1);
  assert.deepEqual(report.targets[0].confusions, [{ selected: "n", expected: "m", count: 1 }]);
});

test("multi-select labels remain readable without exposing object payloads", () => {
  const report = buildLearningEvidenceProfile([
    question("multi", { responseStatus: "incorrect", isCorrect: false, selectedAnswer: ["moon", "net", { id: "private-choice-id" }], correctAnswer: ["moon", "mop"] })
  ], { source: "cycle_practice" });
  assert.deepEqual(report.targets[0].confusions, [{ selected: "moon, net", expected: "moon, mop", count: 1 }]);
  assert.doesNotMatch(JSON.stringify(report), /private-choice-id|\[object Object\]/);
});

test("known nested audio failure is unavailable evidence rather than a learning-support need", () => {
  const report = buildLearningEvidenceProfile([question("media", {
    responseStatus: "supported", isCorrect: null,
    evidence: { independent: false, audioRequired: true, audioDelivered: false, supportUsed: ["media_unavailable"] }
  })], { source: "adventure_map" });
  assert.equal(report.totals.mediaFailed, 1);
  assert.equal(report.totals.supported, 0);
  assert.match(report.nextSteps[0].nextAction, /Restore and replay/);
  assert.match(report.nextSteps[0].nextAction, /not a learning error/);
});

test("numbered content variants cannot inflate response-format breadth", () => {
  const report = buildLearningEvidenceProfile([
    question("cloze-a", { templateType: "HFW_SENTENCE_CLOZE_L1P1_01" }),
    question("cloze-b", { templateType: "HFW_SENTENCE_CLOZE_L1P2_24" }),
    question("spell", { templateType: "HFW_SENTENCE_SPELL_L2P1_01" })
  ]);
  assert.equal(report.totals.distinctFormats, 2);
  assert.equal(report.formats[0].label, "Choose a word in a sentence");
});

test("spoken-word recognition advice preserves the required cue and does not imply decoding", () => {
  const report = buildLearningEvidenceProfile([question("heard-word", { evidenceConstruct: "auditory_word_recognition", itemKey: "said", responseStatus: "incorrect", isCorrect: false, selected: "sad", correctAnswer: "" })], { source: "cycle_practice" });
  assert.match(report.targets[0].nextAction, /required spoken cue/);
  assert.match(report.targets[0].nextAction, /not independent decoding/);
  assert.equal(report.targets[0].confusions.length, 0);
  assert.deepEqual(report.targets[0].recordedResponses, [{ selected: "sad", kind: "incorrect", count: 1 }]);
});

test("absent question detail does not invent failure, breadth or a teaching diagnosis", () => {
  assert.match(buildLearningEvidenceProfile().summary, /coverage are unknown/);
  const unknown = buildLearningEvidenceProfile([{}]);
  assert.equal(unknown.totals.scored, 0);
  assert.equal(unknown.totals.incorrect, 0);
  assert.equal(unknown.totals.distinctItems, 0);
  assert.equal(unknown.totals.distinctTargets, 0);
  assert.equal(unknown.totals.distinctFormats, 0);
  assert.equal(unknown.totals.itemIdentityMissing, 1);
  assert.equal(unknown.targets[0].label, "Target not recorded");
  assert.equal(unknown.targets[0].confusions.length, 0);
});

test("identical target text in different constructs remains separate", () => {
  const report = buildLearningEvidenceProfile([
    question("a", { itemKey: "cat", itemType: "word_reading" }),
    question("b", { itemKey: "cat", itemType: "word_spelling", responseStatus: "incorrect", isCorrect: false }),
    question("c", { itemKey: "cat", itemType: "spoken_word_picture_matching", responseStatus: "incorrect", isCorrect: false })
  ]);
  assert.equal(report.targets.length, 3);
  assert.match(report.targets[1].nextAction, /segment its sounds/);
  assert.match(report.targets[2].nextAction, /explain.*clear picture/);
});

test("teaching moves use the saved example word while unit labels stay human readable", () => {
  const report = buildLearningEvidenceProfile([
    question("partial", { itemKey: "a", targetWord: "cat", evidenceConstruct: "medial_grapheme_completion", responseStatus: "supported", isCorrect: null, evidence: { independent: false } }),
    question("reading", { itemKey: "short_a", targetWord: "map", evidenceConstruct: "word_reading", responseStatus: "incorrect", isCorrect: false })
  ]);
  assert.equal(report.targets[0].label, "a");
  assert.match(report.targets[0].nextAction, /Say “cat”, stretch its sounds/);
  assert.equal(report.targets[1].label, "short a");
  assert.match(report.targets[1].nextAction, /sounding out “map”/);
  assert.deepEqual(report.targets[1].exampleWords, ["map"]);
});

test("the latest archived Skills assessment supplies screen and export teaching detail", () => {
  const makeAttempt = (id, date, records) => ({ attemptId: id, studentId: "synthetic-report-depth", skillId: "initial_sounds", skillName: "Initial Sounds", assessmentType: "skill_checkpoint", completedAt: date, startedAt: date, questionRecords: records });
  const report = buildSkillsCheckReportModel({ studentId: "synthetic-report-depth", now: new Date("2026-09-28T10:00:00Z"), assessmentHistory: [
    makeAttempt("old", "2026-09-20T10:00:00Z", [question("old", { itemKey: "b" })]),
    makeAttempt("latest", "2026-09-28T09:00:00Z", [question("latest", { isCorrect: false, responseStatus: "incorrect", selectedAnswer: "n", correctAnswer: "m" })])
  ] });
  const profile = report.skills[0].learningEvidenceProfile;
  assert.equal(profile.targets[0].label, "m");
  assert.equal(profile.totals.presented, 1);
  const rows = buildStudentWorkspaceCsvRows("skills-check", { skillsCheck: report });
  const teaching = rows.find(row => row.Section === "Teach next");
  assert.equal(teaching.Target, "m");
  assert.equal(teaching["Independent responses"], 1);
  assert.equal(teaching["Next teaching move"], profile.targets[0].nextAction);
  assert.match(teaching["Recorded contrasts"], /Selected n; expected m/);
});

test("Cycle exports carry scope and next action without inventing old question coverage", () => {
  const result = { questionRecords: [question("a", { responseStatus: "incorrect", isCorrect: false })] };
  const profile = cyclePracticeEvidenceProfile(result);
  const csv = exportCycleSessionResultsCsv([{ student_id: "s", cycle_practice_result: result }]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /distinctItems.*distinctTargets.*distinctFormats/);
  assert.match(csv, /Practice responses guide/);
  assert.ok(csv.includes(profile.targets[0].nextAction.replace(/"/g, '""')));
  const legacy = exportCycleSessionResultsCsv([{ student_id: "s", cycle_practice_result: { totalQuestions: 10 } }]);
  assert.match(legacy, /Question-level evidence not recorded/);
});

test("raw question exports agree with status and support boundaries while retaining recorded status", () => {
  const workspace = { skillsCheck: { attempts: [{ raw: { questionRecords: [
    question("wrong", { responseStatus: "incorrect", isCorrect: true }),
    question("supported", { evidence: { independent: false, supportUsed: ["model"] } }),
    question("media", { responseStatus: "media_failed", isCorrect: false })
  ] } }, { raw: { administrationStatus: "not_scorable", questionRecords: [question("void")] } }] } };
  const rows = buildStudentWorkspaceCsvRows("skills-check", workspace).filter(row => row["Row type"] === "Question result");
  assert.deepEqual(rows.map(row => row.Correct), [0, "", "", ""]);
  assert.deepEqual(rows.map(row => row.Status), ["incorrect", "supported", "media_failed", "unscored"]);
  assert.equal(rows[1]["Recorded response status"], "correct");
});
