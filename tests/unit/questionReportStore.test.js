import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildQuestionReportSnapshot,
  deleteQuestionReport,
  loadQuestionReports,
  recordQuestionReportDecision,
  submitQuestionReport
} from "../../src/data/questionFlagStore.js";
import {
  buildQuestionReviewNotes,
  questionReportDecisionLabel
} from "../../src/data/questionReviewNotes.js";

const REPORT_ID = "91000000-0000-4000-8000-000000000001";
const STUDENT_ID = "92000000-0000-4000-8000-000000000001";

function cloudRow(overrides = {}) {
  return {
    id: REPORT_ID,
    school_id: "school-1",
    class_id: "class-1",
    student_id: STUDENT_ID,
    flag_type: "question",
    status: "open",
    decision: null,
    question_id: "initial-a-1",
    skill_id: "initial_sounds",
    skill_name: "Initial sounds",
    prompt: "Which word starts with a?",
    answer_choices: [{ label: "apple", value: "apple", image: "" }],
    images: [],
    question_snapshot: { schemaVersion: 1 },
    created_at: "2026-07-28T00:00:00.000Z",
    ...overrides
  };
}

function tableClient(response) {
  const builder = {
    delete: () => builder,
    eq: () => builder,
    order: () => builder,
    range: () => builder,
    select: () => builder,
    single: () => Promise.resolve(response),
    then: (resolve, reject) => Promise.resolve(response).then(resolve, reject),
  };
  return {
    table(name) {
      assert.equal(name, "assessment_question_reports");
      return builder;
    }
  };
}

function pagedTableClient(rows) {
  return {
    table(name) {
      assert.equal(name, "assessment_question_reports");
      let start = 0;
      let end = rows.length - 1;
      const builder = {
        order: () => builder,
        range: (nextStart, nextEnd) => {
          start = nextStart;
          end = nextEnd;
          return builder;
        },
        select: () => builder,
        then: (resolve, reject) => Promise.resolve({
          data: rows.slice(start, end + 1),
          error: null
        }).then(resolve, reject)
      };
      return builder;
    }
  };
}

function submissionAck(overrides = {}) {
  return {
    report_id: REPORT_ID,
    report_status: "open",
    report_type: "question",
    reported_at: "2026-07-28T00:00:00.000Z",
    ...overrides
  };
}

test("question snapshots keep the review evidence but omit the raw runtime object", () => {
  const snapshot = buildQuestionReportSnapshot({
    question: {
      id: "initial-a-1",
      skillId: "initial_sounds",
      prompt: "Choose a word.",
      targetWord: "apple",
      correctAnswer: "apple",
      choices: [
        { label: "apple", value: "apple", image: "/apple.webp" },
        { label: "sun", value: "sun", image: "/sun.webp" }
      ],
      internalGeneratorState: { seed: 42 }
    },
    stage: { label: "Initial sounds" },
    visiblePrompt: "Which word starts with a?"
  });

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.questionId, "initial-a-1");
  assert.equal(snapshot.prompt, "Which word starts with a?");
  assert.equal(snapshot.answerChoices.length, 2);
  assert.equal(snapshot.images.length, 2);
  assert.equal("internalGeneratorState" in snapshot, false);
});

test("a question report says saved only after the RPC returns its cloud row", async () => {
  let called = null;
  const supabase = {
    async call(name, args) {
      called = { name, args };
      return { data: [submissionAck()], error: null };
    }
  };
  const saved = await submitQuestionReport({
    supabase,
    studentId: STUDENT_ID,
    flagType: "question",
    question: { id: "initial-a-1", skillId: "initial_sounds" },
    visiblePrompt: "Which word starts with a?",
    reportId: REPORT_ID
  });

  assert.equal(saved.ok, true);
  assert.equal(saved.report.id, REPORT_ID);
  assert.equal(saved.report.status, "open");
  assert.equal(saved.report.flagType, "question");
  assert.equal(saved.report.createdAt, "2026-07-28T00:00:00.000Z");
  assert.equal(called.name, "report_assessment_question");
  assert.equal(called.args.p_report_id, REPORT_ID);
  assert.equal(called.args.p_student_id, STUDENT_ID);

  const rejected = await submitQuestionReport({
    supabase: {
      async call() {
        return { data: null, error: { code: "42501" } };
      }
    },
    studentId: STUDENT_ID,
    flagType: "question",
    reportId: REPORT_ID
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.report, null);
  assert.match(rejected.error.message, /was not sent/i);
});

test("admin reads, reviews and deletes the same cloud-backed report resource", async () => {
  const loaded = await loadQuestionReports({
    supabase: tableClient({ data: [cloudRow()], error: null })
  });
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].questionId, "initial-a-1");

  let reviewCall = null;
  const reviewed = await recordQuestionReportDecision({
    supabase: {
      async call(name, args) {
        reviewCall = { name, args };
        return {
          data: [cloudRow({
            status: "reviewed",
            decision: "question_needs_checking"
          })],
          error: null
        };
      }
    },
    reportId: REPORT_ID,
    decision: "question_needs_checking"
  });
  assert.equal(reviewed.status, "reviewed");
  assert.equal(reviewed.decision, "question_needs_checking");
  assert.equal(reviewCall.name, "admin_review_assessment_question_report");
  assert.deepEqual(reviewCall.args, {
    p_report_id: REPORT_ID,
    p_decision: "question_needs_checking",
    p_notes: ""
  });

  const deleted = await deleteQuestionReport({
    supabase: tableClient({ data: [{ id: REPORT_ID }], error: null }),
    reportId: REPORT_ID
  });
  assert.equal(deleted, REPORT_ID);
});

