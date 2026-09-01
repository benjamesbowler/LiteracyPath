# Sound Seekers v2 Cutover and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the application and reports over to Sound Seekers v2, delete the superseded engines/assets, and establish honest offline, automated, visual, device, listening, child-play, hosted, and production release evidence.

**Architecture:** The existing student route lazy-loads the new feature directly; the stable quest store remains the only local/cloud boundary. Teacher surfaces consume a practice-only report adapter derived from immutable v2 evidence. A manifest-driven zero-reference gate makes deletion of legacy code and assets deliberate, while renderer-neutral offline/bundle/release checks replace Pixel/3D proxy gates. Automated evidence and direct human/device/hosted evidence remain separate artifacts.

**Tech Stack:** React/Vite, Node `node:test`, Playwright, service worker/offline fixtures, Supabase migration verification, Git.

**Spec:** `docs/superpowers/specs/2026-09-01-sound-seekers-proper-educational-game-design.md`

## Global Constraints

- The production app, authenticated-free preview, child-surface preview, loading preview, and accessibility inventory all mount the same `SoundSeekersRoute` and `SoundSeekersGame` implementation.
- The `phonics_quest` route, storage area, privacy boundary, teacher assignment, and app-owned accessibility/audio preferences remain stable.
- Teacher reports describe practice as `Practised independently`, `Building through practice`, `Needs an explicit teaching check`, or `Not yet played`; they do not say `mastered`, `proven`, `Got it`, or `Secure` for Sound Seekers evidence.
- Engagement data such as travel time, duration, collisions, Sparks, cosmetics, and reaction speed is never displayed as learning mastery.
- The legacy Pixel, fallback 2D, and Three.js runtimes and directly owned assets are deleted only after the zero-reference gate and replacement behavior tests pass.
- One renderer-neutral Sound Seekers runtime chunk is cached and updated atomically; offline resume restores a safe v2 checkpoint without manufacturing evidence.
- Automated checks may not claim human listening, physical iPad Safari, assistive-technology, observed-child, authenticated-hosted, deployment, or production-operation approval.
- Browser/WebKit emulation is reported as browser automation, not physical-device evidence.
- Cleanup removes generated scratch, rejected art, stale screenshots, old runtime artifacts, and superseded code/assets while preserving current evidence and irreplaceable source material.
- Final integration fetches and rebases on current `origin/main`, reruns scoped verification after the rebase, commits only the rebuild scope, and pushes the verified head to `origin/main`.

---

### Task 1: Cut the app route and teacher/reporting surfaces over to v2 practice truth

**Files:**
- Modify: `src/appState/appRuntimeSurfaces.jsx`
- Modify: `src/components/AppSurface.jsx`
- Modify: `src/components/StudentSoundTrailPage.jsx`
- Modify: `src/quest-preview.jsx`
- Modify: `src/child-surfaces-preview.jsx`
- Modify: `src/child-route-loading-preview.jsx`
- Create: `src/utils/questPracticeReport.js`
- Delete: `src/utils/questReport.js`
- Modify: `src/App.jsx`
- Modify: `src/appState/useAppSessionController.js`
- Modify: `src/components/FinishedReportPage.jsx`
- Modify: `src/components/TeacherTodayPage.jsx`
- Modify: `src/components/TeacherStudentsPage.jsx`
- Modify: `src/components/reports/StudentReportViews.jsx`
- Modify: `src/components/reports/studentReportUiUtils.js`
- Modify: `src/data/studentReportingWorkspaceModel.js`
- Modify: `src/utils/exportStudentProgressSimple.js`
- Modify: `src/utils/exportStudentReportWorkbook.js`
- Modify: `src/utils/exportStudentWorkspaceCsv.js`
- Create: `tests/unit/soundSeekersRouteCutover.test.js`
- Create: `tests/unit/questPracticeReport.test.js`

**Interfaces:**
- Consumes: `<SoundSeekersRoute progressScopeKey isSoundEnabled onExit accessibilitySettings />`, v2 evidence, repairs, journey step, assignment, and reporting evidence kind `practice`.
- Produces: lazy export `SoundSeekersRoute`, `buildQuestPracticeReport(state)`, and `classPracticeSummary(reports)`; downstream report shape retains `stopsCompleted`, `sounds`, `currentFocus`, `lastActiveAt`, and `assignment` but uses practice-safe status/copy.

- [ ] **Step 1: Write failing route and reporting-boundary tests**

