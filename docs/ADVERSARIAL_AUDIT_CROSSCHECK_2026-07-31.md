# LiteracyPath adversarial-audit cross-check — 2026-07-31

**Purpose.** This record re-checks every finding in
`ADVERSARIAL_AUDIT_2026-07-31.md` against the current working tree and separates:

1. problems on the child-facing/runtime path now;
2. real defects that exist only in superseded data or tooling;
3. claims that are no longer correct; and
4. old data, questions, rules, and logic to remove permanently.

The original audit remains an immutable dated record. **For current action, this cross-check
supersedes it.**

## Bottom line

**The product is still not release-ready, but not for all the reasons stated in the original
audit.** The live assessment path is now v3 for all 30 skills. That retires several findings about
legacy banks. However, v3 is being published without human sign-off, contains current content and
media defects, and is checked by a verification layer that often still measures the legacy banks.

The most important current facts are:

- 30/30 skills are v3-published by `src/data/v3/v3Registry.js`.
- The v3 source contains 2,518 records: 2,149 regular candidates and 369 retention records.
- The regular student loader currently returns **2,049** records, not 2,518. A legacy HFW source
  rule silently rejects 100 otherwise-active v3 HFW questions.
- All 2,518 v3 records say `qaStatus: "approved"`; 0 record a reviewer and 0 record a human
  sign-off.
- Answer choices are shuffled before render. The original “nothing shuffles” headline is false for
  the current runtime.
- 68 current initial/final-sound pair items contain 248 cards. Although the cards do not store an
  `audioPath`, all 248 resolve approved word audio by label at runtime. The original missing-audio
  finding is false for the current runtime.
- The current v3 media binding still gives at least 498 of 1,649 image-bearing runtime questions a
  support image whose resolved key is neither the target, answer, nor a choice. This problem is
  live.
- `check:assessment-runtime-variation -- --check` exits 1 with 662 failures, while
  `check:assessment-question-integrity -- --check` exits 0 despite reporting blocked audio.
- The canonical curriculum board has been regenerated and now passes. `INDEX.md`, traceability
  rows, and the committed v3 gate report still state results that current checks do not reproduce.

## Method and scope

Observed against `HEAD 7d466885` plus the existing uncommitted v3/media worktree on 2026-07-31.
The working tree was already heavily modified, so this pass did not treat `HEAD` alone as product
truth. Runtime claims were tested through `loadAssessmentSkillBank()`, not by counting files.

The cross-check used four independent routes:

- imported every current runtime skill through `src/data/loadAssessmentSkillBank.js`;
- imported all raw v3 banks through `src/data/v3/v3Registry.js`;
- read the actual render preparation, policy, registry, and release-gate code; and
- ran focused checks and compared their exit status with their own reported findings.

This was not a browser usability pass and did not listen to every clip or visually inspect every
image. Media-key findings are mechanical; the worst image mismatches still need a human visual
spot-check before individual assets are removed.

Evidence labels used in this record: **observed** means directly read or produced by a named check;
**derived** means counted from the loaded/raw records with a stated rule; **inferred** means a
recommended consequence of those facts. Counts and exit statuses below are observed or derived.
Priority, deletion sequencing, and educational remediation are inferred recommendations and are
not represented as completed work.

## Corrected finding-by-finding verdict

