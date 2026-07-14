# Sound Seekers — Full Audit

**Date:** 2026-07-14
**Scope:** `src/components/quest/**`, `src/utils/quest*.js`, `src/data/questSequence.js`, `questWorlds.js`, `questChapters.js`, `creatureParts.js`, `tools/checkQuest*`, quest assets, and every integration point with the rest of the app.
**Method:** read every file in the area; executed the real `buildWalk` across all 40 stops; ran `npm test` and `npm run check:quest`; traced persistence to Supabase and back.
**Status:** audit complete; the production upgrade described below was implemented and verified on 2026-07-14.

## Production upgrade completed

This pass treated Sound Seekers as a flagship product surface and followed the project's standing standard: every system should be completed to the highest practical degree of effort and accuracy, then checked in the running game rather than accepted because it compiles.

- Eight authored five-stop chapters now cover all 40 curriculum stops, with distinct route topologies, cast, destinations, materials, weather, lighting, water, particles, and curated CC0 3D kits.
- The restored trail map, continuous non-finale handoffs, and in-world chapter relic ceremonies are connected to the live quest flow.
- Chapter relics retain cumulative in-world abilities, while Sound Seekers stars now contribute to the wider gems and Hollow coin economies.
- Free-roam review builds sessions from each child's weakest attempted sounds.
- Automatic rich, balanced, low-power, and accessible 2D display modes provide explicit and automatic fallback paths.
- Session telemetry records active time, mode, quality tier, answers, stops, and completion reason; teacher and family reports surface time-on-task, mastery, weakest sounds, trail progress, stars, and relics.
- The 3D runtime library is licensed, searchable, size-checked, and validated; desktop and mobile route renders receive pixel-level nonblank checks.

---

## Verdict

Sound Seekers is the most carefully-reasoned code in this repo. The mastery gate is honest, the review scheduler is real, the content check is genuinely adversarial, and the comments record *why* each decision was made — including the mistakes that forced them. That is rare and worth protecting.

It is also **shipping with its payoff screen, its map, its fluency mechanic, its long-term retention layer, and its reward gear all unreachable**, and it is **invisible to every teacher and parent in the product**.

The gates are green. `npm test` passes. `check:quest` passes. Every finding below is true anyway — because the gates check the content, and what is broken is the *wiring*.

The headline pattern: **this mode was rebuilt (v1 quiz → v2 walk) and the old surfaces were disconnected rather than removed.** Nearly every P0 is a thing that exists, works, and is simply not plugged in.

---

## Severity key

| | |
|---|---|
| **P0** | A child hits this. Ship-blocking. |
| **P1** | Undermines the mode's core claim (honest phonics) or its commercial value. |
| **P2** | Real cost — maintenance, performance, trust — but nothing visibly breaks today. |
| **P3** | Tidy-up. |

---

# P0 — A child hits this

### P0-1 · No WebGL fallback. On a device without it, the mode is a blank sky.
**Lens: coder, child, businessman** · `QuestHub.jsx:2188, 2272-2276, 2922, 2938`

If `new THREE.WebGLRenderer()` throws, the code sets `sceneError` → adds a `has-fallback` class → and does nothing else. There is no `.qh-fallback` rule in `quest.css` and no fallback branch in the JSX. The loading message is explicitly suppressed (`!sceneReady && !sceneError`), the render loop never starts, and the HTML landmark buttons are positioned by `projectElement` against a camera that never runs.

The child gets a static sky image, no message, and no way forward. On a school Chromebook with hardware acceleration disabled, an older iPad, or a GPU on a browser blocklist — all common in UK primary schools — **Sound Seekers is silently unplayable.**

Someone knew: `tools/checkQuestRouteVisual.mjs` asserts `.is-ready` *without* `.has-fallback`. The state was named. The fallback was never built.

> **The fix is cheap and already half-built.** `Encounters.jsx` is a complete set of DOM-based encounter views (FlowerPatch, HungryBeast, BrokenBridge, EchoCave, SheepPens, WordBeast, Signpost, StoryRock). It needs a non-3D navigation shell around it, not a new game.

---

### P0-2 · The reward screen and the map are dead code.
**Lens: designer, child, teacher** · `RewardScreen.jsx` (115 lines), `TrailMap.jsx` (132 lines) — **zero imports anywhere in the repo**

`QuestRoot.jsx:14-17` imports only `CreatureCreator`, `DenScreen`, `QuestHub`, `TradingPost`. `VIEW` (`QuestRoot.jsx:34`) has no map view and no reward view.

**There is no reward moment.** Finishing a stop calls `handleFinish` (`QuestRoot.jsx:130-157`), which *immediately teleports the child into the next trail* and shows a 4.2-second auto-dismissing toast (`QuestRoot.jsx:229-235`, timer at `:87-91`):

