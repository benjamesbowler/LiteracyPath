import assert from "node:assert/strict";
import test from "node:test";
import { buildTeacherActivityHistory, filterTeacherActivityHistory, teacherActivityHref } from "../../src/data/teacherActivityHistory.js";
import { parse as parseTeacherRoute } from "../../src/appState/routes.js";
import { teacherIntentHash } from "../../src/appState/appViewHelpers.js";
import { APP_VIEWS } from "../../src/appState/appViews.js";

const record = { attemptId: "a", classId: "c", studentId: "s", studentName: "Ada", assessmentType: "skill_checkpoint", skillName: "Initial sounds", completedAt: "2026-10-13T09:00:00Z", administrationStatus: "completed", accuracy: 99 };
const mock = { id: "m", class_id: "c", started_at: "2026-10-12T09:00:00Z", member_student_ids: ["s"], mock: { state: "paused" } };
test("activity discovery keeps original identity, scope and records without aggregating scores", () => {
  const rows = buildTeacherActivityHistory({ records: [record, record, { ...record, attemptId: "foreign", classId: "other" }], sessions: [mock, { ...mock, id: "foreign", class_id: "other" }], classId: "c", studentId: "s" });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].original, record);
  assert.equal(rows[1].original, mock);
  assert.equal(rows[0].accuracy, undefined);
  assert.equal(rows[1].state, "Paused");
  assert.equal(buildTeacherActivityHistory({ records: [record], sessions: [mock], classId: "c", studentId: "another" }).length, 0);
});
test("stable ordering breaks date ties by identity and preserves unknown completion", () => {
  const rows = buildTeacherActivityHistory({ records: [{ ...record, attemptId: "z", administrationStatus: "" }, { ...record, attemptId: "a" }], classId: "c" });
  assert.deepEqual(rows.map(row => row.id), ["assessment:a", "assessment:z"]);
  assert.match(rows[1].state, /Completion not recorded/);
});
test("filters retain separate activity types and do not invent dates", () => {
  const rows = buildTeacherActivityHistory({ records: [record, { ...record, attemptId: "practice", assessmentType: "cycle_practice_check" }, { ...record, attemptId: "unknown-date", completedAt: "" }], sessions: [mock], classId: "c" });
  assert.equal(filterTeacherActivityHistory(rows, { category: "practice" }).length, 1);
  assert.equal(filterTeacherActivityHistory(rows, { after: "2026-10-01", before: "2026-10-31" }).length, 3);
  assert.equal(filterTeacherActivityHistory(rows, { studentId: "other" }).length, 0);
});
test("record links retain exact attempt/session and class/student scope", () => {
  const rows = buildTeacherActivityHistory({ records: [record], sessions: [mock], classId: "c", studentId: "s" });
  assert.match(teacherActivityHref(rows[0]), /activity=assessment%3Aa/);
  assert.doesNotMatch(teacherActivityHref(rows[0]), /learner=/);
  assert.match(teacherActivityHref(rows[0], { reportStudentId: "s" }), /learner=s/);
  assert.match(teacherActivityHref(rows[1]), /mockSession=m/);
  assert.match(teacherActivityHref(rows[1]), /mockStudent=s/);
  assert.match(teacherActivityHref(rows[1]), /mockPhase=results/);
});
test("an archived attempt remains in the class report without making its learner an active selection", () => {
  const archived = { ...record, attemptId: "archived-attempt", studentId: "archived-student" };
  const [activity] = buildTeacherActivityHistory({ records: [archived], classId: "c" });
  const url = new URL(teacherActivityHref(activity).replace(/^#/, "/"), "https://fixture.invalid");
  assert.equal(url.searchParams.get("class"), "c");
  assert.equal(url.searchParams.get("activity"), "assessment:archived-attempt");
  assert.equal(url.searchParams.has("learner"), false);
  assert.equal(activity.original, archived);
  assert.equal(activity.studentId, "archived-student");
});

test("an exact mock result reloads with the explicit report audience and returns to that student's report", () => {
  const [activity] = buildTeacherActivityHistory({ sessions: [mock], classId: "c", studentId: "s" });
  const href = teacherActivityHref(activity, { reportStudentId: "s" });
  const params = new URLSearchParams(href.split("?")[1]);
  assert.equal(params.get("mockSession"), "m");
  assert.equal(params.get("mockPhase"), "results");
  assert.equal(params.get("mockStudent"), "s");
  const reloadedRoute = parseTeacherRoute(href);
  assert.equal(reloadedRoute.appView, APP_VIEWS.ASSESSMENTS);
  assert.equal(reloadedRoute.classId, "c");
  assert.equal(reloadedRoute.learnerId, "s");
  const returnedRoute = parseTeacherRoute(teacherIntentHash({ ...reloadedRoute, appView: APP_VIEWS.REPORTS }));
  assert.equal(returnedRoute.appView, APP_VIEWS.REPORTS);
  assert.equal(returnedRoute.classId, "c");
  assert.equal(returnedRoute.learnerId, "s");
});

test("class-history mock filters retain result identity without making active or archived learners the report audience", () => {
  const [activity] = buildTeacherActivityHistory({ sessions: [mock], classId: "c" });
  for (const studentId of ["", "s", "archived-student"]) {
    const href = teacherActivityHref({ ...activity, studentId });
    const params = new URLSearchParams(href.split("?")[1]);
    assert.equal(params.get("class"), "c");
    assert.equal(params.get("mockSession"), "m");
    assert.equal(params.get("mockStudent") || "", studentId);
    assert.equal(params.has("learner"), false);
    const reloadedRoute = parseTeacherRoute(href);
    assert.equal(reloadedRoute.learnerId, "");
    assert.equal(parseTeacherRoute(teacherIntentHash({ ...reloadedRoute, appView: APP_VIEWS.REPORTS })).learnerId, "");
  }
});