| ID | Current verdict | Cross-check |
|---|---|---|
| C1 | **CONFIRMED, count corrected** | `HARD_GATES` still contains only G1–G5. All 30 status entries are cut over with G7 `pending-ben`. Raw v3 is 2,518 records; the regular loader exposes 2,049 after retention and source filtering, not 2,518. `qaStatus` is approved on 2,518/2,518; reviewed and signed-off provenance are both 0/2,518. |
| C2 | **RETIRED for current runtime** | `assessmentRoundController.js` shuffles `choices`, `answerOptions`, `imageCards`, `soundTiles`, and `letterTiles` before render. Initial-sound selection also uses a seeded shuffle. The loaded bank's stored answer-position distribution is 690/447/451/461 (33.7% in slot 0), and runtime preparation shuffles again. The old answer-first files remain in the legacy fallback graph and should be deleted, not repaired. |
| C3 | **LEGACY EXAMPLES RETIRED; CORE DEFECT PERSISTS IN V3** | The cited 279-row `finalSounds.generated.js` is not the current bank. Current runtime has 72 final-sound items. Of these, 28 use `ll`, `nd`, `nk`, `st`, `sk`, `ft`, or `lt`. Six keys are two-phoneme clusters and `ll` is a spelling, while the blueprint still defines the construct as isolating the final sound. Several spoken prompts explicitly say a word “ends with a sound” before expecting a two-letter ending. |
| C4 | **CONFIRMED, current counts corrected** | All 12 named audit scripts still contain no non-zero exit, thrown failure, or assertion. `auditAssessmentSkillIntegrity.js` reported one BLOCKER and exited 0. The strict curriculum audit reported 29/30 ready and 32 questions needed, then exited 0. `checkAssessmentQuestionIntegrity.js` reported 61 blocked-audio candidates in a direct run and still exited 0; its failure predicate omits that count. The checkpoint checker still tests its local `evaluateCheckpoint`, while production still sets `effectivePassed = passed` in three branches. |
| C5 | **PARTLY CONFIRMED; original live-gate claim corrected** | The 10 SQL behaviour files (3,560 lines) still have zero references from package scripts, tools, tests, app source, or CI. The vacuous `match()?.[0] || ""` assertions still exist. However, `check:db-policies` is now a release gate and runs `verifyDatabasePoliciesLive.mjs`, which queries the live catalogue and invokes live privacy checks. It is no longer correct to say release verification never touches a database. `check:live-database` remains separate, but the broader absence claim is retired. |
| H1 | **CONFIRMED** | `getMasteryRule()` still computes every configured pass score from the flat 70% default and overwrites the table value. Production checkpoint decisions still ignore coverage through `effectivePassed = passed`. The runner also uses `masteryRules` round lengths while `skillStatusPolicy` uses `blueprint.sitting`. |
| H2 | **RETIRED for current runtime** | The old field-level count confused stored media with effective media. Current pair cards resolve audio through `getApprovedCardAudioPath` / the approved word-audio resolver. All 248 cards in the 68 loaded initial/final pair items resolve an approved audio path. |
| H3 | **CONFIRMED** | The v3 lint still restricts similarity to `passage`/`sentence`, leaving prompt-led phonics banks invisible. The independent audit still reports 6,650 near-template pairs and exits 1. The production gate and independent audit therefore disagree about originality. |
| H4 | **RETIRED from child runtime; delete legacy bank** | `skillLevelGapQuestions.generated.js` is not returned for any of the 30 currently published skills. It is still imported by fallback loaders, shards, media inventories, and old audit tools. Its content defect remains real, but it is now a deletion problem, not a current child-content problem. |
| H5 | **CONFIRMED, count corrected** | In raw v3, 727 of 2,263 target-image rows have a resolved key outside `{targetWord, answer, choices}`. On the actual regular loader, 498 of 1,649 image-bearing questions still do. Examples still resolve prompt words such as `make`, `long`, and `silent` instead of the word being assessed. `imageAlt === prompt` on 775 loaded target-image questions. The original 621 count was not reproducible and must not be reused. |
| H6 | **CONFIRMED** | Cycle recommendations still select by a fixed level sequence, not cumulative decodability. Cycle 1 still recommends `bob-and-nan-01` and `first-facts-level-a-13-fruit`; the “A A-level” template remains; `Qu/qu` is still introduced in cycle 9 before `Cc` in 10 and `Kk` in 13. No cycle-aware decodability gate exists. |
| H7 | **PARTLY CONFIRMED** | The active 176-book shelf still has the measured A/B/C spread (A: 55, 46.7 average words; B: 76, 115.3; C: 45, 318.9, range 193–678). A runtime relevel function now demotes 12 undersized C/D/E source books to B, so the app no longer displays all raw D/E labels. The very wide B and C bands, template duplicates, and source-data mislabelling remain. |
| H8 | **CONFIRMED in v3; legacy file reference corrected** | The old `skillWordBank.generated.js` is not a runtime assessment source. However, v3 initial sounds still has separate `c` and `k` units for /k/, a `q` unit for /kw/, and the current `uniform` item keyed to `u` even though it begins /j/. This is a live v3 taxonomy/content defect. |
| H9 | **PARTLY CONFIRMED** | The generated lexicon is still consumed by the master lexicon and media registry. `above`, `glove`, `dove`, `ice`, and `eye` retain wrong silent-e/long-vowel metadata. The cited `badge`, `bridge`, and `fridge` examples have since been corrected. L-LEX only checks a unit when an approved mapping array exists: 227 current v3 target-word items use blend/vowel-team/r-controlled keys with no map, so absence still passes vacuously. |
| H10 | **RETIRED from child runtime** | The cited 138 broken rows remain in `secondBlockSkillTopUpQuestions.generated.js`, but the 30 current skills load v3 instead. Current runtime contains no “a adjective” string. V3 sentence-fit rows use authored sentences; adjective items deliberately offer adjective alternatives whose meaning is constrained by the sentence. Delete the old bank instead of rewriting it. |
| H11 | **PARTLY CONFIRMED** | `check:curriculum-board` now passes at 29 READY / 1 BLOCKED, so that part is fixed. `check:assessment-runtime-variation` still exits 1 with 662 failures; `checkCurriculumReleaseStandard.mjs` still exits 1 because its audited v2 IDs are absent from the v3 loader; TRACEABILITY A1.1/A1.2 still say DONE; `INDEX.md` still says runtime variation has 0 failures; and the committed assessment rebuild gate report still shows the old 9-column all-green form that current `gate.mjs` cannot reproduce with unsigned provenance. |
| M1 | **CONFIRMED** | All 525 v3 comprehension records still say grade K–2. Current text contains at least 108 records with the checked UK markers, and non-retention Level-1 theme passages average 48.9 words (max 55). Mechanical banding is still too broad; educational re-banding requires human review. |
| M2 | **CONFIRMED** | No product locale constant or content fork exists. US and UK spellings/vocabulary still coexist in active books and v3 content. |
| M3 | **CONFIRMED, count corrected** | A conservative approved-word reconstruction found 39 ambiguous cloze rows in the regular runtime loader (47 including retention). Examples include `__op`, `__ick`, `m__t`, and the two opposite-key `sh__t` items. The original 38/148 denominator was not reproduced and should be retired. |
| M4 | **RETIRED from child runtime** | The cited 101 legacy CVC picture rows are not current. V3 CVC picture-match targets are mostly concrete nouns such as pan, bat, pen, net, pig, fin, pot, and log. This does not validate every picture, but the original dataset finding no longer describes the current bank. |
| M5 | **RETIRED from child runtime** | V3 has exactly 25 units in each HFW band and no `likelyAmbiguous` or `cartoonImageNeeded` flags. The old 23/32/22/23 bands and 500 review-marked sentence rows belong to legacy sources. A separate live issue remains: the legacy source filter removes 25 active v3 rows per HFW band. |
| M6 | **PARTLY CONFIRMED** | The 600 old HFW image requests are not current v3 content. Story Quest still has 313 page rows with `narrationNeedsRebuild: true`, and both the read-aloud policy and player suppress narration for those pages. |
| M7 | **CONFIRMED** | `checkDetailedReportDataContracts.js` still exits 1 with 13 failures and is referenced by no package script, release gate, test, or CI workflow. |
| M8 | **NOT PROVEN AS A DELETION SET** | The old count of 378 unreferenced exports is a lexical heuristic and explicitly includes entry points. It is evidence for investigation, not sufficient evidence to delete code. Keep this out of the permanent-delete queue until import-graph and bundler checks classify each symbol. |
| L1 | **CONFIRMED** | `BLEND_DIGRAPHS` still includes `nk` and `qu`, although both represent two phonemes in this context. |
| L2 | **CONFIRMED, current runtime count** | 775 loaded v3 target-image questions use the prompt as image alt text. |
| L3 | **CONFIRMED** | `moonwood-tales-c-01` and `moonwood-tales-c-24` still carry 129 and 109 word-dump `targetSkills` entries respectively. |
| L4 | **CONFIRMED but intentionally inactive** | `initialSoundWordBank.js` still contains 65 inactive rows. They are not served, but their exclusion knowledge is useful until migrated to a shared blocked-target list. |
| L5 | **CONFIRMED** | `checkSkillProgression.js` declares `warnings = []`, never pushes to it, and reports its length. |
| L6 | **RETIRED** | `playwright.quest.config.js` now exists and points to `tests/browser`; the package-script config targets checked in this pass exist. The original missing-runner claim is stale. |

