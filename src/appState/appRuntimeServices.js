import { APP_VIEWS } from "./appViews.js";
import { teacherIntentHash } from "./appViewHelpers.js";
import { importWithRetry } from "../utils/lazyWithRetry.js";
import { isSupabaseConfigured, supabase } from "../supabaseClient.js";
import {
  flushAssessmentAttemptSyncQueue,
  hydrateAssessmentAttempts
} from "../data/assessmentHistoryStore.js";
import { resumePendingLearnerDeletions } from "../data/learnerDataRights.js";
import { useStudentFocusSession } from "../hooks/useStudentFocusSession.js";

let guidedReadingBooksModulePromise = null;
let assessmentSkillBankLoaderModulePromise = null;
let assessmentMediaPickerModulePromise = null;
let finishedReportPageModulePromise = null;
let elBenchmarkEngineModulePromise = null;

export const STUDENT_SESSION_STORAGE_KEY = "lp-student-session-v1";
export const loadTeacherRouteRuntime = () => import("./routes.js");

export function runtimeCloudIsExpected(accountId) {
  return isSupabaseConfigured && accountId !== "local";
}

export function useRuntimeStudentFocusSession(options) {
  return useStudentFocusSession({
    ...options,
    client: isSupabaseConfigured ? supabase : null,
    enabled: isSupabaseConfigured && options.enabled
  });
}

export function resumeRuntimePendingLearnerDeletions(options) {
  return resumePendingLearnerDeletions({ ...options, client: supabase });
}

export function hydrateRuntimeAssessmentAttempts(options) {
  return hydrateAssessmentAttempts({
    ...options,
    supabase: runtimeCloudIsExpected(options.teacherId) ? supabase : null
  });
}

export function flushRuntimeAssessmentAttemptSyncQueue(options) {
  return flushAssessmentAttemptSyncQueue({ ...options, supabase });
}

export async function exportStudentAssessmentWorkbook(options) {
  const { exportStudentElAssessmentExcel } = await importWithRetry(
    () => import("../utils/exportElAssessmentExcel.js")
  );
  return exportStudentElAssessmentExcel({
    ...options,
    supabase: isSupabaseConfigured ? supabase : null
  });
}

export function teacherReportHash(classId, learnerId, reportView) {
  return teacherIntentHash({
    appView: APP_VIEWS.FINISHED,
    classId,
    learnerId,
    reportView
  });
}

export function pushRouteHash(nextHash) {
  if (nextHash && window.location.hash !== nextHash) {
    window.history.pushState(window.history.state, "", nextHash);
  }
}

export function loadGuidedReadingBooksModule() {
  if (!guidedReadingBooksModulePromise) {
    guidedReadingBooksModulePromise = importWithRetry(() => import("../data/guidedReadingBooks"))
      .catch(error => {
        guidedReadingBooksModulePromise = null;
        throw error;
      });
  }
  return guidedReadingBooksModulePromise;
}

export function loadAssessmentSkillBankLoaderModule() {
  if (!assessmentSkillBankLoaderModulePromise) {
    assessmentSkillBankLoaderModulePromise = importWithRetry(() => import("../data/loadAssessmentSkillBank"))
      .catch(error => {
        assessmentSkillBankLoaderModulePromise = null;
        throw error;
      });
  }
  return assessmentSkillBankLoaderModulePromise;
}

export function loadAssessmentMediaPickerModule() {
  if (!assessmentMediaPickerModulePromise) {
    assessmentMediaPickerModulePromise = importWithRetry(() => import("../data/assessmentMediaPicker"))
      .catch(error => {
        assessmentMediaPickerModulePromise = null;
        throw error;
      });
  }
  return assessmentMediaPickerModulePromise;
}

export function loadFinishedReportPageModule() {
  if (!finishedReportPageModulePromise) {
    finishedReportPageModulePromise = importWithRetry(() => import("@/components/FinishedReportPage"))
      .catch(error => {
        finishedReportPageModulePromise = null;
        throw error;
      });
  }
  return finishedReportPageModulePromise;
}

export function loadElBenchmarkEngineModule() {
  if (!elBenchmarkEngineModulePromise) {
    elBenchmarkEngineModulePromise = importWithRetry(() => import("./elBenchmarkEngine.js"))
      .catch(error => {
        elBenchmarkEngineModulePromise = null;
        throw error;
      });
  }
  return elBenchmarkEngineModulePromise;
}

export async function createExcelWorkbook() {
  const metricDefinitions = await importWithRetry(() => import("../utils/metricDefinitions.js"));
  return metricDefinitions.createDefinedExcelWorkbook(importWithRetry);
}

export async function addWorkbookExportProvenance(workbook, preset, context) {
  const provenance = await importWithRetry(() => import("../utils/exportProvenance.js"));
  return provenance.addPresetExportProvenanceWorksheet(workbook, preset, context);
}
