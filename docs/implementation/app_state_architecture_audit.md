# App State Architecture Audit

## Purpose

This document captures the current `App.jsx` state-management shape and the first safe extraction pass. The goal is to reduce risk before any future reducer work. This pass did not rewrite `App.jsx`, did not change Supabase/auth behavior, did not alter assessment scoring, did not change reports/export behavior, did not change Guided Reading record saving, and did not change saved progress/mastery logic.

## Major State Groups

### appView/routing state

`appView` controls the main route surface: student select, overview, skills, EL assessments, Guided Reading, reports, tools, Learn, focused assessments, checkpoint, finished report, teacher dashboard, and admin dashboard. It is used both for rendering and for persistence/restoration.

SAFE_TO_EXTRACT_NOW:
- View name constants.
- Pure predicates such as focused assessment views and shell/footer visibility.
- Pure restoration/persistence helpers for `appView`.

KEEP_IN_APP_FOR_NOW:
- Actual `setAppView(...)` calls inside user actions and async flows.
- Route transitions coupled to profile restore, checkpoint decisions, or assessment completion.

FUTURE_REDUCER_CANDIDATE:
- `navigationReducer` or top-level shell reducer after route transition tests exist.

### teacher/auth/account state

State includes `teacherUser`, `authReady`, email/password/username/display-name fields, `authMode`, `authLoading`, `authMessage`, `teacherAccountStatus`, `teacherAccountRecord`, admin flags, and account-check refs.

KEEP_IN_APP_FOR_NOW:
- Supabase session boot.
- `onAuthStateChange`.
- pending account checks.
- admin access checks.
- login/signup/reset/update password handlers.

NEEDS_TEST_BEFORE_EXTRACT:
- Account approval normalization and timeout orchestration.

FUTURE_REDUCER_CANDIDATE:
- `authReducer` for form state, auth status text, and account status once auth integration tests exist.

### student/class state

State includes `studentName`, `studentId`, `studentList`, `loadingStudents`, `classList`, `selectedClassId`, `newClassName`, `classDashboard`, `showClassDashboard`, `profileLoaded`, and `nameSaved`.

SAFE_TO_EXTRACT_NOW:
- Pure storage key helpers.
- Pure selected class/student label helpers.

KEEP_IN_APP_FOR_NOW:
- Supabase class/student CRUD.
- student profile restore/save.
- reset student selection.

FUTURE_REDUCER_CANDIDATE:
- `studentSessionReducer` for selected class/student, loading state, profile loaded state, and local dashboard toggles.

### assessment/session state

State includes `currentSkillIndex`, `roundAnswers`, `roundItemKeys`, `roundQuestionIds`, `usedByStage`, `currentQuestion`, `feedback`, `assessmentTransitioning`, `assessmentMode`, letter and advanced phonics assessment state, and answer refs.

SAFE_TO_EXTRACT_NOW:
- Pure display calculations: round correct count, round progress, accuracy.
- Pure attempt type mapping for `"mastery"` to `"skill_checkpoint"`.

KEEP_IN_APP_FOR_NOW:
- `pickQuestion`.
- `answerQuestion`.
- transition timers.
- `answerInFlightRef` coordination.
- round refs.

NEEDS_TEST_BEFORE_EXTRACT:
- question selection helpers tied to repeat guards and media QA.
- checkpoint decision inputs.

FUTURE_REDUCER_CANDIDATE:
- `assessmentSessionReducer` for question, feedback, round arrays, transition state, and checkpoint state.

### mastery/progress state

State includes `mastery`, `itemMastery`, `itemSessionSeen`, `checkpointDecision`, and child learning evidence. It also uses Supabase upserts and local assessment attempt archives.

KEEP_IN_APP_FOR_NOW:
- item mastery updates.
- Supabase persistence.
- checkpoint decisions.
- completed assessment attempt persistence.

NEEDS_TEST_BEFORE_EXTRACT:
- coverage snapshot and item mastery snapshot generation.

FUTURE_REDUCER_CANDIDATE:
- `progressReducer` or folded into `assessmentSessionReducer` after persistence boundaries are isolated.

### guided reading state

State includes `guidedReadingRecords`, storage-key helpers, local persistence, reading report export data, and Guided Reading page callbacks.

SAFE_TO_EXTRACT_NOW:
- Pure Guided Reading storage key helper.

KEEP_IN_APP_FOR_NOW:
- `saveGuidedReadingRecord`.
- localStorage read/write side effects.
- report/export generation.

FUTURE_REDUCER_CANDIDATE:
- `guidedReadingReducer` after record-save behavior has regression tests.

### reports/dashboard state

State includes `assessmentHistory`, `classDashboard`, admin dashboard rows, dashboard loading, `showReport`, and derived report memo values.