## Remaining release problems, in current priority order

### P0 — Stop unsigned v3 publication

`gate.mjs` now treats G6 and G7 as hard gates, but the generated status is older and the runtime
registry only enforces G1–G5. The gate can say “not ready” while the loader says “published.” That is
the live bypass.

Required correction:

1. Make the runtime consume the current gate's full hard-gate set, including G6 and G7.
2. Fail closed on a missing gate, wrong type, old status version, or unsigned provenance.
3. Replace default `qaStatus: "approved"` with `draft`; only a review/sign-off operation may write
   approved.
4. Decide explicitly what children receive before sign-off. Do not silently fall back to the old
   banks listed for deletion below.

### P0 — Make verification inspect the v3 child population

The current loader and current validators have different universes:

- runtime: v3 banks for 30/30 skills;
- `sourceOfTruthRegistry`: still calls legacy HFW, grammar, early-phonics, and replacement files
  “active runtime files”;
- `phonicsRuntimeUtils` and several audit scripts still load legacy banks directly;
- the old curriculum release standard compares v2 audited IDs with v3 runtime IDs and fails by
  construction;
- some audit scripts find blockers but cannot return failure.

Required correction: create one exported `loadPublishedAssessmentPopulation()` boundary and require
every release/content/media audit to consume it. Remove direct bank imports from release checks.
Then add a meta-test that deliberately injects one defect into a fixture and proves each check
returns non-zero.

