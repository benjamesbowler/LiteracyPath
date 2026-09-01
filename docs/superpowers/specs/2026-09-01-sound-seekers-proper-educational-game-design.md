# Sound Seekers proper educational game design

Status: Approved by the user on 2026-09-01  
Scope: Sound Seekers only, including its child runtime, curriculum model, content, art, audio contract, progress/evidence state, reporting handoff, tests, release gates, and directly owned assets  
Primary authority: `docs/SOUND_SEEKERS_RELEASE_BIBLE.md`, `docs/design/GAME_DESIGN_BIBLE.md`, `docs/design/LEARNING_POLICY.md`, `docs/content/QUESTION_DESIGN_BIBLE.md`, and this approved design

## 1. Decision

Sound Seekers will be rebuilt as a proper educational adventure game. The user confirmed on 2026-09-01 that no child has used this game live, so preserving legacy Sound Seekers gameplay, checkpoints, mastery history, or save-schema behavior is not a product requirement. The rebuild may replace the child runtime, progression schema, encounter system, evidence model, word construction, chapter delivery, visual system, and quality gates outright.

This is a clean child-game rebuild inside the existing LiteracyPath application:

1. Preserve account, privacy, entitlement, navigation, app-shell, and hosted-storage boundaries that Sound Seekers does not own.
2. Reuse curriculum and authored content only after it passes the new pronunciation, reachability, meaning, and instructional-validity contracts.
3. Establish one production-quality Seedwake chapter as the reference implementation.
4. Build the same gameplay, content, visual, audio, and accessibility contracts across all eight chapters.
5. Retire the superseded Pixel, 2D fallback, and legacy Three.js gameplay paths after dependency checks and replacement tests prove the new runtime owns every supported route.

The project must not stop after a vertical slice. Seedwake is the contract-setting slice; all eight chapters and all twenty approved improvements are in completion scope.

## 2. Audit evidence that drives the rebuild

The untouched baseline contains 40 stops, 103 taught sound/grapheme entries, 431 unique decodable-bank words, and 60 heart words. It also has forward-only narrative progress, two-day mastery spacing, correction state, offline queues, telemetry, a 2D fallback, and 2,431 passing unit tests.

The product experience and evidence remain invalid in several central areas:

- A deterministic 40-stop plan contains 272 runtime stages. About 200 are the same meaningful action: receive a cue and approach one of several labelled objects.
- Thirty-five chapter action labels collapse into approximately eleven stage recipes and one proximity-selection resolution path.
- The primary Pixel World clears ordered completion marks. A child building a three-sound word sees a small stage counter, not a persistent word.
- A fresh three-choice subset is generated at each word position. Other letters that belong to the word may appear as wrong choices for the current position.
- Intermediate correct literacy decisions are not recorded at the time they happen. The final stage can credit the full sequence using the final stage's prompt and audio state.
- Silent motor destinations can therefore generate phonics evidence.
- `segmentWord()` derives sound sequences from spelling and cannot safely represent voiced/unvoiced `th`, both values of `ew`, suffix allomorphs, soft consonants, schwa, and other contextual pronunciations.
- The production Pixel World teaches only the first entry of a multi-target stop.
- Mini-game shell labels are used as evidence diversity even when the child performs the same phoneme-to-grapheme decision.
- Only 24 of 60 heart words are reachable in a normal first pass; due heart-word review targets can enter a queue that no encounter serves.
- Half of the authored story pages are unreachable on a normal route, and most story choices mark every option correct without a meaningful consequence.
- Review spacing uses stop-number subtraction and breaks when the route wraps from stop 40 to stop 1.
- Eight chapters reuse approximately three full-screen background families and mix pixel sprites, painterly backgrounds, smooth illustrated characters, and 3D creator art.
- Child-facing prompts can expose internal identifiers such as `y_ie`.
- Fresh browser verification produced 62 passes and 2 failures; the offline activation gate also failed. Unit and static asset gates did not detect the observed word-building or semantic-art failures.

