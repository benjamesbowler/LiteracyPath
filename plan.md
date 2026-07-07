# Plan: Build Sound Racer + Word Bridge Arcade Games

## Context
Building two new arcade games for the LiteracyPath app, following the exact patterns of the two live games (Rocket Run, Letter Leap). Both games must follow the arcade-game contract from the build brief.

## Tech Stack
- React (imperative game engines, one RAF loop, thin component wrapper)
- Pure builders in `src/utils/` (DOM-free, testable with `node --test`)
- 2.5D canvas for Sound Racer (recommended), 2D canvas for Word Bridge
- Reuse: `rocketRunRounds.js`, `curriculumLadder.js`, `starRubric.js`, `catchUpQueue.js`, `gameSfx.js`

## Stage 1: Pure Builders (parallel, independent)

### Agent 1A — Sound Racer Builder
- **Output:** `src/utils/soundRacerTracks.js` + `tests/unit/soundRacerTracks.test.js`
- Reuse `rocketRunLadder(difficulty)`, `buildRocketRunRound(target, {count, difficulty})`
- Add `soundRacerLadder(difficulty)` → 10 ramped no-repeat targets (reuse `rocketRunLadder`)
- Add `buildTrack(target, { difficulty, seed })` → deterministic seeded lane sequence of gates
  - Fixed-length track, 3 lanes, correct words + obstacles + distractors
  - Correct words from `buildRocketRunRound` (truly onset the target)
  - Obstacles are non-letter hazards (hay bale / rock / cloud-bank per world)
- Tests: every track winnable, every wrong gate sound-distinct, same seed → identical track, hard has blends, easy doesn't

### Agent 1B — Word Bridge Builder  
- **Output:** `src/utils/wordBridgeLevels.js` + `tests/unit/wordBridgeLevels.test.js`
- Reuse `difficultyLadder(gameId, difficulty)`, `CVC_WORDS`, `SENTENCES`, `LETTER_EXAMPLES`
- Add `wordBridgeLadder(difficulty)` → 10 ramped levels via `difficultyLadder`
- Add `buildLevel({ world, cycle, mode, target })` → level data with slots, tiles, decoys, pals
  - Mode A (Bridge) only — horizontal span across a hazard
  - INVARIANT: enough correct tiles ALWAYS exist to complete the target
  - Decoys never a needed glyph of the target
- Tests: winnability invariant, decoy ≠ needed glyph, no-repeat across difficulty, sentence mode gives orderable word tiles

## Stage 2: React Components (parallel, depends on Stage 1 builders)

### Agent 2A — Sound Racer Component
- **Output:** `src/components/learn/games/games/SoundRacerGame.jsx`
- 2.5D canvas racer (NOT Three.js — the brief recommends 2.5D canvas for ground racers)
- Model: Rocket Run's feel but as a 2.5D perspective road on canvas
- 3 lanes, auto-forward, tap/keyboard steering
- Correct tile → boost + points + chime; wrong/obstacle → slow + time penalty (never crash)
- Always finishes — no death, no forced restart
- Target sound popup + 3-2-1 countdown before track starts
- Finish: time, words correct, accuracy, stars via `starRubric`, personal best
- 3 worlds: Meadow (lamb), Dino (baby dino), Moonwood (Luna on broom — flying, 3 vertical lanes)
- Reduced motion respected
- `{ teardown, pause, resume }` API
- `onProgressUpdate`, `onCheckpoint`, `onComplete`, `onScoreUpdate` callbacks
- Sound via `gameSfx.js` + `getSound` guard

### Agent 2B — Word Bridge Component
- **Output:** `src/components/learn/games/games/WordBridgeGame.jsx`
- 2D canvas Lemmings-style build-and-escort (model: LetterLeapGame.jsx)
- Mode A (Bridge) only: fetch tiles → place in correct slot IN ORDER → ring bell → Pals cross
- Wrong tile → wobbles into hazard (costs time, not a life)
- Wrong order → gently rejected
- Catch-up via `makeCatchUp` so no soft-lock
- Kind fail only: "try again" re-seed panel; NO game-over screen
- 3 worlds: Meadow (river, CVC easy), Dino (lava, blends), Moonwood (chasm + spores, longer words/sentences)
- Stars via `starRubric`
- Reduced motion respected
- `{ teardown, pause, resume }` API
- Same callback contract as Sound Racer
- Touch + keyboard controls (left/right, jump, pick/drop, ring bell)

## Stage 3: Integration (sequential, depends on Stages 1-2)
- Register both games in `src/components/learn/games/games/index.js`
- Add entries in `src/data/learnGamesData.js` `GAME_LIST` with `fullBleed: true, surfaces: ["arcade"]`
- Run eslint: `npx eslint` on all 4 new source files → 0 errors
- Run `node --test` on new test files → all pass
- Verify mount/unmount leak check
- Hand off gated ship command

## File Propagation
- Stage 1 outputs → Stage 2 agents (via file paths they read)
- Stage 2 outputs → Stage 3 (integration agent)
- All outputs → workspace path
