# EL Assessment Progress Persistence Audit

Generated: 2026-05-29

## Finding

The adaptive skill checkpoint flow already archived completed 15-question rounds, but formal EL flows such as Letter Name/Sound and Advanced Phonics Pattern assessments only updated live mastery state. They did not create the same `assessmentHistory` attempt records used by Teacher Dashboard reports, EL exports, and assessment archives.

Student item mastery was also split across two sources:

- per-answer `itemMastery` updates used by progress boxes and finished reports
- archived `assessmentHistory` records used by Teacher Dashboard reporting

When Supabase item-level tables were unavailable or incomplete, reloading a student could rebuild mastery from empty Supabase rows even though local archived attempts existed.

## Fix

- Added shared assessment mastery extraction in `assessmentHistoryStore`.
- Enriched saved attempts with mastered, developing, and needs-support item lists.
- Routed adaptive checkpoint completion through a shared `persistCompletedAssessmentAttempt` helper.
- Added saved attempt creation for EL Letter Name/Sound completion.
- Added saved attempt creation for Advanced Phonics Pattern completion.
- Rebuilds local item mastery from archived attempts when loading a student, then overlays Supabase item mastery rows when available.

## Source Of Truth

The dashboard/report source is now the saved assessment attempt stream:

- local key: `lpAssessmentHistory:v1:{teacherId}`
- optional Supabase table: `assessment_attempts`

Cumulative student progress still uses `itemMastery`, with a local fallback rebuilt from saved attempts when Supabase item mastery rows are missing.

## Validation

The new checker `tools/checkElAssessmentProgressPersistence.js` verifies:

- completed attempts are saved and loadable
- Initial Sounds creates initial-sound mastery records
- Final Sounds creates final-sound mastery records
- Rhyming creates rime-family records
- Short Vowel Discrimination creates short-vowel records
- HFW creates individual sight-word records
- Teacher Dashboard summaries read the saved attempt records
