import assert from "node:assert/strict";
import test from "node:test";

import { createSimpleStudentProgressWorkbook } from "../../src/utils/exportStudentProgressSimple.js";

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
  assert.doesNotMatch(
    workbook.getWorksheet("Data").getSheetValues().flat(3).join(" "),
    /private-student-id|private-attempt|private-question/i
  );
});
