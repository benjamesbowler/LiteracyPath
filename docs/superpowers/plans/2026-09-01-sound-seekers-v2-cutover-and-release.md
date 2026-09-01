# Sound Seekers v2 Cutover and Release Implementation Plan

> **For agentic workers:** Implement in numeric order. Each Task 1–5 ends in one scoped, reviewable commit and remains unpushed. Only the root-controlled final task may fetch, rebase those already committed changes, rerun the complete matrix, perform authorized hosted gates, and push.

**Goal:** Verify the runtime plan's production v2 route, migrate every teacher report/export consumer to a practice-only v2 adapter, preserve shared assignment/storage/privacy boundaries, and retire only superseded game code, assets, manifests, and tools after a zero-reference proof.

**Dependencies:** Complete automated acceptance checks in:

- docs/superpowers/plans/2026-09-01-sound-seekers-v2-learning-foundation.md
- docs/superpowers/plans/2026-09-01-sound-seekers-v2-content-and-art.md
- docs/superpowers/plans/2026-09-01-sound-seekers-v2-game-runtime.md

**Authority:** docs/superpowers/specs/2026-09-01-sound-seekers-proper-educational-game-design.md

## Rulings

- There is **no live child-progress migration**. A legacy phonics_quest payload opens as a fresh v2 learning journey: old checkpoints, mastery, rewards, gameplay, and evidence receive no v2 credit. Hosted rows are not destructively deleted.
- Keep the existing APP_VIEWS.PHONICS_QUEST, scope key, authenticated progress queue, account/entitlement/navigation shell, teacher-owned valid assignment, learner accessibility settings, and privacy sanitizer. v2 uses questStore rather than a second storage or sync client.
- stateV2.js, questMastery.js, and the SQL merge remain the learning, numeric-readiness, and merge authorities. Child views exclude answer keys, correctness flags, and internal IDs.
- Only these domains are valid: phoneme_to_grapheme, grapheme_to_phoneme, word_decoding, word_segmentation_encoding, connected_text_transfer, heart_word_mapping, and novel_decoding. An explicit literacy action emits at most one frozen event. Movement, collision, collection, travel, timing, animation, repair, and reward emit none.
- Every event has evidenceKind: practice; practice never creates formal assessment or SECURE status. Required audio is independent only when completed with zero support and no model/reveal; missing, interrupted, revealed, or supported audio is non-independent.
- Do not delete before consumers switch. Never delete a path because it contains quest: Story Quests and shared utilities/assets are retained unless the inventory proves them legacy Sound Seekers-only.
- Browser automation does not close human listening, visual-semantic, physical-iPad, assistive-technology, observed-child, authenticated-hosted, deployment, or production-operations gates.
- Generated run status, parity output, screenshots, traces, and direct-gate evidence live only under ignored `.artifacts/sound-seekers-v2/`. Checked-in docs contain durable schemas, policy, recovery, and governance only; never generate a dated run report under `docs/`.
- Runtime Task 5 already owns and commits the production `renderQuest` switch. Cutover verifies the lazy `SoundSeekersRoute` mount and writes its manifest; it does not edit the route to perform a second switch and never expects `QuestRoot` to exist.
- Every Task 1–5 commit is scoped to that task's named files. No task pushes. Root starts final integration from a clean committed tree; fetch/rebase is not deferred until after a pile of unstaged cross-task changes.

## Task 1: Verify the production route, migrate practice reporting/export, and establish the v2 release manifest

**Depends on:** all three dependency plans.

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

The frozen `SOUND_SEEKERS_V2_RELEASE_MANIFEST` includes `contentVersion: "sound-seekers-v2"`; production route/component/game paths; both SQL migrations `20260901120000_sound_seekers_learning_v2.sql` and `20260901143000_sound_seekers_v2_content_deck_merge.sql`; public prefixes `/audio/quest-v2/instructions/`, `/audio/quest-v2/scenes/`, and `/game-assets/sound-seekers/v2/`; generated audio/asset manifests; the practice-report adapter; and offline policy `cache-on-request-with-explicit-chapter-warming`.