These are not cosmetic defects. The rebuild must make the learning action, game action, visible state, spoken instruction, stored evidence, and world consequence agree.

## 3. Binding product principles

### 3.1 Learning action equals game action

Walking may position the child. It may not be the proof of learning. A route, object, resident, machine, or story advances because the child hears, discriminates, maps, blends, segments, encodes, reads, or applies the target.

### 3.2 Clear before clever

Before a child acts, the game makes these facts perceptible without requiring fluent reading:

- What am I trying to make, find, sort, carry, read, or change?
- What information should I listen to or look at?
- What can I interact with?
- What happened after my action?
- If it did not work, what should I notice on the next try?

### 3.3 Distinct mechanics mean distinct cognition and control

A new name, sprite, movement path, or collision animation does not create a new mechanic. Each core verb owns a different state model, child decision, input pattern, failure mode, correction behavior, and world consequence.

### 3.4 Practice evidence must remain honest

Sound Seekers is guided practice, not formal assessment. Assisted responses, motor completion, reaction time, travel time, device performance, and decorative collection never become independent phonics mastery. Reports retain the `practice` evidence kind and cannot normalize it to formal `SECURE` status.

### 3.5 Errors are instruction, not punishment

There are no lost lives, removed rewards, blocked narrative progress, or public comparisons for instructional mistakes. A miss produces a specific contrast, a scaffold appropriate to the miss count, and a fresh child attempt.

### 3.6 Accessibility changes motor demand, not the literacy answer

Auto-travel, slower movement, no-damage travel, larger targets, extended response, simplified scenery, reduced motion, keyboard/switch paths, and touch alternatives preserve the same learning target and evidence threshold.

### 3.7 The world must look and behave like one game

Gameplay, residents, creator, rewards, UI, props, and backgrounds use one coherent authored 2D language. Every chapter is visibly and semantically its own place. Literacy targets remain the cleanest, highest-contrast, most readable objects in a scene.

## 4. Target child experience

### 4.1 Expedition loop

Every stop is a short, resumable expedition with this structure:

1. **Arrival problem:** a resident and visible world problem establish why the skill matters.
2. **Teach:** every new target receives a brief, unscored sound, grapheme, mouth/formation cue, anchor image, and worked example.
3. **First use:** the child uses the target in the lowest-load relevant mechanic.
4. **Deepening:** the child uses the same code in a genuinely different domain.
5. **Wonder moment:** the literacy construct creates a surprising world transformation.
6. **Transfer:** the child applies the code to a word, phrase, connected text, or carefully marked imaginary name.
7. **Payoff:** the repaired place, resident relationship, field journal, and unlocked ability persist.
8. **Checkpoint:** progress saves after every completed learning loop and resumes with a short spoken reminder.

An ordinary expedition targets approximately five to eight minutes. Each meaningful loop has its own safe exit and resume point. Long cutscenes do not replay after resume.

### 4.2 Six core Sound Powers

The rebuild provides six deep systems rather than dozens of shallow labels.

#### A. Echo Search

- Learning purpose: auditory discrimination and phoneme-to-grapheme mapping.
- Child action: aim or move an Echo Lens through environmental sound sources, listen, and reveal the matching grapheme source.
- Game state: remembered cue, candidate sources, revealed contrast, found source, environmental response.
- Not allowed: three static letters that differ only by label and resolve through generic proximity.

#### B. Contrast Sort

- Learning purpose: distinguish confusable sounds, graphemes, or word patterns.
- Child action: pick up several meaningful objects or word tokens and place each into one of two or three clearly modelled destinations.
- Game state: stable item set, named bin rule, placement history, reversible placement, completion after the full set.
- Not allowed: selecting one correct object while all other objects disappear.

#### C. Word Forge

