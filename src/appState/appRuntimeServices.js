import { APP_VIEWS } from "./appViews.js";
import { teacherIntentHash } from "./appViewHelpers.js";
import { importWithRetry } from "../utils/lazyWithRetry.js";

let audioManifestModulePromise = null;
let guidedReadingBooksModulePromise = null;
let assessmentSkillBankLoaderModulePromise = null;
let assessmentMediaPickerModulePromise = null;
let finishedReportPageModulePromise = null;

export const STUDENT_SESSION_STORAGE_KEY = "lp-student-session-v1";
export const loadTeacherRouteRuntime = () => import("./routes.js");

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

export function loadAudioManifestModule() {
  if (!audioManifestModulePromise) {
    audioManifestModulePromise = importWithRetry(() => import("../data/audioManifest"))
      .catch(error => {
        audioManifestModulePromise = null;
        throw error;
      });
  }
  return audioManifestModulePromise;
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

export async function createExcelWorkbook() {
  const metricDefinitions = await importWithRetry(() => import("../utils/metricDefinitions.js"));
  return metricDefinitions.createDefinedExcelWorkbook(importWithRetry);
}

export async function addWorkbookExportProvenance(workbook, preset, context) {
  const provenance = await importWithRetry(() => import("../utils/exportProvenance.js"));
  return provenance.addPresetExportProvenanceWorksheet(workbook, preset, context);
}
