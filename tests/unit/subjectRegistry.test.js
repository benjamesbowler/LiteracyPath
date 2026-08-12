import assert from "node:assert/strict";
import test from "node:test";

import {
  SUBJECT_IDS,
  SUBJECTS,
  assertSubjectId,
  parseSubjectHomeHash,
  resolveSubjectHomeView,
  subjectForAppView,
  subjectHomeHash,
  subjectHomeView
} from "../../src/subjects/subjectRegistry.js";

test("the subject registry exposes stable Literacy and Maths home views", () => {
  assert.deepEqual(Object.keys(SUBJECTS), [SUBJECT_IDS.LITERACY, SUBJECT_IDS.MATHS]);
  assert.equal(subjectHomeView(SUBJECT_IDS.LITERACY, "teacher"), "teacherDashboard");
  assert.equal(subjectHomeView(SUBJECT_IDS.MATHS, "teacher"), "mathsTeacherDashboard");
  assert.equal(subjectHomeView(SUBJECT_IDS.LITERACY, "student"), "studentHome");
  assert.equal(subjectHomeView(SUBJECT_IDS.MATHS, "student"), "mathsStudentHome");
  assert.equal(subjectForAppView("mathsTeacherReports"), SUBJECT_IDS.MATHS);
  assert.equal(subjectForAppView("reports"), SUBJECT_IDS.LITERACY);
  assert.ok(Object.isFrozen(SUBJECTS));
  assert.ok(Object.isFrozen(SUBJECTS.maths));
});
test("subject home hashes round-trip their audience and context", () => {
  const teacherHash = subjectHomeHash({
    subjectId: SUBJECT_IDS.MATHS,
    audience: "teacher",
    classId: "class-a",
    learnerId: "ignored-student"
  });
  assert.equal(teacherHash, "#maths/teacher?class=class-a");
  assert.deepEqual(parseSubjectHomeHash(teacherHash), {
    audience: "teacher",
    subjectId: SUBJECT_IDS.MATHS,
    appView: "mathsTeacherDashboard",
    classId: "class-a",
    learnerId: ""
  });

  const studentHash = subjectHomeHash({
    subjectId: SUBJECT_IDS.MATHS,
    audience: "student",
    classId: "class-a",
    learnerId: "learner-a"
  });
  assert.equal(studentHash, "#maths/home?class=class-a&learner=learner-a");
  assert.deepEqual(parseSubjectHomeHash(studentHash), {
    audience: "student",
    subjectId: SUBJECT_IDS.MATHS,
    appView: "mathsStudentHome",
    classId: "class-a",
    learnerId: "learner-a"
  });
});

test("an explicit route wins over stored preferences and unknown values fail to Literacy", () => {
  assert.equal(resolveSubjectHomeView({
    audience: "student",
    explicitHash: "#maths/home",
    assignedSubject: SUBJECT_IDS.LITERACY
  }), "mathsStudentHome");
  assert.equal(resolveSubjectHomeView({
    audience: "student",
    assignedSubject: SUBJECT_IDS.MATHS,
    recommendedSubject: SUBJECT_IDS.LITERACY
  }), "mathsStudentHome");
  assert.equal(resolveSubjectHomeView({
    audience: "student",
    recommendedSubject: SUBJECT_IDS.MATHS
  }), "mathsStudentHome");
  assert.equal(resolveSubjectHomeView({
    audience: "teacher",
    preferredSubject: "unknown"
  }), "teacherDashboard");
  assert.equal(parseSubjectHomeHash("#maths/not-built"), null);
});

test("unknown subject ids and audiences fail closed", () => {
  assert.throws(() => assertSubjectId("science"), /Unknown subject/);
  assert.throws(() => subjectHomeView(SUBJECT_IDS.MATHS, "parent"), /Unknown subject audience/);
});
