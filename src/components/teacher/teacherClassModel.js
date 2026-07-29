// The shared model behind the two teacher class pages.
//
// Today (decide what to do) and Students (manage the class) used to be one
// component forking on a boolean, which meant ~60% of the file was invisible on
// whichever route you were looking at. The pages are separate now; the reading
// of the roster they both depend on lives here once, so the two pages can never
// disagree about who needs attention or whether setup is finished.
import { useEffect, useMemo } from "react";
import {
  LEARNING_CONCLUSION_SCOPES,
  LEARNING_STATUS_IDS,
  evaluateLearningConclusion
} from "../../policy/learningPolicy.js";
import { normalizeLearnerAccessibilitySettings } from "../../accessibility/learnerAccessibility.js";
import { TEACHER_TODAY_POLICY } from "../../utils/teacherTodayBriefing.js";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";

// Derived, never re-typed: the roster's quiet-student filter and Today's
// "progress review due" list must count the same number of days.
export const ROSTER_INACTIVE_DAYS = TEACHER_TODAY_POLICY.inactivityDueDays;

// ONE numeric reading of "how long ago was this?".
//
// The roster label and the roster filters used to be two separate readings of
// the same timestamp: the filters compared the FORMATTED label, and
// formatLastActive only says "N days ago" for the first week. A child last seen
// three weeks ago formats as a plain date, so a label-matching filter dropped
// exactly the quiet children it was meant to surface — while Today's briefing,
// which subtracts timestamps, still listed them. Both surfaces now count days
// from the same timestamp, so they cannot disagree again.
export function activityDaysAgo(value, now = new Date()) {
  const date = value ? new Date(value) : null;
  const current = now instanceof Date ? now : new Date(now);
  if (!date || !Number.isFinite(date.getTime()) || !Number.isFinite(current.getTime())) {
    return null;
  }
  const startOfNow = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startOfNow - startOfDate) / 86400000);
}

export function activityIsFromToday(value, now = new Date()) {
  const days = activityDaysAgo(value, now);
  return days !== null && days <= 0;
}

export function formatLastActive(value, now = new Date()) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);

  const diffDays = activityDaysAgo(value, now);
  if (diffDays === null) return String(value);
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

// The roster's status filter, as a pure function, so the quiet-student rule can
// be proved against a real timestamp instead of a rendered label.
export const ROSTER_STATUS_FILTERS = Object.freeze({
  ALL: "all",
  SIGN_IN_MISSING: "login-missing",
  NO_SCORED_ANSWERS: "not-started",
  NEEDS_ATTENTION: "needs-attention",
  NO_RECENT_ACTIVITY: "no-recent-activity"
});

export function rosterMatchesStatusFilter(row, filterId, { now = new Date(), inactiveDays } = {}) {
  if (!row || !filterId || filterId === ROSTER_STATUS_FILTERS.ALL) return true;
  if (filterId === ROSTER_STATUS_FILTERS.SIGN_IN_MISSING) return !row.symbol_password;
  if (filterId === ROSTER_STATUS_FILTERS.NO_SCORED_ANSWERS) {
    return row.evidenceReadStatus === "complete" && row.answered === 0;
  }
  if (filterId === ROSTER_STATUS_FILTERS.NEEDS_ATTENTION) return needsSupportConclusion(row);
  if (filterId === ROSTER_STATUS_FILTERS.NO_RECENT_ACTIVITY) {
    if (row.evidenceReadStatus !== "complete") return false;
    const days = Number.isFinite(Number(inactiveDays))
      ? Number(inactiveDays)
      : ROSTER_INACTIVE_DAYS;
    return activityIsAtLeastDaysOld(row.lastActive, days, now);
  }
  return true;
}

// One skill, one row: group a student's saved answers by the skill they were
// answering, so the student panel can show accuracy and learning status as two
// separate facts. A skill with too few answers keeps its own honest status and
// never becomes a low percentage.
export function buildStudentSkillEvidence(answerHistory = [], { now = new Date() } = {}) {
  const answers = Array.isArray(answerHistory) ? answerHistory : [];
  const bySkill = new Map();
  answers.forEach(answer => {
    const skill = String(answer?.skill || "").trim();
    if (!skill) return;
    const entry = bySkill.get(skill)
      || { skill, answered: 0, correct: 0, lastActive: null };
    entry.answered += 1;
    if (answer?.isCorrect) entry.correct += 1;
    const answeredAt = answer?.answeredAt || "";
    if (answeredAt && (!entry.lastActive || answeredAt > entry.lastActive)) {
      entry.lastActive = answeredAt;
    }
    bySkill.set(skill, entry);
  });
  return [...bySkill.values()]
    .sort((left, right) => (
      String(right.lastActive || "").localeCompare(String(left.lastActive || ""))
      || left.skill.localeCompare(right.skill)
    ))
    .map(entry => concludeSkillRow(entry, now));
}

function concludeSkillRow(entry, now) {
  const accuracy = entry.answered > 0
    ? Math.round((entry.correct / entry.answered) * 100)
    : null;
  return {
    ...entry,
    accuracy,
    conclusion: evaluateLearningConclusion({
      scope: LEARNING_CONCLUSION_SCOPES.SKILL,
      accuracy,
      attempts: entry.answered,
      skillDiversity: 1,
      observedAt: entry.lastActive,
      now
    })
  };
}

// Some reads deliver the current skill's saved answers without the full answer
// list behind them. One true row beats claiming a student has answered nothing.
export function buildStudentPanelSkillRows(
  { answerHistory = [], focusEvidence = null } = {},
  { now = new Date() } = {}
) {
  const rows = buildStudentSkillEvidence(answerHistory, { now });
  if (rows.length) return rows;
  const skill = String(focusEvidence?.skill || "").trim();
  const answered = Number(focusEvidence?.answered) || 0;
  if (!skill || answered <= 0) return rows;
  return [concludeSkillRow({
    skill,
    answered,
    correct: Number(focusEvidence?.correct) || 0,
    lastActive: focusEvidence?.lastActive || null
  }, now)];
}

export function summariseSkillStatuses(skillRows = []) {
  const counts = { secure: 0, developing: 0, needsSupport: 0 };
  skillRows.forEach(row => {
    if (!row?.conclusion?.ready) return;
    if (row.conclusion.status.id === LEARNING_STATUS_IDS.SECURE) counts.secure += 1;
    else if (row.conclusion.status.id === LEARNING_STATUS_IDS.DEVELOPING) counts.developing += 1;
    else if (row.conclusion.status.id === LEARNING_STATUS_IDS.NEEDS_SUPPORT) counts.needsSupport += 1;
  });
  return counts;
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
