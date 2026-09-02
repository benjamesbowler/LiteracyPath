# LiteracyPath game visual and playability production guide

- **Status:** canonical implementation guide
- **Audience:** implementation agents, developers and reviewers upgrading any child-facing game
- **Scope:** Arcade games, Adventure Map mini-games, Sound Seekers, worlds and game-like reward surfaces
- **Product authority:** [Game Design Bible](GAME_DESIGN_BIBLE.md)
- **Related authority:** [Product Vision](../architecture/PRODUCT_VISION.md), [Child Surface Rules](CHILD_SURFACE_RULES.md), [Learning Policy](LEARNING_POLICY.md), [Sound Seekers Release Bible](../SOUND_SEEKERS_RELEASE_BIBLE.md), [Recurring Observation Programme](../research/RECURRING_OBSERVATION_PROGRAM.md), [3D Asset Library](../3D_ASSET_LIBRARY.md)
- **Programme backlog:** [`TASKS.md`](../../TASKS.md)

This guide defines how to turn a functionally correct LiteracyPath activity into
an authored, visually coherent and genuinely playable game. It implements the
Game Design Bible; it does not replace or weaken its learning, accessibility,
privacy, safety or device requirements.

The current Learn Games catalogue contains 22 games: 13 are surfaced in the
Arcade roster and nine are retained in the wider catalogue. The programme also
covers Sound Seekers, Adventure Map and every other child-facing surface that
uses game mechanics or game-like rewards; [`TASKS.md`](../../TASKS.md) keeps the
explicit roster and discovery work.

The product-owner shorthand is **move from Amstrad/Spectrum-level presentation
to PS3-level presentation and playability**. That is a quality comparison, not
a literal console specification. It means recognisable production assets,
coherent worlds, animation, camera craft, lighting, effects, sound, responsive
controls and a complete game loop. It does not mean photorealism, excessive
polygon counts, copying a commercial game, or sacrificing legibility on iPad.

## 1. The outcome

A finished upgrade must feel like a small, deliberately produced game from its
first playable second through its completion state. A child should not see a
quiz placed over placeholder scenery, a tech demo, an asset catalogue, a static
illustration with buttons, or a generic shell shared by unrelated genres.

The implementation target comprises all of the outcomes below. A beta build may
carry `UNKNOWN` manual evidence under section 10, but it may not be described as
verified for that row until the corresponding direct evidence exists.

| Area | Required visible outcome |
| --- | --- |
| Player fantasy | The child can immediately tell who they are, what they are doing and why it is exciting. |
| Learning action | The action that advances the game is the literacy decision; steering, jumping or timing alone never creates learning evidence. |
| Art direction | Character, world, route, props, materials, palette, lighting, interface and effects look as though they belong to one production. |
| World | The environment has readable foreground, play space, background depth, landmarks and meaningful dressing rather than large empty regions. |
| Character or vehicle | The hero has an authored silhouette, materials and animation states. Primitive-only or substitute protagonists are not final art. |
| Motion | Acceleration, stopping, jumping, turning, impacts and recovery have anticipation, response and follow-through appropriate to the genre. |
| Camera | Framing, look-ahead, damping, scale and controlled emphasis make the action legible and energetic without causing motion discomfort. |
| Feedback | Every important action produces an immediate combination of motion, shape, sound and interface response; colour is never the only cue. |
| Sound | Spoken instruction, action sound, ambience, music and success/error feedback form one intentional mix and respect all audio settings. |
| Interface | The HUD is game-specific, sparse, readable at play distance and visually subordinate to the learning target. |
| Game loop | Onboarding, play, escalating application, error recovery, checkpointing, completion and exit are all present and exercised. |
| Device quality | The declared quality paths remain responsive, legible and complete; “physical-iPad ready” is claimed only after the current build succeeds on the product-owner-selected supported device. |

Do not average these areas into a score. A blocking failure in one area remains
a failure even if the rest looks attractive.

### What the target does not permit

- A player, vehicle, resident or boss assembled entirely from boxes, cylinders,
  cones or debug geometry in the shipping high-quality scene.
- One repeated backdrop, straight corridor or empty plane carrying an entire
  world without authored landmarks, route variation or spatial composition.
- Generated concept art used as a flat wallpaper while gameplay objects ignore
  its perspective, route, light or visual language.
- Mismatched painterly backgrounds, pixel sprites, low-poly props and generic
  interface elements without an intentional hybrid-art specification.
- Default browser, engine or shared-app chrome dominating the play frame.
- Glow, bloom, fog and particles used to hide weak geometry or muddy hierarchy.
- Decorative rivals, timers or hazards deciding whether a correct literacy
  response counts.
- A short capture that looks good while pause, error, retry, completion,
  persistence, sound-off, reduced-motion or low-power states remain unfinished.
- Calling a game `premium`, `3.0`, `PS3-level`, `finished` or `ready` because it
  compiles, loads assets or passes unit tests.

Retro pixel or vector art is allowed when it is an intentional, fully authored
style. The defect is not low resolution; it is placeholder production,
incoherence and shallow interaction.

## 2. Production principles

### Build one gold-standard game before upgrading the roster

Choose one game whose mechanic benefits from the target medium and complete it
end to end. Do not distribute a visual pass across the roster until that game
has passed every executable and direct-review gate, has no reported blocking
defect and has an honest status for every manual row in the evidence matrix.
When the user requests the whole roster, the vertical slice is an internal
production stage, not a smaller substitute for the requested finished result.

After the selected gold-standard implementation has passed every executable
gate and has no reported blocking defect, extract only the systems that have a
clear second consumer. Reuse rendering infrastructure, loaders, control
contracts, audio lifecycle and evidence tooling. Do not reuse one game's
identity, HUD, world dressing or effects as generic decoration for every genre.

### Art is a production dependency, not code decoration

