import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  deleteAssessmentAttemptsForStudent,
  loadAssessmentAttempts
} from "../../src/data/assessmentHistoryStore.js";
import {
  deleteSavedClassElAssessmentReportsForStudent,
  getSavedElAssessmentReports,
  saveElAssessmentReport
} from "../../src/data/elAssessmentReportStore.js";
import {
  loadElBenchmarkDraft,
  saveElBenchmarkDraft
} from "../../src/appState/studentSessionHelpers.js";
import {
  LEARNER_EVIDENCE_CLEANUP_STORES,
  clearLocalElAssessmentDataForStudent
} from "../../src/utils/elAssessmentReset.js";

function createLocalStorage() {
  const values = new Map();
  return {
    clear() {
      values.clear();
    },
    get length() {
      return values.size;
    },
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    key(index) {
      return [...values.keys()][index] || null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}

function attemptFixture({ attemptId, studentId, studentName }) {
  return {
    attemptId,
    studentId,
    studentName,
    classId: "class-1",
    teacherId: "teacher-1",
    assessmentType: "el_encoding",
    skillId: "el_encoding",
    skillName: "EL Encoding",
    skillLevel: 1,
    startedAt: "2026-07-21T08:00:00.000Z",
    completedAt: "2026-07-21T08:05:00.000Z",
    totalQuestions: 1,
    correctCount: 1,
    accuracy: 100,
    status: "completed",
    questionRecords: [],
    schemaVersion: 2
  };
}

function reportFixture(overrides = {}) {
  return {
    reportId: "report-1",
    reportType: "individual",
    classId: "class-1",
    studentId: "student-target",
    studentName: "Ada",
    teacherId: "teacher-1",
    generatedAt: "2026-07-21T09:00:00.000Z",
    fileName: "assessment-report.xlsx",
    schemaVersion: 2,
    summary: {},
    ...overrides
  };
}

test("a synced reset removes only the target learner from every local EL assessment cache", async t => {
  const previousStorage = globalThis.localStorage;
  const storage = createLocalStorage();
  globalThis.localStorage = storage;
  t.after(() => {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  });

  saveElBenchmarkDraft({
    teacherId: "teacher-1",
    studentId: "student-target",
    session: { studentId: "student-target", sessionId: "target-draft" },
    storage
  });
  saveElBenchmarkDraft({
    teacherId: "teacher-1",
    studentId: "student-classmate",
    session: { studentId: "student-classmate", sessionId: "classmate-draft" },
    storage
  });
  storage.setItem("lpAssessmentHistory:v1:teacher-1", JSON.stringify([
    attemptFixture({ attemptId: "target-attempt", studentId: "student-target", studentName: "Ada" }),
    attemptFixture({ attemptId: "legacy-target-attempt", studentId: "", studentName: "Ada" }),
    attemptFixture({ attemptId: "different-ada-attempt", studentId: "student-other-ada", studentName: "Ada" }),
    attemptFixture({ attemptId: "classmate-attempt", studentId: "student-classmate", studentName: "Leo" })
  ]));
  storage.setItem("readingMasteryProfile:teacher-1", JSON.stringify({
    teacherStudentName: "Ada",
    teacherStudentId: "student-target",
    studentName: "Ada",
    studentId: "student-target",
    assessmentMode: "el",
    currentSkillIndex: 4,
    roundAnswers: [true],
    roundItemKeys: ["sound:a"],
    roundQuestionIds: ["question-1"],
    usedByStage: { initial: ["question-1"] },
    mastery: { initial_sounds: true },
    totalAnswered: 8,
    correctAnswered: 7,
    letterIndex: 1,
    letterAssessment: [{ letter: "a", correct: true }],
    patternIndex: 2,
    patternAssessment: [{ pattern: "sh", correct: true }],
    patternAttempt: 3,
    answerHistory: [{ studentId: "student-target", correct: true }],
    itemMastery: { "sound:a": { studentId: "student-target", mastered: true } },
    elBenchmarkSession: { studentId: "student-target", sessionId: "legacy-target-draft" },
    assessmentHistory: [
      attemptFixture({ attemptId: "legacy-target-attempt", studentId: "student-target", studentName: "Ada" }),
      attemptFixture({ attemptId: "legacy-classmate-attempt", studentId: "student-classmate", studentName: "Leo" })
    ],
    unrelatedPreference: "keep-me"
  }));
  storage.setItem(
    "guidedReadingAssessment:teacher-1:student-target",
    JSON.stringify({ studentId: "student-target", response: "target evidence" })
  );
  storage.setItem(
    "literacy-guide:manual-assessment-draft:v1:teacher-1:student-target",
    JSON.stringify({ studentId: "student-target", response: "target evidence" })
  );
  storage.setItem(
    "lp-student-session-v1",
    JSON.stringify({ studentId: "student-target", token: "local-token" })
  );

  await saveElAssessmentReport(reportFixture({ reportId: "target-individual" }), { teacherId: "teacher-1" });
  await saveElAssessmentReport(reportFixture({
    reportId: "legacy-target-individual",
    studentId: "",
    generatedAt: "2026-07-21T09:00:30.000Z"
  }), { teacherId: "teacher-1" });
  await saveElAssessmentReport(reportFixture({
    reportId: "different-ada-individual",
    studentId: "student-other-ada",
    generatedAt: "2026-07-21T09:00:45.000Z"
  }), { teacherId: "teacher-1" });
  await saveElAssessmentReport(reportFixture({
    reportId: "class-with-target",
    reportType: "whole_class",
    studentId: "",
    studentName: "",
    generatedAt: "2026-07-21T09:01:00.000Z",
    studentRows: [
      { studentId: "student-target", studentName: "Ada" },
      { studentId: "student-classmate", studentName: "Leo" }
    ]
  }), { teacherId: "teacher-1" });
  await saveElAssessmentReport(reportFixture({
    reportId: "class-without-target",
    reportType: "whole_class",
    studentId: "",
    studentName: "",
    generatedAt: "2026-07-21T09:02:00.000Z",
    studentRows: [{ studentId: "student-classmate", studentName: "Leo" }]
  }), { teacherId: "teacher-1" });
  await saveElAssessmentReport(reportFixture({
    reportId: "classmate-individual",
    studentId: "student-classmate",
    studentName: "Leo",
    generatedAt: "2026-07-21T09:03:00.000Z"
  }), { teacherId: "teacher-1" });

  const result = await clearLocalElAssessmentDataForStudent({
    teacherId: "teacher-1",
    studentId: "student-target",
    studentName: "Ada",
    storage
  });

  assert.equal(result.draftsDeleted, 1);
  assert.equal(result.legacyDraftsDeleted, 1);
  assert.equal(result.attemptsDeleted, 2);
  assert.equal(result.reportsDeleted, 2);
  assert.equal(result.reportsRedacted, 1);
  assert.equal(result.teacherProfilesSanitized, 1);
  assert.equal(result.guidedReadingAssessmentsDeleted, 1);
  assert.equal(result.manualAssessmentDraftsDeleted, 1);
  assert.equal(result.storageAvailable, true);
  assert.equal(result.residualCount, 0);
  assert.deepEqual(result.storesChecked, LEARNER_EVIDENCE_CLEANUP_STORES);
  assert.equal(
    storage.getItem("guidedReadingAssessment:teacher-1:student-target"),
    null
  );
  assert.equal(
    storage.getItem(
      "literacy-guide:manual-assessment-draft:v1:teacher-1:student-target"
    ),
    null
  );
  assert.equal(storage.getItem("lp-student-session-v1"), null);
  assert.equal(loadElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-target", storage }), null);
  assert.equal(
    loadElBenchmarkDraft({ teacherId: "teacher-1", studentId: "student-classmate", storage })?.sessionId,
    "classmate-draft"
  );
  assert.deepEqual(
    new Set(loadAssessmentAttempts({ teacherId: "teacher-1" }).map(attempt => attempt.attemptId)),
    new Set(["different-ada-attempt", "classmate-attempt"])
  );
  assert.deepEqual(
    new Set(getSavedElAssessmentReports({ teacherId: "teacher-1" }).map(report => report.reportId)),
    new Set([
      "different-ada-individual",
      "class-with-target",
      "class-without-target",
      "classmate-individual"
    ])
  );
  const redactedClassReport = getSavedElAssessmentReports({ teacherId: "teacher-1" })
    .find(report => report.reportId === "class-with-target");
  assert.deepEqual(redactedClassReport.studentRows, [
    { studentId: "student-classmate", studentName: "Leo" }
  ]);
  assert.deepEqual(JSON.parse(storage.getItem("readingMasteryProfile:teacher-1")), {
    assessmentHistory: [
      attemptFixture({ attemptId: "legacy-classmate-attempt", studentId: "student-classmate", studentName: "Leo" })
    ],
    unrelatedPreference: "keep-me"
  });
});

test("unreadable learner caches are removed and cleanup fails closed if removal cannot be proved", async t => {
  const previousStorage = globalThis.localStorage;
  const storage = createLocalStorage();
  globalThis.localStorage = storage;
  t.after(() => {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  });

  storage.setItem("readingMasteryProfile:teacher-1", "{not-json");
  storage.setItem("lp-student-session-v1", "{not-json");
  const result = await clearLocalElAssessmentDataForStudent({
    teacherId: "teacher-1",
    studentId: "student-target",
    studentName: "Ada",
    storage
  });

  assert.equal(result.malformedProfilesRemoved, 1);
  assert.equal(storage.getItem("readingMasteryProfile:teacher-1"), null);
  assert.equal(storage.getItem("lp-student-session-v1"), null);
  assert.deepEqual(result.storesChecked, LEARNER_EVIDENCE_CLEANUP_STORES);

  const refusingStorage = createLocalStorage();
  refusingStorage.setItem("readingMasteryProfile:teacher-1", "{not-json");
  const removeItem = refusingStorage.removeItem;
  refusingStorage.removeItem = key => {
    if (key === "readingMasteryProfile:teacher-1") return;
    removeItem.call(refusingStorage, key);
  };
  globalThis.localStorage = refusingStorage;

  await assert.rejects(
    clearLocalElAssessmentDataForStudent({
      teacherId: "teacher-1",
      studentId: "student-target",
      studentName: "Ada",
      storage: refusingStorage
    }),
    error => error?.code === "LP_LOCAL_CLEANUP_INCOMPLETE"
  );
});

test("explicit teacher ownership protects another teacher's same-name legacy evidence", async t => {
  const previousStorage = globalThis.localStorage;
  const storage = createLocalStorage();
  globalThis.localStorage = storage;
  t.after(() => {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  });

  storage.setItem("lpAssessmentHistory:v1:teacher-a", JSON.stringify([
    attemptFixture({
      attemptId: "teacher-a-legacy-aaron",
      studentId: "",
      studentName: "Aaron"
    })
  ]));
  storage.setItem("lpAssessmentHistory:v1:teacher-b", JSON.stringify([
    attemptFixture({
      attemptId: "teacher-b-legacy-aaron",
      studentId: "",
      studentName: "Aaron"
    })
  ]));
  storage.setItem("lpElAssessmentReports:v1:teacher-a", JSON.stringify([
    reportFixture({
      reportId: "teacher-a-legacy-aaron",
      studentId: "",
      studentName: "Aaron",
      teacherId: "teacher-a"
    })
  ]));
  storage.setItem("lpElAssessmentReports:v1:teacher-b", JSON.stringify([
    reportFixture({
      reportId: "teacher-b-legacy-aaron",
      studentId: "",
      studentName: "Aaron",
      teacherId: "teacher-b"
    })
  ]));

  const result = await clearLocalElAssessmentDataForStudent({
    teacherId: "teacher-a",
    studentId: "teacher-a-student-aaron",
    studentName: "Aaron",
    storage
  });

  assert.deepEqual(result.teacherIds, ["teacher-a"]);
  assert.equal(loadAssessmentAttempts({ teacherId: "teacher-a" }).length, 0);
  assert.deepEqual(
    loadAssessmentAttempts({ teacherId: "teacher-b" }).map(row => row.attemptId),
    ["teacher-b-legacy-aaron"]
  );
  assert.equal(getSavedElAssessmentReports({ teacherId: "teacher-a" }).length, 0);
  assert.deepEqual(
    getSavedElAssessmentReports({ teacherId: "teacher-b" }).map(row => row.reportId),
    ["teacher-b-legacy-aaron"]
  );
});

test("practice reset retains formal evidence while every learner deletion clears and verifies local caches", async () => {
  const [
    progressSource,
    appControllerSource,
    sessionControllerSource,
    teacherStudentsSource,
    dataRightsDialogSource,
    reportStoreSource
  ] = await Promise.all([
    readFile(new URL("../../src/utils/progressSync.js", import.meta.url), "utf8"),
    readFile(new URL("../../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/appState/useAppSessionController.js", import.meta.url), "utf8"),
    readFile(new URL("../../src/components/TeacherStudentsPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/components/teacher/LearnerDataRightsDialog.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/data/elAssessmentReportStore.js", import.meta.url), "utf8")
  ]);
  const appSource = `${appControllerSource}\n${sessionControllerSource}`;

  assert.match(progressSource, /async function applyResetTombstone\(session, rows\)/);
  assert.match(
    progressSource,
    /clearAndVerifyLocalProgressForStudent\(studentId,[\s\S]*?preserveProfile: true[\s\S]*?localStorage\.setItem\(markerKey, cloudResetAt\)/,
    "the reset marker must only advance after practice caches are cleared"
  );
  assert.doesNotMatch(
    progressSource.match(/async function applyResetTombstone[\s\S]*?\n\}/)?.[0] || "",
    /clearLocalElAssessmentDataForStudent|deleteAssessmentAttemptsForStudent/,
    "a practice reset must not delete formal assessment evidence"
  );
  assert.match(progressSource, /const resetApplied = await applyResetTombstone\(session, rows\)/);

  assert.match(appSource, /window\.addEventListener\("lp-progress-hydrated", handleRemoteProgressHydration\)/);
  assert.match(appSource, /Completed assessments and formal assessment records were kept/);
  assert.doesNotMatch(appControllerSource, /assessmentResetAtByStudentRef|deleteAssessmentAttemptsForStudent/);

  const adminStudentBlock = appSource.match(/async function executeAdminDeleteStudent[\s\S]*?async function adminSetTeacherSchool/)?.[0] || "";
  const teacherResetBlock = appSource.match(/async function resetSelectedStudentProgress[\s\S]*?async function loadStudentProgress/)?.[0] || "";
  assert.match(adminStudentBlock, /deleteRosterStudent\([\s\S]*?cleanup: async \(\) =>[\s\S]*?clearAndVerifyLocalProgressForStudent[\s\S]*?clearLocalElAssessmentDataForStudent/);
  assert.match(teacherStudentsSource, /deleteRosterStudent\([\s\S]*?cleanup: \(\) => forgetStudentOnThisDevice/);
  assert.match(teacherStudentsSource, /clearAndVerifyLocalProgressForStudent[\s\S]*?clearLocalElAssessmentDataForStudent/);
  assert.match(
    dataRightsDialogSource,
    /deleteLearnerData\([\s\S]*?clearAndVerifyLocalProgressForStudent[\s\S]*?clearLocalElAssessmentDataForStudent[\s\S]*?completeLearnerDeletion\(/,
    "the privacy request must complete only after both local cleanup layers"
  );
  assert.match(teacherResetBlock, /teacher_reset_student_progress/);
  assert.match(teacherResetBlock, /clearAndVerifyLocalProgressForStudent\([\s\S]*?allowFutureWritesAfterCleanup: true/);
  assert.match(teacherResetBlock, /preserveEngagement: true/);
  assert.match(teacherResetBlock, /preserveProfile: true/);
  assert.match(teacherResetBlock, /preserveAreas: PRACTICE_RESET_RETAINED_AREAS/);
  assert.doesNotMatch(teacherResetBlock, /deleteSavedClassElAssessmentReportsForStudent|clearLocalElAssessmentDataForStudent/);
  assert.match(reportStoreSource, /throwOnCloudError: true/, "destructive cleanup must not silently ignore a failed cloud read");
});

test("destructive class-report cleanup fails closed when cloud history cannot be read", async t => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage();
  t.after(() => {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  });

  const cloudReadError = new Error("cloud report history unavailable");
  const failingSupabase = {
    table() {
      const builder = {
        select() { return builder; },
        eq() { return builder; },
        order() { return builder; },
        range() { return Promise.resolve({ data: null, error: cloudReadError }); }
      };
      return builder;
    }
  };

  await assert.rejects(
    deleteSavedClassElAssessmentReportsForStudent({
      teacherId: "teacher-1",
      studentId: "student-target",
      supabase: failingSupabase
    }),
    /cloud report history unavailable/
  );
});

test("a late history response drops pre-reset evidence without deleting a genuinely newer attempt", t => {
  const previousStorage = globalThis.localStorage;
  const storage = createLocalStorage();
  globalThis.localStorage = storage;
  t.after(() => {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  });

  storage.setItem("lpAssessmentHistory:v1:teacher-1", JSON.stringify([
    attemptFixture({ attemptId: "before-reset", studentId: "student-target", studentName: "Ada" }),
    {
      ...attemptFixture({ attemptId: "after-reset", studentId: "student-target", studentName: "Ada" }),
      startedAt: "2026-07-21T10:00:00.000Z",
      completedAt: "2026-07-21T10:05:00.000Z"
    },
    attemptFixture({ attemptId: "classmate", studentId: "student-classmate", studentName: "Leo" })
  ]));

  deleteAssessmentAttemptsForStudent({
    teacherId: "teacher-1",
    studentId: "student-target",
    resetAtOrBefore: "2026-07-21T09:00:00.000Z"
  });

  assert.deepEqual(
    new Set(loadAssessmentAttempts({ teacherId: "teacher-1" }).map(record => record.attemptId)),
    new Set(["after-reset", "classmate"])
  );
});
