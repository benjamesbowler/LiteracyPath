import assert from "node:assert/strict";
import test from "node:test";
import { csvCell } from "../../src/utils/csvCell.js";
import { exportAssessmentAttemptsCsv } from "../../src/data/assessmentHistoryStore.js";
import { buildExportProvenanceRows, exportProvenanceCsvPreamble } from "../../src/utils/exportProvenance.js";
import { exportCycleSessionResultsCsv } from "../../src/utils/cyclePracticeReporting.js";

function decodeCell(cell) {
  assert.equal(cell[0], '"');
  assert.equal(cell.at(-1), '"');
  return cell.slice(1, -1).replaceAll('""', '"');
}

const FORMULAS = [
  '=HYPERLINK("https://example.invalid","Open")', '+SUM(1,2)', '-1+2', '@SUM(1,2)',
  '  =1+2', '\t\r\n+1', '\u0000\u001b=1', '\u007f\u0085-1',
  '\ufeff\u200b@SUM(1,2)', '\u00a0\u3000=1',
  '＝SUM(1,2)', '＋1', '－1', '＠SUM(1,2)', '\u200b﹦1', '﹢1', '﹣1'
];

test("CSV text cells neutralize formula operators after whitespace, controls and compatibility forms", () => {
  for (const value of FORMULAS) {
    assert.equal(decodeCell(csvCell(value)), `'${value}`, JSON.stringify(value));
  }
});

test("CSV encoding preserves legitimate text, quotes, Unicode and typed numbers without modifying input", () => {
  for (const value of ['Ada, "阿达"\nLine 2\r\n', "  learner_01-02  ", "-12", "+12", "0012", "e=mc²", "learner@example.invalid", "'already literal", "", null, undefined, -12, -0.5, 0, 12, true, false]) {
    const text = String(value ?? "");
    const expected = typeof value === "string" && /^[+-]/.test(value) ? `'${text}` : text;
    assert.equal(decodeCell(csvCell(value)), expected);
  }
});

test("learner-controlled attempt IDs and statuses are literal in CSV while scores and stored evidence stay intact", () => {
  const record = {
    attemptId: ' \t=HYPERLINK("https://example.invalid","attempt")',
    studentName: 'Ari, "阿里"\nSecond line', studentId: "student-1", classId: "class-1",
    skillId: "initial_sounds", skillName: "Initial sounds", skillLevel: 1,
    status: "\u200b+SUM(1,2)", totalQuestions: 2, correctCount: 1,
    completedAt: "2026-10-26T10:00:00.000Z"
  };
  const before = structuredClone(record);
  const csv = exportAssessmentAttemptsCsv([record]);
  assert.ok(csv.includes(csvCell(record.attemptId)));
  assert.ok(csv.includes(csvCell(record.status)));
  assert.ok(csv.includes(csvCell(record.studentName)));
  assert.match(csv, /"2","1","50"/);
  assert.deepEqual(record, before);
});

test("version provenance neutralizes learner version strings only at CSV serialization", () => {
  const evidence = [{ appVersion: '=HYPERLINK("https://example.invalid","v")', contentVersion: "＠SUM(1,2)" }];
  const before = structuredClone(evidence);
  const rows = buildExportProvenanceRows({ generatedAt: "2026-10-26T10:00:00.000Z", evidenceSource: evidence });
  const app = rows.find(row => row.field === "App version(s)");
  assert.equal(app.value, evidence[0].appVersion);
  const csv = exportProvenanceCsvPreamble(rows);
  assert.ok(csv.includes(csvCell(evidence[0].appVersion)));
  assert.ok(csv.includes(csvCell(evidence[0].contentVersion)));
  assert.equal(decodeCell(csvCell(evidence[0].appVersion))[0], "'");
  assert.deepEqual(evidence, before);
});

test("cycle session CSV uses the same boundary for names, IDs and statuses, retaining numeric cells and BOM", () => {
  const result = { attemptId: "\n=1+2", status: "  ＠SUM(1,2)", totalQuestions: 1, correctCount: 0, scoredQuestions: 1, accuracy: 0, practiceSeconds: -1 };
  const members = [{ student_id: "s-1", cycle_practice_result: result }];
  const before = structuredClone(members);
  const csv = exportCycleSessionResultsCsv(members, [{ id: "s-1", name: "\t +1" }]);
  assert.ok(csv.startsWith("\ufeff"));
  assert.ok(csv.includes(csvCell(result.attemptId)));
  assert.ok(csv.includes(csvCell(result.status)));
  assert.ok(csv.includes(csvCell("\t +1")));
  assert.ok(csv.includes('"-1"'));
  assert.ok(!csv.includes('"\'-1"'));
  assert.deepEqual(members, before);
});
