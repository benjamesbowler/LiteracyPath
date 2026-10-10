import assert from "node:assert/strict";
import test from "node:test";
import { buildOtherLearningReportModel, buildStudentReportingWorkspaceModel } from "../../src/data/studentReportingWorkspaceModel.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";
import { REPORTING_BIBLE_POLICY } from "../../src/policy/reportingBible.js";
import { REPORT_PRIVACY_CLASSIFICATION } from "../../src/utils/exportProvenance.js";
import { buildProgressTeachNext, createSimpleStudentProgressWorkbook } from "../../src/utils/exportStudentProgressSimple.js";

const now = new Date();
const recent = new Date(now.getTime() - 86400000).toISOString();
const historical = new Date(now.getTime() - (REPORTING_BIBLE_POLICY.recency.conclusionWindowDays + 1) * 86400000).toISOString();
function response(id, overrides = {}) {
  return {
    questionId: `question-${id}`, skillId: "inference", skillName: "Inference", level: 1,
    presentationRole: "first_probe", evidenceType: "independent", responseStatus: "answered",
    isCorrect: false, answerMatch: false, supportUsed: false, validity: "valid", mediaReady: true,
    audioRequired: true, audioDelivery: "delivered", instructionDelivery: "completed", targetDelivery: "completed",
    selected: "It snowed.", expected: "It rained.", occurredAt: recent,
    itemSnapshot: { prompt: "What explains the wet path?", passage: `Independent passage ${id}: The path was wet after the dark clouds passed.`, choices: ["It snowed.", "It rained."], expected: "It rained." },
    ...overrides
  };
}
function event(id, step = response(id), overrides = {}) {
  return { id, gameId: "literacy-practice", contentVersion: "literacy-practice-v1", completedAt: recent, sessionId: "practice-session", steps: [step], ...overrides };
}
function model(events, gameOverrides = {}) {
  return buildOtherLearningReportModel({ studentId: "student-private-id", arcade: { games: {
    "literacy-practice": { practiceRecord: { v: 3, completions: events }, ...gameOverrides },
    "real-arcade-game": { plays: 1, lastPlayedAt: recent }
  } } });
}
const workspace = otherLearning => ({ student: { id: "student-private-id", name: "Learner", classId: "class-private-id" }, generatedAt: now.toISOString(), otherLearning });

test("literacy responses enter the evidence ledger as descriptive practice, never knowledge or Arcade", () => {
  const first = event("shared-event", response("one"), { steps: [response("one"), response("two", { skillId: "main_idea", skillName: "Main idea", isCorrect: true })] });
  const report = model([first], { plays: 25, lastPlayedAt: recent });
  const evidence = report.evidence.filter(row => row.sourceArea === "literacy_practice");
  assert.equal(evidence.length, 2);
  assert.equal(new Set(evidence.map(row => row.evidenceId)).size, 2);
  assert.equal(evidence.every(row => row.practiceOnly && row.descriptive && !row.scorable && !row.knowledgeEligible && row.statusCandidate === null), true);
  assert.equal(evidence[0].studentId, "student-private-id");
  assert.equal(evidence[0].provenance.contentVersion, "literacy-practice-v1");
  assert.equal(evidence[0].provenance.evidenceUse, "independent_first_probe");
  assert.equal(report.knowledgeEvidence.some(row => row.sourceArea === "literacy_practice"), false);
  assert.deepEqual(report.arcade.games.map(row => row.gameId), ["real-arcade-game"]);
  assert.equal(report.summary.literacyPracticePresentations, 2);
  assert.equal(report.summary.literacyPracticeSkillsSampled, 2);
  assert.equal(report.summary.latestAt, recent);
});

test("all supported Arcade input forms exclude literacy practice and Skills trail", () => {
  const rows = [{ gameId: "literacy-practice", plays: 1 }, { id: "skills-trail", plays: 1 }, { gameId: "arcade", plays: 1 }];
  for (const arcade of [rows, { rows }]) {
    assert.deepEqual(buildOtherLearningReportModel({ arcade }).arcade.games.map(row => row.gameId), ["arcade"]);
  }
});

test("ledger preserves conflicts as excluded evidence and duplicate event delivery does not inflate rows", () => {
  const wrong = event("conflict");
  const right = event("conflict", response("conflict", { isCorrect: true }));
  const valid = event("valid");
  const report = model([wrong, right, valid, JSON.parse(JSON.stringify(valid))]);
  const evidence = report.evidence.filter(row => row.sourceArea === "literacy_practice");
  assert.equal(evidence.length, 2);
  const excluded = evidence.find(row => row.sourceRecordId === "conflict");
  assert.equal(excluded.outcome, "conflict");
  assert.equal(excluded.provenance.conflicted, true);
  assert.equal(excluded.provenance.countedIndependent, false);
  assert.equal(excluded.scorable, false);
});

