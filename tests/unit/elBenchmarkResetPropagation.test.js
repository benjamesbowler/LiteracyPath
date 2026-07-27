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
import { clearLocalElAssessmentDataForStudent } from "../../src/utils/elAssessmentReset.js";

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
    studentId: "student-target",
    elBenchmarkSession: { studentId: "student-target", sessionId: "legacy-target-draft" },
    assessmentHistory: [
      attemptFixture({ attemptId: "legacy-target-attempt", studentId: "student-target", studentName: "Ada" }),
      attemptFixture({ attemptId: "legacy-classmate-attempt", studentId: "student-classmate", studentName: "Leo" })
    ],
    unrelatedPreference: "keep-me"
  }));

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
  assert.equal(result.reportsDeleted, 3);
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
    new Set(["different-ada-individual", "class-without-target", "classmate-individual"])
  );
  assert.deepEqual(JSON.parse(storage.getItem("readingMasteryProfile:teacher-1")), {
    studentId: "student-target",
    assessmentHistory: [
      attemptFixture({ attemptId: "legacy-classmate-attempt", studentId: "student-classmate", studentName: "Leo" })
    ],
    unrelatedPreference: "keep-me"
  });
});

test("reset propagation is wired through tombstone hydration, live App state, and every teacher/admin deletion path", async () => {
  const [progressSource, appControllerSource, sessionControllerSource, reportStoreSource] = await Promise.all([
    readFile(new URL("../../src/utils/progressSync.js", import.meta.url), "utf8"),
    readFile(new URL("../../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../src/appState/useAppSessionController.js", import.meta.url), "utf8"),
    readFile(new URL("../../src/data/elAssessmentReportStore.js", import.meta.url), "utf8")
  ]);
  const appSource = `${appControllerSource}\n${sessionControllerSource}`;

  assert.match(progressSource, /async function applyResetTombstone\(session, rows\)/);
  assert.match(
    progressSource,
    /await clearLocalElAssessmentDataForStudent\([\s\S]*?teacherId: session\.teacherId[\s\S]*?studentId[\s\S]*?storage: window\.localStorage[\s\S]*?localStorage\.setItem\(markerKey, cloudResetAt\)/,
    "the reset marker must only advance after EL caches are cleared"
  );
  assert.match(progressSource, /const resetApplied = await applyResetTombstone\(session, rows\)/);

  assert.match(appSource, /window\.addEventListener\("lp-progress-hydrated", handleRemoteProgressHydration\)/);
  assert.match(appSource, /setAssessmentHistory\(previous => previous\.filter/);
  assert.match(appSource, /setElBenchmarkSession\(previous => \([\s\S]*?previous\?\.studentId === resetStudentId \? null : previous/);
  // 2026-07-27: the EL hub became the Checks funnel, so a discarded draft lands there.
  assert.match(appSource, /appView === APP_VIEWS\.EL_BENCHMARK[\s\S]*?setAppView\(APP_VIEWS\.ASSESSMENTS\)/);
  assert.match(appSource, /assessmentResetAtByStudentRef[\s\S]*?resetAtOrBefore: resetAt/, "an older in-flight history response can resurrect reset evidence");

  const adminStudentBlock = appSource.match(/async function executeAdminDeleteStudent[\s\S]*?async function adminSetTeacherSchool/)?.[0] || "";
  const adminClassBlock = appSource.match(/async function executeAdminDeleteClass[\s\S]*?async function updateTeacherAccountStatus/)?.[0] || "";
  const teacherResetBlock = appSource.match(/async function resetSelectedStudentProgress[\s\S]*?async function loadStudentProgress/)?.[0] || "";
  assert.match(adminStudentBlock, /deleteSavedClassElAssessmentReportsForStudent\([\s\S]*?supabase/);
  assert.match(adminClassBlock, /\.select\("id, name, teacher_id"\)[\s\S]*?deleteSavedClassElAssessmentReportsForStudent\([\s\S]*?supabase/);
  assert.match(teacherResetBlock, /deleteSavedClassElAssessmentReportsForStudent\([\s\S]*?supabase/);
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
