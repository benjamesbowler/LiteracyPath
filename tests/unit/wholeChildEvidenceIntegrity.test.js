import assert from "node:assert/strict";
import test from "node:test";

import { buildStudentReportingWorkspaceModel } from "../../src/data/studentReportingWorkspaceModel.js";
import { REPORTING_STATUS_IDS } from "../../src/data/reportingEvidenceModel.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";

const student = {
  id: "student-evidence-integrity",
  name: "Bao",
  classId: "class-a"
};

function skillsCheckAttempt({
  attemptId,
  completedAt,
  skillId,
  questions
}) {
  const correctCount = questions.filter(question => question.isCorrect).length;
  return {
    attemptId,
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    assessmentType: "skill_checkpoint",
    skillId,
    skillName: skillId.replaceAll("_", " "),
    administrationStatus: "completed",
    completedAt,
    totalQuestions: questions.length,
    correctCount,
    accuracy: Math.round((correctCount / questions.length) * 100),
    questionRecords: questions
  };
}

test("D-003: per-item timestamps remain distinct, canonical, and teacher-local", () => {
  const workspace = buildStudentReportingWorkspaceModel({
    student,
    soundSeekersReport: {
      lastActiveAt: "2026-07-24T09:00:00.000Z",
      heat: [
        {
          id: "c",
          label: "c",
          bucket: "reteach",
          seen: 3,
          independentSeen: 3,
          accuracy: 33,
          lastActiveAt: "2026-07-21T01:23:42.811Z"
        },
        {
          id: "s",
          label: "s",
          bucket: "almost",
          seen: 2,
          independentSeen: 2,
          accuracy: 50,
          lastActiveAt: "2026-07-22T02:34:53.922Z"
        }
      ]
    }
  });

  const rows = buildStudentWorkspaceCsvRows("other-learning", workspace, {
    generatedAt: "2026-07-24T09:00:00.000Z",
    timeZone: "Asia/Shanghai"
  }).filter(row => row["Learning area"] === "Sound Seekers");

  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row["Last evidence (UTC)"]), [
    "2026-07-21T01:23:42.811Z",
    "2026-07-22T02:34:53.922Z"
  ]);
  assert.equal(new Set(rows.map(row => row["Last evidence (UTC)"])).size, 2);
  assert.ok(rows.every(row => row["Evidence time basis"] === "Per-sound last evidence"));
  assert.ok(rows.every(row => row["Time zone"] === "Asia/Shanghai"));
  assert.ok(rows.every(row => row["Teacher-local evidence time"].endsWith("(Asia/Shanghai)")));
  assert.ok(rows.every(row => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(row["Last evidence (UTC)"])));
  assert.ok(rows.every(row => !Object.hasOwn(row, "Latest evidence")));
});