test("exports carry full literacy coverage, concrete next steps, skill-level sufficiency and item provenance", () => {
  const report = model([event("wrong"), event("right", response("right", { level: 2, isCorrect: true, answerMatch: true }))]);
  const rows = buildStudentWorkspaceCsvRows("other-learning", workspace(report), { includeIdentifiers: true, timeZone: "Asia/Shanghai" });
  const items = rows.filter(row => row["Row type"] === "Literacy practice response");
  assert.equal(items.length, 2);
  assert.deepEqual(new Set(items.map(row => row["Response ID"])), new Set(["wrong", "right"]));
  assert.equal(items.every(row => row["Items scored"] === 1 && row["Mastery claim"] === false && row["Formal assessment"] === false), true);
  assert.equal(items[0]["Audio delivery"], "delivered");
  assert.equal(items[0]["Latest result (UTC)"], recent);
  assert.match(items[0]["Teacher-local result time"], /Asia\/Shanghai/);
  assert.equal(items[0]["Domain code"], "reading");
  assert.equal(items[0]["Content version"], "literacy-practice-v1");
  const summaries = rows.filter(row => row["Row type"] === "Literacy skill sample" && row["Skill code"] === "inference");
  assert.equal(summaries.length, 2);
  assert.deepEqual(summaries.map(row => row["Practice level"]), [1, 2]);
  assert.equal(summaries.every(row => row["Evidence sufficiency code"] === "insufficient" && row["Status label"] === "Not enough results"), true);
  const next = rows.find(row => row["Row type"] === "Literacy practice next step" && row["Skill code"] === "inference");
  assert.equal(next.Section, "Teach next");
  assert.match(next["Reason"], /observed first response needs another look/);
  assert.match(next["Next teaching move"], /new passage or stimulus/);
  const missing = rows.find(row => row["Row type"] === "Literacy skill sample" && row["Coverage"] === "Not yet sampled");
  assert.ok(missing);
  assert.equal(missing["Recent independent correct"], "");
  assert.equal(missing["Recent independent to revisit"], "");
  assert.equal(missing["Items scored"], 0);
  assert.equal(missing["Status label"], "Not checked");
  assert.ok(rows.some(row => row["Row type"] === "Literacy practice data dictionary"));
  assert.ok(rows.some(row => row.Field === "Privacy classification" && row.Value === REPORT_PRIVACY_CLASSIFICATION));
  assert.ok(rows.some(row => row.Field === "Content version(s)" && row.Value.includes("literacy-practice-v1")));
  assert.ok(rows.some(row => row.Field === "Results period" && row.Value.includes(recent)));
});

test("exports never count support, transfer, repeated answers or explicit incomplete audio as independent", () => {
  const report = model([
    event("first", response("same")),
    event("repeat", response("same", { isCorrect: true, answerMatch: true, occurredAt: new Date(now.getTime() - 3600000).toISOString() })),
    event("help", response("help", { supportUsed: true, evidenceType: "supported", isCorrect: null })),
    event("transfer", response("transfer", { presentationRole: "transfer", supportUsed: true, evidenceType: "supported", isCorrect: null, answerMatch: true })),
    event("audio", response("audio", { audioDelivery: "not_delivered", targetDelivered: true, isCorrect: true })),
    event("old", response("old", { level: 2, occurredAt: historical, isCorrect: true }))
  ]);
  const rows = buildStudentWorkspaceCsvRows("other-learning", workspace(report), { includeIdentifiers: true });
  const item = id => rows.find(row => row["Row type"] === "Literacy practice response" && row["Response ID"] === id);
  for (const id of ["repeat", "help", "transfer", "audio"]) {
    assert.equal(item(id)["Items scored"], 0, id);
    assert.equal(item(id)["First response correct"], "Not scored", id);
  }
  assert.equal(item("repeat")["Answer match"], true);
  assert.equal(item("transfer")["Evidence use code"], "supported_transfer");
  assert.equal(item("audio")["Evidence use code"], "audio_not_delivered");
  assert.equal(item("old")["Recency"], "historical");
  assert.equal(item("old")["Items scored"], 1);
  const historicalLevel = rows.find(row => row["Row type"] === "Literacy skill sample" && row["Skill code"] === "inference" && row["Practice level"] === 2);
  assert.equal(historicalLevel["Items scored"], 0);
  assert.equal(historicalLevel["Recent independent correct"], "");
  assert.equal(historicalLevel["Historical independent first responses"], 1);
});

test("exports exclude a later item on the same passage while retaining its observed answer", () => {
  const first = response("shared-passage-first");
  const later = response("shared-passage-later", {
    isCorrect: true, answerMatch: true,
    occurredAt: new Date(Date.parse(recent) + 1000).toISOString(),
    itemSnapshot: { ...first.itemSnapshot }
  });
  const report = model([event("first-passage", first), event("later-passage", later)]);
  const rows = buildStudentWorkspaceCsvRows("other-learning", workspace(report), { includeIdentifiers: true });
  const firstRow = rows.find(row => row["Row type"] === "Literacy practice response" && row["Response ID"] === "first-passage");
  const laterRow = rows.find(row => row["Row type"] === "Literacy practice response" && row["Response ID"] === "later-passage");
  assert.equal(firstRow["Items scored"], 1);
  assert.equal(laterRow["Items scored"], 0);
  assert.equal(laterRow["Evidence use code"], "known_familiar");
  assert.equal(laterRow["First response correct"], "Not scored");
  assert.equal(laterRow["Answer match"], true);
  assert.equal(report.literacyPractice.totals.recentIndependentCount, 1);
  assert.equal(report.literacyPractice.totals.knownFamiliar, 1);
});

