import assert from "node:assert/strict";
import test from "node:test";

import {
  blockAndWaitForElAssessmentReportOperations,
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData,
  compactElAssessmentReportForStorage,
  deleteSavedClassElAssessmentReportsForStudent,
  deleteSavedElAssessmentReport,
  deleteSavedElAssessmentReportsForStudent,
  filterSavedElAssessmentReportsForClassRoster,
  getSavedClassElAssessmentReportsForStudent,
  getSavedElAssessmentReports,
  hydrateElAssessmentReports,
  redactSavedClassElAssessmentReportsForStudent,
  savedClassElAssessmentReportContainsStudent,
  saveElAssessmentReport
} from "../../src/data/elAssessmentReportStore.js";
import {
  buildElExportProvenanceRows,
  createClassElAssessmentWorkbook
} from "../../src/utils/exportElAssessmentExcel.js";

function worksheetRows(sheet) {
  const headers = sheet.getRow(1).values.slice(1).map(String);
  const rows = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    rows.push(Object.fromEntries(headers.map((header, index) => [header, row.getCell(index + 1).value])));
  }
  return rows;
}

function createLocalStorage({ maxBytes = Number.POSITIVE_INFINITY, throwOnSet = false } = {}) {
  const values = new Map();
  return {
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      if (throwOnSet) throw new Error("local storage unavailable");
      if (Buffer.byteLength(String(value), "utf8") > maxBytes) throw new Error("quota exceeded");
      values.set(key, String(value));
    }
  };
}

function createSupabaseReportMock(initialRows = []) {
  const state = {
    rejectDelete: false,
    rejectUpsert: false,
    rows: initialRows.map(row => ({ ...row })),
    selectRanges: [],
    upsertCalls: 0
  };
  return {
    state,
    call(name, payload) {
      assert.equal(name, "teacher_delete_saved_assessment_report");
      if (state.rejectDelete) {
        return Promise.resolve({
          data: null,
          error: new Error("cloud delete rejected")
        });
      }
      const before = state.rows.length;
      state.rows = state.rows.filter(row => row.report_id !== payload.p_report_id);
      return Promise.resolve({
        data: before === state.rows.length
          ? null
          : { ok: true, reportId: payload.p_report_id },
        error: before === state.rows.length
          ? new Error("report not found")
          : null
      });
    },
    table(table) {
      assert.equal(table, "el_assessment_reports");
      return {
        delete() {
          const filters = [];
          const builder = {
            eq(field, value) {
              filters.push([field, value]);
              return builder;
            },
            then(resolve, reject) {
              const result = state.rejectDelete
                ? { data: null, error: new Error("cloud delete rejected") }
                : (() => {
                    state.rows = state.rows.filter(row => !filters.every(([field, value]) => row[field] === value));
                    return { data: null, error: null };
                  })();
              return Promise.resolve(result).then(resolve, reject);
            }
          };
          return builder;
        },
        select() {
          const filters = [];
          const builder = {
            eq(field, value) {
              filters.push([field, value]);
              return builder;
            },
            order() {
              return builder;
            },
            range(from, to) {
              state.selectRanges.push([from, to]);
              const data = state.rows
                .filter(row => filters.every(([field, value]) => row[field] === value))
                .slice(from, to + 1)
                .map(row => ({ ...row }));
              return Promise.resolve({ data, error: null });
            },
            limit(limit) {
              const data = state.rows
                .filter(row => filters.every(([field, value]) => row[field] === value))
                .slice(0, limit)
                .map(row => ({ ...row }));
              return Promise.resolve({ data, error: null });
            }
          };
          return builder;
        },
        upsert(row) {
          state.upsertCalls += 1;
          if (state.rejectUpsert) return Promise.resolve({ data: null, error: new Error("cloud upsert rejected") });
          const index = state.rows.findIndex(item => item.report_id === row.report_id);
          if (index >= 0) state.rows[index] = { ...row };
          else state.rows.push({ ...row });
          return Promise.resolve({ data: [row], error: null });
        }
      };
    }
  };
}