### P0 — Correct v3 educational content before sign-off

The following are current child-facing defects:

- 28/72 final-sound rows assess clusters or spelling under a single-sound construct;
- separate `c` and `k` mastery units assess the same /k/ sound, while `q` represents /kw/ and
  `uniform` is wrongly keyed to `u`;
- at least 39 regular-runtime cloze rows allow more than one real word;
- 6,650 near-template pairs are visible to the independent audit but not the publication gate;
- 525 comprehension rows are all labelled K–2 despite large differences in language demand;
- 227 target-word phonics rows bypass L-LEX because their pattern has no approved mapping.

These should be fixed in the v3 authoring sources and regenerated. Do not patch generated bank files
directly.

### P0 — Correct v3 support media and accessibility text

At least 498 loaded image-bearing questions resolve a support key unrelated to the target, answer,
or choices. The generator's fallback explicitly searches prompt/passage words, which produces the
wrong-image mechanism. In addition, 775 loaded rows use the prompt as alt text.

Required correction: a support image must be explicitly authored, derived from the target/answer,
or absent. A generic decorative image must not be used as assessment evidence. Add a fail-closed
runtime test over the actual loaded population.

### P0 — Restore one mastery decision

Three independent conflicts remain:

- configured pass scores versus the flat 70% overwrite;
- runner round length versus `blueprint.sitting`;
- displayed coverage versus `effectivePassed = passed`.

Choose one policy module and make the runner, checkpoint, class report, and student report import it.
Delete the duplicate constants after the decision is pinned by unit tests.

### P0 — Execute the SQL behaviour tests

The live catalogue/policy gate is real and should be preserved. It does not replace the 10 orphaned
transactional SQL behaviour suites. Wire `tests/sql/*.sql` into a seeded disposable-database gate,
then keep both layers: catalogue/security exposure and behavioural isolation/deletion tests.

### P1 — Repair Guided Reading alignment

Recommendations still ignore cumulative code knowledge, the shelf still has very wide bands, and
locale is mixed. Add a cycle-aware decodability score, declare a locale, and make level bounds a
checked standard. Preserve the runtime relevel safeguard until source labels are corrected.

### P1 — Restore Story Quest narration or remove the promise

All 313 Story Quest page rows remain marked for narration rebuild, so read-aloud is suppressed on
the whole surface. This is a current product decision disguised as a temporary flag.

### P1 — Repair the active lexicon rather than deleting it

`kimiVocabulary500Lexicon` is not obsolete: it feeds the master lexicon and media registry. Correct
the remaining heuristic phonics tags and make reviewed mappings authoritative. Do not delete the
lexicon wholesale.

## Permanent deletion register

“Permanent delete” below means remove the code/data and all dependent generators, registries,
inventories, tests, and documentation references in one verified change. It does **not** mean leave
an archive import or silent fallback.

### DELETE-1 — Legacy assessment fallback graph

**Status: MARKED FOR PERMANENT DELETION after the P0 publication decision.**

