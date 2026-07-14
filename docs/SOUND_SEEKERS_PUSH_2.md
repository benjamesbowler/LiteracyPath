# Sound Seekers — Push 2 (Codex brief)

**Context:** Push 1 landed chapters, the restored trail map, the reward screen, 2D fallback modes, relics, free-roam, telemetry and teacher/family reporting. `npm test` = 413 pass / 0 fail. `check:quest` = OK.

**This brief covers only what Push 1 did NOT close.** Each item below was re-verified against the working tree on 2026-07-14. Do not re-do Push 1 work.

**Standing rule for this push:** a thing is not done because it compiles. It is done when you have *run it* and can show the evidence. Every task below names its own proof. If you cannot produce the proof, the task is not complete — say so rather than claiming it.

---

## 0. BLOCKER — do this before anything else (2 minutes)

`public/models/library` is **71 MB / 1,638 files, untracked and NOT gitignored**, and the working tree currently has ~30 modified files staged for a commit.

**One `git add .` puts 71 MB into git history permanently.** Only 3 files in that tree (532 KB — `Fish.glb`, `Cupcake.glb`, `Boots.glb` via `src/data/threeAssetLibrary.js`) are referenced by the runtime.

Do this first:

1. Add `public/models/library/` to `.gitignore` — **except** the 3 files actually used (or move those 3 into `public/models/quest/objectives/` and ignore the whole library tree).
2. Add `public/models/library/` to `.vercelignore`. It currently deploys: `dist/models/library` = **79 MB**.
3. `docs/3D_ASSET_LIBRARY.md` rule 5 sets a 75 MB cap on the runtime model collection. `public/models` is currently **80 MB — already over.** Make the check enforce the cap rather than document it.

**Proof:** `git check-ignore public/models/library` exits 0; `du -sh dist/models` after a build is under 12 MB.

---

## 1. The fluency mechanic does not exist — ship it or delete it

**Verified still open:** `grep "trail-run" src/utils/questEncounters.js` → no match.

`ENCOUNTERS` (`questEncounters.js:45-54`) maps 8 encounter kinds to source shells. **There is no entry with `from: "trail-run"`.** So `FROM_SHELL` has no `trail-run` key, and `stop.shells.map(s => FROM_SHELL[s]).filter(Boolean)` **silently drops it**.

**15 stops declare `trail-run`** (s5, s7, s8, s11, s13, s14, s15, s17, s20, s23, s25, s26, s29, s31, s33). It is never built. `buildTrailRunRound` (`questRounds.js:317-328`) exists, is correct, and is wired to nothing.

This is the **only mechanic in the game that trains automaticity** — recognition under time pressure, which is the difference between decoding and reading. It is the missing rung between "can sound it out" and "can read".

**Also:** `questMechanicMatrix.js:66` still credits `trail-run` with `GRAPHEME_RECOGNITION` + `WORD_READING` evidence domains — so `docs/SOUND_SEEKERS_CURRICULUM_MECHANIC_MATRIX.md` **overstates the coverage the game actually delivers.** Whichever way you go, fix the matrix so the doc stops lying.

**Decide, explicitly, and say which you chose:**
- **Ship it:** add the `ENCOUNTERS` entry (a timed fork on the path — the sign you must take before it passes), a 3D view, and a 2D fallback view. It counts as a distinct encounter kind toward the two-different-kinds mastery bar, which is the whole point.
- **Delete it:** strip `trail-run` from all 15 stops' `shells`, delete `buildTrailRunRound`, and correct the mechanic matrix.

**Proof:** a test asserting that every shell id in `QUEST_SHELL_IDS` either maps to an encounter kind or is explicitly listed as non-encounter (`knowledge-tree`). *That test is the thing that stops this class of bug recurring* — it is worth more than the fix.

---

## 2. Long-term retention never runs — `retire()` is dead

**Verified still open:** `retire()` is called from no production file. Only `tests/unit/questMastery.test.js`.

`questReviewScheduler.js:14` documents five boxes:

> `box 5  sampled 1-in-10  retired (nothing is ever allowed to rot)`

