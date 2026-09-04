# Sound Seekers v3 — "The Story Trail"

**Status:** decided and in build (2026-09-04). This document replaces the 2026-09-01
spec's invented resident cast and the 2026-09-04 "10000%" proposal as the plan of
record for the child-facing Sound Seekers game. Learning rules from
`docs/design/GAME_DESIGN_BIBLE.md`, `docs/design/LEARNING_POLICY.md`,
`docs/content/QUESTION_DESIGN_BIBLE.md` and `docs/design/CHILD_SURFACE_RULES.md`
still apply in full.

**The brief (Ben, 2026-09-04):** keep the main idea — moving around a large world
map along a corridor, meeting characters from our books who have problems we fix
by solving educational puzzles (teaching moments, logic puzzles, phonics
questions, sight/high-frequency word mini games). Every encounter opens a new 2D
platform area where the puzzle is clearly visible. Graphics totally improved.
Gameplay and educational logic vastly improved.

---

## 1. What Sound Seekers is today, honestly

Screenshots taken 2026-09-04 from `/preview/child-surfaces.html?surface=sound-seekers`:

- The "campaign map" is a scrolling list of 40 cards.
- The world screen is a static painted map with three generic icons (a trail
  marker, a book, a hint) and an arrow pad. Nothing on it is a puzzle.
- Teaching is a worksheet card ("Meet a in apple") over the map.
- With sound off, play deadlocks on "Listen to continue" (instruction-audio gate).
- The newest commits ("playable Seedwake Echo Hunt example") are one static
  HTML mock-up in `public/preview/`, not a game.
- Under the hood there are 70k lines and 54 unit tests of evidence engine, and
  a Phaser instance that moves one invisible dot. The engine is careful; the
  game is not a game.

None of that is worth patching. Pre-launch, we make the right call
(`feedback_pre_launch_bias_to_action`): new runtime, same curriculum.

---

## 2. The game in one paragraph

You are a **Sound Seeker** — you play as **Speedy** the border collie (or Chompy
the T-rex, or Pip from Moonwood). One long painted **trail** winds through three
lands from our books: **Sunny Meadow Farm** (Meadow Pals), **Sunny Hollow / Dino
Land** (Dino Pals) and **Moonwood** (Moonwood Tales). Forty **story stops** sit
along the trail, one per stop of the phonics scope and sequence. At each stop a
character from the books is waiting with a problem: Muddy has lost his bath
things in the Hollow Tree; Bouncy bounced straight through the Bramble Gate and
broke it; Noisy's crow is stuck and the Singing Weir won't sing. You tap the
character, and the trail **opens up into a side-scrolling platform area** — a
little 2D level where the puzzle is built into the scenery: letter crates on
platforms, a bridge with missing planks, stepping stones that blend into a word,
a lantern tree of heart words, a gate that only the right key opens. You listen,
decide, and the world answers: the plank lands, the gate swings, the lantern
lights, the character cheers. When the problem is fixed you walk back onto the
trail and the path ahead glows.

The literacy decision is the only thing that moves the story forward. Running
and jumping are how you get to the decision; they never make it for you.

---

## 3. The world: one corridor, three lands, forty stops

### 3.1 Map

- One continuous world image, **6144 × 1024 px**, made of four painted panels
  stitched left to right: Meadow (s1–s10), Dino Land (s11–s20), Moonwood dusk
  (s21–s30), Moonwood night (s31–s40). The camera scrolls horizontally and
  follows the hero; the whole world is roughly eight screens wide.
- The **corridor** is the painted path. Stops are placed on it by hand
  (`content/trail.js` holds x/y per stop, read off the finished panels). The
  hero walks node to node along a smooth curve through those coordinates —
  Mario-World style. Tap the next stop, press → , or use the on-screen arrows.
- Only completed stops and the next stop are walkable. Locked stops still
  **show their character** waiting in the distance (small, desaturated), so the
  child can see who is ahead — that is what makes it feel like a large world
  rather than a menu.