Lock the player fantasy, art direction, asset list, target frames, animation
states, camera behaviour and audio plan before final scene construction. Code
must provide stable attachment points and state events for authored assets.
Assets must be reviewed in the running game, not accepted because they look
good in a generator, Blender viewport, contact sheet or isolated model viewer.

### Quality comes from visible iteration

Every major stage ends with a rendered comparison against the target frames.
Fix the largest visible or playability defect, capture again and repeat. Do not
perform a long invisible implementation pass and hope that post-processing will
make the final result coherent.

### Preserve the LiteracyPath advantage

External showcase clips often prove only presentation. LiteracyPath must also
retain:

- construct-valid literacy evidence;
- child-safe error recovery;
- keyboard, pointer and touch parity;
- 56 CSS-pixel controls and safe areas;
- reduced-motion and sound-off paths;
- resumable progress and lifecycle cleanup;
- no child-data expansion, unreviewed runtime dependency or runtime call to a
  generation service;
- low-power and failed-asset fallbacks;
- honest physical-device and child-observation evidence status.

These requirements increase the production scope. They do not justify poor art
or unresponsive play.

## 3. Use the existing architecture deliberately

The repository already contains most of the technical foundation required for
console-like web presentation:

- game registry: [`src/data/learnGamesData.js`](../../src/data/learnGamesData.js);
- runtime imports: [`src/components/learn/games/games/index.js`](../../src/components/learn/games/games/index.js);
- full-screen lifecycle and shared chrome: [`GamePlayer.jsx`](../../src/components/learn/games/GamePlayer.jsx);
- Three.js renderer, quality tiers and recovery: [`threeShell.js`](../../src/components/learn/games/shared/threeShell.js);
- post-processing and material preparation: [`arcadePremiumRender.js`](../../src/components/learn/games/shared/arcadePremiumRender.js);
- owned glTF loading and cloning: [`premiumGameAssets.js`](../../src/components/learn/games/shared/premiumGameAssets.js);
- machine-readable game contract: [`arcadeVerticalSliceBriefs.js`](../../src/components/learn/games/shared/arcadeVerticalSliceBriefs.js);
- validated 3D library: [`public/models/library/manifest.json`](../../public/models/library/manifest.json) through [`threeAssetLibrary.js`](../../src/data/threeAssetLibrary.js);
- reusable skeletal animation, instancing and authored world-kit patterns in [`questAssets.js`](../../src/components/quest/world/questAssets.js);
- stronger scene-lighting/material patterns in [`questPremiumRender.js`](../../src/components/quest/world/questPremiumRender.js);
- sustained-frame adaptive quality patterns in [`questPerformance.js`](../../src/utils/questPerformance.js).

Reuse these proven patterns through a shared contract where appropriate; do not
copy whole Quest modules into each Arcade component. Arcade's current initial
hardware tier is not a substitute for adapting to sustained measured performance.

Keep the current React/Vite application and select the renderer that best fits
the learning action:

| Medium | Prefer it for | Production requirement |
| --- | --- | --- |
| Three.js | racing, running, explorable spaces, spatial collection, cinematic set pieces | Authored glTF kit, purposeful camera, animation, lighting, quality tiers and complete fallback. |
| Canvas 2D | platformers, aiming, tactile construction, particles and dense illustrated action | Authored sprite atlas, layered scenes, deterministic simulation, parallax and resolution-independent UI. |
| DOM/SVG | sentence building, ordered manipulation and semantics-heavy interaction | Physical-feeling illustration and motion while native controls retain focus and assistive semantics. |
| Hybrid | a spatial world with semantic choices, labels or controls | One state model; visual and semantic layers remain aligned and never create competing answer cues. |

Do not convert a game to 3D merely to claim a higher tier. A beautifully
authored 2D game can exceed a poorly assembled 3D scene.

### Required separation of concerns

Substantially upgraded games must separate these responsibilities even if the
legacy component currently combines them:

```text
curriculum content -> deterministic game rules -> game state/checkpoint
                            ^                       |
                            |                       v
input adapters --------> simulation --------> render snapshot
                                                |    |    |
                                                v    v    v
                                               VFX  audio HUD

Only validated learning events --------------------> progress evidence
```

- **Curriculum content** owns prompts, targets, distractors and level demand.
- **Simulation** owns movement, collision, timers, opponents and deterministic
  state transitions.
- **Renderer** consumes state; it does not decide literacy correctness.
- **Input adapters** map keyboard, pointer and touch to the same named actions.
- **Feedback events** drive visual effects, animation, audio and HUD response.
- **Evidence writer** accepts only validated literacy events, never motion,
  survival, coins, collisions or frame timing.
- **Persistence** stores only the existing authorised progress and checkpoint
  contract unless a separate data change is approved.

Avoid adding more scene construction, simulation, curriculum and UI code to one
multi-thousand-line component. Extract pure rules and configuration first, then
isolate scene creation, asset ownership, animation state, audio cues and
disposal. Keep generated objects out of React state when they only belong to the
render loop.

### Simulation and control baseline

- Use a fixed-step accumulator for movement, collisions and other real-time
  game rules. Render interpolation may use the previous/current states, and
  presentation-only animation may use a bounded delta; a hidden tab or slow
  frame must never become a physics jump.
- Separate previous and current simulation state when render interpolation is
  needed.
- Make input event-driven and cancellation-safe. Release held actions on
  `pointerup`, `pointercancel`, `lostpointercapture`, blur, pause and unmount.
- Give movement explicit acceleration, braking, air/ground control and maximum
  response rules instead of changing position directly per frame.
- Keep collision geometry simple, stable and aligned with visible geometry.
- Seed authored variation when replay or tests require reproducibility.
- Pause the simulation, audio and pending feedback together; reset timing on
  resume.
- Dispose render resources, mixers, observers, timers and audio nodes at the
  shared lifecycle boundary.

## 4. Mandatory pre-production pack