function reportFixture(overrides = {}) {
  return {
    reportId: "report-1",
    reportType: "individual",
    teacherId: "teacher-1",
    classId: "class-1",
    studentId: "student-1",
    studentName: "Ada",
    generatedAt: "2026-07-21T08:00:00.000Z",
    fileName: "ada.xlsx",
    summary: { totalAssessments: 1 },
    formalAssessments: {
      individualBenchmarkProfile: [],
      individualBenchmarkDetails: []
    },
    sourceSnapshot: {
      records: [{
        attemptId: "attempt-1",
        questionRecords: Array.from({ length: 40 }, (_, index) => ({
          questionId: `item-${index}`,
          prompt: "Large duplicated source payload that must not be persisted."
        }))
      }]
    },
    ...overrides
  };
}

test("saved EL report actions are isolated to the selected class and its current roster", () => {
  const reports = [
    reportFixture({
      reportId: "class-a-report",
      reportType: "whole_class",
      classId: "class-a",
      studentId: ""
    }),
    reportFixture({
      reportId: "student-a-report",
      reportType: "individual",
      classId: "class-a",
      studentId: "student-a"
    }),
    reportFixture({
      reportId: "student-left-report",
      reportType: "individual",
      classId: "class-a",
      studentId: "student-left"
    }),
    reportFixture({
      reportId: "class-b-report",
      reportType: "whole_class",
      classId: "class-b",
      studentId: ""
    }),
    reportFixture({
      reportId: "student-b-report",
      reportType: "individual",
      classId: "class-b",
      studentId: "student-b"
    }),
    reportFixture({
      reportId: "legacy-name-only",
      reportType: "individual",
      classId: "class-a",
      studentId: "",
      studentName: "Ada"
    })
  ];
  const classAVisible = filterSavedElAssessmentReportsForClassRoster(reports, {
    classId: "class-a",
    students: [
      { id: "student-a", class_id: "class-a" },
      { id: "student-b", class_id: "class-b" }
    ]
  });

  assert.deepEqual(
    new Set(classAVisible.map(report => report.reportId)),
    new Set(["class-a-report", "student-a-report"])
  );
  assert.equal(
    classAVisible.some(report => report.reportId === "class-b-report"),
    false,
    "Class B exports must never expose download/delete actions in Class A"
  );
  assert.equal(
    classAVisible.some(report => report.reportId === "student-left-report"),
    false,
    "individual reports require current stable-ID roster membership"
  );
});

test("the chosen class-report date period is retained in EL export provenance", () => {
  const report = buildClassElAssessmentReportData({
    assessmentHistory: [],
    students: [],
    classes: [{ id: "class-a", name: "Class A" }],
    classId: "class-a",
    teacherId: "teacher-1",
    reportPeriod: {
      key: "last30",
      label: "Last 30 days"
    },
    now: new Date("2026-07-28T09:00:00.000Z")
  });
  assert.deepEqual(report.selectedDatePeriod, {
    key: "last30",
    label: "Last 30 days",
    start: "",
    end: ""
  });
  const filters = buildElExportProvenanceRows(report, "whole_class")
    .find(row => row.field === "Filters")?.value || "";
  assert.match(filters, /Class report date period: Last 30 days/);
});

