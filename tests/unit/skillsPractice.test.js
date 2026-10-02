import assert from "node:assert/strict";
import test from "node:test";
import { createLearningResponseEpisode, commitLearningResponse, advanceLearningResponseReceipt, recordLearningGuidedAction, learningResponseCompletionEvent } from "../../src/utils/learningResponseState.js";
import { buildSkillsPracticeReport, createSkillsPracticeEvent, selectSkillsPracticeQuestions, SKILLS_PRACTICE_ID } from "../../src/utils/skillsPracticeModel.js";
import { mergePracticeProgressRecords } from "../../src/utils/practiceCompletionRecords.js";
import { computeHydratedValue } from "../../src/utils/progressMerge.js";
import { buildOtherLearningReportModel } from "../../src/data/studentReportingWorkspaceModel.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";
import { importV3Bank, listV3PublishedSkillIds } from "../../src/data/v3/v3Registry.js";

const question = { id: "question-1", skillId: "initial_sounds", skillName: "Initial Sounds", unit: "m", answer: "m", prompt: "Find the first sound.", level: 1, phase: 1, choices: ["m", "s", "t"], formatType: "FIRST_SOUND", source: "v3" };
function event(overrides = {}) { return createSkillsPracticeEvent({ question, sessionId: "practice-session", responseId: "response-1", selected: "m", isCorrect: true, occurredAt: "2026-10-01T02:00:00.000Z", responseTimeMs: 1240, ...overrides }); }
function progress(events) { return { practiceRecord: { v: 3, status: "inprogress", completions: events } }; }

test("practice records first response and snapshot without a formal/mastery claim", () => {
  const source = { ...question };
  const saved = event({ question: source });
  source.prompt = "A changed bank prompt.";
  source.choices = ["a", "b"];
  assert.equal(saved.practiceOnly, true);
  assert.equal(saved.formalAssessment, false);
  assert.equal(saved.masteryClaim, false);
  assert.equal(saved.steps[0].responseTimeMs, 1240);
  assert.equal(saved.steps[0].evidenceType, "independent");
  assert.equal(saved.steps[0].itemSnapshot.prompt, "Find the first sound.");
});

test("all 30 current published Skills banks support both practice difficulties without retention material", async () => {
  const ids = listV3PublishedSkillIds();
  assert.equal(ids.length, 30);
  for (const id of ids) {
    const bank = await importV3Bank(id);
    for (const level of [1, 2]) {
      const questions = selectSkillsPracticeQuestions(bank, { level, seed: `practice-${id}` });
      assert.equal(questions.length, 6, `${id} difficulty ${level}`);
      assert.equal(questions.every(item => !item.retentionOnly), true);
    }
  }
});

test("support, skipped responses and unavailable media keep separate denominators", () => {
  const report = buildSkillsPracticeReport(progress([event(), event({ responseId: "supported", supportUsed: true }), event({ responseId: "wrong", selected: "s", isCorrect: false }), event({ responseId: "skip", responseStatus: "skipped", selected: null, isCorrect: null }), event({ responseId: "failed", responseStatus: "media_failed", isCorrect: null })]));
  assert.equal(report.answered, 3);
  assert.equal(report.independentCorrect, 1);
  assert.equal(report.independentIncorrect, 1);
  assert.equal(report.supported, 1);
  assert.equal(report.unscored, 2);
  assert.equal(report.responses.find(row => row.responseId === "supported").isCorrect, null);
});

test("early audio-essential answers keep raw matches but never become independent listening scores", () => {
  const early = event({ audioRequired: true, instructionDelivery: "started", targetDelivery: "not_started", responseTimeMs: null });
  assert.equal(early.steps[0].answerMatch, true);
  assert.equal(early.steps[0].firstResponseCorrect, null);
  assert.equal(early.steps[0].isCorrect, null);
  assert.equal(early.steps[0].evidenceType, "unscored");
  assert.equal(early.steps[0].validity, "invalid");
  const report = buildSkillsPracticeReport(progress([early]));
  assert.equal(report.answered, 1);
  assert.equal(report.independentCorrect, 0);
  assert.equal(report.unscored, 1);
  assert.equal(report.skills[0].audioNotDelivered, 1);
});

test("practice hydration retains both devices' immutable first answers and flags identity conflicts", () => {
  const first = event({ selected: "s", isCorrect: false });
  const second = event({ responseId: "response-2", selected: "m" });
  const local = { games: { [SKILLS_PRACTICE_ID]: progress([first]) } };
  const remote = { games: { [SKILLS_PRACTICE_ID]: progress([second]) } };
  const merged = computeHydratedValue("learn_games", "__all__", local, remote);
  assert.deepEqual(merged.games[SKILLS_PRACTICE_ID].practiceRecord.completions, [first, second]);
  const conflict = mergePracticeProgressRecords(progress([first]).practiceRecord, progress([event()]).practiceRecord);
  assert.deepEqual(conflict.completionConflictIds, ["response-1"]);
  assert.equal(buildSkillsPracticeReport({ practiceRecord: conflict }).answered, 0);
});