Because `retire()` is never called, `MASTERY_STATES.RETIRED` is **unreachable at runtime** → `boxAfterStop()` never returns 5 → `isDue()`'s `stopIndex % 10 === 0` sampling branch **never fires**.

Mastered sounds cap at box 4 (due every 12 stops). Nothing is ever promoted out. **The documented "nothing rots" guarantee does not exist.**

**Fix:** call `retire()` when a mastered sound survives a spaced review far enough downstream — the intended trigger is already described in the `retire()` comment (`questMastery.js:169-170`). Decide the rule (suggestion: mastered + correct on a box-4 review + `stopIndex - lastStop >= 12`), implement it in `recordStopResult` or the scheduler, and document it where the boxes are documented.

**Proof:** extend the full-trail simulation in `questPlaythrough.test.js` — a perfect reader walking the whole trail must end with **at least one target in `RETIRED`**, and a box-5 target must be observed being sampled. Assert both.

---

## 3. Gear is still earned, announced, and unwearable

**Verified still open:** `grep -n "gear\|equipped" src/components/quest/CreatureCreator.jsx src/components/quest/TradingPost.jsx` → **no matches in either file.**

Five gear items unlock free at stops s1–s5 (`creatureParts.js:208-214`). `ownedPieces()` grants them (`questProgress.js:139-143`). The trail notice announces **"· new gear"**. The 3D rig renders all five (`QuestHub.jsx:1665-1717, 1831`).

**Nothing writes `creature.equipped`.** It stays `{head:null, back:null, neck:null, held:null}` forever. Both customisation screens filter to `kind === "part"`, which **excludes every gear slot** (`head`/`back`/`neck`/`held` are `kind: "gear"`).

The child is told they earned a Leaf Cap at stop 1 — the game's **first reward** — and can never put it on.

**Fix:** add gear slots to `CreatureCreator` (and/or a "wear" toggle in `TradingPost`), writing `creature.equipped[slot] = id`. `normalizeCreature` (`creatureParts.js:283-288`) already validates and repairs the shape, so the write is safe. Gear is *unlocked*, not *bought* — don't put it behind sparks.

**Proof:** a screenshot of the creature wearing the Leaf Cap in the Den, and a screenshot of it worn in the 3D trail. Both, not one.

---

## 4. The server merge still destroys the mastery data the client protects

**Verified still open:** `phonics_quest` is not special-cased in any `supabase/*.sql`.

`progressMerge.js:77-95` contains an explicit, correct explanation of why `phonics_quest` **cannot** go through the naive forward merge:

> *"mergeMonotonic would union the window (collapsing `[1,1,0,1]` to `[1,0]` and destroying the accuracy calculation) and let a string state be overwritten by whichever row arrived last."*

`supabase/FIX_DAILY_MISSION_MERGE.sql:53` routes every area except `daily_mission`/`profile` — **including `phonics_quest`** — into exactly that merge. On any two-device sync:

| Field | Server does | Consequence |
|---|---|---|
| `mastery.*.window` | array-union + dedupe | `[1,1,0,1]` → `[1,0]`. **The accuracy calc is destroyed.** |
| `mastery.*.state` | last-write-wins | **A demotion is silently undone.** |
| `trail.routeCursor` | `greatest()` | Pins the review circuit at stop 40 forever. |
| `ledger.purchases` | union by object identity | Duplicate purchases when timestamps differ. |
| `checkpoint` | forward-merged | Teleports a child mid-stop. |

The migration header claims it *"Mirrors that logic so the two never disagree."* For `phonics_quest`, it does the opposite.

**This is the one item on this list that loses real children's real data.** It is invisible — nothing errors, the numbers just quietly stop meaning anything.

**Fix:** write a migration that gives `phonics_quest` a bespoke server merge matching `progressMerge.js:202-231` exactly — or route it to last-write-wins-by-`updated_at`, which is *wrong but safe*, and is strictly better than the current *wrong and destructive*.

**Proof:**
- A `phonics_quest` case in `tests/unit/progressMerge.test.js` — **there is currently none**, while `learn_games`, `el_quest`, `story_quests`, `guided_reading`, `phonics_letters` and `daily_mission` all have one.
- A SQL-level test: two rows with `window: [1,1,0,1]` and `window: [0,1,1,1]` must merge to a 4-element ordered window, not `[1,0]`.

