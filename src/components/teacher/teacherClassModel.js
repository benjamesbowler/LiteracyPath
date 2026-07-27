// The shared model behind the two teacher class pages.
//
// Today (decide what to do) and Students (manage the class) used to be one
// component forking on a boolean, which meant ~60% of the file was invisible on
// whichever route you were looking at. The pages are separate now; the reading
// of the roster they both depend on lives here once, so the two pages can never
// disagree about who needs attention or whether setup is finished.
import { useEffect, useMemo } from "react";
import { LEARNING_STATUS_IDS, evaluateLearningConclusion } from "../../policy/learningPolicy.js";
import { normalizeLearnerAccessibilitySettings } from "../../accessibility/learnerAccessibility.js";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";

export function formatLastActive(value) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function accuracyConclusion(row) {
  if (!row?.learningConclusion) return "Not checked";
  if (!row.learningConclusion.ready) return row.learningConclusion.status.label;
  return `${row.learningConclusion.accuracy}%`;
}

export function needsSupportConclusion(row) {
  return row?.learningConclusion?.ready
    && row.learningConclusion.status.id === LEARNING_STATUS_IDS.NEEDS_SUPPORT;
}

export function latestMetricUpdate(values = []) {
  return values
    .filter(Boolean)
    .map(value => ({ value, timestamp: new Date(value).getTime() }))
    .filter(row => Number.isFinite(row.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp)
    .at(-1)?.value || "";
}

export function getProgressPercent(row, skillTotal) {
  if (!skillTotal) return 0;
  return Math.max(0, Math.min(100, Math.round((row.masteredCount / skillTotal) * 100)));
}

// The only place step completion is decided. Both pages read this list, so the
// progress count, the "Continue" button and the app's own idea of "setup
// finished" can no longer drift apart. The keys here MUST match the step ids in
// TEACHER_COPY.setup.steps.
export function buildSetupSteps({
  hasClass = false,
  hasStudents = false,
  loginsReady = false,
  firstCheckComplete = false
} = {}) {
  const completionById = {
    class: hasClass,
    students: hasStudents,
    "sign-in": loginsReady,
    check: firstCheckComplete
  };
  return TEACHER_COPY.setup.steps.map(step => ({
    ...step,
    complete: Boolean(completionById[step.id])
  }));
}

const SETUP_DONE_STORAGE_PREFIX = "teacherSetupComplete:";

export function readSetupEverComplete(classId) {
  if (!classId || typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(`${SETUP_DONE_STORAGE_PREFIX}${classId}`) === "true";
  } catch {
    return false;
  }
}

export function rememberSetupComplete(classId) {
  if (!classId || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`${SETUP_DONE_STORAGE_PREFIX}${classId}`, "true");
  } catch {
    // Storage unavailable: the checklist simply shows again next visit.
  }
}

// One reading of the roster, shared by both pages.
export function useTeacherStudentRows({ studentList = [], classDashboard = [] } = {}) {
  const dashboardById = useMemo(
    () => new Map(classDashboard.map(row => [row.id, row])),
    [classDashboard]
  );
  return useMemo(
    () => studentList.map(student => {
      const dashboardRow = dashboardById.get(student.id) || {};
      const normalized = {
        ...student,
        answered: dashboardRow.answered ?? 0,
        correct: dashboardRow.correct ?? null,
        accuracy: dashboardRow.accuracy ?? null,
        masteredCount: dashboardRow.masteredCount ?? 0,
        currentSkill: dashboardRow.currentSkill || "Not started",
        soundSeekers: dashboardRow.soundSeekers || null,
        lastActive: dashboardRow.lastActive || student.lastActive || student.updated_at || student.created_at || null,
        recentAnswers: dashboardRow.recentAnswers ?? 0,
        previousAnswers: dashboardRow.previousAnswers ?? 0,
        recentMastered: dashboardRow.recentMastered ?? 0,
        previousMastered: dashboardRow.previousMastered ?? 0,
        reducedChoiceMode: Boolean(dashboardRow.reducedChoiceMode),
        accessibilitySettings: normalizeLearnerAccessibilitySettings(
          dashboardRow.accessibilitySettings
        )
      };
      normalized.learningConclusion = evaluateLearningConclusion({
        accuracy: normalized.accuracy,
        attempts: normalized.answered,
        skillDiversity: Array.isArray(dashboardRow.evidenceSkills)
          ? dashboardRow.evidenceSkills.length
          : normalized.currentSkill && normalized.currentSkill !== "Not started"
            ? 1
            : 0,
        observedAt: normalized.lastActive
      });
      return normalized;
    }),
    [dashboardById, studentList]
  );
}

// The setup checklist is the teacher's only map of what is left to do, so both
// pages show it until setup is finished. It used to live on Today alone, which
// meant it vanished at the exact moment a teacher followed it onto Students.
export function useTeacherSetupState({ selectedClass = null, selectedClassId = "", studentRows = [] } = {}) {
  const hasSetupClass = Boolean(selectedClass);
  const hasSetupLearners = studentRows.length > 0;
  const setupLoginsReady = hasSetupLearners && studentRows.every(row => Boolean(row.symbol_password));
  const firstCheckComplete = studentRows.some(row => row.answered > 0);
  const setupSteps = useMemo(
    () => buildSetupSteps({
      hasClass: hasSetupClass,
      hasStudents: hasSetupLearners,
      loginsReady: setupLoginsReady,
      firstCheckComplete
    }),
    [hasSetupClass, hasSetupLearners, setupLoginsReady, firstCheckComplete]
  );
  const setupComplete = setupSteps.every(step => step.complete);

  // Once a class has finished setup, adding one student later must not throw the
  // whole four-step banner back up. The lighter sign-in strip covers it. The
  // latch is remembered per class on this device, so it survives a reload.
  const setupEverComplete = useMemo(
    () => setupComplete || readSetupEverComplete(selectedClassId),
    [selectedClassId, setupComplete]
  );

  useEffect(() => {
    if (selectedClassId && setupComplete) rememberSetupComplete(selectedClassId);
  }, [selectedClassId, setupComplete]);

  return {
    hasSetupClass,
    setupSteps,
    setupComplete,
    setupEverComplete,
    showSetupChecklist: !setupComplete && !setupEverComplete,
    studentsMissingSignIn: studentRows.filter(row => !row.symbol_password)
  };
}