> Sunlit Meadow complete / Fern Steps ahead / 2 stars · 1 new stones · new gear

Everything in `RewardScreen.jsx:46-114` — the stars landing, the stones arriving on the wall, the creature wearing its new gear, and the honest *"No new stones yet. These sounds will come back."* — is unreachable. **The single biggest emotional payoff in the design ships as dead code, replaced by a toast that disappears while the next level is already loading.**

**There is no map.** The child cannot see the trail, cannot choose a stop, cannot revisit one. `DenScreen`'s only exit is `onWalk` → `nextAdventureId` (`QuestRoot.jsx:36-42`), which force-marches them to the next unfinished stop. All of `TrailMap.jsx` — acts, markers, per-stop stars, "Back to the Den" — is unreachable. For a 40-stop journey sold as a *trail*, the child can never see the trail.

*(Inherited bug: the toast says `"1 new stones"` — `QuestRoot.jsx:233` has no pluralisation.)*

---

### P0-3 · Gear is earned, announced, renderable — and can never be worn.
**Lens: child, designer** · `creatureParts.js:208-214`, `questProgress.js:139-143`, `QuestRoot.jsx:233`, `CreatureCreator.jsx:22`, `TradingPost.jsx:28`

Five gear items unlock free by walking stops s1–s5 (Leaf Cap, Acorn Hat, Moth Wings, Vine Scarf, Stone Staff). `ownedPieces()` grants them. The trail toast announces **"· new gear"**. The 3D rig can render all five (`QuestHub.jsx:1665-1717, 1831`).

**Nothing in the quest ever writes `creature.equipped`.** It stays `{head:null, back:null, neck:null, held:null}` forever (`creatureParts.js:254`). The only `equipped` writes in the codebase live in `HollowPage.jsx` — a *different* feature with a *different* ledger.

And there is no UI to write it from: `CreatureCreator.jsx:22` and `TradingPost.jsx:28` both filter to `kind === "part"`, which **excludes every gear slot** (`head`/`back`/`neck`/`held` are `kind: "gear"`).

So the child is told they earned a Leaf Cap. It is theirs. They can never put it on. This is the first reward the game gives — at stop 1 — and it is a lie.

---

### P0-4 · The server merge actively destroys the mastery data the client merge protects.
**Lens: coder, teacher, logic** · `supabase/FIX_DAILY_MISSION_MERGE.sql:53`, `supabase/migrations/20260614090000_progress_forward_merge.sql:28-90` vs `src/utils/progressMerge.js:77-95, 202-231`

`progressMerge.js` contains an explicit, correct, load-bearing explanation of why `phonics_quest` **cannot** go through the naive forward merge:

> *"mergeMonotonic would union the window (collapsing `[1,1,0,1]` to `[1,0]` and destroying the accuracy calculation) and let a string state be overwritten by whichever row arrived last."*

The server routes `phonics_quest` into exactly that naive merge. Concretely, on any two-device sync:

| Field | What the server does | Consequence |
|---|---|---|
| `mastery.*.window` | array-union + dedupe | `[1,1,0,1]` → `[1,0]`. **The 75%-over-last-4 accuracy calc is destroyed.** |
| `mastery.*.state` | last-write-wins | **A demotion can be silently undone.** The exact failure the client guards against. |
| `trail.routeCursor` | `greatest()` | Pins a second circuit at stop 40 forever — the client deliberately avoids this. |
| `ledger.purchases` | union by whole-object identity | Duplicate purchases when timestamps differ (client unions by `id`). |
| `checkpoint` | forward-merged | Client excludes it entirely — merging two checkpoints teleports a child mid-stop. |

The migration header claims it *"Mirrors that logic so the two never disagree."* For `phonics_quest`, it does the opposite. And `tests/unit/progressMerge.test.js` covers `learn_games`, `el_quest`, `story_quests`, `guided_reading`, `phonics_letters`, `daily_mission` — and **has no `phonics_quest` case at all.**

**Related:** `QuestRoot.jsx:61` snapshots localStorage once at mount and never listens for `lp-progress-hydrated` (every other progress surface does — `StudentHomePage.jsx:146`, `HollowPage.jsx:173`, `PhonicsLearnTab.jsx:86`). A child on a fresh device who taps Sound Seekers before the async hydrate lands will have their just-hydrated cloud save clobbered by the empty pre-hydrate state on first commit.

---

# P1 — Undermines the core claim

### P1-1 · The fluency mechanic does not exist. 15 stops declare it; it is never built.
**Lens: teacher, logic** · `questEncounters.js:45-59, 137-140`, `questSequence.js`, `questMechanicMatrix.js:66`

