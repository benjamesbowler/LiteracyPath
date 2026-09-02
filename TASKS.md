# Tasks

## Active

- [ ] **P0 Step 1 — Establish the pilot game-quality evidence and runtime contract** - complete this minimum browser/diagnostic foundation before the proposed Sound Racer production expands
  - [ ] Define the production-disabled diagnostic-adapter contract and implement it first for `sound-racer`, with named seeded gameplay/presentation streams, checkpoint/state, quality, sound, motion, offline/asset-failure, visibility/pause and WebGL-context-loss controls plus a stable read-only snapshot.
  - [ ] Extend the real game preview through the pilot adapter without writing learner progress; the current preview's game/resume/sound/music inputs are not enough.
  - [ ] Route `sound-racer` simulation and presentation randomness—including particles, lane choice, scenery recycling and vehicle effects—through named seeded streams rather than `Math.random()`.
  - [ ] Capture onboarding, active play, correct, first error, recovery, checkpoint, completion, reduced-motion, sound-off, low-tier, offline/asset-failure and context/lifecycle recovery from the real renderer, plus one uninterrupted start-to-finish capture with input/state/event trace.
  - [ ] Add a validated per-game scene-kit/asset-record schema covering creator, licence, source revision, modifications, intended use and runtime path.
  - [ ] Make the 3D manifest/check count each glTF model's complete dependency closure, not only its JSON/container; review current collection headroom and own the curation, optimisation or approved policy change before importing the pilot kit.
  - [ ] Add a pilot composite production check covering contract, assets, playthrough, rendering, controls, layout, accessibility, photosensitivity, resilience and evidence status.
  - [ ] Keep generated frames, recordings, console/network logs and review output in ignored `.artifacts`; add the proven check to the release gate and CI only after its contract is stable.

- [ ] **P0 Step 2 — Ship `sound-racer` Sound Racer 3.0 as the proposed gold-standard game** - recommended first pilot under `docs/design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md`; the product owner may reorder this programme
  - [ ] Capture and review the current opening, first-control, mid-play, correct, wrong, recovery, completion, reduced-motion, sound-off and low-tier states.
  - [ ] Lock the experience sentence, learning/evidence contract, art-direction sheet, target frames, animation states, camera specification, audio plan and complete asset manifest.
  - [ ] Ground the high-quality route in current book/world canon with a canonical Pal or driver, not an unrelated vehicle-only mascot.
  - [ ] Separate curriculum, fixed-step simulation, presentation, input, typed feedback/audio events and progress evidence before expanding the monolithic engine.
  - [ ] Replace the straight sparse runway and primitive player vehicle in the high-quality path with an authored curved route, animated vehicle, rival pack, landmarks and composed environment kit.
  - [ ] Preserve a deliberately composed low/asset-failure scene, then remove superseded high-tier primitive builders only after verified cutover.
  - [ ] Add chase-camera behaviour, movement weight, event-driven VFX, bespoke HUD, ambience, action audio and complete start/checkpoint/finish presentation.
  - [ ] Complete cinematic, enhanced, performance, reduced-motion, sound-off and asset-failure paths; pass executable/direct-review gates and resolve every reported defect.
  - [ ] Record human-listening, supported-iPad and recurring-program child-observation status as `PASS`, `FAIL` or `UNKNOWN`; unknown limits the claim but does not by itself block the current beta.

- [ ] **P0 Step 3 — Reconcile in-flight game redesigns with the production standard** - audit in parallel after the guide lands; do not merge a finished-quality claim under the former contract-only definition of premium
  - [ ] `sound-seekers` Complete every live chapter, mechanic, state, transition, audio path and fallback—not only the Seedwake reference slice—and review it against the guide's evidence-status requirements.
  - [ ] `adventure-map / ElSkillsQuest` Complete the letter, sound, word, sentence and building mechanics while preserving the forward journey and teacher-controlled exact-stop path, then review the full result against the guide.
  - [ ] Keep each active worktree isolated and integrate only after the guide commit is present in its base.

## Waiting On

- [ ] **Supported-device floor** - product owner to name the oldest supported iPad and iPadOS before numeric policy encoding or fleet-wide physical-readiness claims, since 2026-09-02; this does not block implementation or the current browser beta

- [ ] **P1 — Generalise the shared production runtime and complete Arcade contracts** - waiting for the selected gold-standard pilot to prove the abstractions, since 2026-09-02
  - [ ] Generalise the diagnostic adapter from `sound-racer` across Three.js, Canvas2D and DOM/SVG games.
  - [ ] Add validated vertical-slice briefs for `rocket-run`, `rhyme-pop`, `sound-safari`, `reel-read`, `star-gallery`, `sentence-express`, `grammar-grind` and `soundkeys`; update the structural test without treating it as visual or playthrough proof.
  - [ ] Consolidate fixed-step simulation, named game states, action-mapped input, diagnostic hooks and pause/resume lifecycle.
  - [ ] Add a typed feedback-event contract and shared audio bus with game-specific cue banks, mix snapshots, spoken-instruction ducking and lifecycle ownership.
  - [ ] Consolidate scene-kit loading, skeletal animation, camera rigs, spline routes, entity/VFX pools and owned asset disposal.
  - [ ] Give shared model/texture caches explicit ownership and reference counting or bounded eviction; add sequential multi-game switching, memory/context and thermal-soak checks.
  - [ ] Adapt Quest's sustained-frame quality response, instancing and animation patterns without copying a world or presentation identity.
  - [ ] Keep the semantic HUD, accessibility controls, progress callbacks and learning evidence outside renderer-owned decisions.

