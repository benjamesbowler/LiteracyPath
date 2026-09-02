# Sound Seekers v2 Cutover and Release Implementation Plan

> **For agentic workers:** Implement in numeric order. Task 0 is a hard direct-review dependency; Tasks 0–5 each end in one scoped, reviewable commit and remain unpushed. Only the root-controlled final task may fetch, rebase those already committed changes, rerun the complete matrix, perform authorized hosted gates, and push.

**Goal:** Verify the runtime plan's production v2 route, migrate every teacher report/export consumer to a practice-only v2 adapter, preserve shared assignment/storage/privacy boundaries, and retire only superseded game code, assets, manifests, and tools after a zero-reference proof.

**Dependencies:** Complete automated acceptance checks in:

- docs/superpowers/plans/2026-09-01-sound-seekers-v2-learning-foundation.md
- docs/superpowers/plans/2026-09-01-sound-seekers-v2-content-and-art.md
- docs/superpowers/plans/2026-09-01-sound-seekers-v2-game-runtime.md

**Authority:** docs/superpowers/specs/2026-09-01-sound-seekers-proper-educational-game-design.md

## Required release dependency and scoped-commit gate

The foundation intentionally leaves five contextual instructional sound keys (`schwa`, `ear_lax`, `ed_id`, `ure_no_y`, and `once_onset`) covering 21 pronunciation records in an explicit release-blocking state. These are not the broader human-listening/mix gate. Task 0 must close this exact instructional-audio blocker through direct phonics listening, rights clearance, hash-bound production masters, and a green release validator before any later cutover task begins. An unavailable reviewer, rejected master, absent rights evidence, stale hash, or still-blocked `npm run check:quest-release` is a hard STOP; no later task, browser automation, warning waiver, or open-gate label may bypass it.

Every task begins with a clean tracked tree and empty index at the reviewed dependency commit. If either is not true, stop and return the change to its owner; never reset, stash, unstage, or absorb somebody else's work. Task 0 creates `tools/verifySoundSeekersCutoverIndex.mjs`, whose frozen task manifests contain the exact allowed cached paths and add/modify/delete status for Tasks 0, 1, 2, 3, and 5. Before every scoped commit, run its task manifest check followed by `git diff --cached --check`; reject every missing, extra, duplicate, unexpected-status, symlinked, ignored, or untracked cached path. Task 4 continues using its reviewed generated NUL pathsets and `--verify-index`, and also runs `git diff --cached --check`. A root-only integration fix uses the separately reviewed ignored `.artifacts/sound-seekers-v2/integration/integration-paths.nul`, stages from that exact pathset, and verifies it with `verifySoundSeekersCutoverIndex.mjs --task integration --expected-pathspec .artifacts/sound-seekers-v2/integration/integration-paths.nul` before committing. A named `git add` never proves a scoped commit by itself.

## Rulings

- There is **no live child-progress migration**. A legacy phonics_quest payload opens as a fresh v2 learning journey: old checkpoints, mastery, rewards, gameplay, and evidence receive no v2 credit. Hosted rows are not destructively deleted.
- Keep the existing APP_VIEWS.PHONICS_QUEST, scope key, authenticated progress queue, account/entitlement/navigation shell, teacher-owned valid assignment, learner accessibility settings, and privacy sanitizer. v2 uses questStore rather than a second storage or sync client.
- stateV2.js, questMastery.js, and the SQL merge remain the learning, numeric-readiness, and merge authorities. Child views exclude answer keys, correctness flags, and internal IDs.
- Only these domains are valid: phoneme_to_grapheme, grapheme_to_phoneme, word_decoding, word_segmentation_encoding, connected_text_transfer, heart_word_mapping, and novel_decoding. An explicit literacy action emits at most one frozen event. Movement, collision, collection, travel, timing, animation, repair, and reward emit none.
- Every event has evidenceKind: practice; practice never creates formal assessment or SECURE status. Required audio is independent only when completed with zero support and no model/reveal; missing, interrupted, revealed, or supported audio is non-independent.
- Do not delete before consumers switch. Never delete a path because it contains quest: Story Quests and shared utilities/assets are retained unless the inventory proves them legacy Sound Seekers-only.
- Browser automation does not close human listening, visual-semantic, physical-iPad, assistive-technology, observed-child, authenticated-hosted, deployment, or production-operations gates.
- Task 0's five hash-bound instructional-sound approvals are a hard release prerequisite, not an open general-listening row. After they pass, broader human listening of complete instructions, narration, music ducking, and material-sound balance remains a separately truthful direct gate.
- Generated run status, parity output, screenshots, traces, and direct-gate evidence live only under the integration worktree's ignored, durable `.artifacts/sound-seekers-v2/` task root. Before any Task 0–6 runner writes evidence or creates a disposable checkout, the root controller resolves that external task root to an absolute path, exports it as task-specific `SOUND_SEEKERS_V2_EVIDENCE_ROOT`, proves it is outside every disposable checkout and inside the integration worktree's ignored `.artifacts/sound-seekers-v2/`, and passes that absolute destination to every runner. A disposable checkout may write a task-owned temporary evidence tree locally only while a command runs; before that checkout can be removed, `transferSoundSeekersEvidence()` copies the complete tree through a temporary destination, rejects symlinks/special files/path escape, records sorted relative paths plus SHA-256 and byte length, atomically installs it under the durable task root, and re-hashes every installed byte. A missing or mismatched transfer blocks cleanup and preserves the source checkout for recovery. Checked-in docs contain durable schemas, policy, recovery, and governance only; never generate a dated run report under `docs/`.
- Runtime Task 5 already owns and commits the production `renderQuest` switch. Cutover verifies the lazy `SoundSeekersRoute` mount and writes its manifest; it does not edit the route to perform a second switch and never expects `QuestRoot` to exist.
- Every Task 0–5 commit is scoped to that task's exact verified index manifest. No task pushes. Root starts final integration from a clean committed tree; fetch/rebase is not deferred until after a pile of unstaged cross-task changes.

## Task 0: Close the five hash-bound contextual instructional-audio blockers

**Depends on:** all three dependency plans, the foundation candidate generator, and a directly available authorized phonics reviewer with verifiable commercial-use rights evidence.

**Files:**

- Create: `src/data/soundSeekersContextualUnitAudio.js`
- Create: `src/data/soundSeekersInstructionalAudioDisclosure.js`
- Modify: `src/data/approvedPhonemeAudio.js`
- Modify: `src/components/teacher/TeacherSettingsPage.jsx`
- Modify: `src/components/family/ParentAreaPage.jsx`
- Create: `tools/installSoundSeekersContextualUnitMasters.mjs`
- Create: `tools/checkSoundSeekersContextualUnitRelease.mjs`
- Create: `tools/verifySoundSeekersCutoverIndex.mjs`
- Create: `tests/unit/soundSeekersContextualUnitRelease.test.js`
- Create: `tests/unit/soundSeekersInstructionalAudioDisclosure.test.js`
- Create: `tests/unit/soundSeekersCutoverIndex.test.js`
- Modify: `tools/checkQuestIntegrity.js`
- Modify: `docs/audio/SOUND_SEEKERS_CONTEXTUAL_UNIT_REVIEW.md`
- Create: `public/audio/phonemes/reviewed/SOUND_SEEKERS_CONTEXTUAL_SOURCE.md`
- Create: `public/audio/phonemes/reviewed/contextual-schwa.mp3`
- Create: `public/audio/phonemes/reviewed/contextual-ear-lax.mp3`
- Create: `public/audio/phonemes/reviewed/contextual-ed-id.mp3`
- Create: `public/audio/phonemes/reviewed/contextual-ure-no-y.mp3`
- Create: `public/audio/phonemes/reviewed/contextual-once-onset.mp3`
- Modify: `src/data/generated/audioFilePaths.generated.js`
- Modify: `src/data/generated/audioPhonemePaths.generated.js`
- Modify: `src/data/generated/audioQuestPaths.generated.js`
- Modify: `package.json`

`soundSeekersContextualUnitAudio.js` is the sole shipping approval registry for these five keys. It exports a frozen five-record `SOUND_SEEKERS_CONTEXTUAL_UNIT_AUDIO` and `getApprovedSoundSeekersContextualUnitAudio(soundKey)`. Every record has exactly `{soundKey,pronunciationRecordIds,path,sha256,byteLength,durationSeconds,codec,sampleRateHz,channels,bitrateBps,sourceKind,sourceModel,voice,generationInputSha256,rightsBasis,aiDisclosureRef,review}`. `pronunciationRecordIds` is the exact non-empty sorted set owned by that key and the five sets partition the 21 release-blocked pronunciation records. `review` is exactly `{decision:"approved",reviewedSha256,reviewedAt,reviewerRole:"phonics_specialist",environment,evidenceRef}`; `reviewedSha256` equals the current file hash. No person name, private rights document, credential, candidate path, or raw listening notes enter the repository.

`soundSeekersInstructionalAudioDisclosure.js` exports one frozen, stable disclosure ID/text plus the exact AI-generated contextual sound keys currently using it. The teacher settings and parent area render the same grown-up-facing disclosure and never show it as child-game instruction. Every AI `aiDisclosureRef` equals that live ID; a non-AI master uses `aiDisclosureRef:null`. The focused disclosure test proves both grown-up surfaces render the current shared text, every AI master is covered, and changing source kind or disclosure text invalidates stale provenance.

`installSoundSeekersContextualUnitMasters.mjs` accepts no arguments and reads only the ignored `.artifacts/sound-seekers-contextual-unit-candidates/approval.json`. The approval JSON contains exactly five selected absolute candidate paths plus the same five keys, candidate hashes, rights/disclosure references, direct-review fields, and `decision:"approved"`. The tool rejects any argument, a relative/traversing/symlink path, a candidate outside the reviewed candidate root, an unknown/duplicate/missing key, a non-approved decision, absent rights/disclosure/evidence reference, a hash mismatch, or any record not reviewed against the selected bytes. It probes the final audio rather than trusting metadata, requires MP3, 44,100 Hz, mono, 128,000 bps, finite non-zero duration, bounded signal, and no clipping, and writes first to a task-owned `mkdtemp` directory outside `public`. It atomically installs only the five exact filenames above after all five pass, writes the exact hash-bound JS registry and `SOURCE.md`, removes its temporary root in `finally`, and never creates or changes a human decision. Existing production bytes may be replaced only when the new approval explicitly names their current hash and the five-file transaction can complete atomically.