The checker validates every manifest entry, provenance file, practice consumer, and production route import and rejects legacy URLs/imports from the production chunk. `public/game-assets/sound-seekers/avatars-v3` and `characters` are neither presumed v2 nor deleted: classify each after an actual v2 consumer/provenance check.

- [ ] **Step 4: Verify route, reporting, exports, storage, and build.**

Run: `node --test tests/unit/soundSeekersCutover.test.js tests/unit/questPracticeReport.test.js tests/unit/soundSeekersPracticeReportPolicy.test.js tests/unit/soundSeekersProgressController.test.js tests/unit/classHeatSummary.test.js tests/unit/questRuntimeSystems.test.js tests/unit/questTeacherTools.test.js tests/unit/studentReportingWorkspaceModel.test.js tests/unit/reportExportProvenance.test.js tests/unit/simpleStudentProgressWorkbook.test.js tests/unit/studentWorkspaceExport.test.js tests/unit/teacherProgressOverview.test.js tests/unit/practicePack.test.js tests/unit/teacherInsightActions.test.js tests/unit/exportShapes.test.js tests/unit/reportSections.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/progressMerge.test.js tests/unit/questStorageRecovery.test.js`

Run: `node tools/checkSoundSeekersCutover.mjs`

Run: `npm run build`

Expected: PASS. Production already has one v2 route, all teacher/report/export surfaces show practice truth, v1 gives no v2 credit, formal outcomes cannot be elevated, and the old report has zero production consumers.

- [ ] **Step 5: Commit the scoped cutover/report work and hand off unpushed.**

```bash
git add src/features/soundSeekers/releaseManifest.js src/utils/questPracticeReport.js src/App.jsx src/appState/useAppSessionController.js src/components/FinishedReportPage.jsx src/components/TeacherTodayPage.jsx src/components/TeacherStudentsPage.jsx src/utils/teacherProgressOverview.js src/utils/worksheets/practicePack.js src/utils/teacherInsightActions.js src/utils/exportReportSections.js src/components/reports/StudentReportViews.jsx src/components/reports/studentReportUiUtils.js src/data/studentReportingWorkspaceModel.js src/utils/exportStudentProgressSimple.js src/utils/exportStudentReportWorkbook.js src/utils/exportStudentWorkspaceCsv.js tools/checkSoundSeekersCutover.mjs tests/unit/soundSeekersCutover.test.js tests/unit/questPracticeReport.test.js tests/unit/soundSeekersPracticeReportPolicy.test.js tests/unit/classHeatSummary.test.js tests/unit/questRuntimeSystems.test.js tests/unit/questTeacherTools.test.js tests/unit/studentReportingWorkspaceModel.test.js tests/unit/reportExportProvenance.test.js tests/unit/simpleStudentProgressWorkbook.test.js tests/unit/studentWorkspaceExport.test.js tests/unit/teacherProgressOverview.test.js tests/unit/practicePack.test.js tests/unit/teacherInsightActions.test.js tests/unit/exportShapes.test.js tests/unit/reportSections.test.js
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
- Create: tools/writeSoundSeekersV2MigrationStatus.mjs
- Create: tests/unit/soundSeekersV2MergeParityContract.test.js
- Create: docs/ops/SOUND_SEEKERS_V2_MIGRATION_RECOVERY.md

**Ownership boundary:** Content/art Task 2 owns the forward migration `20260901143000_sound_seekers_v2_content_deck_merge.sql`, SQL helpers, and self-test. This cutover task owns exhaustive parity vectors and execution only. If a vector exposes a product mismatch, stop and return the change to content/art Task 2 as another reviewed forward migration/helper/test update; do not add an ad hoc cutover migration or edit an applied migration here.

**Parity contract:** Each fixture names `existing`, `incoming`, and its canonical result. Node evaluates `computeHydratedValue("phonics_quest","__all__",...)`; SQL evaluates `public.lp_quest_merge_learning_v2`. The parity tool compares allowlisted persisted projections, excluding only the documented same-device local-checkpoint ownership rule and never excluding evidence, deck, subtype, assignment, reset, or settings fields.

- [ ] **Step 1: Add vectors and failing parity tests.**

Include v1 plus v2 fresh v2 with assignment retained; v2 plus v1; equal and unequal reset epochs; duplicate IDs; deterministic 1,201-to-1,200 bound; current and incompatible checkpoints; valid/invalid assignments; allowlisted settings/creator appearance; malformed evidence; and forbidden motor/telemetry fields. The tests assert no mismatch and explicitly assert legacy progress has an empty v2 evidence ledger while a valid teacher assignment remains.

The same vector corpus must reach every `contentDecks` category on both branches: `heartWords`, `stories`, `alternatives`, `morphology`, and `transfer`. Within heart words it includes every exact `activityType`: `recognition`, `heart_part_mapping`, `encoding`, and `sentence_use`, with concurrent `activityLastServed` keys and visit IDs. Evidence vectors include all seven domains, valid heart-word subtypes, a missing legacy subtype, an invalid subtype, and an unrelated-domain subtype. Assertions prove valid subtypes survive unchanged, invalid/unrelated subtypes are normalized identically, no category disappears, and no heart-word event fans out into a GPC domain. Run left/right and A/B/C regrouping vectors so parity is merge-order and convergence evidence, not a single happy-path comparison.

- [ ] **Step 2: Run local client and SQL checks.**

Run: `node --test tests/unit/progressMerge.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/soundSeekersV2MergeParityContract.test.js`

Run: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql`

