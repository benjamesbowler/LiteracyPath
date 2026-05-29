# Reports Performance Audit

## Scope

This audit covers the student-facing Reports section opened from the main navigation. It does not change assessment scoring, skill progression, Guided Reading records, Supabase auth, class management, or teacher dashboard behavior.

## Current Load Path

Opening Reports renders `TeacherReportsPage` from `src/components/AppPages.jsx`.

Data sources used on initial render:

- `assessmentHistory` from local assessment history storage, filtered to the selected student in `src/App.jsx`.
- `guidedReadingRecords` from local guided-reading progress storage for the selected student.
- `itemMastery` from the active student profile state.

Supabase queries fired by this Reports page on open:

- None directly from `TeacherReportsPage`.

Important distinction: teacher/admin dashboard reports have their own Supabase dashboard queries, but the slow student Reports section is currently driven by local state and synchronous client-side aggregation.

## Bottlenecks Found

The Reports component previously did all report derivation synchronously during first render:

- `summarizeGuidedReadingProgress(guidedReadingRecords)`
- `summarizeAssessmentHistory(assessmentHistory)`
- `summarizeGuidedReadingRecords(guidedReadingRecords)`
- `getGuidedReadingWordStatusRows(guidedReadingRecords)`
- green/orange word filtering
- `buildSkillMasterySummary()` in the parent render path
- inline student assessment-history filtering in JSX

The Guided Reading helpers can be noticeably expensive when the book library and saved word-mark history are large. The slowest likely path is word-status aggregation plus repeated book lookups and sorting.

## Fixes Applied

1. Reports shell now renders before detailed Guided Reading sections.
   - The page header, report actions, and basic student report area appear immediately.
   - Guided Reading summary, word-status rows, and conference notes show section-specific loading messages, then compute during idle time or the next task.

2. Expensive derived report data is memoized.
   - Assessment summary is memoized from `assessmentHistory`.
   - Assessment summary defaults to the last 90 days, with an explicit All Time filter available.
   - Guided Reading progress is memoized and gated behind the deferred detail pass.
   - Word-status rows are memoized and capped in the rendered preview.
   - Guided Reading conference summaries are memoized and capped in the rendered preview.
   - App-level student assessment-history filtering is memoized.
   - Skill mastery summary is memoized for Reports/Finished Report views.

3. Export work remains deferred.
   - Reading Excel workbook generation still happens only after `Export Reading Report`.
   - Text/CSV exports still happen only after button clicks.

4. Development-only profiling was added.
   - In development builds, the Reports path logs durations for assessment summary, filtered history, skill mastery summary, Guided Reading progress, word rows, conference summaries, and total detail readiness.
   - These logs are `console.debug` and do not run in production builds.

## Before / After Timing Notes

Before:

- Observed user report: roughly 5 seconds to load Reports.
- Initial render synchronously computed all student report summaries and Guided Reading detail rows before the page felt ready.

After:

- Page shell should render immediately with per-section loading states.
- Heavier Guided Reading details are deferred and memoized.
- Use development console logs prefixed with `[Reports]` to capture local timings for:
  - filtered assessment history
  - assessment summary
  - skill mastery summary
  - guided reading progress
  - guided reading word rows
  - guided reading conference summaries
  - total elapsed time until detailed sections are ready

## Remaining Risks

- `TeacherReportsPage` still lives in `AppPages.jsx`, so it is not yet separately code-split.
- Guided Reading helper functions still search `guidedReadingBooks` for some per-record lookups. If saved word-mark history becomes very large, a book-id map inside the helper module would be the next optimization.
- Assessment history is currently local-storage backed for this view. If Reports later moves to Supabase-backed history, it should use date/student/class filters and pagination by default.

## Future Guardrails

- Do not build Excel workbooks during Reports mount.
- Do not render all historical attempts or all word-mark rows by default.
- Keep the initial Reports shell independent from deep report calculations.
- Add pagination or "Show more" before rendering long history tables.
- If Supabase report queries are added, default to a recent date range and select only required columns.
