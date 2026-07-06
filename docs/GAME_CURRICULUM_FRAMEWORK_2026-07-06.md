# LiteracyPath — Shared Game Curriculum & Difficulty Framework

**Status:** Spec / the law for EVERY game (Letter Leap, Rocket Run, and all future arcade games).
**Date:** 2026-07-06 · **Branch:** `pristine-v2-3d` (previews first, never straight to `main`)

Benjamin's rule: every game must have the same difficulty/world/curriculum structure. This doc defines it once so all games share one engine.

---

## 1. The rules (apply to every game)

1. **Three difficulties = three worlds = three playable casts.**
   - **Low → Meadow** — Meadow Pals as the playable character (Muddy, Woolly, Clucky, Bouncy, Speedy…).
   - **Mid → Dino / Sunny Hollow** — Dino Pals as the playable character.
   - **High → Moonwood** — Moonwood characters as the playable character (Pip, Burrow, Luna…).
   - This already matches `worldForDifficulty()` (easy→meadow, medium→dino, hard→moonwood), so no new mapping — the game just reads the world for its difficulty and swaps character + backdrop + palette (`data-pal-world`, `pal-worlds.css`).

2. **Curriculum ramp.** Each difficulty has **≥10 levels**, and each level is harder than the last, following our cycles:
   - **Meadow (low):** single letter-sounds → CVC words (`CVC_WORDS.easy`), cycles ~1–9.
   - **Dino (mid):** blends + digraphs, longer CVC/CCVC (`CVC_WORDS.medium`), cycles ~10–18.
   - **Moonwood (high):** hardest words (`CVC_WORDS.hard`) **and sentence-building** (`SENTENCES.level3`), cycles ~19–27.
   Within a difficulty, level 1 = easiest slice of that world's band, level 10 = hardest slice.

3. **Sentences on hard.** High/Moonwood levels graduate from spelling words to **building sentences** (collect/order word-tiles into a real sentence). Uses the `SENTENCES` bank.

4. **≥10 levels per difficulty**, **~3 minutes of play each** (target level length — sized by number of targets, not a countdown timer). That is ~30 levels/game and ~90 min of unique play/game; the curriculum banks are large enough to support it.

5. **No repeats.** Within a run, no word/sentence/target repeats until its pool is exhausted (no-repeat deck, like Letter Leap's `drawWords`). Across the 30 levels, content is drawn from each world's band so levels are naturally distinct.

6. **Catch-up (spaced recovery).** If the child misses a letter/target while spelling a word, that word/target is **re-queued and reappears later in the run**, so they can catch up rather than lose it. Deterministic and testable.

---

## 2. Build it once: two shared, pure modules

Both are DOM-free so every level is unit-testable (proves winnability, ramp, no-repeat, catch-up) — same discipline as `src/utils/rocketRunRounds.js`.

### `src/utils/curriculumLadder.js`
```
levelPlan(gameId, difficulty, levelIndex) -> {
  world,                 // meadow | dino | moonwood (from difficulty)
  mode,                  // "letters" (spell a word) | "sentence" (build a sentence)
  targets: [ ... ],      // ordered list of words (or a sentence's words) for this level
  poolSeed,              // deterministic seed so a level is reproducible + testable
  minPlaySeconds: 180
}
```
- Pulls from `CVC_WORDS`/`SIGHT_WORDS`/`SENTENCES` (`learnGamesData.js`) + `LETTER_EXAMPLES` (`elSkillsBlockCycles.js`), filtered to the world's cycle band.
- Guarantees ramp (levelIndex ↑ = harder slice) and no-repeat across the 10 levels of a difficulty.
- Hard/Moonwood levels beyond a threshold return `mode:"sentence"`.

### `src/utils/catchUpQueue.js`
```
const q = makeCatchUp(targets);
q.next();            // the next target to present
q.miss(target);      // child missed it -> re-inject a few steps later
q.done;              // true when every target has been completed (incl. recovered ones)
```
- A missed target is pushed back N positions (not to the very end, not immediately) so recovery feels natural.
- The level isn't "complete" until every target — including recovered ones — is caught. Guarantees the child always finishes having read every word.

Each game imports these; the game only owns its *presentation* (platformer, racer, etc.).

---

## 3. Per-game application

- **Letter Leap (platformer):** low/mid = run and collect letter-bubbles to spell each level's word in order; miss a letter → it respawns later (catch-up). High/Moonwood = collect **word**-bubbles to build a sentence. Character + world swap by difficulty.
- **Rocket Run (racer/flyer):** catch words that start with the target sound; ramp the target set by world; high/Moonwood adds sentence-order rounds. Same catch-up: a missed correct word comes back.
- **Future games:** plug into the same two modules — never re-author curriculum.

---

## 4. Level sizing (~3 min)

A ~3-minute level ≈ enough targets to sustain play: roughly 8–12 words per word-level (Letter Leap collects several letters each), or 3–5 sentences per sentence-level. `curriculumLadder` sets the target count per level so play length lands near 3 min without a punishing timer. Levels end on completion (all targets caught), not on a clock.

---

## 5. Acceptance / tests (mirror `rocketRunRounds.test.js`)

- [ ] For every game × {low,mid,high} × levels 1–10: `levelPlan` returns a winnable, non-empty target list, harder than the previous level, with **no repeats** within the difficulty.
- [ ] Low→meadow, mid→dino, high→moonwood, with the right cast each.
- [ ] Hard levels past the threshold are `mode:"sentence"` and every sentence is orderable/decodable.
- [ ] `catchUpQueue`: a missed target always reappears and the level only completes once all (incl. recovered) are caught.
- [ ] Deterministic: same (game,difficulty,level,seed) = same plan (reproducible + testable).
- [ ] Full gate green; previews-only until Benjamin signs off; then merge to `main`.
