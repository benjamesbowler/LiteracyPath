# Bundle Size Audit

Generated: 2026-06-02

## Summary

Phase 4 stayed conservative. The only code lazy-loading changes were inside already-lazy admin/export paths:

- `publicMediaInventory` now loads only when the Admin Image QA or Audio QA page opens.
- `exportGuidedReadingCompletionExcel` now loads only when the Guided Reading completion export is triggered.

No assessment question bank loading was changed. The large assessment banks are still eager because they are currently assembled synchronously during app startup and used by the existing assessment selection, coverage, routing, and validation paths.

## Phase 5 Status

Phase 5 added an assessment bank loading foundation but did not wire real lazy loading into runtime. This was intentional: the current assessment engine still expects a synchronous `allQuestions` pool during app module startup.

Added:

- `src/data/loadAssessmentSkillBank.js`
- `tools/checkAssessmentSkillBankLoader.js`
- `npm run check:assessment-bank-loader`
- `docs/validation/assessment_data_loading_audit.md`
- `docs/validation/assessment_bank_loader_check.md`

The loader defines the future skill groups:

- `early_phonics`
- `hfw`
- `replacement_phonics`
- `grammar_language`
- `comprehension`

It supports the Phase 5 group names plus current runtime aliases such as `long_vowels`, `r_controlled`, `prepositions`, `prefix_suffix`, `homophones`, and `theme`.

Real lazy loading was not added. The main chunk was expected to remain nearly unchanged because `App.jsx` still imports and assembles assessment banks eagerly.

## Latest Chunk Sizes

Before this phase, from the existing `dist/assets` output:

| Chunk | File | Size | Gzip |
|---|---|---:|---:|
| main index | `index-rIbVvWah.js` | 3615.60 kB | 366.52 kB |
| generated early skills | `generated-early-skills-3NVrDMpD.js` | 1024.07 kB | 46.11 kB |
| question-bank-extra | `question-bank-extra-i_DbeMCY.js` | 907.12 kB | 120.10 kB |
| audio manifest | `audio-manifest-Dq8HwsPb.js` | 758.17 kB | 195.53 kB |
| admin media inventory | `admin-media-inventory-KGaxYUct.js` | 1380.53 kB | 62.13 kB |
| guided-reading-data | `guided-reading-data-DZHBYWgF.js` | 1011.77 kB | 148.42 kB |
| exceljs | `exceljs.min-CjgIwHka.js` | 908.13 kB | 249.59 kB |
| LearnAreaPage | `LearnAreaPage-_MfxH5w5.js` | 40.33 kB | 9.38 kB |
| AdminDashboardPage | `AdminDashboardPage-CHGRtSok.js` | 151.75 kB | 32.84 kB |
| GuidedReadingPage | `GuidedReadingPage-BjqW2A1B.js` | 31.47 kB | 9.20 kB |
| FinishedReportPage | `FinishedReportPage-DE66eWsM.js` | 6.51 kB | 2.12 kB |

After this phase:

| Chunk | File | Size | Gzip |
|---|---|---:|---:|
| main index | `index-BvNWgfD2.js` | 3615.55 kB | 366.50 kB |
| generated early skills | `generated-early-skills-3NVrDMpD.js` | 1024.07 kB | 46.11 kB |
| question-bank-extra | `question-bank-extra-i_DbeMCY.js` | 907.12 kB | 120.10 kB |
| audio manifest | `audio-manifest-Db4LBHm1.js` | 758.17 kB | 195.53 kB |
| admin media inventory | `admin-media-inventory-Cwm8n-X9.js` | 1380.61 kB | 62.21 kB |
| guided-reading-data | `guided-reading-data-DZHBYWgF.js` | 1011.77 kB | 148.42 kB |
| exceljs | `exceljs.min-CjgIwHka.js` | 908.13 kB | 249.59 kB |
| LearnAreaPage | `LearnAreaPage-DEGnCEtl.js` | 40.33 kB | 9.38 kB |
| AdminDashboardPage | `AdminDashboardPage-k-h35i2s.js` | 144.29 kB | 31.07 kB |
| GuidedReadingPage | `GuidedReadingPage-C-L2Rvar.js` | 31.47 kB | 9.20 kB |
| FinishedReportPage | `FinishedReportPage-CByA7f8-.js` | 6.51 kB | 2.12 kB |