`checkSoundSeekersContextualUnitRelease.mjs` independently parses the registry and `SOURCE.md`, hashes and probes all five final assets, verifies the exact 5/21 partition against the current pronunciation corpus, verifies `approvedPhonemeAudio.js` maps each key to its registered path, verifies every required disclosure reference resolves to the live grown-up disclosure, rejects every stale/extra/orphan/symlinked master, and calls the shipping pronunciation validator. `tools/checkQuestIntegrity.js --release` imports that same checker; a warning is not accepted. `package.json` adds `check:sound-seekers-contextual-audio` only. Run `tools/generateAudioManifest.js`; exactly `audioFilePaths.generated.js`, `audioPhonemePaths.generated.js`, and `audioQuestPaths.generated.js` may change, while the choice-key and guided-reading manifests must remain byte-identical.

- [ ] **Step 1: Write the installer/checker/index tests and confirm the release blocker is red**

Tests use only `mkdtemp` synthetic audio fixtures and injected direct-review JSON to prove rejection of fabricated approval, wrong hash, wrong rights/disclosure, symlinks, partial five-file installation, stale registry/source bytes, and an extra cached path. The repository-level assertion expects the real checker and `npm run check:quest-release` to fail until all five direct approvals and production masters exist.

Run: `node --test tests/unit/soundSeekersContextualUnitRelease.test.js tests/unit/soundSeekersInstructionalAudioDisclosure.test.js tests/unit/soundSeekersCutoverIndex.test.js`

Run: `npm run check:quest-release`

Expected before direct review: the focused unit fixtures PASS and the repository release check FAILS on the exact still-open contextual keys. Do not continue.

- [ ] **Step 2: Perform the direct review and install only its exact selected bytes**

Generate or receive candidates through the already approved foundation process. A phonics specialist listens to every selected candidate in isolation and in each named word context, rejects letter names/whole words/trailing vowels/wrong contextual values/coarticulation/noise, confirms commercial-use rights and the grown-up-facing AI disclosure reference, and writes the ignored approval JSON. Automation cannot fill, infer, or flip those decisions.

Run: `node tools/installSoundSeekersContextualUnitMasters.mjs`

Run: `node tools/generateAudioManifest.js`

- [ ] **Step 3: Prove the exact release closure**

Run: `node tools/checkSoundSeekersContextualUnitRelease.mjs`

Run: `node --test tests/unit/soundSeekersContextualUnitRelease.test.js tests/unit/soundSeekersInstructionalAudioDisclosure.test.js tests/unit/soundSeekersPronunciationLexicon.test.js tests/unit/phonemeAudioBank.test.js tests/unit/soundSeekersInstructionContracts.test.js`

Run: `npm run check:quest-release`

Expected: PASS with exactly five current approved keys, 21 formerly blocked records, no release blocker, and no claim about broader mix/listening quality.

- [ ] **Step 4: Verify and commit the exact Task 0 index, then hand off unpushed**

Stage only the 23 exact Task 0 paths listed above. Then run:

```bash
git add src/data/soundSeekersContextualUnitAudio.js src/data/soundSeekersInstructionalAudioDisclosure.js src/data/approvedPhonemeAudio.js src/components/teacher/TeacherSettingsPage.jsx src/components/family/ParentAreaPage.jsx tools/installSoundSeekersContextualUnitMasters.mjs tools/checkSoundSeekersContextualUnitRelease.mjs tools/verifySoundSeekersCutoverIndex.mjs tests/unit/soundSeekersContextualUnitRelease.test.js tests/unit/soundSeekersInstructionalAudioDisclosure.test.js tests/unit/soundSeekersCutoverIndex.test.js tools/checkQuestIntegrity.js docs/audio/SOUND_SEEKERS_CONTEXTUAL_UNIT_REVIEW.md public/audio/phonemes/reviewed/SOUND_SEEKERS_CONTEXTUAL_SOURCE.md public/audio/phonemes/reviewed/contextual-schwa.mp3 public/audio/phonemes/reviewed/contextual-ear-lax.mp3 public/audio/phonemes/reviewed/contextual-ed-id.mp3 public/audio/phonemes/reviewed/contextual-ure-no-y.mp3 public/audio/phonemes/reviewed/contextual-once-onset.mp3 src/data/generated/audioFilePaths.generated.js src/data/generated/audioPhonemePaths.generated.js src/data/generated/audioQuestPaths.generated.js package.json
node tools/verifySoundSeekersCutoverIndex.mjs --task task-0
git diff --cached --check
git commit -m "feat: approve Sound Seekers contextual sound units"
```

Report the five asset hashes, direct-review evidence references, commit, and green release check. Preserve the selected private approval/rights material outside Git according to its retention policy; remove rejected/redundant generated candidates and the task temporary root. Do not push.

## Task 1: Verify the production route, migrate practice reporting/export, and establish the v2 release manifest

**Depends on:** Task 0 and all three dependency plans. Verify the Task 0 commit and five current contextual-master hashes before writing a release manifest.

**Files:**

- Verify only: `src/components/AppSurface.jsx`, `src/components/StudentSoundTrailPage.jsx`, `src/features/soundSeekers/SoundSeekersRoute.jsx`, `src/features/soundSeekers/SoundSeekersGame.jsx`
- Verify only: `src/features/soundSeekers/runtime/soundSeekersProgressController.js`, `tests/unit/soundSeekersProgressController.test.js`, `tests/unit/progressMerge.test.js`
- Create: `src/features/soundSeekers/releaseManifest.js`
- Create: `src/utils/questPracticeReport.js`
- Modify: `src/App.jsx`
- Modify: `src/appState/useAppSessionController.js`
- Modify: `src/components/FinishedReportPage.jsx`
- Modify: `src/components/TeacherTodayPage.jsx`
- Modify: `src/components/TeacherStudentsPage.jsx`
- Modify: `src/utils/teacherProgressOverview.js`
- Modify: `src/utils/worksheets/practicePack.js`
- Modify: `src/utils/teacherInsightActions.js`
- Modify: `src/utils/exportReportSections.js`
- Modify: `src/components/reports/StudentReportViews.jsx`
- Modify: `src/components/reports/studentReportUiUtils.js`
- Modify: `src/data/studentReportingWorkspaceModel.js`
- Modify: `src/utils/exportStudentProgressSimple.js`
- Modify: `src/utils/exportStudentReportWorkbook.js`
- Modify: `src/utils/exportStudentWorkspaceCsv.js`
- Create: `tools/checkSoundSeekersCutover.mjs`
- Create: `tests/unit/soundSeekersCutover.test.js`
- Create: `tests/unit/questPracticeReport.test.js`
- Create: `tests/unit/soundSeekersPracticeReportPolicy.test.js`
- Modify: `tests/unit/classHeatSummary.test.js`
- Modify: `tests/unit/questRuntimeSystems.test.js`
- Modify: `tests/unit/questTeacherTools.test.js`
- Modify: `tests/unit/studentReportingWorkspaceModel.test.js`
- Modify: `tests/unit/reportExportProvenance.test.js`
- Modify: `tests/unit/simpleStudentProgressWorkbook.test.js`
- Modify: `tests/unit/studentWorkspaceExport.test.js`
- Modify: `tests/unit/teacherProgressOverview.test.js`
- Modify: `tests/unit/practicePack.test.js`
- Modify: `tests/unit/teacherInsightActions.test.js`
- Modify: `tests/unit/exportShapes.test.js`
- Modify: `tests/unit/reportSections.test.js`

**Route interface:** `AppSurface` continues to own `APP_VIEWS.PHONICS_QUEST`, exit navigation, scope, and app settings. `StudentSoundTrailPage` remains a forwarding boundary. Runtime Task 5 has already made `SoundSeekersRoute` mount `SoundSeekersGame` through `useSoundSeekersProgressController`; teacher assignment is read only from the normalized stored/hydrated payload and is not forwarded as a child-owned route prop.

**Reporting interface:** `questPracticeReport.js` exports `buildSoundSeekersPracticeReport(state)`, `soundSeekersPracticeTiles(report)`, and `classSoundSeekersPracticeSummary(students)`. It reads only normalized v2 immutable practice events and `practiceReadinessFor()`; it never consumes legacy mastery counters, travel time, Sparks, cosmetics, collision telemetry, or formal-assessment records. Its record shape includes `construct`, `domain`, `target`, `activityType`, `word`, `position`, `transferContext`, independent/supported/revealed response counts, confusion, session span, `practiceStatus`, and `nextTeaching`. Exact statuses are `not_seen_in_practice`, `building_through_practice`, `independent_practice_observed`, and `needs_explicit_teaching_check`. None means mastered, assessed, passed, or Secure.

**Semantic-consumer boundary:** import scans alone are insufficient. Migrate `teacherProgressOverview.js`, `worksheets/practicePack.js`, `teacherInsightActions.js`, and `exportReportSections.js` explicitly. Overview keeps Sound Seekers practice separate from formal answered/accuracy/conclusion; packs select from practice statuses/counts with teacher-check language rather than legacy heat/mastery buckets; insight actions retain `claimBoundary: "practice_only"`; report sections cannot turn v2 rewards/stars/telemetry into literacy conclusions or coins and emit the dedicated practice rows used by exports. The checker inventories imports and semantic patterns including `soundSeekers.heat`, mastery, stones/trickies, telemetry, stars, “weakest”, “got it”, Secure, assessed, and mastered.

- [ ] **Step 1: Verify the already-switched route and write failing manifest/report tests.**

The route assertion must PASS before cutover edits: the production `renderQuest` branch lazy-loads `SoundSeekersRoute`, forwards `progressScopeKey`, `isSoundEnabled`, `accessibilitySettings`, and `onExit`, forwards no assignment prop, and has no production `QuestRoot` import. The controller tests must also prove that child `commit()` calls cannot replace or clear assignment, valid authorized hydration/reset payloads can replace or clear it, and every child cloud upload strips it. If either boundary fails, stop and return the gap to runtime Task 5; do not repair it in cutover and do not write a test that expects `QuestRoot` first.

The new red tests require the missing release manifest and practice adapter, assert the complete v2 report shape across all seven domains, and scan every import/call site of `questReport.js`/`buildQuestMasteryReport`/`questHeatTiles`/`classHeatSummary`. The scan remains red until all production UI, reporting-workspace, workbook, CSV, and simple-export consumers use the practice adapter.

Run: `node --test tests/unit/soundSeekersCutover.test.js tests/unit/questPracticeReport.test.js tests/unit/soundSeekersPracticeReportPolicy.test.js`

Expected: route verification PASS; report/manifest assertions FAIL because the new adapter and manifest do not exist.

- [ ] **Step 2: Implement the practice-only adapter and migrate every consumer.**

Derive one report row per legitimate `(domain,target,activityType,word,position,transferContext)` key, preserving confusion/support/audio truth. Use `practiceReadinessFor()` only to suggest a teacher check; map it to the exact practice statuses above and retain the underlying counts. A missing/unsupported/revealed cue can never enter the independent count. A legacy v1 payload produces an empty v2 practice report and no credit.