`ENCOUNTERS` maps 8 encounter kinds to their source shells. **There is no entry with `from: "trail-run"`.** So `FROM_SHELL` has no `trail-run` key, and `stop.shells.map(s => FROM_SHELL[s]).filter(Boolean)` **silently drops it.**

Verified by executing `buildWalk` across all 40 stops:

```
stops declaring 'trail-run':  15  (s5,s7,s8,s11,s13,s14,s15,s17,s20,s23,s25,s26,s29,s31,s33)
'trail-run' ever built:       false
encounter kinds ever built:   broken-bridge, echo-cave, flower-patch, hungry-beast,
                              sheep-pens, signpost, story-rock, word-beast
```

Trail Run is the **only mechanic in the game that trains automaticity** — recognition under time pressure, which is the difference between decoding and reading. `buildTrailRunRound` exists and is correct (`questRounds.js:317-328`). It is wired to nothing.

Worse: `questMechanicMatrix.js:66` still credits `trail-run` with `GRAPHEME_RECOGNITION` and `WORD_READING` evidence domains — so **`docs/SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md` overstates the coverage the game actually delivers.**

---

### P1-2 · The long-term retention layer never runs. `retire()` is never called.
**Lens: teacher, logic** · `questMastery.js:171-175`, `questReviewScheduler.js:14, 42, 57`

The review scheduler documents five boxes, and box 5 is the one that matters most for a year-long product:

> `box 5  sampled 1-in-10  retired (nothing is ever allowed to rot)`

**`retire()` is called from no production file** — only `tests/unit/questMastery.test.js`. So `MASTERY_STATES.RETIRED` is unreachable at runtime → `boxAfterStop` never returns 5 → `isDue`'s `stopIndex % 10 === 0` sampling branch never fires.

Mastered sounds cap at box 4 (due every 12 stops). Nothing is ever promoted out, and the documented "nothing rots" guarantee **does not exist**. A child who masters `s` at stop 1 and finishes the trail has their retention of it protected by a mechanism that was written, tested, and never switched on.

---

### P1-3 · No error correction. Half the encounters are brute-forceable.
**Lens: teacher, child, designer** · `Encounters.jsx:181-189, 249-256, 305-310, 368-376, 466`; `QuestHub.jsx:2862-2870`

When a child gets it wrong: a soft buzz, a red tint, a shake, and **the same question again with no new information**. There is no hint, no choice reduction, no teach-back after repeated failure, no adaptive difficulty anywhere in the mode.

`QuestHub.jsx:2809-2810` frames this as a virtue — *"A miss gets another friendly try at the same beat; there is no permanent failure"* — and the non-punitive instinct is right. But *"another try at the identical question"* is not correction. It is a locked door and a child rattling the handle.

Two further problems:

- **Brute-forceable:** `BrokenBridge`, `EchoCave`, `SheepPens`, `WordBeast` and the 3D field tasks all re-arm the same question indefinitely. A child can tap every option until one works. `Signpost` never reveals the right answer at all (no `is-reveal`, `Encounters.jsx:466`).
- **Mistake accounting is inconsistent:** bridge/cave fire `onBeat(!slipped)` **once** at completion (`Encounters.jsx:196, 263`) — twenty wrong taps count as one mistake. Field tasks call `answer(false, …)` on **every** wrong tap (`QuestHub.jsx:2868`), each writing a separate incorrect attempt into the mastery record. **The same behaviour is scored two different ways, and one of them corrupts the mastery signal the whole mode is built on.**

---

### P1-4 · The end of the curriculum is mute — including the finale.
**Lens: teacher, child** · `questSequence.js:46-49`, `questAudio.js`

78 of the 103 `teach` entries require a clip (blends and morphs correctly need none). **62 resolve. 16 do not.** The `NEEDS_AUDIO` list is exactly accurate — zero false positives, zero omissions, which is rare and means it can be trusted. But the *shape* of the gap is the finding: **all 16 land in the back half of Act III.**

- **s34 (Hare Hollow), s35 (Listening Rock), s36 (Creature Falls), s39 (Kettle Bridge), s40 (The Star Reach) teach ZERO audible graphemes.** s40 is the finale.
- **All 8 alternative pronunciations are silent.** `altPronunciationSrc()` resolves to `/audio/quest/alt/{id}.mp3` and **`public/audio/quest/` does not exist.**

That second one is the worst possible placement. The alts (`y_ie`, `y_ee`, `oo_short`, `ow_ou`, `c_s`, `g_j`, `ch_k`, `ea_e`) are the Sound Sort stops — s16, s28, s29, s37 — and `questSequence.js:57-59` states their entire pedagogical premise:

> *"No amount of looking at the letters tells you which sound they make — that is the entire lesson."*

**A child is asked to sort `snow` from `cow` by sound, with no sound available for either.** The one lesson that cannot be solved by looking is the one lesson delivered with no audio.

