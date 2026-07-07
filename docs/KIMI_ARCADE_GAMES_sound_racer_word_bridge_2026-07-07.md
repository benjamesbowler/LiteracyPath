# KIMI TASK — Build the two SNES/PS1 arcade games: Sound Racer + Word Bridge

Date: 2026-07-07. You are the sole coder. **Before anything, read `AGENTS.md` and `docs/OPERATING_MANUAL.md`** — they govern all work here (the cardinal rule: never claim success without a passing check you can name; run the Loop; verify by re-deriving; label guesses; attack before shipping; answer→reasoning→risk).

**The design already exists** in `docs/GAME_CONCEPTS_bridge_builders_and_sound_racer_2026-07-06.md`. Read it — it is the source of truth for fantasy, core loop, controls, scoring, and per-world content. **This brief is the BUILD CONTRACT**: exactly how to slot these into *this* codebase so they behave like the two live arcade games (Rocket Run, Letter Leap), pass the gates, and don't repeat the bugs those two already paid for.

Build order (from the concept doc, section 3): **Sound Racer first** (it reuses Rocket Run's proven round builder → fastest to playable), then **Word Bridge**.

---

## 0. THE ARCADE-GAME CONTRACT (both games must follow this exactly)

Study the two live games as your templates — do not invent a new pattern:
- `src/components/learn/games/games/RocketRunGame.jsx` — imperative 3D (Three.js via CDN), the model for Sound Racer.
- `src/components/learn/games/games/LetterLeapGame.jsx` — imperative 2D canvas platformer, the model for Word Bridge.

### 0.1 Separate the pure core from the impure shell (Operating Manual, Ch 2)

Every game is TWO files:
1. **A pure, DOM-free level/round builder in `src/utils/`** — data in, data out, zero Three.js/DOM/canvas. This is what makes "every level winnable, every distractor sound-distinct" *provable in `node --test` without a browser*. This is non-negotiable — it's the same discipline as `rocketRunRounds.js` / `curriculumLadder.js`.
   - Sound Racer → `src/utils/soundRacerTracks.js`
   - Word Bridge → `src/utils/wordBridgeLevels.js`
2. **A thin React component** in `src/components/learn/games/games/` that renders it imperatively.

### 0.2 The React component skeleton (copy this shape verbatim)

```jsx
export default function SoundRacerGame({ difficulty = "easy", startLevel = 0, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const mountRef = useRef(null);
  const soundRef = useRef(isSoundEnabled);
  useEffect(() => { soundRef.current = isSoundEnabled; }, [isSoundEnabled]);
  useEffect(() => {
    if (!mountRef.current) return undefined;
    let api = { teardown() {} };
    try {
      api = startGame(mountRef.current, {
        difficulty, startLevel, onScoreUpdate, onProgressUpdate, onComplete, onCheckpoint,
        getSound: () => soundRef.current
      });
      if (onEngineReady) onEngineReady(api);
    } catch (err) { console.error("[SoundRacer] failed to start:", err); }
    return () => { try { api.teardown(); } catch { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);
  return <div ref={mountRef} style={{ position: "relative", width: "100%", height: "100%", minHeight: "460px", overflow: "hidden", background: "#070b1e", touchAction: "none" }} />;
}
```

### 0.3 The imperative engine returns `{ teardown, pause, resume }` (mandatory)

`startGame(mount, opts)` runs the game OUT of React (one RAF loop) and returns three functions. `GamePlayer.jsx` calls `pause`/`resume` when the quit dialog opens or the tab is backgrounded, and `teardown` on unmount. Implement them like the live games:

```js
let running = false, paused = false, savedRunning = false, last = 0;
function pause() { if (paused) return; paused = true; savedRunning = running; running = false; }
function resume() { if (!paused) return; paused = false; last = performance.now(); if (savedRunning) running = true; }
function teardown() { /* cancelAnimationFrame, remove ALL listeners, ResizeObserver.disconnect(), dispose GPU (Three) / remove DOM nodes */ }
return { teardown, pause, resume };
```

### 0.4 Register + list the game

- **`src/components/learn/games/games/index.js`** — add to `LEARN_GAMES`:
  ```js
  "sound-racer": lazyWithRetry(() => import("./SoundRacerGame.jsx")),
  "word-bridge": lazyWithRetry(() => import("./WordBridgeGame.jsx")),
  ```
- **`src/data/learnGamesData.js`** `GAME_LIST` — add an entry each. Copy Rocket Run's shape. Arcade games MUST have `fullBleed: true` and `surfaces: ["arcade"]` (this is what makes the modal edge-to-edge and puts it in the arcade grid). Add `is3D: true` only if you use Three.js. Example:
  ```js
  { id: "sound-racer", title: "Sound Racer", skill: "Read beginning sounds at speed", category: "Phonics",
    ...GAME_ACCENTS.blue, icon: "/images/learn-games/icon-sound-racer.webp",
    description: "Race the track — grab the words that start with your sound to boost.",
    fullBleed: true, surfaces: ["arcade"] },
  ```
  Icons don't exist yet — the arcade card falls back to the icon path on 404, so ship with the entry and request the Seedream icon separately (`tools/generate-arcade-icons.mjs` pipeline). Do NOT block on art.

### 0.5 Reuse the shared framework — do not reinvent it

- **Difficulty → world:** `worldForGameDifficulty(difficulty)` from `src/utils/curriculumLadder.js` returns `"meadow" | "dino" | "moonwood"` (easy/medium/hard). Ramped no-repeat levels: `difficultyLadder(gameId, difficulty)` / `levelPlan(...)`, `LEVELS_PER_DIFFICULTY` (10).
- **Sound Racer content:** reuse `src/utils/rocketRunRounds.js` — `rocketRunLadder(difficulty)` (10 ramped no-repeat sound targets), `buildRocketRunRound(target, {count, difficulty})` (distinct correct words that truly onset with the target + sound-distinct distractors, via `onsetGrapheme`/`sharesSound`/`wordsStartingWith`). **This is the fairness guarantee — every wrong tile is genuinely a different sound. Do not write your own word logic.**
- **Word Bridge content:** `CVC_WORDS.{easy,medium,hard}` and `SENTENCES.level3` from `learnGamesData.js`; `LETTER_EXAMPLES` from `elSkillsBlockCycles.js`. Decoy letters must never be a needed letter of the target (see Letter Leap's `decoyPool` filter — copy that invariant).
- **Catch-up:** `makeCatchUp(targets)` from `src/utils/catchUpQueue.js` — a missed target returns later; the level only completes when all are done. Use it so no level can soft-lock.
- **Stars:** `starRubric({ correct, total, mistakes, deaths })` from `src/utils/starRubric.js` — the ONE shared rubric (3 = clean, 2 = good, 1 = finished, 0 = nothing). Don't hand-roll scoring.
- **Resume/persistence:** accept `startLevel`, and call `opts.onCheckpoint(levelIndex, LEVELS_PER_DIFFICULTY)` at the start of each level + `opts.onProgressUpdate(current, total)` — GamePlayer wires the Continue/Start-over prompt and the "Lvl N/10" chip for free.
- **Audio:** `src/utils/audio/gameSfx.js` — `playCorrectChime, playPopSound, playSoftBuzz, playStarChime, playCelebrationFanfare, playTapSound, playWhoosh`. Gate every sfx on sound: `const sfx = fn => { try { if (opts.getSound && opts.getSound()) fn(); } catch {} };`. Gold-voice word readout: `speakWord(word)` / `speak(text)` from `learnGamesAudio.js` — **the target sound and the goal are spoken; the built/collected word is NOT spoken letter-by-letter unless Benjamin asks** (he cut per-sound speech in the last pass: "we're just teaching letter recognition").
- **Reduced motion:** `const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);` — disable screen shake, speed-lines, particle bursts, heavy parallax when set. Every new effect respects it.

### 0.6 Three.js rules (Sound Racer, if you go 3D) — these are paid-for lessons, obey them

- Load r128 from the CDN exactly like Rocket Run's `loadThree()` (keep a **fallback CDN** chain; the URL is `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`). r128 has `outputEncoding`/`sRGBEncoding`/`ACESFilmicToneMapping` — newer APIs do NOT; do not "upgrade" the calls.
- **Create the `WebGLRenderer` BEFORE the HUD**, wrapped: `try { new WebGLRenderer({antialias:true}) } catch { new WebGLRenderer({antialias:false}) }`. A WebGL failure must produce a clean error, never an orphaned HUD.
- **Declare every top-level `let`/`const` used in scene setup ABOVE the line that uses it.** A `speedLines.push()` in setup with `const speedLines = []` declared later is a temporal-dead-zone `ReferenceError` that throws on EVERY load — ESLint will NOT catch it, and it looks like a generic "needs 3D graphics" crash. This exact bug shipped once. Trace declaration-before-use for every setup symbol.
- **Dispose everything** at `scene.remove` and in `teardown` (geometry, material, `.map`), `renderer.forceContextLoss()`, `ResizeObserver` on the mount. Leaked WebGL contexts eventually make `new WebGLRenderer()` fail for the whole tab.
- **2.5D canvas is the recommended default** for Meadow/Dino ground racers (concept doc 2.10) — cheaper, robust on tablets, and sidesteps all of the above. Reserve Three.js for the Moonwood flight if depth really sells it. Your call, but justify it and keep the *contract* identical.

---

## SOUND RACER — build first

Follow the concept doc §2 for design (fantasy, core loop, controls, star scoring, HUD). Build mission by mission; **after each: lint → unit tests → (Benjamin plays) → screenshot. Never move on with a red gate.**

**M0 — Pure track builder + tests.** `src/utils/soundRacerTracks.js`:
- `soundRacerLadder(difficulty)` → 10 ramped, no-repeat sound targets (reuse `rocketRunLadder`).
- `buildTrack(target, { difficulty, seed })` → a DETERMINISTIC (seeded) fixed-length lane sequence of gates: `{ z, lane, kind: "word"|"obstacle", word?, correct? }`. Correct words come from `buildRocketRunRound` (truly onset the target); obstacles are non-letter hazards. Fixed length + seed so leaderboard times are comparable and tests reproducible (concept doc 2.10).
- `tests/unit/soundRacerTracks.test.js` — assert: every track has ≥ needed correct gates and is winnable; every "word" gate marked `correct:false` is sound-distinct from the target (`!sharesSound(onsetGrapheme(word), target)`); same seed → identical track (determinism); hard ladder includes blends, easy doesn't.

**M1 — Component + integration.** `SoundRacerGame.jsx` + register + `learnGamesData` entry. Bare loop: forward auto-motion, 3 lanes, `getSound`, `{teardown,pause,resume}`, `onProgressUpdate`/`onCheckpoint`. Gate: it opens in the arcade, the "Lvl 1/10" chip shows, pause works.

**M2 — Core race loop (concept doc 2.2–2.4).** Steer lanes; steer INTO correct tiles → boost + points + chime + "words read" counter; wrong tiles/obstacles → slow down + small time penalty (never crash-to-zero). Speed = base + correct×boost − wrong×drag. Finish line → results (time, words correct, accuracy, stars via `starRubric`). **You always finish** — no death, no forced restart. Reuse Rocket Run's readable label sprites / big high-contrast tiles.

**M3 — Feel (PS1/Wipeout juice).** Perspective road/sky rushing at the player; boost speed-lines (reduced-motion-guarded); lane-tap steering; a get-ready target-sound popup + 3-2-1 countdown before the track starts (copy Rocket Run's `showCountdown`); FOV/speed kick on boost; camera life. Match the SNES/PS1 grade of the Rocket Run quality pass.

**M4 — Worlds (concept doc 2.5).** Meadow Dash (lamb, ground) / Dino Dash (baby dino, ground) / Moonwood Flight (Luna on a broom, flying). Re-skin by `worldForGameDifficulty` — different backdrop, tile accent, obstacle art, speed feel. Reuse `tools/generate-game-backgrounds.mjs` for backdrops; request back-view racer sprites via the Seedream pipeline (don't block on art — canvas fallbacks first).

**M5 — Leaderboard + polish (concept doc 2.4).** Personal best per track `{ bestTimeMs, wordsCorrect, accuracy, stars }`, piggybacked on the existing progress persistence (`learnGamesProgress.js`) — NOT a new data store. "New best!" ribbon. Finish fanfare in world accent.

---

## WORD BRIDGE — build second

Follow concept doc §1. Lemmings-style build-and-escort on 2D canvas (model: `LetterLeapGame.jsx`). Ship **Mode A (Bridge)** first; Modes B (Ladder) and C (Shelter) are later level packs — same engine, different slot geometry + win animation.

**M0 — Pure level builder + tests.** `src/utils/wordBridgeLevels.js`:
- `wordBridgeLadder(difficulty)` → 10 ramped levels via `difficultyLadder`/`CVC_WORDS`/`SENTENCES`.
- `buildLevel({ world, cycle, mode, target })` → `{ mode, target, slots, tiles:[{glyph, correct, order}], decoys, pals, patience, hazard }` exactly per concept doc §1.4. **INVARIANT (assert in tests): enough correct tiles ALWAYS exist to complete the target** (a level can never be truly uncompletable — same guarantee as Letter Leap's ground letters). Decoys are sound-distinct and never a needed glyph.
- `tests/unit/wordBridgeLevels.test.js` — winnability invariant, decoy-≠-needed-glyph, no-repeat across a difficulty, sentence mode gives orderable word tiles.

**M1 — Component + integration** (register, `learnGamesData` `surfaces:["arcade"]`, `{teardown,pause,resume}`, checkpoints). Gate: opens in arcade, chip + pause work.

**M2 — Core build loop (concept doc 1.2, 1.6).** Fetch (walk builder, tap pick-up, carry 1–3), place in the correct slot IN ORDER (wrong tile wobbles into the hazard — costs time not a life; wrong order gently rejected), ring the bell → Pals conga across → level clear + `starRubric`. **Kind fail only:** the "try again" re-seed panel; NO game-over screen ever. Catch-up (`makeCatchUp`) so it can't soft-lock.

**M3 — Feel (SNES juice).** Copy the Letter Leap game-feel kit: coyote time + jump buffer + variable jump for the builder, landing/run dust, score popups, stomp/impact shake (reduced-motion-guarded), a chunky get-ready banner. Bridge completes → glows in `--pal-accent`, Pals cheer. Tiles: big rounded chunky glyphs, single accent, subtle bevel (blocky, not babyish).

**M4 — Worlds + hazards (concept doc 1.4).** Meadow (river, CVC easy) / Dino (lava, blends) / Moonwood (chasm + spores, longer words / sentences). Re-skin by `data-pal-world` / `worldForGameDifficulty`. Parallax backdrops via `tools/generate-game-backgrounds.mjs`; builder + Pal sprites per world (Meadow Pals already named in `guidedReadingSeriesBooks.js` — keep them consistent). Canvas fallbacks first.

**M5 — Modes B/C as level packs** (Ladder/Shelter) once Mode A is solid + shipped.

---

## GLOBAL VERIFICATION LOOP (run until clean; never claim success without it)

1. `npx eslint src/components/learn/games/games/SoundRacerGame.jsx src/components/learn/games/games/WordBridgeGame.jsx src/utils/soundRacerTracks.js src/utils/wordBridgeLevels.js` → **0 errors**.
2. `node --test tests/unit/*.test.js` → all pass (includes your two new builder test files proving winnability + sound-distinct distractors + determinism).
3. **Mount/unmount the game modal 5× and confirm no leaked listeners / no unbounded scene growth** (the leak check from the arcade quality pass).
4. **Visual/feel gate (human-check rule — you cannot verify feel yourself):** hand Benjamin a rendered preview or screenshots per world; the *feel* (SNES/PS1 grade, control snappiness, difficulty spacing) needs his eyes. Do not claim "done" on feel.
5. `graphify update .`

## HANDOFF

Per this repo's flow (see `docs/OPERATING_MANUAL.md` + the sandbox build limitation): you likely **cannot run the production build or push** in your sandbox (rolldown native binding). Verify with eslint + `node --test`, then hand Benjamin ONE gated command — do NOT claim it's deployed. Add the new files to the staging list and give him:

```bash
bash ~/Desktop/LiteracyPath/ship-live-now.sh
```

…after adding `SoundRacerGame.jsx`, `WordBridgeGame.jsx`, `soundRacerTracks.js`, `wordBridgeLevels.js`, their test files, `games/index.js`, and `learnGamesData.js` to that script's `git add` list.

## ACCEPTANCE CRITERIA

- [ ] Both games open from the arcade grid, full-bleed, with the "Lvl N/10" chip, sound toggle, pause-on-quit, and Continue/Start-over resume — because they use the shared contract (§0), not a bespoke one.
- [ ] Pure builders in `src/utils/` with `node --test` proving **every level winnable** and **every distractor sound-distinct** (Sound Racer reuses `rocketRunRounds.js`; Word Bridge guarantees enough correct tiles).
- [ ] 3 worlds each via `worldForGameDifficulty` (meadow/dino/moonwood) — visibly distinct skins, not recoloured clones.
- [ ] SNES/PS1-grade feel matching Rocket Run / Letter Leap (get-ready countdown, juice, reduced-motion respected).
- [ ] Kind, fail-free design: Sound Racer always finishes; Word Bridge only ever offers a gentle retry. No game-over screens.
- [ ] eslint 0 errors, unit suite green, listener/leak check clean; screenshots delivered; ONE gated ship command handed over. No silent "deployed."
