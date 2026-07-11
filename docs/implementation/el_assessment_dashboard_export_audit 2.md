# EL Assessment Dashboard Export Audit

## Existing Storage Source

LiteracyPath now saves completed assessment/checkpoint attempts through `src/data/assessmentHistoryStore.js`.

- Local key: `lpAssessmentHistory:v1:{teacherId}`
- Normalized records include student, class, skill, level, phase, score, covered items, missed items, and question records.
- `src/App.jsx` saves a normalized attempt when a checkpoint completes.
- Supabase `assessment_attempts` is attempted only when available; local storage remains the safe fallback.

No Supabase schema change is required for the EL report feature.

## Available Fields

The current attempt model supports the fields needed for teacher-friendly EL reporting:

- student id/name
- class id
- teacher id
- assessment type
- skill id/name
- level and phase
- started/completed date
- total questions
- correct count
- accuracy
- passed/status
- mastered items
- missed items
- item keys covered
- question-level records

## Gaps

- Older local records may not have class ids, item lists, or full question records.
- Reports must tolerate missing dates, unknown classes, unknown students, and empty history.
- The app does not currently require a Supabase `el_assessment_reports` table, so report history is local-first.

## Proposed Report Structure

The new store `src/data/elAssessmentReportStore.js` creates normalized report snapshots:

- individual student reports
- whole-class reports
- summary metrics
- skill rows
- student rows
- attempt rows
- progress rows
- comparison values
- saved report metadata

Saved reports use:

- Local key: `lpElAssessmentReports:v1:{teacherId}`
- Optional Supabase table: `el_assessment_reports`
- If the optional table does not exist, the write is caught and local history remains available.

## EL Skill Grouping

Reports group current LiteracyPath skills into teacher-friendly EL-style areas:

- Phonological Awareness
- Phonics / Decoding
- High-Frequency Words
- Grammar / Mechanics
- Vocabulary / Language
- Comprehension

Skill IDs are not renamed. The grouping is report-only.

## Dashboard Placement

The Teacher Dashboard now exposes an EL Assessment Snapshot section with:

- current EL assessment summary
- student selector
- Export Student EL Assessment Excel
- Export Class EL Assessment Excel
- Saved EL Reports
- Download Again
- Compare
- Delete local copy

The section remains visible even when there are no assessment records.

## Risks

- Local report history is per browser unless a Supabase table is later added.
- Old local attempts without class ids may appear as unknown class.
- Comparison depends on saved report snapshots; the first generated report has no previous comparison.

## Supabase

No Supabase schema was changed.

Future optional table:

`el_assessment_reports`

Recommended columns:

- report_id
- report_type
- class_id
- student_id
- teacher_id
- generated_at
- file_name
- summary jsonb
- payload jsonb