*(Also: `knownBadWordAudio.js` blocklists `"am"` — the **first word of stop 1**.)*

---

### P1-5 · Blends are taught with no example words.
**Lens: teacher** · `questRounds.js:121-129`, `Guide.jsx:64-67`

Verified by execution: **33 teach entries resolve to zero example words** — every blend at s12–s15 (`nd`, `st`, `mp`, `ft`, `sp`, `sn`, `sk`, `sm`, `sw`, `bl`, `cl`, `fl`, `gl`, `pl`, `sl`, `br`, `cr`, `dr`, `fr`, `gr`, `pr`, `tr`) plus the morphs and alts.

Cause: `wordsForTarget` selects words via `segmentWord(w).includes(target)`, and **a blend is never a segment** — which is correct, and is the same insight the rest of the file is built on. But the consequence is that the guide introduces `st` while showing the child **not one word containing `st`**. Four consecutive stops (12–15) introduce 22 blends this way.

*(Note: example words render correctly for real graphemes — `s1` gives `a → ["am","at","mat"]`. This is a blend-specific gap, not a dead feature.)*

---

### P1-6 · The mastery bar's own header contradicts the rule it sits above.
**Lens: coder, teacher** · `questMastery.js:9-13, 46-53, 68-75, 117`

The file header states the bar as:

> 1. `>= 8 correct responses`  2. `>= 85% accuracy over the LAST 10 attempts`

`MASTERY_RULES`, thirty lines below, is `{minCorrect: 4, minAccuracy: 0.75, accuracyWindow: 4}`. The header is stale (the change *is* explained at `:24-45`, but the top-of-file summary was never updated, and `:117` still says *"8/8 correct is not yet 10 attempts of proof"*). Anyone reading the header — the exact thing it exists to prevent — gets the wrong bar.

**And `BLEND_RULES` has a live bug.** Its comment says *"Four correct reads"*; the code says `minCorrect: 3`. But the real problem is the arithmetic: `accuracyWindow: 3` with `minAccuracy: 0.75` means `2/3 = 0.667` **fails**. So a blend requires a **perfect 3/3** in its window — a *stricter* bar than a grapheme (which passes at `3/4 = 0.75`). The comment argues blends deserve a *gentler* bar. The code gives them a harsher one.

---

### P1-7 · Sound Seekers is invisible to every teacher, parent, and admin.
**Lens: businessman, teacher, parent** · `exportReportSections.js:317-328`, `FinishedReportPage.jsx:995-1005`, `TeacherDashboardPage.jsx`

Nothing outside `src/components/quest/` and `src/utils/quest*` ever reads `phonics_quest`.

- `collectStudentEngagementAreas()` reads `daily_mission`, `learn_games`, `el_quest`, `story_quests`, `guided_reading`, `hollow`. **`phonics_quest` is absent.**
- The "Quest Stars" column in reports is fed from `el_quest` — **a different mode.** A teacher reading "Quest Stars" is not looking at Sound Seekers.
- `TeacherDashboardPage.jsx` renders zero quest data (one code comment, `:148`).
- **No time-on-task is recorded at all.** `baseQuestState()` has no timestamps beyond `mastery.lastAt`.

The data *reaches Supabase* and is never read back. `getCachedCloudProgressRows(studentId)` — the one function that could surface it — **has zero callers.**

This is the commercial finding. The mode's entire differentiator is *"we can prove this child actually learnt the sound, and Teach Your Monster cannot."* That proof is sitting in a JSON blob nobody can see. **The thing you built the mode to be able to say, you currently cannot say to a single teacher.**

`weakestTargets()` already exists, is tested, and its own comment says it *"powers the teacher dashboard's weakest five."* There is no such dashboard. The function is ready; the surface was never built.

---

### P1-8 · Zero telemetry, and the one event it fires is mislabelled.
**Lens: businessman, product** · `QuestRoot.jsx:156`, `dailyMission.js:11, 125`

`logStudentActivity()` is the app's event pipeline. It is **never called from anywhere in the quest.** No per-answer correctness, no per-stop stars, no mastery transitions, no demotions, no session events. You cannot answer "where do children drop out of the trail?" or "which stop is too hard?" — the data does not exist.

The only trace a session leaves is `notifyMissionTaskDone(scope, "game")` (`QuestRoot.jsx:156`) — which credits the **arcade** mission slot. `MISSION_KINDS` is `["quest", "book", "game"]`, and the `"quest"` slot is credited by `ElSkillsQuest`. **Finishing a Sound Seekers stop does not count as a quest.**

---

### P1-9 · Mastery is a silo. The child proves `/sh/` twice and gets credit once.
**Lens: teacher, logic, businessman** · `questMastery.js`, `treasureTrail.js:73-80`

