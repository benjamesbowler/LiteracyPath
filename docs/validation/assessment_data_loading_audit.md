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

## Phase 6 Conservative Safety Audit

Generated: 2026-06-02

Phase 6 was kept audit-first. No live assessment-bank lazy loading was added in this phase, and early phonics runtime selection was intentionally left untouched.

### 1. Safe candidate groups

These groups remain the safest candidates for future lazy loading because they have clearer skill boundaries and less custom round-selection behavior than early phonics:

- HFW banks:
  - `hfw_1_25`
  - `hfw_26_50`
  - `hfw_51_75`
  - `hfw_76_100`
- Replacement phonics banks:
  - `blends`
  - `digraphs`
  - `long_vowels_silent_e` / runtime alias `long_vowels`
  - `vowel_teams`
  - `r_controlled_vowels` / runtime alias `r_controlled`

These are still not lazy-loaded in Phase 6. The recommendation is to lazy-load only one isolated group after a runtime smoke test is available.

### 2. Unsafe / deferred groups

These groups should remain eager/synchronous for now:

- `initial_sounds`
- `final_sounds`
- `rhyming`
- `cvc_short_vowels`
- `short_vowel_discrimination`
- comprehension:
  - `sentence_comprehension`
  - `key_details`
  - `sequencing`
  - `main_idea`
  - `inference`
  - `cause_effect`
  - `context_clues`
  - `theme_higher_comprehension`

### 3. Reason for deferring early phonics

Early phonics uses generated banks, runtime eligibility, phase metadata, adaptive selection, media resolution, repeat prevention, coverage keys, and progression checks. It must stay eager/synchronous for now.

In particular:

- Initial Sounds uses a custom selector and level-aware word-bank planning.
- Final Sounds has Level 1 purity checks plus mastery-depth requirements before Level 2 unlocks.
- Rhyming depends on image-card purity, rime-family coverage, and repeat guards.
- CVC Short Vowels and Short Vowel Discrimination depend on short-vowel media enrichment, phase metadata, and runtime format filtering.

Moving these to async group loading before a dedicated assessment bootstrap would risk blank rounds, wrong phase selection, or incorrect checkpoint behavior.

### 4. Current eager imports still present

`src/App.jsx` still eagerly imports and assembles the main runtime assessment pool.

| Chunk/source family | Current eager imports |
| --- | --- |
| generated-early-skills | `generatedEarlySkillQuestions` from `./data/generated/earlySkillQuestions.generated.js` |
| question-bank-extra | `questionBankExpansion8`, `questionBankExpansion9`, `questionBankExpansion10`, `questionBankExpansion11`, `questionBankExpansion12`, `questionBankExpansion13`, `questionBankExpansion14`, plus `generatedQuestions`, `templateExpansion*`, `qbAssess_*`, `qbFillGaps`, and compatibility banks |
| audio-manifest | No static top-level import in `App.jsx`; still available as a dynamic chunk through `import("./data/audioManifest")` |
| replacement banks | `blendsAssessmentQuestions`, `digraphsAssessmentQuestions`, `longVowelsAssessmentQuestions`, `vowelTeamsVarietyQuestions`, `grammarAssessmentQuestions`, `skillLevelGapQuestions` |
| HFW banks | `qbAssess_hfw1`, `qbAssess_hfw2`, `hfwAssessmentQuestions`, `hfwLevel2Questions` |

`src/data/loadAssessmentSkillBank.js` also imports the same broad source banks so the Phase 5/6 validation path can prove group resolution without changing runtime behavior.

### 5. Recommended Phase 7 plan

The smallest next safe lazy-loading target is the `hfw` group, but only after a runtime smoke test exists for:

- starting an HFW 1-25 round
- starting an HFW 26-50 round
- starting an HFW 51-75 round
- starting an HFW 76-100 round
- completing a Level 1 HFW checkpoint
- completing a Level 2 HFW letter-build checkpoint

Recommended Phase 7 sequence:

1. Extract the current `App.jsx` question-pool assembly into a runtime module without changing behavior.
2. Add an explicit assessment-bank loading state before a round starts.
3. Lazy-load only the `hfw` group first.
4. Compare loader counts and runtime-selected rounds before and after.
5. Keep `early_phonics` and `comprehension` eager until async selection has dedicated smoke coverage.

## Phase 7 HFW Runtime Smoke Test

Generated: 2026-06-02

Phase 7 stayed conservative. No live assessment startup or runtime selection behavior was changed.

### What changed

- Added `tools/checkHfwRuntimeSmoke.js`.
- Added package script `npm run check:hfw-runtime-smoke`.
- Added `docs/validation/hfw_runtime_smoke_check.md`.
- Added an isolated `loadHfwAssessmentBank(skillId)` helper in `src/data/loadAssessmentSkillBank.js`.
- Strengthened `tools/checkAssessmentSkillBankLoader.js` with HFW-specific validation.

### HFW smoke coverage

The new smoke test verifies all four active HFW bands:

- `hfw_1_25`
- `hfw_26_50`
- `hfw_51_75`
- `hfw_76_100`

For each band, it checks:

- current selectable runtime path resolves questions
- Level 1 image-context cloze questions are available
- Level 2 letter-build questions are available
- each level can sample a 15-question round
- no selectable HFW runtime question has `audioPath`, `audioUrl`, `audioText`, or `spokenPrompt`
- no selectable HFW runtime question uses speaker/audio/listen formats
- `disableAudio: true` is preserved
- active HFW skill ids stay in the four-band model
- legacy `hfw_51_100` is not active

### HFW runtime counts from smoke test

| Skill | Raw loader | Runtime pool | Selectable HFW runtime | Level 1 | Level 2 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `hfw_1_25` | 278 | 218 | 60 | 30 | 30 |
| `hfw_26_50` | 279 | 219 | 60 | 30 | 30 |
| `hfw_51_75` | 92 | 92 | 92 | 46 | 46 |
| `hfw_76_100` | 92 | 92 | 92 | 46 | 46 |

The raw loader still sees older legacy/listen HFW rows for the lower bands. The selectable runtime path correctly filters those out and keeps only `HFW_IMAGE_CONTEXT_CLOZE` and `HFW_LETTER_BUILD`.

### Lazy-loading status

Actual runtime lazy loading was deferred.

Reason: switching HFW to async runtime loading would still require changing the assessment startup path in `App.jsx`. This phase intentionally avoided that. The new `loadHfwAssessmentBank()` helper is readiness-only and is not wired into student assessment startup.

### Why early phonics remains untouched

Early phonics is still the highest-risk assessment area for async loading because it uses custom selectors, phase/depth progression, media eligibility, coverage tracking, and repeat guards. Phase 7 did not touch:

- `initial_sounds`
- `final_sounds`
- `rhyming`
- `cvc_short_vowels`
- `short_vowel_discrimination`

### Why comprehension remains untouched

Comprehension banks are large and quality-sensitive, and they share replacement-bank routing with higher skill validation. They remain eager until the assessment runtime has a broader async bootstrap and smoke coverage.

### Phase 8 recommendation

Phase 8 should extract the current `App.jsx` question-pool assembly into a runtime module with identical synchronous behavior first. After that, HFW can be switched to an async group-loaded path behind the new smoke test, with before/after count comparisons.