- Land borders are diegetic: a painted hedge/cliff/river band with a signpost.
  Crossing one plays a short "new land" reveal.
- Every stop shows its **landmark name** on a wooden sign (the questSequence
  names: Hollow Tree, Fern Steps, Rook Stones …) and a small lantern that is
  unlit until the stop is repaired.

### 3.2 Cast (characters from our books)

Canon: `docs/content/STORY_BIBLE_PART_2_CANON.md` §3. Two "Bouncy"s exist in
canon (Meadow lamb, Dino spring-dino); the game uses the Meadow Bouncy only and
never the Dino one, so a child never sees two characters with one name.

| Land | Stops | Characters used |
| --- | --- | --- |
| Sunny Meadow Farm | s1–s10 | Muddy, Woolly, Clucky, Splashy, Bouncy, Brave, Giggly, Hungry, Cuddly, Noisy (+ Grumpy, Sleepy, Shy, Tiny as cameos) |
| Sunny Hollow / Dino Land | s11–s20 | Sunny, Grumpy (ankylosaur), Wiggly, Zippy, Honky, Bossy, Dozy, Fancy, Cheeky, Shy (dino) |
| Moonwood | s21–s40 | Wren, Stone, Fern, Glimmer, Flint, Burrow, Spark, Luna — each twice with a new problem — plus returning Meadow/Dino friends |
| Heroes | — | Speedy (default), Chompy, Pip. A hero is never an NPC. |

The full stop → character → problem → fix table is authored in
`src/features/soundSeekers/v3/content/trail.js` and rendered in Appendix A.

---

## 4. The encounter: trail → platform area → fix

Every stop is a short **mission** of 4–7 beats, always in this order:

1. **Meet** — the character says its problem in one line (spoken + shown):
   *"My bath things fell in the Hollow Tree! Help me find the /m/ sounds."*
2. **Sound Signpost** (only when the stop teaches new letters/sounds) — one
   signpost per new grapheme: big letter, tap to hear the sound and its anchor
   word, "say it with me". Unscored. A target is never scored before its signpost.
3. **Puzzle beats** (2–4) — chosen by the director from the stop's targets and
   the review queue; each beat is one of the mechanics below, in its own part
   of the level.
4. **Fix** — the last correct decision repairs the landmark (the plank lands,
   the gate swings, the weir sings). The character celebrates. The child
   collects the stop's **story token** (a little picture of the fixed thing).
5. **Back to the trail** — the lantern at the stop lights; the next stop glows.

The level is a side-scroller two to four screens wide. Each beat lives in its
own "room" of the level, left to right, so the child physically moves from
puzzle to puzzle. The camera frames the active puzzle; the HUD signboard
always shows the current target and a replay button.

### 4.1 Controls (all equivalent — Game Design Bible rules 45–51)

- **Touch:** left/right and jump on the lower-left, a big **Pick** button on the
  lower-right; or simply **tap a puzzle object** — the hero auto-walks to it and
  picks it (select-then-place alternative to every drag).
- **Keyboard:** ← → / A D move, Space / ↑ jump, Enter / E pick the nearest
  object, 1–4 pick option n, R replay, Esc pause.
- **Every choice object also exists as a real DOM button** in the HUD (56 px,
  labelled by what it says, not what it looks like), so switch, screen-reader
  and keyboard-only children can answer without platforming at all.
- Motor assists (auto-walk, slower hero, larger objects) never change the
  answer set, the target, or the evidence.

### 4.2 Feedback and the error ladder (Question Design Bible + GDB)

- The item and all choices stay exactly where they are after a wrong answer.
- **First error:** the chosen object says its own sound and the target is
  replayed: *"That one says /s/. Listen again — /m/."* The object wobbles and
  settles. Nothing is lost.
- **Second error:** the character points at the right object (model), the
  child taps it, and the attempt is recorded as **supported**, not independent.
