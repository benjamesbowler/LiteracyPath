import test from "node:test";
import assert from "node:assert/strict";
import {
  EL_BENCHMARK_FORM_DEFINITIONS,
  EL_BENCHMARK_FORM_ID,
  EL_BENCHMARK_FORM_IDS,
  EL_BENCHMARK_IDS,
  EL_ITEM_RESPONSE_STATUSES,
  buildElBenchmarkAttempt,
  getElBenchmarkPlan
} from "../../src/data/elBenchmarkAssessments.js";
import {
  createElBenchmarkSession,
  selectElBenchmarkForm
} from "../../src/data/elBenchmarkSession.js";

const GRADES = ["K", "1", "2"];
const WINDOWS = ["BOY", "MOY", "EOY"];
const FORM_IDS = Object.values(EL_BENCHMARK_FORM_IDS);

function attempt({
  id,
  formId = EL_BENCHMARK_FORM_IDS.A,
  status = "completed",
  updatedAt,
  assessmentId = EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
  grade = "1",
  windowName = "MOY",
  extra = {}
}) {
  return {
    attemptId: id,
    studentId: "student-1",
    assessmentType: assessmentId,
    gradePath: grade,
    benchmarkWindow: windowName,
    administrationStatus: status,
    scoreStatus: status === "completed" ? "scored" : status,
    formVersion: formId,
    updatedAt,
    ...extra
  };
}

function selection(history = [], overrides = {}) {
  return selectElBenchmarkForm({
    assessmentHistory: history,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "1",
    window: "MOY",
    ...overrides
  });
}

test("parallel form registry preserves Form A and exposes explicit versioned B and C forms", () => {
  assert.equal(EL_BENCHMARK_FORM_ID, "form-a-v2");
  assert.deepEqual(EL_BENCHMARK_FORM_IDS, {
    A: "form-a-v2",
    B: "form-b-v1",
    C: "form-c-v1"
  });
  assert.deepEqual(EL_BENCHMARK_FORM_DEFINITIONS.map(form => form.id), FORM_IDS);
  assert.equal(EL_BENCHMARK_FORM_DEFINITIONS[0].contentVersion, "2026.07.21-v2");
  assert.ok(EL_BENCHMARK_FORM_DEFINITIONS.slice(1).every(form => form.parallelSetId === "lp-el-parallel-2026-v1"));
  assert.ok(EL_BENCHMARK_FORM_DEFINITIONS.every(
    form => form.equatingStatus === "blueprint_matched_not_empirically_equated"
  ));
});

test("all 108 grade-window-domain-form plans are deterministic, distinct, and blueprint matched", () => {
  for (const assessmentId of Object.values(EL_BENCHMARK_IDS)) {
    for (const grade of GRADES) {
      for (const windowName of WINDOWS) {
        const plans = FORM_IDS.map(formId => getElBenchmarkPlan({
          assessmentId,
          grade,
          window: windowName,
          formId
        }));
        const blueprint = plans[0];
        for (const plan of plans) {
          const repeated = getElBenchmarkPlan({ assessmentId, grade, window: windowName, formId: plan.formId });
          assert.deepEqual(plan, repeated, `${assessmentId} ${grade}-${windowName} ${plan.formId} is deterministic`);
          assert.doesNotThrow(() => JSON.stringify(plan));
          assert.equal(plan.items.length, blueprint.items.length);
          assert.equal(new Set(plan.items.map(item => item.id)).size, plan.items.length);
          assert.deepEqual(plan.items.map(item => item.kind), blueprint.items.map(item => item.kind));
          assert.deepEqual(plan.items.map(item => item.featureTags), blueprint.items.map(item => item.featureTags));
          assert.deepEqual(plan.items.map(item => item.microphase || ""), blueprint.items.map(item => item.microphase || ""));
          assert.deepEqual(plan.items.map(item => item.strand || ""), blueprint.items.map(item => item.strand || ""));
          assert.deepEqual(plan.items.map(item => item.task || ""), blueprint.items.map(item => item.task || ""));
          if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
            assert.ok(plan.items.every(item => item.wordAudit.meetsMinimumOpportunity));
            assert.deepEqual(
              plan.items.map(item => item.wordAudit.minimumOpportunityWords),
              blueprint.items.map(item => item.wordAudit.minimumOpportunityWords)
            );
          }
        }
        const itemIdSets = plans.map(plan => new Set(plan.items.map(item => item.id)));
        assert.ok([...itemIdSets[0]].every(id => !itemIdSets[1].has(id) && !itemIdSets[2].has(id)));
        assert.ok([...itemIdSets[1]].every(id => !itemIdSets[2].has(id)));
        const exposedContent = plans.map(plan => plan.items.map(item => (
          item.teacherSay || item.targetWord || item.text
        )).join("\n"));
        assert.equal(new Set(exposedContent).size, 3, `${assessmentId} ${grade}-${windowName} exposes three different forms`);
      }
    }
  }
});