```js
test("every Sound Seekers route imports the one v2 feature", () => {
  for (const file of ["src/appState/appRuntimeSurfaces.jsx", "src/quest-preview.jsx", "src/child-surfaces-preview.jsx", "src/child-route-loading-preview.jsx"]) {
    const source = read(file);
    assert.match(source, /SoundSeekersRoute/);
    assert.doesNotMatch(source, /QuestRoot|QuestPixelWorld|QuestTrail2D|QuestHub/);
  }
});

test("practice report cannot promote game play to formal security", () => {
  const report = buildQuestPracticeReport(v2StateWithIndependentPractice());
  assert.equal(report.evidenceKind, "practice");
  assert.equal(report.sounds[0].status, "Practised independently");
  assert.doesNotMatch(JSON.stringify(report), /mastered|proven|Got it|Secure/i);
  assert.equal(report.formalAssessmentStatus, undefined);
});

test("motor and reward fields are absent from learning rows", () => {
  const report = buildQuestPracticeReport(v2StateWithTravelAndCoins());
  assert.deepEqual(report.sounds.flatMap(row => Object.keys(row)).filter(key => /travel|collision|spark|coin|reaction/i.test(key)), []);
});
```

- [ ] **Step 2: Run route/report tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersRouteCutover.test.js tests/unit/questPracticeReport.test.js`

Expected: FAIL because app surfaces still import `QuestRoot` and reporting still uses the mastery report.

- [ ] **Step 3: Wire the single route and practice-only report adapter**

```js
export function buildQuestPracticeReport(state = {}) {
  const evidence = normalizeSoundSeekersState(state).evidence;
  return {
    evidenceKind: "practice",
    stopsCompleted: normalizeSoundSeekersState(state).trail.completedStopIds.length,
    sounds: summarizeTargets(evidence).map(row => ({
      ...row,
      status: practiceStatusLabel(row.readiness),
      nextTeachingAction: describeConstructAndConfusion(row)
    })),
    currentFocus: selectTeachingChecks(evidence),
    assignment: state.assignment || null,
    lastActiveAt: latestEvidenceAt(evidence)
  };
}
```

Lazy-load `SoundSeekersRoute` from `src/features/soundSeekers/SoundSeekersRoute.jsx`; update AppSurface's render callback and all previews. Replace `buildQuestMasteryReport` imports/parameter names with `buildQuestPracticeReport`. Update teacher, family, workspace, CSV, and workbook copy so game practice is never described as formal mastery. Keep construct, target, domain, independent/supported distinction, recent confusion, word/position, connected/novel transfer, and next explicit teaching action. Keep assignment ownership and child privacy unchanged.

- [ ] **Step 4: Run route, report, policy, export, and build checks**

Run: `node --test tests/unit/soundSeekersRouteCutover.test.js tests/unit/questPracticeReport.test.js tests/unit/teacherProgressOverview.test.js tests/unit/learningPolicy.test.js tests/unit/progressMerge.test.js`

Expected: PASS with no forbidden Sound Seekers claim.

Run: `npm run build`

Expected: PASS and the student route opens the new campaign map.

- [ ] **Step 5: Commit the production/report cutover**

```bash
git add src/appState/appRuntimeSurfaces.jsx src/components/AppSurface.jsx src/components/StudentSoundTrailPage.jsx src/quest-preview.jsx src/child-surfaces-preview.jsx src/child-route-loading-preview.jsx src/utils/questPracticeReport.js src/App.jsx src/appState/useAppSessionController.js src/components/FinishedReportPage.jsx src/components/TeacherTodayPage.jsx src/components/TeacherStudentsPage.jsx src/components/reports/StudentReportViews.jsx src/components/reports/studentReportUiUtils.js src/data/studentReportingWorkspaceModel.js src/utils/exportStudentProgressSimple.js src/utils/exportStudentReportWorkbook.js src/utils/exportStudentWorkspaceCsv.js tests/unit/soundSeekersRouteCutover.test.js tests/unit/questPracticeReport.test.js
git rm src/utils/questReport.js
git commit -m "feat: cut Sound Seekers over to v2"
```

### Task 2: Remove the superseded child runtimes, UI, utilities, checks, tests, styles, and owned assets

**Files:**
- Create: `tools/checkSoundSeekersLegacyReferences.mjs`
- Create: `tests/unit/soundSeekersLegacyRetirement.test.js`
- Delete: `src/components/quest/BookCharacterAvatar.jsx`
- Delete: `src/components/quest/CreatureCreator.jsx`
- Delete: `src/components/quest/CreatureFigure.jsx`
- Delete: `src/components/quest/ParallaxScene.jsx`
- Delete: `src/components/quest/QuestFieldStudyConsole.jsx`
- Delete: `src/components/quest/QuestRoot.jsx`
- Delete: `src/components/quest/QuestSettingsDialog.jsx`
- Delete: `src/components/quest/RewardScreen.jsx`
- Delete: `src/components/quest/TradingPost.jsx`
- Delete: `src/components/quest/TrailMap.jsx`
- Delete: `src/components/quest/bookCharacterAvatar.js`
- Delete: `src/components/quest/shells/`
- Delete: `src/components/quest/world/`
- Delete: `src/data/questChapterMechanics.js`
- Delete: `src/data/questChapterOne.js`
- Delete: `src/data/questMechanicMatrix.js`
- Delete: `src/data/questPixelCast.js`
- Delete: `src/data/questPixelMaps.js`
- Delete: `src/data/questWorlds.js`
- Delete: `src/utils/questActionAudio.js`
- Delete: `src/utils/questAudio.js`
- Delete: `src/utils/questCreature3D.js`
- Delete: `src/utils/questEncounters.js`
- Delete: `src/utils/questHub.js`
- Delete: `src/utils/questJourney.js`
- Delete: `src/utils/questLabels.js`
- Delete: `src/utils/questPerformance.js`
- Delete: `src/utils/questPhysicalMechanics.js`
- Delete: `src/utils/questPhysicalPlan.js`
- Delete: `src/utils/questProgress.js`
- Delete: `src/utils/questReviewMode.js`
- Delete: `src/utils/questRounds.js`
- Delete: `src/utils/questRouteGraph.js`
- Delete: `src/utils/questSegments.js`
- Delete: `src/utils/questSliceSystems.js`
- Delete: `src/utils/questTelemetry.js`
- Delete: `src/utils/questWorldResume.js`
- Delete: `src/styles/quest.css`
- Delete: `src/styles/quest-evidence.css`
- Delete: `public/game-assets/quest-pixel/`
- Delete: `public/game-assets/sound-seekers/worlds/`
- Delete: `public/images/quest/`
- Delete: `public/models/quest/`
- Delete: legacy-only unit tests named in `LEGACY_TEST_PATHS` inside the new checker.

**Interfaces:**
- Consumes: a passing route cutover, v2 runtime tests, and `rg` reference inventory.
- Produces: `LEGACY_SOURCE_PATHS`, `LEGACY_ASSET_PATHS`, `LEGACY_TEST_PATHS`, `assertNoLegacySoundSeekersReferences(root)`, and zero imports/URLs to removed material.

- [ ] **Step 1: Write the retirement test with the exact manifest**

```js
test("no production, preview, test, tool, or stylesheet references legacy Sound Seekers", () => {
  const result = assertNoLegacySoundSeekersReferences(repoRoot);
  assert.deepEqual(result.references, []);
  assert.deepEqual(result.existingLegacyPaths, []);
});

