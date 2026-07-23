# Sound Seekers — Deep Review Report

**Scope:** the full Sound Seekers quest mode — `src/components/quest/` (25 files, ~18.3k lines), `src/data/quest*.js` + `storyQuests.js`, `src/utils/quest*.js` (~25 modules), `src/styles/quest.css`, the Phaser pixel runtime, and the quest test suites.
**Method:** 8 parallel specialist audits (Educational, Gameplay & Mechanics, UI/UX, Graphics & Rendering, Audio, State & Economy, Accessibility, Code Health). Every finding cites file:line evidence; quantitative claims were verified by running the real builders/simulations against the real data and the generated audio manifest (9,825 entries), not by reading alone.
**Audience context:** children 4–7 (pre/early readers) + teachers.

---

## Executive summary

Sound Seekers' pedagogical *architecture* is genuinely strong: decodability-gated content (enforced by `checkQuestIntegrity.js`), blends treated as non-graphemes, the walk-not-quiz format, forward-only progression, a well-tested pure core (mastery, review scheduling, correction ladder), and an unusually thorough reduced-motion story. The problems are concentrated in four places:

1. **The audio layer is the single biggest gap.** 17 of 22 taught blends, all 8 alternative pronunciations, 16 Act III graphemes and 81 of 430 decodable words are silent — and two designed fallbacks (`blendCandidateSrcs`, `altPronunciationSrc`) exist but have **zero callers**. Entire stops (s13–s15, s16, s28–29, s37) "teach" sounds a child can never hear. There is also no read-aloud of any instruction, prompt, feedback, or story text anywhere — in a mode built for pre-readers.
2. **Correctness bugs in the learning loop.** A guaranteed impossible/soft-locking Sound Sort at s10 ("thing" in both pens); distractor maps that omit every vowel team so children get marked wrong for tapping a *correct* same-sound spelling; the mastery "two different days" anti-cram rule measured in UTC (clearable in one real hour); star scoring that punishes the very correction ladder the game ships.
3. **Content silently deleted by plumbing.** 44 of 60 heart words are never practised but all 60 are "awarded"; the 2D/pixel action budget defers 44 beats across 20 stops (and the renderers serve *different* content); six authored second story pages are unreachable; the physical-task path discards the word-cue fallback so 8 late graphemes earn no mastery.
4. **View-layer rot.** The mastery-writing run-loop is hand-copied into three renderers (it already diverged once and corrupted mastery keys); a 636-line dead component island plus ~25 dead exports; two god classes (5.7k-line pixel scene, 4.9k-line/91-hook 3D hub); the 3D hub's renderer is opt-in-only yet carries ~6,200 lines.

Also notable: a teacher reset can be **silently undone** by any open quest session (hydrate merges the pre-reset in-memory state back); a mid-encounter child in the 3D hub has **no exit**; and the weakest classroom devices get the most CPU-bound renderer with no DPR handling.

### Top 10 priorities overall (across all areas)

| # | Fix | Area | Severity |
|---|-----|------|----------|
| 1 | Wire blend playback + alt-pronunciation resolver (zero-caller fallbacks) | Audio / Educational | Blocker |
| 2 | Guard Sound Sort against cross-pen words (s10 soft-lock) | Educational | Blocker |
| 3 | Complete the `SAME_SOUND` distractor map (wrong-for-correct answers) | Educational | High |
| 4 | Teacher-reset tombstone must survive hydrate | State | High |
| 5 | Play word-cue fallback in the physical path (8 graphemes earn no mastery) | Gameplay | High |
| 6 | One persistent exit on every screen/renderer, including mid-encounter | UI/UX | High |
| 7 | Anchor mastery "days" to local time; split assisted vs independent evidence | Educational | High |
| 8 | Read-aloud for prompts/feedback/guide lines (pre-readers) | Audio | High |
| 9 | Extract the shared encounter run-loop used by all 3 renderers | Code Health | High |
| 10 | Bake static Graphics → textures + cache beastie sheets (weakest devices) | Graphics | High |

---
---

# 1. Educational Content & Pedagogy

### Key findings (severity-ranked)

- **F1 — BLOCKER: Sound Sort can hand a child an impossible round; in the DOM walk it soft-locks the stop.** s10 teaches `th`+`ng`; "thing" segments as `th|i|ng` and belongs to *both* pens. The derived sort builder has no cross-pen overlap guard (`src/utils/questRounds.js:305-319`); the production first-play seed 10009 produces "thing" **twice with conflicting correct answers**. `SheepPens` keys `sorted` by word, so completion can never be reached (`Encounters.jsx:497-518`) and the path-blocker traps the child.
- **F2 — HIGH: two-right-answer questions.** `SAME_SOUND` (`questRounds.js:50-75`) omits every vowel team, split digraph and r-controlled family the trail teaches. Verified live draws: `ew` as distractor for `oo` cues, `are` for `air` (homophones), `y` against `ee` right after s16 teaches y=/ee/. The stops that teach same-sound spellings *together* (s26 oa/ow/oe, s27 oo/ue/ew, s32 or/aw/ore, s34 air/are) can serve a cue whose distractor says the identical sound — violating the file's own header rule #2.
- **F3 — HIGH: 44 of 60 heart words are never practised anywhere, yet all 60 are granted as "trickies" for finishing a stop.** Word-beast serves only `hearts[0]` (`questEncounters.js:430-434`); 10 stops with heart words don't even include the shell. `recordStopResult` grants every heart word unconditionally (`questProgress.js:355`). Reward fully decoupled from learning; no mastery records, so invisible to review scheduler and teacher heat map.
- **F4 — HIGH: the "two different days" anti-cram rule is measured in UTC and can be cleared in one real hour.** `dayOf` slices the UTC ISO string (`questMastery.js:114-116`); 5 correct at 23:30Z and 00:30Z — one sitting — flips a record to `mastered`. Any child in the Americas crosses a UTC "day" mid-evening.
- **F5 — MEDIUM-HIGH: post-teach taps count as full mastery evidence; Trail Run timeouts recorded as knowledge failures.** After the TEACH step shows the answer, the re-asked correct tap records identically to independent recall; the declared `independentCorrect`/`maxPromptLevel` contract (`questMechanicMatrix.js:73-79`) is dead code. Trail Run timeout fires `onBeat(false)` — slow-but-accurate children accrue mastery misses for hesitation.
- **F6 — MEDIUM: unsupported double consonants make segmenting shells teach the wrong phoneme count.** `MULTI_GRAPHEMES` has only ff/ll/ss/zz (`questSegments.js:21-29`): happy → h|a|p|p|y (5 planks, 4 phonemes). In Echo Cave the child must tap letters representing no phoneme. Also `jumped` gets a silent-e plank.
- **F7 — MEDIUM: 16 taught graphemes are silent**, removing the *only* mechanic that can teach alternative pronunciations — the entire alt strand has no working lesson (`NEEDS_AUDIO`, `questSequence.js:46-49`; alt sort gated at `questEncounters.js:419-425`).
- **F8 — MEDIUM: pronunciation-incoherent word lists at four stops.** s21 mixes /juː/ and /uː/; s36 bundles three `ure` pronunciations; s40 includes "question" (-tion ≠ /ʃən/); s38 teaches suffix -s/-ed with no distinction of their 2–3 sounds; s10 mixes voiced/unvoiced th.
- **F9 — MEDIUM: Trail Signs is visually gamed and produces zero evidence.** Only the *answer* gets the descriptor colour — solvable by odd-one-out without reading (`questRounds.js:410-414`); wrong tap advances with no ladder; `target: null` means no comprehension evidence.
- **F10 — MEDIUM: three divergent mechanic vocabularies**; 22 of 40 rotation mechanics have no evidence contract; several claimed evidence domains are un-producible by their recipes (`questMechanicMatrix.js` vs chapter rotations vs `questPhysicalMechanics.js:5-15`; validator only checks stops).
- **F11 — MEDIUM: retired-sound resampling is "everything, on four stops"** — box-5 due-ness is `stopIndex % 10 === 0` (`questReviewScheduler.js:57`); 30 retired sounds go due simultaneously and crowd out struggling sounds; `BOX_INTERVALS[5]` is dead.
- **F12 — MEDIUM: teacher-facing truth corrodes** — `hw:` records can never satisfy `minShells: 2`, so every met heart word sits permanently in "needs re-teaching" and steals review slots; raw ids ("hw:the") leak into guidance strings; the third grapheme in 3-grapheme stops is never sorted (`i += 2` pairing, `questRounds.js:305`).
- **F13 — POLISH: teach moment underuses its content** (examples computed but not rendered; jargon labels like "suffix–s"; first story page at s17 though decodable sentences exist from ~s3).
- **F14 — POLISH: reward floor** — the correction ladder guarantees ≥1 star; a guess-everything child banks ~48 sparks/stop vs ~72 for a perfect reader.