test("learner deletion waits for stale report hydration and blocks local report resurrection", async () => {
  globalThis.localStorage = createLocalStorage();
  let finishPage;
  const staleReport = reportFixture({
    reportId: "privacy-stale-report",
    teacherId: "teacher-privacy",
    studentId: "student-privacy"
  });
  const builder = {
    eq() {
      return builder;
    },
    order() {
      return builder;
    },
    range() {
      return new Promise(resolve => {
        finishPage = resolve;
      });
    }
  };
  const client = {
    table() {
      return {
        select() {
          return builder;
        }
      };
    }
  };

  const hydration = hydrateElAssessmentReports({
    teacherId: "teacher-privacy",
    supabase: client
  });
  await new Promise(resolve => setImmediate(resolve));
  const blocked = blockAndWaitForElAssessmentReportOperations({
    teacherId: "teacher-privacy",
    studentId: "student-privacy",
    studentName: "Ada"
  });
  finishPage({
    data: [{
      report_id: staleReport.reportId,
      report_type: staleReport.reportType,
      class_id: staleReport.classId,
      student_id: staleReport.studentId,
      teacher_id: staleReport.teacherId,
      generated_at: staleReport.generatedAt,
      file_name: staleReport.fileName,
      schema_version: staleReport.schemaVersion,
      payload: staleReport
    }],
    error: null
  });
  await Promise.all([hydration, blocked]);

  assert.equal(getSavedElAssessmentReports({ teacherId: "teacher-privacy" }).length, 0);
  const rejected = await saveElAssessmentReport(staleReport, {
    teacherId: "teacher-privacy",
    supabase: client
  });
  assert.equal(rejected.durable, false);
  assert.equal(rejected.localError.code, "LP_LEARNER_WRITE_BLOCKED");
});

test("EL report data and persisted history never retain Guided Reading payloads", () => {
  const report = buildStudentElAssessmentReportData({
    assessmentHistory: [{
      attemptId: "skills-check-collision",
      assessmentType: "skill_checkpoint",
      skillId: "advanced_phonics_patterns",
      studentId: "student-1",
      administrationStatus: "completed",
      completedAt: "2026-07-20T10:00:00.000Z"
    }],
    studentId: "student-1",
    students: [{ id: "student-1", name: "Ada" }],
    guidedReadingRecords: {
      "book-1": { title: "Must stay in Guided Reading", readCount: 3 }
    }
  });
  assert.equal(report.guidedReading, undefined);
  assert.deepEqual(report.sourceAttemptIds, []);

  const compact = compactElAssessmentReportForStorage({
    ...reportFixture(),
    guidedReading: { bookRows: [{ title: "Legacy reading data" }] }
  });
  assert.equal(compact.guidedReading, undefined);
});

test("saved EL reports round-trip through cloud hydration and merge into the local cache", async t => {
  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage();
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  const supabase = createSupabaseReportMock();

  const persistence = await saveElAssessmentReport(reportFixture(), { teacherId: "teacher-1", supabase });
  assert.equal(persistence.localSaved, true);
  assert.equal(persistence.cloudSaved, true);
  assert.equal(persistence.durable, true);
  assert.equal(supabase.state.rows.length, 1);
  assert.equal(supabase.state.rows[0].payload.sourceSnapshot, undefined);
  assert.equal(supabase.state.rows[0].payload.storageSchemaVersion, 1);

  globalThis.localStorage.clear();
  const hydrated = await hydrateElAssessmentReports({ teacherId: "teacher-1", supabase });
  assert.equal(hydrated.length, 1);
  assert.equal(hydrated[0].reportId, "report-1");
  assert.ok(hydrated[0].formalAssessments, "export-critical formal evidence must survive compaction");
  assert.equal(getSavedElAssessmentReports({ teacherId: "teacher-1" }).length, 1);
});

test("local quota or private-mode failure never blocks the cloud upsert", async t => {
  const priorStorage = globalThis.localStorage;
  const priorWarn = console.warn;
  globalThis.localStorage = createLocalStorage({ throwOnSet: true });
  console.warn = () => {};
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
    console.warn = priorWarn;
  });
  const supabase = createSupabaseReportMock();

  const persistence = await saveElAssessmentReport(reportFixture(), { teacherId: "teacher-1", supabase });
  assert.equal(supabase.state.upsertCalls, 1);
  assert.equal(supabase.state.rows[0].report_id, "report-1");
  assert.equal(persistence.localSaved, false);
  assert.equal(persistence.cloudSaved, true);
  assert.equal(persistence.durable, true);
});