- [ ] **P1 — Upgrade the remaining WebGL Arcade games** - waiting for the pilot/runtime cutover since 2026-09-02; apply the pipeline without cloning Sound Racer's world or HUD
  - [ ] `rocket-run` Rocket Run 3.0 - authored space-route kit, canonical animated hero craft, staged landmarks, camera/motion/audio pass and current learning contract.
  - [ ] `star-gallery` Sentence Grove 3.0 - authored grove traversal, animated player/world, readable repair encounters and bespoke feedback presentation.
  - [ ] `grammar-grind` Spell & Skate 3.0 - authored skater/board animation, route kit, trick feedback, camera energy and curriculum-first pressure.

- [ ] **P1 — Upgrade the Canvas2D Arcade games** - waiting for the pilot/runtime contract since 2026-09-02; use authored atlases, layered environments and game-specific motion rather than forcing every game into 3D
  - [ ] `letter-leap` Letter Leap 3.0 - canonical character animation atlas, coherent world art, layered parallax, platform set pieces and continuous spelling evidence.
  - [ ] `word-bridge` Word Bridge 3.0 - tactile authored building world, animated helper, coherent tiles/slots, route growth and recoverable error feedback.
  - [ ] `sound-beat` Sound Beat 3.0 - authored band/stage, instrument animation, performance feedback and rhythm that never decides literacy correctness.
  - [ ] `rhyme-pop` Rhyme Pop 3.0 - authored launcher/world, expressive target motion, aiming feel and readable non-colour feedback.
  - [ ] `sound-safari` Sound Safari 3.0 - authored habitat and creatures, locomotion/capture animation, environmental depth and ordered-sound clarity.
  - [ ] `reel-read` Reel & Read 3.0 - authored boat/water/fish world, casting animation, camera response and clear language-part feedback.

- [ ] **P1 — Upgrade the semantic DOM/SVG Arcade games** - waiting for the pilot/runtime contract since 2026-09-02; retain accessible native interaction while reaching the same authored finish
  - [ ] `word-climb` Word Climb 3.0 - coherent illustrated beanstalk world, canonical climber animation, tactile leaves, depth and complete state transitions.
  - [ ] `sentence-express` Sentence Express 3.0 - authored train/railway world, coupling motion, station progression, semantic repair controls and bespoke result states.
  - [ ] `soundkeys` SoundKeys 3.0 - authored instrument/stage world, responsive performance animation, MIDI/keyboard/touch parity and expressive audio feedback.

- [ ] **P1 — Upgrade all nine remaining games in the 22-game Learn Games catalogue** - waiting for the pilot production contract since 2026-09-02; choose each medium from its learning action
  - [ ] `cvc-word-builder` CVC Word Builder 3.0 - tactile authored word workshop, expressive letter handling, complete build/retry/result states and specific sound feedback.
  - [ ] `sight-word-memory` Sight Word Memory 3.0 - coherent tabletop/card world, readable flip/match animation, authored progress and accessible memory controls.
  - [ ] `blend-and-build` Blend & Build 3.0 - authored word-family construction world, satisfying joins, clear family growth and recoverable contrast feedback.
  - [ ] `word-rescue` Word Rescue 3.0 - complete rescue journey with canonical characters, visible stakes, authored route progression and literacy-led bridge building.
  - [ ] `sound-sort-factory` Sound Sort Factory 3.0 - active production-line world, tactile sorting, character/machine animation and specific sound-contrast recovery.
  - [ ] `letter-garden` Letter Garden 3.0 - authored growing garden, canonical helper animation, visible word-to-growth consequences and complete seasonal progression.
  - [ ] `pop-the-word` Pop the Word 3.0 - coherent balloon/festival world, responsive aiming/pop feel, readable word targets and non-speed-led fluency evidence.
  - [ ] `word-hopscotch` Word Hopscotch 3.0 - authored play-space journey, character hops, sentence-order staging and forgiving semantic controls.
  - [ ] `reading-race` Sentence Fix-It 3.0 - authored repair/detective world, tactile choices, visible sentence transformation and complete explanation/retry states.

- [ ] **P1 — Inventory game surfaces outside the 22-game catalogue** - waiting for the pilot contract since 2026-09-02; produce an exact runtime-derived roster before assigning unknown-scope upgrades
  - [ ] Classify each discovered surface as game, mini-game, world or game-like reward interaction and record its stable ID/import path.
  - [ ] Add one concrete task per discovered Story Quest action, Phonics/Letters practice game and My Hollow game-like reward surface, with target medium, production scope and evidence.

- [ ] **P1 — Complete the programme evidence matrix** - waiting for each implementation since 2026-09-02; cover all 22 Learn Games plus every discovered surface
  - [ ] Confirm construct, ambiguity, fresh-choice, control, route, audio, accessibility, photosensitivity, performance, privacy and fallback status for every game.
  - [ ] Review full-size visual states and continuous motion for every intended high and low quality path.
  - [ ] Record human listening and supported-device results when performed; never infer them from files, emulation or automation.
  - [ ] Route child observation only through `docs/research/RECURRING_OBSERVATION_PROGRAM.md`; record unknown when no approved cycle has observed the changed game.
  - [ ] Resolve every reported defect; unknown manual metadata limits claims but does not by itself block the current beta.
  - [ ] Remove superseded procedural builders, temporary candidates, duplicate assets and stale evidence after each verified cutover.

## Someday

## Done
