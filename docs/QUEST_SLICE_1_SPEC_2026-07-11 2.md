# Sound Seekers — Slice 1 build spec
## The one playable stop · 2026-07-11

Companion to `docs/QUEST_DESIGN_PLAN_2026-07-11.md`. This is the exact scope of the first build, file by file.

**Slice 1 exists to answer one question before we build 40 stops on top of it:**
> Does a layered-SVG, build-your-own creature look good enough for a child to love?

Everything else in this slice is in service of getting that creature in front of you inside a real loop, so you're judging it in context and not as a sticker.

---

## What you will be able to do when it lands

1. Open Student Home → tap **Sound Seekers**.
2. Build a creature: body, colour, pattern, eyes, mouth, crest, tail, feet. Watch it hatch.
3. Land in the **Den**. See your creature idling. See an empty stone wall.
4. Tap **Walk the Trail** → the Meadow map → your creature glides to **Stop 1: Hollow Tree**.
5. Play the stop: Knowledge Tree (`a`) → Sound Stones → Beast Feed → Stone Bridge → the Gate.
6. Win 4 stones (`a` `m` `t` `s`) and one piece of gear. Watch them land.
7. Close the tab mid-shell. Re-open. **Land exactly where you left off.**

Anything not on that list is out of scope for Slice 1.

---

## Files

### New — pure logic (no DOM, no React, all unit-tested)

| File | Exports | Notes |
|---|---|---|
| `src/data/questSequence.js` | `QUEST_STOPS`, `getStop(id)`, `stopsForAct(n)` | Slice 1 ships stop `s1` fully and stops `s2`–`s8` as data only (locked on the map). |
| `src/data/creatureParts.js` | `CREATURE_SLOTS`, `CREATURE_PARTS`, `CREATURE_DYES`, `ANCHORS`, `defaultCreature()`, `isValidCreature()` | The parts manifest + anchor contract. |
| `src/utils/questMastery.js` | `recordAttempt`, `masteryState`, `weakestGpcs`, `MASTERY_RULES` | The four-condition gate (design plan §6). |
| `src/utils/questReviewScheduler.js` | `dueTargets`, `promote`, `demote`, `targetsForStop` | Leitner-lite. Slice 1 uses it but stop 1 has no review items yet — the tests do the work. |
| `src/utils/questProgress.js` | `loadQuestProgress`, `saveQuestProgress`, `recordStopResult`, `saveQuestCheckpoint`, `readQuestCheckpoint`, `clearQuestCheckpoint`, `earnedSparks` | Mirrors `learnGamesProgress.js` + `hollowState.js`. Sparks are **derived**; only spend is stored. |
| `src/utils/questAudio.js` | `speakGrapheme(g)`, `graphemeSrc(g)`, `hasGraphemeAudio(g)` | **Fixes a real bug found while writing this plan:** 27 already-recorded gold-voice clips for the advanced code (`silent_e`, `r_controlled`, `vowel_teams`) are unreachable from any running code path — `speakPhoneme()` truncates to one character, and `graphemeAudioPath()` only checks 3 of the 6 folders. This resolves all six. Slice 1 only needs `a m t s`, but the function is 20 lines and unlocks Act III's audio for free. |

### Modified — existing files

| File | Change | Risk |
|---|---|---|
| `src/utils/progressKeys.js` | add `"phonics_quest"` to `PROGRESS_AREAS`; add `lp-quest:<scope>` to `localProgressStorageKey()` | Low. `progressKeys.test.js` already exists and will need its expected-areas list updated — expected, not a surprise. |
| `src/utils/progressMerge.js` | add `phonics_quest` merge rules: counters by `max`, arrays by union, `state` by `mergeStatusForward`, **`checkpoint` excluded** | Low, but this is the file where a bug silently eats a child's progress. Tests first. |
| `src/appState/appViews.js` | add `PHONICS_QUEST: "phonicsQuest"` | Low. `REQUIRED_APP_VIEWS` is derived, so nothing else moves. |
| `src/App.jsx` | one lazy route + one handler | Low. |
| `src/components/StudentHomePage.jsx` | one new card | Low. |
| `package.json` | add `check:quest` script | Low. |

**Explicitly NOT touched:** `GAME_LIST`, `LEARN_GAMES`, `learnGamesData.js`, `learn-games.css`, `elSkillsBlockCycles.js`, anything in `src/components/elQuest/**`. The quest is a standalone mode; it must not perturb the arcade or EL Quest. In particular `tests/unit/gameSurfaces.test.js` hard-asserts the exact list of 11 arcade game ids — **we do not add ourselves to it**, so that test stays green untouched. That is the tell that we've stayed in our lane.

### New — React

```
src/components/quest/
  QuestRoot.jsx            portal to document.body, fullscreen, data-pal-world, owns nothing but routing between screens
  CreatureCreator.jsx      slot tabs + option reel + hatch
  CreatureFigure.jsx       the SVG compositor (the risky bit)
  DenScreen.jsx            creature + stone wall + Walk the Trail
  TrailMap.jsx             wide map, road path, marker, gliding creature
  StopRunner.jsx           sequences Teach → shells → Gate → Reward for one stop; owns the checkpoint
  RewardScreen.jsx         stone flies to wall, gear drops on creature
  shells/
    shellContract.js       the shared prop contract + a dev-time assertion
    KnowledgeTree.jsx      teach (not a game)
    SoundStones.jsx        sound → letter
    BeastFeed.jsx          letter → sound
    StoneBridge.jsx        blending
    GateCheck.jsx          the 6-item mastery check
src/styles/quest.css       imported by QuestRoot only
```

### New — assets (Slice 1 only)