Sound Seekers writes **no** `answers`, `mastery`, or `item_mastery` rows. It neither feeds nor reads the app's real mastery model. `questSequence.js:7-10` deliberately mirrors the EL Skills Block order *so a child meets sounds in the order their class teaches them* — and then records the evidence in a place the EL Skills Block cannot see, and vice versa. **A child who has proved `/sh/` in the formal assessment starts Sound Seekers at zero on `/sh/`.**

The economy is siloed too: `computeTreasury()` reads `el_quest`, `learn_games`, `story_quests`, `guided_reading`. **Sound Seekers stars earn zero coins in the Hollow.** Its stars buy only quest-internal sparks. The mode is walled off from the app's entire reward loop.

---

### P1-10 · A child who taps "Quest" never reaches Sound Seekers.
**Lens: ux, child, businessman** · `StudentHomePage.jsx:196-207, 331-335`

The only entry point is a **text-only button in the top bar**, beside the coin pill and the account menu — not in the activity grid, no art, no icon.

Meanwhile the main grid *has* a card labelled **"Quest"** (`:331-335`) and the Daily Mission has a **"quest"** tile (`:78, :169`) — and **both route to `ElSkillsQuest`, a different mode.** The 3D, 40-stop, 8,600-line flagship is a text link in the chrome; the word "Quest" points somewhere else.

`Sidebar.jsx` has no Sound Seekers entry either — teachers have no nav path to it at all.

---

# P2 — Real cost, nothing visibly broken today

### P2-1 · `buildStop()` is dead in production — and 370 lines of tests validate it.
**Lens: coder** · `questRounds.js:445-556`, `questRounds.test.js`

The runtime path is `QuestHub` → `buildTrailSection` → **`buildWalk`** (`questEncounters.js`). **`buildStop()` is imported by nothing except `tests/unit/questRounds.test.js`.**

Consequences:
- **`buildGateRounds` is dead.** The Gate — 6 mixed items, no hints, no retries — was the v1 mastery check. It is still built, still tested, never played.
- **`buildTrailRunRound` is dead** (twice over — see P1-1).
- **The fairness tests are aimed at the wrong function.** `buildStop` and `buildWalk` contain *near-duplicate* coverage logic — `pickCovering`, `coverTargets`, `dueBlends` are reimplemented in both, and `blendsIn` is literally copy-pasted (`questEncounters.js:346-354`, commented *"Local copy"*). **The tests exercise one copy; the app runs the other.** They can drift silently, and the suite will stay green while it happens.

`questPlaythrough.test.js` does test the live `buildWalk` path, which is the saving grace. But the three fairness rules in the `questRounds.js` header — the ones that stop a child winning without reading — are asserted against the dead copy.

---

### P2-2 · No CI. Every gate in this repo is opt-in muscle memory.
**Lens: coder, businessman**

There is **no `.github/` directory, no CI config of any kind, no git hooks, no husky, no lint-staged.** `.git/hooks` contains only `.sample` files.

- `check:quest`, `check:quest-3d`, `check:quest-art`, `check:quest-music`, `check:quest-gate`, `check:quest-route-visual` — **six quest gates, all manual.**
- `prebuild` runs four *generators*, no checks. `vercel.json` sets only `installCommand`. **Vercel deploys without running tests, lint, or a single quest gate.**
- The only documented gate command lives in `QUEST_DESIGN_PLAN_2026-07-11.md:416-419` — and it **predates five of the six quest checks**, so even the documented ritual is stale.
- `npm run shots` never sets a non-zero exit code (`shootQuest.mjs:278-283` only `console.log`s failures) — it is diagnostic, never a gate.

A commit that breaks `check:quest` ships to production green. *This is the finding that makes every other finding recur.*

---

### P2-3 · 70 MB of models nobody loads ship to production — and are one `git add .` from being permanent.
**Lens: coder, businessman** · `public/models/library/`

- `public/models/library` is **71 MB / 1,638 files**. **Only 3 files (532 KB) are referenced at runtime** (`Fish`, `Cupcake`, `Boots` via `threeAssetLibrary.js`). The 70 MB `kaykit/` tree is referenced by **zero lines of `src/`**.
- **It deploys.** `.vercelignore` does not exclude `public/`. `dist/models/library` = **79 MB**.
- **It is untracked *and* not gitignored** (`git check-ignore` → rc=1). One `git add .` commits 1,638 files and 71 MB into history permanently.
- `docs/3D_ASSET_LIBRARY.md` rule 5 sets a **75 MB cap**. `public/models` is **80 MB — already over**, entirely on account of models nothing loads.

**Separately:** a first meadow load pulls **4.36 MB of glTF** — the dominant cost, ~15× the JS. The monster `.gltf` files embed their buffers as **base64 data URIs**, costing ~33% over binary. Converting to `.glb` is a free ~1.4 MB.