Before production implementation, the implementation agent must produce and review the following
pack. Temporary comparisons and generated candidates belong in ignored
`.artifacts`, not the documentation tree. Durable contracts belong in current
source files.

### 4.1 Current-state capture

Play the actual game and capture, at minimum:

1. opening frame before input;
2. first controllable frame;
3. normal mid-play frame;
4. correct-response moment;
5. wrong-response and supported-retry moment;
6. completion and exit moment;
7. low-power or failed-asset fallback;
8. reduced-motion and sound-off states.

Capture the applicable supported viewports, including iPad landscape and
portrait. Record visible defects, control defects, learning defects and missing
states separately. A screenshot of a loading screen or menu is not gameplay
evidence.

### 4.2 Experience sentence

Complete this sentence without referring to technology:

> The child is **[role]** in **[world]**, repeatedly **[game action that is also
> the literacy decision]** so that **[visible goal]**, while **[supportive
> pressure or variation]** changes without deciding correctness.

If the literacy action appears only in a modal quiz, redesign the loop before
making art.

### 4.3 Art-direction sheet

Specify:

- world fantasy and emotional tone;
- canonical characters and their scale relationship;
- silhouette language;
- palette roles for player, route, targets, hazards and background;
- shape language and material family;
- lighting direction, value hierarchy and atmosphere;
- foreground, play-space and background layers;
- environmental storytelling and landmark plan;
- HUD visual language and typography;
- effect language for movement, correct, wrong, retry and completion;
- forbidden mismatches and reference elements that must not be copied.

Use a small number of strong references. Explain the property being borrowed—
such as depth staging, camera energy or material cohesion—rather than requesting
another creator's exact style or assets.

### 4.4 Target-frame sheet

Create target frames for the same gameplay states listed in the current-state
capture. Each target frame must show the real target aspect ratio, safe areas,
HUD hierarchy, readable literacy objects, approximate character scale and
environment density. Generated frames are direction, not approved runtime
assets. Text and answer content must be added from trusted application data,
never baked into generated imagery.

Place current and target frames side by side. Write the largest visible delta
under each pair. This comparison becomes the visual contract for implementation.

### 4.5 Asset and animation inventory

List every required asset by semantic role, not by vague category. A useful
flagship inventory normally includes:

- a hero character or vehicle with all gameplay animation states;
- necessary rivals, residents, enemies or helpers with readable variants;
- modular route, terrain or platform pieces;
- landmarks and progression set pieces;
- foreground and background dressing;
- interactable literacy objects and non-answer-revealing states;
- UI frames, icons, meters and result treatments;
- particles, trails, decals and impact effects;
- music, ambience, movement, interaction, correct, wrong, retry and completion
  audio;
- complete lower-quality and failed-asset fallbacks.

This is a planning baseline, not an asset-count quota. The inventory is complete
when every target-frame element and gameplay state has an owned source and an
implementation path.

For every asset record origin, creator, licence, source URL or revision,
modifications, intended use and runtime path. Generated assets also record the
tool and source inputs needed for provenance and later replacement. Store this
in a validated per-game scene-kit or asset-record source of truth. The current
generated 3D library manifest does not yet contain every one of these fields, so
do not treat updating that manifest alone as complete provenance evidence.

### 4.6 Interaction and camera specification

Specify all states rather than leaving them to implementation guesswork:

- idle, start, active, paused, hidden, resumed, correct, wrong, recovering,
  checkpoint, completed, exiting, asset failure and context loss;
- keyboard, pointer and touch control map;
- acceleration, turn, jump, braking, collision and forgiveness behaviour;
- camera follow target, look-ahead, damping, bounds, transitions and reduced
  motion;
- sound priority and ducking under spoken instruction;
- HUD changes and accessible announcements for each state.

### 4.7 Machine-readable product contract

For every substantial Arcade change, add or update its record in
`arcadeVerticalSliceBriefs.js` before the first slice expands. The brief must
match the current Game Design Bible and name exact unit, browser and hardware
evidence. Passing `validateGameVerticalSliceBrief()` proves only that the plan
is structurally complete; it is not proof that the game looks or plays well.
At the time of this guide, only Letter Leap, Word Climb, Word Bridge, Sound Beat
and Sound Racer have validated briefs. The other eight Arcade records must gain
briefs before their 3.0 rebuilds expand.

## 5. Asset production pipeline

### 5.1 Choose owned, editable sources

Prefer assets that can be inspected, edited, optimised and retained locally.
Use the [3D Asset Library](../3D_ASSET_LIBRARY.md) for current sources and
licensing rules. Do not introduce a runtime dependency on a generation service.
An external service may assist at build time only after the repository's
privacy, cost and rollback requirements are satisfied.

Never upload child data, learner recordings, credentials, private school data
or production identifiers to an asset service. New hosted generators, remote
MCPs or opaque installers require explicit product-owner approval and a recorded
privacy, cost and rollback review before use.

### 5.2 3D asset requirements

For every production model:

- validate the exact licence and provenance;
- use glTF 2.0/GLB in the deployed tree;
- establish correct scale, forward axis, ground contact, origin and pivot;
- use semantic node and animation names;
- remove hidden, duplicate and unused geometry/materials;
- keep consistent texel density and material response across the kit;
- verify UVs, normals, alpha, emissive maps and colour space;
- test every required animation in the running game;
- verify bounds and simplified collision geometry separately from the mesh;
- inspect shadow behaviour and contact with the route;
- meet the current tested per-model and collection budgets in the
  [3D Asset Library](../3D_ASSET_LIBRARY.md);
- update and verify the generated 3D manifest rather than hand-editing it.

The current checker measures a GLB container or glTF JSON file, not the complete
dependency closure of a glTF plus its buffers and images. Until the checker and
manifest builder count that closure, agents must measure it separately and may
not cite `npm run check:3d-library` alone as proof of the per-model budget. Before
importing a flagship kit, inspect current collection headroom and explicitly own
the curation, optimisation or policy decision needed to fit it.