test("a local quota failure plus a rejected cloud upsert returns an explicit non-durable result", async t => {
  const priorStorage = globalThis.localStorage;
  const priorWarn = console.warn;
  globalThis.localStorage = createLocalStorage({ throwOnSet: true });
  console.warn = () => {};
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
    console.warn = priorWarn;
  });
  const supabase = createSupabaseReportMock();
  supabase.state.rejectUpsert = true;

  const persistence = await saveElAssessmentReport(reportFixture(), { teacherId: "teacher-1", supabase });
  assert.equal(persistence.localSaved, false);
  assert.equal(persistence.cloudSaved, false);
  assert.equal(persistence.durable, false);
  assert.ok(persistence.localError instanceof Error);
  assert.ok(persistence.cloudError instanceof Error);
  assert.equal(supabase.state.rows.length, 0);
});

test("cloud hydration treats relational ownership columns as authoritative over payload claims", async t => {
  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage();
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  const supabase = createSupabaseReportMock([{
    report_id: "relational-report",
    report_type: "whole_class",
    class_id: "relational-class",
    student_id: null,
    teacher_id: "teacher-1",
    generated_at: "2026-07-21T09:00:00.000Z",
    file_name: "relational.xlsx",
    schema_version: 4,
    payload: reportFixture({
      reportId: "payload-report",
      reportType: "individual",
      classId: "payload-class",
      studentId: "payload-student",
      teacherId: "payload-teacher",
      generatedAt: "1999-01-01T00:00:00.000Z",
      fileName: "payload.xlsx",
      schemaVersion: 1
    })
  }]);

  const [hydrated] = await hydrateElAssessmentReports({ teacherId: "teacher-1", supabase });
  assert.equal(hydrated.reportId, "relational-report");
  assert.equal(hydrated.reportType, "whole_class");
  assert.equal(hydrated.classId, "relational-class");
  assert.equal(hydrated.studentId, "");
  assert.equal(hydrated.teacherId, "teacher-1");
  assert.equal(hydrated.generatedAt, "2026-07-21T09:00:00.000Z");
  assert.equal(hydrated.fileName, "relational.xlsx");
  assert.equal(hydrated.schemaVersion, 4);
});

test("cloud hydration paginates beyond 5,000 saved reports without a hidden ceiling", async t => {
  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage();
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  const rows = Array.from({ length: 5005 }, (_, index) => ({
    report_id: `cloud-report-${index + 1}`,
    report_type: "individual",
    class_id: "class-1",
    student_id: `student-${index + 1}`,
    teacher_id: "teacher-1",
    generated_at: new Date(Date.UTC(2026, 6, 21, 0, 0, index)).toISOString(),
    file_name: `report-${index + 1}.xlsx`,
    schema_version: 4,
    payload: reportFixture({ reportId: `payload-${index + 1}`, sourceSnapshot: {} })
  }));
  const supabase = createSupabaseReportMock(rows);

  const hydrated = await hydrateElAssessmentReports({ teacherId: "teacher-1", supabase });
  assert.equal(hydrated.length, 5005);
  assert.equal(supabase.state.selectRanges.length, 101);
  assert.deepEqual(supabase.state.selectRanges[0], [0, 49]);
  assert.deepEqual(supabase.state.selectRanges.at(-1), [5000, 5049]);
  assert.equal(new Set(hydrated.map(report => report.reportId)).size, 5005);
});

test("saved-report hydration stops when a range adapter repeats a non-advancing full page", async t => {
  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage();
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  const repeatedPage = Array.from({ length: 50 }, (_, index) => ({
    report_id: `repeated-report-${index}`,
    report_type: "individual",
    class_id: "class-1",
    student_id: `student-${index}`,
    teacher_id: "teacher-repeat",
    generated_at: new Date(Date.UTC(2026, 6, 21, 0, 0, index)).toISOString(),
    file_name: `report-${index}.xlsx`,
    schema_version: 4,
    payload: reportFixture({ reportId: `payload-${index}`, sourceSnapshot: {} })
  }));
  const requestedRanges = [];
  const supabase = {
    table() {
      const builder = {
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        range(from, to) {
          requestedRanges.push([from, to]);
          return Promise.resolve({ data: repeatedPage, error: null });
        }
      };
      return builder;
    }
  };

  const hydrated = await hydrateElAssessmentReports({ teacherId: "teacher-repeat", supabase });
  assert.equal(hydrated.length, 50);
  assert.deepEqual(requestedRanges, [[0, 49], [50, 99]]);
});