### 10 Suggestions

1. **Complete the same-sound map so no round ever has two defensible answers** (F2).
   **Fix:** In `src/utils/questRounds.js` extend `SAME_SOUND` (lines 50-75) with symmetric entries: `oa/ow/oe/o_e`, `oo/ue/ew/u_e`, `a_e/ai/ay`, `e_e/ee/ea/y_ee/y`, `i_e/igh/ie/y_ie/y`, `ou/ow_ou`, `air/are`, `or/ore`, `c_s/s/ss`, `g_j/j`, `ch_k/k/c/ck`, `ea_e/e`. Add a unit test enumerating every taught grapheme pair sharing a phoneme class asserting `sharesSound`; add a playthrough assertion that no built round's `choices` contain two members of one class. `y` needs special care: after s16 it legitimately spells /ie/ and /ee/, so exclude it from distractors for all long-i/long-e cues from s16 onward.

2. **Guard Sound Sort against words containing both pen graphemes — eliminates the s10 soft-lock** (F1).
   **Fix:** In `buildSoundSortRounds` (`questRounds.js:303-319`), remove any word whose segmentation contains *both* pen graphemes; assert `wordsA ∩ wordsB = ∅`. Belt-and-braces: key `sorted` by item index in `SheepPens` (`Encounters.jsx:497-518`) and add a skip/complete fallback so no content bug can ever hard-block the path. Add a `checkQuestIntegrity.js` rule failing the build on overlapping sort words.

3. **Give every heart word a real practice loop, and stop granting trickies for free** (F3, F12).
   **Fix:** (a) `questEncounters.js:430-434`: serve *all* of a stop's heart words as separate word-beast beats (cap at response budget, overflow to next stop's review). (b) Add `word-beast` to the shells of s15, s16, s23, s24, s25, s26, s28, s29, s31, s32 in `questSequence.js`. (c) `questProgress.js:355`: move a heart word into `trickies` only when it has ≥1 correct `hw:` record — the fiction says "feed it three times and it JOINS you"; make the save file tell the same truth.

4. **Make `hw:` mastery reachable and stop heart words stealing review slots** (F12).
   **Fix:** Route `isHeartTarget(target)` to dedicated `HEART_RULES` (`{minCorrect:3, minAccuracy:0.75, minShells:1, minSessions:2}`) in `questMastery.js` — word-beast is legitimately the only sight-word shell. Until word-beast serves review hearts, filter `isHeartTarget` out of `dueTargets` (`questReviewScheduler.js:94-101`). Render "the" not "hw:the" in `questReport.js` `tileLabel`.

5. **Anchor "two days" to the child's real life, and split assisted vs independent evidence** (F4, F5).
   **Fix:** (a) `questMastery.js:114`: derive day from local time, or require `sessions` entries ≥12h apart (keep both). Test: 23:30→00:30 same-evening play must not satisfy `minSessions`. (b) Add `promptLevel` (0=independent, 1=narrowed, 2=guided/post-teach) to `recordQuestAttempt` and the encounter call sites; only `promptLevel===0` corrects fill shells/sessions/accuracy numerator — activates the declared `EVIDENCE_RULES.recognition.maxPromptLevel`. (c) Tag Trail Run timeouts (`reason:"timeout"`) and exclude from the knowledge window while logging as fluency telemetry.

6. **Teach the remaining double consonants, or keep double-words out of segmenting shells** (F6).
   **Fix:** Add `bb,dd,gg,mm,nn,pp,rr,tt` to `MULTI_GRAPHEMES` (`questSegments.js:21-29`) and to s7's teach list as `kind:"double"` (same floss-rule lesson, zero new sounds) → happy = h|a|pp|y. If no audio, treat like blends (component phonemes). Until then, filter words with untaught doubling out of Echo Cave specifically; segment `-ed` as a morph unit (the trail owns `suffix_ed`) so `jumped`'s silent-e plank disappears.

7. **Close the Act III audio gap with a fallback that preserves the lesson** (F7).
   **Fix:** Short term: allow alt sorts to run on *word* audio alone — replace the pen-cue requirement (`questEncounters.js:419-425`) with anchor-word cues ("the pen for words like *snow*") needing only `hasWordAudio`; render `entry.examples` in `Guide.jsx` as tappable anchor words so a silent grapheme is introduced inside a real word. Long term: record the 16 clips in `NEEDS_AUDIO` (the list doubles as the request manifest; `checkQuestIntegrity.js:113-120` auto-detects arrival). Prioritise the 8 alts + `air/are/ear/ure/le/tion`.

8. **Make every word list pronunciation-honest** (F8).
   **Fix:** s40: replace "question" with a /ʃən/ word ("lotion", "portion", "caution"). s36: split — keep pure/cure as /jʊə/; drop or re-pattern -ture words. s21: keep purely /juː/ (move rude/June/flute to s27) or add a `u_e` vs `oo` sortPair. s38: add sortPairs for -s (/s/ vs /z/) and -ed (/t/ vs /ɪd/). s10: bias to unvoiced th or add a guide note. Extend `checkQuestIntegrity.js` with a pronunciation-class lint per stop (small curated exception table is fine).

9. **Rebuild Trail Signs as real comprehension** (F9).
   **Fix:** In `buildTrailSignRounds` (`questRounds.js:371-418`): assign colours/sizes to **all** things (≥2 sharing the answer's colour so colour alone can't solve it), render size (scale SVG), give the encounter the standard correction ladder instead of one-tap-and-advance (`Encounters.jsx:649-657`), and tag misses against a namespaced `sign:` comprehension target so the teacher report sees instruction-reading failures.

10. **One mechanic vocabulary, honest evidence claims, richer teach moments** (F10, F12, F13).
    **Fix:** (a) Make `questMechanicMatrix.js` the single registry: add the 22 missing rotation mechanics + 4 runtime ids, delete/alias the 3 unused entries, extend `validateMechanicMatrix` to cross-check chapter rotations and the runtime map so drift fails `check:quest`. (b) Downgrade claims recipes can't meet (`reading-finale`, `path-memory` shouldn't claim STORY_COMPREHENSION without a real page). (c) Friendly labels in `displayGrapheme` ("–s","–ing"; "y like in fly"); add 1-2 story pages around s8 using only taught words ("I sat on a mat." is decodable from s3). (d) Fix the `i += 2` pairing so the odd third grapheme gets a sort round; make box-5 sampling per-target (`(stopIndex + hash(target)) % 10 === 0`) so retired sounds trickle back instead of mobbing every tenth stop — or delete the dead `BOX_INTERVALS[5]`.

---
---

# 2. Gameplay & Mechanics Logic

### Key findings (severity-ranked)