test("D-004: Whole Child reconciles related sound evidence and exports an honest evidence basis", () => {
  const letterAttempt = skillsCheckAttempt({
    attemptId: "letter-c",
    completedAt: "2026-07-20T01:00:00.000Z",
    skillId: "letter_sounds",
    questions: [{
      questionId: "letter-c-uppercase",
      itemType: "letter_sound",
      targetLetter: "C",
      itemKey: "c",
      isCorrect: false,
      responseStatus: "incorrect",
      timestamp: "2026-07-20T01:00:05.000Z"
    }]
  });
  const workspace = buildStudentReportingWorkspaceModel({
    student,
    assessmentHistory: [letterAttempt],
    soundSeekersReport: {
      heat: [{
        id: "c",
        label: "c",
        bucket: "almost",
        seen: 4,
        independentSeen: 4,
        accuracy: 75,
        lastActiveAt: "2026-07-21T01:23:42.811Z"
      }]
    }
  });

  const related = workspace.wholeChild.concepts.filter(row => (
    row.key === "c"
    && ["letter_sound", "grapheme_sound"].includes(row.construct)
  ));
  assert.equal(related.length, 2);
  assert.ok(related.every(row => row.reconciliationNote?.startsWith("Triangulated related evidence")));
  assert.ok(related.every(row => row.triangulationKey === "grapheme_sound::c"));

  const rows = buildStudentWorkspaceCsvRows("whole-child", workspace, {
    timeZone: "Asia/Shanghai"
  });
  const statusRows = rows.filter(row => row.Status);
  const summaryRows = rows.filter(row => row["Row type"] === "Knowledge summary");
  const relatedRows = summaryRows.filter(row => (
    row["Knowledge or skill"]?.includes("C:")
    || row["Knowledge or skill"] === "Sound for c"
  ));
  assert.equal(relatedRows.length, 2);
  assert.ok(relatedRows.every(row => row["Reconciliation note"].includes("displayed status follows the published evidence precedence")));
  assert.ok(statusRows.every(row => Number.isFinite(Number(row.Attempts))));
  assert.ok(summaryRows.every(row => Number.isFinite(Number(row.Observations))));
  assert.ok(summaryRows.every(row => Number.isFinite(Number(row.Denominator))));
  assert.ok(statusRows.every(row => typeof row["Evidence window"] === "string" && row["Evidence window"]));
  assert.ok(statusRows.every(row => [
    "Secure",
    "Developing",
    "Needs support",
    "Not enough evidence",
    "Mixed evidence",
    "Not checked"
  ].includes(row.Status)));
});

test("D-004: phonological-awareness coverage uses phonemes and exposes unobserved items", () => {
  const attempt = skillsCheckAttempt({
    attemptId: "initial-phonemes",
    completedAt: "2026-07-20T02:00:00.000Z",
    skillId: "initial_sounds",
    questions: [
      {
        questionId: "initial-c",
        itemType: "initial_sound",
        targetSound: "c",
        itemKey: "c",
        isCorrect: true,
        responseStatus: "correct",
        timestamp: "2026-07-20T02:00:01.000Z"
      },
      {
        questionId: "initial-k",
        itemType: "initial_sound",
        targetSound: "k",
        itemKey: "k",
        isCorrect: true,
        responseStatus: "correct",
        timestamp: "2026-07-20T02:00:02.000Z"
      },
      {
        questionId: "initial-q",
        itemType: "initial_sound",
        targetSound: "q",
        itemKey: "q",
        isCorrect: false,
        responseStatus: "incorrect",
        timestamp: "2026-07-20T02:00:03.000Z"
      }
    ]
  });
  const workspace = buildStudentReportingWorkspaceModel({
    student,
    assessmentHistory: [attempt]
  });
  const initialSounds = workspace.wholeChild.concepts.filter(row => row.construct === "initial_sound");

  assert.equal(initialSounds.filter(row => row.key === "k").length, 1);
  assert.equal(initialSounds.find(row => row.key === "k").evidenceBasis.observations, 2);
  assert.equal(initialSounds.filter(row => row.key === "c").length, 0);
  assert.equal(initialSounds.filter(row => row.key === "q").length, 0);
  assert.equal(initialSounds.filter(row => row.key === "kw").length, 1);
  assert.equal(initialSounds.find(row => row.key === "kw").label, "Initial sound /kw/");

  const unseen = initialSounds.find(row => row.key === "z");
  assert.equal(unseen.status.id, REPORTING_STATUS_IDS.NOT_CHECKED);
  assert.equal(unseen.coverageLabel, "Not seen in available evidence");
  assert.deepEqual(unseen.evidenceBasis, {
    observations: 0,
    correct: null,
    total: 0,
    accuracy: null,
    attemptCount: 0,
    attemptIds: [],
    sourceCount: 0,
    windowStart: "",
    windowEnd: "",
    decisiveObservations: 0
  });
  assert.ok(workspace.wholeChild.byDomain.some(domain => (
    domain.id === "encoding" && domain.noData && domain.items.length === 0
  )));
});