test("the only production orchestrator is SoundSeekersGame", () => {
  const candidates = findProductionGameOrchestrators(repoRoot);
  assert.deepEqual(candidates, ["src/features/soundSeekers/SoundSeekersGame.jsx"]);
});
```

The manifest must explicitly enumerate every path listed above plus old Quest tests that import a deleted module, Pixel/3D/2D build tools (`buildQuest2DTiles.mjs`, `buildQuestArtSheet.mjs`, `checkQuest3DAssets.mjs`, `checkQuestChapterOneRelease.mjs`, `checkQuestPixel.mjs`, `checkQuestPixelBundle.mjs`, `checkQuestRouteVisual.mjs`, `checkQuestSliceCamera.mjs`, `optimiseQuestArt.mjs`), and obsolete script names in `package.json`.

- [ ] **Step 2: Run the retirement test and confirm the red state**

Run: `node --test tests/unit/soundSeekersLegacyRetirement.test.js`

Expected: FAIL and enumerate the still-existing legacy paths/references.

- [ ] **Step 3: Delete only manifest-proven legacy material and repair consumers**

Use `git rm` with the exact manifest paths. Rewrite surviving curriculum tests against `src/features/soundSeekers/content`; delete tests whose sole purpose was collision stages, renderer fallbacks, shell labels, Pixel maps, 3D assets, old route graph, or batch mastery. Update `package.json` to remove obsolete script entries and add renderer-neutral v2 scripts. Before deleting each asset root, require the checker to show zero references outside a legacy path; if any non-quest consumer exists, move only the specifically referenced asset to its consumer-owned root and update that import. Do not remove `three`, R3F, or shared premium-render dependencies because other Arcade games use them; retain Phaser because v2 uses it.

- [ ] **Step 4: Run reference, hygiene, unit, and build checks**

Run: `node tools/checkSoundSeekersLegacyReferences.mjs && node --test tests/unit/soundSeekersLegacyRetirement.test.js`

Expected: PASS with no existing legacy path or reference.

Run: `npm test && npm run build && npm run check:repo-hygiene`

Expected: PASS; the full unit suite reflects removed legacy assertions and added v2 behavior tests.

- [ ] **Step 5: Commit the recoverable Git deletion**

```bash
git add tools/checkSoundSeekersLegacyReferences.mjs tests/unit/soundSeekersLegacyRetirement.test.js package.json
git add -u src public tests tools
git commit -m "refactor: retire legacy Sound Seekers runtimes"
```

### Task 3: Rebuild offline, update, bundle, and cold-resume checks around the sole v2 runtime

**Files:**
- Rewrite: `tools/viteQuestOfflinePlugin.mjs`
- Rewrite: `tools/checkQuestOffline.mjs`
- Rewrite: `tools/buildQuestOfflineUpdateFixtures.mjs`
- Rewrite: `tests/quest-offline/quest-offline.spec.js`
- Rewrite: `tests/quest-update/quest-update.spec.js`
- Rewrite: `tests/quest-soak/quest-soak.spec.js`
- Create: `tools/checkSoundSeekersBundle.mjs`
- Create: `tests/unit/soundSeekersOfflineContract.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: the Vite build manifest, the one Sound Seekers route chunk, v2 asset manifest, and v2 checkpoint normalizer.
- Produces: renderer-neutral `check:quest-offline`, `check:sound-seekers-bundle`, atomic service-worker versions, cold-start fixtures, update fixtures, and soak coverage.