- **1 — HIGH: four stops teach 8 alternative pronunciations with zero practice anywhere.** Every alt sort round is dropped by the audio gate (`questEncounters.js:419-425`; `altPronunciationSrc` always returns `""` — `questAudio.js:107-109`); alts are also excluded from letter encounters and word coverage. Simulated: s16, s28, s29, s37 survive 0 sort rounds; those stops collapse to 2-response walks.
- **2 — HIGH: the word-cue audio fallback is discarded in the physical path — 8 late graphemes (`aw, ore, air, are, ear, ure, le, tion`) play no sound and earn no mastery.** `buildAudibleLetterRound` builds `cue:{kind:"word"}` correctly (`questEncounters.js:453-467`) but the flower-patch/hungry-beast/trail-run branches hardcode `audioCue:{kind:"grapheme"}` (`questPhysicalMechanics.js:1254, 1269`), so `stageCueAvailable` is false and `physicalStageRecordsMastery` returns false. The Act III climax can never be mastered through the live field-task path.
- **3 — HIGH: blend stops don't practise most of what they teach, and blend teach buttons are dead despite available audio.** Word coverage capped at 3 (`wordsFor`, `questEncounters.js:472-477`); s15 covers 3/7 blends. Teach buttons gate on `hasGraphemeAudio(blend)` (always false) instead of `blendCandidateSrcs` which resolves both component clips for every blend (verified). `blendCandidateSrcs` and `altPronunciationSrc` have zero callers.
- **4 — MED: the 2D/pixel action budget silently deletes encounters and beats; content differs per renderer.** Budget 8 stages (`questPhysicalPlan.js:30-62`) defers 44 beats across 20/40 stops; s26 loses its sort encounter entirely. QuestHub (default 3D) never budgets — same stop serves different content per renderer.
- **5 — MED: the star rubric punishes the correction ladder it ships with.** Every wrong pick increments the tally; a child who uses the intended retry→narrow→teach ladder lands at 0.60 → 1 star → 12 sparks instead of 36.
- **6 — MED: only the first heart word is ever quizzed, and all are awarded regardless** (`questEncounters.js:430-434`; `questProgress.js:355`); `hw:` records can never satisfy `minShells:2`.
- **7 — MED: story-rock serves page 1 of 2; six authored second pages are unreachable** (`questEncounters.js:443-445`; s17, s36–s40).
- **8 — MED: `island-loop` and `spiral` routes overlap themselves** — min cross-strand distance 0.3–0.43 units vs trail half-width 4.5; `routeProgressAt` (`questRouteGraph.js:300-304`) can snap progress between early/late strands (camera/heading/gate flicker on 6 of 8 chapters).
- **9 — LOW/MED: a large dead/dormant code layer hides three latent bugs** — `TrailWalk.jsx` (no importer), unreachable DOM encounter views, test-only `buildStop`/`buildGateRounds`. Inside: TrailRun idle timeout re-arms `onBeat(false)` forever (unbounded recorded misses vs a demote-after-2 rule), Signpost advances on wrong answers with no ladder, `THING_ART` lacks `cake` (s35's authored feature — invisible tappable).
- **10 — LOW: renderer seed divergence makes 2D/pixel replays deterministic** (`QuestTrail2D.jsx:133` omits `stopsDone.length` that `QuestHub.jsx:3057` includes) — the accessibility mode becomes the easier-to-memorise mode.
- **11 — LOW: 33 teach entries have ≥1 example word with no recording**; `u_e` and `tion` examples are 100% silent.
- **12 — LOW: `useCorrection` performs side effects inside a `setState` updater** (`Encounters.jsx:66-84`) — strict-mode hazard masked by the layer's dormancy.

### 10 Suggestions

1. **Play the word-cue fallback in the physical path** (finding 2).
   **Fix:** In `questPhysicalMechanics.js` `buildPhysicalTask`, replace the hardcoded `audioCue:{kind:"grapheme"}` at lines 1254 and 1269 with `audioCue: seedwakeAudioCue(beat)`. Then `aw/ore/air/are/ear/ure/le/tion` play their cue word, `stageSoundDelivered` becomes true, and mastery recording resumes for the entire final act. Add a unit test asserting `physicalStageRecordsMastery` is true for a `cue:{kind:"word"}` flower beat.

2. **Record the 8 alt clips, or give alts a silent-proof practice path** (finding 1).
   **Fix:** (a) Record `/audio/quest/alt/{y_ie,y_ee,oo_short,ow_ou,c_s,g_j,ch_k,ea_e}.mp3` — the gate re-enables the sorts with no code change. (b) Until then, stop announcing alts at teach time (filter `walk.teach` entries lacking audio in `buildWalk`) and add a derived fallback sort pairing each alt against its base using word clips only (pens labelled by example word, "snow" vs "cow").

3. **Wire blend audio into the teach phase and guarantee per-blend word coverage** (finding 3).
   **Fix:** In `Guide.jsx:52` and `QuestTrail2D.jsx:657`, enable blend buttons via `blendCandidateSrcs(sound.id)` (play components back-to-back per the design note at `questAudio.js:96-98`); in `wordsFor`, raise the cap for blend stops (`cap = Math.max(3, newBlendCount)`) or run two word encounters at s12–s15; add a test asserting every blend taught at a stop appears in at least one of that stop's words.

4. **Make the physical budget coverage-aware** (finding 4).
   **Fix:** In `budgetPhysicalSection`, reserve budget for one beat per *target*, never defer the only beat carrying a target; alternatively raise `QUEST_PHYSICAL_ACTION_BUDGET` from 8 to ~10 (sim shows this eliminates nearly all 44 deferrals). Apply the same budget (or none) in `QuestHub.jsx:3053-3064` so all three renderers serve identical content.

5. **Score stars on first-attempt-per-beat, not per-tap** (finding 5).
   **Fix:** In `QuestTrail2D.jsx` `answer()` and `QuestHub.jsx`'s tally site, count each beat once — record the first attempt's correctness for scoring (keep ladder attempts for mastery only), e.g. gate tally updates on a `firstAttempt` map keyed by `correctionKey`. The rubric's own comment ("rates PER-TARGET accuracy", `starRubric.js:1-3`) already describes this semantics.

6. **Quiz every heart word, and award Trickies for evidence** (finding 6).
   **Fix:** One word-beast beat per declared heart word (`questEncounters.js:430-434`, cap 2–3, prefer due `hw:` records); grant a Trickie in `questProgress.js:355` only for heart words with a correct record at this stop (or define a 1-shell heart-word bar and grant on `meetsMasteryBar`). At minimum, fix the false design comment at `questRounds.js:238-242`.

7. **Serve both story pages** (finding 7).
   **Fix:** `questEncounters.js:443-445`: use `beats: rounds` instead of `beats: [rounds[0]]` (2 beats stays within the walk budget asserted in `questPlaythrough.test.js:100-113`); the story-choice physical task already iterates stages per beat.

8. **De-conflict overlapping route topologies** (finding 8).
   **Fix:** Adjust `island-loop`/`spiral` control points in `questRouteGraph.js` `ROUTE_TEMPLATES` so cross-strand distance stays ≥ 2× trail half-width; and/or make `routeProgressAt` strand-aware via an expected-progress hint so snaps can't teleport between strands. Add a geometry test asserting min cross-strand distance per topology.

9. **Delete or reintegrate the dormant DOM layer** (findings 9 & 12).
   **Fix:** Decide once: either remove `TrailWalk.jsx`, the unreachable DOM branches of `Encounters.jsx`, and test-only `buildStop`/`buildGateRounds`; or reintegrate them — in which case first fix the TrailRun idle-miss loop (cap laps at 2 then auto-teach), Signpost advance-on-wrong (route through `questCorrection`), add `cake` to `THING_ART`, and move `useCorrection`'s side effects out of the `setState` updater.

10. **Unify renderer seeds and backfill teach-example audio** (findings 10 & 11).
    **Fix:** Add `state.trail.stopsDone.length` to the seed at `QuestTrail2D.jsx:133` so retries vary in every renderer; record the 33+ missing example words (prioritise `u_e` and `tion` — 100% silent) or filter examples through `hasWordAudio` in `buildWalk` so teach never shows a word it can't say.

---
---

# 3. UI/UX — Hub, Navigation & Screens

### Key findings (severity-ranked)

- **1 — HIGH: a child cannot leave an active encounter in the 3D hub (dead end).** The only exit disappears (`{!active && <header className="qh-hud">}`, `QuestHub.jsx:4764-4765`); app-level Close is hidden during encounters (`quest.css:173-176`); no encounter panel exposes quit. The other two renderers keep always-visible exits (`QuestTrail2D.jsx:574-575`, `QuestPixelWorld.jsx:669-672`).
- **2 — HIGH: first-run onboarding is five text-navigation steps before the first phonics moment, with zero spoken guidance.** Hatch → Den (text CTA "Open Trail Map") → Map → 3D world → discover tap-to-walk → guide → first encounter. Neither Den nor Map plays or speaks anything (`DenScreen.jsx:9-17` imports no audio utilities).
- **3 — MED: three renderers, three exit controls, two movement schemes — and the device can silently switch a child between them mid-session** (adaptive quality downgrade at `QuestRoot.jsx:409-418` with only a 4.2s text notice).
- **4 — MED: the per-stop reward moment is a small auto-dismissing toast; the code's own design comment says it should be a celebration.** `q-trail-notice` vanishes after 4200ms, `pointer-events:none`; `RewardScreen.jsx:1-9` states the intent ("one per sound, one per stop… deliberately high density") but it only renders for chapter ceremonies.
- **5 — MED: "Continue the trail" does not continue the trail** (lands on the map — `QuestRoot.jsx:610-621`); the Trading Post's only exit is a ghost button at the bottom of a scrollable column, breaking the back-button pattern.
- **6 — MED: the primary "what do I do next" control looks like a status card and can render empty** (`.qh-next-call`, 14px translucent, no min-height, clickable but nothing signals it; can render an empty `<button>` — `QuestHub.jsx:4875-4877`; `QuestHub.jsx:4619` can render literally nothing with no exit).
- **7 — MED: the declared touch-target floor is violated by the Den chrome the child uses most** (`.q-den-links .q-ghost` 44px, `.q-settings-button` 44px, `.q-exit` 44px vs the stylesheet's own 56/64px mandate, `quest.css:178-195`).
- **8 — MED: the big objective prompt erases itself after ~2.6s** (`qh-task-dismiss`, `quest.css:2865`); the replay button only replays audio — it can't bring the dismissed panel back.
- **9 — LOW: four bare, inconsistent loading strings** with nothing for a pre-reader to look at.
- **10 — LOW: double-tap on a map stop double-fires world entry** (`TrailMap.jsx:87-95`, no re-entry guard); two toasts share one screen corner; dead `.qh-mission` CSS; unexplained `.q-map-review` margin.
- **11 — LOW: adult prose in child-facing prime space; the Guide's one instruction sentence is never spoken** (only grapheme audio auto-plays, `Guide.jsx:33-35,44`).

### 10 Suggestions

1. **One persistent exit, same position, on every screen and every renderer — including mid-encounter.**
   **Fix:** In `QuestHub.jsx`, hoist the leave control out of the `{!active && …}` guard at line 4764 (compact "← Den" top-left, reusing `leaveWorld`; quitting already checkpoints via the unmount save, so no progress-loss risk). Standardize all three renderers on the same icon+label+corner (`QuestHub.jsx:4765`, `QuestPixelWorld.jsx:670-672`, `QuestTrail2D.jsx:575`). Keep `.q-exit` hidden during encounters so there is still exactly one door.

2. **First-run express path: hatch → straight into trail 1, with spoken wayfinding.**
   **Fix:** In `QuestRoot.jsx`'s creator `onDone` (line 677), when unhatched-with-no-stops-done, call `enterWorld` directly with the first unfinished stop instead of routing to the Den. Add a spoken line on first world entry ("Tap the path to walk to me.") via the existing speech infrastructure, plus a bouncing tap-hand at the path start until first movement.

3. **Restore a real per-stop reward beat: 2–3s creature celebration, then keep walking.**
   **Fix:** In `QuestRoot.jsx` `handleFinish` (453-535), replace/augment the toast for the non-chapter path with a lightweight overlay (new `TrailCheer.jsx` or `RewardScreen compact` prop): creature + earned stars animating in (reuse `.q-star` and `ConfettiCelebration`), new gear appearing on the creature, ~2.5s, tap-to-dismiss. Keep the text toast for details but extend to 6s and stack it clear of `q-runtime-notice` (`quest.css:1367-1383` → `bottom: 96px`).

4. **Make the next action one huge, obviously-pressable, self-explanatory control.**
   **Fix:** Restyle `.qh-next-call` (`quest.css:2818-2840`) to primary treatment: min-height 64px, min-width ~220px, gold-pill look, ▶ glyph, 18-20px label, gentle pulse. Render it only when it has content (guard `QuestHub.jsx:4875-4877`); replace the bare `return null` at `QuestHub.jsx:4619` with a fallback screen containing a working exit.

5. **Fix post-ceremony momentum: "Continue the trail" should enter the next trail; normalize the Trading Post exit.**
   **Fix:** In `continueAfterCeremony` (`QuestRoot.jsx:610-621`), if `ceremony.nextStop` exists, `enterWorld` directly into it; keep the map only when the journey is complete; relabel the fallback "Back to the map". Move the Trading Post back button (line 252) into `.q-post-head` top-left, matching `TrailMap.jsx:105`.

6. **Write and enforce a cross-renderer UX contract for exit, movement, and teach panels.**
   **Fix:** Add a contract section to `shells/shellContract.js`: (a) exit = "← Den" top-left, always visible, all three worlds; (b) on coarse-pointer devices show the pixel world's D-pad pattern in the 3D hub too (extract `qp-dpad` into a shared component feeding the same `keys` set, `QuestHub.jsx:3868-3871`); (c) align teach copy and auto-play between pixel's compact cue and `Guide.jsx`.

7. **Enforce the 56/64px touch floor mechanically, starting with Den chrome.**
   **Fix:** `.q-den-links .q-ghost` 44→56px/15px (`quest.css:305`); `.q-settings-button`/`.q-settings-close` 44→48px (`quest.css:276-287`); `.q-exit` 44→48px (`quest.css:162-163`); `.qh-semantic-choices button` 54→56px (`quest.css:2687-2688`). Add a regression assertion so new chrome reuses `.q-ghost`/`.q-primary`.

8. **Keep the objective on screen until the child acts; replay should restore it, not just re-say it.**
   **Fix:** Drop `qh-task-dismiss` from `.qh-field-hud` for `is-teach` and `is-story` modes (`quest.css:2865`). Make the `qh-objective-cue` click re-mount the field HUD (add a `cueNonce` to the HUD `key` at `QuestHub.jsx:4899`, incremented in `cuePhysicalTask`).

9. **A loading screen a 4-year-old can watch: character, motion, one consistent sentence.**
   **Fix:** Shared `QuestLoading` component replacing the four strings (`QuestRoot.jsx:759/775`, `QuestHub.jsx:4715`, `QuestPixelWorld.jsx:724`): the child's `CreatureFigure` walking in place + animated dots + one caption "Opening the trail…"; a "First visit takes a little longer" variant on cold loads.

10. **Harden the small flows: map double-tap guard, toast stacking, dead CSS, spoken guide line.**
    **Fix:** (a) `TrailMap.jsx:87-95`: early-return when `walkingStop` set, clear the prior timer, disable stop buttons while walking. (b) Remove `.q-map-review { margin-right: 88px }` (`quest.css:3104`) and the orphaned `.qh-mission` block (`quest.css:2781-2799`). (c) Speak the Guide's instruction on mount (`Guide.jsx:33-35`) and align its label with the pixel world's "New sound". (d) Demote the map's gold "Practise sounds" to `.q-ghost` so the pulsing next-stop marker is the single brightest CTA.

---
---

# 4. Graphics, Rendering & Visual Polish

### Key findings (severity-ranked)

- **1 — HIGH: the CANVAS pixel tier re-draws dozens of vector Graphics objects every frame on the devices least able to afford it.** The config forces `Phaser.CANVAS` (`questPixelRuntime.js:5631`) for weak devices, yet static backdrops (chapter terrain 2604-2782, stop ground 1688, pond 1630, lanterns/shrine, decor 4333-4462, memory panel 5104) and per-encounter art are all re-tessellated Graphics — never baked via `generateTexture()` despite precedent (`createGroundCanvas`, 401-497).
- **2 — HIGH: the 64-frame beastie sprite sheet is re-rendered on the main thread at every stop mount, then again on the reward screen.** `createPixelBeastieSheet` (`questPixelAvatar.js:739-758`) renders 4×16 frames with per-frame layout + `new Path2D` per shape, plus a full 1024×256 `getImageData` posterize loop — no memoization. Runs inside the effect that destroys/recreates the entire `Phaser.Game` per stopId, and is duplicated in `RewardScreen.jsx:31` with a PNG encode on top.
- **3 — HIGH: `handleResize` tears down and rebuilds every choice mid-encounter on routine iOS URL-bar resizes** (`questPixelRuntime.js:4206-4227` → `rebuildChoices` destroys all choice containers; no zoom-bucket check or debounce — tap targets can be destroyed under a finger).
- **4 — HIGH: retina tablets get an upscaled, shimmering pixel world** — no `resolution` in the Phaser config (renders at CSS pixels, browser upscales) + non-integer camera zoom (1.34–2.52) fighting `roundPixels: true` → texel crawl as the camera lerps.
- **5 — MED: the 3D tier rebuilds the full physical task object and allocates vectors every rendered frame** (`QuestHub.jsx:3856-3863` calls `buildPhysicalTask` in the render loop; `new THREE.Vector3` per character per frame, `questAssets.js:246`). The pixel tier already memoizes the identical task (`QuestPixelWorld.jsx:169-172`).
- **6 — MED: three different letter-rendering systems show children three different alphabets** — hand-drawn 5×7 pixel glyphs (single-story a/g), Verdana labels (double-story a), Arial Black runes, plus the app font in 3D DOM panels. In a phonics product, letterform consistency is pedagogical. Label sizes drop to 9px at world scale.
- **7 — MED: infinite 360° rotation tweens run on Graphics objects** (`questPixelRuntime.js:4646, 4572`) — the most expensive possible animation on the canvas renderer, and it blurs pixel art.
- **8 — LOW: a full dead render pipeline plus two large unreachable branches** — `TrailWalk.jsx`/`WorldScene.jsx`/`Prop.jsx`/`Props.jsx` orphaned; `questPixelRuntime.js:2023-2330` and `3345-3556` unreachable (all 40 stops ship scenery anchors); dead `dino`/`moonwood` branches in `createRestoredMoments`.
- **9 — LOW: three art styles with unreconciled palettes and pixel densities** — Den meadow pastel `#bfe8f4` vs pixel meadow dark `#244f43`; 64px-frame residents beside legacy 16px-frame ones at 1.62 scale; no single palette source of truth.
- **10 — LOW: unguarded texture access and per-frame allocation churn** — `createGroundCanvas` calls `textures.get(...).getSourceImage()` with no existence check (one 404 collapses the tier to 2D); per-frame allocations in `updateMovement` helpers.

### 10 Suggestions

1. **Bake every static Graphics object into a texture once, then destroy the Graphics.**
   **Fix:** In `questPixelRuntime.js`, after building each static backdrop, `graphics.generateTexture(key,w,h)` + `scene.add.image(...)` + `graphics.destroy()` for `createChapterTerrain` (2604-2782), stopMap ground (1688), pond (1630), lanterns/shrine (2807, 2929), memory-story panel (5104) — or bake terrain straight into the existing offscreen canvas in `createGroundCanvas` (401-497). Convert per-encounter `art`/`labelPlate` shapes to shared generated textures keyed by shape id. Biggest CPU win on the weakest classroom hardware.

2. **Cache beastie sheets by creature signature at module level.**
   **Fix:** In `questPixelAvatar.js`, a `Map` keyed by `JSON.stringify(normalizeCreature(creature))` storing the finished canvas; reuse from `createPlayerTexture` (`questPixelRuntime.js:1528-1537`) and `RewardScreen.jsx:31` (cache the `toDataURL` too). Hoist `layoutCreature` out of the 64-frame loop where pose-independent; reuse one Path2D factory; posterize once into a reused ImageData.

3. **Gate `handleResize` on actual zoom-bucket change and debounce it.**
   **Fix:** In `questPixelRuntime.js:4206-4227`, store last applied zoom; skip `rebuildChoices`/`zoomTo` when `|Δzoom| < 0.025` or when only height changed by a small threshold (the URL-bar signature); debounce ~150ms; guard `rebuildChoices` against running while an answer tween is in flight.

4. **Adopt an explicit DPR/zoom strategy for the pixel canvas.**
   **Fix:** Set `resolution: Math.min(devicePixelRatio||1, 2)` in the Phaser config (`questPixelRuntime.js:5627-5653`) — or enforce an intentional 1× with integer zoom steps; snap `questPixelCameraZoom` (`questSliceSystems.js:528-543`) to stable steps (increments of 0.25) and quantize camera scroll to texel boundaries in the follow lerp.

5. **Memoize the physical task in the 3D render loop and hoist per-frame allocations.**
   **Fix:** `QuestHub.jsx:3856-3863`: cache by `encounter.id + beatIndex + fieldStage` (mirror `QuestPixelWorld.jsx:169-172`). Module-level scratch `THREE.Vector3` in `questAssets.js:246`; precompute `routeSamples` once in `treeLayout`; cache filtered lists in `questPremiumRender.js:276`. Same pass in the pixel tier: memoize `authoredPixelRouteCenters` and `activeVerbProfile()`.

6. **Unify letter rendering to one system per surface, matching the app font's infant letterforms.**
   **Fix:** Render 2–4 char labels and runes (`questPixelRuntime.js:1053`) with the app's rounded font (webfont loader or pre-baked bitmap font), raise the 9px floor to ≥12px at world scale; extend `PIXEL_LOWERCASE_GLYPHS` to digraphs if pixel glyphs must remain for the smallest labels. Keep `Piece.jsx`'s live app-font rule as the documented cross-tier standard.

7. **Replace infinite angle-rotation tweens on Graphics with frames or pulses.**
   **Fix:** For "turn" motions (`questPixelRuntime.js:4646, 4572`), pre-render 4–8 rotation frames into a sprite sheet (using the suggestion-1 texture cache) and play as animation, or swap rotation for a scale/alpha pulse.

8. **Delete the dead render pipeline and unreachable runtime branches.**
   **Fix:** Delete `world/TrailWalk.jsx`, `WorldScene.jsx`, `Prop.jsx`, `Props.jsx`; remove `questPixelRuntime.js:2023-2330` and `3345-3556` (after their early returns); collapse the unreachable `dino`/`moonwood` branches in `createRestoredMoments`. Re-run `checkQuestIntegrity.js` as the safety net.

9. **Guard texture lookups so missing art degrades to flat fills, not a tier collapse.**
   **Fix:** In `createGroundCanvas` (411) check `scene.textures.exists(theme.groundKey)` and fall back to a solid fillRect in the theme base colour; same `textures.exists` guard before any `getSourceImage()`/frame access in scenery/decor builders.

10. **Reconcile palettes and resident pixel density behind one per-chapter source.**
    **Fix:** Introduce a per-chapter art manifest (extend `questPixelCast.js` or new `questChapterArt.js`) exporting palette + resident scale set; derive `CHAPTER_PIXEL_PROFILES`, `questWorlds.js` and `DenScreen.jsx` from it; normalize legacy residents to premium-density sheets (or rescale premium worldScale) so adjacent characters share one pixel granularity.

---
---

# 5. Audio, Speech & Sound Design

### Key findings (severity-ranked)

- **1 — HIGH: blend audio fallback is dead code; three stops teach their sounds in silence.** `blendCandidateSrcs()` (`questAudio.js:99-101`) has zero callers; 17 of 22 taught blends have no recording. s13 (4/5 silent), s14 (all 6), s15 (all 7) — "Listen to today's sounds" plays nothing.
- **2 — HIGH: alt-pronunciation audio is broken two ways, and the "self-reviving" gate can't revive.** `altPronunciationSrc()` points at `/audio/quest/alt/` but is never called; the pens gate checks `hasGraphemeAudio(pen)` whose `graphemeCandidates()` never looks in `/audio/quest/alt/` — so even after recording, the sort stays hidden, contradicting the documented contract and the playthrough test.
- **3 — HIGH: 81 of 430 decodable quest words (19%) have no recording, and bridge/cave beats are not gated on word audio** (`questEncounters.js:396-405`) — a pre-reader gets a segmenting task on a word they never heard. Heart word "I" is silent too.
- **4 — HIGH: no read-aloud anywhere for instructions, prompts, feedback, or story text** — in a mode for pre-readers. The convention exists elsewhere (`/audio/learn-games/instructions/{slug}.mp3`, `learnGamesAudio.js:178-194`) but no quest file imports it.
- **5 — MED: corrective phoneme cue plays simultaneously with the error buzz in 2D and pixel paths** (`QuestTrail2D.jsx:482,491-492`; `QuestPixelWorld.jsx:369,376-377`); the 3D path deliberately delays 820ms.
- **6 — MED: 26 letter-name recordings exist but nothing plays them** — `letterNameSrc()`/`sayLetterName()` dead despite the "we say both" design comment.
- **7 — MED: Sound Seekers has no sound on/off control and ignores the app's sound preference** — `App.jsx:8188-8191` renders `QuestRoot` with no `isSoundEnabled`; a child who muted the arcade gets full audio in the quest. Speech and SFX cannot be muted at all (only "Quiet soundscape" for music).
- **8 — MED: encounter mode makes music 6% louder during the most listening-critical phase** (`gameMusic.js:135-139`).
- **9 — LOW: pixel-world SFX are not ducked under phonics cues** (Phaser `playSfx` has no duck scale; the 2D path scales to 0.12).
- **10 — LOW: the Encounters fallback panels drop the word-cue substitution** (`FlowerPatch`/`TrailRun` ignore `beat.cue`, `Encounters.jsx:104-106,129`).
- **11 — LOW: feedback-SFX coverage gaps** — 2D drop pickup and memory visits silent; 2D gate finish has no fanfare; TrailRun timeout reuses the wrong-answer buzz; replay buttons are text-only.
- **12 — LOW: no autoplay-retry for speech cues** (`cuePlayer.js:57-63` drops blocked plays with no pointerdown retry); morph teach chips render raw ids ("suffix–s").

### 10 Suggestions

1. **Wire blend playback through the component-phoneme fallback.**
   **Fix:** Add `blendSrcs(id)` + `hasBlendAudio(id)` in `questAudio.js`; extend `sayGrapheme()` in `shellContract.js` to play components sequentially (~150ms gap) via a new `playCueSequence()` helper in `cuePlayer.js` when no blend clip exists. Export a `graphemeSrc(id) || hasBlendAudio(id)` check so `Guide.jsx:52`, `QuestTrail2D.jsx:657`, `QuestPixelWorld.jsx:707` and the `buildAudibleLetterRound` gate re-enable blend buttons automatically.

2. **Fix the alt-pronunciation resolver path so recorded clips can actually revive the alt lessons.**
   **Fix:** In `graphemeCandidates()` (`questAudio.js:43-59`), for ids matching `/^[a-z]+_[a-z]+$/` that aren't split digraphs, prepend `/audio/quest/alt/${g}.mp3` (or call `altPronunciationSrc(g)` in `graphemeSrc()`). One change makes the pens gate, teach chips, and the playthrough test behave as documented. Companion content task: record the 8 alt clips named in `questSequence.js:48`.

3. **Gate word-driven beats on word audio, with a grapheme-sequence fallback.**
   **Fix:** In `questEncounters.js:396-405`, prefer words passing `hasWordAudio` (filter the pool before `pickCovering`, falling back to unfiltered only when nothing audible exists). When a silent word must serve, synthesize the cue from its grapheme clips via `playCueSequence()`. Record/substitute the ~10 heart-word gaps ("I", cry, quit, brick…). Extend the pens-gate pattern test to bridges/caves.

4. **Move the corrective cue replay to after the error buzz in 2D and pixel paths.**
   **Fix:** `QuestTrail2D.jsx` `choose()` (480-510): wrap the `sayGrapheme/sayWord` at 491-492 in `setTimeout(…, 350)` guarded by the live stage key; same in `QuestPixelWorld.jsx:367-390`. Aligns all three renderers with the 3D path's proven scheduling.

5. **Add read-aloud for prompts, feedback, and guide lines using the app's instruction-voice convention.**
   **Fix:** Add `instructionSrc(text)` to `questAudio.js` (mirroring `hasRecordedSpeech`'s lookup) and `sayInstruction()` in `shellContract.js` (plays when a clip exists, silent no-op otherwise). Call it on stage mount beside cues, when feedback appears, on guide lines, gate and reward screens. Then record the ~20 fixed strings (a small closed set from `letterSoundPrompt`/`sequenceSoundPrompt` and `correctionPresentation`). Never fall back to browser TTS.

6. **Give Sound Seekers a real, persistent sound toggle consistent with the arcade.**
   **Fix:** Add `soundEnabled` to quest settings normalization, expose in `DenScreen.jsx`'s Comfort fieldset using the arcade's `SoundToggle` component, thread as `isSoundEnabled` in `QuestRoot.jsx`. Optionally seed from the learn-games setting so one preference governs both modes. All audio paths already accept `enabled` flags — this is wiring, not refactoring.

7. **Play the letter-name recordings in the teach moment.**
   **Fix:** In `Guide.jsx`'s chip handler and the 2D/pixel teach cue, after the phoneme finishes, queue `sayLetterName(sound.id)` via `playCueSequence()` (single letters only — `letterNameSrc` already guards). Phoneme first, name second; never simultaneous.

8. **Rebalance the encounter mix down instead of up, and duck pixel SFX under cues.**
   **Fix:** `gameMusic.js:136-138`: `GAME_AUDIO_MIXES.encounter.music` 1.06 → ~0.8. In `questPixelRuntime.js` `playSfx` (4684-4687): multiply volume by `questActionSfxMixScale()` — one line brings the Phaser path to parity with the 2D ducking.

9. **Close the autoplay/unlock gap for speech cues, and make blocked cues observable.**
   **Fix:** In `cuePlayer.js` `playCueAudio` (57-63), on `play()` rejection keep the cue as `pendingCue` and register a one-shot pointerdown/keydown replay (mirror music's `queueRetry`). Add a telemetry hook when a cue is blocked so silent sessions surface in teacher-facing data.

10. **Audio-polish pass: fill the silent feedback moments and give timeout its own sound.**
    **Fix:** (a) 2D drop pickup and memory visits → `playQuestActionSfx` discover cues (`QuestTrail2D.jsx:380, 328-340`); (b) 2D gate finish → `playCelebrationFanfare()` (`QuestTrail2D.jsx:561-565`); (c) TrailRun timeout → neutral "wait" entry instead of the wrong-answer buzz (`Encounters.jsx:197`); (d) speaker/♪ icon on "Hear it"/"Listen again" buttons for non-readers; (e) proper labels instead of "suffix–s" on morph teach chips.

---
---

# 6. State, Progress, Economy & Data Logic

### Key findings (severity-ranked)

- **1 — HIGH: teacher reset is undone by any open quest session.** `applyResetTombstone` wipes storage but the `lp-progress-hydrated` event carries no reset hint (`progressSync.js:258-288`); QuestRoot merges the now-empty stored state into the *pre-reset in-memory* state (union with empty = full pre-reset state) and re-saves/re-uploads it. A background tab silently resurrects everything the teacher just reset.
- **2 — HIGH: the hydrate race is only half-guarded — creature and accessibility settings are cloud-wins with no clock.** `creature: cloud.creature || base.creature` (`progressMerge.js:222`), `settings: cloud.settings || base.settings` (`:229`) despite the "last-write-wins" comment. Fresh device: a child hatches/customizes or a parent enables `reducedMotion` in the first minute; the stale cloud row then replaces both. Silently disabling `reducedMotion` is an accessibility regression.
- **3 — HIGH: zombie telemetry sessions permanently block session starts.** `beginQuestSession` no-ops whenever `telemetry.current?.id` exists (`questTelemetry.js:104-105`); the unmount effect never ends the session. Every later visit accrues onto a stale session (wrong mode/tier/stopId/startedAt) and writes one multi-day franken-session that device-acceptance evidence ingests.
- **4 — MED: `routeCursor` regresses on any replayed stop** (`questProgress.js:351` unconditional); replaying s5 while at s30 teleports Continue back to s6 in circuit 2, and fails the device-acceptance progress gate on the intended 40→1 wrap.
- **5 — MED: cross-device double-spend inflates both economies, silently** — `canBuy` only evaluated at purchase time; two offline devices spending the same balance both succeed; the merge unions both purchases and floors the negative to 0 with no record.
- **6 — MED: same ledger, different beasties on different devices** — `unionById` preserves arrival order; prefer-unowned hatching makes species depend on hatch order; once merged, collections diverge permanently (deterministic hashing was the design goal).
- **7 — MED: `stars`/`drops` normalized without clamps; the derived economy trusts them absolutely** — a tampered save (`stars:{s1:9999}`) flows into `earnedSparks` and buys out the Trading Post; unknown stop ids survive normalization.
- **8 — MED: teacher practice assignments ride a field the client echoes back upstream** — the child client queues its entire state (including the older `assignment`) on every save; incoming-wins server merge means a Thursday-night offline flush can erase a Friday assignment. Locally `assignment` survives only by accident of the `...state` spread.
- **9 — MED: hydrate merges cloud→local, then pushes the stale pre-merge queue over it** (`progressSync.js:275-283`) — a window where the cloud row is strictly worse than both sides.
- **10 — LOW: telemetry sessions grow without bound across merges; `saveQuestProgress` can throw into React** (no try/catch on `setItem`, unlike `progressSync.writeJson`) — the white screen the read path's comment explicitly fears.
- **11 — LOW: the acceptance harness fails on its own transitions** — `currentSurface` returns "unknown" during every Suspense load; one mid-load sample fails a 20-minute release run.
- **12 — LOW: dead and vestigial state** — `trail.cutscenesSeen` (no reader/writer), decorative `v:1` with no migrations, unreachable capability-downgrade branch in `questPerformance.js:141-143`, `emptyRecord()` omitting `lastStop`.
- **13 — LOW: edge cases** — mastery-merge `seen`-as-clock inverse case; welcome-egg `grant()` not idempotent (fast double-tap grants two); human-acceptance dedup key omits the participant.

### 10 Suggestions

1. **Make teacher resets stick — carry the tombstone through the hydrate event.**
   **Fix:** `applyResetTombstone` returns whether a wipe happened; include `resetApplied: true` in the `lp-progress-hydrated` detail. In QuestRoot's `handleHydrated` (206-217), branch on it: replace in-memory state with `normalizeQuestState(null)` (and reset `latestCheckpointRef`) instead of merging — forward-only merge must never be applied across a tombstone. Mirror in HollowPage/StudentHomePage. Add a handler-level test asserting pre-reset state cannot resurrect.

2. **Give `creature` and `settings` real last-write-wins clocks.**
   **Fix:** Add `creatureAt`/`settingsAt` ISO timestamps to quest state: initialize in `baseQuestState`, pass through normalize, stamp at the write sites (creature `onChange`/`onDone`, `updateDisplayMode`/`updateAccessibilitySetting`). In the merge, pick the later side, tie → cloud (backward compatible: old saves lack the fields → cloud wins).

3. **Rotate stale telemetry sessions instead of letting them go zombie.**
   **Fix:** In `beginQuestSession`, when `telemetry.current` exists and `lastActiveAt` is older than a staleness threshold (6h or a different local day), fold it into `sessions` with `reason:"recovered"` before beginning fresh. Belt-and-braces: `endQuestSession(stateRef.current, {reason:"unmount"})` in the unmount effect. Tests for both paths.

4. **Make `routeCursor` advance-only, and fix the acceptance gate that punishes the wrap.**
   **Fix:** In `recordStopResult` (`questProgress.js:351`), advance only when the completed stop is the one the cursor points at. In `evidenceChecks` (`questDeviceAcceptance.js:95`), drop the cursor comparison or accept a wrap (`finalStops > initialStops`). Pin advance-only semantics in the routeCursor tests.

5. **Make ledger merges deterministic (sorted) and flag — don't silently floor — cross-device overspend.**
   **Fix:** Sort both `unionById` implementations by `(at, id)`; also sort `purchases` at the top of `computeHollow` so legacy unordered ledgers hatch identically everywhere. When `spent > earned` after a merge, keep everything (never un-buy from a child) but surface an `overspent` flag in `questReport` so teachers see "sync conflict resolved generously". Add a two-device order-permutation test asserting identical hatches.

6. **Clamp and whitelist `stars`, `drops`, `stopsDone`, and `stones` at normalize time.**
   **Fix:** In `normalizeQuestState`: filter keys to known stop ids; clamp stars to [0,3], drops to [0,40]; filter `stones` to `isGraphemeTarget` and `trickies` to known heart words. Log the first correction via `errorLog.js` so tampering/corruption is visible.

7. **Stop the client from echoing `assignment` upstream; make it an explicitly managed field.**
   **Fix:** In `saveQuestProgress`, strip teacher-owned keys from the *uploaded* payload only (`const { assignment, ...uploadPayload } = next`) — first verifying the server merge treats a missing key as keep-existing. Locally, promote `assignment` to `baseQuestState` as `null` and validate its shape in `normalizeQuestState` (targets ≤ 6 strings, note ≤ 120 chars).

8. **Flush before you merge: reorder `hydrateCloudProgress`.**
   **Fix:** `await flushQueuedProgressWrites(session)` first (the device's own latest truth goes up), *then* fetch, tombstone, merge, cache, dispatch. Queued payloads can then never overwrite fresher merged data. Regression test: queued local write + divergent cloud row → after hydrate both sides hold the union.

9. **Bound merged telemetry and make the save path non-throwing.**
   **Fix:** Cap sessions inside the merge (`.slice(-80)` with a local constant cross-referenced to `questTelemetry.js:1`, plus a test asserting the two agree). Wrap `saveQuestProgress`'s `setItem` in try/catch like `progressSync.writeJson`; on failure still `queueProgressSave` so the cloud retains the progress.

10. **Harden the acceptance harness and sweep the dead state.**
    **Fix:** (a) `evidenceChecks`: tolerate transient unknowns (≤10% of samples). (b) Wire `cutscenesSeen` to actually skip seen cutscenes or delete it. (c) Replace decorative `v:1` with a real `MIGRATIONS` hook keyed on input version. (d) Delete the unreachable capability-downgrade branch and pass a real `webglAvailable` probe. (e) Include participant id in the human-acceptance dedup key; gate `grant(WELCOME_EGG)` on `welcomeEggWaiting` inside `grant` itself.

---
---

# 7. Accessibility & Mobile/Touch UX

### Key findings (severity-ranked)

- **1 — HIGH: no safe-area handling on top/left/right — notch/Dynamic Island overlaps critical controls.** The app opts into edge-to-edge (`viewport-fit=cover`) but only pads the bottom inset; `.q-exit` (`top:12px;right:12px`, `quest.css:160-161`), `.qh-hud` (`top:0`), `.qh-encounter-hud`, `.qp-header` all sit under sensor housings on notched phones in landscape.
- **2 — HIGH: nested interactive element inside a disabled button — the pen-sound replay is unreachable exactly when it matters.** In `Encounters.jsx:530-537` the pen is `<button disabled={!held}>` containing a `role="presentation"` span with `onClick` — browsers suppress clicks on descendants of disabled buttons, so a child can never hear the pen's sound *before* picking up a sheep.
- **3 — HIGH: pixel-world D-pad buttons ignore keyboard activation and have no hold-to-move** — `onPointerDown` only; Enter/Space does nothing; each tap is a single 42px step, so crossing a trail takes dozens of precision taps (motor barrier on the tier cheap school devices default to).
- **4 — HIGH: "Listen again" — the single most pedagogically important control — is a 30px ghost button** (`.q2d-cue > button`, `quest.css:3482-3488`, ~4.0:1 contrast on cream, worse over art) against the stylesheet's own 64/56px mandate.
- **5 — MED: answer-choice fallbacks are invisible until focused** (`.qh-semantic-choices` `opacity:0` + `:focus-within` reveal; `.qp-semantic-choices` parked at `left:-10000px`) — sighted motor-impaired children get no visible alternative; buttons are in tab order while invisible.
- **6 — MED: landscape phones clip content with no escape hatch** — `.q-root` fixed/hidden, map requires `min-height:520px` on small screens; a ~400px-high landscape phone simply cuts content off, no scroll, no rotate hint.
- **7 — MED: Stone Wall mastery state is color-only, tooltip-only, screen-reader-silent** (`DenScreen.jsx:116-118`: plain spans with `title`; `title` never appears on touch).
- **8 — MED: text drops to 9–11px on small screens** (`.qp-place span` 9px, `.q-map-stop strong` 10px, `.qh-place-name strong` 11px, ceremony labels 9px), several on translucent chips over sky art.
- **9 — MED: in-app "Reduce motion" doesn't reach confetti; `prefers-contrast` never auto-honored** — `ConfettiCelebration` only checks the OS query; high contrast exists only as an in-app toggle.
- **10 — LOW: CreatureCreator's tablist is a partial ARIA pattern** (no roving tabIndex/arrow keys/panel association, unlike TradingPost's full pattern); no `touch-action: manipulation` on shared button rules (double-tap zoom live during rapid kid-tapping).

### 10 Suggestions

1. **Pad every screen-edge control with all four safe-area insets.**
   **Fix:** `.q-exit` → `top: max(12px, env(safe-area-inset-top)); right: max(12px, env(safe-area-inset-right));`; add `padding-top: env(safe-area-inset-top)` to `.qh-hud` and `.qh-encounter-hud`; `.qp-header` → `top/left/right: max(12px, env(safe-area-inset-*))`, mirrored in the `max-width:620px` block.

2. **Fix the pen-sign replay in SheepPens.**
   **Fix:** Lift `.qw-pensign` out of the pen `<button>` (`Encounters.jsx:529-538`) into a real always-enabled sibling `<button aria-label="Hear the sound …">`; style to ≥44px. Never nest interactive elements; never put `onClick` on `role="presentation"` nodes.

3. **Make the D-pad a real button group: click activation + hold-to-move.**
   **Fix:** `QuestPixelWorld.jsx:726-731`: add `onClick={() => runtimeRef.current?.move(dir)}` alongside `onPointerDown`, and press-and-hold repeat (`setInterval(move, 180)` on pointerdown, cleared on up/cancel/leave and unmount). Ensure `:focus-visible` styling for `.qp-dpad button`.

4. **Promote "Listen again" to a first-class 56–64px control.**
   **Fix:** `.q2d-cue > button` → `min-height:56px; min-width:120px; background:#315f4d; color:#fffdf5; border-radius:8px` keeping the `:focus-visible` outline; raise `.qp-cue-icon` 44→48px for consistency.

5. **Give the semantic answer choices a visible on-ramp on touch.**
   **Fix:** Render a small always-visible "Show big answers" toggle chip in `QuestHub.jsx`/`QuestPixelWorld.jsx` adding an `.is-pinned` class that duplicates the `:focus-within` reveal rules; default pinned when `pointer: coarse`.

6. **Support landscape phones: allow scroll and drop fixed min-heights.**
   **Fix:** New `@media (max-height:500px)` block: `.q-map-v2-land` `min-height:340px`, `.q2d-task` `min-height:0`, `.q-map-v2`/`.q2d-root` `overflow-y:auto`; optionally a friendly rotate-hint banner in `QuestRoot.jsx` when `innerHeight < 420 && innerWidth > innerHeight`.

7. **Make the Stone Wall perceivable without color, tooltips, or sight.**
   **Fix:** `DenScreen.jsx:112-121`: render stones in a `role="list"` as `<span role="listitem" aria-label="${grapheme}: ${state}">`, and add a non-color state glyph (`★` mastered, `·` learning, hollow not-started) via `.q-stone::after`.

8. **Set a 12px floor for all child-visible text and solidify label chips.**
   **Fix:** `.qp-place span`→12px, `.q-map-stop strong`→12px, `.qh-place-token`→12px, `.qh-place-name strong`→13px, ceremony `small`→11px; raise chip backgrounds to ~0.92 opacity so text never sits on sky art at partial opacity.

9. **Unify reduced-motion and contrast with OS signals end-to-end.**
   **Fix:** Pass `reducedMotion` into `ConfettiCelebration` as a prop checked alongside its `matchMedia`; default `highContrast` to true when `prefers-contrast: more` matches on first run (Den toggle stays as override).

10. **Complete the CreatureCreator tab pattern and add `touch-action: manipulation` to game buttons.**
    **Fix:** Port TradingPost's roving-tabIndex + arrow-key handling (`handleTabKeyDown`) to `CreatureCreator.jsx:60-73` with `aria-controls`/`role="tabpanel"`; add `touch-action: manipulation` to the shared button rule (`quest.css:184-195`) and to `.q2d-choices button`/`.qp-dpad button`.

---
---

# 8. Code Health, Dead Code & Maintainability

### Key findings (severity-ranked)

- **H1 — HIGH: the mastery-writing orchestration is hand-copied into three renderers (proven bug farm).** The encounter run-loop (`answer`, `beginBeat`, `completeEncounter`, checkpoint payloads, review-queue resets) exists three times (`QuestTrail2D.jsx:342-401`, `QuestPixelWorld.jsx:226-419`, `QuestHub.jsx:4337-4361`). The copies already diverged once in a way that corrupted mastery evidence — the comment at `QuestTrail2D.jsx:347-350` records the "garbage keys like 's,a,t'" incident. 35 `checkpoint(` call sites, zero unit tests.
- **H2 — HIGH: a 636-line dead component island plus ~25 dead exports.** `TrailWalk.jsx`/`WorldScene.jsx`/`Prop.jsx`/`Props.jsx` have no live importer; their CSS survives in `quest.css`. Zero-consumer exports confirmed repo-wide: `TRAIL_GATE_Z`/`TRAIL_EXIT_Z`, compat aliases `buildHub`/`clampHubPosition`/`HUB_START`/`HUB_BOUNDS`, `unequipQuestGear`, `provenIn`, `MASTERY_STATES_REF`, `graphemeCandidates`/`blendCandidateSrcs`/`altPronunciationSrc`, `WALK_SPEED`, device/human acceptance leftovers. Empty duplicate dirs `tests/unit 2/`, `tests/smoke 2/`.
- **H3 — HIGH: `questPixelRuntime.js` is a 5,688-line god class** — `QuestPixelScene` spans ~4,519 lines with 60+ methods; `createStopMapComposition()` alone is 662 lines. The flagship renderer (auto mode always picks pixel) is the least navigable file in the mode.
- **M4 — MED: `QuestHub.jsx` is a 4,928-line, 91-hook component that automatic mode never reaches** (`resolveQuestQuality` returns pixel for every `auto` device) — ~6,200 lines of opt-in-only view code including a duplicate world model and its own copy of the H1 orchestration.
- **M5 — MED: copy-pasted helpers, one with a factually wrong justification** — `blendsIn` duplicated verbatim (`questRounds.js:38-46` vs `questEncounters.js:480-488`) under a stale "circularly" comment even though the module already imports 11 names from questRounds; `canonicalValue` byte-identical in both acceptance modules; `finite` triplicated.
- **M6 — MED: `questMechanicMatrix.js` is a test-only parallel source of truth** (only importer: `questBlueprint.test.js`) that can drift without any runtime symptom.
- **M7 — MED: coverage concentrated, not targeted** — pure utils well tested, but the triplicated run-loop (the code most likely to hurt a child) has none; `questRuntimeSystems.test.js` is a 98.5KB, 41-test mega-file mixing five concerns.
- **L8 — LOW: the "one palette file" rule has an enforcement loophole** — the check only matches `#`-hex, so the full numeric palette at `QuestHub.jsx:125-183` is invisible to it; the "exactly TWO data files" comment is stale.
- **L9 — LOW: half-finished hub→trail rename and stale architecture docs** — `questHub.js` calls itself "TRAIL" and exports trail names; `shellContract.js:5` cites a deleted owner (StopRunner).
- **L10 — LOW: teacher-facing label collision** — `tileLabel` renders split digraph `a_e` as "a", identical to short-a.

### 10 Suggestions

1. **Extract one encounter run-loop hook and make all three renderers use it.**
   **Fix:** Create `src/components/quest/world/useEncounterRun.js` — a reducer-driven hook owning `answer(correct,target,recordMastery)`, `beginBeat`, `completeEncounter`, `nextBeat`, the corrections map, review queue and checkpoint emission. Port `QuestTrail2D.jsx:342-536`, `QuestPixelWorld.jsx:226-419`, `QuestHub.jsx:4337-4600` onto it, leaving renderers only input and drawing. Start with the two ~740-line files to prove the API, then the 3D one.

2. **Delete the dead island and every zero-consumer export in one PR.**
   **Fix:** Delete `TrailWalk.jsx`, `WorldScene.jsx`, `Prop.jsx`, `Props.jsx` and their CSS selectors; delete `WALK_SPEED`, `TRAIL_GATE_Z`/`TRAIL_EXIT_Z`, the alias block (`questHub.js:478-482`), `unequipQuestGear`, `provenIn`, `MASTERY_STATES_REF`, the acceptance leftovers; unexport internal-only names; remove `tests/unit 2/`, `tests/smoke 2/`. Full unit suite must stay green.

3. **Split `questPixelRuntime.js` by concern into a `world/pixel/` folder.**
   **Fix:** Slim `questPixelRuntime.js` (~1,500 lines: scene + runtime factory); extract `pixelThemes.js` (WORLD_THEMES/CHAPTER_PIXEL_PROFILES), `pixelCanvases.js`, `pixelChoiceArt.js` (sprites/glyphs), `pixelScenery.js` (terrain/stop composition), `pixelCeremony.js`. No behaviour change; the 98.5KB runtime-systems test is the regression net.

4. **Split `QuestHub.jsx` and explicitly decide the 3D tier's future.**
   **Fix:** Move the ~30 module-level THREE builders and material helpers into `world/hub3d/hubBuilders.js`/`hubMaterials.js` (component under ~1,500 lines); consolidate inline reaction durations into named constants. Record a team decision: keep rich/balanced/low as supported tiers, or remove them from `QUEST_DISPLAY_MODES` and delete the tier.

5. **De-duplicate the shared helpers and correct the stale comment.**
   **Fix:** Delete the private `blendsIn` (`questEncounters.js:480-488`) and add it to the existing questRounds import; extract `finite`/`canonicalValue` into a small shared module imported by `questHub.js`, `questDeviceAcceptance.js`, `questHumanAcceptance.js`.

6. **Make `questMechanicMatrix.js` earn its place or delete it.**
   **Fix:** Preferred: have `questPhysicalMechanics.js` consume `mechanicPlanForStop` from the matrix so one table drives runtime and tests. Cheaper: move `validateMechanicMatrix` into `checkQuestIntegrity.js` as a build-time check and delete the data module.

7. **Unit-test the unified run-loop once, then point all renderer smoke checks at it.**
   **Fix:** After suggestion 1, add `tests/unit/questEncounterRun.test.js` driving the hook's reducer as a pure state machine (full encounter: correct, miss×3, teach-back, remediation, checkpoint save/restore; assert emitted `onAnswer` sequence and payloads — the "s,a,t" regression class). Split `questRuntimeSystems.test.js` into per-concern files.

8. **Close the colour-rule loophole.**
   **Fix:** Extend the hex regex in `checkQuestIntegrity.js:140` to also match `0x[0-9a-fA-F]{6}`; move the QuestHub palette into `questWorlds.js` as numeric values; update the stale comment and shrink `COLOUR_ALLOWED` to the true palette holders.

9. **Finish the hub→trail rename and scrub stale docs.**
   **Fix:** Rename `questHub.js` → `questTrail.js`, `QuestHub.jsx` → `QuestTrail3D.jsx` (family reads QuestTrail2D / QuestPixelWorld / QuestTrail3D); update `shellContract.js:5` to name the real owner. Same PR as suggestion 2 so the alias block never needs maintaining.

10. **Unify grapheme display labels between child and teacher surfaces.**
    **Fix:** Hoist `displayGrapheme` out of `shellContract.js:75-78` into a DOM-free module (`questLabels.js`) and use it in `questReport.js` `tileLabel` so `a_e` renders "a–e" and alt pronunciations keep their base label deliberately.

---

## Appendix — cross-area observations

- **The same root cause appears in three areas:** the alt-pronunciation audio gap (Educational F7, Gameplay finding 1, Audio finding 2) — one resolver fix + 8 recordings closes all three reports' top items.
- **The dead `TrailWalk.jsx` layer appears in three areas** (Gameplay finding 9, Graphics finding 8, Code Health H2) with mutually consistent advice: delete it; the latent bugs inside it (idle-miss loop, advance-on-wrong, missing cake art) only matter if it is ever revived — deletion resolves both.
- **Heart words appear in two areas** (Educational F3, Gameplay finding 6) with the same fix shape: serve all heart words as beats, award on evidence, give `hw:` a reachable mastery bar.
- **Three renderers is the structural theme**: triplicated run-loop (Code Health H1), divergent exits (UI/UX finding 1), divergent content budgets (Gameplay finding 4), divergent seeds (Gameplay finding 10), divergent audio timing (Audio finding 5). A shared contract module + the unified run-loop addresses the class, not just the instances.
