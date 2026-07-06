# LiteracyPath — Two Future Arcade Games (Design Doc)

**Status:** Concept / pipeline. **Do not build yet** — this is the spec to build FROM later.
**Date:** 2026-07-06 · **Branch when built:** `pristine-v2-3d` (previews first, never straight to `main`)

These are the next two flagship games after **Rocket Run** (3D catch-the-sound flyer) and **Letter Leap** (side-scroll platformer). Both must hit the same bar Benjamin set: *real, playable, console-quality games — not animated worksheets* — using **our** characters and worlds, not stock art.

Two concepts:

1. **Word Bridge** — a Lemmings-style build-and-escort puzzle. Build a bridge/ladder/house out of letters and words so the Pals can cross a hazard.
2. **Sound Racer** — a Wipeout-style time-trial racer. Steer through a world collecting the right letters/words for speed boosts, dodging wrong ones, racing a clock and a leaderboard.

---

## 0. Shared foundations (both games inherit these)

**Worlds & difficulty ladder** (already how the app is structured — cycles 1→27):

| World | Cycles | Accent token | Setting | Playable cast |
|---|---|---|---|---|
| **Meadow** (easy) | 1–9 | `#4E8C44` green | Warm farm — barn, pond, hill, log, hay | Meadow Pals: Muddy, Woolly, Clucky, Bouncy, Speedy, Brave, Tiny, Splashy… |
| **Dino / Sunny Hollow** (medium) | 10–18 | `#C2702A` amber | Lush valley — Cozy Cave, Fernwood, Rainbow Waterfall, **Mount Rumble** volcano | Dino Pals (baby dinos) |
| **Moonwood** (hard) | 19–27 | `#5E4D9C` violet | Enchanted forest — glowing mushrooms, **Hollow Oak**, Crystal Stream, Fog Marsh | Moonwood: Pip, Burrow, Luna, owls |

World tokens live in `src/styles/pal-worlds.css` (`--pal-accent`, `--pal-deep`, `--pal-mesh`, panorama/emblem art). A game reads `data-pal-world="meadow|dino|moonwood"` and re-skins with zero code branches.

**Content sources (reuse — do NOT author new curriculum):**

- Letter → example words that truly *start* with a grapheme: `wordsStartingWith()` / `LETTER_EXAMPLES` in `src/utils/rocketRunRounds.js` + `src/data/elSkillsBlockCycles.js`.
- Word banks: `CVC_WORDS`, `SIGHT_WORDS`, `RHYMING_PAIRS` in `src/data/learnGamesData.js`.
- Sentences (for the sentence-build variant): `SENTENCES` (level1/2/3) in `learnGamesData.js`.
- Poems / world flavor text: `src/data/elCyclePoems.js`.
- Voice: the single **gold narrator** for prompts/feedback; short human clips only — never TTS.

**Non-negotiable design rules (carried from the existing games):**

1. **All letter/word tiles are ONE colour.** Kids must read the *letter*, not colour-match. (Same fix we made in Letter Leap.)
2. **Every round is winnable and every distractor is a genuinely different sound.** Reuse the fairness guards: `sharesSound()` keeps homophones apart (c/k, w/wh) and the `check:distractor-onset-giveaway` gate must stay green.
3. **Art direction:** realistic cartoon; fantasy / sci-fi / nature; **no faces on objects, no rainbow motifs, not babyish.**
4. **Child-facing verbs say "tap"**, never click/select/press (enforced by a unit test).
5. **Rewards are derived from progress** (`treasureTrail.js`) — gems/badges/stars are computed, never stored per-game.
6. **Stars per level = 3/2/1/0**, same thresholds as `rocketRunStars()` / `starsForAccuracy()`.

**Tech pattern (both games follow Rocket Run's shape):**

- A **pure, DOM-free round/level builder** module (e.g. `src/utils/wordBridgeLevels.js`, `src/utils/soundRacerTracks.js`) so every level can be play-tested in `node --test` *without* a browser — this is what makes "every level winnable" provable.
- A thin React component (`WordBridgeGame.jsx`, `SoundRacerGame.jsx`) that renders it, **lazy-loaded with `lazyWithRetry`** and registered in `src/data/learnGamesData.js` with `surfaces: ["arcade"]`.
- Unit tests mirroring `tests/unit/rocketRunRounds.test.js` (winnability, sound-distinct distractors, star thresholds).
- Standalone `docs/previews/*.html` playable preview first (like `rocket-run-preview.html`) so Benjamin can play it before it's wired into React.

---

# GAME 1 — WORD BRIDGE (working title)

*Lemmings meets phonics. You are the builder; the Pals are the walkers.*

## 1.1 Fantasy & hook

A line of Pals is marching toward a gap they can't cross — a lava pit, a river, a ravine. **You** run ahead as the builder, grab the **right** letters/words lying around, drop them into the gap to form a bridge that spells the target, then **ring the bell** to send your friends across. Get it right and they stroll over cheering; get it wrong and the bridge won't hold.

It's warm and social (you're *helping your friends*), it's spatial and physical (carry, place, build), and the literacy is the bridge itself — the thing that literally has to be correct for anyone to make it.

