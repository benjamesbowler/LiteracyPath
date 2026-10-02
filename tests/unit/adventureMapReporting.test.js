import assert from "node:assert/strict";
import test from "node:test";
import { buildAdventureMapReport } from "../../src/utils/adventureMapReporting.js";
import { buildStudentReportingWorkspaceModel } from "../../src/data/studentReportingWorkspaceModel.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";

const completedAt = "2026-09-28T10:00:00.000Z";
const lastCheck = { version: 1, source: "adventure_map", completedAt, questionRecords: [
  { questionId: "first", itemKey: "m", construct: "initial_phoneme_discrimination", mechanicId: "sceneHunt", responseStatus: "incorrect", isCorrect: false, selectedAnswer: "net", correctAnswer: "moon", evidence: { independent: true } },
  { questionId: "partial", itemKey: "cat", construct: "medial_vowel_completion", mechanicId: "missingLetter", responseStatus: "supported", isCorrect: null, evidence: { independent: false, supportUsed: ["partial_spelling_model"] } }
] };
const progress = cycle => ({ schemaVersion: 2, progressEpoch: 2, cycles: { "cycle-1": { plays: 1, lastPlayedAt: completedAt, ...cycle } } });

test("Adventure teacher detail shows the latest dated first responses without granting mastery", () => {
  const input = progress({ lastCheck });
  const original = JSON.stringify(input);
  const report = buildAdventureMapReport(input);
  assert.equal(report.cycles[0].snapshotStatus, "recorded");
  assert.equal(report.cycles[0].profile.totals.scored, 1);
  assert.equal(report.cycles[0].profile.totals.incorrect, 1);
  assert.equal(report.cycles[0].profile.totals.supported, 1);
  const workspace = buildStudentReportingWorkspaceModel({ studentId: "synthetic-adventure", adventureMap: input });
  assert.equal(workspace.otherLearning.adventureMap.cycles.length, 1);
  assert.equal(workspace.otherLearning.knowledgeEvidence.length, 0);
  assert.equal(workspace.wholeChild.concepts.length, 0);
  const csv = buildStudentWorkspaceCsvRows("other-learning", workspace);
  const teaching = csv.find(row => row["Row type"] === "Adventure Map practice target");
  assert.equal(teaching["Independent correct"], 0);
  assert.equal(teaching["Independent responses"], 1);
  assert.match(teaching["Next teaching move"], /first sound/);
  assert.equal(JSON.stringify(input), original);
});

test("old aggregate data remains participation, with unknown item coverage and blank exported score", () => {
  const input = progress({ stars: 3, lastIndependent: 12, lastTotal: 12 });
  const report = buildAdventureMapReport(input);
  assert.equal(report.cycles[0].snapshotStatus, "not_recorded");
  assert.equal(report.cycles[0].profile.totals.scored, 0);
  assert.match(report.cycles[0].profile.summary, /coverage are unknown/);
  const csv = buildStudentWorkspaceCsvRows("other-learning", { otherLearning: { adventureMap: report } });
  assert.equal(csv.find(row => row["Row type"] === "Adventure Map latest run")["Independent responses"], "");
});

test("invalid source, version, date and stale snapshots cannot be interpreted as latest evidence", () => {
  for (const changes of [{ version: 2 }, { source: "assessment" }, { completedAt: "bad" }, { completedAt: "2026-09-27T10:00:00.000Z" }, { questionRecords: {} }]) {
    const report = buildAdventureMapReport(progress({ lastCheck: { ...lastCheck, ...changes } }));
    assert.equal(report.cycles[0].snapshotStatus, "unverified");
    assert.equal(report.cycles[0].profile.totals.scored, 0);
  }
  assert.deepEqual(buildAdventureMapReport({ schemaVersion: 1, cycles: progress({ lastCheck }).cycles }).cycles, []);
  assert.deepEqual(buildAdventureMapReport().cycles, []);
});


test("Adventure modeled recovery remains visible before a whole station completes and CSV keeps roles separate", async () => {
 const {createLearningResponseEpisode,commitLearningResponse,advanceLearningResponseReceipt,recordLearningGuidedAction,learningResponseCompletionEvent}=await import('../../src/utils/learningResponseState.js');
 const question={id:'q',mechanicId:'letterPair',modelForm:'a',partnerForm:'A',answer:'A'};
 let episode=createLearningResponseEpisode({id:'episode',instrument:'adventure_map',question,expected:'A',transfer:{question:{...question,id:'fresh',modelForm:'b',partnerForm:'B',answer:'B'},expected:'B'}});
 episode=recordLearningGuidedAction(advanceLearningResponseReceipt(commitLearningResponse(episode,{selected:'C',correct:false})),'A');
 episode=advanceLearningResponseReceipt(commitLearningResponse(episode,{selected:'B',correct:true,supported:true}));
 const report=buildAdventureMapReport({schemaVersion:2,progressEpoch:2,cycles:{},learningResponses:[learningResponseCompletionEvent(episode)]});
 assert.equal(report.cycles.length,0);assert.equal(report.learningEpisodes.length,1);assert.equal(report.learningEpisodes[0].firstResponse.selected,'C');
 const csv=buildStudentWorkspaceCsvRows('other-learning',{otherLearning:{adventureMap:report}});
 assert.equal(csv.filter(row=>row['Row type']==='Adventure Map first response').length,1);
 assert.equal(csv.filter(row=>row['Row type']==='Adventure Map fresh transfer').length,1);
 assert.equal(csv.filter(row=>row['Row type']==='Adventure Map modeled action').length,1);
 assert.ok(csv.filter(row=>/^Adventure Map/.test(row['Row type']||'')).every(row=>row['Items scored']===0));
});