KEEP_IN_APP_FOR_NOW:
- report/export functions.
- dashboard load/refresh/delete flows.
- admin account approval mutation.

NEEDS_TEST_BEFORE_EXTRACT:
- report filtering and guided-reading export summary generation.

FUTURE_REDUCER_CANDIDATE:
- `reportFiltersReducer` for report view filters and selection state.

### child mode/reward state

Child mode page state mostly lives in `ChildMode.jsx`, while `App.jsx` handles child answer recording, evidence loading, and item mastery updates.

KEEP_IN_APP_FOR_NOW:
- child answer Supabase saving.
- child answer to item mastery update bridge.
- evidence loading from Supabase.

FUTURE_REDUCER_CANDIDATE:
- `childModeReducer` inside child mode after reward and replay behavior tests exist.

## Derived Values That Could Be Memoized

Already memoized or effectively moved out:
- `currentStageQuestions` is memoized by `currentSkillIndex`.
- `weaknessSnapshot` is memoized by `answerHistory`.
- `questionBankCoverageSnapshot` is module-level because `allQuestions` is module-level.
- report-specific rows are already memoized by `appView`, `assessmentHistory`, `studentId`, `itemMastery`, and `answerHistory`.

Possible future memo targets:
- `buildCoverageSnapshot(itemMastery, ...)` calls passed into overview/skills/finished pages.
- `getItemMasterySnapshot()` passed into overview/tools.
- `summarizeAssessmentHistory(...)` for Learn.

These future targets should be measured or wrapped carefully because some include debug context or object creation that may affect downstream rendering.

## Functions Safe To Extract

SAFE_TO_EXTRACT_NOW:
- app view constants and pure predicates.
- profile/guided-reading storage key formatting.
- selected class/student label helpers.
- round progress/accuracy display calculations.
- assessment attempt type mapping.
- simple normalization helpers that do not touch React state or persistence.

## Functions Risky To Extract

KEEP_IN_APP_FOR_NOW:
- `checkAdminStatus`, `loadTeacherAccountStatus`, `initializeTeacherAccountAccess`.
- `loadAdminDashboard` and admin delete/update functions.
- `loadClasses`, `loadStudents`, `saveStudentName`, `loadStudentProgress`.
- `saveGuidedReadingRecord`.
- `pickQuestion`, `answerQuestion`, `buildCheckpointDecision`, checkpoint navigation handlers.
- `saveAnswerToSupabase`, `saveMasteryToSupabase`, `persistCompletedAssessmentAttempt`, `updateItemMastery`.
- report/export functions.

NEEDS_TEST_BEFORE_EXTRACT:
- media/audio playback and fallback orchestration.
- repeat guard and round queue construction.
- profile restoration with fresh-login reset behavior.

## First Safe Extraction Pass

Added:
- `src/appState/appViews.js`
- `src/appState/appViewHelpers.js`
- `src/appState/studentSessionHelpers.js`
- `src/appState/assessmentSessionHelpers.js`

Wired in `App.jsx`:
- `APP_VIEWS` constants for the most obvious route checks/transitions.
- `isFocusedAssessmentView`.
- dashboard-summary/footer visibility predicates.
- profile and Guided Reading storage-key helpers.
- round progress, round correct, and accuracy helpers.
- assessment attempt type helper.
- selected class label helper in low-risk render mapping.

## Future Reducer Plan

Do not implement these until route, restore, assessment, and persistence tests exist:

- `authReducer`: auth form fields, auth mode, auth messages, account status UI.
- `studentSessionReducer`: selected class/student, profile loaded, name saved, class dashboard toggles.
- `assessmentSessionReducer`: current question, feedback, round answers, transition state, checkpoint decision.
- `guidedReadingReducer`: selected book/read-aloud UI state and local record editing state, while keeping persistence separate.
- `reportFiltersReducer`: report filter/view state and export selections.
- `childModeReducer`: child mode screen, mission, completion, and reward UI state.

## Remaining Risks

- `App.jsx` still owns too many side effects and should not be reducerized in one pass.
- Many route transitions are interleaved with persistence and async state restoration.
- Broad lint on `App.jsx` still has existing unrelated issues; this pass only targeted new helper files and the contract checker.
- Future extraction should happen behind tests for auth restore, assessment completion, Guided Reading saves, and report exports.

## Validation Commands

```sh
node tools/checkAppStateArchitectureContracts.js
node tools/checkTeacherDashboardDataContracts.js
node tools/checkAssessmentRuntimeSafety.js
node tools/checkLearnDeckContracts.js
node tools/checkMediaResolverContracts.js
npm run build
git diff --check
npx eslint src/appState tools/checkAppStateArchitectureContracts.js --quiet
```