UI labels say “Sound Seekers practice,” “independent practice observed,” and “teacher check suggested.” Workbook/CSV/simple exports get a separate Sound Seekers Practice section/sheet with `evidenceKind=practice` and `claimBoundary=practice_only`; they never write practice into formal assessment result, benchmark status, overall phase, or Secure columns. Migrate every production consumer found by the scan, including teacher overview, student report, class summary, workspace model, and all three export formats. Leave `src/utils/questReport.js` present but with zero production consumers so Task 4 can retire it after inventory proof.

Policy tests seed enough perfect v2 practice to meet numeric readiness while formal assessment is absent, then assert the formal overview remains “not assessed” and cannot become `SECURE`. They also reject output keys/values named `secure`, `formalStatus`, `assessmentOutcome`, `mastered`, or `passed`; assert all exported rows retain the practice boundary; and prove `novel_decoding`/connected-text transfer are not relabelled as formal transfer assessments.

- [ ] **Step 3: Define one checked v2 release manifest.**

The frozen `SOUND_SEEKERS_V2_RELEASE_MANIFEST` includes `contentVersion: "sound-seekers-v2"`; production route/component/game paths; both SQL migrations `20260901120000_sound_seekers_learning_v2.sql` and `20260901143000_sound_seekers_v2_content_deck_merge.sql`; public prefixes `/audio/quest-v2/instructions/`, `/audio/quest-v2/scenes/`, and `/game-assets/sound-seekers/v2/`; generated audio/asset manifests; the practice-report adapter; offline policy `cache-on-request-with-explicit-chapter-warming`; and an `instructionalAudioClosure` containing the exact Task 0 registry/source paths plus the sorted five `{soundKey,path,sha256}` records. The release manifest imports those records from `soundSeekersContextualUnitAudio.js`; it does not copy or hand-author their hashes.

The checker validates every manifest entry, provenance file, practice consumer, production route import, and current contextual-master byte hash; it invokes the Task 0 release checker and rejects legacy URLs/imports from the production chunk. `public/game-assets/sound-seekers/avatars-v3` and `characters` are neither presumed v2 nor deleted: classify each after an actual v2 consumer/provenance check.

- [ ] **Step 4: Verify route, reporting, exports, storage, and build.**

Run: `node --test tests/unit/soundSeekersCutover.test.js tests/unit/questPracticeReport.test.js tests/unit/soundSeekersPracticeReportPolicy.test.js tests/unit/soundSeekersProgressController.test.js tests/unit/classHeatSummary.test.js tests/unit/questRuntimeSystems.test.js tests/unit/questTeacherTools.test.js tests/unit/studentReportingWorkspaceModel.test.js tests/unit/reportExportProvenance.test.js tests/unit/simpleStudentProgressWorkbook.test.js tests/unit/studentWorkspaceExport.test.js tests/unit/teacherProgressOverview.test.js tests/unit/practicePack.test.js tests/unit/teacherInsightActions.test.js tests/unit/exportShapes.test.js tests/unit/reportSections.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js tests/unit/questStorageRecovery.test.js`

Run: `node tools/checkSoundSeekersCutover.mjs`

Run the production build only in a fresh validated OS-temporary root:

```bash
(
  set -e
  cutover_task1_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
  cleanup_cutover_task1_build_root() { node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$cutover_task1_build_root"; }
  trap cleanup_cutover_task1_build_root EXIT INT TERM
  npx vite build --outDir "$cutover_task1_build_root/production"
  cleanup_cutover_task1_build_root
  trap - EXIT INT TERM
)
```

Require the recorded root to be absent afterward and prove any pre-existing project `dist/` or `dist-quest-offline/` remained byte-identical.

Expected: PASS. Production already has one v2 route, all teacher/report/export surfaces show practice truth, v1 gives no v2 credit, formal outcomes cannot be elevated, and the old report has zero production consumers.

- [ ] **Step 5: Commit the scoped cutover/report work and hand off unpushed.**

```bash
git add src/features/soundSeekers/releaseManifest.js src/utils/questPracticeReport.js src/App.jsx src/appState/useAppSessionController.js src/components/FinishedReportPage.jsx src/components/TeacherTodayPage.jsx src/components/TeacherStudentsPage.jsx src/utils/teacherProgressOverview.js src/utils/worksheets/practicePack.js src/utils/teacherInsightActions.js src/utils/exportReportSections.js src/components/reports/StudentReportViews.jsx src/components/reports/studentReportUiUtils.js src/data/studentReportingWorkspaceModel.js src/utils/exportStudentProgressSimple.js src/utils/exportStudentReportWorkbook.js src/utils/exportStudentWorkspaceCsv.js tools/checkSoundSeekersCutover.mjs tests/unit/soundSeekersCutover.test.js tests/unit/questPracticeReport.test.js tests/unit/soundSeekersPracticeReportPolicy.test.js tests/unit/classHeatSummary.test.js tests/unit/questRuntimeSystems.test.js tests/unit/questTeacherTools.test.js tests/unit/studentReportingWorkspaceModel.test.js tests/unit/reportExportProvenance.test.js tests/unit/simpleStudentProgressWorkbook.test.js tests/unit/studentWorkspaceExport.test.js tests/unit/teacherProgressOverview.test.js tests/unit/practicePack.test.js tests/unit/teacherInsightActions.test.js tests/unit/exportShapes.test.js tests/unit/reportSections.test.js
node tools/verifySoundSeekersCutoverIndex.mjs --task task-1
git diff --cached --check
git commit -m "feat: cut over Sound Seekers practice reporting"
```

Report the commit and results. Do not push or claim a direct gate.

## Task 2: Prove client and SQL merge parity, status, recovery, and rollback

**Depends on:** Task 1.

**Files:**

- Modify: tests/unit/progressMerge.test.js
- Modify: tests/sql/sound_seekers_learning_v2_merge.sql
- Create: tests/fixtures/soundSeekersV2MergeVectors.json
- Create: tools/verifySoundSeekersV2MergeParity.mjs
- Create: tools/runSoundSeekersV2MergeParitySql.mjs
- Create: tools/writeSoundSeekersV2MigrationStatus.mjs
- Create: tests/unit/soundSeekersV2MergeParityContract.test.js
- Create: tests/unit/runSoundSeekersV2MergeParitySql.test.js
- Create: docs/ops/SOUND_SEEKERS_V2_MIGRATION_RECOVERY.md

**Ownership boundary:** Content/art Task 2 owns the forward migration `20260901143000_sound_seekers_v2_content_deck_merge.sql`, SQL helpers, and self-test. This cutover task owns exhaustive parity vectors and execution only. If a vector exposes a product mismatch, stop and return the change to content/art Task 2 as another reviewed forward migration/helper/test update; do not add an ad hoc cutover migration or edit an applied migration here.

**Parity contract:** Each fixture names `existing`, `incoming`, its canonical raw persisted result, its canonical structurally valid attempt-receipt projection, and its canonical structurally valid five-category deck projection. Node evaluates `computeHydratedValue("phonics_quest","__all__",...)`, normalizes the complete resulting state, derives receipts with `validAttemptReceipts(state)`, and derives deck uses with full-state `validContentDeckUses(state,category)`; SQL evaluates `public.lp_quest_merge_learning_v2`, `public.lp_quest_valid_v2_attempt_receipts(evidence,content_decks,attempt_receipts)`, and `public.lp_quest_valid_v2_content_decks(content_decks,attempt_receipts,evidence)`. The parity tool compares the complete allowlisted raw persisted projection and, separately, the exact valid receipt projection plus exact five-category `{visits,uses}` projection. It excludes only the documented same-device local-checkpoint ownership rule and never excludes evidence, attempt receipts, raw deck entries, conflict markers, subtype, assignment, reset, settings, or structural-validity fields. Canonical binding/catalog coverage remains the JS runtime gate and is additionally asserted for every authorized fixture; SQL never invents that authorship authority.

- [ ] **Step 1: Add vectors and failing parity tests.**

Include v1 plus fresh v2 with assignment retained; v2 plus v1; equal and unequal reset epochs; duplicate IDs; deterministic 1,201-to-1,200 bound; current and incompatible checkpoints; valid/invalid assignments; allowlisted settings/creator appearance; malformed evidence; and forbidden motor/telemetry fields. The tests assert no mismatch and explicitly assert legacy progress has empty v2 evidence, deck, checkpoint, journal, and reward ledgers while valid assignment and allowlisted accessibility/settings remain. A hostile legacy `activityLastServed` field is stripped on both sides; it is never an expected persisted v2 statistic.

The same vector corpus reaches every `contentDecks` category on both branches: `heartWords`, `stories`, `alternatives`, `morphology`, and `transfer`. It uses only current immutable visit/use/receipt shapes. Heart vectors include all four exact `activityType` values; the one s6 owner visit with distinct owner/shared action uses; shared-before-owner raw preservation followed by owner-union structural restoration; invalid/missing heart `ownerActivityType` and use `activityType`; and removal of `activityType` from every non-heart record/event before fingerprinting. Story/transfer vectors include both reciprocal halves with the same transaction/evidence ID, an orphan half preserved raw but excluded valid, its later reciprocal restoration, mismatched pair IDs, and boss/non-boss canonical null/omission behavior. Every category includes identical retry, different-payload same-ID absorbing `visit_conflict`/`use_conflict`, conflict-plus-later-value absorption, malformed/orphan use, and duplicate `(category,contentInstanceId,journeyStep)` claims. Alternative `targetId:null` and morphology `targetId:null` survive; structurally valid but canonically unauthorised raw identities remain in raw merge, appear in the structural SQL/JS projection when their entire receipt/evidence chain is valid, and are excluded by JS `coverageStatus(state)`.

Receipt vectors cover every action/result shape: wrong placement/story responses with one correction and one event; correct intermediate placement responses; final alternative placement; zero-event morphology completion; and final story receipts with reciprocal story/transfer uses. They cover contiguous decision/attempt ordinals, exact event/use ownership, the support `0/1/2/3` and revealed `false/false/false/true` ladder, the third-miss model boundary, dangling evidence/use dependencies that later repair, duplicate ownership, malformed hashes/IDs/order, and different-payload same-ID absorbing `attempt_receipt_conflict`. A repaired dangling receipt becomes valid only after its exact dependency arrives; a conflicted receipt and every dependent use remain invalid after every regrouping. JS and SQL must produce the same receipt set before comparing valid uses.

Evidence vectors include all seven domains, every valid heart-word subtype, a missing legacy subtype, an invalid subtype, an unrelated-domain subtype, canonical nulls, and absent non-heart `activityType`. Assertions prove valid heart subtypes survive unchanged, invalid/unrelated values normalize identically before evidence-ID dedupe and receipt validation, no category disappears, no derived count/recency field persists, and no heart event fans out into a GPC domain. Run identical retry, left/right, and A/B/C regrouping for raw, valid-receipt, and valid-deck projections so parity proves commutativity, associativity, idempotence, convergence, later dependency restoration, and absorbing conflict propagation rather than one happy-path result.