test("default export does not add learner/session identifiers and empty literacy history stays empty", () => {
  const rows = buildStudentWorkspaceCsvRows("other-learning", workspace(model([event("one")])));
  const item = rows.find(row => row["Row type"] === "Literacy practice response");
  assert.equal(Object.hasOwn(item, "Session ID"), false);
  assert.equal(Object.hasOwn(item, "Response ID"), false);
  assert.equal(Object.hasOwn(item, "Student ID"), false);
  const empty = buildOtherLearningReportModel();
  assert.equal(buildStudentWorkspaceCsvRows("other-learning", { otherLearning: empty }).length, 0);
});

test("new literacy exports leave existing Skills practice response rows intact", () => {
  const legacy = { ...event("old-skills"), gameId: "skills-trail", contentVersion: "skills-trail-v1" };
  const otherLearning = buildOtherLearningReportModel({ arcade: { games: {
    "skills-trail": { practiceRecord: { v: 3, completions: [legacy] } },
    "literacy-practice": { practiceRecord: { v: 3, completions: [event("new-literacy")] } }
  } } });
  const rows = buildStudentWorkspaceCsvRows("other-learning", { otherLearning }, { includeIdentifiers: true });
  assert.equal(rows.filter(row => row["Row type"] === "Skills practice response").length, 1);
  assert.equal(rows.filter(row => row["Row type"] === "Literacy practice response").length, 1);
  assert.equal(otherLearning.evidence.filter(row => row.sourceArea === "skills_practice").length, 1);
  assert.equal(otherLearning.evidence.filter(row => row.sourceArea === "literacy_practice").length, 1);
});

test("literacy-only workbook front sheet describes coverage and teaching without inventing proficiency", async () => {
  const otherLearning = model([event("wrong"), event("right", response("right", { isCorrect: true, answerMatch: true, level: 2 }))]);
  const book = await createSimpleStudentProgressWorkbook(workspace(otherLearning), { studentName: "Learner", generatedAt: now });
  const sheet = book.getWorksheet("Report");
  const values = [];
  sheet.eachRow(row => row.eachCell(cell => values.push(cell.value)));
  const rendered = values.join("\n");
  assert.match(rendered, /Skills sampled recently/);
  assert.match(rendered, /observed successes/);
  assert.match(rendered, /correct answer on first recorded independent attempts/);
  assert.match(rendered, /observed first response needs another look/);
  assert.match(rendered, /new passage or stimulus/);
  assert.match(rendered, /Literacy practice coverage/);
  assert.equal(values.includes("Secure"), false);
  assert.doesNotMatch(rendered, /Everything with saved results came back secure|Nothing outstanding|Why it is not secure yet/);
  assert.match(rendered, /do not establish proficiency/);
  assert.equal(sheet.getColumn("D").width, 60);
  const data = book.getWorksheet("Data");
  const dataValues = [];
  data.eachRow(row => row.eachCell(cell => dataValues.push(cell.value)));
  assert.ok(dataValues.includes("Literacy practice response"));
  assert.ok(dataValues.includes("Literacy practice next step"));
  assert.ok(dataValues.includes("Literacy practice data dictionary"));
  const bytes = await book.xlsx.writeBuffer();
  assert.ok(bytes.byteLength > 0);
});

test("absence of teaching targets never invents an all-secure conclusion", () => {
  assert.doesNotMatch(JSON.stringify(buildProgressTeachNext({})), /secure|Nothing outstanding/i);
  const report = model([event("wrong")]).literacyPractice;
  const targets = buildProgressTeachNext({}, report);
  assert.ok(targets.some(target => target.skill === "Inference" && target.area.includes("practice")));
  assert.match(targets[0].why, /another look/);
});

test("the workspace and literacy export use the same evidence-window clock", () => {
  const reportAt = "2026-01-02T12:00:00.000Z";
  const answeredAt = "2026-01-01T12:00:00.000Z";
  const result = buildStudentReportingWorkspaceModel({ student: { id: "student-private-id" }, now: Date.parse(reportAt), arcade: { games: {
    "literacy-practice": { practiceRecord: { v: 3, completions: [event("frozen-clock", response("frozen-clock", { occurredAt: answeredAt }), { completedAt: answeredAt })] } }
  } } });
  assert.equal(result.generatedAt, reportAt);
  assert.equal(result.otherLearning.literacyPractice.generatedAt, reportAt);
  assert.equal(result.otherLearning.literacyPractice.totals.recentIndependentCount, 1);
  const row = buildStudentWorkspaceCsvRows("other-learning", result).find(value => value["Row type"] === "Literacy practice response");
  assert.equal(row["Evidence window end (UTC)"], reportAt);
  assert.equal(row.Recency, "recent");
});
