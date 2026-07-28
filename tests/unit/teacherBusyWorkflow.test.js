import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getSelectedClassName } from "../../src/appState/studentSessionHelpers.js";
import { TEACHER_COPY } from "../../src/copy/teacherCopy.js";

const ROOT = new URL("../../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

test("Today keeps urgent work visible and only opens support while checking or actionable", async () => {
  const today = await source("src/components/TeacherTodayPage.jsx");

  const attentionAt = today.indexOf('id: "attention"');
  const dueAt = today.indexOf('id: "due"');
  assert.ok(attentionAt > -1 && dueAt > attentionAt);
  assert.match(today, /teacher-today-priority-grid/);
  assert.match(today, /<details className="teacher-today-more">/);
  // v2 Dashboard: the sound map is an always-visible card below the two urgent
  // lists (no Show/Hide latch), and its tiles open the class results view.
  assert.match(today, /<ClassHeatPanel rows=\{rows\} onOpenReports=\{onOpenProgress\} \/>/);
  assert.match(today, /setSupportFollowUpOpen\(true\);/);
  assert.match(today, /open=\{supportFollowUpOpen \|\| supportQueueState\.loading\}/);
  assert.match(today, /if \(!supportQueueState\.loading\) \{\s*setSupportFollowUpOpen/);
  assert.match(today, /headingRef=\{supportPlannerHeadingRef\}/);
});

test("Today labels its current evidence window and reports a rejected sample-class request", async () => {
  const [today, briefing] = await Promise.all([
    source("src/components/TeacherTodayPage.jsx"),
    source("src/utils/teacherTodayBriefing.js"),
  ]);

  assert.match(
    briefing,
    /conclusionWindowDays: LEARNING_EVIDENCE_POLICY\.recency\.conclusionWindowDays/,
  );
  assert.match(today, /Current results from the last \$\{policy\.conclusionWindowDays\} days\./);
  assert.doesNotMatch(today, /timeWindow="All saved answers for this class\."/);
  assert.match(today, /catch \{\s*setDemoError\("We couldn't create the sample class\./);
  assert.match(today, /kind="error"\s+message=\{demoError\}/);
});

test("Students defaults to a scannable roster and opens one layer at a time", async () => {
  const [students, controller] = await Promise.all([
    source("src/components/TeacherStudentsPage.jsx"),
    source("src/appState/useAppSessionController.js")
  ]);

  assert.match(
    students,
    /const DEFAULT_ROSTER_COLUMNS = \["focus", "login", "last-active"\];/
  );
  assert.match(
    students,
    /function openStudentActions\(student\) \{\s*setStudentActionError\(""\);\s*closeStudentPanelBefore/,
  );
  assert.match(students, /onClearStudent\?\.\(\);\s*action\(\);/);
  assert.match(students, /Student settings/);
  assert.match(students, /<details className="teacher-student-panel-more">/);
  assert.match(students, /const ROSTER_PAGE_SIZE = 10;/);
  assert.match(students, /className="teacher-roster-pagination"/);
  assert.match(students, /teacher-students-secondary teacher-students-overview/);
  for (const group of ["Student details", "Learning support", "Class and records"]) {
    assert.match(students, new RegExp(group));
  }
  assert.doesNotMatch(
    students.slice(
      students.indexOf('<div className="teacher-row-actions">'),
      students.indexOf("</tr>", students.indexOf('<div className="teacher-row-actions">'))
    ),
    />More</
  );
  assert.doesNotMatch(students, /Re-engage quiet readers|low attainment|highest current total/);
  assert.doesNotMatch(students, /No practice yet|<option value="not-started">Not started/);
  assert.match(students, /No scored answers yet/);
  assert.match(students, /Run first assessments/);
  assert.match(students, /<strong>Current focus:<\/strong>/);
  assert.match(students, /<th scope="col">Current focus<\/th>/);
  assert.match(students, /data-label="Current focus"/);
  assert.match(students, /label="Accuracy across skills"/);
  assert.match(students, /Choose three pictures in order\./);
  assert.match(students, /Choose picture \$\{editingSequence\.length \+ 1\} of 3\./);
  assert.match(students, /They save after you choose the third one\./);
  assert.doesNotMatch(students, /\bmastered skills?\b|\bskills? mastered\b|\bmastery\b/i);
  assert.match(students, /Reset sign-in pictures for \$\{operationStudent\.name\}\?/);
  assert.match(students, /Yes, reset \$\{operationStudent\.name\}'s sign-in pictures/);
  const addStudentMethod = students.slice(
    students.indexOf("async function handleCreateStudent"),
    students.indexOf("async function handleReducedChoiceMode")
  );
  assert.match(addStudentMethod, /const saved = await createStudent\?\.\(clean\);/);
  assert.match(addStudentMethod, /if \(saved === true\) \{\s*setNewStudentName\(""\);/);
  assert.doesNotMatch(
    addStudentMethod,
    /await createStudent\?\.\(clean\);\s*setNewStudentName\(""\);/
  );
  assert.match(students, /We couldn't add \$\{clean\}\. Nothing was changed\. Try again\./);
  const resetMethod = controller.slice(
    controller.indexOf("async function resetStudentSymbolPassword"),
    controller.indexOf("function resetCurrentStudentLocalProgress")
  );
  assert.doesNotMatch(resetMethod, /window\.confirm/);
  assert.doesNotMatch(controller, /A child named|those children are not on the cards/);
});

test("class creation and roster imports cannot fail silently or run twice", async () => {
  const [students, controller] = await Promise.all([
    source("src/components/TeacherStudentsPage.jsx"),
    source("src/appState/useAppSessionController.js"),
  ]);

  assert.match(students, /const \[creatingClass, setCreatingClass\] = useState\(false\);/);
  assert.match(students, /if \(creatingClass \|\| !newClassName\.trim\(\)\) return;/);
  assert.match(students, /const saved = await createClass\?\.\(\);[\s\S]*?if \(saved !== true\)/);
  assert.match(students, /disabled=\{creatingClass \|\| !newClassName\.trim\(\)\}/);
  assert.match(students, /\{creatingClass \? "Creating…" : "Create class"\}/);
  assert.match(controller, /async function createClass\(\)[\s\S]*?return true;/);
  assert.match(controller, /const clean = String\(newClassName \|\| ""\)\.trim\(\)\.replace\(\/\\s\+\/g, " "\);/);
  assert.match(controller, /if \(clean\.length > 120\)/);
  assert.match(controller, /catch \(error\) \{[\s\S]*?setMessage\("We couldn't create that class/);
  assert.match(students, /catch \(error\) \{\s*console\.error\("Could not read roster file\."/);
  assert.match(students, /catch \(error\) \{\s*console\.error\("Roster import error:"/);
  assert.match(students, /reviewRosterImportNames\(names, \{\s*activeRows: studentRows,\s*archivedRows: archivedRowsForSelectedClass/);
  assert.match(students, /Already exists|already exists/i);
  const createStudent = controller.slice(
    controller.indexOf("async function createStudentForSelectedClass"),
    controller.indexOf("return {", controller.indexOf("async function createStudentForSelectedClass"))
  );
  assert.match(createStudent, /const clean = normalizeRosterStudentName\(name\);/);
  assert.match(createStudent, /if \(clean\.length > 80\)/);
});

test("saved roster changes are never reclassified as failed when refresh fails", async () => {
  const [students, surface] = await Promise.all([
    source("src/components/TeacherStudentsPage.jsx"),
    source("src/components/AppSurface.jsx"),
  ]);

  const confirmMethod = students.slice(
    students.indexOf("async function confirmRosterOperation"),
    students.indexOf("async function handleRestoreStudent")
  );
  assert.match(confirmMethod, /The write is now authoritative/);
  assert.match(confirmMethod, /setStudentList\?\.\(previous => previous\.filter/);
  assert.match(confirmMethod, /setArchivedStudentList\?\.\(previous =>/);
  assert.match(confirmMethod, /setRosterOperationStatus\(successFeedback\);\s*closeRosterOperation\(\);/);
  assert.match(
    confirmMethod,
    /catch \(refreshError\) \{[\s\S]*?was saved but the screen could not refresh/
  );
  assert.match(confirmMethod, /The latest class list could not reload\./);
  assert.doesNotMatch(
    confirmMethod.slice(confirmMethod.indexOf("The write is now authoritative")),
    /reportRosterFailure\(refreshError/
  );

  const restoreMethod = students.slice(
    students.indexOf("async function handleRestoreStudent"),
    students.indexOf("if (loginCardRows.length > 0)")
  );
  assert.match(restoreMethod, /setArchivedStudentList\?\.\(previous => previous\.filter/);
  assert.match(restoreMethod, /Roster restore was saved but the screen could not refresh/);
  assert.doesNotMatch(
    restoreMethod.slice(restoreMethod.indexOf("setStudentList")),
    /reportRosterFailure\(refreshError/
  );
  assert.match(surface, /setArchivedStudentList=\{setArchivedStudentList\}/);
});

test("changing class clears every class-scoped roster control", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");
  const changeMethod = students.slice(
    students.indexOf("function handleClassChange"),
    students.indexOf("// A double-click on Add student")
  );

  for (const reset of [
    "setSelectedRosterIds([])",
    'setRosterSearch("")',
    'setRosterStatusFilter("all")',
    "setRosterFilterIds(null)",
    "setHeatOpenId(null)",
    "setRosterImportPreview(null)",
    "onClearStudent?.()"
  ]) {
    assert.match(changeMethod, new RegExp(reset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("every class change clears old dashboard rows before the new class can render", async () => {
  const [controller, surface] = await Promise.all([
    source("src/appState/useAppSessionController.js"),
    source("src/components/AppSurface.jsx")
  ]);
  const createClassMethod = controller.slice(
    controller.indexOf("async function createClass()"),
    controller.indexOf("async function createDemoClass()")
  );
  const createDemoMethod = controller.slice(
    controller.indexOf("async function createDemoClass()"),
    controller.indexOf("async function loadStudents")
  );
  const selectClassMethod = surface.slice(
    surface.indexOf("async function selectTeacherClass"),
    surface.indexOf("// ONE WAY TO OPEN A STUDENT REPORT")
  );

  for (const method of [createClassMethod, createDemoMethod, selectClassMethod]) {
    const clearAt = method.indexOf("setClassDashboard([])");
    const selectAt = method.indexOf("setSelectedClassId(");
    assert.ok(clearAt > -1, "the class change must clear the old class dashboard");
    assert.ok(selectAt > clearAt, "old dashboard rows must clear before the new class id is selected");
  }
  assert.match(createClassMethod, /loadClassDashboard\(createdClass\.id\)/);
  assert.match(surface, /onRetryEvidence=\{\(\) => loadSelectedClassStudent\(studentId, studentName\)\}/);
});

test("teacher launches require a learner from the complete selected-class roster", async () => {
  const surface = await source("src/components/AppSurface.jsx");
  const ownershipGuard = surface.slice(
    surface.indexOf("function selectedClassStudent"),
    surface.indexOf("function reportStaleStudentSelection")
  );

  assert.match(ownershipGuard, /getStudentRosterReadView/);
  assert.match(ownershipGuard, /!rosterRead\.complete \|\| !rosterRead\.rowsBelongToClass/);
  assert.match(ownershipGuard, /row\.id === requestedId/);
  assert.match(
    ownershipGuard,
    /String\(row\.class_id \|\| ""\) === String\(selectedClassId\)/
  );
  assert.match(surface, /async function startCheckForStudent\(student\) \{\s*const ownedStudent = selectedClassStudent\(student\)/);
  const rosterAssessmentShortcut = surface.slice(
    surface.indexOf("async function startCheckForStudent"),
    surface.indexOf("async function selectStudentIfNeeded")
  );
  assert.match(
    rosterAssessmentShortcut,
    /goToTeacherIntent\(APP_VIEWS\.ASSESSMENTS,\s*\{\s*classId: selectedClassId,\s*learnerId: ownedStudent\.id/
  );
  assert.doesNotMatch(
    rosterAssessmentShortcut,
    /startAssessment\(/,
    "a roster shortcut must not choose an assessment on the teacher's behalf"
  );
  assert.match(surface, /function runForSelectedClassStudent\(action\) \{\s*if \(!selectedClassStudent\(studentId\)\)/);
  assert.match(surface, /onStartBenchmark=\{\(assessmentId, options\) => runForSelectedClassStudent/);
  assert.doesNotMatch(surface, /onRetryEvidence=\{\(\) => loadStudentProgress\(/);
});

test("rejected class and learner reads settle into explicit retry states", async () => {
  const controller = await source("src/appState/useAppSessionController.js");
  const dashboardMethod = controller.slice(
    controller.indexOf("async function loadClassDashboard"),
    controller.indexOf("// PRACTICE-ASSIGN")
  );
  const progressMethod = controller.slice(
    controller.indexOf("async function loadStudentProgress"),
    controller.indexOf("// Returns true when the student was created")
  );

  for (const sourceName of [
    "Dashboard answers",
    "Dashboard mastery",
    "Dashboard Sound Seekers",
    "Dashboard profiles"
  ]) {
    assert.match(dashboardMethod, new RegExp(`settleTeacherRead\\(\\s*"${sourceName}"`));
  }
  assert.match(dashboardMethod, /failClassDashboardRead/);
  assert.match(dashboardMethod, /completeClassDashboardRead/);
  for (const sourceName of [
    "Student assessment archive",
    "Student answers",
    "Student item summaries",
    "Student skill summaries"
  ]) {
    assert.match(progressMethod, new RegExp(`settleTeacherRead\\(\\s*"${sourceName}"`));
  }
  assert.match(progressMethod, /setSelectedStudentEvidenceReady\(readSyncStatus === "complete"\)/);
});

test("restore is single-flight and move copy preserves historical class provenance", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");
  const restoreMethod = students.slice(
    students.indexOf("async function handleRestoreStudent"),
    students.indexOf("if (loginCardRows.length")
  );

  assert.match(restoreMethod, /if \(restoringStudentIds\.includes\(row\.id\)\) return;/);
  assert.match(restoreMethod, /kind: "pending",\s*message: `Restoring \$\{row\.name\}…`/);
  assert.match(restoreMethod, /finally \{\s*setRestoringStudentIds/);
  assert.match(students, /disabled=\{restoringStudentIds\.includes\(row\.id\)\}/);
  assert.match(students, /Earlier class reports and class activity stay with the class where they were/);
  assert.match(students, /Their current sign-in ends/);
  assert.doesNotMatch(students, /Their saved results moved too|saved results move together/);
});

test("sample setup and bulk sign-in cards expose rejected saves", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  assert.match(students, /const created = await createDemoClass\?\.\(\);[\s\S]*?created !== true/);
  assert.match(students, /Could not create sample class from the roster/);
  assert.match(students, /if \(!result \|\| result\.saved === 0\) \{[\s\S]*?No cards were opened/);
  assert.match(students, /catch \(error\) \{\s*console\.error\("Could not make class sign-in pictures\."/);
  assert.match(students, /failedAssignments=\{loginCardFailures\}/);
  assert.match(students, /className="teacher-login-card-partial" role="alert"/);
  assert.match(students, /Try saving missing pictures again/);
  assert.match(students, /async function retryFailedSignInPictures\(\)/);
  assert.match(students, /Nothing incorrect was added to the printable cards/);
});

test("the first-student setup action waits for a truthful roster read, not for a non-empty roster", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");
  const setupEffect = students.slice(
    students.indexOf("// Arriving from Today's checklist"),
    students.indexOf("async function handleCreateDemo")
  );

  assert.match(
    setupEffect,
    /setupFocus !== "class" && selectedClassId && !rosterRead\.complete/
  );
  assert.doesNotMatch(setupEffect, /studentRows\.length === 0/);
  assert.match(setupEffect, /handleSetupContinue\(setupFocus\)/);
});

test("quiet-student suggestions use the seven-day policy instead of a formatted label", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  assert.match(students, /activityIsAtLeastDaysOld\(\s*row\.lastActive,\s*TEACHER_TODAY_POLICY\.inactivityDueDays/);
  assert.doesNotMatch(students, /formatLastActive\(row\.lastActive\)\.includes\("days ago"\)/);
});

test("failed sign-in-picture saves keep the editor open and preserve the chosen pictures", async () => {
  const [students, controller] = await Promise.all([
    source("src/components/TeacherStudentsPage.jsx"),
    source("src/appState/useAppSessionController.js")
  ]);

  const controllerMethod = controller.slice(
    controller.indexOf("async function updateStudentSymbolPassword"),
    controller.indexOf("// Bulk sign-in setup")
  );
  assert.match(controllerMethod, /if \(!teacherId[^]*return false;/);
  assert.match(controllerMethod, /if \(error \|\| data\?\.ok !== true\)[^]*return false;/);
  assert.match(controllerMethod, /Sign-in pictures updated[^]*return true;/);
  const bulkMethod = controller.slice(
    controller.indexOf("async function assignMissingSymbolPasswords"),
    controller.indexOf("async function updateStudentName")
  );
  assert.match(bulkMethod, /if \(error \|\| data\?\.ok !== true\)/);

  const editorMethod = students.slice(
    students.indexOf("async function saveSignInPictures"),
    students.indexOf("function closeStudentPanelBefore")
  );
  const failureAt = editorMethod.indexOf("if (saved !== true)");
  const closeAt = editorMethod.indexOf("setEditingStudent(null)");
  assert.ok(failureAt > -1 && closeAt > failureAt);
  assert.match(
    editorMethod,
    /if \(saved !== true\) \{[^]*setSignInPictureError\([^]*Nothing changed[^]*return;[^]*\}/
  );
  assert.match(editorMethod, /catch \{[^]*setSignInPictureError/);
  assert.match(students, /disabled=\{savingSignInPictures\}/);
  assert.match(students, /teacher-inline-error" role="alert"/);
  assert.doesNotMatch(
    students,
    /await updateStudentSymbolPassword\?\.\([^;]+;\s*setEditingStudent\(null\)/
  );
});

test("roster accuracy labels and class averages use current-window counts, not lifetime totals", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  assert.match(
    students,
    /answered: row\.currentAnswered,\s*correct: row\.currentCorrect,\s*accuracy: row\.currentAccuracy,/
  );
  assert.match(
    students,
    /completeEvidenceRows\.map\(row => row\.currentLastActive\)/
  );
  assert.match(
    students,
    /denominator: `\$\{countPhrase\(selectedStudentRow\.currentAnswered/
  );
  assert.match(students, /label="Accuracy across skills"/);
  assert.doesNotMatch(
    students,
    /dateRange="All saved scored answers for this class\."/
  );
});

test("accessibility settings show save progress and failure inside the modal", async () => {
  const dialog = await source("src/components/teacher/TeacherClassParts.jsx");

  assert.match(dialog, /const \[saveError, setSaveError\] = useState\(""\);/);
  assert.match(dialog, /const result = await runAccessibilitySave/);
  assert.match(dialog, /if \(result\.ok\) \{\s*onClose\?\.\(\);/);
  assert.match(dialog, /saveButtonRef\.current\?\.focus\(\);/);
  assert.match(dialog, /role="status">Saving accessibility settings/);
  assert.match(dialog, /teacher-inline-error" role="alert"/);
  assert.doesNotMatch(dialog, /if \(saved !== false\) onClose/);
});

test("Sound Seekers practice assignment and clear actions report strict save outcomes", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");
  const panel = students.slice(
    students.indexOf("function QuestHeatPanel"),
    students.indexOf("// STUDENTS.")
  );

  assert.match(panel, /const \[assignmentFeedback, setAssignmentFeedback\] = useState\(null\);/);
  assert.match(panel, /const saved = await onAssign\?\.\(selected\);/);
  assert.match(panel, /if \(saved !== true\)/);
  assert.match(panel, /const cleared = await onClear\?\.\(\);/);
  assert.match(panel, /if \(cleared !== true\)/);
  assert.match(panel, /finally \{\s*setBusy\(false\);\s*\}/);
  assert.match(panel, /We couldn't save this practice assignment\. Nothing changed/);
  assert.match(panel, /We couldn't clear this practice assignment\. The saved assignment is unchanged/);
  assert.match(panel, /<ActionFeedback className="quest-heat-feedback"/);
});

test("a failed reduced-choice save stays in the student dialog with an inline error", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  assert.match(students, /const \[studentActionError, setStudentActionError\] = useState\(""\);/);
  assert.match(
    students,
    /return await setReducedChoiceMode\(row\.id, !row\.reducedChoiceMode\) === true;/
  );
  assert.match(
    students,
    /const saved = await handleReducedChoiceMode\(student\);[^]*if \(saved\) \{[^]*setActionsStudent\(null\);[^]*return;[^]*\}[^]*setStudentActionError/
  );
  assert.match(
    students,
    /We couldn't change this student's navigation choices\. Nothing changed\. Try again\./
  );
  assert.match(students, /teacher-inline-error" role="alert">\{studentActionError\}/);
});

test("both permanent-delete paths state the minimal record that is actually retained", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");
  const successCopy = TEACHER_COPY.privacy.deleteComplete("Aaron");

  assert.equal(
    successCopy,
    "Aaron's data and saved results were deleted permanently. "
      + "The school keeps only the date, outcome and reason for the deletion request."
  );
  assert.doesNotMatch(successCopy, /nothing .* kept/i);
  assert.equal(
    students.match(/TEACHER_COPY\.privacy\.deleteComplete/g)?.length,
    2,
    "the everyday roster path and the privacy-request path must share one retention truth"
  );
  assert.doesNotMatch(students, /Nothing of theirs is kept/);
});

test("destructive report actions cannot inherit the primary download colour", async () => {
  const css = await source("src/App.css");
  const dangerBlock = css.slice(
    css.indexOf(".report-button.danger"),
    css.indexOf(".media-qa-review-card")
  );

  assert.match(dangerBlock, /border-color:[^;]+!important/);
  assert.match(dangerBlock, /background: var\(--color-danger-soft\) !important/);
  assert.match(dangerBlock, /color: var\(--color-danger\) !important/);
});

test("permanent deletion never treats an incomplete roster summary as proof that nothing is saved", async () => {
  const students = await source("src/components/TeacherStudentsPage.jsx");

  assert.doesNotMatch(students, /has no saved results, so there is nothing to keep/i);
  assert.match(
    students,
    /Saved-result totals are still loading or unavailable\./
  );
  assert.match(
    students,
    /The roster currently shows \{operationSavedSummary\}\./
  );
  assert.match(
    students,
    /student record and any saved\s+results, reports, assessment\s+records, progress, activity and sign-in pictures/,
  );
  assert.match(
    students,
    /const deleteConfirmReady = Boolean\(operationStudent\)\s+&& normalizeRosterStudentName/,
  );
  assert.match(students, /<span>Type \{operationStudent\.name\} to confirm<\/span>/);
});

test("support-plan reads and saves recover when the cloud request rejects", async () => {
  const supportPlans = await source("src/components/teacher/InterventionLoop.jsx");

  assert.match(
    supportPlans,
    /catch \(error\) \{\s*if \(!active\) return;\s*console\.error\("Load interventions error:"/,
  );
  assert.match(
    supportPlans,
    /finally \{\s*if \(active\) \{\s*setLoading\(false\);\s*setHistoryLoading\(false\);/
  );
  assert.match(
    supportPlans,
    /catch \(error\) \{\s*console\.error\("Save intervention plan error:"[\s\S]*?return false;\s*\} finally \{\s*setBusyId\(""\);/,
  );
  assert.match(
    supportPlans,
    /catch \(error\) \{\s*console\.error\("Update intervention error:"[\s\S]*?return false;\s*\} finally \{\s*setBusyId\(""\);/,
  );
});

test("support plans cannot keep an empty or previous-class draft", async () => {
  const [today, support] = await Promise.all([
    source("src/components/TeacherTodayPage.jsx"),
    source("src/components/teacher/InterventionLoop.jsx")
  ]);

  // v2 Dashboard: the page no longer owns a class picker (the shared context
  // bar does, and its Change link navigates away, unmounting this page), so a
  // support draft cannot survive into another class's view — the support
  // panel remounts keyed by the selected class.
  assert.doesNotMatch(today, /handleClassChange|<select/);
  assert.match(today, /key=\{`\$\{teacherId \|\| "teacher"\}:\$\{selectedClass\.id\}`\}/);
  assert.match(support, /availableStudentIds\.has\(String\(id\)\)/);
  assert.match(support, /draft\.studentIds\.length === 0/);
  assert.match(support, /Choose at least one student before saving this support plan/);
  assert.match(support, /validStudentIds\.length !== draft\.studentIds\.length/);
});

test("draft support can be deleted and taught support keeps a reasoned cancellation history", async () => {
  const support = await source("src/components/teacher/InterventionLoop.jsx");

  assert.match(support, /teacher_delete_planned_intervention/);
  assert.match(support, /teacher_cancel_intervention/);
  assert.match(support, /cancelledInterventions/);
  assert.match(support, /Cancelled plans are removed from active work and Today/);
  assert.match(support, /Why it was cancelled/);
  assert.match(support, /Edit or reschedule/);
  assert.match(support, /Delete draft/);
  assert.match(support, /Cancel taught support/);
});

test("student reports put the four everyday views first and collapse technical context", async () => {
  const [shell, reportView] = await Promise.all([
    source("src/components/reports/StudentReportShell.jsx"),
    source("src/components/reports/SimpleStudentReportViews.jsx")
  ]);

  for (const id of ["whole-child", "skills-check", "hfw", "el-assessments"]) {
    assert.match(shell, new RegExp(`"${id}"`));
  }
  assert.match(shell, /<details[\s\S]*className="lg-report-nav-more"/);
  assert.match(shell, /className="lg-report-provenance"/);
  assert.match(reportView, /Answer accuracy:/);
  assert.match(reportView, /Learning status:/);
  assert.match(reportView, /Not enough results/);
});

test("resources are class-aware whole-class tools without a second student picker", async () => {
  const [intentPage, appSurface, worksheet, present, viewHelpers] = await Promise.all([
    source("src/components/teacher/TeacherIntentPage.jsx"),
    source("src/components/AppSurface.jsx"),
    source("src/components/WorksheetGeneratorPage.jsx"),
    source("src/components/PresentPage.jsx"),
    source("src/appState/appViewHelpers.js")
  ]);

  assert.doesNotMatch(intentPage, /selectedStudentId|selectedStudentName|onSelectStudent/);
  // v2 Resources: the shelf carries three whole-class tools and the page copy
  // lives in teacherCopy rather than as literals in the page.
  assert.match(TEACHER_COPY.intents.resources.toolsLabel, /Whole-class tools/);
  assert.match(
    TEACHER_COPY.intents.resources.description("Cycle 6 · Digraphs and blends"),
    /Whole-class tools, already set to Cycle 6 · Digraphs and blends\./
  );
  for (const tool of ["present", "worksheets", "guidedReading"]) {
    const card = TEACHER_COPY.intents.resources.tools[tool];
    assert.ok(card.kind && card.title && card.body, `${tool} needs a kicker, title and body`);
    assert.equal(card.bullets.length, 3, `${tool} shows three bullets`);
  }
  // The class picker and the "current context" chip moved to the shared
  // context bar; the page must not grow a second one.
  assert.doesNotMatch(intentPage, /teacher-dashboard-context|onSelectClass/);
  // The teaching cycle is read from the context bar's state, never re-derived.
  assert.match(intentPage, /cycleId = ""/);
  assert.match(appSurface, /<TeacherIntentPage[\s\S]*?cycleId=\{teacherCycleId\}/);
  assert.match(appSurface, /<WorksheetGeneratorPage[\s\S]*?onBack=\{\(\) => goToTeacherIntent\(APP_VIEWS\.TEACHER_RESOURCES\)\}/);
  assert.match(appSurface, /<PresentPage[\s\S]*?onBack=\{\(\) => goToTeacherIntent\(APP_VIEWS\.TEACHER_RESOURCES\)\}/);
  assert.match(worksheet, /Class: \{className\}/);
  assert.match(worksheet, /Open print preview/);
  assert.match(worksheet, /Back to Resources/);
  // The redesigned picker folds the class name into the headline sentence
  // ("<class> is on Cycle N") instead of a detached "Class:" chip.
  assert.match(present, /\$\{className\} is on/);
  assert.match(present, /Projector and keyboard help/);
  assert.match(present, /Back to Resources/);
  assert.match(viewHelpers, /"resources\/worksheets"/);
  assert.match(viewHelpers, /"resources\/present"/);
});

// Hardcoded book titles outlive the books. A title typed into the page keeps
// showing after a book is withdrawn or re-levelled, and the tile then opens a
// reader that has nothing to open.
test("the Level C shelf is read from the book catalogue, never typed into the page", async () => {
  const [intentPage, shelfSource] = await Promise.all([
    source("src/components/teacher/TeacherIntentPage.jsx"),
    source("src/components/teacher/teacherResourceShelf.js")
  ]);
  const { firstFactsLevelCBooks } = await import("../../src/data/firstFactsLevelCBooks.js");
  const { loadLevelCShelf, selectLevelCShelf } = await import(
    "../../src/components/teacher/teacherResourceShelf.js"
  );

  assert.match(shelfSource, /import\("\.\.\/\.\.\/data\/firstFactsLevelCBooks\.js"\)/);
  const catalogueTitles = firstFactsLevelCBooks.map(book => book.title);
  for (const title of catalogueTitles) {
    assert.doesNotMatch(intentPage, new RegExp(`"${title}"`), `${title} must not be typed into the page`);
  }

  const rows = await loadLevelCShelf();
  assert.equal(rows.length, 4);
  rows.forEach(row => {
    assert.ok(catalogueTitles.includes(row.title), `${row.title} comes from the catalogue`);
    assert.equal(row.meta, "First Facts · nonfiction · Level C");
  });

  // Withdrawn, unapproved and teacher-preview books never reach a teacher.
  const filtered = selectLevelCShelf([
    { id: "a", title: "Withdrawn", seriesTitle: "First Facts", type: "nonfiction", level: "C", status: "approved", active: false },
    { id: "b", title: "Draft", seriesTitle: "First Facts", type: "nonfiction", level: "C", status: "draft" },
    { id: "c", title: "Preview", seriesTitle: "First Facts", type: "nonfiction", level: "C", status: "approved", teacherPreviewOnly: true },
    { id: "d", title: "Wrong level", seriesTitle: "First Facts", type: "nonfiction", level: "A", status: "approved" },
    { id: "e", title: "Kept", seriesTitle: "First Facts", type: "nonfiction", level: "C", status: "approved", order: 2 }
  ]);
  assert.deepEqual(filtered.map(row => row.title), ["Kept"]);
  // An unreadable catalogue must not resolve to an empty shelf.
  assert.deepEqual(selectLevelCShelf(null), []);
  assert.match(intentPage, /status: "failed"/);
  assert.match(intentPage, /shelfFailed/);
});

test("settings separates school, sign-in, privacy and account tasks", async () => {
  const settings = await source("src/components/teacher/TeacherSettingsPage.jsx");

  for (const label of [
    "School information",
    "Class sign-in",
    "Student privacy",
    "Teacher account"
  ]) {
    assert.match(settings, new RegExp(label));
  }
  assert.match(settings, /friendlyAccessEventLabel/);
  assert.match(settings, /friendlyDeviceLabel/);
  assert.match(settings, /disabled=\{!classRowsReady\}/);
  assert.match(settings, /disabled=\{!rosterRowsReady \|\| allStudents\.length === 0\}/);
  assert.match(settings, /No missing student is being treated as absent/);
  assert.match(settings, /Ask an administrator to correct this if it is wrong/);
  assert.doesNotMatch(settings, /Save school information/);
  assert.match(settings, /We couldn't change the class-code expiry/);
});

test("school and practice-reset requests always leave busy state and expose failure", async () => {
  const [controller, dialogs] = await Promise.all([
    source("src/appState/useAppSessionController.js"),
    source("src/components/teacher/TeacherAdminDialogs.jsx"),
  ]);
  const schoolSave = controller.slice(
    controller.indexOf("async function saveTeacherSchool"),
    controller.indexOf("async function requestPasswordReset"),
  );
  const practiceReset = controller.slice(
    controller.indexOf("async function resetSelectedStudentProgress"),
    controller.indexOf("async function loadStudentProgress"),
  );

  assert.match(schoolSave, /catch \(error\)[\s\S]*?return false;/);
  assert.match(schoolSave, /finally \{\s*setAuthLoading\(false\);/);
  assert.match(practiceReset, /catch \(requestError\)[\s\S]*?setResettingProgress\(false\);/);
  assert.match(practiceReset, /return false;/);
  assert.match(practiceReset, /return true;/);
  assert.match(dialogs, /const \[resetError, setResetError\] = useState\(""\);/);
  assert.match(dialogs, /const saved = await onReset\?\.\(\);[\s\S]*?saved !== true/);
  assert.match(dialogs, /resetError && <p className="teacher-inline-error" role="alert">/);
  assert.equal(
    dialogs.match(/onClose=\{busy \? undefined :/g)?.length,
    2,
    "neither destructive dialog may close through Escape or the backdrop while its write is running",
  );
});

test("teacher context never presents a missing class as though one were selected", () => {
  assert.equal(getSelectedClassName([], null), "No class selected");
  assert.equal(
    getSelectedClassName([{ id: "class-a", name: "Willow Class" }], "class-a"),
    "Willow Class"
  );
});

test("primary teacher navigation clears feedback from the previous section", async () => {
  const surface = await source("src/components/AppSurface.jsx");
  const navigation = surface.match(
    /const goToTeacherIntent = \(nextView, routeContext = \{\}\) => \{([\s\S]*?)\n\s{2}\};/
  )?.[1] || "";

  assert.match(navigation, /setMessage\(""\)/);
  assert.match(navigation, /pushRouteHash\(nextHash\)/);
  assert.ok(
    navigation.indexOf('setMessage("")') < navigation.indexOf("pushRouteHash(nextHash)"),
    "old feedback should be cleared before the destination route is opened"
  );
  assert.doesNotMatch(
    navigation,
    /setTimeout|useEffect/,
    "navigation must not clear a later destination error"
  );
});

test("Today uses ordinary support language instead of intervention workflow jargon", async () => {
  const [today, supportPlans] = await Promise.all([
    source("src/components/TeacherTodayPage.jsx"),
    source("src/components/teacher/InterventionLoop.jsx")
  ]);
  assert.match(today, /Support follow-up/);
  assert.match(supportPlans, /Support plans/);
  assert.match(supportPlans, /Plan support/);
  assert.match(supportPlans, /No active support planned for this class/);
  assert.match(supportPlans, /Plan · teach · note · review/);
  assert.match(supportPlans, /Mark as taught/);
  assert.match(supportPlans, /Helped a little/);
  assert.match(supportPlans, /Did not help yet/);
  assert.doesNotMatch(supportPlans, /aria-label="Intervention lifecycle"/);
  assert.doesNotMatch(supportPlans, />Interventions</);
  assert.doesNotMatch(supportPlans, />Plan intervention</);
  assert.doesNotMatch(supportPlans, />Mark delivered<|>Observed outcome<|>Record outcome</);
});

test("teacher practice-pack failures never expose raw technical errors", async () => {
  const [today, students] = await Promise.all([
    source("src/components/TeacherTodayPage.jsx"),
    source("src/components/TeacherStudentsPage.jsx")
  ]);

  assert.doesNotMatch(today, /setNote\(error\.message/);
  assert.doesNotMatch(students, /setPackNote\(error\.message/);
  assert.match(today, /We couldn't build this group pack\. Nothing was printed\. Try again\./);
  assert.match(students, /We couldn't build this practice pack\. Nothing was printed\. Try again\./);
});

test("every teacher assessment start fails closed on incomplete saved results", async () => {
  const [app, surface, assessments] = await Promise.all([
    source("src/App.jsx"),
    source("src/components/AppSurface.jsx"),
    source("src/components/TeacherAssessmentsPage.jsx")
  ]);

  assert.match(app, /function ensureTeacherAssessmentEvidenceReady/);
  assert.match(app, /selectedStudentEvidenceReadState\?\.syncStatus === "complete"/);
  assert.match(app, /async function startAssessment[\s\S]*ensureTeacherAssessmentEvidenceReady/);
  assert.match(app, /async function startElBenchmarkAssessment[\s\S]*ensureTeacherAssessmentEvidenceReady/);
  assert.match(app, /function startAdvancedPhonicsAssessment[\s\S]*ensureTeacherAssessmentEvidenceReady/);
  assert.match(app, /function startLetterAssessment[\s\S]*ensureTeacherAssessmentEvidenceReady/);
  assert.match(surface, /context\?\.syncStatus !== "complete"/);
  assert.match(
    surface,
    /goToTeacherIntent\(APP_VIEWS\.ASSESSMENTS,\s*\{\s*classId: selectedClassId,\s*learnerId: ownedStudent\.id/
  );
  assert.match(assessments, /studentEvidenceAvailable/);
  assert.match(assessments, /Nothing is being counted as zero/);
  assert.match(assessments, /disabled=\{!studentEvidenceAvailable \|\| !startPointReady/);
});

test("clearing an unfinished EL assessment is confirmed and fails closed", async () => {
  const [app, assessments] = await Promise.all([
    source("src/App.jsx"),
    source("src/components/TeacherAssessmentsPage.jsx"),
  ]);
  const discard = app.slice(
    app.indexOf("function discardElBenchmarkDraft"),
    app.indexOf("async function archiveElBenchmarkSession"),
  );

  assert.match(discard, /const deleted = deleteElBenchmarkDraft/);
  assert.match(discard, /if \(!deleted\)[\s\S]*?return false;/);
  assert.match(discard, /setElBenchmarkSession\(null\);[\s\S]*?return true;/);
  assert.match(assessments, /Clear saved draft…/);
  assert.match(assessments, /title="Clear this unfinished assessment\?"/);
  assert.match(assessments, /Completed assessments and reports are not changed/);
  assert.match(assessments, /const discarded = await onDiscardDraft\?\.\(\);/);
  assert.match(assessments, /if \(discarded === true\)[\s\S]*?setDiscardDraftConfirmOpen\(false\);/);
  assert.match(assessments, /error=\{discardDraftError\}/);
});

test("the assessment and report funnels expose a main page landmark", async () => {
  const [assessments, reports] = await Promise.all([
    source("src/components/TeacherAssessmentsPage.jsx"),
    source("src/components/TeacherReportsHubPage.jsx")
  ]);
  assert.match(assessments, /<main className="teacher-product-page teacher-funnel-page"/);
  assert.match(reports, /const PageElement = showing && !wholeClass \? "div" : "main";/);
  assert.match(
    reports,
    /className=\{`teacher-product-page teacher-funnel-page\$\{showing \? " report-open" : ""\}`\}/
  );
});

test("an embedded student report returns to the report chooser", async () => {
  const [surface, reports] = await Promise.all([
    source("src/components/AppSurface.jsx"),
    source("src/components/TeacherReportsHubPage.jsx")
  ]);

  assert.match(
    reports,
    /renderStudentReport\?\.\(reportView,\s*\(\) => \{[\s\S]*setShowing\(false\)/
  );
  assert.match(
    surface,
    /renderStudentReport=\{\(reportView,\s*onBack\)[\s\S]*onBack/
  );
  assert.match(
    surface,
    /returnToTeacherDashboard=\{options\.onBack \|\| \(teacherId \? returnToTeacherDashboard : null\)\}/
  );
});

test("the printable class report uses the selected period and full status labels", async () => {
  const reports = await source("src/components/AdminDashboardPage.jsx");

  assert.match(reports, /A quick view of saved results for the selected period/);
  assert.match(reports, /\["Answer accuracy", reportPercentage/);
  assert.match(reports, /\? "Not enough results"/);
  assert.doesNotMatch(reports, /\["Recent answer accuracy"/);
  assert.doesNotMatch(reports, /\? "Not enough"\s*:/);
});

test("teacher-run letter and pattern assessments keep their name and directions visible", async () => {
  const [pages, assessmentCss, appCss] = await Promise.all([
    source("src/components/AppPages.jsx"),
    source("src/styles/assessment.css"),
    source("src/App.css")
  ]);

  assert.match(pages, /<h1>Letter name and sound assessment<\/h1>/);
  assert.match(pages, /<h2>Show this letter to the student<\/h2>/);
  assert.match(pages, /Ask for the letter name and the sound it makes\./);
  assert.match(pages, /<h1>Phonics pattern assessment<\/h1>/);
  assert.match(pages, /<h2>Show the pattern and example word<\/h2>/);
  assert.match(pages, /ask the student to read the word/);
  assert.match(assessmentCss, /\.assessment-meta h1/);
  assert.match(appCss, /\.letter-topbar \.assessment-meta h1[\s\S]*white-space: normal/);
});

test("account setup failure uses teacher language and a clear recovery step", async () => {
  const appSurface = await source("src/components/AppSurface.jsx");

  assert.match(appSurface, /Account setup needs attention/);
  assert.match(
    appSurface,
    /We couldn't finish setting up this account\. Nothing has been lost\. Sign out and try again/
  );
  assert.match(appSurface, />\s*Sign out\s*</);
  assert.doesNotMatch(appSurface, /Signup Approval Setup Needed|benjamesbowler@gmail\.com|>\s*Log Out\s*</);
});

test("admin deletion stays open and truthful when the verified operation fails", async () => {
  const [controller, surface] = await Promise.all([
    source("src/appState/useAppSessionController.js"),
    source("src/components/AppSurface.jsx")
  ]);

  assert.match(
    controller,
    /async function executeAdminDeleteStudent[\s\S]*?return false;[\s\S]*?return true;/
  );
  assert.match(
    controller,
    /async function executeAdminDeleteClass[\s\S]*?return false;[\s\S]*?return true;/
  );
  assert.match(
    surface,
    /if \(deleted === true\) \{[\s\S]*?setAdminConfirm\(null\);[\s\S]*?\} else \{[\s\S]*?setAdminConfirmError/
  );
  assert.doesNotMatch(
    surface,
    /finally \{\s*setAdminConfirmBusy\(false\);\s*setAdminConfirm\(null\);/
  );
  assert.match(surface, /The class must be empty first/);
  assert.match(surface, /A minimal record of the deletion request is kept/);
});

test("a saved student setting is not reported as unsaved when only its refresh fails", async () => {
  const controller = await source("src/appState/useAppSessionController.js");
  for (const marker of [
    "Refresh after practice assignment failed",
    "Refresh after reduced-choice save failed",
    "Refresh after accessibility save failed",
    "Refresh after sign-in picture save failed",
    "Refresh after bulk sign-in picture save failed",
    "Refresh after student information save failed",
    "Refresh after sign-in picture reset failed"
  ]) {
    assert.match(controller, new RegExp(marker));
  }
  assert.match(
    controller,
    /Refresh after student information save failed:[\s\S]*?information was saved\. Reload the page/
  );
});

test("saving-and-syncing failures avoid false reassurance and can be retried", async () => {
  const [panel, copy] = await Promise.all([
    source("src/components/teacher/TeacherActivitySyncHealth.jsx"),
    source("src/copy/teacherCopy.js")
  ]);
  assert.match(panel, />\s*Try again\s*</);
  assert.match(panel, /setReload\(value => value \+ 1\)/);
  assert.match(copy, /couldn't confirm whether recent results reached this dashboard/);
  assert.doesNotMatch(copy, /Nothing is lost: results are safe/);
});

test("the ordinary class-report route pauses print and EL exports on incomplete reads", async () => {
  const [pages, surface, elPanel] = await Promise.all([
    source("src/components/AppPages.jsx"),
    source("src/components/AppSurface.jsx"),
    source("src/components/reports/ElFormalAssessmentsPanel.jsx")
  ]);

  assert.match(surface, /assessmentHistoryReadState=\{assessmentHistoryReadState\}/);
  assert.match(surface, /studentListReadState=\{studentListReadState\}/);
  assert.match(pages, /const reportSourcesReady = historyReady && answersReady && rosterRead\.complete;/);
  assert.match(pages, /disabled=\{!reportSourcesReady\}/);
  assert.match(pages, /Try loading the class report again/);
  assert.match(elPanel, /if \(!evidenceReady\)[\s\S]*?return;/);
  assert.match(elPanel, /disabled=\{!evidenceReady \|\| !activeScope\}/);
  assert.match(
    elPanel,
    /disabled=\{!evidenceReady \|\| !activeScope \|\| busyAction === "export"\}/
  );
});

test("manual letter and phonics checks save once, recover visibly, and preserve partial work", async () => {
  const [app, pages, surface, sessionController] = await Promise.all([
    source("src/App.jsx"),
    source("src/components/AppPages.jsx"),
    source("src/components/AppSurface.jsx"),
    source("src/appState/useAppSessionController.js")
  ]);

  assert.match(app, /const letterAssessmentAttemptRef = useRef\(null\)/);
  assert.match(app, /const patternAssessmentAttemptRef = useRef\(null\)/);
  assert.match(app, /attemptId: attemptSession\.attemptId/);
  assert.match(app, /manualAssessmentEntryOwnership\(attemptSession\)/);
  assert.match(app, /const patternAssessmentSaveInFlightRef = useRef\(null\)/);
  assert.match(app, /const letterAssessmentSaveInFlightRef = useRef\(null\)/);
  assert.match(app, /return runSingleFlight\(saveRef, operation\)/);
  assert.match(app, /replaceManualAssessmentEntry\(\s*patternAssessment/);
  assert.match(app, /replaceManualAssessmentEntry\(\s*letterAssessment/);
  assert.match(
    app,
    /if \(isFinalItem\) \{[\s\S]*?archivePatternAssessment\(nextAssessment\)[\s\S]*?setPatternAssessment\(nextAssessment\)/
  );
  assert.match(
    app,
    /if \(isFinalItem\) \{[\s\S]*?archiveLetterAssessment\(nextAssessment\)[\s\S]*?setLetterAssessment\(nextAssessment\)/
  );
  assert.match(app, /archivePatternAssessment\(nextAssessment, \{ allowPartial: true \}\)/);
  assert.match(app, /archiveLetterAssessment\(nextAssessment, \{ allowPartial: true \}\)/);
  assert.match(app, /plannedQuestionCount: patternItems\.length \* 2/);
  assert.match(app, /plannedQuestionCount: letterItems\.length \* 2/);
  assert.match(
    app,
    /const administrationStatus = manualAssessmentAdministrationStatus\(\s*nextAssessment\.length,\s*patternItems\.length/
  );
  assert.match(
    app,
    /const administrationStatus = manualAssessmentAdministrationStatus\(\s*nextAssessment\.length,\s*letterItems\.length/
  );
  assert.match(app, /attempts < 2\s*\? "not_enough_evidence"/);
  assert.doesNotMatch(
    app.slice(app.indexOf("async function recordPatternResult"), app.indexOf("function resetPatternAssessment")),
    /updateItemMastery|persistPatternItemResult/
  );
  assert.doesNotMatch(
    app.slice(app.indexOf("async function recordLetterResult"), app.indexOf("function resetLetterAssessment")),
    /updateItemMastery|persistLetterItemResult/
  );
  assert.match(surface, /endAssessment=\{saveLetterAssessmentPartialAndExit\}/);
  assert.match(surface, /endAssessment=\{savePatternAssessmentPartialAndExit\}/);
  assert.match(surface, /letterAssessmentDraft=\{/);
  assert.match(surface, /phonicsPatternAssessmentDraft=\{/);
  assert.match(sessionController, /saveManualAssessmentDrafts\(\{\s*teacherId,\s*studentId,/);
  assert.match(sessionController, /const selectedManualDrafts = loadManualAssessmentDrafts\(/);
  assert.match(sessionController, /restoreManualAssessmentDraftsFromHistory\(/);
  assert.match(sessionController, /chooseNewestManualAssessmentEntries\(/);
  assert.match(pages, /Save & exit/);
  assert.match(pages, /Finish and save/);
  assert.match(pages, /Your choices are still here\. Try again\./);
  assert.match(pages, /role="alert"/);
  assert.match(pages, /finally \{\s*setSaving\(false\);\s*\}/);
});

// The letter and phonics-pattern sittings are 52 and 33 items long. A dropdown
// per field turned every item into two taps and a menu, which is why they were
// reverted to green yes / red no buttons. The three recorded values are
// unchanged, so the guard is on the interaction, not on the data.
test("manual letter and pattern marking is a yes/no button pair, never a dropdown", async () => {
  const pages = await source("src/components/AppPages.jsx");
  const marking = pages.slice(
    pages.indexOf("const MANUAL_OUTCOME_CHOICES"),
    pages.indexOf("export function AssessmentPage")
  );

  assert.ok(marking.length > 0, "the marking components were found");
  assert.doesNotMatch(marking, /<select|Choose result/);
  assert.match(pages, /\{ value: "correct", label: "Yes", tone: "yes" \}/);
  assert.match(pages, /\{ value: "incorrect", label: "No", tone: "no" \}/);
  // The third state stays reachable: a skipped item is not a wrong answer.
  assert.match(pages, /\{ value: "not_administered", label: "Not checked", tone: "skip" \}/);
  assert.match(pages, /aria-pressed=\{pressed\}/);
  for (const field of ["Letter name", "Letter sound", "Pattern sound", "Example word"]) {
    assert.match(marking, new RegExp(`label="${field}"`), `${field} is marked with the button pair`);
  }
});

test("active assessments use a focused shell and their own durable exit handlers", async () => {
  const [surface, sidebar] = await Promise.all([
    source("src/components/AppSurface.jsx"),
    source("src/components/Sidebar.jsx")
  ]);

  assert.match(surface, /const isFocusedShell = isStudentMode \|\| appView === APP_VIEWS\.STUDENT_LOGIN \|\| isFocusedAssessment/);
  assert.match(surface, /\{!isFocusedShell && \(\s*<Suspense[\s\S]*?<Sidebar/);
  assert.match(surface, /<LetterAssessmentPage[\s\S]*?endAssessment=\{saveLetterAssessmentPartialAndExit\}/);
  assert.match(surface, /<AdvancedPhonicsPatternAssessmentPage[\s\S]*?endAssessment=\{savePatternAssessmentPartialAndExit\}/);
  assert.match(surface, /<ELBenchmarkAssessmentPage[\s\S]*?onSaveAndExit=\{nextSession =>/);
  assert.match(surface, /saveElBenchmarkPartialAndExit\(nextSession\)/);
  assert.match(surface, /<AssessmentPage[\s\S]*?returnToStudentOverview=\{returnFromCheck\}/);
  assert.doesNotMatch(sidebar, /role="alertdialog"|anything not already saved is lost|pendingItem/);
});