test("cloud delete prevents report resurrection and a rejected delete keeps the local copy", async t => {
  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage();
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  const supabase = createSupabaseReportMock();
  await saveElAssessmentReport(reportFixture(), { teacherId: "teacher-1", supabase });

  await deleteSavedElAssessmentReport("report-1", { teacherId: "teacher-1", supabase });
  assert.equal(supabase.state.rows.length, 0);
  assert.equal(getSavedElAssessmentReports({ teacherId: "teacher-1" }).length, 0);
  assert.equal((await hydrateElAssessmentReports({ teacherId: "teacher-1", supabase })).length, 0);

  await saveElAssessmentReport(reportFixture({ reportId: "report-2" }), { teacherId: "teacher-1", supabase });
  supabase.state.rejectDelete = true;
  await assert.rejects(
    deleteSavedElAssessmentReport("report-2", { teacherId: "teacher-1", supabase }),
    /cloud storage/
  );
  assert.equal(getSavedElAssessmentReports({ teacherId: "teacher-1" })[0].reportId, "report-2");
});

test("student report deletion uses stable IDs and only falls back to names for legacy ID-less reports", async t => {
  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage();
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  await saveElAssessmentReport(reportFixture({
    reportId: "target-ada",
    studentId: "student-target",
    studentName: "Ada",
    generatedAt: "2026-07-21T08:00:00.000Z"
  }), { teacherId: "teacher-1" });
  await saveElAssessmentReport(reportFixture({
    reportId: "different-ada",
    studentId: "student-other",
    studentName: "Ada",
    generatedAt: "2026-07-21T09:00:00.000Z"
  }), { teacherId: "teacher-1" });
  await saveElAssessmentReport(reportFixture({
    reportId: "legacy-ada",
    studentId: "",
    studentName: "Ada",
    generatedAt: "2026-07-21T10:00:00.000Z"
  }), { teacherId: "teacher-1" });

  const remaining = deleteSavedElAssessmentReportsForStudent({
    teacherId: "teacher-1",
    studentId: "student-target",
    studentName: "Ada"
  });
  assert.deepEqual(remaining.map(report => report.reportId), ["different-ada"]);
  assert.equal(remaining[0].studentId, "student-other");
});

test("class reports containing a reset student can be identified and deleted locally and in cloud storage", async t => {
  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage();
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  const supabase = createSupabaseReportMock();
  const targetReport = reportFixture({
    reportId: "class-with-target",
    reportType: "whole_class",
    studentId: "",
    studentName: "",
    studentRows: [
      { studentId: "student-target", studentName: "Ada" },
      { studentId: "student-2", studentName: "Leo" }
    ]
  });
  const unrelatedReport = reportFixture({
    reportId: "class-without-target",
    reportType: "whole_class",
    studentId: "",
    studentName: "",
    generatedAt: "2026-07-21T09:00:00.000Z",
    studentRows: [{ studentId: "student-3", studentName: "Mina" }]
  });
  await saveElAssessmentReport(targetReport, { teacherId: "teacher-1", supabase });
  await saveElAssessmentReport(unrelatedReport, { teacherId: "teacher-1", supabase });

  assert.equal(savedClassElAssessmentReportContainsStudent(targetReport, { studentId: "student-target" }), true);
  assert.equal(savedClassElAssessmentReportContainsStudent(unrelatedReport, { studentId: "student-target" }), false);
  assert.equal(savedClassElAssessmentReportContainsStudent({
    ...unrelatedReport,
    studentRows: [{ studentId: "different-ada", studentName: "Ada" }]
  }, { studentId: "student-target", studentName: "Ada" }), false, "duplicate names with a different stable ID must not match");
  assert.equal(savedClassElAssessmentReportContainsStudent({
    ...targetReport,
    studentRows: [{ studentName: "Ada" }]
  }, { studentId: "student-target", studentName: "Ada" }), true, "legacy rows without IDs may use an exact-name fallback");
  assert.deepEqual(
    getSavedClassElAssessmentReportsForStudent({ teacherId: "teacher-1", studentId: "student-target" })
      .map(report => report.reportId),
    ["class-with-target"]
  );

  const result = await deleteSavedClassElAssessmentReportsForStudent({
    teacherId: "teacher-1",
    studentId: "student-target",
    supabase
  });
  assert.deepEqual(result.deletedReportIds, ["class-with-target"]);
  assert.deepEqual(result.reports.map(report => report.reportId), ["class-without-target"]);
  assert.deepEqual(supabase.state.rows.map(row => row.report_id), ["class-without-target"]);
});