- [ ] **Step 1: Write failing atomic-update and safe-resume tests**

```js
test("offline manifest contains one v2 runtime and every declared biome asset", () => {
  const manifest = buildOfflineContract(viteManifest, soundSeekersAssets);
  assert.equal(manifest.runtimeChunks.filter(path => /soundSeekers/i.test(path)).length, 1);
  assert.deepEqual(new Set(manifest.biomeAssets), new Set(soundSeekersAssets.map(asset => asset.path)));
});

test("old and new hashed chunks are never mixed in one activated cache", () => {
  const activated = activateUpdateFixture(oldRelease, newRelease);
  assert.equal(activated.cacheVersion, newRelease.version);
  assert.deepEqual(activated.assets, newRelease.assets);
});

test("offline resume restores slots but emits no new evidence", () => {
  const restored = restoreOfflineCheckpoint(wordForgeCheckpoint);
  assert.deepEqual(restored.verbState.slots, wordForgeCheckpoint.verbState.slots);
  assert.deepEqual(restored.pendingEvents, []);
});
```

- [ ] **Step 2: Run offline tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersOfflineContract.test.js`

Expected: FAIL because current offline tooling is Pixel-specific and the v2 contract does not exist.

- [ ] **Step 3: Implement renderer-neutral precache and atomic activation**

Derive cache entries from the built route chunk and `public/game-assets/sound-seekers/v2/SOURCE.md`; do not hard-code obsolete chunk names. Stage the complete next cache under its version, verify every response and hash, then activate and delete the old version. On failure, keep the complete old cache. Cold start must load the map, every power's core UI, the current biome, instruction audio fallback, and checkpoint while offline. Update and soak tests use visible progress, reload mid-power, corrupted local state, interrupted audio, and repeated 40→1 circuits without hidden completion APIs.

- [ ] **Step 4: Run offline, update, soak, bundle, and build checks**

Run: `node --test tests/unit/soundSeekersOfflineContract.test.js && npm run build:quest-offline-test`

Expected: PASS.

Run: `npm run test:quest-offline && npm run test:quest-update && npm run test:quest-soak-smoke`

Expected: PASS without mixed-chunk activation or manufactured resume evidence.

Run: `node tools/checkSoundSeekersBundle.mjs`

Expected: PASS with the runtime lazy on unrelated routes, one game engine, and configured compressed-size budget met.

- [ ] **Step 5: Commit offline and update truth**

```bash
git add tools/viteQuestOfflinePlugin.mjs tools/checkQuestOffline.mjs tools/buildQuestOfflineUpdateFixtures.mjs tools/checkSoundSeekersBundle.mjs tests/quest-offline/quest-offline.spec.js tests/quest-update/quest-update.spec.js tests/quest-soak/quest-soak.spec.js tests/unit/soundSeekersOfflineContract.test.js package.json
git commit -m "fix: make Sound Seekers v2 offline-safe"
```

### Task 4: Replace proxy release checks and update the governing documentation

**Files:**
- Rewrite: `docs/SOUND_SEEKERS_RELEASE_BIBLE.md`
- Rewrite: `docs/SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md`
- Rewrite: `docs/SOUND_SEEKERS_WORLD_V2_BLUEPRINT.md`
- Modify: `docs/design/GAME_DESIGN_BIBLE.md`
- Modify: `docs/INDEX.md`
- Rewrite: `tools/checkQuestPacing.mjs`
- Rewrite: `tools/checkQuestArt.mjs`
- Rewrite: `tools/checkQuestDeviceEvidence.mjs`
- Rewrite: `tools/checkQuestHumanEvidence.mjs`
- Rewrite: `tools/sealQuestHumanObservation.mjs`
- Create: `tools/checkSoundSeekersRelease.mjs`
- Create: `tests/unit/soundSeekersReleaseContract.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: v2 catalogs, runtime behavior tests, artifact manifests, device/human evidence schemas, and the sole threshold exports from `questMastery.js`.
- Produces: `check:quest`, `check:quest-release`, `check:sound-seekers-game`, `check:sound-seekers-art`, `check:quest-device-harness`, `check:quest-device-acceptance`, `check:quest-human-harness`, and `check:quest-human-acceptance` with honest result categories.

