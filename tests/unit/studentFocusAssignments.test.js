import assert from "node:assert/strict";
import test from "node:test";

import {
  STUDENT_FOCUS_AUDIENCES,
  STUDENT_ADVENTURE_MAP_MODES,
  STUDENT_SKILL_ASSIGNMENT_MODES,
  buildStudentFocusAssignments,
  hasCompleteStudentFocusSkillsEvidence,
  resolveStudentFocusAudience
} from "../../src/policy/studentFocusAssignments.js";
import { STUDENT_FOCUS_TARGETS } from "../../src/policy/studentFocusTargets.js";

const students = [
  { id: "student-a", name: "Amina" },
  { id: "student-b", name: "Ben" },
  { id: "student-archived", name: "Cara", archived_at: "2026-08-01T00:00:00.000Z" }
];

const skillTree = [
  { id: "initial_sounds", label: "Initial Sounds" },
  { id: "final_sounds", label: "Final Sounds" }
];

function passedPhaseOneRecord(studentId, skillId) {
  const completedAt = new Date().toISOString();
  return {
    id: `${studentId}-${skillId}-phase-one`,
    attemptId: `${studentId}-${skillId}-phase-one`,
    studentId,
    skillId,
    skillLevel: 1,
    skillPhase: 1,
    totalQuestions: 10,
    completedAt,
    questionRecords: Array.from({ length: 10 }, (_, index) => ({
      questionId: `${skillId}-question-${index}`,
      skillId,
      level: 1,
      phase: 1,
      isCorrect: true,
      timestamp: completedAt
    }))
  };
}

test("whole class sends no client roster ids but keeps the loaded active roster for assignments", () => {
  const resolved = resolveStudentFocusAudience({
    audience: STUDENT_FOCUS_AUDIENCES.WHOLE_CLASS,
    students,
    selectedStudentIds: ["student-a"]
  });

  assert.equal(resolved.wholeClass, true);
  assert.deepEqual(resolved.studentIds, []);
  assert.deepEqual(resolved.students.map(student => student.id), ["student-a", "student-b"]);
});

test("selected-student scope sends only valid chosen active ids", () => {
  const resolved = resolveStudentFocusAudience({
    audience: STUDENT_FOCUS_AUDIENCES.SELECTED_STUDENTS,
    students,
    selectedStudentIds: ["student-archived", "missing", "student-b"]
  });

  assert.equal(resolved.wholeClass, false);
  assert.deepEqual(resolved.studentIds, ["student-b"]);
  assert.deepEqual(resolved.students.map(student => student.id), ["student-b"]);
});

test("Skills assignment requires both the complete archive and complete included-student evidence", () => {
  const completeDashboard = students.slice(0, 2).map(student => ({
    id: student.id,
    evidenceReadStatus: "complete"
  }));
  assert.equal(hasCompleteStudentFocusSkillsEvidence({
    assessmentHistoryReady: false,
    students,
    classDashboard: completeDashboard
  }), false);
  assert.equal(hasCompleteStudentFocusSkillsEvidence({
    assessmentHistoryReady: true,
    students,
    classDashboard: completeDashboard
  }), true);
  assert.equal(hasCompleteStudentFocusSkillsEvidence({
    assessmentHistoryReady: true,
    students,
    classDashboard: completeDashboard.slice(0, 1)
  }), false);
});

test("exact books and games use one bounded wildcard config", () => {
  assert.deepEqual(buildStudentFocusAssignments({
    target: STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK,
    students,
    selectedBook: { id: "book-7", title: "A Rainy Day", pages: [{ pageNumber: 1 }] }
  }), {
    "*": { book_id: "book-7", book_title: "A Rainy Day" }
  });

  assert.deepEqual(buildStudentFocusAssignments({
    target: STUDENT_FOCUS_TARGETS.ARCADE_GAME,
    students,
    selectedGame: { id: "rocket-run", title: "Rocket Run", hidden: false }
  }), {
    "*": { game_id: "rocket-run", game_title: "Rocket Run" }
  });

  assert.deepEqual(buildStudentFocusAssignments({
    target: STUDENT_FOCUS_TARGETS.ARCADE_GAME,
    students,
    selectedGame: { id: "retired-game", title: "Retired Game", hidden: true }
  }), {});
});

test("Adventure Map can assign each child their current space", () => {
  assert.deepEqual(buildStudentFocusAssignments({
    target: STUDENT_FOCUS_TARGETS.ADVENTURE_MAP,
    students,
    adventureMapMode: STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT
  }), {
    "*": { map_mode: "each_child_current" }
  });
});

test("Adventure Map can assign one exact space to everyone", () => {
  assert.deepEqual(buildStudentFocusAssignments({
    target: STUDENT_FOCUS_TARGETS.ADVENTURE_MAP,
    students,
    adventureMapMode: STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE,
    selectedMapSpace: {
      cycleId: "cycle-14",
      cycleNumber: 14,
      spaceName: "Fern Jungle"
    }
  }), {
    "*": {
      map_mode: "one_space_for_everyone",
      cycle_id: "cycle-14",
      cycle_number: 14,
      space_name: "Fern Jungle"
    }
  });

  assert.deepEqual(buildStudentFocusAssignments({
    target: STUDENT_FOCUS_TARGETS.ADVENTURE_MAP,
    students,
    adventureMapMode: STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE,
    selectedMapSpace: { cycleId: "cycle-40", cycleNumber: 40, spaceName: "Missing" }
  }), {});
});

test("one common skill still starts each child at their own next eligible phase", () => {
  const assignments = buildStudentFocusAssignments({
    target: STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT,
    students,
    classDashboard: [
      { id: "student-a", currentSkill: "Final Sounds" },
      { id: "student-b", currentSkill: "Final Sounds" }
    ],
    skillTree,
    assessmentHistory: [passedPhaseOneRecord("student-a", "initial_sounds")],
    skillAssignmentMode: STUDENT_SKILL_ASSIGNMENT_MODES.ONE_SKILL_FOR_EVERYONE,
    commonSkillId: "initial_sounds"
  });

  assert.equal(assignments["student-a"].skill_id, "initial_sounds");
  assert.deepEqual(
    { level: assignments["student-a"].level, phase: assignments["student-a"].phase },
    { level: 1, phase: 2 }
  );
  assert.equal(assignments["student-b"].skill_id, "initial_sounds");
  assert.deepEqual(
    { level: assignments["student-b"].level, phase: assignments["student-b"].phase },
    { level: 1, phase: 1 }
  );
  assert.equal(assignments["student-archived"], undefined);
});

test("each-child mode follows the child's current skill", () => {
  const assignments = buildStudentFocusAssignments({
    target: STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT,
    students: [students[0]],
    classDashboard: [{ id: "student-a", currentSkill: "Final Sounds" }],
    skillTree,
    assessmentHistory: [],
    skillAssignmentMode: STUDENT_SKILL_ASSIGNMENT_MODES.EACH_CHILD_NEXT
  });

  assert.equal(assignments["student-a"].skill_id, "final_sounds");
  assert.equal(assignments["student-a"].skill_index, 1);
  assert.equal(assignments["student-a"].level, 1);
  assert.equal(assignments["student-a"].phase, 1);
});