Run: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/sql/sound_seekers_learning_v2_merge.sql`

Expected: the SQL fixture runs inside begin and rollback; it does not apply a hosted migration or modify production data.

- [ ] **Step 3: Record durable recovery governance and generated run status separately.**

The durable recovery document defines owners, prerequisites, backup check, migration order, stop-write decision, prior-release restore, queue/row preservation, forward correction, and no-v2-to-v1 translation. It describes procedures and schemas only; it never claims a run happened.

`writeSoundSeekersV2MigrationStatus.mjs` writes `.artifacts/sound-seekers-v2/migration/<run-id>/status.json` with separate fields for both migration files, local rollback SQL, hosted application, authenticated sync smoke, project fingerprint, commit, timestamp, operator, and result. Default hosted states are `not_observed`; only an authorized direct run changes them. The generated status is ignored and never copied into `docs/` or staged.

Recovery: on migration/cutover failure stop new writes under the incident owner, preserve rows and queue, restore prior app release, and use a forward correction if needed. Never delete child rows or translate v2 progress back to v1.

- [ ] **Step 4: Verify parity and recovery evidence.**

Run: `node --test tests/unit/progressMerge.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/soundSeekersV2MergeParityContract.test.js tests/unit/questStorageRecovery.test.js`

Run: `node tools/verifySoundSeekersV2MergeParity.mjs --output .artifacts/sound-seekers-v2/migration/local-parity.json`

Run: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/verify/sound_seekers_v2_content_deck_merge_selftest.sql`

Run: `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/sql/sound_seekers_learning_v2_merge.sql`

Expected: PASS across every category/subtype and regrouping; malformed/motor data has no learning effect; generated hosted status remains `not_observed` unless directly observed otherwise.

- [ ] **Step 5: Commit parity fixtures/governance and hand off unpushed.**

```bash
git add tests/unit/progressMerge.test.js tests/sql/sound_seekers_learning_v2_merge.sql tests/fixtures/soundSeekersV2MergeVectors.json tools/verifySoundSeekersV2MergeParity.mjs tools/writeSoundSeekersV2MigrationStatus.mjs tests/unit/soundSeekersV2MergeParityContract.test.js docs/ops/SOUND_SEEKERS_V2_MIGRATION_RECOVERY.md
git commit -m "test: prove Sound Seekers client SQL parity"
```

Confirm no `.artifacts` path is staged. Do not push.

## Task 3: Rebuild offline and generated manifests around v2 prefixes

**Depends on:** Tasks 1–2 and accepted content/art manifests.

**Files:**

