import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  hydrateAssessmentAttempts
} from "../../src/data/assessmentHistoryStore.js";
import {
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData
} from "../../src/data/elAssessmentReportStore.js";

const migrationUrl = new URL(
  "../../supabase/migrations/20260728124000_privacy_reporting_integrity.sql",
  import.meta.url
);
const appSessionControllerUrl = new URL(
  "../../src/appState/useAppSessionController.js",
  import.meta.url
);

async function migrationSource() {
  return readFile(migrationUrl, "utf8");
}

function functionBlock(source, name, nextMarker) {
  const start = source.indexOf(`create or replace function public.${name}`);
  const end = source.indexOf(nextMarker, start);
  assert.ok(start >= 0, `${name} must exist`);
  assert.ok(end > start, `${name} must have a bounded source block`);
  return source.slice(start, end);
}

function letterAttempt({
  attemptId,
  studentId,
  studentName,
  classId,
  completedAt
}) {
  return {
    attemptId,
    assessmentType: "el_letter_assessment",
    skillId: "el_letter_assessment",
    skillName: "Letter Names and Sounds",
    studentId,
    studentName,
    classId,
    administrationStatus: "completed",
    completedAt,
    totalQuestions: 1,
    correctCount: 1,
    accuracy: 100,
    questionRecords: [{
      questionId: `${attemptId}-uppercase-a`,
      itemType: "uppercase_letter_name",
      targetLetter: "A",
      responseStatus: "correct",
      isCorrect: true,
      timestamp: completedAt
    }]
  };
}

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}

