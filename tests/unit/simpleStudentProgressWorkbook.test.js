import assert from "node:assert/strict";
import test from "node:test";

import { createSimpleStudentProgressWorkbook } from "../../src/utils/exportStudentProgressSimple.js";
import { buildStudentReportingWorkspaceModel } from "../../src/data/studentReportingWorkspaceModel.js";

function rowsAsObjects(sheet) {
  const headers = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, column) => {
    headers[column] = cell.text;
  });
  return Array.from({ length: sheet.actualRowCount - 1 }, (_, index) => {
    const row = sheet.getRow(index + 2);
    return Object.fromEntries(headers.flatMap((header, column) => (
      header ? [[header, row.getCell(column).text]] : []
    )));
  });
}

test("simple progress workbook stays readable and retains the complete evidence ledger", async () => {
  const workspace = {
    generatedAt: "2026-08-15T06:00:00.000Z",
    student: { id: "private-student-id", name: "Aarav" },
    wholeChild: {
      concepts: [{
        conceptId: "initial-m",
        domain: "phonological_awareness",
        construct: "initial_sound",
        key: "m",
        label: "Initial sound /m/",
        status: { id: "developing", label: "Developing" },
        evidenceBasis: {
          observations: 3,
          independentAttempts: 3,
          correct: 2,
          accuracy: 66.7
        }
      }]
    },
    skillsCheck: {
      skills: [{
        skillName: "Initial Sounds",
        currentStatus: "developing",
        attemptCount: 2,
        latestCorrectCount: 2,
        latestTotalQuestions: 3,
        accuracy: 66.7,
        latestAt: "2026-08-14T10:00:00.000Z"
      }],
      items: [{
        concept: { label: "Initial sound /m/" },
        status: "developing",
        details: { observations: 2, correct: 1, accuracy: 50 },
        observedAt: "2026-08-14T10:00:00.000Z"
      }],
      attempts: [1, 2].map(number => ({
        attemptId: `private-attempt-${number}`,
        status: "completed",
        correctCount: 1,
        totalQuestions: 1,
        accuracy: 100,
        completedAt: `2026-08-1${number}T10:00:00.000Z`,
        raw: {
          skillName: "Initial Sounds",
          questionRecords: [{
            questionId: `private-question-${number}`,
            responseStatus: "correct",
            isCorrect: true,
            prompt: "Which word starts with /m/?",
            selectedAnswer: "moon",
            correctAnswer: "moon"
          }]
        }
      }))
    }
  };

  const workbook = await createSimpleStudentProgressWorkbook(workspace, {
    studentName: "Aarav",
    className: "Audit Class A",
    generatedAt: new Date("2026-08-15T06:00:00.000Z")
  });

  assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), ["Report", "Skills", "Data"]);
  const rows = rowsAsObjects(workbook.getWorksheet("Data"));
  assert.equal(rows.filter(row => row["Row type"] === "Assessment attempt").length, 2);
  assert.equal(rows.filter(row => row["Row type"] === "Question result").length, 2);
  assert.ok(rows.some(row => row.Field === "Student" && row.Value === "Aarav"));
  assert.ok(rows.some(row => row.Field === "Class" && row.Value === "Audit Class A"));
  assert.deepEqual(rows.filter(row => row["Row type"] === "Assessment attempt").map(row => row["Attempt ID"]), ["private-attempt-1", "private-attempt-2"]);
  assert.deepEqual(rows.filter(row => row["Row type"] === "Question result").map(row => row["Question ID"]), ["private-question-1", "private-question-2"]);
  assert.ok(rows.some(row => row.Field === "Student ID" && row.Value === "private-student-id"));
  for (const name of ["Report", "Skills"]) {
    assert.doesNotMatch(workbook.getWorksheet(name).getSheetValues().flat(3).join(" "), /private-student-id|private-attempt|private-question/i);
  }
});

test("the downloadable workbook includes saved Adventure teaching detail without scoring old aggregate practice", async () => {
  const completedAt = "2026-09-28T10:00:00.000Z";
  const workspace = buildStudentReportingWorkspaceModel({
    studentId: "synthetic-workbook",
    adventureMap: { schemaVersion: 2, progressEpoch: 2, cycles: {
      "cycle-1": { plays: 2, lastPlayedAt: completedAt, lastCheck: { version: 1, source: "adventure_map", completedAt, questionRecords: [
        { questionId: "saved-first", itemKey: "m", construct: "initial_sound", responseStatus: "incorrect", isCorrect: false, selectedAnswer: "net", correctAnswer: "moon" }
      ] } },
      "cycle-2": { plays: 1, lastPlayedAt: completedAt, stars: 3 }
    } }
  });
  const workbook = await createSimpleStudentProgressWorkbook(workspace, { generatedAt: new Date(completedAt) });
  const reportText = workbook.getWorksheet("Report").getSheetValues().flat(3).join(" ");
  assert.match(reportText, /From the latest saved questions/);
  assert.match(reportText, /0 of 1 independent responses correct/);
  assert.match(reportText, /fresh pictured word/);
  const rows = rowsAsObjects(workbook.getWorksheet("Data"));
  const detailed = rows.find(row => row["Row type"] === "Adventure Map practice target");
  assert.equal(detailed.Target, "m");
  assert.equal(detailed["Independent responses"], "1");
  assert.equal(detailed["Recorded contrasts"], "Selected net; expected moon (1)");
  const runs = rows.filter(row => row["Row type"] === "Adventure Map latest run");
  assert.equal(runs.length, 2);
  assert.ok(runs.some(row => row["Independent responses"] === ""));
});
