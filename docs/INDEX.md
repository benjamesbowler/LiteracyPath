# LiteracyPath docs — index

465 markdown files, 1,686,741 words, all written between 2026-06-05 and today. That is
roughly 6,750 printed pages. Nobody can read it end to end, including the agents that
wrote most of it. This page exists so you never have to.

**The one rule that keeps this useful:** a doc is either a *standard* (says how things
must be, stays true, gets edited in place) or a *record* (says what happened on a date,
never gets edited again). Standards are listed first below. Everything else is a record.
When a record and a standard disagree, the standard wins.

---

## Start here

If you read five things, read these.

| File | What it gives you |
| --- | --- |
| [OPERATING_MANUAL](OPERATING_MANUAL.md) | How the product is built and run. The closest thing to a constitution. Long — the [quick reference](OPERATING_MANUAL_quickref.md) is the one-page version. |
| [PRODUCT_VISION](architecture/PRODUCT_VISION.md) | What the app is for, in half a page. |
| [instructional_standards](instructional/instructional_standards.md) | The teaching rules everything else has to satisfy. |
| [FULL_APP_CRITIQUE_2026-07-23](FULL_APP_CRITIQUE_2026-07-23.md) | The most complete honest assessment of what was wrong. Its **measured** findings are now largely closed — see *Where things stand*. Read it for the reasoning, not the current numbers. |
| [TEN_OUT_OF_TEN_PLAN_2026-07-23](TEN_OUT_OF_TEN_PLAN_2026-07-23.md) | The plan that answers it, and the rule that governs "done". Live status is in [release/TRACEABILITY](release/TRACEABILITY.md). |

---

## Standards — how things must be

These stay true. Edit them in place when a decision changes; do not write a new dated
file to overrule one.

**Teaching and content**

- [instructional/instructional_standards](instructional/instructional_standards.md) — the teaching rules
- [instructional/LiteracyPath_Phonics_Question_Model_Framework_v1](instructional/LiteracyPath_Phonics_Question_Model_Framework_v1.md) — how a phonics question is shaped
- [design/LEARNING_POLICY](design/LEARNING_POLICY.md) — what counts as evidence of learning
- [design/ASSESSMENT_MEDIA_EVIDENCE](design/ASSESSMENT_MEDIA_EVIDENCE.md) — why assessment media is evidence, not decoration
- [EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21](EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21.md) — the benchmark suite and what it aligns to
- [guided-reading/INDEX](guided-reading/INDEX.md) — the levelled-book system
- [STORY_QUEST_REWRITE_2026-07-26](STORY_QUEST_REWRITE_2026-07-26.md) — the Story Quest band ceilings and authoring rules

**What the child sees**

- [design/CHILD_SURFACE_RULES](design/CHILD_SURFACE_RULES.md) — rules for every child-facing screen
- [design/STUDENT_EMPHASIS_BUDGET](design/STUDENT_EMPHASIS_BUDGET.md) — how much visual shouting is allowed
- [LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM](LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM.md) — the child-area design system
- [LITTLE_LITERACY_GUIDES_BRAND_DECISION_2026-07-22](LITTLE_LITERACY_GUIDES_BRAND_DECISION_2026-07-22.md) — why the child area is branded separately
- [architecture/Child_Learning_Experience_Layer](architecture/Child_Learning_Experience_Layer.md) — the child experience in full

**What the teacher sees**

- [APP_COPY_STANDARD_2026-07-25](APP_COPY_STANDARD_2026-07-25.md) — plain words everywhere; teacher surfaces use student/assessment. Enforced by `tools/checkAppCopy.js`.
- [teacher/UI_PRIMITIVES](teacher/UI_PRIMITIVES.md) — the components teacher screens are built from
- [teacher/STATE_MATRIX](teacher/STATE_MATRIX.md) — every teacher surface in every state
- [teacher/PARITY_MATRIX](teacher/PARITY_MATRIX.md) — capabilities that must survive any refactor
- [teacher/CLASS_ENTRY](teacher/CLASS_ENTRY.md) — explicit login class choice and first-class creation contract
- [teacher/CLASS_PROGRESS](teacher/CLASS_PROGRESS.md) — the class-first progress contract
- [teacher/ASSESSMENT_EVIDENCE](teacher/ASSESSMENT_EVIDENCE.md) — why assessment records are immutable
- [architecture/teacher_assessment_ux_review_v1](architecture/teacher_assessment_ux_review_v1.md) — the assessment module in full

**Evidence and research** — the pack you would hand a school or an academic

- [research/README](research/README.md) — start of the expert-review and pilot pack
- [research/MEASUREMENT_PLAN](research/MEASUREMENT_PLAN.md) · [research/CALIBRATION_PROTOCOL](research/CALIBRATION_PROTOCOL.md) · [research/DATA_DICTIONARY](research/DATA_DICTIONARY.md)
- [research/PILOT_PROTOCOL](research/PILOT_PROTOCOL.md) · [research/CONSENT_AND_ASSENT_TEMPLATES](research/CONSENT_AND_ASSENT_TEMPLATES.md) · [research/EXPERT_REVIEW_PROTOCOL](research/EXPERT_REVIEW_PROTOCOL.md)
- [research/RECURRING_OBSERVATION_PROGRAM](research/RECURRING_OBSERVATION_PROGRAM.md) · [research/REVISION_WORKFLOW](research/REVISION_WORKFLOW.md)

**Legal and privacy** — the pack you would hand a procurement officer

- [legal/README](legal/README.md) — start of the legal and procurement pack
- [legal/PRIVACY_POLICY](legal/PRIVACY_POLICY.md) · [legal/TERMS_OF_SERVICE_DRAFT](legal/TERMS_OF_SERVICE_DRAFT.md) · [legal/DATA_PROCESSING_ADDENDUM_DRAFT](legal/DATA_PROCESSING_ADDENDUM_DRAFT.md)
- [legal/REGION_MATRIX](legal/REGION_MATRIX.md) — which education-privacy law applies where
- [legal/SCHOOL_PARENT_CONSENT_MATERIALS](legal/SCHOOL_PARENT_CONSENT_MATERIALS.md) · [legal/SUBPROCESSORS](legal/SUBPROCESSORS.md) · [legal/SECURITY_SUMMARY](legal/SECURITY_SUMMARY.md)
- [legal/INCIDENT_RESPONSE](legal/INCIDENT_RESPONSE.md) · [legal/LEADERBOARD_PRIVACY](legal/LEADERBOARD_PRIVACY.md) · [legal/ACCESSIBILITY_STATEMENT_DRAFT](legal/ACCESSIBILITY_STATEMENT_DRAFT.md)
- [legal/COUNSEL_REVIEW_CHECKLIST](legal/COUNSEL_REVIEW_CHECKLIST.md) — what a real lawyer still needs to look at
- [legal/LEGAL_DEPLOYMENT_FACTS](legal/LEGAL_DEPLOYMENT_FACTS.md) — open decisions, not yet settled

**Running it**

