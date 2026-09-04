# Sound Seekers: 10000% rebuild plan

**Status:** proposed product and engineering contract  
**Scope:** Sound Seekers only; the first gold-standard vertical slice is the release gate for the wider adventure  
**Audience:** product, curriculum, art, audio, engineering, QA and classroom-observation teams

## Executive decision

Sound Seekers does not need another card, another badge, or another pass of
CSS. It needs an authored game loop in which the literacy decision is the thing
that changes the world.

The rebuild should be called **Seedwake** internally. A child is a sound
keeper helping a small meadow community wake its sleeping routes. Every route
has a story problem, a physical verb and one phonics construct. The child hears
or sees the target, makes a visible literacy choice, watches the world respond,
uses the resulting word in context, and earns a meaningful route change. The
map is the connective tissue, not the game itself.

The first release target is one complete, replayable Seedwake chapter with
three unmistakably different mechanics:

1. **Echo Hunt** — hear a phoneme, choose its grapheme in the world.
2. **Word Forge** — segment and assemble a taught word into a physical bridge.
3. **Blend Run** — blend graphemes to move, rescue a resident, and read a tiny
   decodable line.

No second biome, large content bank, 3D conversion, or cosmetic economy should
start until this slice passes the learning, playability, visual, accessibility,
audio and evidence gates below.

## 1. What the research says to borrow

This is pattern borrowing, not copying another product's art, text or code.