- Modify: tools/viteQuestOfflinePlugin.mjs, tools/checkQuestOffline.mjs
- Modify: tools/buildQuestOfflineUpdateFixtures.mjs, tools/serveQuestOfflineUpdateFixtures.mjs
- Modify: tests/quest-offline/quest-offline.spec.js, tests/quest-update/quest-update.spec.js, tests/quest-soak/quest-soak.spec.js
- Modify: package.json
- Create: tools/checkSoundSeekersV2ReleaseManifest.mjs
- Create: tests/unit/soundSeekersOfflineContract.test.js

- [ ] **Step 1: Add failing v2 offline/update tests.**

The contract test proves offline has exactly one v2 runtime and only manifest-backed warmed media. The update fixture proves it never observes mixed versions and a resume adds zero practice evidence.

- [ ] **Step 2: Replace hard-coded legacy runtime/media assumptions.**

Use the release manifest, Vite manifest, generated audio manifests, and tools/lib/soundSeekersV2AssetManifest.mjs. Regenerate rather than hand-edit manifests. Warm one declared biome, one instruction, and one narration; retain cache-on-request and safe range behavior. A missing hash/entry retains the prior cache and presents retry. Corrupt, missing, or incompatible checkpoint resumes safely without evidence.

Delete hard-coded QuestRoot, QuestPixelWorld, Pixel chunks, and old URLs from this tooling only after Task 1 passes.

- [ ] **Step 3: Run focused offline, update, soak, and clean-install proof.**

Run: npm run build:quest-offline-test

Run: npm run check:quest-offline

Run: npm run test:quest-offline

Run: npm run test:quest-update

Run: npm run test:quest-soak-smoke

Run: node --test tests/unit/soundSeekersOfflineContract.test.js

Expected: PASS with v2 media only; this is browser/offline-harness evidence, not iPad evidence.

From a new disposable worktree with no node_modules, run npm ci, manifest generation/check, npm run build, and focused offline tests. Record Node/npm versions and do not copy caches, candidates, artifacts, or credentials.

Write generated manifests/logs for this proof to `.artifacts/sound-seekers-v2/offline/<run-id>/`; only authored source, tests, package scripts, and generated shipping manifests named by the release manifest may be staged.

- [ ] **Step 4: Commit offline/update integration and hand off unpushed.**