test("selected-student hydration requests every class for the stable learner id", async t => {
  const priorStorage = globalThis.localStorage;
  globalThis.localStorage = makeStorage();
  t.after(() => {
    if (priorStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = priorStorage;
  });

  const cloudRows = [
    {
      attempt_id: "former-class-result",
      student_id: "student-a",
      class_id: "class-old",
      teacher_id: "teacher-a",
      assessment_type: "el_letter_assessment",
      skill_id: "el_letter_assessment",
      skill_name: "Letter Names and Sounds",
      completed_at: "2026-06-10T09:00:00.000Z",
      payload: { studentName: "Aaron", questionRecords: [] }
    },
    {
      attempt_id: "current-class-result",
      student_id: "student-a",
      class_id: "class-new",
      teacher_id: "teacher-a",
      assessment_type: "el_letter_assessment",
      skill_id: "el_letter_assessment",
      skill_name: "Letter Names and Sounds",
      completed_at: "2026-07-20T09:00:00.000Z",
      payload: { studentName: "Aaron", questionRecords: [] }
    }
  ];
  const filters = [];
  const builder = {
    eq(column, value) {
      filters.push([column, value]);
      return builder;
    },
    order() {
      return builder;
    },
    select() {
      return builder;
    },
    then(resolve, reject) {
      const data = cloudRows.filter(row =>
        filters.every(([column, value]) => row[column] === value)
      );
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    }
  };
  const supabase = {
    table(table) {
      assert.equal(table, "assessment_attempts");
      return builder;
    }
  };

  const hydrated = await hydrateAssessmentAttempts({
    teacherId: "teacher-a",
    studentId: "student-a",
    supabase
  });

  assert.deepEqual(
    new Set(hydrated.map(record => record.attemptId)),
    new Set(["former-class-result", "current-class-result"])
  );
  assert.deepEqual(filters, [
    ["teacher_id", "teacher-a"],
    ["student_id", "student-a"]
  ]);

  const controller = await readFile(appSessionControllerUrl, "utf8");
  const start = controller.indexOf(
    "const selectedAttemptHistoryPromise = settleTeacherRead("
  );
  const end = controller.indexOf("\n\n    const [", start);
  assert.ok(start >= 0 && end > start);
  const selectedStudentHydration = controller.slice(start, end);
  assert.match(selectedStudentHydration, /teacherId: loadTeacherId/);
  assert.match(selectedStudentHydration, /studentId: selectedStudentId/);
  assert.doesNotMatch(
    selectedStudentHydration,
    /\bclassId\s*:/,
    "the selected learner load must not discard results from a former class"
  );
});

test("individual EL reports retain a transferred learner's former-class results", () => {
  const currentStudent = {
    id: "student-a",
    name: "Aaron",
    classId: "class-new"
  };
  const history = [
    letterAttempt({
      attemptId: "former-class-result",
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      classId: "class-old",
      completedAt: "2026-06-10T09:00:00.000Z"
    }),
    letterAttempt({
      attemptId: "current-class-result",
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      classId: "class-new",
      completedAt: "2026-07-20T09:00:00.000Z"
    }),
    letterAttempt({
      attemptId: "other-student-result",
      studentId: "student-b",
      studentName: "Bea",
      classId: "class-old",
      completedAt: "2026-07-21T09:00:00.000Z"
    })
  ];
  const classes = [
    { id: "class-old", name: "Previous Class" },
    { id: "class-new", name: "Current Class" }
  ];

  const individual = buildStudentElAssessmentReportData({
    assessmentHistory: history,
    students: [currentStudent],
    classes,
    studentId: currentStudent.id,
    classId: "class-new",
    teacherId: "teacher-a",
    now: "2026-07-28T09:00:00.000Z"
  });

  assert.equal(individual.classId, "class-new");
  assert.equal(individual.className, "Current Class");
  assert.deepEqual(
    new Set(individual.sourceAttemptIds),
    new Set(["former-class-result", "current-class-result"])
  );
  assert.deepEqual(
    new Set(individual.evidenceClassIds),
    new Set(["class-old", "class-new"])
  );
  assert.equal(individual.includesFormerClassEvidence, true);
  assert.match(individual.assessmentWindow, /previous class/i);
  assert.equal(
    individual.sourceSnapshot.records.some(
      record => record.attemptId === "other-student-result"
    ),
    false
  );

  const currentClass = buildClassElAssessmentReportData({
    assessmentHistory: history,
    students: [currentStudent],
    classes,
    classId: "class-new",
    teacherId: "teacher-a",
    now: "2026-07-28T09:00:00.000Z"
  });
  assert.deepEqual(currentClass.sourceAttemptIds, ["current-class-result"]);
});

test("learner export includes question reports and withholds unstructured shared content", async () => {
  const source = await migrationSource();
  const block = functionBlock(
    source,
    "teacher_export_learner_data",
    "create or replace function public.perform_verified_learner_deletion"
  );

  assert.match(
    block,
    /perform public\.assert_current_actor_teacher_access\(\);/
  );
  assert.match(
    block,
    /'assessmentQuestionReports'[\s\S]*?from public\.assessment_question_reports qr[\s\S]*?where qr\.student_id = v_student\.id/i
  );
  assert.match(
    block,
    /when cardinality\(ti\.student_ids\) > 1 then[\s\S]*?'sharedPrivateTextWithheld', true/i
  );
  assert.match(
    block,
    /when cardinality\(gr\.student_ids\) > 1 then[\s\S]*?'evidenceSnapshot', jsonb_build_object/i
  );
  assert.match(
    block,
    /when cardinality\(io\.student_ids\) > 1 then[\s\S]*?'sharedPrivateTextWithheld', true/i
  );
  assert.doesNotMatch(
    block.match(
      /when cardinality\(io\.student_ids\) > 1 then[\s\S]*?else to_jsonb\(io\)/
    )?.[0] || "",
    /io\.(note|insight_snapshot)/i,
    "a shared observation export must not copy its free text or raw snapshot"
  );
});

test("verified deletion explicitly removes question reports and scrubs retained shared PII", async () => {
  const source = await migrationSource();
  const block = functionBlock(
    source,
    "perform_verified_learner_deletion",
    "comment on function public.teacher_export_learner_data"
  );

  assert.match(
    block,
    /perform public\.assert_current_actor_teacher_access\(\);/
  );
  assert.match(
    block,
    /lock table public\.assessment_question_reports in share row exclusive mode/i
  );
  assert.match(
    block,
    /delete from public\.assessment_question_reports qr\s+where qr\.student_id = v_student\.id/i
  );
  assert.match(block, /'assessmentQuestionReports',\s*v_count/i);
  assert.match(
    block,
    /select 1 from public\.assessment_question_reports qr\s+where qr\.student_id = p_student_id/i
  );
  assert.match(
    block,
    /set student_ids = array_remove\(io\.student_ids, v_student\.id\),[\s\S]*?note = public\.redact_learner_free_text[\s\S]*?insight_snapshot = public\.redact_learner_jsonb/i
  );
  assert.match(
    block,
    /evidence_snapshot = jsonb_set\([\s\S]*?public\.redact_learner_jsonb/i
  );
  assert.match(
    block,
    /where gr\.id = any\(v_redacted_review_ids\)[\s\S]*?public\.redact_learner_jsonb\([\s\S]*?coalesce\(gr\.evidence_snapshot, '\{\}'::jsonb\)/i
  );
  assert.match(
    block,
    /where io\.id = any\(v_redacted_observation_ids\)[\s\S]*?public\.redact_learner_free_text\([\s\S]*?coalesce\(io\.note, ''\)[\s\S]*?public\.redact_learner_jsonb\([\s\S]*?coalesce\(io\.insight_snapshot, '\{\}'::jsonb\)/i
  );
  assert.match(
    block,
    /cancel_reason = public\.redact_learner_free_text[\s\S]*?ti\.cancel_reason/i
  );
});

test("nested JSON redaction removes identified learner entries and is private", async () => {
  const source = await migrationSource();
  const block = functionBlock(
    source,
    "redact_learner_jsonb",
    "revoke all on function public.redact_learner_jsonb"
  );

  assert.match(block, /jsonb_array_elements\(p_document\)/i);
  assert.match(block, /jsonb_each_text\(item\.value\)/i);
  assert.match(block, /'studentid'/i);
  assert.match(block, /'displayname'/i);
  assert.match(block, /public\.redact_learner_free_text/i);
  assert.match(
    source,
    /v_before[\s\S]*?v_after[\s\S]*?v_name_character_pattern/i,
    "display names must be redacted as bounded tokens, not substrings"
  );
  assert.match(
    source,
    /revoke all on function public\.redact_learner_jsonb\(jsonb, uuid, text\)\s+from public, anon, authenticated/i
  );
});