test("practice selection prefers fresh eligible questions and never borrows retention reserves", () => {
  const bank = Array.from({ length: 15 }, (_, index) => ({ ...question, id: `q${index}`, level: index > 11 ? 2 : 1, retentionOnly: index === 11 }));
  const selected = selectSkillsPracticeQuestions(bank, { level: 1, seed: "session", previousIds: ["q0", "q1"], failedIds: ["q2"] });
  assert.equal(selected.length, 6);
  assert.equal(selected.every(row => !row.retentionOnly && row.level === 1 && !["q0", "q1", "q2"].includes(row.id)), true);
  assert.deepEqual(selected, selectSkillsPracticeQuestions(bank, { level: 1, seed: "session", previousIds: ["q0", "q1"], failedIds: ["q2"] }));
});

test("practice favours pictured evidence without discarding fresh listening-only tasks", () => {
  const bank = [
    { ...question, id: "seen-picture", imagePath: "/images/assessment/seen.webp" },
    { ...question, id: "fresh-audio", evidenceModality: "audio_plus_print" },
    { ...question, id: "fresh-picture", imagePath: "/images/assessment/fresh.webp" }
  ];
  const selected = selectSkillsPracticeQuestions(bank, { count: 3, previousIds: ["seen-picture"], seed: "pictures" });
  assert.deepEqual(selected.map(item => item.id), ["fresh-picture", "fresh-audio", "seen-picture"]);
});

test("teacher reports include Skills practice separately and exclude it from Arcade or knowledge evidence", () => {
  const model = buildOtherLearningReportModel({ studentId: "student-1", arcade: { games: { [SKILLS_PRACTICE_ID]: { ...progress([event()]), plays: 500, lastPlayedAt: "2026-10-01" }, "real-game": { plays: 1 } } } });
  assert.equal(model.skillsPractice.answered, 1);
  assert.equal(model.arcade.games.length, 1);
  assert.equal(model.arcade.games[0].gameId, "real-game");
  const evidence = model.evidence.find(row => row.sourceArea === "skills_practice");
  assert.equal(evidence.practiceOnly, true);
  assert.equal(evidence.scorable, false);
  assert.equal(evidence.knowledgeEligible, false);
  assert.equal(evidence.statusCandidate, null);
  assert.equal(model.knowledgeEvidence.some(row => row.sourceArea === "skills_practice"), false);
});

test("teacher export preserves practice answers, support, denominators and response timing", () => {
  const skillsPractice = buildSkillsPracticeReport(progress([event({ supportUsed: true })]));
  const rows = buildStudentWorkspaceCsvRows("other-learning", { otherLearning: { skillsPractice } });
  const response = rows.find(row => row["Row type"] === "Skills practice response");
  assert.equal(response["Response ID"], "response-1");
  assert.equal(response["Selected answer"], "m");
  assert.equal(response["Support used"], true);
  assert.equal(response["Items scored"], 0);
  assert.equal(response["Response time ms"], 1240);
});


test("wrong first answer and correct fresh transfer remain separate in report and CSV", () => {
 const original=event({selected:"s",isCorrect:false});
 let episode=createLearningResponseEpisode({id:'episode',instrument:'skills_trail_practice',question,expected:'m',transfer:{question:{...question,id:'fresh',targetWord:'sun',choices:['s','a','b']},expected:'s'}});
 episode=commitLearningResponse(episode,{selected:'s',correct:false});
 const firstEnvelope=learningResponseCompletionEvent(episode);
 episode=recordLearningGuidedAction(advanceLearningResponseReceipt(episode),'m');
 episode=advanceLearningResponseReceipt(commitLearningResponse(episode,{selected:'s',correct:true,supported:true}));
 const transferEvent=event({question:episode.question,responseId:"transfer",selected:"s",isCorrect:true,supportUsed:true});
 transferEvent.steps[0].presentationRole="transfer";
 const completions=[original,transferEvent,firstEnvelope,learningResponseCompletionEvent(episode)];
 const report=buildSkillsPracticeReport(progress(completions));
 assert.equal(report.answered,1); assert.equal(report.independentIncorrect,1); assert.equal(report.independentCorrect,0);
 assert.equal(report.supportedFinishes,1); assert.equal(report.transfers.length,1); assert.equal(report.transfers[0].isCorrect,null);
 const csv=buildStudentWorkspaceCsvRows('other-learning',{otherLearning:{skillsPractice:report}});
 const modeled=csv.find(row=>row['Row type']==='Skills modeled action');
 const transferRow=csv.find(row=>row['Row type']==='Skills fresh transfer');
 assert.ok(modeled); assert.ok(transferRow); assert.equal(transferRow['Items scored'],0);
 assert.equal(csv.filter(row=>row['Row type']==='Skills practice response').length,1);
});