Use shared atlases, instancing and repeated modular pieces where they preserve
quality. Reuse may not become visible monotony: vary placement, rotation,
silhouette, scale within safe bounds, materials and clustering with an authored
composition.

### 5.3 Character and vehicle animation

A moving hero must not slide through the world as a static object. Provide the
states the mechanic actually exposes, such as:

- idle and anticipation;
- locomotion and speed variation;
- turn, lean or directional transition;
- jump, fall and land;
- primary action;
- contact, damage or wrong-choice response;
- correct-choice and checkpoint response;
- completion celebration.

Blend compatible states, reset one-shot actions deliberately and keep feet,
wheels or contact points attached to the route. The animation state machine
must follow simulation state; it must not infer literacy correctness from
visual collisions.

### 5.4 2D asset requirements

- Separate backgrounds into authored depth layers rather than one stretched or
  repeatedly tiled panorama.
- Use sprite sheets or atlases with consistent registration, scale and edge
  treatment.
- Supply the complete movement and feedback state set, not only an idle pose.
- Preserve transparent padding needed for animation and effects.
- Prevent filtering, crop or device-pixel-ratio changes from degrading the
  intended style.
- Keep text, graphemes, words and answer indicators live and semantic wherever
  possible; do not bake them into imagery.
- Provide coherent fallback illustration or procedural shapes that remain a
  complete game, not debug art presented as the high tier.

### 5.5 Environment construction

Build the route and composition together:

- one coordinate system for visible route, collision, actors and camera;
- a strong near, play and distant depth structure;
- landmarks that show progress and prevent visual repetition;
- density concentrated around the playable route rather than random clutter;
- silhouette and value separation behind every literacy object;
- purposeful environmental motion that respects reduced motion;
- occlusion and framing checks at the child's actual camera, not only a free
  editor camera;
- no decorative prop that resembles a selectable answer or hides a choice.

### 5.6 Import review

An asset is still a candidate until the implementation agent has:

1. opened it at useful scale;
2. checked transparency, crop, geometry, materials and animation;
3. imported it through the current loader;
4. viewed it under the game's actual lighting and camera;
5. exercised its success, error and fallback states;
6. checked high and low quality tiers;
7. recorded provenance and licence;
8. removed superseded candidates and temporary exports.

### 5.7 Produce the asset bank in ranked waves

Rank assets by their importance in the real gameplay camera. First integrate one
visual anchor containing the hero, one representative world module, one
interactable, one HUD element, one effect and its sound. Capture it in the real
game, name the single worst visible defect, correct that defect and repeat. Do
not generate the full bank until this anchor is coherent.

Produce the remaining assets in this order:

1. hero and camera-near principal actors;
2. modular route, terrain and world kit;
3. interactables, rivals, landmarks and progression set pieces;
4. environmental dressing and controlled variation;
5. cosmetics and final polish.

Review each wave in context before starting the next. Preserve editable source
and provenance, ship only the selected runtime derivatives, and remove rejected
or superseded candidates after their replacement is verified.

## 6. Build playability before adding spectacle

### 6.1 Complete loop

The playable loop is:

```text
understand -> perceive -> decide -> act -> immediate consequence
     ^                                             |
     |                                             v
supported retry <- specific feedback <- result state
                                                   |
                                                   v
                                      progress -> completion -> exit/replay
```

The opening instruction must lead directly into this loop. Do not require the
child to learn an unrelated movement system before they can understand the
literacy goal.

### 6.2 Input feel

- Show a response on the first input event even when the tap ends before the
  next animation frame.
- Add genre-appropriate anticipation and follow-through without delaying the
  underlying action.
- Use forgiveness for non-target motor demands: generous collection volumes,
  coyote time, buffered jumps, catch-up routes, re-presented targets and safe
  respawns where applicable.
- Never erase demonstrated literacy progress because of a fall, steering miss,
  collision or device interruption.
- Keep targets large and visually stable enough for early readers.
- Test contradictory, rapid, held, cancelled and simultaneous inputs.

### 6.3 Route and encounter design

A race, runner or platform route needs authored rhythm, not an endlessly
repeating corridor. Alternate readable approach, decision, consequence,
recovery and breathing space. Use curves, elevation, landmark reveals, route
width changes, set pieces and controlled opponent placement only where they do
not obscure the literacy decision.

Rivals and enemies provide motion, anticipation and a sense of place. They do
not determine literacy accuracy, block essential audio, punish supported retry
or turn the learning task into a reaction-speed test. Their behaviour must be
exercised beyond a selected capture: start, pursuit, obstacle response,
recovery, checkpoint and finish all need credible states.

### 6.4 Difficulty and replay

Increase the curriculum demand before increasing speed, precision or hazard
pressure. Replays should vary route composition, application or choice layout
without leaking the answer through stable position, decoration or opponent
behaviour. Difficulty and procedural variation must remain deterministic under
a recorded seed for tests and defect reproduction.

## 7. Produce the presentation stack

### 7.1 Composition and lighting

- Establish a readable focal hierarchy before adding effects.
- Use deliberate key, fill, rim and ambient/environment contributions where
  the medium supports them.
- Ground actors with contact shadows, overlap and surface response.
- Use atmosphere to separate depth, never to wash out the route or text.
- Keep interactive targets distinct from background detail by silhouette,
  value and spacing rather than answer-revealing colour treatment.
- Review scenes in motion and under the low tier; a cinematic still is not
  sufficient.

### 7.2 Camera craft

The camera should communicate speed, scale, direction and consequence while
protecting the learning target. Specify and tune:

- subject scale and safe framing;
- look-ahead based on intended movement;
- damping and catch-up behaviour;
- field of view or orthographic scale;
- route bounds and collision avoidance;
- authored reveals and completion framing;
- brief impact emphasis;
- reduced-motion replacements for shake, zoom and rapid parallax.