*Licensing is clean* — all packs are CC0 with `LICENSE.txt` present. (One bookkeeping gap: `Boots.glb` by Isa Lousberg is in the manifest but missing from `SOUND_SEEKERS_3D_ASSET_NOTICES.md`.)

---

### P2-4 · Accessibility: remove any two channels and feedback vanishes.
**Lens: ux, designer, parent, child** · `quest.css:140-154, 1085-1092, 1411, 1662-1668`

- **Right/wrong is signalled by colour + motion + sound only.** No checkmark, no cross, no text, **no `aria-live` on any encounter result.** And `quest.css:1085-1092` kills *all* animation under `prefers-reduced-motion` via `.q-root *`. **So a colourblind child with reduced-motion on, or with the sound off, gets green-vs-red and nothing else.**
- **Reduced-motion is honoured in CSS but not in Three.js.** No `matchMedia` anywhere in `src/components/quest`. Camera lerp, bloom, vignette, floating drops, gate swing all keep running at full motion for a child who asked the OS for the opposite.
- **The tap-target rule targets dead selectors.** `quest.css:140` says *"Touch targets: 64px minimum. A five-year-old's finger is not a mouse."* The rule below sets **56px** and applies to `.qs-*` classes — **the old shell naming, present in zero JSX files today.** Every live button uses `.qw-*` and is sized ad hoc: `.qw-listen` is 46px; `.qw-pw` — the *"stuck on a word? tap it"* lifeline — is `min-height: 0; padding: 2px 3px`. **The smallest target in the game is the help feature.**
- **Quality detection misfires on iPad.** `chooseTrailQuality()` (`QuestHub.jsx:240-252`) keys off `navigator.deviceMemory`, which **Safari does not implement** → defaults to `8` → an iPad in landscape (>760px) gets shadows, post-effects and 1.65 pixel ratio. That is the single most common school device, on the highest quality tier, by accident.

---

### P2-5 · The game requires reading in order to teach reading.
**Lens: child, teacher, ux** · `Guide.jsx:21`, `Encounters.jsx:205, 406, 501`, `DenScreen.jsx:76`, `TradingPost.jsx:64`

The target user is a 4–7 year old who **cannot yet read**. **No UI copy is ever voiced** — the only audio in the entire mode is grapheme and word cue files.

A non-reader cannot get past:
- The guide's actual lesson — *"I found a new sound out here. Listen — it says a."* Only the phoneme is spoken; the sentence is not.
- *"You can't sound this one out. You just know it."* — a meta-instruction about heart words, unreadable by definition.
- *"Stuck on a word? Tap it."* — the help text for the help feature.
- *"Stars from the Trail become sparks. Sparks become parts."* — the entire economy, explained in text, to a pre-reader.
- *"A stone lights up when you really know its sound."* — the Den's core concept, written *at* the child but comprehensible only to a parent.
- Creature Creator tabs: Body / Colour / Tail / Feet / Mouth / Eyes / Crest / Pattern — text-only, no icons.

`Signpost` requires reading **on purpose**, and says so — that is legitimate and good. Everything above is *incidental* reading load standing between a non-reader and the phonics.

Vocabulary also drifts above band: *Herd*, *Trading Post*, *Chapter Relics*, *trail gate*.

---

### P2-6 · `QuestHub.jsx` is 2,973 lines, and 19 quest components have zero tests.
**Lens: coder, scalability**

`QuestHub.jsx` contains a Three.js renderer, a character rig, a procedural creature builder, a scene graph, a raycaster, an autosave loop, and the game state machine — in one module. The React component starts at line 2115; the preceding 2,100 lines are scene construction.

**Every file under `src/components/quest/**` (19 files) has zero test coverage** — including three plain `.js` files that are testable today with no DOM (`shells/shellContract.js`, `world/encounterViews.js`, `world/questAssets.js`). `questWorlds.js`, `questStore.js` and `questAudio.js` have no assertions anywhere — not in tests, not in the integrity check.

The pure-logic layer, by contrast, is **excellently** tested (10 quest test files with genuinely adversarial assertions — the full-trail playthrough simulation is exemplary). The gap is precisely at the boundary where the logic meets the screen.

**Adding a 4th world today** means: a new `WORLD_THEMES` entry, a new `WORLD_KITS`/`WORLD_VARIANTS` entry, a new music track (hardcoded list in `checkQuestMusic.mjs`), a new model cast (hardcoded list in `checkQuest3DAssets.mjs`), new parallax art, a new `LIGHT_ARC` branch in `lightForStop()`, and a new `residentPalette` branch — across 6 files and 2 hardcoded tool lists, with no test that would catch a missed one.

---