```bash
git add tools/viteQuestOfflinePlugin.mjs tools/checkQuestOffline.mjs tools/buildQuestOfflineUpdateFixtures.mjs tools/serveQuestOfflineUpdateFixtures.mjs tests/quest-offline/quest-offline.spec.js tests/quest-update/quest-update.spec.js tests/quest-soak/quest-soak.spec.js package.json tools/checkSoundSeekersV2ReleaseManifest.mjs tests/unit/soundSeekersOfflineContract.test.js
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

**Inventory contract:** Scan `src`, `preview`, `tests`, `tools`, `public`, `docs`, `.github/workflows`, `package.json`, and Vite/Playwright configs for static/dynamic imports, CSS URLs, service-worker entries, generated manifests, scripts, release-gate entries, CI jobs, Bible authority claims, index links, cleanup claims, semantic reads of the legacy progress shape, and built manifests. Classify every candidate `retainShared`, `replaceV2`, `retireLegacy`, or `blockedByConsumer`. Generate and continuously maintain two reviewed NUL-delimited pathsets from that inventory: `retire-paths.nul` for every `retireLegacy` deletion and `replace-v2-paths.nul` for every inventory-discovered source that must be added or modified as `replaceV2`. No newline-delimited or shell-word-split reconstruction is allowed.

Initial legacy candidates are QuestRoot, QuestPixelWorld, QuestTrail2D, QuestHub, questPixelRuntime, legacy Pixel/2D/Three child-game tools/tests, directly owned public/game-assets/quest-pixel, and obsolete Sound Seekers manifests. Start questStore.js, progressMerge.js, questMastery.js, questReviewScheduler.js, questCorrection.js, cuePlayer.js, shared dependencies, and Story Quest material as retainShared.

Current-source inspection already confirms three semantic `replaceV2` consumers that an import-only scan can miss: `src/policy/learningPolicy.js` counts legacy trail IDs, `src/components/StudentHomePage.jsx` derives continuation from `questSequence`/v1 quest progress, and `src/utils/treasureTrail.js` awards from `soundSeekers.trail.stars`. The final inventory must include all three and their affected tests in `replace-v2-paths.nul` unless a preceding committed task has already removed the v1 read and the checker proves the replacement exact; they may not be silently classified `retainShared` merely because their filenames are generic.

- [ ] **Step 1: Write blocking test and generate inventory.**

The test first proves production route and offline contract are v2, `questReport.js` has zero production consumers, and no `blockedByConsumer` paths remain. Its retirement assertion then requires zero existing `retireLegacy` paths, references, forbidden URLs, active Pixel/3D authority claims, stale CI jobs, or stale release-gate commands.

Run: `node tools/checkSoundSeekersLegacyReferences.mjs --report .artifacts/sound-seekers-v2/retirement/inventory.json --retire-pathspec .artifacts/sound-seekers-v2/retirement/retire-paths.nul --replace-v2-pathspec .artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul`

Run: `node tools/checkSoundSeekersDocsAuthority.mjs`

Expected: every candidate, consumer, classification, and block reason is printed. Review before deletion.

- [ ] **Step 2: Delete only inventory-proven legacy paths.**

Review every NUL-delimited path in both pathsets against the JSON inventory. Use `git rm --pathspec-from-file=.artifacts/sound-seekers-v2/retirement/retire-paths.nul --pathspec-file-nul` only after the retirement set contains no `retainShared`/`replaceV2`/`blockedByConsumer` item. Repair every direct and semantic consumer, regenerate the inventory, and require every resulting modified inventory source to appear once in the reviewed `replace-v2-paths.nul`; stage those replacements with `git add -A --pathspec-from-file=.artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul --pathspec-file-nul`. Remove obsolete package scripts and renderer-specific checks; regenerate shipping manifests. Do not remove hosted rows, the v2 store/practice-report/export adapter, Phaser, three when another game still imports it, generic UI/audio assets, Story Quest material, or blocked paths.

Rewrite the release Bible, curriculum mechanic matrix, and world blueprint around the authoritative v2 spec: 40 stops/103 teach entries, `s8`/`s17` reviews, 60 heart words, 32 existing identities, six canonical underscore powers, seven domains, one 2D runtime, canonical pronunciation metadata, practice-only reporting, offline fallback, and direct-gate boundaries. Update the general game Bible link/summary, contextual-unit review links, docs index, and cleanup ledger. Delete the 3D notice only if its assets have no retained shared consumer; otherwise relabel its exact retained non-Sound-Seekers scope without leaving it as current Sound Seekers authority.

Replace Pixel/3D/chapter-one CI and `releaseGate.mjs` entries with the aggregate v2 content, art, asset, runtime, report-policy, parity, offline, strict-retirement, and production-route gates. Update/retire `checkQuestPacing`, `checkQuestArt`, and route visual gates so they validate v2 catalogs/manifest rather than legacy corridors. Update the confirmed `learningPolicy.js`, `StudentHomePage.jsx`, and `treasureTrail.js` consumers to read normalized v2 journey/practice/reward state and adjust their focused tests; no continuation label, home count, gem, badge, or recommendation may be inferred from the retired v1 `trail.stars`, trail-ID, or checkpoint shape. Keep device/human tools direct and v2-schema-aware; neither may infer acceptance from browser output. `package.json` has one current `check:sound-seekers-release` aggregate and no live Pixel bundle script.

- [ ] **Step 3: Prove retirement and scoped cleanup.**

Run: node tools/checkSoundSeekersLegacyReferences.mjs --strict

Run: `node tools/checkSoundSeekersDocsAuthority.mjs`

Run: `node --test tests/unit/soundSeekersLegacyRetirement.test.js tests/unit/soundSeekersReleaseContract.test.js tests/unit/soundSeekersPracticeReportPolicy.test.js tests/unit/studentHomeRecommendationPolicy.test.js tests/unit/treasureTrail.test.js`

Run: `npm run check:sound-seekers-release`

Run: `npm run lint -- --max-warnings=0`

Run: npm run build

Run: npm run check:repo-hygiene

Expected: PASS with zero legacy files/references/URLs, one v2 runtime, and no home/recommendation/treasure consumer reading the retired v1 Sound Seekers shape. Delete only task-created failed conversions, rejected art, stale screenshots, test dist folders, and no-longer-needed ignored candidates. Preserve accepted provenance/current evidence/open listening candidates; report removals and recovery location.

- [ ] **Step 4: Commit the reviewed retirement set and hand off unpushed.**

Regenerate the final inventory after all repairs so its two reviewed NUL-safe pathsets describe the finished tree, not the initial scan. The retirement checker must support `--verify-index`: it compares `git diff --cached --name-status -z` against the exact union of the reviewed pathsets, requires every `retireLegacy` path to be staged as deletion, requires every `replaceV2` path to be staged with its actual add/modify/rename status, and rejects every missing or extra cached path. All durable task additions, rewrites, semantic-consumer changes, and conditional retained documents are classified into `replace-v2-paths.nul`; `.artifacts` itself remains ignored and unstaged.

```bash
node tools/checkSoundSeekersLegacyReferences.mjs --report .artifacts/sound-seekers-v2/retirement/inventory.json --retire-pathspec .artifacts/sound-seekers-v2/retirement/retire-paths.nul --replace-v2-pathspec .artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul
git rm --pathspec-from-file=.artifacts/sound-seekers-v2/retirement/retire-paths.nul --pathspec-file-nul
git add -A --pathspec-from-file=.artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul --pathspec-file-nul
node tools/checkSoundSeekersLegacyReferences.mjs --verify-index --report .artifacts/sound-seekers-v2/retirement/inventory.json --retire-pathspec .artifacts/sound-seekers-v2/retirement/retire-paths.nul --replace-v2-pathspec .artifacts/sound-seekers-v2/retirement/replace-v2-paths.nul
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
- Create: tools/lib/soundSeekersV2ReleaseEvidenceSchema.mjs
- Create: docs/ops/SOUND_SEEKERS_V2_RELEASE_GOVERNANCE.md
- Create: tests/unit/soundSeekersReleaseEvidencePolicy.test.js

