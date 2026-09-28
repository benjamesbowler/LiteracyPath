import assert from "node:assert/strict";
import test from "node:test";
import { benchmarkInstructionalActions } from "../../src/utils/benchmarkInstructionalActions.js";
import { EL_BENCHMARK_IDS as IDS } from "../../src/data/elBenchmarkAssessmentCatalog.js";
import { getElBenchmarkSessionPlan, scoreElBenchmarkSession } from "../../src/data/elBenchmarkAssessments.js";

const observed = extra => ({ administrationStatus: "administered", responseStatus: "incorrect", isCorrect: false, ...extra });

test("teaching actions do not interpret unadministered, invalid or suppressed evidence as errors", () => {
  const questionRecords = [observed({ strand: "phoneme_blending", validationIssues: ["response_transcription_required"] }), observed({ strand: "rhyme", administrationStatus: "not_administered" })];
  assert.deepEqual(benchmarkInstructionalActions({ assessmentId: IDS.PHONOLOGICAL_AWARENESS, questionRecords }), []);
  assert.deepEqual(benchmarkInstructionalActions({ assessmentId: IDS.DECODING, questionRecords: [observed({ targetWord: "map" })], scoringSuppressed: true }), []);
});

test("oral follow-up responds to the observed strand without a mastery inference", () => {
  const actions = benchmarkInstructionalActions({ assessmentId: IDS.PHONOLOGICAL_AWARENESS, questionRecords: [observed({ strand: "phoneme_segmentation" })] });
  assert.match(actions[0], /Count sounds, not letters/);
  assert.match(actions[0], /1 observed response/);
  assert.doesNotMatch(actions[0], /mastered|secure|below grade/i);
});

test("spelling actions distinguish plausible sound representation from incomplete sound mapping", () => {
  const actions = benchmarkInstructionalActions({ assessmentId: IDS.ENCODING, questionRecords: [observed({ targetWord: "rain", plausible: true }), observed({ targetWord: "frog", plausible: false })] });
  assert.equal(actions.length, 2);
  assert.match(actions[0], /represents the sounds/);
  assert.match(actions[0], /rain/);
  assert.match(actions[1], /sound-to-letter mapping/);
  assert.match(actions[1], /frog/);
});

test("accurate sounding-out prompts consolidation rather than an inaccurate-reading label", () => {
  const actions = benchmarkInstructionalActions({ assessmentId: IDS.DECODING, questionRecords: [observed({ targetWord: "map", responseStatus: "correct", isCorrect: true, automatic: false })] });
  assert.equal(actions.length, 1);
  assert.match(actions[0], /accurately with sounding out/);
  assert.match(actions[0], /without a speed target/);
  assert.doesNotMatch(actions[0], /recorded errors/);
});

test("fluency suggestions require usable passage evidence and preserve phrasing over rate", () => {
  const questionRecords = [observed({ routeJudgmentUsable: false, errors: 4, prosody: { dimensions: { pace: 1 } } })];
  assert.deepEqual(benchmarkInstructionalActions({ assessmentId: IDS.ORAL_READING_FLUENCY, questionRecords }), []);
  questionRecords[0].routeJudgmentUsable = true;
  const actions = benchmarkInstructionalActions({ assessmentId: IDS.ORAL_READING_FLUENCY, questionRecords });
  assert.equal(actions.length, 2);
  assert.match(actions[1], /phrasing over faster reading/);
});

test("a known invalid legacy prompt cannot create fresh scored evidence but retains its original observation", () => {
  const session = { assessmentId: IDS.PHONOLOGICAL_AWARENESS, formId: "form-c-v1", grade: "K", window: "MOY", responses: { "pa-k-moy-c-08-v1": { status: "correct", responseCaptureMode: "quick_teacher_judgment", isCorrect: true } } };
  const plan = getElBenchmarkSessionPlan(session);
  assert.match(plan.items.find(item => item.id === "pa-k-moy-c-08-v1").teacherSay, /\/x\//);
  const score = scoreElBenchmarkSession(session);
  const record = score.questionRecords.find(item => item.questionId === "pa-k-moy-c-08-v1");
  assert.equal(record.isCorrect, null);
  assert.equal(record.responseStatus, "not_scorable");
  assert.equal(record.metadata.legacyOriginalResponseStatus, "correct");
  assert.ok(score.validationIssues.some(issue => issue.endsWith("legacy_prompt_requires_not_scorable_review")));
  session.responses["pa-k-moy-c-08-v1"] = { status: "not_scorable", notScorableReason: "directions_or_material_issue" };
  assert.ok(!scoreElBenchmarkSession(session).validationIssues.some(issue => issue.endsWith("legacy_prompt_requires_not_scorable_review")));
});
