# Sound Seekers — adventure phonics game
## Full design plan · 2026-07-11

**Working code id:** `phonics-quest` · **Child-facing name:** *Sound Seekers* (alternates in §16)
**Placement:** new standalone mode on Student Home, alongside EL Quest and the Arcade — nothing existing is replaced.
**Scope:** a–z through the full advanced code (split digraphs, vowel teams, r-controlled, suffixes).
**Delivery:** vertical slices — Slice 1 is playable end-to-end before the rest is built (see `QUEST_SLICE_1_SPEC_2026-07-11.md`).

Label key used throughout: **[observed]** = I read it in this repo or a primary source · **[derived]** = arithmetic from observed facts · **[inferred]** = my design judgement, not a fact · **[needs-Benjamin]** = a human must look/listen.

---

## 1. The one-paragraph pitch

A child hatches their own creature, then walks it along the Sound Trail — a long, illustrated road through three lands. Every stop on the road holds a few **Sound Stones** (letter-sounds). To win a stone you play short mini-games that teach it, drill it, blend it into words, and finally read it in a sentence. Stones go on the wall of your Den. Every stop also drops a new **part or piece of gear** for your creature, which appears on it immediately. The road runs from the first letter `a` to `tion` and never really ends — a child can walk it for a year at 15 minutes a day.

## 2. The single most important structural decision

**Narrative progress and mastery progress are two separate tracks.**

- **Narrative track** — advances on *effort*. Finish a stop's activities and you always move on, always get the cosmetic, always see the next bit of story. A struggling child sees exactly as much of the world as a fast one.
- **Mastery track** — advances on *evidence*. A letter-sound is only "learnt" when the child has proved it (§6). Unproven sounds keep coming back, in different mini-games, until proved.

This is not my invention — it is Teach Your Monster's own diagnosis of their biggest flaw, published in March 2026 when they announced their ground-up rebuild: *"we couldn't be certain that a letter sound was actually learnt, or simply seen."* Their old game had no mastery gate at all; a child could be pushed into digraphs while still failing `s`. **[observed]** Competing products (Reading Eggs, Lalilo, Phonics Hero, Nessy) gate on a placement test but then run a fixed lesson order. Nobody in the market currently ships both a real placement test *and* a real mastery gate *and* an uninterrupted narrative. That is the gap we take.

**Consequence for the code:** nothing in the reward system may read from the mastery track, and nothing in the mastery track may read from the reward system. They are two fields in the save file that never touch.

---

## 2b. Dimension — revised 2026-07-11: **3D guided trail + illustrated billboards**

**Teach Your Monster is not a 3D game.** It is 2D cartoon art (illustrator Rich Wake, games studio Popleaf, in collaboration with Roehampton). **[observed]** What reads as depth in their tunnel sequences is perspective drawn *into* the illustration plus parallax layers moving at different speeds. There is no 3D geometry in it.

The original slice chose a receding 2.5D road. Its fixed lane and finish flag read as a side-scrolling level. The next build over-corrected into a small semi-open plaza: movement was free, but the world felt short, flat and disconnected from the 40-stop journey. **[observed: browser-tested `TrailWalk.jsx` and first `QuestHub.jsx`]** The live direction keeps 3D freedom while restoring a strong authored route.

| | Cost | Verdict |
|---|---|---|
| **2.5D road** — vector creature, illustrated world, layered depth | Low | **RETIRED: reads like a Mario level** |
| **Small 3D open hub** — free movement around a bounded plaza | Medium | **RETIRED: too short and directionless** |
| **Long 3D guided trail, 2D creature** — winding corridor, forest walls, illustrated billboard creature and props | +1 slice | **CHOSEN AND LIVE** |
| **Full 3D** — real meshes and rigs | Very high | **Rejected**, and it should stay rejected |

**Why full 3D is the wrong call, stated plainly so nobody relitigates it in three months:** the creature is 6 bodies × 12 dyes × 5 patterns × 10 eyes × 8 mouths × 10 crests × 8 tails × 6 feet = **13.8 million creatures from ~55 flat vector shapes**, and a dye is one CSS variable. In 3D those 55 shapes become 55 modelled, UV-mapped, rigged meshes that must attach correctly to **six different body topologies**, and every dye becomes a material variant. That is a studio pipeline. There is no 3D asset generator in this project, so the art could not be produced even if it were budgeted. Full 3D means throwing away the creature system — the exact thing that got approved.

**What the hybrid 3D direction means concretely:**
- Each of the 40 curriculum stops is one long winding section, not one tiny map. Together they form the continuous Sound Trail.
- Dense, impassable forest or rock walls define both sides. The child can move freely across the corridor, double back and collect things, but the landscape quietly points forward.
- Three.js owns terrain, paths, lighting, shadows and the following camera.
- The creature, residents, collectables and encounter props remain crisp illustrated billboards. The same layered SVG and all 13.8M creature combinations survive untouched.
- The child meets a teaching friend, collects rewards while travelling, then meets 1–3 helpers in the exact curriculum order. Only the next helper is active.
- The final helper's existing phonics task opens a physical gate. A miss retries supportively; the gate is not an extra six-question boss exam.
- Movement, guide page, current encounter/beat, solved requests, collectibles and tally save while walking and on every exit.

`QuestHub.jsx` and `questHub.js` implement this boundary. The shells, mastery track, review scheduler and save file do not know how the world is rendered.

---

## 3. Story, world, art direction