- Learning purpose: segmentation and encoding.
- Child action: hear a whole word, select grapheme tiles from a stable rack, and snap them into persistent sound boxes.
- Game state: authored pronunciation, stable rack, current slot, placed tiles, per-position evidence, word-completion evidence, blend/read payoff.
- Not allowed: saying the next answer phoneme before an independent attempt.

#### D. Blend Bridge

- Learning purpose: grapheme-to-phoneme mapping and blending.
- Child action: activate printed grapheme segments, hear their sounds, sweep or travel across them to blend, then choose the resulting meaning or use the word to cross/change the world.
- Game state: visible grapheme sequence, activation order, blend gesture/path, final word decision, world transformation.
- Not allowed: one isolated letter hunt per word position.

#### E. Memory Delivery

- Learning purpose: hold and apply a sound, word, or short decoded instruction.
- Child action: receive a cue, travel through a small navigable space without the answer remaining on screen, and deliver/use it with the resident or object it meaningfully belongs to.
- Game state: cue receipt, optional replay cost-free, route choices, recipient/object semantics, delivery result.
- Not allowed: carrying a visibly labelled correct token to a single glowing marker.

#### F. Story Power

- Learning purpose: connected-text transfer, vocabulary, and meaning.
- Child action: read a controlled phrase, sentence, or short passage and use its information to alter a scene or make a defensible story choice.
- Game state: exact text version, decodability record, high-frequency-word declarations, evidence-bearing question or explicitly non-assessed narrative choice, persistent consequence.
- Not allowed: marking every response correct while presenting the choice as comprehension evidence.

Each chapter combines these powers differently and may add chapter-specific physical expression, but it must not reimplement their educational contracts.

## 5. Twenty required improvements

### SS-01: World-repair progression

Every expedition has a visible problem and persistent repair. Stars, Sparks, and collectibles may celebrate play but are not the primary purpose. Demonstrated practice repairs landmarks, changes routes, deepens resident relationships, adds field-journal entries, or unlocks noncompetitive traversal/customization abilities.

Acceptance:

- Every chapter declares at least five persistent world-state beats.
- The map and return visit show completed repairs.
- No stop's primary payoff is only currency, confetti, or a collected sprite.

### SS-02: Six genuine literacy systems

Implement the six Sound Powers in section 4.2 as separate, testable state machines with shared rendering adapters. Chapter recipes configure them; they do not reduce them to the generic collision-choice controller.

Acceptance:

- Each system exposes its own initial state, valid inputs, transitions, correction hooks, completion, and resume representation.
- Behavioral tests demonstrate that the six systems cannot all be completed through the same input sequence.
- Secondary encounters use an authored power configuration rather than automatically falling back to generic families.

### SS-03: Persistent Word Workbench

Build a single shared workbench used by the new runtime's full-scene and simplified accessible presentations.

Required visible state:

- target picture or meaning animation still;
- whole-word replay control;
- one box per authored sound/grapheme unit;
- highlighted current box;
- previously placed graphemes retained;
- a stable rack with every needed physical tile and audited decoys;
- duplicate tiles for repeated graphemes;
- final sweep/blend and spoken-word payoff.

Acceptance fixtures: `hot`, `ship`, `moon`, `cake`, and `pop`.

### SS-04: Independent blending and segmenting

Word Forge plays the whole word once and does not pre-say the next answer. Blend Bridge exposes the graphemes and requires a blend-to-meaning action after activation. Isolated next-sound audio appears only as a recorded scaffold after a miss.

Acceptance:

- Whole-word audio plays once on entry unless replayed by the child.
- No answer-phoneme cue occurs before the first independent attempt at a position.
- A scaffolded position is never stored as independent.
- Word-level success requires every required position or final blend decision to meet its stated rule.

### SS-05: Authored expedition structure and Wonder moments

Replace loosely repeated trail encounters with the expedition loop. Each biome owns level topology, a chapter mechanic emphasis, a curriculum-linked Wonder moment, and a boss/culmination that transfers rather than merely repeats.