- [ ] **Step 1: Write failing release-truth tests**

```js
test("the release gate names every automated and direct evidence class", () => {
  const contract = readReleaseContract();
  assert.deepEqual(contract.automated.sort(), ["accessibility", "art", "audio-contract", "browser", "build", "content", "evidence", "lint", "offline", "unit"].sort());
  assert.deepEqual(contract.direct.sort(), ["assistive-technology", "authenticated-hosted", "deployment", "human-listening", "observed-child", "physical-ipad", "production-operation", "visual-review"].sort());
});

test("missing direct evidence is open, never passed or failed by emulation", () => {
  const result = evaluateDirectEvidence(emptyEvidenceDirectory());
  assert.equal(result["physical-ipad"].status, "open");
  assert.equal(result["observed-child"].status, "open");
  assert.equal(result["human-listening"].status, "open");
});

test("only questMastery exports numeric readiness thresholds", () => {
  assert.deepEqual(findDuplicateQuestThresholds(repoRoot), []);
});
```

- [ ] **Step 2: Run the release-contract test and confirm the red state**

Run: `node --test tests/unit/soundSeekersReleaseContract.test.js`

Expected: FAIL because current bibles/gates describe Pixel/3D paths and proxy evidence.

- [ ] **Step 3: Make the v2 Bible, matrix, blueprint, and gates authoritative**

Document the six learning powers, 40 expedition loop, seven evidence domains, v2 state, exact instruction/audio lifecycle, 60-word/40-scene/eight-biome content, motor-assist invariants, direct evidence boundary, legacy retirement, and release commands. The curriculum matrix imports or names threshold constants from `questMastery.js` instead of copying numbers. Pacing measures literacy-action density, instruction-to-action delay, repair payoff, and safe-resume length separately from traversal. Art checks use v2 manifest, semantic object declarations, contrast priority, crop dimensions, and provenance. Device/human schemas record environment, exact build/revision, observed interactions, failures, and reviewer identity without student-identifying data. `--allow-missing` reports `open`; acceptance mode fails until valid direct records exist.

- [ ] **Step 4: Run Bible, static, harness, and release checks**

Run: `node --test tests/unit/soundSeekersReleaseContract.test.js && npm run check:quest && npm run check:sound-seekers-game && npm run check:sound-seekers-art`

Expected: PASS.

Run: `npm run check:quest-device-harness && npm run check:quest-human-harness`

