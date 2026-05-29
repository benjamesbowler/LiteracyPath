# Performance Phase 1 Plan

Generated: 2026-05-29

## Baseline Observations

This pass did not change app behavior. The goal is to identify safe next actions.

| Area | Observed size/impact | Notes |
| --- | ---: | --- |
| `dist/assets` JS/CSS | about 7.8 MB | Initial/runtime code still has several large chunks. |
| `dist/` | about 2.2 GB | Build output includes heavy copied static assets. Ignored by Git. |
| `dist/guided-reading` | about 1.3 GB | Built static guided-reading media. Ignored by Git. |
| `public/guided-reading` | about 1.0 GB | Active guided-reading media. Do not delete in this cleanup pass. |
| `public/images` | about 539 MB | Active image assets. Do not delete in this cleanup pass. |
| `LP Assets/` | about 879 MB | Tracked archive, not active runtime. Audit separately before untracking. |

Known large bundle contributors from the hygiene audit:

- ExcelJS/export code
- Admin media inventory
- Guided reading data
- Question-bank-extra/generated banks
- Audio manifests

## Safe Future Tasks

### 1. Dynamic Import ExcelJS In Export Helpers

| Field | Detail |
| --- | --- |
| Likely files | `src/utils/exportGuidedReadingCompletionExcel.js`, `src/utils/exportElAssessmentExcel.js`, any other Excel export helper |
| Risk | Low if helpers already isolate export behavior |
| Expected benefit | Keeps the large ExcelJS package out of normal page load |
| Validation | Export Guided Reading Excel, export EL student/class Excel, run dashboard contract checks |

Current contract checks indicate the main Guided Reading and EL Excel helpers already use dynamic ExcelJS imports. Keep this as a guardrail for future export helpers.

### 2. Lazy-Load Admin Media Inventory

| Field | Detail |
| --- | --- |
| Likely files | Admin/media QA pages, `src/data/publicMediaInventory.js`, admin media inventory imports |
| Risk | Medium |
| Expected benefit | Avoid loading large media inventory data for normal student/teacher runtime |
| Validation | Admin media QA pages still open, student assessments still start quickly, media checks still pass |

Recommended approach: load the inventory only when the admin media tab opens.

### 3. Lazy-Load Teacher/Admin Dashboard

| Field | Detail |
| --- | --- |
| Likely files | `src/App.jsx`, `src/components/AdminDashboardPage.jsx` |
| Risk | Low/medium |
| Expected benefit | Prevent dashboard/reporting code from affecting student startup |
| Validation | Teacher dashboard navigation, assessment archive, exports, signup approval panel |

Current contract checks indicate `AdminDashboardPage` is already lazy-loaded. Keep the check in place.

### 4. Split Guided Reading Data By Series/Level

| Field | Detail |
| --- | --- |
| Likely files | `src/data/guidedReadingSeriesBooks.js`, guided reading aggregators, guided reading shelf/reader components |
| Risk | Medium/high |
| Expected benefit | Student assessment startup no longer pays for full guided-reading page arrays |
| Validation | Guided reading shelf counts, reader title pages, image/text alignment, read-aloud controls |

Recommended approach: keep small shelf metadata eagerly available, then dynamically import full page/audio arrays only when a book opens.

### 5. Split Question Banks By Skill Group

| Field | Detail |
| --- | --- |
| Likely files | generated question-bank files, runtime question loader, skill selector utilities |
| Risk | Medium/high |
| Expected benefit | Reduces startup cost and memory footprint, especially for students using one active skill |
| Validation | Runtime coverage, skill routing, progression checks, HFW/Final Sounds/Rhyming purity checks |

Recommended approach: keep a lightweight skill manifest, then lazy-load skill-specific question banks on skill start.

### 6. Split Audio Manifests Into Runtime And Admin/Audit Manifests

| Field | Detail |
| --- | --- |
| Likely files | `src/data/audioPreferenceManifest.js`, public media inventory, media QA/admin tools |
| Risk | Medium |
| Expected benefit | Runtime only loads approved paths needed for selection; admin-only review metadata stays out of student flow |
| Validation | Audio preference checks, HFW audio quality, assessment runtime safety, admin media QA |

Recommended approach: create a minimal approved runtime map and load full review/audit metadata only in admin/validation contexts.

## What Not To Change In Phase 1

- Do not delete active media from `public/`.
- Do not remove guided reading data.
- Do not rewrite assessment/question-bank loading in this pass.
- Do not change Supabase/auth/dashboard behavior.
- Do not change scoring or progression.
- Do not untrack `LP Assets/` until the owner approves the archive plan.

## Suggested Validation For Future Performance Work

Use focused checks based on the touched area:

- `npm run build`
- `node tools/checkPerformanceContracts.js`
- `node tools/checkTeacherDashboardDataContracts.js`
- `node tools/checkGuidedReadingSeriesBooks.js`
- `node tools/checkGuidedReadingExperience.js`
- `node tools/checkAssessmentRuntimeSafety.js`
- `node tools/checkRuntimeQuestionCoverage.js`
- `npm run validate:skill-banks`
- `npm run check:skill-progression`

For very large refactors, also compare the resulting `dist/assets` chunk sizes before and after.

## Current Phase 1 Action

No performance code changes were made. This document is a plan for safe follow-up work.