## 1.2 Core loop (30–90s per level)

1. **Read the goal.** Gold voice + banner: *"Build the word **frog**"* or *"Make the sentence: The cat sat."* A ghosted outline of the target shows the empty slots over the gap.
2. **Fetch.** Scattered around the level are letter/word tiles (some correct, some decoy). Walk the builder to a tile, **tap to pick up** (carry one at a time — or up to 3 at higher levels).
3. **Place.** Stand over the correct slot, **tap to drop**. Correct tile → it *clicks* into the bridge and locks with a warm chime. Wrong tile → it teeters and drops into the pit (lost; fetch another). Placing in the wrong *order* is rejected gently ("that one comes later").
4. **Call the Pals.** When the span is complete, **tap the bell**. The Pals walk across in a happy conga line. Each safe Pal = points.
5. **Resolve.** All Pals across → level clear, stars awarded. If a Pal reaches the gap before the bridge is done (timer/patience), it waits at the edge; only if the bridge collapses (see fail states) does a Pal get stuck.

## 1.3 The three build modes (same engine, different geometry)

| Mode | You build… | Hazard | Physical metaphor | World fit |
|---|---|---|---|---|
| **A. Bridge** (horizontal) | letters → a word, OR words → a sentence, left-to-right across a gap | **Lava** (dino), river (meadow), chasm (moonwood) | span the pit | all |
| **B. Ladder / Climb** (vertical) | letters stacked bottom→top to reach a height | fall / heat rising | climb a tree (meadow), the side of **Mount Rumble** (dino), the **Hollow Oak** (moonwood) | all |
| **C. Shelter** (enclosing) | words placed into wall/roof slots to complete a house | rain/night/cold closing in | build a home to live in | meadow cottage, cave, mushroom house |

All three share: fetch → place-in-order → decoys → complete → escort/settle. Only the **slot layout** and **win animation** change. Ship **Mode A first**, add B and C as level packs.

## 1.4 Difficulty by world (content ramp)

- **Meadow (cycles 1–9):** build 3-letter CVC words (`CVC_WORDS.easy`: cat, dog, sun…) letter-by-letter. 3–4 slots, 2–3 decoys, 3–4 Pals, generous timer, **river** not lava.
- **Dino (10–18):** blends/digraphs (`CVC_WORDS.medium`: ship, frog, chin…) or short 2-word phrases. 4–5 slots, more decoys, **lava** pit, patience timer tighter, 4–6 dinos.
- **Moonwood (19–27):** longer words (`CVC_WORDS.hard`) or **build a whole sentence from word-tiles** (`SENTENCES.level3`). Ordering matters most here; decoys include plausible-but-wrong words; **chasm** with glowing spores.

Level parameters (all in the pure builder so tests can assert winnability):

```
{
  world, cycle,
  mode: "bridge" | "ladder" | "shelter",
  target: "frog"            // or ["The","cat","sat"] for sentence mode
  slots: 4,                 // = target length
  decoys: ["d","g","s"],    // sound-distinct wrong tiles (never a homophone of a needed letter)
  pals: 4,                  // walkers to escort
  patience: 22,             // seconds before the first Pal reaches the edge
  hazard: "lava" | "river" | "chasm"
}
```

## 1.5 Controls / input

Kids play on **tablets first**, keyboard second.

- **Touch:** tap-to-move (builder walks toward tap point) OR on-screen left/right + jump/pick pad. Tap a tile to pick up; tap a slot to drop; tap the bell to call.
- **Keyboard:** ←/→ move, ↑/Space jump, **E / tap** pick-up-drop, **Enter** ring bell.
- One-handed friendly; no double-taps, no drag required (drag is a fallback, not the primary — small hands).