- [ ] **Step 2: Run local client and SQL checks.**

Run: `node --test tests/unit/progressMerge.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/soundSeekersV2MergeParityContract.test.js tests/unit/runSoundSeekersV2MergeParitySql.test.js`

Run: `node tools/runSoundSeekersContentDeckSqlSelftest.mjs`

Run: `node tools/runSoundSeekersV2MergeParitySql.mjs`

Expected: both runners PASS using separate task-owned ephemeral Unix-socket PostgreSQL clusters and remove them fully. They never connect to an existing database, accept a caller target, apply a hosted migration, or modify production data. Missing local PostgreSQL binaries report the exact blocked direct gate and block this task; they are not treated as a pass.

`runSoundSeekersV2MergeParitySql.mjs` is the cutover-owned direct parity runner. It exports a frozen `SOUND_SEEKERS_V2_MERGE_PARITY_SQL_FILES` containing exactly `supabase/verify/sound_seekers_v2_content_deck_local_bootstrap.sql`, `supabase/migrations/20260614090000_progress_forward_merge.sql`, `supabase/migrations/20260715090000_phonics_quest_merge.sql`, `supabase/migrations/20260901120000_sound_seekers_learning_v2.sql`, `supabase/migrations/20260901143000_sound_seekers_v2_content_deck_merge.sql`, and `tests/sql/sound_seekers_learning_v2_merge.sql`, plus pure/injectable main/runner functions covered by its unit test. It accepts no CLI arguments or PostgreSQL URL/database/host/user/service/options environment. It imports the content-deck runner's `sanitizedPostgresEnvironment()` and deletes `DATABASE_URL`, task URL variables, and every `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD`/`PGSERVICE`/`PGSERVICEFILE`/`PGOPTIONS` value before every probe or command; it never parses or forwards one. `runCommand(binary,args,{env})` receives argument arrays without a shell and treats a thrown error, `status:null`, or every nonzero status as a hard failure except an `ENOENT` from one of the five preflight probes.

Before any filesystem/database mutation it probes `initdb`, `pg_ctl`, `psql`, `createdb`, and `dropdb` with `--version`. It then creates one injected `mkdtemp` root matching `literacypath-sound-seekers-parity-sql-[A-Za-z0-9_-]+`, with only resolved `data` and `socket` descendants, and enters `try/finally` immediately after `mkdtemp`. It initializes exactly with `initdb -D <data> --auth=trust --username=postgres --no-locale --encoding=UTF8`; chooses independent cryptographic values for a port in `20000..60999` and database name `literacypath_sound_seekers_parity_[0-9a-f]{24}`; and starts exactly with `pg_ctl -D <data> -w -o "-k <socket> -p <port> -c listen_addresses='' -c unix_socket_permissions=0700" start`. Thus trust authentication is reachable only through the task-owned mode-0700 Unix socket and never TCP. Database creation, every `psql -X --set=ON_ERROR_STOP=1` file call, termination, and drop name the same explicit `-h <socket> -p <port> -U postgres` target, and every file call also names `-d <database> -f <literal-file>`. No `.psqlrc`, libpq discovery, existing cluster, caller credential, migration discovery, or network listener can participate.

Cleanup tracks attempted stages rather than successful returns. After any create attempt it terminates only the generated database through the socket and calls socket-bound `dropdb --if-exists`; after any start attempt it runs `pg_ctl -D <data> -m immediate -w stop`; finally it recursively removes only the one root after proving its resolved basename matches the exact prefix, it is a strict descendant of the injected temporary directory, and both owned descendants remain beneath it. Terminate, drop, stop, and root removal are all attempted even after an earlier cleanup error. A primary failure remains primary with only redacted cleanup-stage names attached; a cleanup-only failure is hard. The unit test asserts every exact command/target/environment, `listen_addresses=''`, mode-0700 socket, distinct randomness, fixed SQL order, no TCP/URL leakage, path-containment rejection, every status/throw/partial-start failure, combined primary/cleanup failures, and source preservation on unsafe deletion. The CLI prints exact PASS only after SQL and all cleanup succeed, exact `BLOCKED: SQL_DIRECT_GATE_UNAVAILABLE` with exit 2 before mutation when a binary is absent, and a redacted exit 1 for every other failure.

- [ ] **Step 3: Record durable recovery governance and generated run status separately.**

The durable recovery document defines owners, prerequisites, backup check, migration order, stop-write decision, prior-release restore, queue/row preservation, forward correction, and no-v2-to-v1 translation. It describes procedures and schemas only; it never claims a run happened.

`writeSoundSeekersV2MigrationStatus.mjs` writes `<durable-evidence-root>/migration/<run-id>/status.json` with separate fields for both isolated local runner results; both migration files and hosted history; privacy-safe pre/post row count/fingerprint; backup/recovery owner; legacy-row forward-write preservation; authenticated all-category canonical-reducer sync counts; project fingerprint; commit; timestamp; operator role; and result. Default hosted states are `not_observed`; only an authorized direct run changes them. It rejects a hosted PASS when either migration identifier/hash is absent, the pre/post row fingerprint differs, the legacy row was deleted/recreated, the valid visit counts are not exactly `{heartWords:80,stories:40,alternatives:4,morphology:1,transfer:40}`, the valid use counts are not exactly `{heartWords:81,stories:40,alternatives:4,morphology:1,transfer:40}`, canonical covered-record counts are not exactly `{heartWords:60,stories:40,alternatives:4,morphology:1,transfer:40}`, or the authenticated commit differs from the candidate. The additional s6 use is the shared `s6-primary` action on its owner's existing visit; it never creates an 81st heart visit or a 61st covered word. The generated status is ignored and never copied into `docs/` or staged.

Recovery: on migration/cutover failure stop new writes under the incident owner, preserve rows and queue, restore only the exact provider deployment captured immediately before promotion, and use a forward correction if needed. Never infer the rollback target from branch name or remote main, delete child rows, mutate/replay queues as part of app rollback, or translate v2 progress back to v1.

- [ ] **Step 4: Verify parity and recovery evidence.**

Run: `node --test tests/unit/progressMerge.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/soundSeekersV2MergeParityContract.test.js tests/unit/runSoundSeekersV2MergeParitySql.test.js tests/unit/questStorageRecovery.test.js`

Run: `node tools/verifySoundSeekersV2MergeParity.mjs --output "$SOUND_SEEKERS_V2_EVIDENCE_ROOT/migration/local-parity.json"`

Run: `node tools/runSoundSeekersContentDeckSqlSelftest.mjs`

Run: `node tools/runSoundSeekersV2MergeParitySql.mjs`

Expected: PASS across every category/subtype and regrouping; malformed/motor data has no learning effect; generated hosted status remains `not_observed` unless directly observed otherwise.

- [ ] **Step 5: Commit parity fixtures/governance and hand off unpushed.**

```bash
git add tests/unit/progressMerge.test.js tests/sql/sound_seekers_learning_v2_merge.sql tests/fixtures/soundSeekersV2MergeVectors.json tools/verifySoundSeekersV2MergeParity.mjs tools/runSoundSeekersV2MergeParitySql.mjs tools/writeSoundSeekersV2MigrationStatus.mjs tests/unit/soundSeekersV2MergeParityContract.test.js tests/unit/runSoundSeekersV2MergeParitySql.test.js docs/ops/SOUND_SEEKERS_V2_MIGRATION_RECOVERY.md
node tools/verifySoundSeekersCutoverIndex.mjs --task task-2
git diff --cached --check
git commit -m "test: prove Sound Seekers client SQL parity"
```

Confirm no `.artifacts` path is staged. Do not push.

## Task 3: Rebuild offline and generated manifests around v2 prefixes

**Depends on:** Tasks 1–2, accepted content/art manifests, and authorized read-only provider access to identify and download the exact currently serving last-v1 production offline release before its source is retired. Missing provider identity/bytes is a hard stop, not permission to synthesize a fixture.

**Files:**

- Modify: tools/viteQuestOfflinePlugin.mjs, tools/checkQuestOffline.mjs
- Modify: tools/buildQuestOfflineUpdateFixtures.mjs, tools/serveQuestOfflineUpdateFixtures.mjs
- Modify: tests/quest-offline/quest-offline.spec.js, tests/quest-update/quest-update.spec.js, tests/quest-soak/quest-soak.spec.js
- Create: tests/fixtures/soundSeekersLegacyOfflineRelease.json
- Create: tests/fixtures/soundSeekersLegacyOfflineRelease.tar
- Modify: package.json
- Create: tools/checkSoundSeekersV2ReleaseManifest.mjs
- Create: tools/lib/soundSeekersEvidenceTransfer.mjs
- Create: tests/unit/soundSeekersOfflineContract.test.js
- Create: tests/unit/soundSeekersEvidenceTransfer.test.js

- [ ] **Step 1: Add failing v2 offline/update tests.**

The contract test proves offline has exactly one v2 runtime and only manifest-backed warmed media. `soundSeekersLegacyOfflineRelease.json` is the frozen test-only manifest for the last production v1 offline release. Before legacy source retirement, Task 3 obtains the exact currently serving v1 production deployment metadata through the authorized provider path and records its full 40-character Git SHA, deployment ID, build ID, cache namespaces, archive SHA-256/byte length, and a sorted record for every archived response containing exactly `{url,sha256,byteLength,contentType,role}`. `soundSeekersLegacyOfflineRelease.tar` is a deterministic, path-safe archive of that deployment's actual `index.html`, `sw.js`, complete executable JS/CSS/chunk closure, offline build manifest, representative manifest-named Sound Seekers media responses, and a data-free v1 checkpoint fixture. It contains no credentials or child data, has normalized ordering, modes, and timestamps, and is never imported or served by production code. The builder rejects an absent provider identity, an archive not bound to that exact v1 deployment/SHA, a missing/extra/duplicate response, a hash/length/content-type mismatch, a symlink/hardlink/special file, an absolute/traversing path, or an executable closure that does not match the manifest. No Git history or retired source is required at test time.

The update builder extracts that exact hash-verified archive to a task-owned temporary root and installs its real v1 worker and executable closure in an isolated browser context before offering v2. Tests prove the controlling worker, build ID, executable response URLs, and response hashes are the pinned v1 values before activation. The still-controlled page remains wholly v1; a failed v2 install retains the complete prior cache; successful activation commits the complete v2 cache before claiming clients; the next navigation is wholly v2; obsolete v1 runtime/media caches are removed only after that successful claim; and no response combines a v1 executable with v2 media or vice versa. The legacy checkpoint normalizes to a fresh v2 route with zero evidence/use/reward credit while allowlisted settings survive. If the exact last-v1 deployment cannot be obtained and hash-bound before retirement, Task 3 stops; a synthetic facsimile or same-source A/B build cannot satisfy this gate.

