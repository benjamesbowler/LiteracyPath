# SENTENCE EXPRESS — flagship arcade game design (2026-07-09)

**One line:** you are the yard master of a low-poly railway. Sentences arrive
as broken trains — wrong order, a rusty wrong-word carriage, a missing crate,
no capital engine, no caboose. Fix the train, pull the whistle, and watch it
thunder off through the world while the sentence reads itself back, carriage
by carriage. Donkey Kong charm, Bomberman yard-grid, Tony Hawk combo scoring,
a Driver-style depart run. PS1 to the bone.

## Why a train (the pedagogy IS the mechanic)
A sentence is a linear, ordered, coupled structure. So is a train.
- **Engine = first word.** Only a CAPITAL engine can lead. Lowercase "the"
  engine physically won't couple at the front — the kid FEELS capitalisation.
- **Carriages = words**, coupled in order. Wrong order = the train jolts and
  the bad carriage bounces off. Word order becomes spatial, not abstract.
- **Rusty carriage = wrong word** ("The dog can *flying*") — swap it at the
  repair shed from 3 replacement carriages (exactly one fits: our
  single-correct validator rule applies to game content too).
- **Gap flatbed = missing word** — choose the right word-crate to load.
- **Caboose = end punctuation.** No caboose, no departure. Choose . ? !
- **Depart run = fluency payoff.** The fixed train drives the line; each word
  highlights as its carriage passes the camera — the child re-reads the
  corrected sentence at speed, which is the actual learning objective.

## Framework compliance (non-negotiable, same as every arcade game)
- 3 difficulties = 3 lines/worlds/casts: **Meadow Line** (easy, day),
  **Dino Canyon Line** (medium, dusk), **Moonwood Night Line** (hard, night).
- **10 ramped, no-repeat levels per line**, ~3 minutes each, built by a pure
  `sentenceExpressLevels.js` module on `curriculumLadder.js` (deterministic:
  same seed = same level; unit-testable like rocketRunRounds).
- **Catch-up:** a failed sentence re-queues later in the level via
  `catchUpQueue.js` — the level only ends when every train has departed.
- **Shared `starRubric`** (per-target accuracy, deaths cap stars), coins into
  the Hollow economy (`gameStar` rate), `gameCheckpoints` resume per line,
  pause on quit-dialog/backgrounded tab, reduced-motion (no shake/steam),
  aria-live announcements, GPU-free (2.5D DOM/canvas — no Three.js).