The current product selects v3 for every skill. The old fallback is now dangerous: it is where the
answer-position bias, bad final-sound items, filler comprehension, broken grammar items, old HFW
bands, and unpicturable CVC items live. Keeping it as an automatic fallback means fixing the v3
sign-off bypass could re-expose known-bad content.

Delete together:

- `EXPANSION_BANK_LOADERS`, `DYNAMIC_BANK_LOADERS`, legacy publication/exposure handling, and
  `loadQuestionBanksForSkill()` from `src/data/loadAssessmentSkillBank.js`;
- the legacy `assessmentReleaseStatus.generated.js` and
  `assessmentReleaseExposure.generated.js` contract after v3 becomes the only publication owner;
- all legacy bank modules loaded by those arrays: `masteryCoreQuestions`, `masteryExtraQuestions`,
  `*CoverageQuestions`, `contentExpansionPass3Questions`, `targetedContentRecoveryQuestions`,
  `kimiDataset7RuntimeQuestions`, `ixlStyleSeedQuestions`, `safeContentExpansionQuestions`,
  `templateQuestions`, `templateExpansion*`, `questionBankExpansion8/10/11/12/13/14`, `qbAssess_*`,
  `qbFillGaps`, `generatedQuestions`, `fixSentenceQuestions`,
  `templateComprehensionAdvanced`, and the legacy generated/runtime-shard banks;
- generators, workbook importers, media inventories, and audit tools whose only output or input is
  that deleted population.

**Deletion gate:** with the legacy directory/modules temporarily unavailable, every active skill
must either load its approved v3 bank or fail closed with zero questions. No runtime or release check
may import a deleted bank.

### DELETE-2 — Specifically condemned legacy generated banks

**Status: MARKED FOR PERMANENT DELETION with DELETE-1; do not repair.**

- `src/data/generated/skillLevelGapQuestions.generated.js` and `runtimeShards/skill-gap.*`;
- `src/data/generated/secondBlockSkillTopUpQuestions.generated.js`;
- `src/data/generated/finalSounds.generated.js`;
- `src/data/generated/rhyming.generated.js` and legacy rhyming shards;
- `src/data/generated/cvc.generated.js`;
- `src/data/generated/shortVowel.generated.js`;
- old HFW generated banks/shards, including the 23/32/22/23 band and ambiguous-sentence sources.

These contain verified defects and have no place as emergency fallback content.

### DELETE-3 — Stale source-of-truth declarations

**Status: MARKED FOR PERMANENT DELETION NOW.**

Remove the `hfw`, `grammar`, `earlyPhonics`, and `assessmentReplacements` legacy `activeRuntimeFiles`
claims from `sourceOfTruthRegistry.js`. Replace them with the v3 registry output. The current labels
are factually false and cause checks to audit old banks while the child loader serves v3.

Also remove the old HFW source/format rule from the v3 path. It currently blocks 100 active v3 HFW
records after the v3 gate has approved the bank. If direct recognition is intentionally forbidden,
make that a v3 blueprint/gate rule so invalid rows can never be published.

### DELETE-4 — Standalone skill-word-bank assessment pipeline

**Status: MARKED FOR PERMANENT DELETION after confirming no external workbook workflow remains.**

`src/data/generated/skillWordBank.generated.js` has no app runtime consumer; current references are
import/generation/audit utilities. Its assessment taxonomy is known-bad and v3 owns assessment
content. Remove the generated file plus `importSkillWordBankWorkbook.js`,
`auditSkillWordBankWorkbook.js`, and `prioritizeWorkbookMediaNeeds.js` if no non-assessment workflow
still needs them.

Do not delete the reviewed exclusion knowledge in `initialSoundWordBank.js`. First move it into a
shared blocked-target/pronunciation source used by v3, then remove the 65 inactive payload rows.

### DELETE-5 — Fake checkpoint checker

**Status: MARKED FOR PERMANENT DELETION NOW.**

Delete the local `evaluateCheckpoint()` in `tools/checkCheckpointCoverage.js`. Extract/import the
production decision function and run the existing scenarios against it. A checker-only
implementation is not a second implementation to maintain.

### DELETE-6 — Permanently red orphan report checker

**Status: MARKED FOR PERMANENT DELETION NOW unless repointed in the same change.**

