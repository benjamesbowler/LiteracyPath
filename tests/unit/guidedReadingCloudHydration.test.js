import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const controllerSource = readFileSync(
  new URL("../../src/appState/useAppSessionController.js", import.meta.url),
  "utf8"
);
const progressSyncSource = readFileSync(
  new URL("../../src/utils/progressSync.js", import.meta.url),
  "utf8"
);

test("teacher-selected Guided Reading waits for cloud progress before reading the device cache", () => {
  const loadStudentProgress = controllerSource.slice(
    controllerSource.indexOf("async function loadStudentProgress"),
    controllerSource.indexOf("async function createStudentForSelectedClass")
  );
  const hydrationStart = loadStudentProgress.indexOf("const progressHydrationPromise");
  const hydrationAwait = loadStudentProgress.indexOf("progressHydrationPromise", hydrationStart + 1);
  const guidedReadingRead = loadStudentProgress.indexOf(
    "setGuidedReadingRecords(loadGuidedReadingRecords(selectedStudentId))"
  );

  assert.ok(hydrationStart >= 0);
  assert.ok(hydrationAwait > hydrationStart);
  assert.ok(guidedReadingRead > hydrationAwait);
  assert.match(loadStudentProgress, /\["studentProgress", studentProgressError\]/);
  assert.match(loadStudentProgress, /studentProgress:\s*\{/);
});

test("teacher cloud-progress hydration pages every row and fails on an incomplete read", () => {
  const fetchProgress = progressSyncSource.slice(
    progressSyncSource.indexOf("export async function fetchStudentCloudProgress"),
    progressSyncSource.indexOf("async function applyResetTombstone")
  );

  assert.match(fetchProgress, /selectAllRows\(\(\) => supabase/);
  assert.match(fetchProgress, /if \(result\.truncated\)/);
  assert.match(fetchProgress, /throw new Error/);
});

test("a device-storage failure cannot prevent Guided Reading from entering the cloud queue", () => {
  const saveRecord = controllerSource.slice(
    controllerSource.indexOf("function saveGuidedReadingRecord"),
    controllerSource.indexOf("function clearTeacherState")
  );
  const guardedDeviceWrite = saveRecord.indexOf("try {");
  const queuedWrite = saveRecord.indexOf('queueProgressSave("guided_reading"');

  assert.ok(guardedDeviceWrite >= 0);
  assert.ok(queuedWrite > guardedDeviceWrite);
  assert.match(saveRecord, /catch \(error\)/);
});