test("learner deletion redacts a shared local report instead of deleting classmates", async t => {
  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage();
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  const targetReport = reportFixture({
    reportId: "class-with-target",
    reportType: "whole_class",
    studentId: "",
    studentName: "",
    studentRows: [
      { studentId: "student-target", studentName: "Ada", accuracy: 90 },
      { studentId: "student-2", studentName: "Leo", accuracy: 70 }
    ],
    summary: {
      byStudentId: {
        "student-target": { accuracy: 90 },
        "student-2": { accuracy: 70 }
      }
    }
  });
  await saveElAssessmentReport(targetReport, { teacherId: "teacher-1" });

  const result = redactSavedClassElAssessmentReportsForStudent({
    teacherId: "teacher-1",
    studentId: "student-target",
    studentName: "Ada"
  });
  const retained = result.reports.find(report => report.reportId === "class-with-target");

  assert.deepEqual(result.redactedReportIds, ["class-with-target"]);
  assert.ok(retained, "the shared report must remain");
  assert.deepEqual(retained.studentRows, [
    { studentId: "student-2", studentName: "Leo", accuracy: 70 }
  ]);
  assert.deepEqual(retained.summary.byStudentId, {
    "student-2": { accuracy: 70 }
  });
  assert.doesNotMatch(JSON.stringify(retained), /student-target/);
});