test("form aliases resolve without changing Form A and unsupported forms fail closed", () => {
  const options = { assessmentId: EL_BENCHMARK_IDS.ENCODING, grade: "1", window: "MOY" };
  assert.equal(getElBenchmarkPlan({ ...options, formId: "A" }).formId, EL_BENCHMARK_FORM_IDS.A);
  assert.equal(getElBenchmarkPlan({ ...options, formId: "form-b" }).formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(getElBenchmarkPlan({ ...options, formId: "C" }).formId, EL_BENCHMARK_FORM_IDS.C);
  assert.throws(() => getElBenchmarkPlan({ ...options, formId: "form-d" }), /unsupported.*form/i);
  const a = getElBenchmarkPlan({ ...options });
  assert.equal(a.items[0].targetWord, "cake");
  assert.equal(a.items[0].id, "enc-1-moy-01");
});

test("each form keeps Encoding targets separate from its complete Decoding bank", () => {
  const decodingAccess = [
    ["K", "BOY", "middle_pre"],
    ["K", "EOY", "early_partial"],
    ["1", "EOY", "early_full"],
    ["2", "BOY", "middle_full"],
    ["2", "MOY", "late_full"],
    ["2", "EOY", "early_consolidated"]
  ];
  for (const formId of FORM_IDS) {
    const encodingTargets = new Set();
    for (const grade of GRADES) {
      for (const windowName of WINDOWS) {
        getElBenchmarkPlan({
          assessmentId: EL_BENCHMARK_IDS.ENCODING,
          grade,
          window: windowName,
          formId
        }).items.forEach(item => encodingTargets.add(item.targetWord));
      }
    }
    const decodingById = new Map();
    for (const [grade, windowName, startMicrophase] of decodingAccess) {
      getElBenchmarkPlan({
        assessmentId: EL_BENCHMARK_IDS.DECODING,
        grade,
        window: windowName,
        startMicrophase,
        formId
      }).items.forEach(item => decodingById.set(item.id, item));
    }
    const decodingItems = Array.from(decodingById.values());
    assert.equal(decodingItems.length, 80, `${formId} covers exactly ten eight-word bands`);
    assert.equal(new Set(decodingItems.map(item => item.targetWord)).size, 80, `${formId} Decoding targets are unique`);
    assert.deepEqual(
      decodingItems.map(item => item.targetWord).filter(word => encodingTargets.has(word)),
      [],
      `${formId} Encoding cannot cue later isolated Decoding words`
    );
  }
});

test("valid same-window completions select A, B, C, then a flagged deterministic cycle", () => {
  const a = attempt({ id: "a", formId: EL_BENCHMARK_FORM_IDS.A, updatedAt: "2026-01-01T00:00:00.000Z" });
  const b = attempt({ id: "b", formId: EL_BENCHMARK_FORM_IDS.B, updatedAt: "2026-01-02T00:00:00.000Z" });
  const c = attempt({ id: "c", formId: EL_BENCHMARK_FORM_IDS.C, updatedAt: "2026-01-03T00:00:00.000Z" });
  const a2 = attempt({ id: "a2", formId: EL_BENCHMARK_FORM_IDS.A, updatedAt: "2026-01-04T00:00:00.000Z" });

  assert.equal(selection([]).formId, EL_BENCHMARK_FORM_IDS.A);
  assert.equal(selection([a]).formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(selection([a, b]).formId, EL_BENCHMARK_FORM_IDS.C);

  const fourth = selection([a, b, c]);
  assert.equal(fourth.formId, EL_BENCHMARK_FORM_IDS.A);
  assert.equal(fourth.formPurpose, "same_window_retest_after_parallel_forms");
  assert.equal(fourth.formSelectionReason, "parallel_forms_exhausted_deterministic_cycle");
  assert.equal(fourth.formExposure.parallelFormsExhausted, true);
  assert.equal(fourth.formExposure.allParallelFormsExposed, true);
  assert.equal(fourth.formExposure.deterministicCycleNumber, 2);
  assert.equal(selection([a, b, c, a2]).formId, EL_BENCHMARK_FORM_IDS.B);
});

test("duplicates and invalid completions do not consume a parallel form", () => {
  const valid = attempt({ id: "same", formId: EL_BENCHMARK_FORM_IDS.A, updatedAt: "2026-01-01T00:00:00.000Z" });
  const cloudDuplicate = { ...valid, updatedAt: "2026-01-01T00:01:00.000Z" };
  const invalid = attempt({
    id: "invalid",
    formId: EL_BENCHMARK_FORM_IDS.B,
    updatedAt: "2026-01-02T00:00:00.000Z",
    extra: { scoreStatus: "partial", validationIssues: ["response_required"] }
  });
  const selected = selection([valid, cloudDuplicate, invalid]);
  assert.equal(selected.formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(selected.formExposure.validCompletedCount, 1);
});

test("exposure exhaustion is flagged even when interrupted administrations consumed no next form", () => {
  const history = FORM_IDS.map((formId, index) => attempt({
    id: `interrupted-${index}`,
    formId,
    status: "discontinued",
    updatedAt: `2026-01-0${index + 1}T00:00:00.000Z`
  }));
  const selected = selection(history);
  assert.equal(selected.formId, EL_BENCHMARK_FORM_IDS.A);
  assert.equal(selected.formPurpose, "same_window_retest_after_parallel_forms");
  assert.equal(selected.formSelectionReason, "parallel_forms_exhausted_deterministic_cycle");
  assert.equal(selected.formExposure.validCompletedCount, 0);
  assert.equal(selected.formExposure.allParallelFormsExposed, true);
  assert.equal(selected.formExposure.parallelFormsExhausted, true);
  assert.equal(selected.formExposure.fallbackAfterExhaustion, true);
});

test("a terminal duplicate wins over an equal-timestamp partial for the same attempt", () => {
  const timestamp = "2026-01-01T00:00:00.000Z";
  const partial = attempt({ id: "same", status: "partial", updatedAt: timestamp });
  const completed = attempt({ id: "same", status: "completed", updatedAt: timestamp });
  const selected = selection([partial, completed]);
  assert.equal(selected.formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(selected.formExposure.validCompletedCount, 1);
  assert.equal(selected.formPurpose, "same_window_retest");
});

test("a current partial keeps its form and consumes no next form", () => {
  const completedA = attempt({ id: "a", formId: EL_BENCHMARK_FORM_IDS.A, updatedAt: "2026-01-01T00:00:00.000Z" });
  const partialB = attempt({
    id: "partial-b",
    formId: EL_BENCHMARK_FORM_IDS.B,
    status: "partial",
    updatedAt: "2026-01-02T00:00:00.000Z"
  });
  const resumed = selection([completedA, partialB]);
  assert.equal(resumed.formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(resumed.formPurpose, "resume_incomplete");
  assert.equal(resumed.resumeAttemptId, "partial-b");
  assert.equal(resumed.formExposure.validCompletedCount, 1);

  const afterDiscard = selection([completedA]);
  assert.equal(afterDiscard.formId, EL_BENCHMARK_FORM_IDS.B, "the incomplete attempt did not consume Form B");
});

test("an obsolete partial before a later completion is not resumed", () => {
  const partialA = attempt({
    id: "partial-a",
    formId: EL_BENCHMARK_FORM_IDS.A,
    status: "partial",
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  const completedA = attempt({ id: "complete-a", formId: EL_BENCHMARK_FORM_IDS.A, updatedAt: "2026-01-02T00:00:00.000Z" });
  const selected = selection([partialA, completedA]);
  assert.equal(selected.formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(selected.formPurpose, "same_window_retest");
});

test("form history is scoped by student, assessment, grade, and window", () => {
  const otherDomain = attempt({
    id: "other-domain",
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  const otherWindow = attempt({ id: "other-window", windowName: "EOY", updatedAt: "2026-01-02T00:00:00.000Z" });
  const otherGrade = attempt({ id: "other-grade", grade: "2", updatedAt: "2026-01-03T00:00:00.000Z" });
  const otherStudent = { ...attempt({ id: "other-student", updatedAt: "2026-01-04T00:00:00.000Z" }), studentId: "student-2" };
  assert.equal(selection([otherDomain, otherWindow, otherGrade, otherStudent]).formId, EL_BENCHMARK_FORM_IDS.A);
});

test("session creation locks the selected form and records auditable selection metadata", () => {
  const completedA = attempt({
    id: "complete-a",
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: EL_BENCHMARK_FORM_IDS.A,
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  const session = createElBenchmarkSession({
    assessmentHistory: [completedA],
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "MOY",
    ownership: {
      studentId: "student-1",
      studentName: "Ada",
      classId: "class-1",
      teacherId: "teacher-1"
    },
    startedAt: "2026-01-02T00:00:00.000Z",
    sessionToken: "form-b-session"
  });
  assert.equal(session.formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(session.formPurpose, "same_window_retest");
  assert.equal(session.formSelectionReason, "1_valid_completed_same_window_attempt");
  assert.equal(session.formSelection.formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(session.formExposure.validCompletedCount, 1);
  assert.equal(session.formParallelSetId, "lp-el-parallel-2026-v1");
  assert.equal(session.formEquatingStatus, "blueprint_matched_not_empirically_equated");
  assert.match(session.planId, /form-b-v1/);
  assert.equal(session.contentVersion, "2026.07.22-parallel-v1");
});

test("persistence retains form id, purpose, reason, exposure, and per-form content version", () => {
  const session = createElBenchmarkSession({
    assessmentHistory: [attempt({ id: "a", updatedAt: "2026-01-01T00:00:00.000Z" })],
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "1",
    window: "MOY",
    ownership: { studentId: "student-1", studentName: "Ada", teacherId: "teacher-1" },
    startedAt: "2026-01-02T00:00:00.000Z",
    sessionToken: "persist-b"
  });
  const plan = getElBenchmarkPlan({
    assessmentId: session.assessmentId,
    grade: session.grade,
    window: session.window,
    formId: session.formId
  });
  const responses = Object.fromEntries(plan.items.map(item => [item.id, {
    status: EL_ITEM_RESPONSE_STATUSES.CORRECT,
    isCorrect: true,
    responseText: item.expectedAnswers[0]
  }]));
  const completed = {
    ...session,
    responses,
    status: "completed",
    administrationStatus: "completed",
    completedAt: "2026-01-02T00:10:00.000Z"
  };
  const saved = buildElBenchmarkAttempt(completed);
  assert.equal(saved.formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(saved.formVersion, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(saved.formPurpose, "same_window_retest");
  assert.equal(saved.formSelectionReason, "1_valid_completed_same_window_attempt");
  assert.equal(saved.formExposure.validCompletedCount, 1);
  assert.equal(saved.metadata.formId, EL_BENCHMARK_FORM_IDS.B);
  assert.equal(saved.metadata.formPurpose, "same_window_retest");
  assert.equal(saved.metadata.formExposure.validCompletedCount, 1);
  assert.equal(saved.metadata.formParallelSetId, "lp-el-parallel-2026-v1");
  assert.equal(saved.metadata.formEquatingStatus, "blueprint_matched_not_empirically_equated");
  assert.equal(saved.contentVersion, "2026.07.22-parallel-v1");
  assert.equal(saved.benchmark.contentVersion, "2026.07.22-parallel-v1");
});