**The premise.** A storm scattered the Sound Stones across the three lands. Your creature — hatched by you in the first 90 seconds of play — explores each land, meets its residents and helps restore the places where sounds have gone missing. Each stone you carry home lights up the wall of your Den. When the wall is full, the Star Reach wakes.

**Why this premise:** it gives us (a) a collection metaphor for graphemes that is *literally* the phonics content, not a token economy bolted on top; (b) character-led reasons to keep travelling; (c) a home base (the Den) that is both trophy cabinet and dress-up room; (d) visible, persistent world repair instead of disconnected levels.

**Lands** map onto the existing `PAL_WORLDS` **[observed: `src/utils/palWorlds.js`]** so we inherit the whole colour system for free:

| Act | Land | `data-pal-world` | Feel |
|---|---|---|---|
| I | **Sunlit Meadow** | `meadow` | Warm, green, low stakes. Hills, hollow trees, standing stones. |
| II | **Fossil Ridge** | `dino` | Amber, rocky, bigger. Bone arches, tar pits, fern canyons. |
| III | **Moonwood & the Star Reach** | `moonwood` | Deep indigo, mysterious. Glowing fungus, floating rock, observatory. |

**Art direction (locked, from existing project rules):** realistic cartoon. Fantasy / sci-fi / nature only. **No rainbow motifs. No faces on inanimate objects. Not babyish.** Generated images carry **no text, no letters, no words, no numbers** — every glyph a child sees is rendered by the app in the app font, so it is always crisp and always correct. **[observed: house rule enforced by `tools/generateImage.mjs` prompts + `tools/checkLearnGamesIntegration.js`]**

---

## 4. The Sound Trail — full scope & sequence

40 stops. The order for Acts I–II **deliberately matches the school-facing sequence already in the app** (`CYCLE_SEEDS` → `elSkillsBlockCycles`, 27 cycles) **[observed: `src/data/elSkillsBlockCycles.js`]** so a child who plays at home meets sounds in the same order as their class. Act III is new — the repo has **no ladder past cycle 27 today** (the advanced code exists only as flat pattern lists and lexicon tags). **[observed: verified `advancedPhonicsPatterns.js` has 33 flat patterns with no ordering, and `elSkillsBlockCycles` contains no `a_e` / vowel-team / r-controlled entries]**

### Act I — Sunlit Meadow · 8 stops · 31 GPCs

| Stop | Name | New sounds | Also |
|---|---|---|---|
| 1 | Hollow Tree | `a` `m` `t` `s` | first blend: *at, am, mat, sat* |
| 2 | Fern Steps | `n` `i` `f` `d` | CVC blending |
| 3 | Rook Stones | `o` `l` `r` `h` | heart words A1: **I · the · is · a** |
| 4 | Otter Ford | `b` `w` `qu` `u` | segmenting starts |
| 5 | Bramble Gate | `c` `g` `p` `y` | heart words A2: **to · and · go · my** |
| 6 | Beehive Bluff | `x` `e` `v` `k` | CVC spelling |
| 7 | Fizzle Falls | `j` `z` · `ff` `ll` `ss` `zz` | doubles rule |
| 8 | **The Blend Festival** | — (boss stop) | everything from 1–7, mixed; first full sentence |

**[derived]** 26 single letters + `qu` + `ff/ll/ss/zz` = 31 GPCs, matching the standard Phase-2/early-Phase-3 set.

### Act II — Fossil Ridge · 9 stops

| Stop | Name | New sounds |
|---|---|---|
| 9 | Bone Arch | `sh` `ch` |
| 10 | Tar Pit | `th` (unvoiced) · `th` (voiced) · `ng` |
| 11 | Amber Ridge | `nk` `wh` `ck` |
| 12 | Rattlebones | final blends: `-st -nd -mp -nt -lt -sk` (CVCC) |
| 13 | Ash Flats | `s-` blends: `st- sp- sn- sk- sm- sw-` (CCVC) |
| 14 | Fern Canyon | `l-` blends: `bl- cl- fl- gl- pl- sl-` |
| 15 | Claw Pass | `r-` blends: `br- cr- dr- fr- gr- pr- tr-` |
| 16 | Whisper Pines | `y` as /ie/ (*by, my, try*) · `y` as /ee/ (*happy*) — first alternative pronunciation |
| 17 | **The Word Forge** | boss stop — segment & spell; heart words B (30) |

### Act III — Moonwood & Star Reach · 23 stops · one GPC family per stop

*Split digraphs* — 18 `a_e` · 19 `i_e` · 20 `o_e` · 21 `u_e` · 22 `e_e`
*Vowel teams* — 23 `ai`/`ay` · 24 `ee`/`ea` · 25 `igh`/`ie` · 26 `oa`/`ow`/`oe` · 27 `oo` (long) + `ue`/`ew` · 28 `oo` (short) · 29 `ou`/`ow` · 30 `oi`/`oy`
*R-controlled* — 31 `ar` · 32 `or`/`ore`/`aw` · 33 `er`/`ir`/`ur` · 34 `air`/`are` · 35 `ear` · 36 `ure`
*The Knowledge Tree* — 37 alternative pronunciations: `c`=/s/, `g`=/j/, `ea`=/e/, `ch`=/k/. The `ow`=/oa/ contrast is already taught at stop 29 alongside `ow`=/ou/ and is not repeated here.
*Morphology* — 38 `-s` `-ing` `-ed` · 39 `-le` · 40 `tion`
**Stop 40 doubles as the final boss: the Star Reach.**

