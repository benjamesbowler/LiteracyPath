# Media QA Admin Pages Report

Date: 2026-07-25

## Routes Added

- /admin/media/images
- /admin/media/audio

These routes are available from the admin dashboard buttons and remain behind the existing admin-only app view.

## Data Structure Used

Runtime-friendly QA records are defined by `src/data/mediaQaManifest.js`.

Each record supports:

- id
- mediaType
- targetWord
- skillId
- skillName
- level
- filePath
- linkedQuestionIds
- status
- rejectionReason
- reviewerNotes
- reviewedAt
- reviewedBy
- heuristicFlags
- replacementPath

Admin status changes are saved locally in `localStorage` as `lpMediaQaOverrides`. The static seed manifest remains the permanent source-code gate for shipped blocks/rejections.

## Export Behavior

Both Image QA and Audio QA pages export:

- CSV
- JSON
- Kimi markdown replacement request

Kimi markdown groups records by skill and includes strict image/audio rules.

## Validation Results

- Total QA records: 2127
- Total images: 1134
- Total audio: 993
- Unreviewed: 1958
- Approved: 0
- Rejected: 39
- Blocked: 130
- Needs Kimi: 0
- Missing file paths/files: 63
- Runtime source questions using blocked/rejected media: 0
- Confirmed active bad image mappings from visual audit: 0

## Remaining Limitations

- Admin moderation is local-first until a Supabase-backed media QA table is approved.
- Image blocking takes effect for future question selection in the current browser; source-code seed manifest entries are needed for permanent team-wide blocks.
- Audio marked blocked/rejected is reported and can be exported, but text-valid questions should degrade by disabling audio rather than crashing.
