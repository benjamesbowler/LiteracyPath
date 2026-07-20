# Sound Seekers — Complete Audit & Remediation Plan

**Date:** 2026-07-20 · **Scope:** the Sound Seekers phonics quest (entry `src/components/quest/QuestRoot.jsx`; world/pixel runtime under `src/components/quest/world/`; quest utils `src/utils/quest*.js`; data `src/data/questSequence.js`, `creatureParts.js`; phonics content `src/content/initialSounds/`; and the Sound-Seekers arcade games Sound Safari / Sound Racer / Sound Beat).

## How this audit was produced

This is a multi-agent audit, not a single read-through. **21 independent reviewer agents** each took a slice of the subsystem — by file cluster (QuestRoot orchestration, the 5,722-line pixel runtime split across a performance pass and a correctness pass, the 5,145-line QuestHub split across a logic pass and a UX pass, trail navigation, round/question selection, mastery & spaced review, physical mechanics, slice systems, progress persistence, rewards/economy/creature, telemetry/privacy, the three arcade games, and audio cues) and by cross-cutting lens (pre-reader accessibility, low-end-iPad performance, curriculum/pedagogy, and a docs-vs-code reality check against your recent Sound Seekers critique docs).

Every issue a reviewer raised was then handed to a **separate adversarial verifier** that re-read the actual code at the cited location and tried to *refute* it. Only issues whose mechanism was confirmed in the real source survived.

- **100 issues raised → 71 confirmed** after adversarial verification (29 were refuted or downgraded to noise and dropped).
- A further **18 issues were raised but their verification did not complete** (the run hit a session limit at the very end). They are listed, clearly marked as *unverified*, in Appendix A — treat them as leads, not findings.
- The automated synthesis step also did not complete; this document's executive summary and remediation plan were written by hand from the confirmed findings.

Every finding below cites `file:line` and was confirmed against the current code on branch `comic-redesign-audit-fixes`.

## Executive summary

Sound Seekers is a large, ambitious, and — in most places — genuinely well-engineered subsystem: it has extensive defensive code, a deliberate 3D→pixel→2D quality-degrade design, a spaced-review system, and a strong test suite (30+ quest test files). The problems the audit found are concentrated in a few themes rather than spread thin, and the two most severe ones are **silent** — they don't crash loudly, they quietly strand or mislead a child who cannot read the fallback.

The headline issues:

1. **Two critical, child-facing failures.** (a) The pixel/3D world is loaded with a plain `lazy()` — no retry, no error boundary — so a chunk-load or mount failure on flaky school Wi-Fi (or a stale service worker after a deploy) ejects a pre-reader to a **text-only, buttonless crash screen** instead of the always-bundled 2D trail that would have worked. (b) A recent regression means the pixel world **does not rebuild its answer objects after the first beat of an encounter**, so from beat 2 onward the child walks to stale/wrong objects and the correct answer does nothing — the exact "correct answer silently ignored" failure the codebase has fought hard to eliminate, now reintroduced on the *default* rendering tier.

2. **The audio contract is assumed but not enforced.** The app's gold-voice policy (recorded child-voice only; never robotic TTS; content that needs sound is gated on a recording existing) holds inside the quest world but is broken in several high-traffic places: the Sound Safari word ladder selects many words with **no recording** (up to 43% of hard words play silence to a non-reader), digraph reinforcement (`sh/ch/th/…`) is silently dropped even though the clips exist, and the phonics learning tab plus the **login screen every child passes through** fall back to robotic browser TTS on a cache miss.

3. **Persistence assumes localStorage never fails.** On a full shared-classroom iPad, a quota failure silently loses all quest progress — and the reassuring code comment promising a "cloud queue still carries it" is false. Several scoring/economy bugs compound this: resuming a Sound Safari run corrupts the star score (perfect resumed play scores 1 star), and a silver/gold egg can charge the priciest currency in the game and hatch a guaranteed duplicate that's silently dropped while showing a fake "Your egg hatched!" celebration.

4. **Reduced-motion and pre-reader audio support are honored inconsistently.** Several surfaces read `prefers-reduced-motion` but only slow the animation clock while the dominant motion keeps moving, and many overlays/nav/reward screens deliver their message as text with no narration.

None of this makes Sound Seekers unshippable, but the two criticals and the audio cluster directly undermine the core promise for the exact audience — 4–7-year-old pre-readers on low-end shared iPads — and should be fixed before the next classroom rollout.

## Severity snapshot

| Category | 🔴 | 🟠 | 🟡 | ⚪ | Total |
|---|---|---|---|---|---|
| Correctness & progression-blocking bugs | 2 | 1 | 10 | 6 | 19 |
| Data integrity & persistence | · | 1 | · | 4 | 5 |
| Curriculum & pedagogy | · | 2 | 4 | 1 | 7 |
| Audio & the gold-voice policy | · | 3 | 4 | 2 | 9 |
| Accessibility & pre-reader UX | · | · | 4 | 2 | 6 |
| Performance on low-end iPads | · | · | 6 | 6 | 12 |
| UX & flow | · | · | · | 9 | 9 |
| Privacy & data collection | · | · | 1 | 1 | 2 |
| Code quality / dead code | · | · | · | 2 | 2 |
| **Total** | **2** | **7** | **29** | **33** | **71** |

> **Note on near-duplicates.** Because reviewers overlapped deliberately, a few entries above describe the same defect from two angles — the Phaser-4 `shutdown()` dead-code (`questPixelRuntime.js:5636`) and the inert `resolution` DPR cap (`questPixelRuntime.js:5668`) each appear twice, and `loadQuestProgress runs twice on mount` restates the double-`commit` theme. They are left in so no reviewer's evidence is lost; treat them as one issue each when planning.

---

# Detailed remediation plan

Phases are ordered by risk to the child, not by effort. Effort tags: **S** ≈ <½ day, **M** ≈ ½–2 days, **L** ≈ multi-day. Every task names the check that proves it done — per the project's cardinal rule, "done" means a named check went green.

## P0 — Ship-blockers (before the next classroom rollout)

These two both fail *silently* for a non-reading child, and both are on the default rendering path.