Do not attach raw camera position directly to the player. Do not let a camera
effect move an answer out of reach, obscure text or cause the child to lose the
route after an error.

### 7.3 Effects and feedback

Strong game feel normally uses a small coordinated stack:

1. **telegraph** — readable anticipation or target affordance;
2. **action** — pose, trail, squash, movement or sound;
3. **contact** — flash, decal, burst, shake or haptic-like visual response;
4. **consequence** — changed object/state, specific text and audio;
5. **recovery** — clear next action with retained progress;
6. **reward** — proportionate celebration tied to demonstrated learning.

Pool frequently reused particles and decals. Keep bloom selective and keep text,
HUD, choices and the whole scene background out of uncontrolled bloom. Effects
must not cover answer text, become the sole correct/wrong cue or continue after
pause/unmount. Flashing, rapid contrast changes and repeated full-screen pulses
must remain within the current WCAG flashing-content constraints; prefer
non-flashing shape, movement and sound cues, and include effects in the
reduced-motion review.

### 7.4 HUD and interface

- Design HUD elements for the game's world while retaining LiteracyPath's
  accessible names, focus behaviour and exit model.
- Keep the primary learning target and meaningful progress visible.
- Remove counters that do not help the child decide or understand progress.
- Use large shapes, short labels and clear icon-plus-text cues.
- Show control hints contextually, then reduce their prominence after use.
- Supply default, active, disabled, loading, paused, error, retry, completed and
  focused states.
- Keep interface scale stable as the 3D or canvas camera moves.

### 7.5 Audio production

Treat audio as part of the interaction design:

- production-recorded teaching cue and visible replay;
- separate music, ambience, movement, interaction, correct, wrong, recovery,
  checkpoint and completion layers;
- music and ambience duck beneath spoken teaching audio;
- repeated movement sounds vary without becoming noisy;
- wrong-answer audio is informative and emotionally safe;
- sound-off retains every essential instruction and cue visually;
- lower-audio-intensity settings reduce decorative density while retaining
  instruction and specific feedback;
- pause, visibility loss, completion and unmount stop or suspend the right
  channels.

File existence, waveform inspection and successful decoding do not prove sound
quality. Listen to the complete loop through the intended device speakers.

## 8. Quality tiers and performance

Use the current `threeShell.js` and `arcadePremiumRender.js` contracts for WebGL
games. Reduce cost in this order before compromising play:

1. post-processing and non-essential bloom;
2. shadow resolution, radius and decorative shadow casters;
3. particle count, trail length and environmental motion;
4. distant dressing and secondary animated actors;
5. texture anisotropy and pixel density;
6. high-detail models in favour of reviewed simpler variants.

Never reduce:

- input sampling or cancellation safety;
- literacy target legibility;
- route/collision agreement;
- specific correct/wrong feedback;
- replay, pause, recovery or exit;
- semantic controls and accessible names.

Optimise measured bottlenecks. Prefer instancing, atlases, pooled effects,
bounded device pixel ratio, lazy scene loading and correct disposal. Shared
source assets and textures need explicit cache ownership, reference counting or
bounded eviction; disposing only a cloned instance does not prove GPU memory is
released. Introduce compression decoders, new render frameworks or runtime
dependencies only when profiling justifies them, dependency review is complete
and the full fallback path is tested.

Every quality tier must be deliberately composed. The low tier may simplify
lighting and scenery, but it cannot reveal debug primitives, lose the player,
remove landmarks, break animation or become a different answer rule. An asset
load failure must leave a complete playable scene.

Before making fleet-wide physical-device claims, the product owner must name the
oldest supported physical iPad and iPadOS in one tested device-performance
policy. Agents measure sustained frame pacing, input response, memory/context
loss, thermal behaviour and load/transition time on that device, then encode any
approved numeric threshold once in the tested policy module. Do not invent a
support floor, frame target or memory threshold in prose or infer one from a
desktop browser profile.

## 9. Agent execution workflow

### Phase A — preflight and collision control

1. Read `AGENTS.md` and `docs/brain/START-HERE.md`.
2. Read the Game Design Bible and the current game-specific authority.
3. Inspect the running import path, registry entry and current tests.
4. List active implementation tasks and check `docs/brain/WORKSTREAMS.md`.
5. Inspect Git status and isolate work when another task may touch the same
   files.
6. Identify every new service, licence, privacy, cost or device dependency
   before implementation.

**Exit evidence:** exact source paths, collision decision, current authority and
all material blockers are known.

### Phase B — baseline audit

1. Play the current game; do not infer quality from code.
2. Capture the complete state matrix in section 4.1.
3. Verify learning action, input paths, recovery and saved progress.
4. Inspect sibling games for the same defect class.
5. Separate mechanical, visual, audio, browser, device and child-observation
   findings.

**Exit evidence:** current captures and a defect list tied to exact gameplay
moments.

### Phase C — lock the production contract

1. Write the experience sentence.
2. Complete the art-direction and target-frame sheets.
3. List production assets, animation states, audio and fallbacks.
4. Specify controls, camera, state machine and progression.
5. Add or update the machine-readable vertical-slice brief.
6. Name the exact evidence required to finish.

**Exit evidence:** target frames and contract agree with the Game Design Bible;
no important visual or interaction decision is deferred to guesswork.

### Phase D — complete greybox

1. Separate curriculum, simulation, renderer and evidence.
2. Implement the whole learning loop with stable collision and controls.
3. Exercise start, active, correct, wrong, retry, checkpoint, pause/resume,
   completion and exit.
4. Add deterministic unit tests for game rules and evidence.

**Exit evidence:** the full loop is playable with temporary visuals, and motor
performance cannot create or erase literacy evidence. This is not a finished
handoff.

### Phase E — production asset slice

1. Produce the complete hero/vehicle and one representative environment kit.
2. Validate licence, provenance, import, scale, material and animation.
3. Integrate under the real camera and lighting.
4. Compare the first playable and mid-play frames with the targets.
5. Correct the largest mismatch before producing the remaining kit.