- [ ] **Step 2: Replace hard-coded legacy runtime/media assumptions.**

Use the release manifest, Vite manifest, generated audio manifests, and tools/lib/soundSeekersV2AssetManifest.mjs. Regenerate rather than hand-edit manifests. Warm one declared biome, one instruction, and one narration; retain cache-on-request and safe range behavior. A missing/hash-mismatched entry or interrupted install retains the complete prior cache, does not call `skipWaiting`/claim, and presents retry. Only a complete hash-verified v2 install may activate and delete the exact legacy namespaces from the frozen fixture. Corrupt, missing, v1, or incompatible checkpoint resumes safely without evidence.

Delete hard-coded QuestRoot, QuestPixelWorld, Pixel chunks, and old URLs from this tooling only after Task 1 passes.

- [ ] **Step 3: Run focused offline, update, soak, and clean-install proof.**

Build and exercise offline/update/soak only through one fresh validated OS-temporary root; do not call the current `build:quest-offline-test` script because it writes project `dist-quest-offline/`:

```bash
(
  set -e
  cutover_task3_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
  cleanup_cutover_task3_build_root() { node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$cutover_task3_build_root"; }
  trap cleanup_cutover_task3_build_root EXIT INT TERM
  QUEST_RELEASE_PREVIEW=true npx vite build --outDir "$cutover_task3_build_root/offline"
  QUEST_OFFLINE_DIST="$cutover_task3_build_root/offline" npm run check:quest-offline
  QUEST_OFFLINE_DIST="$cutover_task3_build_root/offline" npm run test:quest-offline
  QUEST_OFFLINE_DIST="$cutover_task3_build_root/offline" npm run test:quest-update
  QUEST_OFFLINE_DIST="$cutover_task3_build_root/offline" npm run test:quest-soak-smoke
  cleanup_cutover_task3_build_root
  trap - EXIT INT TERM
)
```

Run: node --test tests/unit/soundSeekersOfflineContract.test.js tests/unit/soundSeekersEvidenceTransfer.test.js

Expected: PASS with v2 media only; this is browser/offline-harness evidence, not iPad evidence.

From a new disposable worktree with no node_modules, run `npm ci`, manifest generation/check, and the same marker-bound build/test block above using a fresh tool-created root inside the OS temporary directory. Build its production and offline outputs only at that root's exact `production` and `offline` children, pass the exact `QUEST_OFFLINE_DIST` to every offline/update/soak consumer, and clean only through `--clean-build-root` in a failure-safe trap. Never invoke generic `npm run build` or `build:quest-offline-test`, and prove any project `dist/` or `dist-quest-offline/` that pre-existed remained byte-identical. Record Node/npm versions and do not copy caches, candidates, pre-existing artifacts, or credentials into it. Only the newly produced task evidence may leave it, through the hash-verified transfer below.

Write generated manifests/logs first to the disposable checkout's task-owned temporary evidence tree. Use `transferSoundSeekersEvidence()` from `tools/lib/soundSeekersEvidenceTransfer.mjs` to install the complete hash manifest and bytes at the previously resolved external `<durable-evidence-root>/offline/<run-id>/`; re-read and verify every destination hash before removing any source. The helper accepts only two absolute, non-overlapping task-owned roots, rejects a destination outside the durable Sound Seekers evidence root, copies through a unique temporary sibling, and never removes its source. Its tests inject source/destination mismatch, collision, symlink, special-file, partial-copy, rename, hash, and cleanup failures and prove the source remains recoverable. The Task 0/content/art generated shipping manifests are inputs and must remain byte-identical in this task; a tracked manifest diff stops and returns to its owning generator task. Only the 14 exact Task 3 paths listed above may be staged. Remove the exact disposable worktree and its task-created `node_modules`, build directories, worker servers, browser contexts, and temporary caches only after the external evidence transfer is hash-verified; preserve the complete ignored durable run record.

- [ ] **Step 4: Commit offline/update integration and hand off unpushed.**

```bash
git add tools/viteQuestOfflinePlugin.mjs tools/checkQuestOffline.mjs tools/buildQuestOfflineUpdateFixtures.mjs tools/serveQuestOfflineUpdateFixtures.mjs tests/quest-offline/quest-offline.spec.js tests/quest-update/quest-update.spec.js tests/quest-soak/quest-soak.spec.js tests/fixtures/soundSeekersLegacyOfflineRelease.json tests/fixtures/soundSeekersLegacyOfflineRelease.tar package.json tools/checkSoundSeekersV2ReleaseManifest.mjs tools/lib/soundSeekersEvidenceTransfer.mjs tests/unit/soundSeekersOfflineContract.test.js tests/unit/soundSeekersEvidenceTransfer.test.js
node tools/verifySoundSeekersCutoverIndex.mjs --task task-3
git diff --cached --check
git commit -m "test: gate Sound Seekers v2 offline updates"
```

Confirm no disposable-worktree or `.artifacts` output is staged. Do not push.

## Task 4: Retire legacy material only after consumer-switch and zero-reference proof

**Depends on:** Tasks 1–3.

**Files:**

- Create: tools/checkSoundSeekersLegacyReferences.mjs
- Create: tools/checkSoundSeekersDocsAuthority.mjs
- Create: tests/unit/soundSeekersLegacyRetirement.test.js
- Create: tests/unit/soundSeekersReleaseContract.test.js
- Modify: package.json
- Modify: `.github/workflows/ci.yml`
- Modify: `tools/releaseGate.mjs`
- Modify: `tools/checkQuestIntegrity.js`
- Modify or retire after inventory: `tools/checkQuestPacing.mjs`
- Modify or retire after inventory: `tools/checkQuestArt.mjs`
- Modify or retire after inventory: `tools/checkQuestRouteVisual.mjs`
- Modify: `tools/checkQuestDeviceEvidence.mjs`
- Modify: `tools/checkQuestHumanEvidence.mjs`
- Modify: `tools/sealQuestHumanObservation.mjs`
- Create: `src/features/soundSeekers/content/chapterIdentityCatalog.js`
- Modify: `src/features/soundSeekers/content/chapters/index.js`
- Modify: `src/data/questSequence.js`
- Modify or retire after zero-consumer proof: `src/data/questChapters.js`
- Modify or retire after zero-consumer proof: `src/data/questMechanicMatrix.js`
- Modify: `src/utils/questStore.js`
- Modify (confirmed semantic v1 consumer): `src/policy/learningPolicy.js`
- Modify (confirmed semantic v1 consumer): `src/components/StudentHomePage.jsx`
- Modify (confirmed semantic v1 consumer): `src/utils/treasureTrail.js`
- Modify: `tests/unit/studentHomeRecommendationPolicy.test.js`
- Modify: `tests/unit/treasureTrail.test.js`
- Rewrite for v2: `docs/SOUND_SEEKERS_RELEASE_BIBLE.md`
- Rewrite for v2: `docs/SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md`
- Rewrite for v2: `docs/SOUND_SEEKERS_WORLD_V2_BLUEPRINT.md`
- Modify: `docs/design/GAME_DESIGN_BIBLE.md`
- Modify: `docs/audio/SOUND_SEEKERS_CONTEXTUAL_UNIT_REVIEW.md`
- Modify: `docs/INDEX.md`
- Modify: `docs/CURRENT_SYSTEM_CLEANUP_2026-07-31.md`
- Modify or delete after inventory: `docs/SOUND_SEEKERS_3D_ASSET_NOTICES.md`
- Delete/modify: only paths classified retireLegacy by the generated inventory

**Inventory contract:** Scan `src`, `preview`, `tests`, `tools`, `public`, `docs`, `.github/workflows`, `package.json`, and Vite/Playwright configs for parsed static/dynamic imports and exports, JSX/CSS URLs, service-worker/cache entries, generated manifests, scripts, release-gate entries, CI jobs, Bible authority claims, index links, cleanup claims, semantic reads of the legacy progress shape, built manifests, and dead exported Sound Seekers symbols/fields. Classify every candidate path and every legacy symbol/field within a mixed shared path as `retainShared`, `replaceV2`, `retireLegacy`, or `blockedByConsumer`. A path containing any `replaceV2` symbol is itself `replaceV2`; `retainShared` cannot hide obsolete members. Each JSON record contains exact `{path,pathClassification,symbols,fields,urls,consumers,reasons}`, and each symbol/field record includes its parsed declaration location plus complete parsed/static consumers. Generate and continuously maintain two reviewed NUL-delimited pathsets from that inventory: `retire-paths.nul` for every `retireLegacy` deletion and `replace-v2-paths.nul` for every inventory-discovered source that must be added or modified as `replaceV2`. No newline-delimited, regex-only import authority, or shell-word-split reconstruction is allowed.

Initial path candidates are QuestRoot, QuestPixelWorld, QuestTrail2D, QuestHub, questPixelRuntime, legacy Pixel/2D/Three child-game tools/tests, directly owned `public/game-assets/quest-pixel`, obsolete Sound Seekers manifests, `src/data/questSequence.js`, `src/data/questChapters.js`, `src/data/questMechanicMatrix.js`, and every current consumer of those modules. Initial symbol/field candidates include `loadQuestProgress`, `saveQuestProgress`, `buildQuestMasteryReport`, `questHeatTiles`, `classHeatSummary`, `QUEST_ACTS`, `QUEST_TRAILS`, `QUEST_SHELL_IDS`, v1 trail/reward/checkpoint readers, and the deferred stop fields `act`, `world`, `shells`, `heartWords`, `pages`, and `boss`. Start only the v2 state/load/save functions inside `questStore.js`, the legacy-input-to-fresh-v2 normalizer inside `progressMerge.js`, questMastery.js, questReviewScheduler.js, questCorrection.js, cuePlayer.js, shared dependencies, and Story Quest material as `retainShared`; the old quest-store bridge exports are `replaceV2` until removed even though their file is shared.

The cutover owns the exact source-data transition deferred by content/art Task 1. Move—not copy—the still-live chapter title/cast/reward/audio identity records from `src/data/questChapters.js` into new `src/features/soundSeekers/content/chapterIdentityCatalog.js`, update `chapters/index.js` and every v2 consumer to that sole catalog, assert a bijective eight-ID/32-character join, then retire `questChapters.js` once no non-v2 consumer remains. Keep `src/data/questSequence.js` only as the immutable v2 stop/teach/word-order source: change every v2 heart-word check to the canonical Task 2 `heartWordRecords.js`, every alternative/story/boss consumer to its Task 1–3 catalog, remove the six deferred fields and legacy `QUEST_ACTS`/trail/shell projections after zero-consumer proof, and update the integrity checker to validate the v2 authorities directly. Do not delete the v1-to-fresh-v2 normalization branch or any shared Story Quest record; old hosted payloads still require fail-safe normalization without credit.