Expected: PASS while explicitly reporting unperformed direct gates as `open`; acceptance commands remain non-green without real evidence.

- [ ] **Step 5: Commit the v2 release authority**

```bash
git add docs/SOUND_SEEKERS_RELEASE_BIBLE.md docs/SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md docs/SOUND_SEEKERS_WORLD_V2_BLUEPRINT.md docs/design/GAME_DESIGN_BIBLE.md docs/INDEX.md tools/checkQuestPacing.mjs tools/checkQuestArt.mjs tools/checkQuestDeviceEvidence.mjs tools/checkQuestHumanEvidence.mjs tools/sealQuestHumanObservation.mjs tools/checkSoundSeekersRelease.mjs tests/unit/soundSeekersReleaseContract.test.js package.json
git commit -m "docs: establish Sound Seekers v2 release truth"
```

### Task 5: Run the complete clean-checkout release matrix and record evidence without fabricating direct gates

**Files:**
- Create: `docs/evidence/sound-seekers-v2-automated.md`
- Create: `docs/evidence/sound-seekers-v2-direct-gates.md`
- Create: `tools/writeSoundSeekersAutomatedEvidence.mjs`
- Create: `tests/unit/soundSeekersEvidenceDocument.test.js`

**Interfaces:**
- Consumes: command result JSON captured by `tools/writeSoundSeekersAutomatedEvidence.mjs`, Git revision, asset hashes, screenshot manifest, and direct-evidence harness summaries.
- Produces: a revision-bound automated evidence report and a direct-gate status report containing `open | passed | failed` with provenance.

- [ ] **Step 1: Write the failing evidence-document contract**

```js
test("automated evidence names revision, command, exit status, and artifact", () => {
  const evidence = readAutomatedEvidence();
  assert.ok(/^[0-9a-f]{40}$/.test(evidence.revision));
  for (const run of evidence.runs) {
    assert.ok(run.command);
    assert.equal(run.exitCode, 0);
    assert.ok(run.completedAt);
  }
});

test("direct evidence keeps unperformed gates open", () => {
  const direct = readDirectGateEvidence();
  for (const id of ["human-listening", "physical-ipad", "assistive-technology", "observed-child", "authenticated-hosted", "deployment", "production-operation"]) {
    assert.ok(["open", "passed", "failed"].includes(direct[id].status));
    if (!direct[id].recordPath) assert.equal(direct[id].status, "open");
  }
});
```

- [ ] **Step 2: Run the evidence-document test and confirm the red state**

Run: `node --test tests/unit/soundSeekersEvidenceDocument.test.js`

Expected: FAIL because the revision-bound evidence documents do not exist.

- [ ] **Step 3: Run the clean release matrix and write only observed results**

Run from a clean working tree after all prior task commits:

```bash
npm test
npm run lint
npm run build
npm run check:quest
npm run check:quest-release
npm run check:sound-seekers-content
npm run check:sound-seekers-art
npm run check:sound-seekers-game
npm run check:sound-seekers-bundle
npm run test:quest-browser
npm run test:quest-offline
npm run test:quest-update
npm run test:quest-soak-smoke
npm run check:repo-hygiene
```

Feed each actual command, exit code, completion time, Git revision, and artifact location to `tools/writeSoundSeekersAutomatedEvidence.mjs`. Inspect the eight chapter maps and all major states directly at full desktop, 320px portrait/landscape, simplified, and reduced-motion crops; record reviewer as `automated visual inspection` unless a human actually signs. Write direct gate statuses from their real evidence directories only. The user's statement that no child has used the game means `observed-child` remains `open`, not passed.

- [ ] **Step 4: Verify the evidence documents and final scope**

Run: `node --test tests/unit/soundSeekersEvidenceDocument.test.js && npm run check:quest-release`

Expected: PASS for automated evidence and truthful direct-gate status.

Run: `git diff --check && git status --short && node tools/checkSoundSeekersLegacyReferences.mjs`

Expected: no whitespace errors, no uncommitted generated scratch, and no legacy reference.

- [ ] **Step 5: Commit the release evidence**

```bash
git add docs/evidence/sound-seekers-v2-automated.md docs/evidence/sound-seekers-v2-direct-gates.md tools/writeSoundSeekersAutomatedEvidence.mjs tests/unit/soundSeekersEvidenceDocument.test.js
git commit -m "test: record Sound Seekers v2 release evidence"
```