Acceptance:

- All 40 stops have authored arrival, teach, use, deepen/transfer, payoff, and resume metadata.
- All eight chapters have distinct topology and at least one Wonder moment whose animation represents the literacy construct.
- Bosses contain controlled novel application, not faster repetition.

### SS-06: Replay and motor assistance

Replay may remix audited words, object placement, resident requests, discovery paths, and distractor order while holding the target invariant. Motor assistance is configured separately from learning difficulty.

Acceptance:

- Deterministic seeds produce reproducible variants and balanced answer positions.
- Auto-travel, extended response, simplified scenery, no-damage travel, and slower movement never reveal or narrow the literacy answer.
- Touch, keyboard, switch-compatible focus, and pointer paths reach every required action.

### SS-07: Pronunciation-aware word lexicon

Create one canonical record per live word. The record is the authority for sound boxes, audio, decodability, examples, distractor legality, and reporting.

Minimum record:

```js
{
  word: "ship",
  units: [
    { grapheme: "sh", soundKey: "sh" },
    { grapheme: "i", soundKey: "short_i" },
    { grapheme: "p", soundKey: "p" }
  ],
  pronunciation: "ship",
  meaningId: "ship-vessel",
  image: "/...",
  taughtAt: ["s..."],
  tags: ["decodable"]
}
```

The shipping lexicon explicitly represents voiced/unvoiced `th`, `/ju:/` and `/u:/` values of `ew`, suffix `-s` and `-ed` allomorphs, soft `c/g`, split digraphs, multi-letter graphemes, and approved schwa/context exceptions.

Acceptance:

- Every runtime word has exactly one valid authored record.
- Integrity checks reject spelling-derived fallback for shipping content.
- Every sound key resolves to approved instructional audio or an explicit release-blocking status.

### SS-08: Teach every target before scoring

Every production presentation iterates the full stop teach sequence. Teach events are unscored and ordered before any scored encounter using the target.

Acceptance:

- No scored target can appear before its teach event in a fresh journey.
- Every teach event has reviewed text, recorded audio, child label, grapheme display, anchor image, and worked example.
- Review targets already taught in an earlier stop do not replay the full introduction unless the adaptive director selects reteach.

### SS-09: Per-literacy-action evidence

Create an immutable event model recorded when the literacy decision occurs.

Minimum event:

```js
{
  id,
  target,
  domain,
  correct,
  supportLevel,
  cueDelivery,
  confusion,
  word,
  position,
  mechanic,
  journeyStep,
  at,
  evidenceKind: "practice"
}
```

Motor, destination, animation, collection, travel, timing, and decorative events use a separate interaction channel and cannot enter mastery calculation.

Acceptance:

- Earlier assisted positions cannot be batch-credited by a later independent action.
- Muted or failed audio cannot count as audio-dependent evidence.
- Progress merge preserves concurrent bounded evidence histories without manufacturing internally inconsistent totals.

### SS-10: Real evidence domains and one mastery authority

Replace shell-name diversity with instructional domains:

- `phoneme_to_grapheme`
- `grapheme_to_phoneme`
- `word_decoding`
- `word_segmentation_encoding`
- `connected_text_transfer`
- `heart_word_mapping`
- `novel_decoding`

`questMastery.js` remains the single numeric authority. Documentation and matrices import or describe its exact values without maintaining conflicting copies.

Acceptance:

- Two reskins of phoneme-to-grapheme selection cannot satisfy diversity.
- Every reportable target type has at least two legitimate evidence paths or is explicitly marked exposure-only.
- Practice evidence cannot set formal assessment status.

### SS-11: Confusion-aware adaptive director

Record selected-versus-intended confusions and use recent evidence to choose the next audited contrast, support level, and review activity. Distractors declare rationale and belong to the same instructional comparison family.

Acceptance:

- No answer is uniquely revealed by length, punctuation, capitalization, visual treatment, or tile shape unless that feature is the taught contrast.
- Choice position is balanced over deterministic seed samples.
- The teacher-facing next action names the construct and confusion, not time played or coins earned.

### SS-12: Specific correction ladder

The shared correction system produces:

1. first miss: name the selected response and replay the relevant contrast;
2. second miss: isolate the important sound or word position and reduce irrelevant load;
3. third miss: model once, then require a fresh supported attempt;
4. later review: serve the same construct in another legitimate evidence domain.

Acceptance:

- Full-scene, simplified-scene, audio, visible text, and stored support level use the same correction record.
- The correct answer never silently fails.
- Wrong answers preserve the problem and never remove earned progress.

### SS-13: Exact instruction and audio contract

Every stage declares one instruction contract:

```js
{
  instructionId,
  childText,
  childAudio,
  cue,
  expectedAction,
  recordsDomain,
  silenceIsIntentional
}
```

Spoken instruction, visible instruction, semantic control labels, actual action, and evidence domain agree. Cue delivery distinguishes unavailable, loading, started, completed, interrupted, and failed. Music ducks for instructional audio. Internal IDs map to child-friendly labels and examples and never render directly.

Acceptance:

- Semantic tests reject instruction/action mismatch.
- An underscore-bearing internal target cannot reach child text.
- Rhythm may animate or celebrate but never decides literacy correctness.

### SS-14: Complete heart-word journey

All 60 declared heart words enter a persisted no-repeat introduction and review deck. Each record declares pronunciation, regular parts, irregular heart part, meaning, introduction stop, and eligible contexts.

Acceptance:

- All 60 are served within a bounded, specified number of eligible visits.
- Every due `hw:` target resolves to an actual encounter.
- Recognition, heart-part mapping, encoding, and sentence use remain separate evidence types.

### SS-15: Connected-text transfer and reachable stories

Add illustrated decodable micro-scenes at least every two or three stops. Story content must be reachable on a normal first visit unless explicitly optional and discoverable. Every running word is in the pronunciation lexicon or separately declared high-frequency vocabulary.

Acceptance:

- All authored story pages are reachable.
- All assessed story choices have one defensible text-supported answer.
- Non-assessed narrative choices are labelled and stored as narrative, not mastery.
- Transfer difficulty grows from phrase to sentence to short passage across the route.

### SS-16: Meaning, vocabulary, and resident relationships

Decoded or encoded words cause short meaning animations or meaningful object actions. Residents remember earlier help and request later transfer. Advanced vocabulary receives reviewed meaning art, oral explanation, age metadata, and ELL support without leaking the answer.

Acceptance:

- Every Word Forge and Blend Bridge bank has an approved meaning reference.
- Each chapter has a cast arc tied to literacy use rather than exposition alone.
- Controlled imaginary boss names are clearly announced as imaginary and scored separately as `novel_decoding`.

### SS-17: Monotonic review and content coverage

Persist a monotonic `journeyStep` independent of the 1-40 location cursor. Review due dates, retirement gaps, coverage queues, and recency weights use this ordinal or explicit time, never wrapped stop subtraction.

Acceptance:

- A target last seen at stop 39 becomes due after the required number of later activities across the wrap.
- Recent/decayed accuracy drives priority; lifetime totals remain reporting context.
- Alternative-pronunciation sorts, morphology, heart words, stories, and transfer content each have bounded coverage tests.

### SS-18: Eight coherent 2D biome kits

The production visual language is a hand-painted, shape-led 2D adventure style with restrained texture, readable silhouettes, warm material depth, and character animation that remains compatible with low-power devices. Pixel-era source assets may remain only where they are deliberately restyled or framed as one coherent system.

Each chapter kit declares:

- unique full-screen background and route topology;
- palette and lighting direction;
- foreground, midground, and background layers;
- route material;
- five persistent landmarks;
- resident set;
- interactable prop family;
- collectible and reward family;
- task-camera composition;
- reduced-motion and simplified-scene variants.

Acceptance:

- No unrelated or duplicate full-screen background is used across chapter identities.
- Semantic screenshot review confirms that Forge reads as a forge, Storm Coast as a coast, and so on without relying on text labels.
- Interactables keep the strongest local contrast and are never hidden by scenery.

### SS-19: Unified cast, HUD, animation, and game feel

Gameplay avatar, creator, residents, rewards, map, and task closeups share one proportion, outline, palette, and material language. The HUD becomes a diegetic trail tool rather than a cream quiz modal.

Required feedback vocabulary:

- anticipation before a meaningful action;
- visible contact and state change;
- squash/stretch or equivalent pose change;
- resident eyeline and reaction;
- phoneme ripple or word-assembly effect;
- restrained particles and material sound;
- reduced-motion replacement using opacity, outline, and clear final state.

Acceptance:

- All primary controls meet the 56 CSS-pixel target contract.
- Game state remains readable at 320 CSS pixels and 200% zoom.
- Creator previews match the in-world character rather than showing a different rendering language.

### SS-20: Product-truth release gate

Replace static-source proxies with behavioral and human evidence where the requirement is experiential.

Automated minimum:

- full unit suite;
- quest integrity, pacing, art, SFX, music, offline, and route checks;
- browser behavior for all six powers;
- word-workbench fixtures and red/green evidence integrity;
- exact instruction and audio state;
- all-content coverage;
- chapter semantic art checks;
- touch, keyboard, pointer, switch/focus, reduced motion, simplified scene, extended response, 320 CSS pixels, 200% zoom, and offline resume;
- build and lint/type/static checks used by the repository release workflow.

Direct gates kept separate:

- human listening approval for instructional audio and material sound balance;
- direct visual review of every chapter and major state;
- physical iPad Safari testing;
- assistive-technology testing where required;
- observed child comprehension/playability sessions;
- authenticated hosted verification;
- deployment and production-operation verification.

Automation may not claim these direct gates passed.

## 6. State and migration design

### 6.1 Save version

The rebuilt Sound Seekers state uses `v: 2` as a new game contract. Because there is no live child progress, `v: 1` gameplay progress, checkpoints, mastery, rewards, and encounter state do not constrain the new design. The normalizer must fail safely when it encounters an old record, but it may start a fresh v2 adventure instead of translating invalid legacy evidence.

App-level accessibility preferences and an explicit teacher practice assignment may be imported when their current shape is still valid. No hosted row is destructively deleted as part of migration; obsolete quest fields are ignored by the v2 normalizer until normal forward writes replace them.

New persisted fields:

```js
{
  v: 2,
  trail: {
    ...existingTrail,
    journeyStep: 1,
    repairs: {},
    chapterCoverage: {}
  },
  evidence: [],
  confusions: {},
  contentDecks: {
    heartWords: {},
    stories: {},
    alternatives: {}
  },
  journal: {
    words: [],
    scenes: [],
    stickers: []
  }
}
```

Evidence is bounded and mergeable. Derived rewards remain derived; repair ownership is monotonic. Checkpoints remain resume state rather than achievement.

### 6.2 Merge rules

- Only v2 records participate in v2 evidence, repair, journal, and coverage merges.
- A v1/v2 collision resolves to the v2 record for game-owned state without manufacturing translated mastery.
- Reset ancestry continues to outrank stale forward progress after the first v2 write.
- Monotonic v2 achievements union or take maxima as appropriate.
- Bounded evidence histories merge by immutable event id, then sort and truncate deterministically without reconciling counters from a different history.
- Confusion counts derive from merged evidence or merge by event id, not independent maxima that can double-count.
- Local valid checkpoint ownership remains unchanged.
- Motor/interactions and private telemetry do not enter the hosted mastery payload unless already permitted by the release bible.