- [ops/RECOVERY_RUNBOOK](ops/RECOVERY_RUNBOOK.md) · [ops/RETENTION_RUNBOOK](ops/RETENTION_RUNBOOK.md) · [ops/DATA_RIGHTS_RUNBOOK](ops/DATA_RIGHTS_RUNBOOK.md)
- [ops/ERROR_MONITORING](ops/ERROR_MONITORING.md) · [ops/ERROR_BUDGET](ops/ERROR_BUDGET.md)
- [security/DEPENDENCY_EXCEPTIONS](security/DEPENDENCY_EXCEPTIONS.md)
- [accessibility/MANUAL_AUDIT_PROGRAM](accessibility/MANUAL_AUDIT_PROGRAM.md) · [accessibility/ROUTE_STATE_INVENTORY](accessibility/ROUTE_STATE_INVENTORY.md)
- [admin/account_management_and_password_reset_notes](admin/account_management_and_password_reset_notes.md)

**The Sound Seekers game** — its own world, with its own bible

- [SOUND_SEEKERS_RELEASE_BIBLE](SOUND_SEEKERS_RELEASE_BIBLE.md) — the standard
- [SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX](SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md) — which mechanic teaches which skill
- [GAME_CURRICULUM_FRAMEWORK_2026-07-06](GAME_CURRICULUM_FRAMEWORK_2026-07-06.md) — shared difficulty framework across all games
- [SOUND_SEEKERS_WORLD_V2_BLUEPRINT](SOUND_SEEKERS_WORLD_V2_BLUEPRINT.md) · [3D_ASSET_LIBRARY](3D_ASSET_LIBRARY.md) · [SOUND_SEEKERS_3D_ASSET_NOTICES](SOUND_SEEKERS_3D_ASSET_NOTICES.md)

**How work gets done**

- [IMPROVEMENT_LOOPS](IMPROVEMENT_LOOPS.md) — the loop method these docs come out of
- [implementation/roadmap](implementation/roadmap.md) — what is planned
- [implementation/KIMI_CONTEXT](implementation/KIMI_CONTEXT.md) — context handed to the media agent
- [COMPETITOR_NOTES](COMPETITOR_NOTES.md) — who else is in this market
- [OPEN_SOURCE_REPOS](OPEN_SOURCE_REPOS.md) — libraries worth pulling in

---

## Where things stand

**Release status, measured 2026-07-28** — from [release/TRACEABILITY](release/TRACEABILITY.md),
not from memory:

| | Count |
| --- | ---: |
| Planned items (A1.1 – A10.10) | 100 — **90 DONE**, 6 EXTERNAL-READY, 4 IN-PROGRESS |
| Discovered items (D-###) | 151 — **75 DONE**, 76 IN-PROGRESS |
| **Total** | **251 rows, 165 closed, 86 open** |

Open: `A6.1` (audit-school seed in CI), `A6.9` (production-reachable teacher state
matrix), `A10.1` (whole-product CI release job), and `A10.4` (bundle budgets) are
IN-PROGRESS. `A1.10`, `A4.10`, `A8.2`, `A8.10`, `A10.8`, `A10.10` are
EXTERNAL-READY — built and waiting on outside review, which is **not** the same as
closed. D-076 through D-151 are IN-PROGRESS in the current teacher remediation:
their focused implementations exist, but final integrated, fresh-database,
authenticated browser, and adversarial evidence is still pending.

The critique's earlier measured findings were reported fixed on 2026-07-27, but that status is no
longer current. The 2026-07-31 [adversarial-audit cross-check](ADVERSARIAL_AUDIT_CROSSCHECK_2026-07-31.md)
ran the current v3 population and found `check:assessment-runtime-variation` red with **662
failures**. Treat the cross-check as the current assessment-content status.

**But green gates are not a working product, and this repo has now proved it twice.**
The Ten-Out-Of-Ten plan's own first rule says a task is DONE only when its gate passes
against the *reachable* product — "a check that greps source strings proves nothing".
On 2026-07-26 and 2026-07-27, with every gate green, four defects were found by opening
the app: Present rendered **zero** images and **zero** audio on every slide; the Archive
Student button failed silently; the info tooltips were never hidden at all; and the only
end-to-end archive test asserted copy that had not existed since a rename, so it could
not have been passing. Treat a passing gate as necessary, never sufficient.

**2026-07-27 added a third proof, and a worse one.** Deleting a child failed in
production for every teacher, because the migration creating
`teacher_prepare_learner_deletion` had never been applied to the hosted database —
while `check:learner-data-rights` stayed green throughout, because it reads the
migration *file*. `npm run check:live-database` now asks the running database
instead. A source-text check and a deployment check are different claims, and only
one of them is about the product.

Newest first. These are records — they describe a moment, and the moments accumulate.

| Date | Record | What happened |
| --- | --- | --- |
| 2026-07-31 | [ADVERSARIAL_AUDIT_CROSSCHECK_2026-07-31](ADVERSARIAL_AUDIT_CROSSCHECK_2026-07-31.md) | Re-checked every adversarial-audit finding against the current v3 runtime; separates live release defects from retired legacy claims and marks obsolete data, rules, and checker logic for permanent deletion |
| 2026-07-30 | [GROUP_GUIDED_READING_IMPLEMENTATION_PLAN_2026-07-30](GROUP_GUIDED_READING_IMPLEMENTATION_PLAN_2026-07-30.md) | Synced-iPad Group Guided Reading planned end to end: the 07-27 spec's anchors re-verified after the teacher/kids rebuilds, four build phases with named gates, hosted-DB deploy runbook; spec imported as [SYNCED_GUIDED_READING_SPEC_2026-07-27](SYNCED_GUIDED_READING_SPEC_2026-07-27.md) — nothing implemented yet |
| 2026-07-29 | [KIDS_EXPERIENCE_SHIP_PASS_2026-07-29](KIDS_EXPERIENCE_SHIP_PASS_2026-07-29.md) | Child hubs made full-width and one-screen; map made forward-only Meadow→Dino→Moonwood; persistent book-character Little Literacy Guide, structured library, teacher class-entry gate and Beastie nook shipped |
| 2026-07-29 | [KIDS_REDESIGN_PLAN_2026-07-29](KIDS_REDESIGN_PLAN_2026-07-29.md) | Kids-side redesign accepted (7 screens, liquid glass, rail→bottom tabs, fixed 1194×834 stage); prototype in `mockups/design-handoff-kids-side/`; six-phase plan |
| 2026-07-29 | [rounded_atomic_v23](assets/rounded_atomic_v23_2026-07-29.md) | V22 reconciled at 4 Yes, 4 Needs edit and 5 No; A, NG, T and Y were installed to eight runtime files, while the remaining nine sounds received new natural sources, physically extended pure sounds or rounded tails |
| 2026-07-29 | [app_wide_phoneme_audio_mapping](assets/app_wide_phoneme_audio_mapping_2026-07-29.md) | One reviewed phoneme resolver now serves Sound Seekers, Arcade, assessment, teacher, student, guided-reading and EL Quest sound prompts; 69 legacy grapheme files and eight unresolved runtime files were physically deleted, with missing sounds forced silent |
| 2026-07-29 | [manually_tightened_atomic_v22](assets/manually_tightened_atomic_v22_2026-07-29.md) | V21 reconciled at 6 Yes, 11 Needs edit and 3 No; six approved sources resolved seven sounds and installed to 12 runtime files, while 13 unresolved sounds received physically tightened boundaries in a new review form |
| 2026-07-29 | [reviewed_leda_atomic_v21](assets/reviewed_leda_atomic_v21_2026-07-29.md) | Both V20 reviews reconciled; 24 approved same-Leda phonemes plus the approved `ou` repair were installed to 45 live runtime files, and the remaining 20 sounds received source-word cuts or alternate prompts in a new human-ear form |
| 2026-07-29 | [consistent_leda_atomic_v20](assets/consistent_leda_atomic_v20_2026-07-29.md) | V18 reconciled at 26 Yes, 21 Needs edit and 2 No; the two No clips were rebuilt, and all 43 legacy human phoneme files received same-Leda review candidates without replacing production audio |
| 2026-07-29 | [complete_phoneme_bank_v18](assets/complete_phoneme_bank_v18_2026-07-29.md) | All six V17 manual edits passed; closure-preserving `ct`, `pt` and `xt` were volume-checked and installed, then all 49 approved phonemes were level-matched for a full-bank review with five legacy-fade clips flagged |
| 2026-07-29 | [manual_vowel_removal_v17](assets/manual_vowel_removal_v17_2026-07-29.md) | V16 reconciled at 1 Yes, 3 Maybe and 4 No; `nd` was installed, while `ct`, `pt` and `xt` received two spectrogram-guided manual cuts that physically remove the opening vowel |
| 2026-07-29 | [alternate_engine_cluster_review_v16](assets/alternate_engine_cluster_review_v16_2026-07-29.md) | V15 reconciled at 8 Yes, 9 No and 1 unrated; five approved patterns were volume-matched and installed, while four unresolved ending clusters received Studio-O and Neural2-F direct-IPA alternatives for a new eight-clip review |
| 2026-07-29 | [targeted_cluster_alternatives_v15](assets/targeted_cluster_alternatives_v15_2026-07-29.md) | V14 reconciled at 10 Yes, 1 Maybe and 8 No; the 10 passes were installed and nine unresolved patterns received two distinct onset or vowel-suppression alternatives for A/B review |
| 2026-07-29 | [tight_spec_cluster_review_v14](assets/tight_spec_cluster_review_v14_2026-07-29.md) | V13 reconciled at 10/29 passes; those 10 plus two pending V12 passes installed, while 19 failures were regenerated as joined-schwa onsets or quiet-support-vowel ending clusters for a new human-ear review |
| 2026-07-29 | [bluh_cue_cluster_review_v13](assets/bluh_cue_cluster_review_v13_2026-07-29.md) | Direct IPA review reconciled at 2/33 passes; 29 rejected consonant clusters regenerated as compact `bluh`/`gruh`/`truh`-style cues and delivered in a new listening form |
| 2026-07-29 | [direct_ipa_phoneme_review_v12](assets/direct_ipa_phoneme_review_v12_2026-07-29.md) | All 33 rejected phonics-pattern clips regenerated with direct IPA in Leda; distinct 24 kHz MP3s validated and a persistent Yes/Maybe/No listening form delivered without replacing production audio |
| 2026-07-29 | [leda_phonics_audio_v10_import](assets/leda_phonics_audio_v10_import_2026-07-29.md) | V10 listening review reconciled: 18 approved Leda clips imported, 33 rejected clips queued for direct-IPA regeneration, and 16 unrated clips preserved for review |
| 2026-07-28 | [LANDING_REDESIGN_2026-07-28](LANDING_REDESIGN_2026-07-28.md) | Signed-out entry rebuilt as the full marketing landing page; mock's placeholder stats corrected to data-derived truth; two CSS mechanisms recorded (block-container `place-items`, fixed `minmax` track) |
| 2026-07-28 | [TEACHER_REDESIGN_V2_PLAN_2026-07-28](TEACHER_REDESIGN_V2_PLAN_2026-07-28.md) | Teacher-area v2 redesign accepted; prototype committed to `mockups/design-handoff-teacher-area/`; six-phase build plan with file map, test-impact list and the current-cycle data gap |
| 2026-07-28 | [PRESENT_REDESIGN_2026-07-28](PRESENT_REDESIGN_2026-07-28.md) | Present mode redesigned: fixed 1920×1080 stage, section rail, organic theme, live srcdoc preview, reveal/timer warm-ups; two handoff defects fixed (orphaned timer dial, stage centering) |
| 2026-07-27 | [TEACHER_SIDE_REMEDIATION_2026-07-27](TEACHER_SIDE_REMEDIATION_2026-07-27.md) | Follow-up teacher critic opened D-076–D-086 and implemented reporting-truth, lifecycle, busy-teacher UX, curriculum, trace-formation, and safety fixes; final integrated/live closure remains pending |
| 2026-07-27 | [TEACHER_SIDE_AUDIT_AND_FIXES_2026-07-27](TEACHER_SIDE_AUDIT_AND_FIXES_2026-07-27.md) | Learner deletion restored (the migration had never been applied); 20 teacher-side defects closed across data integrity, metric truth, UX and the Supabase boundary; 8 items left open needing a decision |
| 2026-07-27 | [TEACHER_FUNNELS_2026-07-27](TEACHER_FUNNELS_2026-07-27.md) | Assessments and Reports rebuilt as two matching funnels; Present images fixed; student delete added |
| 2026-07-26 | [TEACHER_AREA_OVERHAUL_2026-07-26](TEACHER_AREA_OVERHAUL_2026-07-26.md) | Teacher area split and rebuilt; presentation fixed; mastery reporting unified |
| 2026-07-26 | [STORY_QUEST_REWRITE_2026-07-26](STORY_QUEST_REWRITE_2026-07-26.md) | All 13 Story Quests re-authored to sit at their declared reading bands |
| 2026-07-25 | [APP_COPY_STANDARD_2026-07-25](APP_COPY_STANDARD_2026-07-25.md) | Plain-words copy standard adopted app-wide *(now a standard, not a record)* |
| 2026-07-23 | [FULL_APP_CRITIQUE_2026-07-23](FULL_APP_CRITIQUE_2026-07-23.md) | Full product critique — the honest list |
| 2026-07-23 | [TEN_OUT_OF_TEN_PLAN_2026-07-23](TEN_OUT_OF_TEN_PLAN_2026-07-23.md) | The plan that answers that critique |
| 2026-07-22 | [LITTLE_LITERACY_GUIDES_BRAND_DECISION_2026-07-22](LITTLE_LITERACY_GUIDES_BRAND_DECISION_2026-07-22.md) | Child area gets its own brand |
| 2026-07-21 | [EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21](EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21.md) | Benchmark assessment suite defined |
| 2026-07-20 | [SOUND_SEEKERS_COMPLETE_AUDIT_2026-07-20](SOUND_SEEKERS_COMPLETE_AUDIT_2026-07-20.md) · [evidence](SOUND_SEEKERS_AUDIT_REMEDIATION_EVIDENCE_2026-07-20.md) | Sound Seekers audited and remediated |
| 2026-07-12 | [CLEANUP_AUDIT_2026-07-12](CLEANUP_AUDIT_2026-07-12.md) | Project folder cleanup |
| 2026-07-04 | [DEPLOYMENT_AUDIT_2026-07-04](DEPLOYMENT_AUDIT_2026-07-04.md) · [MARKET_READINESS](MARKET_READINESS.md) | Deployment and readiness verdict |

**Release tracking** — [release/TRACEABILITY](release/TRACEABILITY.md) (16k words, the big one) ·
[release/DISCOVERED](release/DISCOVERED.md) · [release/CURRICULUM_BOARD](release/CURRICULUM_BOARD.md) ·
[release/MEDIA_BOARD](release/MEDIA_BOARD.md) · [release/WAIVERS](release/WAIVERS.md) ·
[release/EXTERNAL](release/EXTERNAL.md) · [release/LOOP_LOG](release/LOOP_LOG.md) · [release/AUDIT_ACCOUNT](release/AUDIT_ACCOUNT.md)

---

## Superseded — do not act on these

Each chain below ends in the file that is still true. The earlier ones are kept because
they show the reasoning, not because they describe the app.

- **Sound Seekers:** [audit 07-14](SOUND_SEEKERS_AUDIT_2026-07-14.md) → [upgrade plan 07-15](SOUND_SEEKERS_CRITIQUE_AND_UPGRADE_PLAN_2026-07-15.md) → [10/10 critique 07-17](SOUND_SEEKERS_10_OUT_OF_10_CRITIQUE_2026-07-17.md) → **[complete audit 07-20](SOUND_SEEKERS_COMPLETE_AUDIT_2026-07-20.md)**
- **Whole app:** [audit & roadmap 07-10](APP_AUDIT_AND_ROADMAP_2026-07-10.md) → **[full critique 07-23](FULL_APP_CRITIQUE_2026-07-23.md)**
- **Assessment adversarial audit:** [original audit 07-31](ADVERSARIAL_AUDIT_2026-07-31.md) → **[current cross-check 07-31](ADVERSARIAL_AUDIT_CROSSCHECK_2026-07-31.md)**
- **Teacher side:** [audit 07-10](TEACHER_SIDE_AUDIT_2026-07-10.md) → [dashboard redesign audit](implementation/teacher_dashboard_redesign_audit.md) → [overhaul 07-26](TEACHER_AREA_OVERHAUL_2026-07-26.md) → [funnels 07-27](TEACHER_FUNNELS_2026-07-27.md) → [audit and fixes 07-27](TEACHER_SIDE_AUDIT_AND_FIXES_2026-07-27.md) → **[current remediation 07-27](TEACHER_SIDE_REMEDIATION_2026-07-27.md)**
- **Child side:** [design audit 07-08](KIDS_SIDE_DESIGN_AUDIT_2026-07-08.md) → [fix handoff 07-08](KIDS_SIDE_AUDIT_FIXES_2026-07-08.md) → **[design system](LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM.md)**
- **Sound Seekers build specs:** [quest design plan 07-11](QUEST_DESIGN_PLAN_2026-07-11.md) · [slice 1 spec 07-11](QUEST_SLICE_1_SPEC_2026-07-11.md) · [slice loop](SOUND_SEEKERS_SLICE_LOOP.md) · [push 2](SOUND_SEEKERS_PUSH_2.md) → **[release bible](SOUND_SEEKERS_RELEASE_BIBLE.md)**

---

## Archives

Three folders hold 244 of the 465 files and 1.2 million of the 1.67 million words. They
are receipts of work already done. Each has its own index.

| Folder | Files | Words | What it is |
| --- | ---: | ---: | --- |
| [assets/](assets/INDEX.md) | 101 | 745,441 | Media briefs, inventories and coverage audits |
| [validation/](validation/INDEX.md) | 98 | 221,575 | Point-in-time audit reports, superseded by the gates in `tools/` |
| [guided-reading/](guided-reading/INDEX.md) | 45 | 230,934 | Book systems (current) plus per-batch import audits (historical) |

**Agent briefs and media requests in this folder.** Around 30 files here beginning
`KIMI_`, `OPUS_`, `CODEX_PROMPT_`, `SEEDREAM_` or `ART_REQUEST_` are jobs handed to an
agent and since completed. They are worth keeping only as a record of what was asked
for — most usefully when a piece of media looks wrong and you want to see its brief.

**Implementation audits.** [implementation/](implementation/) holds 20 focused audits —
performance, bundle size, mobile, media resolution, state architecture. Same rule: dated
findings, not current truth. The exception is
[implementation/roadmap](implementation/roadmap.md), which is meant to stay current.

---

## Keeping this useful

Four habits, and this stops rotting:

1. **New decision → edit the standard.** Do not write a new dated file that quietly
   contradicts an old one. That is how you get 465 files.
2. **New dated record → add one row** to *Where things stand*, and if it retires
   something, add the chain to *Superseded*.
3. **Finished a piece of work → move its brief.** Media requests and agent prompts
   belong in an archive folder the moment the work lands.
4. **When an agent starts a session,** point it at this file first. It is cheaper than
   letting it rediscover the same decisions.

---

## Smaller folders

Everything not covered above. Mostly archives and one-off reports, listed here so no
file in `docs/` is unreachable from this page.

**`archive/`** — Retired documents kept for history.

- [ARCADE_REVIEW](archive/ARCADE_REVIEW.md)
- [LiteracyPath_Strict_Audit_For_ChatGPT](archive/LiteracyPath_Strict_Audit_For_ChatGPT.md)
- [PROJECT_STATUS](archive/PROJECT_STATUS.md)
- [REVIEW](archive/REVIEW.md)
- [SOUND_SEEKERS_REVIEW](archive/SOUND_SEEKERS_REVIEW.md)
- [plan](archive/plan.md)

**`assets/archive/`** — Retired media paperwork.

- [clean_audio_replacement_request](assets/archive/clean_audio_replacement_request.md)
- [complete_audio_replacement_request](assets/archive/complete_audio_replacement_request.md)
- [kimi_learn_games_audio_request](assets/archive/kimi_learn_games_audio_request.md)
- [kimi_missing_answer_choice_images_request](assets/archive/kimi_missing_answer_choice_images_request.md)

**`assets/archive/kimi_requests/`** — 14 completed media briefs, already archived. Nothing here is live work.

- [kimi_assessment_missing_audio_request](assets/archive/kimi_requests/kimi_assessment_missing_audio_request.md)
- [kimi_assessment_missing_images_request](assets/archive/kimi_requests/kimi_assessment_missing_images_request.md)
- [kimi_assessment_missing_media_combined_request](assets/archive/kimi_requests/kimi_assessment_missing_media_combined_request.md)
- [kimi_story_quest_bouncy_speedy_fast_map_request](assets/archive/kimi_requests/kimi_story_quest_bouncy_speedy_fast_map_request.md)
- [kimi_story_quest_brave_tiny_big_little_rescue_request](assets/archive/kimi_requests/kimi_story_quest_brave_tiny_big_little_rescue_request.md)
- [kimi_story_quest_dino_pals_chompy_big_lunch_hunt_request](assets/archive/kimi_requests/kimi_story_quest_dino_pals_chompy_big_lunch_hunt_request.md)
- [kimi_story_quest_dino_pals_sunny_rainy_rescue_request](assets/archive/kimi_requests/kimi_story_quest_dino_pals_sunny_rainy_rescue_request.md)
- [kimi_story_quest_muddy_splashy_missing_hat_request](assets/archive/kimi_requests/kimi_story_quest_muddy_splashy_missing_hat_request.md)
- [kimi_story_quest_sam_alf_request](assets/archive/kimi_requests/kimi_story_quest_sam_alf_request.md)
- [kimi_story_quest_sam_pam_audio_replacement_request](assets/archive/kimi_requests/kimi_story_quest_sam_pam_audio_replacement_request.md)
- [kimi_story_quest_shy_cuddly_quiet_adventure_request](assets/archive/kimi_requests/kimi_story_quest_shy_cuddly_quiet_adventure_request.md)
- [kimi_strict_missing_audio_request](assets/archive/kimi_requests/kimi_strict_missing_audio_request.md)
- [kimi_strict_missing_images_request](assets/archive/kimi_requests/kimi_strict_missing_images_request.md)
- [kimi_strict_missing_media_combined_request](assets/archive/kimi_requests/kimi_strict_missing_media_combined_request.md)

**`assets/kimi-image-qa-replacements/`** — Image QA replacement rounds.

- [kimi_image_qa_replacement_request](assets/kimi-image-qa-replacements/kimi_image_qa_replacement_request.md)
- [kimi_image_qa_replacement_summary](assets/kimi-image-qa-replacements/kimi_image_qa_replacement_summary.md)

**`guided-reading/contact-sheets/`** — Contact sheet for visual review of book art.

- [image_text_artifact_contact_sheet](guided-reading/contact-sheets/image_text_artifact_contact_sheet.md)

**`implementation/`** — Focused engineering audits — performance, bundle size, mobile, state architecture, media resolution. Dated findings, not current truth.

- [EL_Skills_Block_Learn_Area_Design_Specification_REVISED](implementation/EL_Skills_Block_Learn_Area_Design_Specification_REVISED.md)
- [app_performance_audit](implementation/app_performance_audit.md)
- [app_state_architecture_audit](implementation/app_state_architecture_audit.md)
- [bundle_size_and_repo_hygiene_audit](implementation/bundle_size_and_repo_hygiene_audit.md)
- [content_coverage_audit](implementation/content_coverage_audit.md)
- [el_assessment_dashboard_export_audit](implementation/el_assessment_dashboard_export_audit.md)
- [el_assessment_progress_persistence_audit](implementation/el_assessment_progress_persistence_audit.md)
- [el_learn_area_content_quality_audit](implementation/el_learn_area_content_quality_audit.md)
- [el_skills_block_learn_area](implementation/el_skills_block_learn_area.md)
- [generated_docs_churn_plan](implementation/generated_docs_churn_plan.md)
- [learn_lesson_player_ui_rebuild_audit](implementation/learn_lesson_player_ui_rebuild_audit.md)
- [lp_assets_usage_audit](implementation/lp_assets_usage_audit.md)
- [media_resolution_migration_audit](implementation/media_resolution_migration_audit.md)
- [mobile_responsive_audit](implementation/mobile_responsive_audit.md)
- [performance_phase_1_plan](implementation/performance_phase_1_plan.md)
- [signup_approval_access_control](implementation/signup_approval_access_control.md)
- [teacher_created_interactive_learn_decks](implementation/teacher_created_interactive_learn_decks.md)

**`imports/`** — Content import batches from the earliest weeks of the project.

- [kimi_dataset7_activation_report](imports/kimi_dataset7_activation_report.md)
- [kimi_dataset7_taxonomy_mapping](imports/kimi_dataset7_taxonomy_mapping.md)
- [kimi_dataset7_validation_report](imports/kimi_dataset7_validation_report.md)

**`imports/kimi_these_still_need_finishing_2026-06-05/`** — An early unfinished-work list, June 2026.

- [plan](imports/kimi_these_still_need_finishing_2026-06-05/plan.md)

**`kimi-requests/`** — A stray media request that never moved into assets/.

- [rhyming-level-2-pending-media-2026-06-04](kimi-requests/rhyming-level-2-pending-media-2026-06-04.md)

**`lexicon/`** — Word-bank tagging and validation output.

- [auto_tagging_report](lexicon/auto_tagging_report.md)
- [lexicon_validation_report](lexicon/lexicon_validation_report.md)

**`media/`** — A note about where phonics image assets live.

- [phonics_images_readme](media/phonics_images_readme.md)

**`performance/`** — Bundle and runtime performance reports.

- [bundle_analysis](performance/bundle_analysis.md)
- [performance_pass_report](performance/performance_pass_report.md)
- [reports_performance_audit](performance/reports_performance_audit.md)

**`previews/quest-release/`** — Preview build notes for a quest release.

- [2026-07-15-seedwake-release-report](previews/quest-release/2026-07-15-seedwake-release-report.md)

**`previews/slice/`** — Preview build notes for a vertical slice.

- [REPORT](previews/slice/REPORT.md)

**`release/scorecards/`** — Per-loop release scorecards.

- [2026-07-23-025ae83538c1](release/scorecards/2026-07-23-025ae83538c1.md)
- [2026-07-25-0b2262f8ce7e](release/scorecards/2026-07-25-0b2262f8ce7e.md)

**`validation/quest-device-acceptance/`** — Device acceptance run for the quest game.

- [README](validation/quest-device-acceptance/README.md)

**`validation/quest-human-acceptance/`** — Human acceptance run for the quest game.

- [README](validation/quest-human-acceptance/README.md)

---
## Everything in this folder, A–Z

Every file in `docs/` root, so nothing above is the only way to find something.
Subfolders have their own indexes, linked above.

| File | Words | Title |
| --- | ---: | --- |
| [3D_ASSET_LIBRARY](3D_ASSET_LIBRARY.md) | 744 | LiteracyPath 3D asset library |
| [APP_AUDIT_AND_ROADMAP_2026-07-10](APP_AUDIT_AND_ROADMAP_2026-07-10.md) | 2,462 | Literacy Guide — Full App Audit & Roadmap (2026-07-10) |
| [APP_COPY_STANDARD_2026-07-25](APP_COPY_STANDARD_2026-07-25.md) | 2,041 | App-Wide Copy Standard — plain words, everywhere |
| [ART_REQUEST_arcade_game_icons_2026-07-06](ART_REQUEST_arcade_game_icons_2026-07-06.md) | 337 | Art Request — Arcade Game Icons (2026-07-06) |
| [AUDIO_AUDIT](AUDIO_AUDIT.md) | 440 | Full App Audio Audit — 10 June 2026 |
| [AUDIT_ALIGNMENT](AUDIT_ALIGNMENT.md) | 255 | Alignment & Typography Audit |
| [AUDIT_SCREEN_USAGE](AUDIT_SCREEN_USAGE.md) | 713 | Screen Usage Audit — every user-facing page |
| [CHECKPOINTS_AUDIT_AND_FIX_PLAN_2026-07-09](CHECKPOINTS_AUDIT_AND_FIX_PLAN_2026-07-09.md) | 789 | Checkpoints (skills assessments) — audit + fix plan (2026-07-09) |
| [CLEANUP_AUDIT_2026-07-12](CLEANUP_AUDIT_2026-07-12.md) | 1,211 | Project Folder Cleanup Audit — 2026-07-12 |
| [CODEX_PROMPT_home_restructure_and_audio_2026-07-06](CODEX_PROMPT_home_restructure_and_audio_2026-07-06.md) | 1,965 | LOOP PROMPT — Student/Teacher restructure + full audio recording document |
| [COMIC_REDESIGN_CODEX_PROMPT_2026-07-07](COMIC_REDESIGN_CODEX_PROMPT_2026-07-07.md) | 4,566 | CODEX/OPUS PROMPT — Comic-Book Redesign (Mockup Fidelity Pass) |
| [COMIC_REDESIGN_IMAGE_PROMPTS_2026-07-07](COMIC_REDESIGN_IMAGE_PROMPTS_2026-07-07.md) | 601 | Comic Redesign — Image Generation Prompt Pack (2026-07-07) |
| [COMPETITOR_NOTES](COMPETITOR_NOTES.md) | 2,949 | Competitor Notes — LiteracyPath |
| [DEPLOYMENT_AUDIT_2026-07-04](DEPLOYMENT_AUDIT_2026-07-04.md) | 2,036 | Deployment Audit — 2026-07-04 |
| [EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21](EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21.md) | 1,070 | LiteracyPath EL-aligned benchmark assessment suite |
| [FULL_APP_CRITIQUE_2026-07-23](FULL_APP_CRITIQUE_2026-07-23.md) | 6,417 | LiteracyPath full product critique |
| [GAME_AUDIT_AND_LEARN_OVERHAUL](GAME_AUDIT_AND_LEARN_OVERHAUL.md) | 575 | Games Audit + Learn Area Overhaul Plan |
| [GAME_CONCEPTS_bridge_builders_and_sound_racer_2026-07-06](GAME_CONCEPTS_bridge_builders_and_sound_racer_2026-07-06.md) | 3,202 | LiteracyPath — Two Future Arcade Games (Design Doc) |
| [GAME_CURRICULUM_FRAMEWORK_2026-07-06](GAME_CURRICULUM_FRAMEWORK_2026-07-06.md) | 837 | LiteracyPath — Shared Game Curriculum & Difficulty Framework |
| [GAME_DESIGN_sentence_express_2026-07-09](GAME_DESIGN_sentence_express_2026-07-09.md) | 1,195 | SENTENCE EXPRESS — flagship arcade game design (2026-07-09) |
| [GROUP_GUIDED_READING_IMPLEMENTATION_PLAN_2026-07-30](GROUP_GUIDED_READING_IMPLEMENTATION_PLAN_2026-07-30.md) | 5,594 | Group Guided Reading (synced iPads) — implementation plan (2026-07-30) |
| [HOLLOW_LIVE_CRITIQUE_2026-07-08](HOLLOW_LIVE_CRITIQUE_2026-07-08.md) | 610 | My Hollow — live critique on Vercel preview (2026-07-08) |
| [IMPROVEMENT_LOOPS](IMPROVEMENT_LOOPS.md) | 3,031 | IMPROVEMENT LOOPS — the instruction file |
| [KIDS_SIDE_AUDIT_FIXES_2026-07-08](KIDS_SIDE_AUDIT_FIXES_2026-07-08.md) | 1,436 | Kids-Side Audit — Fix Handoff (2026-07-08) |
| [KIDS_SIDE_DESIGN_AUDIT_2026-07-08](KIDS_SIDE_DESIGN_AUDIT_2026-07-08.md) | 2,328 | Kids Side — Design & Layout Audit (2026-07-08) |
| [KIMI_ARCADE_GAMES_sound_racer_word_bridge_2026-07-07](KIMI_ARCADE_GAMES_sound_racer_word_bridge_2026-07-07.md) | 2,267 | KIMI TASK — Build the two SNES/PS1 arcade games: Sound Racer + Word Bridge |
| [KIMI_AUDIO_EL_QUEST_FIX_N_AM](KIMI_AUDIO_EL_QUEST_FIX_N_AM.md) | 378 | Kimi Audio Request — EL Skills Quest fixes: "n" and "am" |
| [KIMI_AUDIO_GUIDED_READING_WORD_TAPS](KIMI_AUDIO_GUIDED_READING_WORD_TAPS.md) | 856 | Kimi Audio Request — Guided Reading word-tap audio (308 words) |
| [KIMI_AUDIO_NARRATION_REQUEST](KIMI_AUDIO_NARRATION_REQUEST.md) | 10,491 | Kimi Audio Request — Book Narration (30 books) |
| [KIMI_AUDIO_PHONEMES_AND_FIXES](KIMI_AUDIO_PHONEMES_AND_FIXES.md) | 460 | Kimi Audio Request — Letter Sounds + Word Quality Fixes |
| [KIMI_AUDIO_PRONUNCIATION_FIXES](KIMI_AUDIO_PRONUNCIATION_FIXES.md) | 459 | Kimi Audio Request — Pronunciation Fixes + Slower Pace |
| [KIMI_AUDIO_RERECORD_STRICT](KIMI_AUDIO_RERECORD_STRICT.md) | 242 | Kimi Audio Re-record — STRICT Plain Text Only |
| [KIMI_AUDIO_SHORT_WORDS_FIX](KIMI_AUDIO_SHORT_WORDS_FIX.md) | 360 | Kimi Audio Request — Short words said as ONE word (EL Skills Quest) |
| [KIMI_AUDIO_VOICE_AND_WORDS_REQUEST](KIMI_AUDIO_VOICE_AND_WORDS_REQUEST.md) | 688 | Kimi Audio Request — Voice Lines, Words, and Sentences |
| [KIMI_BOOK_PAGES_TEXT_FIX](KIMI_BOOK_PAGES_TEXT_FIX.md) | 3,499 | Kimi Image Request — Replace 25 book page sets (embedded gibberish text fix) |
| [KIMI_FINAL_MEDIA_RUN](KIMI_FINAL_MEDIA_RUN.md) | 1,381 | Kimi Request — FINAL media run (one batch closes everything) |
| [KIMI_GOLD_VOICE_GAME_AUDIO](KIMI_GOLD_VOICE_GAME_AUDIO.md) | 600 | Kimi Audio Request — Game audio, gold voice (44 clips) |
| [KIMI_GOLD_VOICE_PART1_APP_WORDS](KIMI_GOLD_VOICE_PART1_APP_WORDS.md) | 749 | Kimi Audio — Gold Voice Re-records, Part 1: App word clips (639 files) |
| [KIMI_GOLD_VOICE_PART2_BOOK_WORDS](KIMI_GOLD_VOICE_PART2_BOOK_WORDS.md) | 3,446 | Kimi Audio — Gold Voice Re-records, Part 2: Book word-tap clips (3,366 files) |
| [KIMI_GOLD_VOICE_PART3_NARRATION](KIMI_GOLD_VOICE_PART3_NARRATION.md) | 6,913 | Kimi Audio — Gold Voice Re-records, Part 3: Book narration (58 books, Level B+) |
| [KIMI_GOLD_VOICE_PRESENT_POEMS](KIMI_GOLD_VOICE_PRESENT_POEMS.md) | 1,202 | Kimi Audio Request — Present-deck poem narration (27 poems, gold voice) |
| [KIMI_GOLD_VOICE_QUEST_RERECORD](KIMI_GOLD_VOICE_QUEST_RERECORD.md) | 671 | Kimi Audio Request — EL quest words and letter sounds RE-RECORD (quality fix) |
| [KIMI_GOLD_VOICE_SENTENCE_FIX_2](KIMI_GOLD_VOICE_SENTENCE_FIX_2.md) | 137 | Kimi Audio Request — 6 new Sentence Fix-It clips (hard tier addendum) |
| [KIMI_HORIZONTAL_MAPS_REDO](KIMI_HORIZONTAL_MAPS_REDO.md) | 377 | Kimi Art Request — Redo Dino & Moonwood wide maps (brighter, no numbers) |
| [KIMI_HORIZONTAL_MAPS_REQUEST](KIMI_HORIZONTAL_MAPS_REQUEST.md) | 440 | Kimi Art Request — Horizontal (landscape) adventure maps |
| [KIMI_LETTER_AUDIO_FULL_REDO](KIMI_LETTER_AUDIO_FULL_REDO.md) | 839 | Kimi Audio Request — FULL REDO of every letter sound + letter name (gold voice) |
| [KIMI_LITERACY_PALS_ART_REQUEST](KIMI_LITERACY_PALS_ART_REQUEST.md) | 377 | Kimi Media Request - Child World Art |
| [KIMI_LITERACY_PALS_BRAND_REQUEST](KIMI_LITERACY_PALS_BRAND_REQUEST.md) | 331 | Kimi Media Request - Superseded Child Brand Pack (EXACT characters) |
| [KIMI_MEDIA_REQUESTS](KIMI_MEDIA_REQUESTS.md) | 837 | Kimi Media Generation Requests — Learn Area AAA Polish |
| [KIMI_NEXT_MEDIA_RUN](KIMI_NEXT_MEDIA_RUN.md) | 9,136 | Kimi Request — Next media run (4 jobs) |
| [KIMI_PALS_GAME_CARD_ART](KIMI_PALS_GAME_CARD_ART.md) | 299 | Kimi Image Request — Pals game card art (6 images, EXACT characters) |
| [KIMI_PROMPT_audio_import_and_layout_2026-07-06](KIMI_PROMPT_audio_import_and_layout_2026-07-06.md) | 1,015 | KIMI / CLAUDE-CODE AGENT PROMPT — import recorded audio + restyle student/teache |
| [KIMI_SHORT_WORD_AUDIO_RERECORD](KIMI_SHORT_WORD_AUDIO_RERECORD.md) | 298 | Kimi Audio Request — re-record 3 short words (gold voice, whole words) |
| [KIMI_SKILLS_QUEST_MEDIA_REQUEST](KIMI_SKILLS_QUEST_MEDIA_REQUEST.md) | 256 | Kimi Media Request — Skills Quest |
| [KIMI_VIDEO_TEST_CYCLE1_SONG](KIMI_VIDEO_TEST_CYCLE1_SONG.md) | 1,248 | Kimi Video Test — Cycle 1 Phonics Song ("The Meadow Sounds Song") |
| [LITTLE_LITERACY_GUIDES_BRAND_DECISION_2026-07-22](LITTLE_LITERACY_GUIDES_BRAND_DECISION_2026-07-22.md) | 413 | Little Literacy Guides - Child-Area Brand Decision |
| [LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM](LITTLE_LITERACY_GUIDES_DESIGN_SYSTEM.md) | 695 | Little Literacy Guides - Child Area Design System |
| [LOOP5_IMAGE_INVENTORY_FINDINGS_2026-07-05](LOOP5_IMAGE_INVENTORY_FINDINGS_2026-07-05.md) | 298 | Loop 5 — Art & Image Pipeline Findings (2026-07-05) |
| [LOOP_PROMPTS_MARKET_READY](LOOP_PROMPTS_MARKET_READY.md) | 1,011 | Five Loop Prompts — Market-Ready LiteracyPath |
| [MAP_UPGRADE_CODEX_PROMPT](MAP_UPGRADE_CODEX_PROMPT.md) | 1,999 | Codex prompt — Skills Quest map upgrade (path-following avatar + diegetic place  |
| [MARKET_READINESS](MARKET_READINESS.md) | 405 | Market Readiness — 2026-07-04 (Loops 1–5 verdict) |
| [OPEN_SOURCE_REPOS](OPEN_SOURCE_REPOS.md) | 524 | Open-source repos worth using for LiteracyPath |
| [OPERATING_MANUAL](OPERATING_MANUAL.md) | 13,607 | The Operating Manual |
| [OPERATING_MANUAL_quickref](OPERATING_MANUAL_quickref.md) | 1,707 | Operating Manual |
| [OPUS_ARCADE_FIX_2026-07-06_ROCKET_LEAP](OPUS_ARCADE_FIX_2026-07-06_ROCKET_LEAP.md) | 4,532 | OPUS TASK — Arcade Fix Round: Rocket Run ghosts/audio/visuals + Letter Leap leve |
| [OPUS_ARCADE_QUALITY_PASS_2026-07-06_SNES_PS1](OPUS_ARCADE_QUALITY_PASS_2026-07-06_SNES_PS1.md) | 2,835 | OPUS TASK — Arcade Quality Pass: longer, harder, SNES/PS1-grade (Wipeout × Super |
| [OPUS_PRESENT_OVERHAUL_2026-07-09](OPUS_PRESENT_OVERHAUL_2026-07-09.md) | 1,178 | OPUS 4.8 — Present-mode (teacher slides) curriculum overhaul |
| [POEM_IMAGE_BRIEFS](POEM_IMAGE_BRIEFS.md) | 1,175 | Present-Deck Poem Illustrations — Art Briefs |
| [PRODUCT_PLAN_DAILY_LOOP](PRODUCT_PLAN_DAILY_LOOP.md) | 858 | Product Plan — From Islands to One Daily Loop |
| [QUEST_DESIGN_PLAN_2026-07-11](QUEST_DESIGN_PLAN_2026-07-11.md) | 6,885 | Sound Seekers — adventure phonics game |
| [QUEST_SLICE_1_SPEC_2026-07-11](QUEST_SLICE_1_SPEC_2026-07-11.md) | 1,651 | Sound Seekers — Slice 1 build spec |
| [RECORDING_SCRIPT](RECORDING_SCRIPT.md) | 589 | Recording Script — one take, 61 items (print this page) |
| [REWARDS_V2_RESEARCH_AND_PLAN_2026-07-08](REWARDS_V2_RESEARCH_AND_PLAN_2026-07-08.md) | 1,092 | Rewards V2 — Research & System Plan (2026-07-08) |
| [SEEDREAM_IMAGE_REQUESTS_assessment_cleanup_2026-07-10](SEEDREAM_IMAGE_REQUESTS_assessment_cleanup_2026-07-10.md) | 1,629 | Assessment Image Cleanup — banned-style purge (2026-07-10) |
| [SEEDREAM_IMAGE_REQUESTS_hollow_2026-07-08](SEEDREAM_IMAGE_REQUESTS_hollow_2026-07-08.md) | 1,215 | Seedream Image Requests — My Hollow (Rewards V2), 2026-07-08 |
| [SEEDREAM_IMAGE_REQUESTS_hollow_shelves_2026-07-09](SEEDREAM_IMAGE_REQUESTS_hollow_shelves_2026-07-09.md) | 1,317 | Seedream Image Requests — Hollow trinket shelves + tired-media replacements (202 |
| [SOUND_SEEKERS_10_OUT_OF_10_CRITIQUE_2026-07-17](SOUND_SEEKERS_10_OUT_OF_10_CRITIQUE_2026-07-17.md) | 36,799 | Sound Seekers: 10/10 Standard Critique |
| [SOUND_SEEKERS_3D_ASSET_NOTICES](SOUND_SEEKERS_3D_ASSET_NOTICES.md) | 296 | Sound Seekers 3D asset notices |
| [SOUND_SEEKERS_AUDIT_2026-07-14](SOUND_SEEKERS_AUDIT_2026-07-14.md) | 5,614 | Sound Seekers — Full Audit |
| [SOUND_SEEKERS_AUDIT_REMEDIATION_EVIDENCE_2026-07-20](SOUND_SEEKERS_AUDIT_REMEDIATION_EVIDENCE_2026-07-20.md) | 5,921 | Sound Seekers audit remediation evidence |
| [SOUND_SEEKERS_COMPLETE_AUDIT_2026-07-20](SOUND_SEEKERS_COMPLETE_AUDIT_2026-07-20.md) | 17,014 | Sound Seekers — Complete Audit & Remediation Plan |
| [SOUND_SEEKERS_CRITIQUE_AND_UPGRADE_PLAN_2026-07-15](SOUND_SEEKERS_CRITIQUE_AND_UPGRADE_PLAN_2026-07-15.md) | 4,499 | Sound Seekers — Critique & Upgrade Plan |
| [SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX](SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md) | 367 | Sound Seekers Curriculum-to-Mechanic Matrix |
| [SOUND_SEEKERS_PUSH_2](SOUND_SEEKERS_PUSH_2.md) | 1,807 | Sound Seekers — Push 2 (Codex brief) |
| [SOUND_SEEKERS_RELEASE_BIBLE](SOUND_SEEKERS_RELEASE_BIBLE.md) | 5,799 | Sound Seekers Release Bible |
| [SOUND_SEEKERS_SLICE_LOOP](SOUND_SEEKERS_SLICE_LOOP.md) | 3,014 | Sound Seekers — Vertical Slice: Loop to Completion |
| [SOUND_SEEKERS_WORLD_V2_BLUEPRINT](SOUND_SEEKERS_WORLD_V2_BLUEPRINT.md) | 563 | Sound Seekers World V2 Blueprint |
| [STATUS_OPEN_ITEMS](STATUS_OPEN_ITEMS.md) | 230 | Literacy Pals — honest open items (13 Jun 2026) |
| [STORY_QUEST_REWRITE_2026-07-26](STORY_QUEST_REWRITE_2026-07-26.md) | 6,498 | Story Quest rewrite — 2026-07-26 |
| [STUDENT_UI_CONSISTENCY_AUDIT](STUDENT_UI_CONSISTENCY_AUDIT.md) | 1,693 | Student UI — Style & Layout Consistency Audit |
| [SYNCED_GUIDED_READING_SPEC_2026-07-27](SYNCED_GUIDED_READING_SPEC_2026-07-27.md) | 5,485 | Shared Reading Session — design spec (written 2026-07-27 at `9aa08d97`; imported 2026-07-30; anchor updates live in the implementation plan) |
| [TEACHER_AREA_OVERHAUL_2026-07-26](TEACHER_AREA_OVERHAUL_2026-07-26.md) | 670 | Teacher area overhaul — 2026-07-26 |
| [TEACHER_FUNNELS_2026-07-27](TEACHER_FUNNELS_2026-07-27.md) | 994 | Assessments and Reports funnels — 2026-07-27 |
| [TEACHER_SIDE_AUDIT_AND_FIXES_2026-07-27](TEACHER_SIDE_AUDIT_AND_FIXES_2026-07-27.md) | 1,419 | Teacher-side audit and fixes — 2026-07-27 |
| [TEACHER_SIDE_AUDIT_2026-07-10](TEACHER_SIDE_AUDIT_2026-07-10.md) | 1,507 | Teacher Side — Deep-Dive Audit (2026-07-10) |
| [TEACHER_SIDE_REMEDIATION_2026-07-27](TEACHER_SIDE_REMEDIATION_2026-07-27.md) | 2,328 | Teacher-side remediation — 2026-07-27 |
| [TEACH_YOUR_MONSTER_TO_READ_RESEARCH_AND_BUILD_PLAN_2026-07-11](TEACH_YOUR_MONSTER_TO_READ_RESEARCH_AND_BUILD_PLAN_2026-07-11.md) | 7,477 | Teach Your Monster to Read: research, mechanics, art style, and a LiteracyPath b |
| [TEN_OUT_OF_TEN_PLAN_2026-07-23](TEN_OUT_OF_TEN_PLAN_2026-07-23.md) | 5,639 | TEN OUT OF TEN — The Plan |
| [VOICE_UNIFICATION_PLAN](VOICE_UNIFICATION_PLAN.md) | 433 | Voice Unification Plan |
| [admin_dashboard_supabase_setup](admin_dashboard_supabase_setup.md) | 370 | Admin Dashboard Supabase Setup |
| [guided_reading_level_c_visibility_fix](guided_reading_level_c_visibility_fix.md) | 3,545 | Guided Reading Visibility Audit |
| [product-polish-roadmap](product-polish-roadmap.md) | 411 | Product Polish Roadmap |