| Reference | Proven pattern | Sound Seekers application | Deliberate difference |
| --- | --- | --- | --- |
| [Teach Your Monster to Read overview](https://www.teachyourmonster.org/teach-your-monster-to-read-overview/) | A coherent journey, named worlds and many short activities tied to a structured phonics sequence. | Seedwake chapters, landmarks and three authored verbs; each chapter has a curriculum target and a narrative reason to use it. | Do not hide the learning target behind a generic avatar task; show and speak the exact construct. |
| [Teach Your Monster mini games](https://www.teachyourmonster.org/teach-your-monster-to-read-mini-games/) | The phoneme-to-grapheme action is the movement/action: jump to a letter, fly to a sound block, segment to climb. | Echo Hunt and Word Forge make the phonics response open the route, not merely award points above it. | Keep hazards supportive and never let speed or steering decide correctness. |
| [Teach Your Monster practice mode](https://www.teachyourmonster.org/teachers/learning-resources/monster-minigames/) and [practice help](https://www.teachyourmonster.org/teachers/helpful-articles-for-teachers/practice-mode/teach-your-monster-to-read-practice-mode/) | A child or teacher can select a small set of sounds and practise one mechanic for a short session. | A visible Practice door offers 10-minute Quick Play, 4–6 sound sets, one mechanic, and assignment/current-need entry points. | Practice uses the same canonical challenge and evidence model as adventure; it is not a separate question bank. |
| [Reading Eggs Fast Phonics](https://readingeggs.com/fast-phonics-games/) | Frequent, distinct mechanics across a level: flying, climbing, sorting, blocking and message building. | Three mechanics deliberately change the child's physical action while preserving one construct. | No reskinned cards. Each mechanic gets its own camera composition, interaction language and reward animation. |
| [Fast Phonics programme description](https://support.readingeggs.com/support/solutions/articles/247030-what-is-fast-phonics-) | Blending is practised through words, spelling, nonwords, syllables, captions and connected text. | Seedwake escalates from sound/GPC to CVC build, blend-in-motion and a one-line decodable transfer. | Nonwords are an explicit later curriculum choice, never accidental nonsense in an early scene. |
| [Khan Academy Kids ELA](https://www.khanacademy.org/kids/ela) | Playful characters, books with audio word highlighting, broad literacy strands and adaptation. | A resident gives a short illustrated context; the final word/line is read with synchronised highlighting; review adapts by target, not by vanity score. | Keep Sound Seekers phonics-first and decodable rather than turning it into a general worksheet catalogue. |
| [UCL critical examination of feedback in early reading games](https://discovery.ucl.ac.uk/id/eprint/10041423/) and [Benton on literacy-game support](https://bera-journals.onlinelibrary.wiley.com/doi/10.1111/bjet.13318) | Outcome-only “right/wrong” feedback is weak; scaffolding and elaborative, specific feedback are stronger design directions. | First errors name the selected sound and contrast it with the target; replay, modelling and a supported retry are built into the mechanic. | Feedback remains brief and in-world, not a lecture or modal interruption. |
| [Literacy-app design synthesis](https://link.springer.com/article/10.1007/s10643-026-02326-1) | Deliberate choices, challenges, feedback and rewards can focus attention when interaction is constrained intentionally. | Only the meaningful objects are tappable; decoration is not accidentally interactive; reward follows demonstrated skill and creation. | Remove unnecessary menus, badges and competing prompts. |
| [IES foundational skills practice guide](https://ies.ed.gov/ncee/pdf/20074011.pdf) and [National Reading Panel alphabetics](https://www.nichd.nih.gov/sites/default/files/publications/pubs/nrp/Documents/ch2-I.pdf) | Explicit phonological awareness, grapheme–phoneme mapping, blending, segmenting and phonemic spelling are foundational. | Curriculum authoring names the construct first, then selects a mechanic; every challenge has an answer and distractor proof. | Game energy cannot soften an invalid or ambiguous item. |
| [Garris, Ahlers and Driskell on games, motivation and learning](https://journals.sagepub.com/doi/10.1177/1046878102238607) | A game loop is behaviour, feedback and renewed judgement, not a decorative reward wrapper. | Every successful response changes a bridge, light, resident, route or story beat; the child immediately judges what to do next. | Score is secondary; world state and competence are the primary feedback. |

## 2. Taste audit: how to reach 0/10 slop

The current failure is a production-language failure as much as a code
failure. The same shell, rounded panel, repeated CTA, generic copy and small
illustration makes every activity look like a generated worksheet placed on a
map. That is the “AI slop” smell: many components, no authored point of view.

### Current design risks

- **Card over map:** the play frame asks the child to read a teaching card while
  the world waits behind it. The setting does not participate in the task.
- **One interaction language:** a letter hunt, a word build and a story choice
  all look like the same stack of buttons.
- **Decorative movement:** walking and collecting are available without a
  literacy decision, so the child can succeed at the game while avoiding the
  learning.
- **Generic microcopy:** labels such as “continue”, “save”, “game settings” or
  “sound camp” describe the software, not the child’s immediate intention.
- **Mixed visual grammar:** painterly map art, flat UI cards, tiny sprites and
  glow effects do not share a material, scale or lighting rule.
- **Answer ambiguity:** the child is told to find three letters but cannot see a
  stable target, target order, or why a distractor is wrong. Rebuilt choices can
  also make the problem change under a wrong attempt.
- **Reward disconnect:** confetti and counters happen above the game instead of
  a bridge, lantern, door or resident responding in the world.
- **No authored practice loop:** repetition is the same task again, not the same
  construct in a new context.

### Taste rules for the rebuild

1. One production bible: storybook gouache, tactile paper edges, warm dusk
   light, inked silhouettes and restrained two-tone UI. Do not mix a new visual
   style per screen.
2. One dominant focal object per moment: the sound target, the active word slot
   or the route object. Everything else is quieter in value, contrast and motion.
3. No generic component is allowed to define a mechanic. Shared code may own
   focus, audio, persistence and layout tokens; each mechanic owns its visual
   verb, camera and response.
4. Use fewer, larger, more intentional objects. Every visible object must be
   playable, explanatory or story-relevant.
5. Replace “success decoration” with material response: a stitched bridge
   plank lands, a moth changes colour, a lantern warms, a resident moves.
6. Child copy is a verb plus target: **“Find /m/.” “Build map.” “Blend and
   cross.”** Teacher explanations belong in adult surfaces.
7. If an image, animation, font or audio clip is not authored, licensed or
   explicitly marked as a temporary development proxy, it is not shippable.

## 3. The new game loop

### Moment-to-moment loop

```text
story problem -> target preview -> physical literacy action
       ^                                  |
       |                                  v
  next route <- word in context <- specific feedback + retry
```

1. **Notice:** the resident demonstrates the problem in one sentence or sound.
2. **Aim:** the child sees and hears one target. A replay control stays visible.
3. **Act:** the child taps, drags, steers or sequences a response that directly
   represents the construct.
4. **Respond:** the world gives immediate motion, sound and shape feedback.
5. **Recover:** a wrong answer is explained, the same item remains stable, and
   the child retries with optional support.
6. **Apply:** the child uses the built/read word to open a route or help a
   resident.
7. **Remember:** a short decodable line, collectible story fragment or route
   choice makes the skill meaningful.
8. **Resume:** the chapter checkpoints after each completed encounter and has a
   clear stopping point.

### Gold-slice chapter: “The sleeping seed bridge”

The chapter has one map with three landmarks and a visible destination. The
child is not sent to wander a large empty world. The route is short, readable
and authored around the learning verbs.

#### Echo Hunt (phoneme -> grapheme)

- The resident says, “The seed bridge wakes with /m/. Find **m**.”
- Three large sound motes orbit a visible bridge. Each mote has a grapheme
  token, a unique silhouette and a soft phoneme pulse.
- The child taps the mote whose grapheme represents the heard phoneme. The
  chosen mote flies into a socket; the bridge plank responds.
- The top of the play frame shows `Target sound: /m/` and a three-socket Echo
  Meter, with only the current socket active. This solves the former “three
  letters but no clear target” bug.
- Distractors are generated by the curriculum policy, not by random letters.
  In an initial-sound round, distractors have a different initial phoneme and
  are visually equal in size and position distribution.

#### Word Forge (segment -> ordered graphemes)

- The child hears and sees **map** with a single object illustration.
- Three persistent slots are visible above the bridge: `_ _ _`. Tapping a sound
  tile plays its phoneme and places it in the next slot; tapping a placed tile
  replays it and offers a clear remove action.
- The bridge is built one plank at a time. Correct order is the literacy action;
  the animation is the reward, not the answer key.
- On an error, the slot stays, the selected tile is named, the target phoneme is
  replayed, and the child gets one supported retry before a modelled example.
- No target is inferred from an unlabelled picture. Every expected grapheme and
  phoneme is in the authored challenge instance.

#### Blend Run (blend -> application)

- The child sees `m - a - p` on three stepping stones. Tapping each stone
  voices the phoneme and moves the character a short, forgiving step.
- A final **Blend** action fuses the stones into **map**, opens the bridge and
  reveals the resident’s one-line decodable message: “Map the path.”
- The child chooses the matching route icon from two semantically clear
  options. This is a transfer/comprehension beat, not another letter hunt.
- The route never fails because of timing. Missed taps queue the next stone and
  the child can replay each sound.

### Replay without repetition

Replay preserves the construct but changes one meaningful variable:

- target sound stays the same while the resident, prop and camera composition
  change;
- word order and distractor positions are reshuffled with a deterministic seed;
- an already mastered word moves to a connected sentence or meaning choice;
- a supported attempt changes the scaffold, not the answer;
- a review item appears in a different mechanic on a later route.

Identical prompts, identical answer positions and the same reward animation are
not replayability.

## 4. Curriculum and educational logic

### Scope and sequence

The first slice should target a narrow, explicit band: initial single-letter
GPCs and regular CVC words already taught elsewhere in LiteracyPath. The ladder
then expands in this order:

1. hear a phoneme and match a grapheme;
2. blend two and three phonemes orally;
3. segment CVC words into phonemes;
4. build CVC words with ordered graphemes;
5. read/blend in a new visual context;
6. transfer to a decodable sentence or picture meaning;
7. later chapters introduce digraphs, adjacent consonants, alternative values,
   tricky words and morphology only when their authoring contract is ready.

Each target follows **teach -> guided practice -> independent practice ->
transfer -> spaced review**. The game must not promote a child because a stop
was completed, a route was walked, or a reward was collected.

### Canonical content objects

```ts
type LearningTarget = {
  id: string
  construct: 'phoneme_to_grapheme' | 'blend' | 'segment' | 'phonemic_spelling' | 'decodable_transfer'
  graphemes: string[]
  phonemes: string[]
  phase: string
  prerequisites: string[]
  decodableWords: string[]
  distractorPolicy: string
  audioRefs: { prompt: string; phoneme: string; word?: string; correction?: string }
}

type ChallengeInstance = {
  id: string
  targetId: string
  mechanicId: 'echo_hunt' | 'word_forge' | 'blend_run'
  seed: number
  prompt: string
  visibleTarget: string
  options: Array<{ id: string; display: string; phoneme?: string }>
  expected: string | string[]
  supportSteps: string[]
}

type Attempt = {
  targetId: string
  challengeId: string
  mechanicId: string
  response: string | string[]
  independent: boolean
  supportUsed: string[]
  errorType?: 'phoneme_confusion' | 'grapheme_confusion' | 'order' | 'blend_break' | 'meaning'
  source: 'touch' | 'pointer' | 'keyboard'
}
```

The reducer, not the renderer, owns `expected`. The renderer receives a safe
render snapshot and cannot decide correctness from position, colour, timing or
DOM order.

### Distractor and ambiguity policy

- Every challenge has exactly one correct answer under the spoken and visible
  prompt.
- Distractors are plausible for the named construct and differ on the intended
  feature, not on accidental size, colour or distance.
- A picture has one obvious referent and is independently checked for crop,
  object count, orientation and semantic ambiguity.
- Decodable words only use taught correspondences, unless the target is declared
  a tricky word and the prompt tells the child what is special.
- Choice order, world position and reward timing are shuffled from a stable
  seed; they never encode the answer.
- When the item changes, every old answer object is removed and rebuilt. When an
  answer is wrong, the current item and all choices remain stable until retry or
  explicit support.

### Error and support ladder

1. **First error:** “You chose /t/. Listen again: the word starts /m/.” Replay
   target and selected phonemes; preserve the item.
2. **Second error:** highlight the relevant slot or contrast, then invite a
   supported choice. Record `independent: false` if the model was shown.
3. **Persistent difficulty:** return the target in a simpler mechanic, not a
   punitive failure screen. A teacher report can show the construct and support
   used.
4. **Success after support:** celebrate effort and route progress, but do not
   convert it into independent mastery evidence.

The correction is short enough to stay in play and specific enough to teach.
No red flash, countdown, life loss or shame language is needed.

### Adaptive review

The learning director owns a small queue, for example:

- two current targets;
- one recent target for retrieval;
- one due review target;
- one transfer challenge after three successful independent responses.

Promotion requires independent evidence across the active target rule (and,
where configured, different days and contexts). A wrong answer invalidates only
the affected claim; narrative progress remains recoverable. Practice mode reads
the same queue and writes the same evidence shape as adventure mode.

## 5. Art, animation and audio production pack

### Art direction

Use one authored **storybook gouache + tactile paper** language: warm natural
palette, inked silhouette, soft paper grain, deliberate cast shadows, modest
parallax and no gratuitous bloom. The map, characters, interaction props and UI
must share edge treatment, light direction and scale.

### First-slice asset list

**Characters**

- one hero production sheet: idle, walk, listen, point, carry, celebrate,
  supported-retry, tired and pause poses;
- three residents with distinct silhouettes, expressions and interaction poses;
- transparent composable layers for hat, back item, held tool and badge;
- common canvas and anchor metadata for every layer.

**World**

- one 2048px master meadow map with three camera compositions;
- foreground, play-space and background layers with two safe parallax rates;
- bridge, seed lantern, sound motes, path stones and three resident habitats;
- twelve small landmarks that explain route and story, not filler;
- eight interaction props and four reward/state variants;
- reduced-motion and low-power versions that preserve target legibility.

**Word and curriculum media**

- at least 40 independently reviewed word/object illustrations for the initial
  target set, with exact crops and no text baked into art;
- prompt, grapheme, phoneme, whole-word and correction recordings;
- optional ambience, soft interaction ticks, bridge/lantern response and a
  short chapter motif;
- a manifest that binds every authored challenge to its current committed clip.

### Animation language

Every important action has anticipation, contact and follow-through:

- tap: mote leans, child commits, mote lands in socket, bridge plank settles;
- correct: resident reacts, light warms, route opens;
- incorrect: character listens, selected token gently returns, target pulse
  replays; no aggressive failure pose;
- completion: one readable ceremony under five seconds and interruptible.

Use CSS transforms/canvas transforms or engine animation state, never layout
thrash from `top`/`left`. Reduced motion removes parallax, camera shake and
non-essential particles while retaining the same states and cues.

### Audio mix

Priority order is prompt > phoneme/word > correction > action SFX > ambience >
music. Sound-off keeps the text, visible target, captions and shape response;
sound-on never hides the target in audio alone. Browser text-to-speech is not a
production phonics fallback.

## 6. Technical architecture

### Renderer decision

Use a **Canvas 2D / DOM hybrid** for Seedwake v1:

- Canvas handles authored map layers, characters, motes, bridge construction,
  particles and camera composition.
- DOM/SVG handles semantic target text, replay, pause, focus, accessible labels
  and the ordered Word Forge slots.
- One state model drives both layers, so the visual and semantic versions cannot
  disagree about target, response or feedback.

This is preferable to forcing Three.js into a phonics-first slice. Three.js is
appropriate later for a spatial racing or cinematic game, but 2D gives this
mechanic crisp authored illustrations, stable low-power iPad behaviour and
native semantic controls. Phaser is an acceptable alternative only if the team
needs its scene/input tooling; it must still obey the same state boundaries and
fallback requirements.

### Module boundary

```text
src/features/soundSeekers/
  content/
    learningTargets.js
    wordBanks.js
    challengeAuthoring.js
    audioManifest.js
  engine/
    learningDirector.js
    challengeRuntime.js
    attemptAuthority.js
    checkpointCodec.js
    mechanics/echoHunt.js
    mechanics/wordForge.js
    mechanics/blendRun.js
  render/
    SeedwakeCanvas.jsx
    biomeKit.js
    heroRig.js
    camera.js
  ui/
    FocusHUD.jsx
    TargetPrompt.jsx
    WordSlots.jsx
    CorrectionCard.jsx
    PracticeMode.jsx
  soundSeekersReducer.js
  SoundSeekersGame.jsx
```

`SoundSeekersGame.jsx` should orchestrate lifecycle only. Pure rules and content
must be unit-testable without React or a browser.

### State and event contract

```ts
type GameState = {
  phase: 'briefing' | 'playing' | 'feedback' | 'support' | 'complete' | 'paused'
  chapterId: string
  landmarkId: string
  challenge: ChallengeInstance
  response: string[]
  attemptCount: number
  supportUsed: string[]
  world: { bridgePieces: number; lanterns: number; rescuedResidents: string[] }
  checkpoint: Checkpoint
}

type GameEvent =
  | { type: 'REPLAY_PROMPT' }
  | { type: 'SELECT_OPTION'; optionId: string; source: InputSource }
  | { type: 'PLACE_TILE'; tileId: string; source: InputSource }
  | { type: 'REMOVE_TILE'; index: number }
  | { type: 'REQUEST_SUPPORT' }
  | { type: 'PAUSE' | 'RESUME' | 'EXIT' }
```

`attemptAuthority` validates one child action at a time and emits:

```ts
{ type: 'CORRECT', targetId, response, independent }
{ type: 'INCORRECT', targetId, selected, contrast, retryable: true }
{ type: 'SUPPORTED', targetId, supportStep }
```

Only `CORRECT` events validated by the authority may reach progress/evidence.
Movement, survival, coins, collision and frame timing never do.

### Simulation and input

- Use a fixed-step accumulator for camera, character movement and collisions.
- Keep collision geometry aligned to visible ground and route art.
- Pointer, touch and keyboard adapters dispatch the same named events.
- Primary controls are at least 56 CSS pixels with 8px separation and safe-area
  padding; answer objects have hit slop.
- Release held input on `pointerup`, `pointercancel`, lost pointer capture,
  blur, pause, route rebuild and unmount.
- A tap responds on the first frame; a slow frame cannot turn a tap into a
  duplicate attempt.
- Pause freezes simulation, audio and pending correction together. Resume
  restores the same challenge, target, choices and support state.
- Failed image/audio load yields a complete calm fallback with the same target,
  text and controls. It must not silently invent a different item.

### Persistence and backend

The first slice should reuse the existing Sound Seekers progress/checkpoint
contract and add no new child identifier or service. Store the challenge seed,
target, choices, phase, world state and queued attempts needed to resume. If a
new field is required for reporting, write a migration and an RLS/RPC review
before implementation; the SQL should be handed to the product owner for
Supabase application rather than hidden inside the client.

## 7. Screen and interaction flow

1. **Map arrival:** one destination landmark glows subtly; the hero and route
   are visible. HUD shows only target chapter, next landmark and pause.
2. **Briefing:** resident demonstrates the problem; one spoken and visible
   instruction; replay remains available.
3. **Play:** camera frames the active object. Decorative UI retreats. The target
   is never hidden by a teaching card.
4. **Feedback:** the world responds in place. A compact correction strip appears
   only when needed.
5. **Apply:** bridge/lantern/door responds and the child uses the word or line.
6. **Reward:** a new route connection, resident animation or story token; no
   casino-like variable reward.
7. **Checkpoint:** explicit “Continue tomorrow” stopping point plus resume.
8. **Practice:** accessible from map/journal, never buried behind a teacher-only
   menu.

The HUD must not expose internal controls such as “save and return map” as a
primary child action. Use a familiar pause button with clear Exit/Resume choices.

## 8. Practice, teacher and reporting design

### Child Practice

- Quick Play: one 10-minute session, one mechanic, four to six sounds.
- Choose sounds: only targets available under the current curriculum scope.
- Replay weak target: the learning director picks the most useful due target,
  not the easiest item.
- A child can leave after a natural encounter; earned evidence and checkpoint
  persist.

### Teacher view

Show construct-level evidence, not game vanity:

- independent correct, supported correct, missed and not-yet-seen;
- target, mechanic and context used;
- last attempt and review due date;
- audio/visual or interaction support used;
- a link to launch the same target in Practice.

### Data rules

Do not record free-form child text, public rankings, geolocation, behavioural
profiles or unnecessary identifiers. Reliability telemetry (asset failure,
input cancellation, frame-budget class) stays separate from learning evidence.

## 9. Delivery plan

### Phase 0 — recovery and contract (1–2 days)

- Freeze the current build as a recovery point; do not delete useful authored
  map, cast, progress, reporting or audio assets.
- Inventory current quest/sound-seeker imports and mark what is reusable,
  superseded or release-blocked.
- Create a machine-readable Seedwake vertical-slice brief with construct,
  prompt, controls, level ladder, checkpoints, fallbacks and evidence names.
- Author the first 12 target challenges and run ambiguity/content validation.

**Exit:** one reviewed brief, one content matrix, no unknown answer authority.

### Phase 1 — playable gold slice (about 1 week)

- Implement reducer, attempt authority, fixed-step scene runtime and checkpoint.
- Build Echo Hunt, Word Forge and Blend Run as separate mechanics.
- Replace the teaching overlay with in-world target presentation and correction.
- Produce the first authored map, hero, residents, props and prompt audio.
- Add touch/keyboard/pointer parity, pause, sound-off and reduced-motion paths.

**Exit:** a child can complete one chapter without an adult explaining the goal;
the same target survives an error, pause and reload.

### Phase 2 — practice and learning director (3–5 days)

- Add 10-minute Practice, target selection and due-review queue.
- Record independent/support/error semantics in the existing progress contract.
- Add teacher launch/reporting entry points without creating a parallel bank.

**Exit:** adventure and practice produce the same valid evidence shape.

### Phase 3 — content and biome scale (1–2 weeks per chapter)

- Add one biome at a time with a new palette, route rhythm and resident cast.
- Reuse only loaders, input, audio lifecycle, evidence and checkpoint tooling.
- Do not reuse a generic HUD, background or reward animation as chapter identity.

**Exit:** each chapter has its own place, cast, interaction language, reward and
destination and passes the same gold-slice gates.

### Phase 4 — direct validation

- Browser tests at 320px landscape-height and supported portrait/landscape sizes.
- Human visual review of start/middle/end route frames using the taste rubric.
- Human listening of prompts, phonemes, corrections and mix at classroom volume.
- Physical supported-iPad pass for touch, safe areas, audio, pause, reload and
  low-power behaviour.
- Observed child session: can the child state the goal and recover from a first
  error without adult explanation?

**Exit:** every applicable gate is `PASS`, `FAIL`, `UNKNOWN` or `N/A`; unknown
manual evidence is not described as verified.

## 10. Test and evidence backlog

### Pure logic

- `soundSeekersLearningTargets.test.js` — scope, prerequisites, decodability.
- `soundSeekersChallengeAuthoring.test.js` — unique correct answer,
  distractor policy, deterministic seeds.
- `soundSeekersAttemptAuthority.test.js` — one action/one attempt, correction,
  support and independent evidence.
- `soundSeekersMechanics.test.js` — Echo Hunt, Word Forge and Blend Run state
  transitions and world response.
- `soundSeekersLearningDirector.test.js` — interleaving, promotion and review.
- `soundSeekersCheckpoint.test.js` — same target/choices after pause/reload.

### Browser and device

- `sound-seekers-gold-slice.spec.js` — complete chapter from briefing to route
  opening.
- `sound-seekers-input-parity.spec.js` — touch, pointer and keyboard dispatch.
- `sound-seekers-correction-retry.spec.js` — stable wrong item and supported
  retry.
- `sound-seekers-audio-replay.spec.js` — prompt/phoneme/correction replay and
  sound-off text parity.
- `sound-seekers-asset-integrity.spec.js` — manifest clips, image crops and
  fallback scene.
- `sound-seekers-layout.spec.js` — 56px controls, safe areas, no clipping at
  target viewports.

### Evidence capture

Capture named start, active-choice, first-error, supported-retry, completed-
bridge, pause/resume and sound-off frames. Screenshots prove rendered state,
not child comprehension. Human audio, physical iPad and observed-child gates
remain separate evidence classes.

## 11. Quality scorecard

Do not average the following into a flattering number. A fail in a critical row
blocks that claim.

| Gate | Pass condition |
| --- | --- |
| Learning integrity | The action advancing the route requires the named construct. |
| Target clarity | The child sees/hears one exact target and can replay it. |
| Ambiguity | One correct answer; distractors are authored and independently checked. |
| Game feel | The world materially responds to the literacy action. |
| Variety | Three mechanics have different verbs, camera compositions and rewards. |
| Feedback | First error is specific, immediate, supportive and retryable. |
| Playability | Touch, pointer and keyboard parity; no accidental duplicate/missed action. |
| Art direction | Character, world, props, UI and effects share one authored language. |
| Audio | Committed clips are clear, correctly matched and replayable. |
| Accessibility | Text, shape and controls preserve intent with sound off/reduced motion. |
| Persistence | Pause, exit and reload preserve target, choices and earned progress. |
| Performance | Low-power path stays responsive without reducing legibility. |
| Privacy | Existing authorised data only; no child profiling or new service. |
| Evidence | Browser, visual, listening, hardware and child-play status are honest. |

## 12. Decisions and non-negotiables

- Do not copy Teach Your Monster, Reading Eggs or Khan Academy Kids assets,
  characters, wording or exact UI. Borrow their tested structures and make a
  LiteracyPath-authored world.
- Do not make the map larger until the first route is more fun, clearer and
  more educational than the current experience.
- Do not solve a weak mechanic with a larger panel, more explanation or more
  particles.
- Do not use timers, hazards, reaction speed or device performance as the
  correctness rule.
- Do not create a parallel Supabase bank for this rebuild. Reuse canonical
  targets and progress or provide a reviewed SQL migration separately.
- Do not call the game finished because it compiles, looks good in one capture,
  or passes unit tests. The real-input, listening, hardware and child-play
  evidence are part of the product.

## Recommended order of work

1. Approve the Seedwake vertical-slice brief and 12-item content matrix.
2. Build Echo Hunt end to end, including first-error and retry evidence.
3. Add Word Forge using the same authority and persistence boundaries.
4. Add Blend Run and the decodable transfer beat.
5. Replace temporary art/audio with the authored production pack.
6. Add Practice and the learning director.
7. Run the complete evidence matrix on a real supported iPad and with observed
   child play.
8. Only then expand the chapter roster.

The success criterion is not “Sound Seekers has more screens.” It is that a
child can say what they are trying to do, make a phonics decision, see that
decision change a world they care about, recover when wrong, and want to try
the next route.