### 6.3 Checkpoint rules

Every power serializes only the minimum resumable state needed to restore the exact safe learning step. A restored step retains placed tiles and non-answer state but does not replay a previous correct response as fresh evidence.

## 7. Module boundaries

The implementation plan may refine filenames after current-source verification, but responsibilities remain separate.

### Curriculum and content

- `src/data/questPronunciationLexicon.js`: canonical word and sound-unit records.
- `src/data/questInstructionContracts.js`: child text/audio/action contracts.
- `src/data/questExpeditions.js`: authored 40-stop expedition beats and persistent repairs.
- `src/data/questConnectedText.js`: controlled text, vocabulary, meaning, and story consequences.
- `src/data/questBiomeKits.js`: eight visual kit manifests and semantic identity.

### Pure learning systems

- `src/utils/questEvidence.js`: immutable evidence events, bounded ledgers, and domain eligibility.
- `src/utils/questLearningDirector.js`: confusion-aware selection, coverage queues, and support decisions.
- `src/utils/questWordWorkbench.js`: Word Forge state machine.
- `src/utils/questSoundPowers.js`: shared power registry and contracts.
- `src/utils/questJourneyClock.js`: monotonic progression/review ordinal.
- Existing `questMastery.js` and `questReviewScheduler.js`: numeric mastery and scheduling, updated to consume domains and journey ordinals.

### Runtime systems

- `src/components/quest/SoundSeekersGame.jsx`: the sole production child-game orchestrator under the existing app route boundary.
- `src/components/quest/world/QuestWordWorkbench.jsx`: accessible DOM workbench synchronized with the canvas world.
- `src/components/quest/world/powers/*.js`: six focused runtime/state adapters.
- `src/components/quest/world/questBiomeRuntime.js`: layered scene, repairs, target salience, reduced-motion/simplified variants.
- `src/components/quest/world/questGameRuntime.js`: renderer/input lifecycle; learning state is not calculated inside collision code.

`QuestPixelWorld.jsx`, `QuestTrail2D.jsx`, `questPixelRuntime.js`, the legacy `QuestHub.jsx`, and their directly owned obsolete assets are migration sources only. They are removed once the new runtime supplies production, simplified, reduced-motion, low-power, and accessible interaction modes through one shared game contract.

Large existing files should be split only along these responsibility boundaries. The rebuild must not migrate React, Vite, the storage provider, or the wider app framework. It may replace the current game-rendering strategy if the replacement remains local, dependency-reviewed, offline-capable, accessible, and demonstrably simpler than retaining three gameplay runtimes.

## 8. Art and asset production

### 8.1 Art direction

One visual language governs the full product:

- rounded, readable silhouettes;
- painted 2D surfaces with restrained texture and consistent upper-left lighting;
- deep but quiet environments, with high-contrast interaction plates;
- warm natural materials rather than generic neon or purple-blue effects;
- expressive child-safe residents with clear faces and poses;
- no text baked into generated raster art;
- no logos, watermarks, or third-party character imitation.

### 8.2 Asset strategy

1. Reuse approved project-authored assets when they meet the new style and semantic contract.
2. Generate or author missing biome backdrops and large scene elements as project-bound raster assets.
3. Prefer code-native shapes, particles, masks, and accessible text for interactive controls and grapheme plates.
4. Preserve source/provenance notes for every added raster asset.
5. Inspect every generated asset at full resolution and in the actual game crop before shipping.
6. Do not retain rejected variants in the repository.

### 8.3 Required biome identities