Vite output changed the Admin dashboard chunk from 155.39 kB to 147.74 kB minified. The main index stayed effectively unchanged, moving from about 3,702.37 kB to 3,702.32 kB minified.

After Phase 5 foundation:

| Chunk | File | Size | Gzip |
|---|---|---:|---:|
| main index | `index-zVnSheuq.js` | 3615.62 kB | 366.50 kB |
| generated early skills | `generated-early-skills-3NVrDMpD.js` | 1024.07 kB | 46.11 kB |
| question-bank-extra | `question-bank-extra-D_3P6UoK.js` | 907.19 kB | 120.12 kB |
| audio manifest | `audio-manifest-Db4LBHm1.js` | 758.17 kB | 195.53 kB |
| admin media inventory | `admin-media-inventory-Cwm8n-X9.js` | 1380.61 kB | 62.21 kB |
| guided-reading-data | `guided-reading-data-DZHBYWgF.js` | 1011.77 kB | 148.42 kB |
| exceljs | `exceljs.min-CjgIwHka.js` | 908.13 kB | 249.59 kB |
| LearnAreaPage | `LearnAreaPage-Db_lmo5i.js` | 72.62 kB | 16.96 kB |
| AdminDashboardPage | `AdminDashboardPage-Dc8gpX8I.js` | 144.29 kB | 31.07 kB |
| GuidedReadingPage | `GuidedReadingPage-CLJwfX5-.js` | 31.47 kB | 9.20 kB |
| FinishedReportPage | `FinishedReportPage-CByA7f8-.js` | 6.51 kB | 2.12 kB |

The Learn chunk is larger than Phase 4 because new Story Quest data was added before this phase. The assessment-related chunks stayed effectively unchanged, as expected.

## Phase 6 Status

Generated: 2026-06-02

Phase 6 was audit-only for runtime behavior. No assessment bank lazy loading was added, and no live assessment startup code was changed.

Checker/reporting changes were made:

- `tools/checkAssessmentSkillBankLoader.js` now verifies every active skill maps to exactly one known group.
- It explicitly checks HFW split bands, replacement phonics skills, runtime aliases, ghost inactive skills, and unknown-skill fallback behavior.
- `docs/validation/assessment_data_loading_audit.md` now includes a Phase 6 safe/deferred loading section.

### Phase 6 Chunk Sizes

Fresh build output:

| Chunk | File | Size | Gzip |
|---|---|---:|---:|
| main index | `index-BaW77GMO.js` | 3441.45 kB | 357.66 kB |
| generated-early-skills | `generated-early-skills-IajG1PXK.js` | 916.48 kB | 42.32 kB |
| question-bank-extra | `question-bank-extra-D_3P6UoK.js` | 907.19 kB | 120.12 kB |
| audio-manifest | `audio-manifest-Db4LBHm1.js` | 758.17 kB | 195.53 kB |
| admin media inventory | `admin-media-inventory-Cwm8n-X9.js` | 1380.61 kB | 62.21 kB |
| guided-reading-data | `guided-reading-data-DZHBYWgF.js` | 1011.77 kB | 148.42 kB |
| exceljs | `exceljs.min-CjgIwHka.js` | 908.13 kB | 249.59 kB |
| LearnAreaPage | `LearnAreaPage-DOHpN1jo.js` | 72.62 kB | 16.96 kB |
| AdminDashboardPage | `AdminDashboardPage-CQTN4YrL.js` | 144.29 kB | 31.07 kB |
| GuidedReadingPage | `GuidedReadingPage-RCJm6iiS.js` | 31.47 kB | 9.20 kB |
| FinishedReportPage | `FinishedReportPage-CByA7f8-.js` | 6.51 kB | 2.12 kB |