### P2-7 · `checkQuestIntegrity.js`'s own file list has fallen behind the code.
**Lens: coder** · `tools/checkQuestIntegrity.js:160-174`

The `runtimeFiles` list — which enforces the no-emoji / no-raw-hex house rules — **omits six quest modules written after it**: `questHub.js`, `questEncounters.js`, `questRouteGraph.js`, `questCreature3D.js`, `questChapters.js`, `questMechanicMatrix.js`. They are exempt from the house rules **by omission, not by design.** A hardcoded allowlist that must be updated by hand is a gate that silently stops gating.

Same class of bug in `checkQuest3DAssets.mjs` (hardcoded 19-model list) and `checkQuestMusic.mjs` (hardcoded 3-file list): **they assert the files exist, but never that the runtime's requests are covered.** Code and gate can drift apart in silence.

---

### P2-8 · No prop-types, no TypeScript, and the newest tooling is unlinted.
**Lens: coder** · `eslint.config.js:8-20`

No `tsconfig.json`, zero `.ts`/`.tsx` under `src/`, no `typecheck` script. **`eslint-plugin-react` is not installed**, so `react/prop-types` cannot fire, and `PropTypes` appears nowhere in the quest tree. Every prop crossing every quest component boundary is unchecked at build time *and* untested at runtime.

`eslint.config.js` matches `tools/**/*.js` and `**/*.{js,jsx}` — **neither pattern matches `.mjs`.** All five of the newest quest gates are entirely unlinted.

*(Clean spot worth noting: zero `eslint-disable`, `TODO`, `FIXME` or `HACK` anywhere in `src/components/quest/**`. Nobody is suppressing rules.)*

---

### P2-9 · The `progressScopeKey` fallback is a trapdoor.
**Lens: coder** · `App.jsx:8070`, `progressSync.js:124`

`progressScopeKey = studentId || studentName || "default"`. But `progressSync.js:124` bails unless `activeSession.studentId === scopeKey`. **If `studentId` is ever falsy, the scope key becomes the child's *name* — which can never match the session's UUID — so every quest write goes to localStorage and is dropped before it reaches the cloud. No error, no warning.**

Latent today (all three `setNameSaved(true)` sites do set `studentId`), but the fallback exists for a reason, and the day it fires a child loses everything on their next device. Two children named "Sam" on a shared iPad would also share one save.

**Also:** `App.jsx:3985-3993` (teacher adds a student) sets `studentId` + `nameSaved` but **never calls `configureProgressSync`** — so until the teacher re-selects that student, all their progress, quest included, is local-only.

---

# P3 — Tidy-up

- **175 committed `" 2.<ext>"` duplicate files**, including `quest-creature-preview 2.html` (byte-identical to its twin), `QUEST_DESIGN_PLAN_2026-07-11 2.md`, `QUEST_SLICE_1_SPEC_2026-07-11 2.md`, `graphify-out/graph 2.json` and `graph 3.json`.
- **Two competing preview harnesses.** Root `quest-preview.html` / `quest-creature-preview.html` are superseded by `preview/quest.html`. Both are tracked.
- **`countMastered()`** is used only by tests.
- **Unused audio** shipped: `/audio/phonemes/{all,ang,ing,ong,ung}.mp3`, `digraphs_blends/ph.mp3` — no quest stop teaches them.
- **Legacy music fallbacks** (`/audio/music/{meadow,dino,moonwood}-loop.mp3`) are **5.7 MB combined — 3–4× the size of the tracks that replaced them** — and are covered by no budget check.
- **`.gitignore`** has duplicated blocks (`dist 2/` twice, `.env` three times).
- **`@axe-core/playwright`** is a devDependency with **zero usages**. No a11y assertions exist anywhere.
- **`playwright.config.js`** sets `testDir: "tests"`, so a bare `npx playwright test` would try to collect the 50 `node:test` files in `tests/unit/`. Masked only because the npm scripts always pass a path.
- **Pluralisation:** `"1 new stones"` (`QuestRoot.jsx:233`).

---

# Positive additions worth building

Ordered by value per unit of effort. **Several of these are re-connections, not new builds.**

### 1. A teacher/parent view of the mastery gate — *the single highest-value thing on this list*
This is the mode's whole reason to exist and it is currently unsayable. `weakestTargets()` is already written and tested. Ship a Sound Seekers panel on the teacher dashboard and in the parent report:
- **stones lit / 70** (the honest number — a claim you can back)
- **the weakest five sounds**, with accuracy and attempts
- **sounds mastered but not yet retired** (at-risk of rotting)
- **stops walked, time on task, last played**
- **the demotion log** — *"Sam had `sh`, and lost it. Here is the evidence."*

No competitor can produce that report. **Teach Your Monster's own post-mortem is quoted in `questMastery.js:3-5` as the reason this mode exists.** Right now you have the proof and no way to show it.