---

## 5. `BLEND_RULES` gives blends a *harsher* bar than the comment argues for

**Verified still open:** `questMastery.js:69-71` — `{minCorrect: 3, minAccuracy: 0.75, accuracyWindow: 3}`.

The comment above it (`:55-67`) argues at length that blends deserve a **gentler** bar, because the game structurally cannot produce ten attempts for them. It then says *"Four correct reads"*.

The code says `minCorrect: 3` — so the comment and the code already disagree. But the real bug is the arithmetic:

> `accuracyWindow: 3` with `minAccuracy: 0.75` → **`2/3 = 0.667` fails.** A blend requires a **perfect 3/3**.

A grapheme passes at `3/4 = 0.75`. **So blends — the thing the comment says needs an easier bar — require 100% accuracy, and graphemes require 75%.** One slip on a blend, ever, and the child re-earns it from scratch.

**Fix:** decide the intended bar and make the code, the comment, and the arithmetic agree. (If the intent is "one slip allowed", `accuracyWindow: 4, minAccuracy: 0.7` gives `3/4` — or keep the window at 3 and drop accuracy to `0.6` for `2/3`.)

**Also fix while you are in this file:** the top-of-file header (`:9-13`) still documents the **old** bar — *"≥8 correct responses, ≥85% accuracy over the LAST 10 attempts"* — which `MASTERY_RULES` (`:46-53`, now 4 / 0.75 / window 4) contradicts thirty lines below. `:117` still says *"8/8 correct is not yet 10 attempts of proof."* The header is the first thing anyone reads and it is wrong.

**Proof:** a unit test asserting a blend with `window: [1,1,0]` and 3 correct across 2 kinds on 2 days reaches `MASTERED` (it currently does not).

---

## 6. There is still no CI — and this is why every other item recurs

**Verified still open:** no `.github/`, no git hooks, no husky, no lint-staged.

- `check:quest`, `check:quest-3d`, `check:quest-art`, `check:quest-music`, `check:quest-gate`, `check:quest-route-visual` — **six quest gates, all manual.**
- `prebuild` runs four *generators*, no checks. `vercel.json` sets only `installCommand`. **Vercel deploys without running tests, lint, or a single quest gate.**
- `npm run shots` never sets a non-zero exit code (`shootQuest.mjs:278-283` only `console.log`s failures) — diagnostic, never a gate.

**Fix:** one GitHub Actions workflow on push + PR:

```
npm ci
npm run lint
npm test
npm run check:quest
npm run check:quest-3d
npm run check:quest-art
npm run check:quest-music
npm run build
```

Then make `shootQuest.mjs` exit non-zero on failure so `check:quest-gate` can join it.

Every finding in Push 1 and Push 2 was true while the gates were green, because the gates check the *content* and what breaks is the *wiring*. **CI is the only item here that prevents the next audit from finding the same class of bug again.** Do it even if you do nothing else.

**Proof:** a red CI run (deliberately break something, show it caught) followed by a green one. A workflow that has only ever been green has not been tested.

---

## Definition of done

- [ ] `public/models/library` gitignored + vercelignored; `dist/models` under 12 MB
- [ ] `trail-run` shipped **or** deleted; mechanic matrix corrected; shell↔encounter coverage test added
- [ ] `retire()` reachable; full-trail sim asserts a RETIRED target and a box-5 sample
- [ ] Gear equippable; screenshots in Den **and** 3D trail
- [ ] `phonics_quest` server merge fixed; `progressMerge.test.js` has a `phonics_quest` case
- [ ] `BLEND_RULES` arithmetic and comments agree; stale `MASTERY_RULES` header corrected
- [ ] CI runs lint + tests + all quest gates on push; demonstrated red, then green

**Report back honestly.** If an item is half-done, say half-done. Push 1's summary claimed more than it shipped — `trail-run`, `retire()` and gear were all described as handled and none of them were. An accurate "I did 4 of 7" is worth more than an inaccurate "all done", because the next person builds on what you say.