The main index and assessment chunks remain large because the current app still assembles the assessment bank synchronously. The generated-early-skills chunk is smaller than the Phase 5 number because earlier assessment-bank cleanup reduced generated short-vowel content, not because Phase 6 added lazy loading.

### Deferred Reduction

Major chunk reduction is deferred until Phase 7. The safest next step is to lazy-load one isolated bank group only after a runtime smoke test is available.

Recommended next target:

- Start with `hfw` only.
- Keep `early_phonics` eager.
- Keep comprehension eager.
- Compare selected-round behavior before and after lazy loading.

Do not split generated early skills, final-sound progression data, or comprehension banks until the assessment runtime has an explicit loading state and smoke coverage.

## Still Eager

### Assessment banks in `src/App.jsx`

These imports remain eager:

- `masteryCoreQuestions`
- `masteryExtraQuestions`
- `initialSoundCoverageQuestions`
- `finalSoundCoverageQuestions`
- `rhymingCoverageQuestions`
- `cvcShortVowelExpansionQuestions`
- `contentExpansionPass3Questions`
- `targetedContentRecoveryQuestions`
- `kimiDataset7RuntimeQuestions`
- `ixlStyleSeedQuestions`
- `safeContentExpansionQuestions`
- `templateQuestions`
- `templateExpansion` through `templateExpansion7`
- `questionBankExpansion8` through `questionBankExpansion14`
- `qbAssess_*`
- `qbFillGaps`
- `generatedQuestions`
- `generatedEarlySkillQuestions`
- `hfwAssessmentQuestions`
- `blendsAssessmentQuestions`
- `digraphsAssessmentQuestions`
- `longVowelsAssessmentQuestions`
- `vowelTeamsVarietyQuestions`
- `grammarAssessmentQuestions`
- `skillLevelGapQuestions`
- `hfwLevel2Questions`
- `highQualityComprehensionReplacementQuestions`
- `fixSentenceQuestions`
- `templateComprehensionAdvanced`
- `advancedPhonicsPatterns`

Reason left alone: `App.jsx` currently builds the runtime question pool, coverage summaries, skill routing checks, and replacement-bank eligibility synchronously. Lazy-loading these banks safely would need a deliberate assessment bootstrap/loading design and validation of every assessment entry path.

### Generated bank imports in `src/content/skillMedia/skillAssetRegistry.js`

This registry also imports many generated and expansion banks at module load. In this app it is used mainly by tooling and media validation paths, not normal app startup. It should not be refactored in this phase because many tools import it directly and expect synchronous access.

### `src/questions.js`

This file contains a small static legacy question array and does not appear to be imported by the current app startup path. No action needed.

### `src/components/ChildMode.jsx`

`ChildMode.jsx` statically imports `audioManifest` and `guidedReadingBooks`, but it does not appear to be wired into `App.jsx` in the current runtime path. No action taken.

## Already Lazy

- `AdminDashboardPage` is lazy-loaded from `App.jsx`.
- `FinishedReportPage` is lazy-loaded from `App.jsx`.
- `LearnAreaPage` and Story Quest data are lazy-loaded through the Learn page.
- `GuidedReadingPage` and `guidedReadingBooks` are lazy-loaded from the Guided Reading route after Phase 3.
- Guided Reading report helpers in `TeacherReportsPage`, `FinishedReportPage`, and export code are lazy-loaded.
- `audioManifest` is loaded with `import("./data/audioManifest")` only when requested by audio helper code.
- `ExcelJS` is loaded with `import("exceljs")` only inside export flows.
- `exportElAssessmentExcel.js` loads `ExcelJS` dynamically.
- `exportGuidedReadingCompletionExcel.js` loads `ExcelJS` dynamically.

## Safe Changes Made