Configure three named projects: Chromium, Firefox, and WebKit. Each new cutover test opens the production route, not a preview. Label WebKit browser automation, not physical iPad. Existing `sound-seekers-*.spec.js` files remain owned by their prior plans; if this matrix exposes a product/test gap, return it to that owner rather than silently editing an unlisted file here.

- [ ] **Step 1: Add production-route and failure-mode tests.**

For keyboard, pointer, touch, and switch-compatible focus, assert the same exact `(instructionId,powerId,expectedAction,recordsDomain)` decision variant and no legacy runtime. Exercise one authored stop/phase/content preview fixture for every current decision contract, positive completion for each, and rejection of every foreign transcript including siblings within Contrast Sort, Memory Delivery, and Blend Bridge. Test audio failure, storage failure, offline/resume, blocked media, corrupt payload, stale checkpoint, first-load offline, failed cache update, and deduplicated resumed IDs; each failure is recoverable and emits no evidence.

Also prove 56px primary targets; 320px at 200% zoom; focus order/no trap across Phaser/React portal/fallback; reduced motion final state; audio interruption/suspension/reused element; truthful six powers plus genuinely novel_decoding; and that all seven domains appear only on named explicit actions, not reskinned outcomes.

- [ ] **Step 2: Run fresh browser and policy checks.**

Run: `npx playwright test tests/browser/sound-seekers-production-route.spec.js tests/browser/sound-seekers-failure-modes.spec.js tests/browser/sound-seekers-*.spec.js --config=playwright.quest.config.js --project=chromium --project=firefox --project=webkit`

Run: `node --test tests/unit/soundSeekersReleaseEvidencePolicy.test.js tests/unit/soundSeekersPracticeReportPolicy.test.js tests/unit/soundSeekersReleaseContract.test.js`