`tools/checkDetailedReportDataContracts.js` asserts UI ownership that moved in the teacher overhaul,
fails 13 assertions, and is invoked by nothing. Delete it, or rewrite it against the current report
owner and add it to a real gate. Leaving it orphaned is not an option.

### DELETE-7 — Duplicate mastery constants

**Status: DECISION REQUIRED, THEN PERMANENTLY DELETE ONE SIDE.**

The repository cannot retain both tuned `masteryRules.passScore` values and an unconditional 70%
overwrite, nor both per-skill round lengths and `blueprint.sitting`. After the owner chooses the
standard, delete the losing values and all explanatory comments that describe them as active.

### KEEP — not deletion candidates

- `kimiVocabulary500Lexicon.js`: active input; repair metadata.
- `initialSoundWordBank.js` reviewed exclusion rationales: migrate and preserve as rules.
- `verifyDatabasePoliciesLive.mjs` and `check:db-policies`: real live verification; preserve.
- the original dated audit: preserve as history and mark superseded for action.
- the 378-export list: investigate; do not mass-delete from a text-reference count.

## Documentation corrections required

1. Mark this document as the current cross-check in `docs/INDEX.md` and link the original audit to
   this record in the Superseded section.
2. Remove or regenerate the stale “runtime variation = 0” paragraph in `INDEX.md`.
3. Reopen TRACEABILITY A1.1 and A1.2 while their named checks are red against v3.
4. Regenerate the v3 gate report from current `gate.mjs`; unsigned skills must be red.
5. Keep the regenerated curriculum board: its current 29 READY / 1 BLOCKED result is reproducible.

## Verification evidence from this cross-check

| Check | Observed result | What it proves |
|---|---|---|
| Import all 30 `loadAssessmentSkillBank()` results | 30/30 source only `skills_rebuild_v3_2026_08`; 2,049 regular rows total | Current child loader uses v3, not legacy banks. |
| Import all raw v3 banks | 2,518 total; 369 retention; 2,518 approved; 0 reviewed; 0 signed | Corrects C1's “served” count while confirming the sign-off bypass. |
| Option/card audio reconstruction | 68 pair items; 248/248 cards resolve approved audio | Retires H2. |
| Current answer-position count | 690/447/451/461 before runtime shuffle | Retires C2's 96% current-runtime claim. |
| `check:assessment-runtime-variation -- --check` | **exit 1**, 662 failures | Current runtime/media variation is red. |
| `check:assessment-question-integrity -- --check` | **exit 0** while its report lists blocked audio | Confirms the incomplete failure predicate. |
| `auditAssessmentSkillIntegrity.js` | **exit 0**, one BLOCKER | Confirms non-failing audit behaviour and legacy-population drift. |
| `auditAllSkillsStrictProductionReadiness.js` | **exit 0**, 29/30 ready, 32 questions needed | Confirms strict-curriculum cannot enforce its own result. |
| `check:assessment-preload-coverage` | **exit 0** with legacy HFW rows showing zero relevant preloads and `true` | Confirms vacuous coverage logic remains. |
| `checkCheckpointCoverage.js` | **exit 0** against checker-local logic | Does not validate production checkpoint decisions. |
| `checkCurriculumBoard.mjs` | **exit 0**, 29 READY / 1 BLOCKED | The curriculum-board portion of H11 is fixed. |
| `checkCurriculumReleaseStandard.mjs` | **exit 1**, v2 audited IDs absent from v3 loader | Confirms release-document/standard drift. |
| Independent v3 audit | **exit 1**, not release ready, 6,650 near-template pairs, 0 sign-offs | Confirms C1/H3 independently. |
| `checkDetailedReportDataContracts.js` | **exit 1**, 13 failures, no caller | Confirms M7. |
| SQL reachability search | 10 files / 3,560 lines / zero runners | Confirms the remaining part of C5. |

## Exit condition for a future clean audit

A replacement audit may call the assessment system release-ready only when:

- unsigned v3 banks load zero questions;
- one published-population API is used by runtime and every gate;
- every release check has a demonstrated red fixture;
- current v3 content/media defects above are zero on the actual loaded population;
- mastery and reporting share one decision policy;
- SQL behaviour tests and live database policy checks both pass;
- stale status documents are generated from those same checks; and
- human educational, image, audio, locale, and accessibility review is recorded in provenance.