- Seedwake Meadow: waking seed lanterns, soft dawn pasture, living hedges, warm wood.
- River Gardens: water channels, garden terraces, sluices, reeds, ceramic markers.
- Fossil Canyon: layered sandstone, excavation shelves, ancient tracks, amber light.
- Forge Settlement: working furnaces, copper/iron machines, dark stone, ember light.
- Glass Marsh: reflective pools, glass reeds, mist, refracted paths, cool jade light.
- Storm Coast: cliffs, sea spray, wind instruments, shelter structures, storm-to-clear progression.
- Lantern Forest: deep layered woods, hanging lantern paths, living maps, moss and gold.
- Star Reach: high observatory, comet stairs, night sky, readable celestial mechanisms, indigo and warm starlight.

## 9. Content and language rules

- Child instructions use short spoken sentences and visible icons/text; no internal curriculum identifiers.
- Grapheme labels use approved child-facing language and examples.
- Decodable text uses only lexicon words supported at that point plus explicitly declared heart words.
- Advanced vocabulary receives oral meaning support and reviewed art.
- Meaning art must not leak the answer when the task measures decoding rather than vocabulary.
- Imaginary words are announced as imaginary names and never presented as ordinary vocabulary.
- US/UK audio variants must remain internally consistent within a learner path; one path may not mix them accidentally.
- No open-ended child sharing or unrestricted child-authored public text is added.

## 10. Reporting and privacy

Teacher evidence reports may show:

- construct and target;
- evidence domain;
- independent versus supported response;
- recent confusion pair;
- word/position where useful;
- connected-text or novel-transfer status;
- next teaching action.

They must not present travel time, play duration, Sparks, cosmetics, collisions, or reaction speed as mastery. Child-identifying data is not added to local artifacts or visual evidence. The rebuild adds no new public sharing or advertising.

## 11. Rollout and compatibility

### Phase A: correctness foundation

- pronunciation lexicon;
- evidence ledger and domain mastery;
- audio/instruction truth;
- monotonic journey/review clock;
- teach-all-targets;
- heart-word and story coverage.

### Phase B: gold Seedwake implementation

- six power systems represented across the chapter;
- persistent Word Workbench;
- new biome/runtime contract;
- unified avatar/residents/HUD;
- persistent repairs, journal, rewards, Wonder moment, and boss transfer;
- complete browser/accessibility/offline proof for the chapter.

### Phase C: chapters two through eight

- migrate authored expeditions and secondary encounters;
- create all biome kits and chapter casts;
- add connected text, meaning moments, coverage queues, and bosses;
- verify semantic identity and child-facing instruction at every stop.

### Phase D: release hardening and cleanup

- full automated and direct evidence matrix;
- remove obsolete Pixel, fallback, and Three.js game code/assets after reference and route-replacement verification;
- update release docs and source manifests;
- scoped commits, rebase/fetch safety check, and push to `origin/main`.

The implementation may use smaller independently reviewed commits, but no phase is the final product by itself.

## 12. Definition of done

The rebuild is complete only when:

1. All twenty `SS-*` requirements have a committed implementation and named verification evidence.
2. All forty stops use the new instruction/evidence contract and authored expedition metadata.
3. All eight chapters have semantically correct, coherent biome kits and reviewed child-facing major states.
4. The Word Workbench works for single letters, digraphs, split digraphs, repeated letters, and contextual pronunciation fixtures.
5. Every scored target is taught first and every evidence event truthfully represents the child's action and support.
6. All 60 heart words, all authored story pages, all alternative-pronunciation content, and all required review targets are reachable within their bounded coverage rules.
7. Practice evidence remains practice in storage, reports, export, and UI.
8. Unit, integrity, browser, offline, accessibility, visual-semantic, build, and release checks pass from a clean checkout.
9. Human listening, physical-device, observed-child, authenticated-hosted, deployment, and production-operation gates are reported separately and are never fabricated by automation.
10. Temporary files and rejected/superseded outputs created by this rebuild are removed.
11. The final diff contains only Sound Seekers and directly required shared-boundary changes; obsolete Sound Seekers runtimes and assets have been removed rather than retained as permanent legacy paths.
12. The completed, verified commits are pushed to `origin/main` as the user requested.
