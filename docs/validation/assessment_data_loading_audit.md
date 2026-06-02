# Assessment Data Loading Audit

Generated: 2026-06-02

## Summary

Phase 5 adds a loader foundation only. Assessment bank loading remains mostly eager at runtime because the existing assessment engine still builds a synchronous `allQuestions` pool in `src/App.jsx` and uses that pool for selection, routing, coverage, checkpoint logic, and validation-adjacent helpers.

No assessment content, scoring, mastery logic, skill routing, Supabase/auth, teacher dashboard, Guided Reading, Story Quest data, or media files were changed.

## Current Eager Assessment Imports

### `src/App.jsx`

`App.jsx` still eagerly imports the core runtime assessment banks:

| Bank family | Current imports | Triggering screen/path |
| --- | --- | --- |
| Core/mastery banks | `masteryCoreQuestions`, `masteryExtraQuestions` | Main app startup because `App.jsx` imports and assembles `allQuestions` at module load |
| Early skill coverage banks | `initialSoundCoverageQuestions`, `finalSoundCoverageQuestions`, `rhymingCoverageQuestions`, `cvcShortVowelExpansionQuestions`, `generatedEarlySkillQuestions` | Main app startup and every normal student assessment path |
| HFW banks | `qbAssess_hfw1`, `qbAssess_hfw2`, `hfwAssessmentQuestions`, `hfwLevel2Questions` | Main app startup; needed for HFW 1-25, 26-50, 51-75, 76-100 |
| Replacement phonics banks | `blendsAssessmentQuestions`, `digraphsAssessmentQuestions`, `longVowelsAssessmentQuestions`, `vowelTeamsVarietyQuestions`, `skillLevelGapQuestions` | Main app startup; used by replacement-only phonics skills and depth checks |
| Grammar/language banks | `grammarAssessmentQuestions`, `skillLevelGapQuestions` | Main app startup; replacement grammar/language skills are filtered synchronously |
| Comprehension banks | `highQualityComprehensionReplacementQuestions`, `fixSentenceQuestions`, `templateComprehensionAdvanced`, `questionBankExpansion8-14`, `qbAssess_sc`, `qbAssess_rc`, `qbAssess_inf` | Main app startup; high-level comprehension skills still expect synchronous candidates |
| Legacy/expansion banks | `templateQuestions`, `templateExpansion` through `templateExpansion7`, `generatedQuestions`, `contentExpansionPass3Questions`, `targetedContentRecoveryQuestions`, `kimiDataset7RuntimeQuestions`, `ixlStyleSeedQuestions`, `safeContentExpansionQuestions`, `qbFillGaps` | Main app startup; still part of the compatibility pool and filtered by routing/content rules |
| Media resolver dependencies | `questionMediaResolver`, `listenAndFindAssets`, `initialSoundPairAssets`, `soundPairAssets`, `visualQuestionAssets`, media QA manifests | Main app startup; used while normalizing/enriching assessment questions |

### Dynamic audio manifest

`src/App.jsx` no longer statically imports `audioManifest`. It keeps a dynamic helper:

- `loadAudioManifestModule() -> import("./data/audioManifest")`

The `audio-manifest` chunk still appears in build output because it remains an application chunk, but it is not statically imported by the normal top-level app module.

### Tooling and media validation paths

Several tools still import generated banks directly for audits. This is acceptable for Phase 5 because these are command-line validation paths, not normal student startup:

- `tools/phonicsRuntimeUtils.js`
- `tools/checkRuntimeQuestionCoverage.js`
- `tools/checkAssessmentRuntimeSafety.js`
- `tools/auditQuestionBank.js`
- media/audio audit tools

## Screens That Trigger Assessment Banks Today

| Screen/path | Current loading behavior |
| --- | --- |
| Login/auth shell | Loads `App.jsx`, which eagerly imports and assembles assessment banks |
| Student overview/dashboard | Shares the same `App.jsx` module, so assessment banks are already resident |
| Assessment round start | Uses the already-built synchronous `allQuestions` pool |
| Checkpoint/report pages | Use assessment history plus metadata from the same app module |
| Admin dashboard | Lazy-loaded separately, but assessment banks were already loaded by `App.jsx` before admin route rendering |
| Learn / Story Quest | Lazy-loaded page, but app startup still includes assessment banks because of `App.jsx` |
| Guided Reading | Page/data were decoupled in earlier phases, but app startup still includes assessment banks |

## Safe To Lazy-Load Later

These groups now have a stable group mapping in `src/data/loadAssessmentSkillBank.js` and are candidates for Phase 6 once the assessment bootstrap can await group data:

| Group | Skills |
| --- | --- |
| `hfw` | `hfw_1_25`, `hfw_26_50`, `hfw_51_75`, `hfw_76_100` |
| `replacement_phonics` | `blends`, `digraphs`, `long_vowels_silent_e`/`long_vowels`, `vowel_teams`, `r_controlled_vowels`/`r_controlled` |
| `grammar_language` | `nouns`, `verbs`, `adjectives`, `prepositions_of_place`/`prepositions`, `plurals`, `prefixes_suffixes`/`prefix_suffix`, `antonyms_synonyms`, `homophones_homonyms`/`homophones` |

## Too Risky To Lazy-Load In Phase 5

These were intentionally not lazy-loaded:

- `initial_sounds`
- `final_sounds`
- `rhyming`
- `cvc_short_vowels`
- `short_vowel_discrimination`
- comprehension banks

Reason: these skills are heavily intertwined with current round selection, media enrichment, skill routing, checkpoint coverage, and runtime eligibility checks. The current assessment flow expects questions to be synchronously available before the student starts or resumes assessment work.

## Foundation Added

Created `src/data/loadAssessmentSkillBank.js` with:

- `getAssessmentSkillGroup(skillId)`
- `getAssessmentSkillGroupMetadata()`
- `getAssessmentSkillIdsForGroup(groupId)`
- `loadAssessmentSkillBank(skillId)`

The loader currently imports the same broad source banks and returns skill-filtered questions. It is deliberately conservative and does not change current runtime behavior.

Created `tools/checkAssessmentSkillBankLoader.js` with package script:

- `npm run check:assessment-bank-loader`

The validator checks active skill mapping, group coverage, HFW split bands, ghost skills, zero-question skills, and basic question-shape compatibility.

## Phase 6 Deferred Work

Recommended next step:

1. Extract the `App.jsx` `allQuestions` assembly into a runtime module with the same current behavior.
2. Add an assessment-bank loading state before assessment start.
3. Teach that runtime module to request one group at a time through `loadAssessmentSkillBank`.
4. Start with lower-risk groups: `hfw`, then replacement phonics, then grammar/language.
5. Keep early phonics and comprehension synchronous until round-selection and checkpoint flows have async smoke coverage.
6. Re-run the full assessment safety suite after each group split.