test("question evidence rejects remote image URLs, bounds fields and loads beyond 1,000 rows", async () => {
  const snapshot = buildQuestionReportSnapshot({
    question: {
      prompt: "p".repeat(2500),
      choices: Array.from({ length: 14 }, (_, index) => ({
        label: `Choice ${index}`,
        value: `Value ${index}`,
        image: index === 0 ? "https://tracker.example/image.png" : `/choice-${index}.webp`
      })),
      imagePath: "//tracker.example/image.png",
      targetImage: "/../private.png"
    }
  });
  assert.equal(snapshot.prompt.length, 2000);
  assert.equal(snapshot.answerChoices.length, 12);
  assert.equal(snapshot.answerChoices[0].image, "");
  assert.equal(snapshot.images.length, 12);
  assert.equal(snapshot.images.every(image => image.path.startsWith("/choice-")), true);

  const rows = Array.from({ length: 1001 }, (_, index) => cloudRow({
    id: `report-${String(index).padStart(4, "0")}`,
    created_at: new Date(Date.UTC(2026, 6, 28, 0, 0, index % 60)).toISOString()
  }));
  const loaded = await loadQuestionReports({ supabase: pagedTableClient(rows) });
  assert.equal(loaded.length, 1001);
  assert.equal(loaded[1000].id, "report-1000");
});

test("review notes describe recorded decisions without claiming a replacement happened", () => {
  const notes = buildQuestionReviewNotes([
    {
      ...cloudRow(),
      flagType: "question",
      questionId: "initial-a-1",
      skillName: "Initial sounds",
      decision: "question_needs_checking",
      decisionNotes: "Question needs checking",
      answerChoices: [],
      images: []
    }
  ]);
  assert.equal(questionReportDecisionLabel("question_needs_checking"), "Question needs checking");
  assert.match(notes, /Review decision: Question needs checking/);
  assert.doesNotMatch(notes, /replacement requested|delete this question/i);
});

test("the review screen searches and pages large queues with truthful error announcements", () => {
  const source = fs.readFileSync(
    new URL("../../src/components/admin/QuestionFlagReviewPage.jsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /const REPORTS_PER_PAGE = 12/);
  assert.match(source, /type="search"/);
  assert.match(source, /const pagedFlags = visibleFlags\.slice/);
  assert.match(source, /Found \{visibleFlags\.length\} of \{flags\.length\}/);
  assert.match(source, /Showing \$\{pagedFlags\.length\} on this page/);
  assert.match(source, /role=\{notice\.tone === "error" \? "alert" : "status"\}/);
  assert.match(source, /role="alert"[\s\S]*\{loadState\.message\}/);
});

test("the migration denies direct writes and bounds both teacher and student submissions", () => {
  const migration = fs.readFileSync(
    new URL(
      "../../supabase/migrations/20260728110000_assessment_question_reports.sql",
      import.meta.url
    ),
    "utf8"
  );
  const boundary = fs.readFileSync(
    new URL(
      "../../supabase/migrations/20260728113000_security_definer_boundary.sql",
      import.meta.url
    ),
    "utf8"
  );
  const hardening = fs.readFileSync(
    new URL(
      "../../supabase/migrations/20260728112000_assessment_question_report_review.sql",
      import.meta.url
    ),
    "utf8"
  );
  const submissionFunction = hardening.slice(
    hardening.indexOf("create function public.report_assessment_question"),
    hardening.indexOf("comment on function public.report_assessment_question")
  );

  assert.match(migration, /revoke all on public\.assessment_question_reports from public, anon, authenticated/i);
  assert.match(migration, /public\.is_app_admin\(auth\.uid\(\)\)/i);
  assert.match(migration, /session\.revoked = false[\s\S]*session\.expires_at > now\(\)/i);
  assert.match(migration, /student\.teacher_id = auth\.uid\(\)[\s\S]*public\.is_app_admin\(auth\.uid\(\)\)/i);
  assert.match(migration, /perform public\.assert_current_actor_teacher_access\(\)/i);
  assert.match(migration, /octet_length\(v_snapshot::text\) > 65536/i);
  assert.match(hardening, /revoke update on public\.assessment_question_reports from authenticated/i);
  assert.match(submissionFunction, /returns table \(\s*report_id uuid,\s*report_status text,\s*report_type text,\s*reported_at timestamptz\s*\)/i);
  assert.match(submissionFunction, /choice\.ordinality <= 12/i);
  assert.match(submissionFunction, /image\.ordinality <= 12/i);
  assert.doesNotMatch(submissionFunction, /returns setof public\.assessment_question_reports/i);
  assert.match(hardening, /reviewed_by = auth\.uid\(\)/i);
  assert.match(hardening, /char_length\(v_notes\) > 1000/i);
  assert.match(boundary, /grant execute on function public\.report_assessment_question\([\s\S]*\) to anon, authenticated/i);
  assert.match(boundary, /grant execute on function public\.admin_review_assessment_question_report\([\s\S]*\) to authenticated/i);
});
