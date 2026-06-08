# Performance Loading Audit

Generated: 2026-06-08T02:31:00.000Z

## Startup Import Changes

- Removed static generated assessment-bank imports from `src/App.jsx`.
- Removed the static `hfwRuntimeEligibility` import from `src/App.jsx` and `src/data/skillTemplateRouting.js`.
- Replaced `coverageExpectations` use of the full generated HFW approved bank with the small `hfwApprovedCoverageWords` coverage map.
- Moved `src/data/loadAssessmentSkillBank.js` behind a dynamic import so its own base-bank imports are not paid for on initial app load.

## Dynamic Assessment Banks

The following generated banks now load through `loadAssessmentSkillBank(skillId)` only when the selected skill needs them:

- `earlySkillQuestions.generated.js`
- `hfwAssessmentQuestions.generated.js`
- `hfwLevel2Questions.generated.js`
- `firstTenSkillTopUpQuestions.generated.js`
- `secondBlockSkillTopUpQuestions.generated.js`
- `blendsAssessmentQuestions.generated.js`
- `digraphsAssessmentQuestions.generated.js`
- `longVowelsAssessmentQuestions.generated.js`
- `vowelTeamsVarietyQuestions.generated.js`
- `grammarAssessmentQuestions.generated.js`
- `languageSkillQuestions.generated.js`
- `skillLevelGapQuestions.generated.js`

## Bundle Comparison

- Before: `index-DrIFCKut.js` was 8,831.17 kB minified, 700.02 kB gzip.
- After: `index-Bm4kQK0b.js` is 1,068.96 kB minified, 209.07 kB gzip.
- The generated assessment banks now appear as deferred chunks: `generated-hfw-banks`, `generated-language-banks`, `generated-assessment-banks`, and `generated-early-skills`.

## End Assessment

- `FinishedReportPage` now uses a shared lazy-load promise and is preloaded when an assessment is warmed or ended.
- Skill mastery summary calculation now runs through `requestIdleCallback` when the report view opens, so the report shell can render before the heavier summary work runs.
- Coverage snapshots are memoized instead of recalculated inline in multiple report/overview renders.

## Auth

- Admin status and teacher account row lookup now run in parallel once a user id is known.
- Pending account creation remains deferred until after the admin check, so admin users do not create pending requests during the parallel lookup.