- Removed the static `publicMediaInventory` import from `AdminDashboardPage.jsx`.
- Added a dynamic `import("../data/publicMediaInventory")` inside `MediaQaPage`, with a loading message while the inventory chunk arrives.
- Removed the static `exportGuidedReadingCompletionExcel` import from `AdminDashboardPage.jsx`.
- Added a dynamic `import("../utils/exportGuidedReadingCompletionExcel.js")` inside `handleGuidedReadingCompletionExport`.
- Added `tools/checkBundleSize.js`.
- Added `npm run check:bundle-size`.

## Too Risky For This Phase

- Lazy-loading the core assessment bank assembly in `App.jsx`.
- Splitting the generated early-skill and replacement-bank arrays by skill before assessment startup.
- Changing Story Quest data loading inside `LearnAreaPage`.
- Moving Guided Reading book data again after Phase 3.
- Changing `skillAssetRegistry.js` imports, because validation tools rely on synchronous module access.

## Phase 5 Plan

The next safe bundle step should be a dedicated assessment bootstrap refactor:

1. Extract question-bank assembly from `App.jsx` into a single `assessmentQuestionBankRuntime` module.
2. Add an app-level assessment-bank loading state before enabling assessment start.
3. Keep the current synchronous API inside that module once loaded.
4. Add smoke coverage for Initial Sounds, Final Sounds, HFW letter-build, Blends, Digraphs, Long Vowels, and advanced/comprehension banks before moving more imports.
5. Only then split generated early-skill banks and replacement banks by route or skill family.

## Phase 6 Recommendation

Phase 6 should use `loadAssessmentSkillBank.js` as the abstraction point, but only after extracting current `allQuestions` assembly out of `App.jsx`.

Suggested order:

1. Move current synchronous assessment assembly to a runtime module with no behavior changes.
2. Add an explicit assessment-bank loading state before a round can start.
3. Convert `hfw` to group-loaded data first.
4. Convert `replacement_phonics` next.
5. Convert `grammar_language` after replacement phonics is stable.
6. Leave `early_phonics` and `comprehension` synchronous until async round selection has dedicated smoke tests.

Still risky:

- Initial Sounds custom selector and media requirements.
- Final Sounds Level 1 mastery-depth and image/audio eligibility.
- Rhyming image-card purity.
- CVC/short-vowel round construction.
- Sentence/comprehension replacement banks and higher-skill paragraph quality.

## Phase 7 Status

Generated: 2026-06-02

Phase 7 added HFW smoke coverage and HFW-safe loader validation only. It did not switch live assessment runtime loading to async.

### Latest build chunk sizes

From the latest `npm run check:bundle-size` after the Phase 7 build:

| Chunk | File | Size | Gzip |
| --- | --- | ---: | ---: |
| main index | `index-2paILfQI.js` | 3441.45 kB | 357.67 kB |
| generated-early-skills | `generated-early-skills-IajG1PXK.js` | 916.48 kB | 42.32 kB |
| question-bank-extra | `question-bank-extra-D_3P6UoK.js` | 907.19 kB | 120.12 kB |
| audio-manifest | `audio-manifest-Db4LBHm1.js` | 758.17 kB | 195.53 kB |

### Did Phase 7 change chunk sizes?

Not materially. The app still assembles the assessment question pool synchronously, so the large assessment-related chunks remain. The new smoke test and loader validation run in Node tooling and do not reduce the production bundle.

### Phase 7 changes

- Added `tools/checkHfwRuntimeSmoke.js`.
- Added `npm run check:hfw-runtime-smoke`.
- Added `docs/validation/hfw_runtime_smoke_check.md`.
- Added readiness-only `loadHfwAssessmentBank(skillId)`.
- Strengthened HFW checks inside `tools/checkAssessmentSkillBankLoader.js`.

### Phase 8 recommendation

Do not lazy-load all assessment banks at once. The next safe step is:

1. Extract `App.jsx` question-pool assembly into a dedicated runtime module without changing behavior.
2. Add an assessment-bank loading state before starting/resuming a round.
3. Switch only HFW to the HFW-safe async group path.
4. Compare `npm run check:hfw-runtime-smoke` before and after.
5. Leave early phonics and comprehension eager until they have their own runtime smoke checks.
