import {
  assessmentAttemptsToSkillLedger,
  computeSkillStatus
} from "./skillStatusPolicy.js";
import { STUDENT_FOCUS_TARGETS } from "./studentFocusTargets.js";

export const STUDENT_FOCUS_AUDIENCES = Object.freeze({
  WHOLE_CLASS: "whole_class",
  SELECTED_STUDENTS: "selected_students"
});

export const STUDENT_SKILL_ASSIGNMENT_MODES = Object.freeze({
  EACH_CHILD_NEXT: "each_child_next",
  ONE_SKILL_FOR_EVERYONE: "one_skill_for_everyone"
});

export const STUDENT_ADVENTURE_MAP_MODES = Object.freeze({
  EACH_CHILD_CURRENT: "each_child_current",
  ONE_SPACE_FOR_EVERYONE: "one_space_for_everyone"
});

export const STUDENT_CYCLE_PRACTICE_MODES = Object.freeze({
  ONE_CYCLE_FOR_EVERYONE: "one_cycle_for_everyone",
  CYCLE_PER_STUDENT: "cycle_per_student"
});

const SKILL_PHASE_PATH = Object.freeze([
  Object.freeze({ level: 1, phase: 1 }),
  Object.freeze({ level: 1, phase: 2 }),
  Object.freeze({ level: 2, phase: 1 }),
  Object.freeze({ level: 2, phase: 2 })
]);

function sameText(left, right) {
  return String(left || "").trim().toLocaleLowerCase()
    === String(right || "").trim().toLocaleLowerCase();
}

function activeRoster(students = []) {
  return students.filter(student => student?.id && !student.archived_at);
}

/**
 * Whole-class scope deliberately sends no client-authored roster ids. The
 * server derives the authoritative active roster, while `students` remains the
 * loaded roster used to build evidence-bounded Skills assignments.
 */
export function resolveStudentFocusAudience({
  audience,
  students = [],
  selectedStudentIds = []
} = {}) {
  const roster = activeRoster(students);
  const wholeClass = audience === STUDENT_FOCUS_AUDIENCES.WHOLE_CLASS;
  if (wholeClass) {
    return {
      wholeClass: true,
      studentIds: [],
      students: roster
    };
  }

  const selected = new Set(selectedStudentIds.filter(Boolean).map(String));
  const chosenStudents = roster.filter(student => selected.has(String(student.id)));
  return {
    wholeClass: false,
    studentIds: chosenStudents.map(student => student.id),
    students: chosenStudents
  };
}

/** Skills assignment is safe only when both the global attempt archive and
 * every included learner's class evidence read are complete. */
export function hasCompleteStudentFocusSkillsEvidence({
  assessmentHistoryReady = false,
  students = [],
  classDashboard = []
} = {}) {
  const includedStudents = activeRoster(students);
  const dashboardById = new Map(
    classDashboard.map(row => [String(row?.id || ""), row])
  );
  return assessmentHistoryReady === true
    && includedStudents.length > 0
    && includedStudents.every(student => (
      dashboardById.get(String(student.id))?.evidenceReadStatus === "complete"
    ));
}

export function nextEligibleSkillPhase(status) {
  return SKILL_PHASE_PATH.find(step => (
    status?.[`level${step.level}`]?.phases?.[step.phase]?.passed !== true
  )) || SKILL_PHASE_PATH.at(-1);
}

export function buildStudentSkillAssignment({
  student,
  classDashboard = [],
  skillTree = [],
  assessmentHistory = [],
  mode = STUDENT_SKILL_ASSIGNMENT_MODES.EACH_CHILD_NEXT,
  commonSkillId = ""
} = {}) {
  const dashboard = classDashboard.find(row => String(row?.id) === String(student?.id));
  const commonMode = mode === STUDENT_SKILL_ASSIGNMENT_MODES.ONE_SKILL_FOR_EVERYONE;
  const requestedIndex = commonMode
    ? skillTree.findIndex(skill => String(skill?.id) === String(commonSkillId))
    : skillTree.findIndex(skill => sameText(skill?.label, dashboard?.currentSkill));
  const resolvedIndex = commonMode ? requestedIndex : requestedIndex >= 0 ? requestedIndex : 0;
  const skill = resolvedIndex >= 0 ? skillTree[resolvedIndex] : null;
  const studentAttempts = assessmentHistory.filter(record => (
    String(record?.studentId || "") === String(student?.id || "")
    && record?.skillId === skill?.id
  ));
  const status = skill
    ? computeSkillStatus(
        assessmentAttemptsToSkillLedger(studentAttempts, skill.id),
        skill.id
      )
    : null;
  const nextPhase = nextEligibleSkillPhase(status);

  return {
    skill_id: skill?.id || "",
    skill_label: skill?.label || "Skills Assessment",
    skill_index: resolvedIndex,
    level: nextPhase.level,
    phase: nextPhase.phase
  };
}