## The loop (one level = 3 trains + 1 bonus)
1. **ANNOUNCE (5s).** Station master (the world's pal) on the platform;
   gold-voice audio says the target sentence. Big "Listen again" whistle
   button. The sentence is never shown written — the kid holds it in their
   head (oral comprehension → construction).
2. **SHUNT (60–90s).** Isometric yard, Bomberman-clean grid. The train parts
   sit on sidings. Tap a carriage → it rolls to the next open coupling slot
   on the main track (tap a coupled one to send it back). Faults by type:
   engine choice (capital), order coupling, rusty-swap at the repair shed,
   crate onto the gap flatbed, caboose choice. Wrong coupling: CLANK, jolt,
   carriage rolls back, station master replays the audio — no hearts, instead
   the **station clock** adds "+1 min delay" per mistake.
3. **DEPART (10s, the candy).** Whistle pull → signal drops to green →
   train accelerates through a parallax run of the world (tunnel, bridge,
   fireflies at night); the sentence scrolls under the camera and each word
   lights as its carriage passes; SFX chug builds. On-time departure (zero
   delay) = **EXPRESS BONUS** stamp + combo multiplier climbs (x2, x3 —
   Tony Hawk rules: mistakes reset the multiplier, not the progress).
4. Repeat ×3 trains, ramping fault count. **Bonus train** (level end): the
   Gold Mail Run — one long sentence, all fault types at once, no clock,
   double coins. Then tally: stars (starRubric on couplings), coins, best
   time vs your ghost, "next departure" card.

## Ramp (levels 1–10 per line, from the sentence banks — no repeats)
| Lv | Meadow (3–4 words) | Dino (4–6 words) | Moonwood (6–8 words) |
|---|---|---|---|
| 1–2 | order only | order + engine | order + engine + caboose |
| 3–4 | + engine (capital) | + caboose . ? | + rusty swap |
| 5–6 | + caboose (.) | + rusty swap | + gap crate |
| 7–8 | + gap crate (easy) | + gap crate | two faults per train |
| 9 | mixed single fault | two faults per train | + joining-word carriage (and/but) |
| 10 | Gold Mail Run | Gold Mail Run | Gold Mail Run (three faults) |
Question-mark trains get a curving "?" signal arm; exclamation trains get the
red express flag — punctuation has a visual world meaning.

## Content & data model
- `src/utils/sentenceExpressLevels.js` (pure): builds each train from the
  existing clean sentence pools (adventureRounds sentence banks, cycle sight
  words, CVC/HFW word lists) — every word must pass the audio blocklist and
  have gold-voice audio. Faults are GENERATED from a correct sentence
  (scramble order / substitute a same-class wrong word from a curated
  confusion bank / delete a word / lowercase the first word / strip the end
  mark), so the correct answer is always recoverable and unique.
- Tests (mirror rocketRun's): every train winnable; exactly one valid engine/
  caboose/swap; no repeated sentences within a line; deterministic by seed;
  rusty replacements are same-part-of-speech but semantically wrong;
  blocklisted audio never referenced.
- Hard mode joins two clauses with an "and/but" coupling car — structure,
  not just repair.

## Scoring & replay hooks
- Coupling accuracy → starRubric (`correct/total`, delays = mistakes).
- Combo: consecutive clean couplings = multiplier on coin drips; EXPRESS
  stamps collection (one per on-time train) shown on the level card.
- **Ghost clock:** your best total delay per level; beat it for a silver/gold
  pocket-watch cosmetic. Engines are Hollow-Market cosmetics later
  (cross-economy: buy the Brass Beetle engine with coins).
- Daily "Special Delivery": one seeded level/day, extra coin chest — feeds
  the daily-mission "game" slot.

## PS1 art direction (Seedream batch, ~22 images)
Style block: "low-poly PlayStation-1 era 3D render look, chunky geometric
shapes, flat-shaded polygons with warm vertex lighting, crisp silhouettes,
NO text, no watermark, no faces on objects" + world palettes. Sprites on
transparent/plain bg; backgrounds 16:9.
- Engines ×4: meadow red barn-engine, dino bone-plated engine, moonwood
  brass-and-teal night engine, gold mail engine (bonus).
- Carriage set ×3 worlds (plain boxcar, rusty boxcar, flatbed, crate,
  caboose, "?" signal caboose, "!" express caboose) — 7 per world as one
  sprite sheet each.
- Yard backgrounds ×3 (isometric sidings + repair shed + signal gantry,
  EMPTY of trains); depart-run parallax strips ×3 (far/mid/near layers).
- Station clock face, EXPRESS stamp, signal arm. Pals reuse existing poses.
Audio: existing word/sentence gold voice; synth SFX via gameSfx (chug loop,
clank, whistle, signal ding); world music loops already exist.

## Build plan (5 gated commits)
1. `sentenceExpressLevels.js` + fault generators + full test file.
2. Yard scene + coupling interactions + announce/audio (playable core).
3. Depart run + karaoke read-back + combo/clock/tally + starRubric wiring.
4. Checkpoints/resume, catch-up queue, pause/reduced-motion/aria, arcade
   registration (`learnGamesData.js`, fullBleed) + gameSurfaces test update.
5. Art integration + polish pass (juice: jolts, steam OFF under
   reduced-motion, signal choreography). Each commit: unit tests + lint +
   build green before push; playtest checklist for Benjamin at the end.

Mockups: `mockups/sentence-express/01-shunt-yard.html` (the puzzle) and
`02-depart-run.html` (the payoff). Open them full-screen.