test("a realistic 25-student, 100-attempt class report compacts below the bounded local quota", async t => {
  const students = Array.from({ length: 25 }, (_, index) => ({
    id: `student-${index + 1}`,
    name: `Student ${index + 1}`,
    classId: "class-large"
  }));
  const classes = [{ id: "class-large", name: "Large Class" }];
  const assessmentHistory = students.flatMap((student, studentIndex) => (
    Array.from({ length: 100 }, (_, attemptIndex) => ({
      attemptId: `${student.id}-attempt-${attemptIndex + 1}`,
      studentId: student.id,
      studentName: student.name,
      classId: "class-large",
      teacherId: "teacher-1",
      assessmentType: "el_letter_assessment",
      skillId: "el_letter_assessment",
      skillName: "Letter Name and Sound Recognition",
      startedAt: `2026-07-${String((attemptIndex % 20) + 1).padStart(2, "0")}T08:00:00.000Z`,
      completedAt: `2026-07-${String((attemptIndex % 20) + 1).padStart(2, "0")}T08:05:00.000Z`,
      questionRecords: Array.from({ length: 4 }, (_, questionIndex) => ({
        questionId: `${studentIndex}-${attemptIndex}-${questionIndex}`,
        itemType: "letter_name",
        itemKey: String.fromCharCode(97 + questionIndex),
        targetLetter: String.fromCharCode(97 + questionIndex),
        targetWord: ["apple", "ball", "cat", "dog"][questionIndex],
        prompt: "A realistically verbose assessor prompt retained in live history but removed from the saved report snapshot.",
        responseStatus: questionIndex % 2 ? "incorrect" : "correct",
        isCorrect: questionIndex % 2 === 0,
        metadata: { administrationNote: "One-to-one classroom checkpoint evidence." }
      }))
    }))
  ));
  const report = buildClassElAssessmentReportData({
    assessmentHistory,
    students,
    classes,
    classId: "class-large",
    teacherId: "teacher-1"
  });
  const compact = compactElAssessmentReportForStorage(report);
  const fullBytes = Buffer.byteLength(JSON.stringify(report), "utf8");
  const compactBytes = Buffer.byteLength(JSON.stringify(compact), "utf8");

  assert.ok(fullBytes > 5_000_000, `fixture must exercise a quota-risk report, received ${fullBytes} bytes`);
  assert.ok(compactBytes < 3_500_000, `compact report must fit the bounded cache, received ${compactBytes} bytes`);
  assert.ok(compactBytes < fullBytes * 0.4, "compaction must materially remove duplicated attempt payloads");
  assert.equal(compact.sourceSnapshot, undefined);
  assert.equal(compact.attemptRows, undefined);
  assert.equal(compact.progressRows, undefined);
  assert.ok(compact.formalAssessments);
  assert.ok(Array.isArray(compact.classWeakPointRows));
  assert.ok(Array.isArray(compact.weeklyAccuracyRows));
  assert.ok(compact.formalAssessments.classEvidenceDictionaries);

  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage({ maxBytes: 4_000_000 });
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  await saveElAssessmentReport(report, { teacherId: "teacher-1" });
  const saved = getSavedElAssessmentReports({ teacherId: "teacher-1" });
  assert.equal(saved.length, 1);
  const workbook = await createClassElAssessmentWorkbook(saved[0]);
  const letterRows = worksheetRows(workbook.getWorksheet("Letter Sound Class Matrix"));
  assert.match(
    letterRows.flatMap(row => Object.entries(row)
      .filter(([header]) => header.includes("evidence provenance"))
      .map(([, value]) => value)).join("\n"),
    /Content: content-/
  );
});

