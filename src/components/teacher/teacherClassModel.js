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

export function activityIsAtLeastDaysOld(value, minimumDays, now = new Date()) {
  const activeAt = value ? new Date(value) : null;
  const current = now instanceof Date ? now : new Date(now);
  const threshold = Math.max(0, Number(minimumDays) || 0);
  if (!activeAt || !Number.isFinite(activeAt.getTime()) || !Number.isFinite(current.getTime())) {
    return false;
  }
  return current.getTime() - activeAt.getTime() >= threshold * 86400000;
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
    assessment: firstCheckComplete
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

// One reading of the roster, shared by both pages. Kept pure as well as hooked
// so the activity contract can be tested without a browser: creating or
// renaming a student is not learning activity.
export function buildTeacherStudentRows({ studentList = [], classDashboard = [] } = {}) {
  const dashboardById = new Map(classDashboard.map(row => [row.id, row]));
  return studentList.map(student => {
      const hasDashboardRow = dashboardById.has(student.id);
      const dashboardRow = dashboardById.get(student.id) || {};
      const evidenceReadStatus = dashboardRow.evidenceReadStatus
        || (hasDashboardRow ? "complete" : "incomplete");
      const normalized = {
        ...student,
        answered: dashboardRow.answered ?? 0,
        correct: dashboardRow.correct ?? null,
        accuracy: dashboardRow.accuracy ?? null,
        masteredCount: dashboardRow.masteredCount ?? 0,
        currentSkill: dashboardRow.currentSkill || "Not started",
        soundSeekers: dashboardRow.soundSeekers || null,
        // Only a real saved learning event may set this field. Roster creation,
        // name edits and profile changes update student timestamps but do not
        // mean the student practised or completed a check.
        lastActive: dashboardRow.lastActive || student.lastActive || null,
        focusEvidence: dashboardRow.focusEvidence || null,
        evidenceReadStatus,
        evidenceMissingSources: dashboardRow.evidenceMissingSources
          || (hasDashboardRow ? [] : ["dashboard"]),
        currentAnswered: dashboardRow.currentAnswered ?? dashboardRow.answered ?? 0,
        currentCorrect: dashboardRow.currentCorrect ?? dashboardRow.correct ?? null,
        currentAccuracy: dashboardRow.currentAccuracy ?? dashboardRow.accuracy ?? null,
        currentEvidenceSkills: dashboardRow.currentEvidenceSkills
          || dashboardRow.evidenceSkills
          || [],
        currentLastActive: dashboardRow.currentLastActive
          || dashboardRow.lastActive
          || null,
        recentAnswers: dashboardRow.recentAnswers ?? 0,
        previousAnswers: dashboardRow.previousAnswers ?? 0,
        recentMastered: dashboardRow.recentMastered ?? 0,
        previousMastered: dashboardRow.previousMastered ?? 0,
        reducedChoiceMode: Boolean(dashboardRow.reducedChoiceMode),
        accessibilitySettings: normalizeLearnerAccessibilitySettings(
          dashboardRow.accessibilitySettings
        )
      };
      const conclusion = evaluateLearningConclusion({
        accuracy: normalized.currentAccuracy,
        attempts: normalized.currentAnswered,
        skillDiversity: Array.isArray(normalized.currentEvidenceSkills)
          ? normalized.currentEvidenceSkills.length
          : normalized.currentSkill && normalized.currentSkill !== "Not started"
            ? 1
            : 0,
        observedAt: normalized.currentLastActive
      });
      normalized.learningConclusion = normalized.evidenceReadStatus === "complete"
        ? conclusion
        : {
          ...conclusion,
          ready: false,
          status: {
            id: LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE,
            label: "Not enough results"
          },
          reason: "Some saved results could not be loaded."
        };
      return normalized;
    });
}

export function useTeacherStudentRows({ studentList = [], classDashboard = [] } = {}) {
  return useMemo(
    () => buildTeacherStudentRows({ studentList, classDashboard }),
    [classDashboard, studentList]
  );
}

// The setup checklist is the teacher's only map of what is left to do, so both
// pages show it until setup is finished. It used to live on Today alone, which
// meant it vanished at the exact moment a teacher followed it onto Students.
// 2026-07-27: `classCount` added. `hasSetupClass` was `Boolean(selectedClass)` — the
// SELECTED class, not whether the teacher has any. Landing on Today with no class
// chosen therefore scored every step incomplete and showed a returning teacher
// "Get set up in four steps · 0 of 4 · Create your class" with a primary button that
// would have made a duplicate class. Observed live on the deployed preview with one
// class ("Trial") and two students already on the account.
//
// Steps 2-4 describe ONE class (its students, their sign-ins, their first result), so
// they cannot be scored at all until a class is chosen. When classes exist but none is
// selected the checklist is therefore withheld entirely rather than shown part-filled —
// the page header already says "Choose a class to see today's next actions", and the
// class picker is right there.
export function useTeacherSetupState({ selectedClass = null, selectedClassId = "", studentRows = [], classCount = 0 } = {}) {
  const hasAnyClass = classCount > 0 || Boolean(selectedClass);
  const awaitingClassChoice = !selectedClass && hasAnyClass;
  const hasSetupClass = hasAnyClass;
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
    awaitingClassChoice,
    showSetupChecklist: !awaitingClassChoice && !setupComplete && !setupEverComplete,
    studentsMissingSignIn: studentRows.filter(row => !row.symbol_password)
  };
}