Then run current repository security, privacy, accessibility, integrity, release, npm test, and build checks. Record command, commit, browser/Node/npm versions, viewport, reduced-motion setting, and outcome. Verify child/network payload excludes motor telemetry, answer keys, formal status, and unexpected identifiers; assignment is accepted only through the existing authorized boundary.

Write automated run output to `.artifacts/sound-seekers-v2/release/<run-id>/automated.json` using `soundSeekersV2ReleaseEvidenceSchema.mjs`. The schema rejects a PASS without command, exact commit, environment, start/end time, exit status, and artifact reference; it also rejects any claim that WebKit automation is a physical-iPad pass. No generated Markdown or JSON run report belongs under `docs/`.

- [ ] **Step 3: Keep direct gates truthful.**

Create `.artifacts/sound-seekers-v2/release/<run-id>/direct-gates.json` rows initially `OPEN` for human listening, human visual/semantic review of all eight actual biome crops, physical iPad Safari, assistive technology/switch use, observed child, authenticated hosted v2 route/sync, both migration applications, deployment, and production operations/rollback. Change only with person, date, environment, procedure, and direct artifact/observation. Automation never closes them. Task 6 treats migration application and authenticated hosted v2 sync as mandatory before `origin/main`; the other human/device rows may remain open and must be reported as such.

`docs/ops/SOUND_SEEKERS_V2_RELEASE_GOVERNANCE.md` documents the evidence schema, owners, mandatory-versus-independent gate policy, artifact retention location, and claim language. It is durable governance, not a completed run log.

- [ ] **Step 4: Commit browser gates and durable governance, then hand off unpushed.**

```bash
git add playwright.quest.config.js tests/browser/sound-seekers-production-route.spec.js tests/browser/sound-seekers-failure-modes.spec.js tools/lib/soundSeekersV2ReleaseEvidenceSchema.mjs docs/ops/SOUND_SEEKERS_V2_RELEASE_GOVERNANCE.md tests/unit/soundSeekersReleaseEvidencePolicy.test.js
git commit -m "test: add Sound Seekers v2 release gates"
```

Confirm the generated `.artifacts` run is ignored and unstaged. Do not push.

## Task 6: Root-controlled final integration and release

**Depends on:** Tasks 1–5, review approval, and authorization for authenticated/hosted actions.

- [ ] **Step 1: Integrate safely.**

The root controller first proves Tasks 1–5 each have a reviewed scoped commit and that the tracked worktree is clean. Preserve unrelated work outside this branch; do not fold it into the release. Then fetch `origin`, rebase the already committed branch on current `origin/main`, resolve only scoped conflicts, regenerate tracked shipping manifests if their inputs moved, and commit only those scoped regeneration/conflict resolutions. Rerun all verification after rebase. No earlier task fetches/rebases the shared integration branch or pushes.

If the tree is not clean because a Task 1–5 change was left unstaged, stop and return it to that task for a scoped commit before fetching. This prevents final integration from rebasing an uncommitted multi-task pile.

- [ ] **Step 2: Run the full clean-checkout matrix.**

In a disposable clean checkout of the exact rebased SHA run `npm ci`; generated-manifest/integrity checks; `npm test`; `npm run lint -- --max-warnings=0`; `npm run build`; v2 content/art/release, bundle, offline, update, and soak gates; Chromium/Firefox/WebKit production tests; both SQL self-test/rollback fixtures against a disposable local database; exhaustive merge-parity tool; reporting/export policy tests; repository hygiene; strict legacy/docs-authority checkers; and current security/privacy/accessibility checks. Write the run record under `.artifacts/sound-seekers-v2/release/<run-id>/`. Any failure blocks push and returns to its owning task.

- [ ] **Step 3: Perform authorized hosted work and rehearse recovery.**

Before migration application, verify the exact project fingerprint, authenticated operator, migration history, backup/recovery owner, and candidate commit. Apply `20260901120000_sound_seekers_learning_v2.sql` and `20260901143000_sound_seekers_v2_content_deck_merge.sql` exactly once in order, plus only later reviewed forward corrections already named in the release manifest. Verify the hosted migration list contains each identifier and record the direct result in the ignored migration-status artifact.