- No timers, lives, streaks, red flashes or "wrong" text ever reach the child.
- Correct answers respond *in the world* (plank, gate, lantern, character),
  not with confetti above it. A short "Nice listening — /m/, m." line follows.

---

## 5. Mechanics catalogue

Each mechanic has its own physical verb, camera composition and world response.
"Domain" is the evidence domain written (`docs/superpowers/plans/…learning-foundation.md`
seven-domain list).

| # | Mechanic | The child … | What it looks like in the level | Domain | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | **Sound Signpost** (teach) | taps the signpost, hears the sound + anchor word, says it | wooden signpost with the grapheme; a picture of the anchor word swings out | none (teach) | one per new target; required before any scored beat on that target |
| 2 | **Echo Hunt** | hears /m/, picks the crate whose letter says /m/ | 3 letter crates on platforms; the picked crate opens and a seed-light flies to the broken landmark | phoneme_to_grapheme | distractors never share the target's sound; positions seeded |
| 3 | **Sound Sort** (logic) | sorts 4 picture-items into 2 baskets by sound (*starts with /s/* vs *starts with /m/*) | items float down one at a time; tap item, then basket; baskets fill visibly | grapheme_to_phoneme / phoneme_to_grapheme | also used for alt-sound stops (y as /ie/ vs /ee/, oo in book vs moon) with the curated `SORT` lists |
| 4 | **Word Forge** | hears "map", builds it with grapheme tiles in order | a bridge with `_ _ _` plank slots; tiles on platforms; each right tile becomes a plank | word_segmentation_encoding | slots persist; wrong tile bounces back saying its sound; no slot is skipped |
| 5 | **Blend Bridge** | taps stones m·a·p in order, hears each, presses Blend, then picks the matching picture | stepping stones over water; on Blend they fuse into the whole word; 2–3 picture options on the far bank | word_decoding | the transfer beat: reading, then meaning; pictures never show the answer before the blend |
| 6 | **Heart Word Lantern** (sight/HF words) | sees + hears "the", the tricky part glows with a heart; then finds "the" among look-alikes; then reads it in a tiny phrase | a lantern tree; word lanterns hang from branches; the chosen lantern lights the tree | heart_word_mapping | look-alikes come from taught heart words (the / she / he); phrase uses only taught graphemes + heart words |
| 7 | **Gate Riddle** (logic puzzle) | reads the rule on the gate ("This gate opens for a word that starts like *sun*") and picks the right key from 3 | a locked gate; keys hang on hooks; the right key turns and the gate swings | phoneme_to_grapheme or word_decoding by rule | one rule, one answer; rules are sound-based (first/last sound, number of sounds, rhyme) — never trivia |
| 8 | **Story Bridge** (connected text) | reads a 1–2 line decodable message with word highlighting, then chooses the action that fits (2 options) | the character's note on a board; two doors/paths; the right one opens | connected_text_transfer | text uses only graphemes taught by this stop + taught heart words (checked at build time) |
| 9 | **Boss: Repair** (s5, s10, s15 …) | Word Forge of a novel word + Story Bridge | the chapter landmark rebuilds piece by piece | novel_decoding + connected_text_transfer | boss words are real, controlled, and marked; imaginary words only if flagged |

Mechanic IDs keep the approved power names where they map (`echo_search`,
`contrast_sort`, `word_forge`, `blend_bridge`, `story_power`) and add
`heart_lantern`, `gate_riddle`, `sound_signpost`.

---

## 6. Educational logic

### 6.1 Curriculum (unchanged, immutable)

`src/data/questSequence.js`: 40 stops, 103 teach entries, 60 heart words, a
decodable word bank per stop that the integrity check guarantees is readable
with only the graphemes taught so far. Acts I–II follow the EL Skills Block
order the child meets at school.

### 6.2 The director (per stop)

For a stop the director builds the beat list from four queues:

1. **Teach**: every new grapheme at this stop → Sound Signpost, in order.
2. **Practice on new targets**: for each new grapheme, one Echo Hunt (hear →
   letter). For stops with 2+ new graphemes, one Sound Sort contrasting two of
   them. For every stop with decodable words, one Word Forge and one Blend
   Bridge on words from this stop's bank that contain the new graphemes.
3. **Heart words**: each heart word introduced at this stop → Heart Word
   Lantern. On later stops, one due heart word returns inside a Blend Bridge
   phrase or a Story Bridge line.
4. **Review**: one beat on the *most useful* due target (not the easiest): a
   target with a recorded confusion, or the oldest independent success, served
   in a *different* mechanic from the one it was learned in. Spacing uses the
   monotonic `journeyStep`, never the wrapped stop number.

Beats are capped at seven; the mission always ends on a world-changing beat.
Review-only stops (s8, s17) are all review + one Gate Riddle + Story Bridge.

### 6.3 Items

- Correctness is decided by `engine/authority.js` (pure). The renderer and HUD
  receive object ids and display text only; `expected` never leaves the engine.
- Choices are shuffled with a seed derived from `stopId + beatIndex +
  attemptOrdinal`, so a replay is different but reproducible, and answer
  position never encodes the answer.
- Distractors come from the same instructional family and must **differ in
  sound**, using the pronunciation records; `d` is never offered beside `nd`
  when the prompt says "sound"; doubled letters are never offered against their
  single (Question Design Bible §10).
- A decoding item cannot be solved from a picture (Blend Bridge shows pictures
  only *after* the blend).
- Prompts are one verb + one target, under eight words: *Find /m/. Build map.
  Sort the sounds. Read the note.*
- Three options by default.

### 6.4 Evidence

One literacy action → at most one evidence event `{ targetId, domain,
mechanic, stopId, independent, supportUsed, errorType, journeyStep, at }`.
Independent = first attempt, no model shown, target's signpost completed.
Movement, jumping, collecting, timing and replay emit nothing.
`engine/progress.js` stores the journey (completed stops, tokens, checkpoint of
the current mission, evidence log) under the existing `phonics_quest` progress
area for the student, so the existing sync and teacher reads keep working.
Sound Seekers evidence remains `practice`; it never becomes SECURE.

### 6.5 Audio (fail-closed, sound-off safe)

- Phonemes: existing reviewed clips via `getPreferredPhonemeAudioPath`.
- Words: existing Leda clips via `getChildWordAsset(word).audio`.
- Instruction and character lines: recorded with the approved
  `en-US-Chirp3-HD-Leda` pipeline (`tools/generateSoundSeekersV3Lines.mjs`,
  run on the Mac where `gcloud` is authenticated). Output manifest
  `src/data/generated/soundSeekersV3Lines.generated.js`.
- Browser speech synthesis is never used.
- If a clip is missing the line is shown as text and the beat still plays;
  an audio-dependent beat with a missing target clip is marked
  `audioSupport: "text"` in evidence and is never counted as independent
  audio-dependent evidence. The game never blocks on audio.

---

## 7. Art direction and production

### 7.1 One language

**The book style.** Everything in the game uses the look of the Little
Literacy Guides books and the Meadow Pals production cast bank: bold dark-brown
ink outlines, flat bright colours with simple soft cel shading, rounded chunky
shapes, warm sunlight. No paper grain, no bloom, no 3D renders, no pixel art.
The 3D-rendered Muddy/Chompy/Pip avatars are retired from this surface.

### 7.2 Asset list and where it comes from

**What shipped (4 Sep 2026).** No API image credits were available (OpenAI:
"no credits remaining"; OpenArt: 5 credits, cheapest image 10), so Ben ran the
prompt sheet (`SOUND-SEEKERS-IMAGE-PROMPTS.md`) through ChatGPT and saved the
seventeen results; they were identified, renamed and cut here.

| Asset | Source | Path |
| --- | --- | --- |
| 4 world map panels (1168×784) | ChatGPT from the prompt sheet: Sunny Meadow Farm, Sunny Hollow, Moonwood at dusk, Deep Moonwood at night — one winding path each; the forty stop coordinates in `content/trail.js` were read off these paintings | `public/game-assets/sound-seekers/v3/world/map-*.webp` |
| 8 platform backdrops | six from ChatGPT (1168×784) from the prompt sheet; the storm coast (26–30) and Star Reach (36–40) from Grok Imagine in the browser pane (2160×864, Quality v2.0) — a wide painting scrolls with less repetition | `…/v3/backdrops/bg-*.webp` |
| 15 Meadow Pals | cut from the production cast bank (flood-fill of the flat cream background, `--crop 0,170,3840,927`) | `…/v3/cast/meadow/<name>.webp` |
| 15 Dino Pals, 9 Moonwood characters | two Dino line-ups and one Moonwood line-up from the prompt sheet, cut with `tools/soundSeekersV3/cut_lineup.py` — the generated line-ups overlap (tails, wings), so the cutter separates characters along their ink outlines: cells of flat colour are assigned to the character whose seeded palette they match | `…/v3/cast/dino/`, `…/v3/cast/moonwood/` |
| 3 heroes, side view walking right | ChatGPT from the prompt sheet (fake checkerboard "transparency"), cut with rembg | `…/v3/cast/<land>/<name>-hero.webp` (`heroSprite` in `cast.js`) |
| Ground, platforms, crates, planks, stones, signposts, lanterns, baskets, keys, gates, doors, dust, sparkles | **code** (`render/paint.js`) — ink outline + flat fill + one shade | — |
| HUD boards, buttons, speech bubbles | code + CSS | — |

Cut commands (cloud or Mac; the `--cores` are the x-ranges that are ONLY that
character, read off the line-up):

```
python3 tools/soundSeekersV3/cut_lineup.py cast-dino-a.jpg out/dino --names chompy,sunny,dozy,grumpy,bossy,wiggly,zippy,honky --cores 20-140,180-300,330-450,470-620,640-740,775-900,910-1020,1035-1160
python3 tools/soundSeekersV3/cut_lineup.py cast-dino-b.jpg out/dino --names cheeky,shy,fancy,clumsy,flappy,sneezy,bouncy --cores 40-190,215-345,365-520,545-680,700-800,830-960,990-1130
python3 tools/soundSeekersV3/cut_lineup.py cast-moonwood.jpg out/moonwood --names pip,wren,flint,spark,burrow,luna,fern,glimmer,stone --cores 20-105,125-225,255-360,385-480,500-590,605-700,715-800,815-900,930-1160
```

Grok Imagine notes (for next time): sign in first; Settings → Quality (v2.0),
×2, 3:2; the result page embeds the full image as a data: URI in the `<img>`,
which is how it was pulled out — no download button is needed. Code-drawn
clouds are drawn at 28% over the night backdrops so the constellations stay
the sky.

**Colour policy.** The repository's Sound Seekers source gate forbids raw hex
colours anywhere under `src/features/soundSeekers/` except
`visual/visualTokens.js`. The whole v3 palette therefore lives there as
`SOUND_SEEKERS_V3_PALETTE` (ink, cream, gold, leaf, berry, wood, stone, water,
per-land skies, per-backdrop ground colours); `render/paint.js` re-exports it
for the canvas, `content/trail.js` reads the land and ground colours from it,
and the stylesheet gets the same values as `--ss3-*` custom properties set on
the `.ss3` root by `soundSeekersV3CssVariables()`.

### 7.3 Animation

Characters are **paper puppets**: one drawing, animated in code with bob,
lean, squash-and-stretch on land, hop on celebrate, tilt on think, plus dust
puffs and seed-light particles. Every important action has anticipation,
contact and follow-through (spec SS-19). Reduced motion keeps the same states
with opacity/outline changes and no parallax.

---

## 8. Architecture

```
src/features/soundSeekers/v3/
  content/
    trail.js            40 stops: land, panel, map x/y, character, problem, fix, backdrop
    cast.js             book characters: id, name, species, series, sprite, size
    lines.js            every spoken/shown line (single source for the TTS job)
  engine/
    rng.js              seeded RNG
    lexicon.js          grapheme → phoneme key, word → grapheme units (pronunciation records)
    challenges.js       item authoring per mechanic (unique key, distractor policy, shuffle)
    director.js         beat list for a stop from questSequence + progress
    authority.js        pure reducer: attempt → verdict, error ladder, evidence event
    progress.js         journey state, checkpoint, evidence log, storage + sync
    audio.js            cue resolver (phoneme / word / line) + one player
  render/
    canvas.js           fixed-step loop, DPR, resize, camera
    paint.js            procedural props in the house style
    sprites.js          image loading, puppet animation
    mapScene.js         the trail
    encounterScene.js   the platform level: physics, rooms, objects, responses
  ui/
    Hud.jsx             title, signboard, replay, choice proxies, D-pad, pause
  SoundSeekersV3.jsx    orchestrator (React lifecycle only)
```

`SoundSeekersRoute.jsx` mounts `SoundSeekersV3` instead of the old game. The
old `engine/`, `ui/`, `visual/` folders stay on disk until the zero-reference
cleanup pass and are not imported by the route.

Physics come from `LetterLeapGame.jsx` (gravity 0.62, move 4.8, jump 13.6,
coyote time, jump buffer, variable jump height) at a fixed 60 Hz step.

---

## 9. Exactly how to build it (order of work)

1. **Art job** — run `node tools/_gen-v3-art.mjs` on the Mac (≈20 min). Review
   every image at full size. Re-run any panel with `--only name --force`.
2. **Cutouts** — `node tools/cutCastBank.mjs` on the Meadow bank, then the
   generated Dino/Moonwood banks. Review the contact sheet.
3. **Content** — write `trail.js` (stop coordinates read off the panels),
   `cast.js`, `lines.js`.
4. **Engine** — `lexicon.js`, `challenges.js`, `authority.js`, `director.js`,
   `progress.js`, `audio.js`, with unit tests
   (`tests/unit/soundSeekersV3*.test.js`): unique key per item, distractor
   sound policy, teach-before-score, error ladder, evidence shape, checkpoint
   round-trip, decodability of every Story Bridge line.
5. **Renderer** — `canvas.js`, `paint.js`, `sprites.js`, `mapScene.js`,
   `encounterScene.js`.
6. **HUD + route** — `Hud.jsx`, `SoundSeekersV3.jsx`, swap in
   `SoundSeekersRoute.jsx`.
7. **Audio lines** — run `tools/generateSoundSeekersV3Lines.mjs` on the Mac.
8. **Visual self-review** — Playwright captures of map, meet, signpost, each
   mechanic, first error, supported retry, fix, back-to-trail at 1470×831,
   1194×834 and 1024×640; old-vs-new side by side; regressions listed first.
9. **Hand-over** — branch + bundle + the exact terminal commands.

### What is built in this pass

Everything in §8 for the whole trail: forty authored stops (problem / fix /
token lines, decodable Story Bridge lines where the stop's sounds allow one),
34 character cutouts, the nine mechanics, the director, the authority with the
error ladder, evidence, checkpoints, the map scene, the platform scene, the
HUD, storage, and 17 unit tests (`tests/unit/soundSeekersV3.test.js`). The
route now renders v3; the old game's modules are untouched and still pass
their own tests.

### Visual self-review (step 8) — what it found and what changed

Automated playthroughs of stops 1, 2, 13 and 25 at 1470×831 (every beat
screenshotted, wrong answers included) against the old game's captures.
Regressions found in the new game and fixed in the same pass:

- a character standing at the screen edge had its speech bubble cut off →
  bubbles are clamped to the visible area, the tail still points at the speaker;
- the HUD feedback board repeated the sentence the character was already
  saying, and could show a stale "listen again" under a fresh "that's it" →
  the board now only mirrors lines for screen readers (visually hidden) and
  shows visibly only for a replayed prompt; the character's bubble is the one
  visible message;
- the hero could stand in front of the character and hide it (heart room,
  forge) → the character steps aside whenever the hero settles within a body
  width, towards the nearer edge, away from the puzzle;
- heart words with three or more heart letters ("some", "come") drew the hearts
  on top of each other → one cell per letter and the lantern widens with the
  word; the model word now hangs from its own post, the three choices under
  the tree, and after the word is found the same lantern shows the phrase with
  the heart word in berry (the separate phrase board, which covered the lantern,
  is gone);
- the first slice of the next room (a key, a note board) showed at the right
  edge before its fence had dropped → rooms beyond the next fence stay empty
  until the fence drops, then fade in;
- the hero spawned exactly in front of the first forge tile and stood in front
  of neighbouring tiles after a pick → tiles start 260 px into the room, are
  150 px apart, and the hero stands midway between two tiles;
- a sort card with no picture drew an empty picture area over a small word →
  the word alone, big and centred.

Not regressions, left as designed: words without a clean picture show a
"hear it" frame instead of a picture; anchor words without a picture show the
word; the Dino/Moonwood cutouts carry the mood painted on their covers
(Wiggly looks worried even when celebrating).

### Verification status

- `tests/unit/soundSeekersV3.test.js` — 17/17.
- Sound Seekers source gate (raw-colour policy, preview authority) — passes.
- The full unit suite could not be judged in the cloud copy (it lacks
  `supabase/`, `public/audio/`, workflows and legal pages, so 70-odd tests
  fail on missing files there); it must be run on the Mac after the files
  land. Two `soundSeekersGameContract` tests already fail on the committed
  tree before this work (the old campaign map no longer says "Begin
  expedition") — verified on the Mac at cb98b35.
- Lint is clean for every file this pass touched.

### What remains after this pass (tracked in project memory)

Generated character lines (Leda pipeline, §6.5) and their human listening
review; art generation when credits exist (§7.2); physical iPad pass; observed
child play; the zero-reference deletion of the old v2 engine and its 54 tests;
teacher-view surfacing of the v3 evidence log.

---

## Appendix A — Stop table

Generated from `content/trail.js` by `node tools/printSoundSeekersV3Trail.mjs`
(also embedded in the file header). Meadow land, authored in full:

| Stop | Landmark | Character | Problem (Meet line) | Fix |
| --- | --- | --- | --- | --- |
| s1 | Hollow Tree | Muddy | "My bath things fell into the Hollow Tree! Help me find the sounds." | The tree gives back the bath things |
| s2 | Fern Steps | Woolly | "I can't sleep — the Fern Steps are all jumbled." | The steps line up and Woolly yawns |
| s3 | Rook Stones | Clucky | "My egg rolled onto the Rook Stones!" | The stones tilt and the egg rolls home |
| s4 | Otter Ford | Splashy | "The puddle bridge at Otter Ford is broken." | The bridge planks land |
| s5 | Bramble Gate ▲ | Bouncy | "I bounced right through the Bramble Gate. Oops!" | The gate rebuilds; the meadow lantern lights |
| s6 | Beehive Bluff | Brave | "I want to climb to the beehive but the ladder is missing." | Ladder rungs appear |
| s7 | Lily Ferry | Giggly | "My hiccups rocked the Lily Ferry off its rope!" | The ferry rope re-ties |
| s8 | Fishpool Reach | Hungry | "I can't find my lunch anywhere." | Lunch appears on the jetty |
| s9 | Wheelhouse Bend | Cuddly | "The wheelhouse wheel spun right off!" | The wheel turns again |
| s10 | The Singing Weir ▲ | Noisy | "My crow is stuck and the weir won't sing." | The weir sings; Noisy crows |
