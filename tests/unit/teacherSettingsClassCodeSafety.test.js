import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const settings = readFileSync(
  new URL("../../src/components/teacher/TeacherSettingsPage.jsx", import.meta.url),
  "utf8"
);
const adminDialogs = readFileSync(
  new URL("../../src/components/teacher/TeacherAdminDialogs.jsx", import.meta.url),
  "utf8"
);
const controller = readFileSync(
  new URL("../../src/appState/useAppSessionController.js", import.meta.url),
  "utf8"
);

test("the option describing the current class-code expiry cannot be chosen", () => {
  // The old surface offered <option value="custom">Expiry is set</option>, which a
  // teacher could select — and selecting it removed the expiry.
  assert.doesNotMatch(settings, /<option value="custom">/);
  assert.match(settings, /<option disabled value="current">/);
});

test("the real class-code expiry date is shown to the teacher", () => {
  assert.match(settings, /function formatExpiryDate\(value\)/);
  assert.match(settings, /const selectedExpiryLabel = formatExpiryDate\(selectedExpiry\);/);
  assert.match(settings, /Stops working on \$\{selectedExpiryLabel\}/);
  assert.match(settings, /This code stops working on \$\{selectedExpiryLabel\}\./);
});

test("a saved Never override is authoritative even though its value is null", () => {
  assert.match(settings, /Object\.prototype\.hasOwnProperty\.call\(\s*expiryOverrides,\s*selectedClassId\s*\)/);
  assert.match(settings, /hasSelectedExpiryOverride\s*\?\s*expiryOverrides\[selectedClassId\]/);
  assert.doesNotMatch(settings, /expiryOverrides\[selectedClassId\]\s*\?\?/);
});

test("class-code timing follows the teacher copy standard", () => {
  assert.match(settings, /<span>Code expires<\/span>/);
  for (const label of ["Never", "After 1 day", "After 7 days", "After 30 days", "After 90 days"]) {
    assert.match(settings, new RegExp(`>${label}<`));
  }
  assert.doesNotMatch(settings, /No automatic expiry|>In (?:1|7|30|90) day/);
});

test("a non-numeric expiry choice can never be read as 'remove the expiry'", () => {
  const body = settings.slice(
    settings.indexOf("async function changeExpiry("),
    settings.indexOf("async function changeLeaderboardScope(")
  );
  assert.notEqual(body, "");

  const guardAt = body.indexOf("if (!Number.isFinite(dayCount) || dayCount < 0) return;");
  const expiresAt = body.indexOf("const expiresAt =");
  const saveAt = body.indexOf("saveClassCodeExpiry(");

  assert.ok(guardAt > -1, "changeExpiry must guard on a finite day count");
  assert.ok(guardAt < expiresAt, "the guard must run before expiresAt is derived");
  assert.ok(guardAt < saveAt, "the guard must run before the expiry is saved");
  assert.doesNotMatch(body, /Number\(days\) > 0/);
});

test("making a new class code is confirmed in the app, naming the consequence", () => {
  assert.doesNotMatch(settings, /window\.confirm|window\.alert|window\.prompt/);
  assert.doesNotMatch(adminDialogs, /window\.confirm|window\.alert|window\.prompt/);

  assert.match(settings, /import \{ ConfirmActionDialog \} from "\.\/TeacherAdminDialogs\.jsx";/);
  assert.match(settings, /<ConfirmActionDialog/);
  assert.match(settings, /title="Make a new class code\?"/);
  assert.match(settings, /stops working straight away/);
  assert.match(settings, /every student in the class needs the new code/);
  assert.match(settings, /confirmLabel="Make a new code"/);
  assert.match(settings, /onConfirm=\{regenerateCode\}/);
});