test("a 25-student, 100-attempt benchmark class retains flat item evidence without duplicate nested payloads", async t => {
  const students = Array.from({ length: 25 }, (_, index) => ({
    id: `benchmark-student-${index + 1}`,
    name: `Benchmark Student ${index + 1}`,
    classId: "benchmark-class"
  }));
  const assessmentIds = [
    "el_phonological_awareness",
    "el_encoding",
    "el_decoding",
    "el_oral_reading_fluency"
  ];
  const questionCounts = {
    el_phonological_awareness: 20,
    el_encoding: 12,
    el_decoding: 24,
    el_oral_reading_fluency: 1
  };
  const assessmentHistory = students.flatMap((student, studentIndex) => assessmentIds.map((assessmentId, domainIndex) => ({
    attemptId: `${student.id}-${assessmentId}`,
    studentId: student.id,
    studentName: student.name,
    classId: "benchmark-class",
    teacherId: "teacher-1",
    assessmentType: assessmentId,
    skillId: assessmentId,
    skillName: assessmentId,
    gradePath: "1",
    benchmarkWindow: "EOY",
    formVersion: "benchmark-form-v1",
    administrationStatus: "completed",
    startedAt: `2026-07-21T0${domainIndex + 1}:00:00.000Z`,
    completedAt: `2026-07-21T0${domainIndex + 1}:10:00.000Z`,
    questionRecords: Array.from({ length: questionCounts[assessmentId] }, (_, itemIndex) => {
      const base = {
        questionId: `${studentIndex}-${domainIndex}-${itemIndex}`,
        itemKey: `${assessmentId}-item-${itemIndex}`,
        prompt: "A complete assessor prompt retained because the saved workbook must preserve auditable item evidence.",
        responseStatus: itemIndex % 3 === 0 ? "incorrect" : "correct",
        responseText: itemIndex % 3 === 0 ? "recorded approximation" : "recorded exact response",
        isCorrect: itemIndex % 3 !== 0,
        errorTags: itemIndex % 3 === 0 ? ["substitution", "feature_mismatch"] : []
      };
      if (assessmentId === "el_phonological_awareness") {
        return { ...base, metadata: { strand: itemIndex % 2 ? "phoneme_blending" : "phoneme_segmentation", task: "oral_response" } };
      }
      if (assessmentId === "el_encoding") {
        return {
          ...base,
          targetWord: `word${itemIndex}`,
          scoringCode: itemIndex % 3 === 0 ? "not_yet" : "exact",
          features: { exact: itemIndex % 3 !== 0, plausible: false, featureTags: ["short_vowel"] }
        };
      }
      if (assessmentId === "el_decoding") {
        return {
          ...base,
          targetWord: `decode${itemIndex}`,
          automatic: itemIndex % 3 !== 0,
          selfCorrected: false,
          metadata: { bandId: `microphase-${(itemIndex % 3) + 2}`, microphase: (itemIndex % 3) + 2 }
        };
      }
      return {
        ...base,
        responseStatus: "recorded",
        responseText: "A preserved passage transcription with exact miscues and self-corrections for audit review.",
        metadata: {
          passageId: `passage-${studentIndex}`,
          passageTitle: "Benchmark Passage",
          wordsAttempted: 60,
          correctWords: 55,
          errors: 5,
          selfCorrections: 2,
          elapsedSeconds: 60,
          wcpm: 55,
          accuracy: 92,
          passageAccurate: true,
          prosody: { expression: 3, phrasing: 3, smoothness: 2, pace: 3 }
        }
      };
    })
  })));
  const report = buildClassElAssessmentReportData({
    assessmentHistory,
    students,
    classes: [{ id: "benchmark-class", name: "Benchmark Class" }],
    classId: "benchmark-class",
    teacherId: "teacher-1",
    benchmarkScope: { grade: "1", benchmarkWindow: "EOY" }
  });
  const compact = compactElAssessmentReportForStorage(report);
  const details = compact.formalAssessments.classBenchmarkDetails;
  const compactBytes = Buffer.byteLength(JSON.stringify(compact), "utf8");

  assert.equal(details.length, 100);
  assert.ok(details.every(detail => Array.isArray(detail.itemDetails) && detail.itemDetails.length > 0));
  assert.ok(details.filter(detail => detail.domainKey === "phonologicalAwareness")
    .every(detail => detail.strandRows.every(strand => !Object.hasOwn(strand, "items"))));
  assert.ok(details.filter(detail => detail.domainKey === "decoding")
    .every(detail => detail.bandRows.every(band => !Object.hasOwn(band, "items"))));
  assert.ok(details.filter(detail => detail.domainKey === "oralReadingFluency")
    .every(detail => !Object.hasOwn(detail, "passageRows")));
  assert.ok(compactBytes < 2_500_000, `benchmark-heavy compact report must leave quota headroom, received ${compactBytes} bytes`);
  assert.ok(compactBytes < 2_125_000, `benchmark-heavy report must fit the conservative UTF-16 cache budget, received ${compactBytes} bytes`);

  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = createLocalStorage({ maxBytes: 4_000_000 });
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });
  await saveElAssessmentReport(report, { teacherId: "teacher-1" });
  const saved = getSavedElAssessmentReports({ teacherId: "teacher-1" })[0];
  assert.equal(saved.reportId, report.reportId);

  const workbook = await createClassElAssessmentWorkbook(saved);
  const evidenceRows = worksheetRows(workbook.getWorksheet("Benchmark Evidence Detail"));
  assert.equal(evidenceRows.length, 25 * (20 + 12 + 24 + 1));
  assert.ok(evidenceRows.some(row => row["Student response"] === "recorded exact response"));
  assert.ok(evidenceRows.some(row => String(row["Student response"]).includes("preserved passage transcription")));
});