**Source of every word used:** the existing `masterWordLexicon` + `src/content/lexicon/queries.js` (`getDecodableWordsForSkill`, `getWordsWithDigraph`, `getRhymingWords`, `getMinimalPairs`) and `src/data/generated/skillWordBank.generated.js`. **[observed]** No new word lists are invented by hand; a content check (§13) fails the build if any stop cannot find ≥6 decodable words that use only sounds taught at or before that stop.

### After stop 40 — endless review circuit *(live)*
The Trail returns to stop 1 and continues through the same 40 sections in order, but the review scheduler fills encounters with the child's own weakest due sounds. The authored world remains coherent while the learning content keeps changing. `trail.routeCursor` saves the current review section locally; it is journey state, not an achievement counter.

---

## 5. Session shape — what 15 minutes actually looks like

One **trail section** is designed for several minutes of walking, collecting and 1–3 short encounters. Several sections can run back-to-back as one uninterrupted play session.

```
TRAIL → walk and collect
      → meet the land guide and hear the new sounds
      → walk to helper 1; solve a short physical phonics task
      → collect and explore within the corridor
      → helper 2 / helper 3, drawn from new and due sounds
      → final helper's task opens the physical gate
      → walk through the gate; reward lands; next section begins
```

Reward density is deliberately high — **one reward per sound, one reward per stop**, exactly as TYM does it, and the part appears on the creature *instantly*, not in a menu. **[observed as TYM's design; adopted]**

**Stopping mid-way is a first-class case, not an edge case.** A checkpoint is written while walking, after every guide page and encounter beat, and on Den, Close, tab hide, page hide and unmount. Re-opening restores the exact section position and active task.

---

## 6. Mastery — the gate, precisely

Each GPC carries a record:

```js
{ seen: 14, correct: 12, streak: 3, shells: ["stones","bridge"], sessions: 2, state: "learning", lastAt: "2026-07-11" }
```

**A GPC becomes `mastered` when all four hold:**
1. `correct >= 8`
2. accuracy over the **last 10 attempts** `>= 0.85`
3. `shells.length >= 2` — proved in at least two *different* mini-game shells (kills shell-specific pattern-matching)
4. `sessions >= 2` — proved on at least two *different* days (kills same-sitting cramming)

**States:** `not-started → learning → mastered → retired`. `retired` = mastered and then survived one spaced review ≥12 stops later; retired items are still sampled at 1-in-10 so nothing rots.

**A mastered GPC can fall back to `learning`** if it is missed twice in a row on review. Mastery is a claim about the child, and claims get retested.

**The gate gates nothing narrative.** It only decides what the review scheduler serves next, and what colour the stone is on the Den wall (dull = learning, lit = mastered). The child is never told "you failed" and never blocked.

**Implementation:** `src/utils/questMastery.js` — pure, no DOM, no React. Exports `recordAttempt(record, {gpc, correct, shell, at})`, `masteryState(record)`, `weakestGpcs(mastery, n)`. Unit-tested against a table of scenarios including the "crammed it all in one sitting" case, which must **not** return `mastered`.

---

## 7. Review scheduling — how old sounds come back

`src/utils/questReviewScheduler.js` — pure, unit-tested. Leitner-lite with 5 boxes:

| Box | Next due | Enters when |
|---|---|---|
| 1 | this stop | new, or missed |
| 2 | +2 stops | 1 correct |
| 3 | +5 stops | 2 correct |
| 4 | +12 stops | mastered |
| 5 | sampled 1-in-10 | retired |

**Every stop's target list = 4 new GPCs + up to 4 due review GPCs**, review items drawn highest-weight-first where `weight = errorRate × recencyDecay`. Cap 8 targets per stop so a struggling child never faces a wall.

**Within a shell**, misses are handled by the existing `makeCatchUp(targets, {requeueGap: 3})` — a missed target is re-inserted 3 places back and the level does not end until every target, including recovered ones, is done. **[observed: `src/utils/catchUpQueue.js`, already unit-tested]** We reuse it as-is.

---

## 8. Mini-game shells

TYM's single loudest criticism, across Common Sense Education and teacher reviews, is **repetition fatigue** — 4–5 shells stretched across 43 weeks. **[observed]** We ship **ten** shells, and each is re-skinned per act (same mechanic, different land/props/music), so a child sees 30 apparent variations.

Every shell obeys one contract so they are interchangeable:

```js
// props in
{ targets, difficulty, world, isSoundEnabled,
  onItem(gpc, correct, ms),   // every single response, for mastery + analytics
  onProgress(done, total),
  onDone({correct, total, mistakes}) }
// the shell owns no progress state, saves nothing, knows nothing about the map
```

| # | Shell | Teaches | Mechanic | ~Time |
|---|---|---|---|---|
| 0 | **Knowledge Tree** | explicit instruction | Not a game. Shows the grapheme large, plays the *letter name*, then the *sound*, then 3 example words with tappable audio; a short mouth-shape still. Tap to continue. | 60s |
| 1 | **Sound Stones** | GPC recognition (sound→letter) | Hear /sh/, tap the stone carved `sh` among 3–4. Stone glows and flies to your pouch. | 90s |
| 2 | **Beast Feed** | GPC recall (letter→sound) | See `ch`, three creatures each *say* a sound; feed the right one. Reverse direction of #1 — this is what makes rule 3 of §6 bite. | 90s |
| 3 | **Trail Run** | fluent GPC recognition under time | Side-scrolling run; the trail forks; take the fork signed with the grapheme you just heard. Speed ramps. | 90s |
| 4 | **Stone Bridge** | blending | Hear *ship*. Tap graphemes in order (`sh`-`i`-`p`); each correct tap lays a plank; creature walks across. Wrong tap = plank wobbles, no fall, retry. | 90s |
| 5 | **Echo Cave** | segmenting / spelling | Hear *chop*. Tap out the sounds you hear, in order, from a grapheme keyboard. Each correct sound echoes back in the gold voice. | 90s |
| 6 | **Sound Sort** | minimal pairs & alt pronunciations | Two pens. Drag creatures/objects into the pen for the sound they contain (`ow` as in *cow* vs `ow` as in *snow*). | 90s |
| 7 | **Word Beast** | heart / tricky words | The Beast is hungry for **said**. Three word-cards float past. Feed it the right one three times and the word *joins you* — it becomes a small creature that lives in your Den. (Straight lift of TYM's "Trickies", which is the single best sight-word mechanic in the category — a collection, not a flashcard.) | 90s |
| 8 | **Trail Signs** | read-to-act comprehension | A sign says **"Tap the red rock."** Do it. Then two-step instructions. Reading has a *consequence*, not a score. | 90s |
| 9 | **Story Stones** | decodable sentence & page reading | Read a 2–4 sentence decodable page (built only from taught sounds). Choose which of two paths the creature takes. Every word is **tappable for audio**. | 2–3 min |

**Two features the market is missing and we add for free** (both are the most-requested things in TYM's reviews): **the letter name is spoken as well as the sound**, and **every word in every sentence is tappable for audio**. **[observed as gaps in TYM reviews]**

**Which shells run at which stop** is data, not code — a `shells: []` array per stop in `src/data/questSequence.js`.

**Reuse:** shells 1–6 are new but small (each ~150–250 lines of imperative canvas/DOM inside a mount div, the pattern every existing arcade game already uses). Shell 9 can lean on the existing `StoryQuestPlayer` page renderer. The 11 existing arcade games stay where they are and appear as **optional bonus stops** on the map — a fairground you can walk into, not a required step.

---

## 9. Save file, persistence, and the resume rule

**New progress area** `"phonics_quest"`, added to `PROGRESS_AREAS` and `localProgressStorageKey()` in `src/utils/progressKeys.js` **[observed: the 9 existing areas are `story_quests, phonics_letters, cvc, learn_games, el_quest, daily_mission, profile, guided_reading, hollow`]**. Local key: `lp-quest:<scope>`. Cloud: one `student_progress` row, `area="phonics_quest"`, `key="__all__"`, upsert on `(student_id, area, key)`. Synced through the existing `queueProgressSave()` (1800 ms debounce, offline queue, forward-only merge). **[observed: `src/utils/progressSync.js`, `src/utils/progressMerge.js`]**

```jsonc
{
  "v": 1,
  "creature": {
    "body": "tuft", "dye": "moss", "pattern": "spots",
    "eyes": "round-2", "mouth": "grin", "crest": "horns-3", "tail": "fan", "feet": "paws",
    "equipped": { "head": "leaf-cap", "back": "moth-wings", "neck": null, "held": null }
  },
  "trail":   { "stopsDone": ["s1","s2","…"], "stars": { "s1": 3 }, "drops": { "s1": 14 }, "routeCursor": 12 },
  "mastery": { "sh": { "seen":14,"correct":12,"streak":3,"shells":["stones","bridge"],"sessions":2,"box":3,"state":"learning","lastAt":"2026-07-11" } },
  "stones":   ["a","m","t","s","n"],
  "trickies": ["the","is","to","and"],
  "ledger":   { "spent": 240, "purchases": [{ "id":"leaf-cap","at":"2026-07-10" }] },
  "checkpoint": { "stopId": "s12", "phase": "trail", "position": { "x": 1.2, "z": -67.4 }, "guideDone": true, "activeId": "s12-1", "beatIndex": 1, "solved": ["s12-0"], "drops": ["s12-drop-0"], "tally": { "correct": 4, "total": 5, "mistakes": 1 } }
}
```

**Rules, all inherited from what the app already does and must not be broken:**

- **Rewards are derived, never stored.** Sparks earned = a pure function of stars earned across stops. The *only* stored economy is the **spend** ledger. Same shape as `hollowState.js` / `hollowEconomy.js`. **[observed: this is rule #7 in `docs/IMPROVEMENT_LOOPS.md`]** Which means: a child cannot lose their gear by a sync race, and a teacher reset wipes cleanly.
- **Forward-only merge.** Cloud can add, never wipe. Mastery counters merge by `max`, arrays by union, `state` by `mergeStatusForward` (never regresses via a merge — only via a real miss). **[observed: `src/utils/progressMerge.js`]**
- **`checkpoint` is excluded from forward-merge** — it is resume state, not achievement. Merging two devices' checkpoints would teleport a child. **[observed: existing exclusion, keep it]**
- **Checkpoint written throughout the journey and on every exit**, not only at stop completion. Movement saves are throttled; exit saves are immediate.
- **Offline works.** The app is already offline-tolerant (local-first, queue-and-flush). The quest must not regress that: no shell may require a network call.

---

## 10. The creature — creator, renderer, animation

Benjamin chose a **build-your-own creature**, not a re-skin of the 6 existing pals. That is the right call for ownership (TYM's own stated rationale: *"creating an emotional engagement with their character"* — it is the motivational spine of the whole product **[observed]**) **and it is the single biggest technical risk in this plan**, so it gets prototyped first, in Slice 1, before anything else is committed.

**Why it's a risk:** the existing pal avatars are **whole-image WebP swaps** — one file per pal *per outfit* (90 files = 6 pals × 15 states). Layering was tried on that pipeline and **abandoned**, because the image model regenerates every pixel and diff-masks cover the whole canvas. **[observed: documented in the header of `tools/generate-pal-avatars.mjs`]** We therefore cannot generate creature parts with the image tools we have. **A parts-based creature must be vector.**

### The renderer

`src/components/quest/CreatureFigure.jsx` — composes one `<svg>` from `<use>` references into a symbol sprite, in fixed z-order:

```
tail → back-gear → body → pattern-overlay → limbs → feet → belly → mouth → eyes → crest/horns → head-gear → held-item
```

- **One SVG symbol sheet per slot**, in `public/creature/<slot>.svg`, 512×512 viewBox, shapes filled with `var(--cr-skin)`, `var(--cr-skin-dark)`, `var(--cr-accent)`, `var(--cr-eye)` — so **dyes recolour without a single new file**. 12 dyes × 6 bodies = 72 looks from 6 shapes.
- **Anchors.** Every body declares named anchor points (`headTop`, `neck`, `backMid`, `handL/R`, `footL/R`, `tailBase`) in body-local coordinates, in `src/data/creatureParts.js`. Gear and parts attach to anchors, not to absolute coordinates — this is what stops a hat floating off a different-shaped head. A unit test asserts **every body declares every anchor** and **every part declares the anchor it uses**.
- **Combinatorics (v1):** 6 bodies × 12 dyes × 4 patterns × 10 eyes × 8 mouths × 10 crests × 8 tails × 6 feet = **13.2 million** distinct creatures from **~60 hand-authored SVG symbols**. **[derived]**
- **Gear** (the reward drops) — 5 slots (head, back, neck, held, feet), ~40 items across the three acts. Gear may be raster (WebP) if it is a rigid attachment, since it does not need recolouring.

### Animation (all CSS/transform on SVG groups — zero extra art)

| State | Motion |
|---|---|
| idle | breathe: body `scaleY` 1 → 1.02, 2.4s ease-in-out infinite; blink: eyes `scaleY` → 0.1 for 90ms every 3–6s (jittered) |
| walk | 2-frame squash + 6° leg swing + tail lag (a `transform-origin` at `tailBase`, 0.4s) |
| cheer | jump `translateY(-18px)` + `rotate(-4deg)`, confetti burst, ears/crest overshoot |
| think | head tilt 6°, one blink held |
| sad | 12% squash, eyes `scaleY 0.7`, slow tail droop — **used for a wrong answer, never for a failed stop** |
| hatch | egg wobble ×3 → crack SVG mask reveal → creature pops out at 1.4 scale → settles |

All motion is behind `@media (prefers-reduced-motion: reduce)` — the app already respects this in `ConfettiCelebration.jsx`. **[observed]**

### The creator screen (first 90 seconds of the game, before any phonics)

Full-bleed. Big creature centre. Bottom bar of slot tabs (Body · Colour · Eyes · Mouth · Crest · Tail · Feet). Tap a tab → a horizontal reel of options → tap one → **it applies live, with a small bounce**. A green tick confirms and the egg hatches. Re-editable forever from the Den (a "hanger" button). Locked options show as dim silhouettes with a small stone icon — *this is where the child learns that stones buy parts.*

---

## 11. Screens & UI

Rendered in a **portal to `document.body`** and requested fullscreen — the same fix already proven in `GamePlayer.jsx`, because framer-motion's transform on an ancestor traps `position: fixed` and silently breaks full-screen. **[observed: this exact bug was found and fixed; do not re-introduce it]**

| Screen | Contents |
|---|---|
| **Den** (hub) | Your creature, idle-animating, centre. The **Stone Wall** behind it (every GPC as a carved stone; dull = learning, lit = mastered, empty socket = not met). Your **Trickies** on a shelf. Buttons: *Walk the Trail* (primary), *Change my creature*, *Trading Post*. Sparks count top-right. |
| **Map** | The wide illustrated land, scrollable/pinch-zoom. Stops as carved markers along a drawn road. Your creature **glides along the road path** between stops. Completed = lit + star count. Next = pulsing. Later = fogged silhouette. |
| **Stop** | 10s arrival cutscene → the shell sequence. Persistent slim HUD: back, pause, sound toggle, progress pips (one per shell), sparks. |
| **Teach** | Grapheme huge, centred. "Listen" button (letter name → sound). Three example word cards, each tappable. Mouth-shape still. |
| **Shell** | Full-bleed game canvas. Nothing but the game and the HUD. |
| **Gate** | A stone door. 6 items, no hints, no retries. The door opens regardless — the *number of stones lit* is what changes. |
| **Reward** | Stone flies to the wall (a satisfying arc + `playStoneChime`). Then the part drops onto the creature with a bounce. Confetti (reduced-motion aware). |
| **Trading Post** | Grid of parts/dyes/gear with spark prices. Owned = ticked. Unaffordable = dimmed with the price. No IAP, ever. |

**Touch targets ≥ 64 px.** **Text ≥ 22px** in child-facing UI. **No emoji anywhere in the runtime** — this is enforced by an existing check that fails the build. **[observed: `tools/checkLearnGamesIntegration.js` greps for emoji and fails]** Every icon is an SVG or a WebP.

**Styling:** one new layer, `src/styles/quest.css`, imported **by the quest root component**, not by `App.css` — the same way `src/styles/sentence-express.css` is imported by `SentenceExpressGame.jsx`. **[observed]** It keys off `[data-pal-world]` so it inherits `--pal-accent` / `--pal-deep` / `--pal-banner` from `pal-worlds.css` for free. The import order in `main.jsx` (`index.css` → `App.css` → `student-vibrant.css` → `comic-theme.css` → `hollow.css`) is load-bearing and must not be touched. **[observed]**

---

## 12. Audio — full spec

**The rule that overrides everything:** **no synthetic speech, ever.** Browser TTS is a deliberate no-op in this codebase (`speakWithBrowser()` returns nothing; `audioSpeechPolicy.js` sets `browserTtsAllowed: false`), and generated TTS for phonics **failed human ear-checks twice** and is banned by rule #3 of `docs/IMPROVEMENT_LOOPS.md`. **[observed]** When a recording doesn't exist, the app is **silent** and hides the Listen button (`hasRecordedSpeech()`). Every clip below is a **gold-voice human recording**, requested through the established `docs/KIMI_GOLD_VOICE_*.md` route.

### Reused (already in the repo — zero new recording)

All counts below are **[observed]** — I listed the folders:

| Path | Files | Covers |
|---|---|---|
| `/audio/phonemes/<g>.mp3` | **43** | a–z, `qu`, `sh ch th wh ng nk ck`, `ff ll ss zz`, `all ing ong ung ang`, `short_a…short_u` — i.e. **all of Act I and Act II** |
| `/audio/child-mode/clean-human/graphemes/{consonants,digraphs_blends,short_vowels,r_controlled,silent_e,vowel_teams}/` | **69** | including **`silent_e` (5: a_e e_e i_e o_e u_e)**, **`r_controlled` (5: ar er ir or ur)**, **`vowel_teams` (17: ai ay ea ee eigh ew …)** |
| `/audio/child-mode/clean-human/words/<slug>.mp3` | **697** | decodable words |
| `/audio/child-mode/clean-human/hfw/<slug>.mp3` | **163** | heart / tricky words |
| `/audio/letter-names/<letter>.mp3` | **26** | the letter names — needed for the Knowledge Tree, and **already complete** |

> ### ⚠️ A finding worth acting on
> **The advanced-code phonemes are already recorded and no code can reach them.** `speakPhoneme()` truncates its input to a single character (`.slice(0, 1)`) and only looks in `/audio/phonemes/`. `graphemeAudioPath()` (the EL Quest one) resolves `consonants`, `digraphs_blends` and `short_vowels` — but **not** `silent_e`, `r_controlled`, or `vowel_teams`. So **27 gold-voice clips for the entire Act III code are sitting on disk, paid for, unreachable from the running app.** **[observed: read `src/utils/learnGamesAudio.js:110-137` and `src/components/elQuest/elQuestEngine.js:71-84`, then listed the folders]**
>
> The quest adds one small function — `speakGrapheme(g)` in a new `src/utils/questAudio.js` — with the full resolution chain across all six folders. That one function unlocks Act III's audio for free, and is worth doing in Slice 1 even though Slice 1 only needs `a m t s`.

### New clips required (voice only — the phonemes above are done)

### New clips required

These are **sentences**, not phonemes — the phonemes are all recorded already.

| Set | Count | Example line |
|---|---|---|
| Shell instructions | **10** (1/shell) | *"Listen to the sound. Then tap the stone that makes it."* |
| Teach lines (per GPC) | **~60** | *"These two letters, s and h, work together. They say /sh/. Ship. Shop. Fish."* |
| Stop intros | **40** | *"Fossil Ridge. The stones here are old and buried deep."* |
| Stop outros | **40** | *"You've got them all. The road runs on."* |
| Praise (varied, randomised) | **14** | *"Got it." · "That's the one." · "Nice ears on you."* |
| Gentle retry | **8** | *"Not that one. Listen again."* |
| Creature creator | **6** | *"Make your creature. Anything you like."* |
| Story/boss beats | **8** | act openers, Star Reach finale |
| **Total new voice** | **≈186 clips** | |

### Music & SFX

- **Music** — 3 act loops + Den loop + boss sting: `/audio/music/quest/{meadow,ridge,moonwood,den,boss}-loop.mp3`. Generated by the existing `npm run generate:arcade-music` pipeline, played through `startGameMusic(trackId, { fallbackWorldId })`, which already handles fades, autoplay-policy retry, and HEAD-probing for missing files. **[observed: `src/utils/audio/gameMusic.js`]**
- **SFX — synthesised, no files.** Extend the existing WebAudio module `src/utils/audio/gameSfx.js` (which already gives us `playCorrectChime`, `playSoftBuzz`, `playPopSound`, `playStarChime`, `playCelebrationFanfare`, `playWhoosh` **[observed]**) with three new ones: `playStoneChime` (stone lands on wall), `playHatchCrack` (egg), `playPlankDrop` (Stone Bridge). Zero download cost.
- **Every new file must appear in `AUDIO_FILE_PATHS`**, which is regenerated in `prebuild` by `tools/generateAudioManifest.js`. Runtime never probes URLs. **[observed]**

**[needs-Benjamin]** Every voice clip and every music loop needs a human ear-check before it ships. I will not claim an audio file "sounds right" — I will give you a rendered preview page listing every new clip with a play button and a pass/fail tick.

---

## 13. Images — full spec

| Asset | Count | Size / format | Notes |
|---|---|---|---|
| Act maps | 3 | 2752 × 1536 WebP | Same spec as the existing `/images/pals/maps/<world>-map-wide.webp`. Stop coordinates live in `src/data/questStops.js` as % coords, with a drag-and-drop admin editor cloned from `MapStopEditor.jsx` so **you** place the markers, not me. **[observed: this exact system exists for EL Quest]** |
| Stop backdrops | **12**, reused 3–4× | 1280 × 720 WebP | 4 per land. Reuse beats 40 unique — a child registers the *land*, not the frame. |
| Creature parts | ~60 | **SVG**, 512 viewBox | Hand/code-authored vector. **Cannot come from the image generator** (§10). |
| Gear | ~40 | 512 × 512 WebP w/ alpha | Rigid attachments; raster is fine. |
| Trickie creatures | **8 shapes × 4 dyes = 32** | 256 × 256 WebP | 8 files, recoloured in CSS. |
| Sound Stones | **1** | 256 × 256 WebP | One stone plate; **the grapheme is rendered by the app in the app font on top**. This is how we get 60 stones from one image, always crisp, never a typo. |
| Props (shell furniture) | ~30 | 256–512 WebP | Rocks, planks, pens, signs, the Beast, the egg. |
| Egg | 3 | 512 WebP | intact / cracked / open. |
| **New raster files** | **≈120** | | vs. ~400 if we were naive about it |

**Generation:** `npm run gen:image -- --batch tools/image-jobs/quest-*.json` → `tools/generateImage.mjs` (gpt-image-1 → sharp → WebP). **I cannot run this** — the sandbox has no network to the image API. **[observed]** I will write the batch job files and hand you a copy-paste command.

**Every prompt ends with:** *"no text, no letters, no words, no numbers; realistic cartoon; no rainbow; no faces on objects."*

**[needs-Benjamin]** Art is the one thing I cannot verify. Every batch gets a rendered contact sheet (the repo already has `npm run build:image-qa-contact-sheets`) for you to tick off before anything is wired in.

---

## 14. Teacher side

The quest writes to the same tables the teacher dashboard already reads, so this is mostly a new panel, not new plumbing.

- **GPC heat map** per child — every grapheme as a tile: not-started / learning / mastered / retired. This is the thing TYM's dashboard does that teachers actually praise ("strongest and weakest grapheme"). **[observed]**
- **Weakest five**, with the exact accuracy and the last date attempted.
- **Minutes played, stops done, current stop.**
- **Practice assign** — *the highest-leverage teacher feature in the whole category*: pick **any** GPC, pick **any** shell, and drop it in front of the child as their next activity. TYM only added this because a reviewer begged for it in 2017. **[observed]** We ship it in v1.
- Every response is logged via the existing `logStudentActivity(area, itemId, event, payload)`. **[observed]** This matters beyond the dashboard: **nobody in this market — TYM included — has a published efficacy trial.** If we log every item response from day one, we are the only ones who *could* run one.

---

## 15. Checks — what "done" means for this feature

Nothing here ships on "should work". Named checks, all green:

**New unit tests (`node --test tests/unit/*.test.js`):**
- `questSequence.test.js` — 40 stops; every stop's GPCs are unique across the trail; no stop introduces a sound that a later stop also introduces.
- `questMastery.test.js` — the four-condition gate, *including* the negative cases: crammed-in-one-session ≠ mastered; one-shell-only ≠ mastered; mastered-then-missed-twice → learning.
- `questReviewScheduler.test.js` — box promotion/demotion; ≤8 targets per stop; a never-mastered item keeps reappearing forever.
- `questProgress.test.js` — forward-merge of the save file; **a cloud merge can never lower a mastery counter**; checkpoint is excluded from merge.
- `creatureParts.test.js` — every body declares every anchor; every part names a real anchor; every part id in the manifest has a matching SVG symbol id.
- `questShellContract.test.js` — every shell module exports the same contract and calls `onItem` exactly once per response.

**New content check — `npm run check:quest` (`tools/checkQuestIntegrity.js`):**
- Every stop can source ≥6 decodable words using **only** sounds taught at or before that stop *(this is the check that catches a designer sneaking `ai` into stop 3)*.
- Every GPC in the trail has a teach-audio path present in `AUDIO_FILE_PATHS`.
- Every image referenced by the trail exists under `public/`.
- No emoji, no raw hex outside the token allowlist, in `src/components/quest/**`.

**The existing full gate must stay green:**
```bash
rm -f .DS_Store && rm -rf dist && npm run build && npm run test:unit && npm run lint \
  && npm run check:approved-runtime-sources && npm run check:distractor-onset-giveaway \
  && npm run audit:app-image-inventory && npm run check:media-overwrite-risk \
  && npm run check:repo-hygiene && npm run check:learn-games && npm run check:quest
```

**Two honest limitations, stated up front:**
1. **I cannot run `npm run build` in my sandbox** (the rolldown linux-arm64 binding is 403-blocked) or the image-inventory audit. **[observed, repeatedly]** I verify tests + lint + content checks in-sandbox and hand you the full gate as one copy-paste line.
2. **I cannot judge whether art or audio is good.** Every visual and audio deliverable comes with a preview you click through, not a claim from me.

---

## 16. Names

I've written the plan as **Sound Seekers**. Alternatives, in case it doesn't land:

- **Sound Seekers** — plain, says what it is, ages well.
- **The Long Trail** — atmospheric, fits the road; less obviously about phonics.
- **Stone & Song** — most evocative, most likely to confuse a parent scanning a menu.
- **Beastie Trail** — ties to the existing Hollow "beasties" lore; risks sounding babyish, which is against our art direction.

Code id stays `phonics-quest` regardless, so a rename is a one-line copy change forever.

---

## 17. Build order — vertical slices

| Slice | What lands | You can… |
|---|---|---|
| **0 — Foundations** | Pure modules only, no UI: `questSequence.js`, `questMastery.js`, `questReviewScheduler.js`, `creatureParts.js`, the `phonics_quest` progress area + merge rules. All unit tests green. | see green checks, not a game |
| **1 — One playable stop** *(the proof)* | Creature Creator → hatch → Den → Act I map → **Stop 1** → Teach + 3 shells (Sound Stones, Beast Feed, Stone Bridge) → Gate → Reward → save & resume. Placeholder art where needed, real gold-voice audio for stop 1. | **play it, end to end** |
| **2 — Act I** | 8 stops, 6 shells, heart words, review scheduler live, the 3-minute placement Sound Check, Den stone wall. | play the whole Meadow |
| **3 — Act II** | 9 stops, Echo Cave + Sound Sort + Word Beast, Trading Post + gear economy. | play the Ridge |
| **4 — Act III** | 23 stops, Knowledge Tree, Trail Signs, Story Stones. | play the whole trail |
| **5 — Round-off** | Teacher panel + practice-assign, Free Roam endless mode, bonus arcade stops on the map. | ship it |

**Slice 1 is the gate on everything else.** It exists to answer one question — *does a layered SVG creature look good enough to love?* — before we build 40 stops on top of it. If the answer is no, we fall back to hybrid (pick a base pal, layer colour + accessories) at a cost of one slice, not the whole project.

The file-by-file spec for Slice 1 is in **`docs/QUEST_SLICE_1_SPEC_2026-07-11.md`**.

---

## 18. Risks, named, with the mitigation

| Risk | Likelihood | Cost | Mitigation |
|---|---|---|---|
| **Layered SVG creature looks cheap** next to the app's lush WebP art | Medium | High — it's the emotional spine | Prototype it *first*, in Slice 1, and look at it before building anything else. Fallback: hybrid pal-base + layered accessories. |
| **186 new voice clips** is a long lead time | High | Medium | Batch into 3 Kimi request docs by act; Slice 1 needs only ~20 clips. The game is silent-but-functional without them, by design. |
| **40 stops × 4 shells is a lot of content** | High | Medium | Content is *data* — one `questSequence.js` drives everything; the shells are written once. Word lists come from the lexicon by query, not by hand. |
| **Bundle size** — a whole new mode | Medium | Medium | Lazy-load the quest root via `lazyWithRetry`; per-act image loading; `npm run check:bundle-size` is already in the gate. |
| **It steals time from EL Quest** (the school-facing product) | Medium | Medium | It doesn't replace it — and it *shares the same sound order*, so home play reinforces class work. That's the pitch to teachers. |
| **I can't build-verify or eye-check** in my sandbox | Certain | Low, if handled | Every hand-over is a copy-paste gated command + a rendered preview. Never a "should be fine." |

---

## 19. What I'd do differently from Teach Your Monster

For the record, since this is what makes it worth building rather than just recommending TYM:

1. **A real mastery gate** — they don't have one, and a parent reviewer nailed the consequence: *"as long as the child has done all the activities in level 1, even if he is still struggling, the game will still move on to level 2."* **[observed]**
2. **A placement test** — they don't have one; the *parent* picks the starting game. Every serious competitor has one.
3. **Ten shells, not four** — their #1 criticism is repetition.
4. **Letter names spoken alongside sounds** — their #1 parent request.
5. **Every word in every sentence tappable** — their #2 parent request.
6. **A sequence that matches the child's actual classroom** (ours does, by construction).
7. **Log every response** so the efficacy question is answerable. Nobody in this category — TYM included — has a published trial. **[observed: verified absence across web, ERIC, and their own site; they list "adding better ways to measure impact" as a reason for their 2026 rebuild]**

---

### Sources (external research)

- [Teach Your Monster — what each game covers](https://www.teachyourmonster.org/teachers/helpful-articles-for-teachers/what-does-each-game-cover)
- [Teach Your Monster — mini games](https://www.teachyourmonster.org/teach-your-monster-to-read-mini-games/)
- [Game Guide 1 — First Steps (PDF)](https://www.teachyourmonster.org/wp-content/uploads/2025/12/TYMTR1-gameguide-2025_KL_01.pdf)
- [Game Guide 3 — Champion Reader (PDF)](https://www.teachyourmonster.org/wp-content/uploads/2025/12/TYMTR3_game_guide_3.pdf)
- [Making Monster Magic 1 — narrative vs pedagogical progress (Mar 2026)](https://www.teachyourmonster.org/monster-news/making-monster-magic-01/)
- [Important update: changes to Teach Your Monster to Read (May 2026)](https://www.teachyourmonster.org/monster-news/important-update-changes-to-teach-your-monster-to-read/)
- [What research has gone into the new version?](https://help.teachyourmonster.org/en/articles/15820728-what-research-has-gone-into-the-new-version-of-teach-your-monster-to-read)
- [Common Sense Education review — "limited learning potential"](https://www.commonsense.org/education/reviews/teach-your-monster-to-read)
- [The Smarter Learning Guide review](https://smarterlearningguide.com/teach-your-monster-to-read-review/)
- [Reading Eggs — why it works](https://readingeggs.com/about/why-it-works/) · [Lalilo](https://www.lalilo.com/en) · [Phonics Hero](https://phonicshero.com/phonics-app/) · [Nessy Phonics](https://www.nessy.com/en-us/phonics) · [Poio](https://kahoot.com/home/learning-apps/poio/)