/**
 * Builds the only assignment shapes accepted by Student Focus sessions.
 * Skills are per student because phase eligibility differs by evidence. Exact
 * shared content uses `*`, and the server applies it to its resolved roster.
 */
export function buildStudentFocusAssignments({
  target,
  students = [],
  classDashboard = [],
  skillTree = [],
  assessmentHistory = [],
  skillAssignmentMode = STUDENT_SKILL_ASSIGNMENT_MODES.EACH_CHILD_NEXT,
  commonSkillId = "",
  selectedBook = null,
  selectedGame = null,
  adventureMapMode = STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT,
  selectedMapSpace = null,
  cyclePracticeMode = STUDENT_CYCLE_PRACTICE_MODES.ONE_CYCLE_FOR_EVERYONE,
  commonCycle = null,
  cycleByStudent = {}
} = {}) {
  if (target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT) {
    return Object.fromEntries(activeRoster(students).map(student => [
      student.id,
      buildStudentSkillAssignment({
        student,
        classDashboard,
        skillTree,
        assessmentHistory,
        mode: skillAssignmentMode,
        commonSkillId
      })
    ]));
  }

  if (target === STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK && selectedBook?.id) {
    return {
      "*": {
        book_id: String(selectedBook.id),
        book_title: String(selectedBook.title || "")
      }
    };
  }

  if (
    target === STUDENT_FOCUS_TARGETS.ARCADE_GAME
    && selectedGame?.id
    && selectedGame.hidden !== true
  ) {
    return {
      "*": {
        game_id: String(selectedGame.id),
        game_title: String(selectedGame.title || "")
      }
    };
  }

  if (target === STUDENT_FOCUS_TARGETS.ADVENTURE_MAP) {
    if (adventureMapMode === STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT) {
      return {
        "*": { map_mode: STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT }
      };
    }

    const cycleNumber = Number(selectedMapSpace?.cycleNumber);
    const cycleId = String(selectedMapSpace?.cycleId || "");
    const validCycle = Number.isInteger(cycleNumber)
      && cycleNumber >= 1
      && cycleNumber <= 27
      && cycleId === `cycle-${cycleNumber}`;
    if (
      adventureMapMode !== STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE
      || !validCycle
      || !String(selectedMapSpace?.spaceName || "").trim()
    ) {
      return {};
    }
    return {
      "*": {
        map_mode: STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE,
        cycle_id: cycleId,
        cycle_number: cycleNumber,
        space_name: String(selectedMapSpace.spaceName).trim()
      }
    };
  }

  if (target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE) {
    function cycleConfig(cycle) {
      const cycleNumber = Number(cycle?.cycleNumber);
      const cycleId = String(cycle?.id || "");
      if (
        !Number.isInteger(cycleNumber)
        || cycleNumber < 1
        || cycleNumber > 27
        || cycleId !== `cycle-${cycleNumber}`
        || !String(cycle?.title || "").trim()
      ) return null;
      return {
        cycle_id: cycleId,
        cycle_number: cycleNumber,
        cycle_title: String(cycle.title).trim()
      };
    }

    const shared = cycleConfig(commonCycle);
    if (cyclePracticeMode === STUDENT_CYCLE_PRACTICE_MODES.ONE_CYCLE_FOR_EVERYONE) {
      return shared ? { "*": shared } : {};
    }

    return Object.fromEntries(activeRoster(students).map(student => {
      const config = cycleConfig(cycleByStudent?.[student.id] || commonCycle);
      return [student.id, config || {}];
    }));
  }

  return {};
}
