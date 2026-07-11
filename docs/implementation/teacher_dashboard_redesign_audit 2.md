# Teacher Dashboard Redesign Audit

## Existing Architecture

- Main teacher/admin shell: `src/App.jsx`
- Admin dashboard UI: `src/components/AdminDashboardPage.jsx`
- Student report area: `src/components/FinishedReportPage.jsx` and `TeacherReportsPage` in `src/components/AppPages.jsx`
- Guided Reading reader/library: `GuidedReadingPage` in `src/components/AppPages.jsx`
- Guided Reading data: `src/data/guidedReadingBooks.js` and `src/data/guidedReadingSeriesBooks.js`
- Supabase client: `src/supabaseClient.js`

## Assessment Storage Before This Pass

- Individual answers are written to the Supabase `answers` table by `saveAnswerToSupabase`.
- Item-level mastery is written to `item_mastery` when the table exists.
- Skill mastery checkpoints are written to `mastery`.
- Full 15-question assessment attempts were not stored as a queryable history record with round-level summary, question records, level/phase, and coverage metadata.
- Guided Reading progress is currently stored in browser localStorage per teacher/student, with a TODO noting future Supabase persistence.

## Current Class/Student Schema Usage

- Classes are read from `classes` with `id`, `name`, `teacher_id`, and `created_at`.
- Students are read from `students` with `id`, `name`, `class_id`, `teacher_id`, and `created_at`.
- Teacher ownership controls already exist in the current app flow; this pass does not alter Supabase auth, class, or ownership rules.

## Reporting/Export Flow

- Student report exports already exist for text/CSV and selected formal assessments.
- Guided Reading exports summarize completed books, rereads, and marked words.
- Admin coverage tools already show question-bank/media coverage.
- The missing layer was a simple class-level view built from saved assessment attempts.

## Implementation Plan Used

- Add a structured assessment attempt archive helper in `src/data/assessmentHistoryStore.js`.
- Save one attempt record when a 15-question checkpoint round completes.
- Keep Supabase optional: attempts are always saved locally and are also written to `assessment_attempts` if that table exists.
- Add Teacher Dashboard sections to the existing admin dashboard:
  - Class overview metrics
  - Student list with flags
  - Skill heatmap
  - Assessment archive
  - CSV/JSON exports
  - Simple line chart for class accuracy over time
- Add controlled Guided Reading read-aloud policy in `src/utils/guidedReading/readAloudPolicy.js`.
- Extend Guided Reading with Read Page, Read Whole Book, Pause/Resume, Stop, and auto-advance controls using existing human audio paths where available.

## Risks / Notes

- Supabase schema was not changed automatically. For cloud history beyond this browser, add an `assessment_attempts` table with columns matching the optional upsert payload in `assessmentHistoryStore.js`.
- Read-aloud does not autoplay and does not use browser TTS by default for guided reading page/book narration.
- Existing Guided Reading word-tap audio remains unchanged.
- Existing assessment progression, question banks, and Supabase auth/class logic were intentionally left intact.