Current-source inspection already confirms three semantic `replaceV2` consumers that an import-only scan can miss: `src/policy/learningPolicy.js` counts legacy trail IDs, `src/components/StudentHomePage.jsx` derives continuation from `questSequence`/v1 quest progress, and `src/utils/treasureTrail.js` awards from `soundSeekers.trail.stars`. The final inventory must include all three and their affected tests in `replace-v2-paths.nul` unless a preceding committed task has already removed the v1 read and the checker proves the replacement exact; they may not be silently classified `retainShared` merely because their filenames are generic.

- [ ] **Step 1: Write blocking test and generate inventory.**

The test first proves production route and offline contract are v2, `questReport.js` and the quest-store v1 bridge exports have zero production/test-helper consumers, `chapterIdentityCatalog.js` is the sole eight-chapter identity authority, `QUEST_STOPS` exposes no deferred field or old trail projection, and no `blockedByConsumer` path/symbol/field remains. Its retirement assertion then requires zero existing `retireLegacy` paths, parsed references, forbidden URLs, active Pixel/3D authority claims, stale CI jobs, stale release-gate commands, or obsolete exports hidden inside a retained shared module. The exact hash-bound legacy offline manifest/archive pair is the sole explicit regression exception: it remains test-only, is reachable only from the update-fixture builder/tests, has no application, preview, service-worker, shipping-manifest, package-runtime, or production import, and cannot be used as a runtime fallback library. The inventory records this exception at member/consumer level rather than treating its executable fixture bytes as live legacy product authority.

Run: `node tools/checkSoundSeekersLegacyReferences.mjs --report .artifacts/sound-seekers-v2/retirement/inventory.json --retire-pathspec .artifacts/sound-seekers-v2/retirement/retire-paths.nul --replace-v2-pathspec .artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul`

Run: `node tools/checkSoundSeekersDocsAuthority.mjs`

Expected: every candidate, consumer, classification, and block reason is printed. Review before deletion.

- [ ] **Step 2: Delete only inventory-proven legacy paths.**

Review every NUL-delimited path in both pathsets and every mixed-path symbol/field decision against the JSON inventory. Use `git rm --pathspec-from-file=.artifacts/sound-seekers-v2/retirement/retire-paths.nul --pathspec-file-nul` only after the retirement set contains no `retainShared`/`replaceV2`/`blockedByConsumer` item. Repair every direct, parsed, dynamic, semantic, symbol, and field consumer—including the exact source-data move above—regenerate the inventory, and require every resulting modified/created inventory source to appear once in the reviewed `replace-v2-paths.nul`; stage those replacements with `git add -A --pathspec-from-file=.artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul --pathspec-file-nul`. Remove obsolete package scripts, dead mixed-file exports, and renderer-specific checks; regenerate shipping manifests. Do not remove hosted rows, the legacy-input normalizer, the v2 store/practice-report/export adapter, Phaser, three when another game still imports it, generic UI/audio assets, Story Quest material, or blocked paths.

Rewrite the release Bible, curriculum mechanic matrix, and world blueprint around the authoritative v2 spec: 40 stops/103 teach entries, `s8`/`s17` reviews, 60 heart words, 32 existing identities, six canonical underscore powers, seven domains, one 2D runtime, canonical pronunciation metadata, practice-only reporting, offline fallback, and direct-gate boundaries. Update the general game Bible link/summary, contextual-unit review links, docs index, and cleanup ledger. Delete the 3D notice only if its assets have no retained shared consumer; otherwise relabel its exact retained non-Sound-Seekers scope without leaving it as current Sound Seekers authority.

Replace Pixel/3D/chapter-one CI and `releaseGate.mjs` entries with the aggregate Task 0 contextual-audio, v2 content, art, asset, runtime, report-policy, raw/valid SQL parity, atomic legacy-offline-update, strict path/symbol/field retirement, and production-route gates. Update/retire `checkQuestPacing`, `checkQuestArt`, and route visual gates so they validate v2 catalogs/manifest rather than legacy corridors. Update the confirmed `learningPolicy.js`, `StudentHomePage.jsx`, and `treasureTrail.js` consumers to read normalized v2 journey/practice/reward state and adjust their focused tests; no continuation label, home count, gem, badge, or recommendation may be inferred from the retired v1 `trail.stars`, trail-ID, or checkpoint shape. Keep device/human tools direct and v2-schema-aware; neither may infer acceptance from browser output. `package.json` has one current `check:sound-seekers-release` aggregate and no live Pixel bundle script.

- [ ] **Step 3: Prove retirement and scoped cleanup.**

Run: node tools/checkSoundSeekersLegacyReferences.mjs --strict

Run: `node tools/checkSoundSeekersDocsAuthority.mjs`

Run: `node --test tests/unit/soundSeekersLegacyRetirement.test.js tests/unit/soundSeekersReleaseContract.test.js tests/unit/soundSeekersPracticeReportPolicy.test.js tests/unit/studentHomeRecommendationPolicy.test.js tests/unit/treasureTrail.test.js`

Run: `npm run check:sound-seekers-release`

Run: `npm run lint -- --max-warnings=0`

Run the production build only in a fresh validated OS-temporary root:

```bash
(
  set -e
  cutover_task4_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
  cleanup_cutover_task4_build_root() { node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$cutover_task4_build_root"; }
  trap cleanup_cutover_task4_build_root EXIT INT TERM
  npx vite build --outDir "$cutover_task4_build_root/production"
  cleanup_cutover_task4_build_root
  trap - EXIT INT TERM
)
```

Require the recorded root to be absent afterward and prove any pre-existing project `dist/` or `dist-quest-offline/` remained byte-identical.

Run: npm run check:repo-hygiene

Expected: PASS with zero legacy files/references/URLs/symbols/deferred fields, one v2 runtime, one v2 chapter identity catalog, and no home/recommendation/treasure consumer reading the retired v1 Sound Seekers shape. Delete only task-created failed conversions, rejected art, stale screenshots, test dist folders, and no-longer-needed ignored candidates. Preserve accepted Task 0 provenance/current evidence and broader open-listening evidence; report every removal and whether it is recoverable.

- [ ] **Step 4: Commit the reviewed retirement set and hand off unpushed.**

Regenerate the final inventory after all repairs so its two reviewed NUL-safe pathsets describe the finished tree, not the initial scan. The retirement checker must support `--verify-index`: it compares `git diff --cached --name-status -z` against the exact union of the reviewed pathsets, requires every `retireLegacy` path to be staged as deletion, requires every `replaceV2` path to be staged with its actual add/modify/rename status, and rejects every missing or extra cached path. All durable task additions, rewrites, semantic-consumer changes, and conditional retained documents are classified into `replace-v2-paths.nul`; `.artifacts` itself remains ignored and unstaged.

```bash
node tools/checkSoundSeekersLegacyReferences.mjs --report .artifacts/sound-seekers-v2/retirement/inventory.json --retire-pathspec .artifacts/sound-seekers-v2/retirement/retire-paths.nul --replace-v2-pathspec .artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul
git rm --pathspec-from-file=.artifacts/sound-seekers-v2/retirement/retire-paths.nul --pathspec-file-nul
git add -A --pathspec-from-file=.artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul --pathspec-file-nul
node tools/checkSoundSeekersLegacyReferences.mjs --verify-index --report .artifacts/sound-seekers-v2/retirement/inventory.json --retire-pathspec .artifacts/sound-seekers-v2/retirement/retire-paths.nul --replace-v2-pathspec .artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul
git diff --cached --check
git diff --cached --name-status
git commit -m "chore: retire legacy Sound Seekers runtime"
```

If a conditional tool/doc is inventory-proven deleted, it appears only in `retire-paths.nul`; if retained and rewritten, it appears only in `replace-v2-paths.nul`. In particular, a retained/relabelled 3D notice and the confirmed `src/policy/learningPolicy.js`, `src/components/StudentHomePage.jsx`, and `src/utils/treasureTrail.js` replacements cannot be left dirty or silently omitted. Do not stage `.artifacts` or push.

## Task 5: Fresh browser, accessibility, security/privacy, and failure-mode evidence

**Depends on:** Tasks 1–4.

**Files:**

- Modify: playwright.quest.config.js
- Create: tests/browser/sound-seekers-production-route.spec.js
- Create: tests/browser/sound-seekers-failure-modes.spec.js
- Create: tests/browser/sound-seekers-legacy-save-cutover.spec.js
- Create: tools/lib/soundSeekersV2ReleaseEvidenceSchema.mjs
- Create: docs/ops/SOUND_SEEKERS_V2_RELEASE_GOVERNANCE.md
- Create: tests/unit/soundSeekersReleaseEvidencePolicy.test.js

Configure three named projects: Chromium, Firefox, and WebKit. Each new cutover test opens the production route, not a preview. Label WebKit browser automation, not physical iPad. Existing `sound-seekers-*.spec.js` files remain owned by their prior plans; if this matrix exposes a product/test gap, return it to that owner rather than silently editing an unlisted file here.

- [ ] **Step 1: Add production-route and failure-mode tests.**

For keyboard, pointer, touch, and switch-compatible focus, assert the same exact `(instructionId,powerId,expectedAction,recordsDomain)` decision variant and no legacy runtime. Exercise one authored stop/phase/content preview fixture for every current decision contract, positive completion for each, and rejection of every foreign transcript including siblings within Contrast Sort, Memory Delivery, and Blend Bridge. Test audio failure, storage failure, offline/resume, blocked media, corrupt payload, stale checkpoint, first-load offline, failed cache update, and deduplicated resumed IDs; each failure is recoverable and emits no evidence.

`sound-seekers-legacy-save-cutover.spec.js` uses the real production `APP_VIEWS.PHONICS_QUEST` route and real scoped quest-store/controller boundary, never the preview route or a reducer shortcut. Before navigation it writes a complete v1 fixture containing high mastery, s39 checkpoint, rewards/stars, old encounter history, invalid answer-like fields, valid teacher assignment, and allowlisted accessibility/settings. It also exercises the real `lp-progress-hydrated` notice after the mocked authorized remote row becomes that same v1 payload. The child opens at fresh v2 s1 with empty evidence/content decks/checkpoint/journal/rewards, no legacy currency or completion, preserved valid assignment/settings, and no save merely from viewing. After one visible legitimate learning loop, the existing scoped row/key is forward-written as normalized v2 through the production queue; reload remains at that legitimate v2 position, does not resurrect v1 credit, and preserves the privacy sanitizer. The test records the same row identity before/after and asserts no delete/recreate call. Invalid legacy assignment/settings are discarded rather than imported. This is behavioral local/mocked-host proof; Task 6 owns the direct authenticated hosted equivalent.