### 2. Turn the DOM encounters into a real 2D fallback mode
`Encounters.jsx` is already a complete, working, DOM-based set of all 8 encounters. Wrap it in a simple non-3D navigation shell and you get: a WebGL fallback (P0-1), a low-end-device mode, a keyboard-first mode, a screen-reader-viable mode, and a fast preview harness — **from code you have already written and shipped.**

### 3. Re-connect `RewardScreen` and `TrailMap`
Two files, 247 lines, already written. The reward moment and the map are the two things a 40-stop journey most needs and currently has neither of.

### 4. A real correction loop
On the 2nd miss: drop to two choices. On the 3rd: teach it back — *"This one says /sh/. Listen. Now you find it."* Then re-ask. This is what Teach Your Monster does well and it is the biggest single lever on both learning and frustration. It also kills the brute-force hole.

### 5. Voice the UI
House rule #3 forbids browser TTS — so this is a recording job, not a code job. ~30 lines of gold voice would make the mode usable by an actual non-reader: the guide's lesson sentence, the encounter prompts, the Den, the Trading Post. **Right now the product that teaches reading requires reading.**

### 6. Bridge the two mastery models
Write quest attempts into `answers`/`item_mastery` (and read the assessment's evidence on the way in). A child who proved `/sh/` in class should not start at zero at home. This also makes the quest's evidence visible to every reporting surface you already have, for free.

### 7. Ship the fluency mechanic
`buildTrailRunRound` is written and correct. Add one `ENCOUNTERS` entry and one DOM view. Automaticity is the missing rung between decoding and reading, and it is the one thing 15 stops already *claim* to teach.

### 8. Free Roam / review mode
`weakestTargets()` is already there and its comment already promises this. A child who has finished the trail currently loops it. A "practise your five weakest sounds" mode is a short build on top of the scheduler you have.

### 9. Sound Seekers stars → Hollow coins
Connect the economy. Right now the flagship mode pays out in a currency that buys nothing outside itself.

### 10. Telemetry
Per-answer, per-stop, per-session. Without it you cannot tell which of the 40 stops is the one children quit on — and with 40 stops, one of them is.

---

# Suggested order of work

| # | Work | Severity | Effort |
|---|---|---|---|
| 1 | **Add CI.** Run `test` + `lint` + all six quest gates on every push. Nothing else on this list stays fixed without it. | P2-2 | S |
| 2 | Fix the server merge for `phonics_quest`; add the missing `progressMerge` test case | P0-4 | S |
| 3 | 2D fallback mode (wrap `Encounters.jsx`) → closes the WebGL hole | P0-1 | M |
| 4 | Re-connect `RewardScreen` + `TrailMap` | P0-2 | S |
| 5 | Gear equip UI (include `kind: "gear"` in the Creator) | P0-3 | S |
| 6 | Delete or wire up `trail-run`; delete or wire up `retire()`; delete `buildStop`+`buildGateRounds` and re-point the fairness tests at `buildWalk` | P1-1/2, P2-1 | M |
| 7 | Correction loop (2 choices → teach-back → re-ask); unify mistake accounting | P1-3 | M |
| 8 | Commission the 16 missing clips + the 8 alt pronunciations; add blend example words | P1-4/5 | M |
| 9 | Fix the `MASTERY_RULES` header and the `BLEND_RULES` window arithmetic | P1-6 | S |
| 10 | **Teacher/parent mastery report** | P1-7 | M |
| 11 | Telemetry + time-on-task | P1-8 | M |
| 12 | Move the entry into the activity grid; rename the colliding "Quest" card | P1-10 | S |
| 13 | `.vercelignore` the unused 70 MB; gitignore `public/models/library`; `.gltf` → `.glb` | P2-3 | S |
| 14 | Accessibility pass: non-colour feedback, `aria-live`, `matchMedia` in the render loop, tap targets | P2-4 | M |
| 15 | Voice the UI copy | P2-5 | M |
| 16 | Split `QuestHub.jsx`; test the three plain-`.js` quest files | P2-6 | L |

---

## One closing note

The comments in this codebase are the best documentation of *why* I have read in a long time — `questProgress.js:188-199` on `lastStop` destroying the scheduler, `questEncounters.js:197-206` on the reserved review slot, `questRounds.js:180-187` on crediting every grapheme in a word. Each one records a real bug, found by a real simulation, and explains the fix.

Every P0 in this audit is the same *kind* of bug those comments describe — a thing that is silently not connected, where nothing on screen looks broken. The difference is that the ones in the comments were caught by the full-trail simulation, and these were not, because **the simulation tests the logic layer and every one of these lives at the seam between the logic and the screen.**

That seam is where the tests stop and the CI doesn't exist. That is the actual finding.