Before any `origin/main` push, only the root controller captures the remote main SHA, creates a SHA-qualified feature ref, and pushes the exact rebased candidate object to that ref—not to main:

```bash
candidate_sha="$(git rev-parse HEAD)"
main_sha_before="$(git ls-remote origin refs/heads/main | cut -f1)"
candidate_ref="refs/heads/codex/sound-seekers-v2-preview-${candidate_sha}"
git push origin "${candidate_sha}:${candidate_ref}"
test "$(git ls-remote origin "${candidate_ref}" | cut -f1)" = "${candidate_sha}"
test "$(git ls-remote origin refs/heads/main | cut -f1)" = "${main_sha_before}"
```

Deploy a hosted non-production preview from that exact feature ref/SHA through the project's authorized preview path, then verify provider deployment metadata resolves to `candidate_sha` and the preview runs the real v2 production route. With a dedicated test learner, save one practice event and concurrent deck records covering a heart-word `activityType` plus `morphology` and `transfer`, reload in a fresh authenticated browser, and verify the merged v2 state, immutable event ID, assignment boundary, and absence of formal/Secure output. Record feature ref, preview deployment ID/URL/environment, resolved SHA, project fingerprint, account role without identifiers, procedure, timestamp, and result in `.artifacts`; re-check that `origin/main` still equals `main_sha_before`.

Any candidate change after this point—including a conflict resolution, generated-manifest update, gate fix, or metadata commit—invalidates the preview and hosted smoke. Rerun the clean matrix, push a new SHA-qualified feature ref, deploy/verify a new preview, and repeat the authenticated smoke before main may move.

Migration application **and** authenticated hosted v2 sync smoke are hard preconditions for the `origin/main` production push. Missing credentials, unavailable preview/hosted environment, unapplied migration, inconclusive observation, or any failed assertion means STOP: do not push and do not relabel the gate as optional. Human listening, eight-biome visual review, physical iPad, switch/assistive-technology, observed-child, deployment-observation, and production-operations gates may remain open; report them separately and do not call the product fully release-approved.

Before promotion, rehearse restoring prior app release while preserving local/hosted rows and queues. Do not delete rows or translate children back to v1. A data correction is forward-only.

- [ ] **Step 4: Final cleanup, commit, and push.**

Re-run retirement/docs-authority inventory; remove only proven disposable task outputs; confirm unrelated changes and `.artifacts` are excluded. If rebase/regeneration produced tracked changes, stage their exact named paths, commit them, and rerun the affected plus aggregate gates; otherwise do not manufacture an empty “integration” commit. Confirm `HEAD` is the exact SHA-qualified feature-ref object used by the verified preview and hosted smoke. Re-read remote main: if it no longer equals `main_sha_before`, fetch/rebase and repeat every verification, feature-ref preview deployment, and hosted smoke. Only the root controller may then push the exact verified object with `git push origin "${candidate_sha}:refs/heads/main"`; a non-fast-forward rejection returns to rebase/repeat and must never be forced. Report commit, feature-ref push, preview deployment/SHA verification, main push, both mandatory hosted gates, and every still-open independent gate separately.

## Definition of done

Done for this integration plan means the actual production route runs only v2; every teacher/report/export consumer uses the practice-only adapter without formal/Secure conflation; legacy child progress has no credit while shared assignment/settings/storage/privacy survive; every client/SQL deck category and activity subtype has parity; both required migrations are directly observed applied; authenticated hosted v2 sync smoke passes for the exact candidate; generated v2 audio/art/offline manifests are current; deletion follows full docs/CI/release-gate zero-reference proof; clean install, lint, and fresh Chromium/Firefox/WebKit checks pass; cleanup is scoped; and only the root controller has fetched, rebased, fully verified, and pushed. Human listening, human visual review, physical device, assistive-technology, observed-child, deployment-observation, and production-operations gates remain separately truthful and may still be open after the push.