**Exit evidence:** one representative gameplay sequence proves the chosen art
pipeline inside the real runtime. An asset pack by itself does not pass.

### Phase F — complete scene and presentation

1. Finish all assets and animation states.
2. Compose route, landmarks, environmental layers and dressing.
3. Tune movement, camera, feedback, VFX, HUD and audio as one experience.
4. Complete every error, recovery, pause and completion state.
5. Remove temporary and superseded assets after references are checked.

**Exit evidence:** every target-frame state exists in the playable game with no
placeholder high-tier art.

### Phase G — visual iteration loop

At each review milestone:

1. capture the exact current frame at the target viewport;
2. place it beside the target and named reference property;
3. inspect hierarchy, silhouette, depth, density, material, camera, motion,
   interface and feedback;
4. identify the single largest quality gap and any blocking learning/accessibility
   regression;
5. repair, replay and recapture;
6. repeat until no blocking mismatch remains across the complete state matrix.

Review motion as motion. Still images cannot prove camera damping, animation
blending, collision, effects timing, input response or audio synchronisation.

**Exit evidence:** direct comparison of the current playable states, not a
manifest or assertion that they were reviewed.

### Phase H — optimisation and fallback

1. Exercise every declared quality tier.
2. Profile the actual scene while playing, not an empty benchmark route.
3. reduce decorative cost in the order defined in section 8;
4. force asset failure and WebGL context loss where applicable;
5. verify pause, visibility, resize, orientation and unmount cleanup;
6. replay reduced-motion, sound-off and lower-audio-intensity paths.

**Exit evidence:** the intended experience remains complete and responsive when
quality is reduced or decorative assets fail.

### Phase I — release verification

Run the scoped unit and browser checks, then the repository checks listed below.
Perform direct visual review, human listening, physical-device play and
child observation as separate evidence classes. Fix reported failures and rerun
the affected evidence; do not convert unknown into pass. Under the current
[continuous-QA decision](../brain/decisions/2026-08-21-continuous-qa-pass-by-exception.md),
missing human, device or observation metadata alone does not block a beta
release. It remains `UNKNOWN`, cannot support a corresponding quality claim and
becomes required when the user explicitly asks for that verified qualifier.
Child sessions may run only through the consent, assent, safeguarding and
de-identification rules in the
[recurring observation programme](../research/RECURRING_OBSERVATION_PROGRAM.md),
never as an ad hoc agent test.

**Exit evidence:** every matrix row has an honest status, every reported blocker
is corrected or quarantined, claim boundaries are explicit, and the Git diff
contains only the scoped upgrade and necessary authority changes.

### Phase J — rollout

Only after the gold-standard implementation has passed the executable gates and
has no reported blocking defect may an agent migrate shared infrastructure or
start the next game. Manual evidence may remain `UNKNOWN` under the current beta
policy, but the game may not be described as physically verified, human-listened
or child-observed. Audit the next game's mechanic and medium independently; do
not clone the pilot's world or UI. Keep the product-owner's full requested
endpoint in scope and continue until every requested game is implemented and
every reported blocker is resolved.

## 10. Evidence and shipping matrix

Record `PASS`, `FAIL`, `UNKNOWN` or `NOT APPLICABLE` with a link or exact command
for every row. A generated hash, green test or emulator cannot stand in for a
different evidence class. `FAIL` blocks the affected release or claim. `UNKNOWN`
is not a pass and cannot support the claim, but missing manual-review metadata
alone does not block the current beta under the continuous-QA decision. Any
reported critical or major defect remains blocking until corrected and retested.

| Evidence class | What it must prove | Acceptable evidence |
| --- | --- | --- |
| Contract | Learning action, state, controls, data and fallbacks are declared | Validated vertical-slice brief where required, plus the current game-specific record |
| Unit | Deterministic rules, ambiguity, fresh-choice rebuilding/position independence, evidence events, checkpoints and lifecycle | Current named unit tests |
| Browser interaction | Real rendered controls, states, resizing, errors and context recovery | Playwright against the current preview/runtime |
| Accessibility | 56-pixel targets, focus/semantics, non-colour and non-audio cues, reduced motion and safe areas | Named automated checks plus direct interaction with the applicable modes |
| Performance and resilience | Sustained responsiveness, quality changes, asset/offline failure, pause/resume, cleanup and context recovery | Current-game profiling and fault-injection evidence; physical-device status remains separate |
| Assets and provenance | Selected runtime assets are licensed, traceable, complete and within the tested library policy | Validated scene-kit/asset records, complete dependency sizes and current library checks |
| Privacy and services | No undeclared data, identifier, network service or unreviewed external dependency was added | Diff/network inspection and the required privacy, cost, rights and rollback review |
| Direct visual | Target comparison across opening, play, correct, wrong, retry, completion and low tier | Current screenshots plus direct full-size review |
| Motion | Movement, animation, camera, effects and transition timing | Direct continuous play or capture review |
| Human listening | Teaching cue, mix, effects and complete-loop audio quality | A real person listening to the current files/runtime |
| Physical device | Touch, safe areas, orientation, speakers, thermal behaviour and sustained play | Current build exercised on a supported physical iPad |
| Child play | Goal comprehension, independent control and first-error recovery | De-identified observation run through the recurring observation programme |
| Photosensitivity | Effects avoid unsafe flashing and reduced motion remains complete | Browser/direct review of every effects-heavy and reduced-motion state |
| Hosted/offline | Deployed asset paths, cache/update behaviour and no undeclared calls | Authenticated hosted check and applicable offline exercise |

The current automated starting set is:

```sh
npm run check:learn-games
node --test tests/unit/premiumGameStandard.test.js \
  tests/unit/gameSurfaces.test.js \
  tests/unit/gamePlaythroughs.test.js \
  tests/unit/gameCheckpoints.test.js \
  tests/unit/gameAudioLifecycle.test.js
npx playwright test tests/release/arcade-ipad-controls.spec.js \
  tests/release/student-activity-viewport.spec.js --project=desktop
```