test("a failed class-code change remains visible inside the confirmation dialog", () => {
  assert.match(settings, /const \[newCodeError, setNewCodeError\] = useState\(""\);/);
  assert.match(settings, /if \(result\?\.ok\) \{[\s\S]*?setNewCodeConfirmOpen\(false\);/);
  assert.match(
    settings,
    /else \{[\s\S]*?setNewCodeError\(message\);[\s\S]*?setStatus\(message, "error"/,
  );
  assert.match(settings, /error=\{newCodeError\}/);
  assert.match(adminDialogs, /error && <p className="teacher-inline-error" role="alert">/);
});

test("a returned class code remains authoritative when the following class read fails", () => {
  assert.match(settings, /const \[codeOverrides, setCodeOverrides\] = useState\(\{\}\);/);
  assert.match(settings, /setCodeOverrides\(previous => \(\{[\s\S]*?\[mutationClassId\]: result\.accessCode/);
  assert.match(settings, /result\.refreshComplete === false[\s\S]*?couldn't refresh the class list/);
  assert.match(settings, /retry: result\.refreshComplete === false \? "classes" : ""/);
  assert.match(controller, /const refreshedClasses = await loadClasses\(\);/);
  assert.match(controller, /refreshComplete: Array\.isArray\(refreshedClasses\)/);
});

test("completed deletion removes stale student actions before trying the roster refresh", () => {
  assert.match(settings, /import \{ TEACHER_COPY \} from "\.\.\/\.\.\/copy\/teacherCopy\.js";/);
  const deletion = settings.slice(settings.indexOf("onDeleted={async learner => {"));
  assert.match(deletion, /setDeletedStudentIds\(previous =>/);
  assert.match(deletion, /setPrivacyStudent\(null\);\s*setPrivacyStudentId\(""\);/);
  assert.ok(
    deletion.indexOf("setPrivacyStudent(null)") < deletion.indexOf("await onReloadStudents?."),
    "the completed deletion must disable and close the stale learner before refresh"
  );
  assert.match(deletion, /refreshed === null[\s\S]*?couldn't refresh the student list/);
  assert.match(deletion, /retry: refreshed === null \? "students" : ""/);
  assert.match(settings, /TEACHER_COPY\.privacy\.deleteComplete\(learner\?\.name \|\| "The student"\)/);
});

test("settings clears privacy state before the selected class changes", () => {
  assert.match(settings, /studentsForSettingsClass\(\{\s*studentList,\s*archivedStudentList,\s*selectedClassId/);
  const classChange = settings.slice(
    settings.indexOf("function changeSelectedClass"),
    settings.indexOf("function askToRegenerateCode")
  );
  assert.match(classChange, /setPrivacyStudentId\(""\);\s*setPrivacyStudent\(null\);/);
  assert.match(
    classChange,
    /setAccessLogRead\(\{\s*classId: "",\s*status: "idle",\s*data: \[\],\s*error: ""\s*\}\);\s*setAccessLogOpen\(false\);/
  );
  assert.ok(
    classChange.indexOf('setPrivacyStudentId("")') < classChange.indexOf("onSelectClass?.("),
    "class-scoped state must clear before the parent selection changes"
  );
});

test("school information is read-only because changing it would move tenant data", () => {
  assert.match(settings, /<h3>Current school<\/h3>/);
  assert.match(settings, /Ask an administrator to correct this if it is wrong\./);
  assert.match(settings, /it cannot be changed here\./);
  assert.doesNotMatch(settings, /name="schoolName"/);
  assert.doesNotMatch(settings, /Save school information/);
  assert.doesNotMatch(settings, /function saveSchool/);
});

test("settings announces success as status, failures as alerts, and preserves its section on class change", () => {
  assert.doesNotMatch(settings, /className="teacher-settings-panel" aria-live/);
  assert.equal(settings.match(/aria-live="polite"/g)?.length, 1);
  assert.match(settings, /visibleStatus\.kind === "error"[\s\S]*?"teacher-settings-status teacher-inline-error"/);
  assert.match(settings, /role=\{visibleStatus\.kind === "error" \? "alert" : "status"\}/);
  assert.match(settings, /pushRouteHash\(teacherSettingsHash\(section, classId \|\| ""\)\)/);
  assert.match(settings, /We couldn&apos;t load recent sign-in activity\./);
  assert.match(settings, /setAccessSummaryReloadToken\(value => value \+ 1\)/);
});

test("Settings reads fail closed before exposing class or privacy mutations", () => {
  assert.match(settings, /getClassListReadView\(\{/);
  assert.match(settings, /getStudentRosterReadView\(\{/);
  assert.match(settings, /const classRowsReady = classRead\.complete && classRead\.rowsVerified;/);
  assert.match(settings, /const rosterRowsReady = rosterRead\.complete && rosterRead\.rowsBelongToClass;/);
  assert.match(settings, /disabled=\{!classRowsReady\}/);
  assert.match(settings, /classRead\.failed \|\| !classRowsReady/);
  assert.match(settings, /rosterRead\.incomplete \|\| !rosterRowsReady/);
  assert.match(settings, /onRetry=\{onRetryClasses\}/);
  assert.match(settings, /onRetry=\{\(\) => onReloadStudents\?\.\(selectedClassId\)\}/);
});

test("late class mutations keep their data and messages scoped to the class that started them", () => {
  assert.match(settings, /const mutationClassId = actionableClass\.id;/);
  assert.match(settings, /selectedClassIdRef\.current === mutationClassId/);
  assert.match(settings, /\[mutationClassId\]: result\.data\.access_code_expires_at \|\| null/);
  assert.match(settings, /\[mutationClassId\]: scope/);
  assert.match(settings, /!status\.classId \|\| status\.classId === selectedClassId/);
});