- **P0.1 — Make the pixel/3D world crash-recoverable.** `QuestRoot.jsx:93`. Load `QuestPixelWorld`/`QuestHub` with `lazyWithRetry` (as `App.jsx` already does for `QuestRoot`) and wrap each lazy `<Suspense>` in a local `ErrorBoundary` whose fallback drives the *existing* 2D degrade (`setForce2d(true)` / `handleRuntimeSignal({type:'renderer-error', toTier:'2d'})`). **Effort M.** **Verify:** in devtools, block the world chunk request (or throw in the pixel scene's mount) and confirm the child lands on the always-bundled `QuestTrail2D`, not `PageErrorFallback`; add a smoke test that mounts QuestRoot with a rejecting import and asserts the 2D trail renders.
- **P0.2 — Rebuild pixel answer objects on every beat/stage change (regression).** `questPixelRuntime.js:4242`. In `applyModel`, when the model signature changes, call `rebuildChoices(model.activeStage, model.activeEncounterId)` directly; keep the zoom-bucket-gated debounced rebuild in `handleResize` for genuine viewport resizes only. **Effort M.** **Verify:** extend `tests/unit/questCorrectAnswerAlwaysResolves.test.js` to drive a multi-beat encounter through the pixel model and assert `choiceObjects` ids match the *current* stage on beats 2..N; manually confirm a 3-stage word beat resolves in the pixel world on a stable viewport (desktop/kiosk).

## P1 — High (current sprint)

- **P1.1 — Gold-voice compliance sweep** (one coordinated change closing four audio findings). (a) Restrict the Sound Safari word ladder to words passing `hasWordAudio()` and add a **build-time coverage check** that fails if any ladder word lacks a clip (`soundSafariRounds.js:11`, and the 13/30 hard-word silence); (b) route digraph reinforcement through `speakPhoneme` so existing `sh/ch/th/wh/ck/ng` clips play (`SoundSafariArcadeGame.jsx:723`); (c) neutralise robotic-TTS fallback on the phonics learning surface and the login screen — make `usePhonicsAudio`'s `speakWithBrowser` a production no-op like `learnGamesAudio` already does, and hide the button via `hasRecordedSpeech()` (`usePhonicsAudio.js:165`, `StudentLoginFlow.jsx:27`). **Effort M.** **Verify:** new coverage test asserting every ladder word and every taught grapheme is recorded-or-gated; a grep-based test that no live path calls the real `speakWithBrowser`.
- **P1.2 — Stop banking mastery for sounds the child never heard.** `QuestHub.jsx:4505`. Thread `stageRecordsMastery` into the answer path (pass `recordsMastery:false` in `meta` when a stage has an undelivered `audioCue`, and have `QuestRoot` skip the mastery write) — exactly as `QuestTrail2D` already does. **Effort S–M.** **Verify:** unit/integration test with `soundEnabled:false` confirming a correct field answer does **not** write `state.mastery[target]`.
- **P1.3 — Make persistence honest about quota.** `questStore.js:40`. On `setItem` failure, evict low-value keys (stale `lp-cloud-progress-rows` cache, capped telemetry) and retry; surface a one-time "progress may not be saving" signal for logged-in sessions; correct the false "cloud queue still carries it" comment (it lives in the same localStorage, and anonymous scope has no cloud queue at all). **Effort M.** **Verify:** fill localStorage to quota in a test harness, then save → assert eviction+retry succeeds and the signal fires.
- **P1.4 — Fix the egg economy so `canBuy` and the hatch agree.** `hollowEconomy.js:192`. Make an egg's reachable pool a single **union** of its rarities and do the prefer-unowned search across that union (or fall back to the other sub-pool when the rolled one is exhausted), so a full-price egg can never hatch a guaranteed duplicate. **Effort S.** **Verify:** unit test — own all rares + one missing epic → `canBuy('egg-gold')` true **and** every gold hatch yields the epic (or refunds); no fake "hatched" celebration.
- **P1.5 — Score Sound Safari resumes against what was actually played.** `SoundSafariArcadeGame.jsx:1391`. Track `presentedUnits` (sum of `taskUnits` for levels from the starting stage onward) and pass that as `total` to the star rubric instead of `totalUnits(ladder)`. **Effort S.** **Verify:** unit test — resume at level 5, play flawlessly → 3 stars (currently 1).

## P2 — Medium (next)

Grouped so shared changes land together.

- **P2.a — Pixel-runtime Phaser-4 lifecycle** (`questPixelRuntime.js` 5636 / 1155 / 5668): register `this.events.once(SHUTDOWN, this.shutdown, this)` in `create()` so teardown cleanup actually runs and the stray resize timer can't fire on a destroyed scene; add a `loaderror` handler that reports asset 404s via the diagnostics bridge and substitutes a neutral placeholder for critical actors; replace the inert `resolution` config with the Phaser-4 DPR mechanism so the 2× cap is real. **Effort M.** **Verify:** unit test that a scheduled resize-rebuild is cleared on destroy; manual cold-cache check that a 404'd actor shows a placeholder, not the green missing-texture box.
- **P2.b — QuestHub scoring & render cost** (`QuestHub.jsx` 4483 / 1798 / 4860): key first-attempt star tally on `encounterId:beatIndex` alone so multi-stage word beats aren't double-counted; hoist one reusable `Raycaster` and restrict the sightline raycast to a pre-collected occluder set (and/or throttle); wrap `activeFieldTask`/`encounterTasks`/`satchel` in `useMemo`. **Effort M.** **Verify:** star-tally unit test for a fumbled-then-completed word beat; frame-budget sampler shows fewer dropped frames during encounters on a low-end device.
- **P2.c — Debounce the save path.** `QuestRoot.jsx:454`. Don't `commit()` a full normalize + `JSON.stringify` + synchronous `localStorage.setItem` on every runtime/telemetry tick; coalesce runtime-signal saves to the existing 15s cadence or flush on view-change/quit. **Effort S.** **Verify:** instrument save count during a 2-minute play session — should drop from ~1 per 10s to a handful.
- **P2.d — Curriculum & review engine** (`initialSoundWordBank.js:234`, `initialSoundSelector.js:73`, `questMastery.js:185` & `:233`, `questReviewScheduler.js:40`): remove the phonically-correct `c` distractor for target `k`; require more than one correct answer before marking a letter mastered; stop timeouts/assisted attempts from permanently depressing accuracy aggregates; make the Leitner boxes actually assign boxes 2–3 (they're currently inert) and stop a just-mastered-then-missed sound re-mastering the same day. **Effort M–L.** **Verify:** the existing `questReviewScheduler.test.js` / `questMastery.test.js` extended with cases that currently pass wrongly; a curriculum spot-check that no target word's distractor set contains a phonically-correct answer.
- **P2.e — Resume & navigation robustness** (`QuestTrail2D.jsx:148`, `progressMerge.js:242`): clamp resumed `beatIndex`/`fieldStage` to the rebuilt section (mirror QuestHub) and reset to 0 when `resume.activeId` no longer exists, with an else-branch so a null stage never renders an empty actionless panel; fix the review-circuit "Continue" resetting to stop 1 on a fresh/cache-cleared device. **Effort M.** **Verify:** resume test where the stop's beat structure shrank between save and reload → no empty panel.
- **P2.f — Concurrency & economy integrity** (`QuestRoot.jsx:135`, `hollowState.js:44`): add cross-tab reconciliation (or single-writer election) so two tabs on a shared iPad don't last-write-wins the whole blob or lose sync-queue entries; re-check affordability at purchase time so a child can't double-spend into a permanent negative balance. **Effort M.**
- **P2.g — Privacy.** `questHumanAcceptance.js:43`. Enforce the field-study console's advertised anonymity (reject names typed into "anonymous" code fields) so a child's name can't slip into observation data. **Effort S.** **Verify:** unit test that a name-shaped code is rejected.
- **P2.h — Accessibility: make reduced-motion real** (`SoundSafariArcadeGame.jsx:1524`, `SoundRacerGame.jsx:2933`, `questPerformance.js:148`): when reduced-motion is on, actually slow/stop critter travel and optical-flow — not just the animation clock — and honor OS reduced-motion in the default (auto) pixel-world tier. Add replay + narration to Sound Safari's single-play, text-only prompts (`:1270`) and fix overlapping hit radii that misattribute a correct tap (`:1422`). **Effort M.** **Verify:** with reduced-motion set, confirm dominant motion is genuinely reduced on each game (manual, on device).
- **P2.i — Narrate the text-only moments** (`SoundRacerGame.jsx:3000`, `RewardScreen.jsx:108`, `cuePlayer.js:92`): add voice to onboarding / level-complete / reward overlays (or picture-first equivalents), and make `playCueSequence` continue the chain past a single failed clip so teach cues don't go partly silent on flaky Wi-Fi. **Effort M** (some needs recordings — see caveats).

## P3 — Backlog / polish (the 33 low findings)

Batch these; none are urgent. Themes: **dead code to delete** (adaptive selector scoring never invoked `initialSoundSelector.js:175`; chapter-verb stage threshold `questSliceSystems.js:238`; `sound-sort` shells that can never produce a round `questSequence.js:309`); **telemetry/ledger hygiene** (unbounded hollow feeds/purchases `hollowState.js:53`; offline-evidence replay duplicates events `QuestRoot.jsx:295`; whole-telemetry upload every save `questStore.js:52`); **UX polish** (0-based trail counter `QuestTrail2D.jsx:597`; completed final stop keeps "is-next" highlight `TrailMap.jsx:180`; den backdrop unlock threshold never enforced `denRewards.js:5`; replayed gear-stop re-announces "New gear" `questProgress.js:263`; SoundBeat restarts whole word on any mistimed tap `Ps1ArcadeGame.jsx:880`); and the **SoundRacer intro key handler that traps keyboard nav** (`SoundRacerGame.jsx:2990`). **Verify:** each has a named check in its catalog entry; most are covered by a quick unit test or a manual glance.

## Shared-change callouts

- **One audio module, several bugs.** P1.1 and P2.i are all the same root: audio coverage is *assumed*, not *enforced*. The durable fix is a single build-time check ("every audio-dependent string is recorded or gated") plus making the real `speakWithBrowser` a no-op everywhere. Do it once.
- **One save path, several bugs.** P1.3, P2.c, P2.f and the low telemetry items all touch `questStore.saveQuestProgress` / `progressSync`. Hardening that path once (quota-safe write, debounced cadence, bounded telemetry, cross-tab reconciliation) closes them together.
- **Pixel vs 2D parity.** P0.1, P0.2, P1.2 and P2.e all trace to the same gap: the 2D trail is more hardened than the default pixel/3D world (crash recovery, mastery-gating, resume clamping). Bringing the pixel path to 2D parity is the through-line.

# Coverage & caveats (read before trusting this)

- **On-device testing is required for the performance and a11y findings.** They were confirmed by reading code (frame-budget math, raycast counts, reduced-motion handling) but the *felt* severity on a real low-end iPad is not measured here. The two criticals and the audio findings, by contrast, are code-level certainties.
- **P0.2 is a regression** introduced by commit `19b480b3` (an unconditional `rebuildChoices` was replaced with a zoom-gated one). If that commit is on an unmerged branch, confirm which builds are affected before prioritising.
- **18 leads are unverified** (Appendix A) — the run hit a session limit before they could be adversarially checked. Several corroborate confirmed findings (e.g., the two-Three.js-runtimes item matches a known, deliberately-deferred issue). Verify each against the code before actioning.
- **Duplicates**: a handful of catalog entries are the same defect seen twice (noted above). ~66 distinct issues underlie the 71 entries.

# Appendix A — Raised but NOT verified (18 leads)

These were surfaced by a reviewer but their independent verification did not run (session limit). **Do not action without confirming against the code.** Titles are as raised (some truncated):

- *(perf)* Star Gallery and Grammar Grind do not follow the shared quality-tier probe…
- *(perf)* Two complete Three.js runtimes are shipped *(matches the known, deferred duplicate-three.js issue)*
- *(curriculum)* Initial Sounds offers both `c` and `k`… *(corroborates the confirmed `c`-vs-`k` distractor finding)*
- *(perf)* Frame-budget sampler allocates a fresh sample… each window
- *(a11y)* Settings dialog opens via an unguarded dialog…
- *(perf)* Sound Racer keeps re-rendering the WebGL…
- *(physical-mechanics)* Single-sound signature verbs discard the…
- *(a11y)* "Hear word" lifeline is rendered unconditionally…
- *(perf)* 3D arcade games probe quality once and never re-check…
- *(a11y)* Correct/incorrect feedback relies on colour…
- *(a11y)* Den/Map hub navigation is text-only with no audio…
- *(a11y)* No focus management across Sound Seekers view changes…
- *(docs-vs-code)* Stop s37 (Aster Archive) teaches four alphabet…
- *(a11y)* TrailRun choice buttons have no accessible label…
- *(docs-vs-code)* Voiced instruction/UI copy (the proposed narration) not implemented…
- *(docs-vs-code)* A stale, git-tracked hidden duplicate of… *(likely the `.fuse_hidden…` file under `quest/world/`)*
- *(curriculum)* Words whose initial phoneme is NOT the target sound…
- *(curriculum)* Vowel initial-sound banks mix long-vowel and short-vowel words…

---

# Full findings catalog

Each entry: an ID, severity, `file:line`, what's wrong, the concrete impact, and the fix. Ordered by theme, then severity.

## 1. Correctness & progression-blocking bugs

### SS-01 · 🔴 CRITICAL — Lazy pixel/3D world uses plain lazy() with no retry and no local error boundary — a chunk-load or mount failure ejects the child to a buttonless crash screen instead of the always-bundled 2D trail
`src/components/quest/QuestRoot.jsx:93`

**What's wrong:** const QuestPixelWorld = lazy(() => import("./world/QuestPixelWorld.jsx")); / const QuestHub = lazy(() => import("./world/QuestHub.jsx")); wrapped only in <Suspense fallback={...}> at lines 863-878, with no ErrorBoundary. Contrast App.jsx:154 `const QuestRoot = lazyWithRetry(...)`. The designed in-place fallback (`onSceneError` -> handleRuntimeSignal -> setForce2d(true), lines 459-465) only fires for errors the mounted scene reports; it cannot catch a failed import() or a throw during mount.

**Impact:** The default quality tier is `pixel` (questPerformance.js:150 `resolveQuestQuality` auto branch returns QUEST_QUALITY_TIERS.pixel), so almost every child loads the QuestPixelWorld chunk on entering a world. On flaky school Wi-Fi, offline, or after a deploy invalidates chunk hashes while a stale service worker serves an old index — the exact target environment — the import() rejects. React re-throws the rejection during render (Suspense only holds pending promises, not rejections), so it escapes the inner Suspense to App's PageBoundary and renders <PageErrorFallback/> (App.jsx:323): a text-only 'Something went wrong. Please refresh…

**Fix:** Import the world chunks with `lazyWithRetry` (from utils/lazyWithRetry.js) instead of `lazy`, and wrap each lazy `<Suspense>` in a local ErrorBoundary whose fallback drives the existing 2D degrade (call handleRuntimeSignal({type:'renderer-error', fromTier: activeQuality.id, toTier:'2d', stopId}) or setForce2d(true)/setRuntimeQualityId('2d')). That keeps the child playing in-place on the always-bundled QuestTrail2D instead of crashing them out of the mode.

### SS-02 · 🔴 CRITICAL — Pixel choices never rebuild after the first beat of an encounter (regression): child walks to stale/wrong answer objects
`src/components/quest/world/questPixelRuntime.js:4242`

**What's wrong:** handleResize gates the ONLY rebuild path on a zoom change: `if (zoomChanged && this.model?.activeStage && this.model?.activeEncounterId) { ... this.rebuildChoices(...) }` (4242-4248). applyModel relies on this to refresh choices on every stage change: `this.handleResize({ width: this.scale.width, height: this.scale.height });` (4302). `rebuildChoices` (the sole place `this.choiceObjects.push` runs, 4619) has exactly one caller — line 4246. Camera zoom depends only on verbPattern+viewport (questSliceSystems.js:582…

**Impact:** On encounter entry activeStage flips false->true so zoom changes and beat-1 choices build correctly. For beats 2..N of the same encounter (the norm — multi-beat encounters) the mechanic/verbPattern and viewport are unchanged, so `zoomChanged` is false and rebuildChoices is never called. The pixel world keeps showing beat-1's choice objects (wrong letters/shapes). A pre-reader walks the Beastie to what they see; onChoice fires the stale id, and because that id is not in the new stage's items, `choose()` early-returns as a silent no-op — the exact 'correct answer does nothing' failure the codebase fought hard to eliminate.…

**Fix:** Decouple the stage-transition rebuild from the resize/zoom optimization. In applyModel, when `signature !== this.lastModelSignature`, call `this.rebuildChoices(model.activeStage, model.activeEncounterId)` directly (the signature already captures item identity changes). Keep the zoom-bucket-gated, debounced rebuild inside handleResize strictly for genuine viewport resizes.

### SS-03 · 🟠 HIGH — Silver/gold eggs charge full price but hatch a guaranteed duplicate that is silently dropped
`src/utils/hollowEconomy.js:192`

**What's wrong:** tierPool splits the pool per-roll: gold `return roll % 10 < 6 ? rares : epics;` (silver `roll % 10 < 7 ? commons : rares`). hatchSpecies only searches WITHIN that chosen sub-pool for an unowned species, then `return pool[start]; // everything owned - duplicates allowed`. But canBuy's block checks the UNION: EGG_REACHABLE_RARITIES['egg-gold']=['rare','epic'] and `const remaining = BEASTIES.some(b => rarities.includes(b.rarity) && !ownedSpecies.has(b.id));`. computeHollow then drops the duplicate: `if…

**Impact:** Verified by running the code: a child owning all 3 rares + 1 epic (river-dragon still missing) passes canBuy('egg-gold')=true, but ~60% of purchase-ids hash into the fully-owned RARES sub-pool. Buying then yields NO new beastie (coins 1600 -> 1100, -500 for nothing). HollowPage.jsx then shows a misleading celebration: `setHatched(next.beasties.find(b => !before.has(b.id)) || next.beasties[0] || null)` falls back to an ALREADY-OWNED beastie displayed as 'Your egg hatched!'. Silver is worse (70% waste once all 5 commons are owned). The child loses the most expensive currency in the game with a lie that they gained a creature.

**Fix:** Make the egg's reachable pool a single UNION of all its allowed rarities and do the 'prefer unowned' search across that whole union (weighting rare-vs-epic selection separately from the owned-check), OR have hatchSpecies fall back to the other sub-pool when the rolled one is exhausted. That way canBuy's union-based 'complete' gate and the actual hatch can never disagree.

### SS-04 · 🟡 MEDIUM — Scene shutdown() is dead code in Phaser 4 — resizeRebuildTimer survives teardown and fires rebuildChoices on a destroyed scene
`src/components/quest/world/questPixelRuntime.js:5636`

**What's wrong:** `shutdown()` (5636) is the only place `window.clearTimeout(this.resizeRebuildTimer)` runs (5650) and the only place the resize listener is removed. But Phaser 4's SceneManager.bootScene auto-wires only init/preload/create/update (node_modules/phaser/src/scene/SceneManager.js:480-641) — never a scene-level `shutdown`, and this runtime never registers `this.events.on(Phaser.Scenes.Events.SHUTDOWN, ...)` (zero `events.on`/`events.once` in the file). The rebuild timer is a browser timer Phaser cannot clear:…

**Impact:** shutdown()'s cleanup never runs on teardown. When the child leaves an encounter/quits (React effect cleanup calls `game.destroy(true)`), a pending 150ms resizeRebuildTimer keeps running and then calls `rebuildChoices` on the destroyed scene — `this.model` is still set so the guard passes, but `this.add`/`this.cameras` are torn down — throwing an uncaught TypeError in a window callback (not catchable by a React error boundary). Reachable: a zoom-bucket change (encounter entry, or iOS URL-bar resize) schedules the timer, and navigating away within 150ms fires it post-destroy. Also all shutdown cleanup (resize listener, timer) is…

**Fix:** Register the hook in create(): `this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)` (and/or DESTROY). Independently, guard the timer body with `if (!this.scene?.isActive?.()) return;` / a destroyed flag, and clear resizeRebuildTimer from the React effect cleanup as a belt-and-braces measure.

### SS-05 · 🟡 MEDIUM — No loaderror handling: a 404'd resident/gate/scenery asset renders as a raw missing-texture box to children, with no fallback or telemetry
`src/components/quest/world/questPixelRuntime.js:1155`

**What's wrong:** preload() (1155-1382) queues dozens of `this.load.image/spritesheet(...)` with no `this.load.on('loaderror', ...)` handler anywhere in the file. Ground art is defensively guarded — `if (!scene.textures.exists(theme.groundKey)) { ctx.fillStyle = ...background; ... return canvas; }` (createGroundCanvas, 414-418) — but residents (`this.add.sprite(point.x, point.y, key)`, createResidents:3763), the gate (createGate:3578+), drops (createDrops:4101) and all premium scenery add their loaded keys with no existence check.

**Impact:** On flaky school Wi-Fi / cold cache (an explicitly-called-out condition), any 404'd texture is rendered by Phaser as its default missing-texture placeholder (a green/checker box) exactly where a friendly creature, gate, or landmark belongs — jarring for a pre-reader. Core progression still works (encounters/drops/gate trigger on distance, and the child's own avatar is procedurally generated so it never 404s), so it is visual-only, but because there is no loaderror telemetry the team is blind to which assets are failing in the field.

**Fix:** Add `this.load.on('loaderror', file => this.bridge.onRuntimeSignal?.({ type:'asset-error', key:file.key, url:file.url }))` (or reuse the existing diagnostics bridge) so field failures are observable, and consider substituting a neutral placeholder sprite for critical actors (resident/gate) when `!this.textures.exists(key)`, mirroring the ground-canvas degrade.

### SS-06 · 🟡 MEDIUM — Star tally double-counts multi-stage word beats (a single word beat scores as both a mistake and a correct)
`src/components/quest/world/QuestHub.jsx:4483`

**What's wrong:** Dedup key includes the target: line 4483 ``const beatKey = `${activeRef.current?.id || "field"}:${beatIndexRef.current}:${Array.isArray(target) ? target.join("+") : target}`;``. A miss records with the individual stage grapheme (line 4704 `answer(false, stage.items?.find(item => item.correct)?.value || beat.target, ...)`), while the final success records with the whole-word target (line 4750 `answer(true, beat.target, ...)`). For bridge/echo/authored word beats `beat.target` is the evidence array `[...new…

**Impact:** A word-building beat the child fumbles once then completes counts twice in the tally: total+1/mistakes+1 for the miss AND total+1/correct+1 for the completion (each additional fumbled sound adds another total+mistake). `starRubric` (correct/total + mistakes, starRubric.js) therefore grades word encounters inconsistently versus single-sound encounters, inflating the denominator and skewing the star award for the same real performance — contradicting the file's own stated 'FIRST ATTEMPT PER BEAT is what stars score' design.

**Fix:** Make the tally key independent of which stage/target the attempt came from — key first-attempt scoring on `encounterId:beatIndex` alone (or always use `beat.target`), so a beat contributes exactly one total and one correct-or-mistake regardless of how many stages/misses it had.

### SS-07 · 🟡 MEDIUM — 2D trail resume applies beatIndex/fieldStage without clamping to the rebuilt section, risking an empty, unanswerable task panel (dead-end)
`src/components/quest/world/QuestTrail2D.jsx:148`

**What's wrong:** const [beatIndex, setBeatIndex] = useState(Math.max(0, Number(resume?.beatIndex) || 0)); / const [fieldStage, setFieldStage] = useState(Math.max(0, Number(resume?.fieldStage) || 0)); then line 181 `const beat = encounter?.beats?.[beatIndex] || null;` and line 688 render guard `{phase === "trail" && stage && (`. The 3D world does clamp the same values: QuestHub.jsx:3197 `const initialBeatIndex = Math.max(0, Math.min((resumedActive?.beats.length || 1) - 1, Number(resume?.beatIndex) || 0));` (and :3201 for…

**Impact:** section is rebuilt on every mount from current mastery/seed (line 129/136: targetsForStop(...state.mastery...) and seed = stopIndex*1000 + stopsDone.length). Answering beats mid-stop updates state.mastery and saves a checkpoint (resume) with beatIndex>0. On re-entry (resume is wired: QuestRoot.jsx:833 layerResume = checkpoint when checkpoint.stopId===layer.stopId), if the stop's beat/target structure shrank between save and resume, resume.beatIndex can exceed encounter.beats.length -> beat undefined -> task/stage null -> the `phase==="trail" && stage` block (line 688) renders nothing. The child (a pre-reader on a shared iPad who…

**Fix:** Mirror QuestHub: clamp resumed beatIndex to `(section.encounters[resumedEncounterIndex]?.beats.length || 1) - 1` and fieldStage to the resumed task's stages length; when resume.activeId is not found in the rebuilt section, reset beatIndex and fieldStage to 0. Also add an else-branch under phase==="trail" so a null stage can never present an empty, actionless panel.

### SS-08 · 🟡 MEDIUM — A letter is marked 'mastered' after a single correct answer, removing it from later assessment rounds on a lucky guess
`src/content/initialSounds/initialSoundSelector.js:73`

**What's wrong:** buildInitialSoundsProgressFromAnswerHistory: `if (record.isCorrect && !levelProgress.masteredLetters.includes(letter)) levelProgress.masteredLetters.push(letter);` — one correct response marks the letter mastered. This is live: src/App.jsx:4389 builds progress via this function and feeds it straight into selection at src/App.jsx:4397/4424 `getInitialSoundRoundPlan({ studentProgress: { initialSoundsProgress: progress } })`. In getInitialSoundRoundPlan phase 3, `weakLetters = prioritizedLetters.filter(letter =>…

**Impact:** On a 4-option item the chance of guessing correctly is ~25%. One lucky guess flags the letter as mastered, so the selector stops surfacing it as unmastered/new and the assessment concludes the child knows that initial sound when they may not. Combined with the c/k defect above, a child can be recorded as having 'mastered' /k/ by guessing.

**Fix:** Require corroboration before marking mastery (e.g. 2 correct with no intervening incorrect, or exclude a letter from 'mastered' if it also appears in incorrectLetters). If single-correct 'covered' status is intentional for a quick screener, keep a separate 'mastered' threshold so phase-3 weak-letter selection isn't silenced by one guess.

### SS-09 · 🟡 MEDIUM — Returning child's review-circuit "Continue" resets to stop 1 on a fresh/cache-cleared device
`src/utils/progressMerge.js:242`

**What's wrong:** trail.routeCursor = Number(base.trail?.routeCursor) || Number(cloud.trail?.routeCursor) || 1; — QuestRoot.jsx:221 re-runs this merge with base = stateRef.current, an ALREADY-normalized default whose routeCursor is Math.max(1,...) = 1, so `Number(base)=1` is truthy and always wins over the hydrated cloud value.

**Impact:** Verified by repro: computeHydratedValue writes routeCursor 30 to localStorage correctly, then QuestRoot's handleHydrated re-merge (base = in-memory normalized default) commits routeCursor back to 1 and re-uploads it. A child who completed all 40 stops and is on the adaptive review circuit at stop 30, opening on a new or cache-cleared shared iPad, has 'Continue' (nextAdventureId at QuestRoot.jsx:100 / freeRoamReviewPlan at questReviewMode.js:27) sent to stop 1 instead of their circuit position.

**Fix:** Make the override treat a synthetic default base as 'no local position' — e.g. only prefer base.routeCursor when the base actually has walked stops (base.trail.stopsDone.length), or pass the raw stored value (not the normalized default) as base in the QuestRoot re-merge, or take the max when the journey is complete.

### SS-10 · 🟡 MEDIUM — No cross-tab reconciliation: two tabs last-write-wins on the whole blob, and the shared sync-queue array loses writes
`src/components/quest/QuestRoot.jsx:135`

**What's wrong:** State is loaded once at mount (`useState(() => loadQuestProgress(progressScopeKey))`) and thereafter only whole-blob writes occur; there is no `storage` event listener anywhere in the quest. The cloud queue lp-progress-sync-queue-v1 is read-modify-written with no cross-tab coordination (progressSync.js enqueueWrite:107-127 / flushEntry:163-166).

**Impact:** Two tabs open as the same student on a shared iPad each hold a stale in-memory snapshot and overwrite each other's entire lp-quest blob; forward-merge only reconciles on the next login hydrate, and last-write-wins fields (creature, checkpoint, routeCursor) can be lost outright. Concurrently, tab A's enqueue and tab B's enqueue can clobber each other's queue entry (classic lost update on the shared array), dropping a queued cloud write until the next full-state save happens to re-carry it.

**Fix:** Add a `storage`-event listener that folds external changes into in-memory state via computeHydratedValue (the hydrate handler already does this for the login event), and guard the sync-queue read-modify-write against concurrent tabs (e.g. re-read-and-merge just before writeJson, or a short-lived lock).

### SS-11 · 🟡 MEDIUM — Hollow purchases are recorded with no affordability re-check, allowing double-spend into a permanent overspent state
`src/utils/hollowState.js:44`

**What's wrong:** recordPurchase does `const ledger = loadHollowLedger(scope); ... ledger.purchases = [...ledger.purchases, record]; persist(...)` — it re-reads localStorage fresh and appends unconditionally, with the comment 'the caller validates with hollowEconomy.canBuy first'. The only caller gate is HollowPage.jsx `buy()` -> `const verdict = canBuy(hollow, itemId)` where `hollow` is a useMemo snapshot, and the ware buttons only `disabled={!canBuy(hollow, item.id).ok}`. There is no in-flight lock and no mutation-layer funds…

**Impact:** On the low-end/shared iPads this app targets, if a child taps two individually-affordable wares (or an egg twice) before React commits the re-render that recomputes `hollow`, both grants read the same stale snapshot and both append. Result: coinsSpent exceeds coinsEarnedTotal, coins floor at 0 (`Math.max(0, ...)`), `overspent` flips true and is surfaced to the teacher report as if the child cheated, and the child keeps items/eggs (extra beasties) they did not earn. Timing-dependent, but the target hardware makes the 'React already re-rendered' assumption unsafe.

**Fix:** Re-validate affordability inside recordPurchase against the freshly-loaded ledger + a passed-in earned-coins total (return null on failure), or add an in-flight guard/disable in HollowPage that survives until the ledger recompute lands.

### SS-12 · 🟡 MEDIUM — Device-acceptance memory-leak check is a no-op on the primary certified device (iPad Safari)
`src/utils/questDeviceAcceptance.js:99`

**What's wrong:** Samples read `heapUsedBytes: finite(browser?.performance?.memory?.usedJSHeapSize)` (line 68). `performance.memory` is a non-standard Chrome-only API — on Safari it is undefined, so finite(...) = 0. The heap check then is `{ id: "heap", pass: !heap.length || heapGrowth <= heapAllowance, detail: heap.length ? ... : "heap API unavailable" }` (line 99), and `heap = samples.map(...).filter(Boolean)` (line 78) drops all zeros -> empty -> `!heap.length` -> pass.

**Impact:** The `ipad` release profile (QUEST_DEVICE_RELEASE_PROFILES, line 5) is meant to certify the pixel runtime on iPad, but iPad Safari never populates performance.memory, so the leak gate auto-passes with 'heap API unavailable' on the very hardware it certifies. A build that leaks memory across a 20-minute session on a shared school iPad would sail through acceptance; the check only ever does real work in Chrome/Chromebook runs.

**Fix:** Treat 'heap API unavailable' as an explicit non-pass (or unknown-requiring-Chrome) for pixel release profiles rather than a silent pass, and/or add a Safari-viable growth proxy (e.g. sustained DOM/canvas/texture peak growth from telemetry) so the ipad profile actually gates on resource growth.

### SS-13 · 🟡 MEDIUM — Overlapping hit radii can misattribute a correct tap to an adjacent wrong critter, scoring a false mistake
`src/components/learn/games/games/SoundSafariArcadeGame.jsx:1422`

**What's wrong:** Hit resolution sorts by (inLabel?0:distance) then .find(entry => entry.inLabel || entry.distance <= (entry.critter.hitRadius || entry.critter.r + 54)) (L1421-1422). hitRadius = Math.max(r + 62, spriteMaxH * 0.58) (L1031) is large (~90px+ even for the smallest critters), while SAFARI_LAYOUTS place critters as close as ~0.02 apart in one axis. When neither label box is hit, the nearest center within radius wins.

**Impact:** Because hit zones are large and overlap, a tap aimed at the correct critter that lands slightly nearer an adjacent wrong critter's center resolves as a wrong catch: state.mistakes += 1, combo resets to 0, red 'TRY AGAIN', and (via the star rubric) a lower final score — punishing a child who actually aimed at the right animal. On a shared low-end iPad with imprecise touch this is a repeatable frustration and unfairly lowers the reward.

**Fix:** Prefer the needed critter when it is within a reasonable tap tolerance (e.g. if the correct critter is within hitRadius, resolve to it even if a wrong critter's center is marginally closer), or shrink/normalize hitRadius and rely more on the label box. Add spacing so hit zones don't overlap for the dense 6-8 critter layouts.

### SS-14 · ⚪ LOW — Scene shutdown() is dead code in Phaser 4 — teardown cleanup never runs and a stray window.setTimeout can crash on unmount
`src/components/quest/world/questPixelRuntime.js:5636`

**What's wrong:** `shutdown() { ... this.scale.off("resize", this.handleResize, this); window.clearTimeout(this.resizeRebuildTimer); }` (L5636-5651). This method is never wired to any event — the file has no `this.events.on("shutdown", ...)` and no `init()`. The debounced rebuild uses a raw window timer: `this.resizeRebuildTimer = window.setTimeout(() => { if (this.model?.activeStage && this.model?.activeEncounterId) { this.rebuildChoices(...) } }, 150)` (L4244).

**Impact:** Verified against Phaser 4 source: SceneManager auto-binds only init/create/update (SceneManager.js L480-641); Systems.shutdown/destroy merely emit events and null a prop list that includes `add`, `cameras`, `tweens`-adjacent managers (Systems.js L801-819). The user Scene's `shutdown()` is therefore NEVER called. Teardown goes through QuestPixelWorld.jsx cleanup → `runtime.destroy()` → `game.destroy(true)`, which frees Phaser-owned objects but does NOT clear the raw `window.setTimeout` in `this.resizeRebuildTimer`. On an iPad the Safari URL bar collapsing fires ScaleManager resize constantly; if a zoom-bucket change fires within…

**Fix:** Own the debounce with Phaser (`this.time.delayedCall`, which is auto-cancelled on scene destroy) instead of `window.setTimeout`, OR clear `resizeRebuildTimer` in the React effect cleanup in QuestPixelWorld.jsx (L677-684). Guard `rebuildChoices` with `if (!this.sys?.isActive()) return;`. Additionally wire the real cleanup by adding `this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)` (or DESTROY) in create(), so the intended teardown actually runs rather than being dead code.

### SS-15 · ⚪ LOW — 3D field avatars share BufferGeometry with the module model cache, then dispose it
`src/components/quest/world/questAssets.js:323`

**What's wrong:** prepareImportedFieldAvatar() (L314-361) clones the scene with cloneSkeleton and replaces materials, but — unlike prepareRiggedCharacter() which does `object.geometry = object.geometry.clone();` (L159) — its traverse at L323-345 never clones geometry. cloneSkeleton shares geometry by reference, so every field object (the letter-bearing lanterns/planks/fish that carry the phonics glyphs) shares one BufferGeometry with the module-level `modelCache` GLTF (L61) and with sibling instances of the same shape.…

**Impact:** Leaving/re-entering the 3D hub frees GPU buffers still referenced by the cached GLTF and by sibling field objects, forcing three.js to re-upload the geometry on the next visit and risking one-frame artifacts on drivers that don't tolerate render-after-dispose. three.js currently re-uploads from the retained CPU attributes so it usually recovers rather than hard-failing, but this contradicts the deliberate geometry-clone in prepareRiggedCharacter and couples per-scene disposal to a shared module cache — fragile across three.js/driver versions.

**Fix:** Clone geometry in prepareImportedFieldAvatar the same way prepareRiggedCharacter does (`object.geometry = object.geometry.clone()`), or exclude cache-shared geometries from disposeAssetObject/disposeQuestScene, so tearing down one instance can't free resources owned by the cache or by other live instances.

### SS-16 · ⚪ LOW — A section that builds with zero encounters is an unrecoverable dead-end (gate can never open)
`src/components/quest/world/QuestHub.jsx:5084`

**What's wrong:** `isChapterGateOpen` requires a non-empty list: questSliceSystems.js:1013 `return encounters.length > 0 && encounters.every(...)`. The finish check (line 4126-4128 `const allSolved = isChapterGateOpen(section.encounters, ...)`) and the only forward button (line 5084 `phase === "trail" && !active && (gateOpen || !guideDone || nextEncounter)`) both go false forever when `section.encounters` is empty. QuestHub guards `if (!section)` (line 4768) but not an empty-encounter section. The upstream safety net is broken:…

**Impact:** If any stop's encounter builders all return null, the child meets the guide, walks to the end of the trail, and finds no gate, no 'next' button, and no finish — only 'Back to the Den'. A pre-reader is permanently stuck on that stop with no way to complete it, and the intended zero-encounter safety net does not actually insert a fallback encounter.

**Fix:** Fix the buildWalk fallback to pass real targets (or synthesize a guaranteed one-encounter task), AND defensively handle an empty-encounter section in QuestHub — e.g. treat `encounters.length === 0` as immediately gate-open/finishable so the child can always leave forward, not just back to the Den.

### SS-17 · ⚪ LOW — isDue computes an unguarded gap, so replaying an earlier trail stop suppresses all learning-item reviews for that stop
`src/utils/questReviewScheduler.js:60`

**What's wrong:** `const gap = stopIndex - lastStop;` (line 60) is not clamped (unlike reviewWeight line 91 which uses `Math.max(0, ...)`). For a box-1 learning sound, line 68 returns `gap >= BOX_INTERVALS[box]` i.e. `gap >= 0`. If a child replays an earlier completed stop while `lastStop` for most sounds is a higher trail index, gap is negative and `gap >= 0` is false, so the sound is judged not-due.

**Impact:** When a child re-walks a stop they finished long ago (stopIndex less than the stops where their sounds were last practised), dueTargets returns few or no review items, so the replayed stop serves only its fresh teach targets and drops the spaced review that would otherwise ride along. Low frequency (only affects backward replays) and not destructive, but it silently removes review value from replays, which are a natural way a struggling child revisits material.

**Fix:** Clamp gap with `Math.max(0, stopIndex - lastStop)` in isDue to match reviewWeight, or decide review due-ness from an absolute measure that is stable under replay, so revisiting an earlier stop still surfaces due sounds.

### SS-18 · ⚪ LOW — taughtThrough/blendsThrough/heartWordsThrough/wordsThrough silently truncate if QUEST_STOPS is ever not index-sorted
`src/data/questSequence.js:477`

**What's wrong:** All four cumulative helpers `break` on the first stop past the target index: `if (stop.index > stopIndex) break;` (taughtThrough line 477, blendsThrough line 493, heartWordsThrough line 506, wordsThrough line 518). This assumes `QUEST_STOPS` is strictly ascending by `index`. By contrast `getStop`/`stopAtIndex` use order-independent `.find`, so the two access patterns disagree about whether order matters.

**Impact:** Currently correct (indices are 1..40 in array order, verified). But this file is 'the spine' and is edited by hand; inserting a stop out of index order, or reordering an ACT array, would make `taughtThrough` return a truncated decodable set with no error. That silently corrupts the decodability contract every shell and the content check depend on — words that ARE decodable would be treated as not-yet-taught, and the greedy word-cover in questRounds.js would starve targets. A silent wrong-answer, not a crash.

**Fix:** Either sort a local copy by `index` inside these helpers (or iterate with `.filter(s => s.index <= stopIndex)` instead of `break`), or add a module-load assertion that `QUEST_STOPS` is strictly index-ascending so a mis-ordered edit fails loudly.

### SS-19 · ⚪ LOW — Device-acceptance 'progress' gate passes on zero progress (>= instead of >)
`src/utils/questDeviceAcceptance.js:103`

**What's wrong:** `{ id: "progress", pass: finite(evidence.finalProgress?.stopsDone) >= finite(evidence.initialProgress?.stopsDone), detail: `${...} to ${...} stops` }`. With a fresh run initial and final stopsDone are both 0, so `0 >= 0` passes.

**Impact:** A build where a stop can never be completed (the child cannot actually make forward progress) still passes the 'progress' acceptance check, because the gate only forbids going backwards, not standing still. The check reads as 'the run made progress' but does not verify any stop was completed, weakening the release gate's central claim.

**Fix:** For run modes/profiles that are expected to complete stops, require strict progress (final > initial) or a minimum stopsDone delta; keep >= only for profiles (e.g. assistive-tech audio-only) where completion is genuinely not expected, and make that distinction explicit.

## 2. Data integrity & persistence

### SS-20 · 🟠 HIGH — Quota/private-mode failure silently loses all quest progress; the "cloud queue still carries it" comment is false
`src/utils/questStore.js:40`

**What's wrong:** catch { // ...The cloud queue below still carries / the progress; local storage catches up on the next successful save. } — then line 54 calls queueProgressSave(...), which in progressSync.js enqueueWrite -> writeJson does `try { window.localStorage.setItem(...) } catch { /* buffering must never block */ }` (progressSync.js:32-39).

**Impact:** When localStorage is full (a real endgame on a shared classroom iPad holding many students' scopes + unbounded hollow feeds + the lp-cloud-progress-rows-v1 cache), BOTH the quest blob write AND the sync-queue append hit the same full storage and are swallowed. Nothing is persisted anywhere; on reload every star/stop since the last successful save is gone with no signal to child or teacher. The reassuring comment is wrong: the queue lives in the same localStorage. It is also wrong for anonymous play — queueProgressSave (progressSync.js:209) early-returns when there is no logged-in session matching the scope, so 'default'-scope…

**Fix:** On setItem quota failure, attempt a recovery path: evict low-value keys (old lp-cloud-progress-rows cache, capped telemetry) and retry; surface a one-time 'progress may not be saving' signal for logged-in sessions; and correct the comment so it no longer promises a cloud safety net that does not exist for anonymous scope or when the queue write itself fails.

### SS-21 · ⚪ LOW — Persistence side-effects run inside setState updaters while a REPLACE-style commit fires on every runtime signal — a lost-update hazard for mastery/telemetry that also breaks the file's stated 'one writer' invariant
`src/components/quest/QuestRoot.jsx:409`

**What's wrong:** handleAnswer/handleCheckpoint/handleInteraction do: `setState(prev => { const next = ...record...(prev,...); stateRef.current = next; saveQuestProgress(progressScopeKey, next); return next; })` (lines 409-415, 421-426, 431-436) — impure updaters that mutate a ref and write storage. Meanwhile `commit` (lines 196-202) does `setState(next)` (a value REPLACE, not a functional update) and is called by handleRuntimeSignal on runtime signals: `const recorded = recordQuestRuntimeEvent(current, signal); if (recorded !==…

**Impact:** If a runtime-signal commit computed from a pre-update `stateRef.current` is queued alongside a pending functional answer/interaction update, React applies the functional update and then the REPLACE value, dropping the just-recorded answer's mastery evidence and telemetry — the same 'faked/lost mastery' class the code guards against elsewhere (shellContract.js:17). Under React StrictMode the impure updaters also double-invoke, double-counting recordQuestAttempt/recordQuestTelemetryAnswer and double-queuing cloud saves. The mixed REPLACE-vs-functional pattern makes the save file's final value order-dependent.

**Fix:** Route these handlers through `commit` (or a single functional reducer) and move the saveQuestProgress side-effect out of the updater into the commit path, so there is genuinely one writer and updaters stay pure. At minimum make commit a functional update (`setState(prev => next)`) so it cannot silently clobber a pending update.

### SS-22 · ⚪ LOW — Offline-evidence effect replays the entire offlineShellHistory() into telemetry on every new session id, duplicating offline events across sessions
`src/components/quest/QuestRoot.jsx:295`

**What's wrong:** The effect body iterates all past offline evidence on setup — `for (const detail of offlineShellHistory()) recordOfflineEvidence(detail);` (line 295) — and its dependency array is `[commit, state.telemetry?.current?.id]` (line 298). A new session is created on each world entry/stop (beginQuestSession assigns a new id), so the effect re-runs and re-injects the whole persistent history each time.

**Impact:** offlineShellHistory() is a page-level accumulator, so every new session re-records earlier offline-shell events (cold-start, warm-complete, shell-error, etc.) into telemetry again. Unless recordQuestRuntimeEvent dedupes by identity, offline reliability metrics inflate the longer a child plays, corrupting the teacher/ops signal that offline support is actually working.

**Fix:** Replay historical offline evidence once at mount (empty dependency array, or a processed-ids guard), and let the live OFFLINE_EVENT listener handle new events — don't re-fold the full history on every session id change.

### SS-23 · ⚪ LOW — Hollow ledger feeds/purchases grow without bound (random ids, no cap, no dedupe)
`src/utils/hollowState.js:53`

**What's wrong:** recordFeed: `const record = { id: recordId('feed'), species: speciesId, at: ... }; ledger.feeds = [...ledger.feeds, record];` with recordId using Date.now()+Math.random() (line 38-39). The merge unions by id with NO cap (progressMerge.js:271-292), unlike telemetry which slices to MAX_SESSION_HISTORY=80 (progressMerge.js:260 / questTelemetry.js:90).

**Impact:** Every feed action (HollowPage.jsx:210, gated only by the berry economy, which refills from ongoing progress) appends a permanent unique record that is never trimmed. Over a school year of daily play the feeds array grows without limit both in localStorage and in the full 'hollow' payload uploaded on every persist (queueProgressSave('hollow','__all__',ledger)). This is the growth that feeds the quota-exhaustion data-loss path above on shared low-end iPads.

**Fix:** Cap feeds (and any other append-only, non-idempotent arrays) to a recent-N window on both persist and merge, the way telemetry sessions are capped at 80, or collapse feeds to a per-species counter if only totals are needed.

### SS-24 · ⚪ LOW — End-of-cup 'Done' button can fire onComplete repeatedly with no one-shot guard, inflating play count and re-firing mission/progress writes
`src/components/learn/games/games/SoundRacerGame.jsx:2758`

**What's wrong:** finishRun wires the Done button as overlay.querySelector('[data-sr="done"]').addEventListener('click', () => { opts.onComplete?.(stars, score, correct); }) (2758-2760) but never hides the overlay, removes the listener, or guards re-entry. GamePlayer.handleComplete (170-187) has no 'if (completed) return' and setCompleted(true) does NOT unmount the game (the GameComponent stays mounted, 283-294), so the overlay and its button remain tappable. handleComplete calls saveLearnGameResult, which does 'plays:…

**Impact:** A child tapping the big yellow 'Done' button two or three times (typical for this age) increments the game's plays counter multiple times per session and re-notifies the daily-mission 'game' task each time, corrupting play/streak analytics and potentially double-crediting the mission. Stars/high-score use Math.max so they're safe, but the counters and mission signal are not.

**Fix:** Add a one-shot guard: on the first Done click disable/remove the button and set a 'finished' flag before calling onComplete; and/or make handleComplete idempotent via a ref ('if (completedRef.current) return; completedRef.current = true;').

## 3. Curriculum & pedagogy

### SS-25 · 🟠 HIGH — Mastery is banked for sounds the child never heard (sound-off / missing clip) despite the guard that was written to prevent it
`src/components/quest/world/QuestHub.jsx:4505`

**What's wrong:** Lines 4796-4803 compute the exact guard for this: `stageSoundDelivered = Boolean(isSoundEnabled && stageCueAvailable)` and `stageRecordsMastery = physicalStageRecordsMastery(activeFieldStage, stageSoundDelivered)`, with the comment "decline to bank mastery for a sound we never actually played." But `stageRecordsMastery` is used ONLY to pick the on-screen text: `const fieldPrompt = stageRecordsMastery ? activeCorrection.prompt : physicalStagePrompt(activeFieldStage, false)`. The answer path never consults it:…

**Impact:** With app sound disabled (muted class, no headphones, broken speaker on a shared iPad), every phonics stage degrades to a visible 'Find m' text-vs-text match that a pre-reader solves by sight, and `onAnswer(target, true, ...)` still banks grapheme/phoneme mastery the child never demonstrated aurally. That fake mastery is persisted and drives the review scheduler and the teacher heat map, so a whole muted session inflates the child's phonics record and suppresses the sounds they actually need to revisit.

**Fix:** Thread `stageRecordsMastery` into the answer path: in `fieldTaskSelect`/`answer`, when the live stage has an audioCue that was not delivered (sound off or no recording), suppress the `onAnswer` mastery call (or pass a `recordsMastery:false` flag in `meta` and have QuestRoot skip banking), matching the behavior the 2D views already implement. Keep the correct/UX feedback so the child can still progress, but do not write mastery.

### SS-26 · 🟠 HIGH — Resuming from a saved checkpoint corrupts the final star score (perfect play scores 1 star)
`src/components/learn/games/games/SoundSafariArcadeGame.jsx:1391`

**What's wrong:** const total = totalUnits(ladder); (L1160, sums graphemes across ALL 10 levels) then onComplete fires config.stars({ correct: state.correct, total, mistakes: state.mistakes }) (L1391). state.correct only accumulates for levels actually played, and state.stage starts at clamp(Number(options.startLevel)||0,0,9) (L1173). GamePlayer.jsx L198 sets startLevel to resumePoint.level on 'Continue'.

**Impact:** A child who plays across sessions and taps 'Continue' resumes at e.g. level 5 and plays levels 5-9. To advance you must catch every grapheme in order, so correct == units in levels 5-9 (~half of total), but total still counts levels 0-4 they were never given. accuracy = correct/total ≈ 0.5. In starRubric.js this fails both the >=0.95 and >=0.70 gates and returns 1 star. So a resumed child who plays flawlessly gets the WORST passing grade (1 star -> smaller gem reward), and the further they'd progressed before quitting, the more they are penalized. Only single-session full runs (start at 0, where correct==total) score correctly.

**Fix:** Compute stars against only the units the child was actually presented this run. Track a per-run `presentedUnits` (sum of taskUnits for levels from the starting stage onward) and pass that as `total`, or accumulate `total` incrementally as levels are entered, instead of totalUnits(ladder) over the whole ladder.

### SS-27 · 🟡 MEDIUM — Initial Sounds offers 'c' as a distractor for the /k/ target letter 'k' — a phonically-correct answer is marked wrong
`src/content/initialSounds/initialSoundWordBank.js:234`

**What's wrong:** distractorLettersFor(letter, difficulty): `const offsets = difficulty === "easy" ? [5, 11, 17] : [1, 6, 13];` then `return [letter, ...offsets.map(offset => INITIAL_SOUND_LETTERS[(index + offset) % INITIAL_SOUND_LETTERS.length])];`. Distractors are picked purely by alphabet offset with no same-sound guard. For target 'k' (index 10) at level 1/easy this yields the option set ["k","p","v","c"] — verified across all 10 level-1 /k/ items (kite, key, king, kid, kettle, kitten, koala, kangaroo, kiwi, keyboard). Both 'k'…

**Impact:** The question text is 'Listen to the word. What sound does it start with?'. A child hearing 'kite' /k/ who taps 'c' (correctly, since 'c' says /k/ as taught in 'cat') is scored WRONG on the core Initial Sounds diagnostic. This penalizes the child who knows MORE phonics and corrupts the /k/ mastery signal. The quest engine deliberately forbids exactly this (questRounds.js SAME_SOUND_CLASSES lists ['c','k','ck']), but the initial-sounds bank has no equivalent guard.

**Fix:** Filter same-sound single letters out of distractorLettersFor (at minimum exclude 'c' when the target is 'k' and 'k'/'ck' when the target is 'c'), or replace the fixed alphabet-offset scheme with a curated near-letter distractor table that excludes homophonic graphemes. A unit test should assert no item's answerOptions contain two letters that spell the same initial phoneme.

### SS-28 · 🟡 MEDIUM — Timeouts and assisted attempts inflate `seen` but never `correct`, so every accuracy/error-rate aggregate is permanently depressed — directly contradicting the 'timeouts are exposure only' policy
`src/utils/questMastery.js:185`

**What's wrong:** In recordAttempt: `seen: prev.seen + 1,` is unconditional, while `correct: prev.correct + (correct && independent ? 1 : 0),` with `independent = promptLevel === 0 && !timeout` (line 181). Both downstream aggregates divide the narrow numerator by the wide denominator: questReviewScheduler.js:90 `const errorRate = 1 - r.correct / r.seen;` and questMastery.js:272 `accuracy: r.seen ? r.correct / r.seen : 0`. A Trail-Run timeout (Encounters.jsx:202 `onBeat(false, beat.target, { reason: "timeout" })`) reaches this path…

**Impact:** A slow-but-ACCURATE child who times out on Trail Run (the clock, not a wrong answer) has that sound's `correct/seen` driven arbitrarily low. Consequence 1: reviewWeight.errorRate climbs toward 1, so the scheduler keeps re-serving a sound the child actually knows (resurfaces too much) — the exact 'must not accrue misses for hesitation' harm the comment on lines 172-174 says must not happen. Consequence 2: weakestTargets ranks that known sound into the teacher dashboard's 'weakest five' (questReport.js:205), so the teacher re-teaches a sound the child has mastered. The design intent is explicit ('Exposure only') and the code violates…

**Fix:** Either exclude timeouts (and ideally assisted attempts) from the accuracy denominator, or track an `independentSeen` counter alongside `seen` and compute errorRate/weakestTargets accuracy as `1 - correct/independentSeen`. Timeouts should be truly neutral: they must not move any ratio used for review weighting or the 'weakest' ranking.

### SS-29 · 🟡 MEDIUM — The Leitner box machinery is largely inert: boxes 2 and 3 are never assigned and the `misses>0 → box 1` guard is unreachable, so learning items are always due and a just-missed mastered sound is parked ~12 stops
`src/utils/questReviewScheduler.js:40`

**What's wrong:** boxAfterStop: `if (r.state === MASTERY_STATES.MASTERED) return 4;` (line 43) runs BEFORE `if (r.misses > 0) return 1;` (line 44), so a mastered record that was just missed once (state still MASTERED — demotion needs 2) returns box 4. For learning records line 45 `return Math.min(3, Math.max(1, r.box || 1));` only preserves the existing box; nothing ever raises it because promote() (line 26, the only box-incrementing function) is never called in src (grep confirms only its definition exists). emptyRecord starts…

**Impact:** Two concrete harms. (a) The documented spaced schedule for anything still being learned ('1 correct → due in 2 stops', '2 correct → due in 5 stops') never happens — every non-mastered sound is box 1 = interval 0 = due every stop, so 'spaced repetition' for learning items collapses to 'always due, ordered by weight'. (b) A MASTERED sound the child has started failing (first miss) is re-scheduled 12 stops out instead of next stop, so a developing regression is invisible to the scheduler for ~12 stops and the 'missed twice in a row → demote' rule is stretched across a 12-stop gap rather than catching the slide promptly.

**Fix:** Move the `if (r.misses > 0) return 1;` check ABOVE the MASTERED/RETIRED returns so a fresh miss always pulls the sound back to box 1. Separately, wire promote() into recordStopResult (or advance box inside boxAfterStop on a clean correct) so learning items actually climb into boxes 2/3, or delete the dead promote/demote and the box 2/3 intervals and document that learning items are intentionally always-due.

### SS-30 · 🟡 MEDIUM — Demotion to `learning` keeps the banked shells/sessions/correct, so a demoted sound re-masters same-day in one shell — the 'two different days / two shells' anti-cram guarantee silently no longer holds after the first mastery
`src/utils/questMastery.js:233`

**What's wrong:** nextState demotes with `if (wasMastered && next.misses >= rules.demoteAfterConsecutiveMisses) { return MASTERY_STATES.LEARNING; }` (lines 233-235) but only the `state` field changes — `correct`, `shells`, and `sessions` are never cleared (recordAttempt spreads them forward untouched). meetsMasteryBar (line 148) then re-checks `r.correct >= minCorrect`, `r.shells.length >= minShells`, `r.sessions.length >= minSessions`, all of which are still satisfied from before the demotion, leaving only the accuracy window to…

**Impact:** The header comment (lines 40-48) sells mastery as 'two different days -> you cannot cram it in one sitting' and 'two different things -> you cannot fake it by learning one mini-game'. After a sound is demoted for two genuine consecutive misses (real forgetting), the child can re-earn 'mastered' with ~3 quick correct taps in a SINGLE sitting and a SINGLE shell, because sessions.length and shells.length are still ≥2 from the original mastery. So the honesty guarantee that stones represent 'proved on two days in two games' is only true for first mastery, not for any re-mastery — the stone can relight from a one-sitting cram.

**Fix:** On demotion, reset the evidence that the anti-cram bar depends on — clear `window` and reset `sessions`/`shells` (and reset `correct` to the current window hits) — so re-mastery must again satisfy the two-days / two-shells conditions, or explicitly document that re-mastery is intentionally cheaper and soften the 'cannot cram' claim.

### SS-31 · ⚪ LOW — s17 (boss) and s22 declare a 'sound-sort' shell that can never produce a round — advertised encounter silently vanishes
`src/data/questSequence.js:309`

**What's wrong:** s22 teaches only `[SP("e_e")]` (line 307) yet declares `[..., "sound-sort", ...]` (line 309); s17 is a boss with `teach: []` (line 271) but also declares `sound-sort` (line 274). Neither has `sortPairs`. `buildSoundSortRounds` returns `[]` when there are <2 real graphemes and no curated pairs (src/utils/questRounds.js:315 `if (graphemes.length < 2) return [];`), and `buildEncounter('sheep-pens', …)` then returns null (src/utils/questEncounters.js:461 `if (!rounds.length) return null;`).

**Impact:** The stop advertises a Sound Sort that can never appear. It does not crash (the null encounter is dropped and a flower-patch fallback keeps the walk non-empty), but the stop definition is internally inconsistent: s22 loses a review-variety encounter it was authored to include, and the s17 boss silently omits the consolidation sort. Any future audit or teacher-facing report that lists 'shells at this stop' will over-state what the child actually receives.

**Fix:** Remove 'sound-sort' from the `shells` of s17 and s22 (or give s22 a curated `sortPairs` that contrasts e_e against a real second sound). Alternatively, add a build-time check that every declared shell can produce at least one round for that stop, so a dead shell declaration fails `check:quest` instead of vanishing at runtime.

## 4. Audio & the gold-voice policy

### SS-32 · 🟠 HIGH — Sound Safari word ladder selects many words with no gold-voice recording, leaving the 'Listen to the word' cue silent
`src/utils/soundSafariRounds.js:11`

**What's wrong:** The WORDS ladder hard-codes words that have no recorded clip. Verified via hasWordAudio(): medium tier 6/30 silent (snack, plain, sweep, groan, thorn, glide); hard tier 13/30 silent (moonlight, starlight, shadow, whisper, lantern, sparkle, firelight, moonbeam, floating, shimmer, twilight, howl, firefly). SoundSafariArcadeGame auto-plays speakWord(item.word) on each task (game file lines 1270/1281), and the gold-voice policy makes speakWithBrowser a no-op (src/utils/learnGamesAudio.js:113), so those words play…

**Impact:** The game's own instruction is 'Listen to the word, then net its sounds in order.' For 20-43% of medium/hard words the child hears silence and must instead read the printed word — impossible for a pre-reader, which defeats the by-ear segmentation task and makes those levels solvable only by guessing or by already being able to read the word.

**Fix:** Restrict the Sound Safari word ladder to words that pass hasWordAudio() (or record the missing clips), and add a coverage check that fails the build if any ladder word lacks a recording — mirroring how the quest guards audio-dependent content.

### SS-33 · 🟠 HIGH — Digraph reinforcement audio is silently dropped — the phoneme the child just caught is never voiced for sh/ch/th/wh/ck/ng
`src/components/learn/games/games/SoundSafariArcadeGame.jsx:723`

**What's wrong:** function speakGrapheme(grapheme){ ... if (value.length === 1) speakPhoneme(value); else speak(value); } with the comment 'speakPhoneme only handles single letters'. Called on every correct catch at L1464: if (soundAllowed()) speakGrapheme(needed). The comment is false: learnGamesAudio.js speakPhoneme L143-145 explicitly pushes `/audio/phonemes/${normalized}.mp3` for multi-letter graphemes. speak('sh') instead matches /^[a-z]+$/i and routes to speakWord('sh') -> looks for word recordings that don't exist -> stays…

**Impact:** The core teaching moment of the medium/hard worlds is the child catching a digraph and hearing the gold-voice say its sound. Words like shark/brush/splash/crash/shimmer (sh), chair (ch), three/thorn/thunder (th), clock/track/snack (ck), string/spring (ng), whisper (wh) all segment to these digraphs. When the child correctly nets the 'sh' critter, the existing /audio/phonemes/sh.mp3 is never played and they hear nothing — exactly the digraphs these levels teach get no spoken reinforcement, while single letters correctly play their phoneme.

**Fix:** Route through speakPhoneme for graphemes that have a phoneme recording, not just length===1. Simplest correct fix: change speakGrapheme to always call speakPhoneme(value) (it already handles both single letters and multi-letter clusters and falls through silently when no clip exists), or check the phonemes path first before falling back to speak().

### SS-34 · 🟠 HIGH — Robotic browser TTS + synthetic vowel synth are live phoneme fallbacks in the phonics learning surface and the login gateway, violating the gold-voice policy
`src/hooks/usePhonicsAudio.js:165`

**What's wrong:** usePhonicsAudio.play() calls speakFallback on every missing/failed clip: `if (!src) { speakFallback(fallbackRef.current); return; }` (L164-166), plus `speakFallback` on loaderror/playerror/soundId-null (L188, L205, L209). speakFallback -> speakWithBrowser (src/utils/audio/speakWithBrowser.js:41,48: `new SpeechSynthesisUtterance(...)` / `window.speechSynthesis.speak(utterance)`). The same hook also SYNTHESIZES vowel phonemes with oscillators: playGeneratedPhoneme() builds a sawtooth+bandpass formant synth for…

**Impact:** The brief's absolute invariant is 'the app NEVER plays robotic browser TTS in production; recorded child-voice only; silent when a clip is missing.' On the target hardware (flaky Wi-Fi, shared iPads, cold cache) a phonics clip that fails to load makes a 4-7yo pre-reader hear a robotic OS voice — or a buzzy oscillator vowel — saying the phoneme they are learning. docs/IMPROVEMENT_LOOPS.md rule #3 explicitly forbids this because generated phoneme audio failed human ear-checks and teaches the wrong sound. The quest world itself is clean (its cue paths stay silent), so a reviewer scoped only to quest files would miss that the app-wide…

**Fix:** Make the real speakWithBrowser a no-op in production exactly like learnGamesAudio.js's local speakWithBrowser (L110-113), or delete the fallback calls so play() stays silent on failure and the button is hidden via hasRecordedSpeech(). Remove playGeneratedPhoneme() (or gate it behind a dev flag). For login, prefer showing the picture-only step and a retry over speaking a synthetic voice.

### SS-35 · 🟡 MEDIUM — 13 of 30 'hard' target words have no recording, yet are presented as text-only to non-readers with the sound-hint concealed
`src/utils/soundSafariRounds.js:16`

**What's wrong:** WORDS.hard (L16-20) includes moonlight, starlight, shadow, whisper, lantern, sparkle, firelight, moonbeam, floating, shimmer, twilight, howl, firefly — I verified none of these resolve to any recording in AUDIO_FILE_PATHS. setupTask calls speakWord(state.currentTask.item.word) (L1270) with no hasRecordedSpeech() gate, so it no-ops silently, and drawFieldGuide renders the word only as text (L800).

**Impact:** On the moonwood (hard) world ~43% of target words play no audio. For a pre-reader the field-guide word is unreadable text, and on hard the 'Next sound' hint and the needed-critter glow are concealed until 2 mistakes on that grapheme (showHint = rank===0 || attempts>=2, L1132/L1428). So for these words a non-reader gets no word cue, no readable text, and no sound hint until forced errors — a near dead-end they can only brute-force. This is the exact 'audio-dependent content with no recording' the gold-voice policy is meant to prevent; the game does not screen words through hasRecordedSpeech() the way other games do.

**Fix:** Filter the safari word banks to words that have a recording (or record the 13 missing hard words). At minimum, when the target word has no clip, force the sound hint on (showHint) so a non-reader is never left with neither audio nor a visible target.

### SS-36 · 🟡 MEDIUM — Onboarding and level/cup completion overlays are text-only with no audio narration for a non-reading audience
`src/components/learn/games/games/SoundRacerGame.jsx:3000`

**What's wrong:** SoundRacer intro block (2997-3009) renders instructions as raw text with no speak()/speakWord() call: '<div ...>Catch the words that start with the target sound. Dodge everything else!</div>' and steer instructions on 3001. The per-level and cup screens are likewise text-only choices: 'Retry track' / 'Next map' (2722-2723) and 'Done' (2755). SoundBeatGame.jsx has the same gap — ONBOARDING_HINTS (17-21) and 'Tap each sound on the beat.' (SoundBeatGame.jsx:101) are drawn as text with no audio.

**Impact:** The stated audience is pre-readers ~4-7 who largely cannot read. They cannot understand the how-to-play card, cannot distinguish 'Retry track' (translucent) from 'Next map' (yellow), and get no spoken help, so they tap randomly — replaying instead of advancing, or failing to start. The project's own audio policy treats un-cued text shown to pre-readers as a real defect, and unlike the GamePlayer header's Phinny 'hear instructions' button, these in-canvas overlays have no spoken equivalent.

**Fix:** Speak the onboarding line and the target action when each overlay appears (a recorded clip, gated on isSoundEnabled), and speak the button labels or replace them with unmistakable icon+audio choices. At minimum play a short recorded 'Tap to play' / 'Next' / 'Try again' cue so a non-reader can act without reading.

### SS-37 · 🟡 MEDIUM — playCueSequence halts on a mid-chain clip load/play error, so the teach cue ('/s/ … s') and blend fallback ('st' = /s/…/t/) go partly or fully silent on flaky Wi-Fi
`src/utils/audio/cuePlayer.js:92`

**What's wrong:** The sequence only advances on the 'ended' event: `audio.addEventListener("ended", () => { ... playNext() ... }, { once: true })` (L92-97). But playCueAudio settles a failed clip via the ERROR/reject path — `audio.addEventListener("error", finish, ...)` (L51) and `result.catch(() => { finish(); onUnavailable?.(); })` (L59-62) — which sets currentCue=null and NEVER fires 'ended'. So if clip N fails to fetch, clip N+1 is never played and the chain dies. hasBlendAudio()/teachCueAvailable gate these on the build-time…

**Impact:** This is the PRIMARY runtime's teach moment: QuestPixelWorld.jsx auto-fires sayGraphemeWithName -> playCueSequence([phoneme, name]) on every teach stage (L560-564) and sayGrapheme -> playCueSequence(blendCandidateSrcs) for taught blends with no own clip (shellContract.js:55-57). On a shared iPad with flaky Wi-Fi, if the phoneme clip times out the child hears NOTHING for the sound they are being taught and never hears the letter name; for a blend they can hear /s/ and never /t/, i.e. taught half a blend. Meanwhile the shells keep scoring their taps as misses.

**Fix:** In playNext(), advance the chain on failure too: also listen for 'error' and for playCueAudio's onUnavailable (e.g. pass onUnavailable that schedules the next clip), or drive the sequence off a single settle callback rather than only 'ended'. At minimum, on error skip to the next queue item after gapMs.

### SS-38 · 🟡 MEDIUM — RewardScreen delivers all progression text with no voice narration — a pre-reader cannot tell what they earned or which button continues
`src/components/quest/RewardScreen.jsx:108`

**What's wrong:** The only audio in the entire reward/ceremony screen is SFX: `playStarChime()` and `playCelebrationFanfare` (L108-113). Every string is text-only with no say*/cue call: `New sound stones: ${newStones.map(displayGrapheme).join(", ")}` / `These sounds will return for more practice.` (L214-217), `Next trail: <strong>{nextStop.name}</strong>` (L223-225), and the action buttons `Continue the trail` and `Choose new gear` (L232-233) plus `Show rewards now` (L229).

**Impact:** Audience is pre-readers aged ~4-7 who largely cannot read. At the single most important 'what do I tap next' moment, they get a chime and a wall of unreadable text. They cannot distinguish 'Continue the trail' from 'Choose new gear' by reading, and cannot learn what they earned. The rest of Sound Seekers scrupulously narrates or hides text (Listen buttons gated by hasRecordedSpeech, sayGrapheme/sayWord auto-played on mount), which makes this screen the conspicuous exception — 'text without an audio cue is a real defect' per the brief.

**Fix:** Add a recorded child-voice cue for the ceremony/continue step (e.g. a generic 'You did it! Tap the arrow to keep going.' clip played on mount when isSoundEnabled), and give the primary Continue action an icon/arrow affordance a non-reader recognizes rather than relying on the word. Keep gold-voice policy: use a recorded clip or stay silent, never TTS.

### SS-39 · ⚪ LOW — Post-buzz audio cue timer is never cleared on unmount
`src/components/quest/world/QuestPixelWorld.jsx:434`

**What's wrong:** On a wrong answer, choose() schedules the delayed cue with an untracked timer: `window.setTimeout(() => { if (stage.audioCue?.kind === "grapheme") sayGrapheme(...); else if (stage.audioCue?.kind === "word") sayWord(...); }, 350);` (L434-437). The runtime-teardown cleanup clears teachTimerRef, feedbackTimerRef and pickupTimerRef (L678-680) but has no handle to this anonymous timer.

**Impact:** If a child taps Back / the encounter advances within 350ms of a wrong answer, the grapheme/word clip still fires after the screen is gone (audio playing over the next screen). Rapid wrong answers can also stack multiple pending timers.

**Fix:** Store this timeout in a ref (e.g. cueTimerRef) and clear it in the effect cleanup alongside the other timers, or guard the callback with a mounted flag.

### SS-40 · ⚪ LOW — FlowerPatch/TrailRun ignore the word-cue fallback, so audio-less graphemes render as a silent, unanswerable question (retired QuestHub renderer only)
`src/components/quest/world/Encounters.jsx:107`

**What's wrong:** FlowerPatch: `useEffect(() => { if (isSoundEnabled) sayGrapheme(beat.target, true); }, ...)` (line 107) and Listen `disabled={!hasGraphemeAudio(beat.target)}` (line 131); TrailRun is identical (lines 190, 229). Neither reads beat.cueWord/cuePosition. But questEncounters.buildAudibleLetterRound (src/utils/questEncounters.js:496-509) sets `cue:{kind:'word',word}, cueWord, cuePosition` for the 8 graphemes with no phoneme clip (verified: aw, ore, air, are, ear, ure, le, tion — each has an audible example word).…

**Impact:** In the QuestHub (3D) renderer, at stops 32/34/35/36/39/40 a flower-patch or trail-run beat for these advanced sounds asks 'Which flower makes this sound?' with no sound played and no Hear-it button — impossible for a pre-reader to answer except by guessing. Live severity is low because auto mode resolves only to the pixel (QuestPixelWorld) or 2d (QuestTrail2D) tiers (questPerformance.js resolveQuestQuality), both of which use buildPhysicalTask and honor cueWord; QuestHub is only reachable via a display mode the settings no longer expose. It becomes a real defect the moment QuestHub is re-enabled.

**Fix:** Make FlowerPatch/TrailRun honor the same cue contract the pixel path uses: when beat.cue.kind === 'word', play sayWord(beat.cueWord) and enable the Listen button on hasWordAudio(beat.cueWord), instead of unconditionally calling sayGrapheme(beat.target). Add a test asserting every letter-encounter beat has a playable cue.

## 5. Accessibility & pre-reader UX

### SS-41 · 🟡 MEDIUM — OS prefers-reduced-motion is read but discarded in default (auto) mode, so the pixel world runs full motion
`src/utils/questPerformance.js:148`

**What's wrong:** detectQuestQuality computes `reducedMotion = normalized.reducedMotion || Boolean(browser?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)` (line 186-187), but resolveQuestQuality's auto branch ignores it entirely: `if (displayMode === "auto") { if (saveData || memory <= 1 || cores <= 1) return QUEST_QUALITY_TIERS["2d"]; return QUEST_QUALITY_TIERS.pixel; }` (lines 148-151). The `if (reducedMotion) return STILL_TIER` branch (line 153) is only reachable for legacy non-auto/non-pixel modes. QuestPixelWorld…

**Impact:** Auto is the default mode for essentially every child. A vestibular-sensitive child on a device set to 'reduce motion' at the OS level still gets the full-motion pixel adventure (motionScale 1, ambient animation running) unless an adult separately toggles the in-app reducedMotion setting, which a pre-reader cannot do. The OS accessibility signal the app already reads is silently dropped for the flagship experience (the reward screen honors it at RewardScreen.jsx:96, making the gap inconsistent as well).

**Fix:** In resolveQuestQuality's auto (and pixel) path, when reducedMotion is true return the pixel tier with motionScale forced to 0 (a STILL_PIXEL variant), and/or fold the matchMedia result into the settings.reducedMotion that QuestPixelWorld consumes, so OS-level reduced-motion reduces canvas motion without requiring an in-app toggle.

### SS-42 · 🟡 MEDIUM — Reduced-motion only slows the animation clock; drift/zigzag critters still travel at full speed
`src/components/learn/games/games/SoundSafariArcadeGame.jsx:1524`

**What's wrong:** state.time += reduceMotion ? dt * 0.35 : dt; (L1524) is the ONLY place reduceMotion is used. But translational movement uses raw dt: drift 'critter.x += critter.vx * dt; critter.y += critter.vy * dt;' (L1556-1557) and zigzag 'critter.x += critter.vx * dt;' (L1547). Only orbit/peek/wobble (which read state.time) slow down.

**Impact:** A child who enables reduced motion (vestibular sensitivity, or just needs slower targets to catch them) still sees the drift and zigzag critters — half the critters on the easy world (styles ['drift','orbit']) — flying across the screen and bouncing off walls at full velocity. The setting is effectively ignored for the dominant motion, and produces an inconsistent mix of near-frozen orbit critters beside full-speed drifters. prefersReducedMotion is also read once at engine start and never re-checked.

**Fix:** Apply a reduced-motion speed factor to critter velocity too (scale vx/vy or dt used for translation), and/or reduce critter count/target speed under reduced motion so targets are genuinely catchable and calmer.

### SS-43 · 🟡 MEDIUM — Target word plays once with no replay, and every coach line / hint / verdict is text-only — invisible to pre-readers
`src/components/learn/games/games/SoundSafariArcadeGame.jsx:1270`

**What's wrong:** The word is spoken once at setupTask (L1270) / dismissOnboarding (L1281). captureAt on an empty tap only calls setCoach(...) (L1428) and never re-speaks the word; there is no listen/replay affordance drawn in the canvas. All guidance is unvoiced text: 'Next sound: X' (L803), 'CAUGHT'/'TRY AGAIN' (L1151), and coach lines like 'Say the word slowly — which sound is next?' / 'Not that one — listen to the word again!' (L1428/L1442).

**Impact:** The audience cannot read. If a child misses or is distracted during the single word cue, there is no way to hear the word again for the rest of that task. The coach message literally says 'listen to the word again' but nothing replays. The pass/fail verdict and next-sound hint are text a non-reader can't decode (they only get the chime-vs-buzz SFX). This makes the instructional layer inaccessible to exactly the users it targets.

**Fix:** Add a persistent tappable 'hear the word' affordance (e.g. the Guide sprite or the field-guide word) that re-plays speakWord for the current task, and voice the load-bearing coach lines with recorded clips (gated by hasRecordedSpeech). At minimum re-speak the word on a wrong/empty tap.

### SS-44 · 🟡 MEDIUM — Reduced-motion is honored only cosmetically; the dominant optical-flow motion is never reduced
`src/components/learn/games/games/SoundRacerGame.jsx:2933`

**What's wrong:** reduceMotion gates only particle bursts (2603 'if (reduceMotion) return;'), the boost FOV punch (2943) and camera shake (2949). The core motion runs unconditionally: 'playerZ += speed * dt;' (2933), full-speed scenery parallax in updateTrackVisuals ('prop.position.z += speed * TRACK_UNIT * scrollFactor', 2803), and continuous ship bob ('ship.position.y = 1.03 + Math.sin(now * 0.006) * 0.045', 2864). In SoundBeat, reduceMotion only slows a decorative counter ('state.time += reduceMotion ? dt * 0.35 : dt',…

**Impact:** A child (or parent) who enables Reduce Motion for vestibular sensitivity still gets the exact large-field forward scroll and peripheral parallax that trigger motion sickness — the setting suppresses only the minor effects. On a shared school iPad this can make the game physically unusable for the very users the setting exists to protect.

**Fix:** Under reduceMotion, damp the actual optical flow: cut base speed and parallax scrollFactor, hold the horizon steadier (reduce scenery layer motion), and stop the idle ship/camera bob. Even a 40-50% reduction of forward-scroll and parallax speed materially lowers the trigger while keeping the game playable.

### SS-45 · ⚪ LOW — Primary navigation and reward cues are text-only with no audio for pre-readers
`src/components/quest/world/QuestHub.jsx:5084`

**What's wrong:** The big call-to-action button renders text only: `<strong>The gate is open</strong><span>Walk through to the next trail</span>` / `<strong>{section.guide.friend} is waiting</strong><span>Follow the path</span>` / `<strong>{nextEncounter.friend} needs help</strong><span>{nextEncounter.label}</span>` (5085-5094), with no sound played when it appears. The pickup reward toast is likewise text-only: `setPickupNotice(foundDrop.cache ? \`Route cache opened · +${SPARKS_PER_DROP} Sparks\` : ...)` (4119-4121) rendered at…

**Impact:** The audience cannot read. The phonics *question* is correctly audio-backed (cuePhysicalTask + the honest silent fallback), but the 'what do I do now / where do I go' guidance is delivered purely as words a 4-7-year-old can't decode. A child who misses the in-world beacon has no spoken prompt telling them the gate opened or a friend needs help; the reward toast's meaning ('cache opened, +5 Sparks') is invisible to them beyond the star chime.

**Fix:** Pair these state transitions with a recorded voice cue where one exists (or a distinct earcon), and lean on the world beacon + character as the primary signal. At minimum, gate the celebratory/'gate open' moment to a sound so its meaning isn't text-only.

### SS-46 · ⚪ LOW — Intro capture-phase key handler calls preventDefault on every key and dismisses on any key, trapping keyboard navigation
`src/components/learn/games/games/SoundRacerGame.jsx:2990`

**What's wrong:** onIntroKey does 'event.preventDefault(); dismissIntro();' for ANY key (2990-2993) and is attached in the capture phase on window ('window.addEventListener("keydown", onIntroKey, true)', 3008).

**Impact:** While the intro card is up, a keyboard or switch-access user pressing Tab (to move focus) or any browser shortcut instead has it swallowed and the intro force-dismissed, and it blocks assistive-tech key handling globally during that window. Minor because it only affects the first-run intro, but it undermines keyboard accessibility of the onboarding.

**Fix:** Only dismiss/preventDefault on the intended activation keys (Space/Enter, and the steer keys), and let Tab/Escape/browser shortcuts pass through so focus and AT navigation still work.

## 6. Performance on low-end iPads

### SS-47 · 🟡 MEDIUM — commit() serializes and writes the entire save file to localStorage on every state-changing runtime/frame signal during play
`src/components/quest/QuestRoot.jsx:454`

**What's wrong:** handleRuntimeSignal: `if (recorded !== current) commit(recorded);` (line 454), and commit (lines 196-202) calls `saveQuestProgress(progressScopeKey, next)`. saveQuestProgress (questStore.js:35-55) runs normalizeQuestState (rebuilds the whole object), JSON.stringify of the full save (creature + mastery + stones + telemetry history), a synchronous window.localStorage.setItem, and queueProgressSave. onRuntimeSignal is emitted from the pixel world on each frame-budget window close (QuestPixelWorld.jsx:636) and each…

**Impact:** During active play these periodic signals repeatedly trigger a full normalize + JSON.stringify + synchronous localStorage write of the entire (potentially large, telemetry-heavy) save on the exact low-end shared iPads the app targets. Synchronous localStorage.setItem blocks the main thread, adding GC pressure and frame hitches to a real-time Phaser scene — degrading the very experience the frame-budget telemetry is trying to measure.

**Fix:** Don't persist telemetry-only/runtime-signal state changes on every tick. Debounce/coalesce runtime-event saves (e.g. throttle to the existing 15s bankTime cadence or flush on view change/quit/unmount), or keep runtime frame stats in a ref and fold them into the save only at session boundaries.

### SS-48 · 🟡 MEDIUM — Beastie sprite sheet rebuilt synchronously on the main thread with layoutCreature recomputed 64x per build
`src/components/quest/world/questPixelAvatar.js:668`

**What's wrong:** drawVectorBeastieFrame() calls `const layout = layoutCreature(creature);` at L668, and createPixelBeastieSheet() invokes it inside the 16x4 loop (L756-766: `for (let row...) for (let frame...) drawVectorBeastieFrame(...)`). `layout` depends only on `creature` (direction/frame/pose are applied afterward via transforms), so layoutCreature (and the normalizeCreature clone inside it, L81) runs 64 identical times. finishPixelBeastieSheet() then does a full-resolution `getImageData`/per-pixel posterize loop over the…

**Impact:** First time a stop opens (Phaser scene is destroyed and rebuilt per stopId) and after every creature customization, the main thread stalls to draw 64 vector frames + 64 redundant part-layouts + a ~262k-pixel readback loop. On the target low-end/shared iPads this is a visible freeze at scene start. The result is cached (BEASTIE_SHEET_CACHE), so it is a one-time-per-creature cost, but the 64x layoutCreature is pure waste.

**Fix:** Hoist `layoutCreature(creature)` (and normalizeCreature) to once per sheet build and pass the layout into drawVectorBeastieFrame. Consider building the sheet off the main thread (OffscreenCanvas / requestIdleCallback) or reusing the cached sheet across the destroy/rebuild so the first frame of a stop is not blocked.

### SS-49 · 🟡 MEDIUM — Sightline occlusion-fade recasts the entire scene per choice, every frame, during encounters
`src/components/quest/world/QuestHub.jsx:1798`

**What's wrong:** updateSightline (lines 1782-1826) allocates `const raycaster = new THREE.Raycaster();` (1787) on every call, then for each visible choice item runs `for (const hit of raycaster.intersectObjects(scene.children, true))` (1798) — a deep, recursive raycast against ALL top-level scene children. It is invoked unconditionally every animation frame (line 4369) whenever an encounter task is visible.

**Impact:** During an active encounter (2-4 visible choices) the loop performs 2-4 full-scene recursive raycasts per frame against a scene that contains the fallback tree belt (dozens of trees, ~10 meshes each), imported glTF nature, particle systems, characters, glades and the gate — thousands of triangles per ray. On a low-end school iPad this is the single heaviest per-frame CPU cost and it lands exactly when the child is trying to read/answer, so the frame budget sampler (line 3948) is most likely to trip and the answer taps feel laggy at the worst moment. A fresh Raycaster is also GC-allocated every frame.

**Fix:** Hoist one reusable Raycaster out of the per-frame path. Restrict the raycast target set to a pre-collected array of fade-eligible occluders (trees/scenery groups) instead of `scene.children` recursive, and/or throttle the sightline update to every N frames or gate it behind a cheap bounding-box pre-check, since occluders only change when the camera settles.

### SS-50 · 🟡 MEDIUM — Render body rebuilds heavyweight per-beat task objects on every React re-render (unmemoized)
`src/components/quest/world/QuestHub.jsx:4860`

**What's wrong:** `const activeFieldTask = active ? buildPhysicalTask(section, active, active.beats[beatIndex], beatIndex) : null;` (4784) and `const encounterTasks = active?.beats?.map((encounterBeat, encounterBeatIndex) => (buildPhysicalTask(section, active, encounterBeat, encounterBeatIndex))) || [];` (4860-4862) run in the component body with no useMemo. `buildPhysicalTask` is expensive (per-item routePointAt/routeDirectionAt, full stage/item/completion arrays). The same call is deliberately cached inside the rAF loop — see the…

**Impact:** The component holds ~15 pieces of state (mood, routePercent, interactionFeedback, correction, phonemeFillCount, selectedId, ...). Any of these changing — e.g. walk/idle mood flips, the route-meter ticking, each answer's feedback timer — re-runs the full render body, rebuilding the active task AND a task object for every beat of the encounter. On low-end tablets this compounds with the already-tight frame budget and can cause dropped frames during answer feedback.

**Fix:** Wrap `activeFieldTask`, `encounterTasks`, `satchel` and the derived slot state in `useMemo` keyed on the real inputs (`active?.id`, `beatIndex`, `fieldStage`, `section`, `picked.size`). This mirrors the frameTaskCacheRef optimization the rAF loop already relies on.

### SS-51 · 🟡 MEDIUM — Every level transition rebuilds the entire scene and regenerates ~10 large canvas textures synchronously, freezing low-end iPads
`src/components/learn/games/games/SoundRacerGame.jsx:2527`

**What's wrong:** startLevel() calls resetSceneForMap() (2527) on every track change. That function disposes and recreates all scenery and, crucially, redraws large canvas textures from scratch each time: makeTrackTexture is a 768x1536 canvas that fills 1200 speckle rects plus per-row panels (770-834), plus makeMountainTexture (1024x384, x2), 3x makeForestTexture (1024x360, each drawing 48-70 hand-built trees, 668-768), makeCloudTexture, makeGroundTexture and the horizon glow — all built on the main thread inside the backdrop setup…

**Impact:** With 10 tracks per cup, each 'Next map' triggers a large synchronous canvas-drawing + GPU-upload burst on the main thread. On the low-end shared iPads this targets, that is a visible multi-hundred-millisecond freeze between every level, right when the child taps continue — reading as the game hanging.

**Fix:** Cache textures that don't depend on currentMap across levels, tint via material color/uniforms instead of full redraws where possible, and/or amortize the rebuild (build the next scene incrementally behind the 3.8s countdown rather than all at once on the click).

### SS-52 · 🟡 MEDIUM — If startGame throws after allocating the renderer/canvas, the WebGL context and window keydown listener leak (teardown is a no-op)
`src/components/learn/games/games/SoundRacerGame.jsx:3058`

**What's wrong:** The effect declares 'let api = { teardown() {} };' (3058) and only reassigns 'api = startGame(...)' (3063) if startGame returns normally. The catch handler then calls the still-noop 'api.teardown()' (3076), and the cleanup return does the same (3086). But startGame appends the WebGL canvas to the mount ('mount.appendChild(renderer.domElement)', 313) and adds a window keydown listener ('window.addEventListener("keydown", onKey)', 2783) well before it returns at 3037; startLevel()/scene construction (2959) runs…

**Impact:** On the error path the real cleanup (disposeRenderer with forceContextLoss, removeEventListener) never runs, so a live WebGL context and a global keydown handler are orphaned each failed start. Browsers cap simultaneous WebGL contexts (~16); repeated failed launches/retries on a weak iPad can exhaust them and then block this and other 3D games from starting at all.

**Fix:** Have startGame register a teardown/partial-cleanup handle before it starts allocating (or wrap allocation in try/catch that disposes on throw), and assign 'api' incrementally so the catch's api.teardown() actually releases the renderer and listeners.

### SS-53 · ⚪ LOW — loadQuestProgress runs twice on mount, doing a redundant full JSON.parse + normalizeQuestState of the save
`src/components/quest/QuestRoot.jsx:135`

**What's wrong:** `const [state, setState] = useState(() => loadQuestProgress(progressScopeKey));` (line 135) and immediately `const [view, setView] = useState(() => initialView || (loadQuestProgress(progressScopeKey).hatched ? VIEW.DEN : VIEW.CREATOR));` (lines 136-138) each call loadQuestProgress, which does JSON.parse(localStorage...) + normalizeQuestState (questStore.js:23-33).

**Impact:** Two full parse+normalize passes over the whole save (including mastery and telemetry history) at the most latency-sensitive moment — opening the mode — on low-end iPads. Minor, but avoidable, and the second call also risks reading a value that diverges from `state` if anything wrote between them.

**Fix:** Derive the initial view from the already-loaded `state` (e.g. compute the snapshot once in a variable or read stateRef in a lazy initializer) rather than calling loadQuestProgress a second time.

### SS-54 · ⚪ LOW — `resolution` game-config key is inert in Phaser 4 — the '2x DPR cap' does nothing; pixel art is browser-upscaled and blurry on retina iPads
`src/components/quest/world/questPixelRuntime.js:5668`

**What's wrong:** `resolution: Math.min((typeof window !== "undefined" && window.devicePixelRatio) || 1, 2),` (L5668) with the comment claiming: `// Cap at 2x: beyond that the canvas cost outweighs the crispness.` (L5667).

**Impact:** Verified: Phaser 4 Config.js reads no `resolution` key (grep of node_modules/phaser/src/core/Config.js shows it absent — it was removed in 3.16), and ScaleManager.resize sets `this.canvas.width = this.baseSize.width` with NO devicePixelRatio multiply (ScaleManager.js L861). So the backing store is always CSS-pixel resolution and the browser upscales the whole canvas by the device DPR — the exact 'shimmering, soft pixel art on the screens children use most' the comment claims to fix. `pixelArt:true` only controls texture sampling inside the canvas, not the final canvas→screen upscale, so it stays blurry. Perf note (honest): the…

**Fix:** Remove the dead `resolution` key and the misleading comment so future readers don't trust a cap that isn't wired. If crisp-but-capped pixel art is actually wanted on retina, implement it explicitly: size the canvas backing store to `min(dpr,2) × CSS` yourself (set canvas.width/height plus CSS width/height on resize) and profile fill-rate on a low-end iPad before shipping. Otherwise document that the scene deliberately renders at 1x (cheap, soft) and rely on `pixelArt`/`roundPixels` for what crispness that yields.

### SS-55 · ⚪ LOW — Phaser 4 ignores the `resolution` game-config key — the intended 2x DPR cap for retina tablets is never applied
`src/components/quest/world/questPixelRuntime.js:5668`

**What's wrong:** Game config sets `resolution: Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2)` (5668) with a comment: 'Cap at 2x: beyond that the canvas cost outweighs the crispness.' But Phaser 4's config parser (node_modules/phaser/src/core/Config.js) does not read a `resolution` key at all — it was removed after Phaser 3; the key is silently ignored.

**Impact:** The DPR cap the commit added to protect low-end/high-DPR devices does nothing. On a 3x-DPR iPad the backing store is not clamped to 2x by this setting, so the intended fill-rate ceiling and the 'crisp but not over-rendered pixel art' outcome are not actually in force — the opposite of the stated goal for the weakest devices. This is confirmed dead config; the exact on-device backing-store size should be verified.

**Fix:** Remove the ignored `resolution` key and control DPR through the Phaser 4 Scale Manager (e.g. an explicit zoom/parent-size strategy, or `Math.min(devicePixelRatio,2)` applied via the scale config) so the 2x cap is genuinely applied; verify canvas backing-store dimensions on a retina iPad.

### SS-56 · ⚪ LOW — syncCarriedObject runs on every handleResize (outside the zoom gate), re-churning the carried sprite during iOS resize storms
`src/components/quest/world/questPixelRuntime.js:4250`

**What's wrong:** `this.syncCarriedObject(this.model?.activeStage);` (4250) sits after — and outside — the `if (zoomChanged ...)` guard, and syncCarriedObject unconditionally destroys and recreates the carried object: `this.destroyTweenedObject(this.carriedObject); ... this.carriedObject = null; ... const container = this.add.container(...)` (4685-4700).

**Impact:** The same iOS URL-bar resize storm that motivated gating the choice rebuild still destroys+recreates the carried 'parcel/ferry/plank' sprite on every resize event during carry/steer/place-plank stages — a visible flicker and GC churn on exactly the low-end devices the surrounding optimization targets.

**Fix:** Only call syncCarriedObject when the carried state can actually have changed (e.g. gate it on `zoomChanged` alongside the choice rebuild, or diff the current carried shape/mode before tearing it down and rebuilding).

### SS-57 · ⚪ LOW — Inline ref callbacks on the drops and encounters lists detach/reattach every render
`src/components/quest/world/QuestHub.jsx:4927`

**What's wrong:** `ref={node => { if (node) dropRefs.current.set(drop.id, node); else dropRefs.current.delete(drop.id); }}` (4927) and the equivalent on the encounter buttons (4940). Because the arrow identity changes every render, React invokes the previous callback with `null` (running `.delete`) and the new one with the node (`.set`) on every commit.

**Impact:** During travel the component re-renders roughly every 2% of route progress (setRoutePercent, 4168-4170), plus every mood/feedback change, so these Maps are torn down and rebuilt for all drops and encounters on each of those renders — avoidable churn on the hot device. It also briefly clears the ref the rAF projection loop reads (dropRefs.current.get, 4425), producing wasted work.

**Fix:** Use stable per-id ref-setter callbacks (memoized in a useRef-backed factory keyed by id) or a single callback that keys off `node.dataset.id`, so identity is stable across renders and React stops detaching them.

### SS-58 · ⚪ LOW — Every answer synchronously re-normalizes and rewrites the entire quest blob inside the setState updater
`src/components/quest/QuestRoot.jsx:413`

**What's wrong:** handleAnswer: `setState(prev => { const attempted = recordQuestAttempt(...); const next = recordQuestTelemetryAnswer(attempted, correct); stateRef.current = next; saveQuestProgress(progressScopeKey, next); return next; });` — saveQuestProgress (questStore.js:36-39) runs normalizeQuestState (rebuilds creature, clamps stars/drops, and normalizes up to 80 telemetry sessions each via normalizeRuntime/normalizeInteraction) + JSON.stringify + localStorage.setItem, with NO debounce on the local write.

**Impact:** On low-end school iPads a child answering rapidly triggers a full O(state-size) normalize + serialize + synchronous localStorage write on every single answer; the cost rises as telemetry/mastery accumulate. Doing this side effect INSIDE the state updater is also a React anti-pattern: updaters are expected to be pure and are invoked twice under StrictMode, causing duplicate saves/queue enqueues and potential stale writes on render bailout.

**Fix:** Move saveQuestProgress out of the setState updater into an effect or the existing commit() path, and debounce/throttle the local write (as the cloud queue already is) so rapid answers coalesce; skip re-normalizing on the hot save path.

## 7. UX & flow

### SS-59 · ⚪ LOW — HUD collectible image has no onError fallback
`src/components/quest/world/QuestPixelWorld.jsx:743`

**What's wrong:** The header tally renders `<img src={collectible.image} alt="" />` (L743) with no onError handler. collectible resolves via PIXEL_COLLECTIBLES[section?.chapter?.id] (L195) to hardcoded PNG paths including later-chapter scenery-premium assets. This is inconsistent with Piece.jsx, which tracks `broken` state and swaps to a fallback `onError={() => setBroken(true)}`.

**Impact:** If any chapter's collectible PNG is ever missing/renamed (or fails to load on flaky Wi-Fi before cache), a broken-image glyph shows in the HUD to a pre-reader. I verified all eight current collectible assets exist on disk, so this is latent rather than live — but the asset-fallback discipline applied everywhere else in the render layer is absent here.

**Fix:** Give the collectible img an onError that hides it (or swaps to an inline SVG/emoji), matching Piece.jsx's graceful-degradation pattern.

### SS-60 · ⚪ LOW — Deferred review re-enters a word beat with stale pre-filled phoneme slots
`src/components/quest/world/QuestHub.jsx:4555`

**What's wrong:** `beginEncounter` (line 3913), `nextBeat` (line 4611), and `completeEncounter` (line 4525) all call `setPhonemeFillCount(0)`, but `beginDeferredReview` (lines 4548-4579) resets `fieldStage`/`beatIndex`/correction/verb state yet never resets `phonemeFillCount`. The word builder fills slots from that count: line 4857 `for (const grapheme of activeWordParts.slice(0, phonemeFillCount)) { activeSlotState = advancePhonemeSlotState(...); }`.

**Impact:** When a word-building beat is re-entered for its deferred-review pass, the on-screen word builder shows letters already placed (carried over from wherever `phonemeFillCount` last landed) before the child has answered anything in the review, misrepresenting progress on the sound they specifically struggled with and are now re-practising.

**Fix:** Add `setPhonemeFillCount(0)` to `beginDeferredReview` alongside the other stage resets so the review starts with an empty word builder.

### SS-61 · ⚪ LOW — Completed final stop keeps the 'is-next' current-destination highlight after 100% completion
`src/components/quest/TrailMap.jsx:180`

**What's wrong:** const isNext = stop.index === nextIndex; with nextIndex = currentStopIndex(state), which returns the last stop's own index when everything is done: questProgress.js:155 `return next ? next.index : QUEST_STOPS.length;`. Line 187 then applies `${isNext ? " is-next" : ""}` and line 201/68 places the walker via `positions.find(({ stop }) => stop.index === nextIndex)`.

**Impact:** When all 40 stops are done, currentStopIndex saturates at QUEST_STOPS.length (=40), which equals the final stop's index. Viewing chapter 8 after full completion, stop 40 is simultaneously is-done and is-next, so it still shows the 'current destination' styling/pulse and the walker sits on it, implying 'continue here' on an already-finished stop even though the header shows the 'Whole trail restored' state. Cosmetic but contradicts the completion messaging.

**Fix:** Suppress is-next when the stop isDone (or when journeyComplete), or have currentStopIndex return QUEST_STOPS.length + 1 on full completion and update the isStopUnlocked comparison to `<=` accordingly.

### SS-62 · ⚪ LOW — 2D header progress counter is 0-based during the trail, under-representing the child's position
`src/components/quest/world/QuestTrail2D.jsx:597`

**What's wrong:** {Math.min(section.encounters.length, encounterIndex + (phase === "gate" ? 1 : 0))} / {section.encounters.length} — encounterIndex is 0-based and only increments after an encounter is completed, so during the first friend it reads '0 / N'; it reaches 'N / N' only at the gate (the +1).

**Impact:** While the child is actively working the first encounter, the header reads '0 / N', which is inconsistent with the adjacent q2d-route list (lines 613-619) that correctly highlights friend 1 as current. A watching teacher/parent sees 0 progress during the first friend. Low severity and arguably intentional as a 'friends completed' count, but the mismatch with the route list is confusing.

**Fix:** During phase 'trail' show `encounterIndex + 1` (keep 'N' at the gate), or relabel the counter as completed friends so it visibly agrees with the current-friend highlight.

### SS-63 · ⚪ LOW — Checkpoint is deliberately dropped across devices, so a mid-stop child on a shared iPad restarts the section
`src/utils/progressMerge.js:263`

**What's wrong:** phonics_quest merge ends with `checkpoint: base.checkpoint ?? null` — the cloud checkpoint is intentionally ignored, and QuestRoot uploads checkpoint anyway (questStore.js does not strip it), so it is synced but never restored.

**Impact:** The header of questProgress.js states 'losing a long trail section is a child who never comes back', yet on shared devices children rarely get the same iPad twice: a child who was partway through a long stop on device A and returns on device B loses the in-stop checkpoint and must restart that section. Bounded to one in-progress stop (completed stops sync), and partly by design to avoid mid-stop teleport, but it defeats the stated purpose on the exact shared-device audience.

**Fix:** Consider restoring a cloud checkpoint only when the device has no local checkpoint AND the checkpoint's stop is the child's current unlocked stop (so it resumes rather than teleports); or stop uploading checkpoint to save bandwidth if it will never be honored.

### SS-64 · ⚪ LOW — Den world backdrop unlock threshold (DEN_THEMES.at) is never enforced
`src/utils/denRewards.js:5`

**What's wrong:** DEN_THEMES carry an unlock gate: `{ id: 'dino', name: 'Dinosaur Valley', at: 20, ... }, { id: 'moonwood', ..., at: 45, ... }` with the header comment 'Den backdrops the child unlocks with lifetime gems, then picks freely.' But HollowPage.jsx renders every theme with no gate — `DEN_THEMES.map(world => (<button ... onClick={() => chooseTheme(world)}>...)` — and chooseTheme just saves `denTheme: next.id`. No gem/coin/progress comparison against `at` exists anywhere.

**Impact:** The documented progression reward is dead code: a brand-new child can select the 'at: 45' Moonwood backdrop on day one. Harmless cosmetically, but it removes an intended long-term unlock and leaves misleading data (`at`) that a future dev will assume is honored.

**Fix:** Either enforce `at` against lifetime earnings when rendering/selecting themes, or delete the `at` field and the header comment so the code matches reality.

### SS-65 · ⚪ LOW — Replaying a trail gear-stop force-re-equips the gear and re-announces it as 'New gear'
`src/utils/questProgress.js:263`

**What's wrong:** recordStopResult always calls equipEarnedQuestGear, which overwrites the child's current slot: `if (creature.equipped?.[gear.slot] === gear.id) return state; return { ...state, creature: { ...creature, equipped: { ...creature.equipped, [gear.slot]: gear.id } } };`. QuestRoot.jsx computes `const gearReward = earnedGearReward(next, finishedStopId); const gear = gearReward?.equipped ? gearReward.id : null;` and RewardScreen shows `New gear: {gearPiece.label}` whenever `gear` is truthy — with no check that this stop…

**Impact:** The review circuit wraps the routeCursor back through the curriculum and free-roam replays stops, so gear stops s1-s5 get walked again. On each replay the child is told 'New gear: Acorn Hat' for gear they already own, and if they had switched their head gear (leaf-cap vs acorn-hat) it is silently forced back to that stop's gear — undoing a cosmetic choice the child made in the Trading Post/Creator.

**Fix:** Only equip/announce trail gear on first completion of the stop (gate on the `completedBefore` flag already computed in QuestRoot), and skip re-equip when the slot already holds a piece the child chose.

### SS-66 · ⚪ LOW — Console blocks paired-testing observations the acceptance engine explicitly supports
`src/components/quest/QuestFieldStudyConsole.jsx:311`

**What's wrong:** Save rejects on `records.some(record => recordKey(record) === recordKey(candidate))` where `recordKey(record) => `${record.profileId}:${sessionId}`` (line 176-178) — participant is NOT part of the key. But evaluateQuestHumanAcceptance keys duplicates as `${profileId}:${sessionId}:${participant.anonymousId}` and comments: 'two children observed in the same session id (paired testing) are two observations, not a duplicate' (questHumanAcceptance.js:127-129).

**Impact:** An observer running paired testing (two children under one session code, which the acceptance math is designed to count as two distinct participant observations) cannot enter the second child: the console rejects it as 'That study type and session code already exist.' The two layers disagree, so legitimate cohort evidence is silently harder to capture and the distinct-participants counts can never benefit from paired sessions.

**Fix:** Make the console's duplicate key include the participant anonymousId (matching the acceptance engine) so paired-session observations with different participant codes can both be saved, while still blocking true duplicates (same profile + session + participant).

### SS-67 · ⚪ LOW — SoundBeat restarts the whole word from the first beat on any mistimed tap, with no attempt-based mercy path
`src/components/learn/games/games/Ps1ArcadeGame.jsx:880`

**What's wrong:** In tapBeat, any tap outside the window falls to 'missCurrent()' (880), which resets 'state.beatIndex = 0' and replays the word from its first sound (758-774). An early tap counts as a full miss because the hit test is symmetric '|now - targetTime| <= windowSeconds' (854-858), and each miss also pushes noteStart out by ~0.9s. The per-task 'attempts: 0' field created in makeTasks (549) is never incremented or read, so there is no 'after N tries, ease off or auto-advance' escape.

**Impact:** An impatient or motor-delayed 4-7 year old who taps before the beat, or can't consistently land inside the window, is bounced back to beat 0 of the same word every time and can loop on a single word with no way forward except quitting. Unlike SoundRacer (which escalates to lane callouts and spoken words), SoundBeat offers no graduated help.

**Fix:** Track attempts and, after a couple of misses on a word, widen the window, slow the tempo for that word, or let it advance without credit; and consider forgiving early taps (only count a hit as a miss when it lands after the window, not before).

## 8. Privacy & data collection

### SS-68 · 🟡 MEDIUM — Field-study console's advertised anonymity is not enforced: names typed into 'anonymous' code fields pass every privacy check
`src/utils/questHumanAcceptance.js:43`

**What's wrong:** The `privacy` gate is `{ id: "privacy", pass: !hasDirectIdentifier(record) }` (line 64), and `hasDirectIdentifier` only inspects object KEYS: `DIRECT_IDENTIFIER_KEYS.has(key.toLowerCase()...) || hasDirectIdentifier(child)` (lines 43-48) — it never inspects string VALUES. The id fields are gated only by `idIsAnonymous(value) => /^[A-Z0-9][A-Z0-9-]{2,23}$/i.test(...)` (line 50-52), which accepts real names: 'EMMA-SMITH', 'MrsJohnson3', 'ROOM-KAYLA' all match.

**Impact:** The console header promises `No names. Use anonymous study codes only.` and the save flow labels records 'anonymous', SHA-256-seals them (sealQuestHumanObservation), stores them in localStorage, and downloads them as evidence files (QuestFieldStudyConsole.jsx:315-318). An observer who types a child's real name into the participant/session/setting code field passes validation with zero warning, so identifiable child data is written into files and local storage the tool asserts are anonymised — the exact leak the tool exists to prevent.

**Fix:** Validate id VALUES, not just keys: reject codes containing lowercase-mixed name-like patterns or, better, require a strict prefixed format (e.g. `/^(CHILD|ADULT|SESSION|OBS|ROOM)-[0-9]{1,4}$/`). Additionally have hasDirectIdentifier scan string values for common name/email/phone shapes so the privacy check can actually fail on identifiers.

### SS-69 · ⚪ LOW — Entire quest telemetry (up to 80 sessions of child behavioral + timing data) is uploaded to the cloud on every save
`src/utils/questStore.js:52`

**What's wrong:** saveQuestProgress strips only `assignment`: `const { assignment, ...uploadPayload } = next; ... queueProgressSave("phonics_quest", "__all__", uploadPayload, { scopeKey });`. `next` is normalizeQuestState(state), which includes `telemetry: normalizeQuestTelemetry(...)`. That telemetry keeps `.slice(-MAX_SESSION_HISTORY)` = up to 80 sessions (questTelemetry.js:1,90), each carrying startedAt/lastActiveAt/endedAt ISO timestamps, activeMs, answers/correct, responseMsTotal, motorRetries, correctionMisses, lastOfflineAt…

**Impact:** Every debounced save (fired on every answer via handleAnswer -> saveQuestProgress, QuestRoot.jsx:413) re-serializes and re-uploads a growing behavioural/attendance profile of the child (per-session play timestamps, response-latency, retry counts) that has no cross-device purpose. It is pure over-collection of data about a 4-7-year-old, and because it rides in the same `__all__` payload as the child's real progress (stars, completed stops, mastery), the bloat raises the failure/timeout probability of that upload on the flaky school Wi-Fi this app targets, putting genuine progress persistence at higher risk of deferral.

**Fix:** Exclude `telemetry` (and any other purely-local diagnostics) from uploadPayload the same way `assignment` is stripped, so only durable progress fields sync. Keep telemetry local-only, or if a cloud copy is truly needed, sync a small aggregate under its own key rather than the full 80-session history on every write.

## 9. Code quality / dead code

### SS-70 · ⚪ LOW — Item-level adaptive selection scoring (recency/mistake/distractor biases) is dead code — never invoked
`src/content/initialSounds/initialSoundSelector.js:175`

**What's wrong:** `function scoreItem(item, sets, context)` computes reasonScore + mistakeBoost + distractorBoost - recentPenalty - correctPenalty (using repeatedMistakes, incorrectDistractorPatterns, recentlySeenItemIds, answeredCorrectItemIds). Grep confirms scoreItem() is never called anywhere in src/. Its only helper selectionReasonFor (line 158) and getProgressSets (line 144) are likewise only reachable through scoreItem. The live path getInitialSoundRoundPlan selects letters purely by phase/shuffle plus…

**Impact:** The designed adaptivity — boosting letters the child repeatedly misses, penalizing recently-seen items, reacting to distractor-confusion patterns — has no effect on which questions are chosen. The extra signals are computed and stored but silently ignored, so the assessment is less adaptive than the code implies and a reader/maintainer is misled about behavior.

**Fix:** Either wire scoreItem into the selection (e.g. rank the selectable letters' items by score) or delete scoreItem/getProgressSets/selectionReasonFor and the fields they consume, so the intended behavior and the actual behavior match.

### SS-71 · ⚪ LOW — Chapter verb 'completed' gated on a hardcoded stage-index threshold unrelated to the beat's real stage count — and it is dead code
`src/utils/questSliceSystems.js:238`

**What's wrong:** The `steer` handler returns completion as `Number(input.stage) >= 3` (line 238); `turn` uses `>= 3` (line 221), `climb` `>= 3` (line 272), `signal` `>= 2` (line 255). These thresholds are literal stage indices, not derived from the beat's actual number of stages. Meanwhile both live renderers ignore the `completed` field entirely — QuestPixelWorld.jsx advances on `fieldStage + 1 < task.stages.length` (line 469) and only reads `verbResult.accepted/.state/.recordAttempt`; QuestTrail2D.jsx:477-478 likewise. Only…

**Impact:** Today this is harmless because nothing at runtime reads `completed`. But it is a live trap: if any future consumer starts using the verb's `completed` flag to end an encounter, a steer/turn/climb encounter with fewer than 4 stages (or a signal with fewer than 3) would report 'never completed' and could softlock, while one with more stages would complete early. The unit tests currently lock in this arbitrary behavior, so a refactor toward using `completed` would look 'tested' while being wrong.

**Fix:** Base completion on the verb's own progress relative to `state.expected`/stage count (as assembly and rhythm already do with `placed.length === expected.length`), not on a magic stage index. If `completed` is genuinely unused, delete it from these handlers and the tests to stop advertising a contract the runtime does not honor.