For WebGL games also run:

```sh
node --test tests/unit/threeShell.test.js \
  tests/unit/arcadePremiumRender.test.js \
  tests/unit/threeAssetLibrary.test.js
npx playwright test tests/release/arcade-premium-render.spec.js --project=desktop
```

After changing the 3D library:

```sh
npm run build:3d-library
npm run check:3d-library
```

The current app-image review recorder is not a game-runtime approval gate: it
does not exercise runtime composition, GLB materials, animation or continuous
motion. Do not run it to manufacture a game visual pass. Store direct game
captures and review notes in ignored evidence output until a dedicated,
provider-neutral game-review record exists.

Run each game-specific unit/browser check named in its vertical-slice brief.
Finish with repository verification appropriate to the changed scope:

```sh
npm test
npm run lint
npm run build
npm run check:repo-hygiene
git diff --check
```

`npm run check:device-matrix` is useful generic app-layout coverage when the
surrounding child surface changes. It does not prove a game's 56-pixel controls,
GPU performance or physical-iPad readiness.

Physical-iPad and observed-child results remain separate manual evidence.
Browser device emulation does not satisfy either one. Unknown manual evidence
limits claims but does not become a beta blocker merely because it is missing.

### Deterministic gameplay capture

A substantially changed game must expose a test-only, production-disabled way
to reproduce review states. Define the shared diagnostic-adapter shape, prove it
first in the selected pilot, and only then generalise its implementation across
renderers. Extend the existing preview route rather than adding a disconnected
showcase. The adapter accepts named seeded streams for gameplay and presentation
randomness, checkpoint or named state, quality tier, sound setting, motion
setting, offline/asset-failure injection, visibility/pause state and WebGL
context-loss injection where applicable. It exposes a stable read-only snapshot
of game, input and learning-event state for Playwright.

Use it to capture onboarding, active play, correct, first error, recovery,
checkpoint and completion. The harness must drive the real game component and
real renderer; it may not substitute a mocked screenshot composition. Never
ship a debug control or permit it to write learner progress in the production
route. In addition to named still states, capture one uninterrupted start-to-
finish playthrough with its input, state and learning-event trace. An edited
highlight montage cannot prove route logic, rivals, persistence, recovery or
completion.

## 11. External creative and generation tools

AI generation can shorten production, but the useful unit is a controlled
pipeline rather than a one-shot prompt. A capable workflow may use image
generation for concept frames or 2D layers, model generation for candidate
props, Blender for cleanup and rigging, and an implementation agent for engine integration and
iteration. The output must become owned, inspected project assets.

Before using a new external service:

1. obtain explicit product-owner approval;
2. review the live service-specific terms and record cost, account requirement,
   prompt/input retention and training use, free-versus-paid output licence,
   stock/component restrictions, commercial-use rights and export permanence;
3. confirm no child or school data will be submitted;
4. define local export, provenance and rollback;
5. constrain the service to build time;
6. test one bounded asset in the real runtime;
7. reject the service if output cannot be edited, optimised, reproduced or
   removed cleanly.

Do not migrate the product to another engine merely because an attractive demo
was built there. Tesana's public material illustrates a complete engine,
asset/audio/VFX pipeline and agent-driven iteration, not a requirement to adopt
Godot. Thrixel's public material illustrates asset planning, engine import and
screenshot-driven correction; it is not product authority or an approved
dependency. The current Three.js, Canvas and DOM runtimes can reach the target
when supplied with an equivalent production process.

Benchmark references directly reviewed on 2026-09-02:

| Reference | It usefully demonstrates | It does not prove |
| --- | --- | --- |
| [XLR8/Tesana showcase clip](https://x.com/overthinkerdude/status/2094870009554350277), [LUMENFALL playable build](https://tesana.ai/en/play/0972bd5f-d5b2-4a4a-b02f-72a4e8ddd84b) and [Tesana workflow](https://docs.tesana.ai/how-tesana-works) | The clip/playable directly show a composed 2.5D world with foreground/background depth, atmospheric lighting, authored combat VFX, readable bosses/checkpoints and a restrained HUD; the workflow describes iterative agent production. | The caption's one-model authorship claim, LiteracyPath integration, iPad support, child accessibility or educational validity. |
| [Rana Hanocka/Thrixel Roblox clip](https://x.com/ranahanocka/status/2094865122539806984) and [Thrixel Build World](https://www.thrixel.com/build-world) | The clip/workflow show a coherent modular town kit, several distinct building silhouettes, a short buy/place loop, style planning, asset waves and engine-native import. | The caption's one-prompt autonomy claim, deep simulation, a complete learning game, mobile readiness or permission to adopt the service. |
| [BridgeMind kart reference](https://x.com/bridgemindai/status/2094894312370692443) | The short clip is a useful target for race framing, curved route, opponent presence, atmosphere, speed feedback and HUD hierarchy. | Sophisticated racing AI, checkpoints/items, persistence, complete content, accessibility or sustained device performance. |

Marketing captions and short edited clips are discovery evidence, not production
proof. Asset or iteration counts from another build may inform planning but are
never LiteracyPath shipping quotas.

Use references for quality properties. Do not copy protected characters, level
layouts, branding, distinctive art or source assets.

## 12. Recommended first migration: Sound Racer as the 3D gold standard

Sound Racer is the recommended first Arcade pilot because it has a direct
quality comparator and already uses the shared Three.js path. This is a proposed
implementation sequence, not a durable product-priority decision; the product
owner may reorder it. If selected, its upgrade should prove the complete
pipeline before the roster is touched.

The production target is:

- one coherent world with a curved, landmark-led route rather than a long empty
  runway;
- a canonical Pal/driver and authored animated player vehicle with convincing
  wheel/contact or hover behaviour, grounded in the current book-character and
  world canon rather than an unrelated mascot;
- a readable rival pack that supplies life and pace without affecting literacy
  correctness;
- environment modules, set pieces and background depth composed around the
  route;
- a chase camera with deliberate look-ahead, damping, speed response and
  reduced-motion behaviour;
- game-specific countdown, progress, position/mission and completion treatment;
- movement, pass-by, choice, collision, correct, wrong, recovery and finish
  effects/audio;
- the existing onset-learning contract, fresh gate choices, specific feedback,
  checkpoint, touch parity and progress evidence preserved;
- cinematic, enhanced, performance and failed-asset scenes all deliberately
  reviewed;
- complete desktop and browser evidence, with listening, physical-iPad and
  recurring-program child-observation results recorded honestly as `PASS`,
  `FAIL` or `UNKNOWN`.

Do not stop after producing a vehicle, one attractive screenshot or a playable
track segment when the assigned task is the full game. The representative asset
slice is a risk-reduction stage; the required deliverable remains the finished
Sound Racer upgrade.

After Sound Racer satisfies the rollout condition in Phase J, use the proven
asset, camera, animation, effect and quality-tier methods to upgrade Rocket Run.
Use the same production discipline, not the same art, for authored 2D/hybrid
games such as Letter Leap and for semantics-heavy games such as Sentence
Express.

## 13. Agent task template

Use this brief when assigning a game upgrade:

```markdown
# Upgrade [game] to the LiteracyPath production-quality standard

## Outcome
Deliver the complete, playable [game and version] at the PS3-class presentation
and playability target defined by GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md. This is not a
request for an audit, mock-up, asset pack, vertical-slice handoff or CSS reskin.

## Authority
- AGENTS.md
- docs/brain/START-HERE.md
- docs/design/GAME_DESIGN_BIBLE.md
- docs/design/GAME_VISUAL_PLAYABILITY_PRODUCTION_GUIDE.md
- [game-specific Bible/contract]
- current runtime imports and tests

## Player and learning contract
- Audience: [age/reading band]
- Player fantasy: [role, world, visible goal]
- Target construct: [precise literacy construct]
- Integrated action: [game action that demonstrates it]
- Non-target demands: [movement/timing/spatial demands]
- Evidence event: [exact event allowed to write progress]

## Visual target
- Reference properties: [composition/camera/material/motion properties]
- World/style: [coherent art direction]
- Required target frames: opening, first control, mid-play, correct, wrong,
  retry, checkpoint, completion, low tier
- Forbidden shortcuts: placeholder geometry, repeated wallpaper, generic HUD,
  baked text, style mismatch, answer-revealing decoration

## Complete production scope
- Simulation and control work
- Character/vehicle and animation states
- Route/environment and landmarks
- Camera
- Lighting/materials
- VFX and feedback
- HUD and all states
- Music, ambience, teaching and action audio
- Quality tiers and asset-failure fallback
- Checkpoint, completion and exit
- Cleanup of superseded assets/code

## Evidence required
- Named unit checks
- Named browser checks
- Accessibility, focus/semantics, non-colour/non-audio and reduced-motion checks
- Performance, fault-injection, context-recovery and cleanup evidence
- Asset provenance, rights and complete dependency-size evidence
- Privacy, network and external-service review where applicable
- Direct target-frame comparison
- Motion review
- Human-listening status and claim boundary
- Physical-supported-iPad status and claim boundary
- Child-observation status through the recurring observation programme
- Hosted/offline checks when applicable

## Delivery
Continue through every production phase until the requested finished game
exists and every executable gate and reported defect is resolved. Keep manual
evidence labelled unknown when it has not occurred and do not make the
corresponding claim. Stage only scoped files, inspect the final diff, commit and
push under repository rules.
```

## 14. Final completion checklist

Before an agent says the upgrade is done, confirm every item:

- [ ] The requested finished game—not merely a plan, prototype or asset set—exists.
- [ ] The learning action is the game action and only valid literacy events write evidence.
- [ ] Current and target frames were compared across the complete state matrix.
- [ ] No placeholder or primitive-only high-tier player, vehicle or key set piece remains.
- [ ] World, character, material, lighting, UI, VFX and audio share one art direction.
- [ ] Movement, camera, animation, feedback and recovery were reviewed in continuous play.
- [ ] Correct, wrong, retry, checkpoint, pause/resume, completion and exit are complete.
- [ ] Keyboard, pointer and touch share the same actions and release safely.
- [ ] Reduced-motion, sound-off, low-power and failed-asset paths remain complete.
- [ ] New assets have valid provenance, licences, manifests and runtime optimisation.
- [ ] Automated unit and browser checks pass against the current build.
- [ ] Every applicable evidence-matrix row has an honest status and exact evidence link or command.
- [ ] Focus, semantics, non-colour/non-audio cues, reduced motion and safe areas were exercised.
- [ ] Performance, failure injection, context recovery, resource cleanup and multi-game switching were exercised where applicable.
- [ ] Privacy/network scope and any external service or runtime dependency were reviewed.
- [ ] Direct full-size visual review is complete; a hash record is not being used as a substitute.
- [ ] Human-listening status is recorded; the complete mix was actually heard before human-listened quality is claimed.
- [ ] Physical-device status is recorded; the current build was exercised on a supported iPad before physical readiness is claimed.
- [ ] Child-observation status is recorded through the recurring programme before independent child playability is claimed.
- [ ] Temporary, failed and superseded outputs created by the task were removed.
- [ ] The final diff is scoped, documented and pushed according to repository rules.

If an executable requirement fails or a reviewer reports a defect, continue
safe in-scope work or quarantine the affected release. If manual evidence is
unknown, report it and limit the corresponding claim; under the current beta
decision, absence alone is not a reason to invent a blocker. Do not lower the
target or substitute a smaller deliverable.