Also prove 56px primary targets; 320px at 200% zoom; focus order/no trap across Phaser/React portal/fallback; reduced motion final state; audio interruption/suspension/reused element; truthful six powers plus genuinely novel_decoding; and that all seven domains appear only on named explicit actions, not reskinned outcomes.

- [ ] **Step 2: Run fresh browser and policy checks.**

Run: `npx playwright test tests/browser/sound-seekers-production-route.spec.js tests/browser/sound-seekers-failure-modes.spec.js tests/browser/sound-seekers-*.spec.js --config=playwright.quest.config.js --project=chromium --project=firefox --project=webkit`

Run: `node --test tests/unit/soundSeekersReleaseEvidencePolicy.test.js tests/unit/soundSeekersPracticeReportPolicy.test.js tests/unit/soundSeekersReleaseContract.test.js`

Then run current repository security, privacy, accessibility, integrity, release, and `npm test` checks. Run the production build only through this explicit temporary-root block:

```bash
(
  set -e
  cutover_task5_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
  cleanup_cutover_task5_build_root() { node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$cutover_task5_build_root"; }
  trap cleanup_cutover_task5_build_root EXIT INT TERM
  npx vite build --outDir "$cutover_task5_build_root/production"
  cleanup_cutover_task5_build_root
  trap - EXIT INT TERM
)
```

Before root creation, record whether project `dist/` and `dist-quest-offline/` exist and, when present, their complete byte manifests. Require the exact tool-created root absent afterward and both project manifests byte-identical; never substitute generic `npm run build`, `build:quest-offline-test`, `rm`, or a glob. Record command, commit, browser/Node/npm versions, viewport, reduced-motion setting, and outcome. Verify child/network payload excludes motor telemetry, answer keys, formal status, and unexpected identifiers; assignment is accepted only through the existing authorized boundary.

Write automated run output to `$SOUND_SEEKERS_V2_EVIDENCE_ROOT/release/<run-id>/automated.json` using `soundSeekersV2ReleaseEvidenceSchema.mjs`. The schema rejects a PASS without command, exact commit, environment, start/end time, exit status, and artifact reference; it also rejects any claim that WebKit automation is a physical-iPad pass. No generated Markdown or JSON run report belongs under `docs/`.

- [ ] **Step 3: Keep direct gates truthful.**

Create `$SOUND_SEEKERS_V2_EVIDENCE_ROOT/release/<run-id>/direct-gates.json` with exact rows and IDs. `contextual_instructional_audio` is initialized from Task 0's current five hash-bound approvals and must be `PASSED` before this task; it can never be downgraded to an optional open row. The rows initially `OPEN` are `broader_human_listening` (complete instructions, narration, music ducking, and material balance), `human_visual_semantic_major_states`, `physical_ipad_safari`, `assistive_technology_switch`, `observed_child_playability`, `representative_low_power_performance`, `authenticated_hosted_v2_route_sync`, `migration_20260901120000`, `migration_20260901143000`, `production_rollback_exact_prior_deployment`, `production_deployment_exact_sha`, and `production_operations_observation`.

The human visual row covers all eight current biome background/crop hashes plus the canonical child-facing major-state IDs exported by the evidence schema: campaign map, arrival/problem, teach, each of six powers, first/second/third correction, connected-text pre-choice/action/resolved/direct meaning, Wonder, repair/payoff, journal/reward, creator, simplified scene, reduced motion, offline retry, and code-native background failure. A review record must name every required hash/state ID and cannot pass from the Task 4/5 agent inspection or browser screenshot checker. The low-power row records device model, OS/browser, power mode, exact commit/build, first-load and resume time, peak memory when the platform exposes it, frame pacing/dropped-frame observation, input response, and instructional-audio start/recovery. It remains `OPEN` until representative supported low-power hardware is measured; no numeric budget or pass threshold may be invented here. If the project later adopts a budget, this schema accepts it only by reference to one checked-in live policy/check and records raw measurements separately.

Change a direct row only with reviewer/operator role, date, exact commit/asset hashes, environment/device, complete procedure, outcome, and direct artifact/observation. Automation never closes it. Task 6 treats Task 0 audio, both migration applications, authenticated hosted v2 sync, the exact-prior-deployment rollback capture/rehearsal, and exact-SHA production deployment as mandatory for their respective release stages. `production_rollback_exact_prior_deployment` cannot pass without exact before/after provider metadata plus unchanged row/queue fingerprints, and it must pass before main moves. Broader human listening, complete human visual review, physical device, assistive technology, observed-child, low-power performance, and `production_operations_observation` may remain open, must be reported separately, and prevent a claim of full direct release approval.

`docs/ops/SOUND_SEEKERS_V2_RELEASE_GOVERNANCE.md` documents the evidence schema, owners, mandatory-versus-independent gate policy, artifact retention location, and claim language. It is durable governance, not a completed run log.

- [ ] **Step 4: Commit browser gates and durable governance, then hand off unpushed.**

```bash
git add playwright.quest.config.js tests/browser/sound-seekers-production-route.spec.js tests/browser/sound-seekers-failure-modes.spec.js tests/browser/sound-seekers-legacy-save-cutover.spec.js tools/lib/soundSeekersV2ReleaseEvidenceSchema.mjs docs/ops/SOUND_SEEKERS_V2_RELEASE_GOVERNANCE.md tests/unit/soundSeekersReleaseEvidencePolicy.test.js
node tools/verifySoundSeekersCutoverIndex.mjs --task task-5
git diff --cached --check
git commit -m "test: add Sound Seekers v2 release gates"
```

Confirm the generated `.artifacts` run is ignored and unstaged. Do not push.

## Task 6: Root-controlled final integration and release

**Depends on:** Tasks 0–5, review approval, and authorization for authenticated/hosted actions. The exact Task 0 contextual-audio hashes must still match the release manifest and `npm run check:quest-release` must still pass.

- [ ] **Step 1: Integrate safely.**

The root controller first proves Tasks 0–5 each have a reviewed scoped commit, each commit's cached-path evidence matched its exact task manifest, and the tracked worktree/index are clean. Preserve unrelated work outside this branch; do not fold it into the release. Then fetch `origin`, rebase the already committed branch on current `origin/main`, resolve only scoped conflicts, and regenerate tracked shipping manifests if their inputs moved. If that produces tracked changes, write their exact reviewed paths to ignored `.artifacts/sound-seekers-v2/integration/integration-paths.nul`, stage only with `git add -A --pathspec-from-file=.artifacts/sound-seekers-v2/integration/integration-paths.nul --pathspec-file-nul`, run `node tools/verifySoundSeekersCutoverIndex.mjs --task integration --expected-pathspec .artifacts/sound-seekers-v2/integration/integration-paths.nul` and `git diff --cached --check`, then commit only those resolutions/regenerations. If there is no tracked change, do not create an empty integration commit. Rerun all verification after the final rebase/integration commit. No earlier task fetches/rebases the shared integration branch or pushes.

If the tree or index is not clean because a Task 0–5 change was left unstaged/uncommitted, stop and return it to that task for a scoped commit before fetching. This prevents final integration from rebasing an uncommitted multi-task pile.

- [ ] **Step 2: Run the full clean-checkout matrix.**

In a disposable clean checkout of the exact rebased SHA run `npm ci`; Task 0 contextual-audio and generated-manifest/integrity checks; `npm test`; `npm run lint -- --max-warnings=0`; a production build to the exact `production` child of one fresh `shootSoundSeekersV2Content.mjs --create-build-root` OS-temporary root; v2 content/art/release and bundle gates; an offline build to that root's exact `offline` child; offline legacy-update, update, and soak gates with that exact child supplied as `QUEST_OFFLINE_DIST`; Chromium/Firefox/WebKit production tests including the real legacy-save cutover; `node tools/runSoundSeekersContentDeckSqlSelftest.mjs`; `node tools/runSoundSeekersV2MergeParitySql.mjs`; the exhaustive JS/SQL raw-and-valid merge-parity tool; reporting/export policy tests; repository hygiene; strict path/symbol/field/docs-authority checkers; and current security/privacy/accessibility checks. Create the build root only after recording whether project `dist/` and `dist-quest-offline/` exist and, when present, their complete byte manifests; install a failure-safe trap immediately, clean only through `--clean-build-root`, require the recorded root absent afterward, and prove those project directories stayed byte-identical. Never invoke generic `npm run build`, `build:quest-offline-test`, `rm`, or a glob. Neither SQL runner accepts an existing database or `DATABASE_URL`; each creates and removes its own socket-only isolated cluster under the exact lifecycle above. Write this checkout's run record to a task-owned temporary evidence tree, then use `transferSoundSeekersEvidence()` to install and re-hash it at `$SOUND_SEEKERS_V2_EVIDENCE_ROOT/release/<run-id>/`. A blocked SQL direct gate, failed evidence transfer, or any other failure blocks push and returns to its owning task; the disposable checkout remains until its complete destination hash manifest passes.

- [ ] **Step 3: Perform authorized hosted work and rehearse recovery.**

Before migration application, verify the exact project fingerprint, authenticated operator, migration history, backup/recovery owner, recoverable backup point, candidate commit, and Task 0 audio hashes. Review the exact migration bytes named by the release manifest and reject destructive DML, row translation, table recreation, or a changed already-applied migration. Under the approved stop-write/maintenance procedure, record only a privacy-safe server-side row count and aggregate SHA-256 fingerprint of existing `student_progress` row identity/area/key/payload bytes; never export row contents or identifiers. Apply `20260901120000_sound_seekers_learning_v2.sql` and `20260901143000_sound_seekers_v2_content_deck_merge.sql` exactly once in order, plus only later reviewed forward corrections already named in the release manifest. Verify the hosted migration list contains each identifier and the count/fingerprint is unchanged before writes resume. Any mismatch triggers the recovery owner, preserves the backup/queue, blocks promotion, and cannot be waived as expected reset behavior. Record only the fingerprint/count/direct result under `$SOUND_SEEKERS_V2_EVIDENCE_ROOT/migration/<run-id>/`.

Before creating the candidate ref, query the authorized production provider for the deployment currently serving the public production alias. Require and record exact `{deploymentId,gitSha,projectFingerprint,alias,environment:"production",status:"ready"}`, prove the alias resolves to that deployment ID, require a 40-character `gitSha`, and preserve that provider deployment from cleanup as `prior_production`. This is the sole rollback target for this attempt; `main_sha_before` is recorded separately and is never assumed to identify the currently serving deployment. If the provider cannot identify or retain the exact current deployment, or the alias/project/environment/status is ambiguous, stop before any push.

Before any `origin/main` push, only the root controller captures the remote main SHA, creates a SHA-qualified feature ref, and pushes the exact rebased candidate object to that ref—not to main:

```bash
candidate_sha="$(git rev-parse HEAD)"
main_sha_before="$(git ls-remote origin refs/heads/main | cut -f1)"
candidate_ref="refs/heads/codex/sound-seekers-v2-preview-${candidate_sha}"
test "${#candidate_sha}" -eq 40
test "${#main_sha_before}" -eq 40
git push origin "${candidate_sha}:${candidate_ref}"
test "$(git ls-remote origin "${candidate_ref}" | cut -f1)" = "${candidate_sha}"
test "$(git ls-remote origin refs/heads/main | cut -f1)" = "${main_sha_before}"
```

Deploy a hosted non-production preview from that exact feature ref/SHA through the project's authorized preview path, then verify provider deployment metadata resolves to `candidate_sha` and the preview runs the real v2 production route. Use a dedicated disposable test learner and the existing authorized progress API to establish one complete legacy v1 row at the existing `phonics_quest/__all__` identity; this is migration-fixture setup only and contains no real child data. Record only a one-way row-identity hash. In a fresh authenticated browser, open the real production route—not preview fixtures—and prove the legacy checkpoint/mastery/rewards/evidence receive zero credit while valid teacher assignment and allowlisted accessibility/settings survive. Viewing alone writes nothing. Complete the first legitimate visible learning loop, wait for the real queue, and prove the same hosted row identity is forward-written as normalized v2 rather than deleted/recreated; a fresh authenticated browser must load that v2 state without resurrecting legacy credit.

Continue the same learner through the real visible 40-stop route using the canonical child controls and production reducers. Do not call a hidden completion function, preview fixture, content-state mutator, or database payload injection. The resulting normalized state must have all five canonical categories; `coverageStatus(state).complete === true` against the complete normalized state, including evidence and attempt receipts; canonical covered-record counts exactly `{heartWords:60,stories:40,alternatives:4,morphology:1,transfer:40}`; valid visit counts exactly `{heartWords:80,stories:40,alternatives:4,morphology:1,transfer:40}`; and full-state-valid use counts exactly `{heartWords:81,stories:40,alternatives:4,morphology:1,transfer:40}`. Assert s6 has one owner visit and two distinct owner/shared uses after a close/reload between them; those two uses explain the one-use difference without creating an extra visit or covered record. All 40 story uses have reciprocal transfer uses with matching transaction/evidence IDs; the four alternatives came only through their placement reducers; morphology is the one non-assessed exposure with zero morphology evidence; and 32 connected-text plus eight boss transfer events retain canonical identities. Then open two authenticated browser contexts from one common saved state, complete different legitimate replay loops through visible controls, flush concurrently, and verify a third fresh context receives the union with immutable IDs, no conflicts, no duplicate evidence/uses, preserved assignment boundary, and no formal/Secure output. This hosted smoke exercises canonical reducers and storage merge; it never writes a handcrafted v2 ledger.

Record feature ref, preview deployment ID/URL/environment, resolved SHA, exact `prior_production` metadata, project fingerprint, account role without identifiers, legacy-row preservation result, exact category visit/use/coverage counts, immutable ID hashes, procedure, timestamp, and result under `$SOUND_SEEKERS_V2_EVIDENCE_ROOT`; re-check that `origin/main` still equals `main_sha_before`.

Any candidate change after this point—including a conflict resolution, generated-manifest update, gate fix, or metadata commit—invalidates the preview and hosted smoke. Rerun the clean matrix, push a new SHA-qualified feature ref, deploy/verify a new preview, and repeat the authenticated smoke before main may move.

Task 0 instructional-audio closure, migration application/row preservation, the complete authenticated hosted v2 legacy-cutover/sync smoke, and `production_rollback_exact_prior_deployment` are hard preconditions for the `origin/main` production push. Missing credentials, unavailable preview/hosted environment, unapplied migration, changed row/queue fingerprint, unavailable exact prior deployment, inconclusive rollback rehearsal, or any failed assertion means STOP: do not push and do not relabel the gate optional. Broader human listening, complete major-state visual review, physical iPad, switch/assistive technology, observed-child, representative low-power performance, and longer production-operations observation may remain open; report them separately and do not call the product fully direct-release-approved. Exact-SHA production deployment cannot remain open after main moves; it is the post-push completion gate in Step 4.

Before promotion, rehearse the exact provider rollback without changing the public production alias: create a task-owned non-production rehearsal alias, point only that alias to `prior_production.deploymentId`, and require provider metadata to resolve to the exact captured prior deployment ID, Git SHA, project fingerprint, environment source, and ready status. Run only an unauthenticated, non-mutating route/asset smoke against the rehearsal alias; do not open a learner, invoke a write endpoint, apply/revert a migration, drain/replay a queue, or change a hosted row. Before and after the rehearsal, compare the privacy-safe server-side row count/fingerprint, the dedicated test learner's one-way row/immutable-ID fingerprint, and the recorded local/hosted queue identities/counts; every value must be unchanged. Remove only the task-created rehearsal alias and prove it no longer resolves. Record exact commands/provider operations, before/after fingerprints, alias, deployment ID/SHA, timestamps, and result under the durable evidence root, then set `production_rollback_exact_prior_deployment` to `PASSED` only after the evidence schema revalidates the complete record. A provider that cannot rehearse and later restore this exact deployment without a data action blocks promotion. Do not delete rows or translate children back to v1; a data correction is forward-only.

- [ ] **Step 4: Final cleanup, exact main push, production verification, and preview-ref retirement.**

Re-run retirement/docs-authority inventory and all Task 0 hash checks. Confirm the tracked tree/index are empty, ignored evidence is outside the index, no integration pathset remains pending, and `HEAD` is the exact SHA-qualified feature-ref object used by the verified preview/hosted smoke. Re-read remote main and the currently serving production deployment: if remote main no longer equals `main_sha_before` or the production alias no longer resolves to the captured `prior_production.deploymentId`, fetch/rebase, re-capture the exact then-current prior production deployment, and repeat the clean matrix, new SHA-qualified feature ref, preview deployment, migrations/history check, row-preservation check, authenticated hosted smoke, and exact rollback rehearsal. Only the root controller may then run:

```bash
git push origin "${candidate_sha}:refs/heads/main"
test "$(git ls-remote origin refs/heads/main | cut -f1)" = "${candidate_sha}"
test "$(git rev-parse HEAD)" = "${candidate_sha}"
```

A non-fast-forward rejection returns to rebase/repeat and must never be forced. The successful Git push is not yet production-deployment evidence. Through the authorized production provider, wait for the deployment created from `origin/main`, require metadata `{environment:"production",gitSha:candidate_sha,status:"ready"}` for the exact project fingerprint, and reject an alias that still resolves to another deployment. Run a non-mutating fresh-browser production smoke against the public production URL: verify the real v2 route and release manifest, no legacy runtime request/chunk/cache namespace, all current manifest hashes, one code-native background-failure fallback, offline shell startup, and a read-only authenticated reload of the dedicated test learner showing the already-verified immutable IDs with zero new evidence/use/save. Record deployment ID/URL, resolved SHA, provider environment/project fingerprint, timestamps, route/network/cache assertions, and outcome; then set `production_deployment_exact_sha` to `PASSED` with that direct evidence.

If build/deployment/alias/production smoke fails or resolves the wrong SHA, immediately invoke only the rehearsed provider deployment/alias operation targeting exact `prior_production.deploymentId`; perform no database, migration, row, learner, or queue mutation. Require the public production alias metadata to resolve exactly to the captured prior deployment ID, Git SHA, project fingerprint, `environment:"production"`, and `status:"ready"`, then run the same unauthenticated non-mutating prior-route smoke and prove the pre-recorded server row, dedicated learner, immutable-ID, and local/hosted queue fingerprints/counts are unchanged. Any mismatch is an incident and recovery-owner escalation, not a successful rollback. Mark the candidate deployment failed, preserve all v2 rows/queues/migrations, open the forward-fix path, and do not call the release complete. Never force/rewrite main or translate v2 data back to v1; the next attempt is a reviewed forward commit and repeats the entire candidate process.

Only after exact-SHA production verification succeeds, delete the one task-created preview branch with `git push origin --delete "${candidate_ref#refs/heads/}"` and prove `git ls-remote origin "${candidate_ref}"` is empty. Remove the exact disposable clean checkout/worktree registration, its task-created `node_modules`, build/offline output directories, stopped browser/dev/provider helper processes, temporary caches, and any runner temp root left by a failed cleanup only after validating each path belongs to this run and after `transferSoundSeekersEvidence()` has installed and re-hashed every disposable-checkout artifact under `SOUND_SEEKERS_V2_EVIDENCE_ROOT`. A failed or incomplete transfer preserves the source checkout and blocks cleanup. Verify no test port/socket/process remains. Preserve the complete ignored automated/direct/migration/deployment/rollback evidence run, Task 0 production provenance, exact `prior_production` metadata, and any still-required private rights/recovery material; do not glob another run or delete open-gate evidence. Report the Task 0 hashes, final commit, preview ref/deployment and its deletion, main push/remote SHA, production deployment exact-SHA verification, captured prior deployment ID/SHA and rollback rehearsal, both migrations/row fingerprint, authenticated hosted all-category smoke, scoped cleanup, and every still-open independent gate separately.

## Definition of done

Done for this integration plan means the five exact contextual instructional keys and 21 pronunciation records have current hash-bound direct approval and no release blocker; the deployed production route at the public alias resolves to the exact pushed SHA and runs only v2; every teacher/report/export consumer uses the practice-only adapter without formal/Secure conflation; a real local and authenticated hosted legacy payload starts fresh with no credit while valid assignment/settings/storage/privacy and the same hosted row survive; every raw/valid client-SQL deck category, conflict, transaction, and activity normalization has parity through socket-only disposable clusters; the hosted smoke reaches all five categories through canonical reducers with exact 80/40/4/1/40 valid visits, 81/40/4/1/40 valid uses, 60/40/4/1/40 covered records, and the additional s6 shared use on its existing owner visit; both required migrations are directly observed applied with unchanged row fingerprint; generated v2 audio/art/offline manifests are current; the hash-bound executable fixture installs the exact captured v1 worker/release and proves its atomic update to v2 from a clean checkout; deletion follows parsed path/symbol/field/docs/CI/release-gate zero-reference proof while retaining only that test fixture exception; clean install, lint, and fresh Chromium/Firefox/WebKit checks pass; the exact prior production deployment is captured and its deployment-only rollback is rehearsed with unchanged row/queue fingerprints; every disposable artifact is hash-transferred to the durable external evidence root before cleanup; cleanup removes the task-created preview/rehearsal refs and disposable runtime material; and only the root controller has fetched, rebased, fully verified, pushed, verified production, and cleaned up. Broader human listening, complete human visual review, physical device, assistive technology, observed child, representative low-power performance, and longer production-operations observation remain separately truthful and may still be open; their open state prevents a claim of full direct release approval but does not reopen the closed instructional-audio or exact-SHA deployment gates.
