import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAssessmentAttemptRecord,
  exportAssessmentAttemptsCsv,
  getAssessmentAttemptContractIssues,
  summarizeAssessmentHistory
} from "../../src/data/assessmentHistoryStore.js";
import { buildSkillMasterySummaryRows } from "../../src/data/skillMasterySummary.js";

function sampleAttempt() {
  return buildAssessmentAttemptRecord({
    studentId: "student-1",
    studentName: "Sample Student",
    classId: "class-1",
    teacherId: "teacher-1",
    stage: { id: "final_sounds", label: "Final Sounds" },
    checkpoint: {
      skillId: "final_sounds",
      pathStatus: { level: 1, phase: 1 },
      passed: true,
      totalCoveredItems: ["b", "d"],
      coveredThisRound: ["b"],
      coverage: { mastered: 2, total: 8, unit: "sounds" }
    },
    questionRecords: Array.from({ length: 15 }, (_, index) => ({
      questionId: `q-${index + 1}`,
      question: "Listen to the word. Which sound does it end with?",
      targetWord: index % 2 ? "web" : "tub",
      itemKey: index % 2 ? "b" : "d",
      correct: index % 2 ? "b" : "d",
      chosen: index % 2 ? "b" : "d",
      isCorrect: true,
      skillId: "final_sounds",
      itemLevel: 1,
      itemPhase: 1,
      timestamp: "2026-07-23T09:00:00.000Z"
    }))
  });
}

test("assessment history data contract still validates independently of route checks", () => {
  const attempt = sampleAttempt();
  assert.deepEqual(getAssessmentAttemptContractIssues(attempt), []);
  assert.equal(summarizeAssessmentHistory([]).attempts, 0);
  const summary = summarizeAssessmentHistory([attempt], {
    students: [{ id: "student-1", name: "Sample Student", className: "Class A" }],
    classes: [{ id: "class-1", name: "Class A" }]
  });
  assert.equal(summary.attempts, 1);
  assert.equal(summary.averageAccuracy, 100);
  const csv = exportAssessmentAttemptsCsv([attempt]);
  assert.match(csv, /Sample Student/);
  assert.match(csv, /Final Sounds/);
});

test("mastery summaries include every item without a silent top-N cap", () => {
  const itemMastery = Object.fromEntries(
    Array.from({ length: 14 }, (_, index) => [
      `word-${index + 1}`,
      {
        itemKey: `word-${String(index + 1).padStart(2, "0")}`,
        itemType: "sight_word",
        mastered: true,
        correct: 3
      }
    ])
  );
  const [summary] = buildSkillMasterySummaryRows({
    itemMastery,
    skillTree: [{ id: "high_frequency_words_1", label: "High Frequency Words 1" }],
    configuredCoverageTotals: {
      high_frequency_words_1: { unit: "words" }
    },
    getSkillIdForMasteryRow: () => "high_frequency_words_1",
    formatMasteryItemLabel: row => row.itemKey,
    getRepresentativeWordsForItem: () => [],
    normalizeItemKey: value => String(value || "").trim().toLowerCase()
  });

  assert.equal(summary.masteredCount, 14);
  assert.equal(summary.groups.length, 14);
  assert.match(summary.displayText, /word-01/);
  assert.match(summary.displayText, /word-14/);
  assert.doesNotMatch(summary.displayText, /more$/);
});