| Asset | Count | Where |
|---|---|---|
| Creature part SVG symbol sheets | 7 files (one per slot), ~60 symbols total | `public/creature/{body,eyes,mouth,crest,tail,feet,pattern}.svg` |
| Gear (stop-1 drop) | 1 | `public/images/quest/gear/leaf-cap.webp` |
| Meadow map | 1 (2752×1536) | `public/images/quest/maps/meadow.webp` |
| Stop-1 backdrop | 1 (1280×720) | `public/images/quest/backdrops/hollow-tree.webp` |
| Stone plate | 1 (256×256) | `public/images/quest/stone.webp` — **the grapheme is drawn by the app on top, not baked in** |
| Egg | 3 | `public/images/quest/egg-{intact,cracked,open}.webp` |
| Props | ~6 | pouch, pen, plank, sign, Beast, tree |
| **Voice clips** | **~20** | shell instructions ×3, teach lines ×4 (`a` `m` `t` `s`), stop-1 intro/outro, praise ×6, retry ×4, creator ×1 |
| Music | 1 | `/audio/music/quest/meadow-loop.mp3` (via `npm run generate:arcade-music`) |

Reused, no new work — **all four verified present on disk**: `/audio/phonemes/{short_a,m,t,s}.mp3`, `/audio/child-mode/clean-human/words/{at,am,mat,sat}.mp3`, `/audio/letter-names/{a,m,t,s}.mp3`. **[observed]**

**The game must be fully playable with zero audio present** — silent, Listen buttons hidden, no browser TTS. That's the existing policy and it means art and audio can land on different days without blocking each other.

---

## The shell contract (worth getting right once)

```js
// Every shell takes exactly this, and returns exactly this.
export default function Shell({
  targets,          // ["a","m","t","s"] — from targetsForStop()
  words,            // decodable words sourced from the lexicon, pre-filtered to taught sounds
  world,            // "meadow" | "dino" | "moonwood"
  isSoundEnabled,
  onItem,           // (gpc, correct, ms) — fired ONCE per response. Feeds mastery + analytics.
  onProgress,       // (done, total)
  onDone            // ({ correct, total, mistakes })
}) {}
```

- The shell owns **no** progress state, saves **nothing**, and knows **nothing** about the map, the creature, or the save file. `StopRunner` owns all of that.
- Misses inside a shell go through the existing `makeCatchUp(targets, { requeueGap: 3 })` — already written, already unit-tested. We do not write a new one.
- `questShellContract.test.js` asserts every shell fires `onItem` exactly once per response — this is the test that stops a shell from silently double-counting a child's correct answer and faking mastery.

---

## Order of work, and the check that closes each step

| # | Step | The named check that says it's done |
|---|---|---|
| 1 | Pure modules + tests (`questSequence`, `questMastery`, `questReviewScheduler`, `questProgress`, `creatureParts`) | `npm run test:unit` green, including the **negative** mastery cases |
| 2 | `progressKeys` + `progressMerge` changes | `progressKeys.test.js` + new `questProgress.test.js` green; **a cloud merge cannot lower a counter** |
| 3 | `CreatureFigure` + the SVG part sheets | `creatureParts.test.js` green **AND** a rendered preview page — `quest-creature-preview.html` — showing ~24 random creatures on one screen. **This is where you look and say yes or no.** |
| 4 | `CreatureCreator` + hatch | you can build one and it hatches |
| 5 | `DenScreen` + `TrailMap` | creature glides the road; stone wall renders 31 empty sockets |
| 6 | The 4 shells + `GateCheck` | `questShellContract.test.js` green; `quest-stop-preview.html?stop=s1` playable standalone |
| 7 | `StopRunner` + checkpoint + reward | **the resume test**: close mid-shell, reopen, land in the same place |
| 8 | Wire into `App.jsx` + Student Home | `npm run check:quest` green; full gate green |

**Step 3 is the gate on steps 4–8.** If the creature doesn't look good, we stop and switch to the hybrid fallback (pick a base pal, layer colour + accessories) before sinking any more into it.

---

## Preview harness (how you look at it without me guessing)

The repo already has this pattern — root `<game>-preview.html` + `src/<game>-preview.jsx`, dev-only, query-param driven. **[observed: `letter-leap-preview.html` etc.]** Slice 1 adds two:

- `quest-creature-preview.html` — a grid of randomised creatures, plus a live creator. `?seed=` for reproducible sets.
- `quest-stop-preview.html?stop=s1&shell=stones&sound=1` — jump straight into any shell with any targets.

You run them with:

```bash
cd ~/Desktop/LiteracyPath && npm run dev -- --host
```

…then open the **Network** URL it prints (not `localhost` — the Chrome extension can't reach localhost, and I've been caught by that before) on the iPad or in the browser.

---

## The honest limits on this slice

- **I cannot run `npm run build` in my sandbox** — the rolldown linux-arm64 binding is 403-blocked. I verify `test:unit` + `lint` + `check:quest` in-sandbox and hand you the full gate as one line.
- **I cannot run the image generator** — no network to the image API from here. I write the batch job files; you run one command.
- **I cannot tell you the creature looks good.** That's step 3, and it's yours.
- **I cannot write to `.git`** from the sandbox. Commits and pushes are copy-paste commands for your Mac.

## The hand-over command (when Slice 1 is done)

```bash
cd ~/Desktop/LiteracyPath \
  && rm -f .DS_Store && rm -rf dist \
  && npm run build && npm run test:unit && npm run lint \
  && npm run check:approved-runtime-sources && npm run check:learn-games && npm run check:quest \
  && npm run check:repo-hygiene \
  && git add -A && git commit -m "Sound Seekers slice 1: creature creator, Den, Meadow map, stop 1" \
  && git push
```

Gated with `&&` throughout — **if any check goes red, nothing is committed and nothing is pushed.**