## 1.6 Win / fail states (kind, never punishing)

- **Win:** all Pals across/settled → confetti in the world accent colour, stars 3/2/1/0, gold voice: *"You built **frog**! Everyone's across!"*
- **Wrong tile placed:** it wobbles and drops into the hazard with a soft *bonk* (no scary sound), builder shrugs. Costs time, not a life.
- **Collapse (only real fail):** if the builder runs out of correct tiles to fetch (all decoys used and correct ones lost), a **"try again"** panel slides up — same layout re-seeded, no shame, no score reset mid-level. **A level can never become truly uncompletable** (the pure builder guarantees enough correct tiles always exist — same invariant as Letter Leap's ground-level letters).
- No "game over" screen ever. Worst case is a gentle retry.

## 1.7 Star scoring

- 3★ = word/sentence built with **no wrong placements** and all Pals saved.
- 2★ = built, ≤1 wrong placement, all Pals saved.
- 1★ = built (some wrong placements or a Pal left waiting).
- Feeds the same gem/badge economy via `treasureTrail.js`.

## 1.8 UI / HUD spec

Frame lives on the **jet-black arcade** surface (`.lg-arcade`, `src/styles/arcade-dark.css`); the *play area* is bright and world-themed via `data-pal-world`.

```
┌───────────────────────────────────────────── .lg-arcade (jet black) ──┐
│  ◀ Back            WORD BRIDGE · Meadow          ⭐⭐☆   ⏱ 0:18   💎 40 │
│  ┌──────────────────────── play area (world-themed, bright) ─────────┐ │
│  │  Goal:  build  [ f ][ r ][ o ][ g ]   ← ghosted target slots      │ │
│  │                                                                    │ │
│  │   🐑🐑🐑🐑  → →            ( gap / LAVA )            🔔 Call        │ │
│  │  ────────────  [ f ][ r ][ _ ][ _ ]  ─────────────                 │ │
│  │        (builder)  carrying: [ o ]     loose tiles: g  s  o  d      │ │
│  └────────────────────────────────────────────────────────────────── │ │
│   [ ◀ ]     [ ▶ ]            [ JUMP ]            [ PICK / DROP ]        │
└────────────────────────────────────────────────────────────────────────┘
```

- **HUD (top):** back chip, title + world chip (`.pal-world-chip`), star track, level timer, gem count. All use arcade-dark chip styles already defined.
- **Goal banner:** target word/sentence as ghosted slots that fill as you place. Re-tappable to hear the gold voice say it again.
- **Play area:** world panorama background (reuse `--pal-banner` / new Seedream backdrop), the bridge span across a hazard, loose tiles, the Pal queue, the bell.
- **Tiles:** single accent colour, big rounded chunky glyphs, subtle bevel (blocky, not babyish). Carried tile floats above the builder's head.
- **Controls (bottom):** large touch pad, thumb-reachable, hidden on keyboard play.
- **Feedback:** correct = warm chime + tile snaps + tiny sparkle; wrong = soft bonk + wobble; complete = the whole bridge glows in `--pal-accent` and the Pals cheer.

## 1.9 Art & audio assets (Seedream, on art-direction)

- **Builder + Pals:** side-view sprites per world (Meadow Pals already have descriptions in `guidedReadingSeriesBooks.js` — Muddy/Woolly/Clucky etc.; keep them consistent). Walk + carry + cheer + wait poses.
- **Backdrops:** wide parallax per world (meadow farm w/ river, Sunny Hollow w/ Mount Rumble + lava, Moonwood w/ chasm + glowing spores) — same pipeline as `tools/generate-game-backgrounds.mjs`.
- **Tiles:** one reusable letter/word tile sprite, tinted to `--pal-accent`.
- **Hazards:** animated lava/river/chasm shimmer (drawn or sprite-sheet).
- **Audio:** gold voice reads the goal + says the built word on success; SFX for pick/drop/snap/bonk/bell/cheer. Optional: on completion, the gold voice **blends the word** (f-r-o-g → frog) as the Pals cross — free extra phonics rep.

---

# GAME 2 — SOUND RACER (working title)

*Wipeout for readers. A time trial where reading the right sound IS your speed.*

## 2.1 Fantasy & hook (per world)

Same engine, three skins:

- **Meadow — "Meadow Dash":** a lamb (Speedy) sprints through the farm — hay bales, fences, puddles.
- **Dino — "Dino Dash":** a baby dino barrels through Sunny Hollow toward Mount Rumble — ferns, rocks, waterfall spray.
- **Moonwood — "Moonwood Flight":** a **witch on a broom** (Luna) flies through the clouds above the enchanted forest — the Wipeout-in-the-sky version.

You're always moving forward. Reading is the throttle: grab the letters/words that match the target sound to boost; hit wrong ones or obstacles and you bog down. It's a **race against the clock and a leaderboard**, not against a rival racer — so it's calm but competitive.

## 2.2 Core loop (60–120s per track)

1. **Target sound shown:** *"Grab everything that starts with /b/."* (Reuses `rocketRunTargets()` — only graphemes with ≥3 genuine onset words qualify, so it's always fair.)
2. **Steer** left/right/lane-to-lane down an endless-feeling but fixed-length track.
3. **Collect gates:** floating letter/word tiles approach. Steer *into* correct ones → **speed boost + points + a satisfying chime**. Steer into wrong ones or obstacles → **slow down + small time penalty** (never a crash-to-zero; momentum recovers).
4. **Words counter:** each correct pickup adds to "words read" for this run.
5. **Finish line:** cross it → show **time**, **words correct**, **accuracy**, stars, and **leaderboard placement** (personal best + optional class board).

## 2.3 What you collect (content logic — reuse Rocket Run's builder)

Sound Racer is the *racing* cousin of Rocket Run and shares the round logic:

- **Correct tiles** = words that truly *begin* with the target grapheme (`wordsStartingWith()`), OR the target letter itself.
- **Wrong tiles** = words whose onset does **not** share the target's sound (`sharesSound()` filter) — so a boost is never ambiguous.
- **Obstacles** = non-letter world hazards (hay bale, rock, cloud-bank) — pure dodging, no reading, to vary the rhythm.
- Difficulty by world = same LETTER/word ramp as everything else (meadow single sounds → moonwood blends/longer words).

Because it reuses the proven `buildRocketRunRound()`-style guarantees, **every track is winnable and every wrong tile is a real different sound** — provable in `node --test`.

## 2.4 The "race" model — time trial + leaderboard

- **No AI rival to bump** (keeps it non-frustrating for little kids). You race the **clock** and your **ghost / personal best**.
- **Two scored axes** (exactly as Benjamin framed it): *how many words can you get right* and *how fast can you finish the level*.
- **Leaderboard:** per track, store `{ bestTimeMs, wordsCorrect, accuracy, stars }`. Personal best always; a class/teacher board is optional and derived, not a new data store — piggyback on existing progress persistence.
- **Boost economy:** speed = base speed + (correct pickups × boost) − (wrong/obstacle × drag). A perfect read-through = fastest possible time, tying literacy directly to the racing result.

## 2.5 Difficulty by world

| World | Racer / vehicle | Track | Content | Speed feel |
|---|---|---|---|---|
| Meadow | Lamb (Speedy), ground | Farm lanes, gentle curves | single-sound onsets (b, s, m…) | forgiving, wide lanes |
| Dino | Baby dino, ground | Sunny Hollow → Mount Rumble, rocks & spray | blends/digraphs onsets | faster, tighter |
| Moonwood | Witch on broom (Luna), **flying** | Clouds above forest, 3 vertical lanes | longer/blend onsets, more decoys | fastest, cloud gusts push you |

## 2.6 Controls / input

- **Touch:** tilt-free. Two big lane buttons (or tap-left-half / tap-right-half of screen) to move between 3 lanes; auto-forward. Optional hold-to-drift on hard tracks.
- **Keyboard:** ←/→ change lane, forward is automatic. Space = optional brake/precision on hard tracks.
- Deliberately **simple** input so all attention is on reading the oncoming tiles.

## 2.7 Star scoring & fail-free design

- 3★ = finish under target time **and** ≥90% correct pickups, 0 obstacle hits.
- 2★ = finish under a looser time or ≥70% correct.
- 1★ = finish.
- **You always finish** — wrong hits slow you but the track ends. No death, no restart-forced. Retrying is one tap to beat your own time.

## 2.8 UI / HUD spec

Arcade-black frame, world-bright track.

```
┌───────────────────────────────────── .lg-arcade (jet black) ──────────┐
│ ◀ Back      SOUND RACER · Moonwood Flight        ⏱ 0:42   words: 7   │
│ ┌──────────────────── track (world-themed, moving toward you) ──────┐ │
│ │  Grab:  /b/            ← target sound, always visible             │ │
│ │                                                                    │ │
│ │      [ bat ]        (rock)          [ sun ]     ← oncoming lanes   │ │
│ │                                                                    │ │
│ │              [ bee ]        [ fox ]                                 │ │
│ │        \______________  🧹 witch  ______________/                  │ │
│ │            BOOST ▓▓▓▓▓░░░   (speed meter)                          │ │
│ └────────────────────────────────────────────────────────────────── │ │
│   [ ◀ LANE ]                                        [ LANE ▶ ]        │
└────────────────────────────────────────────────────────────────────────┘
```

- **Top HUD:** back, title + world skin name, run timer, live "words correct" counter.
- **Target-sound chip:** always on screen, tappable to re-hear the gold voice.
- **Track:** perspective road/sky rushing toward the player; 3 lanes; tiles and obstacles spawn ahead and approach. Single accent colour on all letter tiles.
- **Speed / boost meter:** fills with correct reads; visibly drains on wrong hits — the feedback loop of "reading = speed."
- **Finish card:** big time, words correct, accuracy %, stars, "New best!" ribbon when beaten, leaderboard strip, **Race Again** / **Next Track**.
- **Feedback:** correct = whoosh + chime + speed lines; wrong = muffled thud + brief slow-mo wobble; finish = fanfare in world accent.

## 2.9 Art & audio assets

- **Racers:** lamb (side/back ¾), baby dino, **Luna on a broom** — back-view "chase cam" sprites + boost/hit poses. Reuse Rocket Run's back-view rig if possible.
- **Tracks/backdrops:** scrolling parallax per world (farm, Sunny Hollow toward Mount Rumble, cloud-tops over Moonwood) — `tools/generate-game-backgrounds.mjs` pipeline; the moonwood sky version is the money shot.
- **Tiles:** one letter/word tile sprite, accent-tinted, readable at speed (big, high-contrast, single colour).
- **Obstacles:** hay bale / rock / cloud-bank per world.
- **Audio:** gold voice states the target sound and (optionally) says each correct word as grabbed; SFX for boost/hit/finish. Engine/wind loop scales subtly with speed.

## 2.10 Tech notes

- Can ship as **2.5D on canvas** (fake-perspective, cheaper, like an SNES racer) or **true 3D via Three.js** (reusing Rocket Run's CDN-loaded Three setup). Recommend starting **2.5D canvas** for the meadow/dino ground racers (fast, robust on tablets) and reserving Three.js for the Moonwood flight if the depth really sells it.
- Round content = **the existing `rocketRunRounds.js` builder**, so no new fairness surface area.
- Endless-feel but **fixed length** (deterministic seed per track) so leaderboard times are comparable and tests are reproducible.

---

## 3. Where these sit in the arcade

Arcade currently shows only **Rocket Run** + **Letter Leap** (old worksheet games hidden, not deleted). These two slot in as arcade games #3 and #4 when built, each with a Seedream icon (same pipeline as `tools/generate-arcade-icons.mjs`) and a `surfaces: ["arcade"]` entry in `learnGamesData.js`.

Suggested build order:
1. **Sound Racer — Meadow Dash** first (reuses Rocket Run logic + backdrop pipeline → fastest to a playable preview).
2. **Word Bridge — Mode A (Bridge)** next (new mechanic, highest "wow", the Lemmings-style escort is the standout).
3. Then world skins (Dino/Moonwood) and Word Bridge Modes B/C as level packs.

## 4. Build checklist (when the time comes)

- [ ] Pure level/round builder module + `node --test` proving **every** generated level is winnable and every distractor is sound-distinct.
- [ ] Standalone `docs/previews/*.html` playable preview for Benjamin to try before React wiring.
- [ ] React component, `lazyWithRetry`, registered `surfaces:["arcade"]`, hidden-old-games rule intact.
- [ ] Seedream icon + backdrops + sprites on art-direction (no faces-on-objects, one tile colour, not babyish).
- [ ] Gold-voice prompts + SFX; no TTS.
- [ ] Arcade-dark frame + `data-pal-world` theming; responsive/tablet-first; "tap" language.
- [ ] Stars 3/2/1/0 wired to `treasureTrail.js`; leaderboard (Sound Racer) as derived state.
- [ ] Full gate green (build + tests + lint + `check:*`/`audit:*`) before any push; previews-only until Benjamin signs off.

*These are pipeline concepts — nothing here is built yet, by request.*
